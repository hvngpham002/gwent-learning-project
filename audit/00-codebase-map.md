# Phase 0 — Codebase Map

> Orientation document for the Gwent audit. Source-of-truth for all subsequent phases.
> Source rules: `docs/gwent-rules.md` (580 lines, dated 2025-10-anniversary edition).

---

## 1. Tech Stack

| Layer | Library / Version |
|---|---|
| Build | Vite 6.0.5 + `@vitejs/plugin-react-swc` |
| UI | React 18.3.1 |
| Language | TypeScript 5.6 (strict — see `tsconfig.app.json`) |
| State | **Redux Toolkit 2.8.2** (`@reduxjs/toolkit`) + `react-redux` 9.2 |
| Animation | `framer-motion` 11.15 |
| Routing | `react-router-dom` 7.1 (installed but not used in `App.tsx`) |
| Styles | Plain CSS modules + `styled-components` 6.1 (installed) |
| Tests | **None.** No Jest / Vitest / Playwright in `package.json`. |

Lint: ESLint 9 + `typescript-eslint` 8.18. No test runner. No CI config tracked in repo.

---

## 2. Directory Structure (top two levels of `src/`)

```
src/
├── App.tsx                       # Root: renders <ReduxGameManager />
├── main.tsx                      # Mounts <Provider store={store}> around <App />
├── ai/
│   └── strategy.ts               # AIStrategyCoordinator + 9 Strategy subclasses
├── components/
│   ├── DisclaimerModal.tsx
│   ├── VersionMark.tsx
│   ├── card/GwentCard.tsx
│   ├── game/
│   │   ├── GameBoard.tsx
│   │   ├── GameCardsSelector.tsx
│   │   ├── GameManager.tsx       # LEGACY — not imported anywhere reachable
│   │   └── ReduxGameManager.tsx  # ACTIVE — rendered by App.tsx
│   └── player/
│       ├── PlayerArea.tsx
│       ├── PlayerHand.tsx
│       └── PlayerStatus.tsx
├── data/cards/
│   ├── neutral.ts
│   ├── nilfgaardian-empire.ts
│   └── northern-realms.ts        # Only 3 of 5 factions have card data
├── hooks/
│   ├── useAI.ts                  # LEGACY (paired with GameManager.tsx)
│   ├── useGameLogic.ts           # Mixed status — see § 5
│   └── useReduxAI.ts             # ACTIVE
├── store/
│   ├── hooks.ts                  # useAppDispatch / useAppSelector
│   ├── index.ts                  # configureStore + RootState
│   ├── selectors/gameSelectors.ts
│   ├── slices/
│   │   ├── gameSlice.ts          # game reducers
│   │   └── uiSlice.ts            # UI/ephemeral reducers
│   └── thunks/gameThunks.ts      # createAsyncThunk-based card actions
├── styles/                       # CSS only
├── types/card.ts                 # All game type definitions
└── utils/
    ├── cardHelpers.ts            # ID generation
    ├── deckBuilder.ts            # Faction-deck assembly
    └── gameHelpers.ts            # Strength calc, scorch targets, etc.
```

`docs/gwent-rules.md` is the rule reference. `dist/` is build output (not relevant). `public/images/` has assets for **all 5 factions** including Skellige and Scoia'tael, even though no card data files exist for those factions.

---

## 3. State Management

**Pattern:** Redux Toolkit with `createSlice` + `createAsyncThunk`. Two slices.

### `gameSlice` — authoritative game state

`src/store/slices/gameSlice.ts:5-12` defines `ReduxGameState`:

```ts
interface ReduxGameState extends Omit<GameState, 'activeWeatherEffects'> {
  activeWeatherEffects: CardAbility[]; // Array instead of Set for serialization
  weatherCards: Array<{ card: Card; player: 'player' | 'opponent' }>;
  specialCardsOnBoard: { player: Card[]; opponent: Card[]; };
}
```

