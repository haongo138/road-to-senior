---
title: Sliding Window
description: Maintain a variable-length window that grows and shrinks to satisfy a condition.
tags: [dsa, two-pointers, sliding-window]
category: technical
status: draft
---

# Sliding Window

**Key idea** — Keep two pointers `left` and `right` defining a window over the array or string. Expand `right` to include new elements; shrink from `left` when the window violates the target condition. The window "slides" forward, giving O(n) instead of O(n²) brute force.

**When to use** — Longest/shortest subarray or substring satisfying a condition (max sum ≤ k, no repeating characters, at most k distinct characters, minimum window containing all target characters). Cue: "contiguous subarray / substring."

**Pattern / template**

```python
def sliding_window(arr, condition):
    left = 0
    window_state = initial_state()
    best = 0  # or float('inf') for minimum

    for right in range(len(arr)):
        # 1. Expand — add arr[right] to window
        add(window_state, arr[right])

        # 2. Shrink — while condition violated, move left forward
        while window_violates(window_state):
            remove(window_state, arr[left])
            left += 1

        # 3. Record answer for valid window
        best = update(best, right - left + 1)

    return best
```

Fixed-size window variant — just move `left = right - k + 1` unconditionally.

**Complexity**
- O(n) time — each element enters and leaves the window at most once.
- O(1) or O(alphabet) space for the window state.

**Pitfalls**
- Using a nested loop instead of the shrink step defeats the purpose (back to O(n²)).
- For "at most k" problems, the answer is every valid `[left, right]` window, not just the moment `right` stops.
- Fixed vs variable window: know which you need before coding. Fixed windows are simpler — avoid adding shrink logic that isn't needed.
