# Search Consumer Action Features v0

## Run

- suite id: benchmark-v1-starter-matrix-v1
- feature run id: benchmark-v1-starter-matrix-v1:search-consumer-action-features-v0:cFp76
- source benchmark suite id: benchmark-v1-starter-matrix-v1
- consumer readiness status: action_feature_source_gap

## Source Consistency

| Check | Value |
|---|---:|
| status | ready |
| cFp68 contract status | probe_ready |
| cFp69 probe readiness status | probe_ready |
| cFp70 probe readiness status | probe_ready |
| cFp71 probe readiness status | probe_ready |
| cFp72 probe readiness status | probe_ready |
| cFp74 scaffold readiness status | ready_with_over_budget_skips |
| cFp68 eligible root count | 3979 |
| cFp69 probe root count | 3979 |
| cFp70 availability root count | 3979 |
| cFp71 outcome root count | 3979 |
| cFp72 branching root count | 3979 |
| cFp74 in-cap root count | 3593 |
| cFp74 over-budget root count | 386 |
| cFp68 vs cFp69 eligible root count delta | 0 |
| cFp68 vs cFp70 eligible root count delta | 0 |
| cFp68 vs cFp71 eligible root count delta | 0 |
| cFp68 vs cFp72 eligible root count delta | 0 |
| cFp74 in-cap + over-budget vs cFp72 branching delta | 0 |
| cFp68 skipped root count | 63 |
| cFp69 skipped root count | 63 |
| cFp70 skipped root count | 63 |
| cFp71 skipped root count | 63 |
| cFp72 skipped root count | 63 |
| cFp74 inherited skipped root count | 63 |
| cFp68 vs cFp69 skipped root count delta | 0 |
| cFp68 vs cFp70 skipped root count delta | 0 |
| cFp68 vs cFp71 skipped root count delta | 0 |
| cFp68 vs cFp72 skipped root count delta | 0 |
| cFp68 vs cFp74 skipped root count delta | 0 |
| duplicate cFp68 eligible root keys | 0 |
| duplicate cFp69 probe root keys | 0 |
| duplicate cFp70 availability root keys | 0 |
| duplicate cFp71 outcome root keys | 0 |
| duplicate cFp72 branching root keys | 0 |
| duplicate cFp73 casebook root keys | 0 |
| duplicate cFp74 second-ply root keys | 0 |
| duplicate cFp74 over-budget root keys | 0 |
| duplicate cFp74 skipped root keys | 0 |
| cFp69 roots missing cFp68 eligible root | 0 |
| cFp70 roots missing cFp68 eligible root | 0 |
| cFp71 roots missing cFp68 eligible root | 0 |
| cFp72 roots missing cFp68 eligible root | 0 |
| cFp73 casebook roots missing cFp72 branching root | 0 |
| cFp74 second-ply roots missing cFp72 branching root | 0 |
| cFp74 over-budget roots missing cFp72 branching root | 0 |
| cFp70 availability disagreement total | 0 |
| cFp71 failed/deferred pair total | 0 |
| cFp72 failed/deferred branching pair total | 0 |
| cFp74 failed/deferred second-ply pair count | 0 |
| cFp74 in-cap roots not observed | 0 |
| source artifact reference count | 36 |
| source artifact empty hash count | 0 |

## Row Counts

| Row kind | Count |
|---|---:|
| root feature rows | 3979 |
| action feature rows | 0 |
| action feature gap rows | 5 |
| skipped root rows | 63 |

## Action Feature Rows

- consumer readiness status: `action_feature_source_gap`
- action-features.jsonl is empty: committed cFp69-cFp74 artifacts expose only
  aggregate per-root count maps (`publicActionKindCounts`, `targetKindCounts`,
  `targetSideCounts`, transition counts, budget aggregates), not durable
  per-public-action identities suitable for a `publicActionRef`.
- cFp76 does not fabricate action references. Instead it records one
  `action-feature-gaps.jsonl` row per affected source phase.

## Action Feature Gap Rows

| Source phase | Gap scope | Missing field category | Affected root count | Affected action feature count estimate |
|---|---|---|---:|---:|
| cFp69 | suite | durable_public_action_identity | 3979 | 18820 |
| cFp70 | suite | durable_public_action_identity | 3979 | n/a |
| cFp71 | suite | durable_public_action_identity | 3979 | n/a |
| cFp72 | suite | durable_public_action_identity | 3979 | n/a |
| cFp74 | suite | durable_public_action_identity | 3979 | n/a |

Recommended next step: cFp77 should add a narrow public-action-identity artifact derived from cFp69/cFp70 sources, without new command execution or product AI wiring.

## Count Summaries

### By Phase

| Phase | Count |
|---|---:|
| mulligan | 348 |
| playing | 3300 |
| round_end | 331 |

### By Round

| Round | Count |
|---|---:|
| 1 | 2645 |
| 2 | 935 |
| 3 | 399 |

### By Policy

| Policy | Count |
|---|---:|
| headless-round-end-auto-resolver | 331 |
| legal-heuristic-v0 | 1843 |
| legal-heuristic-v1 | 1805 |

### By Faction

| Faction | Count |
|---|---:|
| monsters | 695 |
| nilfgaard | 907 |
| northern_realms | 856 |
| scoiatael | 802 |
| skellige | 719 |

### By Deck Preset

| Deck preset | Count |
|---|---:|
| official-monsters-starter | 695 |
| official-nilfgaard-starter | 907 |
| official-northern-realms-starter | 856 |
| official-scoiatael-starter | 802 |
| official-skellige-starter | 719 |

### By Matchup

