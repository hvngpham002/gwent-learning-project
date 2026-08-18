# Compute Execution Contract Cleanup Report

**Date:** 2026-08-18
**Scope:** Authoritative local-compute execution contract and stale project-doc cleanup

## Files Changed

- Added the active `docs/compute/experiment-status-ledger.md` and local batch
  template to the committed operations layer.
- Updated compute guides, templates, AI compute references, benchmark/policy
  references, and project state to make the ledger authoritative.
- Corrected root README routing and the AI roadmap's literature-annotation
  status.

## Behavior Changed

All new compute work is local-only unless the status ledger explicitly changes.
Remote H100/Slurm material remains preserved as historical inventory and an
archived, disabled workflow. Runs expected to exceed 15 minutes are user-owned:
the agent supplies a copy-ready terminal command and result path, then reviews
the completed durable output.

## Tests And Checks Run

- `git diff --check` — PASS.
- `bash -n docs/compute/templates/local-batch.sh docs/compute/templates/slurm-batch.sh docs/compute/templates/slurm-interactive.sh` — PASS.
- `npm run check:project-state -- --base dev` — PASS.

## Acceptance Criteria Status

| Criterion | Status |
|---|---|
| Ledger is the current execution authority | PASS |
| Active compute work is local-only | PASS |
| H100/Slurm material is preserved but disabled | PASS |
| Long runs over 15 minutes are user-owned handoffs | PASS |
| README route contract is current | PASS |
| Roadmap annotation status is current | PASS |

## Deviations

No runtime benchmark, engine, product UI, or AI-policy behavior changed.

## Risks / Follow-Ups

The ledger must be updated before any future non-local setup is used. The local
machine capacity is intentionally not claimed here; each substantial experiment
still needs an experiment card and bounded interpretation.

## Project State Update

`docs/PROJECT_STATE.md` now records local-only authority and the over-15-minute
user-owned run contract.

## Recommended Next Step

For the next long benchmark, provide the user a `npm run benchmark:long --
--profile <profile>` command and review the emitted `.local/benchmark-runs/`
summary after completion.
