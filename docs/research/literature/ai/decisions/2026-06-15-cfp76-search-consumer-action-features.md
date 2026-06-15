# cFp76 — Search Consumer Action Features Decision

**Date:** 2026-06-15
**Spec:** `docs/spec/2026-06-15-cFp76-specs.md`
**Branch:** `codex/cFp76-search-consumer-action-features-v0`
**Base:** `dev`

---

## Decision

cFp76 implements `search-consumer-action-features-v0` as a benchmark-only,
read-only consumer of the committed cFp68-cFp74 artifacts. It performs the
source consistency checks defined in the cFp75 decision note, emits one
hidden-info-safe root feature row per cFp68 eligible root, carries cFp68
skipped roots into cFp76 skipped rows, and audits whether per-root-public-
action feature rows are derivable from committed sources.

The audit result is `action_feature_source_gap`: the committed cFp69-cFp74
artifacts expose only aggregate per-root count maps
(`publicActionKindCounts`, `targetKindCounts`, `targetSideCounts`,
transition-kind counts, and post-one-ply/second-ply budget aggregates), not
durable per-public-action identities. cFp76 does not fabricate a
`publicActionRef`. Instead it writes an empty `action-features.jsonl` and a
populated `action-feature-gaps.jsonl` with one row per affected source phase
(cFp69, cFp70, cFp71, cFp72, cFp74), and sets
`consumerReadinessStatus: "action_feature_source_gap"` in `manifest.json`
and `summary.json`.

Source consistency is `ready` for both the current and robust starter
matrices. No source consistency check failed, so cFp76 did not need to stop
at `source_consistency_failed`.

---

## Evidence From cFp76

**Current starter matrix (`benchmark-v1-starter-matrix-v1`):**

- source consistency status: `ready`.
- cFp68 eligible root count: 3,979.
- cFp68/cFp69/cFp70/cFp71/cFp72 skipped root count: 63 (all consistent).
- cFp74 scaffold readiness status: `ready_with_over_budget_skips`.
- cFp74 in-cap root count: 3,593; over-budget root count: 386.
- root feature rows: 3,979.
- skipped root rows: 63.
- action feature rows: 0.
- action feature gap rows: 5 (one per cFp69/cFp70/cFp71/cFp72/cFp74).
- `action-feature-gaps.jsonl` cFp69 row carries
  `affectedActionFeatureCountEstimate: 18820` (derived from cFp69
  `publicActionKindCounts` totals); the other four gap rows have no
  estimate field.
- hidden-info scan status: `clean` (0 hazards).
- `root-features.jsonl`: 9,759,260 bytes.
- `action-features.jsonl`: 0 bytes.
- `action-feature-gaps.jsonl`: 2,728 bytes.
- `skipped-roots.jsonl`: 104,265 bytes.
- duplicate root keys across all source artifacts: 0.
- roots missing a cFp68 eligible root: 0 for cFp69/cFp70/cFp71/cFp72.
- cFp73 casebook roots missing a cFp72 branching root: 0.
- cFp74 second-ply / over-budget roots missing a cFp72 branching root: 0.
- cFp71 failed/deferred pair total: 0. cFp72 failed/deferred branching pair
  total: 0. cFp74 failed/deferred second-ply pair count: 0.
- cFp74 in-cap roots not observed: 0.

**Robust starter matrix (`benchmark-v1-starter-matrix-robust-v1`):**

- source consistency status: `ready`.
- cFp68 eligible root count: 32,147.
- skipped root count: 340 (all consistent across cFp68-cFp74).
- cFp74 scaffold readiness status: `ready_with_over_budget_skips`.
- cFp74 in-cap root count: 28,915; over-budget root count: 3,232.
- root feature rows: 32,147.
- skipped root rows: 340.
- action feature rows: 0.
- action feature gap rows: 5.
- hidden-info scan status: `clean` (0 hazards).
- `root-features.jsonl`: 79,683,914 bytes (~79.68 MB) — below the 90 MB hard
  stop. The 50 MB target applies only to `action-features.jsonl`, which is
  0 bytes for the `action_feature_source_gap` path.
- `action-features.jsonl`: 0 bytes.
- `action-feature-gaps.jsonl`: 2,804 bytes.
- `skipped-roots.jsonl`: 571,338 bytes.
- determinism: the robust suite CLI was run twice; all 7 artifact hashes
  (manifest.json, summary.json, root-features.jsonl, action-features.jsonl,
  action-feature-gaps.jsonl, skipped-roots.jsonl, report.md) matched exactly
  across both runs.

---

## cFp76 Artifact Contract

**Artifact family:** `search-consumer-action-features-v0/cFp76/`

**Suites:**
- `benchmark-v1-starter-matrix-v1`
- `benchmark-v1-starter-matrix-robust-v1`

**Files written per suite (all present in both directories):**
- `manifest.json` — schema version, feature run id, suite id, source run
  ids, source artifact SHA-256 references, `consumerReadinessStatus`,
  `explicitNonClaims`, `cFp77Recommendation`.
