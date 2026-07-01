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

::: details Example — A silent logging issue that took down the claim service (adapt to your own experience)
**Situation:** During a live streamed session, the claim service started returning 503s the moment the game ended and the audience rushed to claim. An alert fired — but oddly, our logs and dashboards had gone quiet, showing almost nothing right when we needed them most.

**Task:** I was the on-call engineer and took the lead on the incident — with the streamer live, every minute was visible.

**Action:** Mitigation first, not diagnosis. Since the logs themselves had gone silent, I treated the silence as the clue and checked the host directly — the disk was full. Under the claim rush we were writing a verbose log line for every claim, synchronously; the volume filled the disk and saturated I/O, which blocked request threads and caused the 503s. And because the disk was full, the service could no longer write logs — so the very problem hid itself, which is why the dashboards looked empty. I freed space and dropped logging to async at a reduced level to restore service, then posted a stakeholder update ("service recovering, funds are safe") on a 15-minute cadence.

**Result:** Failures stopped within minutes and claims settled normally. Postmortem action items: move hot-path logging to async and sample it, add a disk-space and log-volume alert (we'd only had an error-rate alert), and add log rotation with sane retention. All three shipped within a week.

**Learned:** During an active incident my job is to stop user impact fast, not to understand why — root cause belongs after the bleeding stops. The sharper lesson: when your logs go silent under load, the *absence* of signal is itself the signal. Logging on a hot path is a real dependency with real cost, and monitoring that can't survive the incident it's meant to catch is a gap worth closing.
:::
