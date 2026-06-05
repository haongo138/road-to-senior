---
title: Difference Array
description: Apply range updates in O(1); reconstruct via prefix sum.
tags: [dsa, bonus, difference-array]
category: technical
status: draft
---

# Difference Array

**Key idea** — A difference array `diff` lets you add a value `v` to every element in range `[l, r]` in O(1) by doing `diff[l] += v` and `diff[r+1] -= v`. After all updates, reconstruct the original array with a prefix sum pass. Flip the usual relationship: prefix sum *builds* from a difference array.

**When to use** — Multiple range increment/decrement operations on a slice, flight/meeting booking (find peak simultaneous bookings), corporate flight bookings. Cue: "add value to range," "how many events overlap at each point."

**Pattern / template**

```go
// applyRangeUpdates applies range add-updates and returns the result slice.
// updates: each entry is [l, r, val] — add val to arr[l..r] (0-indexed).
func applyRangeUpdates(n int, updates [][3]int) []int {
    diff := make([]int, n+1) // extra slot so diff[r+1] is always safe

    for _, u := range updates {
        l, r, val := u[0], u[1], u[2]
        diff[l] += val
        diff[r+1] -= val // sentinel cancels after range
    }

    // Reconstruct with prefix sum
    result := make([]int, n)
    running := 0
    for i := 0; i < n; i++ {
        running += diff[i]
        result[i] = running
    }
    return result
}
```

**Complexity**
- Each range update: O(1).
- Reconstruction: O(n).
- Total for k updates: O(k + n) vs O(k × n) naïve.

**Pitfalls**
- Allocate `diff` with size `n + 1` (one extra) to safely write `diff[r+1]` when `r == n-1`.
- 0-indexed vs 1-indexed: be consistent between the problem's indexing and the diff array.
- Difference array only works for additive (group) operations — it does not generalise to multiply or bitwise updates.

## Common follow-ups

- What is the relationship between a difference array and a prefix sum — how are they inverses of each other?
- How do you find the maximum number of overlapping intervals using a difference array?
- How would you handle range updates that wrap around (circular array)?
- When would you prefer a segment tree or BIT over a difference array?

## Practice (LeetCode)

- LC 1109 — Corporate Flight Bookings
- LC 1094 — Car Pooling
- LC 370 — Range Addition
- LC 2381 — Shifting Letters II
