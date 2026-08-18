# Experiment Status Ledger

> **CLAIM STATUS: OPERATIONS / SINGLE SOURCE OF TRUTH**
> This is the authoritative status for the setup used by new experiment runs.
> Do not infer current availability from historical specs, reports, hardware
> observations, or templates.

## Active Setup

| Field | Current value |
|---|---|
| Status | `ACTIVE` |
| Execution setup | Local workstation only |
| Remote H100 / Slurm access | `UNAVAILABLE` |
| Default runner | Local Node/TypeScript commands via `npm run benchmark:*` |
| Output root | `.local/compute-results/<experiment-id>/<run-id>/` |
| Effective date | 2026-07-22 |
| Change authority | Update this ledger before changing an experiment setup |

All new experiments and benchmark regenerations must run locally until this
ledger is explicitly updated. Do not submit Slurm jobs, request an H100, or
depend on remote server paths. Existing H100/Slurm references are historical
inventory or archival workflow material, not authorization to use that setup.

## Long-Run Handoff Contract

Any run expected to take more than 15 minutes is user-owned local work. An
agent must not start or wait on that run in an interactive coding session.
Instead, it must provide one copy-ready terminal command, the expected output
path, and the success/failure evidence to return for review.

For registered benchmark profiles, use the durable local runner with its
progress display:

```bash
npm run benchmark:long -- --profile <profile>
```

The runner writes a terminal summary and a durable run record below
`.local/benchmark-runs/`. Install `alive-progress` locally only when the live
progress display is desired; the benchmark semantics do not depend on it. For
other long local commands, redirect output to a unique directory beneath
`.local/compute-results/<experiment-id>/<run-id>/` and return the final
`summary.md`, `run.json`, or command log to the agent.

## Run Ledger

| Experiment / scope | Status | Setup | Notes |
|---|---|---|---|
| Current benchmark and research experiment work | `READY-LOCAL` | Local workstation | Use a bounded local command and retain run metadata. |
| Remote H100 / Slurm experiments | `BLOCKED` | Unavailable | Do not schedule or submit jobs while this row remains blocked. |
| Historical H100 observations | `SUPERSEDED` | 2026-05-12 lab snapshot | Retained only in `hardware-spec.md` for provenance. |

## Required Local Run Record

For a non-trivial run, create an experiment card and record the command, git
state, seed(s), local machine/runtime details, output path, start/end time, and
result status. Use `templates/local-batch.sh` for bounded runs; use the long-run
handoff contract above when the expected runtime exceeds 15 minutes.

## Changing Setup

When access or the preferred environment changes, update this file first with
the effective date, availability, default runner, output root, and a new row in
the run ledger. Then update only the operational documents that link here.
Historical reports and phase specs remain unchanged as provenance.
