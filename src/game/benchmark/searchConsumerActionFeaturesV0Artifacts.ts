import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";

import type {
  SearchConsumerActionFeaturesV0ActionFeatureGapSchemaVersion,
  SearchConsumerActionFeaturesV0ActionFeatureSchemaVersion,
  SearchConsumerActionFeaturesV0ConsumerReadinessStatus,
  SearchConsumerActionFeaturesV0CountSummaries,
  SearchConsumerActionFeaturesV0Result,
  SearchConsumerActionFeaturesV0RootFeatureSchemaVersion,
  SearchConsumerActionFeaturesV0SkippedRootSchemaVersion,
  SearchConsumerActionFeaturesV0SourceArtifactReference,
  SearchConsumerActionFeaturesV0SourceConsistency,
  SearchConsumerActionFeaturesV0SummarySchemaVersion,
} from "./searchConsumerActionFeaturesV0";

export type SearchConsumerActionFeaturesV0ArtifactSchemaVersion =
  "search-consumer-action-features-v0-artifact-v1";

export interface SearchConsumerActionFeaturesV0SourceRunIds {
  cfp68: string;
  cfp69: string;
  cfp70: string;
  cfp71: string;
  cfp72: string;
  cfp73: string;
  cfp74: string;
}

export const EXPLICIT_NON_CLAIMS: readonly string[] = [
  "cFp76 does not choose actions or recommend best actions.",
  "cFp76 does not rank actions or compute action ordering.",
  "cFp76 does not estimate action values or expected values.",
  "cFp76 does not estimate win probability or reward targets.",
  "cFp76 does not compute payoff tables or principal variations.",
  "cFp76 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.",
  "cFp76 does not select moves for product AI.",
  "cFp76 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.",
  "cFp76 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.",
  "cFp76 does not add AI Lab runner buttons or execute benchmarks from the browser.",
  "cFp76 does not add difficulty tiers, export training data, or add Python tooling.",
];

export const CFP77_RECOMMENDATION_GAP =
  "cFp77 should add a narrow public-action-identity artifact derived from cFp69/cFp70 sources, without new command execution or product AI wiring.";

export const CFP77_RECOMMENDATION_NOT_READY =
  "cFp77 should repair the source artifact chain reported in sourceConsistency before any consumer work.";

export interface SearchConsumerActionFeaturesV0ArtifactManifest {
  schemaVersion: SearchConsumerActionFeaturesV0ArtifactSchemaVersion;
  featureRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  consumerReadinessStatus: SearchConsumerActionFeaturesV0ConsumerReadinessStatus;
  sourceCfp68RunId: string;
  sourceCfp69RunId: string;
  sourceCfp70RunId: string;
  sourceCfp71RunId: string;
  sourceCfp72RunId: string;
  sourceCfp73RunId: string;
  sourceCfp74RunId: string;
  sourceArtifactReferences: readonly SearchConsumerActionFeaturesV0SourceArtifactReference[];
  rootFeatureSchemaVersion: SearchConsumerActionFeaturesV0RootFeatureSchemaVersion;
  actionFeatureSchemaVersion: SearchConsumerActionFeaturesV0ActionFeatureSchemaVersion;
  actionFeatureGapSchemaVersion: SearchConsumerActionFeaturesV0ActionFeatureGapSchemaVersion;
  skippedRootSchemaVersion: SearchConsumerActionFeaturesV0SkippedRootSchemaVersion;
  summarySchemaVersion: SearchConsumerActionFeaturesV0SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp77Recommendation: string;
  artifactHashes: Record<
    | "summary.json"
    | "root-features.jsonl"
    | "action-features.jsonl"
    | "action-feature-gaps.jsonl"
    | "skipped-roots.jsonl"
    | "report.md",
    string
  >;
}

export interface SearchConsumerActionFeaturesV0ArtifactByteSizes {
  rootFeaturesJsonlBytes: number;
  actionFeaturesJsonlBytes: number;
  actionFeatureGapsJsonlBytes: number;
  skippedRootsJsonlBytes: number;
}

