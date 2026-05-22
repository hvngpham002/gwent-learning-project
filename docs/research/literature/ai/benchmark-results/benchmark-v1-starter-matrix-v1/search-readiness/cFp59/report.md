# Search-Readiness Root Profiler Report

## Run

- suite id: benchmark-v1-starter-matrix-v1
- profile run id: benchmark-v1-starter-matrix-v1:search-readiness:cFp59
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

## Move Presence

| Move kind | Roots with kind |
|---|---:|
| choose_mulligan | 300 |
| choose_prompt_option | 188 |
| pass | 3217 |
| play_card | 2932 |
| resolve_round_end | 337 |
| use_leader | 1528 |

## Count Stats

- legal moves: count 4042, min 1, max 32, avg 7.611, p50 8, p90 13, p95 15
- play-card moves: count 4042, min 0, max 30, avg 5.285, p50 5, p90 12, p95 13
- play-card sources: count 4042, min 0, max 13, avg 4.045, p50 4, p90 9, p95 10
- target expansion: count 4042, min 0, max 26, avg 1.24, p50 0, p90 4, p95 5
- targeted moves: count 4042, min 0, max 31, avg 5.221, p50 5, p90 11, p95 13
- prompt options: count 4042, min 0, max 18, avg 0.211, p50 0, p90 0, p95 0
- mulligan options: count 4042, min 0, max 11, avg 0.816, p50 0, p90 0, p95 11

## Largest Legal-Move Root

- root fingerprint: 9ba56e11168d46927ba9ac5b186b422ed5157770b543ecae337f56bdb5d83b15
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
- legal move count: 32

## Largest Target-Expansion Root

- root fingerprint: 9ba56e11168d46927ba9ac5b186b422ed5157770b543ecae337f56bdb5d83b15
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
- target expansion count: 26

## Timing Policy

Committed cFp59 artifacts intentionally omit wall-clock root timing so repeated runs produce stable hashes. Runtime timing should be collected later in a separated local timing profile.

## Interpretation Warning

This artifact is profiler evidence for branching and structural budget pressure only. It is not search strength, not rollout evidence, not a new gameplay policy, and not product difficulty.
