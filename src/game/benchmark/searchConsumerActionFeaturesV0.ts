import {
  buildDeterminizedProbeContractRootKey,
  type DeterminizedProbeContractRootIdentity,
  type DeterminizedProbeContractSourceArtifactReference,
} from "./determinizedProbeContract";

export type SearchConsumerActionFeaturesV0RootFeatureSchemaVersion =
  "search-consumer-action-features-v0-root-feature-v1";
export type SearchConsumerActionFeaturesV0ActionFeatureSchemaVersion =
  "search-consumer-action-features-v0-action-feature-v1";
export type SearchConsumerActionFeaturesV0ActionFeatureGapSchemaVersion =
  "search-consumer-action-features-v0-action-feature-gap-v1";
export type SearchConsumerActionFeaturesV0SkippedRootSchemaVersion =
  "search-consumer-action-features-v0-skipped-root-v1";
export type SearchConsumerActionFeaturesV0SummarySchemaVersion =
  "search-consumer-action-features-v0-summary-v1";

export type SearchConsumerActionFeaturesV0ConsumerReadinessStatus =
  | "features_ready"
  | "features_ready_with_gap"
  | "action_feature_source_gap"
  | "source_consistency_failed";

export type SearchConsumerActionFeaturesV0SourceArtifactReference =
  DeterminizedProbeContractSourceArtifactReference;

export type SearchConsumerActionFeaturesV0RootIdentity =
  DeterminizedProbeContractRootIdentity;

export const buildSearchConsumerActionFeaturesV0RootKey =
  buildDeterminizedProbeContractRootKey;

// ---------------------------------------------------------------------------
// Source input record shapes (subset of fields consumed from committed
// cFp68-cFp74 artifacts). cFp76 reads these artifacts but never mutates them.
// ---------------------------------------------------------------------------

export interface SearchConsumerActionFeaturesV0Cfp68EligibleRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  eligibilityStatus: "eligible_valid_root";
}

export interface SearchConsumerActionFeaturesV0Cfp68SkippedRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  eligibilityStatus: "skipped_invalid_root";
}

export interface SearchConsumerActionFeaturesV0Cfp69ProbeRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  probeStatus: string;
  publicActionCount: number;
  publicActionKindCounts: Record<string, number>;
  targetKindCounts: Record<string, number>;
  targetSideCounts: Record<string, number>;
}

export interface SearchConsumerActionFeaturesV0Cfp69SkippedRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  eligibilityStatus: "skipped_invalid_root";
}

export interface SearchConsumerActionFeaturesV0Cfp70AvailabilityRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  probeStatus: string;
  availabilityDisagreementCount: number;
  availabilityRiskBucket: string;
}

export interface SearchConsumerActionFeaturesV0Cfp70SkippedRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  eligibilityStatus: "skipped_invalid_root";
}

export interface SearchConsumerActionFeaturesV0Cfp71OutcomeRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  probeStatus: string;
  publicActionSamplePairCount: number;
  failedOrDeferredPairCount: number;
  outcomeDivergenceCount: number;
  outcomeRiskBucket: string;
  publicOutcomeKindCounts: Record<string, number>;
  transitionKindCounts: Record<string, number>;
}

export interface SearchConsumerActionFeaturesV0Cfp71SkippedRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  eligibilityStatus: "skipped_invalid_root";
}

export interface SearchConsumerActionFeaturesV0Cfp72BranchingRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  probeStatus: string;
  failedOrDeferredBranchingPairCount: number;
  postOnePlyPublicActionBudgetTotal: number;
  postOnePlyPublicActionBudgetAverage: number;
  branchingBudgetBucket: string;
  branchingRiskBucket: string;
  nextPublicActionCountMax: number;
  largestNextPublicActionBucketSizeMax: number;
  postOnePlyActorCounts: Record<string, number>;
  postOnePlyPhaseCounts: Record<string, number>;
}

export interface SearchConsumerActionFeaturesV0Cfp72SkippedRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  eligibilityStatus: "skipped_invalid_root";
}

export interface SearchConsumerActionFeaturesV0Cfp73CasebookRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  primaryCasebookLabel: string;
}

export interface SearchConsumerActionFeaturesV0Cfp74SecondPlyRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  capStatus: "in_cap";
  casebookPresence: string;
  primaryCasebookLabel?: string;
  budgetPressureLabel?: string;
  transitionContextLabel?: string;
  plannedSecondPlyPairCount: number;
  completedSecondPlyPairCount: number;
  failedOrDeferredSecondPlyPairCount: number;
  secondPlyExecutionStatus: string;
  secondPlyOutcomeRiskBucket: string;
  secondPlyTransitionKindCounts: Record<string, number>;
  secondPlyPublicActionKindCounts: Record<string, number>;
  secondPlyTargetKindCounts: Record<string, number>;
  secondPlyTargetSideCounts: Record<string, number>;
}

export interface SearchConsumerActionFeaturesV0Cfp74OverBudgetRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  capStatus: "over_budget";
  casebookPresence: string;
  primaryCasebookLabel?: string;
  budgetPressureLabel?: string;
  transitionContextLabel?: string;
  plannedSecondPlyPairCount: number;
  overBudgetReason: string;
}

export interface SearchConsumerActionFeaturesV0Cfp74SkippedRootInput
  extends SearchConsumerActionFeaturesV0RootIdentity {
  eligibilityStatus: "skipped_invalid_root";
  skipReason: string;
  invalidReason: string;
  cFp67PrimaryClassification?: string;
  cFp67TransferClassification?: string;
  cFp67PersistentDeficitClassification?: string;
  cFp67DeficitSizeClassification?: string;
  cFp67ProvenanceLabel?: string;
  skipStage: string;
  skipCounterDimensions: Record<string, string | number>;
}

// ---------------------------------------------------------------------------
// Minimal source summary shapes consumed for source consistency checks.
// ---------------------------------------------------------------------------

export interface SearchConsumerActionFeaturesV0Cfp68SummaryInput {
  contractStatus: string;
  eligibleRootCount: number;
  invalidRootCountFromCfp67: number;
}

export interface SearchConsumerActionFeaturesV0Cfp69SummaryInput {
  probeReadinessStatus: string;
  probeRootCount: number;
  skippedRootCount: number;
}

