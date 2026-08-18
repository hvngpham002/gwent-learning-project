# Experiment Card: `<experiment-id>`

> **CLAIM STATUS: EXPERIMENT PLAN**
> This card plans a compute run. It is not evidence until the run completes and
> the project-specific result summary is audited.

## Metadata

| Field | Value |
|---|---|
| Project | `<project>` |
| Experiment ID | `<experiment-id>` |
| Owner / agent | `<name>` |
| Date planned | `<YYYY-MM-DD>` |
| Status | `PLANNED` |
| Active setup ledger | `docs/compute/experiment-status-ledger.md` |

## Purpose

`<One or two sentences describing what this run tests.>`

## Interpretation Boundary

This run can establish:

- `<bounded conclusion if successful>`

This run cannot establish:

- `<important limitation>`

## Data

| Input | Path | Sensitivity Class | Notes |
|---|---|---|---|
| `<input>` | `<path>` | `PUBLIC / DERIVED-PUBLIC / CONTROLLED / SENSITIVE / SECRET` | `<notes>` |

## Code

| Component | Path |
|---|---|
| Script | `<path>` |
| Config | `<path>` |
| Environment | `<venv/container/module>` |

## Compute Request

| Resource | Value |
|---|---|
| Execution setup | `Local workstation` |
| GPUs | `0 unless the active ledger changes` |
| CPUs | `<count>` |
| Memory | `<amount>` |
| Time limit | `<HH:MM:SS>` |
| Expected runtime exceeds 15 minutes | `<yes / no>` |
| Long-run owner | `<user / not applicable>` |

## Command

```bash
<command>
```

For an expected run over 15 minutes, this must be a copy-ready user terminal
command. Record the durable result path the user should return for review.

## Reproducibility

| Item | Value |
|---|---|
| Git commit | `<sha or status>` |
| Random seed(s) | `<seed list>` |
| Local runtime / machine | `<Node/Python version and machine summary>` |
| Output directory | `<path>` |
| Log path | `<path>` |

## Success Criteria

- `<criterion>`

## Stop Conditions

- `<condition>`

## Cleanup

- `<what to copy from /tmp>`
- `<what to delete from /tmp>`

## Results Summary

Status: `PLANNED`

`<Fill after run.>`

## Claim Audit

Experiment plan. No research claims until results are summarized and audited in
the active project.
