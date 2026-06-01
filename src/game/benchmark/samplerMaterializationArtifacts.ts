import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  SamplerMaterializationProfileResult,
  SamplerMaterializationRootSchemaVersion,
  SamplerMaterializationSummarySchemaVersion,
} from "./samplerMaterialization";

export type SamplerMaterializationArtifactSchemaVersion =
  "sampler-materialization-artifact-v1";

export interface SamplerMaterializationArtifactManifest {
  schemaVersion: SamplerMaterializationArtifactSchemaVersion;
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  files: string[];
  rootRecordCount: number;
  rootSchemaVersion: SamplerMaterializationRootSchemaVersion;
  summarySchemaVersion: SamplerMaterializationSummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
  artifactHashes: Record<"summary.json" | "roots.jsonl" | "report.md", string>;
}

export interface SerializedSamplerMaterializationArtifacts {
  manifestJson: string;
  summaryJson: string;
  rootsJsonl: string;
  reportMarkdown: string;
}

export const samplerMaterializationArtifactFiles = [
  "manifest.json",
  "summary.json",
  "roots.jsonl",
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

const formatNumber = (value: number) => Number(value.toFixed(3)).toString();

const formatStats = (stats: {
  count: number;
  min: number;
  max: number;
  average: number;
  p50: number;
  p90: number;
  p95: number;
}) =>
  `count ${stats.count}, min ${stats.min}, max ${stats.max}, avg ${formatNumber(stats.average)}, p50 ${stats.p50}, p90 ${stats.p90}, p95 ${stats.p95}`;

const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));

const formatCountRows = (record: Record<string, number>) => {
  const rows = sortedEntries(record);
  if (rows.length === 0) return "| none | 0 |";
  return rows.map(([key, count]) => `| ${key} | ${count} |`).join("\n");
};

const buildSamplerMaterializationMarkdownReport = (
  result: SamplerMaterializationProfileResult,
) => {
  const { summary } = result;
  return `# Sampler Materialization Report

## Run

- suite id: ${summary.suiteId}
- sampler run id: ${summary.samplerRunId}
- root records: ${summary.rootRecordCount}
- matches: ${summary.matchCount}

## Status Counts

| Status | Count |
|---|---:|
${formatCountRows(summary.statusCounts)}

## Phase Distribution

| Phase | Roots |
|---|---:|
${formatCountRows(summary.rootCountsByPhase)}

## Policy Distribution

| Policy | Roots |
|---|---:|
${formatCountRows(summary.rootCountsByPolicy)}

## Faction Distribution

| Faction | Roots |
|---|---:|
${formatCountRows(summary.rootCountsByFaction)}

## Deck Distribution

| Deck preset | Roots |
|---|---:|
${formatCountRows(summary.rootCountsByDeckPreset)}

## Prior Status

| Prior status | Count |
|---|---:|
${formatCountRows(summary.priorStatusCounts)}

## Materialization Status

| Materialization status | Count |
|---|---:|
${formatCountRows(summary.materializationStatusCounts)}

## Invalid Reason Counts

| Reason | Count |
|---|---:|
${formatCountRows(summary.invalidReasonCounts)}

## Public Reference Diagnostics

- duplicate public references: ${summary.duplicatePublicReferenceTotal}
- duplicate fixed-known-hand references: ${summary.duplicateFixedKnownHandReferenceTotal}
- duplicate public reference count: ${formatStats(summary.duplicatePublicReferenceCountStats)}
- duplicate fixed-known-hand reference count: ${formatStats(summary.duplicateFixedKnownHandReferenceCountStats)}
- unique public known card count: ${formatStats(summary.uniquePublicKnownCardCountStats)}
- unique fixed-known-hand card count: ${formatStats(summary.uniqueFixedKnownHandCardCountStats)}

## Sample Counts

- requested: ${formatStats(summary.sampleCountStats.requested)}
- generated: ${formatStats(summary.sampleCountStats.generated)}
- valid: ${formatStats(summary.sampleCountStats.valid)}
- invalid: ${formatStats(summary.sampleCountStats.invalid)}

## Aggregate Sample Stats

- hand unique average: ${formatStats(summary.handUniqueSourceCountAverageStats)}
- deck unique average: ${formatStats(summary.deckUniqueSourceCountAverageStats)}

### Hand Duplicate Pressure

| Bucket | Count |
|---|---:|
${formatCountRows(summary.handDuplicatePressureBucketCounts)}

### Deck Duplicate Pressure

| Bucket | Count |
|---|---:|
${formatCountRows(summary.deckDuplicatePressureBucketCounts)}

### Hand Deck Overlap

| Bucket | Count |
|---|---:|
${formatCountRows(summary.handDeckOverlapBucketCounts)}

## Interpretation Warning

This artifact is sampler-materialization infrastructure only. It makes no action-value, search-strength, rollout, gameplay-policy, or product-difficulty claim.

## Hidden-Info Safety

${summary.hiddenInfoSafetyNote}

## Non-Search Warning

${summary.explicitNonSearchWarning}
`;
};

