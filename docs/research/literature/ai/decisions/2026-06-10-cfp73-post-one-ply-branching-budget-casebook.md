# cFp73 Post-One-Ply Branching Budget Casebook Decision

Date: 2026-06-10

## Decision

cFp73 supports cFp74 as a benchmark-only bounded second-ply public-action
scaffold with explicit budget caps and skipped-over-budget counters.

This is a branching-shape decision only. It is not action-quality evidence, not
search-strength evidence, not evidence that PIMC or ISMCTS will be strong, and
not a reason to wire product AI behavior.

## Inputs

cFp73 reads committed cFp72 scalar artifacts for the current and robust starter
matrix suites:

- `summary.json`
- `branching-roots.jsonl`
- `skipped-roots.jsonl`

The casebook also records SHA-256 references for the cFp72 manifest and report
so the scalar source boundary is auditable.

## Results

| Suite | Branching roots | Casebook roots | Casebook share | Skipped roots | Ready | Status anomalies | Very-large/extreme roots |
|---|---:|---:|---:|---:|---|---:|---:|
| current | 3,979 | 1,291 | 32.445% | 63 | yes | 0 | 0 |
| robust | 32,147 | 10,721 | 33.350% | 340 | yes | 0 | 0 |

The robust casebook is 27 MB, below the 50 MB target. The robust repeat hashes
matched exactly.

## Budget Shape

Large/high-threshold surfaces are common enough to deserve explicit caps, but
not explosive:

- Current pressure labels: 243 high-threshold, 227 large, 821
  transition-context-only moderate rows.
- Robust pressure labels: 2,073 high-threshold, 1,939 large, 6,709
  transition-context-only moderate rows.
- cFp72 still has 0 very-large and 0 extreme budget buckets in both suites.

Per-root first-ply public-action kind attribution is not present in the cFp72
compact root rows. cFp73 therefore records only cFp72 aggregate-by-kind tables
and does not guess per-root kind labels.

## Concentration

The robust casebook is broad, not a tiny suspicious pocket:

- Phase: 9,677 playing, 995 round_end, 49 mulligan.
- Round: 7,471 round 1, 1,732 round 2, 1,518 round 3.
- Policy: 5,968 legal-heuristic-v0, 3,758 legal-heuristic-v1, 995
  headless-round-end-auto-resolver.
- Faction/deck: Nilfgaard 2,623, Northern Realms 2,604, Scoia'tael 1,967,
  Monsters 1,820, Skellige 1,707.

The largest robust matchup pocket is
`starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1` with 745 rows,
about 6.9% of robust casebook rows. The next pockets are Northern Realms versus
Nilfgaard at 736/694 rows and Northern Realms versus Scoia'tael at 683 rows.
That is interpretable concentration, but not a single-artifact repair signal.

## Transition Context

Transition-context rows are substantial and interpretable:

- Robust round-end context: 5,825 rows.
- Robust terminal context: 989 rows.
- Terminal rows are isolated to the round-end resolver path.

These rows should be accounted for in cFp74 as explicit scaffold cases and
budget-cap counters, not treated as strategic evaluations.

## Recommendation

cFp74 should implement a benchmark-only bounded second-ply public-action
scaffold. It should:

- consume cFp73/cFp72 scalar artifacts as inputs;
- define explicit caps before any deeper surface is counted;
- carry skipped-over-budget counters beside the result;
- keep transition-context rows visible in the summary;
- continue to avoid rollout, action quality, ranking, move choice, product AI
  wiring, and strength claims.

cFp74 does not need to be a repair phase unless a later scan or repeat reveals a
consistency issue.
