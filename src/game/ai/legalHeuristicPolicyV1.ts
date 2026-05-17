import type { CatalogAbilityId, CatalogRow } from "@/game/catalog";
import type {
  ChooseMulliganMove,
  ChoosePromptOptionMove,
  LegalMove,
  PassMove,
  PlayCardMove,
  SeatId,
  UseLeaderMove,
} from "@/game/core";

import type {
  EnginePolicyInput,
  EnginePolicy,
  PromptOptionSummary,
  SeatBoardRowSummary,
  SeatCardSummary,
} from "./types";

import {
  buildAiDecisionHandShapeAnalysis,
  getFutureHandExtraBuffer,
  type AiDecisionScoiataelFirstTurnAnalysis,
  type AiDecisionScoiataelFirstTurnRecommendation,
  type AiDecisionScoiataelFirstTurnReasonKind,
  type AiDecisionFirstTurnTempoBucket,
  type AiDecisionRoundResourcePressure,
  type AiDecisionRoundResourceExhaustionReason,
} from "./decisionTrace";

export const MIN_USEFUL_MOVE_SCORE = 25;

// cFp29: Contextual Medic timing constants
export const MEDIC_NO_TARGET_UTILITY = -140;
export const MEDIC_WEAK_TARGET_UTILITY = 70;
export const MEDIC_MEDIUM_TARGET_UTILITY = 180;
export const MEDIC_STRONG_TARGET_UTILITY = 320;

// cFp36: Round resource budget constants for non-elimination rounds
// Base board card budget by future hand quality
const ROUND_RESOURCE_BUDGET_BASE: Record<
  import("./decisionTrace").AiDecisionHandQuality,
  number
> = {
  healthy: 5,
  thin: 4,
  poor: 3,
  empty: 3,
};
const ROUND_RESOURCE_BUDGET_FLOOR = 2;
const ROUND_RESOURCE_BUDGET_CAP = 6;

export type LegalHeuristicV1MedicTimingBucket =
  | "none"
  | "weak"
  | "medium"
  | "strong";

export interface LegalHeuristicV1MedicTimingInfo {
  readonly sourceIsMedic: boolean;
  readonly reviveCandidateCount: number;
  readonly bestReviveValue: number;
  readonly bestReviveStrength: number;
  readonly bestReviveValueBucket: LegalHeuristicV1MedicTimingBucket;
  readonly hasReviveTarget: boolean;
  readonly noTargetPenaltyApplied: boolean;
}

// cFp26: Nilfgaard tie-win awareness matching engine round-resolution rules.
// The engine treats tied scores as: if exactly one seat is Nilfgaard, that
// Nilfgaard seat wins the tie; if neither or both are Nilfgaard, the round
// is a draw (tie does not win).
// cFp26.1: exported for pass diagnostics helper.
export const ownWinsTiedRound = (features: LegalHeuristicV1Features) =>
  features.input.observation.ownFaction === "nilfgaard" &&
  features.input.observation.opponentFaction !== "nilfgaard";

export const minimumScoreToWinRound = (features: LegalHeuristicV1Features) =>
  ownWinsTiedRound(features) ? features.opponentScore : features.opponentScore + 1;

const WEATHER_ROWS_BY_ABILITY: Partial<Record<CatalogAbilityId, readonly CatalogRow[]>> = {
  frost: ["close"],
  fog: ["ranged"],
  rain: ["siege"],
  skellige_storm: ["ranged", "siege"],
};

const SCORCH_ROWS_BY_ABILITY: Partial<Record<CatalogAbilityId, readonly CatalogRow[]>> = {
  scorch_close: ["close"],
  scorch_range: ["ranged"],
  scorch_siege: ["siege"],
};

const byMoveId = (left: Pick<LegalMove, "moveId">, right: Pick<LegalMove, "moveId">) =>
  left.moveId.localeCompare(right.moveId);

const hasAbility = (card: SeatCardSummary | undefined, ability: CatalogAbilityId) =>
  Boolean(card?.abilities.includes(ability));

const hasAnyAbility = (card: SeatCardSummary | undefined, abilities: readonly CatalogAbilityId[]) =>
  Boolean(card?.abilities.some((ability) => abilities.includes(ability)));

const isMusterCaller = (card: SeatCardSummary) =>
  (hasAbility(card, "muster") || hasAbility(card, "muster_roach")) &&
  (card.linkedSourceIds?.length ?? 0) > 0;

const isWeatherCard = (card: SeatCardSummary | undefined) =>
  hasAnyAbility(card, ["frost", "fog", "rain", "skellige_storm", "clear_weather"]);

const isScorchCard = (card: SeatCardSummary | undefined) =>
  hasAnyAbility(card, ["scorch", "scorch_close", "scorch_range", "scorch_siege"]);

// cFp30: Weather-aware unit placement helpers

const WEATHER_ABILITIES = ["frost", "fog", "rain", "skellige_storm"] as const;

const abilityToRows = (ability: CatalogAbilityId): readonly CatalogRow[] =>
  WEATHER_ROWS_BY_ABILITY[ability] ?? [];

/** Returns the set of rows currently affected by active weather (not clear_weather). */
export const activeWeatherRows = (features: LegalHeuristicV1Features): ReadonlySet<CatalogRow> => {
  const rows = new Set<CatalogRow>();
  for (const weatherCard of features.input.observation.weather) {
    // Skip clear_weather — it removes weather, doesn't add an active penalty.
    if (hasAbility(weatherCard, "clear_weather")) {
      continue;
    }
    for (const ability of weatherCard.abilities) {
      if (WEATHER_ABILITIES.includes(ability as typeof WEATHER_ABILITIES[number])) {
        for (const row of abilityToRows(ability)) {
          rows.add(row);
        }
      }
    }
  }
  return rows;
};

/** Returns whether the given row is currently weathered for the acting seat. */
export const isRowWeatheredForPolicy = (
  features: LegalHeuristicV1Features,
  row: CatalogRow,
): boolean => activeWeatherRows(features).has(row);

/**
 * Returns the weather-adjusted effective strength when placing `card` on
 * `target` row.
 * - Heroes are immune to weather.
 * - Non-hero units on a weathered row have effective strength ≈ 1.
 * - Commander's Horn on the target row doubles the weather-adjusted strength.
 */
export const effectivePlacedStrengthForPolicy = (
  features: LegalHeuristicV1Features,
  card: SeatCardSummary,
  target: { kind: "board_row"; side: "own" | "opponent"; row: CatalogRow },
): number => {
  const isWeathered = isRowWeatheredForPolicy(features, target.row);
  const baseStrength = card.kind === "hero" ? card.printedStrength : isWeathered ? 1 : card.printedStrength;

  // Check if there's already a Commander's Horn on the target row
  const rowSeatId = target.side === "own" ? features.input.seatId : features.input.observation.opponentSeatId;
  const rowSummary = features.input.observation.boardRows.find(
    (r) => r.seatId === rowSeatId && r.row === target.row,
  );
  const hasHorn = rowSummary?.horn !== null;
  const effectiveStrength = hasHorn ? baseStrength * 2 : baseStrength;

  return effectiveStrength;
};

// cFp29: Medic revive candidate helpers
export const isMedicSource = (card: SeatCardSummary | undefined) =>
  hasAbility(card, "medic");

const isMedicReviveCandidate = (card: SeatCardSummary) =>
  card.kind === "unit" && card.rows.length > 0;

const medicReviveCandidates = (features: LegalHeuristicV1Features) =>
  features.input.observation.ownDiscard.filter(isMedicReviveCandidate);

export const medicReviveCandidateValue = (candidate: SeatCardSummary) => {
  let value = candidate.printedStrength * 10;
  if (hasAbility(candidate, "spy")) value += 360;
  if (hasAbility(candidate, "medic")) value += 220;
  if (hasAbility(candidate, "muster") || hasAbility(candidate, "muster_roach")) value += 170;
  if (hasAbility(candidate, "tight_bond")) value += 95;
  if (hasAbility(candidate, "morale_boost")) value += 70;
  if (hasAbility(candidate, "scorch") || hasAbility(candidate, "scorch_close") || hasAbility(candidate, "scorch_range") || hasAbility(candidate, "scorch_siege")) value += 140;
  if (candidate.deckLimit === 1) value += 15;
  return value;
};

export const medicSourceUtility = (features: LegalHeuristicV1Features, card: SeatCardSummary): LegalHeuristicV1MedicTimingInfo => {
  const candidates = isMedicSource(card)
    ? medicReviveCandidates(features)
    : [];

  if (!isMedicSource(card)) {
    return {
      sourceIsMedic: false,
      reviveCandidateCount: 0,
      bestReviveValue: 0,
      bestReviveStrength: 0,
      bestReviveValueBucket: "none",
      hasReviveTarget: false,
      noTargetPenaltyApplied: false,
    };
  }

  const reviveCandidateCount = candidates.length;
  const hasReviveTarget = reviveCandidateCount > 0;

  let bestReviveValue = 0;
  let bestReviveStrength = 0;
  for (const c of candidates) {
    const v = medicReviveCandidateValue(c);
    if (v > bestReviveValue) bestReviveValue = v;
    if (c.printedStrength > bestReviveStrength) bestReviveStrength = c.printedStrength;
  }

  let bestReviveValueBucket: LegalHeuristicV1MedicTimingBucket;
  if (bestReviveValue === 0 && !hasReviveTarget) {
    bestReviveValueBucket = "none";
  } else if (bestReviveValue < 140) {
    bestReviveValueBucket = "weak";
  } else if (bestReviveValue < 280) {
    bestReviveValueBucket = "medium";
  } else {
    bestReviveValueBucket = "strong";
  }

  return {
    sourceIsMedic: true,
    reviveCandidateCount,
    bestReviveValue,
    bestReviveStrength,
    bestReviveValueBucket,
    hasReviveTarget,
    noTargetPenaltyApplied: !hasReviveTarget,
  };
};

