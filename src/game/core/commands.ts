import type { CatalogAbilityId, CatalogCardSource, CatalogLeaderSource, CatalogRow } from "@/game/catalog";

import {
  resolveAvengerForCard,
  resolveCardAbilities,
  resolvePromptOption,
  settleMardroemeRow,
} from "./abilities";
import { isEligibleWeatherSourceForLeader, isWeatherLeaderAbility } from "./leaderWeather";
import { getLegalMoves, type LegalMoveTarget } from "./legalMoves";
import { createSeededRngFromState, shuffleWithRng } from "./rng";
import { calculateScores, findSpecialScorchTargets } from "./scoring";
import { startMatch } from "./setup";
import type {
  CardInstanceId,
  EngineCommand,
  EngineTransaction,
  GameEvent,
  MatchState,
  RoundResult,
  SeatId,
  ZoneRef,
} from "./types";

export type EngineRuleErrorCode =
  | "illegal_command"
  | "unsupported_command"
  | "invalid_phase"
  | "invalid_target"
  | "missing_card"
  | "missing_catalog_source"
  | "prompt_pending";

export class EngineRuleError extends Error {
  readonly code: EngineRuleErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: EngineRuleErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "EngineRuleError";
    this.code = code;
    this.details = details;
  }
}

export interface StatefulCommandInput {
  state: MatchState;
  command: Exclude<EngineCommand, { type: "StartMatch" }>;
  catalogCards: readonly CatalogCardSource[];
  catalogLeaders: readonly CatalogLeaderSource[];
}

type CommandInput = EngineCommand | StatefulCommandInput;

const WEATHER_ABILITIES = new Set<CatalogAbilityId>(["frost", "fog", "rain", "skellige_storm"]);
const ROWS: readonly CatalogRow[] = ["close", "ranged", "siege"];
const SEATS: readonly SeatId[] = ["seat_a", "seat_b"];
const SKELLIGE_DEFERRED_RETURN_ABILITIES = new Set<CatalogAbilityId>([
  "spy",
  "medic",
  "muster",
  "muster_roach",
  "scorch_close",
]);
const opponentOf = (seatId: SeatId): SeatId => (seatId === "seat_a" ? "seat_b" : "seat_a");

const cloneState = (state: MatchState): MatchState => structuredClone(state);

const createCardLookup = (catalogCards: readonly CatalogCardSource[]) =>
  new Map(catalogCards.map((card) => [card.sourceId, card]));

const createLeaderLookup = (catalogLeaders: readonly CatalogLeaderSource[]) =>
  new Map(catalogLeaders.map((leader) => [leader.sourceId, leader]));

const targetsEqual = (left: unknown, right: LegalMoveTarget) => JSON.stringify(left ?? { kind: "none" }) === JSON.stringify(right);

const sortedIds = (cardIds: readonly CardInstanceId[]) => [...cardIds].sort((a, b) => a.localeCompare(b));

const assertLegal = (input: StatefulCommandInput) => {
  if (!("seatId" in input.command) || !input.command.seatId) {
    throw new EngineRuleError("illegal_command", `${input.command.type} cannot be checked as a seat legal move.`, {
      command: input.command,
    });
  }

  const legalMoves = getLegalMoves({
    state: input.state,
    seatId: input.command.seatId,
    catalogCards: input.catalogCards,
    catalogLeaders: input.catalogLeaders,
  });

  const command = input.command;
  const legal = legalMoves.some((move) => {
    switch (command.type) {
      case "ChooseMulligan":
        return (
          move.kind === "choose_mulligan" &&
          JSON.stringify(sortedIds(move.cardIds)) === JSON.stringify(sortedIds(command.cardIds))
        );
      case "PlayCard":
        return move.kind === "play_card" && move.sourceCardId === command.cardId && targetsEqual(command.target, move.target);
      case "Pass":
        return move.kind === "pass";
      case "UseLeader":
        return move.kind === "use_leader" && targetsEqual(command.target, move.target);
      case "ChoosePromptOption":
        return move.kind === "choose_prompt_option" && move.promptId === command.promptId && move.optionId === command.optionId;
      case "ResolveRoundEnd":
        return move.kind === "resolve_round_end";
    }
  });

  if (!legal) {
    throw new EngineRuleError("illegal_command", `${command.type} is not legal for ${command.seatId}.`, {
      command,
      phase: input.state.phase,
      currentTurn: input.state.currentTurn,
    });
  }
};

