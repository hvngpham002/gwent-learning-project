import type {
  SearchConsumerActionFeatureDictionaryV0ActionRow,
  SearchConsumerActionFeatureDictionaryV0DictionaryGroupName,
  SearchConsumerActionFeatureDictionaryV0RootFeatureRow,
  SearchConsumerActionFeatureDictionaryV0SkippedRootRow,
  SearchConsumerActionFeatureDictionaryV0SourceArtifactReference,
} from "./searchConsumerActionFeatureDictionaryV0";

export type SearchConsumerActionFeatureCasebookV0RowSchemaVersion =
  "search-consumer-action-feature-casebook-v0-row-v1";
export type SearchConsumerActionFeatureCasebookV0SliceSummarySchemaVersion =
  "search-consumer-action-feature-casebook-v0-slice-summary-v1";
export type SearchConsumerActionFeatureCasebookV0SkippedRootSummarySchemaVersion =
  "search-consumer-action-feature-casebook-v0-skipped-root-summary-v1";
export type SearchConsumerActionFeatureCasebookV0SummarySchemaVersion =
  "search-consumer-action-feature-casebook-v0-summary-v1";

export type SearchConsumerActionFeatureCasebookV0ConsumerReadinessStatus =
  | "casebook_ready"
  | "source_consistency_failed";

export type SearchConsumerActionFeatureCasebookV0RowKind =
  | "action_kind_slice"
  | "source_class_slice"
  | "target_slice"
  | "move_count_bucket_slice"
  | "collision_slice"
  | "phase_round_slice"
  | "faction_slice"
  | "deck_preset_slice"
  | "matchup_slice"
  | "branching_risk_slice"
  | "second_ply_cap_slice"
  | "combined_readiness_slice";

export type SearchConsumerActionFeatureCasebookV0ReadinessLabel =
  | "consumer_ready"
  | "consumer_ready_high_collision"
  | "consumer_ready_high_branching"
  | "consumer_ready_over_budget_context"
  | "consumer_ready_sparse_slice"
  | "consumer_ready_skipped_root_context";

export type SearchConsumerActionFeatureCasebookV0Note =
  | "aggregate_slice_only"
  | "source_dictionary_ready"
  | "ordinary_coverage"
  | "high_collision_share"
  | "high_branching_context"
  | "over_budget_or_cap_pressure_context"
  | "sparse_slice_low_count"
  | "inherited_skipped_roots_present";

export type SearchConsumerActionFeatureCasebookV0Dimension =
  | "action_kind"
  | "source_class"
  | "target"
  | "move_count_bucket"
  | "collision_flag"
  | "phase"
  | "round"
  | "phase_round"
  | "policy"
  | "faction"
  | "deck_preset"
  | "matchup"
  | "cfp70_availability_risk_bucket"
  | "cfp71_outcome_risk_bucket"
  | "cfp72_branching_risk_bucket"
  | "cfp73_budget_pressure_label"
  | "cfp74_cap_status"
  | "combined_readiness";

export interface SearchConsumerActionFeatureCasebookV0DictionaryGroup {
  count: number;
  values: readonly string[];
}

export type SearchConsumerActionFeatureCasebookV0DictionaryGroups = Record<
  SearchConsumerActionFeatureDictionaryV0DictionaryGroupName,
  SearchConsumerActionFeatureCasebookV0DictionaryGroup
>;

export interface SearchConsumerActionFeatureCasebookV0Cfp80SummaryInput {
  featureRunId: string;
  suiteId: string;
  consumerReadinessStatus: string;
  sourceConsistency: { status: string };
  reconstructionStatus: string;
  reconstructionMismatchCount: number;
  rootFeatureRowCount: number;
  compactActionFeatureRowCount: number;
  skippedRootRowCount: number;
  dictionaryGroupCounts: Partial<Record<SearchConsumerActionFeatureDictionaryV0DictionaryGroupName, number>>;
  robustTargetStatus?: string;
  artifactByteSizes?: {
    rootFeaturesJsonlBytes?: number;
    actionFeaturesCompactJsonlBytes?: number;
    skippedRootsJsonlBytes?: number;
    dictionariesJsonBytes?: number;
  };
}

