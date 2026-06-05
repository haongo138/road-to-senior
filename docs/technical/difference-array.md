---
title: Difference Array
description: Apply range updates in O(1); reconstruct via prefix sum.
tags: [dsa, bonus, difference-array]
category: technical
status: draft
---

# Difference Array

**Key idea** — A difference array `diff` lets you add a value `v` to every element in range `[l, r]` in O(1) by doing `diff[l] += v` and `diff[r+1] -= v`. After all updates, reconstruct the original array with a prefix sum pass. Flip the usual relationship: prefix sum *builds* from a difference array.

**When to use** — Multiple range increment/decrement operations on an array, flight/meeting booking (find peak simultaneous bookings), corporate flight bookings. Cue: "add value to range," "how many events overlap at each point."

**Pattern / template**

```python
def apply_range_updates(n, updates):
    # updates: list of (l, r, val) — add val to arr[l..r]
    diff = [0] * (n + 1)

    for l, r, val in updates:
        diff[l]   += val
        diff[r+1] -= val   # sentinel cancels after range

    # Reconstruct with prefix sum
    result = []
    running = 0
    for i in range(n):
        running += diff[i]
        result.append(running)
    return result
```

**Complexity**
- Each range update: O(1).
- Reconstruction: O(n).
- Total for k updates: O(k + n) vs O(k × n) naïve.

**Pitfalls**
- Allocate `diff` with size `n + 1` (one extra) to safely write `diff[r+1]` when `r == n-1`.
- 0-indexed vs 1-indexed: be consistent between the problem's indexing and the diff array.
- Difference array only works for additive (group) operations — it does not generalise to multiply or bitwise updates.
