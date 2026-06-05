---
title: Eventual Consistency
description: How distributed replicas converge and what guarantees weaker-than-strong consistency provides.
tags: [concept, consistency, distributed-systems]
category: tech-concepts
status: draft
---

# Eventual Consistency

> **Q: What is eventual consistency?**

**Eventual consistency** guarantees that if no new writes are made to a data item, all replicas will **eventually converge to the same value**. There is no bound on how long convergence takes.

It is weaker than **strong (linearizable) consistency**, where every read immediately reflects the latest write globally. In an eventually consistent system, a read may return stale data until propagation completes.

> **Q: What are the intermediate consistency models between eventual and strong?**

From weakest to strongest:

| Model | Guarantee |
|-------|-----------|
| **Eventual consistency** | Replicas converge; reads may be stale |
| **Monotonic reads** | A client never reads older data than it previously read (no going backwards in time) |
| **Read-your-writes** | A client always sees its own writes immediately |
| **Causal consistency** | Causally related operations are seen in causal order by all nodes |
| **Sequential consistency** | All operations appear in a total order consistent with each process's order |
| **Linearizability (strong)** | Operations appear instantaneous; real-time order respected |

**Session guarantees** (read-your-writes, monotonic reads, causal consistency) are commonly used to give each client a consistent *view* without requiring global synchronization.

> **Q: How do systems resolve write conflicts in eventual consistency?**

When two replicas accept concurrent writes to the same key, they must reconcile:

- **Last-write-wins (LWW)**: the write with the highest timestamp wins. Simple but can lose data if clocks are skewed.
- **Vector clocks**: each write carries a version vector tracking causality per node. Concurrent (causally unrelated) writes are detected and surfaced to the application for resolution.
- **CRDTs (Conflict-free Replicated Data Types)**: data structures (counters, sets, maps) designed so that any merge order produces the same result — no conflicts by construction. Used in Riak, Redis Enterprise, collaborative editors.

> **Q: When is eventual consistency acceptable and when is it not?**

| Acceptable | Not acceptable |
|-----------|---------------|
| Social media feeds and likes | Bank account balances |
| View / download counters | Inventory reservation ("last item") |
| DNS propagation | Payment processing |
| Search index updates | Authentication tokens (revocation must be immediate) |
| Product catalogue reads | Distributed locks |

Rule of thumb: eventual consistency is fine when **stale data is not harmful** or when the business can tolerate a brief window of inaccuracy.

> **Q: How does eventual consistency relate to CAP theorem?**

Eventual consistency is the natural **consistency model of AP systems** in CAP. When a distributed system chooses availability over consistency during a partition, it must accept that reads may return stale data. Eventual consistency defines the convergence guarantee once the partition heals.

See also: [CAP Theorem](./cap-theorem).

> **Q: How does sharding and replication interact with eventual consistency?**

In a replicated system, writes go to a primary (leader) and are asynchronously propagated to replicas. Reads from replicas may be behind the leader — this is replication lag and is the source of eventual consistency in databases like MySQL replicas, DynamoDB global tables, or Cassandra with LOCAL_ONE reads.

Stronger read guarantees (quorum reads) reduce the window of staleness at the cost of higher latency.

See also: [Sharding & Replication](./sharding-replication).

## Common follow-ups

- What is the difference between BASE (Basically Available, Soft state, Eventually consistent) and ACID?
- How do CRDTs work for a distributed counter specifically?
- What is "read repair" in Cassandra and how does it help convergence?
- How does DynamoDB offer both eventual and strongly consistent reads on the same table?
