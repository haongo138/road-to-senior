---
title: Cache Strategies
description: How applications read and write data relative to a cache.
tags: [concept, caching, performance]
category: tech-concepts
status: draft
---

# Cache Strategies

> **Q: What is cache-aside (lazy loading) and why is it the most common strategy?**

The application checks the cache first. On a **miss** it loads from the database, writes the result into the cache, then returns it. On a **hit** it returns immediately.

- Most common because it is simple and decouples the cache from the data store.
- **Trade-offs**: first-hit latency penalty; cache can become stale if the DB is updated out-of-band.

> **Q: How does read-through differ from cache-aside?**

In **read-through** a cache library or proxy sits between the application and the database. The application always reads from the cache; the cache itself fetches from the DB on a miss and self-populates. The application code does not know about the DB.

Cache-aside keeps cache-filling logic in application code; read-through delegates it to the cache layer.

> **Q: What is write-through caching and what problem does it solve?**

Every write goes to the **cache and the database synchronously** before the write is acknowledged to the caller.

- **Benefit**: cache is always consistent with the DB; no stale reads after a write.
- **Cost**: higher write latency (must wait for both stores). Good for read-heavy workloads where consistency matters.

> **Q: When would you use write-back (write-behind) caching?**

The application writes only to the cache. The cache layer asynchronously flushes dirty entries to the database in the background.

- **Benefit**: very low write latency; absorbs write bursts (rate smoothing).
- **Risk**: data loss if the cache node crashes before flushing. Suitable for analytics counters, view counts, or other loss-tolerant metrics.

> **Q: What is write-around and when does it make sense?**

Writes go **directly to the database**, bypassing the cache. Data is loaded into the cache only on a subsequent read (like cache-aside).

- Prevents polluting the cache with data that is written once and rarely read (e.g., bulk imports, log ingestion).
- Accept a first-read miss in exchange for not evicting hot data.

> **Q: How do you choose a strategy based on read/write ratio?**

| Workload | Recommended strategy |
|----------|---------------------|
| Read-heavy, occasional writes | Cache-aside or read-through |
| Frequent writes, high consistency required | Write-through |
| Very high write throughput, can tolerate some loss | Write-back |
| Bulk writes rarely re-read | Write-around |

Most production systems mix strategies: cache-aside for reads, write-through or explicit invalidation for writes.

## Common follow-ups

- What is the difference between a cache hit ratio and a cache miss ratio, and what is a healthy target?
- How do you warm a cache after a cold start or deployment?
- Can cache-aside and write-through be combined? How?
- How does Redis support write-back patterns?
