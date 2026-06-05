---
title: defer, panic, recover
description: Precise semantics of defer (LIFO, argument evaluation timing), panic propagation, and recover boundaries.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# defer, panic, recover

::: details Q: What are defer's exact semantics — LIFO, argument evaluation, and named returns?
`defer` pushes a function call onto a per-goroutine **LIFO stack**. Deferred calls execute when the surrounding function *returns* (normal return or panic), in reverse order of declaration.

**Arguments are evaluated at the defer statement, not when the deferred call runs:**
```go
func demo() {
    x := 1
    defer fmt.Println(x) // captures x=1 NOW
    x = 99
    // prints 1, not 99
}
```

To capture the current value at call time, use a closure:
```go
defer func() { fmt.Println(x) }() // prints 99 — x is read at call time
```

**Named return values** can be modified by a deferred closure — this is the one way `defer` can change what a function actually returns:
```go
func readFile(path string) (err error) {
    f, err := os.Open(path)
    if err != nil {
        return
    }
    defer func() {
        if cerr := f.Close(); cerr != nil && err == nil {
            err = cerr // modifies the named return
        }
    }()
    // ...
    return
}
```
This pattern is useful for wrapping Close errors but can be surprising if not documented.
:::

::: details Q: What are the common defer gotchas, especially inside loops?
**Defer in a loop**: deferred calls accumulate until the *enclosing function* returns — not until the loop iteration ends. In a long-running loop this means resources (file handles, connections) are held for the full function lifetime:

```go
// BAD: files not closed until processAll returns
func processAll(paths []string) error {
    for _, p := range paths {
        f, err := os.Open(p)
        if err != nil {
            return err
        }
        defer f.Close() // accumulates — all files open at once!
        process(f)
    }
    return nil
}

// GOOD: close each file immediately by extracting a helper
func processAll(paths []string) error {
    for _, p := range paths {
        if err := processOne(p); err != nil {
            return err
        }
    }
    return nil
}
func processOne(path string) error {
    f, err := os.Open(path)
    if err != nil {
        return err
    }
    defer f.Close() // scoped to processOne
    return process(f)
}
```

**Loop variable capture** (pre-Go 1.22): deferring a closure that references a loop variable captures the variable, not its value. In Go 1.22+ loop variables are per-iteration; in earlier versions you need `p := p` inside the loop before the defer.

**Deferred method on nil receiver**: if you defer a method call and the receiver is nil, the deferred call will panic when it runs (at return time, not at the defer statement).
:::

::: details Q: How do panic and recover work, and what are the rules?
`panic` unwinds the call stack of the current goroutine, running deferred functions at each frame, until either:
- A deferred function calls `recover()`, which stops the unwind and returns the panic value.
- The stack is fully unwound → the program crashes with a stack trace.

**`recover` only works inside a deferred function called directly during a panic:**
```go
func safe() (err error) {
    defer func() {
        if r := recover(); r != nil {
            err = fmt.Errorf("recovered: %v", r)
        }
    }()
    panic("oh no") // caught by the deferred func above
}
```

If `recover` is called outside a deferred function (or in a deferred function called from another function), it returns `nil` and does nothing.

**A panic in one goroutine cannot be recovered in another goroutine.** If it unwinds to the goroutine's root without being recovered, the entire program crashes. This is why libraries that spawn goroutines internally must recover panics inside those goroutines.
:::

::: details Q: When should you use panic vs returning an error?
**Return errors for expected, recoverable conditions** — file not found, network timeout, invalid user input. This is the dominant Go style and aligns with "errors are values."

**Use panic for:**
1. **Programming errors** that should never occur in correct code — index out of bounds, nil dereference, type assertion on a value that must be of a specific type. The runtime panics for these anyway.
2. **Initialization failures** at startup (e.g., `mustCompile` pattern) where continuing is meaningless:
```go
var re = regexp.MustCompile(`^\d+$`) // panics at init if regex is invalid
```
3. **Crossing a package or goroutine boundary** to prevent a panic from leaking out of a library into the caller as a crash — recover at the boundary and convert to an error.

**Never use panic for normal control flow** — it is expensive (stack unwinding), not idiomatic, and makes reasoning about code correctness harder. A panic that crosses a package boundary is a breach of contract.

Signal to watch for: if you find yourself writing `recover` frequently in production paths, you're fighting the language — reconsider whether errors-as-values better models the domain.
:::

::: details Q: How do you safely use defer for cleanup — and when does it not work?
The canonical defer pattern for cleanup:
```go
f, err := os.Open(path)
if err != nil {
    return err
}
defer f.Close()
```

**Checking the error from Close**: `f.Close()` on a writable file flushes buffers and can fail. If you use `defer f.Close()` plainly, that error is silently discarded. Use a named return to capture it:
```go
func writeFile(path string, data []byte) (err error) {
    f, err := os.Create(path)
    if err != nil {
        return
    }
    defer func() {
        if cerr := f.Close(); cerr != nil && err == nil {
            err = cerr
        }
    }()
    _, err = f.Write(data)
    return
}
```

**When defer doesn't work**: deferred calls run when the *function* returns. For long-lived server handlers that hold a database transaction open across multiple sub-calls, an unrecovered panic in a goroutine spawned inside the handler will not trigger the transaction's deferred rollback. Keep deferred cleanup tightly scoped.

**Performance**: each `defer` has a small cost (runtime bookkeeping). In Go 1.14+ inline defer (for defers not in loops and with no heap-allocated closures) reduced this to near-zero. For extremely hot paths, measure before removing defers for performance reasons.
:::

## Common follow-ups

- Can a deferred function itself panic? What happens?
- How does defer interact with `os.Exit`? (it doesn't — deferred functions do not run on `os.Exit`)
- What is the `must` / `MustX` naming convention and when is it appropriate for public APIs?
- How do you recover from a panic that crosses a goroutine boundary spawned by a library?