This is **a divergence from the type** in `src/types/card.ts:131`, where `activeWeatherEffects: Set<CardAbility>`. The Redux slice stores arrays; selectors and AI helpers convert back to `Set` at every boundary (e.g. `selectGameStateForAI` at `src/store/selectors/gameSelectors.ts:167`, and `new Set(gameState.activeWeatherEffects)` repeated in `ReduxGameManager.tsx:103, 104, 363, 406`).

### `uiSlice` — selection / modal / "AI moving" state

`src/store/slices/uiSlice.ts:4-24` defines `UIState`:

- `selectedCard`, `isDecoyActive`
- `cardsSelector` (modal title/show)
- `isAIMoving`, `aiRedrawComplete`
- `redrawCount`
- `medicChainState: { isChaining, originalMedic, placedMedics[] }`
- `gameScores` (persistent across games, mirrored to localStorage)

### Top-level game state type

`src/types/card.ts:121-132`:

```ts
export interface GameState {
    player: PlayerState;
    opponent: PlayerState;
    playerBoard: BoardState;
    opponentBoard: BoardState;
    currentRound: number;
    playerScore: number;          // unused — score derived from board on the fly
    opponentScore: number;        // unused
    currentTurn: 'player' | 'opponent';
    gamePhase: 'setup' | 'playing' | 'roundEnd' | 'gameEnd'
    activeWeatherEffects: Set<CardAbility>;
}
```

`PlayerState` (lines 110-119): `deck, hand, discard, leader, passed, lives (gem counter), faction, gameScore`.

**`lives` = the rulebook's "gem counters",** initialized to 2.

### Where logic lives

| Operation | File:Line |
|---|---|
| Add card to row | `gameSlice.playCardBasic` — `src/store/slices/gameSlice.ts:125` |
| Switch turn | inline in many actions; explicit `setCurrentTurn` action — line 97 |
| Round end (cleanup + life decrement) | `gameSlice.endRound` — line 253 |
| Strength calc | `gameHelpers.calculateRowStrength` — `src/utils/gameHelpers.ts:61` and `calculateUnitStrength` — line 16 |
| Scorch targets | `findScorchTargets` (whole board) — line 246; `findCloseScorchTargets` (opposite row, ≥10) — line 325; `findRowScorchTargets` — line 293 |
| Card abilities (Spy, Medic, Muster, Scorch_Close, Decoy, Horn, Weather, Scorch) | Multiple thunks in `src/store/thunks/gameThunks.ts` |
| Round end orchestration | `ReduxGameManager.handleRoundEnd` — `src/components/game/ReduxGameManager.tsx:100` |

---

## 4. Entry Points (file:line)

