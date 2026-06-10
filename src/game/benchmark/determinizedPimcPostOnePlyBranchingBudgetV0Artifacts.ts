import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus,
  DeterminizedPimcPostOnePlyBranchingBudgetV0Result,
  DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord,
  DeterminizedPimcPostOnePlyBranchingBudgetV0RootSchemaVersion,
  DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootSchemaVersion,
  DeterminizedPimcPostOnePlyBranchingBudgetV0SummarySchemaVersion,
} from "./determinizedPimcPostOnePlyBranchingBudgetV0";

export type DeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactSchemaVersion =
  "determinized-pimc-post-one-ply-branching-budget-v0-artifact-v1";

export interface DeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactManifest {
  schemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactSchemaVersion;
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  probeReadinessStatus: DeterminizedPimcPostOnePlyBranchingBudgetV0ReadinessStatus;
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  sourceCfp71OutcomeRunId: string;
  totalCfp68RootCount: number;
  eligibleRootCount: number;
  branchingRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  rootSchemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetV0RootSchemaVersion;
  skippedRootSchemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootSchemaVersion;
  summarySchemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetV0SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp73Recommendation: string;
  artifactHashes: Record<
    | "summary.json"
    | "branching-roots.jsonl"
    | "skipped-roots.jsonl"
    | "report.md",
    string
  >;
}

export interface SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  branchingRootsJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const determinizedPimcPostOnePlyBranchingBudgetV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "branching-roots.jsonl",
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
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
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

const stablePrettyJson = (value: unknown) =>
  `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;

const stableJsonLine = (value: unknown) => JSON.stringify(sortJsonValue(value));

const compactBranchingRootForJsonl = (
  root: DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord,
) => {
  const redundantRootKeys = new Set<keyof typeof root>([
    "probeMode",
    "probeRunId",
    "probeVariant",
    "schemaVersion",
    "sourceCfp68ContractRunId",
    "sourceCfp69ProbeRunId",
    "sourceCfp70AvailabilityRunId",
    "sourceCfp71OutcomeRunId",
    "suiteId",
  ]);
  return Object.fromEntries(
    Object.entries(root).filter(
      ([key]) => !redundantRootKeys.has(key as keyof typeof root),
    ),
  );
};

const sha256 = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

const formatPercent = (value: number) => `${value.toFixed(3)}%`;

const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));

const formatCountRows = (record: Record<string, number>) => {
  const rows = sortedEntries(record);
  if (rows.length === 0) return "| none | 0 |";
  return rows.map(([key, count]) => `| ${key} | ${count} |`).join("\n");
};

const formatNestedCountRows = (
  record: Record<string, Record<string, number>>,
) => {
  const rows = sortedEntries(record).flatMap(([outer, inner]) =>
    sortedEntries(inner).map(
      ([innerKey, count]) => `| ${outer} | ${innerKey} | ${count} |`,
    ),
  );
  if (rows.length === 0) return "| none | none | 0 |";
  return rows.join("\n");
};

const formatDistributionRows = (
  record: Record<string, { count: number; percentageOfSkippedRoots: number }>,
) => {
  const rows = sortedEntries(record);
  if (rows.length === 0) return "| none | 0 | 0.000% |";
  return rows
    .map(
      ([key, value]) =>
        `| ${key} | ${value.count} | ${formatPercent(value.percentageOfSkippedRoots)} |`,
    )
    .join("\n");
};

const formatStats = (stats: {
  count: number;
  min: number;
  max: number;
  average: number;
  p50: number;
  p90: number;
  p95: number;
}) =>
  `count ${stats.count}; min ${stats.min}; max ${stats.max}; avg ${stats.average}; p50 ${stats.p50}; p90 ${stats.p90}; p95 ${stats.p95}`;

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/determinized-pimc-post-one-ply-branching-budget-v0/cFp72`;

