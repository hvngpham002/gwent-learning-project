# cFp62 Sampler Invalid-Root Casebook Decision Note

Date: 2026-05-27

Status: accepted implementation decision

## Summary

cFp62 reruns the current cFp61 sampler-materialization path and writes a
hidden-info-safe scalar casebook for invalid roots only. It does not change
sampler behavior, engine rules, legal moves, benchmark records, policy
selection, search gameplay, ratings, failure mining, catalog data, deck data, or
product difficulty.

Artifacts live under:

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-invalid-roots/cFp62/`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-invalid-roots/cFp62/`

## Evidence Readout

| Suite | Total roots | Valid roots | Invalid roots | Invalid reason | Classification |
|---|---:|---:|---:|---|---|
| `benchmark-v1-starter-matrix-v1` | 4,042 | 3,979 | 63 | `insufficient_prior_remaining` 63 | `public_zone_count_deficit` 63 |
| `benchmark-v1-starter-matrix-robust-v1` | 32,487 | 32,146 | 341 | `insufficient_prior_remaining` 341 | `public_zone_count_deficit` 341 |

All invalid roots classify exactly once. The prompt-revealed hand, raw hidden
count, prior excess, public over-copy, fixed-hand-exceeds-hand, incoherent
count, and fallback buckets are all zero in both suites.

## Decision Questions

### 1. What mostly explains the invalid roots?

The invalid roots are entirely public-zone subtraction pressure. Current has
63/63 `public_zone_count_deficit` rows; robust has 341/341. No invalid root is
explained by prompt-revealed hand accounting, raw hidden-count pressure, prior
remaining excess, public over-copy, fixed known hand exceeding observed hand, or
negative/incoherent count evidence.

The deficit is narrow: current prior-deficit stats are always 1, and robust is
340 rows with deficit 1 plus one row with deficit 2.

### 2. Are invalid roots concentrated?

Yes, but not in a way that justifies search skipping as the first response.

Current invalid roots are 57 playing and 6 round-end roots, split by round as
28/28/7. Robust invalid roots are 313 playing and 28 round-end roots, split by
round as 222/97/22. Robust acting-faction counts are Northern Realms 136,
Nilfgaard 102, Skellige 39, Scoia'tael 37, and Monsters 27. Robust policy counts
are legal-heuristic-v0 246, legal-heuristic-v1 67, and round-end auto-resolver
28.

### 3. Is there a narrow sampler repair before search?

Yes. Because every invalid root has nonzero public-zone known counts and zero
fixed known hand counts, cFp63 should inspect public-zone subtraction/conservation
rather than start by skipping these roots. The casebook points to a narrow
public-zone count edge case around cFp61 prior remaining count versus observed
hidden hand/deck count.

### 4. Is it acceptable to run `determinized-pimc-probe-v0` over valid roots only now?

Not as cFp63. Valid-root-only probing remains possible after an explicit skip
accounting contract, but cFp62 found a coherent and narrow invalid-root family.
Repairing or conclusively explaining that public-zone deficit should precede the
first determinized probe.

### 5. What skip accounting should a later probe report?

If a later probe still skips invalid roots, it must report skipped counts by:
suite, invalid reason, cFp62 classification, phase, round, matchup, policy,
faction, deck preset, public-known count bucket, fixed-known-hand count bucket,
hidden-count deficit bucket, and prior deficit stats. It must also state valid
root counts and skipped root counts before reporting any outcome or action-value
result.

## Recommended Next Phase

cFp63 should implement a narrow sampler-public-count repair before any
determinized probe, then regenerate sampler materialization and invalid-root
artifacts before search.
