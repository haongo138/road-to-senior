---
title: Change Data Capture (CDC)
description: Stream row-level database changes by tailing the transaction log rather than polling tables.
tags: [concept, concurrency, reliability]
category: tech-concepts
status: draft
---

# Change Data Capture (CDC)

> **Q: What is Change Data Capture (CDC)?**

CDC is a technique for detecting and streaming every row-level INSERT, UPDATE, or DELETE that occurs in a database by reading the database's **transaction log** (Postgres WAL, MySQL binlog, SQL Server CDC log) rather than querying the tables themselves. Each committed change is emitted as an event that downstream consumers can react to in near real time.

> **Q: How does CDC differ from polling-based change detection?**

| Aspect | Polling | CDC (log-based) |
|---|---|---|
| Latency | Seconds to minutes (interval-bound) | Milliseconds (log-driven) |
| Missed updates | Possible if a row is updated and deleted between polls | None — every committed change is captured |
| DB load | Extra SELECT queries on every poll cycle | Minimal — log reading is a side channel |
| Application changes | May require `updated_at` columns | None — log is written by the DB engine |

CDC wins on latency and completeness at the cost of tighter coupling to the storage engine's log format.

> **Q: What are the main CDC tools and mechanisms?**

- **Debezium**: Open-source CDC platform that connects to Postgres, MySQL, MongoDB, SQL Server, and others; emits change events to Kafka topics.
- **Postgres logical replication**: Built-in feature using replication slots and a logical decoding plugin (e.g., `pgoutput`, `wal2json`).
- **MySQL binlog**: MySQL's binary log in `ROW` format; consumed by Debezium or Maxwell's Daemon.
- **AWS DMS / Google Datastream**: Managed CDC services for cloud environments.

> **Q: What are the primary use cases for CDC?**

- **Outbox relay**: The [Transactional Outbox](./outbox) relay uses CDC to detect new outbox rows and publish them to a broker with minimal latency.
- **Cache invalidation**: Invalidate or refresh a cache entry the moment its backing row changes.
- **Search index synchronization**: Keep Elasticsearch or Typesense in sync with the source-of-truth database.
- **Data pipelines / analytics**: Stream changes into a data warehouse or lake in near real time without batch ETL jobs.
- **Audit logs**: Build a tamper-evident audit trail from the log itself.

> **Q: What are the trade-offs and challenges of CDC?**

- **Schema coupling**: Changes to table schemas (column renames, type changes) can break consumers if not handled with schema evolution (Avro + Schema Registry).
- **Ordering**: Events are ordered **per partition key** (usually the primary key), not globally. Cross-table ordering is not guaranteed.
- **Initial snapshot**: New consumers need a baseline snapshot of existing data before they can apply incremental log events; this must be coordinated carefully.
- **Exactly-once delivery**: The log provides at-least-once delivery; consumers must be [idempotent](./idempotency) to handle duplicates.
- **Replication slot lag (Postgres)**: An inactive consumer holding a replication slot can cause WAL to accumulate and fill disk.

> **Q: How do you achieve exactly-once semantics with CDC?**

CDC itself guarantees at-least-once delivery — the consumer may receive a duplicate if it crashes after processing but before checkpointing its log offset. Exactly-once semantics require idempotent consumers: use the event's unique log position or primary key + transaction ID as a deduplication key, and commit the offset only after successfully applying the change (see [Idempotency Keys](./idempotency)).

## Common follow-ups

- How do you handle a Postgres replication slot falling behind and causing WAL bloat?
- What is a "heartbeat" event in Debezium and why is it needed for low-traffic tables?
- How do you perform an initial snapshot without locking the source table?
- How does schema evolution work when a consumer reads events produced before and after a column rename?
