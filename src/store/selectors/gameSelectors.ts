import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { calculateTotalScore } from '@/utils/gameHelpers';
import { CardAbility } from '@/types/card';

// Basic game state selectors
export const selectGameState = (state: RootState) => state.game;
export const selectUIState = (state: RootState) => state.ui;

export const selectPlayer = (state: RootState) => state.game.player;
export const selectOpponent = (state: RootState) => state.game.opponent;
export const selectPlayerBoard = (state: RootState) => state.game.playerBoard;
export const selectOpponentBoard = (state: RootState) => state.game.opponentBoard;

export const selectCurrentTurn = (state: RootState) => state.game.currentTurn;
export const selectGamePhase = (state: RootState) => state.game.gamePhase;
export const selectCurrentRound = (state: RootState) => state.game.currentRound;

// Weather effects selector with conversion from array to Set
export const selectActiveWeatherEffects = createSelector(
  [(state: RootState) => state.game.activeWeatherEffects],
  (weatherEffectsArray) => new Set(weatherEffectsArray)
);

// Player hands
export const selectPlayerHand = (state: RootState) => state.game.player.hand;
export const selectOpponentHand = (state: RootState) => state.game.opponent.hand;

// Player lives and scores
export const selectPlayerLives = (state: RootState) => state.game.player.lives;
export const selectOpponentLives = (state: RootState) => state.game.opponent.lives;
export const selectPlayerGameScore = (state: RootState) => state.game.player.gameScore;
export const selectOpponentGameScore = (state: RootState) => state.game.opponent.gameScore;

// Pass states
export const selectPlayerPassed = (state: RootState) => state.game.player.passed;
export const selectOpponentPassed = (state: RootState) => state.game.opponent.passed;

// Board scores with memoization
export const selectPlayerBoardScore = createSelector(
  [selectPlayerBoard, selectActiveWeatherEffects],
  (playerBoard, weatherEffects) => calculateTotalScore(playerBoard, weatherEffects)
);

export const selectOpponentBoardScore = createSelector(
  [selectOpponentBoard, selectActiveWeatherEffects],
  (opponentBoard, weatherEffects) => calculateTotalScore(opponentBoard, weatherEffects)
);

// Game state checks
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

export const selectBothPlayersPassed = createSelector(
  [selectPlayerPassed, selectOpponentPassed],
  (playerPassed, opponentPassed) => playerPassed && opponentPassed
);

// Turn logic
export const selectIsPlayerTurn = createSelector(
  [selectCurrentTurn],
  (currentTurn) => currentTurn === 'player'
);

export const selectCanPlayerAct = createSelector(
  [selectIsPlayerTurn, selectPlayerPassed, selectGamePhase, (state: RootState) => state.ui.medicChainState.isChaining],
  (isPlayerTurn, playerPassed, gamePhase, isMedicChaining) => 
    (isPlayerTurn || isMedicChaining) && !playerPassed && gamePhase === 'playing'
);

// UI selectors
export const selectSelectedCard = (state: RootState) => state.ui.selectedCard;
export const selectIsDecoyActive = (state: RootState) => state.ui.isDecoyActive;
export const selectCardsSelector = (state: RootState) => state.ui.cardsSelector;
export const selectIsAIMoving = (state: RootState) => state.ui.isAIMoving;
export const selectRedrawCount = (state: RootState) => state.ui.redrawCount;
export const selectMedicChainState = (state: RootState) => state.ui.medicChainState;
export const selectGameScores = (state: RootState) => state.ui.gameScores;

// Complex selectors
export const selectRoundWinner = createSelector(
  [selectPlayerBoardScore, selectOpponentBoardScore],
  (playerScore, opponentScore) => {
    if (playerScore > opponentScore) return 'player';
    if (opponentScore > playerScore) return 'opponent';
    return 'draw';
  }
);

// Leader selectors
export const selectPlayerLeader = (state: RootState) => state.game.player.leader;
export const selectOpponentLeader = (state: RootState) => state.game.opponent.leader;

export const selectCanUsePlayerLeader = createSelector(
  [selectPlayerLeader],
  (leader) => leader && !leader.used
);

export const selectCanUseOpponentLeader = createSelector(
  [selectOpponentLeader],
  (leader) => leader && !leader.used
);

// Deck and discard selectors
export const selectPlayerDeck = (state: RootState) => state.game.player.deck;
export const selectOpponentDeck = (state: RootState) => state.game.opponent.deck;
export const selectPlayerDiscard = (state: RootState) => state.game.player.discard;
export const selectOpponentDiscard = (state: RootState) => state.game.opponent.discard;
export const selectPlayerDeckSize = (state: RootState) => state.game.player.deck.length;
export const selectOpponentDeckSize = (state: RootState) => state.game.opponent.deck.length;
export const selectPlayerDiscardSize = (state: RootState) => state.game.player.discard.length;
export const selectOpponentDiscardSize = (state: RootState) => state.game.opponent.discard.length;

// Hand size selectors
export const selectPlayerHandSize = (state: RootState) => state.game.player.hand.length;
export const selectOpponentHandSize = (state: RootState) => state.game.opponent.hand.length;

// Weather check selectors
export const selectHasFrost = createSelector(
  [selectActiveWeatherEffects],
  (weatherEffects) => weatherEffects.has(CardAbility.FROST)
);

export const selectHasFog = createSelector(
  [selectActiveWeatherEffects],
  (weatherEffects) => weatherEffects.has(CardAbility.FOG)
);

export const selectHasRain = createSelector(
  [selectActiveWeatherEffects],
  (weatherEffects) => weatherEffects.has(CardAbility.RAIN)
);

export const selectHasAnyWeather = createSelector(
  [selectActiveWeatherEffects],
  (weatherEffects) => weatherEffects.size > 0
);

// Round state
export const selectIsRoundEnd = createSelector(
  [selectGamePhase],
  (gamePhase) => gamePhase === 'roundEnd'
);

export const selectIsSetupPhase = createSelector(
  [selectGamePhase],
  (gamePhase) => gamePhase === 'setup'
);

export const selectIsPlayingPhase = createSelector(
  [selectGamePhase],
  (gamePhase) => gamePhase === 'playing'
);

// Create a selector that combines all necessary game data for AI
export const selectGameStateForAI = createSelector(
  [selectGameState, selectActiveWeatherEffects],
  (gameState, weatherEffects) => ({
    ...gameState,
    activeWeatherEffects: weatherEffects // Convert back to Set for AI compatibility
  })
);