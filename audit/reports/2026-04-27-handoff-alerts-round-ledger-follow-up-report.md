# handoff-alerts Round Ledger Follow-up Report

## Files Changed

- `src/components/gwent/AuthenticMatchScreen.tsx`
- `src/components/gwent/authentic-match.css`
- `src/components/gwent/alert/SeveritySigil.tsx`
- `src/components/gwent/alert/alert.css`
- `tests/components/gwent/authenticAlertComponents.test.tsx`
- `docs/PROJECT_STATE.md`
- `audit/reports/2026-04-27-handoff-alerts-round-ledger-follow-up-report.md`

## Behavior Changed

- Round resolution no longer uses the compact seal-style alert. It now uses the handoff ledger broadside treatment with a score table, gem-loss row, and `next round →` action.
- Match end now uses a crown-severity ledger popup with round-history rows and real standing data from engine state: match result, round count, and final gems.
- Match-end actions are functional: `close` dismisses the popup, `change deck` returns to setup when that route callback exists, and `rematch` starts the current setup again.
- The new ledger presentation continues to derive scores, gem loss, winner, and final gems from engine state and does not add ranked/MMR placeholder data.

## Tests And Checks Run

- `npm test -- --run tests/components/gwent/authenticAlertComponents.test.tsx tests/components/gwent/authenticMatchViewModel.test.ts`
- `npm run typecheck`
- `npm test`
- `npm run lint`
- `npm run build`
- `npm run check:forbidden-imports`
- `npm run check:project-state -- --base HEAD~1`
- `git diff --check`
- `npm run ci`
- `npm run ci:browser`

## Acceptance Criteria Status

- Round resolve popup follows the provided ledger-table direction: complete.
- Match-end popup follows the provided round-history/standing direction: complete.
- Engine/rule behavior remains unchanged: complete.
- No hidden-information data was added to the popup: complete.

## Deviations

- The prototype's ranked rows (`mmr`, `rank`, `streak`) were not implemented because those systems do not exist yet. The popup shows real match standing instead.
- The prototype's `main menu` action was not added because the authentic route currently exposes setup/change-deck and rematch flows, not a separate main-menu route.

## Risks And Follow-ups

- The popup still appears only after explicit round resolution, matching the current engine UI behavior.
- A later phase should define final product game-end navigation once route promotion and main-menu structure exist.

## Project State Update

- `docs/PROJECT_STATE.md` now records the round/game-end ledger broadside presentation and clarifies that match-end standing uses real engine state rather than placeholder ranked data.

## Recommended Next Step

- Superseded by cEp6 final planning: cEp6 delivered mulligan/product navigation. Proceed to cEp7 planning for Card Studio and content workflow after visual review.
