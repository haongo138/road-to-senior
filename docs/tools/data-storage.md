---
title: Data & Storage
description: Databases, queues, caches, and object stores I rely on.
tags: [tools, data]
category: tools
status: draft
---

# Data & Storage

Where data lives, flows, and gets cached in the systems I build.

| Tool | Status | When I reach for it |
|------|--------|---------------------|
| PostgreSQL | `daily` | Default relational store — ACID transactions, rich indexing |
| pgx driver | `daily` | High-performance Go Postgres driver with native type support |
| Redis | `daily` | Caching, rate limiting, and pub/sub fan-out |
| Kafka | `daily` | High-throughput event streaming and async service decoupling |
| S3 / object storage | `daily` | Large blobs, backups, and static assets |
| Elasticsearch / OpenSearch | `learning` | Full-text search and log aggregation at scale |
| ClickHouse | `future` | Columnar analytics when Postgres OLAP queries get slow |

*Edit to match your stack.*
