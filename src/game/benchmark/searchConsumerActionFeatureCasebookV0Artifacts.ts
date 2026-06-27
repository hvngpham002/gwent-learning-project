import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { scanSearchConsumerActionFeaturesV0TextForHiddenInfo } from "./searchConsumerActionFeaturesV0Artifacts";
import {
  SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_ROW_SCHEMA_VERSION,
  SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SKIPPED_ROOT_SUMMARY_SCHEMA_VERSION,
  SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SLICE_SUMMARY_SCHEMA_VERSION,
  SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SUMMARY_SCHEMA_VERSION,
  type SearchConsumerActionFeatureCasebookV0ConsumerReadinessStatus,
  type SearchConsumerActionFeatureCasebookV0Result,
  type SearchConsumerActionFeatureCasebookV0SourceConsistency,
  type SearchConsumerActionFeatureCasebookV0SummarySchemaVersion,
} from "./searchConsumerActionFeatureCasebookV0";
import type { SearchConsumerActionFeatureDictionaryV0SourceArtifactReference } from "./searchConsumerActionFeatureDictionaryV0";

export type SearchConsumerActionFeatureCasebookV0ArtifactSchemaVersion =
  "search-consumer-action-feature-casebook-v0-artifact-v1";

const HARD_STOP_BYTES = 90 * 1024 * 1024;
const ROUGH_TARGET_BYTES = 10 * 1024 * 1024;

export const CFP81_EXPLICIT_NON_CLAIMS: readonly string[] = [
  "cFp81 does not choose actions or recommend best actions.",
  "cFp81 does not rank actions or compute action ordering.",
  "cFp81 does not estimate action values or expected values.",
  "cFp81 does not estimate win probability or reward targets.",
  "cFp81 does not compute payoff tables or principal variations.",
  "cFp81 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.",
  "cFp81 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.",
  "cFp81 does not select moves for product AI.",
  "cFp81 does not re-observe benchmark roots or run browser benchmarks.",
  "cFp81 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.",
  "cFp81 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.",
  "cFp81 does not add AI Lab runner buttons or execute benchmarks from the browser.",
  "cFp81 does not add difficulty tiers, export training data, Python notebooks, or binary artifacts.",
  "cFp81 does not modify cFp80, cFp79, cFp78, or cFp76 artifacts.",
];

export const CFP82_RECOMMENDATION_CASEBOOK_REVIEW =
  "cFp82 should be a decision phase that uses the cFp81 casebook to choose the next benchmark-only consumer step, still without rollout, value estimation, action ranking, best-action selection, win-probability, reward-target, or product-AI behavior.";

export interface SearchConsumerActionFeatureCasebookV0SourceRunIds {
  cfp80: string;
}

export interface SearchConsumerActionFeatureCasebookV0ArtifactByteSizes {
  casebookRowsJsonlBytes: number;
  sliceSummariesJsonlBytes: number;
  skippedRootSummaryJsonBytes: number;
}

export interface SearchConsumerActionFeatureCasebookV0SourceArtifactByteSizes {
  manifestJsonBytes: number;
  summaryJsonBytes: number;
  dictionariesJsonBytes: number;
  rootFeaturesJsonlBytes: number;
  actionFeaturesCompactJsonlBytes: number;
  skippedRootsJsonlBytes: number;
  reportMarkdownBytes: number;
}

export interface SearchConsumerActionFeatureCasebookV0ArtifactSizeLabels {
  casebookRowsJsonl: string;
  sliceSummariesJsonl: string;
  skippedRootSummaryJson: string;
}

export interface SearchConsumerActionFeatureCasebookV0ArtifactManifest {
  schemaVersion: SearchConsumerActionFeatureCasebookV0ArtifactSchemaVersion;
  casebookRunId: string;
  phaseId: "cFp81";
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  consumerReadinessStatus: SearchConsumerActionFeatureCasebookV0ConsumerReadinessStatus;
  sourceCfp80RunId: string;
  sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
  rowSchemaVersion: typeof SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_ROW_SCHEMA_VERSION;
  sliceSummarySchemaVersion: typeof SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SLICE_SUMMARY_SCHEMA_VERSION;
  skippedRootSummarySchemaVersion: typeof SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SKIPPED_ROOT_SUMMARY_SCHEMA_VERSION;
  summarySchemaVersion: SearchConsumerActionFeatureCasebookV0SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp82Recommendation: string;
  artifactHashes: Record<
    "summary.json" | "casebook-rows.jsonl" | "slice-summaries.jsonl" | "skipped-root-summary.json" | "report.md",
    string
  >;
}