const medicSourceUtilityScore = (features: LegalHeuristicV1Features, card: SeatCardSummary) => {
  if (!isMedicSource(card)) return 0;
  const candidates = medicReviveCandidates(features);
  if (candidates.length === 0) return MEDIC_NO_TARGET_UTILITY;

  let bestValue = 0;
  for (const c of candidates) {
    const v = medicReviveCandidateValue(c);
    if (v > bestValue) bestValue = v;
  }

  if (bestValue < 140) return MEDIC_WEAK_TARGET_UTILITY;
  if (bestValue < 280) return MEDIC_MEDIUM_TARGET_UTILITY;
  return MEDIC_STRONG_TARGET_UTILITY;
};

// cFp29: Medic revive tempo estimate for board_row plays
const medicReviveTempoForSource = (features: LegalHeuristicV1Features, card: SeatCardSummary) => {
  if (!isMedicSource(card)) return 0;
  const candidates = medicReviveCandidates(features);
  if (candidates.length === 0) return 0;

  // Use the best non-negative printed-strength from non-Spy candidates.
  // Spy targets are strategic value, not positive board tempo (they go to opponent side).
  let bestNonSpyStrength = 0;
  for (const c of candidates) {
    if (!hasAbility(c, "spy") && c.printedStrength > 0 && c.printedStrength > bestNonSpyStrength) {
      bestNonSpyStrength = c.printedStrength;
    }
  }
  return bestNonSpyStrength;
};

// cFp36: Round resource budget helpers
// Calculate the budget threshold for non-elimination rounds based on
// future hand quality, round number, and score delta.
export const buildRoundResourceBudget = (
  _features: LegalHeuristicV1Features,
  handQuality: import("./decisionTrace").AiDecisionHandQuality,
  round: number,
  scoreDelta: number,
  ownGems: number,
  opponentGems: number,
  ownPassed: boolean,
  opponentPassed: boolean,
): number => {
  // No budget in elimination rounds (last gem)
  if (ownGems <= 1) return ROUND_RESOURCE_BUDGET_CAP;

  // Round 3: no resource budget - spend remaining resources
  if (round >= 3) return ROUND_RESOURCE_BUDGET_CAP;

  // Opponent already passed: no preservation needed
  if (opponentPassed) return ROUND_RESOURCE_BUDGET_CAP;

  // Own passed: no preservation needed
  if (ownPassed) return ROUND_RESOURCE_BUDGET_CAP;

  // Start with base budget from hand quality
  let budget = ROUND_RESOURCE_BUDGET_BASE[handQuality] ?? 3;

  // Round 2 adjustment: -1 if we have more gems (safier to spend less)
  if (round === 2 && ownGems > opponentGems) {
    budget -= 1;
  }

  // Score delta adjustments
  if (scoreDelta >= 10) {
    budget -= 1; // Already favorable, can afford to preserve more
  }
  if (scoreDelta < -15) {
    budget += 1; // Significantly behind, may need more investment
  }

  // Clamp to floor/cap
  return Math.max(ROUND_RESOURCE_BUDGET_FLOOR, Math.min(budget, ROUND_RESOURCE_BUDGET_CAP));
};

// Determine resource pressure level based on current board investment
// relative to the calculated budget.
// Pressure only applies when board investment is AT OR OVER budget.
// Under-budget investment is not a pressure signal.
export const buildRoundResourcePressure = (
  _features: LegalHeuristicV1Features,
  roundInvestmentAnalysis: import("./decisionTrace").AiDecisionRoundInvestmentAnalysis,
  _selectedMove: PlayCardMove | UseLeaderMove | null,
): AiDecisionRoundResourcePressure => {
  const budget = roundInvestmentAnalysis.roundResourceBudget;
  const boardCardCount = roundInvestmentAnalysis.ownBoardCardCount;

  // Round 3: no resource pressure from cFp36 perspective
  if (_features.round >= 3) return "none";

  // Under budget: no pressure — plenty of room to play
  if (boardCardCount < budget) {
    return "none";
  }

  // At or over budget: pressure to preserve
  const excess = boardCardCount - budget;
  if (excess >= 2) return "critical";
  if (excess >= 1) return "high";
  return "watch";
};

// cFp36: Determine if resource exhaustion preservation is recommended.
// Returns the reason if it should be applied, "none" otherwise.
// Exception reasons (exception_*, round_three_no_budget) must NOT set
// resourceExhaustionRecommended = true — only budget-exceeded reasons
// (round_budget_exceeded, thin_future_hand, poor_future_hand, last_useful_unit)
// should suppress plays.
export const buildRoundResourceExhaustionDecision = (
  features: LegalHeuristicV1Features,
  roundInvestmentAnalysis: import("./decisionTrace").AiDecisionRoundInvestmentAnalysis,
  selectedMove: PlayCardMove | UseLeaderMove | null,
  handQuality: import("./decisionTrace").AiDecisionHandQuality,
): AiDecisionRoundResourceExhaustionReason => {
  const budget = roundInvestmentAnalysis.roundResourceBudget;
  const boardCardCount = roundInvestmentAnalysis.ownBoardCardCount;
  const round = features.round;

  // ------------------------------------------------------------------
  // Exceptions: never block these for resource budgeting
  // ------------------------------------------------------------------

  // Last-gem exception
  if (features.ownGems <= 1) return "exception_last_gem";

  // Card-advantage exception (Spy, etc.)
  if (selectedMove && roundInvestmentAnalysis.selectedMoveIsCardAdvantage) {
    return "exception_card_advantage";
  }

  // Free leader exception (use_leader doesn't spend hand cards)
  if (selectedMove?.kind === "use_leader") return "exception_leader";

  // Round 3: no resource preservation (no future round to preserve for)
  if (round >= 3) return "round_three_no_budget";

  // Single-card hand: nothing meaningful to preserve
  if (features.ownHandCount <= 1) return "none";

  // Opponent must not have passed
  if (features.opponentPassed) return "none";

  // Only applies to play_card moves (spend hand cards)
  if (!selectedMove || selectedMove.kind !== "play_card") return "none";

  // ------------------------------------------------------------------
  // Match-winning play exception: if opponent is on last gem and this
  // move wins the match, always play it regardless of budget.
  // ------------------------------------------------------------------
  if (selectedMove.kind === "play_card") {
    const tempo = estimateImmediateTempo(features, selectedMove);
    const minScore = minimumScoreToWinRound(features);
    if (features.opponentGems <= 1 && features.ownScore + tempo >= minScore) {
      return "exception_match_winning_play";
    }
  }

  // ------------------------------------------------------------------
  // Cheap single-move catch-up exception: if the candidate catches up
  // to minimumScoreToWinRound with small overkill and does not leave
  // future unit tempo completely empty, allow it even if over budget.
  // ------------------------------------------------------------------
  if (features.scoreDelta < 0 && selectedMove.kind === "play_card") {
    const candidateTempo = estimateImmediateTempo(features, selectedMove);
    const minScoreToWin = minimumScoreToWinRound(features);
    const catchesUp = features.ownScore + candidateTempo >= minScoreToWin;
    const overkill = catchesUp
      ? Math.max(0, features.ownScore + candidateTempo - minScoreToWin)
      : Infinity;
    // Allow catch-up if: catches up, small overkill (<=3), and doesn't
    // leave no future unit tempo, OR if it's card advantage.
    if (
      catchesUp &&
      overkill <= 3 &&
      !roundInvestmentAnalysis.selectedMoveWouldLeaveNoUnitTempoCard
    ) {
      return "none";
    }
  }

  // ------------------------------------------------------------------
  // Budget-exceeded reasons: these DO set resourceExhaustionRecommended
  // ------------------------------------------------------------------
  if (boardCardCount >= budget) {
    if (handQuality === "poor") return "poor_future_hand";
    if (handQuality === "thin") return "thin_future_hand";
    if (roundInvestmentAnalysis.selectedMoveWouldLeaveNoUnitTempoCard) {
      return "last_useful_unit";
    }
    return "round_budget_exceeded";
  }

  return "none";
};

export interface LegalHeuristicV1Features {
  input: EnginePolicyInput;
  ownScore: number;
  opponentScore: number;
  scoreDelta: number;
  round: number;
  ownGems: number;
  opponentGems: number;
  ownHandCount: number;
  opponentHandCount: number;
  ownDeckCount: number;
  opponentDeckCount: number;
  ownDiscardCount: number;
  opponentDiscardCount: number;
  ownPassed: boolean;
  opponentPassed: boolean;
  currentTurn: SeatId;
  phase: EnginePolicyInput["observation"]["phase"];
  ownHandByCardId: ReadonlyMap<string, SeatCardSummary>;
  publicCardsByCardId: ReadonlyMap<string, SeatCardSummary>;
  promptOptionsById: ReadonlyMap<string, PromptOptionSummary>;
  sourceCountsInHand: ReadonlyMap<string, number>;
  firstCardIdBySource: ReadonlyMap<string, string>;
  passMove: PassMove | null;
  playMoves: readonly PlayCardMove[];
  leaderMoves: readonly UseLeaderMove[];
  promptMoves: readonly ChoosePromptOptionMove[];
  mulliganMoves: readonly ChooseMulliganMove[];
}

const countBySource = (cards: readonly SeatCardSummary[]) => {
  const counts = new Map<string, number>();
  cards.forEach((card) => counts.set(card.sourceId, (counts.get(card.sourceId) ?? 0) + 1));
  return counts;
};

const firstCardIdsBySource = (cards: readonly SeatCardSummary[]) => {
  const map = new Map<string, string>();
  [...cards]
    .sort((left, right) => left.cardId.localeCompare(right.cardId))
    .forEach((card) => {
      if (!map.has(card.sourceId)) {
        map.set(card.sourceId, card.cardId);
      }
    });
  return map;
};

const collectPublicCards = (input: EnginePolicyInput) => {
  const cards = new Map<string, SeatCardSummary>();
  const addCard = (card: SeatCardSummary | null | undefined) => {
    if (card) {
      cards.set(card.cardId, card);
    }
  };

  input.observation.ownHand.forEach(addCard);
  input.observation.boardRows.forEach((row) => {
    row.units.forEach(addCard);
    addCard(row.horn);
  });
  input.observation.weather.forEach(addCard);
  input.observation.pendingPrompt?.revealedCards?.forEach(addCard);
  (input.observation.ownDiscard ?? []).forEach(addCard);
  input.observation.pendingPrompt?.options.forEach((option) => {
    addCard(option.targetCard);
    option.targetCards?.forEach(addCard);
  });

  return cards;
};

