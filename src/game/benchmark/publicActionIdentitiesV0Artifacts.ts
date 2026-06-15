import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";

import type {
  PublicActionIdentitiesV0ActionIdentitySchemaVersion,
  PublicActionIdentitiesV0ActionIdentityRow,
  PublicActionIdentitiesV0CountSummaries,
  PublicActionIdentitiesV0IdentityReadinessStatus,
  PublicActionIdentitiesV0Result,
  PublicActionIdentitiesV0RootSummaryRow,
  PublicActionIdentitiesV0RootSummarySchemaVersion,
  PublicActionIdentitiesV0SkippedRootRow,
  PublicActionIdentitiesV0SkippedRootSchemaVersion,
  PublicActionIdentitiesV0SourceArtifactReference,
  PublicActionIdentitiesV0SourceConsistency,
  PublicActionIdentitiesV0SummarySchemaVersion,
} from "./publicActionIdentitiesV0";

export type PublicActionIdentitiesV0ArtifactSchemaVersion =
  "public-action-identities-v0-artifact-v1";

export interface PublicActionIdentitiesV0SourceRunIds {
  cfp68: string;
  cfp69: string;
  cfp76: string;
}

export const CFP77_EXPLICIT_NON_CLAIMS: readonly string[] = [
  "cFp77 does not choose actions or recommend best actions.",
  "cFp77 does not rank actions or compute action ordering.",
  "cFp77 does not estimate action values or expected values.",
  "cFp77 does not estimate win probability or reward targets.",
  "cFp77 does not compute payoff tables or principal variations.",
  "cFp77 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.",
  "cFp77 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.",
  "cFp77 does not select moves for product AI.",
  "cFp77 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.",
  "cFp77 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.",
  "cFp77 does not add AI Lab runner buttons or execute benchmarks from the browser.",
  "cFp77 does not add difficulty tiers, export training data, or add Python tooling.",
  "cFp77 does not expose raw move IDs, card/source identities, deck order, sampled hands/decks, or hidden payloads.",
];

export const CFP78_RECOMMENDATION_JOIN =
  "cFp78 should repair search-consumer-action-features-v0 by joining cFp76 root features to cFp77 public-action identities, producing nonempty action feature rows without action values or ranking.";

export const CFP78_RECOMMENDATION_NOT_READY =
  "cFp78 should repair the cFp77 source chain reported in sourceConsistency before any consumer work.";

export const CFP78_RECOMMENDATION_SIZE =
  "cFp78 should compact the cFp77 action row projection or create a deterministic casebook subset before consumer work.";

const ACTION_IDENTITIES_TARGET_BYTES = 50 * 1024 * 1024;

const actionIdentitiesTargetLabel = (bytes: number): string =>
  bytes >= ACTION_IDENTITIES_TARGET_BYTES
    ? "at or above 50 MB robust target (cFp78 compaction recommended), below 90 MB hard stop"
    : "below 50 MB robust target, below 90 MB hard stop";

export interface PublicActionIdentitiesV0ArtifactManifest {
  schemaVersion: PublicActionIdentitiesV0ArtifactSchemaVersion;
  identityRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  identityReadinessStatus: PublicActionIdentitiesV0IdentityReadinessStatus;
  sourceCfp68RunId: string;
  sourceCfp69RunId: string;
  sourceCfp76RunId: string;
  sourceArtifactReferences: readonly PublicActionIdentitiesV0SourceArtifactReference[];
  actionIdentitySchemaVersion: PublicActionIdentitiesV0ActionIdentitySchemaVersion;
  rootSummarySchemaVersion: PublicActionIdentitiesV0RootSummarySchemaVersion;
  skippedRootSchemaVersion: PublicActionIdentitiesV0SkippedRootSchemaVersion;
  summarySchemaVersion: PublicActionIdentitiesV0SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp78Recommendation: string;
  artifactHashes: Record<
    | "summary.json"
    | "action-identities.jsonl"
    | "root-summaries.jsonl"
    | "skipped-roots.jsonl"
    | "report.md",
    string
  >;
}

export interface PublicActionIdentitiesV0ArtifactByteSizes {
  actionIdentitiesJsonlBytes: number;
  rootSummariesJsonlBytes: number;
  skippedRootsJsonlBytes: number;
}

