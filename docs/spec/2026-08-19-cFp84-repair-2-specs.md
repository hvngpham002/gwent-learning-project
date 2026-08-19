# Cluster F Phase 84 Repair 2 Specs - Trusted Bounded Action Signal Pipeline

Date: 2026-08-19
Branch: `codex/cFp84-bounded-action-evaluation-signal-v0`
Candidate under repair: `d0b35c7`
Original candidate: `92b6d07`
Integration base: `origin/dev`

## Summary

The first cFp84 repair fixed several visible defects, but independent review
found that its benchmark runner still cannot establish the evidence required
for `signal_ready`.

Repair 2 is a narrow completion phase. It must convert the cFp84 execution
path back to TypeScript, implement the source, observation, pair-accounting,
and reconstruction contracts from Repair 1, add the missing adversarial test
matrix, regenerate artifacts from the trusted pipeline, and correct the audit
and project-state claims.

The current cFp84 totals remain provisional:

- current: 663 roots, 1,488 actions, 11,904 expected/completed pairs;
- robust: 5,314 roots, 12,109 actions, 96,872 expected/completed pairs;
- immediate signal range: -125 to 125; and
- all actions reported stable across samples.

Do not preserve those values by forcing fixtures or weakening checks. The
trusted implementation may reproduce them, change them, or fail closed. The
acceptance target is a correct, reconstructible pipeline, not a particular
headline result.

## Independent Review Findings Against `d0b35c7`

### Repair 2 Blocker 1 - The Execution Runner Evades Type Safety

`d0b35c7` deleted:

    scripts/run-benchmark-search-consumer-bounded-action-signal-v0-report.ts

and replaced it with:

    scripts/run-benchmark-search-consumer-bounded-action-signal-v0-report.mjs

The MJS file is not checked by TypeScript. The repository ESLint configuration
applies no substantive rules to it. `npm run typecheck` and `npm run lint`
therefore pass without validating the source parser, dictionary decoding,
root observer, sampled execution, failure accounting, or artifact assembly.

This is not an acceptable repair. Restore a TypeScript runner and typed
runtime modules. Do not keep the MJS implementation as a wrapper around an
untyped object graph.

### Repair 2 Blocker 2 - Missing Source Evidence Defaults To Success

The runner currently evaluates:

    Number(summary.reconstructionMismatchCount ?? 0) === 0

cFp83 has no required top-level `reconstructionMismatchCount`. The actual
evidence lives in `dictionaries.json.reconstructionChecks`. Missing evidence
therefore becomes a false success.

The runner also initializes `cfp80RootResolution` and
`dictionaryIdsInRange` to `true`, then performs only partial checks. It does
not validate all eight action dictionary IDs, declared versus loaded row
counts, source identity uniqueness, closure, cFp80 recorded paths/hashes, or
the complete root identity contract.

### Repair 2 Blocker 3 - Readiness Inputs Are Hardcoded Or Tautological

The runner currently sets:

    duplicateCompletedPairs = 0
    failed = expected - completed
    unaccounted = expected - completed - failed
    reconstructionFailed = false

This makes `unaccounted` zero by construction and prevents reconstruction from
ever failing. Pair failure events are not reconciled with failed pair IDs.
Duplicate completion is not tracked. `summary.json` omits typed
`rootReobservation` and `reconstruction` evidence while reporting
`signal_ready`.

### Repair 2 Blocker 4 - Action Identity Is Only Partially Matched

Canonical legal moves are grouped and an ambiguous move bucket is rejected,
which is useful. However, `publicActionRefId` and `ordinal` are not validated
against the cFp83/cFp77/cFp78 canonical action order. Their failure enums are
never emitted. The expected action key is reconstructed from only part of the
selected action identity.

### Repair 2 Blocker 5 - Root Observation Is Only A Set-Size Check

The runner records root refs in a `Set` and compares its size with the selected
root count. It does not independently detect:

- selected roots observed zero times;
- selected roots observed more than once;
- observed roots outside the selected contract;
- identity mismatches;
- fingerprint mismatches; or
- observer exceptions.

