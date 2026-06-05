---
title: Production Incident / Outage
description: Demonstrate calm under pressure, mitigation-first thinking, clear communication, and blameless follow-through.
tags: [behavioral, ownership]
category: behavioral
status: draft
---

# Production Incident / Outage

**The question** — "Tell me about a time you dealt with a production incident or outage."
Variants: "Describe a time a system you owned went down — what did you do?", "Tell me about a production problem you had to solve under pressure."

**What they're assessing** — Composure and systematic thinking under pressure; mitigation-first instinct (stop the bleeding before root-causing); clear, timely communication to stakeholders and users during the incident; blameless follow-up and concrete prevention afterward.

## STAR-L scaffold

Fill in your own story:

- **Situation —** What system went down or degraded? How was it detected — alert, user report, you noticed it? What was the business impact (users affected, revenue risk, SLA breach)?
- **Task —** What was your role in the response? Were you on-call, the lead engineer, or did you join an ongoing response?
- **Action —** Walk through the response in order. First: what did you do to *mitigate* (roll back, feature-flag off, failover, shed load) before you knew the root cause? Then: how did you communicate to stakeholders during the incident, and at what cadence? Then: once mitigated, how did you root-cause? Use "I" and name specific, ordered steps.
- **Result —** How long did the incident last? What was the measured impact? How quickly did you mitigate vs. fully resolve? What was the outcome of the postmortem — what prevention was put in place?
- **Learned —** What changed in how you build, monitor, or respond? What specific guardrail, alert, test, or runbook now exists because of this incident?

## Pitfalls / red flags

- Blaming a person: incidents are system failures; interviewers want blameless thinking even when someone made a mistake.
- Conflating mitigation with root-cause: jumping straight to root-causing while users are still affected is a significant red flag.
- No communication to stakeholders during the incident: silence is never the right answer when production is down.
- No postmortem or prevention: "we fixed it and moved on" signals the same incident will happen again.

::: details Example (generic — replace with your own)
**Situation:** On a Tuesday afternoon, our primary API started returning 503s. An automated alert fired and customer support began receiving tickets within minutes. The service handled order processing for a retail client and roughly 2,000 requests per minute were failing.

**Task:** I was the on-call engineer. I joined the incident channel and took the lead on response.

**Action:** My first move was mitigation, not diagnosis. I checked the recent deploy history — there had been a deploy 40 minutes earlier — and rolled it back immediately without waiting to confirm it was the cause. Within three minutes of rollback the error rate dropped to zero. Only then did I post an update to the stakeholder channel: "Service restored, rollback applied, investigating root cause." I set a 15-minute cadence for updates. Root-cause analysis showed the deploy had introduced a missing database index on a query that runs on every request — fine in staging with small data, catastrophic at production load. I wrote a postmortem that afternoon: blameless, five contributing factors, three action items.

**Result:** The outage lasted nine minutes. The rollback resolved the customer impact. The postmortem action items were: add a query-performance check to CI that runs against a production-size snapshot, add a p99 latency alert (we had only an error-rate alert), and add the missing index as a follow-up migration. All three shipped within one week.

**Learned:** I internalized the mitigation-first principle: my job during an active incident is to stop user impact as fast as possible, not to understand why it happened. Root-cause is important but it belongs after the bleeding stops. I also learned that deploy history is always the first thing to check — the correlation between a recent deploy and a new problem is strong enough that rollback-first is almost always the right opening move.
:::