export interface SearchConsumerActionFeaturesV0Summary {
  schemaVersion: SearchConsumerActionFeaturesV0SummarySchemaVersion;
  featureRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceArtifactReferences: readonly SearchConsumerActionFeaturesV0SourceArtifactReference[];
  consumerReadinessStatus: SearchConsumerActionFeaturesV0ConsumerReadinessStatus;
  rootFeatureRowCount: number;
  actionFeatureRowCount: number;
  actionFeatureGapRowCount: number;
  skippedRootRowCount: number;
  sourceConsistency: SearchConsumerActionFeaturesV0SourceConsistency;
  countSummaries: SearchConsumerActionFeaturesV0CountSummaries;
  artifactByteSizes: SearchConsumerActionFeaturesV0ArtifactByteSizes;
  hiddenInfoScanStatus: "clean" | "hazards_detected";
  hiddenInfoScanHazards: readonly string[];
  explicitNonClaims: readonly string[];
  cFp77Recommendation: string;
}

export interface SerializedSearchConsumerActionFeaturesV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  rootFeaturesJsonl: string;
  actionFeaturesJsonl: string;
  actionFeatureGapsJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const searchConsumerActionFeaturesV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "root-features.jsonl",
  "action-features.jsonl",
  "action-feature-gaps.jsonl",
  "skipped-roots.jsonl",
  "report.md",
] as const;

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

const stablePrettyJson = (value: unknown) => `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;

const stableJsonLine = (value: unknown) => JSON.stringify(sortJsonValue(value));

export const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

const jsonlText = (rows: readonly unknown[]) =>
  rows.map(stableJsonLine).join("\n") + (rows.length > 0 ? "\n" : "");

const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));

const formatCountRows = (record: Record<string, number>) => {
  const rows = sortedEntries(record);
  if (rows.length === 0) return "| none | 0 |";
  return rows.map(([key, count]) => `| ${key} | ${count} |`).join("\n");
};

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/search-consumer-action-features-v0/cFp76`;

const HIDDEN_INFO_SAFETY_NOTE =
  "All rows in root-features.jsonl, action-features.jsonl, action-feature-gaps.jsonl, and " +
  "skipped-roots.jsonl are scalar/count-map derivations of committed cFp68-cFp74 artifacts. " +
  "No card identity maps, runtime terminal states, command/event logs, hand/deck payloads, " +
  "decision traces, raw move identifiers, or card/leader names appear in machine-readable " +
  "rows.";

