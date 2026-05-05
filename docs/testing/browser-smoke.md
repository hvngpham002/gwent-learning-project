# Browser Smoke Tests

The browser smoke harness uses Playwright with Chromium only. It covers the opt-in engine shell and the current authentic product loop as short UI regression tripwires; it is not a full game automation suite.

## Local Setup

Install package dependencies first:

```sh
npm install
```

Install the Playwright Chromium browser before the first local run:

```sh
npx playwright install chromium
```

Linux environments that need browser system packages can use:

```sh
npx playwright install --with-deps chromium
```

## Commands

Run the browser smoke suite against a Playwright-managed preview server:

```sh
npm run test:e2e
```

This command expects a current production build in `dist/`. For a one-command build-and-smoke run, use `npm run ci:browser`.

Run in headed mode while debugging:

```sh
npm run test:e2e:headed
```

Run the CI browser gate, including a production build:

```sh
npm run ci:browser
```

The default local `npm run ci` gate remains the fast deterministic unit/lint/build/project-state/worktree check. GitHub Actions runs `npm run ci`, installs Chromium with Playwright, then runs `npm run ci:browser`.

## Current Committed Coverage

The committed smoke spec currently runs 26 Chromium tests through `npm run ci:browser`: a production build, the diagnostic engine shell, authentic harness routes, the component foundation page, pre-game, deck builder, Card Studio, Official Porting, mulligan, modal, match entry, selected-card targeting, drag/drop, card-flight, and match-end ledger flows.

## dp6-smoke Engine Shell Coverage

The committed smoke spec uses:

```text
/?engine=1&seed=dp6-smoke
```

It verifies:

- `/` still renders the legacy app and does not mount the engine shell.
- the engine shell renders through opt-in routing;
- the status banner exposes seed, AI policy, phase, and next action context;
- the AI seat shows a hand count, not AI hand card tiles;
- human and AI zero-card mulligans complete;
- recent activity shows hidden-info-safe mulligan/action summaries;
- a human hand card can be selected and played through a legal target action;
- mobile width `390x900` does not create horizontal document overflow before or after target actions wrap.

## Hidden-Info Guard

The browser test intentionally checks visible page text for internal labels and generated AI hidden-card IDs such as `instanceId`, `sourceId`, and `seat_b:000:`-style values. It does not assert that all AI card names are absent, because AI cards can become public after board, weather, discard, or event exposure.

The authentic mulligan smoke extends this guard to the normal non-debug product route: AI hand and AI mulligan presentation text must remain backs/counts only. Debug routes such as `debugAiMulligan=1` intentionally reveal AI cards for animation inspection and are tested separately as explicit debug exceptions.

## Authentic Product Coverage

The same smoke spec verifies:

- `/` remains the legacy route, `/?engine=1` remains the diagnostic shell, and `?engine=1&ui=authentic` opens the authentic pre-game setup screen.
- `/?engine=1&ui=authentic&view=harness` still opens the cEp1 foundation harness.
- `/?engine=1&ui=authentic&view=ui-component-foundation` opens the component foundation page with shared tokens, audited typography, button variants, form controls, cards, backs, leaders, alerts, toasts, modals, and hidden-info-safe samples.
- Card Studio opens at `/?engine=1&ui=authentic&view=card-studio`, can import and save a minimal playable custom card, and exposes that card in the deck-builder pool without requiring repository file writes.
- Official Porting opens at `/?engine=1&ui=authentic&view=official-porting`, shows the `181` official candidate count, renders candidate list/status/preview surfaces, and avoids mobile horizontal overflow without promoting staged official cards into deck sources.
- Pre-game `begin match →` opens the dedicated mulligan flow before the match table.
- Direct `view=match` and deck-builder `play →` also land on mulligan first.
- Human keep-hand and one-card redraw paths dispatch legal mulligan commands and present the player replacement animation.
- The second one-card redraw keeps card opacity stable and avoids hand-strip scrollbars.
- AI choosing, hidden-safe AI presentation, forced debug zero-card keep, one-redraw, and two-redraw animations are reachable for QA inspection.
- `Start the match?` and `Return to setup?` handoff modals render as overlay popups with transparent shells, not separate full parchment screens.
- `review hand` dismisses the start modal, and the footer `start match` action reopens it before entering the match.
- Returning to setup from a completed mulligan review/start-modal state or in-progress match clears old engine adapter state, so starting the same setup/seed again begins at a fresh mulligan instead of stale prior history.
- Shared button color/hover behavior is checked on normal and debug authentic routes.
- Mobile width `390px` avoids horizontal overflow across pre-game, deck builder, mulligan, direct match, and post-confirm match entry.
- cEp11.1 adds a deterministic selected hand-weather-card smoke using a browser-local `gwent_authentic_decks_v1` fixture deck. The fixture contains 22 battlefield cards plus 10 legal weather specials; the test searches four fixed seeds (`cep111-weather-1` through `cep111-weather-4`) until a public `data-source-id` weather card is in the human hand, selects it, asserts `authentic-weather-target` and `target the weather panel` copy, clicks the Weather panel affordance rather than the right-rail fallback, and verifies the selected public weather source appears in the Weather panel.
- cEp11.1 adds a match-end ledger smoke through normal product controls. It starts a direct authentic match, keeps mulligans, confirms `Start the match?`, repeatedly uses visible `pass`, `resolve round`, and `next round` controls with a hard four-round limit, and asserts the real `data-ledger-kind="match_end"` overlay, round history, standing rows, placeholder-free copy, Escape persistence, and rematch route back through mulligan/start-match.
- cEp12 adds a row drag/drop smoke using the same browser-local fixture-deck pattern. It finds a playable human hand card with a legal board-row target, verifies right-click inspection does not start a drag, verifies an invalid drop leaves the hand count and activity unchanged, then drops on the highlighted row target and asserts active drop state, card-flight overlay, `Human played` activity, and hidden-info-safe page text.
- cEp12 adds a selected-weather drag/drop smoke with the local weather fixture. It selects a visible playable weather card, drags it to the Weather panel target, and asserts active drop state, card-flight overlay, Weather panel count increase, `Human played` activity, drag preview cleanup, and hidden-info-safe page text.
- cEp13 adds a generated weather-overlay smoke using the same local weather fixture. It plays a visible weather card into the Weather panel, then asserts that affected board rows render `authentic-row-weather-overlay` spans with the expected public `data-weather-effect` value: Frost on 2 close rows, Fog on 2 ranged rows, Rain on 2 siege rows, or Skellige Storm on 4 ranged/siege rows. The current cEp13 runtime assets are SVG overlays; the smoke contract stays DOM/behavior based rather than file-extension based.

## Current Limits

The smoke suite is intentionally bounded. It does not cover touch dragging, full `card_instance` / row-horn / Decoy choreography in browser, all weather overlay combinations in one run, multi-browser behavior, screenshot approval, AI-vs-AI simulation, every deck-builder editing branch, the match-end setup/change-deck branch, long strategic full-game scripts beyond the pass-only match-end tripwire, or polished mobile board UX.

Some selectors are `data-testid` and presentation-state attributes on user-visible regions and controls. They are more stable than class names, but they still depend on the current shell/product structure and should be revisited when final spatial board interactions evolve beyond this smoke surface.

## Failure Artifacts

Playwright keeps screenshots, videos, and traces on failure. Locally, inspect the printed `test-results/` paths or open the HTML report after a failed CI-style run:

```sh
npx playwright show-report
```
