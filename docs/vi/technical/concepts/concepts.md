---
title: Các khái niệm kỹ thuật
description: Kiến thức về backend và hệ thống, trình bày dưới dạng hỏi đáp phỏng vấn.
tags: [concept, overview]
category: tech-concepts
status: draft
---

# Các khái niệm kỹ thuật

Vòng kiến thức: giải thích mọi thứ vận hành ra sao và trade-off của chúng. Luyện dưới dạng Q&A.

Interviewer muốn kiểm tra xem bạn có hiểu *tại sao* hệ thống được thiết kế như vậy hay không, chứ không chỉ đơn thuần là bạn đã từng dùng một công nghệ nào đó. Mỗi ghi chú bên dưới là một phần Q&A tập trung, bao quát khái niệm cốt lõi, các trade-off thường gặp và những câu hỏi đào sâu mà bạn nhiều khả năng sẽ gặp.

## Concurrency & Reliability

- [Transactional Outbox](./outbox)
- [Saga Pattern](./saga)
- [Two-Phase Commit](./two-phase-commit)
- [Change Data Capture](./change-data-capture)
- [Idempotency Keys](./idempotency)

## Databases

- [Database Indexing](./db-indexing)
- [Transactions & Isolation Levels](./transactions-isolation)
- [Normalization](./normalization)
- [Sharding & Replication](./sharding-replication)
- [SQL vs NoSQL](./sql-vs-nosql)

## Caching

- [Cache Strategies](./cache-strategies)
- [Cache Invalidation & Eviction](./cache-invalidation)

## Messaging & Consistency

- [Message Queues vs Streams](./queues-vs-streams)
- [Delivery Semantics](./delivery-semantics)
- [CAP Theorem](./cap-theorem)
- [Eventual Consistency](./eventual-consistency)

## Auth & Tokens

- [JSON Web Tokens (JWT)](./jwt)
- [OAuth 2.0](./oauth2)
- [OpenID Connect (OIDC)](./openid-connect)
- [Access & Refresh Tokens](./access-refresh-tokens)

## OOP & Design

- [SOLID & OOP](./solid-and-oop)
- [Cohesion & Coupling](./cohesion-coupling)
- [Composition over Inheritance](./composition-over-inheritance)
- [Design Patterns](./design-patterns)

## Go (Golang) · Concurrency

- [Goroutines & the Scheduler](./go-goroutines-scheduler)
- [Channels & select](./go-channels-select)
- [context.Context](./go-context)
- [sync Primitives](./go-sync-primitives)
- [Channels vs Mutexes](./go-channels-vs-mutexes)
- [Data Races & the Memory Model](./go-data-races)
- [Concurrency Patterns](./go-concurrency-patterns)
- [Goroutine Leaks](./go-goroutine-leaks)

## Go (Golang) · Runtime & Semantics

- [GC & Escape Analysis](./go-gc-escape-analysis)
- [Interfaces & the nil-interface gotcha](./go-interfaces)
- [Slices & Maps Internals](./go-slices-maps)
- [defer, panic, recover](./go-defer-panic-recover)
- [Error Handling](./go-error-handling)
- [Generics](./go-generics)
