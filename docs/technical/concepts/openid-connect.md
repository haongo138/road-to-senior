---
title: OpenID Connect (OIDC)
description: Authentication layer on top of OAuth 2.0 — id_token vs access_token, JWKS validation, and the confused-deputy attack.
tags: [concept, auth, oidc]
category: tech-concepts
status: draft
---

# OpenID Connect (OIDC)

::: details Q: What is OIDC and how does it extend OAuth 2.0?
**OIDC = OAuth 2.0 + an authentication layer**. OAuth 2.0 answers "is this client authorized to access resource Y?" OIDC additionally answers "who is the user?" by issuing an **id_token** alongside (or instead of) the access token.

Concretely, OIDC adds:
- The `openid` scope, which triggers id_token issuance.
- The **id_token** — a JWT that describes the authenticated user, intended for the *client*.
- The `/userinfo` endpoint — returns user profile claims; the client calls it with the access token.
- The `/.well-known/openid-configuration` discovery document — the IdP publishes its endpoints, supported scopes, algorithms, and JWKS URI here so clients can configure themselves automatically.

OAuth 2.0 alone cannot safely prove identity — it was not designed to. OIDC adds the missing primitives (id_token, nonce, standardized claims) that make federated login safe and interoperable.

See also: [OAuth 2.0](./oauth2), [JWT](./jwt)
:::

::: details Q: What is the difference between an id_token and an access_token?
This is one of the most commonly confused points in auth engineering:

| | id_token | access_token |
|---|---|---|
| **For** | The *client* — proves who logged in | The *resource server* — proves authorization |
| **Format** | Always a JWT (per spec) | JWT or opaque (implementation choice) |
| **Contains** | User identity claims (`sub`, `email`, `name`, `nonce`) | Scopes, permissions, sometimes user ID |
| **Validated by** | The client that initiated the login | The resource server on each API call |
| **Audience (`aud`)** | The client's `client_id` | The API/resource server identifier |

**The confused-deputy / token substitution attack**: if your API accepts an id_token as proof of authorization, an attacker who obtains any valid id_token for your IdP (e.g., by building their own app that uses the same IdP) can call your API. The `aud` claim is your defense: an id_token's `aud` is the issuing client's `client_id`, not your API. Always validate `aud` strictly.

Similarly, never use an access_token as proof of login on the client — it tells you what the bearer may access, not who they are.
:::

::: details Q: How does the Authorization Code flow work in OIDC?
```
1. Client redirects user to AS with scope=openid (+ profile, email, etc.)
   Include `nonce` parameter (random value tied to session)

2. User authenticates; AS redirects back with authorization code

3. Client exchanges code at token endpoint:
   POST /token
   grant_type=authorization_code&code=...&redirect_uri=...
   → Response: { id_token, access_token, [refresh_token] }

4. Client validates id_token (see next Q)

5. Optionally: client calls GET /userinfo with access_token
   → Returns user profile claims (name, email, picture, etc.)
```

The `/.well-known/openid-configuration` endpoint returns the AS's metadata — token endpoint URL, JWKS URI, supported scopes, claim types — allowing clients to auto-configure without hardcoded URLs. Always start there.

**JWKS URI**: the AS publishes its public signing keys as a JSON Web Key Set. The client fetches this to verify id_token signatures. Keys can rotate; clients should cache JWKS with a short TTL and re-fetch on `kid` miss.
:::

::: details Q: How do you correctly validate an id_token?
Every step matters — skip one and you're open to impersonation or replay:

1. **Fetch the JWKS** from the discovery document's `jwks_uri`. Select the key by `kid` from the token header.
2. **Verify the signature** using the algorithm from the token header (pin allowed algorithms; reject `alg: none`). See [JWT](./jwt) for algorithm confusion attacks.
3. **Check `iss`**: must exactly match the IdP's issuer URL from the discovery document.
4. **Check `aud`**: must include your application's `client_id`. Reject tokens issued for other clients.
5. **Check `exp`**: reject expired tokens (allow ≤60 s clock skew).
6. **Check `nonce`**: must match the nonce your client sent in the authorization request. This prevents **replay attacks** — an attacker re-submitting a captured id_token to your application. The nonce must be stored in the session and consumed (deleted) after one successful validation.
7. **Check `at_hash`** (if present): a hash of the access_token, binding the id_token to a specific access_token. Prevents token substitution in hybrid flows.

Use a certified OIDC client library (e.g., `openid-client` for Node, `authlib` for Python). Certified libraries implement all these checks; hand-rolled JWT decoders routinely miss `nonce` and `aud`.
:::

::: details Q: When should you roll your own auth vs. delegate to an IdP?
**Delegating to an IdP** (Google, Okta, Auth0, Keycloak, Cognito) is almost always the right default:

| Concern | Roll-your-own | Delegate to IdP |
|---|---|---|
| MFA | You build it | Included |
| Password storage (bcrypt, breach detection) | You implement | Handled |
| Account recovery | You build it | Handled |
| Compliance (SOC 2, HIPAA) | Complex | Mostly covered |
| OIDC/SAML integration | You implement | Native |
| Maintenance burden | High (security patches, CVEs) | Vendor's responsibility |

**When to roll your own**: highly regulated environments with specific data residency requirements; products where auth is a core differentiator; air-gapped systems. Even then, start from a well-audited open-source IdP (Keycloak, Ory Hydra) rather than building from scratch.

The main risk of delegation is vendor lock-in and dependency on the IdP's availability. Mitigate by abstracting IdP interactions behind an interface so you can swap providers; avoid IdP-specific claims deep in business logic.
:::

## Common follow-ups

- What is the difference between OIDC and SAML, and when is SAML still preferred?
- How does OIDC handle single sign-on (SSO) and what is a session cookie at the IdP level?
- What are the `profile`, `email`, and `address` standard scopes and what claims do they return?
- How does Back-Channel Logout work, and why is Front-Channel Logout unreliable?