- `summary.json` — `sourceConsistency` (38 boolean/count checks plus
  `status`), `countSummaries` (by phase, round, policy, faction, deck
  preset, matchup, cFp74 cap status, cFp73 primary casebook label), row
  counts, artifact byte sizes, hidden-info scan status.
- `root-features.jsonl` — one row per cFp68 eligible root.
- `action-features.jsonl` — empty for `action_feature_source_gap`.
- `action-feature-gaps.jsonl` — one row per affected source phase
  (cFp69, cFp70, cFp71, cFp72, cFp74).
- `skipped-roots.jsonl` — one row per cFp68 skipped root, carrying cFp67
  classification fields and the cFp74 inherited skip stage.
- `report.md` — prose summary of source consistency, row counts, action
  feature gap rows, count summaries, artifact sizes, hidden-info safety,
  source artifact references, non-claims, and the cFp77 recommendation.

**Source artifacts read (read-only, 36 references per suite):**
cFp68 `determinized-probe-contract`, cFp69
`determinized-pimc-probe-v0`, cFp70
`determinized-pimc-action-availability-v0`, cFp71
`determinized-pimc-one-ply-outcome-skeleton-v0`, cFp72
`determinized-pimc-post-one-ply-branching-budget-v0`, cFp73
`determinized-pimc-post-one-ply-branching-budget-casebook`, cFp74
`determinized-pimc-bounded-second-ply-scaffold-v0`. No cFp68-cFp74 artifact
directory was modified.

---

## cFp76 Feature Schema

### Root feature row (`root-features.jsonl`)

Each row joins one cFp68 eligible root across cFp69-cFp74 via the
pipe-joined root key (`suiteId|matchupId|seed|mirrorIndex|step|decisionIndex
|phase|round|seatId|policyId|faction|deckPresetId`). Populated fields
include: the root identity fields, `schemaVersion`, `featureRunId`,
`suiteId`, `consumerReadinessStatus`, `cFp69PublicActionCount`,
`cFp69PublicActionKindCounts`/`TargetKindCounts`/`TargetSideCounts` (sparse,
zero entries omitted), `cFp70AvailabilityDisagreementCount`,
`cFp70AvailabilityRiskBucket`, `cFp71PublicActionSamplePairCount`,
`cFp71FailedOrDeferredPairCount`, `cFp71OutcomeDivergenceCount`,
`cFp71OutcomeRiskBucket`, `cFp71PublicOutcomeKindCounts`/
`TransitionKindCounts`, `cFp72PostOnePlyPublicActionBudgetTotal`/`Average`,
`cFp72BranchingBudgetBucket`, `cFp72BranchingRiskBucket`,
`cFp72NextPublicActionCountMax`,
`cFp72LargestNextPublicActionBucketSizeMax`,
`cFp72PostOnePlyActorCounts`/`PhaseCounts`, `cFp73CasebookPresence`,
`cFp73PrimaryCasebookLabel`, `cFp74CapStatus`, `cFp74OverBudgetReason`
(present only when over-budget), `cFp74PlannedSecondPlyPairCount`,
`cFp74CompletedSecondPlyPairCount`, `cFp74FailedOrDeferredSecondPlyPairCount`
(present only for in-cap roots), `cFp74SecondPlyExecutionStatus`,
`cFp74SecondPlyOutcomeRiskBucket`,
`cFp74SecondPlyTransitionKindCounts`/`PublicActionKindCounts`/
`TargetKindCounts`/`TargetSideCounts` (present only when second-ply data
exists).

### Skipped root row (`skipped-roots.jsonl`)

One row per cFp68 skipped root, carrying the root identity,
`schemaVersion`, `consumerReadinessStatus`, `eligibilityStatus`,
`skipReason`, `invalidReason`, the cFp67 classification fields
(`cFp67PrimaryClassification`, `cFp67TransferClassification`,
`cFp67PersistentDeficitClassification`, `cFp67DeficitSizeClassification`,
`cFp67ProvenanceLabel`), `skipStage`, and `skipCounterDimensions`.

### Action feature gap row (`action-feature-gaps.jsonl`)

One row per affected source phase
(`sourcePhase: "cFp69" | "cFp70" | "cFp71" | "cFp72" | "cFp74"`), with
`schemaVersion`, `featureRunId`, `suiteId`, `gapKind:
"action_feature_source_gap"`, `gapScope: "suite"`,
`missingFieldCategory: "durable_public_action_identity"`,
`affectedRootCount`, `recommendedNextStep`, and (cFp69 row only)
`affectedActionFeatureCountEstimate` derived from cFp69
`publicActionKindCounts` totals.

### Action feature row (`action-features.jsonl`)

Schema defined but not populated. cFp76 does not derive a
`publicActionRef` because no committed cFp69-cFp74 artifact carries a
durable per-public-action identity — only per-root aggregate count maps. If
cFp76 had fabricated a per-action identity from raw move data, it would have
violated the hidden-info and "do not fabricate per-action identities"
boundaries from the spec.

---

## cFp76 Source Consistency

