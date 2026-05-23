import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  SamplerReadinessProfileResult,
  SamplerReadinessRootSchemaVersion,
  SamplerReadinessSummarySchemaVersion,
} from "./samplerReadiness";

export type SamplerReadinessArtifactSchemaVersion = "sampler-readiness-artifact-v1";

export interface SamplerReadinessArtifactManifest {
  schemaVersion: SamplerReadinessArtifactSchemaVersion;
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  files: string[];
  rootRecordCount: number;
  rootSchemaVersion: SamplerReadinessRootSchemaVersion;
  summarySchemaVersion: SamplerReadinessSummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
  artifactHashes: Record<"summary.json" | "roots.jsonl" | "report.md", string>;
}

export interface SerializedSamplerReadinessArtifacts {
  manifestJson: string;
  summaryJson: string;
  rootsJsonl: string;
  reportMarkdown: string;
}

export const samplerReadinessArtifactFiles = [
  "manifest.json",
  "summary.json",
  "roots.jsonl",
  "report.md",
] as const;

const sortJsonValue = (value: unknown): unknown => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
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

const formatStats = (stats: { count: number; min: number; max: number; average: number; p50: number; p90: number; p95: number }) =>
  `count ${stats.count}, min ${stats.min}, max ${stats.max}, avg ${formatNumber(stats.average)}, p50 ${stats.p50}, p90 ${stats.p90}, p95 ${stats.p95}`;

const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));

const formatCountRows = (record: Record<string, number>) =>
  sortedEntries(record)
    .map(([key, count]) => `| ${key} | ${count} |`)
    .join("\n");

const formatMaxPublicActionRoot = (
  root: SamplerReadinessProfileResult["summary"]["maxPublicActionRoot"],
) => {
  if (!root) return "- none";
  return [
    `- root fingerprint: ${root.rootPublicFingerprint}`,
    `- matchup: ${root.matchupId}`,
    `- seed: ${String(root.seed)}`,
    ...(root.mirrorIndex === undefined ? [] : [`- mirror index: ${root.mirrorIndex}`]),
    `- step: ${root.step}`,
    `- phase: ${root.phase}`,
    `- round: ${root.round}`,
    `- seat: ${root.seatId}`,
    `- policy: ${root.policyId}`,
    `- faction: ${root.faction}`,
    `- deck preset: ${root.deckPresetId}`,
    `- public action count: ${root.publicActionCount}`,
  ].join("\n");
};

const formatMaxCollisionRoot = (
  root: SamplerReadinessProfileResult["summary"]["maxCollisionRoot"],
) => {
  if (!root) return "- none";
  return [
    `- root fingerprint: ${root.rootPublicFingerprint}`,
    `- matchup: ${root.matchupId}`,
    `- seed: ${String(root.seed)}`,
    ...(root.mirrorIndex === undefined ? [] : [`- mirror index: ${root.mirrorIndex}`]),
    `- step: ${root.step}`,
    `- phase: ${root.phase}`,
    `- round: ${root.round}`,
    `- seat: ${root.seatId}`,
    `- policy: ${root.policyId}`,
    `- faction: ${root.faction}`,
    `- deck preset: ${root.deckPresetId}`,
    `- public action collision count: ${root.publicActionCollisionCount}`,
  ].join("\n");
};

const buildSamplerReadinessMarkdownReport = (
  result: SamplerReadinessProfileResult,
) => {
  const { summary } = result;

  return `# Sampler Readiness Root Profiler Report

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

## Validation Status

| Validation status | Count |
|---|---:|
${formatCountRows(summary.validationStatusCounts)}

## Invalid Reason Counts

| Reason | Count |
|---|---:|
${formatCountRows(summary.invalidReasonCounts)}

## Sample Count Stats

- samples: ${formatStats(summary.sampleCountStats)}

## Public Action Count Stats

- public actions: ${formatStats(summary.publicActionCountStats)}

## Collision Count Stats

- collisions: ${formatStats(summary.collisionCountStats)}

## Largest Bucket Stats

- largest bucket: ${formatStats(summary.largestBucketStats)}

## Largest Public Action Root

${formatMaxPublicActionRoot(summary.maxPublicActionRoot)}

## Largest Collision Root

${formatMaxCollisionRoot(summary.maxCollisionRoot)}

## Public Action Kind Distribution

| Kind | Count |
|---|---:|
${formatCountRows(summary.maxPublicActionRoot ? {} : {})}

## Timing Policy

Committed cFp60 artifacts intentionally omit wall-clock timing so repeated runs produce stable hashes. Runtime timing should be collected later in a separated local timing profile.

## Interpretation Warning

This artifact is sampler-readiness infrastructure only. No rollout, search, action-evaluation, or policy-behavior change occurred. It is not search strength, not rollout evidence, not a new gameplay policy, and not product difficulty.

## Hidden-Info Safety

${summary.hiddenInfoSafetyNote}

## Non-Search Warning

${summary.explicitNonSearchWarning}
`;
};

const buildManifest = (
  result: SamplerReadinessProfileResult,
  summaryJson: string,
  rootsJsonl: string,
  reportMarkdown: string,
): SamplerReadinessArtifactManifest => ({
  schemaVersion: "sampler-readiness-artifact-v1",
  samplerRunId: result.samplerRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  files: [...samplerReadinessArtifactFiles],
  rootRecordCount: result.roots.length,
  rootSchemaVersion: "sampler-readiness-root-v1",
  summarySchemaVersion: "sampler-readiness-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonSearchWarning: result.summary.explicitNonSearchWarning,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "roots.jsonl": sha256(rootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeSamplerReadinessArtifacts = (
  result: SamplerReadinessProfileResult,
): SerializedSamplerReadinessArtifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const rootsJsonl =
    result.roots.length === 0
      ? ""
      : `${result.roots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown = buildSamplerReadinessMarkdownReport(result);
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

export const writeSamplerReadinessArtifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedSamplerReadinessArtifacts;
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
    files: [...samplerReadinessArtifactFiles],
  };
};

export const combinedSamplerReadinessArtifactText = (
  artifacts: SerializedSamplerReadinessArtifacts,
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
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
];

export const scanSamplerReadinessArtifactsForHiddenInfo = (
  artifacts: SerializedSamplerReadinessArtifacts,
) => {
  const combined = combinedSamplerReadinessArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const samplerReadinessArtifactHashes = (
  artifacts: SerializedSamplerReadinessArtifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "roots.jsonl": sha256(artifacts.rootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
