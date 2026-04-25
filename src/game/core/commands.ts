import type { CatalogAbilityId, CatalogCardSource, CatalogLeaderSource } from "@/game/catalog";

import { getLegalMoves, type LegalMoveTarget } from "./legalMoves";
import { createSeededRngFromState, shuffleWithRng } from "./rng";
import { startMatch } from "./setup";
import type {
  CardInstanceId,
  EngineCommand,
  EngineTransaction,
  GameEvent,
  MatchState,
  SeatId,
  ZoneRef,
} from "./types";

export type EngineRuleErrorCode =
  | "illegal_command"
  | "unsupported_command"
  | "invalid_phase"
  | "invalid_target"
  | "missing_card"
  | "missing_catalog_source";

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
  command: Exclude<EngineCommand, { type: "StartMatch" } | { type: "ChoosePromptOption" }>;
  catalogCards: readonly CatalogCardSource[];
  catalogLeaders: readonly CatalogLeaderSource[];
}

type CommandInput = EngineCommand | StatefulCommandInput;

const WEATHER_ABILITIES = new Set<CatalogAbilityId>(["frost", "fog", "rain", "skellige_storm"]);
const DEFERRED_ON_PLAY_ABILITIES = new Set<CatalogAbilityId>([
  "spy",
  "medic",
  "muster",
  "tight_bond",
  "morale_boost",
  "commanders_horn",
  "mardroeme",
  "berserker",
  "summon",
  "avenger",
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

const handoffTurn = (state: MatchState, events: GameEvent[], seatId: SeatId) => {
  const opponent = opponentOf(seatId);
  if (!state.seats[opponent].passed) {
    state.currentTurn = opponent;
    events.push({ type: "turn_set", seatId: opponent, reason: "turn_handoff" });
  }
};

const emitDeferredAbilities = (
  events: GameEvent[],
  cardId: CardInstanceId,
  source: CatalogCardSource,
  excluded: readonly CatalogAbilityId[] = [],
) => {
  source.abilities.forEach((abilityId) => {
    if (excluded.includes(abilityId) || abilityId === "none") {
      return;
    }
    if (DEFERRED_ON_PLAY_ABILITIES.has(abilityId)) {
      events.push({ type: "ability_deferred", sourceId: source.sourceId, cardId, abilityId });
    }
  });
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

  selected.forEach((cardId) => {
    removeFromArray(state.seats[seatId].hand, cardId);
  });

  const drawn = state.seats[seatId].deck.slice(0, selected.length);
  drawn.forEach((cardId) => moveCard(state, events, cardId, { kind: "hand", seat: seatId }, "mulligan_draw"));

  selected.forEach((cardId) => moveCard(state, events, cardId, { kind: "deck", seat: seatId }, "mulligan_return"));

  state.seats[seatId].deck = shuffleWithRng(state.seats[seatId].deck, rng);
  state.rng.state = rng.getState();
  state.seats[seatId].mulliganComplete = true;
  events.push({ type: "mulligan_chosen", seatId, cardIds: selected, drawCount: drawn.length });

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

const playCard = (input: StatefulCommandInput): EngineTransaction => {
  assertLegal(input);
  const sourceLookup = createCardLookup(input.catalogCards);
  const state = cloneState(input.state);
  const events: GameEvent[] = [];
  const command = input.command as Extract<EngineCommand, { type: "PlayCard" }>;
  const source = getCardSource(sourceLookup, state, command.cardId);
  const target = command.target as LegalMoveTarget;
  const card = state.cardsById[command.cardId];

  if (source.kind === "special" && source.abilities.includes("scorch")) {
    throw new EngineRuleError("unsupported_command", "Scorch execution is reserved for the ability resolver phase.", {
      cardId: command.cardId,
      sourceId: source.sourceId,
    });
  }

  if (target.kind === "board_row") {
    card.controller = command.seatId;
    moveCard(state, events, command.cardId, { kind: "board_row", seat: target.seatId, row: target.row }, "play_card");
    events.push({ type: "card_played", seatId: command.seatId, cardId: command.cardId, target: card.zone });
    emitDeferredAbilities(events, command.cardId, source);
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

    moveCard(state, events, target.cardId, { kind: "hand", seat: command.seatId }, "decoy_return");
    state.cardsById[target.cardId].controller = command.seatId;
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
  } else {
    throw new EngineRuleError("invalid_target", "Unsupported play target.", { cardId: command.cardId, target });
  }

  handoffTurn(state, events, command.seatId);
  return { state, events };
};

const pass = (input: StatefulCommandInput): EngineTransaction => {
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

const executeLeader = (input: StatefulCommandInput): EngineTransaction => {
  assertLegal(input);
  const state = cloneState(input.state);
  const events: GameEvent[] = [];
  const { seatId } = input.command as Extract<EngineCommand, { type: "UseLeader" }>;
  const leaderLookup = createLeaderLookup(input.catalogLeaders);
  const seat = state.seats[seatId];
  const leader = leaderLookup.get(seat.leaderSourceId);

  if (!seat.leader || !leader) {
    throw new EngineRuleError("missing_catalog_source", "Missing leader source for leader command.", {
      leaderSourceId: seat.leaderSourceId,
    });
  }

  if (leader.ability !== "clear_weather") {
    throw new EngineRuleError("unsupported_command", "Only leader Clear Weather is executable in this phase.", {
      leaderSourceId: leader.sourceId,
      ability: leader.ability,
    });
  }

  clearWeather(state, events, seatId, "leader");
  seat.leaderUsed = true;
  events.push({ type: "leader_used", seatId, leaderCardId: seat.leader, abilityId: leader.ability });
  handoffTurn(state, events, seatId);

  return { state, events };
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
    case "UseLeader":
      return executeLeader(input);
  }
}
