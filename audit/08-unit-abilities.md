# Phase 8 — Unit Abilities

> Covers rulebook §12 plus edge cases in §17.2, §17.3, §17.5–§17.11, and §17.22.

---

## Inputs

- Rules: `docs/gwent-rules.md:236-252`, `docs/gwent-rules.md:354-366`, `docs/gwent-rules.md:370-379`, `docs/gwent-rules.md:412-461`, `docs/gwent-rules.md:521-526`.
- Active play thunk: `src/store/thunks/gameThunks.ts:92-195`.
- Unit ability thunks: `src/store/thunks/gameThunks.ts:242-359`, `src/store/thunks/gameThunks.ts:397-429`, `src/store/thunks/gameThunks.ts:455-581`.
- Strength helpers: `src/utils/gameHelpers.ts:16-96`, `src/utils/gameHelpers.ts:246-371`.
- Human UI: `src/components/game/ReduxGameManager.tsx:194-292`, `src/components/game/GameCardsSelector.tsx:84-100`.
- AI strategy: `src/ai/strategy.ts:262-277`, `src/ai/strategy.ts:378-499`, `src/ai/strategy.ts:502-570`.

---

## F-8.1  Agile human placement works, AI ignores alternate rows  ❌ 🔀

- **Status:** ❌ Bug + 🔀 Asymmetric
- **Rule:** `docs/gwent-rules.md:242` — "Place on either the **Close Combat** *or* **Ranged Combat** row. **Cannot be moved once placed.**"
- **Rule:** `docs/gwent-rules.md:523-524` — "Agile: Place on either Close Combat **or** Ranged Combat — choose at placement." / "\"Cannot be moved once placed.\" So you cannot later relocate an Agile unit to the other row."
- **Human code path:** `src/components/game/ReduxGameManager.tsx:233-237`
  ```ts
  if (selectedCard.type === CardType.UNIT || selectedCard.type === CardType.HERO) {
    const unitCard = selectedCard as UnitCard;

    if (unitCard.row === row || unitCard.availableRows?.includes(row)) {
  ```
- **AI code path:** `src/ai/strategy.ts:545-548`
  ```ts
  return {
      card: unitCard,
      row: unitCard.row,
      score
  };
  ```
  and `src/ai/strategy.ts:552-566`
  ```ts
  private evaluateUnitValue(card: UnitCard, state: GameState): number {
      let score = card.strength;
      ...
      if (card.ability === CardAbility.MORALE_BOOST) {
          const rowUnitCount = state.opponentBoard[card.row].cards.length;
          score += rowUnitCount;
      }
  ```
- **Observation:** The human can choose any `availableRows` entry. The AI always evaluates and plays `unitCard.row`. Concrete active-card trace from Phase 3 still applies: `Olgierd von Everec` has `row: CLOSE`, `availableRows: [CLOSE, RANGED]`, and `MORALE_BOOST` (`src/data/cards/neutral.ts:124-132`). Under Biting Frost, the human can place Olgierd on Ranged; the AI evaluates and plays Close. This is a rules asymmetry and a decision-quality bug.
- **Proposed fix:** Have `UnitStrategy` evaluate each legal placement row (`availableRows ?? [row]`) and pass the chosen row into both scoring and `playCardAction`.

## F-8.2  Unit Commander's Horn is not implemented  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:243` — "Doubles the Strength of all **other** Unit Cards on this card's row — unless there is already a horn-icon card affecting this row."
- **Rule:** `docs/gwent-rules.md:414-418` — "Only one horn effect per row." / "Unit Horn wording says it doubles \"all **other** Unit Cards on this card's row.\" So a Unit-Horn card itself uses its own printed Strength (not doubled)." / "Horn is an ongoing effect — if the Horn-providing Unit is Decoyed or Scorched, the Horn effect ends immediately."
- **Human code path:** `src/store/thunks/gameThunks.ts:167-188`
  ```ts
  switch (unitCard.ability) {
    case CardAbility.SPY:
      await dispatch(handleSpyAction({ player, card: unitCard, row }));
      break;
    case CardAbility.MEDIC:
      await dispatch(handleMedicAction({ player, card: unitCard, row, decision }));
      break;
    case CardAbility.MUSTER:
      await dispatch(handleMusterAction({ player, card: unitCard, row }));
      break;
    case CardAbility.SCORCH_CLOSE:
      await dispatch(handleScorchCloseAction({ player, card: unitCard, row }));
      break;
    default:
      dispatch(playCardBasic({ player, card: unitCard, row }));
      break;
  }
  ```