const getCardSource = (lookup: ReadonlyMap<string, CatalogCardSource>, state: MatchState, cardId: CardInstanceId) => {
  const instance = state.cardsById[cardId];
  if (!instance) {
    throw new EngineRuleError("missing_card", `Missing card instance ${cardId}.`, { cardId });
  }

  const source = lookup.get(instance.sourceId);
  if (!source) {
    throw new EngineRuleError("missing_catalog_source", `Missing catalog source ${instance.sourceId}.`, {
      cardId,
      sourceId: instance.sourceId,
    });
  }

  return source;
};

const removeFromArray = (items: CardInstanceId[], cardId: CardInstanceId) => {
  const index = items.indexOf(cardId);
  if (index >= 0) {
    items.splice(index, 1);
  }
};

const removeFromCurrentZone = (state: MatchState, cardId: CardInstanceId) => {
  const card = state.cardsById[cardId];
  if (!card) {
    throw new EngineRuleError("missing_card", `Missing card instance ${cardId}.`, { cardId });
  }

  const zone = card.zone;
  switch (zone.kind) {
    case "deck":
      removeFromArray(state.seats[zone.seat].deck, cardId);
      break;
    case "hand":
      removeFromArray(state.seats[zone.seat].hand, cardId);
      break;
    case "discard":
      removeFromArray(state.seats[zone.seat].discard, cardId);
      break;
    case "side_deck":
      removeFromArray(state.seats[zone.seat].sideDeck, cardId);
      break;
    case "removed_from_game":
      removeFromArray(state.seats[zone.seat].removedFromGame, cardId);
      break;
    case "board_row":
      removeFromArray(state.seats[zone.seat].board[zone.row].units, cardId);
      break;
    case "row_horn":
      if (state.seats[zone.seat].board[zone.row].horn === cardId) {
        state.seats[zone.seat].board[zone.row].horn = null;
      }
      break;
    case "weather":
      removeFromArray(state.weather.entries, cardId);
      break;
    case "leader":
      break;
  }
};

const addToZone = (state: MatchState, cardId: CardInstanceId, to: ZoneRef, boardIndex?: number) => {
  switch (to.kind) {
    case "deck":
      state.seats[to.seat].deck.push(cardId);
      break;
    case "hand":
      state.seats[to.seat].hand.push(cardId);
      break;
    case "discard":
      state.seats[to.seat].discard.push(cardId);
      break;
    case "side_deck":
      state.seats[to.seat].sideDeck.push(cardId);
      break;
    case "removed_from_game":
      state.seats[to.seat].removedFromGame.push(cardId);
      break;
    case "board_row": {
      const units = state.seats[to.seat].board[to.row].units;
      if (boardIndex === undefined) {
        units.push(cardId);
      } else {
        units.splice(boardIndex, 0, cardId);
      }
      break;
    }
    case "row_horn":
      state.seats[to.seat].board[to.row].horn = cardId;
      break;
    case "weather":
      state.weather.entries.push(cardId);
      break;
    case "leader":
      state.seats[to.seat].leader = cardId;
      break;
  }
};

const moveCard = (
  state: MatchState,
  events: GameEvent[],
  cardId: CardInstanceId,
  to: ZoneRef,
  reason: Extract<GameEvent, { type: "card_moved" }>["reason"],
  boardIndex?: number,
) => {
  const card = state.cardsById[cardId];
  if (!card) {
    throw new EngineRuleError("missing_card", `Missing card instance ${cardId}.`, { cardId });
  }

  const from = card.zone;
  removeFromCurrentZone(state, cardId);
  addToZone(state, cardId, to, boardIndex);
  card.zone = to;
  events.push({ type: "card_moved", cardId, sourceId: card.sourceId, from, to, reason });
};

const drawOneCard = (
  state: MatchState,
  events: GameEvent[],
  seatId: SeatId,
  reason: Extract<GameEvent, { type: "card_moved" }>["reason"],
) => {
  const cardId = state.seats[seatId].deck[0];
  if (!cardId) {
    return null;
  }

  moveCard(state, events, cardId, { kind: "hand", seat: seatId }, reason);
  events.push({ type: "card_drawn", seatId, cardId, sourceId: state.cardsById[cardId].sourceId });
  return cardId;
};

const handoffTurn = (state: MatchState, events: GameEvent[], seatId: SeatId) => {
  if (state.pendingPrompt) {
    return;
  }
  const opponent = opponentOf(seatId);
  if (!state.seats[opponent].passed) {
    state.currentTurn = opponent;
    events.push({ type: "turn_set", seatId: opponent, reason: "turn_handoff" });
  }
};

