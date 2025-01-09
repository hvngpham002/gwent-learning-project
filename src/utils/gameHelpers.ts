import { BoardState, Card, CardAbility, CardType, GameState, RowPosition, UnitCard } from "@/types/card";

/**
 * Fisher-Yates shuffle algorithm
 * Takes an array of any type and returns a new shuffled array
 */
export const shuffle = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  /**
   * Calculate total strength for a row of cards
   * Takes into account weather effects and special abilities
   */
  export const calculateRowStrength = (cards: UnitCard[], weatherEffect: boolean, hornActive: boolean): number => {
    return cards.reduce((total, card) => {
      let strength = weatherEffect ? 1 : card.strength;

      // Apply horn effect if active
      if (hornActive && card.type !== CardType.HERO) {
        strength *= 2;
      }

      // Add moral boost effects
      const moraleBoostCount = cards.filter(c => c.ability === CardAbility.MORALE_BOOST).length;
      if (card.type !== CardType.HERO) {
        strength += moraleBoostCount;
      }

      // Handle tight bond
      if (card.ability === CardAbility.TIGHT_BOND) {
        const sameNameCount = cards.filter(c => c.name === card.name).length;
        if (sameNameCount > 1) {
          strength *= sameNameCount;
        }
      }

      return total + strength;
    }, 0);
  };

  /**
   * Calculate total score for a player
   * Takes into account all rows and effects
   */
  export const calculateTotalScore = (boardState: BoardState, weatherEffects: Set<CardAbility>): number => {
    const hasFrost = weatherEffects.has(CardAbility.FROST);
    const hasFog = weatherEffects.has(CardAbility.FOG);
    const hasRain = weatherEffects.has(CardAbility.RAIN);
      return (
      calculateRowStrength(boardState.close.cards, hasFrost, boardState.close.hornActive) +
      calculateRowStrength(boardState.ranged.cards, hasFog, boardState.ranged.hornActive) +
      calculateRowStrength(boardState.siege.cards, hasRain, boardState.siege.hornActive)
    );
  };

  /**
   * Check if a card can be played in a specific row
   */
  export const canPlayInRow = (card: Card, row: RowPosition): boolean => {
    if (card.type === CardType.SPECIAL) return true;
    if ('row' in card) {
      return card.row === row || (card.availableRows?.includes(row) ?? false);
    }
    return false;
  };


  export const drawCards = (
    numCards: number,
    currentState: GameState,
    player: 'player' | 'opponent'
  ): GameState => {
    const playerState = player === 'player' ? currentState.player : currentState.opponent;

    const newCards = playerState.deck.slice(0, numCards);
    const remainingDeck = playerState.deck.slice(numCards);

    if (player === 'player') {
      return {
        ...currentState,
        player: {
          ...playerState,
          hand: [...playerState.hand, ...newCards],
          deck: remainingDeck
        }
      };
    } else {
      return {
        ...currentState,
        opponent: {
          ...playerState,
          hand: [...playerState.hand, ...newCards],
          deck: remainingDeck
        },
        currentTurn: currentState.player.passed ? 'opponent' : 'player'
      };
    }
  };