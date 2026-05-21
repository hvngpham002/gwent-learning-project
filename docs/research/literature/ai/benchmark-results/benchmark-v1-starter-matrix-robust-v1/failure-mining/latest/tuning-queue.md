# Benchmark Failure-Mining Tuning Queue

## Source

- suite id: benchmark-v1-starter-matrix-robust-v1
- benchmark run id: benchmark-v1-starter-matrix-robust-v1:latest
- schema: benchmark-failure-mining-v1
- record count: 1000
- finding count: 2301
- calibrated suspicious-pass findings: 1752
- suppressed broad suspicious-pass candidates: 920

## Ranked Queue

| Rank | Cluster | Severity | Finding count | Affected factions | Recommendation |
|---:|---|---|---:|---|---|
| 1 | round_resource_exhaustion | warning | 297 | monsters, nilfgaard, northern_realms, scoiatael, skellige | Analyze round-one guard telemetry and weak round-three resources before changing broad pass behavior; this cluster has direct policy implications across early overinvestment and weak round-three resources. |
| 2 | weathered_row_low_tempo | warning | 240 | monsters, nilfgaard, northern_realms, scoiatael, skellige | Review weather-adjusted unit placement for cases where printed medium/high strength collapses to low or no effective tempo. |
| 3 | medic_no_target_timing | warning | 11 | nilfgaard, northern_realms, scoiatael | Review Medic timing thresholds where no-target or weak-target diagnostics still allow a Medic play. |
| 4 | skellige_matchup_skew | warning | 129 | monsters, nilfgaard, northern_realms, scoiatael, skellige | Keep Skellige matchup and deck skew visible, but require behavior evidence before making faction-specific policy changes. |
| 5 | remaining_suspicious_pass | warning | 1752 | monsters, nilfgaard, northern_realms, scoiatael, skellige | Inspect only calibrated pass contradictions; do not tune against suppressed preserve-future-hand, sacrifice, stop-loss, or voluntary-safe passes. |

## Suppressed Analyzer Noise

| Suspicious-pass suppression category | Count |
|---|---:|
| preserve_future_hand_pass | 145 |
| sacrifice_round_pass | 0 |
| voluntary_safe_pass | 0 |
| stop_loss_pass | 51 |
| round_one_overinvestment_pass | 703 |
| insufficient_context | 21 |

## Recommended Next Scope

Next behavior phase should analyze round-resource exhaustion evidence before behavior tuning, not suspicious-pass broadly.

## Hidden-Info Boundary

This queue is derived from public benchmark IDs and aggregate failure-mining findings only. It contains no raw engine state, command logs, private-zone arrays, runtime card instance IDs, or hidden hand card names.
