import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  DeterminizedPimcOnePlyOutcomeSkeletonV0ReadinessStatus,
  DeterminizedPimcOnePlyOutcomeSkeletonV0Result,
  DeterminizedPimcOnePlyOutcomeSkeletonV0RootSchemaVersion,
  DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootSchemaVersion,
  DeterminizedPimcOnePlyOutcomeSkeletonV0SummarySchemaVersion,
} from "./determinizedPimcOnePlyOutcomeSkeletonV0";

export type DeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactSchemaVersion =
  "determinized-pimc-one-ply-outcome-skeleton-v0-artifact-v1";

export interface DeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactManifest {
  schemaVersion: DeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactSchemaVersion;
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  probeReadinessStatus: DeterminizedPimcOnePlyOutcomeSkeletonV0ReadinessStatus;
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  sourceCfp70AvailabilityRunId: string;
  totalCfp68RootCount: number;
  eligibleRootCount: number;
  outcomeRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  rootSchemaVersion: DeterminizedPimcOnePlyOutcomeSkeletonV0RootSchemaVersion;
  skippedRootSchemaVersion: DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootSchemaVersion;
  summarySchemaVersion: DeterminizedPimcOnePlyOutcomeSkeletonV0SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp72Recommendation: string;
  artifactHashes: Record<
    "summary.json" | "outcome-roots.jsonl" | "skipped-roots.jsonl" | "report.md",
    string
  >;
}

export interface SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  outcomeRootsJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const determinizedPimcOnePlyOutcomeSkeletonV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "outcome-roots.jsonl",
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
    sortedEntries(inner).map(([innerKey, count]) => `| ${outer} | ${innerKey} | ${count} |`),
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

const formatStats = (
  stats: {
    count: number;
    min: number;
    max: number;
    average: number;
    p50: number;
    p90: number;
    p95: number;
  },
) =>
  `count ${stats.count}; min ${stats.min}; max ${stats.max}; avg ${stats.average}; p50 ${stats.p50}; p90 ${stats.p90}; p95 ${stats.p95}`;

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71`;

const buildDeterminizedPimcOnePlyOutcomeSkeletonV0MarkdownReport = (
  result: DeterminizedPimcOnePlyOutcomeSkeletonV0Result,
) => {
  const { summary } = result;
  return `# Determinized PIMC One-Ply Outcome Skeleton v0

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
- total cFp68 roots: ${summary.totalCfp68RootCount}
- eligible valid roots: ${summary.eligibleRootCount}
- outcome roots: ${summary.outcomeRootCount}
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
| benchmark observed roots read | ${summary.sourceConsistency.benchmarkObservedRootsRead} |
| eligible roots not observed | ${summary.sourceConsistency.eligibleRootsNotObserved} |
| observed roots outside cFp68/cFp69/cFp70 contract | ${summary.sourceConsistency.observedRootsNotInCfp68Cfp69Cfp70Contract} |
| skipped roots incorrectly probed | ${summary.sourceConsistency.skippedRootsIncorrectlyProbed} |
| duplicate observed root keys | ${summary.sourceConsistency.duplicateObservedRootKeys} |
| duplicate cFp68 eligible root keys | ${summary.sourceConsistency.duplicateCfp68EligibleRootKeys} |
| duplicate cFp69 probe root keys | ${summary.sourceConsistency.duplicateCfp69ProbeRootKeys} |
| duplicate cFp70 availability root keys | ${summary.sourceConsistency.duplicateCfp70AvailabilityRootKeys} |
| duplicate skipped root keys | ${summary.sourceConsistency.duplicateSkippedRootKeys} |
| cFp68/cFp69 eligible root count delta | ${summary.sourceConsistency.cfp68Cfp69EligibleRootCountDelta} |
| cFp68/cFp70 availability root count delta | ${summary.sourceConsistency.cfp68Cfp70AvailabilityRootCountDelta} |
| cFp69/cFp70 availability root count delta | ${summary.sourceConsistency.cfp69Cfp70AvailabilityRootCountDelta} |
| cFp68/cFp69 skipped root count delta | ${summary.sourceConsistency.cfp68Cfp69SkippedRootCountDelta} |
| cFp68/cFp70 skipped root count delta | ${summary.sourceConsistency.cfp68Cfp70SkippedRootCountDelta} |
| cFp69/cFp70 skipped root count delta | ${summary.sourceConsistency.cfp69Cfp70SkippedRootCountDelta} |
| cFp69 probe roots missing cFp68 eligible root | ${summary.sourceConsistency.cfp69ProbeRootsMissingCfp68EligibleRoot} |
| cFp70 availability roots missing cFp68 eligible root | ${summary.sourceConsistency.cfp70AvailabilityRootsMissingCfp68EligibleRoot} |
| cFp69 skipped roots missing cFp68 skipped root | ${summary.sourceConsistency.cfp69SkippedRootsMissingCfp68SkippedRoot} |
| cFp70 skipped roots missing cFp68 skipped root | ${summary.sourceConsistency.cfp70SkippedRootsMissingCfp68SkippedRoot} |
| cFp68/cFp69 sample-count mismatch roots | ${summary.sourceConsistency.cfp68Cfp69SampleCountMismatchRoots} |
| cFp68/cFp70 sample-count mismatch roots | ${summary.sourceConsistency.cfp68Cfp70SampleCountMismatchRoots} |
| cFp69/cFp70 public-action count mismatch roots | ${summary.sourceConsistency.cfp69Cfp70PublicActionCountMismatchRoots} |
| cFp70 roots with availability disagreement | ${summary.sourceConsistency.cfp70RootsWithAvailabilityDisagreement} |
| cFp68 fingerprint mismatch observed roots | ${summary.sourceConsistency.cfp68FingerprintMismatchObservedRoots} |

