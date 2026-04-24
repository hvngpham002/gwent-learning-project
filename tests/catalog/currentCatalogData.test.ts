import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentDeckPresets,
  monstersCatalogCards,
  monstersCatalogLeaders,
  neutralCatalogCards,
  nilfgaardCatalogCards,
  nilfgaardCatalogLeaders,
  northernRealmsCatalogCards,
  northernRealmsCatalogLeaders,
  resolveCatalogDeckPreset,
  scoiataelCatalogCards,
  scoiataelCatalogLeaders,
  skelligeCatalogCards,
  skelligeCatalogLeaders,
} from "@/data/catalog";
import { neutralDeck } from "@/data/cards/neutral";
import { nilfgaardianEmpireDeck } from "@/data/cards/nilfgaardian-empire";
import { northernRealmsDeck } from "@/data/cards/northern-realms";
import { validateCardSources, validateCatalog, validateDeckPresets, validateLeaderSources } from "@/game/catalog";

const countPresetCards = (presetId: string) => {
  const preset = currentDeckPresets.find((candidate) => candidate.presetId === presetId);
  if (!preset) {
    throw new Error(`Missing preset ${presetId}`);
  }
  return preset.mainDeck.reduce((total, entry) => total + entry.count, 0);
};

describe("current catalog data", () => {
  it("validates all migrated card packs, leader packs, and current deck presets", () => {
    expect(validateCardSources(currentCatalogCards).errors).toEqual([]);
    expect(validateLeaderSources(currentCatalogLeaders).errors).toEqual([]);
    expect(validateDeckPresets(currentDeckPresets, currentCatalogCards, currentCatalogLeaders).errors).toEqual([]);
    expect(
      validateCatalog({
        cards: currentCatalogCards,
        leaders: currentCatalogLeaders,
        presets: currentDeckPresets,
      }).valid,
    ).toBe(true);
  });

  it("keeps source IDs unique across migrated cards and leaders", () => {
    const cardIds = currentCatalogCards.map((card) => card.sourceId);
    const leaderIds = currentCatalogLeaders.map((leader) => leader.sourceId);

    expect(new Set(cardIds).size).toBe(cardIds.length);
    expect(new Set(leaderIds).size).toBe(leaderIds.length);
  });

  it("resolves deck presets to catalog card and leader records", () => {
    currentDeckPresets.forEach((preset) => {
      const resolved = resolveCatalogDeckPreset(preset);

      expect(resolved.leader.sourceId).toBe(preset.leaderSourceId);
      expect(resolved.mainDeck).toHaveLength(preset.mainDeck.length);
      expect(resolved.sideDeck).toHaveLength(preset.sideDeck.length);
    });
  });

  it("keeps future faction placeholder packs intentionally inert and valid", () => {
    expect(monstersCatalogCards).toEqual([]);
    expect(scoiataelCatalogCards).toEqual([]);
    expect(skelligeCatalogCards).toEqual([]);
    expect(monstersCatalogLeaders).toEqual([]);
    expect(scoiataelCatalogLeaders).toEqual([]);
    expect(skelligeCatalogLeaders).toEqual([]);
    expect(validateCardSources([...monstersCatalogCards, ...scoiataelCatalogCards, ...skelligeCatalogCards]).valid).toBe(true);
    expect(validateLeaderSources([...monstersCatalogLeaders, ...scoiataelCatalogLeaders, ...skelligeCatalogLeaders]).valid).toBe(true);
  });

  it("matches migrated pack counts to legacy source modules", () => {
    expect(neutralCatalogCards).toHaveLength(
      neutralDeck.heroes.length + neutralDeck.units.length + neutralDeck.specials.length,
    );
    expect(northernRealmsCatalogCards).toHaveLength(
      northernRealmsDeck.heroes.length + northernRealmsDeck.units.length,
    );
    expect(northernRealmsCatalogLeaders).toHaveLength(northernRealmsDeck.leaders.length);
    expect(nilfgaardCatalogCards).toHaveLength(
      nilfgaardianEmpireDeck.heroes.length + nilfgaardianEmpireDeck.units.length,
    );
    expect(nilfgaardCatalogLeaders).toHaveLength(nilfgaardianEmpireDeck.leaders.length);
  });

  it("mirrors current default deck assembly counts without switching gameplay to catalog data", () => {
    expect(countPresetCards("current-northern-realms")).toBe(35);
    expect(countPresetCards("current-nilfgaard")).toBe(33);
    expect(currentDeckPresets.every((preset) => preset.sideDeck.length === 0)).toBe(true);
  });
});
