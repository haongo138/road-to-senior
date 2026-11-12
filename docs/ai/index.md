---
title: AI
---

# AI

Notes on building with AI — agent architectures, patterns, and practical
trade-offs. A living section; edit freely.

## Notes

- [Building Effective AI Agents](./building-effective-agents) — single-agent vs
  multi-agent, agentic workflows (sequential, parallel, evaluator-optimizer), and
  a decision framework for choosing. *(from Anthropic's guide)*
- [Tokens, Context Windows, Cost & Latency](./tokens-cost-latency) — unit
  economics of an LLM feature and the levers for "too slow" or "too expensive".
- [Prompt & Context Engineering](./prompt-context-engineering) — what goes into
  the window on each call, managing long contexts, prompt injection.
- [RAG Pipelines](./rag) — ingestion, hybrid retrieval, reranking, permissions,
  and debugging wrong answers stage by stage.
- [Tool Use & MCP Servers](./tool-use-mcp) — designing tools a model uses well,
  MCP as the integration deliverable, containing tool risk.
- [Golden Datasets & Regression Suites](./eval-datasets) — building eval sets,
  choosing graders, running evals as a CI gate.
- [Drift Detection & Failure Tracking](./drift-detection) — what drifts after
  launch, what to log, and turning failures into eval cases.
