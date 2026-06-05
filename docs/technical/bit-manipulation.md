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

```python
# Common bit ops
x & 1          # parity (0 = even, 1 = odd)
x >> 1         # floor divide by 2
x << 1         # multiply by 2
x & (x - 1)   # clear lowest set bit
x & (-x)       # isolate lowest set bit
x ^ x          # == 0 (cancellation)
x | (1 << k)   # set bit k
x & ~(1 << k)  # clear bit k
(x >> k) & 1   # read bit k

# Count set bits (Brian Kernighan)
def count_bits(x):
    count = 0
    while x:
        x &= x - 1    # clear lowest set bit
        count += 1
    return count

# Single number (all others appear twice)
from functools import reduce
import operator
single = reduce(operator.xor, nums)  # XOR everything → duplicates cancel

# Enumerate all subsets of {0..n-1}
n = 4
for mask in range(1 << n):
    subset = [i for i in range(n) if mask & (1 << i)]
```

## Complexity

| Operation | Time | Space |
|-----------|------|-------|
| Single XOR scan | O(n) | O(1) |
| Count bits (Kernighan) | O(k) where k = set bits | O(1) |
| All subsets enumeration | O(2ⁿ · n) | O(n) |

## Pitfalls

1. **Signed shifts / Python big ints:** Python integers have arbitrary precision — apply a 32-bit mask `& 0xFFFFFFFF` when the problem expects 32-bit signed behavior.
2. **Operator precedence:** `&`, `|`, `^` bind loosely — always parenthesize: `(x & mask) == 0`, not `x & mask == 0`.
3. **Off-by-one on bit index:** bit k is `1 << k`; bit 0 is the LSB.

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
