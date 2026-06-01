import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  SamplerPostCfp66InvalidRootCasebookResult,
  SamplerPostCfp66InvalidRootCasebookRootSchemaVersion,
  SamplerPostCfp66InvalidRootCasebookSummarySchemaVersion,
} from "./samplerPostCfp66InvalidRootCasebook";

export type SamplerPostCfp66InvalidRootCasebookArtifactSchemaVersion =
  "sampler-post-cfp66-invalid-root-casebook-artifact-v1";

export interface SamplerPostCfp66InvalidRootCasebookArtifactManifest {
  schemaVersion: SamplerPostCfp66InvalidRootCasebookArtifactSchemaVersion;
  casebookRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  totalRootCount: number;
  validRootCount: number;
  invalidRootCount: number;
  invalidRootPercentage: number;
  validRootOnlySkipRootCount: number;
  rootSchemaVersion: SamplerPostCfp66InvalidRootCasebookRootSchemaVersion;
  summarySchemaVersion: SamplerPostCfp66InvalidRootCasebookSummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
  recommendation: string;
  artifactHashes: Record<"summary.json" | "invalid-roots.jsonl" | "report.md", string>;
}

export interface SerializedSamplerPostCfp66InvalidRootCasebookArtifacts {
  manifestJson: string;
  summaryJson: string;
  invalidRootsJsonl: string;
  reportMarkdown: string;
}

export const samplerPostCfp66InvalidRootCasebookArtifactFiles = [
  "manifest.json",
  "summary.json",
  "invalid-roots.jsonl",
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
  record: Record<string, { count: number; percentageOfInvalidRoots: number }>,
) => {
  const rows = sortedEntries(record);
  if (rows.length === 0) return "| none | 0 | 0.000% |";
  return rows
    .map(
      ([key, value]) =>
        `| ${key} | ${value.count} | ${formatPercent(value.percentageOfInvalidRoots)} |`,
    )
    .join("\n");
};

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/sampler-post-cfp66-invalid-root-casebook/cFp67`;

const buildSamplerPostCfp66InvalidRootCasebookMarkdownReport = (
  result: SamplerPostCfp66InvalidRootCasebookResult,
) => {
  const { summary } = result;
  return `# Sampler Post-cFp66 Invalid-Root Casebook

## Run

