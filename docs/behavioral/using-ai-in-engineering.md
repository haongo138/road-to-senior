---
title: Using AI in Engineering
description: How you use AI as a design reviewer and stress-tester — not just a code generator. Senior-grade talking points on failure modes, silent bugs, and second-order effects.
tags: [behavioral, ai]
category: behavioral
status: draft
---

# Using AI in Engineering

A newer strand of senior/staff interviews probes *how* you actually use AI day to day — specifically whether you use it to **generate code** or to **pressure-test your thinking**. What they're assessing: engineering judgment, whether you can steer AI with enough context to get non-generic answers, and whether you still own the design (AI is a tool, not the author).

Unlike the STAR-L pages, these are mostly reflective questions — answer them in the first person with concrete examples from your own systems. The talking points below are drawn from the same projects as the [Hardest Technical Problem](./hardest-technical-problem) examples (a blockchain reward-claim vault, Discord crypto tipping, a charting indexer, a maintenance microservice). Replace them with your own.

## How you use AI

### Do you use AI more as a coding assistant, or as a reviewer / stress-tester?

- Both, but the **leverage is as a reviewer/stress-tester**. Generation saves minutes; a design flaw caught early saves days.
- Concretely: I draft the design myself, then use AI as an adversary — *"here's my claim flow against a fixed-balance vault, where does it break under concurrency?"* That's how idempotency and the atomic-update gap surfaced before they shipped.
- Generation I mostly use for boilerplate and unfamiliar APIs, always reviewed. I never let it own a money path unread.

### If an engineer only uses AI to generate code and never to stress-test design, what are they missing?

- They're using AI for the **cheap half**. Generation compresses typing; the expensive, senior work is deciding *what* to build and finding *where it breaks* — concurrency, partial failure, ordering, observability.
- They ship faster to the first bug, not to a robust system. The compounding value of AI is as a thinking partner that pressure-tests judgment — and they're leaving that on the table.

## Using AI to harden a design

### When designing a backend/system, at which layers do you ask AI to catch problems — data, sync, race conditions, lifecycle, observability?

- The layers where bugs are **silent and expensive**, not where the compiler already helps: data consistency (a dual-write between Postgres and the chain), concurrency/races (read-modify-write on a balance), lifecycle/ordering (a retry that arrives *after* a timeout), and observability (*will I even see this fail?*).
- I explicitly ask *"what happens under partial failure, retries, or concurrent callers?"* — those are the questions I'm worst at asking myself consistently.
- Less useful for pure business logic and naming — it doesn't know the domain.

### For financial/trading systems, which failure modes is AI especially good at helping you surface?

- Double-spend / double-claim under concurrency, exactly-once vs at-least-once on money movement, idempotency of retries, over-draw of a fixed pool, rounding/precision, and reconciliation drift between two systems of record.
- It's strong at enumerating the *"what if this runs twice / partially / out of order"* space — which is exactly the financial failure surface.
- **Caveat:** it can't tell me the business tolerance (is a 1-unit discrepancy acceptable? must a claim be exactly-once or is at-least-once + reconciliation fine?). That judgment is mine.

### Does AI help you trace second-order effects better?

- Yes, *when I ask it to*. It's good at *"if I change X, what downstream assumes X?"* — switching a serializer, making a call synchronous, or adding a retry to something a downstream isn't idempotent for.
- It widens the search. I still verify, because it will also confidently invent effects that don't exist in my system.

### Has AI ever asked a question back that made you change your design?

::: details Example (adapt to your own experience)
While designing the reward-claim flow, I described marking a claim `settled` as soon as we submitted the on-chain transaction. The model asked back: *"What confirms the transaction actually finalized on-chain before you mark it settled — and what happens if your process dies between the submit and the write?"*

That one question reframed the whole design. I'd been treating Postgres and the chain as equal writers; the right model was **chain as source of truth, DB catches up**. It led directly to the "write `pending` → confirm via indexer → reconcile" flow. The value wasn't an answer it gave me — it was the question I hadn't asked myself.
:::

## Limits of AI feedback

### When you prompt AI as a reviewer, what context do you feed it so it doesn't answer generically?

- Give it the **constraints, not just the code**: the traffic shape (a claim rush of hundreds in seconds), the invariants (the vault can't over-draw; claims must be exactly-once), the failures it must survive (Discord retries, flaky node), and what I've already ruled out.
- Ask a **specific adversarial question** (*"where does this break under a concurrent claim rush?"*), not *"review this."*
- Feed the **real signals** — an actual stack trace, the measured latency numbers, the real schema — so it reasons about *my* system, not a textbook one.

### Has AI ever given feedback that sounds right but isn't usable operationally?

- Often. It suggests textbook fixes that ignore constraints — *"use a distributed lock"* when a single Postgres and a conditional `UPDATE` is simpler and faster, or *"wrap it in a saga / 2PC"* across a blockchain you fundamentally can't transact across.
- I treat its suggestions as **hypotheses to test against my constraints** (latency budget, ops burden, what the team can actually run and debug at 2am), not prescriptions to apply.

## What "good" means

### To you, what makes a backend "good" beyond just running correctly?

- Not *"does it work on the happy path"* — it's how it behaves when things go wrong: **correct** under concurrency and retries, **observable** (I see failures instead of hearing about them from users), **recoverable** (reconciliation, safe restarts), and **bounded** (backpressure and circuit breakers so one slow dependency can't cascade).
- A good backend makes its failure modes **explicit and survivable**, not invisible.

### In systems with many microservices, events, and data sync, which parts most easily create silent bugs?

- The **seams**: dual-writes between two systems of record (DB vs chain), event ordering and duplicate delivery, and anything that fails *without* an error. The archetype is my [silent-log incident](./production-incident) — verbose synchronous logging filled the disk, and because the disk was full the service couldn't even log its own failure, so the dashboards went dark.
- Silent bugs live where there's **no single source of truth and no alert on drift**. That's why I add reconciliation jobs and drift alerts, not just `try/catch`.

## Pitfalls / red flags

- Treating AI output as authoritative — applying it with no independent judgment.
- *"AI wrote it"* as a substitute for understanding your own code, especially on a critical path.
- Talking only about generation *speed* — nothing about verification, constraints, or failure modes.
- Feeding it no context, then dismissing it as "generic."
- Not being able to name a time AI was **wrong** — a sign you don't actually review what it produces.
