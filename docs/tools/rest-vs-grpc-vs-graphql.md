---
title: REST vs gRPC vs GraphQL
description: How the three API paradigms compare, and when to reach for each.
tags: [tools, comparison, api]
category: tools
status: review
---

# REST vs gRPC vs GraphQL

All three let clients talk to servers — but they optimise for different things. REST is a
style (not a spec) built on HTTP semantics; gRPC is a strict contract-first RPC framework
using HTTP/2 and Protobuf binary; GraphQL is a query language that lets clients specify
exactly the shape of data they need.

## At a glance

| Dimension | REST | gRPC | GraphQL |
|---|---|---|---|
| Transport | HTTP/1.1 + JSON | HTTP/2 + Protobuf binary | HTTP + query language |
| Contract | OpenAPI (optional) | `.proto` — strict, required | SDL schema — strict, required |
| Payload | JSON text | Binary (smaller, faster) | JSON |
| Streaming | Limited / SSE | Bidirectional streaming native | Subscriptions |
| Browser-native | Yes | Needs grpc-web / proxy | Yes |
| Over/under-fetching | Common | N/A (fixed RPC shape) | Solves it — client picks fields |
| HTTP caching | Easy (GET + URL) | Harder — binary, POST-like | Harder — typically POST |
| Typical use | Public APIs, CRUD | Internal microservices | Flexible client-driven aggregation |

## Which to use when

**REST — the default for public surfaces.** Simple CRUD maps naturally to HTTP verbs and
status codes. Broad client compatibility (any language, curl, browsers), CDN/reverse-proxy
caching on GETs, and well-understood tooling make it the lowest-friction choice for external
or public APIs. Watch-outs: over/under-fetching multiplies round trips on mobile or
bandwidth-constrained clients; OpenAPI isn't enforced so drift is a real failure mode without
CI contract checks.

**gRPC — the right choice between internal services.** HTTP/2 multiplexing, Protobuf binary
encoding, and code-generated stubs across languages make it fast and hard to misuse at the
boundary. Bidirectional streaming is native. The `.proto` contract is versioned and enforced
— incompatible changes fail at compile time, not at 3 AM. Costs: not browser-native (requires
grpc-web or a proxy layer), binary frames are harder to inspect during debugging, and the
toolchain is heavier to set up. The gap in browser support has narrowed with Connect protocol,
but the default is still not straight HTTP/1.1.

**GraphQL — client-driven aggregation.** Rich frontends and mobile apps that aggregate data
from many backend sources benefit most — clients request exactly the fields they need,
eliminating the over/under-fetching that causes REST to balloon into dozens of specialised
endpoints. A single gateway can federate many upstream services. Costs: HTTP caching is
broken by design (queries are POST bodies); the N+1 resolver problem will appear at scale
without DataLoader-style batching; query depth/cost/complexity limiting is mandatory for
production (unbounded queries are a DoS vector); server-side schema complexity grows fast.

> **Bottom line:** public API → **REST**; internal service-to-service → **gRPC**; flexible
> client-driven aggregation → **GraphQL**. Many production systems use all three: GraphQL
> or REST at the edge, gRPC internally. The gap between paradigms has narrowed with tooling
> (e.g. OpenAPI generators, Connect, Relay), but the fundamental trade-offs remain.

## Common follow-ups

- How does HTTP/2 multiplexing change the latency story vs HTTP/1.1 keep-alive?
- Walk through the N+1 problem in GraphQL and how DataLoader solves it.
- How do you handle breaking vs non-breaking changes in a `.proto` file?
- When would you layer a GraphQL gateway over gRPC internal services — what are the failure modes?
- Why is query cost limiting in GraphQL a security concern, not just a performance concern?
