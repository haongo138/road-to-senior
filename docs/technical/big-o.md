---
title: Big-O Primer
description: Just enough complexity analysis to reason about trade-offs in interviews.
tags: [interview, complexity, big-o]
category: technical
status: draft
---

# Big-O Primer

Big-O notation describes how an algorithm's resource usage **grows** as the input size `n` increases. It drops constants and lower-order terms so you can compare algorithms at a high level. In an interview, you should be able to state time and space complexity for every solution you write — and justify both.

## Common Growth Rates

From best to worst:

| Complexity | Name | Typical example |
|---|---|---|
| O(1) | Constant | Hash map lookup, array access by index |
| O(log n) | Logarithmic | Binary search, balanced BST operations |
| O(n) | Linear | Single array pass, linear scan |
| O(n log n) | Linearithmic | Comparison sort (merge sort, heap sort), heap-based operations over all elements |
| O(n²) | Quadratic | Nested loops, naive pair comparison |
| O(2ⁿ) | Exponential | Generating all subsets, brute-force backtracking |
| O(n!) | Factorial | Generating all permutations |

For most interview problems, an O(n) or O(n log n) solution is expected. O(n²) is often the brute force you mention first, then optimize away.

## Common Pitfalls

**1. Large constants matter in practice.**
Big-O hides multiplicative constants. An O(n) algorithm with a 1000× constant can be slower than an O(n²) algorithm for small `n`. Always consider the realistic input range when choosing between solutions.

**2. Space complexity is often ignored — don't.**
Every interview answer needs a space complexity statement. Hash maps, recursion stacks, and auxiliary arrays all consume memory. Analyze *both* time and space, even if the interviewer doesn't ask.

**3. The recursion call stack counts as space.**
A recursive DFS that goes `n` levels deep uses O(n) space on the call stack — even if you declare no additional data structures. Factor this in whenever you use recursion.

Further reading: EngineerPro — Coding DSA Interview at Big Tech (https://engineerpro-team.github.io/coding-book/)
