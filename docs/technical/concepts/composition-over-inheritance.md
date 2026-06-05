---
title: Composition over Inheritance
description: Why composition is the default for sharing behaviour, when inheritance is still right, and how LSP is the litmus test between them.
tags: [concept, oop, design]
category: tech-concepts
status: draft
---

# Composition over Inheritance

::: details Q: What does "composition over inheritance" mean and why is it the default?
**Inheritance (is-a):** a subclass extends a base class, inheriting its implementation and coupling to its internal structure. Fixed at compile time.

**Composition (has-a / delegates-to):** an object holds references to collaborators and delegates behaviour to them. The collaborators can be swapped at construction time or even at runtime.

Inheritance couples a subclass tightly to its parent — its internal fields, its method implementations, any future changes the parent makes. This is the **fragile base class problem**: a parent change that seems safe can silently break subclasses that depended on a behavioural detail the parent author never intended to be part of the contract. Deep hierarchies amplify this brittleness geometrically.

Composition avoids that coupling. The delegated-to object exposes only its interface; the delegating object knows nothing about its internals. You can substitute a different implementation (DIP), extend behaviour by wrapping (OCP), and test each piece in isolation.

**Relationship to SOLID:** composition + narrow interfaces is *how you actually achieve* DIP and OCP in practice. Deep inheritance trees frequently violate LSP — forcing `instanceof` guards and overrides that gut the parent's behaviour.
:::

::: details Q: When is inheritance still the right call?
Inheritance is justified when **both** conditions hold:

1. **Genuine, stable is-a:** the subtype really is a specialisation of the base type — not merely something that shares implementation with it. "A savings account *is* an account" may hold; "a stack *is* a vector" (historical Java mistake) does not.
2. **LSP holds:** every operation valid on the base type works correctly on the subtype, with no surprising weakening of postconditions or strengthening of preconditions. If you need to override a method to throw or no-op it, that is a signal the is-a is false.

**Framework template methods** are a legitimate use: a framework defines the skeleton of an algorithm and leaves steps to subclasses. But even here, the number of levels should be shallow (≤2–3 deep in practice).

The common mistake is using inheritance for *reuse* — pulling shared logic up into a base class because both classes happen to need it. That's what composition is for.
:::

::: details Q: What are the trade-offs?
**Composition costs:**
- More wiring — you construct and inject collaborators explicitly rather than getting them via `super()`.
- More indirection — following a call through a chain of delegating objects is harder to read than a linear class hierarchy.
- More boilerplate in languages without traits or mixins — you may need to write thin forwarding methods.

**Inheritance costs:**
- Fragile base class problem — base class evolution breaks subclasses silently.
- Rigid structure — you can't change the "inherited from" relationship at runtime, so you can't adapt to configuration or user input.
- Multiple-inheritance issues (diamond problem) in languages that allow it; even single inheritance can produce tangled hierarchies.
- Violating LSP is easy and not caught at compile time — leading to `instanceof` conditional logic scattered across callers.

**The practical heuristic:** default to composition. Reach for inheritance only when you can articulate the is-a relationship and verify LSP. The wiring cost of composition is almost always worth the flexibility and testability it buys.
:::

::: details Q: How do design patterns embody "composition over inheritance"?
Several classic GoF patterns are concrete expressions of this principle:

| Pattern | How it uses composition |
|---|---|
| **Strategy** | Algorithm swapped at runtime via an injected interface; no subclass needed |
| **Decorator** | Wraps an object to add behaviour; the wrapper holds a reference, doesn't inherit |
| **Adapter** | Translates one interface to another by holding the adaptee, not extending it |
| **Composite** | Treats individual objects and collections uniformly through a shared interface |
| **Observer** | Decouples event source from listeners; listeners are injected, not coupled by inheritance |

These patterns don't avoid abstraction — they move it from the class hierarchy into object graphs and interfaces. The result is the same extensibility OCP promises, without the fragility inheritance carries.
:::

::: details Q: Senior take — what is the LSP litmus test?
**LSP is the litmus test for whether an inheritance relationship is legitimate.**

Ask: can every place that uses a `Base` be handed a `Derived` and still work correctly — with no extra checks, no surprising no-ops, no weakened guarantees? If yes, inheritance is safe. If no, you have an is-a in name only.

Common LSP violations to recognise immediately:
- `override` throws `UnsupportedOperationException` (the Java `Stack extends Vector` mistake)
- Subclass widens preconditions in a way callers don't expect
- Subclass removes a guarantee (e.g., postcondition that a collection is sorted)

When LSP is violated, callers compensate with `instanceof` checks — a reliable tell. At that point, inheritance is providing coupling without the substitutability benefit that justifies it. Refactor to composition: the base becomes an interface, each former subclass becomes a standalone implementation.

See also: [SOLID & OOP](./solid-and-oop).
:::

## Common follow-ups

- How do mixins and traits (Ruby, Rust, Scala) change the trade-off — are they "composition" or a safer form of "inheritance"?
- How does the Decorator pattern differ from subclassing for extension, and when does each become unwieldy?
- What is the "fragile base class" problem in more detail, and why does binary compatibility make it worse in library code?
- How does Go's lack of inheritance (interface satisfaction by convention) validate or challenge the principle in practice?
