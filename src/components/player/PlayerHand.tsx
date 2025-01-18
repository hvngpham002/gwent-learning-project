import React from 'react';
import { Card, CardAbility } from '@/types/card';
import GwentCard from '../card/GwentCard';
import '@/styles/components/board.css';
import '@/styles/components/card.css';

interface PlayerHandProps {
  cards: Card[];
  onCardClick?: (card: Card) => void;
  isActive: boolean;
  selectedCard: Card | null;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  onCardClick,
  isActive,
  selectedCard
}) => {

  const isMoraleBoost = (card: Card) => {
    if(card.ability === CardAbility.MORALE_BOOST) {
      return 1;
    }
    return 0;
  }

  return (
    <div className="hand-container">
      {!isActive && <div className="hand-area__opponent-turn">Opponent's turn</div>}
      <div className="hand-area">
        {cards.map(card => (
          <GwentCard
            key={card.id}
            card={card}
            isPlayable={isActive}
            isSelected={selectedCard?.id === card.id}
            onClick={() => onCardClick?.(card)}
            moraleBoostCount={isMoraleBoost(card)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;