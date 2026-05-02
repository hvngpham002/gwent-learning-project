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
  getDoubleSpiesPolicyBySeat,
  getLegalMoves,
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
  matchId: `cCp20-double-spies-${seed}`,
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

const createState = (seed = "double-spies"): MatchState => startMatch(createConfig(seed)).state;

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

const placeWeather = (state: MatchState, cardId: CardInstanceId, controller: SeatId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
  state.cardsById[cardId].controller = controller;
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

const TREACHEROUS = "monsters.eredin-breacc-glas-the-treacherous";
const KING_BRAN = "skellige.king-bran";
const FOLTEST_LORD = "northern-realms.foltest-lord-commander-of-the-north";

// Production non-hero Spy units used as fixtures.
const PRINCE_STENNIS = "northern-realms.prince-stennis"; // close, strength 5
const SHILARD = "nilfgaard.shilard-fitz-oesterlen"; // close, strength 7
const STEFAN_SKELLEN = "nilfgaard.stefan-skellen"; // close, strength 9
const VATTIER = "nilfgaard.vattier-de-rideaux"; // close, strength 4

describe("getDoubleSpiesPolicyBySeat (cCp20)", () => {
  it("maps Eredin Breacc Glas: The Treacherous to true", () => {
    const state = createState("treacherous");
    setLeader(state, "seat_a", TREACHEROUS);
    const policy = getDoubleSpiesPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toBe(true);
    expect(policy.seat_b).toBeUndefined();
  });

  it("derives policy from leader identity, not faction", () => {
    const state = createState("identity");
    // A different Monsters leader (Eredin: King of the Wild Hunt, `play_any_weather`)
    // should not enable double_spies.
    setLeader(state, "seat_a", "monsters.eredin-king-of-the-wild-hunt");
    const policy = getDoubleSpiesPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toBeUndefined();
  });

  it("returns no policy when the leader catalog is missing the Treacherous leader", () => {
    const state = createState("missing-leader");
    setLeader(state, "seat_a", TREACHEROUS);
    const without = currentCatalogLeaders.filter((leader) => leader.sourceId !== TREACHEROUS);
    const policy = getDoubleSpiesPolicyBySeat(state, without);
    expect(policy.seat_a).toBeUndefined();
  });

  it("returns no policy for unrelated leader abilities", () => {
    const state = createState("unrelated");
    setLeader(state, "seat_a", FOLTEST_LORD);
    const policy = getDoubleSpiesPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toBeUndefined();
  });

  it("is deterministic and side-effect free across calls", () => {
    const state = createState("determinism");
    setLeader(state, "seat_a", TREACHEROUS);
    const before = structuredClone(state);
    const a = getDoubleSpiesPolicyBySeat(state, currentCatalogLeaders);
    const b = getDoubleSpiesPolicyBySeat(state, currentCatalogLeaders);
    expect(a).toEqual(b);
    expect(state).toEqual(before);
  });
});
describe("calculateScores doubles Spies under Treacherous (cCp20)", () => {
  it("doubles a non-hero Spy on the seat's own board", () => {
    const state = createState("own-spy");
    setLeader(state, "seat_a", TREACHEROUS);
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_a", spy, "close");

    const breakdown = score(state);
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.spyMultiplier).toBe(2);
    expect(entry?.afterSpyMultiplier).toBe(10);
    expect(entry?.finalStrength).toBe(10);
    expect(entry?.modifiers).toContain("leader_double_spies");
  });

  it("doubles a non-hero Spy on the opponent board too (any owner/controller)", () => {
    const state = createState("opponent-spy");
    setLeader(state, "seat_a", TREACHEROUS);
    const spy = addCardInstance(state, "seat_b", SHILARD, "spy");
    // Spies normally land on the opponent board; emulate the placement here.
    placeOnBoard(state, "seat_b", spy, "close", "seat_b");

    const breakdown = score(state);
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.spyMultiplier).toBe(2);
    expect(entry?.finalStrength).toBe(14);
    expect(entry?.modifiers).toContain("leader_double_spies");
  });

  it("doubles spies controlled by the Treacherous opponent (regardless of controller)", () => {
    const state = createState("controller-irrelevant");
    setLeader(state, "seat_a", TREACHEROUS);
    // Spy played by seat_b (opponent), placed on seat_a's board (controller seat_a).
    const spy = addCardInstance(state, "seat_b", SHILARD, "spy");
    placeOnBoard(state, "seat_a", spy, "close", "seat_a");

    const breakdown = score(state);
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.spyMultiplier).toBe(2);
    expect(entry?.modifiers).toContain("leader_double_spies");
  });

  it("doubles spies that enter after initial scoring (next scoring pass picks them up)", () => {
    const state = createState("future-spies");
    setLeader(state, "seat_a", TREACHEROUS);

    // First scoring pass: no spies, no doubling.
    const before = score(state);
    expect(before.cards.some((entry) => entry.modifiers.includes("leader_double_spies"))).toBe(false);

    // Add a spy to the battlefield mid-game.
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "future");
    placeOnBoard(state, "seat_a", spy, "close");

    const after = score(state);
    const entry = after.cards.find((card) => card.cardId === spy);
    expect(entry?.spyMultiplier).toBe(2);
    expect(entry?.modifiers).toContain("leader_double_spies");
  });

  it("does not affect non-Spy units", () => {
    const state = createState("non-spy-unaffected");
    setLeader(state, "seat_a", TREACHEROUS);
    const cleanClose = cleanUnitFor("close", 4);
    const ally = addCardInstance(state, "seat_a", cleanClose.sourceId, "ally");
    placeOnBoard(state, "seat_a", ally, "close");

    const breakdown = score(state);
    const entry = breakdown.cards.find((card) => card.cardId === ally);
    expect(entry?.spyMultiplier).toBe(1);
    expect(entry?.modifiers).not.toContain("leader_double_spies");
  });

  it("does not double a hero Spy (Hero immunity)", () => {
    // Use a small file-local catalog fixture so we can exercise a non-zero hero
    // Spy without depending on production catalog strengths.
    const heroSpy: CatalogCardSource = {
      sourceId: "test.cCp20.hero-spy",
      name: "Test Hero Spy",
      faction: "neutral",
      kind: "hero",
      strength: 6,
      rows: ["close"],
      abilities: ["spy"],
      tags: ["hero"],
      deckLimit: 1,
      image: "/images/neutral/hero_spy.png",
    };
    const state = createState("hero-spy-immune");
    setLeader(state, "seat_a", TREACHEROUS);
    const heroId = addCardInstance(state, "seat_a", heroSpy.sourceId, "hero");
    placeOnBoard(state, "seat_a", heroId, "close");

    const breakdown = calculateScores({
      state,
      catalogCards: [...currentCatalogCards, heroSpy],
      catalogLeaders: currentCatalogLeaders,
    });
    const entry = breakdown.cards.find((card) => card.cardId === heroId);
    expect(entry?.isHero).toBe(true);
    expect(entry?.spyMultiplier).toBe(1);
    expect(entry?.finalStrength).toBe(heroSpy.strength);
    expect(entry?.modifiers).toContain("hero_immune");
    expect(entry?.modifiers).not.toContain("leader_double_spies");
  });

  it("does not stack ×4 if both seats somehow have double_spies", () => {
    const state = createState("no-stack");
    setLeader(state, "seat_a", TREACHEROUS);
    setLeader(state, "seat_b", TREACHEROUS);
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_a", spy, "close");

    const breakdown = score(state);
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.spyMultiplier).toBe(2);
    expect(entry?.finalStrength).toBe(10);
  });

  it("when no seat has double_spies, no Spy carries the leader_double_spies modifier", () => {
    const state = createState("no-policy");
    // Default leaders: Northern Realms vs Nilfgaard, neither is Treacherous.
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_a", spy, "close");

    const breakdown = score(state);
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.spyMultiplier).toBe(1);
    expect(entry?.modifiers).not.toContain("leader_double_spies");
  });
});

