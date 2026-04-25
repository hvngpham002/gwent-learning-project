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
  startMatch,
  type CardInstanceId,
  type EngineCommand,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogRow } from "@/game/catalog";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `commands-${seed}`,
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

const createState = (seed = "commands") => startMatch(createConfig(seed)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const findCard = (state: MatchState, sourceId: string, exclude: readonly CardInstanceId[] = []) => {
  const card = Object.values(state.cardsById).find(
    (candidate) => candidate.sourceId === sourceId && !exclude.includes(candidate.instanceId),
  );

  if (!card) {
    throw new Error(`Missing test card source ${sourceId}`);
  }

  return card.instanceId;
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

const putInHand = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  cardIds.forEach((cardId) => {
    removeEverywhere(state, cardId);
    state.seats[seatId].hand.push(cardId);
    state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const putOnBoard = (state: MatchState, seatId: SeatId, cardId: CardInstanceId, row: CatalogRow) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
};

const putWeather = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
  state.cardsById[cardId].controller = seatId;
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

describe("core command transactions", () => {
  it("chooses a zero-card mulligan without mutating the input state", () => {
    const state = createState("mulligan-zero");
    const before = structuredClone(state);
    const result = execute(state, { type: "ChooseMulligan", seatId: "seat_a", cardIds: [] });

    expect(result.state.seats.seat_a.mulliganComplete).toBe(true);
    expect(result.state.seats.seat_b.mulliganComplete).toBe(false);
    expect(result.state.phase).toBe("mulligan");
    expect(state).toEqual(before);
  });

  it("mulligans selected cards after drawing replacements and preserves zone invariants", () => {
    const state = createState("mulligan-two");
    const selected = state.seats.seat_a.hand.slice(0, 2);
    const firstDeckCards = state.seats.seat_a.deck.slice(0, 2);
    const result = execute(state, { type: "ChooseMulligan", seatId: "seat_a", cardIds: selected });

    expect(firstDeckCards.every((cardId) => result.state.seats.seat_a.hand.includes(cardId))).toBe(true);
    expect(selected.every((cardId) => result.state.seats.seat_a.deck.includes(cardId))).toBe(true);
    expect(result.state.rng.state).not.toBe(state.rng.state);
    expect(result.events.map((event) => event.type)).toContain("mulligan_chosen");
    expect(result.events.find((event) => event.type === "card_moved" && event.cardId === selected[0])?.type).toBe(
      "card_moved",
    );
    assertNoDuplicateZones(result.state);
  });

  it("moves to playing after both seats complete mulligan and preserves setup currentTurn", () => {
    const state = createState("mulligan-complete");
    const firstTurn = state.currentTurn;
    const afterA = execute(state, { type: "ChooseMulligan", seatId: "seat_a", cardIds: [] }).state;
    const afterB = execute(afterA, { type: "ChooseMulligan", seatId: "seat_b", cardIds: [] });

    expect(afterB.state.phase).toBe("playing");
    expect(afterB.state.currentTurn).toBe(firstTurn);
  });

  it("rejects an illegal mulligan card without mutating state", () => {
    const state = createState("mulligan-illegal");
    const before = structuredClone(state);

    expect(() =>
      execute(state, { type: "ChooseMulligan", seatId: "seat_a", cardIds: [state.seats.seat_b.hand[0]] }),
    ).toThrow(EngineRuleError);
    expect(state).toEqual(before);
  });

  it("plays a normal unit to own board, emits events, and hands off turn", () => {
    const state = createState("unit");
    const cardId = findCard(state, "northern-realms.dun-banner-medic");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    putInHand(state, "seat_a", [cardId]);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    });

    expect(result.state.seats.seat_a.hand).not.toContain(cardId);
    expect(result.state.seats.seat_a.board.siege.units).toContain(cardId);
    expect(result.state.cardsById[cardId].zone).toEqual({ kind: "board_row", seat: "seat_a", row: "siege" });
    expect(result.state.currentTurn).toBe("seat_b");
    expect(result.events.some((event) => event.type === "card_played")).toBe(true);
    expect(
      result.events.some(
        (event) =>
          event.type === "ability_deferred" &&
          event.abilityId === "medic" &&
          event.sourceId === "northern-realms.dun-banner-medic" &&
          event.cardId === cardId,
      ),
    ).toBe(true);
    assertNoDuplicateZones(result.state);
  });

  it("plays a Spy to the opponent board while preserving acting controller", () => {
    const state = createState("spy-command");
    const cardId = findCard(state, "northern-realms.thaler");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    putInHand(state, "seat_a", [cardId]);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId,
      target: { kind: "board_row", side: "opponent", seatId: "seat_b", row: "siege" },
    });

    expect(result.state.seats.seat_b.board.siege.units).toContain(cardId);
    expect(result.state.cardsById[cardId].controller).toBe("seat_a");
    expect(result.events.some((event) => event.type === "ability_deferred" && event.abilityId === "spy")).toBe(true);
  });

  it("places Special Horn and rejects an occupied horn slot", () => {
    const state = createState("horn-command");
    const horn = findCard(state, "neutral.commanders-horn");
    const occupiedHorn = findCard(state, "neutral.commanders-horn", [horn]);
    state.phase = "playing";
    state.currentTurn = "seat_a";
    putInHand(state, "seat_a", [horn]);
    removeEverywhere(state, occupiedHorn);
    state.seats.seat_a.board.close.horn = occupiedHorn;
    state.cardsById[occupiedHorn].zone = { kind: "row_horn", seat: "seat_a", row: "close" };

    expect(() =>
      execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: horn,
        target: { kind: "row_horn", side: "own", seatId: "seat_a", row: "close" },
      }),
    ).toThrow(EngineRuleError);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: horn,
      target: { kind: "row_horn", side: "own", seatId: "seat_a", row: "ranged" },
    });
    expect(result.state.seats.seat_a.board.ranged.horn).toBe(horn);
  });

  it("executes Decoy in-place and returns the target to acting hand", () => {
    const state = createState("decoy-command");
    const decoy = findCard(state, "neutral.decoy");
    const target = findCard(state, "northern-realms.dun-banner-medic");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    putInHand(state, "seat_a", [decoy]);
    putOnBoard(state, "seat_a", target, "siege");

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: decoy,
      target: { kind: "card_instance", side: "own", seatId: "seat_a", cardId: target, row: "siege" },
    });

    expect(result.state.seats.seat_a.board.siege.units).toEqual([decoy]);
    expect(result.state.seats.seat_a.hand).toContain(target);
    expect(result.state.cardsById[target].controller).toBe("seat_a");
    assertNoDuplicateZones(result.state);
  });

  it("plays weather and Clear Weather including the no-weather discard path", () => {
    const state = createState("weather-command");
    const frost = findCard(state, "neutral.biting-frost");
    const clearWeather = findCard(state, "neutral.clear-weather");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    putInHand(state, "seat_a", [frost]);

    const afterFrost = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: frost,
      target: { kind: "weather" },
    }).state;
    expect(afterFrost.weather.entries).toContain(frost);

    afterFrost.currentTurn = "seat_a";
    putInHand(afterFrost, "seat_a", [clearWeather]);
    const afterClear = execute(afterFrost, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: clearWeather,
      target: { kind: "weather" },
    });
    expect(afterClear.state.weather.entries).toEqual([]);
    expect(afterClear.state.seats.seat_a.discard).toEqual(expect.arrayContaining([frost, clearWeather]));

    const noWeather = createState("clear-empty");
    noWeather.phase = "playing";
    noWeather.currentTurn = "seat_a";
    const noWeatherClear = findCard(noWeather, "neutral.clear-weather");
    putInHand(noWeather, "seat_a", [noWeatherClear]);
    expect(
      execute(noWeather, { type: "PlayCard", seatId: "seat_a", cardId: noWeatherClear, target: { kind: "weather" } })
        .state.seats.seat_a.discard,
    ).toContain(noWeatherClear);
  });

  it("passes to opponent, then transitions to round_end on the second pass", () => {
    const state = createState("pass-command");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    const afterA = execute(state, { type: "Pass", seatId: "seat_a" }).state;

    expect(afterA.seats.seat_a.passed).toBe(true);
    expect(afterA.currentTurn).toBe("seat_b");

    const afterB = execute(afterA, { type: "Pass", seatId: "seat_b" });
    expect(afterB.state.phase).toBe("round_end");
  });

  it("executes leader Clear Weather and rejects unsupported leaders without consuming them", () => {
    const state = createState("leader-command");
    const frost = findCard(state, "neutral.biting-frost");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    putWeather(state, "seat_b", frost);

    const result = execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } });
    expect(result.state.weather.entries).toEqual([]);
    expect(result.state.seats.seat_b.discard).toContain(frost);
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
    expect(result.state.cardsById[result.state.seats.seat_a.leader ?? ""].zone).toEqual({
      kind: "leader",
      seat: "seat_a",
    });

    const unsupported = createState("leader-unsupported");
    unsupported.phase = "playing";
    unsupported.currentTurn = "seat_b";
    const before = structuredClone(unsupported);
    expect(() => execute(unsupported, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } })).toThrow(
      EngineRuleError,
    );
    expect(unsupported).toEqual(before);
  });

  it("rejects wrong-turn, passed-seat, wrong-phase, invalid-target, opponent-hand, and Scorch commands", () => {
    const state = createState("rejects");
    const ownCard = findCard(state, "northern-realms.dun-banner-medic");
    const opponentCard = state.seats.seat_b.hand[0];
    state.phase = "playing";
    state.currentTurn = "seat_b";
    putInHand(state, "seat_a", [ownCard]);

    expect(() =>
      execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: ownCard,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
      }),
    ).toThrow(EngineRuleError);

    state.currentTurn = "seat_a";
    state.seats.seat_a.passed = true;
    expect(() => execute(state, { type: "Pass", seatId: "seat_a" })).toThrow(EngineRuleError);

    state.seats.seat_a.passed = false;
    state.phase = "mulligan";
    expect(() => execute(state, { type: "Pass", seatId: "seat_a" })).toThrow(EngineRuleError);

    state.phase = "playing";
    expect(() =>
      execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: ownCard,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      }),
    ).toThrow(EngineRuleError);

    expect(() =>
      execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: opponentCard,
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      }),
    ).toThrow(EngineRuleError);

    const scorch = findCard(state, "neutral.scorch");
    putInHand(state, "seat_a", [scorch]);
    expect(() =>
      execute(state, { type: "PlayCard", seatId: "seat_a", cardId: scorch, target: { kind: "none" } }),
    ).toThrow(EngineRuleError);
  });
});
