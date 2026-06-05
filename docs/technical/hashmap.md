---
title: Hashmap
description: The universal supporting data structure — frequency, memoization, O(1) access.
tags: [dsa, hashmap]
category: technical
status: draft
---

# Hashmap

**Key idea** — Use a hashmap as a *supporting* data structure alongside other algorithms. It shines in three roles:
1. **Frequency** — count occurrences of elements.
2. **Memoize** — store results keyed by a state to avoid recomputation.
3. **O(1) access** — turn a linear scan into a constant-time lookup.

Note: **Anything can be a key** — integers, strings, tuples, coordinates, even the hash of a data structure.

**When to use** — Two-sum (complement lookup), anagram detection (frequency map), caching sub-results, grouping elements by a derived key (e.g. sorted word → anagram group), checking duplicates.

**Pattern / template**

```python
# Frequency map
from collections import Counter
freq = Counter(arr)             # {element: count}

# Complement lookup (Two Sum)
seen = {}
for i, x in enumerate(nums):
    if target - x in seen:
        return [seen[target - x], i]
    seen[x] = i

# Memoization (manual cache)
memo = {}
def dp(state):
    if state in memo:
        return memo[state]
    # ... compute result ...
    memo[state] = result
    return result
```

**Complexity**
- Average O(1) insert, lookup, delete.
- Worst case O(n) per operation due to hash collisions (rare with good hash functions).
- Space: O(n) for n entries.

**Pitfalls**
- Hash collisions can degrade performance — prefer built-in dict/HashMap which handles this.
- Mutable objects (lists, dicts) cannot be keys in Python; convert to tuple first.
- Don't forget to handle the case where a key is absent (`get(key, default)` or `defaultdict`).
