import { describe, expect, it } from "vitest";

import { createInitialDeck } from "@/legacy/utils/deckBuilder";
import {
  calculateRowStrength,
  calculateTotalScore,
  canPlayInRow,
  getWeatherAffectedRows,
} from "@/legacy/utils/gameHelpers";
import { CardAbility, CardType, Faction, RowPosition, UnitCard } from "@/legacy/types/card";

const unit = (overrides: Partial<UnitCard>): UnitCard => ({
  id: "unit",
  name: "Test Unit",
  faction: Faction.NORTHERN_REALMS,
  type: CardType.UNIT,
  strength: 4,
  row: RowPosition.CLOSE,
  ability: CardAbility.NONE,
  imageUrl: "/test.png",
  ...overrides,
});

describe("baseline scoring helpers", () => {
  it("applies current row scoring for weather, tight bond, horn, and morale boost", () => {
    const cards = [
      unit({ id: "bsc-1", name: "Blue Stripes Commando", ability: CardAbility.TIGHT_BOND }),
      unit({ id: "bsc-2", name: "Blue Stripes Commando", ability: CardAbility.TIGHT_BOND }),
      unit({
        id: "olgierd",
        name: "Olgierd von Everec",
        strength: 6,
        ability: CardAbility.MORALE_BOOST,
      }),
    ];

    expect(calculateRowStrength(cards, false, true)).toBe(46);
    expect(calculateRowStrength(cards, true, true)).toBe(12);
  });

  it("keeps hero strength immune to row modifiers in current scoring", () => {
    const hero = unit({
      id: "hero",
      name: "Vernon Roche",
      type: CardType.HERO,
      strength: 10,
      ability: CardAbility.NONE,
    });

    expect(calculateRowStrength([hero], true, true)).toBe(10);
  });

  it("totals all rows with the active Frost, Fog, and Rain weather set", () => {
    const board = {
      close: { cards: [unit({ id: "close", strength: 5 })], hornActive: false },
      ranged: {
        cards: [unit({ id: "ranged", strength: 6, row: RowPosition.RANGED })],
        hornActive: false,
      },
      siege: {
        cards: [unit({ id: "siege", strength: 7, row: RowPosition.SIEGE })],
        hornActive: false,
      },
    };

    expect(calculateTotalScore(board, new Set([CardAbility.FROST, CardAbility.RAIN]))).toBe(8);
  });
});

describe("baseline deck and catalog helpers", () => {
  it("builds the current Northern Realms starter shape with unique runtime ids", () => {
    const { deck, leader } = createInitialDeck(Faction.NORTHERN_REALMS, "player");
    const ids = new Set(deck.map((card) => card.id));

    expect(deck).toHaveLength(35);
    expect(ids.size).toBe(deck.length);
    expect(leader.name).toBe("Foltest: Lord Commander of The North");
    expect(deck.filter((card) => card.type === CardType.SPECIAL)).toHaveLength(8);
  });

  it("allows Agile cards in their alternate rows and keeps normal units row-locked", () => {
    const agile = unit({
      id: "olgierd",
      name: "Olgierd von Everec",
      availableRows: [RowPosition.CLOSE, RowPosition.RANGED],
    });
    const siege = unit({ id: "siege", row: RowPosition.SIEGE });

    expect(canPlayInRow(agile, RowPosition.RANGED)).toBe(true);
    expect(canPlayInRow(siege, RowPosition.RANGED)).toBe(false);
  });

  it("documents the current weather row mapping helper, including Skellige Storm metadata", () => {
    expect(getWeatherAffectedRows(CardAbility.FROST)).toEqual([RowPosition.CLOSE]);
    expect(getWeatherAffectedRows(CardAbility.SKELLIGE_STORM)).toEqual([
      RowPosition.RANGED,
      RowPosition.SIEGE,
    ]);
  });
});
