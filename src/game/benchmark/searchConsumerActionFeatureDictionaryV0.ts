import type {
  SearchConsumerActionFeaturesV1ActionFeatureRow,
  SearchConsumerActionFeaturesV1ActionFeatureSchemaVersion,
  SearchConsumerActionFeaturesV1CountSummaries,
  SearchConsumerActionFeaturesV1RootFeatureRow,
  SearchConsumerActionFeaturesV1SkippedRootRow,
  SearchConsumerActionFeaturesV1SourceArtifactReference,
  SearchConsumerActionFeaturesV1SourceConsistency,
} from "./searchConsumerActionFeaturesV1";
import { buildSearchConsumerActionFeaturesV1CountSummaries } from "./searchConsumerActionFeaturesV1";

export type SearchConsumerActionFeatureDictionaryV0ActionFeatureSchemaVersion =
  "search-consumer-action-features-dictionary-v0-action-v1";
export type SearchConsumerActionFeatureDictionaryV0RootFeatureSchemaVersion =
  "search-consumer-action-features-dictionary-v0-root-feature-v1";
export type SearchConsumerActionFeatureDictionaryV0SkippedRootSchemaVersion =
  "search-consumer-action-features-dictionary-v0-skipped-root-v1";
export type SearchConsumerActionFeatureDictionaryV0SummarySchemaVersion =
  "search-consumer-action-features-dictionary-v0-summary-v1";
export type SearchConsumerActionFeatureDictionaryV0DictionariesSchemaVersion =
  "search-consumer-action-features-dictionary-v0-dictionaries-v1";

export type SearchConsumerActionFeatureDictionaryV0ConsumerReadinessStatus =
  | "dictionary_ready"
  | "source_consistency_failed";

export type SearchConsumerActionFeatureDictionaryV0DictionaryGroupName =
  | "schemaVersions"
  | "readinessStatuses"
  | "rootRefs"
  | "publicActionRefs"
  | "actionKinds"
  | "sourceClasses"
  | "targets"
  | "strengthBuckets"
  | "optionIndexLabels"
  | "moveCountBuckets";

export interface SearchConsumerActionFeatureDictionaryV0DictionaryGroup {
  count: number;
  values: readonly string[];
}

export type SearchConsumerActionFeatureDictionaryV0DictionaryGroups = Record<
  SearchConsumerActionFeatureDictionaryV0DictionaryGroupName,
  SearchConsumerActionFeatureDictionaryV0DictionaryGroup
>;

export interface SearchConsumerActionFeatureDictionaryV0ActionRow {
  rootRefId: number;
  publicActionRefId: number;
  kindId: number;
  ordinal: number;
  moveCount: number;
  sourceClassId: number;
  targetId: number;
  strengthBucketId: number;
  optionIndexLabelId: number;
  moveCountBucketId: number;
  collisionCountWithinBucket: number;
  hasCollision: boolean;
  hasTarget: boolean;
  hasStrengthBucket: boolean;
  hasOptionIndexLabel: boolean;
}

export interface SearchConsumerActionFeatureDictionaryV0RootFeatureRow
  extends Omit<
    SearchConsumerActionFeaturesV1RootFeatureRow,
    "schemaVersion" | "featureRunId" | "consumerReadinessStatus" | "sourceConsistencyStatus"
  > {
  schemaVersion: SearchConsumerActionFeatureDictionaryV0RootFeatureSchemaVersion;
  featureRunId: string;
  sourceConsistencyStatus: "ready";
  consumerReadinessStatus: "dictionary_ready";
}

export interface SearchConsumerActionFeatureDictionaryV0SkippedRootRow
  extends Omit<SearchConsumerActionFeaturesV1SkippedRootRow, "schemaVersion" | "featureRunId"> {
  schemaVersion: SearchConsumerActionFeatureDictionaryV0SkippedRootSchemaVersion;
  featureRunId: string;
}

