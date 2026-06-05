---
title: Transactional Outbox
description: Reliably publish events by writing them in the same DB transaction as the business change.
tags: [concept, concurrency, reliability]
category: tech-concepts
status: draft
---

# Transactional Outbox

::: details Q: What is the dual-write problem?
When a service writes to its database and then publishes an event to a broker, those two operations are not atomic. If the broker publish fails after the DB commit, you have a committed change with no event — silent data divergence. If you publish first and then the DB write fails, downstream consumers act on a phantom event. There is no way to atomically span two heterogeneous systems without a distributed protocol, and [2PC](./two-phase-commit) is too expensive in availability cost for this case.
:::

::: details Q: How does the Transactional Outbox pattern solve the dual-write problem?
The service inserts the event into an `outbox` table in the **same local database transaction** as the business change. Both rows share one ACID commit — either both land or neither does. A relay process (poller or CDC consumer) reads undelivered outbox rows and publishes them to the broker, marking each row delivered after acknowledgement.

```sql
BEGIN;
  INSERT INTO orders (id, customer_id, total) VALUES ($1, $2, $3);
  INSERT INTO outbox (aggregate_id, event_type, payload, sent)
    VALUES ($1, 'OrderCreated', $4, false);
COMMIT;
```

The key insight: you turn a cross-system atomicity problem into a within-system ordering problem, which a single ACID database already solves.
:::

::: details Q: What delivery guarantee does the pattern provide, and what does that require of consumers?
**At-least-once**. The relay re-publishes any unacknowledged row on restart or after a crash, so duplicates are possible — and normal. Consumers must be [idempotent](./idempotency): they use the event's `id` or `aggregate_id + sequence` as a deduplication key, not just "did I see this event type before." A consumer that is idempotent-by-side-effect (e.g., INSERT … ON CONFLICT DO NOTHING) is more robust than one that checks a separate "processed" table.
:::

::: details Q: How does CDC relate to the Outbox pattern, and when does polling suffice?
Polling the outbox on a fixed interval is simple and requires no infrastructure beyond a cron-like loop, but it adds latency proportional to the poll interval (often 1–30 s) and generates steady SELECT load. [CDC](./change-data-capture) tails the database transaction log and fires the relay the moment a row is committed — typically sub-100 ms end-to-end. Prefer CDC when publish latency matters or outbox row volume is high. Prefer polling when simplicity is the priority, event volume is low, or your DB doesn't expose a log cleanly.
:::

::: details Q: What are the failure modes you must operate against?
- **Relay lag**: If the relay falls behind (slow broker, consumer backpressure), outbox rows accumulate. Monitor relay lag and unsent-row count; alert before it grows unbounded.
- **Poison messages**: A malformed payload that the broker rejects will block the relay indefinitely. Build a dead-letter path — move permanently-failing rows to a separate table after N retries.
- **Ordering within an aggregate**: A single-threaded relay preserves insertion order per aggregate. Multiple parallel relay workers can reorder events across aggregates; if per-aggregate ordering is required, partition relay workers by `aggregate_id`.
- **Exactly-once illusion**: The pattern is at-least-once on both sides. Consumers that skip idempotency get duplicated side effects. The outbox does not eliminate duplicates — it shifts the problem to the consumer, where it belongs.
- **Table bloat**: Sent rows must be purged. A background job that deletes rows older than the broker's retention window (e.g., rows where `sent = true AND updated_at < now() - interval '7 days'`) keeps the table lean.
:::

::: details Q: When should you use the Outbox pattern instead of alternatives?
Use Outbox when you need reliable event publishing from a service that already owns an RDBMS. It is the lowest-overhead path to at-least-once delivery without a distributed transaction.

Do **not** reach for it when: (a) your service has no database and only calls external APIs — the outbox has nothing to be atomic with; (b) your message volume is so high that the extra write adds meaningful DB pressure — at that scale, event sourcing or a write-ahead log as the primary store may be a better fit.
:::

## Common follow-ups

- How do you handle ordering guarantees when the relay has multiple workers?
- Polling vs. CDC relay — what are the failure modes of each, and how do you operate them?
- How do you prevent the outbox table from growing indefinitely?
- How does the Saga pattern use the Outbox to coordinate multi-service workflows?
