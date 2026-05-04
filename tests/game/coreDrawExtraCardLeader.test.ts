import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  scoiataelCatalogLeaders,
} from "@/data/catalog";
import {
  BASE_INITIAL_HAND_SIZE,
  DRAW_EXTRA_CARD_LEADER_SOURCE_ID,
  EngineRuleError,
  executeCommand,
  getInitialHandDrawCountForLeader,
  getLegalMoves,
  startMatch,
  type CardInstanceId,
  type ChooseMulliganMove,
  type EngineCommand,
  type GameEvent,
  type LegalMove,
  type MatchConfig,
  type MatchState,
  type SeatId,
  type UseLeaderMove,
} from "@/game/core";
import {
  CATALOG_LEADER_ABILITY_METADATA,
  type CatalogLeaderSource,
} from "@/game/catalog";
import { officialLeaderPromotionManifest } from "@/data/catalog/leaders/official-promotion";

const DAISY = "scoiatael.francesca-findabair-daisy-of-the-valley";

// Build a Scoia'tael preset that uses Daisy as its leader.
const daisyScoiataelPreset = {
  presetId: "test-scoiatael-daisy",
  name: "Test Scoia'tael Daisy",
  faction: "scoiatael" as const,
  leaderSourceId: DAISY,
  mainDeck: [
    { sourceId: "scoiatael.isengrim-faoiltiarna", count: 1 },
    { sourceId: "scoiatael.eithne", count: 1 },
    { sourceId: "scoiatael.iorveth", count: 1 },
    { sourceId: "scoiatael.saesenthessis", count: 1 },
    { sourceId: "scoiatael.dol-blathanna-scout", count: 3 },
    { sourceId: "scoiatael.havekar-smuggler", count: 3 },
    { sourceId: "scoiatael.havekar-healer", count: 3 },
    { sourceId: "scoiatael.mahakaman-defender", count: 3 },
    { sourceId: "scoiatael.elven-skirmisher", count: 3 },
    { sourceId: "scoiatael.vrihedd-brigade-veteran", count: 2 },
    { sourceId: "scoiatael.barclay-els", count: 1 },
    { sourceId: "scoiatael.filavandrel-aen-fidhail", count: 1 },
    { sourceId: "scoiatael.milva", count: 1 },
    { sourceId: "scoiatael.schirru", count: 1 },
    { sourceId: "neutral.geralt-of-rivia", count: 1 },
    { sourceId: "neutral.roach", count: 1 },
    { sourceId: "neutral.triss-merigold", count: 1 },
    { sourceId: "neutral.decoy", count: 2 },
    { sourceId: "neutral.commanders-horn", count: 2 },
    { sourceId: "neutral.scorch", count: 2 },
    { sourceId: "neutral.biting-frost", count: 1 },
    { sourceId: "neutral.impenetrable-fog", count: 1 },
  ],
  sideDeck: [],
};

// Build a non-Daisy Scoia'tael preset that uses The Beautiful (passive
// `double_ranged`) so that the only difference between the Daisy and non-Daisy
// configs is the leader identity.
const beautifulScoiataelPreset = {
  ...daisyScoiataelPreset,
  presetId: "test-scoiatael-beautiful",
  name: "Test Scoia'tael Beautiful",
  leaderSourceId: "scoiatael.francesca-findabair-the-beautiful",
};

