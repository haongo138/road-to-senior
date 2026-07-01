---
title: A Failure or Mistake
description: Demonstrate genuine accountability, self-awareness, and the kind of learning that prevents recurrence.
tags: [behavioral, ownership]
category: behavioral
status: draft
---

# A Failure or Mistake

**The question** — "Tell me about a time you failed or made a significant mistake."
Variants: "What's your biggest professional mistake?", "Describe a time something went wrong that was your fault."

**What they're assessing** — Genuine accountability and ownership without deflecting blame; honest self-awareness about what went wrong and why; a real, specific lesson — not a platitude; evidence that the learning changed behavior so it can't recur.

## STAR-L scaffold

Fill in your own story:

- **Situation —** What was the project, system, or context? What were the stakes?
- **Task —** What were you responsible for, and what decision or action created the failure?
- **Action —** What happened as a result of your mistake? What did you do immediately to contain the damage? Be honest — this is where interviewers judge your ownership instinct.
- **Result —** What was the actual impact (downtime, lost data, user complaints, cost)? Then what did you do to fix it and prevent recurrence?
- **Learned —** What specific belief or habit changed? What process, guardrail, or practice did you put in place because of this? Be concrete — "I now always X before Y."

## Pitfalls / red flags

- The fake failure: "I work too hard" or "I care too much" — interviewers see this immediately.
- Blaming tools, unclear requirements, or other people — even if true, own your part first.
- No real lesson: "I learned to be more careful" is not a lesson.
- Downplaying the impact to make yourself look better — honest acknowledgment of real impact is more impressive.

::: details Example — Shipping the claim flow without idempotency (adapt to your own experience)
**Situation:** I shipped the first version of the reward-claim flow for our blockchain game. It did a plain read-check-write on the vault allocation and marked claims settled on submit. I'd tested it, but never against a real claim rush.

**Task:** I owned the claim flow. I'd validated it with a handful of test users, not with a live audience claiming at the same instant.

**Action:** During the first big streamed session, hundreds of viewers claimed in the same few seconds. Concurrent claims read the same balance and a few players double-claimed, drawing the vault down wrong. I caught it from the mismatch alert, paused claims immediately, and posted an incident update within minutes. I reconciled against on-chain state to find exactly who was affected and corrected the ledger.

**Result:** A handful of double-payouts, contained within about 15 minutes and fixed by reconciliation. In the postmortem I drove three changes: idempotency keys per `(session_id, wallet_address)`, an atomic conditional update for the vault deduction, and a k6 load test of the claim rush gated in CI.

**Learned:** Testing with a few users is not testing a thundering herd — they're qualitatively different. I now rehearse the worst realistic concurrency before shipping anything that moves balances, and I no longer accept "it worked with test users" for a money path.
:::
