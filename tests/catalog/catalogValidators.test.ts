import { describe, expect, it } from "vitest";

import {
  CATALOG_ABILITY_METADATA,
  CATALOG_LEADER_ABILITY_METADATA,
  CatalogCardSource,
  CatalogDeckPreset,
  CatalogLeaderSource,
  RuntimeCardIdentity,
  validateCardSources,
  validateCatalog,
  validateDeckPresets,
  validateLeaderSources,
} from "@/game/catalog";

const blueStripes: CatalogCardSource = {
  sourceId: "northern-realms.blue-stripes-commando",
  name: "Blue Stripes Commando",
  faction: "northern_realms",
  kind: "unit",
  strength: 4,
  rows: ["close"],
  abilities: ["tight_bond"],
  tags: ["non_hero"],
  deckLimit: 3,
  image: "/images/cards/northern-realms/blue-stripes-commando.png",
};

const gaunterDarkness: CatalogCardSource = {
  sourceId: "neutral.gaunter-odimm-darkness",
  name: "Gaunter O'Dimm: Darkness",
  faction: "neutral",
  kind: "unit",
  strength: 4,
  rows: ["ranged"],
  abilities: ["muster"],
  tags: ["non_hero"],
  deckLimit: 3,
  image: "/images/cards/neutral/gaunter-odimm-darkness.png",
};

const gaunter: CatalogCardSource = {
  sourceId: "neutral.gaunter-odimm",
  name: "Gaunter O'Dimm",
  faction: "neutral",
  kind: "unit",
  strength: 2,
  rows: ["siege"],
  abilities: ["muster"],
  linkedSourceIds: ["neutral.gaunter-odimm-darkness"],
  tags: ["non_hero"],
  deckLimit: 1,
  image: "/images/cards/neutral/gaunter-odimm.png",
};

const decoy: CatalogCardSource = {
  sourceId: "neutral.decoy",
  name: "Decoy",
  faction: "neutral",
  kind: "special",
  strength: 0,
  rows: [],
  abilities: ["decoy"],
  tags: ["special"],
  deckLimit: 3,
  image: "/images/cards/neutral/decoy.png",
};

const leader: CatalogLeaderSource = {
  sourceId: "northern-realms.foltest-lord-commander",
  name: "Foltest: Lord Commander of The North",
  faction: "northern_realms",
  ability: "clear_weather",
  image: "/images/cards/northern-realms/foltest-lord-commander.png",
};

const preset: CatalogDeckPreset = {
  presetId: "training-northern-realms",
  name: "Training Northern Realms",
  faction: "northern_realms",
  leaderSourceId: leader.sourceId,
  mainDeck: [
    { sourceId: blueStripes.sourceId, count: 3 },
    { sourceId: gaunter.sourceId, count: 1 },
    { sourceId: decoy.sourceId, count: 1 },
  ],
  sideDeck: [{ sourceId: gaunterDarkness.sourceId, count: 2 }],
};

const validCards = [blueStripes, gaunterDarkness, gaunter, decoy];

