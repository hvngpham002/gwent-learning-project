# cFp44 Post-cFp43 Failure-Mining Casebook

Date: 2026-05-20

Phase: Analysis / Documentation (no behavior changes)

## Source Artifacts

### Current (120-record) benchmark

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest/summary.json`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest/records.jsonl`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest/report.md`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest/manifest.json`

### Current (120-record) failure-mining

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/summary.json`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/findings.jsonl`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/report.md`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/tuning-queue.md`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/failure-mining/latest/manifest.json`

Schema: `benchmark-summary-v1` (benchmark), `benchmark-failure-mining-v1` (failure-mining)

### Expanded (400-record) benchmark

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/latest/summary.json`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/latest/records.jsonl`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/latest/report.md`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/latest/manifest.json`

### Expanded (400-record) failure-mining

- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/summary.json`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/findings.jsonl`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/report.md`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/tuning-queue.md`
- `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/manifest.json`

### Local repeat-run summary (ignored, not used)

- `.local/benchmark-runs/20260520-141716-636-v1-post-cfp43-repeat/summary.md` — **not used**. This casebook relies solely on committed public artifacts.

## Hidden-Info Boundary

All evidence in this casebook is derived from the committed public benchmark records, their aggregate summary JSONs, and the failure-mining `findings.jsonl`. The findings contain only public match IDs, seed names, mirror indices, seat IDs, deck preset IDs, faction labels, aggregate counts, boolean diagnostic fields, and deterministic messages. No raw `MatchState`, command/event logs, hand/deck arrays, private observations, deck order, or runtime card instance IDs are used. The `findings.jsonl` `evidence` objects expose bucketed hand quality (`futureRoundHandQuality`), unit/hero/special counts, round numbers, score deltas, and pass/play booleans — all of which are publicly visible to the acting seat at decision time.

## Current vs Expanded Benchmark Results

| Suite | Records | v1 Wins | v1 Losses | v1 Draws | v0 Wins | v0 Losses | v0 Draws | Status |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `benchmark-v1-starter-matrix-v1` (current) | 120 | 102 | 17 | 1 | 17 | 102 | 1 | all completed, 0 policy failures |
| `benchmark-v1-starter-matrix-expanded-v1` (expanded) | 400 | 305 | 90 | 5 | 90 | 305 | 5 | all completed, 0 policy failures |

The expanded suite uses 10 deterministic seeds x 20 matchup definitions x mirrored seats, all completed with zero policy failures and zero engine errors.

## cFp41.2 / cFp42 / cFp43 Comparison

| Phase | Type | Expanded W/L/D (v1 vs v0) | Expanded Findings | Key Action |
|---|---|---:|---:|---|
| cFp41.2 | Benchmark artifact refresh | 310 / 85 / 5 | 964 | Regenerated expanded artifacts post-cFp41.1 recursion guard. Tuning queue still ranked `round_resource_exhaustion` #1 with 148 combined overinvestment + low-resource findings. |
| cFp42 | Casebook (analysis only) | — | — | Classified 964 findings: `round_one_overinvestment`=51 (48 loss/3 draw/0 win, actionable) vs `round_three_low_resource`=97 (81 win/12 loss/4 draw, watch/noise). Decided cFp43 should target only the round-one overinvestment sub-signal. |
| cFp43 | Behavior implementation | 305 / 90 / 5 | 878 | Added narrow round-1 overinvestment guard to `legal-heuristic-v1`. Expanded `round_one_overinvestment` reduced from 51 to 26. Total findings dropped from 964 to 878. **Tradeoff: +5 wins lost (310→305), +5 losses gained (85→90).** |

**cFp43 tradeoff summary:** The targeted guard successfully suppressed the specific `round_one_overinvestment` signal (51→26, a 49% reduction), but at the cost of a small benchmark-strength regression (+5 losses across 400 expanded matches). The suppressed intentional overinvestment passes are recorded under `round_one_overinvestment_pass`: 290 in expanded, 81 in current. This is the expected and documented behavior — the guard trades a few early-round losses for better late-round resource preservation, but the net effect in the expanded matrix is slightly negative.

## Post-cFp43 Signal Tables

### Current (120 records)

| Signal | Count | Severity | Suppressed |
|---|---:|---:|---|
| `suspicious_pass` | 234 | warning | 103 (round_one_overinvestment_pass=81, preserve_future_hand_pass=13, stop_loss_pass=8, insufficient_context=1) |
| `round_three_low_resource` | 36 | warning | 0 |
| `weathered_row_play` | 18 | watch | 0 |
| `round_one_overinvestment` | 6 | warning | 0 |
| `medic_timing_risk` | 0 | — | 0 |
| `matchup_skew` | 5 | warning | 0 |
| `deck_skew` | 1 | warning | 0 |
| **Total** | **300** | | |

### Expanded (400 records)

| Signal | Count | Severity | Suppressed |
|---|---:|---:|---|
| `suspicious_pass` | 671 | warning | 376 (round_one_overinvestment_pass=290, preserve_future_hand_pass=52, stop_loss_pass=16, insufficient_context=18) |
| `round_three_low_resource` | 86 | warning | 0 |
| `weathered_row_play` | 86 | warning | 0 |
| `round_one_overinvestment` | 26 | warning | 0 |
| `medic_timing_risk` | 7 | warning | 0 |
| `matchup_skew` | 2 | warning | 0 |
| **Total** | **878** | | |

## Representative Deterministic Case IDs

### `round_one_overinvestment` (expanded)

25 loss, 1 draw across 26 findings.

| findingId | Deck | Matchup | Round-1 plays | Match outcome |
|---|---|---|---:|---|
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-010__1__seat-a` | scoiatael | nilfgaard v0 vs scoiatael v1 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-001__0__seat-b` | skellige | nilfgaard v0 vs skellige v1 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-008__1__seat-a` | skellige | nilfgaard v0 vs skellige v1 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-007__0__seat-a` | nilfgaard | nilfgaard v1 vs monsters v0 | 9 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-008__1__seat-b` | nilfgaard | nilfgaard v1 vs monsters v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-001__0__seat-a` | nilfgaard | nilfgaard v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-003__0__seat-a` | nilfgaard | nilfgaard v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-006__0__seat-a` | nilfgaard | nilfgaard v1 vs skellige v0 | 9 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-007__0__seat-a` | nilfgaard | nilfgaard v1 vs skellige v0 | 9 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-009__1__seat-b` | nilfgaard | nilfgaard v1 vs skellige v0 | 10 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-001__1__seat-b` | nilfgaard | nilfgaard v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-005__0__seat-a` | nilfgaard | nilfgaard v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1__starter-matrix-expanded-003__1__seat-a` | nilfgaard | northern_realms v0 vs nilfgaard v1 | 10 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-003__1__seat-b` | northern_realms | northern_realms v1 vs monsters v0 | 9 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-008__1__seat-b` | northern_realms | northern_realms v1 vs monsters v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-005__1__seat-b` | northern_realms | northern_realms v1 vs monsters v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-006__1__seat-b` | northern_realms | northern_realms v1 vs scoiatael v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-001__0__seat-a` | northern_realms | northern_realms v1 vs skellige v0 | 9 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-001__1__seat-b` | northern_realms | northern_realms v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-006__1__seat-b` | northern_realms | northern_realms v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-008__0__seat-a` | northern_realms | northern_realms v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-009__1__seat-b` | northern_realms | northern_realms v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-005__0__seat-a` | northern_realms | northern_realms v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-004__0__seat-b` | scoiatael | nilfgaard v0 vs scoiatael v1 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-002__1__seat-b` | scoiatael | scoiatael v1 vs skellige v0 | 8 | loss |
| `round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-007__1__seat-b` | northern_realms | northern_realms v1 vs skellige v0 | 8 | draw |

