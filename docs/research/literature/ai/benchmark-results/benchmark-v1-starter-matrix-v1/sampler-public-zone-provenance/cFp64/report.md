# Sampler Public-Zone Provenance Casebook

## Run

- suite id: benchmark-v1-starter-matrix-v1
- sampler run id: benchmark-v1-starter-matrix-v1:sampler-public-zone-provenance:cFp64
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- total roots: 4042
- valid roots: 3979
- invalid roots: 63
- provenance roots: 63
- matches: 120

## Status Counts

| Status | Count |
|---|---:|
| completed | 120 |
| engine_error | 0 |
| max_steps_exceeded | 0 |
| policy_failed | 0 |

## Prior Status

| Prior status | Count |
|---|---:|
| prior_available | 4042 |

## Materialization Status

| Materialization status | Count |
|---|---:|
| invalid | 63 |
| valid | 3979 |

## Invalid Reasons

| Reason | Count |
|---|---:|
| insufficient_prior_remaining | 63 |

## cFp62 Classifications Observed

| Classification | Count |
|---|---:|
| fixed_hand_exceeds_observed_hand | 0 |
| negative_or_incoherent_public_count | 0 |
| other_invalid_root | 0 |
| prior_remaining_excess | 0 |
| prompt_revealed_hand_deficit | 0 |
| public_known_exceeds_prior_copy_count | 0 |
| public_zone_count_deficit | 63 |
| raw_hidden_count_exceeds_prior | 0 |

## Provenance Labels

| Label | Count |
|---|---:|
| mixed_public_zones | 42 |
| provenance_ambiguous | 0 |
| round_end_public_zone | 6 |
| single_zone_acting_hand_known | 0 |
| single_zone_board | 6 |
| single_zone_discard | 9 |
| single_zone_prompt_reveal | 0 |
| single_zone_removed | 0 |
| single_zone_row_horn | 0 |
| single_zone_weather | 0 |
| zero_public_zone_unexpected | 0 |

## Provenance Root Distributions

### Phase

| Phase | Count |
|---|---:|
| playing | 57 |
| round_end | 6 |

### Round

| Round | Count |
|---|---:|
| 1 | 28 |
| 2 | 28 |
| 3 | 7 |

### Faction

| Faction | Count |
|---|---:|
| monsters | 4 |
| nilfgaard | 11 |
| northern_realms | 39 |
| scoiatael | 6 |
| skellige | 3 |

### Policy

| Policy | Count |
|---|---:|
| headless-round-end-auto-resolver | 6 |
| legal-heuristic-v0 | 47 |
| legal-heuristic-v1 | 10 |

### Deck Preset

| Deck preset | Count |
|---|---:|
| official-monsters-starter | 4 |
| official-nilfgaard-starter | 11 |
| official-northern-realms-starter | 39 |
| official-scoiatael-starter | 6 |
| official-skellige-starter | 3 |

### Matchup

| Matchup | Count |
|---|---:|
| starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1 | 2 |
| starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 1 |
| starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 1 |
| starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 6 |
| starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0 | 7 |
| starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 4 |
| starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1 | 6 |
| starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 24 |
| starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 3 |
| starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1 | 2 |
| starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 1 |
| starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0 | 3 |
| starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 2 |
| starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 1 |

### Prior Deficit Bucket

| Bucket | Count |
|---|---:|
| one | 63 |

### Dominant Public Zone

| Zone | Count |
|---|---:|
| opponent_board_units | 28 |
| opponent_discard | 35 |

### Public Zone Shape

| Shape | Count |
|---|---:|
| single_zone | 15 |
| three_plus_zones | 13 |
| two_zones | 35 |

## Scalar Count Stats

- public-zone references: count 63, min 4, max 16, avg 9.317, p50 9, p90 13, p95 15
- public-zone diversity: count 63, min 1, max 3, avg 1.968, p50 2, p90 3, p95 3
- prior deficit count: count 63, min 1, max 1, avg 1, p50 1, p90 1, p95 1
- public known count: count 63, min 4, max 16, avg 9.317, p50 9, p90 13, p95 15
- fixed known hand count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0

## Public Reference Diagnostics

- duplicate public references across all roots: 0
- duplicate fixed-known-hand references across all roots: 0
- duplicate public reference count: count 4042, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- duplicate fixed-known-hand reference count: count 4042, min 0, max 0, avg 0, p50 0, p90 0, p95 0

## Hidden-Info Safety

Sampler public-zone provenance artifacts contain only public metadata, scalar counts, deterministic buckets, and one safe provenance label per public-zone-deficit root. They exclude private card identity payloads, identity maps, sampled maps, engine logs, final payloads, action references, and debug payloads.

## Non-Search Warning

cFp64 sampler public-zone provenance artifacts are casebook infrastructure only. They do not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, or product difficulty.

## Recommendation For Next Phase

cFp65 should implement a narrow sampler accounting repair targeted at the observed public-zone provenance labels before any search probe.