describe("Modifier order: Weather → Double-Spies → Tight Bond → Morale → Horn (cCp20)", () => {
  it("weathers a non-hero Spy first, then doubles (printed-1 weather case → 1 × 2 = 2)", () => {
    const state = createState("weather-then-spies");
    setLeader(state, "seat_a", TREACHEROUS);
    // Vattier de Rideaux: close, printed 4. Frost weathers close to 1 (non-King-Bran).
    // Then Double Spies should take 1 × 2 = 2.
    const spy = addCardInstance(state, "seat_a", VATTIER, "spy");
    placeOnBoard(state, "seat_a", spy, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost");
    placeWeather(state, frost, "seat_b");

    const breakdown = score(state);
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.printedStrength).toBe(4);
    expect(entry?.afterWeather).toBe(1);
    expect(entry?.spyMultiplier).toBe(2);
    expect(entry?.afterSpyMultiplier).toBe(2);
    expect(entry?.finalStrength).toBe(2);
    expect(entry?.modifiers).toContain("weather");
    expect(entry?.modifiers).toContain("leader_double_spies");
  });

  it("composes with King Bran (weather half-loss) before double-spies — printed 7 → 4 → 8", () => {
    const state = createState("king-bran-then-spies");
    setLeader(state, "seat_a", TREACHEROUS);
    // Override: seat_a uses King-Bran-style weather. Shilard printed 7 in close →
    // King-Bran half-loss = 7 - floor(7/2) = 4. Then double-spies = 4 × 2 = 8.
    const spy = addCardInstance(state, "seat_a", SHILARD, "spy");
    placeOnBoard(state, "seat_a", spy, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost");
    placeWeather(state, frost, "seat_b");

    const breakdown = calculateScores({
      state,
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
      weatherPolicyBySeat: { seat_a: "king_bran" },
    });
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.printedStrength).toBe(7);
    expect(entry?.afterWeather).toBe(4);
    expect(entry?.spyMultiplier).toBe(2);
    expect(entry?.afterSpyMultiplier).toBe(8);
    expect(entry?.finalStrength).toBe(8);
    expect(entry?.modifiers).toEqual(
      expect.arrayContaining(["weather:king_bran", "leader_double_spies"]),
    );
  });

  it("composes with a row Commander's Horn after double-spies — Spy 5 → 10 → 20", () => {
    const state = createState("horn-after-spies");
    setLeader(state, "seat_a", TREACHEROUS);
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_a", spy, "close");
    const horn = addCardInstance(state, "seat_a", "neutral.commanders-horn", "horn");
    placeRowHorn(state, "seat_a", horn, "close");

    const breakdown = score(state);
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.afterSpyMultiplier).toBe(10);
    expect(entry?.hornMultiplier).toBe(2);
    expect(entry?.finalStrength).toBe(20);
    expect(entry?.modifiers).toEqual(
      expect.arrayContaining(["leader_double_spies", "commanders_horn"]),
    );
  });

  it("composes with a leader-horn passive (cCp19 row-horn) when both passives apply", () => {
    // Override both policies so we can verify the leader-horn ×2 fires after
    // the double-spies stage on the same row, no physical horn present.
    const state = createState("leader-horn-after-spies");
    setLeader(state, "seat_a", TREACHEROUS);
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_a", spy, "close");

    const breakdown = calculateScores({
      state,
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
      rowHornPolicyBySeat: { seat_a: { close: true } },
    });
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.afterSpyMultiplier).toBe(10);
    expect(entry?.hornMultiplier).toBe(2);
    expect(entry?.finalStrength).toBe(20);
    expect(entry?.modifiers).toEqual(
      expect.arrayContaining(["leader_double_spies", "leader_horn"]),
    );
  });
});

