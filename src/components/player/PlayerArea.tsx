import React from 'react';
import { BoardState, RowPosition, UnitCard } from '@/types/card';
import GwentCard from '../card/GwentCard';
import { calculateRowStrength } from '@/utils/gameHelpers';
import '@/styles/components/board.css';

interface PlayerAreaProps {
  boardState: BoardState;
  onRowClick?: (row: RowPosition) => void;
  onUnitClick?: (card: UnitCard, row: RowPosition) => void;
  isOpponent?: boolean;
  isDecoyActive?: boolean;
}

const PlayerArea: React.FC<PlayerAreaProps> = ({
  boardState,
  onRowClick,
  onUnitClick,
  isOpponent = false,
  isDecoyActive = false
}) => {
  const renderRow = (rowCards: UnitCard[], position: RowPosition) => {
    const rowStrength = calculateRowStrength(rowCards, false, boardState[position].hornActive);

    return (
      <div
        key={position}
        className={`battle-row battle-row--${position}`}
        onClick={() => !isDecoyActive && onRowClick?.(position)}
      >
        {rowCards.map(card => (
          <GwentCard
            key={card.id}
            card={card}
            isPlayable={isDecoyActive && !isOpponent && card.type !== 'hero'}
            onClick={() => isDecoyActive && onUnitClick?.(card, position)}
          />
        ))}
        {rowStrength > 0 && (
          <div className="row-score">
            {rowStrength}
          </div>
        )}
      </div>
    );
  };

  if (isOpponent) {
    return (
      <div className="player-area">
        <div className="player-area__rows">
          {renderRow(boardState.siege.cards, RowPosition.SIEGE)}
          {renderRow(boardState.ranged.cards, RowPosition.RANGED)}
          {renderRow(boardState.close.cards, RowPosition.CLOSE)}
        </div>
      </div>
    );
  }

  return (
    <div className="player-area">
      <div className="player-area__rows">
        {renderRow(boardState.close.cards, RowPosition.CLOSE)}
        {renderRow(boardState.ranged.cards, RowPosition.RANGED)}
        {renderRow(boardState.siege.cards, RowPosition.SIEGE)}
      </div>
    </div>
  );
};

export default PlayerArea;