const createConfig = (
  seed: string | number,
  options: {
    seatALeader?: "daisy" | "beautiful" | "northern-realms";
    seatBLeader?: "daisy" | "beautiful" | "nilfgaard";
  } = {},
): MatchConfig => {
  const seatALeader = options.seatALeader ?? "northern-realms";
  const seatBLeader = options.seatBLeader ?? "nilfgaard";

  const seatADeck =
    seatALeader === "daisy"
      ? daisyScoiataelPreset
      : seatALeader === "beautiful"
        ? beautifulScoiataelPreset
        : currentNorthernRealmsDeckPreset;
  const seatBDeck =
    seatBLeader === "daisy"
      ? daisyScoiataelPreset
      : seatBLeader === "beautiful"
        ? beautifulScoiataelPreset
        : currentNilfgaardDeckPreset;

  return {
    matchId: `cCp26-draw-extra-${seed}`,
    seed,
    seats: [
      {
        seatId: "seat_a",
        playerId: "player-a",
        controllerKind: "human",
        faction: seatADeck.faction,
        deckPreset: seatADeck,
      },
      {
        seatId: "seat_b",
        playerId: "player-b",
        controllerKind: "ai",
        faction: seatBDeck.faction,
        deckPreset: seatBDeck,
      },
    ],
    catalog: {
      cards: currentCatalogCards,
      leaders: currentCatalogLeaders,
    },
  };
};

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const legalMovesFor = (state: MatchState, seatId: SeatId): LegalMove[] =>
  getLegalMoves({
    state,
    seatId,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const useLeaderMoves = (state: MatchState, seatId: SeatId): UseLeaderMove[] =>
  legalMovesFor(state, seatId).filter((move): move is UseLeaderMove => move.kind === "use_leader");

const mulliganMoves = (state: MatchState, seatId: SeatId): ChooseMulliganMove[] =>
  legalMovesFor(state, seatId).filter(
    (move): move is ChooseMulliganMove => move.kind === "choose_mulligan",
  );

const givePlayingTurn = (state: MatchState, seatId: SeatId) => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.seats.seat_a.mulliganComplete = true;
  state.seats.seat_b.mulliganComplete = true;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
  state.pendingPrompt = null;
};

const walkFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    return statSync(fullPath).isDirectory() ? walkFiles(fullPath) : [fullPath];
  });

describe("draw_extra_card metadata and manifest (cCp26)", () => {
  it("promotes draw_extra_card to implemented", () => {
    expect(CATALOG_LEADER_ABILITY_METADATA.draw_extra_card.status).toBe("implemented");
    expect(CATALOG_LEADER_ABILITY_METADATA.draw_extra_card.description.length).toBeGreaterThan(0);
  });

  it("includes Daisy in implementedSetupLeaderSourceIds and not in executable or passive sets", () => {
    expect(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds).toContain(DAISY);
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).not.toContain(DAISY);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).not.toContain(DAISY);
  });

  it("includes Daisy in implementedLeaderSourceIds (the union)", () => {
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toContain(DAISY);
  });

  it("removes draw_extra_card from placeholderLeaderAbilityIds", () => {
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain(
      "draw_extra_card",
    );
  });

  it("placeholder list has exactly the one remaining placeholder ability (after cCp28)", () => {
    expect([...officialLeaderPromotionManifest.placeholderLeaderAbilityIds].sort()).toEqual([
      "cancel_leader",
    ]);
  });

  it("has the expected manifest counts after cCp28", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toHaveLength(13);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).toHaveLength(7);
    expect(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds).toHaveLength(1);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toHaveLength(21);
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).toHaveLength(1);
  });
});

