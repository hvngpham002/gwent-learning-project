# Phase 9 — Special Cards

> Covers rulebook §13 plus Decoy / Scorch / Horn clarifications in §17.4–§17.6.

---

## Inputs

- Rules: `docs/gwent-rules.md:256-263`, `docs/gwent-rules.md:383-418`.
- Special-card dispatcher: `src/store/thunks/gameThunks.ts:113-160`.
- Decoy thunk: `src/store/thunks/gameThunks.ts:198-240`.
- Scorch thunk: `src/store/thunks/gameThunks.ts:361-395`.
- Horn state and cleanup: `src/store/slices/gameSlice.ts:223-250`, `src/store/slices/gameSlice.ts:269-307`.
- Human UI: `src/components/game/ReduxGameManager.tsx:167-292`, `src/components/player/PlayerArea.tsx:87-96`.
- AI strategy: `src/ai/strategy.ts:154-188`, `src/ai/strategy.ts:228-260`, `src/ai/strategy.ts:279-338`.

---

## F-9.1  Special Horn doubles non-Hero units for both seats  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:260` — "**Doubles** the Strength of **all Unit Cards** on its row. **Only one per row.**"
- **Rule:** `docs/gwent-rules.md:416-417` — "Special Horn wording says it doubles \"**all** Unit Cards on its row.\"" / "Horn does NOT double Heroes..."
- **Human code path:** `src/store/thunks/gameThunks.ts:130-135`
  ```ts
  case CardAbility.COMMANDERS_HORN:
    if (row) {
      dispatch(activateHorn({ player, row }));
      // Horn stays on board until round end - track it as special card on board
      dispatch(addSpecialCardToBoard({ player, card }));
    }
    break;
  ```
  `src/store/slices/gameSlice.ts:242-249`
  ```ts
  activateHorn: (state, action: PayloadAction<{
    player: 'player' | 'opponent';
    row: RowPosition;
  }>) => {
    const { player, row } = action.payload;
    const boardKey = player === 'player' ? 'playerBoard' : 'opponentBoard';
    state[boardKey][row].hornActive = true;
  },
  ```
- **AI code path:** Same thunk/reducer execution. AI chooses rows with `src/ai/strategy.ts:165-187`:
  ```ts
  const currentRow = state.opponentBoard[row];
  if (currentRow.hornActive) return; // Skip if horn already active
  ...
  return {
    card,
    row: bestRow,
    score: maxScoreIncrease
  };
  ```
- **Observation:** Once `hornActive` is true, live scoring doubles non-Hero units on that row through `calculateUnitStrength` (`src/utils/gameHelpers.ts:23-25`, `src/utils/gameHelpers.ts:39-42`). Heroes are protected by the early return. This shared live behavior works for human and AI. R-009 remains a representation problem, not a basic Special Horn scoring failure.
- **Proposed fix:** None for the narrow effect. See F-9.2/F-9.3 for row-slot and representation defects.

## F-9.2  Human can spend a second Special Horn on an already-horned row  ❌ 🔀

- **Status:** ❌ Bug + 🔀 Asymmetric
- **Rule:** `docs/gwent-rules.md:260` — "Only one per row."
- **Rule:** `docs/gwent-rules.md:414` — "Only one horn effect per row."
- **Human code path:** `src/components/game/ReduxGameManager.tsx:263-270`
  ```ts
  case CardAbility.COMMANDERS_HORN:
    dispatch(playCardAction({
      player: 'player',
      card: specialCard,
      row
    }));
    break;
  ```
  There is no `row.hornActive` check before dispatch.
- **AI code path:** `src/ai/strategy.ts:165-168`
  ```ts
  rows.forEach(row => {
    const currentRow = state.opponentBoard[row];
    if (currentRow.hornActive) return; // Skip if horn already active
  ```
- **Observation:** The reducer's `hornActive` boolean prevents stacking the numeric effect, but the human can still play and lose another Horn card onto the same row. `playCardAction` removes the card from hand and adds it to `specialCardsOnBoard`, while `activateHorn` just writes `true` again. The AI avoids horned rows. This is a human/AI asymmetry and a rule violation because the second Horn should not be playable on that row at all.
- **Proposed fix:** Add shared placement validation for Special Horn rows and have both UI and AI call it. Reject rows where a Special or Unit Horn source is already active.

