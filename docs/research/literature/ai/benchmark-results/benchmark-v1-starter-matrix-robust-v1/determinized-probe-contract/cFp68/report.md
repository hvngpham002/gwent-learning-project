# Determinized Probe Contract

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- contract run id: benchmark-v1-starter-matrix-robust-v1:determinized-probe-contract:cFp68
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- contract status: probe_ready
- total cFp61 roots: 32487
- eligible valid roots: 32147
- skipped invalid roots: 340
- skipped-root percentage: 1.047%
- cFp67 invalid-root records: 340
- matches: 1000

## Source Artifact Inputs

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-materialization/cFp61/manifest.json | b2c5dbe9a1626012ee8a319781273c361d3683bfbb256b0f1aedd04968344925 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-materialization/cFp61/summary.json | 5ae45341aed4c2d9e9d098053c6ea9ad432d6fd916c66279a5a1401ba515617e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-materialization/cFp61/roots.jsonl | 2da544560cee4a01a0b4ef2db6d59530ce3e15abf198cd7797eefdb32756252c |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-materialization/cFp61/report.md | 6a1eec61d3d281e45b537417810c281341ca4597d92865d5237bea684b920b4b |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/manifest.json | 4b4962f9c3ab5a99980f087afe8ee213657379a4100ff9eb7103c70b1c11a8aa |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/summary.json | 18dbe3730dbd6be14f718a6f5ccbcaf956359340920c157cb9805a8af67ff827 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/invalid-roots.jsonl | 65292a294825bbc94568e8c469cee2cd7e533738d27d9b2d8a83ed3bda1d4e06 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/report.md | 69f721117c7cffdbd909d616482e40b676b807546a0a2c438064bd0c74b98ebf |

## Source Consistency

| Check | Count |
|---|---:|
| materialization roots read | 32487 |
| materialization summary roots | 32487 |
| cFp67 skip records read | 340 |
| cFp67 summary invalid roots | 340 |
| invalid roots missing cFp67 records | 0 |
| cFp67 records without matching cFp61 invalid roots | 0 |
| duplicate cFp61 root keys | 0 |
| duplicate cFp67 root keys | 0 |
| valid cFp61 roots matched by cFp67 records | 0 |
| valid cFp61 roots emitted as skipped | 0 |
| invalid cFp61 roots emitted as eligible | 0 |
| invalid eligible sample-count roots | 0 |
| unsupported materialization status roots | 0 |
| contract mismatch skipped roots | 0 |
| records emitted | 32487 |
| eligible records emitted | 32147 |
| skipped records emitted | 340 |
| unaccounted cFp61 roots | 0 |

## Determinization Budget

| Metric | Count |
|---|---:|
| eligible roots | 32147 |
| total requested samples across eligible roots | 257176 |
| total valid samples across eligible roots | 257176 |

### Requested Samples Per Eligible Root

| Requested samples | Eligible roots |
|---|---:|
| 8 | 32147 |

## Skip Counters

### Suite

| Suite | Count | Share of skipped roots |
|---|---:|---:|
| benchmark-v1-starter-matrix-robust-v1 | 340 | 100.000% |

### Phase

| Phase | Count | Share of skipped roots |
|---|---:|---:|
| playing | 312 | 91.765% |
| round_end | 28 | 8.235% |

### Round

| Round | Count | Share of skipped roots |
|---|---:|---:|
| 1 | 222 | 65.294% |
| 2 | 96 | 28.235% |
| 3 | 22 | 6.471% |

### Matchup

| Matchup | Count | Share of skipped roots |
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

### Policy

| Policy | Count | Share of skipped roots |
|---|---:|---:|
| headless-round-end-auto-resolver | 28 | 8.235% |
| legal-heuristic-v0 | 246 | 72.353% |
| legal-heuristic-v1 | 66 | 19.412% |

### Faction

| Faction | Count | Share of skipped roots |
|---|---:|---:|
| monsters | 26 | 7.647% |
| nilfgaard | 102 | 30.000% |
| northern_realms | 136 | 40.000% |
| scoiatael | 37 | 10.882% |
| skellige | 39 | 11.471% |

### Deck Preset

| Deck preset | Count | Share of skipped roots |
|---|---:|---:|
| official-monsters-starter | 26 | 7.647% |
| official-nilfgaard-starter | 102 | 30.000% |
| official-northern-realms-starter | 136 | 40.000% |
| official-scoiatael-starter | 37 | 10.882% |
| official-skellige-starter | 39 | 11.471% |

### Provenance Label

| Provenance label | Count | Share of skipped roots |
|---|---:|---:|
| mixed_public_zones | 229 | 67.353% |
| round_end_public_zone | 28 | 8.235% |
| single_zone_board | 54 | 15.882% |
| single_zone_discard | 29 | 8.529% |

### Invalid Reason

| Invalid reason | Count | Share of skipped roots |
|---|---:|---:|
| insufficient_prior_remaining | 340 | 100.000% |

### Skip Reason

| Skip reason | Count | Share of skipped roots |
|---|---:|---:|
| sampler_invalid_public_zone_count_deficit | 340 | 100.000% |

## Future Probe Contract

- A future determinized probe may read only eligible-roots.jsonl as the root list.
- A future determinized probe must also read skipped-roots.jsonl and include skip counters in every result.
- A future determinized probe must not report result tables without skipped-root count and percentage.
- Skipped roots must not be scored as wins, losses, draws, policy failures, engine failures, sampled failures, or no-op results.
- A future determinized probe must fail fast if skipped-roots.jsonl is missing for a suite with skipped roots.
- A future determinized probe must fail fast if eligible and skipped counts do not sum to the cFp61 materialization root count.

## Hidden-Info Safety

cFp68 determinized-probe contract artifacts contain only public benchmark root metadata, scalar counts, enum-like eligibility/skip classifications, source artifact hashes, and aggregate counters. They exclude private card identities, sampled private payloads, engine logs, terminal payloads, action references, and debug payloads.

## Non-Search Warning

cFp68 is benchmark/evaluation contract infrastructure only. It does not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, sampler behavior changes, engine rule changes, legal move changes, or product difficulty changes.

## Recommendation For cFp69

cFp69 should implement the first benchmark-only determinized-pimc-probe-v0 sanity probe over cFp68 eligible roots only, with shallow/no-op or one-ply public-action scaffolding before any strength claims. It must consume cFp68 skip artifacts and report skipped-root counts and percentages beside every probe result.
