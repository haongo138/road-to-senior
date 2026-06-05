---
title: Two-Phase Commit (2PC)
description: A distributed protocol that guarantees atomic commit or abort across multiple participants.
tags: [concept, concurrency, distributed-transactions]
category: tech-concepts
status: draft
---

# Two-Phase Commit (2PC)

> **Q: What is Two-Phase Commit and what does it guarantee?**

2PC is a distributed consensus protocol that ensures all participating nodes either **all commit** or **all abort** — providing atomicity across multiple separate systems. A single **coordinator** node drives the protocol; participants include any XA-compatible resource managers (databases, message brokers). The guarantee is genuine: no participant commits a partial result. The price is a blocking window that can be arbitrarily long if the coordinator fails at the wrong moment.

> **Q: What are the two phases?**

**Phase 1 — Prepare**: The coordinator sends `PREPARE` to each participant. Each participant performs all work needed (acquiring locks, writing undo logs), durably records that it is ready, and votes `YES` or `NO`. If any participant votes `NO` or times out, the coordinator aborts. After voting `YES`, a participant cannot unilaterally roll back — it is fully committed to the coordinator's decision.

**Phase 2 — Commit or Abort**: If all votes are `YES`, the coordinator writes its decision to its own durable log and sends `COMMIT`. Each participant applies the transaction and releases locks. If any vote was `NO`, the coordinator sends `ABORT` and participants discard their prepared state.

> **Q: What is the critical weakness of 2PC?**

**The blocking window.** If the coordinator crashes after receiving all `YES` votes but before writing its commit decision, participants are stuck: they voted `YES` (so they cannot safely roll back), but they have not received `COMMIT` (so they cannot safely commit). They hold all acquired locks indefinitely. Recovery requires either the coordinator to restart and replay its log, or a manual operator decision. In a cloud environment where coordinator restart can take minutes, this blocks all writers on every locked row.

The secondary weakness is throughput: every participant holds row-level locks for the full two round-trips. Under moderate contention this serializes writes across services that should be independent.

> **Q: How does 2PC interact with the CAP theorem?**

2PC chooses **Consistency over Availability** without compromise. During coordinator failure, the system is unavailable to any transaction that touches a locked row — this is a hard unavailability, not graceful degradation. Under network partition, participants cannot distinguish "coordinator crashed" from "partition"; they must stay blocked to preserve consistency. For services that need to remain available under partition, [Saga](./saga) and eventual consistency are the right model.

> **Q: What is 3PC and why is it not the answer?**

Three-Phase Commit adds a `PRE-COMMIT` phase so participants can safely abort on coordinator timeout, theoretically removing the blocking property. In practice, 3PC is not safe under network partitions — a split partition can lead two subsets of participants to independently commit, causing split-brain. It is also more complex and adds a full extra round-trip of latency. Almost no real systems use 3PC; they use Paxos/Raft-based consensus (which achieves non-blocking agreement under failures) or avoid distributed atomicity entirely.

> **Q: Where is 2PC still the right answer, and where does it appear in modern systems?**

2PC is appropriate when:
- All participants are XA-capable resources within a single controlled environment (same data center, high-reliability network).
- The consistency requirement is absolute and the blocking risk is acceptable given your MTTR for coordinator restarts.
- You are within a single RDBMS using internal distributed operations (Postgres's internal 2PC for logical replication, for example).

It still appears in modern systems: Spanner uses a 2PC variant internally but mitigates the blocking window using Paxos-replicated coordinators, so coordinator "failure" requires a full Paxos group failure rather than a single node. CockroachDB uses a similar approach. Kafka transactions use a lightweight 2PC between the producer and the transaction coordinator. The pattern is not dead — it is just used at the right layer with appropriate fault-tolerance wrapped around the coordinator.

For cross-service, cross-database workflows in microservices, [Saga](./saga) is almost always the correct choice.

## Common follow-ups

- How does database-internal 2PC (e.g., Postgres `PREPARE TRANSACTION`) differ from cross-service 2PC?
- What recovery mechanism does a participant use when the coordinator restarts after a crash?
- How does Paxos or Raft differ from 2PC in fault tolerance — what failure scenarios do they survive that 2PC cannot?
- In Spanner and CockroachDB, how is the coordinator made fault-tolerant so 2PC's blocking window is bounded?
