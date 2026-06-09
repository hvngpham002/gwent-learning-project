import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  DeterminizedPimcProbeV0ReadinessStatus,
  DeterminizedPimcProbeV0Result,
  DeterminizedPimcProbeV0RootSchemaVersion,
  DeterminizedPimcProbeV0SkippedRootSchemaVersion,
  DeterminizedPimcProbeV0SummarySchemaVersion,
} from "./determinizedPimcProbeV0";

export type DeterminizedPimcProbeV0ArtifactSchemaVersion =
  "determinized-pimc-probe-v0-artifact-v1";

export interface DeterminizedPimcProbeV0ArtifactManifest {
  schemaVersion: DeterminizedPimcProbeV0ArtifactSchemaVersion;
  probeRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  probeReadinessStatus: DeterminizedPimcProbeV0ReadinessStatus;
  sourceCfp68ContractRunId: string;
  totalCfp68RootCount: number;
  eligibleRootCount: number;
  probeRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  rootSchemaVersion: DeterminizedPimcProbeV0RootSchemaVersion;
  skippedRootSchemaVersion: DeterminizedPimcProbeV0SkippedRootSchemaVersion;
  summarySchemaVersion: DeterminizedPimcProbeV0SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp70Recommendation: string;
  artifactHashes: Record<
    "summary.json" | "probe-roots.jsonl" | "skipped-roots.jsonl" | "report.md",
    string
  >;
}

export interface SerializedDeterminizedPimcProbeV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  probeRootsJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const determinizedPimcProbeV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "probe-roots.jsonl",
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
  `docs/research/literature/ai/benchmark-results/${suiteId}/determinized-pimc-probe-v0/cFp69`;

const rootReferenceBlock = (value: unknown) =>
  `\n\`\`\`json\n${JSON.stringify(sortJsonValue(value), null, 2)}\n\`\`\`\n`;

const buildDeterminizedPimcProbeV0MarkdownReport = (
  result: DeterminizedPimcProbeV0Result,
) => {
  const { summary } = result;
  return `# Determinized PIMC Probe v0 Sanity

## Run

- suite id: ${summary.suiteId}
- probe run id: ${summary.probeRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- probe variant: ${summary.probeVariant}
- probe mode: ${summary.probeMode}
- probe readiness status: ${summary.probeReadinessStatus}
- source cFp68 contract run id: ${summary.sourceCfp68ContractRunId}
- total cFp68 roots: ${summary.totalCfp68RootCount}
- eligible valid roots: ${summary.eligibleRootCount}
- probe roots: ${summary.probeRootCount}
- skipped invalid roots: ${summary.skippedRootCount}
- skipped-root percentage: ${formatPercent(summary.skippedRootPercentage)}
- matches: ${summary.matchCount}

## Source Artifact Inputs

| Input | SHA-256 |
|---|---|
${summary.sourceArtifactReferences
  .map((reference) => `| ${reference.relativePath} | ${reference.sha256} |`)
  .join("\n")}

## Source Consistency

| Check | Count |
|---|---:|
| cFp68 contract not probe-ready | ${summary.sourceConsistency.cFp68ContractNotProbeReady} |
| cFp68 total roots | ${summary.sourceConsistency.cFp68TotalRootCount} |
| cFp68 eligible roots read | ${summary.sourceConsistency.cFp68EligibleRootsRead} |
| cFp68 skipped roots read | ${summary.sourceConsistency.cFp68SkippedRootsRead} |
| benchmark observed roots read | ${summary.sourceConsistency.benchmarkObservedRootsRead} |
| eligible roots not observed | ${summary.sourceConsistency.eligibleRootsNotObserved} |
| observed roots not in cFp68 contract | ${summary.sourceConsistency.observedRootsNotInCfp68Contract} |
| skipped roots incorrectly probed | ${summary.sourceConsistency.skippedRootsIncorrectlyProbed} |
| duplicate observed root keys | ${summary.sourceConsistency.duplicateObservedRootKeys} |
| duplicate cFp68 eligible root keys | ${summary.sourceConsistency.duplicateCfp68EligibleRootKeys} |
| duplicate cFp68 skipped root keys | ${summary.sourceConsistency.duplicateCfp68SkippedRootKeys} |
| eligible plus skipped delta from cFp68 total | ${summary.sourceConsistency.eligibleSkippedRootCountDeltaFromCfp68Total} |
| cFp68 eligible sample-count mismatch roots | ${summary.sourceConsistency.cFp68EligibleSampleCountMismatchRoots} |
| public action abstraction failed roots | ${summary.sourceConsistency.publicActionAbstractionFailedRoots} |

## Probe Status Counts

| Status | Count |
|---|---:|
${formatCountRows(summary.probeStatusCounts)}

## Sample Budget

| Metric | Count |
|---|---:|
| probe roots | ${summary.sampleBudget.probeRootCount} |
| total requested samples | ${summary.sampleBudget.totalRequestedSampleCount} |
| total consumed samples | ${summary.sampleBudget.totalConsumedSampleCount} |
| total valid samples | ${summary.sampleBudget.totalValidSampleCount} |
| total invalid samples | ${summary.sampleBudget.totalInvalidSampleCount} |

### Requested Samples Per Probe Root

| Requested samples | Probe roots |
|---|---:|
${formatCountRows(summary.sampleBudget.requestedSamplesPerRootDistribution)}

## Public Action Scaffold

- probe mode: ${summary.publicActionScaffold.probeMode}
- legal move count stats: ${formatStats(summary.publicActionScaffold.legalMoveCountStats)}
- public action count stats: ${formatStats(summary.publicActionScaffold.publicActionCountStats)}
- public action collision count stats: ${formatStats(summary.publicActionScaffold.publicActionCollisionCountStats)}
- largest public action bucket size stats: ${formatStats(summary.publicActionScaffold.largestPublicActionBucketSizeStats)}

### Aggregate Public Action Kinds

| Kind | Count |
|---|---:|
${formatCountRows(summary.publicActionScaffold.aggregatePublicActionKindCounts)}

### Aggregate Target Kinds

| Kind | Count |
|---|---:|
${formatCountRows(summary.publicActionScaffold.aggregateTargetKindCounts)}

### Aggregate Target Sides

| Side | Count |
|---|---:|
${formatCountRows(summary.publicActionScaffold.aggregateTargetSideCounts)}

### Root Counts By Public Action Kind Presence

| Kind | Roots |
|---|---:|
${formatCountRows(summary.publicActionScaffold.rootCountsByPublicActionKindPresence)}

### Max Public Action Root Reference
${rootReferenceBlock(summary.publicActionScaffold.maxPublicActionRoot)}

### Max Collision Root Reference
${rootReferenceBlock(summary.publicActionScaffold.maxCollisionRoot)}

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

## Recommendation For cFp70

${summary.cFp70Recommendation}
`;
};

