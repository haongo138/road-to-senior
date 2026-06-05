---
title: Goroutine Leaks
description: What goroutine leaks are, how to detect them, and patterns to prevent them.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Goroutine Leaks

::: details Q: What is a goroutine leak and why is it serious?
A goroutine leak is a goroutine that **blocks indefinitely** with no path to exit. Because Go's GC only collects objects with no live references, a blocked goroutine's stack (and everything it references) can never be collected. Over time, leaked goroutines accumulate:

- **Memory growth**: each goroutine holds a stack (2 KB minimum, growing on demand) plus all heap objects it keeps alive.
- **Handle leaks**: if the goroutine holds an open connection, file descriptor, or lock, those leak too.
- **Invisible to the runtime deadlock detector**: the detector only fires when *all* goroutines are blocked. A few leaked goroutines alongside running ones are silent.

In a long-running server, even a small per-request leak rate (1 goroutine per request × 100 req/s) can exhaust memory in hours.
:::

::: details Q: What are the common causes of goroutine leaks?
**1. Send to a channel with no receiver**:
```go
func notify(ch chan<- int, v int) {
    ch <- v // blocks forever if nobody reads ch
}
go notify(results, 42) // leaked if caller stops reading
```

**2. Receive from a channel that is never closed or written to**:
```go
ch := make(chan struct{})
go func() {
    <-ch // blocks forever if nobody sends or closes
}()
// forgot to close(ch) or send
```

**3. Missing `cancel()` call**:
```go
ctx, cancel := context.WithTimeout(parent, 5*time.Second)
// forgot: defer cancel()
// The timer goroutine inside context leaks until parent is cancelled
```

**4. Range over a channel that is never closed**:
```go
go func() {
    for v := range jobs { // blocks forever if jobs is never closed
        process(v)
    }
}()
// forgot to close(jobs) after submitting all work
```

See [context.Context](./go-context) for the cancel-leak detail.
:::

::: details Q: How do you detect goroutine leaks?
**In tests — goleak**:
```go
import "go.uber.org/goleak"

func TestFetch(t *testing.T) {
    defer goleak.VerifyNone(t) // fails test if goroutines leak
    // ... test code
}
```
`goleak` snapshots goroutines at test start and end, reporting any new ones that remain after the test finishes. This is the most actionable detection method.

**At runtime — runtime.NumGoroutine**:
```go
// Expose as a metric
metrics.Gauge("goroutines").Set(float64(runtime.NumGoroutine()))
```
A monotonically increasing goroutine count is the key signal of a leak.

**pprof goroutine profile**:
```
GET /debug/pprof/goroutine?debug=2
```
Prints every goroutine's full stack trace. Look for stacks all sharing the same blocking call site — that's the leak point. Can be taken while the service is live.

**`go tool pprof` diff**: take two goroutine profiles 60 seconds apart; goroutines that appear in the second but not the first are the leaking ones.
:::

::: details Q: How do you prevent goroutine leaks in practice?
**Rule 1: Always wire cancellation into goroutines that do channel ops**:
```go
go func() {
    select {
    case out <- result:
    case <-ctx.Done(): // escape hatch
        return
    }
}()
```

**Rule 2: Close channels from the owner (sender)**. Receivers exit `range` loops when the channel closes; they can't close it themselves.

**Rule 3: Always `defer cancel()`** immediately after any `context.With*` call.

**Rule 4: Use buffered channels to decouple sender lifetime from receiver**:
```go
results := make(chan Result, len(items)) // sender never blocks
for _, item := range items {
    go func(item Item) { results <- process(item) }(item)
}
```
With a buffer sized to the number of senders, each goroutine can send and exit regardless of when the consumer reads.

**Rule 5: Bound concurrency** — an unbounded `go f()` in a hot path is a leak waiting to happen under load. Use a worker pool or `errgroup.SetLimit`.
:::

::: details Q: What should you monitor in production and what's the triage process?
**Monitor**:
- `runtime.NumGoroutine()` as a gauge — alert on sustained growth (e.g., >10% increase per 10 minutes).
- Memory (`runtime.MemStats.HeapInuse`) — a goroutine leak eventually shows as heap growth.
- Both together: heap growing *and* goroutine count growing is a strong signal.

**Triage process**:
1. Take a goroutine profile: `curl https://host/debug/pprof/goroutine?debug=2 > g1.txt`
2. Wait 60 seconds, take another: `> g2.txt`
3. `diff g1.txt g2.txt` — new goroutines in g2 point to the leak site.
4. Find the common stack frame in the leaked goroutines — that's the blocking call.
5. Trace backward to the goroutine's creator to find the missing cancellation or close.

A goroutine leaked in a library call is harder: the stack shows the library frame. Check if the library accepts a context and whether you're passing it correctly.
:::

## Common follow-ups

- How does `goleak.IgnoreCurrent()` help when testing code with background goroutines from third-party packages?
- What's the safest way to shut down a fan-in pattern without leaking the merge goroutines?
- How do you add goroutine-count alerting to a Prometheus-instrumented Go service?
- Can a goroutine leak cause a file descriptor leak, and how would you correlate the two in production?
