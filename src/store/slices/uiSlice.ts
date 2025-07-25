import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Card } from '@/types/card';

interface UIState {
  selectedCard: Card | null;
  isDecoyActive: boolean;
  cardsSelector: {
    title: string;
    show: boolean;
    redrawCount?: number;
  };
  isAIMoving: boolean;
  aiRedrawComplete: boolean;
  redrawCount: number;
  medicChainState: {
    isChaining: boolean;
    originalMedic: Card | null;
    placedMedics: Card[];
  };
  gameScores: {
    player: number;
    opponent: number;
  };
}

const initialState: UIState = {
  selectedCard: null,
  isDecoyActive: false,
  cardsSelector: {
    title: '',
    show: false
  },
  isAIMoving: false,
  aiRedrawComplete: false,
  redrawCount: 0,
  medicChainState: {
    isChaining: false,
    originalMedic: null,
    placedMedics: []
  },
  gameScores: {
    player: 0,
    opponent: 0
  }
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Card selection
    setSelectedCard: (state, action: PayloadAction<Card | null>) => {
      state.selectedCard = action.payload;
    },

    // Decoy functionality
    setIsDecoyActive: (state, action: PayloadAction<boolean>) => {
      state.isDecoyActive = action.payload;
    },

    // Cards selector modal
    setCardsSelector: (state, action: PayloadAction<{
      title: string;
      show: boolean;
    }>) => {
      state.cardsSelector = action.payload;
    },

    showCardsSelector: (state, action: PayloadAction<string>) => {
      state.cardsSelector = {
        title: action.payload,
        show: true,
        redrawCount: action.payload === 'redraw' ? state.redrawCount : undefined
      };
    },

    hideCardsSelector: (state) => {
      state.cardsSelector.show = false;
    },

    // AI state management
    setIsAIMoving: (state, action: PayloadAction<boolean>) => {
      state.isAIMoving = action.payload;
    },

    setAiRedrawComplete: (state, action: PayloadAction<boolean>) => {
      state.aiRedrawComplete = action.payload;
    },

    // Game scores (persistent across games)
    updateGameScores: (state, action: PayloadAction<{
      player: number;
      opponent: number;
    }>) => {
      state.gameScores = action.payload;
    },

    incrementPlayerGameScore: (state) => {
      state.gameScores.player++;
    },

    incrementOpponentGameScore: (state) => {
      state.gameScores.opponent++;
    },

    // Redraw count management
    incrementRedrawCount: (state) => {
      state.redrawCount++;
      // Update cardsSelector if it's currently showing redraw
      if (state.cardsSelector.title === 'redraw') {
        state.cardsSelector.redrawCount = state.redrawCount;
      }
    },

    resetRedrawCount: (state) => {
      state.redrawCount = 0;
    },

    // Medic chain management
    startMedicChain: (state, action: PayloadAction<Card>) => {
      state.medicChainState = {
        isChaining: true,
        originalMedic: action.payload,
        placedMedics: [action.payload]
      };
    },

    addMedicToChain: (state, action: PayloadAction<Card>) => {
      state.medicChainState.placedMedics.push(action.payload);
    },

    endMedicChain: (state) => {
      state.medicChainState = {
        isChaining: false,
        originalMedic: null,
        placedMedics: []
      };
    },

    // Reset UI state for new game
    resetUIState: (state) => {
      state.selectedCard = null;
      state.isDecoyActive = false;
      state.cardsSelector = {
        title: '',
        show: false
      };
      state.isAIMoving = false;
      state.aiRedrawComplete = false;
      state.redrawCount = 0;
      state.medicChainState = {
        isChaining: false,
        originalMedic: null,
        placedMedics: []
      };
    },
  },
});

export const {
  setSelectedCard,
  setIsDecoyActive,
  setCardsSelector,
  showCardsSelector,
  hideCardsSelector,
  setIsAIMoving,
  setAiRedrawComplete,
  incrementRedrawCount,
  resetRedrawCount,
  startMedicChain,
  addMedicToChain,
  endMedicChain,
  updateGameScores,
  incrementPlayerGameScore,
  incrementOpponentGameScore,
  resetUIState,
} = uiSlice.actions;

export default uiSlice.reducer;