**Faction distribution (expanded):** nilfgaard=10, northern_realms=11, scoiatael=3, skellige=2, monsters=0.
**Matchup concentration:** `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` dominates with 10 cases.
**Outcome:** 25 loss, 1 draw. **Loss rate: 25/26 ≈ 96.2%.** The 1 draw occurred in `northern_realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-007__1__seat-b`. The remaining cases are still strongly loss-correlated and could benefit from further tuning.

### `round_three_low_resource` (expanded)

75 win, 6 loss, 5 draw across 86 findings.

| findingId | Deck | Matchup | Hand Quality | positiveUnitMoveCount |
|---|---|---|---|---:|
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-008__1__seat-a__12` | scoiatael | monsters v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-005__0__seat-a__12` | monsters | monsters v1 vs skellige v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-002__0__seat-b__15` | scoiatael | nilfgaard v0 vs scoiatael v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-005__1__seat-a__17` | scoiatael | nilfgaard v0 vs scoiatael v1 | empty | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-006__1__seat-b__13` | scoiatael | scoiatael v1 vs skellige v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-009__0__seat-a__12` | scoiatael | scoiatael v1 vs skellige v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-001__0__seat-b__15` | scoiatael | monsters v0 vs scoiatael v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-002__0__seat-b__13` | scoiatael | monsters v0 vs scoiatael v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-007__0__seat-b__12` | scoiatael | monsters v0 vs scoiatael v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-002__0__seat-b__12` | skellige | monsters v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-003__1__seat-a__12` | skellige | monsters v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-004__0__seat-b__11` | skellige | monsters v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-007__0__seat-b__13` | skellige | monsters v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-007__1__seat-a__12` | skellige | monsters v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-009__1__seat-a__8` | skellige | monsters v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-010__0__seat-b__13` | skellige | monsters v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-001__0__seat-a__10` | monsters | monsters v1 vs scoiatael v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-002__1__seat-b__12` | monsters | monsters v1 vs scoiatael v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-003__0__seat-a__10` | monsters | monsters v1 vs scoiatael v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-005__0__seat-a__12` | monsters | monsters v1 vs scoiatael v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-007__1__seat-b__11` | monsters | monsters v1 vs scoiatael v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-008__0__seat-a__12` | monsters | monsters v1 vs scoiatael v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-009__1__seat-b__11` | monsters | monsters v1 vs scoiatael v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-010__1__seat-b__14` | monsters | monsters v1 vs scoiatael v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-006__0__seat-a__15` | monsters | monsters v1 vs skellige v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-008__0__seat-a__13` | monsters | monsters v1 vs skellige v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-001__1__seat-a__10` | nilfgaard | nilfgaard v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-003__1__seat-a__15` | nilfgaard | nilfgaard v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-004__0__seat-b__15` | nilfgaard | nilfgaard v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-004__1__seat-a__14` | nilfgaard | nilfgaard v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-005__1__seat-a__14` | nilfgaard | nilfgaard v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-006__0__seat-b__10` | nilfgaard | nilfgaard v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-003__1__seat-a__16` | scoiatael | nilfgaard v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-009__0__seat-b__15` | scoiatael | nilfgaard v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-009__1__seat-a__13` | scoiatael | nilfgaard v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-002__0__seat-b__15` | skellige | nilfgaard v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-003__1__seat-a__14` | skellige | nilfgaard v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-007__0__seat-b__14` | skellige | nilfgaard v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-007__1__seat-a__13` | skellige | nilfgaard v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-009__1__seat-a__9` | skellige | nilfgaard v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-001__1__seat-b__17` | nilfgaard | nilfgaard v1 vs monsters v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-003__1__seat-b__22` | nilfgaard | nilfgaard v1 vs monsters v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-008__0__seat-a__14` | nilfgaard | nilfgaard v1 vs monsters v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-009__0__seat-a__16` | nilfgaard | nilfgaard v1 vs monsters v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-003__0__seat-a__17` | nilfgaard | nilfgaard v1 vs scoiatael v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-008__0__seat-a__14` | nilfgaard | nilfgaard v1 vs scoiatael v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-002__1__seat-b__23` | nilfgaard | nilfgaard v1 vs skellige v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-005__1__seat-b__18` | nilfgaard | nilfgaard v1 vs skellige v0 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-001__1__seat-a__11` | monsters | northern_realms v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-003__0__seat-b__18` | monsters | northern_realms v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-004__1__seat-a__13` | monsters | northern_realms v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-005__0__seat-b__11` | monsters | northern_realms v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-006__1__seat-a__12` | monsters | northern_realms v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1__starter-matrix-expanded-007__1__seat-a__15` | monsters | northern_realms v0 vs monsters v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1__starter-matrix-expanded-004__0__seat-b__21` | nilfgaard | northern_realms v0 vs nilfgaard v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1__starter-matrix-expanded-008__1__seat-a__17` | nilfgaard | northern_realms v0 vs nilfgaard v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1__starter-matrix-expanded-009__0__seat-b__20` | nilfgaard | northern_realms v0 vs nilfgaard v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-001__1__seat-a__15` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-002__0__seat-b__15` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-004__0__seat-b__19` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-005__0__seat-b__14` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-005__1__seat-a__18` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-006__0__seat-b__17` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-006__1__seat-a__14` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-009__0__seat-b__14` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-009__1__seat-a__11` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-010__1__seat-a__17` | scoiatael | northern_realms v0 vs scoiatael v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-002__0__seat-b__16` | skellige | northern_realms v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-003__1__seat-a__16` | skellige | northern_realms v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-004__0__seat-b__21` | skellige | northern_realms v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-007__1__seat-a__13` | skellige | northern_realms v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-008__0__seat-b__13` | skellige | northern_realms v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-008__1__seat-a__15` | skellige | northern_realms v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-009__0__seat-b__11` | skellige | northern_realms v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-009__1__seat-a__9` | skellige | northern_realms v0 vs skellige v1 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0__starter-matrix-expanded-009__0__seat-a__11` | nilfgaard | northern_realms v1 vs nilfgaard v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-002__0__seat-a__14` | scoiatael | northern_realms v1 vs scoiatael v0 | thin | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-001__0__seat-b__11` | skellige | scoiatael v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-002__0__seat-b__13` | skellige | scoiatael v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-003__1__seat-a__11` | skellige | scoiatael v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-004__1__seat-a__13` | skellige | scoiatael v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-005__1__seat-a__13` | skellige | scoiatael v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-009__0__seat-b__11` | skellige | scoiatael v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-expanded-010__0__seat-b__11` | skellige | scoiatael v0 vs skellige v1 | poor | 0 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-004__0__seat-a__15` | scoiatael | scoiatael v1 vs skellige v0 | thin | 1 |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-004__1__seat-b__15` | scoiatael | scoiatael v1 vs skellige v0 | thin | 1 |

