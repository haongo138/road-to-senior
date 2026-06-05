---
title: Prefix Sum
description: Pre-compute cumulative sums to answer range queries in O(1).
tags: [dsa, hashmap, prefix-sum]
category: technical
status: draft
---

# Prefix Sum

**Key idea** — Build an array `prefix[i] = sum(arr[0..i-1])`. Then any subarray sum `arr[l..r]` = `prefix[r+1] - prefix[l]` in O(1). Pair with a hashmap to count subarrays whose sum equals a target.

**When to use** — Range sum queries, count subarrays with sum = k, subarray sum divisible by k, equilibrium index. Cue: "subarray sum" or "range query."

**Pattern / template**

```python
# Build prefix sums
prefix = [0] * (len(arr) + 1)
for i, x in enumerate(arr):
    prefix[i+1] = prefix[i] + x

# Range sum [l, r] (0-indexed, inclusive)
range_sum = prefix[r+1] - prefix[l]

# Count subarrays with sum == k (hashmap trick)
from collections import defaultdict
count = 0
running = 0
seen = defaultdict(int)
seen[0] = 1          # empty prefix
for x in arr:
    running += x
    count += seen[running - k]
    seen[running] += 1
```

**Complexity**
- Build: O(n) time, O(n) space.
- Each range query: O(1).
- Subarray count with hashmap: O(n) time, O(n) space.

**Pitfalls**
- Off-by-one: `prefix[0] = 0` (empty prefix) is essential — initialise `seen[0] = 1` for the subarray count pattern.
- The hashmap stores prefix sums *seen so far* — do not add the current running sum to `seen` before checking.
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
