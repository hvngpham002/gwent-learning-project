import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  getLegalMoves,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogRow } from "@/game/catalog";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `legal-${seed}`,
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

const legalMoves = (state: MatchState, seatId: SeatId) =>
  getLegalMoves({
    state,
    seatId,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const createState = (seed = "legal-moves") => startMatch(createConfig(seed)).state;

const findCard = (state: MatchState, sourceId: string, exclude: readonly CardInstanceId[] = []) => {
  const card = Object.values(state.cardsById).find(
    (candidate) => candidate.sourceId === sourceId && !exclude.includes(candidate.instanceId),
  );

  if (!card) {
    throw new Error(`Missing test card source ${sourceId}`);
  }

  return card.instanceId;
};

const setHand = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  state.seats[seatId].hand = cardIds;
  cardIds.forEach((cardId) => {
    state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
  });
};

const playOnBoard = (state: MatchState, seatId: SeatId, cardId: CardInstanceId, row: CatalogRow) => {
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
};

const addCardInstance = (state: MatchState, seatId: SeatId, sourceId: string): CardInstanceId => {
  const instanceId = `${seatId}:test:${sourceId}`;
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

const playMoveTargets = (state: MatchState, seatId: SeatId, sourceId: string) =>
  legalMoves(state, seatId).filter((move) => move.kind === "play_card" && move.sourceId === sourceId);

describe("core legal move generator", () => {
  it("returns keep-hand and one-card mulligan choices using only acting-seat hand IDs", () => {
    const state = createState("mulligan");
    const moves = legalMoves(state, "seat_a").filter((move) => move.kind === "choose_mulligan");
    const ownHandIds = new Set(state.seats.seat_a.hand);
    const opponentHandIds = new Set(state.seats.seat_b.hand);

    expect(moves).toHaveLength(11);
    expect(moves.some((move) => move.cardIds.length === 0)).toBe(true);
    expect(moves.some((move) => move.cardIds.length === 1)).toBe(true);
    expect(moves.some((move) => move.cardIds.length === 2)).toBe(false);
    moves.flatMap((move) => move.cardIds).forEach((cardId) => {
      expect(ownHandIds.has(cardId)).toBe(true);
      expect(opponentHandIds.has(cardId)).toBe(false);
    });
  });

  it("gates playing moves to the current unpassed seat", () => {
    const state = createState("turn-gates");
    state.phase = "playing";
    state.currentTurn = "seat_a";

    expect(legalMoves(state, "seat_a").some((move) => move.kind === "pass")).toBe(true);
    expect(legalMoves(state, "seat_b")).toEqual([]);

    state.seats.seat_a.passed = true;
    expect(legalMoves(state, "seat_a")).toEqual([]);
  });

  it("does not return play, pass, or leader moves outside the playing phase", () => {
    const state = createState("phase-gate");
    state.phase = "round_end";

    expect(legalMoves(state, "seat_a")).toEqual([]);
  });

  it("uses catalog rows for normal units and all rows for agile cards", () => {
    const state = createState("rows");
    const medic = findCard(state, "northern-realms.dun-banner-medic");
    const olgierd = findCard(state, "neutral.olgierd-von-everec");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    setHand(state, "seat_a", [medic, olgierd]);

    expect(playMoveTargets(state, "seat_a", "northern-realms.dun-banner-medic").map((move) => move.target)).toEqual([
      { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    ]);
    expect(playMoveTargets(state, "seat_a", "neutral.olgierd-von-everec").map((move) => move.target)).toEqual([
      { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    ]);
  });

  it("targets opponent rows for Spy cards", () => {
    const state = createState("spy");
    const thaler = findCard(state, "northern-realms.thaler");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    setHand(state, "seat_a", [thaler]);

    expect(playMoveTargets(state, "seat_a", "northern-realms.thaler").map((move) => move.target)).toEqual([
      { kind: "board_row", side: "opponent", seatId: "seat_b", row: "siege" },
    ]);
  });

  it("targets only empty own horn slots for Commander's Horn", () => {
    const state = createState("horn");
    const horn = findCard(state, "neutral.commanders-horn");
    const occupiedHorn = findCard(state, "neutral.commanders-horn", [horn]);
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.seats.seat_a.board.close.horn = occupiedHorn;
    setHand(state, "seat_a", [horn]);

    expect(playMoveTargets(state, "seat_a", "neutral.commanders-horn").map((move) => move.target)).toEqual([
      { kind: "row_horn", side: "own", seatId: "seat_a", row: "ranged" },
      { kind: "row_horn", side: "own", seatId: "seat_a", row: "siege" },
    ]);
  });

  it("allows Decoy only on own non-Hero units", () => {
    const state = createState("decoy");
    const decoy = findCard(state, "neutral.decoy");
    const ownUnit = findCard(state, "northern-realms.dun-banner-medic");
    const ownHero = findCard(state, "northern-realms.vernon-roche");
    const opponentUnit = findCard(state, "nilfgaard.young-emissary");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    setHand(state, "seat_a", [decoy]);
    playOnBoard(state, "seat_a", ownUnit, "siege");
    playOnBoard(state, "seat_a", ownHero, "close");
    playOnBoard(state, "seat_b", opponentUnit, "close");

    expect(playMoveTargets(state, "seat_a", "neutral.decoy").map((move) => move.target)).toEqual([
      { kind: "card_instance", side: "own", seatId: "seat_a", cardId: ownUnit, row: "siege" },
    ]);
  });

  it("targets weather for weather cards, Skellige Storm, and no-op Clear Weather", () => {
    const state = createState("weather");
    const frost = findCard(state, "neutral.biting-frost");
    const storm = addCardInstance(state, "seat_a", "neutral.skellige-storm");
    const clearWeather = addCardInstance(state, "seat_a", "neutral.clear-weather");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.weather.entries = [];
    setHand(state, "seat_a", [frost, storm, clearWeather]);

    expect(playMoveTargets(state, "seat_a", "neutral.biting-frost")[0].target).toEqual({ kind: "weather" });
    expect(playMoveTargets(state, "seat_a", "neutral.skellige-storm")[0].target).toEqual({ kind: "weather" });
    expect(playMoveTargets(state, "seat_a", "neutral.clear-weather")[0].target).toEqual({ kind: "weather" });
  });

  it("uses a none target for Special Scorch", () => {
    const state = createState("scorch");
    const scorch = findCard(state, "neutral.scorch");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    setHand(state, "seat_a", [scorch]);

    expect(playMoveTargets(state, "seat_a", "neutral.scorch")[0].target).toEqual({ kind: "none" });
  });

  it("gates leader use by turn, pass state, and leaderUsed", () => {
    const state = createState("leader");
    state.phase = "playing";
    state.currentTurn = "seat_a";

    expect(legalMoves(state, "seat_a").filter((move) => move.kind === "use_leader")).toHaveLength(1);

    state.seats.seat_a.leaderUsed = true;
    expect(legalMoves(state, "seat_a").filter((move) => move.kind === "use_leader")).toHaveLength(0);

    state.seats.seat_a.leaderUsed = false;
    state.seats.seat_a.passed = true;
    expect(legalMoves(state, "seat_a").filter((move) => move.kind === "use_leader")).toHaveLength(0);

    state.seats.seat_a.passed = false;
    state.currentTurn = "seat_b";
    expect(legalMoves(state, "seat_a").filter((move) => move.kind === "use_leader")).toHaveLength(0);
  });

  it("does not advertise placeholder leaders as executable use_leader moves", () => {
    const state = createState("leader-placeholder");
    state.phase = "playing";
    state.currentTurn = "seat_b";

    expect(state.seats.seat_b.leaderSourceId).toBe("nilfgaard.emhyr-var-emreis-the-relentless");
    expect(legalMoves(state, "seat_b").filter((move) => move.kind === "use_leader")).toEqual([]);
  });

  it("does not leak opponent hand IDs through returned moves", () => {
    const state = createState("hidden-info");
    state.phase = "playing";
    state.currentTurn = "seat_a";
    const serializedMoves = JSON.stringify(legalMoves(state, "seat_a"));

    state.seats.seat_b.hand.forEach((opponentHandId) => {
      expect(serializedMoves).not.toContain(opponentHandId);
    });
  });
});
