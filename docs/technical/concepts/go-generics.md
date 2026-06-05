---
title: Generics
description: Go generics — type parameters, constraints, GC-shape stenciling, and when to use vs interfaces vs concrete types.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# Generics

::: details Q: What are type parameters and constraints in Go generics?
Go 1.18 introduced generics via **type parameters** — brackets after the function or type name:
```go
func Map[S, T any](slice []S, f func(S) T) []T {
    out := make([]T, len(slice))
    for i, v := range slice {
        out[i] = f(v)
    }
    return out
}
```

A **constraint** is an interface that limits which types can be substituted for a type parameter. The built-in `any` allows all types; `comparable` allows types that support `==`/`!=` (required for map keys).

The `~` operator matches a type **and all types with that underlying type**:
```go
type Celsius float64

type Number interface {
    ~int | ~int64 | ~float32 | ~float64
}
// Celsius satisfies Number because its underlying type is float64
```

The standard library packages `cmp`, `slices`, and `maps` (Go 1.21) are built on these constraints and replace many hand-rolled utility functions:
```go
slices.Sort(s)                     // works for any []E where E is cmp.Ordered
slices.Contains(s, v)
maps.Keys(m)
```
:::

::: details Q: How are Go generics implemented — and what does GC-shape stenciling mean?
Go generics use **GC-shape stenciling** — *not* full monomorphization (one compiled copy per concrete type) like C++ templates or Rust generics.

The compiler groups types by their **GC shape** — roughly, types with the same pointer layout share a single compiled instantiation. All pointer types (`*T` for any `T`) share one shape; all `int`-sized non-pointer types share another.

When two types share a shape, the runtime uses a **dictionary** (a hidden extra argument) to hold type-specific metadata (size, equality function, hash function, interface method tables). The generic code calls through the dictionary for type-dependent operations.

Practical consequences:
- **Less code bloat** than full monomorphization — fewer binary size increases.
- **More indirection** than full monomorphization — calls through the dictionary prevent some optimizations (inlining, devirtualization). A generic function over pointer types may be slower than a type-specific function in hot paths.
- **Not zero-cost**: benchmarks on tight loops (sort, min/max) show generics can be within 5–10% of hand-coded concrete versions; with interface constraints the gap can be larger.

This is an implementation detail, not a language guarantee. The Go team may improve stenciling over time. Measure with benchmarks before concluding generics are too slow.
:::

::: details Q: When should you use generics vs interfaces vs concrete types?
**Use generics** when:
- The logic is **identical across multiple types** and differs only in the type (container types: `Stack[T]`, `Set[T]`; algorithms: `slices.Sort`, `Map`, `Filter`, `Reduce`).
- You want **compile-time type safety** without the runtime overhead of interface boxing.
- You are writing a library where callers provide the type.

**Use interfaces** when:
- The logic depends on **behavior** — different concrete types implement the same method differently (polymorphism). An `io.Writer` wraps many different outputs; that's behavioral, not structural.
- You want **runtime flexibility** — the concrete type isn't known at compile time.

**Use concrete types** when:
- Only one or two types are involved and they're not likely to grow. Don't genericize prematurely.
- The function is small and inlining matters — generic calls may not inline cleanly.

Rule of thumb from the Go team: **if you can't write the function at least twice with different types before reaching for a type parameter, you probably don't need generics yet.**

```go
// RIGHT: generic — same logic for any ordered type
func Min[T cmp.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}

// WRONG: genericizing a function that only ever serves one type
func ProcessUser[T User](u T) { ... } // just use User directly
```
:::

::: details Q: How do you write a useful generic function with a meaningful constraint?
A common pattern: a generic function that works on any map with string keys and numeric values:
```go
import "golang.org/x/exp/constraints" // or define your own

type Number interface {
    constraints.Integer | constraints.Float
}

func SumMap[V Number](m map[string]V) V {
    var total V
    for _, v := range m {
        total += v
    }
    return total
}

// Usage — no explicit type argument needed; compiler infers V
totals := map[string]int{"a": 1, "b": 2}
fmt.Println(SumMap(totals)) // 3
```

Key points:
- **Type inference** eliminates most explicit `[T]` call-site annotations.
- `var total V` initializes to the zero value of `V` — generic code can rely on zero values.
- Constraints composed with `|` are **union constraints** — only the operations that *all* unioned types support are available inside the function (so arithmetic works for `Integer | Float`, but not for `comparable`).

Generic **types** (not just functions) are useful for containers:
```go
type Stack[T any] struct{ items []T }
func (s *Stack[T]) Push(v T) { s.items = append(s.items, v) }
func (s *Stack[T]) Pop() (T, bool) {
    if len(s.items) == 0 {
        var zero T
        return zero, false
    }
    v := s.items[len(s.items)-1]
    s.items = s.items[:len(s.items)-1]
    return v, true
}
```
:::

::: details Q: What are the readability and compile-time trade-offs of generics?
**Readability costs**:
- Type parameter brackets add visual noise, especially with multiple constrained parameters: `func Merge[K comparable, V any](a, b map[K]V) map[K]V`.
- Error messages for constraint violations can be cryptic — the compiler reports the unsatisfied constraint, not the offending call site's intent.
- Debugging: `reflect.TypeOf` on a generic type parameter requires the instantiation; stack traces and profiler output use the instantiated name (e.g., `Stack[string]`), which can be verbose.

**Compile-time costs**:
- Generic code increases compilation time — the compiler must instantiate and type-check each unique shape combination. In large codebases with many type parameters, this is measurable (seconds, not milliseconds). Prefer concrete types for infrequently used utilities.

**Binary size**:
- GC-shape stenciling limits bloat compared to C++ templates, but each unique GC shape still produces a separate code path. Profiling with `go tool nm` can reveal unexpected instantiations.

**Readability guideline**: add type parameters only when the abstraction is obviously justified — `slices.Sort` and `sync.Map` successors are clear wins. Avoid generic wrappers around simple functions just to avoid two concrete implementations that differ by 3 lines. Duplication is often clearer than premature abstraction.
:::

## Common follow-ups

- Can a generic function be a method on a non-generic type? (No — only the type can have type parameters; methods can't introduce new ones.)
- What does `comparable` allow that `any` doesn't, and what types are not comparable?
- How does `cmp.Compare` (Go 1.21) differ from writing a custom comparator?
- Will Go ever support full monomorphization to eliminate the dictionary overhead?
