# Sampler Public-Zone Provenance Casebook

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- sampler run id: benchmark-v1-starter-matrix-robust-v1:sampler-public-zone-provenance:cFp64
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- total roots: 32487
- valid roots: 32147
- invalid roots: 340
- provenance roots: 340
- matches: 1000

## Status Counts

| Status | Count |
|---|---:|
| completed | 1000 |
| engine_error | 0 |
| max_steps_exceeded | 0 |
| policy_failed | 0 |

## Prior Status

| Prior status | Count |
|---|---:|
| prior_available | 32487 |

## Materialization Status

| Materialization status | Count |
|---|---:|
| invalid | 340 |
| valid | 32147 |

## Invalid Reasons

| Reason | Count |
|---|---:|
| insufficient_prior_remaining | 340 |

## cFp62 Classifications Observed

| Classification | Count |
|---|---:|
| fixed_hand_exceeds_observed_hand | 0 |
| negative_or_incoherent_public_count | 0 |
| other_invalid_root | 0 |
| prior_remaining_excess | 0 |
| prompt_revealed_hand_deficit | 0 |
| public_known_exceeds_prior_copy_count | 0 |
| public_zone_count_deficit | 340 |
| raw_hidden_count_exceeds_prior | 0 |

## Provenance Labels

| Label | Count |
|---|---:|
| mixed_public_zones | 229 |
| provenance_ambiguous | 0 |
| round_end_public_zone | 28 |
| single_zone_acting_hand_known | 0 |
| single_zone_board | 54 |
| single_zone_discard | 29 |
| single_zone_prompt_reveal | 0 |
| single_zone_removed | 0 |
| single_zone_row_horn | 0 |
| single_zone_weather | 0 |
| zero_public_zone_unexpected | 0 |

## Provenance Root Distributions

### Phase

| Phase | Count |
|---|---:|
| playing | 312 |
| round_end | 28 |

### Round

| Round | Count |
|---|---:|
| 1 | 222 |
| 2 | 96 |
| 3 | 22 |

### Faction

| Faction | Count |
|---|---:|
| monsters | 26 |
| nilfgaard | 102 |
| northern_realms | 136 |
| scoiatael | 37 |
| skellige | 39 |

### Policy

| Policy | Count |
|---|---:|
| headless-round-end-auto-resolver | 28 |
| legal-heuristic-v0 | 246 |
| legal-heuristic-v1 | 66 |

### Deck Preset

| Deck preset | Count |
|---|---:|
| official-monsters-starter | 26 |
| official-nilfgaard-starter | 102 |
| official-northern-realms-starter | 136 |
| official-scoiatael-starter | 37 |
| official-skellige-starter | 39 |

### Matchup

| Matchup | Count |
|---|---:|
| starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1 | 23 |
| starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 17 |
| starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 12 |
| starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 31 |
| starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0 | 42 |
| starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 44 |
| starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1 | 14 |
| starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 59 |
| starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 18 |
| starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1 | 16 |
| starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 6 |
| starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0 | 37 |
| starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 13 |
| starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 8 |

### Prior Deficit Bucket

| Bucket | Count |
|---|---:|
| one | 339 |
| small | 1 |

### Dominant Public Zone

| Zone | Count |
|---|---:|
| opponent_board_units | 226 |
| opponent_discard | 114 |

### Public Zone Shape

| Shape | Count |
|---|---:|
| single_zone | 88 |
| three_plus_zones | 66 |
| two_zones | 186 |

## Scalar Count Stats

- public-zone references: count 340, min 1, max 18, avg 8.053, p50 8, p90 11, p95 12
- public-zone diversity: count 340, min 1, max 5, avg 1.997, p50 2, p90 3, p95 4
- prior deficit count: count 340, min 1, max 2, avg 1.003, p50 1, p90 1, p95 1
- public known count: count 340, min 1, max 18, avg 8.053, p50 8, p90 11, p95 12
- fixed known hand count: count 340, min 0, max 0, avg 0, p50 0, p90 0, p95 0

## Public Reference Diagnostics

- duplicate public references across all roots: 0
- duplicate fixed-known-hand references across all roots: 0
- duplicate public reference count: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- duplicate fixed-known-hand reference count: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0

## Public Adjustment Diagnostics

- provenance-root side-deck-only public cards: 1
- provenance-root off-prior public cards: 0
- provenance-root public adjustment count: 1
- provenance-root uncovered prior deficit count: 341
- provenance-root main-deck-attributable public count: count 340, min 1, max 18, avg 8.053, p50 8, p90 11, p95 12
- provenance-root side-deck-only public count: count 340, min 0, max 1, avg 0.003, p50 0, p90 0, p95 0
- provenance-root off-prior public count: count 340, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- provenance-root public adjustment count: count 340, min 0, max 1, avg 0.003, p50 0, p90 0, p95 0
- provenance-root uncovered prior deficit count: count 340, min 1, max 2, avg 1.003, p50 1, p90 1, p95 1

| Adjustment reason | Count |
|---|---:|
| side_deck_only_public | 1 |

## Public Transfer Memory Diagnostics

- provenance-root visible public-memory cards: 2739
- provenance-root known hidden hand cards: 0
- provenance-root known hidden deck cards: 0
- provenance-root main-deck-attributable known hidden cards: 0
- provenance-root side-deck-only known hidden cards: 0
- provenance-root off-prior known hidden cards: 0
- provenance-root public-transfer adjustment count: 0
- provenance-root public-transfer uncovered deficit count: 341
- provenance-root public-transfer incoherent count: 0
- provenance-root visible public-memory card count: count 340, min 1, max 18, avg 8.056, p50 8, p90 11, p95 12
- provenance-root known hidden hand count: count 340, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- provenance-root known hidden deck count: count 340, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- provenance-root main-deck-attributable known hidden count: count 340, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- provenance-root side-deck-only known hidden count: count 340, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- provenance-root off-prior known hidden count: count 340, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- provenance-root public-transfer adjustment count: count 340, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- provenance-root public-transfer uncovered deficit count: count 340, min 1, max 2, avg 1.003, p50 1, p90 1, p95 1
- provenance-root public-transfer incoherent count: count 340, min 0, max 0, avg 0, p50 0, p90 0, p95 0

| Public-transfer reason | Count |
|---|---:|
| none | 0 |

## Hidden-Info Safety

Sampler public-zone provenance artifacts contain only public metadata, scalar counts, deterministic buckets, and one safe provenance label per public-zone-deficit root. They exclude private card identity payloads, identity maps, sampled maps, engine logs, final payloads, action references, and debug payloads.

## Non-Search Warning

cFp64 sampler public-zone provenance artifacts are casebook infrastructure only. They do not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, or product difficulty.

## Recommendation For Next Phase

After public-transfer memory, a next spec should either define explicit valid-root-only skip accounting or require deeper public-state reconstruction before any determinized probe.
