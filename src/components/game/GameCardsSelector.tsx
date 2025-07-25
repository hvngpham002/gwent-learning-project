import { Card, CardType, GameState } from '@/types/card';
import { useState } from 'react';

interface GameCardsSelectorProps {
  gameState: GameState;
  title: string;
  redrawCount?: number;
  setCardsSelector: (cardsSelector: { title: string; show: boolean }) => void;
  onRedraw: (selectedCards: Card[]) => void;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  onMedicSelect?: (selectedCards: Card[]) => void;
}

const GameCardsSelector = ({
  gameState,
  title,
  redrawCount = 0,
  setCardsSelector,
  onRedraw,
  setGameState,
  onMedicSelect,
}: GameCardsSelectorProps) => {
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);

  const getTitle = (title: string) => {
    switch (title) {
      case 'redraw':
        return `Choose a card to redraw. ${redrawCount}/2`;
      case 'discard-view':
        return `Discard Pile`;
      case 'medic':
        return `Choose a card from the discard pile to revive`;
      case 'draw_opponent_discard':
        return `Choose a card from your opponent's discard pile.`;
      default:
        return title;
    }
  };

  const handleCardSelect = (card: Card) => {
    if (selectedCards.find((c) => c.id === card.id)) {
      setSelectedCards(selectedCards.filter((c) => c.id !== card.id));
    } else {
      setSelectedCards([card]);
    }
  };

  const handleRedraw = () => {
    if (selectedCards.length > 0) {
      onRedraw(selectedCards);
      setSelectedCards([]);
    }
  };

  const handleDrawOpponentDiscard = () => {
    if (selectedCards.length > 0) {
      setSelectedCards([]);
      setGameState((prev) => ({
        ...prev,
        player: {
          ...prev.player,
          hand: [...prev.player.hand, ...selectedCards],
          leader: {
            ...prev.player.leader!,
            used: true,
          },
        },
        opponent: {
          ...prev.opponent,
          discard: [...prev.opponent.discard.filter((card) => !selectedCards.includes(card))],
        },
        currentTurn: prev.currentTurn === 'player' ? 'opponent' : 'player',
      }));
      setCardsSelector({ title: '', show: false });
    }
  };

  return (
    <div className="game-cards-selector-container">
      <div className="card-selector-content">
        <div className="card-selector-title">{getTitle(title)}</div>
        <div className="card-selector-container">
          {title === 'medic' &&
            gameState.player.discard
              .filter((card) => card.type === CardType.UNIT)
              .map((card: Card) => (
                <div
                  key={card.id}
                  className={`card-selector-image ${
                    selectedCards.find((c) => c.id === card.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleCardSelect(card)}
                >
                  <img src={card.imageUrl} alt={card.name} />
                  {selectedCards.find((c) => c.id === card.id) ? (
                  <div className="card-selector-image-description">{card.description? card.description : 'SELECTED'}</div>
                ) : null}
                </div>
              ))}

          {title === 'draw_opponent_discard' &&
            (gameState.opponent.discard.length === 0 ? (
              <div style={{ width: '100%', height: '100%', textAlign: 'center', padding: '10px' }}>
                discard pile is currently empty.
              </div>
            ) : (
              gameState.opponent.discard
                .filter((card) => card.type === CardType.UNIT)
                .map((card: Card) => (
                  <div
                    key={card.id}
                    className={`card-selector-image ${
                      selectedCards.find((c) => c.id === card.id) ? 'selected' : ''
                    }`}
                    onClick={() => handleCardSelect(card)}
                  >
                    <img src={card.imageUrl} alt={card.name} />
                    {selectedCards.find((c) => c.id === card.id) ? (
                  <div className="card-selector-image-description">{card.description? card.description : 'SELECTED'}</div>
                ) : null}
                  </div>
                ))
            ))}

          {title === 'redraw' &&
            gameState.player.hand.map((card: Card) => (
              <div
                key={card.id}
                className={`card-selector-image ${
                  selectedCards.find((c) => c.id === card.id) ? 'selected' : ''
                }`}
                onClick={() => handleCardSelect(card)}
              >
                <img src={card.imageUrl} alt={card.name} />
                {selectedCards.find((c) => c.id === card.id) ? (
                  <div className="card-selector-image-description">{card.description? card.description : 'SELECTED'}</div>
                ) : null}
              </div>
            ))}

          {title === 'discard-view' &&
            (gameState.player.discard.length === 0 ? (
              <div style={{ width: '100%', height: '100%', textAlign: 'center', padding: '10px' }}>
                discard pile is currently empty.
              </div>
            ) : (
              gameState.player.discard.map((card: Card) => (
                <div
                  key={card.id}
                  className={`card-selector-image ${
                    selectedCards.find((c) => c.id === card.id) ? 'selected' : ''
                  }`}
                  onClick={() => handleCardSelect(card)}
                >
                  <img src={card.imageUrl} alt={card.name} />
                  {selectedCards.find((c) => c.id === card.id) ? (
                  <div className="card-selector-image-description">{card.description? card.description : 'SELECTED'}</div>
                ) : null}
                </div>
              ))
            ))}
        </div>
        <div className="card-selector-button-container">
          {title === 'medic' && (
            <button
              className="card-selector-button"
              disabled={selectedCards.length === 0}
              onClick={() => onMedicSelect?.(selectedCards)}
            >
              Revive
            </button>
          )}
          {title === 'redraw' && (
            <button
              className="card-selector-button"
              disabled={selectedCards.length === 0}
              onClick={handleRedraw}
            >
              Redraw
            </button>
          )}
          {title === 'draw_opponent_discard' && (
            <button
              className="card-selector-button"
              disabled={selectedCards.length === 0 || gameState.opponent.discard.length === 0}
              onClick={handleDrawOpponentDiscard}
            >
              Draw
            </button>
          )}
          <button
            className="card-selector-button"
            onClick={() => {
              setGameState((prev) => ({
                ...prev,
                gamePhase: 'playing',
              }));
              setCardsSelector({ title: '', show: false });
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
export default GameCardsSelector;
