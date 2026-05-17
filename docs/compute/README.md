# Compute Guide

> **CLAIM STATUS: INFRASTRUCTURE / NAVIGATION ONLY**
> This directory describes shared compute access, run discipline, and reusable
> templates. It is not evidence for thesis or paper claims.

This directory is the compute operations layer for this repository. It exists so
future agents can use local GPUs, remote desktop GPUs, or the lab Slurm/H100
cluster without guessing at access patterns, storage rules, or artifact
boundaries.

Use it for:

- recording observed hardware and scheduler facts;
- keeping Slurm usage consistent across agents;
- standardizing experiment execution hygiene;
- providing reusable job and experiment-card templates.

Do not put project-specific hypotheses, metrics, or scientific conclusions only
in this directory. For this repository, AI benchmark plans and interpretation
belong under `docs/research/literature/ai/`, with `docs/compute/` acting as the
execution guide.

## Quick Start For Future Agents

1. Read `hardware-spec.md` to understand the observed H100 cluster and the
   fact that availability is not guaranteed.
2. Read `slurm-workflow.md` before opening any Slurm allocation.
3. Read `experiment-workflow.md` before any run that may become benchmark,
   paper, or policy evidence.
4. For Gwent AI work, read
   `docs/research/literature/ai/compute-plan.md` next.
5. Create an experiment card from `templates/experiment-card.md` before any
   expensive run.

Default rule: current TypeScript benchmark commands are CPU/Node workloads and
do not need an H100. Use H100 only for GPU-specific pilots such as future neural
policy inference/training, search/evaluator model experiments, embedding
pipelines, or CUDA smoke tests.

## Files

| File | Purpose |
|---|---|
| `hardware-spec.md` | Observed lab-server hardware, software, storage, and refresh protocol |
| `slurm-workflow.md` | How to use login nodes, worker nodes, `srun`, `sbatch`, storage, and caches |
| `experiment-workflow.md` | Standard lifecycle for running reproducible experiments across projects |
| `templates/experiment-card.md` | Per-run planning template |
| `templates/project-compute-plan.md` | Per-project compute-plan template |
| `templates/slurm-interactive.sh` | Short interactive allocation template |
| `templates/slurm-batch.sh` | Batch-job template |
| `templates/smoke-test.py` | Minimal PyTorch/CUDA smoke test |
| `../research/literature/ai/compute-plan.md` | Gwent AI-specific compute plan and allowed workloads |

## Project Integration Pattern

Each research area that uses shared compute should add or maintain a pointer
file. For this repo, the active pointer is:

```text
docs/research/literature/ai/compute-plan.md
```

That file should state:

- which shared compute docs to read first;
- which experiments are planned for that project;
- which datasets or outputs are sensitive;
- which project-specific scripts and result directories are authoritative.

For now, use compute for bounded benchmark/failure-mining pilots and future GPU
research experiments. Do not treat H100 access as a product dependency.

## Claim Audit

Infrastructure pointer file. No research claims.
