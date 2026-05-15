# cFp31 Repair Specs - Round-Investment Review Fixes

## Status

- Type: repair spec for an existing implementation branch
- Parent implementation spec: `docs/spec/2026-05-14-cFp31-specs.md`
- Target branch: `codex/cFp31-v1-round-investment`
- Required report to update: `audit/reports/2026-05-14-cFp31-report.md`
- Do not start from the older cFp31 implementation spec as the active task. Use this repair spec as the active task.

## Branch Directive For The Coding Agent

Run these commands first:

```bash
git fetch origin
git switch codex/cFp31-v1-round-investment
git pull --ff-only origin codex/cFp31-v1-round-investment
git status --short
```

Expected branch:

```text
codex/cFp31-v1-round-investment
```

Expected active repair spec:

```text
docs/spec/2026-05-14-cFp31-repair-specs.md
```

If this file is missing, stop and report that the repair spec is not present on the branch. Do not fall back to `docs/spec/2026-05-14-cFp31-specs.md` as the active task.

Preserve existing user and review changes. Do not revert `AGENTS.md`, generated benchmark artifacts, documentation, reports, or implementation files unless this spec explicitly says to edit them.

## Problem Summary

The first cFp31 implementation has the right broad direction, but review found blockers:

1. `explainLegalHeuristicV1Decision(...)` can report the wrong cFp31 reason because it builds `roundInvestmentAnalysis` with `selectedMove = null` when the selected move is `pass`. The policy chose that pass by evaluating the best useful candidate, so the explanation must analyze the same candidate.
2. The required cFp31 tests are missing from `tests/game/engineAiPolicy.test.ts` and `tests/game/productDiagnostics.test.ts`.
3. `scanRoundInvestmentAnalysis(...)` does not reject obvious card names inside `roundInvestmentAnalysis`.
4. Spy hand-count estimation overestimates when the deck has fewer than two cards.
5. Extra threshold gates were added that are not in the original cFp31 spec and may preserve the exact overcommit bug for two-card hands.
6. `selectedMoveWouldLeaveNoPositiveUnitMove` can be wrong for agile or multi-target cards because it counts positive unit move options instead of unique source card instances.

Do not merge cFp31 until these issues are repaired and tested.

## Scope

Allowed files:

- `src/game/ai/legalHeuristicPolicyV1.ts`
- `src/game/ai/explainLegalHeuristicV1Decision.ts`
- `src/game/ai/decisionTrace.ts` only if a type needs to be adjusted
- `src/components/gwent/matchDiagnostics.ts`
- `tests/game/engineAiPolicy.test.ts`
- `tests/game/productDiagnostics.test.ts`
- `tests/components/gwent/authenticAiLabViewModel.test.ts` only if metadata assertions need small updates
- `docs/research/literature/ai/policies/legal-heuristic-v1.md`
- `docs/PROJECT_STATE.md`
- `audit/reports/2026-05-14-cFp31-report.md`

Out of scope:

- Do not change engine rules, legal move generation, command execution, prompts, scoring, catalog data, deck presets, UI routes, or product match UI.
- Do not change `legal-heuristic-v0`.
- Do not introduce search, rollout, ML, ratings, Python tooling, or new benchmark suites.
- Do not rewrite the whole v1 policy.
- Do not add hidden hand card identities, source IDs, instance IDs, ability arrays, or raw move IDs to product diagnostics.

## Required Code Repairs

### 1. Make Round-Investment Explanation Use The Same Candidate As The Policy

Current bug:

- `choosePlayingMove(features)` calls `bestUsefulMove(features)`, then `shouldPassForRoundInvestment(features, useful)`.
- If that returns true, the selected move is `pass`.
- `explainLegalHeuristicV1Decision(...)` sees the selected move is `pass`, passes `null` into `buildLegalHeuristicV1RoundInvestmentAnalysis(...)`, and can produce `recommendation: "continue"` or the wrong reason.

Required fix:

Create one shared helper in `src/game/ai/legalHeuristicPolicyV1.ts` that both the policy and explanation can use.

