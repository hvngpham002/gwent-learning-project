import {
  game8OfficialCardCandidates,
  game8OfficialImageCandidates,
  game8OfficialLeaderCandidates,
  officialPortingSummary,
  type OfficialCardCandidate,
  type OfficialImageCandidate,
  type OfficialLeaderCandidate,
} from "@/data/catalog/official";

import {
  OFFICIAL_PORTING_SCHEMA_VERSION,
  type OfficialPortingDataOverride,
  type OfficialPortingFilters,
  type OfficialPortingRecordViewModel,
  type OfficialPortingStoreV1,
} from "./officialPortingTypes";
import { createEmptyOfficialPortingStore } from "./officialPortingStorage";

export const defaultOfficialPortingFilters = (): OfficialPortingFilters => ({
  search: "",
  faction: "all",
  kind: "all",
  status: "all",
  missingImageOnly: false,
  ruleGapOnly: false,
  approvedOnly: false,
});

const imageBySourceId = new Map(game8OfficialImageCandidates.map((image) => [image.sourceId, image]));
const defaultImageForSource = (sourceId: string): OfficialImageCandidate => ({
  sourceId,
  preferredImagePath: "/images/official/missing.png",
  existsInPublicImages: false,
  crop: {
    fit: "contain",
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    cropBottomPx: 15,
  },
  approved: false,
});

const imageForSource = (store: OfficialPortingStoreV1, sourceId: string): OfficialImageCandidate =>
  store.imageOverridesBySourceId[sourceId] ?? imageBySourceId.get(sourceId) ?? defaultImageForSource(sourceId);

const cardOverride = (
  candidate: OfficialCardCandidate,
  store: OfficialPortingStoreV1,
): OfficialCardCandidate["source"] => ({
  ...candidate.source,
  ...(store.dataOverridesBySourceId[candidate.source.sourceId] as Partial<OfficialCardCandidate["source"]> | undefined),
});

const leaderOverride = (
  candidate: OfficialLeaderCandidate,
  store: OfficialPortingStoreV1,
): OfficialLeaderCandidate => ({
  ...candidate,
  ...(store.dataOverridesBySourceId[candidate.sourceId] as Partial<OfficialLeaderCandidate> | undefined),
});

export const buildOfficialPortingRecords = (
  store: OfficialPortingStoreV1 = createEmptyOfficialPortingStore(),
): readonly OfficialPortingRecordViewModel[] => {
  const approved = new Set(store.approvedSourceIds);
  const cardRecords = game8OfficialCardCandidates.map((candidate): OfficialPortingRecordViewModel => {
    const source = cardOverride(candidate, store);
    const image = imageForSource(store, candidate.source.sourceId);
    return {
      sourceId: source.sourceId,
      originalSourceId: candidate.source.sourceId,
      kind: "card",
      name: source.name,
      faction: source.faction,
      typeLabel: source.kind,
      status: candidate.portingStatus,
      issues: candidate.portingIssues,
      approved: approved.has(candidate.source.sourceId),
      matchedCurrentSourceId: candidate.matchedCurrentSourceId,
      image,
      note: store.notesBySourceId[candidate.source.sourceId] ?? "",
    };
  });
  const leaderRecords = game8OfficialLeaderCandidates.map((candidate): OfficialPortingRecordViewModel => {
    const leader = leaderOverride(candidate, store);
    const image = imageForSource(store, candidate.sourceId);
    return {
      sourceId: leader.sourceId,
      originalSourceId: candidate.sourceId,
      kind: "leader",
      name: leader.name,
      faction: leader.faction,
      typeLabel: "leader",
      status: candidate.portingStatus,
      issues: candidate.portingIssues,
      approved: approved.has(candidate.sourceId),
      matchedCurrentSourceId: candidate.matchedCurrentSourceId,
      image,
      note: store.notesBySourceId[candidate.sourceId] ?? "",
    };
  });
  return [...cardRecords, ...leaderRecords].sort((a, b) => a.sourceId.localeCompare(b.sourceId));
};

