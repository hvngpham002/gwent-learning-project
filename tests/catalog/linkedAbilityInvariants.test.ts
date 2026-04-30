import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentDeckPresets,
} from "@/data/catalog";
import type { CatalogCardSource, CatalogDeckPreset } from "@/game/catalog";

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

// Light Longship is the only catalog source that prints `muster` without
// `linkedSourceIds`. Its target group is intentionally deferred (cBp4.1
// follow-up); the resolver emits `no_linked_sources` rather than guessing.
// Any future change should either add an explicit linked group or update this
// allowlist together with matching catalog/test changes.
const MUSTER_WITHOUT_LINKED_ALLOWLIST = new Set<string>([
  "skellige.light-longship",
]);

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
    ];

    it("each known same-source Muster card lists itself in linkedSourceIds", () => {
      sameSourceMusterIds.forEach((sourceId) => {
        const card = cardById.get(sourceId);
        expect(card, `${sourceId} missing from catalog`).toBeDefined();
        expect(card!.abilities).toContain("muster");
        expect(card!.linkedSourceIds).toContain(sourceId);
      });
    });
  });

  describe("Multi-card named groups", () => {
    it("Crones each link to the other two Crones and never to themselves", () => {
      const ids = [
        "monsters.crone-brewess",
        "monsters.crone-weavess",
        "monsters.crone-whispess",
      ] as const;
      ids.forEach((sourceId) => {
        const card = cardById.get(sourceId);
        expect(card, `${sourceId} missing from catalog`).toBeDefined();
        const linked = card!.linkedSourceIds ?? [];
        expect(linked).not.toContain(sourceId);
        ids
          .filter((other) => other !== sourceId)
          .forEach((other) => {
            expect(linked).toContain(other);
          });
      });
    });

    it("Vampires each link to all four other vampire variants and never to themselves", () => {
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
        const linked = card!.linkedSourceIds ?? [];
        expect(linked).not.toContain(sourceId);
        ids
          .filter((other) => other !== sourceId)
          .forEach((other) => {
            expect(linked).toContain(other);
          });
      });
    });

    it("Arachas Behemoth links to Arachas (one-way as currently catalogued)", () => {
      const behemoth = cardById.get("monsters.arachas-behemoth");
      expect(behemoth).toBeDefined();
      expect(behemoth!.linkedSourceIds).toEqual(["monsters.arachas"]);

      // Arachas currently links only to itself; reverse Behemoth coverage is
      // a documented ambiguity tracked in the cCp12 report.
      const arachas = cardById.get("monsters.arachas");
      expect(arachas).toBeDefined();
      expect(arachas!.linkedSourceIds).toEqual(["monsters.arachas"]);
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

  describe("Documented ambiguity / deferred placeholders", () => {
    // Arachas Behemoth currently links one-way to Arachas; whether Arachas
    // should reciprocally pull Behemoth is documented in the cCp12 report as
    // an ambiguous-rule note. Promote this `todo` to an active assertion when
    // the project decides on full symmetric Arachas grouping.
    it.todo(
      "Arachas reciprocally pulls Arachas Behemoth (full symmetric grouping)",
    );

    // `summon` remains a `planned` ability per CATALOG_ABILITY_METADATA. When
    // the discard-trigger resolver is implemented, replace this todo with a
    // concrete engine regression that asserts side-deck replacement on
    // discard for `summon` sources.
    it.todo(
      "summon discard-trigger resolves linked side-deck replacement",
    );

    // Placeholder leader tutor/restore effects (Eredin, Emhyr, etc.) currently
    // emit no legal moves. When they begin to consume `linkedSourceIds`,
    // promote this todo to an active engine regression covering the
    // controlling seat's deck and hand discovery rules.
    it.todo(
      "placeholder leader tutor/restore effects respect linkedSourceIds when implemented",
    );
  });
});
