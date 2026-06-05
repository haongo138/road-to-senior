---
title: Bit Manipulation
description: Core bitwise ops — XOR cancellation, lowest-set-bit tricks, masks, and bitmask enumeration.
tags: [dsa, bit-manipulation]
category: technical
status: draft
---

# Bit Manipulation

**Key idea:** **XOR is the workhorse** — equal values cancel (`x ^ x == 0`) and anything XOR'd with 0 is itself (`x ^ 0 == x`). Use it to find the single unique number in a sea of duplicates. The trick `x & (x-1)` clears the lowest set bit (useful for counting bits). Bitmasks encode subsets of up to ~20 elements in a single integer.

## When to use

- "Find the single number" (pairs cancel with XOR)
- Subset enumeration (bitmask DP, power set)
- Space-tight boolean flags
- XOR-based constraints (maximum XOR, duplicate detection)

## Pattern / template

```go
// Common bit ops (int is 64-bit on most platforms)
//   x & 1           — parity (0 = even, 1 = odd)
//   x >> 1          — arithmetic right shift (divide by 2, rounds toward -∞)
//   x << 1          — multiply by 2
//   x & (x - 1)     — clear lowest set bit
//   x & (-x)        — isolate lowest set bit
//   x ^ x           — == 0 (cancellation)
//   x | (1 << k)    — set bit k
//   x &^ (1 << k)   — clear bit k  (Go's AND-NOT operator)
//   (x >> k) & 1    — read bit k
//
// Use uint / uint32 for logical (unsigned) right shifts and to avoid
// sign-extension issues; signed >> is arithmetic in Go.

// Count set bits (Brian Kernighan)
func countBits(x int) int {
    count := 0
    for x != 0 {
        x &= x - 1 // clear lowest set bit
        count++
    }
    return count
}

// Single number — all others appear twice
func singleNumber(nums []int) int {
    result := 0
    for _, n := range nums {
        result ^= n // XOR everything → duplicates cancel
    }
    return result
}

// Enumerate all subsets of {0..n-1}
func allSubsets(n int) [][]int {
    var subsets [][]int
    for mask := 0; mask < (1 << n); mask++ {
        var subset []int
        for i := 0; i < n; i++ {
            if mask&(1<<i) != 0 {
                subset = append(subset, i)
            }
        }
        subsets = append(subsets, subset)
    }
    return subsets
}
```

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Single XOR scan | O(n) | O(1) |
| Count bits (Kernighan) | O(k) where k = set bits | O(1) |
| All subsets enumeration | O(2ⁿ · n) | O(n) |

## Pitfalls

1. **Fixed-width integers:** Go's `int` is 64-bit on most platforms (not arbitrary precision). `>>` on a signed `int` is an *arithmetic* shift (sign-extending). Use `uint` or `uint32` when you need a *logical* (zero-filling) right shift or to avoid sign-extension. Overflow wraps silently for integer types — no exception is raised.
2. **Operator precedence:** `&`, `|`, `^` bind loosely — always parenthesize: `(x & mask) == 0`, not `x & mask == 0`.
3. **Off-by-one on bit index:** bit k is `1 << k`; bit 0 is the LSB.
4. **Clear-bit operator:** Go uses `&^` (AND-NOT) instead of `& ~` — write `x &^ (1 << k)` to clear bit k.

## Common follow-ups

- **Subset enumeration / bitmask DP:** iterate `mask` from 0 to `(1<<n)-1`; enumerate sub-masks with `sub = (sub-1) & mask`.
- **Maximum XOR of two numbers (LC 421):** build a trie of binary representations; greedy bit-by-bit.
- **Single Number II (LC 137):** appears 3 times except one — use bit-count mod 3 per position.

## Practice (LeetCode)

- LC 136 — Single Number
- LC 137 — Single Number II
- LC 191 — Number of 1 Bits
- LC 338 — Counting Bits
- LC 78 — Subsets (bitmask approach)
- LC 421 — Maximum XOR of Two Numbers in an Array
