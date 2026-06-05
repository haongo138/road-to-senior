---
title: Two-Phase Commit (2PC)
description: A distributed protocol that guarantees atomic commit or abort across multiple participants.
tags: [concept, concurrency, distributed-transactions]
category: tech-concepts
status: draft
---

# Two-Phase Commit (2PC)

> **Q: What is Two-Phase Commit and what does it guarantee?**

Two-Phase Commit (2PC) is a distributed consensus protocol that ensures all participating nodes either **all commit** or **all abort** a transaction — atomicity across multiple systems. It is coordinated by a single **coordinator** node and is supported by databases and XA-compatible resource managers.

> **Q: What are the two phases of 2PC?**

**Phase 1 — Prepare (Vote)**: The coordinator sends a `PREPARE` message to all participants. Each participant performs any work needed, persists enough information to commit or roll back later, and votes `YES` (ready to commit) or `NO` (must abort). If any participant votes `NO`, the coordinator aborts.

**Phase 2 — Commit (or Abort)**: If all votes are `YES`, the coordinator sends `COMMIT` to all participants, and each applies the transaction. If any voted `NO`, the coordinator sends `ABORT` and each participant rolls back.

> **Q: What is the critical weakness of 2PC?**

2PC is **blocking**: if the coordinator crashes after sending `PREPARE` but before sending `COMMIT` or `ABORT`, participants that voted `YES` are stuck holding locks indefinitely. They cannot safely commit (they don't know the final decision) or roll back (they already voted yes). Recovery requires manual intervention or waiting for the coordinator to restart. This makes 2PC unsuitable for high-availability systems.

> **Q: How does 2PC interact with the CAP theorem?**

2PC favors **Consistency over Availability**. During coordinator failure, the system is unavailable for the blocked participants. In distributed systems where network partitions are a reality (CAP theorem), this trade-off is often unacceptable, which is why microservices typically avoid 2PC in favor of eventual-consistency patterns like [Sagas](./saga) and the [Transactional Outbox](./outbox).

> **Q: What is Three-Phase Commit (3PC) and why is it rarely used?**

3PC adds an intermediate `PRE-COMMIT` phase between Prepare and Commit so participants can safely abort after a coordinator timeout — eliminating the blocking problem. However, 3PC is not safe under network partitions (it can split-brain commit), adds latency, and is complex to implement. In practice it is nearly never used; teams prefer Sagas or Paxos/Raft-based consensus for non-blocking distributed agreement.

> **Q: When is 2PC an appropriate choice?**

2PC is appropriate when all participants support XA transactions (e.g., two databases within the same data center), network reliability is high, and the blocking risk is acceptable due to low probability of coordinator failure. It is also commonly used within a single RDBMS for internal distributed operations. For cross-service, cross-database workflows in a microservices architecture, [Saga](./saga) is almost always preferred.

## Common follow-ups

- How does database-internal 2PC (e.g., Postgres distributed transactions) differ from cross-service 2PC?
- What recovery mechanism does a participant use when the coordinator restarts after a crash?
- How does Paxos or Raft differ from 2PC in terms of fault tolerance?
- In which real-world systems (Kafka, Spanner, CockroachDB) is a form of 2PC still used, and how is the blocking problem mitigated?
