import { createAsyncThunk } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { Card, UnitCard, RowPosition, CardAbility, CardType, LeaderAbility } from '@/types/card';
import { PlayDecision } from '@/ai/strategy';
import { 
  playCardBasic, 
  removeCardFromHand,
  addCardToHand,
  drawCards, 
  setCurrentTurn, 
  addWeatherEffect,
  addWeatherCard,
  addSpecialCardToBoard,
  clearWeatherEffects,
  activateHorn,
  moveCardToDiscard,
  removeCardFromBoard,
  removeCardFromDiscard,
  useLeaderAbility
} from '../slices/gameSlice';
import { 
  setSelectedCard, 
  setIsDecoyActive, 
  startMedicChain, 
  addMedicToChain, 
  endMedicChain,
  showCardsSelector,
  hideCardsSelector 
} from '../slices/uiSlice';
import { 
  findScorchTargets, 
  findCloseScorchTargets, 
  shuffle 
} from '@/utils/gameHelpers';
import { findMusterCards } from '@/hooks/useGameLogic';
import { createInitialDeck } from '@/utils/deckBuilder';
import { validateUniqueCardIds } from '@/utils/cardHelpers';
import { Faction } from '@/types/card';

// Initialize a new game
export const initializeNewGame = createAsyncThunk<
  void,
  { playerScore: number; opponentScore: number },
  { state: RootState }
>('game/initializeNewGame', async ({ playerScore, opponentScore }, { dispatch }) => {
  const playerDeckWithLeader = createInitialDeck(Faction.NORTHERN_REALMS, 'player');
  const opponentDeckWithLeader = createInitialDeck(Faction.NORTHERN_REALMS, 'opponent');

  const playerDeck = shuffle(playerDeckWithLeader.deck);
  const opponentDeck = shuffle(opponentDeckWithLeader.deck);

  // Validate unique card IDs in development mode
  if (process.env.NODE_ENV === 'development') {
    const allCards = [...playerDeck, ...opponentDeck, playerDeckWithLeader.leader, opponentDeckWithLeader.leader];
    const validation = validateUniqueCardIds(allCards);
    
    if (!validation.isValid) {
      console.error('❌ CARD ID COLLISION DETECTED!');
      console.error('Duplicate card IDs found:', validation.duplicateIds);
      console.error('This will cause game logic bugs and must be fixed!');
      throw new Error(`Card ID collision detected: ${validation.duplicateIds.join(', ')}`);
    } else {
      console.log('✅ All card IDs are unique across both players');
      console.log(`Total cards validated: ${allCards.length}`);
    }
  }

  dispatch({
    type: 'game/initializeGame',
    payload: {
      playerDeck,
      opponentDeck,
      playerLeader: playerDeckWithLeader.leader,
      opponentLeader: opponentDeckWithLeader.leader,
      playerScore,
      opponentScore
    }
  });
});

// Complex card play action that handles all card types and abilities
export const playCardAction = createAsyncThunk<
  void,
  {
    player: 'player' | 'opponent';
    card: Card;
    row?: RowPosition;
    targetCard?: UnitCard;
    decision?: PlayDecision;
  },
  { state: RootState }
