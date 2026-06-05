---
title: Greedy
description: Greedy algorithm pattern — exchange argument, sort-then-scan, and when to fall back to DP.
tags: [dsa, greedy]
category: technical
status: draft
---

# Greedy

**Key idea:** Make the **locally optimal choice** at each step when an **exchange argument** holds — swapping any other solution toward the greedy choice never makes it worse (or always makes it at least as good). Typical shape: **sort by X, then scan linearly**. No global lookahead is needed once the exchange argument is established.

## When to use

- Optimization (max/min) where a provable local choice leads to a global optimum
- Interval scheduling (pick the activity that ends soonest)
- "Farthest reach" problems (jump games)
- Recognition signal: the problem has a clear ordering criterion and no dependency on future choices

## Pattern / template

```go
import (
    "math"
    "sort"
)

// Interval scheduling — maximize non-overlapping intervals
// Exchange argument: always pick the interval that ends earliest
func maxNonOverlap(intervals [][2]int) int {
    sort.Slice(intervals, func(i, j int) bool {
        return intervals[i][1] < intervals[j][1] // sort by end time
    })
    count, end := 0, math.MinInt64
    for _, iv := range intervals {
        start, finish := iv[0], iv[1]
        if start >= end {
            count++
            end = finish
        }
    }
    return count
}

// Jump Game — can you reach the last index?
func canJump(nums []int) bool {
    reach := 0
    for i, jump := range nums {
        if i > reach {
            return false // stranded
        }
        if i+jump > reach {
            reach = i + jump
        }
    }
    return true
}

// Jump Game II — minimum jumps
func minJumps(nums []int) int {
    jumps, curEnd, farthest := 0, 0, 0
    for i := 0; i < len(nums)-1; i++ {
        if i+nums[i] > farthest {
            farthest = i + nums[i]
        }
        if i == curEnd { // must jump now
            jumps++
            curEnd = farthest
        }
    }
    return jumps
}
```

## Complexity

| Pattern | Time | Space |
|---------|------|-------|
| Sort + linear scan | O(n log n) | O(1) |
| Jump game variants | O(n) | O(1) |

## Pitfalls

1. **CRITICAL — invalid exchange argument:** If you cannot prove swapping toward the greedy choice is never worse, greedy is wrong — switch to DP. Failing this check is the #1 source of greedy bugs.
2. **Wrong sort key:** Sort by end time for interval scheduling; by start for merging; by ratio for fractional knapsack. Wrong key → wrong answer.
3. **Greedy vs. DP confusion:** Coin change with arbitrary denominations fails greedy; jump game succeeds. When in doubt, ask: "Does an earlier local choice constrain future choices in a way greedy ignores?"

## Proof tools (briefly)

- **Exchange argument:** Assume an optimal solution differs from greedy; show swapping one element toward the greedy choice doesn't worsen the solution → contradiction.
- **Stay-ahead:** Show inductively that at every step, the greedy solution is at least as far ahead as any other solution.

## Common follow-ups

- **Minimum meeting rooms:** use a min-heap of end times (greedy allocation).
- **Candy (LC 135):** two-pass greedy (left → right, right → left).
- **Partition Labels (LC 763):** track last occurrence per character, extend current partition greedily.

## Practice (LeetCode)

- LC 55 — Jump Game
- LC 45 — Jump Game II
- LC 435 — Non-overlapping Intervals
- LC 621 — Task Scheduler
- LC 134 — Gas Station
- LC 763 — Partition Labels
