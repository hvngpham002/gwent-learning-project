import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import type { CatalogFaction } from "@/game/catalog";
import {
  getLegalMoves,
  type CardInstanceId,
  type LegalMove,
  type MatchPhase,
  type MatchState,
  type SeatId,
} from "@/game/core";

import {
  buildDeterminizedProbeContractRootKey,
  type DeterminizedProbeContractEligibleRootRecord,
  type DeterminizedProbeContractSkippedRootRecord,
  type DeterminizedProbeContractSummary,
  type DeterminizedProbeContractSourceArtifactReference,
} from "./determinizedProbeContract";
import {
  type DeterminizedPimcProbeV0RootRecord,
  type DeterminizedPimcProbeV0SkippedRootRecord,
} from "./determinizedPimcProbeV0";
import { runBenchmarkSuite } from "./runBenchmark";
import {
  buildOpponentKnownPresetSourceMultisetPrior,
  buildPublicKnownSourceSubtraction,
  buildSamplerPublicTransferMemoryUpdate,
  getSamplerPublicTransferMemoryForRoot,
  materializeHiddenMultisets,
  type MaterializedHiddenMultisetSample,
  type SamplerPublicTransferMemoryCounts,
  type SamplerPublicTransferMemoryState,
} from "./samplerMaterialization";
import {
  DEFAULT_SAMPLE_COUNT,
  buildPublicActionAbstraction,
  buildSamplerReadinessCountStats,
  collapsePublicActions,
  hashSamplerReadinessPublicValue,
  type PublicActionTargetKind,
  type PublicActionTargetSide,
  type PublicSearchActionAbstraction,
  type PublicSearchActionKind,
  type SamplerReadinessCountStats,
} from "./samplerReadiness";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSuite,
} from "./types";

export type DeterminizedPimcActionAvailabilityV0RootSchemaVersion =
  "determinized-pimc-action-availability-v0-root-v1";
export type DeterminizedPimcActionAvailabilityV0SkippedRootSchemaVersion =
  "determinized-pimc-action-availability-v0-skipped-root-v1";
export type DeterminizedPimcActionAvailabilityV0SummarySchemaVersion =
  "determinized-pimc-action-availability-v0-summary-v1";

export type DeterminizedPimcActionAvailabilityV0ReadinessStatus =
  | "probe_ready"
  | "not_probe_ready";

export type DeterminizedPimcActionAvailabilityV0ProbeStatus =
  | "completed"
  | "eligible_root_not_observed"
  | "cfp68_contract_mismatch"
  | "cfp69_contract_mismatch"
  | "sample_materialization_failed"
  | "sampled_world_rebuild_failed"
  | "sampled_legal_move_generation_failed"
  | "public_action_abstraction_failed"
  | "exact_state_rebuild_deferred";

export type DeterminizedPimcActionAvailabilityDisagreementBucket =
  | "none"
  | "one"
  | "two_to_three"
  | "four_plus";

export type DeterminizedPimcActionAvailabilityRiskBucket =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "deferred"
  | "failed";

export type DeterminizedPimcActionAvailabilitySampleStatus =
  | "all_root_actions_available"
  | "availability_disagreement"
  | "sampled_world_rebuild_failed"
  | "sampled_legal_move_generation_failed"
  | "public_action_abstraction_failed";

export interface DeterminizedPimcActionAvailabilityV0RootIdentity {
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
}

export interface DeterminizedPimcActionAvailabilityV0RootRecord
  extends DeterminizedPimcActionAvailabilityV0RootIdentity {
  schemaVersion: DeterminizedPimcActionAvailabilityV0RootSchemaVersion;
  probeRunId: string;
  probeVariant: "determinized-pimc-action-availability-v0";
  probeMode: "one_ply_sampled_world_action_availability";
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  eligibilityStatus: "eligible_valid_root";
  cfp69ProbeStatus: DeterminizedPimcProbeV0RootRecord["probeStatus"];
  cfp69PublicActionCount: number;
  cfp69LegalMoveCount: number;
  cfp69SampleCountRequested: number;
  cfp69SampleCountValid: number;
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  sampleCountAvailabilityFailed: number;
  sampleAvailabilityStatusCounts: Record<string, number>;
  rootActionBucketCount: number;
  sampledActionBucketMin: number;
  sampledActionBucketMax: number;
  sampledActionBucketAverage: number;
  allRootActionsAvailableInAllSamples: boolean;
  rootActionBucketsMissingInAnySample: number;
  sampleActionBucketsExtraInAnySample: number;
  availabilityDisagreementCount: number;
  availabilityDisagreementBucket: DeterminizedPimcActionAvailabilityDisagreementBucket;
  availabilityRiskBucket: DeterminizedPimcActionAvailabilityRiskBucket;
  probeStatus: DeterminizedPimcActionAvailabilityV0ProbeStatus;
}

