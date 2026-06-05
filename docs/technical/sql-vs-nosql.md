---
title: SQL vs NoSQL
description: When to reach for a relational database vs. a NoSQL store, and the real trade-offs between them.
tags: [concept, database, modeling]
category: tech-concepts
status: draft
---

# SQL vs NoSQL

> **Q: What fundamentally distinguishes relational (SQL) databases from NoSQL databases?**

Relational databases model data as tables with rows and columns, enforce a **predefined schema**, support **arbitrary JOINs**, and provide **ACID transactions** across tables. Data integrity is guaranteed by the engine (foreign keys, constraints).

NoSQL databases are a diverse family united by what they relax: most trade strict schema, JOIN support, or full ACID guarantees for higher write throughput, horizontal scalability, or a data model better suited to specific access patterns.

> **Q: What are the main NoSQL data model families?**

| Family | Model | Best for | Examples |
|---|---|---|---|
| **Key-value** | Opaque blob per key | Sessions, caches, simple lookups | Redis, DynamoDB (basic), Riak |
| **Document** | JSON/BSON document per key | Flexible schemas, nested data, content | MongoDB, CouchDB, Firestore |
| **Wide-column** | Rows with dynamic column sets; optimized for column-family reads | Time-series, analytics, write-heavy | Cassandra, HBase, Bigtable |
| **Graph** | Nodes and edges with properties | Relationship-heavy data (social networks, fraud graphs) | Neo4j, Amazon Neptune |

Each family optimizes for specific access patterns; none is universally superior.

> **Q: When does NoSQL win over SQL?**

- **Massive write scale**: wide-column stores (Cassandra) are designed for write-heavy, high-throughput workloads that exceed what a single SQL leader can handle.
- **Flexible / evolving schema**: document stores let different records have different fields without ALTER TABLE migrations.
- **Simple, known access patterns**: if every query is "look up document by ID" or "get all items for user X", the NoSQL model is simpler and faster because there are no joins.
- **Horizontal scale by default**: many NoSQL systems shard automatically and are designed to scale out from day one.

> **Q: When does SQL win over NoSQL?**

- **Complex queries and ad-hoc analysis**: SQL's expressive query language and optimizer handle multi-table joins and aggregations that would require application-side assembly in most NoSQL systems.
- **Multi-entity transactions**: ACID across multiple records is well-supported in relational databases and complex to achieve in most NoSQL stores.
- **Data integrity and referential consistency**: foreign keys and constraints are enforced by the database, not application code.
- **Reporting and BI tools**: the SQL ecosystem (ORMs, dashboards, BI tools) is far more mature.

> **Q: "NoSQL means no schema" — is that accurate?**

No. NoSQL stores are better described as **schema-on-read** rather than truly schemaless. The structure is implicit in the application code that reads and writes the data. If a field name changes, old documents still have the old name — the application must handle both. This is more flexible but moves the burden of enforcement from the database to the code. Compare this to SQL's **schema-on-write**, where the database rejects non-conforming data at insert time.

> **Q: Has the SQL vs. NoSQL choice become less binary?**

Yes. Several trends blur the line:

- **NewSQL databases** (CockroachDB, Google Spanner, TiDB) offer SQL interfaces, full ACID, and automatic horizontal sharding — targeting the "SQL semantics at NoSQL scale" use case.
- **SQL databases added NoSQL features**: PostgreSQL has a `JSONB` column type for schemaless document storage, and its full-text and array types cover many document-store use cases.
- **NoSQL databases added SQL-like features**: Cassandra has CQL; MongoDB added multi-document ACID transactions in v4.

Choose based on your dominant access patterns and consistency requirements, not dogma.

## Common follow-ups

- How does the CAP theorem relate to the SQL vs. NoSQL choice?
- What is eventual consistency, and which NoSQL databases use it by default?
- How would you migrate a document store to a relational model (or vice versa) as requirements change?
- When would you combine SQL and NoSQL in the same system (polyglot persistence)?
