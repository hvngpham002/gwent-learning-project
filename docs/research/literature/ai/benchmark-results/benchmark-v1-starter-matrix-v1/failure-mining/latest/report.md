# Benchmark Failure Mining Report

## Run

- suite id: benchmark-v1-starter-matrix-v1
- benchmark run id: benchmark-v1-starter-matrix-v1:latest
- schema: benchmark-failure-mining-v1
- record count: 120
- finding count: 300
- generated at: benchmark-v1-starter-matrix-v1:latest (deterministic run metadata, not wall-clock time)

## Finding Counts By Severity

| Severity | Count |
|---|---:|
| warning | 227 |
| watch | 73 |
| info | 0 |

## Finding Counts By Kind

| Kind | Count |
|---|---:|
| matchup_skew | 2 |
| deck_skew | 1 |
| round_one_overinvestment | 9 |
| round_three_low_resource | 34 |
| suspicious_pass | 228 |
| weathered_row_play | 22 |
| medic_timing_risk | 4 |
| leader_underuse | 0 |
| max_steps | 0 |
| policy_failed | 0 |
| engine_error | 0 |
| replay_failed | 0 |

## Top Findings

| Severity | Kind | Scope | Count | Message |
|---|---|---|---:|---|
| warning | matchup_skew | legal-heuristic-v1 | 6 | legal-heuristic-v1 has a low win rate in starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0. |
| warning | medic_timing_risk | legal-heuristic-v1 | 1 | legal-heuristic-v1 selected a play with weak Medic timing signals. |
| warning | medic_timing_risk | legal-heuristic-v1 | 1 | legal-heuristic-v1 selected a play with weak Medic timing signals. |
| warning | medic_timing_risk | legal-heuristic-v1 | 1 | legal-heuristic-v1 selected a play with weak Medic timing signals. |
| warning | medic_timing_risk | legal-heuristic-v1 | 1 | legal-heuristic-v1 selected a play with weak Medic timing signals. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_three_low_resource | legal-heuristic-v1 | 1 | legal-heuristic-v1 reached round 3 with weak aggregate resources. |
| warning | round_three_low_resource | legal-heuristic-v1 | 1 | legal-heuristic-v1 reached round 3 with weak aggregate resources. |

## Suppressed Analyzer Noise

| Suspicious-pass suppression category | Count |
|---|---:|
| preserve_future_hand_pass | 65 |
| sacrifice_round_pass | 0 |
| voluntary_safe_pass | 0 |
| stop_loss_pass | 24 |
| insufficient_context | 1 |

## Tuning Queue

| Rank | Cluster | Severity | Count | Recommendation |
|---:|---|---|---:|---|
| 1 | round_resource_exhaustion | warning | 43 | Tune round investment and future-hand valuation before changing broad pass behavior; this cluster has direct policy implications across early overinvestment and weak round-three resources. |
| 2 | weathered_row_low_tempo | watch | 22 | Review weather-adjusted unit placement for cases where printed medium/high strength collapses to low or no effective tempo. |
| 3 | medic_no_target_timing | warning | 4 | Review Medic timing thresholds where no-target or weak-target diagnostics still allow a Medic play. |
| 4 | skellige_matchup_skew | warning | 26 | Keep Skellige matchup and deck skew visible, but require behavior evidence before making faction-specific policy changes. |
| 5 | remaining_suspicious_pass | warning | 228 | Inspect only calibrated pass contradictions; do not tune against suppressed preserve-future-hand, sacrifice, stop-loss, or voluntary-safe passes. |

## Deferred Signals

| Kind | Reason |
|---|---|
| leader_underuse | Current safe trace data does not expose consecutive legal leader availability by turn; keep this deferred until a public step-level leader-availability summary exists. |

## Hidden-Info Boundary

This report is derived from public benchmark records plus in-memory headless diagnostics. It writes only public IDs, aggregate counts, rates, booleans, and bucket labels; raw engine/debug payloads and private zone contents are not part of this artifact contract.