export const buildLegalHeuristicV1Features = (input: EnginePolicyInput): LegalHeuristicV1Features => {
  const { observation } = input;
  const ownHandByCardId = new Map(observation.ownHand.map((card) => [card.cardId, card]));
  const promptOptionsById = new Map(
    observation.pendingPrompt?.options.map((option) => [option.optionId, option]) ?? [],
  );

  return {
    input,
    ownScore: observation.score.totalBySeat[input.seatId],
    opponentScore: observation.score.totalBySeat[observation.opponentSeatId],
    scoreDelta: observation.score.totalBySeat[input.seatId] - observation.score.totalBySeat[observation.opponentSeatId],
    round: observation.round,
    ownGems: observation.ownGems,
    opponentGems: observation.opponentGems,
    ownHandCount: observation.ownHand.length,
    opponentHandCount: observation.opponentHandCount,
    ownDeckCount: observation.ownDeckCount,
    opponentDeckCount: observation.opponentDeckCount,
    ownDiscardCount: observation.ownDiscardCount,
    opponentDiscardCount: observation.opponentDiscardCount,
    ownPassed: observation.ownPassed,
    opponentPassed: observation.opponentPassed,
    currentTurn: observation.currentTurn,
    phase: observation.phase,
    ownHandByCardId,
    publicCardsByCardId: collectPublicCards(input),
    promptOptionsById,
    sourceCountsInHand: countBySource(observation.ownHand),
    firstCardIdBySource: firstCardIdsBySource(observation.ownHand),
    passMove: input.legalMoves.find((move): move is PassMove => move.kind === "pass") ?? null,
    playMoves: input.legalMoves.filter((move): move is PlayCardMove => move.kind === "play_card"),
    leaderMoves: input.legalMoves.filter((move): move is UseLeaderMove => move.kind === "use_leader"),
    promptMoves: input.legalMoves.filter(
      (move): move is ChoosePromptOptionMove => move.kind === "choose_prompt_option",
    ),
    mulliganMoves: input.legalMoves.filter((move): move is ChooseMulliganMove => move.kind === "choose_mulligan"),
  };
};

const optionForMove = (features: LegalHeuristicV1Features, move: ChoosePromptOptionMove) =>
  features.promptOptionsById.get(move.optionId);

const cardStrategicValue = (card: SeatCardSummary | undefined, options?: { includeMedicAbilityBonus?: boolean }) => {
  if (!card) {
    return 0;
  }

  let score = card.printedStrength * 10;
  if (card.kind === "hero") score += 95;
  if (card.kind === "unit") score += 25;
  if (card.kind === "special") score += 20;
  if (card.deckLimit === 1) score += 8;

  const includeMedicAbilityBonus = options?.includeMedicAbilityBonus ?? true;
  card.abilities.forEach((ability) => {
    switch (ability) {
      case "spy":
        score += 520;
        break;
      case "medic":
        if (includeMedicAbilityBonus) {
          score += 260;
        }
        break;
      case "muster":
        score += 210;
        break;
      case "muster_roach":
        score += 150;
        break;
      case "tight_bond":
        score += 95;
        break;
      case "morale_boost":
        score += 80;
        break;
      case "scorch":
      case "scorch_close":
      case "scorch_range":
      case "scorch_siege":
        score += 180;
        break;
      case "commanders_horn":
        score += 150;
        break;
      case "decoy":
        score += 130;
        break;
      case "clear_weather":
        score += 75;
        break;
      case "frost":
      case "fog":
      case "rain":
      case "skellige_storm":
        score += 55;
        break;
      case "agile":
      case "avenger":
      case "berserker":
      case "summon":
      case "mardroeme":
        score += 45;
        break;
      case "none":
        break;
    }
  });

  return score;
};

const standaloneMulliganValue = (card: SeatCardSummary) => {
  const targetPenalty = card.kind === "hero" ? 80 : 0;
  return cardStrategicValue(card) + targetPenalty;
};

// cFp27: Shared mulligan candidate ranker used by both chooseMulliganMove
// and the mulligan diagnostics helper.
export type LegalHeuristicV1MulliganReasonKind =
  | "linked_roach_payload"
  | "one_way_linked_payload"
  | "same_source_muster_duplicate"
  | "low_standalone_unit";

export interface LegalHeuristicV1MulliganCandidateRank {
  readonly move: ChooseMulliganMove;
  readonly card: SeatCardSummary;
  readonly reasonKind: LegalHeuristicV1MulliganReasonKind;
  readonly confidence: number;
  readonly standaloneValue: number;
}

const STRATEGIC_ABILITIES = new Set<CatalogAbilityId>([
  "spy",
  "medic",
  "muster",
  "muster_roach",
  "tight_bond",
  "morale_boost",
  "agile",
  "berserker",
  "mardroeme",
  "summon",
  "avenger",
  "scorch",
  "scorch_close",
  "scorch_range",
  "scorch_siege",
  "commanders_horn",
  "decoy",
  "clear_weather",
  "frost",
  "fog",
  "rain",
  "skellige_storm",
]);

const hasStrategicAbility = (card: SeatCardSummary) =>
  card.abilities.some((ability) => STRATEGIC_ABILITIES.has(ability));

const isMusterCallerForRedraw = (card: SeatCardSummary) =>
  isMusterCaller(card) &&
  (hasAbility(card, "muster_roach") ||
    (hasAbility(card, "muster") && card.linkedSourceIds?.some((sid) => sid !== card.sourceId) === true));

const rankMulliganCandidates = (features: LegalHeuristicV1Features): readonly LegalHeuristicV1MulliganCandidateRank[] => {
  const candidates: LegalHeuristicV1MulliganCandidateRank[] = [];

  for (const move of features.mulliganMoves) {
    if (move.cardIds.length !== 1) {
      continue;
    }
    const card = features.ownHandByCardId.get(move.cardIds[0]);
    if (!card) {
      continue;
    }

    const linkedCallers = features.input.observation.ownHand.filter(
      (candidate) =>
        candidate.cardId !== card.cardId &&
        isMusterCaller(candidate) &&
        Boolean(candidate.linkedSourceIds?.includes(card.sourceId)),
    );
    const roachCaller = linkedCallers.some((candidate) => hasAbility(candidate, "muster_roach"));
    const oneWayCaller = linkedCallers.some((candidate) => candidate.sourceId !== card.sourceId);

    // Skip heroes unless they are explicit linked summoned targets
    if (card.kind === "hero" && !oneWayCaller && !roachCaller) {
      continue;
    }

    // Skip special/weather cards
    if (card.kind === "special") {
      continue;
    }
    const sameSourceMuster =
      hasAbility(card, "muster") &&
      Boolean(card.linkedSourceIds?.includes(card.sourceId)) &&
      (features.sourceCountsInHand.get(card.sourceId) ?? 0) > 1 &&
      features.firstCardIdBySource.get(card.sourceId) !== card.cardId;

    let confidence = 0;
    let reasonKind: LegalHeuristicV1MulliganReasonKind | null = null;

    // Existing linked/Muster logic preserved
    if (card.sourceId === "neutral.roach" && roachCaller) {
      confidence = 400;
      reasonKind = "linked_roach_payload";
    } else if (oneWayCaller) {
      confidence = 320;
      reasonKind = "one_way_linked_payload";
    } else if (sameSourceMuster) {
      confidence = 240;
      reasonKind = "same_source_muster_duplicate";
    }

    // cFp27: New low_standalone_unit category
    if (confidence <= 0 && reasonKind === null) {
      const isLowStandalone =
        card.kind === "unit" &&
        card.printedStrength <= 3 &&
        !hasStrategicAbility(card) &&
        !isMusterCallerForRedraw(card);

      if (isLowStandalone) {
        confidence = 80;
        reasonKind = "low_standalone_unit";
      }
    }

    if (confidence > 0 && reasonKind !== null) {
      candidates.push({
        move,
        card,
        reasonKind,
        confidence,
        standaloneValue: standaloneMulliganValue(card),
      });
    }
  }

  return candidates.sort((left, right) => {
    const confidenceDelta = right.confidence - left.confidence;
    const valueDelta = left.standaloneValue - right.standaloneValue;
    const strengthDelta = left.card.printedStrength - right.card.printedStrength;
    return confidenceDelta || valueDelta || strengthDelta || byMoveId(left.move, right.move);
  });
};

/**
 * Builds a diagnostic summary for mulligan decisions, hidden-info safe.
 */
export const buildMulliganAnalysis = (
  features: LegalHeuristicV1Features,
): {
  candidates: readonly LegalHeuristicV1MulliganCandidateRank[];
  selectedMove: ChooseMulliganMove | null;
} => {
  const candidates = rankMulliganCandidates(features);
  const keepMove = features.mulliganMoves.find((move) => move.cardIds.length === 0) ?? null;
  const selectedMove = candidates.length > 0 ? candidates[0].move : (keepMove ?? features.mulliganMoves.slice().sort(byMoveId)[0] ?? null);
  return { candidates, selectedMove };
};

export const chooseMulliganMove = (features: LegalHeuristicV1Features) => {
  const { selectedMove } = buildMulliganAnalysis(features);
  return selectedMove;
};

const optionCardsForMove = (features: LegalHeuristicV1Features, move: ChoosePromptOptionMove) => {
  const option = optionForMove(features, move);
  if (option?.targetCards) {
    return [...option.targetCards];
  }
  if (option?.targetCard) {
    return [option.targetCard];
  }
  if (move.target.kind === "card_instance_set") {
    return move.target.cardIds.flatMap((cardId) => {
      const card = features.ownHandByCardId.get(cardId);
      return card ? [card] : [];
    });
  }
  if (move.target.kind === "card_instance" || move.target.kind === "deck_card_instance") {
    const card = features.publicCardsByCardId.get(move.target.cardId);
    return card ? [card] : [];
  }
  return [];
};

const promptOptionFallbackStrength = (features: LegalHeuristicV1Features, move: ChoosePromptOptionMove) =>
  optionForMove(features, move)?.targetStrength ?? 0;

