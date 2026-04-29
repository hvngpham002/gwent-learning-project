import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import {
  CATALOG_ABILITY_METADATA,
  CATALOG_LEADER_ABILITY_METADATA,
  type CatalogCardSource,
  type CatalogDeckPreset,
  type CatalogFaction,
  type CatalogLeaderSource,
} from "@/game/catalog";

import { defaultLeaderForFaction } from "./deckBuilderViewModel";
import type {
  CardStudioBlockedSources,
  CardStudioSourceSets,
  CardStudioStoreV1,
  CustomCardRecord,
  CustomCatalogRecord,
  CustomLeaderRecord,
} from "./cardStudioTypes";
import {
  makeUniqueCustomName,
  makeUniqueCustomSourceId,
  sourceIdFromName,
  validateCustomCardRecord,
  validateCustomLeaderRecord,
} from "./cardStudioValidation";

export const createEmptyCustomCatalogStore = (): CardStudioStoreV1 => ({
  schemaVersion: "custom-catalog-v1",
  cards: [],
  leaders: [],
});

const nowIso = () => new Date().toISOString();

const allUsedSourceIds = (store: Pick<CardStudioStoreV1, "cards" | "leaders">): Set<string> =>
  new Set([
    ...currentCatalogCards.map((card) => card.sourceId),
    ...currentCatalogLeaders.map((leader) => leader.sourceId),
    ...store.cards.map((record) => record.source.sourceId),
    ...store.leaders.map((record) => record.source.sourceId),
  ]);

const allUsedNames = (store: Pick<CardStudioStoreV1, "cards" | "leaders">): Set<string> =>
  new Set([
    ...currentCatalogCards.map((card) => card.name.toLowerCase()),
    ...currentCatalogLeaders.map((leader) => leader.name.toLowerCase()),
    ...store.cards.map((record) => record.source.name.toLowerCase()),
    ...store.leaders.map((record) => record.source.name.toLowerCase()),
  ]);

export const createCustomCardRecord = (
  store: Pick<CardStudioStoreV1, "cards" | "leaders">,
  initialName = "New Custom Card",
): CustomCardRecord => {
  const createdAt = nowIso();
  const name = makeUniqueCustomName(initialName, allUsedNames(store));
  const sourceId = makeUniqueCustomSourceId(sourceIdFromName(name, "card"), allUsedSourceIds(store), "card");
  return {
    recordId: `custom-card-${createdAt}-${store.cards.length + 1}`,
    createdAt,
    updatedAt: createdAt,
    imageMode: "path",
    draft: true,
    source: {
      sourceId,
      name,
      faction: "northern_realms",
      kind: "unit",
      strength: 4,
      rows: ["close"],
      abilities: ["none"],
      tags: [],
      deckLimit: 3,
      image: "/images/custom/new-custom-card.png",
      description: "",
    },
  };
};

export const createCustomLeaderRecord = (
  store: Pick<CardStudioStoreV1, "cards" | "leaders">,
  initialName = "New Custom Leader",
): CustomLeaderRecord => {
  const createdAt = nowIso();
  const name = makeUniqueCustomName(initialName, allUsedNames(store));
  const sourceId = makeUniqueCustomSourceId(sourceIdFromName(name, "leader"), allUsedSourceIds(store), "leader");
  return {
    recordId: `custom-leader-${createdAt}-${store.leaders.length + 1}`,
    createdAt,
    updatedAt: createdAt,
    imageMode: "path",
    draft: true,
    source: {
      sourceId,
      name,
      faction: "northern_realms",
      ability: "clear_weather",
      image: "/images/custom/new-custom-leader.png",
      description: "",
    },
  };
};

export const recordKind = (record: CustomCatalogRecord): "card" | "leader" =>
  "abilities" in record.source ? "card" : "leader";

export const duplicateCustomRecord = (
  record: CustomCatalogRecord,
  store: Pick<CardStudioStoreV1, "cards" | "leaders">,
): CustomCatalogRecord => {
  const createdAt = nowIso();
  const kind = recordKind(record);
  const name = makeUniqueCustomName(`${record.source.name} Copy`, allUsedNames(store));
  const sourceId = makeUniqueCustomSourceId(sourceIdFromName(name, kind), allUsedSourceIds(store), kind);
  if (kind === "leader") {
    const leader = record as CustomLeaderRecord;
    return {
      ...leader,
      recordId: `custom-leader-${createdAt}-${store.leaders.length + 1}`,
      createdAt,
      updatedAt: createdAt,
      draft: true,
      source: {
        ...leader.source,
        sourceId,
        name,
      },
    };
  }
  const card = record as CustomCardRecord;
  return {
    ...card,
    recordId: `custom-card-${createdAt}-${store.cards.length + 1}`,
    createdAt,
    updatedAt: createdAt,
    draft: true,
    source: {
      ...card.source,
      sourceId,
      name,
    },
  };
};

export const buildCardStudioValidationContext = (store: CardStudioStoreV1, recordId?: string) => ({
  currentCards: currentCatalogCards,
  currentLeaders: currentCatalogLeaders,
  customCards: store.cards,
  customLeaders: store.leaders,
  recordId,
});

