import { describe, expect, it } from "vitest";

import {
  CATALOG_ABILITY_METADATA,
  type CatalogCardSource,
  type CatalogDeckPreset,
  type CatalogLeaderSource,
  type CatalogRow,
} from "@/game/catalog";
import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  game8OfficialCardCandidates,
  officialPortingSummary,
} from "@/data/catalog";
import {
  executeCommand,
  getLegalMoves,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type EngineCommand,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";

const testMardroemeSpecial = {
  sourceId: "test.mardroeme-special",
  name: "Test Mardroeme Special",
  faction: "skellige" as const,
  kind: "special" as const,
  strength: 0,
  rows: [],
  abilities: ["mardroeme"] as const,
  tags: ["special"],
  deckLimit: 3,
  image: "/images/test/mardroeme.png",
} satisfies CatalogCardSource;

const testMardroemeUnit = {
  sourceId: "test.priestess",
  name: "Test Priestess",
  faction: "skellige" as const,
  kind: "unit" as const,
  strength: 4,
  rows: ["close"] as const,
  abilities: ["mardroeme"] as const,
  tags: ["non_hero"],
  deckLimit: 3,
  image: "/images/test/priestess.png",
} satisfies CatalogCardSource;

const testMuster = {
  sourceId: "test.muster-caller",
  name: "Test Muster Caller",
  faction: "skellige" as const,
  kind: "unit" as const,
  strength: 1,
  rows: ["close"] as const,
  abilities: ["muster"] as const,
  tags: ["non_hero"],
  deckLimit: 3,
  image: "/images/test/muster_caller.png",
  linkedSourceIds: ["test.berserker"] as const,
} satisfies CatalogCardSource;

const testBerserkerForm = {
  sourceId: "test.berserker-form",
  name: "Test Berserker Form",
  faction: "skellige" as const,
  kind: "unit" as const,
  strength: 8,
  rows: ["close"] as const,
  abilities: ["none"] as const,
  tags: ["non_hero"],
  deckLimit: 3,
  image: "/images/test/berserker_form.png",
} satisfies CatalogCardSource;

const testBerserker = {
  sourceId: "test.berserker",
  name: "Test Berserker",
  faction: "skellige" as const,
  kind: "unit" as const,
  strength: 4,
  rows: ["close"] as const,
  abilities: ["berserker"] as const,
  tags: ["non_hero"],
  deckLimit: 3,
  image: "/images/test/berserker.png",
  linkedSourceIds: [testBerserkerForm.sourceId] as const,
} satisfies CatalogCardSource;

const testBerserkerNoLink = {
  sourceId: "test.berserker-no-link",
  name: "Test Berserker No Link",
  faction: "skellige" as const,
  kind: "unit" as const,
  strength: 4,
  rows: ["close"] as const,
  abilities: ["berserker"] as const,
  tags: ["non_hero"],
  deckLimit: 3,
  image: "/images/test/berserker.png",
} satisfies CatalogCardSource;

const testSkelligeLeader = {
  sourceId: "test.skellige-leader",
  name: "Test Skellige Leader",
  faction: "skellige" as const,
  ability: "clear_weather" as const,
  image: "/images/test/skellige_leader.png",
} satisfies CatalogLeaderSource;

const testCatalogCards = [
  ...currentCatalogCards,
  testMardroemeSpecial,
  testMardroemeUnit,
  testMuster,
  testBerserker,
  testBerserkerForm,
  testBerserkerNoLink,
] as const satisfies CatalogCardSource[];

const testCatalogLeaders = [
  ...currentCatalogLeaders,
  testSkelligeLeader,
] as const satisfies CatalogLeaderSource[];

const testSkelligeDeckPreset: CatalogDeckPreset = {
  presetId: "test-skellige",
  name: "Test Skellige",
  faction: "skellige",
  leaderSourceId: testSkelligeLeader.sourceId,
  mainDeck: [...currentNorthernRealmsDeckPreset.mainDeck],
  sideDeck: [
    { sourceId: testBerserkerForm.sourceId, count: 4 },
  ],
};

const createConfig = (
  seed: string | number,
  options: { skelligeSeat?: boolean } = {},
): MatchConfig => ({
  matchId: `mardroeme-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: options.skelligeSeat ? "skellige" : "northern_realms",
      deckPreset: options.skelligeSeat ? testSkelligeDeckPreset : currentNorthernRealmsDeckPreset,
    },
    {
      seatId: "seat_b",
      playerId: "player-b",
      controllerKind: "ai",
      faction: "nilfgaard",
      deckPreset: currentNilfgaardDeckPreset,
    },
  ],
  catalog: {
    cards: testCatalogCards,
    leaders: testCatalogLeaders,
  },
});

const createState = (seed = "mardroeme-base", options: { skelligeSeat?: boolean } = {}) =>
  startMatch(createConfig(seed, options)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: testCatalogCards,
    catalogLeaders: testCatalogLeaders,
  });

const legalMoves = (state: MatchState, seatId: SeatId) =>
  getLegalMoves({
    state,
    seatId,
    catalogCards: testCatalogCards,
    catalogLeaders: testCatalogLeaders,
  });

const removeEverywhere = (state: MatchState, cardId: CardInstanceId) => {
  Object.values(state.seats).forEach((seat) => {
    seat.deck = seat.deck.filter((id) => id !== cardId);
    seat.hand = seat.hand.filter((id) => id !== cardId);
    seat.discard = seat.discard.filter((id) => id !== cardId);
    seat.sideDeck = seat.sideDeck.filter((id) => id !== cardId);
    seat.removedFromGame = seat.removedFromGame.filter((id) => id !== cardId);
    Object.values(seat.board).forEach((row) => {
      row.units = row.units.filter((id) => id !== cardId);
      if (row.horn === cardId) row.horn = null;
    });
  });
  state.weather.entries = state.weather.entries.filter((id) => id !== cardId);
};

const addCardInstance = (state: MatchState, seatId: SeatId, sourceId: string, suffix: string): CardInstanceId => {
  const instanceId = `${seatId}:test:${suffix}:${sourceId}`;
  const instance: CardInstance = {
    instanceId,
    sourceId,
    sourceKind: "card",
    owner: seatId,
    controller: seatId,
    zone: { kind: "hand", seat: seatId },
  };

  state.cardsById[instanceId] = instance;
  state.seats[seatId].hand.push(instanceId);
  return instanceId;
};

const placeOnBoard = (
  state: MatchState,
  seatId: SeatId,
  cardId: CardInstanceId,
  row: CatalogRow,
) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
  state.cardsById[cardId].controller = seatId;
};

const placeInSideDeck = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].sideDeck.push(cardId);
  state.cardsById[cardId].zone = { kind: "side_deck", seat: seatId };
};

const placeInHand = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].hand.push(cardId);
  state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
};

const placeInDiscard = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].discard.push(cardId);
  state.cardsById[cardId].zone = { kind: "discard", seat: seatId };
};

const preparePlayingTurn = (state: MatchState, seatId: SeatId = "seat_a") => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.pendingPrompt = null;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
};

const assertNoDuplicateZones = (state: MatchState) => {
  const seen = new Map<CardInstanceId, string[]>();
  const note = (cardId: CardInstanceId, zone: string) => seen.set(cardId, [...(seen.get(cardId) ?? []), zone]);

  Object.values(state.seats).forEach((seat) => {
    seat.deck.forEach((id) => note(id, `${seat.seatId}.deck`));
    seat.hand.forEach((id) => note(id, `${seat.seatId}.hand`));
    seat.discard.forEach((id) => note(id, `${seat.seatId}.discard`));
    seat.sideDeck.forEach((id) => note(id, `${seat.seatId}.sideDeck`));
    seat.removedFromGame.forEach((id) => note(id, `${seat.seatId}.removed`));
    Object.values(seat.board).forEach((row) => {
      row.units.forEach((id) => note(id, `${seat.seatId}.board`));
      if (row.horn) note(row.horn, `${seat.seatId}.horn`);
    });
    if (seat.leader) note(seat.leader, `${seat.seatId}.leader`);
  });
  state.weather.entries.forEach((id) => note(id, "weather"));
  [...seen.values()].forEach((zones) => expect(zones).toHaveLength(1));
};

describe("Skellige Storm metadata and scoring (cCp9)", () => {
  it("marks Skellige Storm metadata as implemented", () => {
    expect(CATALOG_ABILITY_METADATA.skellige_storm.status).toBe("implemented");
  });

  it("does not include skellige_storm in unsupported ability counts", () => {
    expect(officialPortingSummary.unsupportedAbilityCounts.skellige_storm).toBeUndefined();
    expect(officialPortingSummary.unsupportedAbilityCounts.mardroeme).toBeUndefined();
    expect(officialPortingSummary.unsupportedAbilityCounts.berserker).toBeUndefined();
  });

  it("Skellige Storm legal moves still target the shared weather zone", () => {
    const state = createState("storm-target");
    const stormId = addCardInstance(state, "seat_a", "neutral.skellige-storm", "storm");
    state.weather.entries = [];
    preparePlayingTurn(state);
    state.seats.seat_a.hand = [stormId];
    state.cardsById[stormId].zone = { kind: "hand", seat: "seat_a" };

    const moves = legalMoves(state, "seat_a").filter(
      (move) => move.kind === "play_card" && move.sourceCardId === stormId,
    );
    expect(moves).toHaveLength(1);
    expect(moves[0].kind === "play_card" && moves[0].target).toEqual({ kind: "weather" });
  });
});

describe("Mardroeme legal moves (cCp9)", () => {
  it("special Mardroeme exposes all three own row targets", () => {
    const state = createState("mardroeme-legal");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    preparePlayingTurn(state);

    const moves = legalMoves(state, "seat_a").filter(
      (move) => move.kind === "play_card" && move.sourceCardId === mardroemeId,
    );

    expect(moves).toHaveLength(3);
    const targets = moves.map((move) => (move.kind === "play_card" ? move.target : null));
    expect(targets).toEqual([
      { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
      { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    ]);
  });

  it("special Mardroeme does not target weather or row horn", () => {
    const state = createState("mardroeme-no-weather");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    preparePlayingTurn(state);

    const moves = legalMoves(state, "seat_a").filter(
      (move) => move.kind === "play_card" && move.sourceCardId === mardroemeId,
    );
    moves.forEach((move) => {
      if (move.kind !== "play_card") return;
      expect(move.target.kind).not.toBe("weather");
      expect(move.target.kind).not.toBe("row_horn");
    });
  });
});

describe("Mardroeme play and Berserker transform (cCp9)", () => {
  const playMardroemeOnto = (
    state: MatchState,
    mardroemeId: CardInstanceId,
    row: CatalogRow,
    seatId: SeatId = "seat_a",
  ) =>
    execute(state, {
      type: "PlayCard",
      seatId,
      cardId: mardroemeId,
      target: { kind: "board_row", side: "own", seatId, row },
    });

  it("playing special Mardroeme transforms a single Berserker on its row", () => {
    const state = createState("mardroeme-single");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    const berserkerId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    const replacementId = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f1");
    preparePlayingTurn(state);
    placeInSideDeck(state, "seat_a", replacementId);
    placeOnBoard(state, "seat_a", berserkerId, "close");
    placeInHand(state, "seat_a", mardroemeId);

    const result = playMardroemeOnto(state, mardroemeId, "close");

    expect(result.state.seats.seat_a.removedFromGame).toContain(berserkerId);
    expect(result.state.seats.seat_a.discard).not.toContain(berserkerId);
    expect(result.state.seats.seat_a.sideDeck).not.toContain(replacementId);
    expect(result.state.seats.seat_a.board.close.units).toContain(replacementId);
    expect(result.state.seats.seat_a.board.close.units).toContain(mardroemeId);
    expect(result.state.cardsById[replacementId].controller).toBe("seat_a");
    expect(result.events.some((event) => event.type === "card_transformed")).toBe(true);
    assertNoDuplicateZones(result.state);
  });

  it("playing special Mardroeme transforms multiple Berserkers in row order", () => {
    const state = createState("mardroeme-multi");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    const berserkerA = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    const berserkerB = addCardInstance(state, "seat_a", testBerserker.sourceId, "b2");
    const replacementA = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f1");
    const replacementB = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f2");
    preparePlayingTurn(state);
    placeInSideDeck(state, "seat_a", replacementA);
    placeInSideDeck(state, "seat_a", replacementB);
    placeOnBoard(state, "seat_a", berserkerA, "close");
    placeOnBoard(state, "seat_a", berserkerB, "close");
    placeInHand(state, "seat_a", mardroemeId);

    const result = playMardroemeOnto(state, mardroemeId, "close");

    expect(result.state.seats.seat_a.removedFromGame).toEqual(
      expect.arrayContaining([berserkerA, berserkerB]),
    );
    expect(result.state.seats.seat_a.board.close.units).toEqual(
      expect.arrayContaining([replacementA, replacementB, mardroemeId]),
    );
    const transformEvents = result.events.filter((event) => event.type === "card_transformed");
    expect(transformEvents).toHaveLength(2);
    assertNoDuplicateZones(result.state);
  });

  it("Berserker on a different row does not transform", () => {
    const state = createState("mardroeme-other-row");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    const berserkerCloseId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    const berserkerRangedId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b2");
    const replacementCloseId = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f1");
    const replacementRangedId = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f2");
    preparePlayingTurn(state);
    placeInSideDeck(state, "seat_a", replacementCloseId);
    placeInSideDeck(state, "seat_a", replacementRangedId);
    placeOnBoard(state, "seat_a", berserkerCloseId, "close");
    placeOnBoard(state, "seat_a", berserkerRangedId, "ranged");
    placeInHand(state, "seat_a", mardroemeId);

    const result = playMardroemeOnto(state, mardroemeId, "close");

    expect(result.state.seats.seat_a.removedFromGame).toContain(berserkerCloseId);
    expect(result.state.seats.seat_a.removedFromGame).not.toContain(berserkerRangedId);
    expect(result.state.seats.seat_a.board.ranged.units).toContain(berserkerRangedId);
    expect(result.state.seats.seat_a.sideDeck).toContain(replacementRangedId);
    assertNoDuplicateZones(result.state);
  });

  it("playing a Berserker onto an already-active Mardroeme row transforms it immediately", () => {
    const state = createState("mardroeme-ongoing");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    const berserkerId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    const replacementId = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f1");
    preparePlayingTurn(state);
    placeInSideDeck(state, "seat_a", replacementId);
    placeOnBoard(state, "seat_a", mardroemeId, "close");
    placeInHand(state, "seat_a", berserkerId);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: berserkerId,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(result.state.seats.seat_a.removedFromGame).toContain(berserkerId);
    expect(result.state.seats.seat_a.board.close.units).toContain(replacementId);
    expect(result.state.seats.seat_a.board.close.units).toContain(mardroemeId);
    expect(result.events.some((event) => event.type === "card_transformed")).toBe(true);
    assertNoDuplicateZones(result.state);
  });

  it("playing a unit Mardroeme onto a row with Berserker transforms it", () => {
    const state = createState("mardroeme-unit");
    const mardroemeUnitId = addCardInstance(state, "seat_a", testMardroemeUnit.sourceId, "m1");
    const berserkerId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    const replacementId = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f1");
    preparePlayingTurn(state);
    placeInSideDeck(state, "seat_a", replacementId);
    placeOnBoard(state, "seat_a", berserkerId, "close");
    placeInHand(state, "seat_a", mardroemeUnitId);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: mardroemeUnitId,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(result.state.seats.seat_a.removedFromGame).toContain(berserkerId);
    expect(result.state.seats.seat_a.board.close.units).toContain(replacementId);
    expect(result.state.seats.seat_a.board.close.units).toContain(mardroemeUnitId);
    assertNoDuplicateZones(result.state);
  });

  it("Muster placing a Berserker onto an active Mardroeme row transforms through the same helper", () => {
    const state = createState("mardroeme-muster");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    const musterId = addCardInstance(state, "seat_a", testMuster.sourceId, "mu1");
    const berserkerId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    const replacementId = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f1");
    preparePlayingTurn(state);
    placeInSideDeck(state, "seat_a", replacementId);
    placeOnBoard(state, "seat_a", mardroemeId, "close");
    placeInHand(state, "seat_a", musterId);
    placeInHand(state, "seat_a", berserkerId);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: musterId,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(result.state.seats.seat_a.removedFromGame).toContain(berserkerId);
    expect(result.state.seats.seat_a.board.close.units).toContain(replacementId);
    expect(result.events.some((event) => event.type === "card_transformed")).toBe(true);
    assertNoDuplicateZones(result.state);
  });

  it("Mardroeme settles to no_targets when no Berserker is on its row", () => {
    const state = createState("mardroeme-empty");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    preparePlayingTurn(state);
    placeInHand(state, "seat_a", mardroemeId);

    const result = playMardroemeOnto(state, mardroemeId, "close");

    expect(result.state.seats.seat_a.board.close.units).toContain(mardroemeId);
    const resolved = result.events.find(
      (event) =>
        event.type === "ability_resolved" &&
        event.abilityId === "mardroeme" &&
        event.outcome === "no_targets",
    );
    expect(resolved).toBeDefined();
    assertNoDuplicateZones(result.state);
  });
});

describe("Berserker missing-replacement handling (cCp9)", () => {
  it("does not crash and does not remove the Berserker when transform link is missing", () => {
    const state = createState("missing-link");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    const berserkerId = addCardInstance(state, "seat_a", testBerserkerNoLink.sourceId, "b1");
    preparePlayingTurn(state);
    placeOnBoard(state, "seat_a", berserkerId, "close");
    placeInHand(state, "seat_a", mardroemeId);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: mardroemeId,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(result.state.seats.seat_a.board.close.units).toContain(berserkerId);
    expect(result.state.seats.seat_a.removedFromGame).not.toContain(berserkerId);
    const missingEvent = result.events.find(
      (event) =>
        event.type === "ability_resolved" &&
        event.abilityId === "berserker" &&
        event.outcome === "missing_transform_link",
    );
    expect(missingEvent).toBeDefined();
    assertNoDuplicateZones(result.state);
  });

  it("does not crash and does not remove the Berserker when side deck has no replacement", () => {
    const state = createState("missing-replacement");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    const berserkerId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    preparePlayingTurn(state);
    placeOnBoard(state, "seat_a", berserkerId, "close");
    placeInHand(state, "seat_a", mardroemeId);
    state.seats.seat_a.sideDeck = [];

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: mardroemeId,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(result.state.seats.seat_a.board.close.units).toContain(berserkerId);
    expect(result.state.seats.seat_a.removedFromGame).not.toContain(berserkerId);
    const missingEvent = result.events.find(
      (event) =>
        event.type === "ability_resolved" &&
        event.abilityId === "berserker" &&
        event.outcome === "missing_transform_replacement",
    );
    expect(missingEvent).toBeDefined();
    assertNoDuplicateZones(result.state);
  });
});

describe("Mardroeme Medic and Skellige interactions (cCp9)", () => {
  it("Medic reviving a Berserker onto an active Mardroeme row transforms immediately", () => {
    const state = createState("medic-revive");
    const medicId = addCardInstance(state, "seat_a", "northern-realms.dun-banner-medic", "m1");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m2");
    const berserkerId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    const replacementId = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f1");
    preparePlayingTurn(state);
    placeInSideDeck(state, "seat_a", replacementId);
    placeOnBoard(state, "seat_a", mardroemeId, "close");
    placeInDiscard(state, "seat_a", berserkerId);
    placeInHand(state, "seat_a", medicId);

    const playMedic = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: medicId,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    });

    const prompt = playMedic.state.pendingPrompt;
    expect(prompt?.kind).toBe("medic_revive");
    const reviveOption = prompt?.options.find((option) => option.target.cardId === berserkerId);
    expect(reviveOption).toBeDefined();

    const result = execute(playMedic.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt!.promptId,
      optionId: reviveOption!.optionId,
    });

    expect(result.state.seats.seat_a.removedFromGame).toContain(berserkerId);
    expect(result.state.seats.seat_a.board.close.units).toContain(replacementId);
    expect(result.events.some((event) => event.type === "card_transformed")).toBe(true);
    assertNoDuplicateZones(result.state);
  });

  it("transformed Berserker is not eligible for Skellige round-three return but its replacement is", () => {
    const state = createState("skellige-return", { skelligeSeat: true });
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    const berserkerId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    const replacementId = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f1");
    preparePlayingTurn(state);
    placeInSideDeck(state, "seat_a", replacementId);
    placeOnBoard(state, "seat_a", berserkerId, "close");
    placeInHand(state, "seat_a", mardroemeId);

    const transformResult = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: mardroemeId,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    const transformedState = transformResult.state;
    expect(transformedState.seats.seat_a.removedFromGame).toContain(berserkerId);
    expect(transformedState.seats.seat_a.discard).not.toContain(berserkerId);

    placeInDiscard(transformedState, "seat_a", replacementId);
    transformedState.round = 2;
    transformedState.phase = "round_end";
    transformedState.seats.seat_a.passed = true;
    transformedState.seats.seat_b.passed = true;

    const result = execute(transformedState, { type: "ResolveRoundEnd", seatId: "seat_a" });

    expect(result.state.seats.seat_a.removedFromGame).toContain(berserkerId);
    expect(result.state.seats.seat_a.board.close.units).toContain(replacementId);
    expect(result.state.seats.seat_a.discard).not.toContain(berserkerId);
    assertNoDuplicateZones(result.state);
  });

  it("Scorch sends a transformed replacement to the board-side discard pile", () => {
    const state = createState("scorch-replacement");
    const mardroemeId = addCardInstance(state, "seat_a", testMardroemeSpecial.sourceId, "m1");
    const berserkerId = addCardInstance(state, "seat_a", testBerserker.sourceId, "b1");
    const replacementId = addCardInstance(state, "seat_a", testBerserkerForm.sourceId, "f1");
    const scorchId = addCardInstance(state, "seat_b", "neutral.scorch", "scorch");
    preparePlayingTurn(state);
    placeInSideDeck(state, "seat_a", replacementId);
    placeOnBoard(state, "seat_a", berserkerId, "close");
    placeInHand(state, "seat_a", mardroemeId);

    const transformedState = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: mardroemeId,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    }).state;

    transformedState.phase = "playing";
    transformedState.currentTurn = "seat_b";
    transformedState.seats.seat_b.passed = false;
    placeInHand(transformedState, "seat_b", scorchId);

    const result = execute(transformedState, {
      type: "PlayCard",
      seatId: "seat_b",
      cardId: scorchId,
      target: { kind: "none" },
    });

    expect(result.state.seats.seat_a.discard).toContain(replacementId);
    expect(result.state.seats.seat_b.discard).not.toContain(replacementId);
    expect(result.state.seats.seat_a.removedFromGame).toContain(berserkerId);
    assertNoDuplicateZones(result.state);
  });
});

describe("Card Studio Berserker validation guard (cCp9)", () => {
  it("blocks playable custom Berserker without a transform link", async () => {
    const { validateCustomCardRecord } = await import("@/components/gwent/cardStudioValidation");
    const record = {
      recordId: "card-1",
      createdAt: "2026-04-29T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
      imageMode: "path" as const,
      draft: false,
      source: {
        sourceId: "custom_test_berserker",
        name: "Custom Berserker",
        faction: "skellige" as const,
        kind: "unit" as const,
        strength: 4,
        rows: ["close"] as const,
        abilities: ["berserker"] as const,
        tags: [],
        deckLimit: 3,
        image: "/images/test/berserker.png",
      },
    };
    const context = {
      currentCards: testCatalogCards,
      currentLeaders: testCatalogLeaders,
      customCards: [],
      customLeaders: [],
    };

    const result = validateCustomCardRecord(record, context);
    expect(result.playable).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("berserker_requires_side_deck");
  });

  it("blocks playable custom Berserker whose transform link does not resolve", async () => {
    const { validateCustomCardRecord } = await import("@/components/gwent/cardStudioValidation");
    const record = {
      recordId: "card-1",
      createdAt: "2026-04-29T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
      imageMode: "path" as const,
      draft: false,
      source: {
        sourceId: "custom_test_berserker",
        name: "Custom Berserker",
        faction: "skellige" as const,
        kind: "unit" as const,
        strength: 4,
        rows: ["close"] as const,
        abilities: ["berserker"] as const,
        tags: [],
        deckLimit: 3,
        image: "/images/test/berserker.png",
        linkedSourceIds: ["custom_test_does_not_exist"],
      },
    };
    const context = {
      currentCards: testCatalogCards,
      currentLeaders: testCatalogLeaders,
      customCards: [],
      customLeaders: [],
    };

    const result = validateCustomCardRecord(record, context);
    expect(result.playable).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("berserker_requires_side_deck");
  });

  it("allows a custom Berserker only when its transform link resolves", async () => {
    const { validateCustomCardRecord } = await import("@/components/gwent/cardStudioValidation");
    const record = {
      recordId: "card-1",
      createdAt: "2026-04-29T00:00:00.000Z",
      updatedAt: "2026-04-29T00:00:00.000Z",
      imageMode: "path" as const,
      draft: false,
      source: {
        sourceId: "custom_test_berserker",
        name: "Custom Berserker",
        faction: "skellige" as const,
        kind: "unit" as const,
        strength: 4,
        rows: ["close"] as const,
        abilities: ["berserker"] as const,
        tags: [],
        deckLimit: 3,
        image: "/images/test/berserker.png",
        linkedSourceIds: [testBerserkerForm.sourceId],
      },
    };
    const context = {
      currentCards: testCatalogCards,
      currentLeaders: testCatalogLeaders,
      customCards: [],
      customLeaders: [],
    };

    const result = validateCustomCardRecord(record, context);
    expect(result.playable).toBe(true);
    expect(result.issues.map((issue) => issue.code)).not.toContain("berserker_requires_side_deck");
  });
});

describe("Official porting Berserker classification (cCp9)", () => {
  it("flags official Berserker candidates with a non-rule data issue rather than rule gap", () => {
    const berserkerCandidates = game8OfficialCardCandidates.filter((candidate) =>
      candidate.source.abilities.includes("berserker"),
    );
    expect(berserkerCandidates.length).toBeGreaterThan(0);
    berserkerCandidates.forEach((candidate) => {
      const joined = candidate.portingIssues.join(" ");
      expect(joined).not.toContain("rule_gap:berserker");
      expect(joined).toMatch(/transform_link_required|catalog_split_required/);
    });
  });

  it("does not flag Mardroeme as an unimplemented engine rule", () => {
    const mardroemeCandidate = game8OfficialCardCandidates.find((candidate) =>
      candidate.source.abilities.includes("mardroeme"),
    );
    expect(mardroemeCandidate).toBeDefined();
    const joined = mardroemeCandidate!.portingIssues.join(" ");
    expect(joined).not.toContain("rule_gap:mardroeme");
  });

  it("does not flag Skellige Storm as a metadata mismatch", () => {
    const stormCandidate = game8OfficialCardCandidates.find((candidate) =>
      candidate.source.abilities.includes("skellige_storm"),
    );
    expect(stormCandidate).toBeDefined();
    const joined = stormCandidate!.portingIssues.join(" ");
    expect(joined).not.toContain("metadata_mismatch");
  });
});
