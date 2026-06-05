---
title: Normalization
description: Normal forms that eliminate redundancy and update anomalies, and when to deliberately break the rules.
tags: [concept, database, schema]
category: tech-concepts
status: draft
---

# Normalization

> **Q: What problem does normalization solve?**

Redundant data creates **update anomalies** — situations where a single logical change requires updates in multiple places, and a partial update leaves the database inconsistent:

- **Insertion anomaly** — you can't record a fact without inserting unrelated data.
- **Update anomaly** — changing one fact (e.g., a city name tied to a zip code) requires finding and updating every row that stores it; miss one and the data is internally inconsistent.
- **Deletion anomaly** — deleting a row inadvertently destroys other facts stored alongside it.

Normalization restructures tables so each fact is stored exactly once. The cost is read-time joins — you pay at query time to avoid write-time inconsistency. Whether that trade is right depends on your workload.

> **Q: What are 1NF, 2NF, and 3NF?**

| Normal Form | Rule |
|---|---|
| **1NF** | Every column holds a single atomic value; no repeating groups or arrays. Rows are uniquely identifiable (primary key exists). |
| **2NF** | Already in 1NF, **and** every non-key column depends on the **whole** primary key — not just part of it. (Only relevant when the primary key is composite.) |
| **3NF** | Already in 2NF, **and** no non-key column depends on another non-key column. Every non-key attribute depends only on the key. |

**Quick test for 3NF**: "Every non-key attribute must depend on the key, the whole key, and nothing but the key."

```sql
-- Violates 3NF: zip_code → city (transitive dependency; city doesn't depend on order_id)
CREATE TABLE orders (
  order_id   INT PRIMARY KEY,
  zip_code   CHAR(5),
  city       VARCHAR(100)
);

-- Fixed: extract the dependency to its own table
CREATE TABLE zip_codes (zip_code CHAR(5) PRIMARY KEY, city VARCHAR(100));
CREATE TABLE orders    (order_id INT PRIMARY KEY, zip_code CHAR(5) REFERENCES zip_codes);
```

> **Q: What is denormalization, and who bears the consistency burden?**

Denormalization deliberately reintroduces redundancy — duplicating columns or pre-joining tables — to eliminate join cost at read time. The read becomes cheaper; the write becomes more complex.

The critical insight interviewers test: **the database no longer enforces consistency of the redundant copies — your application code does.** A bug that updates one copy but not another produces silent data drift that's hard to detect and painful to repair. Denormalization is a deliberate choice to accept that operational burden in exchange for read performance.

Approach: normalize first to 3NF, profile under realistic load, then denormalize specific hot paths where join cost is measured and material — not hypothetical.

> **Q: When should you favor normalization vs. denormalization?**

| Workload | Preferred approach | Reason |
|---|---|---|
| **OLTP** (banking, e-commerce, SaaS) | Normalized (3NF) | Frequent writes; consistency and integrity are critical; joins are cheap on small result sets. |
| **OLAP / analytics / data warehouse** | Denormalized (star/snowflake schema) | Read-heavy aggregations over billions of rows; joins at that scale are expensive; ETL pipelines handle consistency. |
| **Read-heavy microservice** | Selective denormalization | Pre-compute joined data in materialized views or read models (CQRS); sync via events, not foreign keys. |

Star schemas in data warehouses are 3NF violations by design: dimension tables are intentionally wide and repeated because analytical query engines (columnar stores, vectorized execution) can scan them far faster than they can chase foreign keys across normalized tables. Choosing 3NF for an analytics warehouse is wrong — it makes aggregation slower without meaningful consistency benefit since the data is loaded by batch ETL anyway.

> **Q: Is BCNF different from 3NF and does it matter in practice?**

BCNF tightens 3NF: for every functional dependency `X → Y`, `X` must be a superkey. It catches a narrow class of anomalies when overlapping candidate keys exist. In practice, tables that satisfy 3NF are almost always in BCNF. Most production schema work stops at 3NF; BCNF is relevant for academic rigor and corner-case schema design.

## Common follow-ups

- What is the difference between a star schema and a snowflake schema? (star = fully denormalized dimensions, faster; snowflake = normalized dimensions, smaller but more joins)
- How do materialized views bridge normalized storage and denormalized read performance?
- What is 4NF? (multi-valued dependencies; rarely relevant outside academic settings)
- How does normalization relate to foreign key constraints and referential integrity enforcement?
