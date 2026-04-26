# Browser Smoke Tests

The browser smoke harness uses Playwright with Chromium only. It covers the opt-in engine shell as a short UI regression tripwire; it is not a full game automation suite.

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

## dp6-smoke Coverage

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

## Current Limits

The smoke suite is intentionally bounded. It does not cover a full game, drag/drop, multi-browser behavior, screenshot approval, AI-vs-AI simulation, deck builder flows, or polished mobile board UX.

Some selectors are `data-testid` attributes on user-visible regions and controls. They are more stable than class names, but they still depend on the current button-driven shell structure and should be revisited when the final spatial board UI replaces this smoke surface.

## Failure Artifacts

Playwright keeps screenshots, videos, and traces on failure. Locally, inspect the printed `test-results/` paths or open the HTML report after a failed CI-style run:

```sh
npx playwright show-report
```
