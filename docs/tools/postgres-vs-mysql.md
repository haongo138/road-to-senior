---
title: PostgreSQL vs MySQL
description: How the two dominant open-source relational databases compare, and when to choose each.
tags: [tools, comparison, database]
category: tools
status: review
---

# PostgreSQL vs MySQL

Both are mature, production-proven relational databases — the honest answer for most greenfield
projects is PostgreSQL, but the real framing is understanding *why* so you can argue the trade-offs
rather than recite dogma. MySQL's ecosystem depth and ubiquity still make it the right call in
specific contexts.

## At a glance

| Dimension | PostgreSQL | MySQL |
|---|---|---|
| Model | Object-relational | Relational |
| JSON support | JSONB — binary, indexable, rich operators | JSON — stored as text, weaker indexing |
| Extensibility | Rich extension ecosystem (PostGIS, pgvector, TimescaleDB…) | Fewer, more limited |
| Advanced SQL | CTEs, window functions, materialized views, arrays, custom types — historically ahead | Catching up (8.0+ closed most gaps) |
| Default isolation | Read Committed | Repeatable Read |
| MVCC | Yes — needs periodic VACUUM/autovacuum | Yes — InnoDB purge thread |
| Replication | Logical + physical / streaming | Mature async + Group Replication |
| Historical strength | Complex queries, write concurrency, correctness | Very fast simple reads, ubiquity, managed hosting breadth |

## Which to use when

**PostgreSQL — the modern default for new applications.** Strongest SQL compliance, JSONB for
hybrid workloads, native arrays and custom types, window functions without workarounds, and an
extension model that covers geospatial (PostGIS), vector similarity search (pgvector), and
time-series (TimescaleDB) without leaving the relational model. MVCC handles high write
concurrency well; logical replication enables zero-downtime upgrades and change-data-capture
pipelines. Watch-outs: VACUUM is a real operational concern under heavy update/delete workloads
— table bloat accumulates if autovacuum is misconfigured. Connection overhead is per-process,
so PgBouncer or a connection pooler is standard at scale.

**MySQL — when ecosystem or familiarity dictates.** Still the default in many managed hosting
environments (certain PaaS tiers, LAMP stacks, managed offerings from major clouds where Postgres
support arrived later). The replication tooling — particularly Group Replication and mature
async setups — is battle-tested for read-heavy web workloads. MariaDB is a full fork with
its own extensions and trajectory. Pick MySQL when inheriting an existing stack, when a
specific managed offering makes it the path of least resistance, or when the team's deep
operational expertise is already there.

The default isolation level difference is a real interview gotcha: PostgreSQL uses
**Read Committed** by default; MySQL/InnoDB uses **Repeatable Read**. This changes which
concurrency anomalies each tolerates out of the box — a non-repeatable read that silently
passes under Postgres tests may behave differently in MySQL. See
[Transactions & Isolation](../technical/concepts/transactions-isolation) for the full breakdown.

> **Bottom line:** greenfield → **PostgreSQL** (richer, extensible, stronger correctness guarantees
> by default). MySQL when the ecosystem, team expertise, or a specific managed offering dictates.
> Both are excellent and the gap has narrowed significantly since MySQL 8.0 — avoid dogma, but
> know the JSONB / isolation-level / VACUUM trade-offs cold.

## Common follow-ups

- Why does VACUUM exist in PostgreSQL but not in MySQL's InnoDB, and what happens if autovacuum falls behind?
- How does PostgreSQL's JSONB differ from MySQL's JSON column, and when would you use either over a normalised schema?
- Walk through what changes when you switch default isolation from Read Committed to Repeatable Read.
- When would you choose the MariaDB fork over upstream MySQL?
- How do logical replication slots in PostgreSQL enable CDC pipelines, and what's the failure mode if a slot is left unconsumed?
