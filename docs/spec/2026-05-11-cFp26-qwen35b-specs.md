# 2026-05-11 cFp26 Specs - Legal-Heuristic-v1 Tie-Aware Pass Diagnostics Repair

## Branch Directive

- Start from an up-to-date `dev`.
- Create and work only on this branch:
  - `codex/cFp26-v1-tie-aware-pass-qwen35b-a3b`
- Do not commit directly to `dev`.
- Do not merge this branch.
- Push this branch when complete.

## Read First

1. `AGENTS.md`
2. `docs/PROJECT_STATE.md`
3. `docs/spec/2026-05-11-cFp25-specs.md`
4. `audit/reports/2026-05-11-cFp25-report.md`
5. `docs/research/literature/ai/policies/legal-heuristic-v1.md`
6. `docs/gwent-rules.md` sections on faction abilities, Nilfgaard tie wins, and round resolution
7. Relevant code:
   - `src/game/ai/legalHeuristicPolicyV1.ts`
   - `src/game/ai/explainLegalHeuristicV1Decision.ts`
   - `src/game/ai/decisionTrace.ts`
   - `src/game/ai/seatObservation.ts`
   - `src/game/ai/types.ts`
   - `src/components/gwent/matchDiagnostics.ts`
   - `src/components/gwent/AuthenticMatchScreen.tsx`
   - `src/game/core/commands.ts` round-result logic around Nilfgaard tie wins

Run before edits:

```bash
git status --short --branch
```

The worktree must be clean before starting.

## Context

cFp25 added product AI decision diagnostics. A playtest export from `legal-heuristic-v1` exposed two follow-up issues:

1. `legal-heuristic-v1` treats a reachable tied score as insufficient when deciding whether catch-up is impossible.
2. That is wrong for Nilfgaard when exactly one player is Nilfgaard, because Nilfgaard wins tied rounds.
3. The diagnostic reason text can say "catch-up move" even when the selected move is actually `pass`.
4. Product diagnostics currently export `aiDeckFaction: null` even when the AI preset is known to be Nilfgaard.

This phase is a small repair to v1 policy/diagnostics. It is not a broader tuning phase.

## Goal

Make `legal-heuristic-v1` and its diagnostics tie-aware for Nilfgaard round resolution, keep the diagnostic reason text consistent with the selected move, and populate AI deck faction metadata in product diagnostic exports.

## Out Of Scope

Do not:

- Redesign `legal-heuristic-v1`.
- Change engine round-resolution rules.
- Change legal move generation.
- Change scoring rules.
- Change card/deck catalog data.
- Change benchmark suite definitions.
- Add ML/search/rating logic.
- Add new UI panels or product flows.
- Expose hidden AI hand/deck identities.
- Export raw `cardsById`, `finalState`, `commandLog`, raw `seat_a:` / `seat_b:` ids, `ownHand`, or `opponentHand`.

## Required Fix 1 - Tie-Aware Catch-Up And Last-Gem Pass Safety

### Existing Rule To Match

The engine round result logic in `src/game/core/commands.ts` treats tied scores as:

- If exactly one seat is Nilfgaard, that Nilfgaard seat wins the tied round.
- If neither seat is Nilfgaard, the round is a draw.
- If both seats are Nilfgaard, the round is a draw.

The v1 policy should use the same public round-win threshold when deciding whether it can still catch up.

### Implementation Requirements

1. Add public faction awareness to AI policy input in a hidden-info-safe way.

   Preferred approach:

   - Add `ownFaction` and `opponentFaction` to `SeatObservation`.
   - Populate them from `state.seats[seatId].faction` and `state.seats[opponentSeatId].faction` in `buildSeatObservation`.
   - This is public information and safe to expose.
   - Update any tests/types/export schemas that need the new required fields.

   Acceptable alternative:

   - If you choose not to change `SeatObservation`, implement a well-named helper that infers Nilfgaard tie-win safely from already-public leader/faction data.
   - Document why this is preferable.

