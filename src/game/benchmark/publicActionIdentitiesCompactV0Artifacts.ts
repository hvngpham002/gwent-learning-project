import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { scanPublicActionIdentitiesV0TextForHiddenInfo } from "./publicActionIdentitiesV0Artifacts";
import type {
  PublicActionIdentitiesCompactV0ActionRow,
  PublicActionIdentitiesCompactV0ActionSchemaVersion,
  PublicActionIdentitiesCompactV0CountSummaries,
  PublicActionIdentitiesCompactV0ReadinessStatus,
  PublicActionIdentitiesCompactV0Result,
  PublicActionIdentitiesCompactV0RootIndexRow,
  PublicActionIdentitiesCompactV0RootIndexSchemaVersion,
  PublicActionIdentitiesCompactV0SkippedRootRow,
  PublicActionIdentitiesCompactV0SkippedRootSchemaVersion,
  PublicActionIdentitiesCompactV0SourceArtifactReference,
  PublicActionIdentitiesCompactV0SourceConsistency,
  PublicActionIdentitiesCompactV0SummarySchemaVersion,
} from "./publicActionIdentitiesCompactV0";

export type PublicActionIdentitiesCompactV0ArtifactSchemaVersion =
  "public-action-identities-compact-v0-artifact-v1";

export const CFP78_EXPLICIT_NON_CLAIMS: readonly string[] = [
  "cFp78 does not choose actions or recommend best actions.",
  "cFp78 does not rank actions or compute action ordering.",
  "cFp78 does not estimate action values or expected values.",
  "cFp78 does not estimate win probability or reward targets.",
  "cFp78 does not compute payoff tables or principal variations.",
  "cFp78 does not run rollout search, PIMC evaluation, or ISMCTS/MCTS.",
  "cFp78 does not execute candidate actions, rebuild sampled states, or materialize hidden worlds.",
  "cFp78 does not select moves for product AI.",
  "cFp78 does not re-observe benchmark roots or run the benchmark suite.",
  "cFp78 does not change legal-heuristic-v1 or legal-heuristic-v0 behavior.",
  "cFp78 does not change engine rules, legal moves, sampler behavior, deck/catalog data, benchmark suite definitions, or rating artifacts.",
  "cFp78 does not add AI Lab runner buttons or execute benchmarks from the browser.",
  "cFp78 does not add difficulty tiers, export training data, or add Python tooling.",
  "cFp78 does not expose raw move IDs, card/source identities, deck order, sampled hands/decks, or hidden payloads.",
  "cFp78 does not modify cFp77 artifacts.",
];

export const CFP79_RECOMMENDATION_JOIN =
  "cFp79 should repair search-consumer-action-features-v0 or add search-consumer-action-features-v1 by joining cFp76 root features to cFp78 compact action identities, producing nonempty action feature rows without action values or ranking.";

export const CFP79_RECOMMENDATION_NOT_READY =
  "cFp79 should repair the cFp77 source chain reported in sourceConsistency before any consumer work.";

export const CFP79_RECOMMENDATION_SIZE =
  "cFp79 should not start consumer feature work; it should first add a smaller deterministic casebook subset or a dictionary-encoded artifact.";

const COMPACT_ACTION_IDENTITIES_TARGET_BYTES = 50 * 1024 * 1024;
const HARD_STOP_BYTES = 90 * 1024 * 1024;

export const compactActionIdentitiesTargetLabel = (bytes: number): string => {
  if (bytes >= HARD_STOP_BYTES) return "at or above 90 MB hard stop (must stop)";
  if (bytes >= COMPACT_ACTION_IDENTITIES_TARGET_BYTES)
    return "at or above 50 MB robust target (cFp79 casebook recommended)";
  return "below 50 MB robust target, below 90 MB hard stop";
};

export interface PublicActionIdentitiesCompactV0ArtifactByteSizes {
  actionIdentitiesCompactJsonlBytes: number;
  rootIndexJsonlBytes: number;
  skippedRootsJsonlBytes: number;
}

