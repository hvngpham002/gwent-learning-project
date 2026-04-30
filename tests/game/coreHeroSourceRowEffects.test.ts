import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  calculateScores,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogRow } from "@/game/catalog";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp11-hero-source-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      controllerKind: "human",
      faction: "northern_realms",
      deckPreset: currentNorthernRealmsDeckPreset,
    },
    {
      seatId: "seat_b",
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

const createState = (seed = "hero-source") => startMatch(createConfig(seed)).state;

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

const removeEverywhere = (state: MatchState, cardId: CardInstanceId) => {
  Object.values(state.seats).forEach((seat) => {
    seat.deck = seat.deck.filter((id) => id !== cardId);
    seat.hand = seat.hand.filter((id) => id !== cardId);
    seat.discard = seat.discard.filter((id) => id !== cardId);
    Object.values(seat.board).forEach((row) => {
      row.units = row.units.filter((id) => id !== cardId);
      if (row.horn === cardId) row.horn = null;
    });
  });
  state.weather.entries = state.weather.entries.filter((id) => id !== cardId);
};

const placeOnBoard = (
  state: MatchState,
  seatId: SeatId,
  cardId: CardInstanceId,
  row: CatalogRow,
) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
  state.cardsById[cardId].controller = seatId;
};

const score = (state: MatchState) => calculateScores({ state, catalogCards: currentCatalogCards });

describe("Hero-source row effects (cCp11)", () => {
  it("Hero with Morale Boost (Isengrim) adds +1 to other non-hero units on the row", () => {
    const state = createState("isengrim-row-boost");
    const isengrim = addCardInstance(state, "seat_a", "scoiatael.isengrim-faoiltiarna", "isengrim");
    const ally1 = addCardInstance(state, "seat_a", "northern-realms.poor-fucking-infantry", "pfi1");
    const ally2 = addCardInstance(state, "seat_a", "northern-realms.poor-fucking-infantry", "pfi2");
    placeOnBoard(state, "seat_a", isengrim, "close");
    placeOnBoard(state, "seat_a", ally1, "close");
    placeOnBoard(state, "seat_a", ally2, "close");

    const breakdown = score(state);
    const ally1Entry = breakdown.cards.find((entry) => entry.cardId === ally1);
    const ally2Entry = breakdown.cards.find((entry) => entry.cardId === ally2);
    const isengrimEntry = breakdown.cards.find((entry) => entry.cardId === isengrim);

    expect(ally1Entry?.moraleBonus).toBe(1);
    expect(ally2Entry?.moraleBonus).toBe(1);
    // Each ally has Tight Bond x2 (printed strength 1 × 2 = 2) + 1 morale = 3
    expect(ally1Entry?.afterMorale).toBe(3);
    expect(ally2Entry?.afterMorale).toBe(3);
    // Hero is immune to receiving morale
    expect(isengrimEntry?.moraleBonus).toBe(0);
    expect(isengrimEntry?.finalStrength).toBe(10);
  });

  it("Hero source does not boost itself", () => {
    const state = createState("isengrim-self-immune");
    const isengrim = addCardInstance(state, "seat_a", "scoiatael.isengrim-faoiltiarna", "isengrim");
    placeOnBoard(state, "seat_a", isengrim, "close");

    const breakdown = score(state);
    const isengrimEntry = breakdown.cards.find((entry) => entry.cardId === isengrim);

    expect(isengrimEntry?.moraleBonus).toBe(0);
    expect(isengrimEntry?.finalStrength).toBe(10);
  });

  it("Other heroes on the row do not receive the +1 boost", () => {
    const state = createState("isengrim-other-heroes-immune");
    const isengrim = addCardInstance(state, "seat_a", "scoiatael.isengrim-faoiltiarna", "isengrim");
    const otherHero = addCardInstance(state, "seat_a", "neutral.geralt-of-rivia", "geralt");
    placeOnBoard(state, "seat_a", isengrim, "close");
    placeOnBoard(state, "seat_a", otherHero, "close");

    const breakdown = score(state);
    const otherHeroEntry = breakdown.cards.find((entry) => entry.cardId === otherHero);

    expect(otherHeroEntry?.moraleBonus).toBe(0);
    expect(otherHeroEntry?.finalStrength).toBe(15);
  });

  it("Existing unit-source Morale Boost behavior is unchanged for non-hero allies", () => {
    const state = createState("olgierd-baseline");
    const olgierd = addCardInstance(state, "seat_a", "neutral.olgierd-von-everec", "olgierd");
    const ally = addCardInstance(state, "seat_a", "northern-realms.redanian-foot-soldier", "rfs");
    placeOnBoard(state, "seat_a", olgierd, "close");
    placeOnBoard(state, "seat_a", ally, "close");

    const breakdown = score(state);
    const allyEntry = breakdown.cards.find((entry) => entry.cardId === ally);

    expect(allyEntry?.moraleBonus).toBe(1);
    expect(allyEntry?.finalStrength).toBe(2);
  });

  it("Kayran (hero, agile, morale_boost) adds +1 to non-hero allies on its placed row", () => {
    const state = createState("kayran-row-boost");
    const kayran = addCardInstance(state, "seat_a", "monsters.kayran", "kayran");
    const ally = addCardInstance(state, "seat_a", "scoiatael.dol-blathanna-archer", "ally");
    placeOnBoard(state, "seat_a", kayran, "ranged");
    placeOnBoard(state, "seat_a", ally, "ranged");

    const breakdown = score(state);
    const allyEntry = breakdown.cards.find((entry) => entry.cardId === ally);
    const kayranEntry = breakdown.cards.find((entry) => entry.cardId === kayran);

    expect(allyEntry?.moraleBonus).toBe(1);
    expect(allyEntry?.finalStrength).toBe(5);
    // Kayran is hero, receives no morale bonus
    expect(kayranEntry?.moraleBonus).toBe(0);
    expect(kayranEntry?.finalStrength).toBe(8);
  });
});
