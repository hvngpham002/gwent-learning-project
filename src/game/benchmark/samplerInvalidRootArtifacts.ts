import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  SamplerInvalidRootSchemaVersion,
  SamplerInvalidRootSummarySchemaVersion,
  SamplerInvalidRootsProfileResult,
} from "./samplerInvalidRoots";

export type SamplerInvalidRootArtifactSchemaVersion =
  "sampler-invalid-root-artifact-v1";

export interface SamplerInvalidRootArtifactManifest {
  schemaVersion: SamplerInvalidRootArtifactSchemaVersion;
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  files: string[];
  totalRootCount: number;
  invalidRootCount: number;
  validRootCount: number;
  rootSchemaVersion: SamplerInvalidRootSchemaVersion;
  summarySchemaVersion: SamplerInvalidRootSummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
  recommendedNextStep: string;
  artifactHashes: Record<"summary.json" | "invalid-roots.jsonl" | "report.md", string>;
}

export interface SerializedSamplerInvalidRootArtifacts {
  manifestJson: string;
  summaryJson: string;
  invalidRootsJsonl: string;
  reportMarkdown: string;
}

export const samplerInvalidRootArtifactFiles = [
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

const buildSamplerInvalidRootMarkdownReport = (
  result: SamplerInvalidRootsProfileResult,
) => {
  const { summary } = result;
  return `# Sampler Invalid-Root Casebook

## Run

- suite id: ${summary.suiteId}
- sampler run id: ${summary.samplerRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- total roots: ${summary.totalRootCount}
- valid roots: ${summary.validRootCount}
- invalid roots: ${summary.invalidRootCount}
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

## Classifications

| Classification | Count |
|---|---:|
${formatCountRows(summary.classificationCounts)}

## Invalid Root Distributions

### Phase

| Phase | Count |
|---|---:|
${formatCountRows(summary.invalidRootCountsByPhase)}

### Round

| Round | Count |
|---|---:|
${formatCountRows(summary.invalidRootCountsByRound)}

### Faction

| Faction | Count |
|---|---:|
${formatCountRows(summary.invalidRootCountsByFaction)}

### Policy

| Policy | Count |
|---|---:|
${formatCountRows(summary.invalidRootCountsByPolicy)}

### Deck Preset

| Deck preset | Count |
|---|---:|
${formatCountRows(summary.invalidRootCountsByDeckPreset)}

### Matchup

| Matchup | Count |
|---|---:|
${formatCountRows(summary.invalidRootCountsByMatchup)}

### Public Known Count Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(summary.invalidRootCountsByPublicKnownCountBucket)}

### Fixed Known Hand Count Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(summary.invalidRootCountsByFixedKnownHandCountBucket)}

### Hidden Count Deficit Bucket

| Bucket | Count |
|---|---:|
${formatCountRows(summary.invalidRootCountsByHiddenCountDeficitBucket)}

## Scalar Count Stats

- opponent hand count: ${formatStats(summary.opponentHandCountStats)}
- opponent deck count: ${formatStats(summary.opponentDeckCountStats)}
- opponent hidden count: ${formatStats(summary.opponentHiddenCountStats)}
- public known count: ${formatStats(summary.publicKnownCardCountStats)}
- fixed known hand count: ${formatStats(summary.fixedKnownHandCardCountStats)}
- required hidden draw count: ${formatStats(summary.requiredHiddenDrawCountStats)}
- prior remaining count: ${formatStats(summary.priorRemainingCardCountStats)}
- prior deficit count: ${formatStats(summary.priorDeficitCountStats)}

## Hidden-Info Safety

${summary.hiddenInfoSafetyNote}

## Non-Search Warning

${summary.explicitNonSearchWarning}

## Recommendation For cFp63

${summary.recommendedNextStep}
`;
};

const buildManifest = (
  result: SamplerInvalidRootsProfileResult,
  summaryJson: string,
  invalidRootsJsonl: string,
  reportMarkdown: string,
): SamplerInvalidRootArtifactManifest => ({
  schemaVersion: "sampler-invalid-root-artifact-v1",
  samplerRunId: result.samplerRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  files: [...samplerInvalidRootArtifactFiles],
  totalRootCount: result.summary.totalRootCount,
  invalidRootCount: result.summary.invalidRootCount,
  validRootCount: result.summary.validRootCount,
  rootSchemaVersion: "sampler-invalid-root-v1",
  summarySchemaVersion: "sampler-invalid-root-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonSearchWarning: result.summary.explicitNonSearchWarning,
  recommendedNextStep: result.summary.recommendedNextStep,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "invalid-roots.jsonl": sha256(invalidRootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeSamplerInvalidRootArtifacts = (
  result: SamplerInvalidRootsProfileResult,
): SerializedSamplerInvalidRootArtifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const invalidRootsJsonl =
    result.invalidRoots.length === 0
      ? ""
      : `${result.invalidRoots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown = buildSamplerInvalidRootMarkdownReport(result);
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

export const writeSamplerInvalidRootArtifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedSamplerInvalidRootArtifacts;
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
    files: [...samplerInvalidRootArtifactFiles],
  };
};

export const combinedSamplerInvalidRootArtifactText = (
  artifacts: SerializedSamplerInvalidRootArtifacts,
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
  { label: "handSourceCounts", pattern: /\bhandSourceCounts\b/ },
  { label: "deckSourceCounts", pattern: /\bdeckSourceCounts\b/ },
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

export const scanSamplerInvalidRootArtifactsForHiddenInfo = (
  artifacts: SerializedSamplerInvalidRootArtifacts,
) => {
  const combined = combinedSamplerInvalidRootArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const samplerInvalidRootArtifactHashes = (
  artifacts: SerializedSamplerInvalidRootArtifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "invalid-roots.jsonl": sha256(artifacts.invalidRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
