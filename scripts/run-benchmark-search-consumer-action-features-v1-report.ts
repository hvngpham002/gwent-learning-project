import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  PublicActionIdentitiesCompactV0ActionRow,
  PublicActionIdentitiesCompactV0RootIndexRow,
  PublicActionIdentitiesCompactV0SkippedRootRow,
  SearchConsumerActionFeaturesV0RootFeatureRow,
  SearchConsumerActionFeaturesV0SkippedRootRow,
  SearchConsumerActionFeaturesV1BuildInput,
  SearchConsumerActionFeaturesV1Cfp76SummaryInput,
  SearchConsumerActionFeaturesV1Cfp78SummaryInput,
  SearchConsumerActionFeaturesV1Result,
  SearchConsumerActionFeaturesV1SourceArtifactReference,
  SearchConsumerActionFeaturesV1SourceRunIds,
  SerializedSearchConsumerActionFeaturesV1Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  buildSearchConsumerActionFeaturesV1Result: (
    input: SearchConsumerActionFeaturesV1BuildInput,
  ) => SearchConsumerActionFeaturesV1Result;
  serializeSearchConsumerActionFeaturesV1Artifacts: (input: {
    result: SearchConsumerActionFeaturesV1Result;
    featureRunId: string;
    suiteId: string;
    sourceBenchmarkSuiteId: string;
    sourceRunIds: SearchConsumerActionFeaturesV1SourceRunIds;
    sourceArtifactReferences: readonly SearchConsumerActionFeaturesV1SourceArtifactReference[];
  }) => SerializedSearchConsumerActionFeaturesV1Artifacts;
  scanSearchConsumerActionFeaturesV1ArtifactsForHiddenInfo: (
    artifacts: SerializedSearchConsumerActionFeaturesV1Artifacts,
  ) => string[];
  searchConsumerActionFeaturesV1ArtifactHashes: (
    artifacts: SerializedSearchConsumerActionFeaturesV1Artifacts,
  ) => Record<string, string>;
  writeSearchConsumerActionFeaturesV1Artifacts: (input: {
    outDir: string;
    artifacts: SerializedSearchConsumerActionFeaturesV1Artifacts;
  }) => Promise<{ outDir: string; files: readonly string[] }>;
}

interface CliOptions {
  suiteId: string;
  outDir: string;
  runId: string;
}

class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

const KNOWN_SUITE_IDS = new Set<string>([
  "benchmark-v1-starter-matrix-v1",
  "benchmark-v1-starter-matrix-robust-v1",
]);

const DEFAULT_SUITE_ID = "benchmark-v1-starter-matrix-v1";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const benchmarkResultsDir = resolve(rootDir, "docs/research/literature/ai/benchmark-results");

const defaultOutputDir = (suiteId: string) =>
  resolve(benchmarkResultsDir, suiteId, "search-consumer-action-features-v1/cFp79");

const defaultRunId = () => "cFp79";

const readOptionValue = (args: readonly string[], index: number, flag: string) => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new CliUsageError(`${flag} requires a value.`);
  }
  return value;
};

const parseArgs = (args: readonly string[]): CliOptions => {
  let suiteId = DEFAULT_SUITE_ID;
  let outDir: string | undefined;
  let runId: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--suite") {
      suiteId = readOptionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("--suite=")) {
      suiteId = arg.slice("--suite=".length);
    } else if (arg === "--out") {
      outDir = resolve(rootDir, readOptionValue(args, index, arg));
      index += 1;
    } else if (arg.startsWith("--out=")) {
      outDir = resolve(rootDir, arg.slice("--out=".length));
    } else if (arg === "--run-id") {
      runId = readOptionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("--run-id=")) {
      runId = arg.slice("--run-id=".length);
    } else {
      throw new CliUsageError(`Unknown option: ${arg}.`);
    }
  }

  if (!suiteId) throw new CliUsageError("--suite cannot be empty.");
  if (!KNOWN_SUITE_IDS.has(suiteId)) {
    throw new CliUsageError(`Unknown suite id: ${suiteId}.`);
  }

  return {
    suiteId,
    outDir: outDir ?? defaultOutputDir(suiteId),
    runId: runId ?? defaultRunId(),
  };
};

const loadBenchmarkModule = async () => {
  const server = await createServer({
    root: rootDir,
    configFile: resolve(rootDir, "vite.config.ts"),
    logLevel: "error",
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    return (await server.ssrLoadModule("/src/game/benchmark/index.ts")) as BenchmarkModule;
  } finally {
    await server.close();
  }
};

const artifactPath = (suiteId: string, ...segments: string[]) =>
  resolve(benchmarkResultsDir, suiteId, ...segments);

const readText = (path: string) => readFile(path, "utf8");
const readJson = async <T>(path: string): Promise<T> => JSON.parse(await readText(path)) as T;
const readJsonl = async <T>(path: string): Promise<T[]> => {
  const text = await readText(path);
  return text.trim().length === 0
    ? []
    : text
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as T);
};

