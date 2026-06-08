# Determinized Probe Contract

## Run

- suite id: benchmark-v1-starter-matrix-v1
- contract run id: benchmark-v1-starter-matrix-v1:determinized-probe-contract:cFp68
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- contract status: probe_ready
- total cFp61 roots: 4042
- eligible valid roots: 3979
- skipped invalid roots: 63
- skipped-root percentage: 1.559%
- cFp67 invalid-root records: 63
- matches: 120

## Source Artifact Inputs

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-materialization/cFp61/manifest.json | a618bff5c02cbd47aa63009684569dedc546b004f9bd0348352876ff70b1b506 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-materialization/cFp61/summary.json | 9f1b5d609cdaa7df7735855e37455ad245a823062a2659497eae8bb18939f7ee |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-materialization/cFp61/roots.jsonl | b6247d3b60e884bbc87a2ca1afa0209fa201359da2391785e1685f9214ae4ed8 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-materialization/cFp61/report.md | 2ab5e6d847e1e16a5fd10395c93f00cfdbe8508c4857c2a6cfb5750e93b83f08 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/manifest.json | aeabd364fed6009615fdef62b306e61d62626832ed3b83c5f74dba02bed7fe16 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/summary.json | 8e9b1540209af6471e30fda7b290a7d415ac7298250ea3ee9c19d2197608d73d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/invalid-roots.jsonl | f0f582ae6f80c403fab1c70aeb34d82f6f6635d03ccf7fed3c834fe72d3c2538 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/report.md | 5196fb37901112a4f91f87b95026656d47597f7f4eb0684c808bf79c69d82494 |

## Source Consistency

| Check | Count |
|---|---:|
| materialization roots read | 4042 |
| materialization summary roots | 4042 |
| cFp67 skip records read | 63 |
| cFp67 summary invalid roots | 63 |
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
| records emitted | 4042 |
| eligible records emitted | 3979 |
| skipped records emitted | 63 |
| unaccounted cFp61 roots | 0 |

## Determinization Budget

| Metric | Count |
|---|---:|
| eligible roots | 3979 |
| total requested samples across eligible roots | 31832 |
| total valid samples across eligible roots | 31832 |

### Requested Samples Per Eligible Root

| Requested samples | Eligible roots |
|---|---:|
| 8 | 3979 |

## Skip Counters

### Suite

| Suite | Count | Share of skipped roots |
|---|---:|---:|
| benchmark-v1-starter-matrix-v1 | 63 | 100.000% |

### Phase

| Phase | Count | Share of skipped roots |
|---|---:|---:|
| playing | 57 | 90.476% |
| round_end | 6 | 9.524% |

### Round

| Round | Count | Share of skipped roots |
|---|---:|---:|
| 1 | 28 | 44.444% |
| 2 | 28 | 44.444% |
| 3 | 7 | 11.111% |

### Matchup

| Matchup | Count | Share of skipped roots |
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

### Policy

| Policy | Count | Share of skipped roots |
|---|---:|---:|
| headless-round-end-auto-resolver | 6 | 9.524% |
| legal-heuristic-v0 | 47 | 74.603% |
| legal-heuristic-v1 | 10 | 15.873% |

### Faction

| Faction | Count | Share of skipped roots |
|---|---:|---:|
| monsters | 4 | 6.349% |
| nilfgaard | 11 | 17.460% |
| northern_realms | 39 | 61.905% |
| scoiatael | 6 | 9.524% |
| skellige | 3 | 4.762% |

### Deck Preset

| Deck preset | Count | Share of skipped roots |
|---|---:|---:|
| official-monsters-starter | 4 | 6.349% |
| official-nilfgaard-starter | 11 | 17.460% |
| official-northern-realms-starter | 39 | 61.905% |
| official-scoiatael-starter | 6 | 9.524% |
| official-skellige-starter | 3 | 4.762% |

### Provenance Label

| Provenance label | Count | Share of skipped roots |
|---|---:|---:|
| mixed_public_zones | 42 | 66.667% |
| round_end_public_zone | 6 | 9.524% |
| single_zone_board | 6 | 9.524% |
| single_zone_discard | 9 | 14.286% |

### Invalid Reason

| Invalid reason | Count | Share of skipped roots |
|---|---:|---:|
| insufficient_prior_remaining | 63 | 100.000% |

### Skip Reason

| Skip reason | Count | Share of skipped roots |
|---|---:|---:|
| sampler_invalid_public_zone_count_deficit | 63 | 100.000% |

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
