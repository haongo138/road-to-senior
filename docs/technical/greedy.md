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

```python
# Interval scheduling — maximize non-overlapping intervals
# Exchange argument: always pick the interval that ends earliest
def max_non_overlap(intervals):
    intervals.sort(key=lambda x: x[1])   # sort by end time
    count, end = 0, float('-inf')
    for start, finish in intervals:
        if start >= end:
            count += 1
            end = finish
    return count

# Jump Game — can you reach the last index?
def can_jump(nums):
    reach = 0
    for i, jump in enumerate(nums):
        if i > reach:
            return False        # stranded
        reach = max(reach, i + jump)
    return True

# Jump Game II — minimum jumps
def min_jumps(nums):
    jumps = cur_end = farthest = 0
    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == cur_end:        # must jump now
            jumps += 1
            cur_end = farthest
    return jumps
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
