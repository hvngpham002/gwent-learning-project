# cFp67 Post-cFp66 Invalid-Root Casebook

Date: 2026-06-01

## Decision

cFp68 should define a valid-root-only determinized probe contract. It must skip
invalid sampler roots explicitly, count skipped roots by suite, phase, round,
matchup, policy, faction, deck preset, provenance label, and invalid reason, and
report skipped-root percentages next to every search-readiness or probe result.
It must not treat skipped roots as wins, losses, or draws, and must not silently
drop them.

cFp67 does not implement search. It adds a deterministic scalar-only casebook
artifact family under:

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/`

## Context

cFp60 added the known-preset sampler contract and public action abstraction.
cFp61 materialized hidden opponent hand/deck multisets from that prior and
produced strict aggregate-only sampler materialization artifacts. cFp62
classified every cFp61 invalid root as a public-zone count deficit. cFp63 ruled
out duplicate public and fixed-known-hand references. cFp64 labeled every
remaining deficit with public-zone provenance. cFp65 made public-zone prior
accounting explicit without forcing unresolved roots valid. cFp66 added
perspective-specific public-transfer memory and repaired one robust root.

After cFp66, current remains 3,979 valid / 63 invalid roots. Robust improves to
32,147 valid / 340 invalid roots. The remaining invalid roots all still report
the same invalid reason and public-zone deficit class.

## Post-cFp66 Counts

| Suite | Total roots | Valid roots | Invalid roots | Invalid % |
|---|---:|---:|---:|---:|
| Current starter matrix | 4,042 | 3,979 | 63 | 1.559% |
| Robust starter matrix | 32,487 | 32,147 | 340 | 1.047% |

## Classification Table

| Classification | Current | Robust |
|---|---:|---:|
| `candidate_valid_root_only_skip` | 63 | 340 |
| `candidate_deeper_reconstruction` | 0 | 0 |
| `classification_unavailable` | 0 | 0 |
| `public_transfer_memory_not_applicable` | 63 | 340 |
| `persistent_public_zone_count_deficit` | 63 | 340 |
| `one_card_deficit` | 63 | 339 |
| `multi_card_deficit` | 0 | 1 |
| `playing_phase` | 57 | 312 |
| `round_end_phase` | 6 | 28 |

Every remaining invalid root is classified exactly once. No valid roots are
emitted in the cFp67 invalid-root records.

## Evidence By Suite

### Current Starter Matrix

| Dimension | Count | Share of invalid roots |
|---|---:|---:|
| playing | 57 | 90.476% |
| round_end | 6 | 9.524% |
| round 1 | 28 | 44.444% |
| round 2 | 28 | 44.444% |
| round 3 | 7 | 11.111% |
| mixed_public_zones | 42 | 66.667% |
| single_zone_board | 6 | 9.524% |
| single_zone_discard | 9 | 14.286% |
| round_end_public_zone | 6 | 9.524% |
| zero known hidden transfer | 63 | 100.000% |
| hidden hand transfer present | 0 | 0.000% |
| hidden deck transfer present | 0 | 0.000% |
| public-transfer adjustment present | 0 | 0.000% |
| uncovered deficit present | 63 | 100.000% |

Faction/deck split: Northern Realms 39, Nilfgaard 11, Scoia'tael 6, Monsters
4, Skellige 3. Policy split: legal-heuristic-v0 47, legal-heuristic-v1 10,
round-end auto-resolver 6. The largest matchup bucket is Northern Realms v0 vs
Nilfgaard v1 at 24 roots; other current matchup buckets are much smaller.

Invalid-root public-transfer totals: 589 visible public-memory references, 0
known hidden hand cards, 0 known hidden deck cards, 0 public-transfer
adjustments, and 63 uncovered deficit cards.

### Robust Starter Matrix

| Dimension | Count | Share of invalid roots |
|---|---:|---:|
| playing | 312 | 91.765% |
| round_end | 28 | 8.235% |
| round 1 | 222 | 65.294% |
| round 2 | 96 | 28.235% |
| round 3 | 22 | 6.471% |
| mixed_public_zones | 229 | 67.353% |
| single_zone_board | 54 | 15.882% |
| single_zone_discard | 29 | 8.529% |
| round_end_public_zone | 28 | 8.235% |
| zero known hidden transfer | 340 | 100.000% |
| hidden hand transfer present | 0 | 0.000% |
| hidden deck transfer present | 0 | 0.000% |
| public-transfer adjustment present | 0 | 0.000% |
| uncovered deficit present | 340 | 100.000% |

Faction/deck split: Northern Realms 136, Nilfgaard 102, Skellige 39,
Scoia'tael 37, Monsters 26. Policy split: legal-heuristic-v0 246,
legal-heuristic-v1 66, round-end auto-resolver 28. The largest matchup buckets
are Northern Realms v0 vs Nilfgaard v1 at 59 roots, Nilfgaard v1 vs Skellige v0
at 44 roots, and Nilfgaard v1 vs Scoia'tael v0 at 42 roots. The remaining
invalid roots are spread across several matchup/policy perspectives rather than
one narrow repair target.

Invalid-root public-transfer totals: 2,739 visible public-memory references, 0
known hidden hand cards, 0 known hidden deck cards, 0 public-transfer
adjustments, and 341 uncovered deficit cards. The card-total value is 341
because one robust root has a two-card deficit.

## Interpretation

The remaining invalid roots are small in rate: 1.559% current and 1.047%
robust. They are dominated by one-card deficits; robust has exactly one
multi-card deficit. They are not zero-evidence roots, and public-transfer memory
does see public-memory references at every invalid root, but none of those
references later become a known hidden transfer that can reduce unknown hidden
counts. That makes public-transfer memory inapplicable to the remaining roots.

The distribution does not reveal a concrete, narrow public-only reconstruction
pattern. The roots span mixed public zones, board-only, discard-only, and
round-end provenance labels; they also span multiple factions, decks, policies,
and matchups. A deeper reconstruction phase might still exist, but cFp67 does
not identify a specific public-only repair likely to cover a meaningful portion
of the remaining invalid roots.

## cFp68 Requirement

cFp68 may proceed toward a first determinized probe only as valid roots only,
with skip counters. The minimum skip counters are:

- suite
- phase
- round
- matchup
- policy
- faction
- deck preset
- provenance label
- invalid reason
- skipped-root count and percentage beside every result table

Skipped roots must be excluded from probe outcomes. They cannot be scored as
wins, losses, draws, sampled failures, or policy errors unless a later spec
separately defines such accounting.