export interface DeterminizedPimcActionAvailabilityV0SkippedRootRecord
  extends DeterminizedPimcActionAvailabilityV0RootIdentity {
  schemaVersion: DeterminizedPimcActionAvailabilityV0SkippedRootSchemaVersion;
  probeRunId: string;
  probeVariant: "determinized-pimc-action-availability-v0";
  eligibilityStatus: "skipped_invalid_root";
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  cfp69SkippedStatus: DeterminizedPimcProbeV0SkippedRootRecord["eligibilityStatus"];
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

export interface DeterminizedPimcActionAvailabilityV0ObservedRoot
  extends Omit<
    DeterminizedPimcActionAvailabilityV0RootIdentity,
    "rootPublicFingerprint"
  > {
  rootPublicFingerprint?: string;
  cfp68RootPublicFingerprint?: string;
  cfp69LegalMoveCount: number;
  cfp69PublicActionCount: number;
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  sampleCountAvailabilityFailed: number;
  sampleAvailabilityStatusCounts: Record<string, number>;
  rootActionBucketCount: number;
  sampledActionBucketCounts: readonly number[];
  allRootActionsAvailableInAllSamples: boolean;
  rootActionBucketsMissingInAnySample: number;
  sampleActionBucketsExtraInAnySample: number;
  availabilityDisagreementCount: number;
  missingActionKindCounts: Record<string, number>;
  extraActionKindCounts: Record<string, number>;
  missingTargetKindCounts: Record<string, number>;
  extraTargetKindCounts: Record<string, number>;
  missingTargetSideCounts: Record<string, number>;
  extraTargetSideCounts: Record<string, number>;
  probeStatus: DeterminizedPimcActionAvailabilityV0ProbeStatus;
}

export interface DeterminizedPimcActionAvailabilityV0CountPercentage {
  count: number;
  percentageOfSkippedRoots: number;
}

export interface DeterminizedPimcActionAvailabilityV0SkipCounters {
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

export interface DeterminizedPimcActionAvailabilityV0SkipCounterPercentages {
  bySuite: Record<string, DeterminizedPimcActionAvailabilityV0CountPercentage>;
  byPhase: Record<string, DeterminizedPimcActionAvailabilityV0CountPercentage>;
  byRound: Record<string, DeterminizedPimcActionAvailabilityV0CountPercentage>;
  byMatchup: Record<string, DeterminizedPimcActionAvailabilityV0CountPercentage>;
  byPolicy: Record<string, DeterminizedPimcActionAvailabilityV0CountPercentage>;
  byFaction: Record<string, DeterminizedPimcActionAvailabilityV0CountPercentage>;
  byDeckPreset: Record<
    string,
    DeterminizedPimcActionAvailabilityV0CountPercentage
  >;
  byProvenanceLabel: Record<
    string,
    DeterminizedPimcActionAvailabilityV0CountPercentage
  >;
  byInvalidReason: Record<
    string,
    DeterminizedPimcActionAvailabilityV0CountPercentage
  >;
  bySkipReason: Record<
    string,
    DeterminizedPimcActionAvailabilityV0CountPercentage
  >;
}

export interface DeterminizedPimcActionAvailabilityV0SourceConsistency {
  status: DeterminizedPimcActionAvailabilityV0ReadinessStatus;
  cFp68ContractStatus: DeterminizedProbeContractSummary["contractStatus"];
  cFp68ContractNotProbeReady: number;
  cFp68TotalRootCount: number;
  cFp68EligibleRootsRead: number;
  cFp68SkippedRootsRead: number;
  cFp69ProbeRootsRead: number;
  cFp69SkippedRootsRead: number;
  benchmarkObservedRootsRead: number;
  eligibleRootsNotObserved: number;
  observedRootsNotInCfp68Cfp69Contract: number;
  skippedRootsIncorrectlyProbed: number;
  duplicateObservedRootKeys: number;
  duplicateCfp68EligibleRootKeys: number;
  duplicateCfp69ProbeRootKeys: number;
  duplicateSkippedRootKeys: number;
  cfp68Cfp69EligibleRootCountDelta: number;
  cfp68Cfp69SkippedRootCountDelta: number;
  cfp69ProbeRootsMissingCfp68EligibleRoot: number;
  cfp69SkippedRootsMissingCfp68SkippedRoot: number;
  cfp68Cfp69SampleCountMismatchRoots: number;
  cfp68Cfp69PublicActionCountMismatchRoots: number;
  cfp68FingerprintMismatchObservedRoots: number;
}

export interface DeterminizedPimcActionAvailabilityV0SampleBudget {
  availabilityRootCount: number;
  requestedSamplesPerRootDistribution: Record<string, number>;
  totalRequestedSampleCount: number;
  totalGeneratedSampleCount: number;
  totalCheckedSampleCount: number;
  totalFailedSampleCount: number;
}

export interface DeterminizedPimcActionAvailabilityV0AvailabilityStatusSummary {
  probeStatusCounts: Record<
    DeterminizedPimcActionAvailabilityV0ProbeStatus,
    number
  >;
  sampleAvailabilityStatusCounts: Record<string, number>;
  allActionsAvailableRootCount: number;
  rootsWithMissingRootActions: number;
  rootsWithExtraSampledActions: number;
  rootsWithAnyDisagreement: number;
  disagreementBucketCounts: Record<
    DeterminizedPimcActionAvailabilityDisagreementBucket,
    number
  >;
  availabilityRiskBucketCounts: Record<
    DeterminizedPimcActionAvailabilityRiskBucket,
    number
  >;
}

export interface DeterminizedPimcActionAvailabilityV0ActionBucketAggregates {
  rootPublicActionCountStats: SamplerReadinessCountStats;
  sampledPublicActionCountStats: SamplerReadinessCountStats;
  missingRootActionBucketStats: SamplerReadinessCountStats;
  extraSampledActionBucketStats: SamplerReadinessCountStats;
  disagreementStats: SamplerReadinessCountStats;
  aggregateMissingByPublicActionKind: Record<string, number>;
  aggregateExtraByPublicActionKind: Record<string, number>;
  aggregateMissingByTargetKind: Record<string, number>;
  aggregateExtraByTargetKind: Record<string, number>;
  aggregateMissingByTargetSide: Record<string, number>;
  aggregateExtraByTargetSide: Record<string, number>;
}

export interface DeterminizedPimcActionAvailabilityV0Summary {
  schemaVersion: DeterminizedPimcActionAvailabilityV0SummarySchemaVersion;
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  probeVariant: "determinized-pimc-action-availability-v0";
  probeMode: "one_ply_sampled_world_action_availability";
  probeReadinessStatus: DeterminizedPimcActionAvailabilityV0ReadinessStatus;
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  sourceCfp68ArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp69ArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  totalCfp68RootCount: number;
  eligibleRootCount: number;
  availabilityRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  matchCount: number;
  sourceConsistency: DeterminizedPimcActionAvailabilityV0SourceConsistency;
  sampleBudget: DeterminizedPimcActionAvailabilityV0SampleBudget;
  availabilityStatus: DeterminizedPimcActionAvailabilityV0AvailabilityStatusSummary;
  actionBucketAggregates: DeterminizedPimcActionAvailabilityV0ActionBucketAggregates;
  skipCounters: DeterminizedPimcActionAvailabilityV0SkipCounters;
  skipCounterPercentages: DeterminizedPimcActionAvailabilityV0SkipCounterPercentages;
  explicitNonClaims: readonly string[];
  hiddenInfoSafetyNote: string;
  cFp71Recommendation: string;
}

export interface DeterminizedPimcActionAvailabilityV0Result {
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  benchmark?: BenchmarkRunResult;
  availabilityRoots: DeterminizedPimcActionAvailabilityV0RootRecord[];
  skippedRoots: DeterminizedPimcActionAvailabilityV0SkippedRootRecord[];
  summary: DeterminizedPimcActionAvailabilityV0Summary;
}

export interface BuildDeterminizedPimcActionAvailabilityV0Input {
  probeRunId: string;
  suiteId: string;
  contractSummary: DeterminizedProbeContractSummary;
  cFp68EligibleRoots: readonly DeterminizedProbeContractEligibleRootRecord[];
  cFp68SkippedRoots: readonly DeterminizedProbeContractSkippedRootRecord[];
  cFp69ProbeRoots: readonly DeterminizedPimcProbeV0RootRecord[];
  cFp69SkippedRoots: readonly DeterminizedPimcProbeV0SkippedRootRecord[];
  observedRoots: readonly DeterminizedPimcActionAvailabilityV0ObservedRoot[];
  benchmark?: BenchmarkRunResult;
  sourceCfp68ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp69ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
}

export interface RunDeterminizedPimcActionAvailabilityV0Input {
  suiteId?: string;
  suite?: BenchmarkSuite;
  probeRunId?: string;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
  contractSummary: DeterminizedProbeContractSummary;
  cFp68EligibleRoots: readonly DeterminizedProbeContractEligibleRootRecord[];
  cFp68SkippedRoots: readonly DeterminizedProbeContractSkippedRootRecord[];
  cFp69ProbeRoots: readonly DeterminizedPimcProbeV0RootRecord[];
  cFp69SkippedRoots: readonly DeterminizedPimcProbeV0SkippedRootRecord[];
  sourceCfp68ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp69ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
}

export interface DeterminizedPimcActionAvailabilityV0PublicActionBucket {
  key: string;
  action: PublicSearchActionAbstraction;
}

export interface DeterminizedPimcActionAvailabilityV0InMemoryMaterializationResult {
  rootPublicFingerprint: string;
  materializationStatus: "valid" | "invalid" | "prior_unavailable";
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountValid: number;
  sampleCountInvalid: number;
  samples: MaterializedHiddenMultisetSample[];
}

export interface DeterminizedPimcActionAvailabilityV0PreservedHiddenAssignments {
  hand: Record<CardInstanceId, string>;
  deck: Record<CardInstanceId, string>;
}

interface SampledRootStateRebuildResult {
  status: "completed" | "failed";
  state?: MatchState;
  reason?: string;
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

export const DETERMINIZED_PIMC_ACTION_AVAILABILITY_V0_NON_CLAIMS = [
  "No rollout was run.",
  "No action value was computed.",
  "No action ranking was produced.",
  "No move was selected by search.",
  "No strength claim is made.",
  "No product AI behavior changed.",
  "Skipped roots were excluded from probe work and reported separately.",
] as const;

export const DETERMINIZED_PIMC_ACTION_AVAILABILITY_V0_HIDDEN_INFO_SAFETY_NOTE =
  "cFp70 artifacts contain only public benchmark root metadata, scalar sample availability counts, public action bucket aggregates, skipped-root accounting, and source artifact hashes. They exclude private card identities, raw move payloads, private sampled payloads, engine logs, debug traces, action ranking, value estimates, rollout results, and product AI wiring.";

export const DETERMINIZED_PIMC_ACTION_AVAILABILITY_V0_CFP71_RECOMMENDATION =
  "cFp71 should choose between a benchmark-only one-ply public action outcome skeleton or a repair casebook based on cFp70 disagreement and rebuild-failure counts. It should still avoid rollout, value, ranking, move recommendation, and product AI wiring.";

export const defaultDeterminizedPimcActionAvailabilityV0RunId = (
  suiteId: string,
) => `${suiteId}:determinized-pimc-action-availability-v0:cFp70`;

export const buildDeterminizedPimcActionAvailabilityV0RootKey =
  buildDeterminizedProbeContractRootKey;

const sortRecord = <T>(record: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

const addCount = (record: Record<string, number>, key: string, amount = 1) => {
  record[key] = (record[key] ?? 0) + amount;
};

const sumCounts = (record: Record<string, number>) =>
  Object.values(record).reduce((sum, count) => sum + count, 0);

const combineCounts = (
  ...records: readonly Record<string, number>[]
): Record<string, number> => {
  const combined: Record<string, number> = {};
  records.forEach((record) => {
    Object.entries(record).forEach(([key, count]) => {
      addCount(combined, key, count);
    });
  });
  return sortRecord(combined);
};

const subtractCounts = (
  sourceCounts: Record<string, number>,
  subtract: Record<string, number>,
) => {
  const result: Record<string, number> = { ...sourceCounts };
  Object.entries(subtract).forEach(([source, count]) => {
    result[source] = (result[source] ?? 0) - count;
  });
  return sortRecord(
    Object.fromEntries(Object.entries(result).filter(([, count]) => count > 0)),
  );
};

const expandSourceCounts = (sourceCounts: Record<string, number>) =>
  Object.entries(sourceCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([source, count]) => Array.from({ length: count }, () => source));

const percentage = (count: number, denominator: number) =>
  denominator <= 0 ? 0 : Number(((count / denominator) * 100).toFixed(3));

const roundToThree = (value: number) => Number(value.toFixed(3));

const average = (values: readonly number[]) =>
  values.length === 0
    ? 0
    : roundToThree(values.reduce((sum, value) => sum + value, 0) / values.length);

const countDistribution = (
  counts: Record<string, number>,
  denominator: number,
): Record<string, DeterminizedPimcActionAvailabilityV0CountPercentage> =>
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

const emptySampleAvailabilityCounts = (): Record<
  DeterminizedPimcActionAvailabilitySampleStatus,
  number
> => ({
  all_root_actions_available: 0,
  availability_disagreement: 0,
  sampled_world_rebuild_failed: 0,
  sampled_legal_move_generation_failed: 0,
  public_action_abstraction_failed: 0,
});

const emptyProbeStatusCounts = (): Record<
  DeterminizedPimcActionAvailabilityV0ProbeStatus,
  number
> => ({
  completed: 0,
  eligible_root_not_observed: 0,
  cfp68_contract_mismatch: 0,
  cfp69_contract_mismatch: 0,
  sample_materialization_failed: 0,
  sampled_world_rebuild_failed: 0,
  sampled_legal_move_generation_failed: 0,
  public_action_abstraction_failed: 0,
  exact_state_rebuild_deferred: 0,
});

const emptyDisagreementBucketCounts = (): Record<
  DeterminizedPimcActionAvailabilityDisagreementBucket,
  number
> => ({
  none: 0,
  one: 0,
  two_to_three: 0,
  four_plus: 0,
});

const emptyRiskBucketCounts = (): Record<
  DeterminizedPimcActionAvailabilityRiskBucket,
  number
> => ({
  none: 0,
  low: 0,
  medium: 0,
  high: 0,
  deferred: 0,
  failed: 0,
});

export const buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey = (
  action: PublicSearchActionAbstraction,
) =>
  [
    action.kind,
    action.targetKind,
    action.targetSide,
    action.targetRow ?? "",
    action.phase,
    action.round,
    action.sourceClass,
    action.strengthBucket ?? "empty",
    action.optionIndexLabel ?? "",
  ].join("|");

export const buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets = (
  legalMoves: readonly LegalMove[],
  phase: MatchPhase,
  round: number,
): DeterminizedPimcActionAvailabilityV0PublicActionBucket[] =>
  collapsePublicActions(
    legalMoves.map((move) => buildPublicActionAbstraction(move, phase, round)),
  )
    .map((action) => ({
      key: buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey(
        action,
      ),
      action,
    }))
    .sort((left, right) => left.key.localeCompare(right.key));

const bucketDisagreementCount = (
  count: number,
): DeterminizedPimcActionAvailabilityDisagreementBucket => {
  if (count <= 0) return "none";
  if (count === 1) return "one";
  if (count <= 3) return "two_to_three";
  return "four_plus";
};

const riskBucket = ({
  status,
  disagreementCount,
}: {
  status: DeterminizedPimcActionAvailabilityV0ProbeStatus;
  disagreementCount: number;
}): DeterminizedPimcActionAvailabilityRiskBucket => {
  if (status === "exact_state_rebuild_deferred") return "deferred";
  if (status !== "completed") return "failed";
  if (disagreementCount <= 0) return "none";
  if (disagreementCount === 1) return "low";
  if (disagreementCount <= 3) return "medium";
  return "high";
};

const otherSeat = (seatId: SeatId): SeatId =>
  seatId === "seat_a" ? "seat_b" : "seat_a";

const visibleOpponentHandCardIds = ({
  state,
  actingSeatId,
  opponentSeatId,
}: {
  state: MatchState;
  actingSeatId: SeatId;
  opponentSeatId: SeatId;
}) => {
  const visible = new Set<CardInstanceId>();
  if (state.pendingPrompt?.seatId !== actingSeatId) return visible;
  state.pendingPrompt.context?.revealedCardIds?.forEach((cardId) => {
    const card = state.cardsById[cardId];
    if (
      card?.owner === opponentSeatId &&
      card.zone.kind === "hand" &&
      card.zone.seat === opponentSeatId
    ) {
      visible.add(cardId);
    }
  });
  return visible;
};

export const collectDeterminizedPimcActionAvailabilityV0PreservedHiddenAssignments = ({
  state,
  actingSeatId,
  memory,
}: {
  state: MatchState;
  actingSeatId: SeatId;
  memory?: SamplerPublicTransferMemoryState;
}): DeterminizedPimcActionAvailabilityV0PreservedHiddenAssignments => {
  const opponentSeatId = otherSeat(actingSeatId);
  const visibleHandIds = visibleOpponentHandCardIds({
    state,
    actingSeatId,
    opponentSeatId,
  });
  const hand: Record<CardInstanceId, string> = {};
  const deck: Record<CardInstanceId, string> = {};

  visibleHandIds.forEach((cardId) => {
    const card = state.cardsById[cardId];
    if (card) {
      hand[cardId] = card.sourceId;
    }
  });

  Object.entries(memory?.trackedCards ?? {}).forEach(([cardId, tracked]) => {
    if (tracked.ownerSeatId !== opponentSeatId) return;
    const card = state.cardsById[cardId];
    if (!card || card.owner !== opponentSeatId) return;
    if (visibleHandIds.has(cardId)) return;
    if (card.zone.kind === "hand" && card.zone.seat === opponentSeatId) {
      hand[cardId] = tracked.sourceId;
    } else if (card.zone.kind === "deck" && card.zone.seat === opponentSeatId) {
      deck[cardId] = tracked.sourceId;
    }
  });

  return { hand, deck };
};

const assignSampledSourcesToZone = ({
  clone,
  cardIds,
  requestedSourceCounts,
  preservedSources,
}: {
  clone: MatchState;
  cardIds: readonly CardInstanceId[];
  requestedSourceCounts: Record<string, number>;
  preservedSources: Record<CardInstanceId, string>;
}) => {
  if (sumCounts(requestedSourceCounts) !== cardIds.length) {
    return false;
  }

  const remainingCounts = { ...requestedSourceCounts };
  Object.entries(preservedSources).forEach(([cardId, source]) => {
    if (!cardIds.includes(cardId)) return;
    remainingCounts[source] = (remainingCounts[source] ?? 0) - 1;
  });
  if (Object.values(remainingCounts).some((count) => count < 0)) {
    return false;
  }

  const remainingSources = expandSourceCounts(
    Object.fromEntries(
      Object.entries(remainingCounts).filter(([, count]) => count > 0),
    ),
  );
  let sourceIndex = 0;

  for (const cardId of cardIds) {
    const card = clone.cardsById[cardId];
    if (!card) return false;
    const source = preservedSources[cardId] ?? remainingSources[sourceIndex++];
    if (!source) return false;
    clone.cardsById[cardId] = { ...card, sourceId: source };
  }

  return sourceIndex === remainingSources.length;
};

export const rebuildDeterminizedPimcActionAvailabilityV0SampledRootState = ({
  state,
  actingSeatId,
  sample,
  preservedAssignments,
}: {
  state: MatchState;
  actingSeatId: SeatId;
  sample: MaterializedHiddenMultisetSample;
  preservedAssignments?: DeterminizedPimcActionAvailabilityV0PreservedHiddenAssignments;
}): SampledRootStateRebuildResult => {
  const opponentSeatId = otherSeat(actingSeatId);
  const clone = structuredClone(state) as MatchState;
  const preserved =
    preservedAssignments ??
    collectDeterminizedPimcActionAvailabilityV0PreservedHiddenAssignments({
      state,
      actingSeatId,
    });

  const handOk = assignSampledSourcesToZone({
    clone,
    cardIds: clone.seats[opponentSeatId].hand,
    requestedSourceCounts: sample.handSourceCounts,
    preservedSources: preserved.hand,
  });
  if (!handOk) {
    return { status: "failed", reason: "opponent_hand_assignment_failed" };
  }

  const deckOk = assignSampledSourcesToZone({
    clone,
    cardIds: clone.seats[opponentSeatId].deck,
    requestedSourceCounts: sample.deckSourceCounts,
    preservedSources: preserved.deck,
  });
  if (!deckOk) {
    return { status: "failed", reason: "opponent_deck_assignment_failed" };
  }

  return { status: "completed", state: clone };
};

const buildAppliedPublicTransferAccounting = ({
  publicKnownSourceCounts,
  fixedKnownHandSourceCounts,
  publicTransfer,
  mainDeckSourceCounts,
  opponentHandCount,
  opponentDeckCount,
}: {
  publicKnownSourceCounts: Record<string, number>;
  fixedKnownHandSourceCounts: Record<string, number>;
  publicTransfer: SamplerPublicTransferMemoryCounts;
  mainDeckSourceCounts: Record<string, number>;
  opponentHandCount: number;
  opponentDeckCount: number;
}) => {
  const combinedMainDeckKnownSourceCounts = combineCounts(
    publicKnownSourceCounts,
    publicTransfer.mainDeckAttributableKnownHiddenSourceCounts,
  );
  const invalidReasonCounts: Record<string, number> = {};
  Object.entries(combinedMainDeckKnownSourceCounts).forEach(([source, count]) => {
    const priorCount = mainDeckSourceCounts[source] ?? 0;
    if (count > priorCount) {
      addCount(invalidReasonCounts, "public_known_exceeds_prior_copy_count");
    }
  });

  const knownHandCount =
    sumCounts(fixedKnownHandSourceCounts) + publicTransfer.knownHiddenHandCount;
  const hiddenHandDrawCount = opponentHandCount - knownHandCount;
  const hiddenDeckDrawCount =
    opponentDeckCount - publicTransfer.knownHiddenDeckCount;
  if (hiddenHandDrawCount < 0) {
    addCount(
      invalidReasonCounts,
      "public_transfer_known_hidden_exceeds_opponent_hand_count",
    );
  }
  if (hiddenDeckDrawCount < 0) {
    addCount(
      invalidReasonCounts,
      "public_transfer_known_hidden_exceeds_opponent_deck_count",
    );
  }

  const remainingSourceCounts = subtractCounts(
    mainDeckSourceCounts,
    combinedMainDeckKnownSourceCounts,
  );
  const priorRemainingCardCount = sumCounts(remainingSourceCounts);
  const requiredHiddenDrawCount =
    Math.max(0, hiddenHandDrawCount) + Math.max(0, hiddenDeckDrawCount);
  if (
    Object.keys(invalidReasonCounts).length === 0 &&
    priorRemainingCardCount < requiredHiddenDrawCount
  ) {
    addCount(invalidReasonCounts, "insufficient_prior_remaining");
  } else if (
    Object.keys(invalidReasonCounts).length === 0 &&
    priorRemainingCardCount > requiredHiddenDrawCount
  ) {
    addCount(invalidReasonCounts, "prior_remaining_exceeds_observed_hidden_count");
  }

  return {
    remainingSourceCounts,
    priorRemainingCardCount,
    hiddenHandDrawCount,
    hiddenDeckDrawCount,
    invalidReasonCounts: sortRecord(invalidReasonCounts),
  };
};

const emptyPublicTransferCounts = (): SamplerPublicTransferMemoryCounts => ({
  visibleCardCount: 0,
  knownHiddenHandSourceCounts: {},
  knownHiddenDeckSourceCounts: {},
  mainDeckAttributableKnownHiddenSourceCounts: {},
  knownHiddenHandCount: 0,
  knownHiddenDeckCount: 0,
  knownHiddenMainDeckAttributableCount: 0,
  knownHiddenSideDeckOnlyCount: 0,
  knownHiddenOffPriorCount: 0,
  adjustmentCount: 0,
  incoherentCount: 0,
  reasonCounts: {},
});

export const buildDeterminizedPimcActionAvailabilityV0InMemoryMaterializationForRoot = ({
  input,
  samplerRunId,
  memory,
}: {
  input: BenchmarkRootObserverInput;
  samplerRunId: string;
  memory: SamplerPublicTransferMemoryState;
}): DeterminizedPimcActionAvailabilityV0InMemoryMaterializationResult => {
  const opponentSeatId = otherSeat(input.seatId);
  const seat = input.seats[input.seatId];
  const opponentHandCount = input.state.seats[opponentSeatId].hand.length;
  const opponentDeckCount = input.state.seats[opponentSeatId].deck.length;
  const prior = buildOpponentKnownPresetSourceMultisetPrior({
    seats: input.seats,
    actingSeatId: input.seatId,
  });
  const publicKnown =
    prior.priorStatus === "prior_available"
      ? buildPublicKnownSourceSubtraction({
          state: input.state,
          actingSeatId: input.seatId,
          opponentSeatId,
          priorSourceCounts: prior.mainDeckSourceCounts,
          sideDeckSourceCounts: prior.sideDeckSourceCounts,
          opponentHandCount,
          opponentDeckCount,
        })
      : {
          publicKnownSourceCounts: {},
          fixedKnownHandSourceCounts: {},
          publicKnownCardCount: 0,
          duplicatePublicReferenceCount: 0,
          duplicateFixedKnownHandReferenceCount: 0,
          invalidReasonCounts: {},
        };
  const publicTransfer =
    prior.priorStatus === "prior_available"
      ? buildSamplerPublicTransferMemoryUpdate({
          memory,
          state: input.state,
          perspectiveSeatId: input.seatId,
          opponentSeatId,
          mainDeckSourceCounts: prior.mainDeckSourceCounts,
          sideDeckSourceCounts: prior.sideDeckSourceCounts,
        })
      : emptyPublicTransferCounts();
  const applied =
    prior.priorStatus === "prior_available"
      ? buildAppliedPublicTransferAccounting({
          publicKnownSourceCounts: publicKnown.publicKnownSourceCounts,
          fixedKnownHandSourceCounts: publicKnown.fixedKnownHandSourceCounts,
          publicTransfer,
          mainDeckSourceCounts: prior.mainDeckSourceCounts,
          opponentHandCount,
          opponentDeckCount,
        })
      : {
          remainingSourceCounts: {},
          priorRemainingCardCount: 0,
          invalidReasonCounts: { prior_unavailable: 1 },
        };

  const rootPublicFingerprint = hashSamplerReadinessPublicValue({
    samplerRunId,
    suiteId: input.suiteId,
    matchupId: input.matchupId,
    seed: input.seed,
    mirrorGroupId: input.mirrorGroupId,
    mirrorIndex: input.mirrorIndex,
    step: input.step,
    decisionIndex: input.decisionIndex,
    phase: input.state.phase,
    round: input.state.round,
    seatId: input.seatId,
    policyId: input.policyId,
    faction: seat.faction,
    deckPresetId: seat.deckPresetId,
    priorId: prior.priorId,
    priorStatus: prior.priorStatus,
    opponentHandCount,
    opponentDeckCount,
    publicKnownCardCount: publicKnown.publicKnownCardCount,
    duplicatePublicReferenceCount: publicKnown.duplicatePublicReferenceCount,
    duplicateFixedKnownHandReferenceCount:
      publicKnown.duplicateFixedKnownHandReferenceCount,
    priorRemainingCardCount: applied.priorRemainingCardCount,
    publicTransferMemoryVisibleCardCount: publicTransfer.visibleCardCount,
    publicTransferKnownHiddenHandCount: publicTransfer.knownHiddenHandCount,
    publicTransferKnownHiddenDeckCount: publicTransfer.knownHiddenDeckCount,
  });

  const materialization =
    prior.priorStatus === "prior_available" &&
    Object.keys(publicKnown.invalidReasonCounts).length === 0 &&
    Object.keys(applied.invalidReasonCounts).length === 0
      ? materializeHiddenMultisets({
          samplerRunId,
          rootPublicFingerprint,
          priorSourceCounts: prior.mainDeckSourceCounts,
          remainingSourceCounts: applied.remainingSourceCounts,
          fixedKnownHandSourceCounts: publicKnown.fixedKnownHandSourceCounts,
          publicTransferKnownHiddenHandSourceCounts:
            publicTransfer.knownHiddenHandSourceCounts,
          publicTransferKnownHiddenDeckSourceCounts:
            publicTransfer.knownHiddenDeckSourceCounts,
          opponentHandCount,
          opponentDeckCount,
          sampleCount: DEFAULT_SAMPLE_COUNT,
        })
      : {
          materializationStatus:
            prior.priorStatus === "prior_available"
              ? ("invalid" as const)
              : ("prior_unavailable" as const),
          sampleCountRequested: DEFAULT_SAMPLE_COUNT,
          sampleCountGenerated: 0,
          sampleCountValid: 0,
          sampleCountInvalid: 0,
          samples: [],
        };

  return {
    rootPublicFingerprint,
    materializationStatus: materialization.materializationStatus,
    sampleCountRequested: materialization.sampleCountRequested,
    sampleCountGenerated: materialization.sampleCountGenerated,
    sampleCountValid: materialization.sampleCountValid,
    sampleCountInvalid: materialization.sampleCountInvalid,
    samples: materialization.samples,
  };
};

const baseObservedIdentity = (
  input: BenchmarkRootObserverInput,
): Omit<
  DeterminizedPimcActionAvailabilityV0ObservedRoot,
  | "rootPublicFingerprint"
  | "cfp68RootPublicFingerprint"
  | "cfp69LegalMoveCount"
  | "cfp69PublicActionCount"
  | "sampleCountRequested"
  | "sampleCountGenerated"
  | "sampleCountChecked"
  | "sampleCountAvailabilityFailed"
  | "sampleAvailabilityStatusCounts"
  | "rootActionBucketCount"
  | "sampledActionBucketCounts"
  | "allRootActionsAvailableInAllSamples"
  | "rootActionBucketsMissingInAnySample"
  | "sampleActionBucketsExtraInAnySample"
  | "availabilityDisagreementCount"
  | "missingActionKindCounts"
  | "extraActionKindCounts"
  | "missingTargetKindCounts"
  | "extraTargetKindCounts"
  | "missingTargetSideCounts"
  | "extraTargetSideCounts"
  | "probeStatus"
> => {
  const seat = input.seats[input.seatId];
  return {
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
};

const addActionCounts = (
  target: Record<string, number>,
  buckets: readonly DeterminizedPimcActionAvailabilityV0PublicActionBucket[],
  field: "kind" | "targetKind" | "targetSide",
) => {
  buckets.forEach(({ action }) => {
    addCount(target, String(action[field]));
  });
};

export const buildDeterminizedPimcActionAvailabilityV0ObservedRoot = ({
  input,
  samplerRunId,
  memory,
  cFp68EligibleRoot,
  cFp69ProbeRoot,
}: {
  input: BenchmarkRootObserverInput;
  samplerRunId: string;
  memory: SamplerPublicTransferMemoryState;
  cFp68EligibleRoot?: DeterminizedProbeContractEligibleRootRecord;
  cFp69ProbeRoot?: DeterminizedPimcProbeV0RootRecord;
}): DeterminizedPimcActionAvailabilityV0ObservedRoot => {
  const materialization =
    buildDeterminizedPimcActionAvailabilityV0InMemoryMaterializationForRoot({
    input,
    samplerRunId,
    memory,
  });
  const identity = baseObservedIdentity(input);
  const rootBuckets =
    cFp68EligibleRoot && cFp69ProbeRoot
      ? buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets(
          input.legalMoves,
          input.state.phase,
          input.state.round,
        )
      : [];
  const rootKeys = new Set(rootBuckets.map((bucket) => bucket.key));
  const sampleAvailabilityStatusCounts = emptySampleAvailabilityCounts();
  const sampledActionBucketCounts: number[] = [];
  const missingByKey =
    new Map<string, DeterminizedPimcActionAvailabilityV0PublicActionBucket>();
  const extraByKey =
    new Map<string, DeterminizedPimcActionAvailabilityV0PublicActionBucket>();
  let sampleCountChecked = 0;
  let sampleCountAvailabilityFailed = 0;
  let probeStatus: DeterminizedPimcActionAvailabilityV0ProbeStatus = "completed";

  if (cFp68EligibleRoot && cFp69ProbeRoot) {
    if (
      materialization.rootPublicFingerprint !==
        cFp68EligibleRoot.rootPublicFingerprint ||
      materialization.sampleCountRequested !==
        cFp68EligibleRoot.sampleCountRequested ||
      materialization.sampleCountGenerated !==
        cFp68EligibleRoot.sampleCountGenerated ||
      materialization.sampleCountValid !== cFp68EligibleRoot.sampleCountValid ||
      materialization.sampleCountInvalid !== cFp68EligibleRoot.sampleCountInvalid
    ) {
      probeStatus = "cfp68_contract_mismatch";
    } else if (
      cFp69ProbeRoot.legalMoveCount !== input.legalMoves.length ||
      cFp69ProbeRoot.publicActionCount !== rootBuckets.length ||
      cFp69ProbeRoot.sampleCountRequested !==
        cFp68EligibleRoot.sampleCountRequested ||
      cFp69ProbeRoot.sampleCountValid !== cFp68EligibleRoot.sampleCountValid ||
      cFp69ProbeRoot.probeStatus !== "completed"
    ) {
      probeStatus = "cfp69_contract_mismatch";
    } else if (
      materialization.materializationStatus !== "valid" ||
      materialization.samples.length !== cFp68EligibleRoot.sampleCountRequested
    ) {
      probeStatus = "sample_materialization_failed";
    } else {
      const preservedAssignments =
        collectDeterminizedPimcActionAvailabilityV0PreservedHiddenAssignments({
          state: input.state,
          actingSeatId: input.seatId,
          memory,
        });

      for (const sample of materialization.samples) {
        const rebuilt =
          rebuildDeterminizedPimcActionAvailabilityV0SampledRootState({
            state: input.state,
            actingSeatId: input.seatId,
            sample,
            preservedAssignments,
          });
        if (rebuilt.status !== "completed" || !rebuilt.state) {
          addCount(sampleAvailabilityStatusCounts, "sampled_world_rebuild_failed");
          sampleCountAvailabilityFailed += 1;
          probeStatus = "sampled_world_rebuild_failed";
          continue;
        }

        let legalMoves: LegalMove[];
        try {
          legalMoves = getLegalMoves({
            state: rebuilt.state,
            seatId: input.seatId,
            catalogCards: currentCatalogCards,
            catalogLeaders: currentCatalogLeaders,
          });
        } catch {
          addCount(
            sampleAvailabilityStatusCounts,
            "sampled_legal_move_generation_failed",
          );
          sampleCountAvailabilityFailed += 1;
          if (probeStatus === "completed") {
            probeStatus = "sampled_legal_move_generation_failed";
          }
          continue;
        }

        let sampleBuckets: DeterminizedPimcActionAvailabilityV0PublicActionBucket[];
        try {
          sampleBuckets =
            buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets(
              legalMoves,
              input.state.phase,
              input.state.round,
            );
        } catch {
          addCount(
            sampleAvailabilityStatusCounts,
            "public_action_abstraction_failed",
          );
          sampleCountAvailabilityFailed += 1;
          if (probeStatus === "completed") {
            probeStatus = "public_action_abstraction_failed";
          }
          continue;
        }

        sampleCountChecked += 1;
        sampledActionBucketCounts.push(sampleBuckets.length);
        const sampleKeys = new Set(sampleBuckets.map((bucket) => bucket.key));
        rootBuckets.forEach((bucket) => {
          if (!sampleKeys.has(bucket.key) && !missingByKey.has(bucket.key)) {
            missingByKey.set(bucket.key, bucket);
          }
        });
        sampleBuckets.forEach((bucket) => {
          if (!rootKeys.has(bucket.key) && !extraByKey.has(bucket.key)) {
            extraByKey.set(bucket.key, bucket);
          }
        });
        if (
          rootBuckets.some((bucket) => !sampleKeys.has(bucket.key)) ||
          sampleBuckets.some((bucket) => !rootKeys.has(bucket.key))
        ) {
          addCount(sampleAvailabilityStatusCounts, "availability_disagreement");
        } else {
          addCount(sampleAvailabilityStatusCounts, "all_root_actions_available");
        }
      }
    }
  }

  const missingBuckets = [...missingByKey.values()];
  const extraBuckets = [...extraByKey.values()];
  const missingActionKindCounts = emptyPublicActionKindCounts();
  const extraActionKindCounts = emptyPublicActionKindCounts();
  const missingTargetKindCounts = emptyTargetKindCounts();
  const extraTargetKindCounts = emptyTargetKindCounts();
  const missingTargetSideCounts = emptyTargetSideCounts();
  const extraTargetSideCounts = emptyTargetSideCounts();
  addActionCounts(missingActionKindCounts, missingBuckets, "kind");
  addActionCounts(extraActionKindCounts, extraBuckets, "kind");
  addActionCounts(missingTargetKindCounts, missingBuckets, "targetKind");
  addActionCounts(extraTargetKindCounts, extraBuckets, "targetKind");
  addActionCounts(missingTargetSideCounts, missingBuckets, "targetSide");
  addActionCounts(extraTargetSideCounts, extraBuckets, "targetSide");

  return {
    ...identity,
    rootPublicFingerprint: materialization.rootPublicFingerprint,
    ...(cFp68EligibleRoot
      ? { cfp68RootPublicFingerprint: cFp68EligibleRoot.rootPublicFingerprint }
      : {}),
    cfp69LegalMoveCount: input.legalMoves.length,
    cfp69PublicActionCount: rootBuckets.length,
    sampleCountRequested: materialization.sampleCountRequested,
    sampleCountGenerated: materialization.sampleCountGenerated,
    sampleCountChecked,
    sampleCountAvailabilityFailed,
    sampleAvailabilityStatusCounts: sortRecord(sampleAvailabilityStatusCounts),
    rootActionBucketCount: rootBuckets.length,
    sampledActionBucketCounts,
    allRootActionsAvailableInAllSamples:
      sampleCountChecked > 0 && missingByKey.size === 0,
    rootActionBucketsMissingInAnySample: missingByKey.size,
    sampleActionBucketsExtraInAnySample: extraByKey.size,
    availabilityDisagreementCount: missingByKey.size + extraByKey.size,
    missingActionKindCounts: sortRecord(missingActionKindCounts),
    extraActionKindCounts: sortRecord(extraActionKindCounts),
    missingTargetKindCounts: sortRecord(missingTargetKindCounts),
    extraTargetKindCounts: sortRecord(extraTargetKindCounts),
    missingTargetSideCounts: sortRecord(missingTargetSideCounts),
    extraTargetSideCounts: sortRecord(extraTargetSideCounts),
    probeStatus,
  };
};

const keyCounts = (
  records: readonly (
    | DeterminizedProbeContractEligibleRootRecord
    | DeterminizedProbeContractSkippedRootRecord
    | DeterminizedPimcProbeV0RootRecord
    | DeterminizedPimcProbeV0SkippedRootRecord
    | DeterminizedPimcActionAvailabilityV0ObservedRoot
  )[],
) => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const key = buildDeterminizedPimcActionAvailabilityV0RootKey(record);
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
    | DeterminizedPimcProbeV0RootRecord
    | DeterminizedPimcProbeV0SkippedRootRecord
    | DeterminizedPimcActionAvailabilityV0ObservedRoot,
>(
  records: readonly T[],
) => {
  const byKey = new Map<string, T>();
  records.forEach((record) => {
    const key = buildDeterminizedPimcActionAvailabilityV0RootKey(record);
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
): DeterminizedPimcActionAvailabilityV0RootIdentity => ({
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
): DeterminizedPimcActionAvailabilityV0RootIdentity => ({
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

const buildSkippedAvailabilityRecord = ({
  probeRunId,
  root,
  cFp69SkippedRoot,
  sourceCfp69ProbeRunId,
}: {
  probeRunId: string;
  root: DeterminizedProbeContractSkippedRootRecord;
  cFp69SkippedRoot?: DeterminizedPimcProbeV0SkippedRootRecord;
  sourceCfp69ProbeRunId: string;
}): DeterminizedPimcActionAvailabilityV0SkippedRootRecord => ({
  schemaVersion: "determinized-pimc-action-availability-v0-skipped-root-v1",
  probeRunId,
  probeVariant: "determinized-pimc-action-availability-v0",
  ...baseIdentityFromSkippedRoot(root),
  eligibilityStatus: "skipped_invalid_root",
  sourceCfp68ContractRunId: root.contractRunId,
  sourceCfp69ProbeRunId,
  cfp69SkippedStatus:
    cFp69SkippedRoot?.eligibilityStatus ?? "skipped_invalid_root",
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

const buildAvailabilityRootRecord = ({
  probeRunId,
  eligibleRoot,
  cFp69Root,
  observedRoot,
  cFp69SkippedKeys,
  sourceCfp69ProbeRunId,
}: {
  probeRunId: string;
  eligibleRoot: DeterminizedProbeContractEligibleRootRecord;
  cFp69Root?: DeterminizedPimcProbeV0RootRecord;
  observedRoot?: DeterminizedPimcActionAvailabilityV0ObservedRoot;
  cFp69SkippedKeys: ReadonlySet<string>;
  sourceCfp69ProbeRunId: string;
}): DeterminizedPimcActionAvailabilityV0RootRecord => {
  const key = buildDeterminizedPimcActionAvailabilityV0RootKey(eligibleRoot);
  const baseStatus: DeterminizedPimcActionAvailabilityV0ProbeStatus =
    !observedRoot
      ? "eligible_root_not_observed"
      : !sampleCountsMatchContract(eligibleRoot) || cFp69SkippedKeys.has(key)
        ? "cfp68_contract_mismatch"
        : !cFp69Root
          ? "cfp69_contract_mismatch"
          : observedRoot.probeStatus;
  const disagreementCount = observedRoot?.availabilityDisagreementCount ?? 0;
  const risk = riskBucket({ status: baseStatus, disagreementCount });

  return {
    schemaVersion: "determinized-pimc-action-availability-v0-root-v1",
    probeRunId,
    ...baseIdentityFromEligibleRoot(eligibleRoot),
    probeVariant: "determinized-pimc-action-availability-v0",
    probeMode: "one_ply_sampled_world_action_availability",
    sourceCfp68ContractRunId: eligibleRoot.contractRunId,
    sourceCfp69ProbeRunId,
    eligibilityStatus: "eligible_valid_root",
    cfp69ProbeStatus: cFp69Root?.probeStatus ?? "contract_mismatch",
    cfp69PublicActionCount: cFp69Root?.publicActionCount ?? 0,
    cfp69LegalMoveCount: cFp69Root?.legalMoveCount ?? 0,
    cfp69SampleCountRequested: cFp69Root?.sampleCountRequested ?? 0,
    cfp69SampleCountValid: cFp69Root?.sampleCountValid ?? 0,
    sampleCountRequested:
      observedRoot?.sampleCountRequested ?? eligibleRoot.sampleCountRequested,
    sampleCountGenerated: observedRoot?.sampleCountGenerated ?? 0,
    sampleCountChecked: observedRoot?.sampleCountChecked ?? 0,
    sampleCountAvailabilityFailed:
      observedRoot?.sampleCountAvailabilityFailed ?? 0,
    sampleAvailabilityStatusCounts:
      observedRoot?.sampleAvailabilityStatusCounts ??
      sortRecord(emptySampleAvailabilityCounts()),
    rootActionBucketCount: observedRoot?.rootActionBucketCount ?? 0,
    sampledActionBucketMin:
      observedRoot?.sampledActionBucketCounts.length === 0 ||
      !observedRoot
        ? 0
        : Math.min(...observedRoot.sampledActionBucketCounts),
    sampledActionBucketMax:
      observedRoot?.sampledActionBucketCounts.length === 0 ||
      !observedRoot
        ? 0
        : Math.max(...observedRoot.sampledActionBucketCounts),
    sampledActionBucketAverage: observedRoot
      ? average(observedRoot.sampledActionBucketCounts)
      : 0,
    allRootActionsAvailableInAllSamples:
      observedRoot?.allRootActionsAvailableInAllSamples ?? false,
    rootActionBucketsMissingInAnySample:
      observedRoot?.rootActionBucketsMissingInAnySample ?? 0,
    sampleActionBucketsExtraInAnySample:
      observedRoot?.sampleActionBucketsExtraInAnySample ?? 0,
    availabilityDisagreementCount: disagreementCount,
    availabilityDisagreementBucket: bucketDisagreementCount(disagreementCount),
    availabilityRiskBucket: risk,
    probeStatus: baseStatus,
  };
};

const buildSkipCounters = (
  skippedRoots: readonly DeterminizedPimcActionAvailabilityV0SkippedRootRecord[],
): DeterminizedPimcActionAvailabilityV0SkipCounters => {
  const counters: DeterminizedPimcActionAvailabilityV0SkipCounters = {
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
  counters: DeterminizedPimcActionAvailabilityV0SkipCounters,
  skippedRootCount: number,
): DeterminizedPimcActionAvailabilityV0SkipCounterPercentages => ({
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

const buildSampleBudget = (
  roots: readonly DeterminizedPimcActionAvailabilityV0RootRecord[],
): DeterminizedPimcActionAvailabilityV0SampleBudget => {
  const requestedSamplesPerRootDistribution: Record<string, number> = {};
  let totalRequestedSampleCount = 0;
  let totalGeneratedSampleCount = 0;
  let totalCheckedSampleCount = 0;
  let totalFailedSampleCount = 0;

  roots.forEach((root) => {
    addCount(
      requestedSamplesPerRootDistribution,
      String(root.sampleCountRequested),
    );
    totalRequestedSampleCount += root.sampleCountRequested;
    totalGeneratedSampleCount += root.sampleCountGenerated;
    totalCheckedSampleCount += root.sampleCountChecked;
    totalFailedSampleCount += root.sampleCountAvailabilityFailed;
  });

  return {
    availabilityRootCount: roots.length,
    requestedSamplesPerRootDistribution: sortRecord(
      requestedSamplesPerRootDistribution,
    ),
    totalRequestedSampleCount,
    totalGeneratedSampleCount,
    totalCheckedSampleCount,
    totalFailedSampleCount,
  };
};

const buildAvailabilityStatusSummary = (
  roots: readonly DeterminizedPimcActionAvailabilityV0RootRecord[],
): DeterminizedPimcActionAvailabilityV0AvailabilityStatusSummary => {
  const probeStatusCounts = emptyProbeStatusCounts();
  const sampleAvailabilityStatusCounts = emptySampleAvailabilityCounts();
  const disagreementBucketCounts = emptyDisagreementBucketCounts();
  const availabilityRiskBucketCounts = emptyRiskBucketCounts();

  roots.forEach((root) => {
    addCount(probeStatusCounts, root.probeStatus);
    Object.entries(root.sampleAvailabilityStatusCounts).forEach(
      ([status, count]) => addCount(sampleAvailabilityStatusCounts, status, count),
    );
    addCount(disagreementBucketCounts, root.availabilityDisagreementBucket);
    addCount(availabilityRiskBucketCounts, root.availabilityRiskBucket);
  });

  return {
    probeStatusCounts: sortRecord(probeStatusCounts),
    sampleAvailabilityStatusCounts: sortRecord(sampleAvailabilityStatusCounts),
    allActionsAvailableRootCount: roots.filter(
      (root) => root.allRootActionsAvailableInAllSamples,
    ).length,
    rootsWithMissingRootActions: roots.filter(
      (root) => root.rootActionBucketsMissingInAnySample > 0,
    ).length,
    rootsWithExtraSampledActions: roots.filter(
      (root) => root.sampleActionBucketsExtraInAnySample > 0,
    ).length,
    rootsWithAnyDisagreement: roots.filter(
      (root) => root.availabilityDisagreementCount > 0,
    ).length,
    disagreementBucketCounts: sortRecord(disagreementBucketCounts),
    availabilityRiskBucketCounts: sortRecord(availabilityRiskBucketCounts),
  };
};

const addObservedAggregateCounts = (
  target: Record<string, number>,
  observed: readonly DeterminizedPimcActionAvailabilityV0ObservedRoot[],
  field:
    | "missingActionKindCounts"
    | "extraActionKindCounts"
    | "missingTargetKindCounts"
    | "extraTargetKindCounts"
    | "missingTargetSideCounts"
    | "extraTargetSideCounts",
) => {
  observed.forEach((root) => {
    Object.entries(root[field]).forEach(([key, count]) => {
      addCount(target, key, count);
    });
  });
};

const buildActionBucketAggregates = ({
  roots,
  observedRoots,
}: {
  roots: readonly DeterminizedPimcActionAvailabilityV0RootRecord[];
  observedRoots: readonly DeterminizedPimcActionAvailabilityV0ObservedRoot[];
}): DeterminizedPimcActionAvailabilityV0ActionBucketAggregates => {
  const aggregateMissingByPublicActionKind: Record<string, number> = {};
  const aggregateExtraByPublicActionKind: Record<string, number> = {};
  const aggregateMissingByTargetKind: Record<string, number> = {};
  const aggregateExtraByTargetKind: Record<string, number> = {};
  const aggregateMissingByTargetSide: Record<string, number> = {};
  const aggregateExtraByTargetSide: Record<string, number> = {};

  addObservedAggregateCounts(
    aggregateMissingByPublicActionKind,
    observedRoots,
    "missingActionKindCounts",
  );
  addObservedAggregateCounts(
    aggregateExtraByPublicActionKind,
    observedRoots,
    "extraActionKindCounts",
  );
  addObservedAggregateCounts(
    aggregateMissingByTargetKind,
    observedRoots,
    "missingTargetKindCounts",
  );
  addObservedAggregateCounts(
    aggregateExtraByTargetKind,
    observedRoots,
    "extraTargetKindCounts",
  );
  addObservedAggregateCounts(
    aggregateMissingByTargetSide,
    observedRoots,
    "missingTargetSideCounts",
  );
  addObservedAggregateCounts(
    aggregateExtraByTargetSide,
    observedRoots,
    "extraTargetSideCounts",
  );

  return {
    rootPublicActionCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.rootActionBucketCount),
    ),
    sampledPublicActionCountStats: buildSamplerReadinessCountStats(
      observedRoots.flatMap((root) => root.sampledActionBucketCounts),
    ),
    missingRootActionBucketStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.rootActionBucketsMissingInAnySample),
    ),
    extraSampledActionBucketStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.sampleActionBucketsExtraInAnySample),
    ),
    disagreementStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.availabilityDisagreementCount),
    ),
    aggregateMissingByPublicActionKind: sortRecord(
      aggregateMissingByPublicActionKind,
    ),
    aggregateExtraByPublicActionKind: sortRecord(
      aggregateExtraByPublicActionKind,
    ),
    aggregateMissingByTargetKind: sortRecord(aggregateMissingByTargetKind),
    aggregateExtraByTargetKind: sortRecord(aggregateExtraByTargetKind),
    aggregateMissingByTargetSide: sortRecord(aggregateMissingByTargetSide),
    aggregateExtraByTargetSide: sortRecord(aggregateExtraByTargetSide),
  };
};

export const buildDeterminizedPimcActionAvailabilityV0 = ({
  probeRunId,
  suiteId,
  contractSummary,
  cFp68EligibleRoots,
  cFp68SkippedRoots,
  cFp69ProbeRoots,
  cFp69SkippedRoots,
  observedRoots,
  benchmark,
  sourceCfp68ArtifactReferences = [],
  sourceCfp69ArtifactReferences = [],
}: BuildDeterminizedPimcActionAvailabilityV0Input): DeterminizedPimcActionAvailabilityV0Result => {
  const observedKeyCounts = keyCounts(observedRoots);
  const eligibleKeyCounts = keyCounts(cFp68EligibleRoots);
  const cFp69ProbeKeyCounts = keyCounts(cFp69ProbeRoots);
  const cFp68SkippedKeyCounts = keyCounts(cFp68SkippedRoots);
  const cFp69SkippedKeyCounts = keyCounts(cFp69SkippedRoots);
  const observedByKey = firstRecordByKey(observedRoots);
  const cFp69ProbeByKey = firstRecordByKey(cFp69ProbeRoots);
  const cFp69SkippedByKey = firstRecordByKey(cFp69SkippedRoots);
  const eligibleKeys = new Set(
    cFp68EligibleRoots.map((root) =>
      buildDeterminizedPimcActionAvailabilityV0RootKey(root),
    ),
  );
  const cFp68SkippedKeys = new Set(
    cFp68SkippedRoots.map((root) =>
      buildDeterminizedPimcActionAvailabilityV0RootKey(root),
    ),
  );
  const cFp69ProbeKeys = new Set(
    cFp69ProbeRoots.map((root) =>
      buildDeterminizedPimcActionAvailabilityV0RootKey(root),
    ),
  );
  const cFp69SkippedKeys = new Set(
    cFp69SkippedRoots.map((root) =>
      buildDeterminizedPimcActionAvailabilityV0RootKey(root),
    ),
  );
  const contractKeys = new Set([
    ...eligibleKeys,
    ...cFp68SkippedKeys,
    ...cFp69ProbeKeys,
    ...cFp69SkippedKeys,
  ]);
  const sourceCfp69ProbeRunId =
    cFp69ProbeRoots[0]?.probeRunId ??
    cFp69SkippedRoots[0]?.probeRunId ??
    `${suiteId}:determinized-pimc-probe-v0:cFp69`;

  const skippedRoots = cFp68SkippedRoots.map((root) =>
    buildSkippedAvailabilityRecord({
      probeRunId,
      root,
      cFp69SkippedRoot: cFp69SkippedByKey.get(
        buildDeterminizedPimcActionAvailabilityV0RootKey(root),
      ),
      sourceCfp69ProbeRunId,
    }),
  );
  const availabilityRoots = cFp68EligibleRoots.map((eligibleRoot) =>
    buildAvailabilityRootRecord({
      probeRunId,
      eligibleRoot,
      cFp69Root: cFp69ProbeByKey.get(
        buildDeterminizedPimcActionAvailabilityV0RootKey(eligibleRoot),
      ),
      observedRoot: observedByKey.get(
        buildDeterminizedPimcActionAvailabilityV0RootKey(eligibleRoot),
      ),
      cFp69SkippedKeys,
      sourceCfp69ProbeRunId,
    }),
  );
  const availabilityKeys = new Set(
    availabilityRoots.map((root) =>
      buildDeterminizedPimcActionAvailabilityV0RootKey(root),
    ),
  );

  const cFp68ContractNotProbeReady =
    contractSummary.contractStatus === "probe_ready" ? 0 : 1;
  const eligibleRootsNotObserved = cFp68EligibleRoots.filter(
    (root) =>
      !observedByKey.has(buildDeterminizedPimcActionAvailabilityV0RootKey(root)),
  ).length;
  const observedRootsNotInCfp68Cfp69Contract = observedRoots.filter(
    (root) =>
      !contractKeys.has(buildDeterminizedPimcActionAvailabilityV0RootKey(root)),
  ).length;
  const skippedRootsIncorrectlyProbed = cFp68SkippedRoots.filter((root) =>
    availabilityKeys.has(buildDeterminizedPimcActionAvailabilityV0RootKey(root)),
  ).length;
  const cfp68Cfp69EligibleRootCountDelta =
    cFp68EligibleRoots.length - cFp69ProbeRoots.length;
  const cfp68Cfp69SkippedRootCountDelta =
    cFp68SkippedRoots.length - cFp69SkippedRoots.length;
  const cfp69ProbeRootsMissingCfp68EligibleRoot = cFp69ProbeRoots.filter(
    (root) =>
      !eligibleKeys.has(buildDeterminizedPimcActionAvailabilityV0RootKey(root)),
  ).length;
  const cfp69SkippedRootsMissingCfp68SkippedRoot = cFp69SkippedRoots.filter(
    (root) =>
      !cFp68SkippedKeys.has(
        buildDeterminizedPimcActionAvailabilityV0RootKey(root),
      ),
  ).length;
  const cfp68Cfp69SampleCountMismatchRoots = cFp68EligibleRoots.filter((root) => {
    const cfp69 = cFp69ProbeByKey.get(
      buildDeterminizedPimcActionAvailabilityV0RootKey(root),
    );
    return (
      !cfp69 ||
      cfp69.sampleCountRequested !== root.sampleCountRequested ||
      cfp69.sampleCountValid !== root.sampleCountValid
    );
  }).length;
  const cfp68Cfp69PublicActionCountMismatchRoots = availabilityRoots.filter(
    (root) =>
      root.probeStatus === "cfp69_contract_mismatch" &&
      observedByKey.has(buildDeterminizedPimcActionAvailabilityV0RootKey(root)),
  ).length;
  const cfp68FingerprintMismatchObservedRoots = observedRoots.filter(
    (root) =>
      root.cfp68RootPublicFingerprint &&
      root.rootPublicFingerprint &&
      root.cfp68RootPublicFingerprint !== root.rootPublicFingerprint,
  ).length;

  const sourceConsistencyValues = [
    cFp68ContractNotProbeReady,
    eligibleRootsNotObserved,
    observedRootsNotInCfp68Cfp69Contract,
    skippedRootsIncorrectlyProbed,
    duplicateKeyCount(observedKeyCounts),
    duplicateKeyCount(eligibleKeyCounts),
    duplicateKeyCount(cFp69ProbeKeyCounts),
    duplicateKeyCount(cFp68SkippedKeyCounts),
    duplicateKeyCount(cFp69SkippedKeyCounts),
    Math.abs(cfp68Cfp69EligibleRootCountDelta),
    Math.abs(cfp68Cfp69SkippedRootCountDelta),
    cfp69ProbeRootsMissingCfp68EligibleRoot,
    cfp69SkippedRootsMissingCfp68SkippedRoot,
    cfp68Cfp69SampleCountMismatchRoots,
    cfp68Cfp69PublicActionCountMismatchRoots,
    cfp68FingerprintMismatchObservedRoots,
  ];
  const sourceConsistencyStatus: DeterminizedPimcActionAvailabilityV0ReadinessStatus =
    sourceConsistencyValues.every((count) => count === 0)
      ? "probe_ready"
      : "not_probe_ready";

  const sourceConsistency: DeterminizedPimcActionAvailabilityV0SourceConsistency =
    {
      status: sourceConsistencyStatus,
      cFp68ContractStatus: contractSummary.contractStatus,
      cFp68ContractNotProbeReady,
      cFp68TotalRootCount: contractSummary.totalCfp61RootCount,
      cFp68EligibleRootsRead: cFp68EligibleRoots.length,
      cFp68SkippedRootsRead: cFp68SkippedRoots.length,
      cFp69ProbeRootsRead: cFp69ProbeRoots.length,
      cFp69SkippedRootsRead: cFp69SkippedRoots.length,
      benchmarkObservedRootsRead: observedRoots.length,
      eligibleRootsNotObserved,
      observedRootsNotInCfp68Cfp69Contract,
      skippedRootsIncorrectlyProbed,
      duplicateObservedRootKeys: duplicateKeyCount(observedKeyCounts),
      duplicateCfp68EligibleRootKeys: duplicateKeyCount(eligibleKeyCounts),
      duplicateCfp69ProbeRootKeys: duplicateKeyCount(cFp69ProbeKeyCounts),
      duplicateSkippedRootKeys:
        duplicateKeyCount(cFp68SkippedKeyCounts) +
        duplicateKeyCount(cFp69SkippedKeyCounts),
      cfp68Cfp69EligibleRootCountDelta,
      cfp68Cfp69SkippedRootCountDelta,
      cfp69ProbeRootsMissingCfp68EligibleRoot,
      cfp69SkippedRootsMissingCfp68SkippedRoot,
      cfp68Cfp69SampleCountMismatchRoots,
      cfp68Cfp69PublicActionCountMismatchRoots,
      cfp68FingerprintMismatchObservedRoots,
    };

  const skipCounters = buildSkipCounters(skippedRoots);
  const skippedRootCount = skippedRoots.length;
  const observedAvailabilityRoots = observedRoots.filter((root) =>
    eligibleKeys.has(buildDeterminizedPimcActionAvailabilityV0RootKey(root)),
  );

  return {
    probeRunId,
    suiteId,
    sourceBenchmarkSuiteId: contractSummary.sourceBenchmarkSuiteId,
    benchmark,
    availabilityRoots,
    skippedRoots,
    summary: {
      schemaVersion: "determinized-pimc-action-availability-v0-summary-v1",
      probeRunId,
      suiteId,
      sourceBenchmarkSuiteId: contractSummary.sourceBenchmarkSuiteId,
      probeVariant: "determinized-pimc-action-availability-v0",
      probeMode: "one_ply_sampled_world_action_availability",
      probeReadinessStatus: sourceConsistencyStatus,
      sourceCfp68ContractRunId: contractSummary.contractRunId,
      sourceCfp69ProbeRunId: sourceCfp69ProbeRunId,
      sourceCfp68ArtifactReferences,
      sourceCfp69ArtifactReferences,
      totalCfp68RootCount: contractSummary.totalCfp61RootCount,
      eligibleRootCount: cFp68EligibleRoots.length,
      availabilityRootCount: availabilityRoots.length,
      skippedRootCount,
      skippedRootPercentage: percentage(
        skippedRootCount,
        contractSummary.totalCfp61RootCount,
      ),
      matchCount: contractSummary.matchCount,
      sourceConsistency,
      sampleBudget: buildSampleBudget(availabilityRoots),
      availabilityStatus: buildAvailabilityStatusSummary(availabilityRoots),
      actionBucketAggregates: buildActionBucketAggregates({
        roots: availabilityRoots,
        observedRoots: observedAvailabilityRoots,
      }),
      skipCounters,
      skipCounterPercentages: buildSkipCounterPercentages(
        skipCounters,
        skippedRootCount,
      ),
      explicitNonClaims: DETERMINIZED_PIMC_ACTION_AVAILABILITY_V0_NON_CLAIMS,
      hiddenInfoSafetyNote:
        DETERMINIZED_PIMC_ACTION_AVAILABILITY_V0_HIDDEN_INFO_SAFETY_NOTE,
      cFp71Recommendation:
        DETERMINIZED_PIMC_ACTION_AVAILABILITY_V0_CFP71_RECOMMENDATION,
    },
  };
};

export const runDeterminizedPimcActionAvailabilityV0 = (
  input: RunDeterminizedPimcActionAvailabilityV0Input,
): DeterminizedPimcActionAvailabilityV0Result => {
  const requestedSuiteId =
    input.suiteId ?? input.suite?.id ?? input.contractSummary.suiteId;
  const probeRunId =
    input.probeRunId ??
    defaultDeterminizedPimcActionAvailabilityV0RunId(requestedSuiteId);
  const samplerRunId = input.contractSummary.sourceSamplerRunIds.materialization;
  const cFp68EligibleByKey = firstRecordByKey(input.cFp68EligibleRoots);
  const cFp69ProbeByKey = firstRecordByKey(input.cFp69ProbeRoots);
  const observedRoots: DeterminizedPimcActionAvailabilityV0ObservedRoot[] = [];
  const memoryStore = new Map<string, SamplerPublicTransferMemoryState>();

  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: probeRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      const key = buildDeterminizedPimcActionAvailabilityV0RootKey({
        ...root,
        faction: root.seats[root.seatId].faction,
        deckPresetId: root.seats[root.seatId].deckPresetId,
        phase: root.state.phase,
        round: root.state.round,
      });
      const memory = getSamplerPublicTransferMemoryForRoot(memoryStore, root);
      observedRoots.push(
        buildDeterminizedPimcActionAvailabilityV0ObservedRoot({
          input: root,
          samplerRunId,
          memory,
          cFp68EligibleRoot: cFp68EligibleByKey.get(key),
          cFp69ProbeRoot: cFp69ProbeByKey.get(key),
        }),
      );
    },
  });

  return buildDeterminizedPimcActionAvailabilityV0({
    probeRunId,
    suiteId: benchmark.summary.suiteId,
    contractSummary: input.contractSummary,
    cFp68EligibleRoots: input.cFp68EligibleRoots,
    cFp68SkippedRoots: input.cFp68SkippedRoots,
    cFp69ProbeRoots: input.cFp69ProbeRoots,
    cFp69SkippedRoots: input.cFp69SkippedRoots,
    observedRoots,
    benchmark,
    sourceCfp68ArtifactReferences: input.sourceCfp68ArtifactReferences,
    sourceCfp69ArtifactReferences: input.sourceCfp69ArtifactReferences,
  });
};
