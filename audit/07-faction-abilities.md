# Phase 7 — Faction Abilities

> Covers rulebook §11 and the faction clarifications in §17.13, §17.15, §17.16, §17.17, and §17.18.

---

## Inputs

- Rules: `docs/gwent-rules.md:222-232`, `docs/gwent-rules.md:473-477`, `docs/gwent-rules.md:483-489`, `docs/gwent-rules.md:491-506`.
- Faction enum / state shape: `src/types/card.ts:1-8`, `src/types/card.ts:110-119`.
- Active setup path: `src/store/thunks/gameThunks.ts:41-79`, `src/store/slices/gameSlice.ts:54-94`.
- Round-end path: `src/store/slices/gameSlice.ts:253-320`.
- Deck builder: `src/utils/deckBuilder.ts:12-21`.

---

## Baseline: Reachability

### F-7.1  Active game hardcodes Northern Realms vs Northern Realms  ⚠️

- **Status:** ⚠️ Ambiguous / structural gap
- **Rule:** `docs/gwent-rules.md:224` — "Each faction's passive ability is always in effect."
- **Human code path:** `src/store/thunks/gameThunks.ts:45-47`
  ```ts
  >('game/initializeNewGame', async ({ playerScore, opponentScore }, { dispatch }) => {
    const playerDeckWithLeader = createInitialDeck(Faction.NORTHERN_REALMS, 'player');
    const opponentDeckWithLeader = createInitialDeck(Faction.NORTHERN_REALMS, 'opponent');
  ```
- **AI code path:** Same code path. The opponent deck is also hardcoded to `Faction.NORTHERN_REALMS`.
- **Observation:** The active Redux game cannot choose Monsters, Scoia'tael, Skellige, or Nilfgaard from the normal setup flow. Because both seats are always Northern Realms, the only faction passive that is currently reachable in production is Northern Realms's round-win card draw. That reachable passive is not implemented (F-7.5). The other faction passives must be audited by code-reading rather than gameplay.
- **Proposed fix:** Add faction selection/assignment before `initializeNewGame`, pass both selected factions into `createInitialDeck`, and make passive hooks operate off `state[player].faction` for both seats.

### F-7.2  Deck builder only supports Northern Realms and Nilfgaard  ⚠️

- **Status:** ⚠️ Ambiguous / structural gap
- **Rule:** `docs/gwent-rules.md:226-232` lists five factions with passive abilities: "Monsters", "Nilfgaard", "Northern Realms", "Scoia'tael", and "Skellige".
- **Human code path:** `src/utils/deckBuilder.ts:12-21`
  ```ts
  export const createInitialDeck = (faction: Faction, player: 'player' | 'opponent'): DeckWithLeader => {

      switch (faction) {
          case Faction.NORTHERN_REALMS:
              return defaultNorthernRealmsDeck(player);
          case Faction.NILFGAARD:
              return defaultNilfgaardDeck(player);
          default:
              throw new Error('Invalid faction');
      }
  };
  ```
- **AI code path:** Same builder; the `player` argument only namespaces IDs, not rule behavior.
- **Observation:** Nilfgaard card data exists and can be built if called directly, but the active setup never calls it. Monsters, Scoia'tael, and Skellige image assets exist under `public/images/`, but there are no `src/data/cards/monsters.ts`, `scoiatael.ts`, or `skellige.ts` card-data modules, and `createInitialDeck` throws for those faction enum values. Their passives are therefore structurally unreachable even before rule hooks are considered.
- **Proposed fix:** Add card data/build branches for all supported factions, then wire passive abilities independently from deck construction.

---

## §11 — Passive Abilities

### F-7.3  Monsters keep-one-unit passive missing  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:228` — "At the end of each round, **one Unit Card stays on the battlefield** (carrying over to the next round). To choose it, the controlling player shuffles all their Unit Cards on the battlefield **excluding Heroes**, and draws one at random."
- **Human code path:** `src/store/slices/gameSlice.ts:273-280`
  ```ts
  const playerDiscardCards = [
    ...state.player.discard,
    ...state.playerBoard.close.cards,
    ...state.playerBoard.ranged.cards,
    ...state.playerBoard.siege.cards,
    ...state.specialCardsOnBoard.player, // Add special cards on board
    ...playerWeatherCards // Add player's weather cards
  ];
  ```
  then `src/store/slices/gameSlice.ts:297`
  ```ts
  state.playerBoard = initialBoardState;
  ```
