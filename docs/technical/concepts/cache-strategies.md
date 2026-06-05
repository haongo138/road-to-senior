---
title: Cache Strategies
description: How applications read and write data relative to a cache.
tags: [concept, caching, performance]
category: tech-concepts
status: draft
---

# Cache Strategies

> **Q: What is cache-aside (lazy loading) and why is it the most common strategy?**

The application checks the cache first. On a **miss** it loads from the database, writes into the cache, then returns. On a **hit** it returns immediately. Popularity comes from simplicity: the cache is invisible to the data layer, so it can be added to any existing codebase without schema changes.

The hidden costs: every cold-start or eviction creates a **staleness window** between when the DB is updated and when the next read refreshes the cache. Under concurrent traffic, a single write can produce a **dual-write race**: thread A reads stale value, thread B updates DB + cache, thread A overwrites cache with the stale value it just read — net result: cache holds old data until TTL expires. Mitigate with short TTLs, write-through for critical paths, or optimistic locking on the cache write.

> **Q: How does read-through differ from cache-aside?**

In **read-through** the cache layer itself fetches from the DB on a miss and self-populates — the application always talks to the cache. Cache-aside puts that logic in application code.

The practical difference is **operational**: read-through centralises the DB access pattern (easier to tune, trace, and rate-limit) but tightly couples the cache to the DB schema. Cache-aside is more flexible but scatters cache-fill logic across services, making it easy to miss a code path and end up with inconsistency.

> **Q: What is write-through caching and what problem does it solve?**

Every write goes to the **cache and the database synchronously** before the caller gets an acknowledgement.

It solves the staleness window in cache-aside: after any write, the cache is immediately consistent. The cost is **added write latency** — every write waits for two round-trips instead of one. That makes it a poor fit for write-heavy workloads. It also adds partial-failure risk: if the DB write succeeds but the cache write fails, you need rollback logic or you accept a momentary inconsistency you must detect. Best suited for read-heavy workloads where stale reads after a write would be harmful.

> **Q: When would you use write-back (write-behind) caching?**

The application writes only to the cache; the cache asynchronously flushes dirty entries to the database.

**Throughput is the payoff**: write bursts are absorbed in memory and batched to the DB, which is why write-back is used for counters, session state, and rate-limit buckets. The **risk is data loss**: if the cache node crashes before flushing, those writes are gone. You must decide whether the business can tolerate that. Write-back is also operationally hard to reason about — replication and failover must account for dirty state. Never use it as the primary store for anything you cannot afford to reconstruct.

> **Q: What is write-around and when does it make sense?**

Writes go **directly to the database**, bypassing the cache. Data enters the cache only on a subsequent read (lazy, like cache-aside).

Use it for data that is **written once and rarely re-read**: bulk imports, audit logs, cold-tier data migration. If you wrote those through the cache you'd evict hot keys to make room for data nobody is about to read. The trade-off is an unavoidable first-read miss, which you accept in exchange for protecting your cache's hit rate on the hot working set.

> **Q: How do you choose a strategy based on read/write ratio and consistency need?**

| Workload | Recommended strategy |
|----------|---------------------|
| Read-heavy, tolerate brief staleness | Cache-aside or read-through |
| Read-heavy, consistency critical after writes | Write-through |
| Write-heavy, loss-tolerant (counters, metrics) | Write-back |
| Bulk writes rarely re-read | Write-around |

Most production systems **combine**: cache-aside for reads, write-through or explicit invalidation on writes for the consistency-sensitive subset. Two gotchas to avoid: (1) treating the cache as a **source of truth** — if data exists only in cache and not in the DB, a cold restart loses it; the DB must remain the system of record. (2) **cold-start / cache-warming** — after a deployment or cache flush, every request is a miss and your DB takes the full production read load; mitigate with pre-warming, gradual traffic shifting, or a read-through layer that coalesces concurrent misses (single-flight).

## Common follow-ups

- What is the difference between a cache hit ratio and a cache miss ratio, and what is a healthy target?
- How do you warm a cache after a cold start or deployment?
- Can cache-aside and write-through be combined? How?
- How does Redis support write-back patterns?