- **AI code path:** Same `playCardAction` execution. AI `UnitStrategy` also treats Unit Horn as a regular unit because no `CardAbility.COMMANDERS_HORN` unit case exists in `src/ai/strategy.ts:502-570`.
- **Observation:** Active card data includes Dandelion as a Unit with `CardAbility.COMMANDERS_HORN` (`src/data/cards/neutral.ts:63-71`), but the unit switch has no horn case. Live strength calculation only reads `row.hornActive` (`src/utils/gameHelpers.ts:39-42`), which is set by Special Horn's `activateHorn`, not by a Horn Unit. Dandelion therefore contributes only its printed 2 Strength and never doubles other units. If a future patch mapped Unit Horn to `hornActive`, it would still need to exclude the Horn Unit itself, unlike current Special Horn handling which doubles all non-Hero units.
- **Proposed fix:** Represent row horn sources explicitly rather than as a boolean. During strength calculation, apply Unit Horn to other non-Hero units only and remove the effect when the source Unit leaves the row.

## F-8.3  Human Medic selector can expose Decoy-as-Unit targets  ❌ 🔀

- **Status:** ❌ Bug + 🔀 Asymmetric
- **Rule:** `docs/gwent-rules.md:244` — "Choose one Unit Card in the discard pile **excluding Heroes**, and **play it immediately**."
- **Rule:** `docs/gwent-rules.md:365-366` — "If the discard pile has no legal (non-Hero) Unit Card, does the Medic still play? Yes..." / "Can Medic revive an opponent's card from their discard pile? No..."
- **Human code path:** Initial gate at `src/components/game/ReduxGameManager.tsx:238-245`
  ```ts
  if (unitCard.ability === CardAbility.MEDIC && playerDiscard.length > 0) {
    const validTargets = playerDiscard.filter((c: any) => 
      c.type === CardType.UNIT && c.ability !== CardAbility.DECOY
    );
    if (validTargets.length > 0) {
      dispatch(showCardsSelector('medic'));
      return;
    }
  }
  ```
  but selector UI at `src/components/game/GameCardsSelector.tsx:84-87`
  ```ts
  {title === 'medic' &&
    gameState.player.discard
      .filter((card) => card.type === CardType.UNIT)
  ```
- **AI code path:** `src/ai/strategy.ts:393-398`
  ```ts
  const validTargets = state.opponent.discard.filter(c =>
    c.type === CardType.UNIT &&
    c.ability !== CardAbility.DECOY &&
    !chainedCards.has(c.id)
  ) as UnitCard[];
  ```
- **Observation:** Ordinary Hero and Special cards are excluded by `CardType.UNIT`, but the human UI has drift: the gate excludes `ability !== DECOY`, while the actual modal lists every `CardType.UNIT`. Because R-012 creates a Decoy board placeholder with `type: CardType.UNIT`, a discard containing that polluted Decoy plus any valid unit can show Decoy as a Medic target. The AI strategy consistently excludes `ability !== DECOY`. This is a human-only invalid target surface.
- **Proposed fix:** Centralize `isLegalMedicTarget(card)` and use it in the gate, modal list, player thunk, and AI strategy.

## F-8.4  Player Medic can revive multiple non-Medics with one Medic  ❌ 🔀

