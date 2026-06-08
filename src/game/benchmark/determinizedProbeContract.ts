import type { MatchPhase, SeatId } from "@/game/core";

import type {
  SamplerMaterializationRootRecord,
  SamplerMaterializationSummary,
} from "./samplerMaterialization";
import type {
  SamplerPostCfp66DeficitSizeClassification,
  SamplerPostCfp66InvalidRootCasebookRecord,
  SamplerPostCfp66InvalidRootCasebookSummary,
  SamplerPostCfp66PersistentDeficitClassification,
  SamplerPostCfp66PrimaryClassification,
  SamplerPostCfp66TransferClassification,
} from "./samplerPostCfp66InvalidRootCasebook";

export type DeterminizedProbeContractRootSchemaVersion =
  "determinized-probe-contract-root-v1";
export type DeterminizedProbeContractSummarySchemaVersion =
  "determinized-probe-contract-summary-v1";

export type DeterminizedProbeContractStatus = "probe_ready" | "not_probe_ready";

export type DeterminizedProbeContractEligibilityStatus =
  | "eligible_valid_root"
  | "skipped_invalid_root";

export type DeterminizedProbeContractSkipReason =
  | "sampler_invalid_public_zone_count_deficit"
  | "sampler_invalid_casebook_missing"
  | "sampler_invalid_contract_mismatch";

export interface DeterminizedProbeContractSourceArtifactReference {
  label: string;
  relativePath: string;
  sha256: string;
}

export interface DeterminizedProbeContractRootIdentity {
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
  rootPublicFingerprint: string;
}

export interface DeterminizedProbeContractEligibleRootRecord
  extends DeterminizedProbeContractRootIdentity {
  schemaVersion: DeterminizedProbeContractRootSchemaVersion;
  contractRunId: string;
  eligibilityStatus: "eligible_valid_root";
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountValid: number;
  sampleCountInvalid: number;
  availableHiddenPoolSizeBucket: string;
  opponentHiddenPoolSizeBucket: string;
  priorRemainingCardCountBucket: string;
  publicKnownCardCountBucket: string;
  uniquePublicKnownCardCount: number;
  uniqueFixedKnownHandCardCount: number;
  mainDeckAttributablePublicCount: number;
  sideDeckOnlyPublicCount: number;
  offPriorPublicCount: number;
  publicAdjustmentCount: number;
  uncoveredPriorDeficitCount: number;
  duplicatePublicReferenceCount: number;
  duplicateFixedKnownHandReferenceCount: number;
  publicTransferMemoryVisibleCardCount: number;
  publicTransferKnownHiddenHandCount: number;
  publicTransferKnownHiddenDeckCount: number;
  publicTransferAdjustmentCount: number;
  publicTransferUncoveredDeficitCount: number;
}

export interface DeterminizedProbeContractSkippedRootRecord
  extends DeterminizedProbeContractRootIdentity {
  schemaVersion: DeterminizedProbeContractRootSchemaVersion;
  contractRunId: string;
  eligibilityStatus: "skipped_invalid_root";
  skipReason: DeterminizedProbeContractSkipReason;
  invalidReason: string;
  cFp67PrimaryClassification:
    | SamplerPostCfp66PrimaryClassification
    | "classification_unavailable";
  cFp67TransferClassification:
    | SamplerPostCfp66TransferClassification
    | "classification_unavailable";
  cFp67PersistentDeficitClassification:
    | SamplerPostCfp66PersistentDeficitClassification
    | "classification_unavailable";
  cFp67DeficitSizeClassification:
    | SamplerPostCfp66DeficitSizeClassification
    | "classification_unavailable";
  cFp67ProvenanceLabel: string;
  priorDeficitCount: number;
  publicTransferMemoryVisibleCardCount: number;
  publicTransferKnownHiddenHandCount: number;
  publicTransferKnownHiddenDeckCount: number;
  publicTransferAdjustmentCount: number;
  publicTransferUncoveredDeficitCount: number;
  skipCounterDimensions: {
    suiteId: string;
    phase: MatchPhase;
    round: string;
    matchupId: string;
    policyId: string;
    faction: string;
    deckPresetId: string;
    provenanceLabel: string;
    invalidReason: string;
    skipReason: DeterminizedProbeContractSkipReason;
  };
}

export interface DeterminizedProbeContractCountPercentage {
  count: number;
  percentageOfSkippedRoots: number;
}