const chooseMulligan = (input: StatefulCommandInput): EngineTransaction => {
  if (input.state.phase !== "mulligan") {
    throw new EngineRuleError("invalid_phase", "ChooseMulligan can only execute in mulligan phase.");
  }

  assertLegal(input);
  const state = cloneState(input.state);
  const events: GameEvent[] = [];
  const { seatId, cardIds } = input.command as Extract<EngineCommand, { type: "ChooseMulligan" }>;
  const rng = createSeededRngFromState(state.rng.seed, state.rng.state);
  const selected = sortedIds(cardIds);
  const redrawCount = selected.length;

  selected.forEach((cardId) => {
    removeFromArray(state.seats[seatId].hand, cardId);
  });

  const drawn = state.seats[seatId].deck.slice(0, redrawCount);
  drawn.forEach((cardId) => moveCard(state, events, cardId, { kind: "hand", seat: seatId }, "mulligan_draw"));

  selected.forEach((cardId) => moveCard(state, events, cardId, { kind: "deck", seat: seatId }, "mulligan_return"));

  state.seats[seatId].deck = shuffleWithRng(state.seats[seatId].deck, rng);
  state.rng.state = rng.getState();
  state.seats[seatId].mulligansUsed += redrawCount;
  state.seats[seatId].mulliganComplete = redrawCount === 0 || state.seats[seatId].mulligansUsed >= 2;
  events.push({ type: "mulligan_chosen", seatId, cardIds: selected, drawCount: drawn.length });
  if (selected.length > 0) {
    events.push({ type: "deck_shuffled", seatId, reason: "mulligan" });
  }

  if (state.seats.seat_a.mulliganComplete && state.seats.seat_b.mulliganComplete) {
    const from = state.phase;
    state.phase = "playing";
    events.push({ type: "phase_changed", from, to: state.phase, reason: "mulligan_complete" });
  }

  return { state, events };
};

const clearWeather = (state: MatchState, events: GameEvent[], seatId: SeatId, source: "card" | "leader") => {
  const weatherCardIds = [...state.weather.entries];

  weatherCardIds.forEach((cardId) => {
    const controller = state.cardsById[cardId].controller;
    moveCard(state, events, cardId, { kind: "discard", seat: controller }, "weather_cleared");
  });

  events.push({ type: "weather_cleared", seatId, cardIds: weatherCardIds, source });
};

const emitDiscardTriggerDeferrals = (
  events: GameEvent[],
  sourceLookup: ReadonlyMap<string, CatalogCardSource>,
  state: MatchState,
  cardId: CardInstanceId,
) => {
  const source = sourceLookup.get(state.cardsById[cardId].sourceId);
  source?.abilities.forEach((abilityId) => {
    if (abilityId === "summon" || abilityId === "avenger") {
      events.push({
        type: "ability_deferred",
        sourceId: source.sourceId,
        cardId,
        abilityId,
        reason: "discard_trigger_pending",
      });
    }
  });
};

const resolveSpecialScorch = (
  state: MatchState,
  events: GameEvent[],
  sourceLookup: ReadonlyMap<string, CatalogCardSource>,
  catalogCards: readonly CatalogCardSource[],
  catalogLeaders: readonly CatalogLeaderSource[],
  seatId: SeatId,
  cardId: CardInstanceId,
  source: CatalogCardSource,
) => {
  events.push({ type: "ability_triggered", sourceId: source.sourceId, cardId, abilityId: "scorch" });
  const breakdown = calculateScores({ state, catalogCards, catalogLeaders });
  const targets = findSpecialScorchTargets(breakdown);

  targets.forEach((target) => {
    const origin: ZoneRef = { kind: "board_row", seat: target.seatId, row: target.row };
    moveCard(state, events, target.cardId, { kind: "discard", seat: target.seatId }, "scorch_destroyed");
    emitDiscardTriggerDeferrals(events, sourceLookup, state, target.cardId);
    resolveAvengerForCard({
      state,
      events,
      catalogLookup: sourceLookup,
      cardId: target.cardId,
      destination: origin,
    });
  });

  moveCard(state, events, cardId, { kind: "discard", seat: seatId }, "scorch_discard");
  events.push({ type: "card_played", seatId, cardId, target: state.cardsById[cardId].zone });
  events.push({
    type: "scorch_resolved",
    sourceId: source.sourceId,
    cardId,
    abilityId: "scorch",
    targetCardIds: targets.map((target) => target.cardId),
    outcome: targets.length > 0 ? "destroyed" : "no_targets",
  });
  events.push({
    type: "ability_resolved",
    sourceId: source.sourceId,
    cardId,
    abilityId: "scorch",
    outcome: targets.length > 0 ? "destroyed" : "no_targets",
  });
};

