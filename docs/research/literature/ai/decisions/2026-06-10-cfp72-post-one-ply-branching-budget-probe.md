# cFp72 Post-One-Ply Branching Budget Probe

Date: 2026-06-10

## Decision

cFp72 keeps the determinized PIMC line benchmark-only and adds a
post-one-ply branching budget probe under
`determinized-pimc-post-one-ply-branching-budget-v0/cFp72/` for both current
and robust starter suites.

The probe reuses the cFp70 sampled-root rebuild path and cFp71 representative
first-ply path. For each eligible root it executes only the first-ply
representative sampled public bucket inside cloned sampled root states, then
counts only the next legal/public action surface. It writes root-level scalar
branching and budget aggregates plus skipped-root scalar accounting.

## Results

Current suite:

- 4,042 observed roots.
- 3,979 branching roots and 63 skipped roots.
- 31,832 checked samples.
- 150,560 completed first-ply pairs.
- 0 failed or deferred pairs.
- Post-one-ply public action budget total 863,479, average 5.735.
- Next public action stats min/max/avg 0/14/4.696.

Robust suite:

- 32,487 observed roots.
- 32,147 branching roots and 340 skipped roots.
- 257,176 checked samples.
- 1,230,736 completed first-ply pairs.
- 0 failed or deferred pairs.
- Post-one-ply public action budget total 7,095,113, average 5.765.
- Next public action stats min/max/avg 0/15/4.704.

The robust repeat was deterministic. The repeated robust hashes matched for
`summary.json`, `branching-roots.jsonl`, `skipped-roots.jsonl`, and
`report.md`.

## Boundaries

cFp72 does not change gameplay behavior, engine rules, legal moves, sampler
behavior, deck/catalog data, UI runtime behavior, rating formulas, or existing
cFp68/cFp69/cFp70/cFp71 artifacts.

cFp72 does not add rollout, strength estimates, action ordering, best-action
selection, win probability, reward targets, product AI wiring, or AI Lab runner
controls.

The cFp72 artifacts intentionally omit hidden identities, private sampled
snapshots, private first-ply payload details, post-first-ply snapshots,
terminal snapshots, and search-strength outputs.

## Recommended Next Step

cFp73 should choose a narrow benchmark-only follow-up from the cFp72 scalar
surface: either a branching casebook, budget-threshold analysis, or another
artifact-only infrastructure probe. It should remain outside product gameplay
and avoid any search-strength claim until a later spec explicitly defines one.
