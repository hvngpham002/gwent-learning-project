import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { scanSearchConsumerActionFeaturesV0TextForHiddenInfo } from "./searchConsumerActionFeaturesV0Artifacts";
import {
  SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ABSENT_VALUE,
  SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ACTION_SCHEMA_VERSION,
  SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_DICTIONARIES_SCHEMA_VERSION,
  SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ROOT_SCHEMA_VERSION,
  SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SKIPPED_SCHEMA_VERSION,
  SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SUMMARY_SCHEMA_VERSION,
  type SearchConsumerActionFeatureDictionaryV0ActionFeatureSchemaVersion,
  type SearchConsumerActionFeatureDictionaryV0ConsumerReadinessStatus,
  type SearchConsumerActionFeatureDictionaryV0DictionariesSchemaVersion,
  type SearchConsumerActionFeatureDictionaryV0DictionaryGroupName,
  type SearchConsumerActionFeatureDictionaryV0DictionaryGroups,
  type SearchConsumerActionFeatureDictionaryV0Result,
  type SearchConsumerActionFeatureDictionaryV0RootFeatureSchemaVersion,
  type SearchConsumerActionFeatureDictionaryV0SkippedRootSchemaVersion,
  type SearchConsumerActionFeatureDictionaryV0SourceArtifactReference,
  type SearchConsumerActionFeatureDictionaryV0SourceConsistency,
  type SearchConsumerActionFeatureDictionaryV0SummarySchemaVersion,
} from "./searchConsumerActionFeatureDictionaryV0";

export type SearchConsumerActionFeatureDictionaryV0ArtifactSchemaVersion =
  "search-consumer-action-features-dictionary-v0-artifact-v1";

const ACTION_FEATURE_TARGET_BYTES = 50 * 1024 * 1024;
const HARD_STOP_BYTES = 90 * 1024 * 1024;

export const CFP80_EXPLICIT_NON_CLAIMS: readonly string[] = [
  "cFp80 does not choose actions or recommend best actions.",
  "cFp80 does not rank actions or compute action ordering.",
  "cFp80 does not estimate action values or expected values.",
  "cFp80 does not estimate win probability or reward targets.",
  "cFp80 does not compute payoff tables or principal variations.",
  "cFp80 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.",
  "cFp80 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.",
  "cFp80 does not select moves for product AI.",
  "cFp80 does not re-observe benchmark roots or run the benchmark suite.",
  "cFp80 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.",
  "cFp80 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.",
  "cFp80 does not add AI Lab runner buttons or execute benchmarks from the browser.",
  "cFp80 does not add difficulty tiers, export training data, or add Python tooling.",
  "cFp80 does not modify cFp79, cFp76, or cFp78 artifacts.",
];

export const CFP81_RECOMMENDATION_ACTION_FEATURE_CASEBOOK =
  "cFp81 may create a strictly benchmark-only action-feature casebook or consumer-readiness report over cFp80 compact artifacts; it must not add rollout, value, ranking, best-action, win-probability, reward-target, or product-AI behavior.";

export const CFP81_RECOMMENDATION_CONTINUE_COMPACTION =
  "cFp81 should continue compaction or define a deterministic subset before consumer analysis because the compact action artifact is still at or above the 50 MB target.";

export const CFP81_RECOMMENDATION_NOT_READY =
  "cFp81 should not proceed until cFp80 source consistency and reconstruction checks pass.";

export interface SearchConsumerActionFeatureDictionaryV0SourceRunIds {
  cfp79: string;
}

export interface SearchConsumerActionFeatureDictionaryV0ArtifactByteSizes {
  rootFeaturesJsonlBytes: number;
  actionFeaturesCompactJsonlBytes: number;
  skippedRootsJsonlBytes: number;
  dictionariesJsonBytes: number;
  sourceCfp79ActionFeaturesJsonlBytes: number;
}

export interface SearchConsumerActionFeatureDictionaryV0ArtifactSizeLabels {
  rootFeaturesJsonl: string;
  actionFeaturesCompactJsonl: string;
  skippedRootsJsonl: string;
}

export interface SearchConsumerActionFeatureDictionaryV0DictionaryGroupWithHash {
  count: number;
  values: readonly string[];
  sha256: string;
}

