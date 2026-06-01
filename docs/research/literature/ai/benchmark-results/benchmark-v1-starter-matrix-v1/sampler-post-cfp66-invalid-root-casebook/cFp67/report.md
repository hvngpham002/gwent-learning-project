# Sampler Post-cFp66 Invalid-Root Casebook

## Run

- suite id: benchmark-v1-starter-matrix-v1
- casebook run id: benchmark-v1-starter-matrix-v1:sampler-post-cfp66-invalid-root-casebook:cFp67
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- total roots: 4042
- valid roots: 3979
- invalid roots: 63
- invalid-root percentage: 1.559%
- matches: 120

## Source Artifact Inputs

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-invalid-roots/cFp62/invalid-roots.jsonl | 70a2631fb053ad8ba9e08f4376058bc63be3f8f3308db627ef55ae33bb4feaa0 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-invalid-roots/cFp62/manifest.json | ff5ee73840ec84b1f4394f42def14edc7d0868012f25dca8278fc3857ee9e269 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-invalid-roots/cFp62/report.md | 665a98b43d65d5b0f8a81d92df2a34b776edbbcbb7a42df8ab677d2ee264b012 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-invalid-roots/cFp62/summary.json | 1e33063ecda08ab53ba9482201dd65dc47cefc82741240161ea3bbccb62bffc2 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-materialization/cFp61/manifest.json | a618bff5c02cbd47aa63009684569dedc546b004f9bd0348352876ff70b1b506 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-materialization/cFp61/report.md | 2ab5e6d847e1e16a5fd10395c93f00cfdbe8508c4857c2a6cfb5750e93b83f08 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-materialization/cFp61/roots.jsonl | b6247d3b60e884bbc87a2ca1afa0209fa201359da2391785e1685f9214ae4ed8 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-materialization/cFp61/summary.json | 9f1b5d609cdaa7df7735855e37455ad245a823062a2659497eae8bb18939f7ee |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-public-zone-provenance/cFp64/manifest.json | 9acc9c3ed6877376af552f263a53b4ebc32bbc8896705e7288c8524824f50870 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-public-zone-provenance/cFp64/provenance-roots.jsonl | 7db5ff99491ac4dcfc29b8f8e608cb2ae4a3ba2c9889355fbe3100fab6240193 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-public-zone-provenance/cFp64/report.md | 11b8e2e6b3a0d512d3234084481ee3dc81dc5f49fad8b1b891fad9f9bf468f5d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-public-zone-provenance/cFp64/summary.json | 2bc933b0f858487216126bf0b203eb29ca475762070e2cd51b15d64d88a2ea69 |

## Source Consistency

| Check | Count |
|---|---:|
| materialization roots | 4042 |
| materialization valid roots | 3979 |
| materialization invalid roots | 63 |
| invalid-root records | 63 |
| provenance records | 63 |
| missing provenance records | 0 |
| extra provenance records | 0 |
| valid-root records emitted | 0 |

## Primary Classification

| Classification | Count |
|---|---:|
| candidate_deeper_reconstruction | 0 |
| candidate_valid_root_only_skip | 63 |
| classification_unavailable | 0 |

## Secondary Classifications

### Public Transfer

| Classification | Count |
|---|---:|
| hidden_deck_transfer_present | 0 |
| hidden_hand_transfer_present | 0 |
| no_known_hidden_transfer_at_invalid_root | 0 |
| public_transfer_adjustment_present | 0 |
| public_transfer_memory_not_applicable | 63 |

### Persistent Deficit

| Classification | Count |
|---|---:|
| classification_unavailable | 0 |
| persistent_public_zone_count_deficit | 63 |

### Deficit Size

| Classification | Count | Share of invalid roots |
|---|---:|---:|
| one_card_deficit | 63 | 100.000% |

### Phase

| Classification | Count |
|---|---:|
| classification_unavailable | 0 |
| playing_phase | 57 |
| round_end_phase | 6 |

## Invalid Root Distributions

### Phase

