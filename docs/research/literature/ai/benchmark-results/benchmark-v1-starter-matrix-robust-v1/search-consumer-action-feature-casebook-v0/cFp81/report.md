# Search Consumer Action Feature Casebook v0

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- casebook run id: cFp81
- phase id: cFp81
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
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
| cFp80 robust target status | below_50_mb_target |
| cFp80 root feature summary count | 32147 |
| cFp80 root feature actual count | 32147 |
| cFp80 root feature count actual delta | 0 |
| cFp80 compact action summary count | 153842 |
| cFp80 compact action actual count | 153842 |
| cFp80 compact action count actual delta | 0 |
| cFp80 skipped root summary count | 340 |
| cFp80 skipped root actual count | 340 |
| cFp80 skipped root count actual delta | 0 |
| dictionary group count mismatches | 0 |
| compact action rows with invalid dictionary ids | 0 |
| compact action rows with invalid root ref id | 0 |
| source artifact reference count | 7 |
| source artifact empty hash count | 0 |

## Row Counts

| Row kind | Count |
|---|---:|
| cFp80 root feature rows | 32147 |
| cFp80 compact action rows | 153842 |
| inherited skipped root rows | 340 |
| cFp81 casebook rows | 80 |
| cFp81 slice summary rows | 95 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| casebook-rows.jsonl | 42703 | below 10 MB rough target and below 90 MB hard stop |
| slice-summaries.jsonl | 41906 | below 10 MB rough target and below 90 MB hard stop |
| skipped-root-summary.json | 2079 | below 10 MB rough target and below 90 MB hard stop |
| source cFp80 action-features-compact.jsonl | 46044793 | source |
| source cFp80 root-features.jsonl | 78173005 | source |
| source cFp80 skipped-roots.jsonl | 596498 | source |
| source cFp80 dictionaries.json | 743205 | source |

## Inherited Skipped Roots

- skipped root count: 340
- skipped root percent: 1.05

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
| choose_mulligan | 2548 |
| choose_prompt_option | 2048 |
| pass | 25571 |
| play_card | 109695 |
| resolve_round_end | 2645 |
| use_leader | 11335 |

### Source Class

| Source class | Count |
|---|---:|
| hero | 8424 |
| leader | 11335 |
| none | 30764 |
| prompt | 2048 |
| special | 62166 |
| unit | 39105 |

### Target Token

| Target token | Count |
|---|---:|
| board_row\|opponent\|close | 2048 |
| board_row\|opponent\|siege | 749 |
| board_row\|own\|close | 24075 |
| board_row\|own\|ranged | 16800 |
| board_row\|own\|siege | 9302 |
| card\|opponent | 168 |
| card\|own\|close | 6948 |
| card\|own\|ranged | 3345 |
| card\|own\|siege | 2422 |
| deck_card_source\|own | 3736 |
| none | 48432 |
| row_horn\|own\|close | 7577 |
| row_horn\|own\|ranged | 7940 |
| row_horn\|own\|siege | 8007 |
| weather\|public | 12293 |

### Move-Count Bucket

| Bucket | Count |
|---|---:|
| large_collision | 11441 |
| single | 110213 |
| small_collision | 32188 |

### Collision Flag

| Flag | Count |
|---|---:|
| collision | 43629 |
| no_collision | 110213 |

### Phase

| Phase | Count |
|---|---:|
| mulligan | 2948 |
| playing | 148249 |
| round_end | 2645 |

### Round

| Round | Count |
|---|---:|
| 1 | 122845 |
| 2 | 23573 |
| 3 | 7424 |

### Policy

| Policy | Count |
|---|---:|
| headless-round-end-auto-resolver | 2645 |
| legal-heuristic-v0 | 77569 |
| legal-heuristic-v1 | 73628 |

### Faction

| Faction | Count |
|---|---:|
| monsters | 25330 |
| nilfgaard | 37047 |
| northern_realms | 39038 |
| scoiatael | 24693 |
| skellige | 27734 |

### Deck Preset

| Deck preset | Count |
|---|---:|
| official-monsters-starter | 25330 |
| official-nilfgaard-starter | 37047 |
| official-northern-realms-starter | 39038 |
| official-scoiatael-starter | 24693 |
| official-skellige-starter | 27734 |

### Matchup

| Matchup | Count |
|---|---:|
| starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1 | 6184 |
| starter-monsters-heuristic-v0-vs-skellige-heuristic-v1 | 6473 |
| starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0 | 6042 |
| starter-monsters-heuristic-v1-vs-skellige-heuristic-v0 | 6497 |
| starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1 | 7795 |
| starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 7578 |
| starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 8037 |
| starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 7753 |
| starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0 | 7537 |
| starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 8006 |
| starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1 | 8091 |
| starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 11020 |
| starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 8643 |
| starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1 | 8667 |
| starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 7599 |
| starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0 | 9829 |
| starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 7664 |
| starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 7906 |
| starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1 | 6150 |
| starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0 | 6371 |

### cFp70 Availability Risk Bucket

| Bucket | Count |
|---|---:|
| none | 153842 |

### cFp71 Outcome Risk Bucket

| Bucket | Count |
|---|---:|
| none | 153842 |

### cFp72 Branching Risk Bucket

| Bucket | Count |
|---|---:|
| large | 28632 |
| medium | 91649 |
| small | 18934 |
| tiny | 13638 |
| zero | 989 |

### cFp73 Budget Pressure Label

| Label | Count |
|---|---:|
| high_threshold | 15113 |
| large | 14055 |
| low | 96452 |
| moderate | 28222 |

### cFp74 Cap Status

| Status | Count |
|---|---:|
| in_cap | 123085 |
| over_budget | 30757 |

### Combined Readiness

| Label | Count |
|---|---:|
| consumer_ready | 24405 |
| consumer_ready_high_branching | 85651 |
| consumer_ready_high_collision | 43629 |
| consumer_ready_over_budget_context | 157 |

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
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/manifest.json | fd1d4b55ff205b0188db58ad46397d3fdf386b2bcc32c7b47a50eee25c5a6fb4 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/summary.json | 0351a3e47db87ea6d93411e0972e7398eac6ac486e25816d49ee7a4a0423b3dd |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/dictionaries.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/dictionaries.json | 32d6c8abdd55db5fa3cc5b01937c1f8cf1f1cb4c158cef35d7fb98d5086a93e9 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/root-features.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/root-features.jsonl | 5d47d1c844c924d762500426230319dac4eb31615a9e6125d41f86de57b34035 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/action-features-compact.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/action-features-compact.jsonl | 50bdc24d52937c014cdb09351d96bf4d6f8004d20d9682150fc56b8b4e6aaa83 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/skipped-roots.jsonl | 009dee8765f7d84e0d08f13bd9e5599b4cf3dd1256a0d684fb09e3e8ca654297 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-dictionary-v0/cFp80/report.md | 3fcd0bcd183538b9cb291390ffa162640a52c72675d3ddba7c6e5cd4c1e9873a |

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