export interface SearchConsumerActionFeatureCasebookV0Summary {
  schemaVersion: SearchConsumerActionFeatureCasebookV0SummarySchemaVersion;
  casebookRunId: string;
  phaseId: "cFp81";
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp80RunId: string;
  sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
  sourceConsistency: SearchConsumerActionFeatureCasebookV0SourceConsistency;
  consumerReadinessStatus: SearchConsumerActionFeatureCasebookV0ConsumerReadinessStatus;
  rootFeatureRowCount: number;
  compactActionFeatureRowCount: number;
  skippedRootRowCount: number;
  skippedRootPercent: number;
  casebookRowCount: number;
  sliceSummaryRowCount: number;
  artifactByteSizes: SearchConsumerActionFeatureCasebookV0ArtifactByteSizes;
  artifactSizeLabels: SearchConsumerActionFeatureCasebookV0ArtifactSizeLabels;
  sourceCfp80ArtifactByteSizes: SearchConsumerActionFeatureCasebookV0SourceArtifactByteSizes;
  inheritedSkippedRootCountsAndPercentages: {
    skippedRootCount: number;
    skippedRootPercent: number;
  };
  readinessLabelCounts: SearchConsumerActionFeatureCasebookV0Result["readinessLabelCounts"];
  casebookRowKindCounts: SearchConsumerActionFeatureCasebookV0Result["casebookRowKindCounts"];
  countSummaries: SearchConsumerActionFeatureCasebookV0Result["countSummaries"];
  classificationThresholds: SearchConsumerActionFeatureCasebookV0Result["thresholds"];
  hiddenInfoScanStatus: "clean" | "hazards_detected";
  hiddenInfoScanHazards: readonly string[];
  explicitNonClaims: readonly string[];
  cFp82Recommendation: string;
}

export interface SerializedSearchConsumerActionFeatureCasebookV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  casebookRowsJsonl: string;
  sliceSummariesJsonl: string;
  skippedRootSummaryJson: string;
  reportMarkdown: string;
}

export const searchConsumerActionFeatureCasebookV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "casebook-rows.jsonl",
  "slice-summaries.jsonl",
  "skipped-root-summary.json",
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
const jsonlText = (rows: readonly unknown[]) =>
  rows.map(stableJsonLine).join("\n") + (rows.length > 0 ? "\n" : "");
const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));
const markdownCell = (value: string) => value.replaceAll("|", "\\|");

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/search-consumer-action-feature-casebook-v0/cFp81`;

const HIDDEN_INFO_SAFETY_NOTE =
  "All cFp81 machine-readable rows are deterministic aggregate slices over committed cFp80 " +
  "compact artifacts. They contain scalar counts, percentages, readiness labels, and fixed " +
  "notes only. They do not emit per-action reconstructed rows, raw move payloads, private " +
  "hand/deck data, sampled-world payloads, value estimates, ranking fields, or rollout outputs.";

export const searchConsumerActionFeatureCasebookV0SizeLabel = (bytes: number): string => {
  if (bytes >= HARD_STOP_BYTES) return "at or above 90 MB hard stop (must stop)";
  if (bytes >= ROUGH_TARGET_BYTES) return "below 90 MB hard stop, above 10 MB rough target";
  return "below 10 MB rough target and below 90 MB hard stop";
};

const formatCountRows = (record: Record<string, number>) => {
  const rows = sortedEntries(record);
  if (rows.length === 0) return "| none | 0 |";
  return rows.map(([key, count]) => `| ${markdownCell(key)} | ${count} |`).join("\n");
};

const buildSourceConsistencySection = (
  consistency: SearchConsumerActionFeatureCasebookV0SourceConsistency,
) => `
## Source Consistency

