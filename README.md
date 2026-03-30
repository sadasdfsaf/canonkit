# CanonKit

> Local-first story bible and continuity checker for fiction teams and solo authors.

[![CI](https://github.com/sadasdfsaf/canonkit/actions/workflows/ci.yml/badge.svg)](https://github.com/sadasdfsaf/canonkit/actions/workflows/ci.yml)
[![Deploy Pages](https://github.com/sadasdfsaf/canonkit/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/sadasdfsaf/canonkit/actions/workflows/deploy-pages.yml)

CanonKit is an open-source product wedge for novel writing. It does not try to replace every drafting tool and it does not bet the whole product on "AI writes the book for you." Instead, it focuses on the layer that becomes painful in long-form fiction: canon drift.

## Live Demo

- Repository: [github.com/sadasdfsaf/canonkit](https://github.com/sadasdfsaf/canonkit)
- Demo URL: [sadasdfsaf.github.io/canonkit](https://sadasdfsaf.github.io/canonkit/)

When a project grows, authors lose time to the same problems:

- character cards stop matching later scenes
- ages and years drift apart
- relationships become asymmetric
- scene notes reference entities that do not exist
- AI prompts need manual context assembly every time

CanonKit puts those problems in one local-first workspace, then surfaces contradictions before they reach the manuscript.

## Why This Is Worth Building

The open-source writing space is not empty. Tools like [novelWriter](https://github.com/vkbo/novelWriter) and [Manuskript](https://github.com/olivierkes/manuskript) already cover long-form drafting well. Commercial products like [Story Architect](https://starc.app/), [Campfire Writing](https://www.campfirewriting.com/), and [Plottr](https://plottr.com/) show that writers will pay for structure, planning, and project organization. AI-first products like [Sudowrite](https://www.sudowrite.com/) and [NovelCrafter](https://www.novelcrafter.com/) show even more clearly that authors value better context, better memory, and less repetitive setup.

The gap is specific:

- open-source tools cover editing and outlining better than continuity QA
- AI writing tools sell generation, but continuity control is often hidden in closed workflows
- authors still need a trusted local system of record for canon, states, and scene context

CanonKit is designed to fill that gap.

## Current MVP

This repository currently ships a GitHub-friendly MVP:

- structured sample project data for characters, locations, rules, and scenes
- a continuity engine that detects:
  - missing core character setup
  - age and timeline mismatches
  - references to missing entities
  - state conflicts across scenes
  - asymmetric relationships
- a product-style single-page interface
- an LLM context pack view for a focused scene

## Product Positioning

CanonKit is not "another editor." It is the control room for a fiction project.

- Upstream: character cards, world rules, locations, scenes
- Middle layer: continuity checks and canon QA
- Downstream: clean handoff to AI tools, editors, and future integrations

That positioning makes it a good open-source launch on GitHub and a credible commercial foundation later.

## Commercial Path

Open source does not remove the business case. The most natural split is:

Open-source layer:

- local-first project storage
- continuity checks
- import and export
- rule templates

Commercial layer:

- cloud sync and backup
- collaboration, comments, review workflows
- premium analysis jobs
- stronger AI context compression and retrieval
- Scrivener, Word, Markdown, or Notion importers
- multi-project and series-level canon management

## Local Development

```bash
npm install
npm run dev
```

Run the continuity engine tests:

```bash
npm run test
```

Build the production bundle:

```bash
npm run build
```

Preview the build:

```bash
npm run preview
```

To build with a non-root base path, for example for GitHub Pages:

```bash
CANONKIT_BASE=/canonkit/ npm run build
```

In PowerShell:

```powershell
$env:CANONKIT_BASE = '/canonkit/'
npm run build
```

## Repository Structure

```text
src/
  data/       sample fiction project
  lib/        continuity checks
  types.ts    core domain model
  App.tsx     product demo UI
docs/
  market-analysis.md
```

## Market Notes

The longer commercial analysis lives in [docs/market-analysis.md](./docs/market-analysis.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).
