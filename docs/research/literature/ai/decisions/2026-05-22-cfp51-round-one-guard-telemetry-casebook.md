# cFp51: Round-One Guard Telemetry Casebook

Date: 2026-05-22

Phase: Analysis / Hidden-Info-Safe Decision Note (cFp51)

## Decision

cFp51 does not support a direct `legal-heuristic-v1` behavior patch.

The cFp50 telemetry shows that most robust `round_one_overinvestment` findings
are not simple missed one-move guard opportunities: 44 of 71 are already
suppressed late-pass cases, 20 never reached the board floor on selected
play-card decisions, 4 reached base geometry but stayed in exception or
non-recommendation territory, and only 2 show base geometry plus a guard
recommendation during selected play-card decisions.

Recommended cFp52 scope: reproduce and debug the two
`guard_recommended_play_selected` robust findings before any behavior change.
Those two rows are the only high-priority potential policy contradictions. They
are too few, and still too aggregate, to justify another threshold or resource
gate patch.

## 1. Source Artifact And Hidden-Info Boundary

This note uses only committed public artifacts:

| Artifact | Use |
|---|---|
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/findings.jsonl` | Current starter-matrix failure-mining rows |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/findings.jsonl` | Expanded starter-matrix failure-mining rows |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/findings.jsonl` | Robust starter-matrix failure-mining rows |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/summary.json` | Robust failure-mining totals |
| `audit/reports/2026-05-22-cFp50-report.md` | cFp50 telemetry contract and artifact hashes |

Hidden-info boundary: this analysis reads only public failure-mining rows and
aggregate scalar evidence fields. It does not read raw engine state, command
logs, event logs, private observations, hand arrays, deck order, discard arrays,
runtime card instance ids, raw decision traces, action refs, or card identities
outside already-public artifact metadata.

## 2. cFp50 Telemetry Topline

| Suite | Findings | `round_one_overinvestment` | Telemetry available | Base geometry | Recommended play count | Suppressed pass count |
|---|---:|---:|---:|---:|---:|---:|
| current starter matrix | 300 | 6 | 6 | 0 | 0 | 1 |
| expanded starter matrix | 878 | 26 | 26 | 0 | 0 | 17 |
| robust starter matrix | 2301 | 71 | 71 | 10 | 4 | 48 |

The committed artifacts match the expected cFp50 values. The robust suite is the
only suite with selected play-card base-geometry and recommendation counts.

## 3. Robust Classification

Classification logic follows the cFp51 spec order: unavailable telemetry first,
then base geometry plus recommendation, base geometry without recommendation,
suppressed late pass, board-floor miss, hand-cap miss, and other no-base
geometry.

| Category | Count |
|---|---:|
| `guard_suppressed_late_pass_no_play_recommendation` | 44 |
| `board_floor_never_reached` | 20 |
| `guard_base_geometry_exception_or_non_recommendation` | 4 |
| `guard_recommended_play_selected` | 2 |
| `hand_cap_never_reached` | 1 |
| `other_no_base_geometry` | 0 |
| `telemetry_unavailable` | 0 |

### Category By Outcome

| Category | Loss | Draw | Win |
|---|---:|---:|---:|
| `guard_recommended_play_selected` | 2 | 0 | 0 |
| `guard_base_geometry_exception_or_non_recommendation` | 4 | 0 | 0 |
| `guard_suppressed_late_pass_no_play_recommendation` | 42 | 2 | 0 |
| `board_floor_never_reached` | 20 | 0 | 0 |
| `hand_cap_never_reached` | 1 | 0 | 0 |
| `other_no_base_geometry` | 0 | 0 | 0 |
| `telemetry_unavailable` | 0 | 0 | 0 |

### Category By Faction

| Category | Monsters | Nilfgaard | Northern Realms | Scoia'tael | Skellige |
|---|---:|---:|---:|---:|---:|
| `guard_recommended_play_selected` | 0 | 0 | 0 | 1 | 1 |
| `guard_base_geometry_exception_or_non_recommendation` | 0 | 2 | 0 | 1 | 1 |
| `guard_suppressed_late_pass_no_play_recommendation` | 2 | 17 | 19 | 5 | 1 |
| `board_floor_never_reached` | 0 | 13 | 7 | 0 | 0 |
| `hand_cap_never_reached` | 0 | 0 | 0 | 1 | 0 |
| `other_no_base_geometry` | 0 | 0 | 0 | 0 | 0 |
| `telemetry_unavailable` | 0 | 0 | 0 | 0 | 0 |

