# Public Action Identities Compact v0

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- compact run id: benchmark-v1-starter-matrix-robust-v1:public-action-identities-compact-v0:cFp78
- phase id: cFp78
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
- source cFp77 run id: benchmark-v1-starter-matrix-robust-v1:public-action-identities-v0:cFp77
- compact readiness status: compact_ready

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp77 identity readiness status | identity_ready |
| cFp77 source consistency status | ready |
| cFp77 action identity row count (summary) | 153842 |
| cFp77 root summary row count (summary) | 32147 |
| cFp77 skipped root row count (summary) | 340 |
| cFp77 action identity row count vs actual delta | 0 |
| cFp77 root summary row count vs actual delta | 0 |
| cFp77 skipped root row count vs actual delta | 0 |
| compact action row count | 153842 |
| compact root-index row count | 32147 |
| compact skipped-root row count | 340 |
| compact vs cFp77 action row count delta | 0 |
| compact vs cFp77 root-index row count delta | 0 |
| compact vs cFp77 skipped-root row count delta | 0 |
| compact action rows with missing rootRef | 0 |
| compact root-index rows with missing cFp77 ref | 0 |
| duplicate compact action keys | 0 |
| cFp77 action keys missing from compact | 0 |
| compact action key-hash mismatch count | 0 |
| compact action kind mismatch count | 0 |
| compact action ordinal mismatch count | 0 |
| compact action move-count mismatch count | 0 |
| source artifact reference count | 6 |
| source artifact empty hash count | 0 |

## Row Counts

| Row kind | Count |
|---|---:|
| compact action rows | 153842 |
| compact root-index rows | 32147 |
| compact skipped-root rows | 340 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| action-identities-compact.jsonl | 46860776 | below 50 MB robust target, below 90 MB hard stop |
| root-index.jsonl | 23918293 | below 90 MB hard stop |
| skipped-roots.jsonl | 571678 | below 90 MB hard stop |

## Bytes Saved Versus cFp77

| File | Bytes saved | % reduction |
|---|---:|---:|
| action-identities-compact.jsonl vs action-identities.jsonl | 8031851 | 14.63% |
| root-index.jsonl vs root-summaries.jsonl | 17012447 | n/a |
| skipped-roots.jsonl vs cFp77 skipped-roots.jsonl | -5100 | n/a |

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

### By Source Class

| Source class | Count |
|---|---:|
| hero | 8424 |
| leader | 11335 |
| none | 30764 |
| prompt | 2048 |
| special | 62166 |
| unit | 39105 |

### By Target Token

| Target token | Count |
|---|---:|
| board_row|opponent|close | 2048 |
| board_row|opponent|siege | 749 |
| board_row|own|close | 24075 |
| board_row|own|ranged | 16800 |
| board_row|own|siege | 9302 |
| card|opponent | 168 |
| card|own|close | 6948 |
| card|own|ranged | 3345 |
| card|own|siege | 2422 |
| deck_card_source|own | 3736 |
| none | 48432 |
| row_horn|own|close | 7577 |
| row_horn|own|ranged | 7940 |
| row_horn|own|siege | 8007 |
| weather|public | 12293 |

### By Move-Count Bucket

| Move-count bucket | Count |
|---|---:|
| large_collision | 11441 |
| single | 110213 |
| small_collision | 32188 |

## Hidden-Info Safety

- scan status: clean
- hazards detected: none

All rows in action-identities-compact.jsonl, root-index.jsonl, and skipped-roots.jsonl are projected from committed cFp77 public-action identity artifacts. Compact rows drop per-row repetitions of actionPhase/actionRound/collisionCountWithinBucket and compact targetKind/ targetSide/targetRow into a safe enum-like token. No raw move IDs, card instance IDs, card source IDs, source IDs, card/leader names, deck order, sampled hand/deck contents, final match state, command/event logs, decision traces, action values, or rollout results appear in machine-readable rows.

## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/manifest.json | d0905c2b23de9f520a197c41bc615c66a69a7cdba25cb24a426905d14e4195c2 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/summary.json | bd457574ef368fc41c7ee061823fea3e6cd2ceb5b33a42c282f095d6a52c584f |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/action-identities.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/action-identities.jsonl | 227fde1e964b6a53ccca0cf862b62da4385a77ed2f223fe7f1e2ead77bd617ad |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/root-summaries.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/root-summaries.jsonl | 69fe5a221055c2e9b684a4535e9b62eb610462885af0388558d713a9c8506b23 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/skipped-roots.jsonl | 77a8d444d1600b5c6fd1963cff527b52c8272f692cb050a51ba956d8d579f415 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/public-action-identities-v0/cFp77/report.md | 04059c0becf798f137b1ff9695ce832778b667bfccd1e815c2ea867971ddc0bd |

## Non-Claims

- cFp78 does not choose actions or recommend best actions.
- cFp78 does not rank actions or compute action ordering.
- cFp78 does not estimate action values or expected values.
- cFp78 does not estimate win probability or reward targets.
- cFp78 does not compute payoff tables or principal variations.
- cFp78 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.
- cFp78 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.
- cFp78 does not select moves for product AI.
- cFp78 does not re-observe benchmark roots or run the benchmark suite.
- cFp78 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.
- cFp78 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.
- cFp78 does not add AI Lab runner buttons or execute benchmarks from the browser.
- cFp78 does not add difficulty tiers, export training data, or add Python tooling.
- cFp78 does not expose raw move IDs, card/source identities, deck order, sampled hands/decks, or hidden payloads.
- cFp78 does not modify cFp77 artifacts.

## cFp79 Recommendation

cFp79 should repair search-consumer-action-features-v0 or add search-consumer-action-features-v1 by joining cFp76 root features to cFp78 compact action identities, producing nonempty action feature rows without action values or ranking.
