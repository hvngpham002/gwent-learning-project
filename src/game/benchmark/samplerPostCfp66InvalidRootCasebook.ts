import type { MatchPhase, SeatId } from "@/game/core";

import type {
  SamplerInvalidRootRecord,
  SamplerInvalidRootSummary,
} from "./samplerInvalidRoots";
import type { SamplerMaterializationSummary } from "./samplerMaterialization";
import type {
  PublicZoneProvenanceLabel,
  SamplerPublicZoneProvenanceRecord,
  SamplerPublicZoneProvenanceSummary,
} from "./samplerPublicZoneProvenance";

export type SamplerPostCfp66InvalidRootCasebookRootSchemaVersion =
  "sampler-post-cfp66-invalid-root-casebook-root-v1";
export type SamplerPostCfp66InvalidRootCasebookSummarySchemaVersion =
  "sampler-post-cfp66-invalid-root-casebook-summary-v1";

export type SamplerPostCfp66PrimaryClassification =
  | "candidate_valid_root_only_skip"
  | "candidate_deeper_reconstruction"
  | "classification_unavailable";

export type SamplerPostCfp66TransferClassification =
  | "public_transfer_memory_not_applicable"
  | "no_known_hidden_transfer_at_invalid_root"
  | "hidden_hand_transfer_present"
  | "hidden_deck_transfer_present"
  | "public_transfer_adjustment_present";

export type SamplerPostCfp66PersistentDeficitClassification =
  | "persistent_public_zone_count_deficit"
  | "classification_unavailable";

export type SamplerPostCfp66DeficitSizeClassification =
  | "one_card_deficit"
  | "multi_card_deficit"
  | "classification_unavailable";

export type SamplerPostCfp66PhaseClassification =
  | "playing_phase"
  | "round_end_phase"
  | "classification_unavailable";

export interface SamplerPostCfp66SourceArtifactReference {
  label: string;
  relativePath: string;
  sha256: string;
}

export interface SamplerPostCfp66CountPercentage {
  count: number;
  percentageOfInvalidRoots: number;
}

export interface SamplerPostCfp66PublicTransferScalarBucketCounts {
  zeroKnownHiddenTransfer: number;
  hiddenHandTransferPresent: number;
  hiddenDeckTransferPresent: number;
  publicTransferAdjustmentPresent: number;
  uncoveredDeficitPresent: number;
}

export interface SamplerPostCfp66PublicTransferScalarTotals {
  visiblePublicMemoryReferences: number;
  knownHiddenHandCards: number;
  knownHiddenDeckCards: number;
  mainDeckAttributableKnownHiddenCards: number;
  sideDeckOnlyKnownHiddenCards: number;
  offPriorKnownHiddenCards: number;
  publicTransferAdjustments: number;
  uncoveredDeficitCards: number;
  incoherentRoots: number;
}

export interface SamplerPostCfp66SkipCounterDimensions {
  suiteId: string;
  phase: MatchPhase;
  round: string;
  matchupId: string;
  policyId: string;
  faction: string;
  deckPresetId: string;
  provenanceLabel: PublicZoneProvenanceLabel | "classification_unavailable";
  invalidReason: string;
}