export interface PublicActionIdentitiesV0Summary {
  schemaVersion: PublicActionIdentitiesV0SummarySchemaVersion;
  identityRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceArtifactReferences: readonly PublicActionIdentitiesV0SourceArtifactReference[];
  identityReadinessStatus: PublicActionIdentitiesV0IdentityReadinessStatus;
  actionIdentityRowCount: number;
  rootSummaryRowCount: number;
  skippedRootRowCount: number;
  sourceConsistency: PublicActionIdentitiesV0SourceConsistency;
  countSummaries: PublicActionIdentitiesV0CountSummaries;
  artifactByteSizes: PublicActionIdentitiesV0ArtifactByteSizes;
  hiddenInfoScanStatus: "clean" | "hazards_detected";
  hiddenInfoScanHazards: readonly string[];
  explicitNonClaims: readonly string[];
  cFp78Recommendation: string;
}

export interface SerializedPublicActionIdentitiesV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  actionIdentitiesJsonl: string;
  rootSummariesJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const publicActionIdentitiesV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "action-identities.jsonl",
  "root-summaries.jsonl",
  "skipped-roots.jsonl",
  "report.md",
] as const;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

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

const stablePrettyJson = (value: unknown) => `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;

const stableJsonLine = (value: unknown) => JSON.stringify(sortJsonValue(value));

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

const jsonlText = (rows: readonly unknown[]) =>
  rows.map(stableJsonLine).join("\n") + (rows.length > 0 ? "\n" : "");

const sortedEntries = <T>(record: Record<string, T>) =>
  Object.entries(record).sort(([left], [right]) => left.localeCompare(right));

const formatCountRows = (record: Record<string, number>) => {
  const rows = sortedEntries(record);
  if (rows.length === 0) return "| none | 0 |";
  return rows.map(([key, count]) => `| ${key} | ${count} |`).join("\n");
};

const relativeOutputPath = (suiteId: string) =>
  `docs/research/literature/ai/benchmark-results/${suiteId}/public-action-identities-v0/cFp77`;

const HIDDEN_INFO_SAFETY_NOTE =
  "All rows in action-identities.jsonl, root-summaries.jsonl, and skipped-roots.jsonl are " +
  "derived from the existing safe public action abstraction (collapsed public action buckets) " +
  "plus scalar/count-map derivations of committed cFp68/cFp69 artifacts. No raw move IDs, card " +
  "instance IDs, card source IDs, source IDs, card/leader names, deck order, sampled hand/deck " +
  "contents, final match state, command/event logs, decision traces, action values, or rollout " +
  "results appear in machine-readable rows.";

const buildSourceConsistencySection = (consistency: PublicActionIdentitiesV0SourceConsistency) => `
## Source Consistency

| Check | Value |
|---|---:|
| status | ${consistency.status} |
| cFp68 contract status | ${consistency.cFp68ContractStatus} |
| cFp69 probe readiness status | ${consistency.cFp69ProbeReadinessStatus} |
| cFp76 consumer readiness status | ${consistency.cFp76ConsumerReadinessStatus} |
| cFp68 eligible root count | ${consistency.cFp68EligibleRootCount} |
| cFp68 skipped root count | ${consistency.cFp68SkippedRootCount} |
| cFp69 probe root count | ${consistency.cFp69ProbeRootCount} |
| cFp69 skipped root count | ${consistency.cFp69SkippedRootCount} |
| cFp76 root feature row count | ${consistency.cFp76RootFeatureRowCount} |
| cFp76 action feature row count | ${consistency.cFp76ActionFeatureRowCount} |
| cFp76 action-feature-gap row count | ${consistency.cFp76ActionFeatureGapRowCount} |
| cFp76 skipped root row count | ${consistency.cFp76SkippedRootRowCount} |
| cFp68 eligible root count vs actual eligible-roots.jsonl delta | ${consistency.cfp68EligibleRootCountActualDelta} |
| cFp68 skipped root count vs actual skipped-roots.jsonl delta | ${consistency.cfp68SkippedRootCountActualDelta} |
| cFp69 probe root count vs actual probe-roots.jsonl delta | ${consistency.cfp69ProbeRootCountActualDelta} |
| cFp69 skipped root count vs actual skipped-roots.jsonl delta | ${consistency.cfp69SkippedRootCountActualDelta} |
| cFp76 root feature row count vs actual root-features.jsonl delta | ${consistency.cfp76RootFeatureRowCountActualDelta} |
| cFp76 skipped root row count vs cFp69 skipped root count delta | ${consistency.cfp76SkippedRootCountVsCfp69SkippedRootCountDelta} |
| cFp76 skipped root row count vs cFp68 skipped root count delta | ${consistency.cfp76SkippedRootCountVsCfp68SkippedRootCountDelta} |
| cFp76 readiness is action_feature_source_gap | ${consistency.cfp76ReadinessIsActionFeatureSourceGap} |
| cFp76 action feature row count is zero | ${consistency.cfp76ActionFeatureRowCountIsZero} |
| cFp76 action-feature-gap row count is positive | ${consistency.cfp76ActionFeatureGapRowCountIsPositive} |
| observed root count | ${consistency.observedRootCount} |
| duplicate observed root keys | ${consistency.duplicateObservedRootKeys} |
| duplicate cFp68 eligible root keys | ${consistency.duplicateCfp68EligibleRootKeys} |
| duplicate cFp69 probe root keys | ${consistency.duplicateCfp69ProbeRootKeys} |
| duplicate cFp69 skipped root keys | ${consistency.duplicateCfp69SkippedRootKeys} |
| observed roots missing cFp68 eligible root | ${consistency.observedRootsMissingCfp68EligibleRoot} |
| cFp68 eligible roots missing observed root | ${consistency.cfp68EligibleRootsMissingObservedRoot} |
| observed roots missing cFp69 probe root | ${consistency.observedRootsMissingCfp69ProbeRoot} |
| cFp69 probe roots missing observed root | ${consistency.cfp69ProbeRootsMissingObservedRoot} |
| public action count mismatch root count | ${consistency.publicActionCountMismatchRootCount} |
| legal move count mismatch root count | ${consistency.legalMoveCountMismatchRootCount} |
| action identity row count | ${consistency.actionIdentityRowCount} |
| cFp69 public action count total | ${consistency.cfp69PublicActionCountTotal} |
| action identity row count delta | ${consistency.actionIdentityRowCountDelta} |
| duplicate action identity keys | ${consistency.duplicateActionIdentityKeys} |
| skipped root key mismatch count | ${consistency.skippedRootKeyMismatchCount} |
| source artifact reference count | ${consistency.sourceArtifactReferenceCount} |
| source artifact empty hash count | ${consistency.sourceArtifactEmptyHashCount} |
`;

const buildSourceArtifactSection = (
  references: readonly PublicActionIdentitiesV0SourceArtifactReference[],
) => `
## Source Artifact References

