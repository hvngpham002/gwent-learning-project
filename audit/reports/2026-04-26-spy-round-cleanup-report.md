# Spy Round-Cleanup Regression Report

## Summary

Fixed a round-end cleanup regression where Spy cards physically sitting on the
opponent board returned to the original controller's discard pile. The intended
project rule is now explicit: row-occupying cards sweep to the discard pile for
the side they currently occupy, while global weather and non-round-cleanup
effect discards continue to use controller discard unless a card effect says
otherwise.

## Files Changed

- `src/game/core/commands.ts`: changes round cleanup for board-row units and row
  horns to discard by occupied side instead of controller.
- `tests/game/coreRoundResolution.test.ts`: updates and expands round cleanup
  regressions for Spy board-side discard and Monsters keep behavior.
- `docs/gwent-rules.md`: updates the rule authority to clarify board-side
  round cleanup for row cards, including Spies.
- `docs/PROJECT_STATE.md`: records the clarified architectural rule.
- `audit/reports/2026-04-26-spy-round-cleanup-report.md`: this report.

## Behavior Changed

- A Spy controlled by `seat_a` but sitting on `seat_b`'s row now moves to
  `seat_b` discard during `ResolveRoundEnd`.
- The Spy's `controller` remains the player who played or revived it until
  another effect takes control, so on-play Spy draw semantics are unchanged.
- Row horns also sweep by occupied side at round cleanup.
- Weather cards remain global and continue to sweep to controller discard.

## Tests / Checks Run

| Command | Result |
|---|---|
| `npm test -- --run tests/game/coreRoundResolution.test.ts tests/game/coreAbilities.test.ts` | Passed: 2 files, 25 tests. |
| `npm test` | Passed: 21 files passed, 1 skipped; 180 tests passed, 12 todo. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed with the existing legacy `src/hooks/useReduxAI.ts` exhaustive-deps warning. |
| `npm run build` | Passed. |
| `npm run check:forbidden-imports` | Passed. |
| `npm run check:project-state -- --base HEAD~1` | Passed. |
| `git diff --check` | Passed. |
| `npm run ci` | Passed. |

## Risks / Follow-Ups

- This clarifies round cleanup only. Scorch, Clear Weather, and other
  non-round-cleanup discards still use controller discard unless later rules say
  otherwise.
- Future Medic/Skellige tests should cover what happens when a cross-side Spy is
  later revived from the side discard pile.