- **Status:** ❌ Bug + 🔀 Asymmetric
- **Rule:** `docs/gwent-rules.md:356-358` — "Medic plays the revived unit immediately, and Unit abilities resolve immediately after placement." / "The revived Medic **also** resolves its ability — it revives another Unit from the discard pile."
- **Human code path:** `src/store/thunks/gameThunks.ts:533-553`
  ```ts
  } else {
    // Revived a regular unit/hero - continue chain if possible
    dispatch(playCardBasic({ 
      player: 'player', 
      card: reviveCard as UnitCard, 
      row: (reviveCard as UnitCard).row,
      skipTurnSwitch: true
    }));
    
    // Check if there are more medics or valid targets to continue the chain
    const currentState = getState();
    const placedMedicIds = new Set(currentState.ui.medicChainState.placedMedics.map(m => m.id));
    const remainingTargets = currentState.game.player.discard.filter(card => 
      card.type === CardType.UNIT && 
      card.ability !== CardAbility.DECOY &&
      !placedMedicIds.has(card.id)
    );
    
    if (remainingTargets.length > 0 && currentState.ui.medicChainState.isChaining) {
      dispatch(showCardsSelector('medic'));
  ```
- **AI code path:** `src/store/thunks/gameThunks.ts:314-327`
  ```ts
  case CardAbility.MEDIC:
    dispatch(playCardBasic({ 
      player, 
      card: currentTarget, 
      row: currentTarget.row,
      skipTurnSwitch: true
    }));
    
    // Continue the chain with remaining targets
    if (remainingTargets.length > 0) {
      await dispatch(executeAIMedicChain({ player, targets: remainingTargets }));
    }
    break;
  ```
  Regular revived units hit the AI default branch at `src/store/thunks/gameThunks.ts:329-336`, which does not continue the chain.
- **Observation:** The human chain continues after reviving a regular non-Medic as long as `isChaining` is still true and the discard has remaining targets. That allows one Medic to revive multiple cards without reviving another Medic. The AI chain only continues when the revived target itself is a Medic and strategy supplied remaining chained targets. This is both a rule bug and a human/AI asymmetry.
- **Proposed fix:** End the player Medic chain immediately after any non-Medic target resolves. Only show another Medic selector when the revived card is itself a Medic.

## F-8.5  Medic-revived Muster and Unit Scorch do not consistently resolve on-play abilities  ❌ 🔀

- **Status:** ❌ Bug + 🔀 Asymmetric
- **Rule:** `docs/gwent-rules.md:356` — "Medic plays the revived unit immediately, and Unit abilities resolve immediately after placement."
- **Rule:** `docs/gwent-rules.md:360` — "Medic revives a Muster unit. The Muster fires, pulling all same-name copies from your **hand and deck** (not the discard pile)."
- **Human code path:** `src/store/thunks/gameThunks.ts:486-533` has special cases only for `SPY` and `MEDIC`; every other revived card falls through to `playCardBasic` at `src/store/thunks/gameThunks.ts:533-540`.
- **AI code path:** `src/store/thunks/gameThunks.ts:297-337`
  ```ts
  switch (currentTarget.ability) {
    case CardAbility.SPY:
      ...
    case CardAbility.SCORCH_CLOSE:
      await dispatch(handleScorchCloseAction({ player, card: currentTarget, row: currentTarget.row }));
      break;
    case CardAbility.MEDIC:
      ...
    default:
      dispatch(playCardBasic({ player, card: currentTarget, row: currentTarget.row, skipTurnSwitch: true }));
      break;
  }
  ```
- **Observation:** Both paths fail to trigger Muster when a Medic revives a Muster unit; they place the revived Muster as a plain unit. The AI path does trigger `SCORCH_CLOSE` for a revived Unit Scorch, but the human path does not. Spy and Medic are handled in both paths. Morale Boost and Tight Bond work after plain placement because they are ongoing strength-calculation effects, not one-shot thunks.
- **Proposed fix:** Route revived cards through a shared "play from discard" resolver that applies the same on-play switch as hand-play, while avoiding duplicate hand removal.