const buildSourceConsistencySection = (consistency: SearchConsumerActionFeaturesV0SourceConsistency) => `
## Source Consistency

| Check | Value |
|---|---:|
| status | ${consistency.status} |
| cFp68 contract status | ${consistency.cFp68ContractStatus} |
| cFp69 probe readiness status | ${consistency.cFp69ProbeReadinessStatus} |
| cFp70 probe readiness status | ${consistency.cFp70ProbeReadinessStatus} |
| cFp71 probe readiness status | ${consistency.cFp71ProbeReadinessStatus} |
| cFp72 probe readiness status | ${consistency.cFp72ProbeReadinessStatus} |
| cFp74 scaffold readiness status | ${consistency.cFp74ScaffoldReadinessStatus} |
| cFp68 eligible root count | ${consistency.cFp68EligibleRootCount} |
| cFp69 probe root count | ${consistency.cFp69ProbeRootCount} |
| cFp70 availability root count | ${consistency.cFp70AvailabilityRootCount} |
| cFp71 outcome root count | ${consistency.cFp71OutcomeRootCount} |
| cFp72 branching root count | ${consistency.cFp72BranchingRootCount} |
| cFp74 in-cap root count | ${consistency.cFp74InCapRootCount} |
| cFp74 over-budget root count | ${consistency.cFp74OverBudgetRootCount} |
| cFp68 vs cFp69 eligible root count delta | ${consistency.cfp68Cfp69EligibleRootCountDelta} |
| cFp68 vs cFp70 eligible root count delta | ${consistency.cfp68Cfp70EligibleRootCountDelta} |
| cFp68 vs cFp71 eligible root count delta | ${consistency.cfp68Cfp71EligibleRootCountDelta} |
| cFp68 vs cFp72 eligible root count delta | ${consistency.cfp68Cfp72EligibleRootCountDelta} |
| cFp74 in-cap + over-budget vs cFp72 branching delta | ${consistency.cfp74InCapPlusOverBudgetVsCfp72BranchingDelta} |
| cFp68 skipped root count | ${consistency.cFp68SkippedRootCount} |
| cFp69 skipped root count | ${consistency.cFp69SkippedRootCount} |
| cFp70 skipped root count | ${consistency.cFp70SkippedRootCount} |
| cFp71 skipped root count | ${consistency.cFp71SkippedRootCount} |
| cFp72 skipped root count | ${consistency.cFp72SkippedRootCount} |
| cFp74 inherited skipped root count | ${consistency.cFp74InheritedSkippedRootCount} |
| cFp68 vs cFp69 skipped root count delta | ${consistency.cfp68Cfp69SkippedRootCountDelta} |
| cFp68 vs cFp70 skipped root count delta | ${consistency.cfp68Cfp70SkippedRootCountDelta} |
| cFp68 vs cFp71 skipped root count delta | ${consistency.cfp68Cfp71SkippedRootCountDelta} |
| cFp68 vs cFp72 skipped root count delta | ${consistency.cfp68Cfp72SkippedRootCountDelta} |
| cFp68 vs cFp74 skipped root count delta | ${consistency.cfp68Cfp74SkippedRootCountDelta} |
| duplicate cFp68 eligible root keys | ${consistency.duplicateCfp68EligibleRootKeys} |
| duplicate cFp69 probe root keys | ${consistency.duplicateCfp69ProbeRootKeys} |
| duplicate cFp70 availability root keys | ${consistency.duplicateCfp70AvailabilityRootKeys} |
| duplicate cFp71 outcome root keys | ${consistency.duplicateCfp71OutcomeRootKeys} |
| duplicate cFp72 branching root keys | ${consistency.duplicateCfp72BranchingRootKeys} |
| duplicate cFp73 casebook root keys | ${consistency.duplicateCfp73CasebookRootKeys} |
| duplicate cFp74 second-ply root keys | ${consistency.duplicateCfp74SecondPlyRootKeys} |
| duplicate cFp74 over-budget root keys | ${consistency.duplicateCfp74OverBudgetRootKeys} |
| duplicate cFp74 skipped root keys | ${consistency.duplicateCfp74SkippedRootKeys} |
| cFp69 roots missing cFp68 eligible root | ${consistency.cfp69RootsMissingCfp68EligibleRoot} |
| cFp70 roots missing cFp68 eligible root | ${consistency.cfp70RootsMissingCfp68EligibleRoot} |
| cFp71 roots missing cFp68 eligible root | ${consistency.cfp71RootsMissingCfp68EligibleRoot} |
| cFp72 roots missing cFp68 eligible root | ${consistency.cfp72RootsMissingCfp68EligibleRoot} |
| cFp73 casebook roots missing cFp72 branching root | ${consistency.cfp73CasebookRootsMissingCfp72BranchingRoot} |
| cFp74 second-ply roots missing cFp72 branching root | ${consistency.cfp74SecondPlyRootsMissingCfp72BranchingRoot} |
| cFp74 over-budget roots missing cFp72 branching root | ${consistency.cfp74OverBudgetRootsMissingCfp72BranchingRoot} |
| cFp70 availability disagreement total | ${consistency.cFp70AvailabilityDisagreementTotal} |
| cFp71 failed/deferred pair total | ${consistency.cFp71FailedOrDeferredPairTotal} |
| cFp72 failed/deferred branching pair total | ${consistency.cFp72FailedOrDeferredBranchingPairTotal} |
| cFp74 failed/deferred second-ply pair count | ${consistency.cFp74FailedOrDeferredSecondPlyPairCount} |
| cFp74 in-cap roots not observed | ${consistency.cFp74InCapRootsNotObserved} |
| source artifact reference count | ${consistency.sourceArtifactReferenceCount} |
| source artifact empty hash count | ${consistency.sourceArtifactEmptyHashCount} |
| cFp68 eligible root count vs actual cFp68 eligible rows delta | ${consistency.cfp68EligibleRootCountActualDelta} |
| cFp68 skipped root count vs actual cFp74 skipped rows delta | ${consistency.cfp68SkippedRootCountActualDelta} |
| cFp69 probe root count vs actual cFp69 probe rows delta | ${consistency.cfp69ProbeRootCountActualDelta} |
| cFp70 availability root count vs actual cFp70 availability rows delta | ${consistency.cfp70AvailabilityRootCountActualDelta} |
| cFp71 outcome root count vs actual cFp71 outcome rows delta | ${consistency.cfp71OutcomeRootCountActualDelta} |
| cFp72 branching root count vs actual cFp72 branching rows delta | ${consistency.cfp72BranchingRootCountActualDelta} |
| cFp74 in-cap root count vs actual cFp74 second-ply rows delta | ${consistency.cfp74InCapRootCountActualDelta} |
| cFp74 over-budget root count vs actual cFp74 over-budget rows delta | ${consistency.cfp74OverBudgetRootCountActualDelta} |
| cFp74 inherited skipped root count vs actual cFp74 skipped rows delta | ${consistency.cfp74InheritedSkippedRootCountActualDelta} |
`;

