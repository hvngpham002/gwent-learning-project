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
  buildDeckBuilderCardActions,
  buildDeckBuilderCardInspection,
  buildDeckCardItems,
  buildFactionOptions,
  buildGeneratedCardItems,
  changeDeckFaction,
  computeLinkedSideDeckRequirements,
  createEmptyDeckPreset,
  duplicateDeckPreset,
  filterCardPool,
  findCatalogSourceForLocalDeck,
  getDeckBuilderAddState,
  getDeckBuilderCardLimit,
  makeUniqueDeckName,
  normalizeDeckCollection,
  removeCardFromDeck,
  resetDeckToCatalogSource,
  syncLinkedSideDeck,
  validateDeckPreset,
} from "@/components/gwent/deckBuilderViewModel";
import type { CatalogCardSource, CatalogLeaderSource } from "@/game/catalog";

describe("authentic deck builder view model", () => {
  const customNorthernCard: CatalogCardSource = {
    sourceId: "custom_training_unit",
    name: "Training Unit",
    faction: "northern_realms",
    kind: "unit",
    strength: 6,
    rows: ["close"],
    abilities: ["none"],
    tags: [],
    deckLimit: 3,
    image: "/images/custom/training-unit.png",
  };
  const customNilfgaardCard: CatalogCardSource = {
    ...customNorthernCard,
    sourceId: "custom_nilfgaard_unit",
    name: "Nilfgaard Training Unit",
    faction: "nilfgaard",
  };
  const customLeader: CatalogLeaderSource = {
    sourceId: "custom_leader_training",
    name: "Training Leader",
    faction: "northern_realms",
    ability: "clear_weather",
    image: "/images/custom/training-leader.png",
  };

  it("builds a faction plus neutral pool and hides wrong-faction cards", () => {
    const pool = buildCardPool(currentNorthernRealmsDeckPreset);
    const factions = new Set(pool.map((item) => item.card.faction));

    expect(factions.has("northern_realms")).toBe(true);
    expect(factions.has("neutral")).toBe(true);
    expect(factions.has("nilfgaard")).toBe(false);
    expect(pool.some((item) => item.card.sourceId === "northern-realms.vernon-roche")).toBe(true);
    expect(pool.some((item) => item.card.sourceId === "nilfgaard.letho-of-gulet")).toBe(false);
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

  it("allows normal unit cards up to the deck-builder unit limit even when catalog source count is one", () => {
    const scorpion = currentCatalogCards.find((card) => card.sourceId === "nilfgaard.heavy-zerrikanian-fire-scorpion");
    expect(scorpion).toBeDefined();
    expect(scorpion!.deckLimit).toBe(1);
    expect(getDeckBuilderCardLimit(scorpion!)).toBe(3);

    const empty = createEmptyDeckPreset("local-nilfgaard", "Local Nilfgaard", "nilfgaard");
    const withOne = addCardToDeck(empty, scorpion!.sourceId);
    const withTwo = addCardToDeck(withOne, scorpion!.sourceId);
    const withThree = addCardToDeck(withTwo, scorpion!.sourceId);
    const withFourAttempt = addCardToDeck(withThree, scorpion!.sourceId);

    expect(withThree.mainDeck).toEqual([{ sourceId: scorpion!.sourceId, count: 3 }]);
    expect(withFourAttempt.mainDeck).toEqual(withThree.mainDeck);
    expect(getDeckBuilderAddState(withThree, scorpion!.sourceId)).toEqual(
      expect.objectContaining({ canAdd: false, reason: "3/3 limit" }),
    );
    expect(buildCardPool(withThree).find((item) => item.card.sourceId === scorpion!.sourceId)).toEqual(
      expect.objectContaining({ count: 3, limit: 3, atLimit: true }),
    );
  });

  it("computes add-state for special cap, deck limit, wrong faction, and unknown cards", () => {
    const specialCapped = {
      ...currentNorthernRealmsDeckPreset,
      mainDeck: [
        { sourceId: "neutral.decoy", count: 3 },
        { sourceId: "neutral.commanders-horn", count: 3 },
        { sourceId: "neutral.scorch", count: 3 },
        { sourceId: "neutral.biting-frost", count: 1 },
      ],
    };

    expect(getDeckBuilderAddState(specialCapped, "neutral.impenetrable-fog")).toEqual(
      expect.objectContaining({ canAdd: false, reasonCode: "special_cap" }),
    );
    expect(getDeckBuilderAddState(currentNorthernRealmsDeckPreset, "neutral.geralt-of-rivia")).toEqual(
      expect.objectContaining({ canAdd: false, reasonCode: "deck_limit" }),
    );
    expect(getDeckBuilderAddState(currentNorthernRealmsDeckPreset, "nilfgaard.letho-of-gulet")).toEqual(
      expect.objectContaining({ canAdd: false, reasonCode: "wrong_faction" }),
    );
    expect(getDeckBuilderAddState(currentNorthernRealmsDeckPreset, "missing.card")).toEqual(
      expect.objectContaining({ canAdd: false, reasonCode: "unknown_card" }),
    );
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

  it("derives faction options from catalog leaders and cards", () => {
    const options = buildFactionOptions();

    expect(options.find((option) => option.faction === "northern_realms")).toEqual(
      expect.objectContaining({ available: true, leaderCount: 5 }),
    );
    expect(options.find((option) => option.faction === "nilfgaard")).toEqual(
      expect.objectContaining({ available: true, leaderCount: 5 }),
    );
  });

  it("changes faction by resetting leader and removing wrong-faction cards", () => {
    const result = changeDeckFaction(currentNorthernRealmsDeckPreset, "nilfgaard");

    expect(result.removedCards).toBeGreaterThan(0);
    expect(result.deck.faction).toBe("nilfgaard");
    expect(result.deck.leaderSourceId).toMatch(/^nilfgaard\./);
    expect(result.deck.mainDeck.every((entry) => !entry.sourceId.startsWith("northern-realms."))).toBe(true);
    expect(result.deck.mainDeck.some((entry) => entry.sourceId.startsWith("neutral."))).toBe(true);
  });

  it("duplicates decks with the same composition but unique local identity", () => {
    const duplicate = duplicateDeckPreset(currentNorthernRealmsDeckPreset, [currentNorthernRealmsDeckPreset]);

    expect(duplicate.presetId).not.toBe(currentNorthernRealmsDeckPreset.presetId);
    expect(duplicate.name).toBe("Current Northern Realms 2");
    expect(duplicate.mainDeck).toEqual(currentNorthernRealmsDeckPreset.mainDeck);
    expect(duplicate.leaderSourceId).toBe(currentNorthernRealmsDeckPreset.leaderSourceId);
  });

  it("finds and resets catalog-sourced local decks while preserving local IDs", () => {
    const localDeck = {
      ...currentNorthernRealmsDeckPreset,
      presetId: "local-current-northern-realms",
      name: "Current Northern Realms",
      mainDeck: [],
    };
    const source = findCatalogSourceForLocalDeck(localDeck);

    expect(source?.presetId).toBe("current-northern-realms");
    expect(resetDeckToCatalogSource(localDeck, source!)).toEqual({
      ...currentNorthernRealmsDeckPreset,
      presetId: "local-current-northern-realms",
    });
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

  it("reports non-implemented card abilities as warnings (cCp29: every official leader ability is implemented)", () => {
    const plannedCard = currentCatalogCards.find((card) => card.abilities.includes("muster_roach"));
    expect(plannedCard).toBeDefined();

    // After cCp29, every official leader ability is implemented, so there
    // are no leader-ability warnings left for any of the 22 official leaders.
    // Only `muster_roach` remains as a planned card ability — exercise that.
    const stats = validateDeckPreset(currentNilfgaardDeckPreset);

    expect(stats.issues.filter((issue) => issue.severity === "error")).toHaveLength(0);
    expect(stats.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["card_ability_not_implemented"]),
    );
    // No leader-ability warnings remain after cCp29.
    expect(stats.issues.map((issue) => issue.code)).not.toContain(
      "leader_ability_not_implemented",
    );
  });

  it("keeps current Nilfgaard playable with no leader-ability warning after cCp29", () => {
    // The current Nilfgaard preset uses Emhyr: The Relentless. After cCp29
    // every official leader ability is implemented, including the previously
    // placeholder `cancel_leader` (Emhyr: The White Flame). No leader
    // ability is still placeholder/planned, so `validateDeckPreset` no
    // longer raises a `leader_ability_not_implemented` warning for any
    // official preset.
    const stats = validateDeckPreset(currentNilfgaardDeckPreset);

    expect(stats.playable).toBe(true);
    expect(stats.issues.map((issue) => issue.code)).not.toContain(
      "leader_ability_not_implemented",
    );
  });

  it("uses explicit merged source sets for playable custom cards and leaders", () => {
    const cards = [...currentCatalogCards, customNorthernCard, customNilfgaardCard];
    const leaders = [...currentCatalogLeaders, customLeader];
    const deck = {
      ...currentNorthernRealmsDeckPreset,
      leaderSourceId: customLeader.sourceId,
      mainDeck: [...currentNorthernRealmsDeckPreset.mainDeck, { sourceId: customNorthernCard.sourceId, count: 1 }],
    };

    const pool = buildCardPool(deck, cards);
    expect(pool.map((item) => item.card.sourceId)).toContain(customNorthernCard.sourceId);
    expect(pool.map((item) => item.card.sourceId)).not.toContain(customNilfgaardCard.sourceId);
    expect(validateDeckPreset(deck, cards, leaders).playable).toBe(true);
  });

  it("blocks local decks that still reference draft or deleted custom sources", () => {
    const blockedSources = {
      cards: new Map([[customNorthernCard.sourceId, { reason: "Training Unit is saved as a Card Studio draft." }]]),
      leaders: new Map([[customLeader.sourceId, { reason: "Training Leader is saved as a Card Studio draft." }]]),
    };
    const deck = {
      ...currentNorthernRealmsDeckPreset,
      leaderSourceId: customLeader.sourceId,
      mainDeck: [{ sourceId: customNorthernCard.sourceId, count: 1 }],
    };
    const stats = validateDeckPreset(deck, currentCatalogCards, currentCatalogLeaders, blockedSources);

    expect(stats.playable).toBe(false);
    expect(stats.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["unplayable_custom_card", "unplayable_custom_leader", "too_few_battlefield_cards"]),
    );
  });

  it("hides side-deck-only cards from the main-deck card pool", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
    };
    const pool = buildCardPool(skelligeDeck);
    const poolIds = new Set(pool.map((item) => item.card.sourceId));
    expect(poolIds.has("skellige.berserker")).toBe(true);
    expect(poolIds.has("skellige.young-berserker")).toBe(true);
    expect(poolIds.has("skellige.vildkaarl")).toBe(false);
    expect(poolIds.has("skellige.young-vildkaarl")).toBe(false);
  });

  it("blocks side-deck-only cards in getDeckBuilderAddState and addCardToDeck", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [],
    };
    const addState = getDeckBuilderAddState(skelligeDeck, "skellige.vildkaarl");
    expect(addState).toEqual(expect.objectContaining({ canAdd: false, reasonCode: "side_deck_only" }));
    const after = addCardToDeck(skelligeDeck, "skellige.vildkaarl");
    expect(after.mainDeck.find((entry) => entry.sourceId === "skellige.vildkaarl")).toBeUndefined();
  });

  it("flags side_deck_only cards present in a main deck via validateDeckPreset", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [{ sourceId: "skellige.vildkaarl", count: 1 }],
    };
    const stats = validateDeckPreset(skelligeDeck, currentCatalogCards, currentCatalogLeaders);
    expect(stats.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["side_deck_only_main_deck"]),
    );
  });

  it("derives linked side-deck requirements from main-deck Berserker counts", () => {
    const deck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [
        { sourceId: "skellige.berserker", count: 1 },
        { sourceId: "skellige.young-berserker", count: 3 },
      ],
      sideDeck: [],
    };

    expect(computeLinkedSideDeckRequirements(deck)).toEqual([
      { sourceId: "skellige.young-vildkaarl", count: 3 },
      { sourceId: "skellige.vildkaarl", count: 1 },
    ].sort((a, b) => a.sourceId.localeCompare(b.sourceId)));
  });

  it("syncs the side deck to derived linked replacements", () => {
    const deck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [
        { sourceId: "skellige.berserker", count: 1 },
        { sourceId: "skellige.young-berserker", count: 2 },
      ],
      sideDeck: [],
    };

    const synced = syncLinkedSideDeck(deck);
    expect(synced.sideDeck).toEqual(
      [
        { sourceId: "skellige.vildkaarl", count: 1 },
        { sourceId: "skellige.young-vildkaarl", count: 2 },
      ].sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
    );
  });

  it("syncs Hemdall into the side deck when Kambi is added to the main deck", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [],
      sideDeck: [],
    };

    const withKambi = addCardToDeck(skelligeDeck, "skellige.kambi");
    expect(withKambi.mainDeck.find((entry) => entry.sourceId === "skellige.kambi")?.count).toBe(1);
    expect(withKambi.sideDeck.find((entry) => entry.sourceId === "skellige.hemdall")?.count).toBe(1);
  });

  it("hides Hemdall from the main-deck card pool because it is side-deck only", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
    };
    const pool = buildCardPool(skelligeDeck);
    const poolIds = new Set(pool.map((item) => item.card.sourceId));
    expect(poolIds.has("skellige.kambi")).toBe(true);
    expect(poolIds.has("skellige.hemdall")).toBe(false);
  });

  it("rejects Hemdall in the main deck via validateDeckPreset", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [{ sourceId: "skellige.hemdall", count: 1 }],
    };
    const stats = validateDeckPreset(skelligeDeck, currentCatalogCards, currentCatalogLeaders);
    expect(stats.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["side_deck_only_main_deck"]),
    );
  });

  it("auto-syncs the side deck when adding and removing Berserker base cards", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [],
      sideDeck: [],
    };

    const withOne = addCardToDeck(skelligeDeck, "skellige.young-berserker");
    expect(withOne.sideDeck).toEqual([{ sourceId: "skellige.young-vildkaarl", count: 1 }]);

    const withTwo = addCardToDeck(withOne, "skellige.young-berserker");
    expect(withTwo.sideDeck).toEqual([{ sourceId: "skellige.young-vildkaarl", count: 2 }]);

    const removed = removeCardFromDeck(withTwo, "skellige.young-berserker");
    expect(removed.sideDeck).toEqual([{ sourceId: "skellige.young-vildkaarl", count: 1 }]);

    const cleared = removeCardFromDeck(removed, "skellige.young-berserker");
    expect(cleared.sideDeck).toEqual([]);
  });

  it("clears the linked side deck when faction changes away from Skellige", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [
        { sourceId: "skellige.berserker", count: 1 },
        { sourceId: "skellige.young-berserker", count: 2 },
      ],
      sideDeck: [
        { sourceId: "skellige.vildkaarl", count: 1 },
        { sourceId: "skellige.young-vildkaarl", count: 2 },
      ],
    };
    const result = changeDeckFaction(skelligeDeck, "northern_realms");
    expect(result.deck.sideDeck).toEqual([]);
  });

  it("accepts an exact linked-replacement side deck through validateDeckPreset", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      leaderSourceId: "skellige.king-bran",
      mainDeck: [
        { sourceId: "skellige.cerys", count: 1 },
        { sourceId: "skellige.hjalmar", count: 1 },
        { sourceId: "skellige.ermion", count: 1 },
        { sourceId: "skellige.olaf", count: 1 },
        { sourceId: "skellige.clan-an-craite-warrior", count: 3 },
        { sourceId: "skellige.clan-drummond-shield-maiden", count: 3 },
        { sourceId: "skellige.clan-brokvar-archer", count: 3 },
        { sourceId: "skellige.light-longship", count: 3 },
        { sourceId: "skellige.war-longship", count: 3 },
        { sourceId: "skellige.young-berserker", count: 3 },
        { sourceId: "skellige.berserker", count: 1 },
        { sourceId: "skellige.draig-bon-dhu", count: 1 },
      ],
      sideDeck: [
        { sourceId: "skellige.vildkaarl", count: 1 },
        { sourceId: "skellige.young-vildkaarl", count: 3 },
      ],
    };
    const stats = validateDeckPreset(skelligeDeck);
    expect(stats.issues.filter((issue) => issue.severity === "error")).toEqual([]);
    expect(stats.playable).toBe(true);
  });

  it("rejects unknown, non-side-only, unlinked, mismatched, and missing side deck entries", () => {
    const wrongFactionSideDeckCard: CatalogCardSource = {
      sourceId: "test.nilfgaard-side-deck-only",
      name: "Nilfgaard Side Deck Only",
      faction: "nilfgaard",
      kind: "unit",
      strength: 8,
      rows: ["close"],
      abilities: ["none"],
      tags: ["side_deck_only"],
      deckLimit: 1,
      image: "/images/test/nilfgaard-side-deck-only.png",
    };
    const baseSkellige = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      leaderSourceId: "skellige.king-bran",
      mainDeck: [
        { sourceId: "skellige.cerys", count: 1 },
        { sourceId: "skellige.hjalmar", count: 1 },
        { sourceId: "skellige.ermion", count: 1 },
        { sourceId: "skellige.olaf", count: 1 },
        { sourceId: "skellige.clan-an-craite-warrior", count: 3 },
        { sourceId: "skellige.clan-drummond-shield-maiden", count: 3 },
        { sourceId: "skellige.clan-brokvar-archer", count: 3 },
        { sourceId: "skellige.light-longship", count: 3 },
        { sourceId: "skellige.war-longship", count: 3 },
        { sourceId: "skellige.young-berserker", count: 3 },
        { sourceId: "skellige.berserker", count: 1 },
        { sourceId: "skellige.draig-bon-dhu", count: 1 },
      ],
    };

    const unknownEntry = validateDeckPreset({
      ...baseSkellige,
      sideDeck: [
        { sourceId: "skellige.vildkaarl", count: 1 },
        { sourceId: "skellige.young-vildkaarl", count: 3 },
        { sourceId: "skellige.does-not-exist", count: 1 },
      ],
    });
    expect(unknownEntry.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["unknown_side_deck_card"]),
    );

    const unlinkedExtra = validateDeckPreset({
      ...baseSkellige,
      mainDeck: baseSkellige.mainDeck.filter((entry) => entry.sourceId !== "skellige.berserker"),
      sideDeck: [
        { sourceId: "skellige.young-vildkaarl", count: 3 },
        { sourceId: "skellige.vildkaarl", count: 1 },
      ],
    });
    expect(unlinkedExtra.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["unlinked_side_deck_card"]),
    );

    const nonSideDeckOnly = validateDeckPreset({
      ...baseSkellige,
      sideDeck: [
        { sourceId: "skellige.vildkaarl", count: 1 },
        { sourceId: "skellige.young-vildkaarl", count: 3 },
        { sourceId: "skellige.cerys", count: 1 },
      ],
    });
    expect(nonSideDeckOnly.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["invalid_side_deck_card", "unlinked_side_deck_card"]),
    );

    const wrongFaction = validateDeckPreset(
      {
        ...baseSkellige,
        sideDeck: [
          { sourceId: "skellige.vildkaarl", count: 1 },
          { sourceId: "skellige.young-vildkaarl", count: 3 },
          { sourceId: wrongFactionSideDeckCard.sourceId, count: 1 },
        ],
      },
      [...currentCatalogCards, wrongFactionSideDeckCard],
      currentCatalogLeaders,
    );
    expect(wrongFaction.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["wrong_faction_side_deck_card", "unlinked_side_deck_card"]),
    );

    const wrongCount = validateDeckPreset({
      ...baseSkellige,
      sideDeck: [
        { sourceId: "skellige.vildkaarl", count: 1 },
        { sourceId: "skellige.young-vildkaarl", count: 1 },
      ],
    });
    expect(wrongCount.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["side_deck_count_mismatch"]),
    );

    const missing = validateDeckPreset({
      ...baseSkellige,
      sideDeck: [{ sourceId: "skellige.vildkaarl", count: 1 }],
    });
    expect(missing.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["side_deck_count_mismatch"]),
    );
  });

  it("buildGeneratedCardItems lists Hemdall as generated by Kambi", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [{ sourceId: "skellige.kambi", count: 1 }],
      sideDeck: [{ sourceId: "skellige.hemdall", count: 1 }],
    };
    const items = buildGeneratedCardItems(skelligeDeck);
    const hemdall = items.find((entry) => entry.card.sourceId === "skellige.hemdall");
    expect(hemdall).toBeDefined();
    expect(hemdall!.count).toBe(1);
    expect(hemdall!.generatedBy.map((source) => source.sourceId)).toEqual(["skellige.kambi"]);
  });

  it("buildGeneratedCardItems lists Vildkaarl pairs as generated by their Berserker source", () => {
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [
        { sourceId: "skellige.berserker", count: 1 },
        { sourceId: "skellige.young-berserker", count: 2 },
      ],
      sideDeck: [],
    };
    const items = buildGeneratedCardItems(skelligeDeck);
    const vildkaarl = items.find((entry) => entry.card.sourceId === "skellige.vildkaarl");
    const youngVildkaarl = items.find((entry) => entry.card.sourceId === "skellige.young-vildkaarl");
    expect(vildkaarl?.generatedBy.map((source) => source.sourceId)).toEqual(["skellige.berserker"]);
    expect(youngVildkaarl?.generatedBy.map((source) => source.sourceId)).toEqual(["skellige.young-berserker"]);
    expect(vildkaarl?.count).toBe(1);
    expect(youngVildkaarl?.count).toBe(2);
  });

  it("buildGeneratedCardItems treats Cow → Bovine Defense Force as a generated pair", () => {
    const deck = {
      ...currentNorthernRealmsDeckPreset,
      mainDeck: [{ sourceId: "neutral.cow", count: 1 }],
      sideDeck: [],
    };
    const items = buildGeneratedCardItems(deck);
    const bovine = items.find((entry) => entry.card.sourceId === "neutral.bovine-defense-force");
    expect(bovine).toBeDefined();
    expect(bovine!.generatedBy.map((source) => source.sourceId)).toEqual(["neutral.cow"]);
  });

  it("hides Bovine Defense Force from the main-deck pool now that it is side_deck_only", () => {
    const pool = buildCardPool(currentNorthernRealmsDeckPreset);
    const ids = new Set(pool.map((item) => item.card.sourceId));
    expect(ids.has("neutral.cow")).toBe(true);
    expect(ids.has("neutral.bovine-defense-force")).toBe(false);
  });

  it("buildDeckBuilderCardActions enables add/remove for legal pool and deck cards", () => {
    const cards = currentCatalogCards;
    const geralt = cards.find((card) => card.sourceId === "neutral.geralt-of-rivia")!;
    const empty = createEmptyDeckPreset("local-actions");
    const poolActions = buildDeckBuilderCardActions({ deck: empty, card: geralt, origin: "pool" });
    expect(poolActions.add.enabled).toBe(true);
    expect(poolActions.remove.enabled).toBe(false);
    expect(poolActions.inspect.enabled).toBe(true);

    const withCard = addCardToDeck(empty, "neutral.geralt-of-rivia");
    const deckActions = buildDeckBuilderCardActions({ deck: withCard, card: geralt, origin: "deck" });
    expect(deckActions.add.enabled).toBe(false);
    expect(deckActions.remove.enabled).toBe(true);
  });

  it("buildDeckBuilderCardActions blocks add/remove on generated cards but allows inspect", () => {
    const cards = currentCatalogCards;
    const hemdall = cards.find((card) => card.sourceId === "skellige.hemdall")!;
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [{ sourceId: "skellige.kambi", count: 1 }],
      sideDeck: [{ sourceId: "skellige.hemdall", count: 1 }],
    };
    const actions = buildDeckBuilderCardActions({ deck: skelligeDeck, card: hemdall, origin: "generated" });
    expect(actions.add.enabled).toBe(false);
    expect(actions.add.reasonCode).toBe("generated_only");
    expect(actions.remove.enabled).toBe(false);
    expect(actions.remove.reasonCode).toBe("generated_only");
    expect(actions.inspect.enabled).toBe(true);
  });

  it("buildDeckBuilderCardInspection exposes linked replacements and current counts", () => {
    const cards = currentCatalogCards;
    const kambi = cards.find((card) => card.sourceId === "skellige.kambi")!;
    const skelligeDeck = {
      ...currentNorthernRealmsDeckPreset,
      faction: "skellige" as const,
      mainDeck: [{ sourceId: "skellige.kambi", count: 1 }],
      sideDeck: [{ sourceId: "skellige.hemdall", count: 1 }],
    };
    const inspection = buildDeckBuilderCardInspection({ deck: skelligeDeck, card: kambi, origin: "deck" });
    expect(inspection.currentCount).toBe(1);
    expect(inspection.currentGeneratedCount).toBe(0);
    expect(inspection.linkedGenerated.map((entry) => entry.sourceId)).toEqual(["skellige.hemdall"]);
    expect(inspection.actions.remove.enabled).toBe(true);
    expect(inspection.actions.add.enabled).toBe(true);

    const hemdall = cards.find((card) => card.sourceId === "skellige.hemdall")!;
    const generatedInspection = buildDeckBuilderCardInspection({
      deck: skelligeDeck,
      card: hemdall,
      origin: "generated",
    });
    expect(generatedInspection.generatedBy.map((entry) => entry.sourceId)).toEqual(["skellige.kambi"]);
    expect(generatedInspection.currentGeneratedCount).toBe(1);
    expect(generatedInspection.actions.inspect.enabled).toBe(true);
    expect(generatedInspection.actions.add.enabled).toBe(false);
  });
});
