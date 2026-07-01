---
title: Disagreed with Your Manager
description: Show respectful, data-backed pushback and the ability to disagree and commit.
tags: [behavioral, communication]
category: behavioral
status: draft
---

# Disagreed with Your Manager

**The question** — "Tell me about a time you disagreed with your manager."
Variants: "Describe a time you pushed back on a decision from leadership.", "Have you ever had to challenge your manager's direction?"

**What they're assessing** — Ability to push back respectfully and backed by data rather than just opinion; "disagree and commit" — can you advocate strongly, accept a final decision gracefully, and still execute with full effort? Knowing when to escalate vs. defer; the maturity to separate your opinion from your commitment.

## STAR-L scaffold

Fill in your own story:

- **Situation —** What was the decision or direction your manager took? What were the stakes and the timeline?
- **Task —** What was your role, and why did you feel the decision warranted pushback?
- **Action —** How did you raise your concern? What data, reasoning, or alternatives did you bring? Did you go up the chain, or resolve it 1:1? What was the decision, and how did you respond to it? Use "I" throughout.
- **Result —** What happened? If you were overruled, did you commit and deliver anyway? If you changed the outcome, what was the measurable impact?
- **Learned —** What did you take away about when and how to push back effectively? What would you do the same or differently?

## Pitfalls / red flags

- Coming across as insubordinate — the story should show professional disagreement, not defiance.
- Never disagreeing (pushover framing) — "I always defer to my manager" signals no backbone.
- Refusing to commit after the decision was made — "disagree and drag" is a red flag.
- Opinion with no data — "I just felt it was wrong" is not a good push-back story.

::: details Example — Pushing to load-test the claim rush before launch (adapt to your own experience)
**Situation:** My manager wanted to ship the reward-claim feature in two weeks to hit a streamer's scheduled launch. Given the risk — a whole audience claiming at once against a fixed-balance vault — I believed we needed load testing and a reconciliation safety net first, which pushed it closer to four weeks.

**Task:** I owned the claim delivery and its reliability. I had to either accept the timeline or make a compelling case for changing it.

**Action:** Instead of "that's not enough time," I wrote a short breakdown: the claim-rush traffic shape, what could fail (vault over-draw, double-claims, service overload), and two options — ship a descoped MVP in two weeks with a hard cap on concurrent claims, or take four weeks for the full flow with k6 load-test gating. I shared it in a 1:1 and proposed both. He kept the two-week date because the launch was strategic, so I refocused the team on the safe MVP and got the load testing in right after.

**Result:** We shipped a capped MVP in 13 days that held up on stream, then added full k6 gating and reconciliation three weeks later. No claim incident during the launch.

**Learned:** Framing pushback as "here are the options and their tradeoffs" beats "that's not possible" — the manager has context I don't. I now bring data and at least one alternative, and once the call is final I commit fully, because half-hearted execution is worse than the original disagreement.
:::
