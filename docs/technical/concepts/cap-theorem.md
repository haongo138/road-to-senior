---
title: CAP Theorem
description: Consistency, Availability, and Partition tolerance trade-offs in distributed systems.
tags: [concept, consistency, distributed-systems]
category: tech-concepts
status: draft
---

# CAP Theorem

> **Q: What does CAP stand for and what does the theorem actually state?**

- **C — Consistency**: every read returns the most recent write or an error (linearizability — equivalent to a single-node system from the client's view).
- **A — Availability**: every request receives a non-error response, but it may not reflect the latest write.
- **P — Partition tolerance**: the system keeps operating when network messages between nodes are lost or delayed.

The theorem (Brewer 2000; proved by Gilbert & Lynch 2002): **during a network partition, you can guarantee either C or A, but not both**. It says nothing about what you must sacrifice when the network is healthy.

> **Q: Why is "pick any 2 of 3" a misleading framing?**

Because **P is not optional**. Networks partition — cables fail, switches drop packets, data centres lose connectivity. Claiming you're a "CA system" just means you haven't thought about what happens when the network fails. A single-node system (PostgreSQL on one host) can be CA in the sense that there's no replication to partition, but the moment you add replication or run in multiple AZs, you're in CAP territory.

The real choice is binary and only activates during a partition: **do you sacrifice consistency (stay available, serve potentially stale data) or sacrifice availability (refuse requests until you can guarantee correctness)?** Outside of a partition, modern systems can deliver both.

> **Q: What are examples of CP vs AP systems?**

| Type | Behaviour during partition | Examples |
|------|--------------------------|----------|
| **CP** | Returns error or blocks until a quorum is reachable | etcd, Zookeeper, HBase, distributed locks |
| **AP** | Returns potentially stale data; stays up | Cassandra (default), DynamoDB (eventual reads), CouchDB |
| **Tunable** | Per-operation quorum settings let you choose | Cassandra (ONE / QUORUM / ALL), DynamoDB (strong vs eventual) |

In practice few systems are rigidly one or the other — Cassandra can be CP-like with `QUORUM` reads/writes if you're willing to pay the latency. The label "AP" or "CP" describes the *default* and the *optimised-for* case.

> **Q: What is PACELC and why is it more operationally useful than CAP?**

PACELC (Abadi 2012) addresses CAP's blind spot: **CAP only talks about partitions**. Most of the time your network is fine — but you still face a trade-off.

> "If there is a **P**artition → choose **A** or **C**. **E**lse (healthy network) → choose **L**atency or **C**onsistency."

Replicating a write to quorum before acknowledging it guarantees consistency but adds latency proportional to the slowest replica. This is the daily operational dial most engineers actually tune: Cassandra (EL — trades consistency for low latency), Spanner (EC — trades latency for external consistency via TrueTime).

For interview purposes: CAP tells you what you sacrifice during a failure; PACELC tells you what you're paying even when everything is working.

> **Q: How does CAP relate to eventual consistency?**

AP systems accept that replicas may diverge during a partition. Once the partition heals, they **eventually converge** — this is eventual consistency. CAP explains *why* AP systems must accept eventual consistency: to remain available during a partition, they must allow reads of potentially stale replicas. Choosing AP is choosing to trade correctness windows for uptime.

See also: [Eventual Consistency](./eventual-consistency).

> **Q: How does a CP system handle a partition in practice?**

A CP system refuses requests it cannot answer consistently. Zookeeper will reject reads and writes if the leader can't confirm a quorum of followers are reachable — you get an error, not stale data. etcd behaves similarly. Distributed locks (Redlock, Chubby) are inherently CP: a lock that can be held by two clients simultaneously due to a partition is worse than no lock at all.

The operational implication: CP systems need circuit breakers, retries with backoff, and user-facing degradation paths for the "system unavailable" responses they'll emit during partitions. Teams often underestimate how often partitions occur in cloud multi-AZ deployments (10s of seconds per month is common in AWS).

## Common follow-ups

- What is linearizability vs sequential consistency vs eventual consistency?
- How does Cassandra's tunable consistency (ONE / QUORUM / ALL) map to the CP/AP spectrum?
- What is a split-brain scenario and how do consensus protocols (Raft, Paxos) prevent it?
- How does Google Spanner achieve "external consistency" using TrueTime?
