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
| **Isolation** | Concurrent transactions behave as if they ran serially — intermediate state is not visible to others (to some configurable degree). |
| **Durability** | Once committed, data survives crashes, power loss, etc. (typically via write-ahead log). |

> **Q: What are the three read phenomena that isolation levels protect against?**

| Phenomenon | What happens |
|---|---|
| **Dirty read** | Transaction A reads uncommitted data written by B. If B rolls back, A has read data that never existed. |
| **Non-repeatable read** | A reads the same row twice; B commits an update between the two reads, so A sees different values. |
| **Phantom read** | A runs the same range query twice; B inserts or deletes rows in that range between the reads, so A sees a different set of rows. |

> **Q: What are the four SQL isolation levels and what do they prevent?**

| Isolation level | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| Read Uncommitted | possible | possible | possible |
| Read Committed | prevented | possible | possible |
| Repeatable Read | prevented | prevented | possible* |
| Serializable | prevented | prevented | prevented |

\* PostgreSQL's Repeatable Read also prevents phantoms in practice via MVCC snapshot semantics, even though the SQL standard only requires Serializable to do so.

**PostgreSQL default**: Read Committed. The SQL standard default is also Read Committed (though some databases differ — MySQL InnoDB defaults to Repeatable Read).

> **Q: How does MVCC (Multi-Version Concurrency Control) work?**

Instead of locking rows for reads, the database keeps multiple versions of each row (stamped with transaction IDs). Readers see a consistent snapshot of the data as it existed at the start of their transaction (or statement, depending on level), without blocking writers. Writers create new row versions; old versions are eventually garbage-collected (VACUUM in PostgreSQL). The key outcome: **readers never block writers and writers never block readers**, enabling high concurrency without the overhead of shared read locks.

> **Q: What is the cost/concurrency trade-off when choosing an isolation level?**

Higher isolation prevents more anomalies but reduces concurrency and increases the chance of serialization failures (errors that force a retry):

- **Read Committed** — high concurrency, minimal overhead, but allows non-repeatable reads. Fine for most OLTP workloads.
- **Repeatable Read** — snapshot held for the whole transaction; concurrent writes to the same rows can cause conflicts.
- **Serializable** — database detects and aborts conflicting transaction patterns (SSI in PostgreSQL); correct for financial or inventory systems but requires retry logic.

Choose the lowest level that still meets your correctness requirements.

## Common follow-ups

- What is the "read-your-writes" problem and how do you handle it in a replicated setup?
- How does PostgreSQL implement Serializable Snapshot Isolation (SSI)?
- What is a deadlock and how does the database handle it?
- How do optimistic vs. pessimistic locking strategies relate to isolation levels?