- **AI code path:** `src/store/slices/gameSlice.ts:282-289`
  ```ts
  const opponentDiscardCards = [
    ...state.opponent.discard,
    ...state.opponentBoard.close.cards,
    ...state.opponentBoard.ranged.cards,
    ...state.opponentBoard.siege.cards,
    ...state.specialCardsOnBoard.opponent, // Add special cards on board
    ...opponentWeatherCards // Add opponent's weather cards
  ];
  ```
  then `src/store/slices/gameSlice.ts:298`
  ```ts
  state.opponentBoard = initialBoardState;
  ```
- **Observation:** No branch checks `state.player.faction === Faction.MONSTERS` or `state.opponent.faction === Faction.MONSTERS`. Both seats sweep all board units into discard and then reset the board. Heroes are not specially excluded because no keeper selection exists at all. This is symmetric absence, but it violates the Monsters passive.
- **Proposed fix:** Before building discard piles, choose one random non-Hero `CardType.UNIT` from each Monsters player's battlefield and keep it on that player's board while discarding everything else.

### F-7.4  Nilfgaard draw-win passive missing  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:229` — "**Wins the round whenever there is a draw.** (Overrides the normal rule that both players lose a gem on a tie.)"
- **Rule:** `docs/gwent-rules.md:475-476` — "Default rule for a Strength **tie** at end of round: **both players lose a gem.**" / "**Nilfgaard's faction ability overrides this:** \"Wins the round whenever there is a draw.\" So Nilfgaard vs. anyone on a tied round: Nilfgaard player wins the round; opponent loses a gem; Nilfgaard does not."
- **Human code path:** `src/store/slices/gameSlice.ts:260-267`
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
- **AI code path:** Same reducer branch. No opponent-faction branch exists.
- **Observation:** Tied strength always decrements both `state.player.lives` and `state.opponent.lives`. If the human were Nilfgaard against non-Nilfgaard, the human would still lose a gem. If the AI were Nilfgaard against non-Nilfgaard, the AI would also still lose a gem. The code does not implement the normal Nilfgaard override, nor the rulebook-silent Nilfgaard-vs-Nilfgaard policy.
- **Proposed fix:** Resolve a round winner before decrementing lives: on tied strength, check each side's faction, apply the Nilfgaard override for exactly one Nilfgaard side, and explicitly define the Nilfgaard-vs-Nilfgaard house rule.

### F-7.5  Northern Realms round-win draw missing in the active reachable matchup  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:230` — "**Draws a card from the deck whenever a round is won.**"
- **Rule:** `docs/gwent-rules.md:489` — "\"Draws a card from the deck whenever a round is won.\" **[Derived] If the deck is empty, nothing is drawn.** No additional penalty."
- **Human code path:** `src/store/slices/gameSlice.ts:260-263`
  ```ts
  if (playerScore > opponentScore) {
    state.opponent.lives--;
  } else if (opponentScore > playerScore) {
    state.player.lives--;
  }
  ```
  and `src/store/slices/gameSlice.ts:291-301`
  ```ts
  // Reset for next round
  state.player.discard = playerDiscardCards;
  state.opponent.discard = opponentDiscardCards;
  state.player.passed = false;
  state.opponent.passed = false;
  
  state.playerBoard = initialBoardState;
  state.opponentBoard = initialBoardState;
  state.currentRound++;
  state.currentTurn = Math.random() < 0.5 ? 'player' : 'opponent';
  state.gamePhase = 'playing';
  ```
- **AI code path:** Same reducer. Active setup makes `state.opponent.faction = Faction.NORTHERN_REALMS` through `initializeGame` as well (`src/store/slices/gameSlice.ts:76-85`).
- **Observation:** This is the most important Phase 7 faction bug because it is reachable today: `initializeNewGame` hardcodes both seats to Northern Realms. When either side wins a round, no `drawCards({ player, count: 1 })` equivalent runs and the reducer does not directly move a card from deck to hand. Both human and AI miss the passive.
- **Proposed fix:** After determining the round winner and before/after cleanup according to the chosen transaction model, if the winning side's faction is Northern Realms, draw one card from that side's deck if available.

### F-7.6  Scoia'tael first-player choice missing  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:231` — "**Decides who goes first** at the start of the game (overrides the coin flip)."
- **Rule:** `docs/gwent-rules.md:485` — "Scoia'tael's faction ability \"Decides who goes first at the start of the game.\" This **overrides the coin flip**."
- **Human code path:** `src/store/slices/gameSlice.ts:64-90`
  ```ts
  state.player = {
    ...initialPlayerState,
    deck: playerDeck.slice(10),
    hand: playerDeck.slice(0, 10),
    leader: playerLeader,
    faction: playerLeader.faction,
  ```
  and:
  ```ts
  state.currentTurn = Math.random() < 0.5 ? 'player' : 'opponent';
  ```
