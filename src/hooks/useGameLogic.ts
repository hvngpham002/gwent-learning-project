import { PlayDecision } from "@/ai/strategy";
import { Card, CardAbility, CardType, GameState, LeaderAbility, LeaderCard, RowPosition, SpecialCard, UnitCard } from "@/types/card";
import { drawCards, findCloseScorchTargets, findScorchTargets } from "@/utils/gameHelpers";

export interface SpecialCardAction {
  selectedCard: Card;
  targetCard?: UnitCard;
  targetRow?: RowPosition;
  newGameState: GameState;
}

export const findMusterCards = (
  card: UnitCard,
  hand: Card[],
  deck: Card[]
): UnitCard[] => {
  const musterCards: UnitCard[] = [];
  const cardName = card.name;

  // If this is a variant card (longer name that contains the base card name)
  const baseCardName = findBaseCardName(cardName, [...hand, ...deck]);

  if (cardName === baseCardName) {
    // Base card can find all variants
    const handMatches = hand.filter(c =>
      c.id !== card.id &&
      c.name.startsWith(baseCardName)
    ) as UnitCard[];

    const deckMatches = deck.filter(c =>
      c.name.startsWith(baseCardName)
    ) as UnitCard[];

    musterCards.push(...handMatches, ...deckMatches);
  } else {
    // Variant cards can only find exact matches
    const handMatches = hand.filter(c =>
      c.id !== card.id &&
      c.name === cardName
    ) as UnitCard[];

    const deckMatches = deck.filter(c =>
      c.name === cardName
    ) as UnitCard[];

    musterCards.push(...handMatches, ...deckMatches);
  }

  return musterCards;
};

// Helper function to find the base card name
const findBaseCardName = (cardName: string, allCards: Card[]): string => {
  // Sort all card names by length (shortest first)
  const allNames = [...new Set(allCards.map(c => c.name))].sort((a, b) => a.length - b.length);

  // Find the shortest name that is contained in the current card name
  const baseName = allNames.find(name =>
    cardName.startsWith(name) &&
    allCards.some(c => c.name === name && (c as UnitCard).ability === CardAbility.MUSTER)
  );

  return baseName || cardName;
};

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
  decision?: PlayDecision;
}

