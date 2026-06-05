# Road to Senior

My notes & patterns (system design, technical, behavioral) on the way to passing the senior software engineer interview. Built with [VitePress](https://vitepress.dev), deployed to GitHub Pages at https://haongo138.github.io/road-to-senior/ .

## Local development

```bash
npm install
npm run docs:dev      # local preview
npm run docs:build    # production build (dead-link gate)
npm test              # unit tests for the data layer
```

## Adding a note

Create a markdown file under `docs/system-design`, `docs/technical`, `docs/behavioral`, or `docs/notes` with frontmatter:

```yaml
---
title: My Note
description: One-line summary.
tags: [tag-a, tag-b]
category: technical   # system-design | technical | behavioral | notes
status: draft         # draft | review | solid
---
```

The home card grid and `/tags` page update automatically. Add the note to the matching `sidebar` group in `docs/.vitepress/config.ts`.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which tests, builds, and deploys to GitHub Pages. One-time setup: **repo Settings → Pages → Source: GitHub Actions**.