The callback scans all selected roots with `.find(...)` instead of using a
typed pre-indexed identity map.

### Repair 2 Blocker 6 - Failure Counts Do Not Reconcile Pair Denominators

Root materialization and per-sample legal-move failures increment one scalar
failure event even when multiple action/sample pairs fail. The final failed
pair count is inferred from missing completions instead of being built from a
ledger of unique pair identities. A failure category named
`transaction_rejected` is emitted even though it is not in the typed
`Cfp84PairFailure` union.

### Repair 2 Blocker 7 - Runtime Aggregation Duplicates Tested Helpers

The tests exercise `aggregateCfp84Signals`, but the MJS runner implements a
separate untyped aggregation path. Passing helper tests therefore does not
prove that generated artifacts use the tested aggregation semantics.

### Repair 2 Blocker 8 - Test Coverage Is Far Below The Required Matrix

The two cFp84 files contain six named test cases total:

- four execution/formula/status tests; and
- two artifact tests.

Repair 1 required 28 distinct scenarios. Exact matching, negative source
validation, all dictionary fields, duplicates, root observation, execution
failures, denominator reconciliation, output reconstruction, source ordering,
determinism, and hidden-information rejection remain untested.

### Repair 2 Blocker 9 - Documentation Still Overclaims Readiness

The decision note begins with `cFp84 is signal_ready`. The audit report says
the regenerated artifacts replace provisional evidence and says project state
records completion. `PROJECT_STATE.md` actually retains an active repair
handoff, and independent review rejected `d0b35c7`.

## What Repair 2 May Preserve

Preserve these behaviors only after the repaired tests cover them:

- the original fixed bounded immediate-signal formula;
- eight independent samples per selected action;
- the canonical legal-move grouping concept;
- rejection of canonical buckets containing more than one legal move;
- the five readiness statuses and their precedence;
- half-away-from-zero `meanMilli` rounding;
- cFp83 source ordering in emitted roots/actions/skips;
- the exact eight-file artifact contract;
- the 50/25/15/70 MB artifact limits;
- aggregate-only serialization with no per-sample rows; and
- all cFp84 non-claims and benchmark-only boundaries.

Do not preserve the MJS runner, hardcoded consistency booleans, inferred
failure arithmetic, or completion/readiness claims.

## Scope

Repair only cFp84 bounded action signal infrastructure:

- typed source loading and validation;
- typed cFp83 dictionary decoding;
- typed cFp80 root provenance resolution;
- exact selected-action identity reconstruction;
- typed root re-observation;
- sampled action execution with explicit pair IDs;
- aggregate signal and readiness reconstruction;
- artifact serialization, scanning, and limits;
- focused tests;
- regenerated cFp84 artifacts; and
- cFp84 docs, report, AI Lab metadata if required, and project state.

## Out Of Scope

Do not add or change:

- action ranking, recommendation, or best-action selection;
- expected value, reward targets, win probabilities, or calibrated values;
- PIMC search, ISMCTS/MCTS, continuation rollout, or principal variations;
- self-play, training, neural models, or Hugging Face artifacts;
- product AI wiring or difficulty selection;
- `legal-heuristic-v0` or `legal-heuristic-v1` behavior;
- engine rules, legal moves, command semantics, prompts, or scoring;
- sampler behavior or cFp61-cFp83 artifacts;
- benchmark suite definitions, deck presets, catalog data, ratings, or UI;
- cFp85 implementation or authorization; or
- historical H100/Slurm execution.

## Required File Architecture

### 1. Restore A TypeScript CLI

Delete:

    scripts/run-benchmark-search-consumer-bounded-action-signal-v0-report.mjs

Restore:

    scripts/run-benchmark-search-consumer-bounded-action-signal-v0-report.ts

Update both npm commands to run the `.ts` file with `tsx`.