export type SearchConsumerActionFeatureDictionaryV0SerializedDictionaryGroups = Record<
  SearchConsumerActionFeatureDictionaryV0DictionaryGroupName,
  SearchConsumerActionFeatureDictionaryV0DictionaryGroupWithHash
>;

export interface SearchConsumerActionFeatureDictionaryV0DictionariesFile {
  schemaVersion: SearchConsumerActionFeatureDictionaryV0DictionariesSchemaVersion;
  featureRunId: string;
  phaseId: "cFp80";
  suiteId: string;
  sourceCfp79RunId: string;
  absentValue: string;
  idAssignmentPolicy: string;
  groups: SearchConsumerActionFeatureDictionaryV0SerializedDictionaryGroups;
}

export interface SearchConsumerActionFeatureDictionaryV0ActionRowConstants {
  sourceActionSchemaVersion: string;
  sourceActionFeatureRunId: string;
  sourceConsistencyStatus: "ready";
  consumerReadinessStatus: "features_ready";
  rootFeatureRefPolicy: "rootRef";
  actionIdentityRefPolicy: "rootRef::publicActionRef";
}

export interface SearchConsumerActionFeatureDictionaryV0CompactActionRowConstants {
  schemaVersion: SearchConsumerActionFeatureDictionaryV0ActionFeatureSchemaVersion;
  featureRunId: string;
}

export interface SearchConsumerActionFeatureDictionaryV0ArtifactManifest {
  schemaVersion: SearchConsumerActionFeatureDictionaryV0ArtifactSchemaVersion;
  featureRunId: string;
  phaseId: "cFp80";
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  consumerReadinessStatus: SearchConsumerActionFeatureDictionaryV0ConsumerReadinessStatus;
  sourceCfp79RunId: string;
  sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
  rootFeatureSchemaVersion: SearchConsumerActionFeatureDictionaryV0RootFeatureSchemaVersion;
  actionFeatureSchemaVersion: SearchConsumerActionFeatureDictionaryV0ActionFeatureSchemaVersion;
  skippedRootSchemaVersion: SearchConsumerActionFeatureDictionaryV0SkippedRootSchemaVersion;
  summarySchemaVersion: SearchConsumerActionFeatureDictionaryV0SummarySchemaVersion;
  dictionariesSchemaVersion: SearchConsumerActionFeatureDictionaryV0DictionariesSchemaVersion;
  compactActionRowConstants: SearchConsumerActionFeatureDictionaryV0CompactActionRowConstants;
  sourceActionRowConstants: SearchConsumerActionFeatureDictionaryV0ActionRowConstants;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp81Recommendation: string;
  artifactHashes: Record<
    | "summary.json"
    | "dictionaries.json"
    | "root-features.jsonl"
    | "action-features-compact.jsonl"
    | "skipped-roots.jsonl"
    | "report.md",
    string
  >;
}

export interface SearchConsumerActionFeatureDictionaryV0Summary {
  schemaVersion: SearchConsumerActionFeatureDictionaryV0SummarySchemaVersion;
  featureRunId: string;
  phaseId: "cFp80";
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp79RunId: string;
  sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
  sourceConsistency: SearchConsumerActionFeatureDictionaryV0SourceConsistency;
  consumerReadinessStatus: SearchConsumerActionFeatureDictionaryV0ConsumerReadinessStatus;
  rootFeatureRowCount: number;
  compactActionFeatureRowCount: number;
  sourceActionFeatureRowCount: number;
  skippedRootRowCount: number;
  dictionaryGroupCounts: Record<SearchConsumerActionFeatureDictionaryV0DictionaryGroupName, number>;
  dictionaryGroupHashes: Record<SearchConsumerActionFeatureDictionaryV0DictionaryGroupName, string>;
  compactActionRowConstants: SearchConsumerActionFeatureDictionaryV0CompactActionRowConstants;
  sourceActionRowConstants: SearchConsumerActionFeatureDictionaryV0ActionRowConstants;
  artifactByteSizes: SearchConsumerActionFeatureDictionaryV0ArtifactByteSizes;
  artifactSizeLabels: SearchConsumerActionFeatureDictionaryV0ArtifactSizeLabels;
  compactActionBytesSaved: number;
  compactActionPercentBytesSaved: number;
  isCompactActionBelowTarget: boolean;
  isCompactActionBelowHardStop: boolean;
  robustTargetStatus: "not_robust_suite" | "below_50_mb_target" | "at_or_above_50_mb_target";
  reconstructionStatus: "passed" | "failed";
  reconstructedActionRowCount: number;
  reconstructionMismatchCount: number;
  reconstructionMismatches: readonly SearchConsumerActionFeatureDictionaryV0Result["reconstructionMismatches"][number][];
  countSummaries: SearchConsumerActionFeatureDictionaryV0Result["countSummaries"];
  hiddenInfoScanStatus: "clean" | "hazards_detected";
  hiddenInfoScanHazards: readonly string[];
  explicitNonClaims: readonly string[];
  cFp81Recommendation: string;
}