### Category By Matchup Id

| Matchup id | Recommended play | Base exception | Suppressed late pass | Board floor miss | Hand cap miss |
|---|---:|---:|---:|---:|---:|
| `starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1` | 0 | 0 | 2 | 0 | 0 |
| `starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0` | 0 | 1 | 3 | 4 | 0 |
| `starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0` | 0 | 0 | 2 | 0 | 0 |
| `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | 0 | 1 | 8 | 9 | 0 |
| `starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1` | 0 | 0 | 2 | 0 | 0 |
| `starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1` | 0 | 0 | 4 | 0 | 0 |
| `starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1` | 1 | 0 | 3 | 0 | 1 |
| `starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1` | 1 | 1 | 1 | 0 | 0 |
| `starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0` | 0 | 0 | 5 | 3 | 0 |
| `starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0` | 0 | 0 | 1 | 0 | 0 |
| `starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0` | 0 | 0 | 13 | 4 | 0 |
| `starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0` | 0 | 1 | 0 | 0 | 0 |

### Sample Finding Ids

| Category | Sample finding ids |
|---|---|
| `guard_recommended_play_selected` | `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-017__1__seat-a`; `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-robust-008__0__seat-b` |
| `guard_base_geometry_exception_or_non_recommendation` | `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-005__1__seat-b`; `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-018__0__seat-a` |
| `guard_suppressed_late_pass_no_play_recommendation` | `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-013__0__seat-b`; `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-012__1__seat-b` |
| `board_floor_never_reached` | `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-007__1__seat-b`; `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-003__1__seat-b` |
| `hand_cap_never_reached` | `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-019__0__seat-b` |

## 4. Guard-Recommended Play Cases

These are the highest-priority rows because public telemetry says base geometry
and overinvestment recommendations appeared during selected play-card
decisions.

### Case 1

- finding id: `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-017__1__seat-a`
- faction: `scoiatael`
- matchup id: `starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1`
- seed: `starter-matrix-robust-017`
- mirror index: `1`
- `round1PlayCardCount`: `10`
- `matchOutcome`: `loss`
- `roundOneGuardBaseGeometryCount`: `3`
- `roundOneRecommendedCount`: `3`
- `roundOneReasonBoardLimitCount`: `3`
- `roundOneExceptionCardAdvantageCount`: `0`
- `roundOneExceptionSingleMoveCatchUpCount`: `0`
- `roundOneSelectedCardAdvantageCount`: `1`
- `roundOneCatchUpSingleMoveCount`: `10`
- `roundOneRecommendationContinueCount`: `8`
- `roundOneRecommendationPreserveFutureHandCount`: `3`

### Case 2

- finding id: `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-robust-008__0__seat-b`
- faction: `skellige`
- matchup id: `starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1`
- seed: `starter-matrix-robust-008`
- mirror index: `0`
- `round1PlayCardCount`: `9`
- `matchOutcome`: `loss`
- `roundOneGuardBaseGeometryCount`: `2`
- `roundOneRecommendedCount`: `1`
- `roundOneReasonBoardLimitCount`: `2`
- `roundOneExceptionCardAdvantageCount`: `1`
- `roundOneExceptionSingleMoveCatchUpCount`: `0`
- `roundOneSelectedCardAdvantageCount`: `1`
- `roundOneCatchUpSingleMoveCount`: `6`
- `roundOneRecommendationContinueCount`: `8`
- `roundOneRecommendationPreserveFutureHandCount`: `2`

Assessment: two robust rows are not enough for a behavior patch. They are enough
for a cFp52 reproduction/debug phase. The aggregate telemetry does not prove
whether the selected play happened before the guard recommendation, whether
later recommendations were rejected by another tactical branch, or whether the
failure-mining row aggregates multiple round-one decisions into one lossy
case-level signal.

## 5. Base-Geometry Exception Cases

The four `guard_base_geometry_exception_or_non_recommendation` rows aggregate as
follows:

| Metric | Count |
|---|---:|
| Rows | 4 |
| Base-geometry play-card decisions | 5 |
| Guard recommended play-card decisions | 0 |
| `roundOneExceptionCardAdvantageCount` | 0 |
| `roundOneExceptionSingleMoveCatchUpCount` | 5 |
| `roundOneExceptionLastGemCount` | 0 |
| `roundOneExceptionOpponentPassedCount` | 0 |
| `roundOneExceptionNonPlayCardCount` | 1 |
| `roundOneExceptionMatchWinningPlayCount` | 0 |
| `roundOneExceptionSingleCardHandCount` | 0 |
| `roundOneSelectedCardAdvantageCount` | 3 |
| `roundOneCatchUpSingleMoveCount` | 21 |
| `roundOneScoreDeltaBehindCount` | 26 |
| `roundOneScoreDeltaTiedCount` | 3 |
| `roundOneScoreDeltaAheadCount` | 7 |
| `roundOneRecommendationContinueCount` | 35 |
| `roundOneRecommendationPreserveFutureHandCount` | 1 |
| `roundOneRecommendationSacrificeRoundCount` | 0 |

Assessment: these rows look more like valid tactical exceptions or aggregate
instrumentation edges than behavior candidates. The base-geometry decisions are
not paired with guard recommendations, and every base-geometry exception count
visible here is dominated by single-move catch-up context. They do not justify
removing cFp43 exceptions.

## 6. Suppressed-Late-Pass Cases

The largest category is `guard_suppressed_late_pass_no_play_recommendation`:
44 of 71 robust findings.

| `round1PlayCardCount` | Count |
|---:|---:|
| 7 | 18 |
| 8 | 18 |
| 9 | 3 |
| 10 | 4 |
| 11 | 1 |

| `roundOneMaxBoardAfterSelectedMove` | Count |
|---:|---:|
| 5 | 2 |
| 6 | 34 |
| 7 | 4 |
| 8 | 2 |
| 9 | 1 |
| 12 | 1 |

| `roundOneMinHandAfterSelectedMove` | Count |
|---:|---:|
| 2 | 2 |
| 3 | 5 |
| 4 | 16 |
| 5 | 21 |

| Aggregate | Count |
|---|---:|
| Rows | 44 |
| `roundOneSuppressedPassCount` | 44 |
| `roundOneReasonBoardLimitCount` | 44 |
| `roundOneRecommendationPreserveFutureHandCount` | 0 |
| `roundOneRecommendationContinueCount` | 390 |
| `roundOneGuardBaseGeometryCount` | 0 |
| `roundOneRecommendedCount` | 0 |
| `roundOneBoardFloorReachedCount` | 15 |
| `roundOneHandCapReachedCount` | 33 |
| `roundOneSelectedCardAdvantageCount` | 45 |
| `roundOneCatchUpSingleMoveCount` | 189 |

| Outcome | Count |
|---|---:|
| loss | 42 |
| draw | 2 |

| Faction | Count |
|---|---:|
| northern_realms | 19 |
| nilfgaard | 17 |
| scoiatael | 5 |
| monsters | 2 |
| skellige | 1 |

The strongest matchup concentrations are
`starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0` with 13 rows
and `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` with 8 rows.

Assessment: cFp43 already intervened late in these rows. Each row has one
suppressed overinvestment pass with board-limit reason, but no selected
play-card guard recommendation. The aggregate finding remains because the AI
had already spent 7 to 11 round-one play cards before that late pass. A direct
one-move threshold change does not target this shape. A behavior patch, if ever
needed for this category, would need a cumulative public spend guard rather than
a simple `boardAfter >= 7 && handAfter <= 4` widening.

## 7. Board-Floor / Hand-Cap Misses

### Board-Floor Never Reached

| `round1PlayCardCount` | Count |
|---:|---:|
| 7 | 4 |
| 8 | 6 |
| 9 | 2 |
| 10 | 7 |
| 11 | 1 |

| `roundOneMaxBoardAfterSelectedMove` | Count |
|---:|---:|
| 4 | 2 |
| 5 | 5 |
| 6 | 13 |

| `roundOneMinHandAfterSelectedMove` | Count |
|---:|---:|
| 0 | 1 |
| 1 | 1 |
| 3 | 4 |
| 4 | 12 |
| 5 | 1 |
| 7 | 1 |

| Aggregate | Count |
|---|---:|
| Rows | 20 |
| `roundOneSelectedCardAdvantageCount` | 24 |
| `roundOneCatchUpSingleMoveCount` | 68 |
| `roundOneBoardFloorReachedCount` | 0 |
| `roundOneHandCapReachedCount` | 30 |
| `roundOneSuppressedPassCount` | 0 |
| `roundOneReasonBoardLimitCount` | 0 |
| `roundOneRecommendationContinueCount` | 195 |
| `roundOneRecommendationPreserveFutureHandCount` | 5 |

Assessment: these are not missed cFp43 base-geometry cases because selected
play-card decisions never reached the board floor. The case-level finding is
still loss-correlated, but the telemetry says the current guard was not aimed at
this board geometry.

### Hand-Cap Never Reached

The one hand-cap miss is:

- finding id: `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-019__0__seat-b`
- faction: `scoiatael`
- matchup id: `starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1`
- seed: `starter-matrix-robust-019`
- mirror index: `0`
- `round1PlayCardCount`: `7`
- `matchOutcome`: `loss`
- `roundOneBoardFloorReachedCount`: `4`
- `roundOneHandCapReachedCount`: `0`
- `roundOneMaxBoardAfterSelectedMove`: `10`
- `roundOneMinHandAfterSelectedMove`: `5`
- `roundOneRecommendationContinueCount`: `7`
- `roundOneRecommendationPreserveFutureHandCount`: `1`

Assessment: one row with `roundOneMinHandAfterSelectedMove = 5` does not justify
raising `ROUND_ONE_OVERINVESTMENT_HAND_AFTER_CAP`. Raising the cap would expand
the guard into higher-resource hands based on a single robust case and risks
repeating a broad-resource-gate problem.

## 8. Patch-Shape Assessment

| Candidate cFp52 shape | Assessment |
|---|---|
| Bug repair for guard-recommended play cases | Not behavior-ready. Only 2 rows show the direct pattern, and aggregate telemetry cannot prove a policy contradiction. Reproduce/debug first. |
| Cumulative spend guard | Plausible future behavior shape for the 44 late-pass rows, but not enough evidence yet. It would need a new public cumulative-spend model and cFp36-style hard-block review. |
| Threshold widening | Rejected for cFp52. Board-floor misses are 20 rows with max board <= 6, and the hand-cap miss is one row at min hand 5. Widening either threshold would be broad. |
| Analyzer calibration | Useful later. The 44 late-pass rows and 20 board-floor misses should probably be separated from true guard contradictions in future queues, but calibration should not hide the two direct contradiction candidates before reproduction. |
| No behavior patch | Accepted for cFp51. The evidence is mixed and mostly not a simple behavior surface. |

## 9. Recommended cFp52 Scope

cFp52 should be a reproduction/debug spec for the two
`guard_recommended_play_selected` cases.

Required cFp52 questions:

1. Reproduce the two exact robust fixtures by `matchupId`, `seed`,
   `mirrorIndex`, and seat.
2. Inspect the local decision trace for the selected play-card decisions where
   `roundOneOverinvestmentRecommended === true`.
3. Determine whether the policy selected a play after the guard recommended
   preserve-future-hand, or whether the aggregate row is mixing earlier/later
   decisions in a way that needs analyzer calibration.
4. If a real contradiction is confirmed, write a narrow behavior repair spec
   for that exact public telemetry pattern.
5. If no contradiction is confirmed, calibrate failure-mining categories so
   late suppressed passes and board-floor artifacts do not dominate the next
   behavior queue.

Do not start cFp52 as a threshold-widening or cumulative-resource patch. That
would be a broad hand-tuned intervention over evidence that is mostly late
intervention, tactical exception, or one-off threshold miss rather than a stable
simple behavior flaw.
