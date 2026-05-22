# Search-Readiness Root Profiler Report

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- profile run id: benchmark-v1-starter-matrix-robust-v1:search-readiness:cFp59
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

## Move Presence

| Move kind | Roots with kind |
|---|---:|
| choose_mulligan | 2548 |
| choose_prompt_option | 1400 |
| pass | 25866 |
| play_card | 23675 |
| resolve_round_end | 2673 |
| use_leader | 11504 |

## Count Stats

- legal moves: count 32487, min 1, max 32, avg 7.957, p50 9, p90 13, p95 15
- play-card moves: count 32487, min 0, max 30, avg 5.627, p50 6, p90 12, p95 13
- play-card sources: count 32487, min 0, max 14, avg 4.138, p50 4, p90 9, p95 10
- target expansion: count 32487, min 0, max 26, avg 1.489, p50 0, p90 4, p95 6
- targeted moves: count 32487, min 0, max 31, avg 5.602, p50 6, p90 12, p95 13
- prompt options: count 32487, min 0, max 20, avg 0.184, p50 0, p90 0, p95 0
- mulligan options: count 32487, min 0, max 11, avg 0.863, p50 0, p90 0, p95 11

## Largest Legal-Move Root

- root fingerprint: 6ec468476f20467edf7fbe2bcbe8d2d6dec5bfa80c814ab4a41a975635dbbe08
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
- legal move count: 32

## Largest Target-Expansion Root

- root fingerprint: 6ec468476f20467edf7fbe2bcbe8d2d6dec5bfa80c814ab4a41a975635dbbe08
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
- target expansion count: 26

## Timing Policy

Committed cFp59 artifacts intentionally omit wall-clock root timing so repeated runs produce stable hashes. Runtime timing should be collected later in a separated local timing profile.

## Interpretation Warning

This artifact is profiler evidence for branching and structural budget pressure only. It is not search strength, not rollout evidence, not a new gameplay policy, and not product difficulty.