export interface DeterminizedProbeContractSkipCounters {
  bySuite: Record<string, number>;
  byPhase: Record<string, number>;
  byRound: Record<string, number>;
  byMatchup: Record<string, number>;
  byPolicy: Record<string, number>;
  byFaction: Record<string, number>;
  byDeckPreset: Record<string, number>;
  byProvenanceLabel: Record<string, number>;
  byInvalidReason: Record<string, number>;
  bySkipReason: Record<string, number>;
}

export interface DeterminizedProbeContractSkipCounterPercentages {
  bySuite: Record<string, DeterminizedProbeContractCountPercentage>;
  byPhase: Record<string, DeterminizedProbeContractCountPercentage>;
  byRound: Record<string, DeterminizedProbeContractCountPercentage>;
  byMatchup: Record<string, DeterminizedProbeContractCountPercentage>;
  byPolicy: Record<string, DeterminizedProbeContractCountPercentage>;
  byFaction: Record<string, DeterminizedProbeContractCountPercentage>;
  byDeckPreset: Record<string, DeterminizedProbeContractCountPercentage>;
  byProvenanceLabel: Record<string, DeterminizedProbeContractCountPercentage>;
  byInvalidReason: Record<string, DeterminizedProbeContractCountPercentage>;
  bySkipReason: Record<string, DeterminizedProbeContractCountPercentage>;
}

export interface DeterminizedProbeBudgetSummary {
  eligibleRootCount: number;
  requestedSamplesPerEligibleRootDistribution: Record<string, number>;
  totalRequestedSampleCountAcrossEligibleRoots: number;
  totalValidSampleCountAcrossEligibleRoots: number;
}

export interface DeterminizedProbeContractSourceConsistency {
  status: DeterminizedProbeContractStatus;
  materializationRootsRead: number;
  materializationSummaryRootCount: number;
  cFp67SkipRecordsRead: number;
  cFp67SummaryInvalidRootCount: number;
  invalidRootsMissingCfp67SkipRecords: number;
  cFp67RecordsWithoutMatchingCfp61InvalidRoots: number;
  duplicateRootKeys: number;
  duplicateCfp67RootKeys: number;
  validCfp61RootsMatchedByCfp67SkipRecords: number;
  cFp61ValidRootsInSkippedRoots: number;
  cFp61InvalidRootsInEligibleRoots: number;
  invalidEligibleSampleCountRootCount: number;
  unsupportedMaterializationStatusRootCount: number;
  contractMismatchSkippedRootCount: number;
  recordsEmitted: number;
  eligibleRecordsEmitted: number;
  skippedRecordsEmitted: number;
  unaccountedCfp61RootCount: number;
}

export interface DeterminizedProbeContractSummary {
  schemaVersion: DeterminizedProbeContractSummarySchemaVersion;
  contractRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  contractStatus: DeterminizedProbeContractStatus;
  totalCfp61RootCount: number;
  eligibleRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  invalidRootCountFromCfp67: number;
  matchCount: number;
  sourceSamplerRunIds: {
    materialization: string;
    cFp67InvalidRootCasebook: string;
  };
  sourceArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceConsistency: DeterminizedProbeContractSourceConsistency;
  deterministicProbeBudget: DeterminizedProbeBudgetSummary;
  skipCounters: DeterminizedProbeContractSkipCounters;
  skipCounterPercentages: DeterminizedProbeContractSkipCounterPercentages;
  explicitNonSearchWarning: string;
  hiddenInfoSafetyNote: string;
  futureProbeContract: readonly string[];
  cFp69Recommendation: string;
}

export interface DeterminizedProbeContractResult {
  contractRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  eligibleRoots: DeterminizedProbeContractEligibleRootRecord[];
  skippedRoots: DeterminizedProbeContractSkippedRootRecord[];
  summary: DeterminizedProbeContractSummary;
}

export interface BuildDeterminizedProbeContractInput {
  contractRunId: string;
  suiteId: string;
  materializationSummary: SamplerMaterializationSummary;
  materializationRoots: readonly SamplerMaterializationRootRecord[];
  casebookSummary: SamplerPostCfp66InvalidRootCasebookSummary;
  casebookInvalidRoots: readonly SamplerPostCfp66InvalidRootCasebookRecord[];
  sourceArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
}