const playCard = (input: StatefulCommandInput): EngineTransaction => {
  if (input.state.pendingPrompt) {
    throw new EngineRuleError("prompt_pending", "Only prompt choices can execute while a prompt is pending.", {
      promptId: input.state.pendingPrompt.promptId,
    });
  }

  assertLegal(input);
  const sourceLookup = createCardLookup(input.catalogCards);
  const state = cloneState(input.state);
  const events: GameEvent[] = [];
  const command = input.command as Extract<EngineCommand, { type: "PlayCard" }>;
  const source = getCardSource(sourceLookup, state, command.cardId);
  const target = command.target as LegalMoveTarget;
  const card = state.cardsById[command.cardId];

  if (target.kind === "board_row") {
    card.controller = command.seatId;
    moveCard(state, events, command.cardId, { kind: "board_row", seat: target.seatId, row: target.row }, "play_card");
    events.push({ type: "card_played", seatId: command.seatId, cardId: command.cardId, target: card.zone });
    resolveCardAbilities({
      state,
      events,
      catalogCards: input.catalogCards,
      catalogLeaders: input.catalogLeaders,
      seatId: command.seatId,
      cardId: command.cardId,
    });
    if (!state.pendingPrompt && card.zone.kind === "board_row") {
      settleMardroemeRow({
        state,
        events,
        catalogLookup: sourceLookup,
        boardSeat: card.zone.seat,
        row: card.zone.row,
        triggerCardId: command.cardId,
      });
    }
  } else if (target.kind === "row_horn") {
    card.controller = command.seatId;
    moveCard(state, events, command.cardId, { kind: "row_horn", seat: target.seatId, row: target.row }, "play_card");
    events.push({ type: "card_played", seatId: command.seatId, cardId: command.cardId, target: card.zone });
  } else if (target.kind === "weather") {
    if (source.abilities.includes("clear_weather")) {
      clearWeather(state, events, command.seatId, "card");
      moveCard(state, events, command.cardId, { kind: "discard", seat: command.seatId }, "discard_after_effect");
      events.push({ type: "card_played", seatId: command.seatId, cardId: command.cardId, target: card.zone });
    } else if (source.abilities.some((abilityId) => WEATHER_ABILITIES.has(abilityId))) {
      card.controller = command.seatId;
      moveCard(state, events, command.cardId, { kind: "weather" }, "play_card");
      events.push({ type: "card_played", seatId: command.seatId, cardId: command.cardId, target: card.zone });
    } else {
      throw new EngineRuleError("invalid_target", "Card cannot target weather.", { cardId: command.cardId, target });
    }
  } else if (target.kind === "card_instance" && source.abilities.includes("decoy")) {
    const targetZone = state.cardsById[target.cardId]?.zone;
    if (!targetZone || targetZone.kind !== "board_row") {
      throw new EngineRuleError("invalid_target", "Decoy target is not on a board row.", { target });
    }
    const units = state.seats[targetZone.seat].board[targetZone.row].units;
    const targetIndex = units.indexOf(target.cardId);
    if (targetIndex < 0) {
      throw new EngineRuleError("invalid_target", "Decoy target is not in its row.", { target });
    }

    const decoyOriginZone: ZoneRef = { kind: "board_row", seat: targetZone.seat, row: targetZone.row };
    moveCard(state, events, target.cardId, { kind: "hand", seat: command.seatId }, "decoy_return");
    state.cardsById[target.cardId].controller = command.seatId;
    resolveAvengerForCard({
      state,
      events,
      catalogLookup: sourceLookup,
      cardId: target.cardId,
      destination: decoyOriginZone,
    });
    card.controller = command.seatId;
    moveCard(
      state,
      events,
      command.cardId,
      { kind: "board_row", seat: targetZone.seat, row: targetZone.row },
      "play_card",
      targetIndex,
    );
    events.push({ type: "card_played", seatId: command.seatId, cardId: command.cardId, target: card.zone });
    if (!state.pendingPrompt && card.zone.kind === "board_row") {
      settleMardroemeRow({
        state,
        events,
        catalogLookup: sourceLookup,
        boardSeat: card.zone.seat,
        row: card.zone.row,
        triggerCardId: command.cardId,
      });
    }
  } else if (target.kind === "none" && source.kind === "special" && source.abilities.includes("scorch")) {
    resolveSpecialScorch(
      state,
      events,
      sourceLookup,
      input.catalogCards,
      input.catalogLeaders,
      command.seatId,
      command.cardId,
      source,
    );
  } else {
    throw new EngineRuleError("invalid_target", "Unsupported play target.", { cardId: command.cardId, target });
  }

  handoffTurn(state, events, command.seatId);
  return { state, events };
};

