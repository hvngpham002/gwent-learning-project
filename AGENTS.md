# Agent Instructions

## Read First

1. `AGENTS.md`
2. `docs/PROJECT_STATE.md`
3. Active `docs/spec/...`
4. Latest relevant `audit/reports/...`
5. `docs/gwent-rules.md` for rule changes

## Workflow

- Check `git status --short` before edits.
- Preserve user changes. Do not revert unrelated work.
- Stay inside the active spec and its out-of-scope list.
- Update tests with risk-scaled coverage.
- Update `docs/PROJECT_STATE.md` for every implementation phase.
- Create the required phase report under `audit/reports/`.

## Architecture Rules

- The pure engine owns rules, legal moves, scoring, prompts, round resolution, game end, and command transactions.
- UI consumes legal moves and dispatches exact engine commands.
- The Redux engine adapter stores engine state, command/event history, locks, errors, and UI-only selection. It does not compute rule outcomes.
- Do not use timers for rule transitions.
- Do not leak hidden information. AI hand card details must not appear in the default human engine view.
- `/` is the authentic product setup route.
- `/legacy` is the temporary legacy Redux UI route.
- New product, engine, simulation, benchmark, catalog, and AI policy code must not depend on `@/legacy/...`.

## Forbidden Imports And Boundaries

Engine UI and adapter paths must not import or rely on legacy rule helpers, legacy AI, or legacy Redux game paths.

Banned modules and identifiers in engine UI/adapter paths:

- `src/utils/gameHelpers`
- `@/utils/gameHelpers`
- `@/legacy/...` outside the documented `/legacy` route and store reducer exceptions
- `gameHelpers`
- `calculateTotalScore`
- `calculateRowStrength`
- `useReduxAI`
- `AIStrategyCoordinator`
- `gameSlice`
- `gameThunks`
- `gameSelectors`
- `GameBoard`

## Testing Commands

- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm run lint`
- `npm run check:forbidden-imports`
- `npm run check:project-state`
- `npm run check:worktree-clean`
- `npm run ci`

## Docs And Reports

- Report path format: `audit/reports/YYYY-MM-DD-<spec-id>-report.md`.
- Every report must include files changed, behavior changed, tests/checks run, acceptance criteria status, deviations, risks/follow-ups, and recommended next step.
- Reports for implementation phases must include a `Project State Update` section that describes the `docs/PROJECT_STATE.md` change or explains why none was required.
- `docs/PROJECT_STATE.md` is mandatory to update for every implementation phase.

## Git Rules

- Do not stage `.claude/`.
- Do not stage generated build metadata such as `*.tsbuildinfo`.
- Do not revert user changes.
- Prefer one spec commit and one implementation commit per phase when commits are requested.
- Use clear commit messages matching the existing phase style, such as `Cluster D Phase 4: ...`.

## Branch And Versioning Rules

- `dev` is the active integration branch unless the user says otherwise.
- Feature branches should use the `codex/` prefix when branch creation is needed.
- Semver releases are deferred until an engine-backed playable milestone.

## When To Stop And Ask

- Rule ambiguity that changes game behavior.
- Scope expansion beyond the active spec.
- CI or design decisions that change project policy.
- Potential data loss or destructive git operation.
