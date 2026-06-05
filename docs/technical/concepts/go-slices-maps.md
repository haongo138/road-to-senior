---
title: Slices & Maps Internals
description: How slice headers, append, and map internals work — aliasing, memory leaks, and concurrency pitfalls.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# Slices & Maps Internals

::: details Q: What is a slice header and how does append work?
A slice is a **three-word struct** in the Go runtime:
```
[ ptr *T | len int | cap int ]
```
- `ptr`: pointer to the backing array.
- `len`: number of elements accessible.
- `cap`: total elements in the backing array from `ptr` onward.

When you pass a slice to a function, the *header* is copied — the backing array is shared. Mutations to elements are visible to the caller; but `append` inside the function won't affect the caller's header if reallocation occurs.

`append` behavior:
- If `len < cap`: writes the new element at `ptr[len]`, returns a header with `len+1`. The backing array is **reused** — the caller's slice still points to the same array but doesn't see the new element (its `len` is unchanged).
- If `len == cap`: allocates a new, larger array (growth factor: 2× up to ~256 elements, then ~1.25× with smoothing), copies existing data, writes new element. Returns a header with a **different `ptr`**.

```go
a := make([]int, 3, 5) // len=3, cap=5
b := append(a, 99)     // len=4, cap=5 — same backing array!
a[0] = 7               // visible through b[0] as well
fmt.Println(b[0])      // 7 — aliasing!
```

Always assign the result of `append` back to the original variable, or to a new one with intent.
:::

::: details Q: What is the slice aliasing gotcha, and how can a sub-slice leak memory?
Two slices **alias** when they share a backing array. This leads to subtle mutation bugs:

```go
orig := []int{1, 2, 3, 4, 5}
sub := orig[1:3]       // sub = [2, 3]; shares orig's array
sub[0] = 99            // orig[1] is now 99
fmt.Println(orig)      // [1 99 3 4 5]
```

**Memory leak via sub-slice**: a sub-slice keeps the **entire** backing array alive as long as the sub-slice exists. If you extract a small slice from a large array (e.g., reading a 4 KB network buffer and returning a 6-byte slice), the full 4 KB stays on the heap.

```go
// BAD: small slice keeps large buffer alive
func first6(data []byte) []byte {
    return data[:6]
}

// GOOD: copy to new, minimal backing array
func first6(data []byte) []byte {
    out := make([]byte, 6)
    copy(out, data[:6])
    return out
}
```

**Three-index slice** `s[lo:hi:max]` lets you cap the capacity of a sub-slice, preventing accidental writes beyond `hi` — useful when passing a sub-slice to code that may `append` into it:
```go
safe := buf[lo:hi:hi]  // cap == len; any append will reallocate
```

When in doubt: `copy` into a fresh slice for long-lived data derived from a large buffer.
:::

::: details Q: How do Go maps work internally, and what are their key constraints?
Go maps are **hash tables** implemented in the runtime (`runtime/map.go`). Key points:

- **Bucket structure**: entries are grouped into 8-element buckets; overflow buckets are chained.
- **Load factor** ~6.5 elements/bucket triggers growth (double the number of buckets); growth is **incremental** — old buckets are evacuated lazily on writes.
- **Randomized iteration order**: the start bucket is chosen randomly each time you call `range`. This is intentional — code must never depend on map iteration order.
- **Zero value**: a nil map is safe to *read* (returns the zero value and `false`) but a write to a nil map panics.

```go
var m map[string]int  // nil map
_ = m["key"]          // ok: returns 0, false
m["key"] = 1          // PANIC: assignment to entry in nil map
```

- **Cannot take the address of a map element**: `&m["key"]` does not compile. Values are not at stable addresses because growth moves them.
- **Delete during iteration**: safe — `delete` on a key you haven't visited yet simply skips it when you reach it.
:::

::: details Q: Why are maps not concurrency-safe, and what are the alternatives?
Go's map is **not safe for concurrent read-write access**. A concurrent write (from any goroutine) while another reads or writes triggers a **fatal runtime error** — not a data race that the race detector catches after the fact, but an immediate crash:
```
fatal error: concurrent map read and map write
```

The runtime added a detection mechanism (a "hashWriting" flag) precisely because the corruption is silent and dangerous otherwise.

**Alternatives**:

1. **`sync.RWMutex` wrapping a plain map**: most common; gives full control over granularity.
```go
type SafeMap struct {
    mu sync.RWMutex
    m  map[string]int
}
func (s *SafeMap) Get(k string) (int, bool) {
    s.mu.RLock()
    defer s.mu.RUnlock()
    v, ok := s.m[k]
    return v, ok
}
func (s *SafeMap) Set(k string, v int) {
    s.mu.Lock()
    defer s.mu.Unlock()
    s.m[k] = v
}
```

2. **`sync.Map`**: optimized for two specific patterns — entries written once and read many times, or disjoint sets of goroutines reading/writing distinct keys. Uses internal read/write separation to reduce contention. Slower than a mutex-protected map for the general case; harder to range over.

3. **Sharding**: for very high throughput, shard the map into N buckets each with its own mutex, hashing the key to pick the shard.

Run with `go test -race` or `go run -race` to catch unsynchronized access during development.
:::

::: details Q: What is the difference between a nil slice and an empty slice, and why does it matter?
```go
var s []int          // nil slice: ptr=nil, len=0, cap=0
e := []int{}         // empty slice: ptr=(non-nil sentinel), len=0, cap=0
e2 := make([]int, 0) // also empty (non-nil)
```

Both are safe to `range`, `append` to, and `len`/`cap`. In most code they're interchangeable.

**Where it matters:**

- **JSON marshaling**: a nil slice encodes as `null`; an empty slice encodes as `[]`.
```go
type Resp struct{ Items []string }
json.Marshal(Resp{})           // {"Items":null}
json.Marshal(Resp{Items: []string{}}) // {"Items":[]}
```
API clients often behave differently on `null` vs `[]`. Return `[]string{}` (or `make([]string, 0)`) when you mean "empty list".

- **`reflect.DeepEqual`**: `nil` slice and empty slice are *not* equal, which can cause test failures.
```go
reflect.DeepEqual([]int(nil), []int{}) // false
```

- **Comparisons**: `s == nil` tests for nil; you can't `==` compare non-nil slices (use `reflect.DeepEqual` or `slices.Equal`).

Convention: return nil slices when "no data" is semantically meaningful (e.g., a function that may return nothing); return empty slices when you always intend to return a collection (even if empty) — especially across JSON API boundaries.
:::

## Common follow-ups

- How does the three-index slice expression `s[lo:hi:max]` prevent capacity leaks in practice?
- What happens to map memory after a large number of deletes — does it shrink?
- When is `sync.Map` actually faster than `sync.RWMutex` + map?
- How does `slices.Clip` help with backing-array memory leaks?
