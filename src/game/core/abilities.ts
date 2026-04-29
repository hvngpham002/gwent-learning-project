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

const PLANNED_DEFERRED_ABILITIES = new Set<CatalogAbilityId>(["summon", "avenger"]);
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
  const from = card.zone;
  removeFromCurrentZone(state, cardId);
  addToZone(state, cardId, to, boardIndex);
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
  const placedCardIds: CardInstanceId[] = [];

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
    placedCardIds.push(candidateId);
    moved += 1;
  });

  if (pulledFromDeck) {
    const rng = createSeededRngFromState(state.rng.seed, state.rng.state);
    state.seats[seatId].deck = shuffleWithRng(state.seats[seatId].deck, rng);
    state.rng.state = rng.getState();
    events.push({ type: "deck_shuffled", seatId, reason: "muster" });
  }

  emitResolved(events, source, cardId, abilityId, moved === 0 ? "no_targets" : "played_linked");

  placedCardIds.forEach((placedId) => {
    const placed = state.cardsById[placedId];
    if (placed?.zone.kind === "board_row") {
      settleMardroemeRow({
        state,
        events,
        catalogLookup,
        boardSeat: placed.zone.seat,
        row: placed.zone.row,
        triggerCardId: placedId,
      });
    }
  });
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

export interface SettleMardroemeRowInput {
  state: MatchState;
  events: GameEvent[];
  catalogLookup: ReadonlyMap<string, CatalogCardSource>;
  boardSeat: SeatId;
  row: CatalogRow;
  triggerCardId: CardInstanceId;
}

export type SettleMardroemeOutcome =
  | "no_mardroeme"
  | "no_targets"
  | "transformed";

export interface SettleMardroemeRowResult {
  outcome: SettleMardroemeOutcome;
  transformedCount: number;
}

const hasAbility = (source: CatalogCardSource | undefined, ability: CatalogAbilityId) =>
  Boolean(source?.abilities.includes(ability));

const findMardroemeOnRow = (
  state: MatchState,
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  boardSeat: SeatId,
  row: CatalogRow,
): CardInstanceId[] =>
  state.seats[boardSeat].board[row].units.filter((cardId) => {
    const instance = state.cardsById[cardId];
    const source = instance ? catalogLookup.get(instance.sourceId) : undefined;
    return hasAbility(source, "mardroeme");
  });

const findBerserkersOnRow = (
  state: MatchState,
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  boardSeat: SeatId,
  row: CatalogRow,
): CardInstanceId[] =>
  state.seats[boardSeat].board[row].units.filter((cardId) => {
    const instance = state.cardsById[cardId];
    const source = instance ? catalogLookup.get(instance.sourceId) : undefined;
    return hasAbility(source, "berserker");
  });

const transformBerserker = (
  state: MatchState,
  events: GameEvent[],
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  triggerCardId: CardInstanceId,
  berserkerId: CardInstanceId,
): "transformed" | "missing_transform_link" | "missing_transform_replacement" => {
  const berserker = state.cardsById[berserkerId];
  const berserkerSource = catalogLookup.get(berserker.sourceId);
  const replacementSourceId = berserkerSource?.linkedSourceIds?.[0];

  if (!berserkerSource || !replacementSourceId) {
    events.push({
      type: "ability_resolved",
      sourceId: berserker.sourceId,
      cardId: berserkerId,
      abilityId: "berserker",
      outcome: "missing_transform_link",
    });
    return "missing_transform_link";
  }

  const controllerSeat = berserker.controller;
  const replacementId = state.seats[controllerSeat].sideDeck.find(
    (sideId) => state.cardsById[sideId]?.sourceId === replacementSourceId,
  );

  if (!replacementId) {
    events.push({
      type: "ability_resolved",
      sourceId: berserker.sourceId,
      cardId: berserkerId,
      abilityId: "berserker",
      outcome: "missing_transform_replacement",
    });
    return "missing_transform_replacement";
  }

  const berserkerZone = berserker.zone;
  if (berserkerZone.kind !== "board_row") {
    events.push({
      type: "ability_resolved",
      sourceId: berserker.sourceId,
      cardId: berserkerId,
      abilityId: "berserker",
      outcome: "missing_transform_replacement",
    });
    return "missing_transform_replacement";
  }

  const boardSeat = berserkerZone.seat;
  const row = berserkerZone.row;
  const positionIndex = state.seats[boardSeat].board[row].units.indexOf(berserkerId);

  moveCard(
    state,
    events,
    berserkerId,
    { kind: "removed_from_game", seat: controllerSeat },
    "mardroeme_transform",
  );

  const replacement = state.cardsById[replacementId];
  replacement.controller = controllerSeat;
  moveCard(
    state,
    events,
    replacementId,
    { kind: "board_row", seat: boardSeat, row },
    "mardroeme_transform",
    positionIndex >= 0 ? positionIndex : undefined,
  );

  events.push({
    type: "card_transformed",
    triggerCardId,
    fromCardId: berserkerId,
    fromSourceId: berserker.sourceId,
    toCardId: replacementId,
    toSourceId: replacement.sourceId,
    seatId: boardSeat,
    row,
    abilityId: "berserker",
  });

  events.push({
    type: "ability_resolved",
    sourceId: berserker.sourceId,
    cardId: berserkerId,
    abilityId: "berserker",
    outcome: "transformed",
  });

  return "transformed";
};

