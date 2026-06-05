---
title: DSA Roadmap
description: My ordered path through data structures & algorithms for interviews.
tags: [dsa, roadmap]
category: technical
status: draft
---

# DSA Roadmap

This is the order I'm learning DSA in, and why. Each topic builds on the previous — the sequence matters.

```mermaid
flowchart TD
    Tree["1. Trees & Recursion\n(gateway to the recursion family)"]
    BT["2. Backtracking"]
    DP["3. Dynamic Programming"]
    DC["4. Divide & Conquer"]
    G["5. Graphs"]
    HM["Hashmap\n(supporting DS)"]
    PS["6. Prefix Sum"]
    STR["7. Strings"]
    SW["8. Sliding Window"]
    TP["9. Two Pointers"]
    HS["10. Heap & Stack"]
    BS["11. Binary Search"]
    BONUS["Bonus (if time)"]
    DA["Difference Array"]
    TR["Trie"]
    UF["Union-Find"]
    TSP["Topological Sort\n& Shortest Paths"]

    Tree --> BT
    Tree --> DP
    Tree --> DC
    Tree --> G
    HM --> PS
    HM --> STR
    SW --> TP
    BONUS --> DA
    BONUS --> TR
    BONUS --> UF
    BONUS --> TSP
```

---

## Group 1 — The Recursion Family (built on Tree)

> "We can learn about recursion: Base case; Recurrence Relation; How children respond to their parents; DFS, BFS."

Tree is the gateway. Once you understand how a tree node delegates work to its children and combines results on the way back up, the rest of this group follows naturally.

1. [Trees & Recursion](./tree) — the foundation
2. [Backtracking](./backtracking) — explore all paths, prune bad ones
3. [Dynamic Programming](./dynamic-programming) — memoize overlapping sub-problems
4. [Divide and Conquer](./divide-and-conquer) — split, solve, merge
5. [Graphs](./graph) — generalized trees with cycles

---

## Group 2 — Hashmap as a Supporting DS

> "We can use this one as a supporting DS: Frequency; Memorize (memoize); Access key with O(1). Note: Anything can be a key."

Hashmap rarely stands alone — it amplifies every other technique.

- [Hashmap](./hashmap) — the universal supporting structure
- 6. [Prefix Sum](./prefix-sum) — range queries powered by a hashmap
- 7. [Strings](./strings) — frequency maps, anagram detection, window tricks

---

## Group 3 — Sliding Window → Two Pointers

8. [Sliding Window](./sliding-window) — variable-length window that grows/shrinks to satisfy a condition
9. [Two Pointers](./two-pointers) — "main algorithm to check the sub-array with given conditions; slow-fast pointers; opposite-ends pointers"

---

## Group 4 — Heap & Stack

10. [Heap & Stack](./heap-stack) — combined with hashmap, extremely useful in system design; "top is the most important thing"

---

## Group 5 — Binary Search

11. [Binary Search](./binary-search) — "define what to search, and the validation function is the most important thing"

---

## Bonus (if you have time)

- [Difference Array](./difference-array) — range updates in O(1)
- [Trie](./trie) — prefix tree; I like this one a lot
- [Union-Find (DSU)](./union-find) — connectivity queries
- [Topological Sort & Shortest Paths](./topological-shortest-path) — Kahn's + Dijkstra
