// import React from 'react';
// import { Card, GameState } from '@/types/card';
// import PlayerHand from '../player/PlayerHand';

// interface GameBoardProps {
//   gameState: GameState;
//   onCardClick: (card: Card) => void;
//   selectedCard: Card | null;
// }

// const GameBoard: React.FC<GameBoardProps> = ({
//   gameState,
//   onCardClick,
//   selectedCard
// }) => {
//   return (
//     <div className="game-container">
//       <div className="board-container">
//         <PlayerHand
//           cards={gameState.player.hand}
//           deck={gameState.player.deck}
//           onCardClick={onCardClick}
//           isActive={gameState.currentTurn === 'player'}
//           selectedCard={selectedCard}
//         />
//       </div>
//     </div>
//   );
// };

// export default GameBoard;

import React from 'react';
import { Card, GameState, RowPosition } from '@/types/card';
import PlayerHand from '../player/PlayerHand';
import PlayerArea from '../player/PlayerArea';
import '@/styles/components/board.css';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (card: Card) => void;
  onRowClick: (row: RowPosition) => void;
  selectedCard: Card | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardClick,
  onRowClick,
  selectedCard
}) => {
  const totalPlayerScore = Object.values(gameState.playerBoard).reduce(
    (total, row) => total + row.cards.reduce((sum: any, card: { strength: any; }) => sum + card.strength, 0),
    0
  );

  const totalOpponentScore = Object.values(gameState.opponentBoard).reduce(
    (total, row) => total + row.cards.reduce((sum: any, card: { strength: any; }) => sum + card.strength, 0),
    0
  );

  return (
    <div className="game-container">
      <div className="board-container">
        {/* Score Display */}
        <div className="score-display">
          {totalOpponentScore} - {totalPlayerScore}
        </div>

        {/* Opponent's Area */}
        <PlayerArea
          boardState={gameState.opponentBoard}
          isOpponent={true}
        />
        {/* Weather Effects Area */}
        <div className="weather-area" />
        {/* Player's Area */}
        <PlayerArea
          boardState={gameState.playerBoard}
          onRowClick={onRowClick}
        />
        {/* Player's Hand */}
        <PlayerHand
          cards={gameState.player.hand}
          deck={gameState.player.deck}
          onCardClick={onCardClick}
          isActive={gameState.currentTurn === 'player'}
          selectedCard={selectedCard}
        />
      </div>
    </div>
  );
};

export default GameBoard;