import React from 'react';
import { BoardState, RowPosition, UnitCard } from '@/types/card';
import GwentCard from '../card/GwentCard';
import { calculateRowStrength } from '@/utils/gameHelpers';
import '@/styles/components/board.css';

interface PlayerAreaProps {
  boardState: BoardState;
  onRowClick?: (row: RowPosition) => void;
  isOpponent?: boolean;
}

const PlayerArea: React.FC<PlayerAreaProps> = ({
  boardState,
  onRowClick,
  isOpponent = false
}) => {
  const renderRow = (rowCards: UnitCard[], position: RowPosition) => {
    const rowStrength = calculateRowStrength(rowCards, false, boardState[position].hornActive);

    return (
      <div
        key={position}
        className={`battle-row battle-row--${position}`}
        onClick={() => onRowClick?.(position)}
        style={{ minHeight: '120px' }}
      >
        {rowCards.map(card => (
          <GwentCard
            key={card.id}
            card={card}
            isPlayable={false}
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

  if(isOpponent) {
    return (
        <div className={`player-area`}>
            <div className="player-area__rows">
                {renderRow(boardState.siege.cards, RowPosition.SIEGE)}
                {renderRow(boardState.ranged.cards, RowPosition.RANGED)}
                {renderRow(boardState.close.cards, RowPosition.CLOSE)}
            </div>
        </div>
    )
  }

  return (
    <div className={`player-area`}>
      <div className="player-area__rows">
        {renderRow(boardState.close.cards, RowPosition.CLOSE)}
        {renderRow(boardState.ranged.cards, RowPosition.RANGED)}
        {renderRow(boardState.siege.cards, RowPosition.SIEGE)}
      </div>
    </div>
  );
};

export default PlayerArea;