## F-9.3  `R-009`: Horn source is decoupled from the board slot  ⚠️

- **Status:** ⚠️ Ambiguous / structural gap
- **Rule:** `docs/gwent-rules.md:260` — "Commander's Horn (Special) ... on its row."
- **Human code path:** `src/store/slices/gameSlice.ts:25-28`
  ```ts
  const initialBoardState: BoardState = {
    close: { cards: [], hornActive: false },
    ranged: { cards: [], hornActive: false },
    siege: { cards: [], hornActive: false }
  };
  ```
  and `src/store/slices/gameSlice.ts:223-228`
  ```ts
  addSpecialCardToBoard: (state, action: PayloadAction<{
    player: 'player' | 'opponent';
    card: Card;
  }>) => {
    const { player, card } = action.payload;
    state.specialCardsOnBoard[player].push(card);
  },
  ```
- **AI code path:** Same state model and reducer.
- **Observation:** The row only stores `hornActive: boolean`; the actual Horn card is separately appended to a player-level `specialCardsOnBoard` array with no row metadata. The UI renders a generic Horn card whenever the boolean is true (`src/components/player/PlayerArea.tsx:78-85`). That is enough for basic scoring and round-end discard, but it cannot answer "which Horn card is on which row" and cannot enforce row-slot identity cleanly. This is the root of R-009 and complicates Decoy/Scorch/cleanup audits.
- **Proposed fix:** Replace `hornActive` with a row slot containing the actual Horn source card and controller, or store row metadata in `specialCardsOnBoard`.

## F-9.4  Decoy target side and non-Hero filtering mostly work for both seats  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:261` — "Replace one Unit Card, **excluding Heroes**, on **the controlling player's side** of the battlefield. The replaced Unit returns to the player's hand."
- **Rule:** `docs/gwent-rules.md:383-390` — "Decoy replaces a Unit Card on your own side, excluding Heroes." / "The replaced Unit returns to your hand." / "Can you Decoy a Special Card like Commander's Horn? No..."
- **Human code path:** `src/components/game/ReduxGameManager.tsx:210-219`
  ```ts
  const handleBoardUnitClick = useCallback((card: UnitCard) => {
    if (!isDecoyActive || !selectedCard) return;
    if (card.type !== CardType.UNIT || card.ability === CardAbility.DECOY) return;

    dispatch(playCardAction({
      player: 'player',
      card: selectedCard,
      targetCard: card
    }));
  ```
  Player rows only pass `onUnitClick`; opponent rows do not (`src/components/game/ReduxGameManager.tsx:182-193`).
- **AI code path:** `src/ai/strategy.ts:301-305`
  ```ts
  Object.values(state.opponentBoard).forEach(row => {
    row.cards
      .filter((card: Card): card is UnitCard => 
        card.type === CardType.UNIT
      )
  ```
  Execution then searches only the acting player's board at `src/store/thunks/gameThunks.ts:206-216`.
- **Observation:** Human targeting is limited to the human board, excludes Heroes by requiring `CardType.UNIT`, and cannot target Special Horn because Horn is not in `row.cards`. AI target search is limited to `opponentBoard`, which is the AI's own side. A Spy physically on the opponent's side can be Decoyed by that side, matching the rulebook's derived Spy/Decoy note.
- **Proposed fix:** Keep side-limited targeting, but centralize the target predicate and include the Decoy placeholder exclusion used by the human path.

## F-9.5  `R-012`: Decoy is double-tracked and discarded twice  ❌

- **Status:** ❌ Bug
- **Rule:** `docs/gwent-rules.md:261` — "The Decoy itself has **Strength value 0** and now occupies that row slot."
- **Human code path:** `src/store/thunks/gameThunks.ts:227-236`
  ```ts
  const decoyForBoard = { 
    ...decoyCard, 
    type: CardType.UNIT, // Decoys become unit cards on board
    strength: 0 
  } as UnitCard;
  dispatch(playCardBasic({ player, card: decoyForBoard, row: targetRow }));
  
  // Track the decoy as a special card on board (for round end cleanup)
  dispatch(addSpecialCardToBoard({ player, card: decoyCard }));
  ```
  Round-end sweep at `src/store/slices/gameSlice.ts:273-279`:
  ```ts
  const playerDiscardCards = [
    ...state.player.discard,
    ...state.playerBoard.close.cards,
    ...state.playerBoard.ranged.cards,
    ...state.playerBoard.siege.cards,
    ...state.specialCardsOnBoard.player,
    ...playerWeatherCards
  ];
  ```