>('game/playCardAction', async ({ player, card, row, targetCard, decision }, { dispatch, getState }) => {
  const state = getState();
  const gameState = state.game;
  const oppositePlayer = player === 'player' ? 'opponent' : 'player';

  // Handle Leader Cards
  if (card.type === CardType.LEADER) {
    dispatch(useLeaderAbility({ player }));
    
    const leaderCard = card as any; // LeaderCard type
    switch (leaderCard.ability) {
      case LeaderAbility.CLEAR_WEATHER:
        dispatch(clearWeatherEffects());
        break;
      // Add other leader abilities as needed
    }
    
    dispatch(setCurrentTurn(gameState[oppositePlayer].passed ? player : oppositePlayer));
    return;
  }

  // Handle Special Cards
  if (card.type === CardType.SPECIAL) {
    // Remove special card from hand first
    dispatch(removeCardFromHand({ player, cardId: card.id }));

    switch (card.ability) {
      case CardAbility.DECOY:
        if (targetCard) {
          // For decoy, we need to add the card back to hand first since we removed it above
          dispatch(addCardToHand({ player, card }));
          await dispatch(handleDecoyAction({ player, decoyCard: card, targetCard }));
          // Decoy handling is complete in handleDecoyAction
          dispatch(setCurrentTurn(gameState[oppositePlayer].passed ? player : oppositePlayer));
          return;
        }
        break;

      case CardAbility.COMMANDERS_HORN:
        if (row) {
          dispatch(activateHorn({ player, row }));
          // Horn stays on board until round end - track it as special card on board
          dispatch(addSpecialCardToBoard({ player, card }));
        }
        break;

      case CardAbility.FROST:
      case CardAbility.FOG:
      case CardAbility.RAIN:
        dispatch(addWeatherEffect(card.ability));
        // Weather cards stay on board until cleared or round end - track them
        dispatch(addWeatherCard({ card, player }));
        break;

      case CardAbility.CLEAR_WEATHER:
        dispatch(clearWeatherEffects());
        // Clear weather is immediately discarded after use
        dispatch(moveCardToDiscard({ player, card }));
        break;

      case CardAbility.SCORCH:
        await dispatch(handleScorchAction({ player }));
        // Scorch is immediately discarded after use
        dispatch(moveCardToDiscard({ player, card }));
        break;
    }
    
    dispatch(setCurrentTurn(gameState[oppositePlayer].passed ? player : oppositePlayer));
    return;
  }

  // Handle Unit/Hero Cards
  if ((card.type === CardType.UNIT || card.type === CardType.HERO) && row) {
    const unitCard = card as UnitCard;

    // Handle specific abilities
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
        // Regular unit placement
        dispatch(playCardBasic({ player, card: unitCard, row }));
        break;
    }
    
    // Don't switch turns if we're dealing with a medic card - medic chain handler controls turn switching
    if (unitCard.ability !== CardAbility.MEDIC) {
      dispatch(setCurrentTurn(gameState[oppositePlayer].passed ? player : oppositePlayer));
    }
  }
});

// Handle Decoy card action
export const handleDecoyAction = createAsyncThunk<
  void,
  { player: 'player' | 'opponent'; decoyCard: Card; targetCard: UnitCard },
  { state: RootState }
>('game/handleDecoyAction', async ({ player, decoyCard, targetCard }, { dispatch, getState }) => {
  const state = getState();
  const gameState = state.game;
  const boardKey = player === 'player' ? 'playerBoard' : 'opponentBoard';

  // Find the row containing the target card
  let targetRow: RowPosition | undefined;
  Object.entries(gameState[boardKey]).forEach(([row, rowState]) => {
    if (rowState.cards.some((card: any) => card.id === targetCard.id)) {
      targetRow = row as RowPosition;
    }
  });

  if (!targetRow) return;

  // Remove decoy from hand (it was added back in playCardAction)
  dispatch(removeCardFromHand({ player, cardId: decoyCard.id }));

  // Remove target card from board
  dispatch(removeCardFromBoard({ player, cardId: targetCard.id, row: targetRow }));
  
  // Add target card back to player's hand
  dispatch(addCardToHand({ player, card: targetCard }));
  
  // Place decoy on the board where the target card was (decoy stays on board until round end)
  const decoyForBoard = { 
    ...decoyCard, 
    type: CardType.UNIT, // Decoys become unit cards on board
    strength: 0 
  } as UnitCard;
  dispatch(playCardBasic({ player, card: decoyForBoard, row: targetRow }));
  
  // Track the decoy as a special card on board (for round end cleanup)
  dispatch(addSpecialCardToBoard({ player, card: decoyCard }));
  
  dispatch(setSelectedCard(null));
  dispatch(setIsDecoyActive(false));
});