- **AI code path:** Same initialization reducer sets `state.opponent.faction = opponentLeader.faction` at `src/store/slices/gameSlice.ts:76-85`, then the same line 90 randomizes `currentTurn`.
- **Observation:** Initial faction is stored, but `initializeGame` does not check whether either side is Scoia'tael. The first player is always assigned by `Math.random()`. There is also no UI or AI policy surface for "decides who goes first." Scoia'tael is currently unreachable because `createInitialDeck` throws for it (F-7.2), but the passive hook is still absent.
- **Proposed fix:** Move first-player selection into setup orchestration where a Scoia'tael player can choose. For AI Scoia'tael, add an explicit strategy decision for whether the AI wants itself or the human to start.

### F-7.7  Skellige round-3 return missing  🕳️

- **Status:** 🕳️ Unimplemented
- **Rule:** `docs/gwent-rules.md:232` — "At the **start of the third round**, **two random Unit Cards, excluding Heroes**, are taken from the controlling player's **discard pile** and put on the battlefield. Shuffle the discard pile and choose two at random."
- **Rule:** `docs/gwent-rules.md:502-505` — "At the start of round 3, two random non-Hero Unit Cards from the Skellige player's discard pile are placed on the battlefield." / "If the Skellige discard pile has fewer than 2 non-Hero Units, you simply take what's there (0 or 1)."
- **Human code path:** `src/store/slices/gameSlice.ts:291-301`
  ```ts
  // Reset for next round
  state.player.discard = playerDiscardCards;
  state.opponent.discard = opponentDiscardCards;
  state.player.passed = false;
  state.opponent.passed = false;
  
  state.playerBoard = initialBoardState;
  state.opponentBoard = initialBoardState;
  state.currentRound++;
  state.currentTurn = Math.random() < 0.5 ? 'player' : 'opponent';
  state.gamePhase = 'playing';
  ```
- **AI code path:** Same reducer; `state.opponent.discard` is assigned at line 293 and `state.opponentBoard` is reset at line 298.
- **Observation:** The reducer increments `currentRound`, but no code checks "now entering round 3" and no code samples random non-Hero units from either discard pile. Returned unit placement and on-play trigger policy are also absent. Skellige is currently unreachable because `createInitialDeck` throws for it (F-7.2), but the passive hook is still missing.
- **Proposed fix:** Add an explicit start-of-round hook after round increment/cleanup. If either side is Skellige and `currentRound === 3`, randomly choose up to two non-Hero Unit cards from that side's discard, remove them from discard, and place them on that side's board according to the adopted placement/on-play policy.

---

## Faction Ability Matrix

| Faction | Reachable in active setup? | Human passive applied? | AI passive applied? | Same code path? | Finding |
|---|---:|---:|---:|---:|---|
| Monsters | No | No | No | Yes, absent | F-7.3 |
| Nilfgaard | No active setup; builder supports direct call | No | No | Yes, absent | F-7.4 |
| Northern Realms | Yes, both seats | No | No | Yes, absent | F-7.5 |
| Scoia'tael | No | No | No | Yes, absent | F-7.6 |
| Skellige | No | No | No | Yes, absent | F-7.7 |

---

## Phase 7 Findings Summary

| ID | Status | Rule | Finding |
|---|---:|---|---|
| F-7.1 | ⚠️ | §11 | Active setup hardcodes Northern Realms vs Northern Realms. |
| F-7.2 | ⚠️ | §11 | Deck builder only supports Northern Realms and Nilfgaard. |
| F-7.3 | 🕳️ | §11 / §17.17 | Monsters keep-one-unit passive missing for both seats. |
| F-7.4 | 🕳️ | §11 / §17.13 | Nilfgaard draw-win passive missing for both seats. |
| F-7.5 | 🕳️ | §11 / §17.16 | Northern Realms round-win draw missing for both seats, and this is active today. |
| F-7.6 | 🕳️ | §11 / §17.15 | Scoia'tael first-player choice missing for both seats. |
| F-7.7 | 🕳️ | §11 / §17.18 | Skellige round-3 return missing for both seats. |

---

## Carry-Forwards

- **Phase 8 / Phase 11:** Monsters and Skellige both need non-Hero filtering once implemented.
- **Phase 13:** King Bran / Crach / Eredin / Emhyr work is blocked by missing Skellige/Monsters deck data and broader faction setup.
- **Phase 15:** Faction passives should be centralized in shared round/setup hooks rather than split between UI and AI orchestration.
- **Phase 16:** AI faction consistency currently reduces to "AI is always Northern Realms and still does not receive the Northern Realms passive."
