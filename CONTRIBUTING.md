# Contributing to CanonKit

Thanks for contributing.

## Before You Start

- Keep the product wedge narrow: story bible, continuity checks, and context packing.
- Prefer local-first workflows over hosted assumptions.
- Avoid turning the project into a generic text editor unless a change clearly supports canon QA.

## Local Setup

```bash
npm install
npm run dev
```

Run the core checks before opening a pull request:

```bash
npm run test
npm run lint
npm run build
```

## Good First Contribution Areas

- new continuity rules
- better issue explanations and recommendations
- sample project improvements
- import and export groundwork
- UI polish that improves scanning and triage

## Pull Request Notes

- Explain the user problem, not just the code change.
- Mention whether the change affects the continuity engine, UI, or project model.
- Include screenshots for visible UI changes when practical.
- Keep unrelated cleanup out of the same pull request.
