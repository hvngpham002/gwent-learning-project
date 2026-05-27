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
| valid | 32487 |

## Invalid Reason Counts

| Reason | Count |
|---|---:|
| none | 0 |

## Sample Counts

- requested: count 32487, min 8, max 8, avg 8, p50 8, p90 8, p95 8
- generated: count 32487, min 8, max 8, avg 8, p50 8, p90 8, p95 8
- valid: count 32487, min 8, max 8, avg 8, p50 8, p90 8, p95 8
- invalid: count 32487, min 0, max 0, avg 0, p50 0, p90 0, p95 0

## Aggregate Sample Stats

- hand unique average: count 32487, min 0, max 11.5, avg 4.742, p50 4.75, p90 8.75, p95 9
- deck unique average: count 32487, min 5.25, max 20, avg 15.726, p50 16, p90 17.75, p95 18

### Hand Duplicate Pressure

| Bucket | Count |
|---|---:|
| none | 165394 |
| pair | 87208 |
| triple_plus | 7294 |

### Deck Duplicate Pressure

| Bucket | Count |
|---|---:|
| none | 901 |
| pair | 51801 |
| triple_plus | 207194 |

### Hand Deck Overlap

| Bucket | Count |
|---|---:|
| four_plus | 72459 |
| none | 54886 |
| one | 36676 |
| two_to_three | 95875 |

## Interpretation Warning

This artifact is sampler-materialization infrastructure only. It makes no action-value, search-strength, rollout, gameplay-policy, or product-difficulty claim.

## Hidden-Info Safety

Sampler-materialization artifacts contain only public root metadata, scalar counts, status distributions, and aggregate sample statistics. They exclude sampled hand maps, sampled deck maps, deck order, raw state, raw moves, runtime card identifiers, and card identity strings.

## Non-Search Warning

cFp61 sampler-materialization artifacts are infrastructure only. No rollout, PIMC, ISMCTS, MCTS, action evaluation, action ranking, policy behavior, or product difficulty changed.
