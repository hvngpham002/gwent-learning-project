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
| Partition | `main` |
| GPUs | `<0/1/...>` |
| CPUs | `<count>` |
| Memory | `<amount>` |
| Time limit | `<HH:MM:SS>` |

## Command

```bash
<command>
```

## Reproducibility

| Item | Value |
|---|---|
| Git commit | `<sha or status>` |
| Random seed(s) | `<seed list>` |
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