const promptCardValue = (card: SeatCardSummary | undefined, move: ChoosePromptOptionMove) => {
  if (!card) {
    return 0;
  }
  let value = cardStrategicValue(card);
  if (move.metadata.abilityId === "medic" && card.kind === "hero") {
    value -= 120;
  }
  if (move.target.kind === "card_instance" && move.target.row && card.rows.includes(move.target.row)) {
    value += 30;
  }
  return value;
};

const chooseHighestPromptValue = (features: LegalHeuristicV1Features, moves: readonly ChoosePromptOptionMove[]) =>
  [...moves].sort((left, right) => {
    const leftCards = optionCardsForMove(features, left);
    const rightCards = optionCardsForMove(features, right);
    const leftScore =
      leftCards.reduce((sum, card) => sum + promptCardValue(card, left), 0) ||
      promptOptionFallbackStrength(features, left) * 10;
    const rightScore =
      rightCards.reduce((sum, card) => sum + promptCardValue(card, right), 0) ||
      promptOptionFallbackStrength(features, right) * 10;
    const scoreDelta = rightScore - leftScore;
    const strengthDelta = promptOptionFallbackStrength(features, right) - promptOptionFallbackStrength(features, left);
    return scoreDelta || strengthDelta || byMoveId(left, right);
  })[0] ?? null;

const chooseLowestPromptSetValue = (features: LegalHeuristicV1Features, moves: readonly ChoosePromptOptionMove[]) =>
  [...moves].sort((left, right) => {
    const leftCards = optionCardsForMove(features, left);
    const rightCards = optionCardsForMove(features, right);
    const leftScore =
      leftCards.reduce((sum, card) => sum + cardStrategicValue(card), 0) ||
      promptOptionFallbackStrength(features, left) * 10;
    const rightScore =
      rightCards.reduce((sum, card) => sum + cardStrategicValue(card), 0) ||
      promptOptionFallbackStrength(features, right) * 10;
    const scoreDelta = leftScore - rightScore;
    const cardCountDelta = rightCards.length - leftCards.length;
    return scoreDelta || cardCountDelta || byMoveId(left, right);
  })[0] ?? null;

export const choosePromptMove = (features: LegalHeuristicV1Features) => {
  const moves = features.promptMoves;
  if (moves.length === 0) {
    return null;
  }

  const cancelLeader = moves.find(
    (move) =>
      move.metadata.abilityId === "cancel_leader" &&
      (move.optionId === "cancel-leader:cancel" || move.optionId.includes(":cancel")),
  );
  if (cancelLeader) {
    return cancelLeader;
  }

  const abilityId = moves[0].metadata.abilityId;
  if (abilityId === "look_three_cards") {
    return moves[0];
  }

  if (abilityId === "scoiatael_choose_first") {
    const result = buildScoiataelFirstTurnChoiceDecision(features);
    return result.selectedMove ?? null;
  }

  if (abilityId === "discard_two_draw_one_from_deck") {
    const discardMoves = moves.filter((move) => move.target.kind === "card_instance_set");
    if (discardMoves.length > 0) {
      return chooseLowestPromptSetValue(features, discardMoves);
    }
    const deckMoves = moves.filter((move) => move.target.kind === "deck_card_instance");
    if (deckMoves.length > 0) {
      return chooseHighestPromptValue(features, deckMoves);
    }
  }

  if (abilityId === "medic" || abilityId === "restore_discard_to_hand" || abilityId === "draw_opponent_discard") {
    return chooseHighestPromptValue(features, moves);
  }

  return [...moves].sort((left, right) => {
    const strengthDelta = promptOptionFallbackStrength(features, right) - promptOptionFallbackStrength(features, left);
    return strengthDelta || byMoveId(left, right);
  })[0] ?? null;
};

const boardRow = (features: LegalHeuristicV1Features, seatId: SeatId, row: CatalogRow): SeatBoardRowSummary | null =>
  features.input.observation.boardRows.find((entry) => entry.seatId === seatId && entry.row === row) ?? null;

const weatherPenaltyForRows = (
  features: LegalHeuristicV1Features,
  seatId: SeatId,
  rows: readonly CatalogRow[],
) =>
  rows.reduce((sum, row) => {
    const summary = boardRow(features, seatId, row);
    if (!summary) {
      return sum;
    }
    return (
      sum +
      summary.units.reduce((rowSum, card) => {
        if (card.kind === "hero") {
          return rowSum;
        }
        return rowSum + Math.max(0, card.printedStrength - 1);
      }, 0)
    );
  }, 0);

const currentWeatherPenalty = (features: LegalHeuristicV1Features, seatId: SeatId) =>
  features.input.observation.score.cards
    .filter((entry) => entry.seatId === seatId)
    .reduce((sum, entry) => sum + Math.max(0, entry.afterTightBond - entry.afterWeather), 0);

const weatherSwingForRows = (features: LegalHeuristicV1Features, rows: readonly CatalogRow[]) =>
  weatherPenaltyForRows(features, features.input.observation.opponentSeatId, rows) -
  weatherPenaltyForRows(features, features.input.seatId, rows);

const clearWeatherSwing = (features: LegalHeuristicV1Features) =>
  currentWeatherPenalty(features, features.input.seatId) -
  currentWeatherPenalty(features, features.input.observation.opponentSeatId);

const weatherRowsForSourceId = (sourceId: string | undefined): readonly CatalogRow[] => {
  if (!sourceId) return [];
  if (sourceId.includes("biting-frost") || sourceId.includes("frost")) return ["close"];
  if (sourceId.includes("impenetrable-fog") || sourceId.includes("fog")) return ["ranged"];
  if (sourceId.includes("torrential-rain") || sourceId.includes("rain")) return ["siege"];
  if (sourceId.includes("skellige-storm") || sourceId.includes("storm")) return ["ranged", "siege"];
  return [];
};

const rowsForWeatherCard = (card: SeatCardSummary | undefined) => {
  if (!card) {
    return [];
  }
  return card.abilities.flatMap((ability) => WEATHER_ROWS_BY_ABILITY[ability] ?? []);
};

const scorchSwing = (features: LegalHeuristicV1Features, rows: readonly CatalogRow[] | null = null) => {
  const eligible = features.input.observation.score.cards.filter(
    (entry) => entry.eligibleForScorch && (!rows || rows.includes(entry.row)),
  );
  const maxStrength = Math.max(0, ...eligible.map((entry) => entry.finalStrength));
  if (maxStrength <= 0) {
    return 0;
  }
  return eligible
    .filter((entry) => entry.finalStrength === maxStrength)
    .reduce((sum, entry) => sum + (entry.seatId === features.input.seatId ? -entry.finalStrength : entry.finalStrength), 0);
};

const targetCardForMove = (features: LegalHeuristicV1Features, move: PlayCardMove) => {
  if (move.target.kind !== "card_instance") {
    return undefined;
  }
  return features.publicCardsByCardId.get(move.target.cardId);
};

const ownRowTotal = (features: LegalHeuristicV1Features, row: CatalogRow) =>
  features.input.observation.score.rowTotalsBySeat[features.input.seatId][row];

const linkedHandTempoForCard = (features: LegalHeuristicV1Features, card: SeatCardSummary) => {
  if (!isMusterCaller(card)) {
    return 0;
  }
  const linkedSourceIds = new Set(card.linkedSourceIds ?? []);
  return features.input.observation.ownHand
    .filter((candidate) => candidate.cardId !== card.cardId && linkedSourceIds.has(candidate.sourceId))
    .reduce((sum, candidate) => sum + candidate.printedStrength, 0);
};

const estimateImmediateTempo = (features: LegalHeuristicV1Features, move: PlayCardMove | UseLeaderMove, _cardOverride?: SeatCardSummary) => {
  if (move.kind === "use_leader") {
    return estimateLeaderTempo(features, move);
  }

  const card = _cardOverride ?? features.ownHandByCardId.get(move.sourceCardId);
  if (!card) {
    return 0;
  }

  if (move.target.kind === "board_row") {
    // cFp30: Use weather-adjusted effective strength for board_row placement
    const effectiveStrength = effectivePlacedStrengthForPolicy(features, card, move.target);
    const signedStrength = move.target.side === "opponent" ? -effectiveStrength : effectiveStrength;
    const abilityRows = card.abilities.flatMap((ability) => SCORCH_ROWS_BY_ABILITY[ability] ?? []);
    const scorchBonus = abilityRows.length > 0 ? scorchSwing(features, abilityRows) : 0;
    const linkedHandTempo = move.target.side === "own" ? linkedHandTempoForCard(features, card) : 0;
    // cFp29: Medic revive tempo estimate for own-side Medic source plays
    const medicReviveTempo = move.target.side === "own" && isMedicSource(card)
      ? medicReviveTempoForSource(features, card)
      : 0;
    return signedStrength + scorchBonus + linkedHandTempo + medicReviveTempo;
  }

  if (move.target.kind === "row_horn") {
    return Math.max(0, ownRowTotal(features, move.target.row));
  }

  if (move.target.kind === "weather") {
    if (hasAbility(card, "clear_weather")) {
      return clearWeatherSwing(features);
    }
    return weatherSwingForRows(features, rowsForWeatherCard(card));
  }

  if (move.target.kind === "card_instance") {
    const target = targetCardForMove(features, move);
    if (hasAbility(card, "decoy")) {
      return -(target?.printedStrength ?? 0);
    }
    return 0;
  }

  if (move.target.kind === "none" && hasAbility(card, "scorch")) {
    return scorchSwing(features);
  }

  return 0;
};

function estimateLeaderTempo(features: LegalHeuristicV1Features, move: UseLeaderMove) {
  switch (move.metadata.ability) {
    case "clear_weather":
      return clearWeatherSwing(features);
    case "play_frost":
      return weatherSwingForRows(features, ["close"]);
    case "play_fog":
      return weatherSwingForRows(features, ["ranged"]);
    case "play_rain":
      return weatherSwingForRows(features, ["siege"]);
    case "play_any_weather":
      return weatherSwingForRows(features, weatherRowsForSourceId(move.metadata.targetSourceId));
    case "scorch_range":
    case "scorch_siege":
      return move.metadata.targetSeatId === features.input.observation.opponentSeatId
        ? Math.max(0, move.metadata.rowTotal ?? 0)
        : 0;
    case "optimize_agile_rows":
      return Math.max(0, (move.metadata.bestScore ?? 0) - (move.metadata.currentScore ?? 0));
    default:
      return 0;
  }
}

