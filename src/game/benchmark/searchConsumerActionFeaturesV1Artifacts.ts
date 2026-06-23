import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { scanSearchConsumerActionFeaturesV0TextForHiddenInfo } from "./searchConsumerActionFeaturesV0Artifacts";
import type {
  SearchConsumerActionFeaturesV1ActionFeatureSchemaVersion,
  SearchConsumerActionFeaturesV1ConsumerReadinessStatus,
  SearchConsumerActionFeaturesV1CountSummaries,
  SearchConsumerActionFeaturesV1Result,
  SearchConsumerActionFeaturesV1RootFeatureSchemaVersion,
  SearchConsumerActionFeaturesV1SkippedRootSchemaVersion,
  SearchConsumerActionFeaturesV1SourceArtifactReference,
  SearchConsumerActionFeaturesV1SourceConsistency,
  SearchConsumerActionFeaturesV1SummarySchemaVersion,
} from "./searchConsumerActionFeaturesV1";

export type SearchConsumerActionFeaturesV1ArtifactSchemaVersion =
  "search-consumer-action-features-v1-artifact-v1";

export const CFP79_EXPLICIT_NON_CLAIMS: readonly string[] = [
  "cFp79 does not choose actions or recommend best actions.",
  "cFp79 does not rank actions or compute action ordering.",
  "cFp79 does not estimate action values or expected values.",
  "cFp79 does not estimate win probability or reward targets.",
  "cFp79 does not compute payoff tables or principal variations.",
  "cFp79 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.",
  "cFp79 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.",
  "cFp79 does not select moves for product AI.",
  "cFp79 does not re-observe benchmark roots or run the benchmark suite.",
  "cFp79 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.",
  "cFp79 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.",
  "cFp79 does not add AI Lab runner buttons or execute benchmarks from the browser.",
  "cFp79 does not add difficulty tiers, export training data, or add Python tooling.",
  "cFp79 does not modify cFp76 or cFp78 artifacts.",
];

export const CFP80_RECOMMENDATION_FEATURE_CASEBOOK =
  "cFp80 may define a strictly benchmark-only action-feature casebook or consumer-readiness report over populated cFp79 action features; it must not add rollout, value, ranking, best-action, win-probability, reward-target, or product-AI behavior.";

export const CFP80_RECOMMENDATION_COMPACT =
  "cFp80 should first compact or dictionary-encode the cFp79 action-feature projection before any consumer casebook work.";

export const CFP80_RECOMMENDATION_NOT_READY =
  "cFp80 should not proceed until cFp79 source consistency is repaired and the feature join reaches features_ready.";

const ACTION_FEATURE_TARGET_BYTES = 50 * 1024 * 1024;
const HARD_STOP_BYTES = 90 * 1024 * 1024;

export const searchConsumerActionFeaturesV1ActionSizeLabel = (bytes: number): string => {
  if (bytes >= HARD_STOP_BYTES) return "at or above 90 MB hard stop (must stop)";
  if (bytes >= ACTION_FEATURE_TARGET_BYTES) {
    return "at or above 50 MB robust target; compact before cFp80 consumer work";
  }
  return "below 50 MB robust target, below 90 MB hard stop";
};

export interface SearchConsumerActionFeaturesV1SourceRunIds {
  cfp76: string;
  cfp78: string;
}

export interface SearchConsumerActionFeaturesV1ArtifactByteSizes {
  rootFeaturesJsonlBytes: number;
  actionFeaturesJsonlBytes: number;
  skippedRootsJsonlBytes: number;
}

export interface SearchConsumerActionFeaturesV1ArtifactManifest {
  schemaVersion: SearchConsumerActionFeaturesV1ArtifactSchemaVersion;
  featureRunId: string;
  phaseId: "cFp79";
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  consumerReadinessStatus: SearchConsumerActionFeaturesV1ConsumerReadinessStatus;
  sourceCfp76RunId: string;
  sourceCfp78RunId: string;
  sourceArtifactReferences: readonly SearchConsumerActionFeaturesV1SourceArtifactReference[];
  rootFeatureSchemaVersion: SearchConsumerActionFeaturesV1RootFeatureSchemaVersion;
  actionFeatureSchemaVersion: SearchConsumerActionFeaturesV1ActionFeatureSchemaVersion;
  skippedRootSchemaVersion: SearchConsumerActionFeaturesV1SkippedRootSchemaVersion;
  summarySchemaVersion: SearchConsumerActionFeaturesV1SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp80Recommendation: string;
  artifactHashes: Record<
    "summary.json" | "root-features.jsonl" | "action-features.jsonl" | "skipped-roots.jsonl" | "report.md",
    string
  >;
}

