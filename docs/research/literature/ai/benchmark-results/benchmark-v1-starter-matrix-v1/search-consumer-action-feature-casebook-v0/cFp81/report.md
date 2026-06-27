# Search Consumer Action Feature Casebook v0

## Run

- suite id: benchmark-v1-starter-matrix-v1
- casebook run id: cFp81
- phase id: cFp81
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- source cFp80 run id: cFp80
- consumer readiness status: casebook_ready

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp80 consumer readiness status | dictionary_ready |
| cFp80 source consistency status | ready |
| cFp80 reconstruction status | passed |
| cFp80 reconstruction mismatch count | 0 |
| cFp80 robust target status | not_robust_suite |
| cFp80 root feature summary count | 3979 |
| cFp80 root feature actual count | 3979 |
| cFp80 root feature count actual delta | 0 |
| cFp80 compact action summary count | 18820 |
| cFp80 compact action actual count | 18820 |
| cFp80 compact action count actual delta | 0 |
| cFp80 skipped root summary count | 63 |
| cFp80 skipped root actual count | 63 |
| cFp80 skipped root count actual delta | 0 |
| dictionary group count mismatches | 0 |
| compact action rows with invalid dictionary ids | 0 |
| compact action rows with invalid root ref id | 0 |
| source artifact reference count | 7 |
| source artifact empty hash count | 0 |

## Row Counts

| Row kind | Count |
|---|---:|
| cFp80 root feature rows | 3979 |
| cFp80 compact action rows | 18820 |
| inherited skipped root rows | 63 |
| cFp81 casebook rows | 80 |
| cFp81 slice summary rows | 95 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| casebook-rows.jsonl | 41921 | below 10 MB rough target and below 90 MB hard stop |
| slice-summaries.jsonl | 40978 | below 10 MB rough target and below 90 MB hard stop |
| skipped-root-summary.json | 2041 | below 10 MB rough target and below 90 MB hard stop |
| source cFp80 action-features-compact.jsonl | 5615464 | source |
| source cFp80 root-features.jsonl | 9600100 | source |
| source cFp80 skipped-roots.jsonl | 109368 | source |
| source cFp80 dictionaries.json | 95304 | source |

## Inherited Skipped Roots

- skipped root count: 63
- skipped root percent: 1.56

## Readiness Label Counts

| Label | Count |
|---|---:|
| consumer_ready | 10 |
| consumer_ready_high_branching | 57 |
| consumer_ready_high_collision | 12 |
| consumer_ready_over_budget_context | 1 |
| consumer_ready_skipped_root_context | 0 |
| consumer_ready_sparse_slice | 0 |

## Casebook Row Kind Counts

| Row kind | Count |
|---|---:|
| action_kind_slice | 6 |
| branching_risk_slice | 5 |
| collision_slice | 2 |
| combined_readiness_slice | 4 |
| deck_preset_slice | 5 |
| faction_slice | 5 |
| matchup_slice | 20 |
| move_count_bucket_slice | 3 |
| phase_round_slice | 7 |
| second_ply_cap_slice | 2 |
| source_class_slice | 6 |
| target_slice | 15 |

## Count Summaries

### Public Action Kind

| Kind | Count |
|---|---:|
| choose_mulligan | 300 |
| choose_prompt_option | 290 |
| pass | 3162 |
| play_card | 13249 |
| resolve_round_end | 331 |
| use_leader | 1488 |

### Source Class

| Source class | Count |
|---|---:|
| hero | 1124 |
| leader | 1488 |
| none | 3793 |
| prompt | 290 |
| special | 7177 |
| unit | 4948 |

### Target Token

| Target token | Count |
|---|---:|
| board_row\|opponent\|close | 206 |
| board_row\|opponent\|siege | 163 |
| board_row\|own\|close | 2949 |
| board_row\|own\|ranged | 2225 |
| board_row\|own\|siege | 1039 |
| card\|opponent | 23 |
| card\|own\|close | 817 |
| card\|own\|ranged | 427 |
| card\|own\|siege | 291 |
| deck_card_source\|own | 512 |
| none | 6084 |
| row_horn\|own\|close | 832 |
| row_horn\|own\|ranged | 880 |
| row_horn\|own\|siege | 880 |
| weather\|public | 1492 |

### Move-Count Bucket

| Bucket | Count |
|---|---:|
| large_collision | 1119 |
| single | 13657 |
| small_collision | 4044 |

### Collision Flag

| Flag | Count |
|---|---:|
| collision | 5163 |
| no_collision | 13657 |

### Phase

| Phase | Count |
|---|---:|
| mulligan | 348 |
| playing | 18141 |
| round_end | 331 |

### Round

| Round | Count |
|---|---:|
| 1 | 14624 |
| 2 | 3188 |
| 3 | 1008 |

### Policy

| Policy | Count |
|---|---:|
| headless-round-end-auto-resolver | 331 |
| legal-heuristic-v0 | 9302 |
| legal-heuristic-v1 | 9187 |

