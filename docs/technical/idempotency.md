---
title: Idempotency Keys
description: Make unsafe operations safe to retry with client-supplied keys.
tags: [api, reliability]
category: technical
status: solid
---

# Idempotency Keys

Clients send a unique `Idempotency-Key` header. The server records the key with the
result of the first request; retries with the same key return the stored result
instead of re-executing the side effect.

**Where it breaks:** key storage TTL vs. retry windows, and partial writes before the
key is committed. Persist the key and the outcome in the same transaction.
