import type { CatalogAbilityId, CatalogCardSource, CatalogLeaderSource, CatalogRow } from "@/game/catalog";

import {
  chooseRandomMedicCandidate,
  getRandomMedicCandidates,
  hasRandomMedicPolicyForSeat,
} from "./leaderRandomMedic";
import { buildDeckDrawOptions } from "./leaderDiscardDraw";
import { createSeededRngFromState, shuffleWithRng } from "./rng";
import {
  calculateScores,
  findSpecialScorchTargets,
  findUnitScorchRowTargets,
} from "./scoring";
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
  catalogLeaders?: readonly CatalogLeaderSource[];
  seatId: SeatId;
  cardId: CardInstanceId;
}

export interface PromptResolutionInput {
  state: MatchState;
  events: GameEvent[];
  catalogCards: readonly CatalogCardSource[];
  catalogLeaders?: readonly CatalogLeaderSource[];
  seatId: SeatId;
  optionId: string;
}

const ONGOING_STATE_ABILITIES = new Set<CatalogAbilityId>([
  "tight_bond",
  "morale_boost",
  "commanders_horn",
  "agile",
]);

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

// cCp17 promoted `summon` from `planned` to `implemented`. Its discard
// trigger now resolves directly through `resolveSummonForCard` at each
// discard call site, so the Scorch helpers below no longer emit
// `ability_deferred` for `summon`. Avenger discard-trigger deferrals stay in
// `commands.ts` to preserve their existing event-trace shape.

export interface ResolveAvengerInput {
  state: MatchState;
  events: GameEvent[];
  catalogLookup: ReadonlyMap<string, CatalogCardSource>;
  cardId: CardInstanceId;
  destination?: ZoneRef;
}

export type AvengerResolutionOutcome =
  | "no_avenger"
  | "missing_link"
  | "missing_replacement"
  | "missing_origin_row"
  | "summoned";

export const resolveAvengerForCard = ({
  state,
  events,
  catalogLookup,
  cardId,
  destination,
}: ResolveAvengerInput): AvengerResolutionOutcome => {
  const instance = state.cardsById[cardId];
  if (!instance) {
    return "no_avenger";
  }
  const source = catalogLookup.get(instance.sourceId);
  if (!source || !source.abilities.includes("avenger")) {
    return "no_avenger";
  }
  const replacementSourceId = source.linkedSourceIds?.[0];
  if (!replacementSourceId) {
    events.push({
      type: "ability_resolved",
      sourceId: source.sourceId,
      cardId,
      abilityId: "avenger",
      outcome: "missing_link",
    });
    return "missing_link";
  }
  const controllerSeat = instance.controller;
  const replacementId = state.seats[controllerSeat].sideDeck.find(
    (sideId) => state.cardsById[sideId]?.sourceId === replacementSourceId,
  );
  if (!replacementId) {
    events.push({
      type: "ability_resolved",
      sourceId: source.sourceId,
      cardId,
      abilityId: "avenger",
      outcome: "missing_replacement",
    });
    return "missing_replacement";
  }

  let originSeat: SeatId | null = null;
  let originRow: CatalogRow | null = null;
  if (destination?.kind === "board_row") {
    originSeat = destination.seat;
    originRow = destination.row;
  } else if (instance.zone.kind === "board_row") {
    originSeat = instance.zone.seat;
    originRow = instance.zone.row;
  }

  if (!originSeat || !originRow) {
    events.push({
      type: "ability_resolved",
      sourceId: source.sourceId,
      cardId,
      abilityId: "avenger",
      outcome: "missing_origin_row",
    });
    return "missing_origin_row";
  }

  const replacement = state.cardsById[replacementId];
  replacement.controller = controllerSeat;
  moveCard(
    state,
    events,
    replacementId,
    { kind: "board_row", seat: originSeat, row: originRow },
    "avenger_summon",
  );

  events.push({
    type: "card_summoned",
    triggerCardId: cardId,
    fromSourceId: source.sourceId,
    toCardId: replacementId,
    toSourceId: replacement.sourceId,
    seatId: originSeat,
    row: originRow,
    abilityId: "avenger",
  });

  events.push({
    type: "ability_resolved",
    sourceId: source.sourceId,
    cardId,
    abilityId: "avenger",
    outcome: "summoned",
  });

  return "summoned";
};

