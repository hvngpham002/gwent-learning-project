import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  DeterminizedProbeContractResult,
  DeterminizedProbeContractRootSchemaVersion,
  DeterminizedProbeContractStatus,
  DeterminizedProbeContractSummarySchemaVersion,
} from "./determinizedProbeContract";

export type DeterminizedProbeContractArtifactSchemaVersion =
  "determinized-probe-contract-artifact-v1";

export interface DeterminizedProbeContractArtifactManifest {
  schemaVersion: DeterminizedProbeContractArtifactSchemaVersion;
  contractRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  contractStatus: DeterminizedProbeContractStatus;
  totalCfp61RootCount: number;
  eligibleRootCount: number;
  skippedRootCount: number;
  skippedRootPercentage: number;
  invalidRootCountFromCfp67: number;
  rootSchemaVersion: DeterminizedProbeContractRootSchemaVersion;
  summarySchemaVersion: DeterminizedProbeContractSummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
  cFp69Recommendation: string;
  artifactHashes: Record<
    "summary.json" | "eligible-roots.jsonl" | "skipped-roots.jsonl" | "report.md",
    string
  >;
}

export interface SerializedDeterminizedProbeContractArtifacts {
  manifestJson: string;
  summaryJson: string;
  eligibleRootsJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const determinizedProbeContractArtifactFiles = [
  "manifest.json",
  "summary.json",
  "eligible-roots.jsonl",
  "skipped-roots.jsonl",
  "report.md",
] as const;

const sortJsonValue = (value: unknown): unknown => {
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

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/determinized-probe-contract/cFp68`;

const buildDeterminizedProbeContractMarkdownReport = (
  result: DeterminizedProbeContractResult,
) => {
  const { summary } = result;
  return `# Determinized Probe Contract

## Run

- suite id: ${summary.suiteId}
- contract run id: ${summary.contractRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- contract status: ${summary.contractStatus}
- total cFp61 roots: ${summary.totalCfp61RootCount}
- eligible valid roots: ${summary.eligibleRootCount}
- skipped invalid roots: ${summary.skippedRootCount}
- skipped-root percentage: ${formatPercent(summary.skippedRootPercentage)}
- cFp67 invalid-root records: ${summary.invalidRootCountFromCfp67}
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
| materialization roots read | ${summary.sourceConsistency.materializationRootsRead} |
| materialization summary roots | ${summary.sourceConsistency.materializationSummaryRootCount} |
| cFp67 skip records read | ${summary.sourceConsistency.cFp67SkipRecordsRead} |
| cFp67 summary invalid roots | ${summary.sourceConsistency.cFp67SummaryInvalidRootCount} |
| invalid roots missing cFp67 records | ${summary.sourceConsistency.invalidRootsMissingCfp67SkipRecords} |
| cFp67 records without matching cFp61 invalid roots | ${summary.sourceConsistency.cFp67RecordsWithoutMatchingCfp61InvalidRoots} |
| duplicate cFp61 root keys | ${summary.sourceConsistency.duplicateRootKeys} |
| duplicate cFp67 root keys | ${summary.sourceConsistency.duplicateCfp67RootKeys} |
| valid cFp61 roots matched by cFp67 records | ${summary.sourceConsistency.validCfp61RootsMatchedByCfp67SkipRecords} |
| valid cFp61 roots emitted as skipped | ${summary.sourceConsistency.cFp61ValidRootsInSkippedRoots} |
| invalid cFp61 roots emitted as eligible | ${summary.sourceConsistency.cFp61InvalidRootsInEligibleRoots} |
| invalid eligible sample-count roots | ${summary.sourceConsistency.invalidEligibleSampleCountRootCount} |
| unsupported materialization status roots | ${summary.sourceConsistency.unsupportedMaterializationStatusRootCount} |
| contract mismatch skipped roots | ${summary.sourceConsistency.contractMismatchSkippedRootCount} |
| records emitted | ${summary.sourceConsistency.recordsEmitted} |
| eligible records emitted | ${summary.sourceConsistency.eligibleRecordsEmitted} |
| skipped records emitted | ${summary.sourceConsistency.skippedRecordsEmitted} |
| unaccounted cFp61 roots | ${summary.sourceConsistency.unaccountedCfp61RootCount} |

## Determinization Budget

| Metric | Count |
|---|---:|
| eligible roots | ${summary.deterministicProbeBudget.eligibleRootCount} |
| total requested samples across eligible roots | ${summary.deterministicProbeBudget.totalRequestedSampleCountAcrossEligibleRoots} |
| total valid samples across eligible roots | ${summary.deterministicProbeBudget.totalValidSampleCountAcrossEligibleRoots} |

### Requested Samples Per Eligible Root

| Requested samples | Eligible roots |
|---|---:|
${formatCountRows(
  summary.deterministicProbeBudget.requestedSamplesPerEligibleRootDistribution,
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

## Future Probe Contract

${summary.futureProbeContract.map((item) => `- ${item}`).join("\n")}

## Hidden-Info Safety

${summary.hiddenInfoSafetyNote}

## Non-Search Warning

${summary.explicitNonSearchWarning}

## Recommendation For cFp69

${summary.cFp69Recommendation}
`;
};

const buildManifest = (
  result: DeterminizedProbeContractResult,
  summaryJson: string,
  eligibleRootsJsonl: string,
  skippedRootsJsonl: string,
  reportMarkdown: string,
): DeterminizedProbeContractArtifactManifest => ({
  schemaVersion: "determinized-probe-contract-artifact-v1",
  contractRunId: result.contractRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  relativeOutputPath: relativeOutputPath(result.suiteId),
  generatedAtTimestampPolicy:
    "omitted from committed artifacts so cFp68 hashes remain deterministic",
  files: [...determinizedProbeContractArtifactFiles],
  contractStatus: result.summary.contractStatus,
  totalCfp61RootCount: result.summary.totalCfp61RootCount,
  eligibleRootCount: result.summary.eligibleRootCount,
  skippedRootCount: result.summary.skippedRootCount,
  skippedRootPercentage: result.summary.skippedRootPercentage,
  invalidRootCountFromCfp67: result.summary.invalidRootCountFromCfp67,
  rootSchemaVersion: "determinized-probe-contract-root-v1",
  summarySchemaVersion: "determinized-probe-contract-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonSearchWarning: result.summary.explicitNonSearchWarning,
  cFp69Recommendation: result.summary.cFp69Recommendation,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "eligible-roots.jsonl": sha256(eligibleRootsJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeDeterminizedProbeContractArtifacts = (
  result: DeterminizedProbeContractResult,
): SerializedDeterminizedProbeContractArtifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const eligibleRootsJsonl =
    result.eligibleRoots.length === 0
      ? ""
      : `${result.eligibleRoots.map(stableJsonLine).join("\n")}\n`;
  const skippedRootsJsonl =
    result.skippedRoots.length === 0
      ? ""
      : `${result.skippedRoots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown = buildDeterminizedProbeContractMarkdownReport(result);
  const manifestJson = stablePrettyJson(
    buildManifest(
      result,
      summaryJson,
      eligibleRootsJsonl,
      skippedRootsJsonl,
      reportMarkdown,
    ),
  );

  return {
    manifestJson,
    summaryJson,
    eligibleRootsJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writeDeterminizedProbeContractArtifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedDeterminizedProbeContractArtifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(
      resolve(outDir, "eligible-roots.jsonl"),
      artifacts.eligibleRootsJsonl,
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
    files: [...determinizedProbeContractArtifactFiles],
  };
};

export const combinedDeterminizedProbeContractArtifactText = (
  artifacts: SerializedDeterminizedProbeContractArtifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.eligibleRootsJsonl,
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
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
];

export const scanDeterminizedProbeContractArtifactsForHiddenInfo = (
  artifacts: SerializedDeterminizedProbeContractArtifacts,
) => {
  const combined = combinedDeterminizedProbeContractArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const determinizedProbeContractArtifactHashes = (
  artifacts: SerializedDeterminizedProbeContractArtifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "eligible-roots.jsonl": sha256(artifacts.eligibleRootsJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
