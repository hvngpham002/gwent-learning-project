import {
  game8OfficialCardCandidates,
  game8OfficialLeaderCandidates,
  officialPortingSummary,
  type OfficialCardCandidate,
  type OfficialLeaderCandidate,
  type OfficialPortingStatus,
} from "@/data/catalog/official";

import {
  OFFICIAL_PORTING_SCHEMA_VERSION,
  type OfficialPortingImportResult,
  type OfficialPortingIssueSummary,
  type OfficialPortingReviewBundle,
  type OfficialPortingStoreV1,
} from "./officialPortingTypes";
import { normalizeOfficialPortingStore } from "./officialPortingStorage";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const allStatuses: readonly OfficialPortingStatus[] = [
  "ready_for_catalog",
  "needs_image",
  "needs_rule",
  "needs_leader_rule",
  "needs_review",
];

export const buildOfficialIssueSummary = (
  cards: readonly OfficialCardCandidate[] = game8OfficialCardCandidates,
  leaders: readonly OfficialLeaderCandidate[] = game8OfficialLeaderCandidates,
): OfficialPortingIssueSummary => {
  const byStatus = Object.fromEntries(allStatuses.map((status) => [status, 0])) as Record<OfficialPortingStatus, number>;
  [...cards, ...leaders].forEach((candidate) => {
    byStatus[candidate.portingStatus] += 1;
  });
  return {
    total: cards.length + leaders.length,
    byStatus,
    unsupportedAbilities: officialPortingSummary.unsupportedAbilityCounts,
    unsupportedLeaderAbilities: officialPortingSummary.unsupportedLeaderAbilityCounts,
    sourceIdConflicts: officialPortingSummary.sourceIdConflicts,
  };
};

export const buildOfficialPortingReviewBundle = (
  store: OfficialPortingStoreV1,
): OfficialPortingReviewBundle => ({
  schemaVersion: OFFICIAL_PORTING_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  scrape: officialPortingSummary,
  imageOverridesBySourceId: store.imageOverridesBySourceId,
  dataOverridesBySourceId: store.dataOverridesBySourceId,
  approvedSourceIds: store.approvedSourceIds,
  notesBySourceId: store.notesBySourceId,
  unresolvedIssueSummary: buildOfficialIssueSummary(),
});

export const stringifyOfficialPortingReviewBundle = (store: OfficialPortingStoreV1): string =>
  JSON.stringify(buildOfficialPortingReviewBundle(store), null, 2);

export const parseOfficialPortingReviewImport = (text: string): OfficialPortingImportResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      errors: [error instanceof Error ? error.message : "Invalid JSON."],
      notices: [],
    };
  }

  if (!isRecord(parsed) || parsed.schemaVersion !== OFFICIAL_PORTING_SCHEMA_VERSION) {
    return {
      ok: false,
      errors: ["Import must use official-porting-v1 schemaVersion."],
      notices: [],
    };
  }

  const source = isRecord(parsed.scrape) ? parsed : { ...parsed, scrape: undefined };
  const store = normalizeOfficialPortingStore(source);
  const importedImages = Object.keys(store.imageOverridesBySourceId).length;
  const importedData = Object.keys(store.dataOverridesBySourceId).length;
  return {
    ok: true,
    store,
    errors: [],
    notices: [`Imported ${importedImages} image override${importedImages === 1 ? "" : "s"} and ${importedData} data override${importedData === 1 ? "" : "s"}.`],
  };
};
