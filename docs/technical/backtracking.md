---
title: Backtracking
description: Systematically explore all candidates and prune invalid branches early.
tags: [dsa, recursion, backtracking]
category: technical
status: draft
---

# Backtracking

**Key idea** — Backtracking is DFS on an implicit decision tree. At each step you *choose* a candidate, *recurse* to explore it, then *undo* (backtrack) and try the next candidate. Pruning short-circuits branches that cannot possibly lead to a valid answer.

**When to use** — Permutations, combinations, subsets, Sudoku/N-queens constraint satisfaction, word search on a grid. Recognise the pattern: "find all / count all / any valid arrangement."

**Pattern / template**

```python
def backtrack(state, choices):
    if is_complete(state):
        results.append(state[:])   # record a copy
        return

    for choice in choices:
        if is_valid(state, choice):
            state.append(choice)           # choose
            backtrack(state, next_choices) # explore
            state.pop()                    # un-choose (backtrack)
```

**Complexity**
- Time: O(b^d) where b = branching factor, d = depth — exponential in the worst case.
- Space: O(d) call stack + O(results) for storing solutions.

**Pitfalls**
- Forgetting to copy `state` when recording a solution (you'll push the same mutable list repeatedly).
- Missing the pruning condition — without it the algorithm degrades to brute force.
- For permutations, track a `used` boolean array to avoid reusing the same index.

## Common follow-ups

- How would you modify the template to generate combinations instead of permutations?
- Where exactly is the pruning condition applied, and how does it affect the branching factor?
- How do you avoid duplicate results when the input contains repeated elements?
- Can you convert this recursive backtracking into an iterative solution?

## Practice (LeetCode)

- LC 46 — Permutations
- LC 78 — Subsets
- LC 39 — Combination Sum
- LC 22 — Generate Parentheses
- LC 51 — N-Queens
