# Cluster F Phase 84 Repair Specs - Bounded Action Evaluation Signal v0

Date: 2026-08-19
Branch: `codex/cFp84-bounded-action-evaluation-signal-v0`
Base implementation commit: `92b6d07`
Base integration branch: `dev`

## Summary

The first cFp84 implementation generated plausible current and robust counts,
but review found that the implementation does not enforce the contracts needed
to trust those counts. It must not be merged in its current form.

The candidate reports:

- current: 663 roots, 1,488 actions, 11,904/11,904 pairs;
- robust: 5,314 roots, 12,109 actions, 96,872/96,872 pairs;
- signal range: -125 to 125; and
- all emitted actions stable across samples.

These results are provisional. The runner can silently choose the first of
multiple matching legal moves, source validation defaults missing evidence to
success, required readiness statuses are absent, artifact size guards are
absent, output order differs from cFp83, required cFp84 tests do not exist, and
lint fails with 20 errors. The audit report and project state therefore claim
completion before the acceptance gates passed.

This repair must rebuild the cFp84 implementation around typed, testable
modules. Preserve the original cFp84 signal formula and benchmark-only scope.
Do not broaden the phase into ranking, action selection, rollout search, or
product AI.

## Review Blockers

Repair all of these blockers.

### Blocker 1 - Exact Action Matching Is Not Enforced

`DeterminizedPimcActionAvailabilityV0PublicActionBucket` contains `key` and
`action`; it does not contain legal moves. The current runner reads an optional
`bucket.moves` property that is not part of the type, then independently
filters legal moves and takes element zero without requiring exactly one
match.

This can silently execute an arbitrary representative when zero or multiple
legal moves share the decoded public key. A completed pair is valid only when
the selected cFp83 action resolves to exactly one legal move in that sample.

### Blocker 2 - Source Consistency Is Incomplete

The current runner does not prove:

- cFp83 declared root/action/skip counts equal loaded row counts;
- all cFp83 source-consistency fields retain their required values;
- all eight cFp83 action dictionary IDs are in range;
- every action resolves to exactly one selected root;
- selected root/action closure remains exact;
- cFp80 files match the exact hashes recorded by cFp83;
- cFp80 and cFp83 root identities are unique;
- every cFp83 root resolves exactly once to cFp80;
- every resolved fingerprint matches; or
- output signal rows reconstruct the source cFp83 identities.

The current `cfp83ReconstructionZero` check reads a missing top-level value and
defaults it to zero instead of validating cFp83's actual nested consistency
and dictionary reconstruction fields.

### Blocker 3 - Readiness Status Precedence Is Missing

The original spec requires:

1. `source_consistency_failed`
2. `root_reobservation_failed`
3. `evaluation_incomplete`
4. `signal_reconstruction_failed`
5. `signal_ready`

The current runner emits only `signal_ready` or `evaluation_incomplete`.
`root_reobservation_failed` may be counted but is ignored when status is
selected. Signal reconstruction is not implemented.

### Blocker 4 - No cFp84 Execution Or Artifact Tests Exist

The required files are absent:

    tests/game/benchmarkSearchConsumerBoundedActionSignalV0.test.ts
    tests/game/benchmarkSearchConsumerBoundedActionSignalV0Artifacts.test.ts

The reported focused command ran only the existing AI Lab test. It did not
exercise cFp84.

### Blocker 5 - Lint Fails

`npm run lint` reports 20 cFp84 errors, primarily explicit `any` types plus an
unused variable. The implementation and serializer need concrete types.

### Blocker 6 - Artifact Limits Are Not Enforced

The current runner writes artifacts without applying cFp84's action, root,
other-file, or complete-bundle hard stops.

### Blocker 7 - Output Order Does Not Preserve cFp83

The emitted action rows follow benchmark observation order. The first cFp84
current action uses `rootRefId: 480`, while the immutable cFp83 action stream
starts at `rootRefId: 0`. cFp84 must preserve cFp83 root/action source order and
must never sort by signal.

