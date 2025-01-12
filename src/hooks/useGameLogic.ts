import { Card, CardAbility, CardType, GameState, RowPosition, SpecialCard, UnitCard } from "@/types/card";
import { drawCards, findScorchTargets } from "@/utils/gameHelpers";

export interface SpecialCardAction {
  selectedCard: Card;
  targetCard?: UnitCard;
  targetRow?: RowPosition;
  newGameState: GameState;
}

export const handleDecoyAction = (
  gameState: GameState,
  decoyCard: Card,
  targetCard: UnitCard,
  isPlayer: boolean
): GameState => {
  const playerKey = isPlayer ? 'player' : 'opponent';
  const boardKey = isPlayer ? 'playerBoard' : 'opponentBoard';

  // Find the row containing the target card
  let targetRow: RowPosition | undefined;
  Object.entries(gameState[boardKey]).forEach(([row, rowState]) => {
    if (rowState.cards.some((card: { id: string; }) => card.id === targetCard.id)) {
      targetRow = row as RowPosition;
    }
  });

  if (!targetRow) return gameState;

  // Create unique ID for returned card
  const returnedCard = {
    ...targetCard,
    id: `${targetCard.id}_${Date.now()}`
  };

  // Remove decoy from hand and target from board
  const newHand = gameState[playerKey].hand.filter(c => c.id !== decoyCard.id);
  const newRow = {
    ...gameState[boardKey][targetRow],
    cards: gameState[boardKey][targetRow].cards.filter(c => c.id !== targetCard.id)
  };

  // Create new game state with proper turn handling
  return {
    ...gameState,
    [playerKey]: {
      ...gameState[playerKey],
      hand: [...newHand, returnedCard]
    },
    [boardKey]: {
      ...gameState[boardKey],
      [targetRow]: {
        ...newRow,
        cards: [...newRow.cards, {
          ...decoyCard,
          type: CardType.SPECIAL
        } as SpecialCard]
      }
    },
    // Keep turn with player if opponent has passed
    currentTurn: isPlayer && gameState.opponent.passed ? 'player' :
                !isPlayer && gameState.player.passed ? 'opponent' :
                isPlayer ? 'opponent' : 'player'
  };
};

export interface PlayCardParams {
  gameState: GameState;
  card: Card;
  row?: RowPosition;
  targetCard?: UnitCard;
  isPlayer: boolean;
}

