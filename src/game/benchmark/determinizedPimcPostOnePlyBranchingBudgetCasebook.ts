import type {
  DeterminizedPimcPostOnePlyBranchingBudgetV0BudgetBucket,
  DeterminizedPimcPostOnePlyBranchingBudgetV0BranchingStatus,
  DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus,
} from "./determinizedPimcPostOnePlyBranchingBudgetV0";

export type DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootSchemaVersion =
  "determinized-pimc-post-one-ply-branching-budget-casebook-root-v1";
export type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootSchemaVersion =
  "determinized-pimc-post-one-ply-branching-budget-casebook-skipped-root-v1";
export type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummarySchemaVersion =
  "determinized-pimc-post-one-ply-branching-budget-casebook-summary-v1";

export type DeterminizedPimcPostOnePlyBranchingBudgetCasebookReadinessStatus =
  | "casebook_ready"
  | "not_ready";

export type DeterminizedPimcPostOnePlyBranchingBudgetCasebookLabel =
  | "large_budget_root"
  | "high_next_public_action_count"
  | "large_collision_bucket"
  | "high_target_expansion"
  | "round_end_context"
  | "terminal_context"
  | "status_anomaly";

export type DeterminizedPimcPostOnePlyBranchingBudgetCasebookBudgetPressureLabel =
  | "low"
  | "moderate"
  | "large"
  | "high_threshold"
  | "status_blocked";

export type DeterminizedPimcPostOnePlyBranchingBudgetCasebookTransitionContextLabel =
  | "ordinary_policy_actor"
  | "round_end_resolver_present"
  | "terminal_present"
  | "mixed_transition_context"
  | "status_blocked";

