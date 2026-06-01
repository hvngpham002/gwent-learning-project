# Sampler Invalid-Root Casebook

## Run

- suite id: benchmark-v1-starter-matrix-v1
- sampler run id: benchmark-v1-starter-matrix-v1:sampler-invalid-roots:cFp62
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- total roots: 4042
- valid roots: 3979
- invalid roots: 63
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

## Classifications

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

## Invalid Root Distributions

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

### Public Known Count Bucket

| Bucket | Count |
|---|---:|
| large | 40 |
| medium | 23 |

### Fixed Known Hand Count Bucket

| Bucket | Count |
|---|---:|
| none | 63 |

### Hidden Count Deficit Bucket

| Bucket | Count |
|---|---:|
| one | 63 |

## Scalar Count Stats

- opponent hand count: count 63, min 1, max 9, avg 4.683, p50 4, p90 7, p95 8
- opponent deck count: count 63, min 11, max 24, avg 20.032, p50 21, p90 24, p95 24
- opponent hidden count: count 63, min 18, max 31, avg 24.714, p50 25, p90 29, p95 30
- public known count: count 63, min 4, max 16, avg 9.317, p50 9, p90 13, p95 15
- fixed known hand count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- required hidden draw count: count 63, min 18, max 31, avg 24.714, p50 25, p90 29, p95 30
- prior remaining count: count 63, min 17, max 30, avg 23.714, p50 24, p90 28, p95 29
- prior deficit count: count 63, min 1, max 1, avg 1, p50 1, p90 1, p95 1

## Public Reference Diagnostics

- duplicate public references across all roots: 0
- duplicate fixed-known-hand references across all roots: 0
- duplicate public reference count: count 4042, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- duplicate fixed-known-hand reference count: count 4042, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- unique public known card count: count 4042, min 0, max 21, avg 7.403, p50 7, p90 14, p95 15
- unique fixed-known-hand card count: count 4042, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- invalid-root duplicate public reference count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- invalid-root duplicate fixed-known-hand reference count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0

## Public Adjustment Diagnostics

- invalid-root side-deck-only public cards: 2
- invalid-root off-prior public cards: 0
- invalid-root public adjustment count: 2
- invalid-root uncovered prior deficit count: 63
- invalid-root main-deck-attributable public count: count 63, min 4, max 16, avg 9.317, p50 9, p90 13, p95 15
- invalid-root side-deck-only public count: count 63, min 0, max 1, avg 0.032, p50 0, p90 0, p95 0
- invalid-root off-prior public count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- invalid-root public adjustment count: count 63, min 0, max 1, avg 0.032, p50 0, p90 0, p95 0
- invalid-root uncovered prior deficit count: count 63, min 1, max 1, avg 1, p50 1, p90 1, p95 1

| Adjustment reason | Count |
|---|---:|
| side_deck_only_public | 2 |

## Public Transfer Memory Diagnostics

- invalid-root visible public-memory cards: 589
- invalid-root known hidden hand cards: 0
- invalid-root known hidden deck cards: 0
- invalid-root main-deck-attributable known hidden cards: 0
- invalid-root side-deck-only known hidden cards: 0
- invalid-root off-prior known hidden cards: 0
- invalid-root public-transfer adjustment count: 0
- invalid-root public-transfer uncovered deficit count: 63
- invalid-root public-transfer incoherent count: 0
- invalid-root visible public-memory card count: count 63, min 4, max 16, avg 9.349, p50 9, p90 13, p95 15
- invalid-root known hidden hand count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- invalid-root known hidden deck count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- invalid-root main-deck-attributable known hidden count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- invalid-root side-deck-only known hidden count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- invalid-root off-prior known hidden count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- invalid-root public-transfer adjustment count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0
- invalid-root public-transfer uncovered deficit count: count 63, min 1, max 1, avg 1, p50 1, p90 1, p95 1
- invalid-root public-transfer incoherent count: count 63, min 0, max 0, avg 0, p50 0, p90 0, p95 0

| Public-transfer reason | Count |
|---|---:|
| none | 0 |

## Hidden-Info Safety

Sampler invalid-root artifacts contain only public root metadata, scalar counts, deterministic buckets, and one safe classification per invalid root. They exclude sampled cards, source maps, card names, raw moves, runtime card identifiers, raw state, command logs, event logs, final state, and hidden hand/deck identities.

## Non-Search Warning

cFp62 sampler invalid-root artifacts are evaluation infrastructure only. They do not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, or product difficulty.

## Recommendation For Next Phase

After public-transfer memory, a next spec should either define explicit valid-root-only skip accounting or require deeper public-state reconstruction before any determinized probe.
