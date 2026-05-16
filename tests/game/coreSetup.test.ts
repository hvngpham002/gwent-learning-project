import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialScoiataelStarterDeckPreset,
} from "@/data/catalog";
import { executeCommand, startMatch, type GameEvent, type MatchConfig } from "@/game/core";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `test-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: "northern_realms",
      deckPreset: currentNorthernRealmsDeckPreset,
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

const compactSetup = (seed: string | number) => {
  const transaction = startMatch(createConfig(seed));

  return {
    hands: {
      seatA: transaction.state.seats.seat_a.hand,
      seatB: transaction.state.seats.seat_b.hand,
    },
    decks: {
      seatA: transaction.state.seats.seat_a.deck,
      seatB: transaction.state.seats.seat_b.deck,
    },
    currentTurn: transaction.state.currentTurn,
  };
};

const walkFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    return statSync(fullPath).isDirectory() ? walkFiles(fullPath) : [fullPath];
  });

describe("core match setup", () => {
  it("produces identical setup state and events for the same seed and presets", () => {
    expect(startMatch(createConfig("same-seed"))).toEqual(startMatch(createConfig("same-seed")));
  });

  it("can produce different deck or hand order for different seeds", () => {
    expect(compactSetup("seed-alpha")).not.toEqual(compactSetup("seed-beta"));
  });

  it("supports the StartMatch command transaction shape", () => {
    const transaction = executeCommand({ type: "StartMatch", config: createConfig("command-seed") });

    expect(transaction.state.phase).toBe("mulligan");
    expect(transaction.events[0]).toMatchObject({ type: "match_started", seed: "command-seed" });
  });

  it("creates unique runtime IDs for repeated copies while preserving shared source IDs", () => {
    const { state } = startMatch(createConfig("copies"));
    const medics = Object.values(state.cardsById).filter((card) => card.sourceId === "northern-realms.dun-banner-medic");

    expect(medics).toHaveLength(5);
    expect(new Set(medics.map((card) => card.instanceId)).size).toBe(5);
    expect(new Set(medics.map((card) => card.sourceId))).toEqual(new Set(["northern-realms.dun-banner-medic"]));
  });

  it("assigns owner, initial controller, and zone for every initial instance", () => {
    const { state } = startMatch(createConfig("zones"));

    Object.entries(state.seats).forEach(([seatId, seat]) => {
      [...seat.deck, ...seat.hand, ...seat.discard, ...seat.sideDeck, ...seat.removedFromGame].forEach((cardId) => {
        const card = state.cardsById[cardId];

        expect(card.owner).toBe(seatId);
        expect(card.controller).toBe(seatId);
      });

      seat.deck.forEach((cardId) => expect(state.cardsById[cardId].zone).toEqual({ kind: "deck", seat: seat.seatId }));
      seat.hand.forEach((cardId) => expect(state.cardsById[cardId].zone).toEqual({ kind: "hand", seat: seat.seatId }));
      expect(state.cardsById[seat.leader ?? ""].zone).toEqual({ kind: "leader", seat: seat.seatId });
    });
  });

  it("draws 10-card initial hands and shrinks decks by 10", () => {
    // cCp13: each seat's preset gained one Roach for muster_roach visibility,
    // so seat_a (current-northern-realms) now starts at 36 cards (was 35) and
    // seat_b (current-nilfgaard) at 34 (was 33). After the 10-card initial
    // draw the decks shrink to 26 and 24 respectively.
    const { state, events } = startMatch(createConfig("draws"));

    expect(state.seats.seat_a.hand).toHaveLength(10);
    expect(state.seats.seat_b.hand).toHaveLength(10);
    expect(state.seats.seat_a.deck).toHaveLength(26);
    expect(state.seats.seat_b.deck).toHaveLength(24);
    expect(events.filter((event) => event.type === "initial_hand_drawn")).toHaveLength(2);
  });

  it("represents leaders and side-deck entries in normalized state", () => {
    const sideDeckPreset = {
      ...currentNorthernRealmsDeckPreset,
      presetId: "current-northern-realms-with-side-deck",
      sideDeck: [{ sourceId: "neutral.decoy", count: 1 }],
    };
    const { state } = startMatch({
      ...createConfig("side-deck"),
      seats: [
        { ...createConfig("side-deck").seats[0], deckPreset: sideDeckPreset },
        createConfig("side-deck").seats[1],
      ],
    });
    const seat = state.seats.seat_a;

    expect(seat.leader).toBeTruthy();
    expect(state.cardsById[seat.leader ?? ""].sourceKind).toBe("leader");
    expect(seat.sideDeck).toHaveLength(1);
    expect(state.cardsById[seat.sideDeck[0]].zone).toEqual({ kind: "side_deck", seat: "seat_a" });
  });

  it("does not call Math.random inside the core engine module", () => {
    const coreFiles = walkFiles(join(process.cwd(), "src/game/core"));
    const coreText = coreFiles.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(coreText).not.toContain("Math.random");
  });
});

describe("scoiatael first-player choice (cCp32.1: post-mulligan)", () => {
  const createScoiataelConfig = (
    scoiataelSeat: "seat_a" | "seat_b",
  ): MatchConfig => ({
    matchId: `test-scoiatael-${scoiataelSeat}`,
    seed: "test-scoiatael-seed",
    seats: [
      {
        seatId: "seat_a",
        playerId: "player-a",
        controllerKind: "human",
        faction: scoiataelSeat === "seat_a" ? "scoiatael" : "northern_realms",
        deckPreset: scoiataelSeat === "seat_a" ? officialScoiataelStarterDeckPreset : currentNorthernRealmsDeckPreset,
      },
      {
        seatId: "seat_b",
        playerId: "player-b",
        controllerKind: "ai",
        faction: scoiataelSeat === "seat_b" ? "scoiatael" : "nilfgaard",
        deckPreset: scoiataelSeat === "seat_b" ? officialScoiataelStarterDeckPreset : currentNilfgaardDeckPreset,
      },
    ],
    catalog: {
      cards: currentCatalogCards,
      leaders: currentCatalogLeaders,
    },
  });

  it("non-Scoia'tael vs non-Scoia'tael still uses seeded initial_roll", () => {
    const transaction = startMatch(createConfig("non-scoiatael-test"));
    const turnSetEvent = transaction.events.find((e) => e.type === "turn_set");
    expect(turnSetEvent).toMatchObject({ type: "turn_set", reason: "initial_roll" });

    const scoiataelEvents = transaction.events.filter(
      (e) => e.type === "faction_ability_resolved" && (e as GameEvent & { ability?: string }).ability === "scoiatael_choose_first",
    );
    expect(scoiataelEvents).toHaveLength(0);
  });

  it("both seats Scoia'tael use seeded initial_roll without scoiatael_choose_first", () => {
    const config: MatchConfig = {
      matchId: "test-both-scoiatael",
      seed: "both-scoiatael-seed",
      seats: [
        {
          seatId: "seat_a",
          playerId: "player-a",
          controllerKind: "human",
          faction: "scoiatael",
          deckPreset: officialScoiataelStarterDeckPreset,
        },
        {
          seatId: "seat_b",
          playerId: "player-b",
          controllerKind: "ai",
          faction: "scoiatael",
          deckPreset: officialScoiataelStarterDeckPreset,
        },
      ],
      catalog: {
        cards: currentCatalogCards,
        leaders: currentCatalogLeaders,
      },
    };
    const transaction = startMatch(config);
    const turnSetEvent = transaction.events.find((e) => e.type === "turn_set");
    expect(turnSetEvent).toMatchObject({ type: "turn_set", reason: "initial_roll" });

    const scoiataelEvents = transaction.events.filter(
      (e) => e.type === "faction_ability_resolved" && e.ability === "scoiatael_choose_first",
    );
    expect(scoiataelEvents).toHaveLength(0);
  });

  it("seat_a Scoia'tael setup uses seeded initial_roll (no pre-game override)", () => {
    const config = createScoiataelConfig("seat_a");
    const transaction = startMatch(config);
    // cCp32.1: No scoiatael override at setup; all use initial_roll
    const turnSetEvent = transaction.events.find((e) => e.type === "turn_set");
    expect(turnSetEvent).toMatchObject({ type: "turn_set", reason: "initial_roll" });

    const scoiataelEvents = transaction.events.filter(
      (e) => e.type === "faction_ability_resolved" && e.ability === "scoiatael_choose_first",
    );
    expect(scoiataelEvents).toHaveLength(0);
  });

  it("seat_b Scoia'tael setup uses seeded initial_roll (no pre-game override)", () => {
    const config = createScoiataelConfig("seat_b");
    const transaction = startMatch(config);
    // cCp32.1: No scoiatael override at setup; all use initial_roll
    const turnSetEvent = transaction.events.find((e) => e.type === "turn_set");
    expect(turnSetEvent).toMatchObject({ type: "turn_set", reason: "initial_roll" });

    const scoiataelEvents = transaction.events.filter(
      (e) => e.type === "faction_ability_resolved" && e.ability === "scoiatael_choose_first",
    );
    expect(scoiataelEvents).toHaveLength(0);
  });

  it("same seed + scoiatael seat is deterministic across runs", () => {
    const config = createScoiataelConfig("seat_a");
    const t1 = startMatch(config);
    const t2 = startMatch(config);
    expect(t1.state.currentTurn).toBe(t2.state.currentTurn);
    expect(t1.state.seats.seat_a.hand).toEqual(t2.state.seats.seat_a.hand);
  });
});
