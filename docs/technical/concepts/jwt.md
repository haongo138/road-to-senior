---
title: JSON Web Tokens (JWT)
description: Structure, signing vs encryption, validation steps, revocation problem, and the attacks that break JWT implementations.
tags: [concept, auth, jwt]
category: tech-concepts
status: draft
---

# JSON Web Tokens (JWT)

::: details Q: What is the structure of a JWT?
A JWT is three base64url-encoded segments joined by dots: `header.payload.signature`.

```text
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9   ← header
.eyJzdWIiOiJ1MTIzIiwiZXhwIjoxNzAwMDAwMH0  ← payload (claims)
.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQ  ← signature
```

**Header**: `alg` (signing algorithm), `typ: "JWT"`, optionally `kid` (key ID for JWKS lookup).

**Payload**: JSON claims — registered (`iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`) plus application-defined claims.

**Registered claim cheatsheet**:
| Claim | Meaning |
|---|---|
| `iss` | Issuer — who created the token |
| `sub` | Subject — who the token is about (user ID) |
| `aud` | Audience — who may consume it |
| `exp` | Expiry (Unix seconds) |
| `nbf` | Not-before — token invalid before this time |
| `jti` | JWT ID — unique ID for replay prevention |

Base64url is *encoding*, not encryption — anyone with the token can read the payload. This is JWS (JSON Web Signature): the signature proves integrity and authenticity, not confidentiality.
:::

::: details Q: Signed ≠ encrypted. When does that matter?
**JWS** (the default "JWT"): the payload is readable by anyone; only the signature is secret-dependent. Never put passwords, PII, or secrets in a standard JWT payload — they are visible to the token holder and any proxy that logs the token.

**JWE** (JSON Web Encryption): the entire payload is encrypted; the recipient must have the decryption key to read it. Use JWE when the payload must be confidential, for example if the token passes through untrusted intermediaries or is stored in a context where the user must not read it (e.g., opaque server-side data).

In practice, most teams use JWS and keep sensitive data out of the token: store a `userId` or `sessionId` and look up anything sensitive server-side. This also limits the blast radius if a token is leaked — the payload leaks an identifier, not the sensitive data itself.
:::

::: details Q: What are the correct JWT validation steps?
Skip any step and you open an attack surface:

1. **Parse** the token and verify it is well-formed (three segments).
2. **Select the verification key**: use the `kid` header claim to look up the right key from a JWKS endpoint, or use a static secret. Never select the key based on the token's own `alg` claim — pin the expected algorithm in your verifier.
3. **Verify the signature** with the pinned algorithm. Reject if invalid.
4. **Check `exp`**: reject if `now >= exp`. Allow a small clock skew (≤60 s).
5. **Check `nbf`** if present: reject if `now < nbf`.
6. **Check `iss`**: reject if it doesn't match the expected issuer.
7. **Check `aud`**: reject if your service's identifier is not in the audience. This prevents a token issued for service A from being replayed against service B.

Use a well-maintained library (e.g., `jose`, `jsonwebtoken` for Node; `PyJWT` for Python). Don't implement JWT parsing by hand — the edge cases are where vulnerabilities live.
:::

::: details Q: What are the most dangerous JWT attacks?
**`alg: none` attack**: Some early libraries accepted `alg: "none"` and skipped signature verification. An attacker strips the signature and sets `alg: none` to forge arbitrary tokens. Fix: reject tokens with `alg: none`; pin allowed algorithms in your verifier.

**RS256 → HS256 algorithm confusion**: An asymmetric RS256 token has its public key distributed openly. If the server accepts HS256, an attacker changes `alg` to `HS256` and signs with the *public key* as the HMAC secret — producing a signature the server will verify, because it uses the public key as the HMAC key. Fix: pin the algorithm; never derive the verification key from the token header.

**Weak HS256 secrets**: HMAC-SHA256 JWTs can be brute-forced offline if the secret is short. Use ≥256 bits of entropy (32+ random bytes). Prefer RS256/ES256 for public systems — the private key never leaves the server.

**Missing `aud`/`iss` checks**: A token issued for `api.example.com` can be replayed against `admin.example.com` if neither validates `aud`. Always validate both claims.

**Oversized tokens**: JWTs travel in every request header/cookie. A fat payload (e.g., full role list, org memberships) can hit header-size limits (8 KB in many proxies) and degrades every request. Keep payloads minimal; move bulk data to server-side lookup.
:::

::: details Q: Why is revocation hard with JWTs, and what are the trade-offs?
JWTs are stateless by design — the server validates the signature and claims without consulting a database. This scales well (no per-request DB lookup) but means you *cannot* invalidate a token before `exp` without adding server state.

**Options, with costs**:

| Approach | Revocation latency | Server state required |
|---|---|---|
| Short-lived access token (5–15 min) + refresh token | Up to `exp` | Refresh token store only |
| Token denylist (`jti` → revoked) | Immediate | Denylist in Redis/DB |
| OAuth introspection endpoint | Immediate | Token store on auth server |
| Server-side session (opaque token) | Immediate | Full session store |

The common production pattern: **short-lived access tokens** (5–15 min) reduce the revocation window to acceptable; **refresh tokens** are long-lived but stored server-side and revocable immediately. A denylist adds immediate revocation but requires a lookup on every request — you've reintroduced server state, partially defeating the stateless benefit.

Choose based on your threat model: a healthcare app may require immediate revocation (denylist/introspection); a low-sensitivity public API may accept 15-minute windows with refresh tokens.

See also: [Access & Refresh Tokens](./access-refresh-tokens)
:::

## Common follow-ups

- How does key rotation work with JWKS, and what happens to tokens signed with the old key?
- What is the `jti` claim used for, and how does it enable per-token revocation?
- When would you choose ES256 (ECDSA) over RS256 (RSA), and why?
- How do you safely store a JWT in a browser — cookie vs localStorage vs in-memory?
