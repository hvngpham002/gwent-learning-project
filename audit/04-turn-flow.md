# Phase 4 — Turn Flow (Rules-Level Only)

> Covers rulebook §8.1 (turn options), §8.2 (passing), §17.19 (pass when no legal plays), §17.23 (leader ability timing). Deep async / race conditions deferred to Phase 14.

---

## Inputs

- Active stack: `ReduxGameManager.tsx`, `useReduxAI.ts`, `gameSlice.ts`, `gameThunks.ts`, `GameCardsSelector.tsx`, `PlayerStatus.tsx`.
- Turn-related reducers: `playerPass` (`gameSlice.ts:106-113`), `opponentPass` (`:115-122`), `setCurrentTurn` (`:97`), `setGamePhase` (`:101`), `useLeaderAbility` (`:323-330`).
- Turn-related selectors: `selectCurrentTurn`, `selectCanPlayerAct` (`gameSelectors.ts:76-80`), `selectPlayerPassed`, `selectOpponentPassed`.

---

## §8.1 — Turn Options

### F-4.1  The three actions are exposed, each via their own entry point  ✅

> **Rule (§8.1):** "On your turn you must choose exactly one of: (1) Play a card, (2) Use your active Leader ability, (3) Pass."

- **Play card — human path:** `PlayerHand` → `GwentCard onClick` → `ReduxGameManager.handleCardClick` (selection) → row click or board-unit click → `dispatch(playCardAction({...}))`. Primary site: `ReduxGameManager.tsx:226-292` plus `handleBoardUnitClick:211-223`.
- **Play card — AI path:** `useReduxAI.makeOpponentMove:108-207` → `playCard(decision)` → `dispatch(playCardAction({player:'opponent', ...}))`.
- **Leader ability — human path:** "Use Leader Card" button in `PlayerStatus.tsx:105-112` → `ReduxGameManager.handleLeaderAbility:350-355`. **Only handles `LeaderAbility.DRAW_OPPONENT_DISCARD`** (see F-4.4).
- **Leader ability — AI path:** `makeOpponentMove` line 123-155 → `LeaderStrategy.evaluate` (`strategy.ts:19-48`) — **only handles `LeaderAbility.CLEAR_WEATHER`**.
- **Pass — human path:** "Pass" button in `PlayerStatus.tsx:115-123` → `ReduxGameManager.handlePass:312-317` → `dispatch(playerPass())`.
- **Pass — AI path:** `makeOpponentMove` line 168-179 → `handleOpponentPass` → `dispatch(opponentPass())`. Also the fallback at line 183-193 when `evaluateHand` returns `null` (no legal move).
- **Observation:** All three actions have dedicated entry points on both sides.
- **Asymmetry:** See F-4.4 — the leader-ability surface is disjoint between human and AI paths.

### F-4.2  "Exactly one" — enforced post-hoc by turn-switch, not upfront  ⚠️

- **Code path:** No "turn action in progress" lock. `canPlayerAct` selector (`gameSelectors.ts:76-80`) returns `(isPlayerTurn || isMedicChaining) && !playerPassed && gamePhase === 'playing'`. Does not check for any "action pending" state.
- **Observation:** The only gate preventing a second action is that the first action switches `currentTurn` before the second click can land. For synchronous plays this holds — but:
  - When `playCardAction` dispatches a sub-thunk via `await dispatch(...)` (e.g. Spy, Medic, Muster, Scorch sub-thunks), there is a microtask yield. React can re-render in between. During that window, `currentTurn` is still `'player'` for human plays. Deferred to Phase 14.
  - For Medic with valid targets, the selector modal opens WITHOUT calling `playCardAction` — the card is not yet played and `currentTurn` is still the player's. A second action IS possible at this point. See F-4.7 and F-4.8.
- **Proposed fix:** Introduce a `selectIsActionPending` selector (or similar) that blocks `canPlayerAct` while a multi-step action is mid-flight. Phase 14 will recommend exact shape.

### F-4.3  Active leader is once-per-game — `used` flag structure  ✅ (with asymmetric wiring — see F-4.4)

