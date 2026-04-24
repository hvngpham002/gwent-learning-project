# Phase 5 — Round Resolution (DENSE)

> Covers rulebook §8.3 (resolution at end of round), §17.17 (Monsters persistence), §17.18 (Skellige round-3 return), §17.13 (draws and Nilfgaard), plus the carry-forward winner-flip and Spy-trace analyses.

---

## Inputs

- Reducer: `gameSlice.endRound:253-320`.
- Orchestration: `ReduxGameManager.handleRoundEnd:100-143` + two `useEffect`s at `:90-97` and `:146-150`.
- Score calc: `gameHelpers.calculateTotalScore:87-96`, `calculateRowStrength:61-81`, `calculateUnitStrength:16-54`.
- Cleanup tracking: `state.weatherCards` + `state.specialCardsOnBoard` (`gameSlice.ts:6-11`).

---

## §8.3 — Resolution at End of Round

### F-5.1  Both-passed triggers round-end phase transition  ✅

> **Rule (§8.3):** "When both players have passed…"

- **Code path:** `gameSlice.playerPass:108-109` and `opponentPass:117-118` — the second-pass reducer synchronously sets `state.gamePhase = 'roundEnd'`. `ReduxGameManager.tsx:146-150` has a `useEffect` watching `gamePhase` and calling `handleRoundEnd` when it flips to `'roundEnd'`.
- **Observation:** Conformant. See F-4.15 for the dead 500ms backup effect (no rules-observable race).

### F-5.2  Strength calculation at round end  ✅ (with Phase 12 caveat)

> **Rule (§8.3):** "Each player sums the Strength of all their cards currently on the battlefield (both Units and Heroes — plus any ongoing modifiers from Weather, Tight Bond, Morale Boost, Horn, Mardroeme)."

- **Code path:** `handleRoundEnd:103-104`:
  ```ts
  const playerScore = calculateTotalScore(gameState.playerBoard, new Set(gameState.activeWeatherEffects));
  const opponentScore = calculateTotalScore(gameState.opponentBoard, new Set(gameState.activeWeatherEffects));
  ```
  `calculateTotalScore` at `gameHelpers.ts:87-96` sums rows with appropriate weather booleans and row-local horn state.
- **Observation:** The totals fed into `endRound` are whatever `calculateTotalScore` returns — which uses the Phase 12 order-of-ops bug (Weather → TB → Horn → MB instead of Weather → TB → MB → Horn). Per-unit deltas flow directly into the round outcome. See F-5.11 for the concrete winner-flip trace.
- **Heroes included:** `calculateUnitStrength:23-25` returns `card.strength` for HERO → added to row total. ✓
- **Modifiers included:** Weather / TB / MB / Horn are all there (order aside). Mardroeme: 🕳️ — not implemented.
- **Uses Set conversion (`R-003`):** every call site builds `new Set(activeWeatherEffects)` on the fly. Conversion overhead but functionally correct.

### F-5.3  Lower total loses a gem; tie → both lose a gem  ⚠️ + 🕳️ (no Nilfgaard override)

> **Rule (§8.3):** "The player with the lowest total Strength loses the round and removes a gem. In a draw, both players remove a gem — unless Nilfgaard's faction ability is in play."

- **Code path (`gameSlice.endRound:260-267`):**
  ```ts
  if (playerScore > opponentScore) {
    state.opponent.lives--;
  } else if (opponentScore > playerScore) {
    state.player.lives--;
  } else {
    state.player.lives--;
    state.opponent.lives--;
  }
  ```
- **Observation:** Basic decrement logic is correct. **Nilfgaard tie-win override is 🕳️** — see F-5.10. No faction-keyed branch.
- **Asymmetry:** None at this layer — symmetric between seats.

### F-5.4  Tie-draw next-starter ambiguity  ❓

> **Rule (§8.3):** "The winner of the round starts the next round." (Rulebook silent on the case where the round is a draw.)

- **Code path:** `gameSlice.endRound:300` `state.currentTurn = Math.random() < 0.5 ? 'player' : 'opponent';` regardless of outcome.
- **Observation:** The rulebook doesn't specify the draw tiebreaker for next-round starter. Code punts to random for ALL outcomes, not only draws — see F-5.7. For the narrow draw case, random is defensible; for non-draws it's a rule violation.

