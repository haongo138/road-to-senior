---
title: Divide and Conquer
description: Split the problem in half, solve each half recursively, then merge.
tags: [dsa, recursion, divide-and-conquer]
category: technical
status: draft
---

# Divide and Conquer

**Key idea** — Like tree recursion, but the split is deliberate: break the input into independent (non-overlapping) halves, recurse on each, then merge the results. Unlike DP, sub-problems do *not* overlap so no caching is needed.

**When to use** — Merge sort, quick sort, binary search, "find maximum sub-array" (Kadane can also apply), closest pair of points, matrix exponentiation. Cue: "split input, solve left half and right half independently, combine."

**Pattern / template**

```python
def solve(arr, lo, hi):
    # Base case
    if lo >= hi:
        return base_answer(arr[lo])

    mid = (lo + hi) // 2

    left  = solve(arr, lo, mid)      # solve left half
    right = solve(arr, mid + 1, hi)  # solve right half

    return merge(left, right)        # combine
```

Merge sort is the canonical example — `merge` takes O(n) and recurrence is T(n) = 2T(n/2) + O(n) → O(n log n).

**Complexity**
- Master theorem: T(n) = aT(n/b) + f(n).
- Typical (a=2, b=2, f=O(n)): O(n log n).
- Space: O(log n) call stack; merge sort needs O(n) auxiliary space.

**Pitfalls**
- Forgetting to handle the base case for a single element vs empty range.
- Off-by-one in `mid` calculation — use `lo + (hi - lo) // 2` to avoid integer overflow in languages without big integers.
- Merge step must handle both halves being fully consumed before the loop exits.