export interface SerializedSearchConsumerActionFeatureDictionaryV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  dictionariesJson: string;
  rootFeaturesJsonl: string;
  actionFeaturesCompactJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const searchConsumerActionFeatureDictionaryV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "dictionaries.json",
  "root-features.jsonl",
  "action-features-compact.jsonl",
  "skipped-roots.jsonl",
  "report.md",
] as const;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

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

const stablePrettyJson = (value: unknown) => `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;
const stableJsonLine = (value: unknown) => JSON.stringify(sortJsonValue(value));
const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
const jsonlText = (rows: readonly unknown[]) =>
  rows.map(stableJsonLine).join("\n") + (rows.length > 0 ? "\n" : "");
const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
const markdownCell = (value: string) => value.replaceAll("|", "\\|");
const formatCountRows = (record: Record<string, number>) => {
  const rows = sortedEntries(record);
  if (rows.length === 0) return "| none | 0 |";
  return rows.map(([key, count]) => `| ${markdownCell(key)} | ${count} |`).join("\n");
};

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/search-consumer-action-features-dictionary-v0/cFp80`;

const HIDDEN_INFO_SAFETY_NOTE =
  "All cFp80 machine-readable rows are deterministic scalar projections over committed cFp79 " +
  "feature rows. Compact action rows carry dictionary ids and public scalar action fields only; " +
  "their row-constant schema/run metadata is declared once in manifest and summary. They omit " +
  "full joined references, raw move payloads, private hand/deck data, sampled-world payloads, " +
  "value estimates, ranking fields, and rollout outputs.";

export const searchConsumerActionFeatureDictionaryV0JsonlSizeLabel = (bytes: number): string => {
  if (bytes >= HARD_STOP_BYTES) return "at or above 90 MB hard stop (must stop)";
  return "below 90 MB hard stop";
};

export const searchConsumerActionFeatureDictionaryV0CompactActionSizeLabel = (
  bytes: number,
): string => {
  if (bytes >= HARD_STOP_BYTES) return "at or above 90 MB hard stop (must stop)";
  if (bytes >= ACTION_FEATURE_TARGET_BYTES) {
    return "at or above 50 MB robust target; continue compaction before consumer work";
  }
  return "below 50 MB robust target, below 90 MB hard stop";
};

const dictionaryGroupsWithHashes = (
  dictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups,
): SearchConsumerActionFeatureDictionaryV0SerializedDictionaryGroups =>
  Object.fromEntries(
    sortedEntries(dictionaries).map(([name, group]) => [
      name,
      {
        count: group.count,
        values: group.values,
        sha256: sha256(stablePrettyJson(group.values)),
      },
    ]),
  ) as SearchConsumerActionFeatureDictionaryV0SerializedDictionaryGroups;

const buildDictionariesFile = ({
  result,
  featureRunId,
  suiteId,
  sourceCfp79RunId,
}: {
  result: SearchConsumerActionFeatureDictionaryV0Result;
  featureRunId: string;
  suiteId: string;
  sourceCfp79RunId: string;
}): SearchConsumerActionFeatureDictionaryV0DictionariesFile => ({
  schemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_DICTIONARIES_SCHEMA_VERSION,
  featureRunId,
  phaseId: "cFp80",
  suiteId,
  sourceCfp79RunId,
  absentValue: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ABSENT_VALUE,
  idAssignmentPolicy:
    "collect string values from cFp79 action/root/skipped rows, sort lexicographically, assign zero-based integer ids",
  groups: dictionaryGroupsWithHashes(result.dictionaries),
});

