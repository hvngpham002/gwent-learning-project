# Search Consumer Action Feature Dictionary v0

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- feature run id: cFp80
- phase id: cFp80
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- source cFp79 run id: cFp79
- consumer readiness status: dictionary_ready

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp79 consumer readiness status | features_ready |
| cFp79 source consistency status | ready |
| cFp79 root feature summary count | 32147 |
| cFp79 root feature actual count | 32147 |
| cFp79 root feature count actual delta | 0 |
| cFp79 action feature summary count | 153842 |
| cFp79 action feature actual count | 153842 |
| cFp79 action feature count actual delta | 0 |
| cFp79 skipped root summary count | 340 |
| cFp79 skipped root actual count | 340 |
| cFp79 skipped root count actual delta | 0 |
| cFp80 root feature row count | 32147 |
| cFp80 root feature vs cFp79 delta | 0 |
| cFp80 compact action row count | 153842 |
| cFp80 compact action vs cFp79 delta | 0 |
| cFp80 skipped root row count | 340 |
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
| root feature rows | 32147 |
| compact action feature rows | 153842 |
| source action feature rows | 153842 |
| skipped root rows | 340 |
| reconstructed action rows | 153842 |

## Dictionary Counts

| Dictionary | Count | SHA-256 |
|---|---:|---|
| actionKinds | 6 | e3f30acd3732ae6a230b16eea86ec32e19b432b01c759ad852c97d875b9ef601 |
| moveCountBuckets | 3 | 86baa95adf1e44cbee31fc9bdfa40620f0f53c53f98c38fac837f838febb68df |
| optionIndexLabels | 1 | 6c110a9f02bcdd4fc92f823f6cbec485dc464455bad8b8742ae2ed2d127a38ba |
| publicActionRefs | 14 | 516f16adce3aa8dda25ff59a5876817af1d565ff19d0cf40e5ef921f13c556fb |
| readinessStatuses | 4 | 61e4f6fbd7fe446b0b1bf68af18639e4bf7ca6dec611bdf8a442617d70026d64 |
| rootRefs | 32147 | b91cc53b0c3213bc0bddd2758f1745603c5f2f88a9ab8ff91b2baa9a7a6ea282 |
| schemaVersions | 8 | 7e502855cad902c1333cb42467b7e584097dd0babfdbdc7e410fbd52c8574928 |
| sourceClasses | 6 | 53ccfdde7d1fa6f00a93c8d9647e60f8e560415b4f6e61985ba0245beacff15f |
| strengthBuckets | 1 | 6c110a9f02bcdd4fc92f823f6cbec485dc464455bad8b8742ae2ed2d127a38ba |
| targets | 15 | 8b064a9bad7ea473a550c1ef56000ac97e7d17e07fc0388b04c8346fdab6d5b7 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| source cFp79 action-features.jsonl | 86029163 | source baseline |
| action-features-compact.jsonl | 46044793 | below 50 MB robust target, below 90 MB hard stop |
| root-features.jsonl | 78173005 | below 90 MB hard stop |
| skipped-roots.jsonl | 596498 | below 90 MB hard stop |
| dictionaries.json | 743205 | metadata |

- compact action bytes saved: 39984370
- compact action percent bytes saved: 46.48
- robust target status: below_50_mb_target

## Reconstruction

- status: passed
- reconstructed action rows: 153842
- source action rows: 153842
- mismatch count: 0

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

## Hidden-Info Safety

- scan status: clean
- hazards detected: none

All cFp80 machine-readable rows are deterministic scalar projections over committed cFp79 feature rows. Compact action rows carry dictionary ids and public scalar action fields only; their row-constant schema/run metadata is declared once in manifest and summary. They omit full joined references, raw move payloads, private hand/deck data, sampled-world payloads, value estimates, ranking fields, and rollout outputs.

## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/manifest.json | e29e031831d4b7b6656396b4486c0c27cd5dbabdaf12f01d5e2775d3a14e09fe |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/summary.json | 8ba1ce9b11fb00f642355fd136dc91b0edec217ed4e743e1a326e09ba67ab456 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/root-features.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/root-features.jsonl | 3c92b9ad317f1b2031a672cfab5588ad6cd9f5fa8b9174061d25c42f5a2e68b3 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/action-features.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/action-features.jsonl | 749fb2828c9c4419e1091f06cdff0bc2d0c7ecfd3e24e4be22811b948c64c5df |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/skipped-roots.jsonl | 8ba5c854c1bfceed63d47e0259a78a8f4a2c6e769070d9cdff86c394a8805872 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v1/cFp79/report.md | b91f03b37f231baa5d684fa5de221daf3421d86f00f6070447b9514d49cef6c1 |

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
