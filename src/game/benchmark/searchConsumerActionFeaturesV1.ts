import type {
  PublicActionIdentitiesCompactV0ActionRow,
  PublicActionIdentitiesCompactV0RootIndexRow,
  PublicActionIdentitiesCompactV0SkippedRootRow,
} from "./publicActionIdentitiesCompactV0";
import type {
  SearchConsumerActionFeaturesV0RootFeatureRow,
  SearchConsumerActionFeaturesV0SkippedRootRow,
} from "./searchConsumerActionFeaturesV0";
import type { DeterminizedProbeContractSourceArtifactReference } from "./determinizedProbeContract";

export type SearchConsumerActionFeaturesV1RootFeatureSchemaVersion =
  "search-consumer-action-features-v1-root-feature-v1";
export type SearchConsumerActionFeaturesV1ActionFeatureSchemaVersion =
  "search-consumer-action-features-v1-action-feature-v1";
export type SearchConsumerActionFeaturesV1SkippedRootSchemaVersion =
  "search-consumer-action-features-v1-skipped-root-v1";
export type SearchConsumerActionFeaturesV1SummarySchemaVersion =
  "search-consumer-action-features-v1-summary-v1";

export type SearchConsumerActionFeaturesV1ConsumerReadinessStatus =
  | "features_ready"
  | "source_consistency_failed";

export type SearchConsumerActionFeaturesV1SourceArtifactReference =
  DeterminizedProbeContractSourceArtifactReference;

export type SearchConsumerActionFeaturesV1MoveCountBucket =
  | "single"
  | "small_collision"
  | "large_collision";

