---
title: sync Primitives
description: Mutex, RWMutex, WaitGroup, Once, Pool — correct usage and classic mistakes.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# sync Primitives

::: details Q: When do you choose Mutex vs RWMutex, and when does RWMutex hurt?
`sync.Mutex` allows one goroutine at a time — reads and writes both block each other.

`sync.RWMutex` allows **many concurrent readers** (`RLock`/`RUnlock`) but only **one writer** (`Lock`/`Unlock`). It helps when reads vastly outnumber writes and the critical section is non-trivial.

When `RWMutex` hurts:
- **Short critical sections** (a field read/write): the extra bookkeeping of RWMutex can make it slower than a plain Mutex. Benchmark before switching.
- **Write-heavy workloads**: writers starve behind a thundering herd of readers (the Go implementation does give writers priority once one is waiting, but contention is still higher).
- **More cognitive overhead**: you must be sure `RLock` paths never mutate state — mixing up Lock/RLock under pressure is a common bug.

Default: reach for `sync.Mutex`. Upgrade to `RWMutex` only after profiling shows lock contention on a read-heavy path.
:::

::: details Q: What is the classic WaitGroup race and how do you prevent it?
The race is **calling `wg.Add(1)` inside the goroutine** you just launched:

```go
// WRONG: Add races with Wait
for _, item := range items {
    go func(item Item) {
        wg.Add(1)        // might run after wg.Wait() returns
        defer wg.Done()
        process(item)
    }(item)
}
wg.Wait()
```

If the goroutine is preempted before `Add(1)`, `Wait` can return while work is still pending.

Correct pattern — **Add before go**:

```go
for _, item := range items {
    wg.Add(1)
    go func(item Item) {
        defer wg.Done()
        process(item)
    }(item)
}
wg.Wait()
```

Also: never copy a `WaitGroup` — the copy's internal counter is separate. Always pass by pointer or embed in a struct accessed by pointer. `go vet` catches copies of sync types.
:::

::: details Q: What does sync.Once guarantee and what are its limits?
`sync.Once.Do(f)` ensures `f` is called **exactly once** across all goroutines, even if `Do` is called concurrently. It blocks all concurrent callers until `f` returns.

```go
var (
    instance *DB
    once     sync.Once
)

func GetDB() *DB {
    once.Do(func() {
        instance = connect() // called once; all others block until done
    })
    return instance
}
```

Limits:
- If `f` panics, `Once` considers it done — subsequent `Do` calls are no-ops. The panic propagates to the first caller but not subsequent ones (they return with `instance` still nil). Design initialization to not panic, or recover inside `f`.
- `Once` cannot be reset — it's for true one-time initialization. If you need retryable-on-failure init, you need a custom pattern.
:::

::: details Q: What is sync.Pool and when is it not a cache?
`sync.Pool` is a **thread-safe pool of temporary objects** that reduces GC pressure by reusing allocations. Get retrieves an object (or calls `New` if the pool is empty); Put returns it.

```go
var bufPool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
}

func encode(v any) []byte {
    buf := bufPool.Get().(*bytes.Buffer)
    buf.Reset()
    defer bufPool.Put(buf)
    json.NewEncoder(buf).Encode(v)
    return buf.Bytes()
}
```

**Not a cache**: the GC **clears the pool at every collection** (every two GC cycles since Go 1.13 via a victim cache mechanism). Objects you put in are not guaranteed to be there on the next Get. Never use Pool for objects that must survive across GC cycles (DB connections, open files, rate-limiters). Use a connection pool or a buffered channel for those.

Also: always `Reset()` or zero the object before returning it to the pool — you're handing it to an unknown next caller.
:::

::: details Q: What is the "never copy" rule for sync types?
`sync.Mutex`, `sync.RWMutex`, `sync.WaitGroup`, `sync.Cond`, and `sync.Once` all contain **internal state** (locks, counters) that is meaningless when copied. Copying one gives you two independent primitives with a shared starting state — any invariant they protect is immediately broken.

```go
type Cache struct {
    mu   sync.Mutex // embedded by value — OK
    data map[string]string
}

// WRONG: c passed by value copies the mutex
func process(c Cache) { c.mu.Lock(); ... }

// CORRECT: pass by pointer
func process(c *Cache) { c.mu.Lock(); ... }
```

`go vet` (and its underlying `copylocks` analyzer) will catch accidental copies of these types — run it in CI. The `noCopy` sentinel (`sync.noCopy`) is the mechanism that enables this detection.
:::

## Common follow-ups

- When would you reach for `sync/atomic` instead of a Mutex, and what are its memory-ordering guarantees?
- How does `sync.Cond` differ from a channel for signalling, and when is it the better choice?
- What's the difference between `sync.Pool`'s victim cache (Go 1.13+) and the older clear-on-GC behavior?
- How do you profile mutex contention in a running Go service?