const buildSourceArtifactSection = (
  references: readonly SearchConsumerActionFeaturesV0SourceArtifactReference[],
) => `
## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
${references
  .map((reference) => `| ${reference.label} | ${reference.relativePath} | ${reference.sha256} |`)
  .join("\n")}
`;

const buildActionFeatureSection = (result: SearchConsumerActionFeaturesV0Result) => {
  if (result.consumerReadinessStatus !== "action_feature_source_gap") {
    return `
## Action Feature Rows

- action feature row count: ${result.actionFeatures.length}
- action feature gap row count: ${result.actionFeatureGaps.length}
`;
  }

  return `
## Action Feature Rows

- consumer readiness status: \`action_feature_source_gap\`
- action-features.jsonl is empty: committed cFp69-cFp74 artifacts expose only
  aggregate per-root count maps (\`publicActionKindCounts\`, \`targetKindCounts\`,
  \`targetSideCounts\`, transition counts, budget aggregates), not durable
  per-public-action identities suitable for a \`publicActionRef\`.
- cFp76 does not fabricate action references. Instead it records one
  \`action-feature-gaps.jsonl\` row per affected source phase.

## Action Feature Gap Rows

| Source phase | Gap scope | Missing field category | Affected root count | Affected action feature count estimate |
|---|---|---|---:|---:|
${result.actionFeatureGaps
  .map(
    (gap) =>
      `| ${gap.sourcePhase} | ${gap.gapScope} | ${gap.missingFieldCategory} | ${gap.affectedRootCount} | ${
        gap.affectedActionFeatureCountEstimate ?? "n/a"
      } |`,
  )
  .join("\n")}

Recommended next step: ${result.actionFeatureGaps[0]?.recommendedNextStep ?? CFP77_RECOMMENDATION_GAP}
`;
};

const buildMarkdownReport = ({
  result,
  summary,
}: {
  result: SearchConsumerActionFeaturesV0Result;
  summary: SearchConsumerActionFeaturesV0Summary;
}) => `# Search Consumer Action Features v0

## Run

- suite id: ${summary.suiteId}
- feature run id: ${summary.featureRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- consumer readiness status: ${summary.consumerReadinessStatus}
${buildSourceConsistencySection(result.sourceConsistency)}
## Row Counts

| Row kind | Count |
|---|---:|
| root feature rows | ${summary.rootFeatureRowCount} |
| action feature rows | ${summary.actionFeatureRowCount} |
| action feature gap rows | ${summary.actionFeatureGapRowCount} |
| skipped root rows | ${summary.skippedRootRowCount} |
${buildActionFeatureSection(result)}
## Count Summaries

### By Phase

| Phase | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByPhase)}

### By Round

| Round | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByRound)}

### By Policy

| Policy | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByPolicy)}

### By Faction

| Faction | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByFaction)}

### By Deck Preset

| Deck preset | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByDeckPreset)}

### By Matchup

| Matchup | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByMatchup)}

### cFp74 Cap Status Counts

| Cap status | Count |
|---|---:|
${formatCountRows(result.countSummaries.cFp74CapStatusCounts)}

### cFp73 Primary Casebook Label Counts

| Label | Count |
|---|---:|
${formatCountRows(result.countSummaries.cFp73PrimaryCasebookLabelCounts)}

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| root-features.jsonl | ${summary.artifactByteSizes.rootFeaturesJsonlBytes} | below 90 MB hard stop |
| action-features.jsonl | ${summary.artifactByteSizes.actionFeaturesJsonlBytes} | below 50 MB robust target, below 90 MB hard stop |
| action-feature-gaps.jsonl | ${summary.artifactByteSizes.actionFeatureGapsJsonlBytes} | below 90 MB hard stop |
| skipped-roots.jsonl | ${summary.artifactByteSizes.skippedRootsJsonlBytes} | below 90 MB hard stop |

## Hidden-Info Safety

- scan status: ${summary.hiddenInfoScanStatus}
- hazards detected: ${summary.hiddenInfoScanHazards.length === 0 ? "none" : summary.hiddenInfoScanHazards.join(", ")}

${HIDDEN_INFO_SAFETY_NOTE}
${buildSourceArtifactSection(summary.sourceArtifactReferences)}
## Non-Claims

${summary.explicitNonClaims.map((claim) => `- ${claim}`).join("\n")}

## Recommendation

${summary.cFp77Recommendation}
`;