| Action | Human path | AI path |
|---|---|---|
| **Play card** (general) | `ReduxGameManager.handleRowClick` → `dispatch(playCardAction({player:'player', ...}))` — `src/components/game/ReduxGameManager.tsx:226` → `gameThunks.ts:82` | `useReduxAI.playCard` → `dispatch(playCardAction({player:'opponent', ...}))` — `src/hooks/useReduxAI.ts:83` → `gameThunks.ts:82` |
| **Decoy** | `handleBoardUnitClick` → `playCardAction({targetCard})` — `ReduxGameManager.tsx:211`; target chosen via UI click on a board unit | `DecoyStrategy.evaluate` picks `bestTarget` — `src/ai/strategy.ts:281` ; passed via `decision.targetCard` |
| **Medic** | `handleMedicCardSelect` → `dispatch(handlePlayerMedicChain({medicCard, reviveCard}))` — `ReduxGameManager.tsx:195`; player picks one card at a time, chain re-prompted via `showCardsSelector('medic')` — see `gameThunks.ts:456` | `MedicStrategy.simulateMedicChain` pre-computes full chain — `src/ai/strategy.ts:379`; entire chain executed via `executeAIMedicChain` thunk — `gameThunks.ts:284` |
| **Pass** | `handlePass` → `dispatch(playerPass())` — `ReduxGameManager.tsx:312` → `gameSlice.ts:106` | `useReduxAI.handleOpponentPass` → `dispatch(opponentPass())` — `useReduxAI.ts:77` → `gameSlice.ts:115` |
| **Use leader ability** | `handleLeaderAbility` — `ReduxGameManager.tsx:350`; only wired for `DRAW_OPPONENT_DISCARD` (opens modal) | `LeaderStrategy.evaluate` — `src/ai/strategy.ts:19`; only wired for `CLEAR_WEATHER` |
| **Round end** | `useEffect` watches `playerPassed && opponentPassed` → `setGamePhase('roundEnd')` → `useEffect` calls `handleRoundEnd` → `dispatch(endRound({playerScore, opponentScore}))` — `ReduxGameManager.tsx:90, 100` → `gameSlice.ts:253` | Same path. AI path passes via `opponentPass()`; the effect-driven round-end runs identically. |
| **Game end** | `gameSlice.endRound` sets `gamePhase = 'gameEnd'` when any player's `lives === 0` after decrement — `gameSlice.ts:310` | Same. |
| **Setup / draw 10** | `gameThunks.initializeNewGame` calls `createInitialDeck` then dispatches `initializeGame` reducer which slices `[0..10]` into hand — `gameThunks.ts:41`, `gameSlice.ts:64-86` | Same path; both decks initialized in one thunk. |
| **Mulligan** | `GameCardsSelector` with `title='redraw'` → `onRedraw` → `dispatch(handlePlayerRedraw({selectedCards}))` — `gameThunks.ts:432`; loop driven by `redrawCount < 2` in `ReduxGameManager.handleRedraw` — line 320 | `useReduxAI` setup-effect → `strategyCoordinator.evaluateRedraw` → `dispatch(redrawCards(...))` — `useReduxAI.ts:50` |

---

## 5. Two Parallel Implementations (CRITICAL)

This codebase contains **two complete game-control stacks**. The repo is mid-migration to Redux (see commit `27588fe (WIP) state management refactoring with Redux`). They should be flagged everywhere they appear.

### Active stack (rendered by `App.tsx`)

```
App.tsx
  → ReduxGameManager.tsx          (orchestration)
    → useReduxAI()                 (AI loop)
    → dispatch(playCardAction)    (gameThunks.ts)
    → dispatch(...) for slice mutations
  Reducers:
    gameSlice.ts, uiSlice.ts
  Strategy:
    src/ai/strategy.ts (AIStrategyCoordinator)
```

### Legacy stack (orphaned but present)

```
GameManager.tsx                    (NEVER imported by App.tsx)
  → useAI()                        (uses local React state)
    → playCardHelper === playCard  (useGameLogic.ts)
  State: useState<GameState>
```

`GameManager.tsx` is referenced nowhere reachable from the entry point. It is dead code, but it shares some imports with the active stack:

- `useGameLogic.ts` exports `playCard`, `handleDecoyAction`, `findMusterCards`, `PlayCardParams`. `findMusterCards` is **still imported by the active path** in `gameThunks.ts:35`, so deleting the legacy file would break the active stack.
- `useAI.ts` is the legacy AI hook; `useReduxAI.ts` is its Redux replacement. They share `AIStrategyCoordinator` from `strategy.ts`.

**Implication for the audit:** When asked "what does the codebase do for X," the truthful answer is the active path (Redux). Findings should preferentially cite Redux files. Legacy code may have *different* behavior; this should be noted but not weighted as the production behavior.

---

## 6. AI Locations

| File | Role |
|---|---|
| `src/ai/strategy.ts` | All decision strategies. 9 `Strategy` subclasses + `AIStrategyCoordinator`. **No code outside the AI hooks references these except via `PlayDecision` type.** |
| `src/hooks/useReduxAI.ts` | Active AI driver. Watches `currentTurn === 'opponent'` via `useEffect`, schedules `makeOpponentMove` via `setTimeout(1000)`. |
| `src/hooks/useAI.ts` | Legacy AI driver (paired with `GameManager.tsx`). Same shape, plain React state. |

