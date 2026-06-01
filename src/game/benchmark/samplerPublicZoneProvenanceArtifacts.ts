import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  SamplerPublicZoneProvenanceProfileResult,
  SamplerPublicZoneProvenanceRootSchemaVersion,
  SamplerPublicZoneProvenanceSummarySchemaVersion,
} from "./samplerPublicZoneProvenance";

export type SamplerPublicZoneProvenanceArtifactSchemaVersion =
  "sampler-public-zone-provenance-artifact-v1";

export interface SamplerPublicZoneProvenanceArtifactManifest {
  schemaVersion: SamplerPublicZoneProvenanceArtifactSchemaVersion;
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  totalRootCount: number;
  invalidRootCount: number;
  invalidProvenanceRootCount: number;
  validRootCount: number;
  rootSchemaVersion: SamplerPublicZoneProvenanceRootSchemaVersion;
  summarySchemaVersion: SamplerPublicZoneProvenanceSummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
  recommendedNextStep: string;
  artifactHashes: Record<"summary.json" | "provenance-roots.jsonl" | "report.md", string>;
}

export interface SerializedSamplerPublicZoneProvenanceArtifacts {
  manifestJson: string;
  summaryJson: string;
  provenanceRootsJsonl: string;
  reportMarkdown: string;
}

