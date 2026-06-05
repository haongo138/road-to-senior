---
title: Cohesion & Coupling
description: The two underlying metrics that SOLID, DRY, and every modularity principle ultimately serve — and why you can't (and shouldn't) drive both to zero.
tags: [concept, oop, design]
category: tech-concepts
status: draft
---

# Cohesion & Coupling

::: details Q: What are cohesion and coupling?
**Cohesion** measures how *focused* a module is — whether its responsibilities belong together by a single, clear purpose. A highly cohesive module does one thing well; everything inside it serves that thing.

**Coupling** measures how *dependent* one module is on another — how much it knows about another module's internals, how many assumptions it makes about its structure or behaviour.

The goal is always: **high cohesion, low coupling**. A highly cohesive module is easier to understand, test, and change in isolation. Low coupling means a change in one module doesn't ripple into others.

The two are linked: poor cohesion usually forces high coupling. A module with scattered responsibilities tends to reach into many other modules to fulfil all of them.
:::

::: details Q: Why are cohesion and coupling the underlying goal behind SOLID, DRY, and modularity?
Every well-known principle is a *specific tactic* for achieving high cohesion and low coupling:

| Principle | What it does in these terms |
|---|---|
| **SRP** | Pushes cohesion — one reason to change = one focused responsibility |
| **ISP** | Pushes cohesion on interfaces — clients don't couple to methods they don't use |
| **DIP** | Cuts coupling — high-level modules depend on stable abstractions, not volatile concretions |
| **OCP** | Preserves low coupling — extension happens without editing (and thus without coupling to) existing code |
| **DRY** | Reduces coupling — a duplicated fact means two places must change together; a single source of truth severs that implicit dependency |
| **Modularity / package design** | Both — packages with high internal cohesion and few inter-package dependencies are independently deployable and understandable |

Understanding this lets you reason about *why* a principle applies in a given situation rather than applying it by rote. "Should I extract this?" → does it reduce coupling or increase cohesion, or am I just moving code around?

See also: [SOLID & OOP](./solid-and-oop).
:::

::: details Q: What are the key smells at each end of the spectrum?
The classics (Constantine) put both on a scale you only need to recognise by extremes: cohesion runs *coincidental → … → functional* (functional = good — everything serves one purpose), and coupling runs *content/tight → … → data/message* (data/message = good — modules share only what they must). Name the smell, not the rung:

**Too much coupling:**

- *Change amplification / shotgun surgery* — changing one thing requires touching 5 files in 3 modules. The modules are implicitly coupled through shared knowledge.
- *Divergent change* — a single module changes for multiple different reasons (different callers' needs). Symptom of low cohesion, which forces coupling to grow.
- *Hard to unit-test in isolation* — if you can't instantiate a class without constructing half the system, coupling is too high. Testability is a reliable proxy.
- *Feature envy* — a method reaches more into another object's data than into its own; the method belongs in the other object.

**Too much decoupling:**

- *Event soup* — everything communicates through a generic event bus or pub/sub; following a data flow requires tracing through 10 subscribers. Decoupled but illegible.
- *Excessive indirection* — 4 layers of interface + adapter + factory + proxy for a thin HTTP call. The abstraction cost exceeds any flexibility gained.

The right place on the spectrum depends on how the code actually changes — not on an abstract ideal.
:::

::: details Q: Can you drive coupling to zero? Should you?
No, and no. **Essential coupling** is unavoidable: a caller must know *something* about what it calls — at minimum, an interface contract. The goal is to couple to *stable, abstract* things (interfaces, protocols, value types) rather than *volatile, concrete* things (implementation details, internal state).

**Over-decoupling costs are real:**
- Indirection makes control flow hard to follow. Debugging a chain of 6 abstract collaborators is harder than reading 40 lines of direct code.
- Every abstraction is an additional surface to maintain, test, and document.
- Generic event buses or plugin systems make simple reads expensive.

**Cohesion has a tension with reuse.** A module so focused that it does exactly one thing may be too narrow to reuse elsewhere; a slightly broader module might serve three callers without being incoherent. This is a genuine trade-off — aim for *functional cohesion* (everything serves one purpose) but don't shatter a naturally cohesive unit just to satisfy an abstract principle.

The test: can a new team member understand this module without reading its collaborators? Can it be tested without them?
:::

::: details Q: How do you improve cohesion and coupling in practice?
**Refactoring moves for poor cohesion:**
- *Extract Class / Extract Function* — when a class has two concerns, split them. Name the new class after its single purpose.
- *Move Method/Field* — if a method uses more data from another class than its own, it belongs there.

**Refactoring moves for high coupling:**
- *Introduce an interface / protocol* — depend on behaviour, not the concrete type.
- *Replace inheritance with composition* — composition lets you swap dependencies at construction time; inheritance locks them in.
- *Event / observer pattern* — decouple the source of a state change from the consumers, when the consumers are genuinely independent.

**A practical heuristic:** draw a dependency graph of your modules. Every arrow is a coupling. Arrows should flow *one way* (acyclic), and *toward stability* (stable, abstract modules at the base). Cycles and arrows from stable to volatile are the primary targets.
:::

## Common follow-ups

- What is connascence, and how does it give a more precise vocabulary for coupling strength?
- How does package/module cohesion at the large scale (Reuse/Release Equivalence, Common Closure principles) mirror class-level SRP?
- When is temporal coupling (A must be called before B) the real problem, and how do you remove it?
- How do microservice boundaries reflect cohesion/coupling decisions — and what goes wrong when they don't?
