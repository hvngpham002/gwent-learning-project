# Public Action Identities v0

## Run

- suite id: benchmark-v1-starter-matrix-v1
- identity run id: benchmark-v1-starter-matrix-v1:public-action-identities-v0:cFp77
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- identity readiness status: identity_ready

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp68 contract status | probe_ready |
| cFp69 probe readiness status | probe_ready |
| cFp76 consumer readiness status | action_feature_source_gap |
| cFp68 eligible root count | 3979 |
| cFp68 skipped root count | 63 |
| cFp69 probe root count | 3979 |
| cFp69 skipped root count | 63 |
| cFp76 root feature row count | 3979 |
| cFp76 action feature row count | 0 |
| cFp76 action-feature-gap row count | 5 |
| cFp76 skipped root row count | 63 |
| cFp68 eligible root count vs actual eligible-roots.jsonl delta | 0 |
| cFp68 skipped root count vs actual skipped-roots.jsonl delta | 0 |
| cFp69 probe root count vs actual probe-roots.jsonl delta | 0 |
| cFp69 skipped root count vs actual skipped-roots.jsonl delta | 0 |
| cFp76 root feature row count vs actual root-features.jsonl delta | 0 |
| cFp76 skipped root row count vs cFp69 skipped root count delta | 0 |
| cFp76 skipped root row count vs cFp68 skipped root count delta | 0 |
| cFp76 readiness is action_feature_source_gap | true |
| cFp76 action feature row count is zero | true |
| cFp76 action-feature-gap row count is positive | true |
| observed root count | 3979 |
| duplicate observed root keys | 0 |
| duplicate cFp68 eligible root keys | 0 |
| duplicate cFp69 probe root keys | 0 |
| duplicate cFp69 skipped root keys | 0 |
| observed roots missing cFp68 eligible root | 0 |
| cFp68 eligible roots missing observed root | 0 |
| observed roots missing cFp69 probe root | 0 |
| cFp69 probe roots missing observed root | 0 |
| public action count mismatch root count | 0 |
| legal move count mismatch root count | 0 |
| action identity row count | 18820 |
| cFp69 public action count total | 18820 |
| action identity row count delta | 0 |
| duplicate action identity keys | 0 |
| skipped root key mismatch count | 0 |
| source artifact reference count | 15 |
| source artifact empty hash count | 0 |

## Row Counts

| Row kind | Count |
|---|---:|
| action identity rows | 18820 |
| root summary rows | 3979 |
| skipped root rows | 63 |

## Count Summaries

### By Phase

| Phase | Count |
|---|---:|
| mulligan | 348 |
| playing | 18141 |
| round_end | 331 |

### By Round

| Round | Count |
|---|---:|
| 1 | 14624 |
| 2 | 3188 |
| 3 | 1008 |

### By Policy

| Policy | Count |
|---|---:|
| headless-round-end-auto-resolver | 331 |
| legal-heuristic-v0 | 9302 |
| legal-heuristic-v1 | 9187 |

### By Faction

| Faction | Count |
|---|---:|
| monsters | 3134 |
| nilfgaard | 4140 |
| northern_realms | 5071 |
| scoiatael | 3120 |
| skellige | 3355 |

### By Deck Preset

| Deck preset | Count |
|---|---:|
| official-monsters-starter | 3134 |
| official-nilfgaard-starter | 4140 |
| official-northern-realms-starter | 5071 |
| official-scoiatael-starter | 3120 |
| official-skellige-starter | 3355 |

### By Matchup

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

### Public Action Kind Counts

| Kind | Count |
|---|---:|
| choose_mulligan | 300 |
| choose_prompt_option | 290 |
| pass | 3162 |
| play_card | 13249 |
| resolve_round_end | 331 |
| use_leader | 1488 |

### Target Kind Counts

| Target kind | Count |
|---|---:|
| board_row | 6582 |
| card | 1558 |
| deck_card_source | 512 |
| none | 6084 |
| row_horn | 2592 |
| weather | 1492 |

### Target Side Counts

| Target side | Count |
|---|---:|
| none | 6084 |
| opponent | 392 |
| own | 10852 |
| public | 1492 |

