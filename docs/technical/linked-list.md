---
title: Linked List
description: Core linked-list patterns — dummy head, fast/slow pointers, in-place reversal, and merging.
tags: [dsa, linked-list]
category: technical
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

```python
# Dummy head (simplifies insert/remove at head)
dummy = ListNode(0)
dummy.next = head

# In-place reversal
prev, curr = None, head
while curr:
    nxt = curr.next      # SAVE before overwriting
    curr.next = prev
    prev = curr
    curr = nxt
return prev              # new head

# Fast/slow — find middle
slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
# slow is at middle

# Cycle detection (Floyd)
slow = fast = head
while fast and fast.next:
    slow, fast = slow.next, fast.next.next
    if slow is fast:
        return True   # cycle exists
return False

# Merge two sorted lists
def merge(l1, l2):
    dummy = ListNode(0)
    cur = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            cur.next, l1 = l1, l1.next
        else:
            cur.next, l2 = l2, l2.next
        cur = cur.next
    cur.next = l1 or l2
    return dummy.next
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
2. **Null pointer** — check `node and node.next` before advancing fast pointer.
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
