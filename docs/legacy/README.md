# Legacy Quarantine

`/legacy` is the temporary holding route for the pre-engine Redux gameplay implementation. It is preserved for comparison, fallback, and baseline regression checks while the authentic product UI and pure engine continue to become the supported path.

New product, engine, simulation, benchmark, catalog, and AI-policy work must not import `@/legacy/...`. The only current production exceptions are `src/App.tsx`, which imports the legacy route wrapper, and `src/store/index.ts`, which keeps the legacy reducers mounted while `/legacy` exists.

## Source Inventory

- `src/legacy/LegacyRoute.tsx` - route boundary used by `src/App.tsx`.
- `src/legacy/components/` - legacy card, player, and Redux game components.
- `src/legacy/hooks/` - legacy local and Redux gameplay hooks.
- `src/legacy/store/` - legacy Redux slices, selectors, and thunks.
- `src/legacy/ai/` - old Redux gameplay AI strategy.
- `src/legacy/utils/` - old helper scoring, deck, and card utilities.
- `src/legacy/types/` - old runtime card/game types.
- `src/legacy/data/cards/` - old hand-authored card source modules.

## Known Technical Debt

- Legacy gameplay still uses timer-driven UI and AI transitions.
- Legacy Redux state remains mounted for the `/legacy` route.
- The old AI strategy is still coupled to legacy state and helper scoring.
- Helper scoring and row-strength logic remain separate from the pure engine and must not be used by product or engine UI.
- Legacy data modules remain separate from the current catalog source of truth.

## Deletion Prerequisites

- Authentic product UI covers the remaining baseline workflows needed for manual comparison.
- Existing legacy baseline tests are replaced by pure-engine or product-route coverage where appropriate.
- `/legacy` is no longer needed as a user-facing fallback.
- Legacy reducers can be removed from `src/store/index.ts` without breaking the app shell.
- Current catalog, deck builder, Card Studio, official-porting, simulation, benchmark, and AI policy paths no longer rely on any legacy comparison fixtures.

## Compatibility Shims

No old-path source compatibility shims remain after cEp16. Files that previously lived under top-level legacy folders were moved into `src/legacy`, except `src/components/game/EngineGameManager.tsx` and `src/components/game/engine/`, which are diagnostic engine shell files and were not legacy gameplay.