const pass = (input: StatefulCommandInput): EngineTransaction => {
  if (input.state.pendingPrompt) {
    throw new EngineRuleError("prompt_pending", "Pass cannot execute while a prompt is pending.", {
      promptId: input.state.pendingPrompt.promptId,
    });
  }

  if (input.state.phase !== "playing") {
    throw new EngineRuleError("invalid_phase", "Pass can only execute in playing phase.");
  }

  assertLegal(input);
  const state = cloneState(input.state);
  const events: GameEvent[] = [];
  const { seatId } = input.command as Extract<EngineCommand, { type: "Pass" }>;
  const opponent = opponentOf(seatId);

  state.seats[seatId].passed = true;
  events.push({ type: "player_passed", seatId });

  if (state.seats[opponent].passed) {
    const from = state.phase;
    state.phase = "round_end";
    events.push({ type: "phase_changed", from, to: state.phase, reason: "both_passed" });
  } else {
    state.currentTurn = opponent;
    events.push({ type: "turn_set", seatId: opponent, reason: "turn_handoff" });
  }

  return { state, events };
};

const determineRoundResult = (
  state: MatchState,
  catalogCards: readonly CatalogCardSource[],
  catalogLeaders: readonly CatalogLeaderSource[],
): Omit<RoundResult, "round" | "loserGemLoss" | "nextStarter"> & {
  loserGemLoss: Partial<Record<SeatId, number>>;
} => {
  const scores = calculateScores({ state, catalogCards, catalogLeaders });
  const scoreBySeat = scores.totalBySeat;
  let winner: SeatId | "draw" = "draw";
  let factionOutcome: RoundResult["factionOutcome"] = "normal";

  if (scoreBySeat.seat_a > scoreBySeat.seat_b) {
    winner = "seat_a";
  } else if (scoreBySeat.seat_b > scoreBySeat.seat_a) {
    winner = "seat_b";
  } else {
    const nilfgaardSeats = SEATS.filter((seatId) => state.seats[seatId].faction === "nilfgaard");
    if (nilfgaardSeats.length === 1) {
      winner = nilfgaardSeats[0];
      factionOutcome = "nilfgaard_draw_win";
    }
  }

  const loserGemLoss: Partial<Record<SeatId, number>> =
    winner === "draw" ? { seat_a: 1, seat_b: 1 } : { [opponentOf(winner)]: 1 };
  const outcome = winner === "seat_a" ? "seat_a_win" : winner === "seat_b" ? "seat_b_win" : "draw";

  return { scoreBySeat, outcome, winner, loserGemLoss, factionOutcome };
};

const getMonstersKeepCardIds = (
  state: MatchState,
  events: GameEvent[],
  sourceLookup: ReadonlyMap<string, CatalogCardSource>,
) => {
  const rng = createSeededRngFromState(state.rng.seed, state.rng.state);
  let usedRng = false;
  const keepCardIds = new Set<CardInstanceId>();

  SEATS.forEach((seatId) => {
    if (state.seats[seatId].faction !== "monsters") {
      return;
    }

    const eligible = ROWS.flatMap((row) =>
      state.seats[seatId].board[row].units.filter((cardId) => {
        const instance = state.cardsById[cardId];
        const source = instance ? sourceLookup.get(instance.sourceId) : undefined;
        return source?.kind === "unit" && instance.controller === seatId;
      }),
    );
    const keptCardId =
      eligible.length > 1 ? eligible[Math.floor(rng.next() * eligible.length)] : eligible.length === 1 ? eligible[0] : null;
    if (eligible.length > 1) {
      usedRng = true;
    }
    if (keptCardId) {
      keepCardIds.add(keptCardId);
    }
    events.push({
      type: "faction_ability_resolved",
      faction: "monsters",
      seatId,
      ability: "monsters_keep_unit",
      outcome: keptCardId ? "kept" : "no_eligible_cards",
      cardIds: keptCardId ? [keptCardId] : [],
      eligibleCount: eligible.length,
    });
  });

  if (usedRng) {
    state.rng.state = rng.getState();
  }

  return keepCardIds;
};

const sweepBattlefield = (
  state: MatchState,
  events: GameEvent[],
  round: number,
  keepCardIds: ReadonlySet<CardInstanceId>,
  sourceLookup: ReadonlyMap<string, CatalogCardSource>,
) => {
  const movedCardIds: CardInstanceId[] = [];
  const avengerOrigins: Array<{ cardId: CardInstanceId; origin: ZoneRef }> = [];

  SEATS.forEach((seatId) => {
    ROWS.forEach((row) => {
      const unitIds = [...state.seats[seatId].board[row].units];
      unitIds.forEach((cardId) => {
        if (keepCardIds.has(cardId)) {
          return;
        }
        const sourceId = state.cardsById[cardId].sourceId;
        const source = sourceLookup.get(sourceId);
        if (source?.abilities.includes("avenger")) {
          avengerOrigins.push({
            cardId,
            origin: { kind: "board_row", seat: seatId, row },
          });
        }
        moveCard(state, events, cardId, { kind: "discard", seat: seatId }, "round_cleanup");
        movedCardIds.push(cardId);
      });

      const hornId = state.seats[seatId].board[row].horn;
      if (hornId) {
        moveCard(state, events, hornId, { kind: "discard", seat: seatId }, "round_cleanup");
        movedCardIds.push(hornId);
      }
    });
  });

  [...state.weather.entries].forEach((cardId) => {
    const controller = state.cardsById[cardId].controller;
    moveCard(state, events, cardId, { kind: "discard", seat: controller }, "round_cleanup");
    movedCardIds.push(cardId);
  });

  events.push({ type: "board_swept", round, movedCardIds, keptCardIds: [...keepCardIds] });

  avengerOrigins.forEach(({ cardId, origin }) => {
    resolveAvengerForCard({
      state,
      events,
      catalogLookup: sourceLookup,
      cardId,
      destination: origin,
    });
  });
};