// Handle Spy card action
export const handleSpyAction = createAsyncThunk<
  void,
  { player: 'player' | 'opponent'; card: UnitCard; row: RowPosition },
  { state: RootState }
>('game/handleSpyAction', async ({ player, card, row }, { dispatch }) => {
  const oppositePlayer = player === 'player' ? 'opponent' : 'player';
  
  // Place spy on opponent's board (opposite player's board)
  dispatch(playCardBasic({ player: oppositePlayer, card, row }));
  
  // Remove spy from current player's hand
  dispatch(removeCardFromHand({ player, cardId: card.id }));
  
  // Draw 2 cards for the player who played the spy
  dispatch(drawCards({ player, count: 2 }));
});

// Handle Medic card action (for AI - with proper chaining)
export const handleMedicAction = createAsyncThunk<
  void,
  { player: 'player' | 'opponent'; card: UnitCard; row: RowPosition; decision?: PlayDecision },
  { state: RootState }
>('game/handleMedicAction', async ({ player, card, row, decision }, { dispatch, getState }) => {
  // Place medic on board first (skip turn switch during medic chains)
  dispatch(playCardBasic({ player, card, row, skipTurnSwitch: true }));
  
  // Handle medic target (for AI) - execute full chain as planned by strategy
  if (decision?.medicTarget) {
    const allTargets = [decision.medicTarget, ...(decision.chainedMedicTargets || [])];
    await dispatch(executeAIMedicChain({ player, targets: allTargets }));
  } else {
    // No targets to revive - switch turns normally
    const state = getState();
    const oppositePlayer = player === 'player' ? 'opponent' : 'player';
    if (!state.game[oppositePlayer].passed) {
      dispatch(setCurrentTurn(oppositePlayer));
    }
  }
});

// Execute AI medic chain recursively
export const executeAIMedicChain = createAsyncThunk<
  void,
  { player: 'player' | 'opponent'; targets: UnitCard[] },
  { state: RootState }
>('game/executeAIMedicChain', async ({ player, targets }, { dispatch, getState }) => {
  if (targets.length === 0) return;
  
  const [currentTarget, ...remainingTargets] = targets;
  
  // Remove target from discard first
  dispatch(removeCardFromDiscard({ player, cardId: currentTarget.id }));
  
  // Handle its placement/effect based on ability
  switch (currentTarget.ability) {
    case CardAbility.SPY:
      // Revived spy should go to opponent's board and draw cards for the player who played it
      const oppositePlayer = player === 'player' ? 'opponent' : 'player';
      dispatch(playCardBasic({ 
        player: oppositePlayer, 
        card: currentTarget, 
        row: currentTarget.row,
        skipTurnSwitch: true
      }));
      dispatch(drawCards({ player, count: 2 }));
      break;
      
    case CardAbility.SCORCH_CLOSE:
      await dispatch(handleScorchCloseAction({ player, card: currentTarget, row: currentTarget.row }));
      break;
      
    case CardAbility.MEDIC:
      // Place the revived medic
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
      
    default:
      dispatch(playCardBasic({ 
        player, 
        card: currentTarget, 
        row: currentTarget.row,
        skipTurnSwitch: true
      }));
      break;
  }
});

// Handle Muster card action
export const handleMusterAction = createAsyncThunk<
  void,
  { player: 'player' | 'opponent'; card: UnitCard; row: RowPosition },
  { state: RootState }
>('game/handleMusterAction', async ({ player, card, row }, { dispatch, getState }) => {
  const state = getState();
  const gameState = state.game;
  const playerState = gameState[player];
  
  const musterCards = findMusterCards(card, playerState.hand, playerState.deck);
  
  // Place original card
  dispatch(playCardBasic({ player, card, row }));
  
  // Place all muster cards in their appropriate rows
  musterCards.forEach((musterCard: any) => {
    dispatch(playCardBasic({ player, card: musterCard, row: musterCard.row }));
  });
});

