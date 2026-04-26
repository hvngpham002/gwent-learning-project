import { describe, expect, it } from "vitest";

import { northernRealmsCatalogCards } from "@/data/catalog";
import {
  AUTHENTIC_CARD_DIMENSIONS,
  dimensionsForSize,
  fromCatalogCard,
  isUnitOrHero,
  shouldRenderStrength,
} from "@/components/gwent/cardViewModel";

describe("authentic card view model", () => {
  it("maps catalog cards into a UI-ready view model", () => {
    const catalogCard = northernRealmsCatalogCards[0]!;
    const view = fromCatalogCard(catalogCard);
    expect(view.sourceId).toBe(catalogCard.sourceId);
    expect(view.name).toBe(catalogCard.name);
    expect(view.faction).toBe(catalogCard.faction);
    expect(view.kind).toBe(catalogCard.kind);
    expect(view.strength).toBe(catalogCard.strength);
    expect(view.image).toBe(catalogCard.image);
  });

  it("treats only unit and hero cards as strength-bearing", () => {
    expect(
      isUnitOrHero({
        sourceId: "x",
        name: "x",
        faction: "neutral",
        kind: "unit",
        strength: 4,
        rows: ["close"],
        abilities: [],
        tags: [],
      }),
    ).toBe(true);
    expect(
      isUnitOrHero({
        sourceId: "x",
        name: "x",
        faction: "neutral",
        kind: "hero",
        strength: 7,
        rows: ["ranged"],
        abilities: [],
        tags: [],
      }),
    ).toBe(true);
    expect(
      shouldRenderStrength({
        sourceId: "x",
        name: "x",
        faction: "neutral",
        kind: "special",
        strength: 0,
        rows: [],
        abilities: [],
        tags: ["special"],
      }),
    ).toBe(false);
  });

  it("returns the canonical dimensions for known sizes and falls back to md", () => {
    expect(dimensionsForSize("md")).toEqual(AUTHENTIC_CARD_DIMENSIONS.md);
    expect(dimensionsForSize("xl")).toEqual(AUTHENTIC_CARD_DIMENSIONS.xl);
    // @ts-expect-error - guarding the fallback path against unknown sizes at runtime
    expect(dimensionsForSize("not-a-size")).toEqual(AUTHENTIC_CARD_DIMENSIONS.md);
  });
});
