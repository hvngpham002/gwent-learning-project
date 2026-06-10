import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type {
  DeterminizedPimcPostOnePlyBranchingBudgetCasebookReadinessStatus,
  DeterminizedPimcPostOnePlyBranchingBudgetCasebookResult,
  DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootSchemaVersion,
  DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootSchemaVersion,
  DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummarySchemaVersion,
} from "./determinizedPimcPostOnePlyBranchingBudgetCasebook";

export type DeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactSchemaVersion =
  "determinized-pimc-post-one-ply-branching-budget-casebook-artifact-v1";

export interface DeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactManifest {
  schemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactSchemaVersion;
  casebookRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp72RunId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  casebookReadinessStatus: DeterminizedPimcPostOnePlyBranchingBudgetCasebookReadinessStatus;
  branchingRootCount: number;
  casebookRootCount: number;
  skippedRootCount: number;
  rootSchemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootSchemaVersion;
  skippedRootSchemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootSchemaVersion;
  summarySchemaVersion: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp74Recommendation: string;
  artifactHashes: Record<
    | "summary.json"
    | "casebook-roots.jsonl"
    | "skipped-roots.jsonl"
    | "report.md",
    string
  >;
}

export interface SerializedDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts {
  manifestJson: string;
  summaryJson: string;
  casebookRootsJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const determinizedPimcPostOnePlyBranchingBudgetCasebookArtifactFiles = [
  "manifest.json",
  "summary.json",
  "casebook-roots.jsonl",
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
  if (Array.isArray(value)) return value.map(sortJsonValue);
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

const formatNestedCountRows = (
  record: Record<string, Record<string, number>>,
) => {
  const rows = sortedEntries(record).flatMap(([outer, inner]) =>
    sortedEntries(inner).map(
      ([innerKey, count]) => `| ${outer} | ${innerKey} | ${count} |`,
    ),
  );
  if (rows.length === 0) return "| none | none | 0 |";
  return rows.join("\n");
};

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/determinized-pimc-post-one-ply-branching-budget-casebook/cFp73`;

const buildMarkdownReport = (
  result: DeterminizedPimcPostOnePlyBranchingBudgetCasebookResult,
) => {
  const { summary } = result;
  return `# Determinized PIMC Post-One-Ply Branching Budget Casebook

## Run

- suite id: ${summary.suiteId}
- casebook run id: ${summary.casebookRunId}
- source cFp72 run id: ${summary.sourceCfp72RunId}
- readiness: ${summary.casebookReadinessStatus}
- cFp72 roots: ${summary.totalCfp72RootCount}
- branching roots: ${summary.branchingRootCount}
- casebook roots: ${summary.casebookRootCount}
- skipped roots: ${summary.skippedRootCount}
- skipped-root percentage: ${formatPercent(summary.skippedRootPercentage)}
- casebook share of branching roots: ${formatPercent(summary.casebookRootPercentageOfBranchingRoots)}

## Source Inputs

| Input | SHA-256 |
|---|---|
${summary.sourceCfp72ArtifactReferences
  .map((reference) => `| ${reference.relativePath} | ${reference.sha256} |`)
  .join("\n")}

## Source Consistency

| Check | Count |
|---|---:|
| source cFp72 summary not ready | ${summary.sourceConsistency.sourceCfp72SummaryNotReady} |
| branching roots read | ${summary.sourceConsistency.branchingRootsRead} |
| skipped roots read | ${summary.sourceConsistency.skippedRootsRead} |
| branching-root count delta | ${summary.sourceConsistency.branchingRootCountDelta} |
| skipped-root count delta | ${summary.sourceConsistency.skippedRootCountDelta} |
| duplicate branching keys | ${summary.sourceConsistency.duplicateBranchingRootKeys} |
| duplicate skipped keys | ${summary.sourceConsistency.duplicateSkippedRootKeys} |
| failed or deferred branching roots | ${summary.sourceConsistency.branchingRootsWithFailedOrDeferredPairs} |
| status anomaly roots | ${summary.sourceConsistency.branchingRootsWithProbeStatusAnomaly} |
| blocked bucket roots | ${summary.sourceConsistency.branchingRootsWithBlockedBudgetBucket} |
| bucket mismatch checks | ${summary.sourceConsistency.summaryBucketMismatchCount} |
| missing source hashes | ${summary.sourceConsistency.missingSourceArtifactHashCount} |

## Casebook Labels

| Label | Roots |
|---|---:|
${formatCountRows(summary.casebookLabelCounts)}

### Primary Labels

| Primary label | Roots |
|---|---:|
${formatCountRows(summary.primaryCasebookLabelCounts)}

### Budget Pressure

| Budget pressure | Roots |
|---|---:|
${formatCountRows(summary.budgetPressureLabelCounts)}

### Transition Context

| Transition context | Roots |
|---|---:|
${formatCountRows(summary.transitionContextLabelCounts)}

### cFp74 Row Hints

| Hint | Roots |
|---|---:|
${formatCountRows(summary.cFp74ReadinessHintCounts)}

## Casebook Counters

### Phase

| Phase | Roots |
|---|---:|
${formatCountRows(summary.casebookCounters.byPhase)}

### Round

| Round | Roots |
|---|---:|
${formatCountRows(summary.casebookCounters.byRound)}

### Policy

| Policy | Roots |
|---|---:|
${formatCountRows(summary.casebookCounters.byPolicy)}

### Faction

| Faction | Roots |
|---|---:|
${formatCountRows(summary.casebookCounters.byFaction)}

### Deck Preset

| Deck preset | Roots |
|---|---:|
${formatCountRows(summary.casebookCounters.byDeckPreset)}

### Matchup

| Matchup | Roots |
|---|---:|
${formatCountRows(summary.casebookCounters.byMatchup)}

## Primary Label Cross-Tabs

### By Phase

| Primary label | Phase | Roots |
|---|---|---:|
${formatNestedCountRows(summary.primaryCasebookLabelCrossCounts.byPhase)}

### By Round

| Primary label | Round | Roots |
|---|---|---:|
${formatNestedCountRows(summary.primaryCasebookLabelCrossCounts.byRound)}

### By Policy

| Primary label | Policy | Roots |
|---|---|---:|
${formatNestedCountRows(summary.primaryCasebookLabelCrossCounts.byPolicy)}

### By Faction

| Primary label | Faction | Roots |
|---|---|---:|
${formatNestedCountRows(summary.primaryCasebookLabelCrossCounts.byFaction)}

### By Post-One-Ply Actor Label

| Primary label | Actor label | Roots |
|---|---|---:|
${formatNestedCountRows(
  summary.primaryCasebookLabelCrossCounts.byPostOnePlyActorLabel,
)}

### By Post-One-Ply Phase Label

| Primary label | Phase label | Roots |
|---|---|---:|
${formatNestedCountRows(
  summary.primaryCasebookLabelCrossCounts.byPostOnePlyPhaseLabel,
)}

## First-Ply Public Action Kind Aggregates

Per-root first-ply kind attribution is not available in the cFp72 compact root rows, so cFp73 records only the cFp72 suite-level aggregate tables.

### Branching Status By Kind

| Kind | Status | Count |
|---|---|---:|
${formatNestedCountRows(
  summary.sourceCfp72FirstPlyPublicActionKindAggregates
    .aggregateBranchingStatusCountsByKind,
)}

### Actor By Kind

| Kind | Actor | Count |
|---|---|---:|
${formatNestedCountRows(
  summary.sourceCfp72FirstPlyPublicActionKindAggregates
    .aggregateActorCountsByKind,
)}

### Budget Bucket By Kind

| Kind | Bucket | Count |
|---|---|---:|
${formatNestedCountRows(
  summary.sourceCfp72FirstPlyPublicActionKindAggregates
    .aggregateBudgetBucketCountsByKind,
)}

## Skip Counters

### Phase

| Phase | Skipped roots |
|---|---:|
${formatCountRows(summary.skipCounters.byPhase ?? {})}

### Round

| Round | Skipped roots |
|---|---:|
${formatCountRows(summary.skipCounters.byRound ?? {})}

### Policy

| Policy | Skipped roots |
|---|---:|
${formatCountRows(summary.skipCounters.byPolicy ?? {})}

### Faction

| Faction | Skipped roots |
|---|---:|
${formatCountRows(summary.skipCounters.byFaction ?? {})}

## Boundary

${summary.hiddenInfoSafetyNote}

## Explicit Non-Claims

${summary.explicitNonClaims.map((claim) => `- ${claim}`).join("\n")}

## Recommendation For cFp74

${summary.cFp74Recommendation}
`;
};

const buildManifest = (
  result: DeterminizedPimcPostOnePlyBranchingBudgetCasebookResult,
  summaryJson: string,
  casebookRootsJsonl: string,
  skippedRootsJsonl: string,
  reportMarkdown: string,
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactManifest => ({
  schemaVersion:
    "determinized-pimc-post-one-ply-branching-budget-casebook-artifact-v1",
  casebookRunId: result.casebookRunId,
  suiteId: result.suiteId,
  sourceBenchmarkSuiteId: result.sourceBenchmarkSuiteId,
  sourceCfp72RunId: result.sourceCfp72RunId,
  relativeOutputPath: relativeOutputPath(result.suiteId),
  generatedAtTimestampPolicy:
    "omitted from committed artifacts so cFp73 hashes remain deterministic",
  files: [...determinizedPimcPostOnePlyBranchingBudgetCasebookArtifactFiles],
  casebookReadinessStatus: result.summary.casebookReadinessStatus,
  branchingRootCount: result.summary.branchingRootCount,
  casebookRootCount: result.summary.casebookRootCount,
  skippedRootCount: result.summary.skippedRootCount,
  rootSchemaVersion:
    "determinized-pimc-post-one-ply-branching-budget-casebook-root-v1",
  skippedRootSchemaVersion:
    "determinized-pimc-post-one-ply-branching-budget-casebook-skipped-root-v1",
  summarySchemaVersion:
    "determinized-pimc-post-one-ply-branching-budget-casebook-summary-v1",
  hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
  explicitNonClaims: result.summary.explicitNonClaims,
  cFp74Recommendation: result.summary.cFp74Recommendation,
  artifactHashes: {
    "summary.json": sha256(summaryJson),
    "casebook-roots.jsonl": sha256(casebookRootsJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  },
});

export const serializeDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts =
  (
    result: DeterminizedPimcPostOnePlyBranchingBudgetCasebookResult,
  ): SerializedDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts => {
    const summaryJson = stablePrettyJson(result.summary);
    const casebookRootsJsonl =
      result.casebookRoots.length === 0
        ? ""
        : `${result.casebookRoots.map(stableJsonLine).join("\n")}\n`;
    const skippedRootsJsonl =
      result.skippedRoots.length === 0
        ? ""
        : `${result.skippedRoots.map(stableJsonLine).join("\n")}\n`;
    const reportMarkdown = buildMarkdownReport(result);
    const manifestJson = stablePrettyJson(
      buildManifest(
        result,
        summaryJson,
        casebookRootsJsonl,
        skippedRootsJsonl,
        reportMarkdown,
      ),
    );

    return {
      manifestJson,
      summaryJson,
      casebookRootsJsonl,
      skippedRootsJsonl,
      reportMarkdown,
    };
  };

export const writeDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts =
  async ({
    outDir,
    artifacts,
  }: {
    readonly outDir: string;
    readonly artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts;
  }) => {
    await mkdir(outDir, { recursive: true });
    await Promise.all([
      writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
      writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
      writeFile(
        resolve(outDir, "casebook-roots.jsonl"),
        artifacts.casebookRootsJsonl,
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
      files: [...determinizedPimcPostOnePlyBranchingBudgetCasebookArtifactFiles],
    };
  };

export const combinedDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactText =
  (
    artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts,
  ) =>
    [
      artifacts.manifestJson,
      artifacts.summaryJson,
      artifacts.casebookRootsJsonl,
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
  { label: "sampledWorldSnake", pattern: /\bsampled_world\b/ },
  { label: "hiddenHand", pattern: /\bhiddenHand\b/ },
  { label: "hiddenDeck", pattern: /\bhiddenDeck\b/ },
  { label: "sourceId", pattern: /\bsourceId\b/ },
  { label: "sourceCardId", pattern: /\bsourceCardId\b/ },
  { label: "cardId", pattern: /\bcardId\b/ },
  { label: "moveId", pattern: /\bmoveId\b/ },
  { label: "actionRef", pattern: /\bactionRef\b/ },
  { label: "rawMove", pattern: /\brawMove\b/ },
  { label: "rawLabel", pattern: /\brawLabel\b/ },
  { label: "rawSourceMap", pattern: /\brawSourceMap\b/ },
  { label: "sourceMap", pattern: /\bsourceMap\b/ },
  { label: "bestAction", pattern: /\bbestAction\b/ },
  { label: "selectedAction", pattern: /\bselectedAction\b/ },
  { label: "actionValue", pattern: /\bactionValue\b/ },
  { label: "expectedValue", pattern: /\bexpectedValue\b/ },
  { label: "valueEstimate", pattern: /\bvalueEstimate\b/ },
  { label: "rewardTarget", pattern: /\brewardTarget\b/ },
  { label: "payoff", pattern: /\bpayoff\b/ },
  { label: "rolloutReward", pattern: /\brolloutReward\b/ },
  { label: "winProbability", pattern: /\bwinProbability\b/ },
  { label: "principalVariation", pattern: /\bprincipalVariation\b/ },
  { label: "scoreQuality", pattern: /\bscoreQuality\b/ },
  { label: "seatAPrefix", pattern: /\bseat_a:/ },
  { label: "seatBPrefix", pattern: /\bseat_b:/ },
];

export const scanDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactsForHiddenInfo =
  (
    artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts,
  ) => {
    const text =
      combinedDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactText(
        artifacts,
      );
    return hiddenInfoHazards
      .filter(({ pattern }) => pattern.test(text))
      .map(({ label }) => label);
  };

export const determinizedPimcPostOnePlyBranchingBudgetCasebookArtifactHashes =
  (
    artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts,
  ) => ({
    "manifest.json": sha256(artifacts.manifestJson),
    "summary.json": sha256(artifacts.summaryJson),
    "casebook-roots.jsonl": sha256(artifacts.casebookRootsJsonl),
    "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
    "report.md": sha256(artifacts.reportMarkdown),
  });