export interface PublicActionIdentitiesCompactV0BytesSaved {
  actionIdentitiesCompactVsCfp77Bytes: number;
  rootIndexVsCfp77RootSummariesBytes: number;
  skippedRootsVsCfp77Bytes: number;
  actionIdentitiesCompactVsCfp77PercentReduction: number;
}

export interface PublicActionIdentitiesCompactV0ArtifactManifest {
  schemaVersion: PublicActionIdentitiesCompactV0ArtifactSchemaVersion;
  compactRunId: string;
  phaseId: "cFp78";
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  relativeOutputPath: string;
  generatedAtTimestampPolicy: string;
  files: string[];
  compactReadinessStatus: PublicActionIdentitiesCompactV0ReadinessStatus;
  sourceCfp77RunId: string;
  sourceArtifactReferences: readonly PublicActionIdentitiesCompactV0SourceArtifactReference[];
  compactActionSchemaVersion: PublicActionIdentitiesCompactV0ActionSchemaVersion;
  rootIndexSchemaVersion: PublicActionIdentitiesCompactV0RootIndexSchemaVersion;
  skippedRootSchemaVersion: PublicActionIdentitiesCompactV0SkippedRootSchemaVersion;
  summarySchemaVersion: PublicActionIdentitiesCompactV0SummarySchemaVersion;
  hiddenInfoSafetyNote: string;
  explicitNonClaims: readonly string[];
  cFp79Recommendation: string;
  artifactHashes: Record<
    | "summary.json"
    | "action-identities-compact.jsonl"
    | "root-index.jsonl"
    | "skipped-roots.jsonl"
    | "report.md",
    string
  >;
}