| Label | Path | SHA-256 |
|---|---|---|
${references
  .map((reference) => `| ${reference.label} | ${reference.relativePath} | ${reference.sha256} |`)
  .join("\n")}
`;

const buildMarkdownReport = ({
  result,
  summary,
}: {
  result: PublicActionIdentitiesV0Result;
  summary: PublicActionIdentitiesV0Summary;
}) => `# Public Action Identities v0

## Run

- suite id: ${summary.suiteId}
- identity run id: ${summary.identityRunId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- identity readiness status: ${summary.identityReadinessStatus}
${buildSourceConsistencySection(result.sourceConsistency)}
## Row Counts

| Row kind | Count |
|---|---:|
| action identity rows | ${summary.actionIdentityRowCount} |
| root summary rows | ${summary.rootSummaryRowCount} |
| skipped root rows | ${summary.skippedRootRowCount} |

## Count Summaries

### By Phase

| Phase | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByPhase)}

### By Round

| Round | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByRound)}

### By Policy

| Policy | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByPolicy)}

### By Faction

| Faction | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByFaction)}

### By Deck Preset

| Deck preset | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByDeckPreset)}

### By Matchup

| Matchup | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByMatchup)}

### Public Action Kind Counts

| Kind | Count |
|---|---:|
${formatCountRows(result.countSummaries.publicActionKindCounts)}

### Target Kind Counts

| Target kind | Count |
|---|---:|
${formatCountRows(result.countSummaries.targetKindCounts)}

### Target Side Counts

| Target side | Count |
|---|---:|
${formatCountRows(result.countSummaries.targetSideCounts)}

### Bucket Size Class Counts

| Bucket size class | Count |
|---|---:|
${formatCountRows(result.countSummaries.bucketSizeClassCounts)}

### Action Family Counts

| Action family | Count |
|---|---:|
${formatCountRows(result.countSummaries.actionFamilyCounts)}

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| action-identities.jsonl | ${summary.artifactByteSizes.actionIdentitiesJsonlBytes} | ${actionIdentitiesTargetLabel(summary.artifactByteSizes.actionIdentitiesJsonlBytes)} |
| root-summaries.jsonl | ${summary.artifactByteSizes.rootSummariesJsonlBytes} | below 90 MB hard stop |
| skipped-roots.jsonl | ${summary.artifactByteSizes.skippedRootsJsonlBytes} | below 90 MB hard stop |

## Hidden-Info Safety

- scan status: ${summary.hiddenInfoScanStatus}
- hazards detected: ${summary.hiddenInfoScanHazards.length === 0 ? "none" : summary.hiddenInfoScanHazards.join(", ")}

