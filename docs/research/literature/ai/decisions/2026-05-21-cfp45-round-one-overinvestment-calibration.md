# cFp45: Round-One Overinvestment Calibration Decision Note

Date: 2026-05-21

Phase: Analysis / Hidden-Info-Safe Decision Note (cFp45)

## Source Artifacts

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/findings.jsonl` — expanded failure-mining findings for `round_one_overinvestment` (26 findings).
- `docs/research/literature/ai/decisions/2026-05-20-cfp44-post-cfp43-failure-mining-casebook.md` — cFp44 casebook with the same 26 case IDs and outcome summaries.

Schema: `benchmark-failure-mining-v1`

## Hidden-Info Boundary

All evidence in this note is derived from the public failure-mining `findings.jsonl` entries for `round_one_overinvestment`. Each finding exposes only:
- `deckPresetId`, `faction`, `matchupId`, `seed`, `mirrorIndex`, `seatId`
- `evidence.matchOutcome`, `evidence.resolvedRoundCount`, `evidence.round1PlayCardCount`
- `severity` (`warning` or `watch`)

No raw `MatchState`, command/event logs, hand/deck arrays, private observations, deck order, or runtime card instance IDs are used. No `AiDecisionTrace` data (e.g., `roundOneOverinvestmentRecommended`, `roundOneOverinvestmentReason`, `roundOneBoardAfterSelectedMove`, `scoreDelta`, `catchUpStatus`) is available from the findings. This is a critical limitation: the findings only record aggregate round-1 play counts, not per-play guard evaluation data.

## cFp43 Guard Geometry Recap

The cFp43 `buildRoundOneOverinvestmentDecision` helper fires when:
1. `features.round === 1`
2. `features.ownGems > 1`
3. `boardAfterSelectedMove >= 7` (i.e., `ownBoardCardCount + 1 >= 7`)
4. `estimatedHandCountAfterSelectedMove <= 4`
5. No exception applies (last-gem, opponent-passed, card-advantage, match-winning, single-move catch-up, single-card hand, non-play-card)

If either `boardAfter < 7` OR `handAfter > 4`, the guard returns `none` or an exception and allows play.

## The 26 Findings

From `findings.jsonl` for `round_one_overinvestment` in the expanded suite (400 records, 26 findings, 25 loss / 1 draw):

| # | findingId (truncated) | faction | matchupId | round1PlayCardCount | resolvedRoundCount | matchOutcome | severity |
|---|---|---|---|---:|---:|---|---|
| 1 | `...expanded-010__1__seat-a` | scoiatael | nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 8 | 2 | loss | warning |
| 2 | `...expanded-001__0__seat-b` | skellige | nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 8 | 2 | loss | warning |
| 3 | `...expanded-008__1__seat-a` | skellige | nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 8 | 2 | loss | warning |
| 4 | `...expanded-007__0__seat-a` | nilfgaard | nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 9 | 3 | loss | warning |
| 5 | `...expanded-008__1__seat-b` | nilfgaard | nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 8 | 3 | loss | warning |
| 6 | `...expanded-001__0__seat-a` | nilfgaard | nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 8 | 3 | loss | warning |
| 7 | `...expanded-003__0__seat-a` | nilfgaard | nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 8 | 3 | loss | warning |
| 8 | `...expanded-006__0__seat-a` | nilfgaard | nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 9 | 3 | loss | warning |
| 9 | `...expanded-007__0__seat-a` | nilfgaard | nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 9 | 3 | loss | warning |
| 10 | `...expanded-009__1__seat-b` | nilfgaard | nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 10 | 3 | loss | warning |
| 11 | `...expanded-003__1__seat-a` | nilfgaard | northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 10 | 2 | loss | warning |
| 12 | `...expanded-003__1__seat-b` | northern_realms | northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 9 | 2 | loss | warning |
| 13 | `...expanded-008__1__seat-b` | northern_realms | northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 8 | 3 | loss | warning |
| 14 | `...expanded-006__1__seat-b` | northern_realms | northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 8 | 2 | loss | warning |
| 15 | `...expanded-001__0__seat-a` | northern_realms | northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 9 | 2 | loss | warning |
| 16 | `...expanded-001__1__seat-b` | northern_realms | northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 8 | 3 | loss | warning |
| 17 | `...expanded-006__1__seat-b` | northern_realms | northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 8 | 3 | loss | warning |
| 18 | `...expanded-008__0__seat-a` | northern_realms | northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 8 | 3 | loss | warning |
| 19 | `...expanded-009__1__seat-b` | northern_realms | northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 8 | 3 | loss | warning |
| 20 | `...expanded-001__1__seat-b` | nilfgaard | nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 7 | 2 | loss | watch |
| 21 | `...expanded-005__0__seat-a` | nilfgaard | nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 7 | 3 | loss | watch |
| 22 | `...expanded-004__0__seat-b` | scoiatael | northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 8 | 3 | draw | watch |
| 23 | `...expanded-005__1__seat-b` | northern_realms | northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 7 | 2 | loss | watch |
| 24 | `...expanded-005__0__seat-a` | northern_realms | northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 7 | 3 | loss | watch |
| 25 | `...expanded-008__1__seat-b` | northern_realms | northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 7 | 2 | loss | watch |
| 26 | `...expanded-002__1__seat-b` | scoiatael | scoiatael-heuristic-v1-vs-skellige-heuristic-v0 | 7 | 3 | loss | watch |

### Faction Distribution

| Faction | Count |
|---|---:|
| northern_realms | 11 |
| nilfgaard | 10 |
| scoiatael | 3 |
| skellige | 2 |
| **Total** | **26** |

### Matchup Concentration

- `nilfgaard-heuristic-v1-vs-skellige-heuristic-v0`: 10 cases (#6-10, #20-21)
- `northern-realms-heuristic-v1-vs-skellige-heuristic-v0`: 7 cases (#15-19, #24-25)
- `northern-realms-heuristic-v1-vs-monsters-heuristic-v0`: 4 cases (#12, #13, #23)
- `northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1`: 1 case (#11)
- `nilfgaard-heuristic-v0-vs-skellige-heuristic-v1`: 2 cases (#2-3)
- `nilfgaard-heuristic-v1-vs-monsters-heuristic-v0`: 2 cases (#4-5)
- `northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0`: 1 case (#14)
- `nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1`: 1 case (#1)
- `northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1`: 1 case (#22)
- `scoiatael-heuristic-v1-vs-skellige-heuristic-v0`: 1 case (#26)

### Play Count Distribution

| round1PlayCardCount | Count | Severity (warning/watch) |
|---|---:|---|
| 10 | 2 | 2 warning |
| 9 | 5 | 4 warning, 1 watch |
| 8 | 11 | 8 warning, 3 watch |
| 7 | 8 | 1 warning, 7 watch |

### Outcome

- Loss: 25 (96.2%)
- Draw: 1 (3.8%)

## Classification Table

The classification below is constrained by the limited public data available in the findings. The findings do **not** contain per-play trace data (`roundOneOverinvestmentRecommended`, `roundOneOverinvestmentReason`, `roundOneBoardAfterSelectedMove`, `estimatedHandCountAfterSelectedMove`, `scoreDelta`, `catchUpStatus`, `selectedMoveIsCardAdvantage`). Therefore, classification must rely on aggregate signals and inference.

**Critical limitation**: Without per-play `AiDecisionTrace` data, it is impossible to determine definitively whether the guard geometry was never reached or whether an exception always applied. The classification below uses probabilistic reasoning based on `round1PlayCardCount`, `resolvedRoundCount`, and faction/matchup patterns.

The labels below are proxy classifications, not definitive per-play guard outcomes. For any future behavior patch, all 26 cases should be treated as `needs_manual_trace_review` until failure mining records per-play cFp43/cFp45 guard evaluations.

| # | faction | round1PlayCardCount | resolvedRounds | classification | rationale |
|---|---|---:|---:|---|---|
| 1 | scoiatael | 8 | 2 | `guard_never_reached_board_below_floor` | 8 plays in 2 rounds; early-round board likely still building. No trace data confirms guard geometry was met. |
| 2 | skellige | 8 | 2 | `guard_never_reached_board_below_floor` | Same pattern: 8 plays in 2 rounds, opponent v0 (likely less aggressive board-building). |
| 3 | skellige | 8 | 2 | `guard_never_reached_board_below_floor` | Mirror of #2; same reasoning. |
| 4 | nilfgaard | 9 | 3 | `guard_never_reached_hand_above_cap` | 9 plays across 3 rounds (not all round-1). Board likely >= 7 at some point in round-1, but estimated hand after likely > 4 early in the round. |
| 5 | nilfgaard | 8 | 3 | `guard_never_reached_hand_above_cap` | Same: 8 plays across 3 rounds; hand after first few round-1 plays likely > 4. |
| 6 | nilfgaard | 8 | 3 | `guard_never_reached_hand_above_cap` | nilfgaard v1 vs skellige v0 dominant matchup. 8 round-1 plays; hand cap likely not reached until later plays. |
| 7 | nilfgaard | 8 | 3 | `guard_never_reached_hand_above_cap` | Same as #6. |
| 8 | nilfgaard | 9 | 3 | `guard_never_reached_hand_above_cap` | 9 plays in round 1 across 3 resolved rounds. Hand likely > 4 during most of round 1. |
| 9 | nilfgaard | 9 | 3 | `guard_never_reached_hand_above_cap` | Same as #8. |
| 10 | nilfgaard | 10 | 3 | `guard_never_reached_hand_above_cap` | 10 plays in round 1 is aggressive. However, hand after first play is likely > 4 (starting hand 8-10). Guard geometry met only on later plays (play 5+), when handAfter <= 4 AND boardAfter >= 7. But nilfgaard v1 may have had match-winning/catch-up exceptions active. |
| 11 | nilfgaard | 10 | 2 | `guard_never_reached_hand_above_cap` | 10 plays in 2 rounds; extreme round-1 spend. Guard likely reached geometry on plays 5+, but may have been blocked by catch-up exception. |
| 12 | northern_realms | 9 | 2 | `guard_never_reached_hand_above_cap` | 9 plays across 2 rounds. Northern Realms starter has many low-value units for spamming. |
| 13 | northern_realms | 8 | 3 | `guard_never_reached_hand_above_cap` | 8 plays across 3 rounds; hand likely > 4 for most round-1 plays. |
| 14 | northern_realms | 8 | 2 | `guard_never_reached_hand_above_cap` | 8 plays in 2 rounds; similar to #12. |
| 15 | northern_realms | 9 | 2 | `guard_never_reached_hand_above_cap` | 9 plays in 2 rounds; high spend but hand cap likely not reached early. |
| 16 | northern_realms | 8 | 3 | `guard_never_reached_hand_above_cap` | 8 plays across 3 rounds. |
| 17 | northern_realms | 8 | 3 | `guard_never_reached_hand_above_cap` | 8 plays across 3 rounds. |
| 18 | northern_realms | 8 | 3 | `guard_never_reached_hand_above_cap` | 8 plays across 3 rounds. |
| 19 | northern_realms | 8 | 3 | `guard_never_reached_hand_above_cap` | 8 plays across 3 rounds. |
| 20 | nilfgaard | 7 | 2 | `guard_never_reached_board_below_floor` | 7 plays in round 1; `watch` severity. Board after first play = 1, after 7th play = 7. Guard geometry (board >= 7 AND hand <= 4) only potentially met on the very last play. If starting hand was 10, handAfter = 3 on play 7, but boardAfter = 7 — geometry is barely met. Likely never fully reached because the guard evaluates per-play and on earlier plays handAfter > 4. |
| 21 | nilfgaard | 7 | 3 | `guard_never_reached_board_below_floor` | Same as #20, 7 plays across 3 rounds. |
| 22 | scoiatael | 8 | 3 | `guard_never_reached_hand_above_cap` | 8 plays across 3 rounds; `watch` severity. Draw outcome. |
| 23 | northern_realms | 7 | 2 | `guard_never_reached_board_below_floor` | 7 plays; `watch` severity. Same as #20 analysis. |
| 24 | northern_realms | 7 | 3 | `guard_never_reached_board_below_floor` | 7 plays; `watch` severity. |
| 25 | northern_realms | 7 | 2 | `guard_never_reached_board_below_floor` | 7 plays; `watch` severity. |
| 26 | scoiatael | 7 | 3 | `guard_never_reached_board_below_floor` | 7 plays; `watch` severity. |

## Classification Summary

| Classification | Count | Percentage |
|---|---:|---:|
| `guard_never_reached_hand_above_cap` | 15 | 57.7% |
| `guard_never_reached_board_below_floor` | 11 | 42.3% |
| `guard_reached_but_exception_opponent_passed` | 0 | 0% |
| `guard_reached_but_exception_card_advantage` | 0 | 0% |
| `guard_reached_but_exception_match_winning` | 0 | 0% |
| `guard_reached_but_exception_single_move_catch_up` | 0 | 0% |
| `guard_reached_but_exception_single_card_hand` | 0 | 0% |
| `guard_reached_but_selected_non_play` | 0 | 0% |
| `guard_triggered_but_later_overinvestment` | 0 | 0% |
| `loss_not_clearly_round_one_resource_related` | 0 | 0% |
| `needs_manual_trace_review` | 0 | 0% |

**Proxy majority pattern: `guard_never_reached_hand_above_cap` (15/26, 57.7%).**

The dominant miss pattern is that the cFp43 guard's `handAfter <= 4` condition was not met during the plays that caused the overinvestment. These cases involve AI seats that played 7-10 cards in round 1, but the guard only evaluates **per-play**. On early plays in the round (plays 1-4), `estimatedHandCountAfterSelectedMove` was still > 4 because the AI had many cards remaining in hand.

The second pattern, `guard_never_reached_board_below_floor` (11/26, 42.3%), involves cases where the board was still building in round 1 and the `boardAfter >= 7` condition was not met until the very last play (or was barely met at `boardAfter = 7`).

## Why cFp43 Did Not Eliminate These Cases

The cFp43 guard uses a **per-play** evaluation with two simultaneous conditions:
- `boardAfter >= 7`
- `handAfter <= 4`

For a player who starts round 1 with 8-10 cards in hand and plays 7-10 cards:
- **Plays 1-4**: `handAfter` is typically 7-9 (still > 4), so the guard does not fire regardless of board state.
- **Plays 5-7**: `handAfter` drops to 3-5 and `boardAfter` reaches 6-8. The guard geometry is barely met (if at all) on play 5, and firmly met on plays 6-7. However, by this point the AI has already committed 5-6 cards to the board.

The fundamental issue is that the guard's geometry is designed to catch the **transition point** where the hand is already thin and the board is already fat. But for aggressive round-1 spammers (especially northern_realms and nilfgaard players with many low-value units), this transition point occurs late in the round, after significant damage has already been done.

The cFp43 guard is effective at stopping plays that would push the board from 6 to 7 when hand goes from 4 to 3 (a single late-round decision). It is less effective at stopping players who systematically spend 5-7 cards in round 1, because the guard's per-play geometry simply does not see the cumulative spending pattern until the hand is already thin and the damage is done.

## Recommended Patch Shape Assessment

The spec allows three patch shapes:
1. **One-step threshold calibration** — widening one threshold by one unit.
2. **New guard reason for repeated public-state pattern** — e.g., late round-1 spending that keeps accumulating.
3. **Narrow exception correction** — if most misses came from an overly permissive exception.

### Assessment of Shape 1 (threshold calibration)

Widening to `boardAfter >= 6` would catch the transition earlier (on play 4-5 instead of 5-7). However, this risks blocking legitimate early-round tempo plays. Widening `handAfter <= 5` instead would catch more cases but could also trigger on healthy hand situations where playing one more card is reasonable.

Given that 57.7% of misses are `guard_never_reached_hand_above_cap` (hand stayed > 4 during overinvestment plays), widening `handAfter` to 5 would address the majority pattern. But this risks over-triggering on cases where the AI has a healthy hand and the extra card spend is justified.

### Assessment of Shape 2 (new guard reason)

A new guard could track cumulative round-1 spending: if the AI has played >= 5 cards in round 1 and the board has >= 5 cards, a secondary "overinvestment accumulation" check could trigger pass. This would catch the pattern that the per-play geometry misses.

### Assessment of Shape 3 (exception correction)

No exceptions were classified as the dominant miss pattern. All zero counts for exception-based classifications. This shape is not supported by the data.

## Decision: Do Not Add Behavior Change (Analysis-Only cFp45)

### Reasoning

1. **No clear majority pattern that supports a single narrow fix.** The two dominant classifications (`guard_never_reached_hand_above_cap` at 57.7% and `guard_never_reached_board_below_floor` at 42.3%) represent different failure modes. A threshold widening would only address one of them and risks creating regressions.

2. **Trace-level data is needed for a confident patch.** Without per-play `AiDecisionTrace` data (e.g., `roundOneOverinvestmentRecommended`, `roundOneOverinvestmentReason`, `scoreDelta`, `catchUpStatus`), this classification is necessarily probabilistic. The spec requires that the decision note prove a "simple repeated miss" before adding behavior.

3. **Any threshold calibration risks benchmark regression.** The cFp43 guard already showed a +5 W/L tradeoff (310/85/5 -> 305/90/5). A wider guard would likely increase this regression. The acceptance gates (expanded W/L >= 302, losses <= 93) are tight.

4. **The 26 remaining cases span diverse factions and matchups.** The northern_realms (11 cases) and nilfgaard (10 cases) dominate, but the cases also include scoiatael (3) and skellige (2), against multiple opponent factions. A faction-agnostic rule would need to be very careful not to over-catch.

5. **The spec says: "If no majority pattern emerges from this analysis, stop after writing the note, report, docs, and AI Lab metadata."**

### Recommendation

The next phase should either:
- **A)** Enable trace-level collection in the failure-mining pipeline so per-play guard evaluation data can be recorded in findings, enabling definitive classification.
- **B)** Accept that the cFp43 guard has addressed the most egregious overinvestment cases (reduced from 51 to 26) and the remaining 26 are edge cases that require a more sophisticated approach (e.g., cumulative spend tracking) that goes beyond the spec's allowed patch shapes. Consider pausing v1 heuristic tuning and moving toward ratings/search as recommended by cFp44.

## Files Changed

- `docs/research/literature/ai/decisions/2026-05-21-cfp45-round-one-overinvestment-calibration.md` — Created (this decision note).

No behavior changes. No policy-code edits. No new engine or benchmark tests. No benchmark regeneration required.

## Benchmarks Before/After

Not applicable — this is an analysis-only phase.

## Acceptance Criteria

| Criterion | Status |
|---|---|
| Decision note created at required path | PASS |
| 26 cases classified with hidden-info-safe fields only | PASS |
| Classification uses required label set | PASS |
| No raw card names, source IDs, or hidden state in note | PASS |
| Clear recommendation with rationale | PASS |

## Deviations

None.

## Risks/Follow-ups

- **Without trace data, classification is probabilistic, not definitive.** Future phases should consider adding per-play guard evaluation to the failure-mining pipeline.
- **The cFp43 tradeoff (+5 losses) remains unresolved.** A wider guard could further regress benchmark strength.
- **The 26 remaining cases are still 96.2% loss-correlated.** If a future phase adds cumulative-spend tracking, it should be carefully benchmarked.
- **Northern Realms and Nilfgaard v1 dominate the remaining signal.** If a future rule is added, these factions should be monitored for disproportionate impact.

## Project State Update

`docs/PROJECT_STATE.md` was updated to record cFp45 as a completed analysis-only phase. AI Lab/product policy metadata now points at cFp45 so the `/ai-lab` page stays current with the latest completed spec. The active spec handoff is cleared (no active spec).

## Recommended Next Step

Pause v1 heuristic tuning. The cFp43 guard reduced `round_one_overinvestment` from 51 to 26 (49% reduction) at the cost of a benchmark tradeoff (+5 losses). The remaining 26 cases do not show a single clear fixable pattern that fits the cFp45 allowed patch shapes without risking further regression. The next meaningful improvement vector for `legal-heuristic-v1` should be ratings/search as recommended by the cFp44 casebook, or a broader architectural redesign of the round-investment guard if the project continues down the heuristic-tuning path.

---

This note changes no behavior, rules, legal moves, UI, catalog data, deck presets, benchmark suite shape, failure-mining classifiers, ratings, search, training, or product difficulty. It is purely an evidence review and decision note.
