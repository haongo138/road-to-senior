---
title: Hardest Technical Problem
description: Show technical depth, structured problem-solving under ambiguity, persistence, and measurable impact.
tags: [behavioral, technical]
category: behavioral
status: draft
---

# Hardest Technical Problem

**The question** — "What's the hardest technical problem you've ever solved?"
Variants: "Tell me about a technically challenging situation you faced.", "Describe a time you had to solve a complex engineering problem."

**What they're assessing** — Technical depth and command of the domain; structured, hypothesis-driven problem-solving under ambiguity; persistence when the path isn't obvious; clear personal ownership and a measurable impact.

## STAR-L scaffold

Fill in your own story:

- **Situation —** What system, service, or codebase was involved? What went wrong or what constraint made the problem hard? Set enough technical context that a peer engineer understands the stakes.
- **Task —** What specifically were you responsible for solving? Was there a deadline or production impact?
- **Action —** Walk through your approach step by step: How did you form hypotheses? What tools or techniques did you use to isolate the problem? What dead ends did you hit and how did you pivot? Use "I" and be specific about the technical moves (e.g., "I added distributed tracing and found the spike was in serialization, not the DB query").
- **Result —** What was the measurable outcome? (latency, error rate, uptime, throughput, cost — put numbers on it.)
- **Learned —** What mental model, debugging approach, or engineering practice did you acquire? How do you apply it now?

## Pitfalls / red flags

- Drowning in jargon without explaining why the problem was genuinely hard.
- Unclear personal role — "the team eventually figured it out" with no "I" actions.
- Choosing a problem that isn't actually hard (a simple config fix or a bug found in 10 minutes).
- No measurable outcome — "it worked better afterwards."
- Skipping the *how* — narrating the fix without showing the investigative reasoning.

::: details Example 1 — Caching strategy for a crypto charting indexer
**Situation:** I built the indexer behind our candlestick charts. It read raw trades from a stream and served OHLCV candles at several resolutions (1m, 5m, 1h, 1d) for hundreds of pairs. Charts were our most-hit endpoint, and rebuilding candles from raw trades on every request pushed the database to 100% CPU and made charts take 3–5s to load.

**Task:** I owned making charts fast while keeping the data correct as new trades kept arriving — the newest candle keeps changing, but older candles never do.

**Action:** I built on that one fact: old candles are frozen, only the current one moves. I pre-computed and stored closed candles, and built higher resolutions by rolling up lower ones instead of re-scanning raw trades. I cached with a key of `(pair, resolution, bucket)` in two tiers: closed candles cached forever (they never change), and the single open candle cached briefly and updated as trades came in. That meant only one key per chart was ever "hot," so I didn't need complex invalidation. I load-tested with replayed production traffic before rolling out.

**Result:** p95 chart load went from ~3.5s to under 120ms, and database CPU on charts dropped ~90%. Cache hit rate on history was over 99%, and adding a new resolution was cheap because it rolled up from existing ones.

**Learned:** The win came from separating data that never changes from the small part that does — that turned a hard caching problem into an easy one. I reach for that split whenever I cache time-series or append-only data.
:::

::: details Example 2 — Retry patterns for crypto tipping via Discord slash commands
**Situation:** Users could tip and send crypto to each other with Discord slash commands. That's real money over a shaky path: Discord drops the interaction if you don't reply within 3 seconds and the client may retry, our link to the chain node was flaky, and impatient users would run `/tip` twice. Done naively, that could send funds twice.

**Task:** I owned the transfer flow and had to make sure a tip ran **exactly once** — even with retries, timeouts, and partial failures — while still replying inside Discord's 3-second limit.

**Action:** I made the whole flow idempotent. First I sent Discord a "processing…" ack right away to beat the 3-second limit. Then I saved the transfer under an idempotency key built from `(interaction_id, sender, recipient, amount)`. The actual money movement ran as a separate step guarded by that key: a retry matched the existing record and returned the original result instead of paying again. For the chain call I retried with backoff and jitter, but only on retryable errors like timeouts — never on a real rejection like insufficient funds. Anything still failing stayed `pending`, and a reconciliation job could safely finish it later because every step was keyed.

**Result:** Double-sends went to zero. Transfers survived Discord retries and node blips on their own, and the reconciliation job cleared stuck `pending` rows automatically. Users saw a quick "processing…" instead of a timeout error.

**Learned:** Retries are only safe once the operation is idempotent — the key is the real fix, backoff is just good manners. I now design any money-moving call as "ack fast, key the work, retry only what's safe to retry."
:::

::: details Example 3 — Keeping on-chain and off-chain data consistent for token reward claims
**Situation:** I worked on a blockchain game a Twitter streamer could run live for their audience — many viewers join a session, play, and after it ends each winner claims a token reward. Rewards were paid from a single vault with a **fixed** balance, so all claims for a session had to fit inside what the vault held — we could never pay out more than was funded. Players were off-chain accounts, but claims happened on-chain, so we mapped each player to their wallet address and stored a claim log in Postgres keyed by that address. The hard part was two sources of truth: the real balance lived on-chain in the vault, but we tracked eligibility and the claim log in Postgres. A claim touched both — write the log in the DB *and* move tokens on-chain — and those two writes couldn't be wrapped in one transaction. If the chain call succeeded but the DB write failed (or the reverse), they disagreed: a player double-claimed, or the log showed a payout that never left the vault.

