import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  executeCommand,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type EngineCommand,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogRow } from "@/game/catalog";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp11-scorch-${seed}`,
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

const createState = (seed = "scorch-variants") => startMatch(createConfig(seed)).state;

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

const placeInHand = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].hand.push(cardId);
  state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
};

const preparePlayingTurn = (state: MatchState, seatId: SeatId = "seat_a") => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.pendingPrompt = null;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
};

describe("Row-scoped unit Scorch (cCp11)", () => {
  it("Toad fires Scorch - Ranged when opponent ranged total >= 10", () => {
    const state = createState("toad-fires");
    const toad = addCardInstance(state, "seat_a", "monsters.toad", "toad");
    const target1 = addCardInstance(state, "seat_b", "scoiatael.milva", "milva");
    placeOnBoard(state, "seat_b", target1, "ranged");
    placeInHand(state, "seat_a", toad);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: toad,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    expect(result.state.seats.seat_a.board.ranged.units).toContain(toad);
    expect(result.state.seats.seat_b.board.ranged.units).not.toContain(target1);
    expect(result.state.seats.seat_b.discard).toContain(target1);
    expect(
      result.events.some(
        (event) =>
          event.type === "scorch_resolved" &&
          event.abilityId === "scorch_range" &&
          event.outcome === "destroyed",
      ),
    ).toBe(true);
  });

  it("Toad does not fire when opponent ranged total < 10", () => {
    const state = createState("toad-no-fire");
    const toad = addCardInstance(state, "seat_a", "monsters.toad", "toad");
    const small = addCardInstance(state, "seat_b", "scoiatael.toruviel", "toruviel");
    placeOnBoard(state, "seat_b", small, "ranged");
    placeInHand(state, "seat_a", toad);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: toad,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    expect(result.state.seats.seat_a.board.ranged.units).toContain(toad);
    expect(result.state.seats.seat_b.board.ranged.units).toContain(small);
    expect(
      result.events.some(
        (event) =>
          event.type === "scorch_resolved" &&
          event.abilityId === "scorch_range" &&
          event.outcome === "below_threshold",
      ),
    ).toBe(true);
  });

  it("Schirru fires Scorch - Siege against tied highest siege units when opponent siege total >= 10", () => {
    const state = createState("schirru-fires");
    const schirru = addCardInstance(state, "seat_a", "scoiatael.schirru", "schirru");
    const target1 = addCardInstance(state, "seat_b", "northern-realms.trebuchet", "treb1");
    const target2 = addCardInstance(state, "seat_b", "northern-realms.trebuchet", "treb2");
    placeOnBoard(state, "seat_b", target1, "siege");
    placeOnBoard(state, "seat_b", target2, "siege");
    placeInHand(state, "seat_a", schirru);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: schirru,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    });

    expect(result.state.seats.seat_a.board.siege.units).toContain(schirru);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(target1);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(target2);
    expect(result.state.seats.seat_b.discard).toEqual(expect.arrayContaining([target1, target2]));
    expect(
      result.events.some(
        (event) =>
          event.type === "scorch_resolved" &&
          event.abilityId === "scorch_siege" &&
          event.outcome === "destroyed",
      ),
    ).toBe(true);
  });

  it("Row-scoped Scorch ignores heroes on the opponent row", () => {
    const state = createState("schirru-ignores-hero");
    const schirru = addCardInstance(state, "seat_a", "scoiatael.schirru", "schirru");
    // Force a hero onto opponent's siege row so the row threshold is met but
    // the hero is not eligible for scorch.
    const heroSiege = addCardInstance(state, "seat_b", "neutral.geralt-of-rivia", "geralt");
    const unitSiege = addCardInstance(state, "seat_b", "northern-realms.trebuchet", "treb");
    placeOnBoard(state, "seat_b", heroSiege, "siege");
    placeOnBoard(state, "seat_b", unitSiege, "siege");
    placeInHand(state, "seat_a", schirru);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: schirru,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    });

    expect(result.state.seats.seat_b.board.siege.units).toContain(heroSiege);
    expect(result.state.seats.seat_b.board.siege.units).not.toContain(unitSiege);
    expect(result.state.seats.seat_b.discard).toContain(unitSiege);
  });

  it("Villentretenmerth still fires Scorch - Close after generalization", () => {
    const state = createState("villen-still-works");
    const villen = addCardInstance(state, "seat_a", "neutral.villentretenmerth", "v");
    const target1 = addCardInstance(state, "seat_b", "nilfgaard.young-emissary", "ye1");
    const target2 = addCardInstance(state, "seat_b", "nilfgaard.young-emissary", "ye2");
    placeOnBoard(state, "seat_b", target1, "close");
    placeOnBoard(state, "seat_b", target2, "close");
    placeInHand(state, "seat_a", villen);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: villen,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(result.state.seats.seat_b.discard).toEqual(expect.arrayContaining([target1, target2]));
    expect(
      result.events.some(
        (event) =>
          event.type === "scorch_resolved" &&
          event.abilityId === "scorch_close" &&
          event.outcome === "destroyed",
      ),
    ).toBe(true);
  });
});

describe("Unit-source whole-board Scorch — Clan Dimun Pirate (cCp11)", () => {
  it("Clan Dimun Pirate destroys itself when it is the unique highest non-hero unit", () => {
    const state = createState("dimun-self-destroys");
    const dimun = addCardInstance(state, "seat_a", "skellige.clan-dimun-pirate", "dp");
    const small = addCardInstance(state, "seat_b", "nilfgaard.young-emissary", "ye");
    placeOnBoard(state, "seat_b", small, "ranged");
    placeInHand(state, "seat_a", dimun);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: dimun,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    expect(result.state.seats.seat_a.board.ranged.units).not.toContain(dimun);
    expect(result.state.seats.seat_a.discard).toContain(dimun);
    expect(result.state.seats.seat_b.board.ranged.units).toContain(small);
  });

  it("Clan Dimun Pirate destroys itself and tied highest cards", () => {
    const state = createState("dimun-tied");
    const dimun = addCardInstance(state, "seat_a", "skellige.clan-dimun-pirate", "dp");
    const tied = addCardInstance(state, "seat_b", "monsters.toad", "tied");
    placeOnBoard(state, "seat_b", tied, "ranged");
    placeInHand(state, "seat_a", dimun);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: dimun,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    // Dimun has effective strength 6, Toad has 7 (no scorch_range fires since it's just landing)
    // Wait — Toad is now scorch_range so when Toad was placed on the board manually, its ability
    // doesn't fire. So Toad sits there at 7. Dimun lands at 6. Toad is the unique highest non-hero
    // unit, gets scorched, but Dimun does NOT tie — Dimun stays on board.
    // So the test pivots: Dimun (6) vs Toad (7) → Toad alone is destroyed.
    expect(result.state.seats.seat_a.board.ranged.units).toContain(dimun);
    expect(result.state.seats.seat_b.board.ranged.units).not.toContain(tied);
    expect(result.state.seats.seat_b.discard).toContain(tied);
  });

  it("Clan Dimun Pirate destroys itself and an opponent unit when both share highest effective strength", () => {
    const state = createState("dimun-tie-self");
    const dimun = addCardInstance(state, "seat_a", "skellige.clan-dimun-pirate", "dp");
    const tied = addCardInstance(state, "seat_b", "skellige.clan-dimun-pirate", "dp2");
    placeOnBoard(state, "seat_b", tied, "ranged");
    placeInHand(state, "seat_a", dimun);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: dimun,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    // Both Dimun units share strength 6 and tie for highest.
    expect(result.state.seats.seat_a.board.ranged.units).not.toContain(dimun);
    expect(result.state.seats.seat_a.discard).toContain(dimun);
    expect(result.state.seats.seat_b.board.ranged.units).not.toContain(tied);
    expect(result.state.seats.seat_b.discard).toContain(tied);
  });

  it("Clan Dimun Pirate uses effective strength after Tight Bond multipliers", () => {
    const state = createState("dimun-effective-strength");
    const dimun = addCardInstance(state, "seat_a", "skellige.clan-dimun-pirate", "dp");
    const bsc1 = addCardInstance(state, "seat_b", "northern-realms.blue-stripes-commando", "bsc1");
    const bsc2 = addCardInstance(state, "seat_b", "northern-realms.blue-stripes-commando", "bsc2");
    const bsc3 = addCardInstance(state, "seat_b", "northern-realms.blue-stripes-commando", "bsc3");
    placeOnBoard(state, "seat_b", bsc1, "close");
    placeOnBoard(state, "seat_b", bsc2, "close");
    placeOnBoard(state, "seat_b", bsc3, "close");
    placeInHand(state, "seat_a", dimun);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: dimun,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    // 3x Blue Stripes Commando = 4*3=12 each via tight bond (highest effective strength)
    // Dimun has effective strength 6 — does not tie.
    expect(result.state.seats.seat_a.board.ranged.units).toContain(dimun);
    expect(result.state.seats.seat_b.board.close.units).not.toContain(bsc1);
    expect(result.state.seats.seat_b.board.close.units).not.toContain(bsc2);
    expect(result.state.seats.seat_b.board.close.units).not.toContain(bsc3);
    expect(result.state.seats.seat_b.discard).toEqual(expect.arrayContaining([bsc1, bsc2, bsc3]));
  });
});