Recommended shape:

```ts
export interface LegalHeuristicV1RoundInvestmentDecision {
  readonly candidate: PlayCardMove | UseLeaderMove | null;
  readonly analysis: AiDecisionRoundInvestmentAnalysis | null;
  readonly shouldPass: boolean;
}

export const buildLegalHeuristicV1RoundInvestmentDecision = (
  features: LegalHeuristicV1Features,
): LegalHeuristicV1RoundInvestmentDecision => {
  const candidate = bestUsefulMove(features);
  if (!candidate) {
    return { candidate: null, analysis: null, shouldPass: false };
  }
  const handShape = buildLegalHeuristicV1HandShapeAnalysis(features);
  const analysis = buildLegalHeuristicV1RoundInvestmentAnalysis(features, candidate, handShape);
  return {
    candidate,
    analysis,
    shouldPass: shouldPassForRoundInvestment(features, candidate),
  };
};
```

You may choose a different name, but it must satisfy these requirements:

- `choosePlayingMove(features)` uses this helper for the cFp31 pass gate instead of recomputing a separate candidate.
- `explainLegalHeuristicV1Decision(...)` uses this helper when selected move is `pass`.
- If `move.kind === "pass"` and the shared helper says `shouldPass === true`, then:
  - `trace.roundInvestmentAnalysis` must be the helper's candidate analysis;
  - `trace.reasonKind` must be `"policy-round-investment"`;
  - reason text must be exactly one of:
    - `"preserve future hand — pass"`
    - `"sacrifice round — preserve cards"`.
- If a non-pass move is selected, do not use `reasonKind: "policy-round-investment"`.

Do not duplicate the policy decision in the explanation module.

### 2. Fix Spy Estimated Hand Count

Current logic can overestimate when the AI deck has fewer than two cards.

Required formula:

```ts
if (selectedMove?.kind === "play_card") {
  estimatedHandCountAfterSelectedMove = currentRoundHandCount - 1;
  if (isSpyCard(features.ownHandByCardId.get(selectedMove.sourceCardId))) {
    estimatedHandCountAfterSelectedMove += Math.min(2, features.ownDeckCount);
  }
}
```

Do not reveal the drawn card identities. This is only a count estimate.

### 3. Count Future Positive Unit/hero Cards By Source Card Instance

Current logic counts positive unit move options. Agile cards or cards with multiple legal rows can create multiple positive move options from the same card instance, which can make `selectedMoveWouldLeaveNoPositiveUnitMove` false when playing that one card actually leaves no future unit/hero card.

Required behavior:

- Build a set of positive unit/hero source card IDs from legal `play_card` moves:
  - card kind is `unit` or `hero`;
  - `scoreMove(features, move) > 0`;
  - key by `move.sourceCardId`, not by source ID and not by move ID.
- `positiveFutureUnitMoveCount` should reflect unique positive unit/hero source card instances, not row-option count.
- If selected move is a positive unit/hero play:
  - `selectedMoveWouldLeaveNoPositiveUnitMove` should be true when removing that selected `sourceCardId` leaves zero positive unit/hero source card IDs.
- If selected move is not a unit/hero play:
  - `selectedMoveWouldLeaveNoPositiveUnitMove` should be true only when there are currently zero positive unit/hero source card IDs.

This must preserve cFp30 weather-adjusted scoring because the positive move test still uses `scoreMove(features, move)`.

### 4. Align Thresholds With The Original cFp31 Spec

The first implementation added two extra gates:

- `features.ownHandCount > 2` for critical-risk blocking.
- `analysis.estimatedHandCountAfterSelectedMove >= 2` for ahead/near-even preservation.

These are not in the original cFp31 spec and can keep the AI overcommitting with two-card hands.

Required behavior:

- Keep the single-card exception:
  - if `features.ownHandCount <= 1`, `shouldPassForRoundInvestment(...)` returns false.
