import React from 'react';
import { Card } from '@/types/card';
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
  return (
    <div className="hand-container">
      <div className="hand-area">
        {cards.map(card => (
          <GwentCard
            key={card.id}
            card={card}
            isPlayable={isActive}
            isSelected={selectedCard?.id === card.id}
            onClick={() => onCardClick?.(card)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerHand;