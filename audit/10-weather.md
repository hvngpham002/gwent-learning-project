# Phase 10 — Weather

> Covers rulebook §14 plus weather clarifications in §17.

---

## Inputs

- Rules: `docs/gwent-rules.md:267-279`, `docs/gwent-rules.md:464-471`.
- Weather reducers and cleanup: `src/store/slices/gameSlice.ts:205-240`, `src/store/slices/gameSlice.ts:269-303`.
- Special/leader dispatcher: `src/store/thunks/gameThunks.ts:97-160`.
- Live scoring and helpers: `src/utils/gameHelpers.ts:16-95`, `src/utils/gameHelpers.ts:142-153`, `src/utils/gameHelpers.ts:211-244`.
- Human UI: `src/components/game/GameBoard.tsx:117-164`, `src/components/game/ReduxGameManager.tsx:271-309`, `src/components/player/PlayerArea.tsx:39-74`.
- AI strategy: `src/ai/strategy.ts:19-77`, `src/ai/strategy.ts:191-225`.
- Card data: `src/data/cards/neutral.ts:211-260`.

---

## F-10.1  Frost, Fog, and Rain apply globally and leave Heroes immune  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:269` — "Weather cards are played face-up into the shared Weather Cards area and affect the relevant row on **both** players' sides."
- **Rule:** `docs/gwent-rules.md:273-275` — Frost affects Close Combat, Fog affects Ranged, Rain affects Siege.
- **Rule:** `docs/gwent-rules.md:279` — "Heroes are immune to Weather..."
- **Human code path:** `src/store/thunks/gameThunks.ts:138-143`
  ```ts
  case CardAbility.FROST:
  case CardAbility.FOG:
  case CardAbility.RAIN:
    dispatch(addWeatherEffect(card.ability));
    // Weather cards stay on board until cleared or round end - track them
    dispatch(addWeatherCard({ card, player }));
    break;
  ```
  live scoring at `src/utils/gameHelpers.ts:87-95`
  ```ts
  const hasFrost = weatherEffects.has(CardAbility.FROST);
  const hasFog = weatherEffects.has(CardAbility.FOG);
  const hasRain = weatherEffects.has(CardAbility.RAIN);
    return (
    calculateRowStrength(boardState.close.cards, hasFrost, boardState.close.hornActive) +
    calculateRowStrength(boardState.ranged.cards, hasFog, boardState.ranged.hornActive) +
    calculateRowStrength(boardState.siege.cards, hasRain, boardState.siege.hornActive)
  );
  ```
- **AI code path:** AI chooses the same three weather abilities in `src/ai/strategy.ts:191-224`, then dispatches the same `playCardAction` thunk.
- **Observation:** `activeWeatherEffects` is shared state, so both boards pass the same Frost/Fog/Rain flags into `calculateTotalScore`. `calculateUnitStrength` returns Hero strength before applying weather (`src/utils/gameHelpers.ts:23-31`), so Heroes remain immune. Human row highlighting and row scores also use the same three flags (`src/components/player/PlayerArea.tsx:39-74`).
- **Proposed fix:** None for these three weather effects.

## F-10.2  Multiple weather cards and controller discard are handled  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:269` — "Multiple weather cards can be active simultaneously."
- **Rule:** `docs/gwent-rules.md:465` — "Multiple weather cards can be active at once..."
- **Human code path:** `src/store/slices/gameSlice.ts:210-220`
  ```ts
  addWeatherEffect: (state, action: PayloadAction<CardAbility>) => {
    if (!state.activeWeatherEffects.includes(action.payload)) {
      state.activeWeatherEffects.push(action.payload);
    }
  },
  ...
  state.weatherCards.push(action.payload);
  ```
  round-end cleanup at `src/store/slices/gameSlice.ts:269-303`
  ```ts
  const playerWeatherCards = state.weatherCards.filter(w => w.player === 'player').map(w => w.card);
  const opponentWeatherCards = state.weatherCards.filter(w => w.player === 'opponent').map(w => w.card);
  ...
  ...playerWeatherCards // Add player's weather cards
  ...
  ...opponentWeatherCards // Add opponent's weather cards
  ...
  state.activeWeatherEffects = [];
  state.weatherCards = [];
  ```
