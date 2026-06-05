---
title: OAuth 2.0
description: Delegated authorization framework — grant flows, PKCE, roles, and the pitfalls that lead to token theft.
tags: [concept, auth, oauth]
category: tech-concepts
status: draft
---

# OAuth 2.0

::: details Q: What problem does OAuth 2.0 solve, and what doesn't it solve?
OAuth 2.0 solves **delegated authorization**: it lets a third-party client access a user's resources on a resource server *without the user handing their password to the client*.

Classic example: a CI/CD app wants read access to your GitHub repos. Without OAuth, you'd give it your GitHub password — granting full account access forever. With OAuth, GitHub issues a scoped, time-limited access token; you can revoke it without changing your password.

**What OAuth 2.0 is NOT**: it is an authorization framework, not an authentication protocol. An access token tells you that a client has been *authorized* to access a resource; it tells you nothing about *who the user is*. Using an access token as proof of login is a known confused-deputy vulnerability. For authentication (identity), layer **OpenID Connect** on top of OAuth 2.0.

See also: [OpenID Connect](./openid-connect)
:::

::: details Q: What are the four OAuth 2.0 roles?
| Role | Responsibility |
|---|---|
| **Resource Owner** | The user who owns the data and grants access |
| **Client** | The application requesting access on behalf of the resource owner |
| **Authorization Server (AS)** | Issues tokens after authenticating the resource owner and obtaining consent |
| **Resource Server (RS)** | Hosts the protected resources; validates access tokens on each request |

The AS and RS can be the same service (common in first-party setups) or separate (common in large federated systems where one AS serves multiple APIs). Understanding these roles clarifies why token validation happens at the RS, not the client.
:::

::: details Q: Which OAuth 2.0 grant flows exist and when should each be used?
**Authorization Code + PKCE** — the modern default for all user-facing clients (web apps, SPAs, mobile). The user is redirected to the AS, authenticates, and the AS returns an *authorization code*. The client exchanges the code for tokens at a back-channel token endpoint. PKCE (see below) is now required even for confidential clients.

**Client Credentials** — for machine-to-machine (service-to-service) flows with no user involved. The client authenticates with its own credentials (`client_id` + `client_secret`) directly at the token endpoint. There is no resource owner — the client is acting on its own behalf.

**Refresh Token** — not a standalone grant flow; used alongside Authorization Code to silently obtain new access tokens without re-prompting the user.

**Deprecated — do not use**:
- **Implicit flow**: returned the access token directly in the URL fragment (visible in browser history, referrer headers, server logs). Deprecated in OAuth 2.1.
- **Resource Owner Password Credentials (ROPC)**: the client collects the user's password and sends it to the AS. Defeats the purpose of OAuth (the client *is* the password holder), prevents MFA, and is deprecated. Only acceptable for migrating legacy systems with no redirect capability.
:::

::: details Q: What is PKCE and why is it required?
**PKCE** (Proof Key for Code Exchange, RFC 7636) defeats the *authorization code interception* attack:

1. The client generates a random `code_verifier` (≥43 chars, high entropy).
2. It computes `code_challenge = BASE64URL(SHA256(code_verifier))`.
3. It includes `code_challenge` and `code_challenge_method=S256` in the authorization request.
4. The AS stores the challenge against the authorization code it issues.
5. On the token exchange, the client sends `code_verifier`; the AS hashes it and compares — if it doesn't match, the code is rejected.

Without PKCE, a malicious app on the same device (sharing a custom URL scheme) can intercept the authorization code redirect and exchange it for tokens. With PKCE, the interceptor has no `code_verifier` and cannot complete the exchange.

**Why even for confidential clients?** The original spec restricted PKCE to public clients (SPAs, mobile). OAuth 2.1 requires it universally — a confidential client using PKCE defends in depth: even if the `client_secret` leaks, the intercepted code is useless without the verifier.

```http
GET /authorize?
  response_type=code
  &client_id=abc
  &redirect_uri=https://app.example.com/callback
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
  &state=xyzABC123
```
:::

::: details Q: What are the most dangerous OAuth 2.0 pitfalls?
**Open redirect via `redirect_uri`**: If the AS allows prefix-matching or wildcard `redirect_uri` registration, an attacker can craft an authorization URL that redirects the code to their server. Fix: enforce *exact-match* `redirect_uri` validation on the AS; do not accept query-parameter or path variations.

**Missing `state` parameter (CSRF)**: Without `state`, an attacker can trick a victim's browser into starting an authorization flow that the attacker controls — binding the victim's session to the attacker's account (login CSRF). Fix: generate a random `state`, store it in the session, verify it on callback before exchanging the code.

**Token leakage via Referer header or logs**: If the access token appears in a URL (implicit flow) or error redirect, it's visible in server access logs and browser history. Use back-channel exchanges; keep tokens out of URLs.

**Scope over-provisioning**: Requesting maximum scopes "for convenience" increases the blast radius of a stolen token. Request only the minimum scopes required for the task at hand. Prompt the user for additional scopes incrementally as needed.

**Using OAuth for authentication without OIDC**: An access token proves authorization, not identity. An attacker can obtain a valid access token for your service and use it to impersonate any user if you skip identity verification. Add OpenID Connect's `id_token` for login flows.
:::

## Common follow-ups

- How does token introspection (RFC 7662) work and when would you use it over JWT self-validation?
- What is the difference between OAuth 2.0 and OAuth 2.1, and what did 2.1 remove?
- How do you handle token refresh in a SPA without exposing the refresh token to JavaScript?
- What is a pushed authorization request (PAR) and how does it harden the authorization endpoint?