The CLI must be thin. It may parse `--suite`, locate repo-relative sources,
call typed loading/execution/serialization functions, print scalar results,
and set a nonzero exit code. It must not contain the complete benchmark
implementation in compressed one-line form.

### 2. Add A Typed Pipeline Module

Create a dedicated module, preferably:

    src/game/benchmark/searchConsumerBoundedActionSignalV0Pipeline.ts

It must own:

- source types and runtime parsing/validation;
- source consistency construction;
- dictionary decoding;
- cFp80/cFp83 closure and provenance;
- root identity indexing and observation tracking;
- action/sample pair ledger behavior;
- dependency-injected sampled execution;
- output reconstruction; and
- final readiness calculation.

Small cohesive modules are acceptable if they follow existing benchmark
patterns. Do not move untyped runner logic into another JavaScript file.

### 3. Keep Pure Formula And Artifact Modules Focused

The existing:

    src/game/benchmark/searchConsumerBoundedActionSignalV0.ts
    src/game/benchmark/searchConsumerBoundedActionSignalV0Artifacts.ts

may retain pure types/helpers and serializer behavior. Reformat edited code to
the repository style. Avoid compressed single-line implementations for
nontrivial logic.

### 4. No Type-Safety Escape Hatches

The repaired cFp84 path must contain no:

- explicit `any`;
- implicit-any execution dependencies;
- `as unknown as ...` chains;
- broad `Record<string, unknown>` where a required source schema is known;
- unchecked `JSON.parse` output consumed as a trusted source;
- broad ESLint disable;
- MJS implementation path; or
- missing-field fallback that turns required evidence into success.

Use runtime type guards/parsers for committed JSON/JSONL artifacts. A narrowly
scoped assertion is allowed only after a runtime validator establishes every
required field.

## Typed Source Contracts

Define explicit types for at least:

- cFp83 manifest;
- cFp83 summary;
- cFp83 dictionaries and every dictionary group;
- cFp83 root row;
- cFp83 action row;
- cFp83 skipped row projection needed by cFp84;
- cFp80 manifest;
- cFp80 summary;
- cFp80 root row;
- decoded cFp83 action identity;
- cFp84 root identity;
- cFp84 pair identity;
- root-observation ledger;
- pair-completion/failure ledger;
- source consistency;
- reconstruction consistency; and
- execution dependencies.

Malformed, missing, non-integer, out-of-range, duplicate, or inconsistent
source data must produce typed mismatch counters and a non-ready status or a
fail-closed source error. It must never become a JavaScript exception caused
by indexing `undefined`.

## Source Validation Requirements

Implement one pure source validator that can be unit-tested using small
fixtures. It must expose individual scalar checks in `summary.json`.

### cFp83 Manifest

Require:

- expected schema version;
- expected suite ID;
- phase/run IDs equal cFp83;
- status `subset_ready`;
- exact eight-file list in expected order;
- exactly seven non-manifest hash keys;
- each non-manifest hash matches loaded bytes;
- manifest itself receives a computed consumed-source hash;
- all eight consumed references are repo-relative and portable; and
- source directory matches the requested suite and cFp83 path.

### cFp83 Summary And Loaded Counts

Require:

- `selectedRootCount === loaded roots.length`;
- `selectedActionCount === loaded actions.length`;
- `inheritedSkippedRootCount === loaded skips.length`;
- `closureMismatchCount === 0`;
- `hiddenInfoScanStatus === "clean"`;
- every required `sourceConsistency` boolean is present and true;
- every required mismatch/error counter is present and zero; and
- no required field uses `?? 0` or truthiness coercion.

### cFp83 Dictionary Reconstruction

Read `dictionaries.json.reconstructionChecks` directly. Require the object and
all of these exact fields:

    closureMismatchCount
    reconstructionMismatchCount
    remappedActionIdOutOfRangeCount
    selectedActionCount
    selectedRootCount

Require mismatch counts to equal zero and selected counts to equal loaded
source rows. Missing fields are failures.

For every dictionary group, require:

- a recognized group name;
- integer `count`;
- array `values`;
- `count === values.length`;
- all values valid for the group; and
- unique values where identity lookup requires uniqueness.