const sourceActionRowConstants = (
  sourceCfp79RunId: string,
): SearchConsumerActionFeatureDictionaryV0ActionRowConstants => ({
  sourceActionSchemaVersion: "search-consumer-action-features-v1-action-feature-v1",
  sourceActionFeatureRunId: sourceCfp79RunId,
  sourceConsistencyStatus: "ready",
  consumerReadinessStatus: "features_ready",
  rootFeatureRefPolicy: "rootRef",
  actionIdentityRefPolicy: "rootRef::publicActionRef",
});

const compactActionRowConstants = (
  featureRunId: string,
): SearchConsumerActionFeatureDictionaryV0CompactActionRowConstants => ({
  schemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ACTION_SCHEMA_VERSION,
  featureRunId,
});

const cFp81RecommendationFor = (
  result: SearchConsumerActionFeatureDictionaryV0Result,
  actionFeaturesCompactJsonlBytes: number,
) => {
  if (result.consumerReadinessStatus !== "dictionary_ready") {
    return CFP81_RECOMMENDATION_NOT_READY;
  }
  if (actionFeaturesCompactJsonlBytes >= ACTION_FEATURE_TARGET_BYTES) {
    return CFP81_RECOMMENDATION_CONTINUE_COMPACTION;
  }
  return CFP81_RECOMMENDATION_ACTION_FEATURE_CASEBOOK;
};

const robustTargetStatusFor = (suiteId: string, actionFeaturesCompactJsonlBytes: number) => {
  if (suiteId !== "benchmark-v1-starter-matrix-robust-v1") return "not_robust_suite" as const;
  return actionFeaturesCompactJsonlBytes < ACTION_FEATURE_TARGET_BYTES
    ? ("below_50_mb_target" as const)
    : ("at_or_above_50_mb_target" as const);
};

const buildSourceConsistencySection = (
  consistency: SearchConsumerActionFeatureDictionaryV0SourceConsistency,
) => `
## Source Consistency

| Check | Value |
|---|---:|
| status | ${consistency.status} |
| cFp79 consumer readiness status | ${consistency.cfp79ConsumerReadinessStatus} |
| cFp79 source consistency status | ${consistency.cfp79SourceConsistencyStatus} |
| cFp79 root feature summary count | ${consistency.cfp79RootFeatureSummaryCount} |
| cFp79 root feature actual count | ${consistency.cfp79RootFeatureActualCount} |
| cFp79 root feature count actual delta | ${consistency.cfp79RootFeatureCountActualDelta} |
| cFp79 action feature summary count | ${consistency.cfp79ActionFeatureSummaryCount} |
| cFp79 action feature actual count | ${consistency.cfp79ActionFeatureActualCount} |
| cFp79 action feature count actual delta | ${consistency.cfp79ActionFeatureCountActualDelta} |
| cFp79 skipped root summary count | ${consistency.cfp79SkippedRootSummaryCount} |
| cFp79 skipped root actual count | ${consistency.cfp79SkippedRootActualCount} |
| cFp79 skipped root count actual delta | ${consistency.cfp79SkippedRootCountActualDelta} |
| cFp80 root feature row count | ${consistency.cfp80RootFeatureRowCount} |
| cFp80 root feature vs cFp79 delta | ${consistency.cfp80RootFeatureVsCfp79Delta} |
| cFp80 compact action row count | ${consistency.cfp80CompactActionRowCount} |
| cFp80 compact action vs cFp79 delta | ${consistency.cfp80CompactActionVsCfp79Delta} |
| cFp80 skipped root row count | ${consistency.cfp80SkippedRootRowCount} |
| cFp80 skipped root vs cFp79 delta | ${consistency.cfp80SkippedRootVsCfp79Delta} |
| compact action rows with invalid root ref id | ${consistency.compactActionRowsWithInvalidRootRefId} |
| compact action rows with invalid public action ref id | ${consistency.compactActionRowsWithInvalidPublicActionRefId} |
| duplicate reconstructed action identity refs | ${consistency.duplicateReconstructedActionIdentityRefs} |
| reconstruction mismatch count | ${consistency.reconstructionMismatchCount} |
| source artifact reference count | ${consistency.sourceArtifactReferenceCount} |
| source artifact empty hash count | ${consistency.sourceArtifactEmptyHashCount} |
`;