The AI is **hardcoded as the opponent**. `AIStrategyCoordinator` reads only from `state.opponent` / `state.opponentBoard`. There is no concept of "AI plays player" or seat swap.

Strategies (in priority order from `src/ai/strategy.ts:578-588`): SpyStrategy → MedicStrategy → UnitStrategy → HeroStrategy → DecoyStrategy → CommanderHornStrategy → WeatherStrategy → ScorchStrategy. Plus `RedrawStrategy` and `LeaderStrategy` evaluated separately.

---

## 7. Key Type Definitions

```ts
// src/types/card.ts:1-50 (abridged)
export enum Faction { NORTHERN_REALMS, NILFGAARD, MONSTERS, SCOIATAEL, SKELLIGE, NEUTRAL }
export enum RowPosition { CLOSE, RANGED, SIEGE }
export enum CardType { UNIT, SPECIAL, LEADER, HERO, DECOY, SPY }
export enum CardAbility {
    TIGHT_BOND, MEDIC, MORALE_BOOST, SPY, MUSTER, MUSTER_ROACH, AGILE, AVENGER,
    SCORCH_CLOSE, SCORCH, SKELLIGE_STORM,
    COMMANDERS_HORN, DECOY,
    FROST, FOG, RAIN, CLEAR_WEATHER,
    NONE
}
```

Note absences in `CardAbility`: no `BERSERKER`, no `MARDROEME`, no `SUMMON`. These rule mechanics are not modeled.

`CardType.DECOY` and `CardType.SPY` are defined but never used (cards use `CardType.SPECIAL`/`UNIT` with the matching `ability`).

```ts
// src/types/card.ts:99-108
export interface BoardRow { cards: UnitCard[]; hornActive: boolean; }
export interface BoardState { close: BoardRow; ranged: BoardRow; siege: BoardRow; }
```

`hornActive` is a **boolean per row**, not a card reference — so the actual Horn unit/special card is not retained on the row, only the boolean. The Redux slice partially compensates with `specialCardsOnBoard: { player: Card[], opponent: Card[] }` (`gameSlice.ts:8-11`), but this is owned globally, not per-row.

```ts
// src/types/card.ts:110-119
export interface PlayerState {
    deck, faction, hand, discard, leader,
    passed: boolean,
    lives: number,         // GEM COUNTERS — starts at 2
    gameScore: number      // wins across multiple games
}
```

```ts
// src/ai/strategy.ts:5-12
export interface PlayDecision {
  card: Card;
  row?: RowPosition;
  targetCard?: UnitCard;       // for Decoy
  score: number;
  medicTarget?: UnitCard;      // for Medic — first target
  chainedMedicTargets?: UnitCard[]; // for Medic — rest of chain
}
```

---

## 8. Human Action Pipeline (ordered, from click to commit)

For **playing a unit card on a row**:

1. User clicks card in hand: `<GwentCard onClick>` in `PlayerHand.tsx:38` →
2. `PlayerHand.onCardClick` prop → `GameBoard.onCardClick` → `ReduxGameManager.handleCardClick` (`ReduxGameManager.tsx:153`).
3. `handleCardClick` validates `canPlayerAct` and that card is in hand; dispatches `setSelectedCard(card)` (`uiSlice.setSelectedCard`).
4. User clicks a row: `<div onClick>` in `PlayerArea.tsx:76` → `PlayerArea.onRowClick` prop → `GameBoard.onRowClick` → `ReduxGameManager.handleRowClick` (`ReduxGameManager.tsx:226`).
5. For Medic with non-empty discard: `dispatch(showCardsSelector('medic'))`, returns. (Card not played yet.)
6. Otherwise: `dispatch(playCardAction({player: 'player', card, row}))` (`gameThunks.ts:82`).
7. `playCardAction` thunk branches on `card.type`:
   - `LEADER` → `useLeaderAbility` + ability switch + `setCurrentTurn`.
   - `SPECIAL` → `removeCardFromHand` + ability-specific dispatches (Decoy/Horn/Weather/Scorch sub-thunks) + `setCurrentTurn`.
   - `UNIT/HERO` → ability switch (Spy/Medic/Muster/Scorch_Close/default) → `playCardBasic` reducer mutates `state[boardKey][row].cards.push(card)` and switches turn unless `skipTurnSwitch`.
