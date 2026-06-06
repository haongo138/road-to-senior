---
title: Design Patterns
description: The handful of patterns that actually show up in day-to-day backend code — what each solves, when to reach for it, and when not to.
tags: [concept, oop, design, patterns]
category: tech-concepts
status: draft
---

# Design Patterns

Patterns are shared **vocabulary** for proven solutions — "it's a Strategy" says more than
three sentences. But a pattern is a *means*, not a goal: reach for one when it resolves a
real tension (change, coupling, duplication). Adding patterns speculatively is its own smell —
indirection you pay for and may never use. Most of these are just
[composition over inheritance](./composition-over-inheritance) and [SOLID](./solid-and-oop)
applied to a recurring problem. In Go especially, the idiomatic form is often lighter than the
classic OOP version (a function value, an interface, middleware).

::: details Strategy — swap interchangeable algorithms at runtime
**What:** define a family of algorithms behind one interface and pick the implementation at
runtime. **When:** several ways to do one thing (pricing, sorting, payment method, retry policy)
and you want to avoid a growing `if/else`/`switch`. **Trade-off:** more types; only worth it when
the variants actually change independently. The purest expression of OCP + composition.

```go
type Pricer interface{ Price(o Order) int }

type Standard struct{}
func (Standard) Price(o Order) int { return o.Base }

type Member struct{}
func (Member) Price(o Order) int { return o.Base * 9 / 10 }

func Checkout(o Order, p Pricer) int { return p.Price(o) } // inject the strategy
```
In Go a single-method strategy is often just a `func` value — no interface needed.
:::

::: details Factory — centralize creation, return an interface
**What:** a function/type that builds objects and hands back an interface, hiding the concrete
type. **When:** construction depends on config/input, or you want callers to depend on an
abstraction (DIP) rather than a concrete constructor. **Trade-off:** indirection — if a plain
struct literal or `New…` constructor is enough, don't add a factory.

```go
func NewStore(kind string) (Store, error) {
	switch kind {
	case "postgres": return newPostgres()
	case "memory":   return newMemory(), nil
	default:         return nil, fmt.Errorf("unknown store %q", kind)
	}
}
```
:::

::: details Singleton — one shared instance (use with care)
**What:** guarantee a single instance with global access. **When:** a genuinely shared, usually
stateless resource — config, logger, a connection pool. **Trade-off / caution:** often an
**anti-pattern** — a global hides dependencies and makes code hard to test in isolation. Prefer
creating one instance and **injecting** it. If you must, scope it and make init safe:

```go
var (
	once sync.Once
	pool *Pool
)
func DB() *Pool { once.Do(func() { pool = newPool() }); return pool }
```
Senior take: "pass the dependency" beats "reach for the global" almost every time.
:::

::: details Observer — notify subscribers of events (pub/sub)
**What:** a subject maintains a list of observers and notifies them when something changes —
one-to-many, decoupled. **When:** producers shouldn't know their consumers (domain events, UI
updates, cache invalidation). **Trade-off:** flow becomes harder to follow ("event soup"),
ordering isn't guaranteed, and forgotten unsubscribes leak. In Go, a channel often is the
observer. At system scale this becomes a message queue — see [Queues vs Streams](./queues-vs-streams).
:::

::: details Decorator — wrap to add behavior, same interface
**What:** wrap an object in another that implements the same interface, adding behavior before/after
delegating. **When:** layer cross-cutting concerns — logging, caching, retries, auth, metrics —
without touching the core type; stack them in any order. **Trade-off:** many small wrappers, and
order matters. This is the cleanest OCP win and Go's **middleware** is exactly this:

```go
func WithLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Println(r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}
```
:::

::: details Adapter — make an incompatible interface fit
**What:** wrap a type so it satisfies the interface your code expects. **When:** integrating a
third-party SDK or legacy code — keep the foreign type at the edge behind *your* interface (DIP),
so the rest of the code (and your tests) never depend on it directly. **Trade-off:** an extra thin
layer, but it's what keeps a vendor swap from rippling through the codebase.

```go
type Mailer interface{ Send(to, body string) error }

type sendgridAdapter struct{ c *sendgrid.Client } // wrap the vendor
func (a sendgridAdapter) Send(to, body string) error { /* translate to SDK call */ return nil }
```
:::

::: details Builder — construct complex objects step by step
**What:** assemble an object incrementally instead of a constructor with many parameters. **When:**
lots of optional fields and you want readable, safe construction (no telescoping constructors or
ambiguous positional args). **Trade-off:** boilerplate. In Go the idiomatic form is **functional
options**, not a classic builder:

```go
func NewServer(opts ...Option) *Server {
	s := &Server{port: 8080}            // defaults
	for _, o := range opts { o(s) }
	return s
}
// NewServer(WithPort(9090), WithTLS(cert))
```
:::

## Common follow-ups

- When is reaching for a pattern *over-engineering* — what's the signal you've added one too early?
- How do Go idioms (func values, interfaces, middleware, functional options) replace the classic OOP forms?
- Which patterns are really the same idea (Strategy / State / Command all swap behavior behind an interface)?
- How does the Decorator pattern relate to middleware chains and the Open/Closed Principle?
