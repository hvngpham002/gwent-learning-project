# Benchmark Failure Mining Report

## Run

- suite id: benchmark-v1-starter-matrix-expanded-v1
- benchmark run id: benchmark-v1-starter-matrix-expanded-v1:latest
- schema: benchmark-failure-mining-v1
- record count: 400
- finding count: 878
- generated at: benchmark-v1-starter-matrix-expanded-v1:latest (deterministic run metadata, not wall-clock time)

## Finding Counts By Severity

| Severity | Count |
|---|---:|
| warning | 637 |
| watch | 241 |
| info | 0 |

## Finding Counts By Kind

| Kind | Count |
|---|---:|
| matchup_skew | 2 |
| deck_skew | 0 |
| round_one_overinvestment | 26 |
| round_three_low_resource | 86 |
| suspicious_pass | 671 |
| weathered_row_play | 86 |
| medic_timing_risk | 7 |
| leader_underuse | 0 |
| max_steps | 0 |
| policy_failed | 0 |
| engine_error | 0 |
| replay_failed | 0 |

## Top Findings

| Severity | Kind | Scope | Count | Message |
|---|---|---|---:|---|
| warning | medic_timing_risk | legal-heuristic-v1 | 1 | legal-heuristic-v1 selected a play with weak Medic timing signals. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |

## Suppressed Analyzer Noise

| Suspicious-pass suppression category | Count |
|---|---:|
| preserve_future_hand_pass | 52 |
| sacrifice_round_pass | 0 |
| voluntary_safe_pass | 0 |
| stop_loss_pass | 16 |
| round_one_overinvestment_pass | 290 |
| insufficient_context | 18 |

## Tuning Queue

| Rank | Cluster | Severity | Count | Recommendation |
|---:|---|---|---:|---|
| 1 | round_resource_exhaustion | warning | 112 | Analyze round-one guard telemetry and weak round-three resources before changing broad pass behavior; this cluster has direct policy implications across early overinvestment and weak round-three resources. |
| 2 | weathered_row_low_tempo | warning | 86 | Review weather-adjusted unit placement for cases where printed medium/high strength collapses to low or no effective tempo. |
| 3 | medic_no_target_timing | warning | 7 | Review Medic timing thresholds where no-target or weak-target diagnostics still allow a Medic play. |
| 4 | skellige_matchup_skew | warning | 55 | Keep Skellige matchup and deck skew visible, but require behavior evidence before making faction-specific policy changes. |
| 5 | remaining_suspicious_pass | warning | 671 | Inspect only calibrated pass contradictions; do not tune against suppressed preserve-future-hand, sacrifice, stop-loss, or voluntary-safe passes. |

## Deferred Signals

| Kind | Reason |
|---|---|
| leader_underuse | Current safe trace data does not expose consecutive legal leader availability by turn; keep this deferred until a public step-level leader-availability summary exists. |

## Hidden-Info Boundary

This report is derived from public benchmark records plus in-memory headless diagnostics. It writes only public IDs, aggregate counts, rates, booleans, bucket labels, and scalar round-one guard-state telemetry; raw engine/debug payloads and private zone contents are not part of this artifact contract.
