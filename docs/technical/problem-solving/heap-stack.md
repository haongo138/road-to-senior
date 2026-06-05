---
title: Heap & Stack
description: Top is the most important thing — find the logic with respect to the top element.
tags: [dsa, heap, stack]
category: problem-solving
status: draft
---

# Heap & Stack

**Key idea** — Both structures share a governing principle: **the top is the most important thing. Find the logic with respect to the top element.** Combined with a hashmap, heap and stack are extremely useful in system design (LRU cache, median stream, rate limiter).

**Heap** (priority queue) — always gives you the min (or max) in O(log n). Use for top-K, streaming medians, or any "I need the extreme value at every step" problem.

**Stack** — gives you the most recently seen element in O(1). The **monotonic stack** maintains an increasing or decreasing order, enabling O(n) solutions to "next greater element" style problems.

**When to use**
- Heap: top-K frequent elements, merge K sorted lists, sliding window maximum, task scheduling.
- Stack: next greater / smaller element, largest rectangle in histogram, valid parentheses, expression evaluation.

**Pattern / template**

```go
import "container/heap"

// Go has no built-in heap — implement container/heap interface (5 methods).
type MinHeap []int

func (h MinHeap) Len() int           { return len(h) }
func (h MinHeap) Less(i, j int) bool { return h[i] < h[j] }
func (h MinHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }
func (h *MinHeap) Push(x any)        { *h = append(*h, x.(int)) }
func (h *MinHeap) Pop() any {
    old := *h; n := len(old); x := old[n-1]; *h = old[:n-1]; return x
}

// Top-K smallest — keep a max-heap of size k (negate to invert order)
func topKSmallest(nums []int, k int) {
    h := &MinHeap{}
    heap.Init(h)
    for _, x := range nums {
        heap.Push(h, -x)     // negate → max-heap behaviour
        if h.Len() > k {
            heap.Pop(h)       // evict the largest of the k smallest
        }
    }
    // h now holds (negated) K smallest elements
}

// Stack — a plain slice; push = append, pop = s[:len-1]
// No separate type needed.

// Monotonic stack — next greater element
func nextGreater(nums []int) []int {
    result := make([]int, len(nums))
    for i := range result { result[i] = -1 }
    stack := []int{} // stores indices; top = most recent unresolved index
    for i, x := range nums {
        for len(stack) > 0 && nums[stack[len(stack)-1]] < x {
            top := stack[len(stack)-1]
            stack = stack[:len(stack)-1]
            result[top] = x // x is the next greater for top
        }
        stack = append(stack, i)
    }
    return result
}
```

**Complexity**
- Heap push/pop: O(log n); peek: O(1).
- Monotonic stack: O(n) — each element is pushed and popped at most once.
- Space: O(n) for both.

**Pitfalls**
- Go has no built-in heap — use `container/heap` with the 5-method interface (Len, Less, Swap, Push, Pop). The boilerplate is unavoidable but small.
- For a max-heap, either flip the `Less` method or negate values when pushing/popping.
- Stack is just a slice: `s = append(s, x)` to push; `x, s = s[len(s)-1], s[:len(s)-1]` to pop.
- Monotonic stack direction matters: decreasing stack → next *greater* element; increasing stack → next *smaller*.
- Heap does not sort the full slice — only guarantees the top is the min/max.

## Common follow-ups

- How do you maintain a running median using two heaps?
- When is a monotonic stack increasing vs decreasing, and how does the direction determine what you're computing?
- What is the time complexity of building a heap from an unsorted array, and why?
- How would you implement a max-heap in Go given that `container/heap` is a min-heap by default?

## Practice (LeetCode)

- LC 215 — Kth Largest Element in an Array
- LC 347 — Top K Frequent Elements
- LC 23 — Merge k Sorted Lists
- LC 20 — Valid Parentheses
- LC 739 — Daily Temperatures
- LC 84 — Largest Rectangle in Histogram
