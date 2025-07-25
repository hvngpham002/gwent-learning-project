import { useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { AIStrategyCoordinator, PlayDecision } from '@/ai/strategy';
import { 
  selectGameStateForAI, 
  selectCurrentTurn, 
  selectGamePhase,
  selectOpponentPassed,
  selectPlayerPassed,
  selectIsAIMoving,
  selectOpponentLeader
} from '@/store/selectors/gameSelectors';
import { 
  opponentPass, 
  redrawCards
} from '@/store/slices/gameSlice';
import { 
  setSelectedCard, 
  setIsAIMoving, 
  setAiRedrawComplete 
} from '@/store/slices/uiSlice';
import { playCardAction } from '@/store/thunks/gameThunks';
import { calculateTotalScore, shuffle } from '@/utils/gameHelpers';

export const useReduxAI = () => {
  const dispatch = useAppDispatch();
  const gameState = useAppSelector(selectGameStateForAI);
  const currentTurn = useAppSelector(selectCurrentTurn);
  const gamePhase = useAppSelector(selectGamePhase);
  const opponentPassed = useAppSelector(selectOpponentPassed);
  const playerPassed = useAppSelector(selectPlayerPassed);
  const isAIMoving = useAppSelector(selectIsAIMoving);
  const opponentLeader = useAppSelector(selectOpponentLeader);
  const aiRedrawComplete = useAppSelector(state => state.ui.aiRedrawComplete);

  const strategyCoordinator = useMemo(() => new AIStrategyCoordinator(), []);

  // Handle AI redraw during setup phase
  useEffect(() => {
    if (gamePhase === 'setup' && 
        gameState.opponent.hand.length > 0 && 
        !aiRedrawComplete) {
      setTimeout(() => {
        handleAIRedraw();
        dispatch(setAiRedrawComplete(true));
      }, 1000);
    }
  }, [gamePhase, gameState.opponent.hand.length, aiRedrawComplete, dispatch]);

  const handleAIRedraw = useCallback(() => {
    const cardsToRedraw = strategyCoordinator.evaluateRedraw(gameState);
    
    if (cardsToRedraw.length > 0) {
      console.log('=== AI Executing Redraw ===');
      
      // Cards will be filtered by the redrawCards action

      const newDeck = [...gameState.opponent.deck, ...cardsToRedraw];
      const shuffledDeck = shuffle(newDeck);
      const drawnCards = shuffledDeck.slice(0, cardsToRedraw.length);

      dispatch(redrawCards({
        player: 'opponent',
        cardsToRedraw,
        newCards: drawnCards
      }));

      console.log('AI redraw completed:', {
        redrawCount: cardsToRedraw.length,
        newCards: drawnCards.map(card => ({ name: card.name, type: card.type }))
      });
    } else {
      console.log('AI decided not to redraw any cards');
    }
  }, [gameState, strategyCoordinator, dispatch]);

  const handleOpponentPass = useCallback(() => {
    console.log('Opponent is passing');
    dispatch(opponentPass());
    // Round end logic is handled by useEffect in ReduxGameManager
  }, [dispatch]);

  const playCard = useCallback((decision: PlayDecision) => {
    dispatch(setSelectedCard(decision.card));
  
    const executeMove = async () => {
      await new Promise<void>(resolve => {
        setTimeout(() => {
          dispatch(setSelectedCard(null));
          resolve();
        }, 1000);
      });
  
      await dispatch(playCardAction({
        player: 'opponent',
        card: decision.card,
        row: decision.row,
        targetCard: decision.targetCard,
        decision: decision
      }));
    };
  
    setTimeout(() => {
      executeMove();
    }, 500);
  }, [dispatch]);

  const makeOpponentMove = useCallback(() => {
    if (isAIMoving) return;

    console.log('=== AI Turn Start ===', {
      timestamp: new Date().toISOString(),
      handSize: gameState.opponent.hand.length,
      playerScore: calculateTotalScore(gameState.playerBoard, new Set(gameState.activeWeatherEffects)),
      opponentScore: calculateTotalScore(gameState.opponentBoard, new Set(gameState.activeWeatherEffects)),
      weatherEffects: gameState.activeWeatherEffects,
      currentTurn: gameState.currentTurn
    });

    dispatch(setIsAIMoving(true));

    // Check leader ability first if not used
    if (opponentLeader && !opponentLeader.used) {
      console.log('=== AI Leader Card Analysis ===', {
        leaderName: opponentLeader.name,
        leaderAbility: opponentLeader.ability,
        weatherEffects: gameState.activeWeatherEffects,
        currentScore: calculateTotalScore(gameState.opponentBoard, new Set(gameState.activeWeatherEffects))
      });
    
      const leaderDecision = strategyCoordinator.evaluateLeader(gameState);
      console.log('Leader decision result:', {
        willPlay: !!leaderDecision,
        score: leaderDecision?.score || 'N/A'
      });
    
      if (leaderDecision) {
        console.log('Playing leader ability:', {
          leader: opponentLeader.name,
          ability: opponentLeader.ability,
          score: leaderDecision.score
        });
        playCard(leaderDecision);
        dispatch(setIsAIMoving(false));
        return;
      }
    }
  
    // Add detailed hand logging
    console.log('=== AI Hand Analysis ===', {
      cards: gameState.opponent.hand.map(card => ({
        name: card.name,
        type: card.type,
        strength: 'strength' in card ? card.strength : 'N/A',
        ability: card.ability || 'none',
        row: 'row' in card ? card.row : 'N/A'
      }))
    });
  
    const shouldPassDecision = strategyCoordinator.shouldPass(gameState);
    console.log('Pass decision:', {
      shouldPass: shouldPassDecision,
      currentHand: gameState.opponent.hand.length,
      playerPassed: gameState.player.passed
    });
  
    if (shouldPassDecision) {
      console.log('AI deciding to pass');
      handleOpponentPass();
      dispatch(setIsAIMoving(false));
      return;
    }
  
    const decision = strategyCoordinator.evaluateHand(gameState);
    console.log('Move decision:', {
      hasDecision: !!decision,
      cardType: decision?.card.type,
      cardName: decision?.card.name,
      score: decision?.score,
      targetRow: decision?.row
    });
  
    if (!decision) {
      console.log('No valid moves found, passing by default');
      handleOpponentPass();
      dispatch(setIsAIMoving(false));
      return;
    }
  
    console.log('Executing move:', {
      card: decision.card.name,
      type: decision.card.type,
      row: decision.row,
      timestamp: new Date().toISOString()
    });
    
    playCard(decision);
    dispatch(setIsAIMoving(false));
  }, [
    gameState, 
    strategyCoordinator, 
    handleOpponentPass, 
    playCard, 
    isAIMoving, 
    opponentLeader,
    dispatch
  ]);

  // Effect to trigger AI moves
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
  
    if (gamePhase === 'playing') {
      console.log('=== Turn Change ===', {
        phase: gamePhase,
        currentTurn: currentTurn,
        playerPassed: playerPassed,
        opponentPassed: opponentPassed,
        timestamp: new Date().toISOString()
      });
    }
  
    const shouldMakeMove = 
      currentTurn === 'opponent' &&
      gamePhase === 'playing' &&
      !opponentPassed;

    if (shouldMakeMove && !isAIMoving) {
      timeoutId = setTimeout(() => {
        makeOpponentMove();
      }, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    gamePhase, 
    currentTurn, 
    playerPassed, 
    opponentPassed, 
    isAIMoving,
    makeOpponentMove
  ]);

  return {
    makeOpponentMove,
    handleOpponentPass,
  };
};