- suite id: ${summary.suiteId}
- casebook run id: ${summary.casebookRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- total roots: ${summary.totalRootCount}
- valid roots: ${summary.validRootCount}
- invalid roots: ${summary.invalidRootCount}
- invalid-root percentage: ${formatPercent(summary.invalidRootPercentage)}
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
| materialization roots | ${summary.sourceConsistency.materializationRootCount} |
| materialization valid roots | ${summary.sourceConsistency.materializationValidRootCount} |
| materialization invalid roots | ${summary.sourceConsistency.materializationInvalidRootCount} |
| invalid-root records | ${summary.sourceConsistency.invalidRootRecordCount} |
| provenance records | ${summary.sourceConsistency.provenanceRootRecordCount} |
| missing provenance records | ${summary.sourceConsistency.missingProvenanceRootCount} |
| extra provenance records | ${summary.sourceConsistency.extraProvenanceRootCount} |
| valid-root records emitted | ${summary.sourceConsistency.validRootRecordsInCasebook} |

## Primary Classification

| Classification | Count |
|---|---:|
${formatCountRows(summary.primaryClassificationCounts)}

## Secondary Classifications

### Public Transfer

| Classification | Count |
|---|---:|
${formatCountRows(summary.transferClassificationCounts)}

### Persistent Deficit

| Classification | Count |
|---|---:|
${formatCountRows(summary.persistentDeficitClassificationCounts)}

### Deficit Size

| Classification | Count | Share of invalid roots |
|---|---:|---:|
${formatDistributionRows(summary.invalidRootCountsByDeficitSize)}

### Phase

| Classification | Count |
|---|---:|
${formatCountRows(summary.phaseClassificationCounts)}

## Invalid Root Distributions

### Phase

| Phase | Count | Share of invalid roots |
|---|---:|---:|
${formatDistributionRows(summary.invalidRootCountsByPhase)}

### Round

| Round | Count | Share of invalid roots |
|---|---:|---:|
${formatDistributionRows(summary.invalidRootCountsByRound)}

### Faction

| Faction | Count | Share of invalid roots |
|---|---:|---:|
${formatDistributionRows(summary.invalidRootCountsByFaction)}

### Policy

| Policy | Count | Share of invalid roots |
|---|---:|---:|
${formatDistributionRows(summary.invalidRootCountsByPolicy)}

### Deck Preset

| Deck preset | Count | Share of invalid roots |
|---|---:|---:|
${formatDistributionRows(summary.invalidRootCountsByDeckPreset)}

### Provenance Label

| Provenance label | Count | Share of invalid roots |
|---|---:|---:|
${formatDistributionRows(summary.invalidRootCountsByProvenanceLabel)}

### Matchup

| Matchup | Count | Share of invalid roots |
|---|---:|---:|
${formatDistributionRows(summary.invalidRootCountsByMatchup)}

## Public Transfer Scalar Buckets

| Bucket | Count | Share of invalid roots |
|---|---:|---:|
| zero known hidden transfer | ${summary.publicTransferScalarBucketCounts.zeroKnownHiddenTransfer} | ${formatPercent(summary.publicTransferScalarBucketPercentages.zeroKnownHiddenTransfer)} |
| hidden hand transfer present | ${summary.publicTransferScalarBucketCounts.hiddenHandTransferPresent} | ${formatPercent(summary.publicTransferScalarBucketPercentages.hiddenHandTransferPresent)} |
| hidden deck transfer present | ${summary.publicTransferScalarBucketCounts.hiddenDeckTransferPresent} | ${formatPercent(summary.publicTransferScalarBucketPercentages.hiddenDeckTransferPresent)} |
| public-transfer adjustment present | ${summary.publicTransferScalarBucketCounts.publicTransferAdjustmentPresent} | ${formatPercent(summary.publicTransferScalarBucketPercentages.publicTransferAdjustmentPresent)} |
| uncovered deficit present | ${summary.publicTransferScalarBucketCounts.uncoveredDeficitPresent} | ${formatPercent(summary.publicTransferScalarBucketPercentages.uncoveredDeficitPresent)} |

## Public Transfer Scalar Totals

| Scope | Visible memory refs | Known hidden hand | Known hidden deck | Adjustments | Uncovered deficit cards | Incoherent roots |
|---|---:|---:|---:|---:|---:|---:|
| all roots | ${summary.allRootPublicTransferTotals.visiblePublicMemoryReferences} | ${summary.allRootPublicTransferTotals.knownHiddenHandCards} | ${summary.allRootPublicTransferTotals.knownHiddenDeckCards} | ${summary.allRootPublicTransferTotals.publicTransferAdjustments} | ${summary.allRootPublicTransferTotals.uncoveredDeficitCards} | ${summary.allRootPublicTransferTotals.incoherentRoots} |
| invalid roots | ${summary.invalidRootPublicTransferTotals.visiblePublicMemoryReferences} | ${summary.invalidRootPublicTransferTotals.knownHiddenHandCards} | ${summary.invalidRootPublicTransferTotals.knownHiddenDeckCards} | ${summary.invalidRootPublicTransferTotals.publicTransferAdjustments} | ${summary.invalidRootPublicTransferTotals.uncoveredDeficitCards} | ${summary.invalidRootPublicTransferTotals.incoherentRoots} |

## Valid-Root-Only Skip Counters

- skipped invalid roots: ${summary.validRootOnlySkipRootCount}
- skipped-root percentage of all roots: ${formatPercent(summary.validRootOnlySkipRootPercentage)}
- required cFp68 counters: ${summary.requiredCfp68SkipCounters.join(", ")}

### Skip Count By Phase

| Phase | Count |
|---|---:|
${formatCountRows(summary.validRootOnlySkipCounterCounts.byPhase)}

### Skip Count By Round

| Round | Count |
|---|---:|
${formatCountRows(summary.validRootOnlySkipCounterCounts.byRound)}

### Skip Count By Provenance Label

| Provenance label | Count |
|---|---:|
${formatCountRows(summary.validRootOnlySkipCounterCounts.byProvenanceLabel)}

## Hidden-Info Safety

${summary.hiddenInfoSafetyNote}

## Non-Search Warning

${summary.explicitNonSearchWarning}

## Recommendation For cFp68

${summary.recommendation}
`;
};

const buildManifest = (
  result: SamplerPostCfp66InvalidRootCasebookResult,
  summaryJson: string,
  invalidRootsJsonl: string,
  reportMarkdown: string,
): SamplerPostCfp66InvalidRootCasebookArtifactManifest => ({
  schemaVersion: "sampler-post-cfp66-invalid-root-casebook-artifact-v1",
  casebookRunId: result.casebookRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  relativeOutputPath: relativeOutputPath(result.suiteId),
  generatedAtTimestampPolicy:
    "omitted from committed artifacts so cFp67 hashes remain deterministic",
  files: [...samplerPostCfp66InvalidRootCasebookArtifactFiles],
  totalRootCount: result.summary.totalRootCount,
  validRootCount: result.summary.validRootCount,
  invalidRootCount: result.summary.invalidRootCount,
  invalidRootPercentage: result.summary.invalidRootPercentage,
  validRootOnlySkipRootCount: result.summary.validRootOnlySkipRootCount,
  rootSchemaVersion: "sampler-post-cfp66-invalid-root-casebook-root-v1",
  summarySchemaVersion: "sampler-post-cfp66-invalid-root-casebook-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonSearchWarning: result.summary.explicitNonSearchWarning,
  recommendation: result.summary.recommendation,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "invalid-roots.jsonl": sha256(invalidRootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeSamplerPostCfp66InvalidRootCasebookArtifacts = (
  result: SamplerPostCfp66InvalidRootCasebookResult,
): SerializedSamplerPostCfp66InvalidRootCasebookArtifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const invalidRootsJsonl =
    result.records.length === 0
      ? ""
      : `${result.records.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown =
    buildSamplerPostCfp66InvalidRootCasebookMarkdownReport(result);
  const manifestJson = stablePrettyJson(
    buildManifest(result, summaryJson, invalidRootsJsonl, reportMarkdown),
  );

  return {
    manifestJson,
    summaryJson,
    invalidRootsJsonl,
    reportMarkdown,
  };
};

export const writeSamplerPostCfp66InvalidRootCasebookArtifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedSamplerPostCfp66InvalidRootCasebookArtifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(
      resolve(outDir, "invalid-roots.jsonl"),
      artifacts.invalidRootsJsonl,
      "utf8",
    ),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...samplerPostCfp66InvalidRootCasebookArtifactFiles],
  };
};

export const combinedSamplerPostCfp66InvalidRootCasebookArtifactText = (
  artifacts: SerializedSamplerPostCfp66InvalidRootCasebookArtifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.invalidRootsJsonl,
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
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
];

export const scanSamplerPostCfp66InvalidRootCasebookArtifactsForHiddenInfo = (
  artifacts: SerializedSamplerPostCfp66InvalidRootCasebookArtifacts,
) => {
  const combined =
    combinedSamplerPostCfp66InvalidRootCasebookArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const samplerPostCfp66InvalidRootCasebookArtifactHashes = (
  artifacts: SerializedSamplerPostCfp66InvalidRootCasebookArtifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "invalid-roots.jsonl": sha256(artifacts.invalidRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
