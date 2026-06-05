---
title: Graphs
description: Generalised trees with cycles — DFS, BFS, adjacency list, visited set.
tags: [dsa, graph]
category: technical
status: draft
---

# Graphs

**Key idea** — A graph is a tree that can have cycles and multiple parents. The same DFS/BFS recursion applies, but you *must* track a `visited` set to avoid infinite loops. Represent the graph as an adjacency list for O(V+E) traversal.

**When to use** — Connected components, shortest path (unweighted → BFS, weighted → Dijkstra), cycle detection, topological sort, islands/grid problems, dependency resolution.

**Pattern / template**

```python
from collections import defaultdict, deque

# Build adjacency list
graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)  # omit for directed graph

# DFS (recursive)
def dfs(node, visited):
    visited.add(node)
    for neighbor in graph[node]:
        if neighbor not in visited:
            dfs(neighbor, visited)

# BFS (shortest path — unweighted)
def bfs(start):
    visited = {start}
    queue = deque([(start, 0)])
    while queue:
        node, dist = queue.popleft()
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, dist + 1))
```

**Complexity**
- DFS / BFS: O(V + E) time, O(V) space for visited set.
- Adjacency list: O(V + E) space (preferred over matrix for sparse graphs).

**Pitfalls**
- Omitting the `visited` set causes infinite recursion in cyclic graphs.
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
