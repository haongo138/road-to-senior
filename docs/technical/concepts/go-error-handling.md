---
title: Error Handling
description: Go errors-as-values idioms — wrapping, sentinel vs typed vs opaque, errors.Is/As, and panic boundaries.
tags: [concept, golang, language]
category: tech-concepts
status: draft
---

# Error Handling

::: details Q: Why does Go use errors as values instead of exceptions?
Go errors are ordinary values that implement the `error` interface (`Error() string`). Callers handle them explicitly at each call site — there is no implicit stack unwinding for control flow.

Benefits:
- Error paths are visible in code; no hidden exception propagation across call frames.
- The compiler enforces you *receive* the error; ignoring it requires `_` (explicit, not accidental).
- Error values can carry structured data, be inspected, wrapped, and passed across goroutine boundaries easily.
- Performance: no unwinding machinery; error handling is just a branch.

Cost: verbosity. `if err != nil { return ..., err }` repeats throughout code. The Go team acknowledges this; proposals for syntactic sugar exist but none have shipped as of Go 1.23.

The key discipline: **add context when returning errors, but don't double-log**. Log once (at the top of the call stack where you handle the error) or wrap for structured inspection — not both.
:::

::: details Q: How do you wrap errors, and what is the difference between errors.Is and errors.As?
**Wrapping** adds context to an error while preserving the original for inspection:
```go
if err := db.Query(sql); err != nil {
    return fmt.Errorf("listUsers query: %w", err)
}
```
`%w` (Go 1.13+) stores the original error and makes it accessible via `errors.Unwrap`.

**`errors.Is(err, target)`** — checks whether any error in the chain is *equal* to `target`. Used for **sentinel errors**:
```go
var ErrNotFound = errors.New("not found")

if errors.Is(err, ErrNotFound) { // walks the Unwrap chain
    // handle 404 case
}
// Also works with stdlib: errors.Is(err, io.EOF)
```

**`errors.As(err, &target)`** — checks whether any error in the chain can be **assigned** to `target`'s type (via type assertion). Used for **typed errors** where you need the fields:
```go
var pgErr *pgconn.PgError
if errors.As(err, &pgErr) {
    fmt.Println(pgErr.Code) // e.g. "23505" unique violation
}
```

Never use `==` directly on wrapped errors — it compares only the outermost value and misses wrapped causes. Use `errors.Is`/`errors.As` throughout.
:::

::: details Q: What are sentinel, typed, and opaque errors — when do you use each?
**Sentinel errors** (`var ErrX = errors.New(...)`) — package-level variables compared by identity with `errors.Is`. Use when callers need to branch on a specific condition and the condition has no additional data. They become part of your package's API surface — changing them is a breaking change.

```go
var ErrNotFound = errors.New("record not found") // callers do: errors.Is(err, repo.ErrNotFound)
```

**Typed errors** — structs implementing `error`, inspected with `errors.As`. Use when callers need structured data (HTTP status code, database error code, field validation failures).

```go
type ValidationError struct {
    Field   string
    Message string
}
func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation: %s: %s", e.Field, e.Message)
}
```

**Opaque errors** — returned as plain `error`, with no exported sentinel or type for callers to match. Use when the error is informational and callers should not branch on it — only log or propagate it. This is the **most decoupled** form; implementation details don't leak.

Guideline: start opaque. Promote to typed/sentinel only when a caller *demonstrably* needs to distinguish the error. Exposing a typed error is a public API commitment.
:::

::: details Q: How do you add context without leaking internals or creating double-log noise?
**Add context at every return boundary** that crosses a meaningful abstraction:
```go
// service layer
func (s *UserService) Create(ctx context.Context, u User) error {
    if err := s.repo.Insert(ctx, u); err != nil {
        return fmt.Errorf("UserService.Create %q: %w", u.Email, err)
    }
    return nil
}
```

**Don't**: log AND return — the log statement at a low level creates noise when the caller also logs:
```go
// BAD: double-log
func (r *UserRepo) Insert(ctx context.Context, u User) error {
    if err := r.db.Exec(...); err != nil {
        log.Printf("insert failed: %v", err)  // logged here...
        return fmt.Errorf("insert: %w", err)
    }
    return nil
}
// And the caller logs it again on receipt — two log lines for one failure.
```

**Don't leak internal details**: wrapping an internal DB error string in an API response exposes schema information. Unwrap at the boundary and return a safe external message.

```go
// HTTP handler boundary: unwrap, classify, respond safely
if errors.Is(err, repo.ErrNotFound) {
    http.Error(w, "not found", http.StatusNotFound)
    return
}
// log the full chain internally
slog.Error("create user", "err", err)
http.Error(w, "internal error", http.StatusInternalServerError)
```
:::

::: details Q: When is panic acceptable, and where should the panic/error boundary sit?
Within a package's exported API, **return errors**. Use panic only for:
1. **Invariant violations** that represent bugs in the calling code (e.g., nil argument to a function that documents non-nil as a precondition).
2. **`must`-style helpers** for initialization-time failures where continuing would be meaningless:
```go
// Exported Must pattern — acceptable at package level / init
func MustParse(s string) *Template {
    t, err := Parse(s)
    if err != nil {
        panic(fmt.Sprintf("MustParse: %v", err))
    }
    return t
}
```
3. **Library internals** that spawn goroutines: recover at the goroutine root and convert to an error or structured log, preventing a silent crash.

**The boundary rule**: recover at the outermost layer where you can produce a meaningful error response — an HTTP handler, a background worker loop, a gRPC interceptor. Never let a panic cross a package boundary into caller code that doesn't expect it.

Practical metric: if `recover` appears in business logic rather than infrastructure/framework code, the design is off — the business logic should use errors-as-values.
:::

## Common follow-ups

- How do you implement a custom error type that supports both `errors.Is` and `errors.As` on the same value?
- What does `errors.Join` (Go 1.20) do and when is it preferable to wrapping?
- How does `slog` structured logging interact with error wrapping chains?
- When should you use `panic` vs `log.Fatal` for startup failures?
