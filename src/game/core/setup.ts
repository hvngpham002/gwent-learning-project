import type { CatalogCardSource, CatalogDeckPreset, CatalogLeaderSource } from "@/game/catalog";

import { getInitialHandDrawCountForLeader } from "./leaderSetup";
import { createSeededRng, shuffleWithRng } from "./rng";
import type {
  BoardSide,
  CardInstance,
  CardInstanceId,
  EngineTransaction,
  GameEvent,
  MatchConfig,
  MatchSeatConfig,
  MatchState,
  RowState,
  SeatId,
  SeatState,
  ZoneRef,
} from "./types";

// cCp32: Scoia'tael first-player choice helpers.
const findScoiaTaelSeats = (seats: readonly [MatchSeatConfig, MatchSeatConfig]): SeatId[] =>
  seats.filter((seat) => seat.faction === "scoiatael").map((seat) => seat.seatId);

const validateScoiataelChoice = (
  seats: readonly [MatchSeatConfig, MatchSeatConfig],
  choice?: { choosingSeatId: SeatId; startingSeatId: SeatId },
) => {
  if (!choice) {
    return null;
  }
  const seatIds = seats.map((s) => s.seatId);
  const scoiataelSeats = findScoiaTaelSeats(seats);

  if (scoiataelSeats.length !== 1) {
    throw new Error(
      `scoiataelFirstPlayerChoice requires exactly one Scoia'tael seat (found ${scoiataelSeats.length}).`,
    );
  }

  if (choice.choosingSeatId !== scoiataelSeats[0]) {
    throw new Error(
      `scoiataelFirstPlayerChoice.choosingSeatId ${choice.choosingSeatId} must be the Scoia'tael seat ${scoiataelSeats[0]}.`,
    );
  }

  if (!seatIds.includes(choice.startingSeatId)) {
    throw new Error(
      `scoiataelFirstPlayerChoice.startingSeatId ${choice.startingSeatId} is not a configured seat.`,
    );
  }

  return { scoiataelSeatId: scoiataelSeats[0], startingSeatId: choice.startingSeatId };
};

const determineInitialStarter = (
  config: MatchConfig,
  rng: ReturnType<typeof createSeededRng>,
): {
  currentTurn: SeatId;
  turnReason: "initial_roll" | "scoiatael_override";
  scoiataelAbilityEvent: GameEvent | null;
} => {
  const scoiataelSeats = findScoiaTaelSeats(config.seats);
  const seedRoll = rng.next() < 0.5 ? config.seats[0].seatId : config.seats[1].seatId;

  if (scoiataelSeats.length !== 1) {
    return { currentTurn: seedRoll, turnReason: "initial_roll", scoiataelAbilityEvent: null };
  }

  const scoiataelSeatId = scoiataelSeats[0];
  const validated = validateScoiataelChoice(config.seats, config.scoiataelFirstPlayerChoice);

  let startingSeatId: SeatId;
  let outcome: "chose_self" | "chose_opponent" | "defaulted_self";
  let policy: "explicit_choice" | "fallback_self";

  if (validated) {
    startingSeatId = validated.startingSeatId;
    outcome = startingSeatId === scoiataelSeatId ? "chose_self" : "chose_opponent";
    policy = "explicit_choice";
  } else {
    startingSeatId = scoiataelSeatId;
    outcome = "defaulted_self";
    policy = "fallback_self";
  }

  const scoiataelAbilityEvent: GameEvent = {
    type: "faction_ability_resolved",
    faction: "scoiatael",
    seatId: scoiataelSeatId,
    ability: "scoiatael_choose_first",
    outcome,
    policy,
  };

  return { currentTurn: startingSeatId, turnReason: "scoiatael_override", scoiataelAbilityEvent };
};

const createRow = (): RowState => ({
  units: [],
  horn: null,
});

const createBoard = (): BoardSide => ({
  close: createRow(),
  ranged: createRow(),
  siege: createRow(),
});

const assertSeatPair = (seats: readonly [MatchSeatConfig, MatchSeatConfig]) => {
  if (seats[0].seatId === seats[1].seatId) {
    throw new Error(`Match setup requires two distinct seat IDs; received ${seats[0].seatId} twice.`);
  }
};

