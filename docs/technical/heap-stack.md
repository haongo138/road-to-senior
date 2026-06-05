---
title: Heap & Stack
description: Top is the most important thing — find the logic with respect to the top element.
tags: [dsa, heap, stack]
category: technical
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

```python
import heapq

# Min-heap — top-K smallest
heap = []
for x in nums:
    heapq.heappush(heap, x)
    if len(heap) > k:
        heapq.heappop(heap)  # evict the largest of the k smallest
# heap now contains the K smallest elements

# Monotonic stack — next greater element
def next_greater(nums):
    result = [-1] * len(nums)
    stack = []  # stores indices; stack top = most recent unresolved index
    for i, x in enumerate(nums):
        while stack and nums[stack[-1]] < x:
            result[stack.pop()] = x  # x is the next greater for the top
        stack.append(i)
    return result
```

**Complexity**
- Heap push/pop: O(log n); peek: O(1).
- Monotonic stack: O(n) — each element is pushed and popped at most once.
- Space: O(n) for both.

**Pitfalls**
- Python's `heapq` is a *min*-heap. For max-heap, negate values: push `-x`, pop and negate.
- Monotonic stack direction matters: decreasing stack → next *greater* element; increasing stack → next *smaller*.
- Heap does not sort the full array — only guarantees the top is the min/max.

## Common follow-ups

- How do you maintain a running median using two heaps?
- When is a monotonic stack increasing vs decreasing, and how does the direction determine what you're computing?
- What is the time complexity of building a heap from an unsorted array, and why?
- How would you implement a max-heap in Python given that `heapq` is a min-heap?

## Practice (LeetCode)

- LC 215 — Kth Largest Element in an Array
- LC 347 — Top K Frequent Elements
- LC 23 — Merge k Sorted Lists
- LC 20 — Valid Parentheses
- LC 739 — Daily Temperatures
- LC 84 — Largest Rectangle in Histogram