## Sample Budget

| Metric | Count |
|---|---:|
| outcome roots | ${summary.sampleBudget.outcomeRootCount} |
| total requested samples | ${summary.sampleBudget.totalRequestedSampleCount} |
| total generated samples | ${summary.sampleBudget.totalGeneratedSampleCount} |
| total checked samples | ${summary.sampleBudget.totalCheckedSampleCount} |
| total failed samples | ${summary.sampleBudget.totalFailedSampleCount} |

### Requested Samples Per Outcome Root

| Requested samples | Roots |
|---|---:|
${formatCountRows(summary.sampleBudget.requestedSamplesPerRootDistribution)}

## One-Ply Outcome Status

| Probe status | Roots |
|---|---:|
${formatCountRows(summary.outcomeStatus.probeStatusCounts)}

### Pair Status

| Pair status | Pairs |
|---|---:|
${formatCountRows(summary.outcomeStatus.executionStatusCounts)}

### Public Outcome Kinds

| Kind | Pairs |
|---|---:|
${formatCountRows(summary.outcomeStatus.publicOutcomeKindCounts)}

### Transition Kinds

| Kind | Pairs |
|---|---:|
${formatCountRows(summary.outcomeStatus.transitionKindCounts)}

| Metric | Count |
|---|---:|
| public action/sample pair total | ${summary.outcomeStatus.publicActionSamplePairTotal} |
| completed pairs | ${summary.outcomeStatus.completedPairCount} |
| failed or deferred pairs | ${summary.outcomeStatus.failedOrDeferredPairCount} |
| sample-action-missing pairs | ${summary.outcomeStatus.sampleActionMissingPairCount} |
| conversion failure pairs | ${summary.outcomeStatus.moveCommandConversionFailedPairCount} |
| engine rejection pairs | ${summary.outcomeStatus.engineCommandRejectedPairCount} |
| engine exception pairs | ${summary.outcomeStatus.engineCommandExceptionPairCount} |
| classification failure pairs | ${summary.outcomeStatus.outcomeClassificationFailedPairCount} |
| deferred one-ply pairs | ${summary.outcomeStatus.onePlyExecutionDeferredPairCount} |
| roots with any failed/deferred pair | ${summary.outcomeStatus.rootsWithAnyFailedOrDeferredPair} |
| roots with any public outcome divergence | ${summary.outcomeStatus.rootsWithAnyPublicOutcomeDivergence} |

### Divergence Buckets

| Bucket | Roots |
|---|---:|
${formatCountRows(summary.outcomeStatus.divergenceBucketCounts)}

### Outcome Risk Buckets

| Bucket | Roots |
|---|---:|
${formatCountRows(summary.outcomeStatus.outcomeRiskBucketCounts)}

## Public Action Aggregates

- root public action count stats: ${formatStats(summary.actionBucketAggregates.rootPublicActionCountStats)}
- public action/sample pair count stats: ${formatStats(summary.actionBucketAggregates.publicActionSamplePairCountStats)}
- completed pair count stats: ${formatStats(summary.actionBucketAggregates.completedPairCountStats)}
- failed/deferred pair count stats: ${formatStats(summary.actionBucketAggregates.failedOrDeferredPairCountStats)}
- outcome divergence count stats: ${formatStats(summary.actionBucketAggregates.outcomeDivergenceCountStats)}