export const buildSearchConsumerActionFeaturesV0Summary = ({
  result,
  featureRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceArtifactReferences,
  artifactByteSizes,
  hiddenInfoScanHazards,
}: {
  result: SearchConsumerActionFeaturesV0Result;
  featureRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceArtifactReferences: readonly SearchConsumerActionFeaturesV0SourceArtifactReference[];
  artifactByteSizes: SearchConsumerActionFeaturesV0ArtifactByteSizes;
  hiddenInfoScanHazards: readonly string[];
}): SearchConsumerActionFeaturesV0Summary => ({
  schemaVersion: "search-consumer-action-features-v0-summary-v1",
  featureRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceArtifactReferences,
  consumerReadinessStatus: result.consumerReadinessStatus,
  rootFeatureRowCount: result.rootFeatures.length,
  actionFeatureRowCount: result.actionFeatures.length,
  actionFeatureGapRowCount: result.actionFeatureGaps.length,
  skippedRootRowCount: result.skippedRoots.length,
  sourceConsistency: result.sourceConsistency,
  countSummaries: result.countSummaries,
  artifactByteSizes,
  hiddenInfoScanStatus: hiddenInfoScanHazards.length === 0 ? "clean" : "hazards_detected",
  hiddenInfoScanHazards,
  explicitNonClaims: EXPLICIT_NON_CLAIMS,
  cFp77Recommendation:
    result.consumerReadinessStatus === "source_consistency_failed"
      ? CFP77_RECOMMENDATION_NOT_READY
      : CFP77_RECOMMENDATION_GAP,
});