### Bucket Size Class Counts

| Bucket size class | Count |
|---|---:|
| large_collision | 1119 |
| single | 13657 |
| small_collision | 4044 |

### Action Family Counts

| Action family | Count |
|---|---:|
| leader | 1488 |
| mulligan | 300 |
| pass | 3162 |
| prompt | 290 |
| round_resolution | 331 |
| unit_play | 13249 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| action-identities.jsonl | 6704468 | below 50 MB robust target, below 90 MB hard stop |
| root-summaries.jsonl | 4948087 | below 90 MB hard stop |
| skipped-roots.jsonl | 103383 | below 90 MB hard stop |

## Hidden-Info Safety

- scan status: clean
- hazards detected: none

All rows in action-identities.jsonl, root-summaries.jsonl, and skipped-roots.jsonl are derived from the existing safe public action abstraction (collapsed public action buckets) plus scalar/count-map derivations of committed cFp68/cFp69 artifacts. No raw move IDs, card instance IDs, card source IDs, source IDs, card/leader names, deck order, sampled hand/deck contents, final match state, command/event logs, decision traces, action values, or rollout results appear in machine-readable rows.

## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/manifest.json | 4555bb2d7a4357e0eff3db189c36a9837eb3ae569a55c0ad6cd254457272d558 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/summary.json | 3b52cb515229480cb22725492c925f1e2ccc8099bd5c0b10de851a802201a029 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/eligible-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/eligible-roots.jsonl | 43c0dffc9742df50c18418eaa93e83effd429b37b53b36d56b92adb76e2d4d87 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/skipped-roots.jsonl | b2b8dda27d7f61437aee50f4d0d3bae16f4b2c6595352e638c041edfbd2e2406 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/report.md | 7baabcfe6b440e0a7f14a21eb72666e95abb2bc65abeb4be9b5140d57a3ddd0b |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/manifest.json | 46234a57bd57b1d0da7b2af6d2437fc5cd75d4b8096b058d1a72d76e024a8d14 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/summary.json | d5be37fa882ae443029653c1b80854af74fb18a54aeeb026dcf0a40195ffbfc6 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/probe-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/probe-roots.jsonl | fd1bdf4048231ffca218fa934aef7e4ed6452f258bb0f4b125cd994491277a9f |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl | 63de4c0f60b8aeb56ea6a9dbc59643b9dabf931862683ba53ff08396ba29535c |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/report.md | 3558f3c7bc46bff48505ebb5759d46721ec7c0f00183b12b7673676b82c67ed6 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/manifest.json | 8eeccfbbac23cc9192cc9264c58a93e8e808779654ec4b0bec3e6c9b5470db6d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/summary.json | 66294d4759ff4bc5dc49576fa5c62311615ed87306df136887eac7551576f9d1 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/root-features.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/root-features.jsonl | 83875d13214b3f01df55542695b49490826f78962719db442d9af023424de776 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl | 5331f1a9268fef8aec251a5fbae2e1226acea2619f5f6675ae23577aee69920e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/search-consumer-action-features-v0/cFp76/report.md | 18b5bd9ac425fddbd3eed23a796eb57604cdec93d650dd16e30cbe9e6cb0fc96 |

## Non-Claims

- cFp77 does not choose actions or recommend best actions.
- cFp77 does not rank actions or compute action ordering.
- cFp77 does not estimate action values or expected values.
- cFp77 does not estimate win probability or reward targets.
- cFp77 does not compute payoff tables or principal variations.
- cFp77 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.
- cFp77 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.
- cFp77 does not select moves for product AI.
- cFp77 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.
- cFp77 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.
- cFp77 does not add AI Lab runner buttons or execute benchmarks from the browser.
- cFp77 does not add difficulty tiers, export training data, or add Python tooling.
- cFp77 does not expose raw move IDs, card/source identities, deck order, sampled hands/decks, or hidden payloads.

## cFp78 Recommendation

cFp78 should repair search-consumer-action-features-v0 by joining cFp76 root features to cFp77 public-action identities, producing nonempty action feature rows without action values or ranking.