### All Eight Action Dictionary IDs

For every cFp83 action row validate:

    rootRefId
    publicActionRefId
    kindId
    sourceClassId
    targetId
    strengthBucketId
    optionIndexLabelId
    moveCountBucketId

Each must be an integer between zero inclusive and the corresponding group
length exclusive. Decode all eight fields into a typed action identity before
benchmark execution.

Also require:

- unique source root refs;
- unique root dictionary values;
- unique public-action dictionary values;
- unique `(rootRefId, publicActionRefId, ordinal)` action identities;
- every action references exactly one selected root;
- every selected root has at least one action; and
- decoded grouped action counts reproduce the cFp83 closure exactly.

### Exact cFp80 Provenance

Consume exactly:

    manifest.json
    summary.json
    root-features.jsonl

Find those references inside cFp83's recorded `sourceArtifactReferences`.
Require exact repo-relative path and SHA-256 equality. Recomputing a current
hash without comparing it to cFp83's recorded provenance is insufficient.

Require:

- cFp80 `dictionary_ready`;
- cFp80 source consistency `ready`;
- cFp80 reconstruction `passed`;
- cFp80 declared root count equals loaded rows;
- unique cFp80 root refs;
- exactly one cFp80 row for each selected cFp83 root;
- no selected cFp83 root missing from cFp80;
- public fingerprint equality; and
- equality for suite, matchup, seed, mirror identity, step, decision index,
  phase, round, seat, policy, faction, and deck preset where represented.

## Exact Action Identity And Legal-Move Matching

Build a typed `DecodedCfp83Action` containing all decoded dictionary values,
`publicActionRef`, ordinal, move count/bucket, collision fields, and expected
canonical key.

Before execution, reconstruct the selected public action identity using the
same canonical functions used by cFp77/cFp78:

    buildPublicActionAbstraction
    buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey

Validate that:

1. decoded fields reproduce the expected canonical key;
2. `publicActionRefId` resolves to the expected public action reference;
3. ordinal equals the selected action's canonical root-bucket ordinal;
4. the expected key/reference/ordinal tuple is unique within its root; and
5. source move/collision metadata agrees with the selected closed-root
   contract.

For each sampled world:

1. Generate legal moves once from the rebuilt pre-command state.
2. Build one canonical abstraction/key per legal move.
3. Group `LegalMove[]` by exact key.
4. Require exactly one expected key group.
5. Require exactly one legal move in that group.
6. Verify reference and ordinal correspondence.
7. Convert that one move to a command.
8. Execute it against an independent clone of the same sampled starting
   state.

Use the existing fixed failure enum. `public_action_ref_mismatch` and
`public_action_ordinal_mismatch` must be constructible and tested. Remove
untyped failure labels such as `transaction_rejected`; use
`command_rejected_or_invalid`.

## Root Re-observation Contract

Build one immutable typed identity key per selected cFp83/cFp80 root using all
available fields:

- suite;
- matchup;
- seed;
- mirror group/index;
- step;
- decision index;
- phase;
- round;
- seat;
- policy;
- faction;
- deck preset; and
- public fingerprint.

Pre-index selected roots by this key before running the suite. Do not scan
`roots` with `.find(...)` in every observer callback.

The observer must record:

    selectedRootsObservedZeroTimes
    selectedRootsObservedMoreThanOnce
    observedRootsOutsideSelectedContract
    fingerprintMismatchCount
    identityMismatchCount
    observerExceptionCount

Observation count must be tracked per selected root, not only as a `Set`.
Every selected root must be observed exactly once. Any nonzero counter yields
`root_reobservation_failed` after source consistency passes.

An observer callback that cannot be safely classified must increment a typed
counter and fail closed without serializing exception text.

## Explicit Pair Ledger

Define an immutable pair identity from:

    rootRefId
    publicActionRefId
    ordinal
    sampleIndex

Create the full expected pair-ID set before execution. Its size must equal:

    selectedActionCount * 8