- Remove the `features.ownHandCount > 2` requirement from the critical-risk branch.
- Remove the `estimatedHandCountAfterSelectedMove >= 2` requirement from the ahead/near-even preservation branch.
- Preserve card-advantage exceptions: Spy/card-advantage selected move should not be blocked.
- Preserve match-winning exception: if opponent is on last gem and the candidate reaches `minimumScoreToWinRound(features)`, play it.

Behind/sacrifice behavior must match the original spec:

- If `features.scoreDelta < 0`, `ownGems > 1`, and no single-move catch-up exists, the AI may pass to sacrifice the round when the analysis shows high/critical future-hand risk, no unit/hero tempo card would remain, or future hand quality is not healthy.
- If the candidate creates critical future-hand risk, the AI may sacrifice even if the score is already behind.
- Last-gem behavior still wins over all cFp31 preservation logic.

### 5. Strengthen `scanRoundInvestmentAnalysis(...)`

`roundInvestmentAnalysis` may contain only:

- booleans;
- numbers;
- safe lowercase enum strings:
  - `"none"`, `"watch"`, `"high"`, `"critical"`;
  - `"preserve_future_hand"`, `"sacrifice_round"`, `"fight_last_gem"`, `"continue"`;
  - `"empty"`, `"poor"`, `"thin"`, `"healthy"`.

Required scanner behavior inside `roundInvestmentAnalysis`:

- Reject raw source IDs:
  - examples: `neutral.yennefer-of-vengerberg`, `northern-realms.philippa-eilhart`.
- Reject raw instance IDs:
  - examples: `seat_a:001:foo`, `seat_b:003:bar`.
- Reject obvious card-name-like strings:
  - examples: `Draug`, `Yennefer of Vengerberg`, `Gaunter O'Dimm: Darkness`, `Emhyr var Emreis`.
- Reject arrays of any kind inside `roundInvestmentAnalysis`, including ability arrays.
- Allow safe enum strings listed above.

Use targeted scanning only. Do not globally reject public names elsewhere in the diagnostic export.

## Required Tests

### `tests/game/engineAiPolicy.test.ts`

Add a focused `describe("legal-heuristic-v1 cFp31 round investment repair", ...)` block or use the local test organization if there is an existing cFp31 block.

Required cases:

1. **Near-even preservation pass**
   - Non-elimination round (`ownGems > 1`).
   - Opponent has not passed.
   - Pass is legal.
   - AI is ahead or no more than 10 points behind.
   - Best useful move is positive but spending it would leave no positive unit/hero future source card.
   - Expected policy move: `pass`.
   - Expected explanation:
     - selected move equals policy move;
     - `reasonKind === "policy-round-investment"`;
     - reason is `"preserve future hand — pass"`;
     - `roundInvestmentAnalysis.recommendation === "preserve_future_hand"`.

2. **Two-card hand preservation**
   - AI has exactly two cards.
   - The best useful unit/hero move would leave only non-unit/non-hero or no useful future cards.
   - Non-elimination round, opponent active, pass legal.
   - Expected: pass because the extra `ownHandCount > 2` gate must be gone.

3. **Sacrifice non-elimination round**
   - AI is behind.
   - Non-elimination round.
   - Opponent active.
   - No single-move catch-up exists.
   - Continuing creates high or critical future-hand risk.
   - Expected: pass.
   - Expected explanation reason:
     - `reasonKind === "policy-round-investment"`;
     - reason is `"sacrifice round — preserve cards"`;
     - recommendation is `"sacrifice_round"`.

4. **Last gem still fights**
   - Same poor future-hand shape as a preservation case.
   - `ownGems <= 1`.
   - A useful or catch-up move exists and upper-bound is not impossible.
   - Expected: do not pass because of cFp31 preservation.

5. **Spy/card-advantage exception**
   - Low hand count and future-hand risk exists.
   - Best useful move is a Spy.
   - Expected: selected move is the Spy, not pass.
   - Add a deck-count edge case where `ownDeckCount` is 0 or 1 and assert `estimatedHandCountAfterSelectedMove` uses `current - 1 + min(2, ownDeckCount)`.

