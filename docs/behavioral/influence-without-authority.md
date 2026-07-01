---
title: Influencing Without Authority
description: Show you can drive alignment and adoption across people and teams you don't manage — through data, relationships, and shared goals.
tags: [behavioral, leadership]
category: behavioral
status: draft
---

# Influencing Without Authority

**The question** — "Tell me about a time you influenced a decision or drove adoption without having direct authority."
Variants: "Describe a time you had to get buy-in from people you didn't manage.", "Tell me about a time you led through influence rather than position."

**What they're assessing** — Persuasion through data, prototypes, and shared goals rather than rank; building consensus across teams you don't control; patience and persistence in winning over skeptics; identifying champions and allies; measurable adoption or outcome as evidence it actually worked.

## STAR-L scaffold

Fill in your own story:

- **Situation —** Describe the cross-team or cross-functional context. What was the standard, tool, or practice you were trying to get adopted, and why didn't you have authority to mandate it?
- **Task —** What outcome did you need to achieve, and what were the obstacles — skepticism, competing priorities, existing habits, lack of visibility?
- **Action —** How did you build your case? Did you prototype or pilot first? Who were the champions you cultivated? How did you present data or early wins to shift opinions — use "I" and name specific behaviors (e.g., ran a workshop, shared benchmarks, paired with a skeptic to address concerns directly)?
- **Result —** What was the concrete adoption or business outcome? Quantify where possible (e.g., 4 out of 5 teams adopted the standard within 6 weeks, build time cut by 30%).
- **Learned —** What did this change about how you approach influence? What do you do differently now (e.g., involve skeptics early, lead with the problem not the solution)?

## Pitfalls / red flags

- Resorting to escalation or authority as the first move rather than a last resort — signals low trust in peer relationships.
- Describing a vague "talked to people" strategy with no concrete buy-in mechanism or champion network.
- No measurable adoption or outcome — says you pushed for something but can't show it landed.
- Steamrolling dissent rather than addressing it — interviewers look for genuine consensus, not compliance under pressure.

::: details Example — Getting teams to adopt a resilience standard (adapt to your own experience)
**Situation:** After a slow dependency froze our maintenance service, I realized several services made cross-service calls with no timeout or circuit breaker — any one slow dependency could cascade and take down healthy services. I was an individual contributor on one team with no authority over the others.

**Task:** I wanted the backend teams to converge on a shared resilience standard — timeouts plus circuit breakers on critical cross-service calls — before we scaled up to bigger sessions.

**Action:** I prototyped the pattern in my own service first and captured concrete before/after numbers: a simulated slow dependency that used to freeze the service now failed fast and stayed contained. I identified one engineer on each of the other teams who'd been burned by cascading failures and treated them as co-authors, inviting them to critique and improve the approach. I ran a short cross-team demo with the data, and when one team worried about migration effort, I offered to pair for a day to wire it in.

**Result:** The teams adopted the standard within a few weeks, and it was later formalized as an engineering guideline. Slow dependencies stopped being able to take down whole services.

**Learned:** Involving the loudest skeptics as co-authors early converts opposition into ownership. Now whenever I drive a cross-team standard, I make the two or three people who feel the pain most into collaborators before I write a line of the proposal.
:::