describe("Explicit doubleSpiesPolicyBySeat override (cCp20)", () => {
  it("overrides the derived helper to enable double-spies", () => {
    const state = createState("explicit-on");
    setLeader(state, "seat_a", FOLTEST_LORD); // not Treacherous
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_a", spy, "close");

    const breakdown = calculateScores({
      state,
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
      doubleSpiesPolicyBySeat: { seat_a: true },
    });
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.spyMultiplier).toBe(2);
    expect(entry?.modifiers).toContain("leader_double_spies");
  });
});

describe("Scorch and round resolution use double-spies effective strength (cCp20)", () => {
  it("Special Scorch picks targets after double-spies multiplication", () => {
    const state = createState("special-scorch");
    setLeader(state, "seat_a", TREACHEROUS);
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.pendingPrompt = null;
    state.seats.seat_a.passed = false;
    state.seats.seat_b.passed = false;

    // Spy printed 9 → ×2 = 18 (highest). Plain unit printed 10 stays 10.
    const spy = addCardInstance(state, "seat_a", STEFAN_SKELLEN, "spy");
    placeOnBoard(state, "seat_a", spy, "close");
    const cleanRanged = cleanUnitFor("ranged", 10);
    const opponent = addCardInstance(state, "seat_b", cleanRanged.sourceId, "op");
    placeOnBoard(state, "seat_b", opponent, "ranged");

    const scorch = addCardInstance(state, "seat_a", "neutral.scorch", "scorch");

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: scorch,
      target: { kind: "none" },
    });

    // Spy at 18 is highest after double_spies — it should be the destroyed target.
    expect(result.state.seats.seat_a.discard).toContain(spy);
    expect(result.state.seats.seat_b.board.ranged.units).toContain(opponent);
  });

  it("Unit row-Scorch (scorch_siege Schirru) targets a doubled Spy when it becomes row-highest", () => {
    // seat_b has Treacherous. Place a Catapult (printed 8, Tight Bond ×1 = 8) and
    // a Prince Stennis spy (printed 5, ×2 = 10) on seat_b's siege row.
    // Row total = 8 + 10 = 18 ≥ 10 so Schirru fires; tied highest is Stennis at 10.
    const state = createState("schirru-row-scorch");
    setLeader(state, "seat_b", TREACHEROUS);
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.pendingPrompt = null;
    state.seats.seat_a.passed = false;
    state.seats.seat_b.passed = false;

    const catapult = addCardInstance(state, "seat_b", "northern-realms.catapult", "cat");
    placeOnBoard(state, "seat_b", catapult, "siege");
    const spy = addCardInstance(state, "seat_b", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_b", spy, "siege");

    const schirru = addCardInstance(state, "seat_a", "scoiatael.schirru", "schirru");
    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: schirru,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    });

    // The Spy at doubled-10 is the new tied-highest target — without double_spies
    // it would be 5 (less than Catapult's 8), and Catapult would be destroyed.
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(spy);
    expect(result.state.seats.seat_b.board.siege.units).toContain(catapult);
    expect(
      result.events.some(
        (event) =>
          event.type === "scorch_resolved" &&
          event.abilityId === "scorch_siege" &&
          event.outcome === "destroyed",
      ),
    ).toBe(true);
  });

  it("round resolution and gem loss use double-spies effective strength", () => {
    const state = createState("round-resolution");
    setLeader(state, "seat_a", TREACHEROUS);
    // Friendly Spy (printed 5) → 10 with double_spies (ends up on opponent board
    // by Spy mechanics, but for scoring purposes we place a friendly spy on
    // seat_a directly to verify the math.) Opponent close printed 6.
    // With double_spies seat_a = 10, seat_b = 6 → seat_a wins.
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_a", spy, "close");
    const cleanClose = cleanUnitFor("close", 6);
    const opponent = addCardInstance(state, "seat_b", cleanClose.sourceId, "op");
    placeOnBoard(state, "seat_b", opponent, "close");
    setRoundEnd(state);

    const result = execute(state, { type: "ResolveRoundEnd" });
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "round_resolved",
        winner: "seat_a",
        scoreBySeat: { seat_a: 10, seat_b: 6 },
      }),
    );
    expect(result.state.seats.seat_a.gems).toBe(2);
    expect(result.state.seats.seat_b.gems).toBe(1);
    const lastRound = result.state.roundHistory.at(-1);
    expect(lastRound?.scoreBySeat).toEqual({ seat_a: 10, seat_b: 6 });
  });
});

