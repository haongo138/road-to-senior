---
title: Channels vs Mutexes
description: When to use channels for communication and when to use mutexes for shared state protection.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Channels vs Mutexes

::: details Q: What does "don't communicate by sharing memory; share memory by communicating" actually mean in practice?
The proverb is a design principle, not an absolute rule. It means: instead of giving multiple goroutines direct access to the same variable (and protecting it with a lock), **transfer ownership of data through channels** so only one goroutine holds the data at a time.

Concrete translation:
- Sharing memory (mutex): two goroutines both have a pointer to a `map`; they lock/unlock to read and write.
- Communicating (channel): one goroutine owns the map; others send requests through a channel and receive responses.

The channel approach eliminates the shared mutable state entirely — there's nothing to lock. It also makes data flow and ownership explicit in the code.

The proverb's limit: it doesn't mean "always use channels." Turning every shared counter into a channel request-response roundtrip is an anti-pattern with real overhead and unnecessary complexity. The proverb guides you toward the right *design* — channels for ownership and pipelines, mutexes for efficient shared state protection.
:::

::: details Q: When should you use a channel over a mutex?
Use channels when:

1. **Ownership transfer**: you want exactly one goroutine to own a value at a time — the sender gives up access on send.
2. **Pipelines**: stages that produce and consume streams of values.
3. **Fan-out / fan-in**: distributing work to N workers or collecting results from N goroutines.
4. **Lifecycle signalling**: broadcasting a done/cancel event to multiple goroutines via `close(done)`.
5. **Rate limiting / throttling**: a buffered channel of N tokens is a semaphore.

Channels are awkward when: the state needs random-access reads by multiple goroutines (e.g., a shared cache with concurrent lookups), because you'd need a per-key serialization bottleneck.

See [Channels & select](./go-channels-select) for close semantics and select patterns.
:::

::: details Q: When should you use a mutex over a channel?
Use a mutex (or atomic) when:

1. **Protecting a struct's fields**: a `Cache` with a `map` and a `sync.RWMutex` is straightforward; wrapping map access in channels adds goroutines, scheduler overhead, and deadlock risk.
2. **Shared counters / gauges**: `sync/atomic` or a Mutex around an `int64` is 5–50 ns; a channel roundtrip is 200–500 ns.
3. **Read-heavy shared state**: `sync.RWMutex` lets many readers proceed concurrently.
4. **Avoiding goroutine proliferation**: channels require goroutines on both ends; a mutex doesn't.

Rule of thumb: if the critical section is "read or write a field," use a mutex. If the critical section is "hand this value to another goroutine for processing," use a channel.

See [sync Primitives](./go-sync-primitives) for mutex/RWMutex guidance.
:::

::: details Q: What are the failure modes specific to each approach?
**Channel failure modes**:
- **Deadlock**: send with no receiver, receive with no sender, or circular waits. The runtime detects the all-goroutines case; partial deadlocks (goroutine leaks) are invisible to it.
- **Goroutine leaks**: a goroutine blocked forever on a channel with no counterpart. See [Goroutine Leaks](./go-goroutine-leaks).
- **Overhead on hot paths**: a channel op involves a goroutine park/unpark cycle through the scheduler (~200–500 ns). For a counter incremented millions of times per second, this is unacceptable.

**Mutex failure modes**:
- **Forgotten unlock**: if you return early without unlocking, all subsequent lockers deadlock. Always `defer mu.Unlock()`.
- **Lock contention**: a hot mutex serializes goroutines. Profile with `go tool pprof` mutex profile.
- **Copying sync types**: copying a Mutex gives two independent primitives and silently breaks the invariant (`go vet` catches this).
- **Lock ordering violations** with multiple mutexes: always acquire in a consistent global order to prevent deadlock.
:::

::: details Q: Is there a decision flowchart for the channels-vs-mutexes choice?
A practical heuristic:

```
Are you transferring ownership or coordinating a pipeline?
  YES → channel

Are you signalling completion to multiple waiters (broadcast)?
  YES → close(chan struct{}) or sync.Cond

Are you protecting shared fields / a cache / a counter?
  YES → sync.Mutex or sync.RWMutex or sync/atomic

Is it a simple integer counter under very high contention?
  YES → sync/atomic (LoadInt64 / AddInt64)
```

When both could work, prefer the one with **fewer goroutines** and **simpler ownership model**. Channels add concurrency; they don't reduce complexity for free. Performance-sensitive code should benchmark both — the difference can be 10×.
:::

## Common follow-ups

- How do you implement a semaphore in Go and when is a buffered channel the right primitive?
- What is `sync/atomic` and how does it differ from a Mutex in memory-ordering guarantees?
- How would you design a concurrent LRU cache in Go — channel-based actor or mutex-guarded struct?
- When is `sync.Map` preferable to a `map` + `sync.RWMutex`?
