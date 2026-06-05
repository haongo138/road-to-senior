---
title: Change Data Capture (CDC)
description: Stream row-level database changes by tailing the transaction log rather than polling tables.
tags: [concept, concurrency, reliability]
category: tech-concepts
status: draft
---

# Change Data Capture (CDC)

> **Q: What is Change Data Capture (CDC)?**

CDC detects and streams every committed INSERT, UPDATE, or DELETE by reading the database's **transaction log** (Postgres WAL, MySQL binlog, SQL Server change log) rather than querying tables. Because the log is the source of truth for every committed change, CDC captures every mutation with sub-100 ms latency and zero missed updates — including rows that were updated and deleted between two poll intervals, which polling silently drops.

> **Q: How does CDC differ from polling-based change detection?**

| Aspect | Polling | CDC (log-based) |
|---|---|---|
| Latency | Seconds to minutes (interval-bound) | Milliseconds (log-driven) |
| Missed updates | Yes — update+delete between polls is invisible | None — every commit is captured |
| DB load | Periodic SELECT scans | Minimal — log is a side channel |
| Schema dependency | Requires `updated_at`; deletes are invisible | None — schema-agnostic by default |

The cost: CDC couples your pipeline to the storage engine's log format and replication protocol. A Postgres upgrade or a switch to MySQL is now a migration event for your CDC consumers, not just your application.

> **Q: What are the main CDC tools and mechanisms?**

- **Debezium**: The most widely deployed open-source CDC connector; integrates with Kafka Connect and supports Postgres, MySQL, MongoDB, SQL Server, Oracle. Emits structured change events to Kafka topics with before/after row images.
- **Postgres logical replication**: Built-in; uses replication slots with plugins like `pgoutput` (native) or `wal2json`. Debezium wraps this. Direct use is lower overhead but requires managing the slot lifecycle yourself.
- **MySQL binlog**: Requires `binlog_format=ROW`. Consumed by Debezium or Maxwell's Daemon.
- **Managed services**: AWS DMS, Google Datastream, Fivetran — lower operational burden but less control over schema evolution and event format.

> **Q: What are the primary use cases for CDC?**

- **[Outbox](./outbox) relay**: Detect new outbox rows the instant they commit and publish to the broker — far lower latency than polling.
- **Cache invalidation**: Invalidate or refresh a cache entry the moment its backing row changes, without application-layer hooks.
- **Search index synchronization**: Keep Elasticsearch or Typesense consistent with the source database without dual-writes.
- **Event streaming / analytics**: Feed a data warehouse or lake incrementally without batch ETL.
- **Audit logs**: Derive a tamper-evident audit trail from the log itself, capturing the exact row state before and after each change.

> **Q: What are the failure modes you must operate against?**

- **Replication slot bloat (Postgres)**: If a CDC consumer falls behind or its connection drops while the slot persists, Postgres cannot reclaim WAL — it accumulates until disk fills. Monitor slot lag with `pg_replication_slots.confirmed_flush_lsn` vs. `pg_current_wal_lsn()`. Set `max_slot_wal_keep_size` (Postgres 13+) to cap WAL retention and drop the slot automatically if the consumer is too far behind.
- **Schema evolution**: A column rename or type change after events were written means old events and new events have incompatible shapes. Use a Schema Registry (Avro/Protobuf) to version schemas and configure consumers to handle both the old and new format during the migration window. Never rename a column without a parallel-run migration period.
- **Snapshot + stream cutover**: New consumers need a consistent baseline snapshot of existing rows before consuming log events. If the snapshot is not coordinated with the log position, you get gaps or duplicates at the cutover point. Debezium's snapshot mode captures the consistent read position so the first log event immediately follows the last snapshot row.
- **Ordering per key**: Events are ordered per partition key (typically the primary key), not globally across tables. A `customers` CDC event and an `orders` CDC event that were committed in the same transaction will arrive in separate Kafka topics with no guaranteed cross-topic ordering. Design consumers to be order-tolerant or route all related tables to the same partition.
- **At-least-once delivery**: The consumer may receive a duplicate if it crashes after applying a change but before checkpointing its offset. Consumers must be [idempotent](./idempotency) — use the event's log sequence number (LSN) or `(table, primary_key, txn_id)` as a deduplication key.

> **Q: How do you achieve exactly-once semantics with CDC?**

CDC provides at-least-once: an event may be re-delivered after a consumer restart. Exactly-once requires idempotent consumers. The pattern: use a database-level upsert keyed on the primary key and track the last-applied LSN per source table. Commit the LSN update in the same transaction as the applied change. If the consumer crashes and replays, the duplicate event hits the same upsert and produces no additional effect. The LSN prevents re-processing an event that was already committed.

## Common follow-ups

- How do you handle a Postgres replication slot falling behind and causing WAL disk exhaustion?
- What is a Debezium "heartbeat" event and why is it needed for low-write tables?
- How do you perform an initial snapshot without locking the source table?
- How does schema evolution work when a consumer reads events produced before and after a column rename?
