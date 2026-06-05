---
title: Transactions & Isolation Levels
description: ACID guarantees, read phenomena, the four isolation levels, and how MVCC makes them practical.
tags: [concept, database, transactions]
category: tech-concepts
status: draft
---

# Transactions & Isolation Levels

> **Q: What does ACID mean?**

| Property | Guarantee |
|---|---|
| **Atomicity** | Every statement in a transaction either all commits or all rolls back — no partial writes. |
| **Consistency** | A transaction moves the database from one valid state to another, respecting all constraints and rules. |
| **Isolation** | Concurrent transactions behave as if they ran serially — intermediate state is not visible to others (to a configurable degree). |
| **Durability** | Once committed, data survives crashes and power loss (typically via write-ahead log). |

Durability's cost is often overlooked: `fsync` on commit is what makes it real. Systems that disable `fsync` for speed (some Postgres configs) sacrifice durability for write throughput.

> **Q: What are the read phenomena and which levels prevent them?**

| Phenomenon | What happens |
|---|---|
| **Dirty read** | Transaction A reads uncommitted data from B. If B rolls back, A acted on data that never existed. |
| **Non-repeatable read** | A reads the same row twice; B commits an update in between, so A sees different values. |
| **Phantom read** | A runs the same range query twice; B inserts or deletes rows in that range, so A sees a different result set. |
| **Write skew** | A and B each read overlapping data, make a decision based on it, and write non-overlapping rows — collectively violating an invariant neither transaction saw violated individually. Only **Serializable** prevents this. |

| Isolation level | Dirty read | Non-repeatable read | Phantom read | Write skew |
|---|---|---|---|---|
| Read Uncommitted | possible | possible | possible | possible |
| Read Committed | prevented | possible | possible | possible |
| Repeatable Read | prevented | prevented | possible* | possible |
| Serializable | prevented | prevented | prevented | prevented |

\* PostgreSQL Repeatable Read prevents phantoms via MVCC snapshot semantics, but write skew remains possible until Serializable.

**Real defaults**: PostgreSQL defaults to **Read Committed**; MySQL InnoDB to **Repeatable Read**. Many teams pick a level without knowing their database's default — this is a common interview probe.

> **Q: How does MVCC work and what does it cost?**

Instead of locking rows for reads, the database keeps multiple versions of each row stamped with transaction IDs. Readers see a consistent snapshot without blocking writers; writers create new row versions without blocking readers. The result is high read/write concurrency.

The operational cost is real: old row versions accumulate until garbage-collected. In PostgreSQL this is **VACUUM**. A long-running transaction pins all row versions created after it started — no VACUUM can remove them. This causes **table bloat**: tables grow on disk even when net data hasn't changed. Monitor `pg_stat_activity` for long-running transactions; in extreme cases they stall autovacuum for hours and bloat tables by gigabytes.

> **Q: How should you choose an isolation level in practice?**

Start from the lowest level that preserves your correctness invariants:

- **Read Committed** — sufficient for most OLTP. Each statement sees committed data as of that moment. Non-repeatable reads are possible but rarely matter in short transactional flows.
- **Repeatable Read** — use when a transaction must read the same row multiple times and get consistent results (e.g., report generation inside a transaction). In Postgres this also prevents phantoms.
- **Serializable** — necessary when transactions make decisions based on reads that affect what they write (inventory reservation, double-spend prevention). PostgreSQL uses **Serializable Snapshot Isolation (SSI)**, which detects conflict cycles and aborts one participant. Unlike 2PL, SSI doesn't lock — it tracks read/write dependencies and fails transactions that form a dangerous cycle. The cost is retry logic: your application must be prepared to retry aborted transactions. Abort rates under contention can be significant; benchmark before assuming Serializable is "free".

> **Q: What is write skew and why does it matter?**

Write skew is the subtlest isolation anomaly and the one most teams don't know about. Example: two doctors both check whether at least one doctor is on call before signing off. Both see "1 on-call doctor", both decide it's safe to go off-call, and both commit — leaving zero doctors on call. No individual transaction wrote bad data, but the combined effect violated an invariant.

Repeatable Read prevents each transaction from seeing changed rows — but it doesn't prevent the *combination* of reads and writes from two transactions creating an invalid global state. Only Serializable (SSI or explicit `SELECT FOR UPDATE` with careful locking) prevents write skew.

## Common follow-ups

- What is the "read-your-writes" problem in a replicated setup, and how is it mitigated? (sticky sessions to leader, replication position tracking)
- How does PostgreSQL's SSI detect conflicts without locking? (siread locks, dependency tracking, cycle detection)
- What is a deadlock and how does the database handle it? (detection, abort of one participant, retry)
- When would you use `SELECT FOR UPDATE` vs. a higher isolation level? (pessimistic locking vs. optimistic/SSI)