- **AI code path:** Same `handleDecoyAction` thunk and round-end sweep.
- **Observation:** Decoy is represented twice with the same ID: once as a fake `CardType.UNIT` in the row and once as the original Special in `specialCardsOnBoard`. At round end both entries are pushed to discard. Phase 5 traced this as R-012; Phase 9 confirms it is caused by the Special Decoy implementation itself. The bug is symmetric because AI Decoy uses the same thunk.
- **Proposed fix:** Pick one representation. Either store Decoy only in a row slot as a Special/zero-strength placeholder, or store it only in a dedicated row-special slot with row metadata; do not also append the same card to a player-level cleanup list.

## F-9.6  Decoy-as-Unit pollutes strength and Scorch target logic  ❌

- **Status:** ❌ Bug
- **Rule:** `docs/gwent-rules.md:261` — "The Decoy itself has **Strength value 0** and now occupies that row slot."
- **Rule:** `docs/gwent-rules.md:263` — "Send the Unit Card(s) with the **highest Strength, excluding Heroes**, on the **entire battlefield**..."
- **Human code path:** Decoy fake Unit creation at `src/store/thunks/gameThunks.ts:227-233`; Scorch target filter at `src/utils/gameHelpers.ts:256-258`
  ```ts
  row.cards.forEach(card => {
    if (card.type === CardType.UNIT) {
      const unitCard = card as UnitCard;
  ```
- **AI code path:** Same live helper. AI Decoy target search also treats row `CardType.UNIT` entries as candidates at `src/ai/strategy.ts:301-305`, though its scoring threshold usually prevents picking Decoy placeholders.
- **Observation:** The rule says Decoy has 0 Strength and occupies a slot, but it remains a Special Card. The implementation casts it to `CardType.UNIT`. Any helper that means "real Unit" and checks only `type === UNIT` can now include Decoy. Concrete surfaces already found: Medic modal (F-8.3) and Scorch target calculation. If all real non-Hero units have 0 effective Strength, Special Scorch can select Decoy placeholders as tied highest "units." This is not a normal gameplay target.
- **Proposed fix:** Preserve Decoy's Special identity and teach row rendering/scoring to handle zero-strength placeholders without making them Unit cards.

## F-9.7  Special Mardroeme is structurally missing  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:262` — "Place on a combat row. Triggers the transformation of all Berserker cards on that row."
- **Rule:** `docs/gwent-rules.md:436-442` — "Mardroeme (Unit or Special) triggers transformation of all Berserkers **on its row**." / "Berserker is removed **from the game** (not discarded)." / "Mardroeme ongoing..."
- **Human code path:** No `CardAbility.MARDROEME` enum exists in `src/types/card.ts:26-49`, and `playCardAction` has no Mardroeme branch in `src/store/thunks/gameThunks.ts:118-157`.
- **AI code path:** No Mardroeme strategy exists in `src/ai/strategy.ts`.
- **Observation:** Special Mardroeme cannot be represented or played. This shares the same side-deck/removed-from-game blocker as Phase 8's Unit Mardroeme/Berserker finding.
- **Proposed fix:** Add Mardroeme ability/card data plus a shared row transformation resolver for both Unit and Special Mardroeme.

## F-9.8  Special Scorch targets highest non-Hero units across both boards  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:263` — "Send the Unit Card(s) with the **highest Strength, excluding Heroes**, on the **entire battlefield** (both sides) to the discard pile, then discard itself."
- **Rule:** `docs/gwent-rules.md:404-407` — "Heroes are excluded from both Scorch effects." / "Ties are resolved by discarding all tied highest-Strength non-Hero units." / "There is no \"my side only\" restriction..."
- **Human code path:** `src/store/thunks/gameThunks.ts:152-155`
  ```ts
  case CardAbility.SCORCH:
    await dispatch(handleScorchAction({ player }));
    // Scorch is immediately discarded after use
    dispatch(moveCardToDiscard({ player, card }));
    break;
  ```
  target helper at `src/utils/gameHelpers.ts:278-290`:
  ```ts
  [gameState.playerBoard, gameState.opponentBoard].forEach(board => {
    Object.entries(board).forEach(([row, rowState]) => {
      ...
      processRow(rowState, weatherEffect, rowState.hornActive);
    });
  });
  ```
