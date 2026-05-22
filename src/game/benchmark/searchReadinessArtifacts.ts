import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  SearchReadinessCountStats,
  SearchReadinessProfileResult,
  SearchReadinessRootSchemaVersion,
  SearchReadinessSummarySchemaVersion,
} from "./searchReadiness";

export type SearchReadinessArtifactSchemaVersion = "search-readiness-artifact-v1";

export interface SearchReadinessArtifactManifest {
  schemaVersion: SearchReadinessArtifactSchemaVersion;
  profileRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  files: string[];
  rootRecordCount: number;
  rootSchemaVersion: SearchReadinessRootSchemaVersion;
  summarySchemaVersion: SearchReadinessSummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  artifactHashes: Record<"summary.json" | "roots.jsonl" | "report.md", string>;
}

export interface SerializedSearchReadinessArtifacts {
  manifestJson: string;
  summaryJson: string;
  rootsJsonl: string;
  reportMarkdown: string;
}

export const searchReadinessArtifactFiles = [
  "manifest.json",
  "summary.json",
  "roots.jsonl",
  "report.md",
] as const;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const HIDDEN_INFO_SAFETY_NOTE =
  "Search-readiness artifacts contain public root metadata and scalar/count summaries only. They exclude raw state, private card payloads, command/event payloads, action payloads, and runtime card identifiers.";

const sortJsonValue = (value: unknown): JsonValue => {
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

const stablePrettyJson = (value: unknown) => `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;

const stableJsonLine = (value: unknown) => JSON.stringify(sortJsonValue(value));

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

const formatNumber = (value: number) => Number(value.toFixed(3)).toString();

const formatStats = (stats: SearchReadinessCountStats) =>
  `count ${stats.count}, min ${stats.min}, max ${stats.max}, avg ${formatNumber(stats.average)}, p50 ${stats.p50}, p90 ${stats.p90}, p95 ${stats.p95}`;

const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));

const formatCountRows = (record: Record<string, number>) =>
  sortedEntries(record)
    .map(([key, count]) => `| ${key} | ${count} |`)
    .join("\n");

const formatStatusRows = (record: Record<string, number>) => formatCountRows(record);

const formatDistributionRows = (record: Record<string, number>) => formatCountRows(record);

const formatMaxLegalMoveRoot = (root: SearchReadinessProfileResult["summary"]["maxLegalMoveRoot"]) => {
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
    `- legal move count: ${root.legalMoveCount}`,
  ].join("\n");
};

const formatMaxTargetExpansionRoot = (
  root: SearchReadinessProfileResult["summary"]["maxTargetExpansionRoot"],
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
    `- target expansion count: ${root.playCardTargetExpansionCount}`,
  ].join("\n");
};

const buildSearchReadinessMarkdownReport = (result: SearchReadinessProfileResult) => {
  const { summary } = result;
  return `# Search-Readiness Root Profiler Report

## Run

- suite id: ${summary.suiteId}
- profile run id: ${summary.profileRunId}
- root records: ${summary.rootRecordCount}
- matches: ${summary.matchCount}

## Status Counts

| Status | Count |
|---|---:|
${formatStatusRows(summary.statusCounts)}

## Phase Distribution

| Phase | Roots |
|---|---:|
${formatDistributionRows(summary.rootCountsByPhase)}

## Policy Distribution

| Policy | Roots |
|---|---:|
${formatDistributionRows(summary.rootCountsByPolicy)}

## Faction Distribution

| Faction | Roots |
|---|---:|
${formatDistributionRows(summary.rootCountsByFaction)}

## Deck Distribution

| Deck preset | Roots |
|---|---:|
${formatDistributionRows(summary.rootCountsByDeckPreset)}

## Move Presence

| Move kind | Roots with kind |
|---|---:|
${formatDistributionRows(summary.rootCountsByMoveKindPresence)}

## Count Stats

- legal moves: ${formatStats(summary.legalMoveCountStats)}
- play-card moves: ${formatStats(summary.playCardMoveCountStats)}
- play-card sources: ${formatStats(summary.playCardSourceCountStats)}
- target expansion: ${formatStats(summary.playCardTargetExpansionStats)}
- targeted moves: ${formatStats(summary.targetedMoveCountStats)}
- prompt options: ${formatStats(summary.promptOptionCountStats)}
- mulligan options: ${formatStats(summary.mulliganOptionCountStats)}

## Largest Legal-Move Root

${formatMaxLegalMoveRoot(summary.maxLegalMoveRoot)}

## Largest Target-Expansion Root

${formatMaxTargetExpansionRoot(summary.maxTargetExpansionRoot)}

## Timing Policy

Committed cFp59 artifacts intentionally omit wall-clock root timing so repeated runs produce stable hashes. Runtime timing should be collected later in a separated local timing profile.

## Interpretation Warning

This artifact is profiler evidence for branching and structural budget pressure only. It is not search strength, not rollout evidence, not a new gameplay policy, and not product difficulty.
`;
};

const buildManifest = (
  result: SearchReadinessProfileResult,
  summaryJson: string,
  rootsJsonl: string,
  reportMarkdown: string,
): SearchReadinessArtifactManifest => ({
  schemaVersion: "search-readiness-artifact-v1",
  profileRunId: result.profileRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  files: [...searchReadinessArtifactFiles],
  rootRecordCount: result.roots.length,
  rootSchemaVersion: "search-readiness-root-v1",
  summarySchemaVersion: "search-readiness-summary-v1",
  hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "roots.jsonl": sha256(rootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeSearchReadinessArtifacts = (
  result: SearchReadinessProfileResult,
): SerializedSearchReadinessArtifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const rootsJsonl = result.roots.length === 0 ? "" : `${result.roots.map(stableJsonLine).join("\n")}\n`;
  const reportMarkdown = buildSearchReadinessMarkdownReport(result);
  const manifestJson = stablePrettyJson(buildManifest(result, summaryJson, rootsJsonl, reportMarkdown));

  return {
    manifestJson,
    summaryJson,
    rootsJsonl,
    reportMarkdown,
  };
};

export const writeSearchReadinessArtifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedSearchReadinessArtifacts;
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
    files: [...searchReadinessArtifactFiles],
  };
};

export const combinedSearchReadinessArtifactText = (artifacts: SerializedSearchReadinessArtifacts) =>
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
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
];

export const scanSearchReadinessArtifactsForHiddenInfo = (
  artifacts: SerializedSearchReadinessArtifacts,
) => {
  const combined = combinedSearchReadinessArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const searchReadinessArtifactHashes = (artifacts: SerializedSearchReadinessArtifacts) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "roots.jsonl": sha256(artifacts.rootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
