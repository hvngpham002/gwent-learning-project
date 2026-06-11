import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";

import type {
  DeterminizedPimcBoundedSecondPlyScaffoldV0ReadinessStatus,
  DeterminizedPimcBoundedSecondPlyScaffoldV0Result,
  DeterminizedPimcBoundedSecondPlyScaffoldV0RootRecord,
  DeterminizedPimcBoundedSecondPlyScaffoldV0RootSchemaVersion,
  DeterminizedPimcBoundedSecondPlyScaffoldV0SkippedRootSchemaVersion,
  DeterminizedPimcBoundedSecondPlyScaffoldV0SummarySchemaVersion,
  DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetRootSchemaVersion,
} from "./determinizedPimcBoundedSecondPlyScaffoldV0";

export type DeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactSchemaVersion =
  "determinized-pimc-bounded-second-ply-scaffold-v0-artifact-v1";

export interface DeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactManifest {
  schemaVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactSchemaVersion;
  scaffoldRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  scaffoldReadinessStatus: DeterminizedPimcBoundedSecondPlyScaffoldV0ReadinessStatus;
  sourceCfp68RunId: string;
  sourceCfp69RunId: string;
  sourceCfp70RunId: string;
  sourceCfp71RunId: string;
  sourceCfp72RunId: string;
  sourceCfp73RunId: string;
  capPolicyVersion: string;
  totalCfp72RootCount: number;
  branchingRootCount: number;
  inCapRootCount: number;
  overBudgetRootCount: number;
  inheritedSkippedRootCount: number;
  plannedSecondPlyPairCountTotal: number;
  plannedSecondPlyPairCountInCap: number;
  plannedSecondPlyPairCountOverBudget: number;
  completedSecondPlyPairCount: number;
  failedOrDeferredSecondPlyPairCount: number;
  rootSchemaVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0RootSchemaVersion;
  overBudgetRootSchemaVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetRootSchemaVersion;
  skippedRootSchemaVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0SkippedRootSchemaVersion;
  summarySchemaVersion: DeterminizedPimcBoundedSecondPlyScaffoldV0SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp75Recommendation: string;
  artifactHashes: Record<
    | "summary.json"
    | "second-ply-roots.jsonl"
    | "over-budget-roots.jsonl"
    | "skipped-roots.jsonl"
    | "report.md",
    string
  >;
}

export interface SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  secondPlyRootsJsonl: string;
  overBudgetRootsJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const determinizedPimcBoundedSecondPlyScaffoldV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "second-ply-roots.jsonl",
  "over-budget-roots.jsonl",
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

const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));

const sparseCountMap = (record: Record<string, number>) =>
  Object.fromEntries(sortedEntries(record).filter(([, count]) => count !== 0));

const compactSecondPlyRootArtifactRow = (
  root: DeterminizedPimcBoundedSecondPlyScaffoldV0RootRecord,
) => ({
  suiteId: root.suiteId,
  matchupId: root.matchupId,
  seed: root.seed,
  mirrorGroupId: root.mirrorGroupId,
  mirrorIndex: root.mirrorIndex,
  step: root.step,
  decisionIndex: root.decisionIndex,
  phase: root.phase,
  round: root.round,
  seatId: root.seatId,
  policyId: root.policyId,
  faction: root.faction,
  deckPresetId: root.deckPresetId,
  rootPublicFingerprint: root.rootPublicFingerprint,
  rootPublicActionCount: root.rootPublicActionCount,
  firstPlyPublicActionSamplePairCount:
    root.firstPlyPublicActionSamplePairCount,
  postOnePlyPublicActionBudgetTotal:
    root.postOnePlyPublicActionBudgetTotal,
  postOnePlyPublicActionBudgetAverage:
    root.postOnePlyPublicActionBudgetAverage,
  nextPublicActionCountMax: root.nextPublicActionCountMax,
  largestNextPublicActionBucketSizeMax:
    root.largestNextPublicActionBucketSizeMax,
  nextPublicActionTargetExpansionCountMax:
    root.nextPublicActionTargetExpansionCountMax,
  branchingBudgetBucket: root.branchingBudgetBucket,
  branchingRiskBucket: root.branchingRiskBucket,
  postOnePlyActorCounts: root.postOnePlyActorCounts,
  postOnePlyPhaseCounts: root.postOnePlyPhaseCounts,
  casebookPresence: root.casebookPresence,
  primaryCasebookLabel: root.primaryCasebookLabel,
  budgetPressureLabel: root.budgetPressureLabel,
  transitionContextLabel: root.transitionContextLabel,
  cFp74ReadinessHint: root.cFp74ReadinessHint,
  capStatus: root.capStatus,
  sampleCountRequested: root.sampleCountRequested,
  sampleCountGenerated: root.sampleCountGenerated,
  sampleCountChecked: root.sampleCountChecked,
  plannedSecondPlyPairCount: root.plannedSecondPlyPairCount,
  completedSecondPlyPairCount: root.completedSecondPlyPairCount,
  failedOrDeferredSecondPlyPairCount:
    root.failedOrDeferredSecondPlyPairCount,
  secondPlyExecutionStatus: root.secondPlyExecutionStatus,
  secondPlyFailureReasonCounts: sparseCountMap(
    root.secondPlyFailureReasonCounts,
  ),
  secondPlyTransitionKindCounts: sparseCountMap(
    root.secondPlyTransitionKindCounts,
  ),
  postSecondPlyPhaseCounts: sparseCountMap(root.postSecondPlyPhaseCounts),
  postSecondPlyActorCounts: sparseCountMap(root.postSecondPlyActorCounts),
  secondPlyPublicActionKindCounts: sparseCountMap(
    root.secondPlyPublicActionKindCounts,
  ),
  secondPlyTargetKindCounts: sparseCountMap(root.secondPlyTargetKindCounts),
  secondPlyTargetSideCounts: sparseCountMap(root.secondPlyTargetSideCounts),
  secondPlyOutcomeRiskBucket: root.secondPlyOutcomeRiskBucket,
});

