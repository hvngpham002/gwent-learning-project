# cFp49: Robust Failure-Mining Casebook

Date: 2026-05-21

Phase: Analysis / Hidden-Info-Safe Decision Note (cFp49)

## 1. Source Artifact And Hidden-Info Boundary

This note uses only committed public artifacts. It does not read raw engine
states, command logs, event logs, private observations, hand arrays, deck order,
runtime card instance ids, or hidden hand card names.

| Artifact | Schema |
|---|---|
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/latest/manifest.json` | `benchmark-artifact-v1`, records `benchmark-match-v1`, summary `benchmark-summary-v1` |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/latest/summary.json` | `benchmark-summary-v1` |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/latest/records.jsonl` | `benchmark-match-v1` |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/manifest.json` | `benchmark-failure-mining-v1` |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/summary.json` | `benchmark-failure-mining-v1` |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/findings.jsonl` | `benchmark-failure-mining-v1` rows |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/report.md` | Markdown report over `benchmark-failure-mining-v1` |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/failure-mining/latest/tuning-queue.md` | Markdown queue over `benchmark-failure-mining-v1` |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/latest/ratings.json` | `benchmark-rating-v1` |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/ratings/latest/report.md` | Markdown report over `benchmark-rating-v1` |
| `docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-expanded-v1/failure-mining/latest/summary.json` | `benchmark-failure-mining-v1` |

The robust failure-mining `findings.jsonl` contains public benchmark
identifiers (`suiteId`, `matchupId`, seed, mirror index, policy id, deck preset
id, faction, finding kind, severity) and public aggregate evidence fields
only. The evidence is limited to counts, booleans, rates, row labels, bucketed
strength or hand-quality values, selected move kind, and match outcome when the
finding type writes it.

## 2. Robust Suite Topline

| Item | Value |
|---|---:|
| Robust records | 1000 |
| Completed records | 1000 |
| `legal-heuristic-v1` result vs v0 | 776 win / 206 loss / 18 draw |
| Policy failures | 0 |
| Engine errors | 0 |
| Max-step exits | 0 |
| Replay failures | 0 |
| Failure-mining findings | 2301 |
| Suppressed suspicious-pass findings | 920 |

Top finding kinds:

| Kind | Count |
|---|---:|
| `suspicious_pass` | 1752 |
| `weathered_row_play` | 240 |
| `round_three_low_resource` | 226 |
| `round_one_overinvestment` | 71 |
| `medic_timing_risk` | 11 |
| `matchup_skew` | 1 |

Suppressed suspicious-pass categories:

| Suppression category | Count |
|---|---:|
| `round_one_overinvestment_pass` | 703 |
| `preserve_future_hand_pass` | 145 |
| `stop_loss_pass` | 51 |
| `insufficient_context` | 21 |
| `sacrifice_round_pass` | 0 |
| `voluntary_safe_pass` | 0 |

Robust policy-level rating/RD:

| Policy | Rating | RD | Conservative | Record |
|---|---:|---:|---:|---|
| `legal-heuristic-v1` | 1795.34 | 30.00 | 1735.34 | 776W / 206L / 18D |
| `legal-heuristic-v0` | 1204.66 | 30.00 | 1144.66 | 206W / 776L / 18D |

These ratings are suite-local summaries. They should not be compared against
current or expanded suite ratings as one shared rating universe.

## 3. Expanded-Vs-Robust Rate Comparison

Rates are findings per 100 benchmark records. `suspicious_pass` is a finding
rate because multiple pass findings can occur in one record.

