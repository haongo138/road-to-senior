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
| **Primary goal** | Read scaling + high availability (HA) | Write scaling + storage scaling |
| **Each node holds** | Full dataset | A subset (shard) of the dataset |
| **Failure impact** | Replicas take over if leader fails | Loss of a shard means loss of that data partition |

They are complementary: production systems often replicate each shard.

> **Q: How does leader-follower (primary-replica) replication work, and what is replication lag?**

The leader accepts all writes. Changes are written to a **write-ahead log (WAL)** or binlog and streamed to followers, which apply them asynchronously. Followers serve read queries.

- **Synchronous replication**: the leader waits for at least one follower to confirm before acknowledging the write. Stronger durability, higher write latency.
- **Asynchronous replication**: the leader acknowledges immediately; followers catch up on their own schedule. Lower latency, but followers may lag — serving stale data.

**Replication lag** is the delay between a write on the leader and its appearance on followers. This causes the **read-your-writes problem**: a user writes data, then reads from a stale replica and doesn't see their own change. Mitigations: route reads for the same user to the leader for a short window, or track a replication position per session.

> **Q: What are the common sharding strategies?**

| Strategy | How it works | Pros | Cons |
|---|---|---|---|
| **Range sharding** | Split by key range (e.g., user IDs 1–1M on shard 1) | Simple, good for range queries | Hotspots if writes concentrate in one range (e.g., monotonically increasing IDs) |
| **Hash sharding** | `shard = hash(key) % N` | Even distribution, no hotspots for random keys | Range queries scatter across all shards; rebalancing requires rehashing |
| **Directory sharding** | A lookup table maps each key to a shard | Flexible, supports arbitrary mapping | Lookup table is a single point of failure; overhead per request |

> **Q: What is the hotspot / celebrity problem in sharding?**

If your shard key is a user ID and one user (a celebrity) generates vastly more traffic than others, their shard becomes a bottleneck. Solutions: use a compound shard key that spreads the celebrity's data, add an artificial prefix to the key, or cache heavily accessed records separately. The underlying issue is that hash sharding distributes keys evenly but not necessarily load evenly.

> **Q: What is consistent hashing and why does it help?**

Standard hash sharding (`hash(key) % N`) requires remapping almost every key when a shard is added or removed. **Consistent hashing** arranges nodes and keys on a virtual ring. When a node is added or removed, only the keys in the adjacent arc need to migrate — roughly `K/N` keys instead of almost all of them. This makes rebalancing far less disruptive. It is the basis for Cassandra's partitioning and many distributed cache systems (e.g., Memcached with client-side consistent hashing).

> **Q: What makes cross-shard queries and rebalancing painful?**

- **Cross-shard queries**: a `JOIN` or aggregation that spans shards requires scatter-gather — the application or query router sends the query to every shard, collects partial results, and merges them. This is slow and complex. Best practice: design the shard key so the most frequent queries stay within a single shard.
- **Rebalancing**: moving data from an overloaded shard to a new one requires live data migration, careful routing updates, and a period where both old and new locations must be checked. Most systems minimize this via consistent hashing or virtual nodes (vnodes) that allow fine-grained movement.

## Common follow-ups

- How does multi-leader (active-active) replication differ from leader-follower, and what conflicts does it introduce?
- What is a distributed transaction across shards, and how does two-phase commit address it?
- How do distributed databases like CockroachDB or Spanner achieve global consistency without single-leader bottlenecks?
- When would you choose sharding over vertical scaling (bigger machine) or read replicas?
