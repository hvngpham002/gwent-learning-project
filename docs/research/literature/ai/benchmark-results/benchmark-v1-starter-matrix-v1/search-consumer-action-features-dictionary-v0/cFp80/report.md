# Search Consumer Action Feature Dictionary v0

## Run

- suite id: benchmark-v1-starter-matrix-v1
- feature run id: cFp80
- phase id: cFp80
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- source cFp79 run id: cFp79
- consumer readiness status: dictionary_ready

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp79 consumer readiness status | features_ready |
| cFp79 source consistency status | ready |
| cFp79 root feature summary count | 3979 |
| cFp79 root feature actual count | 3979 |
| cFp79 root feature count actual delta | 0 |
| cFp79 action feature summary count | 18820 |
| cFp79 action feature actual count | 18820 |
| cFp79 action feature count actual delta | 0 |
| cFp79 skipped root summary count | 63 |
| cFp79 skipped root actual count | 63 |
| cFp79 skipped root count actual delta | 0 |
| cFp80 root feature row count | 3979 |
| cFp80 root feature vs cFp79 delta | 0 |
| cFp80 compact action row count | 18820 |
| cFp80 compact action vs cFp79 delta | 0 |
| cFp80 skipped root row count | 63 |
| cFp80 skipped root vs cFp79 delta | 0 |
| compact action rows with invalid root ref id | 0 |
| compact action rows with invalid public action ref id | 0 |
| duplicate reconstructed action identity refs | 0 |
| reconstruction mismatch count | 0 |
| source artifact reference count | 6 |
| source artifact empty hash count | 0 |

## Row Counts

| Row kind | Count |
|---|---:|
| root feature rows | 3979 |
| compact action feature rows | 18820 |
| source action feature rows | 18820 |
| skipped root rows | 63 |
| reconstructed action rows | 18820 |

## Dictionary Counts

| Dictionary | Count | SHA-256 |
|---|---:|---|
| actionKinds | 6 | e3f30acd3732ae6a230b16eea86ec32e19b432b01c759ad852c97d875b9ef601 |
| moveCountBuckets | 3 | 86baa95adf1e44cbee31fc9bdfa40620f0f53c53f98c38fac837f838febb68df |
| optionIndexLabels | 1 | 6c110a9f02bcdd4fc92f823f6cbec485dc464455bad8b8742ae2ed2d127a38ba |
| publicActionRefs | 13 | 6a91f3d2ac7e2516b05b17c2b54d29618ca098e5beb31cff6e35741452228c2b |
| readinessStatuses | 4 | 61e4f6fbd7fe446b0b1bf68af18639e4bf7ca6dec611bdf8a442617d70026d64 |
| rootRefs | 3979 | 4cd99cb05b951b959bab54beba96a9cbcdbb6c066889f221ace3af7dd80b860a |
| schemaVersions | 8 | 7e502855cad902c1333cb42467b7e584097dd0babfdbdc7e410fbd52c8574928 |
| sourceClasses | 6 | 53ccfdde7d1fa6f00a93c8d9647e60f8e560415b4f6e61985ba0245beacff15f |
| strengthBuckets | 1 | 6c110a9f02bcdd4fc92f823f6cbec485dc464455bad8b8742ae2ed2d127a38ba |
| targets | 15 | 8b064a9bad7ea473a550c1ef56000ac97e7d17e07fc0388b04c8346fdab6d5b7 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| source cFp79 action-features.jsonl | 10518156 | source baseline |
| action-features-compact.jsonl | 5615464 | below 50 MB robust target, below 90 MB hard stop |
| root-features.jsonl | 9600100 | below 90 MB hard stop |
| skipped-roots.jsonl | 109368 | below 90 MB hard stop |
| dictionaries.json | 95304 | metadata |

- compact action bytes saved: 4902692
- compact action percent bytes saved: 46.61
- robust target status: not_robust_suite

## Reconstruction

- status: passed
- reconstructed action rows: 18820
- source action rows: 18820
- mismatch count: 0

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

All cFp80 machine-readable rows are deterministic scalar projections over committed cFp79 feature rows. Compact action rows carry dictionary ids and public scalar action fields only; their row-constant schema/run metadata is declared once in manifest and summary. They omit full joined references, raw move payloads, private hand/deck data, sampled-world payloads, value estimates, ranking fields, and rollout outputs.

## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/manifest.json | 394e4ca20567ac5191314249cba4fb9ad573a0cf9cc46fcee0032adb7e98dac0 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/summary.json | 77e341f04c1515bb7cb0f75e7fa87c1bab0b0e6b9ca78f3ac6a5ec17b583f092 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/root-features.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/root-features.jsonl | c509d4dc052dcb4f53af8865bd316375c1f6e198523b6a4fcce8517652795480 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/action-features.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/action-features.jsonl | 0f330af5b6fc0ef0ebd62fd4ecebbaa47fcc653a5e82a98793ff04476f946e26 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/skipped-roots.jsonl | 1c13ca51a622186be955ad179e7dddd93927bb1ee30b81f990a1e3310c017eb4 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v1/cFp79/report.md | eeab1615f4e8b815480005775d2ec90cd6fc9fab6ba33d0a09a409d801f81a3b |

## Non-Claims

- cFp80 does not choose actions or recommend best actions.
- cFp80 does not rank actions or compute action ordering.
- cFp80 does not estimate action values or expected values.
- cFp80 does not estimate win probability or reward targets.
- cFp80 does not compute payoff tables or principal variations.
- cFp80 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.
- cFp80 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.
- cFp80 does not select moves for product AI.
- cFp80 does not re-observe benchmark roots or run the benchmark suite.
- cFp80 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.
- cFp80 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.
- cFp80 does not add AI Lab runner buttons or execute benchmarks from the browser.
- cFp80 does not add difficulty tiers, export training data, or add Python tooling.
- cFp80 does not modify cFp79, cFp76, or cFp78 artifacts.

## cFp81 Recommendation

cFp81 may create a strictly benchmark-only action-feature casebook or consumer-readiness report over cFp80 compact artifacts; it must not add rollout, value, ranking, best-action, win-probability, reward-target, or product-AI behavior.
