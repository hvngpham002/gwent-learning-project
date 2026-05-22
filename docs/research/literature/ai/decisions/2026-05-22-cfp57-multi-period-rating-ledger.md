# cFp57 Decision Note - Multi-Period Rating Ledger

Date: 2026-05-22

Status: accepted evaluation-only decision note

## Scope

cFp57 freezes the current committed `ratings/latest` artifacts as named
`cFp57` snapshots for the current, expanded, and robust starter suites. It then
compares those snapshots against the established suite-local baselines and
verifies that each `cFp57` snapshot still matches `latest`.

This note uses only public rating artifacts. It does not inspect raw engine
state, command logs, event logs, observations, hands, decks, deck order,
decision traces, or unsafe debug payloads.

## Source Artifacts

| Suite | Baseline snapshot | cFp57 snapshot | Source records | Eligible | Ignored | cFp57 ratings hash |
| --- | --- | --- | ---: | ---: | ---: | --- |
| `benchmark-v1-starter-matrix-v1` | `cFp46` | `cFp57` | 120 | 120 | 0 | `b18875fd66b84f69dc993bfeb66464201c5025a8f67eee012142b0bc543d48e8` |
| `benchmark-v1-starter-matrix-expanded-v1` | `cFp46` | `cFp57` | 400 | 400 | 0 | `070a9a9a3a9385d2b30353421040078b544d48b4eff27b857f6fabe0af4657c4` |
| `benchmark-v1-starter-matrix-robust-v1` | `cFp48` | `cFp57` | 1000 | 1000 | 0 | `a51ba2600cae2fb73b0a149a86c118981243399d2deeef37532a3e6e40f8520c` |

## Baseline To cFp57 Movement

| Suite | Comparison | Entries | Common | New | Removed | Signal counts | Largest positive `deltaRating` | Largest negative `deltaRating` | Largest abs `deltaOverCombinedRd` |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: |
| `benchmark-v1-starter-matrix-v1` | `cFp46-vs-cFp57` | 22 | 22 | 0 | 0 | `no_change=22` | 0.00 | 0.00 | 0.0000 |
| `benchmark-v1-starter-matrix-expanded-v1` | `cFp46-vs-cFp57` | 22 | 22 | 0 | 0 | `no_change=22` | 0.00 | 0.00 | 0.0000 |
| `benchmark-v1-starter-matrix-robust-v1` | `cFp48-vs-cFp57` | 22 | 22 | 0 | 0 | `no_change=18`, `uncertain=4` | 5.13 | -5.14 | 0.0995 |

The robust-suite non-zero rows are limited to `legal-heuristic-v1` Monsters and
Scoia'tael `policy_deck` / `policy_faction` entries. They are marked
`uncertain`, not directional, because the largest absolute
`deltaOverCombinedRd` is 0.0995, well below the existing 0.5 directional
threshold.

## cFp57 To Latest Consistency

| Suite | Comparison | Entries | Common | New | Removed | Signal counts | Non-zero or non-`no_change` rows |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: |
| `benchmark-v1-starter-matrix-v1` | `cFp57-vs-latest` | 22 | 22 | 0 | 0 | `no_change=22` | 0 |
| `benchmark-v1-starter-matrix-expanded-v1` | `cFp57-vs-latest` | 22 | 22 | 0 | 0 | `no_change=22` | 0 |
| `benchmark-v1-starter-matrix-robust-v1` | `cFp57-vs-latest` | 22 | 22 | 0 | 0 | `no_change=22` | 0 |

All `cFp57-vs-latest` comparisons show zero deltas for rating, RD,
conservative rating, and games. All entries are common and all signals are
`no_change`.

## Interpretation

No cFp57 comparison is strong enough to treat as directional under the existing
comparison semantics. The current and expanded suites have no movement from
their cFp46 baselines. The robust suite has four small cFp48-to-cFp57 movements,
but every non-zero row is below uncertainty and remains `uncertain`.

These rating deltas should not drive an AI behavior patch by themselves.
Ratings are a post-engine evaluation view over fixed benchmark records; they
are not exploitability, hidden-info safety proof, product difficulty, or robust
strategy proof. Comparisons remain valid only within the same suite pool.

## Decision

Do not reopen `legal-heuristic-v1` round-one hand tuning from cFp57 rating
movement. The ledger now has named cFp57 snapshots and current consistency
checks across all three starter suites, but no comparison exposes a clear
directional regression tied to a narrow public failure cluster.

## Recommended Next Step

Prefer a search-readiness or ISMCTS probe spec next, grounded in the Batch B
evaluation ladder and the cFp56 pause decision. Only return to heuristic tuning
if a future named rating comparison shows a clear directional regression and
the regression is tied to a narrow, public, hidden-info-safe failure cluster.
