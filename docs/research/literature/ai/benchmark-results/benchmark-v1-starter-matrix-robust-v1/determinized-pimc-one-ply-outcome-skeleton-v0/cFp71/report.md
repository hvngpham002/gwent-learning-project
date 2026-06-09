# Determinized PIMC One-Ply Outcome Skeleton v0

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- probe run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- probe variant: determinized-pimc-one-ply-outcome-skeleton-v0
- probe mode: one_ply_public_action_outcome_skeleton
- probe readiness status: probe_ready
- source cFp68 contract run id: benchmark-v1-starter-matrix-robust-v1:determinized-probe-contract:cFp68
- source cFp69 probe run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-probe-v0:cFp69
- source cFp70 availability run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-action-availability-v0:cFp70
- total cFp68 roots: 32487
- eligible valid roots: 32147
- outcome roots: 32147
- skipped invalid roots: 340
- skipped-root percentage: 1.047%
- matches: 1000

## Source Artifact Inputs

### cFp68

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/manifest.json | 735a87e2dea500878eaec01823dae886f14e11448d7c83cd87ea7490da7f7cfd |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/summary.json | 2ade0597b1f3f4edf11047846d31cb2d281df50b21e9c374010fda71530d03db |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/eligible-roots.jsonl | 7396adbf22084b0ab0515fdc6fb239bcd2e32c72404bfc5d800eebff62f5d97f |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/skipped-roots.jsonl | 91353f4a302cf755f7c2bb3196df5bf5643c31fa590287074531dccf5af0dd50 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/report.md | a70d26e484c303cfa5dfc9f12d2ad16e71c8f8bc31acea008e4132cd0795f9d4 |

### cFp69

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/manifest.json | 63725e400a6d8ae1ab6361d93ddabea8ab3c1fc4338a9b92d57dbf17435471f7 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/summary.json | 8c8ceb1dfd2ffaa2d8910c22f7fb6ee167fafcd0ff5ac5fe6a4d6ed6fdf52039 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/probe-roots.jsonl | c6688e88f8341e260254eef8bb7d6bb65a0bd9c78daceae35663232449878627 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl | 5d51db39d4c7170b38f1789e139744b3b2b1f22b96fb418b800ffad2c12e2cad |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/report.md | bf90d61f71c42436ba5be43b44bd0437930a8acdd738f0a1ae06e8051d5b4981 |

### cFp70

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/manifest.json | 029a033c3648a233146730ab020c36622d19f48517f2c8c0c1a024acb4343c26 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/summary.json | 4bda20dc523efe895ece1bab4242d985d8f1759878bd0c7a0cb6748f4c7beabc |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl | df1d076896cc951cb5796cff654cdd17502415be459e95e5f511ff4a3c1cbd17 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl | 7561662c2837616d8849757c6ebef64c96a4e75edb300c946b18d04b814d494a |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/report.md | 1e3dfe908bc03323c6037b2f017a26af2a8da503f4c61095841ac88d363ea309 |

## Source Consistency

| Check | Count |
|---|---:|
| cFp68 contract not probe-ready | 0 |
| cFp68 total roots | 32487 |
| cFp68 eligible roots read | 32147 |
| cFp68 skipped roots read | 340 |
| cFp69 probe roots read | 32147 |
| cFp69 skipped roots read | 340 |
| cFp70 availability roots read | 32147 |
| cFp70 skipped roots read | 340 |
| benchmark observed roots read | 32487 |
| eligible roots not observed | 0 |
| observed roots outside cFp68/cFp69/cFp70 contract | 0 |
| skipped roots incorrectly probed | 0 |
| duplicate observed root keys | 0 |
| duplicate cFp68 eligible root keys | 0 |
| duplicate cFp69 probe root keys | 0 |
| duplicate cFp70 availability root keys | 0 |
| duplicate skipped root keys | 0 |
| cFp68/cFp69 eligible root count delta | 0 |
| cFp68/cFp70 availability root count delta | 0 |
| cFp69/cFp70 availability root count delta | 0 |
| cFp68/cFp69 skipped root count delta | 0 |
| cFp68/cFp70 skipped root count delta | 0 |
| cFp69/cFp70 skipped root count delta | 0 |
| cFp69 probe roots missing cFp68 eligible root | 0 |
| cFp70 availability roots missing cFp68 eligible root | 0 |
| cFp69 skipped roots missing cFp68 skipped root | 0 |
| cFp70 skipped roots missing cFp68 skipped root | 0 |
| cFp68/cFp69 sample-count mismatch roots | 0 |
| cFp68/cFp70 sample-count mismatch roots | 0 |
| cFp69/cFp70 public-action count mismatch roots | 0 |
| cFp70 roots with availability disagreement | 0 |
| cFp68 fingerprint mismatch observed roots | 0 |

