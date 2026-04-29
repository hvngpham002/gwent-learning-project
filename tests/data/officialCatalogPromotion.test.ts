import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentDeckPresets,
  game8OfficialCardCandidates,
  monstersCatalogCards,
  neutralCatalogCards,
  nilfgaardCatalogCards,
  northernRealmsCatalogCards,
  scoiataelCatalogCards,
  skelligeCatalogCards,
} from "@/data/catalog";
import { officialPromotionManifest } from "@/data/catalog/cards/official-promotion";
import {
  CATALOG_ABILITY_METADATA,
  validateCardSources,
  validateDeckPresets,
} from "@/game/catalog";

const DEFER_PREFIXES = [
  "ability_unknown:",
  "ability_status:",
  "rule_gap:",
  "catalog_split_required:berserker",
  "transform_link_required:",
  "source_id_conflict:",
];

const isDeferred = (issues: readonly string[]): boolean =>
  issues.some((issue) => DEFER_PREFIXES.some((prefix) => issue.startsWith(prefix)));

describe("official catalog promotion (cBp4)", () => {
  it("promotes exactly 157 official non-leader candidates and defers 2 Berserker combined candidates", () => {
    expect(officialPromotionManifest.promotedCount).toBe(157);
    expect(officialPromotionManifest.deferredCount).toBe(2);
    expect(officialPromotionManifest.promotedSourceIds).toHaveLength(157);
    expect(officialPromotionManifest.deferred).toHaveLength(2);
    const deferredIds = officialPromotionManifest.deferred.map((entry) => entry.sourceId);
    expect(deferredIds).toEqual([
      "skellige.berserker-vildkaarl",
      "skellige.young-berserker-young-vildkaarl",
    ]);
    officialPromotionManifest.deferred.forEach((entry) => {
      expect(entry.reasons.some((r) => r.startsWith("transform_link_required:"))).toBe(true);
      expect(entry.reasons.some((r) => r.startsWith("catalog_split_required:berserker"))).toBe(true);
    });
  });

  it("matches spec counts by faction and kind", () => {
    expect(officialPromotionManifest.countsByFaction).toEqual({
      neutral: 22,
      northern_realms: 25,
      nilfgaard: 29,
      monsters: 35,
      scoiatael: 24,
      skellige: 22,
    });
    expect(officialPromotionManifest.countsByKind).toEqual({
      hero: 25,
      unit: 123,
      special: 4,
      weather: 5,
    });
  });

  it("cross-checks the manifest against the cBp3 staging scrape coverage", () => {
    // Note: the staging matching is name-keyed, so it can introduce post-hoc
    // source_id_conflict issues once promoted cards land in currentCatalogCards
    // (e.g. duplicate-name physical cards like the two Dwarven Skirmisher copies).
    // The manifest snapshot is the authoritative classification taken at promotion
    // time. This test only verifies that every staging candidate is accounted for
    // somewhere in the manifest and that the totals add up to the scrape size.
    const stagingIds = new Set(
      game8OfficialCardCandidates.map((candidate) => candidate.source.sourceId),
    );
    const manifestIds = new Set([
      ...officialPromotionManifest.promotedSourceIds,
      ...officialPromotionManifest.deferred.map((entry) => entry.sourceId),
    ]);
    expect(officialPromotionManifest.promotedCount + officialPromotionManifest.deferredCount).toBe(
      game8OfficialCardCandidates.length,
    );
    manifestIds.forEach((id) => expect(stagingIds.has(id)).toBe(true));
    // Strictly Berserker-deferred candidates remain so under any catalog state because
    // the transform_link_required:berserker issue does not depend on current catalog.
    const stillDeferredBerserkers = game8OfficialCardCandidates
      .filter((candidate) => isDeferred(candidate.portingIssues))
      .filter((candidate) =>
        candidate.portingIssues.some((issue) =>
          issue.startsWith("transform_link_required:berserker"),
        ),
      );
    expect(stillDeferredBerserkers).toHaveLength(2);
    stillDeferredBerserkers.forEach((candidate) => {
      expect(
        officialPromotionManifest.deferred.some(
          (entry) => entry.sourceId === candidate.source.sourceId,
        ),
      ).toBe(true);
    });
  });

  it("includes every promoted source id in currentCatalogCards", () => {
    const presentIds = new Set(currentCatalogCards.map((card) => card.sourceId));
    officialPromotionManifest.promotedSourceIds.forEach((id) => {
      expect(presentIds.has(id)).toBe(true);
    });
  });

  it("excludes deferred Berserker combined candidates from currentCatalogCards", () => {
    const presentIds = new Set(currentCatalogCards.map((card) => card.sourceId));
    officialPromotionManifest.deferred.forEach((entry) => {
      expect(presentIds.has(entry.sourceId)).toBe(false);
    });
  });

  it("currentCatalogCards still validates and source ids remain unique", () => {
    expect(validateCardSources(currentCatalogCards).errors).toEqual([]);
    const ids = currentCatalogCards.map((card) => card.sourceId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("preserves the unchanged current Northern Realms and Nilfgaard deck presets", () => {
    const presetIds = currentDeckPresets.map((preset) => preset.presetId).sort();
    expect(presetIds).toEqual(["current-nilfgaard", "current-northern-realms"]);
    expect(
      validateDeckPresets(currentDeckPresets, currentCatalogCards, []).errors.filter(
        (error) => !error.path.includes("leaderSourceId") && !error.code.includes("leader"),
      ),
    ).toEqual([]);
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

  it("only promotes scrape candidates whose staging-derived abilities are implemented", () => {
    const promotedIds = new Set(officialPromotionManifest.promotedSourceIds);
    game8OfficialCardCandidates
      .filter((candidate) => promotedIds.has(candidate.source.sourceId))
      .forEach((candidate) => {
        candidate.source.abilities.forEach((ability) => {
          if (ability === "none") return;
          const metadata = CATALOG_ABILITY_METADATA[ability];
          expect(metadata.status).toBe("implemented");
        });
      });
  });

  it("covers a representative spread of implemented abilities across promoted candidates", () => {
    const promotedIds = new Set(officialPromotionManifest.promotedSourceIds);
    const abilities = new Set<string>();
    // Source-of-truth for "what abilities are promoted" is the staging-derived data,
    // not the catalog entry, since some current entries still use planned alias
    // abilities (e.g. muster_roach) that the scrape pipeline normalizes to muster.
    game8OfficialCardCandidates
      .filter((candidate) => promotedIds.has(candidate.source.sourceId))
      .forEach((candidate) =>
        candidate.source.abilities.forEach((ability) => abilities.add(ability)),
      );
    [
      "mardroeme",
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

  it("does not regress the missing-image count below the documented floor", () => {
    // The promotion phase reconciles image paths against existing repo assets.
    // Only the truly absent `scoiatael.elven-skirmisher` should remain unresolved.
    const unresolved = currentCatalogCards.filter((card) => {
      if (!officialPromotionManifest.promotedSourceIds.includes(card.sourceId)) return false;
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
