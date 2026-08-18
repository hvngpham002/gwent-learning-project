# Compute Guide

> **CLAIM STATUS: INFRASTRUCTURE / NAVIGATION ONLY**
> This directory describes shared compute access, run discipline, and reusable
> templates. It is not evidence for thesis or paper claims.

This directory is the compute operations layer for this repository. The active
experiment setup is defined only in [the experiment status ledger](experiment-status-ledger.md).

Use it for:

- recording experiment setup and observed hardware facts;
- keeping local execution consistent across agents;
- standardizing experiment execution hygiene;
- providing reusable job and experiment-card templates.

Do not put project-specific hypotheses, metrics, or scientific conclusions only
in this directory. For this repository, AI benchmark plans and interpretation
belong under `docs/research/literature/ai/`, with `docs/compute/` acting as the
execution guide.

## Quick Start For Future Agents

1. Read `experiment-status-ledger.md` to confirm the currently authorized
   setup.
2. Read `experiment-workflow.md` before any run that may become benchmark,
   paper, or policy evidence.
3. For Gwent AI work, read
   `docs/research/literature/ai/compute-plan.md` next.
4. Create an experiment card from `templates/experiment-card.md` before any
   expensive run.

Default rule: all experiment code runs locally. The remote H100/Slurm setup is
currently unavailable; its historical details must not be treated as an active
execution option. See the ledger for the current status.

Expected runs longer than 15 minutes are handed to the user as a copy-ready
local terminal command. The agent reviews the durable result afterward rather
than running or waiting on the job interactively.

## Files

| File | Purpose |
|---|---|
| `experiment-status-ledger.md` | **Authoritative active experiment setup and status** |
| `hardware-spec.md` | Observed lab-server hardware, software, storage, and refresh protocol |
| `slurm-workflow.md` | Archived Slurm workflow; not an active execution path |
| `experiment-workflow.md` | Standard lifecycle for running reproducible experiments across projects |
| `templates/experiment-card.md` | Per-run planning template |
| `templates/project-compute-plan.md` | Per-project compute-plan template |
| `templates/local-batch.sh` | Local benchmark execution wrapper |
| `templates/slurm-interactive.sh` | Archived, disabled Slurm allocation template |
| `templates/slurm-batch.sh` | Archived, disabled Slurm batch template |
| `templates/smoke-test.py` | Archived CUDA diagnostic script |
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
research experiments. Do not treat remote H100 access as a product dependency;
consult the ledger for current availability.

## Claim Audit

Infrastructure pointer file. No research claims.
