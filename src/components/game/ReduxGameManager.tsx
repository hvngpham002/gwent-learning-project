import React, { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { 
  Card, 
  CardType, 
  CardAbility, 
  UnitCard, 
  SpecialCard, 
  RowPosition,
  LeaderAbility 
} from '@/types/card';
import GameBoard from './GameBoard';
import { canPlayWeatherInRow } from '@/utils/gameHelpers';
import { 
  selectGameState,
  selectSelectedCard,
  selectIsDecoyActive,
  selectCardsSelector,
  selectCanPlayerAct,
  selectPlayerHand,
  selectPlayerDiscard,
  selectCurrentTurn,
  selectPlayerPassed,
  selectGamePhase,
  selectRedrawCount
} from '@/store/selectors/gameSelectors';
import {
  playerPass,
  setGamePhase,
  endRound
} from '@/store/slices/gameSlice';
import {
  setSelectedCard,
  setIsDecoyActive,
  setCardsSelector,
  showCardsSelector,
  hideCardsSelector,
  incrementRedrawCount,
  resetRedrawCount,
  updateGameScores
} from '@/store/slices/uiSlice';
import { 
  initializeNewGame,
  playCardAction,
  handlePlayerRedraw,
  handlePlayerMedicChain,
  playMedicWithoutRevival
} from '@/store/thunks/gameThunks';
import { useReduxAI } from '@/hooks/useReduxAI';
import DisclaimerModal from '../DisclaimerModal';
import { calculateTotalScore } from '@/utils/gameHelpers';

const ReduxGameManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector(selectGameState);
  const selectedCard = useAppSelector(selectSelectedCard);
  const isDecoyActive = useAppSelector(selectIsDecoyActive);
  const cardsSelector = useAppSelector(selectCardsSelector);
  const canPlayerAct = useAppSelector(selectCanPlayerAct);
  const playerHand = useAppSelector(selectPlayerHand);
  const playerDiscard = useAppSelector(selectPlayerDiscard);
  const currentTurn = useAppSelector(selectCurrentTurn);
  const playerPassed = useAppSelector(selectPlayerPassed);
  const gamePhase = useAppSelector(selectGamePhase);
  const redrawCount = useAppSelector(selectRedrawCount);

  // Initialize AI hook
  useReduxAI();

  // Initialize game on mount
  useEffect(() => {
    const storedScores = JSON.parse(localStorage.getItem('gwentScores') || '{"player": 0, "opponent": 0}');
    dispatch(updateGameScores(storedScores));

    // Only initialize once at the start
    if (gamePhase === 'setup' &&
        gameState.player.hand.length === 0 &&
        gameState.opponent.hand.length === 0) {
      dispatch(resetRedrawCount());
      dispatch(initializeNewGame({ 
        playerScore: storedScores.player, 
        opponentScore: storedScores.opponent 
      }));
      dispatch(showCardsSelector('redraw'));
    }
  }, [dispatch, gamePhase, gameState.player.hand.length, gameState.opponent.hand.length]);

  // Handle when both players pass - trigger round end
  useEffect(() => {
    if (gamePhase === 'playing' && playerPassed && gameState.opponent.passed) {
      console.log('Both players passed, triggering round end');
      setTimeout(() => {
        dispatch(setGamePhase('roundEnd'));
      }, 500);
    }
  }, [gamePhase, playerPassed, gameState.opponent.passed, dispatch]);

  // Handle round end
  const handleRoundEnd = useCallback(() => {
    if (gamePhase !== 'roundEnd') return;

    const playerScore = calculateTotalScore(gameState.playerBoard, new Set(gameState.activeWeatherEffects));
    const opponentScore = calculateTotalScore(gameState.opponentBoard, new Set(gameState.activeWeatherEffects));

    console.log('Final scores:', { player: playerScore, opponent: opponentScore });

    dispatch(endRound({ playerScore, opponentScore }));

    // Check for game end and handle new game initialization
    if (gameState.player.lives === 1 || gameState.opponent.lives === 1) {
      let winner: 'player' | 'opponent' | 'draw' = 'draw';
      
      if (gameState.player.lives === 1 && gameState.opponent.lives > 1) {
        winner = 'opponent';
      } else if (gameState.opponent.lives === 1 && gameState.player.lives > 1) {
        winner = 'player';
      }

      // Update local storage with game scores
      const storedScores = JSON.parse(localStorage.getItem('gwentScores') || '{"player": 0, "opponent": 0}');
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
    }
  }, [dispatch, gamePhase, gameState]);

  // Handle round end phase
  useEffect(() => {
    if (gamePhase === 'roundEnd') {
      handleRoundEnd();
    }
  }, [gamePhase, handleRoundEnd]);

  // Handle card clicks
  const handleCardClick = useCallback((card: Card) => {
    if (!canPlayerAct) return;
  
    // Verify card is in player's hand before any selection
    const cardInHand = playerHand.find(c => c.id === card.id);
    if (!cardInHand) return;
  
    // If clicking the same card, deselect it
    if (selectedCard?.id === card.id) {
      dispatch(setSelectedCard(null));
      dispatch(setIsDecoyActive(false));
      return;
    }
  
    // Handle decoy selection
    if (card.type === CardType.SPECIAL) {
      dispatch(setIsDecoyActive(false));
  
      switch (card.ability) {
        case CardAbility.DECOY:
          dispatch(setSelectedCard(card));
          dispatch(setIsDecoyActive(true));
          return;
        case CardAbility.COMMANDERS_HORN:
        case CardAbility.FROST:
        case CardAbility.FOG:
        case CardAbility.RAIN:
        case CardAbility.CLEAR_WEATHER:
        case CardAbility.SCORCH:
          dispatch(setSelectedCard(card));
          return;
      }
    }

    // Handle unit/hero selection (including medics)
    if (card.type === CardType.UNIT || card.type === CardType.HERO) {
      dispatch(setSelectedCard(card));
      dispatch(setIsDecoyActive(false));
    }
  }, [canPlayerAct, playerHand, selectedCard, playerDiscard, dispatch]);

  // Handle medic card selection
  const handleMedicCardSelect = useCallback(async (selectedCards: Card[]) => {
    if (!selectedCard || selectedCards.length !== 1) return;

    const medicCard = selectedCard;
    const reviveCard = selectedCards[0] as UnitCard;

    // Use the new medic chain handler
    await dispatch(handlePlayerMedicChain({
      medicCard,
      reviveCard
    }));

    // Chain state handling is done in the thunk
  }, [selectedCard, dispatch]);

  // Handle board unit clicks (for decoy)
  const handleBoardUnitClick = useCallback((card: UnitCard) => {
    if (!isDecoyActive || !selectedCard) return;
    if (card.type !== CardType.UNIT || card.ability === CardAbility.DECOY) return;

    dispatch(playCardAction({
      player: 'player',
      card: selectedCard,
      targetCard: card
    }));

    dispatch(setSelectedCard(null));
    dispatch(setIsDecoyActive(false));
  }, [isDecoyActive, selectedCard, dispatch]);

  // Handle row clicks
  const handleRowClick = useCallback((row: RowPosition) => {
    if (!selectedCard || currentTurn !== 'player') return;

    if (selectedCard.type === CardType.SPECIAL && selectedCard.ability === CardAbility.DECOY) {
      return;
    }

    if (selectedCard.type === CardType.UNIT || selectedCard.type === CardType.HERO) {
      const unitCard = selectedCard as UnitCard;

      if (unitCard.row === row || unitCard.availableRows?.includes(row)) {
        // Check if this is a medic with valid targets
        if (unitCard.ability === CardAbility.MEDIC && playerDiscard.length > 0) {
          const validTargets = playerDiscard.filter((c: any) => 
            c.type === CardType.UNIT && c.ability !== CardAbility.DECOY
          );
          if (validTargets.length > 0) {
            // For medics, show the medic selector instead of playing immediately
            dispatch(showCardsSelector('medic'));
            return;
          }
        }

        // Regular unit/hero card play (including medics with no valid targets)
        dispatch(playCardAction({
          player: 'player',
          card: unitCard,
          row
        }));
        dispatch(setSelectedCard(null));
        dispatch(setIsDecoyActive(false));
      }
    }

    if (selectedCard.type === CardType.SPECIAL) {
      const specialCard = selectedCard as SpecialCard;

      switch (selectedCard.ability) {
        case CardAbility.COMMANDERS_HORN:
          dispatch(playCardAction({
            player: 'player',
            card: specialCard,
            row
          }));
          break;
        case CardAbility.FROST:
        case CardAbility.FOG:
        case CardAbility.RAIN:
          if (canPlayWeatherInRow(specialCard.ability, row)) {
            dispatch(playCardAction({
              player: 'player',
              card: specialCard
            }));
          }
          break;
        case CardAbility.SCORCH:
          dispatch(playCardAction({
            player: 'player',
            card: specialCard
          }));
          break;
      }
      
      dispatch(setSelectedCard(null));
      dispatch(setIsDecoyActive(false));
    }
  }, [selectedCard, currentTurn, dispatch]);

  // Handle weather row clicks
  const handleWeatherRowClick = useCallback(() => {
    if (!selectedCard || selectedCard.type !== CardType.SPECIAL) return;

    const ability = selectedCard.ability;
    if (ability === CardAbility.FROST ||
        ability === CardAbility.FOG ||
        ability === CardAbility.RAIN ||
        ability === CardAbility.CLEAR_WEATHER) {
      dispatch(playCardAction({
        player: 'player',
        card: selectedCard
      }));
      dispatch(setSelectedCard(null));
    }
  }, [selectedCard, dispatch]);

  // Handle pass
  const handlePass = useCallback(() => {
    if (currentTurn !== 'player' || playerPassed) return;

    dispatch(playerPass());
    // Round end logic is handled by useEffect above
  }, [currentTurn, playerPassed, dispatch]);

  // Handle redraw
  const handleRedraw = useCallback((selectedCards: Card[]) => {
    console.log('=== GameManager Redraw ===', {
      selectedCards,
      currentRedrawCount: redrawCount,
      currentHand: gameState.player.hand,
      currentDeck: gameState.player.deck,
      timestamp: new Date().toISOString()
    });

    if (selectedCards.length > 0) {
      dispatch(handlePlayerRedraw({ selectedCards }));
      dispatch(incrementRedrawCount());
      
      // Check if this was the second redraw or player chooses to end redraw
      if (redrawCount >= 1) {
        setTimeout(() => {
          dispatch(setGamePhase('playing'));
          dispatch(hideCardsSelector());
        }, 100);
      }
    }
  }, [gameState.player, dispatch, redrawCount]);


  // Handle discard pile view
  const handleDiscardPile = useCallback(() => {
    dispatch(showCardsSelector('discard-view'));
  }, [dispatch]);

  // Handle leader ability
  const handleLeaderAbility = useCallback(() => {
    console.log('Leader ability clicked');
    if (gameState.player.leader?.ability === LeaderAbility.DRAW_OPPONENT_DISCARD) {
      dispatch(showCardsSelector('draw_opponent_discard'));
    }
  }, [gameState.player.leader, dispatch]);

  // Handle setGameState for backward compatibility with GameCardsSelector
  const handleSetGameState = useCallback((newState: any) => {
    if (typeof newState === 'function') {
      // Handle function-based state updates
      const updatedState = newState({
        ...gameState,
        activeWeatherEffects: new Set(gameState.activeWeatherEffects)
      });
      
      if (updatedState.gamePhase === 'playing') {
        // Check if medic selector is being cancelled
        if (cardsSelector.title === 'medic' && selectedCard && selectedCard.ability === CardAbility.MEDIC) {
          // Play the medic without revival
          dispatch(playMedicWithoutRevival({
            player: 'player',
            card: selectedCard as UnitCard,
            row: (selectedCard as UnitCard).row
          }));
          dispatch(setSelectedCard(null));
        }
        
        dispatch(setGamePhase('playing'));
        dispatch(hideCardsSelector());
      }
    } else if (newState.gamePhase === 'playing') {
      // Handle direct state updates
      // Check if medic selector is being cancelled
      if (cardsSelector.title === 'medic' && selectedCard && selectedCard.ability === CardAbility.MEDIC) {
        // Play the medic without revival
        dispatch(playMedicWithoutRevival({
          player: 'player',
          card: selectedCard as UnitCard,
          row: (selectedCard as UnitCard).row
        }));
        dispatch(setSelectedCard(null));
      }
      
      dispatch(setGamePhase('playing'));
      dispatch(hideCardsSelector());
    }
  }, [gameState, dispatch, cardsSelector.title, selectedCard]);

  return (
    <React.Fragment>
      <DisclaimerModal />
      <GameBoard
        gameState={{
          ...gameState,
          activeWeatherEffects: new Set(gameState.activeWeatherEffects)
        }}
        setGameState={handleSetGameState}
        cardsSelector={cardsSelector}
        setCardsSelector={(config) => dispatch(setCardsSelector(config))}
        onCardClick={handleCardClick}
        onRowClick={handleRowClick}
        onWeatherRowClick={handleWeatherRowClick}
        onBoardUnitClick={handleBoardUnitClick}
        onPass={handlePass}
        selectedCard={selectedCard}
        setSelectedCard={(card) => dispatch(setSelectedCard(card))}
        isDecoyActive={isDecoyActive}
        handleDiscardPile={handleDiscardPile}
        onRedraw={handleRedraw}
        onMedicSelect={handleMedicCardSelect}
        onLeaderAbility={handleLeaderAbility}
      />
    </React.Fragment>
  );
};

export default ReduxGameManager;