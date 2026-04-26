import { describe, expect, it } from "vitest";

import { northernRealmsCatalogCards } from "@/data/catalog";
import {
  AUTHENTIC_CATALOG_CARD_DIMENSIONS,
  AUTHENTIC_CATALOG_CARD_SOURCE_FACE_BOTTOM_CROP_PX,
  AUTHENTIC_CARD_DIMENSIONS,
  AUTHENTIC_CARD_SIZE_SCALE,
  AUTHENTIC_CARD_SOURCE_FACE_BOTTOM_CROP_PX,
  cardBackImageCandidates,
  dimensionsForSize,
  fromCatalogCard,
  isUnitOrHero,
  shouldRenderStrength,
  sourceFaceBottomCropForSize,
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

  it("derives authentic card sizes from the catalog card dimensions", () => {
    expect(AUTHENTIC_CATALOG_CARD_DIMENSIONS).toEqual({ width: 86.5, height: 147 });
    expect(AUTHENTIC_CARD_SIZE_SCALE).toMatchObject({
      xs: 0.5,
      sm: 0.75,
      md: 1,
      lg: 1.5,
    });
    expect(AUTHENTIC_CARD_DIMENSIONS.xs).toEqual({ width: 43.25, height: 73.5 });
    expect(AUTHENTIC_CARD_DIMENSIONS.sm).toEqual({ width: 64.875, height: 110.25 });
    expect(AUTHENTIC_CARD_DIMENSIONS.md).toEqual(AUTHENTIC_CATALOG_CARD_DIMENSIONS);
    expect(AUTHENTIC_CARD_DIMENSIONS.lg).toEqual({ width: 129.75, height: 220.5 });
    expect(AUTHENTIC_CARD_DIMENSIONS.xl).toEqual(AUTHENTIC_CARD_DIMENSIONS.lg);
    expect(AUTHENTIC_CATALOG_CARD_SOURCE_FACE_BOTTOM_CROP_PX).toBe(15);
    expect(AUTHENTIC_CARD_SOURCE_FACE_BOTTOM_CROP_PX).toEqual({
      xs: 7.5,
      sm: 11.25,
      md: 15,
      lg: 22.5,
      xl: 22.5,
    });
    expect(sourceFaceBottomCropForSize("xs")).toBe(7.5);
    expect(sourceFaceBottomCropForSize("sm")).toBe(11.25);
    expect(sourceFaceBottomCropForSize("md")).toBe(15);
    expect(sourceFaceBottomCropForSize("lg")).toBe(22.5);
  });

  it("provides faction and discard pile card-back image candidates with safe fallbacks", () => {
    expect(cardBackImageCandidates("northern_realms")[0]).toBe(
      "/images/northern_realms/default-northern_realms.png",
    );
    expect(cardBackImageCandidates("northern_realms")).toContain(
      "/images/card-backs/northern_realms.png",
    );
    expect(cardBackImageCandidates("northern_realms")).toContain(
      "/images/card-backs/northern-realms-back.png",
    );
    expect(cardBackImageCandidates("monsters")).toContain("/images/monsters/default-monster.png");
    expect(cardBackImageCandidates("northern_realms")).not.toContain("/images/closed_card.jpeg");
    expect(cardBackImageCandidates("neutral", "discard")).toEqual([
      "/images/card-backs/discard.png",
      "/images/card-backs/discard.jpg",
      "/images/card-backs/discard.jpeg",
      "/images/other-graveyard.png",
    ]);
  });
});