export const playCard = ({
  gameState,
  card,
  row,
  targetCard,
  isPlayer
}: PlayCardParams): GameState => {
  const playerKey = isPlayer ? 'player' : 'opponent';
  const boardKey = isPlayer ? 'playerBoard' : 'opponentBoard';
  const oppositeKey = isPlayer ? 'opponent' : 'player';

  console.log('=== Play Card Action ===', {
    player: isPlayer ? 'Player' : 'AI',
    cardName: card.name,
    cardType: card.type,
    row,
    currentTurn: gameState.currentTurn,
    playerPassed: gameState.player.passed,
    opponentPassed: gameState.opponent.passed,
    timestamp: new Date().toISOString()
  });

  // Add return state logging
  const logStateAndReturn = (newState: GameState) => {
    console.log('=== State After Play ===', {
      nextTurn: newState.currentTurn,
      playerHandSize: newState.player.hand.length,
      opponentHandSize: newState.opponent.hand.length,
      playerPassed: newState.player.passed,
      opponentPassed: newState.opponent.passed
    });
    return newState;
  };

  // Handle different card types
  if (card.type === CardType.SPECIAL) {
    // Handle Decoy
    if (card.ability === CardAbility.DECOY && targetCard) {
      return handleDecoyAction(gameState, card, targetCard, isPlayer);
    }

    // Handle Commander's Horn
    if (row && Object.values(RowPosition).includes(row)) {
      const newHand = gameState[playerKey].hand.filter(c => c.id !== card.id);
      return {
        ...gameState,
        [playerKey]: {
          ...gameState[playerKey],
          hand: newHand
        },
        [boardKey]: {
          ...gameState[boardKey],
          [row]: {
            ...gameState[boardKey][row],
            hornActive: true
          }
        },
        currentTurn: gameState[oppositeKey].passed ? playerKey : oppositeKey
      };
    }

    // Handle Weather Cards
    if ([CardAbility.FROST, CardAbility.FOG, CardAbility.RAIN, CardAbility.CLEAR_WEATHER].includes(card.ability)) {
      const newHand = gameState[playerKey].hand.filter(c => c.id !== card.id);
      return {
        ...gameState,
        [playerKey]: {
          ...gameState[playerKey],
          hand: newHand
        },
        activeWeatherEffects: card.ability === CardAbility.CLEAR_WEATHER
          ? new Set()
          : new Set([...gameState.activeWeatherEffects, card.ability]),
        currentTurn: gameState[oppositeKey].passed ? playerKey : oppositeKey
      };
    }

    // Handle Scorch
    if (card.ability === CardAbility.SCORCH) {
      const newHand = gameState[playerKey].hand.filter(c => c.id !== card.id);
      const { cards: scorchTargets } = findScorchTargets(gameState);

      return {
        ...gameState,
        [playerKey]: {
          ...gameState[playerKey],
          hand: newHand
        },
        playerBoard: {
          close: {
            ...gameState.playerBoard.close,
            cards: gameState.playerBoard.close.cards.filter(c => !scorchTargets.some(sc => sc.id === c.id))
          },
          ranged: {
            ...gameState.playerBoard.ranged,
            cards: gameState.playerBoard.ranged.cards.filter(c => !scorchTargets.some(sc => sc.id === c.id))
          },
          siege: {
            ...gameState.playerBoard.siege,
            cards: gameState.playerBoard.siege.cards.filter(c => !scorchTargets.some(sc => sc.id === c.id))
          }
        },
        opponentBoard: {
          close: {
            ...gameState.opponentBoard.close,
            cards: gameState.opponentBoard.close.cards.filter(c => !scorchTargets.some(sc => sc.id === c.id))
          },
          ranged: {
            ...gameState.opponentBoard.ranged,
            cards: gameState.opponentBoard.ranged.cards.filter(c => !scorchTargets.some(sc => sc.id === c.id))
          },
          siege: {
            ...gameState.opponentBoard.siege,
            cards: gameState.opponentBoard.siege.cards.filter(c => !scorchTargets.some(sc => sc.id === c.id))
          }
        },
        currentTurn: gameState[oppositeKey].passed ? playerKey : oppositeKey
      };
    }
  }

  // Handle Unit Cards
  if ((card.type === CardType.UNIT || card.type === CardType.HERO) && row) {
    const unitCard = card as UnitCard ;
    const newHand = gameState[playerKey].hand.filter(c => c.id !== card.id);

    if (unitCard.ability === CardAbility.SPY) {
      const oppositeBoard = isPlayer ? 'opponentBoard' : 'playerBoard';
      const stateAfterPlay = {
        ...gameState,
        [playerKey]: {
          ...gameState[playerKey],
          hand: newHand
        },
        [oppositeBoard]: {
          ...gameState[oppositeBoard],
          [unitCard.row]: {
            ...gameState[oppositeBoard][unitCard.row],
            cards: [...gameState[oppositeBoard][unitCard.row].cards, unitCard]
          }
        },
        currentTurn: gameState[oppositeKey].passed ? playerKey : oppositeKey as "player" | "opponent"
      };
      return drawCards(2, stateAfterPlay, playerKey);
    }

    return {
      ...gameState,
      [playerKey]: {
        ...gameState[playerKey],
        hand: newHand
      },
      [boardKey]: {
        ...gameState[boardKey],
        [row]: {
          ...gameState[boardKey][row],
          cards: [...gameState[boardKey][row].cards, unitCard]
        }
      },
      currentTurn: gameState[oppositeKey].passed ? playerKey : oppositeKey
    };

  }

  return logStateAndReturn(gameState);
};