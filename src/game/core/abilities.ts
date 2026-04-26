import type { CatalogAbilityId, CatalogCardSource, CatalogRow } from "@/game/catalog";

import { createSeededRngFromState, shuffleWithRng } from "./rng";
import { calculateScores, findUnitScorchCloseTargets } from "./scoring";
import type {
  CardInstanceId,
  GameEvent,
  MatchState,
  PendingPrompt,
  PendingPromptOption,
  SeatId,
  ZoneRef,
} from "./types";

export interface AbilityResolverInput {
  state: MatchState;
  events: GameEvent[];
  catalogCards: readonly CatalogCardSource[];
  seatId: SeatId;
  cardId: CardInstanceId;
}

export interface PromptResolutionInput {
  state: MatchState;
  events: GameEvent[];
  catalogCards: readonly CatalogCardSource[];
  seatId: SeatId;
  optionId: string;
}

const ONGOING_STATE_ABILITIES = new Set<CatalogAbilityId>([
  "tight_bond",
  "morale_boost",
  "commanders_horn",
  "agile",
]);

const PLANNED_DEFERRED_ABILITIES = new Set<CatalogAbilityId>(["summon", "avenger", "mardroeme", "berserker"]);
const opponentOf = (seatId: SeatId): SeatId => (seatId === "seat_a" ? "seat_b" : "seat_a");

const createCardLookup = (catalogCards: readonly CatalogCardSource[]) =>
  new Map(catalogCards.map((card) => [card.sourceId, card]));

const removeFromArray = (items: CardInstanceId[], cardId: CardInstanceId) => {
  const index = items.indexOf(cardId);
  if (index >= 0) {
    items.splice(index, 1);
  }
};