export interface PublicActionIdentitiesCompactV0Summary {
  schemaVersion: PublicActionIdentitiesCompactV0SummarySchemaVersion;
  compactRunId: string;
  phaseId: "cFp78";
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp77RunId: string;
  sourceArtifactReferences: readonly PublicActionIdentitiesCompactV0SourceArtifactReference[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
  sourceConsistency: PublicActionIdentitiesCompactV0SourceConsistency;
  compactReadinessStatus: PublicActionIdentitiesCompactV0ReadinessStatus;
  compactActionRowCount: number;
  compactRootIndexRowCount: number;
  compactSkippedRootRowCount: number;
  artifactByteSizes: PublicActionIdentitiesCompactV0ArtifactByteSizes;
  bytesSaved: PublicActionIdentitiesCompactV0BytesSaved;
  isBelowCompactActionTarget: boolean;
  isBelowHardStop: boolean;
  countSummaries: PublicActionIdentitiesCompactV0CountSummaries;
  hiddenInfoScanStatus: "clean" | "hazards_detected";
  hiddenInfoScanHazards: readonly string[];
  explicitNonClaims: readonly string[];
  cFp79Recommendation: string;
}

export interface SerializedPublicActionIdentitiesCompactV0Artifacts {
  manifestJson: string;
  summaryJson: string;
  actionIdentitiesCompactJsonl: string;
  rootIndexJsonl: string;
  skippedRootsJsonl: string;
  reportMarkdown: string;
}

export const publicActionIdentitiesCompactV0ArtifactFiles = [
  "manifest.json",
  "summary.json",
  "action-identities-compact.jsonl",
  "root-index.jsonl",
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
  `docs/research/literature/ai/benchmark-results/${suiteId}/public-action-identities-compact-v0/cFp78`;

const HIDDEN_INFO_SAFETY_NOTE =
  "All rows in action-identities-compact.jsonl, root-index.jsonl, and skipped-roots.jsonl are " +
  "projected from committed cFp77 public-action identity artifacts. Compact rows drop per-row " +
  "repetitions of actionPhase/actionRound/collisionCountWithinBucket and compact targetKind/ " +
  "targetSide/targetRow into a safe enum-like token. No raw move IDs, card instance IDs, card " +
  "source IDs, source IDs, card/leader names, deck order, sampled hand/deck contents, final " +
  "match state, command/event logs, decision traces, action values, or rollout results appear " +
  "in machine-readable rows.";

const cFp79RecommendationFor = ({
  result,
  artifactByteSizes,
}: {
  result: PublicActionIdentitiesCompactV0Result;
  artifactByteSizes: PublicActionIdentitiesCompactV0ArtifactByteSizes;
}): string => {
  if (result.compactReadinessStatus === "source_consistency_failed") {
    return CFP79_RECOMMENDATION_NOT_READY;
  }
  if (artifactByteSizes.actionIdentitiesCompactJsonlBytes >= COMPACT_ACTION_IDENTITIES_TARGET_BYTES) {
    return CFP79_RECOMMENDATION_SIZE;
  }
  return CFP79_RECOMMENDATION_JOIN;
};

const buildBytesSaved = ({
  cfp77Sizes,
  artifactByteSizes,
}: {
  cfp77Sizes: {
    actionIdentitiesJsonlBytes: number;
    rootSummariesJsonlBytes: number;
    skippedRootsJsonlBytes: number;
  };
  artifactByteSizes: PublicActionIdentitiesCompactV0ArtifactByteSizes;
}): PublicActionIdentitiesCompactV0BytesSaved => {
  const actionSaved = cfp77Sizes.actionIdentitiesJsonlBytes - artifactByteSizes.actionIdentitiesCompactJsonlBytes;
  const pct = cfp77Sizes.actionIdentitiesJsonlBytes > 0
    ? (actionSaved / cfp77Sizes.actionIdentitiesJsonlBytes) * 100
    : 0;
  return {
    actionIdentitiesCompactVsCfp77Bytes: actionSaved,
    rootIndexVsCfp77RootSummariesBytes:
      cfp77Sizes.rootSummariesJsonlBytes - artifactByteSizes.rootIndexJsonlBytes,
    skippedRootsVsCfp77Bytes:
      cfp77Sizes.skippedRootsJsonlBytes - artifactByteSizes.skippedRootsJsonlBytes,
    actionIdentitiesCompactVsCfp77PercentReduction: Math.round(pct * 100) / 100,
  };
};

const buildSourceConsistencySection = (
  consistency: PublicActionIdentitiesCompactV0SourceConsistency,
) => `
## Source Consistency

| Check | Value |
|---|---:|
| status | ${consistency.status} |
| cFp77 identity readiness status | ${consistency.cfp77IdentityReadinessStatus} |
| cFp77 source consistency status | ${consistency.cfp77SourceConsistencyStatus} |
| cFp77 action identity row count (summary) | ${consistency.cfp77ActionIdentityRowCount} |
| cFp77 root summary row count (summary) | ${consistency.cfp77RootSummaryRowCount} |
| cFp77 skipped root row count (summary) | ${consistency.cfp77SkippedRootRowCount} |
| cFp77 action identity row count vs actual delta | ${consistency.cfp77ActionIdentityRowCountActualDelta} |
| cFp77 root summary row count vs actual delta | ${consistency.cfp77RootSummaryRowCountActualDelta} |
| cFp77 skipped root row count vs actual delta | ${consistency.cfp77SkippedRootRowCountActualDelta} |
| compact action row count | ${consistency.compactActionRowCount} |
| compact root-index row count | ${consistency.compactRootIndexRowCount} |
| compact skipped-root row count | ${consistency.compactSkippedRootRowCount} |
| compact vs cFp77 action row count delta | ${consistency.compactVsCfp77ActionRowCountDelta} |
| compact vs cFp77 root-index row count delta | ${consistency.compactVsCfp77RootIndexRowCountDelta} |
| compact vs cFp77 skipped-root row count delta | ${consistency.compactVsCfp77SkippedRootRowCountDelta} |
| compact action rows with missing rootRef | ${consistency.compactActionRowsWithMissingRootRef} |
| compact root-index rows with missing cFp77 ref | ${consistency.compactRootIndexRowsWithMissingCfp77Ref} |
| duplicate compact action keys | ${consistency.duplicateCompactActionKeys} |
| cFp77 action keys missing from compact | ${consistency.cfp77ActionKeysMissingFromCompact} |
| compact action key-hash mismatch count | ${consistency.compactActionKeyHashMismatchCount} |
| compact action kind mismatch count | ${consistency.compactActionKindMismatchCount} |
| compact action ordinal mismatch count | ${consistency.compactActionOrdinalMismatchCount} |
| compact action move-count mismatch count | ${consistency.compactActionMoveCountMismatchCount} |
| source artifact reference count | ${consistency.sourceArtifactReferenceCount} |
| source artifact empty hash count | ${consistency.sourceArtifactEmptyHashCount} |
`;

const buildSourceArtifactSection = (
  references: readonly PublicActionIdentitiesCompactV0SourceArtifactReference[],
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
  result: PublicActionIdentitiesCompactV0Result;
  summary: PublicActionIdentitiesCompactV0Summary;
}) => `# Public Action Identities Compact v0

## Run

- suite id: ${summary.suiteId}
- compact run id: ${summary.compactRunId}
- phase id: ${summary.phaseId}
- source benchmark suite id: ${summary.sourceBenchmarkSuiteId}
- source cFp77 run id: ${summary.sourceCfp77RunId}
- compact readiness status: ${summary.compactReadinessStatus}
${buildSourceConsistencySection(result.sourceConsistency)}
## Row Counts

| Row kind | Count |
|---|---:|
| compact action rows | ${summary.compactActionRowCount} |
| compact root-index rows | ${summary.compactRootIndexRowCount} |
| compact skipped-root rows | ${summary.compactSkippedRootRowCount} |

## Artifact Sizes

| Artifact | Bytes | Target |
|---|---:|---|
| action-identities-compact.jsonl | ${summary.artifactByteSizes.actionIdentitiesCompactJsonlBytes} | ${compactActionIdentitiesTargetLabel(summary.artifactByteSizes.actionIdentitiesCompactJsonlBytes)} |
| root-index.jsonl | ${summary.artifactByteSizes.rootIndexJsonlBytes} | below 90 MB hard stop |
| skipped-roots.jsonl | ${summary.artifactByteSizes.skippedRootsJsonlBytes} | below 90 MB hard stop |

## Bytes Saved Versus cFp77

| File | Bytes saved | % reduction |
|---|---:|---:|
| action-identities-compact.jsonl vs action-identities.jsonl | ${summary.bytesSaved.actionIdentitiesCompactVsCfp77Bytes} | ${summary.bytesSaved.actionIdentitiesCompactVsCfp77PercentReduction}% |
| root-index.jsonl vs root-summaries.jsonl | ${summary.bytesSaved.rootIndexVsCfp77RootSummariesBytes} | n/a |
| skipped-roots.jsonl vs cFp77 skipped-roots.jsonl | ${summary.bytesSaved.skippedRootsVsCfp77Bytes} | n/a |

## Count Summaries

### Public Action Kind

| Kind | Count |
|---|---:|
${formatCountRows(result.countSummaries.publicActionKindCounts)}

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

### By Source Class

| Source class | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsBySourceClass)}

### By Target Token

| Target token | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByTargetToken)}

### By Move-Count Bucket

| Move-count bucket | Count |
|---|---:|
${formatCountRows(result.countSummaries.countsByMoveCountBucket)}

## Hidden-Info Safety

- scan status: ${summary.hiddenInfoScanStatus}
- hazards detected: ${summary.hiddenInfoScanHazards.length === 0 ? "none" : summary.hiddenInfoScanHazards.join(", ")}

${HIDDEN_INFO_SAFETY_NOTE}
${buildSourceArtifactSection(summary.sourceArtifactReferences)}
## Non-Claims

${summary.explicitNonClaims.map((claim) => `- ${claim}`).join("\n")}

## cFp79 Recommendation

${summary.cFp79Recommendation}
`;

export const buildPublicActionIdentitiesCompactV0Summary = ({
  result,
  compactRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceCfp77RunId,
  sourceArtifactReferences,
  artifactByteSizes,
  bytesSaved,
  hiddenInfoScanHazards,
  cFp79Recommendation,
}: {
  result: PublicActionIdentitiesCompactV0Result;
  compactRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp77RunId: string;
  sourceArtifactReferences: readonly PublicActionIdentitiesCompactV0SourceArtifactReference[];
  artifactByteSizes: PublicActionIdentitiesCompactV0ArtifactByteSizes;
  bytesSaved: PublicActionIdentitiesCompactV0BytesSaved;
  hiddenInfoScanHazards: readonly string[];
  cFp79Recommendation: string;
}): PublicActionIdentitiesCompactV0Summary => ({
  schemaVersion: "public-action-identities-compact-v0-summary-v1",
  compactRunId,
  phaseId: "cFp78",
  suiteId,
  sourceBenchmarkSuiteId,
  sourceCfp77RunId,
  sourceArtifactReferences,
  sourceArtifactReferenceCount: sourceArtifactReferences.length,
  sourceArtifactEmptyHashCount: result.sourceConsistency.sourceArtifactEmptyHashCount,
  sourceConsistency: result.sourceConsistency,
  compactReadinessStatus: result.compactReadinessStatus,
  compactActionRowCount: result.compactActionRows.length,
  compactRootIndexRowCount: result.compactRootIndexRows.length,
  compactSkippedRootRowCount: result.compactSkippedRootRows.length,
  artifactByteSizes,
  bytesSaved,
  isBelowCompactActionTarget:
    artifactByteSizes.actionIdentitiesCompactJsonlBytes < COMPACT_ACTION_IDENTITIES_TARGET_BYTES,
  isBelowHardStop: artifactByteSizes.actionIdentitiesCompactJsonlBytes < HARD_STOP_BYTES,
  countSummaries: result.countSummaries,
  hiddenInfoScanStatus: hiddenInfoScanHazards.length === 0 ? "clean" : "hazards_detected",
  hiddenInfoScanHazards,
  explicitNonClaims: CFP78_EXPLICIT_NON_CLAIMS,
  cFp79Recommendation,
});

export const serializePublicActionIdentitiesCompactV0Artifacts = ({
  result,
  compactRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  sourceCfp77RunId,
  sourceArtifactReferences,
  cfp77Sizes,
}: {
  result: PublicActionIdentitiesCompactV0Result;
  compactRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  sourceCfp77RunId: string;
  sourceArtifactReferences: readonly PublicActionIdentitiesCompactV0SourceArtifactReference[];
  cfp77Sizes: {
    actionIdentitiesJsonlBytes: number;
    rootSummariesJsonlBytes: number;
    skippedRootsJsonlBytes: number;
  };
}): SerializedPublicActionIdentitiesCompactV0Artifacts => {
  const actionIdentitiesCompactJsonl = jsonlText(result.compactActionRows);
  const rootIndexJsonl = jsonlText(result.compactRootIndexRows);
  const skippedRootsJsonl = jsonlText(result.compactSkippedRootRows);

  const artifactByteSizes: PublicActionIdentitiesCompactV0ArtifactByteSizes = {
    actionIdentitiesCompactJsonlBytes: Buffer.byteLength(actionIdentitiesCompactJsonl, "utf8"),
    rootIndexJsonlBytes: Buffer.byteLength(rootIndexJsonl, "utf8"),
    skippedRootsJsonlBytes: Buffer.byteLength(skippedRootsJsonl, "utf8"),
  };

  const bytesSaved = buildBytesSaved({ cfp77Sizes, artifactByteSizes });
  const cFp79Recommendation = cFp79RecommendationFor({ result, artifactByteSizes });

  const preliminarySummary = buildPublicActionIdentitiesCompactV0Summary({
    result,
    compactRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceCfp77RunId,
    sourceArtifactReferences,
    artifactByteSizes,
    bytesSaved,
    hiddenInfoScanHazards: [],
    cFp79Recommendation,
  });

  const preliminaryReport = buildMarkdownReport({ result, summary: preliminarySummary });
  const hiddenInfoScanHazards = scanPublicActionIdentitiesV0TextForHiddenInfo(
    [actionIdentitiesCompactJsonl, rootIndexJsonl, skippedRootsJsonl, preliminaryReport].join("\n"),
  );

  const summary = buildPublicActionIdentitiesCompactV0Summary({
    result,
    compactRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    sourceCfp77RunId,
    sourceArtifactReferences,
    artifactByteSizes,
    bytesSaved,
    hiddenInfoScanHazards,
    cFp79Recommendation,
  });

  const summaryJson = stablePrettyJson(summary);
  const reportMarkdown = buildMarkdownReport({ result, summary });

  const artifactHashes = {
    "summary.json": sha256(summaryJson),
    "action-identities-compact.jsonl": sha256(actionIdentitiesCompactJsonl),
    "root-index.jsonl": sha256(rootIndexJsonl),
    "skipped-roots.jsonl": sha256(skippedRootsJsonl),
    "report.md": sha256(reportMarkdown),
  };

  const manifest: PublicActionIdentitiesCompactV0ArtifactManifest = {
    schemaVersion: "public-action-identities-compact-v0-artifact-v1",
    compactRunId,
    phaseId: "cFp78",
    suiteId,
    sourceBenchmarkSuiteId,
    relativeOutputPath: relativeOutputPath(suiteId),
    generatedAtTimestampPolicy: "deterministic-no-wall-clock",
    files: [...publicActionIdentitiesCompactV0ArtifactFiles],
    compactReadinessStatus: result.compactReadinessStatus,
    sourceCfp77RunId,
    sourceArtifactReferences,
    compactActionSchemaVersion: "public-action-identities-compact-v0-action-v1",
    rootIndexSchemaVersion: "public-action-identities-compact-v0-root-index-v1",
    skippedRootSchemaVersion: "public-action-identities-compact-v0-skipped-root-v1",
    summarySchemaVersion: "public-action-identities-compact-v0-summary-v1",
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
    explicitNonClaims: CFP78_EXPLICIT_NON_CLAIMS,
    cFp79Recommendation: summary.cFp79Recommendation,
    artifactHashes,
  };

  return {
    manifestJson: stablePrettyJson(manifest),
    summaryJson,
    actionIdentitiesCompactJsonl,
    rootIndexJsonl,
    skippedRootsJsonl,
    reportMarkdown,
  };
};

export const writePublicActionIdentitiesCompactV0Artifacts = async ({
  outDir,
  artifacts,
}: {
  outDir: string;
  artifacts: SerializedPublicActionIdentitiesCompactV0Artifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(
      resolve(outDir, "action-identities-compact.jsonl"),
      artifacts.actionIdentitiesCompactJsonl,
      "utf8",
    ),
    writeFile(resolve(outDir, "root-index.jsonl"), artifacts.rootIndexJsonl, "utf8"),
    writeFile(resolve(outDir, "skipped-roots.jsonl"), artifacts.skippedRootsJsonl, "utf8"),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);

  return {
    outDir,
    files: [...publicActionIdentitiesCompactV0ArtifactFiles],
  };
};

export const combinedPublicActionIdentitiesCompactV0ArtifactText = (
  artifacts: SerializedPublicActionIdentitiesCompactV0Artifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.actionIdentitiesCompactJsonl,
    artifacts.rootIndexJsonl,
    artifacts.skippedRootsJsonl,
    artifacts.reportMarkdown,
  ].join("\n");

export const scanPublicActionIdentitiesCompactV0ArtifactsForHiddenInfo = (
  artifacts: SerializedPublicActionIdentitiesCompactV0Artifacts,
): string[] =>
  scanPublicActionIdentitiesV0TextForHiddenInfo(
    combinedPublicActionIdentitiesCompactV0ArtifactText(artifacts),
  );

export const publicActionIdentitiesCompactV0ArtifactHashes = (
  artifacts: SerializedPublicActionIdentitiesCompactV0Artifacts,
) => {
  const sha = (v: string) => createHash("sha256").update(v, "utf8").digest("hex");
  return {
    "manifest.json": sha(artifacts.manifestJson),
    "summary.json": sha(artifacts.summaryJson),
    "action-identities-compact.jsonl": sha(artifacts.actionIdentitiesCompactJsonl),
    "root-index.jsonl": sha(artifacts.rootIndexJsonl),
    "skipped-roots.jsonl": sha(artifacts.skippedRootsJsonl),
    "report.md": sha(artifacts.reportMarkdown),
  };
};

export type {
  PublicActionIdentitiesCompactV0ActionRow,
  PublicActionIdentitiesCompactV0RootIndexRow,
  PublicActionIdentitiesCompactV0SkippedRootRow,
};
