# Public Action Identities v0

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- identity run id: benchmark-v1-starter-matrix-robust-v1:public-action-identities-v0:cFp77
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- identity readiness status: identity_ready

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp68 contract status | probe_ready |
| cFp69 probe readiness status | probe_ready |
| cFp76 consumer readiness status | action_feature_source_gap |
| cFp68 eligible root count | 32147 |
| cFp68 skipped root count | 340 |
| cFp69 probe root count | 32147 |
| cFp69 skipped root count | 340 |
| cFp76 root feature row count | 32147 |
| cFp76 action feature row count | 0 |
| cFp76 action-feature-gap row count | 5 |
| cFp76 skipped root row count | 340 |
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
| observed root count | 32147 |
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
| action identity row count | 153842 |
| cFp69 public action count total | 153842 |
| action identity row count delta | 0 |
| duplicate action identity keys | 0 |
| skipped root key mismatch count | 0 |
| source artifact reference count | 14 |
| source artifact empty hash count | 0 |

## Row Counts

| Row kind | Count |
|---|---:|
| action identity rows | 153842 |
| root summary rows | 32147 |
| skipped root rows | 340 |

## Count Summaries

### By Phase

| Phase | Count |
|---|---:|
| mulligan | 2948 |
| playing | 148249 |
| round_end | 2645 |

### By Round

| Round | Count |
|---|---:|
| 1 | 122845 |
| 2 | 23573 |
| 3 | 7424 |

### By Policy

| Policy | Count |
|---|---:|
| headless-round-end-auto-resolver | 2645 |
| legal-heuristic-v0 | 77569 |
| legal-heuristic-v1 | 73628 |

### By Faction

| Faction | Count |
|---|---:|
| monsters | 25330 |
| nilfgaard | 37047 |
| northern_realms | 39038 |
| scoiatael | 24693 |
| skellige | 27734 |

### By Deck Preset

| Deck preset | Count |
|---|---:|
| official-monsters-starter | 25330 |
| official-nilfgaard-starter | 37047 |
| official-northern-realms-starter | 39038 |
| official-scoiatael-starter | 24693 |
| official-skellige-starter | 27734 |

### By Matchup

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

### Public Action Kind Counts

| Kind | Count |
|---|---:|
| choose_mulligan | 2548 |
| choose_prompt_option | 2048 |
| pass | 25571 |
| play_card | 109695 |
| resolve_round_end | 2645 |
| use_leader | 11335 |

### Target Kind Counts

| Target kind | Count |
|---|---:|
| board_row | 52974 |
| card | 12883 |
| deck_card_source | 3736 |
| none | 48432 |
| row_horn | 23524 |
| weather | 12293 |

### Target Side Counts

| Target side | Count |
|---|---:|
| none | 48432 |
| opponent | 2965 |
| own | 90152 |
| public | 12293 |

### Bucket Size Class Counts

| Bucket size class | Count |
|---|---:|
| large_collision | 11441 |
| single | 110213 |
| small_collision | 32188 |

### Action Family Counts

| Action family | Count |
|---|---:|
| leader | 11335 |
| mulligan | 2548 |
| pass | 25571 |
| prompt | 2048 |
| round_resolution | 2645 |
| unit_play | 109695 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| action-identities.jsonl | 54892627 | at or above 50 MB robust target (cFp78 compaction recommended), below 90 MB hard stop |
| root-summaries.jsonl | 40930740 | below 90 MB hard stop |
| skipped-roots.jsonl | 566578 | below 90 MB hard stop |

## Hidden-Info Safety

- scan status: clean
- hazards detected: none

All rows in action-identities.jsonl, root-summaries.jsonl, and skipped-roots.jsonl are derived from the existing safe public action abstraction (collapsed public action buckets) plus scalar/count-map derivations of committed cFp68/cFp69 artifacts. No raw move IDs, card instance IDs, card source IDs, source IDs, card/leader names, deck order, sampled hand/deck contents, final match state, command/event logs, decision traces, action values, or rollout results appear in machine-readable rows.

## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/manifest.json | 735a87e2dea500878eaec01823dae886f14e11448d7c83cd87ea7490da7f7cfd |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/summary.json | 2ade0597b1f3f4edf11047846d31cb2d281df50b21e9c374010fda71530d03db |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/eligible-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/eligible-roots.jsonl | 7396adbf22084b0ab0515fdc6fb239bcd2e32c72404bfc5d800eebff62f5d97f |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/skipped-roots.jsonl | 91353f4a302cf755f7c2bb3196df5bf5643c31fa590287074531dccf5af0dd50 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/report.md | a70d26e484c303cfa5dfc9f12d2ad16e71c8f8bc31acea008e4132cd0795f9d4 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/manifest.json | 63725e400a6d8ae1ab6361d93ddabea8ab3c1fc4338a9b92d57dbf17435471f7 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/summary.json | 8c8ceb1dfd2ffaa2d8910c22f7fb6ee167fafcd0ff5ac5fe6a4d6ed6fdf52039 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/probe-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/probe-roots.jsonl | c6688e88f8341e260254eef8bb7d6bb65a0bd9c78daceae35663232449878627 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl | 5d51db39d4c7170b38f1789e139744b3b2b1f22b96fb418b800ffad2c12e2cad |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69/report.md | bf90d61f71c42436ba5be43b44bd0437930a8acdd738f0a1ae06e8051d5b4981 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/manifest.json | f674e8132487567e3ddcb7d09e449961ca82d6431bb84d416159f5a60cc71423 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/summary.json | ef09b4f457e128bfdca04273b1bab233b2e65310a96d77c3cc2c9f6b642d7012 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl | 98e129647b77149c474ce3c27f8cb6c99a3fefaf1aa889bb7a33f21c17030eb0 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/search-consumer-action-features-v0/cFp76/report.md | 436de2671d8ebf1fc4f3b530d4e7e2057330018e0ff50c5b534619b372712545 |

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

cFp78 should compact the cFp77 action row projection or create a deterministic casebook subset before consumer work.
