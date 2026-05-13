# 2026-05-13 cFp27 Repair Specs - Mulligan Diagnostics Review Fixes

## Branch Directive

This is a repair spec for the existing cFp27 implementation branch. Do **not** start a new feature branch unless the existing branch is unavailable.

- Start from the pushed implementation branch:
  - `codex/cFp27-v1-mulligan-diagnostics`
- Do not commit directly to `dev`.
- Do not merge this branch.
- Commit your repair and push the same branch when complete.

Recommended startup commands:

```bash
git fetch origin
git switch -C codex/cFp27-v1-mulligan-diagnostics origin/codex/cFp27-v1-mulligan-diagnostics
git status --short --branch
```

The worktree must be clean before editing.

## Read First

1. `AGENTS.md`
2. `docs/PROJECT_STATE.md`
3. `docs/spec/2026-05-13-cFp27-specs.md`
4. `audit/reports/2026-05-13-cFp27-report.md`
5. `docs/research/literature/ai/policies/legal-heuristic-v1.md`
6. Relevant code/tests:
   - `src/components/gwent/matchDiagnostics.ts`
   - `src/game/ai/legalHeuristicPolicyV1.ts`
   - `src/game/ai/decisionTrace.ts`
   - `src/game/ai/explainLegalHeuristicV1Decision.ts`
   - `tests/game/productDiagnostics.test.ts`
   - `tests/game/engineAiPolicy.test.ts`

## Review Context

The cFp27 implementation is close, but review found three issues that must be fixed before merge:

1. **P1 hidden-info scanner gap.** The report and tests claim product diagnostics reject cFp27 mulligan leaks such as `Roach`, `neutral.roach`, `cardIds`, `linkedSourceIds`, and raw `mulligan:` move IDs. The scanner does not actually reject most of those tokens. The current synthetic hazard test passes only because the unsafe string also contains `seat_b:`, which was already rejected before cFp27.
2. **P2 hero linked-target regression.** The new ranker skips every hero before linked-payload checks. Pre-cFp27 behavior allowed a hero to be redrawn if it was an explicit linked summoned target. That behavior must be preserved.
3. **P2 report gaps.** The report does not record repeated benchmark hashes as required by `docs/spec/2026-05-13-cFp27-specs.md`, and it contains a small Roach strength typo.

This repair must stay narrow. Do not rework cFp27’s general mulligan strategy.

## Goal

Repair cFp27 so it is merge-ready:

- cFp27-specific mulligan diagnostic leak tokens are actually caught by product diagnostics.
- Existing hero linked-payload behavior is preserved.
- Tests prove each repaired condition independently.
- The phase report accurately records checks and benchmark hashes.

## Non-Goals / Out Of Scope

Do not:

- Change engine rules, legal moves, scoring, commands, prompts, round resolution, catalog data, deck presets, UI routes, or product layout.
- Add new AI policy behavior beyond the hero linked-target preservation fix.
- Tune pass/play/leader/prompt scoring.
- Change benchmark suite definitions.
- Add ML/search/rating logic.
- Expose hidden AI hand card names, source IDs, instance IDs, raw move IDs, raw `cardIds`, or raw `linkedSourceIds`.
- Weaken existing hidden-info scans.
- Merge to `dev`.

## Required Repair 1 - Hidden-Info Scanner

Update `src/components/gwent/matchDiagnostics.ts`.

### Required Behavior

The product diagnostic hidden-info scan must reject these cFp27 mulligan leak hazards:

- string value containing `Roach` inside a mulligan decision trace;
- string value containing `neutral.roach` inside a mulligan decision trace;
- object key `cardIds` anywhere in the exported diagnostics object;
- object key `linkedSourceIds` anywhere in the exported diagnostics object;
- string value containing raw mulligan move-id prefix `mulligan:` anywhere in the exported diagnostics object, even when it does **not** contain `seat_a:` or `seat_b:`.

### Important Scope Note

Do **not** blindly reject the string `Roach` everywhere if doing so breaks legitimate public information outside mulligan traces. Public board target labels can contain visible card names. The safest implementation is:

