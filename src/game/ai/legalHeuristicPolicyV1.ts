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
  EnginePolicy,
  EnginePolicyInput,
  PromptOptionSummary,
  SeatBoardRowSummary,
  SeatCardSummary,
} from "./types";

const MIN_USEFUL_MOVE_SCORE = 25;

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

const cardStrategicValue = (card: SeatCardSummary | undefined) => {
  if (!card) {
    return 0;
  }

  let score = card.printedStrength * 10;
  if (card.kind === "hero") score += 95;
  if (card.kind === "unit") score += 25;
  if (card.kind === "special") score += 20;
  if (card.deckLimit === 1) score += 8;

  card.abilities.forEach((ability) => {
    switch (ability) {
      case "spy":
        score += 520;
        break;
      case "medic":
        score += 260;
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

interface MulliganCandidateRank {
  move: ChooseMulliganMove;
  card: SeatCardSummary;
  confidence: number;
  standaloneValue: number;
}

const mulliganRedrawConfidence = (features: LegalHeuristicV1Features, card: SeatCardSummary) => {
  const linkedCallers = features.input.observation.ownHand.filter(
    (candidate) =>
      candidate.cardId !== card.cardId &&
      isMusterCaller(candidate) &&
      Boolean(candidate.linkedSourceIds?.includes(card.sourceId)),
  );
  const roachCaller = linkedCallers.some((candidate) => hasAbility(candidate, "muster_roach"));
  const oneWayCaller = linkedCallers.some((candidate) => candidate.sourceId !== card.sourceId);
  const sameSourceMuster =
    hasAbility(card, "muster") &&
    Boolean(card.linkedSourceIds?.includes(card.sourceId)) &&
    (features.sourceCountsInHand.get(card.sourceId) ?? 0) > 1 &&
    features.firstCardIdBySource.get(card.sourceId) !== card.cardId;

  if (card.kind === "hero" && !oneWayCaller && !roachCaller) {
    return 0;
  }

  if (card.sourceId === "neutral.roach" && roachCaller) {
    return 400;
  }

  if (oneWayCaller) {
    return 320;
  }

  if (sameSourceMuster) {
    return 240;
  }

  return 0;
};

const chooseMulliganMove = (features: LegalHeuristicV1Features) => {
  const keepMove = features.mulliganMoves.find((move) => move.cardIds.length === 0) ?? null;
  const candidates: MulliganCandidateRank[] = features.mulliganMoves.flatMap((move) => {
    if (move.cardIds.length !== 1) {
      return [];
    }
    const card = features.ownHandByCardId.get(move.cardIds[0]);
    if (!card) {
      return [];
    }
    const confidence = mulliganRedrawConfidence(features, card);
    if (confidence <= 0) {
      return [];
    }
    return [
      {
        move,
        card,
        confidence,
        standaloneValue: standaloneMulliganValue(card),
      },
    ];
  });

  if (candidates.length === 0) {
    return keepMove ?? features.mulliganMoves.slice().sort(byMoveId)[0] ?? null;
  }

  return candidates.sort((left, right) => {
    const confidenceDelta = right.confidence - left.confidence;
    const valueDelta = left.standaloneValue - right.standaloneValue;
    const strengthDelta = left.card.printedStrength - right.card.printedStrength;
    return confidenceDelta || valueDelta || strengthDelta || byMoveId(left.move, right.move);
  })[0].move;
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

const choosePromptMove = (features: LegalHeuristicV1Features) => {
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

const estimateImmediateTempo = (features: LegalHeuristicV1Features, move: PlayCardMove | UseLeaderMove) => {
  if (move.kind === "use_leader") {
    return estimateLeaderTempo(features, move);
  }

  const card = features.ownHandByCardId.get(move.sourceCardId);
  if (!card) {
    return 0;
  }

  if (move.target.kind === "board_row") {
    const signedStrength = move.target.side === "opponent" ? -card.printedStrength : card.printedStrength;
    const abilityRows = card.abilities.flatMap((ability) => SCORCH_ROWS_BY_ABILITY[ability] ?? []);
    const scorchBonus = abilityRows.length > 0 ? scorchSwing(features, abilityRows) : 0;
    const linkedHandTempo = move.target.side === "own" ? linkedHandTempoForCard(features, card) : 0;
    return signedStrength + scorchBonus + linkedHandTempo;
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

const scoreWeatherPlayMove = (features: LegalHeuristicV1Features, card: SeatCardSummary) => {
  if (hasAbility(card, "clear_weather")) {
    const swing = clearWeatherSwing(features);
    return swing > 0 ? 160 + swing * 20 : -260;
  }

  const rows = rowsForWeatherCard(card);
  const swing = weatherSwingForRows(features, rows);
  return swing > 0 ? 170 + swing * 25 : -260 + swing * 20;
};

const scoreScorchMove = (features: LegalHeuristicV1Features, card: SeatCardSummary) => {
  const rows = card.abilities.flatMap((ability) => SCORCH_ROWS_BY_ABILITY[ability] ?? []);
  const swing = scorchSwing(features, rows.length > 0 ? rows : null);
  return swing > 0 ? 230 + swing * 20 : -320 + swing * 20;
};

const scoreDecoyMove = (features: LegalHeuristicV1Features, move: PlayCardMove) => {
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

const scorePlayMove = (features: LegalHeuristicV1Features, move: PlayCardMove) => {
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

  const tempo = estimateImmediateTempo(features, move);
  let score = cardStrategicValue(card) + tempo * 14;
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

const scoreLeaderMove = (features: LegalHeuristicV1Features, move: UseLeaderMove) => {
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

const scoreMove = (features: LegalHeuristicV1Features, move: PlayCardMove | UseLeaderMove) =>
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

const uniqueCardTempoUpperBound = (features: LegalHeuristicV1Features) => {
  const bestTempoByCard = new Map<string, number>();
  features.playMoves.forEach((move) => {
    const tempo = Math.max(0, estimateImmediateTempo(features, move));
    bestTempoByCard.set(move.sourceCardId, Math.max(bestTempoByCard.get(move.sourceCardId) ?? 0, tempo));
  });
  const leaderTempo = Math.max(0, ...features.leaderMoves.map((move) => estimateLeaderTempo(features, move)));
  return [...bestTempoByCard.values()].reduce((sum, tempo) => sum + tempo, 0) + leaderTempo;
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

const chooseCatchUpMove = (features: LegalHeuristicV1Features) => {
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
    .filter((candidate) => features.ownScore + candidate.tempo > features.opponentScore && candidate.score > -100);

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((left, right) => {
    const costDelta = left.cost - right.cost;
    const overkillDelta =
      Math.max(0, features.ownScore + left.tempo - features.opponentScore - 1) -
      Math.max(0, features.ownScore + right.tempo - features.opponentScore - 1);
    const scoreDelta = right.score - left.score;
    return costDelta || overkillDelta || scoreDelta || byMoveId(left.move, right.move);
  })[0].move;
};

const choosePlayingMove = (features: LegalHeuristicV1Features) => {
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
    if (passMove && (features.ownGems > 1 || upperBound <= features.opponentScore)) {
      return passMove;
    }

    return bestUsefulMove(features) ?? passMove;
  }

  if (features.ownGems <= 1 && features.scoreDelta < 0 && passMove) {
    const upperBound = features.ownScore + uniqueCardTempoUpperBound(features);
    if (upperBound <= features.opponentScore) {
      return passMove;
    }
  }

  if (passMove && canVoluntarilyPassWithLead(features)) {
    return passMove;
  }

  return bestUsefulMove(features) ?? passMove;
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
