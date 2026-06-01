# Sampler Materialization Report

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- sampler run id: benchmark-v1-starter-matrix-robust-v1:sampler-materialization:cFp61
- root records: 32487
- matches: 1000

## Status Counts

| Status | Count |
|---|---:|
| completed | 1000 |
| engine_error | 0 |
| max_steps_exceeded | 0 |
| policy_failed | 0 |

## Phase Distribution

| Phase | Roots |
|---|---:|
| mulligan | 2948 |
| playing | 26866 |
| round_end | 2673 |

## Policy Distribution

| Policy | Roots |
|---|---:|
| headless-round-end-auto-resolver | 2673 |
| legal-heuristic-v0 | 15369 |
| legal-heuristic-v1 | 14445 |

## Faction Distribution

| Faction | Roots |
|---|---:|
| monsters | 5651 |
| nilfgaard | 7555 |
| northern_realms | 7220 |
| scoiatael | 6433 |
| skellige | 5628 |

## Deck Distribution

| Deck preset | Roots |
|---|---:|
| official-monsters-starter | 5651 |
| official-nilfgaard-starter | 7555 |
| official-northern-realms-starter | 7220 |
| official-scoiatael-starter | 6433 |
| official-skellige-starter | 5628 |

## Prior Status

| Prior status | Count |
|---|---:|
| prior_available | 32487 |

## Materialization Status

| Materialization status | Count |
|---|---:|
| invalid | 340 |
| valid | 32147 |

## Invalid Reason Counts

| Reason | Count |
|---|---:|
| insufficient_prior_remaining | 340 |

## Public Reference Diagnostics

- duplicate public references: 0
- duplicate fixed-known-hand references: 0
- duplicate public reference count: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- duplicate fixed-known-hand reference count: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- unique public known card count: count 32487, min 0, max 22, avg 7.093, p50 7, p90 13, p95 15
- unique fixed-known-hand card count: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0

## Public Adjustment Diagnostics

- side-deck-only public cards: 946
- off-prior public cards: 0
- public adjustment count: 946
- uncovered prior deficit count: 342
- main-deck-attributable public count: count 32487, min 0, max 22, avg 7.093, p50 7, p90 13, p95 15
- side-deck-only public count: count 32487, min 0, max 3, avg 0.029, p50 0, p90 0, p95 0
- off-prior public count: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- public adjustment count: count 32487, min 0, max 3, avg 0.029, p50 0, p90 0, p95 0
- uncovered prior deficit count: count 32487, min 0, max 2, avg 0.011, p50 0, p90 0, p95 0

| Adjustment reason | Count |
|---|---:|
| side_deck_only_public | 946 |

## Public Transfer Memory Diagnostics

- visible public-memory cards: 231369
- known hidden hand cards: 524
- known hidden deck cards: 0
- main-deck-attributable known hidden cards: 523
- side-deck-only known hidden cards: 1
- off-prior known hidden cards: 0
- public-transfer adjustment count: 1
- public-transfer uncovered deficit count: 341
- public-transfer incoherent count: 0
- visible public-memory card count: count 32487, min 0, max 22, avg 7.122, p50 7, p90 13, p95 15
- known hidden hand count: count 32487, min 0, max 1, avg 0.016, p50 0, p90 0, p95 0
- known hidden deck count: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- main-deck-attributable known hidden count: count 32487, min 0, max 1, avg 0.016, p50 0, p90 0, p95 0
- side-deck-only known hidden count: count 32487, min 0, max 1, avg 0, p50 0, p90 0, p95 0
- off-prior known hidden count: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- public-transfer adjustment count: count 32487, min 0, max 1, avg 0, p50 0, p90 0, p95 0
- public-transfer uncovered deficit count: count 32487, min 0, max 2, avg 0.01, p50 0, p90 0, p95 0
- public-transfer incoherent count: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0

| Public-transfer reason | Count |
|---|---:|
| main_deck_attributable_public_transfer | 523 |
| side_deck_only_public_transfer | 1 |

## Sample Counts

- requested: count 32487, min 8, max 8, avg 8, p50 8, p90 8, p95 8
- generated: count 32487, min 0, max 8, avg 7.916, p50 8, p90 8, p95 8
- valid: count 32487, min 0, max 8, avg 7.916, p50 8, p90 8, p95 8
- invalid: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0

## Aggregate Sample Stats

- hand unique average: count 32487, min 0, max 11.625, avg 4.7, p50 4.75, p90 8.625, p95 9
- deck unique average: count 32487, min 0, max 20, avg 15.557, p50 16, p90 17.625, p95 18

### Hand Duplicate Pressure

| Bucket | Count |
|---|---:|
| none | 163115 |
| pair | 86724 |
| triple_plus | 7337 |

### Deck Duplicate Pressure

| Bucket | Count |
|---|---:|
| none | 876 |
| pair | 50883 |
| triple_plus | 205417 |

### Hand Deck Overlap

| Bucket | Count |
|---|---:|
| four_plus | 71909 |
| none | 54377 |
| one | 36239 |
| two_to_three | 94651 |

## Interpretation Warning

This artifact is sampler-materialization infrastructure only. It makes no action-value, search-strength, rollout, gameplay-policy, or product-difficulty claim.

## Hidden-Info Safety

Sampler-materialization artifacts contain only public root metadata, scalar counts, status distributions, and aggregate sample statistics. They exclude sampled hand maps, sampled deck maps, deck order, raw state, raw moves, runtime card identifiers, and card identity strings.

## Non-Search Warning

cFp61 sampler-materialization artifacts are infrastructure only. No rollout, PIMC, ISMCTS, MCTS, action evaluation, action ranking, policy behavior, or product difficulty changed.
