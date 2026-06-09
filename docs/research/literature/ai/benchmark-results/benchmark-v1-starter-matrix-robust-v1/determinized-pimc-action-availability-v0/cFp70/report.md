# Determinized PIMC Action Availability v0

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- probe run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-action-availability-v0:cFp70
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- probe variant: determinized-pimc-action-availability-v0
- probe mode: one_ply_sampled_world_action_availability
- probe readiness status: probe_ready
- source cFp68 contract run id: benchmark-v1-starter-matrix-robust-v1:determinized-probe-contract:cFp68
- source cFp69 probe run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-probe-v0:cFp69
- total cFp68 roots: 32487
- eligible valid roots: 32147
- availability roots: 32147
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

## Source Consistency

| Check | Count |
|---|---:|
| cFp68 contract not probe-ready | 0 |
| cFp68 total roots | 32487 |
| cFp68 eligible roots read | 32147 |
| cFp68 skipped roots read | 340 |
| cFp69 probe roots read | 32147 |
| cFp69 skipped roots read | 340 |
| benchmark observed roots read | 32487 |
| eligible roots not observed | 0 |
| observed roots outside cFp68/cFp69 contracts | 0 |
| skipped roots incorrectly probed | 0 |
| duplicate observed root keys | 0 |
| duplicate cFp68 eligible root keys | 0 |
| duplicate cFp69 probe root keys | 0 |
| duplicate skipped root keys | 0 |
| cFp68/cFp69 eligible root count delta | 0 |
| cFp68/cFp69 skipped root count delta | 0 |
| cFp69 probe roots missing cFp68 eligible root | 0 |
| cFp69 skipped roots missing cFp68 skipped root | 0 |
| cFp68/cFp69 sample-count mismatch roots | 0 |
| cFp68/cFp69 public-action count mismatch roots | 0 |
| cFp68 fingerprint mismatch observed roots | 0 |

## Sample Budget

| Metric | Count |
|---|---:|
| availability roots | 32147 |
| total requested samples | 257176 |
| total generated samples | 257176 |
| total checked samples | 257176 |
| total failed samples | 0 |

### Requested Samples Per Availability Root

| Requested samples | Roots |
|---|---:|
| 8 | 32147 |

## Availability Status

| Probe status | Roots |
|---|---:|
| cfp68_contract_mismatch | 0 |
| cfp69_contract_mismatch | 0 |
| completed | 32147 |
| eligible_root_not_observed | 0 |
| exact_state_rebuild_deferred | 0 |
| public_action_abstraction_failed | 0 |
| sample_materialization_failed | 0 |
| sampled_legal_move_generation_failed | 0 |
| sampled_world_rebuild_failed | 0 |

### Per-Sample Status

| Sample status | Samples |
|---|---:|
| all_root_actions_available | 257176 |
| availability_disagreement | 0 |
| public_action_abstraction_failed | 0 |
| sampled_legal_move_generation_failed | 0 |
| sampled_world_rebuild_failed | 0 |

| Metric | Count |
|---|---:|
| all-actions-available roots | 32147 |
| roots with missing root actions | 0 |
| roots with extra sampled actions | 0 |
| roots with any disagreement | 0 |

### Disagreement Buckets

| Bucket | Roots |
|---|---:|
| four_plus | 0 |
| none | 32147 |
| one | 0 |
| two_to_three | 0 |

### Risk Buckets

| Bucket | Roots |
|---|---:|
| deferred | 0 |
| failed | 0 |
| high | 0 |
| low | 0 |
| medium | 0 |
| none | 32147 |

## Action Bucket Aggregates

- root public action count stats: count 32147; min 1; max 14; avg 4.786; p50 5; p90 9; p95 10
- sampled public action count stats: count 257176; min 1; max 14; avg 4.786; p50 5; p90 9; p95 10
- missing root action bucket stats: count 32147; min 0; max 0; avg 0; p50 0; p90 0; p95 0
- extra sampled action bucket stats: count 32147; min 0; max 0; avg 0; p50 0; p90 0; p95 0
- disagreement stats: count 32147; min 0; max 0; avg 0; p50 0; p90 0; p95 0

### Missing By Public Action Kind

| Kind | Count |
|---|---:|
| choose_mulligan | 0 |
| choose_prompt_option | 0 |
| pass | 0 |
| play_card | 0 |
| resolve_round_end | 0 |
| use_leader | 0 |

### Extra By Public Action Kind

| Kind | Count |
|---|---:|
| choose_mulligan | 0 |
| choose_prompt_option | 0 |
| pass | 0 |
| play_card | 0 |
| resolve_round_end | 0 |
| use_leader | 0 |

### Missing By Target Kind

| Kind | Count |
|---|---:|
| board_row | 0 |
| card | 0 |
| card_instance_set | 0 |
| deck_card_instance | 0 |
| deck_card_source | 0 |
| none | 0 |
| row_horn | 0 |
| weather | 0 |

### Extra By Target Kind

| Kind | Count |
|---|---:|
| board_row | 0 |
| card | 0 |
| card_instance_set | 0 |
| deck_card_instance | 0 |
| deck_card_source | 0 |
| none | 0 |
| row_horn | 0 |
| weather | 0 |

### Missing By Target Side

| Side | Count |
|---|---:|
| none | 0 |
| opponent | 0 |
| own | 0 |
| public | 0 |

### Extra By Target Side

| Side | Count |
|---|---:|
| none | 0 |
| opponent | 0 |
| own | 0 |
| public | 0 |

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

cFp70 artifacts contain only public benchmark root metadata, scalar sample availability counts, public action bucket aggregates, skipped-root accounting, and source artifact hashes. They exclude private card identities, raw move payloads, private sampled payloads, engine logs, debug traces, action ranking, value estimates, rollout results, and product AI wiring.

## Explicit Non-Claims

- No rollout was run.
- No action value was computed.
- No action ranking was produced.
- No move was selected by search.
- No strength claim is made.
- No product AI behavior changed.
- Skipped roots were excluded from probe work and reported separately.

## Recommendation For cFp71

cFp71 should choose between a benchmark-only one-ply public action outcome skeleton or a repair casebook based on cFp70 disagreement and rebuild-failure counts. It should still avoid rollout, value, ranking, move recommendation, and product AI wiring.
