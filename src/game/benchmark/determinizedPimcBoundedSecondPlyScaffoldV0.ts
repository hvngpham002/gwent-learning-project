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
  classifyDeterminizedPimcOnePlyOutcomeSkeletonV0Transition,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0Summary,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0TransitionKind,
} from "./determinizedPimcOnePlyOutcomeSkeletonV0";
import {
  resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0PostActorLabel,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0PostPhaseLabel,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0Summary,
} from "./determinizedPimcPostOnePlyBranchingBudgetV0";
import {
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookReadinessStatus,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootRecord,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootRecord,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummary,
} from "./determinizedPimcPostOnePlyBranchingBudgetCasebook";
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
  type PublicSearchActionKind,
  type PublicActionTargetKind,
  type PublicActionTargetSide,
} from "./samplerReadiness";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSuite,
} from "./types";

export type DeterminizedPimcBoundedSecondPlyScaffoldV0RootSchemaVersion =
  "determinized-pimc-bounded-second-ply-scaffold-v0-root-v1";
export type DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetRootSchemaVersion =
  "determinized-pimc-bounded-second-ply-scaffold-v0-over-budget-root-v1";
export type DeterminizedPimcBoundedSecondPlyScaffoldV0SkippedRootSchemaVersion =
  "determinized-pimc-bounded-second-ply-scaffold-v0-skipped-root-v1";
export type DeterminizedPimcBoundedSecondPlyScaffoldV0SummarySchemaVersion =
  "determinized-pimc-bounded-second-ply-scaffold-v0-summary-v1";

export type DeterminizedPimcBoundedSecondPlyScaffoldV0ReadinessStatus =
  | "ready"
  | "ready_with_over_budget_skips"
  | "not_ready";

export type DeterminizedPimcBoundedSecondPlyScaffoldV0CapStatus =
  | "in_cap"
  | "over_budget";

export type DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetReason =
  | "root_second_ply_pair_cap_exceeded"
  | "root_public_action_cap_exceeded"
  | "post_one_ply_public_action_cap_exceeded"
  | "sample_count_cap_exceeded"
  | "source_consistency_not_ready";

export type DeterminizedPimcBoundedSecondPlyScaffoldV0ExecutionStatus =
  | "completed"
  | "completed_with_failures"
  | "deferred"
  | "not_ready";

export type DeterminizedPimcBoundedSecondPlyScaffoldV0OutcomeRiskBucket =
  | "none"
  | "some_failed_or_deferred"
  | "source_mismatch"
  | "cap_mismatch";

