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

```python
from collections import deque, defaultdict
import heapq

# Kahn's topological sort
def topo_sort(n, prerequisites):
    graph   = defaultdict(list)
    in_deg  = [0] * n
    for u, v in prerequisites:   # u must come before v
        graph[u].append(v)
        in_deg[v] += 1

    queue = deque(i for i in range(n) if in_deg[i] == 0)
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            in_deg[neighbor] -= 1
            if in_deg[neighbor] == 0:
                queue.append(neighbor)

    return order if len(order) == n else []  # empty → cycle exists

# Dijkstra
def dijkstra(graph, src):
    dist = {src: 0}
    heap = [(0, src)]            # (cost, node)
    while heap:
        cost, node = heapq.heappop(heap)
        if cost > dist.get(node, float('inf')):
            continue             # stale entry
        for neighbor, weight in graph[node]:
            new_cost = cost + weight
            if new_cost < dist.get(neighbor, float('inf')):
                dist[neighbor] = new_cost
                heapq.heappush(heap, (new_cost, neighbor))
    return dist
```

**Complexity**
- Kahn's: O(V + E) time and space.
- Dijkstra with a binary heap: O((V + E) log V) time, O(V) space.

**Pitfalls**
- Kahn's cycle detection: if `len(order) < n` after the loop, a cycle exists.
- Dijkstra requires non-negative weights; use Bellman-Ford for negative edges.
- Dijkstra stale-entry check (`cost > dist[node]`) is essential to avoid reprocessing nodes.
- Do not confuse topological sort (DAG ordering) with cycle detection (which is a side-effect of Kahn's).