### F-5.5  All cards on battlefield → controller's discard  ❌ (via R-004)

> **Rule (§8.3, §9):** "All cards on the battlefield, including Special Cards, are placed in their controller's discard pile."

- **Code path (`gameSlice.endRound:270-289`):**
  ```ts
  const playerWeatherCards = state.weatherCards.filter(w => w.player === 'player').map(w => w.card);
  const opponentWeatherCards = state.weatherCards.filter(w => w.player === 'opponent').map(w => w.card);

  const playerDiscardCards = [
    ...state.player.discard,
    ...state.playerBoard.close.cards,
    ...state.playerBoard.ranged.cards,
    ...state.playerBoard.siege.cards,
    ...state.specialCardsOnBoard.player,
    ...playerWeatherCards
  ];
  const opponentDiscardCards = [
    ...state.opponent.discard,
    ...state.opponentBoard.close.cards,
    ...state.opponentBoard.ranged.cards,
    ...state.opponentBoard.siege.cards,
    ...state.specialCardsOnBoard.opponent,
    ...opponentWeatherCards
  ];
  ```
  Then line 292-293: `state.player.discard = playerDiscardCards; state.opponent.discard = opponentDiscardCards;`.
- **Observation:**
  - Weather cards: routed to their **controllers'** discard via `weatherCards[].player` tag — correct per rule. ✓
  - Special cards (Horn, Decoy): routed via `specialCardsOnBoard[player]` array — also correct per rule. ✓ (but see F-5.13 for Decoy double-counting).
  - Unit cards: routed by **board side**, not by controller. **For Spies this is wrong** — a Spy played by the human physically sits on `opponentBoard` but its controller is the human. The sweep puts it in the AI's discard. See F-5.12 for the concrete R-004 trace.

### F-5.6  Monsters "keep one unit" missing  🕳️

> **Rule (§11, §17.17):** "At the end of each round, one Unit Card stays on the battlefield … the controlling player shuffles all their Unit Cards on the battlefield excluding Heroes, and draws one at random."

- **Code path:** None. `endRound` sweeps all board cards unconditionally. No faction branch. No `state.player.faction` check anywhere in `endRound`.
- **Observation:** Structurally cannot work today; Monsters faction has no card data (F-2.16) and no ability hook.
- **Proposed fix:** Inject a `pickMonstersKeeper(faction, board)` step before the sweep; retain the chosen UNIT non-HERO card on the board instead of pushing to discard.

### F-5.7  Winner starts next round  ❌ — `R-001`

> **Rule (§8.3):** "The winner of the round starts the next round."

- **Code path:** `gameSlice.endRound:300` — `state.currentTurn = Math.random() < 0.5 ? 'player' : 'opponent';`
- **Observation:** The reducer **already determined** who won the board (the non-decremented player in lines 260-263). But the winner is discarded; next-starter is randomized. Direct rule violation.
- **Further:** `Math.random()` inside a reducer is impure (breaks Redux time-travel and deterministic tests — root cause `R-001`).
- **Proposed fix:** `state.currentTurn = playerScore > opponentScore ? 'player' : opponentScore > playerScore ? 'opponent' : /* draw: choose by rule policy */ 'player'`; and move RNG out of reducer if still needed for ties.

### F-5.8  Skellige round-3 return  🕳️

> **Rule (§11, §17.18):** "At the start of the third round, two random Unit Cards, excluding Heroes, are taken from the controlling player's discard pile and put on the battlefield."

- **Code path:** None. `endRound` unconditionally advances `state.currentRound++` (line 299) but no round-3 entry hook for Skellige.
- **Observation:** Depends on Skellige faction + discard-reach-in. Structurally blocked by F-2.16 (no Skellige data) and the absence of a faction-ability hook point in `endRound` or an equivalent `startRound` step.

### F-5.9  Northern Realms draws on round-win  🕳️

> **Rule (§11):** "Draws a card from the deck whenever a round is won."

- **Code path:** None. `endRound` does not call `drawCards` for the winner.
- **Observation:** Active production is NR-vs-NR (F-2.16) → both sides would be entitled to a round-win draw if this were wired. Neither gets it. Symmetric absence, but still a gap.

### F-5.10  Nilfgaard wins draws  🕳️

> **Rule (§11, §17.13):** "Wins the round whenever there is a draw."