8. `dispatch(setSelectedCard(null))` and `setIsDecoyActive(false)` on the way out (some paths only).
9. React re-renders from new Redux state.

For **playing a Decoy**:

1. Steps 1–3 same; `setIsDecoyActive(true)` in step 3.
2. User clicks a board unit: `<GwentCard onClick>` in `PlayerArea.tsx:92` → `PlayerArea.onUnitClick` → `GameBoard.onBoardUnitClick` → `ReduxGameManager.handleBoardUnitClick` (`ReduxGameManager.tsx:211`).
3. Filter rejects Heroes (`card.type !== CardType.UNIT`) and Decoys; otherwise `dispatch(playCardAction({player:'player', card: selectedCard, targetCard: clickedCard}))` (no `row`).
4. `playCardAction` SPECIAL/DECOY branch → `addCardToHand({card})` (was removed) → `dispatch(handleDecoyAction({...}))` (`gameThunks.ts:199`).
5. `handleDecoyAction` finds row, removes card from board, adds card to hand, `dispatch(playCardBasic({card: decoyForBoard, row: targetRow}))` to put a strength-0 placeholder on the row.

For **passing**:

1. `<button onClick>` in `PlayerStatus.tsx:118` → `PlayerStatus.onPass` → `GameBoard.onPass` → `ReduxGameManager.handlePass` (`ReduxGameManager.tsx:312`).
2. `dispatch(playerPass())` → `gameSlice.playerPass` (`gameSlice.ts:106`): sets `state.player.passed = true`; if `state.opponent.passed`, sets `state.gamePhase = 'roundEnd'`; else `state.currentTurn = 'opponent'`.
3. `useEffect` in `ReduxGameManager.tsx:90` independently watches `playerPassed && opponentPassed` and (after a 500ms timeout) calls `setGamePhase('roundEnd')`. This is **redundant with step 2**; both paths can fire.
4. Another `useEffect` (line 146) calls `handleRoundEnd` whenever `gamePhase === 'roundEnd'`.

---

## 9. AI Action Pipeline (ordered, from decision to commit)

1. `useEffect` in `useReduxAI.ts:210` watches `currentTurn === 'opponent' && gamePhase === 'playing' && !opponentPassed`. When true: `setTimeout(1000)` then `makeOpponentMove`.
2. `makeOpponentMove` (`useReduxAI.ts:108`):
   - Returns early if `isAIMoving` is set.
   - `dispatch(setIsAIMoving(true))`.
   - If leader exists and unused: `strategyCoordinator.evaluateLeader(gameState)`. If decision returned, calls local `playCard(decision)` and dispatches `setIsAIMoving(false)`.
   - Else: `strategyCoordinator.shouldPass(gameState)`. If `true`: `handleOpponentPass()` and `setIsAIMoving(false)`.
   - Else: `strategyCoordinator.evaluateHand(gameState)`. If no decision: `handleOpponentPass()`. Else: `playCard(decision)`.
   - **Bug visible at this layer:** `dispatch(setIsAIMoving(false))` is fired immediately on the synchronous return path, BEFORE the `setTimeout(500)` inside `playCard` resolves. The flag is therefore not held during the actual play.
