---
title: Cache Invalidation & Eviction
description: How and when cached data is removed or refreshed.
tags: [concept, caching, performance]
category: tech-concepts
status: draft
---

# Cache Invalidation & Eviction

> **Q: Why is cache invalidation considered one of the hardest problems in computer science?**

The phrase "there are only two hard things in computer science: cache invalidation and naming things" (Knuth / Karlton) captures a real challenge: **knowing when a cached value is no longer valid** requires perfect knowledge of every path that can mutate the underlying data. In distributed systems that knowledge is spread across many services, making it easy to serve stale data silently.

> **Q: What are the main approaches to cache invalidation?**

1. **TTL / expiry** — each entry has a time-to-live; it expires automatically. Simple but may serve stale data up to TTL seconds.
2. **Explicit invalidation on write** — the writer deletes or overwrites the cache key whenever the source data changes. Keeps the cache fresh but requires every write path to know about the cache.
3. **Versioned / namespaced keys** — embed a version token in the key (e.g. `user:42:v7`). To invalidate, bump the version; old entries age out via TTL. Useful for bulk invalidation of a group.

Most systems combine TTL (safety net) with explicit invalidation (fast freshness).

> **Q: What eviction policies exist and when does each fit?**

| Policy | Description | Best for |
|--------|-------------|----------|
| **LRU** (Least Recently Used) | Evict the entry accessed least recently | General-purpose; good cache-hit rate for temporal locality |
| **LFU** (Least Frequently Used) | Evict the entry accessed least often | Long-lived caches where access frequency is meaningful |
| **FIFO** | Evict the oldest-inserted entry | Simple; predictable; good when recency doesn't predict future use |
| **Random** | Evict a random entry | Surprisingly competitive in practice; zero bookkeeping cost |

Redis defaults to LRU or LFU depending on configuration (`maxmemory-policy`).

> **Q: What is a thundering herd (cache stampede) and how do you prevent it?**

When a popular (hot) key expires, **many concurrent requests all miss simultaneously** and each independently queries the database, causing a spike in load that can overwhelm the DB.

Mitigations:

- **Request coalescing / single-flight** — only one request fetches the data; the rest wait and share the result (e.g. `singleflight` in Go, `p-limit` pattern in Node).
- **TTL jitter** — add random variance to TTL so keys expire at different times rather than all at once.
- **Early / probabilistic refresh** — before a key expires, a small fraction of requests proactively refresh it, spreading the cost.
- **Distributed lock** — first request acquires a lock and refreshes; others return stale data while waiting (requires a "stale-ok" fallback).

> **Q: What is stale-while-revalidate?**

An HTTP Cache-Control directive (also applicable in application caches) that allows serving a **stale cached response immediately** while a background process revalidates (fetches fresh data). The next request will receive the freshened value.

This is the "serve stale, refresh async" pattern — eliminates latency spikes at the cost of one extra stale response per revalidation cycle.

> **Q: How do versioned cache keys enable instant bulk invalidation?**

Instead of tracking individual keys, all related entries share a version prefix stored in a fast lookup (e.g. `user_cache_version:42 = 8`). When user 42's data changes, increment the version. All old keys are now unreachable; new reads populate fresh keys. Old entries evict via TTL without requiring explicit deletes.

## Common follow-ups

- How does Redis `SCAN` + bulk delete compare to TTL-based invalidation for high-volume caches?
- What is a negative cache entry and when is it useful?
- How do CDN edge caches (like Cloudflare) handle invalidation (purge APIs, cache tags)?
