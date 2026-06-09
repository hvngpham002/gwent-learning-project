# Determinized PIMC Probe v0 Sanity

## Run

- suite id: benchmark-v1-starter-matrix-v1
- probe run id: benchmark-v1-starter-matrix-v1:determinized-pimc-probe-v0:cFp69
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- probe variant: determinized-pimc-probe-v0
- probe mode: one_ply_public_action_scaffold
- probe readiness status: probe_ready
- source cFp68 contract run id: benchmark-v1-starter-matrix-v1:determinized-probe-contract:cFp68
- total cFp68 roots: 4042
- eligible valid roots: 3979
- probe roots: 3979
- skipped invalid roots: 63
- skipped-root percentage: 1.559%
- matches: 120

## Source Artifact Inputs

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/manifest.json | 4555bb2d7a4357e0eff3db189c36a9837eb3ae569a55c0ad6cd254457272d558 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/summary.json | 3b52cb515229480cb22725492c925f1e2ccc8099bd5c0b10de851a802201a029 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/eligible-roots.jsonl | 43c0dffc9742df50c18418eaa93e83effd429b37b53b36d56b92adb76e2d4d87 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/skipped-roots.jsonl | b2b8dda27d7f61437aee50f4d0d3bae16f4b2c6595352e638c041edfbd2e2406 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/report.md | 7baabcfe6b440e0a7f14a21eb72666e95abb2bc65abeb4be9b5140d57a3ddd0b |

## Source Consistency

| Check | Count |
|---|---:|
| cFp68 contract not probe-ready | 0 |
| cFp68 total roots | 4042 |
| cFp68 eligible roots read | 3979 |
| cFp68 skipped roots read | 63 |
| benchmark observed roots read | 4042 |
| eligible roots not observed | 0 |
| observed roots not in cFp68 contract | 0 |
| skipped roots incorrectly probed | 0 |
| duplicate observed root keys | 0 |
| duplicate cFp68 eligible root keys | 0 |
| duplicate cFp68 skipped root keys | 0 |
| eligible plus skipped delta from cFp68 total | 0 |
| cFp68 eligible sample-count mismatch roots | 0 |
| public action abstraction failed roots | 0 |

## Probe Status Counts

| Status | Count |
|---|---:|
| completed | 3979 |
| contract_mismatch | 0 |
| eligible_root_not_observed | 0 |
| public_action_abstraction_failed | 0 |

## Sample Budget

| Metric | Count |
|---|---:|
| probe roots | 3979 |
| total requested samples | 31832 |
| total consumed samples | 31832 |
| total valid samples | 31832 |
| total invalid samples | 0 |

### Requested Samples Per Probe Root

| Requested samples | Probe roots |
|---|---:|
| 8 | 3979 |

## Public Action Scaffold

- probe mode: one_ply_public_action_scaffold
- legal move count stats: count 3979; min 1; max 32; avg 7.627; p50 8; p90 13; p95 15
- public action count stats: count 3979; min 1; max 13; avg 4.73; p50 5; p90 9; p95 10
- public action collision count stats: count 3979; min 0; max 25; avg 2.897; p50 2; p90 8; p95 10
- largest public action bucket size stats: count 3979; min 1; max 26; avg 3.191; p50 2; p90 6; p95 11

### Aggregate Public Action Kinds

| Kind | Count |
|---|---:|
| choose_mulligan | 3300 |
| choose_prompt_option | 840 |
| pass | 3162 |
| play_card | 21058 |
| resolve_round_end | 331 |
| use_leader | 1655 |

### Aggregate Target Kinds

| Kind | Count |
|---|---:|
| board_row | 11776 |
| card | 3654 |
| card_instance_set | 0 |
| deck_card_instance | 0 |
| deck_card_source | 679 |
| none | 9538 |
| row_horn | 2856 |
| weather | 1843 |

### Aggregate Target Sides

| Side | Count |
|---|---:|
| none | 9538 |
| opponent | 660 |
| own | 18305 |
| public | 1843 |

### Root Counts By Public Action Kind Presence

| Kind | Roots |
|---|---:|
| choose_mulligan | 300 |
| choose_prompt_option | 186 |
| pass | 3162 |
| play_card | 2888 |
| resolve_round_end | 331 |
| use_leader | 1488 |

### Max Public Action Root Reference

```json
{
  "decisionIndex": 6,
  "deckPresetId": "official-skellige-starter",
  "faction": "skellige",
  "matchupId": "starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0",
  "mirrorIndex": 1,
  "phase": "playing",
  "policyId": "legal-heuristic-v0",
  "publicActionCount": 13,
  "rootPublicFingerprint": "a573b5d8f1b04bf091906ed363002918e5603d5e438e45a5fc7dc055d4d06d56",
  "round": 1,
  "seatId": "seat_a",
  "seed": "starter-matrix-001",
  "step": 7,
  "suiteId": "benchmark-v1-starter-matrix-v1"
}
```


### Max Collision Root Reference

```json
{
  "decisionIndex": 12,
  "deckPresetId": "official-monsters-starter",
  "faction": "monsters",
  "matchupId": "starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0",
  "mirrorIndex": 1,
  "phase": "playing",
  "policyId": "legal-heuristic-v0",
  "publicActionCollisionCount": 25,
  "rootPublicFingerprint": "5adae438ccc3484c65a9d3f8bb79b630d91efd67d2fd021223745eda642d344c",
  "round": 1,
  "seatId": "seat_a",
  "seed": "starter-matrix-002",
  "step": 13,
  "suiteId": "benchmark-v1-starter-matrix-v1"
}
```


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

## Hidden-Info Safety

cFp69 determinized-pimc-probe-v0 artifacts contain only public benchmark root metadata, scalar sampler budget counts inherited from cFp68, public legal-action bucket counts, skipped-root accounting, source artifact hashes, and aggregate counters. They exclude private card identities, raw move payloads, sampled hidden worlds, engine logs, debug traces, action ranking, value estimates, rollout results, and product AI wiring.

## Explicit Non-Claims

- No rollout was run.
- No action value was computed.
- No action ranking was produced.
- No move was selected by search.
- No strength claim is made.
- No product AI behavior changed.
- Skipped roots were excluded from probe work and reported separately.

## Recommendation For cFp70

cFp70 should add the first one-ply sampled-world action-availability probe over the same cFp68 eligible roots, still without rollout/value/strength claims. It should measure whether public action buckets remain available across sampled worlds and report action-availability disagreement/risk, with cFp68/cFp69 skip accounting attached.