### Pair Status By Public Action Kind

| Public action kind | Pair status | Pairs |
|---|---|---:|
${formatNestedCountRows(
  summary.actionBucketAggregates.aggregateExecutionStatusCountsByPublicActionKind,
)}

### Outcome Kind By Public Action Kind

| Public action kind | Outcome kind | Pairs |
|---|---|---:|
${formatNestedCountRows(
  summary.actionBucketAggregates.aggregateOutcomeKindCountsByPublicActionKind,
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

## Recommendation For cFp72

${summary.cFp72Recommendation}
`;
};

const buildManifest = (
  result: DeterminizedPimcOnePlyOutcomeSkeletonV0Result,
  summaryJson: string,
  outcomeRootsJsonl: string,
  skippedRootsJsonl: string,
  reportMarkdown: string,
): DeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactManifest => ({
  schemaVersion: "determinized-pimc-one-ply-outcome-skeleton-v0-artifact-v1",
  probeRunId: result.probeRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  relativeOutputPath: relativeOutputPath(result.suiteId),
  generatedAtTimestampPolicy:
    "omitted from committed artifacts so cFp71 hashes remain deterministic",
  files: [...determinizedPimcOnePlyOutcomeSkeletonV0ArtifactFiles],
  probeReadinessStatus: result.summary.probeReadinessStatus,
  sourceCfp68ContractRunId: result.summary.sourceCfp68ContractRunId,
  sourceCfp69ProbeRunId: result.summary.sourceCfp69ProbeRunId,
  sourceCfp70AvailabilityRunId: result.summary.sourceCfp70AvailabilityRunId,
  totalCfp68RootCount: result.summary.totalCfp68RootCount,
  eligibleRootCount: result.summary.eligibleRootCount,
  outcomeRootCount: result.summary.outcomeRootCount,
  skippedRootCount: result.summary.skippedRootCount,
  skippedRootPercentage: result.summary.skippedRootPercentage,
  rootSchemaVersion: "determinized-pimc-one-ply-outcome-skeleton-v0-root-v1",
  skippedRootSchemaVersion:
    "determinized-pimc-one-ply-outcome-skeleton-v0-skipped-root-v1",
  summarySchemaVersion:
    "determinized-pimc-one-ply-outcome-skeleton-v0-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonClaims: result.summary.explicitNonClaims,
  cFp72Recommendation: result.summary.cFp72Recommendation,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "outcome-roots.jsonl": sha256(outcomeRootsJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts = (
  result: DeterminizedPimcOnePlyOutcomeSkeletonV0Result,
): SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const outcomeRootsJsonl =
    result.outcomeRoots.length === 0
      ? ""
      : `${result.outcomeRoots.map(stableJsonLine).join("\n")}\n`;
  const skippedRootsJsonl =
    result.skippedRoots.length === 0
      ? ""
      : `${result.skippedRoots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown =
    buildDeterminizedPimcOnePlyOutcomeSkeletonV0MarkdownReport(result);
  const manifestJson = stablePrettyJson(
    buildManifest(
      result,
      summaryJson,
      outcomeRootsJsonl,
      skippedRootsJsonl,
      reportMarkdown,
    ),
  );

  return {
    manifestJson,
    summaryJson,
    outcomeRootsJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(
      resolve(outDir, "outcome-roots.jsonl"),
      artifacts.outcomeRootsJsonl,
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
    files: [...determinizedPimcOnePlyOutcomeSkeletonV0ArtifactFiles],
  };
};

export const combinedDeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactText = (
  artifacts: SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.outcomeRootsJsonl,
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
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
  { label: "raw lower command token", pattern: /\bcommand\b/ },
  { label: "raw lower event token", pattern: /\bevent\b/ },
  { label: "raw plural commands token", pattern: /\bcommands\b/ },
  { label: "raw plural events token", pattern: /\bevents\b/ },
];

export const scanDeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactsForHiddenInfo = (
  artifacts: SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts,
) => {
  const combined =
    combinedDeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const determinizedPimcOnePlyOutcomeSkeletonV0ArtifactHashes = (
  artifacts: SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "outcome-roots.jsonl": sha256(artifacts.outcomeRootsJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