export const scoreWeatherPlayMove = (features: LegalHeuristicV1Features, card: SeatCardSummary) => {
  if (hasAbility(card, "clear_weather")) {
    const swing = clearWeatherSwing(features);
    return swing > 0 ? 160 + swing * 20 : -260;
  }

  const rows = rowsForWeatherCard(card);
  const swing = weatherSwingForRows(features, rows);
  return swing > 0 ? 170 + swing * 25 : -260 + swing * 20;
};

export const scoreScorchMove = (features: LegalHeuristicV1Features, card: SeatCardSummary) => {
  const rows = card.abilities.flatMap((ability) => SCORCH_ROWS_BY_ABILITY[ability] ?? []);
  const swing = scorchSwing(features, rows.length > 0 ? rows : null);
  return swing > 0 ? 230 + swing * 20 : -320 + swing * 20;
};

export const scoreDecoyMove = (features: LegalHeuristicV1Features, move: PlayCardMove) => {
  const target = targetCardForMove(features, move);
  if (!target) {
    return -120;
  }
  let score = -80 - target.printedStrength * 8;
  if (hasAbility(target, "spy")) score += 520;
  if (hasAbility(target, "medic")) score += 260;
  if (hasAbility(target, "muster") || hasAbility(target, "muster_roach")) score += 190;
  if (target.printedStrength >= 8) score += 90;
  return score;
};

export const scorePlayMove = (features: LegalHeuristicV1Features, move: PlayCardMove) => {
  const card = features.ownHandByCardId.get(move.sourceCardId);
  if (!card) {
    return -500;
  }

  if (isWeatherCard(card)) {
    return scoreWeatherPlayMove(features, card);
  }

  if (hasAbility(card, "decoy")) {
    return scoreDecoyMove(features, move);
  }

  if (isScorchCard(card)) {
    return scoreScorchMove(features, card);
  }

  if (hasAbility(card, "commanders_horn") && move.target.kind === "row_horn") {
    const rowTotal = ownRowTotal(features, move.target.row);
    return rowTotal > 0 ? 140 + rowTotal * 16 : -180;
  }

  const tempo = estimateImmediateTempo(features, move, card);
  let score = cardStrategicValue(card, { includeMedicAbilityBonus: false }) + tempo * 14;
  // cFp29: Contextual Medic source utility replaces flat +260 bonus
  if (isMedicSource(card)) {
    score += medicSourceUtilityScore(features, card);
  }
  if (hasAbility(card, "spy")) {
    score += features.round === 1 && features.ownGems > 1 ? 220 : 70;
    if (features.opponentPassed) {
      score -= 450;
    }
  }
  if (isMusterCaller(card)) {
    const linkedHandTargets = features.input.observation.ownHand.filter(
      (candidate) => candidate.cardId !== card.cardId && Boolean(card.linkedSourceIds?.includes(candidate.sourceId)),
    ).length;
    score += linkedHandTargets * 140;
  }
  if (features.opponentPassed) {
    const overkill = Math.max(0, features.ownScore + tempo - features.opponentScore - 1);
    score -= overkill * 18;
  }
  if (features.ownHandCount < features.opponentHandCount && features.scoreDelta > 8) {
    score -= 80;
  }
  return score;
};

export const scoreLeaderMove = (features: LegalHeuristicV1Features, move: UseLeaderMove) => {
  const tempo = estimateLeaderTempo(features, move);
  switch (move.metadata.ability) {
    case "clear_weather":
    case "play_frost":
    case "play_fog":
    case "play_rain":
    case "play_any_weather":
      return tempo > 0 ? 190 + tempo * 24 : -280 + tempo * 20;
    case "scorch_range":
    case "scorch_siege":
      return tempo > 0 ? 220 + tempo * 18 + (move.metadata.targetCount ?? 0) * 40 : -260;
    case "restore_discard_to_hand":
    case "draw_opponent_discard":
      return (move.metadata.targetCount ?? 0) > 0 ? 145 + (move.metadata.targetCount ?? 0) * 18 : -160;
    case "discard_two_draw_one_from_deck":
      return (move.metadata.handCount ?? 0) >= 2 && (move.metadata.deckCount ?? 0) > 0 ? 170 : -180;
    case "look_three_cards":
      return (move.metadata.opponentHandCount ?? features.opponentHandCount) > 0 ? 120 : -160;
    case "cancel_leader":
      return !features.input.observation.opponentLeader.used ? 155 : -180;
    case "shuffle_discards_into_decks":
      return features.ownDeckCount <= 2 && features.ownDiscardCount > 3 ? 90 : -120;
    case "optimize_agile_rows":
      return tempo > 0 ? 130 + tempo * 20 : -130;
    default:
      return -120;
  }
};

export const scoreMove = (features: LegalHeuristicV1Features, move: PlayCardMove | UseLeaderMove) =>
  move.kind === "play_card" ? scorePlayMove(features, move) : scoreLeaderMove(features, move);

const bestUsefulMove = (features: LegalHeuristicV1Features) => {
  const candidates = [...features.playMoves, ...features.leaderMoves];
  if (candidates.length === 0) {
    return null;
  }

  const best = candidates.sort((left, right) => {
    const scoreDelta = scoreMove(features, right) - scoreMove(features, left);
    return scoreDelta || byMoveId(left, right);
  })[0];

  return scoreMove(features, best) >= MIN_USEFUL_MOVE_SCORE ? best : null;
};

export const uniqueCardTempoUpperBound = (features: LegalHeuristicV1Features) => {
  const bestTempoByCard = new Map<string, number>();
  features.playMoves.forEach((move) => {
    const tempo = Math.max(0, estimateImmediateTempo(features, move));
    bestTempoByCard.set(move.sourceCardId, Math.max(bestTempoByCard.get(move.sourceCardId) ?? 0, tempo));
  });
  const leaderTempo = Math.max(0, ...features.leaderMoves.map((move) => estimateLeaderTempo(features, move)));
  return [...bestTempoByCard.values()].reduce((sum, tempo) => sum + tempo, 0) + leaderTempo;
};

// ---------------------------------------------------------------------------
// cFp28: Scored candidates for hand-shape analysis
// ---------------------------------------------------------------------------

export interface ScoredMove {
  readonly tempo: number;
  readonly isUnitMove: boolean;
  readonly score: number;
}

/**
 * Builds scored candidate data from features, reused by both the hand-shape
 * analysis and the scoring logic.  Does not re-score — delegates to
 * scoreMove which already exists.
 */
export const buildScoredCandidates = (
  features: LegalHeuristicV1Features,
): readonly ScoredMove[] => {
  const results: ScoredMove[] = [];

  for (const move of features.playMoves) {
    const card = features.ownHandByCardId.get(move.sourceCardId);
    const isUnitMove = card?.kind === "unit" || card?.kind === "hero";
    const tempo = estimateImmediateTempo(features, move);
    const score = scoreMove(features, move);
    results.push({ tempo, isUnitMove, score });
  }

  for (const move of features.leaderMoves) {
    const tempo = estimateLeaderTempo(features, move);
    const score = scoreMove(features, move);
    results.push({ tempo, isUnitMove: false, score });
  }

  return results;
};

/**
 * cFp28: Build a hidden-info-safe hand-shape analysis from the current
 * features.  Uses existing card kind classification and scored-move data.
 */
export const buildLegalHeuristicV1HandShapeAnalysis = (
  features: LegalHeuristicV1Features,
): import("./decisionTrace").AiDecisionHandShapeAnalysis => {
  const ownHand = features.input.observation.ownHand;
  const scoredCandidates = buildScoredCandidates(features);

  return buildAiDecisionHandShapeAnalysis(
    ownHand,
    scoredCandidates,
  );
};

// ---------------------------------------------------------------------------
// cFp31: Round investment analysis
// ---------------------------------------------------------------------------

const isSpyCard = (card: SeatCardSummary | undefined) => hasAbility(card, "spy");

// cFp31 repair: Shared round-investment decision helper used by both policy
// and explanation to ensure parity.
export interface LegalHeuristicV1RoundInvestmentDecision {
  readonly candidate: PlayCardMove | UseLeaderMove | null;
  readonly analysis: import("./decisionTrace").AiDecisionRoundInvestmentAnalysis | null;
  readonly shouldPass: boolean;
}

export const buildLegalHeuristicV1RoundInvestmentDecision = (
  features: LegalHeuristicV1Features,
): LegalHeuristicV1RoundInvestmentDecision => {
  const candidate = bestUsefulMove(features);
  if (!candidate) {
    return { candidate: null, analysis: null, shouldPass: false };
  }
  const handShape = buildLegalHeuristicV1HandShapeAnalysis(features);
  const analysis = buildLegalHeuristicV1RoundInvestmentAnalysis(features, candidate, handShape);
  return {
    candidate,
    analysis,
    shouldPass: shouldPassForRoundInvestment(features, candidate),
  };
};

/**
 * cFp31: Build round-investment analysis from features and selected move.
 * Uses only public observation data and scored-move metadata — never card
 * identities, source IDs, instance IDs, or ability arrays.
 */