const buildSourceArtifactSection = (
  references: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[],
) => `
## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
${references
  .map((reference) => `| ${reference.label} | ${reference.relativePath} | ${reference.sha256} |`)
  .join("\n")}
`;

const buildMarkdownReport = ({
  result,
  summary,
}: {
  result: SearchConsumerActionFeatureDictionaryV0Result;
  summary: SearchConsumerActionFeatureDictionaryV0Summary;
}) => `# Search Consumer Action Feature Dictionary v0

## Run

- suite id: ${summary.suiteId}
- feature run id: ${summary.featureRunId}
- phase id: ${summary.phaseId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- source cFp79 run id: ${summary.sourceCfp79RunId}
- consumer readiness status: ${summary.consumerReadinessStatus}
${buildSourceConsistencySection(result.sourceConsistency)}
## Row Counts

| Row kind | Count |
|---|---:|
| root feature rows | ${summary.rootFeatureRowCount} |
| compact action feature rows | ${summary.compactActionFeatureRowCount} |
| source action feature rows | ${summary.sourceActionFeatureRowCount} |
| skipped root rows | ${summary.skippedRootRowCount} |
| reconstructed action rows | ${summary.reconstructedActionRowCount} |

## Dictionary Counts

| Dictionary | Count | SHA-256 |
|---|---:|---|
${(Object.keys(summary.dictionaryGroupCounts) as SearchConsumerActionFeatureDictionaryV0DictionaryGroupName[])
  .sort((left, right) => left.localeCompare(right))
  .map((name) => `| ${name} | ${summary.dictionaryGroupCounts[name]} | ${summary.dictionaryGroupHashes[name]} |`)
  .join("\n")}

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| source cFp79 action-features.jsonl | ${summary.artifactByteSizes.sourceCfp79ActionFeaturesJsonlBytes} | source baseline |
| action-features-compact.jsonl | ${summary.artifactByteSizes.actionFeaturesCompactJsonlBytes} | ${summary.artifactSizeLabels.actionFeaturesCompactJsonl} |
| root-features.jsonl | ${summary.artifactByteSizes.rootFeaturesJsonlBytes} | ${summary.artifactSizeLabels.rootFeaturesJsonl} |
| skipped-roots.jsonl | ${summary.artifactByteSizes.skippedRootsJsonlBytes} | ${summary.artifactSizeLabels.skippedRootsJsonl} |
| dictionaries.json | ${summary.artifactByteSizes.dictionariesJsonBytes} | metadata |

- compact action bytes saved: ${summary.compactActionBytesSaved}
- compact action percent bytes saved: ${summary.compactActionPercentBytesSaved}
- robust target status: ${summary.robustTargetStatus}

## Reconstruction

- status: ${summary.reconstructionStatus}
- reconstructed action rows: ${summary.reconstructedActionRowCount}
- source action rows: ${summary.sourceActionFeatureRowCount}
- mismatch count: ${summary.reconstructionMismatchCount}

## Count Summaries

### Public Action Kind

| Kind | Count |
|---|---:|
${formatCountRows(result.countSummaries.publicActionKindCounts)}

### Source Class

| Source class | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsBySourceClass)}

### Target Token

| Target token | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByTargetToken)}

### Move-Count Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByMoveCountBucket)}

### Collision Flag

| Flag | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByCollisionFlag)}

### Phase

| Phase | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByPhase)}

### Round

| Round | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByRound)}

### Policy

| Policy | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByPolicy)}

### Faction

| Faction | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByFaction)}

### Deck Preset

| Deck preset | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByDeckPreset)}

### Matchup

| Matchup | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByMatchup)}

### cFp70 Availability Risk Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(result.countSummaries.cFp70AvailabilityRiskBucketCounts)}

### cFp71 Outcome Risk Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(result.countSummaries.cFp71OutcomeRiskBucketCounts)}

### cFp72 Branching Risk Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(result.countSummaries.cFp72BranchingRiskBucketCounts)}

### cFp73 Budget Pressure Label

| Label | Count |
|---|---:|
${formatCountRows(result.countSummaries.cFp73BudgetPressureLabelCounts)}

### cFp74 Cap Status

| Status | Count |
|---|---:|
${formatCountRows(result.countSummaries.cFp74CapStatusCounts)}

## Hidden-Info Safety

- scan status: ${summary.hiddenInfoScanStatus}
- hazards detected: ${summary.hiddenInfoScanHazards.length === 0 ? "none" : summary.hiddenInfoScanHazards.join(", ")}

${HIDDEN_INFO_SAFETY_NOTE}
${buildSourceArtifactSection(summary.sourceArtifactReferences)}
## Non-Claims

${summary.explicitNonClaims.map((claim) => `- ${claim}`).join("\n")}

## cFp81 Recommendation

${summary.cFp81Recommendation}
`;

