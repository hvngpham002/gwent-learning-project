// src/hooks/useAI.ts
import { useCallback, useMemo } from 'react';
import { UnitCard, CardType, GameState, RowPosition, CardAbility } from '@/types/card';
import { drawCards, findScorchTargets } from '@/utils/gameHelpers';
import { handleDecoyAction } from './useGameLogic';
import { AIStrategyCoordinator, PlayDecision  } from '../ai/strategy';

const useAI = (
  gameState: GameState,
  onRoundEnd: () => void,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {
  const strategyCoordinator = useMemo(() => new AIStrategyCoordinator(), []);

  const handleOpponentPass = useCallback(() => {
    console.log('Opponent is passing');
  
    // Use functional update to ensure state consistency
    setGameState(prev => {
      const newState = {
        ...prev,
        opponent: {
          ...prev.opponent,
          passed: true
        },
        currentTurn: prev.player.passed ? prev.currentTurn : 'player'
      };
  
      // If both players have passed, schedule round end
      if (prev.player.passed) {
        setTimeout(() => onRoundEnd(), 500);
      }
  
      return newState;
    });
  }, [onRoundEnd, setGameState]);

  const playCard = useCallback((decision: PlayDecision) => {
    const { card, row, targetCard } = decision;

    // Handle different card types
    if (card.type === CardType.SPECIAL) {

      if (card.ability === CardAbility.DECOY && targetCard) {
        const newState = handleDecoyAction(gameState, card, targetCard, false);
        setGameState(newState);
        return;
      }

      // Handle Commander's Horn
      if (row && Object.values(RowPosition).includes(row)) {
        const newHand = gameState.opponent.hand.filter(c => c.id !== card.id);
        setGameState(prev => ({
          ...prev,
          opponent: {
            ...prev.opponent,
            hand: newHand
          },
          opponentBoard: {
            ...prev.opponentBoard,
            [row]: {
              ...prev.opponentBoard[row],
              hornActive: true
            }
          },
          currentTurn: gameState.player.passed ? 'opponent' : 'player'
        }));
        return;
      }

      if (card.type === CardType.SPECIAL) {
        // Handle weather cards
        if ([CardAbility.FROST, CardAbility.FOG, CardAbility.RAIN, CardAbility.CLEAR_WEATHER].includes(card.ability)) {
          const newHand = gameState.opponent.hand.filter(c => c.id !== card.id);
          setGameState(prev => ({
            ...prev,
            opponent: {
              ...prev.opponent,
              hand: newHand
            },
            activeWeatherEffects: card.ability === CardAbility.CLEAR_WEATHER
              ? new Set()
              : new Set([...prev.activeWeatherEffects, card.ability]),
            currentTurn: gameState.player.passed ? 'opponent' : 'player'
          }));
          return;
        }

        // Handle scorch
        if (card.ability === CardAbility.SCORCH) {
          const newHand = gameState.opponent.hand.filter(c => c.id !== card.id);
          const { cards: scorchTargets } = findScorchTargets(gameState);

          setGameState((prev: GameState) => {
            const newState: GameState = {
              ...prev,
              opponent: {
                ...prev.opponent,
                hand: newHand
              },
              playerBoard: {
                close: {
                  ...prev.playerBoard.close,
                  cards: prev.playerBoard.close.cards.filter(c => !scorchTargets.some((sc: { id: string; }) => sc.id === c.id))
                },
                ranged: {
                  ...prev.playerBoard.ranged,
                  cards: prev.playerBoard.ranged.cards.filter(c => !scorchTargets.some((sc: { id: string; }) => sc.id === c.id))
                },
                siege: {
                  ...prev.playerBoard.siege,
                  cards: prev.playerBoard.siege.cards.filter(c => !scorchTargets.some((sc: { id: string; }) => sc.id === c.id))
                }
              },
              opponentBoard: {
                close: {
                  ...prev.opponentBoard.close,
                  cards: prev.opponentBoard.close.cards.filter(c => !scorchTargets.some((sc: { id: string; }) => sc.id === c.id))
                },
                ranged: {
                  ...prev.opponentBoard.ranged,
                  cards: prev.opponentBoard.ranged.cards.filter(c => !scorchTargets.some((sc: { id: string; }) => sc.id === c.id))
                },
                siege: {
                  ...prev.opponentBoard.siege,
                  cards: prev.opponentBoard.siege.cards.filter(c => !scorchTargets.some((sc: { id: string; }) => sc.id === c.id))
                }
              },
              currentTurn: gameState.player.passed ? 'opponent' : 'player'
            };
            return newState;
          });
          return;
        }
      }
    }

    // Handle unit cards
    if (card.type === CardType.UNIT) {
      const unitCard = card as UnitCard;
      const newHand = gameState.opponent.hand.filter(c => c.id !== card.id);

      if (unitCard.ability === CardAbility.SPY) {
        // Handle spy card
        setGameState(prevState => {
          const stateAfterPlay = {
            ...prevState,
            opponent: {
              ...prevState.opponent,
              hand: newHand
            },
            playerBoard: {
              ...prevState.playerBoard,
              [unitCard.row]: {
                ...prevState.playerBoard[unitCard.row],
                cards: [...prevState.playerBoard[unitCard.row].cards, unitCard]
              }
            }
          };
          return drawCards(2, stateAfterPlay, 'opponent');
        });
      } else {
        // Handle regular unit
        setGameState(prev => ({
          ...prev,
          opponent: {
            ...prev.opponent,
            hand: newHand
          },
          opponentBoard: {
            ...prev.opponentBoard,
            [unitCard.row]: {
              ...prev.opponentBoard[unitCard.row],
              cards: [...prev.opponentBoard[unitCard.row].cards, unitCard]
            }
          },
          currentTurn: gameState.player.passed ? 'opponent' : 'player'
        }));
      }
    }
}, [gameState, setGameState]);

const makeOpponentMove = useCallback(() => {
  console.log('=== AI Turn Start ===');

  // Check if we should pass
  const shouldPassDecision = strategyCoordinator.shouldPass(gameState);
  console.log('Pass decision:', {
      shouldPass: shouldPassDecision,
      currentHand: gameState.opponent.hand.length
  });

  if (shouldPassDecision) {
      console.log('AI deciding to pass');
      handleOpponentPass();
      return;
  }

  // Get the best move
  const decision = strategyCoordinator.evaluateHand(gameState);
  console.log('Move decision:', {
      hasDecision: !!decision,
      cardType: decision?.card.type,
      cardName: decision?.card.name,
      score: decision?.score
  });

  if (!decision) {
      console.log('No valid moves found, passing by default');
      handleOpponentPass();
      return;
  }

  // Execute the move
  console.log('Executing move:', decision);
  playCard(decision);
}, [gameState, handleOpponentPass, playCard, strategyCoordinator]);

  return {
    makeOpponentMove,
    handleOpponentPass
  };
};

export default useAI;