### Blocker 8 - Evidence And Documentation Are Inaccurate

The report omits required tests, source checks, reconstruction checks, sizes,
hashes, direct safety scans, and browser CI. It claims completion despite lint
failure and missing cFp84 tests. `docs/PROJECT_STATE.md` and AI Lab must not
advance to cFp85 until repaired evidence passes.

## Repair Scope

Refactor cFp84 into these responsibilities:

1. pure public signal formula and aggregation;
2. typed cFp83/cFp80 source loading and source validation;
3. typed root re-observation and exact public-action matching;
4. typed one-command sampled-world execution with dependency injection;
5. pure result/readiness/reconstruction assembly;
6. deterministic artifact serialization and size validation; and
7. a thin CLI that orchestrates the modules.

Suggested files remain:

    src/game/benchmark/searchConsumerBoundedActionSignalV0.ts
    src/game/benchmark/searchConsumerBoundedActionSignalV0Artifacts.ts
    scripts/run-benchmark-search-consumer-bounded-action-signal-v0-report.ts
    tests/game/benchmarkSearchConsumerBoundedActionSignalV0.test.ts
    tests/game/benchmarkSearchConsumerBoundedActionSignalV0Artifacts.test.ts

Add another focused module only if it creates a clear ownership boundary, for
example a typed runner module. Do not leave the execution algorithm compressed
into a single CLI line.

## Preserve The Original Formula

Do not change the formula from `docs/spec/2026-08-18-cFp84-specs.md`:

    scoreSwing = clamp(afterScoreDiff - beforeScoreDiff, -60, 60)
      only when phase and round are unchanged; otherwise 0

    handSwing = clamp(handDiffDelta * 8, -24, 24)

    gemSwing = clamp(gemDiffDelta * 25, -50, 50)

    terminalComponent = 100 win / -100 loss / 0 draw or incomplete

    immediateSignal = clamp(component sum, -200, 200)

Keep integer half-away-from-zero `meanMilli`. Add no action-kind, faction,
policy, card-strength, heuristic-v1, continuation, or preferred-action bonus.

## Typed Data Contracts

Define concrete interfaces for:

- cFp83 manifest, summary, dictionaries, roots, actions, and skipped rows;
- consumed cFp80 summary and root rows;
- source artifact references;
- public pre/post metrics;
- one pair outcome;
- one pair failure enum;
- action aggregate row;
- root aggregate row;
- source consistency;
- root re-observation consistency;
- signal reconstruction consistency;
- final result;
- artifact byte sizes and limit result; and
- injected execution dependencies used by tests.

Do not use `any`, unsafe casts, or untyped dynamic module bags. If Vite runtime
loading remains necessary, define a narrow interface and validate the loaded
exports before use.

The serializer must accept a typed result. Do not use `result: any` or
`sourceArtifactReferences: any[]`.

## Source Validation

Implement a pure source validator. Expose each scalar check separately in the
result and generated summary.

### cFp83 Manifest And Files

Validate:

- manifest schema/version, suite, phase, run, status, and exact eight-file
  list;
- all seven non-manifest artifact hashes in cFp83 manifest against loaded
  bytes;
- the manifest itself is separately hashed as a consumed source reference;
- all eight source references use portable repo-relative paths and nonempty
  SHA-256 values; and
- loaded artifact directories are the expected suite/cFp83 paths.

### cFp83 Summary And Actual Counts

Validate:

- `subsetStatus === "subset_ready"`;
- loaded roots equal `selectedRootCount`;
- loaded actions equal `selectedActionCount`;
- loaded skips equal `inheritedSkippedRootCount`;
- `closureMismatchCount === 0`;
- every required cFp83 source-consistency boolean is true;
- every required cFp83 mismatch/error count is zero; and
- cFp83 reconstruction checks in `dictionaries.json` are present and zero.

Do not use `?? 0` for required evidence. A missing required field is a source
failure.