| Matchup | Count |
|---|---:|
| starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1 | 182 |
| starter-monsters-heuristic-v0-vs-skellige-heuristic-v1 | 174 |
| starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0 | 177 |
| starter-monsters-heuristic-v1-vs-skellige-heuristic-v0 | 171 |
| starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1 | 181 |
| starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 203 |
| starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 204 |
| starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 214 |
| starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0 | 214 |
| starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 193 |
| starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1 | 199 |
| starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 252 |
| starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 237 |
| starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1 | 201 |
| starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 188 |
| starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0 | 223 |
| starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 200 |
| starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 186 |
| starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1 | 195 |
| starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0 | 185 |

### cFp74 Cap Status Counts

| Cap status | Count |
|---|---:|
| in_cap | 3593 |
| over_budget | 386 |

### cFp73 Primary Casebook Label Counts

| Label | Count |
|---|---:|
| large_budget_root | 455 |
| large_collision_bucket | 15 |
| not_in_casebook | 2688 |
| round_end_context | 705 |
| terminal_context | 116 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| root-features.jsonl | 9759260 | below 90 MB hard stop |
| action-features.jsonl | 0 | below 50 MB robust target, below 90 MB hard stop |
| action-feature-gaps.jsonl | 2728 | below 90 MB hard stop |
| skipped-roots.jsonl | 104265 | below 90 MB hard stop |

## Hidden-Info Safety

- scan status: clean
- hazards detected: none

All rows in root-features.jsonl, action-features.jsonl, action-feature-gaps.jsonl, and skipped-roots.jsonl are scalar/count-map derivations of committed cFp68-cFp74 artifacts. No card identity maps, runtime terminal states, command/event logs, hand/deck payloads, decision traces, raw move identifiers, or card/leader names appear in machine-readable rows.

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
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/manifest.json | 0226d3f1516e06eeba436cb63f16b6bbc5fcfad2d2e2a7139b341936d885dc6e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/summary.json | 9e845a25c05dc5727caa53548af06bb229480b4eabb51f2d3782d08be117211d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl | de9119ffed9c85eca405d9c026380026f02553258c5b03fcb181e7618bb47ad8 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl | 1cc8a0488383ff103ac96e02823c017ce2bcc614e4a935531cd2fc9bc206f1cb |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/report.md | 44d72ad3606a36778bdaf3e772eea84ebb00b7d21d175592cc860730996c891b |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/manifest.json | 61025c65207cdf11ba04148f80bb42e9a4e952007c4b778f5e0797ae95b59e93 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json | b86ddada1a32b29a7ed0d869a0e9ecf10d90a22714429301e1eb4bdac5cd5493 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl | e8ac6be8baa9df749f77684eed929268a79bf0b7bb9758b81ac1ed16c9323e6d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/skipped-roots.jsonl | d3cd88f01a80ef4c9b1f26baae8f71dc3049878538b43dd499dfad6c5bc773fe |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/report.md | d36dbcd99eca9c60d872b5ef7801075cb52b9a1bd0a501481399936e9d7cbf95 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/manifest.json | f3dc87c3f54bb49ca4b813edc8ce4397ab85270d5e264e62803d648771480038 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json | a698f09752bca8f29150771e2f4126edee4ed5f505c50e59f458cfdc05f03d59 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/branching-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/branching-roots.jsonl | f8d8ba394d1167d4001934fbb0b06fe4dfaa80fe418e6833da6cd4d480255e9e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/skipped-roots.jsonl | 9310f67d43c2e367e2eb1e3aadba678b380c39b74f7bbd1941af30133aaddfc0 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/report.md | c8dd3a4f0f42bf8de1c8ed676fb75703c4e427db94474bfe3c45841852bf8b92 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/manifest.json | c33dc01ecd8219c679bd0efbf296ff7e955d367ff6813d564940d33165f713e3 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/summary.json | d641b62fde5bba375cf88621b860094fda114903ad94f55823983622a6b2550f |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/casebook-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/casebook-roots.jsonl | 74bfcb069b3aef3d5865600e943530ce019755f01a3997a3bc0dec7095f75c61 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/skipped-roots.jsonl | 1cb3c499d13b16f51217f77116cb3f75817142124c53e889878f94746b22b37e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/report.md | 69d9dfd5130d47ab5e969c9b1fb8750e917a344621f3fc72ec8430e5b6a90d9d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/manifest.json | 9ded7d79dcfd02fefd4584605086071143d7c9cdea2c3e8dfe03b6af43107282 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/summary.json | 7473bc7a6fd2c7f985ef9380022bddd73a0e232758e0e1254e37f37168f67c15 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/second-ply-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/second-ply-roots.jsonl | c55455da2a0f4dd1580b836968d6f4b48fb375d754a70a39f332f93b8aa96aa6 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/over-budget-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/over-budget-roots.jsonl | 92bf62682de4b207f5958220398d60376ffdb71b63b8578ce91d6c4823b61983 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/skipped-roots.jsonl | f7ba21101cccdb0930d2a578c75d7136994ca0a6b792536a2c7c14e3d06ec47c |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/report.md | d8801b67e034c1e3af11a6b7817530a2cc777e9a20ac1d732e32eeb936f5f0c1 |

## Non-Claims

- cFp76 does not choose actions or recommend best actions.
- cFp76 does not rank actions or compute action ordering.
- cFp76 does not estimate action values or expected values.
- cFp76 does not estimate win probability or reward targets.
- cFp76 does not compute payoff tables or principal variations.
- cFp76 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.
- cFp76 does not select moves for product AI.
- cFp76 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.
- cFp76 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.
- cFp76 does not add AI Lab runner buttons or execute benchmarks from the browser.
- cFp76 does not add difficulty tiers, export training data, or add Python tooling.

## Recommendation

cFp77 should add a narrow public-action-identity artifact derived from cFp69/cFp70 sources, without new command execution or product AI wiring.
