---
title: Two Pointers
description: The main technique for sub-array conditions — slow/fast or opposite-ends pointers.
tags: [dsa, two-pointers]
category: technical
status: draft
---

# Two Pointers

**Key idea** — Two Pointers is the main algorithm to check a sub-array with given conditions. Three flavours:
1. **Sub-array not fixed length** — window grows/shrinks (see [Sliding Window](./sliding-window) for the full pattern).
2. **Slow-fast pointers** — one pointer advances faster; used for cycle detection, finding the middle, removing duplicates in-place.
3. **One input, opposite-ends pointers** — `left` starts at 0, `right` at `n-1`, and they move toward each other; used for sorted arrays (two-sum, container with most water, palindrome check).

**When to use** — Sorted array problems, in-place array manipulation, linked-list cycle detection (Floyd's), palindrome verification, container/water problems. Cue: "sorted array," "in-place," "two values that sum to target."

**Pattern / template**

```python
# Opposite-ends (sorted array — two sum variant)
def two_sum_sorted(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        s = nums[left] + nums[right]
        if s == target:
            return [left, right]
        elif s < target:
            left += 1
        else:
            right -= 1
    return []

# Slow-fast (linked list cycle detection — Floyd's)
def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False
```

**Complexity**
- Opposite-ends / slow-fast: O(n) time, O(1) space.
- Works only when a single pass is sufficient — the sorted precondition or cycle property enables the convergence argument.

**Pitfalls**
- Opposite-ends only works on *sorted* input (or when a monotone property lets you discard one side safely).
- Slow-fast cycle detection: start both at `head`, not `head.next`, to handle single-element lists.
- Don't use two pointers on unsorted data hoping to find a pair — sort first or use a hashmap.
