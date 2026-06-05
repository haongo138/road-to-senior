---
title: Interview Process (UMPIRE)
description: A 6-step framework so you never freeze on a new coding problem.
tags: [interview, process, umpire]
category: technical
status: draft
---

# Interview Process (UMPIRE)

UMPIRE is a repeatable loop you run every time you see a new coding problem. Each letter maps to a concrete phase with a time budget. The goal is to never sit in silence — every minute has a purpose.

## U — Understand (~5 min)

Before touching code, make sure you know exactly what the problem is asking.

- Restate the problem in your own words to the interviewer.
- Ask 2–3 clarifying questions:
  - **Edge cases:** what happens with empty input, null values, negative numbers, or integer overflow?
  - **Constraints:** how large can `n` be? (determines O(n²) vs O(n log n) vs O(n))
  - **Output format:** should I return an index or the value itself? Is the output sorted?
- Write 1–2 small concrete examples with expected outputs before moving on.

## M — Match (~2 min)

Scan your mental catalog of patterns and templates. Which one fits this problem shape?

Common signals:
- Sorted array + target → **binary search**
- Shortest path / level-by-level → **BFS**
- Optimal substructure + overlapping subproblems → **DP**
- Two indices moving toward each other → **two pointers**
- Running window of elements → **sliding window**
- K largest/smallest → **heap**
- Monotone predicate on answer → **binary search on answer**

Name the pattern out loud. If nothing fits immediately, note what you *do* know about the data.

## P — Plan (~5 min)

Think before you type. Coding a wrong approach wastes time you can't recover.

1. State the **brute force** first and its Big-O — this shows you understand the problem.
2. Look for optimizations: avoid redundant work, sort first to enable binary search, use a hash map to drop a nested loop, apply a monotonic predicate.
3. Confirm the approach with the interviewer **before writing a single line of code**. A 30-second check-in prevents 10 minutes of rework.

## I — Implement (~15 min)

Now you code — clearly and deliberately.

- Use **meaningful names**: `left`/`right` instead of `i`/`j`, `windowSum` instead of `s`.
- Comment any non-trivial step (why, not what).
- Extract helper functions for logic you'd have to repeat.
- Resist the urge to micro-optimize during this phase; correctness first.

## R — Review (~3 min)

Do not run the code yet — review it with your own eyes.

- Re-read for off-by-one errors, uninitialized variables, and missed edge cases.
- Trace through a small example **on paper** (or in your head), not by executing: this forces deliberate thinking instead of "let's see what happens."

## E — Evaluate (~2 min)

Wrap up with explicit analysis.

- Re-state the final **time and space complexity** with justification ("O(n log n) because the sort dominates the O(n) pass").
- Discuss at least one further optimization or trade-off you *could* make — no need to implement it.
- Handle follow-up questions confidently: "What if the input doesn't fit in memory?" → mention external sort or streaming.

---

**Mindset:** the interviewer wants to see your thought process, not a perfect first try — think out loud at every step.

Further reading: EngineerPro — Coding DSA Interview at Big Tech (https://engineerpro-team.github.io/coding-book/)
