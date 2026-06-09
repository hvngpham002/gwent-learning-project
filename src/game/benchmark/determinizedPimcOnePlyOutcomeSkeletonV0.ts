import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import { commandFromLegalMove } from "@/game/ai";
import type { CatalogFaction } from "@/game/catalog";
import {
  executeCommand,
  getLegalMoves,
  type EngineCommand,
  type EngineTransaction,
  type LegalMove,
  type LegalMoveKind,
  type MatchPhase,
  type MatchState,
  type SeatId,
} from "@/game/core";

import {
  buildDeterminizedPimcActionAvailabilityV0InMemoryMaterializationForRoot,
  buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey,
  buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets,
  collectDeterminizedPimcActionAvailabilityV0PreservedHiddenAssignments,
  rebuildDeterminizedPimcActionAvailabilityV0SampledRootState,
  type DeterminizedPimcActionAvailabilityV0PublicActionBucket,
  type DeterminizedPimcActionAvailabilityV0RootRecord,
  type DeterminizedPimcActionAvailabilityV0SkippedRootRecord,
  type DeterminizedPimcActionAvailabilityV0Summary,
} from "./determinizedPimcActionAvailabilityV0";
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
  getSamplerPublicTransferMemoryForRoot,
  type SamplerPublicTransferMemoryState,
} from "./samplerMaterialization";
import {
  buildPublicActionAbstraction,
  buildSamplerReadinessCountStats,
  type PublicSearchActionKind,
  type SamplerReadinessCountStats,
} from "./samplerReadiness";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSuite,
} from "./types";

export type DeterminizedPimcOnePlyOutcomeSkeletonV0RootSchemaVersion =
  "determinized-pimc-one-ply-outcome-skeleton-v0-root-v1";
export type DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootSchemaVersion =
  "determinized-pimc-one-ply-outcome-skeleton-v0-skipped-root-v1";
export type DeterminizedPimcOnePlyOutcomeSkeletonV0SummarySchemaVersion =
  "determinized-pimc-one-ply-outcome-skeleton-v0-summary-v1";

export type DeterminizedPimcOnePlyOutcomeSkeletonV0ReadinessStatus =
  | "probe_ready"
  | "not_probe_ready";

export type DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus =
  | "completed"
  | "sample_action_missing"
  | "move_command_conversion_failed"
  | "engine_command_rejected"
  | "engine_command_exception"
  | "sampled_world_rebuild_failed"
  | "sampled_legal_move_generation_failed"
  | "public_action_abstraction_failed"
  | "outcome_classification_failed"
  | "one_ply_execution_deferred";

export type DeterminizedPimcOnePlyOutcomeSkeletonV0PublicOutcomeKind =
  | "mulligan_selection"
  | "prompt_resolution"
  | "pass"
  | "card_play"
  | "leader_use"
  | "round_end_resolution"
  | "unknown_public_transition";

export type DeterminizedPimcOnePlyOutcomeSkeletonV0TransitionKind =
  | "same_phase_same_round"
  | "phase_changed_same_round"
  | "round_advanced"
  | "match_completed"
  | "transition_unknown";