2. Add a small helper in or near `legalHeuristicPolicyV1.ts`, for example:

   ```ts
   const ownWinsTiedRound = (features: LegalHeuristicV1Features) =>
     features.input.observation.ownFaction === "nilfgaard" &&
     features.input.observation.opponentFaction !== "nilfgaard";

   const minimumScoreToWinRound = (features: LegalHeuristicV1Features) =>
     ownWinsTiedRound(features)
       ? features.opponentScore
       : features.opponentScore + 1;
   ```

   Naming can differ, but behavior must match the engine.

3. Update `chooseCatchUpMove`.

   Current behavior effectively checks:

   ```ts
   features.ownScore + candidate.tempo > features.opponentScore
   ```

   Replace this with the tie-aware required score:

   ```ts
   features.ownScore + candidate.tempo >= minimumScoreToWinRound(features)
   ```

   This matters when the opponent has already passed and Nilfgaard only needs to tie.

4. Update last-gem impossible-pass logic.

   Current behavior effectively checks:

   ```ts
   upperBound <= features.opponentScore
   ```

   Replace this with:

   ```ts
   upperBound < minimumScoreToWinRound(features)
   ```

   Behavior examples:

   - Own faction Nilfgaard, opponent not Nilfgaard, ownScore 0, opponentScore 10, upperBound 10: catch-up is possible. Do not pass as impossible.
   - Own faction Northern Realms, opponentScore 10, upperBound 10: catch-up is still impossible under current policy because a tie does not win the round.
   - Own faction Nilfgaard, opponent also Nilfgaard, opponentScore 10, upperBound 10: catch-up is impossible because both Nilfgaard means the engine treats tie as draw.
   - Own faction Nilfgaard, opponentScore 10, upperBound 9: catch-up is impossible.

5. Keep v1 deterministic.

   - Do not introduce randomness.
   - Preserve existing sort tie-breakers.

### Required Tests

Add or update focused tests in `tests/game/engineAiPolicy.test.ts` or a nearby AI policy test file.

Required cases:

1. Nilfgaard last gem can tie:
   - AI/own faction is Nilfgaard.
   - Opponent faction is not Nilfgaard.
   - AI is on last gem.
   - AI is behind by exactly the reachable upper bound.
   - Assert selected move is not `pass` solely due to "catch-up impossible".

2. Non-Nilfgaard last gem cannot tie:
   - AI/own faction is not Nilfgaard.
   - AI is on last gem.
   - AI can only tie, not exceed opponent score.
   - Assert existing impossible/pass behavior remains acceptable.

3. Double-Nilfgaard tie does not win:
   - AI/own faction is Nilfgaard.
   - Opponent faction is Nilfgaard.
   - AI can only tie.
   - Assert tie is not treated as a win.

4. Nilfgaard below tie remains impossible:
   - AI/own faction is Nilfgaard.
   - Opponent is not Nilfgaard.
   - AI upper bound is below opponent score.
   - Assert pass-as-impossible remains allowed.

5. Opponent-passed catch-up threshold:
   - Opponent has passed.
   - AI/own faction is Nilfgaard.
   - A candidate can tie but not exceed opponent score.
   - Assert v1 can choose that catch-up move rather than conceding because strict `>` failed.

## Required Fix 2 - Diagnostic Reason Text Must Match Selected Move

### Problem

The cFp25 diagnostic reason builder can say:

```text
opponent passed, behind - catch-up move (score ...)
```

even when `selected.kind` is `pass`.

That is misleading. The reason text should explain the move actually selected by the policy.

### Implementation Requirements

1. In `src/game/ai/explainLegalHeuristicV1Decision.ts`, do not derive the reason from the top sorted candidate alone.
2. If the selected move is `pass`, the reason must not claim a catch-up move.
3. If the selected move is a catch-up play/leader move, the reason may say catch-up move.
4. If useful, add a small helper that compares the selected move with candidate summaries through safe fields only. Do not use or export raw move IDs.
5. Keep hidden-info redaction intact:
   - AI hand play labels remain `"hidden hand play"`.
   - No card names, source IDs, instance IDs, or raw option IDs leak.

### Required Tests

Add focused diagnostics tests.

Required cases:

1. Opponent passed, AI behind, selected is `pass`:
   - Assert `trace.selected.kind === "pass"`.
   - Assert `trace.reason` does not include `"catch-up move"`.

2. Opponent passed, AI behind, selected is a non-pass catch-up move:
   - Assert `trace.selected.kind !== "pass"`.
   - Assert reason accurately describes a catch-up attempt.

