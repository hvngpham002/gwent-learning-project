import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentDeckPresets,
} from "@/data/catalog";
import { CATALOG_ABILITY_METADATA, type CatalogCardSource, type CatalogDeckPreset } from "@/game/catalog";

const SIDE_DECK_ONLY_TAG = "side_deck_only";

const cardById = new Map<string, CatalogCardSource>(
  currentCatalogCards.map((card) => [card.sourceId, card]),
);

const cardsWithLinkedSources = currentCatalogCards.filter(
  (card) => card.linkedSourceIds && card.linkedSourceIds.length > 0,
);

const sideDeckOnlySources = currentCatalogCards.filter((card) =>
  card.tags.includes(SIDE_DECK_ONLY_TAG),
);

const sourceLinkers = ((): Map<string, string[]> => {
  const map = new Map<string, string[]>();
  currentCatalogCards.forEach((card) => {
    card.linkedSourceIds?.forEach((linkedId) => {
      const list = map.get(linkedId) ?? [];
      list.push(card.sourceId);
      map.set(linkedId, list);
    });
  });
  return map;
})();

// cCp13 confirmed Light Longship is a same-source Muster: playing one Light
// Longship pulls other Light Longship copies from hand and deck. The catalog
// now lists `linkedSourceIds: ["skellige.light-longship"]`, so the previous
// deferred allowlist is empty. Any future deferred Muster source must be added
// here together with matching catalog/test/report changes.
const MUSTER_WITHOUT_LINKED_ALLOWLIST = new Set<string>();

