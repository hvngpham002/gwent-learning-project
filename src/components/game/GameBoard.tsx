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
  onCardClick: (card: Card) => void;
  onRowClick: (row: RowPosition) => void;
  onBoardUnitClick: (card: UnitCard, row: RowPosition) => void;
  onWeatherRowClick: () => void;  // Add this
  onPass: () => void;
  selectedCard: Card | null;
  isDecoyActive: boolean;
}

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardClick,
  onRowClick,
  onWeatherRowClick,
  onBoardUnitClick,
  onPass,
  selectedCard,
  isDecoyActive
}) => {

  const playerImageUrl = () => {
    switch(gameState.player.faction) {
      case Faction.NILFGAARD:
        return 'src/assets/images/nilfgaard/default-nilfgaard.png';
      case Faction.MONSTERS:
        return 'src/assets/images/monster/default-monster.png';
      case Faction.NORTHERN_REALMS:
        return 'src/assets/images/northern_realms/default-northern_realms.png';
      case Faction.SCOIATAEL:
        return 'src/assets/images/scoiatael/default-scoiatael.png';
      default:
        return 'src/assets/images/neutral/default-neutral.png';
    }
  }

  const opponentImageUrl = () => {
    switch(gameState.opponent.faction) {
      case Faction.NILFGAARD:
        return 'src/assets/images/nilfgaard/default-nilfgaard.png';
      case Faction.MONSTERS:
        return 'src/assets/images/monster/default-monster.png';
      case Faction.NORTHERN_REALMS:
        return 'src/assets/images/northern_realms/default-northern_realms.png';
      case Faction.SCOIATAEL:
        return 'src/assets/images/scoiatael/default-scoiatael.png';
      default:
        return 'src/assets/images/neutral/default-neutral.png';
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
    imageUrl: 'src/assets/images/other-graveyard.png',
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
        <GameCardsSelector gameState={gameState} />
        {/* Left sidebar with player statuses */}
        <div className="game-sidebar">
          <PlayerStatus
              player={gameState.opponent}
              board={gameState.opponentBoard}
              weatherEffects={gameState.activeWeatherEffects}
              isOpponent={true}
              onPass={onPass}
              opponentScore={calculateTotalScore(gameState.playerBoard, gameState.activeWeatherEffects)}
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
             board={gameState.playerBoard}
             weatherEffects={gameState.activeWeatherEffects}
             isOpponent={false}
             onPass={onPass}
             opponentScore={calculateTotalScore(gameState.opponentBoard, gameState.activeWeatherEffects)}
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
                card={discardCard}
                isPlayable={false}
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