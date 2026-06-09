import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  DeterminizedPimcActionAvailabilityV0ReadinessStatus,
  DeterminizedPimcActionAvailabilityV0Result,
  DeterminizedPimcActionAvailabilityV0RootSchemaVersion,
  DeterminizedPimcActionAvailabilityV0SkippedRootSchemaVersion,
  DeterminizedPimcActionAvailabilityV0SummarySchemaVersion,
} from "./determinizedPimcActionAvailabilityV0";

export type DeterminizedPimcActionAvailabilityV0ArtifactSchemaVersion =
  "determinized-pimc-action-availability-v0-artifact-v1";

export interface DeterminizedPimcActionAvailabilityV0ArtifactManifest {
  schemaVersion: DeterminizedPimcActionAvailabilityV0ArtifactSchemaVersion;
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  probeReadinessStatus: DeterminizedPimcActionAvailabilityV0ReadinessStatus;
  sourceCfp68ContractRunId: string;
  sourceCfp69ProbeRunId: string;
  totalCfp68RootCount: number;
  eligibleRootCount: number;
  availabilityRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  rootSchemaVersion: DeterminizedPimcActionAvailabilityV0RootSchemaVersion;
  skippedRootSchemaVersion: DeterminizedPimcActionAvailabilityV0SkippedRootSchemaVersion;
  summarySchemaVersion: DeterminizedPimcActionAvailabilityV0SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp71Recommendation: string;
  artifactHashes: Record<
    "summary.json" | "availability-roots.jsonl" | "skipped-roots.jsonl" | "report.md",
    string
  >;
}

export interface SerializedDeterminizedPimcActionAvailabilityV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  availabilityRootsJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const determinizedPimcActionAvailabilityV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "availability-roots.jsonl",
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
  `docs/research/literature/ai/benchmark-results/${suiteId}/determinized-pimc-action-availability-v0/cFp70`;