const buildLookup = <T extends CatalogCardSource | CatalogLeaderSource>(sources: readonly T[]) =>
  new Map(sources.map((source) => [source.sourceId, source]));

const countPresetEntries = (preset: CatalogDeckPreset, key: "mainDeck" | "sideDeck") =>
  preset[key].reduce((total, entry) => total + entry.count, 0);

const createInstanceId = (seatId: SeatId, sourceId: string, ordinal: number) =>
  `${seatId}:${String(ordinal).padStart(3, "0")}:${sourceId}`;

const addInstance = (
  cardsById: Record<CardInstanceId, CardInstance>,
  instance: CardInstance,
  events: GameEvent[],
  reason: Extract<GameEvent, { type: "card_moved" }>["reason"],
) => {
  cardsById[instance.instanceId] = instance;
  events.push({
    type: "card_moved",
    cardId: instance.instanceId,
    sourceId: instance.sourceId,
    from: null,
    to: instance.zone,
    reason,
  });
};

const instantiateDeckEntries = (
  seatId: SeatId,
  entries: CatalogDeckPreset["mainDeck"],
  zone: ZoneRef,
  cardById: Map<string, CatalogCardSource>,
  nextOrdinal: () => number,
  cardsById: Record<CardInstanceId, CardInstance>,
  events: GameEvent[],
) => {
  const instanceIds: CardInstanceId[] = [];

  entries.forEach((entry) => {
    const source = cardById.get(entry.sourceId);
    if (!source) {
      throw new Error(`Deck preset references missing card source: ${entry.sourceId}`);
    }

    for (let copy = 0; copy < entry.count; copy += 1) {
      const instance: CardInstance = {
        instanceId: createInstanceId(seatId, entry.sourceId, nextOrdinal()),
        sourceId: entry.sourceId,
        sourceKind: "card",
        owner: seatId,
        controller: seatId,
        zone,
      };
      addInstance(cardsById, instance, events, "instantiate");
      instanceIds.push(instance.instanceId);
    }
  });

  return instanceIds;
};

const moveCard = (
  cardsById: Record<CardInstanceId, CardInstance>,
  events: GameEvent[],
  cardId: CardInstanceId,
  to: ZoneRef,
  reason: Extract<GameEvent, { type: "card_moved" }>["reason"],
) => {
  const card = cardsById[cardId];
  const from = card.zone;
  card.zone = to;
  events.push({
    type: "card_moved",
    cardId,
    sourceId: card.sourceId,
    from,
    to,
    reason,
  });
};

const instantiateSeat = (
  seatConfig: MatchSeatConfig,
  cardById: Map<string, CatalogCardSource>,
  leaderById: Map<string, CatalogLeaderSource>,
  cardsById: Record<CardInstanceId, CardInstance>,
  events: GameEvent[],
): SeatState => {
  let ordinal = 0;
  const nextOrdinal = () => {
    ordinal += 1;
    return ordinal;
  };
  const deckZone: ZoneRef = { kind: "deck", seat: seatConfig.seatId };
  const sideDeckZone: ZoneRef = { kind: "side_deck", seat: seatConfig.seatId };
  const leaderZone: ZoneRef = { kind: "leader", seat: seatConfig.seatId };
  const leaderSource = leaderById.get(seatConfig.deckPreset.leaderSourceId);

  if (!leaderSource) {
    throw new Error(`Deck preset references missing leader source: ${seatConfig.deckPreset.leaderSourceId}`);
  }

  if (seatConfig.faction !== seatConfig.deckPreset.faction) {
    throw new Error(
      `Seat ${seatConfig.seatId} faction ${seatConfig.faction} does not match preset ${seatConfig.deckPreset.presetId} faction ${seatConfig.deckPreset.faction}.`,
    );
  }

  const leaderInstance: CardInstance = {
    instanceId: createInstanceId(seatConfig.seatId, leaderSource.sourceId, nextOrdinal()),
    sourceId: leaderSource.sourceId,
    sourceKind: "leader",
    owner: seatConfig.seatId,
    controller: seatConfig.seatId,
    zone: leaderZone,
  };
  addInstance(cardsById, leaderInstance, events, "instantiate");

  const deck = instantiateDeckEntries(
    seatConfig.seatId,
    seatConfig.deckPreset.mainDeck,
    deckZone,
    cardById,
    nextOrdinal,
    cardsById,
    events,
  );
  const sideDeck = instantiateDeckEntries(
    seatConfig.seatId,
    seatConfig.deckPreset.sideDeck,
    sideDeckZone,
    cardById,
    nextOrdinal,
    cardsById,
    events,
  );

  events.push({
    type: "deck_instantiated",
    seatId: seatConfig.seatId,
    faction: seatConfig.faction,
    presetId: seatConfig.deckPreset.presetId,
    deckCount: countPresetEntries(seatConfig.deckPreset, "mainDeck"),
    leaderInstanceId: leaderInstance.instanceId,
    sideDeckCount: countPresetEntries(seatConfig.deckPreset, "sideDeck"),
  });

  return {
    seatId: seatConfig.seatId,
    playerId: seatConfig.playerId,
    controllerKind: seatConfig.controllerKind ?? "human",
    faction: seatConfig.faction,
    deck,
    hand: [],
    discard: [],
    leader: leaderInstance.instanceId,
    leaderSourceId: leaderSource.sourceId,
    leaderUsed: false,
    mulliganComplete: false,
    mulligansUsed: 0,
    sideDeck,
    removedFromGame: [],
    board: createBoard(),
    gems: 2,
    passed: false,
    leaderCancelledRound: null,
  };
};