describe("getInitialHandDrawCountForLeader helper (cCp26)", () => {
  it("returns 11 for Daisy", () => {
    expect(
      getInitialHandDrawCountForLeader({
        leaderSourceId: DAISY,
        catalogLeaders: currentCatalogLeaders,
      }),
    ).toBe(11);
  });

  it("returns 10 for a non-Daisy leader", () => {
    expect(
      getInitialHandDrawCountForLeader({
        leaderSourceId: "scoiatael.francesca-findabair-the-beautiful",
        catalogLeaders: currentCatalogLeaders,
      }),
    ).toBe(10);
  });

  it("returns 10 for a missing leader catalog entry", () => {
    expect(
      getInitialHandDrawCountForLeader({
        leaderSourceId: "scoiatael.does-not-exist",
        catalogLeaders: currentCatalogLeaders,
      }),
    ).toBe(10);
  });

  it("returns the base draw count for a non-Daisy leader when baseDrawCount is overridden", () => {
    expect(
      getInitialHandDrawCountForLeader({
        leaderSourceId: "scoiatael.francesca-findabair-the-beautiful",
        catalogLeaders: currentCatalogLeaders,
        baseDrawCount: 5,
      }),
    ).toBe(5);
  });

  it("returns baseDrawCount + 1 for Daisy when baseDrawCount is overridden", () => {
    expect(
      getInitialHandDrawCountForLeader({
        leaderSourceId: DAISY,
        catalogLeaders: currentCatalogLeaders,
        baseDrawCount: 5,
      }),
    ).toBe(6);
  });

  it("exports the canonical Daisy source ID and base hand size constants", () => {
    expect(DRAW_EXTRA_CARD_LEADER_SOURCE_ID).toBe(DAISY);
    expect(BASE_INITIAL_HAND_SIZE).toBe(10);
  });

  it("does not match a leader catalog entry whose ability is not draw_extra_card even if its sourceId matches Daisy", () => {
    // Defensive check: the helper should look at `ability`, not just the
    // source ID. Build a synthetic catalog where Daisy's sourceId carries a
    // different ability and assert the helper reads ability, not ID.
    const synthetic: CatalogLeaderSource[] = [
      {
        sourceId: DAISY,
        name: "Synthetic",
        faction: "scoiatael",
        ability: "play_frost",
        image: "/images/scoiatael/leaders/Francesca_Findabair_Daisy_of_The_Valley.png",
      },
    ];
    expect(
      getInitialHandDrawCountForLeader({
        leaderSourceId: DAISY,
        catalogLeaders: synthetic,
      }),
    ).toBe(10);
  });
});

describe("Daisy initial draw behavior (cCp26)", () => {
  it("starts a Daisy seat with 11 hand cards and reduces deck by 11", () => {
    const transaction = startMatch(createConfig("daisy-vs-nr", { seatALeader: "daisy" }));
    const seatA = transaction.state.seats.seat_a;
    const seatB = transaction.state.seats.seat_b;

    expect(seatA.hand).toHaveLength(11);
    expect(seatB.hand).toHaveLength(10);

    const totalSeatACards = daisyScoiataelPreset.mainDeck.reduce((acc, entry) => acc + entry.count, 0);
    expect(seatA.deck).toHaveLength(totalSeatACards - 11);
  });

  it("the opposing non-Daisy seat still starts with 10 hand cards", () => {
    const { state } = startMatch(createConfig("opp-non-daisy", { seatALeader: "daisy" }));
    expect(state.seats.seat_b.hand).toHaveLength(10);
  });

  it("two Daisy seats both draw 11", () => {
    const { state } = startMatch(
      createConfig("two-daisy", { seatALeader: "daisy", seatBLeader: "daisy" }),
    );
    expect(state.seats.seat_a.hand).toHaveLength(11);
    expect(state.seats.seat_b.hand).toHaveLength(11);
  });

  it("emits initial_hand_drawn for Daisy with exactly 11 card IDs", () => {
    const { state, events } = startMatch(createConfig("daisy-event", { seatALeader: "daisy" }));
    const seatA = state.seats.seat_a;

    const initialHandDrawn = events.filter(
      (event): event is Extract<GameEvent, { type: "initial_hand_drawn" }> =>
        event.type === "initial_hand_drawn",
    );
    expect(initialHandDrawn).toHaveLength(2);

    const daisyDrawn = initialHandDrawn.find((event) => event.seatId === "seat_a");
    expect(daisyDrawn).toBeDefined();
    expect(daisyDrawn!.cardIds).toHaveLength(11);
    expect(daisyDrawn!.cardIds).toEqual(seatA.hand);

    const nonDaisyDrawn = initialHandDrawn.find((event) => event.seatId === "seat_b");
    expect(nonDaisyDrawn).toBeDefined();
    expect(nonDaisyDrawn!.cardIds).toHaveLength(10);
  });

  it("emits exactly 11 card_moved events with reason initial_draw for the Daisy seat", () => {
    const { events } = startMatch(createConfig("daisy-card-moves", { seatALeader: "daisy" }));
    const initialDrawForA = events.filter(
      (event): event is Extract<GameEvent, { type: "card_moved" }> =>
        event.type === "card_moved" &&
        event.reason === "initial_draw" &&
        event.to.kind === "hand" &&
        event.to.seat === "seat_a",
    );
    expect(initialDrawForA).toHaveLength(11);
  });

  it("places drawn cards in the hand zone and remaining deck cards in the deck zone", () => {
    const { state } = startMatch(createConfig("daisy-zones", { seatALeader: "daisy" }));
    const seatA = state.seats.seat_a;
    seatA.hand.forEach((cardId) => {
      expect(state.cardsById[cardId].zone).toEqual({ kind: "hand", seat: "seat_a" });
    });
    seatA.deck.forEach((cardId) => {
      expect(state.cardsById[cardId].zone).toEqual({ kind: "deck", seat: "seat_a" });
    });
  });

  it("leaves leaderUsed at false for Daisy after setup", () => {
    const { state } = startMatch(createConfig("daisy-leader-used", { seatALeader: "daisy" }));
    expect(state.seats.seat_a.leaderUsed).toBe(false);
    expect(state.seats.seat_a.leaderSourceId).toBe(DAISY);
  });

  it("does not emit a leader_used event during Daisy setup", () => {
    const { events } = startMatch(createConfig("daisy-no-leader-used", { seatALeader: "daisy" }));
    expect(events.some((event) => event.type === "leader_used")).toBe(false);
  });

  it("leaves match phase as mulligan after Daisy setup", () => {
    const { state } = startMatch(createConfig("daisy-phase", { seatALeader: "daisy" }));
    expect(state.phase).toBe("mulligan");
  });

  it("starts mulligansUsed at 0 for Daisy", () => {
    const { state } = startMatch(createConfig("daisy-mulligans", { seatALeader: "daisy" }));
    expect(state.seats.seat_a.mulligansUsed).toBe(0);
    expect(state.seats.seat_b.mulligansUsed).toBe(0);
  });
});

