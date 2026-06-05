---
title: Eventual Consistency
description: How distributed replicas converge and what guarantees weaker-than-strong consistency provides.
tags: [concept, consistency, distributed-systems]
category: tech-concepts
status: draft
---

# Eventual Consistency

::: details Q: What is eventual consistency?
**Eventual consistency** guarantees that if no new writes occur, all replicas will **converge to the same value** — but gives no bound on how long that takes. In the interim, reads may return stale data.

It sits at the weak end of the consistency spectrum because it makes no claim about *when* you'll see a write. The common mistake is treating "eventually" as a synonym for "soon enough" — in practice, replication lag can stretch from milliseconds (healthy cluster, same region) to seconds or longer (cross-region, degraded network). Design for the worst case, not the median.
:::

::: details Q: What are the intermediate consistency models between eventual and strong?
From weakest to strongest:

| Model | Guarantee |
|-------|-----------|
| **Eventual consistency** | Replicas converge; reads may be stale |
| **Monotonic reads** | A client never reads data older than a previous read (no time-travel) |
| **Read-your-writes** | A client always sees its own writes immediately |
| **Causal consistency** | Causally related operations are seen in causal order by all nodes |
| **Sequential consistency** | All operations appear in a total order consistent with each process's program order |
| **Linearizability (strong)** | Operations appear instantaneous; real-time ordering respected globally |

**Session guarantees** (read-your-writes, monotonic reads) are the practical middle ground: each client gets a consistent *view of its own activity* without requiring global synchronization. Common implementation: route a client's reads to the replica it last wrote to, or use a monotonically increasing read token.
:::

::: details Q: How do systems resolve write conflicts in eventual consistency?
When two replicas independently accept writes to the same key before syncing, they must reconcile:

- **Last-write-wins (LWW)**: the write with the highest timestamp wins. Simple and widely used (Cassandra default). Critical risk: **clock skew**. Two servers with clocks 50ms apart can silently discard the causally later write. NTP reduces but doesn't eliminate drift. LWW is acceptable when losing a concurrent write is tolerable; never use it for financial data.
- **Vector clocks**: each write carries a version vector tracking causal history per node. Concurrent (causally unrelated) writes are detected and surfaced to the application to resolve. No silent data loss, but your application must implement merge logic and handle conflict objects.
- **CRDTs (Conflict-free Replicated Data Types)**: data structures (grow-only counters, sets, OR-sets, maps) designed so any merge order yields the same result — no conflicts by construction. Used in Riak, Redis Enterprise, collaborative editors (OT vs CRDT is a related debate). The cost: not all data models fit a CRDT; CRDTs can grow in metadata size (tombstones in sets, vector clocks embedded per entry).
:::

::: details Q: When is eventual consistency acceptable and when is it not?
| Acceptable | Not acceptable without mitigation |
|-----------|-------------------------------|
| Social media feeds and likes | Bank account balances |
| View / download counters | Inventory reservation ("last item" scenarios) |
| DNS propagation | Payment processing |
| Search index updates | Authentication token revocation |
| Product catalogue reads | Distributed locks |

The pattern for "not acceptable" cases isn't always "use strong consistency" — it's "use strong consistency for the critical path, or add a compensating mechanism." For inventory: reserve optimistically and reconcile with a saga or oversell buffer. For balances: use a ledger with strong consistency at the write side, eventual at the read side. Accepting eventual consistency without understanding the business impact of a staleness window is the senior-level mistake.
:::

::: details Q: How does eventual consistency relate to the CAP theorem?
Eventual consistency is the natural **consistency model of AP systems**. When a system chooses availability over consistency during a network partition, reads from diverged replicas return potentially stale data. Eventual consistency defines what you get once the partition heals: replicas converge, but only after some delay. CAP tells you *why* you must accept eventual consistency in a highly available distributed system; eventual consistency describes *what that means operationally*.

See also: [CAP Theorem](./cap-theorem).
:::

::: details Q: How does sharding and replication interact with eventual consistency?
In a replicated system, writes go to a primary (leader) and are **asynchronously propagated** to replicas. Reads from replicas may lag behind the leader — this replication lag is the source of eventual consistency in MySQL read replicas, DynamoDB global tables, Cassandra with `LOCAL_ONE` reads, and similar setups.

The lag is not fixed: under write pressure it grows; during a follower restart it spikes. Monitor `seconds_behind_master` (MySQL), `ReplicationLatency` (DynamoDB), or equivalent. Quorum reads (e.g., Cassandra `QUORUM`) reduce the staleness window at the cost of higher read latency and reduced availability during failures — a direct PACELC trade-off.

See also: [Sharding & Replication](./sharding-replication).
:::

## Common follow-ups

- What is the difference between BASE (Basically Available, Soft state, Eventually consistent) and ACID?
- How do CRDTs work for a distributed counter specifically?
- What is "read repair" in Cassandra and how does it help convergence?
- How does DynamoDB offer both eventual and strongly consistent reads on the same table?