const sha256Text = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
const EMPTY_SHA256 = sha256Text("");
const toRelativePath = (path: string) => relative(rootDir, path).replaceAll("\\", "/");

interface Cfp76ManifestFile {
  featureRunId: string;
  sourceBenchmarkSuiteId: string;
}

interface Cfp78ManifestFile {
  compactRunId: string;
  sourceBenchmarkSuiteId: string;
}

const sourceArtifactReferencesForSuite = async (
  suiteId: string,
): Promise<SearchConsumerActionFeaturesV1SourceArtifactReference[]> => {
  const paths = [
    "search-consumer-action-features-v0/cFp76/manifest.json",
    "search-consumer-action-features-v0/cFp76/summary.json",
    "search-consumer-action-features-v0/cFp76/root-features.jsonl",
    "search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl",
    "search-consumer-action-features-v0/cFp76/skipped-roots.jsonl",
    "search-consumer-action-features-v0/cFp76/report.md",
    "public-action-identities-compact-v0/cFp78/manifest.json",
    "public-action-identities-compact-v0/cFp78/summary.json",
    "public-action-identities-compact-v0/cFp78/action-identities-compact.jsonl",
    "public-action-identities-compact-v0/cFp78/root-index.jsonl",
    "public-action-identities-compact-v0/cFp78/skipped-roots.jsonl",
    "public-action-identities-compact-v0/cFp78/report.md",
  ];

  return Promise.all(
    paths.map(async (path) => {
      const absolutePath = artifactPath(suiteId, path);
      const text = await readText(absolutePath);
      return {
        label: toRelativePath(absolutePath),
        relativePath: toRelativePath(absolutePath),
        sha256: sha256Text(text),
      };
    }),
  );
};

const readSourceArtifacts = async (suiteId: string) => {
  const [
    cfp76Manifest,
    cfp76Summary,
    cfp76RootFeatures,
    cfp76SkippedRoots,
    cfp78Manifest,
    cfp78Summary,
    cfp78ActionIdentities,
    cfp78RootIndexRows,
    cfp78SkippedRoots,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<Cfp76ManifestFile>(
      artifactPath(suiteId, "search-consumer-action-features-v0/cFp76/manifest.json"),
    ),
    readJson<SearchConsumerActionFeaturesV1Cfp76SummaryInput>(
      artifactPath(suiteId, "search-consumer-action-features-v0/cFp76/summary.json"),
    ),
    readJsonl<SearchConsumerActionFeaturesV0RootFeatureRow>(
      artifactPath(suiteId, "search-consumer-action-features-v0/cFp76/root-features.jsonl"),
    ),
    readJsonl<SearchConsumerActionFeaturesV0SkippedRootRow>(
      artifactPath(suiteId, "search-consumer-action-features-v0/cFp76/skipped-roots.jsonl"),
    ),
    readJson<Cfp78ManifestFile>(
      artifactPath(suiteId, "public-action-identities-compact-v0/cFp78/manifest.json"),
    ),
    readJson<SearchConsumerActionFeaturesV1Cfp78SummaryInput>(
      artifactPath(suiteId, "public-action-identities-compact-v0/cFp78/summary.json"),
    ),
    readJsonl<PublicActionIdentitiesCompactV0ActionRow>(
      artifactPath(
        suiteId,
        "public-action-identities-compact-v0/cFp78/action-identities-compact.jsonl",
      ),
    ),
    readJsonl<PublicActionIdentitiesCompactV0RootIndexRow>(
      artifactPath(suiteId, "public-action-identities-compact-v0/cFp78/root-index.jsonl"),
    ),
    readJsonl<PublicActionIdentitiesCompactV0SkippedRootRow>(
      artifactPath(suiteId, "public-action-identities-compact-v0/cFp78/skipped-roots.jsonl"),
    ),
    sourceArtifactReferencesForSuite(suiteId),
  ]);

  const sourceArtifactEmptyHashCount = sourceArtifactReferences.filter(
    (reference) => reference.sha256 === EMPTY_SHA256,
  ).length;

  return {
    cfp76Manifest,
    cfp76Summary,
    cfp76RootFeatures,
    cfp76SkippedRoots,
    cfp78Manifest,
    cfp78Summary,
    cfp78ActionIdentities,
    cfp78RootIndexRows,
    cfp78SkippedRoots,
    sourceArtifactReferences,
    sourceArtifactEmptyHashCount,
  };
};

