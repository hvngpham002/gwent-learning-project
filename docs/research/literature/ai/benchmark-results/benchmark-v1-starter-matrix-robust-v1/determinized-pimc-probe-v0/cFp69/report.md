# Determinized PIMC Probe v0 Sanity

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- probe run id: benchmark-v1-starter-matrix-robust-v1:determinized-pimc-probe-v0:cFp69
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- probe variant: determinized-pimc-probe-v0
- probe mode: one_ply_public_action_scaffold
- probe readiness status: probe_ready
- source cFp68 contract run id: benchmark-v1-starter-matrix-robust-v1:determinized-probe-contract:cFp68
- total cFp68 roots: 32487
- eligible valid roots: 32147
- probe roots: 32147
- skipped invalid roots: 340
- skipped-root percentage: 1.047%
- matches: 1000

## Source Artifact Inputs

| Input | SHA-256 |
|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/manifest.json | 735a87e2dea500878eaec01823dae886f14e11448d7c83cd87ea7490da7f7cfd |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/summary.json | 2ade0597b1f3f4edf11047846d31cb2d281df50b21e9c374010fda71530d03db |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/eligible-roots.jsonl | 7396adbf22084b0ab0515fdc6fb239bcd2e32c72404bfc5d800eebff62f5d97f |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/skipped-roots.jsonl | 91353f4a302cf755f7c2bb3196df5bf5643c31fa590287074531dccf5af0dd50 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/report.md | a70d26e484c303cfa5dfc9f12d2ad16e71c8f8bc31acea008e4132cd0795f9d4 |

## Source Consistency

| Check | Count |
|---|---:|
| cFp68 contract not probe-ready | 0 |
| cFp68 total roots | 32487 |
| cFp68 eligible roots read | 32147 |
| cFp68 skipped roots read | 340 |
| benchmark observed roots read | 32487 |
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
| completed | 32147 |
| contract_mismatch | 0 |
| eligible_root_not_observed | 0 |
| public_action_abstraction_failed | 0 |

## Sample Budget

| Metric | Count |
|---|---:|
| probe roots | 32147 |
| total requested samples | 257176 |
| total consumed samples | 257176 |
| total valid samples | 257176 |
| total invalid samples | 0 |

### Requested Samples Per Probe Root

| Requested samples | Probe roots |
|---|---:|
| 8 | 32147 |

## Public Action Scaffold

- probe mode: one_ply_public_action_scaffold
- legal move count stats: count 32147; min 1; max 32; avg 7.964; p50 9; p90 13; p95 15
- public action count stats: count 32147; min 1; max 14; avg 4.786; p50 5; p90 9; p95 10
- public action collision count stats: count 32147; min 0; max 25; avg 3.178; p50 2; p90 9; p95 10
- largest public action bucket size stats: count 32147; min 1; max 26; avg 3.397; p50 3; p90 7; p95 11

### Aggregate Public Action Kinds

| Kind | Count |
|---|---:|
| choose_mulligan | 28028 |
| choose_prompt_option | 5905 |
| pass | 25571 |
| play_card | 180864 |
| resolve_round_end | 2645 |
| use_leader | 13008 |

### Aggregate Target Kinds

| Kind | Count |
|---|---:|
| board_row | 98991 |
| card | 33609 |
| card_instance_set | 0 |
| deck_card_instance | 0 |
| deck_card_source | 5409 |
| none | 75928 |
| row_horn | 27883 |
| weather | 14201 |

### Aggregate Target Sides

| Side | Count |
|---|---:|
| none | 75928 |
| opponent | 4812 |
| own | 161080 |
| public | 14201 |

### Root Counts By Public Action Kind Presence

| Kind | Roots |
|---|---:|
| choose_mulligan | 2548 |
| choose_prompt_option | 1383 |
| pass | 25571 |
| play_card | 23423 |
| resolve_round_end | 2645 |
| use_leader | 11335 |

### Max Public Action Root Reference

```json
{
  "decisionIndex": 3,
  "deckPresetId": "official-skellige-starter",
  "faction": "skellige",
  "matchupId": "starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1",
  "mirrorIndex": 1,
  "phase": "playing",
  "policyId": "legal-heuristic-v1",
  "publicActionCount": 14,
  "rootPublicFingerprint": "55bebe28289dc5ce61bd2d15940fc693e03c67328dc79cd4611e235db651aae7",
  "round": 1,
  "seatId": "seat_a",
  "seed": "starter-matrix-robust-008",
  "step": 4,
  "suiteId": "benchmark-v1-starter-matrix-robust-v1"
}
```


### Max Collision Root Reference

```json
{
  "decisionIndex": 15,
  "deckPresetId": "official-monsters-starter",
  "faction": "monsters",
  "matchupId": "starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1",
  "mirrorIndex": 0,
  "phase": "playing",
  "policyId": "legal-heuristic-v0",
  "publicActionCollisionCount": 25,
  "rootPublicFingerprint": "324fe169834f4ee351cdc19afa709f32a6a9f3c68e23e46b41279a4003bcfc65",
  "round": 1,
  "seatId": "seat_a",
  "seed": "starter-matrix-robust-002",
  "step": 16,
  "suiteId": "benchmark-v1-starter-matrix-robust-v1"
}
```


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
