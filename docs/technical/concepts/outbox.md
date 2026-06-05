---
title: Transactional Outbox
description: Reliably publish events by writing them in the same DB transaction as the business change.
tags: [concept, concurrency, reliability]
category: tech-concepts
status: draft
---

# Transactional Outbox

> **Q: What is the dual-write problem?**

When a service must both persist a business change to the database and publish an event to a message broker, neither operation is aware of the other. If the DB write succeeds but the broker publish fails (or vice versa), the system is left in an inconsistent state — you cannot atomically span two different systems without a distributed transaction.

> **Q: How does the Transactional Outbox pattern solve the dual-write problem?**

Instead of publishing directly to the broker, the service inserts the event into an `outbox` table in the **same local database transaction** as the business change. Because both writes share a single ACID transaction, they either both succeed or both roll back. A separate relay process (a poller or a CDC consumer) then reads uncommitted outbox rows and publishes them to the broker, marking each row as sent once acknowledged.

```sql
BEGIN;
  INSERT INTO orders (id, customer_id, total) VALUES ($1, $2, $3);
  INSERT INTO outbox (aggregate_id, event_type, payload, sent)
    VALUES ($1, 'OrderCreated', $4, false);
COMMIT;
```

> **Q: What delivery guarantee does the Outbox pattern provide, and what does that require of consumers?**

The relay re-publishes any unsent row on restart or failure, so delivery is **at-least-once** — a consumer may receive the same event more than once. Consumers must therefore be **idempotent**: processing the same event multiple times must produce the same result as processing it once (see [Idempotency Keys](./idempotency)).

> **Q: How does Change Data Capture (CDC) relate to the Outbox pattern?**

Instead of polling the outbox table on a timer, the relay can use [CDC](./change-data-capture) to tail the database's transaction log (WAL/binlog). CDC detects new outbox rows the instant they are written, giving lower latency than polling, and avoids the need for a dedicated polling loop in the application.

> **Q: What are the main trade-offs of the Transactional Outbox pattern?**

- **Polling latency**: Timer-based pollers introduce publish delay; CDC reduces this.
- **Extra table and relay process**: More schema and operational complexity.
- **Ordering**: Within a single aggregate the outbox naturally preserves insertion order, but cross-aggregate ordering depends on relay parallelism.
- **Cleanup**: Sent rows must be purged to prevent unbounded table growth.

> **Q: When should you use the Outbox pattern instead of dual-write or distributed transactions (2PC)?**

Use the Outbox when you need reliable event publishing without a distributed transaction. Dual-write is unsafe (no atomicity). [2PC](./two-phase-commit) provides atomicity but blocks on coordinator failure and reduces availability. The Outbox achieves reliability through idempotency + at-least-once delivery, which is sufficient for the vast majority of microservice messaging needs.

## Common follow-ups

- How do you handle ordering guarantees when the relay has multiple workers?
- How would you implement the relay — polling vs. CDC, and what are the failure modes of each?
- How do you prevent the outbox table from growing indefinitely?
- How does the Saga pattern use the Outbox to coordinate multi-service workflows?
