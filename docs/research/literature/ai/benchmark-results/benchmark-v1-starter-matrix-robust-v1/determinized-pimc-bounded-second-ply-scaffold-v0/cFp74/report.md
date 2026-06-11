# Determinized PIMC Bounded Second-Ply Scaffold v0

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- scaffold run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-bounded-second-ply-scaffold-v0:cFp74
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- readiness: ready_with_over_budget_skips
- source cFp68 run id: benchmark-v1-starter-matrix-robust-v1:determinized-probe-contract:cFp68
- source cFp69 run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-probe-v0:cFp69
- source cFp70 run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-action-availability-v0:cFp70
- source cFp71 run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71
- source cFp72 run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-post-one-ply-branching-budget-v0:cFp72
- source cFp73 run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-post-one-ply-branching-budget-casebook:cFp73

## Cap Policy

| Cap | Value |
|---|---:|
| root second-ply pair cap | 512 |
| root public action cap | 16 |
| post-one-ply public action cap per state | 16 |
| sample count cap per root | 8 |
| robust planned-pair soft cap | 7500000 |

## Root Counts

| Count | Value |
|---|---:|
| total cFp72 roots | 32487 |
| cFp72 branching roots | 32147 |
| in-cap roots | 28915 |
| over-budget roots | 3232 |
| inherited skipped roots | 340 |
| inherited skipped percentage | 1.047% |
| over-budget percentage of branching roots | 10.054% |

## Pair Counts

| Count | Value |
|---|---:|
| planned second-ply pairs total | 7095113 |
| planned second-ply pairs in cap | 5101445 |
| planned second-ply pairs over budget | 1993668 |
| completed second-ply pairs | 5101445 |
| failed or deferred second-ply pairs | 0 |

## Status Counts

| Status | Count |
|---|---:|
| completed | 28915 |

## Transition Counts

| Transition | Count |
|---|---:|
| match_completed | 10856 |
| phase_changed_same_round | 296552 |
| round_advanced | 33920 |
| same_phase_same_round | 4760117 |
| transition_unknown | 0 |

## Post-Second-Ply Actor Counts

| Actor | Count |
|---|---:|
| actor_resolution_failed | 0 |
| no_actor | 0 |
| policy_actor | 4799725 |
| system_round_end_resolver | 290864 |
| terminal_game_end | 10856 |

## Post-Second-Ply Phase Counts

| Phase | Count |
|---|---:|
| game_end | 10856 |
| mulligan | 13408 |
| playing | 4786317 |
| round_end | 290864 |

## Second-Ply Public Action Counts

| Kind | Count |
|---|---:|
| choose_mulligan | 18208 |
| choose_prompt_option | 37408 |
| pass | 883648 |
| play_card | 3727731 |
| resolve_round_end | 44776 |
| use_leader | 389674 |

## Over-Budget Reasons

| Reason | Count |
|---|---:|
| root_second_ply_pair_cap_exceeded | 3232 |

## Casebook Labels By Cap Status

| Cap status | Label | Count |
|---|---|---:|
| in_cap | large_budget_root | 2142 |
| in_cap | large_collision_bucket | 94 |
| in_cap | not_in_casebook | 20119 |
| in_cap | round_end_context | 5571 |
| in_cap | terminal_context | 989 |
| over_budget | large_budget_root | 1773 |
| over_budget | large_collision_bucket | 3 |
| over_budget | not_in_casebook | 1307 |
| over_budget | round_end_context | 149 |

## Source Consistency

- status: ready
- cFp68 eligible roots read: 32147
- cFp72 branching roots read: 32147
- cFp73 casebook roots read: 10721
- duplicate cFp72 branching keys: 0
- cFp72 failed/deferred roots: 0
- in-cap roots not observed: 0

## Non-Claims

- cFp74 is execution-scaffold evidence only.
- No rollout was run.
- No quality estimate was computed.
- No ordering output was produced.
- No best option was selected.
- No outcome-probability estimate was produced.
- No reward target was produced.
- No product AI behavior changed.
- No third layer was counted.

## Hidden-Info Safety

cFp74 artifacts contain public root metadata, scalar cap accounting, scalar second-layer completion counts, transition-shape counts, and source artifact hashes only. They exclude private identities, sampled payloads, trace payloads, raw action payloads, ordering outputs, estimates, rollout results, and product AI wiring.

## Recommendation

cFp75 should use the cFp74 in-cap versus over-budget split to decide between a cap-targeted casebook, a cap calibration repair, or a third-surface budget probe for in-cap roots. It should still avoid rollout, quality, strength, and product-wiring claims.