3. `useReduxAI.playCard(decision)` (`useReduxAI.ts:83`):
   - `dispatch(setSelectedCard(decision.card))`.
   - Schedule `setTimeout(500)` → `executeMove`:
     - `await new Promise(r => setTimeout(r, 1000))` → `dispatch(setSelectedCard(null))`.
     - `await dispatch(playCardAction({player:'opponent', card, row, targetCard, decision}))`.
4. `playCardAction` runs **the same thunk used by the human** with `player='opponent'`. Branching is identical at the top level.
5. For **Medic specifically**, the AI path includes `decision.medicTarget` and `decision.chainedMedicTargets`, which trigger `executeAIMedicChain` (`gameThunks.ts:284`). The human path *never* sets these and instead drives revival through `handlePlayerMedicChain` (`gameThunks.ts:456`). These are **two different chain implementations** — see § 10.
6. `useReduxAI.handleOpponentPass` → `dispatch(opponentPass())` → `gameSlice.opponentPass` (`gameSlice.ts:115`). Mirror of `playerPass`.

---

## 10. Shared vs Duplicated Pipeline Steps

| Step | Human path | AI path | Shared? |
|---|---|---|---|
| Click → select | UI handler in `ReduxGameManager` | (none — AI never "selects") | N/A |
| Pick play target | UI clicks (row, board unit) | `AIStrategyCoordinator` heuristics | **Different** |
| Validation (in-hand, can-play, opponent-passed) | `canPlayerAct` selector + `handleCardClick` early returns | None — AI strategy assumes its own decisions are legal | **Different** (no shared validator) |
| Dispatch entry point | `dispatch(playCardAction({player:'player', ...}))` | `dispatch(playCardAction({player:'opponent', ..., decision}))` | **Shared thunk** |
| Card placement | `playCardBasic` reducer | Same | **Shared** |
| Spy resolution | `handleSpyAction` thunk (`gameThunks.ts:243`) | Same | **Shared** |
| Muster resolution | `handleMusterAction` thunk (`gameThunks.ts:341`) | Same | **Shared** |
| Scorch (special) | `handleScorchAction` thunk | Same | **Shared** |
| Scorch_Close (unit) | `handleScorchCloseAction` thunk | Same | **Shared** |
| Decoy target selection | `handleBoardUnitClick` (UI click) | `DecoyStrategy.findBestDecoyTarget` (heuristic) | **Different** |
| Decoy resolution | `handleDecoyAction` thunk | Same | **Shared** |
| Medic target selection | `GameCardsSelector` with title `'medic'` (UI list, one at a time) | `MedicStrategy.simulateMedicChain` (full chain pre-computed) | **Different** |
| Medic chain orchestration | `handlePlayerMedicChain` thunk (`gameThunks.ts:456`) — re-shows selector after each revive | `executeAIMedicChain` thunk (`gameThunks.ts:284`) — drains pre-computed list | **Different** ❗ |
| Pass | `playerPass` reducer | `opponentPass` reducer | **Different reducers, mirrored bodies** |
| Turn switch after action | inline in thunk via `setCurrentTurn` after each branch | Same | **Shared** |
| Round end | `useEffect` triggers `endRound` reducer | Same | **Shared** |

**Asymmetry hotspots flagged for Phase 15:**
- Medic chain has two entire implementations.
- Decoy / Medic target selection use different "thinking" surfaces.
- Pass actions are split into two reducers.
- The AI never goes through `canPlayerAct` / `handleCardClick` validation.

---

## 11. Test Coverage Summary

**Zero automated tests.** No `.test.ts(x)`, `.spec.ts(x)`, `__tests__/`, or test runner config.

---

## 12. Faction / Card Data Coverage

| Faction | Card data file | Status |
|---|---|---|
| Neutral | `src/data/cards/neutral.ts` | Present (heroes, units, specials) |
| Northern Realms | `src/data/cards/northern-realms.ts` | Present |
| Nilfgaard | `src/data/cards/nilfgaardian-empire.ts` | Present |
| Monsters | — | **Missing** (image assets exist) |
| Scoia'tael | — | **Missing** (image assets exist) |
| Skellige | — | **Missing** (image assets exist) |

