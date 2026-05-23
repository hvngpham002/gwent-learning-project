# Sampler Readiness Root Profiler Report

## Run

- suite id: benchmark-v1-starter-matrix-v1
- sampler run id: benchmark-v1-starter-matrix-v1:sampler-readiness:cFp60
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

## Validation Status

| Validation status | Count |
|---|---:|
| deferred | 3768 |
| invalid | 274 |

## Invalid Reason Counts

| Reason | Count |
|---|---:|
| observed_exceeds_prior_total | 274 |

## Sample Count Stats

- samples: count 4042, min 0, max 8, avg 7.458, p50 8, p90 8, p95 8

## Public Action Count Stats

- public actions: count 4042, min 1, max 13, avg 4.735, p50 5, p90 9, p95 10

## Collision Count Stats

- collisions: count 4042, min 0, max 25, avg 2.876, p50 2, p90 8, p95 10

## Largest Bucket Stats

- largest bucket: count 4042, min 1, max 26, avg 3.171, p50 2, p90 6, p95 11

## Largest Public Action Root

- root fingerprint: b8eb086c9b882efdc5ee2a6f2b407c4c3bcb6b3091ffe38c7054b574fb5cd701
- matchup: starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0
- seed: starter-matrix-001
- mirror index: 1
- step: 7
- phase: playing
- round: 1
- seat: seat_a
- policy: legal-heuristic-v0
- faction: skellige
- deck preset: official-skellige-starter
- public action count: 13

## Largest Collision Root

- root fingerprint: 0925f3a459adc909c62ca004a7d4093bfd39c2d0778d087928e09850b8eddab0
- matchup: starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0
- seed: starter-matrix-002
- mirror index: 1
- step: 13
- phase: playing
- round: 1
- seat: seat_a
- policy: legal-heuristic-v0
- faction: monsters
- deck preset: official-monsters-starter
- public action collision count: 25

## Public Action Kind Distribution

| Kind | Count |
|---|---:|


## Timing Policy

Committed cFp60 artifacts intentionally omit wall-clock timing so repeated runs produce stable hashes. Runtime timing should be collected later in a separated local timing profile.

## Interpretation Warning

This artifact is sampler-readiness infrastructure only. No rollout, search, action-evaluation, or policy-behavior change occurred. It is not search strength, not rollout evidence, not a new gameplay policy, and not product difficulty.

## Hidden-Info Safety

Sampler-readiness artifacts contain public root metadata, scalar/count summaries, and action-abstraction statistics only. They exclude raw state, private card payloads, command/event payloads, runtime card identifiers, and sampled hidden identities.

## Non-Search Warning

cFp60 sampler-readiness artifacts are evaluation infrastructure only. No rollout, search, action-evaluation, or policy-behavior change occurred. These artifacts do not constitute search strength, a new gameplay policy, or product difficulty.
