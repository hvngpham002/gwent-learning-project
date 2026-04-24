# Phase 6 — Game End

> Covers rulebook §8.4 and §17.14, with explicit carry-forward traces for `R-008` and `F-5.19`.

---

## Inputs

- Rules: `docs/gwent-rules.md:187-191`, `docs/gwent-rules.md:479-481`.
- Reducer: `src/store/slices/gameSlice.ts:253-320`.
- Orchestration: `src/components/game/ReduxGameManager.tsx:100-143`.
- Selectors: `src/store/selectors/gameSelectors.ts:51-62`.
- New-game thunk: `src/store/thunks/gameThunks.ts:41-79`.

---

## §8.4 — Game End

### F-6.1  Reducer detects true post-decrement game end  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:189-190` — "The game ends as soon as a player has **no Gem Counters left**." / "That player loses; the other player wins."
- **Human code path:** `src/store/slices/gameSlice.ts:260-263`
  ```ts
  if (playerScore > opponentScore) {
    state.opponent.lives--;
  } else if (opponentScore > playerScore) {
    state.player.lives--;
  }
  ```
  and `src/store/slices/gameSlice.ts:310-318`
  ```ts
  if (state.player.lives === 0 || state.opponent.lives === 0) {
    state.gamePhase = 'gameEnd';
    
    // Update game scores
    if (state.player.lives === 0 && state.opponent.lives > 0) {
      state.opponent.gameScore++;
    } else if (state.opponent.lives === 0 && state.player.lives > 0) {
      state.player.gameScore++;
    }
  }
  ```
- **AI code path:** Same reducer. The AI can end a round via `opponentPass`; once `endRound` runs, player/opponent decrement and `gamePhase` logic are seat-symmetric.
- **Observation:** For the actual reducer transaction, the check happens after the losing side's gem is removed. If exactly one side reaches `0`, `gamePhase` becomes `'gameEnd'` and only the surviving side's `gameScore` increments.
- **Proposed fix:** None for the reducer's ordinary single-dispatch post-decrement game-end branch.

### F-6.2  `R-008`: `handleRoundEnd` pre-decrement life check misfires when the 1-life player wins  ❌

- **Status:** ❌ Bug
- **Rule:** `docs/gwent-rules.md:189-190` — "The game ends as soon as a player has **no Gem Counters left**." / "That player loses; the other player wins."
- **Human code path:** `src/components/game/ReduxGameManager.tsx:108-117`
  ```ts
  dispatch(endRound({ playerScore, opponentScore }));

  // Check for game end and handle new game initialization
  if (gameState.player.lives === 1 || gameState.opponent.lives === 1) {
    let winner: 'player' | 'opponent' | 'draw' = 'draw';
    
    if (gameState.player.lives === 1 && gameState.opponent.lives > 1) {
      winner = 'opponent';
    } else if (gameState.opponent.lives === 1 && gameState.player.lives > 1) {
      winner = 'player';
    }
  ```
- **AI code path:** Same `handleRoundEnd` orchestration is used regardless of whether the player or AI loses the logical round. The specific misfire is mirrored: if `opponent.lives === 1`, `player.lives === 2`, and the AI wins the round, lines 116-117 mark `winner = 'player'` before the reducer's post-decrement state exists in the closure.
- **Concrete trace requested:**

  | Step | State / action | Result |
  |---|---|---|
  | Round 2 start | `player.lives = 1`, `opponent.lives = 2` because the player lost round 1 | Game is not over. |
  | Round 2 result | `playerScore > opponentScore` | Player wins round 2. |
  | `handleRoundEnd:103-108` | Scores are calculated, then `dispatch(endRound({ playerScore, opponentScore }))` runs | Reducer decrements `state.opponent.lives--` at `gameSlice.ts:260-261`, producing `player.lives = 1`, `opponent.lives = 1`; `gamePhase` is set back to `'playing'` at `gameSlice.ts:301` because neither side is `0`. |
  | `handleRoundEnd:111` | The closure still sees pre-dispatch `gameState.player.lives === 1` | The guard fires even though the post-dispatch game is `1-1` and should continue. |
  | `handleRoundEnd:114-117` | Pre-dispatch `player.lives === 1 && opponent.lives > 1` | `winner = 'opponent'`, even though the player just won the round. |
  | `handleRoundEnd:121-127` | Local storage and UI scores are updated using the wrong `winner` | `opponent` all-time score increments immediately. |
  | `handleRoundEnd:132-141` | A timer is scheduled | One second later it dispatches `initializeNewGame` with the captured wrong winner. |

- **Observation:** This is a false game-end decision in the component layer. The reducer correctly leaves the match at `1-1`, but `handleRoundEnd` treats "a side had 1 life before decrement" as equivalent to "a side has 0 lives after decrement." It therefore schedules a full new game in the middle of what should be round 3.
- **Proposed fix:** Delete the component-level pre-decrement game-end scoring/reset branch and derive game-over behavior only from the reducer's post-dispatch state (`gamePhase === 'gameEnd'` / `selectIsGameOver` / `selectGameWinner`).

