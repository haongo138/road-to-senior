---
title: Trie
description: Prefix tree for fast word and prefix lookup.
tags: [dsa, bonus, trie]
category: technical
status: draft
---

# Trie

**Key idea** — A trie (prefix tree) stores strings character by character. Each node represents one character; a path from root to a marked node spells a complete word. Prefix queries are O(m) where m is the prefix length, regardless of how many words are stored.

I like this one a lot.

**When to use** — Autocomplete, spell checker, word search in a grid (with backtracking), longest common prefix, implement `startsWith`, dictionary word break.

**Pattern / template**

```python
class TrieNode:
    def __init__(self):
        self.children = {}   # char -> TrieNode
        self.is_end = False  # marks end of a complete word

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            if ch not in node.children:
                node.children[ch] = TrieNode()
            node = node.children[ch]
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return node.is_end

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True
```

**Complexity**
- Insert / search / prefix check: O(m) where m = word/prefix length.
- Space: O(ALPHABET_SIZE × total_characters) — can be large; consider a dict-based node (as above) for sparse alphabets.

**Pitfalls**
- Using an array of 26 children instead of a dict wastes memory for non-lowercase-only inputs.
- `search` and `starts_with` differ only in the final `is_end` check — easy to confuse.
- Deleting from a trie requires backtracking to prune empty branches; it is non-trivial.

## Common follow-ups

- How would you modify the trie to support wildcard search (e.g. `.` matches any character)?
- What is the space complexity compared to storing words in a hashset, and when is a trie worth it?
- How do you combine a trie with backtracking to solve Word Search II efficiently?
- How would you count all words in the trie that share a given prefix?

## Practice (LeetCode)

- LC 208 — Implement Trie (Prefix Tree)
- LC 211 — Design Add and Search Words Data Structure
- LC 212 — Word Search II
- LC 14 — Longest Common Prefix
- LC 648 — Replace Words
