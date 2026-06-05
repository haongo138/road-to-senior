---
title: GC & Escape Analysis
description: How Go's concurrent tri-color GC works, what controls it, and how the compiler decides stack vs heap.
tags: [concept, golang, runtime]
category: tech-concepts
status: draft
---

# GC & Escape Analysis

::: details Q: How does Go's garbage collector work, and what are its key design constraints?
Go's GC is a **concurrent, tri-color mark-sweep** collector. It runs mostly alongside application goroutines (not a stop-the-world pause for the full collection), which keeps tail latency low — production targets are typically **< 1 ms STW pauses**, and < 100 µs is common.

The three phases:
1. **Mark setup** — short STW to enable write barriers.
2. **Concurrent mark** — goroutines and GC workers run concurrently; the write barrier ensures newly allocated or moved pointers are seen.
3. **Mark termination** — short STW to finalize mark state.
4. **Sweep** — concurrent, reclaims unmarked spans.

Key design constraints that affect your code:
- **Non-generational**: every GC cycle scans the full live set, not just "young" objects. Short-lived objects in the old generation aren't batched for cheap collection. → High allocation rates are more expensive than in JVM or .NET GCs.
- **Non-compacting**: memory is not moved. Pointer addresses remain stable (no object pinning needed for CGo), but the heap can fragment over time.
- **Write barrier cost**: enabled during concurrent mark; every pointer store incurs a small overhead.

Trade-off: low, predictable latency at the cost of potentially higher memory usage and CPU for high-allocation workloads. JVM G1/ZGC can achieve higher throughput when you're willing to tune generations.
:::

::: details Q: What do GOGC and GOMEMLIMIT control, and when do you change them?
**`GOGC`** (default `100`) is a percentage: GC triggers when the live heap has grown by `GOGC`% since the last collection. `GOGC=200` means GC fires when heap doubles — fewer cycles, more memory used. `GOGC=off` disables GC entirely (batch jobs only).

**`GOMEMLIMIT`** (Go 1.19+) sets a **soft total memory limit** for the runtime. When the process approaches the limit, the GC is triggered more aggressively, overriding `GOGC`. This prevents OOM kills more predictably than relying on `GOGC` alone.

Typical tuning:
```
# container with 512 MB limit → let runtime use ~400 MB before GC fights back
GOMEMLIMIT=400MiB
GOGC=100          # keep default; GOMEMLIMIT is the real guard
```

When to raise `GOGC`:
- Throughput-sensitive batch jobs where memory headroom is ample.
- Profiling shows GC consuming > 5–10% CPU and allocations are unavoidable.

When to set `GOMEMLIMIT`:
- Any containerized workload with a hard memory limit — this is now the recommended primary knob (Go 1.21+ docs suggest setting it to ~90% of the container limit).

Don't tune blindly: measure with `runtime/metrics`, `pprof` heap profiles, or Prometheus `go_gc_*` metrics first.
:::

::: details Q: What is escape analysis, and how does the compiler decide stack vs heap?
The compiler runs **escape analysis** during compilation to determine the *lifetime* of each allocation. Variables that do not outlive their function frame are placed on the **goroutine's stack** (very fast; no GC involvement — reclaimed when the frame pops). Variables that *escape* are placed on the **heap** (slower allocation, GC pressure).

Inspect escape decisions:
```bash
go build -gcflags="-m -m" ./... 2>&1 | grep escape
```

Common escape triggers:
- **Returning a pointer to a local**: the local must outlive the frame → heap.
- **Storing into an interface**: the compiler loses concrete type info; the value must be heap-addressable.
- **Closures capturing a variable by reference** (not by value).
- **Slices that grow beyond a stack-allocated backing array** (e.g., `make([]int, 0, n)` where `n` is too large or dynamic).
- **`fmt.Println` and friends**: they accept `interface{}`, so arguments escape.

```go
func stackAlloc() int {
    x := 42   // stays on stack; x doesn't escape
    return x
}

func heapAlloc() *int {
    x := 42   // escapes: pointer returned to caller
    return &x
}
```

Trade-off: stack allocation is essentially free (bump pointer); heap adds allocator overhead (~25 ns per alloc) plus GC scan cost. But micro-optimizing escapes without profiling is premature — focus on hot loops identified by `pprof`.
:::

::: details Q: How do you measure and diagnose GC pressure in production?
**Primary tools:**

| Signal | How to get it |
|---|---|
| GC CPU % | `runtime/metrics`: `/gc/cpu:user-time` |
| Heap in-use | `pprof` heap profile (`go tool pprof -alloc_objects`) |
| GC pause | `GODEBUG=gctrace=1` prints per-cycle STW durations |
| Alloc hotspot | `pprof` with `-sample_index=alloc_space` |

```bash
# quick in-process heap profile
curl http://localhost:6060/debug/pprof/heap > heap.prof
go tool pprof -http=: heap.prof
```

Warning signs: GC CPU > 10% of total CPU; P99 request latency spikes that correlate with GC cycles; heap in-use oscillates widely (indicates many short-lived large allocations).

Fix strategies (in order of ROI):
1. **Reduce allocations**: use `sync.Pool` for frequently allocated/freed objects, pre-size slices/maps, avoid `fmt.Sprintf` in hot paths (use `strconv`).
2. **Reduce live set size**: release references sooner; avoid large global caches without a TTL eviction.
3. **Tune `GOMEMLIMIT`/`GOGC`**: only after (1) and (2).
:::

::: details Q: What is sync.Pool and when does it help — or hurt?
`sync.Pool` is a cache of reusable objects **scoped to GC cycles**. Objects in the pool may be collected at any GC; the pool is not a persistent store.

```go
var bufPool = sync.Pool{
    New: func() any { return new(bytes.Buffer) },
}

func handler(w http.ResponseWriter, r *http.Request) {
    buf := bufPool.Get().(*bytes.Buffer)
    buf.Reset()
    defer bufPool.Put(buf)
    // ... use buf
}
```

**When it helps**: short-lived, frequently allocated objects of similar size (buffers, encoder scratch space). Reduces GC pressure by reusing memory across requests.

**When it hurts or misleads**:
- Objects with finalizers or external resources — pooled items won't be closed reliably.
- Items that vary wildly in size — you end up keeping oversized allocations alive.
- As a general cache — pool objects can be evicted at any GC cycle; for persistent caching, use a map with an eviction policy.
- Measure before adding: `sync.Pool` adds indirection; if the allocation wasn't a bottleneck, it's complexity for nothing.
:::

## Common follow-ups

- How does the write barrier interact with goroutine scheduling during concurrent mark?
- What's the difference between `alloc_space` and `inuse_space` in heap profiles?
- When would you use `runtime.GC()` explicitly in tests or benchmarks?
- How does `GOGC=off` interact with `GOMEMLIMIT`?
