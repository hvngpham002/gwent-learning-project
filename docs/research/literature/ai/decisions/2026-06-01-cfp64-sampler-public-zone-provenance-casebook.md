# cFp64 Sampler Public-Zone Provenance Casebook Decision Note

Date: 2026-06-01

Status: accepted implementation decision

## Summary

cFp64 adds a benchmark-only, scalar-only provenance casebook for the remaining
cFp62 `public_zone_count_deficit` roots. It reruns the current cFp61/cFp62 root
observer path, emits one public-zone provenance row per invalid deficit root,
and writes deterministic artifacts under `sampler-public-zone-provenance/cFp64/`
for the current and robust starter suites.

This phase is provenance infrastructure only. It does not implement PIMC,
ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move
selection, product search AI, policy behavior changes, engine rule changes,
legal move changes, benchmark record changes, rating changes, failure-mining
changes, UI gameplay changes, catalog/deck changes, or product difficulty
changes.

## Evidence Readout

| Suite | Total roots | Valid roots | Invalid roots | cFp64 provenance roots |
|---|---:|---:|---:|---:|
| `benchmark-v1-starter-matrix-v1` | 4,042 | 3,979 | 63 | 63 |
| `benchmark-v1-starter-matrix-robust-v1` | 32,487 | 32,146 | 341 | 341 |

Every cFp62 `public_zone_count_deficit` root appears exactly once in cFp64 and
receives exactly one provenance label.

## Decision Questions

### 1. How are the 404 roots distributed by provenance label?

| Label | Current | Robust | Combined |
|---|---:|---:|---:|
| `mixed_public_zones` | 42 | 230 | 272 |
| `round_end_public_zone` | 6 | 28 | 34 |
| `single_zone_board` | 6 | 54 | 60 |
| `single_zone_discard` | 9 | 29 | 38 |
| `single_zone_row_horn` | 0 | 0 | 0 |
| `single_zone_removed` | 0 | 0 | 0 |
| `single_zone_weather` | 0 | 0 | 0 |
| `single_zone_acting_hand_known` | 0 | 0 | 0 |
| `single_zone_prompt_reveal` | 0 | 0 | 0 |
| `zero_public_zone_unexpected` | 0 | 0 | 0 |
| `provenance_ambiguous` | 0 | 0 | 0 |

### 2. Are deficits dominated by one zone family, mixed zones, or round-end roots?

The deficits are dominated by mixed public zones, with board and discard as the
only dominant public-zone families:

| Dominant public zone | Current | Robust |
|---|---:|---:|
| `opponent_board_units` | 28 | 226 |
| `opponent_discard` | 35 | 115 |

Public-zone shape is mostly two-zone or mixed:

| Shape | Current | Robust |
|---|---:|---:|
| `single_zone` | 15 | 88 |
| `two_zones` | 35 | 186 |
| `three_plus_zones` | 13 | 67 |

Round-end roots are present but not dominant: 6 current and 28 robust.

### 3. Are the deficits still narrow one-card deficits after cFp63?

Yes. Current remains 63 one-card deficits. Robust remains 340 one-card deficits
and one two-card deficit. Prior-deficit averages are unchanged from cFp63:
current 1.000, robust 1.003.

### 4. Do duplicate-reference counters remain zero?

Yes. Duplicate public-reference totals and duplicate fixed-known-hand-reference
totals remain zero in both suites and across all 36,529 current/robust roots.

### 5. Which cFp65 path does the evidence support?

The evidence supports a narrow sampler accounting repair, not a valid-root-only
probe and not another scalar instrumentation pass. No roots are ambiguous or
zero-zone, and the provenance labels narrow the remaining deficit family to
board/discard/mixed public-zone accounting plus a smaller round-end subset.

### 6. Is cFp65 allowed to implement a search probe?

No. cFp65 should implement a narrow sampler accounting repair targeted at the
observed public-zone provenance labels before any search probe. A future probe
may only be reconsidered after regenerated sampler artifacts either eliminate
the invalid-root family or define explicit invalid-root skip accounting in a
later spec.

## Recommended Next Phase

cFp65 should implement a narrow sampler accounting repair targeted at the
observed public-zone provenance labels before any search probe.
