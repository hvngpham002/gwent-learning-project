# Sampler Post-cFp66 Invalid-Root Casebook

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- casebook run id: benchmark-v1-starter-matrix-robust-v1:sampler-post-cfp66-invalid-root-casebook:cFp67
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- total roots: 32487
- valid roots: 32147
- invalid roots: 340
- invalid-root percentage: 1.047%
- matches: 1000

## Source Artifact Inputs

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-invalid-roots/cFp62/invalid-roots.jsonl | fbe36e8fee344e09bea5c35a1a5bdf9e66f255fa7d3f6810675b83d911cbe45a |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-invalid-roots/cFp62/manifest.json | 5d31d55862752de40a69923e064b29fb4a549aadfde2ffa167366f65eceba152 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-invalid-roots/cFp62/report.md | bfdf8225489c14e8d3aa74d16d789a82f3d4bf70349c47b73a1ee26b66fff6f7 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-invalid-roots/cFp62/summary.json | e19702f8812120d9a1381ccfe25cc3c38427f4bf25cb595faf25a18800fed5c7 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-materialization/cFp61/manifest.json | b2c5dbe9a1626012ee8a319781273c361d3683bfbb256b0f1aedd04968344925 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-materialization/cFp61/report.md | 6a1eec61d3d281e45b537417810c281341ca4597d92865d5237bea684b920b4b |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-materialization/cFp61/roots.jsonl | 2da544560cee4a01a0b4ef2db6d59530ce3e15abf198cd7797eefdb32756252c |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-materialization/cFp61/summary.json | 5ae45341aed4c2d9e9d098053c6ea9ad432d6fd916c66279a5a1401ba515617e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-public-zone-provenance/cFp64/manifest.json | b9bf70df74d9325cdf54ae388cc57b854290aa43b50df2e0586eb743dc6f3ec5 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-public-zone-provenance/cFp64/provenance-roots.jsonl | b76cf33b5c963aaa3fd237fb562f3cbb505b3b630d290eb60cd8a44696ce1323 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-public-zone-provenance/cFp64/report.md | d16cd86327113a0b6c0ca6f4161b50e4b6d69afb8985324f320fbb8ddc499afd |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-public-zone-provenance/cFp64/summary.json | 630d0cdee1ea55c680e1a98427a068ecd3b69168cbbc6c0efbdc62f4ce0f3eae |

## Source Consistency

| Check | Count |
|---|---:|
| materialization roots | 32487 |
| materialization valid roots | 32147 |
| materialization invalid roots | 340 |
| invalid-root records | 340 |
| provenance records | 340 |
| missing provenance records | 0 |
| extra provenance records | 0 |
| valid-root records emitted | 0 |

## Primary Classification

| Classification | Count |
|---|---:|
| candidate_deeper_reconstruction | 0 |
| candidate_valid_root_only_skip | 340 |
| classification_unavailable | 0 |

## Secondary Classifications

### Public Transfer

| Classification | Count |
|---|---:|
| hidden_deck_transfer_present | 0 |
| hidden_hand_transfer_present | 0 |
| no_known_hidden_transfer_at_invalid_root | 0 |
| public_transfer_adjustment_present | 0 |
| public_transfer_memory_not_applicable | 340 |

### Persistent Deficit

| Classification | Count |
|---|---:|
| classification_unavailable | 0 |
| persistent_public_zone_count_deficit | 340 |

### Deficit Size

| Classification | Count | Share of invalid roots |
|---|---:|---:|
| multi_card_deficit | 1 | 0.294% |
| one_card_deficit | 339 | 99.706% |

### Phase

| Classification | Count |
|---|---:|
| classification_unavailable | 0 |
| playing_phase | 312 |
| round_end_phase | 28 |

## Invalid Root Distributions

### Phase

| Phase | Count | Share of invalid roots |
|---|---:|---:|
| playing | 312 | 91.765% |
| round_end | 28 | 8.235% |

### Round

| Round | Count | Share of invalid roots |
|---|---:|---:|
| 1 | 222 | 65.294% |
| 2 | 96 | 28.235% |
| 3 | 22 | 6.471% |

### Faction

