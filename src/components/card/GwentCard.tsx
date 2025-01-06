import React from 'react';
import { Card } from '@/types/card';
import '@/styles/components/card.css';

interface CardProps {
  card: Card;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
}

const GwentCard: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  isPlayable = true,
  isSelected = false 
}) => {
  const cardClassName = [
    'card',
    isPlayable && 'card--playable',
    !isPlayable && 'card--disabled',
    isSelected && 'card--selected'
  ].filter(Boolean).join(' ');

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
    </div>
  );
};

export default GwentCard;