`utils/deckBuilder.ts` only handles `NORTHERN_REALMS` and `NILFGAARD`; default branch throws.

`gameThunks.initializeNewGame` (`gameThunks.ts:46-47`) **hardcodes `Faction.NORTHERN_REALMS` for both player and opponent**. The legacy `GameManager.tsx:158-159` hardcoded Nilfgaard for player and Northern Realms for opponent.

So in production today, every game is **Northern Realms vs Northern Realms** with the Foltest "Lord Commander of The North" leader on both sides (`deckBuilder.ts:29`). Phases 7 (factions), 13 (specific cards including King Bran / Dimun / Eredin), and parts of 8 will need to acknowledge that most factions are not represented at all.

---

## 13. Non-Obvious Details (heads-up before audit begins)

1. **`activeWeatherEffects` is two types** depending on layer: `Set` in `GameState` (the original type), `CardAbility[]` in Redux state. Conversion happens at every read. This is a frequent source of subtle bugs (`.has()` vs `.includes()`).

2. **`Math.random()` inside reducers.** `gameSlice.initializeGame` (line 90) and `gameSlice.endRound` (line 300) both call `Math.random()` to pick the next-round starter. Reducers must be pure; this means RTK's devtools time-travel will desync, and round-starter assignment is **non-deterministic per replay**. It also **violates the rule "Winner of the round starts the next round"** (`gwent-rules.md` § 8.3) and the coin-flip-once rule (§ 7).

3. **No faction abilities are wired anywhere.** Search confirms: no `MONSTERS`/`NILFGAARD`/`NORTHERN_REALMS`/`SCOIATAEL`/`SKELLIGE` faction-conditional logic in `gameSlice` or `gameThunks` (only used in deck-builder dispatch). Specifically:
   - Monsters round-end "keep one unit" — not implemented; `endRound` always sweeps the board.
   - Nilfgaard wins ties — `endRound` line 264 explicitly decrements both players on tie.
   - Northern Realms draws on round win — not implemented.
   - Scoia'tael picks first player — not implemented; `Math.random()` is used.
   - Skellige round-3 return — not implemented.

4. **No Tight Bond strength bug visible at a glance.** `calculateUnitStrength` (`gameHelpers.ts:35`) does `if (sameNameCardsInRow > 1) strength *= sameNameCardsInRow`. The caller (`calculateRowStrength`) computes `sameNameCardsInRow = cards.filter(c => c.name === card.name).length` only for TIGHT_BOND cards. This includes self in the count. Worth verifying against the rulebook example in Phase 12: 3× Tight Bond units of strength 4 should be 12 each → 4 × 3 = 12 ✓ (with current code).

5. **Spy controller-discard rule.** `handleSpyAction` (`gameThunks.ts:243`) places the spy on `oppositePlayer`'s **board** but never marks ownership. At round end, `endRound` sweeps `state.opponentBoard.*.cards` into `state.opponent.discard` (line 282-289), which means **a Spy played by the human ends up in the AI's discard at round end**. This violates `gwent-rules.md` § 9 ("its controller's discard pile … This includes 'Spy' cards"). Confirmed bug — pre-flagged for Phase 8.

6. **`weatherCards` and `specialCardsOnBoard` shadow tracking** (gameSlice lines 6-11). These exist specifically so that at round end, weather and horn/decoy cards are routed to the correct player's discard (line 270-289). This is an active mitigation for the "where does a Special go on cleanup" problem; the legacy `GameManager.tsx:117-129` lacks this and **loses Special Cards entirely on round cleanup**.

7. **`endRound` runs `Math.random()` and overwrites `gamePhase` even on game end.** Line 301 unconditionally sets `gamePhase = 'playing'`; line 310 then overwrites to `'gameEnd'` when a player has 0 lives. Order is correct but fragile.

