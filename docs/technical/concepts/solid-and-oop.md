---
title: SOLID & OOP
description: How SOLID's five principles form a system — not a checklist — for high cohesion, low coupling, and changeable OO code.
tags: [concept, oop, design]
category: tech-concepts
status: draft
---

# SOLID & OOP

::: details Q: How does SOLID relate to OOP?
SOLID (Martin, 2000s) is a set of five design principles that operationalise OOP's pillars — particularly **abstraction** and **polymorphism** — toward one goal: code that is cheap to change.

OOP gives you classes, inheritance, and polymorphism as mechanisms. SOLID tells you *how to arrange* those mechanisms so that:
- each unit has one reason to change (cohesion)
- units depend on each other as little and as abstractly as possible (low coupling)
- extension doesn't require touching existing code

| Principle | One-liner |
|---|---|
| **S**RP | One class, one reason to change |
| **O**CP | Open for extension, closed for modification |
| **L**SP | Subtypes must be substitutable for their base type |
| **I**SP | Prefer narrow, client-specific interfaces over fat general ones |
| **D**IP | Depend on abstractions, not concretions |

That table is context, not the answer. The answer is in how they reinforce each other.
:::

::: details Q: How do the five principles reinforce each other?
They are a **web**, not a list.

**Cohesion side — SRP and ISP are the same idea at different granularities.**
SRP says a class should have one reason to change. ISP says an interface should expose only what a given client needs. Both push cohesion: smaller, focused units whose internals can evolve without rippling outward.

**Extensibility side — OCP is *enabled by* DIP + LSP + polymorphism.**
"Closed for modification, open for extension" sounds circular until you see the mechanism: you can only extend without modifying if your code already depends on an *abstraction* (DIP) whose implementations can be freely swapped in (LSP). Remove either and OCP collapses — you inevitably open the existing code to add a new case.

**LSP is what makes polymorphism safe.** A subtype that violates the base type's contract doesn't just break substitution; it breaks OCP (you need an `instanceof` check in the caller) and undermines DIP (the abstraction is no longer trustworthy). LSP is the *correctness condition* on which the rest depends.

**DIP is the linchpin.** Inverting dependencies onto stable abstractions is what makes OCP and ISP *practical at scale*. Without DIP, high-level modules depend on volatile details; every change in a low-level module propagates upward. DIP severs that chain.

Net picture: SRP/ISP handle *cohesion* (what belongs together); DIP/OCP/LSP handle *dependency direction and extensibility*. Together they describe a system with stable seams along which change is cheap.
:::

::: details Q: What is the real goal SOLID serves?
**Managing change and dependency.** The metric is: when requirement X changes, how many files do I have to touch, and how safely?

SOLID is a *means*; the ends are:
- **Testability** — high cohesion + low coupling → units that can be exercised in isolation
- **Replaceability** — DIP + LSP → swap an implementation without touching callers
- **Extensibility** — OCP → add behaviour via new code, not edits to existing code

If those outcomes are already present in a codebase — perhaps through a functional style, or well-designed composition, or simply small, well-named functions — applying SOLID on top adds ceremony without value.

See also: [Cohesion & Coupling](./cohesion-coupling).
:::

::: details Q: Are SOLID principles laws? When do they hurt?
They are **heuristics calibrated to a particular axis of change**. Applied blindly they produce:

- **Premature interfaces** — ISP + DIP applied before you know which callers exist leads to interfaces that are immediately wrong and expensive to revise.
- **Abstraction astronomy** — OCP + DIP stacked without restraint → layered indirection (5 interface files for one HTTP call) that hurts readability more than instability ever would.
- **SRP taken too far** — splitting a class every time it "has two concerns" fragments related logic across many files; coherent behaviour becomes hard to trace.

The practical rule: apply SOLID *along the axis the code actually changes*, not everywhere it *could* change. YAGNI applies. Every abstraction carries a carrying cost — indirection, more files, harder navigation. Pay that cost only when the flexibility is near-term and real.

The tell for over-engineering: a change in requirements requires editing *more* files than the naïve design would have.
:::

::: details Q: How does SOLID relate to OOP pillars and to alternatives (composition, FP)?
**To OOP pillars:** SOLID leans on *abstraction* (stable interfaces as the unit of dependency) and *polymorphism* (swappable implementations) far more than on inheritance. Encapsulation supports SRP. Inheritance is mostly irrelevant — and when misused, it fights LSP.

**Composition over inheritance:** many SOLID outcomes are achieved more cleanly through composition — assembling objects with small, focused behaviours — than through class hierarchies. Composition + narrow interfaces (ISP + DIP) gets you OCP without the fragile base class problem that deep inheritance trees carry.

**Functional programming:** FP reaches low coupling through a different route — pure functions, immutable data, passing behaviour as values. DIP ≈ passing a function (dependency) as an argument; OCP ≈ higher-order functions that extend behaviour without modification. The general principle is the same: *decouple what changes from what stays stable*.

SOLID is not OOP-exclusive dogma. It's one vocabulary for expressing the universal goal: changeable, testable, independently deployable units.

See also: [Composition over Inheritance](./composition-over-inheritance).
:::

## Common follow-ups

- When two SOLID principles conflict (e.g., SRP wants a split, OCP wants a seam in a different place), how do you decide?
- How does the Dependency Injection pattern relate to DIP, and when is a DI container overkill?
- What does "stable abstraction" mean, and how does the Stable Dependencies Principle (SDP) extend SOLID to package level?
- How do you explain SOLID trade-offs to a team that wants to move fast and avoid ceremony?
