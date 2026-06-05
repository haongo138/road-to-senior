# road-to-senior — Senior SWE Interview Prep Site

**Date:** 2026-06-05
**Status:** Approved design (Phase 1)
**Owner:** haongo138

## Goal

A personal, deployable knowledge site to store notes and patterns (behavioral
and technical) while preparing to pass a senior software engineer interview.
Deployed to GitHub Pages at `https://haongo138.github.io/road-to-senior/`.

Modeled on the look and structure of
[awesome-architecture](https://study8677.github.io/awesome-architecture/en/)
(a VitePress site): hero landing, filterable card grid, sidebar nav, built-in
search.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Static-site generator | **VitePress** | Same as reference; markdown-first, Vue/Vite, built-in local search, trivial Pages deploy. |
| Look at launch | **Hero + filterable card grid** | Matches the reference aesthetic the user liked. |
| Deploy target | **`haongo138.github.io/road-to-senior/`** | Project page; repo `road-to-senior`; `base: '/road-to-senior/'`. Keeps username root free. |
| Authoring + deploy | **Markdown in repo + GitHub Actions** | Write `.md` locally, `git push`, CI builds and deploys automatically. |
| Diagrams | **Mermaid** via `vitepress-plugin-mermaid` | Architecture maps as code, versioned with notes. |
| Search | **Built-in local search** (MiniSearch) | Zero infra, client-side, good enough for a personal site. |
| Flashcards / active recall | **Phase 2** (separate spec) | Interactive Vue components + spaced-repetition state are real engineering, decoupled from getting notes online. |

## Scope

### In scope (Phase 1)

- VitePress scaffold with `base: '/road-to-senior/'`.
- GitHub Actions workflow deploying to GitHub Pages on push to `main`.
- Home page: native hero + feature cards, plus a custom **filterable card grid**
  with category chips (e.g. All / System Design / Technical / Behavioral).
- Four content pillars with seed content:
  - **System Design** — one page per system with a Mermaid diagram, trade-offs,
    and "where it breaks". (Architecture map gallery.)
  - **Technical Patterns** — coding/DSA patterns, concurrency, API design, testing.
  - **Behavioral** — STAR stories, leadership principles, prepared answers.
  - **Notes** — free-form learnings.
- Built-in local search enabled.
- `/tags` page: auto-generated index aggregating frontmatter `tags` across all
  notes (the "searchable tag wiki").
- Frontmatter convention enforced across notes.

### Out of scope (Phase 1 — deferred to Phase 2)

- Interactive flashcards (`Flashcard.vue`).
- Spaced-repetition state (localStorage).
- Quiz pages derived from notes.

### Explicitly not doing

- No backend / database — fully static.
- No authentication.
- No bilingual routing (reference has it; not needed here).

## Information Architecture

```
Home (hero + features + filterable CardGrid)
├─ System Design   → architecture map gallery (Mermaid per system)
├─ Technical       → coding/DSA/concurrency/API/testing patterns
├─ Behavioral      → STAR stories, leadership principles, Q&A
├─ Notes           → free-form learnings
└─ /tags           → auto-generated tag index across all notes
```

## Note Convention (frontmatter)

Every content `.md` file carries:

```yaml
---
title: <string>
description: <string>
tags: [<string>, ...]
category: system-design | technical | behavioral | notes
status: draft | review | solid
---
```

A build-time `createContentLoader` reads this frontmatter to power the card grid
and tag pages — no manual index maintenance.

## File Structure

```
road-to-senior/
├─ .github/workflows/deploy.yml      # CI: build + deploy to Pages
├─ docs/
│  ├─ .vitepress/
│  │  ├─ config.ts                   # site config, nav, sidebar, search, base, mermaid
│  │  ├─ theme/
│  │  │  ├─ index.ts                 # extends default theme, registers components
│  │  │  ├─ components/
│  │  │  │  ├─ CardGrid.vue          # filterable card grid (home)
│  │  │  │  ├─ Card.vue              # single card
│  │  │  │  └─ TagFilter.vue         # category/tag chips
│  │  │  └─ custom.css               # theme tweaks
│  │  └─ loaders/
│  │     └─ cards.data.ts            # createContentLoader → cards + tags
│  ├─ index.md                       # home (hero + features + <CardGrid/>)
│  ├─ system-design/                 # + index.md + seed pages
│  ├─ technical/                     # + index.md + seed pages
│  ├─ behavioral/                    # + index.md + seed pages
│  ├─ notes/                         # + index.md + seed pages
│  └─ tags.md                        # <TagsPage/> via loader
├─ package.json
├─ .gitignore
└─ README.md
```

## Data Flow

1. Author writes markdown + frontmatter under `docs/`.
2. At build time, `createContentLoader('**/*.md')` extracts each page's
   frontmatter (title, description, tags, category, status) into a data module.
3. `CardGrid.vue` and the tags page consume that data; filtering by
   category/tag happens client-side via Vue reactivity.
4. VitePress builds a client-side search index (MiniSearch) at build time.
5. Output is fully static HTML/JS/CSS — no backend.

## Deployment

- `docs/.vitepress/config.ts`: `base: '/road-to-senior/'`.
- `.github/workflows/deploy.yml`: on push to `main` → checkout → setup Node →
  `npm ci` → `npm run docs:build` → upload Pages artifact → deploy.
- Repository **Settings → Pages → Source: GitHub Actions**.
- Result served at `https://haongo138.github.io/road-to-senior/`.

## Verification

- **Local dev:** `npm run docs:dev` renders the site for manual review.
- **Build gate:** `npm run docs:build` must pass — VitePress dead-link
  detection catches broken internal links; build failure blocks deploy in CI.
- **Card grid / tags:** verify the loader surfaces seed pages and category/tag
  filtering works in the dev server.
- **Deploy:** confirm the live URL loads with correct `base` path (assets and
  internal links resolve under `/road-to-senior/`).

## Phasing

- **Phase 1 (this spec):** scaffold, config, CI deploy, home with hero +
  filterable cards, all four sections with seed content, search, tags, Mermaid
  → **live site**.
- **Phase 2 (separate spec):** `Flashcard.vue` + spaced-repetition (localStorage),
  quiz pages derived from notes.