## F-8.6  Morale Boost live scoring is implemented for both seats  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:245` — "Add **+1 Strength** to all units on the row (**excluding itself**)."
- **Rule:** `docs/gwent-rules.md:422-425` — "\"Add 1 Strength to all units on the row (excluding itself).\"" / "Morale Boost does not affect Heroes on the row — Heroes are immune."
- **Human code path:** `src/utils/gameHelpers.ts:23-25`, `src/utils/gameHelpers.ts:44-50`
  ```ts
  if (card.type === CardType.HERO) {
    return card.strength; // Heroes are immune to effects
  }
  ...
  if (card.ability === CardAbility.MORALE_BOOST) {
    strength += (moraleBoostCount - 1);
  } else {
    strength += moraleBoostCount;
  }
  ```
- **AI code path:** Same live score path for board totals and round resolution. AI heuristic estimates Morale Boost at `src/ai/strategy.ts:563-566`:
  ```ts
  if (card.ability === CardAbility.MORALE_BOOST) {
      const rowUnitCount = state.opponentBoard[card.row].cards.length;
      score += rowUnitCount;
  }
  ```
- **Observation:** Live scoring correctly excludes the Morale Boost unit itself and excludes Heroes via the early return. The AI heuristic is approximate and row-fixed for Agile cards (F-8.1), but once a Morale Boost unit lands, the shared live calculation applies to both seats. Phase 12 still owns the broader modifier-order bug.
- **Proposed fix:** No rules fix for live Morale Boost. Align AI valuation with the shared strength calculator when Phase 15 unifies decision heuristics.

## F-8.7  Muster duplicates deck cards and does not shuffle the deck  ❌

- **Status:** ❌ Bug
- **Rule:** `docs/gwent-rules.md:246` — "Find **all specified cards** (typically same-name or same-creature-group copies) in both the **hand and deck**, and play them immediately. Then shuffle the deck."
- **Rule:** `docs/gwent-rules.md:455-457` — "\"Find all specified cards in the hand and deck and play them immediately, then shuffle the deck.\"" / "Does NOT pull from discard pile — only hand and deck." / "Already-played Muster units are not affected..."
- **Human code path:** `src/store/thunks/gameThunks.ts:350-358`
  ```ts
  const musterCards = findMusterCards(card, playerState.hand, playerState.deck);
  
  // Place original card
  dispatch(playCardBasic({ player, card, row }));
  
  // Place all muster cards in their appropriate rows
  musterCards.forEach((musterCard: any) => {
    dispatch(playCardBasic({ player, card: musterCard, row: musterCard.row }));
  });
  ```
  `playCardBasic` removes only from hand at `src/store/slices/gameSlice.ts:135-140`:
  ```ts
  state[playerKey].hand = state[playerKey].hand.filter(c => c.id !== card.id);
  if ((card.type === 'unit' || card.type === 'hero') && row) {
    state[boardKey][row].cards.push(card as UnitCard);
  }
  ```
- **AI code path:** Same `handleMusterAction` execution when AI plays a Muster unit. The AI has no dedicated Muster target resolver; `UnitStrategy` returns normal unit decisions at `src/ai/strategy.ts:545-548`.
- **Observation:** `findMusterCards` correctly searches hand + deck and not discard, but deck-sourced Muster cards are never removed from `state[player].deck`; `playCardBasic` filters hand only. This creates duplicate live cards: one copy on board and the same ID still in deck. The deck is also never shuffled after Muster. Hand-sourced copies are removed because `playCardBasic` filters hand by ID. Concrete active card group: `Gaunter O'Dimm` and `Gaunter O'Dimm: Darkness` are the only `CardAbility.MUSTER` units in loaded data (`src/data/cards/neutral.ts:157-176`); the prefix grouping intentionally pulls the Darkness variants when base Gaunter is played. I found no non-Muster false-positive prefix collision in current loaded data, but the `startsWith` approach is fragile and should become explicit group metadata.
- **Proposed fix:** Move each Muster card from its actual zone to board, remove deck-sourced cards from deck, then shuffle the remaining deck. Replace name-prefix matching with an explicit muster group ID.

## F-8.8  Tight Bond is row-scoped in code; rulebook side-scope is Derived  ❓