| Check | Value |
|---|---:|
| status | ${consistency.status} |
| cFp80 consumer readiness status | ${consistency.cfp80ConsumerReadinessStatus} |
| cFp80 source consistency status | ${consistency.cfp80SourceConsistencyStatus} |
| cFp80 reconstruction status | ${consistency.cfp80ReconstructionStatus} |
| cFp80 reconstruction mismatch count | ${consistency.cfp80ReconstructionMismatchCount} |
| cFp80 robust target status | ${consistency.cfp80RobustTargetStatus} |
| cFp80 root feature summary count | ${consistency.cfp80RootFeatureSummaryCount} |
| cFp80 root feature actual count | ${consistency.cfp80RootFeatureActualCount} |
| cFp80 root feature count actual delta | ${consistency.cfp80RootFeatureCountActualDelta} |
| cFp80 compact action summary count | ${consistency.cfp80CompactActionSummaryCount} |
| cFp80 compact action actual count | ${consistency.cfp80CompactActionActualCount} |
| cFp80 compact action count actual delta | ${consistency.cfp80CompactActionCountActualDelta} |
| cFp80 skipped root summary count | ${consistency.cfp80SkippedRootSummaryCount} |
| cFp80 skipped root actual count | ${consistency.cfp80SkippedRootActualCount} |
| cFp80 skipped root count actual delta | ${consistency.cfp80SkippedRootCountActualDelta} |
| dictionary group count mismatches | ${consistency.dictionaryGroupCountMismatches} |
| compact action rows with invalid dictionary ids | ${consistency.compactActionRowsWithInvalidDictionaryIds} |
| compact action rows with invalid root ref id | ${consistency.compactActionRowsWithInvalidRootRefId} |
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
  summary,
}: {
  summary: SearchConsumerActionFeatureCasebookV0Summary;
}) => `# Search Consumer Action Feature Casebook v0

## Run

- suite id: ${summary.suiteId}
- casebook run id: ${summary.casebookRunId}
- phase id: ${summary.phaseId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- source cFp80 run id: ${summary.sourceCfp80RunId}
- consumer readiness status: ${summary.consumerReadinessStatus}
${buildSourceConsistencySection(summary.sourceConsistency)}
## Row Counts

| Row kind | Count |
|---|---:|
| cFp80 root feature rows | ${summary.rootFeatureRowCount} |
| cFp80 compact action rows | ${summary.compactActionFeatureRowCount} |
| inherited skipped root rows | ${summary.skippedRootRowCount} |
| cFp81 casebook rows | ${summary.casebookRowCount} |
| cFp81 slice summary rows | ${summary.sliceSummaryRowCount} |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| casebook-rows.jsonl | ${summary.artifactByteSizes.casebookRowsJsonlBytes} | ${summary.artifactSizeLabels.casebookRowsJsonl} |
| slice-summaries.jsonl | ${summary.artifactByteSizes.sliceSummariesJsonlBytes} | ${summary.artifactSizeLabels.sliceSummariesJsonl} |
| skipped-root-summary.json | ${summary.artifactByteSizes.skippedRootSummaryJsonBytes} | ${summary.artifactSizeLabels.skippedRootSummaryJson} |
| source cFp80 action-features-compact.jsonl | ${summary.sourceCfp80ArtifactByteSizes.actionFeaturesCompactJsonlBytes} | source |
| source cFp80 root-features.jsonl | ${summary.sourceCfp80ArtifactByteSizes.rootFeaturesJsonlBytes} | source |
| source cFp80 skipped-roots.jsonl | ${summary.sourceCfp80ArtifactByteSizes.skippedRootsJsonlBytes} | source |
| source cFp80 dictionaries.json | ${summary.sourceCfp80ArtifactByteSizes.dictionariesJsonBytes} | source |

## Inherited Skipped Roots

- skipped root count: ${summary.inheritedSkippedRootCountsAndPercentages.skippedRootCount}
- skipped root percent: ${summary.inheritedSkippedRootCountsAndPercentages.skippedRootPercent}

## Readiness Label Counts

| Label | Count |
|---|---:|
${formatCountRows(summary.readinessLabelCounts)}

## Casebook Row Kind Counts

| Row kind | Count |
|---|---:|
${formatCountRows(summary.casebookRowKindCounts)}

## Count Summaries

### Public Action Kind

| Kind | Count |
|---|---:|
${formatCountRows(summary.countSummaries.publicActionKindCounts)}

### Source Class

| Source class | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsBySourceClass)}

### Target Token

| Target token | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsByTargetToken)}

### Move-Count Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsByMoveCountBucket)}

### Collision Flag

| Flag | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsByCollisionFlag)}

### Phase

| Phase | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsByPhase)}

### Round

| Round | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsByRound)}

### Policy

| Policy | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsByPolicy)}

### Faction

| Faction | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsByFaction)}

### Deck Preset

| Deck preset | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsByDeckPreset)}

### Matchup

| Matchup | Count |
|---|---:|
${formatCountRows(summary.countSummaries.countsByMatchup)}

### cFp70 Availability Risk Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(summary.countSummaries.cFp70AvailabilityRiskBucketCounts)}

### cFp71 Outcome Risk Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(summary.countSummaries.cFp71OutcomeRiskBucketCounts)}

### cFp72 Branching Risk Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(summary.countSummaries.cFp72BranchingRiskBucketCounts)}

### cFp73 Budget Pressure Label

| Label | Count |
|---|---:|
${formatCountRows(summary.countSummaries.cFp73BudgetPressureLabelCounts)}

### cFp74 Cap Status

| Status | Count |
|---|---:|
${formatCountRows(summary.countSummaries.cFp74CapStatusCounts)}

### Combined Readiness

| Label | Count |
|---|---:|
${formatCountRows(summary.countSummaries.combinedReadinessCounts)}

## Classification Thresholds

| Threshold | Value |
|---|---:|
| sparse action count | ${summary.classificationThresholds.sparseActionCount} |
| sparse root count | ${summary.classificationThresholds.sparseRootCount} |
| high collision action share percent | ${summary.classificationThresholds.highCollisionActionSharePercent} |
| high branching action share percent | ${summary.classificationThresholds.highBranchingActionSharePercent} |
| over-budget action share percent | ${summary.classificationThresholds.overBudgetActionSharePercent} |
| skipped root context percent | ${summary.classificationThresholds.skippedRootContextPercent} |
| max casebook rows per kind | ${summary.classificationThresholds.maxCasebookRowsPerKind} |

## Hidden-Info Safety

- scan status: ${summary.hiddenInfoScanStatus}
- hazards detected: ${summary.hiddenInfoScanHazards.length === 0 ? "none" : summary.hiddenInfoScanHazards.join(", ")}

${HIDDEN_INFO_SAFETY_NOTE}
${buildSourceArtifactSection(summary.sourceArtifactReferences)}
## Non-Claims

${summary.explicitNonClaims.map((claim) => `- ${claim}`).join("\n")}

## cFp82 Recommendation

${summary.cFp82Recommendation}
`;

