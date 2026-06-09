# Determinized PIMC Action Availability v0

## Run

- suite id: benchmark-v1-starter-matrix-v1
- probe run id: benchmark-v1-starter-matrix-v1:determinized-pimc-action-availability-v0:cFp70
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- probe variant: determinized-pimc-action-availability-v0
- probe mode: one_ply_sampled_world_action_availability
- probe readiness status: probe_ready
- source cFp68 contract run id: benchmark-v1-starter-matrix-v1:determinized-probe-contract:cFp68
- source cFp69 probe run id: benchmark-v1-starter-matrix-v1:determinized-pimc-probe-v0:cFp69
- total cFp68 roots: 4042
- eligible valid roots: 3979
- availability roots: 3979
- skipped invalid roots: 63
- skipped-root percentage: 1.559%
- matches: 120

## Source Artifact Inputs

### cFp68

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/manifest.json | 4555bb2d7a4357e0eff3db189c36a9837eb3ae569a55c0ad6cd254457272d558 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/summary.json | 3b52cb515229480cb22725492c925f1e2ccc8099bd5c0b10de851a802201a029 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/eligible-roots.jsonl | 43c0dffc9742df50c18418eaa93e83effd429b37b53b36d56b92adb76e2d4d87 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/skipped-roots.jsonl | b2b8dda27d7f61437aee50f4d0d3bae16f4b2c6595352e638c041edfbd2e2406 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/report.md | 7baabcfe6b440e0a7f14a21eb72666e95abb2bc65abeb4be9b5140d57a3ddd0b |

### cFp69

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/manifest.json | 46234a57bd57b1d0da7b2af6d2437fc5cd75d4b8096b058d1a72d76e024a8d14 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/summary.json | d5be37fa882ae443029653c1b80854af74fb18a54aeeb026dcf0a40195ffbfc6 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/probe-roots.jsonl | fd1bdf4048231ffca218fa934aef7e4ed6452f258bb0f4b125cd994491277a9f |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl | 63de4c0f60b8aeb56ea6a9dbc59643b9dabf931862683ba53ff08396ba29535c |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/report.md | 3558f3c7bc46bff48505ebb5759d46721ec7c0f00183b12b7673676b82c67ed6 |

## Source Consistency

| Check | Count |
|---|---:|
| cFp68 contract not probe-ready | 0 |
| cFp68 total roots | 4042 |
| cFp68 eligible roots read | 3979 |
| cFp68 skipped roots read | 63 |
| cFp69 probe roots read | 3979 |
| cFp69 skipped roots read | 63 |
| benchmark observed roots read | 4042 |
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
| availability roots | 3979 |
| total requested samples | 31832 |
| total generated samples | 31832 |
| total checked samples | 31832 |
| total failed samples | 0 |

### Requested Samples Per Availability Root

| Requested samples | Roots |
|---|---:|
| 8 | 3979 |

## Availability Status

| Probe status | Roots |
|---|---:|
| cfp68_contract_mismatch | 0 |
| cfp69_contract_mismatch | 0 |
| completed | 3979 |
| eligible_root_not_observed | 0 |
| exact_state_rebuild_deferred | 0 |
| public_action_abstraction_failed | 0 |
| sample_materialization_failed | 0 |
| sampled_legal_move_generation_failed | 0 |
| sampled_world_rebuild_failed | 0 |

### Per-Sample Status

| Sample status | Samples |
|---|---:|
| all_root_actions_available | 31832 |
| availability_disagreement | 0 |
| public_action_abstraction_failed | 0 |
| sampled_legal_move_generation_failed | 0 |
| sampled_world_rebuild_failed | 0 |

| Metric | Count |
|---|---:|
| all-actions-available roots | 3979 |
| roots with missing root actions | 0 |
| roots with extra sampled actions | 0 |
| roots with any disagreement | 0 |

### Disagreement Buckets

| Bucket | Roots |
|---|---:|
| four_plus | 0 |
| none | 3979 |
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
| none | 3979 |

## Action Bucket Aggregates

- root public action count stats: count 3979; min 1; max 13; avg 4.73; p50 5; p90 9; p95 10
- sampled public action count stats: count 31832; min 1; max 13; avg 4.73; p50 5; p90 9; p95 10
- missing root action bucket stats: count 3979; min 0; max 0; avg 0; p50 0; p90 0; p95 0
- extra sampled action bucket stats: count 3979; min 0; max 0; avg 0; p50 0; p90 0; p95 0
- disagreement stats: count 3979; min 0; max 0; avg 0; p50 0; p90 0; p95 0

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
| benchmark-v1-starter-matrix-v1 | 63 | 100.000% |

### Phase

| Phase | Count | Share of skipped roots |
|---|---:|---:|
| playing | 57 | 90.476% |
| round_end | 6 | 9.524% |

### Round

| Round | Count | Share of skipped roots |
|---|---:|---:|
| 1 | 28 | 44.444% |
| 2 | 28 | 44.444% |
| 3 | 7 | 11.111% |

### Matchup

| Matchup | Count | Share of skipped roots |
|---|---:|---:|
| starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1 | 2 | 3.175% |
| starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 1 | 1.587% |
| starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 1 | 1.587% |
| starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 6 | 9.524% |
| starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0 | 7 | 11.111% |
| starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 4 | 6.349% |
| starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1 | 6 | 9.524% |
| starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 24 | 38.095% |
| starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 3 | 4.762% |
| starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1 | 2 | 3.175% |
| starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 1 | 1.587% |
| starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0 | 3 | 4.762% |
| starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 2 | 3.175% |
| starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 1 | 1.587% |

### Policy

| Policy | Count | Share of skipped roots |
|---|---:|---:|
| headless-round-end-auto-resolver | 6 | 9.524% |
| legal-heuristic-v0 | 47 | 74.603% |
| legal-heuristic-v1 | 10 | 15.873% |

### Faction

| Faction | Count | Share of skipped roots |
|---|---:|---:|
| monsters | 4 | 6.349% |
| nilfgaard | 11 | 17.460% |
| northern_realms | 39 | 61.905% |
| scoiatael | 6 | 9.524% |
| skellige | 3 | 4.762% |

### Deck Preset

| Deck preset | Count | Share of skipped roots |
|---|---:|---:|
| official-monsters-starter | 4 | 6.349% |
| official-nilfgaard-starter | 11 | 17.460% |
| official-northern-realms-starter | 39 | 61.905% |
| official-scoiatael-starter | 6 | 9.524% |
| official-skellige-starter | 3 | 4.762% |

### Provenance Label

| Provenance label | Count | Share of skipped roots |
|---|---:|---:|
| mixed_public_zones | 42 | 66.667% |
| round_end_public_zone | 6 | 9.524% |
| single_zone_board | 6 | 9.524% |
| single_zone_discard | 9 | 14.286% |

### Invalid Reason

| Invalid reason | Count | Share of skipped roots |
|---|---:|---:|
| insufficient_prior_remaining | 63 | 100.000% |

### Skip Reason

| Skip reason | Count | Share of skipped roots |
|---|---:|---:|
| sampler_invalid_public_zone_count_deficit | 63 | 100.000% |

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
