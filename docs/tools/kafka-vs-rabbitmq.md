---
title: Kafka vs RabbitMQ
description: How the two dominant messaging systems compare, and when to choose each.
tags: [tools, comparison, messaging]
category: tools
status: review
---

# Kafka vs RabbitMQ

The core distinction is architectural, not just a throughput number. **Kafka is a distributed,
append-only log**: messages are retained, ordered by offset, and any consumer can independently
read and *replay* them at any point. **RabbitMQ is a traditional message broker**: messages are
routed to queues, delivered to consumers, and removed after acknowledgement — replay is not a
built-in concept.

## At a glance

| Dimension | Kafka | RabbitMQ |
|---|---|---|
| Model | Retained log — replayable | Queue — deleted after ack |
| Ordering | Per partition (strict) | Per queue |
| Throughput | Very high (millions of msg/s) | High, lower than Kafka |
| Routing | Topic / partition — simple | Rich exchanges: direct, topic, fanout, headers |
| Consumer model | Consumer groups — many independent readers | Competing consumers (work queue) |
| Retention / replay | Time- or size-based; fully replayable | Until consumed; no built-in replay |
| Delivery semantics | At-least-once; exactly-once within Kafka | At-least-once; ack/nack; dead-letter queue |
| Typical use | Event streaming, event sourcing, analytics pipelines, high-volume logs | Task/work queues, RPC/request-reply, complex routing, per-message workflows |

## Which to use when

**Kafka — streaming, replay, and high volume.** When multiple independent systems need to
consume the same event stream (analytics, audit, search indexing, downstream services),
Kafka's consumer-group model lets them all read independently without contention. Log retention
means a downstream service can be deployed, catch up from an offset, and never miss events —
critical for event sourcing. Throughput scales horizontally with partitions. Costs: operational
complexity is real — KRaft (or legacy ZooKeeper), partition planning, consumer-lag monitoring,
and compaction tuning are all necessary. Not a good fit for complex per-message routing logic
or low-latency synchronous RPC patterns (latency is measurable even on well-tuned clusters).

**RabbitMQ — routing, tasks, and per-message control.** The exchange/binding model enables
routing topologies that Kafka can't express cleanly: route by header, fanout to arbitrary
queues, conditional routing by routing key. Work queues distribute tasks across competing
consumers with automatic rebalancing — the simplest model for background job processing.
Dead-letter queues and per-message ack/nack give fine-grained delivery control that Kafka
lacks at the individual message level. Simpler to operate at moderate scale. Costs: throughput
ceiling is lower, there is no built-in replay once a message is consumed, and queue depth under
backpressure requires careful policy (TTL, max-length, DLQ) to avoid silent data loss.

> **Bottom line:** high-throughput streaming, multiple independent consumers, or replay →
> **Kafka**; flexible routing, task queues, per-message workflows, or simpler operational
> footprint → **RabbitMQ**. The two are frequently deployed together in larger systems — Kafka
> for the event backbone, RabbitMQ for task dispatch at the service level.

See also: [Message Queues vs Streams](../technical/concepts/queues-vs-streams) and
[Delivery Semantics](../technical/concepts/delivery-semantics).

## Common follow-ups

- How does Kafka's consumer group rebalancing work, and what happens to in-flight messages during a rebalance?
- Explain the exactly-once semantics story in Kafka — what does it actually guarantee and where does it break?
- What is a dead-letter exchange in RabbitMQ, and when would you use one vs just retrying in the consumer?
- How would you handle a slow consumer in Kafka vs RabbitMQ — what are the failure modes of each?
- When does event sourcing require Kafka's log retention, and could you implement it on RabbitMQ?