export const buildSearchConsumerActionFeatureCasebookV0Summary = ({
  result,
  casebookRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceRunIds,
  sourceArtifactReferences,
  sourceArtifactByteSizes,
  artifactByteSizes,
  hiddenInfoScanHazards,
}: {
  result: SearchConsumerActionFeatureCasebookV0Result;
  casebookRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceRunIds: SearchConsumerActionFeatureCasebookV0SourceRunIds;
  sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
  sourceArtifactByteSizes: SearchConsumerActionFeatureCasebookV0SourceArtifactByteSizes;
  artifactByteSizes: SearchConsumerActionFeatureCasebookV0ArtifactByteSizes;
  hiddenInfoScanHazards: readonly string[];
}): SearchConsumerActionFeatureCasebookV0Summary => ({
  schemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SUMMARY_SCHEMA_VERSION,
  casebookRunId,
  phaseId: "cFp81",
  suiteId,
  sourceBenchmarkSuiteId,
  sourceCfp80RunId: sourceRunIds.cfp80,
  sourceArtifactReferences,
  sourceArtifactReferenceCount: sourceArtifactReferences.length,
  sourceArtifactEmptyHashCount: result.sourceConsistency.sourceArtifactEmptyHashCount,
  sourceConsistency: result.sourceConsistency,
  consumerReadinessStatus: result.consumerReadinessStatus,
  rootFeatureRowCount: result.skippedRootSummary.rootFeatureRowCount,
  compactActionFeatureRowCount: result.skippedRootSummary.compactActionFeatureRowCount,
  skippedRootRowCount: result.skippedRootSummary.skippedRootRowCount,
  skippedRootPercent: result.skippedRootSummary.skippedRootPercent,
  casebookRowCount: result.casebookRows.length,
  sliceSummaryRowCount: result.sliceSummaries.length,
  artifactByteSizes,
  artifactSizeLabels: {
    casebookRowsJsonl: searchConsumerActionFeatureCasebookV0SizeLabel(
      artifactByteSizes.casebookRowsJsonlBytes,
    ),
    sliceSummariesJsonl: searchConsumerActionFeatureCasebookV0SizeLabel(
      artifactByteSizes.sliceSummariesJsonlBytes,
    ),
    skippedRootSummaryJson: searchConsumerActionFeatureCasebookV0SizeLabel(
      artifactByteSizes.skippedRootSummaryJsonBytes,
    ),
  },
  sourceCfp80ArtifactByteSizes: sourceArtifactByteSizes,
  inheritedSkippedRootCountsAndPercentages: {
    skippedRootCount: result.skippedRootSummary.skippedRootRowCount,
    skippedRootPercent: result.skippedRootSummary.skippedRootPercent,
  },
  readinessLabelCounts: result.readinessLabelCounts,
  casebookRowKindCounts: result.casebookRowKindCounts,
  countSummaries: result.countSummaries,
  classificationThresholds: result.thresholds,
  hiddenInfoScanStatus: hiddenInfoScanHazards.length === 0 ? "clean" : "hazards_detected",
  hiddenInfoScanHazards,
  explicitNonClaims: CFP81_EXPLICIT_NON_CLAIMS,
  cFp82Recommendation: CFP82_RECOMMENDATION_CASEBOOK_REVIEW,
});

