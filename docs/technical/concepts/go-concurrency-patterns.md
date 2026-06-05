---
title: Concurrency Patterns
description: Worker pools, fan-out/fan-in, pipelines, and errgroup — when to use each and how to avoid leaks.
tags: [concept, golang, concurrency, patterns]
category: tech-concepts
status: draft
---

# Concurrency Patterns

::: details Q: What is a worker pool and why do you bound concurrency?
A worker pool launches N goroutines that each consume from a shared jobs channel, processing work concurrently but with a fixed upper bound.

```go
func workerPool(ctx context.Context, jobs <-chan Job, n int) {
    var wg sync.WaitGroup
    for range n {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := range jobs { // exits when jobs is closed
                j.Process(ctx)
            }
        }()
    }
    wg.Wait()
}
```

**Why bound**: unbounded `go process(j)` for each job means memory and resource usage grows with the queue length. With N=100 DB-hitting workers you make at most 100 concurrent DB calls — matching your connection pool size. Without a bound, a burst of 10,000 requests spawns 10,000 goroutines opening 10,000 connections, exhausting the pool and crashing.

Choosing N: start with `runtime.GOMAXPROCS(0)` for CPU-bound work; for I/O-bound work tune to your downstream resource limit (DB pool size, API rate limit).

Drain pattern: close the `jobs` channel after all work is submitted; workers exit the `range` loop naturally. Always call `wg.Wait()` before returning.
:::

::: details Q: Describe the fan-out/fan-in pattern and when to apply it.
**Fan-out**: distribute work from one input channel to N worker goroutines, each processing independently and writing to their own output channel.

**Fan-in**: merge N output channels into one channel for a single downstream consumer.

```go
func fanIn(ctx context.Context, channels ...<-chan Result) <-chan Result {
    out := make(chan Result)
    var wg sync.WaitGroup
    for _, ch := range channels {
        wg.Add(1)
        ch := ch
        go func() {
            defer wg.Done()
            for r := range ch {
                select {
                case out <- r:
                case <-ctx.Done():
                    return
                }
            }
        }()
    }
    go func() { wg.Wait(); close(out) }()
    return out
}
```

Use when: tasks are independent and results can be processed in any order. Avoid when: ordering matters (use indexed results instead) or when fan-in overhead exceeds the parallelism benefit (tight loop with trivial work).

Critical: always wire `ctx` into the merge goroutines. Without it, goroutines block forever on `out <- r` if the consumer stops. See [Goroutine Leaks](./go-goroutine-leaks).
:::

::: details Q: How does a pipeline pattern work and how do you propagate shutdown?
A pipeline chains stages via channels: each stage reads from its input channel, transforms the data, and writes to its output channel.

```go
func generate(ctx context.Context, nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            select {
            case out <- n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

func square(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            select {
            case out <- n * n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}
```

Shutdown propagation: cancel the context → every stage sees `ctx.Done()` and returns → `defer close(out)` fires → downstream stages exit their `range` loops. This is the idiomatic shutdown path.

The alternative (a `done <-chan struct{}` you close manually) works but adds boilerplate. Prefer context since it composes with deadlines and carries through library calls. See [context.Context](./go-context).
:::

::: details Q: What does errgroup give you over a raw WaitGroup?
`golang.org/x/sync/errgroup` wraps `WaitGroup` with:
1. **First-error propagation**: `Wait()` returns the first non-nil error from any goroutine.
2. **Context cancellation**: `errgroup.WithContext` creates a derived context that is cancelled when the first goroutine returns an error — signalling siblings to stop.
3. **Concurrency limit**: `g.SetLimit(n)` caps concurrent goroutines (like a semaphore), no separate worker pool needed.

```go
g, ctx := errgroup.WithContext(context.Background())
g.SetLimit(10) // at most 10 concurrent goroutines

for _, url := range urls {
    url := url
    g.Go(func() error {
        return fetch(ctx, url)
    })
}

if err := g.Wait(); err != nil {
    log.Fatal(err) // first error; siblings have been cancelled via ctx
}
```

Trade-off: errgroup collects only the **first** error. If you need all errors (e.g., a batch validation), accumulate them separately with a mutex-protected slice. Also: after `Wait()` the context is done — don't reuse it for subsequent work.
:::

::: details Q: How can every concurrency pattern leak goroutines, and how do you prevent it?
Every pattern has a "leak path" — a goroutine blocked forever because its counterpart is gone:

| Pattern | Leak scenario | Prevention |
|---------|--------------|------------|
| Worker pool | Consumer exits early; workers block on `jobs <- item` | Close `jobs` after submission; drain on ctx cancel |
| Fan-in | Merge goroutine blocks on `out <- r` with no reader | Wire `ctx.Done()` into every send in merge goroutines |
| Pipeline | Stage goroutine blocks on downstream channel with no reader | Cancel context; stages check `ctx.Done()` on every send |
| errgroup | Sibling goroutines ignore the cancelled context | Pass ctx into every sub-call; check `ctx.Err()` in loops |

General rules:
- Every goroutine that does a channel send must also select on a cancellation signal.
- Close channels from the **sender** side; receivers exit `range` loops cleanly.
- In tests, use `goleak.VerifyNone(t)` at the end to assert no leaked goroutines.

See [Goroutine Leaks](./go-goroutine-leaks) for detection tools and monitoring signals.
:::

## Common follow-ups

- How do you implement backpressure in a pipeline when a slow downstream stage causes the upstream to stall?
- What's the difference between `errgroup.SetLimit` and a semaphore implemented with a buffered channel?
- How do you collect all errors (not just the first) from a parallel batch using errgroup?
- When would you choose a pipeline over a worker pool for the same workload?
