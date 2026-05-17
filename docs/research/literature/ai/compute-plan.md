# Gwent AI Compute Plan

> **CLAIM STATUS: INFRASTRUCTURE / PROJECT COMPUTE POINTER**
> This file connects the repository's AI research work to `docs/compute/`.
> It does not report experiment results.

## Shared Compute Entry Points

Read these files before using remote or lab compute:

1. `docs/compute/README.md`
2. `docs/compute/hardware-spec.md`
3. `docs/compute/slurm-workflow.md`
4. `docs/compute/experiment-workflow.md`

Use `docs/compute/templates/experiment-card.md` before any run that may become
benchmark, paper, policy, or training evidence.

## Current Scope

Compute status: `PLANNED`

Current Gwent AI benchmark commands are deterministic TypeScript/Node workloads.
They do not need an H100. Use local hardware, the RTX desktop, or a CPU-only
Slurm allocation for:

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

Use the H100 cluster only for bounded future experiments that explicitly need a
GPU, such as:

- neural evaluator or policy pilots;
- model inference over large generated match-state corpora;
- embedding/retrieval experiments over decision traces;
- future self-play or search pipelines that combine simulation with GPU models.

Do not use H100 access as a product dependency. The browser product, engine,
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
| Transient local/cluster outputs | `.local/compute-results/` |

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
| Model checkpoints / downloaded models | `DERIVED-PUBLIC` or license-specific | Keep in job scratch or external model registry; do not commit |
| Credentials, tokens, private URLs | `SECRET` | Never place in scripts, job logs, or committed docs |

## Safe Slurm Patterns

CPU-only benchmark allocation:

```bash
srun -p main --cpus-per-task=16 --mem=64G --time=01:00:00 --pty bash -l
```

H100 allocation for GPU-specific experiment cards:

```bash
srun -p main --cpus-per-task=16 --mem=256G --gres=gpu:1 --time=01:00:00 --pty bash -l
```

Inside any allocation:

```bash
export JOB_SCRATCH="/tmp/$USER/${SLURM_JOB_ID:-manual}"
mkdir -p "$JOB_SCRATCH"/{repo,npm,outputs,hf,torch}
export npm_config_cache="$JOB_SCRATCH/npm"
export HF_HOME="$JOB_SCRATCH/hf"
export TRANSFORMERS_CACHE="$JOB_SCRATCH/hf/transformers"
export TORCH_HOME="$JOB_SCRATCH/torch"
```

Run repository benchmarks from an allocated worker:

```bash
cd "$JOB_SCRATCH/repo/gwent-learning-project"
git status --short
npm ci
npm run benchmark:v1-starter-matrix -- \
  --out "$JOB_SCRATCH/outputs/benchmark-v1-starter-matrix-v1/latest"
npm run benchmark:v1-failure-mining -- \
  --out "$JOB_SCRATCH/outputs/benchmark-v1-starter-matrix-v1/failure-mining/latest"
```

Copy back only reviewed outputs:

```bash
mkdir -p "$RESULT_DIR"
cp -r "$JOB_SCRATCH/outputs/." "$RESULT_DIR/"
```

## Minimum Experiment Card For cFp34+

Before automated failure mining or any H100-backed experiment, create a card
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
