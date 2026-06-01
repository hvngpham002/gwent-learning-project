# cFp63 Sampler Public-Count Repair Decision Note

Date: 2026-05-27

Status: accepted implementation decision

## Summary

cFp63 adds unique runtime public-card accounting to the sampler's
public-known subtraction path and regenerates the existing cFp61
sampler-materialization artifacts plus the cFp62 invalid-root artifacts. The
repair counts each public card instance at most once in public-known
subtraction and counts prompt-revealed opponent hand cards at most once as fixed
known hand while preserving the real opponent hand count for materialization.

The duplicate-reference hypothesis was not confirmed in the committed starter
suites. The new scalar diagnostics report zero duplicate public references and
zero duplicate fixed-known-hand references in both current and robust suites.
The same 404 strict invalid roots remain.

This phase is sampler repair infrastructure only. It does not run PIMC, ISMCTS,
MCTS, rollouts, action evaluation, action ranking, search move selection,
product search AI, policy behavior changes, engine rules changes, legal move
changes, benchmark record changes, rating changes, failure-mining changes, UI
gameplay changes, catalog/deck changes, or product difficulty changes.

## Decision Questions

### 1. Did unique public-card-instance accounting eliminate the invalid roots?

No. The before/after validity counts are unchanged:

| Suite | Before valid | Before invalid | After valid | After invalid |
|---|---:|---:|---:|---:|
| `benchmark-v1-starter-matrix-v1` | 3,979 | 63 | 3,979 | 63 |
| `benchmark-v1-starter-matrix-robust-v1` | 32,146 | 341 | 32,146 | 341 |

The repaired accounting is still required defensively, but the cFp62 invalid
family is not explained by duplicate runtime public-card references.

### 2. What changed in cFp61 materialization artifacts?

The cFp61 artifact schema now includes scalar duplicate-reference diagnostics.
The regenerated materialization artifacts remain:

| Suite | Roots | Valid | Invalid | Invalid reason |
|---|---:|---:|---:|---|
| `benchmark-v1-starter-matrix-v1` | 4,042 | 3,979 | 63 | `insufficient_prior_remaining` 63 |
| `benchmark-v1-starter-matrix-robust-v1` | 32,487 | 32,146 | 341 | `insufficient_prior_remaining` 341 |

Both suites report duplicate public references = 0 and duplicate
fixed-known-hand references = 0.

### 3. What changed in cFp62 invalid-root artifacts?

The cFp62 artifact schema now includes scalar duplicate-reference diagnostics
and a cFp64 recommendation. The classification counts are unchanged:

| Suite | Invalid roots | `public_zone_count_deficit` | Other classifications |
|---|---:|---:|---:|
| `benchmark-v1-starter-matrix-v1` | 63 | 63 | 0 |
| `benchmark-v1-starter-matrix-robust-v1` | 341 | 341 | 0 |

The invalid-root duplicate-reference stats are also zero in both suites.

### 4. How many duplicate references were observed?

| Suite | Duplicate public references | Duplicate fixed-known-hand references |
|---|---:|---:|
| `benchmark-v1-starter-matrix-v1` | 0 | 0 |
| `benchmark-v1-starter-matrix-robust-v1` | 0 | 0 |

The zero counts cover all materialization roots, not only invalid roots.

### 5. What evidence remains for invalid roots?

All invalid roots remain strict `insufficient_prior_remaining` roots classified
as `public_zone_count_deficit`.

Current suite evidence:

- 63 invalid roots.
- Phase split: 57 playing, 6 round_end.
- Round split: 28 / 28 / 7.
- Prior deficit stats: min 1, max 1, average 1.
- Duplicate public and fixed-known-hand references: 0.

Robust suite evidence:

- 341 invalid roots.
- Phase split: 313 playing, 28 round_end.
- Round split: 222 / 97 / 22.
- Prior deficit stats: min 1, max 2, average 1.003.
- Duplicate public and fixed-known-hand references: 0.

The remaining evidence points to a public-zone provenance/accounting family
that needs finer scalar classification. It does not justify relaxing
conservation, adding hidden placeholders, or starting a determinized probe over
silently skipped roots.

### 6. Is cFp64 allowed to implement `determinized-pimc-probe-v0`?

No. Because all 404 invalid roots remain and duplicate-reference diagnostics do
not explain them, cFp64 should not implement PIMC, ISMCTS, rollouts, action
evaluation, action ranking, search move selection, or product search gameplay.

## Recommended Next Phase

cFp64 should add a scalar-only public-zone provenance casebook for the remaining
public-zone count deficits before any determinized probe.
