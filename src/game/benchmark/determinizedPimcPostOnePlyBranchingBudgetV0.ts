import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import { commandFromLegalMove } from "@/game/ai";
import type { CatalogFaction } from "@/game/catalog";
import {
  executeCommand,
  getLegalMoves,
  type EngineCommand,
  type EngineTransaction,
  type LegalMove,
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
  type DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0Summary,
} from "./determinizedPimcOnePlyOutcomeSkeletonV0";
import {
  type DeterminizedPimcProbeV0RootRecord,
  type DeterminizedPimcProbeV0SkippedRootRecord,
} from "./determinizedPimcProbeV0";
import {
  buildDeterminizedProbeContractRootKey,
  type DeterminizedProbeContractEligibleRootRecord,
  type DeterminizedProbeContractSkippedRootRecord,
  type DeterminizedProbeContractSourceArtifactReference,
  type DeterminizedProbeContractSummary,
} from "./determinizedProbeContract";
import { runBenchmarkSuite } from "./runBenchmark";
import {
  getSamplerPublicTransferMemoryForRoot,
  type SamplerPublicTransferMemoryState,
} from "./samplerMaterialization";
import {
  buildPublicActionAbstraction,
  buildSamplerReadinessCountStats,
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

export type DeterminizedPimcPostOnePlyBranchingBudgetV0RootSchemaVersion =
  "determinized-pimc-post-one-ply-branching-budget-v0-root-v1";
export type DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootSchemaVersion =
  "determinized-pimc-post-one-ply-branching-budget-v0-skipped-root-v1";
export type DeterminizedPimcPostOnePlyBranchingBudgetV0SummarySchemaVersion =
  "determinized-pimc-post-one-ply-branching-budget-v0-summary-v1";

export type DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus =
  | "probe_ready"
  | "not_probe_ready";

export type DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus =
  | "completed"
  | "sample_action_missing"
  | "move_command_conversion_failed"
  | "engine_command_rejected"
  | "engine_command_exception"
  | "post_one_ply_actor_resolution_failed"
  | "post_one_ply_legal_move_generation_failed"
  | "post_one_ply_public_action_abstraction_failed"
  | "one_ply_execution_deferred";

export type DeterminizedPimcPostOnePlyBranchingBudgetV0PostActorLabel =
  | "policy_actor"
  | "system_round_end_resolver"
  | "terminal_game_end"
  | "no_actor"
  | "actor_resolution_failed";

export type DeterminizedPimcPostOnePlyBranchingBudgetV0PostPhaseLabel =
  | "mulligan"
  | "playing"
  | "round_end"
  | "game_end";

export type DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket =
  | "zero"
  | "tiny"
  | "small"
  | "medium"
  | "large"
  | "very_large"
  | "extreme"
  | "failed"
  | "deferred";

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0RootIdentity {
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

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord
  extends DeterminizedPimcPostOnePlyBranchingBudgetV0RootIdentity {
  schemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetV0RootSchemaVersion;
  probeRunId: string;
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  sourceCfp71OutcomeRunId: string;
  eligibilityStatus: "eligible_valid_root";
  cfp69ProbeStatus: DeterminizedPimcProbeV0RootRecord["probeStatus"];
  cfp70AvailabilityStatus: DeterminizedPimcActionAvailabilityV0RootRecord["probeStatus"];
  cfp71OutcomeStatus: DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord["probeStatus"];
  cfp69PublicActionCount: number;
  cfp70RootActionBucketCount: number;
  cfp71PublicActionSamplePairCount: number;
  cfp71CompletedPairCount: number;
  cfp71FailedOrDeferredPairCount: number;
  cfp71OutcomeDivergenceCount: number;
  probeVariant: "determinized-pimc-post-one-ply-branching-budget-v0";
  probeMode: "post_one_ply_branching_budget_probe";
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  sampleCountBranchingFailed: number;
  rootPublicActionCount: number;
  firstPlyPublicActionSamplePairCount: number;
  completedBranchingPairCount: number;
  failedOrDeferredBranchingPairCount: number;
  sampleActionMissingPairCount: number;
  moveCommandConversionFailedPairCount: number;
  engineCommandRejectedPairCount: number;
  engineCommandExceptionPairCount: number;
  actorResolutionFailedPairCount: number;
  legalMoveGenerationFailedPairCount: number;
  publicActionAbstractionFailedPairCount: number;
  onePlyExecutionDeferredPairCount: number;
  branchingStatusCounts: Record<string, number>;
  postOnePlyActorCounts: Record<string, number>;
  postOnePlyPhaseCounts: Record<string, number>;
  nextLegalMoveCountMin: number;
  nextLegalMoveCountMax: number;
  nextLegalMoveCountAverage: number;
  nextPublicActionCountMin: number;
  nextPublicActionCountMax: number;
  nextPublicActionCountAverage: number;
  nextPublicActionCollisionCountMin: number;
  nextPublicActionCollisionCountMax: number;
  nextPublicActionCollisionCountAverage: number;
  largestNextPublicActionBucketSizeMax: number;
  nextPublicActionTargetExpansionCountMin: number;
  nextPublicActionTargetExpansionCountMax: number;
  nextPublicActionTargetExpansionCountAverage: number;
  postOnePlyPublicActionBudgetTotal: number;
  postOnePlyPublicActionBudgetAverage: number;
  branchingBudgetBucket: DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket;
  branchingRiskBucket: DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket;
  probeStatus: DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord
  extends DeterminizedPimcPostOnePlyBranchingBudgetV0RootIdentity {
  schemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootSchemaVersion;
  probeRunId: string;
  probeVariant: "determinized-pimc-post-one-ply-branching-budget-v0";
  eligibilityStatus: "skipped_invalid_root";
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  sourceCfp71OutcomeRunId: string;
  cfp69SkippedStatus: DeterminizedPimcProbeV0SkippedRootRecord["eligibilityStatus"];
  cfp70SkippedStatus: DeterminizedPimcActionAvailabilityV0SkippedRootRecord["eligibilityStatus"];
  cfp71SkippedStatus: DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord["eligibilityStatus"];
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

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot
  extends Omit<
    DeterminizedPimcPostOnePlyBranchingBudgetV0RootIdentity,
    "rootPublicFingerprint"
  > {
  rootPublicFingerprint?: string;
  cfp68RootPublicFingerprint?: string;
  cfp69LegalMoveCount: number;
  cfp69PublicActionCount: number;
  cfp70AvailabilityStatus: DeterminizedPimcActionAvailabilityV0RootRecord["probeStatus"];
  cfp70RootActionBucketCount: number;
  cfp71OutcomeStatus: DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord["probeStatus"];
  cfp71PublicActionSamplePairCount: number;
  cfp71CompletedPairCount: number;
  cfp71FailedOrDeferredPairCount: number;
  cfp71OutcomeDivergenceCount: number;
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  sampleCountBranchingFailed: number;
  rootPublicActionCount: number;
  firstPlyPublicActionSamplePairCount: number;
  completedBranchingPairCount: number;
  failedOrDeferredBranchingPairCount: number;
  sampleActionMissingPairCount: number;
  moveCommandConversionFailedPairCount: number;
  engineCommandRejectedPairCount: number;
  engineCommandExceptionPairCount: number;
  actorResolutionFailedPairCount: number;
  legalMoveGenerationFailedPairCount: number;
  publicActionAbstractionFailedPairCount: number;
  onePlyExecutionDeferredPairCount: number;
  branchingStatusCounts: Record<string, number>;
  postOnePlyActorCounts: Record<string, number>;
  postOnePlyPhaseCounts: Record<string, number>;
  nextLegalMoveCounts: readonly number[];
  nextPublicActionCounts: readonly number[];
  nextPublicActionCollisionCounts: readonly number[];
  largestNextPublicActionBucketSizes: readonly number[];
  nextPublicActionTargetExpansionCounts: readonly number[];
  branchingBudgetBucket: DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket;
  branchingRiskBucket: DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket;
  probeStatus: DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage {
  count: number;
  percentageOfSkippedRoots: number;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0SkipCounters {
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

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0SkipCounterPercentages {
  bySuite: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
  byPhase: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
  byRound: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
  byMatchup: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
  byPolicy: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
  byFaction: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
  byDeckPreset: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
  byProvenanceLabel: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
  byInvalidReason: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
  bySkipReason: Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage>;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0SourceConsistency {
  status: DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus;
  cFp68ContractStatus: DeterminizedProbeContractSummary["contractStatus"];
  cFp68ContractNotProbeReady: number;
  cFp68TotalRootCount: number;
  cFp68EligibleRootsRead: number;
  cFp68SkippedRootsRead: number;
  cFp69ProbeRootsRead: number;
  cFp69SkippedRootsRead: number;
  cFp70AvailabilityRootsRead: number;
  cFp70SkippedRootsRead: number;
  cFp71OutcomeRootsRead: number;
  cFp71SkippedRootsRead: number;
  benchmarkObservedRootsRead: number;
  eligibleRootsNotObserved: number;
  observedRootsNotInCfp68Cfp69Cfp70Cfp71Contract: number;
  skippedRootsIncorrectlyProbed: number;
  duplicateObservedRootKeys: number;
  duplicateCfp68EligibleRootKeys: number;
  duplicateCfp69ProbeRootKeys: number;
  duplicateCfp70AvailabilityRootKeys: number;
  duplicateCfp71OutcomeRootKeys: number;
  duplicateSkippedRootKeys: number;
  cfp68Cfp69EligibleRootCountDelta: number;
  cfp68Cfp70AvailabilityRootCountDelta: number;
  cfp68Cfp71OutcomeRootCountDelta: number;
  cfp69Cfp70AvailabilityRootCountDelta: number;
  cfp69Cfp71OutcomeRootCountDelta: number;
  cfp70Cfp71OutcomeRootCountDelta: number;
  cfp68Cfp69SkippedRootCountDelta: number;
  cfp68Cfp70SkippedRootCountDelta: number;
  cfp68Cfp71SkippedRootCountDelta: number;
  cfp69Cfp70SkippedRootCountDelta: number;
  cfp69Cfp71SkippedRootCountDelta: number;
  cfp70Cfp71SkippedRootCountDelta: number;
  cfp69ProbeRootsMissingCfp68EligibleRoot: number;
  cfp70AvailabilityRootsMissingCfp68EligibleRoot: number;
  cfp71OutcomeRootsMissingCfp68EligibleRoot: number;
  cfp69SkippedRootsMissingCfp68SkippedRoot: number;
  cfp70SkippedRootsMissingCfp68SkippedRoot: number;
  cfp71SkippedRootsMissingCfp68SkippedRoot: number;
  cfp68Cfp69SampleCountMismatchRoots: number;
  cfp68Cfp70SampleCountMismatchRoots: number;
  cfp68Cfp71SampleCountMismatchRoots: number;
  cfp69Cfp70Cfp71PublicActionCountMismatchRoots: number;
  cfp70RootsWithAvailabilityDisagreement: number;
  cfp71RootsWithFailedOrDeferredPairs: number;
  cfp71RootsWithOutcomeDivergence: number;
  cfp68FingerprintMismatchObservedRoots: number;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0SampleBudget {
  branchingRootCount: number;
  requestedSamplesPerRootDistribution: Record<string, number>;
  totalRequestedSampleCount: number;
  totalGeneratedSampleCount: number;
  totalCheckedSampleCount: number;
  totalFailedSampleCount: number;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatusSummary {
  probeStatusCounts: Record<DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus, number>;
  branchingStatusCounts: Record<DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus, number>;
  firstPlyPublicActionSamplePairTotal: number;
  completedBranchingPairCount: number;
  failedOrDeferredBranchingPairCount: number;
  sampleActionMissingPairCount: number;
  moveCommandConversionFailedPairCount: number;
  engineCommandRejectedPairCount: number;
  engineCommandExceptionPairCount: number;
  actorResolutionFailedPairCount: number;
  legalMoveGenerationFailedPairCount: number;
  publicActionAbstractionFailedPairCount: number;
  onePlyExecutionDeferredPairCount: number;
  rootsWithAnyFailedOrDeferredPair: number;
  postOnePlyActorCounts: Record<DeterminizedPimcPostOnePlyBranchingBudgetV0PostActorLabel, number>;
  postOnePlyPhaseCounts: Record<DeterminizedPimcPostOnePlyBranchingBudgetV0PostPhaseLabel, number>;
  branchingBudgetBucketCounts: Record<DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket, number>;
  branchingRiskBucketCounts: Record<DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket, number>;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingAggregates {
  rootPublicActionCountStats: SamplerReadinessCountStats;
  firstPlyPublicActionSamplePairCountStats: SamplerReadinessCountStats;
  completedBranchingPairCountStats: SamplerReadinessCountStats;
  failedOrDeferredBranchingPairCountStats: SamplerReadinessCountStats;
  nextLegalMoveCountStats: SamplerReadinessCountStats;
  nextPublicActionCountStats: SamplerReadinessCountStats;
  nextPublicActionCollisionCountStats: SamplerReadinessCountStats;
  largestNextPublicActionBucketSizeStats: SamplerReadinessCountStats;
  nextPublicActionTargetExpansionCountStats: SamplerReadinessCountStats;
  postOnePlyPublicActionBudgetTotal: number;
  postOnePlyPublicActionBudgetAverage: number;
  aggregateBranchingStatusCountsByFirstPlyPublicActionKind: Record<PublicSearchActionKind, Record<string, number>>;
  aggregateActorCountsByFirstPlyPublicActionKind: Record<PublicSearchActionKind, Record<string, number>>;
  aggregateBudgetBucketCountsByFirstPlyPublicActionKind: Record<PublicSearchActionKind, Record<string, number>>;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0Summary {
  schemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetV0SummarySchemaVersion;
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  probeVariant: "determinized-pimc-post-one-ply-branching-budget-v0";
  probeMode: "post_one_ply_branching_budget_probe";
  probeReadinessStatus: DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus;
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  sourceCfp71OutcomeRunId: string;
  sourceCfp68ArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp69ArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp70ArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp71ArtifactReferences: readonly DeterminizedProbeContractSourceArtifactReference[];
  totalCfp68RootCount: number;
  eligibleRootCount: number;
  branchingRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  matchCount: number;
  sourceConsistency: DeterminizedPimcPostOnePlyBranchingBudgetV0SourceConsistency;
  sampleBudget: DeterminizedPimcPostOnePlyBranchingBudgetV0SampleBudget;
  branchingStatus: DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatusSummary;
  branchingAggregates: DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingAggregates;
  skipCounters: DeterminizedPimcPostOnePlyBranchingBudgetV0SkipCounters;
  skipCounterPercentages: DeterminizedPimcPostOnePlyBranchingBudgetV0SkipCounterPercentages;
  explicitNonClaims: readonly string[];
  hiddenInfoSafetyNote: string;
  cFp73Recommendation: string;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0Result {
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  benchmark?: BenchmarkRunResult;
  branchingRoots: DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord[];
  skippedRoots: DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord[];
  summary: DeterminizedPimcPostOnePlyBranchingBudgetV0Summary;
}

export interface BuildDeterminizedPimcPostOnePlyBranchingBudgetV0Input {
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
  cFp71OutcomeSummary: DeterminizedPimcOnePlyOutcomeSkeletonV0Summary;
  cFp71OutcomeRoots: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord[];
  cFp71SkippedRoots: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord[];
  observedRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot[];
  observedAggregateCounts?: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedAggregateCounts;
  benchmark?: BenchmarkRunResult;
  sourceCfp68ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp69ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp70ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
  sourceCfp71ArtifactReferences?: readonly DeterminizedProbeContractSourceArtifactReference[];
}

export interface RunDeterminizedPimcPostOnePlyBranchingBudgetV0Input
  extends Omit<
    BuildDeterminizedPimcPostOnePlyBranchingBudgetV0Input,
    "probeRunId" | "suiteId" | "observedRoots" | "observedAggregateCounts"
  > {
  suiteId?: string;
  suite?: BenchmarkSuite;
  probeRunId?: string;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
}

interface PublicActionBucketWithMoves
  extends DeterminizedPimcActionAvailabilityV0PublicActionBucket {
  moves: LegalMove[];
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0ExecutionDeps {
  commandFromLegalMove?: (
    move: LegalMove,
  ) => Exclude<EngineCommand, { type: "StartMatch" }> | null;
  executeCommand?: (input: {
    state: MatchState;
    command: Exclude<EngineCommand, { type: "StartMatch" }>;
    catalogCards: typeof currentCatalogCards;
    catalogLeaders: typeof currentCatalogLeaders;
  }) => EngineTransaction | { status: "rejected" | "failed" };
  getLegalMoves?: typeof getLegalMoves;
  buildPublicActionBuckets?: (
    legalMoves: readonly LegalMove[],
    phase: MatchPhase,
    round: number,
  ) => readonly DeterminizedPimcActionAvailabilityV0PublicActionBucket[];
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0PairSurface {
  postOnePlyActor: DeterminizedPimcPostOnePlyBranchingBudgetV0PostActorLabel;
  postOnePlyPhase: DeterminizedPimcPostOnePlyBranchingBudgetV0PostPhaseLabel;
  nextLegalMoveCount: number;
  nextPublicActionCount: number;
  nextPublicActionCollisionCount: number;
  largestNextPublicActionBucketSize: number;
  nextPublicActionTargetExpansionCount: number;
  budgetBucket: DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0SampleExecutionResult {
  sampledActionBucketCount: number;
  firstPlyPublicActionSamplePairCount: number;
  completedBranchingPairCount: number;
  failedOrDeferredBranchingPairCount: number;
  sampleActionMissingPairCount: number;
  moveCommandConversionFailedPairCount: number;
  engineCommandRejectedPairCount: number;
  engineCommandExceptionPairCount: number;
  actorResolutionFailedPairCount: number;
  legalMoveGenerationFailedPairCount: number;
  publicActionAbstractionFailedPairCount: number;
  onePlyExecutionDeferredPairCount: number;
  branchingStatusCounts: Record<DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus, number>;
  postOnePlyActorCounts: Record<DeterminizedPimcPostOnePlyBranchingBudgetV0PostActorLabel, number>;
  postOnePlyPhaseCounts: Record<DeterminizedPimcPostOnePlyBranchingBudgetV0PostPhaseLabel, number>;
  nextLegalMoveCounts: readonly number[];
  nextPublicActionCounts: readonly number[];
  nextPublicActionCollisionCounts: readonly number[];
  largestNextPublicActionBucketSizes: readonly number[];
  nextPublicActionTargetExpansionCounts: readonly number[];
  branchingStatusCountsByFirstPlyPublicActionKind: Record<PublicSearchActionKind, Record<string, number>>;
  actorCountsByFirstPlyPublicActionKind: Record<PublicSearchActionKind, Record<string, number>>;
  budgetBucketCountsByFirstPlyPublicActionKind: Record<PublicSearchActionKind, Record<string, number>>;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedAggregateCounts {
  branchingStatusCountsByFirstPlyPublicActionKind: Record<PublicSearchActionKind, Record<string, number>>;
  actorCountsByFirstPlyPublicActionKind: Record<PublicSearchActionKind, Record<string, number>>;
  budgetBucketCountsByFirstPlyPublicActionKind: Record<PublicSearchActionKind, Record<string, number>>;
}

const SEATS: readonly SeatId[] = ["seat_a", "seat_b"];

const publicActionKinds: readonly PublicSearchActionKind[] = [
  "choose_mulligan",
  "play_card",
  "use_leader",
  "choose_prompt_option",
  "pass",
  "resolve_round_end",
];

const branchingStatuses: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus[] =
  [
    "completed",
    "sample_action_missing",
    "move_command_conversion_failed",
    "engine_command_rejected",
    "engine_command_exception",
    "post_one_ply_actor_resolution_failed",
    "post_one_ply_legal_move_generation_failed",
    "post_one_ply_public_action_abstraction_failed",
    "one_ply_execution_deferred",
  ];

const postActorLabels: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0PostActorLabel[] =
  [
    "policy_actor",
    "system_round_end_resolver",
    "terminal_game_end",
    "no_actor",
    "actor_resolution_failed",
  ];

const postPhaseLabels: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0PostPhaseLabel[] =
  ["mulligan", "playing", "round_end", "game_end"];

const budgetBuckets: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket[] =
  [
    "zero",
    "tiny",
    "small",
    "medium",
    "large",
    "very_large",
    "extreme",
    "failed",
    "deferred",
  ];

export const DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_V0_NON_CLAIMS = [
  "No second ply was executed.",
  "No rollout was run.",
  "No action-strength estimate was computed.",
  "No action ordering was produced.",
  "No move was selected by search.",
  "No win probability was estimated.",
  "No reward target was produced.",
  "No product AI behavior changed.",
  "Skipped roots were excluded from probe work and reported separately.",
] as const;

export const DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_V0_HIDDEN_INFO_SAFETY_NOTE =
  "cFp72 artifacts contain only public benchmark root metadata, scalar branching counts, next-surface public-action aggregates, skipped-root accounting, and source artifact hashes. They exclude private identities, concrete action payloads, sampled payloads, engine trace payloads, ordering outputs, estimates, rollout results, and product AI wiring.";

export const DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_V0_CFP73_RECOMMENDATION =
  "cFp73 should choose a benchmark-only high-branching casebook, budget-threshold summary, or another artifact-only infrastructure probe after checking cFp72 failure, deferred, determinism, and hidden-info results. It should still avoid rollout, search-strength estimates, action ordering, search recommendations, and product AI wiring.";

export const defaultDeterminizedPimcPostOnePlyBranchingBudgetV0RunId = (
  suiteId: string,
) => `${suiteId}:determinized-pimc-post-one-ply-branching-budget-v0:cFp72`;

export const buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey =
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

const average = (values: readonly number[]) =>
  values.length === 0
    ? 0
    : Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(3));

const minValue = (values: readonly number[]) =>
  values.length === 0 ? 0 : Math.min(...values);

const maxValue = (values: readonly number[]) =>
  values.length === 0 ? 0 : Math.max(...values);

const countDistribution = (
  counts: Record<string, number>,
  denominator: number,
): Record<string, DeterminizedPimcPostOnePlyBranchingBudgetV0CountPercentage> =>
  sortRecord(
    Object.fromEntries(
      Object.entries(counts).map(([key, count]) => [
        key,
        { count, percentageOfSkippedRoots: percentage(count, denominator) },
      ]),
    ),
  );

const emptyBranchingStatusCounts = () =>
  Object.fromEntries(branchingStatuses.map((status) => [status, 0])) as Record<
    DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus,
    number
  >;

const emptyPostActorCounts = () =>
  Object.fromEntries(postActorLabels.map((label) => [label, 0])) as Record<
    DeterminizedPimcPostOnePlyBranchingBudgetV0PostActorLabel,
    number
  >;

const emptyPostPhaseCounts = () =>
  Object.fromEntries(postPhaseLabels.map((label) => [label, 0])) as Record<
    DeterminizedPimcPostOnePlyBranchingBudgetV0PostPhaseLabel,
    number
  >;

const emptyBudgetBucketCounts = () =>
  Object.fromEntries(budgetBuckets.map((bucket) => [bucket, 0])) as Record<
    DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket,
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

export const budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count = (
  count: number,
): DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket => {
  if (count <= 0) return "zero";
  if (count <= 2) return "tiny";
  if (count <= 5) return "small";
  if (count <= 10) return "medium";
  if (count <= 16) return "large";
  if (count <= 32) return "very_large";
  return "extreme";
};

const buildPublicActionBucketsWithMoves = (
  legalMoves: readonly LegalMove[],
  phase: MatchPhase,
  round: number,
): PublicActionBucketWithMoves[] => {
  const buckets = new Map<string, PublicActionBucketWithMoves>();
  legalMoves.forEach((move) => {
    const action = buildPublicActionAbstraction(move, phase, round);
    const key =
      buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey(action);
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

const publicActionTargetExpansionCount = (
  actions: readonly PublicSearchActionAbstraction[],
) =>
  actions.filter(
    (action) =>
      action.targetKind !== "none" ||
      action.targetSide !== "none" ||
      Boolean(action.targetRow),
  ).length;

const postPhaseLabel = (
  phase: MatchPhase,
): DeterminizedPimcPostOnePlyBranchingBudgetV0PostPhaseLabel | null => {
  if (
    phase === "mulligan" ||
    phase === "playing" ||
    phase === "round_end" ||
    phase === "game_end"
  ) {
    return phase;
  }
  return null;
};

export const resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor = (
  state: MatchState,
): {
  actorLabel: DeterminizedPimcPostOnePlyBranchingBudgetV0PostActorLabel;
  seatId: SeatId | null;
} => {
  if (state.phase === "game_end") {
    return { actorLabel: "terminal_game_end", seatId: null };
  }
  if (state.pendingPrompt) {
    return { actorLabel: "policy_actor", seatId: state.pendingPrompt.seatId };
  }
  if (state.phase === "mulligan") {
    const seatId = SEATS.find((candidate) => !state.seats[candidate].mulliganComplete);
    return seatId
      ? { actorLabel: "policy_actor", seatId }
      : { actorLabel: "no_actor", seatId: null };
  }
  if (state.phase === "playing") {
    return { actorLabel: "policy_actor", seatId: state.currentTurn };
  }
  if (state.phase === "round_end") {
    return { actorLabel: "system_round_end_resolver", seatId: "seat_a" };
  }
  return { actorLabel: "actor_resolution_failed", seatId: null };
};

export const countDeterminizedPimcPostOnePlyBranchingBudgetV0Surface = ({
  state,
  deps = {},
}: {
  state: MatchState;
  deps?: DeterminizedPimcPostOnePlyBranchingBudgetV0ExecutionDeps;
}):
  | { status: "completed"; surface: DeterminizedPimcPostOnePlyBranchingBudgetV0PairSurface }
  | { status: Exclude<DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus, "completed"> } => {
  const phaseLabel = postPhaseLabel(state.phase);
  if (!phaseLabel) {
    return { status: "post_one_ply_actor_resolution_failed" };
  }

  const actor = resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor(state);
  if (actor.actorLabel === "actor_resolution_failed") {
    return { status: "post_one_ply_actor_resolution_failed" };
  }

  if (
    actor.actorLabel === "terminal_game_end" ||
    actor.actorLabel === "no_actor" ||
    !actor.seatId
  ) {
    return {
      status: "completed",
      surface: {
        postOnePlyActor: actor.actorLabel,
        postOnePlyPhase: phaseLabel,
        nextLegalMoveCount: 0,
        nextPublicActionCount: 0,
        nextPublicActionCollisionCount: 0,
        largestNextPublicActionBucketSize: 0,
        nextPublicActionTargetExpansionCount: 0,
        budgetBucket: "zero",
      },
    };
  }

  const legalMoveReader = deps.getLegalMoves ?? getLegalMoves;
  let nextLegalMoves: LegalMove[];
  try {
    nextLegalMoves = legalMoveReader({
      state,
      seatId: actor.seatId,
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
  } catch {
    return { status: "post_one_ply_legal_move_generation_failed" };
  }

  let buckets: PublicActionBucketWithMoves[];
  try {
    if (deps.buildPublicActionBuckets) {
      const publicBuckets = deps.buildPublicActionBuckets(
        nextLegalMoves,
        state.phase,
        state.round,
      );
      buckets = publicBuckets.map((bucket) => ({
        ...bucket,
        moves: nextLegalMoves.filter((move) => {
          const action = buildPublicActionAbstraction(
            move,
            state.phase,
            state.round,
          );
          return (
            buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey(
              action,
            ) === bucket.key
          );
        }),
      }));
    } else {
      buckets = buildPublicActionBucketsWithMoves(
        nextLegalMoves,
        state.phase,
        state.round,
      );
    }
  } catch {
    return { status: "post_one_ply_public_action_abstraction_failed" };
  }

  const nextPublicActionCount = buckets.length;
  const largestNextPublicActionBucketSize = maxValue(
    buckets.map((bucket) => bucket.moves.length),
  );
  const actionExpansionCount = publicActionTargetExpansionCount(
    buckets.map((bucket) => bucket.action),
  );

  return {
    status: "completed",
    surface: {
      postOnePlyActor: actor.actorLabel,
      postOnePlyPhase: phaseLabel,
      nextLegalMoveCount: nextLegalMoves.length,
      nextPublicActionCount,
      nextPublicActionCollisionCount:
        nextLegalMoves.length - nextPublicActionCount,
      largestNextPublicActionBucketSize,
      nextPublicActionTargetExpansionCount: actionExpansionCount,
      budgetBucket:
        budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count(
          nextPublicActionCount,
        ),
    },
  };
};

interface MutableSampleExecutionResult
  extends Omit<
    DeterminizedPimcPostOnePlyBranchingBudgetV0SampleExecutionResult,
    | "nextLegalMoveCounts"
    | "nextPublicActionCounts"
    | "nextPublicActionCollisionCounts"
    | "largestNextPublicActionBucketSizes"
    | "nextPublicActionTargetExpansionCounts"
  > {
  nextLegalMoveCounts: number[];
  nextPublicActionCounts: number[];
  nextPublicActionCollisionCounts: number[];
  largestNextPublicActionBucketSizes: number[];
  nextPublicActionTargetExpansionCounts: number[];
}

const emptySampleExecutionResult = (
  sampledActionBucketCount: number,
): MutableSampleExecutionResult => ({
  sampledActionBucketCount,
  firstPlyPublicActionSamplePairCount: 0,
  completedBranchingPairCount: 0,
  failedOrDeferredBranchingPairCount: 0,
  sampleActionMissingPairCount: 0,
  moveCommandConversionFailedPairCount: 0,
  engineCommandRejectedPairCount: 0,
  engineCommandExceptionPairCount: 0,
  actorResolutionFailedPairCount: 0,
  legalMoveGenerationFailedPairCount: 0,
  publicActionAbstractionFailedPairCount: 0,
  onePlyExecutionDeferredPairCount: 0,
  branchingStatusCounts: emptyBranchingStatusCounts(),
  postOnePlyActorCounts: emptyPostActorCounts(),
  postOnePlyPhaseCounts: emptyPostPhaseCounts(),
  nextLegalMoveCounts: [],
  nextPublicActionCounts: [],
  nextPublicActionCollisionCounts: [],
  largestNextPublicActionBucketSizes: [],
  nextPublicActionTargetExpansionCounts: [],
  branchingStatusCountsByFirstPlyPublicActionKind:
    emptyNestedPublicActionKindCounts(),
  actorCountsByFirstPlyPublicActionKind: emptyNestedPublicActionKindCounts(),
  budgetBucketCountsByFirstPlyPublicActionKind:
    emptyNestedPublicActionKindCounts(),
});

const addPairStatus = ({
  result,
  publicActionKind,
  status,
  surface,
}: {
  result: MutableSampleExecutionResult;
  publicActionKind: PublicSearchActionKind;
  status: DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus;
  surface?: DeterminizedPimcPostOnePlyBranchingBudgetV0PairSurface;
}) => {
  result.firstPlyPublicActionSamplePairCount += 1;
  addCount(result.branchingStatusCounts, status);
  addNestedCount(
    result.branchingStatusCountsByFirstPlyPublicActionKind,
    publicActionKind,
    status,
  );

  if (status !== "completed" || !surface) {
    result.failedOrDeferredBranchingPairCount += 1;
    const bucket =
      status === "one_ply_execution_deferred" ? "deferred" : "failed";
    addNestedCount(
      result.budgetBucketCountsByFirstPlyPublicActionKind,
      publicActionKind,
      bucket,
    );
    if (status === "sample_action_missing") {
      result.sampleActionMissingPairCount += 1;
    } else if (status === "move_command_conversion_failed") {
      result.moveCommandConversionFailedPairCount += 1;
    } else if (status === "engine_command_rejected") {
      result.engineCommandRejectedPairCount += 1;
    } else if (status === "engine_command_exception") {
      result.engineCommandExceptionPairCount += 1;
    } else if (status === "post_one_ply_actor_resolution_failed") {
      result.actorResolutionFailedPairCount += 1;
    } else if (status === "post_one_ply_legal_move_generation_failed") {
      result.legalMoveGenerationFailedPairCount += 1;
    } else if (status === "post_one_ply_public_action_abstraction_failed") {
      result.publicActionAbstractionFailedPairCount += 1;
    } else if (status === "one_ply_execution_deferred") {
      result.onePlyExecutionDeferredPairCount += 1;
    }
    return;
  }

  result.completedBranchingPairCount += 1;
  addCount(result.postOnePlyActorCounts, surface.postOnePlyActor);
  addCount(result.postOnePlyPhaseCounts, surface.postOnePlyPhase);
  addNestedCount(
    result.actorCountsByFirstPlyPublicActionKind,
    publicActionKind,
    surface.postOnePlyActor,
  );
  addNestedCount(
    result.budgetBucketCountsByFirstPlyPublicActionKind,
    publicActionKind,
    surface.budgetBucket,
  );
  result.nextLegalMoveCounts.push(surface.nextLegalMoveCount);
  result.nextPublicActionCounts.push(surface.nextPublicActionCount);
  result.nextPublicActionCollisionCounts.push(
    surface.nextPublicActionCollisionCount,
  );
  result.largestNextPublicActionBucketSizes.push(
    surface.largestNextPublicActionBucketSize,
  );
  result.nextPublicActionTargetExpansionCounts.push(
    surface.nextPublicActionTargetExpansionCount,
  );
};

export const executeDeterminizedPimcPostOnePlyBranchingBudgetV0Sample = ({
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
  deps?: DeterminizedPimcPostOnePlyBranchingBudgetV0ExecutionDeps;
}): DeterminizedPimcPostOnePlyBranchingBudgetV0SampleExecutionResult => {
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
        });
        return;
      }
      if (!("state" in transaction)) {
        addPairStatus({
          result,
          publicActionKind,
          status: "engine_command_rejected",
        });
        return;
      }

      const surface = countDeterminizedPimcPostOnePlyBranchingBudgetV0Surface({
        state: transaction.state,
        deps,
      });
      if (surface.status !== "completed") {
        addPairStatus({
          result,
          publicActionKind,
          status: surface.status,
        });
        return;
      }

      addPairStatus({
        result,
        publicActionKind,
        status: "completed",
        surface: surface.surface,
      });
    } catch {
      addPairStatus({
        result,
        publicActionKind,
        status: "engine_command_exception",
      });
    }
  });

  return {
    ...result,
    branchingStatusCounts: sortRecord(result.branchingStatusCounts),
    postOnePlyActorCounts: sortRecord(result.postOnePlyActorCounts),
    postOnePlyPhaseCounts: sortRecord(result.postOnePlyPhaseCounts),
    branchingStatusCountsByFirstPlyPublicActionKind:
      sortedNestedPublicActionKindCounts(
        result.branchingStatusCountsByFirstPlyPublicActionKind,
      ),
    actorCountsByFirstPlyPublicActionKind: sortedNestedPublicActionKindCounts(
      result.actorCountsByFirstPlyPublicActionKind,
    ),
    budgetBucketCountsByFirstPlyPublicActionKind:
      sortedNestedPublicActionKindCounts(
        result.budgetBucketCountsByFirstPlyPublicActionKind,
      ),
  };
};

const baseObservedIdentity = (
  input: BenchmarkRootObserverInput,
): Omit<
  DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot,
  | "rootPublicFingerprint"
  | "cfp68RootPublicFingerprint"
  | "cfp69LegalMoveCount"
  | "cfp69PublicActionCount"
  | "cfp70AvailabilityStatus"
  | "cfp70RootActionBucketCount"
  | "cfp71OutcomeStatus"
  | "cfp71PublicActionSamplePairCount"
  | "cfp71CompletedPairCount"
  | "cfp71FailedOrDeferredPairCount"
  | "cfp71OutcomeDivergenceCount"
  | "sampleCountRequested"
  | "sampleCountGenerated"
  | "sampleCountChecked"
  | "sampleCountBranchingFailed"
  | "rootPublicActionCount"
  | "firstPlyPublicActionSamplePairCount"
  | "completedBranchingPairCount"
  | "failedOrDeferredBranchingPairCount"
  | "sampleActionMissingPairCount"
  | "moveCommandConversionFailedPairCount"
  | "engineCommandRejectedPairCount"
  | "engineCommandExceptionPairCount"
  | "actorResolutionFailedPairCount"
  | "legalMoveGenerationFailedPairCount"
  | "publicActionAbstractionFailedPairCount"
  | "onePlyExecutionDeferredPairCount"
  | "branchingStatusCounts"
  | "postOnePlyActorCounts"
  | "postOnePlyPhaseCounts"
  | "nextLegalMoveCounts"
  | "nextPublicActionCounts"
  | "nextPublicActionCollisionCounts"
  | "largestNextPublicActionBucketSizes"
  | "nextPublicActionTargetExpansionCounts"
  | "branchingBudgetBucket"
  | "branchingRiskBucket"
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
  sample: DeterminizedPimcPostOnePlyBranchingBudgetV0SampleExecutionResult,
) => {
  target.firstPlyPublicActionSamplePairCount +=
    sample.firstPlyPublicActionSamplePairCount;
  target.completedBranchingPairCount += sample.completedBranchingPairCount;
  target.failedOrDeferredBranchingPairCount +=
    sample.failedOrDeferredBranchingPairCount;
  target.sampleActionMissingPairCount += sample.sampleActionMissingPairCount;
  target.moveCommandConversionFailedPairCount +=
    sample.moveCommandConversionFailedPairCount;
  target.engineCommandRejectedPairCount += sample.engineCommandRejectedPairCount;
  target.engineCommandExceptionPairCount += sample.engineCommandExceptionPairCount;
  target.actorResolutionFailedPairCount +=
    sample.actorResolutionFailedPairCount;
  target.legalMoveGenerationFailedPairCount +=
    sample.legalMoveGenerationFailedPairCount;
  target.publicActionAbstractionFailedPairCount +=
    sample.publicActionAbstractionFailedPairCount;
  target.onePlyExecutionDeferredPairCount +=
    sample.onePlyExecutionDeferredPairCount;
  Object.entries(sample.branchingStatusCounts).forEach(([status, count]) => {
    addCount(target.branchingStatusCounts, status, count);
  });
  Object.entries(sample.postOnePlyActorCounts).forEach(([actor, count]) => {
    addCount(target.postOnePlyActorCounts, actor, count);
  });
  Object.entries(sample.postOnePlyPhaseCounts).forEach(([phase, count]) => {
    addCount(target.postOnePlyPhaseCounts, phase, count);
  });
  target.nextLegalMoveCounts.push(...sample.nextLegalMoveCounts);
  target.nextPublicActionCounts.push(...sample.nextPublicActionCounts);
  target.nextPublicActionCollisionCounts.push(
    ...sample.nextPublicActionCollisionCounts,
  );
  target.largestNextPublicActionBucketSizes.push(
    ...sample.largestNextPublicActionBucketSizes,
  );
  target.nextPublicActionTargetExpansionCounts.push(
    ...sample.nextPublicActionTargetExpansionCounts,
  );
  combineNestedCounts(
    target.branchingStatusCountsByFirstPlyPublicActionKind,
    sample.branchingStatusCountsByFirstPlyPublicActionKind,
  );
  combineNestedCounts(
    target.actorCountsByFirstPlyPublicActionKind,
    sample.actorCountsByFirstPlyPublicActionKind,
  );
  combineNestedCounts(
    target.budgetBucketCountsByFirstPlyPublicActionKind,
    sample.budgetBucketCountsByFirstPlyPublicActionKind,
  );
};

const addWholeSampleFailure = ({
  target,
  rootBuckets,
  status,
}: {
  target: MutableSampleExecutionResult;
  rootBuckets: readonly DeterminizedPimcActionAvailabilityV0PublicActionBucket[];
  status: DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus;
}) => {
  rootBuckets.forEach((bucket) => {
    addPairStatus({
      result: target,
      publicActionKind: bucket.action.kind,
      status,
    });
  });
};

const rootBudgetBucket = ({
  failedOrDeferredBranchingPairCount,
  onePlyExecutionDeferredPairCount,
  maxNextPublicActionCount,
}: {
  failedOrDeferredBranchingPairCount: number;
  onePlyExecutionDeferredPairCount: number;
  maxNextPublicActionCount: number;
}): DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket => {
  if (onePlyExecutionDeferredPairCount > 0) return "deferred";
  if (failedOrDeferredBranchingPairCount > 0) return "failed";
  return budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count(
    maxNextPublicActionCount,
  );
};

const probeStatusForObservedRoot = (
  observed: Pick<
    DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot,
    | "completedBranchingPairCount"
    | "sampleActionMissingPairCount"
    | "moveCommandConversionFailedPairCount"
    | "engineCommandRejectedPairCount"
    | "engineCommandExceptionPairCount"
    | "actorResolutionFailedPairCount"
    | "legalMoveGenerationFailedPairCount"
    | "publicActionAbstractionFailedPairCount"
    | "onePlyExecutionDeferredPairCount"
  >,
): DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus => {
  if (observed.onePlyExecutionDeferredPairCount > 0) {
    return "one_ply_execution_deferred";
  }
  if (observed.sampleActionMissingPairCount > 0) return "sample_action_missing";
  if (observed.moveCommandConversionFailedPairCount > 0) {
    return "move_command_conversion_failed";
  }
  if (observed.engineCommandRejectedPairCount > 0) return "engine_command_rejected";
  if (observed.engineCommandExceptionPairCount > 0) return "engine_command_exception";
  if (observed.actorResolutionFailedPairCount > 0) {
    return "post_one_ply_actor_resolution_failed";
  }
  if (observed.legalMoveGenerationFailedPairCount > 0) {
    return "post_one_ply_legal_move_generation_failed";
  }
  if (observed.publicActionAbstractionFailedPairCount > 0) {
    return "post_one_ply_public_action_abstraction_failed";
  }
  if (observed.completedBranchingPairCount > 0) return "completed";
  return "one_ply_execution_deferred";
};

export const buildDeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot = ({
  input,
  samplerRunId,
  memory,
  cFp68EligibleRoot,
  cFp69ProbeRoot,
  cFp70AvailabilityRoot,
  cFp71OutcomeRoot,
  deps,
}: {
  input: BenchmarkRootObserverInput;
  samplerRunId: string;
  memory: SamplerPublicTransferMemoryState;
  cFp68EligibleRoot?: DeterminizedProbeContractEligibleRootRecord;
  cFp69ProbeRoot?: DeterminizedPimcProbeV0RootRecord;
  cFp70AvailabilityRoot?: DeterminizedPimcActionAvailabilityV0RootRecord;
  cFp71OutcomeRoot?: DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord;
  deps?: DeterminizedPimcPostOnePlyBranchingBudgetV0ExecutionDeps;
}): {
  observedRoot: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot;
  aggregateCounts: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedAggregateCounts;
} => {
  const identity = baseObservedIdentity(input);
  const rootBuckets =
    cFp68EligibleRoot &&
    cFp69ProbeRoot &&
    cFp70AvailabilityRoot &&
    cFp71OutcomeRoot
      ? buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets(
          input.legalMoves,
          input.state.phase,
          input.state.round,
        )
      : [];
  const aggregate = emptySampleExecutionResult(0);
  let sampleCountChecked = 0;
  let sampleCountBranchingFailed = 0;

  const materialization =
    cFp68EligibleRoot &&
    cFp69ProbeRoot &&
    cFp70AvailabilityRoot &&
    cFp71OutcomeRoot
      ? buildDeterminizedPimcActionAvailabilityV0InMemoryMaterializationForRoot({
          input,
          samplerRunId,
          memory,
        })
      : undefined;

  let deferred =
    !cFp68EligibleRoot ||
    !cFp69ProbeRoot ||
    !cFp70AvailabilityRoot ||
    !cFp71OutcomeRoot;

  if (
    materialization &&
    cFp68EligibleRoot &&
    cFp69ProbeRoot &&
    cFp70AvailabilityRoot &&
    cFp71OutcomeRoot
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
    const cfp71Matches =
      cFp71OutcomeRoot.probeStatus === "completed" &&
      cFp71OutcomeRoot.rootPublicActionCount === rootBuckets.length &&
      cFp71OutcomeRoot.sampleCountRequested ===
        cFp68EligibleRoot.sampleCountRequested &&
      cFp71OutcomeRoot.sampleCountGenerated ===
        cFp68EligibleRoot.sampleCountGenerated &&
      cFp71OutcomeRoot.sampleCountChecked === cFp68EligibleRoot.sampleCountValid &&
      cFp71OutcomeRoot.publicActionSamplePairCount ===
        rootBuckets.length * cFp68EligibleRoot.sampleCountValid &&
      cFp71OutcomeRoot.completedPairCount ===
        cFp71OutcomeRoot.publicActionSamplePairCount &&
      cFp71OutcomeRoot.failedOrDeferredPairCount === 0 &&
      cFp71OutcomeRoot.outcomeDivergenceCount === 0;

    deferred =
      !cfp68Matches ||
      !cfp69Matches ||
      !cfp70Matches ||
      !cfp71Matches ||
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
          sampleCountBranchingFailed += 1;
          addWholeSampleFailure({
            target: aggregate,
            rootBuckets,
            status: "one_ply_execution_deferred",
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
          sampleCountBranchingFailed += 1;
          addWholeSampleFailure({
            target: aggregate,
            rootBuckets,
            status: "one_ply_execution_deferred",
          });
          continue;
        }

        try {
          const sampleResult =
            executeDeterminizedPimcPostOnePlyBranchingBudgetV0Sample({
              sampledState: rebuilt.state,
              seatId: input.seatId,
              rootBuckets,
              sampledLegalMoves,
              phase: input.state.phase,
              round: input.state.round,
              deps,
            });
          sampleCountChecked += 1;
          mergeSampleResult(aggregate, sampleResult);
        } catch {
          sampleCountBranchingFailed += 1;
          addWholeSampleFailure({
            target: aggregate,
            rootBuckets,
            status: "post_one_ply_public_action_abstraction_failed",
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
    sampleCountBranchingFailed = deferredSamples;
  }

  const observedDraft = {
    completedBranchingPairCount: aggregate.completedBranchingPairCount,
    sampleActionMissingPairCount: aggregate.sampleActionMissingPairCount,
    moveCommandConversionFailedPairCount:
      aggregate.moveCommandConversionFailedPairCount,
    engineCommandRejectedPairCount: aggregate.engineCommandRejectedPairCount,
    engineCommandExceptionPairCount: aggregate.engineCommandExceptionPairCount,
    actorResolutionFailedPairCount: aggregate.actorResolutionFailedPairCount,
    legalMoveGenerationFailedPairCount:
      aggregate.legalMoveGenerationFailedPairCount,
    publicActionAbstractionFailedPairCount:
      aggregate.publicActionAbstractionFailedPairCount,
    onePlyExecutionDeferredPairCount:
      aggregate.onePlyExecutionDeferredPairCount,
  };
  const maxNextPublicActionCount = maxValue(aggregate.nextPublicActionCounts);
  const budgetBucket = rootBudgetBucket({
    failedOrDeferredBranchingPairCount:
      aggregate.failedOrDeferredBranchingPairCount,
    onePlyExecutionDeferredPairCount:
      aggregate.onePlyExecutionDeferredPairCount,
    maxNextPublicActionCount,
  });

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
      cfp71OutcomeStatus:
        cFp71OutcomeRoot?.probeStatus ?? "one_ply_execution_deferred",
      cfp71PublicActionSamplePairCount:
        cFp71OutcomeRoot?.publicActionSamplePairCount ?? 0,
      cfp71CompletedPairCount: cFp71OutcomeRoot?.completedPairCount ?? 0,
      cfp71FailedOrDeferredPairCount:
        cFp71OutcomeRoot?.failedOrDeferredPairCount ?? 0,
      cfp71OutcomeDivergenceCount:
        cFp71OutcomeRoot?.outcomeDivergenceCount ?? 0,
      sampleCountRequested:
        materialization?.sampleCountRequested ??
        cFp68EligibleRoot?.sampleCountRequested ??
        0,
      sampleCountGenerated: materialization?.sampleCountGenerated ?? 0,
      sampleCountChecked,
      sampleCountBranchingFailed,
      rootPublicActionCount: rootBuckets.length,
      firstPlyPublicActionSamplePairCount:
        aggregate.firstPlyPublicActionSamplePairCount,
      completedBranchingPairCount: aggregate.completedBranchingPairCount,
      failedOrDeferredBranchingPairCount:
        aggregate.failedOrDeferredBranchingPairCount,
      sampleActionMissingPairCount: aggregate.sampleActionMissingPairCount,
      moveCommandConversionFailedPairCount:
        aggregate.moveCommandConversionFailedPairCount,
      engineCommandRejectedPairCount: aggregate.engineCommandRejectedPairCount,
      engineCommandExceptionPairCount: aggregate.engineCommandExceptionPairCount,
      actorResolutionFailedPairCount: aggregate.actorResolutionFailedPairCount,
      legalMoveGenerationFailedPairCount:
        aggregate.legalMoveGenerationFailedPairCount,
      publicActionAbstractionFailedPairCount:
        aggregate.publicActionAbstractionFailedPairCount,
      onePlyExecutionDeferredPairCount:
        aggregate.onePlyExecutionDeferredPairCount,
      branchingStatusCounts: sortRecord(aggregate.branchingStatusCounts),
      postOnePlyActorCounts: sortRecord(aggregate.postOnePlyActorCounts),
      postOnePlyPhaseCounts: sortRecord(aggregate.postOnePlyPhaseCounts),
      nextLegalMoveCounts: aggregate.nextLegalMoveCounts,
      nextPublicActionCounts: aggregate.nextPublicActionCounts,
      nextPublicActionCollisionCounts:
        aggregate.nextPublicActionCollisionCounts,
      largestNextPublicActionBucketSizes:
        aggregate.largestNextPublicActionBucketSizes,
      nextPublicActionTargetExpansionCounts:
        aggregate.nextPublicActionTargetExpansionCounts,
      branchingBudgetBucket: budgetBucket,
      branchingRiskBucket: budgetBucket,
      probeStatus: probeStatusForObservedRoot(observedDraft),
    },
    aggregateCounts: {
      branchingStatusCountsByFirstPlyPublicActionKind:
        sortedNestedPublicActionKindCounts(
          aggregate.branchingStatusCountsByFirstPlyPublicActionKind,
        ),
      actorCountsByFirstPlyPublicActionKind: sortedNestedPublicActionKindCounts(
        aggregate.actorCountsByFirstPlyPublicActionKind,
      ),
      budgetBucketCountsByFirstPlyPublicActionKind:
        sortedNestedPublicActionKindCounts(
          aggregate.budgetBucketCountsByFirstPlyPublicActionKind,
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
    | DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord
    | DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord
    | DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot
  )[],
) => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const key = buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(record);
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
    | DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord
    | DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord
    | DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot,
>(
  records: readonly T[],
) => {
  const byKey = new Map<string, T>();
  records.forEach((record) => {
    const key = buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(record);
    if (!byKey.has(key)) {
      byKey.set(key, record);
    }
  });
  return byKey;
};

const baseIdentityFromEligibleRoot = (
  root: DeterminizedProbeContractEligibleRootRecord,
): DeterminizedPimcPostOnePlyBranchingBudgetV0RootIdentity => ({
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
): DeterminizedPimcPostOnePlyBranchingBudgetV0RootIdentity => ({
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

const buildSkippedBranchingRecord = ({
  probeRunId,
  root,
  cFp69SkippedRoot,
  cFp70SkippedRoot,
  cFp71SkippedRoot,
  sourceCfp69ProbeRunId,
  sourceCfp70AvailabilityRunId,
  sourceCfp71OutcomeRunId,
}: {
  probeRunId: string;
  root: DeterminizedProbeContractSkippedRootRecord;
  cFp69SkippedRoot?: DeterminizedPimcProbeV0SkippedRootRecord;
  cFp70SkippedRoot?: DeterminizedPimcActionAvailabilityV0SkippedRootRecord;
  cFp71SkippedRoot?: DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  sourceCfp71OutcomeRunId: string;
}): DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord => ({
  schemaVersion:
    "determinized-pimc-post-one-ply-branching-budget-v0-skipped-root-v1",
  probeRunId,
  probeVariant: "determinized-pimc-post-one-ply-branching-budget-v0",
  ...baseIdentityFromSkippedRoot(root),
  eligibilityStatus: "skipped_invalid_root",
  sourceCfp68ContractRunId: root.contractRunId,
  sourceCfp69ProbeRunId,
  sourceCfp70AvailabilityRunId,
  sourceCfp71OutcomeRunId,
  cfp69SkippedStatus:
    cFp69SkippedRoot?.eligibilityStatus ?? "skipped_invalid_root",
  cfp70SkippedStatus:
    cFp70SkippedRoot?.eligibilityStatus ?? "skipped_invalid_root",
  cfp71SkippedStatus:
    cFp71SkippedRoot?.eligibilityStatus ?? "skipped_invalid_root",
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

const buildBranchingRootRecord = ({
  probeRunId,
  eligibleRoot,
  cFp69Root,
  cFp70Root,
  cFp71Root,
  observedRoot,
  sourceCfp69ProbeRunId,
  sourceCfp70AvailabilityRunId,
  sourceCfp71OutcomeRunId,
}: {
  probeRunId: string;
  eligibleRoot: DeterminizedProbeContractEligibleRootRecord;
  cFp69Root?: DeterminizedPimcProbeV0RootRecord;
  cFp70Root?: DeterminizedPimcActionAvailabilityV0RootRecord;
  cFp71Root?: DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord;
  observedRoot?: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  sourceCfp71OutcomeRunId: string;
}): DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord => {
  const fallbackStatusCounts = emptyBranchingStatusCounts();
  const fallbackActorCounts = emptyPostActorCounts();
  const fallbackPhaseCounts = emptyPostPhaseCounts();
  const nextLegalMoveCounts = observedRoot?.nextLegalMoveCounts ?? [];
  const nextPublicActionCounts = observedRoot?.nextPublicActionCounts ?? [];
  const collisionCounts = observedRoot?.nextPublicActionCollisionCounts ?? [];
  const largestBucketSizes =
    observedRoot?.largestNextPublicActionBucketSizes ?? [];
  const targetExpansionCounts =
    observedRoot?.nextPublicActionTargetExpansionCounts ?? [];
  const completedCount = observedRoot?.completedBranchingPairCount ?? 0;
  const publicActionBudgetTotal = nextPublicActionCounts.reduce(
    (sum, count) => sum + count,
    0,
  );
  const budgetBucket =
    observedRoot?.branchingBudgetBucket ??
    rootBudgetBucket({
      failedOrDeferredBranchingPairCount:
        observedRoot?.failedOrDeferredBranchingPairCount ?? 0,
      onePlyExecutionDeferredPairCount:
        observedRoot?.onePlyExecutionDeferredPairCount ?? 0,
      maxNextPublicActionCount: maxValue(nextPublicActionCounts),
    });

  return {
    schemaVersion:
      "determinized-pimc-post-one-ply-branching-budget-v0-root-v1",
    probeRunId,
    ...baseIdentityFromEligibleRoot(eligibleRoot),
    sourceCfp68ContractRunId: eligibleRoot.contractRunId,
    sourceCfp69ProbeRunId,
    sourceCfp70AvailabilityRunId,
    sourceCfp71OutcomeRunId,
    eligibilityStatus: "eligible_valid_root",
    cfp69ProbeStatus: cFp69Root?.probeStatus ?? "contract_mismatch",
    cfp70AvailabilityStatus:
      cFp70Root?.probeStatus ?? "exact_state_rebuild_deferred",
    cfp71OutcomeStatus:
      cFp71Root?.probeStatus ?? "one_ply_execution_deferred",
    cfp69PublicActionCount: cFp69Root?.publicActionCount ?? 0,
    cfp70RootActionBucketCount: cFp70Root?.rootActionBucketCount ?? 0,
    cfp71PublicActionSamplePairCount:
      cFp71Root?.publicActionSamplePairCount ?? 0,
    cfp71CompletedPairCount: cFp71Root?.completedPairCount ?? 0,
    cfp71FailedOrDeferredPairCount:
      cFp71Root?.failedOrDeferredPairCount ?? 0,
    cfp71OutcomeDivergenceCount: cFp71Root?.outcomeDivergenceCount ?? 0,
    probeVariant: "determinized-pimc-post-one-ply-branching-budget-v0",
    probeMode: "post_one_ply_branching_budget_probe",
    sampleCountRequested:
      observedRoot?.sampleCountRequested ?? eligibleRoot.sampleCountRequested,
    sampleCountGenerated: observedRoot?.sampleCountGenerated ?? 0,
    sampleCountChecked: observedRoot?.sampleCountChecked ?? 0,
    sampleCountBranchingFailed: observedRoot?.sampleCountBranchingFailed ?? 0,
    rootPublicActionCount: observedRoot?.rootPublicActionCount ?? 0,
    firstPlyPublicActionSamplePairCount:
      observedRoot?.firstPlyPublicActionSamplePairCount ?? 0,
    completedBranchingPairCount: completedCount,
    failedOrDeferredBranchingPairCount:
      observedRoot?.failedOrDeferredBranchingPairCount ?? 0,
    sampleActionMissingPairCount:
      observedRoot?.sampleActionMissingPairCount ?? 0,
    moveCommandConversionFailedPairCount:
      observedRoot?.moveCommandConversionFailedPairCount ?? 0,
    engineCommandRejectedPairCount:
      observedRoot?.engineCommandRejectedPairCount ?? 0,
    engineCommandExceptionPairCount:
      observedRoot?.engineCommandExceptionPairCount ?? 0,
    actorResolutionFailedPairCount:
      observedRoot?.actorResolutionFailedPairCount ?? 0,
    legalMoveGenerationFailedPairCount:
      observedRoot?.legalMoveGenerationFailedPairCount ?? 0,
    publicActionAbstractionFailedPairCount:
      observedRoot?.publicActionAbstractionFailedPairCount ?? 0,
    onePlyExecutionDeferredPairCount:
      observedRoot?.onePlyExecutionDeferredPairCount ?? 0,
    branchingStatusCounts:
      observedRoot?.branchingStatusCounts ?? sortRecord(fallbackStatusCounts),
    postOnePlyActorCounts:
      observedRoot?.postOnePlyActorCounts ?? sortRecord(fallbackActorCounts),
    postOnePlyPhaseCounts:
      observedRoot?.postOnePlyPhaseCounts ?? sortRecord(fallbackPhaseCounts),
    nextLegalMoveCountMin: minValue(nextLegalMoveCounts),
    nextLegalMoveCountMax: maxValue(nextLegalMoveCounts),
    nextLegalMoveCountAverage: average(nextLegalMoveCounts),
    nextPublicActionCountMin: minValue(nextPublicActionCounts),
    nextPublicActionCountMax: maxValue(nextPublicActionCounts),
    nextPublicActionCountAverage: average(nextPublicActionCounts),
    nextPublicActionCollisionCountMin: minValue(collisionCounts),
    nextPublicActionCollisionCountMax: maxValue(collisionCounts),
    nextPublicActionCollisionCountAverage: average(collisionCounts),
    largestNextPublicActionBucketSizeMax: maxValue(largestBucketSizes),
    nextPublicActionTargetExpansionCountMin: minValue(targetExpansionCounts),
    nextPublicActionTargetExpansionCountMax: maxValue(targetExpansionCounts),
    nextPublicActionTargetExpansionCountAverage: average(targetExpansionCounts),
    postOnePlyPublicActionBudgetTotal: publicActionBudgetTotal,
    postOnePlyPublicActionBudgetAverage:
      completedCount <= 0
        ? 0
        : Number((publicActionBudgetTotal / completedCount).toFixed(3)),
    branchingBudgetBucket: budgetBucket,
    branchingRiskBucket: observedRoot?.branchingRiskBucket ?? budgetBucket,
    probeStatus: observedRoot?.probeStatus ?? "one_ply_execution_deferred",
  };
};

const buildSkipCounters = (
  skippedRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord[],
): DeterminizedPimcPostOnePlyBranchingBudgetV0SkipCounters => {
  const counters: DeterminizedPimcPostOnePlyBranchingBudgetV0SkipCounters = {
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
  counters: DeterminizedPimcPostOnePlyBranchingBudgetV0SkipCounters,
  skippedRootCount: number,
): DeterminizedPimcPostOnePlyBranchingBudgetV0SkipCounterPercentages => ({
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
  roots: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord[],
): DeterminizedPimcPostOnePlyBranchingBudgetV0SampleBudget => {
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
    totalFailedSampleCount += root.sampleCountBranchingFailed;
  });

  return {
    branchingRootCount: roots.length,
    requestedSamplesPerRootDistribution: sortRecord(
      requestedSamplesPerRootDistribution,
    ),
    totalRequestedSampleCount,
    totalGeneratedSampleCount,
    totalCheckedSampleCount,
    totalFailedSampleCount,
  };
};

const buildBranchingStatusSummary = (
  roots: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord[],
): DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatusSummary => {
  const probeStatusCounts = emptyBranchingStatusCounts();
  const branchingStatusCounts = emptyBranchingStatusCounts();
  const postOnePlyActorCounts = emptyPostActorCounts();
  const postOnePlyPhaseCounts = emptyPostPhaseCounts();
  const branchingBudgetBucketCounts = emptyBudgetBucketCounts();
  const branchingRiskBucketCounts = emptyBudgetBucketCounts();

  roots.forEach((root) => {
    addCount(probeStatusCounts, root.probeStatus);
    Object.entries(root.branchingStatusCounts).forEach(([status, count]) => {
      addCount(branchingStatusCounts, status, count);
    });
    Object.entries(root.postOnePlyActorCounts).forEach(([actor, count]) => {
      addCount(postOnePlyActorCounts, actor, count);
    });
    Object.entries(root.postOnePlyPhaseCounts).forEach(([phase, count]) => {
      addCount(postOnePlyPhaseCounts, phase, count);
    });
    addCount(branchingBudgetBucketCounts, root.branchingBudgetBucket);
    addCount(branchingRiskBucketCounts, root.branchingRiskBucket);
  });

  return {
    probeStatusCounts: sortRecord(probeStatusCounts),
    branchingStatusCounts: sortRecord(branchingStatusCounts),
    firstPlyPublicActionSamplePairTotal: roots.reduce(
      (sum, root) => sum + root.firstPlyPublicActionSamplePairCount,
      0,
    ),
    completedBranchingPairCount: roots.reduce(
      (sum, root) => sum + root.completedBranchingPairCount,
      0,
    ),
    failedOrDeferredBranchingPairCount: roots.reduce(
      (sum, root) => sum + root.failedOrDeferredBranchingPairCount,
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
    actorResolutionFailedPairCount: roots.reduce(
      (sum, root) => sum + root.actorResolutionFailedPairCount,
      0,
    ),
    legalMoveGenerationFailedPairCount: roots.reduce(
      (sum, root) => sum + root.legalMoveGenerationFailedPairCount,
      0,
    ),
    publicActionAbstractionFailedPairCount: roots.reduce(
      (sum, root) => sum + root.publicActionAbstractionFailedPairCount,
      0,
    ),
    onePlyExecutionDeferredPairCount: roots.reduce(
      (sum, root) => sum + root.onePlyExecutionDeferredPairCount,
      0,
    ),
    rootsWithAnyFailedOrDeferredPair: roots.filter(
      (root) => root.failedOrDeferredBranchingPairCount > 0,
    ).length,
    postOnePlyActorCounts: sortRecord(postOnePlyActorCounts),
    postOnePlyPhaseCounts: sortRecord(postOnePlyPhaseCounts),
    branchingBudgetBucketCounts: sortRecord(branchingBudgetBucketCounts),
    branchingRiskBucketCounts: sortRecord(branchingRiskBucketCounts),
  };
};

const mergeObservedAggregateCounts = (
  observed: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedAggregateCounts[],
) => {
  const merged: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedAggregateCounts =
    {
      branchingStatusCountsByFirstPlyPublicActionKind:
        emptyNestedPublicActionKindCounts(),
      actorCountsByFirstPlyPublicActionKind:
        emptyNestedPublicActionKindCounts(),
      budgetBucketCountsByFirstPlyPublicActionKind:
        emptyNestedPublicActionKindCounts(),
    };
  observed.forEach((counts) => {
    combineNestedCounts(
      merged.branchingStatusCountsByFirstPlyPublicActionKind,
      counts.branchingStatusCountsByFirstPlyPublicActionKind,
    );
    combineNestedCounts(
      merged.actorCountsByFirstPlyPublicActionKind,
      counts.actorCountsByFirstPlyPublicActionKind,
    );
    combineNestedCounts(
      merged.budgetBucketCountsByFirstPlyPublicActionKind,
      counts.budgetBucketCountsByFirstPlyPublicActionKind,
    );
  });
  return merged;
};

const buildBranchingAggregates = ({
  roots,
  observedAggregateCounts,
}: {
  roots: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord[];
  observedAggregateCounts: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedAggregateCounts;
}): DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingAggregates => {
  const completedPairCount = roots.reduce(
    (sum, root) => sum + root.completedBranchingPairCount,
    0,
  );
  const budgetTotal = roots.reduce(
    (sum, root) => sum + root.postOnePlyPublicActionBudgetTotal,
    0,
  );

  return {
    rootPublicActionCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.rootPublicActionCount),
    ),
    firstPlyPublicActionSamplePairCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.firstPlyPublicActionSamplePairCount),
    ),
    completedBranchingPairCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.completedBranchingPairCount),
    ),
    failedOrDeferredBranchingPairCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.failedOrDeferredBranchingPairCount),
    ),
    nextLegalMoveCountStats: buildSamplerReadinessCountStats(
      roots.flatMap((root) => [
        root.nextLegalMoveCountMin,
        root.nextLegalMoveCountMax,
      ]),
    ),
    nextPublicActionCountStats: buildSamplerReadinessCountStats(
      roots.flatMap((root) => [
        root.nextPublicActionCountMin,
        root.nextPublicActionCountMax,
      ]),
    ),
    nextPublicActionCollisionCountStats: buildSamplerReadinessCountStats(
      roots.flatMap((root) => [
        root.nextPublicActionCollisionCountMin,
        root.nextPublicActionCollisionCountMax,
      ]),
    ),
    largestNextPublicActionBucketSizeStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.largestNextPublicActionBucketSizeMax),
    ),
    nextPublicActionTargetExpansionCountStats: buildSamplerReadinessCountStats(
      roots.flatMap((root) => [
        root.nextPublicActionTargetExpansionCountMin,
        root.nextPublicActionTargetExpansionCountMax,
      ]),
    ),
    postOnePlyPublicActionBudgetTotal: budgetTotal,
    postOnePlyPublicActionBudgetAverage:
      completedPairCount <= 0
        ? 0
        : Number((budgetTotal / completedPairCount).toFixed(3)),
    aggregateBranchingStatusCountsByFirstPlyPublicActionKind:
      sortedNestedPublicActionKindCounts(
        observedAggregateCounts.branchingStatusCountsByFirstPlyPublicActionKind,
      ),
    aggregateActorCountsByFirstPlyPublicActionKind:
      sortedNestedPublicActionKindCounts(
        observedAggregateCounts.actorCountsByFirstPlyPublicActionKind,
      ),
    aggregateBudgetBucketCountsByFirstPlyPublicActionKind:
      sortedNestedPublicActionKindCounts(
        observedAggregateCounts.budgetBucketCountsByFirstPlyPublicActionKind,
      ),
  };
};

export const buildDeterminizedPimcPostOnePlyBranchingBudgetV0 = ({
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
  cFp71OutcomeSummary,
  cFp71OutcomeRoots,
  cFp71SkippedRoots,
  observedRoots,
  observedAggregateCounts,
  benchmark,
  sourceCfp68ArtifactReferences = [],
  sourceCfp69ArtifactReferences = [],
  sourceCfp70ArtifactReferences = [],
  sourceCfp71ArtifactReferences = [],
}: BuildDeterminizedPimcPostOnePlyBranchingBudgetV0Input): DeterminizedPimcPostOnePlyBranchingBudgetV0Result => {
  const observedKeyCounts = keyCounts(observedRoots);
  const eligibleKeyCounts = keyCounts(cFp68EligibleRoots);
  const cFp69ProbeKeyCounts = keyCounts(cFp69ProbeRoots);
  const cFp70AvailabilityKeyCounts = keyCounts(cFp70AvailabilityRoots);
  const cFp71OutcomeKeyCounts = keyCounts(cFp71OutcomeRoots);
  const cFp68SkippedKeyCounts = keyCounts(cFp68SkippedRoots);
  const cFp69SkippedKeyCounts = keyCounts(cFp69SkippedRoots);
  const cFp70SkippedKeyCounts = keyCounts(cFp70SkippedRoots);
  const cFp71SkippedKeyCounts = keyCounts(cFp71SkippedRoots);
  const observedByKey = firstRecordByKey(observedRoots);
  const cFp69ProbeByKey = firstRecordByKey(cFp69ProbeRoots);
  const cFp69SkippedByKey = firstRecordByKey(cFp69SkippedRoots);
  const cFp70AvailabilityByKey = firstRecordByKey(cFp70AvailabilityRoots);
  const cFp70SkippedByKey = firstRecordByKey(cFp70SkippedRoots);
  const cFp71OutcomeByKey = firstRecordByKey(cFp71OutcomeRoots);
  const cFp71SkippedByKey = firstRecordByKey(cFp71SkippedRoots);
  const eligibleKeys = new Set(
    cFp68EligibleRoots.map((root) =>
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  );
  const cFp68SkippedKeys = new Set(
    cFp68SkippedRoots.map((root) =>
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  );
  const cFp69ProbeKeys = new Set(
    cFp69ProbeRoots.map((root) =>
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  );
  const cFp69SkippedKeys = new Set(
    cFp69SkippedRoots.map((root) =>
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  );
  const cFp70AvailabilityKeys = new Set(
    cFp70AvailabilityRoots.map((root) =>
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  );
  const cFp70SkippedKeys = new Set(
    cFp70SkippedRoots.map((root) =>
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  );
  const cFp71OutcomeKeys = new Set(
    cFp71OutcomeRoots.map((root) =>
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  );
  const cFp71SkippedKeys = new Set(
    cFp71SkippedRoots.map((root) =>
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  );
  const contractKeys = new Set([
    ...eligibleKeys,
    ...cFp68SkippedKeys,
    ...cFp69ProbeKeys,
    ...cFp69SkippedKeys,
    ...cFp70AvailabilityKeys,
    ...cFp70SkippedKeys,
    ...cFp71OutcomeKeys,
    ...cFp71SkippedKeys,
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
  const sourceCfp71OutcomeRunId =
    cFp71OutcomeSummary.probeRunId ??
    cFp71OutcomeRoots[0]?.probeRunId ??
    cFp71SkippedRoots[0]?.probeRunId ??
    `${suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71`;

  const skippedRoots = cFp68SkippedRoots.map((root) =>
    buildSkippedBranchingRecord({
      probeRunId,
      root,
      cFp69SkippedRoot: cFp69SkippedByKey.get(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
      cFp70SkippedRoot: cFp70SkippedByKey.get(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
      cFp71SkippedRoot: cFp71SkippedByKey.get(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
      sourceCfp69ProbeRunId,
      sourceCfp70AvailabilityRunId,
      sourceCfp71OutcomeRunId,
    }),
  );
  const branchingRoots = cFp68EligibleRoots.map((eligibleRoot) =>
    buildBranchingRootRecord({
      probeRunId,
      eligibleRoot,
      cFp69Root: cFp69ProbeByKey.get(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(eligibleRoot),
      ),
      cFp70Root: cFp70AvailabilityByKey.get(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(eligibleRoot),
      ),
      cFp71Root: cFp71OutcomeByKey.get(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(eligibleRoot),
      ),
      observedRoot: observedByKey.get(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(eligibleRoot),
      ),
      sourceCfp69ProbeRunId,
      sourceCfp70AvailabilityRunId,
      sourceCfp71OutcomeRunId,
    }),
  );
  const branchingKeys = new Set(
    branchingRoots.map((root) =>
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  );

  const cFp68ContractNotProbeReady =
    contractSummary.contractStatus === "probe_ready" ? 0 : 1;
  const eligibleRootsNotObserved = cFp68EligibleRoots.filter(
    (root) =>
      !observedByKey.has(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
  ).length;
  const observedRootsNotInCfp68Cfp69Cfp70Cfp71Contract = observedRoots.filter(
    (root) =>
      !contractKeys.has(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
  ).length;
  const skippedRootsIncorrectlyProbed = cFp68SkippedRoots.filter((root) =>
    branchingKeys.has(
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    ),
  ).length;
  const cfp68Cfp69EligibleRootCountDelta =
    cFp68EligibleRoots.length - cFp69ProbeRoots.length;
  const cfp68Cfp70AvailabilityRootCountDelta =
    cFp68EligibleRoots.length - cFp70AvailabilityRoots.length;
  const cfp68Cfp71OutcomeRootCountDelta =
    cFp68EligibleRoots.length - cFp71OutcomeRoots.length;
  const cfp69Cfp70AvailabilityRootCountDelta =
    cFp69ProbeRoots.length - cFp70AvailabilityRoots.length;
  const cfp69Cfp71OutcomeRootCountDelta =
    cFp69ProbeRoots.length - cFp71OutcomeRoots.length;
  const cfp70Cfp71OutcomeRootCountDelta =
    cFp70AvailabilityRoots.length - cFp71OutcomeRoots.length;
  const cfp68Cfp69SkippedRootCountDelta =
    cFp68SkippedRoots.length - cFp69SkippedRoots.length;
  const cfp68Cfp70SkippedRootCountDelta =
    cFp68SkippedRoots.length - cFp70SkippedRoots.length;
  const cfp68Cfp71SkippedRootCountDelta =
    cFp68SkippedRoots.length - cFp71SkippedRoots.length;
  const cfp69Cfp70SkippedRootCountDelta =
    cFp69SkippedRoots.length - cFp70SkippedRoots.length;
  const cfp69Cfp71SkippedRootCountDelta =
    cFp69SkippedRoots.length - cFp71SkippedRoots.length;
  const cfp70Cfp71SkippedRootCountDelta =
    cFp70SkippedRoots.length - cFp71SkippedRoots.length;
  const cfp69ProbeRootsMissingCfp68EligibleRoot = cFp69ProbeRoots.filter(
    (root) =>
      !eligibleKeys.has(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
  ).length;
  const cfp70AvailabilityRootsMissingCfp68EligibleRoot =
    cFp70AvailabilityRoots.filter(
      (root) =>
        !eligibleKeys.has(
          buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
        ),
    ).length;
  const cfp71OutcomeRootsMissingCfp68EligibleRoot = cFp71OutcomeRoots.filter(
    (root) =>
      !eligibleKeys.has(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
  ).length;
  const cfp69SkippedRootsMissingCfp68SkippedRoot = cFp69SkippedRoots.filter(
    (root) =>
      !cFp68SkippedKeys.has(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
  ).length;
  const cfp70SkippedRootsMissingCfp68SkippedRoot = cFp70SkippedRoots.filter(
    (root) =>
      !cFp68SkippedKeys.has(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
  ).length;
  const cfp71SkippedRootsMissingCfp68SkippedRoot = cFp71SkippedRoots.filter(
    (root) =>
      !cFp68SkippedKeys.has(
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
  ).length;
  const cfp68Cfp69SampleCountMismatchRoots = cFp68EligibleRoots.filter((root) => {
    const cfp69 = cFp69ProbeByKey.get(
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    );
    return (
      !cfp69 ||
      cfp69.sampleCountRequested !== root.sampleCountRequested ||
      cfp69.sampleCountValid !== root.sampleCountValid
    );
  }).length;
  const cfp68Cfp70SampleCountMismatchRoots = cFp68EligibleRoots.filter((root) => {
    const cfp70 = cFp70AvailabilityByKey.get(
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    );
    return (
      !cfp70 ||
      cfp70.sampleCountRequested !== root.sampleCountRequested ||
      cfp70.sampleCountGenerated !== root.sampleCountGenerated ||
      cfp70.sampleCountChecked !== root.sampleCountValid
    );
  }).length;
  const cfp68Cfp71SampleCountMismatchRoots = cFp68EligibleRoots.filter((root) => {
    const cfp71 = cFp71OutcomeByKey.get(
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
    );
    return (
      !cfp71 ||
      cfp71.sampleCountRequested !== root.sampleCountRequested ||
      cfp71.sampleCountGenerated !== root.sampleCountGenerated ||
      cfp71.sampleCountChecked !== root.sampleCountValid
    );
  }).length;
  const cfp69Cfp70Cfp71PublicActionCountMismatchRoots =
    cFp68EligibleRoots.filter((root) => {
      const key = buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root);
      const cfp69 = cFp69ProbeByKey.get(key);
      const cfp70 = cFp70AvailabilityByKey.get(key);
      const cfp71 = cFp71OutcomeByKey.get(key);
      return (
        !cfp69 ||
        !cfp70 ||
        !cfp71 ||
        cfp69.publicActionCount !== cfp70.rootActionBucketCount ||
        cfp69.publicActionCount !== cfp71.rootPublicActionCount
      );
    }).length;
  const cfp70RootsWithAvailabilityDisagreement = cFp70AvailabilityRoots.filter(
    (root) =>
      root.probeStatus !== "completed" ||
      !root.allRootActionsAvailableInAllSamples ||
      root.availabilityDisagreementCount > 0,
  ).length;
  const cfp71RootsWithFailedOrDeferredPairs = cFp71OutcomeRoots.filter(
    (root) => root.probeStatus !== "completed" || root.failedOrDeferredPairCount > 0,
  ).length;
  const cfp71RootsWithOutcomeDivergence = cFp71OutcomeRoots.filter(
    (root) => root.outcomeDivergenceCount > 0,
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
    observedRootsNotInCfp68Cfp69Cfp70Cfp71Contract,
    skippedRootsIncorrectlyProbed,
    duplicateKeyCount(observedKeyCounts),
    duplicateKeyCount(eligibleKeyCounts),
    duplicateKeyCount(cFp69ProbeKeyCounts),
    duplicateKeyCount(cFp70AvailabilityKeyCounts),
    duplicateKeyCount(cFp71OutcomeKeyCounts),
    duplicateKeyCount(cFp68SkippedKeyCounts),
    duplicateKeyCount(cFp69SkippedKeyCounts),
    duplicateKeyCount(cFp70SkippedKeyCounts),
    duplicateKeyCount(cFp71SkippedKeyCounts),
    Math.abs(cfp68Cfp69EligibleRootCountDelta),
    Math.abs(cfp68Cfp70AvailabilityRootCountDelta),
    Math.abs(cfp68Cfp71OutcomeRootCountDelta),
    Math.abs(cfp69Cfp70AvailabilityRootCountDelta),
    Math.abs(cfp69Cfp71OutcomeRootCountDelta),
    Math.abs(cfp70Cfp71OutcomeRootCountDelta),
    Math.abs(cfp68Cfp69SkippedRootCountDelta),
    Math.abs(cfp68Cfp70SkippedRootCountDelta),
    Math.abs(cfp68Cfp71SkippedRootCountDelta),
    Math.abs(cfp69Cfp70SkippedRootCountDelta),
    Math.abs(cfp69Cfp71SkippedRootCountDelta),
    Math.abs(cfp70Cfp71SkippedRootCountDelta),
    cfp69ProbeRootsMissingCfp68EligibleRoot,
    cfp70AvailabilityRootsMissingCfp68EligibleRoot,
    cfp71OutcomeRootsMissingCfp68EligibleRoot,
    cfp69SkippedRootsMissingCfp68SkippedRoot,
    cfp70SkippedRootsMissingCfp68SkippedRoot,
    cfp71SkippedRootsMissingCfp68SkippedRoot,
    cfp68Cfp69SampleCountMismatchRoots,
    cfp68Cfp70SampleCountMismatchRoots,
    cfp68Cfp71SampleCountMismatchRoots,
    cfp69Cfp70Cfp71PublicActionCountMismatchRoots,
    cfp70RootsWithAvailabilityDisagreement,
    cfp71RootsWithFailedOrDeferredPairs,
    cfp71RootsWithOutcomeDivergence,
    cfp68FingerprintMismatchObservedRoots,
  ];
  const sourceConsistencyStatus: DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus =
    sourceConsistencyValues.every((count) => count === 0)
      ? "probe_ready"
      : "not_probe_ready";
  const sourceConsistency: DeterminizedPimcPostOnePlyBranchingBudgetV0SourceConsistency =
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
      cFp71OutcomeRootsRead: cFp71OutcomeRoots.length,
      cFp71SkippedRootsRead: cFp71SkippedRoots.length,
      benchmarkObservedRootsRead: observedRoots.length,
      eligibleRootsNotObserved,
      observedRootsNotInCfp68Cfp69Cfp70Cfp71Contract,
      skippedRootsIncorrectlyProbed,
      duplicateObservedRootKeys: duplicateKeyCount(observedKeyCounts),
      duplicateCfp68EligibleRootKeys: duplicateKeyCount(eligibleKeyCounts),
      duplicateCfp69ProbeRootKeys: duplicateKeyCount(cFp69ProbeKeyCounts),
      duplicateCfp70AvailabilityRootKeys: duplicateKeyCount(
        cFp70AvailabilityKeyCounts,
      ),
      duplicateCfp71OutcomeRootKeys: duplicateKeyCount(cFp71OutcomeKeyCounts),
      duplicateSkippedRootKeys:
        duplicateKeyCount(cFp68SkippedKeyCounts) +
        duplicateKeyCount(cFp69SkippedKeyCounts) +
        duplicateKeyCount(cFp70SkippedKeyCounts) +
        duplicateKeyCount(cFp71SkippedKeyCounts),
      cfp68Cfp69EligibleRootCountDelta,
      cfp68Cfp70AvailabilityRootCountDelta,
      cfp68Cfp71OutcomeRootCountDelta,
      cfp69Cfp70AvailabilityRootCountDelta,
      cfp69Cfp71OutcomeRootCountDelta,
      cfp70Cfp71OutcomeRootCountDelta,
      cfp68Cfp69SkippedRootCountDelta,
      cfp68Cfp70SkippedRootCountDelta,
      cfp68Cfp71SkippedRootCountDelta,
      cfp69Cfp70SkippedRootCountDelta,
      cfp69Cfp71SkippedRootCountDelta,
      cfp70Cfp71SkippedRootCountDelta,
      cfp69ProbeRootsMissingCfp68EligibleRoot,
      cfp70AvailabilityRootsMissingCfp68EligibleRoot,
      cfp71OutcomeRootsMissingCfp68EligibleRoot,
      cfp69SkippedRootsMissingCfp68SkippedRoot,
      cfp70SkippedRootsMissingCfp68SkippedRoot,
      cfp71SkippedRootsMissingCfp68SkippedRoot,
      cfp68Cfp69SampleCountMismatchRoots,
      cfp68Cfp70SampleCountMismatchRoots,
      cfp68Cfp71SampleCountMismatchRoots,
      cfp69Cfp70Cfp71PublicActionCountMismatchRoots,
      cfp70RootsWithAvailabilityDisagreement,
      cfp71RootsWithFailedOrDeferredPairs,
      cfp71RootsWithOutcomeDivergence,
      cfp68FingerprintMismatchObservedRoots,
    };

  const skipCounters = buildSkipCounters(skippedRoots);
  const skippedRootCount = skippedRoots.length;
  const aggregateCounts =
    observedAggregateCounts ??
    mergeObservedAggregateCounts(
      observedRoots.map(() => ({
        branchingStatusCountsByFirstPlyPublicActionKind:
          emptyNestedPublicActionKindCounts(),
        actorCountsByFirstPlyPublicActionKind:
          emptyNestedPublicActionKindCounts(),
        budgetBucketCountsByFirstPlyPublicActionKind:
          emptyNestedPublicActionKindCounts(),
      })),
    );

  return {
    probeRunId,
    suiteId,
    sourceBenchmarkSuiteId: contractSummary.sourceBenchmarkSuiteId,
    benchmark,
    branchingRoots,
    skippedRoots,
    summary: {
      schemaVersion:
        "determinized-pimc-post-one-ply-branching-budget-v0-summary-v1",
      probeRunId,
      suiteId,
      sourceBenchmarkSuiteId: contractSummary.sourceBenchmarkSuiteId,
      probeVariant: "determinized-pimc-post-one-ply-branching-budget-v0",
      probeMode: "post_one_ply_branching_budget_probe",
      probeReadinessStatus: sourceConsistencyStatus,
      sourceCfp68ContractRunId: contractSummary.contractRunId,
      sourceCfp69ProbeRunId,
      sourceCfp70AvailabilityRunId,
      sourceCfp71OutcomeRunId,
      sourceCfp68ArtifactReferences,
      sourceCfp69ArtifactReferences,
      sourceCfp70ArtifactReferences,
      sourceCfp71ArtifactReferences,
      totalCfp68RootCount: contractSummary.totalCfp61RootCount,
      eligibleRootCount: cFp68EligibleRoots.length,
      branchingRootCount: branchingRoots.length,
      skippedRootCount,
      skippedRootPercentage: percentage(
        skippedRootCount,
        contractSummary.totalCfp61RootCount,
      ),
      matchCount: contractSummary.matchCount,
      sourceConsistency,
      sampleBudget: buildSampleBudget(branchingRoots),
      branchingStatus: buildBranchingStatusSummary(branchingRoots),
      branchingAggregates: buildBranchingAggregates({
        roots: branchingRoots,
        observedAggregateCounts: aggregateCounts,
      }),
      skipCounters,
      skipCounterPercentages: buildSkipCounterPercentages(
        skipCounters,
        skippedRootCount,
      ),
      explicitNonClaims:
        DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_V0_NON_CLAIMS,
      hiddenInfoSafetyNote:
        DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_V0_HIDDEN_INFO_SAFETY_NOTE,
      cFp73Recommendation:
        DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_V0_CFP73_RECOMMENDATION,
    },
  };
};

export const runDeterminizedPimcPostOnePlyBranchingBudgetV0 = (
  input: RunDeterminizedPimcPostOnePlyBranchingBudgetV0Input,
): DeterminizedPimcPostOnePlyBranchingBudgetV0Result => {
  const requestedSuiteId =
    input.suiteId ?? input.suite?.id ?? input.contractSummary.suiteId;
  const probeRunId =
    input.probeRunId ??
    defaultDeterminizedPimcPostOnePlyBranchingBudgetV0RunId(requestedSuiteId);
  const samplerRunId = input.contractSummary.sourceSamplerRunIds.materialization;
  const cFp68EligibleByKey = firstRecordByKey(input.cFp68EligibleRoots);
  const cFp69ProbeByKey = firstRecordByKey(input.cFp69ProbeRoots);
  const cFp70AvailabilityByKey = firstRecordByKey(input.cFp70AvailabilityRoots);
  const cFp71OutcomeByKey = firstRecordByKey(input.cFp71OutcomeRoots);
  const observedRoots: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot[] =
    [];
  const observedAggregateCounts: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedAggregateCounts[] =
    [];
  const memoryStore = new Map<string, SamplerPublicTransferMemoryState>();

  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: probeRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      const key = buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey({
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
          cfp71OutcomeStatus: "one_ply_execution_deferred",
          cfp71PublicActionSamplePairCount: 0,
          cfp71CompletedPairCount: 0,
          cfp71FailedOrDeferredPairCount: 0,
          cfp71OutcomeDivergenceCount: 0,
          sampleCountRequested: 0,
          sampleCountGenerated: 0,
          sampleCountChecked: 0,
          sampleCountBranchingFailed: 0,
          rootPublicActionCount: 0,
          firstPlyPublicActionSamplePairCount: 0,
          completedBranchingPairCount: 0,
          failedOrDeferredBranchingPairCount: 0,
          sampleActionMissingPairCount: 0,
          moveCommandConversionFailedPairCount: 0,
          engineCommandRejectedPairCount: 0,
          engineCommandExceptionPairCount: 0,
          actorResolutionFailedPairCount: 0,
          legalMoveGenerationFailedPairCount: 0,
          publicActionAbstractionFailedPairCount: 0,
          onePlyExecutionDeferredPairCount: 0,
          branchingStatusCounts: sortRecord(emptyBranchingStatusCounts()),
          postOnePlyActorCounts: sortRecord(emptyPostActorCounts()),
          postOnePlyPhaseCounts: sortRecord(emptyPostPhaseCounts()),
          nextLegalMoveCounts: [],
          nextPublicActionCounts: [],
          nextPublicActionCollisionCounts: [],
          largestNextPublicActionBucketSizes: [],
          nextPublicActionTargetExpansionCounts: [],
          branchingBudgetBucket: "deferred",
          branchingRiskBucket: "deferred",
          probeStatus: "one_ply_execution_deferred",
        });
        return;
      }

      const memory = getSamplerPublicTransferMemoryForRoot(memoryStore, root);
      const observed =
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot({
          input: root,
          samplerRunId,
          memory,
          cFp68EligibleRoot,
          cFp69ProbeRoot: cFp69ProbeByKey.get(key),
          cFp70AvailabilityRoot: cFp70AvailabilityByKey.get(key),
          cFp71OutcomeRoot: cFp71OutcomeByKey.get(key),
        });
      observedRoots.push(observed.observedRoot);
      observedAggregateCounts.push(observed.aggregateCounts);
    },
  });

  return buildDeterminizedPimcPostOnePlyBranchingBudgetV0({
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
    cFp71OutcomeSummary: input.cFp71OutcomeSummary,
    cFp71OutcomeRoots: input.cFp71OutcomeRoots,
    cFp71SkippedRoots: input.cFp71SkippedRoots,
    observedRoots,
    observedAggregateCounts: mergeObservedAggregateCounts(observedAggregateCounts),
    benchmark,
    sourceCfp68ArtifactReferences: input.sourceCfp68ArtifactReferences,
    sourceCfp69ArtifactReferences: input.sourceCfp69ArtifactReferences,
    sourceCfp70ArtifactReferences: input.sourceCfp70ArtifactReferences,
    sourceCfp71ArtifactReferences: input.sourceCfp71ArtifactReferences,
  });
};
