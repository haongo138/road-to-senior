---
title: Prefix Sum
description: Pre-compute cumulative sums to answer range queries in O(1).
tags: [dsa, hashmap, prefix-sum]
category: technical
status: draft
---

# Prefix Sum

**Key idea** — Build a slice `prefix[i] = sum(arr[0..i-1])`. Then any subarray sum `arr[l..r]` = `prefix[r+1] - prefix[l]` in O(1). Pair with a map to count subarrays whose sum equals a target.

**When to use** — Range sum queries, count subarrays with sum = k, subarray sum divisible by k, equilibrium index. Cue: "subarray sum" or "range query."

**Pattern / template**

```go
// buildPrefix returns a prefix-sum slice where prefix[i] = sum(arr[0..i-1])
func buildPrefix(arr []int) []int {
	prefix := make([]int, len(arr)+1)
	for i, x := range arr {
		prefix[i+1] = prefix[i] + x
	}
	return prefix
}

// rangeSum returns sum of arr[l..r] (0-indexed, inclusive) using prefix sums
func rangeSum(prefix []int, l, r int) int {
	return prefix[r+1] - prefix[l]
}

// countSubarraysWithSum counts contiguous subarrays whose sum equals k
func countSubarraysWithSum(arr []int, k int) int {
	count := 0
	running := 0
	seen := map[int]int{0: 1} // empty prefix
	for _, x := range arr {
		running += x
		count += seen[running-k]
		seen[running]++
	}
	return count
}
```

**Complexity**
- Build: O(n) time, O(n) space.
- Each range query: O(1).
- Subarray count with map: O(n) time, O(n) space.

**Pitfalls**
- Off-by-one: `prefix[0] = 0` (empty prefix) is essential — initialise `seen[0] = 1` for the subarray count pattern.
- The map stores prefix sums *seen so far* — do not add the current running sum to `seen` before checking.
- For 2D prefix sums (grid queries), extend to `prefix[i][j]` with inclusion-exclusion.

## Common follow-ups

- How does the prefix sum + hashmap pattern generalise to subarrays divisible by k?
- Why must you initialise `seen[0] = 1` before the loop starts?
- How would you extend this to a 2D grid for rectangular region sum queries?
- When would you use a difference array instead of a prefix sum?

## Practice (LeetCode)

- LC 560 — Subarray Sum Equals K
- LC 303 — Range Sum Query - Immutable
- LC 304 — Range Sum Query 2D - Immutable
- LC 238 — Product of Array Except Self
- LC 525 — Contiguous Array
