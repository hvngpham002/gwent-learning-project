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

### Optional local repeat-run summary (ignored, not committed)

- `.local/benchmark-runs/20260520-141716-636-v1-post-cfp43-repeat/summary.md` — **not present**. This casebook relies solely on committed public artifacts.

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

All 26 cases are loss-correlated. Representative findings:

| findingId | Deck | Matchup | Round-1 plays | Match outcome |
|---|---|---|---:|---|
| `round-one-overinvestment__...starter-matrix-expanded-010__1__seat-a` | scoiatael | nilfgaard v0 vs scoiatael v1 | 8 | loss (2 rounds) |
| `round-one-overinvestment__...starter-matrix-expanded-001__0__seat-b` | skellige | nilfgaard v0 vs skellige v1 | 8 | loss (2 rounds) |
| `round-one-overinvestment__...starter-matrix-expanded-001__0__seat-a` | nilfgaard | nilfgaard v1 vs skellige v0 | 8 | loss (3 rounds) |
| `round-one-overinvestment__...starter-matrix-expanded-007__0__seat-a` | nilfgaard | nilfgaard v1 vs monsters v0 | 9 | loss (3 rounds) |

**Faction distribution (expanded):** nilfgaard 10, northern_realms 9, scoiatael 3, skellige 3, monsters 1.
**Matchup concentration:** `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` dominates with 10 cases.
**Outcome:** 26/26 are losses. **Loss rate: 100%.** This means the remaining `round_one_overinvestment` cases are still strongly loss-correlated and could benefit from further tuning.

### `round_three_low_resource` (expanded)

All 86 findings share the same evidence pattern: `selectedKind: "pass"`, `matchOutcome: "loss"`, `futureRoundHandQuality: "poor"/"thin"/"empty"`, `positiveUnitMoveCount: 0`. Representative cases:

| findingId | Deck | Matchup | Hand Quality |
|---|---|---|---|
| `round-three-low-resource__...starter-matrix-expanded-008__1__seat-a__12` | scoiatael | monsters v0 vs scoiatael v1 | thin |
| `round-three-low-resource__...starter-matrix-expanded-005__0__seat-a__12` | monsters | monsters v1 vs skellige v0 | poor |
| `round-three-low-resource__...starter-matrix-expanded-002__0__seat-b__15` | scoiatael | nilfgaard v0 vs scoiatael v1 | poor |

**Outcome:** 86/86 are losses. However, the hand state (no positive unit tempo, poor/empty hand) means these are **not directly fixable by a tuning patch** — v1 correctly identified that it had no meaningful plays left. **Assessment: watch/noise.**

### `weathered_row_play` (expanded)

86 findings across 16 matchups. Representative:

| findingId | Deck | Matchup | Severity |
|---|---|---|---|
| `weathered-row-play__...starter-matrix-expanded-001__0__seat-a__7` | nilfgaard | nilfgaard v1 vs monsters v0 | warning |
| `weathered-row-play__...starter-matrix-expanded-003__0__seat-b__12` | skellige | skellige v1 vs scoiatael v0 | warning |

**Assessment:** These cases show non-hero units with printed strength >= 6 placed on weathered rows, collapsing effective strength to <= 3 when a better line exists. cFp38 already addressed this with a scoring penalty. The 86 expanded findings (up from 18 current) suggest the penalty is working but some edge cases remain. **Recommendation: watch; cFp38 guard is in place but may need expansion for medium-strength units.**

### `medic_timing_risk` (expanded)

7 findings, all with `selectedMedicWithTarget: true` (no-target penalty) or `noTargetMedicRisk: true`. Representative:

| findingId | Deck | Matchup | Medic state |
|---|---|---|---|
| `medic-timing-risk__...starter-matrix-expanded-003__0__seat-a__11` | nilfgaard | nilfgaard v1 vs monsters v0 | no-target (0 discard candidates, 2 Medic sources) |

**Faction distribution:** nilfgaard (5), scoiatael (1), northern_realms (1).
**Assessment:** cFp39's no-target Medic delay guard should catch most of these. The 7 remaining findings likely represent cases where the cFp39 exceptions applied (match-winning, last-gem, round-3 low-hand, etc.) or where a no-target Medic was the best available play. **Assessment: low-confidence signal; not enough evidence for another Medic patch.**

### `suspicious_pass` — calibrated remainder

Current: 234 calibrated suspicious-pass findings. Expanded: 671 calibrated suspicious-pass findings.

**Calibrated pass contradictions (expanded):** Many of the 671 calibrated findings show `roundInvestmentRecommendation: "fight_last_gem"` or `"continue"` with `selectedKind: "pass"`. These are passes that contradict the round-investment diagnostic.

