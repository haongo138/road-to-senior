---
title: Strings
description: Frequency maps, sliding windows on strings, and common character tricks.
tags: [dsa, strings]
category: technical
status: draft
---

# Strings

**Key idea** — String problems almost always reduce to one of: frequency comparison (anagram, permutation), sliding window on characters, or index/pointer manipulation. A frequency map (hashmap from character to count) is the go-to supporting structure.

**When to use** — Anagram detection, longest substring without repeating characters, minimum window substring, palindrome checks, string matching, word frequency.

**Pattern / template**

```python
from collections import Counter

# Anagram check
def is_anagram(s, t):
    return Counter(s) == Counter(t)

# Sliding window — longest substring without repeating chars
def length_of_longest_substring(s):
    char_index = {}
    left = 0
    best = 0
    for right, ch in enumerate(s):
        if ch in char_index and char_index[ch] >= left:
            left = char_index[ch] + 1
        char_index[ch] = right
        best = max(best, right - left + 1)
    return best

# Fixed-window anagram count
def find_anagrams(s, p):
    need = Counter(p)
    window = Counter(s[:len(p)])
    result = [0] if window == need else []
    for i in range(len(p), len(s)):
        window[s[i]] += 1
        old = s[i - len(p)]
        window[old] -= 1
        if window[old] == 0:
            del window[old]
        if window == need:
            result.append(i - len(p) + 1)
    return result
```

**Complexity**
- Frequency map build: O(n).
- Sliding window: O(n) time, O(alphabet size) space.
- Counter comparison: O(alphabet size) — effectively O(1) for fixed alphabets.

**Pitfalls**
- Comparing `Counter` objects is safe in Python but linear in the number of distinct keys — for large alphabets, use a running match count instead.
- Remember strings are immutable in Python/Java — building a result with `+=` in a loop is O(n²); use `join` or a list buffer.
- Sliding window on strings: shrink the window only when the invariant is violated, not on every step.
