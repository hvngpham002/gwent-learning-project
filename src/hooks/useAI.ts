// src/hooks/useAI.ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import {  Card, GameState } from '@/types/card';
import { playCard as playCardHelper } from './useGameLogic';
import { AIStrategyCoordinator, PlayDecision  } from '../ai/strategy';
import { calculateTotalScore, shuffle } from '@/utils/gameHelpers';

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
      console.log('=== AI Executing Redraw ===');
      
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

      console.log('new hand:', [...newHand, ...drawnCards].map(card => ({
        name: card.name,
        type: card.type,
        strength: 'strength' in card ? card.strength : 'N/A',
        ability: card.ability
      })));
      
    } else {
      console.log('AI decided not to redraw any cards');
    }
  };

  const handleOpponentPass = useCallback(() => {
    console.log('Opponent is passing');

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

    setTimeout(() => {
      const newState = playCardHelper({
        gameState,
        card: decision.card,
        row: decision.row,
        targetCard: decision.targetCard,
        isPlayer: false
      });
      setGameState(newState);
      setSelectedCard(null);
    }, 1000);

  }, [gameState, setGameState, setSelectedCard]);

  const makeOpponentMove = useCallback(() => {
    console.log('=== AI Turn Start ===', {
      timestamp: new Date().toISOString(),
      handSize: gameState.opponent.hand.length,
      playerScore: calculateTotalScore(gameState.playerBoard, gameState.activeWeatherEffects),
      opponentScore: calculateTotalScore(gameState.opponentBoard, gameState.activeWeatherEffects),
      weatherEffects: Array.from(gameState.activeWeatherEffects),
      currentTurn: gameState.currentTurn
    });
  
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
      return;
    }
  
    console.log('Executing move:', {
      card: decision.card.name,
      type: decision.card.type,
      row: decision.row,
      timestamp: new Date().toISOString()
    });
    
    playCard(decision);
  }, [gameState, handleOpponentPass, playCard, strategyCoordinator]);

  return {
    makeOpponentMove,
    handleOpponentPass
  };
};

export default useAI;