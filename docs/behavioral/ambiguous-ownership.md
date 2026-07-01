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

::: details Example — Reconciliation mismatches nobody owned (adapt to your own experience)
**Situation:** In our blockchain game, the Postgres claim log and the on-chain vault would occasionally disagree — a claim marked settled with no matching on-chain payout, or the reverse. It had been a known issue for weeks. It sat between two teams: the game backend owned Postgres, the contracts/indexer team owned the chain, and nobody formally owned the seam between them.

**Task:** The mismatches eroded trust in our numbers and forced manual checks after every big session. No one was assigned, but the cost was high and I understood both sides, so I took it on.

**Action:** I spent two days characterizing the problem before touching code: I pulled weeks of claim logs and on-chain events, tagged each mismatch by type, and found ~80% traced to claims we marked settled on submit rather than on confirmation. I scoped the fix narrowly — mark settled only when the indexer confirms, add a reconciliation job, and add a mismatch alert. I shared the diagnosis in a thread, got a quick thumbs-up from both teams, and opened a PR within a week.

**Result:** Mismatches dropped to near zero, the reconciliation job settled stragglers automatically, and the alert turned silent drift into a precise signal. Both teams stopped doing manual post-session checks.

**Learned:** Unowned problems stay unowned because it's unclear where to start, not because no one cares. Diagnosing and scoping *before* writing code is what made it tractable. I now watch for high-cost unowned problems at the seams between teams as a habit.
:::