export const buildSearchConsumerActionFeatureDictionaryV0Summary = ({
  result,
  featureRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceRunIds,
  sourceArtifactReferences,
  artifactByteSizes,
  dictionariesFile,
  hiddenInfoScanHazards,
  cFp81Recommendation,
}: {
  result: SearchConsumerActionFeatureDictionaryV0Result;
  featureRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceRunIds: SearchConsumerActionFeatureDictionaryV0SourceRunIds;
  sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
  artifactByteSizes: SearchConsumerActionFeatureDictionaryV0ArtifactByteSizes;
  dictionariesFile: SearchConsumerActionFeatureDictionaryV0DictionariesFile;
  hiddenInfoScanHazards: readonly string[];
  cFp81Recommendation: string;
}): SearchConsumerActionFeatureDictionaryV0Summary => {
  const compactActionBytesSaved =
    artifactByteSizes.sourceCfp79ActionFeaturesJsonlBytes -
    artifactByteSizes.actionFeaturesCompactJsonlBytes;
  const compactActionPercentBytesSaved =
    artifactByteSizes.sourceCfp79ActionFeaturesJsonlBytes === 0
      ? 0
      : Number(
          (
            (compactActionBytesSaved / artifactByteSizes.sourceCfp79ActionFeaturesJsonlBytes) *
            100
          ).toFixed(2),
        );

  return {
    schemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SUMMARY_SCHEMA_VERSION,
    featureRunId,
    phaseId: "cFp80",
    suiteId,
    sourceBenchmarkSuiteId,
    sourceCfp79RunId: sourceRunIds.cfp79,
    sourceArtifactReferences,
    sourceArtifactReferenceCount: sourceArtifactReferences.length,
    sourceArtifactEmptyHashCount: result.sourceConsistency.sourceArtifactEmptyHashCount,
    sourceConsistency: result.sourceConsistency,
    consumerReadinessStatus: result.consumerReadinessStatus,
    rootFeatureRowCount: result.rootFeatures.length,
    compactActionFeatureRowCount: result.compactActionFeatures.length,
    sourceActionFeatureRowCount: result.reconstructedActionFeatures.length,
    skippedRootRowCount: result.skippedRoots.length,
    dictionaryGroupCounts: Object.fromEntries(
      sortedEntries(dictionariesFile.groups).map(([name, group]) => [name, group.count]),
    ) as Record<SearchConsumerActionFeatureDictionaryV0DictionaryGroupName, number>,
    dictionaryGroupHashes: Object.fromEntries(
      sortedEntries(dictionariesFile.groups).map(([name, group]) => [name, group.sha256]),
    ) as Record<SearchConsumerActionFeatureDictionaryV0DictionaryGroupName, string>,
    compactActionRowConstants: compactActionRowConstants(featureRunId),
    sourceActionRowConstants: sourceActionRowConstants(sourceRunIds.cfp79),
    artifactByteSizes,
    artifactSizeLabels: {
      rootFeaturesJsonl: searchConsumerActionFeatureDictionaryV0JsonlSizeLabel(
        artifactByteSizes.rootFeaturesJsonlBytes,
      ),
      actionFeaturesCompactJsonl:
        searchConsumerActionFeatureDictionaryV0CompactActionSizeLabel(
          artifactByteSizes.actionFeaturesCompactJsonlBytes,
        ),
      skippedRootsJsonl: searchConsumerActionFeatureDictionaryV0JsonlSizeLabel(
        artifactByteSizes.skippedRootsJsonlBytes,
      ),
    },
    compactActionBytesSaved,
    compactActionPercentBytesSaved,
    isCompactActionBelowTarget:
      artifactByteSizes.actionFeaturesCompactJsonlBytes < ACTION_FEATURE_TARGET_BYTES,
    isCompactActionBelowHardStop:
      artifactByteSizes.actionFeaturesCompactJsonlBytes < HARD_STOP_BYTES,
    robustTargetStatus: robustTargetStatusFor(
      suiteId,
      artifactByteSizes.actionFeaturesCompactJsonlBytes,
    ),
    reconstructionStatus: result.reconstructionStatus,
    reconstructedActionRowCount: result.reconstructedActionFeatures.length,
    reconstructionMismatchCount: result.reconstructionMismatchCount,
    reconstructionMismatches: result.reconstructionMismatches,
    countSummaries: result.countSummaries,
    hiddenInfoScanStatus: hiddenInfoScanHazards.length === 0 ? "clean" : "hazards_detected",
    hiddenInfoScanHazards,
    explicitNonClaims: CFP80_EXPLICIT_NON_CLAIMS,
    cFp81Recommendation,
  };
};

