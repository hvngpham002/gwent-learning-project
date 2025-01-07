import { useState, useEffect } from 'react';
import { Card, PlayerState, GameState, BoardState, RowPosition, CardType, UnitCard } from '@/types/card';
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
    activeWeatherEffects: new Set()
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
          playOpponentCard(bestCard, bestCard.row);
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

  const handleCardClick = (card: Card) => {
    if (gameState.currentTurn !== 'player' || gameState.player.passed) {
      return;
    }

    // Only allow unit or hero cards to be selected
    if (card.type === CardType.UNIT || card.type === CardType.HERO) {
      setSelectedCard(card);
    }
  };

  const handleRowClick = (row: RowPosition) => {
    if (!selectedCard || gameState.currentTurn !== 'player') {
      return;
    }

    // Check if the card is a unit or hero card
    if (selectedCard.type === CardType.UNIT || selectedCard.type === CardType.HERO) {
      const unitCard = selectedCard as UnitCard;

      // Check if the card can be played in the selected row
      if (unitCard.row === row || unitCard.availableRows?.includes(row)) {
        playCard(unitCard, row);
      }
    }
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
    // Filter for playable cards (units and heroes)
    const playableCards = hand.filter(
      card => card.type === CardType.UNIT || card.type === CardType.HERO
    ) as UnitCard[];

    if (playableCards.length === 0) return null;

    // For now, just play the highest strength card
    return playableCards.reduce((highest, current) =>
      current.strength > highest.strength ? current : highest
    );
  };

  const handleOpponentTurn = () => {
    // Add a delay to make the opponent's turn more natural
    setTimeout(() => {
      const bestCard = findBestCard(gameState.opponent.hand);

      if (bestCard) {
        playOpponentCard(bestCard, bestCard.row);
      } else {
        // If no playable cards, pass
        handleOpponentPass();
      }
    }, 1000);
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