export const playCard = ({
  gameState,
  card,
  row,
  targetCard,
  isPlayer,
  decision
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

  if (card.type === CardType.LEADER) {
    const leaderCard = card as LeaderCard;
    let newState = {
      ...gameState,
      [playerKey]: {
        ...gameState[playerKey],
        leader: {
          ...leaderCard,
          used: true
        }
      },
      currentTurn: gameState[oppositeKey].passed ? playerKey : oppositeKey as "player" | "opponent"
    };
  
    // Handle specific leader abilities
    switch (leaderCard.ability) {
      case LeaderAbility.CLEAR_WEATHER:
        newState = {
          ...newState,
          activeWeatherEffects: new Set()
        };
        break;
      // Add other leader abilities here in the future
    }
  
    return newState;
  }

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
    
      // Separate scorched cards by owner
      const playerScorchedCards = scorchTargets.filter(target =>
        Object.values(gameState.playerBoard).some(row =>
          row.cards.some((c: { id: string; }) => c.id === target.id)
        )
      );
    
      const opponentScorchedCards = scorchTargets.filter(target =>
        Object.values(gameState.opponentBoard).some(row =>
          row.cards.some((c: { id: string; }) => c.id === target.id)
        )
      );
    
      return {
        ...gameState,
        player: {
          ...gameState.player,
          // Only modify the player's hand/discard if they played the card
          ...(playerKey === 'player' ? {
            hand: newHand,
            discard: [...gameState.player.discard, ...playerScorchedCards, card]
          } : {
            discard: [...gameState.player.discard, ...playerScorchedCards]
          })
        },
        opponent: {
          ...gameState.opponent,
          // Only modify the opponent's hand/discard if they played the card
          ...(playerKey === 'opponent' ? {
            hand: newHand,
            discard: [...gameState.opponent.discard, ...opponentScorchedCards, card]
          } : {
            discard: [...gameState.opponent.discard, ...opponentScorchedCards]
          })
        },
        playerBoard: {
          close: {
            ...gameState.playerBoard.close,
            cards: gameState.playerBoard.close.cards.filter(c => 
              !scorchTargets.some(sc => sc.id === c.id)
            )
          },
          ranged: {
            ...gameState.playerBoard.ranged,
            cards: gameState.playerBoard.ranged.cards.filter(c => 
              !scorchTargets.some(sc => sc.id === c.id)
            )
          },
          siege: {
            ...gameState.playerBoard.siege,
            cards: gameState.playerBoard.siege.cards.filter(c => 
              !scorchTargets.some(sc => sc.id === c.id)
            )
          }
        },
        opponentBoard: {
          close: {
            ...gameState.opponentBoard.close,
            cards: gameState.opponentBoard.close.cards.filter(c => 
              !scorchTargets.some(sc => sc.id === c.id)
            )
          },
          ranged: {
            ...gameState.opponentBoard.ranged,
            cards: gameState.opponentBoard.ranged.cards.filter(c => 
              !scorchTargets.some(sc => sc.id === c.id)
            )
          },
          siege: {
            ...gameState.opponentBoard.siege,
            cards: gameState.opponentBoard.siege.cards.filter(c => 
              !scorchTargets.some(sc => sc.id === c.id)
            )
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

    const validTargets = gameState[playerKey].discard.filter(c => 
      c.type === CardType.UNIT && 
      c.ability !== CardAbility.DECOY
    );

    if (unitCard.ability === CardAbility.MEDIC) {
      const newHand = gameState[playerKey].hand.filter(c => c.id !== card.id);
      const medicTarget = (isPlayer ? null : decision?.medicTarget) as UnitCard;
      const chainedTargets = (isPlayer ? null : decision?.chainedMedicTargets) || [];
    
      // Play the medic card first
      let stateAfterMedic = {
        ...gameState,
        [playerKey]: {
          ...gameState[playerKey],
          hand: newHand,
          discard: gameState[playerKey].discard.filter(c => 
            c.id !== (medicTarget?.id ?? '') && 
            !chainedTargets.some(ct => ct.id === c.id)
          )
        },
        [boardKey]: {
          ...gameState[boardKey],
          [row]: {
            ...gameState[boardKey][row],
            cards: [...gameState[boardKey][row].cards, unitCard]
          }
        },
        ...(validTargets.length === 0 && {
          currentTurn: gameState[oppositeKey].passed ? playerKey : oppositeKey as "player" | "opponent"
        })
      };
    
      // If AI is playing and has a target, play it
      if (!isPlayer && medicTarget) {
        // Handle the first medic target using existing logic
        stateAfterMedic = handleMedicTarget(stateAfterMedic, medicTarget);
    
        // Handle any chained medic targets
        chainedTargets.forEach(chainTarget => {
          stateAfterMedic = handleMedicTarget(stateAfterMedic, chainTarget);
        });
    
        return stateAfterMedic;
      }
    
      return stateAfterMedic;
    }
    
    // Helper function to handle a single medic target using existing logic
    function handleMedicTarget(state: GameState, target: UnitCard): GameState {
      const oppositeBoard = isPlayer ? 'opponentBoard' : 'playerBoard';
    
      switch (target.ability) {
        case CardAbility.SPY:
          { const stateAfterSpy = {
            ...state,
            [oppositeBoard]: {
              ...state[oppositeBoard],
              [target.row]: {
                ...state[oppositeBoard][target.row],
                cards: [...state[oppositeBoard][target.row].cards, target]
              }
            }
          };
          return drawCards(2, stateAfterSpy, playerKey); }
    
        case CardAbility.SCORCH_CLOSE:
          { const scorchResult = findCloseScorchTargets(state, isPlayer);
          if (scorchResult) {
            const { cards: scorchTargets } = scorchResult;
            return {
              ...state,
              [boardKey]: {
                ...state[boardKey],
                [target.row]: {
                  ...state[boardKey][target.row],
                  cards: [...state[boardKey][target.row].cards, target]
                }
              },
              [oppositeBoard]: {
                ...state[oppositeBoard],
                close: {
                  ...state[oppositeBoard].close,
                  cards: state[oppositeBoard].close.cards.filter(
                    c => !scorchTargets.some(sc => sc.id === c.id)
                  )
                }
              }
            };
          }
          break; }
    
        default:
          return {
            ...state,
            [boardKey]: {
              ...state[boardKey],
              [target.row]: {
                ...state[boardKey][target.row],
                cards: [...state[boardKey][target.row].cards, target]
              }
            },
            currentTurn: state[oppositeKey].passed ? playerKey : oppositeKey
          };
      }
    
      return state;
    }

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

    if (unitCard.ability === CardAbility.MUSTER) {
      const musterCards = findMusterCards(
        unitCard,
        gameState[playerKey].hand,
        gameState[playerKey].deck
      );

      // Remove muster cards from hand and deck
      const newHand = gameState[playerKey].hand.filter(c =>
        !musterCards.some(mc => mc.id === c.id) &&
        c.id !== card.id
      );
      const newDeck = gameState[playerKey].deck.filter(c =>
        !musterCards.some(mc => mc.id === c.id)
      );

      // Add all muster cards to their appropriate rows
      const newBoardState = { ...gameState[boardKey] };

      // Place each muster card in its correct row
      musterCards.forEach(musterCard => {
        const targetRow = musterCard.row;
        newBoardState[targetRow] = {
          ...newBoardState[targetRow],
          cards: [...newBoardState[targetRow].cards, musterCard]
        };
      });

      // Place the original card
      newBoardState[row] = {
        ...newBoardState[row],
        cards: [...newBoardState[row].cards, unitCard]
      };

      return {
        ...gameState,
        [playerKey]: {
          ...gameState[playerKey],
          hand: newHand,
          deck: newDeck
        },
        [boardKey]: newBoardState,
        currentTurn: gameState[oppositeKey].passed ? playerKey : oppositeKey
      };
    }

    if (unitCard.ability === CardAbility.SCORCH_CLOSE) {
      const scorchResult = findCloseScorchTargets(gameState, isPlayer);
      
      if (scorchResult) {
        const { cards: scorchTargets } = scorchResult;
        const oppositeBoard = isPlayer ? 'opponentBoard' : 'playerBoard';
        const oppositePlayer = isPlayer ? 'opponent' : 'player';
    
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
          [oppositeBoard]: {
            ...gameState[oppositeBoard],
            close: {
              ...gameState[oppositeBoard].close,
              cards: gameState[oppositeBoard].close.cards.filter(
                c => !scorchTargets.some(sc => sc.id === c.id)
              )
            }
          },
          [oppositePlayer]: {
            ...gameState[oppositePlayer],
            discard: [
              ...gameState[oppositePlayer].discard,
              ...scorchTargets
            ]
          },
          currentTurn: gameState[oppositeKey].passed ? playerKey : oppositeKey
        };
      }
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

