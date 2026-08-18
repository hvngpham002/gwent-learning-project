# Gwent AI Compute Plan

> **CLAIM STATUS: INFRASTRUCTURE / PROJECT COMPUTE POINTER**
> This file connects the repository's AI research work to `docs/compute/`.
> It does not report experiment results.

## Shared Compute Entry Points

Read these files before running an experiment:

1. `docs/compute/README.md`
2. `docs/compute/experiment-status-ledger.md`
3. `docs/compute/experiment-workflow.md`

Use `docs/compute/templates/experiment-card.md` before any run that may become
benchmark, paper, policy, or training evidence.

## Current Scope

Compute status: `ACTIVE — LOCAL ONLY`

Current Gwent AI benchmark commands are deterministic TypeScript/Node workloads.
Run them locally. The H100/Slurm server is unavailable; the status ledger is
the single source of truth for any future setup change. Local commands include:

- `npm run benchmark:smoke`
- `npm run benchmark:starter-matrix`
- `npm run benchmark:v1-smoke`
- `npm run benchmark:v1-starter-matrix`
- `npm run benchmark:v1-failure-mining`

cFp34 failure mining is also CPU/Node-only. It runs the v1 starter matrix,
collects richer headless diagnostics only in memory, and writes the reviewed
public artifact bundle under `docs/research/literature/ai/benchmark-results/`.
It does not require H100, Slurm, Python, internet access, model inference, or
training infrastructure.

Future GPU-specific experiments, such as the following, remain planned and
blocked until the status ledger authorizes a setup:

- neural evaluator or policy pilots;
- model inference over large generated match-state corpora;
- embedding/retrieval experiments over decision traces;
- future self-play or search pipelines that combine simulation with GPU models.

Do not use remote compute access as a product dependency. The browser product, engine,
benchmark harness, and AI Lab must continue to work without the lab cluster.

## Authoritative Repo Paths

| Purpose | Path |
|---|---|
| Benchmark harness docs | `docs/research/literature/ai/benchmark-harness.md` |
| Benchmark results | `docs/research/literature/ai/benchmark-results/` |
| Failure mining artifacts | `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/` |
| AI policy docs | `docs/research/literature/ai/policies/` |
| Decision notes | `docs/research/literature/ai/decisions/` |
| Compute operations docs | `docs/compute/` |
| Active setup authority | `docs/compute/experiment-status-ledger.md` |
| Transient local outputs | `.local/compute-results/` |

Only commit benchmark artifacts that are intentionally part of the public
hidden-info-safe artifact contract. Keep exploratory logs, raw generated state
datasets, model checkpoints, package caches, and failed run directories out of
Git unless a later spec explicitly defines a safe artifact boundary.

## Data And Storage Boundary

| Data or Output | Sensitivity Class | Storage Rule |
|---|---|---|
| Engine benchmark summaries and public JSONL records | `DERIVED-PUBLIC` | Commit only through the existing benchmark artifact paths after hidden-info scan/review |
| Benchmark failure-mining findings | `DERIVED-PUBLIC` | Commit only through the cFp34 failure-mining artifact path after hidden-info scan/review |
| Product playtest diagnostic exports | `DERIVED-PUBLIC` by default, review required | Keep local unless a spec asks to copy sanitized examples |
| Raw engine states, command logs with hidden state, hand/deck arrays | `CONTROLLED` for this project | Do not commit; only use in explicit debug contexts |
| Model checkpoints / downloaded models | `DERIVED-PUBLIC` or license-specific | Keep local or in an external model registry; do not commit |
| Credentials, tokens, private URLs | `SECRET` | Never place in scripts, job logs, or committed docs |

## Local Execution Pattern

Run repository benchmarks locally, recording the run with the local wrapper:

```bash
EXPERIMENT_ID=benchmark-v1-starter-matrix \
  docs/compute/templates/local-batch.sh
```

The wrapper writes transient results under `.local/compute-results/`. Copy or
commit only reviewed, public-safe artifacts where a project spec permits it.

## Long Local Runs

Do not start or wait on a run expected to exceed 15 minutes from an agent
session. Give the user a copy-ready local terminal command instead, including
the expected output path and the exact summary or log to return. Registered
benchmark profiles use the durable progress-enabled runner:

```bash
npm run benchmark:long -- --profile <profile>
```

It writes run metadata and a summary under `.local/benchmark-runs/`. The user
runs the command locally and supplies the final result path for review.

## Minimum Experiment Card For cFp34+

Before automated failure mining or any non-trivial local experiment, create a card
from `docs/compute/templates/experiment-card.md` with:

- suite or generated-workload ID;
- policy IDs and deck suites;
- seed set and sample count;
- command and output path;
- hidden-info artifact contract;
- maximum runtime and stop conditions;
- expected result table or failure-mining report.

## Claim Audit

Project compute pointer. No experiment results or research claims.