// Handle Scorch card action  
export const handleScorchAction = createAsyncThunk<
  void,
  { player: 'player' | 'opponent' },
  { state: RootState }
>('game/handleScorchAction', async (_, { dispatch, getState }) => {
  const state = getState();
  const gameState = state.game;
  
  const gameStateWithSet = {
    ...gameState,
    activeWeatherEffects: new Set(gameState.activeWeatherEffects)
  };
  
  const { cards: scorchTargets } = findScorchTargets(gameStateWithSet);
  
  // Remove scorched cards from board and move to discard
  scorchTargets.forEach(target => {
    // Find which board and row the card is on
    ['playerBoard', 'opponentBoard'].forEach(boardKey => {
      ['close', 'ranged', 'siege'].forEach(rowKey => {
        const row = (gameState as any)[boardKey][rowKey as RowPosition];
        if (row.cards.some((c: any) => c.id === target.id)) {
          const targetPlayer = boardKey === 'playerBoard' ? 'player' : 'opponent';
          dispatch(removeCardFromBoard({ 
            player: targetPlayer, 
            cardId: target.id, 
            row: rowKey as RowPosition 
          }));
          dispatch(moveCardToDiscard({ player: targetPlayer, card: target }));
        }
      });
    });
  });
});

// Handle Scorch Close card action
export const handleScorchCloseAction = createAsyncThunk<
  void,
  { player: 'player' | 'opponent'; card: UnitCard; row: RowPosition },
  { state: RootState }
>('game/handleScorchCloseAction', async ({ player, card, row }, { dispatch, getState }) => {
  const state = getState();
  const gameState = state.game;
  
  // Place the unit first
  dispatch(playCardBasic({ player, card, row }));
  
  const gameStateWithSet = {
    ...gameState,
    activeWeatherEffects: new Set(gameState.activeWeatherEffects)
  };
  
  const scorchResult = findCloseScorchTargets(gameStateWithSet, player === 'player');
  if (scorchResult) {
    const { cards: scorchTargets } = scorchResult;
    const oppositePlayer = player === 'player' ? 'opponent' : 'player';
    
    // Remove scorched cards from opponent's close row
    scorchTargets.forEach(target => {
      dispatch(removeCardFromBoard({ 
        player: oppositePlayer, 
        cardId: target.id, 
        row: RowPosition.CLOSE 
      }));
      dispatch(moveCardToDiscard({ player: oppositePlayer, card: target }));
    });
  }
});

// Handle player redraw
export const handlePlayerRedraw = createAsyncThunk<
  void,
  { selectedCards: Card[] },
  { state: RootState }
>('game/handlePlayerRedraw', async ({ selectedCards }, { dispatch, getState }) => {
  const state = getState();
  const gameState = state.game;
  
  // Create new deck with redraw cards added and shuffled
  const newDeck = [...gameState.player.deck, ...selectedCards];
  const shuffledDeck = shuffle(newDeck);
  const drawnCards = shuffledDeck.slice(0, selectedCards.length);
  
  dispatch({
    type: 'game/redrawCards',
    payload: {
      player: 'player',
      cardsToRedraw: selectedCards,
      newCards: drawnCards
    }
  });
});

// Handle Player Medic Chain
export const handlePlayerMedicChain = createAsyncThunk<
  void,
  { medicCard: Card; reviveCard: Card },
  { state: RootState }