- **Code path:** Same tie-decrement at `endRound:264-267` regardless of faction. No check for `state[player].faction === NILFGAARD`.
- **Observation:** Unreachable in current NR-vs-NR production. Structurally 🕳️.

---

## F-5.11  Phase 12 Order-of-Ops Can Flip a Round Outcome  ❌ 🔀 (carry-forward 1)

The Phase 12 finding (to be formalised in Phase 12) is that `calculateUnitStrength` applies modifiers in the order **Weather → TightBond → Horn → MoraleBoost**, whereas the rulebook §15 specifies **Weather → TightBond → MoraleBoost → Horn**. For a TB unit with printed strength 4, Horn + MB on its row, no weather:
- Rulebook: `4 → ×3 (TB) = 12 → +1 (MB) = 13 → ×2 (Horn) = 26` per unit.
- Code:     `4 → ×3 (TB) = 12 → ×2 (Horn) = 24 → +1 (MB) = 25` per unit.
- Per-unit delta: **1**.

### Constructible winner-flip scenario (all cards exist in the hardcoded NR deck)

**Player Close row:** 3× Blue Stripes Commando (base 4, TIGHT_BOND, Close) + 1× Olgierd von Everec (base 6, MORALE_BOOST source), Commander's Horn active on the row.

**Opponent total (any rows):** 88 exact.

**Rulebook calc — Player Close:**
- BSC: `4 → ×3 (TB, sameNameCount=3) = 12 → +1 (MB from Olgierd) = 13 → ×2 (Horn) = 26`. Three BSCs: **78**.
- Olgierd: `6 → no TB (different name) = 6 → +0 (MB excludes itself per §17.7) = 6 → ×2 (Horn) = 12`.
- **Rulebook Close total: 78 + 12 = 90.**

**Code calc — Player Close:**
- BSC: `4 → ×3 = 12 → ×2 (Horn) = 24 → +1 (MB, card is not MB, `moraleBoostCount=1` → `+1`) = 25`. Three: **75**.
- Olgierd: `6 → no TB = 6 → ×2 (Horn) = 12 → +0 (self-MB, `moraleBoostCount - 1 = 0`) = 12`.
- **Code Close total: 75 + 12 = 87.**

**Round outcome under each math:**
- Rulebook: Player 90 > Opponent 88 → **Player wins the round**; opponent loses a gem.
- Code:     Player 87 < Opponent 88 → **Opponent wins the round**; player loses a gem.

**Proof:** a 3-point Close-row delta on the player flips the rulebook-correct outcome to the inverse. All cards are in the active NR deck (BSC ×3 at `deckBuilder.ts:74-80`; Olgierd at `:159-160`; Horn ×2 at `:116-122`).