const buildDeterminizedPimcPostOnePlyBranchingBudgetV0MarkdownReport = (
  result: DeterminizedPimcPostOnePlyBranchingBudgetV0Result,
) => {
  const { summary } = result;
  return `# Determinized PIMC Post-One-Ply Branching Budget v0

## Run

- suite id: ${summary.suiteId}
- probe run id: ${summary.probeRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- probe variant: ${summary.probeVariant}
- probe mode: ${summary.probeMode}
- probe readiness status: ${summary.probeReadinessStatus}
- source cFp68 contract run id: ${summary.sourceCfp68ContractRunId}
- source cFp69 probe run id: ${summary.sourceCfp69ProbeRunId}
- source cFp70 availability run id: ${summary.sourceCfp70AvailabilityRunId}
- source cFp71 outcome run id: ${summary.sourceCfp71OutcomeRunId}
- total cFp68 roots: ${summary.totalCfp68RootCount}
- eligible valid roots: ${summary.eligibleRootCount}
- branching roots: ${summary.branchingRootCount}
- skipped invalid roots: ${summary.skippedRootCount}
- skipped-root percentage: ${formatPercent(summary.skippedRootPercentage)}
- matches: ${summary.matchCount}

## Source Artifact Inputs

### cFp68

| Input | SHA-256 |
|---|---|
${summary.sourceCfp68ArtifactReferences
  .map((reference) => `| ${reference.relativePath} | ${reference.sha256} |`)
  .join("\n")}

### cFp69

| Input | SHA-256 |
|---|---|
${summary.sourceCfp69ArtifactReferences
  .map((reference) => `| ${reference.relativePath} | ${reference.sha256} |`)
  .join("\n")}

### cFp70

| Input | SHA-256 |
|---|---|
${summary.sourceCfp70ArtifactReferences
  .map((reference) => `| ${reference.relativePath} | ${reference.sha256} |`)
  .join("\n")}

### cFp71

| Input | SHA-256 |
|---|---|
${summary.sourceCfp71ArtifactReferences
  .map((reference) => `| ${reference.relativePath} | ${reference.sha256} |`)
  .join("\n")}

## Source Consistency

| Check | Count |
|---|---:|
| cFp68 contract not probe-ready | ${summary.sourceConsistency.cFp68ContractNotProbeReady} |
| cFp68 total roots | ${summary.sourceConsistency.cFp68TotalRootCount} |
| cFp68 eligible roots read | ${summary.sourceConsistency.cFp68EligibleRootsRead} |
| cFp68 skipped roots read | ${summary.sourceConsistency.cFp68SkippedRootsRead} |
| cFp69 probe roots read | ${summary.sourceConsistency.cFp69ProbeRootsRead} |
| cFp69 skipped roots read | ${summary.sourceConsistency.cFp69SkippedRootsRead} |
| cFp70 availability roots read | ${summary.sourceConsistency.cFp70AvailabilityRootsRead} |
| cFp70 skipped roots read | ${summary.sourceConsistency.cFp70SkippedRootsRead} |
| cFp71 outcome roots read | ${summary.sourceConsistency.cFp71OutcomeRootsRead} |
| cFp71 skipped roots read | ${summary.sourceConsistency.cFp71SkippedRootsRead} |
| benchmark observed roots read | ${summary.sourceConsistency.benchmarkObservedRootsRead} |
| eligible roots not observed | ${summary.sourceConsistency.eligibleRootsNotObserved} |
| observed roots outside cFp68/cFp69/cFp70/cFp71 contract | ${summary.sourceConsistency.observedRootsNotInCfp68Cfp69Cfp70Cfp71Contract} |
| skipped roots incorrectly probed | ${summary.sourceConsistency.skippedRootsIncorrectlyProbed} |
| duplicate observed root keys | ${summary.sourceConsistency.duplicateObservedRootKeys} |
| duplicate cFp68 eligible root keys | ${summary.sourceConsistency.duplicateCfp68EligibleRootKeys} |
| duplicate cFp69 probe root keys | ${summary.sourceConsistency.duplicateCfp69ProbeRootKeys} |
| duplicate cFp70 availability root keys | ${summary.sourceConsistency.duplicateCfp70AvailabilityRootKeys} |
| duplicate cFp71 outcome root keys | ${summary.sourceConsistency.duplicateCfp71OutcomeRootKeys} |
| duplicate skipped root keys | ${summary.sourceConsistency.duplicateSkippedRootKeys} |
| cFp68/cFp69 eligible root count delta | ${summary.sourceConsistency.cfp68Cfp69EligibleRootCountDelta} |
| cFp68/cFp70 availability root count delta | ${summary.sourceConsistency.cfp68Cfp70AvailabilityRootCountDelta} |
| cFp68/cFp71 outcome root count delta | ${summary.sourceConsistency.cfp68Cfp71OutcomeRootCountDelta} |
| cFp69/cFp70 availability root count delta | ${summary.sourceConsistency.cfp69Cfp70AvailabilityRootCountDelta} |
| cFp69/cFp71 outcome root count delta | ${summary.sourceConsistency.cfp69Cfp71OutcomeRootCountDelta} |
| cFp70/cFp71 outcome root count delta | ${summary.sourceConsistency.cfp70Cfp71OutcomeRootCountDelta} |
| cFp68/cFp69 skipped root count delta | ${summary.sourceConsistency.cfp68Cfp69SkippedRootCountDelta} |
| cFp68/cFp70 skipped root count delta | ${summary.sourceConsistency.cfp68Cfp70SkippedRootCountDelta} |
| cFp68/cFp71 skipped root count delta | ${summary.sourceConsistency.cfp68Cfp71SkippedRootCountDelta} |
| cFp69/cFp70 skipped root count delta | ${summary.sourceConsistency.cfp69Cfp70SkippedRootCountDelta} |
| cFp69/cFp71 skipped root count delta | ${summary.sourceConsistency.cfp69Cfp71SkippedRootCountDelta} |
| cFp70/cFp71 skipped root count delta | ${summary.sourceConsistency.cfp70Cfp71SkippedRootCountDelta} |
| cFp69 probe roots missing cFp68 eligible root | ${summary.sourceConsistency.cfp69ProbeRootsMissingCfp68EligibleRoot} |
| cFp70 availability roots missing cFp68 eligible root | ${summary.sourceConsistency.cfp70AvailabilityRootsMissingCfp68EligibleRoot} |
| cFp71 outcome roots missing cFp68 eligible root | ${summary.sourceConsistency.cfp71OutcomeRootsMissingCfp68EligibleRoot} |
| cFp69 skipped roots missing cFp68 skipped root | ${summary.sourceConsistency.cfp69SkippedRootsMissingCfp68SkippedRoot} |
| cFp70 skipped roots missing cFp68 skipped root | ${summary.sourceConsistency.cfp70SkippedRootsMissingCfp68SkippedRoot} |
| cFp71 skipped roots missing cFp68 skipped root | ${summary.sourceConsistency.cfp71SkippedRootsMissingCfp68SkippedRoot} |
| cFp68/cFp69 sample-count mismatch roots | ${summary.sourceConsistency.cfp68Cfp69SampleCountMismatchRoots} |
| cFp68/cFp70 sample-count mismatch roots | ${summary.sourceConsistency.cfp68Cfp70SampleCountMismatchRoots} |
| cFp68/cFp71 sample-count mismatch roots | ${summary.sourceConsistency.cfp68Cfp71SampleCountMismatchRoots} |
| cFp69/cFp70/cFp71 public-action count mismatch roots | ${summary.sourceConsistency.cfp69Cfp70Cfp71PublicActionCountMismatchRoots} |
| cFp70 roots with availability disagreement | ${summary.sourceConsistency.cfp70RootsWithAvailabilityDisagreement} |
| cFp71 roots with failed/deferred pairs | ${summary.sourceConsistency.cfp71RootsWithFailedOrDeferredPairs} |
| cFp71 roots with outcome divergence | ${summary.sourceConsistency.cfp71RootsWithOutcomeDivergence} |
| cFp68 fingerprint mismatch observed roots | ${summary.sourceConsistency.cfp68FingerprintMismatchObservedRoots} |

## Sample Budget

| Metric | Count |
|---|---:|
| branching roots | ${summary.sampleBudget.branchingRootCount} |
| total requested samples | ${summary.sampleBudget.totalRequestedSampleCount} |
| total generated samples | ${summary.sampleBudget.totalGeneratedSampleCount} |
| total checked samples | ${summary.sampleBudget.totalCheckedSampleCount} |
| total failed samples | ${summary.sampleBudget.totalFailedSampleCount} |

### Requested Samples Per Branching Root

| Requested samples | Roots |
|---|---:|
${formatCountRows(summary.sampleBudget.requestedSamplesPerRootDistribution)}

## Branching Status

| Probe status | Roots |
|---|---:|
${formatCountRows(summary.branchingStatus.probeStatusCounts)}

### Pair Status

| Pair status | Pairs |
|---|---:|
${formatCountRows(summary.branchingStatus.branchingStatusCounts)}

| Metric | Count |
|---|---:|
| first-ply public action/sample pair total | ${summary.branchingStatus.firstPlyPublicActionSamplePairTotal} |
| completed branching pairs | ${summary.branchingStatus.completedBranchingPairCount} |
| failed or deferred branching pairs | ${summary.branchingStatus.failedOrDeferredBranchingPairCount} |
| sample-action-missing pairs | ${summary.branchingStatus.sampleActionMissingPairCount} |
| conversion failure pairs | ${summary.branchingStatus.moveCommandConversionFailedPairCount} |
| engine rejection pairs | ${summary.branchingStatus.engineCommandRejectedPairCount} |
| engine exception pairs | ${summary.branchingStatus.engineCommandExceptionPairCount} |
| actor-resolution failure pairs | ${summary.branchingStatus.actorResolutionFailedPairCount} |
| legal-move generation failure pairs | ${summary.branchingStatus.legalMoveGenerationFailedPairCount} |
| public-action abstraction failure pairs | ${summary.branchingStatus.publicActionAbstractionFailedPairCount} |
| deferred one-ply pairs | ${summary.branchingStatus.onePlyExecutionDeferredPairCount} |
| roots with any failed/deferred pair | ${summary.branchingStatus.rootsWithAnyFailedOrDeferredPair} |

### Post-One-Ply Actors

| Actor | Pairs |
|---|---:|
${formatCountRows(summary.branchingStatus.postOnePlyActorCounts)}

### Post-One-Ply Phases

| Phase | Pairs |
|---|---:|
${formatCountRows(summary.branchingStatus.postOnePlyPhaseCounts)}

### Branching Budget Buckets

| Bucket | Roots |
|---|---:|
${formatCountRows(summary.branchingStatus.branchingBudgetBucketCounts)}

### Branching Risk Buckets

| Bucket | Roots |
|---|---:|
${formatCountRows(summary.branchingStatus.branchingRiskBucketCounts)}

## Branching Aggregates

- root public action count stats: ${formatStats(summary.branchingAggregates.rootPublicActionCountStats)}
- first-ply public action/sample pair count stats: ${formatStats(summary.branchingAggregates.firstPlyPublicActionSamplePairCountStats)}
- completed branching pair count stats: ${formatStats(summary.branchingAggregates.completedBranchingPairCountStats)}
- failed/deferred branching pair count stats: ${formatStats(summary.branchingAggregates.failedOrDeferredBranchingPairCountStats)}
- next legal move count stats: ${formatStats(summary.branchingAggregates.nextLegalMoveCountStats)}
- next public action count stats: ${formatStats(summary.branchingAggregates.nextPublicActionCountStats)}
- next public action collision count stats: ${formatStats(summary.branchingAggregates.nextPublicActionCollisionCountStats)}
- largest next public action bucket size stats: ${formatStats(summary.branchingAggregates.largestNextPublicActionBucketSizeStats)}
- next public action target expansion count stats: ${formatStats(summary.branchingAggregates.nextPublicActionTargetExpansionCountStats)}
- post-one-ply public action budget total: ${summary.branchingAggregates.postOnePlyPublicActionBudgetTotal}
- post-one-ply public action budget average: ${summary.branchingAggregates.postOnePlyPublicActionBudgetAverage}

### Pair Status By First-Ply Public Action Kind

| First-ply public action kind | Pair status | Pairs |
|---|---|---:|
${formatNestedCountRows(
  summary.branchingAggregates
    .aggregateBranchingStatusCountsByFirstPlyPublicActionKind,
)}

### Post-One-Ply Actor By First-Ply Public Action Kind

| First-ply public action kind | Actor | Pairs |
|---|---|---:|
${formatNestedCountRows(
  summary.branchingAggregates.aggregateActorCountsByFirstPlyPublicActionKind,
)}

### Budget Bucket By First-Ply Public Action Kind

| First-ply public action kind | Bucket | Pairs |
|---|---|---:|
${formatNestedCountRows(
  summary.branchingAggregates
    .aggregateBudgetBucketCountsByFirstPlyPublicActionKind,
)}

## Skip Counters

### Suite

| Suite | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.bySuite)}

### Phase

| Phase | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.byPhase)}

### Round

| Round | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.byRound)}

### Matchup

| Matchup | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.byMatchup)}

### Policy

| Policy | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.byPolicy)}

### Faction

| Faction | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.byFaction)}

### Deck Preset

| Deck preset | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.byDeckPreset)}

### Provenance Label

| Provenance label | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.byProvenanceLabel)}

### Invalid Reason

| Invalid reason | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.byInvalidReason)}

### Skip Reason

| Skip reason | Count | Share of skipped roots |
|---|---:|---:|
${formatDistributionRows(summary.skipCounterPercentages.bySkipReason)}

## Hidden-Info Safety

${summary.hiddenInfoSafetyNote}

## Explicit Non-Claims

${summary.explicitNonClaims.map((claim) => `- ${claim}`).join("\n")}

## Recommendation For cFp73

${summary.cFp73Recommendation}
`;
};

