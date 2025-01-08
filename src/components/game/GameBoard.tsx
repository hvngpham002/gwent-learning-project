import React from 'react';
import { Card, CardAbility, CardType, Faction, GameState, RowPosition, UnitCard } from '@/types/card';
import PlayerHand from '../player/PlayerHand';
import PlayerArea from '../player/PlayerArea';
import PlayerStatus from './PlayerStatus';
import '@/styles/components/board.css';
import '@/styles/components/hand.css';
import GwentCard from '../card/GwentCard';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (card: Card) => void;
  onRowClick: (row: RowPosition) => void;
  onBoardUnitClick: (card: UnitCard, row: RowPosition) => void;
  onPass: () => void;
  selectedCard: Card | null;
  isDecoyActive: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardClick,
  onRowClick,
  onBoardUnitClick,
  onPass,
  selectedCard,
  isDecoyActive
}) => {

  const deckCard: Card = {
    id: 'deck-back',
    name: 'Deck',
    faction: gameState.player.deck[0]?.faction ?? Faction.NEUTRAL,
    type: CardType.SPECIAL,
    imageUrl: 'src/assets/images/closed_card.jpeg',
    strength: 0,
    ability: CardAbility.NONE
  };

  const discardCard: Card = {
    id: 'deck-discard',
    name: 'Deck',
    faction: gameState.player.deck[0]?.faction ?? Faction.NEUTRAL,
    type: CardType.SPECIAL,
    imageUrl: 'src/assets/images/other-graveyard.png',
    strength: 0,
    ability: CardAbility.NONE
  };

  return (
    <div className="game-container">
      <div className="game-layout">
        {/* Left sidebar with player statuses */}
        <div className="game-sidebar">
          <PlayerStatus
              player={gameState.opponent}
              board={gameState.opponentBoard}
              weatherEffects={gameState.activeWeatherEffects}
              isOpponent={true}
              onPass={onPass}
          />
          <div className="weather-area">
            {/* Weather cards will be rendered here */}
            {Array.from(gameState.activeWeatherEffects).map(effect => (
              <div key={effect}>
                {/* Weather card component will go here */}
              </div>
            ))}
          </div>
          <PlayerStatus
             player={gameState.player}
             board={gameState.playerBoard}
             weatherEffects={gameState.activeWeatherEffects}
             isOpponent={false}
             onPass={onPass}
          />
        </div>

        {/* Main board area */}
        <div className="board-area">
          <PlayerArea
            boardState={gameState.opponentBoard}
            isOpponent={true}
          />
          <PlayerArea
            boardState={gameState.playerBoard}
            onRowClick={onRowClick}
            onUnitClick={onBoardUnitClick}
            isDecoyActive={isDecoyActive}
          />
          <PlayerHand
            cards={gameState.player.hand}
            onCardClick={onCardClick}
            isActive={gameState.currentTurn === 'player'}
            selectedCard={selectedCard}
          />
        </div>
        <div className='board-sidebar'>
          <div className="deck-container">
            <div className='deck-cards'>
              <GwentCard
                card={discardCard}
                isPlayable={false}
              />
              <div className="deck-count">{gameState.opponent.discard.length}</div>
            </div>
            <div className='deck-cards'>
              <GwentCard
                card={deckCard}
                isPlayable={false}
              />
              <div className="deck-count">{gameState.opponent.deck.length}</div>
            </div>
          </div>
          <div className="deck-container">
            <div className='deck-cards'>
              <GwentCard
                card={discardCard}
                isPlayable={false}
              />
              <div className="deck-count">{gameState.player.discard.length}</div>
            </div>
            <div className='deck-cards'>
              <GwentCard
                card={deckCard}
                isPlayable={false}
              />
              <div className="deck-count">{gameState.player.deck.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;