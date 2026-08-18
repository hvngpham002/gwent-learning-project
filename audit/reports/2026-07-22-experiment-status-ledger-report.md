# Experiment Status Ledger Audit Report

**Date:** 2026-07-22
**Scope:** Local-only experiment execution operations update

## Files Changed

- Added `docs/compute/experiment-status-ledger.md` as the authoritative active
  environment and experiment-status record.
- Updated compute guidance, templates, and the Gwent AI compute plan to consult
  the ledger and use local execution.
- Disabled the executable Slurm templates and added `local-batch.sh` as the
  recorded local benchmark wrapper.
- Updated current operational H100 references in the benchmark/policy docs and
  `docs/PROJECT_STATE.md`.

## Behavior Changed

All new experiment code is now directed to run on the local workstation.
Remote H100/Slurm use is explicitly unavailable, and the archived Slurm
templates exit without submitting or allocating remote work. Historical phase
specs and audit reports were intentionally left unchanged as provenance.

## Tests And Checks Run

- `git diff --check` — PASS.
- `bash -n` over local and archived shell templates — PASS.
- `npm run check:project-state` — PASS.

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Single source of truth for active setup | PASS |
| Current experiment documentation is local-only | PASS |
| Slurm templates cannot initiate remote execution | PASS |
| Historical records preserved | PASS |

## Deviations

No runtime benchmark implementation required changes: the existing Node/TypeScript
commands already execute locally unless wrapped by external scheduler tooling.

## Risks / Follow-Ups

The local workstation's capacity is not benchmarked here. Update the ledger
before enabling a different environment, then restore or replace archived
templates only after access is confirmed.

## Project State Update

`docs/PROJECT_STATE.md` now records the ledger as the active operational
authority and the local-only execution requirement.

## Recommended Next Step

Use `docs/compute/templates/local-batch.sh` with an experiment card for the
next non-trivial benchmark run.
