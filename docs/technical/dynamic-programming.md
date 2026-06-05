---
title: Dynamic Programming
description: Cache overlapping sub-problems identified by their recurrence relation.
tags: [dsa, recursion, dp]
category: technical
status: draft
---

# Dynamic Programming

**Key idea** — DP is recursion + caching. Once you write the recurrence relation (same skill as [Trees & Recursion](./tree)), you either memoize top-down (cache recursive calls) or tabulate bottom-up (fill a table iteratively). The hard part is defining the state.

**When to use** — Overlapping sub-problems + optimal substructure: longest subsequence, knapsack, coin change, edit distance, number of ways to reach a target. If brute-force recursion revisits the same `(i, j, ...)` state, DP applies.

**Two approaches**

| | Top-down (Memoization) | Bottom-up (Tabulation) |
|---|---|---|
| Style | Recursive + cache dict | Iterative + dp array/table |
| Order | Natural (call what you need) | Must determine fill order |
| Space | Call stack overhead | Often easier to optimize |

**Pattern / template**

```python
# Top-down memoization
from functools import lru_cache

@lru_cache(maxsize=None)
def dp(i, j):
    # base case
    if i == 0: return BASE
    # recurrence relation
    return best(dp(i-1, j), dp(i, j-1), ...)

# Bottom-up tabulation
dp = [[0] * (n+1) for _ in range(m+1)]
for i in range(1, m+1):
    for j in range(1, n+1):
        dp[i][j] = recurrence(dp[i-1][j], dp[i][j-1], ...)
```

**Complexity**
- Time: O(states × work per state) — depends on state definition.
- Space: O(states); often reducible to O(1 row) with rolling array.

**Pitfalls**
- Wrong state definition — if two distinct situations map to the same state key, results are incorrect.
- Off-by-one in base cases (0-indexed vs 1-indexed dp table).
- Not recognising the sub-problem: if you can't articulate the recurrence, step back to the recursive tree.
