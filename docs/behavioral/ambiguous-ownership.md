---
title: Owned an Ambiguous Problem
description: Show bias for action, the ability to structure ambiguity, and ownership beyond your assigned lane.
tags: [behavioral, ownership]
category: behavioral
status: draft
---

# Owned an Ambiguous Problem

**The question** — "Tell me about a time you took ownership of a problem that wasn't clearly assigned to you."
Variants: "Describe a situation where you had to figure out what the right problem even was before solving it.", "Tell me about a time you stepped up when no one else did."

**What they're assessing** — Bias for action rather than waiting to be told; ability to structure ambiguity by defining the problem before jumping to solutions; willingness to take ownership beyond your assigned lane; comfort operating without clear direction.

## STAR-L scaffold

Fill in your own story:

- **Situation —** What was the unowned or poorly-defined problem? How did you discover it? Why was it falling through the cracks (unclear ownership, no one's priority, too ambiguous to start)?
- **Task —** Why did you decide to step in? What made it your responsibility — or why did you choose to make it your responsibility even when it wasn't?
- **Action —** How did you first *define* the problem before solving it? Who did you talk to? How did you scope what "done" meant? Then: what concrete steps did you take to drive it forward? Use "I" and name specific behaviors.
- **Result —** What outcome did you produce? Did ownership get clarified? Was the problem resolved? Quantify if possible (reliability improvement, hours saved, incidents prevented, team unblocked).
- **Learned —** What did this change about how you operate? What do you now watch for or do proactively?

## Pitfalls / red flags

- Waiting to be told what to do: framing the story as "I asked my manager and they said to own it" — that's assigned, not self-directed.
- Analysis paralysis: spending all your time mapping the problem without driving toward a decision or action.
- Scope confusion: not being able to articulate how you decided what was in scope vs. out of scope.
- "It wasn't my job" framing: even if you eventually acted, signaling resentment about stepping outside your lane is a red flag.

::: details Example (generic — replace with your own)
**Situation:** Our CI pipeline had a persistent flakiness problem — roughly 15-20% of runs failed on a specific integration test suite with no consistent error. It had been logged as a known issue for four months. Three different teams touched the relevant code and no one owned the test infrastructure formally.

**Task:** The flakiness was slowing down every team: engineers were re-running pipelines instead of investigating, and broken builds were masking real failures. No one was assigned to fix it, but I decided to take it on because the cost — in lost engineering time — was clearly high and I had some familiarity with the test framework.

**Action:** I first spent two days characterizing the problem before touching any code: I scraped four weeks of CI logs, tagged each failure by error type, and found that 80% of flakes traced to a single external service client that wasn't being properly reset between tests. I defined a narrow scope: fix the reset logic, add retry-with-jitter for the flaky service calls, and add a flakiness-detection job to the pipeline. I shared my diagnosis in a Slack thread, got a quick thumbs-up from the three affected teams, and opened a PR within a week.

**Result:** Flakiness dropped from ~18% to under 2% within two weeks of merging. The new flakiness-detection job caught two regressions in the following month before they merged. Engineers on all three teams stopped treating re-runs as routine.

**Learned:** I learned that unowned problems usually stay unowned not because no one cares, but because it's unclear where to start. Spending time explicitly diagnosing and scoping the problem — before writing a line of code — is what made it tractable. I now look for high-cost unowned problems as a regular habit, not just when something is bothering me personally.
:::
