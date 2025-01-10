// src/ai/strategy.ts
import { Card, CardType, CardAbility, GameState, UnitCard, RowPosition } from '@/types/card';
import { calculateRowStrength, calculateTotalScore } from '@/utils/gameHelpers';

export interface PlayDecision {
  card: Card;
  row?: RowPosition;
  targetCard?: UnitCard;
  score: number;
}

// Base class for all strategies
abstract class Strategy {
  abstract evaluate(state: GameState, card: Card): PlayDecision | null;
}

// Strategy for Commander's Horn
class CommanderHornStrategy extends Strategy {
  evaluate(state: GameState, card: Card): PlayDecision | null {
    if (card.type !== CardType.SPECIAL || card.ability !== CardAbility.COMMANDERS_HORN) {
      return null;
    }

    const rows: RowPosition[] = [RowPosition.CLOSE, RowPosition.RANGED, RowPosition.SIEGE];
    let bestRow: RowPosition | undefined;
    let maxScoreIncrease = 0;

    rows.forEach(row => {
      const currentRow = state.opponentBoard[row];
      if (currentRow.hornActive) return; // Skip if horn already active

      const currentStrength = calculateRowStrength(currentRow.cards, false, false);
      const strengthWithHorn = calculateRowStrength(currentRow.cards, false, true);
      const increase = strengthWithHorn - currentStrength;

      if (increase > maxScoreIncrease) {
        maxScoreIncrease = increase;
        bestRow = row;
      }
    });

    if (!bestRow || maxScoreIncrease < 8) { // Threshold for playing horn
      return null;
    }

    return {
      card,
      row: bestRow,
      score: maxScoreIncrease
    };
  }
}

// Strategy for Spy cards
class SpyStrategy extends Strategy {
  evaluate(_state: GameState, card: Card): PlayDecision | null {
    if (card.type !== CardType.UNIT || card.ability !== CardAbility.SPY) {
      return null;
    }

    const unitCard = card as UnitCard;
    // Spies are almost always worth playing for card advantage
    return {
      card: unitCard,
      row: unitCard.row,
      score: 15 // High priority for card advantage
    };
  }
}

// Strategy for Decoy cards
class DecoyStrategy extends Strategy {
  evaluate(state: GameState, card: Card): PlayDecision | null {
    if (card.type !== CardType.SPECIAL || card.ability !== CardAbility.DECOY) {
      return null;
    }

    const bestTarget = this.findBestDecoyTarget(state);
    if (!bestTarget) {
      return null;
    }

    return {
      card,
      targetCard: bestTarget.card,
      score: bestTarget.score
    };
  }

  private findBestDecoyTarget(state: GameState): { card: UnitCard; score: number } | null {
    const allUnits: { card: UnitCard; score: number }[] = [];

    Object.values(state.opponentBoard).forEach(row => {
      row.cards
        .filter((card: Card): card is UnitCard => 
          card.type === CardType.UNIT
        )
        .forEach((card: UnitCard) => {
          let score = 0;

          // Only consider units with abilities or very high strength
          if (card.ability === CardAbility.NONE && card.strength <= 7) {
            return; // Skip units with no abilities unless they're very strong
          }

          // Score based on ability
          if (card.ability === CardAbility.SPY) score += 12;
          if (card.ability === CardAbility.MEDIC) score += 10;
          if (card.ability === CardAbility.TIGHT_BOND) score += 8;
          if (card.ability === CardAbility.MORALE_BOOST) score += 6;

          // Only add strength score for very strong units
          if (card.strength > 7) {
            score += Math.min((card.strength - 7) * 2, 8); // Cap the strength bonus
          }

          // Minimum score threshold
          if (score >= 6) { // Only consider targets with meaningful value
            allUnits.push({ card, score });
          }
        });
    });

    if (allUnits.length === 0) return null;

    return allUnits.reduce((best, current) => 
      current.score > best.score ? current : best
    );
}
}

// Strategy for regular unit cards
class UnitStrategy extends Strategy {
    evaluate(state: GameState, card: Card): PlayDecision | null {
        if (card.type !== CardType.UNIT || card.ability === CardAbility.SPY) {
            return null;
        }
    
        const unitCard = card as UnitCard;
        let score = this.evaluateUnitValue(unitCard, state);
    
        // Special scoring only for 0-0 tie when player passes
        const currentBoardScore = calculateTotalScore(state.opponentBoard, state.activeWeatherEffects);
        if (state.player.passed && 
            state.playerScore === 0 && 
            currentBoardScore === 0) {
            // Give highest priority to lowest strength non-spy unit
            score = 30 - unitCard.strength;
            
            // Additional bonus for units without special abilities
            if (unitCard.ability === CardAbility.NONE) {
                score += 10;
            }
        } else if (state.player.passed) {
            // In other passing situations, evaluate normally but with slight preference
            // for stronger cards when we need to catch up
            const pointsNeeded = state.playerScore - currentBoardScore + 1;
            if (unitCard.strength >= pointsNeeded) {
                score += 5; // Bonus for cards that can win in one play
            }
        }
    
        return {
            card: unitCard,
            row: unitCard.row,
            score
        };
    }