All checks from the cFp75 decision note were implemented in
`buildSearchConsumerActionFeaturesV0SourceConsistency` (38 fields plus
`status`). For both suites, every check passed:

- cFp68 eligible/skipped root counts match cFp69-cFp72 root/skipped counts
  exactly (deltas all 0).
- cFp74 in-cap + over-budget = cFp72 branching root count (delta 0).
- cFp74 inherited skipped root count equals cFp68 skipped root count.
- No duplicate root keys in any of cFp68 eligible, cFp69, cFp70, cFp71,
  cFp72, cFp73, cFp74 second-ply, cFp74 over-budget, or cFp74 skipped root
  arrays.
- No cFp69/cFp70/cFp71/cFp72 root is missing a corresponding cFp68 eligible
  root.
- No cFp73 casebook root or cFp74 second-ply/over-budget root is missing a
  corresponding cFp72 branching root.
- cFp70 availability disagreement total: 0. cFp71 failed/deferred pair
  total: 0. cFp72 failed/deferred branching pair total: 0. cFp74
  failed/deferred second-ply pair count: 0.
- cFp74 in-cap roots not observed: 0.
- `sourceArtifactReferenceCount`: 36; `sourceArtifactEmptyHashCount`: 0.

If any check had failed, `consumerReadinessStatus` would be
`source_consistency_failed`, and `rootFeaturesJsonl`,
`actionFeatureGapsJsonl`, and `skippedRootsJsonl` would all be empty
strings (verified by a unit test using a duplicate-key fixture).

---

## cFp76 Hidden-Info Safety

The hidden-info scanner (`scanSearchConsumerActionFeaturesV0ArtifactsForHiddenInfo`)
checks `manifest.json`, `summary.json`, `root-features.jsonl`,
`action-features.jsonl`, `action-feature-gaps.jsonl`, and
`skipped-roots.jsonl` (not `report.md`, which may contain prose card/leader
names) against a 35-entry hazard token list covering: card identity maps,
runtime terminal state, command/event logs, own/opponent hand arrays,
unsafe debug results, decision traces, raw move/label identifiers, source
card/instance identifiers, deterministic action references, sampled
hand/deck/world payloads, hidden hand/deck payloads, hand/deck source
counts, and search-strength fields (best-action labels, selected-action
labels, action/value estimates, reward targets, payoff matrices, rollout
rewards, win-probability estimates, and principal-variation lines), plus the
colon-suffixed seat-instance runtime prefixes (seat A / seat B forms) and
catalog card/leader names derived from the current catalog.

Both the current and robust artifact sets scan clean (`hiddenInfoScanStatus:
"clean"`, 0 hazards). The word "payoff" appears only in `report.md`'s
non-claims prose ("cFp76 does not compute payoff tables or principal
variations."), which is explicitly outside the scanned machine-readable set
and does not match the exact payoff hazard tokens.

The direct exact-token `rg --pcre2` scan (cFp75 pattern, extended with the
search-strength tokens above) over both cFp76 artifact directories, this
decision note, and the cFp76 report returns no matches.

---

## cFp76 Budgets And Size Results

- Robust `root-features.jsonl`: 79,683,914 bytes (~79.68 MB), below the
  90 MB hard stop.
- Robust `action-features.jsonl`: 0 bytes, far below the 50 MB target (the
  target applies to this file specifically).
- Robust `skipped-roots.jsonl`: 571,338 bytes.
- Robust `action-feature-gaps.jsonl`: 2,804 bytes.
- No artifact in either suite approached the 90 MB hard stop. No casebook
  subsetting, gzip, or compaction beyond the existing sparse-count-map
  convention was needed.

---

## Non-Claims

cFp76 `search-consumer-action-features-v0` explicitly does NOT:

- Choose actions or recommend best actions.
- Rank actions or compute action ordering.
- Estimate action values or expected values.
- Estimate win probability or reward targets.
- Compute payoff tables or principal variations.
- Run rollout search, PIMC evaluation, or ISMCTS/MCTS.
- Select moves for product AI.
- Change `legal-heuristic-v1` or `legal-heuristic-v0` behavior.
- Change engine rules, legal moves, sampler behavior, deck/catalog data,
  benchmark suite definitions, or rating artifacts.
- Add AI Lab runner buttons or execute benchmarks from the browser.
- Add difficulty tiers, export training data, or add Python tooling.

---

## Recommended Next Step

cFp76's audit result is `action_feature_source_gap`. Per the spec's
"Expected cFp77 Decision Logic":

cFp77 should add a narrow public-action-identity artifact derived from
cFp69/cFp70 sources, at the earliest safe layer, still without new command
execution or product AI wiring. This artifact should provide the durable
`publicActionRef` that cFp76's `action-features.jsonl` schema expects, so a
future cFp78 (or later cFp76 follow-up) can populate per-root-public-action
feature rows without fabricating identities or re-executing commands.

cFp77 should not recommend rollout, value estimation, action ranking,
best-action selection, win probability, or reward targets from cFp76 alone.

---

*End of cFp76 decision note.*
