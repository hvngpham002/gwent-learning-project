import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  EngineRuleError,
  calculateScores,
  executeCommand,
  getLegalMoves,
  getRowHornPolicyBySeat,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type EngineCommand,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogCardSource, CatalogRow } from "@/game/catalog";

const findCleanUnit = (predicate: (card: CatalogCardSource) => boolean): CatalogCardSource => {
  const candidate = currentCatalogCards.find(
    (card) =>
      card.kind === "unit" &&
      card.tags.includes("non_hero") &&
      card.abilities.length === 1 &&
      card.abilities[0] === "none" &&
      predicate(card),
  );
  if (!candidate) {
    throw new Error("Could not find a clean catalog unit matching the predicate.");
  }
  return candidate;
};

const cleanUnitFor = (row: CatalogRow, strength: number): CatalogCardSource =>
  findCleanUnit((card) => card.rows.length === 1 && card.rows[0] === row && card.strength === strength);

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp19-row-horn-${seed}`,
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

const createState = (seed = "row-horn"): MatchState => startMatch(createConfig(seed)).state;

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

const placeRowHorn = (
  state: MatchState,
  seatId: SeatId,
  cardId: CardInstanceId,
  row: CatalogRow,
) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].horn = cardId;
  state.cardsById[cardId].zone = { kind: "row_horn", seat: seatId, row };
  state.cardsById[cardId].controller = seatId;
};

const setLeader = (state: MatchState, seatId: SeatId, leaderSourceId: string) => {
  state.seats[seatId].leaderSourceId = leaderSourceId;
};

const setRoundEnd = (state: MatchState) => {
  state.phase = "round_end";
  state.pendingPrompt = null;
  state.seats.seat_a.passed = true;
  state.seats.seat_b.passed = true;
};

const score = (state: MatchState) =>
  calculateScores({
    state,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const SIEGEMASTER = "northern-realms.foltest-the-siegemaster";
const EREDIN_RED_RIDERS = "monsters.eredin-commander-of-the-red-riders";
const FRANCESCA_QUEEN = "scoiatael.francesca-findabair-queen-of-dol-blathanna";
const FRANCESCA_BEAUTIFUL = "scoiatael.francesca-findabair-the-beautiful";
const FOLTEST_LORD = "northern-realms.foltest-lord-commander-of-the-north";

describe("getRowHornPolicyBySeat (cCp19)", () => {
  it("maps Foltest: The Siegemaster to siege", () => {
    const state = createState("siegemaster");
    setLeader(state, "seat_a", SIEGEMASTER);
    const policy = getRowHornPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toEqual({ siege: true });
    expect(policy.seat_b).toBeUndefined();
  });

  it("maps Eredin: Commander of the Red Riders to close", () => {
    const state = createState("red-riders");
    setLeader(state, "seat_a", EREDIN_RED_RIDERS);
    const policy = getRowHornPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toEqual({ close: true });
  });

  it("maps Francesca: Queen of Dol Blathanna to close", () => {
    const state = createState("queen");
    setLeader(state, "seat_a", FRANCESCA_QUEEN);
    const policy = getRowHornPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toEqual({ close: true });
  });

  it("maps Francesca: The Beautiful to ranged", () => {
    const state = createState("beautiful");
    setLeader(state, "seat_a", FRANCESCA_BEAUTIFUL);
    const policy = getRowHornPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toEqual({ ranged: true });
  });

  it("derives policy from leader identity, not faction", () => {
    const state = createState("identity");
    // Northern Realms seat with Foltest: Lord Commander → no row horn policy.
    setLeader(state, "seat_a", FOLTEST_LORD);
    const policy = getRowHornPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toBeUndefined();
  });

  it("returns no policy for leaders not present in the supplied catalog", () => {
    const state = createState("missing");
    setLeader(state, "seat_a", SIEGEMASTER);
    const without = currentCatalogLeaders.filter((leader) => leader.sourceId !== SIEGEMASTER);
    const policy = getRowHornPolicyBySeat(state, without);
    expect(policy.seat_a).toBeUndefined();
  });

  it("returns no policy for unsupported leader ability IDs", () => {
    const state = createState("unsupported");
    // Foltest: King of Temeria (`play_fog`) is implemented but not a row horn.
    setLeader(state, "seat_a", "northern-realms.foltest-king-of-temeria");
    const policy = getRowHornPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toBeUndefined();
  });

  it("is deterministic and side-effect free across calls", () => {
    const state = createState("determinism");
    setLeader(state, "seat_a", FRANCESCA_BEAUTIFUL);
    const before = structuredClone(state);
    const a = getRowHornPolicyBySeat(state, currentCatalogLeaders);
    const b = getRowHornPolicyBySeat(state, currentCatalogLeaders);
    expect(a).toEqual(b);
    expect(state).toEqual(before);
  });
});

describe("calculateScores derives row-horn policy from leaders (cCp19)", () => {
  it("double_siege doubles only friendly siege non-hero units", () => {
    const state = createState("double-siege");
    setLeader(state, "seat_a", SIEGEMASTER);

    const friendlySiege = cleanUnitFor("siege", 6);
    const friendlyClose = cleanUnitFor("close", 4);
    const f1 = addCardInstance(state, "seat_a", friendlySiege.sourceId, "fs");
    const f2 = addCardInstance(state, "seat_a", friendlyClose.sourceId, "fc");
    placeOnBoard(state, "seat_a", f1, "siege");
    placeOnBoard(state, "seat_a", f2, "close");

    const breakdown = score(state);
    const siegeEntry = breakdown.cards.find((entry) => entry.cardId === f1);
    const closeEntry = breakdown.cards.find((entry) => entry.cardId === f2);

    expect(siegeEntry?.hornMultiplier).toBe(2);
    expect(siegeEntry?.finalStrength).toBe(friendlySiege.strength * 2);
    expect(siegeEntry?.modifiers).toContain("leader_horn");
    expect(siegeEntry?.modifiers).not.toContain("commanders_horn");
    expect(closeEntry?.hornMultiplier).toBe(1);
    expect(closeEntry?.modifiers).not.toContain("leader_horn");
  });

  it("double_close doubles only friendly close non-hero units (Eredin: Red Riders)", () => {
    const state = createState("double-close");
    setLeader(state, "seat_a", EREDIN_RED_RIDERS);
    const friendlyClose = cleanUnitFor("close", 4);
    const friendlyRanged = cleanUnitFor("ranged", 4);
    const close = addCardInstance(state, "seat_a", friendlyClose.sourceId, "c");
    const ranged = addCardInstance(state, "seat_a", friendlyRanged.sourceId, "r");
    placeOnBoard(state, "seat_a", close, "close");
    placeOnBoard(state, "seat_a", ranged, "ranged");

    const breakdown = score(state);
    expect(breakdown.cards.find((entry) => entry.cardId === close)?.hornMultiplier).toBe(2);
    expect(breakdown.cards.find((entry) => entry.cardId === ranged)?.hornMultiplier).toBe(1);
  });

  it("double_ranged doubles only friendly ranged non-hero units (Francesca: The Beautiful)", () => {
    const state = createState("double-ranged");
    setLeader(state, "seat_a", FRANCESCA_BEAUTIFUL);
    const friendlyRanged = cleanUnitFor("ranged", 4);
    const friendlySiege = cleanUnitFor("siege", 6);
    const ranged = addCardInstance(state, "seat_a", friendlyRanged.sourceId, "r");
    const siege = addCardInstance(state, "seat_a", friendlySiege.sourceId, "s");
    placeOnBoard(state, "seat_a", ranged, "ranged");
    placeOnBoard(state, "seat_a", siege, "siege");

    const breakdown = score(state);
    expect(breakdown.cards.find((entry) => entry.cardId === ranged)?.hornMultiplier).toBe(2);
    expect(breakdown.cards.find((entry) => entry.cardId === siege)?.hornMultiplier).toBe(1);
  });

  it("does not affect opponent rows", () => {
    const state = createState("opponent-unaffected");
    setLeader(state, "seat_a", SIEGEMASTER);

    const opponentSiege = cleanUnitFor("siege", 6);
    const opp = addCardInstance(state, "seat_b", opponentSiege.sourceId, "op");
    placeOnBoard(state, "seat_b", opp, "siege");

    const breakdown = score(state);
    const oppEntry = breakdown.cards.find((entry) => entry.cardId === opp);
    expect(oppEntry?.hornMultiplier).toBe(1);
    expect(oppEntry?.modifiers).not.toContain("leader_horn");
  });

  it("heroes are not doubled", () => {
    const state = createState("hero-immune");
    setLeader(state, "seat_a", SIEGEMASTER);
    // Cerys is a hero with strength 10 in close — change to a siege hero.
    // Use Vesemir (neutral hero, close 6). The Siegemaster covers siege only,
    // so we look for any siege hero.
    const siegeHero = currentCatalogCards.find(
      (card) => card.kind === "hero" && card.rows.includes("siege"),
    );
    expect(siegeHero, "expected at least one siege-row hero in the catalog").toBeDefined();
    const hero = addCardInstance(state, "seat_a", siegeHero!.sourceId, "h");
    placeOnBoard(state, "seat_a", hero, "siege");

    const breakdown = score(state);
    const entry = breakdown.cards.find((c) => c.cardId === hero);
    expect(entry?.isHero).toBe(true);
    expect(entry?.hornMultiplier).toBe(1);
    expect(entry?.finalStrength).toBe(siegeHero!.strength);
    expect(entry?.modifiers).toContain("hero_immune");
    expect(entry?.modifiers).not.toContain("leader_horn");
  });

  it("preserves Weather → Tight Bond → Morale Boost → Horn ordering", () => {
    // Two Catapults under King Bran weather (foreign rule), with our seat using
    // Foltest: The Siegemaster: weather should go first (or be skipped on a
    // non-weathered row), then Tight Bond ×2, then Morale +0, then leader horn ×2.
    const state = createState("ordering");
    setLeader(state, "seat_a", SIEGEMASTER);
    // Place two Catapults on seat_a siege. Catapult is printed 8, Tight Bond 2.
    // No weather. Morale Boost: 0 since no morale_boost source. Leader horn ×2.
    // Expected: each Catapult finalStrength = 8 × 2 (Tight Bond) × 2 (leader horn) = 32.
    const a = addCardInstance(state, "seat_a", "northern-realms.catapult", "a");
    const b = addCardInstance(state, "seat_a", "northern-realms.catapult", "b");
    placeOnBoard(state, "seat_a", a, "siege");
    placeOnBoard(state, "seat_a", b, "siege");

    const breakdown = score(state);
    const entryA = breakdown.cards.find((entry) => entry.cardId === a);
    expect(entryA?.afterWeather).toBe(8);
    expect(entryA?.tightBondMultiplier).toBe(2);
    expect(entryA?.afterTightBond).toBe(16);
    expect(entryA?.moraleBonus).toBe(0);
    expect(entryA?.afterMorale).toBe(16);
    expect(entryA?.hornMultiplier).toBe(2);
    expect(entryA?.finalStrength).toBe(32);
    expect(entryA?.modifiers).toEqual(expect.arrayContaining(["tight_bond", "leader_horn"]));
  });
});

describe("Row horn suppression (cCp19)", () => {
  it("a special Commander's Horn on the row suppresses the leader horn and produces commanders_horn modifier", () => {
    const state = createState("special-horn-suppresses");
    setLeader(state, "seat_a", SIEGEMASTER);
    const friendlySiege = cleanUnitFor("siege", 6);
    const f = addCardInstance(state, "seat_a", friendlySiege.sourceId, "f");
    placeOnBoard(state, "seat_a", f, "siege");

    const horn = addCardInstance(state, "seat_a", "neutral.commanders-horn", "horn");
    placeRowHorn(state, "seat_a", horn, "siege");

    const breakdown = score(state);
    const entry = breakdown.cards.find((e) => e.cardId === f);
    expect(entry?.hornMultiplier).toBe(2);
    expect(entry?.modifiers).toContain("commanders_horn");
    expect(entry?.modifiers).not.toContain("leader_horn");

    // No multiple_horn_sources diagnostic just because the leader passive exists.
    expect(
      breakdown.diagnostics.some((d) => d.code === "multiple_horn_sources"),
    ).toBe(false);
  });

  it("a unit-source Commander's Horn on the row suppresses the leader horn and preserves self-exclusion", () => {
    const state = createState("unit-horn-suppresses");
    setLeader(state, "seat_a", EREDIN_RED_RIDERS);
    // Dandelion is a unit with `commanders_horn` on the close row.
    const dandelion = addCardInstance(state, "seat_a", "neutral.dandelion", "d");
    placeOnBoard(state, "seat_a", dandelion, "close");

    const friendlyClose = cleanUnitFor("close", 4);
    const ally = addCardInstance(state, "seat_a", friendlyClose.sourceId, "ally");
    placeOnBoard(state, "seat_a", ally, "close");

    const breakdown = score(state);
    const dandelionEntry = breakdown.cards.find((entry) => entry.cardId === dandelion);
    const allyEntry = breakdown.cards.find((entry) => entry.cardId === ally);

    // Dandelion is the horn source; it does not horn itself.
    expect(dandelionEntry?.hornMultiplier).toBe(1);
    expect(dandelionEntry?.modifiers).not.toContain("commanders_horn");
    expect(dandelionEntry?.modifiers).not.toContain("leader_horn");

    // Ally gets commanders_horn (physical horn), not leader_horn.
    expect(allyEntry?.hornMultiplier).toBe(2);
    expect(allyEntry?.modifiers).toContain("commanders_horn");
    expect(allyEntry?.modifiers).not.toContain("leader_horn");

    expect(
      breakdown.diagnostics.some((d) => d.code === "multiple_horn_sources"),
    ).toBe(false);
  });

  it("leader horn alone (no physical horn) produces leader_horn marker", () => {
    const state = createState("leader-only");
    setLeader(state, "seat_a", SIEGEMASTER);
    const friendlySiege = cleanUnitFor("siege", 6);
    const f = addCardInstance(state, "seat_a", friendlySiege.sourceId, "f");
    placeOnBoard(state, "seat_a", f, "siege");

    const breakdown = score(state);
    const entry = breakdown.cards.find((e) => e.cardId === f);
    expect(entry?.hornMultiplier).toBe(2);
    expect(entry?.modifiers).toContain("leader_horn");
    expect(entry?.modifiers).not.toContain("commanders_horn");
  });

  it("does not emit multiple_horn_sources diagnostic just because the leader passive exists", () => {
    const state = createState("no-spurious-diagnostic");
    setLeader(state, "seat_a", FRANCESCA_BEAUTIFUL);
    const friendlyRanged = cleanUnitFor("ranged", 4);
    const r = addCardInstance(state, "seat_a", friendlyRanged.sourceId, "r");
    placeOnBoard(state, "seat_a", r, "ranged");

    const breakdown = score(state);
    expect(
      breakdown.diagnostics.some((d) => d.code === "multiple_horn_sources"),
    ).toBe(false);
  });
});

describe("Explicit row-horn policy override (cCp19)", () => {
  it("rowHornPolicyBySeat overrides the derived helper", () => {
    const state = createState("explicit-override");
    // Foltest: Lord Commander does not have a row horn, but explicit override forces siege.
    setLeader(state, "seat_a", FOLTEST_LORD);
    const friendlySiege = cleanUnitFor("siege", 6);
    const f = addCardInstance(state, "seat_a", friendlySiege.sourceId, "f");
    placeOnBoard(state, "seat_a", f, "siege");

    const breakdown = calculateScores({
      state,
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
      rowHornPolicyBySeat: { seat_a: { siege: true } },
    });
    const entry = breakdown.cards.find((e) => e.cardId === f);
    expect(entry?.hornMultiplier).toBe(2);
    expect(entry?.modifiers).toContain("leader_horn");
  });
});

describe("Scorch and round resolution use row-horn effective strength (cCp19)", () => {
  it("Special Scorch picks targets after row-horn doubling", () => {
    const state = createState("scorch-after-horn");
    setLeader(state, "seat_a", SIEGEMASTER);
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.pendingPrompt = null;
    state.seats.seat_a.passed = false;
    state.seats.seat_b.passed = false;

    // Friendly siege printed 6 → with double_siege becomes 12.
    // Opponent ranged printed 6 → 6.
    // Special Scorch should target the friendly siege unit (12 > 6).
    const friendlySiege = cleanUnitFor("siege", 6);
    const friendly = addCardInstance(state, "seat_a", friendlySiege.sourceId, "fs");
    placeOnBoard(state, "seat_a", friendly, "siege");
    const opponentRanged = cleanUnitFor("ranged", 6);
    const opponent = addCardInstance(state, "seat_b", opponentRanged.sourceId, "or");
    placeOnBoard(state, "seat_b", opponent, "ranged");

    const scorch = addCardInstance(state, "seat_a", "neutral.scorch", "scorch");

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: scorch,
      target: { kind: "none" },
    });

    // Friendly siege (12) is highest — destroyed; opponent ranged (6) survives.
    expect(result.state.seats.seat_a.discard).toContain(friendly);
    expect(result.state.seats.seat_b.board.ranged.units).toContain(opponent);
  });

  it("round resolution uses row-horn effective strength for round winner and gem loss", () => {
    const state = createState("round-resolve-horn");
    setLeader(state, "seat_a", SIEGEMASTER);
    // seat_a siege printed 4 → 8 (leader horn). seat_b close printed 5 → 5.
    // seat_a wins.
    const friendly = cleanUnitFor("siege", 4);
    const f = addCardInstance(state, "seat_a", friendly.sourceId, "fs");
    placeOnBoard(state, "seat_a", f, "siege");
    const opponent = cleanUnitFor("close", 5);
    const op = addCardInstance(state, "seat_b", opponent.sourceId, "oc");
    placeOnBoard(state, "seat_b", op, "close");
    setRoundEnd(state);

    const result = execute(state, { type: "ResolveRoundEnd" });
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "round_resolved",
        winner: "seat_a",
        scoreBySeat: { seat_a: 8, seat_b: 5 },
      }),
    );
    // Loser loses a gem; winner does not.
    expect(result.state.seats.seat_a.gems).toBe(2);
    expect(result.state.seats.seat_b.gems).toBe(1);
    const lastRound = result.state.roundHistory.at(-1);
    expect(lastRound?.scoreBySeat).toEqual({ seat_a: 8, seat_b: 5 });
  });
});

describe("Row-horn passives are passive — no use_leader move and no leaderUsed (cCp19)", () => {
  const passiveLeaderIds = [
    SIEGEMASTER,
    EREDIN_RED_RIDERS,
    FRANCESCA_QUEEN,
    FRANCESCA_BEAUTIFUL,
  ];

  passiveLeaderIds.forEach((leaderSourceId) => {
    it(`getLegalMoves emits no use_leader move for ${leaderSourceId}`, () => {
      const state = createState(`no-use-leader-${leaderSourceId}`);
      setLeader(state, "seat_a", leaderSourceId);
      state.phase = "playing";
      state.currentTurn = "seat_a";
      state.pendingPrompt = null;
      state.seats.seat_a.passed = false;
      state.seats.seat_b.passed = false;

      const legal = getLegalMoves({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
        catalogLeaders: currentCatalogLeaders,
      });
      expect(legal.some((move) => move.kind === "use_leader")).toBe(false);
    });

    it(`rejects a manual UseLeader command for ${leaderSourceId} without consuming the leader`, () => {
      const state = createState(`reject-${leaderSourceId}`);
      setLeader(state, "seat_a", leaderSourceId);
      state.phase = "playing";
      state.currentTurn = "seat_a";
      state.pendingPrompt = null;
      state.seats.seat_a.passed = false;
      state.seats.seat_b.passed = false;
      const before = structuredClone(state);
      expect(() =>
        execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } }),
      ).toThrow(EngineRuleError);
      expect(state).toEqual(before);
      expect(state.seats.seat_a.leaderUsed).toBe(false);
    });
  });

  it("does not emit a leader_used event for the passive during normal play", () => {
    const state = createState("no-leader-used-event");
    setLeader(state, "seat_a", SIEGEMASTER);
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.pendingPrompt = null;
    state.seats.seat_a.passed = false;
    state.seats.seat_b.passed = false;

    const result = execute(state, { type: "Pass", seatId: "seat_a" });
    expect(result.events.some((event) => event.type === "leader_used")).toBe(false);
    expect(result.state.seats.seat_a.leaderUsed).toBe(false);
  });
});
