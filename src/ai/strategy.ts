// src/ai/strategy.ts
import { Card, CardType, CardAbility, GameState, UnitCard, RowPosition } from '@/types/card';
import { calculateRowStrength, calculateTotalScore, calculateWeatherImpact, findCloseScorchTargets, findScorchTargets } from '@/utils/gameHelpers';

export interface PlayDecision {
  card: Card;
  row?: RowPosition;
  targetCard?: UnitCard;
  score: number;
  medicTarget?: UnitCard;
}

// Base class for all strategies
abstract class Strategy {
  abstract evaluate(state: GameState, card: Card): PlayDecision | null;
}

class RedrawStrategy extends Strategy {
  evaluate(state: GameState, card: Card): PlayDecision | null {
    let redrawScore = 0;

    // Check for redundant weather cards first
    const copiesInHand = state.opponent.hand.filter(c => c.name === card.name).length;
    if (copiesInHand > 1 && 
        card.type === CardType.SPECIAL && 
        [CardAbility.FROST, CardAbility.FOG, CardAbility.RAIN, CardAbility.CLEAR_WEATHER].includes(card.ability)) {
      return {
        card,
        score: 10
      };
    }

    // Only proceed with unit evaluation if it's a unit card
    if (card.type !== CardType.UNIT) return null;

    const unitCard = card as UnitCard;

    // Handle tight bond cards without pairs
    if (unitCard.ability === CardAbility.TIGHT_BOND) {
      if (copiesInHand === 1) {
        // Single tight bond card is bad
        redrawScore += 8;
        // Additional score for lower strength tight bonds
        const strengthPenalty = Math.max(0, 8 - unitCard.strength);
        redrawScore += strengthPenalty;
      } else if (copiesInHand === 2) {
        // Keep pairs together - don't redraw
        return null;
      } else if (copiesInHand === 3) {
        // Having 3 copies is ideal for one type of tight_bond
        // Only consider redrawing if we have another complete set
        const otherTightBondPairs = state.opponent.hand
          .filter(c => c.ability === CardAbility.TIGHT_BOND && c.name !== card.name)
          .reduce((acc, curr) => {
            acc[curr.name] = (acc[curr.name] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
    
        const hasAnotherCompleteSet = Object.values(otherTightBondPairs).some(count => count >= 2);
        if (hasAnotherCompleteSet) {
          redrawScore += 4; // Lower priority for redundant tight_bond set
        } else {
          return null; // Keep the only tight_bond set we have
        }
      }
    }

    // Low strength units with no abilities are prime candidates
    if (unitCard.strength <= 4 && unitCard.ability === CardAbility.NONE) {
      redrawScore += 8;
    }

    // Don't redraw spies or medics
    if (unitCard.ability === CardAbility.SPY || unitCard.ability === CardAbility.MEDIC) {
      return null;
    }

    // Don't redraw muster cards
    if (unitCard.ability === CardAbility.MUSTER || unitCard.ability === CardAbility.MUSTER_ROACH) {
      return null;
    }

    if (redrawScore === 0) return null;

    return {
      card: unitCard,
      score: redrawScore
    };
  }
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

class WeatherStrategy extends Strategy {
  evaluate(state: GameState, card: Card): PlayDecision | null {
    if (card.type !== CardType.SPECIAL || 
        ![CardAbility.FROST, CardAbility.FOG, CardAbility.RAIN, CardAbility.CLEAR_WEATHER].includes(card.ability)) {
      return null;
    }

    // Clear weather logic
    if (card.ability === CardAbility.CLEAR_WEATHER) {
      let totalImpact = 0;
      state.activeWeatherEffects.forEach(effect => {
        totalImpact += calculateWeatherImpact(state, effect, true);
      });

      // Only clear weather if it's significantly hurting us
      if (totalImpact < -8) {
        return {
          card,
          score: Math.abs(totalImpact)
        };
      }
      return null;
    }

    // Regular weather card logic
    const impact = calculateWeatherImpact(state, card.ability, true);
    
    // Don't play weather if impact is too small
    if (impact < 6) return null;

    return {
      card,
      score: impact
    };
  }
}

class ScorchStrategy extends Strategy {
  evaluate(state: GameState, card: Card): PlayDecision | null {
    if (card.type !== CardType.SPECIAL || card.ability !== CardAbility.SCORCH) {
      return null;
    }

    const targets = findScorchTargets(state);
    
    // Don't scorch if we would lose more strength than opponent
    let ourLoss = 0;
    let theirLoss = 0;
    
    targets.cards.forEach(target => {
      const isOurs = Object.values(state.opponentBoard).some(row => 
        row.cards.some((c: { id: string; }) => c.id === target.id)
      );
      if (isOurs) {
        ourLoss += targets.strength;
      } else {
        theirLoss += targets.strength;
      }
    });

    // Only scorch if net benefit is positive
    const netBenefit = theirLoss - ourLoss;
    if (netBenefit <= 4) return null;

    return {
      card,
      score: netBenefit
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

class HeroStrategy extends Strategy {
  evaluate(state: GameState, card: Card): PlayDecision | null {
    if (card.type !== CardType.HERO) {
      return null;
    }

    const heroCard = card as UnitCard;
    
    // Defer to MedicStrategy for medic heroes
    if (heroCard.ability === CardAbility.MEDIC) {
      return null;
    }

    let score = heroCard.strength * 1.5;

    // Special handling for spy heroes
    if (heroCard.ability === CardAbility.SPY) {
      return {
        card: heroCard,
        row: heroCard.row,
        score: 20
      };
    }

      // Increase priority if we're behind
      const currentBoardScore = calculateTotalScore(state.opponentBoard, state.activeWeatherEffects);
      if (state.playerScore > currentBoardScore) {
          score += 5; // Additional priority when we need to catch up
      }

      return {
          card: heroCard,
          row: heroCard.row,
          score
      };
  }
}

class MedicStrategy extends Strategy {
  evaluate(state: GameState, card: Card): PlayDecision | null {
    // Allow both unit and hero cards with medic ability
    if ((card.type !== CardType.UNIT && card.type !== CardType.HERO) || 
        card.ability !== CardAbility.MEDIC) {
      return null;
    }

    const unitCard = card as UnitCard;
    const validTargets = state.opponent.discard.filter(c =>
      c.type === CardType.UNIT
    );

    console.log('=== Medic Strategy Evaluation ===', {
      medicCard: card.name,
      discardPileSize: state.opponent.discard.length,
      validTargets: validTargets.map(t => ({
        name: t.name,
        type: t.type,
        strength: 'strength' in t ? t.strength : 'N/A',
        ability: t.ability
      }))
    });

    if (validTargets.length === 0) {
      console.log('No valid targets for medic card');
      return null;
    }

    // Evaluate each potential target
    let bestTarget: Card | null = null;
    let bestScore = -1;

    for (const target of validTargets) {
      let score = 0;
      const targetCard = target as UnitCard;

      // Prioritize spies (highest priority)
      if (targetCard.ability === CardAbility.SPY) {
        score += 12;
      }
      // Prioritize other medics for chain revival
      else if (targetCard.ability === CardAbility.MEDIC) {
        score += 15;
      }
      // Prioritize high strength units
      else {
        score += targetCard.strength;
        // Bonus for special abilities
        if (targetCard.ability !== CardAbility.NONE) {
          score += 3;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestTarget = targetCard;
      }
    }

    if (!bestTarget) {
      return null;
    }

    return {
      card: unitCard,
      row: unitCard.row,
      score: bestScore + 5, // Base score for playing medic
      medicTarget: bestTarget as UnitCard
    };
  }
}

// Strategy for regular unit cards
class UnitStrategy extends Strategy {
  evaluate(state: GameState, card: Card): PlayDecision | null {
      if (card.type !== CardType.UNIT || card.ability === CardAbility.SPY) {
          return null;
      }

      const unitCard = card as UnitCard;

      // Special handling for SCORCH_CLOSE ability
      if (unitCard.ability === CardAbility.SCORCH_CLOSE) {
          const scorchResult = findCloseScorchTargets(state, false);
          if (scorchResult) {
              const { cards: targets, strength } = scorchResult;
              const netBenefit = strength * targets.length;
              if (netBenefit >= 4) {
                  return {
                      card: unitCard,
                      row: unitCard.row,
                      score: netBenefit + unitCard.strength + 10 
                  };
              }
          }
      }

      let score = this.evaluateUnitValue(unitCard, state);

      // Rest of the existing logic
      const currentBoardScore = calculateTotalScore(state.opponentBoard, state.activeWeatherEffects);
      if (state.player.passed &&
          state.playerScore === 0 &&
          currentBoardScore === 0) {
          score = 30 - unitCard.strength;
          if (unitCard.ability === CardAbility.NONE) {
              score += 10;
          }
      } else if (state.player.passed) {
          const pointsNeeded = state.playerScore - currentBoardScore + 1;
          if (unitCard.strength >= pointsNeeded) {
              score += 5;
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

      if (card.ability === CardAbility.TIGHT_BOND) {
          const sameNameCount = state.opponentBoard[card.row].cards
              .filter(c => c.name === card.name).length;
          if (sameNameCount > 0) {
              score *= (sameNameCount + 1);
          }
      }

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
  private redrawStrategy: RedrawStrategy;

  constructor() {
    this.strategies = [
      new SpyStrategy(),
      new MedicStrategy(),
      new UnitStrategy(),
      new HeroStrategy(),
      new WeatherStrategy(),
      new ScorchStrategy(),
      new DecoyStrategy(),
      new CommanderHornStrategy(),
      new UnitStrategy()
    ];
    this.redrawStrategy = new RedrawStrategy();
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

  evaluateRedraw(state: GameState): Card[] {
    const cardsToRedraw: Card[] = [];
    console.log('=== AI Redraw Analysis ===');
    console.log('Initial hand:', state.opponent.hand.map(card => ({
      name: card.name,
      type: card.type,
      strength: 'strength' in card ? card.strength : 'N/A',
      ability: card.ability
    })));

    // We can redraw up to 2 cards
    for (let i = 0; i < 2; i++) {
      let bestRedrawDecision: PlayDecision | null = null;
      
      const remainingHand = state.opponent.hand.filter(
        handCard => !cardsToRedraw.some(redrawCard => redrawCard.id === handCard.id)
      );
      
      for (const card of remainingHand) {
        const decision = this.redrawStrategy.evaluate(state, card);
        if (decision && (!bestRedrawDecision || decision.score > bestRedrawDecision.score)) {
          bestRedrawDecision = decision;
        }
      }

      if (bestRedrawDecision) {
        const redrawCard = bestRedrawDecision.card;
        cardsToRedraw.push(redrawCard);
        console.log(`Redrawing card ${i + 1}:`, {
          name: redrawCard.name,
          type: redrawCard.type,
          strength: 'strength' in redrawCard ? redrawCard.strength : 'N/A',
          ability: redrawCard.ability,
          score: bestRedrawDecision.score
        });
      } else {
        break;
      }
    }

    return cardsToRedraw;
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