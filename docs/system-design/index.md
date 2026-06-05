---
title: System Design
---

# System Design

Every system here is documented with the **C4 model** — four zoom levels, from the
outside in. Lead with the use case, then add detail only where it earns its place.

## The C4 levels

| Level | What it shows | Audience | Question it answers |
|---|---|---|---|
| **C1 — System Context** | The system as one box, its users, and external systems it talks to | Everyone | What is this, and who/what does it interact with? |
| **C2 — Container** | The deployable/runnable units inside (web/app/API services, datastores, caches, queues) and how they communicate | Engineers, ops | What are the major moving parts and the tech choices? |
| **C3 — Component** | The components inside one container and their responsibilities | Devs of that container | How is this service organised internally? |
| **C4 — Code** | Classes/functions | Rarely needed | How is one component implemented? (usually skip — code is the source of truth) |

Two **supplementary** views, used only when they add value:

- **Dynamic** — a key request flow / sequence across containers.
- **Deployment** — how containers map to infrastructure (regions, AZs, nodes).

## How to use it in an interview

1. **Overview & use case first** — restate the problem, functional + non-functional
   requirements, and the scale (QPS, data size, latency, read/write ratio). This sets
   every later decision.
2. **C1 Context** — quickly frame actors and external systems.
3. **C2 Container** — spend most of your time here; this is where architecture and
   tech trade-offs live.
4. **C3 Component** — drop into the one interesting service.
5. **Dynamic view** — walk a critical flow end to end.

Don't zoom deeper than the conversation needs — C4 is about *progressive disclosure*.

## Note structure

Each system design below follows the same shape:

> **Overview & use case** → **C1 Context** → **C2 Containers** → **C3 Components** → **Dynamic** (where useful) → **Trade-offs & where it breaks**

Browse the systems from the sidebar or the home grid (filter: **System Design**).
