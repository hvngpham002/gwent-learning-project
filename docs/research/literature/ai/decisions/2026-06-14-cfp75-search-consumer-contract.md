# cFp75 — Search Consumer Contract Decision

**Date:** 2026-06-14
**Spec:** `docs/spec/2026-06-14-cFp75-specs.md`
**Branch:** `codex/cFp75-search-consumer-contract-decision`
**Base:** `dev`

---

## Decision

cFp75 pauses blind third-ply execution. The project will not implement a
third-ply public-action execution probe yet.

The next executable phase should be a benchmark-only public-action feature
consumer contract starting with compact per-root and per-public-action scalar
features that future PIMC/ISMCTS/evaluator code can consume.

The recommended target for cFp76 is:

> `search-consumer-action-features-v0`: a compact benchmark-only artifact that
> converts existing cFp68-cFp74 readiness evidence into hidden-info-safe
> per-root and per-root-public-action feature rows. It must not choose actions,
> rank actions, estimate values, run rollouts, or change gameplay policy.

cFp76 should be benchmark-only and hidden-info-safe. cFp76 must not make
search-strength claims.

This is the bridge between "we can execute sampled-world scaffolds" and
"we can build a search/evaluation consumer." Without this bridge, a
third-ply probe mostly creates more depth evidence without answering how
any future search policy will use it.

---

## Why Not Third-Ply Yet

cFp74 completed the benchmark-only bounded second-ply public-action scaffold
and proved the mechanics work:

- current: 3,593 in-cap roots, 386 over-budget roots, 63 inherited skipped
  roots, 628,847 completed second-ply pairs, 0 failed/deferred pairs;
- robust: 28,915 in-cap roots, 3,232 over-budget roots, 340 inherited skipped
  roots, 5,101,445 completed second-ply pairs, 0 failed/deferred pairs;
- robust compact artifact projection: 58,287,850 bytes;
- robust repeat hashes matched exactly.

The mechanics are sound. But the artifact/cost curve is real.

A third-ply execution probe would:

1. Likely multiply artifact sizes beyond the current robust 58 MB compact
   projection.
2. Require more compute before the project has a consumer that says which
   features actually matter.
3. Produce depth evidence without answering how any future search policy
   will consume it.

The evidence now says the mechanics work, but the artifact/cost curve is
real. The next phase should define the first concrete hidden-info-safe
search-readiness consumer: what data it needs, what artifact shape it
should consume, what it is allowed to claim, and what cFp76 should
implement.

cFp75 should stop the drift toward blind depth expansion. It should make
the search-readiness consumer contract legible before deeper execution
exists.

---

## Evidence From cFp74

cFp74 current starter matrix:

- branching roots: 3,979.
- in-cap roots: 3,593.
- over-budget roots: 386.
- inherited skipped roots: 63.
- planned second-ply pairs total: 863,479.
- planned second-ply pairs in cap: 628,847.
- planned second-ply pairs over budget: 234,632.
- completed second-ply pairs: 628,847.
- failed/deferred second-ply pairs: 0.
- over-budget reason: `root_second_ply_pair_cap_exceeded` = 386.
- source consistency: ready.
- in-cap roots not observed: 0.
- compact second-ply root artifact: 7,169,242 bytes.

cFp74 robust starter matrix:

- branching roots: 32,147.
- in-cap roots: 28,915.
- over-budget roots: 3,232.
- inherited skipped roots: 340.
- planned second-ply pairs total: 7,095,113.
- planned second-ply pairs in cap: 5,101,445.
- planned second-ply pairs over budget: 1,993,668.
- completed second-ply pairs: 5,101,445.
- failed/deferred second-ply pairs: 0.
- over-budget reason: `root_second_ply_pair_cap_exceeded` = 3,232.
- source consistency: ready.
- in-cap roots not observed: 0.
- compact second-ply root artifact: 58,287,850 bytes.

cFp74 Repair 1 fixed public-transfer memory continuity by priming eligible
over-budget roots before returning from the root observer. Repair 2
compacted only the artifact row projection by moving repeated run/cap
constants into manifest/summary and omitting zero-valued second-ply
count-map entries. Default caps stayed unchanged, robust coverage was not
lowered, and the 90 MB guard stayed unchanged.

