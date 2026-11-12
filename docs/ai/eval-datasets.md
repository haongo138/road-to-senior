---
title: Golden Datasets & Regression Suites
description: How to build an eval set for an LLM feature, pick graders, and run it as a regression gate so prompt and model changes stop breaking things silently.
tags: [ai, llm, evals, testing, quality]
category: ai
status: draft
---

# Golden Datasets & Regression Suites

::: details Q: Why are evals the core of an LLM deployment?
LLM output is non-deterministic and a small prompt or model change can shift behavior across thousands of inputs. Without an eval set, every change is judged on a handful of demos, and the customer finds regressions in production. With one, "is the new model better?" becomes a number in an afternoon. For an FDE, the eval set is also the contract with the customer: it encodes what "working" means in their words.
:::

::: details Q: How do you build a golden dataset?
1. **Start from real inputs**: production logs, support tickets, or the customer's example questions. Synthetic data fills gaps; it should not be the base.
2. **Cover the distribution, then the edges**: common cases, known hard cases, out-of-scope requests, adversarial and injection attempts, empty or malformed input.
3. **Write expected outcomes with a domain expert**: the reference answer, or the properties a good answer must have (cites policy X, refuses Y, extracts fields A to D).
4. **Start small**: 30 to 100 well-labeled cases beat 5,000 noisy ones. Grow it every time a bug is reported.
5. **Version it** with the code, and keep a held-out slice you do not tune against.
:::

::: details Q: What kinds of graders are there?
| Grader | Good for | Watch out for |
|---|---|---|
| Exact / programmatic (match, regex, JSON schema, SQL result) | extraction, classification, structured output | brittle for free text |
| LLM-as-judge with a rubric | tone, faithfulness, helpfulness | judge bias, cost; calibrate against humans |
| Human review | ground truth, rubric design | slow and expensive; use for sampling and calibration |

Prefer code graders wherever the answer is checkable. For LLM judges, use a specific rubric ("does the answer contain only facts present in the sources? yes/no") over a vague 1 to 10 score, and check judge agreement against a human-labeled sample before trusting it.
:::

::: details Q: What do you measure besides "accuracy"?
Task success, faithfulness to retrieved sources (no hallucination), refusal correctness (refuses what it should, answers what it should), format validity, latency (p50/p95), and cost per task. For agents: steps taken, tool-call validity, and whether it stopped. A change that raises accuracy 2% while doubling cost is a business decision, not an obvious win.
:::

::: details Q: How do you run evals as a regression suite?
Treat them like tests in CI: every prompt, model, retrieval, or tool change runs the suite and reports a diff per case against the last baseline. Because outputs vary, run each case a few times or at temperature 0, and gate on aggregate thresholds plus a list of must-pass cases (the bugs the customer reported). Show the failing cases side by side; the number alone will not tell you why.
:::

::: details Q: What are common eval mistakes?
- Testing only the happy path, so the suite always passes.
- Tuning prompts until the suite passes, which overfits it. Keep a held-out set.
- A judge model grading its own family's output generously without calibration.
- Labels written by engineers, not the people who know what "correct" means for the customer.
- Never refreshing the set, so it stops matching real traffic (see [drift](./drift-detection)).
:::

## Related

- [Drift detection & failure tracking](./drift-detection)
- [RAG pipelines](./rag)
- [Testing tools](../tools/testing)
