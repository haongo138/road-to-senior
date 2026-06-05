---
title: Message Queues vs Streams
description: How queues and log-based streams differ in semantics and use cases.
tags: [concept, messaging]
category: tech-concepts
status: draft
---

# Message Queues vs Streams

::: details Q: What is a message queue and how does it work?
A **message queue** (e.g. SQS, RabbitMQ) is a buffer between producers and consumers. A producer enqueues a message; a consumer dequeues and **acknowledges** it; the broker then **deletes** the message. Once acked, it's gone.

This delete-on-ack semantic is the defining property: a queue models **work to be done** — each task is owned by exactly one consumer. Competing consumers share the queue's message load; adding workers scales throughput linearly until the queue itself is the bottleneck. SQS standard queues provide best-effort ordering; FIFO queues add ordering guarantees at ~300 msg/s throughput (vs ~3,000 for standard).
:::

::: details Q: What is a log-based stream and what makes it different?
A **stream** (e.g. Kafka, Kinesis, Pulsar) is an **append-only, durable log**. Messages are retained for a configurable period regardless of whether they've been read. Each consumer group tracks its own **offset** — reading does not remove the message.

Key implications:
- **Fan-out without duplication**: multiple independent consumer groups each read the full log at their own pace. A new group can start reading from offset 0 and replay all history.
- **Ordering is per-partition, not global**: Kafka guarantees strict order within a partition but not across partitions. Messages are routed to partitions by key (or round-robin); all messages for the same key go to the same partition, preserving per-entity order.
- **Partition count is nearly irreversible**: Kafka allows adding partitions but not removing them, and re-partitioning redistributes key assignments — which breaks per-key ordering and forces consumer group rebalancing. Size your partitions conservatively and plan ahead.
:::

::: details Q: When should you choose a queue over a stream?
| Criteria | Queue | Stream |
|----------|-------|--------|
| Primary model | Work distribution | Event log / pub-sub |
| After consumption | Message deleted | Message retained |
| Multiple consumers | Compete for the same message | Each group gets all messages independently |
| Replay needed | No | Yes |
| Ordering required | Partial / FIFO option | Per-partition guarantee |
| Backlog visibility | Queue depth metric | Consumer lag metric |
| Examples | SQS, RabbitMQ, Azure Service Bus | Kafka, Kinesis, Pulsar |

Use a **queue** for tasks and commands — things done exactly once by one worker, where you want automatic work distribution. Use a **stream** for events that multiple systems need to observe independently, where auditability or replay are needed, or where you need a durable audit log.

The interviewer's gotcha: "Can I use Kafka like a queue?" — yes, with a consumer group of one consumer per partition, but you lose easy scaling and automatic competing-consumer balancing.
:::

::: details Q: What is backpressure and how do queues and streams handle it?
**Backpressure** occurs when producers emit faster than consumers can process.

- **Queues**: messages accumulate (bounded by storage). Visibility timeouts prevent a slow consumer from blocking others. Monitor **queue depth** — a growing queue is the primary signal. At extreme depths, storage costs rise and time-to-process grows, which breaks SLA for time-sensitive tasks.
- **Streams**: consumer **lag** grows (offset falls behind the log head). Kafka retains data up to a retention limit (time or bytes); a lagging consumer that falls off the retention window permanently loses messages. Monitor **consumer group lag** (max lag across partitions). The danger is silent: no error, messages just disappear from the consumer's perspective once the retention window rolls past.

Application-level backpressure strategies: rate-limiting producers, applying flow control at the consumer (pause/resume), or scaling consumer replicas when lag exceeds a threshold.
:::

::: details Q: What is a Dead-Letter Queue (DLQ) and what are the operational considerations?
A **DLQ** is a secondary queue/topic where messages that fail processing after N retries are routed, preventing poison messages from blocking the main queue indefinitely.

Typical flow: message fails → retry up to max attempts → move to DLQ → alert on DLQ depth → engineer investigates and either reprocesses or discards.

Operational gotchas:
- **DLQ growth is a symptom**, not a solution. Unmonitored DLQs silently accumulate data loss.
- Set up **alerting on DLQ depth** immediately when you enable the DLQ.
- For Kafka, a "dead-letter topic" is application-managed — the broker doesn't move messages automatically; your consumer must catch failures and produce to the DLQ topic itself.
- When replaying from a DLQ, confirm the consumer handles the message idempotently — the bug that caused the original failure may have partially applied effects.
:::

## Common follow-ups

- How does Kafka's consumer group rebalancing work and what causes partition reassignment?
- What is the difference between a topic and a partition in Kafka?
- How would you implement fan-out with SQS (hint: SNS + SQS)?
- How do you handle duplicate messages in a competing-consumer queue?