export type DeterminizedPimcOnePlyOutcomeSkeletonV0DivergenceBucket =
  | "none"
  | "one"
  | "two_to_three"
  | "four_plus"
  | "deferred"
  | "failed";

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0RootIdentity {
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

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord
  extends DeterminizedPimcOnePlyOutcomeSkeletonV0RootIdentity {
  schemaVersion: DeterminizedPimcOnePlyOutcomeSkeletonV0RootSchemaVersion;
  probeRunId: string;
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  eligibilityStatus: "eligible_valid_root";
  cfp69ProbeStatus: DeterminizedPimcProbeV0RootRecord["probeStatus"];
  cfp70AvailabilityStatus: DeterminizedPimcActionAvailabilityV0RootRecord["probeStatus"];
  cfp69PublicActionCount: number;
  cfp70RootActionBucketCount: number;
  cfp70AllRootActionsAvailableInAllSamples: boolean;
  probeVariant: "determinized-pimc-one-ply-outcome-skeleton-v0";
  probeMode: "one_ply_public_action_outcome_skeleton";
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  sampleCountOutcomeFailed: number;
  rootPublicActionCount: number;
  publicActionSamplePairCount: number;
  completedPairCount: number;
  failedOrDeferredPairCount: number;
  sampleActionMissingPairCount: number;
  moveCommandConversionFailedPairCount: number;
  engineCommandRejectedPairCount: number;
  engineCommandExceptionPairCount: number;
  outcomeClassificationFailedPairCount: number;
  onePlyExecutionDeferredPairCount: number;
  executionStatusCounts: Record<string, number>;
  publicOutcomeKindCounts: Record<string, number>;
  transitionKindCounts: Record<string, number>;
  rootActionBucketsWithAnyFailure: number;
  rootActionBucketsWithAnyDivergence: number;
  outcomeDivergenceCount: number;
  outcomeDivergenceBucket: DeterminizedPimcOnePlyOutcomeSkeletonV0DivergenceBucket;
  outcomeRiskBucket: DeterminizedPimcOnePlyOutcomeSkeletonV0DivergenceBucket;
  probeStatus: DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord
  extends DeterminizedPimcOnePlyOutcomeSkeletonV0RootIdentity {
  schemaVersion: DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootSchemaVersion;
  probeRunId: string;
  probeVariant: "determinized-pimc-one-ply-outcome-skeleton-v0";
  eligibilityStatus: "skipped_invalid_root";
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  cfp69SkippedStatus: DeterminizedPimcProbeV0SkippedRootRecord["eligibilityStatus"];
  cfp70SkippedStatus: DeterminizedPimcActionAvailabilityV0SkippedRootRecord["eligibilityStatus"];
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

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot
  extends Omit<
    DeterminizedPimcOnePlyOutcomeSkeletonV0RootIdentity,
    "rootPublicFingerprint"
  > {
  rootPublicFingerprint?: string;
  cfp68RootPublicFingerprint?: string;
  cfp69LegalMoveCount: number;
  cfp69PublicActionCount: number;
  cfp70AvailabilityStatus: DeterminizedPimcActionAvailabilityV0RootRecord["probeStatus"];
  cfp70RootActionBucketCount: number;
  cfp70AllRootActionsAvailableInAllSamples: boolean;
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  sampleCountOutcomeFailed: number;
  rootPublicActionCount: number;
  publicActionSamplePairCount: number;
  completedPairCount: number;
  failedOrDeferredPairCount: number;
  sampleActionMissingPairCount: number;
  moveCommandConversionFailedPairCount: number;
  engineCommandRejectedPairCount: number;
  engineCommandExceptionPairCount: number;
  outcomeClassificationFailedPairCount: number;
  onePlyExecutionDeferredPairCount: number;
  executionStatusCounts: Record<string, number>;
  publicOutcomeKindCounts: Record<string, number>;
  transitionKindCounts: Record<string, number>;
  rootActionBucketsWithAnyFailure: number;
  rootActionBucketsWithAnyDivergence: number;
  outcomeDivergenceCount: number;
  probeStatus: DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage {
  count: number;
  percentageOfSkippedRoots: number;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0SkipCounters {
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

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0SkipCounterPercentages {
  bySuite: Record<string, DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage>;
  byPhase: Record<string, DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage>;
  byRound: Record<string, DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage>;
  byMatchup: Record<string, DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage>;
  byPolicy: Record<string, DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage>;
  byFaction: Record<string, DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage>;
  byDeckPreset: Record<
    string,
    DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage
  >;
  byProvenanceLabel: Record<
    string,
    DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage
  >;
  byInvalidReason: Record<
    string,
    DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage
  >;
  bySkipReason: Record<
    string,
    DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage
  >;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0SourceConsistency {
  status: DeterminizedPimcOnePlyOutcomeSkeletonV0ReadinessStatus;
  cFp68ContractStatus: DeterminizedProbeContractSummary["contractStatus"];
  cFp68ContractNotProbeReady: number;
  cFp68TotalRootCount: number;
  cFp68EligibleRootsRead: number;
  cFp68SkippedRootsRead: number;
  cFp69ProbeRootsRead: number;
  cFp69SkippedRootsRead: number;
  cFp70AvailabilityRootsRead: number;
  cFp70SkippedRootsRead: number;
  benchmarkObservedRootsRead: number;
  eligibleRootsNotObserved: number;
  observedRootsNotInCfp68Cfp69Cfp70Contract: number;
  skippedRootsIncorrectlyProbed: number;
  duplicateObservedRootKeys: number;
  duplicateCfp68EligibleRootKeys: number;
  duplicateCfp69ProbeRootKeys: number;
  duplicateCfp70AvailabilityRootKeys: number;
  duplicateSkippedRootKeys: number;
  cfp68Cfp69EligibleRootCountDelta: number;
  cfp68Cfp70AvailabilityRootCountDelta: number;
  cfp69Cfp70AvailabilityRootCountDelta: number;
  cfp68Cfp69SkippedRootCountDelta: number;
  cfp68Cfp70SkippedRootCountDelta: number;
  cfp69Cfp70SkippedRootCountDelta: number;
  cfp69ProbeRootsMissingCfp68EligibleRoot: number;
  cfp70AvailabilityRootsMissingCfp68EligibleRoot: number;
  cfp69SkippedRootsMissingCfp68SkippedRoot: number;
  cfp70SkippedRootsMissingCfp68SkippedRoot: number;
  cfp68Cfp69SampleCountMismatchRoots: number;
  cfp68Cfp70SampleCountMismatchRoots: number;
  cfp69Cfp70PublicActionCountMismatchRoots: number;
  cfp70RootsWithAvailabilityDisagreement: number;
  cfp68FingerprintMismatchObservedRoots: number;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0SampleBudget {
  outcomeRootCount: number;
  requestedSamplesPerRootDistribution: Record<string, number>;
  totalRequestedSampleCount: number;
  totalGeneratedSampleCount: number;
  totalCheckedSampleCount: number;
  totalFailedSampleCount: number;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0OutcomeStatusSummary {
  probeStatusCounts: Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus,
    number
  >;
  executionStatusCounts: Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus,
    number
  >;
  publicOutcomeKindCounts: Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0PublicOutcomeKind,
    number
  >;
  transitionKindCounts: Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0TransitionKind,
    number
  >;
  publicActionSamplePairTotal: number;
  completedPairCount: number;
  failedOrDeferredPairCount: number;
  sampleActionMissingPairCount: number;
  moveCommandConversionFailedPairCount: number;
  engineCommandRejectedPairCount: number;
  engineCommandExceptionPairCount: number;
  outcomeClassificationFailedPairCount: number;
  onePlyExecutionDeferredPairCount: number;
  rootsWithAnyFailedOrDeferredPair: number;
  rootsWithAnyPublicOutcomeDivergence: number;
  divergenceBucketCounts: Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0DivergenceBucket,
    number
  >;
  outcomeRiskBucketCounts: Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0DivergenceBucket,
    number
  >;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0ActionBucketAggregates {
  rootPublicActionCountStats: SamplerReadinessCountStats;
  publicActionSamplePairCountStats: SamplerReadinessCountStats;
  completedPairCountStats: SamplerReadinessCountStats;
  failedOrDeferredPairCountStats: SamplerReadinessCountStats;
  outcomeDivergenceCountStats: SamplerReadinessCountStats;
  aggregateExecutionStatusCountsByPublicActionKind: Record<
    PublicSearchActionKind,
    Record<string, number>
  >;
  aggregateOutcomeKindCountsByPublicActionKind: Record<
    PublicSearchActionKind,
    Record<string, number>
  >;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0Summary {
  schemaVersion: DeterminizedPimcOnePlyOutcomeSkeletonV0SummarySchemaVersion;
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  probeVariant: "determinized-pimc-one-ply-outcome-skeleton-v0";
  probeMode: "one_ply_public_action_outcome_skeleton";
  probeReadinessStatus: DeterminizedPimcOnePlyOutcomeSkeletonV0ReadinessStatus;
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  sourceCfp68ArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp69ArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp70ArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  totalCfp68RootCount: number;
  eligibleRootCount: number;
  outcomeRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  matchCount: number;
  sourceConsistency: DeterminizedPimcOnePlyOutcomeSkeletonV0SourceConsistency;
  sampleBudget: DeterminizedPimcOnePlyOutcomeSkeletonV0SampleBudget;
  outcomeStatus: DeterminizedPimcOnePlyOutcomeSkeletonV0OutcomeStatusSummary;
  actionBucketAggregates: DeterminizedPimcOnePlyOutcomeSkeletonV0ActionBucketAggregates;
  skipCounters: DeterminizedPimcOnePlyOutcomeSkeletonV0SkipCounters;
  skipCounterPercentages: DeterminizedPimcOnePlyOutcomeSkeletonV0SkipCounterPercentages;
  explicitNonClaims: readonly string[];
  hiddenInfoSafetyNote: string;
  cFp72Recommendation: string;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0Result {
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  benchmark?: BenchmarkRunResult;
  outcomeRoots: DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord[];
  skippedRoots: DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord[];
  summary: DeterminizedPimcOnePlyOutcomeSkeletonV0Summary;
}

export interface BuildDeterminizedPimcOnePlyOutcomeSkeletonV0Input {
  probeRunId: string;
  suiteId: string;
  contractSummary: DeterminizedProbeContractSummary;
  cFp68EligibleRoots: readonly DeterminizedProbeContractEligibleRootRecord[];
  cFp68SkippedRoots: readonly DeterminizedProbeContractSkippedRootRecord[];
  cFp69ProbeRoots: readonly DeterminizedPimcProbeV0RootRecord[];
  cFp69SkippedRoots: readonly DeterminizedPimcProbeV0SkippedRootRecord[];
  cFp70AvailabilitySummary: DeterminizedPimcActionAvailabilityV0Summary;
  cFp70AvailabilityRoots: readonly DeterminizedPimcActionAvailabilityV0RootRecord[];
  cFp70SkippedRoots: readonly DeterminizedPimcActionAvailabilityV0SkippedRootRecord[];
  observedRoots: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot[];
  observedAggregateCounts?: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedAggregateCounts;
  benchmark?: BenchmarkRunResult;
  sourceCfp68ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp69ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp70ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
}

export interface RunDeterminizedPimcOnePlyOutcomeSkeletonV0Input {
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
  cFp70AvailabilitySummary: DeterminizedPimcActionAvailabilityV0Summary;
  cFp70AvailabilityRoots: readonly DeterminizedPimcActionAvailabilityV0RootRecord[];
  cFp70SkippedRoots: readonly DeterminizedPimcActionAvailabilityV0SkippedRootRecord[];
  sourceCfp68ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp69ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp70ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
}

interface PublicActionBucketWithMoves
  extends DeterminizedPimcActionAvailabilityV0PublicActionBucket {
  moves: LegalMove[];
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionDeps {
  commandFromLegalMove?: (
    move: LegalMove,
  ) => Exclude<EngineCommand, { type: "StartMatch" }> | null;
  executeCommand?: (input: {
    state: MatchState;
    command: Exclude<EngineCommand, { type: "StartMatch" }>;
    catalogCards: typeof currentCatalogCards;
    catalogLeaders: typeof currentCatalogLeaders;
  }) => EngineTransaction | { status: "rejected" | "failed" };
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0SampleExecutionResult {
  sampledActionBucketCount: number;
  publicActionSamplePairCount: number;
  completedPairCount: number;
  failedOrDeferredPairCount: number;
  sampleActionMissingPairCount: number;
  moveCommandConversionFailedPairCount: number;
  engineCommandRejectedPairCount: number;
  engineCommandExceptionPairCount: number;
  outcomeClassificationFailedPairCount: number;
  onePlyExecutionDeferredPairCount: number;
  executionStatusCounts: Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus,
    number
  >;
  publicOutcomeKindCounts: Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0PublicOutcomeKind,
    number
  >;
  transitionKindCounts: Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0TransitionKind,
    number
  >;
  executionStatusCountsByPublicActionKind: Record<
    PublicSearchActionKind,
    Record<string, number>
  >;
  outcomeKindCountsByPublicActionKind: Record<
    PublicSearchActionKind,
    Record<string, number>
  >;
  bucketFailureKeys: ReadonlySet<string>;
  bucketShapeKeysByActionBucket: ReadonlyMap<string, ReadonlySet<string>>;
}

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedAggregateCounts {
  executionStatusCountsByPublicActionKind: Record<
    PublicSearchActionKind,
    Record<string, number>
  >;
  outcomeKindCountsByPublicActionKind: Record<
    PublicSearchActionKind,
    Record<string, number>
  >;
}

const publicActionKinds: readonly PublicSearchActionKind[] = [
  "choose_mulligan",
  "play_card",
  "use_leader",
  "choose_prompt_option",
  "pass",
  "resolve_round_end",
];

const executionStatuses: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus[] =
  [
    "completed",
    "sample_action_missing",
    "move_command_conversion_failed",
    "engine_command_rejected",
    "engine_command_exception",
    "sampled_world_rebuild_failed",
    "sampled_legal_move_generation_failed",
    "public_action_abstraction_failed",
    "outcome_classification_failed",
    "one_ply_execution_deferred",
  ];

const publicOutcomeKinds: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0PublicOutcomeKind[] =
  [
    "mulligan_selection",
    "prompt_resolution",
    "pass",
    "card_play",
    "leader_use",
    "round_end_resolution",
    "unknown_public_transition",
  ];

const transitionKinds: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0TransitionKind[] =
  [
    "same_phase_same_round",
    "phase_changed_same_round",
    "round_advanced",
    "match_completed",
    "transition_unknown",
  ];

const divergenceBuckets: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0DivergenceBucket[] =
  ["none", "one", "two_to_three", "four_plus", "deferred", "failed"];

export const DETERMINIZED_PIMC_ONE_PLY_OUTCOME_SKELETON_V0_NON_CLAIMS = [
  "No rollout was run.",
  "No action value was computed.",
  "No action ranking was produced.",
  "No move was selected by search.",
  "No win probability was estimated.",
  "No reward target was produced.",
  "No product AI behavior changed.",
  "Skipped roots were excluded from probe work and reported separately.",
] as const;

export const DETERMINIZED_PIMC_ONE_PLY_OUTCOME_SKELETON_V0_HIDDEN_INFO_SAFETY_NOTE =
  "cFp71 artifacts contain only public benchmark root metadata, scalar one-ply status counts, public transition-shape counts, skipped-root accounting, and source artifact hashes. They exclude private card identities, raw action payloads, sampled payloads, engine trace payloads, ranking fields, estimates, rollout results, and product AI wiring.";

export const DETERMINIZED_PIMC_ONE_PLY_OUTCOME_SKELETON_V0_CFP72_RECOMMENDATION =
  "cFp72 should inspect cFp71 one-ply failure, deferred, and divergence counts before choosing a repair casebook or a deeper benchmark-only branching probe. It should still avoid rollout, value, ranking, move recommendation, and product AI wiring.";

export const defaultDeterminizedPimcOnePlyOutcomeSkeletonV0RunId = (
  suiteId: string,
) => `${suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71`;

export const buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey =
  buildDeterminizedProbeContractRootKey;

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

const sortJsonValue = (value: unknown): JsonValue => {
  if (
    value === null ||
    typeof value === "boolean" ||
    typeof value === "number" ||
    typeof value === "string"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJsonValue(nested)]),
    );
  }
  return null;
};

const stableMoveSortKey = (move: LegalMove) =>
  JSON.stringify(sortJsonValue(move));

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
): Record<string, DeterminizedPimcOnePlyOutcomeSkeletonV0CountPercentage> =>
  sortRecord(
    Object.fromEntries(
      Object.entries(counts).map(([key, count]) => [
        key,
        { count, percentageOfSkippedRoots: percentage(count, denominator) },
      ]),
    ),
  );

const emptyExecutionStatusCounts = () =>
  Object.fromEntries(executionStatuses.map((status) => [status, 0])) as Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus,
    number
  >;

const emptyPublicOutcomeKindCounts = () =>
  Object.fromEntries(publicOutcomeKinds.map((kind) => [kind, 0])) as Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0PublicOutcomeKind,
    number
  >;

const emptyTransitionKindCounts = () =>
  Object.fromEntries(transitionKinds.map((kind) => [kind, 0])) as Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0TransitionKind,
    number
  >;

const emptyDivergenceBucketCounts = () =>
  Object.fromEntries(divergenceBuckets.map((bucket) => [bucket, 0])) as Record<
    DeterminizedPimcOnePlyOutcomeSkeletonV0DivergenceBucket,
    number
  >;

const emptyNestedPublicActionKindCounts = () =>
  Object.fromEntries(publicActionKinds.map((kind) => [kind, {}])) as Record<
    PublicSearchActionKind,
    Record<string, number>
  >;

const sortedNestedPublicActionKindCounts = (
  counts: Record<PublicSearchActionKind, Record<string, number>>,
) =>
  Object.fromEntries(
    publicActionKinds.map((kind) => [kind, sortRecord(counts[kind] ?? {})]),
  ) as Record<PublicSearchActionKind, Record<string, number>>;

const addNestedCount = (
  record: Record<PublicSearchActionKind, Record<string, number>>,
  kind: PublicSearchActionKind,
  key: string,
  amount = 1,
) => {
  addCount(record[kind], key, amount);
};

const combineNestedCounts = (
  target: Record<PublicSearchActionKind, Record<string, number>>,
  source: Record<PublicSearchActionKind, Record<string, number>>,
) => {
  publicActionKinds.forEach((kind) => {
    Object.entries(source[kind] ?? {}).forEach(([key, count]) => {
      addNestedCount(target, kind, key, count);
    });
  });
};

export const outcomeKindForDeterminizedPimcOnePlyOutcomeSkeletonV0LegalMoveKind = (
  kind: LegalMoveKind,
): DeterminizedPimcOnePlyOutcomeSkeletonV0PublicOutcomeKind => {
  switch (kind) {
    case "choose_mulligan":
      return "mulligan_selection";
    case "choose_prompt_option":
      return "prompt_resolution";
    case "pass":
      return "pass";
    case "play_card":
      return "card_play";
    case "use_leader":
      return "leader_use";
    case "resolve_round_end":
      return "round_end_resolution";
    default:
      return "unknown_public_transition";
  }
};

export const classifyDeterminizedPimcOnePlyOutcomeSkeletonV0Transition = ({
  beforeState,
  afterState,
}: {
  beforeState: MatchState;
  afterState?: MatchState;
}): DeterminizedPimcOnePlyOutcomeSkeletonV0TransitionKind => {
  if (!afterState) return "transition_unknown";
  if (afterState.phase === "game_end") return "match_completed";
  if (afterState.round > beforeState.round) return "round_advanced";
  if (afterState.phase !== beforeState.phase) return "phase_changed_same_round";
  if (afterState.round === beforeState.round) return "same_phase_same_round";
  return "transition_unknown";
};

const buildPublicActionBucketsWithMoves = (
  legalMoves: readonly LegalMove[],
  phase: MatchPhase,
  round: number,
): PublicActionBucketWithMoves[] => {
  const buckets = new Map<string, PublicActionBucketWithMoves>();
  legalMoves.forEach((move) => {
    const action = buildPublicActionAbstraction(move, phase, round);
    const key = buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey(
      action,
    );
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.moves.push(move);
    } else {
      buckets.set(key, { key, action, moves: [move] });
    }
  });

  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      moves: [...bucket.moves].sort((left, right) =>
        stableMoveSortKey(left).localeCompare(stableMoveSortKey(right)),
      ),
    }))
    .sort((left, right) => left.key.localeCompare(right.key));
};

const addPairStatus = ({
  result,
  publicActionKind,
  status,
  outcomeKind,
  transitionKind,
  bucketKey,
}: {
  result: MutableSampleExecutionResult;
  publicActionKind: PublicSearchActionKind;
  status: DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus;
  outcomeKind?: DeterminizedPimcOnePlyOutcomeSkeletonV0PublicOutcomeKind;
  transitionKind?: DeterminizedPimcOnePlyOutcomeSkeletonV0TransitionKind;
  bucketKey: string;
}) => {
  result.publicActionSamplePairCount += 1;
  addCount(result.executionStatusCounts, status);
  addNestedCount(
    result.executionStatusCountsByPublicActionKind,
    publicActionKind,
    status,
  );

  if (status === "completed" && outcomeKind && transitionKind) {
    result.completedPairCount += 1;
    addCount(result.publicOutcomeKindCounts, outcomeKind);
    addCount(result.transitionKindCounts, transitionKind);
    addNestedCount(
      result.outcomeKindCountsByPublicActionKind,
      publicActionKind,
      outcomeKind,
    );
    const shapes = result.bucketShapeKeysByActionBucket.get(bucketKey) ?? new Set();
    shapes.add(`${outcomeKind}|${transitionKind}`);
    result.bucketShapeKeysByActionBucket.set(bucketKey, shapes);
    return;
  }

  result.failedOrDeferredPairCount += 1;
  result.bucketFailureKeys.add(bucketKey);
  if (status === "sample_action_missing") {
    result.sampleActionMissingPairCount += 1;
  } else if (status === "move_command_conversion_failed") {
    result.moveCommandConversionFailedPairCount += 1;
  } else if (status === "engine_command_rejected") {
    result.engineCommandRejectedPairCount += 1;
  } else if (status === "engine_command_exception") {
    result.engineCommandExceptionPairCount += 1;
  } else if (status === "outcome_classification_failed") {
    result.outcomeClassificationFailedPairCount += 1;
  } else if (status === "one_ply_execution_deferred") {
    result.onePlyExecutionDeferredPairCount += 1;
  }
};

interface MutableSampleExecutionResult
  extends Omit<
    DeterminizedPimcOnePlyOutcomeSkeletonV0SampleExecutionResult,
    "bucketFailureKeys" | "bucketShapeKeysByActionBucket"
  > {
  bucketFailureKeys: Set<string>;
  bucketShapeKeysByActionBucket: Map<string, Set<string>>;
}

const emptySampleExecutionResult = (
  sampledActionBucketCount: number,
): MutableSampleExecutionResult => ({
  sampledActionBucketCount,
  publicActionSamplePairCount: 0,
  completedPairCount: 0,
  failedOrDeferredPairCount: 0,
  sampleActionMissingPairCount: 0,
  moveCommandConversionFailedPairCount: 0,
  engineCommandRejectedPairCount: 0,
  engineCommandExceptionPairCount: 0,
  outcomeClassificationFailedPairCount: 0,
  onePlyExecutionDeferredPairCount: 0,
  executionStatusCounts: emptyExecutionStatusCounts(),
  publicOutcomeKindCounts: emptyPublicOutcomeKindCounts(),
  transitionKindCounts: emptyTransitionKindCounts(),
  executionStatusCountsByPublicActionKind: emptyNestedPublicActionKindCounts(),
  outcomeKindCountsByPublicActionKind: emptyNestedPublicActionKindCounts(),
  bucketFailureKeys: new Set(),
  bucketShapeKeysByActionBucket: new Map(),
});

export const executeDeterminizedPimcOnePlyOutcomeSkeletonV0Sample = ({
  sampledState,
  rootBuckets,
  sampledLegalMoves,
  phase,
  round,
  deps = {},
}: {
  sampledState: MatchState;
  seatId: SeatId;
  rootBuckets: readonly DeterminizedPimcActionAvailabilityV0PublicActionBucket[];
  sampledLegalMoves: readonly LegalMove[];
  phase: MatchPhase;
  round: number;
  deps?: DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionDeps;
}): DeterminizedPimcOnePlyOutcomeSkeletonV0SampleExecutionResult => {
  const sampledBuckets = buildPublicActionBucketsWithMoves(
    sampledLegalMoves,
    phase,
    round,
  );
  const sampledByKey = new Map(
    sampledBuckets.map((bucket) => [bucket.key, bucket]),
  );
  const result = emptySampleExecutionResult(sampledBuckets.length);
  const toCommand = deps.commandFromLegalMove ?? commandFromLegalMove;
  const applyCommand = deps.executeCommand ?? executeCommand;

  rootBuckets.forEach((rootBucket) => {
    const publicActionKind = rootBucket.action.kind;
    const sampledBucket = sampledByKey.get(rootBucket.key);
    if (!sampledBucket || sampledBucket.moves.length === 0) {
      addPairStatus({
        result,
        publicActionKind,
        status: "sample_action_missing",
        bucketKey: rootBucket.key,
      });
      return;
    }

    const move = sampledBucket.moves[0];
    const command = toCommand(move);
    if (!command) {
      addPairStatus({
        result,
        publicActionKind,
        status: "move_command_conversion_failed",
        bucketKey: rootBucket.key,
      });
      return;
    }

    try {
      const transaction = applyCommand({
        state: structuredClone(sampledState) as MatchState,
        command,
        catalogCards: currentCatalogCards,
        catalogLeaders: currentCatalogLeaders,
      });
      if ("status" in transaction && transaction.status) {
        addPairStatus({
          result,
          publicActionKind,
          status: "engine_command_rejected",
          bucketKey: rootBucket.key,
        });
        return;
      }
      if (!("state" in transaction)) {
        addPairStatus({
          result,
          publicActionKind,
          status: "engine_command_rejected",
          bucketKey: rootBucket.key,
        });
        return;
      }

      const outcomeKind =
        outcomeKindForDeterminizedPimcOnePlyOutcomeSkeletonV0LegalMoveKind(
          move.kind,
        );
      const transitionKind =
        classifyDeterminizedPimcOnePlyOutcomeSkeletonV0Transition({
          beforeState: sampledState,
          afterState: transaction.state,
        });
      if (transitionKind === "transition_unknown") {
        addPairStatus({
          result,
          publicActionKind,
          status: "outcome_classification_failed",
          bucketKey: rootBucket.key,
        });
        return;
      }

      addPairStatus({
        result,
        publicActionKind,
        status: "completed",
        outcomeKind,
        transitionKind,
        bucketKey: rootBucket.key,
      });
    } catch {
      addPairStatus({
        result,
        publicActionKind,
        status: "engine_command_exception",
        bucketKey: rootBucket.key,
      });
    }
  });

  return {
    ...result,
    executionStatusCounts: sortRecord(result.executionStatusCounts),
    publicOutcomeKindCounts: sortRecord(result.publicOutcomeKindCounts),
    transitionKindCounts: sortRecord(result.transitionKindCounts),
    executionStatusCountsByPublicActionKind: sortedNestedPublicActionKindCounts(
      result.executionStatusCountsByPublicActionKind,
    ),
    outcomeKindCountsByPublicActionKind: sortedNestedPublicActionKindCounts(
      result.outcomeKindCountsByPublicActionKind,
    ),
  };
};

const baseObservedIdentity = (
  input: BenchmarkRootObserverInput,
): Omit<
  DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot,
  | "rootPublicFingerprint"
  | "cfp68RootPublicFingerprint"
  | "cfp69LegalMoveCount"
  | "cfp69PublicActionCount"
  | "cfp70AvailabilityStatus"
  | "cfp70RootActionBucketCount"
  | "cfp70AllRootActionsAvailableInAllSamples"
  | "sampleCountRequested"
  | "sampleCountGenerated"
  | "sampleCountChecked"
  | "sampleCountOutcomeFailed"
  | "rootPublicActionCount"
  | "publicActionSamplePairCount"
  | "completedPairCount"
  | "failedOrDeferredPairCount"
  | "sampleActionMissingPairCount"
  | "moveCommandConversionFailedPairCount"
  | "engineCommandRejectedPairCount"
  | "engineCommandExceptionPairCount"
  | "outcomeClassificationFailedPairCount"
  | "onePlyExecutionDeferredPairCount"
  | "executionStatusCounts"
  | "publicOutcomeKindCounts"
  | "transitionKindCounts"
  | "rootActionBucketsWithAnyFailure"
  | "rootActionBucketsWithAnyDivergence"
  | "outcomeDivergenceCount"
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

const mergeSampleResult = (
  target: MutableSampleExecutionResult,
  sample: DeterminizedPimcOnePlyOutcomeSkeletonV0SampleExecutionResult,
) => {
  target.publicActionSamplePairCount += sample.publicActionSamplePairCount;
  target.completedPairCount += sample.completedPairCount;
  target.failedOrDeferredPairCount += sample.failedOrDeferredPairCount;
  target.sampleActionMissingPairCount += sample.sampleActionMissingPairCount;
  target.moveCommandConversionFailedPairCount +=
    sample.moveCommandConversionFailedPairCount;
  target.engineCommandRejectedPairCount += sample.engineCommandRejectedPairCount;
  target.engineCommandExceptionPairCount += sample.engineCommandExceptionPairCount;
  target.outcomeClassificationFailedPairCount +=
    sample.outcomeClassificationFailedPairCount;
  target.onePlyExecutionDeferredPairCount +=
    sample.onePlyExecutionDeferredPairCount;
  Object.entries(sample.executionStatusCounts).forEach(([status, count]) => {
    addCount(target.executionStatusCounts, status, count);
  });
  Object.entries(sample.publicOutcomeKindCounts).forEach(([kind, count]) => {
    addCount(target.publicOutcomeKindCounts, kind, count);
  });
  Object.entries(sample.transitionKindCounts).forEach(([kind, count]) => {
    addCount(target.transitionKindCounts, kind, count);
  });
  combineNestedCounts(
    target.executionStatusCountsByPublicActionKind,
    sample.executionStatusCountsByPublicActionKind,
  );
  combineNestedCounts(
    target.outcomeKindCountsByPublicActionKind,
    sample.outcomeKindCountsByPublicActionKind,
  );
  sample.bucketFailureKeys.forEach((key) => target.bucketFailureKeys.add(key));
  sample.bucketShapeKeysByActionBucket.forEach((shapes, key) => {
    const targetShapes = target.bucketShapeKeysByActionBucket.get(key) ?? new Set();
    shapes.forEach((shape) => targetShapes.add(shape));
    target.bucketShapeKeysByActionBucket.set(key, targetShapes);
  });
};

const addWholeSampleFailure = ({
  target,
  rootBuckets,
  status,
}: {
  target: MutableSampleExecutionResult;
  rootBuckets: readonly DeterminizedPimcActionAvailabilityV0PublicActionBucket[];
  status: DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus;
}) => {
  rootBuckets.forEach((bucket) => {
    addPairStatus({
      result: target,
      publicActionKind: bucket.action.kind,
      status,
      bucketKey: bucket.key,
    });
  });
};

const divergenceBucketForCount = (
  count: number,
): DeterminizedPimcOnePlyOutcomeSkeletonV0DivergenceBucket => {
  if (count <= 0) return "none";
  if (count === 1) return "one";
  if (count <= 3) return "two_to_three";
  return "four_plus";
};

const riskBucketForRoot = ({
  failedOrDeferredPairCount,
  deferredPairCount,
  divergenceCount,
}: {
  failedOrDeferredPairCount: number;
  deferredPairCount: number;
  divergenceCount: number;
}): DeterminizedPimcOnePlyOutcomeSkeletonV0DivergenceBucket => {
  if (deferredPairCount > 0) return "deferred";
  if (failedOrDeferredPairCount > 0) return "failed";
  return divergenceBucketForCount(divergenceCount);
};

const probeStatusForObservedRoot = (
  observed: Pick<
    DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot,
    | "completedPairCount"
    | "failedOrDeferredPairCount"
    | "sampleActionMissingPairCount"
    | "moveCommandConversionFailedPairCount"
    | "engineCommandRejectedPairCount"
    | "engineCommandExceptionPairCount"
    | "outcomeClassificationFailedPairCount"
    | "onePlyExecutionDeferredPairCount"
  >,
): DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionStatus => {
  if (observed.onePlyExecutionDeferredPairCount > 0) {
    return "one_ply_execution_deferred";
  }
  if (observed.sampleActionMissingPairCount > 0) return "sample_action_missing";
  if (observed.moveCommandConversionFailedPairCount > 0) {
    return "move_command_conversion_failed";
  }
  if (observed.engineCommandRejectedPairCount > 0) return "engine_command_rejected";
  if (observed.engineCommandExceptionPairCount > 0) return "engine_command_exception";
  if (observed.outcomeClassificationFailedPairCount > 0) {
    return "outcome_classification_failed";
  }
  if (observed.failedOrDeferredPairCount > 0) return "sampled_world_rebuild_failed";
  if (observed.completedPairCount > 0) return "completed";
  return "one_ply_execution_deferred";
};

export const buildDeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot = ({
  input,
  samplerRunId,
  memory,
  cFp68EligibleRoot,
  cFp69ProbeRoot,
  cFp70AvailabilityRoot,
  deps,
}: {
  input: BenchmarkRootObserverInput;
  samplerRunId: string;
  memory: SamplerPublicTransferMemoryState;
  cFp68EligibleRoot?: DeterminizedProbeContractEligibleRootRecord;
  cFp69ProbeRoot?: DeterminizedPimcProbeV0RootRecord;
  cFp70AvailabilityRoot?: DeterminizedPimcActionAvailabilityV0RootRecord;
  deps?: DeterminizedPimcOnePlyOutcomeSkeletonV0ExecutionDeps;
}): {
  observedRoot: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot;
  aggregateCounts: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedAggregateCounts;
} => {
  const identity = baseObservedIdentity(input);
  const rootBuckets =
    cFp68EligibleRoot && cFp69ProbeRoot && cFp70AvailabilityRoot
      ? buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets(
          input.legalMoves,
          input.state.phase,
          input.state.round,
        )
      : [];
  const aggregate = emptySampleExecutionResult(0);
  const sampledActionBucketCounts: number[] = [];
  let sampleCountChecked = 0;
  let sampleCountOutcomeFailed = 0;

  const materialization =
    cFp68EligibleRoot && cFp69ProbeRoot && cFp70AvailabilityRoot
      ? buildDeterminizedPimcActionAvailabilityV0InMemoryMaterializationForRoot({
          input,
          samplerRunId,
          memory,
        })
      : undefined;

  let deferred = !cFp68EligibleRoot || !cFp69ProbeRoot || !cFp70AvailabilityRoot;

  if (
    materialization &&
    cFp68EligibleRoot &&
    cFp69ProbeRoot &&
    cFp70AvailabilityRoot
  ) {
    const cfp68Matches =
      materialization.rootPublicFingerprint ===
        cFp68EligibleRoot.rootPublicFingerprint &&
      materialization.sampleCountRequested ===
        cFp68EligibleRoot.sampleCountRequested &&
      materialization.sampleCountGenerated ===
        cFp68EligibleRoot.sampleCountGenerated &&
      materialization.sampleCountValid === cFp68EligibleRoot.sampleCountValid &&
      materialization.sampleCountInvalid === cFp68EligibleRoot.sampleCountInvalid;
    const cfp69Matches =
      cFp69ProbeRoot.probeStatus === "completed" &&
      cFp69ProbeRoot.publicActionCount === rootBuckets.length &&
      cFp69ProbeRoot.sampleCountRequested ===
        cFp68EligibleRoot.sampleCountRequested &&
      cFp69ProbeRoot.sampleCountValid === cFp68EligibleRoot.sampleCountValid;
    const cfp70Matches =
      cFp70AvailabilityRoot.probeStatus === "completed" &&
      cFp70AvailabilityRoot.rootActionBucketCount === rootBuckets.length &&
      cFp70AvailabilityRoot.allRootActionsAvailableInAllSamples &&
      cFp70AvailabilityRoot.availabilityDisagreementCount === 0 &&
      cFp70AvailabilityRoot.sampleCountRequested ===
        cFp68EligibleRoot.sampleCountRequested &&
      cFp70AvailabilityRoot.sampleCountGenerated ===
        cFp68EligibleRoot.sampleCountGenerated &&
      cFp70AvailabilityRoot.sampleCountChecked === cFp68EligibleRoot.sampleCountValid;

    deferred =
      !cfp68Matches ||
      !cfp69Matches ||
      !cfp70Matches ||
      materialization.materializationStatus !== "valid" ||
      materialization.samples.length !== cFp68EligibleRoot.sampleCountRequested;

    if (!deferred) {
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
          sampleCountOutcomeFailed += 1;
          addWholeSampleFailure({
            target: aggregate,
            rootBuckets,
            status: "sampled_world_rebuild_failed",
          });
          continue;
        }

        let sampledLegalMoves: LegalMove[];
        try {
          sampledLegalMoves = getLegalMoves({
            state: rebuilt.state,
            seatId: input.seatId,
            catalogCards: currentCatalogCards,
            catalogLeaders: currentCatalogLeaders,
          });
        } catch {
          sampleCountOutcomeFailed += 1;
          addWholeSampleFailure({
            target: aggregate,
            rootBuckets,
            status: "sampled_legal_move_generation_failed",
          });
          continue;
        }

        try {
          const sampleResult =
            executeDeterminizedPimcOnePlyOutcomeSkeletonV0Sample({
              sampledState: rebuilt.state,
              seatId: input.seatId,
              rootBuckets,
              sampledLegalMoves,
              phase: input.state.phase,
              round: input.state.round,
              deps,
            });
          sampleCountChecked += 1;
          sampledActionBucketCounts.push(sampleResult.sampledActionBucketCount);
          mergeSampleResult(aggregate, sampleResult);
        } catch {
          sampleCountOutcomeFailed += 1;
          addWholeSampleFailure({
            target: aggregate,
            rootBuckets,
            status: "public_action_abstraction_failed",
          });
        }
      }
    }
  }

  if (deferred && rootBuckets.length > 0) {
    const deferredSamples =
      cFp68EligibleRoot?.sampleCountRequested ??
      materialization?.sampleCountRequested ??
      0;
    Array.from({ length: deferredSamples }).forEach(() => {
      addWholeSampleFailure({
        target: aggregate,
        rootBuckets,
        status: "one_ply_execution_deferred",
      });
    });
    sampleCountOutcomeFailed = deferredSamples;
  }

  const rootActionBucketsWithAnyDivergence = [
    ...aggregate.bucketShapeKeysByActionBucket.values(),
  ].filter((shapes) => shapes.size > 1).length;
  const outcomeDivergenceCount = [
    ...aggregate.bucketShapeKeysByActionBucket.values(),
  ].reduce((sum, shapes) => sum + Math.max(0, shapes.size - 1), 0);
  const observedDraft = {
    completedPairCount: aggregate.completedPairCount,
    failedOrDeferredPairCount: aggregate.failedOrDeferredPairCount,
    sampleActionMissingPairCount: aggregate.sampleActionMissingPairCount,
    moveCommandConversionFailedPairCount:
      aggregate.moveCommandConversionFailedPairCount,
    engineCommandRejectedPairCount: aggregate.engineCommandRejectedPairCount,
    engineCommandExceptionPairCount: aggregate.engineCommandExceptionPairCount,
    outcomeClassificationFailedPairCount:
      aggregate.outcomeClassificationFailedPairCount,
    onePlyExecutionDeferredPairCount:
      aggregate.onePlyExecutionDeferredPairCount,
  };

  return {
    observedRoot: {
      ...identity,
      ...(materialization
        ? { rootPublicFingerprint: materialization.rootPublicFingerprint }
        : {}),
      ...(cFp68EligibleRoot
        ? { cfp68RootPublicFingerprint: cFp68EligibleRoot.rootPublicFingerprint }
        : {}),
      cfp69LegalMoveCount: input.legalMoves.length,
      cfp69PublicActionCount: rootBuckets.length,
      cfp70AvailabilityStatus:
        cFp70AvailabilityRoot?.probeStatus ?? "exact_state_rebuild_deferred",
      cfp70RootActionBucketCount:
        cFp70AvailabilityRoot?.rootActionBucketCount ?? 0,
      cfp70AllRootActionsAvailableInAllSamples:
        cFp70AvailabilityRoot?.allRootActionsAvailableInAllSamples ?? false,
      sampleCountRequested:
        materialization?.sampleCountRequested ??
        cFp68EligibleRoot?.sampleCountRequested ??
        0,
      sampleCountGenerated: materialization?.sampleCountGenerated ?? 0,
      sampleCountChecked,
      sampleCountOutcomeFailed,
      rootPublicActionCount: rootBuckets.length,
      publicActionSamplePairCount: aggregate.publicActionSamplePairCount,
      completedPairCount: aggregate.completedPairCount,
      failedOrDeferredPairCount: aggregate.failedOrDeferredPairCount,
      sampleActionMissingPairCount: aggregate.sampleActionMissingPairCount,
      moveCommandConversionFailedPairCount:
        aggregate.moveCommandConversionFailedPairCount,
      engineCommandRejectedPairCount: aggregate.engineCommandRejectedPairCount,
      engineCommandExceptionPairCount: aggregate.engineCommandExceptionPairCount,
      outcomeClassificationFailedPairCount:
        aggregate.outcomeClassificationFailedPairCount,
      onePlyExecutionDeferredPairCount:
        aggregate.onePlyExecutionDeferredPairCount,
      executionStatusCounts: sortRecord(aggregate.executionStatusCounts),
      publicOutcomeKindCounts: sortRecord(aggregate.publicOutcomeKindCounts),
      transitionKindCounts: sortRecord(aggregate.transitionKindCounts),
      rootActionBucketsWithAnyFailure: aggregate.bucketFailureKeys.size,
      rootActionBucketsWithAnyDivergence,
      outcomeDivergenceCount,
      probeStatus: probeStatusForObservedRoot(observedDraft),
    },
    aggregateCounts: {
      executionStatusCountsByPublicActionKind:
        sortedNestedPublicActionKindCounts(
          aggregate.executionStatusCountsByPublicActionKind,
        ),
      outcomeKindCountsByPublicActionKind: sortedNestedPublicActionKindCounts(
        aggregate.outcomeKindCountsByPublicActionKind,
      ),
    },
  };
};

const keyCounts = (
  records: readonly (
    | DeterminizedProbeContractEligibleRootRecord
    | DeterminizedProbeContractSkippedRootRecord
    | DeterminizedPimcProbeV0RootRecord
    | DeterminizedPimcProbeV0SkippedRootRecord
    | DeterminizedPimcActionAvailabilityV0RootRecord
    | DeterminizedPimcActionAvailabilityV0SkippedRootRecord
    | DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot
  )[],
) => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const key = buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(record);
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
    | DeterminizedPimcActionAvailabilityV0RootRecord
    | DeterminizedPimcActionAvailabilityV0SkippedRootRecord
    | DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot,
>(
  records: readonly T[],
) => {
  const byKey = new Map<string, T>();
  records.forEach((record) => {
    const key = buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(record);
    if (!byKey.has(key)) {
      byKey.set(key, record);
    }
  });
  return byKey;
};

const baseIdentityFromEligibleRoot = (
  root: DeterminizedProbeContractEligibleRootRecord,
): DeterminizedPimcOnePlyOutcomeSkeletonV0RootIdentity => ({
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
): DeterminizedPimcOnePlyOutcomeSkeletonV0RootIdentity => ({
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

const buildSkippedOutcomeRecord = ({
  probeRunId,
  root,
  cFp69SkippedRoot,
  cFp70SkippedRoot,
  sourceCfp69ProbeRunId,
  sourceCfp70AvailabilityRunId,
}: {
  probeRunId: string;
  root: DeterminizedProbeContractSkippedRootRecord;
  cFp69SkippedRoot?: DeterminizedPimcProbeV0SkippedRootRecord;
  cFp70SkippedRoot?: DeterminizedPimcActionAvailabilityV0SkippedRootRecord;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
}): DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord => ({
  schemaVersion: "determinized-pimc-one-ply-outcome-skeleton-v0-skipped-root-v1",
  probeRunId,
  probeVariant: "determinized-pimc-one-ply-outcome-skeleton-v0",
  ...baseIdentityFromSkippedRoot(root),
  eligibilityStatus: "skipped_invalid_root",
  sourceCfp68ContractRunId: root.contractRunId,
  sourceCfp69ProbeRunId,
  sourceCfp70AvailabilityRunId,
  cfp69SkippedStatus:
    cFp69SkippedRoot?.eligibilityStatus ?? "skipped_invalid_root",
  cfp70SkippedStatus:
    cFp70SkippedRoot?.eligibilityStatus ?? "skipped_invalid_root",
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

const buildOutcomeRootRecord = ({
  probeRunId,
  eligibleRoot,
  cFp69Root,
  cFp70Root,
  observedRoot,
  sourceCfp69ProbeRunId,
  sourceCfp70AvailabilityRunId,
}: {
  probeRunId: string;
  eligibleRoot: DeterminizedProbeContractEligibleRootRecord;
  cFp69Root?: DeterminizedPimcProbeV0RootRecord;
  cFp70Root?: DeterminizedPimcActionAvailabilityV0RootRecord;
  observedRoot?: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
}): DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord => {
  const fallbackExecutionStatusCounts = emptyExecutionStatusCounts();
  const fallbackOutcomeKindCounts = emptyPublicOutcomeKindCounts();
  const fallbackTransitionKindCounts = emptyTransitionKindCounts();
  const failedOrDeferredPairCount = observedRoot?.failedOrDeferredPairCount ?? 0;
  const deferredPairCount = observedRoot?.onePlyExecutionDeferredPairCount ?? 0;
  const divergenceCount = observedRoot?.outcomeDivergenceCount ?? 0;

  return {
    schemaVersion: "determinized-pimc-one-ply-outcome-skeleton-v0-root-v1",
    probeRunId,
    ...baseIdentityFromEligibleRoot(eligibleRoot),
    sourceCfp68ContractRunId: eligibleRoot.contractRunId,
    sourceCfp69ProbeRunId,
    sourceCfp70AvailabilityRunId,
    eligibilityStatus: "eligible_valid_root",
    cfp69ProbeStatus: cFp69Root?.probeStatus ?? "contract_mismatch",
    cfp70AvailabilityStatus:
      cFp70Root?.probeStatus ?? "exact_state_rebuild_deferred",
    cfp69PublicActionCount: cFp69Root?.publicActionCount ?? 0,
    cfp70RootActionBucketCount: cFp70Root?.rootActionBucketCount ?? 0,
    cfp70AllRootActionsAvailableInAllSamples:
      cFp70Root?.allRootActionsAvailableInAllSamples ?? false,
    probeVariant: "determinized-pimc-one-ply-outcome-skeleton-v0",
    probeMode: "one_ply_public_action_outcome_skeleton",
    sampleCountRequested:
      observedRoot?.sampleCountRequested ?? eligibleRoot.sampleCountRequested,
    sampleCountGenerated: observedRoot?.sampleCountGenerated ?? 0,
    sampleCountChecked: observedRoot?.sampleCountChecked ?? 0,
    sampleCountOutcomeFailed: observedRoot?.sampleCountOutcomeFailed ?? 0,
    rootPublicActionCount: observedRoot?.rootPublicActionCount ?? 0,
    publicActionSamplePairCount: observedRoot?.publicActionSamplePairCount ?? 0,
    completedPairCount: observedRoot?.completedPairCount ?? 0,
    failedOrDeferredPairCount,
    sampleActionMissingPairCount:
      observedRoot?.sampleActionMissingPairCount ?? 0,
    moveCommandConversionFailedPairCount:
      observedRoot?.moveCommandConversionFailedPairCount ?? 0,
    engineCommandRejectedPairCount:
      observedRoot?.engineCommandRejectedPairCount ?? 0,
    engineCommandExceptionPairCount:
      observedRoot?.engineCommandExceptionPairCount ?? 0,
    outcomeClassificationFailedPairCount:
      observedRoot?.outcomeClassificationFailedPairCount ?? 0,
    onePlyExecutionDeferredPairCount: deferredPairCount,
    executionStatusCounts:
      observedRoot?.executionStatusCounts ?? sortRecord(fallbackExecutionStatusCounts),
    publicOutcomeKindCounts:
      observedRoot?.publicOutcomeKindCounts ?? sortRecord(fallbackOutcomeKindCounts),
    transitionKindCounts:
      observedRoot?.transitionKindCounts ?? sortRecord(fallbackTransitionKindCounts),
    rootActionBucketsWithAnyFailure:
      observedRoot?.rootActionBucketsWithAnyFailure ?? 0,
    rootActionBucketsWithAnyDivergence:
      observedRoot?.rootActionBucketsWithAnyDivergence ?? 0,
    outcomeDivergenceCount: divergenceCount,
    outcomeDivergenceBucket:
      deferredPairCount > 0
        ? "deferred"
        : failedOrDeferredPairCount > 0
          ? "failed"
          : divergenceBucketForCount(divergenceCount),
    outcomeRiskBucket: riskBucketForRoot({
      failedOrDeferredPairCount,
      deferredPairCount,
      divergenceCount,
    }),
    probeStatus: observedRoot?.probeStatus ?? "one_ply_execution_deferred",
  };
};

const buildSkipCounters = (
  skippedRoots: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord[],
): DeterminizedPimcOnePlyOutcomeSkeletonV0SkipCounters => {
  const counters: DeterminizedPimcOnePlyOutcomeSkeletonV0SkipCounters = {
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
  counters: DeterminizedPimcOnePlyOutcomeSkeletonV0SkipCounters,
  skippedRootCount: number,
): DeterminizedPimcOnePlyOutcomeSkeletonV0SkipCounterPercentages => ({
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
  roots: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord[],
): DeterminizedPimcOnePlyOutcomeSkeletonV0SampleBudget => {
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
    totalFailedSampleCount += root.sampleCountOutcomeFailed;
  });

  return {
    outcomeRootCount: roots.length,
    requestedSamplesPerRootDistribution: sortRecord(
      requestedSamplesPerRootDistribution,
    ),
    totalRequestedSampleCount,
    totalGeneratedSampleCount,
    totalCheckedSampleCount,
    totalFailedSampleCount,
  };
};

const buildOutcomeStatusSummary = (
  roots: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord[],
): DeterminizedPimcOnePlyOutcomeSkeletonV0OutcomeStatusSummary => {
  const probeStatusCounts = emptyExecutionStatusCounts();
  const executionStatusCounts = emptyExecutionStatusCounts();
  const publicOutcomeKindCounts = emptyPublicOutcomeKindCounts();
  const transitionKindCounts = emptyTransitionKindCounts();
  const divergenceBucketCounts = emptyDivergenceBucketCounts();
  const outcomeRiskBucketCounts = emptyDivergenceBucketCounts();

  roots.forEach((root) => {
    addCount(probeStatusCounts, root.probeStatus);
    Object.entries(root.executionStatusCounts).forEach(([status, count]) => {
      addCount(executionStatusCounts, status, count);
    });
    Object.entries(root.publicOutcomeKindCounts).forEach(([kind, count]) => {
      addCount(publicOutcomeKindCounts, kind, count);
    });
    Object.entries(root.transitionKindCounts).forEach(([kind, count]) => {
      addCount(transitionKindCounts, kind, count);
    });
    addCount(divergenceBucketCounts, root.outcomeDivergenceBucket);
    addCount(outcomeRiskBucketCounts, root.outcomeRiskBucket);
  });

  return {
    probeStatusCounts: sortRecord(probeStatusCounts),
    executionStatusCounts: sortRecord(executionStatusCounts),
    publicOutcomeKindCounts: sortRecord(publicOutcomeKindCounts),
    transitionKindCounts: sortRecord(transitionKindCounts),
    publicActionSamplePairTotal: roots.reduce(
      (sum, root) => sum + root.publicActionSamplePairCount,
      0,
    ),
    completedPairCount: roots.reduce(
      (sum, root) => sum + root.completedPairCount,
      0,
    ),
    failedOrDeferredPairCount: roots.reduce(
      (sum, root) => sum + root.failedOrDeferredPairCount,
      0,
    ),
    sampleActionMissingPairCount: roots.reduce(
      (sum, root) => sum + root.sampleActionMissingPairCount,
      0,
    ),
    moveCommandConversionFailedPairCount: roots.reduce(
      (sum, root) => sum + root.moveCommandConversionFailedPairCount,
      0,
    ),
    engineCommandRejectedPairCount: roots.reduce(
      (sum, root) => sum + root.engineCommandRejectedPairCount,
      0,
    ),
    engineCommandExceptionPairCount: roots.reduce(
      (sum, root) => sum + root.engineCommandExceptionPairCount,
      0,
    ),
    outcomeClassificationFailedPairCount: roots.reduce(
      (sum, root) => sum + root.outcomeClassificationFailedPairCount,
      0,
    ),
    onePlyExecutionDeferredPairCount: roots.reduce(
      (sum, root) => sum + root.onePlyExecutionDeferredPairCount,
      0,
    ),
    rootsWithAnyFailedOrDeferredPair: roots.filter(
      (root) => root.failedOrDeferredPairCount > 0,
    ).length,
    rootsWithAnyPublicOutcomeDivergence: roots.filter(
      (root) => root.outcomeDivergenceCount > 0,
    ).length,
    divergenceBucketCounts: sortRecord(divergenceBucketCounts),
    outcomeRiskBucketCounts: sortRecord(outcomeRiskBucketCounts),
  };
};

const buildActionBucketAggregates = ({
  roots,
  observedAggregateCounts,
}: {
  roots: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord[];
  observedAggregateCounts: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedAggregateCounts;
}): DeterminizedPimcOnePlyOutcomeSkeletonV0ActionBucketAggregates => ({
  rootPublicActionCountStats: buildSamplerReadinessCountStats(
    roots.map((root) => root.rootPublicActionCount),
  ),
  publicActionSamplePairCountStats: buildSamplerReadinessCountStats(
    roots.map((root) => root.publicActionSamplePairCount),
  ),
  completedPairCountStats: buildSamplerReadinessCountStats(
    roots.map((root) => root.completedPairCount),
  ),
  failedOrDeferredPairCountStats: buildSamplerReadinessCountStats(
    roots.map((root) => root.failedOrDeferredPairCount),
  ),
  outcomeDivergenceCountStats: buildSamplerReadinessCountStats(
    roots.map((root) => root.outcomeDivergenceCount),
  ),
  aggregateExecutionStatusCountsByPublicActionKind:
    sortedNestedPublicActionKindCounts(
      observedAggregateCounts.executionStatusCountsByPublicActionKind,
    ),
  aggregateOutcomeKindCountsByPublicActionKind:
    sortedNestedPublicActionKindCounts(
      observedAggregateCounts.outcomeKindCountsByPublicActionKind,
    ),
});

const mergeObservedAggregateCounts = (
  observed: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedAggregateCounts[],
) => {
  const merged: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedAggregateCounts = {
    executionStatusCountsByPublicActionKind: emptyNestedPublicActionKindCounts(),
    outcomeKindCountsByPublicActionKind: emptyNestedPublicActionKindCounts(),
  };
  observed.forEach((counts) => {
    combineNestedCounts(
      merged.executionStatusCountsByPublicActionKind,
      counts.executionStatusCountsByPublicActionKind,
    );
    combineNestedCounts(
      merged.outcomeKindCountsByPublicActionKind,
      counts.outcomeKindCountsByPublicActionKind,
    );
  });
  return merged;
};

export const buildDeterminizedPimcOnePlyOutcomeSkeletonV0 = ({
  probeRunId,
  suiteId,
  contractSummary,
  cFp68EligibleRoots,
  cFp68SkippedRoots,
  cFp69ProbeRoots,
  cFp69SkippedRoots,
  cFp70AvailabilitySummary,
  cFp70AvailabilityRoots,
  cFp70SkippedRoots,
  observedRoots,
  observedAggregateCounts,
  benchmark,
  sourceCfp68ArtifactReferences = [],
  sourceCfp69ArtifactReferences = [],
  sourceCfp70ArtifactReferences = [],
}: BuildDeterminizedPimcOnePlyOutcomeSkeletonV0Input): DeterminizedPimcOnePlyOutcomeSkeletonV0Result => {
  const observedKeyCounts = keyCounts(observedRoots);
  const eligibleKeyCounts = keyCounts(cFp68EligibleRoots);
  const cFp69ProbeKeyCounts = keyCounts(cFp69ProbeRoots);
  const cFp70AvailabilityKeyCounts = keyCounts(cFp70AvailabilityRoots);
  const cFp68SkippedKeyCounts = keyCounts(cFp68SkippedRoots);
  const cFp69SkippedKeyCounts = keyCounts(cFp69SkippedRoots);
  const cFp70SkippedKeyCounts = keyCounts(cFp70SkippedRoots);
  const observedByKey = firstRecordByKey(observedRoots);
  const cFp69ProbeByKey = firstRecordByKey(cFp69ProbeRoots);
  const cFp69SkippedByKey = firstRecordByKey(cFp69SkippedRoots);
  const cFp70AvailabilityByKey = firstRecordByKey(cFp70AvailabilityRoots);
  const cFp70SkippedByKey = firstRecordByKey(cFp70SkippedRoots);
  const eligibleKeys = new Set(
    cFp68EligibleRoots.map((root) =>
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
    ),
  );
  const cFp68SkippedKeys = new Set(
    cFp68SkippedRoots.map((root) =>
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
    ),
  );
  const cFp69ProbeKeys = new Set(
    cFp69ProbeRoots.map((root) =>
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
    ),
  );
  const cFp69SkippedKeys = new Set(
    cFp69SkippedRoots.map((root) =>
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
    ),
  );
  const cFp70AvailabilityKeys = new Set(
    cFp70AvailabilityRoots.map((root) =>
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
    ),
  );
  const cFp70SkippedKeys = new Set(
    cFp70SkippedRoots.map((root) =>
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
    ),
  );
  const contractKeys = new Set([
    ...eligibleKeys,
    ...cFp68SkippedKeys,
    ...cFp69ProbeKeys,
    ...cFp69SkippedKeys,
    ...cFp70AvailabilityKeys,
    ...cFp70SkippedKeys,
  ]);
  const sourceCfp69ProbeRunId =
    cFp69ProbeRoots[0]?.probeRunId ??
    cFp69SkippedRoots[0]?.probeRunId ??
    `${suiteId}:determinized-pimc-probe-v0:cFp69`;
  const sourceCfp70AvailabilityRunId =
    cFp70AvailabilitySummary.probeRunId ??
    cFp70AvailabilityRoots[0]?.probeRunId ??
    cFp70SkippedRoots[0]?.probeRunId ??
    `${suiteId}:determinized-pimc-action-availability-v0:cFp70`;

  const skippedRoots = cFp68SkippedRoots.map((root) =>
    buildSkippedOutcomeRecord({
      probeRunId,
      root,
      cFp69SkippedRoot: cFp69SkippedByKey.get(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      ),
      cFp70SkippedRoot: cFp70SkippedByKey.get(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      ),
      sourceCfp69ProbeRunId,
      sourceCfp70AvailabilityRunId,
    }),
  );
  const outcomeRoots = cFp68EligibleRoots.map((eligibleRoot) =>
    buildOutcomeRootRecord({
      probeRunId,
      eligibleRoot,
      cFp69Root: cFp69ProbeByKey.get(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(eligibleRoot),
      ),
      cFp70Root: cFp70AvailabilityByKey.get(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(eligibleRoot),
      ),
      observedRoot: observedByKey.get(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(eligibleRoot),
      ),
      sourceCfp69ProbeRunId,
      sourceCfp70AvailabilityRunId,
    }),
  );
  const outcomeKeys = new Set(
    outcomeRoots.map((root) =>
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
    ),
  );

  const cFp68ContractNotProbeReady =
    contractSummary.contractStatus === "probe_ready" ? 0 : 1;
  const eligibleRootsNotObserved = cFp68EligibleRoots.filter(
    (root) =>
      !observedByKey.has(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      ),
  ).length;
  const observedRootsNotInCfp68Cfp69Cfp70Contract = observedRoots.filter(
    (root) =>
      !contractKeys.has(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      ),
  ).length;
  const skippedRootsIncorrectlyProbed = cFp68SkippedRoots.filter((root) =>
    outcomeKeys.has(buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root)),
  ).length;
  const cfp68Cfp69EligibleRootCountDelta =
    cFp68EligibleRoots.length - cFp69ProbeRoots.length;
  const cfp68Cfp70AvailabilityRootCountDelta =
    cFp68EligibleRoots.length - cFp70AvailabilityRoots.length;
  const cfp69Cfp70AvailabilityRootCountDelta =
    cFp69ProbeRoots.length - cFp70AvailabilityRoots.length;
  const cfp68Cfp69SkippedRootCountDelta =
    cFp68SkippedRoots.length - cFp69SkippedRoots.length;
  const cfp68Cfp70SkippedRootCountDelta =
    cFp68SkippedRoots.length - cFp70SkippedRoots.length;
  const cfp69Cfp70SkippedRootCountDelta =
    cFp69SkippedRoots.length - cFp70SkippedRoots.length;
  const cfp69ProbeRootsMissingCfp68EligibleRoot = cFp69ProbeRoots.filter(
    (root) =>
      !eligibleKeys.has(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      ),
  ).length;
  const cfp70AvailabilityRootsMissingCfp68EligibleRoot =
    cFp70AvailabilityRoots.filter(
      (root) =>
        !eligibleKeys.has(
          buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
        ),
    ).length;
  const cfp69SkippedRootsMissingCfp68SkippedRoot = cFp69SkippedRoots.filter(
    (root) =>
      !cFp68SkippedKeys.has(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      ),
  ).length;
  const cfp70SkippedRootsMissingCfp68SkippedRoot = cFp70SkippedRoots.filter(
    (root) =>
      !cFp68SkippedKeys.has(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      ),
  ).length;
  const cfp68Cfp69SampleCountMismatchRoots = cFp68EligibleRoots.filter((root) => {
    const cfp69 = cFp69ProbeByKey.get(
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
    );
    return (
      !cfp69 ||
      cfp69.sampleCountRequested !== root.sampleCountRequested ||
      cfp69.sampleCountValid !== root.sampleCountValid
    );
  }).length;
  const cfp68Cfp70SampleCountMismatchRoots = cFp68EligibleRoots.filter((root) => {
    const cfp70 = cFp70AvailabilityByKey.get(
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
    );
    return (
      !cfp70 ||
      cfp70.sampleCountRequested !== root.sampleCountRequested ||
      cfp70.sampleCountGenerated !== root.sampleCountGenerated ||
      cfp70.sampleCountChecked !== root.sampleCountValid
    );
  }).length;
  const cfp69Cfp70PublicActionCountMismatchRoots = cFp68EligibleRoots.filter(
    (root) => {
      const key = buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root);
      const cfp69 = cFp69ProbeByKey.get(key);
      const cfp70 = cFp70AvailabilityByKey.get(key);
      return (
        !cfp69 ||
        !cfp70 ||
        cfp69.publicActionCount !== cfp70.rootActionBucketCount
      );
    },
  ).length;
  const cfp70RootsWithAvailabilityDisagreement = cFp70AvailabilityRoots.filter(
    (root) =>
      root.probeStatus !== "completed" ||
      !root.allRootActionsAvailableInAllSamples ||
      root.availabilityDisagreementCount > 0,
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
    observedRootsNotInCfp68Cfp69Cfp70Contract,
    skippedRootsIncorrectlyProbed,
    duplicateKeyCount(observedKeyCounts),
    duplicateKeyCount(eligibleKeyCounts),
    duplicateKeyCount(cFp69ProbeKeyCounts),
    duplicateKeyCount(cFp70AvailabilityKeyCounts),
    duplicateKeyCount(cFp68SkippedKeyCounts),
    duplicateKeyCount(cFp69SkippedKeyCounts),
    duplicateKeyCount(cFp70SkippedKeyCounts),
    Math.abs(cfp68Cfp69EligibleRootCountDelta),
    Math.abs(cfp68Cfp70AvailabilityRootCountDelta),
    Math.abs(cfp69Cfp70AvailabilityRootCountDelta),
    Math.abs(cfp68Cfp69SkippedRootCountDelta),
    Math.abs(cfp68Cfp70SkippedRootCountDelta),
    Math.abs(cfp69Cfp70SkippedRootCountDelta),
    cfp69ProbeRootsMissingCfp68EligibleRoot,
    cfp70AvailabilityRootsMissingCfp68EligibleRoot,
    cfp69SkippedRootsMissingCfp68SkippedRoot,
    cfp70SkippedRootsMissingCfp68SkippedRoot,
    cfp68Cfp69SampleCountMismatchRoots,
    cfp68Cfp70SampleCountMismatchRoots,
    cfp69Cfp70PublicActionCountMismatchRoots,
    cfp70RootsWithAvailabilityDisagreement,
    cfp68FingerprintMismatchObservedRoots,
  ];
  const sourceConsistencyStatus: DeterminizedPimcOnePlyOutcomeSkeletonV0ReadinessStatus =
    sourceConsistencyValues.every((count) => count === 0)
      ? "probe_ready"
      : "not_probe_ready";
  const sourceConsistency: DeterminizedPimcOnePlyOutcomeSkeletonV0SourceConsistency =
    {
      status: sourceConsistencyStatus,
      cFp68ContractStatus: contractSummary.contractStatus,
      cFp68ContractNotProbeReady,
      cFp68TotalRootCount: contractSummary.totalCfp61RootCount,
      cFp68EligibleRootsRead: cFp68EligibleRoots.length,
      cFp68SkippedRootsRead: cFp68SkippedRoots.length,
      cFp69ProbeRootsRead: cFp69ProbeRoots.length,
      cFp69SkippedRootsRead: cFp69SkippedRoots.length,
      cFp70AvailabilityRootsRead: cFp70AvailabilityRoots.length,
      cFp70SkippedRootsRead: cFp70SkippedRoots.length,
      benchmarkObservedRootsRead: observedRoots.length,
      eligibleRootsNotObserved,
      observedRootsNotInCfp68Cfp69Cfp70Contract,
      skippedRootsIncorrectlyProbed,
      duplicateObservedRootKeys: duplicateKeyCount(observedKeyCounts),
      duplicateCfp68EligibleRootKeys: duplicateKeyCount(eligibleKeyCounts),
      duplicateCfp69ProbeRootKeys: duplicateKeyCount(cFp69ProbeKeyCounts),
      duplicateCfp70AvailabilityRootKeys: duplicateKeyCount(
        cFp70AvailabilityKeyCounts,
      ),
      duplicateSkippedRootKeys:
        duplicateKeyCount(cFp68SkippedKeyCounts) +
        duplicateKeyCount(cFp69SkippedKeyCounts) +
        duplicateKeyCount(cFp70SkippedKeyCounts),
      cfp68Cfp69EligibleRootCountDelta,
      cfp68Cfp70AvailabilityRootCountDelta,
      cfp69Cfp70AvailabilityRootCountDelta,
      cfp68Cfp69SkippedRootCountDelta,
      cfp68Cfp70SkippedRootCountDelta,
      cfp69Cfp70SkippedRootCountDelta,
      cfp69ProbeRootsMissingCfp68EligibleRoot,
      cfp70AvailabilityRootsMissingCfp68EligibleRoot,
      cfp69SkippedRootsMissingCfp68SkippedRoot,
      cfp70SkippedRootsMissingCfp68SkippedRoot,
      cfp68Cfp69SampleCountMismatchRoots,
      cfp68Cfp70SampleCountMismatchRoots,
      cfp69Cfp70PublicActionCountMismatchRoots,
      cfp70RootsWithAvailabilityDisagreement,
      cfp68FingerprintMismatchObservedRoots,
    };

  const skipCounters = buildSkipCounters(skippedRoots);
  const skippedRootCount = skippedRoots.length;
  const aggregateCounts =
    observedAggregateCounts ??
    mergeObservedAggregateCounts(
      observedRoots
        .filter((root) =>
          eligibleKeys.has(
            buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
          ),
        )
        .map(() => ({
          executionStatusCountsByPublicActionKind:
            emptyNestedPublicActionKindCounts(),
          outcomeKindCountsByPublicActionKind: emptyNestedPublicActionKindCounts(),
        })),
    );

  return {
    probeRunId,
    suiteId,
    sourceBenchmarkSuiteId: contractSummary.sourceBenchmarkSuiteId,
    benchmark,
    outcomeRoots,
    skippedRoots,
    summary: {
      schemaVersion: "determinized-pimc-one-ply-outcome-skeleton-v0-summary-v1",
      probeRunId,
      suiteId,
      sourceBenchmarkSuiteId: contractSummary.sourceBenchmarkSuiteId,
      probeVariant: "determinized-pimc-one-ply-outcome-skeleton-v0",
      probeMode: "one_ply_public_action_outcome_skeleton",
      probeReadinessStatus: sourceConsistencyStatus,
      sourceCfp68ContractRunId: contractSummary.contractRunId,
      sourceCfp69ProbeRunId: sourceCfp69ProbeRunId,
      sourceCfp70AvailabilityRunId: sourceCfp70AvailabilityRunId,
      sourceCfp68ArtifactReferences,
      sourceCfp69ArtifactReferences,
      sourceCfp70ArtifactReferences,
      totalCfp68RootCount: contractSummary.totalCfp61RootCount,
      eligibleRootCount: cFp68EligibleRoots.length,
      outcomeRootCount: outcomeRoots.length,
      skippedRootCount,
      skippedRootPercentage: percentage(
        skippedRootCount,
        contractSummary.totalCfp61RootCount,
      ),
      matchCount: contractSummary.matchCount,
      sourceConsistency,
      sampleBudget: buildSampleBudget(outcomeRoots),
      outcomeStatus: buildOutcomeStatusSummary(outcomeRoots),
      actionBucketAggregates: buildActionBucketAggregates({
        roots: outcomeRoots,
        observedAggregateCounts: aggregateCounts,
      }),
      skipCounters,
      skipCounterPercentages: buildSkipCounterPercentages(
        skipCounters,
        skippedRootCount,
      ),
      explicitNonClaims:
        DETERMINIZED_PIMC_ONE_PLY_OUTCOME_SKELETON_V0_NON_CLAIMS,
      hiddenInfoSafetyNote:
        DETERMINIZED_PIMC_ONE_PLY_OUTCOME_SKELETON_V0_HIDDEN_INFO_SAFETY_NOTE,
      cFp72Recommendation:
        DETERMINIZED_PIMC_ONE_PLY_OUTCOME_SKELETON_V0_CFP72_RECOMMENDATION,
    },
  };
};

export const runDeterminizedPimcOnePlyOutcomeSkeletonV0 = (
  input: RunDeterminizedPimcOnePlyOutcomeSkeletonV0Input,
): DeterminizedPimcOnePlyOutcomeSkeletonV0Result => {
  const requestedSuiteId =
    input.suiteId ?? input.suite?.id ?? input.contractSummary.suiteId;
  const probeRunId =
    input.probeRunId ??
    defaultDeterminizedPimcOnePlyOutcomeSkeletonV0RunId(requestedSuiteId);
  const samplerRunId = input.contractSummary.sourceSamplerRunIds.materialization;
  const cFp68EligibleByKey = firstRecordByKey(input.cFp68EligibleRoots);
  const cFp69ProbeByKey = firstRecordByKey(input.cFp69ProbeRoots);
  const cFp70AvailabilityByKey = firstRecordByKey(input.cFp70AvailabilityRoots);
  const observedRoots: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot[] = [];
  const observedAggregateCounts: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedAggregateCounts[] =
    [];
  const memoryStore = new Map<string, SamplerPublicTransferMemoryState>();

  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: probeRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      const key = buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey({
        ...root,
        faction: root.seats[root.seatId].faction,
        deckPresetId: root.seats[root.seatId].deckPresetId,
        phase: root.state.phase,
        round: root.state.round,
      });
      const cFp68EligibleRoot = cFp68EligibleByKey.get(key);
      if (!cFp68EligibleRoot) {
        observedRoots.push({
          ...baseObservedIdentity(root),
          cfp69LegalMoveCount: root.legalMoves.length,
          cfp69PublicActionCount: 0,
          cfp70AvailabilityStatus: "exact_state_rebuild_deferred",
          cfp70RootActionBucketCount: 0,
          cfp70AllRootActionsAvailableInAllSamples: false,
          sampleCountRequested: 0,
          sampleCountGenerated: 0,
          sampleCountChecked: 0,
          sampleCountOutcomeFailed: 0,
          rootPublicActionCount: 0,
          publicActionSamplePairCount: 0,
          completedPairCount: 0,
          failedOrDeferredPairCount: 0,
          sampleActionMissingPairCount: 0,
          moveCommandConversionFailedPairCount: 0,
          engineCommandRejectedPairCount: 0,
          engineCommandExceptionPairCount: 0,
          outcomeClassificationFailedPairCount: 0,
          onePlyExecutionDeferredPairCount: 0,
          executionStatusCounts: sortRecord(emptyExecutionStatusCounts()),
          publicOutcomeKindCounts: sortRecord(emptyPublicOutcomeKindCounts()),
          transitionKindCounts: sortRecord(emptyTransitionKindCounts()),
          rootActionBucketsWithAnyFailure: 0,
          rootActionBucketsWithAnyDivergence: 0,
          outcomeDivergenceCount: 0,
          probeStatus: "one_ply_execution_deferred",
        });
        return;
      }

      const memory = getSamplerPublicTransferMemoryForRoot(memoryStore, root);
      const observed =
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot({
          input: root,
          samplerRunId,
          memory,
          cFp68EligibleRoot,
          cFp69ProbeRoot: cFp69ProbeByKey.get(key),
          cFp70AvailabilityRoot: cFp70AvailabilityByKey.get(key),
        });
      observedRoots.push(observed.observedRoot);
      observedAggregateCounts.push(observed.aggregateCounts);
    },
  });

  return buildDeterminizedPimcOnePlyOutcomeSkeletonV0({
    probeRunId,
    suiteId: benchmark.summary.suiteId,
    contractSummary: input.contractSummary,
    cFp68EligibleRoots: input.cFp68EligibleRoots,
    cFp68SkippedRoots: input.cFp68SkippedRoots,
    cFp69ProbeRoots: input.cFp69ProbeRoots,
    cFp69SkippedRoots: input.cFp69SkippedRoots,
    cFp70AvailabilitySummary: input.cFp70AvailabilitySummary,
    cFp70AvailabilityRoots: input.cFp70AvailabilityRoots,
    cFp70SkippedRoots: input.cFp70SkippedRoots,
    observedRoots,
    observedAggregateCounts: mergeObservedAggregateCounts(observedAggregateCounts),
    benchmark,
    sourceCfp68ArtifactReferences: input.sourceCfp68ArtifactReferences,
    sourceCfp69ArtifactReferences: input.sourceCfp69ArtifactReferences,
    sourceCfp70ArtifactReferences: input.sourceCfp70ArtifactReferences,
  });
};