const buildDeterminizedPimcActionAvailabilityV0MarkdownReport = (
  result: DeterminizedPimcActionAvailabilityV0Result,
) => {
  const { summary } = result;
  return `# Determinized PIMC Action Availability v0

## Run

- suite id: ${summary.suiteId}
- probe run id: ${summary.probeRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- probe variant: ${summary.probeVariant}
- probe mode: ${summary.probeMode}
- probe readiness status: ${summary.probeReadinessStatus}
- source cFp68 contract run id: ${summary.sourceCfp68ContractRunId}
- source cFp69 probe run id: ${summary.sourceCfp69ProbeRunId}
- total cFp68 roots: ${summary.totalCfp68RootCount}
- eligible valid roots: ${summary.eligibleRootCount}
- availability roots: ${summary.availabilityRootCount}
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

## Source Consistency

| Check | Count |
|---|---:|
| cFp68 contract not probe-ready | ${summary.sourceConsistency.cFp68ContractNotProbeReady} |
| cFp68 total roots | ${summary.sourceConsistency.cFp68TotalRootCount} |
| cFp68 eligible roots read | ${summary.sourceConsistency.cFp68EligibleRootsRead} |
| cFp68 skipped roots read | ${summary.sourceConsistency.cFp68SkippedRootsRead} |
| cFp69 probe roots read | ${summary.sourceConsistency.cFp69ProbeRootsRead} |
| cFp69 skipped roots read | ${summary.sourceConsistency.cFp69SkippedRootsRead} |
| benchmark observed roots read | ${summary.sourceConsistency.benchmarkObservedRootsRead} |
| eligible roots not observed | ${summary.sourceConsistency.eligibleRootsNotObserved} |
| observed roots outside cFp68/cFp69 contracts | ${summary.sourceConsistency.observedRootsNotInCfp68Cfp69Contract} |
| skipped roots incorrectly probed | ${summary.sourceConsistency.skippedRootsIncorrectlyProbed} |
| duplicate observed root keys | ${summary.sourceConsistency.duplicateObservedRootKeys} |
| duplicate cFp68 eligible root keys | ${summary.sourceConsistency.duplicateCfp68EligibleRootKeys} |
| duplicate cFp69 probe root keys | ${summary.sourceConsistency.duplicateCfp69ProbeRootKeys} |
| duplicate skipped root keys | ${summary.sourceConsistency.duplicateSkippedRootKeys} |
| cFp68/cFp69 eligible root count delta | ${summary.sourceConsistency.cfp68Cfp69EligibleRootCountDelta} |
| cFp68/cFp69 skipped root count delta | ${summary.sourceConsistency.cfp68Cfp69SkippedRootCountDelta} |
| cFp69 probe roots missing cFp68 eligible root | ${summary.sourceConsistency.cfp69ProbeRootsMissingCfp68EligibleRoot} |
| cFp69 skipped roots missing cFp68 skipped root | ${summary.sourceConsistency.cfp69SkippedRootsMissingCfp68SkippedRoot} |
| cFp68/cFp69 sample-count mismatch roots | ${summary.sourceConsistency.cfp68Cfp69SampleCountMismatchRoots} |
| cFp68/cFp69 public-action count mismatch roots | ${summary.sourceConsistency.cfp68Cfp69PublicActionCountMismatchRoots} |
| cFp68 fingerprint mismatch observed roots | ${summary.sourceConsistency.cfp68FingerprintMismatchObservedRoots} |

## Sample Budget

| Metric | Count |
|---|---:|
| availability roots | ${summary.sampleBudget.availabilityRootCount} |
| total requested samples | ${summary.sampleBudget.totalRequestedSampleCount} |
| total generated samples | ${summary.sampleBudget.totalGeneratedSampleCount} |
| total checked samples | ${summary.sampleBudget.totalCheckedSampleCount} |
| total failed samples | ${summary.sampleBudget.totalFailedSampleCount} |

### Requested Samples Per Availability Root

| Requested samples | Roots |
|---|---:|
${formatCountRows(summary.sampleBudget.requestedSamplesPerRootDistribution)}

## Availability Status

| Probe status | Roots |
|---|---:|
${formatCountRows(summary.availabilityStatus.probeStatusCounts)}

### Per-Sample Status

| Sample status | Samples |
|---|---:|
${formatCountRows(summary.availabilityStatus.sampleAvailabilityStatusCounts)}

| Metric | Count |
|---|---:|
| all-actions-available roots | ${summary.availabilityStatus.allActionsAvailableRootCount} |
| roots with missing root actions | ${summary.availabilityStatus.rootsWithMissingRootActions} |
| roots with extra sampled actions | ${summary.availabilityStatus.rootsWithExtraSampledActions} |
| roots with any disagreement | ${summary.availabilityStatus.rootsWithAnyDisagreement} |

### Disagreement Buckets

| Bucket | Roots |
|---|---:|
${formatCountRows(summary.availabilityStatus.disagreementBucketCounts)}

### Risk Buckets

| Bucket | Roots |
|---|---:|
${formatCountRows(summary.availabilityStatus.availabilityRiskBucketCounts)}

## Action Bucket Aggregates

- root public action count stats: ${formatStats(summary.actionBucketAggregates.rootPublicActionCountStats)}
- sampled public action count stats: ${formatStats(summary.actionBucketAggregates.sampledPublicActionCountStats)}
- missing root action bucket stats: ${formatStats(summary.actionBucketAggregates.missingRootActionBucketStats)}
- extra sampled action bucket stats: ${formatStats(summary.actionBucketAggregates.extraSampledActionBucketStats)}
- disagreement stats: ${formatStats(summary.actionBucketAggregates.disagreementStats)}

### Missing By Public Action Kind

| Kind | Count |
|---|---:|
${formatCountRows(summary.actionBucketAggregates.aggregateMissingByPublicActionKind)}

### Extra By Public Action Kind

| Kind | Count |
|---|---:|
${formatCountRows(summary.actionBucketAggregates.aggregateExtraByPublicActionKind)}

### Missing By Target Kind

| Kind | Count |
|---|---:|
${formatCountRows(summary.actionBucketAggregates.aggregateMissingByTargetKind)}

### Extra By Target Kind

| Kind | Count |
|---|---:|
${formatCountRows(summary.actionBucketAggregates.aggregateExtraByTargetKind)}

### Missing By Target Side

| Side | Count |
|---|---:|
${formatCountRows(summary.actionBucketAggregates.aggregateMissingByTargetSide)}

### Extra By Target Side

| Side | Count |
|---|---:|
${formatCountRows(summary.actionBucketAggregates.aggregateExtraByTargetSide)}

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

## Recommendation For cFp71

${summary.cFp71Recommendation}
`;
};