export interface SamplerPostCfp66InvalidRootCasebookRecord {
  schemaVersion: SamplerPostCfp66InvalidRootCasebookRootSchemaVersion;
  casebookRunId: string;
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorGroupId?: string;
  mirrorIndex?: 0 | 1;
  step: number;
  decisionIndex: number;
  phase: MatchPhase;
  round: number;
  seatId: SeatId;
  policyId: string;
  faction: string;
  deckPresetId: string;
  invalidReason: string;
  cFp62Classification: string;
  provenanceLabel: PublicZoneProvenanceLabel | "classification_unavailable";
  primaryClassification: SamplerPostCfp66PrimaryClassification;
  transferClassification: SamplerPostCfp66TransferClassification;
  persistentDeficitClassification: SamplerPostCfp66PersistentDeficitClassification;
  deficitSizeClassification: SamplerPostCfp66DeficitSizeClassification;
  phaseClassification: SamplerPostCfp66PhaseClassification;
  priorDeficitCount: number;
  publicKnownCardCount: number;
  fixedKnownHandCardCount: number;
  requiredHiddenDrawCount: number;
  priorRemainingCardCount: number;
  publicZoneReferenceCount: number;
  publicZoneDiversityCount: number;
  publicTransferMemoryVisibleCardCount: number;
  publicTransferKnownHiddenHandCount: number;
  publicTransferKnownHiddenDeckCount: number;
  publicTransferAdjustmentCount: number;
  publicTransferUncoveredDeficitCount: number;
  uncoveredPriorDeficitCount: number;
  zeroKnownHiddenTransferAtInvalidRoot: boolean;
  publicTransferAdjustmentPresent: boolean;
  uncoveredDeficitPresent: boolean;
  candidateValidRootOnlySkip: boolean;
  candidateDeeperReconstruction: boolean;
  skipCounterDimensions: SamplerPostCfp66SkipCounterDimensions;
  rootPublicFingerprint: string;
}

export interface SamplerPostCfp66InvalidRootCasebookSummary {
  schemaVersion: SamplerPostCfp66InvalidRootCasebookSummarySchemaVersion;
  casebookRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  totalRootCount: number;
  validRootCount: number;
  invalidRootCount: number;
  invalidRootPercentage: number;
  matchCount: number;
  sourceSamplerRunIds: {
    materialization: string;
    invalidRoots: string;
    publicZoneProvenance: string;
  };
  sourceArtifactReferences: readonly SamplerPostCfp66SourceArtifactReference[];
  sourceConsistency: {
    materializationRootCount: number;
    materializationValidRootCount: number;
    materializationInvalidRootCount: number;
    invalidRootRecordCount: number;
    provenanceRootRecordCount: number;
    missingProvenanceRootCount: number;
    extraProvenanceRootCount: number;
    validRootRecordsInCasebook: number;
  };
  primaryClassificationCounts: Record<SamplerPostCfp66PrimaryClassification, number>;
  transferClassificationCounts: Record<SamplerPostCfp66TransferClassification, number>;
  persistentDeficitClassificationCounts: Record<SamplerPostCfp66PersistentDeficitClassification, number>;
  deficitSizeClassificationCounts: Record<SamplerPostCfp66DeficitSizeClassification, number>;
  phaseClassificationCounts: Record<SamplerPostCfp66PhaseClassification, number>;
  invalidRootCountsByPhase: Record<string, SamplerPostCfp66CountPercentage>;
  invalidRootCountsByRound: Record<string, SamplerPostCfp66CountPercentage>;
  invalidRootCountsByFaction: Record<string, SamplerPostCfp66CountPercentage>;
  invalidRootCountsByPolicy: Record<string, SamplerPostCfp66CountPercentage>;
  invalidRootCountsByDeckPreset: Record<string, SamplerPostCfp66CountPercentage>;
  invalidRootCountsByMatchup: Record<string, SamplerPostCfp66CountPercentage>;
  invalidRootCountsByProvenanceLabel: Record<string, SamplerPostCfp66CountPercentage>;
  invalidRootCountsByDeficitSize: Record<string, SamplerPostCfp66CountPercentage>;
  publicTransferScalarBucketCounts: SamplerPostCfp66PublicTransferScalarBucketCounts;
  publicTransferScalarBucketPercentages: Record<
    keyof SamplerPostCfp66PublicTransferScalarBucketCounts,
    number
  >;
  allRootPublicTransferTotals: SamplerPostCfp66PublicTransferScalarTotals;
  invalidRootPublicTransferTotals: SamplerPostCfp66PublicTransferScalarTotals;
  validRootOnlySkipRootCount: number;
  validRootOnlySkipRootPercentage: number;
  validRootOnlySkipCounterCounts: {
    bySuite: Record<string, number>;
    byPhase: Record<string, number>;
    byRound: Record<string, number>;
    byMatchup: Record<string, number>;
    byPolicy: Record<string, number>;
    byFaction: Record<string, number>;
    byDeckPreset: Record<string, number>;
    byProvenanceLabel: Record<string, number>;
    byInvalidReason: Record<string, number>;
  };
  requiredCfp68SkipCounters: readonly string[];
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
  recommendation: string;
}

