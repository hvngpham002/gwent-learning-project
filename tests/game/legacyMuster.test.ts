import { describe, expect, it } from "vitest";

import { findMusterCards } from "@/hooks/useGameLogic";
import { CardAbility, CardType, Faction, RowPosition, type UnitCard } from "@/types/card";

const musterUnit = (id: string, name: string): UnitCard => ({
  id,
  name,
  faction: Faction.NEUTRAL,
  type: CardType.UNIT,
  strength: 4,
  row: RowPosition.RANGED,
  ability: CardAbility.MUSTER,
  imageUrl: `/images/test/${id}.png`,
});

describe("legacy Muster card grouping", () => {
  it("treats colon-named variants as one symmetric Muster group", () => {
    const gaunter = musterUnit("gaunter", "Gaunter O'Dimm");
    const darknessPlayed = musterUnit("darkness-played", "Gaunter O'Dimm: Darkness");
    const darknessDeck = musterUnit("darkness-deck", "Gaunter O'Dimm: Darkness");

    expect(findMusterCards(gaunter, [darknessPlayed], [darknessDeck]).map((card) => card.id)).toEqual([
      "darkness-played",
      "darkness-deck",
    ]);

    expect(findMusterCards(darknessPlayed, [gaunter], [darknessDeck]).map((card) => card.id)).toEqual([
      "gaunter",
      "darkness-deck",
    ]);
  });
});