export interface ResolveSummonInput {
  state: MatchState;
  events: GameEvent[];
  catalogLookup: ReadonlyMap<string, CatalogCardSource>;
  cardId: CardInstanceId;
  origin?: ZoneRef;
}

export type SummonResolutionOutcome =
  | "no_summon"
  | "missing_link"
  | "missing_replacement"
  | "missing_origin_row"
  | "summoned";

export const resolveSummonForCard = ({
  state,
  events,
  catalogLookup,
  cardId,
  origin,
}: ResolveSummonInput): SummonResolutionOutcome => {
  const instance = state.cardsById[cardId];
  if (!instance) {
    return "no_summon";
  }
  const source = catalogLookup.get(instance.sourceId);
  if (!source || !source.abilities.includes("summon")) {
    return "no_summon";
  }
  const replacementSourceId = source.linkedSourceIds?.[0];
  if (!replacementSourceId) {
    events.push({
      type: "ability_resolved",
      sourceId: source.sourceId,
      cardId,
      abilityId: "summon",
      outcome: "missing_link",
    });
    return "missing_link";
  }
  const controllerSeat = instance.controller;
  const replacementId = state.seats[controllerSeat].sideDeck.find(
    (sideId) => state.cardsById[sideId]?.sourceId === replacementSourceId,
  );
  if (!replacementId) {
    events.push({
      type: "ability_resolved",
      sourceId: source.sourceId,
      cardId,
      abilityId: "summon",
      outcome: "missing_replacement",
    });
    return "missing_replacement";
  }

  let originSeat: SeatId | null = null;
  let originRow: CatalogRow | null = null;
  if (origin?.kind === "board_row") {
    originSeat = origin.seat;
    originRow = origin.row;
  } else if (instance.zone.kind === "board_row") {
    originSeat = instance.zone.seat;
    originRow = instance.zone.row;
  }

  if (!originSeat || !originRow) {
    events.push({
      type: "ability_resolved",
      sourceId: source.sourceId,
      cardId,
      abilityId: "summon",
      outcome: "missing_origin_row",
    });
    return "missing_origin_row";
  }

  const replacement = state.cardsById[replacementId];
  replacement.controller = controllerSeat;
  moveCard(
    state,
    events,
    replacementId,
    { kind: "board_row", seat: originSeat, row: originRow },
    "summon_replacement",
  );

  events.push({
    type: "card_summoned",
    triggerCardId: cardId,
    fromSourceId: source.sourceId,
    toCardId: replacementId,
    toSourceId: replacement.sourceId,
    seatId: originSeat,
    row: originRow,
    abilityId: "summon",
  });

  events.push({
    type: "ability_resolved",
    sourceId: source.sourceId,
    cardId,
    abilityId: "summon",
    outcome: "summoned",
  });

  return "summoned";
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

interface PlaceMedicRevivalInput {
  state: MatchState;
  events: GameEvent[];
  catalogCards: readonly CatalogCardSource[];
  catalogLeaders?: readonly CatalogLeaderSource[];
  catalogLookup: ReadonlyMap<string, CatalogCardSource>;
  actingSeatId: SeatId;
  revivedCardId: CardInstanceId;
  boardSeat: SeatId;
  row: CatalogRow;
  medicSourceId: string;
  medicSourceCardId: CardInstanceId;
  abilityId: string;
  outcome: string;
}

const placeMedicRevival = ({
  state,
  events,
  catalogCards,
  catalogLeaders,
  catalogLookup,
  actingSeatId,
  revivedCardId,
  boardSeat,
  row,
  medicSourceId,
  medicSourceCardId,
  abilityId,
  outcome,
}: PlaceMedicRevivalInput) => {
  const revived = state.cardsById[revivedCardId];
  revived.controller = actingSeatId;
  moveCard(state, events, revivedCardId, { kind: "board_row", seat: boardSeat, row }, "medic_revive");
  events.push({ type: "card_played", seatId: actingSeatId, cardId: revivedCardId, target: revived.zone });
  events.push({
    type: "ability_resolved",
    sourceId: medicSourceId,
    cardId: medicSourceCardId,
    abilityId,
    outcome,
  });

  resolveCardAbilities({
    state,
    events,
    catalogCards,
    catalogLeaders,
    seatId: actingSeatId,
    cardId: revivedCardId,
  });

  if (revived.zone.kind === "board_row") {
    settleMardroemeRow({
      state,
      events,
      catalogLookup,
      boardSeat: revived.zone.seat,
      row: revived.zone.row,
      triggerCardId: revivedCardId,
    });
  }
};

const resolveMedic = (
  state: MatchState,
  events: GameEvent[],
  catalogCards: readonly CatalogCardSource[],
  catalogLeaders: readonly CatalogLeaderSource[] | undefined,
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  source: CatalogCardSource,
  seatId: SeatId,
  cardId: CardInstanceId,
) => {
  emitTriggered(events, source, cardId, "medic");

  const useRandomPolicy =
    source.kind !== "hero" &&
    hasRandomMedicPolicyForSeat({ state, seatId, catalogLeaders });

  if (useRandomPolicy) {
    const candidates = getRandomMedicCandidates({
      state,
      seatId,
      catalogCards,
    });
    if (candidates.length === 0) {
      emitResolved(events, source, cardId, "medic", "no_targets");
      return;
    }
    const choice = chooseRandomMedicCandidate({
      candidates,
      rngSeed: state.rng.seed,
      rngState: state.rng.state,
    });
    if (!choice.candidate) {
      emitResolved(events, source, cardId, "medic", "no_targets");
      return;
    }
    if (choice.advanced) {
      state.rng.state = choice.nextRngState;
    }
    placeMedicRevival({
      state,
      events,
      catalogCards,
      catalogLeaders,
      catalogLookup,
      actingSeatId: seatId,
      revivedCardId: choice.candidate.cardId,
      boardSeat: choice.candidate.boardSeat,
      row: choice.candidate.row,
      medicSourceId: source.sourceId,
      medicSourceCardId: cardId,
      abilityId: "medic",
      outcome: "random_revived_card",
    });
    return;
  }

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

const SCORCH_ROW_ABILITIES: Record<"scorch_close" | "scorch_range" | "scorch_siege", CatalogRow> = {
  scorch_close: "close",
  scorch_range: "ranged",
  scorch_siege: "siege",
};

const resolveScorchRow = (
  state: MatchState,
  events: GameEvent[],
  catalogCards: readonly CatalogCardSource[],
  catalogLeaders: readonly CatalogLeaderSource[] | undefined,
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  source: CatalogCardSource,
  seatId: SeatId,
  cardId: CardInstanceId,
  abilityId: "scorch_close" | "scorch_range" | "scorch_siege",
) => {
  emitTriggered(events, source, cardId, abilityId);
  const breakdown = calculateScores({ state, catalogCards, catalogLeaders });
  const result = findUnitScorchRowTargets(breakdown, seatId, SCORCH_ROW_ABILITIES[abilityId]);

  result.targets.forEach((target) => {
    const origin: ZoneRef = { kind: "board_row", seat: target.seatId, row: target.row };
    moveCard(state, events, target.cardId, { kind: "discard", seat: target.seatId }, "scorch_destroyed");
    resolveSummonForCard({
      state,
      events,
      catalogLookup,
      cardId: target.cardId,
      origin,
    });
    resolveAvengerForCard({
      state,
      events,
      catalogLookup,
      cardId: target.cardId,
      destination: origin,
    });
  });

  events.push({
    type: "scorch_resolved",
    sourceId: source.sourceId,
    cardId,
    abilityId,
    targetCardIds: result.targets.map((target) => target.cardId),
    outcome: result.outcome,
  });
  emitResolved(events, source, cardId, abilityId, result.outcome);
};

const resolveUnitScorchGlobal = (
  state: MatchState,
  events: GameEvent[],
  catalogCards: readonly CatalogCardSource[],
  catalogLeaders: readonly CatalogLeaderSource[] | undefined,
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
  source: CatalogCardSource,
  _seatId: SeatId,
  cardId: CardInstanceId,
) => {
  emitTriggered(events, source, cardId, "scorch");
  const breakdown = calculateScores({ state, catalogCards, catalogLeaders });
  const targets = findSpecialScorchTargets(breakdown);
  const targetIds = targets.map((target) => target.cardId);

  targets.forEach((target) => {
    const origin: ZoneRef = { kind: "board_row", seat: target.seatId, row: target.row };
    moveCard(state, events, target.cardId, { kind: "discard", seat: target.seatId }, "scorch_destroyed");
    resolveSummonForCard({
      state,
      events,
      catalogLookup,
      cardId: target.cardId,
      origin,
    });
    resolveAvengerForCard({
      state,
      events,
      catalogLookup,
      cardId: target.cardId,
      destination: origin,
    });
  });

  events.push({
    type: "scorch_resolved",
    sourceId: source.sourceId,
    cardId,
    abilityId: "scorch",
    targetCardIds: targetIds,
    outcome: targets.length > 0 ? "destroyed" : "no_targets",
  });
  emitResolved(events, source, cardId, "scorch", targets.length > 0 ? "destroyed" : "no_targets");
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

export const resolveCardAbilities = ({
  state,
  events,
  catalogCards,
  catalogLeaders,
  seatId,
  cardId,
}: AbilityResolverInput) => {
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
      resolveMedic(state, events, catalogCards, catalogLeaders, catalogLookup, source, seatId, cardId);
    } else if (abilityId === "muster") {
      resolveMusterLike(state, events, catalogLookup, source, seatId, cardId, "muster");
    } else if (abilityId === "muster_roach") {
      resolveMusterLike(state, events, catalogLookup, source, seatId, cardId, "muster_roach");
    } else if (
      abilityId === "scorch_close" ||
      abilityId === "scorch_range" ||
      abilityId === "scorch_siege"
    ) {
      resolveScorchRow(state, events, catalogCards, catalogLeaders, catalogLookup, source, seatId, cardId, abilityId);
    } else if (abilityId === "scorch") {
      if (source.kind === "special") {
        emitTriggered(events, source, cardId, abilityId);
        emitDeferred(events, source, cardId, abilityId, "requires_special_resolution");
      } else {
        resolveUnitScorchGlobal(state, events, catalogCards, catalogLeaders, catalogLookup, source, seatId, cardId);
      }
    } else if (abilityId === "berserker") {
      emitTriggered(events, source, cardId, abilityId);
      emitDeferred(events, source, cardId, abilityId, "awaits_mardroeme");
    } else if (ONGOING_STATE_ABILITIES.has(abilityId)) {
      emitTriggered(events, source, cardId, abilityId);
      emitResolved(events, source, cardId, abilityId, "represented_by_board_state");
    } else if (abilityId === "avenger") {
      emitTriggered(events, source, cardId, abilityId);
      emitResolved(events, source, cardId, abilityId, "armed_for_removal");
    } else if (abilityId === "summon") {
      emitTriggered(events, source, cardId, abilityId);
      emitResolved(events, source, cardId, abilityId, "armed_for_discard");
    }
  });
};

