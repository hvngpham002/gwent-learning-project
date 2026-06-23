# Public Action Identities Compact v0

## Run

- suite id: benchmark-v1-starter-matrix-v1
- compact run id: benchmark-v1-starter-matrix-v1:public-action-identities-compact-v0:cFp78
- phase id: cFp78
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- source cFp77 run id: benchmark-v1-starter-matrix-v1:public-action-identities-v0:cFp77
- compact readiness status: compact_ready

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp77 identity readiness status | identity_ready |
| cFp77 source consistency status | ready |
| cFp77 action identity row count (summary) | 18820 |
| cFp77 root summary row count (summary) | 3979 |
| cFp77 skipped root row count (summary) | 63 |
| cFp77 action identity row count vs actual delta | 0 |
| cFp77 root summary row count vs actual delta | 0 |
| cFp77 skipped root row count vs actual delta | 0 |
| compact action row count | 18820 |
| compact root-index row count | 3979 |
| compact skipped-root row count | 63 |
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
| compact action rows | 18820 |
| compact root-index rows | 3979 |
| compact skipped-root rows | 63 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| action-identities-compact.jsonl | 5727796 | below 50 MB robust target, below 90 MB hard stop |
| root-index.jsonl | 2876496 | below 90 MB hard stop |
| skipped-roots.jsonl | 104328 | below 90 MB hard stop |

## Bytes Saved Versus cFp77

| File | Bytes saved | % reduction |
|---|---:|---:|
| action-identities-compact.jsonl vs action-identities.jsonl | 976672 | 14.57% |
| root-index.jsonl vs root-summaries.jsonl | 2071591 | n/a |
| skipped-roots.jsonl vs cFp77 skipped-roots.jsonl | -945 | n/a |

## Count Summaries

### Public Action Kind

| Kind | Count |
|---|---:|
| choose_mulligan | 300 |
| choose_prompt_option | 290 |
| pass | 3162 |
| play_card | 13249 |
| resolve_round_end | 331 |
| use_leader | 1488 |

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

### By Source Class

| Source class | Count |
|---|---:|
| hero | 1124 |
| leader | 1488 |
| none | 3793 |
| prompt | 290 |
| special | 7177 |
| unit | 4948 |

### By Target Token

| Target token | Count |
|---|---:|
| board_row|opponent|close | 206 |
| board_row|opponent|siege | 163 |
| board_row|own|close | 2949 |
| board_row|own|ranged | 2225 |
| board_row|own|siege | 1039 |
| card|opponent | 23 |
| card|own|close | 817 |
| card|own|ranged | 427 |
| card|own|siege | 291 |
| deck_card_source|own | 512 |
| none | 6084 |
| row_horn|own|close | 832 |
| row_horn|own|ranged | 880 |
| row_horn|own|siege | 880 |
| weather|public | 1492 |

### By Move-Count Bucket

| Move-count bucket | Count |
|---|---:|
| large_collision | 1119 |
| single | 13657 |
| small_collision | 4044 |

## Hidden-Info Safety

- scan status: clean
- hazards detected: none

All rows in action-identities-compact.jsonl, root-index.jsonl, and skipped-roots.jsonl are projected from committed cFp77 public-action identity artifacts. Compact rows drop per-row repetitions of actionPhase/actionRound/collisionCountWithinBucket and compact targetKind/ targetSide/targetRow into a safe enum-like token. No raw move IDs, card instance IDs, card source IDs, source IDs, card/leader names, deck order, sampled hand/deck contents, final match state, command/event logs, decision traces, action values, or rollout results appear in machine-readable rows.

## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/manifest.json | 0233494eaaae40a696ea316944594fbfc9170ed6c1f9eb61ab8467b60e290934 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/summary.json | 3045565dac0d7bbf8a867426668a5b55b6c648f4e8f17a2d71c4d58b08303dd3 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/action-identities.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/action-identities.jsonl | 0ce2354d971a821d1a810deae798c994c96db4374963420ed5d1bb4186a79962 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/root-summaries.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/root-summaries.jsonl | af8611cc348e61383254d67fba671811cb917417f8f1bdda7688a6a20867a52f |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/skipped-roots.jsonl | 6d2e63db3b821dc73ffffc93047bc5b24f92cdf926b23568304d98c8a6e0512a |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/public-action-identities-v0/cFp77/report.md | 99dc2eb1cadef2378d70374075d05fc524759559e4a18ec87ce46df3cf5a4907 |

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