Maintain disjoint maps/sets for:

- completed pair IDs;
- failed pair IDs with one fixed failure enum;
- duplicate completion attempts; and
- unexpected pair IDs.

Rules:

- a pair may transition from pending to completed exactly once;
- a pair may transition from pending to failed exactly once;
- a completed pair cannot later fail;
- a failed pair cannot later complete;
- duplicate transitions increment `duplicateCompletedPairCount` or a typed
  duplicate failure counter;
- unknown pair IDs are rejected;
- materialization failure marks all action/sample pairs at that root failed;
- sample rebuild/legal-move generation failure marks every selected action
  for that sample failed; and
- action-specific failures mark only that action/sample pair failed.

Derive:

    expectedPairCount = expectedPairIds.size
    completedPairCount = completedPairIds.size
    failedPairCount = failedPairIds.size
    duplicateCompletedPairCount = actual duplicate attempts
    unaccountedPairCount = expected IDs in neither completed nor failed

Do not define `failed` as `expected - completed`. Do not define `unaccounted`
from an equation that makes it zero by construction.

Require failure-category scalar totals to reconcile exactly with failed pair
IDs. Event-level root/sample failures may be separately counted, but they must
not be confused with pair failure totals.

## Typed Execution Dependencies

Implement dependency injection for at least:

- materialization;
- sampled-state rebuild;
- legal-move generation;
- public-action abstraction/key construction;
- command conversion;
- command execution;
- public metric extraction; and
- signal construction.

Use typed unions for command execution success/rejection/failure. Check the
transaction status explicitly. Do not infer success only from truthiness of a
`state` property.

Each action/sample command must receive its own deep clone of the rebuilt
pre-command sampled state. Add a test in which the first action mutates its
input and prove that the second action sees the original state.

## Aggregation And Reconstruction

The runtime pipeline must call the tested pure aggregation helper. Do not keep
a second untyped implementation in the CLI.

For every action row validate:

- requested count equals 8;
- completed plus failed equals 8;
- aggregate sums/min/max/mean-milli reconstruct from completed in-memory
  signals;
- component and immediate-signal bounds hold;
- every in-memory immediate signal equals the bounded component sum;
- sensitivity counts use completed pairs only;
- stable means eight completions and exactly one distinct tuple;
- sample-sensitive means eight completions and multiple tuples; and
- incomplete means fewer than eight completions.

For every root row reconstruct:

- selected action count;
- expected/completed/failed pair counts;
- stable/sample-sensitive/incomplete action counts;
- minimum and maximum immediate signal; and
- inherited cFp72/cFp73/cFp74 labels from the exact source root.

For the complete output reconstruct:

    outputActionIdentityMismatchCount
    missingOutputActionCount
    extraOutputActionCount
    outputOrderMismatchCount
    aggregateMismatchCount
    rangeViolationCount

Populate `Cfp84SignalReconstructionConsistency` with real values and serialize
it. Pass `reconstructionFailed` to the status builder only when one or more of
these counters is nonzero.

Populate and serialize `Cfp84RootReobservationConsistency` for every run.

## Readiness Status

Use exactly this precedence:

1. any source consistency failure -> `source_consistency_failed`;
2. any root observation failure -> `root_reobservation_failed`;
3. failed, duplicate, unexpected, or unaccounted pair ->
   `evaluation_incomplete`;
4. output identity, formula, aggregate, range, or order mismatch ->
   `signal_reconstruction_failed`;
5. otherwise -> `signal_ready`.

The pipeline may stop before execution on source failure. Tests must still
prove the pure status builder and source result produce the required status.

## Deterministic Source Ordering

Assemble outputs after execution by iterating immutable source arrays:

- roots in exact cFp83 `subset-roots.jsonl` order;
- actions in exact cFp83 `subset-actions.jsonl` order; and
- skips in exact cFp83 `skipped-roots.jsonl` order.

Do not use benchmark observation order. Do not rely on sorting with `-1` for
missing identities. Missing or duplicate source identities must be a
reconstruction failure before serialization.

