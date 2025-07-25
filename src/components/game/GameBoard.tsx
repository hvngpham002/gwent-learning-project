import React from 'react';
import { Card, CardAbility, CardType, Faction, GameState, RowPosition, SpecialCard, UnitCard } from '@/types/card';
import PlayerHand from '../player/PlayerHand';
import PlayerArea from '../player/PlayerArea';
import PlayerStatus from '../player/PlayerStatus';
import '@/styles/components/board.css';
import '@/styles/components/hand.css';
import GwentCard from '../card/GwentCard';
import { calculateTotalScore } from '@/utils/gameHelpers';
import { neutralDeck } from "@/data/cards/neutral";
import GameCardsSelector from './GameCardsSelector';

interface GameBoardProps {
  gameState: GameState;
  setGameState: (state: GameState | ((prev: GameState) => GameState)) => void;
  onCardClick: (card: Card) => void;
  onRowClick: (row: RowPosition) => void;
  onBoardUnitClick: (card: UnitCard, row: RowPosition) => void;
  onWeatherRowClick: () => void;  // Add this
  onPass: () => void;
  selectedCard: Card | null;
  setSelectedCard: (card: Card | null) => void;
  isDecoyActive: boolean;
  cardsSelector: {
    title: string;
    show: boolean;
  };
  setCardsSelector: (cardsSelector: {
    title: string;
    show: boolean;
  }) => void;
  handleDiscardPile: () => void;
  onRedraw: (selectedCards: Card[]) => void;
  onMedicSelect: (selectedCards: Card[]) => void;
  onLeaderAbility: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  setGameState,
  onCardClick,
  onRowClick,
  onWeatherRowClick,
  onBoardUnitClick,
  onPass,
  selectedCard,
  setSelectedCard,
  isDecoyActive,
  cardsSelector,
  setCardsSelector,
  handleDiscardPile,
  onRedraw,
  onMedicSelect,
  onLeaderAbility
}) => {

  const playerImageUrl = () => {
    switch(gameState.player.faction) {
      case Faction.NILFGAARD:
        return '/images/nilfgaard/default-nilfgaard.png';
      case Faction.MONSTERS:
        return '/images/monster/default-monster.png';
      case Faction.NORTHERN_REALMS:
        return '/images/northern_realms/default-northern_realms.png';
      case Faction.SCOIATAEL:
        return '/images/scoiatael/default-scoiatael.png';
      default:
        return '/images/neutral/default-neutral.png';
    }
  }

  const opponentImageUrl = () => {
    switch(gameState.opponent.faction) {
      case Faction.NILFGAARD:
        return '/images/nilfgaard/default-nilfgaard.png';
      case Faction.MONSTERS:
        return '/images/monster/default-monster.png';
      case Faction.NORTHERN_REALMS:
        return '/images/northern_realms/default-northern_realms.png';
      case Faction.SCOIATAEL:
        return '/images/scoiatael/default-scoiatael.png';
      default:
        return '/images/neutral/default-neutral.png';
    }
  }

  const playerDeckCard: Card = {
    id: 'player-deck-back',
    name: 'Player Deck',
    faction: gameState.player.faction ?? Faction.NEUTRAL,
    type: CardType.SPECIAL,
    imageUrl: playerImageUrl(),
    strength: 0,
    ability: CardAbility.NONE
  };

  const opponentdeckCard: Card = {
    id: 'opponent-deck-back',
    name: 'Opponent Deck',
    faction: gameState.opponent.faction ?? Faction.NEUTRAL,
    type: CardType.SPECIAL,
    imageUrl: opponentImageUrl(),
    strength: 0,
    ability: CardAbility.NONE
  };

  const discardCard: Card = {
    id: 'deck-discard',
    name: 'Deck',
    faction: gameState.player.deck[0]?.faction ?? Faction.NEUTRAL,
    type: CardType.SPECIAL,
    imageUrl: '/images/other-graveyard.png',
    strength: 0,
    ability: CardAbility.NONE
  };

  const canPlayWeather = () => {
    if (!selectedCard || selectedCard.type !== CardType.SPECIAL) return false;
    return selectedCard.ability === CardAbility.FROST ||
           selectedCard.ability === CardAbility.FOG ||
           selectedCard.ability === CardAbility.RAIN ||
           selectedCard.ability === CardAbility.CLEAR_WEATHER;
  };

  return (
    <div className="game-container">
      <div className="game-layout">
          {cardsSelector.show &&
              <GameCardsSelector
                  setCardsSelector={setCardsSelector}
                  gameState={gameState}
                  title={cardsSelector.title}
                  redrawCount={(cardsSelector as any).redrawCount}
                  onRedraw={onRedraw}
                  setGameState={setGameState}
                  onMedicSelect={onMedicSelect}
              />
          }
        {/* Left sidebar with player statuses */}
        <div className="game-sidebar">
          <PlayerStatus
              player={gameState.opponent}
              turn={gameState.currentTurn}
              board={gameState.opponentBoard}
              weatherEffects={gameState.activeWeatherEffects}
              isOpponent={true}
              onPass={onPass}
              opponentScore={calculateTotalScore(gameState.playerBoard, gameState.activeWeatherEffects)}
              setSelectedCard={setSelectedCard}
              onLeaderAbility={() => {}}
          />
          <div className="weather-area">
            <div className={`weather-row ${canPlayWeather() ? 'weather-row--playable' : ''}`} onClick={() => canPlayWeather() && onWeatherRowClick?.()}>
              {Array.from(gameState.activeWeatherEffects).map(effect => {
                const weatherCard = neutralDeck.specials.find(s => s.ability === effect);
                if (!weatherCard) return null;
                return (
                  <GwentCard
                    card={weatherCard as SpecialCard}
                    isPlayable={false}
                    key={effect}
                  />
                );
              })}
            </div>
          </div>
          <PlayerStatus
             player={gameState.player}
             turn={gameState.currentTurn}
             board={gameState.playerBoard}
             weatherEffects={gameState.activeWeatherEffects}
             isOpponent={false}
             onPass={onPass}
             opponentScore={calculateTotalScore(gameState.opponentBoard, gameState.activeWeatherEffects)}
             setSelectedCard={setSelectedCard}
             onLeaderAbility={onLeaderAbility}
          />
        </div>

        {/* Main board area */}
        <div className="board-area">
          <PlayerArea
            boardState={gameState.opponentBoard}
            weatherState={gameState.activeWeatherEffects}
            isOpponent={true}
          />
          <PlayerArea
            boardState={gameState.playerBoard}
            weatherState={gameState.activeWeatherEffects}
            onRowClick={onRowClick}
            onUnitClick={onBoardUnitClick}
            isDecoyActive={isDecoyActive}
          />
          <PlayerHand
            cards={gameState.player.hand}
            onCardClick={onCardClick}
            isActive={gameState.currentTurn === 'player'}
            selectedCard={selectedCard}
          />
        </div>
        <div className='board-sidebar'>
          <div className="deck-container">
            <div className='deck-cards'>
              <GwentCard
                card={discardCard}
                isPlayable={false}
              />
              <div className="deck-count">{gameState.opponent.discard.length}</div>
            </div>
            <div className='deck-cards'>
              <GwentCard
                card={opponentdeckCard}
                isPlayable={false}
              />
              <div className="deck-count">{gameState.opponent.deck.length}</div>
            </div>
          </div>
          {selectedCard && (
            <div className='selected-card-container'>
              <div className='selected-card-image'>
                <img src={selectedCard?.imageUrl} alt={selectedCard?.name} />
              </div>
            <div className='selected-card-description'>
              <span className='selected-card-name'>{selectedCard?.name}</span>
             {selectedCard?.description}
              </div>
            </div>
          )}
          <div className="deck-container">
            <div className='deck-cards'>
              <GwentCard
                onClick={handleDiscardPile}
                card={discardCard}
                isPlayable={true}
              />
              <div className="deck-count">{gameState.player.discard.length}</div>
            </div>
            <div className='deck-cards'>
              <GwentCard
                card={playerDeckCard}
                isPlayable={false}
              />
              <div className="deck-count">{gameState.player.deck.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;