const buildManifest = (
  result: DeterminizedPimcActionAvailabilityV0Result,
  summaryJson: string,
  availabilityRootsJsonl: string,
  skippedRootsJsonl: string,
  reportMarkdown: string,
): DeterminizedPimcActionAvailabilityV0ArtifactManifest => ({
  schemaVersion: "determinized-pimc-action-availability-v0-artifact-v1",
  probeRunId: result.probeRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  relativeOutputPath: relativeOutputPath(result.suiteId),
  generatedAtTimestampPolicy:
    "omitted from committed artifacts so cFp70 hashes remain deterministic",
  files: [...determinizedPimcActionAvailabilityV0ArtifactFiles],
  probeReadinessStatus: result.summary.probeReadinessStatus,
  sourceCfp68ContractRunId: result.summary.sourceCfp68ContractRunId,
  sourceCfp69ProbeRunId: result.summary.sourceCfp69ProbeRunId,
  totalCfp68RootCount: result.summary.totalCfp68RootCount,
  eligibleRootCount: result.summary.eligibleRootCount,
  availabilityRootCount: result.summary.availabilityRootCount,
  skippedRootCount: result.summary.skippedRootCount,
  skippedRootPercentage: result.summary.skippedRootPercentage,
  rootSchemaVersion: "determinized-pimc-action-availability-v0-root-v1",
  skippedRootSchemaVersion:
    "determinized-pimc-action-availability-v0-skipped-root-v1",
  summarySchemaVersion: "determinized-pimc-action-availability-v0-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonClaims: result.summary.explicitNonClaims,
  cFp71Recommendation: result.summary.cFp71Recommendation,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "availability-roots.jsonl": sha256(availabilityRootsJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeDeterminizedPimcActionAvailabilityV0Artifacts = (
  result: DeterminizedPimcActionAvailabilityV0Result,
): SerializedDeterminizedPimcActionAvailabilityV0Artifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const availabilityRootsJsonl =
    result.availabilityRoots.length === 0
      ? ""
      : `${result.availabilityRoots.map(stableJsonLine).join("\n")}\n`;
  const skippedRootsJsonl =
    result.skippedRoots.length === 0
      ? ""
      : `${result.skippedRoots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown =
    buildDeterminizedPimcActionAvailabilityV0MarkdownReport(result);
  const manifestJson = stablePrettyJson(
    buildManifest(
      result,
      summaryJson,
      availabilityRootsJsonl,
      skippedRootsJsonl,
      reportMarkdown,
    ),
  );

  return {
    manifestJson,
    summaryJson,
    availabilityRootsJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writeDeterminizedPimcActionAvailabilityV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedDeterminizedPimcActionAvailabilityV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(
      resolve(outDir, "availability-roots.jsonl"),
      artifacts.availabilityRootsJsonl,
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
    files: [...determinizedPimcActionAvailabilityV0ArtifactFiles],
  };
};

export const combinedDeterminizedPimcActionAvailabilityV0ArtifactText = (
  artifacts: SerializedDeterminizedPimcActionAvailabilityV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.availabilityRootsJsonl,
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
  { label: "bestAction", pattern: /\bbestAction\b/ },
  { label: "selectedAction", pattern: /\bselectedAction\b/ },
  { label: "actionValue", pattern: /\bactionValue\b/ },
  { label: "expectedValue", pattern: /\bexpectedValue\b/ },
  { label: "rolloutReward", pattern: /\brolloutReward\b/ },
  { label: "winProbability", pattern: /\bwinProbability\b/ },
  { label: "principalVariation", pattern: /\bprincipalVariation\b/ },
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
];

export const scanDeterminizedPimcActionAvailabilityV0ArtifactsForHiddenInfo = (
  artifacts: SerializedDeterminizedPimcActionAvailabilityV0Artifacts,
) => {
  const combined =
    combinedDeterminizedPimcActionAvailabilityV0ArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const determinizedPimcActionAvailabilityV0ArtifactHashes = (
  artifacts: SerializedDeterminizedPimcActionAvailabilityV0Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "availability-roots.jsonl": sha256(artifacts.availabilityRootsJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
