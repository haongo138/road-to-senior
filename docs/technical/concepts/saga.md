---
title: Saga Pattern
description: Coordinate multi-service business transactions using local transactions and compensating actions.
tags: [concept, concurrency, distributed-transactions]
category: tech-concepts
status: draft
---

# Saga Pattern

> **Q: What problem does the Saga pattern solve?**

A business workflow spanning multiple services — reserve inventory → charge payment → create shipment — cannot be wrapped in a single ACID transaction because each service owns its own database. A failure mid-way leaves the system partially applied, with no built-in rollback mechanism. [2PC](./two-phase-commit) could enforce atomicity, but it blocks on coordinator failure and kills throughput under contention. Sagas coordinate the workflow without a distributed lock: each step commits locally and the Saga handles failure by running compensating actions.

> **Q: What is a Saga?**

A Saga is a sequence of **local transactions**, one per participating service. Each step publishes an event or sends a command to trigger the next step. If step *N* fails, the Saga runs compensating transactions for steps *N-1* through *1* in reverse. Every step that can fail must have a defined compensation, and that compensation must itself be idempotent and retryable — a compensation that can fail is just another failure mode you haven't handled yet.

> **Q: Choreography vs. orchestration — when does each make sense?**

**Choreography**: Each service listens for events and reacts autonomously. No central coordinator; services are loosely coupled. Works well for simple linear flows (3–4 services). As complexity grows the implicit flow becomes unobservable — debugging a stuck Saga requires reconstructing state from events across multiple services' logs.

**Orchestration**: A dedicated orchestrator (state machine or workflow engine like Temporal, Conductor, or AWS Step Functions) commands each participant in sequence, tracks state explicitly, and drives compensations on failure. The flow is visible in one place and retries are centrally managed. Cost: the orchestrator becomes a shared-state dependency that all participants couple to.

For production systems with more than ~4 services or non-linear flows (fan-out, conditional branches), orchestration almost always wins on operability.

> **Q: How do Sagas handle isolation? What risks does the lack of ACID isolation create?**

Sagas provide **no inter-saga isolation**. While a Saga is in progress, intermediate state is committed locally and visible to concurrent requests. This enables several anomalies:

- **Dirty reads across services**: A second Saga reads inventory "reserved" by a first Saga that later compensates. The second Saga acts on data that no longer holds.
- **Lost updates**: Two concurrent Sagas both read the same balance and both decrement it — one deduction is silently lost.
- **Compensation cascades**: If a compensation fails (e.g., the payment provider rejects the refund API call), the Saga gets stuck in a partially-compensated state. You need a retry strategy, a dead-letter mechanism, and probably a human-in-the-loop alert.

Mitigations:
- **Semantic locks**: mark records as "pending" at step 1; other operations observe the lock and either wait or fail fast.
- **Commutative updates**: design steps so order of application does not affect the final result, making concurrency safe.
- **Pivot transactions**: the point of no return — build compensations only for pre-pivot steps; post-pivot steps are expected to succeed or retry forward.

> **Q: When would you choose a Saga over 2PC?**

Almost always in a microservices architecture. [2PC](./two-phase-commit) requires participants to hold locks across a network round-trip, blocks if the coordinator crashes, and is unavailable to any service running its own database. Sagas trade ACID isolation for availability and horizontal scalability — the right trade-off when each service owns its data.

Reach for 2PC only when all participants are XA-capable resources in a controlled environment (same data center, reliable network) and the consistency requirement is so strict that you cannot accept even momentary partial state. That scenario is increasingly rare.

> **Q: How does the Outbox pattern relate to Sagas?**

Each Saga step should use the [Transactional Outbox](./outbox) to emit the event or command that triggers the next step. Without the Outbox, the local DB write and the broker publish are a dual-write: if the publish fails after the commit, the Saga stalls with no retry mechanism. With the Outbox, the relay guarantees at-least-once delivery of the trigger, and each step's idempotency key prevents double execution on retries.

## Common follow-ups

- How do you implement a compensating transaction for a payment that has already settled with a third-party processor?
- How do you observe or debug a choreography-based Saga in production when a step silently drops an event?
- What happens if a compensation itself fails — how do you handle "stuck" Sagas and when do you escalate to a human?
- How does an orchestrator handle idempotency when it retries a failed step command?
