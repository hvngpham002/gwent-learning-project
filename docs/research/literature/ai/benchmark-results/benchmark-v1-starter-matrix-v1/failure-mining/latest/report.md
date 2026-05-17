# Benchmark Failure Mining Report

## Run

- suite id: benchmark-v1-starter-matrix-v1
- benchmark run id: benchmark-v1-starter-matrix-v1:latest
- schema: benchmark-failure-mining-v1
- record count: 120
- finding count: 388
- generated at: benchmark-v1-starter-matrix-v1:latest (deterministic run metadata, not wall-clock time)

## Finding Counts By Severity

| Severity | Count |
|---|---:|
| warning | 223 |
| watch | 165 |
| info | 0 |

## Finding Counts By Kind

| Kind | Count |
|---|---:|
| matchup_skew | 2 |
| deck_skew | 1 |
| round_one_overinvestment | 10 |
| round_three_low_resource | 34 |
| suspicious_pass | 315 |
| weathered_row_play | 21 |
| medic_timing_risk | 5 |
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
| warning | medic_timing_risk | legal-heuristic-v1 | 1 | legal-heuristic-v1 selected a play with weak Medic timing signals. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |
| warning | round_one_overinvestment | legal-heuristic-v1 | 1 | legal-heuristic-v1 spent many cards in round 1 and did not win the match. |

## Deferred Signals

| Kind | Reason |
|---|---|
| leader_underuse | Current safe trace data does not expose consecutive legal leader availability by turn; keep this deferred until a public step-level leader-availability summary exists. |

## Hidden-Info Boundary

This report is derived from public benchmark records plus in-memory headless diagnostics. It writes only public IDs, aggregate counts, rates, booleans, and bucket labels; raw engine/debug payloads and private zone contents are not part of this artifact contract.