export interface SamplerPostCfp66InvalidRootCasebookResult {
  casebookRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  records: SamplerPostCfp66InvalidRootCasebookRecord[];
  summary: SamplerPostCfp66InvalidRootCasebookSummary;
}

export interface BuildSamplerPostCfp66InvalidRootCasebookInput {
  casebookRunId: string;
  suiteId: string;
  materializationSummary: SamplerMaterializationSummary;
  invalidRootSummary: SamplerInvalidRootSummary;
  invalidRoots: readonly SamplerInvalidRootRecord[];
  provenanceSummary: SamplerPublicZoneProvenanceSummary;
  provenanceRoots: readonly SamplerPublicZoneProvenanceRecord[];
  sourceArtifactReferences?: readonly SamplerPostCfp66SourceArtifactReference[];
}

const primaryClassifications: readonly SamplerPostCfp66PrimaryClassification[] = [
  "candidate_valid_root_only_skip",
  "candidate_deeper_reconstruction",
  "classification_unavailable",
];

const transferClassifications: readonly SamplerPostCfp66TransferClassification[] = [
  "public_transfer_memory_not_applicable",
  "no_known_hidden_transfer_at_invalid_root",
  "hidden_hand_transfer_present",
  "hidden_deck_transfer_present",
  "public_transfer_adjustment_present",
];

const persistentDeficitClassifications: readonly SamplerPostCfp66PersistentDeficitClassification[] = [
  "persistent_public_zone_count_deficit",
  "classification_unavailable",
];

const deficitSizeClassifications: readonly SamplerPostCfp66DeficitSizeClassification[] = [
  "one_card_deficit",
  "multi_card_deficit",
  "classification_unavailable",
];

const phaseClassifications: readonly SamplerPostCfp66PhaseClassification[] = [
  "playing_phase",
  "round_end_phase",
  "classification_unavailable",
];

const emptyCounts = <T extends string>(keys: readonly T[]) =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;

