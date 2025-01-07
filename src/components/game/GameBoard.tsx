import React from 'react';
import { Card, GameState, RowPosition } from '@/types/card';
import PlayerHand from '../player/PlayerHand';
import PlayerArea from '../player/PlayerArea';
import PlayerStatus from './PlayerStatus';
import '@/styles/components/board.css';
import '@/styles/components/hand.css';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (card: Card) => void;
  onRowClick: (row: RowPosition) => void;
  onPass: () => void;
  selectedCard: Card | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardClick,
  onRowClick,
  onPass,
  selectedCard
}) => {
  return (
    <div className="game-container">
      <div className="game-layout">
        {/* Left sidebar with player statuses */}
        <div className="game-sidebar">
          <PlayerStatus
            player={gameState.opponent}
            isOpponent={true}
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
          />
          <PlayerHand
            cards={gameState.player.hand}
            deck={gameState.player.deck}
            onCardClick={onCardClick}
            isActive={gameState.currentTurn === 'player'}
            selectedCard={selectedCard}
          />
        </div>
      </div>
    </div>
  );
};

export default GameBoard;