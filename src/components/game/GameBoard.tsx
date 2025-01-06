// import React from 'react';
// import { Card, GameState, RowPosition } from '@/types/card';
// import GwentCard from '../card/GwentCard';
// import '@/styles/components/board.css';

// interface GameBoardProps {
//   gameState: GameState;
//   onCardClick: (card: Card) => void;
//   onRowClick: (row: RowPosition) => void;
//   selectedCard: Card | null;
// }

// const GameBoard: React.FC<GameBoardProps> = ({
//   gameState,
//   onCardClick,
//   onRowClick,
//   selectedCard
// }) => {
//   return (
//     <div className="game-container">
//       <div className="board-container">
//         {/* Opponent's Area */}
//         <div className="player-area player-area--opponent">
//           <div className="hand-area">
//             {gameState.opponent.hand.map(card => (
//               <GwentCard 
//                 key={card.id} 
//                 card={card} 
//                 isPlayable={false}
//               />
//             ))}
//           </div>
//           <div 
//             className="battle-row"
//             onClick={() => onRowClick(RowPosition.SIEGE)}
//           >
//             {gameState.opponentBoard.siege.cards.map(card => (
//               <GwentCard key={card.id} card={card} isPlayable={false} />
//             ))}
//           </div>
//           <div 
//             className="battle-row"
//             onClick={() => onRowClick(RowPosition.RANGED)}
//           >
//             {gameState.opponentBoard.ranged.cards.map(card => (
//               <GwentCard key={card.id} card={card} isPlayable={false} />
//             ))}
//           </div>
//           <div 
//             className="battle-row"
//             onClick={() => onRowClick(RowPosition.CLOSE)}
//           >
//             {gameState.opponentBoard.close.cards.map(card => (
//               <GwentCard key={card.id} card={card} isPlayable={false} />
//             ))}
//           </div>
//         </div>

//         {/* Weather Effects Area */}
//         <div className="weather-area">
//           {/* Weather cards will be displayed here */}
//         </div>

//         {/* Player's Area */}
//         <div className="player-area">
//           <div 
//             className="battle-row"
//             onClick={() => onRowClick(RowPosition.CLOSE)}
//           >
//             {gameState.playerBoard.close.cards.map(card => (
//               <GwentCard key={card.id} card={card} isPlayable={false} />
//             ))}
//           </div>
//           <div 
//             className="battle-row"
//             onClick={() => onRowClick(RowPosition.RANGED)}
//           >
//             {gameState.playerBoard.ranged.cards.map(card => (
//               <GwentCard key={card.id} card={card} isPlayable={false} />
//             ))}
//           </div>
//           <div 
//             className="battle-row"
//             onClick={() => onRowClick(RowPosition.SIEGE)}
//           >
//             {gameState.playerBoard.siege.cards.map(card => (
//               <GwentCard key={card.id} card={card} isPlayable={false} />
//             ))}
//           </div>
//           <div className="hand-area">
//             {gameState.player.hand.map(card => (
//               <GwentCard 
//                 key={card.id} 
//                 card={card} 
//                 isPlayable={gameState.currentTurn === 'player' && !gameState.player.passed}
//                 isSelected={selectedCard?.id === card.id}
//                 onClick={() => onCardClick(card)}
//               />
//             ))}
//           </div>
//         </div>

//         <div className="score-display">
//           {gameState.playerScore} - {gameState.opponentScore}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GameBoard;

import React from 'react';
import { Card, GameState } from '@/types/card';
import PlayerHand from '../player/PlayerHand';

interface GameBoardProps {
  gameState: GameState;
  onCardClick: (card: Card) => void;
  selectedCard: Card | null;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardClick,
  selectedCard
}) => {
  return (
    <div className="game-container">
      <div className="board-container">
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
