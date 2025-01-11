import React from 'react';
import { Card, CardType, CardAbility, UnitCard } from '@/types/card';
import { calculateUnitStrength } from '@/utils/gameHelpers';
import '@/styles/components/card.css';

interface CardProps {
  card: Card;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
  weatherEffect?: boolean;
  hornActive?: boolean;
  moraleBoostCount?: number;
  cardsInRow?: UnitCard[];  // New prop to check for tight bonds
}

const GwentCard: React.FC<CardProps> = ({
  card,
  onClick,
  isPlayable = true,
  isSelected = false,
  weatherEffect = false,
  hornActive = false,
  moraleBoostCount = 0,
  cardsInRow = []
}) => {
  const cardClassName = [
    'card',
    isPlayable && 'card--playable',
    !isPlayable && 'card--disabled',
    isSelected && 'card--selected'
  ].filter(Boolean).join(' ');

  const getDisplayStrength = () => {
    if (card.type === CardType.UNIT) {
      const unitCard = card as UnitCard;
      const sameNameCount = unitCard.ability === CardAbility.TIGHT_BOND
        ? cardsInRow.filter(c => c.name === unitCard.name).length
        : 1;

      return calculateUnitStrength(
        unitCard,
        weatherEffect,
        hornActive,
        moraleBoostCount,
        sameNameCount
      );
    }
    return null;
  };

  return (
    <div
      className={cardClassName}
      onClick={isPlayable ? onClick : undefined}
    >
      <img
        src={card.imageUrl}
        alt={card.name}
        className="card__image"
      />
      {card.type === CardType.UNIT && (
        <div className='card__strength'>
          {getDisplayStrength()}
        </div>
      )}
    </div>
  );
};

export default GwentCard;