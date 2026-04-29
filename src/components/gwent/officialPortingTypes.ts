import type { CatalogCardSource } from "@/game/catalog";
import type {
  OfficialImageCandidate,
  OfficialImageCrop,
  OfficialLeaderCandidate,
  OfficialPortingStatus,
  OfficialPortingSummary,
} from "@/data/catalog/official";

export const OFFICIAL_PORTING_STORAGE_KEY = "gwent_official_porting_v1";
export const OFFICIAL_PORTING_SCHEMA_VERSION = "official-porting-v1";

export type OfficialPortingRecordKind = "card" | "leader";

export type OfficialPortingDataOverride =
  | Partial<CatalogCardSource>
  | Partial<OfficialLeaderCandidate>;

export interface OfficialPortingStoreV1 {
  readonly schemaVersion: typeof OFFICIAL_PORTING_SCHEMA_VERSION;
  readonly updatedAt: string;
  readonly imageOverridesBySourceId: Readonly<Record<string, OfficialImageCandidate>>;
  readonly dataOverridesBySourceId: Readonly<Record<string, OfficialPortingDataOverride>>;
  readonly approvedSourceIds: readonly string[];
  readonly notesBySourceId: Readonly<Record<string, string>>;
  readonly activeSourceId?: string;
}

export interface OfficialPortingStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface OfficialPortingStorageReadResult {
  readonly store: OfficialPortingStoreV1;
  readonly warning: string | null;
}

export interface OfficialPortingStorageWriteResult {
  readonly ok: boolean;
  readonly warning: string | null;
}

export interface OfficialPortingIssueSummary {
  readonly total: number;
  readonly byStatus: Readonly<Record<OfficialPortingStatus, number>>;
  readonly unsupportedAbilities: Readonly<Record<string, number>>;
  readonly unsupportedLeaderAbilities: Readonly<Record<string, number>>;
  readonly sourceIdConflicts: readonly string[];
}

export interface OfficialPortingReviewBundle {
  readonly schemaVersion: typeof OFFICIAL_PORTING_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly scrape: OfficialPortingSummary;
  readonly imageOverridesBySourceId: Readonly<Record<string, OfficialImageCandidate>>;
  readonly dataOverridesBySourceId: Readonly<Record<string, OfficialPortingDataOverride>>;
  readonly approvedSourceIds: readonly string[];
  readonly notesBySourceId: Readonly<Record<string, string>>;
  readonly unresolvedIssueSummary: OfficialPortingIssueSummary;
}

export interface OfficialPortingImportResult {
  readonly ok: boolean;
  readonly store?: OfficialPortingStoreV1;
  readonly errors: readonly string[];
  readonly notices: readonly string[];
}

export interface OfficialPortingRecordViewModel {
  readonly sourceId: string;
  readonly originalSourceId: string;
  readonly kind: OfficialPortingRecordKind;
  readonly name: string;
  readonly faction: string;
  readonly typeLabel: string;
  readonly status: OfficialPortingStatus;
  readonly issues: readonly string[];
  readonly approved: boolean;
  readonly matchedCurrentSourceId?: string;
  readonly image: OfficialImageCandidate;
  readonly note: string;
}

export interface OfficialPortingFilters {
  readonly search: string;
  readonly faction: "all" | string;
  readonly kind: "all" | OfficialPortingRecordKind | "unit" | "hero" | "special";
  readonly status: "all" | OfficialPortingStatus;
  readonly missingImageOnly: boolean;
  readonly ruleGapOnly: boolean;
  readonly approvedOnly: boolean;
}

export const defaultOfficialCrop = (): OfficialImageCrop => ({
  fit: "contain",
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  cropBottomPx: 15,
});
