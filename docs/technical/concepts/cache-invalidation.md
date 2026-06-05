---
title: Cache Invalidation & Eviction
description: How and when cached data is removed or refreshed.
tags: [concept, caching, performance]
category: tech-concepts
status: draft
---

# Cache Invalidation & Eviction

::: details Q: Why is cache invalidation considered one of the hardest problems in computer science?
The phrase (attributed to Karlton) captures something precise: **knowing when a cached value is no longer valid** requires tracking every path that can mutate the underlying data. In distributed systems that knowledge is spread across many services and async jobs. The failure mode is silent — you don't get an exception, you silently serve wrong data. The difficulty compounds under concurrent writes: two processes may race to invalidate and re-populate a key, and the loser's stale value can win if you're not careful.
:::

::: details Q: What are the main approaches to cache invalidation, and how do they compare?
1. **TTL / expiry** — each entry has a time-to-live; it expires automatically. Simplest to operate. Trade-off: serves stale data for up to TTL seconds after a write. Choosing TTL is a consistency vs cache-efficiency dial: too short and your hit rate collapses; too long and you serve stale data too often.

2. **Explicit invalidation on write** — the writer deletes or updates the cache key whenever the source changes. Keeps the cache fresh immediately. Trade-off: every write path must know about the cache. Miss one code path (a background job, an admin script, a different service) and the cache silently diverges. Correctness under concurrent writes is the hardest part: between the DB write and the cache delete, another reader can re-populate the cache with the old value.

3. **Versioned / namespaced keys** — embed a version token in the key (`user:42:v7`). Invalidation means bumping the version; old entries become unreachable and age out via TTL. Enables **instant bulk invalidation** without scanning keys. The cost is complexity: you need a fast, durable store for the version counter itself (its loss means you can't construct the right key), and stale entries accumulate memory until TTL evicts them.

Most production systems combine TTL (safety net) with explicit invalidation (fast freshness) for the hot path.
:::

::: details Q: What eviction policies exist and when does each mislead you?
| Policy | Description | Gotcha |
|--------|-------------|--------|
| **LRU** (Least Recently Used) | Evict entry accessed least recently | Scans or batch jobs pollute the recency order and evict genuinely hot data |
| **LFU** (Least Frequently Used) | Evict entry accessed least often | New but suddenly popular keys are evicted before stale-but-historically-popular ones |
| **ARC** (Adaptive Replacement Cache) | Balances recency and frequency, self-tunes | More complex; less common in off-the-shelf systems |
| **Random** | Evict a random entry | Surprisingly competitive; zero bookkeeping cost; good baseline |

Redis uses LRU or LFU depending on `maxmemory-policy`. LFU (`allkeys-lfu`) generally outperforms LRU for long-lived caches with a stable hot set, but if your access pattern has sudden shifts (viral content, flash sales), LFU's historical counts lag behind and you evict the wrong things. Monitor **eviction rate** and **hit rate** together — high eviction with declining hit rate signals your cache is too small or the wrong policy.
:::

::: details Q: What is a thundering herd (cache stampede) and how do you mitigate it?
When a popular key expires, **many concurrent requests miss simultaneously**, each independently queries the DB, and the resulting spike can overwhelm it. This is most dangerous for keys that are expensive to compute and hit by high QPS.

Mitigations and their costs:

- **Single-flight / request coalescing**: only one goroutine (or thread) fetches; the rest wait and share the result. Eliminates duplicate DB hits. Cost: waiters are blocked — latency spikes during the refresh. Works well for in-process coalescing (`singleflight` in Go, `p-limit` in Node); harder across process boundaries.
- **Jittered TTL**: add random variance (`TTL ± 10%`) so keys across a fleet expire at different times rather than in a synchronized wave. Cheap, stateless, but doesn't help for a single very hot key.
- **Probabilistic early refresh** (XFetch / PER): before the key expires, a fraction of requests proactively refresh it in the background, proportional to how close expiry is. Spreads the refresh cost without waiting for a miss. Cost: slightly higher average load; requires implementation.
- **Distributed lock + stale fallback**: first request acquires a lock and refreshes; all others return the (slightly) stale value while waiting. Cost: one stale response per revalidation cycle; requires the cache to store stale-ok entries past their TTL.

None of these is free. Single-flight is usually the first choice for in-process; jitter + stale fallback for cross-process.
:::

::: details Q: What is stale-while-revalidate?
An HTTP `Cache-Control` directive — also applicable in application caches — that serves the **stale cached response immediately** while a background process fetches fresh data. The next request gets the refreshened value.

This is "serve stale, refresh async": eliminates latency spikes at the cost of one extra stale response per revalidation cycle. The key operational parameter is `stale-while-revalidate=<seconds>` — how long past expiry you're willing to serve stale. Keep it tight for consistency-sensitive data.
:::

::: details Q: What is negative caching and when is it useful?
**Negative caching** stores the fact that a lookup returned nothing (e.g. a user ID that doesn't exist). Without it, every request for a missing key hits the DB — a common attack vector (cache-busting with random keys) and a source of unnecessary load on sparse datasets.

TTL for negative entries should be shorter than for positive ones, since the data they represent (non-existence) is more likely to change.
:::

::: details Q: How do versioned cache keys enable instant bulk invalidation?
All related entries share a version prefix stored in a fast lookup (`user_cache_version:42 = 8`). Invalidation means incrementing the version. All old keys are now unreachable; new reads populate fresh keys. Old entries evict via TTL without explicit deletes.

This scales to bulk invalidation of entire logical groups (e.g. all cache entries for a tenant) without scanning. The failure mode: if the version counter store goes down, you can't construct the current key — design accordingly (fallback to DB, or make the version store highly available).
:::

## Common follow-ups

- How does Redis `SCAN` + bulk delete compare to TTL-based invalidation for high-volume caches?
- What is a negative cache entry and when is it useful?
- How do CDN edge caches (like Cloudflare) handle invalidation (purge APIs, cache tags)?
