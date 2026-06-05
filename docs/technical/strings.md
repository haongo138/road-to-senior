---
title: Strings
description: Frequency maps, sliding windows on strings, and common character tricks.
tags: [dsa, strings]
category: technical
status: draft
---

# Strings

**Key idea** — String problems almost always reduce to one of: frequency comparison (anagram, permutation), sliding window on characters, or index/pointer manipulation. A frequency map (`map[byte]int` or a fixed `[26]int` array) is the go-to supporting structure.

**When to use** — Anagram detection, longest substring without repeating characters, minimum window substring, palindrome checks, string matching, word frequency.

**Pattern / template**

```go
// isAnagram checks whether s and t are anagrams of each other.
func isAnagram(s, t string) bool {
	if len(s) != len(t) {
		return false
	}
	freq := [26]int{}
	for i := 0; i < len(s); i++ {
		freq[s[i]-'a']++
		freq[t[i]-'a']--
	}
	return freq == [26]int{}
}

// lengthOfLongestSubstring returns the length of the longest substring
// without repeating characters.
func lengthOfLongestSubstring(s string) int {
	charIndex := map[byte]int{}
	left, best := 0, 0
	for right := 0; right < len(s); right++ {
		ch := s[right]
		if idx, ok := charIndex[ch]; ok && idx >= left {
			left = idx + 1
		}
		charIndex[ch] = right
		if size := right - left + 1; size > best {
			best = size
		}
	}
	return best
}

// findAnagrams returns all start indices where an anagram of p begins in s.
func findAnagrams(s, p string) []int {
	if len(p) > len(s) {
		return nil
	}
	var need, window [26]int
	for i := 0; i < len(p); i++ {
		need[p[i]-'a']++
		window[s[i]-'a']++
	}
	result := []int{}
	if window == need {
		result = append(result, 0)
	}
	for i := len(p); i < len(s); i++ {
		window[s[i]-'a']++
		window[s[i-len(p)]-'a']--
		if window == need {
			result = append(result, i-len(p)+1)
		}
	}
	return result
}
```

**Complexity**
- Frequency map build: O(n).
- Sliding window: O(n) time, O(alphabet size) space.
- Counter comparison: O(alphabet size) — effectively O(1) for fixed alphabets.

**Pitfalls**
- Comparing `[26]int` arrays is O(1) in Go; for large/arbitrary alphabets use a `map[rune]int` with a running match count instead.
- In Go, strings are immutable — building a result with `+=` in a loop is O(n²); use a `strings.Builder` or `[]byte` buffer instead.
- Sliding window on strings: shrink the window only when the invariant is violated, not on every step.

## Common follow-ups

- How would you find all anagram occurrences of a pattern in a string in O(n)?
- What is the time complexity of the naive palindrome check, and how does Manacher's algorithm improve it?
- How do you handle Unicode or multi-byte characters when using character frequency maps?
- When is a Rabin-Karp rolling hash useful compared to a sliding window frequency map?

## Practice (LeetCode)

- LC 3 — Longest Substring Without Repeating Characters
- LC 5 — Longest Palindromic Substring
- LC 76 — Minimum Window Substring
- LC 242 — Valid Anagram
- LC 14 — Longest Common Prefix
