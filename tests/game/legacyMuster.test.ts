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
  it("lets a base Muster card call colon variants without letting variants call the base", () => {
    const gaunter = musterUnit("gaunter", "Gaunter O'Dimm");
    const darknessPlayed = musterUnit("darkness-played", "Gaunter O'Dimm: Darkness");
    const darknessDeck = musterUnit("darkness-deck", "Gaunter O'Dimm: Darkness");

    expect(findMusterCards(gaunter, [darknessPlayed], [darknessDeck]).map((card) => card.id)).toEqual([
      "darkness-played",
      "darkness-deck",
    ]);

    expect(findMusterCards(darknessPlayed, [gaunter], [darknessDeck]).map((card) => card.id)).toEqual([
      "darkness-deck",
    ]);
  });

  it("never returns base Gaunter when Darkness is played, even with multiple base copies in hand and deck", () => {
    const baseInHand = musterUnit("gaunter-hand", "Gaunter O'Dimm");
    const baseInDeck = musterUnit("gaunter-deck", "Gaunter O'Dimm");
    const darknessPlayed = musterUnit("darkness-played", "Gaunter O'Dimm: Darkness");
    const otherDarkness = musterUnit("other-darkness", "Gaunter O'Dimm: Darkness");

    const targets = findMusterCards(darknessPlayed, [baseInHand, otherDarkness], [baseInDeck]);

    expect(targets.map((card) => card.id)).toEqual(["other-darkness"]);
    expect(targets.find((card) => card.name === "Gaunter O'Dimm")).toBeUndefined();
  });

  it("base Gaunter still pulls all Darkness copies across hand and deck", () => {
    const gaunter = musterUnit("gaunter", "Gaunter O'Dimm");
    const darknessHandA = musterUnit("darkness-hand-a", "Gaunter O'Dimm: Darkness");
    const darknessHandB = musterUnit("darkness-hand-b", "Gaunter O'Dimm: Darkness");
    const darknessDeck = musterUnit("darkness-deck", "Gaunter O'Dimm: Darkness");

    const targets = findMusterCards(gaunter, [darknessHandA, darknessHandB], [darknessDeck]);

    expect(targets.map((card) => card.id).sort()).toEqual([
      "darkness-deck",
      "darkness-hand-a",
      "darkness-hand-b",
    ]);
  });
});