export const samplerPublicZoneProvenanceArtifactFiles = [
  "manifest.json",
  "summary.json",
  "provenance-roots.jsonl",
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

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/sampler-public-zone-provenance/cFp64`;

const buildSamplerPublicZoneProvenanceMarkdownReport = (
  result: SamplerPublicZoneProvenanceProfileResult,
) => {
  const { summary } = result;
  return `# Sampler Public-Zone Provenance Casebook

## Run

- suite id: ${summary.suiteId}
- sampler run id: ${summary.samplerRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- total roots: ${summary.totalRootCount}
- valid roots: ${summary.validRootCount}
- invalid roots: ${summary.invalidRootCount}
- provenance roots: ${summary.invalidProvenanceRootCount}
- matches: ${summary.matchCount}

## Status Counts

| Status | Count |
|---|---:|
${formatCountRows(summary.statusCounts)}

## Prior Status

| Prior status | Count |
|---|---:|
${formatCountRows(summary.priorStatusCounts)}

## Materialization Status

| Materialization status | Count |
|---|---:|
${formatCountRows(summary.materializationStatusCounts)}

## Invalid Reasons

| Reason | Count |
|---|---:|
${formatCountRows(summary.invalidReasonCounts)}

## cFp62 Classifications Observed

| Classification | Count |
|---|---:|
${formatCountRows(summary.invalidRootClassificationCounts)}

## Provenance Labels

| Label | Count |
|---|---:|
${formatCountRows(summary.provenanceLabelCounts)}

## Provenance Root Distributions

### Phase

| Phase | Count |
|---|---:|
${formatCountRows(summary.provenanceRootCountsByPhase)}

### Round

| Round | Count |
|---|---:|
${formatCountRows(summary.provenanceRootCountsByRound)}

### Faction

| Faction | Count |
|---|---:|
${formatCountRows(summary.provenanceRootCountsByFaction)}

### Policy

| Policy | Count |
|---|---:|
${formatCountRows(summary.provenanceRootCountsByPolicy)}

### Deck Preset

| Deck preset | Count |
|---|---:|
${formatCountRows(summary.provenanceRootCountsByDeckPreset)}

### Matchup

| Matchup | Count |
|---|---:|
${formatCountRows(summary.provenanceRootCountsByMatchup)}

### Prior Deficit Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(summary.priorDeficitBucketCounts)}

### Dominant Public Zone

| Zone | Count |
|---|---:|
${formatCountRows(summary.dominantPublicZoneCounts)}

### Public Zone Shape

| Shape | Count |
|---|---:|
${formatCountRows(summary.publicZoneShapeCounts)}

## Scalar Count Stats

- public-zone references: ${formatStats(summary.publicZoneReferenceCountStats)}
- public-zone diversity: ${formatStats(summary.publicZoneDiversityCountStats)}
- prior deficit count: ${formatStats(summary.priorDeficitCountStats)}
- public known count: ${formatStats(summary.publicKnownCardCountStats)}
- fixed known hand count: ${formatStats(summary.fixedKnownHandCardCountStats)}

## Public Reference Diagnostics

- duplicate public references across all roots: ${summary.duplicatePublicReferenceTotal}
- duplicate fixed-known-hand references across all roots: ${summary.duplicateFixedKnownHandReferenceTotal}
- duplicate public reference count: ${formatStats(summary.duplicatePublicReferenceCountStats)}
- duplicate fixed-known-hand reference count: ${formatStats(summary.duplicateFixedKnownHandReferenceCountStats)}

## Public Adjustment Diagnostics

- provenance-root side-deck-only public cards: ${summary.sideDeckOnlyPublicTotal}
- provenance-root off-prior public cards: ${summary.offPriorPublicTotal}
- provenance-root public adjustment count: ${summary.publicAdjustmentTotal}
- provenance-root uncovered prior deficit count: ${summary.uncoveredPriorDeficitTotal}
- provenance-root main-deck-attributable public count: ${formatStats(summary.mainDeckAttributablePublicCountStats)}
- provenance-root side-deck-only public count: ${formatStats(summary.sideDeckOnlyPublicCountStats)}
- provenance-root off-prior public count: ${formatStats(summary.offPriorPublicCountStats)}
- provenance-root public adjustment count: ${formatStats(summary.publicAdjustmentCountStats)}
- provenance-root uncovered prior deficit count: ${formatStats(summary.uncoveredPriorDeficitCountStats)}

| Adjustment reason | Count |
|---|---:|
${formatCountRows(summary.publicAdjustmentReasonCounts)}

## Hidden-Info Safety

${summary.hiddenInfoSafetyNote}

## Non-Search Warning

${summary.explicitNonSearchWarning}

## Recommendation For Next Phase

${summary.recommendedNextStep}
`;
};

const buildManifest = (
  result: SamplerPublicZoneProvenanceProfileResult,
  summaryJson: string,
  provenanceRootsJsonl: string,
  reportMarkdown: string,
): SamplerPublicZoneProvenanceArtifactManifest => ({
  schemaVersion: "sampler-public-zone-provenance-artifact-v1",
  samplerRunId: result.samplerRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  relativeOutputPath: relativeOutputPath(result.suiteId),
  generatedAtTimestampPolicy:
    "omitted from committed artifacts so cFp64 hashes remain deterministic",
  files: [...samplerPublicZoneProvenanceArtifactFiles],
  totalRootCount: result.summary.totalRootCount,
  invalidRootCount: result.summary.invalidRootCount,
  invalidProvenanceRootCount: result.summary.invalidProvenanceRootCount,
  validRootCount: result.summary.validRootCount,
  rootSchemaVersion: "sampler-public-zone-provenance-root-v1",
  summarySchemaVersion: "sampler-public-zone-provenance-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonSearchWarning: result.summary.explicitNonSearchWarning,
  recommendedNextStep: result.summary.recommendedNextStep,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "provenance-roots.jsonl": sha256(provenanceRootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeSamplerPublicZoneProvenanceArtifacts = (
  result: SamplerPublicZoneProvenanceProfileResult,
): SerializedSamplerPublicZoneProvenanceArtifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const provenanceRootsJsonl =
    result.provenanceRoots.length === 0
      ? ""
      : `${result.provenanceRoots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown = buildSamplerPublicZoneProvenanceMarkdownReport(result);
  const manifestJson = stablePrettyJson(
    buildManifest(result, summaryJson, provenanceRootsJsonl, reportMarkdown),
  );

  return {
    manifestJson,
    summaryJson,
    provenanceRootsJsonl,
    reportMarkdown,
  };
};

export const writeSamplerPublicZoneProvenanceArtifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedSamplerPublicZoneProvenanceArtifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(
      resolve(outDir, "provenance-roots.jsonl"),
      artifacts.provenanceRootsJsonl,
      "utf8",
    ),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...samplerPublicZoneProvenanceArtifactFiles],
  };
};

export const combinedSamplerPublicZoneProvenanceArtifactText = (
  artifacts: SerializedSamplerPublicZoneProvenanceArtifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.provenanceRootsJsonl,
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
  { label: "rawState", pattern: /\brawState\b/ },
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
];

export const scanSamplerPublicZoneProvenanceArtifactsForHiddenInfo = (
  artifacts: SerializedSamplerPublicZoneProvenanceArtifacts,
) => {
  const combined = combinedSamplerPublicZoneProvenanceArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const samplerPublicZoneProvenanceArtifactHashes = (
  artifacts: SerializedSamplerPublicZoneProvenanceArtifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "provenance-roots.jsonl": sha256(artifacts.provenanceRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
