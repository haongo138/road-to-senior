---
title: Trees & Recursion
description: The gateway to the recursion family — base cases, recurrence relations, DFS & BFS.
tags: [dsa, recursion, tree]
category: technical
status: draft
---

# Trees & Recursion

**Key idea** — A tree problem is a recursion problem in disguise. Every node delegates work to its children and combines their results on the way back up. Master this mental model and backtracking, DP, divide-and-conquer, and graph traversal all follow.

Recursion checklist (apply to every tree problem):
1. **Base case** — what is the answer for an empty node / leaf?
2. **Recurrence relation** — how does the answer for a node depend on the answers of its children?
3. **How children respond to their parents** — what value does each recursive call return, and how do you combine them?
4. **DFS vs BFS** — depth-first (stack/recursion) for path problems; breadth-first (queue) for level-order or shortest-path problems.

**When to use** — any problem involving hierarchical data, tree traversal, path sums, lowest common ancestor, or "for each node do X using its subtree result."

**Pattern / template**

```python
def solve(node):
    # 1. Base case
    if node is None:
        return BASE_VALUE

    # 2. Recurse into children (recurrence relation)
    left  = solve(node.left)
    right = solve(node.right)

    # 3. Combine and return to parent
    return combine(node.val, left, right)
```

BFS template:

```python
from collections import deque

def bfs(root):
    queue = deque([root])
    while queue:
        node = queue.popleft()
        process(node)
        if node.left:  queue.append(node.left)
        if node.right: queue.append(node.right)
```

**Complexity**
- DFS traversal: O(n) time, O(h) space (h = height; worst O(n) for skewed tree)
- BFS traversal: O(n) time, O(n) space (queue holds up to one full level)

**Pitfalls**
- Forgetting the null / empty base case causes NullPointerException.
- Mixing up what the recursive call *returns* vs what it *does* (return value vs side effect).
- Using BFS when DFS is sufficient wastes memory; prefer DFS unless level-order is required.

## Traversal cheat sheet

| Order | Sequence | Typical use |
|---|---|---|
| Pre-order | root → L → R | Serialize / clone a tree |
| In-order | L → root → R | BST sorted output, kth smallest |
| Post-order | L → R → root | Aggregate from children (tree DP, diameter) |
| Level-order | BFS layer by layer | By layer / by distance |

## Common follow-ups

- How would you solve this iteratively instead of recursively?
- What changes if the tree is a BST — can you exploit the ordering property?
- How do you find the diameter (longest path between any two nodes)?
- How would you serialize and deserialize a binary tree?

## Practice (LeetCode)

- LC 104 — Maximum Depth of Binary Tree
- LC 102 — Binary Tree Level Order Traversal
- LC 226 — Invert Binary Tree
- LC 236 — Lowest Common Ancestor of a Binary Tree
- LC 124 — Binary Tree Maximum Path Sum