| Phase | Count | Share of invalid roots |
|---|---:|---:|
| playing | 57 | 90.476% |
| round_end | 6 | 9.524% |

### Round

| Round | Count | Share of invalid roots |
|---|---:|---:|
| 1 | 28 | 44.444% |
| 2 | 28 | 44.444% |
| 3 | 7 | 11.111% |

### Faction

| Faction | Count | Share of invalid roots |
|---|---:|---:|
| monsters | 4 | 6.349% |
| nilfgaard | 11 | 17.460% |
| northern_realms | 39 | 61.905% |
| scoiatael | 6 | 9.524% |
| skellige | 3 | 4.762% |

### Policy

| Policy | Count | Share of invalid roots |
|---|---:|---:|
| headless-round-end-auto-resolver | 6 | 9.524% |
| legal-heuristic-v0 | 47 | 74.603% |
| legal-heuristic-v1 | 10 | 15.873% |

### Deck Preset

| Deck preset | Count | Share of invalid roots |
|---|---:|---:|
| official-monsters-starter | 4 | 6.349% |
| official-nilfgaard-starter | 11 | 17.460% |
| official-northern-realms-starter | 39 | 61.905% |
| official-scoiatael-starter | 6 | 9.524% |
| official-skellige-starter | 3 | 4.762% |

### Provenance Label

| Provenance label | Count | Share of invalid roots |
|---|---:|---:|
| mixed_public_zones | 42 | 66.667% |
| round_end_public_zone | 6 | 9.524% |
| single_zone_board | 6 | 9.524% |
| single_zone_discard | 9 | 14.286% |

### Matchup

| Matchup | Count | Share of invalid roots |
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

## Public Transfer Scalar Buckets

| Bucket | Count | Share of invalid roots |
|---|---:|---:|
| zero known hidden transfer | 63 | 100.000% |
| hidden hand transfer present | 0 | 0.000% |
| hidden deck transfer present | 0 | 0.000% |
| public-transfer adjustment present | 0 | 0.000% |
| uncovered deficit present | 63 | 100.000% |

## Public Transfer Scalar Totals

| Scope | Visible memory refs | Known hidden hand | Known hidden deck | Adjustments | Uncovered deficit cards | Incoherent roots |
|---|---:|---:|---:|---:|---:|---:|
| all roots | 30004 | 51 | 0 | 0 | 63 | 0 |
| invalid roots | 589 | 0 | 0 | 0 | 63 | 0 |

## Valid-Root-Only Skip Counters

- skipped invalid roots: 63
- skipped-root percentage of all roots: 1.559%
- required cFp68 counters: suite, phase, round, matchup, policy, faction, deck preset, provenance label, invalid reason, skipped-root percentage beside every probe result

### Skip Count By Phase

| Phase | Count |
|---|---:|
| playing | 57 |
| round_end | 6 |

### Skip Count By Round

| Round | Count |
|---|---:|
| 1 | 28 |
| 2 | 28 |
| 3 | 7 |

### Skip Count By Provenance Label

| Provenance label | Count |
|---|---:|
| mixed_public_zones | 42 |
| round_end_public_zone | 6 |
| single_zone_board | 6 |
| single_zone_discard | 9 |

## Hidden-Info Safety

cFp67 sampler post-cFp66 invalid-root casebook artifacts contain only suite metadata, scalar counts, enum-like classifications, and public benchmark dimensions. They exclude private identity payloads, sampled hidden payloads, engine logs, final payloads, action references, and debug payloads.

## Non-Search Warning

cFp67 is analysis and evaluation infrastructure only. It does not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, sampler behavior changes, or product difficulty changes.

## Recommendation For cFp68

cFp68 should define a valid-root-only determinized probe contract. It must skip invalid sampler roots explicitly, count skipped roots by suite, phase, round, matchup, policy, faction, deck preset, provenance label, and invalid reason, and report skipped-root percentages next to every search-readiness/probe result. It must not treat skipped roots as wins, losses, or draws, and must not silently drop them.
