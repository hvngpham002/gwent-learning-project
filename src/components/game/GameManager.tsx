import { useState, useEffect } from 'react';
import { Card, PlayerState, GameState, BoardState, RowPosition, CardType, UnitCard, CardAbility, SpecialCard, Faction } from '@/types/card';
import GameBoard from './GameBoard';
import { drawCards, shuffle } from '@/utils/gameHelpers';
import { createInitialDeck } from '@/utils/deckBuilder';
import useAI from '@/hooks/useAI';
import { calculateTotalScore } from '@/utils/gameHelpers';
import { handleDecoyAction } from '@/hooks/useGameLogic';

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
  const [isDecoyActive, setIsDecoyActive] = useState(false);

  const handleRoundEnd = () => {
    setGameState(prev => {
      const playerScore = calculateTotalScore(prev.playerBoard, prev.activeWeatherEffects);
      const opponentScore = calculateTotalScore(prev.opponentBoard, prev.activeWeatherEffects);

      console.log('Final scores:', { player: playerScore, opponent: opponentScore });

      // Determine who loses life tokens
      let newPlayerLives = prev.player.lives;
      let newOpponentLives = prev.opponent.lives;

      if (playerScore > opponentScore) {
        newOpponentLives--;
      } else if (opponentScore > playerScore) {
        newPlayerLives--;
      } else {
        newPlayerLives--;
        newOpponentLives--;
      }

      // Collect cards for discard
      const playerDiscardPile = [
        ...prev.player.discard,
        ...prev.playerBoard.close.cards,
        ...prev.playerBoard.ranged.cards,
        ...prev.playerBoard.siege.cards,
      ];

      const opponentDiscardPile = [
        ...prev.opponent.discard,
        ...prev.opponentBoard.close.cards,
        ...prev.opponentBoard.ranged.cards,
        ...prev.opponentBoard.siege.cards,
      ];

      return {
        ...prev,
        player: {
          ...prev.player,
          passed: false,
          lives: newPlayerLives,
          discard: playerDiscardPile
        },
        opponent: {
          ...prev.opponent,
          passed: false,
          lives: newOpponentLives,
          discard: opponentDiscardPile
        },
        playerBoard: initialBoardState,
        opponentBoard: initialBoardState,
        currentRound: prev.currentRound + 1,
        currentTurn: Math.random() < 0.5 ? 'player' : 'opponent',
        activeWeatherEffects: new Set()
      };
    });
  };

  const { makeOpponentMove } = useAI(gameState, handleRoundEnd, setGameState);

  useEffect(() => {
    if (gameState.gamePhase === 'setup') {
      initializeGame();
    }
  }, [gameState.gamePhase]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (gameState.currentTurn === 'opponent' &&
        gameState.gamePhase === 'playing' &&
        !gameState.opponent.passed) {
      timeoutId = setTimeout(makeOpponentMove, 1000);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [gameState.currentTurn, gameState.gamePhase, gameState.opponent.passed, makeOpponentMove]);

  const initializeGame = () => {
    const playerDeckWithLeader = createInitialDeck(Faction.NILFGAARD);
    const opponentDeckWithLeader = createInitialDeck(Faction.NORTHERN_REALMS);

    const playerDeck = shuffle(playerDeckWithLeader.deck);
    const opponentDeck = shuffle(opponentDeckWithLeader.deck);

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

    // If clicking the same card, deselect it
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setIsDecoyActive(false);
      return;
    }

    // Handle decoy selection
    if (card.type === CardType.SPECIAL && card.ability === CardAbility.DECOY) {
      setSelectedCard(card);
      setIsDecoyActive(true);
      return;
    }

    // Handle horn selection
    if (card.type === CardType.SPECIAL && card.ability === CardAbility.COMMANDERS_HORN) {
      console.log("Commander Horn's Selected.");
      setSelectedCard(card);
      setIsDecoyActive(false);
    }

    // Handle unit/hero selection
    if (card.type === CardType.UNIT || card.type === CardType.HERO) {
      // Verify card is actually in hand before selecting it
      if (gameState.player.hand.find(c => c.id === card.id)) {
        setSelectedCard(card);
        setIsDecoyActive(false);
      }
    }
  };

  const isValidDecoyTarget = (card: Card): boolean => {
    return card.type === CardType.UNIT;  // Only allow regular unit cards, heroes are a different type
  };

  const handleBoardUnitClick = (card: UnitCard) => {
    if (!isDecoyActive || !selectedCard || !isValidDecoyTarget(card)) {
      return;
    }

    const newGameState = handleDecoyAction(gameState, selectedCard, card, true);

    setGameState({
      ...newGameState,
      currentTurn: 'opponent'
    });

    setSelectedCard(null);
    setIsDecoyActive(false);
  };

  const handleRowClick = (row: RowPosition) => {
    if (!selectedCard || gameState.currentTurn !== 'player') {
      return;
    }

    if (selectedCard.type === CardType.UNIT || selectedCard.type === CardType.HERO) {
      const unitCard = selectedCard as UnitCard;

      if (unitCard.row === row || unitCard.availableRows?.includes(row)) {
        if (unitCard.ability === CardAbility.SPY) {
          playSpyCard(unitCard, row);
        } else {
          playCard(unitCard, row);
        }
      }
    }

    if (selectedCard.type === CardType.SPECIAL && selectedCard.ability === CardAbility.COMMANDERS_HORN){
      const specialCard = selectedCard as SpecialCard
      playHornCard(specialCard, row);
      console.log("PLAY HORN AT:" + row)
    }
  };

  const playHornCard = (card: SpecialCard, row: RowPosition) => {

    setSelectedCard(null);
    setIsDecoyActive(false);

    // Add this verification
    if (!gameState.player.hand.find(c => c.id === card.id)) {
      console.warn('Attempted to play card not in hand:', card.id);
      return;
    }

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
          cards: [...prev.playerBoard[row].cards], // Keep existing cards
          hornActive: true,
        }
      },
      currentTurn: gameState.opponent.passed ? 'player' : 'opponent'
    }));

    setSelectedCard(null);
  };

  const playSpyCard = (card: UnitCard, row: RowPosition) => {

    setSelectedCard(null);
    setIsDecoyActive(false);

    // Add this verification
    if (!gameState.player.hand.find(c => c.id === card.id)) {
      console.warn('Attempted to play card not in hand:', card.id);
      return;
    }

    const newHand = gameState.player.hand.filter(c => c.id !== card.id);

    setGameState(prevState => {
      // First place the spy card
      const stateAfterPlay = {
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

      // Then draw 2 cards using the helper function
      return drawCards(2, stateAfterPlay, 'player');
    });

    setSelectedCard(null);

    setGameState(prev => ({
      ...prev,
      currentTurn: 'opponent'
    }));

  };

  const playCard = (card: UnitCard, row: RowPosition) => {

    setSelectedCard(null);
    setIsDecoyActive(false);

    // Add this verification
    if (!gameState.player.hand.find(c => c.id === card.id)) {
      console.warn('Attempted to play card not in hand:', card.id);
      return;
    }

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
      currentTurn: gameState.opponent.passed ? 'player' : 'opponent'
    }));

    setSelectedCard(null);
  };

  const handlePass = () => {
    if (gameState.currentTurn !== 'player' || gameState.player.passed) {
      return;
    }

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        passed: true
      },
      currentTurn: 'opponent'
    }));

    if (gameState.opponent.passed) {
      setTimeout(handleRoundEnd, 500);
    }
  };

  return (
    <GameBoard
      gameState={gameState}
      onCardClick={handleCardClick}
      onRowClick={handleRowClick}
      onBoardUnitClick={handleBoardUnitClick}
      onPass={handlePass}
      selectedCard={selectedCard}
      isDecoyActive={isDecoyActive}
    />
  );
};

export default GameManager;