export interface SearchConsumerActionFeaturesV0Cfp70SummaryInput {
  probeReadinessStatus: string;
  availabilityRootCount: number;
  skippedRootCount: number;
}

export interface SearchConsumerActionFeaturesV0Cfp71SummaryInput {
  probeReadinessStatus: string;
  outcomeRootCount: number;
  skippedRootCount: number;
}

export interface SearchConsumerActionFeaturesV0Cfp72SummaryInput {
  probeReadinessStatus: string;
  branchingRootCount: number;
  skippedRootCount: number;
}

export interface SearchConsumerActionFeaturesV0Cfp74SummaryInput {
  scaffoldReadinessStatus: string;
  inCapRootCount: number;
  overBudgetRootCount: number;
  inheritedSkippedRootCount: number;
  failedOrDeferredSecondPlyPairCount: number;
  sourceConsistency: {
    inCapRootsNotObserved: number;
  };
}

// ---------------------------------------------------------------------------
// Source consistency
// ---------------------------------------------------------------------------

export interface SearchConsumerActionFeaturesV0SourceConsistency {
  status: "ready" | "not_ready";
  cFp68ContractStatus: string;
  cFp69ProbeReadinessStatus: string;
  cFp70ProbeReadinessStatus: string;
  cFp71ProbeReadinessStatus: string;
  cFp72ProbeReadinessStatus: string;
  cFp74ScaffoldReadinessStatus: string;
  cFp68EligibleRootCount: number;
  cFp69ProbeRootCount: number;
  cFp70AvailabilityRootCount: number;
  cFp71OutcomeRootCount: number;
  cFp72BranchingRootCount: number;
  cFp74InCapRootCount: number;
  cFp74OverBudgetRootCount: number;
  cfp68Cfp69EligibleRootCountDelta: number;
  cfp68Cfp70EligibleRootCountDelta: number;
  cfp68Cfp71EligibleRootCountDelta: number;
  cfp68Cfp72EligibleRootCountDelta: number;
  cfp74InCapPlusOverBudgetVsCfp72BranchingDelta: number;
  cFp68SkippedRootCount: number;
  cFp69SkippedRootCount: number;
  cFp70SkippedRootCount: number;
  cFp71SkippedRootCount: number;
  cFp72SkippedRootCount: number;
  cFp74InheritedSkippedRootCount: number;
  cfp68Cfp69SkippedRootCountDelta: number;
  cfp68Cfp70SkippedRootCountDelta: number;
  cfp68Cfp71SkippedRootCountDelta: number;
  cfp68Cfp72SkippedRootCountDelta: number;
  cfp68Cfp74SkippedRootCountDelta: number;
  duplicateCfp68EligibleRootKeys: number;
  duplicateCfp69ProbeRootKeys: number;
  duplicateCfp70AvailabilityRootKeys: number;
  duplicateCfp71OutcomeRootKeys: number;
  duplicateCfp72BranchingRootKeys: number;
  duplicateCfp73CasebookRootKeys: number;
  duplicateCfp74SecondPlyRootKeys: number;
  duplicateCfp74OverBudgetRootKeys: number;
  duplicateCfp74SkippedRootKeys: number;
  cfp69RootsMissingCfp68EligibleRoot: number;
  cfp70RootsMissingCfp68EligibleRoot: number;
  cfp71RootsMissingCfp68EligibleRoot: number;
  cfp72RootsMissingCfp68EligibleRoot: number;
  cfp73CasebookRootsMissingCfp72BranchingRoot: number;
  cfp74SecondPlyRootsMissingCfp72BranchingRoot: number;
  cfp74OverBudgetRootsMissingCfp72BranchingRoot: number;
  cFp70AvailabilityDisagreementTotal: number;
  cFp71FailedOrDeferredPairTotal: number;
  cFp72FailedOrDeferredBranchingPairTotal: number;
  cFp74FailedOrDeferredSecondPlyPairCount: number;
  cFp74InCapRootsNotObserved: number;
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
  cfp68EligibleRootCountActualDelta: number;
  cfp68SkippedRootCountActualDelta: number;
  cfp69ProbeRootCountActualDelta: number;
  cfp70AvailabilityRootCountActualDelta: number;
  cfp71OutcomeRootCountActualDelta: number;
  cfp72BranchingRootCountActualDelta: number;
  cfp74InCapRootCountActualDelta: number;
  cfp74OverBudgetRootCountActualDelta: number;
  cfp74InheritedSkippedRootCountActualDelta: number;
}

// ---------------------------------------------------------------------------
// Output rows
// ---------------------------------------------------------------------------

export interface SearchConsumerActionFeaturesV0RootFeatureRow
  extends SearchConsumerActionFeaturesV0RootIdentity {
  schemaVersion: SearchConsumerActionFeaturesV0RootFeatureSchemaVersion;
  featureRunId: string;
  consumerReadinessStatus: SearchConsumerActionFeaturesV0ConsumerReadinessStatus;
  cFp68EligibilityStatus: "eligible_valid_root";
  cFp69ProbeStatus: string;
  cFp70ProbeStatus: string;
  cFp71ProbeStatus: string;
  cFp72ProbeStatus: string;
  cFp74CapStatus: "in_cap" | "over_budget";
  cFp74OverBudgetReason?: string;
  sourceConsistencyStatus: "ready" | "not_ready";
  cFp69PublicActionCount: number;
  cFp69PublicActionKindCounts: Record<string, number>;
  cFp69TargetKindCounts: Record<string, number>;
  cFp69TargetSideCounts: Record<string, number>;
  cFp70AvailabilityDisagreementCount: number;
  cFp70AvailabilityRiskBucket: string;
  cFp71PublicActionSamplePairCount: number;
  cFp71OutcomeDivergenceCount: number;
  cFp71OutcomeRiskBucket: string;
  cFp71PublicOutcomeKindCounts: Record<string, number>;
  cFp71TransitionKindCounts: Record<string, number>;
  cFp72PostOnePlyPublicActionBudgetTotal: number;
  cFp72PostOnePlyPublicActionBudgetAverage: number;
  cFp72BranchingBudgetBucket: string;
  cFp72BranchingRiskBucket: string;
  cFp72NextPublicActionCountMax: number;
  cFp72LargestNextPublicActionBucketSizeMax: number;
  cFp72PostOnePlyActorCounts: Record<string, number>;
  cFp72PostOnePlyPhaseCounts: Record<string, number>;
  cFp73CasebookPresence: string;
  cFp73PrimaryCasebookLabel?: string;
  cFp73BudgetPressureLabel?: string;
  cFp73TransitionContextLabel?: string;
  cFp74PlannedSecondPlyPairCount?: number;
  cFp74CompletedSecondPlyPairCount?: number;
  cFp74FailedOrDeferredSecondPlyPairCount?: number;
  cFp74SecondPlyExecutionStatus?: string;
  cFp74SecondPlyOutcomeRiskBucket?: string;
  cFp74SecondPlyTransitionKindCounts?: Record<string, number>;
  cFp74SecondPlyPublicActionKindCounts?: Record<string, number>;
  cFp74SecondPlyTargetKindCounts?: Record<string, number>;
  cFp74SecondPlyTargetSideCounts?: Record<string, number>;
}

