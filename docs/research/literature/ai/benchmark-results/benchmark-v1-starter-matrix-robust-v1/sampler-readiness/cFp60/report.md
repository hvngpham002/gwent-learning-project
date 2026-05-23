# Sampler Readiness Root Profiler Report

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- sampler run id: benchmark-v1-starter-matrix-robust-v1:sampler-readiness:cFp60
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

## Validation Status

| Validation status | Count |
|---|---:|
| deferred | 30190 |
| invalid | 2297 |

## Invalid Reason Counts

| Reason | Count |
|---|---:|
| observed_exceeds_prior_total | 2297 |

## Sample Count Stats

- samples: count 32487, min 0, max 8, avg 7.434, p50 8, p90 8, p95 8

## Public Action Count Stats

- public actions: count 32487, min 1, max 14, avg 4.79, p50 5, p90 9, p95 10

## Collision Count Stats

- collisions: count 32487, min 0, max 25, avg 3.167, p50 2, p90 9, p95 10

## Largest Bucket Stats

- largest bucket: count 32487, min 1, max 26, avg 3.387, p50 3, p90 7, p95 11

## Largest Public Action Root

- root fingerprint: 0a6d731ba75938e750208d6424ca734abaa917f79de9894a4f3ae799b8c879f7
- matchup: starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1
- seed: starter-matrix-robust-008
- mirror index: 1
- step: 4
- phase: playing
- round: 1
- seat: seat_a
- policy: legal-heuristic-v1
- faction: skellige
- deck preset: official-skellige-starter
- public action count: 14

## Largest Collision Root

- root fingerprint: 89185a96ddf0c1c95e5f44315496c97ade757e81bcbfba8874e59dff8a53e771
- matchup: starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1
- seed: starter-matrix-robust-002
- mirror index: 0
- step: 16
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
