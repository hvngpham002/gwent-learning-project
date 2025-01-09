import { useCallback } from 'react';
import { Card, UnitCard, CardType, CardAbility, GameState, RowPosition, SpecialCard } from '@/types/card';
import { calculateTotalScore, drawCards } from '@/utils/gameHelpers';
import { handleDecoyAction } from './useGameLogic';

const useAI = (
  gameState: GameState,
  onRoundEnd: () => void,
  setGameState: React.Dispatch<React.SetStateAction<GameState>>
) => {

  // Find best card for AI to play
    const findBestCard = useCallback((hand: Card[]): (UnitCard | SpecialCard | null) => {
        // First, filter to only UnitCard and SpecialCard types
        const playableCards = hand.filter(
        (card): card is UnitCard | SpecialCard =>
        card.type === CardType.UNIT ||
        card.type === CardType.SPECIAL
        );

        if (playableCards.length === 0) return null;

        // First priority: Play decoy on valuable units
        const decoyCard = playableCards.find(card =>
        card.type === CardType.SPECIAL && card.ability === CardAbility.DECOY
        );

        if (decoyCard) {
        const bestTarget = findBestDecoyTarget(gameState, false);
        if (bestTarget) {
            return decoyCard;
        }
        }

        // Second priority: Play spy cards
        const spyCards = playableCards.filter((card): card is UnitCard =>
            card.type === CardType.UNIT &&
            card.ability === CardAbility.SPY
        );

        if (spyCards.length > 0) {
        return spyCards[0];
        }

        // Last priority: Play highest strength unit
        const unitCards = playableCards.filter(
        (card): card is UnitCard => card.type === CardType.UNIT
        );

        if (unitCards.length === 0) return null;

        return unitCards.reduce((highest, current) =>
        current.strength > highest.strength ? current : highest
        );
    }, [gameState]);

  const findBestDecoyTarget = (gameState: GameState, isPlayer: boolean): UnitCard | null => {
    const board = isPlayer ? gameState.playerBoard : gameState.opponentBoard;
    const allUnits: { card: UnitCard; row: RowPosition }[] = [];

    // Collect all valid units from each row
    Object.entries(board).forEach(([rowKey, rowState]) => {
      const row = rowKey as RowPosition;
      rowState.cards
        .filter((card: { type: CardType; }) => card.type === CardType.UNIT)
        .forEach((card: UnitCard) => {
          allUnits.push({ card: card as UnitCard, row });
        });
    });

    if (allUnits.length === 0) return null;

    // Prioritize:
    // 1. High-value units that opponent might target (strength > 7)
    // 2. Units with special abilities (spy, medic, etc.)
    // 3. Highest strength unit if no special targets found

    // First check for high-value units
    const highValueTarget = allUnits.find(({ card }) => card.strength > 7);
    if (highValueTarget) return highValueTarget.card;

    // Then check for units with useful abilities
    const specialAbilityTarget = allUnits.find(({ card }) => 
      card.ability === CardAbility.MEDIC || 
      card.ability === CardAbility.SPY ||
      card.ability === CardAbility.TIGHT_BOND
    );
    if (specialAbilityTarget) return specialAbilityTarget.card;

    // Finally, just return the highest strength unit
    return allUnits.reduce((highest, current) => 
      current.card.strength > highest.card.strength ? current : highest
    ).card;
  };

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
        if (!bestCard) {
        handleOpponentPass();
        return;
        }

        // Handle different card types
        if (bestCard.type === CardType.SPECIAL) {
        if (bestCard.ability === CardAbility.DECOY) {
            const bestTarget = findBestDecoyTarget(gameState, false);
            if (bestTarget) {
            const newState = handleDecoyAction(gameState, bestCard, bestTarget, false);
            setGameState({
                ...newState,
                currentTurn: gameState.player.passed ? 'opponent' : 'player'
            });
            return;
            }
        }
        // If no good target found for special card, find another card to play
        makeOpponentMove();
        return;
        }

        // Now we know it's a UnitCard
        const unitCard = bestCard as UnitCard;
        if (unitCard.ability === CardAbility.SPY) {
        playOpponentSpyCard(unitCard, unitCard.row);
        } else {
        playOpponentCard(unitCard, unitCard.row);
        }
    }, [findBestCard, gameState, handleOpponentPass, playOpponentCard, playOpponentSpyCard, setGameState]);

  return {
    makeOpponentMove,
    handleOpponentPass
  };
};

export default useAI;