export type DeterminizedPimcPostOnePlyBranchingBudgetCasebookCfp74ReadinessHint =
  | "second_ply_scaffold_candidate"
  | "casebook_first"
  | "repair_required";

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceArtifactReference {
  label: string;
  relativePath: string;
  sha256: string;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootIdentity {
  matchupId: string;
  seed: string | number;
  mirrorGroupId?: string;
  mirrorIndex?: 0 | 1;
  step: number;
  decisionIndex: number;
  phase: string;
  round: number;
  seatId: string;
  policyId: string;
  faction: string;
  deckPresetId: string;
  rootPublicFingerprint: string;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot
  extends DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootIdentity {
  rootPublicActionCount: number;
  firstPlyPublicActionSamplePairCount: number;
  completedBranchingPairCount: number;
  failedOrDeferredBranchingPairCount: number;
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  sampleCountBranchingFailed: number;
  sampleActionMissingPairCount?: number;
  moveCommandConversionFailedPairCount?: number;
  engineCommandRejectedPairCount?: number;
  engineCommandExceptionPairCount?: number;
  actorResolutionFailedPairCount?: number;
  legalMoveGenerationFailedPairCount?: number;
  publicActionAbstractionFailedPairCount?: number;
  onePlyExecutionDeferredPairCount?: number;
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
  branchingStatusCounts: Record<string, number>;
  postOnePlyActorCounts: Record<string, number>;
  postOnePlyPhaseCounts: Record<string, number>;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot
  extends DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootIdentity {
  suiteId?: string;
  eligibilityStatus: "skipped_invalid_root";
  skipReason: string;
  invalidReason: string;
  cFp67PrimaryClassification: string;
  cFp67TransferClassification: string;
  cFp67PersistentDeficitClassification: string;
  cFp67DeficitSizeClassification: string;
  cFp67ProvenanceLabel: string;
  cfp69SkippedStatus?: string;
  cfp70SkippedStatus?: string;
  cfp71SkippedStatus?: string;
  priorDeficitCount: number;
  publicTransferMemoryVisibleCardCount: number;
  publicTransferKnownHiddenHandCount: number;
  publicTransferKnownHiddenDeckCount: number;
  publicTransferAdjustmentCount: number;
  publicTransferUncoveredDeficitCount: number;
  skipCounterDimensions: Record<string, string | number>;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary {
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  probeReadinessStatus: DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus;
  totalCfp68RootCount: number;
  branchingRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  sourceConsistency: Record<string, unknown>;
  branchingStatus: {
    failedOrDeferredBranchingPairCount: number;
    rootsWithAnyFailedOrDeferredPair: number;
    branchingBudgetBucketCounts: Record<string, number>;
    branchingRiskBucketCounts: Record<string, number>;
    probeStatusCounts: Record<string, number>;
    postOnePlyActorCounts: Record<string, number>;
    postOnePlyPhaseCounts: Record<string, number>;
  };
  branchingAggregates: {
    aggregateBranchingStatusCountsByFirstPlyPublicActionKind: Record<
      string,
      Record<string, number>
    >;
    aggregateActorCountsByFirstPlyPublicActionKind: Record<
      string,
      Record<string, number>
    >;
    aggregateBudgetBucketCountsByFirstPlyPublicActionKind: Record<
      string,
      Record<string, number>
    >;
    nextPublicActionCountStats?: Record<string, number>;
    largestNextPublicActionBucketSizeStats?: Record<string, number>;
    nextPublicActionTargetExpansionCountStats?: Record<string, number>;
  };
  skipCounters: Record<string, Record<string, number>>;
  skipCounterPercentages?: Record<
    string,
    Record<string, { count: number; percentageOfSkippedRoots: number }>
  >;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootRecord
  extends DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootIdentity {
  schemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootSchemaVersion;
  casebookRunId: string;
  suiteId: string;
  sourceCfp72RunId: string;
  rootPublicActionCount: number;
  firstPlyPublicActionSamplePairCount: number;
  completedBranchingPairCount: number;
  failedOrDeferredBranchingPairCount: number;
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountChecked: number;
  sampleCountBranchingFailed: number;
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
  branchingStatusCounts: Record<string, number>;
  postOnePlyActorCounts: Record<string, number>;
  postOnePlyPhaseCounts: Record<string, number>;
  casebookLabels: DeterminizedPimcPostOnePlyBranchingBudgetCasebookLabel[];
  primaryCasebookLabel: DeterminizedPimcPostOnePlyBranchingBudgetCasebookLabel;
  budgetPressureLabel: DeterminizedPimcPostOnePlyBranchingBudgetCasebookBudgetPressureLabel;
  transitionContextLabel: DeterminizedPimcPostOnePlyBranchingBudgetCasebookTransitionContextLabel;
  cFp74ReadinessHint: DeterminizedPimcPostOnePlyBranchingBudgetCasebookCfp74ReadinessHint;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootRecord
  extends DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootIdentity {
  schemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootSchemaVersion;
  casebookRunId: string;
  suiteId: string;
  sourceCfp72RunId: string;
  eligibilityStatus: "skipped_invalid_root";
  skipReason: string;
  invalidReason: string;
  cFp67PrimaryClassification: string;
  cFp67TransferClassification: string;
  cFp67PersistentDeficitClassification: string;
  cFp67DeficitSizeClassification: string;
  cFp67ProvenanceLabel: string;
  cfp69SkippedStatus?: string;
  cfp70SkippedStatus?: string;
  cfp71SkippedStatus?: string;
  priorDeficitCount: number;
  publicTransferMemoryVisibleCardCount: number;
  publicTransferKnownHiddenHandCount: number;
  publicTransferKnownHiddenDeckCount: number;
  publicTransferAdjustmentCount: number;
  publicTransferUncoveredDeficitCount: number;
  skipCounterDimensions: Record<string, string | number>;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceConsistency {
  status: DeterminizedPimcPostOnePlyBranchingBudgetCasebookReadinessStatus;
  sourceCfp72ProbeReadinessStatus: DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus;
  sourceCfp72SummaryNotReady: number;
  branchingRootsRead: number;
  skippedRootsRead: number;
  branchingRootCountDelta: number;
  skippedRootCountDelta: number;
  duplicateBranchingRootKeys: number;
  duplicateSkippedRootKeys: number;
  branchingRootsWithFailedOrDeferredPairs: number;
  branchingRootsWithProbeStatusAnomaly: number;
  branchingRootsWithBlockedBudgetBucket: number;
  summaryRootLargeBucketCount: number;
  observedRootLargeBucketCount: number;
  summaryRootFailedBucketCount: number;
  observedRootFailedBucketCount: number;
  summaryRootDeferredBucketCount: number;
  observedRootDeferredBucketCount: number;
  summaryRootVeryLargeBucketCount: number;
  observedRootVeryLargeBucketCount: number;
  summaryRootExtremeBucketCount: number;
  observedRootExtremeBucketCount: number;
  summaryBucketMismatchCount: number;
  missingSourceArtifactHashCount: number;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookCounters {
  bySuite: Record<string, number>;
  byPhase: Record<string, number>;
  byRound: Record<string, number>;
  byPolicy: Record<string, number>;
  byFaction: Record<string, number>;
  byDeckPreset: Record<string, number>;
  byMatchup: Record<string, number>;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookCrossCounts {
  byPhase: Record<string, Record<string, number>>;
  byRound: Record<string, Record<string, number>>;
  byPolicy: Record<string, Record<string, number>>;
  byFaction: Record<string, Record<string, number>>;
  byFirstPlyPublicActionKind: Record<string, Record<string, number>>;
  byPostOnePlyActorLabel: Record<string, Record<string, number>>;
  byPostOnePlyPhaseLabel: Record<string, Record<string, number>>;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummary {
  schemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummarySchemaVersion;
  casebookRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp72RunId: string;
  sourceCfp72ArtifactReferences: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceArtifactReference[];
  totalCfp72RootCount: number;
  branchingRootCount: number;
  casebookRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  sourceConsistency: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceConsistency;
  casebookReadinessStatus: DeterminizedPimcPostOnePlyBranchingBudgetCasebookReadinessStatus;
  casebookLabelCounts: Record<string, number>;
  primaryCasebookLabelCounts: Record<string, number>;
  budgetPressureLabelCounts: Record<string, number>;
  transitionContextLabelCounts: Record<string, number>;
  cFp74ReadinessHintCounts: Record<string, number>;
  casebookRootPercentageOfBranchingRoots: number;
  largeBudgetRootCount: number;
  highNextPublicActionCountRootCount: number;
  largeCollisionBucketRootCount: number;
  highTargetExpansionRootCount: number;
  roundEndContextRootCount: number;
  terminalContextRootCount: number;
  statusAnomalyRootCount: number;
  casebookCounters: DeterminizedPimcPostOnePlyBranchingBudgetCasebookCounters;
  primaryCasebookLabelCrossCounts: DeterminizedPimcPostOnePlyBranchingBudgetCasebookCrossCounts;
  sourceCfp72FirstPlyPublicActionKindAggregates: {
    perRootAttribution: "not_available_in_cfp72_compact_root_rows";
    aggregateBranchingStatusCountsByKind: Record<string, Record<string, number>>;
    aggregateActorCountsByKind: Record<string, Record<string, number>>;
    aggregateBudgetBucketCountsByKind: Record<string, Record<string, number>>;
  };
  skipCounters: Record<string, Record<string, number>>;
  skipCounterPercentages?: Record<
    string,
    Record<string, { count: number; percentageOfSkippedRoots: number }>
  >;
  explicitNonClaims: readonly string[];
  hiddenInfoSafetyNote: string;
  cFp74Recommendation: string;
}

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookResult {
  casebookRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp72RunId: string;
  casebookRoots: DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootRecord[];
  skippedRoots: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootRecord[];
  summary: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummary;
}

export interface BuildDeterminizedPimcPostOnePlyBranchingBudgetCasebookInput {
  casebookRunId: string;
  suiteId: string;
  sourceCfp72Summary: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary;
  sourceCfp72BranchingRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot[];
  sourceCfp72SkippedRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot[];
  sourceCfp72ArtifactReferences?: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceArtifactReference[];
}

const casebookLabelPriority: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookLabel[] =
  [
    "status_anomaly",
    "large_budget_root",
    "high_next_public_action_count",
    "large_collision_bucket",
    "high_target_expansion",
    "round_end_context",
    "terminal_context",
  ];

const blockedBudgetBuckets = new Set<string>([
  "failed",
  "deferred",
  "very_large",
  "extreme",
]);

export const DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_CASEBOOK_NON_CLAIMS =
  [
    "cFp73 classifies branching and transition shape only.",
    "No second ply was run.",
    "No rollout was run.",
    "No action quality estimate was computed.",
    "No ordering or selection output was produced.",
    "No outcome-probability estimate was produced.",
    "No product AI behavior changed.",
    "Skipped roots are carried beside the casebook rows.",
  ] as const;

export const DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_CASEBOOK_HIDDEN_INFO_SAFETY_NOTE =
  "cFp73 reads committed cFp72 scalar artifacts and writes root metadata, counters, bucket labels, source hashes, and skip counters only. It excludes private identities, sampled payloads, engine traces, concrete move payloads, ranking outputs, estimates, and product AI wiring.";

export const defaultDeterminizedPimcPostOnePlyBranchingBudgetCasebookRunId = (
  suiteId: string,
) =>
  `${suiteId}:determinized-pimc-post-one-ply-branching-budget-casebook:cFp73`;

const emptyCounters = (): DeterminizedPimcPostOnePlyBranchingBudgetCasebookCounters => ({
  bySuite: {},
  byPhase: {},
  byRound: {},
  byPolicy: {},
  byFaction: {},
  byDeckPreset: {},
  byMatchup: {},
});

const emptyCrossCounts =
  (): DeterminizedPimcPostOnePlyBranchingBudgetCasebookCrossCounts => ({
    byPhase: {},
    byRound: {},
    byPolicy: {},
    byFaction: {},
    byFirstPlyPublicActionKind: {},
    byPostOnePlyActorLabel: {},
    byPostOnePlyPhaseLabel: {},
  });

const increment = (
  record: Record<string, number>,
  key: string | number,
  amount = 1,
) => {
  const normalizedKey = String(key);
  record[normalizedKey] = (record[normalizedKey] ?? 0) + amount;
};

const incrementNested = (
  record: Record<string, Record<string, number>>,
  outer: string,
  inner: string | number,
) => {
  record[outer] ??= {};
  increment(record[outer], inner);
};

const percentage = (count: number, total: number) =>
  total === 0 ? 0 : Number(((count / total) * 100).toFixed(3));

export const buildDeterminizedPimcPostOnePlyBranchingBudgetCasebookRootKey = (
  suiteId: string,
  root: DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootIdentity,
) =>
  [
    suiteId,
    root.matchupId,
    root.seed,
    root.mirrorGroupId ?? "",
    root.mirrorIndex ?? "",
    root.step,
    root.decisionIndex,
    root.phase,
    root.round,
    root.seatId,
    root.policyId,
    root.faction,
    root.deckPresetId,
    root.rootPublicFingerprint,
  ].join("|");

const duplicateKeyCount = (
  suiteId: string,
  roots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootIdentity[],
) => {
  const seen = new Set<string>();
  let duplicates = 0;
  for (const root of roots) {
    const key = buildDeterminizedPimcPostOnePlyBranchingBudgetCasebookRootKey(
      suiteId,
      root,
    );
    if (seen.has(key)) {
      duplicates += 1;
    } else {
      seen.add(key);
    }
  }
  return duplicates;
};

const countByBranchingBucket = (
  roots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot[],
  bucket: string,
) => roots.filter((root) => root.branchingBudgetBucket === bucket).length;

const hasStatusAnomaly = (
  root: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot,
) => {
  const nonCompletedStatusCount = Object.entries(root.branchingStatusCounts).some(
    ([status, count]) => status !== "completed" && count > 0,
  );
  return (
    root.failedOrDeferredBranchingPairCount > 0 ||
    root.probeStatus !== "completed" ||
    blockedBudgetBuckets.has(root.branchingBudgetBucket) ||
    (root.sampleActionMissingPairCount ?? 0) > 0 ||
    (root.moveCommandConversionFailedPairCount ?? 0) > 0 ||
    (root.engineCommandRejectedPairCount ?? 0) > 0 ||
    (root.engineCommandExceptionPairCount ?? 0) > 0 ||
    (root.actorResolutionFailedPairCount ?? 0) > 0 ||
    (root.legalMoveGenerationFailedPairCount ?? 0) > 0 ||
    (root.publicActionAbstractionFailedPairCount ?? 0) > 0 ||
    (root.onePlyExecutionDeferredPairCount ?? 0) > 0 ||
    nonCompletedStatusCount
  );
};

const labelsForRoot = (
  root: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot,
) => {
  const labels = new Set<DeterminizedPimcPostOnePlyBranchingBudgetCasebookLabel>();
  if (hasStatusAnomaly(root)) labels.add("status_anomaly");
  if (root.branchingBudgetBucket === "large") labels.add("large_budget_root");
  if (root.nextPublicActionCountMax >= 12) {
    labels.add("high_next_public_action_count");
  }
  if (root.largestNextPublicActionBucketSizeMax >= 16) {
    labels.add("large_collision_bucket");
  }
  if (root.nextPublicActionTargetExpansionCountMax >= 10) {
    labels.add("high_target_expansion");
  }
  if (
    (root.postOnePlyActorCounts.system_round_end_resolver ?? 0) > 0 ||
    (root.postOnePlyPhaseCounts.round_end ?? 0) > 0
  ) {
    labels.add("round_end_context");
  }
  if (
    (root.postOnePlyActorCounts.terminal_game_end ?? 0) > 0 ||
    (root.postOnePlyPhaseCounts.game_end ?? 0) > 0
  ) {
    labels.add("terminal_context");
  }
  return casebookLabelPriority.filter((label) => labels.has(label));
};

const budgetPressureLabelForLabels = (
  labels: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookLabel[],
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookBudgetPressureLabel => {
  if (labels.includes("status_anomaly")) return "status_blocked";
  if (
    labels.includes("high_next_public_action_count") ||
    labels.includes("large_collision_bucket") ||
    labels.includes("high_target_expansion")
  ) {
    return "high_threshold";
  }
  if (labels.includes("large_budget_root")) return "large";
  if (
    labels.includes("round_end_context") ||
    labels.includes("terminal_context")
  ) {
    return "moderate";
  }
  return "low";
};

const transitionContextLabelForLabels = (
  labels: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookLabel[],
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookTransitionContextLabel => {
  if (labels.includes("status_anomaly")) return "status_blocked";
  const hasRoundEnd = labels.includes("round_end_context");
  const hasTerminal = labels.includes("terminal_context");
  if (hasRoundEnd && hasTerminal) return "mixed_transition_context";
  if (hasTerminal) return "terminal_present";
  if (hasRoundEnd) return "round_end_resolver_present";
  return "ordinary_policy_actor";
};

const readinessHintForLabels = (
  labels: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookLabel[],
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookCfp74ReadinessHint => {
  if (labels.includes("status_anomaly")) return "repair_required";
  if (
    labels.includes("high_next_public_action_count") ||
    labels.includes("large_collision_bucket") ||
    labels.includes("high_target_expansion")
  ) {
    return "casebook_first";
  }
  return "second_ply_scaffold_candidate";
};

const postOnePlyActorLabelForRoot = (
  root: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot,
) => {
  const actorEntries = Object.entries(root.postOnePlyActorCounts).filter(
    ([, count]) => count > 0,
  );
  if (actorEntries.length === 0) return "none";
  if (actorEntries.length > 1) return "mixed";
  return actorEntries[0]?.[0] ?? "none";
};

const postOnePlyPhaseLabelForRoot = (
  root: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot,
) => {
  const phaseEntries = Object.entries(root.postOnePlyPhaseCounts).filter(
    ([, count]) => count > 0,
  );
  if (phaseEntries.length === 0) return "none";
  if (phaseEntries.length > 1) return "mixed";
  return phaseEntries[0]?.[0] ?? "none";
};

const copyRootScalars = (
  root: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot,
) => ({
  matchupId: root.matchupId,
  seed: root.seed,
  ...(root.mirrorGroupId === undefined ? {} : { mirrorGroupId: root.mirrorGroupId }),
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

const buildCasebookRoot = (
  input: BuildDeterminizedPimcPostOnePlyBranchingBudgetCasebookInput,
  root: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot,
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootRecord | null => {
  const labels = labelsForRoot(root);
  if (labels.length === 0) return null;
  const budgetPressureLabel = budgetPressureLabelForLabels(labels);
  const transitionContextLabel = transitionContextLabelForLabels(labels);

  return {
    schemaVersion:
      "determinized-pimc-post-one-ply-branching-budget-casebook-root-v1",
    casebookRunId: input.casebookRunId,
    suiteId: input.suiteId,
    sourceCfp72RunId: input.sourceCfp72Summary.probeRunId,
    ...copyRootScalars(root),
    rootPublicActionCount: root.rootPublicActionCount,
    firstPlyPublicActionSamplePairCount:
      root.firstPlyPublicActionSamplePairCount,
    completedBranchingPairCount: root.completedBranchingPairCount,
    failedOrDeferredBranchingPairCount:
      root.failedOrDeferredBranchingPairCount,
    sampleCountRequested: root.sampleCountRequested,
    sampleCountGenerated: root.sampleCountGenerated,
    sampleCountChecked: root.sampleCountChecked,
    sampleCountBranchingFailed: root.sampleCountBranchingFailed,
    nextLegalMoveCountMin: root.nextLegalMoveCountMin,
    nextLegalMoveCountMax: root.nextLegalMoveCountMax,
    nextLegalMoveCountAverage: root.nextLegalMoveCountAverage,
    nextPublicActionCountMin: root.nextPublicActionCountMin,
    nextPublicActionCountMax: root.nextPublicActionCountMax,
    nextPublicActionCountAverage: root.nextPublicActionCountAverage,
    nextPublicActionCollisionCountMin: root.nextPublicActionCollisionCountMin,
    nextPublicActionCollisionCountMax: root.nextPublicActionCollisionCountMax,
    nextPublicActionCollisionCountAverage:
      root.nextPublicActionCollisionCountAverage,
    largestNextPublicActionBucketSizeMax:
      root.largestNextPublicActionBucketSizeMax,
    nextPublicActionTargetExpansionCountMin:
      root.nextPublicActionTargetExpansionCountMin,
    nextPublicActionTargetExpansionCountMax:
      root.nextPublicActionTargetExpansionCountMax,
    nextPublicActionTargetExpansionCountAverage:
      root.nextPublicActionTargetExpansionCountAverage,
    postOnePlyPublicActionBudgetTotal:
      root.postOnePlyPublicActionBudgetTotal,
    postOnePlyPublicActionBudgetAverage:
      root.postOnePlyPublicActionBudgetAverage,
    branchingBudgetBucket: root.branchingBudgetBucket,
    branchingRiskBucket: root.branchingRiskBucket,
    probeStatus: root.probeStatus,
    branchingStatusCounts: { ...root.branchingStatusCounts },
    postOnePlyActorCounts: { ...root.postOnePlyActorCounts },
    postOnePlyPhaseCounts: { ...root.postOnePlyPhaseCounts },
    casebookLabels: labels,
    primaryCasebookLabel: labels[0],
    budgetPressureLabel,
    transitionContextLabel,
    cFp74ReadinessHint: readinessHintForLabels(labels),
  };
};

const buildSkippedRoot = (
  input: BuildDeterminizedPimcPostOnePlyBranchingBudgetCasebookInput,
  root: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot,
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootRecord => ({
  schemaVersion:
    "determinized-pimc-post-one-ply-branching-budget-casebook-skipped-root-v1",
  casebookRunId: input.casebookRunId,
  suiteId: root.suiteId ?? input.suiteId,
  sourceCfp72RunId: input.sourceCfp72Summary.probeRunId,
  matchupId: root.matchupId,
  seed: root.seed,
  ...(root.mirrorGroupId === undefined ? {} : { mirrorGroupId: root.mirrorGroupId }),
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
  eligibilityStatus: root.eligibilityStatus,
  skipReason: root.skipReason,
  invalidReason: root.invalidReason,
  cFp67PrimaryClassification: root.cFp67PrimaryClassification,
  cFp67TransferClassification: root.cFp67TransferClassification,
  cFp67PersistentDeficitClassification:
    root.cFp67PersistentDeficitClassification,
  cFp67DeficitSizeClassification: root.cFp67DeficitSizeClassification,
  cFp67ProvenanceLabel: root.cFp67ProvenanceLabel,
  ...(root.cfp69SkippedStatus === undefined
    ? {}
    : { cfp69SkippedStatus: root.cfp69SkippedStatus }),
  ...(root.cfp70SkippedStatus === undefined
    ? {}
    : { cfp70SkippedStatus: root.cfp70SkippedStatus }),
  ...(root.cfp71SkippedStatus === undefined
    ? {}
    : { cfp71SkippedStatus: root.cfp71SkippedStatus }),
  priorDeficitCount: root.priorDeficitCount,
  publicTransferMemoryVisibleCardCount:
    root.publicTransferMemoryVisibleCardCount,
  publicTransferKnownHiddenHandCount:
    root.publicTransferKnownHiddenHandCount,
  publicTransferKnownHiddenDeckCount:
    root.publicTransferKnownHiddenDeckCount,
  publicTransferAdjustmentCount: root.publicTransferAdjustmentCount,
  publicTransferUncoveredDeficitCount:
    root.publicTransferUncoveredDeficitCount,
  skipCounterDimensions: { ...root.skipCounterDimensions },
});

const buildSourceConsistency = (
  input: BuildDeterminizedPimcPostOnePlyBranchingBudgetCasebookInput,
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceConsistency => {
  const summary = input.sourceCfp72Summary;
  const branchingRoots = input.sourceCfp72BranchingRoots;
  const skippedRoots = input.sourceCfp72SkippedRoots;
  const summaryBuckets = summary.branchingStatus.branchingBudgetBucketCounts;
  const summaryRootLargeBucketCount = summaryBuckets.large ?? 0;
  const observedRootLargeBucketCount = countByBranchingBucket(branchingRoots, "large");
  const summaryRootFailedBucketCount = summaryBuckets.failed ?? 0;
  const observedRootFailedBucketCount = countByBranchingBucket(branchingRoots, "failed");
  const summaryRootDeferredBucketCount = summaryBuckets.deferred ?? 0;
  const observedRootDeferredBucketCount = countByBranchingBucket(
    branchingRoots,
    "deferred",
  );
  const summaryRootVeryLargeBucketCount = summaryBuckets.very_large ?? 0;
  const observedRootVeryLargeBucketCount = countByBranchingBucket(
    branchingRoots,
    "very_large",
  );
  const summaryRootExtremeBucketCount = summaryBuckets.extreme ?? 0;
  const observedRootExtremeBucketCount = countByBranchingBucket(
    branchingRoots,
    "extreme",
  );
  const summaryBucketMismatchCount = [
    summaryRootLargeBucketCount === observedRootLargeBucketCount,
    summaryRootFailedBucketCount === observedRootFailedBucketCount,
    summaryRootDeferredBucketCount === observedRootDeferredBucketCount,
    summaryRootVeryLargeBucketCount === observedRootVeryLargeBucketCount,
    summaryRootExtremeBucketCount === observedRootExtremeBucketCount,
  ].filter((matches) => !matches).length;
  const branchingRootsWithFailedOrDeferredPairs = branchingRoots.filter(
    (root) => root.failedOrDeferredBranchingPairCount > 0,
  ).length;
  const branchingRootsWithProbeStatusAnomaly = branchingRoots.filter(
    (root) => root.probeStatus !== "completed",
  ).length;
  const branchingRootsWithBlockedBudgetBucket = branchingRoots.filter((root) =>
    blockedBudgetBuckets.has(root.branchingBudgetBucket),
  ).length;
  const missingSourceArtifactHashCount = (
    input.sourceCfp72ArtifactReferences ?? []
  ).filter((reference) => reference.sha256.length === 0).length;

  const readinessIssues = [
    summary.probeReadinessStatus !== "probe_ready" ? 1 : 0,
    Math.abs(summary.branchingRootCount - branchingRoots.length),
    Math.abs(summary.skippedRootCount - skippedRoots.length),
    duplicateKeyCount(input.suiteId, branchingRoots),
    duplicateKeyCount(input.suiteId, skippedRoots),
    branchingRootsWithFailedOrDeferredPairs,
    branchingRootsWithProbeStatusAnomaly,
    branchingRootsWithBlockedBudgetBucket,
    summary.branchingStatus.failedOrDeferredBranchingPairCount,
    summary.branchingStatus.rootsWithAnyFailedOrDeferredPair,
    summaryBucketMismatchCount,
    missingSourceArtifactHashCount,
  ].reduce((total, count) => total + count, 0);

  return {
    status: readinessIssues === 0 ? "casebook_ready" : "not_ready",
    sourceCfp72ProbeReadinessStatus: summary.probeReadinessStatus,
    sourceCfp72SummaryNotReady:
      summary.probeReadinessStatus === "probe_ready" ? 0 : 1,
    branchingRootsRead: branchingRoots.length,
    skippedRootsRead: skippedRoots.length,
    branchingRootCountDelta: branchingRoots.length - summary.branchingRootCount,
    skippedRootCountDelta: skippedRoots.length - summary.skippedRootCount,
    duplicateBranchingRootKeys: duplicateKeyCount(input.suiteId, branchingRoots),
    duplicateSkippedRootKeys: duplicateKeyCount(input.suiteId, skippedRoots),
    branchingRootsWithFailedOrDeferredPairs,
    branchingRootsWithProbeStatusAnomaly,
    branchingRootsWithBlockedBudgetBucket,
    summaryRootLargeBucketCount,
    observedRootLargeBucketCount,
    summaryRootFailedBucketCount,
    observedRootFailedBucketCount,
    summaryRootDeferredBucketCount,
    observedRootDeferredBucketCount,
    summaryRootVeryLargeBucketCount,
    observedRootVeryLargeBucketCount,
    summaryRootExtremeBucketCount,
    observedRootExtremeBucketCount,
    summaryBucketMismatchCount,
    missingSourceArtifactHashCount,
  };
};

const cFp74RecommendationForSummary = (
  sourceConsistency: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceConsistency,
  summary: Pick<
    DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummary,
    | "branchingRootCount"
    | "statusAnomalyRootCount"
    | "budgetPressureLabelCounts"
  >,
) => {
  if (
    sourceConsistency.status !== "casebook_ready" ||
    summary.statusAnomalyRootCount > 0 ||
    sourceConsistency.observedRootVeryLargeBucketCount > 0 ||
    sourceConsistency.observedRootExtremeBucketCount > 0
  ) {
    return "cFp74 should repair cFp72/cFp73 scalar consistency before any deeper probe.";
  }
  const highThresholdCount =
    summary.budgetPressureLabelCounts.high_threshold ?? 0;
  const highThresholdPercentage = percentage(
    highThresholdCount,
    summary.branchingRootCount,
  );
  if (highThresholdPercentage >= 10) {
    return "cFp74 should run a benchmark-only high-threshold casebook before any second-ply scaffold.";
  }
  return "cFp74 can be a benchmark-only bounded second-ply public-action scaffold with explicit budget caps and skipped-over-budget counters; it should still avoid rollout, action quality, ranking, move choice, and product AI wiring.";
};

export const buildDeterminizedPimcPostOnePlyBranchingBudgetCasebook = (
  input: BuildDeterminizedPimcPostOnePlyBranchingBudgetCasebookInput,
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookResult => {
  const casebookRoots = input.sourceCfp72BranchingRoots
    .map((root) => buildCasebookRoot(input, root))
    .filter(
      (
        root,
      ): root is DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootRecord =>
        root !== null,
    );
  const skippedRoots = input.sourceCfp72SkippedRoots.map((root) =>
    buildSkippedRoot(input, root),
  );
  const sourceConsistency = buildSourceConsistency(input);
  const casebookLabelCounts: Record<string, number> = {};
  const primaryCasebookLabelCounts: Record<string, number> = {};
  const budgetPressureLabelCounts: Record<string, number> = {};
  const transitionContextLabelCounts: Record<string, number> = {};
  const cFp74ReadinessHintCounts: Record<string, number> = {};
  const casebookCounters = emptyCounters();
  const primaryCasebookLabelCrossCounts = emptyCrossCounts();

  for (const root of casebookRoots) {
    for (const label of root.casebookLabels) increment(casebookLabelCounts, label);
    increment(primaryCasebookLabelCounts, root.primaryCasebookLabel);
    increment(budgetPressureLabelCounts, root.budgetPressureLabel);
    increment(transitionContextLabelCounts, root.transitionContextLabel);
    increment(cFp74ReadinessHintCounts, root.cFp74ReadinessHint);
    increment(casebookCounters.bySuite, root.suiteId);
    increment(casebookCounters.byPhase, root.phase);
    increment(casebookCounters.byRound, root.round);
    increment(casebookCounters.byPolicy, root.policyId);
    increment(casebookCounters.byFaction, root.faction);
    increment(casebookCounters.byDeckPreset, root.deckPresetId);
    increment(casebookCounters.byMatchup, root.matchupId);
    incrementNested(
      primaryCasebookLabelCrossCounts.byPhase,
      root.primaryCasebookLabel,
      root.phase,
    );
    incrementNested(
      primaryCasebookLabelCrossCounts.byRound,
      root.primaryCasebookLabel,
      root.round,
    );
    incrementNested(
      primaryCasebookLabelCrossCounts.byPolicy,
      root.primaryCasebookLabel,
      root.policyId,
    );
    incrementNested(
      primaryCasebookLabelCrossCounts.byFaction,
      root.primaryCasebookLabel,
      root.faction,
    );
    incrementNested(
      primaryCasebookLabelCrossCounts.byPostOnePlyActorLabel,
      root.primaryCasebookLabel,
      postOnePlyActorLabelForRoot(root),
    );
    incrementNested(
      primaryCasebookLabelCrossCounts.byPostOnePlyPhaseLabel,
      root.primaryCasebookLabel,
      postOnePlyPhaseLabelForRoot(root),
    );
  }

  const partialSummary = {
    branchingRootCount: input.sourceCfp72Summary.branchingRootCount,
    statusAnomalyRootCount: casebookLabelCounts.status_anomaly ?? 0,
    budgetPressureLabelCounts,
  };
  const summary: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummary = {
    schemaVersion:
      "determinized-pimc-post-one-ply-branching-budget-casebook-summary-v1",
    casebookRunId: input.casebookRunId,
    suiteId: input.suiteId,
    sourceBenchmarkSuiteId: input.sourceCfp72Summary.sourceBenchmarkSuiteId,
    sourceCfp72RunId: input.sourceCfp72Summary.probeRunId,
    sourceCfp72ArtifactReferences: input.sourceCfp72ArtifactReferences ?? [],
    totalCfp72RootCount:
      input.sourceCfp72Summary.branchingRootCount +
      input.sourceCfp72Summary.skippedRootCount,
    branchingRootCount: input.sourceCfp72Summary.branchingRootCount,
    casebookRootCount: casebookRoots.length,
    skippedRootCount: skippedRoots.length,
    skippedRootPercentage: input.sourceCfp72Summary.skippedRootPercentage,
    sourceConsistency,
    casebookReadinessStatus: sourceConsistency.status,
    casebookLabelCounts,
    primaryCasebookLabelCounts,
    budgetPressureLabelCounts,
    transitionContextLabelCounts,
    cFp74ReadinessHintCounts,
    casebookRootPercentageOfBranchingRoots: percentage(
      casebookRoots.length,
      input.sourceCfp72Summary.branchingRootCount,
    ),
    largeBudgetRootCount: casebookLabelCounts.large_budget_root ?? 0,
    highNextPublicActionCountRootCount:
      casebookLabelCounts.high_next_public_action_count ?? 0,
    largeCollisionBucketRootCount:
      casebookLabelCounts.large_collision_bucket ?? 0,
    highTargetExpansionRootCount:
      casebookLabelCounts.high_target_expansion ?? 0,
    roundEndContextRootCount: casebookLabelCounts.round_end_context ?? 0,
    terminalContextRootCount: casebookLabelCounts.terminal_context ?? 0,
    statusAnomalyRootCount: casebookLabelCounts.status_anomaly ?? 0,
    casebookCounters,
    primaryCasebookLabelCrossCounts,
    sourceCfp72FirstPlyPublicActionKindAggregates: {
      perRootAttribution: "not_available_in_cfp72_compact_root_rows",
      aggregateBranchingStatusCountsByKind:
        input.sourceCfp72Summary.branchingAggregates
          .aggregateBranchingStatusCountsByFirstPlyPublicActionKind,
      aggregateActorCountsByKind:
        input.sourceCfp72Summary.branchingAggregates
          .aggregateActorCountsByFirstPlyPublicActionKind,
      aggregateBudgetBucketCountsByKind:
        input.sourceCfp72Summary.branchingAggregates
          .aggregateBudgetBucketCountsByFirstPlyPublicActionKind,
    },
    skipCounters: input.sourceCfp72Summary.skipCounters,
    ...(input.sourceCfp72Summary.skipCounterPercentages === undefined
      ? {}
      : {
          skipCounterPercentages:
            input.sourceCfp72Summary.skipCounterPercentages,
        }),
    explicitNonClaims:
      DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_CASEBOOK_NON_CLAIMS,
    hiddenInfoSafetyNote:
      DETERMINIZED_PIMC_POST_ONE_PLY_BRANCHING_BUDGET_CASEBOOK_HIDDEN_INFO_SAFETY_NOTE,
    cFp74Recommendation: cFp74RecommendationForSummary(
      sourceConsistency,
      partialSummary,
    ),
  };

  return {
    casebookRunId: input.casebookRunId,
    suiteId: input.suiteId,
    sourceBenchmarkSuiteId: input.sourceCfp72Summary.sourceBenchmarkSuiteId,
    sourceCfp72RunId: input.sourceCfp72Summary.probeRunId,
    casebookRoots,
    skippedRoots,
    summary,
  };
};
