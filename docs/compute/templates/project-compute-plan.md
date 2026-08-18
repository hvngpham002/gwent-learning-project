# `<project>` Compute Plan

> **CLAIM STATUS: INFRASTRUCTURE / PROJECT COMPUTE POINTER**
> This file points from a project to the shared compute workflow. It does not
> report experiment results.

## Shared Compute Entry Points

Before running experiments for this project, read:

1. `docs/compute/experiment-status-ledger.md`
2. `docs/compute/hardware-spec.md` only when the ledger authorizes its
   historical environment again
3. `docs/compute/experiment-workflow.md`

Use `docs/compute/templates/experiment-card.md` for new experiment runs.

## Project-Specific Scope

Compute status: `INACTIVE / PLANNED / ACTIVE` (copy the active setup from the
experiment status ledger)

`<State whether this project currently uses compute. If inactive, state what
would make compute relevant.>`

The shared compute workflow controls execution hygiene only. It does not decide
the research question, dataset, privacy object, metric, or interpretation.

## Compute Profile

Expected workload type:

- `<CPU simulation / GPU model inference / embedding retrieval / data processing / none yet>`

Expected resource needs:

- GPUs: `<0 / 1 / more>`
- CPUs: `<count or unknown>`
- Memory: `<amount or unknown>`
- Storage: `<persistent/scratch needs>`

## Data and Storage Boundary

| Data or Output | Sensitivity Class | Storage Rule |
|---|---|---|
| `<item>` | `PUBLIC / DERIVED-PUBLIC / CONTROLLED / SENSITIVE / SECRET` | `<rule>` |

## Recommended Result Pattern

Use for transient local outputs:

```text
.local/compute-results/<experiment-id>/<run-id>/
```

If the project uses a different result path, state it here.

Each kept run directory should contain:

- `run-metadata.txt`;
- local logs (or a future setup explicitly enabled in the status ledger);
- configuration files;
- output data summaries;
- generated figures if relevant;
- a short result summary if the run may inform writing.

## Claim Audit

Project compute pointer. No experiment results or research claims.