### cFp83 Dictionaries And Closure

Validate all eight action ID fields:

    rootRefId
    publicActionRefId
    kindId
    sourceClassId
    targetId
    strengthBucketId
    optionIndexLabelId
    moveCountBucketId

For every field, require an integer in range. Decode all values before
evaluation.

Also validate:

- dictionary `count` equals `values.length` for every group;
- root dictionary values are unique;
- public action dictionary values are unique;
- loaded selected root refs are unique;
- `(rootRefId, publicActionRefId, ordinal)` source action identities are
  unique;
- every action references one loaded selected root;
- every selected root has one or more actions; and
- grouped action counts exactly reproduce cFp83 closure.

### cFp80 Provenance And Root Resolution

For the exact three consumed cFp80 files:

    manifest.json
    summary.json
    root-features.jsonl

Require the repo-relative path and SHA-256 to match cFp83's recorded source
references exactly. A newly computed hash alone is not sufficient.

Validate:

- cFp80 is dictionary-ready, source-consistent, and reconstructed;
- cFp80 summary root count equals loaded rows;
- cFp80 root refs are unique;
- each cFp83 root resolves to exactly one cFp80 root;
- cFp83 and cFp80 public fingerprints match;
- suite, matchup, phase, round, policy, faction, and deck preset agree; and
- every identity field needed for re-observation is present.

## Exact Public-Action Matching

Do not access a nonexistent `moves` property on public-action buckets.

Implement or reuse a typed helper that groups sampled legal moves by the exact
canonical key returned by:

    buildPublicActionAbstraction
    buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey

For each sampled world:

1. Build one canonical key for every legal move.
2. Group `LegalMove[]` by that key.
3. Decode the cFp83 action's expected canonical values using cFp83
   dictionaries.
4. Reconstruct its expected canonical key.
5. Verify its `publicActionRefId` and ordinal correspond to the same canonical
   root bucket ordering used by cFp77/cFp78.
6. Require exactly one key match.
7. Require exactly one legal move in that matched group.
8. Only then call `commandFromLegalMove`.

Failure classifications must distinguish:

    public_action_key_missing
    public_action_key_duplicate
    public_action_ref_mismatch
    public_action_ordinal_mismatch
    matched_bucket_zero_moves
    matched_bucket_multiple_moves
    command_conversion_failed

Any one blocks completion for that action/sample pair. Never select element
zero from a group until its length is proven to be one.

## Root Re-observation

Build a typed cFp80 root identity key using all available identity fields:

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

Pre-index selected cFp83/cFp80 roots by this key. Do not scan all selected
roots inside every observer callback.

Track:

- selected roots observed zero times;
- selected roots observed more than once;
- observed roots outside the selected contract;
- fingerprint mismatches;
- identity mismatches; and
- observer exceptions.

Any selected root observed zero or multiple times produces
`root_reobservation_failed`, even when pair totals happen to balance.

## Sampled Execution And Pair Denominators

Use exactly 8 samples per selected root.

For each selected root:

- preserve public-transfer memory through the established memory store;
- require materialization status `valid`;
- require requested/generated/valid/invalid counts to match the established
  eight-sample contract;
- rebuild each sampled root through the established cFp70 helper;
- create an independent clone for every action/sample command;
- generate legal moves from the rebuilt pre-command state;
- execute exactly one command;
- collect public metrics before and after; and
- discard the sampled state after aggregation.

Do not let one action mutate the state used by another action.

When an entire sample cannot be rebuilt or inspected, account for one failed
pair for every selected action at that root/sample. When root materialization
fails, account for all `selectedActionCount * 8` expected pairs as failed.

Maintain explicit pair counts:

    expectedPairCount
    completedPairCount
    failedPairCount
    duplicateCompletedPairCount
    unaccountedPairCount

Require:

    expected = completed + failed
    duplicateCompleted = 0
    unaccounted = 0

