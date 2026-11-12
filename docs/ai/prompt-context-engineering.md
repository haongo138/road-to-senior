---
title: Prompt & Context Engineering
description: How to give a model the right instructions and the right information, and why context assembly matters more than clever wording.
tags: [ai, llm, prompting, context]
category: ai
status: draft
---

# Prompt & Context Engineering

::: details Q: What is the difference between prompt engineering and context engineering?
Prompt engineering is writing the instructions: role, task, constraints, output format. Context engineering is deciding **everything** that goes into the window on each call: system prompt, retrieved documents, tool definitions, tool results, conversation history, and memory. In production, most failures are context failures (the model never saw the right fact, or saw too many wrong ones), not wording failures. An FDE spends more time on "what does the model see at step 7 of this agent run?" than on adjectives.
:::

::: details Q: What does a good production prompt contain?
- **Who and why**: the situation and the user, so the model can make judgment calls you did not anticipate.
- **The task and success criteria**: what a good answer looks like, and what to do when the input is missing or ambiguous ("say you don't know", "ask one question").
- **Constraints**: scope, tone, what not to do, with the reason. Rules with reasons generalize; bare rules get applied too literally or ignored.
- **Examples**: 2 to 5 diverse examples, including an edge case. One example gets copied verbatim.
- **Output format**: a schema or structured output mode when a program reads it.

Put stable content first (cacheable), variable content last. Delimit inserted data clearly (XML-style tags work well) so the model can tell instructions from documents.
:::

::: details Q: Why do longer prompts sometimes make results worse?
Every instruction competes for attention. A 4-page system prompt grown by patching each bug report becomes contradictory ("be concise" in section 1, "always explain fully" in section 6) and the model resolves the conflict unpredictably. Irrelevant retrieved text is worse: the model may cite it. Fixes: prune instructions that no eval case depends on, retrieve fewer and better chunks, and move rarely needed guidance into tools or documents the model fetches on demand.
:::

::: details Q: How do you manage context in a long-running agent or chat?
Context grows with every turn and tool result, and quality drops before the window is full. Options, roughly in order of complexity:
1. **Trim tool output** at the source: return the 20 relevant rows, not the 5,000-row table.
2. **Compaction**: summarize older turns and keep recent ones verbatim.
3. **External memory**: write notes or state to a file or store, and reload only what the next step needs.
4. **Sub-agents**: delegate a search-heavy subtask to a fresh context and bring back only the conclusion.

Each one loses information somewhere. Compaction can drop the one detail that mattered, so log what was dropped and test long sessions explicitly.
:::

::: details Q: How do you know a prompt change is an improvement?
You do not, until you run it against an eval set. Prompt changes are code changes: version them, diff them, run the [regression suite](./eval-datasets) before shipping. A change that fixes the customer's reported case and silently breaks five others is the most common prompt regression. Keep the reported case as a new eval example so it stays fixed.
:::

::: details Q: What about prompt injection?
Any text the model reads (web pages, emails, PDFs, tool results) can contain instructions. You cannot prompt your way to immunity. Defend structurally: least-privilege tools, human confirmation for destructive or outbound actions, treat model output as untrusted input to downstream systems, and separate the agent that reads untrusted content from the one that holds sensitive permissions. Customers in regulated industries will ask about this in the first security review.
:::

## Related

- [Tokens, cost & latency](./tokens-cost-latency)
- [Tool use & MCP](./tool-use-mcp)
- [Building effective agents](./building-effective-agents)
