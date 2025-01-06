import { useState, useEffect } from 'react';
import { Card, PlayerState, GameState, BoardState, RowPosition, CardType, UnitCard, SpecialCard } from '@/types/card';
import { northernRealmsDeck } from '@/data/cards/northern-realms';
import { neutralDeck } from '@/data/cards/neutral';
import GameBoard from './GameBoard';
import { shuffle } from '@/utils/gameHelpers';

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
    // Create Northern Realms default deck
    const createInitialDeck = (): Card[] => {
      const deck: Card[] = [];

      // Add Leader (not part of the deck but needed for the player state)
      const leader = northernRealmsDeck.leaders.find(l => l.name === 'Foltest: Lord Commander of The North');
      if (!leader) throw new Error('Leader card not found');

      // Add Heroes
      // Northern Realms heroes
      const vernonRoche = northernRealmsDeck.heroes.find(h => h.name === 'Vernon Roche');
      const esteradThyssen = northernRealmsDeck.heroes.find(h => h.name === 'Esterad Thyssen');
      if (vernonRoche) deck.push({ ...vernonRoche, type: CardType.HERO as CardType.HERO });
      if (esteradThyssen) deck.push({ ...esteradThyssen, type: CardType.HERO as CardType.HERO });

      // Neutral heroes
      const geralt = neutralDeck.heroes.find(h => h.name === 'Geralt of Rivia');
      const ciri = neutralDeck.heroes.find(h => h.name === 'Cirilla Fiona Elen Riannon');
      const yennefer = neutralDeck.heroes.find(h => h.name === 'Yennefer of Vengerberg');
      const mysteriousElf = neutralDeck.heroes.find(h => h.name === 'Mysterious Elf');
      if (geralt) deck.push({ ...geralt, type: CardType.HERO as CardType.HERO });
      if (ciri) deck.push({ ...ciri, type: CardType.HERO as CardType.HERO });
      if (yennefer) deck.push({ ...yennefer, type: CardType.HERO as CardType.HERO });
      if (mysteriousElf) deck.push({ ...mysteriousElf, type: CardType.HERO as CardType.HERO });

      // Add Units
      // Spy units
      const princeStenis = northernRealmsDeck.units.find(u => u.name === 'Prince Stennis');
      const sigismund = northernRealmsDeck.units.find(u => u.name === 'Sigismund Dijkstra');
      if (princeStenis) deck.push({ ...princeStenis, type: CardType.UNIT as CardType.UNIT });
      if (sigismund) deck.push({ ...sigismund, type: CardType.UNIT as CardType.UNIT });

      // Blue Stripes Commando (3 copies)
      const blueStripes = northernRealmsDeck.units.find(u => u.name === 'Blue Stripes Commando');
      if (blueStripes) {
        // Create three separate cards with the correct type
        const cards: UnitCard[] = [
          { ...blueStripes, type: CardType.UNIT as CardType.UNIT },
          { ...blueStripes, id: blueStripes.id + '_2', type: CardType.UNIT as CardType.UNIT },
          { ...blueStripes, id: blueStripes.id + '_3', type: CardType.UNIT as CardType.UNIT }
        ];
        deck.push(...cards);
      }

      // Special Cards
      // Decoy (2 copies)
      const decoy = neutralDeck.specials.find(s => s.name === 'Decoy');
      if (decoy) {
        const cards: SpecialCard[] = [
          { ...decoy, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
          { ...decoy, id: decoy.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
      }

      // Commander's Horn (2 copies)
      const horn = neutralDeck.specials.find(s => s.name === "Commander's Horn");
      if (horn) {
        const cards: SpecialCard[] = [
          { ...horn, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
          { ...horn, id: horn.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
      }

      // Scorch (2 copies)
      const scorch = neutralDeck.specials.find(s => s.name === 'Scorch');
      if (scorch) {
        const cards: SpecialCard[] = [
          { ...scorch, type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 },
          { ...scorch, id: scorch.id + '_2', type: CardType.SPECIAL as CardType.SPECIAL, strength: 0 }
        ];
        deck.push(...cards);
      }

      // Additional neutral units
      const villentretenmerth = neutralDeck.units.find(u => u.name === 'Villentretenmerth');
      if (villentretenmerth) deck.push({ ...villentretenmerth, type: CardType.UNIT as CardType.UNIT });

      return deck;
    };

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