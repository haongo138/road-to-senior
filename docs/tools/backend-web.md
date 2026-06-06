---
title: Backend & Web
description: Frameworks, routers, code-gen, and DI tools for building services.
tags: [tools, backend]
category: tools
status: draft
---

# Backend & Web

Libraries and frameworks I use when building HTTP or RPC services in Go.

| Tool | Status | When I reach for it |
|------|--------|---------------------|
| net/http + chi router | `daily` | Standard HTTP services — lightweight, composable middleware |
| gRPC | `daily` | Internal service-to-service communication with strong contracts |
| REST / OpenAPI | `daily` | Public-facing APIs where broad client compatibility matters |
| sqlc | `daily` | Generating type-safe Go from SQL queries — no ORM overhead |
| Connect-RPC | `learning` | Browser-friendly gRPC over HTTP/1.1 without a proxy |
| Wire (dependency injection) | `learning` | Compile-time DI graph for larger services |
| html/template | `learning` | Server-rendered HTML for admin UIs or lightweight frontends |

*Edit to match your stack.*