export const buildLegalHeuristicV1RoundInvestmentAnalysis = (
  features: LegalHeuristicV1Features,
  selectedMove: PlayCardMove | UseLeaderMove | null,
  handShape: import("./decisionTrace").AiDecisionHandShapeAnalysis,
): import("./decisionTrace").AiDecisionRoundInvestmentAnalysis => {
  const obs = features.input.observation;

  // Count own board investment
  let ownBoardUnitCount = 0;
  let ownBoardHeroCount = 0;
  let ownBoardHornCount = 0;
  for (const row of obs.boardRows) {
    if (row.seatId === features.input.seatId) {
      for (const card of row.units) {
        if (card.kind === "hero") ownBoardHeroCount++;
        else if (card.kind === "unit") ownBoardUnitCount++;
      }
      if (row.horn) ownBoardHornCount++;
    }
  }
  const ownBoardCardCount = ownBoardUnitCount + ownBoardHeroCount + ownBoardHornCount;

  // cFp31 repair Fix 3: Count future positive unit/hero by unique sourceCardId
  // Agile or multi-row cards can create multiple positive move options from the
  // same card instance. We key by sourceCardId to avoid inflating the count.
  const positiveUnitSourceCardIds = new Set<string>();
  let positiveFutureNonUnitMoveCount = 0;
  for (const move of features.playMoves) {
    const card = features.ownHandByCardId.get(move.sourceCardId);
    const score = scoreMove(features, move);
    if (score > 0) {
      if (card?.kind === "unit" || card?.kind === "hero") {
        positiveUnitSourceCardIds.add(move.sourceCardId);
      }
    }
  }
  // Count positive non-unit moves from leader moves and non-unit play moves
  for (const move of features.playMoves) {
    const card = features.ownHandByCardId.get(move.sourceCardId);
    const score = scoreMove(features, move);
    if (score > 0 && card && card.kind !== "unit" && card.kind !== "hero") {
      positiveFutureNonUnitMoveCount++;
    }
  }
  for (const move of features.leaderMoves) {
    if (scoreMove(features, move) > 0) {
      positiveFutureNonUnitMoveCount++;
    }
  }
  const positiveFutureUnitMoveCount = positiveUnitSourceCardIds.size;

  const futureRoundHandQuality = handShape.futureRoundHandQuality;
  const currentRoundHandCount = features.ownHandCount;
  const nonEliminationRound = features.ownGems > 1;

  // Analyze selected move
  const selectedMoveSpendsHandCard = selectedMove?.kind === "play_card";
  const selectedMoveIsCardAdvantage = selectedMove?.kind === "play_card"
    ? isSpyCard(features.ownHandByCardId.get(selectedMove.sourceCardId))
    : false;

  // cFp31 repair Fix 2: Estimate hand count after selected move
  // Spy draws min(2, ownDeckCount) cards
  let estimatedHandCountAfterSelectedMove = currentRoundHandCount;
  if (selectedMove?.kind === "play_card") {
    estimatedHandCountAfterSelectedMove = currentRoundHandCount - 1;
    if (isSpyCard(features.ownHandByCardId.get(selectedMove.sourceCardId))) {
      estimatedHandCountAfterSelectedMove += Math.min(2, features.ownDeckCount);
    }
  }

  // Would leaving no positive unit move?
  const selectedMoveCard = selectedMove?.kind === "play_card"
    ? features.ownHandByCardId.get(selectedMove.sourceCardId)
    : undefined;
  const selectedMoveIsPositiveUnit = selectedMove?.kind === "play_card"
    ? (selectedMoveCard?.kind === "unit" || selectedMoveCard?.kind === "hero")
    : false;

  // cFp31 repair Fix 3: Use unique source card IDs for the "would leave no positive unit" check
  let selectedMoveWouldLeaveNoPositiveUnitMove = false;
  if (selectedMoveIsPositiveUnit && selectedMove && selectedMove.kind === "play_card") {
    const remaining = new Set(positiveUnitSourceCardIds);
    remaining.delete(selectedMove.sourceCardId);
    selectedMoveWouldLeaveNoPositiveUnitMove = remaining.size === 0;
  } else if (!selectedMoveIsPositiveUnit) {
    selectedMoveWouldLeaveNoPositiveUnitMove = positiveUnitSourceCardIds.size === 0;
  }

  // Would leave no unit tempo card?
  const unitTempoCardCount = handShape.unitCardCount + handShape.heroCardCount;
  const selectedMoveSpendsUnitTempo = selectedMoveIsPositiveUnit;
  const selectedMoveWouldLeaveNoUnitTempoCard = selectedMoveSpendsUnitTempo
    ? unitTempoCardCount <= 1
    : unitTempoCardCount === 0;

  // Determine risk
  let risk: import("./decisionTrace").AiDecisionRoundInvestmentRisk = "none";
  if (estimatedHandCountAfterSelectedMove <= 1 && selectedMoveWouldLeaveNoPositiveUnitMove && nonEliminationRound) {
    risk = "critical";
  } else if (futureRoundHandQuality === "poor" || futureRoundHandQuality === "thin") {
    risk = estimatedHandCountAfterSelectedMove <= 2 ? "high" : "watch";
  }

  // Determine recommendation
  let recommendation: import("./decisionTrace").AiDecisionRoundInvestmentRecommendation = "continue";

  // cFp32: Compute pass diagnostics for catch-up status
  const passDiags = buildLegalHeuristicV1PassDecisionDiagnostics(features);
  const hasSingleMoveCatchUp = passDiags.hasSingleMoveCatchUp;
  const upperBoundCanWin = passDiags.policyUpperBoundCanWinRound;

  // cFp32: Determine catch-up status for diagnostics
  let catchUpStatus: import("./decisionTrace").AiDecisionRoundCatchUpStatus;
  if (hasSingleMoveCatchUp) {
    catchUpStatus = "single_move_catch_up";
  } else if (upperBoundCanWin) {
    catchUpStatus = "upper_bound_possible";
  } else {
    catchUpStatus = "upper_bound_impossible";
  }

  // cFp32: Determine stop-loss recommendation and reason
  let stopLossRecommended = false;
  let stopLossReason: import("./decisionTrace").AiDecisionRoundStopLossReason = "none";

  if (features.ownGems > 1 && selectedMoveSpendsHandCard && !selectedMoveIsCardAdvantage && features.scoreDelta < 0 && !hasSingleMoveCatchUp && upperBoundCanWin === false) {
    // cFp32: Stop-loss gate — behind, no clean catch-up, upper-bound impossible
    let reason: import("./decisionTrace").AiDecisionRoundStopLossReason = "upper_bound_impossible";

    // Check if selected move is a low-value Medic
    if (selectedMove?.kind === "play_card") {
      const selectedCard = features.ownHandByCardId.get(selectedMove.sourceCardId);
      if (selectedCard && isMedicSource(selectedCard)) {
        const medicInfo = medicSourceUtility(features, selectedCard);
        if (medicInfo.bestReviveValueBucket === "none" || medicInfo.bestReviveValueBucket === "weak" || medicInfo.bestReviveValueBucket === "medium") {
          reason = "medium_medic_target";
        }
      } else if (selectedCard?.kind === "unit" || selectedCard?.kind === "hero") {
        // Check if the selected move places into a weathered row with low effective strength.
        // Evaluate the selected move's actual target row, not another row option for the same card.
        if (selectedMove.target.kind === "board_row" && isRowWeatheredForPolicy(features, selectedMove.target.row)) {
          const eff = effectivePlacedStrengthForPolicy(features, selectedCard, selectedMove.target);
          if (eff <= 3) {
            reason = "weathered_low_tempo";
          }
        }
      }
    }

    // Apply stop-loss when hand is scarce or move burns last useful unit
    const lowHand = currentRoundHandCount <= 4;
    const burnsLastUnit = selectedMoveWouldLeaveNoPositiveUnitMove || selectedMoveWouldLeaveNoUnitTempoCard;
    if (lowHand || burnsLastUnit) {
      stopLossRecommended = true;
      stopLossReason = reason;
      recommendation = "sacrifice_round";
      if (risk === "none") {
        risk = "high";
      }
    }
  }

  // Standard recommendation logic (stop-loss above can already set recommendation)
  if (recommendation === "continue") {
    if (features.ownGems <= 1) {
      // Last gem: always fight (unless catch-up impossible — handled elsewhere)
      recommendation = "fight_last_gem";
    } else if (selectedMoveIsCardAdvantage) {
      // Card-advantage moves are always worth playing
      recommendation = "continue";
    } else if (risk === "critical") {
      recommendation = features.scoreDelta >= -10
        ? "preserve_future_hand"
        : "sacrifice_round";
    } else if (features.scoreDelta >= -10 && selectedMoveWouldLeaveNoPositiveUnitMove) {
      recommendation = "preserve_future_hand";
    } else if (features.scoreDelta < 0 && selectedMoveWouldLeaveNoUnitTempoCard && futureRoundHandQuality !== "healthy") {
      recommendation = "sacrifice_round";
    }
  }

  // cFp36: Calculate round resource budget and pressure
  const roundResourceBudget = buildRoundResourceBudget(
    features,
    futureRoundHandQuality,
    features.round,
    features.scoreDelta,
    features.ownGems,
    features.opponentGems,
    features.ownPassed,
    features.opponentPassed,
  );
  const roundResourcePressure = buildRoundResourcePressure(
    features,
    {
      ownBoardUnitCount,
      ownBoardHeroCount,
      ownBoardNonHeroUnitCount: ownBoardUnitCount,
      ownBoardHornCount,
      ownBoardCardCount,
      positiveFutureUnitMoveCount,
      positiveFutureNonUnitMoveCount,
      futureRoundHandQuality,
      currentRoundHandCount,
      estimatedHandCountAfterSelectedMove,
      selectedMoveSpendsHandCard,
      selectedMoveIsCardAdvantage,
      selectedMoveWouldLeaveNoPositiveUnitMove,
      selectedMoveWouldLeaveNoUnitTempoCard,
      nonEliminationRound,
      scoreDelta: features.scoreDelta,
      risk,
      recommendation,
      catchUpStatus,
      stopLossRecommended,
      stopLossReason,
      roundResourceBudget,
      roundResourcePressure: "none" as const,
      resourceExhaustionRecommended: false,
      resourceExhaustionReason: "none" as const,
    },
    selectedMove,
  );
  const resourceExhaustionDecision = buildRoundResourceExhaustionDecision(
    features,
    {
      ownBoardUnitCount,
      ownBoardHeroCount,
      ownBoardNonHeroUnitCount: ownBoardUnitCount,
      ownBoardHornCount,
      ownBoardCardCount,
      positiveFutureUnitMoveCount,
      positiveFutureNonUnitMoveCount,
      futureRoundHandQuality,
      currentRoundHandCount,
      estimatedHandCountAfterSelectedMove,
      selectedMoveSpendsHandCard,
      selectedMoveIsCardAdvantage,
      selectedMoveWouldLeaveNoPositiveUnitMove,
      selectedMoveWouldLeaveNoUnitTempoCard,
      nonEliminationRound,
      scoreDelta: features.scoreDelta,
      risk,
      recommendation,
      catchUpStatus,
      stopLossRecommended,
      stopLossReason,
      roundResourceBudget,
      roundResourcePressure: "none" as const,
      resourceExhaustionRecommended: false,
      resourceExhaustionReason: "none" as const,
    },
    selectedMove,
    futureRoundHandQuality,
  );
  // resourceExhaustionRecommended is only true when the budget is actually
  // exceeded (budget-exceeded reasons), NOT for exception reasons or
  // round_three_no_budget.
  const resourceExhaustionRecommended =
    resourceExhaustionDecision === "round_budget_exceeded" ||
    resourceExhaustionDecision === "thin_future_hand" ||
    resourceExhaustionDecision === "poor_future_hand" ||
    resourceExhaustionDecision === "last_useful_unit";

  return {
    ownBoardUnitCount,
    ownBoardHeroCount,
    ownBoardNonHeroUnitCount: ownBoardUnitCount,
    ownBoardHornCount,
    ownBoardCardCount,
    positiveFutureUnitMoveCount,
    positiveFutureNonUnitMoveCount,
    futureRoundHandQuality,
    currentRoundHandCount,
    estimatedHandCountAfterSelectedMove,
    selectedMoveSpendsHandCard,
    selectedMoveIsCardAdvantage,
    selectedMoveWouldLeaveNoPositiveUnitMove,
    selectedMoveWouldLeaveNoUnitTempoCard,
    nonEliminationRound,
    scoreDelta: features.scoreDelta,
    risk,
    recommendation,
    catchUpStatus,
    stopLossRecommended,
    stopLossReason,
    roundResourceBudget,
    roundResourcePressure,
    resourceExhaustionRecommended,
    resourceExhaustionReason: resourceExhaustionDecision,
  };
};