export const settleMardroemeRow = ({
  state,
  events,
  catalogLookup,
  boardSeat,
  row,
  triggerCardId,
}: SettleMardroemeRowInput): SettleMardroemeRowResult => {
  const mardroemeIds = findMardroemeOnRow(state, catalogLookup, boardSeat, row);
  if (mardroemeIds.length === 0) {
    return { outcome: "no_mardroeme", transformedCount: 0 };
  }

  mardroemeIds.forEach((mardroemeId) => {
    const mardroemeInstance = state.cardsById[mardroemeId];
    const mardroemeSource = mardroemeInstance ? catalogLookup.get(mardroemeInstance.sourceId) : undefined;
    if (mardroemeSource) {
      emitTriggered(events, mardroemeSource, mardroemeId, "mardroeme");
    }
  });

  let totalTransformed = 0;
  const visitedBerserkerIds = new Set<CardInstanceId>();
  const SETTLE_GUARD_LIMIT = 16;

  for (let pass = 0; pass < SETTLE_GUARD_LIMIT; pass += 1) {
    const stillHasMardroeme = findMardroemeOnRow(state, catalogLookup, boardSeat, row).length > 0;
    if (!stillHasMardroeme) {
      break;
    }
    const berserkerIds = findBerserkersOnRow(state, catalogLookup, boardSeat, row).filter(
      (id) => !visitedBerserkerIds.has(id),
    );
    if (berserkerIds.length === 0) {
      break;
    }
    let transformedThisPass = 0;
    berserkerIds.forEach((berserkerId) => {
      visitedBerserkerIds.add(berserkerId);
      const result = transformBerserker(state, events, catalogLookup, triggerCardId, berserkerId);
      if (result === "transformed") {
        transformedThisPass += 1;
      }
    });
    totalTransformed += transformedThisPass;
    if (transformedThisPass === 0) {
      break;
    }
  }

  mardroemeIds.forEach((mardroemeId) => {
    const mardroemeInstance = state.cardsById[mardroemeId];
    const mardroemeSource = mardroemeInstance ? catalogLookup.get(mardroemeInstance.sourceId) : undefined;
    if (mardroemeSource) {
      events.push({
        type: "ability_resolved",
        sourceId: mardroemeSource.sourceId,
        cardId: mardroemeId,
        abilityId: "mardroeme",
        outcome: totalTransformed > 0 ? "transformed" : "no_targets",
      });
    }
  });

  return {
    outcome: totalTransformed > 0 ? "transformed" : "no_targets",
    transformedCount: totalTransformed,
  };
};

export const settleMardroemeForCard = ({
  state,
  events,
  catalogCards,
  cardId,
}: {
  state: MatchState;
  events: GameEvent[];
  catalogCards: readonly CatalogCardSource[];
  cardId: CardInstanceId;
}) => {
  const catalogLookup = createCardLookup(catalogCards);
  const instance = state.cardsById[cardId];
  if (!instance) {
    return { outcome: "no_mardroeme" as SettleMardroemeOutcome, transformedCount: 0 };
  }
  const zone = instance.zone;
  if (zone.kind !== "board_row") {
    return { outcome: "no_mardroeme" as SettleMardroemeOutcome, transformedCount: 0 };
  }
  return settleMardroemeRow({
    state,
    events,
    catalogLookup,
    boardSeat: zone.seat,
    row: zone.row,
    triggerCardId: cardId,
  });
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
    } else if (abilityId === "berserker") {
      emitTriggered(events, source, cardId, abilityId);
      emitDeferred(events, source, cardId, abilityId, "awaits_mardroeme");
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

  if (revived.zone.kind === "board_row") {
    settleMardroemeRow({
      state,
      events,
      catalogLookup,
      boardSeat: revived.zone.seat,
      row: revived.zone.row,
      triggerCardId: revivedId,
    });
  }
};