const buildManifest = (
  result: DeterminizedPimcPostOnePlyBranchingBudgetV0Result,
  summaryJson: string,
  branchingRootsJsonl: string,
  skippedRootsJsonl: string,
  reportMarkdown: string,
): DeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactManifest => ({
  schemaVersion: "determinized-pimc-post-one-ply-branching-budget-v0-artifact-v1",
  probeRunId: result.probeRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  relativeOutputPath: relativeOutputPath(result.suiteId),
  generatedAtTimestampPolicy:
    "omitted from committed artifacts so cFp72 hashes remain deterministic",
  files: [...determinizedPimcPostOnePlyBranchingBudgetV0ArtifactFiles],
  probeReadinessStatus: result.summary.probeReadinessStatus,
  sourceCfp68ContractRunId: result.summary.sourceCfp68ContractRunId,
  sourceCfp69ProbeRunId: result.summary.sourceCfp69ProbeRunId,
  sourceCfp70AvailabilityRunId: result.summary.sourceCfp70AvailabilityRunId,
  sourceCfp71OutcomeRunId: result.summary.sourceCfp71OutcomeRunId,
  totalCfp68RootCount: result.summary.totalCfp68RootCount,
  eligibleRootCount: result.summary.eligibleRootCount,
  branchingRootCount: result.summary.branchingRootCount,
  skippedRootCount: result.summary.skippedRootCount,
  skippedRootPercentage: result.summary.skippedRootPercentage,
  rootSchemaVersion:
    "determinized-pimc-post-one-ply-branching-budget-v0-root-v1",
  skippedRootSchemaVersion:
    "determinized-pimc-post-one-ply-branching-budget-v0-skipped-root-v1",
  summarySchemaVersion:
    "determinized-pimc-post-one-ply-branching-budget-v0-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonClaims: result.summary.explicitNonClaims,
  cFp73Recommendation: result.summary.cFp73Recommendation,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "branching-roots.jsonl": sha256(branchingRootsJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts = (
  result: DeterminizedPimcPostOnePlyBranchingBudgetV0Result,
): SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const branchingRootsJsonl =
    result.branchingRoots.length === 0
      ? ""
      : `${result.branchingRoots
          .map((root) => stableJsonLine(compactBranchingRootForJsonl(root)))
          .join("\n")}\n`;
  const skippedRootsJsonl =
    result.skippedRoots.length === 0
      ? ""
      : `${result.skippedRoots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown =
    buildDeterminizedPimcPostOnePlyBranchingBudgetV0MarkdownReport(result);
  const manifestJson = stablePrettyJson(
    buildManifest(
      result,
      summaryJson,
      branchingRootsJsonl,
      skippedRootsJsonl,
      reportMarkdown,
    ),
  );

  return {
    manifestJson,
    summaryJson,
    branchingRootsJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(
      resolve(outDir, "branching-roots.jsonl"),
      artifacts.branchingRootsJsonl,
      "utf8",
    ),
    writeFile(
      resolve(outDir, "skipped-roots.jsonl"),
      artifacts.skippedRootsJsonl,
      "utf8",
    ),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...determinizedPimcPostOnePlyBranchingBudgetV0ArtifactFiles],
  };
};

export const combinedDeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactText = (
  artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.branchingRootsJsonl,
    artifacts.skippedRootsJsonl,
    artifacts.reportMarkdown,
  ].join("\n");

const hiddenInfoHazards: readonly { label: string; pattern: RegExp }[] = [
  { label: "cardsById", pattern: /\bcardsById\b/ },
  { label: "finalState", pattern: /\bfinalState\b/ },
  { label: "commandLog", pattern: /\bcommandLog\b/ },
  { label: "eventLog", pattern: /\beventLog\b/ },
  { label: "ownHand", pattern: /\bownHand\b/ },
  { label: "opponentHand", pattern: /\bopponentHand\b/ },
  { label: "handSourceCounts", pattern: /\bhandSourceCounts\b/ },
  { label: "deckSourceCounts", pattern: /\bdeckSourceCounts\b/ },
  { label: "sampledHand", pattern: /\bsampledHand\b/ },
  { label: "sampledDeck", pattern: /\bsampledDeck\b/ },
  { label: "sampledWorld", pattern: /\bsampledWorld\b/ },
  { label: "sampledWorld snake", pattern: /\bsampled_world\b/ },
  { label: "hiddenHand", pattern: /\bhiddenHand\b/ },
  { label: "hiddenDeck", pattern: /\bhiddenDeck\b/ },
  { label: "sourceId", pattern: /\bsourceId\b/ },
  { label: "sourceCardId", pattern: /\bsourceCardId\b/ },
  { label: "cardId", pattern: /\bcardId\b/ },
  { label: "moveId", pattern: /\bmoveId\b/ },
  { label: "actionRef", pattern: /\bactionRef\b/ },
  { label: "rawMove", pattern: /\brawMove\b/ },
  { label: "rawLabel", pattern: /\brawLabel\b/ },
  { label: "rawSourceMap", pattern: /\brawSourceMap\b/ },
  { label: "sourceMap", pattern: /\bsourceMap\b/ },
  { label: "bestAction", pattern: /\bbestAction\b/ },
  { label: "selectedAction", pattern: /\bselectedAction\b/ },
  { label: "actionValue", pattern: /\bactionValue\b/ },
  { label: "expectedValue", pattern: /\bexpectedValue\b/ },
  { label: "valueEstimate", pattern: /\bvalueEstimate\b/ },
  { label: "rewardTarget", pattern: /\brewardTarget\b/ },
  { label: "payoff", pattern: /\bpayoff\b/ },
  { label: "rolloutReward", pattern: /\brolloutReward\b/ },
  { label: "winProbability", pattern: /\bwinProbability\b/ },
  { label: "principalVariation", pattern: /\bprincipalVariation\b/ },
  { label: "scoreQuality", pattern: /\bscoreQuality\b/ },
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
  { label: "raw lower command token", pattern: /\bcommand\b/ },
  { label: "raw lower event token", pattern: /\bevent\b/ },
  { label: "raw plural commands token", pattern: /\bcommands\b/ },
  { label: "raw plural events token", pattern: /\bevents\b/ },
];

export const scanDeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactsForHiddenInfo = (
  artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts,
) => {
  const combined =
    combinedDeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const determinizedPimcPostOnePlyBranchingBudgetV0ArtifactHashes = (
  artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "branching-roots.jsonl": sha256(artifacts.branchingRootsJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
