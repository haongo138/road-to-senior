---
title: SQL vs NoSQL
description: When to reach for a relational database vs. a NoSQL store, and the real trade-offs between them.
tags: [concept, database, modeling]
category: tech-concepts
status: draft
---

# SQL vs NoSQL

::: details Q: What fundamentally distinguishes relational (SQL) from NoSQL databases?
Relational databases model data as tables with a predefined schema, support arbitrary JOINs against any column, and provide full ACID transactions across multiple tables. The engine enforces integrity (foreign keys, constraints, types) — bad data is rejected at write time.

NoSQL is a diverse family united by what each member *relaxes*. Most trade some combination of schema rigidity, JOIN support, or multi-record ACID guarantees for higher write throughput, horizontal scalability, or a data model better suited to specific access patterns. The key word is *relaxes* — you're not getting a free upgrade, you're making an explicit trade.
:::

::: details Q: What are the main NoSQL data model families?
| Family | Model | Best for | Examples |
|---|---|---|---|
| **Key-value** | Opaque blob per key | Sessions, caches, simple lookups | Redis, DynamoDB (basic), Riak |
| **Document** | JSON/BSON document per key | Flexible schemas, nested data, content | MongoDB, CouchDB, Firestore |
| **Wide-column** | Rows with dynamic column sets; optimized for column-family reads | Write-heavy, time-series, analytics | Cassandra, HBase, Bigtable |
| **Graph** | Nodes and edges with properties | Relationship-heavy data (social, fraud graphs) | Neo4j, Amazon Neptune |

Each family optimizes for specific access patterns. Choosing the wrong family for your access pattern is worse than choosing the wrong brand.
:::

::: details Q: When does NoSQL win over SQL?
- **Massive write scale**: wide-column stores (Cassandra) are built for write-heavy, high-throughput workloads that exhaust what a single SQL leader can sustain — hundreds of thousands of writes/sec across commodity nodes.
- **Flexible / rapidly evolving schema**: document stores let different records have different fields without ALTER TABLE migrations — useful when the shape of data is discovered iteratively.
- **Simple, known access patterns**: if every query is "fetch document by ID" or "get all events for user X", a NoSQL model is simpler and avoids join overhead. The caveat: if your access patterns shift and you need a new query pattern, you may need to duplicate data or re-model from scratch. SQL supports ad-hoc queries; NoSQL largely doesn't.
- **Horizontal scale by default**: many NoSQL systems shard automatically, which suits teams that expect massive growth and want scale-out as a first-class design primitive.
:::

::: details Q: When does SQL win over NoSQL?
- **Complex, ad-hoc queries**: SQL's expressive optimizer handles multi-table joins and aggregations that would require application-side assembly — multiple round trips, merge logic, no optimizer — in most NoSQL systems.
- **Multi-entity transactions**: ACID across multiple records is well-supported in relational databases and genuinely hard to achieve correctly in most NoSQL stores (sagas, compensating transactions, eventual consistency all push complexity to application code).
- **Data integrity by the engine**: foreign keys and constraints mean bad data is impossible to write, not just unlikely. In document stores, orphaned references and missing fields accumulate silently.
- **Reporting and BI**: the SQL ecosystem — ORMs, dashboards, BI tools — is far more mature. A MongoDB collection plugged into a BI tool is painful; a Postgres table is trivial.
:::

::: details Q: "NoSQL means no schema" — is that accurate?
No, and this is a common trap. NoSQL stores are better described as **schema-on-read** rather than schemaless. The structure is implicit in the application code. If a field is renamed, old documents still use the old name — the reader must handle both versions. This is more flexible but moves enforcement from the database to the code. That burden compounds: migrations, validation, and invariant enforcement all land in application logic, and failures produce silent data drift rather than rejected writes.

SQL's **schema-on-write** rejects non-conforming data at insert time. The schema is documentation that the engine enforces — no separate validation layer required.
:::

::: details Q: Has the SQL vs. NoSQL choice become less binary?
Yes, meaningfully so:

- **NewSQL** (CockroachDB, Google Spanner, TiDB) offers SQL semantics, full ACID, and automatic horizontal sharding — closing the historical gap between "SQL features" and "NoSQL scale."
- **Postgres added NoSQL-style features**: `JSONB` columns for schemaless document storage, full-text search, and arrays cover most document-store use cases without abandoning ACID or relational querying.
- **NoSQL systems grew SQL-like features**: Cassandra has CQL; MongoDB added multi-document ACID transactions in v4, though with meaningful overhead vs. native RDBMS transactions.

The practical implication: **the decision should be access-pattern-first, not technology-first**. Start by asking "what queries must be fast?" and "how strong does consistency need to be?" — not "is this a startup that uses MongoDB?" Teams that pick NoSQL early for its developer experience often find themselves building joins, transactions, and schema enforcement in application code at significant complexity cost. That's not wrong — it's a trade you should make consciously.
:::

## Common follow-ups

- How does the CAP theorem relate to the SQL vs. NoSQL choice? (partition tolerance + consistency vs. availability; most NoSQL systems lean AP)
- What is eventual consistency and which NoSQL systems use it by default? (Cassandra, DynamoDB by default; strong consistency optional at cost)
- How would you migrate a document store to a relational model as requirements change? (dual-write, backfill, cut-over; never trivial)
- When would you combine SQL and NoSQL in the same system (polyglot persistence), and what operational complexity does that add?