export const serializeSearchConsumerActionFeaturesV0Artifacts = ({
  result,
  featureRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceRunIds,
  sourceArtifactReferences,
}: {
  result: SearchConsumerActionFeaturesV0Result;
  featureRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceRunIds: SearchConsumerActionFeaturesV0SourceRunIds;
  sourceArtifactReferences: readonly SearchConsumerActionFeaturesV0SourceArtifactReference[];
}): SerializedSearchConsumerActionFeaturesV0Artifacts => {
  const rootFeaturesJsonl = jsonlText(result.rootFeatures);
  const actionFeaturesJsonl = jsonlText(result.actionFeatures);
  const actionFeatureGapsJsonl = jsonlText(result.actionFeatureGaps);
  const skippedRootsJsonl = jsonlText(result.skippedRoots);

  const artifactByteSizes: SearchConsumerActionFeaturesV0ArtifactByteSizes = {
    rootFeaturesJsonlBytes: Buffer.byteLength(rootFeaturesJsonl, "utf8"),
    actionFeaturesJsonlBytes: Buffer.byteLength(actionFeaturesJsonl, "utf8"),
    actionFeatureGapsJsonlBytes: Buffer.byteLength(actionFeatureGapsJsonl, "utf8"),
    skippedRootsJsonlBytes: Buffer.byteLength(skippedRootsJsonl, "utf8"),
  };

  const preliminarySummary = buildSearchConsumerActionFeaturesV0Summary({
    result,
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceArtifactReferences,
    artifactByteSizes,
    hiddenInfoScanHazards: [],
  });

  const preliminaryReport = buildMarkdownReport({ result, summary: preliminarySummary });
  const hiddenInfoScanHazards = scanSearchConsumerActionFeaturesV0TextForHiddenInfo(
    [rootFeaturesJsonl, actionFeaturesJsonl, actionFeatureGapsJsonl, skippedRootsJsonl, preliminaryReport].join(
      "\n",
    ),
  );

  const summary = buildSearchConsumerActionFeaturesV0Summary({
    result,
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceArtifactReferences,
    artifactByteSizes,
    hiddenInfoScanHazards,
  });

  const summaryJson = stablePrettyJson(summary);
  const reportMarkdown = buildMarkdownReport({ result, summary });

  const artifactHashes = {
    "summary.json": sha256(summaryJson),
    "root-features.jsonl": sha256(rootFeaturesJsonl),
    "action-features.jsonl": sha256(actionFeaturesJsonl),
    "action-feature-gaps.jsonl": sha256(actionFeatureGapsJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  };

  const manifest: SearchConsumerActionFeaturesV0ArtifactManifest = {
    schemaVersion: "search-consumer-action-features-v0-artifact-v1",
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    relativeOutputPath: relativeOutputPath(suiteId),
    generatedAtTimestampPolicy: "deterministic-no-wall-clock",
    files: [...searchConsumerActionFeaturesV0ArtifactFiles],
    consumerReadinessStatus: result.consumerReadinessStatus,
    sourceCfp68RunId: sourceRunIds.cfp68,
    sourceCfp69RunId: sourceRunIds.cfp69,
    sourceCfp70RunId: sourceRunIds.cfp70,
    sourceCfp71RunId: sourceRunIds.cfp71,
    sourceCfp72RunId: sourceRunIds.cfp72,
    sourceCfp73RunId: sourceRunIds.cfp73,
    sourceCfp74RunId: sourceRunIds.cfp74,
    sourceArtifactReferences,
    rootFeatureSchemaVersion: "search-consumer-action-features-v0-root-feature-v1",
    actionFeatureSchemaVersion: "search-consumer-action-features-v0-action-feature-v1",
    actionFeatureGapSchemaVersion: "search-consumer-action-features-v0-action-feature-gap-v1",
    skippedRootSchemaVersion: "search-consumer-action-features-v0-skipped-root-v1",
    summarySchemaVersion: "search-consumer-action-features-v0-summary-v1",
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
    explicitNonClaims: EXPLICIT_NON_CLAIMS,
    cFp77Recommendation: summary.cFp77Recommendation,
    artifactHashes,
  };

  return {
    manifestJson: stablePrettyJson(manifest),
    summaryJson,
    rootFeaturesJsonl,
    actionFeaturesJsonl,
    actionFeatureGapsJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writeSearchConsumerActionFeaturesV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  outDir: string;
  artifacts: SerializedSearchConsumerActionFeaturesV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(resolve(outDir, "root-features.jsonl"), artifacts.rootFeaturesJsonl, "utf8"),
    writeFile(resolve(outDir, "action-features.jsonl"), artifacts.actionFeaturesJsonl, "utf8"),
    writeFile(
      resolve(outDir, "action-feature-gaps.jsonl"),
      artifacts.actionFeatureGapsJsonl,
      "utf8",
    ),
    writeFile(resolve(outDir, "skipped-roots.jsonl"), artifacts.skippedRootsJsonl, "utf8"),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...searchConsumerActionFeaturesV0ArtifactFiles],
  };
};

