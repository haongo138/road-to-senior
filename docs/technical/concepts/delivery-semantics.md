---
title: Delivery Semantics
description: At-most-once, at-least-once, and exactly-once guarantees in messaging systems.
tags: [concept, messaging, reliability]
category: tech-concepts
status: draft
---

# Delivery Semantics

::: details Q: What are the three delivery guarantees in messaging systems?
| Guarantee | What it means | Risk |
|-----------|--------------|------|
| **At-most-once** | Message sent once; if lost in transit, it's gone | Data loss |
| **At-least-once** | Message retried until acknowledged; may arrive more than once | Duplicate processing |
| **Exactly-once** | Processed precisely once | Hard / expensive; usually emulated, never magic |

Most production systems default to **at-least-once** because data loss is worse than handling duplicates, and duplicates can be made safe with an idempotent consumer. At-most-once is reserved for loss-tolerant, latency-critical flows (metrics, traces, UDP-style fire-and-forget).
:::

::: details Q: How does at-least-once delivery work mechanically?
1. Producer sends the message.
2. Consumer receives it and begins processing.
3. Consumer sends an **acknowledgement** after successful processing.
4. If the ack doesn't arrive before the **visibility timeout** (SQS) or **max.poll.interval** (Kafka), the broker re-delivers the message.

The danger lives between steps 2 and 3. If the consumer crashes mid-process — or is too slow and the timeout fires — the broker re-delivers a message that may have been fully or partially applied. That re-delivery is unavoidable by design.
:::

::: details Q: Is exactly-once delivery really possible?
Not as a primitive — it's **at-least-once + idempotency + deduplication**, presented together. You cannot atomically commit "process this message" and "ack to the broker" without a distributed transaction; the gap between those two operations is where duplicates are born.

Kafka's **Exactly-Once Semantics (EOS)** — transactional producers + atomic multi-partition writes — eliminates duplicates *within a Kafka-to-Kafka pipeline* (read from topic A, transform, write to topic B). It does not extend past the Kafka boundary: whatever your consumer does outside Kafka (DB write, HTTP call, email) must still be idempotent. EOS also has real costs: ~20–30% throughput reduction and higher broker load from transaction coordination.

For end-to-end exactly-once across systems, the recipe is: at-least-once delivery + idempotent consumer + dedup store. The dedup store (a DB unique constraint on message ID, or a Redis SET with TTL) is the critical piece — and its TTL must exceed your maximum redelivery window, or you'll re-process messages whose dedup records have expired.
:::

::: details Q: Why must consumers be idempotent with at-least-once delivery?
Because retries are **unavoidable** — network failures, consumer crashes, slow processing, and GC pauses all trigger re-delivery. An idempotent consumer produces the same outcome regardless of how many times the same message is applied: upsert instead of insert, set instead of increment, or check a dedup ID before acting.

Without idempotency: you charge a customer twice, send duplicate emails, or double-count inventory. These are real production incidents, not theoretical risks.

See also: [Idempotency Keys](./idempotency).
:::

::: details Q: How does the Transactional Outbox pattern relate to delivery semantics?
The [Outbox pattern](./outbox) achieves **reliable at-least-once delivery from a service** by writing the event into a database table in the **same transaction** as the business operation. A relay process reads the outbox and publishes to the broker. If the relay crashes mid-publish, it re-reads and re-publishes — hence at-least-once. Consumers must handle duplicates idempotently.

The alternative — publish to the broker inside the business transaction — fails under partial failure: the DB commits but the broker publish fails (or vice versa), giving you either lost events or phantom events. The Outbox avoids this by making the DB the single source of truth for "did this event need to be sent."
:::

::: details Q: What is a visibility timeout and how does it interact with retries?
In SQS and similar queues, when a consumer receives a message it becomes **invisible** to other consumers for the visibility timeout duration. If the consumer doesn't ack (delete) the message before the timeout expires, the message becomes visible again and is re-delivered.

Set the visibility timeout **longer than your maximum processing time** including tail latency; otherwise a slow-but-healthy consumer triggers spurious re-deliveries that result in duplicate processing. A common mistake: setting the timeout to the *average* processing time — the long tail causes phantom re-deliveries in production.

For Kafka, the equivalent is `max.poll.interval.ms` — if the consumer doesn't poll within that window, the broker assumes it's dead and triggers a rebalance, re-assigning the partition to another consumer in the group.
:::

::: details Q: How do you choose a deduplication key?
The dedup key must be **stable across re-deliveries** and **unique per logical event** — not just per physical message. A Kafka offset works if you're processing Kafka-to-Kafka; a database-generated UUID in the outbox table works for outbox-based flows. The danger is using a natural business key that isn't truly unique per event (e.g. `user_id + action` without a timestamp — two legitimate duplicate-but-distinct events share the key and the second is silently dropped).
:::

## Common follow-ups

- How do you choose a deduplication key when messages may be structurally identical but logically distinct?
- How does Kafka's idempotent producer differ from an idempotent consumer?
- What is the difference between a NACK (negative ack) and letting a visibility timeout expire?
- How does the Outbox pattern improve on direct broker publishing for delivery guarantees?
