---
title: Linked List
description: Core linked-list patterns — dummy head, fast/slow pointers, in-place reversal, and merging.
tags: [dsa, linked-list]
category: problem-solving
status: draft
---

# Linked List

**Key idea:** Most linked-list problems reduce to three primitives: (1) a **dummy head** node to simplify edge cases, (2) **fast/slow pointers** for cycle detection and middle-finding, and (3) **in-place pointer reversal** by carefully saving `next` before overwriting it.

## When to use

- "Detect a cycle" or "find the middle"
- "Reverse" all or part of a list
- "Merge" two sorted lists
- "Remove kth node from end" (two-pointer gap)

## Pattern / template

```go
type ListNode struct {
	Val  int
	Next *ListNode
}

// Dummy head (simplifies insert/remove at head)
// dummy := &ListNode{}; dummy.Next = head

// reverse — in-place reversal; returns new head
func reverse(head *ListNode) *ListNode {
	var prev *ListNode
	curr := head
	for curr != nil {
		nxt := curr.Next // SAVE before overwriting
		curr.Next = prev
		prev = curr
		curr = nxt
	}
	return prev // new head
}

// findMiddle — fast/slow pointers; slow lands on middle
func findMiddle(head *ListNode) *ListNode {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
	}
	return slow
}

// hasCycle — Floyd's cycle detection
func hasCycle(head *ListNode) bool {
	slow, fast := head, head
	for fast != nil && fast.Next != nil {
		slow = slow.Next
		fast = fast.Next.Next
		if slow == fast {
			return true // cycle exists
		}
	}
	return false
}

// mergeSorted — merge two sorted lists
func mergeSorted(l1, l2 *ListNode) *ListNode {
	dummy := &ListNode{}
	cur := dummy
	for l1 != nil && l2 != nil {
		if l1.Val <= l2.Val {
			cur.Next = l1
			l1 = l1.Next
		} else {
			cur.Next = l2
			l2 = l2.Next
		}
		cur = cur.Next
	}
	if l1 != nil {
		cur.Next = l1
	} else {
		cur.Next = l2
	}
	return dummy.Next
}
```

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Reversal | O(n) | O(1) |
| Find middle | O(n) | O(1) |
| Cycle detect | O(n) | O(1) |
| Merge two lists | O(n + m) | O(1) |

## Pitfalls

1. **Losing `next` before reassignment** — always `nxt = curr.next` first.
2. **Nil pointer** — check `node != nil && node.Next != nil` before advancing fast pointer.
3. **Forgetting the dummy head** — skipping it forces special-casing for the head node.

## Common follow-ups

- **k-Group reversal (LC 25):** reverse chunks of k nodes; recurse or iterate with a counter.
- **LRU Cache (LC 146):** doubly-linked list + hash map; move-to-front on access.
- **Palindrome check:** find middle → reverse second half → compare.

## Practice (LeetCode)

- LC 206 — Reverse Linked List
- LC 21 — Merge Two Sorted Lists
- LC 141 — Linked List Cycle
- LC 19 — Remove Nth Node From End of List
- LC 25 — Reverse Nodes in k-Group
- LC 146 — LRU Cache
