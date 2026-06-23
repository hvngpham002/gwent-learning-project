# Search Consumer Action Features v1

## Run

- suite id: benchmark-v1-starter-matrix-v1
- feature run id: cFp79
- phase id: cFp79
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- source cFp76 run id: benchmark-v1-starter-matrix-v1:search-consumer-action-features-v0:cFp76
- source cFp78 run id: benchmark-v1-starter-matrix-v1:public-action-identities-compact-v0:cFp78
- consumer readiness status: features_ready

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp76 consumer readiness status | action_feature_source_gap |
| cFp76 source consistency status | ready |
| cFp78 compact readiness status | compact_ready |
| cFp78 source consistency status | ready |
| cFp76 root feature summary count | 3979 |
| cFp76 root feature actual count | 3979 |
| cFp76 root feature count actual delta | 0 |
| cFp76 skipped root summary count | 63 |
| cFp76 skipped root actual count | 63 |
| cFp76 skipped root count actual delta | 0 |
| cFp78 compact action summary count | 18820 |
| cFp78 compact action actual count | 18820 |
| cFp78 compact action count actual delta | 0 |
| cFp78 root-index summary count | 3979 |
| cFp78 root-index actual count | 3979 |
| cFp78 root-index count actual delta | 0 |
| cFp78 skipped root summary count | 63 |
| cFp78 skipped root actual count | 63 |
| cFp78 skipped root count actual delta | 0 |
| duplicate cFp76 root identity keys | 0 |
| duplicate cFp78 root identity keys | 0 |
| cFp76 root features without exactly one cFp78 root-index row | 0 |
| cFp78 root-index rows without exactly one cFp76 root feature | 0 |
| cFp76 skipped roots without cFp78 skipped root | 0 |
| cFp78 skipped roots without cFp76 skipped root | 0 |
| cFp79 root feature row count | 3979 |
| cFp79 root feature vs cFp76 delta | 0 |
| cFp79 action feature row count | 18820 |
| cFp79 action feature vs cFp78 delta | 0 |
| cFp79 skipped root row count | 63 |
| cFp79 skipped root vs cFp76 delta | 0 |
| cFp79 skipped root vs cFp78 delta | 0 |
| cFp79 action rows missing root feature | 0 |
| cFp78 action identities missing cFp79 action features | 0 |
| duplicate cFp79 root refs | 0 |
| duplicate cFp79 action identity refs | 0 |
| source artifact reference count | 12 |
| source artifact empty hash count | 0 |

## Row Counts

| Row kind | Count |
|---|---:|
| root feature rows | 3979 |
| action feature rows | 18820 |
| skipped root rows | 63 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| root-features.jsonl | 9548373 | below 90 MB hard stop |
| action-features.jsonl | 10518156 | below 50 MB robust target, below 90 MB hard stop |
| skipped-roots.jsonl | 108675 | below 90 MB hard stop |

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

## Hidden-Info Safety

- scan status: clean
- hazards detected: none

All cFp79 machine-readable rows are deterministic scalar joins over committed cFp76 root features and cFp78 compact public action identities. Action rows carry compact public action-local fields plus rootRef joins only; they do not duplicate cFp76 root payloads or carry raw move, card, private hand/deck, sampled-world, value, ranking, or rollout payloads.

## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/manifest.json | 8eeccfbbac23cc9192cc9264c58a93e8e808779654ec4b0bec3e6c9b5470db6d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/summary.json | 66294d4759ff4bc5dc49576fa5c62311615ed87306df136887eac7551576f9d1 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/root-features.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/root-features.jsonl | 83875d13214b3f01df55542695b49490826f78962719db442d9af023424de776 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl | 5331f1a9268fef8aec251a5fbae2e1226acea2619f5f6675ae23577aee69920e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/skipped-roots.jsonl | 91b706a78ad1c81781faac56ffbc8e181420f8f850e478cf3ad11219c189d7d9 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/report.md | 18b5bd9ac425fddbd3eed23a796eb57604cdec93d650dd16e30cbe9e6cb0fc96 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/manifest.json | be36b9ff3131d3d0eb398fd595aab29d602df7099b6bf4d7e259997451860fea |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/summary.json | 863672b612a86a7f486e9626a9c7548eb86b372e15de69dcc6c2711ae91233dd |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/action-identities-compact.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/action-identities-compact.jsonl | 336d36cded71f38a6d6b03520713dca49c9b61fd5065a6fc0bd3232f314f50d7 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/root-index.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/root-index.jsonl | d64ead0bf4b30297b898d55e535b059fae78be8e14d23b524243e7bb9632c705 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/skipped-roots.jsonl | 1482689e75a631acded884a01fe46e8abe1ee6f9581863ad5862b9818cafbbc2 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-compact-v0/cFp78/report.md | 622e6403330ec7713f07cf594bbb1d5a1ce7920da0cb8b734900618e58dd9ed3 |

## Non-Claims

- cFp79 does not choose actions or recommend best actions.
- cFp79 does not rank actions or compute action ordering.
- cFp79 does not estimate action values or expected values.
- cFp79 does not estimate win probability or reward targets.
- cFp79 does not compute payoff tables or principal variations.
- cFp79 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.
- cFp79 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.
- cFp79 does not select moves for product AI.
- cFp79 does not re-observe benchmark roots or run the benchmark suite.
- cFp79 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.
- cFp79 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.
- cFp79 does not add AI Lab runner buttons or execute benchmarks from the browser.
- cFp79 does not add difficulty tiers, export training data, or add Python tooling.
- cFp79 does not modify cFp76 or cFp78 artifacts.

## cFp80 Recommendation

cFp80 may define a strictly benchmark-only action-feature casebook or consumer-readiness report over populated cFp79 action features; it must not add rollout, value, ranking, best-action, win-probability, reward-target, or product-AI behavior.
