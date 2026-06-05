---
title: Database Indexing
description: How indexes speed up queries, their internal structures, and when they hurt more than they help.
tags: [concept, database, indexing]
category: tech-concepts
status: draft
---

# Database Indexing

> **Q: What is a database index?**

An index is a separate data structure maintained by the database that maps key values to the physical location (page/row) of matching rows. Reading the index is far cheaper than scanning every row in a table. The trade-off: every write (INSERT, UPDATE, DELETE) must also update all relevant indexes, adding overhead.

> **Q: How does a B-tree (B+-tree) index work, and why is it the default?**

A B+-tree stores keys in sorted order across a balanced tree of pages. Internal nodes hold separator keys for routing; leaf nodes hold the actual key + row pointer and are linked in a doubly-linked list. This design gives O(log n) lookups and efficient **range scans** (follow the leaf chain). Because most queries involve ranges, ordering, or inequality predicates, B+-tree is the default index type in PostgreSQL, MySQL InnoDB, and SQL Server.

> **Q: When would you use a hash index instead?**

Hash indexes compute a hash of the key and store (hash → row location) in a hash table. Lookups are O(1) for **exact-equality** predicates (`WHERE id = 42`). However, they cannot support range queries (`>`, `<`, `BETWEEN`), ORDER BY, or prefix matching. PostgreSQL supports explicit hash indexes; MySQL InnoDB does not persist them on disk. Use them only when all access is equality-only and O(1) matters.

> **Q: What is the leftmost-prefix rule for composite indexes?**

A composite index on `(a, b, c)` can be used by queries that filter on:
- `a` alone
- `a, b`
- `a, b, c`

But **not** on `b` alone or `c` alone, because the index is sorted first by `a`, then by `b` within each `a` value, etc. A query on just `b` would require a full index scan. Column order in the index definition matters: put the most selective or most commonly filtered columns first.

```sql
-- Index: (last_name, first_name)
SELECT * FROM users WHERE last_name = 'Smith';          -- uses index ✓
SELECT * FROM users WHERE last_name = 'Smith'
                      AND first_name = 'Jane';          -- uses both columns ✓
SELECT * FROM users WHERE first_name = 'Jane';          -- cannot use index ✗
```

> **Q: What is a covering index?**

A covering index includes all columns a query needs — both the filter columns and the SELECT columns. The database can answer the query entirely from the index without touching the base table ("index-only scan"). This eliminates the extra I/O of fetching actual rows.

```sql
-- Index on (user_id, created_at, status) covers this query:
SELECT created_at, status FROM orders WHERE user_id = 7;
```

> **Q: When does the query planner ignore an index?**

- **Low selectivity**: indexing a boolean column where 90 % of rows are `TRUE` — a full scan is cheaper.
- **Function applied to the indexed column**: `WHERE LOWER(email) = 'a@b.com'` skips an index on `email`; create a functional index instead.
- **Leading wildcard**: `LIKE '%smith'` cannot use a B-tree index (no known prefix to seek to).
- **Small tables**: the planner prefers a sequential scan when the table fits in a few pages.
- **Implicit type cast**: comparing a `VARCHAR` column against an integer causes a cast that hides the index.

## Common follow-ups

- How would you find slow queries that are missing indexes in PostgreSQL? (`pg_stat_user_tables`, `EXPLAIN ANALYZE`)
- What is a partial index and when would you use one?
- How do you avoid index bloat after heavy deletes?
- What is the difference between a clustered index and a non-clustered index?