export interface SearchConsumerActionFeatureDictionaryV0Cfp79SummaryInput {
  featureRunId: string;
  suiteId: string;
  consumerReadinessStatus: string;
  rootFeatureRowCount: number;
  actionFeatureRowCount: number;
  skippedRootRowCount: number;
  artifactByteSizes?: {
    rootFeaturesJsonlBytes?: number;
    actionFeaturesJsonlBytes?: number;
    skippedRootsJsonlBytes?: number;
  };
  sourceConsistency: Pick<SearchConsumerActionFeaturesV1SourceConsistency, "status">;
  countSummaries?: SearchConsumerActionFeaturesV1CountSummaries;
}

export interface SearchConsumerActionFeatureDictionaryV0BuildInput {
  suiteId: string;
  featureRunId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp79RunId: string;
  cfp79Summary: SearchConsumerActionFeatureDictionaryV0Cfp79SummaryInput;
  cfp79RootFeatures: readonly SearchConsumerActionFeaturesV1RootFeatureRow[];
  cfp79ActionFeatures: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[];
  cfp79SkippedRoots: readonly SearchConsumerActionFeaturesV1SkippedRootRow[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

export interface SearchConsumerActionFeatureDictionaryV0ReconstructionConstants {
  schemaVersion: SearchConsumerActionFeaturesV1ActionFeatureSchemaVersion;
  featureRunId: string;
  sourceConsistencyStatus: "ready";
  consumerReadinessStatus: "features_ready";
}

export interface SearchConsumerActionFeatureDictionaryV0ReconstructionMismatch {
  index: number;
  actionIdentityRef: string;
  field: string;
  expected: string | number | boolean | null;
  actual: string | number | boolean | null;
}

export interface SearchConsumerActionFeatureDictionaryV0SourceConsistency {
  status: "ready" | "not_ready";
  cfp79ConsumerReadinessStatus: string;
  cfp79SourceConsistencyStatus: string;
  cfp79RootFeatureSummaryCount: number;
  cfp79RootFeatureActualCount: number;
  cfp79RootFeatureCountActualDelta: number;
  cfp79ActionFeatureSummaryCount: number;
  cfp79ActionFeatureActualCount: number;
  cfp79ActionFeatureCountActualDelta: number;
  cfp79SkippedRootSummaryCount: number;
  cfp79SkippedRootActualCount: number;
  cfp79SkippedRootCountActualDelta: number;
  cfp80RootFeatureRowCount: number;
  cfp80RootFeatureVsCfp79Delta: number;
  cfp80CompactActionRowCount: number;
  cfp80CompactActionVsCfp79Delta: number;
  cfp80SkippedRootRowCount: number;
  cfp80SkippedRootVsCfp79Delta: number;
  compactActionRowsWithInvalidRootRefId: number;
  compactActionRowsWithInvalidPublicActionRefId: number;
  duplicateReconstructedActionIdentityRefs: number;
  reconstructionMismatchCount: number;
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

export interface SearchConsumerActionFeatureDictionaryV0Result {
  consumerReadinessStatus: SearchConsumerActionFeatureDictionaryV0ConsumerReadinessStatus;
  sourceConsistency: SearchConsumerActionFeatureDictionaryV0SourceConsistency;
  dictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups;
  compactActionFeatures: readonly SearchConsumerActionFeatureDictionaryV0ActionRow[];
  rootFeatures: readonly SearchConsumerActionFeatureDictionaryV0RootFeatureRow[];
  skippedRoots: readonly SearchConsumerActionFeatureDictionaryV0SkippedRootRow[];
  reconstructedActionFeatures: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[];
  reconstructionStatus: "passed" | "failed";
  reconstructionMismatchCount: number;
  reconstructionMismatches: readonly SearchConsumerActionFeatureDictionaryV0ReconstructionMismatch[];
  countSummaries: SearchConsumerActionFeaturesV1CountSummaries;
}

export const SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ABSENT_VALUE = "none";

export const SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ACTION_SCHEMA_VERSION =
  "search-consumer-action-features-dictionary-v0-action-v1" as const;
export const SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ROOT_SCHEMA_VERSION =
  "search-consumer-action-features-dictionary-v0-root-feature-v1" as const;
export const SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SKIPPED_SCHEMA_VERSION =
  "search-consumer-action-features-dictionary-v0-skipped-root-v1" as const;
export const SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SUMMARY_SCHEMA_VERSION =
  "search-consumer-action-features-dictionary-v0-summary-v1" as const;
export const SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_DICTIONARIES_SCHEMA_VERSION =
  "search-consumer-action-features-dictionary-v0-dictionaries-v1" as const;

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

const sortedUnique = (values: readonly string[]): readonly string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

const groupFromValues = (
  values: readonly string[],
): SearchConsumerActionFeatureDictionaryV0DictionaryGroup => {
  const uniqueValues = sortedUnique(values);
  return { count: uniqueValues.length, values: uniqueValues };
};

const idMapsForDictionaries = (
  dictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups,
) =>
  Object.fromEntries(
    dictionaryGroupNames.map((name) => [
      name,
      new Map(dictionaries[name].values.map((value, index) => [value, index])),
    ]),
  ) as Record<SearchConsumerActionFeatureDictionaryV0DictionaryGroupName, Map<string, number>>;

const idFor = (
  maps: Record<SearchConsumerActionFeatureDictionaryV0DictionaryGroupName, Map<string, number>>,
  group: SearchConsumerActionFeatureDictionaryV0DictionaryGroupName,
  value: string,
): number => {
  const id = maps[group].get(value);
  if (id === undefined) {
    throw new Error(`missing ${group} dictionary id for value ${value}`);
  }
  return id;
};

const valueFor = (
  dictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups,
  group: SearchConsumerActionFeatureDictionaryV0DictionaryGroupName,
  id: number,
): string => {
  const value = dictionaries[group].values[id];
  if (value === undefined) {
    throw new Error(`missing ${group} dictionary value for id ${id}`);
  }
  return value;
};

const duplicateCount = (values: readonly string[]): number => {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.values()].filter((count) => count > 1).length;
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

export const buildSearchConsumerActionFeatureDictionaryV0Dictionaries = ({
  actionFeatures,
  rootFeatures,
  skippedRoots,
}: {
  actionFeatures: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[];
  rootFeatures: readonly SearchConsumerActionFeaturesV1RootFeatureRow[];
  skippedRoots: readonly SearchConsumerActionFeaturesV1SkippedRootRow[];
}): SearchConsumerActionFeatureDictionaryV0DictionaryGroups => ({
  schemaVersions: groupFromValues([
    SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ACTION_SCHEMA_VERSION,
    SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ROOT_SCHEMA_VERSION,
    SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SKIPPED_SCHEMA_VERSION,
    SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SUMMARY_SCHEMA_VERSION,
    SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_DICTIONARIES_SCHEMA_VERSION,
    ...actionFeatures.map((row) => row.schemaVersion),
    ...rootFeatures.map((row) => row.schemaVersion),
    ...skippedRoots.map((row) => row.schemaVersion),
  ]),
  readinessStatuses: groupFromValues([
    "dictionary_ready",
    ...actionFeatures.flatMap((row) => [row.consumerReadinessStatus, row.sourceConsistencyStatus]),
    ...rootFeatures.flatMap((row) => [row.consumerReadinessStatus, row.sourceConsistencyStatus]),
    ...skippedRoots.map((row) => row.consumerReadinessStatus),
  ]),
  rootRefs: groupFromValues([
    ...rootFeatures.map((row) => row.rootRef),
    ...actionFeatures.map((row) => row.rootRef),
  ]),
  publicActionRefs: groupFromValues(actionFeatures.map((row) => row.publicActionRef)),
  actionKinds: groupFromValues(actionFeatures.map((row) => row.kind)),
  sourceClasses: groupFromValues(actionFeatures.map((row) => row.sourceClass)),
  targets: groupFromValues(
    actionFeatures.map((row) => row.target ?? SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ABSENT_VALUE),
  ),
  strengthBuckets: groupFromValues(
    actionFeatures.map(
      (row) => row.strengthBucket ?? SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ABSENT_VALUE,
    ),
  ),
  optionIndexLabels: groupFromValues(
    actionFeatures.map(
      (row) => row.optionIndexLabel ?? SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ABSENT_VALUE,
    ),
  ),
  moveCountBuckets: groupFromValues(actionFeatures.map((row) => row.moveCountBucket)),
});

export const buildSearchConsumerActionFeatureDictionaryV0CompactActionRows = ({
  actionFeatures,
  dictionaries,
}: {
  actionFeatures: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[];
  dictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups;
}): SearchConsumerActionFeatureDictionaryV0ActionRow[] => {
  const maps = idMapsForDictionaries(dictionaries);
  return actionFeatures.map((row) => ({
    rootRefId: idFor(maps, "rootRefs", row.rootRef),
    publicActionRefId: idFor(maps, "publicActionRefs", row.publicActionRef),
    kindId: idFor(maps, "actionKinds", row.kind),
    ordinal: row.ordinal,
    moveCount: row.moveCount,
    sourceClassId: idFor(maps, "sourceClasses", row.sourceClass),
    targetId: idFor(
      maps,
      "targets",
      row.target ?? SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ABSENT_VALUE,
    ),
    strengthBucketId: idFor(
      maps,
      "strengthBuckets",
      row.strengthBucket ?? SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ABSENT_VALUE,
    ),
    optionIndexLabelId: idFor(
      maps,
      "optionIndexLabels",
      row.optionIndexLabel ?? SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ABSENT_VALUE,
    ),
    moveCountBucketId: idFor(maps, "moveCountBuckets", row.moveCountBucket),
    collisionCountWithinBucket: row.collisionCountWithinBucket,
    hasCollision: row.hasCollision,
    hasTarget: row.hasTarget,
    hasStrengthBucket: row.hasStrengthBucket,
    hasOptionIndexLabel: row.hasOptionIndexLabel,
  }));
};

export const buildSearchConsumerActionFeatureDictionaryV0RootFeatureRows = ({
  rootFeatures,
  featureRunId,
}: {
  rootFeatures: readonly SearchConsumerActionFeaturesV1RootFeatureRow[];
  featureRunId: string;
}): SearchConsumerActionFeatureDictionaryV0RootFeatureRow[] =>
  rootFeatures.map((row) => ({
    ...row,
    schemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ROOT_SCHEMA_VERSION,
    featureRunId,
    sourceConsistencyStatus: "ready",
    consumerReadinessStatus: "dictionary_ready",
  }));

export const buildSearchConsumerActionFeatureDictionaryV0SkippedRootRows = ({
  skippedRoots,
  featureRunId,
}: {
  skippedRoots: readonly SearchConsumerActionFeaturesV1SkippedRootRow[];
  featureRunId: string;
}): SearchConsumerActionFeatureDictionaryV0SkippedRootRow[] =>
  skippedRoots.map((row) => ({
    ...row,
    schemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SKIPPED_SCHEMA_VERSION,
    featureRunId,
  }));

export const reconstructSearchConsumerActionFeatureDictionaryV0ActionRow = ({
  compactRow,
  dictionaries,
  constants,
}: {
  compactRow: SearchConsumerActionFeatureDictionaryV0ActionRow;
  dictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups;
  constants: SearchConsumerActionFeatureDictionaryV0ReconstructionConstants;
}): SearchConsumerActionFeaturesV1ActionFeatureRow => {
  const rootRef = valueFor(dictionaries, "rootRefs", compactRow.rootRefId);
  const publicActionRef = valueFor(dictionaries, "publicActionRefs", compactRow.publicActionRefId);
  const target = valueFor(dictionaries, "targets", compactRow.targetId);
  const strengthBucket = valueFor(dictionaries, "strengthBuckets", compactRow.strengthBucketId);
  const optionIndexLabel = valueFor(
    dictionaries,
    "optionIndexLabels",
    compactRow.optionIndexLabelId,
  );

  return {
    schemaVersion: constants.schemaVersion,
    featureRunId: constants.featureRunId,
    rootRef,
    publicActionRef,
    kind: valueFor(dictionaries, "actionKinds", compactRow.kindId),
    ordinal: compactRow.ordinal,
    moveCount: compactRow.moveCount,
    sourceClass: valueFor(dictionaries, "sourceClasses", compactRow.sourceClassId),
    ...(compactRow.hasTarget ? { target } : {}),
    ...(compactRow.hasStrengthBucket ? { strengthBucket } : {}),
    ...(compactRow.hasOptionIndexLabel ? { optionIndexLabel } : {}),
    moveCountBucket: valueFor(dictionaries, "moveCountBuckets", compactRow.moveCountBucketId) as
      SearchConsumerActionFeaturesV1ActionFeatureRow["moveCountBucket"],
    collisionCountWithinBucket: compactRow.collisionCountWithinBucket,
    hasCollision: compactRow.hasCollision,
    hasTarget: compactRow.hasTarget,
    hasStrengthBucket: compactRow.hasStrengthBucket,
    hasOptionIndexLabel: compactRow.hasOptionIndexLabel,
    rootFeatureRef: rootRef,
    actionIdentityRef: `${rootRef}::${publicActionRef}`,
    sourceConsistencyStatus: constants.sourceConsistencyStatus,
    consumerReadinessStatus: constants.consumerReadinessStatus,
  };
};

export const reconstructSearchConsumerActionFeatureDictionaryV0ActionRows = ({
  compactRows,
  dictionaries,
  constants,
}: {
  compactRows: readonly SearchConsumerActionFeatureDictionaryV0ActionRow[];
  dictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups;
  constants: SearchConsumerActionFeatureDictionaryV0ReconstructionConstants;
}): SearchConsumerActionFeaturesV1ActionFeatureRow[] =>
  compactRows.map((compactRow) =>
    reconstructSearchConsumerActionFeatureDictionaryV0ActionRow({
      compactRow,
      dictionaries,
      constants,
    }),
  );

const preservedActionFieldNames = [
  "schemaVersion",
  "featureRunId",
  "rootRef",
  "publicActionRef",
  "kind",
  "ordinal",
  "moveCount",
  "sourceClass",
  "target",
  "strengthBucket",
  "optionIndexLabel",
  "moveCountBucket",
  "collisionCountWithinBucket",
  "hasCollision",
  "hasTarget",
  "hasStrengthBucket",
  "hasOptionIndexLabel",
  "rootFeatureRef",
  "actionIdentityRef",
  "sourceConsistencyStatus",
  "consumerReadinessStatus",
] as const;

type PreservedActionFieldName = (typeof preservedActionFieldNames)[number];

const preservedValue = (
  row: SearchConsumerActionFeaturesV1ActionFeatureRow,
  field: PreservedActionFieldName,
) => row[field] ?? null;

export const compareSearchConsumerActionFeatureDictionaryV0Reconstruction = ({
  sourceRows,
  reconstructedRows,
  mismatchLimit = 20,
}: {
  sourceRows: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[];
  reconstructedRows: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[];
  mismatchLimit?: number;
}): {
  mismatchCount: number;
  mismatches: readonly SearchConsumerActionFeatureDictionaryV0ReconstructionMismatch[];
} => {
  let mismatchCount = 0;
  const mismatches: SearchConsumerActionFeatureDictionaryV0ReconstructionMismatch[] = [];
  const rowCount = Math.max(sourceRows.length, reconstructedRows.length);

  for (let index = 0; index < rowCount; index += 1) {
    const sourceRow = sourceRows[index];
    const reconstructedRow = reconstructedRows[index];
    const actionIdentityRef =
      sourceRow?.actionIdentityRef ?? reconstructedRow?.actionIdentityRef ?? `row_${index}`;

    if (!sourceRow || !reconstructedRow) {
      mismatchCount += 1;
      if (mismatches.length < mismatchLimit) {
        mismatches.push({
          index,
          actionIdentityRef,
          field: "row",
          expected: sourceRow ? "present" : null,
          actual: reconstructedRow ? "present" : null,
        });
      }
      continue;
    }

    for (const field of preservedActionFieldNames) {
      const expected = preservedValue(sourceRow, field);
      const actual = preservedValue(reconstructedRow, field);
      if (expected !== actual) {
        mismatchCount += 1;
        if (mismatches.length < mismatchLimit) {
          mismatches.push({ index, actionIdentityRef, field, expected, actual });
        }
        break;
      }
    }
  }

  return { mismatchCount, mismatches };
};

export const buildSearchConsumerActionFeatureDictionaryV0SourceConsistency = ({
  input,
  compactActionFeatures,
  rootFeatures,
  skippedRoots,
  dictionaries,
  reconstructedActionFeatures,
  reconstructionMismatchCount,
}: {
  input: SearchConsumerActionFeatureDictionaryV0BuildInput;
  compactActionFeatures: readonly SearchConsumerActionFeatureDictionaryV0ActionRow[];
  rootFeatures: readonly SearchConsumerActionFeatureDictionaryV0RootFeatureRow[];
  skippedRoots: readonly SearchConsumerActionFeatureDictionaryV0SkippedRootRow[];
  dictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups;
  reconstructedActionFeatures: readonly SearchConsumerActionFeaturesV1ActionFeatureRow[];
  reconstructionMismatchCount: number;
}): SearchConsumerActionFeatureDictionaryV0SourceConsistency => {
  const cfp79RootFeatureCountActualDelta =
    input.cfp79Summary.rootFeatureRowCount - input.cfp79RootFeatures.length;
  const cfp79ActionFeatureCountActualDelta =
    input.cfp79Summary.actionFeatureRowCount - input.cfp79ActionFeatures.length;
  const cfp79SkippedRootCountActualDelta =
    input.cfp79Summary.skippedRootRowCount - input.cfp79SkippedRoots.length;
  const cfp80RootFeatureVsCfp79Delta = rootFeatures.length - input.cfp79RootFeatures.length;
  const cfp80CompactActionVsCfp79Delta =
    compactActionFeatures.length - input.cfp79ActionFeatures.length;
  const cfp80SkippedRootVsCfp79Delta = skippedRoots.length - input.cfp79SkippedRoots.length;
  const compactActionRowsWithInvalidRootRefId = compactActionFeatures.filter(
    (row) => dictionaries.rootRefs.values[row.rootRefId] === undefined,
  ).length;
  const compactActionRowsWithInvalidPublicActionRefId = compactActionFeatures.filter(
    (row) => dictionaries.publicActionRefs.values[row.publicActionRefId] === undefined,
  ).length;
  const duplicateReconstructedActionIdentityRefs = duplicateCount(
    reconstructedActionFeatures.map((row) => row.actionIdentityRef),
  );

  const checks: boolean[] = [
    input.cfp79Summary.consumerReadinessStatus === "features_ready",
    input.cfp79Summary.sourceConsistency.status === "ready",
    cfp79RootFeatureCountActualDelta === 0,
    cfp79ActionFeatureCountActualDelta === 0,
    cfp79SkippedRootCountActualDelta === 0,
    compactActionRowsWithInvalidRootRefId === 0,
    compactActionRowsWithInvalidPublicActionRefId === 0,
    cfp80CompactActionVsCfp79Delta === 0,
    cfp80RootFeatureVsCfp79Delta === 0,
    cfp80SkippedRootVsCfp79Delta === 0,
    duplicateReconstructedActionIdentityRefs === 0,
    reconstructionMismatchCount === 0,
    input.sourceArtifactReferenceCount > 0,
    input.sourceArtifactEmptyHashCount === 0,
  ];

  return {
    status: checks.every(Boolean) ? "ready" : "not_ready",
    cfp79ConsumerReadinessStatus: input.cfp79Summary.consumerReadinessStatus,
    cfp79SourceConsistencyStatus: input.cfp79Summary.sourceConsistency.status,
    cfp79RootFeatureSummaryCount: input.cfp79Summary.rootFeatureRowCount,
    cfp79RootFeatureActualCount: input.cfp79RootFeatures.length,
    cfp79RootFeatureCountActualDelta,
    cfp79ActionFeatureSummaryCount: input.cfp79Summary.actionFeatureRowCount,
    cfp79ActionFeatureActualCount: input.cfp79ActionFeatures.length,
    cfp79ActionFeatureCountActualDelta,
    cfp79SkippedRootSummaryCount: input.cfp79Summary.skippedRootRowCount,
    cfp79SkippedRootActualCount: input.cfp79SkippedRoots.length,
    cfp79SkippedRootCountActualDelta,
    cfp80RootFeatureRowCount: rootFeatures.length,
    cfp80RootFeatureVsCfp79Delta,
    cfp80CompactActionRowCount: compactActionFeatures.length,
    cfp80CompactActionVsCfp79Delta,
    cfp80SkippedRootRowCount: skippedRoots.length,
    cfp80SkippedRootVsCfp79Delta,
    compactActionRowsWithInvalidRootRefId,
    compactActionRowsWithInvalidPublicActionRefId,
    duplicateReconstructedActionIdentityRefs,
    reconstructionMismatchCount,
    sourceArtifactReferenceCount: input.sourceArtifactReferenceCount,
    sourceArtifactEmptyHashCount: input.sourceArtifactEmptyHashCount,
  };
};

export const buildSearchConsumerActionFeatureDictionaryV0Result = (
  input: SearchConsumerActionFeatureDictionaryV0BuildInput,
): SearchConsumerActionFeatureDictionaryV0Result => {
  const dictionaries = buildSearchConsumerActionFeatureDictionaryV0Dictionaries({
    actionFeatures: input.cfp79ActionFeatures,
    rootFeatures: input.cfp79RootFeatures,
    skippedRoots: input.cfp79SkippedRoots,
  });
  const compactActionFeatures = buildSearchConsumerActionFeatureDictionaryV0CompactActionRows({
    actionFeatures: input.cfp79ActionFeatures,
    dictionaries,
  });
  const rootFeatures = buildSearchConsumerActionFeatureDictionaryV0RootFeatureRows({
    rootFeatures: input.cfp79RootFeatures,
    featureRunId: input.featureRunId,
  });
  const skippedRoots = buildSearchConsumerActionFeatureDictionaryV0SkippedRootRows({
    skippedRoots: input.cfp79SkippedRoots,
    featureRunId: input.featureRunId,
  });
  const reconstructionConstants: SearchConsumerActionFeatureDictionaryV0ReconstructionConstants = {
    schemaVersion: "search-consumer-action-features-v1-action-feature-v1",
    featureRunId: input.sourceCfp79RunId,
    sourceConsistencyStatus: "ready",
    consumerReadinessStatus: "features_ready",
  };
  const reconstructedActionFeatures =
    reconstructSearchConsumerActionFeatureDictionaryV0ActionRows({
      compactRows: compactActionFeatures,
      dictionaries,
      constants: reconstructionConstants,
    });
  const reconstruction = compareSearchConsumerActionFeatureDictionaryV0Reconstruction({
    sourceRows: input.cfp79ActionFeatures,
    reconstructedRows: reconstructedActionFeatures,
  });
  const sourceConsistency = buildSearchConsumerActionFeatureDictionaryV0SourceConsistency({
    input,
    compactActionFeatures,
    rootFeatures,
    skippedRoots,
    dictionaries,
    reconstructedActionFeatures,
    reconstructionMismatchCount: reconstruction.mismatchCount,
  });

  if (sourceConsistency.status !== "ready") {
    return {
      consumerReadinessStatus: "source_consistency_failed",
      sourceConsistency,
      dictionaries,
      compactActionFeatures: [],
      rootFeatures: [],
      skippedRoots: [],
      reconstructedActionFeatures: [],
      reconstructionStatus: "failed",
      reconstructionMismatchCount: reconstruction.mismatchCount,
      reconstructionMismatches: reconstruction.mismatches,
      countSummaries: emptyCountSummaries(),
    };
  }

  return {
    consumerReadinessStatus: "dictionary_ready",
    sourceConsistency,
    dictionaries,
    compactActionFeatures,
    rootFeatures,
    skippedRoots,
    reconstructedActionFeatures,
    reconstructionStatus: "passed",
    reconstructionMismatchCount: reconstruction.mismatchCount,
    reconstructionMismatches: reconstruction.mismatches,
    countSummaries: buildSearchConsumerActionFeaturesV1CountSummaries({
      rootFeatures: input.cfp79RootFeatures,
      actionFeatures: input.cfp79ActionFeatures,
    }),
  };
};

export type SearchConsumerActionFeatureDictionaryV0SourceArtifactReference =
  SearchConsumerActionFeaturesV1SourceArtifactReference;