The expected counts from committed cFp83 remain 11,904 current and 96,872
robust, but derive them from loaded actions rather than hard-coding runtime
results.

## Failure Accounting

Use fixed enums and scalar counts. Include at least:

    sample_materialization_failed
    sample_count_mismatch
    sampled_world_rebuild_failed
    legal_move_generation_failed
    public_action_abstraction_failed
    public_action_key_missing
    public_action_key_duplicate
    public_action_ref_mismatch
    public_action_ordinal_mismatch
    matched_bucket_zero_moves
    matched_bucket_multiple_moves
    command_conversion_failed
    command_rejected_or_invalid
    engine_exception
    public_metric_extraction_failed
    signal_range_violation
    duplicate_pair_completion

Do not serialize raw exception messages, commands, moves, transactions,
states, sampled hands/decks, or per-pair payloads.

## Readiness Precedence

Implement a pure status builder using exactly this precedence:

1. source failure -> `source_consistency_failed`
2. root observation failure -> `root_reobservation_failed`
3. any missing/failed/duplicate/unaccounted pair -> `evaluation_incomplete`
4. output identity/formula/range/order reconstruction failure ->
   `signal_reconstruction_failed`
5. otherwise -> `signal_ready`

Add unit tests proving each higher-priority status wins when multiple failures
are present.

## Signal Aggregation And Reconstruction

Keep only aggregate action and root rows. Do not emit per-sample rows.

For every action, validate:

- requested count = 8;
- completed + failed = 8;
- each component minimum/maximum is within its formula bounds;
- each sum is within bound multiplied by completed count;
- each mean-milli reconstructs exactly from sum/completed count;
- immediate signal equals the bounded component sum for every in-memory pair;
- sensitivity tuple counts use only completed pairs;
- `stable` means exactly one distinct tuple and all 8 complete;
- `sample_sensitive` means more than one tuple and all 8 complete; and
- `incomplete` means fewer than 8 completed pairs.

For every root, validate aggregate action/pair/stability counts from action
rows.

For the complete output, validate:

- root/action/skip counts equal cFp83;
- every output action maps to exactly one source cFp83 action;
- no cFp83 action is missing;
- no extra output action exists;
- root and action rows follow exact cFp83 source order;
- no sorting by signal occurred; and
- signal range is recomputed from action rows.

## Artifact Serialization And Limits

Preserve the exact eight-file cFp84 contract:

    manifest.json
    summary.json
    signal-config.json
    root-evaluations.jsonl
    action-signals.jsonl
    skipped-roots.jsonl
    failures-summary.json
    report.md

Implement and test a pure size-limit validator:

- `action-signals.jsonl`: 50 MB hard stop;
- `root-evaluations.jsonl`: 25 MB hard stop;
- every other individual artifact: 15 MB hard stop; and
- complete bundle: 70 MB hard stop.

Apply each limit only to its intended artifact. Fail before write.

All artifact serializers and hash helpers must be typed. Hash keys must exactly
match the eight filenames.

## Deterministic Ordering

Preserve cFp83 source order:

- root rows follow `subset-roots.jsonl` order;
- action rows follow `subset-actions.jsonl` order;
- skipped rows follow `skipped-roots.jsonl` order; and
- count-map keys alone may be lexicographically sorted.

Benchmark observation order must not determine artifact row order. Store
outcomes by immutable source identity and assemble output by iterating the
source arrays after execution completes.

## Hidden-Information Safety

Retain the existing no-per-sample artifact boundary and add dedicated cFp84
scanner tests.

Reject injected:

- raw card or leader names;
- catalog source IDs;
- runtime card/source/instance IDs;
- private hand/deck contents;
- sampled hidden assignments;
- deck order;
- raw legal moves;
- commands;
- transactions;
- events or command logs;
- complete match states;
- raw exception messages; and
- per-sample public outcome rows or tuples.

Run both repository direct scans:

- exact unsafe-token scan; and
- catalog-derived card/leader identity scan.

