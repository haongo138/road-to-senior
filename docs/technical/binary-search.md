---
title: Binary Search
description: Define what you're searching for — the validation function is the most important thing.
tags: [dsa, binary-search]
category: technical
status: draft
---

# Binary Search

**Key idea** — Define what you are searching for, and the **validation (predicate) function is the most important thing**. Binary search works on any *monotone* space: once you can answer "is this candidate too small?" with a yes/no that flips exactly once across the search space, you can bisect it.

Classic use: find a value in a sorted array. Advanced use (binary search on answer): "find the minimum capacity such that X is possible" — the predicate is `feasible(mid)`.

**When to use** — Sorted array lookup, finding the first/last occurrence, rotated sorted array, "minimum/maximum value such that condition holds", matrix search, peak finding. Cue: "sorted," "monotone," or "find the optimal value in a range."

**Pattern / template**

```python
# Classic — find target in sorted array
def binary_search(arr, target):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

# Binary search on answer — find minimum feasible value
def min_feasible(lo, hi, feasible):
    # feasible(x): returns True when x is large enough
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if feasible(mid):
            hi = mid        # mid could be the answer; try smaller
        else:
            lo = mid + 1    # too small; must go larger
    return lo               # lo == hi == answer
```

**Complexity**
- O(log n) time, O(1) space.
- For "binary search on answer" the total time is O(log(range) × cost_of_feasible).

**Pitfalls**
- Integer overflow: use `mid = lo + (hi - lo) // 2` not `(lo + hi) // 2`.
- Off-by-one in loop invariant: `lo <= hi` for exact match; `lo < hi` for lower-bound style.
- The predicate must be *strictly monotone* — if it can flip back and forth, binary search gives wrong answers.
- Forgetting to update both `lo` and `hi` inside every branch leads to infinite loops.