const buildManifest = (
  result: DeterminizedPimcProbeV0Result,
  summaryJson: string,
  probeRootsJsonl: string,
  skippedRootsJsonl: string,
  reportMarkdown: string,
): DeterminizedPimcProbeV0ArtifactManifest => ({
  schemaVersion: "determinized-pimc-probe-v0-artifact-v1",
  probeRunId: result.probeRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  relativeOutputPath: relativeOutputPath(result.suiteId),
  generatedAtTimestampPolicy:
    "omitted from committed artifacts so cFp69 hashes remain deterministic",
  files: [...determinizedPimcProbeV0ArtifactFiles],
  probeReadinessStatus: result.summary.probeReadinessStatus,
  sourceCfp68ContractRunId: result.summary.sourceCfp68ContractRunId,
  totalCfp68RootCount: result.summary.totalCfp68RootCount,
  eligibleRootCount: result.summary.eligibleRootCount,
  probeRootCount: result.summary.probeRootCount,
  skippedRootCount: result.summary.skippedRootCount,
  skippedRootPercentage: result.summary.skippedRootPercentage,
  rootSchemaVersion: "determinized-pimc-probe-v0-root-v1",
  skippedRootSchemaVersion: "determinized-pimc-probe-v0-skipped-root-v1",
  summarySchemaVersion: "determinized-pimc-probe-v0-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonClaims: result.summary.explicitNonClaims,
  cFp70Recommendation: result.summary.cFp70Recommendation,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "probe-roots.jsonl": sha256(probeRootsJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeDeterminizedPimcProbeV0Artifacts = (
  result: DeterminizedPimcProbeV0Result,
): SerializedDeterminizedPimcProbeV0Artifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const probeRootsJsonl =
    result.probeRoots.length === 0
      ? ""
      : `${result.probeRoots.map(stableJsonLine).join("\n")}\n`;
  const skippedRootsJsonl =
    result.skippedRoots.length === 0
      ? ""
      : `${result.skippedRoots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown = buildDeterminizedPimcProbeV0MarkdownReport(result);
  const manifestJson = stablePrettyJson(
    buildManifest(
      result,
      summaryJson,
      probeRootsJsonl,
      skippedRootsJsonl,
      reportMarkdown,
    ),
  );

  return {
    manifestJson,
    summaryJson,
    probeRootsJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writeDeterminizedPimcProbeV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedDeterminizedPimcProbeV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(
      resolve(outDir, "probe-roots.jsonl"),
      artifacts.probeRootsJsonl,
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
    files: [...determinizedPimcProbeV0ArtifactFiles],
  };
};

export const combinedDeterminizedPimcProbeV0ArtifactText = (
  artifacts: SerializedDeterminizedPimcProbeV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.probeRootsJsonl,
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

export const scanDeterminizedPimcProbeV0ArtifactsForHiddenInfo = (
  artifacts: SerializedDeterminizedPimcProbeV0Artifacts,
) => {
  const combined = combinedDeterminizedPimcProbeV0ArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const determinizedPimcProbeV0ArtifactHashes = (
  artifacts: SerializedDeterminizedPimcProbeV0Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "probe-roots.jsonl": sha256(artifacts.probeRootsJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
