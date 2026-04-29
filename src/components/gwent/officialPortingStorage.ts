import type { OfficialImageCandidate, OfficialImageCrop } from "@/data/catalog/official";

import {
  OFFICIAL_PORTING_SCHEMA_VERSION,
  OFFICIAL_PORTING_STORAGE_KEY,
  defaultOfficialCrop,
  type OfficialPortingDataOverride,
  type OfficialPortingStorageLike,
  type OfficialPortingStorageReadResult,
  type OfficialPortingStorageWriteResult,
  type OfficialPortingStoreV1,
} from "./officialPortingTypes";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringValue = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

const booleanValue = (value: unknown, fallback = false): boolean =>
  typeof value === "boolean" ? value : fallback;

const numberInRange = (value: unknown, fallback: number, min: number, max: number): number => {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, numeric));
};

export const clampOfficialCrop = (value: unknown): OfficialImageCrop => {
  const crop = isRecord(value) ? value : {};
  const fallback = defaultOfficialCrop();
  return {
    fit: crop.fit === "cover" ? "cover" : "contain",
    scale: numberInRange(crop.scale, fallback.scale, 0.5, 2),
    offsetX: numberInRange(crop.offsetX, fallback.offsetX, -100, 100),
    offsetY: numberInRange(crop.offsetY, fallback.offsetY, -100, 100),
    cropBottomPx: numberInRange(crop.cropBottomPx, fallback.cropBottomPx, 0, 80),
  };
};

export const createEmptyOfficialPortingStore = (): OfficialPortingStoreV1 => ({
  schemaVersion: OFFICIAL_PORTING_SCHEMA_VERSION,
  updatedAt: new Date(0).toISOString(),
  imageOverridesBySourceId: {},
  dataOverridesBySourceId: {},
  approvedSourceIds: [],
  notesBySourceId: {},
});

const normalizeImageOverride = (value: unknown, sourceId: string): OfficialImageCandidate | null => {
  if (!isRecord(value)) return null;
  const preferredImagePath = stringValue(value.preferredImagePath);
  if (!preferredImagePath) return null;
  return {
    sourceId: stringValue(value.sourceId, sourceId) || sourceId,
    preferredImagePath,
    game8ImageUrl: stringValue(value.game8ImageUrl) || undefined,
    existsInPublicImages: booleanValue(value.existsInPublicImages),
    crop: clampOfficialCrop(value.crop),
    approved: booleanValue(value.approved),
    browserLocalPreview: booleanValue(value.browserLocalPreview) || undefined,
  };
};

const normalizeImageOverrides = (value: unknown): Record<string, OfficialImageCandidate> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([sourceId, override]) => {
      const normalized = normalizeImageOverride(override, sourceId);
      return normalized ? [[sourceId, normalized]] : [];
    }),
  );
};

const normalizeDataOverride = (value: unknown): OfficialPortingDataOverride | null => {
  if (!isRecord(value)) return null;
  const allowedKeys = new Set([
    "sourceId",
    "name",
    "faction",
    "kind",
    "strength",
    "rows",
    "abilities",
    "tags",
    "deckLimit",
    "image",
    "description",
    "mappedAbilityId",
    "pendingAbilityId",
    "leaderEffectText",
  ]);
  return Object.fromEntries(
    Object.entries(value).filter(([key, entry]) => {
      if (!allowedKeys.has(key)) return false;
      if (Array.isArray(entry)) {
        return entry.every((arrayEntry) => typeof arrayEntry === "string");
      }
      return ["string", "number", "boolean"].includes(typeof entry);
    }),
  ) as OfficialPortingDataOverride;
};

const normalizeDataOverrides = (value: unknown): Record<string, OfficialPortingDataOverride> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([sourceId, override]) => {
      const normalized = normalizeDataOverride(override);
      return normalized ? [[sourceId, normalized]] : [];
    }),
  );
};

const normalizeStringRecord = (value: unknown): Record<string, string> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) =>
      typeof entry === "string" ? [[key, entry]] : [],
    ),
  );
};

export const normalizeOfficialPortingStore = (value: unknown): OfficialPortingStoreV1 => {
  if (!isRecord(value)) return createEmptyOfficialPortingStore();
  const imageOverridesBySourceId = normalizeImageOverrides(value.imageOverridesBySourceId);
  const dataOverridesBySourceId = normalizeDataOverrides(value.dataOverridesBySourceId);
  const notesBySourceId = normalizeStringRecord(value.notesBySourceId);
  const approvedSourceIds = Array.isArray(value.approvedSourceIds)
    ? Array.from(new Set(value.approvedSourceIds.filter((entry): entry is string => typeof entry === "string")))
    : [];
  return {
    schemaVersion: OFFICIAL_PORTING_SCHEMA_VERSION,
    updatedAt: stringValue(value.updatedAt, new Date(0).toISOString()),
    imageOverridesBySourceId,
    dataOverridesBySourceId,
    approvedSourceIds,
    notesBySourceId,
    activeSourceId: stringValue(value.activeSourceId) || undefined,
  };
};

export const readOfficialPortingStore = (
  storage: OfficialPortingStorageLike | undefined = typeof window === "undefined" ? undefined : window.localStorage,
): OfficialPortingStorageReadResult => {
  if (!storage) {
    return {
      store: createEmptyOfficialPortingStore(),
      warning: "Official porting storage is unavailable; using in-memory review state.",
    };
  }
  try {
    const raw = storage.getItem(OFFICIAL_PORTING_STORAGE_KEY);
    if (!raw) {
      return { store: createEmptyOfficialPortingStore(), warning: null };
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.schemaVersion !== OFFICIAL_PORTING_SCHEMA_VERSION) {
      return {
        store: createEmptyOfficialPortingStore(),
        warning: "Saved official porting review state was invalid; started empty.",
      };
    }
    return { store: normalizeOfficialPortingStore(parsed), warning: null };
  } catch {
    return {
      store: createEmptyOfficialPortingStore(),
      warning: "Saved official porting review state could not be read; started empty.",
    };
  }
};

export const writeOfficialPortingStore = (
  store: OfficialPortingStoreV1,
  storage: OfficialPortingStorageLike | undefined = typeof window === "undefined" ? undefined : window.localStorage,
): OfficialPortingStorageWriteResult => {
  if (!storage) {
    return { ok: false, warning: "Official porting storage is unavailable; changes are in-memory only." };
  }
  try {
    storage.setItem(
      OFFICIAL_PORTING_STORAGE_KEY,
      JSON.stringify(normalizeOfficialPortingStore({ ...store, updatedAt: new Date().toISOString() })),
    );
    return { ok: true, warning: null };
  } catch {
    return { ok: false, warning: "Official porting storage failed; changes are in-memory only." };
  }
};