  private evaluateUnitValue(card: UnitCard, state: GameState): number {
    let score = card.strength;

    // Bonus for tight bond potential
    if (card.ability === CardAbility.TIGHT_BOND) {
      const sameNameCount = state.opponentBoard[card.row].cards
        .filter(c => c.name === card.name).length;
      if (sameNameCount > 0) {
        score *= (sameNameCount + 1);
      }
    }

    // Bonus for morale boost synergy
    if (card.ability === CardAbility.MORALE_BOOST) {
      const rowUnitCount = state.opponentBoard[card.row].cards.length;
      score += rowUnitCount;
    }

    return score;
  }
}

// Main AI Strategy Coordinator
export class AIStrategyCoordinator {
  private strategies: Strategy[];

  constructor() {
    this.strategies = [
      new SpyStrategy(),
      new DecoyStrategy(),
      new CommanderHornStrategy(),
      new UnitStrategy()
    ];
  }

  evaluateHand(state: GameState): PlayDecision | null {
    const hand = state.opponent.hand;
    if (hand.length === 0) return null;

    let bestDecision: PlayDecision | null = null;
    let highestScore = -1;

    hand.forEach(card => {
      this.strategies.forEach(strategy => {
        const decision = strategy.evaluate(state, card);
        if (decision && decision.score > highestScore) {
          highestScore = decision.score;
          bestDecision = decision;
        }
      });
    });

    return bestDecision;
  }

  shouldPass(state: GameState): boolean {
    const currentBoardScore = calculateTotalScore(state.opponentBoard, state.activeWeatherEffects);
    const playerBoardScore = calculateTotalScore(state.playerBoard, state.activeWeatherEffects);
    const pointsNeeded = playerBoardScore - currentBoardScore + 1;
    const cardAdvantage = state.opponent.hand.length - state.player.hand.length;

    console.log('=== AI Pass Decision Analysis ===');
    console.log('Current State:', {
        playerBoardScore,
        currentBoardScore,
        pointsNeeded,
        cardAdvantage,
        roundNumber: state.currentRound,
        cardsInHand: state.opponent.hand.length,
        playerCards: state.player.hand.length
    });
    
    if (state.player.passed) {
        console.log('Player has passed - analyzing whether to continue...');

        if (pointsNeeded > 12) {  // If we need more than 12 points
            console.log('Large point deficit analysis:', {
                pointsNeeded,
                cardAdvantage,
                cardsInHand: state.opponent.hand.length
            });
    
            // Only fight if we have both:
            // 1. Enough cards to realistically win
            // 2. Not at a severe card disadvantage
            const canWinRound = (state.opponent.hand.length * 8) >= pointsNeeded;
            const healthyCardCount = cardAdvantage >= -1;
    
            if (canWinRound && healthyCardCount) {
                console.log('Committing to win large deficit');
                return false;  // Fight for the round
            } else {
                console.log('Too expensive to catch up, preserving cards');
                return true;   // Pass immediately
            }
        }
        
        if (currentBoardScore > playerBoardScore) {
            console.log('AI is already winning, deciding to pass');
            return true;
        }

        // Round 1 specific logic
        if (state.currentRound === 1) {
            // Card preservation threshold
            if (state.opponent.hand.length <= 6) {
                console.log('Preserving minimum hand size (6) in round 1');
                return true;
            }

            // Special case for 0-0
            if (playerBoardScore === 0 && currentBoardScore === 0) {
                return state.opponentBoard.close.cards.length > 0 || 
                       state.opponentBoard.ranged.cards.length > 0 || 
                       state.opponentBoard.siege.cards.length > 0;
            }

            const cardsNeededToWin = Math.ceil(pointsNeeded / 8);  // average 8 points per card
            console.log('Catch-up analysis:', {
                pointsNeeded,
                cardsNeededToWin,
                cardAdvantage,
                cardsInHand: state.opponent.hand.length
            });

            // Don't fight if we need too many cards
            if (cardsNeededToWin >= 4) {
                console.log('Need too many cards to catch up');
                return true;
            }

            // Fight if we have card advantage or minimal disadvantage and can catch up
            if (cardAdvantage >= -1 && cardsNeededToWin <= 2) {
                console.log('Good position to catch up');
                return false;
            }

            // If significantly behind in cards, only continue if we can win with one strong play
            if (cardAdvantage < -2) {
                return pointsNeeded > 10;  // pass if we need more than what a strong card could provide
            }

            // Conservative passing for round 1
            return pointsNeeded > 16 || state.opponent.hand.length < 8;
        }

        // Round 2 - more aggressive
        if (state.currentRound === 2) {
            // Must try to win if theoretically possible
            const potentialPoints = state.opponent.hand.length * 8;  // average 8 points per card
            // Only pass if we can't theoretically win
            return potentialPoints < pointsNeeded;
        }
    }

    // Standard non-passed logic
    if (currentBoardScore > playerBoardScore + 30) return true;
    if (playerBoardScore > currentBoardScore + 40) return true;

    return false;
}
}