describe("Daisy determinism and top-of-deck behavior (cCp26)", () => {
  it("same seed and same Daisy config produces identical state and events", () => {
    expect(startMatch(createConfig("daisy-same-seed", { seatALeader: "daisy" }))).toEqual(
      startMatch(createConfig("daisy-same-seed", { seatALeader: "daisy" })),
    );
  });

  it("different seeds can yield different Daisy hands", () => {
    const a = startMatch(createConfig("daisy-seed-alpha", { seatALeader: "daisy" }));
    const b = startMatch(createConfig("daisy-seed-beta", { seatALeader: "daisy" }));
    expect(a.state.seats.seat_a.hand).not.toEqual(b.state.seats.seat_a.hand);
  });

  it("Daisy's first 10 hand cards match a non-Daisy seat's first 10 hand cards when only the leader differs", () => {
    // Same deck list, same seed, only the leader differs. Because the leader
    // is instantiated before the deck shuffle and the deck instances are
    // generated from the deck list (not the leader), the shuffled deck
    // sequence depends only on the seeded RNG, the deck contents, and the
    // ordinal layout. The leader is instantiated as ordinal 1 in both
    // configs, so the deck instance IDs and post-shuffle order are identical.
    const daisy = startMatch(createConfig("compare-top", { seatALeader: "daisy" }));
    const beautiful = startMatch(createConfig("compare-top", { seatALeader: "beautiful" }));

    const daisyHand = daisy.state.seats.seat_a.hand;
    const beautifulHand = beautiful.state.seats.seat_a.hand;

    expect(daisyHand).toHaveLength(11);
    expect(beautifulHand).toHaveLength(10);
    expect(daisyHand.slice(0, 10)).toEqual(beautifulHand);
  });

  it("Daisy's 11th hand card matches the non-Daisy post-draw deck top", () => {
    const daisy = startMatch(createConfig("compare-eleventh", { seatALeader: "daisy" }));
    const beautiful = startMatch(createConfig("compare-eleventh", { seatALeader: "beautiful" }));

    const daisyHand = daisy.state.seats.seat_a.hand;
    const beautifulDeck = beautiful.state.seats.seat_a.deck;

    expect(daisyHand[10]).toBe(beautifulDeck[0]);
  });

  it("does not call Math.random inside src/game/core", () => {
    const coreFiles = walkFiles(join(process.cwd(), "src/game/core"));
    const coreText = coreFiles.map((file) => readFileSync(file, "utf8")).join("\n");

    expect(coreText).not.toContain("Math.random");
  });
});

