---
title: Access & Refresh Tokens
description: Why two tokens, lifetime trade-offs, refresh rotation with reuse detection, and the XSS vs CSRF browser storage dilemma.
tags: [concept, auth, tokens]
category: tech-concepts
status: draft
---

# Access & Refresh Tokens

::: details Q: Why use two tokens instead of one long-lived token?
A single long-lived token is a liability: if stolen, the attacker has long-term access and you can't revoke it without server-side state (which defeats stateless JWT scaling).

The two-token pattern separates concerns:

| Token | Lifetime | Sent to | Revocable |
|---|---|---|---|
| **Access token** | Short (5–15 min) | Every API request | Usually not (stateless) |
| **Refresh token** | Long (days–weeks) | Only the token endpoint | Yes (stored server-side) |

The **access token** is the blast-radius limiter: even if intercepted (e.g., from a request log), it expires quickly. The **refresh token** is the durable credential; it never travels to the resource server — only to the authorization server's `/token` endpoint.

This design gives you: stateless API validation (no DB per request) + practical revocation (invalidate the refresh token, and the user will be logged out within one access token TTL).

See also: [JWT](./jwt) for the stateless/revocation trade-off in detail.
:::

::: details Q: What are the lifetime trade-offs for each token?
**Access token TTL**:
- **Shorter (1–5 min)**: smaller theft window; more network round-trips to refresh; negligible for background services, noticeable for interactive apps.
- **Longer (1–24 h)**: fewer refreshes; a stolen token is valid longer. Acceptable when combined with HTTPS-only transport and a low-sensitivity resource.

**Refresh token TTL**:
- **Shorter (1–7 days)**: user re-authenticates more often; smaller theft window.
- **Longer (30–90 days)**: "remember me" UX; if stolen, the attacker has long-term access until rotation detects reuse.
- **Sliding expiry**: refresh on each use, extending the window. Convenient for active users; idle sessions expire naturally.

Rule of thumb: match TTL to the sensitivity of the resource. A banking app may use 5-min access / 1-day refresh; a dev tool may use 1-h access / 90-day refresh. There is no universal correct value — document the rationale in your threat model.
:::

::: details Q: What is refresh token rotation and why does reuse detection matter?
**Rotation**: on every successful token refresh, issue a *new* refresh token and invalidate the old one. The client stores only the latest token.

**Reuse detection** (RFC 6819 §4.3): if a previously-used (already-rotated-away) refresh token is presented, it is a strong signal that the token family was stolen:
- The legitimate client used the token → got RT2 → the old RT1 was invalidated.
- If the attacker later presents RT1, the server sees a replay of an invalidated token.

Response: **revoke the entire token family** (all refresh tokens in this lineage) immediately. This logs out both the legitimate user and the attacker. The legitimate user is inconvenienced (must re-authenticate); the attacker loses their foothold.

```
Issue RT1 → Client uses RT1 → Server issues RT2, invalidates RT1
Attacker replays RT1 → Server detects replay → Revoke RT2 also → Full family revoked
```

Without reuse detection, rotation alone doesn't help: the attacker can keep refreshing with the stolen token as long as they act before the legitimate client does.
:::

::: details Q: Where should tokens be stored in a browser, and what are the trade-offs?
This is a security trade-off with no universally correct answer — it depends on your threat model.

**`localStorage` / `sessionStorage`**:
- Accessible via JavaScript → **readable by XSS**. Any script injection (your code, a CDN, an npm package) can steal the token silently.
- Not sent automatically → **immune to CSRF**.
- Easy to implement; works with SPAs.

**`httpOnly` + `Secure` + `SameSite=Strict/Lax` cookie**:
- Not accessible via JavaScript → **XSS-resistant** (the cookie exists but the attacker's script can't read it).
- Sent automatically by the browser → requires **CSRF defenses** (SameSite cookie attribute handles most cases; add a CSRF token for cross-site POST flows if `SameSite=Lax` isn't sufficient).
- Preferred for high-sensitivity apps.

**In-memory (JS variable)**:
- Not persisted → survives only the page lifetime; the user must re-authenticate on refresh unless a `httpOnly` cookie holds the refresh token as a silent re-auth mechanism.
- XSS can still steal it from memory during the session; it's not safer from an active XSS, only from persistent theft.

**Recommended pattern for SPAs**: store the refresh token in an `httpOnly` + `Secure` + `SameSite=Strict` cookie; keep the access token in memory only. The refresh cookie cannot be read by JS; the short-lived in-memory access token expires quickly if stolen.

Never store tokens in `localStorage` for high-value applications.
:::

::: details Q: How are refresh tokens revoked, and when must revocation be immediate?
Refresh tokens are server-side records: each token maps to a user, a client, a scope, an expiry, and a revocation flag. Revoking is a database write — set the revocation flag (or delete the record).

**Scenarios requiring immediate revocation**:
- User logs out (all tokens for that session/user).
- Password change (all tokens for the user — a changed password implies possible credential compromise).
- Account suspension / deletion.
- Reuse detection fires (revoke the token family).
- Scope downgrade (revoke and re-issue with reduced scopes).

**Access tokens cannot be immediately revoked** in a stateless JWT system (no server-side lookup). The only real options are:
1. Accept the access token TTL as the revocation latency (keep it short).
2. Add a per-request denylist check (`jti` lookup) — reintroduces server state on every request.
3. Use **OAuth introspection** (RFC 7662): the resource server calls the AS to validate each token — fully revocable but a network hop per request.

Match the approach to sensitivity: financial APIs might use introspection; most web apps accept a 5–15 min TTL window.
:::

## Common follow-ups

- How does the "silent refresh" pattern work in SPAs, and what are its failure modes?
- How do you implement refresh token rotation in a distributed system where multiple servers handle requests?
- What happens to outstanding access tokens after a user changes their password?
- How do `httpOnly` cookies interact with CORS, and what headers are required?
