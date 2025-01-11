import React from 'react';
import { BoardState, CardAbility, CardType, Faction, RowPosition, SpecialCard, UnitCard } from '@/types/card';
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

const hornCard: SpecialCard = {
  id: 'neutral_special_03',
  name: "Commander's Horn",
  faction: Faction.NEUTRAL,
  type: CardType.SPECIAL,
  strength: 0,
  ability: CardAbility.COMMANDERS_HORN,
  imageUrl: 'src/assets/images/neutral/commanders_horn.png',
  description: 'Doubles the strength of all unit cards in a row'
};

const PlayerArea: React.FC<PlayerAreaProps> = ({
  boardState,
  onRowClick,
  onUnitClick,
  isOpponent = false,
  isDecoyActive = false
}) => {
  const renderRow = (rowCards: UnitCard[], position: RowPosition, hornActive: boolean) => {

    const rowStrength = calculateRowStrength(rowCards, false, boardState[position].hornActive);

    return (
      <div className="battle-row-container">
         <div className="row-score">
            {rowStrength}
        </div>
        <div
          key={position}
          className={`battle-row battle-row--${position}`}
          onClick={() => !isDecoyActive && onRowClick?.(position)}
        >
          <div className={`horn-area ${hornActive ? '' : 'default'}`}>
            {hornActive ? (
              <GwentCard
                key='neutral_special_03'
                card={hornCard}
                isPlayable={false}
              />
            ) : <img src="/src/assets/avatars/horn.png" />}
          </div>
          {rowCards.map(card => (
            <GwentCard
              key={card.id}
              card={card}
              isPlayable={isDecoyActive && !isOpponent && card.type !== 'hero'}
              onClick={() => isDecoyActive && onUnitClick?.(card, position)}
            />
          ))}
        </div>
      </div>
    );
  };

  if (isOpponent) {
    return (
      <div className="player-area">
        <div className="player-area__rows">
          {renderRow(boardState.siege.cards, RowPosition.SIEGE, boardState.siege.hornActive )}
          {renderRow(boardState.ranged.cards, RowPosition.RANGED, boardState.ranged.hornActive)}
          {renderRow(boardState.close.cards, RowPosition.CLOSE, boardState.close.hornActive)}
        </div>
      </div>
    );
  }

  return (
    <div className="player-area">
      <div className="player-area__rows">
        {renderRow(boardState.close.cards, RowPosition.CLOSE, boardState.close.hornActive)}
        {renderRow(boardState.ranged.cards, RowPosition.RANGED, boardState.ranged.hornActive)}
        {renderRow(boardState.siege.cards, RowPosition.SIEGE, boardState.siege.hornActive)}
      </div>
    </div>
  );
};

export default PlayerArea;