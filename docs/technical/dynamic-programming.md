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
| Style | Recursive + cache map | Iterative + dp slice/table |
| Order | Natural (call what you need) | Must determine fill order |
| Space | Call stack overhead | Often easier to optimize |

**Pattern / template**

```go
// Top-down memoization
var memo = map[[2]int]int{}

func dp(i, j int) int {
    if i == 0 { return BASE }          // base case
    if v, ok := memo[[2]int{i, j}]; ok {
        return v
    }
    // recurrence relation
    result := max(dp(i-1, j), dp(i, j-1))
    memo[[2]int{i, j}] = result
    return result
}

// Bottom-up tabulation
func dpTable(m, n int) int {
    table := make([][]int, m+1)
    for i := range table {
        table[i] = make([]int, n+1)
    }
    for i := 1; i <= m; i++ {
        for j := 1; j <= n; j++ {
            table[i][j] = max(table[i-1][j], table[i][j-1])
        }
    }
    return table[m][n]
}
```

**Complexity**
- Time: O(states × work per state) — depends on state definition.
- Space: O(states); often reducible to O(1 row) with rolling array.

**Pitfalls**
- Wrong state definition — if two distinct situations map to the same state key, results are incorrect.
- Off-by-one in base cases (0-indexed vs 1-indexed dp table).
- Not recognising the sub-problem: if you can't articulate the recurrence, step back to the recursive tree.

## Common follow-ups

- Can you reduce the space complexity with a rolling array?
- How do you reconstruct the actual solution (not just the optimal value)?
- What is the state definition, and why is it sufficient to capture all distinct sub-problems?
- How would you approach this top-down vs bottom-up, and what are the trade-offs?

## Practice (LeetCode)

- LC 70 — Climbing Stairs
- LC 198 — House Robber
- LC 322 — Coin Change
- LC 300 — Longest Increasing Subsequence
- LC 1143 — Longest Common Subsequence
- LC 72 — Edit Distance