describe("Treacherous is passive — no use_leader move and no leaderUsed (cCp20)", () => {
  it("getLegalMoves emits no use_leader move for the Treacherous leader", () => {
    const state = createState("no-use-leader");
    setLeader(state, "seat_a", TREACHEROUS);
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

  it("rejects a manual UseLeader command for the Treacherous leader without consuming it", () => {
    const state = createState("reject-use-leader");
    setLeader(state, "seat_a", TREACHEROUS);
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

  it("does not produce a leader_used event during normal play", () => {
    const state = createState("no-leader-used-event");
    setLeader(state, "seat_a", TREACHEROUS);
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.pendingPrompt = null;
    state.seats.seat_a.passed = false;
    state.seats.seat_b.passed = false;

    const result = execute(state, { type: "Pass", seatId: "seat_a" });
    expect(result.events.some((event) => event.type === "leader_used")).toBe(false);
    expect(result.state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("treats King Bran (a different passive) as unrelated to double_spies", () => {
    // Sanity check: a King Bran seat does not enable double_spies.
    const state = createState("king-bran-no-spies");
    setLeader(state, "seat_a", KING_BRAN);
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_a", spy, "close");
    const policy = getDoubleSpiesPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toBeUndefined();
    const breakdown = score(state);
    const entry = breakdown.cards.find((card) => card.cardId === spy);
    expect(entry?.spyMultiplier).toBe(1);
    expect(entry?.modifiers).not.toContain("leader_double_spies");
  });
});
