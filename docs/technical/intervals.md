---
title: Intervals
description: Interval merging, sweep-line for peak overlap, and scheduling patterns.
tags: [dsa, intervals]
category: technical
status: draft
---

# Intervals

**Key idea:** Most interval problems start with **sorting by start time** (or by end time for scheduling), then a single linear scan. Overlap test: `a.start <= b.end && b.start <= a.end`. The **sweep-line** technique (+1 at open, -1 at close, sort all events) answers "maximum simultaneous overlaps" in O(n log n).

## When to use

- Calendars, scheduling, booking systems
- "Minimum meeting rooms" / "maximum concurrent events"
- "Merge overlapping intervals" / "insert an interval"
- Range intersection queries

## Pattern / template

```go
import "sort"

type Interval struct{ start, end int }

// merge overlapping intervals
func merge(intervals []Interval) []Interval {
	sort.Slice(intervals, func(i, j int) bool {
		return intervals[i].start < intervals[j].start
	})
	merged := []Interval{intervals[0]}
	for _, iv := range intervals[1:] {
		last := &merged[len(merged)-1]
		if iv.start <= last.end { // overlaps
			if iv.end > last.end {
				last.end = iv.end
			}
		} else {
			merged = append(merged, iv)
		}
	}
	return merged
}

// maxOverlap — sweep-line: max simultaneous overlaps
func maxOverlap(intervals []Interval) int {
	type event struct{ time, delta int }
	events := make([]event, 0, len(intervals)*2)
	for _, iv := range intervals {
		events = append(events, event{iv.start, +1}, event{iv.end, -1})
	}
	sort.Slice(events, func(i, j int) bool {
		if events[i].time != events[j].time {
			return events[i].time < events[j].time
		}
		return events[i].delta < events[j].delta // closes before opens on tie
	})
	peak, cur := 0, 0
	for _, e := range events {
		cur += e.delta
		if cur > peak {
			peak = cur
		}
	}
	return peak
}

// overlaps — inclusive endpoint test
func overlaps(a, b Interval) bool {
	return a.start <= b.end && b.start <= a.end
}
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