## Artifact Contract

Preserve exactly:

    manifest.json
    summary.json
    signal-config.json
    root-evaluations.jsonl
    action-signals.jsonl
    skipped-roots.jsonl
    failures-summary.json
    report.md

Requirements:

- serializers and hash helpers remain typed;
- hash helper keys equal the eight filenames exactly;
- manifest lists the exact eight files;
- manifest records hashes for the seven non-manifest files;
- source references are portable repo-relative paths;
- `signal-config.json` retains the complete fixed formula, clamps, sample
  count, rounding policy, allowlist, and non-claims;
- `summary.json` includes source, observation, pair, reconstruction, signal,
  sensitivity, artifact-size, and readiness evidence;
- `failures-summary.json` separates pair failure counts from observer/event
  counters;
- report records root/action/skip/pair counts, statuses, artifact bytes,
  deterministic hashes, safety results, checks, and non-claims; and
- writer validates all size limits before creating/replacing artifact files.

Keep limits:

- `action-signals.jsonl` below 50 MB;
- `root-evaluations.jsonl` below 25 MB;
- every other artifact below 15 MB; and
- full bundle below 70 MB.

Add positive boundary tests as well as rejection tests. A validator that only
proves oversized fixtures fail is insufficient.

## Hidden-Information Safety

No artifact may contain per-sample rows or hidden world payloads.

The dedicated cFp84 artifact tests must reject injected:

- raw card/leader names;
- catalog source IDs;
- runtime card/source/instance IDs;
- private hand/deck contents;
- sampled hidden assignments or deck order;
- raw legal moves, commands, transactions, events, or logs;
- complete match states;
- raw exception messages; and
- per-sample public outcome rows/tuples.

Also prove one complete safe eight-file bundle passes.

Run both direct scans required by Repair 1:

- exact unsafe-token scan; and
- catalog-derived card/leader identity scan.

Record commands and zero-match results in the audit report.

## Required Focused Tests

The two cFp84 test files must contain at least 28 individually reported Vitest
cases across them. This means at least 28 executed test cases in those two
files, not 28 assertions hidden inside six broad cases. AI Lab tests do not
count toward the cFp84 minimum.

At minimum include named cases for:

1. positive immediate formula;
2. negative immediate formula;
3. component clamps;
4. terminal win/loss/draw;
5. phase transition score guard;
6. round transition score guard;
7. positive half-away rounding;
8. negative half-away rounding;
9. exact one-move canonical match;
10. missing canonical key;
11. multiple legal moves in one key bucket;
12. public action reference mismatch;
13. public action ordinal mismatch;
14. all eight valid dictionary IDs;
15. each of the eight dictionary IDs out of range, using `it.each` if desired;
16. missing reconstruction evidence;
17. cFp83 declared/loaded count mismatch;
18. cFp83 closure/reconstruction mismatch;
19. cFp80 recorded path/hash mismatch;
20. duplicate/missing cFp80 root;
21. fingerprint or identity mismatch;
22. selected root observed zero times;
23. selected root observed twice;
24. outside-contract observer root;
25. materialization failure marks every expected pair;
26. sample rebuild failure marks each root/sample action pair;
27. independent action state clones;
28. command conversion failure;
29. command rejection/failure;
30. engine exception;
31. duplicate completion detection;
32. unaccounted pair detection;
33. failure-count reconciliation;
34. readiness precedence for all five statuses;
35. aggregate reconstruction pass;
36. aggregate/range reconstruction failure;
37. exact source action reconstruction;
38. exact source order despite reversed observation order;
39. stable/sample-sensitive/incomplete semantics;
40. positive and negative artifact-size boundaries;
41. exact eight-file hash keys and deterministic serialization;
42. unsafe artifact rejection; and
43. complete safe bundle acceptance.