### F-6.3  Misfired auto-new-game timer resets a continuing match  ❌

- **Status:** ❌ Bug
- **Rule:** `docs/gwent-rules.md:189` — "The game ends as soon as a player has **no Gem Counters left**."
- **Human code path:** `src/components/game/ReduxGameManager.tsx:120-141`
  ```ts
  const newScores = {
    player: storedScores.player + (winner === 'player' ? 1 : 0),
    opponent: storedScores.opponent + (winner === 'opponent' ? 1 : 0)
  };
  localStorage.setItem('gwentScores', JSON.stringify(newScores));
  dispatch(updateGameScores(newScores));
  
  console.log('Game over - Winner:', winner, 'All-time scores:', newScores);

  // Initialize new game after a short delay
  setTimeout(() => {
    const newPlayerScore = gameState.player.gameScore + (winner === 'player' ? 1 : 0);
    const newOpponentScore = gameState.opponent.gameScore + (winner === 'opponent' ? 1 : 0);
    
    dispatch(initializeNewGame({ 
      playerScore: newPlayerScore, 
      opponentScore: newOpponentScore 
    }));
    dispatch(showCardsSelector('redraw'));
  }, 1000);
  ```
- **AI code path:** Same component timer; side affected depends on which pre-dispatch `lives === 1` branch selected `winner`.
- **Observation:** In the `R-008` trace, the timer does not re-read the current Redux state after `endRound`. The callback closes over `gameState` and `winner`. One second later it dispatches `initializeNewGame`, whose thunk creates fresh decks and dispatches `game/initializeGame` (`src/store/thunks/gameThunks.ts:45-79`). `initializeGame` resets both lives to `2`, replaces hands/decks/boards, sets `currentRound = 1`, and sets `gamePhase = 'setup'` (`src/store/slices/gameSlice.ts:64-93`). Then `showCardsSelector('redraw')` opens mulligan. Net: it barrels through with the captured false intent and resets the match during the next playable round. This is the Phase 6 surface; deeper async/timer cleanup belongs in Phase 14.
- **Proposed fix:** Make new-game initialization an explicit response to the authoritative post-reducer game-over state. If delayed reset is kept, the timeout should validate the latest state before dispatching.

### F-6.4  `F-5.19 × game-end`: `endRound` assumes a single decrement per logical round  ⚠️

- **Status:** ⚠️ Ambiguous / Missing
- **Rule:** `docs/gwent-rules.md:182-183` — "The player with the **lowest** total Strength **loses** the round and **removes a gem**." / "In a **draw**, **both players remove a gem** — *unless* Nilfgaard's faction ability is in play (Nilfgaard wins draws)."
- **Human code path:** `src/store/slices/gameSlice.ts:253-267`
  ```ts
  endRound: (state, action: PayloadAction<{
    playerScore: number;
    opponentScore: number;
  }>) => {
    const { playerScore, opponentScore } = action.payload;
    
    // Determine winner and update lives
    if (playerScore > opponentScore) {
      state.opponent.lives--;
    } else if (opponentScore > playerScore) {
      state.player.lives--;
    } else {
      state.player.lives--;
      state.opponent.lives--;
    }
  ```
  and `src/store/slices/gameSlice.ts:309-318`
  ```ts
  // Check for game end
  if (state.player.lives === 0 || state.opponent.lives === 0) {
    state.gamePhase = 'gameEnd';
    
    // Update game scores
    if (state.player.lives === 0 && state.opponent.lives > 0) {
      state.opponent.gameScore++;
    } else if (state.opponent.lives === 0 && state.player.lives > 0) {
      state.player.gameScore++;
    }
  }
  ```
- **AI code path:** Same reducer. Any re-entry caused by `opponentPass`, the dead 500ms effect, or a future AI/async path compounds against the same state.
- **Trace requested:** Start from `player.lives = 2`, `opponent.lives = 2`, one logical round where `playerScore > opponentScore`. First `endRound` dispatch decrements `opponent.lives` to `1` and the game continues. If `endRound` fires a second time with the same payload, it decrements `opponent.lives` to `0`; lines 310-318 set `gamePhase = 'gameEnd'` and increment `player.gameScore`. That ends the match one logical round early.
- **Observation:** The game-end detection handles the doubled-decrement case only because the accidental second decrement lands exactly on `0`. It does not protect the transaction from multiple decrements, and it also assumes exact zero rather than `<= 0`. The missing idempotency guard is therefore a game-end correctness risk, not just a round-cleanup risk.
- **Proposed fix:** Add an idempotency guard to `endRound` so the reducer can only settle a specific round once. Consider using `<= 0` for defensive game-over detection after the authoritative transaction is made idempotent.

---

## §17.14 — Simultaneous Last-Gem Loss

