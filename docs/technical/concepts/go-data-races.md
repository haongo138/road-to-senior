---
title: Data Races & the Memory Model
description: What data races are, why they cause undefined behavior, the race detector, and happens-before.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Data Races & the Memory Model

::: details Q: What is a data race and why is it undefined behavior rather than just a wrong value?
A data race occurs when **two goroutines access the same memory location concurrently, at least one access is a write, and there is no synchronization** between them.

"Undefined behavior" means the compiler and CPU are free to reorder, cache, or optimize the accesses in ways that assume no concurrent modification. Concretely:
- The CPU may hold the write in a store buffer; the reader may see a stale value from its cache.
- The compiler may hoist a read out of a loop because it "knows" no one else writes the variable.
- On weak-memory architectures (ARM), stores from one core may become visible to other cores in a different order.

So the bug isn't just "you might read the old value" — it's "the program's behavior becomes unpredictable in ways that can corrupt unrelated memory" (e.g., a struct partially written, a slice header with a stale length but updated pointer).

Go's memory model (go.dev/ref/mem) says: **a data race on any non-atomic, non-synchronized value is undefined behavior**.
:::

::: details Q: How do you use the race detector, and what are its limits?
Enable with the `-race` flag:

```bash
go test -race ./...
go run -race main.go
go build -race -o server_race ./cmd/server
```

The race detector **instruments every memory access** at compile time and tracks accesses at runtime. When two goroutines access the same address concurrently without synchronization, it prints a detailed report with stack traces for both accesses.

Costs: ~5–10× CPU overhead, ~2–8× memory overhead. Run in CI and test suites, not production.

**Limits**:
- It only detects races that **actually execute** during the run. A race in an untested code path is invisible.
- It's necessary, not sufficient: a program that passes `-race` is not proven race-free — just that no race fired in that execution.
- It doesn't detect all concurrency bugs (e.g., atomicity violations, deadlocks, logic races).

Best practice: run `-race` in all test runs (unit + integration), and in a production-like staging environment with real traffic.
:::

::: details Q: What does "happens-before" mean in Go's memory model and what establishes it?
**Happens-before** is a formal ordering guarantee: if event A happens-before event B, then B is guaranteed to observe all writes made by A (and everything A observed).

Synchronization operations that establish happens-before in Go:

| Operation | Guarantee |
|-----------|-----------|
| `ch <- v` (send) | happens-before the corresponding `<-ch` (receive) completes |
| `close(ch)` | happens-before a receive that returns zero because the channel is closed |
| `sync.Mutex` unlock | happens-before the next lock |
| `sync.WaitGroup.Done()` | happens-before `Wait()` returns |
| `sync/atomic` ops | happens-before subsequent atomic ops on the same variable (since Go 1.19) |
| `init()` completion | happens-before `main.main` starts |

Anything not in that list is unordered. A write in goroutine A followed by a read in goroutine B with no synchronization in between has **no guaranteed ordering**.
:::

::: details Q: What are the classic races in Go that trip people up?
**Concurrent map access**:
```go
m := map[string]int{}
go func() { m["a"] = 1 }()
go func() { _ = m["a"] }() // concurrent read+write → fatal runtime error
```
Maps are not safe for concurrent use. The runtime detects concurrent map writes and panics (`concurrent map write`) but read+write without the write being concurrent may silently corrupt. Use `sync.Map` or a `sync.RWMutex`.

**Pre-1.22 loop variable capture**:
```go
// Go < 1.22: all goroutines see the same `v` (last iteration's value)
for _, v := range items {
    go func() { process(v) }() // BUG
}
// Fix (Go < 1.22): shadow the variable
for _, v := range items {
    v := v
    go func() { process(v) }()
}
```
Go 1.22+ captures loop variables by value per iteration, fixing this by default.

**Unsynchronized flags**:
```go
var ready bool
go func() { ready = true }()   // write
if ready { ... }               // concurrent read — data race
```
Use `sync/atomic.Bool` or a channel to signal readiness.
:::

::: details Q: How does correctness from the race detector differ from correctness by design?
The race detector tells you a race happened. It doesn't tell you your synchronization design is correct even when no race fires.

**Correctness from design** means: for every shared variable, you've identified who owns it, what synchronizes access, and verified that every code path acquires the right lock or channels data through the right primitive — before testing. This is the only way to be confident about untested paths.

Practical discipline:
1. Design ownership first: for each shared resource, document which goroutine(s) access it and what synchronizes them.
2. Use `-race` to catch mistakes in design.
3. Use `go vet` to catch forgotten locks and sync-type copies.
4. For critical code, add invariant comments (e.g., `// mu must be held`) and consider the `go.uber.org/nilaway` + static analysis tools.

The race detector is your safety net, not your architecture.
:::

## Common follow-ups

- How does `sync/atomic` compare to a Mutex in terms of memory-ordering guarantees post-Go 1.19?
- What's the difference between a data race and a race condition (logic race)?
- How do you diagnose a race that only appears under production load but not in tests?
- Why does the Go runtime panic on concurrent map writes but not concurrent map reads?