**Task:** I owned the claim flow and had to keep the DB claim log and the on-chain vault in agreement — no double-claims, no draining the fixed vault past its balance — despite failed transactions, retries, and a whole audience hitting claim at the same moment when a session ended.

**Action:** I stopped treating the DB and the chain as equal writers and made the chain the source of truth. A claim first wrote a `pending` row in the claim log under an idempotency key `(session_id, wallet_address)`, then submitted the on-chain transaction against the vault. I never marked the claim `settled` on submit — only when an indexer confirmed the transaction was finalized on-chain, matching it back to the pending row by that key. If a claim failed mid-flight it stayed `pending`, and a reconciliation job re-checked the chain and settled or released it, so no reward was credited twice or lost. To stop double-claims from the same wallet I made the state change conditional — `UPDATE claims SET status = 'pending' WHERE session_id = :s AND wallet_address = :w AND status = 'unclaimed'` — so only the first request per wallet per session proceeded. And because the vault was fixed-balance, I checked the session's remaining allocation before submitting, so concurrent claims couldn't collectively over-draw it.

**Result:** DB and on-chain state stopped drifting — a reconciliation check that used to surface mismatches came back clean. Double-claims dropped to zero, the vault never paid out more than it held, and claims survived failed transactions and retries without manual fixes. Even with a full audience claiming at once, each player got a fast "claim submitted" response while the chain confirmed in the background.

**Learned:** You can't wrap a database write and a blockchain call in one transaction, so I picked one source of truth (the chain), made the DB catch up to it, and used idempotency keys plus a reconciliation job to close the gap. I now design any cross-system write as "one source of truth + confirm asynchronously + reconcile," never a two-place write I pretend is atomic. See also [delivery semantics](/technical/concepts/delivery-semantics) and [eventual consistency](/technical/concepts/eventual-consistency).
:::

::: details Example 4 — Load testing the claim rush with k6 in CI
**Situation:** In the same streaming game, the traffic shape was brutal: a session could sit quiet for ten minutes, then the moment it ended a whole audience hit "claim" in the same few seconds. That spike is exactly when the claim flow — DB writes, the vault allocation check, and on-chain submits — was most likely to fall over, and we only found out about it during a live stream, which was the worst possible time.

**Task:** I owned making sure a claim rush was tested *before* it reached production, so a big session couldn't take the game down in front of a live audience.

**Action:** I wrote load tests in k6 that modeled the real pattern instead of steady traffic — a ramp that stayed flat, then a sharp burst of hundreds of concurrent claims to mimic a session ending. Each virtual user claimed with a distinct wallet so I was exercising the real per-wallet paths, not one hot row. I set thresholds on the results — p95 latency and error rate had to stay under agreed limits — so the test *failed* on its own if we regressed, rather than needing someone to eyeball a graph. Then I wired it into our GitHub Actions pipeline: the k6 run went against an ephemeral test environment on every pull request that touched the claim path, and a breached threshold failed the check and blocked the merge.

**Result:** We caught two regressions in CI before they shipped — one where the vault allocation check serialized claims under load, and one connection-pool limit that fell over past a few hundred concurrent users. Because the k6 thresholds gated merges, performance stopped being something we hoped about and became a pass/fail check. When real sessions ended, the claim rush held up.

**Learned:** Load tests are only useful if they model the real traffic shape — a steady ramp would have missed the exact burst that hurt us. And putting the test in CI with hard thresholds is what makes it stick; a benchmark nobody runs rots. I now write load tests around the worst realistic spike and gate the pipeline on them. See also [rate limiter](/system-design/rate-limiter).
:::

::: details Example 5 — A circuit breaker to stop cascading failures in a maintenance service
**Situation:** I built a maintenance service in our microservice system — it ran background jobs that called out to many other services to sync state, run cleanups, and check health. One day a single downstream service got slow (not down, just slow — responses crawled from 50ms to 20s). Our maintenance workers kept calling it and blocking on those slow responses, so they piled up waiting instead of finishing. Within minutes every worker was stuck on that one dependency, the whole maintenance service stopped doing its other jobs, and the backpressure started spreading to callers upstream. One slow service was taking down a chain of healthy ones.

**Task:** I owned making the maintenance service resilient — one sick dependency should degrade just the work that needs it, not freeze the entire service.

**Action:** I wrapped the calls to each downstream service in a circuit breaker. It tracked the recent failure and timeout rate per dependency, and once that crossed a threshold it "opened" — for a cooldown window, calls to that dependency failed fast instead of blocking a worker for 20 seconds. After the cooldown it went "half-open" and let a few trial calls through; if they succeeded it closed and resumed normal traffic, if not it stayed open. I paired it with tight timeouts (so no single call could hang a worker) and a fallback path so jobs that didn't strictly need that dependency could still finish. I made the thresholds and cooldowns configurable so we could tune them per dependency instead of guessing once.

**Result:** A slow dependency stopped being able to freeze the service — workers failed fast on the broken path and kept doing everything else. The blast radius shrank from "whole maintenance service down" to "one type of job delayed," and the service recovered on its own once the dependency healed, with no manual restart. We also got clear signals — an open breaker was a precise alert about *which* dependency was unhealthy.

**Learned:** In a microservice system, calling a dependency directly means inheriting its failures; a circuit breaker turns a slow, cascading failure into a fast, contained one. Timeouts, fail-fast, and a recovery probe together are what keep one bad service from taking down the rest. I now put a breaker (plus a real timeout) on any cross-service call on a critical path.
:::