/**
 * cFp31: Returns true if the AI should pass (or choose pass) to preserve
 * future hand, even though a useful play exists.
 *
 * Only applies on non-elimination rounds (ownGems > 1), when the opponent
 * has not passed, and pass is legal.
 *
 * The thresholds are deliberately conservative to avoid over-passing in
 * scenarios where the best move is clearly positive.
 */
export const shouldPassForRoundInvestment = (
  features: LegalHeuristicV1Features,
  candidate: PlayCardMove | UseLeaderMove | null,
): boolean => {
  // Must be a non-elimination round
  if (features.ownGems <= 1) return false;
  // Pass must exist
  if (!features.passMove) return false;
  // Opponent must not have passed
  if (features.opponentPassed) return false;
  // Candidate must exist (we're in the choosePlayingMove path)
  if (!candidate) return false;

  // With 1 card left, there's nothing meaningful to preserve — always play it.
  if (features.ownHandCount <= 1) return false;

  // Build analysis to determine risk level
  const handShape = buildLegalHeuristicV1HandShapeAnalysis(features);
  const analysis = buildLegalHeuristicV1RoundInvestmentAnalysis(features, candidate ?? null, handShape);

  // Card-advantage moves (Spy, etc.) — always play them
  if (analysis.selectedMoveIsCardAdvantage) return false;

  // cFp32: Stop-loss gate — behind, no clean catch-up, upper-bound impossible
  // Only suppress play_card candidates; use_leader is free (no hand card spent).
  if (analysis.stopLossRecommended && candidate.kind === "play_card") return true;

  // cFp36: Match-winning exception — if opponent is on last gem and this
  // move wins the match, always play it regardless of resource budget.
  if (candidate?.kind === "play_card" && features.opponentGems <= 1) {
    const tempo = estimateImmediateTempo(features, candidate);
    const minScore = minimumScoreToWinRound(features);
    if (features.ownScore + tempo >= minScore) {
      return false; // wins the match — play it
    }
  }

  // cFp36: Cheap single-move catch-up exception — if the candidate catches
  // up with small overkill and doesn't leave no future unit tempo, allow it.
  if (candidate?.kind === "play_card" && features.scoreDelta < 0) {
    const candidateTempo = estimateImmediateTempo(features, candidate);
    const minScoreToWin = minimumScoreToWinRound(features);
    const catchesUp = features.ownScore + candidateTempo >= minScoreToWin;
    const overkill = catchesUp
      ? Math.max(0, features.ownScore + candidateTempo - minScoreToWin)
      : Infinity;
    if (
      catchesUp &&
      overkill <= 3 &&
      !analysis.selectedMoveWouldLeaveNoUnitTempoCard
    ) {
      return false; // cheap catch-up — play it
    }
  }

  // cFp36: Round resource budget gate — conservative non-elimination preservation
  // Only applies when board investment already exceeds the budget for hand quality,
  // the candidate spends a hand card (not leader/prompt), and no exception applies.
  if (analysis.resourceExhaustionRecommended && candidate.kind === "play_card") {
    // Round 3: no budget preservation (no future round to preserve for)
    if (features.round >= 3) return false;
    return true;
  }

  // cFp31 repair Fix 4: Removed features.ownHandCount > 2 gate from critical-risk branch
  // Critical risk: hand nearly empty and no positive unit moves left.
  if (analysis.estimatedHandCountAfterSelectedMove <= 1 &&
      analysis.selectedMoveWouldLeaveNoPositiveUnitMove) {
    // Exception: if this move wins the match, play it anyway
    if (candidate?.kind === "play_card") {
      const tempo = estimateImmediateTempo(features, candidate);
      const minScore = minimumScoreToWinRound(features);
      if (features.opponentGems <= 1 && features.ownScore + tempo >= minScore) {
        return false; // wins the match — play it
      }
    }
    return true;
  }

  // cFp31 repair Fix 4: Removed estimatedHandCountAfterSelectedMove >= 2 gate
  // Ahead or near-even: preserve future hand if continuing burns it.
  if (features.scoreDelta >= -10) {
    if (analysis.selectedMoveWouldLeaveNoPositiveUnitMove ||
        analysis.selectedMoveWouldLeaveNoUnitTempoCard ||
        (analysis.futureRoundHandQuality !== "healthy" && analysis.estimatedHandCountAfterSelectedMove <= 2)) {
      return true;
    }
  }

  // Behind on non-elimination round: sacrifice if no single-move catch-up
  if (features.scoreDelta < 0) {
    const passDiags = buildLegalHeuristicV1PassDecisionDiagnostics(features);
    if (!passDiags.hasSingleMoveCatchUp && analysis.risk === "high") {
      return true;
    }
  }

  return false;
};

const estimateOpponentHandPressure = (features: LegalHeuristicV1Features) => {
  const perCardPressure = features.ownGems <= 1 ? 8 : 6;
  return features.opponentHandCount * perCardPressure;
};

const canVoluntarilyPassWithLead = (features: LegalHeuristicV1Features) => {
  if (features.scoreDelta <= 0) {
    return false;
  }

  if (features.opponentPassed) {
    return true;
  }

  const requiredLead = Math.max(features.ownGems <= 1 ? 36 : 24, estimateOpponentHandPressure(features));
  return features.scoreDelta > requiredLead;
};

// cFp26.1: Shared internal candidate ranker used by both chooseCatchUpMove
// and buildLegalHeuristicV1PassDecisionDiagnostics. Returns internal move
// data so diagnostics can inspect the best single-move catch-up candidate.
const rankCatchUpCandidates = (features: LegalHeuristicV1Features) => {
  const candidates = [...features.playMoves, ...features.leaderMoves]
    .map((move) => ({
      move,
      tempo: estimateImmediateTempo(features, move),
      score: scoreMove(features, move),
      cost:
        move.kind === "play_card"
          ? cardStrategicValue(features.ownHandByCardId.get(move.sourceCardId))
          : 120,
    }))
    .filter((candidate) => features.ownScore + candidate.tempo >= minimumScoreToWinRound(features) && candidate.score > -100);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((left, right) => {
    const costDelta = left.cost - right.cost;
    const overkillDelta =
      Math.max(0, features.ownScore + left.tempo - minimumScoreToWinRound(features)) -
      Math.max(0, features.ownScore + right.tempo - minimumScoreToWinRound(features));
    const scoreDelta = right.score - left.score;
    return costDelta || overkillDelta || scoreDelta || byMoveId(left.move, right.move);
  })[0];
};

const chooseCatchUpMove = (features: LegalHeuristicV1Features) => {
  const best = rankCatchUpCandidates(features);
  return best?.move ?? null;
};

// cFp26.1: Policy-aligned pass decision diagnostics.
export interface LegalHeuristicV1PassDecisionDiagnostics {
  readonly ownWinsTiedRound: boolean;
  readonly minimumScoreToWinRound: number;
  readonly policyUpperBound: number;
  readonly policyUpperBoundCanWinRound: boolean;
  readonly hasSingleMoveCatchUp: boolean;
  readonly bestSingleMoveCatchUpScore: number | null;
  readonly bestSingleMoveCatchUpTempo: number | null;
  readonly bestSingleMoveCatchUpKind: "play_card" | "use_leader" | null;
  readonly preserveHandPassRecommended: boolean;
}

export const buildLegalHeuristicV1PassDecisionDiagnostics = (
  features: LegalHeuristicV1Features,
): LegalHeuristicV1PassDecisionDiagnostics => {
  const ownWinsTied = ownWinsTiedRound(features);
  const minScore = minimumScoreToWinRound(features);
  const policyUpperBound = features.ownScore + uniqueCardTempoUpperBound(features);
  const policyUpperBoundCanWin = policyUpperBound >= minScore;

  const bestCandidate = rankCatchUpCandidates(features);
  const hasSingleMoveCatchUp = bestCandidate !== null;

  let bestSingleMoveCatchUpScore: number | null = null;
  let bestSingleMoveCatchUpTempo: number | null = null;
  let bestSingleMoveCatchUpKind: "play_card" | "use_leader" | null = null;

  if (bestCandidate) {
    bestSingleMoveCatchUpScore = bestCandidate.score;
    bestSingleMoveCatchUpTempo = bestCandidate.tempo;
    bestSingleMoveCatchUpKind = bestCandidate.move.kind;
  }

  const preserveHandPassRecommended =
    features.opponentPassed === true &&
    features.scoreDelta <= 0 &&
    !hasSingleMoveCatchUp &&
    features.ownGems > 1 &&
    features.passMove !== null;

  return {
    ownWinsTiedRound: ownWinsTied,
    minimumScoreToWinRound: minScore,
    policyUpperBound,
    policyUpperBoundCanWinRound: policyUpperBoundCanWin,
    hasSingleMoveCatchUp,
    bestSingleMoveCatchUpScore,
    bestSingleMoveCatchUpTempo,
    bestSingleMoveCatchUpKind,
    preserveHandPassRecommended,
  };
};

