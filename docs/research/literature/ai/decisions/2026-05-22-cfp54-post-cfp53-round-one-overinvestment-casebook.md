# cFp54: Post-cFp53 Robust Round-One Overinvestment Casebook

Date: 2026-05-22

Phase: Analysis / Hidden-Info-Safe Decision Note (cFp54)

## Decision

cFp54 does not support a `legal-heuristic-v1` behavior patch.

The cFp53 robust failure-mining artifact contains exactly 70
`round_one_overinvestment` findings for `legal-heuristic-v1` in
`benchmark-v1-starter-matrix-robust-v1`. Applying the cFp54 bucket rules in
order classifies all 70 findings exactly once:

- 48 `already_guarded_suppressed_pass`
- 20 `board_floor_never_reached`
- 1 `base_geometry_exception_or_nonrecommendation`
- 1 `hand_cap_never_reached`
- 0 `cumulative_spend_candidate`
- 0 `telemetry_unavailable_or_other`

The largest bucket is already-guarded suppressed passes. That means the current
cFp43/cFp53 guard is visible in the public telemetry at least once in those
rows; the remaining signal is not an active selected-play contradiction. The
20 board-floor cases and single hand-cap / exception cases also do not provide a
single narrow public rule for a cFp55 behavior change.

Recommendation: cFp55 should be a hidden-info-safe instrumentation/debug phase
only if round-one tuning continues. It should capture public temporal/cumulative
round-one spend fields that are not present in the current case-level artifacts.
Do not widen thresholds or add cumulative budgeting from cFp54 aggregate counts.

## 1. Source Artifacts And Hidden-Info Boundary

This note reads only committed cFp53 public artifacts:

| Artifact | Use |
|---|---|
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/findings.jsonl` | Source rows and scalar evidence |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/summary.json` | Robust failure-mining totals |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/report.md` | Public run context |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/round-one-guard-debug/cFp52/report.md` | Before-fix selected-play contradiction evidence |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/round-one-guard-debug/cFp53/report.md` | Post-fix selected-pass evidence |
| `docs/research/literature/ai/decisions/2026-05-22-cfp51-round-one-guard-telemetry-casebook.md` | Prior aggregate classification |
| `docs/research/literature/ai/decisions/2026-05-22-cfp52-round-one-guard-fixture-debug.md` | Direct fixture reproduction decision |

Hidden-info boundary: this analysis uses only public finding IDs, suite/policy
IDs, deck preset IDs, faction IDs, matchup IDs, match outcomes, and scalar
round-one telemetry fields already present in the cFp53 failure-mining rows. It
does not read or quote raw traces, raw engine state, command logs, event logs,
legal move arrays, final engine state, unsafe debug payloads, private zones,
card names, source IDs, runtime card IDs, instance IDs, action refs, or raw move
labels.

Input validation:

| Filter | Count |
|---|---:|
| `kind === "round_one_overinvestment"` | 70 |
| `policyId === "legal-heuristic-v1"` | 70 |
| `suiteId === "benchmark-v1-starter-matrix-robust-v1"` | 70 |

## 2. Classification Method

Each row was classified by applying the cFp54 rules in this order:

1. `already_guarded_suppressed_pass`
2. `board_floor_never_reached`
3. `hand_cap_never_reached`
4. `base_geometry_exception_or_nonrecommendation`
5. `cumulative_spend_candidate`
6. `telemetry_unavailable_or_other`

The first matching bucket wins. This matters because rows with an intentional
suppressed pass can also have board or hand scalar values that would otherwise
match later buckets. cFp54 treats those as already-guarded rows because the
current guard is already visible in the telemetry.

## 3. Aggregate Results

### Count By Top-Level Bucket

| Bucket | Count | Share |
|---|---:|---:|
| `already_guarded_suppressed_pass` | 48 | 68.6% |
| `board_floor_never_reached` | 20 | 28.6% |
| `hand_cap_never_reached` | 1 | 1.4% |
| `base_geometry_exception_or_nonrecommendation` | 1 | 1.4% |
| `cumulative_spend_candidate` | 0 | 0.0% |
| `telemetry_unavailable_or_other` | 0 | 0.0% |

### Count By Bucket And Match Outcome

| Bucket | Loss | Draw | Win |
|---|---:|---:|---:|
| `already_guarded_suppressed_pass` | 46 | 2 | 0 |
| `board_floor_never_reached` | 20 | 0 | 0 |
| `hand_cap_never_reached` | 1 | 0 | 0 |
| `base_geometry_exception_or_nonrecommendation` | 1 | 0 | 0 |
| `cumulative_spend_candidate` | 0 | 0 | 0 |
| `telemetry_unavailable_or_other` | 0 | 0 | 0 |

### Count By Bucket And Faction

| Bucket | Monsters | Nilfgaard | Northern Realms | Scoia'tael | Skellige |
|---|---:|---:|---:|---:|---:|
| `already_guarded_suppressed_pass` | 2 | 18 | 19 | 6 | 3 |
| `board_floor_never_reached` | 0 | 13 | 7 | 0 | 0 |
| `hand_cap_never_reached` | 0 | 0 | 0 | 1 | 0 |
| `base_geometry_exception_or_nonrecommendation` | 0 | 1 | 0 | 0 | 0 |
| `cumulative_spend_candidate` | 0 | 0 | 0 | 0 | 0 |
| `telemetry_unavailable_or_other` | 0 | 0 | 0 | 0 | 0 |

### Count By Bucket And Deck Preset

| Bucket | Official Monsters | Official Nilfgaard | Official Northern Realms | Official Scoia'tael | Official Skellige |
|---|---:|---:|---:|---:|---:|
| `already_guarded_suppressed_pass` | 2 | 18 | 19 | 6 | 3 |
| `board_floor_never_reached` | 0 | 13 | 7 | 0 | 0 |
| `hand_cap_never_reached` | 0 | 0 | 0 | 1 | 0 |
| `base_geometry_exception_or_nonrecommendation` | 0 | 1 | 0 | 0 | 0 |
| `cumulative_spend_candidate` | 0 | 0 | 0 | 0 | 0 |
| `telemetry_unavailable_or_other` | 0 | 0 | 0 | 0 | 0 |

Deck preset IDs represented by the columns are
`official-monsters-starter`, `official-nilfgaard-starter`,
`official-northern-realms-starter`, `official-scoiatael-starter`, and
`official-skellige-starter`.

### Count By Bucket And Matchup ID

| Matchup ID | A | B | C | D | E | F |
|---|---:|---:|---:|---:|---:|---:|
| `starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1` | 2 | 0 | 0 | 0 | 0 | 0 |
| `starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0` | 4 | 4 | 0 | 0 | 0 | 0 |
| `starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0` | 2 | 0 | 0 | 0 | 0 | 0 |
| `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | 8 | 9 | 0 | 1 | 0 | 0 |
| `starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1` | 2 | 0 | 0 | 0 | 0 | 0 |
| `starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1` | 4 | 0 | 0 | 0 | 0 | 0 |
| `starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1` | 3 | 0 | 1 | 0 | 0 | 0 |
| `starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1` | 3 | 0 | 0 | 0 | 0 | 0 |
| `starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0` | 5 | 3 | 0 | 0 | 0 | 0 |
| `starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0` | 1 | 0 | 0 | 0 | 0 | 0 |
| `starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0` | 13 | 4 | 0 | 0 | 0 | 0 |
| `starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0` | 1 | 0 | 0 | 0 | 0 | 0 |

Legend:

| Code | Bucket |
|---|---|
| A | `already_guarded_suppressed_pass` |
| B | `board_floor_never_reached` |
| C | `hand_cap_never_reached` |
| D | `base_geometry_exception_or_nonrecommendation` |
| E | `cumulative_spend_candidate` |
| F | `telemetry_unavailable_or_other` |

## 4. Bucket-Specific Tables

### Bucket D Sub-Labels

