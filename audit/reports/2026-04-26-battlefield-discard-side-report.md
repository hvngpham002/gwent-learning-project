# Battlefield Discard-Side Regression Report

## Summary

Extended the Spy discard-side fix beyond round cleanup. Row-occupying battlefield
cards destroyed by Special Scorch or Unit Scorch Close now move to the discard
pile for the side they occupied when destroyed. This keeps Spy behavior unified:
a Spy on the opponent board goes to the opponent discard whether it is swept at
round end or destroyed by Scorch.

## Files Changed

- `src/game/core/commands.ts`: Special Scorch now discards destroyed targets by
  target board side instead of controller.
- `src/game/core/abilities.ts`: Unit Scorch Close now discards destroyed targets
  by target board side instead of controller.
- `tests/game/coreCommands.test.ts`: adds Special Scorch and Unit Scorch Close
  Spy regressions.
- `docs/gwent-rules.md`: clarifies that row cards sent to discard by round
  cleanup or Scorch use board-side discard.
- `docs/PROJECT_STATE.md`: records the unified battlefield discard-side rule.
- `audit/reports/2026-04-26-battlefield-discard-side-report.md`: this report.

## Behavior Changed

- A Spy controlled by `seat_a` but sitting on `seat_b`'s row now moves to
  `seat_b` discard when destroyed by Special Scorch.
- A Spy controlled by `seat_a` but sitting on `seat_b`'s close row now moves to
  `seat_b` discard when destroyed by Unit Scorch Close.
- The destroyed Spy keeps its controller identity, so controller-based effects
  and diagnostics remain intact.
- The Scorch source card itself still discards to the player who played it.
- Global Weather cleanup remains controller discard.

## Tests / Checks Run

| Command | Result |
|---|---|
| `npm test -- --run tests/game/coreCommands.test.ts tests/game/coreRoundResolution.test.ts tests/game/coreAbilities.test.ts` | Passed: 3 files, 41 tests. |
| `npm test` | Passed: 21 files passed, 1 skipped; 182 tests passed, 12 todo. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed with the existing legacy `src/hooks/useReduxAI.ts` exhaustive-deps warning. |
| `npm run build` | Passed. |
| `npm run check:forbidden-imports` | Passed. |
| `npm run check:project-state -- --base HEAD~1` | Passed. |
| `git diff --check` | Passed. |
| `npm run ci` | Passed. |

## Risks / Follow-Ups

- This changes only Scorch target destruction and round cleanup. Decoy still
  returns its target to hand, and global Weather still uses controller discard.
- Future tests should cover any new board-destroying effects with cross-side
  Spies before enabling those abilities.
