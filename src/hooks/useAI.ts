// src/hooks/useAI.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import {  Card, GameState } from '@/types/card';
import { playCard as playCardHelper } from './useGameLogic';
import { AIStrategyCoordinator, PlayDecision  } from '../ai/strategy';
import { shuffle } from '@/utils/gameHelpers';

const useAI = (
  gameState: GameState,
  onRoundEnd: () => void,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>,
  setSelectedCard: React.Dispatch<React.SetStateAction<Card | null>>
) => {

  const strategyCoordinator = useMemo(() => new AIStrategyCoordinator(), []);
  const [aiRedrawComplete, setAiRedrawComplete] = useState(false);

  useEffect(() => {
    if (gameState.gamePhase === 'setup' && 
        gameState.opponent.hand.length > 0 && 
        !aiRedrawComplete) {
      setTimeout(() => {
        handleAIRedraw(gameState, setGameState, strategyCoordinator);
        setAiRedrawComplete(true);
      }, 1000);
    }
  }, [gameState, gameState.gamePhase, gameState.opponent.hand.length, setGameState, strategyCoordinator, aiRedrawComplete]);

  const handleAIRedraw = (
    gameState: GameState,
    setGameState: React.Dispatch<React.SetStateAction<GameState>>,
    strategyCoordinator: AIStrategyCoordinator
  ) => {
    const cardsToRedraw = strategyCoordinator.evaluateRedraw(gameState);

    if (cardsToRedraw.length > 0) {

      const newHand = gameState.opponent.hand.filter(
        card => !cardsToRedraw.find(rc => rc.id === card.id)
      );

      const newDeck = [...gameState.opponent.deck, ...cardsToRedraw];
      const shuffledDeck = shuffle(newDeck);
      const drawnCards = shuffledDeck.slice(0, cardsToRedraw.length);
      const remainingDeck = shuffledDeck.slice(cardsToRedraw.length);

      setGameState(prev => ({
        ...prev,
        opponent: {
          ...prev.opponent,
          hand: [...newHand, ...drawnCards],
          deck: remainingDeck
        },
      }));

    }
  };

  const handleOpponentPass = useCallback(() => {

    setGameState(prev => {
      const newState = {
        ...prev,
        opponent: {
          ...prev.opponent,
          passed: true
        },
        currentTurn: prev.player.passed ? prev.currentTurn : 'player',
        gamePhase: prev.player.passed ? 'roundEnd' : prev.gamePhase
      };

      if (prev.player.passed) {
        setTimeout(() => onRoundEnd(), 500);
      }

      return newState;
    });


  }, [onRoundEnd, setGameState]);

  const playCard = useCallback((decision: PlayDecision) => {
    setSelectedCard(decision.card);
  
    const updateStates = async () => {
      await new Promise<void>(resolve => {
        setTimeout(() => {
          setSelectedCard(null);
          resolve();
        }, 1000);
      });
  
      const newState = playCardHelper({
        gameState,
        card: decision.card,
        row: decision.row,
        targetCard: decision.targetCard,
        isPlayer: false,
        decision: decision
      });
      setGameState(newState);
    };
  
    setTimeout(() => {
      updateStates();
    }, 500);
  
  }, [gameState, setGameState, setSelectedCard]);

  const makeOpponentMove = useCallback(() => {
  

     // Check leader ability first if not used
     if (gameState.opponent.leader && !gameState.opponent.leader.used) {

    
      const leaderDecision = strategyCoordinator.evaluateLeader(gameState);

    
      if (leaderDecision) {
      
        playCard(leaderDecision);
        return;
      }
    }
  
    const shouldPassDecision = strategyCoordinator.shouldPass(gameState);

  
    if (shouldPassDecision) {
      handleOpponentPass();
      return;
    }
  
    const decision = strategyCoordinator.evaluateHand(gameState);
  
    if (!decision) {
      handleOpponentPass();
      return;
    }
      
    playCard(decision);
  }, [gameState, handleOpponentPass, playCard, strategyCoordinator]);

  return {
    makeOpponentMove,
    handleOpponentPass,
    setAiRedrawComplete
  };
};

export default useAI;