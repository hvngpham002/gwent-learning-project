import React from 'react';
import { BoardState, Card, CardAbility, CardType, Faction, RowPosition, SpecialCard, UnitCard } from '@/types/card';
import GwentCard from '../card/GwentCard';
import { calculateRowStrength, canPlayWeatherInRow } from '@/utils/gameHelpers';
import '@/styles/components/board.css';

interface PlayerAreaProps {
  boardState: BoardState;
  weatherState: Set<CardAbility>;
  onRowClick?: (row: RowPosition) => void;
  onUnitClick?: (card: UnitCard, row: RowPosition) => void;
  isOpponent?: boolean;
  isDecoyActive?: boolean;
  selectedCard?: Card;
}

const hornCard: SpecialCard = {
  id: 'neutral_special_03',
  name: "Commander's Horn",
  faction: Faction.NEUTRAL,
  type: CardType.SPECIAL,
  strength: 0,
  ability: CardAbility.COMMANDERS_HORN,
  imageUrl: '/images/neutral/commanders_horn.png',
  description: 'Doubles the strength of all unit cards in a row'
};

const PlayerArea: React.FC<PlayerAreaProps> = ({
  boardState,
  weatherState,
  onRowClick,
  onUnitClick,
  isOpponent = false,
  isDecoyActive = false,
  selectedCard
}) => {
  const renderRow = (rowPosition: RowPosition) => {
    const row = boardState[rowPosition];
    const weatherEffect = (
      (rowPosition === RowPosition.CLOSE && weatherState.has(CardAbility.FROST)) ||
      (rowPosition === RowPosition.RANGED && weatherState.has(CardAbility.FOG)) ||
      (rowPosition === RowPosition.SIEGE && weatherState.has(CardAbility.RAIN))
    );

    const moraleBoostCount = row.cards.filter(c =>
      c.type === CardType.UNIT && c.ability === CardAbility.MORALE_BOOST
    ).length;

    const rowStrength = calculateRowStrength(row.cards, weatherEffect, row.hornActive);

    const canClickRow = () => {
      if (isDecoyActive) return false;
      if (!onRowClick) return false;

      if (selectedCard?.type === CardType.SPECIAL) {
        const ability = selectedCard.ability;
        if (ability === CardAbility.FROST || ability === CardAbility.FOG || ability === CardAbility.RAIN) {
          return canPlayWeatherInRow(ability, rowPosition);
        }
      }
      return true;
    };

    return (
      <div className="battle-row-container">
        <div className="row-score">
          {rowStrength}
        </div>
        <div
          key={rowPosition}
          className={`battle-row battle-row--${rowPosition} ${
            rowPosition === RowPosition.CLOSE && weatherState.has(CardAbility.FROST) ? 'battle-row--frost' :
            rowPosition === RowPosition.RANGED && weatherState.has(CardAbility.FOG) ? 'battle-row--fog' :
            rowPosition === RowPosition.SIEGE && weatherState.has(CardAbility.RAIN) ? 'battle-row--rain' : ''
          }`}
          onClick={() => canClickRow() && onRowClick?.(rowPosition)}
        >
          <div className={`horn-area ${row.hornActive ? '' : 'default'}`}>
            {row.hornActive ? (
              <GwentCard
                key='neutral_special_03'
                card={hornCard}
                isPlayable={false}
              />
            ) : <img src="/images/avatars/horn.png" />}
          </div>
          {row.cards.map(card => (
            <GwentCard
              key={card.id}
              card={card}
              isPlayable={isDecoyActive && !isOpponent && card.type !== CardType.HERO}
              onClick={() => isDecoyActive && onUnitClick?.(card as UnitCard, rowPosition)}
              weatherEffect={weatherEffect}
              hornActive={row.hornActive}
              moraleBoostCount={moraleBoostCount}
              cardsInRow={row.cards}
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
          {renderRow(RowPosition.SIEGE)}
          {renderRow(RowPosition.RANGED)}
          {renderRow(RowPosition.CLOSE)}
        </div>
      </div>
    );
  }

  return (
    <div className="player-area">
      <div className="player-area__rows">
        {renderRow(RowPosition.CLOSE)}
        {renderRow(RowPosition.RANGED)}
        {renderRow(RowPosition.SIEGE)}
      </div>
    </div>
  );
};

export default PlayerArea;