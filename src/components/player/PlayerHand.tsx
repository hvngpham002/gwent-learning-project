import React from 'react';
import { Card, CardAbility, CardType, Faction } from '@/types/card';
import GwentCard from '../card/GwentCard';
import '@/styles/components/board.css';

interface PlayerHandProps {
  cards: Card[];
  deck: Card[];
  onCardClick?: (card: Card) => void;
  isActive: boolean;
  selectedCard: Card | null;
}

const PlayerHand: React.FC<PlayerHandProps> = ({
  cards,
  deck,
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
      <div className="deck-card">
      <GwentCard
          card={{
            id: 'deck-back',
            name: 'Deck',
            faction: deck[0]?.faction ?? Faction.NEUTRAL,
            type: CardType.SPECIAL as CardType.SPECIAL,
            imageUrl: 'src/assets/images/closed_card.jpeg',
            strength: 0,
            ability: CardAbility.NONE
          }}
          isPlayable={false}
        />
        <div className="deck-count">{deck.length}</div>
      </div>
    </div>
  );
};

export default PlayerHand;