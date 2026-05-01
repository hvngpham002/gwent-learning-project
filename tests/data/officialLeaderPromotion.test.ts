import { describe, expect, it } from "vitest";

import {
  currentCatalogLeaders,
  game8OfficialLeaderCandidates,
  monstersCatalogLeaders,
  nilfgaardCatalogLeaders,
  northernRealmsCatalogLeaders,
  officialLeaderPromotionManifest,
  scoiataelCatalogLeaders,
  skelligeCatalogLeaders,
} from "@/data/catalog";
import {
  CATALOG_LEADER_ABILITY_METADATA,
  validateLeaderSources,
} from "@/game/catalog";
import { game8PublicImagePaths } from "@/data/catalog/official/game8PublicImagePaths";

describe("official leader promotion (cBp5)", () => {
  it("validates the permanent leader catalog with 22 records and 5/5/5/5/2 by faction", () => {
    expect(validateLeaderSources(currentCatalogLeaders).errors).toEqual([]);
    expect(currentCatalogLeaders).toHaveLength(22);
    expect(northernRealmsCatalogLeaders).toHaveLength(5);
    expect(nilfgaardCatalogLeaders).toHaveLength(5);
    expect(monstersCatalogLeaders).toHaveLength(5);
    expect(scoiataelCatalogLeaders).toHaveLength(5);
    expect(skelligeCatalogLeaders).toHaveLength(2);
  });

  it("preserves the existing Northern Realms and Nilfgaard leader source IDs", () => {
    const ids = new Set(currentCatalogLeaders.map((leader) => leader.sourceId));
    [
      "northern-realms.foltest-king-of-temeria",
      "northern-realms.foltest-lord-commander-of-the-north",
      "northern-realms.foltest-son-of-medell",
      "northern-realms.foltest-the-siegemaster",
      "northern-realms.foltest-the-steel-forged",
      "nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard",
      "nilfgaard.emhyr-var-emreis-the-white-flame",
      "nilfgaard.emhyr-var-emreis-the-relentless",
      "nilfgaard.emhyr-var-emreis-his-imperial-majesty",
      "nilfgaard.emhyr-var-emreis-invader-of-the-north",
    ].forEach((id) => expect(ids.has(id)).toBe(true));
  });

  it("represents every official leader candidate with a permanent catalog leader", () => {
    const present = new Set(currentCatalogLeaders.map((leader) => leader.sourceId));
    expect(game8OfficialLeaderCandidates.length).toBeGreaterThan(0);
    game8OfficialLeaderCandidates.forEach((candidate) => {
      const matchedId = candidate.matchedCurrentSourceId ?? candidate.sourceId;
      expect(present.has(matchedId)).toBe(true);
    });
  });

  it("uses existing public image paths for every promoted official leader", () => {
    const publicImagePathSet = new Set<string>(game8PublicImagePaths);

    currentCatalogLeaders.forEach((leader) => {
      expect(publicImagePathSet.has(leader.image), leader.sourceId).toBe(true);
    });
  });

  it("registers placeholder metadata for newly added leader ability IDs that remain placeholder after cCp16", () => {
    [
      "double_close",
      "discard_two_draw_one_from_deck",
      "restore_discard_to_hand",
      "double_spies",
      "optimize_agile_rows",
      "double_ranged",
      "draw_extra_card",
      "shuffle_discards_into_decks",
    ].forEach((ability) => {
      const metadata =
        CATALOG_LEADER_ABILITY_METADATA[ability as keyof typeof CATALOG_LEADER_ABILITY_METADATA];
      expect(metadata).toBeDefined();
      expect(metadata.status).toBe("placeholder");
      expect(metadata.name.length).toBeGreaterThan(0);
      expect(metadata.description.length).toBeGreaterThan(0);
    });
  });

  it("registers implemented metadata for clear_weather, the cCp14 weather-pulling abilities, cCp15 weather_half_penalty, and cCp16 row-Scorch abilities", () => {
    [
      "clear_weather",
      "play_frost",
      "play_fog",
      "play_rain",
      "play_any_weather",
      "weather_half_penalty",
      "scorch_range",
      "scorch_siege",
    ].forEach((ability) => {
      const metadata =
        CATALOG_LEADER_ABILITY_METADATA[ability as keyof typeof CATALOG_LEADER_ABILITY_METADATA];
      expect(metadata).toBeDefined();
      expect(metadata.status).toBe("implemented");
    });
  });

  it("active executable, passive implemented, and combined implemented leaders match expected sets", () => {
    const implementedLeaders = currentCatalogLeaders.filter(
      (leader) => CATALOG_LEADER_ABILITY_METADATA[leader.ability].status === "implemented",
    );
    expect(implementedLeaders.map((leader) => leader.sourceId).sort()).toEqual(
      [
        "monsters.eredin-king-of-the-wild-hunt",
        "nilfgaard.emhyr-var-emreis-his-imperial-majesty",
        "northern-realms.foltest-king-of-temeria",
        "northern-realms.foltest-lord-commander-of-the-north",
        "northern-realms.foltest-son-of-medell",
        "northern-realms.foltest-the-steel-forged",
        "scoiatael.francesca-findabair-pureblood-elf",
        "skellige.king-bran",
      ].sort(),
    );
  });

  it("matches the manifest counts and source ID groups", () => {
    expect(officialLeaderPromotionManifest.officialLeaderCandidateCount).toBe(22);
    expect(officialLeaderPromotionManifest.promotedLeaderSourceCount).toBe(22);
    expect(officialLeaderPromotionManifest.preservedCurrentLeaderSourceIds).toHaveLength(10);
    expect(officialLeaderPromotionManifest.addedLeaderSourceIds).toHaveLength(12);
    expect(officialLeaderPromotionManifest.promotedLeaderSourceIds).toHaveLength(22);
    expect(officialLeaderPromotionManifest.countsByFaction).toEqual({
      northern_realms: 5,
      nilfgaard: 5,
      monsters: 5,
      scoiatael: 5,
      skellige: 2,
    });
    expect([...officialLeaderPromotionManifest.executableLeaderSourceIds].sort()).toEqual(
      [
        "monsters.eredin-king-of-the-wild-hunt",
        "nilfgaard.emhyr-var-emreis-his-imperial-majesty",
        "northern-realms.foltest-king-of-temeria",
        "northern-realms.foltest-lord-commander-of-the-north",
        "northern-realms.foltest-son-of-medell",
        "northern-realms.foltest-the-steel-forged",
        "scoiatael.francesca-findabair-pureblood-elf",
      ].sort(),
    );
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).not.toContain(
      "skellige.king-bran",
    );
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toContain(
      "northern-realms.foltest-son-of-medell",
    );
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toContain(
      "northern-realms.foltest-the-steel-forged",
    );
    expect([...officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds].sort()).toEqual([
      "skellige.king-bran",
    ]);
    expect([...officialLeaderPromotionManifest.implementedLeaderSourceIds].sort()).toEqual(
      [
        "monsters.eredin-king-of-the-wild-hunt",
        "nilfgaard.emhyr-var-emreis-his-imperial-majesty",
        "northern-realms.foltest-king-of-temeria",
        "northern-realms.foltest-lord-commander-of-the-north",
        "northern-realms.foltest-son-of-medell",
        "northern-realms.foltest-the-steel-forged",
        "scoiatael.francesca-findabair-pureblood-elf",
        "skellige.king-bran",
      ].sort(),
    );
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).toEqual(
      expect.arrayContaining([
        "double_close",
        "discard_two_draw_one_from_deck",
        "restore_discard_to_hand",
        "double_spies",
        "optimize_agile_rows",
        "double_ranged",
        "draw_extra_card",
        "shuffle_discards_into_decks",
      ]),
    );
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain("play_any_weather");
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain(
      "weather_half_penalty",
    );
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain("scorch_range");
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain("scorch_siege");
  });

  it("manifest source IDs are all present in currentCatalogLeaders", () => {
    const present = new Set(currentCatalogLeaders.map((leader) => leader.sourceId));
    officialLeaderPromotionManifest.promotedLeaderSourceIds.forEach((id) => {
      expect(present.has(id)).toBe(true);
    });
    officialLeaderPromotionManifest.addedLeaderSourceIds.forEach((id) => {
      expect(present.has(id)).toBe(true);
    });
  });
});