> **Rule (§8.1):** "Use your active Leader ability (once per game only; only if Leader is Active)."

- **Code path:**
  - `LeaderCard.used: boolean` (`types/card.ts:94`).
  - Set to `true` by `gameSlice.useLeaderAbility:323-330` on any player's leader.
  - Human button disabled by `!player.leader.used` check in `PlayerStatus.tsx:104` (`{!player.leader.used && !isOpponent && …}`).
  - `LeaderStrategy.evaluate:29` short-circuits if `card.used`.
- **Observation:** The `used` flag structure is correct and symmetric. But whether it gets SET for the human depends on F-4.4.

### F-4.4  Leader-ability wiring is disjoint between human and AI  🔀 ❌ (observable in production)

> **Rule (§8.1, §17.23):** "Use your active Leader ability (once per game only)."

- **Human handler** (`ReduxGameManager.handleLeaderAbility:350-355`):
  ```ts
  const handleLeaderAbility = useCallback(() => {
    console.log('Leader ability clicked');
    if (gameState.player.leader?.ability === LeaderAbility.DRAW_OPPONENT_DISCARD) {
      dispatch(showCardsSelector('draw_opponent_discard'));
    }
  }, [gameState.player.leader, dispatch]);
  ```
  Only `DRAW_OPPONENT_DISCARD` is wired.
- **AI handler** (`LeaderStrategy.evaluate` at `strategy.ts:36-47`):
  ```ts
  switch (leaderCard.ability) {
    case LeaderAbility.CLEAR_WEATHER:
      …
    default:
      console.log('Unhandled leader ability:', leaderCard.ability);
      return null;
  }
  ```
  Only `CLEAR_WEATHER` is wired.
- **Production consequence:** The active stack forces NR for both seats (F-2.16). NR's only hardcoded leader is Foltest: Lord Commander of The North → ability `CLEAR_WEATHER` (`deckBuilder.ts:29`, pointing at `northern-realms.ts:17-25`). So:
  - **Human's Foltest:** clicking "Use Leader Card" logs to console, dispatches nothing. Leader never becomes `used`. The human permanently cannot use their leader ability.
  - **AI's Foltest:** `LeaderStrategy.evaluateClearWeather:50-77` evaluates net weather impact and may play it, setting `used=true` via `playCardAction`'s LEADER branch.
- **Asymmetry:** 🔀 observable — AI has one active ability slot, human has zero. Status **❌** on §8.1 "Use your active Leader ability" — the human physically cannot.
- **Further asymmetry:** If the deck were swapped to Nilfgaard (`defaultNilfgaardDeck`), the roles would flip: leader ability is `DRAW_OPPONENT_DISCARD`, only the human side can use it; AI has no branch. The wiring gap is symmetric in structure but produces opposite asymmetries per faction.
- **Unwired abilities never reachable in either path:** `PLAY_FOG`, `PLAY_FROST`, `PLAY_RAIN`, `SCORCH_SIEGE`, `SCORCH_RANGED`, `DOUBLE_SIEGE`, `CANCEL_LEADER`, `LOOK_THREE_CARDS`, `RANDOM_MEDIC` — all 🕳️ at the implementation level.
- **Proposed fix:** Centralize leader-ability resolution in a single thunk (e.g. `useLeaderAbilityAction`) that switches over all 11 enum values. Both human and AI call that thunk. AI passes its "decision" metadata; human drives interactive targeting via `GameCardsSelector` modal cases.

### F-4.5  Leader-card click side effect — selection without follow-through  ⚠️

- **Code path:** `PlayerStatus.handleLeaderCardClick:38-42` sets `selectedCard = player.leader` when player's turn. But `ReduxGameManager.handleCardClick:157` rejects the leader because it's not in `playerHand`, so most selection logic never runs. The `selectedCard` rendering in `GameBoard.tsx:218-228` DOES show the leader's image/description while selected.
- **Observation:** There's no wiring from a leader being `selectedCard` to any action. The leader sits selected until the user clicks elsewhere. Cosmetic.

---

## §8.2 — Passing

