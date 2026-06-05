---
title: Goroutines & the Scheduler
description: How Go schedules goroutines, the G-M-P model, and the costs you pay.
tags: [concept, golang, concurrency]
category: tech-concepts
status: draft
---

# Goroutines & the Scheduler

::: details Q: Why are goroutines cheaper than OS threads?
A new goroutine starts with a **~2 KB growable stack** (up to 1 GB by default), versus a typical OS thread's fixed 1–8 MB stack. The Go runtime multiplexes many goroutines onto fewer OS threads entirely in **user space** — no kernel context-switch syscall per switch, no TLB flush, no kernel scheduler involvement.

Cost components when spawning a goroutine: allocate stack, queue G on the P's run queue, zero a `runtime.g` struct. Benchmark-level: ~2–4 µs and ~3 KB of memory. An OS thread is 10–100× heavier on both axes.

Trade-off: goroutines are cheap, not free. Thousands are fine; millions can exhaust memory and increase scheduling latency. A leaked goroutine is a memory/handle leak that GC can't collect.
:::

::: details Q: Explain the G-M-P scheduler model.
The scheduler has three entities:

| Symbol | Name | Role |
|--------|------|------|
| **G** | Goroutine | The unit of work; holds its stack and PC |
| **M** | Machine (OS thread) | Executes G; blocks in syscalls |
| **P** | Processor (logical CPU) | Owns a run queue; required for M to run G |

`GOMAXPROCS` controls how many Ps exist (defaults to `runtime.NumCPU()`). Only Ps running on Ms actually execute code. When an M blocks on a syscall, the runtime **parks** that M+G pair and hands the P off to another (or creates a new) M, so other goroutines keep running. When the syscall completes, the G is re-queued and the extra M is parked.

Work-stealing: an idle P can steal half the goroutines from another P's run queue, keeping all Ps busy.
:::

::: details Q: What is async preemption and why does it matter?
Before Go 1.14, preemption was **cooperative**: the scheduler could only switch at function-call boundaries (where it inserts a stack-growth check). A CPU-bound goroutine with no function calls (a tight loop) could hold an M indefinitely, starving other goroutines and blocking GC stop-the-world.

Since Go 1.14, the runtime uses **async preemption via signals** (SIGURG on Unix). It fires a signal to an M at safepoints, interrupting the running goroutine and returning the M to the scheduler. This means even tight loops are preemptible.

Practical impact: you can no longer "accidentally" starve the scheduler with compute loops. The gotcha that remains: a goroutine blocked in a non-Go syscall (e.g., via `syscall.Syscall`) still blocks its M until the syscall returns.
:::

::: details Q: How does the runtime handle blocking I/O without blocking OS threads?
Go uses a **netpoller** (epoll on Linux, kqueue on macOS). When a goroutine does network I/O, the runtime registers the file descriptor with the poller, parks the goroutine (G), and releases the M back to the scheduler. The poller runs in its own thread and re-queues G when the fd is ready.

Result: 10,000 goroutines each waiting on a TCP connection consume 10,000 Gs (cheap) but only a handful of Ms.

Exception: **blocking syscalls** that aren't intercepted by the netpoller (file I/O on most systems, CGo calls) do block their M. The runtime detects the stall and creates a new M to keep the P moving. Too many concurrent blocking syscalls can cause M proliferation (watch `runtime.NumGoroutine` vs `runtime/metrics` threads count).
:::

::: details Q: What are the GOMAXPROCS gotchas in containerized environments?
`runtime.NumCPU()` reads the host's `/proc/cpuinfo`, not the container's CPU quota. A container limited to 0.5 CPUs on a 32-core host will initialize `GOMAXPROCS=32`, creating 32 Ps — each trying to grab OS time it won't get — causing **excessive context-switching and scheduler overhead**.

Fix: use `uber-go/automaxprocs` (call `maxprocs.Set()` at startup), which reads Linux CPU quota from cgroup and sets `GOMAXPROCS` accordingly. Or set `GOMAXPROCS` explicitly via environment.

Signal: if CPU throttling metrics (container % throttled) are high and throughput is below expectation, wrong GOMAXPROCS is a likely cause.
:::

## Common follow-ups

- How does `runtime.Gosched()` interact with the scheduler and when would you call it?
- What's the difference between a goroutine that's parked, runnable, and running in the pprof goroutine profile?
- How does the GC stop-the-world interact with running goroutines under async preemption?
- Why does `GOMAXPROCS=1` sometimes improve throughput for certain workloads?