const applyNorthernRealmsDraw = (
  state: MatchState,
  events: GameEvent[],
  winner: SeatId | "draw",
) => {
  if (winner === "draw" || state.seats[winner].faction !== "northern_realms") {
    return;
  }

  const cardId = drawOneCard(state, events, winner, "northern_realms_draw");
  events.push({
    type: "faction_ability_resolved",
    faction: "northern_realms",
    seatId: winner,
    ability: "northern_realms_draw_on_win",
    outcome: cardId ? "drew_card" : "deck_empty",
    cardIds: cardId ? [cardId] : [],
  });
};

const firstCatalogRow = (source: CatalogCardSource): CatalogRow => ROWS.find((row) => source.rows.includes(row)) ?? "close";

const applySkelligeRoundThreeReturn = (
  state: MatchState,
  events: GameEvent[],
  sourceLookup: ReadonlyMap<string, CatalogCardSource>,
) => {
  if (state.round !== 3) {
    return;
  }

  const rng = createSeededRngFromState(state.rng.seed, state.rng.state);
  let usedRng = false;

  SEATS.forEach((seatId) => {
    if (state.seats[seatId].faction !== "skellige") {
      return;
    }

    const eligible = state.seats[seatId].discard.filter((cardId) => {
      const instance = state.cardsById[cardId];
      const source = instance ? sourceLookup.get(instance.sourceId) : undefined;
      return source?.kind === "unit";
    });
    const selected = shuffleWithRng(eligible, rng).slice(0, 2);
    if (eligible.length > 1) {
      usedRng = true;
    }
    const policyNotes: string[] = [];

    selected.forEach((cardId) => {
      const source = sourceLookup.get(state.cardsById[cardId].sourceId);
      if (!source) {
        return;
      }
      const row = firstCatalogRow(source);
      if (source.rows.length > 1 || source.abilities.includes("agile")) {
        policyNotes.push(`${cardId}:${row}`);
      }
      moveCard(state, events, cardId, { kind: "board_row", seat: seatId, row }, "skellige_return");
      source.abilities.forEach((abilityId) => {
        if (SKELLIGE_DEFERRED_RETURN_ABILITIES.has(abilityId)) {
          events.push({
            type: "ability_deferred",
            sourceId: source.sourceId,
            cardId,
            abilityId,
            reason: "skellige_return_on_play_pending",
          });
        }
      });
      const returned = state.cardsById[cardId];
      if (returned?.zone.kind === "board_row") {
        settleMardroemeRow({
          state,
          events,
          catalogLookup: sourceLookup,
          boardSeat: returned.zone.seat,
          row: returned.zone.row,
          triggerCardId: cardId,
        });
      }
    });

    events.push({
      type: "faction_ability_resolved",
      faction: "skellige",
      seatId,
      ability: "skellige_round_3_return",
      outcome: selected.length > 0 ? "returned_cards" : "no_eligible_cards",
      cardIds: selected,
      eligibleCount: eligible.length,
      policy: policyNotes.length > 0 ? `first_catalog_row:${policyNotes.join(",")}` : undefined,
    });
  });

  if (usedRng) {
    state.rng.state = rng.getState();
  }
};