- keep existing global recursive scanner behavior;
- add global forbidden-key checks for `cardIds` and `linkedSourceIds`;
- add global string check for `mulligan:`;
- add a mulligan-trace-specific recursive string check for `Roach` and `neutral.roach` under traces where `trace.phase === "mulligan"` or `trace.mulliganAnalysis !== null`.

If you choose a different implementation, preserve the same behavior:

- unsafe hidden-hand mulligan identity leaks fail;
- public non-mulligan target labels are not unnecessarily broken.

### Suggested Shape

One acceptable approach:

```ts
const GLOBAL_FORBIDDEN_KEYS = new Set([
  // existing key tokens plus:
  "cardIds",
  "linkedSourceIds",
]);

const GLOBAL_FORBIDDEN_STRING_TOKENS = [
  // existing string tokens plus:
  "mulligan:",
];

const MULLIGAN_TRACE_FORBIDDEN_STRING_TOKENS = [
  "Roach",
  "neutral.roach",
];
```

Then in `buildProductDiagnosticExport(...)`, after building the candidate export object, scan:

1. full export with global scan;
2. each mulligan trace with the mulligan-specific token scan.

Return all issues in `hiddenInfoSafetyScan.issues`.

Keep issue messages actionable and path-specific.

## Required Repair 2 - Product Diagnostic Tests

Update `tests/game/productDiagnostics.test.ts`.

Replace or split the current broad synthetic hazard test. It currently fails only because the test string includes `seat_b:`.

Add focused tests proving each hazard independently fails:

1. `reason: "redraw Roach"` in a mulligan trace fails.
2. `reason: "redraw neutral.roach"` in a mulligan trace fails.
3. A synthetic export object containing key `cardIds` fails.
4. A synthetic export object containing key `linkedSourceIds` fails.
5. `reason: "mulligan:test"` or `reason: "mulligan:hidden-card"` fails even without `seat_a:` / `seat_b:`.

Also add one positive guard test:

- A non-mulligan playing trace with public target label `"Roach"` should not fail solely because of the public card name, as long as no raw ids/forbidden keys are present.

Keep existing positive tests:

- redacted mulligan export passes;
- `mulliganAnalysis` is preserved.

## Required Repair 3 - Preserve Hero Linked-Target Redraw

Update `src/game/ai/legalHeuristicPolicyV1.ts`.

The current implementation skips all heroes before linked payload detection. That violates the original cFp27 spec and pre-cFp27 behavior.

Required behavior:

- Standalone heroes are kept.
- Heroes are not redrawn by the new `low_standalone_unit` rule.
- A hero that is an explicit one-way linked summoned target remains eligible for the linked payload redraw class.

Implementation guidance:

Compute `linkedCallers`, `roachCaller`, `oneWayCaller`, and `sameSourceMuster` before hero/special skip gates. Then use logic equivalent to:

```ts
if (card.kind === "hero" && !oneWayCaller && !roachCaller) {
  continue;
}

if (card.kind === "special") {
  continue;
}
```

Then apply the existing priority classes:

1. `linked_roach_payload`
2. `one_way_linked_payload`
3. `same_source_muster_duplicate`
4. `low_standalone_unit`

`low_standalone_unit` must still require `card.kind === "unit"`, so it can never apply to a hero.

## Required Repair 4 - Engine AI Policy Tests

Update `tests/game/engineAiPolicy.test.ts`.

Add these regression tests:

### Hero Linked Payload

Use synthetic cards:

```ts
const caller = testCard({
  cardId: "caller",
  sourceId: "test.caller",
  printedStrength: 5,
  abilities: ["muster"],
  linkedSourceIds: ["test.hero-payload"],
});

const heroPayload = testCard({
  cardId: "hero-payload",
  sourceId: "test.hero-payload",
  printedStrength: 10,
  kind: "hero",
});
```

Legal moves:

- keep mulligan;
- redraw caller;
- redraw hero payload.

Expected:

- selected move is `choose_mulligan`;
- selected `cardIds` is `["hero-payload"]`;
- caller is not selected.

### Standalone Hero Still Kept

Use a low-strength standalone hero:

```ts
const hero = testCard({
  cardId: "hero",
  sourceId: "test.hero",
  printedStrength: 2,
  kind: "hero",
});
```

Legal moves:

- keep mulligan;
- redraw hero.

Expected:

- selected `cardIds` is `[]`.

If a standalone hero test already exists, keep it and add only the linked-payload regression.

## Required Repair 5 - Report And Docs

Update `audit/reports/2026-05-13-cFp27-report.md`.

Add a section named:

```md
## Repair Review Fixes
```

It must include:

- hidden-info scanner repair summary;
- hero linked-payload preservation summary;
- tests/checks rerun;
- any benchmark commands rerun;
- repeated benchmark hashes.

Correct these report issues:

- Roach is strength `3`, not strength `2`.
- Do not say `npm test` failed if it passes on your final run. If you run in an environment where one test fails due to local spawn/platform behavior, state that precisely and include the passing focused suite.

### Benchmark Hash Requirement

The original cFp27 spec requires repeated starter-matrix hashes. Record them explicitly.

If you rerun artifacts, run:

```bash
npm run benchmark:v1-smoke
npm run benchmark:v1-starter-matrix
npm run benchmark:v1-starter-matrix
```

Then record the relevant deterministic artifact hash values. Use the project’s artifact manifest if available. If no manifest hash is present, compute:

```bash
shasum -a 256 docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest/records.jsonl
shasum -a 256 docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest/summary.json
shasum -a 256 docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/latest/report.md
```

Record before/after repeated-run hashes, or state that the repeated run produced identical hashes with the exact hash strings.

Update `docs/research/literature/ai/policies/legal-heuristic-v1.md` only if the repair changes documented behavior. It probably does not need a large rewrite.

Update `docs/PROJECT_STATE.md` if needed to mention the cFp27 repair status. Since this is still the same cFp27 implementation branch, a short note is enough.

## Required Checks

Run:

```bash
npm test -- --run tests/game/engineAiPolicy.test.ts tests/game/productDiagnostics.test.ts tests/game/benchmarkTrace.test.ts tests/game/benchmarkArtifacts.test.ts
npm test
npm run typecheck
npm run lint
npm run build
npm run check:forbidden-imports
npm run check:project-state -- --base origin/dev
git diff --check
```

If you changed benchmark artifacts or report benchmark hashes, also run:

```bash
npm run benchmark:v1-smoke
npm run benchmark:v1-starter-matrix
npm run benchmark:v1-starter-matrix
```

`npm run ci:browser` is not required unless you change UI/routes/browser behavior. This repair should not.

## Acceptance Criteria

- [ ] Product diagnostic scan fails for `Roach` in mulligan trace reason.
- [ ] Product diagnostic scan fails for `neutral.roach` in mulligan trace reason.
- [ ] Product diagnostic scan fails for key `cardIds`.
- [ ] Product diagnostic scan fails for key `linkedSourceIds`.
- [ ] Product diagnostic scan fails for string `mulligan:` without relying on `seat_a:` / `seat_b:`.
- [ ] Redacted cFp27 mulligan diagnostics still pass hidden-info scan.
- [ ] Public non-mulligan target label `"Roach"` does not fail solely because it is public.
- [ ] Hero linked payloads can still be redrawn.
- [ ] Standalone heroes are still kept.
- [ ] cFp27 selected-move parity remains intact for focused fixtures.
- [ ] Report contains exact repeated benchmark hashes.
- [ ] Required checks pass or any local-only failure is precisely documented.

## Reporting Directive

Do not create a new cFp27.1 report unless explicitly requested. Update the existing cFp27 report:

```text
audit/reports/2026-05-13-cFp27-report.md
```

Add the `Repair Review Fixes` section and update acceptance/checks as appropriate.

When complete, commit and push:

```bash
git status --short --branch
git add src/components/gwent/matchDiagnostics.ts src/game/ai/legalHeuristicPolicyV1.ts tests/game/productDiagnostics.test.ts tests/game/engineAiPolicy.test.ts audit/reports/2026-05-13-cFp27-report.md docs/research/literature/ai/policies/legal-heuristic-v1.md docs/PROJECT_STATE.md
git commit -m "cFp27 repair: harden mulligan diagnostics and preserve hero linked payloads"
git push origin codex/cFp27-v1-mulligan-diagnostics
```

Only stage files that actually changed. Do not stage `.claude/`, `*.tsbuildinfo`, `dist/`, or unrelated files.

