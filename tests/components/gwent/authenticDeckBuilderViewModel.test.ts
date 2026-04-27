import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  addCardToDeck,
  buildCardPool,
  buildDeckCardItems,
  createEmptyDeckPreset,
  filterCardPool,
  makeUniqueDeckName,
  normalizeDeckCollection,
  removeCardFromDeck,
  validateDeckPreset,
} from "@/components/gwent/deckBuilderViewModel";

describe("authentic deck builder view model", () => {
  it("builds faction plus neutral card pools from catalog data", () => {
    const pool = buildCardPool(currentNorthernRealmsDeckPreset);
    const factions = new Set(pool.map((item) => item.card.faction));

    expect(factions.has("northern_realms")).toBe(true);
    expect(factions.has("neutral")).toBe(true);
    expect(factions.has("nilfgaard")).toBe(false);
    expect(pool.some((item) => item.card.sourceId === "northern-realms.vernon-roche")).toBe(true);
  });

  it("filters and searches deterministically", () => {
    const pool = buildCardPool(currentNorthernRealmsDeckPreset);

    expect(filterCardPool(pool, "heroes").every((item) => item.card.kind === "hero")).toBe(true);
    expect(filterCardPool(pool, "units").every((item) => item.card.kind === "unit")).toBe(true);
    expect(filterCardPool(pool, "specials").every((item) => item.card.kind === "special")).toBe(true);
    expect(filterCardPool(pool, "all", "vernon").map((item) => item.card.sourceId)).toEqual([
      "northern-realms.vernon-roche",
    ]);
  });

  it("adds only to deck limit and removes by decrementing to zero", () => {
    const empty = createEmptyDeckPreset("local-test");
    const withOne = addCardToDeck(empty, "neutral.geralt-of-rivia");
    const withTwoAttempt = addCardToDeck(withOne, "neutral.geralt-of-rivia");

    expect(withOne.mainDeck).toEqual([{ sourceId: "neutral.geralt-of-rivia", count: 1 }]);
    expect(withTwoAttempt.mainDeck).toEqual(withOne.mainDeck);
    expect(removeCardFromDeck(withOne, "neutral.geralt-of-rivia").mainDeck).toEqual([]);
  });

  it("creates unique local deck names and normalizes duplicate local identities", () => {
    expect(makeUniqueDeckName("New Deck", [createEmptyDeckPreset("a", "New Deck")])).toBe("New Deck 2");

    const normalized = normalizeDeckCollection([
      { ...currentNorthernRealmsDeckPreset, presetId: "local-same", name: "Saved Deck" },
      { ...currentNorthernRealmsDeckPreset, presetId: "local-same", name: " Saved   Deck " },
    ]);

    expect(normalized.map((deck) => deck.presetId)).toEqual(["local-same", "local-same-2"]);
    expect(normalized.map((deck) => deck.name)).toEqual(["Saved Deck", "Saved Deck 2"]);
  });

  it("sorts cards in deck by strength, kind, then name", () => {
    const items = buildDeckCardItems(currentNorthernRealmsDeckPreset);

    expect(items[0]?.card.sourceId).toBe("neutral.geralt-of-rivia");
    expect(items.map((item) => item.card.sourceId)).toContain("neutral.scorch");
  });

  it("computes stats for the current deck", () => {
    const stats = validateDeckPreset(currentNorthernRealmsDeckPreset);

    expect(stats.playable).toBe(true);
    expect(stats.battlefieldCards).toBeGreaterThanOrEqual(22);
    expect(stats.specialCards).toBeLessThanOrEqual(10);
    expect(stats.heroCards).toBeGreaterThan(0);
    expect(stats.totalStrength).toBeGreaterThan(0);
    expect(stats.rowCounts.close + stats.rowCounts.ranged + stats.rowCounts.siege).toBeGreaterThan(0);
  });

  it("catches too few battlefield cards and too many specials", () => {
    const deck = {
      ...currentNorthernRealmsDeckPreset,
      mainDeck: [
        { sourceId: "neutral.decoy", count: 3 },
        { sourceId: "neutral.commanders-horn", count: 3 },
        { sourceId: "neutral.scorch", count: 3 },
        { sourceId: "neutral.biting-frost", count: 3 },
      ],
    };
    const stats = validateDeckPreset(deck);

    expect(stats.playable).toBe(false);
    expect(stats.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["too_few_battlefield_cards", "too_many_specials"]),
    );
  });

  it("catches over-limit and wrong-faction cards", () => {
    const stats = validateDeckPreset({
      ...currentNorthernRealmsDeckPreset,
      mainDeck: [
        ...currentNorthernRealmsDeckPreset.mainDeck,
        { sourceId: "neutral.geralt-of-rivia", count: 2 },
        { sourceId: "nilfgaard.letho-of-gulet", count: 1 },
      ],
    });

    expect(stats.playable).toBe(false);
    expect(stats.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["deck_limit_exceeded", "wrong_faction_card", "duplicate_deck_entry"]),
    );
  });

  it("reports non-implemented card and leader abilities as warnings", () => {
    const plannedCard = currentCatalogCards.find((card) => card.abilities.includes("avenger"));
    const placeholderLeader = currentCatalogLeaders.find((leader) => leader.ability === "play_fog");
    expect(plannedCard).toBeDefined();
    expect(placeholderLeader).toBeDefined();

    const stats = validateDeckPreset({
      ...currentNorthernRealmsDeckPreset,
      leaderSourceId: placeholderLeader!.sourceId,
      mainDeck: [...currentNorthernRealmsDeckPreset.mainDeck, { sourceId: plannedCard!.sourceId, count: 1 }],
    });

    expect(stats.issues.filter((issue) => issue.severity === "error")).toHaveLength(0);
    expect(stats.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["card_ability_not_implemented", "leader_ability_not_implemented"]),
    );
  });

  it("keeps current Nilfgaard playable even with placeholder leader warning", () => {
    const stats = validateDeckPreset(currentNilfgaardDeckPreset);

    expect(stats.playable).toBe(true);
    expect(stats.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ severity: "warning", code: "leader_ability_not_implemented" }),
      ]),
    );
  });
});