const resolveRoundEnd = (input: StatefulCommandInput): EngineTransaction => {
  const command = input.command as Extract<EngineCommand, { type: "ResolveRoundEnd" }>;
  if (command.seatId && !SEATS.includes(command.seatId)) {
    throw new EngineRuleError("illegal_command", "ResolveRoundEnd seatId must be a match seat.", { seatId: command.seatId });
  }
  if (input.state.pendingPrompt) {
    throw new EngineRuleError("prompt_pending", "ResolveRoundEnd cannot execute while a prompt is pending.", {
      promptId: input.state.pendingPrompt.promptId,
    });
  }
  if (input.state.phase !== "round_end") {
    throw new EngineRuleError("invalid_phase", "ResolveRoundEnd can only execute in round_end phase.", {
      phase: input.state.phase,
    });
  }
  if (!input.state.seats.seat_a.passed || !input.state.seats.seat_b.passed) {
    throw new EngineRuleError("illegal_command", "ResolveRoundEnd requires both seats to have passed.");
  }
  if (input.state.lastResolvedRound === input.state.round) {
    throw new EngineRuleError("illegal_command", "This logical round has already been resolved.", {
      round: input.state.round,
    });
  }

  const sourceLookup = createCardLookup(input.catalogCards);
  const state = cloneState(input.state);
  const events: GameEvent[] = [];
  const resolvedRound = state.round;
  const result = determineRoundResult(state, input.catalogCards, input.catalogLeaders);

  if (result.factionOutcome === "nilfgaard_draw_win" && result.winner !== "draw") {
    events.push({
      type: "faction_ability_resolved",
      faction: "nilfgaard",
      seatId: result.winner,
      ability: "nilfgaard_draw_win",
      outcome: "tie_converted_to_round_win",
    });
  }

  events.push({
    type: "round_resolved",
    round: resolvedRound,
    scoreBySeat: result.scoreBySeat,
    winner: result.winner,
    loserGemLoss: result.loserGemLoss,
    factionOutcome: result.factionOutcome ?? "normal",
  });
  events.push({ type: "round_ended", round: resolvedRound, winner: result.winner });

  SEATS.forEach((seatId) => {
    const loss = result.loserGemLoss[seatId] ?? 0;
    if (loss <= 0) {
      return;
    }
    const before = state.seats[seatId].gems;
    const after = Math.max(0, before - loss);
    state.seats[seatId].gems = after;
    events.push({ type: "gems_changed", seatId, before, after, delta: after - before, reason: "round_loss" });
  });

  const seatsOut = SEATS.filter((seatId) => state.seats[seatId].gems <= 0);
  const gameWinner =
    seatsOut.length === 2 ? "draw" : seatsOut.length === 1 ? opponentOf(seatsOut[0]) : null;
  const continues = gameWinner === null;
  const nextStarter =
    result.winner === "draw" ? state.roundStarter : result.winner;
  const roundHistoryEntry: RoundResult = {
    round: resolvedRound,
    scoreBySeat: result.scoreBySeat,
    outcome: result.outcome,
    winner: result.winner,
    loserGemLoss: result.loserGemLoss,
    factionOutcome: result.factionOutcome,
    nextStarter: continues ? nextStarter : undefined,
  };
  state.roundHistory.push(roundHistoryEntry);
  state.lastResolvedRound = resolvedRound;

  const keepCardIds = continues ? getMonstersKeepCardIds(state, events, sourceLookup) : new Set<CardInstanceId>();
  sweepBattlefield(state, events, resolvedRound, keepCardIds, sourceLookup);

  if (!continues) {
    const from = state.phase;
    state.phase = "game_end";
    events.push({ type: "phase_changed", from, to: state.phase, reason: "game_ended" });
    events.push({ type: "game_ended", winner: gameWinner });
    return { state, events };
  }

  applyNorthernRealmsDraw(state, events, result.winner);
  const starterReason = result.winner === "draw" ? "draw_policy" : "round_winner";
  state.round = resolvedRound + 1;
  state.currentTurn = nextStarter;
  state.roundStarter = nextStarter;
  state.pendingPrompt = null;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
  const from = state.phase;
  state.phase = "playing";
  events.push({ type: "phase_changed", from, to: state.phase, reason: "round_resolved" });
  events.push({ type: "turn_set", seatId: nextStarter, reason: starterReason });
  events.push({ type: "round_started", round: state.round, startingSeat: nextStarter, reason: starterReason });
  applySkelligeRoundThreeReturn(state, events, sourceLookup);

  return { state, events };
};

