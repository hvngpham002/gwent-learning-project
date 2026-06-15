# Search Consumer Action Features v0

## Run

- suite id: benchmark-v1-starter-matrix-robust-v1
- feature run id: benchmark-v1-starter-matrix-robust-v1:search-consumer-action-features-v0:cFp76
- source benchmark suite id: benchmark-v1-starter-matrix-robust-v1
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
| cFp68 eligible root count | 32147 |
| cFp69 probe root count | 32147 |
| cFp70 availability root count | 32147 |
| cFp71 outcome root count | 32147 |
| cFp72 branching root count | 32147 |
| cFp74 in-cap root count | 28915 |
| cFp74 over-budget root count | 3232 |
| cFp68 vs cFp69 eligible root count delta | 0 |
| cFp68 vs cFp70 eligible root count delta | 0 |
| cFp68 vs cFp71 eligible root count delta | 0 |
| cFp68 vs cFp72 eligible root count delta | 0 |
| cFp74 in-cap + over-budget vs cFp72 branching delta | 0 |
| cFp68 skipped root count | 340 |
| cFp69 skipped root count | 340 |
| cFp70 skipped root count | 340 |
| cFp71 skipped root count | 340 |
| cFp72 skipped root count | 340 |
| cFp74 inherited skipped root count | 340 |
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
| cFp68 eligible root count vs actual cFp68 eligible rows delta | 0 |
| cFp68 skipped root count vs actual cFp74 skipped rows delta | 0 |
| cFp69 probe root count vs actual cFp69 probe rows delta | 0 |
| cFp70 availability root count vs actual cFp70 availability rows delta | 0 |
| cFp71 outcome root count vs actual cFp71 outcome rows delta | 0 |
| cFp72 branching root count vs actual cFp72 branching rows delta | 0 |
| cFp74 in-cap root count vs actual cFp74 second-ply rows delta | 0 |
| cFp74 over-budget root count vs actual cFp74 over-budget rows delta | 0 |
| cFp74 inherited skipped root count vs actual cFp74 skipped rows delta | 0 |

## Row Counts

| Row kind | Count |
|---|---:|
| root feature rows | 32147 |
| action feature rows | 0 |
| action feature gap rows | 5 |
| skipped root rows | 340 |

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
| cFp69 | suite | durable_public_action_identity | 32147 | 153842 |
| cFp70 | suite | durable_public_action_identity | 32147 | n/a |
| cFp71 | suite | durable_public_action_identity | 32147 | n/a |
| cFp72 | suite | durable_public_action_identity | 32147 | n/a |
| cFp74 | suite | durable_public_action_identity | 32147 | n/a |

Recommended next step: cFp77 should add a narrow public-action-identity artifact derived from cFp69/cFp70 sources, without new command execution or product AI wiring.

## Count Summaries

### By Phase

| Phase | Count |
|---|---:|
| mulligan | 2948 |
| playing | 26554 |
| round_end | 2645 |

### By Round

| Round | Count |
|---|---:|
| 1 | 22242 |
| 2 | 7043 |
| 3 | 2862 |

### By Policy

| Policy | Count |
|---|---:|
| headless-round-end-auto-resolver | 2645 |
| legal-heuristic-v0 | 15123 |
| legal-heuristic-v1 | 14379 |

### By Faction

| Faction | Count |
|---|---:|
| monsters | 5625 |
| nilfgaard | 7453 |
| northern_realms | 7084 |
| scoiatael | 6396 |
| skellige | 5589 |

### By Deck Preset

| Deck preset | Count |
|---|---:|
| official-monsters-starter | 5625 |
| official-nilfgaard-starter | 7453 |
| official-northern-realms-starter | 7084 |
| official-scoiatael-starter | 6396 |
| official-skellige-starter | 5589 |

### By Matchup

| Matchup | Count |
|---|---:|
| starter-monsters-heuristic-v0-vs-scoiatael-heuristic-v1 | 1469 |
| starter-monsters-heuristic-v0-vs-skellige-heuristic-v1 | 1339 |
| starter-monsters-heuristic-v1-vs-scoiatael-heuristic-v0 | 1483 |
| starter-monsters-heuristic-v1-vs-skellige-heuristic-v0 | 1412 |
| starter-nilfgaard-heuristic-v0-vs-monsters-heuristic-v1 | 1595 |
| starter-nilfgaard-heuristic-v0-vs-scoiatael-heuristic-v1 | 1658 |
| starter-nilfgaard-heuristic-v0-vs-skellige-heuristic-v1 | 1552 |
| starter-nilfgaard-heuristic-v1-vs-monsters-heuristic-v0 | 1671 |
| starter-nilfgaard-heuristic-v1-vs-scoiatael-heuristic-v0 | 1752 |
| starter-nilfgaard-heuristic-v1-vs-skellige-heuristic-v0 | 1678 |
| starter-northern-realms-heuristic-v0-vs-monsters-heuristic-v1 | 1600 |
| starter-northern-realms-heuristic-v0-vs-nilfgaard-heuristic-v1 | 2100 |
| starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1 | 1763 |
| starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1 | 1569 |
| starter-northern-realms-heuristic-v1-vs-monsters-heuristic-v0 | 1549 |
| starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0 | 1808 |
| starter-northern-realms-heuristic-v1-vs-scoiatael-heuristic-v0 | 1671 |
| starter-northern-realms-heuristic-v1-vs-skellige-heuristic-v0 | 1556 |
| starter-scoiatael-heuristic-v0-vs-skellige-heuristic-v1 | 1412 |
| starter-scoiatael-heuristic-v1-vs-skellige-heuristic-v0 | 1510 |

