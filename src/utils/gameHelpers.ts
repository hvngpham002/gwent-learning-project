import { BoardRow, BoardState, Card, CardAbility, CardType, GameState, RowPosition, UnitCard } from "@/types/card";

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

  export const calculateUnitStrength = (
    card: UnitCard,
    weatherEffect: boolean,
    hornActive: boolean,
    moraleBoostCount: number = 0,
    sameNameCardsInRow: number = 1
  ): number => {
    if (card.type === CardType.HERO) {
      return card.strength; // Heroes are immune to effects
    }

    let strength = card.strength;

    // Apply weather effect first
    if (weatherEffect) {
      strength = 1;
    }

    // Apply tight bond multiplier
    if (card.ability === CardAbility.TIGHT_BOND && sameNameCardsInRow > 1) {
      strength *= sameNameCardsInRow;
    }

    // Apply horn effect if active
    if (hornActive) {
      strength *= 2;
    }

    // Add morale boost
    strength += moraleBoostCount;

    return strength;
  };


  /**
   * Calculate total strength for a row of cards
   * Takes into account weather effects and special abilities
   */
  export const calculateRowStrength = (cards: UnitCard[], weatherEffect: boolean, hornActive: boolean): number => {
    return cards.reduce((total, card) => {
      // Calculate morale boost count once per row
      const moraleBoostCount = cards.filter(c => c.ability === CardAbility.MORALE_BOOST).length;

      // Calculate same name cards count for tight bond
      const sameNameCardsInRow = card.ability === CardAbility.TIGHT_BOND
        ? cards.filter(c => c.name === card.name).length
        : 1;

      const strength = calculateUnitStrength(
        card,
        weatherEffect,
        hornActive,
        moraleBoostCount,
        sameNameCardsInRow
      );

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

  export const canPlayWeatherInRow = (ability: CardAbility, row: RowPosition): boolean => {
    switch (ability) {
      case CardAbility.FROST:
        return row === RowPosition.CLOSE;
      case CardAbility.FOG:
        return row === RowPosition.RANGED;
      case CardAbility.RAIN:
        return row === RowPosition.SIEGE;
      default:
        return false;
    }
  };


  export const findHighestStrengthUnits = (gameState: GameState): { cards: UnitCard[], strength: number } => {
    let highestStrength = 0;
    let highestStrengthUnits: UnitCard[] = [];

    // Helper to process each row
    const processRow = (
      row: { cards: Card[] },
      weatherEffect: boolean,
      hornActive: boolean
    ) => {
      row.cards.forEach(card => {
        if (card.type === CardType.UNIT) { // Only process unit cards, not heroes
          const unitCard = card as UnitCard;
          const moraleBoostCount = row.cards.filter(c =>
            c.type === CardType.UNIT && (c as UnitCard).ability === CardAbility.MORALE_BOOST
          ).length;

          const sameNameCardsInRow = row.cards.filter(c => c.name === card.name).length;

          const strength = calculateUnitStrength(
            unitCard,
            weatherEffect,
            hornActive,
            moraleBoostCount,
            sameNameCardsInRow
          );

          if (strength > highestStrength) {
            highestStrength = strength;
            highestStrengthUnits = [unitCard];
          } else if (strength === highestStrength) {
            highestStrengthUnits.push(unitCard);
          }
        }
      });
    };

    // Check each row with appropriate weather effects
    const hasFrost = gameState.activeWeatherEffects.has(CardAbility.FROST);
    const hasFog = gameState.activeWeatherEffects.has(CardAbility.FOG);
    const hasRain = gameState.activeWeatherEffects.has(CardAbility.RAIN);

    // Process player board
    processRow(gameState.playerBoard.close, hasFrost, gameState.playerBoard.close.hornActive);
    processRow(gameState.playerBoard.ranged, hasFog, gameState.playerBoard.ranged.hornActive);
    processRow(gameState.playerBoard.siege, hasRain, gameState.playerBoard.siege.hornActive);

    // Process opponent board
    processRow(gameState.opponentBoard.close, hasFrost, gameState.opponentBoard.close.hornActive);
    processRow(gameState.opponentBoard.ranged, hasFog, gameState.opponentBoard.ranged.hornActive);
    processRow(gameState.opponentBoard.siege, hasRain, gameState.opponentBoard.siege.hornActive);

    return { cards: highestStrengthUnits, strength: highestStrength };
  };

  export const getWeatherAffectedRows = (ability: CardAbility): RowPosition[] => {
    switch (ability) {
      case CardAbility.FROST:
        return [RowPosition.CLOSE];
      case CardAbility.FOG:
        return [RowPosition.RANGED];
      case CardAbility.RAIN:
        return [RowPosition.SIEGE];
      case CardAbility.SKELLIGE_STORM:
        return [RowPosition.RANGED, RowPosition.SIEGE];
      default:
        return [];
    }
  };
  
  export const calculateWeatherImpact = (
    gameState: GameState,
    weatherAbility: CardAbility,
    forOpponent: boolean
  ): number => {
    const affectedRows = getWeatherAffectedRows(weatherAbility);
    const board = forOpponent ? gameState.playerBoard : gameState.opponentBoard;
    
    let currentStrength = 0;
    let weatheredStrength = 0;
  
    affectedRows.forEach(row => {
      const rowCards = board[row].cards.filter(card => card.type !== CardType.HERO);
      currentStrength += calculateRowStrength(rowCards, false, board[row].hornActive);
      weatheredStrength += calculateRowStrength(rowCards, true, board[row].hornActive);
    });
  
    return currentStrength - weatheredStrength;
  };
  
  export const findScorchTargets = (gameState: GameState): { cards: UnitCard[], strength: number } => {
    const allUnits: UnitCard[] = [];
    let maxStrength = 0;
  
    // Helper to process each row
    const processRow = (
      row: BoardRow,
      weatherEffect: boolean,
      hornActive: boolean
    ) => {
      row.cards.forEach(card => {
        if (card.type === CardType.UNIT) {
          const unitCard = card as UnitCard;
          const strength = calculateUnitStrength(
            unitCard,
            weatherEffect,
            hornActive,
            row.cards.filter(c => c.type === CardType.UNIT && (c as UnitCard).ability === CardAbility.MORALE_BOOST).length,
            row.cards.filter(c => c.name === card.name).length
          );
  
          if (strength > maxStrength) {
            maxStrength = strength;
            allUnits.length = 0;
            allUnits.push(unitCard);
          } else if (strength === maxStrength) {
            allUnits.push(unitCard);
          }
        }
      });
    };
  
    // Process all rows from both boards
    [gameState.playerBoard, gameState.opponentBoard].forEach(board => {
      Object.entries(board).forEach(([row, rowState]) => {
        const weatherEffect = gameState.activeWeatherEffects.has(
          row === RowPosition.CLOSE ? CardAbility.FROST :
          row === RowPosition.RANGED ? CardAbility.FOG :
          CardAbility.RAIN
        );
        processRow(rowState, weatherEffect, rowState.hornActive);
      });
    });
  
    return { cards: allUnits, strength: maxStrength };
  };