export const serializeSearchConsumerActionFeatureDictionaryV0Artifacts = ({
  result,
  featureRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceRunIds,
  sourceArtifactReferences,
  sourceCfp79ActionFeaturesJsonlBytes,
}: {
  result: SearchConsumerActionFeatureDictionaryV0Result;
  featureRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceRunIds: SearchConsumerActionFeatureDictionaryV0SourceRunIds;
  sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
  sourceCfp79ActionFeaturesJsonlBytes: number;
}): SerializedSearchConsumerActionFeatureDictionaryV0Artifacts => {
  const dictionariesFile = buildDictionariesFile({
    result,
    featureRunId,
    suiteId,
    sourceCfp79RunId: sourceRunIds.cfp79,
  });
  const dictionariesJson = stablePrettyJson(dictionariesFile);
  const rootFeaturesJsonl = jsonlText(result.rootFeatures);
  const actionFeaturesCompactJsonl = jsonlText(result.compactActionFeatures);
  const skippedRootsJsonl = jsonlText(result.skippedRoots);

  const artifactByteSizes: SearchConsumerActionFeatureDictionaryV0ArtifactByteSizes = {
    rootFeaturesJsonlBytes: Buffer.byteLength(rootFeaturesJsonl, "utf8"),
    actionFeaturesCompactJsonlBytes: Buffer.byteLength(actionFeaturesCompactJsonl, "utf8"),
    skippedRootsJsonlBytes: Buffer.byteLength(skippedRootsJsonl, "utf8"),
    dictionariesJsonBytes: Buffer.byteLength(dictionariesJson, "utf8"),
    sourceCfp79ActionFeaturesJsonlBytes,
  };
  const cFp81Recommendation = cFp81RecommendationFor(
    result,
    artifactByteSizes.actionFeaturesCompactJsonlBytes,
  );
  const preliminarySummary = buildSearchConsumerActionFeatureDictionaryV0Summary({
    result,
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceRunIds,
    sourceArtifactReferences,
    artifactByteSizes,
    dictionariesFile,
    hiddenInfoScanHazards: [],
    cFp81Recommendation,
  });
  const preliminaryReport = buildMarkdownReport({ result, summary: preliminarySummary });
  const hiddenInfoScanHazards = scanSearchConsumerActionFeaturesV0TextForHiddenInfo(
    [
      dictionariesJson,
      rootFeaturesJsonl,
      actionFeaturesCompactJsonl,
      skippedRootsJsonl,
      stablePrettyJson(preliminarySummary),
      preliminaryReport,
    ].join("\n"),
  );
  const summary = buildSearchConsumerActionFeatureDictionaryV0Summary({
    result,
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceRunIds,
    sourceArtifactReferences,
    artifactByteSizes,
    dictionariesFile,
    hiddenInfoScanHazards,
    cFp81Recommendation,
  });
  const summaryJson = stablePrettyJson(summary);
  const reportMarkdown = buildMarkdownReport({ result, summary });
  const artifactHashes = {
    "summary.json": sha256(summaryJson),
    "dictionaries.json": sha256(dictionariesJson),
    "root-features.jsonl": sha256(rootFeaturesJsonl),
    "action-features-compact.jsonl": sha256(actionFeaturesCompactJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  };
  const manifest: SearchConsumerActionFeatureDictionaryV0ArtifactManifest = {
    schemaVersion: "search-consumer-action-features-dictionary-v0-artifact-v1",
    featureRunId,
    phaseId: "cFp80",
    suiteId,
    sourceBenchmarkSuiteId,
    relativeOutputPath: relativeOutputPath(suiteId),
    generatedAtTimestampPolicy: "deterministic-no-wall-clock",
    files: [...searchConsumerActionFeatureDictionaryV0ArtifactFiles],
    consumerReadinessStatus: result.consumerReadinessStatus,
    sourceCfp79RunId: sourceRunIds.cfp79,
    sourceArtifactReferences,
    rootFeatureSchemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ROOT_SCHEMA_VERSION,
    actionFeatureSchemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_ACTION_SCHEMA_VERSION,
    skippedRootSchemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SKIPPED_SCHEMA_VERSION,
    summarySchemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_SUMMARY_SCHEMA_VERSION,
    dictionariesSchemaVersion:
      SEARCH_CONSUMER_ACTION_FEATURE_DICTIONARY_V0_DICTIONARIES_SCHEMA_VERSION,
    compactActionRowConstants: compactActionRowConstants(featureRunId),
    sourceActionRowConstants: sourceActionRowConstants(sourceRunIds.cfp79),
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
    explicitNonClaims: CFP80_EXPLICIT_NON_CLAIMS,
    cFp81Recommendation: summary.cFp81Recommendation,
    artifactHashes,
  };

  return {
    manifestJson: stablePrettyJson(manifest),
    summaryJson,
    dictionariesJson,
    rootFeaturesJsonl,
    actionFeaturesCompactJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writeSearchConsumerActionFeatureDictionaryV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  outDir: string;
  artifacts: SerializedSearchConsumerActionFeatureDictionaryV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(resolve(outDir, "dictionaries.json"), artifacts.dictionariesJson, "utf8"),
    writeFile(resolve(outDir, "root-features.jsonl"), artifacts.rootFeaturesJsonl, "utf8"),
    writeFile(
      resolve(outDir, "action-features-compact.jsonl"),
      artifacts.actionFeaturesCompactJsonl,
      "utf8",
    ),
    writeFile(resolve(outDir, "skipped-roots.jsonl"), artifacts.skippedRootsJsonl, "utf8"),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...searchConsumerActionFeatureDictionaryV0ArtifactFiles],
  };
};

export const combinedSearchConsumerActionFeatureDictionaryV0ArtifactText = (
  artifacts: SerializedSearchConsumerActionFeatureDictionaryV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.dictionariesJson,
    artifacts.rootFeaturesJsonl,
    artifacts.actionFeaturesCompactJsonl,
    artifacts.skippedRootsJsonl,
    artifacts.reportMarkdown,
  ].join("\n");

export const scanSearchConsumerActionFeatureDictionaryV0ArtifactsForHiddenInfo = (
  artifacts: SerializedSearchConsumerActionFeatureDictionaryV0Artifacts,
): string[] =>
  scanSearchConsumerActionFeaturesV0TextForHiddenInfo(
    combinedSearchConsumerActionFeatureDictionaryV0ArtifactText(artifacts),
  );

export const searchConsumerActionFeatureDictionaryV0ArtifactHashes = (
  artifacts: SerializedSearchConsumerActionFeatureDictionaryV0Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "dictionaries.json": sha256(artifacts.dictionariesJson),
  "root-features.jsonl": sha256(artifacts.rootFeaturesJsonl),
  "action-features-compact.jsonl": sha256(artifacts.actionFeaturesCompactJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