- **Status:** ❓ Rulebook silent / design decision
- **Rule:** `docs/gwent-rules.md:247` — "Multiply this Unit's Strength by the **number of allies with the same name** currently on your side of the battlefield (including itself)."
- **Rule:** `docs/gwent-rules.md:429-431` — "\"Multiply the Strength of this Unit by the number of allies with the same name.\"" / "\"Allies\" means units on **your side**. **[Derived — the rulebook does not explicitly say cross-row or same-row.]**" / "Base Strength is multiplied — not current effective Strength."
- **Human code path:** `src/utils/gameHelpers.ts:66-76`
  ```ts
  const sameNameCardsInRow = card.ability === CardAbility.TIGHT_BOND
    ? cards.filter(c => c.name === card.name).length
    : 1;
  ```
- **AI code path:** `src/ai/strategy.ts:555-560`
  ```ts
  if (card.ability === CardAbility.TIGHT_BOND) {
      const sameNameCount = state.opponentBoard[card.row].cards
          .filter(c => c.name === card.name).length;
      if (sameNameCount > 0) {
          score *= (sameNameCount + 1);
      }
  }
  ```
- **Observation:** Live scoring counts same-name cards in the current row only; AI valuation matches that local policy. The rules file labels side-wide interpretation as `[Derived]`, so this is not a bug under the audit rules. It is a design decision to document before unification. Modifier order is wrong elsewhere (Phase 12), but the narrow Tight Bond scope is not a Phase 8 bug.
- **Proposed fix:** Decide row-scope vs side-scope as product policy. Then make live scoring, AI valuation, and card text agree.

## F-8.9  Unit Scorch works for normal units but inherits Spy controller-discard bug  ❌

- **Status:** ❌ Bug
- **Rule:** `docs/gwent-rules.md:248` — "If the opponent has a total Strength of **10 or higher** on the **row directly opposite** this card, the Unit Card(s) with the **highest Strength excluding Heroes** on that opposite row are sent to the discard pile."
- **Rule:** `docs/gwent-rules.md:404-409` — "Heroes are excluded from both Scorch effects." / "Ties are resolved by discarding all tied highest-Strength non-Hero units." / "Does Scorch affect Strength counted after Horn/Weather modifiers? ... Yes..."
- **Human code path:** `src/store/thunks/gameThunks.ts:406-427`
  ```ts
  dispatch(playCardBasic({ player, card, row }));
  ...
  const scorchResult = findCloseScorchTargets(gameStateWithSet, player === 'player');
  if (scorchResult) {
    const { cards: scorchTargets } = scorchResult;
    const oppositePlayer = player === 'player' ? 'opponent' : 'player';
    
    scorchTargets.forEach(target => {
      dispatch(removeCardFromBoard({ player: oppositePlayer, cardId: target.id, row: RowPosition.CLOSE }));
      dispatch(moveCardToDiscard({ player: oppositePlayer, card: target }));
    });
  }
  ```
- **AI code path:** Same execution thunk. AI chooses it via `src/ai/strategy.ts:511-523`, using `findCloseScorchTargets(state, false)`.
- **Observation:** Normal Unit Scorch behavior is mostly present: opposite close row, threshold via `calculateRowStrength`, highest non-Hero targets, and tied targets. The defect is ownership on discard. If a scorched target is a Spy sitting physically on `opponentBoard.close` but controlled by the player who played it, the code moves it to `oppositePlayer` discard by board side. That repeats `R-004` outside round-end cleanup. This affects both human and AI because the same thunk dispatches `moveCardToDiscard({ player: oppositePlayer, card: target })`.
- **Proposed fix:** Track card controller separately from board side and route scorched cards to the controller's discard pile.

## F-8.10  Spy immediate placement and draw are implemented, but cleanup ownership is wrong  ❌

