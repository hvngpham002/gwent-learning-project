import type { CatalogFaction } from "@/game/catalog";
import type { LegalMove, MatchPhase, SeatId } from "@/game/core";

import {
  buildDeterminizedProbeContractRootKey,
  type DeterminizedProbeContractEligibleRootRecord,
  type DeterminizedProbeContractSkippedRootRecord,
  type DeterminizedProbeContractSummary,
  type DeterminizedProbeContractSourceArtifactReference,
} from "./determinizedProbeContract";
import { runBenchmarkSuite } from "./runBenchmark";
import {
  buildPublicActionAbstraction,
  buildSamplerReadinessCountStats,
  collapsePublicActions,
  type PublicActionTargetKind,
  type PublicActionTargetSide,
  type PublicSearchActionKind,
  type SamplerReadinessCountStats,
} from "./samplerReadiness";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSuite,
} from "./types";

export type DeterminizedPimcProbeV0RootSchemaVersion =
  "determinized-pimc-probe-v0-root-v1";
export type DeterminizedPimcProbeV0SkippedRootSchemaVersion =
  "determinized-pimc-probe-v0-skipped-root-v1";
export type DeterminizedPimcProbeV0SummarySchemaVersion =
  "determinized-pimc-probe-v0-summary-v1";

export type DeterminizedPimcProbeV0ReadinessStatus =
  | "probe_ready"
  | "not_probe_ready";

export type DeterminizedPimcProbeV0Mode =
  | "zero_ply_contract_check"
  | "one_ply_public_action_scaffold";

export type DeterminizedPimcProbeV0RootStatus =
  | "completed"
  | "eligible_root_not_observed"
  | "contract_mismatch"
  | "public_action_abstraction_failed";

export type DeterminizedPimcProbeV0RootIdentity = {
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
  faction: Exclude<CatalogFaction, "neutral">;
  deckPresetId: string;
  rootPublicFingerprint: string;
};

export interface DeterminizedPimcProbeV0RootRecord
  extends DeterminizedPimcProbeV0RootIdentity {
  schemaVersion: DeterminizedPimcProbeV0RootSchemaVersion;
  probeRunId: string;
  probeVariant: "determinized-pimc-probe-v0";
  probeMode: DeterminizedPimcProbeV0Mode;
  eligibilityStatus: "eligible_valid_root";
  sampleCountRequested: number;
  sampleCountConsumed: number;
  sampleCountValid: number;
  sampleCountInvalid: number;
  legalMoveCount: number;
  publicActionCount: number;
  publicActionCollisionCount: number;
  largestPublicActionBucketSize: number;
  publicActionKindCounts: Record<string, number>;
  targetKindCounts: Record<string, number>;
  targetSideCounts: Record<string, number>;
  probeStatus: DeterminizedPimcProbeV0RootStatus;
}

export interface DeterminizedPimcProbeV0SkippedRootRecord
  extends DeterminizedPimcProbeV0RootIdentity {
  schemaVersion: DeterminizedPimcProbeV0SkippedRootSchemaVersion;
  probeRunId: string;
  probeVariant: "determinized-pimc-probe-v0";
  eligibilityStatus: "skipped_invalid_root";
  sourceContractRunId: string;
  skipReason: DeterminizedProbeContractSkippedRootRecord["skipReason"];
  invalidReason: string;
  cFp67PrimaryClassification: string;
  cFp67TransferClassification: string;
  cFp67PersistentDeficitClassification: string;
  cFp67DeficitSizeClassification: string;
  cFp67ProvenanceLabel: string;
  priorDeficitCount: number;
  publicTransferMemoryVisibleCardCount: number;
  publicTransferKnownHiddenHandCount: number;
  publicTransferKnownHiddenDeckCount: number;
  publicTransferAdjustmentCount: number;
  publicTransferUncoveredDeficitCount: number;
  skipCounterDimensions: DeterminizedProbeContractSkippedRootRecord["skipCounterDimensions"];
}

export interface DeterminizedPimcProbeV0ObservedRoot
  extends Omit<DeterminizedPimcProbeV0RootIdentity, "rootPublicFingerprint"> {
  legalMoveCount: number;
  publicActionCount: number;
  publicActionCollisionCount: number;
  largestPublicActionBucketSize: number;
  publicActionKindCounts: Record<string, number>;
  targetKindCounts: Record<string, number>;
  targetSideCounts: Record<string, number>;
  probeStatus: "completed" | "public_action_abstraction_failed";
}

export type DeterminizedPimcProbeV0CountStats = SamplerReadinessCountStats;

