---
title: Database Indexing
description: How indexes speed up queries, their internal structures, and when they hurt more than they help.
tags: [concept, database, indexing]
category: tech-concepts
status: draft
---

# Database Indexing

::: details Q: What is a database index and what does it cost?
An index is a separate data structure that maps key values to row locations, making targeted reads O(log n) instead of O(n). The hidden price: every write (INSERT, UPDATE, DELETE) must update every relevant index synchronously — adding CPU, I/O, and write amplification. A table with 8 indexes on a high-write path may spend more time maintaining indexes than writing the actual row. Index count is a write-throughput lever, not just a read-speed lever.
:::

::: details Q: How does a B+-tree index work, and why is it the default?
Internal nodes hold separator keys for routing; leaf nodes store key + row pointer and are linked as a doubly-linked list. This gives O(log n) point lookups and efficient range scans (walk the leaf chain without re-traversing the tree). Because most production queries use ranges, `ORDER BY`, or inequality predicates, B+-tree is the default in PostgreSQL, MySQL InnoDB, and SQL Server.

B+-trees do have a write cost: inserts and deletes can trigger page splits or merges, and heavy random writes cause **index bloat** — pages become sparsely filled, wasting disk and cache. After a bulk delete you should run `VACUUM` (Postgres) or `OPTIMIZE TABLE` (MySQL) to reclaim space.

Write-heavy stores like Cassandra and RocksDB use **LSM-trees** instead: writes land in a memory buffer and are merged to disk in sorted runs. LSM trades random-write performance for higher read amplification; it suits append-heavy workloads where sequential writes dominate.
:::

::: details Q: When would you use a hash index instead?
Hash indexes are O(1) for exact equality (`WHERE id = 42`) but cannot support ranges, `ORDER BY`, or prefix matching. PostgreSQL supports on-disk hash indexes; MySQL InnoDB does not persist them. In practice, B+-tree equality lookups are O(log n) ≈ 3–5 page reads on a table of tens of millions of rows — negligible. Use hash indexes only when equality-only access is proven and O(1) is measurably necessary.
:::

::: details Q: What is the leftmost-prefix rule for composite indexes?
A composite index on `(a, b, c)` is sorted first by `a`, then `b` within each `a`, then `c`. Queries that don't anchor on `a` cannot seek into the index; the planner falls back to a full scan.

```sql
-- Index: (last_name, first_name)
SELECT * FROM users WHERE last_name = 'Smith';               -- seeks ✓
SELECT * FROM users WHERE last_name = 'Smith'
                      AND first_name = 'Jane';               -- seeks both columns ✓
SELECT * FROM users WHERE first_name = 'Jane';               -- full scan ✗
```

Column order matters beyond just leading columns: if the query filters `a` (equality) and ranges on `b`, columns used in equality should come first so the range column can still be used for scanning. Getting this wrong wastes the index entirely.
:::

::: details Q: What is a covering index and when does it become an index-only scan?
A covering index includes every column the query touches (filter, select, and sort). The planner can satisfy the query from the index alone — an **index-only scan** — eliminating the extra heap fetches for each matching row. This can reduce query latency by 10× on hot read paths.

```sql
-- Index on (user_id, created_at, status) covers this query completely:
SELECT created_at, status FROM orders WHERE user_id = 7;
```

In PostgreSQL, index-only scans still check the visibility map (to verify rows are visible to the current snapshot). If the table is rarely vacuumed, the visibility map is stale and heap fetches happen anyway — defeating the purpose. Monitor `pg_stat_user_tables.n_live_tup` and autovacuum lag.
:::

::: details Q: When does the query planner ignore an index?
- **Low selectivity / cardinality**: an index on a boolean `is_active` where 95 % of rows are `TRUE` — the planner estimates a sequential scan is cheaper because it avoids random I/O for each row pointer. Selectivity threshold is roughly 5–15 % of rows, depending on the planner's cost model.
- **Function applied to the indexed column**: `WHERE LOWER(email) = 'a@b.com'` bypasses an index on `email`; create a functional index `ON users (LOWER(email))` instead.
- **Leading wildcard**: `LIKE '%smith'` has no known prefix to seek to. Full-text search or reverse-index patterns solve this.
- **Implicit type cast**: comparing `VARCHAR` against an integer causes an implicit cast that hides the index from the planner.
- **Small tables**: the optimizer prefers sequential scan when the table fits in a handful of pages — random index I/O costs more.
- **Stale statistics**: `ANALYZE` updates the statistics the planner uses; without it, cardinality estimates are wrong and the planner may choose a bad plan.

Confirm with `EXPLAIN ANALYZE`: look at `rows=` estimate vs. actual, and watch for `Seq Scan` where you expect `Index Scan`.
:::

## Common follow-ups

- How would you find slow queries missing indexes in PostgreSQL? (`pg_stat_user_tables`, `pg_stat_statements`, `EXPLAIN ANALYZE`)
- What is a partial index and when does it beat a full index? (e.g., `WHERE deleted_at IS NULL`)
- How do you reclaim index bloat after heavy deletes? (`REINDEX CONCURRENTLY`, `VACUUM`)
- Clustered (InnoDB primary key / Postgres `CLUSTER`) vs. non-clustered: when does physical row order matter for range scans?
- How do write-heavy workloads change your index strategy? (LSM-tree, fewer indexes, delayed index builds)
