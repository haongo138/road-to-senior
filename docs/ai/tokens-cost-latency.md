---
title: Tokens, Context Windows, Cost & Latency
description: The unit economics of an LLM feature — how tokens drive cost and latency, and the levers an FDE pulls when a customer says "too slow" or "too expensive".
tags: [ai, llm, cost, latency, performance]
category: ai
status: draft
---

# Tokens, Context Windows, Cost & Latency

::: details Q: What is a token and why does it matter to the customer?
A token is the unit the model reads and writes: roughly 3/4 of an English word, often less efficient for code, JSON, and non-Latin scripts (Vietnamese or Japanese can cost 1.5 to 3x more tokens for the same meaning). Everything is metered in tokens: price, rate limits, context window, and latency. When a customer asks "what will this cost per month?", the honest answer starts with "how many tokens per request, times requests per day".

Always measure with the provider's tokenizer or the `usage` field in the response. Character-count estimates are fine for a napkin, wrong for a quote.
:::

::: details Q: How do input and output tokens differ in cost and latency?
Output tokens usually cost several times more than input tokens (often 4 to 5x), and they dominate latency because they are generated one at a time. Input is processed in parallel during "prefill", so a long prompt mostly adds to **time to first token (TTFT)**, while a long answer adds to **total generation time** linearly.

| Metric | Driven by | Lever |
|---|---|---|
| TTFT | input size, queueing, model size | prompt caching, shorter context, smaller model |
| Tokens/sec | model size, provider load | smaller/faster model |
| Total latency | TTFT + output length / speed | cap `max_tokens`, ask for terse formats, stream |

Practical consequence: asking for "JSON with only these 4 fields" instead of a prose explanation can cut both cost and latency by half.
:::

::: details Q: What is the context window, and is bigger always better?
The context window is the max input + output tokens per call. Bigger windows let you skip retrieval for small corpora, but they are not free:
- Cost and TTFT scale with what you send, every call.
- Recall degrades in long contexts; facts buried in the middle get missed more often than those at the start or end.
- Stuffing irrelevant text increases the chance of the model latching onto the wrong passage.

Rule of thumb: fill the window with what is *relevant*, not what *fits*. Long context is a good prototype shortcut and a good fallback; at scale, retrieval or summarization usually wins on cost.
:::

::: details Q: A customer says the feature is too expensive. What do you check, in order?
1. **Measure first**: log `input_tokens`, `output_tokens`, cached tokens, and model per request. Most surprises are one bloated prompt or a retry loop.
2. **Prompt caching**: a stable prefix (system prompt, tool definitions, reference docs) can be cached so repeat reads cost a fraction. Order the prompt static-first, dynamic-last.
3. **Model routing**: send easy cases (classification, extraction) to a small model, hard ones to a large one. A cheap classifier in front often pays for itself.
4. **Trim context**: fewer, better retrieved chunks; drop chat history beyond what matters, or summarize it.
5. **Batch APIs** for anything not user-facing (nightly enrichment, backfills), typically at a large discount in exchange for hours of latency.
6. **Cap output**: `max_tokens`, structured output, no "explain your reasoning" when nobody reads it.

Each lever trades something: smaller models lose quality on edge cases, caching needs a stable prefix, batch loses interactivity. Verify every change against the eval set before shipping it.
:::

::: details Q: And when it is too slow?
Split the problem: is it TTFT or generation? Stream the response so perceived latency is TTFT, not total time. Run independent calls in parallel instead of chaining them. Use a smaller model for intermediate steps of an agent. Cache deterministic results (the same document summarized twice should be a cache hit). If one step needs a big model and a long answer, consider whether the user needs the whole answer before acting, or just the first line.
:::

::: details Q: How do rate limits shape the design?
Providers limit requests per minute and tokens per minute (input and output separately). A batch job that works in testing can fail in production because ten workers share one token budget. Design for it: a client-side token bucket, exponential backoff with jitter on 429/529, a queue for non-interactive work, and alerts on sustained throttling. For enterprise customers, confirm which account and region the limits belong to before launch day.
:::

## Related

- [Prompt & context engineering](./prompt-context-engineering)
- [RAG pipelines](./rag)
- [Rate limiter (system design)](../system-design/rate-limiter)
