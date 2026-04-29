import type {
  CatalogCardSource,
  CatalogLeaderSource,
} from "@/game/catalog";

export const CARD_STUDIO_STORAGE_KEY = "gwent_custom_catalog_v1";
export const CARD_STUDIO_SCHEMA_VERSION = "custom-catalog-v1";
export const CARD_STUDIO_RECORD_SCHEMA_VERSION = "custom-catalog-record-v1";
export const CARD_STUDIO_BUNDLE_SCHEMA_VERSION = "custom-catalog-bundle-v1";
export const CARD_STUDIO_MAX_IMAGE_BYTES = 1024 * 1024;

export type CardStudioRecordKind = "card" | "leader";
export type CardStudioImageMode = "path" | "data_url";

export interface CardStudioIssue {
  readonly severity: "error" | "warning";
  readonly code: string;
  readonly field?: string;
  readonly message: string;
}

export interface CustomCardRecord {
  readonly recordId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly source: CatalogCardSource;
  readonly imageMode: CardStudioImageMode;
  readonly draft: boolean;
}

export interface CustomLeaderRecord {
  readonly recordId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly source: CatalogLeaderSource;
  readonly imageMode: CardStudioImageMode;
  readonly draft: boolean;
}

export type CustomCatalogRecord = CustomCardRecord | CustomLeaderRecord;

export interface CardStudioStoreV1 {
  readonly schemaVersion: typeof CARD_STUDIO_SCHEMA_VERSION;
  readonly cards: readonly CustomCardRecord[];
  readonly leaders: readonly CustomLeaderRecord[];
  readonly activeRecordId?: string;
}

export interface CardStudioStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CardStudioStorageReadResult {
  readonly store: CardStudioStoreV1;
  readonly warning: string | null;
}

export interface CardStudioStorageWriteResult {
  readonly ok: boolean;
  readonly warning: string | null;
}

export interface CardStudioValidationContext {
  readonly currentCards: readonly CatalogCardSource[];
  readonly currentLeaders: readonly CatalogLeaderSource[];
  readonly customCards: readonly CustomCardRecord[];
  readonly customLeaders: readonly CustomLeaderRecord[];
  readonly recordId?: string;
}

export interface CardStudioValidationResult {
  readonly issues: readonly CardStudioIssue[];
  readonly structurallyValid: boolean;
  readonly playable: boolean;
}

export interface CardStudioSourceSets {
  readonly cards: readonly CatalogCardSource[];
  readonly leaders: readonly CatalogLeaderSource[];
}

export interface CardStudioBlockedSource {
  readonly sourceId: string;
  readonly kind: CardStudioRecordKind;
  readonly reason: string;
}

export interface CardStudioBlockedSources {
  readonly cards: ReadonlyMap<string, CardStudioBlockedSource>;
  readonly leaders: ReadonlyMap<string, CardStudioBlockedSource>;
}

export interface CardStudioRecordExportWrapper {
  readonly schemaVersion: typeof CARD_STUDIO_RECORD_SCHEMA_VERSION;
  readonly record: CustomCatalogRecord;
}

export interface CardStudioBundleExportWrapper {
  readonly schemaVersion: typeof CARD_STUDIO_BUNDLE_SCHEMA_VERSION;
  readonly cards: readonly CustomCardRecord[];
  readonly leaders: readonly CustomLeaderRecord[];
}

export interface CardStudioImportResult {
  readonly ok: boolean;
  readonly cards: readonly CustomCardRecord[];
  readonly leaders: readonly CustomLeaderRecord[];
  readonly errors: readonly string[];
  readonly notices: readonly string[];
}