const removeFromCurrentZone = (state: MatchState, cardId: CardInstanceId) => {
  const card = state.cardsById[cardId];
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

const addToZone = (state: MatchState, cardId: CardInstanceId, to: ZoneRef) => {
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
    case "board_row":
      state.seats[to.seat].board[to.row].units.push(cardId);
      break;
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
) => {
  const card = state.cardsById[cardId];
  const from = card.zone;
  removeFromCurrentZone(state, cardId);
  addToZone(state, cardId, to);
  card.zone = to;
  events.push({ type: "card_moved", cardId, sourceId: card.sourceId, from, to, reason });
};

const emitTriggered = (events: GameEvent[], source: CatalogCardSource, cardId: CardInstanceId, abilityId: CatalogAbilityId) => {
  events.push({ type: "ability_triggered", sourceId: source.sourceId, cardId, abilityId });
};

const emitResolved = (
  events: GameEvent[],
  source: CatalogCardSource,
  cardId: CardInstanceId,
  abilityId: CatalogAbilityId,
  outcome?: string,
) => {
  events.push({ type: "ability_resolved", sourceId: source.sourceId, cardId, abilityId, outcome });
};

const emitDeferred = (
  events: GameEvent[],
  source: CatalogCardSource,
  cardId: CardInstanceId,
  abilityId: CatalogAbilityId,
  reason: string,
) => {
  events.push({ type: "ability_deferred", sourceId: source.sourceId, cardId, abilityId, reason });
};

const emitDiscardTriggerDeferrals = (
  events: GameEvent[],
  targetSource: CatalogCardSource | undefined,
  targetCardId: CardInstanceId,
) => {
  targetSource?.abilities.forEach((abilityId) => {
    if (abilityId === "summon" || abilityId === "avenger") {
      emitDeferred(events, targetSource, targetCardId, abilityId, "discard_trigger_pending");
    }
  });
};

const drawCards = (state: MatchState, events: GameEvent[], seatId: SeatId, count: number) => {
  const drawn = state.seats[seatId].deck.slice(0, count);
  drawn.forEach((cardId) => {
    const sourceId = state.cardsById[cardId].sourceId;
    moveCard(state, events, cardId, { kind: "hand", seat: seatId }, "ability_draw");
    events.push({ type: "card_drawn", seatId, cardId, sourceId });
  });
  return drawn;
};

const getSingleRow = (source: CatalogCardSource): CatalogRow | null => (source.rows.length === 1 ? source.rows[0] : null);

const buildMedicOptions = (
  state: MatchState,
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  seatId: SeatId,
): PendingPromptOption[] =>
  state.seats[seatId].discard.flatMap((cardId) => {
    const instance = state.cardsById[cardId];
    const source = catalogLookup.get(instance.sourceId);

    if (!source || source.kind !== "unit") {
      return [];
    }

    return source.rows.map((row) => {
      const targetSide = source.abilities.includes("spy") ? "opponent" : "own";
      return {
        optionId: `revive:${cardId}:${row}`,
        label: `${source.name} to ${targetSide} ${row}`,
        target: {
          kind: "card_instance" as const,
          cardId,
          sourceId: source.sourceId,
          row,
        },
      };
    });
  });

const openMedicPrompt = (
  state: MatchState,
  events: GameEvent[],
  source: CatalogCardSource,
  cardId: CardInstanceId,
  seatId: SeatId,
  options: PendingPromptOption[],
) => {
  const prompt: PendingPrompt = {
    promptId: `prompt:${state.round}:${seatId}:${cardId}:medic`,
    seatId,
    kind: "medic_revive",
    sourceCardId: cardId,
    sourceId: source.sourceId,
    abilityId: "medic",
    options,
  };
  state.pendingPrompt = prompt;
  events.push({ type: "prompt_opened", prompt });
};

const resolveSpy = (state: MatchState, events: GameEvent[], source: CatalogCardSource, seatId: SeatId, cardId: CardInstanceId) => {
  emitTriggered(events, source, cardId, "spy");
  drawCards(state, events, seatId, 2);
  emitResolved(events, source, cardId, "spy");
};

const resolveMedic = (
  state: MatchState,
  events: GameEvent[],
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  source: CatalogCardSource,
  seatId: SeatId,
  cardId: CardInstanceId,
) => {
  emitTriggered(events, source, cardId, "medic");
  const options = buildMedicOptions(state, catalogLookup, seatId);
  if (options.length === 0) {
    emitResolved(events, source, cardId, "medic", "no_targets");
    return;
  }
  openMedicPrompt(state, events, source, cardId, seatId, options);
};

const resolveMusterLike = (
  state: MatchState,
  events: GameEvent[],
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  source: CatalogCardSource,
  seatId: SeatId,
  cardId: CardInstanceId,
  abilityId: "muster" | "muster_roach",
) => {
  emitTriggered(events, source, cardId, abilityId);
  const linked = new Set(source.linkedSourceIds ?? []);
  let pulledFromDeck = false;
  let moved = 0;

  if (linked.size === 0) {
    emitResolved(events, source, cardId, abilityId, "no_linked_sources");
    return;
  }

  const candidates = [...state.seats[seatId].hand, ...state.seats[seatId].deck].filter((candidateId) =>
    linked.has(state.cardsById[candidateId].sourceId),
  );

  candidates.forEach((candidateId) => {
    const candidate = state.cardsById[candidateId];
    const candidateSource = catalogLookup.get(candidate.sourceId);
    const row = candidateSource ? getSingleRow(candidateSource) : null;

    if (!candidateSource || !row) {
      if (candidateSource) {
        emitDeferred(events, candidateSource, candidateId, abilityId, "requires_row_choice");
      }
      return;
    }

    pulledFromDeck ||= candidate.zone.kind === "deck";
    candidate.controller = seatId;
    moveCard(state, events, candidateId, { kind: "board_row", seat: seatId, row }, "ability_muster");
    events.push({ type: "card_played", seatId, cardId: candidateId, target: candidate.zone });
    moved += 1;
  });

  if (pulledFromDeck) {
    const rng = createSeededRngFromState(state.rng.seed, state.rng.state);
    state.seats[seatId].deck = shuffleWithRng(state.seats[seatId].deck, rng);
    state.rng.state = rng.getState();
    events.push({ type: "deck_shuffled", seatId, reason: "muster" });
  }

  emitResolved(events, source, cardId, abilityId, moved === 0 ? "no_targets" : "played_linked");
};

const resolveScorchClose = (
  state: MatchState,
  events: GameEvent[],
  catalogCards: readonly CatalogCardSource[],
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  source: CatalogCardSource,
  seatId: SeatId,
  cardId: CardInstanceId,
) => {
  emitTriggered(events, source, cardId, "scorch_close");
  const breakdown = calculateScores({ state, catalogCards });
  const result = findUnitScorchCloseTargets(breakdown, seatId);

  result.targets.forEach((target) => {
    moveCard(state, events, target.cardId, { kind: "discard", seat: target.seatId }, "scorch_destroyed");
    emitDiscardTriggerDeferrals(events, catalogLookup.get(target.sourceId), target.cardId);
  });

  events.push({
    type: "scorch_resolved",
    sourceId: source.sourceId,
    cardId,
    abilityId: "scorch_close",
    targetCardIds: result.targets.map((target) => target.cardId),
    outcome: result.outcome,
  });
  emitResolved(events, source, cardId, "scorch_close", result.outcome);
};

export const resolveCardAbilities = ({ state, events, catalogCards, seatId, cardId }: AbilityResolverInput) => {
  const catalogLookup = createCardLookup(catalogCards);
  const source = catalogLookup.get(state.cardsById[cardId].sourceId);

  if (!source || state.pendingPrompt) {
    return;
  }

  source.abilities.forEach((abilityId) => {
    if (abilityId === "none" || state.pendingPrompt) {
      return;
    }

    if (abilityId === "spy") {
      resolveSpy(state, events, source, seatId, cardId);
    } else if (abilityId === "medic") {
      resolveMedic(state, events, catalogLookup, source, seatId, cardId);
    } else if (abilityId === "muster") {
      resolveMusterLike(state, events, catalogLookup, source, seatId, cardId, "muster");
    } else if (abilityId === "muster_roach") {
      resolveMusterLike(state, events, catalogLookup, source, seatId, cardId, "muster_roach");
    } else if (abilityId === "scorch_close") {
      resolveScorchClose(state, events, catalogCards, catalogLookup, source, seatId, cardId);
    } else if (abilityId === "scorch") {
      emitTriggered(events, source, cardId, abilityId);
      emitDeferred(events, source, cardId, abilityId, "requires_special_resolution");
    } else if (ONGOING_STATE_ABILITIES.has(abilityId)) {
      emitTriggered(events, source, cardId, abilityId);
      emitResolved(events, source, cardId, abilityId, "represented_by_board_state");
    } else if (PLANNED_DEFERRED_ABILITIES.has(abilityId)) {
      emitTriggered(events, source, cardId, abilityId);
      emitDeferred(events, source, cardId, abilityId, "planned_ability");
    }
  });
};

export const resolvePromptOption = ({ state, events, catalogCards, seatId, optionId }: PromptResolutionInput) => {
  const prompt = state.pendingPrompt;
  if (!prompt) {
    return;
  }

  const option = prompt.options.find((candidate) => candidate.optionId === optionId);
  if (!option || prompt.kind !== "medic_revive") {
    return;
  }

  const revivedId = option.target.cardId;
  const revived = state.cardsById[revivedId];
  const catalogLookup = createCardLookup(catalogCards);
  const revivedSource = catalogLookup.get(revived.sourceId);
  const boardSeat = revivedSource?.abilities.includes("spy") ? opponentOf(seatId) : seatId;
  revived.controller = seatId;
  moveCard(state, events, revivedId, { kind: "board_row", seat: boardSeat, row: option.target.row }, "medic_revive");
  events.push({ type: "prompt_resolved", promptId: prompt.promptId, seatId, optionId });
  events.push({ type: "card_played", seatId, cardId: revivedId, target: revived.zone });
  state.pendingPrompt = null;

  const source = catalogLookup.get(prompt.sourceId ?? "");
  if (source) {
    events.push({
      type: "ability_resolved",
      sourceId: source.sourceId,
      cardId: prompt.sourceCardId ?? revivedId,
      abilityId: prompt.abilityId,
      outcome: "revived_card",
    });
  }

  resolveCardAbilities({ state, events, catalogCards, seatId, cardId: revivedId });
};