export const combinedSearchConsumerActionFeaturesV0ArtifactText = (
  artifacts: SerializedSearchConsumerActionFeaturesV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.rootFeaturesJsonl,
    artifacts.actionFeaturesJsonl,
    artifacts.actionFeatureGapsJsonl,
    artifacts.skippedRootsJsonl,
    artifacts.reportMarkdown,
  ].join("\n");

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const catalogIdentityHazards = () => {
  const names = new Set<string>();
  currentCatalogCards.forEach((card) => {
    if (card.name.trim().length >= 3) names.add(card.name.trim());
    names.add(card.sourceId);
  });
  currentCatalogLeaders.forEach((leader) => {
    if (leader.name.trim().length >= 3) names.add(leader.name.trim());
    names.add(leader.sourceId);
  });
  return [...names]
    .sort((left, right) => left.localeCompare(right))
    .map((identity) => ({
      label: `catalog identity:${identity}`,
      pattern: new RegExp(escapeRegExp(identity)),
    }));
};

const hiddenInfoHazards: readonly { label: string; pattern: RegExp }[] = [
  { label: "cardsById", pattern: /\bcardsById\b/ },
  { label: "finalState", pattern: /\bfinalState\b/ },
  { label: "commandLog", pattern: /\bcommandLog\b/ },
  { label: "eventLog", pattern: /\beventLog\b/ },
  { label: "ownHand", pattern: /\bownHand\b/ },
  { label: "opponentHand", pattern: /\bopponentHand\b/ },
  { label: "unsafeDebugResults", pattern: /\bunsafeDebugResults\b/ },
  { label: "decisionTrace", pattern: /\bdecisionTrace\b/ },
  { label: "moveId", pattern: /\bmoveId\b/ },
  { label: "sourceCardId", pattern: /\bsourceCardId\b/ },
  { label: "sourceId", pattern: /\bsourceId\b/ },
  { label: "cardId", pattern: /\bcardId\b/ },
  { label: "actionRef", pattern: /\bactionRef\b/ },
  { label: "rawMove", pattern: /\brawMove\b/ },
  { label: "rawLabel", pattern: /\brawLabel\b/ },
  { label: "deckOrder", pattern: /\bdeckOrder\b/ },
  { label: "sampledHand", pattern: /\bsampledHand\b/ },
  { label: "sampledDeck", pattern: /\bsampledDeck\b/ },
  { label: "sampledWorld", pattern: /\bsampledWorld\b/ },
  { label: "hiddenHand", pattern: /\bhiddenHand\b/ },
  { label: "hiddenDeck", pattern: /\bhiddenDeck\b/ },
  { label: "handSourceCounts", pattern: /\bhandSourceCounts\b/ },
  { label: "deckSourceCounts", pattern: /\bdeckSourceCounts\b/ },
  { label: "bestAction", pattern: /\bbestAction\b/ },
  { label: "selectedAction", pattern: /\bselectedAction\b/ },
  { label: "actionValue", pattern: /\bactionValue\b/ },
  { label: "expectedValue", pattern: /\bexpectedValue\b/ },
  { label: "valueEstimate", pattern: /\bvalueEstimate\b/ },
  { label: "rewardTarget", pattern: /\brewardTarget\b/ },
  { label: "payoffTable", pattern: /\bpayoffTable\b/ },
  { label: "payoffMatrix", pattern: /\bpayoffMatrix\b/ },
  { label: "rolloutReward", pattern: /\brolloutReward\b/ },
  { label: "winProbability", pattern: /\bwinProbability\b/ },
  { label: "principalVariation", pattern: /\bprincipalVariation\b/ },
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
];

export const scanSearchConsumerActionFeaturesV0TextForHiddenInfo = (combined: string) =>
  [...hiddenInfoHazards, ...catalogIdentityHazards()]
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);

export const scanSearchConsumerActionFeaturesV0ArtifactsForHiddenInfo = (
  artifacts: SerializedSearchConsumerActionFeaturesV0Artifacts,
) =>
  scanSearchConsumerActionFeaturesV0TextForHiddenInfo(
    combinedSearchConsumerActionFeaturesV0ArtifactText(artifacts),
  );

export const searchConsumerActionFeaturesV0ArtifactHashes = (
  artifacts: SerializedSearchConsumerActionFeaturesV0Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "root-features.jsonl": sha256(artifacts.rootFeaturesJsonl),
  "action-features.jsonl": sha256(artifacts.actionFeaturesJsonl),
  "action-feature-gaps.jsonl": sha256(artifacts.actionFeatureGapsJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