export const resolvePromptOption = ({
  state,
  events,
  catalogCards,
  catalogLeaders,
  seatId,
  optionId,
}: PromptResolutionInput) => {
  const prompt = state.pendingPrompt;
  if (!prompt) {
    return;
  }

  const option = prompt.options.find((candidate) => candidate.optionId === optionId);
  if (!option) {
    return;
  }

  const catalogLookup = createCardLookup(catalogCards);

  if (prompt.kind === "medic_revive") {
    if (option.target.kind !== "card_instance") {
      return;
    }
    const revivedId = option.target.cardId;
    const revived = state.cardsById[revivedId];
    const revivedSource = catalogLookup.get(revived.sourceId);
    const boardSeat = revivedSource?.abilities.includes("spy") ? opponentOf(seatId) : seatId;
    if (option.target.row === undefined) {
      return;
    }
    const medicSource = catalogLookup.get(prompt.sourceId ?? "");
    events.push({ type: "prompt_resolved", promptId: prompt.promptId, seatId, optionId });
    state.pendingPrompt = null;

    placeMedicRevival({
      state,
      events,
      catalogCards,
      catalogLeaders,
      catalogLookup,
      actingSeatId: seatId,
      revivedCardId: revivedId,
      boardSeat,
      row: option.target.row,
      medicSourceId: medicSource?.sourceId ?? prompt.sourceId ?? "",
      medicSourceCardId: prompt.sourceCardId ?? revivedId,
      abilityId: prompt.abilityId,
      outcome: "revived_card",
    });
    return;
  }

  if (prompt.kind === "choose_card" && prompt.abilityId === "restore_discard_to_hand") {
    if (option.target.kind !== "card_instance") {
      return;
    }
    const restoredId = option.target.cardId;
    const restored = state.cardsById[restoredId];
    if (!restored || restored.zone.kind !== "discard" || restored.zone.seat !== seatId) {
      // Defense-in-depth: `commands.choosePromptOption` already validates the
      // target card is in the acting seat's discard pile before mutation. If
      // the resolver is invoked from a direct test or future caller with
      // stale state, no-op rather than mutating.
      return;
    }
    restored.controller = seatId;
    moveCard(state, events, restoredId, { kind: "hand", seat: seatId }, "leader_restore_discard_to_hand");
    events.push({ type: "prompt_resolved", promptId: prompt.promptId, seatId, optionId });
    state.pendingPrompt = null;

    if (prompt.sourceId) {
      events.push({
        type: "ability_resolved",
        sourceId: prompt.sourceId,
        cardId: prompt.sourceCardId ?? restoredId,
        abilityId: prompt.abilityId,
        outcome: "restored_card",
      });
    }

    const seat = state.seats[seatId];
    seat.leaderUsed = true;
    if (prompt.sourceCardId) {
      events.push({
        type: "leader_used",
        seatId,
        leaderCardId: prompt.sourceCardId,
        abilityId: prompt.abilityId,
      });
    }
    return;
  }

  if (
    prompt.kind === "choose_card_set" &&
    prompt.abilityId === "discard_two_draw_one_from_deck" &&
    prompt.stage === "discard_selection"
  ) {
    if (option.target.kind !== "card_instance_set") {
      return;
    }
    const discardedCardIds = [...option.target.cardIds];
    const stage1PromptId = prompt.promptId;
    const sourceId = prompt.sourceId;
    const sourceCardId = prompt.sourceCardId;
    const abilityId = prompt.abilityId;

    discardedCardIds.forEach((cardId) => {
      const instance = state.cardsById[cardId];
      if (!instance) {
        return;
      }
      instance.controller = seatId;
      moveCard(state, events, cardId, { kind: "discard", seat: seatId }, "leader_discard_for_draw");
    });
    events.push({ type: "prompt_resolved", promptId: stage1PromptId, seatId, optionId });

    const deckOptions = buildDeckDrawOptions({
      state,
      seatId,
      catalogCards,
    });
    const stage2Prompt = {
      promptId: `${stage1PromptId}->draw`,
      seatId,
      kind: "choose_card" as const,
      sourceCardId,
      sourceId,
      abilityId,
      stage: "deck_draw_selection" as const,
      context: {
        discardedCardIds,
      },
      options: deckOptions.map((deckOption) => ({
        optionId: deckOption.optionId,
        label: deckOption.label,
        target: {
          kind: "deck_card_instance" as const,
          cardId: deckOption.cardId,
          sourceId: deckOption.sourceId,
        },
      })),
    };
    state.pendingPrompt = stage2Prompt;
    events.push({ type: "prompt_opened", prompt: stage2Prompt });
    return;
  }

  if (
    prompt.kind === "choose_card" &&
    prompt.abilityId === "discard_two_draw_one_from_deck" &&
    prompt.stage === "deck_draw_selection"
  ) {
    if (option.target.kind !== "deck_card_instance") {
      return;
    }
    const drawnId = option.target.cardId;
    const drawn = state.cardsById[drawnId];
    if (!drawn || drawn.zone.kind !== "deck" || drawn.zone.seat !== seatId) {
      return;
    }
    drawn.controller = seatId;
    moveCard(state, events, drawnId, { kind: "hand", seat: seatId }, "leader_draw_from_deck");
    events.push({ type: "prompt_resolved", promptId: prompt.promptId, seatId, optionId });

    const remainingDeck = state.seats[seatId].deck;
    if (remainingDeck.length >= 2) {
      const rng = createSeededRngFromState(state.rng.seed, state.rng.state);
      state.seats[seatId].deck = shuffleWithRng(remainingDeck, rng);
      state.rng.state = rng.getState();
    }
    events.push({
      type: "deck_shuffled",
      seatId,
      reason: "leader_discard_draw",
    });

    state.pendingPrompt = null;

    if (prompt.sourceId) {
      events.push({
        type: "ability_resolved",
        sourceId: prompt.sourceId,
        cardId: prompt.sourceCardId ?? drawnId,
        abilityId: prompt.abilityId,
        outcome: "discarded_and_drew_card",
      });
    }

    const seat = state.seats[seatId];
    seat.leaderUsed = true;
    if (prompt.sourceCardId) {
      events.push({
        type: "leader_used",
        seatId,
        leaderCardId: prompt.sourceCardId,
        abilityId: prompt.abilityId,
      });
    }
    return;
  }

  if (prompt.kind === "choose_card" && prompt.abilityId === "draw_opponent_discard") {
    if (option.target.kind !== "card_instance") {
      return;
    }
    const drawnId = option.target.cardId;
    const drawn = state.cardsById[drawnId];
    const opponentSeatId = opponentOf(seatId);
    if (!drawn || drawn.zone.kind !== "discard" || drawn.zone.seat !== opponentSeatId) {
      // Defense-in-depth: `commands.choosePromptOption` already validates the
      // target card is in the opponent's discard pile before mutation. If the
      // resolver is invoked from a direct test or future caller with stale
      // state, no-op rather than mutating.
      return;
    }
    drawn.controller = seatId;
    moveCard(state, events, drawnId, { kind: "hand", seat: seatId }, "leader_draw_opponent_discard_to_hand");
    events.push({ type: "prompt_resolved", promptId: prompt.promptId, seatId, optionId });
    state.pendingPrompt = null;

    if (prompt.sourceId) {
      events.push({
        type: "ability_resolved",
        sourceId: prompt.sourceId,
        cardId: prompt.sourceCardId ?? drawnId,
        abilityId: prompt.abilityId,
        outcome: "drew_opponent_discard",
      });
    }

    const seat = state.seats[seatId];
    seat.leaderUsed = true;
    if (prompt.sourceCardId) {
      events.push({
        type: "leader_used",
        seatId,
        leaderCardId: prompt.sourceCardId,
        abilityId: prompt.abilityId,
      });
    }
    return;
  }
};
