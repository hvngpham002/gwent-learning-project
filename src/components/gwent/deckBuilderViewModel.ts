import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentDeckPresets,
} from "@/data/catalog";
import type {
  CatalogCardSource,
  CatalogDeckPreset,
  CatalogFaction,
  CatalogLeaderSource,
} from "@/game/catalog";
import {
  CATALOG_ABILITY_METADATA,
  CATALOG_FACTIONS,
  CATALOG_LEADER_ABILITY_METADATA,
} from "@/game/catalog";

import type {
  DeckBuilderAddState,
  DeckBuilderCardPoolItem,
  DeckBuilderDeckCardItem,
  DeckBuilderFactionChangeResult,
  DeckBuilderFactionOption,
  DeckBuilderFilter,
  DeckBuilderStats,
  DeckBuilderValidationIssue,
  EditableDeckFaction,
} from "./deckBuilderTypes";
import { getFactionDisplay } from "./displayMetadata";

export const DECK_BUILDER_MIN_BATTLEFIELD_CARDS = 22;
export const DECK_BUILDER_MAX_SPECIAL_CARDS = 10;

const NON_NEUTRAL_FACTIONS = CATALOG_FACTIONS.filter((faction) => faction !== "neutral") as EditableDeckFaction[];

const cloneDeck = (deck: CatalogDeckPreset): CatalogDeckPreset => ({
  presetId: deck.presetId,
  name: deck.name,
  faction: deck.faction,
  leaderSourceId: deck.leaderSourceId,
  mainDeck: deck.mainDeck.map((entry) => ({ sourceId: entry.sourceId, count: entry.count })),
  sideDeck: deck.sideDeck.map((entry) => ({ sourceId: entry.sourceId, count: entry.count })),
});

export const cloneDeckPresets = (
  decks: readonly CatalogDeckPreset[] = currentDeckPresets,
): CatalogDeckPreset[] => decks.map(cloneDeck);

export const deckNameKey = (name: string): string => name.trim().replace(/\s+/g, " ").toLowerCase();

export const makeUniqueDeckName = (
  preferredName: string,
  decks: readonly CatalogDeckPreset[],
  ignorePresetId?: string,
): string => {
  const baseName = preferredName.trim().replace(/\s+/g, " ") || "New Deck";
  const usedNames = new Set(
    decks
      .filter((deck) => deck.presetId !== ignorePresetId)
      .map((deck) => deckNameKey(deck.name))
      .filter((name) => name.length > 0),
  );
  let nextName = baseName;
  let suffix = 2;
  while (usedNames.has(deckNameKey(nextName))) {
    nextName = `${baseName} ${suffix}`;
    suffix += 1;
  }
  return nextName;
};

export const makeUniqueLocalPresetId = (
  preferredId: string,
  decks: readonly CatalogDeckPreset[],
): string => makeUniquePresetId(preferredId, new Set(decks.map((deck) => deck.presetId)), decks.length);