The expected focused command must report at least 35 passing cases total when
the existing seven AI Lab tests are included:

    npm test -- --run \
      tests/game/benchmarkSearchConsumerBoundedActionSignalV0.test.ts \
      tests/game/benchmarkSearchConsumerBoundedActionSignalV0Artifacts.test.ts \
      tests/components/gwent/authenticAiLabViewModel.test.ts

Prefer more small precise tests over fewer multi-purpose tests.

## Artifact Regeneration Sequence

Do not run robust until all typed focused tests, typecheck, and lint pass.

1. Capture hashes for all cFp61-cFp83 source artifact directories touched by
   repository status/diff checks.
2. Run current:

       npm run benchmark:search-consumer-bounded-signal:v1-starter-matrix

3. Require the full trusted evidence to pass. Do not continue if current is
   not `signal_ready`.
4. Determine whether robust is expected to exceed 15 minutes.
5. If it is under 15 minutes, run locally twice:

       npm run benchmark:search-consumer-bounded-signal:v1-robust
       npm run benchmark:search-consumer-bounded-signal:v1-robust

6. If it may exceed 15 minutes, stop and give the user one copy-ready local
   command under the experiment ledger contract. Do not wait interactively.
7. Compare all eight robust artifact hashes exactly.
8. Recheck cFp61-cFp83 source artifacts are unchanged.
9. Run direct safety scans.

Do not claim robust repeat determinism unless both repaired-code runs produced
the same eight hashes.

## Required Documentation Repair

Update:

    audit/reports/2026-08-18-cFp84-report.md
    docs/research/literature/ai/decisions/2026-08-18-cfp84-bounded-action-evaluation-signal.md
    docs/PROJECT_STATE.md

Update AI Lab metadata/tests only if committed metadata still overstates or
misidentifies cFp84 after the repair.

The audit report must contain:

- `Repair 2` section;
- files changed;
- old untyped runner removal and typed architecture;
- source consistency readout;
- root observation readout;
- exact expected/completed/failed/duplicate/unaccounted counts;
- failure-category counts;
- reconstruction counters;
- signal range and sensitivity counts;
- artifact byte sizes;
- all eight robust repeat hashes;
- exact focused/full test counts;
- every command actually run and result;
- direct exact-token and catalog scan results;
- source immutability result;
- deviations and risks;
- project state update; and
- independent-review requirement before cFp85.

Do not say project state records completion unless the repaired implementation
actually passed every gate. Do not say regenerated artifacts replace
provisional evidence until the evidence is independently reviewed.

The decision note may say `signal_ready` only if the repaired summary contains
all required source, observation, pair, and reconstruction evidence with zero
failure counters. It must still say that cFp85 is unauthorized pending
independent review.

`PROJECT_STATE.md` must replace the stale Repair 1 blocker text with the actual
Repair 2 state. Before independent review, phrase it as a completed candidate
awaiting review, not an accepted integration phase.

## Required Checks

Run cheap gates first:

    npm test -- --run \
      tests/game/benchmarkSearchConsumerBoundedActionSignalV0.test.ts \
      tests/game/benchmarkSearchConsumerBoundedActionSignalV0Artifacts.test.ts \
      tests/components/gwent/authenticAiLabViewModel.test.ts
    npm run typecheck
    npm run lint
    git diff --check

Then run current artifact generation and validate its output.

After current passes, run or hand off robust according to the 15-minute local
contract. After artifacts exist, run:

    npm test
    npm run typecheck
    npm run lint
    npm run build
    npm run check:forbidden-imports
    npm run check:project-state -- --base origin/dev
    git diff --check
    git diff --cached --check
    npm run ci:browser
    npm run check:worktree-clean

Run the direct exact-token and catalog-derived safety scans described above.

If any required command fails, report the failure accurately. Do not rewrite
the report as passed, and do not commit regenerated artifacts as accepted
evidence.

## Acceptance Criteria

