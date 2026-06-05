---
title: Channels & select
description: Unbuffered vs buffered channels, close semantics, select, and deadlock pitfalls.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Channels & select

::: details Q: What is the difference between an unbuffered and a buffered channel, and how do you choose the buffer size?
An **unbuffered channel** (`make(chan T)`) requires both sender and receiver to be ready at the same time — it's a synchronization point / handoff. The send blocks until a receiver arrives and vice versa. Use it when you want the producer to wait for the consumer to acknowledge receipt.

A **buffered channel** (`make(chan T, n)`) allows up to `n` sends before blocking. It **decouples** producer and consumer pace: the producer can run ahead by `n` items. Use it when:
- The producer has bursty output and you want to absorb spikes without dropping work.
- The buffer is your backpressure knob: when full the producer slows down.

Sizing heuristics: for a worker pool jobs channel, `n = len(workers)` is a common starting point; for a rate-smoothing buffer, measure the burst size empirically. **Avoid large buffers as a substitute for fixing slow consumers** — they hide backpressure and can grow memory unboundedly if the consumer stalls.
:::

::: details Q: What are the rules for closing a channel, and what happens when you violate them?
| Operation | On open channel | On closed channel | On nil channel |
|-----------|----------------|-------------------|----------------|
| Send | Blocks or proceeds | **panic** | Blocks forever |
| Receive | Blocks or proceeds | Returns zero value, `ok=false` | Blocks forever |
| Close | Closes it | **panic** | **panic** |

The golden rules:
1. **Only the sender/owner closes a channel** — never the receiver.
2. **Close exactly once** — use `sync.Once` or a done-flag if multiple writers share ownership.
3. Check `ok` in `v, ok := <-ch` when you need to distinguish a real zero value from a closed channel.

```go
for v := range ch { // safe: loop exits when ch is closed
    process(v)
}
```

The `range` form is the idiomatic receiver pattern; it handles the `ok` check internally.
:::

::: details Q: How does select work, and what are its non-obvious behaviors?
`select` blocks until one of its cases can proceed, then executes that case. If **multiple cases are ready simultaneously**, Go picks one **uniformly at random** — this is intentional to avoid starvation, but it means you cannot rely on case order for priority.

```go
select {
case msg := <-work:
    handle(msg)
case <-ctx.Done():
    return ctx.Err()
default:               // non-blocking: runs immediately if no case is ready
    // do other work
}
```

Key patterns:
- **`default`** makes select non-blocking — useful for try-send/try-receive.
- **Timeout**: `case <-time.After(d)` creates a timer per call; prefer `time.NewTimer` and reuse for hot paths.
- **Disable a case**: assign the channel to `nil` — a nil channel case is never selected. Useful to stop reading from one of two channels after it's done.

```go
var second <-chan int = nil // this case is permanently disabled
select {
case v := <-first:  process(v)
case v := <-second: unreachable()
}
```
:::

::: details Q: What causes a deadlock with channels and how do you diagnose it?
A deadlock occurs when all goroutines are blocked waiting on each other. Go's runtime detects the **all-goroutines-blocked** condition and panics with `fatal error: all goroutines are asleep - deadlock!`.

Common causes:
- Sending to an unbuffered channel with no receiver goroutine: `ch <- v` in `main` with nobody reading.
- Receiving from a channel that is never written to or closed: `<-ch` blocks forever.
- Circular wait: goroutine A waits on goroutine B, B waits on A.
- Forgetting to close a `range` loop's channel — the range blocks forever even after all data is sent.

Diagnosis: the deadlock message prints the stack of every goroutine. Also use `pprof`'s goroutine profile (`/debug/pprof/goroutine?debug=2`) in long-running services to find goroutines stuck in channel ops.

The runtime deadlock detector only fires when **all** goroutines are blocked. A partial deadlock (some goroutines leak, others run) is invisible to it — that's the goroutine leak problem.
:::

::: details Q: When should you prefer channels over mutexes, and when is a channel the wrong tool?
Channels shine for:
- **Ownership transfer**: pass a value to exactly one consumer — no shared state at all.
- **Pipelines and fan-out**: goroutines linked by channels are naturally composable.
- **Signaling / lifecycle events**: `close(done)` to broadcast completion to N receivers.

Channels are the wrong tool when you just need to **protect a shared field**. Wrapping a counter in a `chan int` for increment/decrement adds goroutine overhead, a full round-trip through the scheduler, and deadlock risk — a `sync/atomic` or `sync.Mutex` is simpler and 10–100× faster.

Rule of thumb: if you're "communicating" (handing off data or ownership), use a channel. If you're "guarding" (multiple goroutines need to read/write the same memory), use a mutex or atomic. See [Channels vs Mutexes](./go-channels-vs-mutexes) for a deeper comparison.
:::

## Common follow-ups

- How do you implement a timeout-with-retry pattern using `select` and `time.NewTimer`?
- What's the memory overhead of a buffered channel versus a slice used as a queue?
- Why does `time.After` leak memory in loops and how do you fix it?
- How do you safely fan-in results from N goroutines into one channel without data races?
