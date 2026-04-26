import { describe, expect, it } from "vitest";

import {
  EngineRuleError,
  executeCommand,
  getLegalMoves,
  startMatch,
  type CardInstanceId,
  type EngineCommand,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogCardSource, CatalogDeckPreset, CatalogFaction, CatalogLeaderSource, CatalogRow } from "@/game/catalog";

const card = (
  sourceId: string,
  kind: CatalogCardSource["kind"],
  strength: number,
  rows: CatalogRow[],
  abilities: CatalogCardSource["abilities"] = ["none"],
  faction: CatalogFaction = "neutral",
): CatalogCardSource => ({
  sourceId,
  name: sourceId,
  faction,
  kind,
  strength,
  rows,
  abilities,
  tags: [],
  deckLimit: 99,
  image: "/images/test.png",
});

const catalogCards = [
  card("test.low", "unit", 3, ["close"]),
  card("test.mid", "unit", 5, ["close"]),
  card("test.high", "unit", 10, ["close"]),
  card("test.draw", "unit", 1, ["ranged"]),
  card("test.spy", "unit", 2, ["siege"], ["spy"]),
  card("test.monster-a", "unit", 4, ["close"], ["none"], "monsters"),
  card("test.monster-b", "unit", 6, ["ranged"], ["none"], "monsters"),
  card("test.hero", "hero", 10, ["close"]),
  card("test.horn", "special", 0, [], ["commanders_horn"]),
  card("test.frost", "special", 0, [], ["frost"]),
  card("test.skellige-a", "unit", 4, ["close"], ["none"], "skellige"),
  card("test.skellige-b", "unit", 5, ["ranged"], ["medic"], "skellige"),
  card("test.skellige-hero", "hero", 8, ["close"], ["none"], "skellige"),
  card("test.skellige-special", "special", 0, [], ["frost"], "skellige"),
] as const satisfies readonly CatalogCardSource[];

const leader = (faction: Exclude<CatalogFaction, "neutral">): CatalogLeaderSource => ({
  sourceId: `leader.${faction}`,
  name: `Leader ${faction}`,
  faction,
  ability: "clear_weather",
  image: "/images/test.png",
});

const catalogLeaders = [
  leader("northern_realms"),
  leader("nilfgaard"),
  leader("monsters"),
  leader("skellige"),
] as const satisfies readonly CatalogLeaderSource[];

const preset = (faction: Exclude<CatalogFaction, "neutral">): CatalogDeckPreset => ({
  presetId: `preset.${faction}`,
  name: `Preset ${faction}`,
  faction,
  leaderSourceId: `leader.${faction}`,
  mainDeck: catalogCards.map((source) => ({ sourceId: source.sourceId, count: 1 })),
  sideDeck: [],
});

