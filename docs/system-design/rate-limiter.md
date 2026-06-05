---
title: Rate Limiter
description: Token-bucket rate limiting at the API gateway, and where it breaks.
tags: [scaling, api]
category: system-design
status: solid
---

# Rate Limiter

```mermaid
flowchart LR
  Client -->|request| Gateway
  Gateway --> Limiter[Token Bucket]
  Limiter -->|tokens left| Service
  Limiter -->|empty: 429| Client
```

**Approach:** each client key maps to a token bucket (capacity + refill rate)
held in a fast store (e.g. Redis). A request consumes one token; an empty bucket
returns `429 Too Many Requests`.

**Trade-offs:** local in-memory buckets are fast but inconsistent across nodes;
a shared store is consistent but adds a network hop per request.

**Where it breaks:** clock skew on refill, hot keys overloading a single shard,
and thundering herds when many buckets refill on the same boundary.
