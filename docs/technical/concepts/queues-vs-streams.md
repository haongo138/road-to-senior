---
title: Message Queues vs Streams
description: How queues and log-based streams differ in semantics and use cases.
tags: [concept, messaging]
category: tech-concepts
status: draft
---

# Message Queues vs Streams

> **Q: What is a message queue and how does it work?**

A **message queue** (e.g. Amazon SQS, RabbitMQ) is a buffer between producers and consumers. A producer sends a message; a consumer receives and **acknowledges** it; the message is then **deleted** from the queue.

Key properties:
- Each message is delivered to **one consumer** (competing consumers share the work).
- Designed for **task distribution** — each unit of work is processed exactly once by one worker.
- No inherent ordering guarantee across messages (SQS standard queues; FIFO queues add ordering with throughput limits).

> **Q: What is a log-based stream and what makes it different?**

A **stream** (e.g. Apache Kafka, AWS Kinesis) is an **append-only, durable log**. Messages are retained for a configurable period regardless of whether they have been read.

Key properties:
- Consumers track their own **offset** (position in the log); reading does not remove the message.
- Multiple **independent consumer groups** can each read the full log at their own pace (fan-out without duplication of storage).
- Messages within a **partition** are strictly ordered; Kafka distributes partitions across brokers for parallelism.
- Supports **replay** — reprocess historical events by resetting an offset.

> **Q: When should you choose a queue over a stream?**

| Criteria | Queue | Stream |
|----------|-------|--------|
| Primary model | Work distribution | Event log / pub-sub |
| After consumption | Message deleted | Message retained |
| Multiple consumers | Compete for the same message | Each group gets all messages |
| Replay needed | No | Yes |
| Ordering required | Partial / FIFO option | Per-partition guarantee |
| Examples | SQS, RabbitMQ, Azure Service Bus | Kafka, Kinesis, Pulsar |

Use a **queue** for jobs, tasks, or commands — things that need to be done once by one worker. Use a **stream** for events that multiple systems need to observe, or when you need auditability and replay.

> **Q: What is backpressure and how do queues/streams handle it?**

**Backpressure** occurs when producers emit faster than consumers can process. 

- In queues, messages accumulate in the queue (bound by storage). Visibility timeouts prevent a slow consumer from blocking others.
- In streams, consumer lag grows (offset falls behind the head of the log). Kafka retains data up to a retention limit; a lagging consumer will eventually lose messages if they fall off the retention window.
- Application-level backpressure: producers can block, drop, or rate-limit based on queue depth / consumer lag metrics.

> **Q: What is a Dead-Letter Queue (DLQ)?**

A **DLQ** is a secondary queue where messages that fail processing after N retries are automatically routed. It prevents poison messages from blocking the main queue indefinitely.

Typical workflow: message fails → retry up to max attempts → move to DLQ → alert on DLQ → engineer investigates and reprocesses or discards.

Both SQS and RabbitMQ support DLQs natively; Kafka achieves the same via a separate "dead-letter topic" (application-managed).

## Common follow-ups

- How does Kafka's consumer group rebalancing work and what causes partition reassignment?
- What is the difference between a topic and a partition in Kafka?
- How would you implement fan-out with SQS (hint: SNS + SQS)?
- How do you handle duplicate messages in a competing-consumer queue?
