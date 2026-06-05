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

::: details Example (generic — replace with your own)
**Situation:** I was deploying a schema migration to a production database during a low-traffic window. The migration added a non-nullable column with a default value.

**Task:** I owned the migration plan and execution. I had tested it in staging but hadn't run it against a production-sized dataset.

**Action:** The migration locked the table for nine minutes — far longer than the 30-second estimate from staging — causing an outage for a key customer-facing endpoint. I immediately rolled back, communicated to the team, and posted an incident channel update within five minutes.

**Result:** The outage lasted 11 minutes and affected roughly 3,000 users. We restored service by rolling back the deploy. I then wrote a post-mortem, identified three process gaps, and drove two changes: we added an explicit migration-duration test on a production-cloned dataset in CI, and we adopted an online schema change tool for all future table alterations.

**Learned:** I learned that testing at staging scale is not testing at production scale — they are qualitatively different. I now require every migration to be rehearsed on a production-size snapshot before scheduling a production window, and I no longer accept "it worked in staging" as sufficient evidence for anything touching large tables.
:::