| Finding kind | Expanded count/rate | Robust count/rate | Interpretation |
|---|---:|---:|---|
| `round_one_overinvestment` | 26 / 6.50 | 71 / 7.10 | Stable to slightly higher robust rate. Strong loss correlation remains, but public fields still do not explain cFp43 guard state. |
| `round_three_low_resource` | 86 / 21.50 | 226 / 22.60 | Stable high rate, mostly terminal low-resource states and mostly wins. |
| `weathered_row_play` | 86 / 21.50 | 240 / 24.00 | Slightly higher robust rate; still broad because it lacks cFp38 penalty/exemption state. |
| `medic_timing_risk` | 7 / 1.75 | 11 / 1.10 | Lower robust rate despite more true no-target examples; small sample. |
| `suspicious_pass` | 671 / 167.75 | 1752 / 175.20 | Very high broad finding rate; not directly actionable without narrower pass-state classification. |

## 4. Cluster Classification

| Queue cluster | Label | Public-evidence rationale |
|---|---|---|
| `round_resource_exhaustion` | `needs_trace_instrumentation` | The combined cluster is 297 findings. The `round_one_overinvestment` half is strongly loss-correlated (69 losses, 2 draws), but findings expose only aggregate round-1 play count and match outcome. They do not include cFp43 guard-state fields or exception reasons. The `round_three_low_resource` half is mostly wins with no visible unit tempo, so a direct resource-pass patch would be too broad. |
| `weathered_row_low_tempo` | `analyzer_noise_or_broad_signal` | 240 findings, 197 own-row placements and 43 opponent-row placements, all effective-low. cFp30/cFp38 behavior is already in place, and the artifact does not say whether the cFp38 penalty applied, was exempted, or still lost to a better line. |
| `medic_no_target_timing` | `watch_only` | 11 findings is low volume. Seven are true no-target plays and four are weak-target plays, but the artifact does not expose cFp39 delay-penalty state, useful non-Medic alternatives, or tactical exceptions. |
| `skellige_matchup_skew` | `watch_only` | One watch finding shows `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` at 25/25. A single matchup aggregate is not behavior evidence. |
| `remaining_suspicious_pass` | `analyzer_noise_or_broad_signal` | 1752 findings, but 1347 happen after the opponent passed and 1420 carry `fight_last_gem`. The broad pass signal still mixes correct end-round passes with potentially interesting contradictions. |

## 5. Required Breakdown: Round Resource Exhaustion

The robust queue's `round_resource_exhaustion` cluster is the sum of
`round_one_overinvestment` (71) and `round_three_low_resource` (226).

### `round_one_overinvestment`

| Faction | Count |
|---|---:|
| `nilfgaard` | 32 |
| `northern_realms` | 26 |
| `scoiatael` | 8 |
| `skellige` | 3 |
| `monsters` | 2 |