export const customRecordIsPlayable = (
  record: CustomCatalogRecord,
  store: CardStudioStoreV1,
): boolean => {
  if (recordKind(record) === "card") {
    return validateCustomCardRecord(record as CustomCardRecord, buildCardStudioValidationContext(store, record.recordId)).playable;
  }
  return validateCustomLeaderRecord(record as CustomLeaderRecord, buildCardStudioValidationContext(store, record.recordId)).playable;
};

export const buildCustomCatalogSourceSets = (store: CardStudioStoreV1): CardStudioSourceSets => {
  const playableCards = store.cards.flatMap((record) =>
    validateCustomCardRecord(record, buildCardStudioValidationContext(store, record.recordId)).playable ? [record.source] : [],
  );
  const playableLeaders = store.leaders.flatMap((record) =>
    validateCustomLeaderRecord(record, buildCardStudioValidationContext(store, record.recordId)).playable ? [record.source] : [],
  );
  return {
    cards: [...currentCatalogCards, ...playableCards],
    leaders: [...currentCatalogLeaders, ...playableLeaders],
  };
};

const blockedReasonForCard = (record: CustomCardRecord, store: CardStudioStoreV1): string | null => {
  const validation = validateCustomCardRecord(record, buildCardStudioValidationContext(store, record.recordId));
  if (validation.playable) return null;
  if (record.draft) return `${record.source.name} is saved as a Card Studio draft.`;
  const error = validation.issues.find((issue) => issue.severity === "error");
  if (error) return error.message;
  const unimplemented = record.source.abilities
    .filter((ability) => ability !== "none")
    .map((ability) => CATALOG_ABILITY_METADATA[ability]?.name)
    .filter(Boolean)
    .join(", ");
  return unimplemented ? `${unimplemented} is not implemented for custom play.` : `${record.source.name} is not playable.`;
};

const blockedReasonForLeader = (record: CustomLeaderRecord, store: CardStudioStoreV1): string | null => {
  const validation = validateCustomLeaderRecord(record, buildCardStudioValidationContext(store, record.recordId));
  if (validation.playable) return null;
  if (record.draft) return `${record.source.name} is saved as a Card Studio draft.`;
  const error = validation.issues.find((issue) => issue.severity === "error");
  if (error) return error.message;
  const ability = CATALOG_LEADER_ABILITY_METADATA[record.source.ability]?.name ?? record.source.ability;
  return `${ability} is not implemented for custom play.`;
};

export const buildCardStudioBlockedSources = (store: CardStudioStoreV1): CardStudioBlockedSources => ({
  cards: new Map(
    store.cards.flatMap((record) => {
      const reason = blockedReasonForCard(record, store);
      return reason ? [[record.source.sourceId, { sourceId: record.source.sourceId, kind: "card" as const, reason }]] : [];
    }),
  ),
  leaders: new Map(
    store.leaders.flatMap((record) => {
      const reason = blockedReasonForLeader(record, store);
      return reason ? [[record.source.sourceId, { sourceId: record.source.sourceId, kind: "leader" as const, reason }]] : [];
    }),
  ),
});

export const countDeckReferencesToSource = (
  decks: readonly CatalogDeckPreset[],
  sourceId: string,
): number =>
  decks.reduce((total, deck) => {
    const cardCount = deck.mainDeck.reduce((deckTotal, entry) => deckTotal + (entry.sourceId === sourceId ? entry.count : 0), 0);
    const sideCount = deck.sideDeck.reduce((deckTotal, entry) => deckTotal + (entry.sourceId === sourceId ? entry.count : 0), 0);
    return total + cardCount + sideCount + (deck.leaderSourceId === sourceId ? 1 : 0);
  }, 0);

export const removeCustomSourceFromDecks = (
  decks: readonly CatalogDeckPreset[],
  sourceId: string,
  sourceSets: Pick<CardStudioSourceSets, "leaders"> = { leaders: currentCatalogLeaders },
): readonly CatalogDeckPreset[] =>
  decks.map((deck) => {
    const nextMainDeck = deck.mainDeck.filter((entry) => entry.sourceId !== sourceId);
    const nextSideDeck = deck.sideDeck.filter((entry) => entry.sourceId !== sourceId);
    let leaderSourceId = deck.leaderSourceId;
    if (leaderSourceId === sourceId) {
      leaderSourceId =
        defaultLeaderForFaction(deck.faction, sourceSets.leaders as readonly CatalogLeaderSource[])?.sourceId ??
        currentCatalogLeaders.find((leader) => leader.faction === deck.faction)?.sourceId ??
        "";
    }
    return {
      ...deck,
      leaderSourceId,
      mainDeck: nextMainDeck,
      sideDeck: nextSideDeck,
    };
  });

export const customCardToCatalogSource = (record: CustomCardRecord): CatalogCardSource => record.source;

export const customLeaderToCatalogSource = (record: CustomLeaderRecord): CatalogLeaderSource => record.source;

export const factionCustomRecordCount = (store: CardStudioStoreV1, faction: CatalogFaction): number =>
  store.cards.filter((record) => record.source.faction === faction).length +
  store.leaders.filter((record) => record.source.faction === faction).length;