describe("Daisy legal moves (cCp26)", () => {
  it("includes keep-hand and one-card mulligan options for all 11 hand cards", () => {
    const { state } = startMatch(createConfig("daisy-mulligan-moves", { seatALeader: "daisy" }));
    const moves = mulliganMoves(state, "seat_a");

    // 1 keep-hand + 11 single-card mulligan options = 12 moves
    expect(moves).toHaveLength(12);
    expect(moves.filter((move) => move.cardIds.length === 0)).toHaveLength(1);
    expect(moves.filter((move) => move.cardIds.length === 1)).toHaveLength(11);

    const handIds = new Set(state.seats.seat_a.hand);
    moves
      .filter((move) => move.cardIds.length === 1)
      .forEach((move) => {
        expect(handIds.has(move.cardIds[0])).toBe(true);
      });
  });

  it("keeps the mulligan budget capped at two redraws after setup", () => {
    const { state } = startMatch(createConfig("daisy-mulligan-cap", { seatALeader: "daisy" }));

    // First mulligan: pick the lexicographically first hand card.
    const firstMoves = mulliganMoves(state, "seat_a");
    const firstMulligan = firstMoves.find((move) => move.cardIds.length === 1);
    expect(firstMulligan).toBeDefined();

    const after1 = execute(state, {
      type: "ChooseMulligan",
      seatId: "seat_a",
      cardIds: firstMulligan!.cardIds,
    });
    expect(after1.state.seats.seat_a.mulligansUsed).toBe(1);
    expect(after1.state.seats.seat_a.mulliganComplete).toBe(false);
    expect(after1.state.seats.seat_a.hand).toHaveLength(11);

    const secondMoves = mulliganMoves(after1.state, "seat_a");
    const secondMulligan = secondMoves.find((move) => move.cardIds.length === 1);
    expect(secondMulligan).toBeDefined();

    const after2 = execute(after1.state, {
      type: "ChooseMulligan",
      seatId: "seat_a",
      cardIds: secondMulligan!.cardIds,
    });
    expect(after2.state.seats.seat_a.mulligansUsed).toBe(2);
    expect(after2.state.seats.seat_a.mulliganComplete).toBe(true);
    expect(after2.state.seats.seat_a.hand).toHaveLength(11);

    // After two redraws, mulligan is complete for the seat — no further legal
    // mulligan moves are emitted (mirroring the existing two-redraw cap).
    const thirdMoves = mulliganMoves(after2.state, "seat_a");
    expect(thirdMoves).toHaveLength(0);
  });

  it("emits no use_leader move for Daisy in playing phase", () => {
    const { state } = startMatch(createConfig("daisy-playing", { seatALeader: "daisy" }));
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("rejects manual UseLeader for Daisy without setting leaderUsed", () => {
    const { state } = startMatch(createConfig("daisy-manual-leader", { seatALeader: "daisy" }));
    givePlayingTurn(state, "seat_a");

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "none" },
      }),
    ).toThrow(EngineRuleError);

    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });
});

