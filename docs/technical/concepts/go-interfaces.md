---
title: Interfaces & the nil-interface gotcha
description: How Go interfaces work under the hood, the classic nil-interface bug, and design principles.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# Interfaces & the nil-interface gotcha

::: details Q: How does Go satisfy interfaces, and what is the interface value layout?
Go uses **structural (implicit) satisfaction**: a type satisfies an interface if it implements all of the interface's methods — no `implements` keyword, no registration. This is decided at compile time.

At runtime, an interface value is a **two-word fat pointer**:
```
[ itab pointer | data pointer ]
```
- **itab** (interface table): encodes the concrete type and a dispatch table of method pointers. Shared across all values of the same `(interface, concrete-type)` pair.
- **data pointer**: points to the concrete value (or holds it inline if it fits in one word and is pointer-sized).

Consequence: calling a method through an interface involves one extra pointer dereference (to the itab) and a function-pointer call — the compiler cannot inline it. For hot inner loops this matters; for typical server code it doesn't.

An interface is `nil` only when **both** the itab pointer and the data pointer are nil.
:::

::: details Q: Explain the nil-interface gotcha — the classic typed-nil error bug.
This is one of the most common Go surprises. An interface holding a **nil concrete pointer** is itself **not nil**, because the itab word is non-nil (it encodes the type).

```go
type MyError struct{ msg string }
func (e *MyError) Error() string { return e.msg }

func mayFail(fail bool) error {
    var err *MyError // typed nil pointer
    if fail {
        err = &MyError{"boom"}
    }
    return err // BUG: returns (type=*MyError, value=nil) — NOT a nil interface
}

func main() {
    err := mayFail(false)
    if err != nil { // true! even though the value is nil
        fmt.Println("unexpected error:", err) // panics on err.Error() — nil receiver
    }
}
```

**Fix**: return the `error` interface as a bare `nil`, not a typed nil.
```go
func mayFail(fail bool) error {
    if fail {
        return &MyError{"boom"}
    }
    return nil // untyped nil → both itab and data are nil → interface is nil
}
```

Rule of thumb: **never return a typed nil through an interface**. If you must compute a concrete error and return it, return the interface directly:
```go
var result *MyError = compute()
if result == nil {
    return nil   // not return result
}
return result
```
:::

::: details Q: What are type assertions and type switches, and when do they signal a design smell?
**Type assertion** extracts a concrete type from an interface:
```go
var r io.Reader = os.Stdin

// panics if r is not *os.File
f := r.(*os.File)

// safe form — always prefer this
f, ok := r.(*os.File)
if ok {
    _ = f.Fd()
}
```

**Type switch** dispatches on dynamic type:
```go
func describe(i any) string {
    switch v := i.(type) {
    case int:
        return fmt.Sprintf("int: %d", v)
    case string:
        return fmt.Sprintf("string: %q", v)
    default:
        return fmt.Sprintf("unknown: %T", v)
    }
}
```

Design smell: if you find yourself type-switching on concrete types frequently, the abstraction is wrong — add the behavior to the interface instead. Type assertions across packages tightly couple code to unexported types and break when the concrete type changes.

`errors.As` (see error handling note) is the sanctioned pattern for error type inspection.
:::

::: details Q: What does "accept interfaces, return concrete types" mean, and why?
This idiom maximizes flexibility on both sides:

- **Accept interfaces**: callers pass any concrete type that satisfies the contract. Enables testing with mocks, decouples packages, and keeps the function reusable.
- **Return concrete types**: callers know exactly what they get; they can call methods not on the interface without a type assertion. Returning an interface hides the real type and forces callers to assert — or they can't extend behavior.

```go
// GOOD: accepts io.Reader (any source), returns *csv.Reader (concrete — caller can set LazyQuotes etc.)
func newCSVReader(r io.Reader) *csv.Reader {
    return csv.NewReader(r)
}

// AVOID: returning interface loses the richer type
func newCSVReader(r io.Reader) io.Reader { ... } // caller can't set LazyQuotes
```

Exception: returning an error interface is idiomatic Go — error is a universal interface and callers expect it.

Keep interfaces **small and consumer-defined**: define them in the package that *uses* them, not the package that implements them. A 1–3 method interface is almost always the right size; io.Reader, io.Writer are the gold standard.
:::

::: details Q: What is the empty interface (any), and what are its costs?
`any` (alias for `interface{}`, Go 1.18+) accepts any value. It's used for generic containers before generics existed, for `fmt` formatting, and for JSON unmarshalling into unknown shapes.

Costs:
1. **Type safety lost at compile time** — mismatches become runtime panics.
2. **Allocation**: storing a non-pointer value in an `any` typically causes a heap allocation (the value gets boxed). Storing a `uint32` in `any` allocates; `*uint32` doesn't (the pointer is stored directly in the data word).
3. **No inlining**: dynamic dispatch through the interface.

```go
// This allocates for each integer stored
var m map[string]any
m["count"] = 42 // 42 is boxed onto the heap

// Prefer typed maps or generics for performance-sensitive code
var m map[string]int
m["count"] = 42  // no allocation
```

Reach for generics or concrete types before `any` in new code. `any` is appropriate for truly heterogeneous data (JSON, plugin systems, reflection-based frameworks).
:::

## Common follow-ups

- How does the compiler decide when interface method calls can be devirtualized/inlined?
- Why can't you compare two interface values that hold uncomparable underlying types?
- What is the difference between a nil pointer receiver and a nil interface in method dispatch?
- How do `errors.Is` and `errors.As` use type assertions internally?