export interface SearchConsumerActionFeaturesV1Summary {
  schemaVersion: SearchConsumerActionFeaturesV1SummarySchemaVersion;
  featureRunId: string;
  phaseId: "cFp79";
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp76RunId: string;
  sourceCfp78RunId: string;
  sourceArtifactReferences: readonly SearchConsumerActionFeaturesV1SourceArtifactReference[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
  sourceConsistency: SearchConsumerActionFeaturesV1SourceConsistency;
  consumerReadinessStatus: SearchConsumerActionFeaturesV1ConsumerReadinessStatus;
  rootFeatureRowCount: number;
  actionFeatureRowCount: number;
  skippedRootRowCount: number;
  artifactByteSizes: SearchConsumerActionFeaturesV1ArtifactByteSizes;
  isActionFeaturesBelowTarget: boolean;
  isActionFeaturesBelowHardStop: boolean;
  actionFeaturesSizeLabel: string;
  countSummaries: SearchConsumerActionFeaturesV1CountSummaries;
  hiddenInfoScanStatus: "clean" | "hazards_detected";
  hiddenInfoScanHazards: readonly string[];
  explicitNonClaims: readonly string[];
  cFp80Recommendation: string;
}

export interface SerializedSearchConsumerActionFeaturesV1Artifacts {
  manifestJson: string;
  summaryJson: string;
  rootFeaturesJsonl: string;
  actionFeaturesJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const searchConsumerActionFeaturesV1ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "root-features.jsonl",
  "action-features.jsonl",
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
  `docs/research/literature/ai/benchmark-results/${suiteId}/search-consumer-action-features-v1/cFp79`;

const HIDDEN_INFO_SAFETY_NOTE =
  "All cFp79 machine-readable rows are deterministic scalar joins over committed cFp76 root " +
  "features and cFp78 compact public action identities. Action rows carry compact public " +
  "action-local fields plus rootRef joins only; they do not duplicate cFp76 root payloads or " +
  "carry raw move, card, private hand/deck, sampled-world, value, ranking, or rollout payloads.";

const cFp80RecommendationFor = (
  result: SearchConsumerActionFeaturesV1Result,
  actionFeaturesJsonlBytes: number,
) => {
  if (result.consumerReadinessStatus === "source_consistency_failed") {
    return CFP80_RECOMMENDATION_NOT_READY;
  }
  if (actionFeaturesJsonlBytes >= ACTION_FEATURE_TARGET_BYTES) {
    return CFP80_RECOMMENDATION_COMPACT;
  }
  return CFP80_RECOMMENDATION_FEATURE_CASEBOOK;
};

const buildSourceConsistencySection = (
  consistency: SearchConsumerActionFeaturesV1SourceConsistency,
) => `
## Source Consistency

| Check | Value |
|---|---:|
| status | ${consistency.status} |
| cFp76 consumer readiness status | ${consistency.cfp76ConsumerReadinessStatus} |
| cFp76 source consistency status | ${consistency.cfp76SourceConsistencyStatus} |
| cFp78 compact readiness status | ${consistency.cfp78CompactReadinessStatus} |
| cFp78 source consistency status | ${consistency.cfp78SourceConsistencyStatus} |
| cFp76 root feature summary count | ${consistency.cfp76RootFeatureSummaryCount} |
| cFp76 root feature actual count | ${consistency.cfp76RootFeatureActualCount} |
| cFp76 root feature count actual delta | ${consistency.cfp76RootFeatureCountActualDelta} |
| cFp76 skipped root summary count | ${consistency.cfp76SkippedRootSummaryCount} |
| cFp76 skipped root actual count | ${consistency.cfp76SkippedRootActualCount} |
| cFp76 skipped root count actual delta | ${consistency.cfp76SkippedRootCountActualDelta} |
| cFp78 compact action summary count | ${consistency.cfp78CompactActionSummaryCount} |
| cFp78 compact action actual count | ${consistency.cfp78CompactActionActualCount} |
| cFp78 compact action count actual delta | ${consistency.cfp78CompactActionCountActualDelta} |
| cFp78 root-index summary count | ${consistency.cfp78RootIndexSummaryCount} |
| cFp78 root-index actual count | ${consistency.cfp78RootIndexActualCount} |
| cFp78 root-index count actual delta | ${consistency.cfp78RootIndexCountActualDelta} |
| cFp78 skipped root summary count | ${consistency.cfp78SkippedRootSummaryCount} |
| cFp78 skipped root actual count | ${consistency.cfp78SkippedRootActualCount} |
| cFp78 skipped root count actual delta | ${consistency.cfp78SkippedRootCountActualDelta} |
| duplicate cFp76 root identity keys | ${consistency.duplicateCfp76RootIdentityKeys} |
| duplicate cFp78 root identity keys | ${consistency.duplicateCfp78RootIdentityKeys} |
| cFp76 root features without exactly one cFp78 root-index row | ${consistency.cfp76RootFeaturesWithoutCfp78RootIndex} |
| cFp78 root-index rows without exactly one cFp76 root feature | ${consistency.cfp78RootIndexRowsWithoutCfp76RootFeature} |
| cFp76 skipped roots without cFp78 skipped root | ${consistency.cfp76SkippedRootsWithoutCfp78SkippedRoot} |
| cFp78 skipped roots without cFp76 skipped root | ${consistency.cfp78SkippedRootsWithoutCfp76SkippedRoot} |
| cFp79 root feature row count | ${consistency.cfp79RootFeatureRowCount} |
| cFp79 root feature vs cFp76 delta | ${consistency.cfp79RootFeatureVsCfp76Delta} |
| cFp79 action feature row count | ${consistency.cfp79ActionFeatureRowCount} |
| cFp79 action feature vs cFp78 delta | ${consistency.cfp79ActionFeatureVsCfp78Delta} |
| cFp79 skipped root row count | ${consistency.cfp79SkippedRootRowCount} |
| cFp79 skipped root vs cFp76 delta | ${consistency.cfp79SkippedRootVsCfp76Delta} |
| cFp79 skipped root vs cFp78 delta | ${consistency.cfp79SkippedRootVsCfp78Delta} |
| cFp79 action rows missing root feature | ${consistency.cfp79ActionRowsMissingRootFeature} |
| cFp78 action identities missing cFp79 action features | ${consistency.cfp78ActionIdentitiesMissingCfp79ActionFeatures} |
| duplicate cFp79 root refs | ${consistency.duplicateCfp79RootRefs} |
| duplicate cFp79 action identity refs | ${consistency.duplicateCfp79ActionIdentityRefs} |
| source artifact reference count | ${consistency.sourceArtifactReferenceCount} |
| source artifact empty hash count | ${consistency.sourceArtifactEmptyHashCount} |
`;

const buildSourceArtifactSection = (
  references: readonly SearchConsumerActionFeaturesV1SourceArtifactReference[],
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
  result: SearchConsumerActionFeaturesV1Result;
  summary: SearchConsumerActionFeaturesV1Summary;
}) => `# Search Consumer Action Features v1

## Run

- suite id: ${summary.suiteId}
- feature run id: ${summary.featureRunId}
- phase id: ${summary.phaseId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- source cFp76 run id: ${summary.sourceCfp76RunId}
- source cFp78 run id: ${summary.sourceCfp78RunId}
- consumer readiness status: ${summary.consumerReadinessStatus}
${buildSourceConsistencySection(result.sourceConsistency)}
## Row Counts

| Row kind | Count |
|---|---:|
| root feature rows | ${summary.rootFeatureRowCount} |
| action feature rows | ${summary.actionFeatureRowCount} |
| skipped root rows | ${summary.skippedRootRowCount} |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| root-features.jsonl | ${summary.artifactByteSizes.rootFeaturesJsonlBytes} | below 90 MB hard stop |
| action-features.jsonl | ${summary.artifactByteSizes.actionFeaturesJsonlBytes} | ${summary.actionFeaturesSizeLabel} |
| skipped-roots.jsonl | ${summary.artifactByteSizes.skippedRootsJsonlBytes} | below 90 MB hard stop |

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

## cFp80 Recommendation

${summary.cFp80Recommendation}
`;

export const buildSearchConsumerActionFeaturesV1Summary = ({
  result,
  featureRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceRunIds,
  sourceArtifactReferences,
  artifactByteSizes,
  hiddenInfoScanHazards,
  cFp80Recommendation,
}: {
  result: SearchConsumerActionFeaturesV1Result;
  featureRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceRunIds: SearchConsumerActionFeaturesV1SourceRunIds;
  sourceArtifactReferences: readonly SearchConsumerActionFeaturesV1SourceArtifactReference[];
  artifactByteSizes: SearchConsumerActionFeaturesV1ArtifactByteSizes;
  hiddenInfoScanHazards: readonly string[];
  cFp80Recommendation: string;
}): SearchConsumerActionFeaturesV1Summary => ({
  schemaVersion: "search-consumer-action-features-v1-summary-v1",
  featureRunId,
  phaseId: "cFp79",
  suiteId,
  sourceBenchmarkSuiteId,
  sourceCfp76RunId: sourceRunIds.cfp76,
  sourceCfp78RunId: sourceRunIds.cfp78,
  sourceArtifactReferences,
  sourceArtifactReferenceCount: sourceArtifactReferences.length,
  sourceArtifactEmptyHashCount: result.sourceConsistency.sourceArtifactEmptyHashCount,
  sourceConsistency: result.sourceConsistency,
  consumerReadinessStatus: result.consumerReadinessStatus,
  rootFeatureRowCount: result.rootFeatures.length,
  actionFeatureRowCount: result.actionFeatures.length,
  skippedRootRowCount: result.skippedRoots.length,
  artifactByteSizes,
  isActionFeaturesBelowTarget: artifactByteSizes.actionFeaturesJsonlBytes < ACTION_FEATURE_TARGET_BYTES,
  isActionFeaturesBelowHardStop: artifactByteSizes.actionFeaturesJsonlBytes < HARD_STOP_BYTES,
  actionFeaturesSizeLabel: searchConsumerActionFeaturesV1ActionSizeLabel(
    artifactByteSizes.actionFeaturesJsonlBytes,
  ),
  countSummaries: result.countSummaries,
  hiddenInfoScanStatus: hiddenInfoScanHazards.length === 0 ? "clean" : "hazards_detected",
  hiddenInfoScanHazards,
  explicitNonClaims: CFP79_EXPLICIT_NON_CLAIMS,
  cFp80Recommendation,
});

export const serializeSearchConsumerActionFeaturesV1Artifacts = ({
  result,
  featureRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceRunIds,
  sourceArtifactReferences,
}: {
  result: SearchConsumerActionFeaturesV1Result;
  featureRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceRunIds: SearchConsumerActionFeaturesV1SourceRunIds;
  sourceArtifactReferences: readonly SearchConsumerActionFeaturesV1SourceArtifactReference[];
}): SerializedSearchConsumerActionFeaturesV1Artifacts => {
  const rootFeaturesJsonl = jsonlText(result.rootFeatures);
  const actionFeaturesJsonl = jsonlText(result.actionFeatures);
  const skippedRootsJsonl = jsonlText(result.skippedRoots);

  const artifactByteSizes: SearchConsumerActionFeaturesV1ArtifactByteSizes = {
    rootFeaturesJsonlBytes: Buffer.byteLength(rootFeaturesJsonl, "utf8"),
    actionFeaturesJsonlBytes: Buffer.byteLength(actionFeaturesJsonl, "utf8"),
    skippedRootsJsonlBytes: Buffer.byteLength(skippedRootsJsonl, "utf8"),
  };

  const cFp80Recommendation = cFp80RecommendationFor(
    result,
    artifactByteSizes.actionFeaturesJsonlBytes,
  );
  const preliminarySummary = buildSearchConsumerActionFeaturesV1Summary({
    result,
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceRunIds,
    sourceArtifactReferences,
    artifactByteSizes,
    hiddenInfoScanHazards: [],
    cFp80Recommendation,
  });
  const preliminaryReport = buildMarkdownReport({ result, summary: preliminarySummary });
  const hiddenInfoScanHazards = scanSearchConsumerActionFeaturesV0TextForHiddenInfo(
    [
      rootFeaturesJsonl,
      actionFeaturesJsonl,
      skippedRootsJsonl,
      stablePrettyJson(preliminarySummary),
      preliminaryReport,
    ].join("\n"),
  );
  const summary = buildSearchConsumerActionFeaturesV1Summary({
    result,
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceRunIds,
    sourceArtifactReferences,
    artifactByteSizes,
    hiddenInfoScanHazards,
    cFp80Recommendation,
  });
  const summaryJson = stablePrettyJson(summary);
  const reportMarkdown = buildMarkdownReport({ result, summary });
  const artifactHashes = {
    "summary.json": sha256(summaryJson),
    "root-features.jsonl": sha256(rootFeaturesJsonl),
    "action-features.jsonl": sha256(actionFeaturesJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  };

  const manifest: SearchConsumerActionFeaturesV1ArtifactManifest = {
    schemaVersion: "search-consumer-action-features-v1-artifact-v1",
    featureRunId,
    phaseId: "cFp79",
    suiteId,
    sourceBenchmarkSuiteId,
    relativeOutputPath: relativeOutputPath(suiteId),
    generatedAtTimestampPolicy: "deterministic-no-wall-clock",
    files: [...searchConsumerActionFeaturesV1ArtifactFiles],
    consumerReadinessStatus: result.consumerReadinessStatus,
    sourceCfp76RunId: sourceRunIds.cfp76,
    sourceCfp78RunId: sourceRunIds.cfp78,
    sourceArtifactReferences,
    rootFeatureSchemaVersion: "search-consumer-action-features-v1-root-feature-v1",
    actionFeatureSchemaVersion: "search-consumer-action-features-v1-action-feature-v1",
    skippedRootSchemaVersion: "search-consumer-action-features-v1-skipped-root-v1",
    summarySchemaVersion: "search-consumer-action-features-v1-summary-v1",
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
    explicitNonClaims: CFP79_EXPLICIT_NON_CLAIMS,
    cFp80Recommendation: summary.cFp80Recommendation,
    artifactHashes,
  };

  return {
    manifestJson: stablePrettyJson(manifest),
    summaryJson,
    rootFeaturesJsonl,
    actionFeaturesJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writeSearchConsumerActionFeaturesV1Artifacts = async ({
  outDir,
  artifacts,
}: {
  outDir: string;
  artifacts: SerializedSearchConsumerActionFeaturesV1Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(resolve(outDir, "root-features.jsonl"), artifacts.rootFeaturesJsonl, "utf8"),
    writeFile(resolve(outDir, "action-features.jsonl"), artifacts.actionFeaturesJsonl, "utf8"),
    writeFile(resolve(outDir, "skipped-roots.jsonl"), artifacts.skippedRootsJsonl, "utf8"),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...searchConsumerActionFeaturesV1ArtifactFiles],
  };
};

export const combinedSearchConsumerActionFeaturesV1ArtifactText = (
  artifacts: SerializedSearchConsumerActionFeaturesV1Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.rootFeaturesJsonl,
    artifacts.actionFeaturesJsonl,
    artifacts.skippedRootsJsonl,
    artifacts.reportMarkdown,
  ].join("\n");

export const scanSearchConsumerActionFeaturesV1ArtifactsForHiddenInfo = (
  artifacts: SerializedSearchConsumerActionFeaturesV1Artifacts,
): string[] =>
  scanSearchConsumerActionFeaturesV0TextForHiddenInfo(
    combinedSearchConsumerActionFeaturesV1ArtifactText(artifacts),
  );

export const searchConsumerActionFeaturesV1ArtifactHashes = (
  artifacts: SerializedSearchConsumerActionFeaturesV1Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "root-features.jsonl": sha256(artifacts.rootFeaturesJsonl),
  "action-features.jsonl": sha256(artifacts.actionFeaturesJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