### F-4.6  Pass sets `passed=true` and transitions phase when both passed  ✅

> **Rule (§8.2):** "Passing means sitting out the rest of this round. The other player continues playing one card per turn until they also pass. Once you pass you cannot play again until the next round begins."

- **Human reducer** (`gameSlice.playerPass:106-113`):
  ```ts
  state.player.passed = true;
  if (state.opponent.passed) {
    state.gamePhase = 'roundEnd';
  } else {
    state.currentTurn = 'opponent';
  }
  ```
- **AI reducer** (`gameSlice.opponentPass:115-122`): mirror.
- **Observation:** Both reducers synchronously transition to `'roundEnd'` when the second player passes. ✓

### F-4.7  Passed player cannot play again until next round  ✅

- **Human gate:** `selectCanPlayerAct` returns `false` when `playerPassed === true`. All click handlers (`handleCardClick`, `handleRowClick`, `handleBoardUnitClick`, `handleWeatherRowClick`) check `canPlayerAct` at entry.
- **AI gate:** `useReduxAI.ts:226` `const shouldMakeMove = currentTurn === 'opponent' && gamePhase === 'playing' && !opponentPassed;`. AI's scheduling useEffect will not fire while `opponentPassed`. ✓
- **`endRound` resets `passed` to `false`** (`gameSlice.ts:294-295`). Next round reopens actions. ✓

### F-4.8  "Other player continues playing one card per turn until they also pass"  ✅

- **Turn hand-off on single pass:**
  - `playerPass`: if opponent not passed, `currentTurn = 'opponent'`.
  - `opponentPass`: if player not passed, `currentTurn = 'player'`.
- **Turn stays with the non-passed player across their subsequent plays:**
  - `playCardBasic:143-149` sets `currentTurn = oppositePlayer` UNLESS `oppositePlayer.passed`, in which case the turn stays with `player`. ✓
  - `gameThunks.playCardAction` also dispatches `setCurrentTurn(state[oppositePlayer].passed ? player : oppositePlayer)` at the end of each ability branch (lines 109, 125, 159, 193). ✓
- **Observation:** Turn correctly remains with the un-passed player.

### F-4.9  No legal plays → pass implicitly for AI; manual for human  ⚠️ (rule-neutral)

> **Rule (§17.19 [Derived]):** "If you have zero cards in hand and have already used your Leader (or it's Passive), you must pass."

- **AI path:** `useReduxAI.makeOpponentMove:183-187` — if `strategyCoordinator.evaluateHand(gameState)` returns `null`, fall through to `handleOpponentPass`. And at line 175, if `strategyCoordinator.shouldPass(gameState)` is true, also pass. ✓
- **Human path:** No auto-pass. An empty-handed human with a used leader (or `CLEAR_WEATHER` leader which is structurally unusable per F-4.4) must still click the Pass button. This isn't a rule violation — the rule is about legality, not UX — but the human is stranded in a "nothing to do but pass" state without any hint.
- **Observation:** Rule-conformant on both sides. Flag as ⚠️ UX, not a finding.

---

## Medic Modal — Interactions with Turn Flow (dense)

### F-4.10  Medic modal leaves `canPlayerAct === true` while open  ❌

