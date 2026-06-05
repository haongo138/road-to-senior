---
title: Saga Pattern
description: Coordinate multi-service business transactions using local transactions and compensating actions.
tags: [concept, concurrency, distributed-transactions]
category: tech-concepts
status: draft
---

# Saga Pattern

> **Q: What problem does the Saga pattern solve?**

A business transaction that spans multiple services (e.g., reserve inventory → charge payment → create shipment) cannot be wrapped in a single ACID transaction because each service owns its own database. Without coordination, a failure mid-way leaves the system in a partially applied state. The Saga pattern provides a structured way to manage such multi-step workflows without requiring a distributed transaction.

> **Q: What is a Saga?**

A Saga is a sequence of **local transactions**, one per participating service. Each step publishes an event or sends a command to trigger the next step. If any step fails, previously completed steps are undone by executing their **compensating transactions** in reverse order. Compensations must be defined up front for every step that can be rolled back.

> **Q: What is the difference between choreography and orchestration in a Saga?**

**Choreography**: Each service listens for events from the previous step and reacts by executing its local transaction and emitting a new event. There is no central coordinator — services are loosely coupled, but the overall flow is implicit and harder to trace as the number of services grows.

**Orchestration**: A dedicated **orchestrator** (a workflow service or state machine) explicitly commands each participant service in sequence, waits for responses, and drives compensations on failure. The flow is explicit and observable in one place, but the orchestrator becomes a central point of logic.

> **Q: How do Sagas handle isolation? What risks does the lack of ACID isolation create?**

Sagas do **not** provide full ACID isolation. Intermediate states are visible to other transactions while a Saga is in progress. This can cause dirty reads across services. Mitigations include:

- **Semantic locks**: mark a record as "pending" so other operations know to wait or fail fast.
- **Commutative updates**: design operations so their order does not affect the final result.
- **Pivot transactions**: identify the point of no return and build compensations only for pre-pivot steps.

> **Q: When would you choose a Saga over Two-Phase Commit (2PC)?**

Choose a Saga when services own separate databases and you need availability over strong consistency. [2PC](./two-phase-commit) provides true atomicity but blocks if the coordinator crashes and reduces throughput under high contention. Sagas trade ACID isolation for availability and resilience, which is the right trade-off for most microservice architectures. Use 2PC only when participating resources support it (e.g., same RDBMS or XA-capable systems) and blocking is acceptable.

> **Q: How does the Outbox pattern relate to Sagas?**

Each Saga step typically uses the [Transactional Outbox](./outbox) to reliably emit the event or command that triggers the next step. Without the Outbox, the local transaction and the message publish are a dual-write, which can silently drop messages and stall the Saga.

## Common follow-ups

- How do you implement a compensating transaction for a payment that has already settled?
- How do you observe or debug a choreography-based Saga in production?
- What happens if a compensation itself fails — how do you handle "stuck" Sagas?
- How does an orchestrator handle idempotency when it retries a failed step?