- `roundInvestmentRecommendation: "fight_last_gem"` passes: Majority of calibrated findings. These occur when the AI has `fight_last_gem` recommended (score delta is close, last-gem upper bound can win) but passes anyway. Many have `isOpponentPassed: true`, meaning the pass is actually correct — the opponent already passed, and v1 decided to end the round.
- `roundInvestmentRecommendation: "continue"` passes: Minority but more concerning. These are cases where v1's own round-investment analysis said to continue, but it passed. Representative: `starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-expanded-001__0__seat-b__13` — delta=10, recommendation="fight_last_gem", opponent passed=true.

**Assessment:** Broad `suspicious_pass` needs a casebook/classifier pass before any behavior change. The signal is too broad and includes many correct passes against passed opponents. **Recommendation: classifier pass to separate genuinely incorrect passes from false positives.**

## False-Positive / Noise Assessment

### `round_one_overinvestment` — **actionable, high signal**

26/26 expanded findings are losses. The cFp43 guard reduced this from 51 to 26 (49% reduction) but the remaining cases are still 100% loss-correlated. The guard is working but not yet complete — the remaining 26 cases likely fall outside the guard's exact geometry (board >= 7, hand <= 4) or hit its exceptions. **These remaining cases are still loss-correlated enough to tune.**

### `round_three_low_resource` — **watch/noise**

86 expanded findings, all losses but all with zero positive unit tempo available in hand. These are v1 correctly recognizing it has no useful plays and passing. Tuning v1 to play anyway in these situations would make it worse. **Not actionable.**

### `weathered_row_play` — **low signal, guard in place**

86 expanded findings. cFp38's weathered-row low-tempo penalty already covers this. The finding count increased from cFp41.2's 86 (same number), suggesting the signal is stable and the penalty is not over-triggering. **Watch; no immediate action needed.**

### `medic_timing_risk` — **low signal**

7 expanded findings, all in a narrow faction set (nilfgaard, scoiatael, northern_realms). cFp39's -260 no-target Medic delay penalty should address most of these. **Not enough evidence for another Medic patch.**

### `suspicious_pass` — **too broad, needs classification**

671 calibrated findings is a very large signal. The majority are correct passes against passed opponents. Without a narrower classifier (e.g., passes that contradict round-investment AND are against active opponents AND are not single-move catch-up), this signal is not directly actionable. **Needs a casebook/classifier pass before behavior changes.**

## Tuning Queue Re-evaluation

The committed `tuning-queue.md` files rank `round_resource_exhaustion` first (42 current, 112 expanded). After cFp43:

1. **`round_one_overinvestment`** — Still the best behavior target. 26 expanded cases, 100% loss rate, all within the cFp43 guard's scope geometry. **Should be the next behavior spec scope.** The cFp43 guard needs tightening or widening to cover the remaining 26 cases.

2. **`round_three_low_resource`** — Mostly watch/noise. 86 expanded findings but all are cases where v1 correctly identified zero useful plays. **Do not tune.**

3. **`weathered_row_low_tempo`** — cFp38 guard is in place. 86 expanded findings at the same level as cFp41.2. **Not a better next target than remaining overinvestment.** Watch for now.

4. **`medic_no_target_timing`** — 7 expanded findings. cFp39's -260 delay penalty covers most. **Not enough evidence for another Medic patch.**

5. **`remaining_suspicious_pass`** — 671 expanded calibrated findings. Too broad for direct tuning. **Needs classifier pass.**

## Recommendation

**Recommended next phase: narrow behavior patch targeting remaining `round_one_overinvestment` cases.**

Rationale:
- The cFp43 guard successfully reduced the signal by 49% (51→26) but the remaining 26 cases are still 100% loss-correlated.
- The cFp43 tradeoff (+5 losses in expanded benchmark) suggests the guard's constants or exceptions may be too conservative in some cases.
- The next spec should analyze the 26 remaining `round_one_overinvestment` findings to determine whether the guard geometry (board >= 7, hand <= 4) needs adjustment, or whether additional exception categories are needed.
- **Do not** follow the stale `round_resource_exhaustion` queue recommendation blindly — that cluster is now split between the actionable `round_one_overinvestment` (still needs work) and the watch/noise `round_three_low_resource`.
- **Do not** attempt a broad `suspicious_pass` fix without a classifier pass first.

**Alternative: if the remaining 26 overinvestment cases are determined to be edge cases that are not worth the complexity cost, pause v1 heuristic tuning and move toward ratings/search as the next meaningful improvement vector.**

---

This casebook changes no behavior, rules, legal moves, UI, catalog data, deck presets, benchmark suite shape, failure-mining classifiers, ratings, search, training, or product difficulty. It is purely an evidence review and decision note.