>('game/handlePlayerMedicChain', async ({ medicCard, reviveCard }, { dispatch, getState }) => {
  const state = getState();
  const isFirstMedic = !state.ui.medicChainState.isChaining;
  
  if (isFirstMedic) {
    // Start the medic chain with the original medic
    dispatch(startMedicChain(medicCard));
    
    // Place the original medic on board (remove from hand first)
    dispatch(removeCardFromHand({ player: 'player', cardId: medicCard.id }));
    dispatch(playCardBasic({ 
      player: 'player', 
      card: medicCard as UnitCard, 
      row: (medicCard as UnitCard).row,
      skipTurnSwitch: true
    }));
  }
  
  // Remove revived card from discard pile
  dispatch(removeCardFromDiscard({ 
    player: 'player', 
    cardId: reviveCard.id
  }));
  
  // Handle the revived card based on its ability
  
  if (reviveCard.ability === CardAbility.SPY) {
    // Revived spy should go to opponent's board and draw cards for the player
    dispatch(playCardBasic({ 
      player: 'opponent', 
      card: reviveCard as UnitCard, 
      row: (reviveCard as UnitCard).row,
      skipTurnSwitch: true
    }));
    dispatch(drawCards({ player: 'player', count: 2 }));
    
    // End chain and switch turns (SPY ends the chain completely)
    dispatch(endMedicChain());
    dispatch(setSelectedCard(null));
    dispatch(hideCardsSelector());
    dispatch(setCurrentTurn('opponent'));
    
  } else if (reviveCard.ability === CardAbility.MEDIC) {
    // Add this medic to the chain
    dispatch(addMedicToChain(reviveCard));
    
    // Place the revived medic on board
    dispatch(playCardBasic({ 
      player: 'player', 
      card: reviveCard as UnitCard, 
      row: (reviveCard as UnitCard).row,
      skipTurnSwitch: true
    }));
    
    // Check if there are more valid targets in discard to continue chain
    const currentState = getState();
    const placedMedicIds = new Set(currentState.ui.medicChainState.placedMedics.map(m => m.id));
    const remainingTargets = currentState.game.player.discard.filter(card => 
      card.type === CardType.UNIT && 
      card.ability !== CardAbility.DECOY &&
      !placedMedicIds.has(card.id) // Prevent reviving already placed medics
    );
    
    if (remainingTargets.length > 0) {
      // Show medic selector again for chaining - stay on player turn
      dispatch(showCardsSelector('medic'));
    } else {
      // No more valid targets, end chain and switch turns
      dispatch(endMedicChain());
      dispatch(setSelectedCard(null));
      dispatch(hideCardsSelector());
      dispatch(setCurrentTurn('opponent'));
    }
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
      !placedMedicIds.has(card.id) // Prevent reviving already placed medics
    );
    
    if (remainingTargets.length > 0 && currentState.ui.medicChainState.isChaining) {
      // Show medic selector again for chaining - stay on player turn
      dispatch(showCardsSelector('medic'));
    } else {
      // No more valid targets or not in a chain, end chain and switch turns
      dispatch(endMedicChain());
      dispatch(setSelectedCard(null));
      dispatch(hideCardsSelector());
      dispatch(setCurrentTurn('opponent'));
    }
  }
});

// Handle playing a medic without revival (when cancelled or no targets)
export const playMedicWithoutRevival = createAsyncThunk<
  void,
  { player: 'player' | 'opponent'; card: UnitCard; row: RowPosition },
  { state: RootState }
>('game/playMedicWithoutRevival', async ({ player, card, row }, { dispatch, getState }) => {
  const state = getState();
  const oppositePlayer = player === 'player' ? 'opponent' : 'player';
  
  // Place medic on board and remove from hand
  dispatch(removeCardFromHand({ player, cardId: card.id }));
  dispatch(playCardBasic({ player, card, row }));
  
  // Switch turn normally (no medic chain logic)
  if (!state.game[oppositePlayer].passed) {
    dispatch(setCurrentTurn(oppositePlayer));
  }
});

export default {
  initializeNewGame,
  playCardAction,
  handleDecoyAction,
  handleSpyAction,
  handleMedicAction,
  executeAIMedicChain,
  handleMusterAction,
  handleScorchAction,
  handleScorchCloseAction,
  handlePlayerRedraw,
  handlePlayerMedicChain,
  playMedicWithoutRevival,
};