import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  officialSkelligeStarterDeckPreset,
} from "@/data/catalog";
import {
  EngineRuleError,
  calculateScores,
  executeCommand,
  getLegalMoves,
  getWeatherPolicyBySeat,
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

const cleanCloseStrength = (strength: number): CatalogCardSource =>
  findCleanUnit((card) => card.rows.length === 1 && card.rows[0] === "close" && card.strength === strength);

const createConfig = (
  seed: string | number,
  seatBPreset = currentNilfgaardDeckPreset,
): MatchConfig => ({
  matchId: `cCp15-king-bran-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: "skellige",
      deckPreset: officialSkelligeStarterDeckPreset,
    },
    {
      seatId: "seat_b",
      playerId: "player-b",
      controllerKind: "ai",
      faction: seatBPreset.faction,
      deckPreset: seatBPreset,
    },
  ],
  catalog: {
    cards: currentCatalogCards,
    leaders: currentCatalogLeaders,
  },
});

const createState = (
  seed = "king-bran",
  seatBPreset = currentNilfgaardDeckPreset,
) => startMatch(createConfig(seed, seatBPreset)).state;

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

const placeWeather = (state: MatchState, cardId: CardInstanceId, controller: SeatId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
  state.cardsById[cardId].controller = controller;
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

describe("getWeatherPolicyBySeat (cCp15)", () => {
  it("derives king_bran for the King Bran seat and leaves other seats unset", () => {
    const state = createState("derive-king-bran");
    const policy = getWeatherPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toBe("king_bran");
    expect(policy.seat_b).toBeUndefined();
  });

  it("does not infer King Bran from faction alone (Crach Skellige uses normal weather)", () => {
    const state = createState("crach-not-king-bran");
    state.seats.seat_a.leaderSourceId = "skellige.crach-an-craite";
    const policy = getWeatherPolicyBySeat(state, currentCatalogLeaders);
    expect(policy.seat_a).toBeUndefined();
  });

  it("returns an empty policy when the leader catalog is missing King Bran", () => {
    const state = createState("missing-leader");
    const without = currentCatalogLeaders.filter((leader) => leader.sourceId !== "skellige.king-bran");
    const policy = getWeatherPolicyBySeat(state, without);
    expect(policy.seat_a).toBeUndefined();
    expect(policy.seat_b).toBeUndefined();
  });

  it("is deterministic and side-effect free across calls", () => {
    const state = createState("determinism");
    const before = structuredClone(state);
    const a = getWeatherPolicyBySeat(state, currentCatalogLeaders);
    const b = getWeatherPolicyBySeat(state, currentCatalogLeaders);
    expect(a).toEqual(b);
    expect(state).toEqual(before);
  });
});

describe("calculateScores derives King Bran policy from leaders (cCp15)", () => {
  it("applies half-loss to friendly non-hero units only on weathered rows (printed 4 → 2)", () => {
    const state = createState("half-loss-even");
    const printedFour = cleanCloseStrength(4);
    const friendly = addCardInstance(state, "seat_a", printedFour.sourceId, "fr");
    placeOnBoard(state, "seat_a", friendly, "close");
    const opponent = addCardInstance(state, "seat_b", "northern-realms.blue-stripes-commando", "op");
    placeOnBoard(state, "seat_b", opponent, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost");
    placeWeather(state, frost, "seat_b");

    const breakdown = score(state);
    const friendlyEntry = breakdown.cards.find((entry) => entry.cardId === friendly);
    const opponentEntry = breakdown.cards.find((entry) => entry.cardId === opponent);

    expect(friendlyEntry?.printedStrength).toBe(4);
    expect(friendlyEntry?.afterWeather).toBe(2);
    expect(friendlyEntry?.modifiers).toContain("weather:king_bran");

    // Opponent uses normal weather (set to 1).
    expect(opponentEntry?.afterWeather).toBe(1);
    expect(opponentEntry?.modifiers).toContain("weather");
    expect(opponentEntry?.modifiers).not.toContain("weather:king_bran");
  });

  it("rounds odd printed strength down (printed 7 → 4)", () => {
    const state = createState("odd");
    // Pick a deterministic printed-strength-7 non-hero close unit from the current catalog.
    const printedSeven = currentCatalogCards.find(
      (card) => card.kind === "unit" && card.strength === 7 && card.rows.includes("close"),
    );
    expect(
      printedSeven,
      "expected at least one printed-strength-7 close unit in the current catalog",
    ).toBeDefined();

    const seven = addCardInstance(state, "seat_a", printedSeven!.sourceId, "seven");
    placeOnBoard(state, "seat_a", seven, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost-odd");
    placeWeather(state, frost, "seat_b");

    const breakdown = score(state);
    const entry = breakdown.cards.find((c) => c.cardId === seven);
    expect(entry?.printedStrength).toBe(7);
    expect(entry?.afterWeather).toBe(4);
    expect(entry?.modifiers).toContain("weather:king_bran");
  });

  it("keeps printed 1 at 1 under King Bran weather", () => {
    const state = createState("printed-one");
    const printedOne = currentCatalogCards.find(
      (card) =>
        card.kind === "unit" &&
        card.tags.includes("non_hero") &&
        card.strength === 1 &&
        card.rows.includes("close"),
    );
    expect(printedOne, "expected a printed-1 close non-hero unit").toBeDefined();
    const one = addCardInstance(state, "seat_a", printedOne!.sourceId, "one");
    placeOnBoard(state, "seat_a", one, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost-one");
    placeWeather(state, frost, "seat_b");

    const breakdown = score(state);
    const entry = breakdown.cards.find((c) => c.cardId === one);
    expect(entry?.printedStrength).toBe(1);
    expect(entry?.afterWeather).toBe(1);
    expect(entry?.modifiers).toContain("weather:king_bran");
  });

  it("keeps Heroes immune to weather (no weather:king_bran modifier on heroes)", () => {
    const state = createState("hero-immune");
    const hero = addCardInstance(state, "seat_a", "skellige.cerys", "hero");
    placeOnBoard(state, "seat_a", hero, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost-hero");
    placeWeather(state, frost, "seat_b");

    const breakdown = score(state);
    const entry = breakdown.cards.find((c) => c.cardId === hero);
    expect(entry?.modifiers).toContain("hero_immune");
    expect(entry?.modifiers).not.toContain("weather:king_bran");
    expect(entry?.modifiers).not.toContain("weather");
    expect(entry?.finalStrength).toBe(currentCatalogCards.find((c) => c.sourceId === "skellige.cerys")?.strength);
  });

  it("Skellige Storm applies King Bran policy to both Ranged and Siege rows", () => {
    const state = createState("storm-both-rows");
    const cleanRanged = findCleanUnit(
      (card) => card.rows.length === 1 && card.rows[0] === "ranged" && card.strength >= 2,
    );
    const cleanSiege = findCleanUnit(
      (card) => card.rows.length === 1 && card.rows[0] === "siege" && card.strength >= 2,
    );
    const ranged = addCardInstance(state, "seat_a", cleanRanged.sourceId, "ranged");
    placeOnBoard(state, "seat_a", ranged, "ranged");
    const siege = addCardInstance(state, "seat_a", cleanSiege.sourceId, "siege");
    placeOnBoard(state, "seat_a", siege, "siege");
    const storm = addCardInstance(state, "seat_b", "neutral.skellige-storm", "storm");
    placeWeather(state, storm, "seat_b");

    const expectHalf = (printed: number) => printed - Math.floor(printed / 2);
    const breakdown = score(state);
    const rangedEntry = breakdown.cards.find((c) => c.cardId === ranged);
    const siegeEntry = breakdown.cards.find((c) => c.cardId === siege);
    expect(rangedEntry?.afterWeather).toBe(expectHalf(cleanRanged.strength));
    expect(siegeEntry?.afterWeather).toBe(expectHalf(cleanSiege.strength));
    expect(rangedEntry?.modifiers).toContain("weather:king_bran");
    expect(siegeEntry?.modifiers).toContain("weather:king_bran");
  });

  it("explicit weatherPolicyBySeat overrides the derived helper", () => {
    const state = createState("explicit-override");
    const printedFour = cleanCloseStrength(4);
    const friendly = addCardInstance(state, "seat_a", printedFour.sourceId, "fr");
    placeOnBoard(state, "seat_a", friendly, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost-ovr");
    placeWeather(state, frost, "seat_b");

    const breakdown = calculateScores({
      state,
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
      weatherPolicyBySeat: { seat_a: "normal" },
    });
    const entry = breakdown.cards.find((c) => c.cardId === friendly);
    expect(entry?.afterWeather).toBe(1);
    expect(entry?.modifiers).toContain("weather");
    expect(entry?.modifiers).not.toContain("weather:king_bran");
  });
});

describe("Round resolution with King Bran (cCp15)", () => {
  it("uses King Bran-adjusted scores for round_resolved, gem loss, and roundHistory.scoreBySeat", () => {
    const state = createState("round-resolution");
    const printedFour = cleanCloseStrength(4);
    const friendly = addCardInstance(state, "seat_a", printedFour.sourceId, "fr");
    placeOnBoard(state, "seat_a", friendly, "close");
    const opponent = addCardInstance(state, "seat_b", "northern-realms.blue-stripes-commando", "op");
    placeOnBoard(state, "seat_b", opponent, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost");
    placeWeather(state, frost, "seat_b");
    setRoundEnd(state);

    // Without King Bran: friendly = 1 (frosted), opponent = 1 (frosted) → draw, both lose a gem.
    // With King Bran: friendly = 4 - floor(4/2) = 2; opponent = 1 → seat_a wins, only seat_b loses.
    const result = execute(state, { type: "ResolveRoundEnd" });
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "round_resolved",
        winner: "seat_a",
        scoreBySeat: { seat_a: 2, seat_b: 1 },
      }),
    );
    expect(result.state.seats.seat_a.gems).toBe(2);
    expect(result.state.seats.seat_b.gems).toBe(1);
    const lastRound = result.state.roundHistory.at(-1);
    expect(lastRound?.scoreBySeat).toEqual({ seat_a: 2, seat_b: 1 });
  });

  it("does not adjust weather for a non-King Skellige seat (Crach)", () => {
    const state = createState("crach-no-half");
    state.seats.seat_a.leaderSourceId = "skellige.crach-an-craite";
    const printedFour = cleanCloseStrength(4);
    const friendly = addCardInstance(state, "seat_a", printedFour.sourceId, "fr");
    placeOnBoard(state, "seat_a", friendly, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost");
    placeWeather(state, frost, "seat_b");

    const breakdown = score(state);
    const entry = breakdown.cards.find((c) => c.cardId === friendly);
    expect(entry?.afterWeather).toBe(1);
    expect(entry?.modifiers).toContain("weather");
    expect(entry?.modifiers).not.toContain("weather:king_bran");
  });

  it("Nilfgaard tie-win still resolves cleanly after King Bran-adjusted scores", () => {
    // Force a tie under King Bran policy:
    //   seat_a (King Bran Skellige): printed-4 close under frost → 2.
    //   seat_b (Nilfgaard): printed-2 close, no weather → 2.
    const state = createState("ng-tie-after-king-bran");
    const printedFour = cleanCloseStrength(4);
    const friendly = addCardInstance(state, "seat_a", printedFour.sourceId, "fr");
    placeOnBoard(state, "seat_a", friendly, "close");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost");
    placeWeather(state, frost, "seat_b");
    // Add a Nilfgaard close unit at strength 2, no weather affects close on opponent because the
    // frost is on seat_b's row too — wait, frost affects close on BOTH sides. Move opponent to ranged.
    const cleanRanged = findCleanUnit(
      (card) => card.rows.length === 1 && card.rows[0] === "ranged" && card.strength === 2,
    );
    const ngOpponent = addCardInstance(state, "seat_b", cleanRanged.sourceId, "ng");
    placeOnBoard(state, "seat_b", ngOpponent, "ranged");
    setRoundEnd(state);

    const result = execute(state, { type: "ResolveRoundEnd" });
    // Both seats land at 2 → tie. Nilfgaard's draw_win resolves seat_b as winner.
    const last = result.state.roundHistory.at(-1);
    expect(last?.scoreBySeat).toEqual({ seat_a: 2, seat_b: 2 });
    expect(last?.winner).toBe("seat_b");
    expect(last?.factionOutcome).toBe("nilfgaard_draw_win");
    expect(result.state.seats.seat_a.gems).toBe(1);
    expect(result.state.seats.seat_b.gems).toBe(2);
  });
});

describe("Special Scorch / row Scorch / unit-source whole-board Scorch use King Bran-adjusted strength (cCp15)", () => {
  it("Special Scorch picks the highest after King Bran weather adjustment", () => {
    const state = createState("special-scorch");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.pendingPrompt = null;
    state.seats.seat_a.passed = false;
    state.seats.seat_b.passed = false;

    // Friendly printed 8 (King Bran weather → 4), opponent printed 3 on a non-weather row → 3.
    // Without King Bran the friendly unit would be weathered to 1 and the opponent would be scorched.
    const printedEight = cleanCloseStrength(8);
    const friendly = addCardInstance(state, "seat_a", printedEight.sourceId, "fr");
    placeOnBoard(state, "seat_a", friendly, "close");
    const cleanRangedThree = findCleanUnit(
      (card) => card.rows.length === 1 && card.rows[0] === "ranged" && card.strength === 3,
    );
    const opponent = addCardInstance(state, "seat_b", cleanRangedThree.sourceId, "op");
    placeOnBoard(state, "seat_b", opponent, "ranged");
    const frost = addCardInstance(state, "seat_b", "neutral.biting-frost", "frost");
    placeWeather(state, frost, "seat_b");

    // Special Scorch in seat_a hand.
    const scorch = addCardInstance(state, "seat_a", "neutral.scorch", "scorch");

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: scorch,
      target: { kind: "none" },
    });

    // With King Bran, friendly = 4 and opponent = 3, so Special Scorch destroys the friendly unit.
    // Without King Bran this would destroy the opponent instead.
    expect(result.state.seats.seat_a.discard).toContain(friendly);
    expect(result.state.seats.seat_b.board.ranged.units).toContain(opponent);
  });

  it("Row Scorch (scorch_siege) uses King Bran-adjusted opposite row total to cross the threshold", () => {
    // Make seat_b the King Bran seat so the Schirru row Scorch fires from seat_a against seat_b.
    const state = createState("schirru-row-scorch");
    state.seats.seat_b.leaderSourceId = "skellige.king-bran";
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.pendingPrompt = null;
    state.seats.seat_a.passed = false;
    state.seats.seat_b.passed = false;

    // Three Catapults on seat_b siege under Torrential Rain.
    // - Without King Bran: each weathered to 1, Tight Bond × 3 → 3 each, total 9 < 10. No fire.
    // - With King Bran: each weathered to 8 - floor(8/2) = 4, Tight Bond × 3 → 12 each, total 36 ≥ 10. Fires.
    const a = addCardInstance(state, "seat_b", "northern-realms.catapult", "a");
    const b = addCardInstance(state, "seat_b", "northern-realms.catapult", "b");
    const c = addCardInstance(state, "seat_b", "northern-realms.catapult", "c");
    placeOnBoard(state, "seat_b", a, "siege");
    placeOnBoard(state, "seat_b", b, "siege");
    placeOnBoard(state, "seat_b", c, "siege");
    const rain = addCardInstance(state, "seat_a", "neutral.torrential-rain", "rain");
    placeWeather(state, rain, "seat_a");

    const schirru = addCardInstance(state, "seat_a", "scoiatael.schirru", "schirru");

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: schirru,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    });

    // Tied highest opposing siege at 12 → all three catapults destroyed.
    expect(result.state.seats.seat_b.discard).toEqual(expect.arrayContaining([a, b, c]));
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(a);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(b);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(c);
    expect(
      result.events.some(
        (event) =>
          event.type === "scorch_resolved" &&
          event.abilityId === "scorch_siege" &&
          event.outcome === "destroyed",
      ),
    ).toBe(true);
  });

  it("Unit-source whole-board Scorch (Clan Dimun Pirate) uses King Bran-adjusted highest", () => {
    const state = createState("dimun-pirate");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.pendingPrompt = null;
    state.seats.seat_a.passed = false;
    state.seats.seat_b.passed = false;

    // Three Catapults on the King Bran seat's siege row under Torrential Rain.
    // Without King Bran: each weathered to 1, Tight Bond × 3 → 3 each, so Dimun at 6 self-scorches.
    // With King Bran: each weathered to 4, Tight Bond × 3 → 12 each, so the Catapults are scorched instead.
    const a = addCardInstance(state, "seat_a", "northern-realms.catapult", "a");
    const b = addCardInstance(state, "seat_a", "northern-realms.catapult", "b");
    const c = addCardInstance(state, "seat_a", "northern-realms.catapult", "c");
    placeOnBoard(state, "seat_a", a, "siege");
    placeOnBoard(state, "seat_a", b, "siege");
    placeOnBoard(state, "seat_a", c, "siege");
    const rain = addCardInstance(state, "seat_b", "neutral.torrential-rain", "rain");
    placeWeather(state, rain, "seat_b");

    // Dimun Pirate (printed 6 ranged) enters on seat_a ranged (rain does not affect ranged).
    const dimun = addCardInstance(state, "seat_a", "skellige.clan-dimun-pirate", "dp");

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: dimun,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    // King Bran-adjusted Catapults are the tied highest (12), so Dimun survives.
    expect(result.state.seats.seat_a.discard).toEqual(expect.arrayContaining([a, b, c]));
    expect(result.state.seats.seat_a.board.ranged.units).toContain(dimun);
    expect(result.state.seats.seat_a.discard).not.toContain(dimun);
  });
});

describe("King Bran is passive — no use_leader move and no leaderUsed (cCp15)", () => {
  it("getLegalMoves emits no use_leader move for King Bran", () => {
    const state = createState("no-use-leader");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    const legal = getLegalMoves({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    expect(legal.some((move) => move.kind === "use_leader")).toBe(false);
  });

  it("rejects a UseLeader command for King Bran without consuming the leader", () => {
    const state = createState("reject-use-leader");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    const before = structuredClone(state);
    expect(() =>
      execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } }),
    ).toThrow(EngineRuleError);
    expect(state).toEqual(before);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("does not produce a leader_used event for King Bran during normal play", () => {
    const state = createState("no-leader-used-event");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.pendingPrompt = null;
    state.seats.seat_a.passed = false;
    state.seats.seat_b.passed = false;

    // A normal Pass should not emit any leader_used event.
    const result = execute(state, { type: "Pass", seatId: "seat_a" });
    expect(
      result.events.some((event) => event.type === "leader_used"),
    ).toBe(false);
    expect(result.state.seats.seat_a.leaderUsed).toBe(false);
  });
});