### F-6.5  Both players losing last gem produces a draw and no gameScore increment  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:481` — "If **both players lose their last gem at the same time** (e.g. a drawn round when both are on 1 gem), the **game is a draw**."
- **Human code path:** `src/store/slices/gameSlice.ts:264-267`
  ```ts
  } else {
    state.player.lives--;
    state.opponent.lives--;
  }
  ```
  and `src/store/slices/gameSlice.ts:310-318`
  ```ts
  if (state.player.lives === 0 || state.opponent.lives === 0) {
    state.gamePhase = 'gameEnd';
    
    // Update game scores
    if (state.player.lives === 0 && state.opponent.lives > 0) {
      state.opponent.gameScore++;
    } else if (state.opponent.lives === 0 && state.player.lives > 0) {
      state.player.gameScore++;
    }
  }
  ```
- **AI code path:** Same reducer.
- **Trace requested:** Start from `player.lives = 1`, `opponent.lives = 1`, and `playerScore === opponentScore`. The reducer takes the tie branch at lines 264-267, producing `player.lives = 0`, `opponent.lives = 0`. The game-end guard at line 310 is true, so line 311 sets `state.gamePhase = 'gameEnd'`. The first score branch `state.player.lives === 0 && state.opponent.lives > 0` is false because opponent is `0`; the second branch `state.opponent.lives === 0 && state.player.lives > 0` is false because player is `0`. Neither `gameScore` increments.
- **Message/UI trace:** `handleRoundEnd` also sees pre-dispatch `1/1`, leaves `winner = 'draw'`, and logs `Game over - Winner: draw` at `src/components/game/ReduxGameManager.tsx:129`. I did not find a Redux-path visible game-end banner in `src/components/game/GameBoard.tsx`; the visible effect is the current board/game-end state for about one second, then the auto-new-game timer opens redraw.
- **Observation:** The reducer's draw handling is correct for §17.14. The component-level auto-reset behavior is separate from the draw scoring logic; it resets after a draw but does not award either side a score.
- **Proposed fix:** None for reducer draw scoring. If the product wants a visible draw result, add a UI state that reads `selectIsGameOver` / `selectGameWinner` before starting a new game.

### F-6.6  Game-over selectors match reducer draw semantics  ✅

- **Status:** ✅ Correct
- **Rule:** `docs/gwent-rules.md:189-191` — "The game ends as soon as a player has **no Gem Counters left**." / "That player loses; the other player wins." / "If **both players lose their last gem at the same time**, the game ends in a **draw**."
- **Human code path:** `src/store/selectors/gameSelectors.ts:51-62`
  ```ts
  export const selectIsGameOver = createSelector(
    [selectPlayerLives, selectOpponentLives],
    (playerLives, opponentLives) => playerLives === 0 || opponentLives === 0
  );

  export const selectGameWinner = createSelector(
    [selectPlayerLives, selectOpponentLives],
    (playerLives, opponentLives) => {
      if (playerLives === 0 && opponentLives > 0) return 'opponent';
      if (opponentLives === 0 && playerLives > 0) return 'player';
      return null;
    }
  );
  ```
- **AI code path:** Same selectors over shared Redux state.
- **Observation:** For `0/1`, winner is `'opponent'`; for `1/0`, winner is `'player'`; for `0/0`, winner is `null`, matching a draw. Same caveat as F-6.4: selectors use exact `=== 0`, so they are not defensive against negative lives from repeated `endRound` dispatches.
- **Proposed fix:** None for ordinary draw/win semantics. Consider `<= 0` only as defensive hardening after reducer idempotency is fixed.

---

## Phase 6 Findings Summary

| ID | Status | Rule | Finding |
|---|---:|---|---|
| F-6.1 | ✅ | §8.4 | Reducer detects true post-decrement game end and awards exactly one winner. |
| F-6.2 | ❌ | §8.4 | `R-008`: component pre-decrement `lives === 1` check misfires when the 1-life player wins. |
| F-6.3 | ❌ | §8.4 | Misfired timer dispatches `initializeNewGame` in a continuing match. |
| F-6.4 | ⚠️ | §8.3 / §8.4 | `endRound` has no idempotency guard; doubled dispatch can end game one round early. |
| F-6.5 | ✅ | §17.14 | Tied round from `1/1` lives produces `0/0`, `gameEnd`, and no `gameScore` increment. |
| F-6.6 | ✅ | §8.4 / §17.14 | Game-over selectors match ordinary win/draw semantics, with same exact-zero hardening caveat. |

---

## Carry-Forwards

- **Phase 14:** Audit timer lifetime and stale closure handling around `ReduxGameManager.handleRoundEnd:132-141`. Phase 6 confirms the callback uses captured `winner` and `gameState`, not the latest Redux state.
- **Phase 15:** Include `R-008` in the orchestration-vs-reducer split: the reducer has the authoritative game-end result, while the component duplicates and miscomputes game-end scoring/reset.
