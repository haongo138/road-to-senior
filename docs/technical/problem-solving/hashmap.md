---
title: Hashmap
description: The universal supporting data structure — frequency, memoization, O(1) access.
tags: [dsa, hashmap]
category: problem-solving
status: draft
---

# Hashmap

**Key idea** — Use a map (`map[K]V`) as a *supporting* data structure alongside other algorithms. It shines in three roles:
1. **Frequency** — count occurrences of elements.
2. **Memoize** — store results keyed by a state to avoid recomputation.
3. **O(1) access** — turn a linear scan into a constant-time lookup.

Note: **Anything comparable can be a key** — integers, strings, fixed-size arrays (`[2]int`), structs with comparable fields. Slices and maps are not comparable and cannot be used as map keys directly; convert to a string or use a fixed-size array key.

**When to use** — Two-sum (complement lookup), anagram detection (frequency map), caching sub-results, grouping elements by a derived key (e.g. sorted word → anagram group), checking duplicates.

**Pattern / template**

```go
// Frequency map
func freqMap(arr []int) map[int]int {
    freq := make(map[int]int)
    for _, x := range arr {
        freq[x]++
    }
    return freq
}

// Complement lookup (Two Sum)
func twoSum(nums []int, target int) [2]int {
    seen := make(map[int]int) // value → index
    for i, x := range nums {
        if j, ok := seen[target-x]; ok {
            return [2]int{j, i}
        }
        seen[x] = i
    }
    return [2]int{-1, -1}
}

// Memoization (manual cache with map)
var memo = make(map[[2]int]int)

func dp(state [2]int) int {
    if v, ok := memo[state]; ok {
        return v
    }
    // ... compute result ...
    result := 0 // placeholder
    memo[state] = result
    return result
}
```

**Complexity**
- Average O(1) insert, lookup, delete.
- Worst case O(n) per operation due to hash collisions (rare with good hash functions).
- Space: O(n) for n entries.

**Pitfalls**
- Hash collisions can degrade performance — Go's built-in map handles this automatically.
- Only comparable types can be map keys; slices and maps are not comparable — use a string or fixed-size array as the key instead.
- Don't forget to handle the case where a key is absent — use the two-value form `v, ok := m[key]` and check `ok` before using `v`.

## Common follow-ups

- What is the worst-case time complexity of hashmap operations, and when can it occur?
- How would you design a hashmap from scratch (hash function, collision resolution)?
- Can you solve Two Sum in O(n) time and O(1) space? Why or why not?
- How does using a sorted frequency map change the complexity for anagram grouping?

## Practice (LeetCode)

- LC 1 — Two Sum
- LC 49 — Group Anagrams
- LC 242 — Valid Anagram
- LC 387 — First Unique Character in a String
- LC 560 — Subarray Sum Equals K
