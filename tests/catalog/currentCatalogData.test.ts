import { existsSync } from "node:fs";
import { join } from "node:path";

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

  it("uses the available Heavy Zerrikanian Fire Scorpion image asset", () => {
    expect(
      currentCatalogCards.find((card) => card.sourceId === "nilfgaard.heavy-zerrikanian-fire-scorpion")?.image,
    ).toBe("/images/nilfgaard/heavy_zerrikanian_fire_scorpion.png");
  });

  it("points every current card and leader image at a committed public asset", () => {
    [...currentCatalogCards, ...currentCatalogLeaders].forEach((source) => {
      const publicPath = join(process.cwd(), "public", source.image.replace(/^\//, ""));
      expect(existsSync(publicPath), source.sourceId).toBe(true);
    });
  });

  it("populates Monsters, Scoia'tael, and Skellige card packs after cBp4 promotion and leader packs after cBp5", () => {
    expect(monstersCatalogCards.length).toBeGreaterThan(0);
    expect(scoiataelCatalogCards.length).toBeGreaterThan(0);
    expect(skelligeCatalogCards.length).toBeGreaterThan(0);
    expect(monstersCatalogLeaders).toHaveLength(5);
    expect(scoiataelCatalogLeaders).toHaveLength(5);
    expect(skelligeCatalogLeaders).toHaveLength(2);
    expect(validateCardSources([...monstersCatalogCards, ...scoiataelCatalogCards, ...skelligeCatalogCards]).valid).toBe(true);
    expect(validateLeaderSources([...monstersCatalogLeaders, ...scoiataelCatalogLeaders, ...skelligeCatalogLeaders]).valid).toBe(true);
  });

  it("preserves legacy source-module counts as a floor for migrated packs", () => {
    expect(neutralCatalogCards.length).toBeGreaterThanOrEqual(
      neutralDeck.heroes.length + neutralDeck.units.length + neutralDeck.specials.length,
    );
    expect(northernRealmsCatalogCards.length).toBeGreaterThanOrEqual(
      northernRealmsDeck.heroes.length + northernRealmsDeck.units.length,
    );
    expect(northernRealmsCatalogLeaders).toHaveLength(northernRealmsDeck.leaders.length);
    expect(nilfgaardCatalogCards.length).toBeGreaterThanOrEqual(
      nilfgaardianEmpireDeck.heroes.length + nilfgaardianEmpireDeck.units.length,
    );
    expect(nilfgaardCatalogLeaders).toHaveLength(nilfgaardianEmpireDeck.leaders.length);
  });

  it("mirrors current default deck assembly counts without switching gameplay to catalog data", () => {
    expect(countPresetCards("current-northern-realms")).toBe(35);
    expect(countPresetCards("current-nilfgaard")).toBe(33);
    const currentOnly = currentDeckPresets.filter((preset) =>
      preset.presetId === "current-northern-realms" || preset.presetId === "current-nilfgaard",
    );
    expect(currentOnly.every((preset) => preset.sideDeck.length === 0)).toBe(true);
  });

  describe("cCp11 catalog reconciliation", () => {
    it("links Cerys to Clan Drummond Shield Maiden via linkedSourceIds", () => {
      const cerys = currentCatalogCards.find((card) => card.sourceId === "skellige.cerys");
      expect(cerys).toBeDefined();
      expect(cerys!.kind).toBe("hero");
      expect(cerys!.rows).toEqual(["close"]);
      expect(cerys!.abilities).toEqual(["muster"]);
      expect(cerys!.linkedSourceIds).toEqual(["skellige.clan-drummond-shield-maiden"]);
    });

    it("Kayran has hero kind, close+ranged rows, and agile + morale_boost abilities", () => {
      const kayran = currentCatalogCards.find((card) => card.sourceId === "monsters.kayran");
      expect(kayran).toBeDefined();
      expect(kayran!.kind).toBe("hero");
      expect(kayran!.strength).toBe(8);
      expect(kayran!.rows).toEqual(["close", "ranged"]);
      expect(kayran!.abilities).toEqual(["agile", "morale_boost"]);
    });

    it("Toad has scorch_range ability on the ranged row", () => {
      const toad = currentCatalogCards.find((card) => card.sourceId === "monsters.toad");
      expect(toad).toBeDefined();
      expect(toad!.kind).toBe("unit");
      expect(toad!.strength).toBe(7);
      expect(toad!.rows).toEqual(["ranged"]);
      expect(toad!.abilities).toEqual(["scorch_range"]);
    });

    it("Schirru has scorch_siege ability on the siege row", () => {
      const schirru = currentCatalogCards.find((card) => card.sourceId === "scoiatael.schirru");
      expect(schirru).toBeDefined();
      expect(schirru!.abilities).toEqual(["scorch_siege"]);
      expect(schirru!.rows).toEqual(["siege"]);
      expect(schirru!.strength).toBe(8);
    });

    it("Triss Merigold is now a Close Combat hero", () => {
      const triss = currentCatalogCards.find((card) => card.sourceId === "neutral.triss-merigold");
      expect(triss).toBeDefined();
      expect(triss!.rows).toEqual(["close"]);
    });

    it("Siege Tower has no leading tab in its display name", () => {
      const siegeTower = currentCatalogCards.find(
        (card) => card.sourceId === "northern-realms.siege-tower",
      );
      expect(siegeTower).toBeDefined();
      expect(siegeTower!.name).toBe("Siege Tower");
      expect(siegeTower!.name.startsWith("\t")).toBe(false);
    });

    it("Kambi/Hemdall split exists as separate sources", () => {
      const kambi = currentCatalogCards.find((card) => card.sourceId === "skellige.kambi");
      const hemdall = currentCatalogCards.find((card) => card.sourceId === "skellige.hemdall");
      const combined = currentCatalogCards.find(
        (card) => card.sourceId === "skellige.kambi-hemdall",
      );

      expect(kambi).toBeDefined();
      expect(kambi!.kind).toBe("unit");
      expect(kambi!.strength).toBe(0);
      expect(kambi!.rows).toEqual(["close"]);
      expect(kambi!.abilities).toEqual(["avenger"]);
      expect(kambi!.linkedSourceIds).toEqual(["skellige.hemdall"]);

      expect(hemdall).toBeDefined();
      expect(hemdall!.kind).toBe("hero");
      expect(hemdall!.strength).toBe(11);
      expect(hemdall!.rows).toEqual(["close"]);
      expect(hemdall!.tags).toContain("hero");
      expect(hemdall!.tags).toContain("side_deck_only");

      expect(combined).toBeUndefined();
    });

    it("Hemdall image resolves to a committed public asset", () => {
      const hemdall = currentCatalogCards.find((card) => card.sourceId === "skellige.hemdall");
      expect(hemdall).toBeDefined();
      const publicPath = join(process.cwd(), "public", hemdall!.image.replace(/^\//, ""));
      expect(existsSync(publicPath)).toBe(true);
    });
  });
});
