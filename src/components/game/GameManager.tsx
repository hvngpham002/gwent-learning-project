import { useState, useEffect } from 'react';
import { Card, PlayerState, GameState, BoardState, RowPosition } from '@/types/card';
import GameBoard from './GameBoard';
import { shuffle } from '@/utils/gameHelpers';
import { createInitialDeck } from '@/utils/deckBuilder';

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
    activeWeatherEffects: new Set()
  });

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  useEffect(() => {
    if (gameState.gamePhase === 'setup') {
      initializeGame();
    }
  }, []);

  useEffect(() => {
    if (gameState.currentTurn === 'opponent' && gameState.gamePhase === 'playing') {
      handleOpponentTurn();
    }
  }, [gameState.currentTurn]);

  const initializeGame = () => {

    const playerDeck = shuffle(createInitialDeck());
    const opponentDeck = shuffle(createInitialDeck());

    // Initial draw of 10 cards
    const playerHand = playerDeck.splice(0, 10);
    const opponentHand = opponentDeck.splice(0, 10);

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        deck: playerDeck,
        hand: playerHand
      },
      opponent: {
        ...prev.opponent,
        deck: opponentDeck,
        hand: opponentHand
      },
      gamePhase: 'playing'
    }));
  };

  const handleCardClick = (card: Card) => {
    if (gameState.currentTurn !== 'player' || gameState.player.passed) {
      return;
    }
    setSelectedCard(card);
  };

  const handleRowClick = (row: RowPosition) => {
    if (!selectedCard || !('row' in selectedCard)) {
      return;
    }

    if (selectedCard.row === row || (selectedCard.availableRows?.includes(row))) {
      playCard(selectedCard, row);
    }
  };

  const playCard = (card: Card, row: RowPosition) => {
    // Remove card from hand
    const newHand = gameState.player.hand.filter(c => c.id !== card.id);

    // Add card to appropriate row if it's a unit card
    if ('row' in card) {
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
    }

    setSelectedCard(null);
    // Here you would also handle special card abilities
  };

  const handleOpponentTurn = () => {
    // Basic AI implementation
    // This would be expanded based on game rules and strategy
    setTimeout(() => {
      // Simple example: play the first valid card
      const card = gameState.opponent.hand[0];
      if (card && 'row' in card) {
        const row = card.row;
        playOpponentCard(card, row);
      }
    }, 1000);
  };

  const playOpponentCard = (card: Card, row: RowPosition) => {
    // Similar to playCard but for opponent
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

  return (
    <GameBoard
      gameState={gameState}
      onCardClick={handleCardClick}
      // onRowClick={handleRowClick}
      selectedCard={selectedCard}
    />
  );
};

export default GameManager;