- **Asymmetry (🔀):** the same scenario with rows reversed would penalise the AI symmetrically — the order-of-ops bug is symmetric. But: a Horn/MB TB stack is **more likely on the human side** because the AI's `UnitStrategy` uses a heuristic that does not model the full calc (see F-5.17). The AI rarely assembles this stack; the human can target it explicitly. So the *incidence* of the bug skews asymmetric in practice.
- **Status:** ❌ (rule-level math error) + 🔀 (asymmetric incidence via AI's different planner).

---

## F-5.12  R-004 Spy Round-End Trace (carry-forward 2)

**Card used:** Thaler (`northern-realms.ts:313-321`), `CardAbility.SPY`, Siege row, strength 1.

### Turn-by-turn table

| Turn | Action | Card location after action |
|---|---|---|
| R1 t=0 | Human selects Thaler and plays (any Siege row click). | `handleRowClick` → `playCardAction({player:'player', card: Thaler, row: SIEGE})`. |
| R1 t=0 | Thunk: case `CardAbility.SPY` → `handleSpyAction({player:'player', card, row})` (`gameThunks.ts:247-258`). | `dispatch(playCardBasic({player:'opponent', card, row:SIEGE}))` → Thaler pushed onto `state.opponentBoard.siege.cards`. `dispatch(removeCardFromHand({player:'player', cardId: Thaler.id}))`. `dispatch(drawCards({player:'player', count:2}))`. |
| R1 t=0, post | state.player.hand: −Thaler, +2 cards. state.opponent.hand: unchanged. state.opponentBoard.siege: +Thaler. | Thaler lives on AI's board. |
| R1 various | Both players continue. | Thaler still on AI's siege row, contributes strength to AI's total (incorrect per rule — Spy Strength counts for opponent). Wait — §12 says "its Strength counts toward the opponent's total." The "opponent" in the rulebook is the opponent of the Spy's controller. Controller = human; opponent of human = AI; AI's total includes Thaler. ✓ So during play, the code is correct — Thaler's strength counts for AI. |
| R1 round-end | Both passed. `gameSlice.endRound:282-289`: sweep opponentBoard.siege into `opponentDiscardCards`. | **Thaler → `state.opponent.discard`.** |
| R1 end → R2 | `state.opponent.discard` now contains Thaler (the human's card). state.player.discard: unchanged (Thaler never went there). | |
| R2 Medic — human | `handlePlayerMedicChain` / `GameCardsSelector` lists `state.player.discard` filtered to `type==UNIT && ability!==DECOY`. **Thaler is NOT in player.discard.** Human cannot revive Thaler. | ❌ Rule §17.2 says human should be able to Medic-back their own Spy. |
| R2 Medic — AI | `MedicStrategy.simulateMedicChain:394` reads `state.opponent.discard`. **Thaler IS there.** AI can and will revive Thaler (SpyStrategy would prefer Thaler for `score=12` ties). | |
| R2 AI revives Thaler | `executeAIMedicChain` `case CardAbility.SPY` (`gameThunks.ts:298-307`):<br>`dispatch(playCardBasic({player:'player', card: Thaler, row: SIEGE, skipTurnSwitch: true}))` — AI's `player='opponent'`, `oppositePlayer='player'`, so Thaler placed on **human's** Siege row. `dispatch(drawCards({player:'opponent', count:2}))` — **AI draws 2**. | Thaler's strength now on human's board. AI card-advantage +2. |
| R2 round-end | Sweep: `playerBoard.siege` → `playerDiscardCards`. | Thaler → `state.player.discard`. |
| R3 | Medic-reachability inverted: human CAN now revive Thaler (in their own discard); AI cannot. | The ping-ponging continues. |

### Per-rule damage

- **Rule (§9):** "When a card leaves the battlefield, it goes to **its controller's** discard pile. This includes 'Spy' cards." Violated at R1 round-end (Thaler to AI discard). Violated again at R2 round-end (Thaler to human discard — but controller is still the original human, so this was accidentally correct). The error oscillates.
- **Rule (§17.3):** "Your Spy goes to your discard pile at round end. You can Medic or Eredin it back later." Violated as traced.
- **AI cheating implication:** AI gains a free 2-draw opportunity off a card the human originally paid for. Not listed as "AI cheating" in the Phase 16 checklist (the AI is following the legal Medic rules — the bug is in where the Spy was routed at round-end, which is R-004).

**Symmetric manifestation:** if AI played a Spy (e.g. Shilard, Stefan, Vattier — none in the NR deck, but if NG were playable), the Spy would sit on `state.playerBoard` and at round end be swept to `state.player.discard` — symmetrically wrong. The bug hits whoever played the Spy.

---

## F-5.13  Decoy Double-Tracked at Round End — `R-012` (carry-forward 3)

### Exact flow

`gameThunks.playCardAction:114-128` (Decoy branch):

```ts
if (card.type === CardType.SPECIAL) {
  dispatch(removeCardFromHand({ player, cardId: card.id }));
  switch (card.ability) {
    case CardAbility.DECOY:
      if (targetCard) {
        dispatch(addCardToHand({ player, card }));                         // 1. re-add
        await dispatch(handleDecoyAction({ player, decoyCard: card, targetCard }));
        …
      }
      break;
```

Then `handleDecoyAction:219-236`:

```ts
dispatch(removeCardFromHand({ player, cardId: decoyCard.id }));           // 2. re-remove
dispatch(removeCardFromBoard({ player, cardId: targetCard.id, row: targetRow }));
dispatch(addCardToHand({ player, card: targetCard }));
const decoyForBoard = { ...decoyCard, type: CardType.UNIT, strength: 0 } as UnitCard;
dispatch(playCardBasic({ player, card: decoyForBoard, row: targetRow })); // 3. board push — SAME id
dispatch(addSpecialCardToBoard({ player, card: decoyCard }));             // 4. specialCardsOnBoard push — SAME id
```

**End state after a Decoy:**
- `state.playerBoard[targetRow].cards` contains `{id: <decoyId>, type: UNIT, strength: 0, ability: DECOY, …}` (the `decoyForBoard`).
- `state.specialCardsOnBoard.player` contains the original `decoyCard` object (type: SPECIAL, same id).
- `state.player.hand` has neither (correctly — it's been played).

### Round-end sweep (`gameSlice.endRound:273-280`):

```ts
const playerDiscardCards = [
  …,
  ...state.playerBoard.close.cards,    // ← sweep 1 contains decoyForBoard (SAME id)
  …,
  ...state.specialCardsOnBoard.player, // ← sweep 2 contains decoyCard       (SAME id)
  …
];
```

**Both references push into the same `playerDiscardCards` array.** `state.player.discard` ends the round with **two entries of the same `id`** for every Decoy played.

### Horn/Weather do NOT double-count

For reference:
- **Horn** (`gameThunks.ts:130-136`) does `activateHorn` (boolean) and `addSpecialCardToBoard` — the Horn card is NOT pushed to `playerBoard.<row>.cards`. Single discard reference at round end. ✓
- **Weather** (`gameThunks.ts:138-144`) does `addWeatherEffect` + `addWeatherCard` — the card is on `weatherCards`, not on board rows. Single discard reference. ✓
- **Decoy** is the only SPECIAL that rides both rails.

### Impact

- **Discard count inflates by +1 per Decoy.** Visible in UI `player.discard.length`.
- **Medic filter (`c.ability !== CardAbility.DECOY`)** — excludes both entries, no mis-revival.
- **Eredin ("Restore a Unit or Special from discard") — 🕳️** but when implemented would see two Decoy entries.
- **AI `MedicStrategy` discard traversal** — iterates `state.opponent.discard` filtered to `c.type === UNIT && c.ability !== DECOY`; the Decoy entries pass the UNIT filter only for the decoyForBoard copy (`type: UNIT`) but fail the DECOY filter. Both rejected. Safe today.
- **Hero immunity matrix (Phase 11)** — `decoyForBoard` has `type: CardType.UNIT` while on the board. Any `filter(c => c.type === CardType.UNIT)` without `ability !== DECOY` will treat the placeholder as a Unit. Relevant for `findScorchTargets`, `findCloseScorchTargets`, row-strength counting. Phase 11 row: latent issue.

**Status:** new root cause `R-012`, severity medium-low (latent, cosmetic today). Will re-surface in Phase 9, Phase 11, potentially Phase 13.

### Proposed fix

Pick one rail. Either push `decoyCard` onto `playerBoard.<row>.cards` (as a SPECIAL-typed placeholder, not UNIT) and skip `specialCardsOnBoard`, OR keep `specialCardsOnBoard` and do NOT push to `playerBoard.<row>.cards` (row strength would need to treat the Decoy differently — maybe a `ghostCards` slot). Today's dual push is the problem.

---

## F-5.14  R-011 × Round-End Sweep Check (carry-forward 4)

One-paragraph answer:

R-011 introduces duplicate card IDs (one in hand, a copy still in deck — or a lost card from the deck head). The round-end sweep at `gameSlice.endRound:273-289` iterates **only** `state.playerBoard.*.cards`, `state.specialCardsOnBoard.*`, and `state.weatherCards` — **it does not touch `state.player.hand` or `state.player.deck`**. Duplicates in hand/deck therefore survive the sweep unchanged. The sweep itself is not the site of the wrong cleanup; `endRound` is duplicate-safe. The real damage lands later: a duplicate in the deck can be drawn (Spy's `drawCards`, hypothetical Northern Realms round-win draw) and surface into the hand, co-existing with another copy that may already have been played to the board. At that point, standard `filter(c => c.id !== cardId)` removal patterns (e.g. `playCardBasic:136`, `removeCardFromHand`, `removeCardFromBoard`) over-remove — a single "play this card" action can evict all duplicate references in one step. Net: R-011's consequences are felt in **draw** and **play**, not in the round-end sweep. Full cascade trace deferred to Phase 15.

---

## F-5.15  `handleRoundEnd` Stale-State Closure — Flagged (carry-forward 5)

`ReduxGameManager.handleRoundEnd:100-143` reads selector-derived `gameState` from component closure at the time the effect fires:

```ts
const playerScore = calculateTotalScore(gameState.playerBoard, new Set(gameState.activeWeatherEffects));
const opponentScore = calculateTotalScore(gameState.opponentBoard, new Set(gameState.activeWeatherEffects));
// …
dispatch(endRound({ playerScore, opponentScore }));
// …
if (gameState.player.lives === 1 || gameState.opponent.lives === 1) { /* see R-008 in Phase 6 */ }
```

**Timing window:**
1. A reducer (`playerPass` or `opponentPass`) synchronously sets `gamePhase = 'roundEnd'` and both `passed = true`.
2. React re-renders `ReduxGameManager` with `gameState` reflecting the post-pass state (but pre-`endRound`).
3. `useEffect` at line 146-150 fires, calls `handleRoundEnd`.
4. `handleRoundEnd` reads `gameState` from the render's closure — which is the state at step 2.
5. Dispatches `endRound` → lives decrement, board sweep, etc.

**Exploitability check:**
- During steps 2–5 (between render and `handleRoundEnd`'s dispatch), `canPlayerAct` returns `false` (gated on `gamePhase === 'playing'`, now `'roundEnd'`).
- AI's scheduling `useEffect` gate is also false (`gamePhase === 'playing'` required).
- No other action surfaces exist — no `setTimeout`-driven background work dispatches into `gameState`.
- Therefore the closure-captured values cannot be invalidated by any in-game actor before `handleRoundEnd` runs.

**Status:** F-5.15 — closure-captured, **not currently exploitable** at the rules level. Full async audit (including the setTimeout inside `handleRoundEnd` at `:132-141` that reads `gameState` 1s later — where state CAN have changed) is deferred to Phase 14. That inner `setTimeout` is more concerning than the outer closure read because it spans `endRound`'s dispatch.

**Proposed fix:** replace closure reads with `getState()`-equivalent inside a thunk. Phase 14 will formalise.

---

## F-5.16  Clear Weather + Round-End Cleanup (carry-forward 6)

One-line check as asked:

**✅** `clearWeatherEffects` reducer (`gameSlice.ts:231-240`) already drains `weatherCards[]` and moves each card to its controller's discard at the moment Clear Weather lands; at subsequent round-end the `weatherCards` array is empty so no weather state leaks into round 2. AI's Foltest `CLEAR_WEATHER` leader ability (wired via `playCardAction` LEADER branch at `gameThunks.ts:102-104`) uses the same reducer — identical cleanup path.

---

## F-5.17  AI Evaluator Uses Its Own Mini-Calc, Divergent from `calculateTotalScore`  🔀

> **Context:** the round-resolution score uses `calculateTotalScore`. The AI's *decision-time* score model is separate.

- `UnitStrategy.evaluateUnitValue:552-569` implements its own mini strength calc:
  ```ts
  let score = card.strength;
  if (card.ability === CardAbility.TIGHT_BOND) {
    const sameNameCount = state.opponentBoard[card.row].cards.filter(c => c.name === card.name).length;
    if (sameNameCount > 0) score *= (sameNameCount + 1);
  }
  if (card.ability === CardAbility.MORALE_BOOST) {
    const rowUnitCount = state.opponentBoard[card.row].cards.length;
    score += rowUnitCount;
  }
  return score;
  ```
- **Does NOT model:** weather, horn, opponent's board state, hero immunity, order-of-ops. Notably: `sameNameCount + 1` implies pre-placement (counting allies already present plus self), whereas `calculateRowStrength:67-69` uses `sameNameCount` directly (post-placement, card is already in the row).
- **Consequence:** the AI's ranking of candidate plays can disagree with the true resulting board score. When combined with the Phase 12 order-of-ops bug (F-5.11), the AI's planner and the live engine disagree in different ways, producing suboptimal-but-self-consistent AI behavior.
- **Status:** 🔀 between AI planner and live engine. Phase 15 will audit more broadly; this finding is anchored in Phase 5 because it directly affects round outcomes.

---

## Round-End Cleanup — Atomicity

### F-5.18  `endRound` is a single reducer, atomic with respect to React  ✅

- **Code path:** All of `endRound`'s body runs in one reducer invocation. Redux dispatches are synchronous. No async between score determination, decrement, sweep, reset, round++, and phase transition.
- **Observation:** Barring the closure-captured `gameScore` / `lives` reads in `ReduxGameManager.handleRoundEnd` (F-5.15, F-5.17), round-end is atomic.

### F-5.19  `endRound` is NOT idempotent  ⚠️ (latent — see F-4.15)

- **Code path:** `endRound` always decrements `lives` (unconditional based on score), increments `currentRound`, sweeps board. No guard `if (state.gamePhase !== 'roundEnd') return;`.
- **Observation:** If the reducer fires twice for a single logical round-end, the effects compound catastrophically (lives over-decremented, rounds skipped, board double-swept). F-4.15 already identified one latent path (the dead 500ms effect). A guard `if (state.currentRound !== targetRound) return;` or `if (state.gamePhase !== 'roundEnd') return;` would harden this.
- **Proposed fix:** Add idempotency guard as the first line of `endRound`.

---

## Phase 5 Findings Summary

| ID | Status | Rule | Title |
|---|---|---|---|
| F-5.1 | ✅ | §8.3 | Both-passed triggers round-end phase transition |
| F-5.2 | ✅ (+ Phase 12 caveat) | §8.3 | Strength calc feeds `endRound` |
| F-5.3 | ⚠️ + 🕳️ | §8.3 | Gem decrement correct except Nilfgaard tie-win missing |
| F-5.4 | ❓ | §8.3 | Tie draw → next-starter ambiguity |
| F-5.5 | ❌ via `R-004` | §8.3, §9 | Sweep routes by board side not controller; Spy bug |
| F-5.6 | 🕳️ | §11, §17.17 | Monsters keep-one missing |
| F-5.7 | ❌ `R-001` | §8.3 | Winner starts next round — code randomizes |
| F-5.8 | 🕳️ | §11, §17.18 | Skellige round-3 return missing |
| F-5.9 | 🕳️ | §11 | Northern Realms draw-on-win missing |
| F-5.10 | 🕳️ | §11, §17.13 | Nilfgaard tie-win missing |
| F-5.11 | ❌ 🔀 | §15 | **Order-of-ops can flip a round outcome — BSC+Olgierd+Horn trace constructs a 1-point winner flip** |
| F-5.12 | ❌ via `R-004` | §9 | **Spy round-end routing trace — Thaler ping-pongs between discards** |
| F-5.13 | ❌ `R-012` | §8.3 | **Decoy double-counted in discard at round end** |
| F-5.14 | ℹ️ | — | R-011 × round-end sweep: sweep is duplicate-safe; damage surfaces later |
| F-5.15 | ⚠️ (not exploitable) | — | `handleRoundEnd` closure-captured `gameState`; frozen by both-passed gate — Phase 14 defers inner `setTimeout` case |
| F-5.16 | ✅ | §14 | Clear Weather cleanup doesn't leak into round 2 |
| F-5.17 | 🔀 | §15 | AI's `evaluateUnitValue` diverges from `calculateTotalScore` |
| F-5.18 | ✅ | — | `endRound` reducer is atomic |
| F-5.19 | ⚠️ | — | `endRound` not idempotent; latent double-fire risk |

**Counts:** ✅ 4 — ❌ 4 (two from root causes) — ⚠️ 3 — 🕳️ 5 — 🔀 2 (one ❌-tagged) — ❓ 1 — ℹ️ 1.

**Top single finding:** F-5.11 — the Phase 12 order-of-ops bug is **not just a display error**, it can flip a round outcome in a constructible production scenario. Paired with F-5.12 which establishes R-004's practical consequence beyond "cards in wrong pile."

**Root causes cited:**
- `R-001` — F-5.7 (random next-starter)
- `R-003` — F-5.2 (Set conversion at every score call)
- `R-004` — F-5.5, F-5.12
- `R-011` — F-5.14
- `R-012` — F-5.13 (NEW root cause, added to `audit/01-plan.md`)

**Cross-reference to Phase 6:** `R-008` mentioned inline in F-5.15 but belongs to Phase 6 (`handleRoundEnd`'s `gameState.player.lives === 1` pre-decrement check).

---

**End of Phase 5.** Stopping. Awaiting `continue` to begin Phase 6 (Game End).
