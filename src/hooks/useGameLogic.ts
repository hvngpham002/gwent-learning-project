import { Card, CardType, GameState, RowPosition, SpecialCard, UnitCard } from "@/types/card";

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

  // Create new game state
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
    }
  };
};