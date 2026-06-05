---
title: Normalization
description: Normal forms that eliminate redundancy and update anomalies, and when to deliberately break the rules.
tags: [concept, database, schema]
category: tech-concepts
status: draft
---

# Normalization

> **Q: What problem does normalization solve?**

Redundant data causes **update anomalies**:
- **Insertion anomaly** — you can't record a fact without inserting unrelated data.
- **Update anomaly** — changing one fact requires updating many rows; a partial update leaves the database inconsistent.
- **Deletion anomaly** — deleting one row inadvertently destroys other facts.

Normalization restructures tables so each fact is stored exactly once, eliminating these problems.

> **Q: What are 1NF, 2NF, and 3NF?**

| Normal Form | Rule |
|---|---|
| **1NF** | Every column holds a single atomic value; no repeating groups or arrays in a column. Rows are uniquely identifiable (a primary key exists). |
| **2NF** | Already in 1NF, **and** every non-key column depends on the **whole** primary key — not just part of it. (Only relevant when the primary key is composite.) |
| **3NF** | Already in 2NF, **and** no non-key column depends on another non-key column (no transitive dependency). Every non-key column depends **only** on the primary key. |

**Quick test for 3NF**: "Every non-key attribute must depend on the key, the whole key, and nothing but the key."

```sql
-- Violates 3NF: zip_code → city (transitive dependency)
CREATE TABLE orders (
  order_id   INT PRIMARY KEY,
  zip_code   CHAR(5),
  city       VARCHAR(100)   -- depends on zip_code, not order_id
);

-- Fixed: move city to a separate zip_codes table
```

> **Q: What is denormalization and why would you do it?**

Denormalization deliberately reintroduces redundancy — duplicating columns or pre-joining tables — to make reads faster. Instead of joining three tables at query time, you store the joined result in one table.

Trade-offs:
- **Faster reads** (fewer joins, simpler queries, better cache locality).
- **Slower / more complex writes** — every update must keep duplicated copies in sync.
- **Risk of inconsistency** — a bug that updates one copy but not another leaves data stale.

Denormalization is usually applied selectively: normalize first, then denormalize specific hot paths after profiling proves the joins are a bottleneck.

> **Q: When should you favor normalization vs. denormalization?**

| Workload | Preferred approach | Reason |
|---|---|---|
| **OLTP** (banking, e-commerce, SaaS) | Normalized (3NF) | Frequent writes; consistency and integrity are critical. |
| **OLAP / analytics / data warehouse** | Denormalized (star/snowflake schema) | Read-heavy; joins across billions of rows are expensive; ETL pipelines handle consistency. |
| **Read-heavy microservice** | Selective denormalization | Pre-compute and cache joined data (e.g., materialized views, read models in CQRS). |

> **Q: Is BCNF different from 3NF, and does it matter in practice?**

Boyce-Codd Normal Form (BCNF) is a stricter version of 3NF: for every functional dependency `X → Y`, `X` must be a superkey. BCNF eliminates a narrow class of anomalies that 3NF misses when there are overlapping candidate keys. In practice, tables that satisfy 3NF are usually already in BCNF, and most interview discussions stop at 3NF.

## Common follow-ups

- What is the difference between a star schema and a snowflake schema in a data warehouse?
- How do materialized views help bridge normalized storage with denormalized read performance?
- What is 4NF and what does it address (multi-valued dependencies)?
- How does normalization relate to foreign key constraints and referential integrity?