const makeUniquePresetId = (preferredId: string, usedIds: Set<string>, fallbackIndex: number): string => {
  const baseId = preferredId.trim() || `local-deck-${fallbackIndex + 1}`;
  let nextId = baseId;
  let suffix = 2;
  while (usedIds.has(nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(nextId);
  return nextId;
};

export const normalizeDeckPreset = (deck: CatalogDeckPreset): CatalogDeckPreset => ({
  ...cloneDeck(deck),
  name: deck.name.trim(),
  mainDeck: [...deck.mainDeck]
    .filter((entry) => Number.isInteger(entry.count) && entry.count > 0)
    .map((entry) => ({ sourceId: entry.sourceId, count: entry.count }))
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
  sideDeck: [...deck.sideDeck]
    .filter((entry) => Number.isInteger(entry.count) && entry.count > 0)
    .map((entry) => ({ sourceId: entry.sourceId, count: entry.count }))
    .sort((a, b) => a.sourceId.localeCompare(b.sourceId)),
});

export const normalizeDeckCollection = (decks: readonly CatalogDeckPreset[]): CatalogDeckPreset[] => {
  const usedIds = new Set<string>();
  const normalizedDecks: CatalogDeckPreset[] = [];
  decks.forEach((deck, index) => {
    const normalized = normalizeDeckPreset(deck);
    const presetId = makeUniquePresetId(normalized.presetId, usedIds, index);
    const name = makeUniqueDeckName(normalized.name, normalizedDecks);
    normalizedDecks.push({ ...normalized, presetId, name });
  });
  return normalizedDecks;
};

export const catalogCardById = (
  cards: readonly CatalogCardSource[] = currentCatalogCards,
): Map<string, CatalogCardSource> => new Map(cards.map((card) => [card.sourceId, card]));

export const catalogLeaderById = (
  leaders: readonly CatalogLeaderSource[] = currentCatalogLeaders,
): Map<string, CatalogLeaderSource> => new Map(leaders.map((leader) => [leader.sourceId, leader]));

export const leadersForFaction = (
  faction: CatalogFaction,
  leaders: readonly CatalogLeaderSource[] = currentCatalogLeaders,
): readonly CatalogLeaderSource[] => leaders.filter((leader) => leader.faction === faction);

export const defaultLeaderForFaction = (
  faction: EditableDeckFaction,
  leaders: readonly CatalogLeaderSource[] = currentCatalogLeaders,
): CatalogLeaderSource | null => {
  const factionLeaders = leadersForFaction(faction, leaders);
  return (
    factionLeaders.find((leader) => CATALOG_LEADER_ABILITY_METADATA[leader.ability]?.status === "implemented") ??
    factionLeaders[0] ??
    null
  );
};

export const buildFactionOptions = (
  cards: readonly CatalogCardSource[] = currentCatalogCards,
  leaders: readonly CatalogLeaderSource[] = currentCatalogLeaders,
): DeckBuilderFactionOption[] =>
  NON_NEUTRAL_FACTIONS.map((faction) => {
    const leaderCount = leadersForFaction(faction, leaders).length;
    const cardCount = cards.filter((card) => card.faction === faction).length;
    const available = leaderCount > 0 && cardCount > 0;
    return {
      faction,
      name: getFactionDisplay(faction).name,
      available,
      leaderCount,
      cardCount,
      disabledReason: available ? undefined : "Needs catalog cards and a leader.",
    };
  });

export const createEmptyDeckPreset = (
  presetId: string,
  name = "New Deck",
  faction: EditableDeckFaction = "northern_realms",
  leaders: readonly CatalogLeaderSource[] = currentCatalogLeaders,
): CatalogDeckPreset => ({
  presetId,
  name,
  faction,
  leaderSourceId: defaultLeaderForFaction(faction, leaders)?.sourceId ?? "",
  mainDeck: [],
  sideDeck: [],
});

export const buildDeckCardItems = (
  deck: CatalogDeckPreset,
  cards: readonly CatalogCardSource[] = currentCatalogCards,
): DeckBuilderDeckCardItem[] => {
  const byId = catalogCardById(cards);
  return deck.mainDeck
    .map((entry) => {
      const card = byId.get(entry.sourceId);
      return card ? { card, count: entry.count } : null;
    })
    .filter((entry): entry is DeckBuilderDeckCardItem => entry !== null)
    .sort((a, b) => {
      const strength = b.card.strength - a.card.strength;
      if (strength !== 0) return strength;
      const kind = a.card.kind.localeCompare(b.card.kind);
      if (kind !== 0) return kind;
      return a.card.name.localeCompare(b.card.name) || a.card.sourceId.localeCompare(b.card.sourceId);
    });
};

export const buildCardPool = (
  deck: CatalogDeckPreset,
  cards: readonly CatalogCardSource[] = currentCatalogCards,
): DeckBuilderCardPoolItem[] => {
  const countById = new Map(deck.mainDeck.map((entry) => [entry.sourceId, entry.count]));
  return cards
    .filter((card) => card.faction === "neutral" || card.faction === deck.faction)
    .map((card) => {
      const count = countById.get(card.sourceId) ?? 0;
      const addState = getDeckBuilderAddState(deck, card.sourceId, cards);
      return { card, count, atLimit: addState.reasonCode === "deck_limit", addState };
    })
    .sort((a, b) => {
      const faction = a.card.faction.localeCompare(b.card.faction);
      if (faction !== 0) return faction;
      const kind = a.card.kind.localeCompare(b.card.kind);
      if (kind !== 0) return kind;
      return a.card.name.localeCompare(b.card.name);
    });
};

export const getDeckBuilderAddState = (
  deck: CatalogDeckPreset,
  sourceId: string,
  cards: readonly CatalogCardSource[] = currentCatalogCards,
): DeckBuilderAddState => {
  const card = catalogCardById(cards).get(sourceId);
  if (!card) {
    return { canAdd: false, reasonCode: "unknown_card", reason: "unknown card" };
  }
  if (card.faction !== "neutral" && card.faction !== deck.faction) {
    return { canAdd: false, reasonCode: "wrong_faction", reason: "wrong faction" };
  }
  const current = deck.mainDeck.find((entry) => entry.sourceId === sourceId)?.count ?? 0;
  if (current >= card.deckLimit) {
    return { canAdd: false, reasonCode: "deck_limit", reason: `${current}/${card.deckLimit} limit` };
  }
  if (card.kind === "special") {
    const stats = validateDeckPreset(deck, cards);
    if (stats.specialCards >= DECK_BUILDER_MAX_SPECIAL_CARDS) {
      return { canAdd: false, reasonCode: "special_cap", reason: "special cap reached" };
    }
  }
  return { canAdd: true };
};

export const filterCardPool = (
  pool: readonly DeckBuilderCardPoolItem[],
  filter: DeckBuilderFilter,
  search = "",
): DeckBuilderCardPoolItem[] => {
  const needle = search.trim().toLowerCase();
  return pool.filter(({ card }) => {
    if (filter === "heroes" && card.kind !== "hero") return false;
    if (filter === "units" && card.kind !== "unit") return false;
    if (filter === "specials" && card.kind !== "special") return false;
    if (needle.length === 0) return true;
    return (
      card.name.toLowerCase().includes(needle) ||
      card.sourceId.toLowerCase().includes(needle) ||
      card.abilities.some((ability) => ability.toLowerCase().includes(needle))
    );
  });
};

const withEntryCount = (deck: CatalogDeckPreset, sourceId: string, count: number): CatalogDeckPreset => {
  const nextEntries = deck.mainDeck.filter((entry) => entry.sourceId !== sourceId);
  if (count > 0) {
    nextEntries.push({ sourceId, count });
  }
  return normalizeDeckPreset({ ...deck, mainDeck: nextEntries });
};

export const addCardToDeck = (
  deck: CatalogDeckPreset,
  sourceId: string,
  cards: readonly CatalogCardSource[] = currentCatalogCards,
): CatalogDeckPreset => {
  const addState = getDeckBuilderAddState(deck, sourceId, cards);
  if (!addState.canAdd) return deck;
  const card = catalogCardById(cards).get(sourceId);
  if (!card) return deck;
  const current = deck.mainDeck.find((entry) => entry.sourceId === sourceId)?.count ?? 0;
  return withEntryCount(deck, sourceId, current + 1);
};

export const removeCardFromDeck = (deck: CatalogDeckPreset, sourceId: string): CatalogDeckPreset => {
  const current = deck.mainDeck.find((entry) => entry.sourceId === sourceId)?.count ?? 0;
  return current <= 0 ? deck : withEntryCount(deck, sourceId, current - 1);
};

export const changeDeckFaction = (
  deck: CatalogDeckPreset,
  faction: EditableDeckFaction,
  cards: readonly CatalogCardSource[] = currentCatalogCards,
  leaders: readonly CatalogLeaderSource[] = currentCatalogLeaders,
): DeckBuilderFactionChangeResult => {
  const defaultLeader = defaultLeaderForFaction(faction, leaders);
  const byCardId = catalogCardById(cards);
  let removedCards = 0;
  const mainDeck = deck.mainDeck.filter((entry) => {
    const card = byCardId.get(entry.sourceId);
    const keep = card?.faction === "neutral" || card?.faction === faction;
    if (!keep) removedCards += entry.count;
    return keep;
  });
  return {
    deck: normalizeDeckPreset({
      ...deck,
      faction,
      leaderSourceId: defaultLeader?.sourceId ?? "",
      mainDeck,
      sideDeck: [],
    }),
    removedCards,
  };
};

export const duplicateDeckPreset = (
  deck: CatalogDeckPreset,
  decks: readonly CatalogDeckPreset[],
): CatalogDeckPreset => ({
  ...cloneDeck(deck),
  presetId: makeUniqueLocalPresetId(`${deck.presetId}-copy`, decks),
  name: makeUniqueDeckName(deck.name, decks),
});

export const findCatalogSourceForLocalDeck = (
  localDeck: CatalogDeckPreset,
  catalogDecks: readonly CatalogDeckPreset[] = currentDeckPresets,
): CatalogDeckPreset | null => {
  const seededSourceId = localDeck.presetId.startsWith("local-") ? localDeck.presetId.slice("local-".length) : "";
  return (
    catalogDecks.find((deck) => deck.presetId === seededSourceId) ??
    catalogDecks.find((deck) => deckNameKey(deck.name) === deckNameKey(localDeck.name)) ??
    null
  );
};

export const resetDeckToCatalogSource = (
  localDeck: CatalogDeckPreset,
  catalogSource: CatalogDeckPreset,
): CatalogDeckPreset => ({
  ...cloneDeck(catalogSource),
  presetId: localDeck.presetId,
});

const pushIssue = (
  issues: DeckBuilderValidationIssue[],
  severity: DeckBuilderValidationIssue["severity"],
  code: string,
  message: string,
  sourceId?: string,
) => {
  issues.push({ severity, code, message, sourceId });
};

export const validateDeckPreset = (
  deck: CatalogDeckPreset,
  cards: readonly CatalogCardSource[] = currentCatalogCards,
  leaders: readonly CatalogLeaderSource[] = currentCatalogLeaders,
): DeckBuilderStats => {
  const issues: DeckBuilderValidationIssue[] = [];
  const byCardId = catalogCardById(cards);
  const byLeaderId = catalogLeaderById(leaders);
  const leader = byLeaderId.get(deck.leaderSourceId);
  let totalCards = 0;
  let battlefieldCards = 0;
  let unitCards = 0;
  let heroCards = 0;
  let specialCards = 0;
  let totalStrength = 0;
  const rowCounts = { close: 0, ranged: 0, siege: 0 };

  if (deck.name.trim().length === 0) {
    pushIssue(issues, "error", "empty_name", "Deck name is required.");
  }

  if (!NON_NEUTRAL_FACTIONS.includes(deck.faction)) {
    pushIssue(issues, "error", "invalid_faction", "Deck faction must be a known non-neutral faction.");
  }

  if (!leader) {
    pushIssue(issues, "error", "unknown_leader", `Leader is missing: ${deck.leaderSourceId}`, deck.leaderSourceId);
  } else if (leader.faction !== deck.faction) {
    pushIssue(issues, "error", "wrong_faction_leader", `${leader.name} does not belong to this deck faction.`, leader.sourceId);
  } else {
    const leaderAbility = CATALOG_LEADER_ABILITY_METADATA[leader.ability];
    if (leaderAbility.status !== "implemented") {
      pushIssue(
        issues,
        "warning",
        "leader_ability_not_implemented",
        `${leader.name} uses ${leaderAbility.name}, currently ${leaderAbility.status}.`,
        leader.sourceId,
      );
    }
  }

  if (!Array.isArray(deck.sideDeck)) {
    pushIssue(issues, "error", "invalid_side_deck", "Side deck must be an array.");
  } else if (deck.sideDeck.length > 0) {
    pushIssue(issues, "error", "side_deck_not_supported", "Side deck editing is not supported in Deck Builder V1.");
  }

  const seen = new Set<string>();
  deck.mainDeck.forEach((entry) => {
    if (seen.has(entry.sourceId)) {
      pushIssue(issues, "error", "duplicate_deck_entry", `Duplicate deck entry: ${entry.sourceId}`, entry.sourceId);
    }
    seen.add(entry.sourceId);

    if (!Number.isInteger(entry.count) || entry.count <= 0) {
      pushIssue(issues, "error", "invalid_count", `Invalid count for ${entry.sourceId}.`, entry.sourceId);
      return;
    }

    const card = byCardId.get(entry.sourceId);
    if (!card) {
      pushIssue(issues, "error", "unknown_card", `Unknown card: ${entry.sourceId}`, entry.sourceId);
      return;
    }

    totalCards += entry.count;
    totalStrength += card.strength * entry.count;

    if (card.faction !== "neutral" && card.faction !== deck.faction) {
      pushIssue(issues, "error", "wrong_faction_card", `${card.name} cannot be used in this faction deck.`, card.sourceId);
    }

    if (entry.count > card.deckLimit) {
      pushIssue(
        issues,
        "error",
        "deck_limit_exceeded",
        `${card.name} is ${entry.count}/${card.deckLimit}.`,
        card.sourceId,
      );
    }

    if (card.kind === "unit") unitCards += entry.count;
    if (card.kind === "hero") heroCards += entry.count;
    if (card.kind === "special") specialCards += entry.count;
    if (card.kind === "unit" || card.kind === "hero") battlefieldCards += entry.count;
    card.rows.forEach((row) => {
      rowCounts[row] += entry.count;
    });

    card.abilities.forEach((abilityId) => {
      const ability = CATALOG_ABILITY_METADATA[abilityId];
      if (ability.status !== "implemented") {
        pushIssue(
          issues,
          "warning",
          "card_ability_not_implemented",
          `${card.name} uses ${ability.name}, currently ${ability.status}.`,
          card.sourceId,
        );
      }
    });
  });

  if (battlefieldCards < DECK_BUILDER_MIN_BATTLEFIELD_CARDS) {
    pushIssue(
      issues,
      "error",
      "too_few_battlefield_cards",
      `Need at least ${DECK_BUILDER_MIN_BATTLEFIELD_CARDS} battlefield cards.`,
    );
  }

  if (specialCards > DECK_BUILDER_MAX_SPECIAL_CARDS) {
    pushIssue(
      issues,
      "error",
      "too_many_specials",
      `Use at most ${DECK_BUILDER_MAX_SPECIAL_CARDS} special cards.`,
    );
  }

  return {
    totalCards,
    battlefieldCards,
    unitCards,
    heroCards,
    specialCards,
    totalStrength,
    rowCounts,
    issues,
    playable: !issues.some((issue) => issue.severity === "error"),
  };
};
