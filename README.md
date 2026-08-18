# Gwent Card Game - Learning Project

A React and TypeScript fan implementation of Gwent, inspired by The Witcher 3: Wild Hunt. The project is currently migrating from a legacy playable UI to a pure engine-backed architecture.

## Important Disclaimer

This is a non-commercial fan project created solely for educational purposes and portfolio demonstration:

- Not affiliated with CD PROJEKT RED
- All Witcher-related intellectual property belongs to CD PROJEKT RED
- Not for commercial use
- Created for learning and portfolio demonstration only

## Current Project State

Read these before contributing:

- `AGENTS.md` for repository-specific coding agent rules
- `docs/PROJECT_STATE.md` for the current architecture, completed phase ledger, active risks, and next recommended step
- Active implementation specs under `docs/spec/`
- Latest phase reports under `audit/reports/`

The app currently has two UI paths:

- `/` is the default, authentic engine-backed pre-game and match flow.
- `/legacy` is the retained legacy Redux UI route.

Older `?engine=1` query aliases remain compatible, but new links, playtests, and
documentation should use the canonical paths above. The engine-backed flow routes
game rules through `src/game/core/`, Redux engine adapter state, and engine legal
moves. The legacy UI remains only as a temporary compatibility surface.

## Commands

Install dependencies:

```bash
npm install
```

For CI-like installs:

```bash
npm ci
```

Start the dev server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Run the aggregate local CI checks:

```bash
npm run ci
```

## Architecture Overview

- `src/game/core/`: pure engine for match state, commands, legal moves, abilities, scoring, and round/game resolution.
- `src/game/catalog/` and `src/data/catalog/`: catalog schemas, validators, card data, leaders, and deck presets.
- `src/store/slices/engineSlice.ts`: Redux adapter state for engine matches, locks, command/event history, errors, and UI-only selections.
- `src/store/thunks/engineThunks.ts`: dispatches engine commands without reimplementing rules.
- `src/components/game/EngineGameManager.tsx`: engine-backed match UI shell.
- Legacy UI paths remain in place until a future spec explicitly removes or replaces them.

## License

This project is licensed under MIT for the codebase. All Witcher-related content, including card names, descriptions, and game mechanics, are intellectual property of CD PROJEKT RED.