export interface SearchConsumerActionFeaturesV0SkippedRootRow
  extends SearchConsumerActionFeaturesV0RootIdentity {
  schemaVersion: SearchConsumerActionFeaturesV0SkippedRootSchemaVersion;
  featureRunId: string;
  consumerReadinessStatus: "skipped_invalid_root";
  eligibilityStatus: "skipped_invalid_root";
  skipReason: string;
  invalidReason: string;
  cFp67PrimaryClassification?: string;
  cFp67TransferClassification?: string;
  cFp67PersistentDeficitClassification?: string;
  cFp67DeficitSizeClassification?: string;
  cFp67ProvenanceLabel?: string;
  skipStage: string;
  skipCounterDimensions: Record<string, string | number>;
}

export interface SearchConsumerActionFeaturesV0ActionFeatureRow {
  schemaVersion: SearchConsumerActionFeaturesV0ActionFeatureSchemaVersion;
  featureRunId: string;
  suiteId: string;
  rootPublicFingerprint: string;
  publicActionRef: string;
  publicActionKind: string;
  targetKind: string;
  targetSide: string;
  publicRowZoneBucket?: string;
  targetExpansionBucket?: string;
  cFp70AvailabilityStatus?: string;
  cFp70AvailabilityCount?: number;
  cFp71TransitionCount?: number;
  cFp72BudgetContribution?: number;
  cFp74SecondPlyCompletionBucket?: string;
  rootCapLinkage: string;
  skippedRootLinkage: string;
}

export type SearchConsumerActionFeaturesV0ActionFeatureGapScope =
  | "suite"
  | "phase"
  | "source_artifact";

export type SearchConsumerActionFeaturesV0ActionFeatureGapSourcePhase =
  | "cFp69"
  | "cFp70"
  | "cFp71"
  | "cFp72"
  | "cFp74";

export interface SearchConsumerActionFeaturesV0ActionFeatureGapRow {
  schemaVersion: SearchConsumerActionFeaturesV0ActionFeatureGapSchemaVersion;
  featureRunId: string;
  suiteId: string;
  gapKind: "action_feature_source_gap";
  gapScope: SearchConsumerActionFeaturesV0ActionFeatureGapScope;
  sourcePhase: SearchConsumerActionFeaturesV0ActionFeatureGapSourcePhase;
  missingFieldCategory: string;
  affectedRootCount: number;
  affectedActionFeatureCountEstimate?: number;
  recommendedNextStep: string;
}

// ---------------------------------------------------------------------------
// Build input/result
// ---------------------------------------------------------------------------

