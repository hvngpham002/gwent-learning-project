import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  EngineRuleError,
  executeCommand,
  getLegalMoves,
  isLeaderRowScorchAbility,
  leaderRowScorchRowForAbility,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type EngineCommand,
  type LegalMove,
  type MatchConfig,
  type MatchState,
  type SeatId,
  type UseLeaderMove,
} from "@/game/core";
import type { CatalogRow } from "@/game/catalog";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp16-row-scorch-leader-${seed}`,
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

const createState = (seed = "row-scorch-leader") => startMatch(createConfig(seed)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const legalMoves = (state: MatchState, seatId: SeatId): LegalMove[] =>
  getLegalMoves({
    state,
    seatId,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const useLeaderMoves = (state: MatchState, seatId: SeatId): UseLeaderMove[] =>
  legalMoves(state, seatId).filter((move): move is UseLeaderMove => move.kind === "use_leader");

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
  state.cardsById[cardId].controller = seatId;
};

const setLeader = (state: MatchState, seatId: SeatId, leaderSourceId: string) => {
  state.seats[seatId].leaderSourceId = leaderSourceId;
};

const givePlayingTurn = (state: MatchState, seatId: SeatId) => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.seats.seat_a.mulliganComplete = true;
  state.seats.seat_b.mulliganComplete = true;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
  state.pendingPrompt = null;
};

describe("leader row-Scorch helper (cCp16)", () => {
  it("identifies scorch_range and scorch_siege as leader row-Scorch abilities and maps them to rows", () => {
    expect(isLeaderRowScorchAbility("scorch_range")).toBe(true);
    expect(isLeaderRowScorchAbility("scorch_siege")).toBe(true);
    expect(isLeaderRowScorchAbility("clear_weather")).toBe(false);
    expect(isLeaderRowScorchAbility("play_fog")).toBe(false);
    expect(isLeaderRowScorchAbility("weather_half_penalty")).toBe(false);
    expect(leaderRowScorchRowForAbility("scorch_range")).toBe("ranged");
    expect(leaderRowScorchRowForAbility("scorch_siege")).toBe("siege");
  });
});

describe("Foltest row-Scorch leader legal moves (cCp16)", () => {
  it("Foltest: Son of Medell emits a use_leader move when opponent ranged total >= 10 with eligible non-hero targets", () => {
    const state = createState("son-of-medell-ranged-fires");
    setLeader(state, "seat_a", "northern-realms.foltest-son-of-medell");
    const milva = addCardInstance(state, "seat_b", "scoiatael.milva", "milva");
    placeOnBoard(state, "seat_b", milva, "ranged");
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move.metadata.ability).toBe("scorch_range");
    expect(move.metadata.abilityStatus).toBe("implemented");
    expect(move.metadata.targetRequirement).toBe("none");
    expect(move.metadata.targetRow).toBe("ranged");
    expect(move.metadata.targetSeatId).toBe("seat_b");
    expect(move.metadata.targetCount).toBe(1);
    expect(move.metadata.rowTotal).toBe(10);
    expect(move.metadata.targetCardIds).toEqual([milva]);
    expect(move.target).toEqual({ kind: "none" });
  });

  it("Foltest: The Steel-Forged emits a use_leader move when opponent siege total >= 10 with eligible non-hero targets", () => {
    const state = createState("steel-forged-siege-fires");
    setLeader(state, "seat_a", "northern-realms.foltest-the-steel-forged");
    // Two catapults (printed 8 each, tight_bond): 8 * 2 = 16 each → row total 32 ≥ 10.
    const a = addCardInstance(state, "seat_b", "northern-realms.catapult", "a");
    const b = addCardInstance(state, "seat_b", "northern-realms.catapult", "b");
    placeOnBoard(state, "seat_b", a, "siege");
    placeOnBoard(state, "seat_b", b, "siege");
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move.metadata.ability).toBe("scorch_siege");
    expect(move.metadata.targetRow).toBe("siege");
    expect(move.metadata.targetSeatId).toBe("seat_b");
    expect(move.metadata.rowTotal).toBe(32);
    expect(move.metadata.targetCount).toBe(2);
    expect(move.metadata.targetCardIds?.sort()).toEqual([a, b].sort());
    expect(move.target).toEqual({ kind: "none" });
  });

  it("emits no use_leader move when opponent matching row total is below 10", () => {
    const state = createState("below-threshold");
    setLeader(state, "seat_a", "northern-realms.foltest-son-of-medell");
    const small = addCardInstance(state, "seat_b", "scoiatael.toruviel", "toruviel");
    placeOnBoard(state, "seat_b", small, "ranged");
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits no use_leader move when row total >= 10 but only Heroes are present", () => {
    const state = createState("only-heroes");
    setLeader(state, "seat_a", "northern-realms.foltest-son-of-medell");
    // Two ranged heroes, each strength 10. Heroes are immune; total is still 20 by the scoring path
    // because heroes contribute to row total. There are no eligible non-hero targets → no move.
    const hero1 = addCardInstance(state, "seat_b", "scoiatael.iorveth", "iorveth");
    const hero2 = addCardInstance(state, "seat_b", "scoiatael.saesenthessis", "saesy");
    placeOnBoard(state, "seat_b", hero1, "ranged");
    placeOnBoard(state, "seat_b", hero2, "ranged");
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("respects existing leader move gates (turn, pass, leaderUsed, prompt, phase)", () => {
    const state = createState("scorch-leader-gates");
    setLeader(state, "seat_a", "northern-realms.foltest-son-of-medell");
    const milva = addCardInstance(state, "seat_b", "scoiatael.milva", "milva");
    placeOnBoard(state, "seat_b", milva, "ranged");
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(1);

    state.seats.seat_a.leaderUsed = true;
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    state.seats.seat_a.leaderUsed = false;
    state.seats.seat_a.passed = true;
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    state.seats.seat_a.passed = false;
    state.currentTurn = "seat_b";
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    state.currentTurn = "seat_a";
    state.phase = "round_end";
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    state.phase = "playing";
    state.pendingPrompt = {
      promptId: "prompt:test",
      seatId: "seat_a",
      kind: "medic_revive",
      abilityId: "medic",
      options: [],
    };
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("King Bran still emits no use_leader move (passive unchanged)", () => {
    const state = createState("king-bran-passive-unchanged");
    setLeader(state, "seat_a", "skellige.king-bran");
    state.seats.seat_a.faction = "skellige";
    const milva = addCardInstance(state, "seat_b", "scoiatael.milva", "milva");
    placeOnBoard(state, "seat_b", milva, "ranged");
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });
});

describe("Foltest row-Scorch leader command execution (cCp16)", () => {
  it("executing scorch_range destroys all tied highest non-hero ranged units, marks leader used, hands off turn", () => {
    const state = createState("exec-scorch-range");
    setLeader(state, "seat_a", "northern-realms.foltest-son-of-medell");
    const milva1 = addCardInstance(state, "seat_b", "scoiatael.milva", "milva1");
    const milva2 = addCardInstance(state, "seat_b", "scoiatael.milva", "milva2");
    placeOnBoard(state, "seat_b", milva1, "ranged");
    placeOnBoard(state, "seat_b", milva2, "ranged");
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    // Both Milvas tie at 10 (Morale Boost contributes to row but Milva excludes itself).
    // Tied highest = both. Both destroyed.
    expect(result.state.seats.seat_b.discard).toEqual(expect.arrayContaining([milva1, milva2]));
    expect(result.state.seats.seat_b.board.ranged.units).not.toContain(milva1);
    expect(result.state.seats.seat_b.board.ranged.units).not.toContain(milva2);
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
    expect(result.state.currentTurn).toBe("seat_b");
    expect(
      result.events.some(
        (event) =>
          event.type === "scorch_resolved" &&
          event.abilityId === "scorch_range" &&
          event.outcome === "destroyed",
      ),
    ).toBe(true);
    expect(
      result.events.some((event) => event.type === "leader_used" && event.abilityId === "scorch_range"),
    ).toBe(true);
    expect(
      result.events.some(
        (event) => event.type === "ability_triggered" && event.abilityId === "scorch_range",
      ),
    ).toBe(true);
    expect(
      result.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "scorch_range" &&
          event.outcome === "destroyed",
      ),
    ).toBe(true);
  });

  it("executing scorch_siege destroys all tied highest non-hero siege units", () => {
    const state = createState("exec-scorch-siege");
    setLeader(state, "seat_a", "northern-realms.foltest-the-steel-forged");
    const a = addCardInstance(state, "seat_b", "northern-realms.catapult", "a");
    const b = addCardInstance(state, "seat_b", "northern-realms.catapult", "b");
    placeOnBoard(state, "seat_b", a, "siege");
    placeOnBoard(state, "seat_b", b, "siege");
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(result.state.seats.seat_b.discard).toEqual(expect.arrayContaining([a, b]));
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(a);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(b);
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
    expect(
      result.events.some(
        (event) =>
          event.type === "scorch_resolved" &&
          event.abilityId === "scorch_siege" &&
          event.outcome === "destroyed",
      ),
    ).toBe(true);
  });

  it("rejects through legal validation when row total is below 10 and does not consume the leader", () => {
    const state = createState("below-threshold-reject");
    setLeader(state, "seat_a", "northern-realms.foltest-son-of-medell");
    const small = addCardInstance(state, "seat_b", "scoiatael.toruviel", "toruviel");
    placeOnBoard(state, "seat_b", small, "ranged");
    givePlayingTurn(state, "seat_a");
    const before = structuredClone(state);

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "none" },
      }),
    ).toThrow(EngineRuleError);
    expect(state).toEqual(before);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects through legal validation when row contains only Heroes and does not consume the leader", () => {
    const state = createState("hero-only-reject");
    setLeader(state, "seat_a", "northern-realms.foltest-son-of-medell");
    const hero1 = addCardInstance(state, "seat_b", "scoiatael.iorveth", "iorveth");
    const hero2 = addCardInstance(state, "seat_b", "scoiatael.saesenthessis", "saesy");
    placeOnBoard(state, "seat_b", hero1, "ranged");
    placeOnBoard(state, "seat_b", hero2, "ranged");
    givePlayingTurn(state, "seat_a");
    const before = structuredClone(state);

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "none" },
      }),
    ).toThrow(EngineRuleError);
    expect(state).toEqual(before);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects a wrong target kind without consuming the leader", () => {
    const state = createState("wrong-target-reject");
    setLeader(state, "seat_a", "northern-realms.foltest-son-of-medell");
    const milva = addCardInstance(state, "seat_b", "scoiatael.milva", "milva");
    placeOnBoard(state, "seat_b", milva, "ranged");
    givePlayingTurn(state, "seat_a");
    const before = structuredClone(state);

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "deck_card_source", seatId: "seat_a", sourceId: "neutral.biting-frost" },
      }),
    ).toThrow(EngineRuleError);
    expect(state).toEqual(before);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("Spy on opponent side destroyed by row-Scorch leader goes to opponent (board-side) discard", () => {
    const state = createState("spy-on-opponent-side-destroyed");
    setLeader(state, "seat_a", "northern-realms.foltest-the-steel-forged");
    // Place a Spy controlled by seat_a on seat_b's siege side, then pad the row
    // with a Hero so the row reaches threshold while the Spy remains the only
    // eligible non-hero Scorch target.
    const spy = addCardInstance(state, "seat_a", "northern-realms.thaler", "spy");
    placeOnBoard(state, "seat_b", spy, "siege", "seat_a");
    const hero = addCardInstance(state, "seat_b", "nilfgaard.morvran-voorhis", "morvran");
    placeOnBoard(state, "seat_b", hero, "siege");
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(result.state.seats.seat_b.discard).toContain(spy);
    expect(result.state.seats.seat_a.discard).not.toContain(spy);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(spy);
    expect(result.state.seats.seat_b.board.siege.units).toContain(hero);
  });

  it("Avenger source destroyed by row-Scorch leader summons replacement onto the opponent's row", () => {
    // Setup: place a Cow (avenger, printed strength 0) on seat_b's siege row alongside a hero
    // padding the row total. Active Torrential Rain weather promotes Cow's effective strength to 1
    // (the existing Avenger test pattern). Cow is then the unique highest non-hero on the row, so
    // the row-Scorch leader destroys it and Avenger summons Bovine Defense Force from the side deck.
    const state = createState("avenger-via-row-scorch-leader");
    setLeader(state, "seat_a", "northern-realms.foltest-the-steel-forged");

    const cow = addCardInstance(state, "seat_b", "neutral.cow", "cow");
    placeOnBoard(state, "seat_b", cow, "siege");
    // Hero pads the row total over the threshold (Hero contributes to row total, immune to scorch).
    const hero = addCardInstance(state, "seat_b", "skellige.hemdall", "hero-pad");
    placeOnBoard(state, "seat_b", hero, "siege");

    // Active Rain so Cow's effective strength becomes 1 instead of 0.
    const rain = addCardInstance(state, "seat_a", "neutral.torrential-rain", "rain");
    removeEverywhere(state, rain);
    state.weather.entries.push(rain);
    state.cardsById[rain].zone = { kind: "weather" };
    state.cardsById[rain].controller = "seat_a";

    // Bovine Defense Force in seat_b's side deck so Avenger has a replacement to summon.
    const bovine = addCardInstance(state, "seat_b", "neutral.bovine-defense-force", "bovine");
    placeInSideDeck(state, "seat_b", bovine);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    // Cow (avenger, weathered to 1) is the unique highest eligible non-hero on the row → scorched.
    expect(result.state.seats.seat_b.discard).toContain(cow);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(cow);
    // Hero immune; remains on the row.
    expect(result.state.seats.seat_b.board.siege.units).toContain(hero);

    // Avenger summons Bovine onto Cow's old row.
    expect(
      result.events.some(
        (event) =>
          event.type === "card_summoned" &&
          event.toCardId === bovine &&
          event.toSourceId === "neutral.bovine-defense-force" &&
          event.abilityId === "avenger" &&
          event.seatId === "seat_b" &&
          event.row === "siege",
      ),
    ).toBe(true);
    expect(result.state.seats.seat_b.sideDeck).not.toContain(bovine);
    expect(result.state.seats.seat_b.board.siege.units).toContain(bovine);
  });

  it("uses King Bran-adjusted effective strength for leader row-Scorch threshold and target selection", () => {
    // seat_b is King Bran. Three Catapults on seat_b siege under Torrential Rain.
    // Without King Bran: each weathered to 1, TB×3 → 3 each, total 9 < 10 → leader cannot fire.
    // With King Bran: each weathered to 4, TB×3 → 12 each, total 36 ≥ 10 → leader fires.
    const state = createState("king-bran-row-scorch-leader");
    setLeader(state, "seat_a", "northern-realms.foltest-the-steel-forged");
    setLeader(state, "seat_b", "skellige.king-bran");
    state.seats.seat_b.faction = "skellige";

    const a = addCardInstance(state, "seat_b", "northern-realms.catapult", "a");
    const b = addCardInstance(state, "seat_b", "northern-realms.catapult", "b");
    const c = addCardInstance(state, "seat_b", "northern-realms.catapult", "c");
    placeOnBoard(state, "seat_b", a, "siege");
    placeOnBoard(state, "seat_b", b, "siege");
    placeOnBoard(state, "seat_b", c, "siege");
    const rain = addCardInstance(state, "seat_a", "neutral.torrential-rain", "rain");
    state.weather.entries.push(rain);
    state.cardsById[rain].zone = { kind: "weather" };
    state.cardsById[rain].controller = "seat_a";
    state.seats.seat_a.hand = state.seats.seat_a.hand.filter((id) => id !== rain);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.rowTotal).toBe(36);
    expect(moves[0].metadata.targetCount).toBe(3);

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    expect(result.state.seats.seat_b.discard).toEqual(expect.arrayContaining([a, b, c]));
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(a);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(b);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(c);
  });

  it("dispatching a legal scorch_range UseLeader through executeCommand records history like other leader commands", () => {
    // Sanity check that the no-target scorch_range UseLeader walks through the same dispatch path
    // as Clear Weather / weather-pulling leaders without a special target shape.
    const state = createState("dispatch-history");
    setLeader(state, "seat_a", "northern-realms.foltest-son-of-medell");
    const milva = addCardInstance(state, "seat_b", "scoiatael.milva", "milva");
    placeOnBoard(state, "seat_b", milva, "ranged");
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
    expect(
      result.events.find((event) => event.type === "leader_used" && event.abilityId === "scorch_range"),
    ).toBeTruthy();
    // No new card moves go to weather; no card_played event for the leader because it's not a
    // played card. The destroyed targets emit card_moved with reason "scorch_destroyed".
    expect(
      result.events.some(
        (event) =>
          event.type === "card_moved" &&
          event.cardId === milva &&
          event.reason === "scorch_destroyed",
      ),
    ).toBe(true);
  });
});
