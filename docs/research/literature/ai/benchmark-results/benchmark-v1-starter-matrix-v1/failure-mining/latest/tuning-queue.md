# Benchmark Failure-Mining Tuning Queue

## Source

- suite id: benchmark-v1-starter-matrix-v1
- benchmark run id: benchmark-v1-starter-matrix-v1:latest
- schema: benchmark-failure-mining-v1
- record count: 120
- finding count: 300
- calibrated suspicious-pass findings: 234
- suppressed broad suspicious-pass candidates: 103

## Ranked Queue

| Rank | Cluster | Severity | Finding count | Affected factions | Recommendation |
|---:|---|---|---:|---|---|
| 1 | round_resource_exhaustion | warning | 42 | monsters, nilfgaard, northern_realms, scoiatael, skellige | Analyze round-one guard telemetry and weak round-three resources before changing broad pass behavior; this cluster has direct policy implications across early overinvestment and weak round-three resources. |
| 2 | weathered_row_low_tempo | watch | 18 | monsters, nilfgaard, northern_realms, skellige | Review weather-adjusted unit placement for cases where printed medium/high strength collapses to low or no effective tempo. |
| 3 | skellige_matchup_skew | warning | 31 | monsters, nilfgaard, northern_realms, scoiatael, skellige | Keep Skellige matchup and deck skew visible, but require behavior evidence before making faction-specific policy changes. |
| 4 | remaining_suspicious_pass | warning | 234 | monsters, nilfgaard, northern_realms, scoiatael, skellige | Inspect only calibrated pass contradictions; do not tune against suppressed preserve-future-hand, sacrifice, stop-loss, or voluntary-safe passes. |

## Suppressed Analyzer Noise

| Suspicious-pass suppression category | Count |
|---|---:|
| preserve_future_hand_pass | 13 |
| sacrifice_round_pass | 0 |
| voluntary_safe_pass | 0 |
| stop_loss_pass | 8 |
| round_one_overinvestment_pass | 81 |
| insufficient_context | 1 |

## Recommended Next Scope

Next behavior phase should analyze round-resource exhaustion evidence before behavior tuning, not suspicious-pass broadly.

## Hidden-Info Boundary

This queue is derived from public benchmark IDs and aggregate failure-mining findings only. It contains no raw engine state, command logs, private-zone arrays, runtime card instance IDs, or hidden hand card names.
