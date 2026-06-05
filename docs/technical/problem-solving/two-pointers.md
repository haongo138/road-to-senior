---
title: Two Pointers
description: The main technique for sub-array conditions — slow/fast or opposite-ends pointers.
tags: [dsa, two-pointers]
category: problem-solving
status: draft
---

# Two Pointers

**Key idea** — Two Pointers is the main algorithm to check a sub-array with given conditions. Three flavours:
1. **Sub-array not fixed length** — window grows/shrinks (see [Sliding Window](./sliding-window) for the full pattern).
2. **Slow-fast pointers** — one pointer advances faster; used for cycle detection, finding the middle, removing duplicates in-place.
3. **One input, opposite-ends pointers** — `left` starts at 0, `right` at `n-1`, and they move toward each other; used for sorted arrays (two-sum, container with most water, palindrome check).

**When to use** — Sorted array problems, in-place array manipulation, linked-list cycle detection (Floyd's), palindrome verification, container/water problems. Cue: "sorted array," "in-place," "two values that sum to target."

**Pattern / template**

```go
// twoSumSorted — opposite-ends pointers on a sorted array
func twoSumSorted(nums []int, target int) []int {
	left, right := 0, len(nums)-1
	for left < right {
		s := nums[left] + nums[right]
		switch {
		case s == target:
			return []int{left, right}
		case s < target:
			left++
		default:
			right--
		}
	}
	return nil
}

type ListNode struct {
	Val  int
	Next *ListNode
}

// hasCycle — slow/fast pointers (Floyd's cycle detection)
func hasCycle(head *ListNode) bool {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
		if slow == fast {
			return true
		}
	}
	return false
}
```

**Complexity**
- Opposite-ends / slow-fast: O(n) time, O(1) space.
- Works only when a single pass is sufficient — the sorted precondition or cycle property enables the convergence argument.

**Pitfalls**
- Opposite-ends only works on *sorted* input (or when a monotone property lets you discard one side safely).
- Slow-fast cycle detection: start both at `head`, not `head.next`, to handle single-element lists.
- Don't use two pointers on unsorted data hoping to find a pair — sort first or use a map.

## Common follow-ups

- How do you extend Two Sum to 3Sum or 4Sum while avoiding duplicates?
- How does slow-fast pointer detect where a cycle starts, not just whether one exists?
- Why does the opposite-ends approach require the array to be sorted, and what is the invariant being maintained?
- How would you solve "trapping rain water" and what makes two pointers work there?

## Practice (LeetCode)

- LC 167 — Two Sum II - Input Array Is Sorted
- LC 15 — 3Sum
- LC 11 — Container With Most Water
- LC 125 — Valid Palindrome
- LC 42 — Trapping Rain Water
