import { GameState } from '@/types/card';
import React from 'react'

const GameCardsSelector = ({gameState}: {gameState: GameState}) => {
  return (
    <div className='game-cards-selector-container'>
      <div className='card-selector-content'>
        <div className='card-selector-title'>Choose card(s) to redraw. 0/2</div>
        <div className='card-selector-container'>
          {gameState.player.hand.map((card: { id: React.Key | null | undefined; imageUrl: string | undefined; name: string | undefined; }) => (
            <div key={card.id} className='card-selector-image'>
              <img src={card.imageUrl} alt={card.name} />
            </div>
          ))}
        </div>
        <div className='card-selector-button-container'>
          <button className='card-selector-button'>Redraw</button>
          <button className='card-selector-button'>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default GameCardsSelector