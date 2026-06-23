# Search Consumer Action Features v1

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- feature run id: cFp79
- phase id: cFp79
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- source cFp76 run id: benchmark-v1-starter-matrix-robust-v1:search-consumer-action-features-v0:cFp76
- source cFp78 run id: benchmark-v1-starter-matrix-robust-v1:public-action-identities-compact-v0:cFp78
- consumer readiness status: features_ready

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp76 consumer readiness status | action_feature_source_gap |
| cFp76 source consistency status | ready |
| cFp78 compact readiness status | compact_ready |
| cFp78 source consistency status | ready |
| cFp76 root feature summary count | 32147 |
| cFp76 root feature actual count | 32147 |
| cFp76 root feature count actual delta | 0 |
| cFp76 skipped root summary count | 340 |
| cFp76 skipped root actual count | 340 |
| cFp76 skipped root count actual delta | 0 |
| cFp78 compact action summary count | 153842 |
| cFp78 compact action actual count | 153842 |
| cFp78 compact action count actual delta | 0 |
| cFp78 root-index summary count | 32147 |
| cFp78 root-index actual count | 32147 |
| cFp78 root-index count actual delta | 0 |
| cFp78 skipped root summary count | 340 |
| cFp78 skipped root actual count | 340 |
| cFp78 skipped root count actual delta | 0 |
| duplicate cFp76 root identity keys | 0 |
| duplicate cFp78 root identity keys | 0 |
| cFp76 root features without exactly one cFp78 root-index row | 0 |
| cFp78 root-index rows without exactly one cFp76 root feature | 0 |
| cFp76 skipped roots without cFp78 skipped root | 0 |
| cFp78 skipped roots without cFp76 skipped root | 0 |
| cFp79 root feature row count | 32147 |
| cFp79 root feature vs cFp76 delta | 0 |
| cFp79 action feature row count | 153842 |
| cFp79 action feature vs cFp78 delta | 0 |
| cFp79 skipped root row count | 340 |
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
| root feature rows | 32147 |
| action feature rows | 153842 |
| skipped root rows | 340 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| root-features.jsonl | 77755094 | below 90 MB hard stop |
| action-features.jsonl | 86029163 | at or above 50 MB robust target; compact before cFp80 consumer work |
| skipped-roots.jsonl | 592758 | below 90 MB hard stop |

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

All cFp79 machine-readable rows are deterministic scalar joins over committed cFp76 root features and cFp78 compact public action identities. Action rows carry compact public action-local fields plus rootRef joins only; they do not duplicate cFp76 root payloads or carry raw move, card, private hand/deck, sampled-world, value, ranking, or rollout payloads.

## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/manifest.json | f674e8132487567e3ddcb7d09e449961ca82d6431bb84d416159f5a60cc71423 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/summary.json | ef09b4f457e128bfdca04273b1bab233b2e65310a96d77c3cc2c9f6b642d7012 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/root-features.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/root-features.jsonl | 2c5bf4b543d6dbc918dc094bd2f60a2a8da82d108153f4d6467a9a1bf53940a3 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl | 98e129647b77149c474ce3c27f8cb6c99a3fefaf1aa889bb7a33f21c17030eb0 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/skipped-roots.jsonl | e5c9f61c998ce15890f5609c81b1e24bf12b6604d481c02307e4332df0d5304d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/report.md | 436de2671d8ebf1fc4f3b530d4e7e2057330018e0ff50c5b534619b372712545 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/manifest.json | 676dd5984f35f1ee788cf99285be785a444e73cfeec04014345251364d606193 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/summary.json | 9c8d30827d1ffe435aa2a05bfb244c01495257457bfc149eeb50e8d6891ba8a8 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/action-identities-compact.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/action-identities-compact.jsonl | f0d88b47024953583422fc3da10752c990ed035b292db28b3345d7dc276a0886 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/root-index.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/root-index.jsonl | ec53c3a4933cef77a19f07ed39f6c7fec304cd2134cdea205466f40e076f9d0d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/skipped-roots.jsonl | 39c560f502f4b05e8e292179e60664ab3ec89553efa7b45fa47c52b80d5267fd |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-compact-v0/cFp78/report.md | 168e8e7011ec3862b28d37369f0f434adf6e52d10bab4f1ab5373e01c4d701bd |

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

cFp80 should first compact or dictionary-encode the cFp79 action-feature projection before any consumer casebook work.
