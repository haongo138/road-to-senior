---
title: Binary Search
description: Define what you're searching for — the validation function is the most important thing.
tags: [dsa, binary-search]
category: problem-solving
status: draft
---

# Binary Search

**Key idea** — Define what you are searching for, and the **validation (predicate) function is the most important thing**. Binary search works on any *monotone* space: once you can answer "is this candidate too small?" with a yes/no that flips exactly once across the search space, you can bisect it.

Classic use: find a value in a sorted array. Advanced use (binary search on answer): "find the minimum capacity such that X is possible" — the predicate is `feasible(mid)`.

**When to use** — Sorted array lookup, finding the first/last occurrence, rotated sorted array, "minimum/maximum value such that condition holds", matrix search, peak finding. Cue: "sorted," "monotone," or "find the optimal value in a range."

**Pattern / template**

```go
// Classic — find target in sorted array
func binarySearch(arr []int, target int) int {
    lo, hi := 0, len(arr)-1
    for lo <= hi {
        mid := lo + (hi-lo)/2
        if arr[mid] == target {
            return mid
        } else if arr[mid] < target {
            lo = mid + 1
        } else {
            hi = mid - 1
        }
    }
    return -1
}

// Binary search on answer — find minimum feasible value
func minFeasible(lo, hi int, feasible func(int) bool) int {
    // feasible(x): returns true when x is large enough
    for lo < hi {
        mid := lo + (hi-lo)/2
        if feasible(mid) {
            hi = mid      // mid could be the answer; try smaller
        } else {
            lo = mid + 1  // too small; must go larger
        }
    }
    return lo // lo == hi == answer
}
```

**Complexity**
- O(log n) time, O(1) space.
- For "binary search on answer" the total time is O(log(range) × cost_of_feasible).

**Pitfalls**
- Integer overflow: use `mid = lo + (hi-lo)/2` not `(lo+hi)/2`.
- Off-by-one in loop invariant: `lo <= hi` for exact match; `lo < hi` for lower-bound style.
- The predicate must be *strictly monotone* — if it can flip back and forth, binary search gives wrong answers.
- Forgetting to update both `lo` and `hi` inside every branch leads to infinite loops.

## Leftmost vs rightmost

When searching for the boundary of a monotonic predicate (e.g. first/last position of a value), you are not searching for a value but for the point where the predicate flips from false to true. Bias the midpoint down (`lo + (hi-lo)/2`) and update `lo` or `hi` — never exclude `mid` from the next range — to converge on the first-true (leftmost) or last-true (rightmost) boundary. Use `lo < hi` as the loop condition (not `lo <= hi`) so the loop exits with `lo == hi` at the answer.

## Common follow-ups

- How do you adapt binary search to find the leftmost vs rightmost occurrence of a target?
- How do you binary-search on the answer when there is no explicit sorted array?
- What makes a space suitable for binary search — what property must the predicate satisfy?
- How does binary search work on a rotated sorted array, and which half can you safely discard?

## Practice (LeetCode)

- LC 704 — Binary Search
- LC 33 — Search in Rotated Sorted Array
- LC 34 — Find First and Last Position of Element in Sorted Array
- LC 153 — Find Minimum in Rotated Sorted Array
- LC 875 — Koko Eating Bananas
- LC 4 — Median of Two Sorted Arrays