export interface DeterminizedPimcProbeV0CountPercentage {
  count: number;
  percentageOfSkippedRoots: number;
}

export interface DeterminizedPimcProbeV0SkipCounters {
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

export interface DeterminizedPimcProbeV0SkipCounterPercentages {
  bySuite: Record<string, DeterminizedPimcProbeV0CountPercentage>;
  byPhase: Record<string, DeterminizedPimcProbeV0CountPercentage>;
  byRound: Record<string, DeterminizedPimcProbeV0CountPercentage>;
  byMatchup: Record<string, DeterminizedPimcProbeV0CountPercentage>;
  byPolicy: Record<string, DeterminizedPimcProbeV0CountPercentage>;
  byFaction: Record<string, DeterminizedPimcProbeV0CountPercentage>;
  byDeckPreset: Record<string, DeterminizedPimcProbeV0CountPercentage>;
  byProvenanceLabel: Record<string, DeterminizedPimcProbeV0CountPercentage>;
  byInvalidReason: Record<string, DeterminizedPimcProbeV0CountPercentage>;
  bySkipReason: Record<string, DeterminizedPimcProbeV0CountPercentage>;
}

export interface DeterminizedPimcProbeV0SourceConsistency {
  status: DeterminizedPimcProbeV0ReadinessStatus;
  cFp68ContractStatus: DeterminizedProbeContractSummary["contractStatus"];
  cFp68ContractNotProbeReady: number;
  cFp68TotalRootCount: number;
  cFp68EligibleRootsRead: number;
  cFp68SkippedRootsRead: number;
  benchmarkObservedRootsRead: number;
  eligibleRootsNotObserved: number;
  observedRootsNotInCfp68Contract: number;
  skippedRootsIncorrectlyProbed: number;
  duplicateObservedRootKeys: number;
  duplicateCfp68EligibleRootKeys: number;
  duplicateCfp68SkippedRootKeys: number;
  eligibleSkippedRootCountDeltaFromCfp68Total: number;
  cFp68EligibleSampleCountMismatchRoots: number;
  publicActionAbstractionFailedRoots: number;
}

export interface DeterminizedPimcProbeV0SampleBudget {
  probeRootCount: number;
  requestedSamplesPerRootDistribution: Record<string, number>;
  totalRequestedSampleCount: number;
  totalConsumedSampleCount: number;
  totalValidSampleCount: number;
  totalInvalidSampleCount: number;
}

export interface DeterminizedPimcProbeV0SafeRootReference {
  rootPublicFingerprint: string;
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorIndex?: 0 | 1;
  step: number;
  decisionIndex: number;
  phase: MatchPhase;
  round: number;
  seatId: SeatId;
  policyId: string;
  faction: Exclude<CatalogFaction, "neutral">;
  deckPresetId: string;
}

export interface DeterminizedPimcProbeV0MaxPublicActionRoot
  extends DeterminizedPimcProbeV0SafeRootReference {
  publicActionCount: number;
}

export interface DeterminizedPimcProbeV0MaxCollisionRoot
  extends DeterminizedPimcProbeV0SafeRootReference {
  publicActionCollisionCount: number;
}

export interface DeterminizedPimcProbeV0PublicActionScaffoldSummary {
  probeMode: DeterminizedPimcProbeV0Mode;
  legalMoveCountStats: DeterminizedPimcProbeV0CountStats;
  publicActionCountStats: DeterminizedPimcProbeV0CountStats;
  publicActionCollisionCountStats: DeterminizedPimcProbeV0CountStats;
  largestPublicActionBucketSizeStats: DeterminizedPimcProbeV0CountStats;
  aggregatePublicActionKindCounts: Record<string, number>;
  aggregateTargetKindCounts: Record<string, number>;
  aggregateTargetSideCounts: Record<string, number>;
  rootCountsByPublicActionKindPresence: Record<string, number>;
  maxPublicActionRoot: DeterminizedPimcProbeV0MaxPublicActionRoot | null;
  maxCollisionRoot: DeterminizedPimcProbeV0MaxCollisionRoot | null;
}

export interface DeterminizedPimcProbeV0Summary {
  schemaVersion: DeterminizedPimcProbeV0SummarySchemaVersion;
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  probeVariant: "determinized-pimc-probe-v0";
  probeMode: DeterminizedPimcProbeV0Mode;
  probeReadinessStatus: DeterminizedPimcProbeV0ReadinessStatus;
  sourceCfp68ContractRunId: string;
  sourceArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  totalCfp68RootCount: number;
  eligibleRootCount: number;
  probeRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  matchCount: number;
  probeStatusCounts: Record<DeterminizedPimcProbeV0RootStatus, number>;
  sourceConsistency: DeterminizedPimcProbeV0SourceConsistency;
  sampleBudget: DeterminizedPimcProbeV0SampleBudget;
  publicActionScaffold: DeterminizedPimcProbeV0PublicActionScaffoldSummary;
  skipCounters: DeterminizedPimcProbeV0SkipCounters;
  skipCounterPercentages: DeterminizedPimcProbeV0SkipCounterPercentages;
  explicitNonClaims: readonly string[];
  hiddenInfoSafetyNote: string;
  cFp70Recommendation: string;
}

export interface DeterminizedPimcProbeV0Result {
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  benchmark?: BenchmarkRunResult;
  probeRoots: DeterminizedPimcProbeV0RootRecord[];
  skippedRoots: DeterminizedPimcProbeV0SkippedRootRecord[];
  summary: DeterminizedPimcProbeV0Summary;
}

export interface BuildDeterminizedPimcProbeV0Input {
  probeRunId: string;
  suiteId: string;
  contractSummary: DeterminizedProbeContractSummary;
  cFp68EligibleRoots: readonly DeterminizedProbeContractEligibleRootRecord[];
  cFp68SkippedRoots: readonly DeterminizedProbeContractSkippedRootRecord[];
  observedRoots: readonly DeterminizedPimcProbeV0ObservedRoot[];
  benchmark?: BenchmarkRunResult;
  sourceArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  probeMode?: DeterminizedPimcProbeV0Mode;
}

export interface RunDeterminizedPimcProbeV0Input {
  suiteId?: string;
  suite?: BenchmarkSuite;
  probeRunId?: string;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
  contractSummary: DeterminizedProbeContractSummary;
  cFp68EligibleRoots: readonly DeterminizedProbeContractEligibleRootRecord[];
  cFp68SkippedRoots: readonly DeterminizedProbeContractSkippedRootRecord[];
  sourceArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  probeMode?: DeterminizedPimcProbeV0Mode;
}

const publicActionKinds: readonly PublicSearchActionKind[] = [
  "choose_mulligan",
  "play_card",
  "use_leader",
  "choose_prompt_option",
  "pass",
  "resolve_round_end",
];

const publicTargetKinds: readonly PublicActionTargetKind[] = [
  "none",
  "board_row",
  "row_horn",
  "weather",
  "card",
  "deck_card_source",
  "card_instance_set",
  "deck_card_instance",
];

const publicTargetSides: readonly PublicActionTargetSide[] = [
  "own",
  "opponent",
  "public",
  "none",
];

export const DETERMINIZED_PIMC_PROBE_V0_NON_CLAIMS = [
  "No rollout was run.",
  "No action value was computed.",
  "No action ranking was produced.",
  "No move was selected by search.",
  "No strength claim is made.",
  "No product AI behavior changed.",
  "Skipped roots were excluded from probe work and reported separately.",
] as const;

export const DETERMINIZED_PIMC_PROBE_V0_HIDDEN_INFO_SAFETY_NOTE =
  "cFp69 determinized-pimc-probe-v0 artifacts contain only public benchmark root metadata, scalar sampler budget counts inherited from cFp68, public legal-action bucket counts, skipped-root accounting, source artifact hashes, and aggregate counters. They exclude private card identities, raw move payloads, sampled hidden worlds, engine logs, debug traces, action ranking, value estimates, rollout results, and product AI wiring.";

export const DETERMINIZED_PIMC_PROBE_V0_CFP70_RECOMMENDATION =
  "cFp70 should add the first one-ply sampled-world action-availability probe over the same cFp68 eligible roots, still without rollout/value/strength claims. It should measure whether public action buckets remain available across sampled worlds and report action-availability disagreement/risk, with cFp68/cFp69 skip accounting attached.";

export const defaultDeterminizedPimcProbeV0RunId = (suiteId: string) =>
  `${suiteId}:determinized-pimc-probe-v0:cFp69`;

export const buildDeterminizedPimcProbeV0RootKey =
  buildDeterminizedProbeContractRootKey;

const sortRecord = <T>(record: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

const addCount = (record: Record<string, number>, key: string, amount = 1) => {
  record[key] = (record[key] ?? 0) + amount;
};

const percentage = (count: number, denominator: number) =>
  denominator <= 0 ? 0 : Number(((count / denominator) * 100).toFixed(3));

const countDistribution = (
  counts: Record<string, number>,
  denominator: number,
): Record<string, DeterminizedPimcProbeV0CountPercentage> =>
  sortRecord(
    Object.fromEntries(
      Object.entries(counts).map(([key, count]) => [
        key,
        { count, percentageOfSkippedRoots: percentage(count, denominator) },
      ]),
    ),
  );

const emptyPublicActionKindCounts = () =>
  Object.fromEntries(publicActionKinds.map((kind) => [kind, 0])) as Record<
    PublicSearchActionKind,
    number
  >;

const emptyTargetKindCounts = () =>
  Object.fromEntries(publicTargetKinds.map((kind) => [kind, 0])) as Record<
    PublicActionTargetKind,
    number
  >;

const emptyTargetSideCounts = () =>
  Object.fromEntries(publicTargetSides.map((side) => [side, 0])) as Record<
    PublicActionTargetSide,
    number
  >;

const buildCountsFromLegalMoves = (
  legalMoves: readonly LegalMove[],
  phase: MatchPhase,
  round: number,
) => {
  const collapsed = collapsePublicActions(
    legalMoves.map((move) => buildPublicActionAbstraction(move, phase, round)),
  );
  const publicActionKindCounts = emptyPublicActionKindCounts();
  const targetKindCounts = emptyTargetKindCounts();
  const targetSideCounts = emptyTargetSideCounts();

  collapsed.forEach((action) => {
    addCount(publicActionKindCounts, action.kind, action.moveCount);
    addCount(targetKindCounts, action.targetKind, action.moveCount);
    addCount(targetSideCounts, action.targetSide, action.moveCount);
  });

  return {
    legalMoveCount: legalMoves.length,
    publicActionCount: collapsed.length,
    publicActionCollisionCount: legalMoves.length - collapsed.length,
    largestPublicActionBucketSize:
      collapsed.length === 0
        ? 0
        : Math.max(...collapsed.map((action) => action.moveCount)),
    publicActionKindCounts: sortRecord(publicActionKindCounts),
    targetKindCounts: sortRecord(targetKindCounts),
    targetSideCounts: sortRecord(targetSideCounts),
  };
};

export const buildDeterminizedPimcProbeV0ObservedRoot = (
  input: BenchmarkRootObserverInput,
): DeterminizedPimcProbeV0ObservedRoot => {
  const seat = input.seats[input.seatId];
  const identity = {
    suiteId: input.suiteId,
    matchupId: input.matchupId,
    seed: input.seed,
    ...(input.mirrorGroupId ? { mirrorGroupId: input.mirrorGroupId } : {}),
    ...(input.mirrorIndex === undefined ? {} : { mirrorIndex: input.mirrorIndex }),
    step: input.step,
    decisionIndex: input.decisionIndex,
    phase: input.state.phase,
    round: input.state.round,
    seatId: input.seatId,
    policyId: input.policyId,
    faction: seat.faction,
    deckPresetId: seat.deckPresetId,
  };

  try {
    return {
      ...identity,
      ...buildCountsFromLegalMoves(
        input.legalMoves,
        input.state.phase,
        input.state.round,
      ),
      probeStatus: "completed",
    };
  } catch {
    return {
      ...identity,
      legalMoveCount: input.legalMoves.length,
      publicActionCount: 0,
      publicActionCollisionCount: 0,
      largestPublicActionBucketSize: 0,
      publicActionKindCounts: sortRecord(emptyPublicActionKindCounts()),
      targetKindCounts: sortRecord(emptyTargetKindCounts()),
      targetSideCounts: sortRecord(emptyTargetSideCounts()),
      probeStatus: "public_action_abstraction_failed",
    };
  }
};

const keyCounts = (
  records: readonly (
    | DeterminizedProbeContractEligibleRootRecord
    | DeterminizedProbeContractSkippedRootRecord
    | DeterminizedPimcProbeV0ObservedRoot
  )[],
) => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const key = buildDeterminizedPimcProbeV0RootKey(record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
};

const duplicateKeyCount = (counts: Map<string, number>) =>
  [...counts.values()].filter((count) => count > 1).length;

const firstRecordByKey = <
  T extends
    | DeterminizedProbeContractEligibleRootRecord
    | DeterminizedProbeContractSkippedRootRecord
    | DeterminizedPimcProbeV0ObservedRoot,
>(
  records: readonly T[],
) => {
  const byKey = new Map<string, T>();
  records.forEach((record) => {
    const key = buildDeterminizedPimcProbeV0RootKey(record);
    if (!byKey.has(key)) {
      byKey.set(key, record);
    }
  });
  return byKey;
};

const sampleCountsMatchContract = (
  root: DeterminizedProbeContractEligibleRootRecord,
) =>
  root.sampleCountRequested > 0 &&
  root.sampleCountGenerated === root.sampleCountRequested &&
  root.sampleCountValid === root.sampleCountRequested &&
  root.sampleCountInvalid === 0;

const baseIdentityFromEligibleRoot = (
  root: DeterminizedProbeContractEligibleRootRecord,
): DeterminizedPimcProbeV0RootIdentity => ({
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
  faction: root.faction as Exclude<CatalogFaction, "neutral">,
  deckPresetId: root.deckPresetId,
  rootPublicFingerprint: root.rootPublicFingerprint,
});

const baseIdentityFromSkippedRoot = (
  root: DeterminizedProbeContractSkippedRootRecord,
): DeterminizedPimcProbeV0RootIdentity => ({
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
  faction: root.faction as Exclude<CatalogFaction, "neutral">,
  deckPresetId: root.deckPresetId,
  rootPublicFingerprint: root.rootPublicFingerprint,
});

const buildSkippedProbeRecord = ({
  probeRunId,
  root,
}: {
  probeRunId: string;
  root: DeterminizedProbeContractSkippedRootRecord;
}): DeterminizedPimcProbeV0SkippedRootRecord => ({
  schemaVersion: "determinized-pimc-probe-v0-skipped-root-v1",
  probeRunId,
  probeVariant: "determinized-pimc-probe-v0",
  ...baseIdentityFromSkippedRoot(root),
  eligibilityStatus: "skipped_invalid_root",
  sourceContractRunId: root.contractRunId,
  skipReason: root.skipReason,
  invalidReason: root.invalidReason,
  cFp67PrimaryClassification: root.cFp67PrimaryClassification,
  cFp67TransferClassification: root.cFp67TransferClassification,
  cFp67PersistentDeficitClassification:
    root.cFp67PersistentDeficitClassification,
  cFp67DeficitSizeClassification: root.cFp67DeficitSizeClassification,
  cFp67ProvenanceLabel: root.cFp67ProvenanceLabel,
  priorDeficitCount: root.priorDeficitCount,
  publicTransferMemoryVisibleCardCount:
    root.publicTransferMemoryVisibleCardCount,
  publicTransferKnownHiddenHandCount: root.publicTransferKnownHiddenHandCount,
  publicTransferKnownHiddenDeckCount: root.publicTransferKnownHiddenDeckCount,
  publicTransferAdjustmentCount: root.publicTransferAdjustmentCount,
  publicTransferUncoveredDeficitCount:
    root.publicTransferUncoveredDeficitCount,
  skipCounterDimensions: root.skipCounterDimensions,
});

const buildProbeRootRecord = ({
  probeRunId,
  probeMode,
  eligibleRoot,
  observedRoot,
  skippedKeys,
}: {
  probeRunId: string;
  probeMode: DeterminizedPimcProbeV0Mode;
  eligibleRoot: DeterminizedProbeContractEligibleRootRecord;
  observedRoot?: DeterminizedPimcProbeV0ObservedRoot;
  skippedKeys: ReadonlySet<string>;
}): DeterminizedPimcProbeV0RootRecord => {
  const key = buildDeterminizedPimcProbeV0RootKey(eligibleRoot);
  const contractSampleMismatch = !sampleCountsMatchContract(eligibleRoot);
  const probeStatus: DeterminizedPimcProbeV0RootStatus = !observedRoot
    ? "eligible_root_not_observed"
    : contractSampleMismatch || skippedKeys.has(key)
      ? "contract_mismatch"
      : observedRoot.probeStatus;

  return {
    schemaVersion: "determinized-pimc-probe-v0-root-v1",
    probeRunId,
    ...baseIdentityFromEligibleRoot(eligibleRoot),
    probeVariant: "determinized-pimc-probe-v0",
    probeMode,
    eligibilityStatus: "eligible_valid_root",
    sampleCountRequested: eligibleRoot.sampleCountRequested,
    sampleCountConsumed:
      eligibleRoot.sampleCountValid + eligibleRoot.sampleCountInvalid,
    sampleCountValid: eligibleRoot.sampleCountValid,
    sampleCountInvalid: eligibleRoot.sampleCountInvalid,
    legalMoveCount: observedRoot?.legalMoveCount ?? 0,
    publicActionCount: observedRoot?.publicActionCount ?? 0,
    publicActionCollisionCount: observedRoot?.publicActionCollisionCount ?? 0,
    largestPublicActionBucketSize:
      observedRoot?.largestPublicActionBucketSize ?? 0,
    publicActionKindCounts:
      observedRoot?.publicActionKindCounts ??
      sortRecord(emptyPublicActionKindCounts()),
    targetKindCounts:
      observedRoot?.targetKindCounts ?? sortRecord(emptyTargetKindCounts()),
    targetSideCounts:
      observedRoot?.targetSideCounts ?? sortRecord(emptyTargetSideCounts()),
    probeStatus,
  };
};

const buildProbeStatusCounts = (
  roots: readonly DeterminizedPimcProbeV0RootRecord[],
): Record<DeterminizedPimcProbeV0RootStatus, number> => {
  const counts: Record<DeterminizedPimcProbeV0RootStatus, number> = {
    completed: 0,
    eligible_root_not_observed: 0,
    contract_mismatch: 0,
    public_action_abstraction_failed: 0,
  };
  roots.forEach((root) => {
    counts[root.probeStatus] += 1;
  });
  return counts;
};

const buildSampleBudget = (
  roots: readonly DeterminizedPimcProbeV0RootRecord[],
): DeterminizedPimcProbeV0SampleBudget => {
  const requestedSamplesPerRootDistribution: Record<string, number> = {};
  let totalRequestedSampleCount = 0;
  let totalConsumedSampleCount = 0;
  let totalValidSampleCount = 0;
  let totalInvalidSampleCount = 0;

  roots.forEach((root) => {
    addCount(
      requestedSamplesPerRootDistribution,
      String(root.sampleCountRequested),
    );
    totalRequestedSampleCount += root.sampleCountRequested;
    totalConsumedSampleCount += root.sampleCountConsumed;
    totalValidSampleCount += root.sampleCountValid;
    totalInvalidSampleCount += root.sampleCountInvalid;
  });

  return {
    probeRootCount: roots.length,
    requestedSamplesPerRootDistribution: sortRecord(
      requestedSamplesPerRootDistribution,
    ),
    totalRequestedSampleCount,
    totalConsumedSampleCount,
    totalValidSampleCount,
    totalInvalidSampleCount,
  };
};

const safeRootReference = (
  root: DeterminizedPimcProbeV0RootRecord,
): DeterminizedPimcProbeV0SafeRootReference => ({
  rootPublicFingerprint: root.rootPublicFingerprint,
  suiteId: root.suiteId,
  matchupId: root.matchupId,
  seed: root.seed,
  ...(root.mirrorIndex === undefined ? {} : { mirrorIndex: root.mirrorIndex }),
  step: root.step,
  decisionIndex: root.decisionIndex,
  phase: root.phase,
  round: root.round,
  seatId: root.seatId,
  policyId: root.policyId,
  faction: root.faction,
  deckPresetId: root.deckPresetId,
});

const maxBy = <T>(values: readonly T[], score: (value: T) => number): T | null => {
  let best: T | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  values.forEach((value) => {
    const valueScore = score(value);
    if (!best || valueScore > bestScore) {
      best = value;
      bestScore = valueScore;
    }
  });
  return best;
};

const buildPublicActionScaffoldSummary = ({
  roots,
  probeMode,
}: {
  roots: readonly DeterminizedPimcProbeV0RootRecord[];
  probeMode: DeterminizedPimcProbeV0Mode;
}): DeterminizedPimcProbeV0PublicActionScaffoldSummary => {
  const aggregatePublicActionKindCounts: Record<string, number> = {};
  const aggregateTargetKindCounts: Record<string, number> = {};
  const aggregateTargetSideCounts: Record<string, number> = {};
  const rootCountsByPublicActionKindPresence: Record<string, number> = {};

  roots.forEach((root) => {
    Object.entries(root.publicActionKindCounts).forEach(([kind, count]) => {
      addCount(aggregatePublicActionKindCounts, kind, count);
      if (count > 0) {
        addCount(rootCountsByPublicActionKindPresence, kind);
      }
    });
    Object.entries(root.targetKindCounts).forEach(([kind, count]) => {
      addCount(aggregateTargetKindCounts, kind, count);
    });
    Object.entries(root.targetSideCounts).forEach(([side, count]) => {
      addCount(aggregateTargetSideCounts, side, count);
    });
  });

  const maxPublicActionRoot = maxBy(roots, (root) => root.publicActionCount);
  const maxCollisionRoot = maxBy(
    roots,
    (root) => root.publicActionCollisionCount,
  );

  return {
    probeMode,
    legalMoveCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.legalMoveCount),
    ),
    publicActionCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.publicActionCount),
    ),
    publicActionCollisionCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.publicActionCollisionCount),
    ),
    largestPublicActionBucketSizeStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.largestPublicActionBucketSize),
    ),
    aggregatePublicActionKindCounts: sortRecord(aggregatePublicActionKindCounts),
    aggregateTargetKindCounts: sortRecord(aggregateTargetKindCounts),
    aggregateTargetSideCounts: sortRecord(aggregateTargetSideCounts),
    rootCountsByPublicActionKindPresence: sortRecord(
      rootCountsByPublicActionKindPresence,
    ),
    maxPublicActionRoot: maxPublicActionRoot
      ? {
          ...safeRootReference(maxPublicActionRoot),
          publicActionCount: maxPublicActionRoot.publicActionCount,
        }
      : null,
    maxCollisionRoot: maxCollisionRoot
      ? {
          ...safeRootReference(maxCollisionRoot),
          publicActionCollisionCount:
            maxCollisionRoot.publicActionCollisionCount,
        }
      : null,
  };
};