const sortRecord = <T>(record: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

const percentage = (count: number, denominator: number) =>
  denominator <= 0 ? 0 : Number(((count / denominator) * 100).toFixed(3));

const addCount = (record: Record<string, number>, key: string) => {
  record[key] = (record[key] ?? 0) + 1;
};

const countDistribution = (
  counts: Record<string, number>,
  denominator: number,
): Record<string, DeterminizedProbeContractCountPercentage> =>
  sortRecord(
    Object.fromEntries(
      Object.entries(counts).map(([key, count]) => [
        key,
        { count, percentageOfSkippedRoots: percentage(count, denominator) },
      ]),
    ),
  );

export const buildDeterminizedProbeContractRootKey = ({
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

const keyCounts = (
  records: readonly (SamplerMaterializationRootRecord | SamplerPostCfp66InvalidRootCasebookRecord)[],
) => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const key = buildDeterminizedProbeContractRootKey(record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
};

const duplicateKeyCount = (counts: Map<string, number>) =>
  [...counts.values()].filter((count) => count > 1).length;

const firstRecordByKey = <T extends SamplerPostCfp66InvalidRootCasebookRecord>(
  records: readonly T[],
) => {
  const byKey = new Map<string, T>();
  records.forEach((record) => {
    const key = buildDeterminizedProbeContractRootKey(record);
    if (!byKey.has(key)) {
      byKey.set(key, record);
    }
  });
  return byKey;
};

const invalidReasonFromMaterialization = (
  root: SamplerMaterializationRootRecord,
) => {
  const reasons = Object.entries(root.invalidReasonCounts)
    .filter(([, count]) => count > 0)
    .map(([reason]) => reason)
    .sort();
  if (reasons.length === 1) return reasons[0];
  if (reasons.length > 1) return "multiple_invalid_reasons";
  return "classification_unavailable";
};

const isEligibleMaterializationRoot = (
  root: SamplerMaterializationRootRecord,
) =>
  root.materializationStatus === "valid" &&
  root.priorStatus === "prior_available" &&
  root.sampleCountRequested > 0 &&
  root.sampleCountGenerated === root.sampleCountRequested &&
  root.sampleCountValid === root.sampleCountRequested &&
  root.sampleCountInvalid === 0 &&
  Object.keys(root.invalidReasonCounts).length === 0;

const baseIdentity = (
  root: SamplerMaterializationRootRecord,
): DeterminizedProbeContractRootIdentity => ({
  suiteId: root.suiteId,
  matchupId: root.matchupId,
  seed: root.seed,
  ...(root.mirrorGroupId ? { mirrorGroupId: root.mirrorGroupId } : {}),
  ...(root.mirrorIndex === undefined ? {} : { mirrorIndex: root.mirrorIndex }),
  step: root.step,
  decisionIndex: root.decisionIndex,
  phase: root.phase,
  round: root.round,
  seatId: root.seatId,
  policyId: root.policyId,
  faction: root.faction,
  deckPresetId: root.deckPresetId,
  rootPublicFingerprint: root.rootPublicFingerprint,
});

const buildEligibleRecord = ({
  contractRunId,
  root,
}: {
  contractRunId: string;
  root: SamplerMaterializationRootRecord;
}): DeterminizedProbeContractEligibleRootRecord => ({
  schemaVersion: "determinized-probe-contract-root-v1",
  contractRunId,
  ...baseIdentity(root),
  eligibilityStatus: "eligible_valid_root",
  sampleCountRequested: root.sampleCountRequested,
  sampleCountGenerated: root.sampleCountGenerated,
  sampleCountValid: root.sampleCountValid,
  sampleCountInvalid: root.sampleCountInvalid,
  availableHiddenPoolSizeBucket: root.availableHiddenPoolSizeBucket,
  opponentHiddenPoolSizeBucket: root.opponentHiddenPoolSizeBucket,
  priorRemainingCardCountBucket: root.priorRemainingCardCountBucket,
  publicKnownCardCountBucket: root.publicKnownCardCountBucket,
  uniquePublicKnownCardCount: root.uniquePublicKnownCardCount,
  uniqueFixedKnownHandCardCount: root.uniqueFixedKnownHandCardCount,
  mainDeckAttributablePublicCount: root.mainDeckAttributablePublicCount,
  sideDeckOnlyPublicCount: root.sideDeckOnlyPublicCount,
  offPriorPublicCount: root.offPriorPublicCount,
  publicAdjustmentCount: root.publicAdjustmentCount,
  uncoveredPriorDeficitCount: root.uncoveredPriorDeficitCount,
  duplicatePublicReferenceCount: root.duplicatePublicReferenceCount,
  duplicateFixedKnownHandReferenceCount: root.duplicateFixedKnownHandReferenceCount,
  publicTransferMemoryVisibleCardCount:
    root.publicTransferMemoryVisibleCardCount,
  publicTransferKnownHiddenHandCount: root.publicTransferKnownHiddenHandCount,
  publicTransferKnownHiddenDeckCount: root.publicTransferKnownHiddenDeckCount,
  publicTransferAdjustmentCount: root.publicTransferAdjustmentCount,
  publicTransferUncoveredDeficitCount:
    root.publicTransferUncoveredDeficitCount,
});

const buildSkipReason = ({
  root,
  casebookRecord,
}: {
  root: SamplerMaterializationRootRecord;
  casebookRecord?: SamplerPostCfp66InvalidRootCasebookRecord;
}): DeterminizedProbeContractSkipReason => {
  if (!casebookRecord) return "sampler_invalid_casebook_missing";

  const materializationInvalidReason = invalidReasonFromMaterialization(root);
  const casebookIsPublicDeficit =
    casebookRecord.invalidReason === materializationInvalidReason &&
    casebookRecord.cFp62Classification === "public_zone_count_deficit" &&
    casebookRecord.primaryClassification === "candidate_valid_root_only_skip" &&
    casebookRecord.candidateValidRootOnlySkip &&
    !casebookRecord.candidateDeeperReconstruction;

  return casebookIsPublicDeficit
    ? "sampler_invalid_public_zone_count_deficit"
    : "sampler_invalid_contract_mismatch";
};

const buildSkippedRecord = ({
  contractRunId,
  root,
  casebookRecord,
}: {
  contractRunId: string;
  root: SamplerMaterializationRootRecord;
  casebookRecord?: SamplerPostCfp66InvalidRootCasebookRecord;
}): DeterminizedProbeContractSkippedRootRecord => {
  const skipReason = buildSkipReason({ root, casebookRecord });
  const invalidReason =
    casebookRecord?.invalidReason ?? invalidReasonFromMaterialization(root);
  const provenanceLabel =
    casebookRecord?.provenanceLabel ?? "classification_unavailable";

  return {
    schemaVersion: "determinized-probe-contract-root-v1",
    contractRunId,
    ...baseIdentity(root),
    eligibilityStatus: "skipped_invalid_root",
    skipReason,
    invalidReason,
    cFp67PrimaryClassification:
      casebookRecord?.primaryClassification ?? "classification_unavailable",
    cFp67TransferClassification:
      casebookRecord?.transferClassification ?? "classification_unavailable",
    cFp67PersistentDeficitClassification:
      casebookRecord?.persistentDeficitClassification ??
      "classification_unavailable",
    cFp67DeficitSizeClassification:
      casebookRecord?.deficitSizeClassification ?? "classification_unavailable",
    cFp67ProvenanceLabel: provenanceLabel,
    priorDeficitCount:
      casebookRecord?.priorDeficitCount ?? root.uncoveredPriorDeficitCount,
    publicTransferMemoryVisibleCardCount:
      casebookRecord?.publicTransferMemoryVisibleCardCount ??
      root.publicTransferMemoryVisibleCardCount,
    publicTransferKnownHiddenHandCount:
      casebookRecord?.publicTransferKnownHiddenHandCount ??
      root.publicTransferKnownHiddenHandCount,
    publicTransferKnownHiddenDeckCount:
      casebookRecord?.publicTransferKnownHiddenDeckCount ??
      root.publicTransferKnownHiddenDeckCount,
    publicTransferAdjustmentCount:
      casebookRecord?.publicTransferAdjustmentCount ??
      root.publicTransferAdjustmentCount,
    publicTransferUncoveredDeficitCount:
      casebookRecord?.publicTransferUncoveredDeficitCount ??
      root.publicTransferUncoveredDeficitCount,
    skipCounterDimensions: {
      suiteId: root.suiteId,
      phase: root.phase,
      round: String(root.round),
      matchupId: root.matchupId,
      policyId: root.policyId,
      faction: root.faction,
      deckPresetId: root.deckPresetId,
      provenanceLabel,
      invalidReason,
      skipReason,
    },
  };
};

const buildSkipCounters = (
  skippedRoots: readonly DeterminizedProbeContractSkippedRootRecord[],
): DeterminizedProbeContractSkipCounters => {
  const counters: DeterminizedProbeContractSkipCounters = {
    bySuite: {},
    byPhase: {},
    byRound: {},
    byMatchup: {},
    byPolicy: {},
    byFaction: {},
    byDeckPreset: {},
    byProvenanceLabel: {},
    byInvalidReason: {},
    bySkipReason: {},
  };

  skippedRoots.forEach((root) => {
    const dimensions = root.skipCounterDimensions;
    addCount(counters.bySuite, dimensions.suiteId);
    addCount(counters.byPhase, dimensions.phase);
    addCount(counters.byRound, dimensions.round);
    addCount(counters.byMatchup, dimensions.matchupId);
    addCount(counters.byPolicy, dimensions.policyId);
    addCount(counters.byFaction, dimensions.faction);
    addCount(counters.byDeckPreset, dimensions.deckPresetId);
    addCount(counters.byProvenanceLabel, dimensions.provenanceLabel);
    addCount(counters.byInvalidReason, dimensions.invalidReason);
    addCount(counters.bySkipReason, dimensions.skipReason);
  });

  return {
    bySuite: sortRecord(counters.bySuite),
    byPhase: sortRecord(counters.byPhase),
    byRound: sortRecord(counters.byRound),
    byMatchup: sortRecord(counters.byMatchup),
    byPolicy: sortRecord(counters.byPolicy),
    byFaction: sortRecord(counters.byFaction),
    byDeckPreset: sortRecord(counters.byDeckPreset),
    byProvenanceLabel: sortRecord(counters.byProvenanceLabel),
    byInvalidReason: sortRecord(counters.byInvalidReason),
    bySkipReason: sortRecord(counters.bySkipReason),
  };
};

const buildSkipCounterPercentages = (
  counters: DeterminizedProbeContractSkipCounters,
  skippedRootCount: number,
): DeterminizedProbeContractSkipCounterPercentages => ({
  bySuite: countDistribution(counters.bySuite, skippedRootCount),
  byPhase: countDistribution(counters.byPhase, skippedRootCount),
  byRound: countDistribution(counters.byRound, skippedRootCount),
  byMatchup: countDistribution(counters.byMatchup, skippedRootCount),
  byPolicy: countDistribution(counters.byPolicy, skippedRootCount),
  byFaction: countDistribution(counters.byFaction, skippedRootCount),
  byDeckPreset: countDistribution(counters.byDeckPreset, skippedRootCount),
  byProvenanceLabel: countDistribution(
    counters.byProvenanceLabel,
    skippedRootCount,
  ),
  byInvalidReason: countDistribution(counters.byInvalidReason, skippedRootCount),
  bySkipReason: countDistribution(counters.bySkipReason, skippedRootCount),
});

const buildDeterminizationBudget = (
  eligibleRoots: readonly DeterminizedProbeContractEligibleRootRecord[],
): DeterminizedProbeBudgetSummary => {
  const requestedSamplesPerEligibleRootDistribution: Record<string, number> = {};
  let totalRequestedSampleCountAcrossEligibleRoots = 0;
  let totalValidSampleCountAcrossEligibleRoots = 0;

  eligibleRoots.forEach((root) => {
    addCount(
      requestedSamplesPerEligibleRootDistribution,
      String(root.sampleCountRequested),
    );
    totalRequestedSampleCountAcrossEligibleRoots += root.sampleCountRequested;
    totalValidSampleCountAcrossEligibleRoots += root.sampleCountValid;
  });

  return {
    eligibleRootCount: eligibleRoots.length,
    requestedSamplesPerEligibleRootDistribution: sortRecord(
      requestedSamplesPerEligibleRootDistribution,
    ),
    totalRequestedSampleCountAcrossEligibleRoots,
    totalValidSampleCountAcrossEligibleRoots,
  };
};

export const DETERMINIZED_PROBE_CONTRACT_NON_SEARCH_WARNING =
  "cFp68 is benchmark/evaluation contract infrastructure only. It does not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, sampler behavior changes, engine rule changes, legal move changes, or product difficulty changes.";

export const DETERMINIZED_PROBE_CONTRACT_HIDDEN_INFO_SAFETY_NOTE =
  "cFp68 determinized-probe contract artifacts contain only public benchmark root metadata, scalar counts, enum-like eligibility/skip classifications, source artifact hashes, and aggregate counters. They exclude private card identities, sampled private payloads, engine logs, terminal payloads, action references, and debug payloads.";

export const DETERMINIZED_PROBE_CONTRACT_FUTURE_PROBE_CONTRACT = [
  "A future determinized probe may read only eligible-roots.jsonl as the root list.",
  "A future determinized probe must also read skipped-roots.jsonl and include skip counters in every result.",
  "A future determinized probe must not report result tables without skipped-root count and percentage.",
  "Skipped roots must not be scored as wins, losses, draws, policy failures, engine failures, sampled failures, or no-op results.",
  "A future determinized probe must fail fast if skipped-roots.jsonl is missing for a suite with skipped roots.",
  "A future determinized probe must fail fast if eligible and skipped counts do not sum to the cFp61 materialization root count.",
] as const;

export const DETERMINIZED_PROBE_CONTRACT_CFP69_RECOMMENDATION =
  "cFp69 should implement the first benchmark-only determinized-pimc-probe-v0 sanity probe over cFp68 eligible roots only, with shallow/no-op or one-ply public-action scaffolding before any strength claims. It must consume cFp68 skip artifacts and report skipped-root counts and percentages beside every probe result.";

export const buildDeterminizedProbeContract = ({
  contractRunId,
  suiteId,
  materializationSummary,
  materializationRoots,
  casebookSummary,
  casebookInvalidRoots,
  sourceArtifactReferences = [],
}: BuildDeterminizedProbeContractInput): DeterminizedProbeContractResult => {
  const cfp61KeyCounts = keyCounts(materializationRoots);
  const cfp67KeyCounts = keyCounts(casebookInvalidRoots);
  const cfp67ByKey = firstRecordByKey(casebookInvalidRoots);
  const cfp61InvalidKeys = new Set<string>();
  const cfp61ValidKeys = new Set<string>();

  materializationRoots.forEach((root) => {
    const key = buildDeterminizedProbeContractRootKey(root);
    if (root.materializationStatus === "invalid") {
      cfp61InvalidKeys.add(key);
    } else if (root.materializationStatus === "valid") {
      cfp61ValidKeys.add(key);
    }
  });

  const eligibleRoots: DeterminizedProbeContractEligibleRootRecord[] = [];
  const skippedRoots: DeterminizedProbeContractSkippedRootRecord[] = [];
  let invalidEligibleSampleCountRootCount = 0;
  let unsupportedMaterializationStatusRootCount = 0;

  materializationRoots.forEach((root) => {
    if (isEligibleMaterializationRoot(root)) {
      eligibleRoots.push(buildEligibleRecord({ contractRunId, root }));
      return;
    }

    if (root.materializationStatus === "valid") {
      invalidEligibleSampleCountRootCount += 1;
      return;
    }

    if (root.materializationStatus === "invalid") {
      const key = buildDeterminizedProbeContractRootKey(root);
      skippedRoots.push(
        buildSkippedRecord({
          contractRunId,
          root,
          casebookRecord: cfp67ByKey.get(key),
        }),
      );
      return;
    }

    unsupportedMaterializationStatusRootCount += 1;
  });

  const cFp67RecordsWithoutMatchingCfp61InvalidRoots = casebookInvalidRoots.filter(
    (record) => !cfp61InvalidKeys.has(buildDeterminizedProbeContractRootKey(record)),
  ).length;
  const validCfp61RootsMatchedByCfp67SkipRecords = casebookInvalidRoots.filter(
    (record) => cfp61ValidKeys.has(buildDeterminizedProbeContractRootKey(record)),
  ).length;
  const invalidRootsMissingCfp67SkipRecords = materializationRoots.filter(
    (root) =>
      root.materializationStatus === "invalid" &&
      !cfp67ByKey.has(buildDeterminizedProbeContractRootKey(root)),
  ).length;
  const contractMismatchSkippedRootCount = skippedRoots.filter(
    (root) => root.skipReason === "sampler_invalid_contract_mismatch",
  ).length;
  const cFp61ValidRootsInSkippedRoots = skippedRoots.filter((root) =>
    cfp61ValidKeys.has(buildDeterminizedProbeContractRootKey(root)),
  ).length;
  const cFp61InvalidRootsInEligibleRoots = eligibleRoots.filter((root) =>
    cfp61InvalidKeys.has(buildDeterminizedProbeContractRootKey(root)),
  ).length;
  const recordsEmitted = eligibleRoots.length + skippedRoots.length;
  const unaccountedCfp61RootCount = materializationRoots.length - recordsEmitted;

  const duplicateRootKeys = duplicateKeyCount(cfp61KeyCounts);
  const duplicateCfp67RootKeys = duplicateKeyCount(cfp67KeyCounts);
  const eligibleRecordsEmitted = eligibleRoots.length;
  const skippedRecordsEmitted = skippedRoots.length;
  const sourceConsistencyValues = [
    invalidRootsMissingCfp67SkipRecords,
    cFp67RecordsWithoutMatchingCfp61InvalidRoots,
    duplicateRootKeys,
    duplicateCfp67RootKeys,
    validCfp61RootsMatchedByCfp67SkipRecords,
    cFp61ValidRootsInSkippedRoots,
    cFp61InvalidRootsInEligibleRoots,
    invalidEligibleSampleCountRootCount,
    unsupportedMaterializationStatusRootCount,
    contractMismatchSkippedRootCount,
    Math.abs(unaccountedCfp61RootCount),
  ];
  const sourceConsistencyStatus: DeterminizedProbeContractStatus =
    sourceConsistencyValues.every((count) => count === 0) &&
    recordsEmitted === materializationRoots.length
      ? "probe_ready"
      : "not_probe_ready";

  const skipCounters = buildSkipCounters(skippedRoots);
  const skippedRootCount = skippedRoots.length;
  const totalCfp61RootCount = materializationRoots.length;
  const deterministicProbeBudget = buildDeterminizationBudget(eligibleRoots);

  const sourceConsistency: DeterminizedProbeContractSourceConsistency = {
    status: sourceConsistencyStatus,
    materializationRootsRead: materializationRoots.length,
    materializationSummaryRootCount: materializationSummary.rootRecordCount,
    cFp67SkipRecordsRead: casebookInvalidRoots.length,
    cFp67SummaryInvalidRootCount: casebookSummary.invalidRootCount,
    invalidRootsMissingCfp67SkipRecords,
    cFp67RecordsWithoutMatchingCfp61InvalidRoots,
    duplicateRootKeys,
    duplicateCfp67RootKeys,
    validCfp61RootsMatchedByCfp67SkipRecords,
    cFp61ValidRootsInSkippedRoots,
    cFp61InvalidRootsInEligibleRoots,
    invalidEligibleSampleCountRootCount,
    unsupportedMaterializationStatusRootCount,
    contractMismatchSkippedRootCount,
    recordsEmitted,
    eligibleRecordsEmitted,
    skippedRecordsEmitted,
    unaccountedCfp61RootCount,
  };

  return {
    contractRunId,
    suiteId,
    sourceBenchmarkSuiteId: materializationSummary.sourceBenchmarkSuiteId,
    eligibleRoots,
    skippedRoots,
    summary: {
      schemaVersion: "determinized-probe-contract-summary-v1",
      contractRunId,
      suiteId,
      sourceBenchmarkSuiteId: materializationSummary.sourceBenchmarkSuiteId,
      contractStatus: sourceConsistencyStatus,
      totalCfp61RootCount,
      eligibleRootCount: eligibleRoots.length,
      skippedRootCount,
      skippedRootPercentage: percentage(skippedRootCount, totalCfp61RootCount),
      invalidRootCountFromCfp67: casebookInvalidRoots.length,
      matchCount: materializationSummary.matchCount,
      sourceSamplerRunIds: {
        materialization: materializationSummary.samplerRunId,
        cFp67InvalidRootCasebook: casebookSummary.casebookRunId,
      },
      sourceArtifactReferences,
      sourceConsistency,
      deterministicProbeBudget,
      skipCounters,
      skipCounterPercentages: buildSkipCounterPercentages(
        skipCounters,
        skippedRootCount,
      ),
      explicitNonSearchWarning:
        DETERMINIZED_PROBE_CONTRACT_NON_SEARCH_WARNING,
      hiddenInfoSafetyNote:
        DETERMINIZED_PROBE_CONTRACT_HIDDEN_INFO_SAFETY_NOTE,
      futureProbeContract: DETERMINIZED_PROBE_CONTRACT_FUTURE_PROBE_CONTRACT,
      cFp69Recommendation:
        DETERMINIZED_PROBE_CONTRACT_CFP69_RECOMMENDATION,
    },
  };
};
