---
title: Delivery Semantics
description: At-most-once, at-least-once, and exactly-once guarantees in messaging systems.
tags: [concept, messaging, reliability]
category: tech-concepts
status: draft
---

# Delivery Semantics

> **Q: What are the three delivery guarantees in messaging systems?**

| Guarantee | What it means | Risk |
|-----------|--------------|------|
| **At-most-once** | Message sent once; if lost, it is gone | Data loss |
| **At-least-once** | Message retried until acknowledged; may arrive more than once | Duplicate processing |
| **Exactly-once** | Message processed precisely once | Hard / expensive; usually emulated |

Most production systems default to **at-least-once** because losing data is worse than handling duplicates, and duplicates can be made safe with idempotent consumers.

> **Q: How does at-least-once delivery work mechanically?**

1. Producer sends a message.
2. Consumer receives it and starts processing.
3. Consumer sends an **acknowledgement (ack)** after successful processing.
4. If the ack is not received within a **visibility timeout** (SQS) or **max.poll.interval** (Kafka), the broker re-delivers the message.

The gap between step 2 and step 3 means a crash can cause re-delivery even after partial or complete processing — hence potential duplicates.

> **Q: Is exactly-once delivery really possible?**

True exactly-once across a distributed system is extremely difficult because you cannot atomically commit "process message" and "ack to broker" without distributed coordination.

In practice, **exactly-once is achieved as at-least-once + idempotent consumer**:
- The broker may deliver the message more than once.
- The consumer detects and safely ignores re-deliveries (via a dedup key, database unique constraint, or idempotency token).

Kafka provides **transactional producers + exactly-once semantics (EOS)** within a Kafka-to-Kafka pipeline using atomic writes across topics, but even this relies on idempotent consumers at the application boundary.

> **Q: Why must consumers be idempotent with at-least-once delivery?**

Because retries are unavoidable — network failures, consumer crashes, or slow acks will all trigger re-delivery. A consumer that is **idempotent** produces the same outcome regardless of how many times the same message is processed (e.g. upsert instead of insert, use a unique dedup ID to skip already-applied operations).

Without idempotency: charging a customer twice, sending duplicate emails, double-counting inventory.

See also: [Idempotency Keys](./idempotency).

> **Q: How does the Transactional Outbox pattern relate to delivery semantics?**

The [Outbox pattern](./outbox) guarantees **at-least-once delivery from a service** by writing the event to a database table in the same transaction as the business operation. A relay process then publishes it to the broker. If the relay crashes mid-publish, it re-reads the outbox and re-publishes — resulting in at-least-once, which consumers must handle idempotently.

> **Q: What is a visibility timeout and how does it interact with retries?**

In SQS and similar queues, when a consumer receives a message it becomes **invisible** to other consumers for the visibility timeout duration. If the consumer does not ack (delete) the message before the timeout, the message becomes visible again and is re-delivered.

Set the visibility timeout longer than your maximum processing time; otherwise you get spurious re-deliveries even from healthy (but slow) consumers.

## Common follow-ups

- How do you choose a deduplication key when messages may be structurally identical but logically distinct?
- How does Kafka's idempotent producer differ from an idempotent consumer?
- What is the difference between a NACK (negative ack) and letting a visibility timeout expire?
- How does the Outbox pattern improve on direct broker publishing for delivery guarantees?