export const choosePlayingMove = (features: LegalHeuristicV1Features) => {
  const passMove = features.passMove;

  if (features.opponentPassed) {
    if (features.scoreDelta > 0 && passMove) {
      return passMove;
    }

    const catchUp = chooseCatchUpMove(features);
    if (catchUp) {
      return catchUp;
    }

    const upperBound = features.ownScore + uniqueCardTempoUpperBound(features);
    if (passMove && (features.ownGems > 1 || upperBound < minimumScoreToWinRound(features))) {
      return passMove;
    }

    return bestUsefulMove(features) ?? passMove;
  }

  if (features.ownGems <= 1 && features.scoreDelta < 0 && passMove) {
    const upperBound = features.ownScore + uniqueCardTempoUpperBound(features);
    if (upperBound < minimumScoreToWinRound(features)) {
      return passMove;
    }
  }

  // cFp28: Calibrate voluntary pass safety with hand quality.
  if (passMove && canVoluntarilyPassWithLead(features)) {
    const handShape = buildLegalHeuristicV1HandShapeAnalysis(features);
    const extraBuffer = getFutureHandExtraBuffer(handShape.futureRoundHandQuality);
    const requiredLead = Math.max(features.ownGems <= 1 ? 36 : 24, estimateOpponentHandPressure(features));
    const passSafetyBuffer = features.scoreDelta - requiredLead;
    if (extraBuffer > 0 && passSafetyBuffer < extraBuffer) {
      // Hand quality requires extra safety margin — prefer useful play.
      const useful = bestUsefulMove(features);
      if (useful) {
        return useful;
      }
    }
    return passMove;
  }

  // cFp31: Round-investment gate — use shared decision helper for policy/explanation parity.
  // If continuing would burn the last useful future hand, prefer pass.
  {
    const roundDecision = buildLegalHeuristicV1RoundInvestmentDecision(features);
    if (roundDecision.candidate && passMove && !features.opponentPassed && features.ownGems > 1) {
      if (roundDecision.shouldPass) {
        return passMove;
      }
    }
    if (roundDecision.candidate) {
      return roundDecision.candidate;
    }
  }

  return bestUsefulMove(features) ?? passMove;
};

// ---------------------------------------------------------------------------
// cFp33: Scoia'tael first-turn choice helper
// ---------------------------------------------------------------------------

export interface LegalHeuristicV1ScoiataelFirstTurnDecision {
  readonly selectedMove: ChoosePromptOptionMove | null;
  readonly analysis: AiDecisionScoiataelFirstTurnAnalysis | null;
}

/**
 * cFp33: Decide go-first vs let-opponent-start for the Scoia'tael
 * first-player prompt. Returns both the selected move and a hidden-info-safe
 * diagnostic analysis derived only from counts, buckets, and reason kinds.
 */
export const buildScoiataelFirstTurnChoiceDecision = (
  features: LegalHeuristicV1Features,
): LegalHeuristicV1ScoiataelFirstTurnDecision => {
  const promptMoves = features.promptMoves;
  if (promptMoves.length === 0) {
    return { selectedMove: null, analysis: null };
  }

  const abilityId = promptMoves[0].metadata.abilityId;
  if (abilityId !== "scoiatael_choose_first") {
    return { selectedMove: null, analysis: null };
  }

  const selfMove = promptMoves.find((m) => m.optionId === "scoiatael-first-player:self");
  const opponentMove = promptMoves.find((m) => m.optionId === "scoiatael-first-player:opponent");
  const selfOptionLegal = selfMove != null;
  const opponentOptionLegal = opponentMove != null;

  if (!selfOptionLegal && !opponentOptionLegal) {
    return { selectedMove: null, analysis: null };
  }

  // Count hand features
  const hand = features.input.observation.ownHand;
  let spyCount = 0;
  let musterCount = 0;
  let medicCount = 0;
  let weatherCount = 0;
  let scorchCount = 0;
  let decoyCount = 0;
  let hornCount = 0;
  let proactiveUnitOrHeroCount = 0;
  let bestOpeningStrength = 0;

  for (const card of hand) {
    const hasAbility = (ability: string) => card.abilities.includes(ability as never);
    const isSpy = hasAbility("spy");
    const isMuster = hasAbility("muster") || hasAbility("muster_roach");
    const isMedic = hasAbility("medic");
    const isWeather = hasAbility("frost") || hasAbility("fog") || hasAbility("rain") || hasAbility("skellige_storm");
    const isScorch = hasAbility("scorch") || hasAbility("scorch_close") || hasAbility("scorch_range") || hasAbility("scorch_siege");
    const isDecoy = hasAbility("decoy");
    const isHorn = hasAbility("commanders_horn");

    if (isSpy) spyCount++;
    if (isMuster) musterCount++;
    if (isMedic) medicCount++;
    if (isWeather) weatherCount++;
    if (isScorch) scorchCount++;
    if (isDecoy) decoyCount++;
    if (isHorn) hornCount++;

    if (card.kind === "unit" || card.kind === "hero") {
      proactiveUnitOrHeroCount++;
      if (card.printedStrength > bestOpeningStrength) {
        bestOpeningStrength = card.printedStrength;
      }
    }
  }

  const reactiveSpecialCount = scorchCount + weatherCount + decoyCount;

  // Determine tempo bucket
  let bestOpeningTempoBucket: AiDecisionFirstTurnTempoBucket = "none";
  if (bestOpeningStrength >= 8) bestOpeningTempoBucket = "high";
  else if (bestOpeningStrength >= 5) bestOpeningTempoBucket = "medium";
  else if (bestOpeningStrength >= 1) bestOpeningTempoBucket = "low";

  // Scoring algorithm
  let initiativeScore = 10; // default go-first bias
  let reactionScore = 0;

  if (spyCount > 0) initiativeScore += 35;
  if (musterCount > 0) initiativeScore += 25;
  if (bestOpeningStrength >= 8) initiativeScore += 25;
  else if (bestOpeningStrength >= 5) initiativeScore += 12;
  if (hornCount > 0 && proactiveUnitOrHeroCount >= 3) initiativeScore += 8;

  if (scorchCount > 0) reactionScore += 28;
  if (weatherCount >= 2) reactionScore += 24;
  else if (weatherCount === 1) reactionScore += 10;
  if (decoyCount > 0 && spyCount === 0) reactionScore += 8;
  if (medicCount > 0) reactionScore += 6;
  if (bestOpeningStrength <= 4 && reactiveSpecialCount >= 2) reactionScore += 18;

  // Decision: choose opponent only if reaction significantly outweighs initiative
  const chooseOpponent = reactionScore >= initiativeScore + 12;

  let selectedMove: ChoosePromptOptionMove | null = null;
  let recommendation: AiDecisionScoiataelFirstTurnRecommendation;

  if (!selfOptionLegal) {
    // Only opponent option available
    selectedMove = opponentMove ?? null;
    recommendation = "let_opponent_start";
  } else if (!opponentOptionLegal) {
    // Only self option available
    selectedMove = selfMove ?? null;
    recommendation = "go_first";
  } else if (chooseOpponent) {
    selectedMove = opponentMove;
    recommendation = "let_opponent_start";
  } else {
    // Tie or initiative wins — default to self
    selectedMove = selfMove;
    recommendation = "go_first";
  }

  // Determine reason kind
  let reasonKind: AiDecisionScoiataelFirstTurnReasonKind;
  if (!selfOptionLegal || !opponentOptionLegal) {
    reasonKind = "only_legal_option";
  } else if (recommendation === "let_opponent_start") {
    if (scorchCount > 0 || weatherCount > 0) {
      reasonKind = "reactive_weather_or_scorch";
    } else {
      reasonKind = "weak_proactive_reactive_hand";
    }
  } else {
    // recommendation is "go_first"
    if (spyCount > 0) {
      reasonKind = "spy_or_card_advantage_opener";
    } else if (musterCount > 0) {
      reasonKind = "muster_or_thinning_opener";
    } else if (bestOpeningTempoBucket === "high") {
      reasonKind = "strong_tempo_opener";
    } else {
      reasonKind = "default_go_first";
    }
  }

  const analysis: AiDecisionScoiataelFirstTurnAnalysis = {
    promptLegal: true,
    selfOptionLegal,
    opponentOptionLegal,
    recommendation,
    reasonKind,
    initiativeScore,
    reactionScore,
    bestOpeningTempoBucket,
    spyCount,
    musterCount,
    medicCount,
    weatherCount,
    scorchCount,
    decoyCount,
    hornCount,
    proactiveUnitOrHeroCount,
    reactiveSpecialCount,
  };

  return { selectedMove, analysis };
};

export const legalHeuristicPolicyV1: EnginePolicy = {
  id: "legal-heuristic-v1",
  selectMove(input) {
    if (input.legalMoves.length === 0) {
      return null;
    }

    const features = buildLegalHeuristicV1Features(input);

    const promptMove = choosePromptMove(features);
    if (promptMove) {
      return promptMove;
    }

    if (features.phase === "mulligan") {
      return chooseMulliganMove(features);
    }

    const roundEndMove = input.legalMoves.find((move) => move.kind === "resolve_round_end") ?? null;
    if (roundEndMove) {
      return roundEndMove;
    }

    const playingMove = choosePlayingMove(features);
    if (playingMove) {
      return playingMove;
    }

    return [...input.legalMoves].sort(byMoveId)[0] ?? null;
  },
};