- **Status:** ❌ Bug
- **Rule:** `docs/gwent-rules.md:249` — "**Play onto the opponent's battlefield** — its Strength counts toward the **opponent's** total. Then draw **two cards** from your deck."
- **Rule:** `docs/gwent-rules.md:370-373` — "Spy is a Unit Card played onto the **opponent's** side..." / "You draw 2 cards." / "Control still belongs to the player who played it." / "Your Spy goes to **your** discard pile at round end."
- **Human code path:** `src/store/thunks/gameThunks.ts:247-257`
  ```ts
  const oppositePlayer = player === 'player' ? 'opponent' : 'player';
  
  // Place spy on opponent's board (opposite player's board)
  dispatch(playCardBasic({ player: oppositePlayer, card, row }));
  
  // Remove spy from current player's hand
  dispatch(removeCardFromHand({ player, cardId: card.id }));
  
  // Draw 2 cards for the player who played the spy
  dispatch(drawCards({ player, count: 2 }));
  ```
- **AI code path:** Same `handleSpyAction`; AI chooses Spies through `src/ai/strategy.ts:262-275`.
- **Observation:** Immediate Spy play is correct for both seats: physical placement goes to the opponent board, and the controller draws up to two cards via deck slice semantics (`src/store/slices/gameSlice.ts:175-180`). The rule violation is delayed: neither board cards nor `UnitCard` state records controller, so round-end sweep sends the Spy to the physical board owner's discard (`src/store/slices/gameSlice.ts:273-293`). Phase 5 traced the concrete human Thaler case; Phase 8 confirms the Spy ability path itself creates the state that later loses controller ownership.
- **Proposed fix:** Add controller metadata when placing a Spy on the opposite board and use it for all discard transitions.

## F-8.11  Summon / Avenger is structurally missing  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:250` — "When this card is discarded from the battlefield in **any instance** (including at the end of a round), it is **replaced** with the corresponding card from the **side deck**."
- **Rule:** `docs/gwent-rules.md:446-449` — "Trigger: When the Summon card is **discarded from the battlefield**..." / "Replacement comes from the side deck." / "Decoy does NOT trigger Summon..." / "Scorch DOES trigger Summon..."
- **Human code path:** No `CardAbility.SUMMON` enum exists in `src/types/card.ts:26-49`. A related active card, Cow, uses `CardAbility.AVENGER` at `src/data/cards/neutral.ts:114-121`, but `playCardAction` has no `AVENGER` case (`src/store/thunks/gameThunks.ts:167-188`) and discard paths do not trigger replacement.
- **AI code path:** Same absence. `src/ai/strategy.ts` has no `AVENGER`/Summon strategy or side-deck model.
- **Observation:** Phase 2 already found no `sideDeck` field (`PlayerState` at `src/types/card.ts:110-119`). Without side-deck state and discard-trigger hooks, Summon/Avenger cannot work at round end, Scorch discard, or any other battlefield discard event. Decoy correctly would not trigger under current code because it returns to hand, but that is incidental rather than an implemented Summon rule.
- **Proposed fix:** Add side-deck state and a discard transition function that can trigger Summon/Avenger replacements only when a card is discarded from battlefield, not when returned to hand.

## F-8.12  Berserker and Unit Mardroeme are structurally missing  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:251-252` — "The specified card is played from the **side deck**, while the Berserker is **removed from the game entirely**..." / "Triggers the transformation of all \"Berserker\" cards on **its row**."
- **Rule:** `docs/gwent-rules.md:436-442` — "Mardroeme (Unit or Special) triggers transformation of all Berserkers **on its row**." / "Berserker is removed **from the game** (not discarded)." / "Mardroeme ongoing..."
- **Human code path:** No `CardAbility.BERSERKER` or `CardAbility.MARDROEME` enum exists in `src/types/card.ts:26-49`. `PlayerState` has no side deck or removed-from-game zone (`src/types/card.ts:110-119`).
- **AI code path:** Same absence; `src/ai/strategy.ts` contains no Berserker/Mardroeme evaluator.
- **Observation:** Skellige image assets include Berserker, Vildkaarl, Mardroeme, and related side-deck cards, but no Skellige card-data module or transformation logic exists. Unit Mardroeme and Special Mardroeme are both impossible today.
- **Proposed fix:** Add ability enums, card data, side-deck/removed-zone state, and a row-level transformation resolver shared by Unit and Special Mardroeme.

