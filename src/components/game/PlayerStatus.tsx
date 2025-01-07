import { PlayerState } from '@/types/card';
import '@/styles/components/player-status.css';
import React from 'react';

interface PlayerStatusProps {
  player: PlayerState;
  isOpponent?: boolean;
  onPass?: () => void;
}

const PlayerStatus = ({ player, isOpponent = false, onPass }: PlayerStatusProps) => {
  return (
    <div className="player-status">
      <div className="player-info">
        <div className="player-avatar">
            <img src='src\assets\avatars\ciri_avatar.png' />
        </div>
        <div>
          <div className="player-name">
            {isOpponent ? 'Opponent' : 'Player'}
          </div>
          <div className="player-score">
            {player.hand.length}
          </div>
        </div>
      </div>

      <div className="player-lives">
        {Array.from({ length: player.lives }).map((_, index) => (
          <div key={index} className="life-token" title="Life token" />
        ))}
      </div>

      {player.leader && (
        <React.Fragment>
            <div className="leader-card">
                <img
                    src={player.leader.imageUrl}
                    alt={player.leader.name}
                />
            </div>
            <div>
                {!player.leader.used && !isOpponent && (
                    <button
                    className="leader-ability-button"
                    onClick={() => {/* Handle leader ability */}}
                    >
                        Use Leader Card
                    </button>
                )}
            </div>
        </React.Fragment>
      )}

      {!isOpponent && !player.passed && (
        <button className="pass-button" onClick={onPass}>
          Pass
        </button>
      )}

      {player.passed && (
        <div className="passed-status">
          Passed
        </div>
      )}
    </div>
  );
};

export default PlayerStatus;