const buildSkipCounters = (
  skippedRoots: readonly DeterminizedPimcProbeV0SkippedRootRecord[],
): DeterminizedPimcProbeV0SkipCounters => {
  const counters: DeterminizedPimcProbeV0SkipCounters = {
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
  counters: DeterminizedPimcProbeV0SkipCounters,
  skippedRootCount: number,
): DeterminizedPimcProbeV0SkipCounterPercentages => ({
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

export const buildDeterminizedPimcProbeV0 = ({
  probeRunId,
  suiteId,
  contractSummary,
  cFp68EligibleRoots,
  cFp68SkippedRoots,
  observedRoots,
  benchmark,
  sourceArtifactReferences = [],
  probeMode = "one_ply_public_action_scaffold",
}: BuildDeterminizedPimcProbeV0Input): DeterminizedPimcProbeV0Result => {
  const observedKeyCounts = keyCounts(observedRoots);
  const eligibleKeyCounts = keyCounts(cFp68EligibleRoots);
  const skippedKeyCounts = keyCounts(cFp68SkippedRoots);
  const observedByKey = firstRecordByKey(observedRoots);
  const skippedRoots = cFp68SkippedRoots.map((root) =>
    buildSkippedProbeRecord({ probeRunId, root }),
  );
  const skippedKeys = new Set(
    cFp68SkippedRoots.map((root) => buildDeterminizedPimcProbeV0RootKey(root)),
  );
  const eligibleKeys = new Set(
    cFp68EligibleRoots.map((root) => buildDeterminizedPimcProbeV0RootKey(root)),
  );
  const cFp68ContractKeys = new Set([...eligibleKeys, ...skippedKeys]);

  const probeRoots = cFp68EligibleRoots.map((eligibleRoot) =>
    buildProbeRootRecord({
      probeRunId,
      probeMode,
      eligibleRoot,
      observedRoot: observedByKey.get(
        buildDeterminizedPimcProbeV0RootKey(eligibleRoot),
      ),
      skippedKeys,
    }),
  );
  const probeKeys = new Set(
    probeRoots.map((root) => buildDeterminizedPimcProbeV0RootKey(root)),
  );

  const cFp68ContractNotProbeReady =
    contractSummary.contractStatus === "probe_ready" ? 0 : 1;
  const eligibleRootsNotObserved = cFp68EligibleRoots.filter(
    (root) => !observedByKey.has(buildDeterminizedPimcProbeV0RootKey(root)),
  ).length;
  const observedRootsNotInCfp68Contract = observedRoots.filter(
    (root) => !cFp68ContractKeys.has(buildDeterminizedPimcProbeV0RootKey(root)),
  ).length;
  const skippedRootsIncorrectlyProbed = cFp68SkippedRoots.filter((root) =>
    probeKeys.has(buildDeterminizedPimcProbeV0RootKey(root)),
  ).length;
  const eligibleSkippedRootCountDeltaFromCfp68Total =
    cFp68EligibleRoots.length +
    cFp68SkippedRoots.length -
    contractSummary.totalCfp61RootCount;
  const cFp68EligibleSampleCountMismatchRoots = cFp68EligibleRoots.filter(
    (root) => !sampleCountsMatchContract(root),
  ).length;
  const publicActionAbstractionFailedRoots = probeRoots.filter(
    (root) => root.probeStatus === "public_action_abstraction_failed",
  ).length;

  const sourceConsistencyValues = [
    cFp68ContractNotProbeReady,
    eligibleRootsNotObserved,
    observedRootsNotInCfp68Contract,
    skippedRootsIncorrectlyProbed,
    duplicateKeyCount(observedKeyCounts),
    duplicateKeyCount(eligibleKeyCounts),
    duplicateKeyCount(skippedKeyCounts),
    Math.abs(eligibleSkippedRootCountDeltaFromCfp68Total),
    cFp68EligibleSampleCountMismatchRoots,
    publicActionAbstractionFailedRoots,
  ];
  const sourceConsistencyStatus: DeterminizedPimcProbeV0ReadinessStatus =
    sourceConsistencyValues.every((count) => count === 0)
      ? "probe_ready"
      : "not_probe_ready";

  const sourceConsistency: DeterminizedPimcProbeV0SourceConsistency = {
    status: sourceConsistencyStatus,
    cFp68ContractStatus: contractSummary.contractStatus,
    cFp68ContractNotProbeReady,
    cFp68TotalRootCount: contractSummary.totalCfp61RootCount,
    cFp68EligibleRootsRead: cFp68EligibleRoots.length,
    cFp68SkippedRootsRead: cFp68SkippedRoots.length,
    benchmarkObservedRootsRead: observedRoots.length,
    eligibleRootsNotObserved,
    observedRootsNotInCfp68Contract,
    skippedRootsIncorrectlyProbed,
    duplicateObservedRootKeys: duplicateKeyCount(observedKeyCounts),
    duplicateCfp68EligibleRootKeys: duplicateKeyCount(eligibleKeyCounts),
    duplicateCfp68SkippedRootKeys: duplicateKeyCount(skippedKeyCounts),
    eligibleSkippedRootCountDeltaFromCfp68Total,
    cFp68EligibleSampleCountMismatchRoots,
    publicActionAbstractionFailedRoots,
  };

  const skipCounters = buildSkipCounters(skippedRoots);
  const skippedRootCount = skippedRoots.length;
  const probeStatusCounts = buildProbeStatusCounts(probeRoots);

  return {
    probeRunId,
    suiteId,
    sourceBenchmarkSuiteId: contractSummary.sourceBenchmarkSuiteId,
    benchmark,
    probeRoots,
    skippedRoots,
    summary: {
      schemaVersion: "determinized-pimc-probe-v0-summary-v1",
      probeRunId,
      suiteId,
      sourceBenchmarkSuiteId: contractSummary.sourceBenchmarkSuiteId,
      probeVariant: "determinized-pimc-probe-v0",
      probeMode,
      probeReadinessStatus: sourceConsistencyStatus,
      sourceCfp68ContractRunId: contractSummary.contractRunId,
      sourceArtifactReferences,
      totalCfp68RootCount: contractSummary.totalCfp61RootCount,
      eligibleRootCount: cFp68EligibleRoots.length,
      probeRootCount: probeRoots.length,
      skippedRootCount,
      skippedRootPercentage: percentage(
        skippedRootCount,
        contractSummary.totalCfp61RootCount,
      ),
      matchCount: contractSummary.matchCount,
      probeStatusCounts,
      sourceConsistency,
      sampleBudget: buildSampleBudget(probeRoots),
      publicActionScaffold: buildPublicActionScaffoldSummary({
        roots: probeRoots,
        probeMode,
      }),
      skipCounters,
      skipCounterPercentages: buildSkipCounterPercentages(
        skipCounters,
        skippedRootCount,
      ),
      explicitNonClaims: DETERMINIZED_PIMC_PROBE_V0_NON_CLAIMS,
      hiddenInfoSafetyNote:
        DETERMINIZED_PIMC_PROBE_V0_HIDDEN_INFO_SAFETY_NOTE,
      cFp70Recommendation:
        DETERMINIZED_PIMC_PROBE_V0_CFP70_RECOMMENDATION,
    },
  };
};

export const runDeterminizedPimcProbeV0 = (
  input: RunDeterminizedPimcProbeV0Input,
): DeterminizedPimcProbeV0Result => {
  const requestedSuiteId =
    input.suiteId ?? input.suite?.id ?? input.contractSummary.suiteId;
  const probeRunId =
    input.probeRunId ?? defaultDeterminizedPimcProbeV0RunId(requestedSuiteId);
  const observedRoots: DeterminizedPimcProbeV0ObservedRoot[] = [];
  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: probeRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      observedRoots.push(buildDeterminizedPimcProbeV0ObservedRoot(root));
    },
  });

  return buildDeterminizedPimcProbeV0({
    probeRunId,
    suiteId: benchmark.summary.suiteId,
    contractSummary: input.contractSummary,
    cFp68EligibleRoots: input.cFp68EligibleRoots,
    cFp68SkippedRoots: input.cFp68SkippedRoots,
    observedRoots,
    benchmark,
    sourceArtifactReferences: input.sourceArtifactReferences,
    probeMode: input.probeMode,
  });
};