describe("catalog validation", () => {
  it("accepts valid card, leader, and deck preset source data", () => {
    expect(validateCardSources(validCards)).toEqual({ valid: true, errors: [] });
    expect(validateLeaderSources([leader])).toEqual({ valid: true, errors: [] });
    expect(validateDeckPresets([preset], validCards, [leader])).toEqual({
      valid: true,
      errors: [],
    });
    expect(validateCatalog({ cards: validCards, leaders: [leader], presets: [preset] }).valid).toBe(
      true,
    );
  });

  it("exports source/runtime identity concepts without conflating sourceId and instanceId", () => {
    const firstCopy: RuntimeCardIdentity = {
      sourceId: blueStripes.sourceId,
      instanceId: "match-1.player.deck.001",
    };
    const secondCopy: RuntimeCardIdentity = {
      sourceId: blueStripes.sourceId,
      instanceId: "match-1.player.deck.002",
    };

    expect(firstCopy.sourceId).toBe(secondCopy.sourceId);
    expect(firstCopy.instanceId).not.toBe(secondCopy.instanceId);
  });

  it("marks current and planned abilities with registry metadata", () => {
    expect(CATALOG_ABILITY_METADATA.tight_bond.status).toBe("implemented");
    expect(CATALOG_ABILITY_METADATA.muster_roach.status).toBe("implemented");
    expect(CATALOG_ABILITY_METADATA.summon.status).toBe("implemented");
    expect(CATALOG_ABILITY_METADATA.skellige_storm.status).toBe("implemented");
    expect(CATALOG_ABILITY_METADATA.mardroeme.status).toBe("implemented");
    expect(CATALOG_ABILITY_METADATA.berserker.status).toBe("implemented");
    // cCp29 promoted the final placeholder leader ability `cancel_leader`
    // to implemented; every official leader ability now has implemented
    // engine semantics.
    expect(CATALOG_LEADER_ABILITY_METADATA.cancel_leader.status).toBe("implemented");
  });

  it("reports duplicate card source IDs", () => {
    const result = validateCardSources([blueStripes, { ...blueStripes, name: "Duplicate" }]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        path: "cards.1.sourceId",
        code: "duplicate_source_id",
      }),
    );
  });

  it("reports duplicate leader source IDs", () => {
    const result = validateLeaderSources([leader, { ...leader, name: "Duplicate Foltest" }]);

    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        path: "leaders.1.sourceId",
        code: "duplicate_leader_source_id",
      }),
    );
  });

  it("reports unknown abilities and missing linked source IDs", () => {
    const result = validateCardSources([
      {
        ...gaunter,
        abilities: ["unknown_ability"],
        linkedSourceIds: ["neutral.missing"],
      },
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "cards.0.abilities.0", code: "unknown_ability" }),
        expect.objectContaining({
          path: "cards.0.linkedSourceIds.0",
          code: "unknown_linked_source_id",
        }),
      ]),
    );
  });

  it("reports bad row and kind combinations", () => {
    const result = validateCardSources([
      { ...blueStripes, rows: [] },
      { ...decoy, rows: ["close"] },
      { ...blueStripes, kind: "trap" },
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "cards.0.rows", code: "invalid_rows" }),
        expect.objectContaining({ path: "cards.1.rows", code: "invalid_rows" }),
        expect.objectContaining({ path: "cards.2.kind", code: "invalid_kind" }),
      ]),
    );
  });

  it("reports missing or invalid deck preset references and counts", () => {
    const result = validateDeckPresets(
      [
        {
          ...preset,
          leaderSourceId: "northern-realms.missing-leader",
          mainDeck: [{ sourceId: "neutral.missing-card", count: 1 }],
          sideDeck: [{ sourceId: gaunterDarkness.sourceId, count: 0 }],
        },
      ],
      validCards,
      [leader],
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "presets.0.leaderSourceId",
          code: "unknown_leader_reference",
        }),
        expect.objectContaining({
          path: "presets.0.mainDeck.0.sourceId",
          code: "unknown_card_reference",
        }),
        expect.objectContaining({
          path: "presets.0.sideDeck.0.count",
          code: "invalid_deck_count",
        }),
      ]),
    );
  });

  it("reports invalid factions, strength, image paths, and deck limits", () => {
    const result = validateCardSources([
      {
        ...blueStripes,
        faction: "unknown",
        strength: -1,
        image: "cards/blue-stripes.png",
        deckLimit: 0,
      },
    ]);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "cards.0.faction", code: "invalid_faction" }),
        expect.objectContaining({ path: "cards.0.strength", code: "invalid_strength" }),
        expect.objectContaining({ path: "cards.0.image", code: "invalid_image" }),
        expect.objectContaining({ path: "cards.0.deckLimit", code: "invalid_deck_limit" }),
      ]),
    );
  });
});