## Sample Budget

| Metric | Count |
|---|---:|
| outcome roots | 32147 |
| total requested samples | 257176 |
| total generated samples | 257176 |
| total checked samples | 257176 |
| total failed samples | 0 |

### Requested Samples Per Outcome Root

| Requested samples | Roots |
|---|---:|
| 8 | 32147 |

## One-Ply Outcome Status

| Probe status | Roots |
|---|---:|
| completed | 32147 |
| engine_command_exception | 0 |
| engine_command_rejected | 0 |
| move_command_conversion_failed | 0 |
| one_ply_execution_deferred | 0 |
| outcome_classification_failed | 0 |
| public_action_abstraction_failed | 0 |
| sample_action_missing | 0 |
| sampled_legal_move_generation_failed | 0 |
| sampled_world_rebuild_failed | 0 |

### Pair Status

| Pair status | Pairs |
|---|---:|
| completed | 1230736 |
| engine_command_exception | 0 |
| engine_command_rejected | 0 |
| move_command_conversion_failed | 0 |
| one_ply_execution_deferred | 0 |
| outcome_classification_failed | 0 |
| public_action_abstraction_failed | 0 |
| sample_action_missing | 0 |
| sampled_legal_move_generation_failed | 0 |
| sampled_world_rebuild_failed | 0 |

### Public Outcome Kinds

| Kind | Pairs |
|---|---:|
| card_play | 877560 |
| leader_use | 90680 |
| mulligan_selection | 20384 |
| pass | 204568 |
| prompt_resolution | 16384 |
| round_end_resolution | 21160 |
| unknown_public_transition | 0 |

### Transition Kinds

| Kind | Pairs |
|---|---:|
| match_completed | 7912 |
| phase_changed_same_round | 51088 |
| round_advanced | 13248 |
| same_phase_same_round | 1158488 |
| transition_unknown | 0 |

| Metric | Count |
|---|---:|
| public action/sample pair total | 1230736 |
| completed pairs | 1230736 |
| failed or deferred pairs | 0 |
| sample-action-missing pairs | 0 |
| conversion failure pairs | 0 |
| engine rejection pairs | 0 |
| engine exception pairs | 0 |
| classification failure pairs | 0 |
| deferred one-ply pairs | 0 |
| roots with any failed/deferred pair | 0 |
| roots with any public outcome divergence | 0 |

### Divergence Buckets

| Bucket | Roots |
|---|---:|
| deferred | 0 |
| failed | 0 |
| four_plus | 0 |
| none | 32147 |
| one | 0 |
| two_to_three | 0 |

### Outcome Risk Buckets

| Bucket | Roots |
|---|---:|
| deferred | 0 |
| failed | 0 |
| four_plus | 0 |
| none | 32147 |
| one | 0 |
| two_to_three | 0 |

## Public Action Aggregates

- root public action count stats: count 32147; min 1; max 14; avg 4.786; p50 5; p90 9; p95 10
- public action/sample pair count stats: count 32147; min 8; max 112; avg 38.285; p50 40; p90 72; p95 80
- completed pair count stats: count 32147; min 8; max 112; avg 38.285; p50 40; p90 72; p95 80
- failed/deferred pair count stats: count 32147; min 0; max 0; avg 0; p50 0; p90 0; p95 0
- outcome divergence count stats: count 32147; min 0; max 0; avg 0; p50 0; p90 0; p95 0

### Pair Status By Public Action Kind