describe("Linked ability invariants (cCp12)", () => {
  describe("link resolution", () => {
    it("every linkedSourceIds entry resolves to a current catalog source", () => {
      const errors: string[] = [];
      cardsWithLinkedSources.forEach((card) => {
        card.linkedSourceIds?.forEach((linkedId) => {
          if (!cardById.has(linkedId)) {
            errors.push(`${card.sourceId} -> missing ${linkedId}`);
          }
        });
      });
      expect(errors).toEqual([]);
    });

    it("every linkedSourceIds entry references a card in the same faction or a neutral card", () => {
      const errors: string[] = [];
      cardsWithLinkedSources.forEach((card) => {
        card.linkedSourceIds?.forEach((linkedId) => {
          const linked = cardById.get(linkedId);
          if (!linked) return;
          if (linked.faction !== card.faction && linked.faction !== "neutral") {
            errors.push(`${card.sourceId} (${card.faction}) -> ${linkedId} (${linked.faction})`);
          }
        });
      });
      expect(errors).toEqual([]);
    });
  });

  describe("side-deck-only reachability", () => {
    it("every side_deck_only source is linked from at least one current source", () => {
      expect(sideDeckOnlySources.length).toBeGreaterThan(0);
      const orphans = sideDeckOnlySources
        .filter((card) => (sourceLinkers.get(card.sourceId) ?? []).length === 0)
        .map((card) => card.sourceId);
      expect(orphans).toEqual([]);
    });

    it("side_deck_only sources are not present in any current main deck preset", () => {
      const offences: string[] = [];
      currentDeckPresets.forEach((preset: CatalogDeckPreset) => {
        preset.mainDeck.forEach((entry) => {
          const card = cardById.get(entry.sourceId);
          if (card?.tags.includes(SIDE_DECK_ONLY_TAG)) {
            offences.push(`${preset.presetId} main-decks ${entry.sourceId}`);
          }
        });
      });
      expect(offences).toEqual([]);
    });

    it("side_deck_only sources only appear in side decks of presets that link them from main", () => {
      const offences: string[] = [];
      currentDeckPresets.forEach((preset: CatalogDeckPreset) => {
        preset.sideDeck.forEach((entry) => {
          const card = cardById.get(entry.sourceId);
          if (!card) return;
          if (!card.tags.includes(SIDE_DECK_ONLY_TAG)) {
            offences.push(`${preset.presetId} side-decks non-side_deck_only ${entry.sourceId}`);
            return;
          }
          const linkedFromMain = preset.mainDeck.some((mainEntry) => {
            const mainCard = cardById.get(mainEntry.sourceId);
            return mainCard?.linkedSourceIds?.includes(entry.sourceId) ?? false;
          });
          if (!linkedFromMain) {
            offences.push(
              `${preset.presetId} side-decks unlinked ${entry.sourceId}`,
            );
          }
        });
      });
      expect(offences).toEqual([]);
    });
  });

  describe("Berserker linked replacement integrity", () => {
    const berserkers = currentCatalogCards.filter((card) =>
      card.abilities.includes("berserker"),
    );

    it("declares berserker sources for both close and ranged variants", () => {
      const ids = berserkers.map((card) => card.sourceId).sort();
      expect(ids).toEqual([
        "skellige.berserker",
        "skellige.young-berserker",
      ]);
    });

    it("every berserker source has exactly one linked side-deck-only replacement", () => {
      berserkers.forEach((card) => {
        expect(card.linkedSourceIds, `${card.sourceId} missing linkedSourceIds`).toBeDefined();
        expect(card.linkedSourceIds!.length).toBe(1);
        const replacement = cardById.get(card.linkedSourceIds![0]);
        expect(replacement, `${card.sourceId} -> ${card.linkedSourceIds![0]} missing`).toBeDefined();
        expect(replacement!.tags).toContain(SIDE_DECK_ONLY_TAG);
      });
    });

    it("berserker replacements do not reciprocally link back to a base Berserker", () => {
      berserkers.forEach((card) => {
        const replacement = cardById.get(card.linkedSourceIds![0]);
        const replacementLinks = replacement?.linkedSourceIds ?? [];
        expect(replacementLinks).not.toContain(card.sourceId);
      });
    });
  });

  describe("Avenger linked replacement integrity", () => {
    const avengers = currentCatalogCards.filter((card) =>
      card.abilities.includes("avenger"),
    );

    it("declares avenger sources for Cow and Kambi", () => {
      const ids = avengers.map((card) => card.sourceId).sort();
      expect(ids).toEqual(["neutral.cow", "skellige.kambi"]);
    });

    it("every avenger source has exactly one linked side-deck-only replacement", () => {
      avengers.forEach((card) => {
        expect(card.linkedSourceIds, `${card.sourceId} missing linkedSourceIds`).toBeDefined();
        expect(card.linkedSourceIds!.length).toBe(1);
        const replacement = cardById.get(card.linkedSourceIds![0]);
        expect(replacement, `${card.sourceId} -> ${card.linkedSourceIds![0]} missing`).toBeDefined();
        expect(replacement!.tags).toContain(SIDE_DECK_ONLY_TAG);
      });
    });

    it("avenger replacements do not reciprocally link back to their avenger source", () => {
      avengers.forEach((card) => {
        const replacement = cardById.get(card.linkedSourceIds![0]);
        const replacementLinks = replacement?.linkedSourceIds ?? [];
        expect(replacementLinks).not.toContain(card.sourceId);
      });
    });
  });

  describe("muster_roach", () => {
    const roachCallers = currentCatalogCards.filter((card) =>
      card.abilities.includes("muster_roach"),
    );

    it("muster_roach metadata is implemented", () => {
      expect(CATALOG_ABILITY_METADATA.muster_roach.status).toBe("implemented");
    });

    it("muster_roach sources are Geralt and Cirilla", () => {
      const ids = roachCallers.map((card) => card.sourceId).sort();
      expect(ids).toEqual([
        "neutral.cirilla-fiona-elen-riannon",
        "neutral.geralt-of-rivia",
      ]);
    });

    it("every muster_roach source links to neutral.roach", () => {
      roachCallers.forEach((card) => {
        expect(card.linkedSourceIds, `${card.sourceId} missing roach link`).toBeDefined();
        expect(card.linkedSourceIds).toContain("neutral.roach");
      });
    });

    it("neutral.roach does not reciprocally summon either hero", () => {
      const roach = cardById.get("neutral.roach");
      expect(roach).toBeDefined();
      expect(roach!.linkedSourceIds ?? []).toEqual([]);
      expect(roach!.abilities).not.toContain("muster_roach");
      expect(roach!.abilities).not.toContain("muster");
    });
  });

  describe("Gaunter / Darkness directionality", () => {
    it("neutral.gaunter-odimm links forward to Darkness only", () => {
      const gaunter = cardById.get("neutral.gaunter-odimm");
      expect(gaunter).toBeDefined();
      expect(gaunter!.linkedSourceIds).toEqual([
        "neutral.gaunter-odimm-darkness",
      ]);
    });

    it("neutral.gaunter-odimm-darkness links to itself only and never to base Gaunter", () => {
      const darkness = cardById.get("neutral.gaunter-odimm-darkness");
      expect(darkness).toBeDefined();
      expect(darkness!.linkedSourceIds).toEqual([
        "neutral.gaunter-odimm-darkness",
      ]);
      expect(darkness!.linkedSourceIds).not.toContain("neutral.gaunter-odimm");
    });
  });

  describe("Cerys named hero-to-group", () => {
    it("Cerys links one-way to Clan Drummond Shield Maiden", () => {
      const cerys = cardById.get("skellige.cerys");
      expect(cerys).toBeDefined();
      expect(cerys!.kind).toBe("hero");
      expect(cerys!.abilities).toEqual(["muster"]);
      expect(cerys!.linkedSourceIds).toEqual([
        "skellige.clan-drummond-shield-maiden",
      ]);
    });

    it("Clan Drummond Shield Maiden does not summon Cerys", () => {
      const maiden = cardById.get("skellige.clan-drummond-shield-maiden");
      expect(maiden).toBeDefined();
      expect(maiden!.abilities).not.toContain("muster");
      expect(maiden!.abilities).not.toContain("muster_roach");
      expect(maiden!.linkedSourceIds ?? []).toEqual([]);
    });
  });

  describe("Same-source Muster groupings", () => {
    const sameSourceMusterIds = [
      "monsters.arachas",
      "monsters.nekker",
      "monsters.ghoul",
      "scoiatael.havekar-smuggler",
      "scoiatael.dwarven-skirmisher",
      "scoiatael.elven-skirmisher",
      "skellige.light-longship",
    ];

    it("each known same-source Muster card lists itself in linkedSourceIds", () => {
      sameSourceMusterIds.forEach((sourceId) => {
        const card = cardById.get(sourceId);
        expect(card, `${sourceId} missing from catalog`).toBeDefined();
        expect(card!.abilities).toContain("muster");
        expect(card!.linkedSourceIds).toContain(sourceId);
      });
    });

    it("Light Longship lists only itself in linkedSourceIds (cCp13)", () => {
      const longship = cardById.get("skellige.light-longship");
      expect(longship).toBeDefined();
      expect(longship!.abilities).toContain("muster");
      expect(longship!.linkedSourceIds).toEqual(["skellige.light-longship"]);
    });
  });

  describe("Symmetric family Muster groups (cCp13)", () => {
    // The Crone and Vampire families are visually title-like (`Crone:` /
    // `Vampire:`), but the production engine resolves Muster only through
    // explicit `linkedSourceIds`. Runtime name-prefix matching is not used in
    // the pure engine path. These assertions lock that contract.

    it("Crones each link to the other two Crones via explicit linkedSourceIds, not name-prefix matching", () => {
      const ids = [
        "monsters.crone-brewess",
        "monsters.crone-weavess",
        "monsters.crone-whispess",
      ] as const;
      ids.forEach((sourceId) => {
        const card = cardById.get(sourceId);
        expect(card, `${sourceId} missing from catalog`).toBeDefined();
        expect(card!.name.startsWith("Crone:")).toBe(true);
        const linked = card!.linkedSourceIds ?? [];
        expect(linked).not.toContain(sourceId);
        ids
          .filter((other) => other !== sourceId)
          .forEach((other) => {
            expect(linked).toContain(other);
          });
      });
    });

    it("Vampires each link to all four other Vampire variants via explicit linkedSourceIds, not name-prefix matching", () => {
      const ids = [
        "monsters.vampire-bruxa",
        "monsters.vampire-ekimmara",
        "monsters.vampire-fleder",
        "monsters.vampire-garkain",
        "monsters.vampire-katakan",
      ] as const;
      ids.forEach((sourceId) => {
        const card = cardById.get(sourceId);
        expect(card, `${sourceId} missing from catalog`).toBeDefined();
        expect(card!.name.startsWith("Vampire:")).toBe(true);
        const linked = card!.linkedSourceIds ?? [];
        expect(linked).not.toContain(sourceId);
        ids
          .filter((other) => other !== sourceId)
          .forEach((other) => {
            expect(linked).toContain(other);
          });
      });
    });

    it("no other catalog source shares the Crone family title prefix unintentionally", () => {
      const crones = currentCatalogCards.filter((card) => card.name.startsWith("Crone:"));
      expect(crones.map((card) => card.sourceId).sort()).toEqual([
        "monsters.crone-brewess",
        "monsters.crone-weavess",
        "monsters.crone-whispess",
      ]);
    });

    it("no other catalog source shares the Vampire family title prefix unintentionally", () => {
      const vampires = currentCatalogCards.filter((card) => card.name.startsWith("Vampire:"));
      expect(vampires.map((card) => card.sourceId).sort()).toEqual([
        "monsters.vampire-bruxa",
        "monsters.vampire-ekimmara",
        "monsters.vampire-fleder",
        "monsters.vampire-garkain",
        "monsters.vampire-katakan",
      ]);
    });
  });

  describe("Arachas Behemoth one-way directionality (cCp13)", () => {
    it("Behemoth links forward to regular Arachas only", () => {
      const behemoth = cardById.get("monsters.arachas-behemoth");
      expect(behemoth).toBeDefined();
      expect(behemoth!.linkedSourceIds).toEqual(["monsters.arachas"]);
    });

    it("regular Arachas links to itself only and never to Arachas Behemoth", () => {
      const arachas = cardById.get("monsters.arachas");
      expect(arachas).toBeDefined();
      expect(arachas!.linkedSourceIds).toEqual(["monsters.arachas"]);
      expect(arachas!.linkedSourceIds).not.toContain("monsters.arachas-behemoth");
    });
  });

  describe("Catalog path does not require name-prefix matching", () => {
    it("every muster source either declares linkedSourceIds or is in the deferred allowlist", () => {
      const musterCards = currentCatalogCards.filter((card) =>
        card.abilities.includes("muster"),
      );
      expect(musterCards.length).toBeGreaterThan(0);

      const offences: string[] = [];
      musterCards.forEach((card) => {
        const hasLinks = (card.linkedSourceIds ?? []).length > 0;
        if (!hasLinks && !MUSTER_WITHOUT_LINKED_ALLOWLIST.has(card.sourceId)) {
          offences.push(card.sourceId);
        }
      });
      expect(offences).toEqual([]);
    });

    it("muster_roach sources also declare linkedSourceIds", () => {
      const roachCallers = currentCatalogCards.filter((card) =>
        card.abilities.includes("muster_roach"),
      );
      roachCallers.forEach((card) => {
        expect((card.linkedSourceIds ?? []).length, `${card.sourceId} muster_roach has no link`).toBeGreaterThan(0);
      });
    });
  });

  describe("Hemdall ability-less hero lock (cCp13)", () => {
    const hemdall = cardById.get("skellige.hemdall");

    it("Hemdall is a hero with no implemented on-play ability", () => {
      expect(hemdall).toBeDefined();
      expect(hemdall!.kind).toBe("hero");
      expect(hemdall!.abilities).toEqual(["none"]);
    });

    it("Hemdall remains side_deck_only and tagged hero", () => {
      expect(hemdall).toBeDefined();
      expect(hemdall!.tags).toContain("side_deck_only");
      expect(hemdall!.tags).toContain("hero");
    });

    it("Kambi links to Hemdall through linkedSourceIds[0]", () => {
      const kambi = cardById.get("skellige.kambi");
      expect(kambi).toBeDefined();
      expect(kambi!.abilities).toContain("avenger");
      expect(kambi!.linkedSourceIds?.[0]).toBe("skellige.hemdall");
    });

    it("no other catalog source links to Hemdall, so Avenger is the only summon path", () => {
      const linkers = sourceLinkers.get("skellige.hemdall") ?? [];
      expect(linkers).toEqual(["skellige.kambi"]);
    });
  });

  describe("Roach starter visibility (cCp13)", () => {
    const roachId = "neutral.roach";
    const heroIds = new Set([
      "neutral.geralt-of-rivia",
      "neutral.cirilla-fiona-elen-riannon",
    ]);

    const presetContains = (preset: CatalogDeckPreset, sourceId: string) =>
      preset.mainDeck.some((entry) => entry.sourceId === sourceId);
    const presetCount = (preset: CatalogDeckPreset, sourceId: string) =>
      preset.mainDeck.find((entry) => entry.sourceId === sourceId)?.count ?? 0;

    it("every current preset containing Geralt or Ciri also contains at least one Roach", () => {
      const offences: string[] = [];
      currentDeckPresets.forEach((preset) => {
        const includesHero = preset.mainDeck.some((entry) => heroIds.has(entry.sourceId));
        if (!includesHero) return;
        if (!presetContains(preset, roachId)) {
          offences.push(preset.presetId);
        }
      });
      expect(offences).toEqual([]);
    });

    it("Roach count never exceeds neutral.roach deckLimit in any preset", () => {
      const roach = cardById.get(roachId);
      expect(roach).toBeDefined();
      const limit = roach!.deckLimit;
      const offences: string[] = [];
      currentDeckPresets.forEach((preset) => {
        const count = presetCount(preset, roachId);
        if (count > limit) {
          offences.push(`${preset.presetId} has ${count} Roach (limit ${limit})`);
        }
      });
      expect(offences).toEqual([]);
    });

    it("Roach is never added to a preset that contains neither Geralt nor Ciri", () => {
      const offences: string[] = [];
      currentDeckPresets.forEach((preset) => {
        const includesHero = preset.mainDeck.some((entry) => heroIds.has(entry.sourceId));
        if (includesHero) return;
        if (presetContains(preset, roachId)) {
          offences.push(preset.presetId);
        }
      });
      expect(offences).toEqual([]);
    });

    it("Roach itself remains non-recursive and does not summon Geralt or Ciri", () => {
      const roach = cardById.get(roachId);
      expect(roach).toBeDefined();
      expect(roach!.linkedSourceIds ?? []).toEqual([]);
      expect(roach!.abilities).not.toContain("muster");
      expect(roach!.abilities).not.toContain("muster_roach");
    });
  });

  describe("Light Longship starter visibility (cCp13)", () => {
    it("the official Skellige starter has at least 2 Light Longship copies so Muster can visibly resolve", () => {
      const skelligeStarter = currentDeckPresets.find(
        (preset) => preset.presetId === "official-skellige-starter",
      );
      expect(skelligeStarter).toBeDefined();
      const longshipEntry = skelligeStarter!.mainDeck.find(
        (entry) => entry.sourceId === "skellige.light-longship",
      );
      expect(longshipEntry).toBeDefined();
      expect(longshipEntry!.count).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Summon discard-trigger lock (cCp17)", () => {
    // cCp17 promoted `summon` from `planned` to `implemented`. The active
    // engine regressions live in `tests/game/coreSummonDiscardTrigger.test.ts`
    // (Special Scorch, unit row-Scorch, unit whole-board Scorch, Foltest
    // row-Scorch leaders, round cleanup, board-side discard, on-play
    // armed_for_discard, Decoy / Medic / Skellige-return / Monsters-keep
    // non-triggers, and the missing_link / missing_replacement /
    // missing_origin_row outcomes). Lock the metadata contract here so the
    // status cannot regress without breaking this invariant suite.
    it("Summon ability metadata is implemented (cCp17)", () => {
      expect(CATALOG_ABILITY_METADATA.summon.status).toBe("implemented");
    });
  });

  describe("Documented ambiguity / deferred placeholders", () => {
    // Placeholder leader tutor/restore effects (Eredin, Emhyr, etc.) currently
    // emit no legal moves. When they begin to consume `linkedSourceIds`,
    // promote this todo to an active engine regression covering the
    // controlling seat's deck and hand discovery rules.
    it.todo(
      "placeholder leader tutor/restore effects respect linkedSourceIds when implemented",
    );
  });
});
