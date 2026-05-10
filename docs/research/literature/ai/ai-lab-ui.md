# AI Lab UI

Date: 2026-05-10

## Purpose

`/ai-lab` is the first product-facing AI research dashboard. It makes the current benchmark and policy status visible from the authentic product shell without moving benchmark execution into the browser.

## Current Surface

The AI Lab is read-only. It shows:

- `benchmark-smoke-v1`;
- 6 seeds, mirrored, 12 expected match records;
- current Northern Realms vs current Nilfgaard;
- `legal-heuristic-v0` as the current product/headless heuristic;
- `legal-first-v0` as a benchmark-only comparator;
- planned `legal-heuristic-v1` as not implemented;
- the Batch B evaluation order: deterministic ledgers, fixed-suite matrices, ratings, robustness/search probes, then self-play/ML;
- references to the Batch A search decision, Batch B evaluation-ladder decision, benchmark harness doc, and AI/ML roadmap.

## Browser Boundary

The route does not call `runBenchmarkSuite`, headless simulation runners, ratings, search, training, Python tooling, file writers, or unsafe benchmark output. Future actions for `run benchmark`, `export ledger`, `ratings`, `search prototype`, and `training` are intentionally disabled with reasons.

The AI Lab uses static UI metadata under `src/components/gwent/aiLabViewModel.ts` and does not import `src/game/benchmark`.

## Headless Artifact Boundary

cFp22 adds a command-line artifact path:

```bash
npm run benchmark:smoke
```

That command writes the public `benchmark-smoke-v1/latest` manifest, summary, JSONL records, and Markdown report under `docs/research/literature/ai/benchmark-results/`.

`/ai-lab` does not run this command, read those files, or trigger browser benchmark execution. Any future browser-facing runner or artifact viewer needs its own spec.

## Hidden-Info Boundary

The page may show public policy IDs, suite IDs, deck preset names, and documentation paths. It must not render raw engine state, command/event logs, hand/deck arrays, runtime card instance IDs, or unsafe benchmark debug output.