| Matchup id | Count |
|---|---:|
| `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | 18 |
| `starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0` | 17 |
| `starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0` | 8 |
| `starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0` | 8 |
| `starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1` | 5 |
| `starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1` | 4 |
| `starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1` | 3 |
| `starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1` | 2 |
| `starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0` | 2 |
| `starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1` | 2 |
| `starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0` | 1 |
| `starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0` | 1 |

| `round1PlayCardCount` | Count |
|---:|---:|
| 7 | 25 |
| 8 | 25 |
| 10 | 13 |
| 9 | 6 |
| 11 | 2 |

| `resolvedRoundCount` | Count |
|---:|---:|
| 3 | 45 |
| 2 | 26 |

| `matchOutcome` | Count |
|---|---:|
| `loss` | 69 |
| `draw` | 2 |

| Severity | Count |
|---|---:|
| `warning` | 44 |
| `watch` | 27 |

Assessment: this sub-signal is behavior-relevant but not behavior-ready. The
robust suite confirms that remaining round-one overinvestment is durable and
loss-correlated. However, the public finding row still cannot tell whether a
candidate play missed the cFp43 board/hand thresholds, hit a tactical exception,
was a match-winning/catch-up line, or was already intentionally suppressed.
That means cFp50 should collect guard-state telemetry before tuning constants or
exceptions again.

### `round_three_low_resource`

| Faction | Count |
|---|---:|
| `skellige` | 59 |
| `scoiatael` | 58 |
| `monsters` | 57 |
| `nilfgaard` | 33 |
| `northern_realms` | 19 |

| `matchOutcome` | Count |
|---|---:|
| `win` | 184 |
| `loss` | 26 |
| `draw` | 16 |

| `unitCardCount` | Count |
|---:|---:|
| 0 | 185 |
| 1 | 41 |

| `positiveUnitMoveCount` | Count |
|---:|---:|
| 0 | 220 |
| 1 | 6 |

| `selectedKind` | Count |
|---|---:|
| `pass` | 224 |
| `play_card` | 2 |

| `futureRoundHandQuality` | Count |
|---|---:|
| `poor` | 153 |
| `thin` | 41 |
| `empty` | 32 |

| `specialOnlyHand` | Count |
|---|---:|
| `true` | 153 |
| `false` | 73 |

Assessment: `round_three_low_resource` does not support a direct behavior patch.
It is 184 wins, 26 losses, and 16 draws; 220 of 226 rows have zero positive unit
move count; and 224 of 226 selected `pass`. It is useful downstream validation
for round-one resource fixes, not a standalone action surface.

## 6. Required Breakdown: Weathered Row Low Tempo

| `selectedMoveSide` | Count |
|---|---:|
| `own` | 197 |
| `opponent` | 43 |

| `selectedMoveRow` | Count |
|---|---:|
| `close` | 192 |
| `ranged` | 31 |
| `siege` | 17 |

| `selectedPrintedStrengthBucket` | Count |
|---|---:|
| `medium` | 224 |
| `high` | 16 |

| `selectedEffectiveStrengthBucket` | Count |
|---|---:|
| `low` | 240 |

| `candidateWeatheredOwnRowPlayCount` | Count |
|---:|---:|
| 3 | 72 |
| 4 | 48 |
| 2 | 45 |
| 5 | 31 |
| 1 | 24 |
| 6 | 11 |
| 7 | 6 |
| 8 | 3 |

| `candidateWeatheredOpponentRowPlayCount` | Count |
|---:|---:|
| 0 | 197 |
| 1 | 43 |

| Faction | Count |
|---|---:|
| `northern_realms` | 84 |
| `nilfgaard` | 82 |
| `monsters` | 38 |
| `skellige` | 31 |
| `scoiatael` | 5 |

Read:

- 197 of 240 findings are own-row low-tempo placements.
- 43 of 240 are opponent-row placements, all on `close`; those can include
  Spy/weather interaction cases and are not the same action surface as own-row
  low-tempo placement.
- All findings are effective-low, but 224 of 240 are only printed-medium, not
  high printed strength.
- cFp30 weather-aware unit placement and the cFp38 weathered-row low-tempo guard
  are already in the policy. The robust artifact does not expose whether the
  selected move was penalized, exempted, still best after penalty, or selected
  because alternatives were worse.

Conclusion: this is mostly a broad analyzer finding without enough proof for a
new behavior patch. It would need either analyzer calibration or additional
penalty/exemption telemetry before any cFp50 behavior scope.

## 7. Required Breakdown: Medic Timing

| Finding id | Faction | Matchup id | Seed | Mirror | Revive candidates | Best strength | Best value | No-target risk | Selected no-target | Selected kind | Severity | Classification |
|---|---|---|---|---:|---:|---|---|---|---|---|---|---|
| `medic-timing-risk__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-006__1__seat-b__14` | `nilfgaard` | `starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0` | `starter-matrix-robust-006` | 1 | 0 | `none` | `none` | `true` | `true` | `play_card` | `warning` | `true_no_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0__starter-matrix-robust-022__0__seat-a__6` | `nilfgaard` | `starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0` | `starter-matrix-robust-022` | 0 | 0 | `none` | `none` | `true` | `true` | `play_card` | `warning` | `true_no_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-robust-007__0__seat-a__16` | `nilfgaard` | `starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0` | `starter-matrix-robust-007` | 0 | 0 | `none` | `none` | `true` | `true` | `play_card` | `warning` | `true_no_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-robust-010__1__seat-b__10` | `nilfgaard` | `starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0` | `starter-matrix-robust-010` | 1 | 0 | `none` | `none` | `true` | `true` | `play_card` | `warning` | `true_no_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-004__1__seat-b__7` | `nilfgaard` | `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | `starter-matrix-robust-004` | 1 | 0 | `none` | `none` | `true` | `true` | `play_card` | `warning` | `true_no_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-024__1__seat-b__10` | `nilfgaard` | `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | `starter-matrix-robust-024` | 1 | 0 | `none` | `none` | `true` | `true` | `play_card` | `warning` | `true_no_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-robust-022__1__seat-b__10` | `northern_realms` | `starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0` | `starter-matrix-robust-022` | 1 | 0 | `none` | `none` | `true` | `true` | `play_card` | `warning` | `true_no_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0__starter-matrix-robust-010__1__seat-b__13` | `nilfgaard` | `starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0` | `starter-matrix-robust-010` | 1 | 1 | `low` | `weak` | `false` | `false` | `play_card` | `watch` | `weak_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-007__1__seat-b__7` | `nilfgaard` | `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` | `starter-matrix-robust-007` | 1 | 1 | `low` | `weak` | `false` | `false` | `play_card` | `watch` | `weak_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-025__1__seat-a__15` | `scoiatael` | `starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1` | `starter-matrix-robust-025` | 1 | 1 | `low` | `weak` | `false` | `false` | `play_card` | `watch` | `weak_target` |
| `medic-timing-risk__legal-heuristic-v1__starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0__starter-matrix-robust-003__1__seat-b__11` | `northern_realms` | `starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0` | `starter-matrix-robust-003` | 1 | 1 | `low` | `weak` | `false` | `false` | `play_card` | `watch` | `weak_target` |

Classification summary:

| Classification | Count |
|---|---:|
| `true_no_target` | 7 |
| `weak_target` | 4 |
| `acceptable_target` | 0 |
| `needs_trace_instrumentation` | 0 |

The robust suite shows more true no-target Medic findings than the expanded
suite, but the absolute volume is still small. It does not by itself justify a
second Medic behavior patch because cFp39 already has a no-target delay guard
and these findings do not expose whether a guard exception or no-useful-line
case applied.

## 8. Required Breakdown: Suspicious Pass

| Round | Count |
|---:|---:|
| 2 | 891 |
| 3 | 658 |
| 1 | 203 |

| `isOpponentPassed` | Count |
|---|---:|
| `true` | 1347 |
| `false` | 405 |

| `roundInvestmentRecommendation` | Count |
|---|---:|
| `fight_last_gem` | 1420 |
| `continue` | 332 |

| `hasSingleMoveCatchUp` | Count |
|---|---:|
| `true` | 1156 |
| `false` | 596 |

| `singleMoveCatchUpIgnored` | Count |
|---|---:|
| `true` | 1156 |
| `false` | 596 |

| `policyUpperBoundCanWinRound` | Count |
|---|---:|
| `true` | 1521 |
| `false` | 231 |

| `fightLastGemUpperBoundCanWin` | Count |
|---|---:|
| `true` | 1236 |
| `false` | 516 |

| `stopLossRecommended` | Count |
|---|---:|
| `false` | 1752 |

| `activeVoluntaryUnsafe` | Count |
|---|---:|
| `false` | 1469 |
| `true` | 283 |

| Score-delta bucket | Count |
|---|---:|
| `1..10` | 1028 |
| `11..20` | 271 |
| `>= 21` | 180 |
| `-10..-1` | 113 |
| `-20..-11` | 64 |
| `<= -21` | 59 |
| `0` | 37 |

Additional split:

| Subset | `fight_last_gem` | `continue` | Total |
|---|---:|---:|---:|
| Opponent already passed | 1145 | 202 | 1347 |
| Opponent active | 275 | 130 | 405 |

Conclusion: do not tune broad `suspicious_pass` in cFp50. The robust data does
show 405 active-opponent cases, but the finding rows still do not provide enough
context to separate an actual contradiction from an intentional pass path,
especially because 1347 findings already occur after the opponent has passed.
This signal is better treated as analyzer scope, not policy behavior.

## 9. Required Breakdown: Matchup Skew

The robust artifact has one `matchup_skew` finding:

| Field | Value |
|---|---|
| Finding id | `matchup-skew__legal-heuristic-v1__starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0__watch-win-rate` |
| Matchup | `starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0` |
| Policy | `legal-heuristic-v1` |
| Records | 50 |
| Win rate | 0.50 |
| Loss rate | 0.50 |
| Draw rate | 0.00 |
| Severity | `watch` |

Cross-reference against robust ratings:

| Rating scope | Rating / RD | Record |
|---|---:|---|
| `legal-heuristic-v1` overall | 1795.34 / 30.00 | 776W / 206L / 18D |
| `legal-heuristic-v1 / official-nilfgaard-starter` | 1787.63 / 36.52 | 156W / 44L / 0D |
| `legal-heuristic-v1 / official-skellige-starter` | 1782.50 / 36.52 | 155W / 45L / 0D |
| `legal-heuristic-v0 / official-skellige-starter` | 1438.36 / 36.52 | 87W / 111L / 2D |

This is a real watch item, but it is not evidence for a faction-specific patch.
One break-even matchup aggregate does not explain the policy decision state, and
ratings remain suite-local fixed-matrix summaries rather than product difficulty
or general strategic proof.

## 10. Decision And Next Phase Recommendation

Recommended cFp50 scope: **trace instrumentation for failure-mining guard-state
telemetry**, centered on the remaining `round_one_overinvestment` signal.

The robust suite confirms that round-one overinvestment remains the most
behavior-relevant signal: 71 findings, 69 losses, 2 draws, and a stable rate
relative to the expanded suite. It is still the only queue item with a clear
connection to a past behavior patch and a loss-correlated outcome. However, the
public artifact fields are not enough to support another safe behavior patch.
cFp45 already showed that aggregate public fields cannot distinguish threshold
misses from cFp43 exceptions, and the cFp48 robust artifact keeps the same
limitation at larger volume.

cFp50 should therefore add hidden-info-safe public diagnostics to the failure
mining artifact or companion trace summaries before changing behavior. Useful
fields would be guard-state summaries such as cFp43 recommendation/reason,
board-after and hand-after buckets, selected move tactical exception flags,
single-move catch-up/match-winning state, and whether an intentional
round-one-overinvestment pass was suppressed. The fields should remain public
aggregate booleans/buckets, not card identities or raw state.

Other candidates are not chosen:

- `round_three_low_resource`: mostly wins and almost always no positive unit
  tempo, so direct tuning would likely replay the cFp36 broad resource-gate
  mistake.
- `weathered_row_low_tempo`: frequent but broad; cFp30/cFp38 behavior is
  already present, and the artifact lacks penalty/exemption state.
- `medic_no_target_timing`: low volume; it needs cFp39 guard-state context
  before another Medic patch.
- `remaining_suspicious_pass`: too broad; 1347 of 1752 findings occur after the
  opponent already passed.
- `skellige_matchup_skew`: one watch aggregate is not enough evidence for a
  faction-specific behavior patch.
- Ratings/search/evaluation ladder work remains valuable, but if the next goal
  is another v1 behavior decision, the immediate blocker is missing trace-level
  guard-state evidence rather than benchmark volume.

This cFp49 phase changes no AI policy behavior, engine rules, legal moves,
benchmark suite definitions, failure-mining classifiers, rating formulas,
catalog data, deck presets, or product gameplay UI.
