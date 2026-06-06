---
title: Testing
description: Test frameworks, linters, load tools, and mocking libraries.
tags: [tools, testing]
category: tools
status: draft
---

# Testing

How I validate correctness, prevent regressions, and catch issues early.

| Tool | Status | When I reach for it |
|------|--------|---------------------|
| Go testing + table-driven | `daily` | Unit and integration tests — idiomatic, zero extra deps |
| testify | `daily` | Assertions and suites to reduce test boilerplate |
| mockgen / gomock | `daily` | Generating interface mocks for isolated unit tests |
| golangci-lint | `daily` | Catching bugs and style issues before code review |
| testcontainers-go | `learning` | Spinning up real Postgres/Redis/Kafka instances in tests |
| k6 | `learning` | Load and performance testing for HTTP services |
| Playwright | `future` | Browser-based E2E tests for any frontend that ships |

*Edit to match your stack.*