export type DeterminizedPimcBoundedSecondPlyScaffoldV0FailureReason =
  | "first_ply_sample_action_missing"
  | "first_ply_move_conversion_failed"
  | "first_ply_engine_rejected"
  | "first_ply_engine_exception"
  | "second_ply_actor_resolution_failed"
  | "second_ply_legal_move_generation_failed"
  | "second_ply_public_action_abstraction_failed"
  | "second_ply_move_conversion_failed"
  | "second_ply_engine_rejected"
  | "second_ply_engine_exception"
  | "sampled_root_rebuild_deferred";

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy {
  version: "cfp74-default-root-bounded-v1";
  secondPlyPairCapPerRoot: number;
  rootPublicActionCap: number;
  postOnePlyPublicActionCapPerState: number;
  sampleCountCapPerRoot: number;
  robustTotalPlannedSecondPlyPairSoftCap: number;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity {
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorGroupId?: string;
  mirrorIndex?: 0 | 1;
  step: number;
  decisionIndex: number;
  phase: MatchPhase | string;
  round: number;
  seatId: SeatId | string;
  policyId: string;
  faction: Exclude<CatalogFaction, "neutral"> | string;
  deckPresetId: string;
  rootPublicFingerprint: string;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0Cfp72CapSourceFields {
  rootPublicActionCount: number;
  firstPlyPublicActionSamplePairCount: number;
  postOnePlyPublicActionBudgetTotal: number;
  postOnePlyPublicActionBudgetAverage: number;
  nextPublicActionCountMax: number;
  largestNextPublicActionBucketSizeMax: number;
  nextPublicActionTargetExpansionCountMax: number;
  branchingBudgetBucket: string;
  branchingRiskBucket: string;
  postOnePlyActorCounts: Record<string, number>;
  postOnePlyPhaseCounts: Record<string, number>;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0CasebookLabels {
  casebookPresence: "in_casebook" | "not_in_casebook";
  primaryCasebookLabel: string;
  budgetPressureLabel: string;
  transitionContextLabel: string;
  cFp74ReadinessHint: string;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot
  extends DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity {
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  plannedSecondPlyPairCount: number;
  completedSecondPlyPairCount: number;
  failedOrDeferredSecondPlyPairCount: number;
  secondPlyExecutionStatus: DeterminizedPimcBoundedSecondPlyScaffoldV0ExecutionStatus;
  secondPlyFailureReasonCounts: Record<string, number>;
  secondPlyTransitionKindCounts: Record<string, number>;
  postSecondPlyPhaseCounts: Record<string, number>;
  postSecondPlyActorCounts: Record<string, number>;
  secondPlyPublicActionKindCounts: Record<string, number>;
  secondPlyTargetKindCounts: Record<string, number>;
  secondPlyTargetSideCounts: Record<string, number>;
  secondPlyOutcomeRiskBucket: DeterminizedPimcBoundedSecondPlyScaffoldV0OutcomeRiskBucket;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0RootRecord
  extends DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity,
    DeterminizedPimcBoundedSecondPlyScaffoldV0Cfp72CapSourceFields,
    DeterminizedPimcBoundedSecondPlyScaffoldV0CasebookLabels {
  schemaVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0RootSchemaVersion;
  scaffoldRunId: string;
  sourceCfp72RunId: string;
  sourceCfp73RunId: string;
  capPolicyVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy["version"];
  secondPlyPairCapPerRoot: number;
  rootPublicActionCap: number;
  postOnePlyPublicActionCapPerState: number;
  sampleCountCapPerRoot: number;
  capStatus: "in_cap";
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  plannedSecondPlyPairCount: number;
  completedSecondPlyPairCount: number;
  failedOrDeferredSecondPlyPairCount: number;
  secondPlyExecutionStatus: DeterminizedPimcBoundedSecondPlyScaffoldV0ExecutionStatus;
  secondPlyFailureReasonCounts: Record<string, number>;
  secondPlyTransitionKindCounts: Record<string, number>;
  postSecondPlyPhaseCounts: Record<string, number>;
  postSecondPlyActorCounts: Record<string, number>;
  secondPlyPublicActionKindCounts: Record<string, number>;
  secondPlyTargetKindCounts: Record<string, number>;
  secondPlyTargetSideCounts: Record<string, number>;
  secondPlyOutcomeRiskBucket: DeterminizedPimcBoundedSecondPlyScaffoldV0OutcomeRiskBucket;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetRootRecord
  extends DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity,
    DeterminizedPimcBoundedSecondPlyScaffoldV0Cfp72CapSourceFields,
    DeterminizedPimcBoundedSecondPlyScaffoldV0CasebookLabels {
  schemaVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetRootSchemaVersion;
  scaffoldRunId: string;
  sourceCfp72RunId: string;
  sourceCfp73RunId: string;
  capPolicyVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy["version"];
  secondPlyPairCapPerRoot: number;
  rootPublicActionCap: number;
  postOnePlyPublicActionCapPerState: number;
  sampleCountCapPerRoot: number;
  capStatus: "over_budget";
  overBudgetReason: DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetReason;
  overBudgetReasonFlags: Record<DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetReason, boolean>;
  plannedSecondPlyPairCount: number;
  plannedSecondPlyPairCountOverCap: number;
  skipCounterDimensions: Record<string, string | number>;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0SkippedRootRecord
  extends DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity {
  schemaVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0SkippedRootSchemaVersion;
  scaffoldRunId: string;
  sourceCfp72RunId: string;
  sourceCfp73RunId: string;
  eligibilityStatus: "skipped_invalid_root";
  skipReason: string;
  invalidReason: string;
  cFp67PrimaryClassification?: string;
  cFp67TransferClassification?: string;
  cFp67PersistentDeficitClassification?: string;
  cFp67DeficitSizeClassification?: string;
  cFp67ProvenanceLabel?: string;
  priorDeficitCount?: number;
  publicTransferMemoryVisibleCardCount?: number;
  publicTransferKnownHiddenHandCount?: number;
  publicTransferKnownHiddenDeckCount?: number;
  publicTransferAdjustmentCount?: number;
  publicTransferUncoveredDeficitCount?: number;
  skipStage: "inherited_sampler_skip";
  skipCounterDimensions: Record<string, string | number>;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0SourceConsistency {
  status: "ready" | "not_ready";
  cFp68ContractStatus: string;
  cFp72ProbeReadinessStatus: DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus;
  cFp73CasebookReadinessStatus: DeterminizedPimcPostOnePlyBranchingBudgetCasebookReadinessStatus;
  cFp68EligibleRootsRead: number;
  cFp68SkippedRootsRead: number;
  cFp69ProbeRootsRead: number;
  cFp69SkippedRootsRead: number;
  cFp70AvailabilityRootsRead: number;
  cFp70SkippedRootsRead: number;
  cFp71OutcomeRootsRead: number;
  cFp71SkippedRootsRead: number;
  cFp72BranchingRootsRead: number;
  cFp72SkippedRootsRead: number;
  cFp73CasebookRootsRead: number;
  cFp73SkippedRootsRead: number;
  duplicateCfp68EligibleRootKeys: number;
  duplicateCfp68SkippedRootKeys: number;
  duplicateCfp69ProbeRootKeys: number;
  duplicateCfp69SkippedRootKeys: number;
  duplicateCfp70AvailabilityRootKeys: number;
  duplicateCfp70SkippedRootKeys: number;
  duplicateCfp71OutcomeRootKeys: number;
  duplicateCfp71SkippedRootKeys: number;
  duplicateCfp72BranchingRootKeys: number;
  duplicateCfp72SkippedRootKeys: number;
  duplicateCfp73CasebookRootKeys: number;
  duplicateCfp73SkippedRootKeys: number;
  cfp68Cfp69EligibleRootCountDelta: number;
  cfp68Cfp70AvailabilityRootCountDelta: number;
  cfp68Cfp71OutcomeRootCountDelta: number;
  cfp68Cfp72BranchingRootCountDelta: number;
  cfp68Cfp69SkippedRootCountDelta: number;
  cfp68Cfp70SkippedRootCountDelta: number;
  cfp68Cfp71SkippedRootCountDelta: number;
  cfp68Cfp72SkippedRootCountDelta: number;
  cfp72BranchingRootCountDeltaFromSummary: number;
  cfp72SkippedRootCountDeltaFromSummary: number;
  cfp73CasebookRootCountDeltaFromSummary: number;
  cfp73SkippedRootCountDeltaFromSummary: number;
  cfp69ProbeRootsMissingCfp68EligibleRoot: number;
  cfp70AvailabilityRootsMissingCfp68EligibleRoot: number;
  cfp71OutcomeRootsMissingCfp68EligibleRoot: number;
  cfp72BranchingRootsMissingCfp68EligibleRoot: number;
  cfp68EligibleRootsMissingCfp72BranchingRoot: number;
  cfp73CasebookRootsMissingCfp72BranchingRoot: number;
  cfp69SkippedRootsMissingCfp68SkippedRoot: number;
  cfp70SkippedRootsMissingCfp68SkippedRoot: number;
  cfp71SkippedRootsMissingCfp68SkippedRoot: number;
  cfp72SkippedRootsMissingCfp68SkippedRoot: number;
  cfp73SkippedRootsMissingCfp72SkippedRoot: number;
  cfp72RootsWithFailedOrDeferredPairs: number;
  cfp72RootsWithProbeStatusAnomaly: number;
  cfp72RootsWithPlannedPairScalarMismatch: number;
  inheritedSkippedRootsProbed: number;
  inCapRootsNotObserved: number;
  sourceArtifactHashMisses: number;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0Summary {
  schemaVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0SummarySchemaVersion;
  scaffoldRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp68RunId: string;
  sourceCfp69RunId: string;
  sourceCfp70RunId: string;
  sourceCfp71RunId: string;
  sourceCfp72RunId: string;
  sourceCfp73RunId: string;
  sourceArtifactReferences: Record<string, readonly DeterminizedProbeContractSourceArtifactReference[]>;
  capPolicy: DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy;
  sourceConsistency: DeterminizedPimcBoundedSecondPlyScaffoldV0SourceConsistency;
  scaffoldReadinessStatus: DeterminizedPimcBoundedSecondPlyScaffoldV0ReadinessStatus;
  totalCfp72RootCount: number;
  branchingRootCount: number;
  inCapRootCount: number;
  overBudgetRootCount: number;
  inheritedSkippedRootCount: number;
  inheritedSkippedRootPercentage: number;
  overBudgetRootPercentageOfBranchingRoots: number;
  plannedSecondPlyPairCountTotal: number;
  plannedSecondPlyPairCountInCap: number;
  plannedSecondPlyPairCountOverBudget: number;
  completedSecondPlyPairCount: number;
  failedOrDeferredSecondPlyPairCount: number;
  secondPlyExecutionStatusCounts: Record<string, number>;
  secondPlyFailureReasonCounts: Record<string, number>;
  secondPlyTransitionKindCounts: Record<string, number>;
  postSecondPlyPhaseCounts: Record<string, number>;
  postSecondPlyActorCounts: Record<string, number>;
  secondPlyPublicActionKindCounts: Record<string, number>;
  secondPlyTargetKindCounts: Record<string, number>;
  secondPlyTargetSideCounts: Record<string, number>;
  secondPlyOutcomeRiskBucketCounts: Record<string, number>;
  overBudgetReasonCounts: Record<string, number>;
  capStatusCounts: Record<string, number>;
  casebookPresenceCounts: Record<string, number>;
  primaryCasebookLabelCounts: Record<string, number>;
  budgetPressureLabelCounts: Record<string, number>;
  transitionContextLabelCounts: Record<string, number>;
  cFp74ReadinessHintCounts: Record<string, number>;
  labelCountsByCapStatus: Record<string, Record<string, number>>;
  countsBySuite: Record<string, number>;
  countsByPhase: Record<string, number>;
  countsByRound: Record<string, number>;
  countsByPolicy: Record<string, number>;
  countsByFaction: Record<string, number>;
  countsByDeckPreset: Record<string, number>;
  countsByMatchup: Record<string, number>;
  inheritedSkipCounters: Record<string, Record<string, number>>;
  overBudgetCounters: {
    byPhase: Record<string, number>;
    byRound: Record<string, number>;
    byPolicy: Record<string, number>;
    byFaction: Record<string, number>;
    byDeckPreset: Record<string, number>;
    byMatchup: Record<string, number>;
    byCasebookLabel: Record<string, number>;
    byTransitionContext: Record<string, number>;
    byBudgetPressure: Record<string, number>;
  };
  explicitNonClaims: readonly string[];
  hiddenInfoSafetyNote: string;
  cFp75Recommendation: string;
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0Result {
  scaffoldRunId: string;
  suiteId: string;
  secondPlyRoots: DeterminizedPimcBoundedSecondPlyScaffoldV0RootRecord[];
  overBudgetRoots: DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetRootRecord[];
  skippedRoots: DeterminizedPimcBoundedSecondPlyScaffoldV0SkippedRootRecord[];
  summary: DeterminizedPimcBoundedSecondPlyScaffoldV0Summary;
  benchmark?: BenchmarkRunResult;
}

export interface BuildDeterminizedPimcBoundedSecondPlyScaffoldV0Input {
  scaffoldRunId: string;
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
  cFp72BranchingSummary: DeterminizedPimcPostOnePlyBranchingBudgetV0Summary;
  cFp72BranchingRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord[];
  cFp72SkippedRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord[];
  cFp73CasebookSummary: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummary;
  cFp73CasebookRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootRecord[];
  cFp73SkippedRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootRecord[];
  observedRoots: readonly DeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot[];
  benchmark?: BenchmarkRunResult;
  capPolicy?: DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy;
  sourceArtifactReferences?: Record<string, readonly DeterminizedProbeContractSourceArtifactReference[]>;
}

export interface RunDeterminizedPimcBoundedSecondPlyScaffoldV0Input
  extends Omit<
    BuildDeterminizedPimcBoundedSecondPlyScaffoldV0Input,
    "scaffoldRunId" | "suiteId" | "observedRoots"
  > {
  suiteId?: string;
  suite?: BenchmarkSuite;
  scaffoldRunId?: string;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
  deps?: DeterminizedPimcBoundedSecondPlyScaffoldV0ExecutionDeps;
}

interface PublicActionBucketWithMoves
  extends DeterminizedPimcActionAvailabilityV0PublicActionBucket {
  moves: LegalMove[];
}

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0ExecutionDeps {
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
}

const publicActionKinds: readonly PublicSearchActionKind[] = [
  "choose_mulligan",
  "play_card",
  "use_leader",
  "choose_prompt_option",
  "pass",
  "resolve_round_end",
];

const targetKinds: readonly PublicActionTargetKind[] = [
  "none",
  "board_row",
  "row_horn",
  "weather",
  "card_instance_set",
  "deck_card_instance",
  "deck_card_source",
  "card",
];

const targetSides: readonly PublicActionTargetSide[] = [
  "none",
  "own",
  "opponent",
  "public",
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

const transitionKinds: readonly DeterminizedPimcOnePlyOutcomeSkeletonV0TransitionKind[] =
  [
    "same_phase_same_round",
    "phase_changed_same_round",
    "round_advanced",
    "match_completed",
    "transition_unknown",
  ];

const failureReasons: readonly DeterminizedPimcBoundedSecondPlyScaffoldV0FailureReason[] =
  [
    "first_ply_sample_action_missing",
    "first_ply_move_conversion_failed",
    "first_ply_engine_rejected",
    "first_ply_engine_exception",
    "second_ply_actor_resolution_failed",
    "second_ply_legal_move_generation_failed",
    "second_ply_public_action_abstraction_failed",
    "second_ply_move_conversion_failed",
    "second_ply_engine_rejected",
    "second_ply_engine_exception",
    "sampled_root_rebuild_deferred",
  ];

export const DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_DEFAULT_CAP_POLICY: DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy =
  {
    version: "cfp74-default-root-bounded-v1",
    secondPlyPairCapPerRoot: 512,
    rootPublicActionCap: 16,
    postOnePlyPublicActionCapPerState: 16,
    sampleCountCapPerRoot: 8,
    robustTotalPlannedSecondPlyPairSoftCap: 7_500_000,
  };

export const DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_NON_CLAIMS = [
  "cFp74 is execution-scaffold evidence only.",
  "No rollout was run.",
  "No quality estimate was computed.",
  "No ordering output was produced.",
  "No best option was selected.",
  "No outcome-probability estimate was produced.",
  "No reward target was produced.",
  "No product AI behavior changed.",
  "No third layer was counted.",
] as const;

export const DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_HIDDEN_INFO_SAFETY_NOTE =
  "cFp74 artifacts contain public root metadata, scalar cap accounting, scalar second-layer completion counts, transition-shape counts, and source artifact hashes only. They exclude private identities, sampled payloads, trace payloads, raw action payloads, ordering outputs, estimates, rollout results, and product AI wiring.";

export const DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_CFP75_RECOMMENDATION =
  "cFp75 should use the cFp74 in-cap versus over-budget split to decide between a cap-targeted casebook, a cap calibration repair, or a third-surface budget probe for in-cap roots. It should still avoid rollout, quality, strength, and product-wiring claims.";

export const defaultDeterminizedPimcBoundedSecondPlyScaffoldV0RunId = (
  suiteId: string,
) =>
  `${suiteId}:determinized-pimc-bounded-second-ply-scaffold-v0:cFp74`;

export const buildDeterminizedPimcBoundedSecondPlyScaffoldV0RootKey =
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
  if (Array.isArray(value)) return value.map(sortJsonValue);
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

const addCount = (record: Record<string, number>, key: string | number, amount = 1) => {
  const normalizedKey = String(key);
  record[normalizedKey] = (record[normalizedKey] ?? 0) + amount;
};

const addNestedCount = (
  record: Record<string, Record<string, number>>,
  outer: string,
  inner: string | number,
  amount = 1,
) => {
  record[outer] ??= {};
  addCount(record[outer], inner, amount);
};

const percentage = (count: number, denominator: number) =>
  denominator <= 0 ? 0 : Number(((count / denominator) * 100).toFixed(3));

const emptyCounts = <T extends string>(keys: readonly T[]) =>
  Object.fromEntries(keys.map((key) => [key, 0])) as Record<T, number>;

const emptyFailureCounts = () => emptyCounts(failureReasons);
const emptyTransitionCounts = () => emptyCounts(transitionKinds);
const emptyActorCounts = () => emptyCounts(postActorLabels);
const emptyPhaseCounts = () => emptyCounts(postPhaseLabels);
const emptyPublicActionKindCounts = () => emptyCounts(publicActionKinds);
const emptyTargetKindCounts = () => emptyCounts(targetKinds);
const emptyTargetSideCounts = () => emptyCounts(targetSides);

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

const keyForRoot = (
  suiteId: string,
  root: DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity,
) =>
  buildDeterminizedPimcBoundedSecondPlyScaffoldV0RootKey({
    ...root,
    suiteId: root.suiteId || suiteId,
  });

const firstRecordByKey = <T extends DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity>(
  suiteId: string,
  records: readonly T[],
) => {
  const byKey = new Map<string, T>();
  records.forEach((record) => {
    const key = keyForRoot(suiteId, record);
    if (!byKey.has(key)) byKey.set(key, record);
  });
  return byKey;
};

const keySet = <T extends DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity>(
  suiteId: string,
  records: readonly T[],
) => new Set(records.map((record) => keyForRoot(suiteId, record)));

const duplicateKeyCount = <T extends DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity>(
  suiteId: string,
  records: readonly T[],
) => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const key = keyForRoot(suiteId, record);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.values()].filter((count) => count > 1).length;
};

const identityFromCfp72Root = (
  suiteId: string,
  root: DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord,
): DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity => ({
  suiteId,
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

const identityFromSkippedRoot = (
  suiteId: string,
  root: DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord,
): DeterminizedPimcBoundedSecondPlyScaffoldV0RootIdentity => ({
  suiteId,
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

const capSourceFields = (
  root: DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord,
): DeterminizedPimcBoundedSecondPlyScaffoldV0Cfp72CapSourceFields => ({
  rootPublicActionCount: root.rootPublicActionCount,
  firstPlyPublicActionSamplePairCount:
    root.firstPlyPublicActionSamplePairCount,
  postOnePlyPublicActionBudgetTotal:
    root.postOnePlyPublicActionBudgetTotal,
  postOnePlyPublicActionBudgetAverage:
    root.postOnePlyPublicActionBudgetAverage,
  nextPublicActionCountMax: root.nextPublicActionCountMax,
  largestNextPublicActionBucketSizeMax:
    root.largestNextPublicActionBucketSizeMax,
  nextPublicActionTargetExpansionCountMax:
    root.nextPublicActionTargetExpansionCountMax,
  branchingBudgetBucket: root.branchingBudgetBucket,
  branchingRiskBucket: root.branchingRiskBucket,
  postOnePlyActorCounts: sortRecord({ ...root.postOnePlyActorCounts }),
  postOnePlyPhaseCounts: sortRecord({ ...root.postOnePlyPhaseCounts }),
});

const defaultCasebookLabels: DeterminizedPimcBoundedSecondPlyScaffoldV0CasebookLabels =
  {
    casebookPresence: "not_in_casebook",
    primaryCasebookLabel: "not_in_casebook",
    budgetPressureLabel: "low",
    transitionContextLabel: "ordinary_policy_actor",
    cFp74ReadinessHint: "second_ply_scaffold_candidate",
  };

const casebookLabelsForRoot = (
  root?: DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootRecord,
): DeterminizedPimcBoundedSecondPlyScaffoldV0CasebookLabels =>
  root
    ? {
        casebookPresence: "in_casebook",
        primaryCasebookLabel: root.primaryCasebookLabel,
        budgetPressureLabel: root.budgetPressureLabel,
        transitionContextLabel: root.transitionContextLabel,
        cFp74ReadinessHint: root.cFp74ReadinessHint,
      }
    : defaultCasebookLabels;

export const evaluateDeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy = ({
  root,
  capPolicy = DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_DEFAULT_CAP_POLICY,
  sourceConsistencyReady = true,
}: {
  root: DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord;
  capPolicy?: DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy;
  sourceConsistencyReady?: boolean;
}): {
  capStatus: DeterminizedPimcBoundedSecondPlyScaffoldV0CapStatus;
  overBudgetReason?: DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetReason;
  overBudgetReasonFlags: Record<DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetReason, boolean>;
} => {
  const overBudgetReasonFlags = {
    source_consistency_not_ready: !sourceConsistencyReady,
    root_public_action_cap_exceeded:
      root.rootPublicActionCount > capPolicy.rootPublicActionCap,
    sample_count_cap_exceeded:
      root.sampleCountChecked > capPolicy.sampleCountCapPerRoot,
    post_one_ply_public_action_cap_exceeded:
      root.nextPublicActionCountMax >
      capPolicy.postOnePlyPublicActionCapPerState,
    root_second_ply_pair_cap_exceeded:
      root.postOnePlyPublicActionBudgetTotal >
      capPolicy.secondPlyPairCapPerRoot,
  };
  const priority: readonly DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetReason[] =
    [
      "source_consistency_not_ready",
      "root_public_action_cap_exceeded",
      "sample_count_cap_exceeded",
      "post_one_ply_public_action_cap_exceeded",
      "root_second_ply_pair_cap_exceeded",
    ];
  const overBudgetReason = priority.find(
    (reason) => overBudgetReasonFlags[reason],
  );
  return overBudgetReason
    ? { capStatus: "over_budget", overBudgetReason, overBudgetReasonFlags }
    : { capStatus: "in_cap", overBudgetReasonFlags };
};

interface MutableExecutionResult {
  sampleCountChecked: number;
  plannedSecondPlyPairCount: number;
  completedSecondPlyPairCount: number;
  failedOrDeferredSecondPlyPairCount: number;
  secondPlyFailureReasonCounts: Record<string, number>;
  secondPlyTransitionKindCounts: Record<string, number>;
  postSecondPlyPhaseCounts: Record<string, number>;
  postSecondPlyActorCounts: Record<string, number>;
  secondPlyPublicActionKindCounts: Record<string, number>;
  secondPlyTargetKindCounts: Record<string, number>;
  secondPlyTargetSideCounts: Record<string, number>;
}

const emptyExecutionResult = (): MutableExecutionResult => ({
  sampleCountChecked: 0,
  plannedSecondPlyPairCount: 0,
  completedSecondPlyPairCount: 0,
  failedOrDeferredSecondPlyPairCount: 0,
  secondPlyFailureReasonCounts: emptyFailureCounts(),
  secondPlyTransitionKindCounts: emptyTransitionCounts(),
  postSecondPlyPhaseCounts: emptyPhaseCounts(),
  postSecondPlyActorCounts: emptyActorCounts(),
  secondPlyPublicActionKindCounts: emptyPublicActionKindCounts(),
  secondPlyTargetKindCounts: emptyTargetKindCounts(),
  secondPlyTargetSideCounts: emptyTargetSideCounts(),
});

const addFailure = (
  result: MutableExecutionResult,
  reason: DeterminizedPimcBoundedSecondPlyScaffoldV0FailureReason,
  amount = 1,
) => {
  result.failedOrDeferredSecondPlyPairCount += amount;
  addCount(result.secondPlyFailureReasonCounts, reason, amount);
};

const mergeExecutionResult = (
  target: MutableExecutionResult,
  source: MutableExecutionResult,
) => {
  target.sampleCountChecked += source.sampleCountChecked;
  target.plannedSecondPlyPairCount += source.plannedSecondPlyPairCount;
  target.completedSecondPlyPairCount += source.completedSecondPlyPairCount;
  target.failedOrDeferredSecondPlyPairCount +=
    source.failedOrDeferredSecondPlyPairCount;
  [
    "secondPlyFailureReasonCounts",
    "secondPlyTransitionKindCounts",
    "postSecondPlyPhaseCounts",
    "postSecondPlyActorCounts",
    "secondPlyPublicActionKindCounts",
    "secondPlyTargetKindCounts",
    "secondPlyTargetSideCounts",
  ].forEach((key) => {
    Object.entries(source[key as keyof MutableExecutionResult] as Record<string, number>).forEach(
      ([nestedKey, count]) => {
        addCount(
          target[key as keyof MutableExecutionResult] as Record<string, number>,
          nestedKey,
          count,
        );
      },
    );
  });
};

const executionStatus = (
  result: Pick<
    MutableExecutionResult,
    "completedSecondPlyPairCount" | "failedOrDeferredSecondPlyPairCount"
  >,
): DeterminizedPimcBoundedSecondPlyScaffoldV0ExecutionStatus => {
  if (result.failedOrDeferredSecondPlyPairCount === 0) return "completed";
  if (result.completedSecondPlyPairCount > 0) return "completed_with_failures";
  return "deferred";
};

const outcomeRisk = ({
  planned,
  observed,
  failed,
}: {
  planned: number;
  observed: number;
  failed: number;
}): DeterminizedPimcBoundedSecondPlyScaffoldV0OutcomeRiskBucket => {
  if (planned !== observed) return "cap_mismatch";
  if (failed > 0) return "some_failed_or_deferred";
  return "none";
};

export const executeDeterminizedPimcBoundedSecondPlyScaffoldV0Sample = ({
  sampledState,
  rootBuckets,
  sampledLegalMoves,
  phase,
  round,
  deps = {},
}: {
  sampledState: MatchState;
  rootBuckets: readonly DeterminizedPimcActionAvailabilityV0PublicActionBucket[];
  sampledLegalMoves: readonly LegalMove[];
  phase: MatchPhase;
  round: number;
  deps?: DeterminizedPimcBoundedSecondPlyScaffoldV0ExecutionDeps;
}): MutableExecutionResult => {
  const result = emptyExecutionResult();
  const sampledBuckets = buildPublicActionBucketsWithMoves(
    sampledLegalMoves,
    phase,
    round,
  );
  const sampledByKey = new Map(
    sampledBuckets.map((bucket) => [bucket.key, bucket]),
  );
  const toCommand = deps.commandFromLegalMove ?? commandFromLegalMove;
  const applyCommand = deps.executeCommand ?? executeCommand;
  const legalMoveReader = deps.getLegalMoves ?? getLegalMoves;

  rootBuckets.forEach((rootBucket) => {
    const sampledBucket = sampledByKey.get(rootBucket.key);
    if (!sampledBucket || sampledBucket.moves.length === 0) {
      addFailure(result, "first_ply_sample_action_missing");
      return;
    }

    const firstMove = sampledBucket.moves[0];
    const firstCommand = toCommand(firstMove);
    if (!firstCommand) {
      addFailure(result, "first_ply_move_conversion_failed");
      return;
    }

    let postOnePlyState: MatchState;
    try {
      const transaction = applyCommand({
        state: structuredClone(sampledState) as MatchState,
        command: firstCommand,
        catalogCards: currentCatalogCards,
        catalogLeaders: currentCatalogLeaders,
      });
      if ("status" in transaction && transaction.status) {
        addFailure(result, "first_ply_engine_rejected");
        return;
      }
      if (!("state" in transaction)) {
        addFailure(result, "first_ply_engine_rejected");
        return;
      }
      postOnePlyState = transaction.state;
    } catch {
      addFailure(result, "first_ply_engine_exception");
      return;
    }

    const actor = resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor(
      postOnePlyState,
    );
    const phaseLabel = postPhaseLabel(postOnePlyState.phase);
    if (!phaseLabel || actor.actorLabel === "actor_resolution_failed") {
      addFailure(result, "second_ply_actor_resolution_failed");
      return;
    }
    if (
      actor.actorLabel === "terminal_game_end" ||
      actor.actorLabel === "no_actor" ||
      !actor.seatId
    ) {
      return;
    }

    let secondLegalMoves: LegalMove[];
    try {
      secondLegalMoves = legalMoveReader({
        state: postOnePlyState,
        seatId: actor.seatId,
        catalogCards: currentCatalogCards,
        catalogLeaders: currentCatalogLeaders,
      });
    } catch {
      addFailure(result, "second_ply_legal_move_generation_failed");
      return;
    }

    let secondBuckets: PublicActionBucketWithMoves[];
    try {
      secondBuckets = buildPublicActionBucketsWithMoves(
        secondLegalMoves,
        postOnePlyState.phase,
        postOnePlyState.round,
      );
    } catch {
      addFailure(result, "second_ply_public_action_abstraction_failed");
      return;
    }

    result.plannedSecondPlyPairCount += secondBuckets.length;
    secondBuckets.forEach((secondBucket) => {
      addCount(result.secondPlyPublicActionKindCounts, secondBucket.action.kind);
      addCount(result.secondPlyTargetKindCounts, secondBucket.action.targetKind);
      addCount(result.secondPlyTargetSideCounts, secondBucket.action.targetSide);

      const secondMove = secondBucket.moves[0];
      const secondCommand = secondMove ? toCommand(secondMove) : null;
      if (!secondCommand) {
        addFailure(result, "second_ply_move_conversion_failed");
        return;
      }

      try {
        const transaction = applyCommand({
          state: structuredClone(postOnePlyState) as MatchState,
          command: secondCommand,
          catalogCards: currentCatalogCards,
          catalogLeaders: currentCatalogLeaders,
        });
        if ("status" in transaction && transaction.status) {
          addFailure(result, "second_ply_engine_rejected");
          return;
        }
        if (!("state" in transaction)) {
          addFailure(result, "second_ply_engine_rejected");
          return;
        }

        result.completedSecondPlyPairCount += 1;
        addCount(
          result.secondPlyTransitionKindCounts,
          classifyDeterminizedPimcOnePlyOutcomeSkeletonV0Transition({
            beforeState: postOnePlyState,
            afterState: transaction.state,
          }),
        );
        const postPhase = postPhaseLabel(transaction.state.phase);
        if (postPhase) addCount(result.postSecondPlyPhaseCounts, postPhase);
        const postActor =
          resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor(
            transaction.state,
          );
        addCount(result.postSecondPlyActorCounts, postActor.actorLabel);
      } catch {
        addFailure(result, "second_ply_engine_exception");
      }
    });
  });

  return {
    ...result,
    secondPlyFailureReasonCounts: sortRecord(
      result.secondPlyFailureReasonCounts,
    ),
    secondPlyTransitionKindCounts: sortRecord(
      result.secondPlyTransitionKindCounts,
    ),
    postSecondPlyPhaseCounts: sortRecord(result.postSecondPlyPhaseCounts),
    postSecondPlyActorCounts: sortRecord(result.postSecondPlyActorCounts),
    secondPlyPublicActionKindCounts: sortRecord(
      result.secondPlyPublicActionKindCounts,
    ),
    secondPlyTargetKindCounts: sortRecord(result.secondPlyTargetKindCounts),
    secondPlyTargetSideCounts: sortRecord(result.secondPlyTargetSideCounts),
  };
};

const baseObservedIdentity = (
  input: BenchmarkRootObserverInput,
): Omit<
  DeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot,
  | "rootPublicFingerprint"
  | "sampleCountRequested"
  | "sampleCountGenerated"
  | "sampleCountChecked"
  | "plannedSecondPlyPairCount"
  | "completedSecondPlyPairCount"
  | "failedOrDeferredSecondPlyPairCount"
  | "secondPlyExecutionStatus"
  | "secondPlyFailureReasonCounts"
  | "secondPlyTransitionKindCounts"
  | "postSecondPlyPhaseCounts"
  | "postSecondPlyActorCounts"
  | "secondPlyPublicActionKindCounts"
  | "secondPlyTargetKindCounts"
  | "secondPlyTargetSideCounts"
  | "secondPlyOutcomeRiskBucket"
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

export const buildDeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot = ({
  input,
  samplerRunId,
  memory,
  cFp68EligibleRoot,
  cFp69ProbeRoot,
  cFp70AvailabilityRoot,
  cFp71OutcomeRoot,
  cFp72BranchingRoot,
  deps,
}: {
  input: BenchmarkRootObserverInput;
  samplerRunId: string;
  memory: SamplerPublicTransferMemoryState;
  cFp68EligibleRoot?: DeterminizedProbeContractEligibleRootRecord;
  cFp69ProbeRoot?: DeterminizedPimcProbeV0RootRecord;
  cFp70AvailabilityRoot?: DeterminizedPimcActionAvailabilityV0RootRecord;
  cFp71OutcomeRoot?: DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord;
  cFp72BranchingRoot?: DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord;
  deps?: DeterminizedPimcBoundedSecondPlyScaffoldV0ExecutionDeps;
}): DeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot => {
  const identity = baseObservedIdentity(input);
  const rootBuckets =
    cFp68EligibleRoot &&
    cFp69ProbeRoot &&
    cFp70AvailabilityRoot &&
    cFp71OutcomeRoot &&
    cFp72BranchingRoot
      ? buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets(
          input.legalMoves,
          input.state.phase,
          input.state.round,
        )
      : [];
  const aggregate = emptyExecutionResult();

  const materialization =
    cFp68EligibleRoot &&
    cFp69ProbeRoot &&
    cFp70AvailabilityRoot &&
    cFp71OutcomeRoot &&
    cFp72BranchingRoot
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
    !cFp71OutcomeRoot ||
    !cFp72BranchingRoot;

  if (
    materialization &&
    cFp68EligibleRoot &&
    cFp69ProbeRoot &&
    cFp70AvailabilityRoot &&
    cFp71OutcomeRoot &&
    cFp72BranchingRoot
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
      cFp71OutcomeRoot.sampleCountChecked === cFp68EligibleRoot.sampleCountValid &&
      cFp71OutcomeRoot.publicActionSamplePairCount ===
        rootBuckets.length * cFp68EligibleRoot.sampleCountValid &&
      cFp71OutcomeRoot.completedPairCount ===
        cFp71OutcomeRoot.publicActionSamplePairCount &&
      cFp71OutcomeRoot.failedOrDeferredPairCount === 0 &&
      cFp71OutcomeRoot.outcomeDivergenceCount === 0;
    const cfp72Matches =
      cFp72BranchingRoot.probeStatus === "completed" &&
      cFp72BranchingRoot.rootPublicActionCount === rootBuckets.length &&
      cFp72BranchingRoot.sampleCountChecked === cFp68EligibleRoot.sampleCountValid &&
      cFp72BranchingRoot.firstPlyPublicActionSamplePairCount ===
        rootBuckets.length * cFp68EligibleRoot.sampleCountValid &&
      cFp72BranchingRoot.failedOrDeferredBranchingPairCount === 0;

    deferred =
      !cfp68Matches ||
      !cfp69Matches ||
      !cfp70Matches ||
      !cfp71Matches ||
      !cfp72Matches ||
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
          addFailure(aggregate, "sampled_root_rebuild_deferred");
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
          addFailure(aggregate, "sampled_root_rebuild_deferred");
          continue;
        }

        const sampleResult =
          executeDeterminizedPimcBoundedSecondPlyScaffoldV0Sample({
            sampledState: rebuilt.state,
            rootBuckets,
            sampledLegalMoves,
            phase: input.state.phase,
            round: input.state.round,
            deps,
          });
        sampleResult.sampleCountChecked = 1;
        mergeExecutionResult(aggregate, sampleResult);
      }
    }
  }

  if (deferred && rootBuckets.length > 0) {
    addFailure(
      aggregate,
      "sampled_root_rebuild_deferred",
      cFp72BranchingRoot?.postOnePlyPublicActionBudgetTotal ?? rootBuckets.length,
    );
  }

  const status = executionStatus(aggregate);
  const planned = aggregate.plannedSecondPlyPairCount;
  const observed = aggregate.completedSecondPlyPairCount + aggregate.failedOrDeferredSecondPlyPairCount;

  return {
    ...identity,
    rootPublicFingerprint:
      materialization?.rootPublicFingerprint ??
      cFp72BranchingRoot?.rootPublicFingerprint ??
      "",
    sampleCountRequested:
      materialization?.sampleCountRequested ??
      cFp68EligibleRoot?.sampleCountRequested ??
      cFp72BranchingRoot?.sampleCountRequested ??
      0,
    sampleCountGenerated: materialization?.sampleCountGenerated ?? 0,
    sampleCountChecked: aggregate.sampleCountChecked,
    plannedSecondPlyPairCount: planned,
    completedSecondPlyPairCount: aggregate.completedSecondPlyPairCount,
    failedOrDeferredSecondPlyPairCount:
      aggregate.failedOrDeferredSecondPlyPairCount,
    secondPlyExecutionStatus: status,
    secondPlyFailureReasonCounts: sortRecord(
      aggregate.secondPlyFailureReasonCounts,
    ),
    secondPlyTransitionKindCounts: sortRecord(
      aggregate.secondPlyTransitionKindCounts,
    ),
    postSecondPlyPhaseCounts: sortRecord(aggregate.postSecondPlyPhaseCounts),
    postSecondPlyActorCounts: sortRecord(aggregate.postSecondPlyActorCounts),
    secondPlyPublicActionKindCounts: sortRecord(
      aggregate.secondPlyPublicActionKindCounts,
    ),
    secondPlyTargetKindCounts: sortRecord(aggregate.secondPlyTargetKindCounts),
    secondPlyTargetSideCounts: sortRecord(aggregate.secondPlyTargetSideCounts),
    secondPlyOutcomeRiskBucket: deferred
      ? "source_mismatch"
      : outcomeRisk({
          planned,
          observed,
          failed: aggregate.failedOrDeferredSecondPlyPairCount,
        }),
  };
};

const copySkippedRoot = ({
  scaffoldRunId,
  suiteId,
  sourceCfp72RunId,
  sourceCfp73RunId,
  root,
}: {
  scaffoldRunId: string;
  suiteId: string;
  sourceCfp72RunId: string;
  sourceCfp73RunId: string;
  root: DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord;
}): DeterminizedPimcBoundedSecondPlyScaffoldV0SkippedRootRecord => ({
  schemaVersion: "determinized-pimc-bounded-second-ply-scaffold-v0-skipped-root-v1",
  scaffoldRunId,
  sourceCfp72RunId,
  sourceCfp73RunId,
  ...identityFromSkippedRoot(suiteId, root),
  eligibilityStatus: root.eligibilityStatus,
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
  skipStage: "inherited_sampler_skip",
  skipCounterDimensions: { ...root.skipCounterDimensions },
});

const capPolicyFields = (
  capPolicy: DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy,
) => ({
  capPolicyVersion: capPolicy.version,
  secondPlyPairCapPerRoot: capPolicy.secondPlyPairCapPerRoot,
  rootPublicActionCap: capPolicy.rootPublicActionCap,
  postOnePlyPublicActionCapPerState:
    capPolicy.postOnePlyPublicActionCapPerState,
  sampleCountCapPerRoot: capPolicy.sampleCountCapPerRoot,
});

const skipCounterDimensionsForRoot = (
  root: DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord,
) => ({
  suiteId: root.suiteId,
  phase: root.phase,
  round: String(root.round),
  policyId: root.policyId,
  faction: root.faction,
  deckPresetId: root.deckPresetId,
  matchupId: root.matchupId,
});

const buildSourceConsistency = ({
  input,
  inCapKeys,
  observedByKey,
  sourceArtifactReferences,
}: {
  input: BuildDeterminizedPimcBoundedSecondPlyScaffoldV0Input;
  inCapKeys: Set<string>;
  observedByKey: Map<string, DeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot>;
  sourceArtifactReferences: Record<string, readonly DeterminizedProbeContractSourceArtifactReference[]>;
}): DeterminizedPimcBoundedSecondPlyScaffoldV0SourceConsistency => {
  const { suiteId } = input;
  const cfp68EligibleKeys = keySet(suiteId, input.cFp68EligibleRoots);
  const cfp68SkippedKeys = keySet(suiteId, input.cFp68SkippedRoots);
  const cfp72BranchingKeys = keySet(suiteId, input.cFp72BranchingRoots);
  const cfp72SkippedKeys = keySet(suiteId, input.cFp72SkippedRoots);

  const cfp72RootsWithFailedOrDeferredPairs =
    input.cFp72BranchingRoots.filter(
      (root) => root.failedOrDeferredBranchingPairCount > 0,
    ).length;
  const cfp72RootsWithProbeStatusAnomaly = input.cFp72BranchingRoots.filter(
    (root) => root.probeStatus !== "completed",
  ).length;
  const cfp72RootsWithPlannedPairScalarMismatch = 0;
  const inheritedSkippedRootsProbed = input.cFp72SkippedRoots.filter((root) =>
    observedByKey.has(keyForRoot(suiteId, root)),
  ).length;
  const inCapRootsNotObserved = [...inCapKeys].filter(
    (key) => !observedByKey.has(key),
  ).length;
  const sourceArtifactHashMisses = Object.values(sourceArtifactReferences)
    .flat()
    .filter((reference) => !reference.sha256).length;

  const sourceConsistency = {
    cFp68ContractStatus: input.contractSummary.contractStatus,
    cFp72ProbeReadinessStatus: input.cFp72BranchingSummary.probeReadinessStatus,
    cFp73CasebookReadinessStatus:
      input.cFp73CasebookSummary.casebookReadinessStatus,
    cFp68EligibleRootsRead: input.cFp68EligibleRoots.length,
    cFp68SkippedRootsRead: input.cFp68SkippedRoots.length,
    cFp69ProbeRootsRead: input.cFp69ProbeRoots.length,
    cFp69SkippedRootsRead: input.cFp69SkippedRoots.length,
    cFp70AvailabilityRootsRead: input.cFp70AvailabilityRoots.length,
    cFp70SkippedRootsRead: input.cFp70SkippedRoots.length,
    cFp71OutcomeRootsRead: input.cFp71OutcomeRoots.length,
    cFp71SkippedRootsRead: input.cFp71SkippedRoots.length,
    cFp72BranchingRootsRead: input.cFp72BranchingRoots.length,
    cFp72SkippedRootsRead: input.cFp72SkippedRoots.length,
    cFp73CasebookRootsRead: input.cFp73CasebookRoots.length,
    cFp73SkippedRootsRead: input.cFp73SkippedRoots.length,
    duplicateCfp68EligibleRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp68EligibleRoots,
    ),
    duplicateCfp68SkippedRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp68SkippedRoots,
    ),
    duplicateCfp69ProbeRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp69ProbeRoots,
    ),
    duplicateCfp69SkippedRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp69SkippedRoots,
    ),
    duplicateCfp70AvailabilityRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp70AvailabilityRoots,
    ),
    duplicateCfp70SkippedRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp70SkippedRoots,
    ),
    duplicateCfp71OutcomeRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp71OutcomeRoots,
    ),
    duplicateCfp71SkippedRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp71SkippedRoots,
    ),
    duplicateCfp72BranchingRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp72BranchingRoots,
    ),
    duplicateCfp72SkippedRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp72SkippedRoots,
    ),
    duplicateCfp73CasebookRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp73CasebookRoots,
    ),
    duplicateCfp73SkippedRootKeys: duplicateKeyCount(
      suiteId,
      input.cFp73SkippedRoots,
    ),
    cfp68Cfp69EligibleRootCountDelta:
      input.cFp68EligibleRoots.length - input.cFp69ProbeRoots.length,
    cfp68Cfp70AvailabilityRootCountDelta:
      input.cFp68EligibleRoots.length - input.cFp70AvailabilityRoots.length,
    cfp68Cfp71OutcomeRootCountDelta:
      input.cFp68EligibleRoots.length - input.cFp71OutcomeRoots.length,
    cfp68Cfp72BranchingRootCountDelta:
      input.cFp68EligibleRoots.length - input.cFp72BranchingRoots.length,
    cfp68Cfp69SkippedRootCountDelta:
      input.cFp68SkippedRoots.length - input.cFp69SkippedRoots.length,
    cfp68Cfp70SkippedRootCountDelta:
      input.cFp68SkippedRoots.length - input.cFp70SkippedRoots.length,
    cfp68Cfp71SkippedRootCountDelta:
      input.cFp68SkippedRoots.length - input.cFp71SkippedRoots.length,
    cfp68Cfp72SkippedRootCountDelta:
      input.cFp68SkippedRoots.length - input.cFp72SkippedRoots.length,
    cfp72BranchingRootCountDeltaFromSummary:
      input.cFp72BranchingRoots.length -
      input.cFp72BranchingSummary.branchingRootCount,
    cfp72SkippedRootCountDeltaFromSummary:
      input.cFp72SkippedRoots.length -
      input.cFp72BranchingSummary.skippedRootCount,
    cfp73CasebookRootCountDeltaFromSummary:
      input.cFp73CasebookRoots.length -
      input.cFp73CasebookSummary.casebookRootCount,
    cfp73SkippedRootCountDeltaFromSummary:
      input.cFp73SkippedRoots.length -
      input.cFp73CasebookSummary.skippedRootCount,
    cfp69ProbeRootsMissingCfp68EligibleRoot: input.cFp69ProbeRoots.filter(
      (root) => !cfp68EligibleKeys.has(keyForRoot(suiteId, root)),
    ).length,
    cfp70AvailabilityRootsMissingCfp68EligibleRoot:
      input.cFp70AvailabilityRoots.filter(
        (root) => !cfp68EligibleKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp71OutcomeRootsMissingCfp68EligibleRoot:
      input.cFp71OutcomeRoots.filter(
        (root) => !cfp68EligibleKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp72BranchingRootsMissingCfp68EligibleRoot:
      input.cFp72BranchingRoots.filter(
        (root) => !cfp68EligibleKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp68EligibleRootsMissingCfp72BranchingRoot:
      input.cFp68EligibleRoots.filter(
        (root) => !cfp72BranchingKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp73CasebookRootsMissingCfp72BranchingRoot:
      input.cFp73CasebookRoots.filter(
        (root) => !cfp72BranchingKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp69SkippedRootsMissingCfp68SkippedRoot:
      input.cFp69SkippedRoots.filter(
        (root) => !cfp68SkippedKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp70SkippedRootsMissingCfp68SkippedRoot:
      input.cFp70SkippedRoots.filter(
        (root) => !cfp68SkippedKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp71SkippedRootsMissingCfp68SkippedRoot:
      input.cFp71SkippedRoots.filter(
        (root) => !cfp68SkippedKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp72SkippedRootsMissingCfp68SkippedRoot:
      input.cFp72SkippedRoots.filter(
        (root) => !cfp68SkippedKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp73SkippedRootsMissingCfp72SkippedRoot:
      input.cFp73SkippedRoots.filter(
        (root) => !cfp72SkippedKeys.has(keyForRoot(suiteId, root)),
      ).length,
    cfp72RootsWithFailedOrDeferredPairs,
    cfp72RootsWithProbeStatusAnomaly,
    cfp72RootsWithPlannedPairScalarMismatch,
    inheritedSkippedRootsProbed,
    inCapRootsNotObserved,
    sourceArtifactHashMisses,
  };

  const issueCount = [
    sourceConsistency.cFp68ContractStatus === "probe_ready" ? 0 : 1,
    sourceConsistency.cFp72ProbeReadinessStatus === "probe_ready" ? 0 : 1,
    sourceConsistency.cFp73CasebookReadinessStatus === "casebook_ready" ? 0 : 1,
    sourceConsistency.duplicateCfp68EligibleRootKeys,
    sourceConsistency.duplicateCfp68SkippedRootKeys,
    sourceConsistency.duplicateCfp69ProbeRootKeys,
    sourceConsistency.duplicateCfp69SkippedRootKeys,
    sourceConsistency.duplicateCfp70AvailabilityRootKeys,
    sourceConsistency.duplicateCfp70SkippedRootKeys,
    sourceConsistency.duplicateCfp71OutcomeRootKeys,
    sourceConsistency.duplicateCfp71SkippedRootKeys,
    sourceConsistency.duplicateCfp72BranchingRootKeys,
    sourceConsistency.duplicateCfp72SkippedRootKeys,
    sourceConsistency.duplicateCfp73CasebookRootKeys,
    sourceConsistency.duplicateCfp73SkippedRootKeys,
    Math.abs(sourceConsistency.cfp68Cfp69EligibleRootCountDelta),
    Math.abs(sourceConsistency.cfp68Cfp70AvailabilityRootCountDelta),
    Math.abs(sourceConsistency.cfp68Cfp71OutcomeRootCountDelta),
    Math.abs(sourceConsistency.cfp68Cfp72BranchingRootCountDelta),
    Math.abs(sourceConsistency.cfp68Cfp69SkippedRootCountDelta),
    Math.abs(sourceConsistency.cfp68Cfp70SkippedRootCountDelta),
    Math.abs(sourceConsistency.cfp68Cfp71SkippedRootCountDelta),
    Math.abs(sourceConsistency.cfp68Cfp72SkippedRootCountDelta),
    Math.abs(sourceConsistency.cfp72BranchingRootCountDeltaFromSummary),
    Math.abs(sourceConsistency.cfp72SkippedRootCountDeltaFromSummary),
    Math.abs(sourceConsistency.cfp73CasebookRootCountDeltaFromSummary),
    Math.abs(sourceConsistency.cfp73SkippedRootCountDeltaFromSummary),
    sourceConsistency.cfp69ProbeRootsMissingCfp68EligibleRoot,
    sourceConsistency.cfp70AvailabilityRootsMissingCfp68EligibleRoot,
    sourceConsistency.cfp71OutcomeRootsMissingCfp68EligibleRoot,
    sourceConsistency.cfp72BranchingRootsMissingCfp68EligibleRoot,
    sourceConsistency.cfp68EligibleRootsMissingCfp72BranchingRoot,
    sourceConsistency.cfp73CasebookRootsMissingCfp72BranchingRoot,
    sourceConsistency.cfp69SkippedRootsMissingCfp68SkippedRoot,
    sourceConsistency.cfp70SkippedRootsMissingCfp68SkippedRoot,
    sourceConsistency.cfp71SkippedRootsMissingCfp68SkippedRoot,
    sourceConsistency.cfp72SkippedRootsMissingCfp68SkippedRoot,
    sourceConsistency.cfp73SkippedRootsMissingCfp72SkippedRoot,
    sourceConsistency.cfp72RootsWithFailedOrDeferredPairs,
    sourceConsistency.cfp72RootsWithProbeStatusAnomaly,
    sourceConsistency.cfp72RootsWithPlannedPairScalarMismatch,
    sourceConsistency.inheritedSkippedRootsProbed,
    sourceConsistency.inCapRootsNotObserved,
    sourceConsistency.sourceArtifactHashMisses,
  ].reduce((sum, count) => sum + count, 0);

  return {
    status: issueCount === 0 ? "ready" : "not_ready",
    ...sourceConsistency,
  };
};

const buildOverBudgetCounters = (
  roots: readonly DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetRootRecord[],
) => {
  const counters = {
    byPhase: {},
    byRound: {},
    byPolicy: {},
    byFaction: {},
    byDeckPreset: {},
    byMatchup: {},
    byCasebookLabel: {},
    byTransitionContext: {},
    byBudgetPressure: {},
  } as DeterminizedPimcBoundedSecondPlyScaffoldV0Summary["overBudgetCounters"];
  roots.forEach((root) => {
    addCount(counters.byPhase, root.phase);
    addCount(counters.byRound, root.round);
    addCount(counters.byPolicy, root.policyId);
    addCount(counters.byFaction, root.faction);
    addCount(counters.byDeckPreset, root.deckPresetId);
    addCount(counters.byMatchup, root.matchupId);
    addCount(counters.byCasebookLabel, root.primaryCasebookLabel);
    addCount(counters.byTransitionContext, root.transitionContextLabel);
    addCount(counters.byBudgetPressure, root.budgetPressureLabel);
  });
  return {
    byPhase: sortRecord(counters.byPhase),
    byRound: sortRecord(counters.byRound),
    byPolicy: sortRecord(counters.byPolicy),
    byFaction: sortRecord(counters.byFaction),
    byDeckPreset: sortRecord(counters.byDeckPreset),
    byMatchup: sortRecord(counters.byMatchup),
    byCasebookLabel: sortRecord(counters.byCasebookLabel),
    byTransitionContext: sortRecord(counters.byTransitionContext),
    byBudgetPressure: sortRecord(counters.byBudgetPressure),
  };
};

const buildInheritedSkipCounters = (
  roots: readonly DeterminizedPimcBoundedSecondPlyScaffoldV0SkippedRootRecord[],
) => {
  const counters: Record<string, Record<string, number>> = {
    bySuite: {},
    byPhase: {},
    byRound: {},
    byPolicy: {},
    byFaction: {},
    byDeckPreset: {},
    byMatchup: {},
    byInvalidReason: {},
    bySkipReason: {},
  };
  roots.forEach((root) => {
    const dimensions = root.skipCounterDimensions;
    addCount(counters.bySuite, dimensions.suiteId ?? root.suiteId);
    addCount(counters.byPhase, dimensions.phase ?? root.phase);
    addCount(counters.byRound, dimensions.round ?? root.round);
    addCount(counters.byPolicy, dimensions.policyId ?? root.policyId);
    addCount(counters.byFaction, dimensions.faction ?? root.faction);
    addCount(counters.byDeckPreset, dimensions.deckPresetId ?? root.deckPresetId);
    addCount(counters.byMatchup, dimensions.matchupId ?? root.matchupId);
    addCount(counters.byInvalidReason, dimensions.invalidReason ?? root.invalidReason);
    addCount(counters.bySkipReason, dimensions.skipReason ?? root.skipReason);
  });
  return Object.fromEntries(
    Object.entries(counters).map(([key, value]) => [key, sortRecord(value)]),
  );
};

export const buildDeterminizedPimcBoundedSecondPlyScaffoldV0 = (
  input: BuildDeterminizedPimcBoundedSecondPlyScaffoldV0Input,
): DeterminizedPimcBoundedSecondPlyScaffoldV0Result => {
  const capPolicy =
    input.capPolicy ??
    DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_DEFAULT_CAP_POLICY;
  const sourceArtifactReferences = input.sourceArtifactReferences ?? {};
  const observedByKey = firstRecordByKey(input.suiteId, input.observedRoots);
  const cfp73ByKey = firstRecordByKey(input.suiteId, input.cFp73CasebookRoots);
  const preliminaryInCapKeys = new Set(
    input.cFp72BranchingRoots
      .filter(
        (root) =>
          evaluateDeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy({
            root,
            capPolicy,
            sourceConsistencyReady: true,
          }).capStatus === "in_cap",
      )
      .map((root) => keyForRoot(input.suiteId, root)),
  );
  const sourceConsistency = buildSourceConsistency({
    input,
    inCapKeys: preliminaryInCapKeys,
    observedByKey,
    sourceArtifactReferences,
  });
  const sourceConsistencyReady = sourceConsistency.status === "ready";
  const secondPlyRoots: DeterminizedPimcBoundedSecondPlyScaffoldV0RootRecord[] =
    [];
  const overBudgetRoots: DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetRootRecord[] =
    [];
  const sourceCfp72RunId = input.cFp72BranchingSummary.probeRunId;
  const sourceCfp73RunId = input.cFp73CasebookSummary.casebookRunId;

  input.cFp72BranchingRoots.forEach((root) => {
    const key = keyForRoot(input.suiteId, root);
    const labels = casebookLabelsForRoot(cfp73ByKey.get(key));
    const cap = evaluateDeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy({
      root,
      capPolicy,
      sourceConsistencyReady,
    });
    const identity = identityFromCfp72Root(input.suiteId, root);
    const common = {
      scaffoldRunId: input.scaffoldRunId,
      sourceCfp72RunId,
      sourceCfp73RunId,
      ...identity,
      ...capSourceFields(root),
      ...labels,
      ...capPolicyFields(capPolicy),
    };

    if (cap.capStatus === "over_budget" && cap.overBudgetReason) {
      overBudgetRoots.push({
        schemaVersion:
          "determinized-pimc-bounded-second-ply-scaffold-v0-over-budget-root-v1",
        ...common,
        capStatus: "over_budget",
        overBudgetReason: cap.overBudgetReason,
        overBudgetReasonFlags: cap.overBudgetReasonFlags,
        plannedSecondPlyPairCount: root.postOnePlyPublicActionBudgetTotal,
        plannedSecondPlyPairCountOverCap: Math.max(
          0,
          root.postOnePlyPublicActionBudgetTotal -
            capPolicy.secondPlyPairCapPerRoot,
        ),
        skipCounterDimensions: skipCounterDimensionsForRoot(root),
      });
      return;
    }

    const observed = observedByKey.get(key);
    const plannedFromSource = root.postOnePlyPublicActionBudgetTotal;
    const completed = observed?.completedSecondPlyPairCount ?? 0;
    const failed = observed?.failedOrDeferredSecondPlyPairCount ?? plannedFromSource;
    const observedPlanned = observed?.plannedSecondPlyPairCount ?? 0;
    const status = observed
      ? observed.secondPlyExecutionStatus
      : "deferred";

    secondPlyRoots.push({
      schemaVersion: "determinized-pimc-bounded-second-ply-scaffold-v0-root-v1",
      ...common,
      capStatus: "in_cap",
      sampleCountRequested: observed?.sampleCountRequested ?? root.sampleCountRequested,
      sampleCountGenerated: observed?.sampleCountGenerated ?? 0,
      sampleCountChecked: observed?.sampleCountChecked ?? 0,
      plannedSecondPlyPairCount: plannedFromSource,
      completedSecondPlyPairCount: completed,
      failedOrDeferredSecondPlyPairCount: failed,
      secondPlyExecutionStatus: status,
      secondPlyFailureReasonCounts:
        observed?.secondPlyFailureReasonCounts ?? sortRecord(emptyFailureCounts()),
      secondPlyTransitionKindCounts:
        observed?.secondPlyTransitionKindCounts ?? sortRecord(emptyTransitionCounts()),
      postSecondPlyPhaseCounts:
        observed?.postSecondPlyPhaseCounts ?? sortRecord(emptyPhaseCounts()),
      postSecondPlyActorCounts:
        observed?.postSecondPlyActorCounts ?? sortRecord(emptyActorCounts()),
      secondPlyPublicActionKindCounts:
        observed?.secondPlyPublicActionKindCounts ??
        sortRecord(emptyPublicActionKindCounts()),
      secondPlyTargetKindCounts:
        observed?.secondPlyTargetKindCounts ?? sortRecord(emptyTargetKindCounts()),
      secondPlyTargetSideCounts:
        observed?.secondPlyTargetSideCounts ?? sortRecord(emptyTargetSideCounts()),
      secondPlyOutcomeRiskBucket: observed
        ? outcomeRisk({
            planned: plannedFromSource,
            observed: observedPlanned,
            failed,
          })
        : "source_mismatch",
    });
  });

  const skippedRoots = input.cFp72SkippedRoots.map((root) =>
    copySkippedRoot({
      scaffoldRunId: input.scaffoldRunId,
      suiteId: input.suiteId,
      sourceCfp72RunId,
      sourceCfp73RunId,
      root,
    }),
  );

  const capStatusCounts = {
    in_cap: secondPlyRoots.length,
    over_budget: overBudgetRoots.length,
  };
  const secondPlyExecutionStatusCounts: Record<string, number> = {};
  const secondPlyOutcomeRiskBucketCounts: Record<string, number> = {};
  const secondPlyFailureReasonCounts = emptyFailureCounts();
  const secondPlyTransitionKindCounts = emptyTransitionCounts();
  const postSecondPlyPhaseCounts = emptyPhaseCounts();
  const postSecondPlyActorCounts = emptyActorCounts();
  const secondPlyPublicActionKindCounts = emptyPublicActionKindCounts();
  const secondPlyTargetKindCounts = emptyTargetKindCounts();
  const secondPlyTargetSideCounts = emptyTargetSideCounts();
  const overBudgetReasonCounts: Record<string, number> = {};
  const casebookPresenceCounts: Record<string, number> = {};
  const primaryCasebookLabelCounts: Record<string, number> = {};
  const budgetPressureLabelCounts: Record<string, number> = {};
  const transitionContextLabelCounts: Record<string, number> = {};
  const cFp74ReadinessHintCounts: Record<string, number> = {};
  const labelCountsByCapStatus: Record<string, Record<string, number>> = {};
  const countsBySuite: Record<string, number> = {};
  const countsByPhase: Record<string, number> = {};
  const countsByRound: Record<string, number> = {};
  const countsByPolicy: Record<string, number> = {};
  const countsByFaction: Record<string, number> = {};
  const countsByDeckPreset: Record<string, number> = {};
  const countsByMatchup: Record<string, number> = {};

  const allBranchingRows = [...secondPlyRoots, ...overBudgetRoots];
  allBranchingRows.forEach((root) => {
    addCount(countsBySuite, root.suiteId);
    addCount(countsByPhase, root.phase);
    addCount(countsByRound, root.round);
    addCount(countsByPolicy, root.policyId);
    addCount(countsByFaction, root.faction);
    addCount(countsByDeckPreset, root.deckPresetId);
    addCount(countsByMatchup, root.matchupId);
    addCount(casebookPresenceCounts, root.casebookPresence);
    addCount(primaryCasebookLabelCounts, root.primaryCasebookLabel);
    addCount(budgetPressureLabelCounts, root.budgetPressureLabel);
    addCount(transitionContextLabelCounts, root.transitionContextLabel);
    addCount(cFp74ReadinessHintCounts, root.cFp74ReadinessHint);
    addNestedCount(
      labelCountsByCapStatus,
      root.capStatus,
      root.primaryCasebookLabel,
    );
  });

  secondPlyRoots.forEach((root) => {
    addCount(secondPlyExecutionStatusCounts, root.secondPlyExecutionStatus);
    addCount(secondPlyOutcomeRiskBucketCounts, root.secondPlyOutcomeRiskBucket);
    Object.entries(root.secondPlyFailureReasonCounts).forEach(([key, count]) =>
      addCount(secondPlyFailureReasonCounts, key, count),
    );
    Object.entries(root.secondPlyTransitionKindCounts).forEach(([key, count]) =>
      addCount(secondPlyTransitionKindCounts, key, count),
    );
    Object.entries(root.postSecondPlyPhaseCounts).forEach(([key, count]) =>
      addCount(postSecondPlyPhaseCounts, key, count),
    );
    Object.entries(root.postSecondPlyActorCounts).forEach(([key, count]) =>
      addCount(postSecondPlyActorCounts, key, count),
    );
    Object.entries(root.secondPlyPublicActionKindCounts).forEach(([key, count]) =>
      addCount(secondPlyPublicActionKindCounts, key, count),
    );
    Object.entries(root.secondPlyTargetKindCounts).forEach(([key, count]) =>
      addCount(secondPlyTargetKindCounts, key, count),
    );
    Object.entries(root.secondPlyTargetSideCounts).forEach(([key, count]) =>
      addCount(secondPlyTargetSideCounts, key, count),
    );
  });
  overBudgetRoots.forEach((root) =>
    addCount(overBudgetReasonCounts, root.overBudgetReason),
  );

  const completedSecondPlyPairCount = secondPlyRoots.reduce(
    (sum, root) => sum + root.completedSecondPlyPairCount,
    0,
  );
  const failedOrDeferredSecondPlyPairCount = secondPlyRoots.reduce(
    (sum, root) => sum + root.failedOrDeferredSecondPlyPairCount,
    0,
  );
  const plannedSecondPlyPairCountTotal = allBranchingRows.reduce(
    (sum, root) => sum + root.plannedSecondPlyPairCount,
    0,
  );
  const plannedSecondPlyPairCountInCap = secondPlyRoots.reduce(
    (sum, root) => sum + root.plannedSecondPlyPairCount,
    0,
  );
  const plannedSecondPlyPairCountOverBudget = overBudgetRoots.reduce(
    (sum, root) => sum + root.plannedSecondPlyPairCount,
    0,
  );

  const hasRisk =
    sourceConsistency.status !== "ready" ||
    failedOrDeferredSecondPlyPairCount > 0 ||
    secondPlyRoots.some((root) => root.secondPlyOutcomeRiskBucket !== "none");
  const scaffoldReadinessStatus: DeterminizedPimcBoundedSecondPlyScaffoldV0ReadinessStatus =
    hasRisk
      ? "not_ready"
      : overBudgetRoots.length > 0
        ? "ready_with_over_budget_skips"
        : "ready";

  return {
    scaffoldRunId: input.scaffoldRunId,
    suiteId: input.suiteId,
    benchmark: input.benchmark,
    secondPlyRoots,
    overBudgetRoots,
    skippedRoots,
    summary: {
      schemaVersion:
        "determinized-pimc-bounded-second-ply-scaffold-v0-summary-v1",
      scaffoldRunId: input.scaffoldRunId,
      suiteId: input.suiteId,
      sourceBenchmarkSuiteId: input.contractSummary.sourceBenchmarkSuiteId,
      sourceCfp68RunId: input.contractSummary.contractRunId,
      sourceCfp69RunId: input.cFp69ProbeRoots[0]?.probeRunId ?? "",
      sourceCfp70RunId: input.cFp70AvailabilitySummary.probeRunId,
      sourceCfp71RunId: input.cFp71OutcomeSummary.probeRunId,
      sourceCfp72RunId,
      sourceCfp73RunId,
      sourceArtifactReferences,
      capPolicy,
      sourceConsistency,
      scaffoldReadinessStatus,
      totalCfp72RootCount:
        input.cFp72BranchingRoots.length + input.cFp72SkippedRoots.length,
      branchingRootCount: input.cFp72BranchingRoots.length,
      inCapRootCount: secondPlyRoots.length,
      overBudgetRootCount: overBudgetRoots.length,
      inheritedSkippedRootCount: skippedRoots.length,
      inheritedSkippedRootPercentage: percentage(
        skippedRoots.length,
        input.cFp72BranchingRoots.length + input.cFp72SkippedRoots.length,
      ),
      overBudgetRootPercentageOfBranchingRoots: percentage(
        overBudgetRoots.length,
        input.cFp72BranchingRoots.length,
      ),
      plannedSecondPlyPairCountTotal,
      plannedSecondPlyPairCountInCap,
      plannedSecondPlyPairCountOverBudget,
      completedSecondPlyPairCount,
      failedOrDeferredSecondPlyPairCount,
      secondPlyExecutionStatusCounts: sortRecord(
        secondPlyExecutionStatusCounts,
      ),
      secondPlyFailureReasonCounts: sortRecord(secondPlyFailureReasonCounts),
      secondPlyTransitionKindCounts: sortRecord(secondPlyTransitionKindCounts),
      postSecondPlyPhaseCounts: sortRecord(postSecondPlyPhaseCounts),
      postSecondPlyActorCounts: sortRecord(postSecondPlyActorCounts),
      secondPlyPublicActionKindCounts: sortRecord(
        secondPlyPublicActionKindCounts,
      ),
      secondPlyTargetKindCounts: sortRecord(secondPlyTargetKindCounts),
      secondPlyTargetSideCounts: sortRecord(secondPlyTargetSideCounts),
      secondPlyOutcomeRiskBucketCounts: sortRecord(
        secondPlyOutcomeRiskBucketCounts,
      ),
      overBudgetReasonCounts: sortRecord(overBudgetReasonCounts),
      capStatusCounts: sortRecord(capStatusCounts),
      casebookPresenceCounts: sortRecord(casebookPresenceCounts),
      primaryCasebookLabelCounts: sortRecord(primaryCasebookLabelCounts),
      budgetPressureLabelCounts: sortRecord(budgetPressureLabelCounts),
      transitionContextLabelCounts: sortRecord(transitionContextLabelCounts),
      cFp74ReadinessHintCounts: sortRecord(cFp74ReadinessHintCounts),
      labelCountsByCapStatus: Object.fromEntries(
        Object.entries(labelCountsByCapStatus)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, value]) => [key, sortRecord(value)]),
      ),
      countsBySuite: sortRecord(countsBySuite),
      countsByPhase: sortRecord(countsByPhase),
      countsByRound: sortRecord(countsByRound),
      countsByPolicy: sortRecord(countsByPolicy),
      countsByFaction: sortRecord(countsByFaction),
      countsByDeckPreset: sortRecord(countsByDeckPreset),
      countsByMatchup: sortRecord(countsByMatchup),
      inheritedSkipCounters: buildInheritedSkipCounters(skippedRoots),
      overBudgetCounters: buildOverBudgetCounters(overBudgetRoots),
      explicitNonClaims:
        DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_NON_CLAIMS,
      hiddenInfoSafetyNote:
        DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_HIDDEN_INFO_SAFETY_NOTE,
      cFp75Recommendation:
        DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_CFP75_RECOMMENDATION,
    },
  };
};

export const runDeterminizedPimcBoundedSecondPlyScaffoldV0 = (
  input: RunDeterminizedPimcBoundedSecondPlyScaffoldV0Input,
): DeterminizedPimcBoundedSecondPlyScaffoldV0Result => {
  const requestedSuiteId =
    input.suiteId ?? input.suite?.id ?? input.contractSummary.suiteId;
  const scaffoldRunId =
    input.scaffoldRunId ??
    defaultDeterminizedPimcBoundedSecondPlyScaffoldV0RunId(requestedSuiteId);
  const capPolicy =
    input.capPolicy ??
    DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_DEFAULT_CAP_POLICY;
  const samplerRunId = input.contractSummary.sourceSamplerRunIds.materialization;
  const cFp68EligibleByKey = firstRecordByKey(
    requestedSuiteId,
    input.cFp68EligibleRoots,
  );
  const cFp69ProbeByKey = firstRecordByKey(
    requestedSuiteId,
    input.cFp69ProbeRoots,
  );
  const cFp70AvailabilityByKey = firstRecordByKey(
    requestedSuiteId,
    input.cFp70AvailabilityRoots,
  );
  const cFp71OutcomeByKey = firstRecordByKey(
    requestedSuiteId,
    input.cFp71OutcomeRoots,
  );
  const cFp72BranchingByKey = firstRecordByKey(
    requestedSuiteId,
    input.cFp72BranchingRoots,
  );
  const inCapKeys = new Set(
    input.cFp72BranchingRoots
      .filter(
        (root) =>
          evaluateDeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy({
            root,
            capPolicy,
            sourceConsistencyReady: true,
          }).capStatus === "in_cap",
      )
      .map((root) => keyForRoot(requestedSuiteId, root)),
  );
  const observedRoots: DeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot[] =
    [];
  const memoryStore = new Map<string, SamplerPublicTransferMemoryState>();

  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: scaffoldRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      const key = buildDeterminizedPimcBoundedSecondPlyScaffoldV0RootKey({
        ...root,
        faction: root.seats[root.seatId].faction,
        deckPresetId: root.seats[root.seatId].deckPresetId,
        phase: root.state.phase,
        round: root.state.round,
      });
      const cFp68EligibleRoot = cFp68EligibleByKey.get(key);
      const cFp72BranchingRoot = cFp72BranchingByKey.get(key);
      if (!cFp68EligibleRoot || !cFp72BranchingRoot) return;

      const memory = getSamplerPublicTransferMemoryForRoot(memoryStore, root);
      if (!inCapKeys.has(key)) {
        buildDeterminizedPimcActionAvailabilityV0InMemoryMaterializationForRoot({
          input: root,
          samplerRunId,
          memory,
        });
        return;
      }

      observedRoots.push(
        buildDeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot({
          input: root,
          samplerRunId,
          memory,
          cFp68EligibleRoot,
          cFp69ProbeRoot: cFp69ProbeByKey.get(key),
          cFp70AvailabilityRoot: cFp70AvailabilityByKey.get(key),
          cFp71OutcomeRoot: cFp71OutcomeByKey.get(key),
          cFp72BranchingRoot,
          deps: input.deps,
        }),
      );
    },
  });

  return buildDeterminizedPimcBoundedSecondPlyScaffoldV0({
    ...input,
    scaffoldRunId,
    suiteId: benchmark.summary.suiteId,
    observedRoots,
    benchmark,
    capPolicy,
  });
};
