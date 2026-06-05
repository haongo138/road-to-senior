---
title: Intervals
description: Interval merging, sweep-line for peak overlap, and scheduling patterns.
tags: [dsa, intervals]
category: technical
status: draft
---

# Intervals

**Key idea:** Most interval problems start with **sorting by start time** (or by end time for scheduling), then a single linear scan. Overlap test: `a.start <= b.end and b.start <= a.end`. The **sweep-line** technique (+1 at open, -1 at close, sort all events) answers "maximum simultaneous overlaps" in O(n log n).

## When to use

- Calendars, scheduling, booking systems
- "Minimum meeting rooms" / "maximum concurrent events"
- "Merge overlapping intervals" / "insert an interval"
- Range intersection queries

## Pattern / template

```python
# --- Merge overlapping intervals ---
def merge(intervals):
    intervals.sort(key=lambda x: x[0])   # sort by start
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:        # overlaps
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

# --- Sweep-line: max simultaneous overlaps ---
def max_overlap(intervals):
    events = []
    for start, end in intervals:
        events.append((start, +1))   # open
        events.append((end,   -1))   # close
    events.sort()                    # ties: close before open if endpoints don't overlap
    peak = cur = 0
    for _, delta in events:
        cur += delta
        peak = max(peak, cur)
    return peak

# Overlap test (inclusive endpoints)
def overlaps(a, b):
    return a[0] <= b[1] and b[0] <= a[1]
```

## Complexity

| Approach | Time | Space |
|----------|------|-------|
| Sort + scan | O(n log n) | O(n) output |
| Sweep-line | O(n log n) | O(n) events |

## Pitfalls

1. **Sort key matters:** merge → sort by start; scheduling (earliest-deadline-first) → sort by end.
2. **Touching endpoints:** confirm whether `[1,2]` and `[2,3]` are considered overlapping per the problem.
3. **Sweep-line tie-breaking:** if close and open events share the same coordinate, process closes first to avoid counting a spurious overlap.

## Common follow-ups

- **Insert Interval (LC 57):** binary search for insertion point, then merge neighbors.
- **Interval List Intersections (LC 986):** two-pointer, advance whichever interval ends first.
- **Minimum Meeting Rooms (LC 253):** sweep-line peak, or min-heap of end times.

## Practice (LeetCode)

- LC 56 — Merge Intervals
- LC 57 — Insert Interval
- LC 435 — Non-overlapping Intervals
- LC 252 — Meeting Rooms
- LC 253 — Meeting Rooms II
- LC 986 — Interval List Intersections
