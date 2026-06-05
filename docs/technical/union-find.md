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

```go
type UnionFind struct {
	parent []int
	rank   []int
}

func NewUnionFind(n int) *UnionFind {
	parent := make([]int, n)
	for i := range parent {
		parent[i] = i
	}
	return &UnionFind{parent: parent, rank: make([]int, n)}
}

func (uf *UnionFind) Find(x int) int {
	if uf.parent[x] != x {
		uf.parent[x] = uf.Find(uf.parent[x]) // path compression
	}
	return uf.parent[x]
}

// Union merges the sets containing x and y.
// Returns false if already connected (cycle detected).
func (uf *UnionFind) Union(x, y int) bool {
	px, py := uf.Find(x), uf.Find(y)
	if px == py {
		return false // already connected
	}
	// union by rank
	if uf.rank[px] < uf.rank[py] {
		px, py = py, px
	}
	uf.parent[py] = px
	if uf.rank[px] == uf.rank[py] {
		uf.rank[px]++
	}
	return true
}

func (uf *UnionFind) Connected(x, y int) bool {
	return uf.Find(x) == uf.Find(y)
}
```

**Complexity**
- With both optimisations: O(α(n)) amortised per operation (α = inverse Ackermann — effectively constant).
- Space: O(n).

**Pitfalls**
- Forgetting path compression means `find` degrades to O(n) for skewed trees.
- `Union` should return `false` (not crash) when the two nodes are already in the same set — this is how you detect cycles.
- DSU only handles *undirected* connectivity; for directed reachability, use DFS/BFS instead.

## Common follow-ups

- Why does path compression alone not give you the best amortised bound — what does union by rank add?
- How does Union-Find detect a cycle during edge insertion?
- How would you use DSU to implement Kruskal's MST algorithm?
- Can you use DSU for a directed graph? Why or why not?

## Practice (LeetCode)

- LC 547 — Number of Provinces
- LC 200 — Number of Islands
- LC 684 — Redundant Connection
- LC 721 — Accounts Merge
- LC 1319 — Number of Operations to Make Network Connected
