import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Set objects in the state for weather effects and function types
        ignoredPaths: ['game.activeWeatherEffects'],
        ignoredActions: [
          'game/setWeatherEffects',
          'game/initializeNewGame/pending',
          'game/initializeNewGame/fulfilled',
          'game/initializeNewGame/rejected',
          'game/playCardAction/pending',
          'game/playCardAction/fulfilled',
          'game/playCardAction/rejected',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;