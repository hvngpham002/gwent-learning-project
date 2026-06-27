# cFp81 - Search Consumer Action Feature Casebook v0 Decision

**Date:** 2026-06-27
**Spec:** `docs/spec/2026-06-27-cFp81-specs.md`
**Branch:** `codex/cFp81-search-consumer-action-feature-casebook-v0`
**Base:** `dev`

---

## Decision

cFp81 implements `search-consumer-action-feature-casebook-v0` as a
benchmark-only, read-only aggregate casebook over committed cFp80 compact
artifacts. It does not modify cFp80, cFp79, cFp78, or cFp76 artifacts.

The casebook emits:

- bounded `casebook-rows.jsonl` rows for public scalar feature-surface slices;
- `slice-summaries.jsonl` aggregate summaries across action, root, and
  cFp70-cFp74 context dimensions;
- `skipped-root-summary.json` with inherited skipped-root context;
- `summary.json`, `manifest.json`, and `report.md`.

cFp81 expands cFp80 dictionary ids only in memory for grouping. It does not
write reconstructed cFp79 action rows, per-action casebook rows, action quality
labels, search values, rollout results, or product policy behavior.

---

## Evidence From cFp81

**Current starter matrix (`benchmark-v1-starter-matrix-v1`):**

- consumer readiness status: `casebook_ready`.
- source consistency status: `ready`.
- cFp80 source rows: 3,979 root rows, 18,820 compact action rows, 63 skipped
  rows.
- inherited skipped-root percent: 1.56%.
- casebook rows: 80.
- slice summaries: 95.
- `casebook-rows.jsonl`: 41,921 bytes.
- `slice-summaries.jsonl`: 40,978 bytes.
- `skipped-root-summary.json`: 2,041 bytes.

**Robust starter matrix (`benchmark-v1-starter-matrix-robust-v1`):**

- consumer readiness status: `casebook_ready`.
- source consistency status: `ready`.
- cFp80 source rows: 32,147 root rows, 153,842 compact action rows, 340 skipped
  rows.
- inherited skipped-root percent: 1.05%.
- casebook rows: 80.
- slice summaries: 95.
- `casebook-rows.jsonl`: 42,703 bytes.
- `slice-summaries.jsonl`: 41,906 bytes.
- `skipped-root-summary.json`: 2,079 bytes.

**Robust readiness-label counts:**

| Label | Count |
|---|---:|
| `consumer_ready` | 10 |
| `consumer_ready_high_branching` | 57 |
| `consumer_ready_high_collision` | 12 |
| `consumer_ready_over_budget_context` | 1 |
| `consumer_ready_skipped_root_context` | 0 |
| `consumer_ready_sparse_slice` | 0 |

**Robust row-kind counts:**

| Row kind | Count |
|---|---:|
| `action_kind_slice` | 6 |
| `source_class_slice` | 6 |
| `target_slice` | 15 |
| `move_count_bucket_slice` | 3 |
| `collision_slice` | 2 |
| `phase_round_slice` | 7 |
| `faction_slice` | 5 |
| `deck_preset_slice` | 5 |
| `matchup_slice` | 20 |
| `branching_risk_slice` | 5 |
| `second_ply_cap_slice` | 2 |
| `combined_readiness_slice` | 4 |

**Robust artifact hashes (both robust runs identical):**

- `manifest.json`:
  `0a4ef021d35a333e1859698179a705b19e98d6fe82dc5d5a3684047f57a0a6a0`
- `summary.json`:
  `5168abea71d57ed61b906248fb313f5ac0a86e0c4421e4ab8aaa630b0e632a53`
- `casebook-rows.jsonl`:
  `1390fcce146a5e96c0f9e03f5b9d4d62cbfafd845409799a688f4121b51d963e`
- `slice-summaries.jsonl`:
  `f00177a4bbf0356c0f5f61745169ab2f4aaf6d34aa79c6dec9c1196360b13c43`
- `skipped-root-summary.json`:
  `1ac5e4838873c2bba6f0b5131ab95fd72ec0c9f8459010ea632fb4478d132f31`
- `report.md`:
  `2c1d2d790bf5115779849005622ba583b1f8543115c9787d8eca3a68d8e71c21`

---

## Source Consistency

cFp81 validates:

- cFp80 `consumerReadinessStatus` is `dictionary_ready`;
- cFp80 source consistency is `ready`;
- cFp80 reconstruction status is `passed`;
- cFp80 reconstruction mismatch count is 0;
- cFp80 summary row counts match loaded root, compact-action, and skipped rows;
- cFp80 dictionary group counts match loaded dictionary value counts;
- every compact action dictionary id resolves;
- every compact action root reference resolves to a loaded cFp80 root row;
- robust cFp80 compact actions are below the 50 MB target;
- all seven consumed cFp80 source artifacts have non-empty SHA-256 references.

---

## Non-Claims

cFp81 `search-consumer-action-feature-casebook-v0` explicitly does NOT:

- choose actions or recommend best actions;
- rank actions or compute action ordering;
- estimate action values or expected values;
- estimate win probability or reward targets;
- compute payoff tables or principal variations;
- run rollout search, PIMC evaluation, or ISMCTS/MCTS;
- execute candidate actions, rebuild sampled states, or materialize hidden
  worlds;
- re-observe benchmark roots;
- modify cFp80, cFp79, cFp78, or cFp76 artifact directories;
- select moves for product AI;
- change `legal-heuristic-v1` or `legal-heuristic-v0` behavior;
- change engine rules, legal moves, sampler behavior, deck/catalog data,
  benchmark suite definitions, or rating artifacts;
- add AI Lab runner buttons or execute benchmarks from the browser;
- add difficulty tiers, export training data, or add Python tooling.

---

## Recommended Next Step

cFp82 should be a decision phase that uses the cFp81 casebook to choose the
next safe benchmark-only consumer step.

Likely options are:

1. a benchmark-only feature-consumer contract for a supervised or heuristic
   probe;
2. a deterministic subset for small search-consumer experiments;
3. a pause and review if the casebook surface is still too broad or sparse.

cFp82 must still avoid rollout, action values, expected values, reward targets,
win probabilities, payoff tables, action ranking, best-action selection, and
product search gameplay.

---

*End of cFp81 decision note.*