export const serializeSearchConsumerActionFeatureCasebookV0Artifacts = ({
  result,
  casebookRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceRunIds,
  sourceArtifactReferences,
  sourceArtifactByteSizes,
}: {
  result: SearchConsumerActionFeatureCasebookV0Result;
  casebookRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceRunIds: SearchConsumerActionFeatureCasebookV0SourceRunIds;
  sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
  sourceArtifactByteSizes: SearchConsumerActionFeatureCasebookV0SourceArtifactByteSizes;
}): SerializedSearchConsumerActionFeatureCasebookV0Artifacts => {
  const casebookRowsJsonl = jsonlText(result.casebookRows);
  const sliceSummariesJsonl = jsonlText(result.sliceSummaries);
  const skippedRootSummaryJson = stablePrettyJson(result.skippedRootSummary);
  const artifactByteSizes: SearchConsumerActionFeatureCasebookV0ArtifactByteSizes = {
    casebookRowsJsonlBytes: Buffer.byteLength(casebookRowsJsonl, "utf8"),
    sliceSummariesJsonlBytes: Buffer.byteLength(sliceSummariesJsonl, "utf8"),
    skippedRootSummaryJsonBytes: Buffer.byteLength(skippedRootSummaryJson, "utf8"),
  };

  const preliminarySummary = buildSearchConsumerActionFeatureCasebookV0Summary({
    result,
    casebookRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceRunIds,
    sourceArtifactReferences,
    sourceArtifactByteSizes,
    artifactByteSizes,
    hiddenInfoScanHazards: [],
  });
  const preliminaryReport = buildMarkdownReport({ summary: preliminarySummary });
  const hiddenInfoScanHazards = scanSearchConsumerActionFeaturesV0TextForHiddenInfo(
    [
      casebookRowsJsonl,
      sliceSummariesJsonl,
      skippedRootSummaryJson,
      stablePrettyJson(preliminarySummary),
      preliminaryReport,
    ].join("\n"),
  );
  const summary = buildSearchConsumerActionFeatureCasebookV0Summary({
    result,
    casebookRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceRunIds,
    sourceArtifactReferences,
    sourceArtifactByteSizes,
    artifactByteSizes,
    hiddenInfoScanHazards,
  });
  const summaryJson = stablePrettyJson(summary);
  const reportMarkdown = buildMarkdownReport({ summary });
  const artifactHashes = {
    "summary.json": sha256(summaryJson),
    "casebook-rows.jsonl": sha256(casebookRowsJsonl),
    "slice-summaries.jsonl": sha256(sliceSummariesJsonl),
    "skipped-root-summary.json": sha256(skippedRootSummaryJson),
    "report.md": sha256(reportMarkdown),
  };
  const manifest: SearchConsumerActionFeatureCasebookV0ArtifactManifest = {
    schemaVersion: "search-consumer-action-feature-casebook-v0-artifact-v1",
    casebookRunId,
    phaseId: "cFp81",
    suiteId,
    sourceBenchmarkSuiteId,
    relativeOutputPath: relativeOutputPath(suiteId),
    generatedAtTimestampPolicy: "deterministic-no-wall-clock",
    files: [...searchConsumerActionFeatureCasebookV0ArtifactFiles],
    consumerReadinessStatus: result.consumerReadinessStatus,
    sourceCfp80RunId: sourceRunIds.cfp80,
    sourceArtifactReferences,
    rowSchemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_ROW_SCHEMA_VERSION,
    sliceSummarySchemaVersion:
      SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SLICE_SUMMARY_SCHEMA_VERSION,
    skippedRootSummarySchemaVersion:
      SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SKIPPED_ROOT_SUMMARY_SCHEMA_VERSION,
    summarySchemaVersion: SEARCH_CONSUMER_ACTION_FEATURE_CASEBOOK_V0_SUMMARY_SCHEMA_VERSION,
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
    explicitNonClaims: CFP81_EXPLICIT_NON_CLAIMS,
    cFp82Recommendation: summary.cFp82Recommendation,
    artifactHashes,
  };

  return {
    manifestJson: stablePrettyJson(manifest),
    summaryJson,
    casebookRowsJsonl,
    sliceSummariesJsonl,
    skippedRootSummaryJson,
    reportMarkdown,
  };
};

