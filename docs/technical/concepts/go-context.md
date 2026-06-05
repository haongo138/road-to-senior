---
title: context.Context
description: Propagating cancellation, deadlines, and request-scoped values across goroutine boundaries.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# context.Context

::: details Q: What problem does context.Context solve, and what doesn't it solve?
**Problem**: in a server, one incoming request spawns multiple goroutines (DB query, RPC call, background work). When the client disconnects or a deadline expires, you need all those goroutines to stop — but Go has no built-in way to "kill" a goroutine. `context.Context` provides a **shared cancellation signal and deadline** that flows across API and goroutine boundaries without global variables.

What it solves: propagation of cancellation, deadlines, and request-scoped values (trace IDs, auth tokens) through call chains.

What it doesn't solve: **cancellation is cooperative**. If a callee never checks `ctx.Done()`, cancellation does nothing. A goroutine blocked in a pure compute loop or a non-ctx-aware library won't be interrupted. The context signal is advisory — the callee must opt in.
:::

::: details Q: What are the context constructors and when do you use each?
| Constructor | Use case |
|-------------|----------|
| `context.Background()` | Top-level root: `main`, `init`, tests, top of a server handler |
| `context.TODO()` | Placeholder when you're unsure which context to use — a code smell if it stays long-term |
| `WithCancel(parent)` | Manual cancellation; returns `ctx, cancel` |
| `WithTimeout(parent, d)` | Cancel after duration from now |
| `WithDeadline(parent, t)` | Cancel at an absolute time |
| `WithValue(parent, key, val)` | Attach request-scoped data |

All derived contexts form a **tree**: cancelling a parent cancels all children. `WithTimeout`/`WithDeadline` also cancel all children when the time expires.

```go
ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
defer cancel() // always call to release resources even if timeout fires first
```
:::

::: details Q: What are the rules for using context correctly?
1. **Pass as the first argument**: `func DoWork(ctx context.Context, ...)` — convention enforced by `go vet` and linters.
2. **Never store in a struct field** (except for backward-compat wrappers). Storing makes the lifetime opaque; passing makes it explicit at every call site.
3. **Always `defer cancel()`** right after `WithCancel`/`WithTimeout`/`WithDeadline`. Even when the timeout fires, the cancel function releases the timer goroutine and the context's internal resources. Forgetting it leaks a goroutine until the parent is cancelled.
4. **`WithValue` only for request-scoped data with unexported typed keys** — never for optional function parameters.

```go
type ctxKey string
const traceIDKey ctxKey = "traceID"

ctx = context.WithValue(ctx, traceIDKey, "abc-123")
id, _ := ctx.Value(traceIDKey).(string)
```

Using an unexported type prevents key collisions between packages.
:::

::: details Q: How do you correctly select on ctx.Done() alongside real work?
```go
func process(ctx context.Context, jobs <-chan Job) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err() // context.Canceled or context.DeadlineExceeded
        case j, ok := <-jobs:
            if !ok {
                return nil // channel closed, done
            }
            if err := doWork(ctx, j); err != nil {
                return err
            }
        }
    }
}
```

Key points:
- Check `ctx.Err()` to distinguish `Canceled` (explicit cancel) from `DeadlineExceeded` (timer fired) — useful for metrics/logging.
- Pass `ctx` into every sub-call so they can short-circuit too.
- If `doWork` is synchronous and long, it must also select on `ctx.Done()` internally or it won't respect cancellation.
:::

::: details Q: What are the common context pitfalls and how do you detect them?
**Leak from missing cancel**: `WithTimeout` spawns a timer goroutine; forgetting `defer cancel()` leaks it until the parent context ends. Use `go.uber.org/goleak` in tests to catch this. See [Goroutine Leaks](./go-goroutine-leaks).

**Ignoring ctx in libraries**: wrapping a library that doesn't accept a context means you can't cancel its work. Workaround: run it in a goroutine, select on ctx.Done() and kill/abandon the result on cancellation (while being careful about cleanup).

**Over-using WithValue**: values stored in context are `interface{}` — no type safety at compile time, and retrieval is a linear walk up the context tree. Don't put large structs or optional function parameters in context; pass them as explicit arguments.

**Passing a cancelled context to a new request**: after a handler returns, its context is cancelled. Creating background work with it will fail immediately. Use `context.WithoutCancel(ctx)` (Go 1.21+) or `context.Background()` for background jobs that should outlive the request.
:::

## Common follow-ups

- How do you propagate trace IDs from an incoming HTTP request through all downstream calls?
- What's the difference between `context.Canceled` and `context.DeadlineExceeded` at the call site?
- How does `context.WithoutCancel` (Go 1.21) differ from using `context.Background()` for fire-and-forget goroutines?
- How do you unit-test code that checks `ctx.Done()` without real timers?