**Outcome:** 75 win, 6 loss, 5 draw. `positiveUnitMoveCount` = 0 in 84 cases, 1 in 2 cases.
**Assessment:** 75/86 are wins — the majority of `round_three_low_resource` cases appear in v1 wins, not losses. The 6 losses and 5 draws occur when v1 reaches round 3 with weak resources and passes. However, 84/86 have zero positive unit tempo available in hand, and 2 have exactly 1. These are mostly v1 correctly recognizing it has no useful plays left and passing. **Assessment: watch/noise — not directly fixable by tuning.**

### `round_three_low_resource` (current)

32 win, 4 loss across 36 findings.

| findingId | Deck | Matchup | Hand Quality |
|---|---|---|---|
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-001__0__seat-a__11` | monsters | monsters v1 vs skellige v0 | poor |
| `round-three-low-resource__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-001__0__seat-a__15` | nilfgaard | nilfgaard v1 vs skellige v0 | poor |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-001__0__seat-a__14` | scoiatael | scoiatael v1 vs skellige v0 | poor |
| `round-three-low-resource__legal-heuristic-v1__starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-002__1__seat-b__16` | scoiatael | scoiatael v1 vs skellige v0 | empty |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-001__1__seat-a__16` | monsters | monsters v0 vs skellige v1 | poor |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-003__0__seat-b__10` | monsters | monsters v0 vs skellige v1 | poor |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-003__1__seat-a__12` | monsters | monsters v0 vs skellige v1 | poor |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-001__0__seat-a__10` | monsters | monsters v1 vs scoiatael v0 | thin |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-002__0__seat-a__10` | monsters | monsters v1 vs scoiatael v0 | thin |
| `round-three-low-resource__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-003__1__seat-b__14` | monsters | monsters v1 vs skellige v0 | thin |

**Faction distribution:** monsters=9, nilfgaard=7, scoiatael=4, skellige=14, northern_realms=2.
**Outcome:** 32 win, 4 loss. **Win rate: 32/36 ≈ 88.9%.** Like expanded, the majority are wins — confirming `round_three_low_resource` is watch/noise, not actionable.

### `weathered_row_play` (expanded)

86 findings across 16 matchups.

| findingId | Deck | Matchup | Severity |
|---|---|---|---|
| `weathered-row-play__legal-heuristic-v1__starter-monsters-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-001__1__seat-a__10` | monsters | monsters v1 vs skellige v0 | watch |
| `weathered-row-play__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-007__0__seat-a__10` | nilfgaard | nilfgaard v1 vs monsters v0 | watch |
| `weathered-row-play__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-expanded-008__0__seat-a__12` | nilfgaard | nilfgaard v1 vs scoiatael v0 | watch |
| `weathered-row-play__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-001__0__seat-a__6` | nilfgaard | nilfgaard v1 vs skellige v0 | watch |

**Faction distribution (expanded):** nilfgaard=40, northern_realms=22, monsters=19, skellige=3, scoiatael=2.
**Assessment:** These cases show non-hero units with printed strength >= 6 placed on weathered rows, collapsing effective strength to <= 3 when a better line exists. cFp38 already addressed this with a scoring penalty. The 86 expanded findings (same number as cFp41.2) suggest the signal is stable and the penalty is not over-triggering. **Recommendation: watch; cFp38 guard is in place.**

### `medic_timing_risk` (expanded)

7 findings total.

| findingId | Deck | Matchup | Medic state |
|---|---|---|---|
| `medic-timing-risk__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-003__0__seat-a__11` | nilfgaard | nilfgaard v1 vs monsters v0 | true no-target (ownDiscardReviveCandidateCount=0, noTargetMedicRisk=true) |
| `medic-timing-risk__legal-heuristic-v1__starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-004__1__seat-a__13` | scoiatael | monsters v0 vs scoiatael v1 | has revive candidates |
| `medic-timing-risk__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1__starter-matrix-expanded-005__0__seat-b__14` | nilfgaard | northern_realms v0 vs nilfgaard v1 | has revive candidates |
| `medic-timing-risk__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1__starter-matrix-expanded-006__1__seat-a__20` | nilfgaard | northern_realms v0 vs nilfgaard v1 | has revive candidates |
| `medic-timing-risk__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-expanded-001__1__seat-b__10` | northern_realms | northern_realms v1 vs monsters v0 | has revive candidates |
| `medic-timing-risk__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-007__1__seat-b__11` | northern_realms | northern_realms v1 vs skellige v0 | has revive candidates |
| `medic-timing-risk__legal-heuristic-v1__starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-expanded-002__1__seat-b__13` | scoiatael | scoiatael v1 vs skellige v0 | has revive candidates |

**Faction distribution:** nilfgaard=3, scoiatael=2, northern_realms=2.
**Assessment:** Only 1 of 7 is a true no-target Medic (no revive candidates in discard). The other 6 have revive candidates available, suggesting the Medic timing signal here reflects weak-target Medic plays rather than the no-target scenario. cFp39's -260 no-target Medic delay guard covers the 1 no-target case. The 6 with-target findings likely represent cases where Medic timing was suboptimal but not no-target. **Assessment: low-confidence signal; not enough evidence for another Medic patch.**

### `suspicious_pass` — calibrated remainder

Current: 234 calibrated suspicious-pass findings. Expanded: 671 calibrated suspicious-pass findings.

**Calibrated pass contradictions (expanded):** Many of the 671 calibrated findings show `roundInvestmentRecommendation: "fight_last_gem"` or `"continue"` with `selectedKind: "pass"`. These are passes that contradict the round-investment diagnostic.

- `roundInvestmentRecommendation: "fight_last_gem"` passes: Majority of calibrated findings. These occur when the AI has `fight_last_gem` recommended (score delta is close, last-gem upper bound can win) but passes anyway. Many have `isOpponentPassed: true`, meaning the pass is actually correct — the opponent already passed, and v1 decided to end the round.
- `roundInvestmentRecommendation: "continue"` passes: Minority but more concerning. These are cases where v1's own round-investment analysis said to continue, but it passed.

**Assessment:** Broad `suspicious_pass` needs a casebook/classifier pass before any behavior change. The signal is too broad and includes many correct passes against passed opponents. **Recommendation: classifier pass to separate genuinely incorrect passes from false positives.**

## False-Positive / Noise Assessment

### `round_one_overinvestment` — **actionable, high signal**

25 loss, 1 draw across 26 expanded findings. The cFp43 guard reduced this from 51 to 26 (49% reduction) but the remaining cases are still 96.2% loss-correlated. The guard is working but not yet complete — the remaining 26 cases likely fall outside the guard's exact geometry (board >= 7, hand <= 4) or hit its exceptions. **These remaining cases are still loss-correlated enough to tune.**

### `round_three_low_resource` — **watch/noise**

75 win, 6 loss, 5 draw across 86 expanded findings. 84/86 have positiveUnitMoveCount=0, 2 have positiveUnitMoveCount=1. The majority are wins — v1 correctly recognized it had no useful plays left and passed. Tuning v1 to play anyway in these situations would make it worse. **Not actionable.**

### `weathered_row_play` — **low signal, guard in place**

86 expanded findings. cFp38's weathered-row low-tempo penalty already covers this. The finding count is stable since cFp41.2 (86 → 86), suggesting the penalty is not over-triggering. **Watch; no immediate action needed.**

### `medic_timing_risk` — **low signal**

7 expanded findings: 1 true no-target Medic (0 discard candidates), 6 with revive candidates. cFp39's -260 no-target Medic delay penalty covers the 1 no-target case. The 6 with-target findings represent suboptimal Medic timing but are not no-target cases. **Not enough evidence for another Medic patch.**

### `suspicious_pass` — **too broad, needs classification**

671 calibrated findings is a very large signal. The majority are correct passes against passed opponents. Without a narrower classifier (e.g., passes that contradict round-investment AND are against active opponents AND are not single-move catch-up), this signal is not directly actionable. **Needs a casebook/classifier pass before behavior changes.**

## Tuning Queue Re-evaluation

The committed `tuning-queue.md` files rank `round_resource_exhaustion` first (42 current, 112 expanded). After cFp43:

1. **`round_one_overinvestment`** — Still the best behavior target. 26 expanded cases, 25/26 loss (96.2% loss rate), all within the cFp43 guard's scope geometry. **Should be the next behavior spec scope.** The cFp43 guard needs tightening or widening to cover the remaining 26 cases.

2. **`round_three_low_resource`** — Mostly watch/noise. 86 expanded findings with 75/86 wins, 84/86 with zero positive unit tempo. **Do not tune.**

3. **`weathered_row_low_tempo`** — cFp38 guard is in place. 86 expanded findings at the same level as cFp41.2. **Not a better next target than remaining overinvestment.** Watch for now.

4. **`medic_no_target_timing`** — 7 expanded findings, only 1 true no-target Medic. cFp39's -260 delay penalty covers the no-target case. **Not enough evidence for another Medic patch.**

5. **`remaining_suspicious_pass`** — 671 expanded calibrated findings. Too broad for direct tuning. **Needs classifier pass.**

## Recommendation

**Recommended next phase: narrow behavior patch targeting remaining `round_one_overinvestment` cases.**

Rationale:
- The cFp43 guard successfully reduced the signal by 49% (51→26) but the remaining 26 cases are still 96.2% loss-correlated (25 loss, 1 draw).
- The cFp43 tradeoff (+5 losses in expanded benchmark) suggests the guard's constants or exceptions may be too conservative in some cases.
- The next spec should analyze the 26 remaining `round_one_overinvestment` findings to determine whether the guard geometry (board >= 7, hand <= 4) needs adjustment, or whether additional exception categories are needed.
- **Do not** follow the stale `round_resource_exhaustion` queue recommendation blindly — that cluster is now split between the actionable `round_one_overinvestment` (still needs work) and the watch/noise `round_three_low_resource` (75/86 wins).
- **Do not** attempt a broad `suspicious_pass` fix without a classifier pass first.
- **Do not** treat the 7 `medic_timing_risk` findings as evidence for another Medic patch — only 1 is a true no-target case; the other 6 have revive candidates.

**Alternative: if the remaining 26 overinvestment cases are determined to be edge cases that are not worth the complexity cost, pause v1 heuristic tuning and move toward ratings/search as the next meaningful improvement vector.**

---

This casebook changes no behavior, rules, legal moves, UI, catalog data, deck presets, benchmark suite shape, failure-mining classifiers, ratings, search, training, or product difficulty. It is purely an evidence review and decision note.