export interface SearchConsumerActionFeaturesV1RootIdentity {
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorGroupId?: string;
  mirrorIndex?: number;
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

export interface SearchConsumerActionFeaturesV1Cfp76SummaryInput {
  featureRunId: string;
  suiteId: string;
  consumerReadinessStatus: string;
  rootFeatureRowCount: number;
  skippedRootRowCount: number;
  sourceConsistency: { status: string };
}

export interface SearchConsumerActionFeaturesV1Cfp78SummaryInput {
  compactRunId: string;
  suiteId: string;
  compactReadinessStatus: string;
  compactActionRowCount: number;
  compactRootIndexRowCount: number;
  compactSkippedRootRowCount: number;
  sourceConsistency: { status: string };
}

export interface SearchConsumerActionFeaturesV1RootFeatureRow
  extends Omit<
    SearchConsumerActionFeaturesV0RootFeatureRow,
    | "schemaVersion"
    | "featureRunId"
    | "consumerReadinessStatus"
    | "sourceConsistencyStatus"
    | "cFp73PrimaryCasebookLabel"
    | "cFp73BudgetPressureLabel"
    | "cFp73TransitionContextLabel"
    | "cFp74PlannedSecondPlyPairCount"
  > {
  schemaVersion: SearchConsumerActionFeaturesV1RootFeatureSchemaVersion;
  featureRunId: string;
  rootRef: string;
  cFp73PrimaryCasebookLabel: string;
  cFp73BudgetPressureLabel: string;
  cFp73TransitionContextLabel: string;
  cFp74PlannedSecondPlyPairCount: number;
  sourceConsistencyStatus: "ready";
  consumerReadinessStatus: "features_ready";
}

export interface SearchConsumerActionFeaturesV1ActionFeatureRow {
  schemaVersion: SearchConsumerActionFeaturesV1ActionFeatureSchemaVersion;
  featureRunId: string;
  rootRef: string;
  publicActionRef: string;
  kind: string;
  ordinal: number;
  moveCount: number;
  sourceClass: string;
  target?: string;
  strengthBucket?: string;
  optionIndexLabel?: string;
  moveCountBucket: SearchConsumerActionFeaturesV1MoveCountBucket;
  collisionCountWithinBucket: number;
  hasCollision: boolean;
  hasTarget: boolean;
  hasStrengthBucket: boolean;
  hasOptionIndexLabel: boolean;
  rootFeatureRef: string;
  actionIdentityRef: string;
  sourceConsistencyStatus: "ready";
  consumerReadinessStatus: "features_ready";
}

export interface SearchConsumerActionFeaturesV1SkippedRootRow
  extends Omit<
    SearchConsumerActionFeaturesV0SkippedRootRow,
    "schemaVersion" | "featureRunId" | "consumerReadinessStatus" | "skipStage"
  > {
  schemaVersion: SearchConsumerActionFeaturesV1SkippedRootSchemaVersion;
  featureRunId: string;
  consumerReadinessStatus: "skipped_invalid_root";
  skipStage: string;
  cFp76SkipStage: string;
  cFp78SkipStage: string;
  cFp78IdentityReadinessStatus: string;
}

export interface SearchConsumerActionFeaturesV1SourceConsistency {
  status: "ready" | "not_ready";
  cfp76ConsumerReadinessStatus: string;
  cfp76SourceConsistencyStatus: string;
  cfp78CompactReadinessStatus: string;
  cfp78SourceConsistencyStatus: string;
  cfp76RootFeatureSummaryCount: number;
  cfp76RootFeatureActualCount: number;
  cfp76RootFeatureCountActualDelta: number;
  cfp76SkippedRootSummaryCount: number;
  cfp76SkippedRootActualCount: number;
  cfp76SkippedRootCountActualDelta: number;
  cfp78CompactActionSummaryCount: number;
  cfp78CompactActionActualCount: number;
  cfp78CompactActionCountActualDelta: number;
  cfp78RootIndexSummaryCount: number;
  cfp78RootIndexActualCount: number;
  cfp78RootIndexCountActualDelta: number;
  cfp78SkippedRootSummaryCount: number;
  cfp78SkippedRootActualCount: number;
  cfp78SkippedRootCountActualDelta: number;
  duplicateCfp76RootIdentityKeys: number;
  duplicateCfp78RootIdentityKeys: number;
  cfp76RootFeaturesWithoutCfp78RootIndex: number;
  cfp78RootIndexRowsWithoutCfp76RootFeature: number;
  cfp76SkippedRootsWithoutCfp78SkippedRoot: number;
  cfp78SkippedRootsWithoutCfp76SkippedRoot: number;
  cfp79RootFeatureRowCount: number;
  cfp79RootFeatureVsCfp76Delta: number;
  cfp79ActionFeatureRowCount: number;
  cfp79ActionFeatureVsCfp78Delta: number;
  cfp79SkippedRootRowCount: number;
  cfp79SkippedRootVsCfp76Delta: number;
  cfp79SkippedRootVsCfp78Delta: number;
  cfp79ActionRowsMissingRootFeature: number;
  cfp78ActionIdentitiesMissingCfp79ActionFeatures: number;
  duplicateCfp79RootRefs: number;
  duplicateCfp79ActionIdentityRefs: number;
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

export interface SearchConsumerActionFeaturesV1BuildInput {
  suiteId: string;
  featureRunId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp76RunId: string;
  sourceCfp78RunId: string;
  cfp76Summary: SearchConsumerActionFeaturesV1Cfp76SummaryInput;
  cfp76RootFeatures: readonly SearchConsumerActionFeaturesV0RootFeatureRow[];
  cfp76SkippedRoots: readonly SearchConsumerActionFeaturesV0SkippedRootRow[];
  cfp78Summary: SearchConsumerActionFeaturesV1Cfp78SummaryInput;
  cfp78ActionIdentities: readonly PublicActionIdentitiesCompactV0ActionRow[];
  cfp78RootIndexRows: readonly PublicActionIdentitiesCompactV0RootIndexRow[];
  cfp78SkippedRoots: readonly PublicActionIdentitiesCompactV0SkippedRootRow[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

export interface SearchConsumerActionFeaturesV1CountSummaries {
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
}

export interface SearchConsumerActionFeaturesV1Result {
  consumerReadinessStatus: SearchConsumerActionFeaturesV1ConsumerReadinessStatus;
  sourceConsistency: SearchConsumerActionFeaturesV1SourceConsistency;
  rootFeatures: readonly SearchConsumerActionFeaturesV1RootFeatureRow[];
  actionFeatures: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[];
  skippedRoots: readonly SearchConsumerActionFeaturesV1SkippedRootRow[];
  countSummaries: SearchConsumerActionFeaturesV1CountSummaries;
}

const sortRecord = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

const addCount = (record: Record<string, number>, key: string, by = 1) => {
  record[key] = (record[key] ?? 0) + by;
};

export const searchConsumerActionFeaturesV1MoveCountBucket = (
  moveCount: number,
): SearchConsumerActionFeaturesV1MoveCountBucket => {
  if (moveCount <= 1) return "single";
  if (moveCount <= 3) return "small_collision";
  return "large_collision";
};

export const buildSearchConsumerActionFeaturesV1PublicRootKey = (
  root: SearchConsumerActionFeaturesV1RootIdentity,
): string =>
  [
    root.suiteId,
    root.matchupId,
    String(root.seed),
    root.mirrorGroupId ?? "none",
    root.mirrorIndex === undefined ? "none" : String(root.mirrorIndex),
    String(root.step),
    String(root.decisionIndex),
    root.phase,
    String(root.round),
    root.seatId,
    root.policyId,
    root.faction,
    root.deckPresetId,
    root.rootPublicFingerprint,
  ].join("|");

const keyCounts = <T extends SearchConsumerActionFeaturesV1RootIdentity>(
  rows: readonly T[],
): Map<string, number> => {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const key = buildSearchConsumerActionFeaturesV1PublicRootKey(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return counts;
};

const duplicateCount = <T>(values: readonly T[]): number => {
  const counts = new Map<T, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.values()].filter((count) => count > 1).length;
};

const uniqueByPublicRootKey = <T extends SearchConsumerActionFeaturesV1RootIdentity>(
  rows: readonly T[],
): Map<string, T> => {
  const counts = keyCounts(rows);
  const map = new Map<string, T>();
  rows.forEach((row) => {
    const key = buildSearchConsumerActionFeaturesV1PublicRootKey(row);
    if (counts.get(key) === 1) map.set(key, row);
  });
  return map;
};

export const buildSearchConsumerActionFeaturesV1RootFeatureRows = (
  input: SearchConsumerActionFeaturesV1BuildInput,
): SearchConsumerActionFeaturesV1RootFeatureRow[] => {
  const cfp78ByPublicRootKey = uniqueByPublicRootKey(input.cfp78RootIndexRows);

  return input.cfp76RootFeatures.flatMap((root) => {
    const rootIndex = cfp78ByPublicRootKey.get(
      buildSearchConsumerActionFeaturesV1PublicRootKey(root),
    );
    if (!rootIndex) return [];

    return [
      {
        ...root,
        schemaVersion: "search-consumer-action-features-v1-root-feature-v1",
        featureRunId: input.featureRunId,
        rootRef: rootIndex.rootRef,
        cFp73PrimaryCasebookLabel: root.cFp73PrimaryCasebookLabel ?? "not_in_casebook",
        cFp73BudgetPressureLabel: root.cFp73BudgetPressureLabel ?? "unknown",
        cFp73TransitionContextLabel: root.cFp73TransitionContextLabel ?? "unknown",
        cFp74PlannedSecondPlyPairCount: root.cFp74PlannedSecondPlyPairCount ?? 0,
        sourceConsistencyStatus: "ready",
        consumerReadinessStatus: "features_ready",
      },
    ];
  });
};

export const buildSearchConsumerActionFeaturesV1ActionFeatureRows = (
  input: SearchConsumerActionFeaturesV1BuildInput,
): SearchConsumerActionFeaturesV1ActionFeatureRow[] =>
  input.cfp78ActionIdentities.map((row) => {
    const moveCountBucket = searchConsumerActionFeaturesV1MoveCountBucket(row.moveCount);
    return {
      schemaVersion: "search-consumer-action-features-v1-action-feature-v1",
      featureRunId: input.featureRunId,
      rootRef: row.rootRef,
      publicActionRef: row.publicActionRef,
      kind: row.kind,
      ordinal: row.ordinal,
      moveCount: row.moveCount,
      sourceClass: row.sourceClass,
      ...(row.target !== undefined ? { target: row.target } : {}),
      ...(row.strengthBucket !== undefined ? { strengthBucket: row.strengthBucket } : {}),
      ...(row.optionIndexLabel !== undefined ? { optionIndexLabel: row.optionIndexLabel } : {}),
      moveCountBucket,
      collisionCountWithinBucket: Math.max(0, row.moveCount - 1),
      hasCollision: row.moveCount > 1,
      hasTarget: row.target !== undefined,
      hasStrengthBucket: row.strengthBucket !== undefined,
      hasOptionIndexLabel: row.optionIndexLabel !== undefined,
      rootFeatureRef: row.rootRef,
      actionIdentityRef: `${row.rootRef}::${row.publicActionRef}`,
      sourceConsistencyStatus: "ready",
      consumerReadinessStatus: "features_ready",
    };
  });

export const buildSearchConsumerActionFeaturesV1SkippedRootRows = (
  input: SearchConsumerActionFeaturesV1BuildInput,
): SearchConsumerActionFeaturesV1SkippedRootRow[] => {
  const cfp76ByPublicRootKey = uniqueByPublicRootKey(input.cfp76SkippedRoots);

  return input.cfp78SkippedRoots.flatMap((root) => {
    const cfp76 = cfp76ByPublicRootKey.get(
      buildSearchConsumerActionFeaturesV1PublicRootKey(root),
    );
    if (!cfp76) return [];

    return [
      {
        ...cfp76,
        schemaVersion: "search-consumer-action-features-v1-skipped-root-v1",
        featureRunId: input.featureRunId,
        consumerReadinessStatus: "skipped_invalid_root",
        skipStage: root.skipStage,
        cFp76SkipStage: cfp76.skipStage,
        cFp78SkipStage: root.skipStage,
        cFp78IdentityReadinessStatus: root.identityReadinessStatus,
      },
    ];
  });
};

export const buildSearchConsumerActionFeaturesV1SourceConsistency = (
  input: SearchConsumerActionFeaturesV1BuildInput,
  rootFeatures: readonly SearchConsumerActionFeaturesV1RootFeatureRow[],
  actionFeatures: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[],
  skippedRoots: readonly SearchConsumerActionFeaturesV1SkippedRootRow[],
): SearchConsumerActionFeaturesV1SourceConsistency => {
  const cfp76RootCounts = keyCounts(input.cfp76RootFeatures);
  const cfp78RootCounts = keyCounts(input.cfp78RootIndexRows);
  const cfp76SkippedCounts = keyCounts(input.cfp76SkippedRoots);
  const cfp78SkippedCounts = keyCounts(input.cfp78SkippedRoots);

  const cfp76RootFeatureCountActualDelta =
    input.cfp76Summary.rootFeatureRowCount - input.cfp76RootFeatures.length;
  const cfp76SkippedRootCountActualDelta =
    input.cfp76Summary.skippedRootRowCount - input.cfp76SkippedRoots.length;
  const cfp78CompactActionCountActualDelta =
    input.cfp78Summary.compactActionRowCount - input.cfp78ActionIdentities.length;
  const cfp78RootIndexCountActualDelta =
    input.cfp78Summary.compactRootIndexRowCount - input.cfp78RootIndexRows.length;
  const cfp78SkippedRootCountActualDelta =
    input.cfp78Summary.compactSkippedRootRowCount - input.cfp78SkippedRoots.length;

  const cfp76RootFeaturesWithoutCfp78RootIndex = input.cfp76RootFeatures.filter(
    (root) =>
      cfp78RootCounts.get(buildSearchConsumerActionFeaturesV1PublicRootKey(root)) !== 1,
  ).length;
  const cfp78RootIndexRowsWithoutCfp76RootFeature = input.cfp78RootIndexRows.filter(
    (root) =>
      cfp76RootCounts.get(buildSearchConsumerActionFeaturesV1PublicRootKey(root)) !== 1,
  ).length;
  const cfp76SkippedRootsWithoutCfp78SkippedRoot = input.cfp76SkippedRoots.filter(
    (root) =>
      cfp78SkippedCounts.get(buildSearchConsumerActionFeaturesV1PublicRootKey(root)) !== 1,
  ).length;
  const cfp78SkippedRootsWithoutCfp76SkippedRoot = input.cfp78SkippedRoots.filter(
    (root) =>
      cfp76SkippedCounts.get(buildSearchConsumerActionFeaturesV1PublicRootKey(root)) !== 1,
  ).length;

  const rootFeatureRefs = new Set(rootFeatures.map((row) => row.rootRef));
  const actionFeatureRefs = new Set(actionFeatures.map((row) => row.actionIdentityRef));

  const cfp79RootFeatureVsCfp76Delta = rootFeatures.length - input.cfp76RootFeatures.length;
  const cfp79ActionFeatureVsCfp78Delta =
    actionFeatures.length - input.cfp78ActionIdentities.length;
  const cfp79SkippedRootVsCfp76Delta = skippedRoots.length - input.cfp76SkippedRoots.length;
  const cfp79SkippedRootVsCfp78Delta = skippedRoots.length - input.cfp78SkippedRoots.length;
  const cfp79ActionRowsMissingRootFeature = actionFeatures.filter(
    (row) => !rootFeatureRefs.has(row.rootRef),
  ).length;
  const cfp78ActionIdentitiesMissingCfp79ActionFeatures = input.cfp78ActionIdentities.filter(
    (row) => !actionFeatureRefs.has(`${row.rootRef}::${row.publicActionRef}`),
  ).length;

  const duplicateCfp76RootIdentityKeys = [...cfp76RootCounts.values()].filter(
    (count) => count > 1,
  ).length;
  const duplicateCfp78RootIdentityKeys = [...cfp78RootCounts.values()].filter(
    (count) => count > 1,
  ).length;
  const duplicateCfp79RootRefs = duplicateCount(rootFeatures.map((row) => row.rootRef));
  const duplicateCfp79ActionIdentityRefs = duplicateCount(
    actionFeatures.map((row) => row.actionIdentityRef),
  );

  const checks: boolean[] = [
    input.cfp76Summary.consumerReadinessStatus === "action_feature_source_gap",
    input.cfp76Summary.sourceConsistency.status === "ready",
    input.cfp78Summary.compactReadinessStatus === "compact_ready",
    input.cfp78Summary.sourceConsistency.status === "ready",
    cfp76RootFeatureCountActualDelta === 0,
    cfp76SkippedRootCountActualDelta === 0,
    cfp78CompactActionCountActualDelta === 0,
    cfp78RootIndexCountActualDelta === 0,
    cfp78SkippedRootCountActualDelta === 0,
    duplicateCfp76RootIdentityKeys === 0,
    duplicateCfp78RootIdentityKeys === 0,
    cfp76RootFeaturesWithoutCfp78RootIndex === 0,
    cfp78RootIndexRowsWithoutCfp76RootFeature === 0,
    cfp76SkippedRootsWithoutCfp78SkippedRoot === 0,
    cfp78SkippedRootsWithoutCfp76SkippedRoot === 0,
    cfp79RootFeatureVsCfp76Delta === 0,
    cfp79ActionFeatureVsCfp78Delta === 0,
    cfp79SkippedRootVsCfp76Delta === 0,
    cfp79SkippedRootVsCfp78Delta === 0,
    cfp79ActionRowsMissingRootFeature === 0,
    cfp78ActionIdentitiesMissingCfp79ActionFeatures === 0,
    duplicateCfp79RootRefs === 0,
    duplicateCfp79ActionIdentityRefs === 0,
    input.sourceArtifactReferenceCount > 0,
    input.sourceArtifactEmptyHashCount === 0,
  ];

  return {
    status: checks.every(Boolean) ? "ready" : "not_ready",
    cfp76ConsumerReadinessStatus: input.cfp76Summary.consumerReadinessStatus,
    cfp76SourceConsistencyStatus: input.cfp76Summary.sourceConsistency.status,
    cfp78CompactReadinessStatus: input.cfp78Summary.compactReadinessStatus,
    cfp78SourceConsistencyStatus: input.cfp78Summary.sourceConsistency.status,
    cfp76RootFeatureSummaryCount: input.cfp76Summary.rootFeatureRowCount,
    cfp76RootFeatureActualCount: input.cfp76RootFeatures.length,
    cfp76RootFeatureCountActualDelta,
    cfp76SkippedRootSummaryCount: input.cfp76Summary.skippedRootRowCount,
    cfp76SkippedRootActualCount: input.cfp76SkippedRoots.length,
    cfp76SkippedRootCountActualDelta,
    cfp78CompactActionSummaryCount: input.cfp78Summary.compactActionRowCount,
    cfp78CompactActionActualCount: input.cfp78ActionIdentities.length,
    cfp78CompactActionCountActualDelta,
    cfp78RootIndexSummaryCount: input.cfp78Summary.compactRootIndexRowCount,
    cfp78RootIndexActualCount: input.cfp78RootIndexRows.length,
    cfp78RootIndexCountActualDelta,
    cfp78SkippedRootSummaryCount: input.cfp78Summary.compactSkippedRootRowCount,
    cfp78SkippedRootActualCount: input.cfp78SkippedRoots.length,
    cfp78SkippedRootCountActualDelta,
    duplicateCfp76RootIdentityKeys,
    duplicateCfp78RootIdentityKeys,
    cfp76RootFeaturesWithoutCfp78RootIndex,
    cfp78RootIndexRowsWithoutCfp76RootFeature,
    cfp76SkippedRootsWithoutCfp78SkippedRoot,
    cfp78SkippedRootsWithoutCfp76SkippedRoot,
    cfp79RootFeatureRowCount: rootFeatures.length,
    cfp79RootFeatureVsCfp76Delta,
    cfp79ActionFeatureRowCount: actionFeatures.length,
    cfp79ActionFeatureVsCfp78Delta,
    cfp79SkippedRootRowCount: skippedRoots.length,
    cfp79SkippedRootVsCfp76Delta,
    cfp79SkippedRootVsCfp78Delta,
    cfp79ActionRowsMissingRootFeature,
    cfp78ActionIdentitiesMissingCfp79ActionFeatures,
    duplicateCfp79RootRefs,
    duplicateCfp79ActionIdentityRefs,
    sourceArtifactReferenceCount: input.sourceArtifactReferenceCount,
    sourceArtifactEmptyHashCount: input.sourceArtifactEmptyHashCount,
  };
};

const emptyCountSummaries = (): SearchConsumerActionFeaturesV1CountSummaries => ({
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
});

export const buildSearchConsumerActionFeaturesV1CountSummaries = ({
  rootFeatures,
  actionFeatures,
}: {
  rootFeatures: readonly SearchConsumerActionFeaturesV1RootFeatureRow[];
  actionFeatures: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[];
}): SearchConsumerActionFeaturesV1CountSummaries => {
  const summaries = emptyCountSummaries();
  const rootsByRef = new Map(rootFeatures.map((root) => [root.rootRef, root]));

  actionFeatures.forEach((action) => {
    const root = rootsByRef.get(action.rootRef);
    addCount(summaries.publicActionKindCounts, action.kind);
    addCount(summaries.countsBySourceClass, action.sourceClass);
    addCount(summaries.countsByTargetToken, action.target ?? "none");
    addCount(summaries.countsByMoveCountBucket, action.moveCountBucket);
    addCount(summaries.countsByCollisionFlag, action.hasCollision ? "collision" : "no_collision");

    if (!root) return;
    addCount(summaries.countsByPhase, root.phase);
    addCount(summaries.countsByRound, String(root.round));
    addCount(summaries.countsByPolicy, root.policyId);
    addCount(summaries.countsByFaction, root.faction);
    addCount(summaries.countsByDeckPreset, root.deckPresetId);
    addCount(summaries.countsByMatchup, root.matchupId);
    addCount(summaries.cFp70AvailabilityRiskBucketCounts, root.cFp70AvailabilityRiskBucket);
    addCount(summaries.cFp71OutcomeRiskBucketCounts, root.cFp71OutcomeRiskBucket);
    addCount(summaries.cFp72BranchingRiskBucketCounts, root.cFp72BranchingRiskBucket);
    addCount(summaries.cFp73BudgetPressureLabelCounts, root.cFp73BudgetPressureLabel);
    addCount(summaries.cFp74CapStatusCounts, root.cFp74CapStatus);
  });

  return {
    publicActionKindCounts: sortRecord(summaries.publicActionKindCounts),
    countsBySourceClass: sortRecord(summaries.countsBySourceClass),
    countsByTargetToken: sortRecord(summaries.countsByTargetToken),
    countsByMoveCountBucket: sortRecord(summaries.countsByMoveCountBucket),
    countsByCollisionFlag: sortRecord(summaries.countsByCollisionFlag),
    countsByPhase: sortRecord(summaries.countsByPhase),
    countsByRound: sortRecord(summaries.countsByRound),
    countsByPolicy: sortRecord(summaries.countsByPolicy),
    countsByFaction: sortRecord(summaries.countsByFaction),
    countsByDeckPreset: sortRecord(summaries.countsByDeckPreset),
    countsByMatchup: sortRecord(summaries.countsByMatchup),
    cFp70AvailabilityRiskBucketCounts: sortRecord(summaries.cFp70AvailabilityRiskBucketCounts),
    cFp71OutcomeRiskBucketCounts: sortRecord(summaries.cFp71OutcomeRiskBucketCounts),
    cFp72BranchingRiskBucketCounts: sortRecord(summaries.cFp72BranchingRiskBucketCounts),
    cFp73BudgetPressureLabelCounts: sortRecord(summaries.cFp73BudgetPressureLabelCounts),
    cFp74CapStatusCounts: sortRecord(summaries.cFp74CapStatusCounts),
  };
};

export const buildSearchConsumerActionFeaturesV1Result = (
  input: SearchConsumerActionFeaturesV1BuildInput,
): SearchConsumerActionFeaturesV1Result => {
  const projectedRootFeatures = buildSearchConsumerActionFeaturesV1RootFeatureRows(input);
  const projectedActionFeatures = buildSearchConsumerActionFeaturesV1ActionFeatureRows(input);
  const projectedSkippedRoots = buildSearchConsumerActionFeaturesV1SkippedRootRows(input);
  const sourceConsistency = buildSearchConsumerActionFeaturesV1SourceConsistency(
    input,
    projectedRootFeatures,
    projectedActionFeatures,
    projectedSkippedRoots,
  );

  if (sourceConsistency.status !== "ready") {
    return {
      consumerReadinessStatus: "source_consistency_failed",
      sourceConsistency,
      rootFeatures: [],
      actionFeatures: [],
      skippedRoots: [],
      countSummaries: emptyCountSummaries(),
    };
  }

  return {
    consumerReadinessStatus: "features_ready",
    sourceConsistency,
    rootFeatures: projectedRootFeatures,
    actionFeatures: projectedActionFeatures,
    skippedRoots: projectedSkippedRoots,
    countSummaries: buildSearchConsumerActionFeaturesV1CountSummaries({
      rootFeatures: projectedRootFeatures,
      actionFeatures: projectedActionFeatures,
    }),
  };
};
