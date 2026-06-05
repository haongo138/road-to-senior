---
title: Sharding & Replication
description: Two complementary scaling strategies — replication duplicates data for availability, sharding partitions it for capacity.
tags: [concept, database, scaling]
category: tech-concepts
status: draft
---

# Sharding & Replication

> **Q: What is the difference between replication and sharding?**

| | Replication | Sharding (horizontal partitioning) |
|---|---|---|
| **What it does** | Copies the **same** data to multiple nodes | Splits **different** data across multiple nodes |
| **Primary goal** | Read scaling + high availability | Write scaling + storage scaling |
| **Each node holds** | Full dataset | A subset (shard) of the dataset |
| **Failure impact** | Replicas take over if leader fails | Loss of a shard means loss of that partition's data |

They are complementary — production systems typically replicate each shard for availability. Reach for replication first; it's far simpler. Shard only when a single machine's write throughput or storage is genuinely exhausted.

> **Q: How does leader-follower replication work, and what are the durability and lag trade-offs?**

The leader accepts all writes, appends them to a write-ahead log (WAL) or binlog, and streams changes to followers. Followers replay the log and serve reads.

- **Synchronous replication**: the leader waits for at least one follower to acknowledge before confirming the write. Stronger durability (you won't lose a committed write if the leader dies immediately after), but every write waits for a network round-trip — typically 1–5 ms on LAN, much more across regions.
- **Asynchronous replication**: the leader acknowledges immediately; followers catch up independently. Lower write latency, but a leader failure between a write and follower replay loses that write. Most cloud-managed databases (RDS, Cloud SQL) default to async with optional semi-sync.

**Replication lag** is the delay before a committed write appears on followers — it can range from milliseconds to minutes under load. This creates the **read-your-writes** problem: a user writes data, then reads from a stale replica and doesn't see their own change. Mitigation strategies: route reads to the leader for a short window after a write, track the replication position (LSN) per session and stall reads on replicas that haven't caught up, or use sticky sessions. Lag is a metric you must monitor — sudden spikes often precede follower divergence.

> **Q: What are the common sharding strategies and their failure modes?**

| Strategy | How it works | Pros | Cons |
|---|---|---|---|
| **Range sharding** | Split by key range (e.g., user IDs 1–1M → shard 1) | Simple; good for range queries | Hotspots when writes concentrate in one range (e.g., monotonically increasing IDs or timestamps) |
| **Hash sharding** | `shard = hash(key) % N` | Even key distribution; no sequential hotspots | Range queries scatter across all shards; rebalancing requires rehashing most keys |
| **Directory sharding** | Lookup table maps each key to a shard | Fully flexible; supports arbitrary mapping | Lookup table is a single point of failure and a network hop per request |

The shard key decision is effectively irreversible without expensive data migration. Choose it based on your dominant query pattern — the key that keeps the most frequent queries within a single shard.

> **Q: What is the hotspot / celebrity problem and how do you address it?**

Hash sharding distributes keys evenly but not load evenly. A single celebrity user or viral event can drive orders of magnitude more traffic to one shard than others. A uniform key hash doesn't help — the key appears once, but each request hashes to the same shard.

Mitigations: use a compound shard key that adds a secondary dimension (e.g., `user_id + time_bucket`), add an artificial random salt prefix to hot keys to spread writes across shards, or cache the hottest records in an in-process or Redis layer so database traffic never reaches the shard. The salt approach complicates reads — you must fan out and merge.

> **Q: What is consistent hashing and why does it help with rebalancing?**

Standard `hash(key) % N` remaps nearly every key when N changes — adding a shard requires rehashing ~(N-1)/N of all keys. **Consistent hashing** arranges nodes and keys on a virtual ring. Adding or removing a node moves only the keys in the adjacent arc — roughly `K/N` keys instead of almost all. Cassandra and most distributed caches (Memcached with client-side consistent hashing) use this approach. Virtual nodes (vnodes) distribute each physical node's responsibility across many arc segments, giving finer-grained rebalancing.

> **Q: What makes cross-shard operations painful, and how do you design around them?**

- **Cross-shard joins/aggregations**: require scatter-gather — the query router fans out to every shard, waits for all partial results, then merges them in the application layer. Latency is bounded by the slowest shard; complexity is high.
- **Cross-shard transactions**: two-phase commit (2PC) achieves atomicity but introduces a coordinator that blocks all participants if it crashes mid-protocol. Most teams avoid 2PC and instead model operations to be single-shard, or use saga patterns with compensating transactions for cross-shard workflows.
- **Resharding**: moving data from an overloaded shard requires live migration — copy data, update routing, verify, cut over — while serving production traffic. Most systems minimize this via vnodes or pre-splitting into many more logical shards than physical nodes.

The principal lesson: **shard key choice and cross-shard query avoidance are 90 % of the sharding problem**. Get the key wrong and no amount of consistent hashing or clever routing recovers it cheaply.

## Common follow-ups

- Multi-leader (active-active) replication: what write conflicts does it introduce and how are they resolved? (last-write-wins, CRDTs, application-level resolution)
- When does vertical scaling or more replicas outperform sharding? (most systems don't need sharding until hundreds of thousands of writes/sec or multi-TB datasets)
- How do distributed databases like CockroachDB or Spanner achieve global consistency without a single-leader bottleneck? (Paxos/Raft per range, TrueTime)
- What is a distributed transaction across shards, and when is 2PC acceptable vs. too costly?
