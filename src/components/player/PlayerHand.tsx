import React from 'react';
import { Card, CardAbility, CardType, Faction } from '@/types/card';
import GwentCard from '../card/GwentCard';
import '@/styles/components/board.css';
import '@/styles/components/card.css';

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
  const deckCard: Card = {
    id: 'deck-back',
    name: 'Deck',
    faction: deck[0]?.faction ?? Faction.NEUTRAL,
    type: CardType.SPECIAL,
    imageUrl: 'src/assets/images/closed_card.jpeg',
    strength: 0,
    ability: CardAbility.NONE
  };

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
      <div className="deck-container">
        <GwentCard
          card={deckCard}
          isPlayable={false}
        />
        <div className="deck-count">{deck.length}</div>
      </div>
    </div>
  );
};

export default PlayerHand;