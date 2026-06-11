# cFp74 Bounded Second-Ply Public-Action Scaffold

Date: 2026-06-10

## Decision

cFp74 keeps the determinized PIMC line benchmark-only and adds a bounded
second-ply public-action scaffold under
`determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/` for the current and
robust starter suites.

The scaffold consumes the cFp68 valid/skipped contract, cFp69 public-action
scaffold, cFp70 sampled-world availability artifacts, cFp71 one-ply outcome
skeleton, cFp72 branching budgets, and cFp73 casebook labels. It reuses the
established cFp70/cFp71/cFp72 sampled-root materialization path and executes
only representative second-ply public actions inside cloned sampled benchmark
states for roots inside the cFp74 cap policy.

The default cap policy remains:

- root second-ply pair cap: 512
- root public action cap: 16
- post-one-ply public action cap per state: 16
- sample count cap per root: 8
- robust planned second-ply pair soft cap: 7,500,000

## Evidence

Current artifacts contain 3,979 cFp72 branching roots: 3,593 in cap, 386
over budget, and 63 inherited skipped roots. The current in-cap surface plans
and completes 628,847 representative second-ply public-action pairs with 0
failed or deferred pairs.

Robust artifacts contain 32,147 cFp72 branching roots: 28,915 in cap, 3,232
over budget, and 340 inherited skipped roots. The robust in-cap surface plans
and completes 5,101,445 representative second-ply public-action pairs with 0
failed or deferred pairs. Robust repeat hashes matched exactly.

Repair 1 primes public-transfer memory for every cFp68-eligible cFp72
branching root before the cap check. Eligible over-budget roots update memory
through the established materialization path but do not become observed roots
and do not execute second-ply commands.

Repair 2 compacts only the `second-ply-roots.jsonl` artifact projection. The
in-memory result keeps full count maps and summary aggregation is unchanged.
The compact JSONL omits repeated run/cap constants already present in
manifest/summary, omits per-row root schema, and drops zero-valued entries from
second-ply count maps. Robust `second-ply-roots.jsonl` is 58,287,850 bytes,
below the 90 MB guard and preferred 80 MB target.

## Boundaries

cFp74 does not change gameplay behavior, engine rules, legal moves, AI policy
behavior, sampler semantics, deck/catalog data, UI runtime behavior, rating
formulas, benchmark suite definitions, or existing cFp68-cFp73 artifacts.

cFp74 does not run rollouts, estimate value, rank actions, select actions,
estimate win probability, create reward targets, wire product AI, expose AI Lab
runner buttons, or count third-ply legal surfaces.

## Next Decision

cFp75 should decide whether the bounded second-ply evidence is sufficient to
define a narrow third-ply budget/casebook, or whether deeper public-action
execution should pause until a hidden-info-safe search-readiness consumer is
specified.