const createConfig = (
  seed: string,
  seatAFaction: Exclude<CatalogFaction, "neutral"> = "northern_realms",
  seatBFaction: Exclude<CatalogFaction, "neutral"> = "nilfgaard",
): MatchConfig => ({
  matchId: `round-resolution-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: seatAFaction,
      deckPreset: preset(seatAFaction),
    },
    {
      seatId: "seat_b",
      playerId: "player-b",
      controllerKind: "ai",
      faction: seatBFaction,
      deckPreset: preset(seatBFaction),
    },
  ],
  catalog: {
    cards: catalogCards,
    leaders: catalogLeaders,
  },
});

const createState = (
  seed: string,
  seatAFaction: Exclude<CatalogFaction, "neutral"> = "northern_realms",
  seatBFaction: Exclude<CatalogFaction, "neutral"> = "nilfgaard",
) => startMatch(createConfig(seed, seatAFaction, seatBFaction)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({ state, command, catalogCards, catalogLeaders });

const findCard = (state: MatchState, sourceId: string, owner?: SeatId, exclude: readonly CardInstanceId[] = []) => {
  const instance = Object.values(state.cardsById).find(
    (candidate) =>
      candidate.sourceId === sourceId &&
      (owner === undefined || candidate.owner === owner) &&
      !exclude.includes(candidate.instanceId),
  );
  if (!instance) {
    throw new Error(`Missing test card ${sourceId}`);
  }
  return instance.instanceId;
};

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

const putOnBoard = (state: MatchState, seatId: SeatId, cardId: CardInstanceId, row: CatalogRow, controller = seatId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
  state.cardsById[cardId].controller = controller;
};

const putHorn = (state: MatchState, seatId: SeatId, cardId: CardInstanceId, row: CatalogRow, controller = seatId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].horn = cardId;
  state.cardsById[cardId].zone = { kind: "row_horn", seat: seatId, row };
  state.cardsById[cardId].controller = controller;
};

const putWeather = (state: MatchState, cardId: CardInstanceId, controller: SeatId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
  state.cardsById[cardId].controller = controller;
};

const putDeck = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  state.seats[seatId].deck = [];
  cardIds.forEach((cardId) => {
    removeEverywhere(state, cardId);
    state.seats[seatId].deck.push(cardId);
    state.cardsById[cardId].zone = { kind: "deck", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const putDiscard = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  cardIds.forEach((cardId) => {
    removeEverywhere(state, cardId);
    state.seats[seatId].discard.push(cardId);
    state.cardsById[cardId].zone = { kind: "discard", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const setRoundEnd = (state: MatchState) => {
  state.phase = "round_end";
  state.pendingPrompt = null;
  state.seats.seat_a.passed = true;
  state.seats.seat_b.passed = true;
};

const assertNoDuplicateZones = (state: MatchState) => {
  const seen = new Map<CardInstanceId, string[]>();
  const note = (cardId: CardInstanceId, zone: string) => {
    seen.set(cardId, [...(seen.get(cardId) ?? []), zone]);
  };

  Object.values(state.seats).forEach((seat) => {
    seat.deck.forEach((id) => note(id, `${seat.seatId}.deck`));
    seat.hand.forEach((id) => note(id, `${seat.seatId}.hand`));
    seat.discard.forEach((id) => note(id, `${seat.seatId}.discard`));
    seat.sideDeck.forEach((id) => note(id, `${seat.seatId}.sideDeck`));
    seat.removedFromGame.forEach((id) => note(id, `${seat.seatId}.removed`));
    Object.entries(seat.board).forEach(([rowName, row]) => {
      row.units.forEach((id) => note(id, `${seat.seatId}.${rowName}.units`));
      if (row.horn) note(row.horn, `${seat.seatId}.${rowName}.horn`);
    });
    if (seat.leader) note(seat.leader, `${seat.seatId}.leader`);
  });
  state.weather.entries.forEach((id) => note(id, "weather"));
  [...seen.entries()].forEach(([, zones]) => expect(zones).toHaveLength(1));
};

describe("core round resolution", () => {
  it("keeps Pass as a phase transition only and exposes a system legal move", () => {
    const state = createState("pass-only");
    state.phase = "playing";
    state.currentTurn = "seat_a";

    const afterA = execute(state, { type: "Pass", seatId: "seat_a" }).state;
    const afterB = execute(afterA, { type: "Pass", seatId: "seat_b" }).state;

    expect(afterB.phase).toBe("round_end");
    expect(afterB.seats.seat_a.gems).toBe(2);
    expect(afterB.seats.seat_b.gems).toBe(2);
    expect(getLegalMoves({ state: afterB, seatId: "seat_a", catalogCards, catalogLeaders })).toContainEqual(
      expect.objectContaining({ kind: "resolve_round_end" }),
    );
  });

  it("rejects ResolveRoundEnd before both seats have passed", () => {
    const state = createState("reject-before-pass");
    state.phase = "playing";

    expect(() => execute(state, { type: "ResolveRoundEnd" })).toThrow(EngineRuleError);
  });

  it("settles a higher-score round, decrements only the loser, and starts the winner next", () => {
    const state = createState("winner-starts");
    setRoundEnd(state);
    putOnBoard(state, "seat_a", findCard(state, "test.high", "seat_a"), "close");
    putOnBoard(state, "seat_b", findCard(state, "test.low", "seat_b"), "close");

    const result = execute(state, { type: "ResolveRoundEnd" });

    expect(result.state.seats.seat_a.gems).toBe(2);
    expect(result.state.seats.seat_b.gems).toBe(1);
    expect(result.state.phase).toBe("playing");
    expect(result.state.round).toBe(2);
    expect(result.state.currentTurn).toBe("seat_a");
    expect(result.state.roundStarter).toBe("seat_a");
    expect(result.events).toContainEqual(expect.objectContaining({ type: "round_resolved", winner: "seat_a" }));
    assertNoDuplicateZones(result.state);
  });

  it("uses previous roundStarter after a continuing true draw", () => {
    const state = createState("draw-starter", "northern_realms", "monsters");
    setRoundEnd(state);
    state.roundStarter = "seat_b";
    putOnBoard(state, "seat_a", findCard(state, "test.mid", "seat_a"), "close");
    putOnBoard(state, "seat_b", findCard(state, "test.mid", "seat_b"), "close");

    const result = execute(state, { type: "ResolveRoundEnd" });

    expect(result.state.seats.seat_a.gems).toBe(1);
    expect(result.state.seats.seat_b.gems).toBe(1);
    expect(result.state.currentTurn).toBe("seat_b");
    expect(result.events).toContainEqual(expect.objectContaining({ type: "turn_set", reason: "draw_policy" }));
  });

  it("applies Nilfgaard tie-win against non-Nilfgaard and cancels when both seats are Nilfgaard", () => {
    const state = createState("ng-tie", "northern_realms", "nilfgaard");
    setRoundEnd(state);
    putOnBoard(state, "seat_a", findCard(state, "test.mid", "seat_a"), "close");
    putOnBoard(state, "seat_b", findCard(state, "test.mid", "seat_b"), "close");

    const result = execute(state, { type: "ResolveRoundEnd" });
    expect(result.state.seats.seat_a.gems).toBe(1);
    expect(result.state.seats.seat_b.gems).toBe(2);
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: "faction_ability_resolved", ability: "nilfgaard_draw_win", seatId: "seat_b" }),
    );

    const bothNg = createState("both-ng", "nilfgaard", "nilfgaard");
    setRoundEnd(bothNg);
    putOnBoard(bothNg, "seat_a", findCard(bothNg, "test.mid", "seat_a"), "close");
    putOnBoard(bothNg, "seat_b", findCard(bothNg, "test.mid", "seat_b"), "close");

    const bothNgResult = execute(bothNg, { type: "ResolveRoundEnd" });
    expect(bothNgResult.state.seats.seat_a.gems).toBe(1);
    expect(bothNgResult.state.seats.seat_b.gems).toBe(1);
    expect(bothNgResult.events).not.toContainEqual(expect.objectContaining({ ability: "nilfgaard_draw_win" }));
  });

  it("covers R-008: a one-gem round winner continues without game_end", () => {
    const state = createState("r-008", "northern_realms", "monsters");
    setRoundEnd(state);
    state.seats.seat_a.gems = 1;
    state.seats.seat_b.gems = 2;
    putOnBoard(state, "seat_a", findCard(state, "test.high", "seat_a"), "close");
    putOnBoard(state, "seat_b", findCard(state, "test.low", "seat_b"), "close");

    const result = execute(state, { type: "ResolveRoundEnd" });

    expect(result.state.seats.seat_a.gems).toBe(1);
    expect(result.state.seats.seat_b.gems).toBe(1);
    expect(result.state.phase).toBe("playing");
    expect(result.events.some((event) => event.type === "game_ended")).toBe(false);
  });

  it("covers F-5.19: duplicate settlement on the resulting state is rejected", () => {
    const state = createState("f-5-19");
    setRoundEnd(state);
    putOnBoard(state, "seat_a", findCard(state, "test.high", "seat_a"), "close");
    putOnBoard(state, "seat_b", findCard(state, "test.low", "seat_b"), "close");

    const first = execute(state, { type: "ResolveRoundEnd" });

    expect(() => execute(first.state, { type: "ResolveRoundEnd" })).toThrow(EngineRuleError);
    expect(first.state.seats.seat_b.gems).toBe(1);
  });

  it("covers section 17.14: both last gems lost in a true draw produce game draw", () => {
    const state = createState("17-14", "northern_realms", "monsters");
    setRoundEnd(state);
    state.seats.seat_a.gems = 1;
    state.seats.seat_b.gems = 1;
    putOnBoard(state, "seat_a", findCard(state, "test.mid", "seat_a"), "close");
    putOnBoard(state, "seat_b", findCard(state, "test.mid", "seat_b"), "close");

    const result = execute(state, { type: "ResolveRoundEnd" });

    expect(result.state.seats.seat_a.gems).toBe(0);
    expect(result.state.seats.seat_b.gems).toBe(0);
    expect(result.state.phase).toBe("game_end");
    expect(result.events).toContainEqual(expect.objectContaining({ type: "game_ended", winner: "draw" }));
    expect(result.state.roundHistory[0]).toEqual(expect.objectContaining({ winner: "draw", loserGemLoss: { seat_a: 1, seat_b: 1 } }));
  });

  it("sweeps row cards to their board-side discard and weather to controller discard", () => {
    const state = createState("cleanup", "northern_realms", "monsters");
    setRoundEnd(state);
    const spy = findCard(state, "test.spy", "seat_a");
    const horn = findCard(state, "test.horn", "seat_a");
    const frost = findCard(state, "test.frost", "seat_b");
    putOnBoard(state, "seat_b", spy, "siege", "seat_a");
    putHorn(state, "seat_a", horn, "close", "seat_a");
    putWeather(state, frost, "seat_b");

    const result = execute(state, { type: "ResolveRoundEnd" });

    expect(result.state.seats.seat_a.discard).toContain(horn);
    expect(result.state.seats.seat_a.discard).not.toContain(spy);
    expect(result.state.seats.seat_b.discard).toEqual(expect.arrayContaining([spy, frost]));
    expect(result.state.cardsById[spy].zone).toEqual({ kind: "discard", seat: "seat_b" });
    expect(result.state.cardsById[spy].controller).toBe("seat_a");
    expect(result.state.seats.seat_b.discard).toContain(frost);
    expect(result.state.weather.entries).toEqual([]);
    expect(result.state.seats.seat_a.board.close.horn).toBeNull();
    assertNoDuplicateZones(result.state);
  });

  it("keeps exactly one eligible Monsters unit and excludes opponent-controlled Spies", () => {
    const state = createState("monsters-keep", "monsters", "northern_realms");
    setRoundEnd(state);
    const monsterA = findCard(state, "test.monster-a", "seat_a");
    const monsterB = findCard(state, "test.monster-b", "seat_a");
    const hero = findCard(state, "test.hero", "seat_a");
    const spy = findCard(state, "test.spy", "seat_b");
    putOnBoard(state, "seat_a", monsterA, "close", "seat_a");
    putOnBoard(state, "seat_a", monsterB, "ranged", "seat_a");
    putOnBoard(state, "seat_a", hero, "close", "seat_a");
    putOnBoard(state, "seat_a", spy, "siege", "seat_b");

    const result = execute(state, { type: "ResolveRoundEnd" });
    const kept = [monsterA, monsterB].filter((cardId) =>
      Object.values(result.state.seats.seat_a.board).some((row) => row.units.includes(cardId)),
    );

    expect(kept).toHaveLength(1);
    expect(result.state.seats.seat_a.discard).toContain(hero);
    expect(result.state.seats.seat_a.discard).toContain(spy);
    expect(result.state.cardsById[spy].controller).toBe("seat_b");
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: "faction_ability_resolved", ability: "monsters_keep_unit", eligibleCount: 2 }),
    );
    assertNoDuplicateZones(result.state);
  });

  it("draws one Northern Realms card on a continuing round win and reports an empty deck", () => {
    const state = createState("nr-draw", "northern_realms", "monsters");
    setRoundEnd(state);
    const draw = findCard(state, "test.draw", "seat_a");
    putDeck(state, "seat_a", [draw]);
    putOnBoard(state, "seat_a", findCard(state, "test.high", "seat_a"), "close");
    putOnBoard(state, "seat_b", findCard(state, "test.low", "seat_b"), "close");

    const result = execute(state, { type: "ResolveRoundEnd" });
    expect(result.state.seats.seat_a.hand).toContain(draw);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "card_drawn", cardId: draw }));

    const empty = createState("nr-empty", "northern_realms", "monsters");
    setRoundEnd(empty);
    empty.seats.seat_a.deck = [];
    putOnBoard(empty, "seat_a", findCard(empty, "test.high", "seat_a"), "close");
    putOnBoard(empty, "seat_b", findCard(empty, "test.low", "seat_b"), "close");

    expect(execute(empty, { type: "ResolveRoundEnd" }).events).toContainEqual(
      expect.objectContaining({ type: "faction_ability_resolved", ability: "northern_realms_draw_on_win", outcome: "deck_empty" }),
    );
  });

  it("returns up to two eligible Skellige discard units at start of round 3 and defers on-play abilities", () => {
    const state = createState("skellige-return", "skellige", "northern_realms");
    setRoundEnd(state);
    state.round = 2;
    state.roundStarter = "seat_a";
    const unitA = findCard(state, "test.skellige-a", "seat_a");
    const unitB = findCard(state, "test.skellige-b", "seat_a");
    const hero = findCard(state, "test.skellige-hero", "seat_a");
    const special = findCard(state, "test.skellige-special", "seat_a");
    const opponentUnit = findCard(state, "test.skellige-a", "seat_b");
    putDiscard(state, "seat_a", [unitA, unitB, hero, special]);
    putDiscard(state, "seat_b", [opponentUnit]);

    const result = execute(state, { type: "ResolveRoundEnd" });
    const returned = [unitA, unitB].filter((cardId) =>
      Object.values(result.state.seats.seat_a.board).some((row) => row.units.includes(cardId)),
    );

    expect(result.state.round).toBe(3);
    expect(returned).toHaveLength(2);
    expect(result.state.seats.seat_a.discard).toEqual(expect.arrayContaining([hero, special]));
    expect(Object.values(result.state.seats.seat_a.board).some((row) => row.units.includes(opponentUnit))).toBe(false);
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "ability_deferred",
        cardId: unitB,
        abilityId: "medic",
        reason: "skellige_return_on_play_pending",
      }),
    );
    assertNoDuplicateZones(result.state);
  });

  it("does not mutate the input state", () => {
    const state = createState("immutable");
    setRoundEnd(state);
    putOnBoard(state, "seat_a", findCard(state, "test.high", "seat_a"), "close");
    const before = structuredClone(state);

    execute(state, { type: "ResolveRoundEnd" });

    expect(state).toEqual(before);
  });
});