The generic serializer scan alone is not the complete required evidence.

## Required Tests

Create both missing files and implement the original cFp84 test matrix. At
minimum prove:

1. positive, negative, terminal, phase/round-transition, and clamped formula
   behavior;
2. positive and negative half-away-from-zero mean-milli rounding;
3. typed exact canonical action matching;
4. zero matching moves fails;
5. two matching moves fail rather than selecting the first;
6. public action ref mismatch fails;
7. ordinal mismatch fails;
8. all eight cFp83 dictionary fields are range-checked;
9. missing cFp83 required evidence fails instead of defaulting to success;
10. cFp83 declared-vs-loaded root/action/skip mismatch fails;
11. cFp83 closure and source reconstruction mismatch fail;
12. cFp80 path/hash mismatch fails;
13. duplicate/missing cFp80 root resolution fails;
14. fingerprint/identity mismatch fails;
15. selected root observed zero times yields `root_reobservation_failed`;
16. selected root observed twice yields `root_reobservation_failed`;
17. materialization failure accounts for every expected pair;
18. each action receives an independent cloned starting state;
19. command conversion/rejection/exception failures block readiness;
20. pair accounting rejects missing, duplicate, and unaccounted pairs;
21. all readiness statuses obey precedence;
22. output reconstructs every cFp83 source action exactly once;
23. output row order exactly matches cFp83 despite different observation order;
24. sample sensitivity does not affect formula or ordering;
25. size limits apply to the correct artifact classes and bundle;
26. artifact hash keys exactly match filenames;
27. all eight artifacts parse and are deterministic; and
28. unsafe injected payloads are rejected while a complete safe bundle passes.

Use dependency injection for execution failures. Focused tests must not run the
full robust benchmark.

The required focused command must discover cFp84 tests, not just AI Lab:

    npm test -- --run tests/game/benchmarkSearchConsumerBoundedActionSignalV0.test.ts tests/game/benchmarkSearchConsumerBoundedActionSignalV0Artifacts.test.ts tests/components/gwent/authenticAiLabViewModel.test.ts

The final output must report test files and counts.

## Regenerated Artifacts

The artifacts committed in `92b6d07` are provisional and must be regenerated
after all repair gates pass.

Before regeneration:

- ensure cFp61-cFp83 directories have no diff against `origin/dev`;
- run focused tests, typecheck, and lint; and
- stop if any fail.

Then:

1. generate current once;
2. record elapsed time and estimate robust duration;
3. follow the local 15-minute contract;
4. generate robust twice or use the completed user-owned long-run evidence;
5. require all eight robust hashes to match; and
6. run artifact reconstruction and safety scans over the regenerated files.

Do not preserve old cFp84 hashes or counts merely to match the first candidate.
Report any changed count, signal range, or sensitivity result plainly.

## Documentation Repair

Update:

    audit/reports/2026-08-18-cFp84-report.md
    docs/research/literature/ai/decisions/2026-08-18-cfp84-bounded-action-evaluation-signal.md
    docs/PROJECT_STATE.md
    docs/research/literature/ai/benchmark-harness.md
    docs/research/literature/ai/policies/legal-heuristic-v1.md
    docs/overhaul-plan/ai-ml-roadmap.md
    src/game/ai/productPolicies.ts
    tests/components/gwent/authenticAiLabViewModel.test.ts

The report must explicitly disclose:

- Repair 1 blockers;
- the prior implementation's missing tests and lint failure;
- files changed;
- behavior changed;
- source checks with values;
- re-observation counts;
- expected/completed/failed/duplicate/unaccounted pairs;
- formula and reconstruction checks;
- signal range and sensitivity counts;
- all artifact byte sizes;
- all robust repeat hashes;
- exact-token and catalog-derived scan results;
- every required check with actual result;
- acceptance criteria status;
- deviations;
- risks/follow-ups;
- Project State Update; and
- the final recommendation.

