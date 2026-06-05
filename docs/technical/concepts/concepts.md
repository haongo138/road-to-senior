---
title: Technical Concepts
description: Backend & systems knowledge in interview Q&A form.
tags: [concept, overview]
category: tech-concepts
status: draft
---

# Technical Concepts

The knowledge round: explain how things work and their trade-offs. Drilled as Q&A.

Interviewers test whether you understand *why* systems are designed the way they are — not just that you've used a technology. Each note below is a focused Q&A covering the core concept, common trade-offs, and follow-up questions you are likely to face.

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
