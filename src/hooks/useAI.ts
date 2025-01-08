import { useCallback } from 'react';
import { Card, UnitCard, CardType, CardAbility, GameState, RowPosition } from '@/types/card';
import { calculateTotalScore, drawCards } from '@/utils/gameHelpers';

const useAI = (
  gameState: GameState,
  onRoundEnd: () => void,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {

  // Find best card for AI to play
  const findBestCard = useCallback((hand: Card[]): UnitCard | null => {
    const playableCards = hand.filter(
      card => card.type === CardType.UNIT || card.type === CardType.HERO
    ) as UnitCard[];

    if (playableCards.length === 0) return null;

    // Prioritize spy cards
    const spyCards = playableCards.filter(card => card.ability === CardAbility.SPY);
    if (spyCards.length > 0) {
      return spyCards[0];
    }

    // If no spy cards, play highest strength card
    return playableCards.reduce((highest, current) =>
      current.strength > highest.strength ? current : highest
    );
  }, []);

  const handleOpponentPass = useCallback(() => {
    console.log('Opponent is passing');

    setGameState(prev => ({
      ...prev,
      opponent: {
        ...prev.opponent,
        passed: true
      },
      currentTurn: 'player'
    }));

    // If both players have passed, end the round
    if (gameState.player.passed) {
      setTimeout(onRoundEnd, 500);
    }
  }, [gameState.player.passed, onRoundEnd, setGameState]);

  const playOpponentSpyCard = useCallback((card: UnitCard, row: RowPosition) => {
    const newHand = gameState.opponent.hand.filter(c => c.id !== card.id);

    setGameState(prevState => {
      // First, place card on player's board
      const stateAfterPlay = {
        ...prevState,
        opponent: {
          ...prevState.opponent,
          hand: newHand
        },
        playerBoard: {
          ...prevState.playerBoard,
          [row]: {
            ...prevState.playerBoard[row],
            cards: [...prevState.playerBoard[row].cards, card]
          }
        }
      };

      // Then draw 2 cards for the opponent
      return drawCards(2, stateAfterPlay, 'opponent');
    });

    // After spy card is played, it becomes player's turn
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentTurn: 'player'
      }));
    }, 500);
  }, [gameState.opponent.hand, setGameState]);

  const playOpponentCard = useCallback((card: UnitCard, row: RowPosition) => {
    const newHand = gameState.opponent.hand.filter(c => c.id !== card.id);

    // Create the new board state that includes the played card
    const newOpponentBoard = {
      ...gameState.opponentBoard,
      [row]: {
        ...gameState.opponentBoard[row],
        cards: [...gameState.opponentBoard[row].cards, card]
      }
    };

    setGameState(prev => ({
      ...prev,
      opponent: {
        ...prev.opponent,
        hand: newHand
      },
      opponentBoard: newOpponentBoard,
      currentTurn: gameState.player.passed ? 'opponent' : 'player'
    }));

    // If player has passed, check if AI should pass using the new board state
    if (gameState.player.passed) {
      const playerScore = calculateTotalScore(gameState.playerBoard, gameState.activeWeatherEffects);
      const opponentScore = calculateTotalScore(newOpponentBoard, gameState.activeWeatherEffects);

      console.log('Scores after AI play:', { player: playerScore, opponent: opponentScore });

      if (opponentScore > playerScore) {
        console.log('AI is winning, will pass');
        handleOpponentPass();
      }
    }
  }, [gameState.opponent.hand, gameState.player.passed, gameState.playerBoard, 
      gameState.activeWeatherEffects, handleOpponentPass, setGameState]);

  // Function to make AI take its turn
  const makeOpponentMove = useCallback(() => {
    const bestCard = findBestCard(gameState.opponent.hand);
    if (bestCard) {
      if (bestCard.ability === CardAbility.SPY) {
        playOpponentSpyCard(bestCard, bestCard.row);
      } else {
        playOpponentCard(bestCard, bestCard.row);
      }
    } else {
      handleOpponentPass();
    }
  }, [findBestCard, gameState.opponent.hand, handleOpponentPass, playOpponentCard, playOpponentSpyCard]);

  return {
    makeOpponentMove,
    handleOpponentPass
  };
};

export default useAI;