3. Hidden-info safety:
   - Assert `JSON.stringify(trace)` does not contain raw `seat_a:` / `seat_b:` ids, card names for AI hidden hand candidates, `sourceId`, or raw option IDs.

## Required Fix 3 - Product Diagnostic AI Deck Faction Metadata

### Problem

The product diagnostic export currently includes:

```json
"aiDeckFaction": null
```

even when the AI preset is known, for example `current-nilfgaard`.

### Implementation Requirements

1. In `src/components/gwent/AuthenticMatchScreen.tsx`, stop hard-coding `aiDeckFaction: null` for product diagnostic export.
2. Populate `aiDeckFaction` from the configured/resolved AI deck preset.
3. Preserve `null` only when the AI deck faction is genuinely unknown.
4. Do this for both copy and download diagnostic flows.
5. Do not change the export schema version unless a required type shape changes. This is metadata completion, not a schema break.

### Required Tests

Add or update tests in `tests/game/productDiagnostics.test.ts` or relevant component/view-model tests.

Required cases:

1. Product diagnostic export for a Nilfgaard AI preset has:

   ```json
   "aiDeckFaction": "nilfgaard"
   ```

2. Human deck faction remains populated correctly.
3. Hidden-info safety scan still passes.

If this is covered only by Playwright, explain why. Unit coverage is preferred.

## Required Fix 4 - Documentation And Report

Update:

1. `docs/research/literature/ai/policies/legal-heuristic-v1.md`
   - Document that v1 last-gem and opponent-passed catch-up checks are Nilfgaard tie-aware.
   - Mention the exact engine rule: exactly one Nilfgaard wins tied rounds.

2. `docs/PROJECT_STATE.md`
   - Mark cFp26 as the active/latest Cluster F repair.
   - Note that cFp26 was diagnostic-driven from a product playtest export.
   - Note that cFp25 remains the diagnostics baseline.

3. Create report:

   ```text
   audit/reports/2026-05-11-cFp26-report.md
   ```

The report must include:

- Files changed.
- Behavior changed.
- Tests/checks run.
- Acceptance criteria status.
- Deviations.
- Risks/follow-ups.
- Project State Update section.
- Recommended next step.

Mention the source playtest facts:

- Match seed: `ep4-mp13i5kv`.
- Human deck: `Current Northern Realms`.
- AI deck: `current-nilfgaard`.
- AI policy: `legal-heuristic-v1`.
- Diagnostic issue: Round 3 last-gem pass treated a tied reachable score as catch-up impossible for Nilfgaard.
- Diagnostic issue: Round 2 reason text could claim catch-up move while selected move was pass.

## Acceptance Criteria

The implementation is accepted only if:

1. v1 uses tie-aware round-win thresholds matching engine Nilfgaard tie-win behavior.
2. Nilfgaard can treat tied reachable score as sufficient only when exactly one seat is Nilfgaard and the acting AI is that Nilfgaard seat.
3. Non-Nilfgaard and double-Nilfgaard tie behavior are not accidentally upgraded.
4. Opponent-passed catch-up selection is tie-aware.
5. Last-gem impossible-pass logic is tie-aware.
6. Diagnostic reason text does not contradict the selected move.
7. `aiDeckFaction` is populated when known.
8. Hidden-info safety remains intact.
9. Project state and report are updated.
10. All required checks pass or any skipped browser check is explicitly justified.

## Required Checks

Run:

```bash
npm test -- --run tests/game/engineAiPolicy.test.ts tests/game/productDiagnostics.test.ts
npm test
npm run typecheck
npm run lint
npm run build
npm run check:forbidden-imports
npm run check:project-state -- --base HEAD~1
git diff --check
```

Because this touches product diagnostic export/UI wiring, also run:

```bash
npm run ci:browser
```

If browser dependencies are unavailable, say so clearly. Do not claim browser checks passed unless they actually passed.

## Commit And Push

When complete:

1. Confirm worktree status.
2. Commit on your assigned branch.
3. Push your assigned branch.
4. Report:
   - branch name
   - commit hash
   - exact checks run
   - any deviations or concerns

Do not merge into `dev`.