## F-8.13  Roach / Hero Muster is not implemented  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:238` — "These abilities appear on Unit Cards (icons below Strength). All resolve when the card is played, unless stated otherwise."
- **Rule:** `docs/gwent-rules.md:352` — "A Hero's *own* abilities still function. A Hero with Muster, Scorch, or Tight Bond printed on it still resolves that ability when played..."
- **Human code path:** Active hero data includes `CardAbility.MUSTER_ROACH` on Geralt and Ciri (`src/data/cards/neutral.ts:4-24`), but the play switch handles only `CardAbility.MUSTER` at `src/store/thunks/gameThunks.ts:177-179`:
  ```ts
  case CardAbility.MUSTER:
    await dispatch(handleMusterAction({ player, card: unitCard, row }));
    break;
  ```
- **AI code path:** AI redraw protects `MUSTER_ROACH` from redraw at `src/ai/strategy.ts:140-142`, but play execution still goes through the same `playCardAction` switch and no `MUSTER_ROACH` resolver exists.
- **Observation:** A Hero's own ability should resolve. Geralt/Ciri's Roach-style ability is represented in card data, but `MUSTER_ROACH` is never dispatched to any resolver. In the active Northern Realms deck, Geralt is included while Roach is not added by `defaultNorthernRealmsDeck`; even if Roach were present in deck, the ability would not fire.
- **Proposed fix:** Implement `MUSTER_ROACH` explicitly: when a triggering Hero is played, find Roach in deck/hand according to the chosen rule policy, place it immediately, and remove it from its source zone.

---

## Phase 8 Findings Summary

| ID | Status | Rule | Finding |
|---|---:|---|---|
| F-8.1 | ❌ 🔀 | §12 / §17.22 | Agile works for human row choice but AI always uses printed row. |
| F-8.2 | 🕳️ | §12 / §17.6 | Unit Commander's Horn, including Dandelion, is not implemented. |
| F-8.3 | ❌ 🔀 | §12 / §17.2 | Human Medic selector can expose Decoy-as-Unit targets; AI excludes them. |
| F-8.4 | ❌ 🔀 | §17.2 | Player Medic can over-chain after reviving non-Medics; AI does not. |
| F-8.5 | ❌ 🔀 | §17.2 | Medic-revived Muster and Unit Scorch do not consistently resolve on-play abilities. |
| F-8.6 | ✅ | §12 / §17.7 | Morale Boost live scoring works for both seats, with Phase 12 order caveat. |
| F-8.7 | ❌ | §12 / §17.11 | Muster duplicates deck cards and does not shuffle deck. |
| F-8.8 | ❓ | §12 / §17.8 | Tight Bond scope is row-local in code; side-wide interpretation is Derived. |
| F-8.9 | ❌ | §12 / §17.5 | Unit Scorch works normally but sends scorched Spies to board-side discard. |
| F-8.10 | ❌ | §12 / §17.3 | Spy immediate effect works, but cleanup/discard ownership is wrong. |
| F-8.11 | 🕳️ | §12 / §17.10 | Summon / Avenger is structurally missing. |
| F-8.12 | 🕳️ | §12 / §17.9 | Berserker and Unit Mardroeme are structurally missing. |
| F-8.13 | 🕳️ | §17.1 / §12 | Roach / Hero Muster is not implemented. |

---

## Carry-Forwards

- **Phase 9:** Decoy must be checked against Agile replay, Spy-on-opponent-board targeting, and R-012 Decoy-as-Unit pollution.
- **Phase 11:** Hero immunity matrix must include Unit Horn, Morale Boost, Medic, Unit Scorch, Monsters keeper, Skellige return, and Roach/Hero-own-ability exception.
- **Phase 12:** Modifier order remains wrong for Tight Bond + Morale Boost + Horn; Phase 8 only judged narrow ability presence.
- **Phase 15:** Collapse duplicated Medic execution (`handlePlayerMedicChain` vs `executeAIMedicChain`) and duplicated AI/live scoring assumptions (`UnitStrategy.evaluateUnitValue` vs `calculateUnitStrength`).
