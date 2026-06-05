---
title: CAP Theorem
description: Consistency, Availability, and Partition tolerance trade-offs in distributed systems.
tags: [concept, consistency, distributed-systems]
category: tech-concepts
status: draft
---

# CAP Theorem

> **Q: What does CAP stand for and what does the theorem actually state?**

CAP stands for:
- **C — Consistency**: every read receives the most recent write or an error (linearizability).
- **A — Availability**: every request receives a (non-error) response, but it may not be the latest data.
- **P — Partition tolerance**: the system continues operating even when network messages between nodes are lost or delayed.

The theorem (Brewer, 2000; proved by Gilbert & Lynch, 2002) states: **during a network partition, a distributed system can guarantee either C or A, but not both**.

> **Q: Why is "pick any 2 of 3" a common misreading of CAP?**

Partition tolerance is **not optional** in a real distributed system. Networks do fail. If you don't tolerate partitions, you have a single-node system.

The real choice is: **when a partition occurs, do you sacrifice consistency (AP) or availability (CP)?**

Outside of a partition, you can have both C and A, which is why the framing "CA systems" (like single-node PostgreSQL) exists — but it only holds until the first partition.

> **Q: What are examples of CP vs AP systems?**

| Type | Behaviour during partition | Examples |
|------|--------------------------|----------|
| **CP** | Returns error or blocks until consistent | HBase, Zookeeper, etcd, distributed locks |
| **AP** | Returns potentially stale data; stays up | Cassandra (tunable), DynamoDB (eventual), CouchDB |
| **Tunable** | Per-operation quorum settings | Cassandra (ONE vs QUORUM vs ALL), DynamoDB (strong vs eventual read) |

Most real systems are tunable rather than strictly CP or AP.

> **Q: What is PACELC and why does it extend CAP?**

PACELC (Daniel Abadi, 2012) fills a gap in CAP: CAP only addresses the **partition** scenario. PACELC adds:

> "If there is a **P**artition, choose between **A**vailability and **C**onsistency. **E**lse (no partition), choose between **L**atency and **C**onsistency."

Even without failures, replicating a write to multiple nodes before acknowledging it increases consistency but adds latency. Systems like Cassandra trade consistency for low latency (EL); systems like Spanner trade latency for strong consistency (EC).

> **Q: How does CAP relate to eventual consistency?**

AP systems accept that replicas may diverge during a partition. Once the partition heals, replicas **eventually converge** — this is **eventual consistency**. CAP tells you *why* you have to accept eventual consistency in a highly available distributed system: to stay available during partitions, you must allow reads of potentially stale data.

See also: [Eventual Consistency](./eventual-consistency).

> **Q: How does a CP system handle a partition in practice?**

A CP system will **reject requests** (return an error or block) if it cannot guarantee consistency — for example, if a quorum of nodes cannot be reached. Zookeeper will refuse reads/writes if the leader cannot confirm a majority of followers are reachable. This preserves correctness at the cost of availability.

## Common follow-ups

- What is linearizability vs sequential consistency vs eventual consistency?
- How does Cassandra's tunable consistency (ONE / QUORUM / ALL) map to the CP/AP spectrum?
- What is a split-brain scenario and how do consensus protocols (Raft, Paxos) prevent it?
- How does Google Spanner achieve "external consistency" using TrueTime?
