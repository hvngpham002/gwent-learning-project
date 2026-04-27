import { currentDeckPresets } from "@/data/catalog";
import type { CatalogDeckPreset } from "@/game/catalog";

import type { DeckBuilderStoreV1 } from "./deckBuilderTypes";
import { cloneDeckPresets, normalizeDeckPreset } from "./deckBuilderViewModel";

export const AUTHENTIC_DECK_STORAGE_KEY = "gwent_authentic_decks_v1";
export const AUTHENTIC_DECK_SCHEMA_VERSION = "authentic-decks-v1";

export interface DeckBuilderStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface DeckBuilderStorageReadResult {
  readonly store: DeckBuilderStoreV1;
  readonly warning: string | null;
}

export interface DeckBuilderStorageWriteResult {
  readonly ok: boolean;
  readonly warning: string | null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isDeckEntry = (value: unknown): value is { sourceId: string; count: number } =>
  isRecord(value) && typeof value.sourceId === "string" && Number.isInteger(value.count);

const isDeckPreset = (value: unknown): value is CatalogDeckPreset =>
  isRecord(value) &&
  typeof value.presetId === "string" &&
  typeof value.name === "string" &&
  typeof value.faction === "string" &&
  typeof value.leaderSourceId === "string" &&
  Array.isArray(value.mainDeck) &&
  value.mainDeck.every(isDeckEntry) &&
  Array.isArray(value.sideDeck) &&
  value.sideDeck.every(isDeckEntry);

const makeSeedStore = (
  seedDecks: readonly CatalogDeckPreset[] = currentDeckPresets,
): DeckBuilderStoreV1 => {
  const decks = cloneDeckPresets(seedDecks).map((deck) => ({
    ...deck,
    presetId: `local-${deck.presetId}`,
  }));
  return {
    schemaVersion: AUTHENTIC_DECK_SCHEMA_VERSION,
    decks,
    activePresetId: decks[0]?.presetId,
  };
};

export const normalizeDeckStore = (
  decks: readonly CatalogDeckPreset[],
  activePresetId?: string,
): DeckBuilderStoreV1 => {
  const normalizedDecks = decks.map(normalizeDeckPreset);
  return {
    schemaVersion: AUTHENTIC_DECK_SCHEMA_VERSION,
    decks: normalizedDecks,
    activePresetId:
      activePresetId && normalizedDecks.some((deck) => deck.presetId === activePresetId)
        ? activePresetId
        : normalizedDecks[0]?.presetId,
  };
};

export const readDeckBuilderStore = (
  storage: DeckBuilderStorageLike | undefined = typeof window === "undefined" ? undefined : window.localStorage,
  seedDecks: readonly CatalogDeckPreset[] = currentDeckPresets,
): DeckBuilderStorageReadResult => {
  const seedStore = makeSeedStore(seedDecks);
  if (!storage) {
    return { store: seedStore, warning: "Local deck storage is unavailable; using in-memory decks." };
  }

  try {
    const raw = storage.getItem(AUTHENTIC_DECK_STORAGE_KEY);
    if (!raw) {
      return { store: seedStore, warning: null };
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== AUTHENTIC_DECK_SCHEMA_VERSION ||
      !Array.isArray(parsed.decks) ||
      parsed.decks.length === 0 ||
      !parsed.decks.every(isDeckPreset)
    ) {
      return { store: seedStore, warning: "Saved local decks were invalid; seeded from catalog presets." };
    }

    return {
      store: normalizeDeckStore(
        parsed.decks,
        typeof parsed.activePresetId === "string" ? parsed.activePresetId : undefined,
      ),
      warning: null,
    };
  } catch {
    return { store: seedStore, warning: "Saved local decks could not be read; seeded from catalog presets." };
  }
};

export const writeDeckBuilderStore = (
  store: DeckBuilderStoreV1,
  storage: DeckBuilderStorageLike | undefined = typeof window === "undefined" ? undefined : window.localStorage,
): DeckBuilderStorageWriteResult => {
  if (!storage) {
    return { ok: false, warning: "Local deck storage is unavailable; changes are in-memory only." };
  }

  try {
    storage.setItem(AUTHENTIC_DECK_STORAGE_KEY, JSON.stringify(normalizeDeckStore(store.decks, store.activePresetId)));
    return { ok: true, warning: null };
  } catch {
    return { ok: false, warning: "Local deck storage failed; changes are in-memory only." };
  }
};
