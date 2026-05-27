# Sampler Materialization Report

## Run

- suite id: benchmark-v1-starter-matrix-v1
- sampler run id: benchmark-v1-starter-matrix-v1:sampler-materialization:cFp61
- root records: 4042
- matches: 120

## Status Counts

| Status | Count |
|---|---:|
| completed | 120 |
| engine_error | 0 |
| max_steps_exceeded | 0 |
| policy_failed | 0 |

## Phase Distribution

| Phase | Roots |
|---|---:|
| mulligan | 348 |
| playing | 3357 |
| round_end | 337 |

## Policy Distribution

| Policy | Roots |
|---|---:|
| headless-round-end-auto-resolver | 337 |
| legal-heuristic-v0 | 1890 |
| legal-heuristic-v1 | 1815 |

## Faction Distribution

| Faction | Roots |
|---|---:|
| monsters | 699 |
| nilfgaard | 918 |
| northern_realms | 895 |
| scoiatael | 808 |
| skellige | 722 |

## Deck Distribution

| Deck preset | Roots |
|---|---:|
| official-monsters-starter | 699 |
| official-nilfgaard-starter | 918 |
| official-northern-realms-starter | 895 |
| official-scoiatael-starter | 808 |
| official-skellige-starter | 722 |

## Prior Status

| Prior status | Count |
|---|---:|
| prior_available | 4042 |

## Materialization Status

| Materialization status | Count |
|---|---:|
| valid | 4042 |

## Invalid Reason Counts

| Reason | Count |
|---|---:|
| none | 0 |

## Sample Counts

- requested: count 4042, min 8, max 8, avg 8, p50 8, p90 8, p95 8
- generated: count 4042, min 8, max 8, avg 8, p50 8, p90 8, p95 8
- valid: count 4042, min 8, max 8, avg 8, p50 8, p90 8, p95 8
- invalid: count 4042, min 0, max 0, avg 0, p50 0, p90 0, p95 0

## Aggregate Sample Stats

- hand unique average: count 4042, min 0, max 10.75, avg 4.56, p50 4.75, p90 8.625, p95 9
- deck unique average: count 4042, min 3.625, max 19.375, avg 15.535, p50 15.75, p90 17.625, p95 18

### Hand Duplicate Pressure

| Bucket | Count |
|---|---:|
| none | 20869 |
| pair | 10575 |
| triple_plus | 892 |

### Deck Duplicate Pressure

| Bucket | Count |
|---|---:|
| none | 37 |
| pair | 5926 |
| triple_plus | 26373 |

### Hand Deck Overlap

| Bucket | Count |
|---|---:|
| four_plus | 8544 |
| none | 7239 |
| one | 4531 |
| two_to_three | 12022 |

## Interpretation Warning

This artifact is sampler-materialization infrastructure only. It makes no action-value, search-strength, rollout, gameplay-policy, or product-difficulty claim.

## Hidden-Info Safety

Sampler-materialization artifacts contain only public root metadata, scalar counts, status distributions, and aggregate sample statistics. They exclude sampled hand maps, sampled deck maps, deck order, raw state, raw moves, runtime card identifiers, and card identity strings.

## Non-Search Warning

cFp61 sampler-materialization artifacts are infrastructure only. No rollout, PIMC, ISMCTS, MCTS, action evaluation, action ranking, policy behavior, or product difficulty changed.
