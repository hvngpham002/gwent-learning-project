import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialSkelligeStarterDeckPreset,
} from "@/data/catalog";
import {
  executeCommand,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type EngineCommand,
  type GameEvent,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import { resolveAvengerForCard } from "@/game/core/abilities";
import type { CatalogCardSource, CatalogDeckPreset, CatalogRow } from "@/game/catalog";

const createConfig = (
  seed: string | number,
  options: { skelligeSeat?: boolean } = {},
): MatchConfig => ({
  matchId: `cCp11-avenger-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: options.skelligeSeat ? "skellige" : "northern_realms",
      deckPreset: options.skelligeSeat
        ? officialSkelligeStarterDeckPreset
        : currentNorthernRealmsDeckPreset,
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
    cards: currentCatalogCards,
    leaders: currentCatalogLeaders,
  },
});

const createState = (
  seed = "avenger-base",
  options: { skelligeSeat?: boolean } = {},
) => startMatch(createConfig(seed, options)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
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

const addCardInstance = (
  state: MatchState,
  seatId: SeatId,
  sourceId: string,
  suffix: string,
): CardInstanceId => {
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
  controller: SeatId = seatId,
) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
  state.cardsById[cardId].controller = controller;
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

const placeInWeather = (state: MatchState, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
};

const preparePlayingTurn = (state: MatchState, seatId: SeatId = "seat_a") => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.pendingPrompt = null;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
};

const passUntilRoundEnd = (state: MatchState): MatchState => {
  let next = state;
  next.phase = "playing";
  next.pendingPrompt = null;
  next.seats.seat_a.passed = false;
  next.seats.seat_b.passed = false;
  next.currentTurn = "seat_a";
  next = execute(next, { type: "Pass", seatId: "seat_a" }).state;
  next = execute(next, { type: "Pass", seatId: "seat_b" }).state;
  return next;
};

describe("Avenger battlefield removal replacement (cCp11)", () => {
  it("Cow removed by round cleanup summons Bovine Defense Force for the next round", () => {
    const state = createState("cow-cleanup");
    const cow = addCardInstance(state, "seat_a", "neutral.cow", "cow");
    const bovine = addCardInstance(state, "seat_a", "neutral.bovine-defense-force", "bovine");
    placeOnBoard(state, "seat_a", cow, "close");
    placeInSideDeck(state, "seat_a", bovine);

    const passed = passUntilRoundEnd(state);
    const resolved = execute(passed, { type: "ResolveRoundEnd", seatId: "seat_a" }).state;

    expect(resolved.seats.seat_a.discard).toContain(cow);
    expect(resolved.seats.seat_a.sideDeck).not.toContain(bovine);
    expect(resolved.seats.seat_a.board.close.units).toContain(bovine);
    expect(resolved.cardsById[bovine].controller).toBe("seat_a");
  });

  it("Kambi removed by round cleanup summons Hemdall for the next round", () => {
    const state = createState("kambi-cleanup", { skelligeSeat: true });
    // The Skellige starter side deck already has Hemdall — find the existing instance.
    const hemdall = state.seats.seat_a.sideDeck.find(
      (id) => state.cardsById[id]?.sourceId === "skellige.hemdall",
    );
    expect(hemdall).toBeDefined();
    const kambi = addCardInstance(state, "seat_a", "skellige.kambi", "kambi");
    placeOnBoard(state, "seat_a", kambi, "close");

    const passed = passUntilRoundEnd(state);
    const resolved = execute(passed, { type: "ResolveRoundEnd", seatId: "seat_a" }).state;

    expect(resolved.seats.seat_a.discard).toContain(kambi);
    expect(resolved.seats.seat_a.sideDeck).not.toContain(hemdall!);
    expect(resolved.seats.seat_a.board.close.units).toContain(hemdall!);
  });

  it("Avenger replacement is summoned immediately when source is destroyed mid-round (active-row removal)", () => {
    const state = createState("cow-scorch-removal");
    const scorch = addCardInstance(state, "seat_a", "neutral.scorch", "scorch");
    const frost = addCardInstance(state, "seat_a", "neutral.biting-frost", "frost");
    const cow = addCardInstance(state, "seat_b", "neutral.cow", "cow");
    const bovine = addCardInstance(state, "seat_b", "neutral.bovine-defense-force", "bovine");
    placeOnBoard(state, "seat_b", cow, "close");
    placeInSideDeck(state, "seat_b", bovine);
    placeInWeather(state, frost);
    placeInHand(state, "seat_a", scorch);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: scorch,
      target: { kind: "none" },
    });

    expect(result.state.seats.seat_b.discard).toContain(cow);
    expect(result.state.seats.seat_b.sideDeck).not.toContain(bovine);
    expect(result.state.seats.seat_b.board.close.units).toContain(bovine);
    expect(
      result.events.some(
        (event) => event.type === "card_summoned" && event.toCardId === bovine,
      ),
    ).toBe(true);
  });

  it("Avenger source returned by Decoy summons replacement immediately on the same row", () => {
    const state = createState("cow-decoy");
    const decoy = addCardInstance(state, "seat_a", "neutral.decoy", "decoy");
    const cow = addCardInstance(state, "seat_a", "neutral.cow", "cow");
    const bovine = addCardInstance(state, "seat_a", "neutral.bovine-defense-force", "bovine");
    placeOnBoard(state, "seat_a", cow, "close");
    placeInSideDeck(state, "seat_a", bovine);
    placeInHand(state, "seat_a", decoy);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: decoy,
      target: { kind: "card_instance", side: "own", seatId: "seat_a", cardId: cow, row: "close" },
    });

    expect(result.state.seats.seat_a.hand).toContain(cow);
    expect(result.state.seats.seat_a.sideDeck).not.toContain(bovine);
    expect(result.state.seats.seat_a.board.close.units).toContain(bovine);
  });

  it("emits a structured outcome when the linked replacement is missing from the side deck", () => {
    const state = createState("missing-replacement");
    const cow = addCardInstance(state, "seat_a", "neutral.cow", "cow");
    placeOnBoard(state, "seat_a", cow, "close");
    // Intentionally do NOT add bovine to side deck.

    const passed = passUntilRoundEnd(state);
    const resolveResult = execute(passed, { type: "ResolveRoundEnd", seatId: "seat_a" });

    expect(resolveResult.state.seats.seat_a.discard).toContain(cow);
    expect(
      resolveResult.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "avenger" &&
          event.outcome === "missing_replacement",
      ),
    ).toBe(true);
  });

  it("emits a structured outcome when the source has no linked replacement id", () => {
    const state = createState("missing-link");
    const source: CatalogCardSource = {
      sourceId: "test.avenger-without-link",
      name: "Avenger Without Link",
      faction: "neutral",
      kind: "unit",
      strength: 1,
      rows: ["close"],
      abilities: ["avenger"],
      tags: ["non_hero", "avenger"],
      deckLimit: 1,
      image: "/images/neutral/cow.png",
    };
    const avenger = addCardInstance(state, "seat_a", source.sourceId, "missing-link");
    placeOnBoard(state, "seat_a", avenger, "close");
    const events: GameEvent[] = [];

    const outcome = resolveAvengerForCard({
      state,
      events,
      catalogLookup: new Map([[source.sourceId, source]]),
      cardId: avenger,
      destination: { kind: "board_row", seat: "seat_a", row: "close" },
    });

    expect(outcome).toBe("missing_link");
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "ability_resolved",
        abilityId: "avenger",
        outcome: "missing_link",
      }),
    );
  });

  it("does not summon Avenger replacement when Monsters keeps the source", () => {
    const monstersDeck: CatalogDeckPreset = {
      ...currentNorthernRealmsDeckPreset,
      faction: "monsters",
      leaderSourceId: "monsters.eredin-bringer-of-death",
      mainDeck: [...currentNorthernRealmsDeckPreset.mainDeck],
    };
    const config: MatchConfig = {
      matchId: "cCp11-avenger-monsters-keep",
      seed: "avenger-monsters-keep",
      seats: [
        {
          seatId: "seat_a",
          controllerKind: "human",
          faction: "monsters",
          deckPreset: monstersDeck,
        },
        {
          seatId: "seat_b",
          controllerKind: "ai",
          faction: "nilfgaard",
          deckPreset: currentNilfgaardDeckPreset,
        },
      ],
      catalog: {
        cards: currentCatalogCards,
        leaders: currentCatalogLeaders,
      },
    };
    const state = startMatch(config).state;
    const cow = addCardInstance(state, "seat_a", "neutral.cow", "cow");
    const bovine = addCardInstance(state, "seat_a", "neutral.bovine-defense-force", "bovine");
    placeOnBoard(state, "seat_a", cow, "close");
    placeInSideDeck(state, "seat_a", bovine);

    // Make Cow the only eligible unit for Monsters keep.
    const passed = passUntilRoundEnd(state);
    const resolved = execute(passed, { type: "ResolveRoundEnd", seatId: "seat_a" }).state;

    // Cow stays kept; Bovine remains in side deck.
    expect(resolved.seats.seat_a.board.close.units).toContain(cow);
    expect(resolved.seats.seat_a.sideDeck).toContain(bovine);
  });
});
