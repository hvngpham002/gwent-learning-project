import { benchmarkStatuses } from "./summaries";
import type { BenchmarkOutcomeCounts, BenchmarkRunDiagnostic, BenchmarkRunResult } from "./types";

export type BenchmarkArtifactSchemaVersion = "benchmark-artifact-v1";

export interface BenchmarkArtifactManifest {
  schemaVersion: BenchmarkArtifactSchemaVersion;
  suiteId: string;
  benchmarkRunId: string;
  files: string[];
  recordCount: number;
  summarySchemaVersion: "benchmark-summary-v1";
  recordSchemaVersion: "benchmark-match-v1";
  hiddenInfoSafetyNote: string;
}

export interface BenchmarkArtifactBundle {
  manifestJson: string;
  summaryJson: string;
  recordsJsonl: string;
  reportMarkdown: string;
}

export const benchmarkArtifactFiles = ["manifest.json", "summary.json", "records.jsonl", "report.md"] as const;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const HIDDEN_INFO_SAFETY_NOTE =
  "Default artifacts contain only public benchmark records and summaries. They do not serialize unsafe debug results, raw state, command logs, event logs, hand arrays, deck arrays/order, observations, or runtime card instance ids.";

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

const formatNumber = (value: number) => Number(value.toFixed(3)).toString();

const formatOutcomeCounts = (counts: BenchmarkOutcomeCounts) =>
  `${counts.wins} win / ${counts.losses} loss / ${counts.draws} draw / ${counts.none} none`;

const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));

const sanitizeDiagnosticMessage = (message: string) =>
  message
    .replace(/\bseat_[ab]:[A-Za-z0-9_.:-]+/g, "runtime-card-id-redacted")
    .replace(/\bcardsById\b/g, "redacted-field")
    .replace(/\bfinalState\b/g, "redacted-field")
    .replace(/\bcommandLog\b/g, "redacted-field")
    .replace(/\bownHand\b/g, "redacted-field")
    .replace(/\bopponentHand\b/g, "redacted-field")
    .replace(/\bunsafeDebugResults\b/g, "redacted-field");

const formatDiagnostics = (diagnostics: readonly BenchmarkRunDiagnostic[]) => {
  if (diagnostics.length === 0) {
    return "- none";
  }

  return diagnostics
    .map((diagnostic) => {
      const mirror = diagnostic.mirrorIndex === undefined ? "" : ` mirror ${diagnostic.mirrorIndex}`;
      return `- ${diagnostic.code}: ${diagnostic.matchupId} seed ${String(diagnostic.seed)}${mirror} - ${sanitizeDiagnosticMessage(diagnostic.message)}`;
    })
    .join("\n");
};

const buildMarkdownReport = (result: BenchmarkRunResult) => {
  const { summary } = result;
  const statusRows = benchmarkStatuses
    .map((status) => `| ${status} | ${summary.statusCounts[status]} |`)
    .join("\n");
  const policyRows = sortedEntries(summary.resultCountsByPolicy)
    .map(([policyId, counts]) => `| ${policyId} | ${formatOutcomeCounts(counts)} |`)
    .join("\n");
  const deckRows = sortedEntries(summary.resultCountsByDeck)
    .map(([deckPresetId, counts]) => `| ${deckPresetId} | ${formatOutcomeCounts(counts)} |`)
    .join("\n");
  const matchupRows = summary.matchupSummaries
    .map(
      (matchup) =>
        `| ${matchup.matchupId} | ${matchup.totalMatches} | ${formatNumber(matchup.averageSteps)} | ${formatNumber(matchup.averageCommands)} | ${formatNumber(matchup.averageLegalMoves)} |`,
    )
    .join("\n");

  return `# Benchmark Report

## Run

- suite id: ${summary.suiteId}
- benchmark run id: ${summary.benchmarkRunId}
- matchup ids: ${result.suite.matchupIds.join(", ")}
- policies: ${summary.policyIds.join(", ")}
- deck preset ids: ${summary.deckPresetIds.join(", ")}
- total matches: ${summary.totalMatches}

## Status Counts

| Status | Count |
|---|---:|
${statusRows}

## Replay

- replay checked: ${summary.replayCheckedCount}
- replay failed: ${summary.replayFailedCount}

## Result Counts By Policy

| Policy | Results |
|---|---|
${policyRows}

## Result Counts By Deck

| Deck preset | Results |
|---|---|
${deckRows}

## Averages

- steps: ${formatNumber(summary.averageSteps)}
- commands: ${formatNumber(summary.averageCommands)}
- legal moves: ${formatNumber(summary.averageLegalMoves)}

## Matchups

| Matchup | Matches | Avg steps | Avg commands | Avg legal moves |
|---|---:|---:|---:|---:|
${matchupRows}

## Diagnostics

${formatDiagnostics(result.diagnostics)}
`;
};

export const buildBenchmarkArtifactManifest = (result: BenchmarkRunResult): BenchmarkArtifactManifest => ({
  schemaVersion: "benchmark-artifact-v1",
  suiteId: result.summary.suiteId,
  benchmarkRunId: result.summary.benchmarkRunId,
  files: [...benchmarkArtifactFiles],
  recordCount: result.records.length,
  summarySchemaVersion: result.summary.schemaVersion,
  recordSchemaVersion: "benchmark-match-v1",
  hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
});

export const buildBenchmarkArtifactBundle = (result: BenchmarkRunResult): BenchmarkArtifactBundle => ({
  manifestJson: stablePrettyJson(buildBenchmarkArtifactManifest(result)),
  summaryJson: stablePrettyJson(result.summary),
  recordsJsonl: `${result.records.map(stableJsonLine).join("\n")}\n`,
  reportMarkdown: buildMarkdownReport(result),
});
