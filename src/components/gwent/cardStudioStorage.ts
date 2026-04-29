import type {
  CatalogAbilityId,
  CatalogCardKind,
  CatalogFaction,
  CatalogLeaderAbilityId,
  CatalogRow,
} from "@/game/catalog";

import {
  CARD_STUDIO_SCHEMA_VERSION,
  CARD_STUDIO_STORAGE_KEY,
  type CardStudioStorageLike,
  type CardStudioStorageReadResult,
  type CardStudioStorageWriteResult,
  type CardStudioStoreV1,
  type CustomCardRecord,
  type CustomLeaderRecord,
} from "./cardStudioTypes";
import {
  normalizeCustomSourceId,
  sourceIdFromName,
} from "./cardStudioValidation";

const emptyStore = (): CardStudioStoreV1 => ({
  schemaVersion: CARD_STUDIO_SCHEMA_VERSION,
  cards: [],
  leaders: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((entry) => typeof entry === "string");

const stringValue = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const integerValue = (value: unknown, fallback = 0): number =>
  Number.isInteger(value) ? Number(value) : fallback;

const booleanValue = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const imageModeValue = (value: unknown, image: string): "path" | "data_url" =>
  value === "data_url" || image.startsWith("data:image/") ? "data_url" : "path";

const normalizeCardRecord = (value: unknown, index: number, now: string): CustomCardRecord | null => {
  if (!isRecord(value) || !isRecord(value.source)) {
    return null;
  }
  const source = value.source;
  const name = stringValue(source.name, `Custom Card ${index + 1}`).trim() || `Custom Card ${index + 1}`;
  const rawSourceId = stringValue(source.sourceId, sourceIdFromName(name, "card"));
  const image = stringValue(source.image, "/images/custom/custom-card.png");
  return {
    recordId: stringValue(value.recordId, `custom-card-${index + 1}`),
    createdAt: stringValue(value.createdAt, now),
    updatedAt: stringValue(value.updatedAt, now),
    imageMode: imageModeValue(value.imageMode, image),
    draft: booleanValue(value.draft, true),
    source: {
      sourceId: normalizeCustomSourceId(rawSourceId, "card"),
      name,
      faction: stringValue(source.faction, "neutral") as CatalogFaction,
      kind: stringValue(source.kind, "unit") as CatalogCardKind,
      strength: integerValue(source.strength, 0),
      rows: isStringArray(source.rows) ? (source.rows as CatalogRow[]) : ["close"],
      abilities: isStringArray(source.abilities) ? (source.abilities as CatalogAbilityId[]) : ["none"],
      tags: isStringArray(source.tags) ? source.tags : [],
      deckLimit: integerValue(source.deckLimit, 1),
      image,
      linkedSourceIds: isStringArray(source.linkedSourceIds) ? source.linkedSourceIds : undefined,
      description: typeof source.description === "string" ? source.description : undefined,
    },
  };
};

const normalizeLeaderRecord = (value: unknown, index: number, now: string): CustomLeaderRecord | null => {
  if (!isRecord(value) || !isRecord(value.source)) {
    return null;
  }
  const source = value.source;
  const name = stringValue(source.name, `Custom Leader ${index + 1}`).trim() || `Custom Leader ${index + 1}`;
  const rawSourceId = stringValue(source.sourceId, sourceIdFromName(name, "leader"));
  const image = stringValue(source.image, "/images/custom/custom-leader.png");
  return {
    recordId: stringValue(value.recordId, `custom-leader-${index + 1}`),
    createdAt: stringValue(value.createdAt, now),
    updatedAt: stringValue(value.updatedAt, now),
    imageMode: imageModeValue(value.imageMode, image),
    draft: booleanValue(value.draft, true),
    source: {
      sourceId: normalizeCustomSourceId(rawSourceId, "leader"),
      name,
      faction: stringValue(source.faction, "northern_realms") as Exclude<CatalogFaction, "neutral">,
      ability: stringValue(source.ability, "clear_weather") as CatalogLeaderAbilityId,
      image,
      description: typeof source.description === "string" ? source.description : undefined,
    },
  };
};

const uniqueRecordId = (preferred: string, used: Set<string>, fallback: string): string => {
  const base = preferred.trim() || fallback;
  let candidate = base;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
};

export const normalizeCardStudioStore = (
  store: Pick<CardStudioStoreV1, "cards" | "leaders" | "activeRecordId">,
): CardStudioStoreV1 => {
  const usedRecordIds = new Set<string>();
  const cards = store.cards.map((record, index) => ({
    ...record,
    recordId: uniqueRecordId(record.recordId, usedRecordIds, `custom-card-${index + 1}`),
  }));
  const leaders = store.leaders.map((record, index) => ({
    ...record,
    recordId: uniqueRecordId(record.recordId, usedRecordIds, `custom-leader-${index + 1}`),
  }));
  const activeRecordId =
    store.activeRecordId && [...cards, ...leaders].some((record) => record.recordId === store.activeRecordId)
      ? store.activeRecordId
      : cards[0]?.recordId ?? leaders[0]?.recordId;
  return {
    schemaVersion: CARD_STUDIO_SCHEMA_VERSION,
    cards,
    leaders,
    activeRecordId,
  };
};

export const readCardStudioStore = (
  storage: CardStudioStorageLike | undefined = typeof window === "undefined" ? undefined : window.localStorage,
): CardStudioStorageReadResult => {
  if (!storage) {
    return { store: emptyStore(), warning: "Custom catalog storage is unavailable; using in-memory content." };
  }

  try {
    const raw = storage.getItem(CARD_STUDIO_STORAGE_KEY);
    if (!raw) {
      return { store: emptyStore(), warning: null };
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      !isRecord(parsed) ||
      parsed.schemaVersion !== CARD_STUDIO_SCHEMA_VERSION ||
      !Array.isArray(parsed.cards) ||
      !Array.isArray(parsed.leaders)
    ) {
      return { store: emptyStore(), warning: "Saved custom catalog was invalid; started with an empty studio." };
    }
    const now = new Date(0).toISOString();
    const cards = parsed.cards.flatMap((entry, index) => {
      const record = normalizeCardRecord(entry, index, now);
      return record ? [record] : [];
    });
    const leaders = parsed.leaders.flatMap((entry, index) => {
      const record = normalizeLeaderRecord(entry, index, now);
      return record ? [record] : [];
    });
    const skipped = parsed.cards.length + parsed.leaders.length - cards.length - leaders.length;
    return {
      store: normalizeCardStudioStore({
        cards,
        leaders,
        activeRecordId: typeof parsed.activeRecordId === "string" ? parsed.activeRecordId : undefined,
      }),
      warning: skipped > 0 ? `${skipped} custom record${skipped === 1 ? "" : "s"} could not be edited safely and were skipped.` : null,
    };
  } catch {
    return { store: emptyStore(), warning: "Saved custom catalog could not be read; started with an empty studio." };
  }
};

export const writeCardStudioStore = (
  store: CardStudioStoreV1,
  storage: CardStudioStorageLike | undefined = typeof window === "undefined" ? undefined : window.localStorage,
): CardStudioStorageWriteResult => {
  if (!storage) {
    return { ok: false, warning: "Custom catalog storage is unavailable; changes are in-memory only." };
  }
  try {
    storage.setItem(CARD_STUDIO_STORAGE_KEY, JSON.stringify(normalizeCardStudioStore(store)));
    return { ok: true, warning: null };
  } catch {
    return { ok: false, warning: "Custom catalog storage failed; changes are in-memory only." };
  }
};
