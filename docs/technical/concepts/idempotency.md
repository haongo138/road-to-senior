---
title: Idempotency Keys
description: Make unsafe operations safe to retry with client-supplied keys.
tags: [concept, reliability, api]
category: tech-concepts
status: draft
---

# Idempotency Keys

::: details Q: What problem do Idempotency Keys solve?
Networks fail ambiguously. A client sends a request, receives a timeout, and cannot tell whether the server executed the operation or not. Retrying a non-idempotent operation — charging a card, placing an order, sending a confirmation email — without coordination risks duplicating the effect. Idempotency keys give the server the information it needs to de-duplicate: the client attaches a unique token, and the server uses it to recognize and return a cached result for repeat requests.

The problem is not rare. At 99.9% reliability, one request in a thousand gets an ambiguous timeout. At scale that is thousands of duplicates per day without idempotency.
:::

::: details Q: How do Idempotency Keys work?
The client generates a stable unique token (UUID v4 or a content-hash of the request) and sends it as an `Idempotency-Key` header. On first receipt, the server executes the operation and **stores the key together with the result in the same transaction as the business change**. On subsequent requests with the same key, the server returns the stored result without re-executing.

```go
// Pseudocode — key and result stored atomically with the business change
tx.Exec("INSERT INTO payments (...) VALUES (...)")
tx.Exec("INSERT INTO idempotency_keys (key, response, created_at) VALUES ($1, $2, now())", key, result)
tx.Commit()
```

If the key is stored in a separate write after the business change (two-step write), a crash between the two leaves an executed-but-unrecorded operation — the next request re-executes it. The atomic write is not optional.
:::

::: details Q: What are the storage and TTL concerns?
Keys must be durable (not an in-memory cache) to survive restarts. TTL should exceed the client's retry window with margin — typically 24 hours to 7 days. Expiring a key while the client is still within its retry window causes the operation to re-execute on the next attempt.

Scope matters: keys must be namespaced per client (e.g., `(client_id, idempotency_key)` as the unique constraint). A key collision across two different clients is a correctness bug — Client A's key could return Client B's result or block Client B's write. Communicate the TTL and scoping rules in your API contract; clients that hold keys longer than the TTL must be told they'll get a new execution.
:::

::: details Q: How do you handle concurrent duplicate requests?
If two requests with the same key arrive before either has stored its result, both may race to execute the operation. The fix is a database-level unique constraint or advisory lock on `(client_id, key)`. The second request blocks until the first commits, then finds the stored result and returns it. Without this serialization, you get a race window where both execute and one result is silently discarded.

Return `409 Conflict` (or `200` with the cached result, per your API semantics) if the key is already in-flight. Do not return `5xx` for a normal race — it triggers client retries and makes the problem worse.
:::

::: details Q: How does idempotency relate to at-least-once message delivery?
[Transactional Outbox](./outbox) and [CDC](./change-data-capture) both provide at-least-once delivery — the same event may be delivered more than once. Consumers handle this identically to how APIs handle duplicate HTTP requests: use the event's `message_id` or `(aggregate_id, sequence_number)` as the idempotency key, store the processed state atomically with the result, and skip re-processing on duplicate delivery. The mechanism is the same; the transport differs.
:::

::: details Q: Which HTTP methods require explicit idempotency keys?
GET, HEAD, OPTIONS: naturally idempotent by definition — no keys needed.
DELETE, PUT (full replacement): idempotent by HTTP semantics — repeating them produces the same state.
POST: non-idempotent by default — creating resources, charging payments, sending notifications. Explicit `Idempotency-Key` is required for safe retry.
PATCH: typically non-idempotent (increments, appends) — also benefits from explicit keys.

One practical note: even DELETE is not always idempotent in practice. If your DELETE endpoint returns `404` on a missing resource, the second call returns a different response than the first. Whether that matters depends on your client's retry logic — worth explicitly documenting.
:::

## Common follow-ups

- How do you generate a good idempotency key on the client — what properties must it have (uniqueness, stability across retries)?
- What happens if two different clients happen to use the same key — how do you namespace keys per client?
- How do you test idempotency in an integration test suite — what failure scenarios are hardest to exercise?
- How does Stripe's idempotency-key implementation handle the key-in-flight race and what response does it return?
