---
title: Graphs
description: Generalised trees with cycles — DFS, BFS, adjacency list, visited set.
tags: [dsa, graph]
category: problem-solving
status: draft
---

# Graphs

**Key idea** — A graph is a tree that can have cycles and multiple parents. The same DFS/BFS recursion applies, but you *must* track a `visited` map to avoid infinite loops. Represent the graph as an adjacency list (`map[int][]int`) for O(V+E) traversal.

**When to use** — Connected components, shortest path (unweighted → BFS, weighted → Dijkstra), cycle detection, topological sort, islands/grid problems, dependency resolution.

**Pattern / template**

```go
// Build adjacency list
func buildGraph(n int, edges [][2]int) map[int][]int {
    graph := make(map[int][]int, n)
    for _, e := range edges {
        u, v := e[0], e[1]
        graph[u] = append(graph[u], v)
        graph[v] = append(graph[v], u) // omit for directed graph
    }
    return graph
}

// DFS (recursive)
func dfs(node int, graph map[int][]int, visited map[int]bool) {
    visited[node] = true
    for _, neighbor := range graph[node] {
        if !visited[neighbor] {
            dfs(neighbor, graph, visited)
        }
    }
}

// BFS (shortest path — unweighted); returns dist map from start
func bfs(start int, graph map[int][]int) map[int]int {
    dist := map[int]int{start: 0}
    queue := []int{start}
    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        for _, neighbor := range graph[node] {
            if _, seen := dist[neighbor]; !seen {
                dist[neighbor] = dist[node] + 1
                queue = append(queue, neighbor)
            }
        }
    }
    return dist
}
```

**Complexity**
- DFS / BFS: O(V + E) time, O(V) space for visited set.
- Adjacency list: O(V + E) space (preferred over matrix for sparse graphs).

**Pitfalls**
- Omitting the `visited` map causes infinite recursion in cyclic graphs.
- For directed graphs, "visited" during DFS does not mean "fully processed" — use a three-colour scheme (white/grey/black) to detect back edges for cycle detection.
- Grid problems are graphs in disguise; treat each cell as a node and cardinal neighbours as edges.

## BFS vs DFS

| Algorithm | Best for |
|---|---|
| BFS | Shortest path in an unweighted graph; processing nodes by level or distance |
| DFS | Connectivity, cycle detection, topological ordering, path enumeration / backtracking |

## Common follow-ups

- When does BFS give you the shortest path, and why doesn't DFS guarantee it?
- How do you detect a cycle in a directed graph vs an undirected graph?
- How would you extend this to a weighted graph (Dijkstra vs Bellman-Ford)?
- How do you handle disconnected graphs to ensure all components are visited?

## Practice (LeetCode)

- LC 200 — Number of Islands
- LC 133 — Clone Graph
- LC 207 — Course Schedule
- LC 994 — Rotting Oranges
- LC 417 — Pacific Atlantic Water Flow