| Faction | Count | Share of invalid roots |
|---|---:|---:|
| monsters | 26 | 7.647% |
| nilfgaard | 102 | 30.000% |
| northern_realms | 136 | 40.000% |
| scoiatael | 37 | 10.882% |
| skellige | 39 | 11.471% |

### Policy

| Policy | Count | Share of invalid roots |
|---|---:|---:|
| headless-round-end-auto-resolver | 28 | 8.235% |
| legal-heuristic-v0 | 246 | 72.353% |
| legal-heuristic-v1 | 66 | 19.412% |

### Deck Preset

| Deck preset | Count | Share of invalid roots |
|---|---:|---:|
| official-monsters-starter | 26 | 7.647% |
| official-nilfgaard-starter | 102 | 30.000% |
| official-northern-realms-starter | 136 | 40.000% |
| official-scoiatael-starter | 37 | 10.882% |
| official-skellige-starter | 39 | 11.471% |

### Provenance Label

| Provenance label | Count | Share of invalid roots |
|---|---:|---:|
| mixed_public_zones | 229 | 67.353% |
| round_end_public_zone | 28 | 8.235% |
| single_zone_board | 54 | 15.882% |
| single_zone_discard | 29 | 8.529% |

### Matchup

| Matchup | Count | Share of invalid roots |
|---|---:|---:|
| starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1 | 23 | 6.765% |
| starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 17 | 5.000% |
| starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 12 | 3.529% |
| starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 31 | 9.118% |
| starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0 | 42 | 12.353% |
| starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 44 | 12.941% |
| starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1 | 14 | 4.118% |
| starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 59 | 17.353% |
| starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 18 | 5.294% |
| starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1 | 16 | 4.706% |
| starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 6 | 1.765% |
| starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0 | 37 | 10.882% |
| starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 13 | 3.824% |
| starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 8 | 2.353% |

## Public Transfer Scalar Buckets

| Bucket | Count | Share of invalid roots |
|---|---:|---:|
| zero known hidden transfer | 340 | 100.000% |
| hidden hand transfer present | 0 | 0.000% |
| hidden deck transfer present | 0 | 0.000% |
| public-transfer adjustment present | 0 | 0.000% |
| uncovered deficit present | 340 | 100.000% |

## Public Transfer Scalar Totals

| Scope | Visible memory refs | Known hidden hand | Known hidden deck | Adjustments | Uncovered deficit cards | Incoherent roots |
|---|---:|---:|---:|---:|---:|---:|
| all roots | 231369 | 524 | 0 | 1 | 341 | 0 |
| invalid roots | 2739 | 0 | 0 | 0 | 341 | 0 |

## Valid-Root-Only Skip Counters

- skipped invalid roots: 340
- skipped-root percentage of all roots: 1.047%
- required cFp68 counters: suite, phase, round, matchup, policy, faction, deck preset, provenance label, invalid reason, skipped-root percentage beside every probe result

### Skip Count By Phase

| Phase | Count |
|---|---:|
| playing | 312 |
| round_end | 28 |

### Skip Count By Round

| Round | Count |
|---|---:|
| 1 | 222 |
| 2 | 96 |
| 3 | 22 |

### Skip Count By Provenance Label

| Provenance label | Count |
|---|---:|
| mixed_public_zones | 229 |
| round_end_public_zone | 28 |
| single_zone_board | 54 |
| single_zone_discard | 29 |

## Hidden-Info Safety

cFp67 sampler post-cFp66 invalid-root casebook artifacts contain only suite metadata, scalar counts, enum-like classifications, and public benchmark dimensions. They exclude private identity payloads, sampled hidden payloads, engine logs, final payloads, action references, and debug payloads.

## Non-Search Warning

cFp67 is analysis and evaluation infrastructure only. It does not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, sampler behavior changes, or product difficulty changes.

## Recommendation For cFp68

cFp68 should define a valid-root-only determinized probe contract. It must skip invalid sampler roots explicitly, count skipped roots by suite, phase, round, matchup, policy, faction, deck preset, provenance label, and invalid reason, and report skipped-root percentages next to every search-readiness/probe result. It must not treat skipped roots as wins, losses, or draws, and must not silently drop them.