const formatCountRows = (record: Record<string, number>) => {
  const rows = sortedEntries(record);
  if (rows.length === 0) return "| none | 0 |";
  return rows.map(([key, count]) => `| ${key} | ${count} |`).join("\n");
};

const formatNestedRows = (record: Record<string, Record<string, number>>) => {
  const rows = sortedEntries(record).flatMap(([outer, inner]) =>
    sortedEntries(inner).map(
      ([innerKey, count]) => `| ${outer} | ${innerKey} | ${count} |`,
    ),
  );
  if (rows.length === 0) return "| none | none | 0 |";
  return rows.join("\n");
};

const formatPercent = (value: number) => `${value.toFixed(3)}%`;

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/determinized-pimc-bounded-second-ply-scaffold-v0/cFp74`;

const buildMarkdownReport = (
  result: DeterminizedPimcBoundedSecondPlyScaffoldV0Result,
) => {
  const { summary } = result;
  return `# Determinized PIMC Bounded Second-Ply Scaffold v0

## Run

- suite id: ${summary.suiteId}
- scaffold run id: ${summary.scaffoldRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- readiness: ${summary.scaffoldReadinessStatus}
- source cFp68 run id: ${summary.sourceCfp68RunId}
- source cFp69 run id: ${summary.sourceCfp69RunId}
- source cFp70 run id: ${summary.sourceCfp70RunId}
- source cFp71 run id: ${summary.sourceCfp71RunId}
- source cFp72 run id: ${summary.sourceCfp72RunId}
- source cFp73 run id: ${summary.sourceCfp73RunId}

## Cap Policy

| Cap | Value |
|---|---:|
| root second-ply pair cap | ${summary.capPolicy.secondPlyPairCapPerRoot} |
| root public action cap | ${summary.capPolicy.rootPublicActionCap} |
| post-one-ply public action cap per state | ${summary.capPolicy.postOnePlyPublicActionCapPerState} |
| sample count cap per root | ${summary.capPolicy.sampleCountCapPerRoot} |
| robust planned-pair soft cap | ${summary.capPolicy.robustTotalPlannedSecondPlyPairSoftCap} |

## Root Counts

| Count | Value |
|---|---:|
| total cFp72 roots | ${summary.totalCfp72RootCount} |
| cFp72 branching roots | ${summary.branchingRootCount} |
| in-cap roots | ${summary.inCapRootCount} |
| over-budget roots | ${summary.overBudgetRootCount} |
| inherited skipped roots | ${summary.inheritedSkippedRootCount} |
| inherited skipped percentage | ${formatPercent(summary.inheritedSkippedRootPercentage)} |
| over-budget percentage of branching roots | ${formatPercent(summary.overBudgetRootPercentageOfBranchingRoots)} |

## Pair Counts

| Count | Value |
|---|---:|
| planned second-ply pairs total | ${summary.plannedSecondPlyPairCountTotal} |
| planned second-ply pairs in cap | ${summary.plannedSecondPlyPairCountInCap} |
| planned second-ply pairs over budget | ${summary.plannedSecondPlyPairCountOverBudget} |
| completed second-ply pairs | ${summary.completedSecondPlyPairCount} |
| failed or deferred second-ply pairs | ${summary.failedOrDeferredSecondPlyPairCount} |

## Status Counts

| Status | Count |
|---|---:|
${formatCountRows(summary.secondPlyExecutionStatusCounts)}

## Transition Counts

| Transition | Count |
|---|---:|
${formatCountRows(summary.secondPlyTransitionKindCounts)}

## Post-Second-Ply Actor Counts

| Actor | Count |
|---|---:|
${formatCountRows(summary.postSecondPlyActorCounts)}

## Post-Second-Ply Phase Counts

| Phase | Count |
|---|---:|
${formatCountRows(summary.postSecondPlyPhaseCounts)}

## Second-Ply Public Action Counts

| Kind | Count |
|---|---:|
${formatCountRows(summary.secondPlyPublicActionKindCounts)}

## Over-Budget Reasons

| Reason | Count |
|---|---:|
${formatCountRows(summary.overBudgetReasonCounts)}

## Casebook Labels By Cap Status

| Cap status | Label | Count |
|---|---|---:|
${formatNestedRows(summary.labelCountsByCapStatus)}

## Source Consistency

- status: ${summary.sourceConsistency.status}
- cFp68 eligible roots read: ${summary.sourceConsistency.cFp68EligibleRootsRead}
- cFp72 branching roots read: ${summary.sourceConsistency.cFp72BranchingRootsRead}
- cFp73 casebook roots read: ${summary.sourceConsistency.cFp73CasebookRootsRead}
- duplicate cFp72 branching keys: ${summary.sourceConsistency.duplicateCfp72BranchingRootKeys}
- cFp72 failed/deferred roots: ${summary.sourceConsistency.cfp72RootsWithFailedOrDeferredPairs}
- in-cap roots not observed: ${summary.sourceConsistency.inCapRootsNotObserved}

## Non-Claims

${summary.explicitNonClaims.map((claim) => `- ${claim}`).join("\n")}

## Hidden-Info Safety

${summary.hiddenInfoSafetyNote}

## Recommendation

${summary.cFp75Recommendation}
`;
};

export const serializeDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts = (
  result: DeterminizedPimcBoundedSecondPlyScaffoldV0Result,
): SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts => {
  const summaryJson = stablePrettyJson(result.summary);
  const secondPlyRootsJsonl =
    result.secondPlyRoots
      .map((root) => stableJsonLine(compactSecondPlyRootArtifactRow(root)))
      .join("\n") +
    (result.secondPlyRoots.length > 0 ? "\n" : "");
  const overBudgetRootsJsonl =
    result.overBudgetRoots.map(stableJsonLine).join("\n") +
    (result.overBudgetRoots.length > 0 ? "\n" : "");
  const skippedRootsJsonl =
    result.skippedRoots.map(stableJsonLine).join("\n") +
    (result.skippedRoots.length > 0 ? "\n" : "");
  const reportMarkdown = buildMarkdownReport(result);
  const artifactHashes = {
    "summary.json": sha256(summaryJson),
    "second-ply-roots.jsonl": sha256(secondPlyRootsJsonl),
    "over-budget-roots.jsonl": sha256(overBudgetRootsJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  };
  const manifest: DeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactManifest = {
    schemaVersion: "determinized-pimc-bounded-second-ply-scaffold-v0-artifact-v1",
    scaffoldRunId: result.scaffoldRunId,
    suiteId: result.suiteId,
    sourceBenchmarkSuiteId: result.summary.sourceBenchmarkSuiteId,
    relativeOutputPath: relativeOutputPath(result.suiteId),
    generatedAtTimestampPolicy: "deterministic-no-wall-clock",
    files: [...determinizedPimcBoundedSecondPlyScaffoldV0ArtifactFiles],
    scaffoldReadinessStatus: result.summary.scaffoldReadinessStatus,
    sourceCfp68RunId: result.summary.sourceCfp68RunId,
    sourceCfp69RunId: result.summary.sourceCfp69RunId,
    sourceCfp70RunId: result.summary.sourceCfp70RunId,
    sourceCfp71RunId: result.summary.sourceCfp71RunId,
    sourceCfp72RunId: result.summary.sourceCfp72RunId,
    sourceCfp73RunId: result.summary.sourceCfp73RunId,
    capPolicyVersion: result.summary.capPolicy.version,
    totalCfp72RootCount: result.summary.totalCfp72RootCount,
    branchingRootCount: result.summary.branchingRootCount,
    inCapRootCount: result.summary.inCapRootCount,
    overBudgetRootCount: result.summary.overBudgetRootCount,
    inheritedSkippedRootCount: result.summary.inheritedSkippedRootCount,
    plannedSecondPlyPairCountTotal:
      result.summary.plannedSecondPlyPairCountTotal,
    plannedSecondPlyPairCountInCap:
      result.summary.plannedSecondPlyPairCountInCap,
    plannedSecondPlyPairCountOverBudget:
      result.summary.plannedSecondPlyPairCountOverBudget,
    completedSecondPlyPairCount: result.summary.completedSecondPlyPairCount,
    failedOrDeferredSecondPlyPairCount:
      result.summary.failedOrDeferredSecondPlyPairCount,
    rootSchemaVersion: "determinized-pimc-bounded-second-ply-scaffold-v0-root-v1",
    overBudgetRootSchemaVersion:
      "determinized-pimc-bounded-second-ply-scaffold-v0-over-budget-root-v1",
    skippedRootSchemaVersion:
      "determinized-pimc-bounded-second-ply-scaffold-v0-skipped-root-v1",
    summarySchemaVersion:
      "determinized-pimc-bounded-second-ply-scaffold-v0-summary-v1",
    hiddenInfoSafetyNote: result.summary.hiddenInfoSafetyNote,
    explicitNonClaims: result.summary.explicitNonClaims,
    cFp75Recommendation: result.summary.cFp75Recommendation,
    artifactHashes,
  };

  return {
    manifestJson: stablePrettyJson(manifest),
    summaryJson,
    secondPlyRootsJsonl,
    overBudgetRootsJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writeDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  outDir: string;
  artifacts: SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(
      resolve(outDir, "second-ply-roots.jsonl"),
      artifacts.secondPlyRootsJsonl,
      "utf8",
    ),
    writeFile(
      resolve(outDir, "over-budget-roots.jsonl"),
      artifacts.overBudgetRootsJsonl,
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
    files: [...determinizedPimcBoundedSecondPlyScaffoldV0ArtifactFiles],
  };
};

export const combinedDeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactText = (
  artifacts: SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.secondPlyRootsJsonl,
    artifacts.overBudgetRootsJsonl,
    artifacts.skippedRootsJsonl,
    artifacts.reportMarkdown,
  ].join("\n");

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const catalogIdentityHazards = () => {
  const names = new Set<string>();
  currentCatalogCards.forEach((card) => {
    if (card.name.trim().length >= 3) names.add(card.name.trim());
    names.add(card.sourceId);
  });
  currentCatalogLeaders.forEach((leader) => {
    if (leader.name.trim().length >= 3) names.add(leader.name.trim());
    names.add(leader.sourceId);
  });
  return [...names].sort((left, right) => left.localeCompare(right)).map(
    (identity) => ({
      label: `catalog identity:${identity}`,
      pattern: new RegExp(escapeRegExp(identity)),
    }),
  );
};

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
  { label: "sampled_world", pattern: /\bsampled_world\b/ },
  { label: "hiddenHand", pattern: /\bhiddenHand\b/ },
  { label: "hiddenDeck", pattern: /\bhiddenDeck\b/ },
  { label: "sourceCardId", pattern: /\bsourceCardId\b/ },
  { label: "sourceId", pattern: /\bsourceId\b/ },
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
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
];

export const scanDeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactsForHiddenInfo =
  (
    artifacts: SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts,
  ) => {
    const combined =
      combinedDeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactText(artifacts);
    return [...hiddenInfoHazards, ...catalogIdentityHazards()]
      .filter(({ pattern }) => pattern.test(combined))
      .map(({ label }) => label);
  };

export const determinizedPimcBoundedSecondPlyScaffoldV0ArtifactHashes = (
  artifacts: SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "second-ply-roots.jsonl": sha256(artifacts.secondPlyRootsJsonl),
  "over-budget-roots.jsonl": sha256(artifacts.overBudgetRootsJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});