const buildManifest = (
  result: SamplerMaterializationProfileResult,
  summaryJson: string,
  rootsJsonl: string,
  reportMarkdown: string,
): SamplerMaterializationArtifactManifest => ({
  schemaVersion: "sampler-materialization-artifact-v1",
  samplerRunId: result.samplerRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  files: [...samplerMaterializationArtifactFiles],
  rootRecordCount: result.roots.length,
  rootSchemaVersion: "sampler-materialization-root-v1",
  summarySchemaVersion: "sampler-materialization-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonSearchWarning: result.summary.explicitNonSearchWarning,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "roots.jsonl": sha256(rootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeSamplerMaterializationArtifacts = (
  result: SamplerMaterializationProfileResult,
): SerializedSamplerMaterializationArtifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const rootsJsonl =
    result.roots.length === 0
      ? ""
      : `${result.roots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown = buildSamplerMaterializationMarkdownReport(result);
  const manifestJson = stablePrettyJson(
    buildManifest(result, summaryJson, rootsJsonl, reportMarkdown),
  );

  return {
    manifestJson,
    summaryJson,
    rootsJsonl,
    reportMarkdown,
  };
};

export const writeSamplerMaterializationArtifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedSamplerMaterializationArtifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(resolve(outDir, "roots.jsonl"), artifacts.rootsJsonl, "utf8"),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...samplerMaterializationArtifactFiles],
  };
};

export const combinedSamplerMaterializationArtifactText = (
  artifacts: SerializedSamplerMaterializationArtifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.rootsJsonl,
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
  { label: "handSourceCounts", pattern: /\bhandSourceCounts\b/ },
  { label: "deckSourceCounts", pattern: /\bdeckSourceCounts\b/ },
  { label: "publicKnownSourceCounts", pattern: /\bpublicKnownSourceCounts\b/ },
  {
    label: "fixedKnownHandSourceCounts",
    pattern: /\bfixedKnownHandSourceCounts\b/,
  },
  { label: "remainingSourceCounts", pattern: /\bremainingSourceCounts\b/ },
  { label: "priorSourceCounts", pattern: /\bpriorSourceCounts\b/ },
  { label: "sampledSource", pattern: /\bsampledSource\b/ },
  { label: "materializedSource", pattern: /\bmaterializedSource\b/ },
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
  { label: "Geralt of Rivia", pattern: /\bGeralt of Rivia\b/ },
  {
    label: "Gaunter O'Dimm: Darkness",
    pattern: /\bGaunter O'Dimm: Darkness\b/,
  },
  { label: "neutral source id", pattern: /\bneutral\.geralt-of-rivia\b/ },
  {
    label: "northern-realms source id",
    pattern: /\bnorthern-realms\.philippa-eilhart\b/,
  },
  { label: "monsters source id", pattern: /\bmonsters\.crone-brewess\b/ },
  { label: "scoiatael source id", pattern: /\bscoiatael\.iorveth\b/ },
  { label: "skellige source id", pattern: /\bskellige\.cerys\b/ },
];

export const scanSamplerMaterializationArtifactsForHiddenInfo = (
  artifacts: SerializedSamplerMaterializationArtifacts,
) => {
  const combined = combinedSamplerMaterializationArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const samplerMaterializationArtifactHashes = (
  artifacts: SerializedSamplerMaterializationArtifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "roots.jsonl": sha256(artifacts.rootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
