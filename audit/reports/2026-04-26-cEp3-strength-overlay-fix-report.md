# cEp3 Strength Overlay Follow-Up Report

## Summary

Removed the duplicate board-card effective-strength overlay from the authentic
match table. Board cards already receive engine-derived effective strength via
the `AuthenticCard` view model, so the cEp3 wrapper badge rendered a second
visible number on the same card.

## Files Changed

- `src/components/gwent/AuthenticMatchScreen.tsx`
- `src/components/gwent/authentic-match.css`
- `tests/e2e/engine-shell-smoke.spec.ts`
- `audit/reports/2026-04-26-cEp3-report.md`
- `docs/PROJECT_STATE.md`

## Behavior

- Board cards still show effective strength.
- The only visible strength number is the normal `AuthenticCard` medallion.
- Boosted/reduced/normal state remains available as wrapper metadata and light
  wrapper styling.
- Existing smoke selectors continue to use `authentic-effective-strength` on the
  board-card wrapper instead of a second visible badge.
- Browser smoke asserts that the obsolete duplicate overlay class is absent.

## Validation

| Command | Result |
|---|---|
| `npm test -- --run tests/components/gwent/authenticMatchViewModel.test.ts tests/appMode.test.ts` | Passed: 2 files, 16 tests. |
| `npm test` | Passed: 21 files passed, 1 skipped; 188 tests passed, 12 todo. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed with the existing legacy `src/hooks/useReduxAI.ts` exhaustive-deps warning. |
| `npm run build` | Passed. |
| `npm run check:forbidden-imports` | Passed. |
| `npm run check:project-state -- --base HEAD~1` | Passed. |
| `git diff --check` | Passed. |
| `npm run ci:browser` | Passed after local preview-server bind approval; 7 Chromium tests passed. |