export const filterOfficialPortingRecords = (
  records: readonly OfficialPortingRecordViewModel[],
  filters: OfficialPortingFilters,
): readonly OfficialPortingRecordViewModel[] => {
  const search = filters.search.trim().toLowerCase();
  return records.filter((record) => {
    if (search && !`${record.name} ${record.sourceId}`.toLowerCase().includes(search)) return false;
    if (filters.faction !== "all" && record.faction !== filters.faction) return false;
    if (filters.kind === "card" && record.kind !== "card") return false;
    if (filters.kind === "leader" && record.kind !== "leader") return false;
    if (
      (filters.kind === "unit" || filters.kind === "hero" || filters.kind === "special") &&
      record.typeLabel !== filters.kind
    ) {
      return false;
    }
    if (filters.status !== "all" && record.status !== filters.status) return false;
    if (filters.missingImageOnly && record.image.existsInPublicImages) return false;
    if (filters.ruleGapOnly && record.status !== "needs_rule" && record.status !== "needs_leader_rule") {
      return false;
    }
    if (filters.approvedOnly && !record.approved) return false;
    return true;
  });
};

const nextStore = (
  store: OfficialPortingStoreV1,
  patch: Partial<OfficialPortingStoreV1>,
): OfficialPortingStoreV1 => ({
  ...store,
  ...patch,
  schemaVersion: OFFICIAL_PORTING_SCHEMA_VERSION,
  updatedAt: new Date().toISOString(),
});

export const setOfficialActiveSource = (
  store: OfficialPortingStoreV1,
  sourceId: string,
): OfficialPortingStoreV1 => nextStore(store, { activeSourceId: sourceId });

export const upsertOfficialImageOverride = (
  store: OfficialPortingStoreV1,
  sourceId: string,
  override: OfficialImageCandidate,
): OfficialPortingStoreV1 =>
  nextStore(store, {
    imageOverridesBySourceId: {
      ...store.imageOverridesBySourceId,
      [sourceId]: override,
    },
  });

export const upsertOfficialDataOverride = (
  store: OfficialPortingStoreV1,
  sourceId: string,
  override: OfficialPortingDataOverride,
): OfficialPortingStoreV1 =>
  nextStore(store, {
    dataOverridesBySourceId: {
      ...store.dataOverridesBySourceId,
      [sourceId]: {
        ...(store.dataOverridesBySourceId[sourceId] ?? {}),
        ...override,
      },
    },
  });

export const setOfficialNote = (
  store: OfficialPortingStoreV1,
  sourceId: string,
  note: string,
): OfficialPortingStoreV1 =>
  nextStore(store, {
    notesBySourceId: {
      ...store.notesBySourceId,
      [sourceId]: note,
    },
  });

export const setOfficialApproved = (
  store: OfficialPortingStoreV1,
  sourceId: string,
  approved: boolean,
): OfficialPortingStoreV1 => {
  const approvedSet = new Set(store.approvedSourceIds);
  if (approved) {
    approvedSet.add(sourceId);
  } else {
    approvedSet.delete(sourceId);
  }
  return nextStore(store, { approvedSourceIds: [...approvedSet].sort() });
};

export const officialPortingCounts = (store: OfficialPortingStoreV1 = createEmptyOfficialPortingStore()) => {
  const records = buildOfficialPortingRecords(store);
  return {
    total: officialPortingSummary.totalCandidateCount,
    approved: store.approvedSourceIds.length,
    missingImages: records.filter((record) => !record.image.existsInPublicImages).length,
    ruleGaps: records.filter((record) => record.status === "needs_rule" || record.status === "needs_leader_rule").length,
  };
};

export const findOfficialRecord = (
  store: OfficialPortingStoreV1,
  sourceId?: string,
): OfficialPortingRecordViewModel => {
  const records = buildOfficialPortingRecords(store);
  return (
    records.find((record) => record.originalSourceId === sourceId || record.sourceId === sourceId) ??
    records[0] ??
    {
      sourceId: "none",
      originalSourceId: "none",
      kind: "card",
      name: "No candidates",
      faction: "neutral",
      typeLabel: "unit",
      status: "needs_review",
      issues: ["No official candidates are available."],
      approved: false,
      image: defaultImageForSource("none"),
      note: "",
    }
  );
};
