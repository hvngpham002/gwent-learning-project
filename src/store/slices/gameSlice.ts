import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Card, GameState, PlayerState, BoardState, RowPosition, CardAbility, UnitCard, Faction } from '@/types/card';

// Enhanced GameState for Redux with better serialization
interface ReduxGameState extends Omit<GameState, 'activeWeatherEffects'> {
  activeWeatherEffects: CardAbility[]; // Array instead of Set for serialization
  weatherCards: Array<{ card: Card; player: 'player' | 'opponent' }>; // Track actual weather cards played (for round end cleanup)
  specialCardsOnBoard: {
    player: Card[];
    opponent: Card[];
  }; // Track special cards that stay on board (horns, decoys)
}

const initialPlayerState: PlayerState = {
  deck: [],
  hand: [],
  discard: [],
  leader: null,
  passed: false,
  lives: 2,
  faction: Faction.NEUTRAL,
  gameScore: 0
};

const initialBoardState: BoardState = {
  close: { cards: [], hornActive: false },
  ranged: { cards: [], hornActive: false },
  siege: { cards: [], hornActive: false }
};

const initialState: ReduxGameState = {
  player: initialPlayerState,
  opponent: initialPlayerState,
  playerBoard: initialBoardState,
  opponentBoard: initialBoardState,
  currentRound: 1,
  playerScore: 0,
  opponentScore: 0,
  currentTurn: 'player',
  gamePhase: 'setup',
  activeWeatherEffects: [],
  weatherCards: [],
  specialCardsOnBoard: {
    player: [],
    opponent: []
  }
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    // Game initialization
    initializeGame: (state, action: PayloadAction<{
      playerDeck: Card[];
      opponentDeck: Card[];
      playerLeader: any;
      opponentLeader: any;
      playerScore: number;
      opponentScore: number;
    }>) => {
      const { playerDeck, opponentDeck, playerLeader, opponentLeader, playerScore, opponentScore } = action.payload;
      
      state.player = {
        ...initialPlayerState,
        deck: playerDeck.slice(10),
        hand: playerDeck.slice(0, 10),
        leader: playerLeader,
        faction: playerLeader.faction,
        gameScore: playerScore,
        discard: [],
        passed: false,
        lives: 2
      };
      
      state.opponent = {
        ...initialPlayerState,
        deck: opponentDeck.slice(10),
        hand: opponentDeck.slice(0, 10),
        leader: opponentLeader,
        faction: opponentLeader.faction,
        gameScore: opponentScore,
        discard: [],
        passed: false,
        lives: 2
      };
      
      state.playerBoard = initialBoardState;
      state.opponentBoard = initialBoardState;
      state.currentTurn = Math.random() < 0.5 ? 'player' : 'opponent';
      state.gamePhase = 'setup';
      state.activeWeatherEffects = [];
      state.currentRound = 1;
    },

    // Turn management
    setCurrentTurn: (state, action: PayloadAction<'player' | 'opponent'>) => {
      state.currentTurn = action.payload;
    },

    setGamePhase: (state, action: PayloadAction<'setup' | 'playing' | 'roundEnd' | 'gameEnd'>) => {
      state.gamePhase = action.payload;
    },

    // Player actions
    playerPass: (state) => {
      state.player.passed = true;
      if (state.opponent.passed) {
        state.gamePhase = 'roundEnd';
      } else {
        state.currentTurn = 'opponent';
      }
    },

    opponentPass: (state) => {
      state.opponent.passed = true;
      if (state.player.passed) {
        state.gamePhase = 'roundEnd';
      } else {
        state.currentTurn = 'player';
      }
    },

    // Basic card placement - complex logic handled by thunks
    playCardBasic: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      card: Card;
      row?: RowPosition;
      skipTurnSwitch?: boolean;
    }>) => {
      const { player, card, row, skipTurnSwitch } = action.payload;
      const playerKey = player;
      const boardKey = player === 'player' ? 'playerBoard' : 'opponentBoard';
      
      // Remove card from hand
      state[playerKey].hand = state[playerKey].hand.filter(c => c.id !== card.id);
      
      // Add card to appropriate location based on type and ability
      if ((card.type === 'unit' || card.type === 'hero') && row) {
        state[boardKey][row].cards.push(card as UnitCard);
      }
      
      // Switch turns (unless explicitly skipped, e.g., during medic chains)
      if (!skipTurnSwitch) {
        const oppositePlayer = player === 'player' ? 'opponent' : 'player';
        if (!state[oppositePlayer].passed) {
          state.currentTurn = oppositePlayer;
        }
      }
    },

    // Remove card from hand (for special cards that don't go to board)
    removeCardFromHand: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      cardId: string;
    }>) => {
      const { player, cardId } = action.payload;
      state[player].hand = state[player].hand.filter(c => c.id !== cardId);
    },

    // Add card back to hand (for decoy returns)
    addCardToHand: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      card: Card;
    }>) => {
      const { player, card } = action.payload;
      state[player].hand.push(card);
    },

    // Card drawing
    drawCards: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      count: number;
    }>) => {
      const { player, count } = action.payload;
      const playerState = state[player];
      const drawnCards = playerState.deck.slice(0, count);
      
      playerState.hand.push(...drawnCards);
      playerState.deck = playerState.deck.slice(count);
    },

    // Redraw functionality
    redrawCards: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      cardsToRedraw: Card[];
      newCards: Card[];
    }>) => {
      const { player, cardsToRedraw, newCards } = action.payload;
      const playerState = state[player];
      
      // Remove cards to redraw from hand
      playerState.hand = playerState.hand.filter(
        card => !cardsToRedraw.some(redrawCard => redrawCard.id === card.id)
      );
      
      // Add new cards to hand
      playerState.hand.push(...newCards);
      
      // Update deck (remove drawn cards, add redraw cards)
      playerState.deck = playerState.deck.slice(newCards.length);
      playerState.deck.push(...cardsToRedraw);
    },

    // Weather effects
    setWeatherEffects: (state, action: PayloadAction<CardAbility[]>) => {
      state.activeWeatherEffects = action.payload;
    },

    addWeatherEffect: (state, action: PayloadAction<CardAbility>) => {
      if (!state.activeWeatherEffects.includes(action.payload)) {
        state.activeWeatherEffects.push(action.payload);
      }
    },

    addWeatherCard: (state, action: PayloadAction<{
      card: Card;
      player: 'player' | 'opponent';
    }>) => {
      state.weatherCards.push(action.payload);
    },

    addSpecialCardToBoard: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      card: Card;
    }>) => {
      const { player, card } = action.payload;
      state.specialCardsOnBoard[player].push(card);
    },

    clearWeatherEffects: (state) => {
      state.activeWeatherEffects = [];
      
      // Move weather cards to appropriate player's discard when cleared
      state.weatherCards.forEach(weatherEntry => {
        state[weatherEntry.player].discard.push(weatherEntry.card);
      });
      
      state.weatherCards = [];
    },

    // Horn effects
    activateHorn: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      row: RowPosition;
    }>) => {
      const { player, row } = action.payload;
      const boardKey = player === 'player' ? 'playerBoard' : 'opponentBoard';
      state[boardKey][row].hornActive = true;
    },

    // Round management
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
      
      // Move all cards to discard
      const playerWeatherCards = state.weatherCards.filter(w => w.player === 'player').map(w => w.card);
      const opponentWeatherCards = state.weatherCards.filter(w => w.player === 'opponent').map(w => w.card);
      
      const playerDiscardCards = [
        ...state.player.discard,
        ...state.playerBoard.close.cards,
        ...state.playerBoard.ranged.cards,
        ...state.playerBoard.siege.cards,
        ...state.specialCardsOnBoard.player, // Add special cards on board
        ...playerWeatherCards // Add player's weather cards
      ];
      
      const opponentDiscardCards = [
        ...state.opponent.discard,
        ...state.opponentBoard.close.cards,
        ...state.opponentBoard.ranged.cards,
        ...state.opponentBoard.siege.cards,
        ...state.specialCardsOnBoard.opponent, // Add special cards on board
        ...opponentWeatherCards // Add opponent's weather cards
      ];
      
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
      state.activeWeatherEffects = [];
      state.weatherCards = [];
      state.specialCardsOnBoard = {
        player: [],
        opponent: []
      };
      
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
    },

    // Leader abilities
    useLeaderAbility: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
    }>) => {
      const { player } = action.payload;
      if (state[player].leader) {
        state[player].leader!.used = true;
      }
    },

    // Score tracking
    updateScores: (state, action: PayloadAction<{
      playerScore: number;
      opponentScore: number;
    }>) => {
      state.playerScore = action.payload.playerScore;
      state.opponentScore = action.payload.opponentScore;
    },

    // Complex card actions (will be implemented with middleware/thunks)
    moveCardToDiscard: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      card: Card;
    }>) => {
      const { player, card } = action.payload;
      state[player].discard.push(card);
    },

    removeCardFromBoard: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      cardId: string;
      row: RowPosition;
    }>) => {
      const { player, cardId, row } = action.payload;
      const boardKey = player === 'player' ? 'playerBoard' : 'opponentBoard';
      state[boardKey][row].cards = state[boardKey][row].cards.filter(c => c.id !== cardId);
    },

    removeCardFromDiscard: (state, action: PayloadAction<{
      player: 'player' | 'opponent';
      cardId: string;
    }>) => {
      const { player, cardId } = action.payload;
      state[player].discard = state[player].discard.filter(c => c.id !== cardId);
    },
  },
});

export const {
  initializeGame,
  setCurrentTurn,
  setGamePhase,
  playerPass,
  opponentPass,
  playCardBasic,
  removeCardFromHand,
  addCardToHand,
  drawCards,
  redrawCards,
  setWeatherEffects,
  addWeatherEffect,
  addWeatherCard,
  addSpecialCardToBoard,
  clearWeatherEffects,
  activateHorn,
  endRound,
  useLeaderAbility,
  updateScores,
  moveCardToDiscard,
  removeCardFromBoard,
  removeCardFromDiscard,
} = gameSlice.actions;

export default gameSlice.reducer;