The prior ladder:

- cFp68: valid-root-only determinized probe contract with explicit skip
  accounting.
- cFp69: public-action root scaffold.
- cFp70: sampled-world action availability.
- cFp71: one-ply public-action outcome skeleton.
- cFp72: post-one-ply next-surface branching budget.
- cFp73: scalar casebook over cFp72 branching pressure.
- cFp74: bounded second-ply public-action scaffold.

Source consistency is ready through cFp74. All over-budget roots are
`root_second_ply_pair_cap_exceeded`. There are zero failed or deferred
second-ply pairs. The foundation for a feature consumer is in place.

---

## First Search-Consumer Target

The next phase should not count third-ply legal surfaces, execute
third-ply commands, run rollouts, evaluate actions, rank actions, or
select moves. It should instead define and implement the first consumer
of the existing readiness evidence.

**cFp76 target: `search-consumer-action-features-v0`**

A benchmark-only artifact that converts existing cFp68-cFp74 readiness
evidence into hidden-info-safe per-root and per-root-public-action
feature rows.

Key constraints:

- No action values, win probability, expected value, reward targets,
  or payoff tables.
- No best-action selection, action ranking, principal variations,
  or search-selected move choice.
- No rollout search, PIMC action evaluation, or ISMCTS/MCTS.
- No v1 heuristic behavior changes, policy replacement, or product
  AI wiring.
- No AI Lab runner buttons or browser benchmark execution.
- No gameplay, engine rules, legal moves, AI policy behavior, sampler
  behavior, deck/catalog data, benchmark suite definitions, rating
  artifacts, or edits to existing cFp68-cFp74 artifacts.

cFp76 should not re-execute commands if it can derive the first
action-feature contract from committed scalar artifacts. If per-action
features require additional observation, cFp76 must explicitly stop and
report `action_feature_source_gap` rather than widening scope into
new command execution.

---

## cFp76 Artifact Contract

**Artifact family:**
`search-consumer-action-features-v0/cFp76/`

**Suites:**
- `benchmark-v1-starter-matrix-v1`
- `benchmark-v1-starter-matrix-robust-v1`

**Required files per suite:**
- `manifest.json` — run/source constants, phase metadata, source
  artifact SHA-256 references.
- `summary.json` — aggregate root/action feature counts, budget
  status, hidden-info scan result.
- `root-features.jsonl` — one hidden-info-safe scalar root feature row
  per eligible root (plus skipped-root rows).
- `action-features.jsonl` — one hidden-info-safe scalar feature row
  per root-public-action pair (when derivable from committed sources).
- `skipped-roots.jsonl` — skipped-root scalar rows with skip reason
  and linkage to source contracts.
- `report.md` — prose summary of artifact generation, source
  consistency, budget status, and stop conditions.

**Recommended source artifacts:**
- cFp68 eligible/skipped roots.
- cFp69 public-action root scaffold.
- cFp70 sampled-world action availability.
- cFp71 one-ply outcome skeleton.
- cFp72 post-one-ply branching budget.
- cFp73 branching budget casebook.
- cFp74 bounded second-ply scaffold.

**Source consistency checks cFp76 must perform:**
- cFp68 eligible root count matches expected.
- cFp69 probe root count matches cFp68 eligible count.
- cFp70 availability root count matches cFp68 eligible count.
- cFp71 outcome root count matches cFp68 eligible count.
- cFp72 branching root count matches cFp68 eligible count.
- All skipped-root counters from cFp68-cFp74 are present and consistent.
- No duplicate root keys across source artifacts.
- All cFp68 fingerprint references are valid.

If any source consistency check fails, cFp76 must stop and report the
failure rather than producing partial artifacts.

---

## cFp76 Feature Schema

### Root-level feature row

Each row is a single JSON object. Required categories:

- `suiteId` — the benchmark suite identifier.
- `matchupId` — the matchup identifier.
- `seed` — the deterministic seed.
- `mirrorGroup` and `mirrorIndex` — present when mirror runs exist.
- `step` — the game step.
- `decisionIndex` — the decision index within the step.
- `phase` — playing or round_end.
- `round` — the round number.
- `seatId` — the seat identifier.
- `policyId` — the policy identifier.
- `faction` — the seat faction.
- `deckPresetId` — the deck preset identifier.
- `rootPublicFingerprint` — the deterministic root fingerprint.
- `cFp68Eligibility` — `eligible` or `skipped`.
- `cFp68SkipReason` — present when skipped.
- `cFp69RootPublicActionCount` — scalar public action count at root.
- `cFp70AvailabilityDisagreementFlag` — boolean flag.
- `cFp70AvailabilityDisagreementCount` — scalar count.
- `cFp71OnePlyPairCount` — completed public action/sample pairs.
- `cFp71DivergenceFlag` — boolean flag.
- `cFp71DivergenceCount` — scalar count.
- `cFp72BudgetTotals` — post-one-ply budget aggregates.
- `cFp72BudgetBuckets` — budget bucket distribution.
- `cFp73CasebookLabels` — present when casebook labels exist.
- `cFp74CapStatus` — in-cap, over-budget, or skipped.
- `cFp74OverBudgetReason` — present when over-budget.
- `cFp74CompletedSecondPlyPairs` — present when available.
- `cFp74FailedSecondPlyPairs` — present when available.
- `cFp74DeferredSecondPlyPairs` — present when available.
- `inheritedSkippedRootCounters` — inherited skip counts.
- `consumerReadinessStatus` — readiness classification.

### Action-level feature row

Each row is a single JSON object. Required categories:

- `rootPublicFingerprint` — deterministic linkage to the root row.
- `publicActionRef` — deterministic public action reference (not raw
  move identifier).
- `publicActionKind` — the public action kind classification.
- `targetKind` — the target kind classification.
- `targetSide` — the target side classification.
- `publicRowZoneBucket` — present when applicable.
- `targetExpansionBucket` — present when applicable.
- `cFp70AvailabilityStatus` — present when sampled availability
  information exists.
- `cFp70AvailabilityCount` — present when sampled availability
  information exists.
- `cFp71TransitionCount` — present when one-ply transition data
  exists.
- `cFp72BudgetContribution` — present when post-one-ply budget
  data exists.
- `cFp74SecondPlyCompletionBucket` — present when second-ply data
  exists.
- `rootCapLinkage` — root-to-cap linkage classification.
- `skippedRootLinkage` — skipped-root linkage classification.

**Prohibited fields in action-level rows:**

Card names, source identifiers, instance identifiers, raw move data,
command data, event data, terminal state data, sampled hand data,
sampled deck data, and any runtime card instance identifiers must not
appear. Deterministic action references derived from raw moves are also
prohibited.

If existing committed artifacts cannot populate action-level rows
without adding new game-command execution, cFp76 must explicitly stop
and report `action_feature_source_gap` rather than inventing features.

---

## cFp76 Source Consistency

cFp76 must perform these source consistency checks before generating any
feature rows:

1. cFp68 eligible root count matches the expected count for the suite.
2. cFp69 probe root count equals cFp68 eligible root count.
3. cFp70 availability root count equals cFp68 eligible root count.
4. cFp71 outcome root count equals cFp68 eligible root count.
5. cFp72 branching root count equals cFp68 eligible root count.
6. cFp74 in-cap + over-budget + skipped = cFp72 branching root count.
7. All skipped-root counters from cFp68 are carried through cFp74.
8. No duplicate root keys across any source artifact.
9. All cFp68 fingerprint references in downstream artifacts are valid.
10. Sample budgets match between cFp68 and cFp70.
11. Public action abstraction failures are zero in cFp69 and cFp70.
12. Failed/deferred counts are zero in cFp71 and cFp74.

If any check fails, cFp76 must stop and report the specific failure.
It must not produce partial artifacts or silently skip roots.

---

## cFp76 Hidden-Info Safety

cFp76 must not include any of the following payloads in generated
machine-readable artifact rows:

- Runtime state snapshots and terminal states.
- Card identity maps (card-by-card lookup tables).
- Command logs or event logs from match execution.
- Own-hand or opponent-hand card arrays.
- Unsafe debug results from headless execution.
- Decision trace payloads.
- Raw move identifiers or raw label strings.
- Source card identifiers or card instance identifiers.
- Deterministic action references derived from raw moves.
- Card order or deck order from the sampled deck.
- Sampled hand or sampled deck payload data.
- Runtime instance prefixes with seat-side identifiers and colon suffix.
- Card names and leader names in generated artifact rows.

**Exception for prose documentation:**

Card names and leader names may appear in the `report.md` prose
documentation. They must not appear in `root-features.jsonl`,
`action-features.jsonl`, `manifest.json`, `summary.json`, or
`skipped-roots.jsonl`. Runtime instance prefixes with seat-side
identifiers must also be avoided in machine-readable artifact rows.

**Prohibited payloads list (machine-readable rows only):**

The following categories of identifiers are prohibited in artifact
JSON/JSONL rows:

- Card identity lookup maps.
- Runtime terminal state snapshots.
- Command event logs.
- Own-side and opponent-side hand card arrays.
- Unsafe debug result payloads.
- Decision trace payloads.
- Raw move identifiers and raw label strings.
- Source card identifiers and card instance identifiers.
- Action references derived from raw moves.
- Card draw order or deck sequence data.
- Sampled hand or sampled deck payload data.
- Runtime instance prefixes (seat-side identifiers with colon suffix).
- Card names and leader names.

Additionally, runtime instance prefixes with seat-side identifiers
and card/leader names must not appear in machine-readable artifact rows.

---

## cFp76 Budgets And Stop Conditions

**Size targets:**
- Robust `action-features.jsonl` target: below 50 MB.
- Hard stop if any single generated artifact reaches 90 MB before
  writing.
- No gzip or binary artifact workarounds.
- No full command/event/state payloads in artifact rows.
- Use sparse count maps where applicable.
- Repeated run/source constants belong in manifest/summary, not every
  row.

**Behavioral stop conditions:**
- If robust action-feature artifacts exceed the 50 MB target, cFp76
  must switch to a deterministic casebook subset rather than widening
  rows or adding compression.
- If committed cFp68-cFp74 artifacts cannot derive per-action feature
  rows without new game-command execution, cFp76 must stop with an
  `action_feature_source_gap` casebook/decision note.
- If source consistency checks fail, cFp76 must stop and report the
  specific failure.

**cFp76 must not:**
- Recommend rollout search, action values, or search-play policy
  from feature schema work alone.
- Change existing cFp68-cFp74 artifacts.
- Re-execute benchmark commands.
- Re-observe benchmark roots.
- Rebuild sampled states.
- Run new command-execution probes.

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
- Change `legal-heuristic-v1` behavior.
- Change `legal-heuristic-v0` behavior.
- Change engine rules or legal moves.
- Change sampler behavior.
- Change deck or catalog data.
- Change benchmark suite definitions.
- Change rating formulas or artifacts.
- Add AI Lab runner buttons or controls.
- Execute benchmarks from the browser.
- Add difficulty tiers.
- Export training data.
- Add Python tooling or notebooks.

cFp76 produces feature rows that future search code can consume. It
does not evaluate, rank, or select. It does not make search-strength
claims.

---

## Recommended Next Step

The recommended next step after cFp75 implementation is to begin cFp76
`search-consumer-action-features-v0` as a benchmark-only feature
consumer phase.

cFp76 should:

1. Perform source consistency checks over committed cFp68-cFp74
   artifacts.
2. Derive per-root feature rows from committed scalar artifacts.
3. Attempt to derive per-action feature rows from the same sources.
4. If per-action derivation is possible, write `action-features.jsonl`.
5. If per-action derivation is not possible, stop with an
   `action_feature_source_gap` report and recommend a redesign
   decision before any new command execution.
6. Enforce the 90 MB hard stop and 50 MB target for robust artifacts.
7. Run a hidden-info safety scan over all generated artifact rows.
8. Update project state and AI Lab metadata.
9. Write the cFp76 report.

---

*End of cFp75 decision note.*