6. **Agile/multi-row source-card de-duplication**
   - One agile unit/hero creates multiple legal positive row moves.
   - It is the only positive unit/hero source card.
   - Expected `selectedMoveWouldLeaveNoPositiveUnitMove === true`.
   - Expected pass if other preservation conditions hold.

7. **Healthy hand unchanged**
   - A cFp30-style useful placement with healthy future hand remains non-pass.
   - This protects against over-passing.

8. **Weather-aware placement preserved**
   - Use or keep an existing cFp30 weathered-row fixture.
   - Assert the selected move still avoids a bad weathered row when a better legal row exists.

9. **Medic timing preserved**
   - Use or keep cFp29 fixtures:
     - no-target Medic should not be selected;
     - strong revive target remains valuable.

10. **Trace parity**
    - For one new pass case and one non-pass case:
      - `explainLegalHeuristicV1Decision(input).move` must equal `legalHeuristicPolicyV1.selectMove(input)`.

Do not add brittle tests that depend on hidden hand card names in exported diagnostics. Engine-policy tests may construct fixtures with card identities, but diagnostic exports must remain safe.

### `tests/game/productDiagnostics.test.ts`

Add focused tests for `scanRoundInvestmentAnalysis(...)` and/or `buildProductDiagnosticExport(...)`.

Required cases:

1. Safe `roundInvestmentAnalysis` passes.
2. Raw source ID fails:
   - include at least `neutral.yennefer-of-vengerberg`.
3. Hyphenated namespace source ID fails:
   - include `northern-realms.philippa-eilhart`.
4. Raw instance ID fails:
   - include `seat_b:001:hidden`.
5. Obvious one-word card name fails:
   - include `Draug`.
6. Obvious multi-word card name fails:
   - include `Yennefer of Vengerberg`.
7. Ability array fails:
   - include `["spy", "medic"]`.
8. Safe enum strings pass:
   - include all safe risk/recommendation/hand-quality strings used by cFp31.

### `tests/components/gwent/authenticAiLabViewModel.test.ts`

Keep the current cFp31 metadata tests passing. Only edit if your policy metadata changes.

## Documentation And Report

Update:

- `docs/research/literature/ai/policies/legal-heuristic-v1.md`
- `docs/PROJECT_STATE.md`
- `audit/reports/2026-05-14-cFp31-report.md`

Report requirements:

- Append a `Repair 1 - Review Fixes` section.
- List the original review blockers and how each was resolved.
- Include exact tests/checks run.
- Correct any acceptance criteria that were previously marked complete but were not actually covered by tests.
- If benchmark artifacts are still not refreshed, keep that deviation explicit and do not claim refreshed hashes.
- Include a `Project State Update` subsection.

Project state requirements:

- Mark cFp31 repair as the active/latest repair state on this branch.
- Do not claim cFp31 is ready to merge unless all required tests and checks pass.

## Required Checks

Run at minimum:

```bash
npm test -- --run tests/game/engineAiPolicy.test.ts tests/game/productDiagnostics.test.ts tests/components/gwent/authenticAiLabViewModel.test.ts
npm test
npm run typecheck
npm run lint
npm run build
npm run check:forbidden-imports
npm run check:project-state -- --base origin/dev
git diff --check
```

If on Windows and `npm test` has the known `tsx`/spawn issue for benchmark artifact tests, run the focused tests first and report the full-suite deviation exactly. Do not hide the deviation.

Do not run `npm run ci` unless the worktree is staged/clean and you intend to satisfy `check:worktree-clean`.

## Completion Directive

When done:

1. Commit all repair changes on `codex/cFp31-v1-round-investment`.
2. Use a message like:

```text
cFp31 repair: align round-investment policy, trace, and diagnostics
```

3. Push:

```bash
git push origin codex/cFp31-v1-round-investment
```

4. Final response must include:
   - commit SHA;
   - pushed branch;
   - files changed;
   - tests/checks run;
   - any deviations.
