---
title: Topological Sort & Shortest Paths
description: Kahn's algorithm for ordering DAGs; Dijkstra for weighted shortest paths.
tags: [dsa, bonus, graph]
category: technical
status: draft
---

# Topological Sort & Shortest Paths

**Key idea** — Two distinct graph algorithms that often appear together in interview problems:
- **Kahn's algorithm** (topological sort): order nodes of a DAG so every edge points forward. Process nodes with in-degree 0 first.
- **Dijkstra's algorithm** (shortest path): find the shortest path from a source in a graph with non-negative edge weights. Greedily expand the unvisited node with the smallest known distance.

**When to use**
- Kahn's: course prerequisites, build order, deadlock detection, any "dependency ordering" problem. Cue: directed graph, "must come before," cycle detection in a DAG.
- Dijkstra: network routing, weighted grid shortest path, "minimum cost to reach target." Cue: non-negative weights, "shortest/cheapest path."

**Pattern / template**

```go
import "container/heap"

// topoSort returns a topological ordering of n nodes given prerequisite pairs.
// Returns nil if a cycle is detected.
func topoSort(n int, prerequisites [][2]int) []int {
	graph := make([][]int, n)
	inDeg := make([]int, n)
	for _, e := range prerequisites {
		u, v := e[0], e[1] // u must come before v
		graph[u] = append(graph[u], v)
		inDeg[v]++
	}
	queue := []int{}
	for i := 0; i < n; i++ {
		if inDeg[i] == 0 {
			queue = append(queue, i)
		}
	}
	order := make([]int, 0, n)
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		order = append(order, node)
		for _, nb := range graph[node] {
			inDeg[nb]--
			if inDeg[nb] == 0 {
				queue = append(queue, nb)
			}
		}
	}
	if len(order) == n {
		return order
	}
	return nil // cycle exists
}

// dijkstra returns shortest distances from src.
// graph[u] holds (neighbor, weight) pairs as [2]int.
func dijkstra(graph [][][2]int, src int) []int {
	const inf = 1<<31 - 1
	dist := make([]int, len(graph))
	for i := range dist {
		dist[i] = inf
	}
	dist[src] = 0
	h := &minHeap{{0, src}} // (cost, node)
	heap.Init(h)
	for h.Len() > 0 {
		item := heap.Pop(h).([2]int)
		cost, node := item[0], item[1]
		if cost > dist[node] {
			continue // stale entry
		}
		for _, edge := range graph[node] {
			nb, w := edge[0], edge[1]
			if newCost := cost + w; newCost < dist[nb] {
				dist[nb] = newCost
				heap.Push(h, [2]int{newCost, nb})
			}
		}
	}
	return dist
}

type minHeap [][2]int

func (h minHeap) Len() int            { return len(h) }
func (h minHeap) Less(i, j int) bool  { return h[i][0] < h[j][0] }
func (h minHeap) Swap(i, j int)       { h[i], h[j] = h[j], h[i] }
func (h *minHeap) Push(x any)         { *h = append(*h, x.([2]int)) }
func (h *minHeap) Pop() any           { old := *h; x := old[len(old)-1]; *h = old[:len(old)-1]; return x }
```

**Complexity**
- Kahn's: O(V + E) time and space.
- Dijkstra with a binary heap: O((V + E) log V) time, O(V) space.

**Pitfalls**
- Kahn's cycle detection: if `len(order) < n` after the loop, a cycle exists.
- Dijkstra requires non-negative weights; use Bellman-Ford for negative edges.
- Dijkstra stale-entry check (`cost > dist[node]`) is essential to avoid reprocessing nodes.
- Do not confuse topological sort (DAG ordering) with cycle detection (which is a side-effect of Kahn's).

## Common follow-ups

- How do you detect a cycle using Kahn's algorithm, and what does the output tell you?
- When should you use Bellman-Ford instead of Dijkstra, and what is the cost?
- How does topological sort enable O(V+E) shortest path computation on a DAG?
- How do you reconstruct the actual shortest path from Dijkstra's `dist` table?

## Practice (LeetCode)

- LC 207 — Course Schedule
- LC 210 — Course Schedule II
- LC 269 — Alien Dictionary
- LC 743 — Network Delay Time
- LC 787 — Cheapest Flights Within K Stops