| Public action kind | Pair status | Pairs |
|---|---|---:|
| choose_mulligan | completed | 20384 |
| choose_prompt_option | completed | 16384 |
| pass | completed | 204568 |
| play_card | completed | 877560 |
| resolve_round_end | completed | 21160 |
| use_leader | completed | 90680 |

### Outcome Kind By Public Action Kind

| Public action kind | Outcome kind | Pairs |
|---|---|---:|
| choose_mulligan | mulligan_selection | 20384 |
| choose_prompt_option | prompt_resolution | 16384 |
| pass | pass | 204568 |
| play_card | card_play | 877560 |
| resolve_round_end | round_end_resolution | 21160 |
| use_leader | leader_use | 90680 |

## Skip Counters

### Suite

| Suite | Count | Share of skipped roots |
|---|---:|---:|
| benchmark-v1-starter-matrix-robust-v1 | 340 | 100.000% |

### Phase

| Phase | Count | Share of skipped roots |
|---|---:|---:|
| playing | 312 | 91.765% |
| round_end | 28 | 8.235% |

### Round

| Round | Count | Share of skipped roots |
|---|---:|---:|
| 1 | 222 | 65.294% |
| 2 | 96 | 28.235% |
| 3 | 22 | 6.471% |

### Matchup

| Matchup | Count | Share of skipped roots |
|---|---:|---:|
| starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1 | 23 | 6.765% |
| starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 17 | 5.000% |
| starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 12 | 3.529% |
| starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 31 | 9.118% |
| starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0 | 42 | 12.353% |
| starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 44 | 12.941% |
| starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1 | 14 | 4.118% |
| starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 59 | 17.353% |
| starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 18 | 5.294% |
| starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1 | 16 | 4.706% |
| starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 6 | 1.765% |
| starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0 | 37 | 10.882% |
| starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 13 | 3.824% |
| starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 8 | 2.353% |

### Policy

| Policy | Count | Share of skipped roots |
|---|---:|---:|
| headless-round-end-auto-resolver | 28 | 8.235% |
| legal-heuristic-v0 | 246 | 72.353% |
| legal-heuristic-v1 | 66 | 19.412% |

### Faction

| Faction | Count | Share of skipped roots |
|---|---:|---:|
| monsters | 26 | 7.647% |
| nilfgaard | 102 | 30.000% |
| northern_realms | 136 | 40.000% |
| scoiatael | 37 | 10.882% |
| skellige | 39 | 11.471% |

### Deck Preset

| Deck preset | Count | Share of skipped roots |
|---|---:|---:|
| official-monsters-starter | 26 | 7.647% |
| official-nilfgaard-starter | 102 | 30.000% |
| official-northern-realms-starter | 136 | 40.000% |
| official-scoiatael-starter | 37 | 10.882% |
| official-skellige-starter | 39 | 11.471% |

### Provenance Label

| Provenance label | Count | Share of skipped roots |
|---|---:|---:|
| mixed_public_zones | 229 | 67.353% |
| round_end_public_zone | 28 | 8.235% |
| single_zone_board | 54 | 15.882% |
| single_zone_discard | 29 | 8.529% |

### Invalid Reason

| Invalid reason | Count | Share of skipped roots |
|---|---:|---:|
| insufficient_prior_remaining | 340 | 100.000% |

### Skip Reason

| Skip reason | Count | Share of skipped roots |
|---|---:|---:|
| sampler_invalid_public_zone_count_deficit | 340 | 100.000% |

## Hidden-Info Safety

cFp71 artifacts contain only public benchmark root metadata, scalar one-ply status counts, public transition-shape counts, skipped-root accounting, and source artifact hashes. They exclude private card identities, raw action payloads, sampled payloads, engine trace payloads, ranking fields, estimates, rollout results, and product AI wiring.

## Explicit Non-Claims

- No rollout was run.
- No action value was computed.
- No action ranking was produced.
- No move was selected by search.
- No win probability was estimated.
- No reward target was produced.
- No product AI behavior changed.
- Skipped roots were excluded from probe work and reported separately.

## Recommendation For cFp72

cFp72 should inspect cFp71 one-ply failure, deferred, and divergence counts before choosing a repair casebook or a deeper benchmark-only branching probe. It should still avoid rollout, value, ranking, move recommendation, and product AI wiring.