8. **Game-end detection is in `ReduxGameManager.handleRoundEnd` BEFORE `endRound` dispatch.** Line 111 reads `gameState.player.lives === 1 || gameState.opponent.lives === 1` (the *pre-decrement* state). The intent is: "If anyone is on their last life going into this round, this might be game-over." But it fires whenever **either** player is on 1 life, even if that player wins the round and *doesn't* lose their last gem. The new-game-init `setTimeout` then fires inappropriately. Pre-flagged for Phase 6.

9. **`isAIMoving` flag is set then immediately cleared** in the synchronous portion of `makeOpponentMove`, before the `setTimeout`-driven `playCard` actually completes. It does not protect against re-entrancy in the way it appears to. The `useEffect` re-fires after `setIsAIMoving(false)` — pre-flagged for Phase 14.

10. **`DRAW_OPPONENT_DISCARD` leader ability** is partially wired in `GameCardsSelector.handleDrawOpponentDiscard` (`GameCardsSelector.tsx:55-77`). It mutates state directly via `setGameState` rather than dispatching through Redux — the prop chain still passes `setGameState` as a function from `ReduxGameManager.handleSetGameState` (`ReduxGameManager.tsx:358`), which then conditionally dispatches things. It is dead-ish: the only leader ever issued is Foltest's `LeaderAbility.CLEAR_WEATHER` (since both sides use `defaultNorthernRealmsDeck`), which leader-cards line 30 selects `'Foltest: Lord Commander of The North'`. Need to verify Foltest's ability mapping — Foltest has at least 5 different leader cards in image assets but only one is in the data file.

11. **`Math.random()` in shuffle** (`gameHelpers.ts:7-14`) is the standard Fisher-Yates. Not seeded. Tests would not be deterministic.

12. **Card ID uniqueness** is enforced via `generateUniqueCardId(baseId, player, copyIndex)` (`cardHelpers.ts:10-18`) — IDs include `_p` or `_ai` suffix. `validateUniqueCardIds` runs in dev mode (`gameThunks.ts:53-66`).

13. **Skellige Storm enum exists** (`CardAbility.SKELLIGE_STORM`) and has a card (`neutral.ts:252-260`), but **`calculateTotalScore` does not check for it** (`gameHelpers.ts:87-96` only checks FROST/FOG/RAIN). The AI's `getWeatherAffectedRows` does map it to RANGED+SIEGE (`gameHelpers.ts:219-220`), so the AI-side weather impact calc handles it but the live strength calculation does not. If played, Skellige Storm has zero gameplay effect.

14. **`CardAbility.AVENGER` and `CardAbility.MUSTER_ROACH`** exist in the enum and on cards (e.g. Geralt has `MUSTER_ROACH`). Neither is implemented anywhere in `playCardAction` / `gameHelpers`. Geralt's "summon Roach when discarded" mechanic does not exist in code.

15. **`playerScore` / `opponentScore` fields on `GameState`** are never written anywhere. Round and total scores are recomputed from the board on the fly via `calculateTotalScore`. The fields are dead storage.

16. **Two `useEffect`s race for round-end.** `gameSlice.playerPass` synchronously sets `gamePhase = 'roundEnd'` (line 109) AND `ReduxGameManager.tsx:90` `useEffect` waits 500ms and *also* sets `gamePhase = 'roundEnd'`. The second write is a no-op when phase is already `'roundEnd'` but creates a 500ms latency window in which the player could theoretically take another action depending on `canPlayerAct`. Pre-flagged for Phase 14.

17. **`MedicStrategy.simulateMedicChain` reads `state.opponent.discard`** (`strategy.ts:394`). When player plays a Medic, the AI strategy is not consulted — only the human-side selector is. So the AI's chain logic only ever runs on its own discard. That is correct per "the AI controls the AI's medic", but worth noting that there is **no shared chain calculator** the human UI uses to suggest the same chain.

---

**End of Phase 0.** Stopping. Awaiting `continue` to begin Phase 1 (Audit Plan).