export const startMatch = (config: MatchConfig): EngineTransaction => {
  assertSeatPair(config.seats);

  const rng = createSeededRng(config.seed);
  const cardsById: Record<CardInstanceId, CardInstance> = {};
  const cardById = buildLookup(config.catalog.cards);
  const leaderById = buildLookup(config.catalog.leaders);
  const events: GameEvent[] = [
    {
      type: "match_started",
      matchId: config.matchId ?? `match:${config.seed}`,
      seed: config.seed,
      seats: config.seats.map((seat) => seat.seatId),
    },
  ];

  const seatEntries = config.seats.map((seatConfig) => {
    const seat = instantiateSeat(seatConfig, cardById, leaderById, cardsById, events);
    const shuffledDeck = shuffleWithRng(seat.deck, rng);
    seat.deck = shuffledDeck;

    shuffledDeck.forEach((cardId) => {
      moveCard(cardsById, events, cardId, { kind: "deck", seat: seat.seatId }, "shuffle");
    });

    const drawCount = getInitialHandDrawCountForLeader({
      leaderSourceId: seat.leaderSourceId,
      catalogLeaders: config.catalog.leaders,
    });
    const drawn = seat.deck.slice(0, drawCount);
    seat.hand = drawn;
    seat.deck = seat.deck.slice(drawCount);

    drawn.forEach((cardId) => {
      moveCard(cardsById, events, cardId, { kind: "hand", seat: seat.seatId }, "initial_draw");
    });
    events.push({ type: "initial_hand_drawn", seatId: seat.seatId, cardIds: drawn });

    return [seat.seatId, seat] as const;
  });

  const { currentTurn, turnReason, scoiataelAbilityEvent } = determineInitialStarter(config, rng);
  events.push({ type: "turn_set", seatId: currentTurn, reason: turnReason });
  if (scoiataelAbilityEvent) {
    events.push(scoiataelAbilityEvent);
  }

  const state: MatchState = {
    matchId: config.matchId ?? `match:${config.seed}`,
    phase: "mulligan",
    round: 1,
    roundStarter: currentTurn,
    roundHistory: [],
    lastResolvedRound: null,
    currentTurn,
    pendingPrompt: null,
    seats: Object.fromEntries(seatEntries) as MatchState["seats"],
    cardsById,
    weather: { entries: [] },
    rng: {
      seed: config.seed,
      algorithm: "xmur3-mulberry32",
      state: rng.getState(),
    },
    catalog: {
      cardSourceIds: config.catalog.cards.map((card) => card.sourceId),
      leaderSourceIds: config.catalog.leaders.map((leader) => leader.sourceId),
      deckPresetIds: config.seats.map((seat) => seat.deckPreset.presetId),
    },
  };

  return { state, events };
};