- **Code path:** `ReduxGameManager.handleRowClick:238-247` opens the medic modal via `dispatch(showCardsSelector('medic'))` and `return;`. No turn switch, no phase change, no lock. Then:
  - `selectCanPlayerAct` still returns `true` (all gates pass: player's turn, not passed, phase `playing`).
  - The modal itself is `position: absolute; width: 85%` with `z-index: 999` (`board.css` for `.game-cards-selector-container`). It overlays a centered 85% of the viewport. The "Pass" button in `PlayerStatus.tsx` sits in the left sidebar, **outside the modal's coverage area** for typical viewports.
- **Observation:** While the medic selector is open, the player **CAN** click the Pass button (UI reachable + selector still returns true). `handlePass` dispatches `playerPass` → sets `player.passed = true`. The Medic card is still in `player.hand` — never played. Modal remains mounted.
- **Consequence:** Player ends the round with the Medic still in hand. No rulebook violation (the Medic was never played, so no "must-apply" rule applies). But the modal is now zombie — dismissing it via Cancel calls `playMedicWithoutRevival` on a passed player, which re-sets `currentTurn = oppositePlayer` (already the case) and technically tries to play the card — but `canPlayerAct` is now false, and the card is already removed from hand by dispatch. Result: Medic ends up on the board AFTER the player has passed, contributing strength.
- **Further consequence:** The "play after passing" rule is violated in that chain. See §8.2.
- **Status:** ❌ — possible in-round violation of §8.2 via the medic-modal cancel path after a pass.
- **Proposed fix:** Block the Pass button while any `cardsSelector.show === true` state is active, OR close the selector synchronously on pass.

### F-4.11  Medic-modal Cancel consumes the turn AND skips the ability (carry-forward 3)  ❌ 🔀

- **Code path:** Cancel click in `GameCardsSelector.tsx:192-203`:
  ```ts
  setGameState((prev) => ({ ...prev, gamePhase: 'playing' }));
  setCardsSelector({ title: '', show: false });
  ```
  This lands in `ReduxGameManager.handleSetGameState:358-397`, which detects the medic-cancel case (`cardsSelector.title === 'medic' && selectedCard?.ability === MEDIC`) and dispatches `playMedicWithoutRevival` (`gameThunks.ts:565-581`).
- **`playMedicWithoutRevival` behavior:**
  ```ts
  dispatch(removeCardFromHand({ player, cardId: card.id }));
  dispatch(playCardBasic({ player, card, row }));
  if (!state.game[oppositePlayer].passed) {
    dispatch(setCurrentTurn(oppositePlayer));
  }
  ```
  1. Removes from hand.
  2. `playCardBasic` puts the Medic on the board with `skipTurnSwitch` defaulted to `false` → **also** switches turn inside the reducer (`gameSlice.ts:143-149`).
  3. Thunk then dispatches `setCurrentTurn` again — redundant but harmless.
- **Observation (carry-forward 3):** Cancel **consumes the turn** — the Medic lands on the board, turn passes to opponent. **The ability is skipped** — no revive happens even though `playerDiscard.length > 0` is the precondition for opening the modal. This violates §6.5 "All card effects must be applied if possible."
- **Strictly worse than alternative:** A user who decides *before* clicking the row that they don't want to play the Medic can simply click the Medic card in hand again to deselect (`handleCardClick:161-164`), costing nothing. Once the row is clicked and the modal opens, the ONLY exit paths are:
  1. Pick a target → Medic plays, ability fires, turn passes.
  2. Cancel → Medic plays, ability skipped, turn passes (strictly worse).
  3. Pass (F-4.10) → Medic stays in hand, player out of round.
- **Asymmetry:** AI cannot take the "skip ability" branch — `MedicStrategy` always returns a target if one exists.
- **Status:** ❌ rule violation + 🔀 ability-resolution asymmetry.
- **Proposed fix:** Remove the Cancel affordance from the medic modal, OR make Cancel revert the selection (leave card in hand, no turn consumption).

### F-4.12  Medic chain state interacts with `canPlayerAct`  ✅ (noted for Phase 8)

- **Selector:** `selectCanPlayerAct` includes `|| isMedicChaining` at `gameSelectors.ts:79`. This keeps the player able to act even when `currentTurn` might have already been switched (it's explicitly for the multi-step human medic chain). Phase 8 will verify the chain orchestration in detail. Rule-level: correct ✓.

---

## §17.23 — Leader Active Ability Timing

### F-4.13  Cannot use leader during opponent's turn  ✅

> **Rule (§17.23 [Derived]):** "You cannot use an active Leader ability during the opponent's turn (turns are discrete and per-player)."

- **Human gate:** "Use Leader Card" button `disabled={turn !== 'player'}` (`PlayerStatus.tsx:108`). `handleLeaderCardClick` also early-returns if `turn !== 'player'` (line 39).
- **AI gate:** AI's turn scheduling checks `currentTurn === 'opponent'` (`useReduxAI.ts:224`). `LeaderStrategy` is evaluated as the first candidate in `makeOpponentMove:123-155` — only when it's AI's turn to act.
- **Observation:** Both sides gate correctly.

### F-4.14  Leader ability replaces the card-play for that turn  ⚠️

> **Rule (§17.23):** "Using the Leader's active ability replaces your card-play for that turn."

- **AI path:** `makeOpponentMove` plays the leader decision via `playCard(decision)` which dispatches `playCardAction`. The LEADER branch of the thunk (`gameThunks.ts:97-110`) sets `used=true` and switches turn. No card is played in addition. ✓
- **Human path:** Structurally unreachable in current code (F-4.4). If it were wired, the shape would presumably follow the AI — one leader action per turn, turn passes. ⚠️ unimplemented for human.

---

## R-002 — Rules-Observable Window Between Reducer and Effect

Carry-forward 4 asks: does the 500ms window between the reducer's synchronous `gamePhase='roundEnd'` write and the `useEffect` at `ReduxGameManager.tsx:90-97` that also writes `setGamePhase('roundEnd')` after 500ms open any **rules-observable** window?

### Trace

**Writers of `gamePhase = 'roundEnd'`:**
1. `gameSlice.playerPass:109` — synchronous, inside reducer.
2. `gameSlice.opponentPass:118` — synchronous, inside reducer.
3. `ReduxGameManager.tsx:93-95` — `useEffect` that fires `setTimeout(() => dispatch(setGamePhase('roundEnd')), 500)` IF `gamePhase === 'playing' && playerPassed && opponent.passed`.

**When the reducer fires (1) or (2):** the synchronous phase transition to `'roundEnd'` happens in the same tick as `passed` becoming `true`. The next render sees `gamePhase === 'roundEnd'`.

**When the effect (3) evaluates:** its guard is `if (gamePhase === 'playing' && playerPassed && opponent.passed)`. After the reducer-driven synchronous transition, `gamePhase === 'roundEnd'`, so the guard is **false**. The `setTimeout` never schedules.

### Conclusion — F-4.15  ⚠️ / dead-code

- In the **current code path**, the 500ms effect body is **dead**: no realistic scenario sets `gamePhase='playing'` while both `passed=true`. The reducers always pre-empt.
- The effect is therefore **not a rules-observable race at Phase 4's abstraction level**. `R-002` at rules level is effectively vacuous.
- **BUT** the effect is structurally fragile: if a future refactor ever reverted the phase to `'playing'` with both-passed state (e.g. a "redo pass" affordance, or a `setGamePhase('playing')` called from one of the `handleSetGameState` branches with both-passed state), the 500ms-delayed dispatch would fire and trigger a **second** `endRound` (the `useEffect` at `:146-150` re-fires when `gamePhase` transitions back to `'roundEnd'`). `endRound` is NOT idempotent — it decrements `lives`, increments `currentRound`, and discards all board cards. A double-fire would be catastrophic.
- **Status:** ⚠️ dead code today; latent risk. Recorded under `R-002` with the amendment: the 500ms timer never fires in current code, so there is no observable race window at the rules level. Phase 14 will further examine the `endRound` idempotency and the closure-captured `gameState` in `handleRoundEnd`.
- **Proposed fix:** Delete the 500ms useEffect (`ReduxGameManager.tsx:90-97`) outright — the reducer already guarantees the transition. That eliminates the latent double-fire vector.

---

## Additional Observations

### F-4.16  Turn hand-off when a pass happens during an in-flight Medic chain (human)  🤔

- **Code path:** `handlePlayerMedicChain` (`gameThunks.ts:456-562`) sets `medicChainState.isChaining = true` and leaves the turn on the player. If the player somehow dismisses the modal while chaining (e.g. Cancel on a subsequent revive prompt) — `handleSetGameState` checks `selectedCard?.ability === MEDIC` but by that point the selectedCard may be a revived unit, not the original medic. Behavior is implementation-specific. Deferred to Phase 8 detail.

### F-4.17  AI turn can be scheduled twice via stale useEffect closure  (deferred to Phase 14)

- `useReduxAI.ts:210-246` schedules `makeOpponentMove` via `setTimeout(1000)`. The cleanup in the effect's return cancels in-flight timers on dep change. Normal flow is fine. Race scenarios deferred.

### F-4.18  Leader-card click sets `selectedCard = player.leader` but no thunk ingests it  ⚠️

- See F-4.5. The leader-selected state is inert. Clicking elsewhere replaces `selectedCard`. No rule violation; cosmetic.

---

## Phase 4 Findings Summary

| ID | Status | Rule | Title |
|---|---|---|---|
| F-4.1 | ✅ | §8.1 | Three turn actions exposed, each via own entry point |
| F-4.2 | ⚠️ | §8.1 | "Exactly one" enforced post-hoc by turn-switch, not upfront; gap on medic-modal |
| F-4.3 | ✅ | §8.1 | `leader.used` flag structure present (but wiring gaps — F-4.4) |
| F-4.4 | ❌ 🔀 | §8.1, §17.23 | **Human handler only wires DRAW_OPPONENT_DISCARD; AI strategy only wires CLEAR_WEATHER → in active NR-vs-NR production, only AI can use its leader** |
| F-4.5 | ⚠️ | — | Leader-card click sets selectedCard but no thunk ingests it (cosmetic) |
| F-4.6 | ✅ | §8.2 | Pass sets `passed=true`, transitions phase on second pass |
| F-4.7 | ✅ | §8.2 | Passed player cannot play again; `canPlayerAct` + AI gate |
| F-4.8 | ✅ | §8.2 | Turn remains with un-passed player across subsequent plays |
| F-4.9 | ⚠️ (rule-neutral) | §17.19 | AI auto-falls-back to pass; human must click |
| F-4.10 | ❌ | §8.2 | **Pass button reachable while medic modal open — dismissing Cancel after a Pass then plays a card on a passed player** |
| F-4.11 | ❌ 🔀 | §6.5 | **Medic-modal Cancel consumes turn and skips ability (carry-forward 3 confirmed)** |
| F-4.12 | ✅ | — | Medic-chain state correctly extends `canPlayerAct` via `isMedicChaining` |
| F-4.13 | ✅ | §17.23 | Cannot use leader during opponent's turn |
| F-4.14 | ⚠️ (unimpl.) | §17.23 | AI's leader replaces card-play; human side structurally unreachable |
| F-4.15 | ⚠️ (dead code) `R-002` | — | 500ms `setGamePhase` effect is dead today; latent double-fire risk if `endRound` ever re-triggered |
| F-4.16 | 🤔 (deferred) | — | Medic-chain cancel edge case — deferred to Phase 8 |
| F-4.17 | (deferred) | — | AI turn scheduling race — deferred to Phase 14 |
| F-4.18 | ⚠️ | — | Leader-card click sets `selectedCard` but inert |

**Counts:** ✅ 6 — ❌ 3 — 🔀 2 (both ❌-tagged) — ⚠️ 6 — 🤔 1 — deferred 2.

**Top single finding:** F-4.4 — leader-ability wiring disjoint, human cannot use their leader in current production. Closely followed by F-4.11 (Medic Cancel rule violation + asymmetry) and F-4.10 (Pass-while-medic-modal rule violation).

**Root causes cited:**
- `R-002` (F-4.15) — amended: no rules-observable window in current code; dead effect that represents latent double-fire risk.
- `R-005` (medic asymmetry) — contributory to F-4.11; full detail deferred to Phase 8/15.

**Scope-of-work forward-notes:**
- F-4.4 fix: unified `leaderAbilityAction` thunk covering all 11 `LeaderAbility` values, invoked by both human button and AI strategy.
- F-4.10 fix: selector open should gate `canPlayerAct`, OR Pass handler should close any open selector.
- F-4.11 fix: Cancel should revert the play rather than commit it with a skipped ability.
- F-4.15 fix: delete the dead 500ms effect.

---

**End of Phase 4.** Stopping. Awaiting `continue` to begin Phase 5 (Round Resolution — DENSE).