- **AI code path:** Same `handleScorchAction`; AI decision uses `findScorchTargets(state)` at `src/ai/strategy.ts:228-260`.
- **Observation:** The core target scope is correct: both boards, non-Hero `CardType.UNIT`, tied max targets, and current effective Strength through `calculateUnitStrength`. The Scorch card itself is discarded to the controller after effect. Phase 12 still owns modifier-order issues, and F-9.6 covers Decoy pollution.
- **Proposed fix:** None for core scope/hero filtering.

## F-9.9  Special Scorch sends scorched Spies to board-side discard  ❌

- **Status:** ❌ Bug
- **Rule:** `docs/gwent-rules.md:206-208` — "When a card leaves the battlefield, it goes to **its controller's** discard pile. **This includes \"Spy\" cards.**" / "even when a Spy is physically sitting on your opponent's side..."
- **Rule:** `docs/gwent-rules.md:263` — Special Scorch sends highest Unit Card(s) "to the discard pile."
- **Human code path:** `src/store/thunks/gameThunks.ts:377-390`
  ```ts
  scorchTargets.forEach(target => {
    ['playerBoard', 'opponentBoard'].forEach(boardKey => {
      ['close', 'ranged', 'siege'].forEach(rowKey => {
        const row = (gameState as any)[boardKey][rowKey as RowPosition];
        if (row.cards.some((c: any) => c.id === target.id)) {
          const targetPlayer = boardKey === 'playerBoard' ? 'player' : 'opponent';
          dispatch(removeCardFromBoard({ player: targetPlayer, cardId: target.id, row: rowKey as RowPosition }));
          dispatch(moveCardToDiscard({ player: targetPlayer, card: target }));
        }
      });
    });
  });
  ```
- **AI code path:** Same Scorch execution thunk.
- **Observation:** Like Unit Scorch and round-end cleanup, Special Scorch routes discarded cards by physical board side. If Special Scorch burns a Spy on the opponent's board, the Spy goes to the opponent's discard instead of the Spy controller's discard. This is symmetric but wrong.
- **Proposed fix:** Track controller on board entries and use it for all discard transitions, including Special Scorch.

---

## Phase 9 Findings Summary

| ID | Status | Rule | Finding |
|---|---:|---|---|
| F-9.1 | ✅ | §13 / §17.6 | Special Horn doubles non-Hero units for both seats. |
| F-9.2 | ❌ 🔀 | §13 / §17.6 | Human can spend a second Horn on an already-horned row; AI avoids this. |
| F-9.3 | ⚠️ | §13 | `R-009`: Horn source is decoupled from the row slot. |
| F-9.4 | ✅ | §13 / §17.4 | Decoy target side and non-Hero filtering mostly work for both seats. |
| F-9.5 | ❌ | §13 | `R-012`: Decoy is double-tracked and discarded twice. |
| F-9.6 | ❌ | §13 / §17.5 | Decoy-as-Unit pollutes strength and Scorch target logic. |
| F-9.7 | 🕳️ | §13 / §17.9 | Special Mardroeme is structurally missing. |
| F-9.8 | ✅ | §13 / §17.5 | Special Scorch core target scope and Hero exclusion work. |
| F-9.9 | ❌ | §9 / §13 | Special Scorch sends scorched Spies to board-side discard. |

---

## Carry-Forwards

- **Phase 11:** Add Decoy-as-Unit rows to the Hero/target matrix for Scorch and Medic; include Horn source representation.
- **Phase 12:** Special Scorch and AI Scorch decisions inherit modifier-order bugs from `calculateUnitStrength`.
- **Phase 15:** Collapse "board side" vs "controller" by adding controller metadata; this fixes Spy discard under round-end, Unit Scorch, and Special Scorch.