describe("Daisy regression with default Northern Realms vs Nilfgaard setup (cCp26)", () => {
  it("default current preset still draws 10 cards per seat", () => {
    const { state } = startMatch(createConfig("default-setup"));
    expect(state.seats.seat_a.hand).toHaveLength(10);
    expect(state.seats.seat_b.hand).toHaveLength(10);
  });

  it("seat_a and seat_b both have leaderUsed false after default setup", () => {
    const { state } = startMatch(createConfig("default-leader-used"));
    expect(state.seats.seat_a.leaderUsed).toBe(false);
    expect(state.seats.seat_b.leaderUsed).toBe(false);
  });

  it("the catalog Daisy entry still carries draw_extra_card", () => {
    const daisyEntry = scoiataelCatalogLeaders.find((leader) => leader.sourceId === DAISY);
    expect(daisyEntry).toBeDefined();
    expect(daisyEntry!.ability).toBe("draw_extra_card");
  });

  it("custom test deck shorter than 11 cards does not throw under Daisy", () => {
    const tinyDaisyPreset = {
      ...daisyScoiataelPreset,
      presetId: "tiny-daisy-preset",
      mainDeck: [
        { sourceId: "scoiatael.dol-blathanna-scout", count: 3 },
        { sourceId: "neutral.geralt-of-rivia", count: 1 },
      ],
      sideDeck: [],
    };
    const tinyConfig: MatchConfig = {
      matchId: "tiny-daisy",
      seed: "tiny-daisy",
      seats: [
        {
          seatId: "seat_a",
          playerId: "player-a",
          controllerKind: "human",
          faction: "scoiatael",
          deckPreset: tinyDaisyPreset,
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
    };
    expect(() => startMatch(tinyConfig)).not.toThrow();
    const { state } = startMatch(tinyConfig);

    // Tiny deck has only 4 cards total. Daisy still draws 4 (the available
    // cards), not throwing solely because of `draw_extra_card`.
    expect(state.seats.seat_a.hand).toHaveLength(4);
    expect(state.seats.seat_a.deck).toHaveLength(0);
  });
});

// Confirm the cross-tranche regression: prior implemented leaders still work.
describe("draw_extra_card does not regress prior implemented leaders (cCp26)", () => {
  it("draw_extra_card metadata is implemented along with all other prior implemented leaders", () => {
    const expectedImplemented = [
      "clear_weather",
      "play_frost",
      "play_fog",
      "play_rain",
      "play_any_weather",
      "weather_half_penalty",
      "scorch_range",
      "scorch_siege",
      "double_siege",
      "double_close",
      "double_ranged",
      "double_spies",
      "optimize_agile_rows",
      "restore_discard_to_hand",
      "shuffle_discards_into_decks",
      "draw_opponent_discard",
      "random_medic",
      "draw_extra_card",
    ] as const;

    expectedImplemented.forEach((ability) => {
      expect(CATALOG_LEADER_ABILITY_METADATA[ability].status).toBe("implemented");
    });
  });

  it("manifest implementedSetupLeaderSourceIds list is exactly the cCp26 set", () => {
    expect([...officialLeaderPromotionManifest.implementedSetupLeaderSourceIds].sort()).toEqual([
      DAISY,
    ]);
  });

  it("Daisy's setup-time draw does not stage a card into seat.discard for either seat", () => {
    const { state } = startMatch(createConfig("daisy-no-discard", { seatALeader: "daisy" }));
    expect(state.seats.seat_a.discard).toEqual([]);
    expect(state.seats.seat_b.discard).toEqual([]);
  });

  it("opponent hand IDs are not exposed through Daisy's setup events", () => {
    const { state, events } = startMatch(
      createConfig("daisy-hidden-info", { seatALeader: "daisy" }),
    );
    const seatBHand = new Set<CardInstanceId>(state.seats.seat_b.hand);
    // initial_hand_drawn for seat_a should not contain any seat_b hand ID.
    const seatAHandDrawn = events.find(
      (event): event is Extract<GameEvent, { type: "initial_hand_drawn" }> =>
        event.type === "initial_hand_drawn" && event.seatId === "seat_a",
    );
    expect(seatAHandDrawn).toBeDefined();
    seatAHandDrawn!.cardIds.forEach((cardId) => {
      expect(seatBHand.has(cardId)).toBe(false);
    });
  });
});