${HIDDEN_INFO_SAFETY_NOTE}
${buildSourceArtifactSection(summary.sourceArtifactReferences)}
## Non-Claims

${summary.explicitNonClaims.map((claim) => `- ${claim}`).join("\n")}

## cFp78 Recommendation

${summary.cFp78Recommendation}
`;

const cFp78RecommendationFor = ({
  result,
  artifactByteSizes,
}: {
  result: PublicActionIdentitiesV0Result;
  artifactByteSizes: PublicActionIdentitiesV0ArtifactByteSizes;
}): string => {
  if (result.identityReadinessStatus === "source_consistency_failed") {
    return CFP78_RECOMMENDATION_NOT_READY;
  }
  if (artifactByteSizes.actionIdentitiesJsonlBytes >= ACTION_IDENTITIES_TARGET_BYTES) {
    return CFP78_RECOMMENDATION_SIZE;
  }
  return CFP78_RECOMMENDATION_JOIN;
};

export const buildPublicActionIdentitiesV0Summary = ({
  result,
  identityRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceArtifactReferences,
  artifactByteSizes,
  hiddenInfoScanHazards,
}: {
  result: PublicActionIdentitiesV0Result;
  identityRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceArtifactReferences: readonly PublicActionIdentitiesV0SourceArtifactReference[];
  artifactByteSizes: PublicActionIdentitiesV0ArtifactByteSizes;
  hiddenInfoScanHazards: readonly string[];
}): PublicActionIdentitiesV0Summary => ({
  schemaVersion: "public-action-identities-v0-summary-v1",
  identityRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceArtifactReferences,
  identityReadinessStatus: result.identityReadinessStatus,
  actionIdentityRowCount: result.actionIdentities.length,
  rootSummaryRowCount: result.rootSummaries.length,
  skippedRootRowCount: result.skippedRoots.length,
  sourceConsistency: result.sourceConsistency,
  countSummaries: result.countSummaries,
  artifactByteSizes,
  hiddenInfoScanStatus: hiddenInfoScanHazards.length === 0 ? "clean" : "hazards_detected",
  hiddenInfoScanHazards,
  explicitNonClaims: CFP77_EXPLICIT_NON_CLAIMS,
  cFp78Recommendation: cFp78RecommendationFor({ result, artifactByteSizes }),
});

export const serializePublicActionIdentitiesV0Artifacts = ({
  result,
  identityRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceRunIds,
  sourceArtifactReferences,
}: {
  result: PublicActionIdentitiesV0Result;
  identityRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceRunIds: PublicActionIdentitiesV0SourceRunIds;
  sourceArtifactReferences: readonly PublicActionIdentitiesV0SourceArtifactReference[];
}): SerializedPublicActionIdentitiesV0Artifacts => {
  const actionIdentitiesJsonl = jsonlText(result.actionIdentities);
  const rootSummariesJsonl = jsonlText(result.rootSummaries);
  const skippedRootsJsonl = jsonlText(result.skippedRoots);

  const artifactByteSizes: PublicActionIdentitiesV0ArtifactByteSizes = {
    actionIdentitiesJsonlBytes: Buffer.byteLength(actionIdentitiesJsonl, "utf8"),
    rootSummariesJsonlBytes: Buffer.byteLength(rootSummariesJsonl, "utf8"),
    skippedRootsJsonlBytes: Buffer.byteLength(skippedRootsJsonl, "utf8"),
  };

  const preliminarySummary = buildPublicActionIdentitiesV0Summary({
    result,
    identityRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceArtifactReferences,
    artifactByteSizes,
    hiddenInfoScanHazards: [],
  });

  const preliminaryReport = buildMarkdownReport({ result, summary: preliminarySummary });
  const hiddenInfoScanHazards = scanPublicActionIdentitiesV0TextForHiddenInfo(
    [actionIdentitiesJsonl, rootSummariesJsonl, skippedRootsJsonl, preliminaryReport].join("\n"),
  );

  const summary = buildPublicActionIdentitiesV0Summary({
    result,
    identityRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceArtifactReferences,
    artifactByteSizes,
    hiddenInfoScanHazards,
  });

  const summaryJson = stablePrettyJson(summary);
  const reportMarkdown = buildMarkdownReport({ result, summary });

  const artifactHashes = {
    "summary.json": sha256(summaryJson),
    "action-identities.jsonl": sha256(actionIdentitiesJsonl),
    "root-summaries.jsonl": sha256(rootSummariesJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  };

  const manifest: PublicActionIdentitiesV0ArtifactManifest = {
    schemaVersion: "public-action-identities-v0-artifact-v1",
    identityRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    relativeOutputPath: relativeOutputPath(suiteId),
    generatedAtTimestampPolicy: "deterministic-no-wall-clock",
    files: [...publicActionIdentitiesV0ArtifactFiles],
    identityReadinessStatus: result.identityReadinessStatus,
    sourceCfp68RunId: sourceRunIds.cfp68,
    sourceCfp69RunId: sourceRunIds.cfp69,
    sourceCfp76RunId: sourceRunIds.cfp76,
    sourceArtifactReferences,
    actionIdentitySchemaVersion: "public-action-identities-v0-action-identity-v1",
    rootSummarySchemaVersion: "public-action-identities-v0-root-summary-v1",
    skippedRootSchemaVersion: "public-action-identities-v0-skipped-root-v1",
    summarySchemaVersion: "public-action-identities-v0-summary-v1",
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
    explicitNonClaims: CFP77_EXPLICIT_NON_CLAIMS,
    cFp78Recommendation: summary.cFp78Recommendation,
    artifactHashes,
  };

  return {
    manifestJson: stablePrettyJson(manifest),
    summaryJson,
    actionIdentitiesJsonl,
    rootSummariesJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writePublicActionIdentitiesV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  outDir: string;
  artifacts: SerializedPublicActionIdentitiesV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(resolve(outDir, "action-identities.jsonl"), artifacts.actionIdentitiesJsonl, "utf8"),
    writeFile(resolve(outDir, "root-summaries.jsonl"), artifacts.rootSummariesJsonl, "utf8"),
    writeFile(resolve(outDir, "skipped-roots.jsonl"), artifacts.skippedRootsJsonl, "utf8"),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...publicActionIdentitiesV0ArtifactFiles],
  };
};

export const combinedPublicActionIdentitiesV0ArtifactText = (
  artifacts: SerializedPublicActionIdentitiesV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.actionIdentitiesJsonl,
    artifacts.rootSummariesJsonl,
    artifacts.skippedRootsJsonl,
    artifacts.reportMarkdown,
  ].join("\n");

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  return [...names]
    .sort((left, right) => left.localeCompare(right))
    .map((identity) => ({
      label: `catalog identity:${identity}`,
      pattern: new RegExp(escapeRegExp(identity)),
    }));
};

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
  { label: "handSourceCounts", pattern: /\bhandSourceCounts\b/ },
  { label: "deckSourceCounts", pattern: /\bdeckSourceCounts\b/ },
  { label: "bestAction", pattern: /\bbestAction\b/ },
  { label: "selectedAction", pattern: /\bselectedAction\b/ },
  { label: "actionValue", pattern: /\bactionValue\b/ },
  { label: "expectedValue", pattern: /\bexpectedValue\b/ },
  { label: "valueEstimate", pattern: /\bvalueEstimate\b/ },
  { label: "rewardTarget", pattern: /\brewardTarget\b/ },
  { label: "payoffTable", pattern: /\bpayoffTable\b/ },
  { label: "payoffMatrix", pattern: /\bpayoffMatrix\b/ },
  { label: "rolloutReward", pattern: /\brolloutReward\b/ },
  { label: "winProbability", pattern: /\bwinProbability\b/ },
  { label: "principalVariation", pattern: /\bprincipalVariation\b/ },
  { label: "runtime seat_a prefix", pattern: /\bseat_a:/ },
  { label: "runtime seat_b prefix", pattern: /\bseat_b:/ },
];

export const scanPublicActionIdentitiesV0TextForHiddenInfo = (combined: string) =>
  [...hiddenInfoHazards, ...catalogIdentityHazards()]
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);

export const scanPublicActionIdentitiesV0ArtifactsForHiddenInfo = (
  artifacts: SerializedPublicActionIdentitiesV0Artifacts,
) =>
  scanPublicActionIdentitiesV0TextForHiddenInfo(
    combinedPublicActionIdentitiesV0ArtifactText(artifacts),
  );

export const publicActionIdentitiesV0ArtifactHashes = (
  artifacts: SerializedPublicActionIdentitiesV0Artifacts,
) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "action-identities.jsonl": sha256(artifacts.actionIdentitiesJsonl),
  "root-summaries.jsonl": sha256(artifacts.rootSummariesJsonl),
  "skipped-roots.jsonl": sha256(artifacts.skippedRootsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});

export type {
  PublicActionIdentitiesV0ActionIdentityRow,
  PublicActionIdentitiesV0RootSummaryRow,
  PublicActionIdentitiesV0SkippedRootRow,
};
