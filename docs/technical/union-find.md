---
title: Union-Find (DSU)
description: Disjoint Set Union with path compression and union by rank for near-O(1) connectivity.
tags: [dsa, bonus, union-find]
category: technical
status: draft
---

# Union-Find (DSU)

**Key idea** — Union-Find (Disjoint Set Union) tracks which elements belong to the same connected component. Two optimisations make every operation nearly O(1): **path compression** (flatten the tree during `find`) and **union by rank** (always attach the smaller tree under the larger).

**When to use** — Dynamic connectivity, number of connected components, cycle detection in undirected graphs, Kruskal's MST algorithm, accounts merge. Cue: "are X and Y connected?", "merge groups."

**Pattern / template**

```python
class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank   = [0] * n

    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # path compression
        return self.parent[x]

    def union(self, x, y) -> bool:
        px, py = self.find(x), self.find(y)
        if px == py:
            return False  # already connected (cycle detected)
        # union by rank
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        return True

    def connected(self, x, y) -> bool:
        return self.find(x) == self.find(y)
```

**Complexity**
- With both optimisations: O(α(n)) amortised per operation (α = inverse Ackermann — effectively constant).
- Space: O(n).

**Pitfalls**
- Forgetting path compression means `find` degrades to O(n) for skewed trees.
- `union` should return `False` (not crash) when the two nodes are already in the same set — this is how you detect cycles.
- DSU only handles *undirected* connectivity; for directed reachability, use DFS/BFS instead.