const executeLeader = (input: StatefulCommandInput): EngineTransaction => {
  if (input.state.pendingPrompt) {
    throw new EngineRuleError("prompt_pending", "Leader commands cannot execute while a prompt is pending.", {
      promptId: input.state.pendingPrompt.promptId,
    });
  }

  assertLegal(input);
  const command = input.command as Extract<EngineCommand, { type: "UseLeader" }>;
  const { seatId } = command;
  const leaderLookup = createLeaderLookup(input.catalogLeaders);
  const sourceLookup = createCardLookup(input.catalogCards);
  const inputSeat = input.state.seats[seatId];
  const leader = leaderLookup.get(inputSeat.leaderSourceId);

  if (!inputSeat.leader || !leader) {
    throw new EngineRuleError("missing_catalog_source", "Missing leader source for leader command.", {
      leaderSourceId: inputSeat.leaderSourceId,
    });
  }

  if (leader.ability === "clear_weather") {
    const state = cloneState(input.state);
    const events: GameEvent[] = [];
    const seat = state.seats[seatId];
    clearWeather(state, events, seatId, "leader");
    seat.leaderUsed = true;
    events.push({ type: "leader_used", seatId, leaderCardId: seat.leader as CardInstanceId, abilityId: leader.ability });
    handoffTurn(state, events, seatId);
    return { state, events };
  }

  if (isWeatherLeaderAbility(leader.ability)) {
    const target = command.target as LegalMoveTarget | undefined;
    if (!target || target.kind !== "deck_card_source") {
      throw new EngineRuleError("invalid_target", "Weather-pulling leader requires a deck_card_source target.", {
        leaderSourceId: leader.sourceId,
        ability: leader.ability,
        target,
      });
    }
    if (target.seatId !== seatId) {
      throw new EngineRuleError("invalid_target", "Weather-pulling leader target seat must match the acting seat.", {
        target,
        seatId,
      });
    }

    const targetSource = sourceLookup.get(target.sourceId);
    if (!targetSource || !isEligibleWeatherSourceForLeader(leader.ability, targetSource)) {
      throw new EngineRuleError("invalid_target", "Target source is not eligible for this weather-pulling leader.", {
        leaderSourceId: leader.sourceId,
        ability: leader.ability,
        targetSourceId: target.sourceId,
      });
    }

    const matchingCardId = input.state.seats[seatId].deck.find(
      (cardId) => input.state.cardsById[cardId]?.sourceId === target.sourceId,
    );
    if (!matchingCardId) {
      throw new EngineRuleError("invalid_target", "No matching weather source card in acting deck.", {
        leaderSourceId: leader.sourceId,
        ability: leader.ability,
        targetSourceId: target.sourceId,
      });
    }

    const state = cloneState(input.state);
    const events: GameEvent[] = [];
    const seat = state.seats[seatId];
    const movedCard = state.cardsById[matchingCardId];
    movedCard.controller = seatId;
    moveCard(state, events, matchingCardId, { kind: "weather" }, "leader_weather");
    events.push({ type: "card_played", seatId, cardId: matchingCardId, target: state.cardsById[matchingCardId].zone });
    seat.leaderUsed = true;
    events.push({ type: "leader_used", seatId, leaderCardId: seat.leader as CardInstanceId, abilityId: leader.ability });
    handoffTurn(state, events, seatId);
    return { state, events };
  }

  throw new EngineRuleError("unsupported_command", "Leader ability is not yet executable.", {
    leaderSourceId: leader.sourceId,
    ability: leader.ability,
  });
};

const choosePromptOption = (input: StatefulCommandInput): EngineTransaction => {
  const command = input.command as Extract<EngineCommand, { type: "ChoosePromptOption" }>;
  const prompt = input.state.pendingPrompt;

  if (!prompt) {
    throw new EngineRuleError("illegal_command", "ChoosePromptOption requires a pending prompt.", { command });
  }

  if (prompt.seatId !== command.seatId) {
    throw new EngineRuleError("illegal_command", "Prompt can only be resolved by its seat.", {
      promptSeatId: prompt.seatId,
      commandSeatId: command.seatId,
    });
  }

  if (prompt.promptId !== command.promptId || !prompt.options.some((option) => option.optionId === command.optionId)) {
    throw new EngineRuleError("illegal_command", "Prompt option is not legal.", { command, promptId: prompt.promptId });
  }

  assertLegal(input);
  const state = cloneState(input.state);
  const events: GameEvent[] = [];
  resolvePromptOption({
    state,
    events,
    catalogCards: input.catalogCards,
    catalogLeaders: input.catalogLeaders,
    seatId: command.seatId,
    optionId: command.optionId,
  });
  handoffTurn(state, events, command.seatId);
  return { state, events, prompt: state.pendingPrompt ?? undefined };
};

export function executeCommand(command: EngineCommand): EngineTransaction;
export function executeCommand(input: StatefulCommandInput): EngineTransaction;
export function executeCommand(input: CommandInput): EngineTransaction {
  if ("type" in input) {
    if (input.type === "StartMatch") {
      return startMatch(input.config);
    }
    throw new EngineRuleError("missing_catalog_source", "Stateful commands require state and catalog inputs.", {
      command: input,
    });
  }

  switch (input.command.type) {
    case "ChooseMulligan":
      return chooseMulligan(input);
    case "PlayCard":
      return playCard(input);
    case "Pass":
      return pass(input);
    case "ResolveRoundEnd":
      return resolveRoundEnd(input);
    case "UseLeader":
      return executeLeader(input);
    case "ChoosePromptOption":
      return choosePromptOption(input);
  }
}