const run = async () => {
  const startedAt = performance.now();
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const sourceArtifacts = await readSourceArtifacts(options.suiteId);
  const sourceRunIds: SearchConsumerActionFeaturesV1SourceRunIds = {
    cfp76: sourceArtifacts.cfp76Manifest.featureRunId,
    cfp78: sourceArtifacts.cfp78Manifest.compactRunId,
  };

  const result = benchmark.buildSearchConsumerActionFeaturesV1Result({
    suiteId: options.suiteId,
    featureRunId: options.runId,
    sourceBenchmarkSuiteId: sourceArtifacts.cfp76Manifest.sourceBenchmarkSuiteId,
    sourceCfp76RunId: sourceArtifacts.cfp76Manifest.featureRunId,
    sourceCfp78RunId: sourceArtifacts.cfp78Manifest.compactRunId,
    cfp76Summary: sourceArtifacts.cfp76Summary,
    cfp76RootFeatures: sourceArtifacts.cfp76RootFeatures,
    cfp76SkippedRoots: sourceArtifacts.cfp76SkippedRoots,
    cfp78Summary: sourceArtifacts.cfp78Summary,
    cfp78ActionIdentities: sourceArtifacts.cfp78ActionIdentities,
    cfp78RootIndexRows: sourceArtifacts.cfp78RootIndexRows,
    cfp78SkippedRoots: sourceArtifacts.cfp78SkippedRoots,
    sourceArtifactReferenceCount: sourceArtifacts.sourceArtifactReferences.length,
    sourceArtifactEmptyHashCount: sourceArtifacts.sourceArtifactEmptyHashCount,
  });

  if (result.consumerReadinessStatus === "source_consistency_failed") {
    throw new Error(
      `search-consumer-action-features-v1: source consistency not ready: ${JSON.stringify(
        result.sourceConsistency,
      )}`,
    );
  }

  const artifacts = benchmark.serializeSearchConsumerActionFeaturesV1Artifacts({
    result,
    featureRunId: options.runId,
    suiteId: options.suiteId,
    sourceBenchmarkSuiteId: sourceArtifacts.cfp76Manifest.sourceBenchmarkSuiteId,
    sourceRunIds,
    sourceArtifactReferences: sourceArtifacts.sourceArtifactReferences,
  });

  const hiddenInfoIssues =
    benchmark.scanSearchConsumerActionFeaturesV1ArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `search-consumer-action-features-v1 hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }

  const jsonlArtifacts: Record<string, string> = {
    "root-features.jsonl": artifacts.rootFeaturesJsonl,
    "action-features.jsonl": artifacts.actionFeaturesJsonl,
    "skipped-roots.jsonl": artifacts.skippedRootsJsonl,
  };
  const byteSizes: Record<string, number> = {};
  for (const [file, text] of Object.entries(jsonlArtifacts)) {
    const bytes = Buffer.byteLength(text, "utf8");
    byteSizes[file] = bytes;
    if (bytes >= 90 * 1024 * 1024) {
      throw new Error(`${file} is ${bytes} bytes and at or above the 90 MB hard stop`);
    }
  }

  const actionFeatureBytes = byteSizes["action-features.jsonl"] ?? 0;
  if (
    options.suiteId === "benchmark-v1-starter-matrix-robust-v1" &&
    actionFeatureBytes >= 50 * 1024 * 1024
  ) {
    console.warn(
      `WARNING: action-features.jsonl is ${actionFeatureBytes} bytes, at or above the ` +
        `50 MB robust target. cFp80 should compact or dictionary-encode this projection.`,
    );
  }

  await benchmark.writeSearchConsumerActionFeaturesV1Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.searchConsumerActionFeaturesV1ArtifactHashes(artifacts);
  console.log(
    [
      `benchmark search-consumer-action-features-v1 complete: suite=${options.suiteId}`,
      `featureRunId=${options.runId}`,
      `consumerReadinessStatus=${result.consumerReadinessStatus}`,
      `sourceConsistencyStatus=${result.sourceConsistency.status}`,
      `rootFeatureRowCount=${result.rootFeatures.length}`,
      `actionFeatureRowCount=${result.actionFeatures.length}`,
      `skippedRootRowCount=${result.skippedRoots.length}`,
      `hiddenInfoScan=passed`,
      ...Object.entries(byteSizes).map(([file, bytes]) => `${file}Bytes=${bytes}`),
      `elapsedMs=${elapsedMs}`,
      `out=${toRelativePath(options.outDir)}`,
      ...Object.entries(hashes).map(([file, hash]) => `${file}=${hash}`),
    ].join("\n"),
  );
};

run().catch((error: unknown) => {
  if (error instanceof CliUsageError) {
    console.error(error.message);
  } else if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error(String(error));
  }
  process.exitCode = 1;
});