### cFp74 Cap Status Counts

| Cap status | Count |
|---|---:|
| in_cap | 28915 |
| over_budget | 3232 |

### cFp73 Primary Casebook Label Counts

| Label | Count |
|---|---:|
| large_budget_root | 3915 |
| large_collision_bucket | 97 |
| not_in_casebook | 21426 |
| round_end_context | 5720 |
| terminal_context | 989 |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| root-features.jsonl | 79683914 | below 90 MB hard stop |
| action-features.jsonl | 0 | below 50 MB robust target, below 90 MB hard stop |
| action-feature-gaps.jsonl | 2804 | below 90 MB hard stop |
| skipped-roots.jsonl | 571338 | below 90 MB hard stop |

## Hidden-Info Safety

- scan status: clean
- hazards detected: none

All rows in root-features.jsonl, action-features.jsonl, action-feature-gaps.jsonl, and skipped-roots.jsonl are scalar/count-map derivations of committed cFp68-cFp74 artifacts. No card identity maps, runtime terminal states, command/event logs, hand/deck payloads, decision traces, raw move identifiers, or card/leader names appear in machine-readable rows.

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
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/manifest.json | 029a033c3648a233146730ab020c36622d19f48517f2c8c0c1a024acb4343c26 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/summary.json | 4bda20dc523efe895ece1bab4242d985d8f1759878bd0c7a0cb6748f4c7beabc |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl | df1d076896cc951cb5796cff654cdd17502415be459e95e5f511ff4a3c1cbd17 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl | 7561662c2837616d8849757c6ebef64c96a4e75edb300c946b18d04b814d494a |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-action-availability-v0/cFp70/report.md | 1e3dfe908bc03323c6037b2f017a26af2a8da503f4c61095841ac88d363ea309 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/manifest.json | 6b6bbabc4daa57f70f8fba604cdaec0397391bec1ae2b8c98ac32d2eb4dc4f3a |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json | 2fd2ba14c2f69cbaa05734376f7be4f5ea1d97aedb7db661c4002d80132f6a29 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl | f85a2083263b0cc60d983a7fa856fdaed76013e5e1a2a3ba0191db793c950728 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/skipped-roots.jsonl | 34137ead3b5768c3796628e1c0ec2511fcb75d05b27c881931165d465c59da2e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/report.md | b7538b417e6cdbbddafbb738c83729ace54f87b88210c18154c278bbe8e2c163 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/manifest.json | bc6c0fc8518615f21624cb578a4eaf0f4c59648395dadbbcf1899f5e396d06ae |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json | 3f2280c11ab792c9b3bba3a6b79d852e756d8d614c33beeb4b99edbf911dfc9e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/branching-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/branching-roots.jsonl | 4234daf3f6d07105b618caa44f866d8b5991a02f129e51bc60efae88d0aad738 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/skipped-roots.jsonl | 51d87c2f55a719908fab8afab01071c6369b8b03428778ad669233b048cf72bf |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/report.md | 6bf8bab9e4b769cec73b9707294c59a9d70e07ef97e8d1c69e31aacee748589a |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/manifest.json | b18f0326c16fd5fd97d9013482e4b00f3582381c3b7e4caad2cb303e2c9dd67e |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/summary.json | 4e343289e74e65af4b3285dbf3cba62a6fcc3d203d561b0749ac1258aaf2c0a9 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/casebook-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/casebook-roots.jsonl | c47a9bb379176afab76933ac78b7db5b2c49a6085708c6060216f90519c542cf |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/skipped-roots.jsonl | 6bcf4f8f696bc677db20c31a0c6686ccbf8755df769555a7224858c5ba8e2ffd |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/report.md | 9d2865843698537fed110f4c15ba4d8720795f9fee6e174f815148f11f2031c0 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/manifest.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/manifest.json | 1f44486d7884bbfbd75b9998987565e5abc8e1dab22d8c7837603b5d3d70ccf4 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/summary.json | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/summary.json | e12a659a84a817885a39cf5a188c81c78f49762572d92e012cba901867e0844a |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/second-ply-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/second-ply-roots.jsonl | 4b8fe648da683500385fe6074fa1b46af9dec2dd8e7a7f49d5954b6f02853020 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/over-budget-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/over-budget-roots.jsonl | aa16b1aada8de8ff8c5301966dc458ea308298e48b59b557f2ab9f70b629df0d |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/skipped-roots.jsonl | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/skipped-roots.jsonl | bf5501eee598f1215657c22e30695f765ffc05c61a1bfd36986c6beacbfd6151 |
| docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/report.md | docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/report.md | e0c5dcaa647b4c768228e61603f4cb2fcff10afdc2ae0087e13be4c2f691143c |

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
