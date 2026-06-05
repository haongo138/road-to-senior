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

```go
// slidingWindow finds the length of the longest subarray satisfying a condition.
// Customize windowViolates and the window state for the specific problem.
func slidingWindow(arr []int) int {
	left := 0
	windowState := map[int]int{} // example: frequency map
	best := 0                    // use math.MaxInt for minimum-length problems

	for right := 0; right < len(arr); right++ {
		// 1. Expand — add arr[right] to window
		windowState[arr[right]]++

		// 2. Shrink — while condition violated, move left forward
		for windowViolates(windowState) {
			windowState[arr[left]]--
			if windowState[arr[left]] == 0 {
				delete(windowState, arr[left])
			}
			left++
		}

		// 3. Record answer for valid window
		if size := right - left + 1; size > best {
			best = size
		}
	}
	return best
}

// windowViolates is a placeholder — replace with the actual constraint check.
func windowViolates(state map[int]int) bool { return false }
```

Fixed-size window variant — just move `left = right - k + 1` unconditionally.

**Complexity**
- O(n) time — each element enters and leaves the window at most once.
- O(1) or O(alphabet) space for the window state.

**Pitfalls**
- Using a nested loop instead of the shrink step defeats the purpose (back to O(n²)).
- For "at most k" problems, the answer is every valid `[left, right]` window, not just the moment `right` stops.
- Fixed vs variable window: know which you need before coding. Fixed windows are simpler — avoid adding shrink logic that isn't needed.

## Common follow-ups

- How does the sliding window for "at most k distinct characters" differ from "exactly k distinct"?
- What window state do you maintain for minimum window substring, and how do you know the window is valid?
- When would a deque (monotonic queue) replace a simple counter inside the window?
- How do you adapt the template when the array contains negative numbers?

## Practice (LeetCode)

- LC 3 — Longest Substring Without Repeating Characters
- LC 76 — Minimum Window Substring
- LC 424 — Longest Repeating Character Replacement
- LC 209 — Minimum Size Subarray Sum
- LC 567 — Permutation in String
