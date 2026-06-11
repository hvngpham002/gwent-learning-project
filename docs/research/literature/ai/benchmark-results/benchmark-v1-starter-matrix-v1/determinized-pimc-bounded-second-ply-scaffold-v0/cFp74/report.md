# Determinized PIMC Bounded Second-Ply Scaffold v0

## Run

- suite id: benchmark-v1-starter-matrix-v1
- scaffold run id: benchmark-v1-starter-matrix-v1:determinized-pimc-bounded-second-ply-scaffold-v0:cFp74
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- readiness: ready_with_over_budget_skips
- source cFp68 run id: benchmark-v1-starter-matrix-v1:determinized-probe-contract:cFp68
- source cFp69 run id: benchmark-v1-starter-matrix-v1:determinized-pimc-probe-v0:cFp69
- source cFp70 run id: benchmark-v1-starter-matrix-v1:determinized-pimc-action-availability-v0:cFp70
- source cFp71 run id: benchmark-v1-starter-matrix-v1:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71
- source cFp72 run id: benchmark-v1-starter-matrix-v1:determinized-pimc-post-one-ply-branching-budget-v0:cFp72
- source cFp73 run id: benchmark-v1-starter-matrix-v1:determinized-pimc-post-one-ply-branching-budget-casebook:cFp73

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
| total cFp72 roots | 4042 |
| cFp72 branching roots | 3979 |
| in-cap roots | 3593 |
| over-budget roots | 386 |
| inherited skipped roots | 63 |
| inherited skipped percentage | 1.559% |
| over-budget percentage of branching roots | 9.701% |

## Pair Counts

| Count | Value |
|---|---:|
| planned second-ply pairs total | 863479 |
| planned second-ply pairs in cap | 628847 |
| planned second-ply pairs over budget | 234632 |
| completed second-ply pairs | 628847 |
| failed or deferred second-ply pairs | 0 |

## Status Counts

| Status | Count |
|---|---:|
| completed | 3593 |

## Transition Counts

| Transition | Count |
|---|---:|
| match_completed | 1376 |
| phase_changed_same_round | 36104 |
| round_advanced | 4104 |
| same_phase_same_round | 587263 |
| transition_unknown | 0 |

## Post-Second-Ply Actor Counts

| Actor | Count |
|---|---:|
| actor_resolution_failed | 0 |
| no_actor | 0 |
| policy_actor | 592023 |
| system_round_end_resolver | 35448 |
| terminal_game_end | 1376 |

## Post-Second-Ply Phase Counts

| Phase | Count |
|---|---:|
| game_end | 1376 |
| mulligan | 1632 |
| playing | 590391 |
| round_end | 35448 |

## Second-Ply Public Action Counts

| Kind | Count |
|---|---:|
| choose_mulligan | 2208 |
| choose_prompt_option | 5080 |
| pass | 108456 |
| play_card | 456309 |
| resolve_round_end | 5480 |
| use_leader | 51314 |

## Over-Budget Reasons

| Reason | Count |
|---|---:|
| root_second_ply_pair_cap_exceeded | 386 |

## Casebook Labels By Cap Status

| Cap status | Label | Count |
|---|---|---:|
| in_cap | large_budget_root | 256 |
| in_cap | large_collision_bucket | 14 |
| in_cap | not_in_casebook | 2527 |
| in_cap | round_end_context | 680 |
| in_cap | terminal_context | 116 |
| over_budget | large_budget_root | 199 |
| over_budget | large_collision_bucket | 1 |
| over_budget | not_in_casebook | 161 |
| over_budget | round_end_context | 25 |

## Source Consistency

- status: ready
- cFp68 eligible roots read: 3979
- cFp72 branching roots read: 3979
- cFp73 casebook roots read: 1291
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
