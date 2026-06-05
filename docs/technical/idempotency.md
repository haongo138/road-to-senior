---
title: Idempotency Keys
description: Make unsafe operations safe to retry with client-supplied keys.
tags: [concept, reliability, api]
category: tech-concepts
status: draft
---

# Idempotency Keys

> **Q: What problem do Idempotency Keys solve?**

In distributed systems, networks are unreliable. A client may send a request, receive no response (timeout or network drop), and not know whether the server executed the operation. Retrying a non-idempotent operation (e.g., charging a payment) without coordination risks duplicating the side effect. Idempotency keys allow clients to retry safely: the server executes the operation exactly once regardless of how many times the same request arrives.

> **Q: How do Idempotency Keys work?**

The client generates a unique token (UUID or similar) and sends it as an `Idempotency-Key` request header. On first receipt, the server executes the operation and **stores the key together with the result**. On any subsequent request with the same key, the server returns the stored result without re-executing the operation. The key and outcome must be persisted in the **same transaction** as the business change — otherwise a crash between the write and the key-store leaves the system in an ambiguous state.

```go
// Pseudocode — within a single DB transaction
tx.Exec("INSERT INTO payments (...) VALUES (...)")
tx.Exec("INSERT INTO idempotency_keys (key, response) VALUES ($1, $2)", key, result)
tx.Commit()
```

> **Q: What are the storage and TTL concerns for idempotency keys?**

Keys must be stored durably (not just in-memory cache) so they survive server restarts. A TTL is needed to prevent unbounded growth — typically 24 hours to 7 days, chosen to be longer than the client's retry window. Expiring a key before the client stops retrying can cause the operation to execute again. The TTL policy must be communicated to API consumers.

> **Q: How does idempotency relate to at-least-once delivery?**

Message brokers and the [Transactional Outbox](./outbox) pattern both provide **at-least-once delivery** — a consumer may receive the same event more than once. Idempotent consumers handle this by checking whether they have already processed a given message ID or event ID before acting. The same idempotency-key mechanism (store the processed ID + outcome, skip re-processing on duplicate) applies to consumers just as it does to HTTP APIs.

> **Q: How do you handle concurrent duplicate requests (the "thundering herd" case)?**

If two requests with the same idempotency key arrive simultaneously (before the first has stored its result), both may attempt to execute the operation. The server must use a database-level unique constraint or advisory lock on the key to serialize concurrent requests. The second request should block or return a `409 Conflict` until the first completes and stores its result.

> **Q: Which HTTP methods require idempotency keys and which are naturally idempotent?**

GET, HEAD, OPTIONS, and DELETE are defined as idempotent by HTTP semantics (repeating them has no additional effect). PUT is idempotent if it is a full replacement. POST is non-idempotent by default — charging payments, creating orders, or sending emails via POST are the primary use cases for an explicit `Idempotency-Key` header. PATCH is typically non-idempotent (increments, appends) and also benefits from explicit keys.

## Common follow-ups

- How do you generate a good idempotency key on the client — what properties must it have?
- What happens if two different clients happen to use the same key? How do you namespace keys per client?
- How do you test idempotency in an integration test suite?
- How does the Stripe or PayPal idempotency-key API compare to implementing your own?