Do not retain `Completed implementation phase: cFp84` or recommend cFp85 until
the repaired evidence is clean. After repair, completion wording must describe
the typed gates and actual regenerated evidence.

## Local Execution Contract

Read `docs/compute/experiment-status-ledger.md`. Current execution is local.

Run current first. If robust is estimated above 15 minutes, do not start it in
the coding session. Ensure this reusable profile exists:

    npm run benchmark:long -- --profile cfp84-bounded-signal-robust

Return the command and durable `.local/benchmark-runs/` result path to the
user. Resume only after the user reports completion. Do not use archived
H100/Slurm instructions.

## Required Checks

Run all of these after repair:

    npm run benchmark:search-consumer-bounded-signal:v1-starter-matrix
    npm run benchmark:search-consumer-bounded-signal:v1-robust
    npm run benchmark:search-consumer-bounded-signal:v1-robust
    npm test -- --run tests/game/benchmarkSearchConsumerBoundedActionSignalV0.test.ts tests/game/benchmarkSearchConsumerBoundedActionSignalV0Artifacts.test.ts tests/components/gwent/authenticAiLabViewModel.test.ts
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

If robust is user-owned under the 15-minute contract, substitute the completed
long-run evidence and rerun cheap deterministic artifact/hash validation as
described in the original spec.

## Acceptance Criteria

- No `any` or unsafe untyped execution path remains in cFp84.
- Focused cFp84 execution and artifact tests exist and pass.
- Lint has zero cFp84 errors.
- All source consistency requirements are explicit and pass.
- Exact action matching requires one key and one legal move per sample.
- Every selected root is observed exactly once.
- Pair denominators are complete and reconstructible.
- Readiness status follows the required precedence.
- Output reconstructs every cFp83 root/action/skip exactly once and in source
  order.
- Artifact size limits are enforced before write.
- No per-sample or hidden payload is serialized.
- Current and robust artifacts are regenerated from repaired code.
- Robust repeat hashes match for all eight artifacts.
- Direct exact-token and catalog-derived identity scans pass.
- cFp61-cFp83 artifacts remain unchanged.
- AI Lab and project state describe actual repaired evidence.
- No ranking, recommendation, selection, rollout, policy, engine, sampler,
  deck, catalog, rating, UI, or gameplay behavior is added.

## Copy-Ready Prompt For Repair Coder

You are in `/Users/viethungpham/Documents/GitHub/gwent-learning-project`.

Continue on the existing implementation branch:

    git checkout codex/cFp84-bounded-action-evaluation-signal-v0
    git pull --ff-only origin codex/cFp84-bounded-action-evaluation-signal-v0
    git status --short

Read in this order:

1. `AGENTS.md`
2. `docs/PROJECT_STATE.md`
3. `docs/compute/experiment-status-ledger.md`
4. `docs/spec/2026-08-18-cFp84-specs.md`
5. `docs/spec/2026-08-19-cFp84-repair-specs.md`
6. `audit/reports/2026-08-18-cFp84-report.md`
7. `audit/reports/2026-08-18-cFp83-report.md`

The repair spec is the active task. Do not treat the original cFp84 candidate,
its generated artifacts, its report, or its project-state completion claim as
accepted evidence.

Refactor the compressed runner into typed, testable modules. Implement every
source, matching, re-observation, pair-accounting, readiness, reconstruction,
ordering, size, and safety gate in the repair spec. Create both missing cFp84
test files before regenerating artifacts. Do not silence lint with broad
eslint disables or replace `any` with unsafe casts.

Run current first and follow the local 15-minute handoff rule for robust. When
all required checks and evidence pass, commit and push to this same branch.
Report the repair commit, files changed, focused/full test counts, source and
reconstruction results, root observation counts, pair counts, failure counts,
signal range, sensitivity counts, artifact sizes, robust hashes, safety scans,
checks, deviations, and recommendation. Do not claim cFp85 readiness until the
repair has been independently reviewed.