| Sub-label | Count |
|---|---:|
| `exception_single_move_catch_up` | 1 |
| `exception_card_advantage` | 0 |
| `exception_match_winning_play` | 0 |
| `exception_opponent_passed` | 0 |
| `exception_last_gem` | 0 |
| `exception_single_card_hand` | 0 |
| `non_play_card_or_other_exception` | 0 |
| `continue_recommendation` | 0 |
| `unknown_nonrecommendation` | 0 |

### Bucket A Suppressed-Pass Summary

| Metric | Value |
|---|---:|
| Total findings | 48 |
| `round1PlayCardCount` average | 7.85 |
| `round1PlayCardCount` range | 7-11 |
| Total `roundOneSuppressedPassCount` | 48 |
| Total `roundOneRecommendedCount` | 0 |
| Total `roundOneReasonBoardLimitCount` | 48 |
| Total `roundOneReasonLowFutureHandCount` | 0 |

Interpretation: Bucket A rows satisfy the cFp54 already-guarded rule through
suppressed-pass count plus public round-one board-limit reason counts, not
through selected play-card recommendation counts. They are consistent with late
or too-late intervention rather than a remaining cFp53 selected-play bypass.

### Bucket E Candidate Finding IDs

No finding reached Bucket E after applying Buckets A-D in order.

| Finding ID | Candidate scalar fields |
|---|---|
| None | None |

## 5. Patch-Shape Assessment

| Candidate cFp55 shape | Assessment |
|---|---|
| Repeat selected-play guard repair | Rejected. cFp53 debug artifacts show the two direct selected-play contradictions now convert to selected passes, and cFp54 finds zero remaining direct recommendation buckets. |
| Threshold widening | Rejected. The 20 board-floor rows never reached `roundOneBoardFloorReachedCount > 0` or had max board below 7 under the current telemetry, while the one hand-cap row has min hand 5. A threshold patch from these aggregates would be broad and under-supported. |
| Remove or weaken tactical exceptions | Rejected. The only Bucket D row is `exception_single_move_catch_up`; one row does not justify weakening existing exceptions. |
| Cumulative-spend behavior guard | Not behavior-ready. Bucket E has zero rows under the required precedence, and the dominant already-guarded bucket would need temporal/cumulative evidence showing when spending happened relative to the first guard opportunity. |
| Analyzer calibration | Useful later, but not cFp55 behavior. Separating already-guarded late-pass rows from direct contradictions would make future tuning queues clearer. |
| Instrumentation/debug | Recommended if cFp55 continues round-one tuning. The missing evidence is a public temporal spend timeline, not another case-level aggregate. |

## 6. Recommended cFp55 Scope

Recommended next step: cFp55 should be an instrumentation/debug phase, not a
behavior patch.

Missing hidden-info-safe fields to add or debug:

- first round-one play-card decision index
- first decision index where board floor was reached
- first decision index where hand cap was reached
- first decision index where base geometry was reached
- first suppressed-pass decision index
- round-one play-card count before first suppressed pass
- round-one hand count and board count immediately before first suppressed pass
- cumulative selected play-card count while `roundOneRecommendationContinueCount`
  remained active
- count of selected plays after first base-geometry decision and before first
  selected pass
- per-row scalar sequence buckets for score-delta direction before and after the
  first guard-visible pass
- exception sequence counts before first guard-visible pass, especially
  card-advantage and single-move catch-up counts

Non-goals for cFp55 unless that instrumentation proves a narrow public rule:

- no threshold widening
- no cumulative-budget behavior gate
- no exception removal
- no failure-mining classifier change
- no benchmark suite or artifact regeneration for behavior claims
- no engine rule, legal move, UI gameplay, catalog, deck preset, rating,
  search, training, or product difficulty change

cFp54's explicit recommendation is therefore:

```text
Recommend a cFp55 instrumentation/debug phase for temporal/cumulative
round-one spend evidence. Do not implement a cFp55 behavior patch from the
cFp54 aggregate casebook alone.
```
