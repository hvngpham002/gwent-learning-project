import { BoardState, Card, CardAbility, PlayerState } from '@/types/card';
import '@/styles/components/player-status.css';
import { calculateTotalScore } from '@/utils/gameHelpers';
import React from 'react';

interface PlayerStatusProps {
  player: PlayerState;
  board: BoardState;
  weatherEffects: Set<CardAbility>;
  isOpponent?: boolean;
  onPass?: () => void;
  opponentScore?: number;
  turn?: string;
  setSelectedCard: (card: Card | null) => void;
  onLeaderAbility: () => void;
}

const PlayerStatus = ({
  player,
  board,
  weatherEffects,
  isOpponent = false,
  onPass,
  opponentScore,
  turn,
  setSelectedCard,
  onLeaderAbility
}: PlayerStatusProps) => {

  const totalScore = calculateTotalScore(board, weatherEffects);

  const cardClassName = [
    'leader',
    player.leader?.used && '--used',
    !player.leader?.used && '--notUsed',
  ].filter(Boolean).join('');

  console.log(turn);

  const handleLeaderCardClick = () => {
    if (turn === 'player') {
      setSelectedCard(player.leader);
    }
  };

  const deckName = (player: PlayerState): string => {
    if (!player.leader) {
      return 'Unknown Deck';
    }

    switch(player.leader.faction) {
      case 'northern_realms':
        return 'Northern Realms';
      case 'nilfgaard':
        return 'Nilfgaardian Empire';
      case 'monsters':
        return 'Monsters';
      case 'scoiatael':
        return 'Scoia\'tael';
      case 'skellige':
        return 'Skellige';
      default:
        return 'Unknown Faction';
    }
  };
  
  return (
    <div className="player-status">
      <div className="player-info">
        <div className="player-avatar">
            {isOpponent ? <img src='src\assets\avatars\geralt_avatar.png' /> : <img src='src\assets\avatars\ciri_avatar.png' />}
        </div>
        <div className='player-name-deck'>
          <div className="player-name">
            {isOpponent ? 'Opponent' : 'Player'}
          </div>
          <p className='player-deck'>{ deckName(player)} </p>
        </div>
      </div>
      <div className="player-lives">
        <div className="score-container">
            <div className="hand-size">
              <img src='src\assets\avatars\on_hand.png'/> {player.hand.length}
            </div>
        </div>
        <div className='lives-container'>
          {Array.from({ length: player.lives }).map((_, index) => (
            <div key={index} className="life-token" title="Life token" />
          ))}
        </div>
      </div>
      <div className='leader-score-container'>
      {player.leader && (
       <React.Fragment>
          <div onClick={handleLeaderCardClick} className={`leader-card`}>
              <img
                className={cardClassName}
                src={player.leader.imageUrl}
                alt={player.leader.name}
              />
          </div>
          <div className={`player-score ${totalScore < (opponentScore ?? 0) ? 'losing-score' : 'winning-score'}`}>
                {totalScore}
          </div>
            {!player.leader.used && !isOpponent && (
                <button
                className="leader-ability-button"
                onClick={onLeaderAbility}
                disabled={turn !== 'player'}
                >
                    Use Leader Card
                </button>
            )}
       </React.Fragment>
      )}
      {!isOpponent && !player.passed && (
        <button
          className="pass-button"
          onClick={() => onPass && onPass()}  // Update this line
          disabled={turn !== 'player'}
        >
          Pass
        </button>
      )}
      {player.passed && (
        <div className="passed-status">
          Passed
        </div>
      )}
      </div>
    </div>
  );
};

export default PlayerStatus;