import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  calculateScores,
  findSpecialScorchTargets,
  findUnitScorchCloseTargets,
  startMatch,
  type CardInstanceId,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogRow } from "@/game/catalog";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `scoring-${seed}`,
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

const createState = (seed = "scoring") => startMatch(createConfig(seed)).state;

const findCards = (state: MatchState, sourceId: string) =>
  Object.values(state.cardsById)
    .filter((candidate) => candidate.sourceId === sourceId)
    .map((candidate) => candidate.instanceId);

const findCard = (state: MatchState, sourceId: string, exclude: readonly CardInstanceId[] = []) => {
  const cardId = findCards(state, sourceId).find((candidate) => !exclude.includes(candidate));
  if (!cardId) {
    throw new Error(`Missing test card source ${sourceId}`);
  }
  return cardId;
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

const putOnBoard = (state: MatchState, seatId: SeatId, cardId: CardInstanceId, row: CatalogRow) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
  state.cardsById[cardId].controller = seatId;
};

const putHorn = (state: MatchState, seatId: SeatId, cardId: CardInstanceId, row: CatalogRow) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].horn = cardId;
  state.cardsById[cardId].zone = { kind: "row_horn", seat: seatId, row };
  state.cardsById[cardId].controller = seatId;
};

const putWeather = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
  state.cardsById[cardId].controller = seatId;
};

const score = (state: MatchState) => calculateScores({ state, catalogCards: currentCatalogCards });

describe("core scoring pipeline", () => {
  it("applies Weather, Tight Bond, Morale Boost, then Horn in exact order", () => {
    const state = createState("modifier-order");
    const bsc = findCards(state, "northern-realms.blue-stripes-commando").slice(0, 3);
    const olgierd = findCard(state, "neutral.olgierd-von-everec");
    const horn = findCard(state, "neutral.commanders-horn");

    bsc.forEach((cardId) => putOnBoard(state, "seat_a", cardId, "close"));
    putOnBoard(state, "seat_a", olgierd, "close");
    putHorn(state, "seat_a", horn, "close");

    const breakdown = score(state);
    const bscEntries = breakdown.cards.filter((entry) => bsc.includes(entry.cardId));
    const olgierdEntry = breakdown.cards.find((entry) => entry.cardId === olgierd);

    expect(breakdown.rowTotalsBySeat.seat_a.close).toBe(90);
    expect(bscEntries.map((entry) => entry.finalStrength)).toEqual([26, 26, 26]);
    expect(bscEntries[0]).toMatchObject({
      printedStrength: 4,
      afterWeather: 4,
      tightBondMultiplier: 3,
      afterTightBond: 12,
      moraleBonus: 1,
      afterMorale: 13,
      hornMultiplier: 2,
      finalStrength: 26,
    });
    expect(olgierdEntry?.finalStrength).toBe(12);
  });

  it("handles weather, Skellige Storm, Hero immunity, Decoy placeholders, and King Bran policy", () => {
    const state = createState("weather");
    const hero = findCard(state, "northern-realms.vernon-roche");
    const unit = findCard(state, "northern-realms.blue-stripes-commando");
    const decoy = findCard(state, "neutral.decoy");
    const frost = findCard(state, "neutral.biting-frost");
    const storm = findCard(state, "neutral.torrential-rain");
    state.cardsById[storm].sourceId = "neutral.skellige-storm";

    putOnBoard(state, "seat_a", hero, "close");
    putOnBoard(state, "seat_a", unit, "close");
    putOnBoard(state, "seat_a", decoy, "close");
    putWeather(state, "seat_b", frost);
    putWeather(state, "seat_a", storm);

    const normal = score(state);
    expect(normal.activeWeatherEffects.map((entry) => entry.effect).sort()).toEqual(["frost", "skellige_storm"]);
    expect(normal.cards.find((entry) => entry.cardId === hero)?.finalStrength).toBe(10);
    expect(normal.cards.find((entry) => entry.cardId === unit)?.finalStrength).toBe(1);
    expect(normal.cards.find((entry) => entry.cardId === decoy)).toMatchObject({
      cardKind: "special",
      finalStrength: 0,
      eligibleForScorch: false,
    });

    const kingBran = calculateScores({
      state,
      catalogCards: currentCatalogCards,
      weatherPolicyBySeat: { seat_a: "king_bran" },
    });
    expect(kingBran.cards.find((entry) => entry.cardId === unit)?.finalStrength).toBe(2);
  });

  it("supports Scorch target helpers from effective strength and diagnostics for malformed state", () => {
    const state = createState("scorch-helper");
    const hero = findCard(state, "neutral.geralt-of-rivia");
    const [first, second] = findCards(state, "northern-realms.blue-stripes-commando");

    putOnBoard(state, "seat_a", hero, "close");
    putOnBoard(state, "seat_a", first, "close");
    putOnBoard(state, "seat_a", second, "close");
    state.seats.seat_b.board.close.units.push("missing-card");

    const breakdown = score(state);
    const specialTargets = findSpecialScorchTargets(breakdown);
    const closeTargets = findUnitScorchCloseTargets(breakdown, "seat_b");

    expect(specialTargets.map((target) => target.cardId).sort()).toEqual([first, second].sort());
    expect(closeTargets).toMatchObject({ outcome: "destroyed", oppositeSeatId: "seat_a", rowTotal: 31 });
    expect(closeTargets.targets.map((target) => target.cardId).sort()).toEqual([first, second].sort());
    expect(breakdown.diagnostics).toContainEqual(expect.objectContaining({ code: "missing_card_instance" }));
  });

  it("does not mutate input state", () => {
    const state = createState("immutability");
    const card = findCard(state, "northern-realms.catapult");
    putOnBoard(state, "seat_a", card, "siege");
    const before = structuredClone(state);

    score(state);

    expect(state).toEqual(before);
  });
});