- **AI code path:** Same reducers. AI weather cards carry `player: 'opponent'` into `addWeatherCard`, so round-end discard is by controller, not by affected row.
- **Observation:** Different weather effects can coexist in `activeWeatherEffects`. Duplicate copies of the same weather card do not stack the effect, but each physical card is still tracked in `weatherCards` and returned to its controller's discard when the round ends. This matches the shared weather area model better than the Spy cleanup path because controller metadata is explicit here.
- **Proposed fix:** None for controller discard. If duplicate identical weather cards should be rejected as illegal play, that is a separate rule clarification; the current rule text only says multiple weather cards can be active.

## F-10.3  Clear Weather special discards active weather and itself, including no-op boards  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:277` — "Discard all Weather cards currently on the battlefield; their effects are cancelled. Discard this card after playing."
- **Rule:** `docs/gwent-rules.md:467-468` — "Clear Weather removes all active weather cards..." / "Clear Weather playing onto a board with no weather... has no effect but is still discarded after play."
- **Human code path:** `src/store/thunks/gameThunks.ts:146-149`
  ```ts
  case CardAbility.CLEAR_WEATHER:
    dispatch(clearWeatherEffects());
    // Clear weather is immediately discarded after use
    dispatch(moveCardToDiscard({ player, card }));
    break;
  ```
  `src/store/slices/gameSlice.ts:231-239`
  ```ts
  clearWeatherEffects: (state) => {
    state.activeWeatherEffects = [];
    
    // Move weather cards to appropriate player's discard when cleared
    state.weatherCards.forEach(weatherEntry => {
      state[weatherEntry.player].discard.push(weatherEntry.card);
    });
    
    state.weatherCards = [];
  },
  ```
- **AI code path:** `WeatherStrategy` considers Clear Weather at `src/ai/strategy.ts:198-212` and uses the same thunk. The Clear Weather leader path also calls `clearWeatherEffects()` at `src/store/thunks/gameThunks.ts:97-110`, which is correct for a leader ability because no Special card is being discarded.
- **Observation:** If there are active weather cards, each tracked weather card moves to its controller's discard and the active set clears. If there are no active weather cards, `clearWeatherEffects` is a no-op and the Clear Weather card still moves to the acting player's discard. Human play can trigger this from the shared weather row (`src/components/game/GameBoard.tsx:117-123`, `src/components/game/ReduxGameManager.tsx:294-309`); AI play follows the same reducer.
- **Proposed fix:** None for Clear Weather special behavior.

## F-10.4  Skellige Storm exists in card data but cannot work in live play  ❌

- **Status:** ❌ Bug
- **Rule:** `docs/gwent-rules.md:276` — "Skellige Storm... Sets Strength of all **Ranged AND Siege** Units to **1** for both players."
- **Rule:** `docs/gwent-rules.md:466` — "Skellige Storm sets both Ranged and Siege to Strength 1..."
- **Human code path:** Card data exists at `src/data/cards/neutral.ts:251-259`
  ```ts
  {
      id: 'neutral_special_08',
      name: 'Skellige Storm',
      faction: Faction.NEUTRAL,
      type: CardType.SPECIAL,
      strength: 0,
      ability: CardAbility.SKELLIGE_STORM,  // Would need to be added to enum
      imageUrl: '/images/neutral/skellige_storm.png',
      description: 'Sets the strength of all Ranged and Siege units to 1'
  }
  ```
  But human dispatch only recognizes Frost/Fog/Rain/Clear Weather as weather in `src/components/game/GameBoard.tsx:117-123` and `src/components/game/ReduxGameManager.tsx:271-309`.
- **AI code path:** `src/ai/strategy.ts:191-195`
  ```ts
  if (card.type !== CardType.SPECIAL || 
      ![CardAbility.FROST, CardAbility.FOG, CardAbility.RAIN, CardAbility.CLEAR_WEATHER].includes(card.ability)) {
    return null;
  }
  ```
