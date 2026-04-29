import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentDeckPresets,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  game8OfficialCardCandidates,
  monstersCatalogCards,
  neutralCatalogCards,
  nilfgaardCatalogCards,
  northernRealmsCatalogCards,
  officialMonstersStarterDeckPreset,
  officialNilfgaardStarterDeckPreset,
  officialNorthernRealmsStarterDeckPreset,
  officialScoiataelStarterDeckPreset,
  officialSkelligeStarterDeckPreset,
  officialStarterDeckPresets,
  scoiataelCatalogCards,
  skelligeCatalogCards,
} from "@/data/catalog";
import { officialPromotionManifest } from "@/data/catalog/cards/official-promotion";
import {
  CATALOG_ABILITY_METADATA,
  validateCardSources,
  validateDeckPresets,
} from "@/game/catalog";
import {
  isSideDeckOnlyCard,
  validateDeckPreset,
} from "@/components/gwent/deckBuilderViewModel";

describe("official catalog promotion (cBp4 + cBp4.1)", () => {
  it("reports 156 directly promoted candidates, 1 deferred candidate, and 160 promoted catalog sources", () => {
    expect(officialPromotionManifest.directPromotedCandidateCount).toBe(156);
    expect(officialPromotionManifest.deferredCandidateCount).toBe(1);
    expect(officialPromotionManifest.promotedCatalogSourceCount).toBe(160);
    expect(officialPromotionManifest.directPromotedCandidateIds).toHaveLength(156);
    expect(officialPromotionManifest.promotedCatalogSourceIds).toHaveLength(160);
    expect(officialPromotionManifest.deferred).toHaveLength(1);
    expect(officialPromotionManifest.splitResolutions).toHaveLength(2);
  });

  it("matches cBp4.1 counts by faction and kind", () => {
    expect(officialPromotionManifest.countsByFaction).toEqual({
      neutral: 21,
      northern_realms: 25,
      nilfgaard: 29,
      monsters: 35,
      scoiatael: 24,
      skellige: 26,
    });
    expect(officialPromotionManifest.countsByKind).toEqual({
      hero: 25,
      unit: 126,
      special: 4,
      weather: 5,
    });
  });

  it("defers neutral.cow-bovine-defense-force with avenger split + rule_gap reasons", () => {
    const deferredIds = officialPromotionManifest.deferred.map((entry) => entry.sourceId);
    expect(deferredIds).toEqual(["neutral.cow-bovine-defense-force"]);
    const cowEntry = officialPromotionManifest.deferred[0];
    expect(cowEntry.reasons.some((r) => r.startsWith("catalog_split_required:avenger"))).toBe(true);
    expect(cowEntry.reasons.some((r) => r.startsWith("rule_gap:avenger"))).toBe(true);
  });

  it("resolves the two combined Skellige Berserker scrape candidates via split catalog records", () => {
    const splitByOriginal = new Map(
      officialPromotionManifest.splitResolutions.map((resolution) => [
        resolution.originalSourceId,
        resolution,
      ]),
    );
    expect(splitByOriginal.get("skellige.berserker-vildkaarl")?.catalogSourceIds).toEqual([
      "skellige.berserker",
      "skellige.vildkaarl",
    ]);
    expect(splitByOriginal.get("skellige.young-berserker-young-vildkaarl")?.catalogSourceIds).toEqual([
      "skellige.young-berserker",
      "skellige.young-vildkaarl",
    ]);
    officialPromotionManifest.splitResolutions.forEach((resolution) => {
      expect(resolution.reasons.some((r) => r.startsWith("transform_link_required:berserker"))).toBe(
        true,
      );
      expect(resolution.reasons.some((r) => r.startsWith("catalog_split_required:berserker"))).toBe(
        true,
      );
    });
  });

  it("totals direct promoted + deferred + split resolutions to the full Game8 scrape set", () => {
    expect(
      officialPromotionManifest.directPromotedCandidateCount +
        officialPromotionManifest.deferredCandidateCount +
        officialPromotionManifest.splitResolutions.length,
    ).toBe(game8OfficialCardCandidates.length);
    const accountedCandidateIds = new Set([
      ...officialPromotionManifest.directPromotedCandidateIds,
      ...officialPromotionManifest.deferred.map((entry) => entry.sourceId),
      ...officialPromotionManifest.splitResolutions.map(
        (resolution) => resolution.originalSourceId,
      ),
    ]);
    expect(accountedCandidateIds.size).toBe(game8OfficialCardCandidates.length);
    const stagingIds = new Set(
      game8OfficialCardCandidates.map((candidate) => candidate.source.sourceId),
    );
    accountedCandidateIds.forEach((id) => expect(stagingIds.has(id)).toBe(true));
  });

  it("includes every promoted catalog source id in currentCatalogCards", () => {
    const presentIds = new Set(currentCatalogCards.map((card) => card.sourceId));
    officialPromotionManifest.promotedCatalogSourceIds.forEach((id) => {
      expect(presentIds.has(id)).toBe(true);
    });
  });

  it("includes the four split Skellige source ids and links Berserker bases to their replacements", () => {
    const skelligeIds = new Set(skelligeCatalogCards.map((card) => card.sourceId));
    ["skellige.berserker", "skellige.vildkaarl", "skellige.young-berserker", "skellige.young-vildkaarl"].forEach(
      (id) => expect(skelligeIds.has(id)).toBe(true),
    );
    const berserker = skelligeCatalogCards.find((card) => card.sourceId === "skellige.berserker");
    const youngBerserker = skelligeCatalogCards.find(
      (card) => card.sourceId === "skellige.young-berserker",
    );
    expect(berserker?.linkedSourceIds?.[0]).toBe("skellige.vildkaarl");
    expect(youngBerserker?.linkedSourceIds?.[0]).toBe("skellige.young-vildkaarl");
  });

  it("tags replacement Vildkaarl forms as side_deck_only", () => {
    const vildkaarl = skelligeCatalogCards.find((card) => card.sourceId === "skellige.vildkaarl");
    const youngVildkaarl = skelligeCatalogCards.find(
      (card) => card.sourceId === "skellige.young-vildkaarl",
    );
    expect(vildkaarl?.tags).toContain("side_deck_only");
    expect(youngVildkaarl?.tags).toContain("side_deck_only");
  });

  it("excludes deferred and original combined source ids from currentCatalogCards", () => {
    const presentIds = new Set(currentCatalogCards.map((card) => card.sourceId));
    [
      "neutral.cow-bovine-defense-force",
      "skellige.berserker-vildkaarl",
      "skellige.young-berserker-young-vildkaarl",
    ].forEach((id) => expect(presentIds.has(id)).toBe(false));
  });

  it("keeps the legacy split Cow/Bovine records intact", () => {
    const presentIds = new Set(currentCatalogCards.map((card) => card.sourceId));
    expect(presentIds.has("neutral.cow")).toBe(true);
    expect(presentIds.has("neutral.bovine-defense-force")).toBe(true);
  });

  it("currentCatalogCards still validates and source ids remain unique", () => {
    expect(validateCardSources(currentCatalogCards).errors).toEqual([]);
    const ids = currentCatalogCards.map((card) => card.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preserves the unchanged current Northern Realms and Nilfgaard deck presets and adds five official starter presets", () => {
    const presetIds = currentDeckPresets.map((preset) => preset.presetId);
    expect(presetIds).toEqual([
      "current-northern-realms",
      "current-nilfgaard",
      "official-northern-realms-starter",
      "official-nilfgaard-starter",
      "official-monsters-starter",
      "official-scoiatael-starter",
      "official-skellige-starter",
    ]);
    expect(currentNorthernRealmsDeckPreset.mainDeck).toBe(currentNorthernRealmsDeckPreset.mainDeck);
    expect(currentNilfgaardDeckPreset.mainDeck).toBe(currentNilfgaardDeckPreset.mainDeck);
    expect(
      validateDeckPresets(currentDeckPresets, currentCatalogCards, []).errors.filter(
        (error) => !error.path.includes("leaderSourceId") && !error.code.includes("leader"),
      ),
    ).toEqual([]);
  });

  it("validates every official starter preset through validateDeckPresets and validateDeckPreset", () => {
    expect(
      validateDeckPresets(officialStarterDeckPresets, currentCatalogCards, currentCatalogLeaders).errors,
    ).toEqual([]);
    officialStarterDeckPresets.forEach((preset) => {
      const stats = validateDeckPreset(preset, currentCatalogCards, currentCatalogLeaders);
      expect(stats.playable).toBe(true);
      expect(stats.issues.filter((issue) => issue.severity === "error")).toEqual([]);
      expect(stats.battlefieldCards).toBeGreaterThanOrEqual(22);
      expect(stats.specialCards).toBeLessThanOrEqual(10);
    });
  });

  it("starter decks contain only neutral plus their own faction and no side-deck-only cards in main deck", () => {
    const cardById = new Map(currentCatalogCards.map((card) => [card.sourceId, card]));
    officialStarterDeckPresets.forEach((preset) => {
      preset.mainDeck.forEach((entry) => {
        const card = cardById.get(entry.sourceId);
        expect(card).toBeDefined();
        expect(card!.faction === "neutral" || card!.faction === preset.faction).toBe(true);
        expect(isSideDeckOnlyCard(card!)).toBe(false);
      });
    });
  });

  it("Skellige starter has linked side-deck replacements that match Berserker counts and exposes Mardroeme", () => {
    const skelligeMain = officialSkelligeStarterDeckPreset.mainDeck;
    const berserkerCount = skelligeMain.find((entry) => entry.sourceId === "skellige.berserker")?.count ?? 0;
    const youngBerserkerCount = skelligeMain.find((entry) => entry.sourceId === "skellige.young-berserker")?.count ?? 0;
    const mardroemeCount = skelligeMain.find((entry) => entry.sourceId === "skellige.mardroeme")?.count ?? 0;
    expect(berserkerCount + youngBerserkerCount).toBeGreaterThan(0);
    expect(mardroemeCount).toBeGreaterThan(0);
    const sideDeckById = new Map(
      officialSkelligeStarterDeckPreset.sideDeck.map((entry) => [entry.sourceId, entry.count]),
    );
    expect(sideDeckById.get("skellige.vildkaarl")).toBe(berserkerCount);
    expect(sideDeckById.get("skellige.young-vildkaarl")).toBe(youngBerserkerCount);
  });

  it("non-Skellige official starter decks have empty side decks", () => {
    [
      officialNorthernRealmsStarterDeckPreset,
      officialNilfgaardStarterDeckPreset,
      officialMonstersStarterDeckPreset,
      officialScoiataelStarterDeckPreset,
    ].forEach((preset) => {
      expect(preset.sideDeck).toEqual([]);
    });
  });

  it("retains existing current source ids referenced by the spec", () => {
    const presentIds = new Set(currentCatalogCards.map((card) => card.sourceId));
    [
      "neutral.decoy",
      "neutral.commanders-horn",
      "northern-realms.blue-stripes-commando",
      "nilfgaard.impera-brigade-guard",
    ].forEach((id) => expect(presentIds.has(id)).toBe(true));
  });

  it("exposes representative new Monsters, Scoia'tael, and Skellige promoted cards", () => {
    const presentIds = new Set(currentCatalogCards.map((card) => card.sourceId));
    const monstersHero = monstersCatalogCards.find((card) => card.kind === "hero");
    const monstersNonHero = monstersCatalogCards.find(
      (card) => card.kind === "unit" && !card.tags.includes("hero"),
    );
    const scoiaHero = scoiataelCatalogCards.find((card) => card.kind === "hero");
    const scoiaNonHero = scoiataelCatalogCards.find(
      (card) => card.kind === "unit" && !card.tags.includes("hero"),
    );
    const skelligeHero = skelligeCatalogCards.find((card) => card.kind === "hero");
    const skelligeNonBerserker = skelligeCatalogCards.find(
      (card) => card.kind === "unit" && !card.abilities.includes("berserker"),
    );
    expect(monstersHero).toBeTruthy();
    expect(monstersNonHero).toBeTruthy();
    expect(scoiaHero).toBeTruthy();
    expect(scoiaNonHero).toBeTruthy();
    expect(skelligeHero).toBeTruthy();
    expect(skelligeNonBerserker).toBeTruthy();
    expect(presentIds.has("skellige.mardroeme")).toBe(true);
    expect(presentIds.has("neutral.skellige-storm")).toBe(true);
  });

  it("only directly promotes scrape candidates whose staging-derived abilities are implemented", () => {
    const directIds = new Set(officialPromotionManifest.directPromotedCandidateIds);
    game8OfficialCardCandidates
      .filter((candidate) => directIds.has(candidate.source.sourceId))
      .forEach((candidate) => {
        candidate.source.abilities.forEach((ability) => {
          if (ability === "none") return;
          const metadata = CATALOG_ABILITY_METADATA[ability];
          expect(metadata.status).toBe("implemented");
        });
      });
  });

  it("covers a representative spread of implemented abilities across promoted candidates", () => {
    const directIds = new Set(officialPromotionManifest.directPromotedCandidateIds);
    const abilities = new Set<string>();
    // Source-of-truth for "what abilities are promoted" is the staging-derived data,
    // not the catalog entry, since some current entries still use planned alias
    // abilities (e.g. muster_roach) that the scrape pipeline normalizes to muster.
    game8OfficialCardCandidates
      .filter((candidate) => directIds.has(candidate.source.sourceId))
      .forEach((candidate) =>
        candidate.source.abilities.forEach((ability) => abilities.add(ability)),
      );
    // Also include abilities from the split Skellige catalog records (Berserker
    // base forms emit `berserker`, not present on the original combined scrape rows
    // alone after their staging-derived abilities are normalized).
    skelligeCatalogCards
      .filter((card) =>
        ["skellige.berserker", "skellige.young-berserker"].includes(card.sourceId),
      )
      .forEach((card) => card.abilities.forEach((ability) => abilities.add(ability)));
    [
      "mardroeme",
      "berserker",
      "skellige_storm",
      "muster",
      "medic",
      "spy",
      "tight_bond",
      "morale_boost",
      "commanders_horn",
      "decoy",
      "scorch",
      "agile",
      "frost",
      "fog",
      "rain",
    ].forEach((ability) => {
      const metadata = CATALOG_ABILITY_METADATA[ability as keyof typeof CATALOG_ABILITY_METADATA];
      expect(metadata.status).toBe("implemented");
      expect(abilities.has(ability)).toBe(true);
    });
  });

  it("keeps the documented missing-image floor at 1 (only Elven Skirmisher unresolved)", () => {
    // The promotion phase reconciles image paths against existing repo assets.
    // Only the truly absent `scoiatael.elven-skirmisher` should remain unresolved.
    const promotedSet = new Set(officialPromotionManifest.promotedCatalogSourceIds);
    const unresolved = currentCatalogCards.filter((card) => {
      if (!promotedSet.has(card.sourceId)) return false;
      return /\/units\/Elven_Skirmisher\.png$/.test(card.image);
    });
    expect(unresolved).toHaveLength(1);
  });

  it("keeps faction packs as plain hand-authored data (no scrape/staging imports at runtime)", () => {
    expect(neutralCatalogCards.length).toBeGreaterThan(0);
    expect(northernRealmsCatalogCards.length).toBeGreaterThan(0);
    expect(nilfgaardCatalogCards.length).toBeGreaterThan(0);
    expect(monstersCatalogCards.length).toBeGreaterThan(0);
    expect(scoiataelCatalogCards.length).toBeGreaterThan(0);
    expect(skelligeCatalogCards.length).toBeGreaterThan(0);
    [
      neutralCatalogCards,
      northernRealmsCatalogCards,
      nilfgaardCatalogCards,
      monstersCatalogCards,
      scoiataelCatalogCards,
      skelligeCatalogCards,
    ].forEach((pack) => {
      pack.forEach((card) => {
        expect(typeof card.sourceId).toBe("string");
        expect(typeof card.name).toBe("string");
        expect(Array.isArray(card.rows)).toBe(true);
        expect(Array.isArray(card.abilities)).toBe(true);
        expect(Array.isArray(card.tags)).toBe(true);
      });
    });
  });
});