export interface SearchConsumerActionFeaturesV0BuildInput {
  suiteId: string;
  featureRunId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp68RunId: string;
  sourceCfp69RunId: string;
  sourceCfp70RunId: string;
  sourceCfp71RunId: string;
  sourceCfp72RunId: string;
  sourceCfp73RunId: string;
  sourceCfp74RunId: string;
  cfp68Summary: SearchConsumerActionFeaturesV0Cfp68SummaryInput;
  cfp69Summary: SearchConsumerActionFeaturesV0Cfp69SummaryInput;
  cfp70Summary: SearchConsumerActionFeaturesV0Cfp70SummaryInput;
  cfp71Summary: SearchConsumerActionFeaturesV0Cfp71SummaryInput;
  cfp72Summary: SearchConsumerActionFeaturesV0Cfp72SummaryInput;
  cfp74Summary: SearchConsumerActionFeaturesV0Cfp74SummaryInput;
  cfp68EligibleRoots: readonly SearchConsumerActionFeaturesV0Cfp68EligibleRootInput[];
  cfp69ProbeRoots: readonly SearchConsumerActionFeaturesV0Cfp69ProbeRootInput[];
  cfp70AvailabilityRoots: readonly SearchConsumerActionFeaturesV0Cfp70AvailabilityRootInput[];
  cfp71OutcomeRoots: readonly SearchConsumerActionFeaturesV0Cfp71OutcomeRootInput[];
  cfp72BranchingRoots: readonly SearchConsumerActionFeaturesV0Cfp72BranchingRootInput[];
  cfp73CasebookRoots: readonly SearchConsumerActionFeaturesV0Cfp73CasebookRootInput[];
  cfp74SecondPlyRoots: readonly SearchConsumerActionFeaturesV0Cfp74SecondPlyRootInput[];
  cfp74OverBudgetRoots: readonly SearchConsumerActionFeaturesV0Cfp74OverBudgetRootInput[];
  cfp74SkippedRoots: readonly SearchConsumerActionFeaturesV0Cfp74SkippedRootInput[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

export interface SearchConsumerActionFeaturesV0CountSummaries {
  countsByPhase: Record<string, number>;
  countsByRound: Record<string, number>;
  countsByPolicy: Record<string, number>;
  countsByFaction: Record<string, number>;
  countsByDeckPreset: Record<string, number>;
  countsByMatchup: Record<string, number>;
  cFp74CapStatusCounts: Record<string, number>;
  cFp73PrimaryCasebookLabelCounts: Record<string, number>;
}

export interface SearchConsumerActionFeaturesV0Result {
  consumerReadinessStatus: SearchConsumerActionFeaturesV0ConsumerReadinessStatus;
  sourceConsistency: SearchConsumerActionFeaturesV0SourceConsistency;
  rootFeatures: readonly SearchConsumerActionFeaturesV0RootFeatureRow[];
  skippedRoots: readonly SearchConsumerActionFeaturesV0SkippedRootRow[];
  actionFeatures: readonly SearchConsumerActionFeaturesV0ActionFeatureRow[];
  actionFeatureGaps: readonly SearchConsumerActionFeaturesV0ActionFeatureGapRow[];
  countSummaries: SearchConsumerActionFeaturesV0CountSummaries;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sortRecord = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

export const sparseCountMap = (record: Record<string, number>): Record<string, number> =>
  sortRecord(Object.fromEntries(Object.entries(record).filter(([, count]) => count !== 0)));

const addCount = (record: Record<string, number>, key: string, by = 1) => {
  record[key] = (record[key] ?? 0) + by;
};

// cFp72 branching-roots.jsonl records omit `suiteId` (it is implied by the
// containing artifact directory). Root keys are computed using the build
// input's suiteId for every phase so cFp72-derived keys still join against
// cFp68/cFp73/cFp74 keys, all of which carry an explicit suiteId.
const rootKeyFor = (record: SearchConsumerActionFeaturesV0RootIdentity, suiteId: string): string =>
  buildSearchConsumerActionFeaturesV0RootKey({ ...record, suiteId });

const keyByRootKey = <T extends SearchConsumerActionFeaturesV0RootIdentity>(
  records: readonly T[],
  suiteId: string,
): Map<string, T> => {
  const map = new Map<string, T>();
  records.forEach((record) => {
    map.set(rootKeyFor(record, suiteId), record);
  });
  return map;
};

const duplicateKeyCount = <T extends SearchConsumerActionFeaturesV0RootIdentity>(
  records: readonly T[],
  suiteId: string,
): number => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const key = rootKeyFor(record, suiteId);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.values()].filter((count) => count > 1).length;
};

const missingFromCount = <T extends SearchConsumerActionFeaturesV0RootIdentity>(
  records: readonly T[],
  referenceKeys: ReadonlySet<string>,
  suiteId: string,
): number => records.filter((record) => !referenceKeys.has(rootKeyFor(record, suiteId))).length;

// ---------------------------------------------------------------------------
// Source consistency
// ---------------------------------------------------------------------------

export const buildSearchConsumerActionFeaturesV0SourceConsistency = (
  input: SearchConsumerActionFeaturesV0BuildInput,
): SearchConsumerActionFeaturesV0SourceConsistency => {
  const eligibleKeys = new Set(
    input.cfp68EligibleRoots.map((root) => rootKeyFor(root, input.suiteId)),
  );
  const branchingKeys = new Set(
    input.cfp72BranchingRoots.map((root) => rootKeyFor(root, input.suiteId)),
  );

  const cFp70AvailabilityDisagreementTotal = input.cfp70AvailabilityRoots.reduce(
    (sum, root) => sum + root.availabilityDisagreementCount,
    0,
  );
  const cFp71FailedOrDeferredPairTotal = input.cfp71OutcomeRoots.reduce(
    (sum, root) => sum + root.failedOrDeferredPairCount,
    0,
  );
  const cFp72FailedOrDeferredBranchingPairTotal = input.cfp72BranchingRoots.reduce(
    (sum, root) => sum + root.failedOrDeferredBranchingPairCount,
    0,
  );

  const cfp68Cfp69EligibleRootCountDelta =
    input.cfp68Summary.eligibleRootCount - input.cfp69Summary.probeRootCount;
  const cfp68Cfp70EligibleRootCountDelta =
    input.cfp68Summary.eligibleRootCount - input.cfp70Summary.availabilityRootCount;
  const cfp68Cfp71EligibleRootCountDelta =
    input.cfp68Summary.eligibleRootCount - input.cfp71Summary.outcomeRootCount;
  const cfp68Cfp72EligibleRootCountDelta =
    input.cfp68Summary.eligibleRootCount - input.cfp72Summary.branchingRootCount;
  const cfp74InCapPlusOverBudgetVsCfp72BranchingDelta =
    input.cfp74Summary.inCapRootCount +
    input.cfp74Summary.overBudgetRootCount -
    input.cfp72Summary.branchingRootCount;

  const cfp68Cfp69SkippedRootCountDelta =
    input.cfp68Summary.invalidRootCountFromCfp67 - input.cfp69Summary.skippedRootCount;
  const cfp68Cfp70SkippedRootCountDelta =
    input.cfp68Summary.invalidRootCountFromCfp67 - input.cfp70Summary.skippedRootCount;
  const cfp68Cfp71SkippedRootCountDelta =
    input.cfp68Summary.invalidRootCountFromCfp67 - input.cfp71Summary.skippedRootCount;
  const cfp68Cfp72SkippedRootCountDelta =
    input.cfp68Summary.invalidRootCountFromCfp67 - input.cfp72Summary.skippedRootCount;
  const cfp68Cfp74SkippedRootCountDelta =
    input.cfp68Summary.invalidRootCountFromCfp67 - input.cfp74Summary.inheritedSkippedRootCount;

  // Explicit summary-vs-actual-row-array checks: a summary that claims rows
  // exist but whose corresponding loaded array is truncated or empty (or
  // vice versa) must fail source consistency rather than silently producing
  // fewer rows than the summary advertises.
  const cfp68EligibleRootCountActualDelta =
    input.cfp68Summary.eligibleRootCount - input.cfp68EligibleRoots.length;
  const cfp68SkippedRootCountActualDelta =
    input.cfp68Summary.invalidRootCountFromCfp67 - input.cfp74SkippedRoots.length;
  const cfp69ProbeRootCountActualDelta =
    input.cfp69Summary.probeRootCount - input.cfp69ProbeRoots.length;
  const cfp70AvailabilityRootCountActualDelta =
    input.cfp70Summary.availabilityRootCount - input.cfp70AvailabilityRoots.length;
  const cfp71OutcomeRootCountActualDelta =
    input.cfp71Summary.outcomeRootCount - input.cfp71OutcomeRoots.length;
  const cfp72BranchingRootCountActualDelta =
    input.cfp72Summary.branchingRootCount - input.cfp72BranchingRoots.length;
  const cfp74InCapRootCountActualDelta =
    input.cfp74Summary.inCapRootCount - input.cfp74SecondPlyRoots.length;
  const cfp74OverBudgetRootCountActualDelta =
    input.cfp74Summary.overBudgetRootCount - input.cfp74OverBudgetRoots.length;
  const cfp74InheritedSkippedRootCountActualDelta =
    input.cfp74Summary.inheritedSkippedRootCount - input.cfp74SkippedRoots.length;

  const checks: boolean[] = [
    input.cfp68Summary.contractStatus === "probe_ready",
    input.cfp69Summary.probeReadinessStatus === "probe_ready",
    input.cfp70Summary.probeReadinessStatus === "probe_ready",
    input.cfp71Summary.probeReadinessStatus === "probe_ready",
    input.cfp72Summary.probeReadinessStatus === "probe_ready",
    input.cfp74Summary.scaffoldReadinessStatus === "ready" ||
      input.cfp74Summary.scaffoldReadinessStatus === "ready_with_over_budget_skips",
    cfp68Cfp69EligibleRootCountDelta === 0,
    cfp68Cfp70EligibleRootCountDelta === 0,
    cfp68Cfp71EligibleRootCountDelta === 0,
    cfp68Cfp72EligibleRootCountDelta === 0,
    cfp74InCapPlusOverBudgetVsCfp72BranchingDelta === 0,
    cfp68Cfp69SkippedRootCountDelta === 0,
    cfp68Cfp70SkippedRootCountDelta === 0,
    cfp68Cfp71SkippedRootCountDelta === 0,
    cfp68Cfp72SkippedRootCountDelta === 0,
    cfp68Cfp74SkippedRootCountDelta === 0,
    duplicateKeyCount(input.cfp68EligibleRoots, input.suiteId) === 0,
    duplicateKeyCount(input.cfp69ProbeRoots, input.suiteId) === 0,
    duplicateKeyCount(input.cfp70AvailabilityRoots, input.suiteId) === 0,
    duplicateKeyCount(input.cfp71OutcomeRoots, input.suiteId) === 0,
    duplicateKeyCount(input.cfp72BranchingRoots, input.suiteId) === 0,
    duplicateKeyCount(input.cfp73CasebookRoots, input.suiteId) === 0,
    duplicateKeyCount(input.cfp74SecondPlyRoots, input.suiteId) === 0,
    duplicateKeyCount(input.cfp74OverBudgetRoots, input.suiteId) === 0,
    duplicateKeyCount(input.cfp74SkippedRoots, input.suiteId) === 0,
    missingFromCount(input.cfp69ProbeRoots, eligibleKeys, input.suiteId) === 0,
    missingFromCount(input.cfp70AvailabilityRoots, eligibleKeys, input.suiteId) === 0,
    missingFromCount(input.cfp71OutcomeRoots, eligibleKeys, input.suiteId) === 0,
    missingFromCount(input.cfp72BranchingRoots, eligibleKeys, input.suiteId) === 0,
    missingFromCount(input.cfp73CasebookRoots, branchingKeys, input.suiteId) === 0,
    missingFromCount(input.cfp74SecondPlyRoots, branchingKeys, input.suiteId) === 0,
    missingFromCount(input.cfp74OverBudgetRoots, branchingKeys, input.suiteId) === 0,
    cFp70AvailabilityDisagreementTotal === 0,
    cFp71FailedOrDeferredPairTotal === 0,
    cFp72FailedOrDeferredBranchingPairTotal === 0,
    input.cfp74Summary.failedOrDeferredSecondPlyPairCount === 0,
    input.cfp74Summary.sourceConsistency.inCapRootsNotObserved === 0,
    input.sourceArtifactReferenceCount > 0,
    input.sourceArtifactEmptyHashCount === 0,
    cfp68EligibleRootCountActualDelta === 0,
    cfp68SkippedRootCountActualDelta === 0,
    cfp69ProbeRootCountActualDelta === 0,
    cfp70AvailabilityRootCountActualDelta === 0,
    cfp71OutcomeRootCountActualDelta === 0,
    cfp72BranchingRootCountActualDelta === 0,
    cfp74InCapRootCountActualDelta === 0,
    cfp74OverBudgetRootCountActualDelta === 0,
    cfp74InheritedSkippedRootCountActualDelta === 0,
  ];

  return {
    status: checks.every(Boolean) ? "ready" : "not_ready",
    cFp68ContractStatus: input.cfp68Summary.contractStatus,
    cFp69ProbeReadinessStatus: input.cfp69Summary.probeReadinessStatus,
    cFp70ProbeReadinessStatus: input.cfp70Summary.probeReadinessStatus,
    cFp71ProbeReadinessStatus: input.cfp71Summary.probeReadinessStatus,
    cFp72ProbeReadinessStatus: input.cfp72Summary.probeReadinessStatus,
    cFp74ScaffoldReadinessStatus: input.cfp74Summary.scaffoldReadinessStatus,
    cFp68EligibleRootCount: input.cfp68Summary.eligibleRootCount,
    cFp69ProbeRootCount: input.cfp69Summary.probeRootCount,
    cFp70AvailabilityRootCount: input.cfp70Summary.availabilityRootCount,
    cFp71OutcomeRootCount: input.cfp71Summary.outcomeRootCount,
    cFp72BranchingRootCount: input.cfp72Summary.branchingRootCount,
    cFp74InCapRootCount: input.cfp74Summary.inCapRootCount,
    cFp74OverBudgetRootCount: input.cfp74Summary.overBudgetRootCount,
    cfp68Cfp69EligibleRootCountDelta,
    cfp68Cfp70EligibleRootCountDelta,
    cfp68Cfp71EligibleRootCountDelta,
    cfp68Cfp72EligibleRootCountDelta,
    cfp74InCapPlusOverBudgetVsCfp72BranchingDelta,
    cFp68SkippedRootCount: input.cfp68Summary.invalidRootCountFromCfp67,
    cFp69SkippedRootCount: input.cfp69Summary.skippedRootCount,
    cFp70SkippedRootCount: input.cfp70Summary.skippedRootCount,
    cFp71SkippedRootCount: input.cfp71Summary.skippedRootCount,
    cFp72SkippedRootCount: input.cfp72Summary.skippedRootCount,
    cFp74InheritedSkippedRootCount: input.cfp74Summary.inheritedSkippedRootCount,
    cfp68Cfp69SkippedRootCountDelta,
    cfp68Cfp70SkippedRootCountDelta,
    cfp68Cfp71SkippedRootCountDelta,
    cfp68Cfp72SkippedRootCountDelta,
    cfp68Cfp74SkippedRootCountDelta,
    duplicateCfp68EligibleRootKeys: duplicateKeyCount(input.cfp68EligibleRoots, input.suiteId),
    duplicateCfp69ProbeRootKeys: duplicateKeyCount(input.cfp69ProbeRoots, input.suiteId),
    duplicateCfp70AvailabilityRootKeys: duplicateKeyCount(input.cfp70AvailabilityRoots, input.suiteId),
    duplicateCfp71OutcomeRootKeys: duplicateKeyCount(input.cfp71OutcomeRoots, input.suiteId),
    duplicateCfp72BranchingRootKeys: duplicateKeyCount(input.cfp72BranchingRoots, input.suiteId),
    duplicateCfp73CasebookRootKeys: duplicateKeyCount(input.cfp73CasebookRoots, input.suiteId),
    duplicateCfp74SecondPlyRootKeys: duplicateKeyCount(input.cfp74SecondPlyRoots, input.suiteId),
    duplicateCfp74OverBudgetRootKeys: duplicateKeyCount(input.cfp74OverBudgetRoots, input.suiteId),
    duplicateCfp74SkippedRootKeys: duplicateKeyCount(input.cfp74SkippedRoots, input.suiteId),
    cfp69RootsMissingCfp68EligibleRoot: missingFromCount(
      input.cfp69ProbeRoots,
      eligibleKeys,
      input.suiteId,
    ),
    cfp70RootsMissingCfp68EligibleRoot: missingFromCount(
      input.cfp70AvailabilityRoots,
      eligibleKeys,
      input.suiteId,
    ),
    cfp71RootsMissingCfp68EligibleRoot: missingFromCount(
      input.cfp71OutcomeRoots,
      eligibleKeys,
      input.suiteId,
    ),
    cfp72RootsMissingCfp68EligibleRoot: missingFromCount(
      input.cfp72BranchingRoots,
      eligibleKeys,
      input.suiteId,
    ),
    cfp73CasebookRootsMissingCfp72BranchingRoot: missingFromCount(
      input.cfp73CasebookRoots,
      branchingKeys,
      input.suiteId,
    ),
    cfp74SecondPlyRootsMissingCfp72BranchingRoot: missingFromCount(
      input.cfp74SecondPlyRoots,
      branchingKeys,
      input.suiteId,
    ),
    cfp74OverBudgetRootsMissingCfp72BranchingRoot: missingFromCount(
      input.cfp74OverBudgetRoots,
      branchingKeys,
      input.suiteId,
    ),
    cFp70AvailabilityDisagreementTotal,
    cFp71FailedOrDeferredPairTotal,
    cFp72FailedOrDeferredBranchingPairTotal,
    cFp74FailedOrDeferredSecondPlyPairCount: input.cfp74Summary.failedOrDeferredSecondPlyPairCount,
    cFp74InCapRootsNotObserved: input.cfp74Summary.sourceConsistency.inCapRootsNotObserved,
    sourceArtifactReferenceCount: input.sourceArtifactReferenceCount,
    sourceArtifactEmptyHashCount: input.sourceArtifactEmptyHashCount,
    cfp68EligibleRootCountActualDelta,
    cfp68SkippedRootCountActualDelta,
    cfp69ProbeRootCountActualDelta,
    cfp70AvailabilityRootCountActualDelta,
    cfp71OutcomeRootCountActualDelta,
    cfp72BranchingRootCountActualDelta,
    cfp74InCapRootCountActualDelta,
    cfp74OverBudgetRootCountActualDelta,
    cfp74InheritedSkippedRootCountActualDelta,
  };
};

// ---------------------------------------------------------------------------
// Root feature rows
// ---------------------------------------------------------------------------

export const buildSearchConsumerActionFeaturesV0RootFeatureRows = ({
  input,
  consumerReadinessStatus,
  sourceConsistencyStatus,
}: {
  input: SearchConsumerActionFeaturesV0BuildInput;
  consumerReadinessStatus: SearchConsumerActionFeaturesV0ConsumerReadinessStatus;
  sourceConsistencyStatus: "ready" | "not_ready";
}): SearchConsumerActionFeaturesV0RootFeatureRow[] => {
  const cfp69ByKey = keyByRootKey(input.cfp69ProbeRoots, input.suiteId);
  const cfp70ByKey = keyByRootKey(input.cfp70AvailabilityRoots, input.suiteId);
  const cfp71ByKey = keyByRootKey(input.cfp71OutcomeRoots, input.suiteId);
  const cfp72ByKey = keyByRootKey(input.cfp72BranchingRoots, input.suiteId);
  const cfp74SecondPlyByKey = keyByRootKey(input.cfp74SecondPlyRoots, input.suiteId);
  const cfp74OverBudgetByKey = keyByRootKey(input.cfp74OverBudgetRoots, input.suiteId);

  return input.cfp68EligibleRoots.map((root) => {
    const key = rootKeyFor(root, input.suiteId);
    const cfp69 = cfp69ByKey.get(key);
    const cfp70 = cfp70ByKey.get(key);
    const cfp71 = cfp71ByKey.get(key);
    const cfp72 = cfp72ByKey.get(key);
    const cfp74SecondPly = cfp74SecondPlyByKey.get(key);
    const cfp74OverBudget = cfp74OverBudgetByKey.get(key);

    if (!cfp69 || !cfp70 || !cfp71 || !cfp72) {
      throw new Error(`search-consumer-action-features-v0: missing source row for root ${key}`);
    }
    if (!cfp74SecondPly && !cfp74OverBudget) {
      throw new Error(`search-consumer-action-features-v0: missing cFp74 row for root ${key}`);
    }

    const cfp74 = cfp74SecondPly ?? cfp74OverBudget;
    if (!cfp74) {
      throw new Error(`search-consumer-action-features-v0: missing cFp74 row for root ${key}`);
    }

    const row: SearchConsumerActionFeaturesV0RootFeatureRow = {
      schemaVersion: "search-consumer-action-features-v0-root-feature-v1",
      featureRunId: input.featureRunId,
      suiteId: root.suiteId,
      matchupId: root.matchupId,
      seed: root.seed,
      ...(root.mirrorGroupId !== undefined ? { mirrorGroupId: root.mirrorGroupId } : {}),
      ...(root.mirrorIndex !== undefined ? { mirrorIndex: root.mirrorIndex } : {}),
      step: root.step,
      decisionIndex: root.decisionIndex,
      phase: root.phase,
      round: root.round,
      seatId: root.seatId,
      policyId: root.policyId,
      faction: root.faction,
      deckPresetId: root.deckPresetId,
      rootPublicFingerprint: root.rootPublicFingerprint,
      consumerReadinessStatus,
      cFp68EligibilityStatus: "eligible_valid_root",
      cFp69ProbeStatus: cfp69.probeStatus,
      cFp70ProbeStatus: cfp70.probeStatus,
      cFp71ProbeStatus: cfp71.probeStatus,
      cFp72ProbeStatus: cfp72.probeStatus,
      cFp74CapStatus: cfp74.capStatus,
      sourceConsistencyStatus,
      cFp69PublicActionCount: cfp69.publicActionCount,
      cFp69PublicActionKindCounts: sparseCountMap(cfp69.publicActionKindCounts),
      cFp69TargetKindCounts: sparseCountMap(cfp69.targetKindCounts),
      cFp69TargetSideCounts: sparseCountMap(cfp69.targetSideCounts),
      cFp70AvailabilityDisagreementCount: cfp70.availabilityDisagreementCount,
      cFp70AvailabilityRiskBucket: cfp70.availabilityRiskBucket,
      cFp71PublicActionSamplePairCount: cfp71.publicActionSamplePairCount,
      cFp71OutcomeDivergenceCount: cfp71.outcomeDivergenceCount,
      cFp71OutcomeRiskBucket: cfp71.outcomeRiskBucket,
      cFp71PublicOutcomeKindCounts: sparseCountMap(cfp71.publicOutcomeKindCounts),
      cFp71TransitionKindCounts: sparseCountMap(cfp71.transitionKindCounts),
      cFp72PostOnePlyPublicActionBudgetTotal: cfp72.postOnePlyPublicActionBudgetTotal,
      cFp72PostOnePlyPublicActionBudgetAverage: cfp72.postOnePlyPublicActionBudgetAverage,
      cFp72BranchingBudgetBucket: cfp72.branchingBudgetBucket,
      cFp72BranchingRiskBucket: cfp72.branchingRiskBucket,
      cFp72NextPublicActionCountMax: cfp72.nextPublicActionCountMax,
      cFp72LargestNextPublicActionBucketSizeMax: cfp72.largestNextPublicActionBucketSizeMax,
      cFp72PostOnePlyActorCounts: sparseCountMap(cfp72.postOnePlyActorCounts),
      cFp72PostOnePlyPhaseCounts: sparseCountMap(cfp72.postOnePlyPhaseCounts),
      cFp73CasebookPresence: cfp74.casebookPresence,
      ...(cfp74.primaryCasebookLabel !== undefined
        ? { cFp73PrimaryCasebookLabel: cfp74.primaryCasebookLabel }
        : {}),
      ...(cfp74.budgetPressureLabel !== undefined
        ? { cFp73BudgetPressureLabel: cfp74.budgetPressureLabel }
        : {}),
      ...(cfp74.transitionContextLabel !== undefined
        ? { cFp73TransitionContextLabel: cfp74.transitionContextLabel }
        : {}),
      cFp74PlannedSecondPlyPairCount: cfp74.plannedSecondPlyPairCount,
    };

    if (cfp74SecondPly) {
      row.cFp74CompletedSecondPlyPairCount = cfp74SecondPly.completedSecondPlyPairCount;
      row.cFp74FailedOrDeferredSecondPlyPairCount =
        cfp74SecondPly.failedOrDeferredSecondPlyPairCount;
      row.cFp74SecondPlyExecutionStatus = cfp74SecondPly.secondPlyExecutionStatus;
      row.cFp74SecondPlyOutcomeRiskBucket = cfp74SecondPly.secondPlyOutcomeRiskBucket;
      row.cFp74SecondPlyTransitionKindCounts = sparseCountMap(
        cfp74SecondPly.secondPlyTransitionKindCounts,
      );
      row.cFp74SecondPlyPublicActionKindCounts = sparseCountMap(
        cfp74SecondPly.secondPlyPublicActionKindCounts,
      );
      row.cFp74SecondPlyTargetKindCounts = sparseCountMap(
        cfp74SecondPly.secondPlyTargetKindCounts,
      );
      row.cFp74SecondPlyTargetSideCounts = sparseCountMap(
        cfp74SecondPly.secondPlyTargetSideCounts,
      );
    } else if (cfp74OverBudget) {
      row.cFp74OverBudgetReason = cfp74OverBudget.overBudgetReason;
    }

    return row;
  });
};

// ---------------------------------------------------------------------------
// Skipped root rows
// ---------------------------------------------------------------------------

export const buildSearchConsumerActionFeaturesV0SkippedRootRows = (
  input: SearchConsumerActionFeaturesV0BuildInput,
): SearchConsumerActionFeaturesV0SkippedRootRow[] =>
  input.cfp74SkippedRoots.map((root) => ({
    schemaVersion: "search-consumer-action-features-v0-skipped-root-v1",
    featureRunId: input.featureRunId,
    suiteId: root.suiteId,
    matchupId: root.matchupId,
    seed: root.seed,
    ...(root.mirrorGroupId !== undefined ? { mirrorGroupId: root.mirrorGroupId } : {}),
    ...(root.mirrorIndex !== undefined ? { mirrorIndex: root.mirrorIndex } : {}),
    step: root.step,
    decisionIndex: root.decisionIndex,
    phase: root.phase,
    round: root.round,
    seatId: root.seatId,
    policyId: root.policyId,
    faction: root.faction,
    deckPresetId: root.deckPresetId,
    rootPublicFingerprint: root.rootPublicFingerprint,
    consumerReadinessStatus: "skipped_invalid_root",
    eligibilityStatus: "skipped_invalid_root",
    skipReason: root.skipReason,
    invalidReason: root.invalidReason,
    ...(root.cFp67PrimaryClassification !== undefined
      ? { cFp67PrimaryClassification: root.cFp67PrimaryClassification }
      : {}),
    ...(root.cFp67TransferClassification !== undefined
      ? { cFp67TransferClassification: root.cFp67TransferClassification }
      : {}),
    ...(root.cFp67PersistentDeficitClassification !== undefined
      ? { cFp67PersistentDeficitClassification: root.cFp67PersistentDeficitClassification }
      : {}),
    ...(root.cFp67DeficitSizeClassification !== undefined
      ? { cFp67DeficitSizeClassification: root.cFp67DeficitSizeClassification }
      : {}),
    ...(root.cFp67ProvenanceLabel !== undefined
      ? { cFp67ProvenanceLabel: root.cFp67ProvenanceLabel }
      : {}),
    skipStage: root.skipStage,
    skipCounterDimensions: { ...root.skipCounterDimensions },
  }));

// ---------------------------------------------------------------------------
// Action feature gap rows
// ---------------------------------------------------------------------------

const ACTION_FEATURE_GAP_SOURCE_PHASES: readonly SearchConsumerActionFeaturesV0ActionFeatureGapSourcePhase[] =
  ["cFp69", "cFp70", "cFp71", "cFp72", "cFp74"];

export const buildSearchConsumerActionFeaturesV0ActionFeatureGapRows = (
  input: SearchConsumerActionFeaturesV0BuildInput,
): SearchConsumerActionFeaturesV0ActionFeatureGapRow[] => {
  const affectedRootCount = input.cfp68EligibleRoots.length;
  const affectedActionFeatureCountEstimate = input.cfp69ProbeRoots.reduce(
    (sum, root) => sum + root.publicActionCount,
    0,
  );

  return ACTION_FEATURE_GAP_SOURCE_PHASES.map((sourcePhase) => ({
    schemaVersion: "search-consumer-action-features-v0-action-feature-gap-v1",
    featureRunId: input.featureRunId,
    suiteId: input.suiteId,
    gapKind: "action_feature_source_gap",
    gapScope: "suite",
    sourcePhase,
    missingFieldCategory: "durable_public_action_identity",
    affectedRootCount,
    ...(sourcePhase === "cFp69" ? { affectedActionFeatureCountEstimate } : {}),
    recommendedNextStep:
      "cFp77 should add a narrow public-action-identity artifact derived from cFp69/cFp70 sources, without new command execution or product AI wiring.",
  }));
};

// ---------------------------------------------------------------------------
// Count summaries
// ---------------------------------------------------------------------------

export const buildSearchConsumerActionFeaturesV0CountSummaries = (
  rootFeatures: readonly SearchConsumerActionFeaturesV0RootFeatureRow[],
): SearchConsumerActionFeaturesV0CountSummaries => {
  const countsByPhase: Record<string, number> = {};
  const countsByRound: Record<string, number> = {};
  const countsByPolicy: Record<string, number> = {};
  const countsByFaction: Record<string, number> = {};
  const countsByDeckPreset: Record<string, number> = {};
  const countsByMatchup: Record<string, number> = {};
  const cFp74CapStatusCounts: Record<string, number> = {};
  const cFp73PrimaryCasebookLabelCounts: Record<string, number> = {};

  rootFeatures.forEach((row) => {
    addCount(countsByPhase, row.phase);
    addCount(countsByRound, String(row.round));
    addCount(countsByPolicy, row.policyId);
    addCount(countsByFaction, row.faction);
    addCount(countsByDeckPreset, row.deckPresetId);
    addCount(countsByMatchup, row.matchupId);
    addCount(cFp74CapStatusCounts, row.cFp74CapStatus);
    if (row.cFp73PrimaryCasebookLabel !== undefined) {
      addCount(cFp73PrimaryCasebookLabelCounts, row.cFp73PrimaryCasebookLabel);
    }
  });

  return {
    countsByPhase: sortRecord(countsByPhase),
    countsByRound: sortRecord(countsByRound),
    countsByPolicy: sortRecord(countsByPolicy),
    countsByFaction: sortRecord(countsByFaction),
    countsByDeckPreset: sortRecord(countsByDeckPreset),
    countsByMatchup: sortRecord(countsByMatchup),
    cFp74CapStatusCounts: sortRecord(cFp74CapStatusCounts),
    cFp73PrimaryCasebookLabelCounts: sortRecord(cFp73PrimaryCasebookLabelCounts),
  };
};

// ---------------------------------------------------------------------------
// Top-level build
// ---------------------------------------------------------------------------

export const buildSearchConsumerActionFeaturesV0Result = (
  input: SearchConsumerActionFeaturesV0BuildInput,
): SearchConsumerActionFeaturesV0Result => {
  const sourceConsistency = buildSearchConsumerActionFeaturesV0SourceConsistency(input);

  if (sourceConsistency.status !== "ready") {
    return {
      consumerReadinessStatus: "source_consistency_failed",
      sourceConsistency,
      rootFeatures: [],
      skippedRoots: [],
      actionFeatures: [],
      actionFeatureGaps: [],
      countSummaries: buildSearchConsumerActionFeaturesV0CountSummaries([]),
    };
  }

  // Durable per-public-action identities are not present in committed
  // cFp69-cFp74 artifacts: those artifacts expose only aggregate count maps
  // (publicActionKindCounts, targetKindCounts, targetSideCounts, transition
  // counts) per root, not stable per-action references. cFp76 must therefore
  // stop at action_feature_source_gap rather than fabricate publicActionRef.
  const consumerReadinessStatus: SearchConsumerActionFeaturesV0ConsumerReadinessStatus =
    "action_feature_source_gap";

  const rootFeatures = buildSearchConsumerActionFeaturesV0RootFeatureRows({
    input,
    consumerReadinessStatus,
    sourceConsistencyStatus: sourceConsistency.status,
  });
  const skippedRoots = buildSearchConsumerActionFeaturesV0SkippedRootRows(input);
  const actionFeatureGaps = buildSearchConsumerActionFeaturesV0ActionFeatureGapRows(input);

  return {
    consumerReadinessStatus,
    sourceConsistency,
    rootFeatures,
    skippedRoots,
    actionFeatures: [],
    actionFeatureGaps,
    countSummaries: buildSearchConsumerActionFeaturesV0CountSummaries(rootFeatures),
  };
};