const sortRecord = <T>(record: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

const countBy = <T extends string>(values: readonly T[]) => {
  const counts: Record<string, number> = {};
  values.forEach((value) => {
    counts[value] = (counts[value] ?? 0) + 1;
  });
  return sortRecord(counts);
};

const percentage = (count: number, denominator: number) =>
  denominator <= 0 ? 0 : Number(((count / denominator) * 100).toFixed(3));

const countDistribution = (
  counts: Record<string, number>,
  denominator: number,
): Record<string, SamplerPostCfp66CountPercentage> =>
  sortRecord(
    Object.fromEntries(
      Object.entries(counts).map(([key, count]) => [
        key,
        { count, percentageOfInvalidRoots: percentage(count, denominator) },
      ]),
    ),
  );

const rootKey = ({
  suiteId,
  matchupId,
  seed,
  mirrorIndex,
  step,
  decisionIndex,
  phase,
  round,
  seatId,
  policyId,
  faction,
  deckPresetId,
}: {
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorIndex?: 0 | 1;
  step: number;
  decisionIndex: number;
  phase: string;
  round: number;
  seatId: string;
  policyId: string;
  faction: string;
  deckPresetId: string;
}) =>
  [
    suiteId,
    matchupId,
    String(seed),
    mirrorIndex === undefined ? "none" : String(mirrorIndex),
    String(step),
    String(decisionIndex),
    phase,
    String(round),
    seatId,
    policyId,
    faction,
    deckPresetId,
  ].join("|");

const buildTransferClassification = (
  invalidRoot: SamplerInvalidRootRecord,
): SamplerPostCfp66TransferClassification => {
  if (invalidRoot.publicTransferAdjustmentCount > 0) {
    return "public_transfer_adjustment_present";
  }
  if (invalidRoot.publicTransferKnownHiddenHandCount > 0) {
    return "hidden_hand_transfer_present";
  }
  if (invalidRoot.publicTransferKnownHiddenDeckCount > 0) {
    return "hidden_deck_transfer_present";
  }
  if (invalidRoot.publicTransferMemoryVisibleCardCount > 0) {
    return "public_transfer_memory_not_applicable";
  }
  return "no_known_hidden_transfer_at_invalid_root";
};

const buildDeficitSizeClassification = (
  priorDeficitCount: number,
): SamplerPostCfp66DeficitSizeClassification => {
  if (priorDeficitCount === 1) return "one_card_deficit";
  if (priorDeficitCount >= 2) return "multi_card_deficit";
  return "classification_unavailable";
};

const buildPhaseClassification = (
  phase: MatchPhase,
): SamplerPostCfp66PhaseClassification => {
  if (phase === "playing") return "playing_phase";
  if (phase === "round_end") return "round_end_phase";
  return "classification_unavailable";
};

const buildPrimaryClassification = ({
  provenanceRoot,
  transferClassification,
  persistentDeficitClassification,
  deficitSizeClassification,
}: {
  provenanceRoot?: SamplerPublicZoneProvenanceRecord;
  transferClassification: SamplerPostCfp66TransferClassification;
  persistentDeficitClassification: SamplerPostCfp66PersistentDeficitClassification;
  deficitSizeClassification: SamplerPostCfp66DeficitSizeClassification;
}): SamplerPostCfp66PrimaryClassification => {
  if (
    !provenanceRoot ||
    persistentDeficitClassification === "classification_unavailable" ||
    deficitSizeClassification === "classification_unavailable"
  ) {
    return "classification_unavailable";
  }

  if (
    provenanceRoot.provenanceLabel === "provenance_ambiguous" ||
    provenanceRoot.provenanceLabel === "zero_public_zone_unexpected" ||
    transferClassification === "hidden_hand_transfer_present" ||
    transferClassification === "hidden_deck_transfer_present" ||
    transferClassification === "public_transfer_adjustment_present"
  ) {
    return "candidate_deeper_reconstruction";
  }

  return "candidate_valid_root_only_skip";
};

const emptyPublicTransferTotals = (): SamplerPostCfp66PublicTransferScalarTotals => ({
  visiblePublicMemoryReferences: 0,
  knownHiddenHandCards: 0,
  knownHiddenDeckCards: 0,
  mainDeckAttributableKnownHiddenCards: 0,
  sideDeckOnlyKnownHiddenCards: 0,
  offPriorKnownHiddenCards: 0,
  publicTransferAdjustments: 0,
  uncoveredDeficitCards: 0,
  incoherentRoots: 0,
});

const publicTransferTotalsFromMaterialization = (
  summary: SamplerMaterializationSummary,
): SamplerPostCfp66PublicTransferScalarTotals => ({
  visiblePublicMemoryReferences: summary.publicTransferMemoryVisibleCardTotal,
  knownHiddenHandCards: summary.publicTransferKnownHiddenHandTotal,
  knownHiddenDeckCards: summary.publicTransferKnownHiddenDeckTotal,
  mainDeckAttributableKnownHiddenCards:
    summary.publicTransferKnownHiddenMainDeckAttributableTotal,
  sideDeckOnlyKnownHiddenCards:
    summary.publicTransferKnownHiddenSideDeckOnlyTotal,
  offPriorKnownHiddenCards: summary.publicTransferKnownHiddenOffPriorTotal,
  publicTransferAdjustments: summary.publicTransferAdjustmentTotal,
  uncoveredDeficitCards: summary.publicTransferUncoveredDeficitTotal,
  incoherentRoots: summary.publicTransferIncoherentTotal,
});

const addInvalidRootPublicTransferTotals = (
  totals: SamplerPostCfp66PublicTransferScalarTotals,
  root: SamplerInvalidRootRecord,
) => {
  totals.visiblePublicMemoryReferences += root.publicTransferMemoryVisibleCardCount;
  totals.knownHiddenHandCards += root.publicTransferKnownHiddenHandCount;
  totals.knownHiddenDeckCards += root.publicTransferKnownHiddenDeckCount;
  totals.mainDeckAttributableKnownHiddenCards +=
    root.publicTransferKnownHiddenMainDeckAttributableCount;
  totals.sideDeckOnlyKnownHiddenCards +=
    root.publicTransferKnownHiddenSideDeckOnlyCount;
  totals.offPriorKnownHiddenCards += root.publicTransferKnownHiddenOffPriorCount;
  totals.publicTransferAdjustments += root.publicTransferAdjustmentCount;
  totals.uncoveredDeficitCards += root.publicTransferUncoveredDeficitCount;
  totals.incoherentRoots += root.publicTransferIncoherentCount;
};

const requiredCfp68SkipCounters = [
  "suite",
  "phase",
  "round",
  "matchup",
  "policy",
  "faction",
  "deck preset",
  "provenance label",
  "invalid reason",
  "skipped-root percentage beside every probe result",
] as const;

export const buildPostCfp66InvalidRootRecommendation = ({
  primaryClassificationCounts,
  invalidRootCount,
}: {
  primaryClassificationCounts: Record<SamplerPostCfp66PrimaryClassification, number>;
  invalidRootCount: number;
}) => {
  if (
    invalidRootCount > 0 &&
    primaryClassificationCounts.candidate_deeper_reconstruction > 0
  ) {
    return "cFp68 should run a deeper public-state reconstruction phase before any determinized probe. Do not implement search yet.";
  }

  return "cFp68 should define a valid-root-only determinized probe contract. It must skip invalid sampler roots explicitly, count skipped roots by suite, phase, round, matchup, policy, faction, deck preset, provenance label, and invalid reason, and report skipped-root percentages next to every search-readiness/probe result. It must not treat skipped roots as wins, losses, or draws, and must not silently drop them.";
};

export const buildPostCfp66InvalidRootCasebook = ({
  casebookRunId,
  suiteId,
  materializationSummary,
  invalidRootSummary,
  invalidRoots,
  provenanceSummary,
  provenanceRoots,
  sourceArtifactReferences = [],
}: BuildSamplerPostCfp66InvalidRootCasebookInput): SamplerPostCfp66InvalidRootCasebookResult => {
  const provenanceByKey = new Map(
    provenanceRoots.map((root) => [rootKey(root), root] as const),
  );
  const consumedProvenanceKeys = new Set<string>();

  const records: SamplerPostCfp66InvalidRootCasebookRecord[] = invalidRoots.map((invalidRoot) => {
    const key = rootKey(invalidRoot);
    const provenanceRoot = provenanceByKey.get(key);
    if (provenanceRoot) {
      consumedProvenanceKeys.add(key);
    }

    const transferClassification = buildTransferClassification(invalidRoot);
    const persistentDeficitClassification: SamplerPostCfp66PersistentDeficitClassification =
      invalidRoot.classification === "public_zone_count_deficit"
        ? "persistent_public_zone_count_deficit"
        : "classification_unavailable";
    const priorDeficitCount =
      provenanceRoot?.priorDeficitCount ?? invalidRoot.priorDeficitCount;
    const deficitSizeClassification =
      buildDeficitSizeClassification(priorDeficitCount);
    const phaseClassification = buildPhaseClassification(invalidRoot.phase);
    const primaryClassification = buildPrimaryClassification({
      provenanceRoot,
      transferClassification,
      persistentDeficitClassification,
      deficitSizeClassification,
    });
    const zeroKnownHiddenTransferAtInvalidRoot =
      invalidRoot.publicTransferKnownHiddenHandCount === 0 &&
      invalidRoot.publicTransferKnownHiddenDeckCount === 0;
    const publicTransferAdjustmentPresent =
      invalidRoot.publicTransferAdjustmentCount > 0;
    const uncoveredDeficitPresent =
      invalidRoot.publicTransferUncoveredDeficitCount > 0 ||
      invalidRoot.uncoveredPriorDeficitCount > 0;
    const provenanceLabel: PublicZoneProvenanceLabel | "classification_unavailable" =
      provenanceRoot?.provenanceLabel ?? "classification_unavailable";

    return {
      schemaVersion:
        "sampler-post-cfp66-invalid-root-casebook-root-v1" as const,
      casebookRunId,
      suiteId,
      matchupId: invalidRoot.matchupId,
      seed: invalidRoot.seed,
      ...(invalidRoot.mirrorGroupId
        ? { mirrorGroupId: invalidRoot.mirrorGroupId }
        : {}),
      ...(invalidRoot.mirrorIndex === undefined
        ? {}
        : { mirrorIndex: invalidRoot.mirrorIndex }),
      step: invalidRoot.step,
      decisionIndex: invalidRoot.decisionIndex,
      phase: invalidRoot.phase,
      round: invalidRoot.round,
      seatId: invalidRoot.seatId,
      policyId: invalidRoot.policyId,
      faction: invalidRoot.faction,
      deckPresetId: invalidRoot.deckPresetId,
      invalidReason: invalidRoot.invalidReason,
      cFp62Classification: invalidRoot.classification,
      provenanceLabel,
      primaryClassification,
      transferClassification,
      persistentDeficitClassification,
      deficitSizeClassification,
      phaseClassification,
      priorDeficitCount,
      publicKnownCardCount: invalidRoot.publicKnownCardCount,
      fixedKnownHandCardCount: invalidRoot.fixedKnownHandCardCount,
      requiredHiddenDrawCount: invalidRoot.requiredHiddenDrawCount,
      priorRemainingCardCount: invalidRoot.priorRemainingCardCount,
      publicZoneReferenceCount: provenanceRoot?.publicZoneReferenceCount ?? 0,
      publicZoneDiversityCount: provenanceRoot?.publicZoneDiversityCount ?? 0,
      publicTransferMemoryVisibleCardCount:
        invalidRoot.publicTransferMemoryVisibleCardCount,
      publicTransferKnownHiddenHandCount:
        invalidRoot.publicTransferKnownHiddenHandCount,
      publicTransferKnownHiddenDeckCount:
        invalidRoot.publicTransferKnownHiddenDeckCount,
      publicTransferAdjustmentCount: invalidRoot.publicTransferAdjustmentCount,
      publicTransferUncoveredDeficitCount:
        invalidRoot.publicTransferUncoveredDeficitCount,
      uncoveredPriorDeficitCount: invalidRoot.uncoveredPriorDeficitCount,
      zeroKnownHiddenTransferAtInvalidRoot,
      publicTransferAdjustmentPresent,
      uncoveredDeficitPresent,
      candidateValidRootOnlySkip:
        primaryClassification === "candidate_valid_root_only_skip",
      candidateDeeperReconstruction:
        primaryClassification === "candidate_deeper_reconstruction",
      skipCounterDimensions: {
        suiteId,
        phase: invalidRoot.phase,
        round: String(invalidRoot.round),
        matchupId: invalidRoot.matchupId,
        policyId: invalidRoot.policyId,
        faction: invalidRoot.faction,
        deckPresetId: invalidRoot.deckPresetId,
        provenanceLabel,
        invalidReason: invalidRoot.invalidReason,
      },
      rootPublicFingerprint: invalidRoot.rootPublicFingerprint,
    };
  });

  const materializationStatusCounts =
    materializationSummary.materializationStatusCounts;
  const materializationValidRootCount = materializationStatusCounts.valid ?? 0;
  const materializationInvalidRootCount = materializationStatusCounts.invalid ?? 0;
  const totalRootCount = invalidRootSummary.totalRootCount;
  const validRootCount = invalidRootSummary.validRootCount;
  const invalidRootCount = invalidRootSummary.invalidRootCount;

  const primaryClassificationCounts = emptyCounts(primaryClassifications);
  const transferClassificationCounts = emptyCounts(transferClassifications);
  const persistentDeficitClassificationCounts = emptyCounts(
    persistentDeficitClassifications,
  );
  const deficitSizeClassificationCounts = emptyCounts(deficitSizeClassifications);
  const phaseClassificationCounts = emptyCounts(phaseClassifications);
  const publicTransferScalarBucketCounts: SamplerPostCfp66PublicTransferScalarBucketCounts = {
    zeroKnownHiddenTransfer: 0,
    hiddenHandTransferPresent: 0,
    hiddenDeckTransferPresent: 0,
    publicTransferAdjustmentPresent: 0,
    uncoveredDeficitPresent: 0,
  };
  const invalidRootPublicTransferTotals = emptyPublicTransferTotals();

  records.forEach((record, index) => {
    primaryClassificationCounts[record.primaryClassification] += 1;
    transferClassificationCounts[record.transferClassification] += 1;
    persistentDeficitClassificationCounts[
      record.persistentDeficitClassification
    ] += 1;
    deficitSizeClassificationCounts[record.deficitSizeClassification] += 1;
    phaseClassificationCounts[record.phaseClassification] += 1;

    const invalidRoot = invalidRoots[index];
    addInvalidRootPublicTransferTotals(invalidRootPublicTransferTotals, invalidRoot);

    if (record.zeroKnownHiddenTransferAtInvalidRoot) {
      publicTransferScalarBucketCounts.zeroKnownHiddenTransfer += 1;
    }
    if (record.publicTransferKnownHiddenHandCount > 0) {
      publicTransferScalarBucketCounts.hiddenHandTransferPresent += 1;
    }
    if (record.publicTransferKnownHiddenDeckCount > 0) {
      publicTransferScalarBucketCounts.hiddenDeckTransferPresent += 1;
    }
    if (record.publicTransferAdjustmentPresent) {
      publicTransferScalarBucketCounts.publicTransferAdjustmentPresent += 1;
    }
    if (record.uncoveredDeficitPresent) {
      publicTransferScalarBucketCounts.uncoveredDeficitPresent += 1;
    }
  });

  const validRootOnlySkipRootCount =
    primaryClassificationCounts.candidate_valid_root_only_skip;
  const validRootOnlySkipRecords = records.filter(
    (record) => record.primaryClassification === "candidate_valid_root_only_skip",
  );
  const validRootOnlySkipCounterCounts = {
    bySuite: countBy(validRootOnlySkipRecords.map((root) => root.suiteId)),
    byPhase: countBy(validRootOnlySkipRecords.map((root) => root.phase)),
    byRound: countBy(validRootOnlySkipRecords.map((root) => String(root.round))),
    byMatchup: countBy(validRootOnlySkipRecords.map((root) => root.matchupId)),
    byPolicy: countBy(validRootOnlySkipRecords.map((root) => root.policyId)),
    byFaction: countBy(validRootOnlySkipRecords.map((root) => root.faction)),
    byDeckPreset: countBy(
      validRootOnlySkipRecords.map((root) => root.deckPresetId),
    ),
    byProvenanceLabel: countBy(
      validRootOnlySkipRecords.map((root) => root.provenanceLabel),
    ),
    byInvalidReason: countBy(
      validRootOnlySkipRecords.map((root) => root.invalidReason),
    ),
  };
  const recommendation = buildPostCfp66InvalidRootRecommendation({
    primaryClassificationCounts,
    invalidRootCount,
  });

  const summary: SamplerPostCfp66InvalidRootCasebookSummary = {
    schemaVersion: "sampler-post-cfp66-invalid-root-casebook-summary-v1",
    casebookRunId,
    suiteId,
    sourceBenchmarkSuiteId: invalidRootSummary.sourceBenchmarkSuiteId,
    totalRootCount,
    validRootCount,
    invalidRootCount,
    invalidRootPercentage: percentage(invalidRootCount, totalRootCount),
    matchCount: invalidRootSummary.matchCount,
    sourceSamplerRunIds: {
      materialization: materializationSummary.samplerRunId,
      invalidRoots: invalidRootSummary.samplerRunId,
      publicZoneProvenance: provenanceSummary.samplerRunId,
    },
    sourceArtifactReferences: [...sourceArtifactReferences].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    ),
    sourceConsistency: {
      materializationRootCount: materializationSummary.rootRecordCount,
      materializationValidRootCount,
      materializationInvalidRootCount,
      invalidRootRecordCount: invalidRoots.length,
      provenanceRootRecordCount: provenanceRoots.length,
      missingProvenanceRootCount: records.filter(
        (record) => record.provenanceLabel === "classification_unavailable",
      ).length,
      extraProvenanceRootCount: provenanceRoots.filter(
        (root) => !consumedProvenanceKeys.has(rootKey(root)),
      ).length,
      validRootRecordsInCasebook: records.filter(
        (record) => record.cFp62Classification !== "public_zone_count_deficit",
      ).length,
    },
    primaryClassificationCounts,
    transferClassificationCounts,
    persistentDeficitClassificationCounts,
    deficitSizeClassificationCounts,
    phaseClassificationCounts,
    invalidRootCountsByPhase: countDistribution(
      countBy(records.map((root) => root.phase)),
      invalidRootCount,
    ),
    invalidRootCountsByRound: countDistribution(
      countBy(records.map((root) => String(root.round))),
      invalidRootCount,
    ),
    invalidRootCountsByFaction: countDistribution(
      countBy(records.map((root) => root.faction)),
      invalidRootCount,
    ),
    invalidRootCountsByPolicy: countDistribution(
      countBy(records.map((root) => root.policyId)),
      invalidRootCount,
    ),
    invalidRootCountsByDeckPreset: countDistribution(
      countBy(records.map((root) => root.deckPresetId)),
      invalidRootCount,
    ),
    invalidRootCountsByMatchup: countDistribution(
      countBy(records.map((root) => root.matchupId)),
      invalidRootCount,
    ),
    invalidRootCountsByProvenanceLabel: countDistribution(
      countBy(records.map((root) => root.provenanceLabel)),
      invalidRootCount,
    ),
    invalidRootCountsByDeficitSize: countDistribution(
      countBy(records.map((root) => root.deficitSizeClassification)),
      invalidRootCount,
    ),
    publicTransferScalarBucketCounts,
    publicTransferScalarBucketPercentages: {
      zeroKnownHiddenTransfer: percentage(
        publicTransferScalarBucketCounts.zeroKnownHiddenTransfer,
        invalidRootCount,
      ),
      hiddenHandTransferPresent: percentage(
        publicTransferScalarBucketCounts.hiddenHandTransferPresent,
        invalidRootCount,
      ),
      hiddenDeckTransferPresent: percentage(
        publicTransferScalarBucketCounts.hiddenDeckTransferPresent,
        invalidRootCount,
      ),
      publicTransferAdjustmentPresent: percentage(
        publicTransferScalarBucketCounts.publicTransferAdjustmentPresent,
        invalidRootCount,
      ),
      uncoveredDeficitPresent: percentage(
        publicTransferScalarBucketCounts.uncoveredDeficitPresent,
        invalidRootCount,
      ),
    },
    allRootPublicTransferTotals:
      publicTransferTotalsFromMaterialization(materializationSummary),
    invalidRootPublicTransferTotals,
    validRootOnlySkipRootCount,
    validRootOnlySkipRootPercentage: percentage(
      validRootOnlySkipRootCount,
      totalRootCount,
    ),
    validRootOnlySkipCounterCounts,
    requiredCfp68SkipCounters,
    hiddenInfoSafetyNote:
      "cFp67 sampler post-cFp66 invalid-root casebook artifacts contain only suite metadata, scalar counts, enum-like classifications, and public benchmark dimensions. They exclude private identity payloads, sampled hidden payloads, engine logs, final payloads, action references, and debug payloads.",
    explicitNonSearchWarning:
      "cFp67 is analysis and evaluation infrastructure only. It does not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, sampler behavior changes, or product difficulty changes.",
    recommendation,
  };

  return {
    casebookRunId,
    suiteId,
    sourceBenchmarkSuiteId: summary.sourceBenchmarkSuiteId,
    records,
    summary,
  };
};