- The cFp84 execution command points to a TypeScript runner.
- No MJS cFp84 implementation remains.
- The typed pipeline passes TypeScript and real ESLint rules.
- No required source field defaults missing evidence to success.
- cFp83 declared/loaded counts and actual reconstruction evidence pass.
- All eight dictionary IDs are validated and decoded.
- Exact cFp80 recorded provenance and root resolution pass.
- Public action key/reference/ordinal all match exactly.
- Ambiguous legal-move buckets fail closed.
- Every selected root is observed exactly once.
- Pair IDs explicitly reconcile expected/completed/failed/duplicate/unaccounted
  counts.
- Failure categories reconcile failed pair IDs.
- Runtime uses the tested aggregation implementation.
- Root/action/skip outputs reconstruct cFp83 exactly and preserve source
  order.
- Source, root, pair, and reconstruction evidence is serialized.
- Status precedence is based on real counters.
- At least 28 cFp84 focused test cases pass.
- Artifact size guards have positive and negative coverage.
- All eight artifacts are deterministic and safe.
- Current and robust are regenerated only after typed gates pass.
- Robust repeat hashes match for all eight files.
- cFp61-cFp83 artifacts remain unchanged.
- Documentation states actual evidence and retains independent review.
- No out-of-scope AI, search, engine, sampler, benchmark-suite, or UI behavior
  changes.

## Stop Conditions

Stop and report instead of weakening the contract if:

- selected cFp83 actions do not map to exactly one legal move in every sample;
- cFp83/cFp80 source reconstruction fails;
- any selected root is missing or observed multiple times;
- pair denominators do not reconcile;
- robust exceeds artifact limits;
- a hidden-information scan finds a real leak;
- the repaired pipeline changes cFp61-cFp83 source artifacts; or
- robust is expected to exceed 15 minutes and no user-owned run has completed.

Those outcomes are evidence, not permission to add fallbacks or choose an
arbitrary move.

## Copy-Ready Prompt For Repair 2 Coder

You are working in:

    /Users/viethungpham/Documents/GitHub/gwent-learning-project

Continue on the existing branch and candidate history:

    git checkout codex/cFp84-bounded-action-evaluation-signal-v0
    git pull --ff-only origin codex/cFp84-bounded-action-evaluation-signal-v0
    git status --short
    git log -4 --oneline

Expected latest spec commit will be above candidate `d0b35c7`.

Read in this order:

1. `AGENTS.md`
2. `docs/PROJECT_STATE.md`
3. `docs/compute/experiment-status-ledger.md`
4. `docs/spec/2026-08-18-cFp84-specs.md`
5. `docs/spec/2026-08-19-cFp84-repair-specs.md`
6. `docs/spec/2026-08-19-cFp84-repair-2-specs.md`
7. `audit/reports/2026-08-18-cFp84-report.md`
8. cFp83 source types, runner, tests, and report

Repair 2 is the active task. Repair 1 commit `d0b35c7` is rejected as
incomplete. Its current/robust pair totals, signal range, stability result,
artifacts, and `signal_ready` status are provisional.

Start by deleting the cFp84 MJS runner and restoring a thin TypeScript CLI.
Move execution into typed testable modules. Implement source parsing and
validation before benchmark execution. Implement the explicit pair ledger and
reconstruction before artifact regeneration. Create at least 28 individually
reported cFp84 test cases and require the focused command to report at least
35 tests including AI Lab.

Do not run robust until focused tests, typecheck, lint, diff checks, and current
artifact generation pass. Follow the local 15-minute handoff contract. Do not
use historical H100/Slurm instructions.

When complete, commit and push to this same branch. Report:

- repair commit SHA;
- typed files added/removed/changed;
- cFp84 focused and full test counts;
- source validation counters;
- all eight dictionary checks;
- cFp80 provenance/root resolution counters;
- root re-observation counters;
- pair ledger counts and failure categories;
- reconstruction counters;
- current and robust root/action/skip/pair totals;
- signal range and sensitivity counts;
- artifact byte sizes;
- all eight robust repeat hashes;
- safety scan results;
- source immutability result;
- all check results;
- deviations/stop conditions; and
- recommendation.

Do not authorize or begin cFp85. Independent review remains required.