- **Observation:** Even if a Skellige Storm card enters a hand, the human UI does not expose it as playable weather, the AI WeatherStrategy rejects it, `playCardAction` has no `CardAbility.SKELLIGE_STORM` case, and `calculateTotalScore` ignores it (`src/utils/gameHelpers.ts:87-95`). The helper `getWeatherAffectedRows` knows Skellige Storm affects Ranged and Siege (`src/utils/gameHelpers.ts:211-224`), but that knowledge is not connected to live play or live scoring.
- **Proposed fix:** Treat `SKELLIGE_STORM` as a first-class weather ability everywhere Frost/Fog/Rain are handled: play validation, `playCardAction`, score calculation, row highlighting, AI weather selection, and Scorch/highest-strength helpers that consume current weather.

## F-10.5  `R-003`: weather state is an array in Redux but a Set in typed game logic  ⚠️

- **Status:** ⚠️ Ambiguous / structural gap
- **Rule:** `docs/gwent-rules.md:269` — weather is a shared active battlefield state.
- **Human code path:** Reducer state stores an array: `src/store/slices/gameSlice.ts:205-214`
  ```ts
  setWeatherEffects: (state, action: PayloadAction<CardAbility[]>) => {
    state.activeWeatherEffects = action.payload;
  },

  addWeatherEffect: (state, action: PayloadAction<CardAbility>) => {
    if (!state.activeWeatherEffects.includes(action.payload)) {
      state.activeWeatherEffects.push(action.payload);
    }
  },
  ```
  selectors convert it to a Set: `src/store/selectors/gameSelectors.ts:19-23`
  ```ts
  export const selectActiveWeatherEffects = createSelector(
    [(state: RootState) => state.game.activeWeatherEffects],
    (weatherEffectsArray) => new Set(weatherEffectsArray)
  );
  ```
- **AI code path:** `src/store/selectors/gameSelectors.ts:167-172`
  ```ts
  export const selectGameStateForAI = createSelector(
    [selectGameState, selectActiveWeatherEffects],
    (gameState, weatherEffects) => ({
      ...gameState,
      activeWeatherEffects: weatherEffects // Convert back to Set for AI compatibility
    })
  );
  ```
- **Observation:** The codebase has two weather-state shapes: Redux stores `CardAbility[]`, while helpers and AI expect `Set<CardAbility>`. Current selectors bridge the gap, and `addWeatherEffect` manually deduplicates the array, so normal UI/AI scoring works. The risk is structural: any future direct use of `state.game.activeWeatherEffects.has(...)` outside the selector path will fail at runtime, and several helpers already assume Set semantics.
- **Proposed fix:** Pick one representation at the type boundary. For Redux, prefer an array in state plus selector-only Set conversion, and update the shared `GameState` type or introduce a separate `ReduxGameState` type so direct callers cannot accidentally use the wrong API.

## F-10.6  King Bran weather mitigation is unimplemented and currently unreachable  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:470` — "King Bran... Friendly Units only lose **half** their Strength in bad weather conditions. (Rounded down)."
- **Human code path:** `calculateUnitStrength` has no player, faction, or leader context and always collapses non-Hero weathered units to 1 (`src/utils/gameHelpers.ts:16-31`).
- **AI code path:** Same live scoring helper. AI weather impact also models weather as normal full reduction by calling `calculateRowStrength(..., true, ...)` in `src/utils/gameHelpers.ts:226-243`.
- **Observation:** Phase 7 found Skellige faction/leader setup is not available in active play, so King Bran is unreachable before scoring is considered. Even if King Bran were added to player state, the current scoring API cannot apply a friendly-only leader modifier because it receives only a row and weather flags. This means a Strength 7 friendly Close unit under Frost would score 1, not the rulebook-derived 4.
- **Proposed fix:** Add leader/passive context to score calculation, then apply King Bran after weather detection and before downstream modifiers according to the Phase 12 resolution-order audit.