export const writeSearchConsumerActionFeatureCasebookV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  outDir: string;
  artifacts: SerializedSearchConsumerActionFeatureCasebookV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(resolve(outDir, "casebook-rows.jsonl"), artifacts.casebookRowsJsonl, "utf8"),
    writeFile(resolve(outDir, "slice-summaries.jsonl"), artifacts.sliceSummariesJsonl, "utf8"),
    writeFile(
      resolve(outDir, "skipped-root-summary.json"),
      artifacts.skippedRootSummaryJson,
      "utf8",
    ),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...searchConsumerActionFeatureCasebookV0ArtifactFiles],
  };
};

export const combinedSearchConsumerActionFeatureCasebookV0ArtifactText = (
  artifacts: SerializedSearchConsumerActionFeatureCasebookV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.casebookRowsJsonl,
    artifacts.sliceSummariesJsonl,
    artifacts.skippedRootSummaryJson,
    artifacts.reportMarkdown,
  ].join("\n");

export const scanSearchConsumerActionFeatureCasebookV0ArtifactsForHiddenInfo = (
  artifacts: SerializedSearchConsumerActionFeatureCasebookV0Artifacts,
): string[] =>
  scanSearchConsumerActionFeaturesV0TextForHiddenInfo(
    combinedSearchConsumerActionFeatureCasebookV0ArtifactText(artifacts),
  );

export const searchConsumerActionFeatureCasebookV0ArtifactHashes = (
  artifacts: SerializedSearchConsumerActionFeatureCasebookV0Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "casebook-rows.jsonl": sha256(artifacts.casebookRowsJsonl),
  "slice-summaries.jsonl": sha256(artifacts.sliceSummariesJsonl),
  "skipped-root-summary.json": sha256(artifacts.skippedRootSummaryJson),
  "report.md": sha256(artifacts.reportMarkdown),
});