### Faction

| Faction | Count |
|---|---:|
| monsters | 3134 |
| nilfgaard | 4140 |
| northern_realms | 5071 |
| scoiatael | 3120 |
| skellige | 3355 |

### Deck Preset

| Deck preset | Count |
|---|---:|
| official-monsters-starter | 3134 |
| official-nilfgaard-starter | 4140 |
| official-northern-realms-starter | 5071 |
| official-scoiatael-starter | 3120 |
| official-skellige-starter | 3355 |

### Matchup

| Matchup | Count |
|---|---:|
| starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1 | 775 |
| starter-monsters-heuristic-v0-vs-skellige-heuristic-v1 | 840 |
| starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0 | 718 |
| starter-monsters-heuristic-v1-vs-skellige-heuristic-v0 | 789 |
| starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1 | 822 |
| starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 879 |
| starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 941 |
| starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 956 |
| starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0 | 872 |
| starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 866 |
| starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1 | 1047 |
| starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 1230 |
| starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 1206 |
| starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1 | 1092 |
| starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 1056 |
| starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0 | 1257 |
| starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 975 |
| starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 1054 |
| starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1 | 742 |
| starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0 | 703 |

### cFp70 Availability Risk Bucket

| Bucket | Count |
|---|---:|
| none | 18820 |

### cFp71 Outcome Risk Bucket

| Bucket | Count |
|---|---:|
| none | 18820 |

### cFp72 Branching Risk Bucket

| Bucket | Count |
|---|---:|
| large | 3382 |
| medium | 11207 |
| small | 2385 |
| tiny | 1730 |
| zero | 116 |

### cFp73 Budget Pressure Label

| Label | Count |
|---|---:|
| high_threshold | 1794 |
| large | 1677 |
| low | 11887 |
| moderate | 3462 |

### cFp74 Cap Status

| Status | Count |
|---|---:|
| in_cap | 15139 |
| over_budget | 3681 |

### Combined Readiness

| Label | Count |
|---|---:|
| consumer_ready | 3086 |
| consumer_ready_high_branching | 10552 |
| consumer_ready_high_collision | 5163 |
| consumer_ready_over_budget_context | 19 |

## Classification Thresholds

| Threshold | Value |
|---|---:|
| sparse action count | 5 |
| sparse root count | 3 |
| high collision action share percent | 50 |
| high branching action share percent | 50 |
| over-budget action share percent | 50 |
| skipped root context percent | 5 |
| max casebook rows per kind | 24 |

## Hidden-Info Safety

- scan status: clean
- hazards detected: none

All cFp81 machine-readable rows are deterministic aggregate slices over committed cFp80 compact artifacts. They contain scalar counts, percentages, readiness labels, and fixed notes only. They do not emit per-action reconstructed rows, raw move payloads, private hand/deck data, sampled-world payloads, value estimates, ranking fields, or rollout outputs.

## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/manifest.json | 456dcc4550ecd99b5329154c651ce5df1a29f289d06fbb013e8c9b8360577738 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/summary.json | b16fad0de68a3f4be3af6519d0c1bf0377259b378aeb4247adc4f9f2812fb91d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/dictionaries.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/dictionaries.json | 8cf734cccfa665a0f8050084dd1aaf029d685a4074cb78ae864ffec21ed6b457 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/root-features.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/root-features.jsonl | 2cce3a74f6d486b8d0d0a83f799891daeddf54d2502c44d0f10661203061f1e1 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/action-features-compact.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/action-features-compact.jsonl | b3e8b855184b1d8247b87aaac57aed7797818343d8670ccc6e927092d5e9cd37 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/skipped-roots.jsonl | 304c119cfbf66cc19f414830e8370492c21ba53437f89ac592a4b5271c3d17b3 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-dictionary-v0/cFp80/report.md | 3bba07ed33aee730cc2875bf394b64d087ff5ef84b0e846754fc92f45bf61cd2 |

## Non-Claims

- cFp81 does not choose actions or recommend best actions.
- cFp81 does not rank actions or compute action ordering.
- cFp81 does not estimate action values or expected values.
- cFp81 does not estimate win probability or reward targets.
- cFp81 does not compute payoff tables or principal variations.
- cFp81 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.
- cFp81 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.
- cFp81 does not select moves for product AI.
- cFp81 does not re-observe benchmark roots or run browser benchmarks.
- cFp81 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.
- cFp81 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.
- cFp81 does not add AI Lab runner buttons or execute benchmarks from the browser.
- cFp81 does not add difficulty tiers, export training data, Python notebooks, or binary artifacts.
- cFp81 does not modify cFp80, cFp79, cFp78, or cFp76 artifacts.

## cFp82 Recommendation

cFp82 should be a decision phase that uses the cFp81 casebook to choose the next benchmark-only consumer step, still without rollout, value estimation, action ranking, best-action selection, win-probability, reward-target, or product-AI behavior.
