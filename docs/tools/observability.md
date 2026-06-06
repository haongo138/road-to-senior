---
title: Observability
description: Metrics, logs, traces, and profiling tools to understand running systems.
tags: [tools, observability]
category: tools
status: draft
---

# Observability

How I know what my services are doing in production.

| Tool | Status | When I reach for it |
|------|--------|---------------------|
| Prometheus | `daily` | Scraping and storing time-series metrics from every service |
| Grafana | `daily` | Dashboards and alerts on top of Prometheus and Loki |
| pprof | `daily` | Go CPU and memory profiling during performance investigations |
| Sentry | `daily` | Error tracking and stack traces for fast incident triage |
| OpenTelemetry | `learning` | Vendor-neutral instrumentation for traces, metrics, and logs |
| Loki | `learning` | Log aggregation that integrates natively with Grafana |
| Jaeger | `future` | Distributed tracing UI when full OTel trace visualisation is needed |

*Edit to match your stack.*
