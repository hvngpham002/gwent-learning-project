import { useState, useEffect } from 'react';
import { Card, PlayerState, GameState, BoardState, RowPosition, CardType, UnitCard, CardAbility } from '@/types/card';
import GameBoard from './GameBoard';
import { shuffle } from '@/utils/gameHelpers';
import { createInitialDeck } from '@/utils/deckBuilder';
import '@/styles/components/board.css';
import '@/styles/components/card.css';

const initialPlayerState: PlayerState = {
  deck: [],
  hand: [],
  discard: [],
  leader: null,
  passed: false,
  lives: 2
};

const initialBoardState: BoardState = {
  close: { cards: [], hornActive: false },
  ranged: { cards: [], hornActive: false },
  siege: { cards: [], hornActive: false }
};

const GameManager = () => {
  const [gameState, setGameState] = useState<GameState>({
    player: initialPlayerState,
    opponent: initialPlayerState,
    playerBoard: initialBoardState,
    opponentBoard: initialBoardState,
    currentRound: 1,
    playerScore: 0,
    opponentScore: 0,
    currentTurn: Math.random() < 0.5 ? 'player' : 'opponent',
    gamePhase: 'setup',
    activeWeatherEffects: new Set<CardAbility>()
  });

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    if (gameState.gamePhase === 'setup') {
      initializeGame();
    }
  }, []);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (gameState.currentTurn === 'opponent' &&
        gameState.gamePhase === 'playing' &&
        !gameState.opponent.passed) {
      timeoutId = setTimeout(() => {
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
      }, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [gameState.currentTurn, gameState.gamePhase]);

  const initializeGame = () => {
    const playerDeckWithLeader = createInitialDeck();
    const opponentDeckWithLeader = createInitialDeck();

    const playerDeck = shuffle(playerDeckWithLeader.deck);
    const opponentDeck = shuffle(opponentDeckWithLeader.deck);

    // Initial draw of 10 cards
    const playerHand = playerDeck.splice(0, 10);
    const opponentHand = opponentDeck.splice(0, 10);

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        deck: playerDeck,
        hand: playerHand,
        leader: playerDeckWithLeader.leader
      },
      opponent: {
        ...prev.opponent,
        deck: opponentDeck,
        hand: opponentHand,
        leader: opponentDeckWithLeader.leader
      },
      currentTurn: Math.random() < 0.5 ? 'player' : 'opponent',
      gamePhase: 'playing'
    }));
  };

  const drawCards = (numCards: number, currentState: GameState, player: 'player' | 'opponent'): GameState => {
    const newState = { ...currentState };
    const playerState = player === 'player' ? newState.player : newState.opponent;

    // Draw the specified number of cards
    const newCards = playerState.deck.slice(0, numCards);
    const remainingDeck = playerState.deck.slice(numCards);

    if (player === 'player') {
      newState.player = {
        ...playerState,
        hand: [...playerState.hand, ...newCards],
        deck: remainingDeck
      };
    } else {
      newState.opponent = {
        ...playerState,
        hand: [...playerState.hand, ...newCards],
        deck: remainingDeck
      };
    }

    return newState;
  };

  const handleCardClick = (card: Card) => {
    if (gameState.currentTurn !== 'player' || gameState.player.passed) {
      return;
    }

    if (card.type === CardType.UNIT || card.type === CardType.HERO) {
      setSelectedCard(card);
    }
  };

  const handleRowClick = (row: RowPosition) => {
    if (!selectedCard || gameState.currentTurn !== 'player') {
      return;
    }

    if (selectedCard.type === CardType.UNIT || selectedCard.type === CardType.HERO) {
      const unitCard = selectedCard as UnitCard;

      // Check if the card can be played in the selected row
      if (unitCard.row === row || unitCard.availableRows?.includes(row)) {
        if (unitCard.ability === CardAbility.SPY) {
          playSpyCard(unitCard, row);
        } else {
          playCard(unitCard, row);
        }
      }
    }
  };

  const playSpyCard = (card: UnitCard, row: RowPosition) => {
    // Remove card from player's hand
    const newHand = gameState.player.hand.filter(c => c.id !== card.id);

    // First update the game state to place the spy card on opponent's board
    setGameState(prevState => {
      // Place card on opponent's board
      const updatedState = {
        ...prevState,
        player: {
          ...prevState.player,
          hand: newHand
        },
        opponentBoard: {
          ...prevState.opponentBoard,
          [row]: {
            ...prevState.opponentBoard[row],
            cards: [...prevState.opponentBoard[row].cards, card]
          }
        }
      };

      // Draw two cards for the player
      return drawCards(2, updatedState, 'player');
    });

    setSelectedCard(null);

    // After spy card is played, it becomes opponent's turn
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentTurn: 'opponent'
      }));
    }, 500);
  };

  const playOpponentSpyCard = (card: UnitCard, row: RowPosition) => {
    const newHand = gameState.opponent.hand.filter(c => c.id !== card.id);

    setGameState(prevState => {
      // Place card on player's board
      const updatedState = {
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

      // Draw two cards for the opponent
      return drawCards(2, updatedState, 'opponent');
    });

    // After spy card is played, it becomes player's turn
    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentTurn: 'player'
      }));
    }, 500);
  };

  const playCard = (card: UnitCard, row: RowPosition) => {
    // Remove card from hand
    const newHand = gameState.player.hand.filter(c => c.id !== card.id);

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        hand: newHand
      },
      playerBoard: {
        ...prev.playerBoard,
        [row]: {
          ...prev.playerBoard[row],
          cards: [...prev.playerBoard[row].cards, card]
        }
      },
      currentTurn: 'opponent'
    }));

    setSelectedCard(null);
  };

  const findBestCard = (hand: Card[]): UnitCard | null => {
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
  };

  const playOpponentCard = (card: UnitCard, row: RowPosition) => {
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
          cards: [...prev.opponentBoard[row].cards, card]
        }
      },
      currentTurn: 'player'
    }));
  };

  const handlePass = () => {
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        passed: true
      },
      currentTurn: 'opponent'
    }));
  };

  const handleOpponentPass = () => {
    setGameState(prev => ({
      ...prev,
      opponent: {
        ...prev.opponent,
        passed: true
      },
      currentTurn: 'player'
    }));
  };

  return (
    <GameBoard
      gameState={gameState}
      onCardClick={handleCardClick}
      onRowClick={handleRowClick}
      onPass={handlePass}
      selectedCard={selectedCard}
  />
  );
};

export default GameManager;