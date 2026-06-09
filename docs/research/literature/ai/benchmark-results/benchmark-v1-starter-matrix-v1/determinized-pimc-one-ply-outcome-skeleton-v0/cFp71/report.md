# Determinized PIMC One-Ply Outcome Skeleton v0

## Run

- suite id: benchmark-v1-starter-matrix-v1
- probe run id: benchmark-v1-starter-matrix-v1:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- probe variant: determinized-pimc-one-ply-outcome-skeleton-v0
- probe mode: one_ply_public_action_outcome_skeleton
- probe readiness status: probe_ready
- source cFp68 contract run id: benchmark-v1-starter-matrix-v1:determinized-probe-contract:cFp68
- source cFp69 probe run id: benchmark-v1-starter-matrix-v1:determinized-pimc-probe-v0:cFp69
- source cFp70 availability run id: benchmark-v1-starter-matrix-v1:determinized-pimc-action-availability-v0:cFp70
- total cFp68 roots: 4042
- eligible valid roots: 3979
- outcome roots: 3979
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

### cFp70

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/manifest.json | 0226d3f1516e06eeba436cb63f16b6bbc5fcfad2d2e2a7139b341936d885dc6e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/summary.json | 9e845a25c05dc5727caa53548af06bb229480b4eabb51f2d3782d08be117211d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl | de9119ffed9c85eca405d9c026380026f02553258c5b03fcb181e7618bb47ad8 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl | 1cc8a0488383ff103ac96e02823c017ce2bcc614e4a935531cd2fc9bc206f1cb |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/report.md | 44d72ad3606a36778bdaf3e772eea84ebb00b7d21d175592cc860730996c891b |

## Source Consistency

| Check | Count |
|---|---:|
| cFp68 contract not probe-ready | 0 |
| cFp68 total roots | 4042 |
| cFp68 eligible roots read | 3979 |
| cFp68 skipped roots read | 63 |
| cFp69 probe roots read | 3979 |
| cFp69 skipped roots read | 63 |
| cFp70 availability roots read | 3979 |
| cFp70 skipped roots read | 63 |
| benchmark observed roots read | 4042 |
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
| outcome roots | 3979 |
| total requested samples | 31832 |
| total generated samples | 31832 |
| total checked samples | 31832 |
| total failed samples | 0 |

### Requested Samples Per Outcome Root

| Requested samples | Roots |
|---|---:|
| 8 | 3979 |

## One-Ply Outcome Status

| Probe status | Roots |
|---|---:|
| completed | 3979 |
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
| completed | 150560 |
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
| card_play | 105992 |
| leader_use | 11904 |
| mulligan_selection | 2400 |
| pass | 25296 |
| prompt_resolution | 2320 |
| round_end_resolution | 2648 |
| unknown_public_transition | 0 |

### Transition Kinds

| Kind | Pairs |
|---|---:|
| match_completed | 928 |
| phase_changed_same_round | 6232 |
| round_advanced | 1720 |
| same_phase_same_round | 141680 |
| transition_unknown | 0 |

| Metric | Count |
|---|---:|
| public action/sample pair total | 150560 |
| completed pairs | 150560 |
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
| none | 3979 |
| one | 0 |
| two_to_three | 0 |

### Outcome Risk Buckets

| Bucket | Roots |
|---|---:|
| deferred | 0 |
| failed | 0 |
| four_plus | 0 |
| none | 3979 |
| one | 0 |
| two_to_three | 0 |

## Public Action Aggregates

- root public action count stats: count 3979; min 1; max 13; avg 4.73; p50 5; p90 9; p95 10
- public action/sample pair count stats: count 3979; min 8; max 104; avg 37.839; p50 40; p90 72; p95 80
- completed pair count stats: count 3979; min 8; max 104; avg 37.839; p50 40; p90 72; p95 80
- failed/deferred pair count stats: count 3979; min 0; max 0; avg 0; p50 0; p90 0; p95 0
- outcome divergence count stats: count 3979; min 0; max 0; avg 0; p50 0; p90 0; p95 0

### Pair Status By Public Action Kind

| Public action kind | Pair status | Pairs |
|---|---|---:|
| choose_mulligan | completed | 2400 |
| choose_prompt_option | completed | 2320 |
| pass | completed | 25296 |
| play_card | completed | 105992 |
| resolve_round_end | completed | 2648 |
| use_leader | completed | 11904 |

### Outcome Kind By Public Action Kind

| Public action kind | Outcome kind | Pairs |
|---|---|---:|
| choose_mulligan | mulligan_selection | 2400 |
| choose_prompt_option | prompt_resolution | 2320 |
| pass | pass | 25296 |
| play_card | card_play | 105992 |
| resolve_round_end | round_end_resolution | 2648 |
| use_leader | leader_use | 11904 |

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