export interface SearchConsumerActionFeatureCasebookV0BuildInput {
  suiteId: string;
  casebookRunId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp80RunId: string;
  cfp80Summary: SearchConsumerActionFeatureCasebookV0Cfp80SummaryInput;
  cfp80Dictionaries: SearchConsumerActionFeatureCasebookV0DictionaryGroups;
  cfp80RootFeatures: readonly SearchConsumerActionFeatureDictionaryV0RootFeatureRow[];
  cfp80CompactActionFeatures: readonly SearchConsumerActionFeatureDictionaryV0ActionRow[];
  cfp80SkippedRoots: readonly SearchConsumerActionFeatureDictionaryV0SkippedRootRow[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

export interface SearchConsumerActionFeatureCasebookV0SourceConsistency {
  status: "ready" | "not_ready";
  cfp80ConsumerReadinessStatus: string;
  cfp80SourceConsistencyStatus: string;
  cfp80ReconstructionStatus: string;
  cfp80ReconstructionMismatchCount: number;
  cfp80RobustTargetStatus: string;
  cfp80RootFeatureSummaryCount: number;
  cfp80RootFeatureActualCount: number;
  cfp80RootFeatureCountActualDelta: number;
  cfp80CompactActionSummaryCount: number;
  cfp80CompactActionActualCount: number;
  cfp80CompactActionCountActualDelta: number;
  cfp80SkippedRootSummaryCount: number;
  cfp80SkippedRootActualCount: number;
  cfp80SkippedRootCountActualDelta: number;
  dictionaryGroupCountMismatches: number;
  compactActionRowsWithInvalidDictionaryIds: number;
  compactActionRowsWithInvalidRootRefId: number;
  skippedRootCountActualDelta: number;
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

export interface SearchConsumerActionFeatureCasebookV0Row {
  schemaVersion: SearchConsumerActionFeatureCasebookV0RowSchemaVersion;
  casebookRunId: string;
  suiteId: string;
  rowRef: string;
  rowKind: SearchConsumerActionFeatureCasebookV0RowKind;
  sliceKey: string;
  rootCount: number;
  actionCount: number;
  skippedRootCount: number;
  skippedRootPercent: number;
  actionPercent: number;
  rootPercent: number;
  readinessLabel: SearchConsumerActionFeatureCasebookV0ReadinessLabel;
  notes: readonly SearchConsumerActionFeatureCasebookV0Note[];
}

export interface SearchConsumerActionFeatureCasebookV0SliceSummaryRow {
  schemaVersion: SearchConsumerActionFeatureCasebookV0SliceSummarySchemaVersion;
  casebookRunId: string;
  suiteId: string;
  dimension: SearchConsumerActionFeatureCasebookV0Dimension;
  key: string;
  rootCount: number;
  actionCount: number;
  skippedRootCount: number;
  skippedRootPercent: number;
  actionPercent: number;
  rootPercent: number;
  readinessLabel: SearchConsumerActionFeatureCasebookV0ReadinessLabel;
  readinessLabelCounts: Partial<Record<SearchConsumerActionFeatureCasebookV0ReadinessLabel, number>>;
}

export interface SearchConsumerActionFeatureCasebookV0SkippedRootSummary {
  schemaVersion: SearchConsumerActionFeatureCasebookV0SkippedRootSummarySchemaVersion;
  casebookRunId: string;
  suiteId: string;
  rootFeatureRowCount: number;
  compactActionFeatureRowCount: number;
  skippedRootRowCount: number;
  skippedRootPercent: number;
  countsByPhase: Record<string, number>;
  countsByRound: Record<string, number>;
  countsByPolicy: Record<string, number>;
  countsByFaction: Record<string, number>;
  countsByDeckPreset: Record<string, number>;
  countsByMatchup: Record<string, number>;
  countsBySkipReason: Record<string, number>;
  inheritedSkippedRootContext: "present" | "absent";
}

export interface SearchConsumerActionFeatureCasebookV0CountSummaries {
  publicActionKindCounts: Record<string, number>;
  countsBySourceClass: Record<string, number>;
  countsByTargetToken: Record<string, number>;
  countsByMoveCountBucket: Record<string, number>;
  countsByCollisionFlag: Record<string, number>;
  countsByPhase: Record<string, number>;
  countsByRound: Record<string, number>;
  countsByPolicy: Record<string, number>;
  countsByFaction: Record<string, number>;
  countsByDeckPreset: Record<string, number>;
  countsByMatchup: Record<string, number>;
  cFp70AvailabilityRiskBucketCounts: Record<string, number>;
  cFp71OutcomeRiskBucketCounts: Record<string, number>;
  cFp72BranchingRiskBucketCounts: Record<string, number>;
  cFp73BudgetPressureLabelCounts: Record<string, number>;
  cFp74CapStatusCounts: Record<string, number>;
  combinedReadinessCounts: Record<string, number>;
}

export interface SearchConsumerActionFeatureCasebookV0Thresholds {
  sparseActionCount: number;
  sparseRootCount: number;
  highCollisionActionSharePercent: number;
  highBranchingActionSharePercent: number;
  overBudgetActionSharePercent: number;
  skippedRootContextPercent: number;
  maxCasebookRowsPerKind: number;
}

export interface SearchConsumerActionFeatureCasebookV0Result {
  consumerReadinessStatus: SearchConsumerActionFeatureCasebookV0ConsumerReadinessStatus;
  sourceConsistency: SearchConsumerActionFeatureCasebookV0SourceConsistency;
  casebookRows: readonly SearchConsumerActionFeatureCasebookV0Row[];
  sliceSummaries: readonly SearchConsumerActionFeatureCasebookV0SliceSummaryRow[];
  skippedRootSummary: SearchConsumerActionFeatureCasebookV0SkippedRootSummary;
  countSummaries: SearchConsumerActionFeatureCasebookV0CountSummaries;
  readinessLabelCounts: Record<SearchConsumerActionFeatureCasebookV0ReadinessLabel, number>;
  casebookRowKindCounts: Record<SearchConsumerActionFeatureCasebookV0RowKind, number>;
  thresholds: SearchConsumerActionFeatureCasebookV0Thresholds;
  sourceArtifactReferences?: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
}

export const SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_ROW_SCHEMA_VERSION =
  "search-consumer-action-feature-casebook-v0-row-v1" as const;
export const SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SLICE_SUMMARY_SCHEMA_VERSION =
  "search-consumer-action-feature-casebook-v0-slice-summary-v1" as const;
export const SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SKIPPED_ROOT_SUMMARY_SCHEMA_VERSION =
  "search-consumer-action-feature-casebook-v0-skipped-root-summary-v1" as const;
export const SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SUMMARY_SCHEMA_VERSION =
  "search-consumer-action-feature-casebook-v0-summary-v1" as const;

export const SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_THRESHOLDS: SearchConsumerActionFeatureCasebookV0Thresholds =
  {
    sparseActionCount: 5,
    sparseRootCount: 3,
    highCollisionActionSharePercent: 50,
    highBranchingActionSharePercent: 50,
    overBudgetActionSharePercent: 50,
    skippedRootContextPercent: 5,
    maxCasebookRowsPerKind: 24,
  };

const dictionaryGroupNames: readonly SearchConsumerActionFeatureDictionaryV0DictionaryGroupName[] = [
  "schemaVersions",
  "readinessStatuses",
  "rootRefs",
  "publicActionRefs",
  "actionKinds",
  "sourceClasses",
  "targets",
  "strengthBuckets",
  "optionIndexLabels",
  "moveCountBuckets",
];

const emptyReadinessCounts = (): Record<SearchConsumerActionFeatureCasebookV0ReadinessLabel, number> => ({
  consumer_ready: 0,
  consumer_ready_high_collision: 0,
  consumer_ready_high_branching: 0,
  consumer_ready_over_budget_context: 0,
  consumer_ready_sparse_slice: 0,
  consumer_ready_skipped_root_context: 0,
});

const emptyRowKindCounts = (): Record<SearchConsumerActionFeatureCasebookV0RowKind, number> => ({
  action_kind_slice: 0,
  source_class_slice: 0,
  target_slice: 0,
  move_count_bucket_slice: 0,
  collision_slice: 0,
  phase_round_slice: 0,
  faction_slice: 0,
  deck_preset_slice: 0,
  matchup_slice: 0,
  branching_risk_slice: 0,
  second_ply_cap_slice: 0,
  combined_readiness_slice: 0,
});

const emptyCountSummaries = (): SearchConsumerActionFeatureCasebookV0CountSummaries => ({
  publicActionKindCounts: {},
  countsBySourceClass: {},
  countsByTargetToken: {},
  countsByMoveCountBucket: {},
  countsByCollisionFlag: {},
  countsByPhase: {},
  countsByRound: {},
  countsByPolicy: {},
  countsByFaction: {},
  countsByDeckPreset: {},
  countsByMatchup: {},
  cFp70AvailabilityRiskBucketCounts: {},
  cFp71OutcomeRiskBucketCounts: {},
  cFp72BranchingRiskBucketCounts: {},
  cFp73BudgetPressureLabelCounts: {},
  cFp74CapStatusCounts: {},
  combinedReadinessCounts: {},
});

const sortRecord = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

const addCount = (record: Record<string, number>, key: string, by = 1) => {
  record[key] = (record[key] ?? 0) + by;
};

const percent = (count: number, total: number): number =>
  total === 0 ? 0 : Number(((count / total) * 100).toFixed(2));

const valueFor = (
  dictionaries: SearchConsumerActionFeatureCasebookV0DictionaryGroups,
  group: SearchConsumerActionFeatureDictionaryV0DictionaryGroupName,
  id: number,
): string | undefined => dictionaries[group]?.values[id];

const dictionaryIdIsValid = (
  dictionaries: SearchConsumerActionFeatureCasebookV0DictionaryGroups,
  group: SearchConsumerActionFeatureDictionaryV0DictionaryGroupName,
  id: number,
): boolean => valueFor(dictionaries, group, id) !== undefined;

const compactActionDictionaryIdsAreValid = (
  dictionaries: SearchConsumerActionFeatureCasebookV0DictionaryGroups,
  row: SearchConsumerActionFeatureDictionaryV0ActionRow,
): boolean =>
  dictionaryIdIsValid(dictionaries, "rootRefs", row.rootRefId) &&
  dictionaryIdIsValid(dictionaries, "publicActionRefs", row.publicActionRefId) &&
  dictionaryIdIsValid(dictionaries, "actionKinds", row.kindId) &&
  dictionaryIdIsValid(dictionaries, "sourceClasses", row.sourceClassId) &&
  dictionaryIdIsValid(dictionaries, "targets", row.targetId) &&
  dictionaryIdIsValid(dictionaries, "strengthBuckets", row.strengthBucketId) &&
  dictionaryIdIsValid(dictionaries, "optionIndexLabels", row.optionIndexLabelId) &&
  dictionaryIdIsValid(dictionaries, "moveCountBuckets", row.moveCountBucketId);

const dictionaryGroupCountMismatches = ({
  summaryCounts,
  dictionaries,
}: {
  summaryCounts: Partial<Record<SearchConsumerActionFeatureDictionaryV0DictionaryGroupName, number>>;
  dictionaries: SearchConsumerActionFeatureCasebookV0DictionaryGroups;
}) =>
  dictionaryGroupNames.filter((group) => {
    const loadedCount = dictionaries[group]?.values.length ?? 0;
    const declaredCount = dictionaries[group]?.count ?? -1;
    const summaryCount = summaryCounts[group];
    return loadedCount !== declaredCount || summaryCount !== loadedCount;
  }).length;

const skippedPercentFor = ({
  skippedRootCount,
  rootCount,
  sourceRootCount,
  sourceSkippedRootCount,
  exact,
}: {
  skippedRootCount: number;
  rootCount: number;
  sourceRootCount: number;
  sourceSkippedRootCount: number;
  exact: boolean;
}) =>
  exact
    ? percent(skippedRootCount, rootCount + skippedRootCount)
    : percent(sourceSkippedRootCount, sourceRootCount + sourceSkippedRootCount);

const isHighBranchingBucket = (bucket: string): boolean =>
  !["none", "zero", "tiny", "small"].includes(bucket);

const isOverBudgetContext = ({
  budgetPressureLabel,
  capStatus,
}: {
  budgetPressureLabel: string;
  capStatus: string;
}): boolean =>
  budgetPressureLabel === "large" ||
  budgetPressureLabel === "high_threshold" ||
  budgetPressureLabel.includes("over") ||
  capStatus !== "in_cap";

const combinedReadinessForAction = ({
  action,
  root,
}: {
  action: SearchConsumerActionFeatureDictionaryV0ActionRow;
  root?: SearchConsumerActionFeatureDictionaryV0RootFeatureRow;
}): SearchConsumerActionFeatureCasebookV0ReadinessLabel => {
  if (action.hasCollision || action.moveCountBucketId === 0) {
    return "consumer_ready_high_collision";
  }
  if (root && isHighBranchingBucket(root.cFp72BranchingRiskBucket)) {
    return "consumer_ready_high_branching";
  }
  if (
    root &&
    isOverBudgetContext({
      budgetPressureLabel: root.cFp73BudgetPressureLabel,
      capStatus: root.cFp74CapStatus,
    })
  ) {
    return "consumer_ready_over_budget_context";
  }
  return "consumer_ready";
};

interface AggregateBucket {
  dimension: SearchConsumerActionFeatureCasebookV0Dimension;
  key: string;
  rootRefs: Set<string>;
  actionCount: number;
  collisionActionCount: number;
  highBranchingActionCount: number;
  overBudgetActionCount: number;
}

const bucketKey = (dimension: SearchConsumerActionFeatureCasebookV0Dimension, key: string) =>
  `${dimension}\u0000${key}`;

const addAggregate = ({
  aggregates,
  dimension,
  key,
  rootRef,
  collision,
  highBranching,
  overBudget,
}: {
  aggregates: Map<string, AggregateBucket>;
  dimension: SearchConsumerActionFeatureCasebookV0Dimension;
  key: string;
  rootRef: string;
  collision: boolean;
  highBranching: boolean;
  overBudget: boolean;
}) => {
  const id = bucketKey(dimension, key);
  const bucket =
    aggregates.get(id) ??
    ({
      dimension,
      key,
      rootRefs: new Set<string>(),
      actionCount: 0,
      collisionActionCount: 0,
      highBranchingActionCount: 0,
      overBudgetActionCount: 0,
    } satisfies AggregateBucket);
  bucket.rootRefs.add(rootRef);
  bucket.actionCount += 1;
  if (collision) bucket.collisionActionCount += 1;
  if (highBranching) bucket.highBranchingActionCount += 1;
  if (overBudget) bucket.overBudgetActionCount += 1;
  aggregates.set(id, bucket);
};

const skippedRootDimensionValue = (
  row: SearchConsumerActionFeatureDictionaryV0SkippedRootRow,
  dimension: SearchConsumerActionFeatureCasebookV0Dimension,
): string | undefined => {
  if (dimension === "phase") return row.phase;
  if (dimension === "round") return String(row.round);
  if (dimension === "phase_round") return `${row.phase}|round_${row.round}`;
  if (dimension === "policy") return row.policyId;
  if (dimension === "faction") return row.faction;
  if (dimension === "deck_preset") return row.deckPresetId;
  if (dimension === "matchup") return row.matchupId;
  return undefined;
};

const skippedRootCountsByDimension = (
  skippedRoots: readonly SearchConsumerActionFeatureDictionaryV0SkippedRootRow[],
) => {
  const counts = new Map<string, number>();
  const exactDimensions: readonly SearchConsumerActionFeatureCasebookV0Dimension[] = [
    "phase",
    "round",
    "phase_round",
    "policy",
    "faction",
    "deck_preset",
    "matchup",
  ];

  skippedRoots.forEach((row) => {
    exactDimensions.forEach((dimension) => {
      const value = skippedRootDimensionValue(row, dimension);
      if (value !== undefined) counts.set(bucketKey(dimension, value), (counts.get(bucketKey(dimension, value)) ?? 0) + 1);
    });
  });

  return counts;
};

const readinessForBucket = ({
  bucket,
  skippedRootCount,
  skippedRootPercent,
  thresholds,
}: {
  bucket: AggregateBucket;
  skippedRootCount: number;
  skippedRootPercent: number;
  thresholds: SearchConsumerActionFeatureCasebookV0Thresholds;
}): SearchConsumerActionFeatureCasebookV0ReadinessLabel => {
  if (percent(bucket.collisionActionCount, bucket.actionCount) >= thresholds.highCollisionActionSharePercent) {
    return "consumer_ready_high_collision";
  }
  if (
    percent(bucket.highBranchingActionCount, bucket.actionCount) >=
    thresholds.highBranchingActionSharePercent
  ) {
    return "consumer_ready_high_branching";
  }
  if (
    percent(bucket.overBudgetActionCount, bucket.actionCount) >=
    thresholds.overBudgetActionSharePercent
  ) {
    return "consumer_ready_over_budget_context";
  }
  if (
    bucket.actionCount < thresholds.sparseActionCount ||
    bucket.rootRefs.size < thresholds.sparseRootCount
  ) {
    return "consumer_ready_sparse_slice";
  }
  if (skippedRootCount > 0 && skippedRootPercent >= thresholds.skippedRootContextPercent) {
    return "consumer_ready_skipped_root_context";
  }
  return "consumer_ready";
};

const notesForReadiness = ({
  readinessLabel,
  skippedRootCount,
}: {
  readinessLabel: SearchConsumerActionFeatureCasebookV0ReadinessLabel;
  skippedRootCount: number;
}): readonly SearchConsumerActionFeatureCasebookV0Note[] => {
  const notes = new Set<SearchConsumerActionFeatureCasebookV0Note>([
    "aggregate_slice_only",
    "source_dictionary_ready",
  ]);
  if (readinessLabel === "consumer_ready") notes.add("ordinary_coverage");
  if (readinessLabel === "consumer_ready_high_collision") notes.add("high_collision_share");
  if (readinessLabel === "consumer_ready_high_branching") notes.add("high_branching_context");
  if (readinessLabel === "consumer_ready_over_budget_context") {
    notes.add("over_budget_or_cap_pressure_context");
  }
  if (readinessLabel === "consumer_ready_sparse_slice") notes.add("sparse_slice_low_count");
  if (readinessLabel === "consumer_ready_skipped_root_context") {
    notes.add("inherited_skipped_roots_present");
  }
  if (skippedRootCount > 0) notes.add("inherited_skipped_roots_present");
  return [...notes].sort((left, right) => left.localeCompare(right));
};

const buildSourceConsistency = (input: SearchConsumerActionFeatureCasebookV0BuildInput) => {
  const cfp80RootFeatureCountActualDelta =
    input.cfp80Summary.rootFeatureRowCount - input.cfp80RootFeatures.length;
  const cfp80CompactActionCountActualDelta =
    input.cfp80Summary.compactActionFeatureRowCount - input.cfp80CompactActionFeatures.length;
  const cfp80SkippedRootCountActualDelta =
    input.cfp80Summary.skippedRootRowCount - input.cfp80SkippedRoots.length;
  const dictionaryMismatches = dictionaryGroupCountMismatches({
    summaryCounts: input.cfp80Summary.dictionaryGroupCounts,
    dictionaries: input.cfp80Dictionaries,
  });
  const invalidDictionaryIds = input.cfp80CompactActionFeatures.filter(
    (row) => !compactActionDictionaryIdsAreValid(input.cfp80Dictionaries, row),
  ).length;
  const rootRefs = new Set(input.cfp80RootFeatures.map((row) => row.rootRef));
  const invalidRootRefs = input.cfp80CompactActionFeatures.filter((row) => {
    const rootRef = valueFor(input.cfp80Dictionaries, "rootRefs", row.rootRefId);
    return rootRef === undefined || !rootRefs.has(rootRef);
  }).length;
  const cfp80RobustTargetStatus = input.cfp80Summary.robustTargetStatus ?? "not_declared";
  const robustTargetReady =
    input.suiteId !== "benchmark-v1-starter-matrix-robust-v1" ||
    cfp80RobustTargetStatus === "below_50_mb_target";

  const checks = [
    input.cfp80Summary.consumerReadinessStatus === "dictionary_ready",
    input.cfp80Summary.sourceConsistency.status === "ready",
    input.cfp80Summary.reconstructionStatus === "passed",
    input.cfp80Summary.reconstructionMismatchCount === 0,
    robustTargetReady,
    cfp80RootFeatureCountActualDelta === 0,
    cfp80CompactActionCountActualDelta === 0,
    cfp80SkippedRootCountActualDelta === 0,
    dictionaryMismatches === 0,
    invalidDictionaryIds === 0,
    invalidRootRefs === 0,
    input.sourceArtifactReferenceCount > 0,
    input.sourceArtifactEmptyHashCount === 0,
  ];

  return {
    status: checks.every(Boolean) ? "ready" : "not_ready",
    cfp80ConsumerReadinessStatus: input.cfp80Summary.consumerReadinessStatus,
    cfp80SourceConsistencyStatus: input.cfp80Summary.sourceConsistency.status,
    cfp80ReconstructionStatus: input.cfp80Summary.reconstructionStatus,
    cfp80ReconstructionMismatchCount: input.cfp80Summary.reconstructionMismatchCount,
    cfp80RobustTargetStatus,
    cfp80RootFeatureSummaryCount: input.cfp80Summary.rootFeatureRowCount,
    cfp80RootFeatureActualCount: input.cfp80RootFeatures.length,
    cfp80RootFeatureCountActualDelta,
    cfp80CompactActionSummaryCount: input.cfp80Summary.compactActionFeatureRowCount,
    cfp80CompactActionActualCount: input.cfp80CompactActionFeatures.length,
    cfp80CompactActionCountActualDelta,
    cfp80SkippedRootSummaryCount: input.cfp80Summary.skippedRootRowCount,
    cfp80SkippedRootActualCount: input.cfp80SkippedRoots.length,
    cfp80SkippedRootCountActualDelta,
    dictionaryGroupCountMismatches: dictionaryMismatches,
    compactActionRowsWithInvalidDictionaryIds: invalidDictionaryIds,
    compactActionRowsWithInvalidRootRefId: invalidRootRefs,
    skippedRootCountActualDelta: cfp80SkippedRootCountActualDelta,
    sourceArtifactReferenceCount: input.sourceArtifactReferenceCount,
    sourceArtifactEmptyHashCount: input.sourceArtifactEmptyHashCount,
  } satisfies SearchConsumerActionFeatureCasebookV0SourceConsistency;
};

const buildSkippedRootSummary = (
  input: SearchConsumerActionFeatureCasebookV0BuildInput,
): SearchConsumerActionFeatureCasebookV0SkippedRootSummary => {
  const countsByPhase: Record<string, number> = {};
  const countsByRound: Record<string, number> = {};
  const countsByPolicy: Record<string, number> = {};
  const countsByFaction: Record<string, number> = {};
  const countsByDeckPreset: Record<string, number> = {};
  const countsByMatchup: Record<string, number> = {};
  const countsBySkipReason: Record<string, number> = {};

  input.cfp80SkippedRoots.forEach((row) => {
    addCount(countsByPhase, row.phase);
    addCount(countsByRound, String(row.round));
    addCount(countsByPolicy, row.policyId);
    addCount(countsByFaction, row.faction);
    addCount(countsByDeckPreset, row.deckPresetId);
    addCount(countsByMatchup, row.matchupId);
    addCount(countsBySkipReason, row.skipReason);
  });

  return {
    schemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SKIPPED_ROOT_SUMMARY_SCHEMA_VERSION,
    casebookRunId: input.casebookRunId,
    suiteId: input.suiteId,
    rootFeatureRowCount: input.cfp80RootFeatures.length,
    compactActionFeatureRowCount: input.cfp80CompactActionFeatures.length,
    skippedRootRowCount: input.cfp80SkippedRoots.length,
    skippedRootPercent: percent(
      input.cfp80SkippedRoots.length,
      input.cfp80RootFeatures.length + input.cfp80SkippedRoots.length,
    ),
    countsByPhase: sortRecord(countsByPhase),
    countsByRound: sortRecord(countsByRound),
    countsByPolicy: sortRecord(countsByPolicy),
    countsByFaction: sortRecord(countsByFaction),
    countsByDeckPreset: sortRecord(countsByDeckPreset),
    countsByMatchup: sortRecord(countsByMatchup),
    countsBySkipReason: sortRecord(countsBySkipReason),
    inheritedSkippedRootContext: input.cfp80SkippedRoots.length > 0 ? "present" : "absent",
  };
};

const buildAggregates = (input: SearchConsumerActionFeatureCasebookV0BuildInput) => {
  const rootByRef = new Map(input.cfp80RootFeatures.map((root) => [root.rootRef, root]));
  const aggregates = new Map<string, AggregateBucket>();
  const countSummaries = emptyCountSummaries();

  input.cfp80CompactActionFeatures.forEach((action) => {
    const rootRef = valueFor(input.cfp80Dictionaries, "rootRefs", action.rootRefId);
    if (rootRef === undefined) return;
    const root = rootByRef.get(rootRef);
    if (!root) return;

    const kind = valueFor(input.cfp80Dictionaries, "actionKinds", action.kindId) ?? "unknown";
    const sourceClass =
      valueFor(input.cfp80Dictionaries, "sourceClasses", action.sourceClassId) ?? "unknown";
    const target = action.hasTarget
      ? (valueFor(input.cfp80Dictionaries, "targets", action.targetId) ?? "unknown")
      : "none";
    const moveCountBucket =
      valueFor(input.cfp80Dictionaries, "moveCountBuckets", action.moveCountBucketId) ??
      "unknown";
    const collisionFlag = action.hasCollision ? "collision" : "no_collision";
    const phaseRound = `${root.phase}|round_${root.round}`;
    const highBranching = isHighBranchingBucket(root.cFp72BranchingRiskBucket);
    const overBudget = isOverBudgetContext({
      budgetPressureLabel: root.cFp73BudgetPressureLabel,
      capStatus: root.cFp74CapStatus,
    });
    const combinedReadiness = combinedReadinessForAction({ action, root });

    const dimensions: readonly [SearchConsumerActionFeatureCasebookV0Dimension, string][] = [
      ["action_kind", kind],
      ["source_class", sourceClass],
      ["target", target],
      ["move_count_bucket", moveCountBucket],
      ["collision_flag", collisionFlag],
      ["phase", root.phase],
      ["round", String(root.round)],
      ["phase_round", phaseRound],
      ["policy", root.policyId],
      ["faction", root.faction],
      ["deck_preset", root.deckPresetId],
      ["matchup", root.matchupId],
      ["cfp70_availability_risk_bucket", root.cFp70AvailabilityRiskBucket],
      ["cfp71_outcome_risk_bucket", root.cFp71OutcomeRiskBucket],
      ["cfp72_branching_risk_bucket", root.cFp72BranchingRiskBucket],
      ["cfp73_budget_pressure_label", root.cFp73BudgetPressureLabel],
      ["cfp74_cap_status", root.cFp74CapStatus],
      ["combined_readiness", combinedReadiness],
    ];

    dimensions.forEach(([dimension, key]) =>
      addAggregate({
        aggregates,
        dimension,
        key,
        rootRef,
        collision: action.hasCollision,
        highBranching,
        overBudget,
      }),
    );

    addCount(countSummaries.publicActionKindCounts, kind);
    addCount(countSummaries.countsBySourceClass, sourceClass);
    addCount(countSummaries.countsByTargetToken, target);
    addCount(countSummaries.countsByMoveCountBucket, moveCountBucket);
    addCount(countSummaries.countsByCollisionFlag, collisionFlag);
    addCount(countSummaries.countsByPhase, root.phase);
    addCount(countSummaries.countsByRound, String(root.round));
    addCount(countSummaries.countsByPolicy, root.policyId);
    addCount(countSummaries.countsByFaction, root.faction);
    addCount(countSummaries.countsByDeckPreset, root.deckPresetId);
    addCount(countSummaries.countsByMatchup, root.matchupId);
    addCount(countSummaries.cFp70AvailabilityRiskBucketCounts, root.cFp70AvailabilityRiskBucket);
    addCount(countSummaries.cFp71OutcomeRiskBucketCounts, root.cFp71OutcomeRiskBucket);
    addCount(countSummaries.cFp72BranchingRiskBucketCounts, root.cFp72BranchingRiskBucket);
    addCount(countSummaries.cFp73BudgetPressureLabelCounts, root.cFp73BudgetPressureLabel);
    addCount(countSummaries.cFp74CapStatusCounts, root.cFp74CapStatus);
    addCount(countSummaries.combinedReadinessCounts, combinedReadiness);
  });

  return {
    aggregates,
    countSummaries: {
      publicActionKindCounts: sortRecord(countSummaries.publicActionKindCounts),
      countsBySourceClass: sortRecord(countSummaries.countsBySourceClass),
      countsByTargetToken: sortRecord(countSummaries.countsByTargetToken),
      countsByMoveCountBucket: sortRecord(countSummaries.countsByMoveCountBucket),
      countsByCollisionFlag: sortRecord(countSummaries.countsByCollisionFlag),
      countsByPhase: sortRecord(countSummaries.countsByPhase),
      countsByRound: sortRecord(countSummaries.countsByRound),
      countsByPolicy: sortRecord(countSummaries.countsByPolicy),
      countsByFaction: sortRecord(countSummaries.countsByFaction),
      countsByDeckPreset: sortRecord(countSummaries.countsByDeckPreset),
      countsByMatchup: sortRecord(countSummaries.countsByMatchup),
      cFp70AvailabilityRiskBucketCounts: sortRecord(
        countSummaries.cFp70AvailabilityRiskBucketCounts,
      ),
      cFp71OutcomeRiskBucketCounts: sortRecord(countSummaries.cFp71OutcomeRiskBucketCounts),
      cFp72BranchingRiskBucketCounts: sortRecord(
        countSummaries.cFp72BranchingRiskBucketCounts,
      ),
      cFp73BudgetPressureLabelCounts: sortRecord(countSummaries.cFp73BudgetPressureLabelCounts),
      cFp74CapStatusCounts: sortRecord(countSummaries.cFp74CapStatusCounts),
      combinedReadinessCounts: sortRecord(countSummaries.combinedReadinessCounts),
    },
  };
};

const buildSliceSummaries = ({
  input,
  aggregates,
  thresholds,
}: {
  input: SearchConsumerActionFeatureCasebookV0BuildInput;
  aggregates: Map<string, AggregateBucket>;
  thresholds: SearchConsumerActionFeatureCasebookV0Thresholds;
}): SearchConsumerActionFeatureCasebookV0SliceSummaryRow[] => {
  const skippedCounts = skippedRootCountsByDimension(input.cfp80SkippedRoots);
  const sourceRootCount = input.cfp80RootFeatures.length;
  const sourceActionCount = input.cfp80CompactActionFeatures.length;
  const sourceSkippedRootCount = input.cfp80SkippedRoots.length;

  return [...aggregates.values()]
    .map((bucket) => {
      const exactSkippedRootCount = skippedCounts.get(bucketKey(bucket.dimension, bucket.key));
      const skippedRootCount = exactSkippedRootCount ?? sourceSkippedRootCount;
      const skippedRootPercent = skippedPercentFor({
        skippedRootCount,
        rootCount: bucket.rootRefs.size,
        sourceRootCount,
        sourceSkippedRootCount,
        exact: exactSkippedRootCount !== undefined,
      });
      const readinessLabel =
        bucket.dimension === "combined_readiness" &&
        bucket.key in emptyReadinessCounts()
          ? (bucket.key as SearchConsumerActionFeatureCasebookV0ReadinessLabel)
          : readinessForBucket({ bucket, skippedRootCount, skippedRootPercent, thresholds });

      return {
        schemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SLICE_SUMMARY_SCHEMA_VERSION,
        casebookRunId: input.casebookRunId,
        suiteId: input.suiteId,
        dimension: bucket.dimension,
        key: bucket.key,
        rootCount: bucket.rootRefs.size,
        actionCount: bucket.actionCount,
        skippedRootCount,
        skippedRootPercent,
        actionPercent: percent(bucket.actionCount, sourceActionCount),
        rootPercent: percent(bucket.rootRefs.size, sourceRootCount),
        readinessLabel,
        readinessLabelCounts: { [readinessLabel]: 1 },
      } satisfies SearchConsumerActionFeatureCasebookV0SliceSummaryRow;
    })
    .sort(
      (left, right) =>
        left.dimension.localeCompare(right.dimension) ||
        right.actionCount - left.actionCount ||
        right.rootCount - left.rootCount ||
        left.key.localeCompare(right.key),
    );
};

const casebookDimensionByRowKind: Record<
  SearchConsumerActionFeatureCasebookV0RowKind,
  SearchConsumerActionFeatureCasebookV0Dimension
> = {
  action_kind_slice: "action_kind",
  source_class_slice: "source_class",
  target_slice: "target",
  move_count_bucket_slice: "move_count_bucket",
  collision_slice: "collision_flag",
  phase_round_slice: "phase_round",
  faction_slice: "faction",
  deck_preset_slice: "deck_preset",
  matchup_slice: "matchup",
  branching_risk_slice: "cfp72_branching_risk_bucket",
  second_ply_cap_slice: "cfp74_cap_status",
  combined_readiness_slice: "combined_readiness",
};

const rowKindOrder: readonly SearchConsumerActionFeatureCasebookV0RowKind[] = [
  "action_kind_slice",
  "source_class_slice",
  "target_slice",
  "move_count_bucket_slice",
  "collision_slice",
  "phase_round_slice",
  "faction_slice",
  "deck_preset_slice",
  "matchup_slice",
  "branching_risk_slice",
  "second_ply_cap_slice",
  "combined_readiness_slice",
];

const buildCasebookRows = ({
  input,
  sliceSummaries,
  thresholds,
}: {
  input: SearchConsumerActionFeatureCasebookV0BuildInput;
  sliceSummaries: readonly SearchConsumerActionFeatureCasebookV0SliceSummaryRow[];
  thresholds: SearchConsumerActionFeatureCasebookV0Thresholds;
}): SearchConsumerActionFeatureCasebookV0Row[] => {
  const rows: SearchConsumerActionFeatureCasebookV0Row[] = [];
  rowKindOrder.forEach((rowKind) => {
    const dimension = casebookDimensionByRowKind[rowKind];
    const matching = sliceSummaries
      .filter((summary) => summary.dimension === dimension)
      .sort(
        (left, right) =>
          right.actionCount - left.actionCount ||
          right.rootCount - left.rootCount ||
          left.key.localeCompare(right.key),
      )
      .slice(0, thresholds.maxCasebookRowsPerKind);

    matching.forEach((summary, index) => {
      rows.push({
        schemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_ROW_SCHEMA_VERSION,
        casebookRunId: input.casebookRunId,
        suiteId: input.suiteId,
        rowRef: `${rowKind}_${String(index + 1).padStart(3, "0")}`,
        rowKind,
        sliceKey: summary.key,
        rootCount: summary.rootCount,
        actionCount: summary.actionCount,
        skippedRootCount: summary.skippedRootCount,
        skippedRootPercent: summary.skippedRootPercent,
        actionPercent: summary.actionPercent,
        rootPercent: summary.rootPercent,
        readinessLabel: summary.readinessLabel,
        notes: notesForReadiness({
          readinessLabel: summary.readinessLabel,
          skippedRootCount: summary.skippedRootCount,
        }),
      });
    });
  });
  return rows;
};

const readinessLabelCountsForRows = (
  rows: readonly SearchConsumerActionFeatureCasebookV0Row[],
) => {
  const counts = emptyReadinessCounts();
  rows.forEach((row) => {
    counts[row.readinessLabel] += 1;
  });
  return counts;
};

const rowKindCountsForRows = (rows: readonly SearchConsumerActionFeatureCasebookV0Row[]) => {
  const counts = emptyRowKindCounts();
  rows.forEach((row) => {
    counts[row.rowKind] += 1;
  });
  return counts;
};

export const buildSearchConsumerActionFeatureCasebookV0SourceConsistency =
  buildSourceConsistency;

export const buildSearchConsumerActionFeatureCasebookV0Result = (
  input: SearchConsumerActionFeatureCasebookV0BuildInput,
): SearchConsumerActionFeatureCasebookV0Result => {
  const thresholds = SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_THRESHOLDS;
  const sourceConsistency = buildSourceConsistency(input);
  const skippedRootSummary = buildSkippedRootSummary(input);

  if (sourceConsistency.status !== "ready") {
    return {
      consumerReadinessStatus: "source_consistency_failed",
      sourceConsistency,
      casebookRows: [],
      sliceSummaries: [],
      skippedRootSummary,
      countSummaries: emptyCountSummaries(),
      readinessLabelCounts: emptyReadinessCounts(),
      casebookRowKindCounts: emptyRowKindCounts(),
      thresholds,
    };
  }

  const { aggregates, countSummaries } = buildAggregates(input);
  const sliceSummaries = buildSliceSummaries({ input, aggregates, thresholds });
  const casebookRows = buildCasebookRows({ input, sliceSummaries, thresholds });

  return {
    consumerReadinessStatus: "casebook_ready",
    sourceConsistency,
    casebookRows,
    sliceSummaries,
    skippedRootSummary,
    countSummaries,
    readinessLabelCounts: readinessLabelCountsForRows(casebookRows),
    casebookRowKindCounts: rowKindCountsForRows(casebookRows),
    thresholds,
  };
};
