import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  SearchConsumerActionFeatureDictionaryV0BuildInput,
  SearchConsumerActionFeatureDictionaryV0Cfp79SummaryInput,
  SearchConsumerActionFeatureDictionaryV0Result,
  SearchConsumerActionFeatureDictionaryV0SourceArtifactReference,
  SearchConsumerActionFeatureDictionaryV0SourceRunIds,
  SearchConsumerActionFeaturesV1ActionFeatureRow,
  SearchConsumerActionFeaturesV1RootFeatureRow,
  SearchConsumerActionFeaturesV1SkippedRootRow,
  SerializedSearchConsumerActionFeatureDictionaryV0Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  buildSearchConsumerActionFeatureDictionaryV0Result: (
    input: SearchConsumerActionFeatureDictionaryV0BuildInput,
  ) => SearchConsumerActionFeatureDictionaryV0Result;
  serializeSearchConsumerActionFeatureDictionaryV0Artifacts: (input: {
    result: SearchConsumerActionFeatureDictionaryV0Result;
    featureRunId: string;
    suiteId: string;
    sourceBenchmarkSuiteId: string;
    sourceRunIds: SearchConsumerActionFeatureDictionaryV0SourceRunIds;
    sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
    sourceCfp79ActionFeaturesJsonlBytes: number;
  }) => SerializedSearchConsumerActionFeatureDictionaryV0Artifacts;
  scanSearchConsumerActionFeatureDictionaryV0ArtifactsForHiddenInfo: (
    artifacts: SerializedSearchConsumerActionFeatureDictionaryV0Artifacts,
  ) => string[];
  searchConsumerActionFeatureDictionaryV0ArtifactHashes: (
    artifacts: SerializedSearchConsumerActionFeatureDictionaryV0Artifacts,
  ) => Record<string, string>;
  writeSearchConsumerActionFeatureDictionaryV0Artifacts: (input: {
    outDir: string;
    artifacts: SerializedSearchConsumerActionFeatureDictionaryV0Artifacts;
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
  resolve(benchmarkResultsDir, suiteId, "search-consumer-action-features-dictionary-v0/cFp80");

const defaultRunId = () => "cFp80";

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
const readJsonlText = <T>(text: string): T[] =>
  text.trim().length === 0
    ? []
    : text
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as T);
const readJsonl = async <T>(path: string): Promise<T[]> => readJsonlText<T>(await readText(path));

const sha256Text = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");
const EMPTY_SHA256 = sha256Text("");
const toRelativePath = (path: string) => relative(rootDir, path).replaceAll("\\", "/");

interface Cfp79ManifestFile {
  featureRunId: string;
  sourceBenchmarkSuiteId: string;
}

const sourceArtifactReferencesForSuite = async (
  suiteId: string,
): Promise<SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[]> => {
  const paths = [
    "search-consumer-action-features-v1/cFp79/manifest.json",
    "search-consumer-action-features-v1/cFp79/summary.json",
    "search-consumer-action-features-v1/cFp79/root-features.jsonl",
    "search-consumer-action-features-v1/cFp79/action-features.jsonl",
    "search-consumer-action-features-v1/cFp79/skipped-roots.jsonl",
    "search-consumer-action-features-v1/cFp79/report.md",
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
  const actionFeaturesPath = artifactPath(
    suiteId,
    "search-consumer-action-features-v1/cFp79/action-features.jsonl",
  );
  const [
    cfp79Manifest,
    cfp79Summary,
    cfp79RootFeatures,
    cfp79ActionFeaturesText,
    cfp79SkippedRoots,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<Cfp79ManifestFile>(
      artifactPath(suiteId, "search-consumer-action-features-v1/cFp79/manifest.json"),
    ),
    readJson<SearchConsumerActionFeatureDictionaryV0Cfp79SummaryInput>(
      artifactPath(suiteId, "search-consumer-action-features-v1/cFp79/summary.json"),
    ),
    readJsonl<SearchConsumerActionFeaturesV1RootFeatureRow>(
      artifactPath(suiteId, "search-consumer-action-features-v1/cFp79/root-features.jsonl"),
    ),
    readText(actionFeaturesPath),
    readJsonl<SearchConsumerActionFeaturesV1SkippedRootRow>(
      artifactPath(suiteId, "search-consumer-action-features-v1/cFp79/skipped-roots.jsonl"),
    ),
    sourceArtifactReferencesForSuite(suiteId),
  ]);
  const cfp79ActionFeatures =
    readJsonlText<SearchConsumerActionFeaturesV1ActionFeatureRow>(cfp79ActionFeaturesText);
  const sourceArtifactEmptyHashCount = sourceArtifactReferences.filter(
    (reference) => reference.sha256 === EMPTY_SHA256,
  ).length;

  return {
    cfp79Manifest,
    cfp79Summary,
    cfp79RootFeatures,
    cfp79ActionFeatures,
    cfp79SkippedRoots,
    sourceCfp79ActionFeaturesJsonlBytes: Buffer.byteLength(cfp79ActionFeaturesText, "utf8"),
    sourceArtifactReferences,
    sourceArtifactEmptyHashCount,
  };
};

const run = async () => {
  const startedAt = performance.now();
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const sourceArtifacts = await readSourceArtifacts(options.suiteId);
  const sourceRunIds: SearchConsumerActionFeatureDictionaryV0SourceRunIds = {
    cfp79: sourceArtifacts.cfp79Manifest.featureRunId,
  };

  const result = benchmark.buildSearchConsumerActionFeatureDictionaryV0Result({
    suiteId: options.suiteId,
    featureRunId: options.runId,
    sourceBenchmarkSuiteId: sourceArtifacts.cfp79Manifest.sourceBenchmarkSuiteId,
    sourceCfp79RunId: sourceArtifacts.cfp79Manifest.featureRunId,
    cfp79Summary: sourceArtifacts.cfp79Summary,
    cfp79RootFeatures: sourceArtifacts.cfp79RootFeatures,
    cfp79ActionFeatures: sourceArtifacts.cfp79ActionFeatures,
    cfp79SkippedRoots: sourceArtifacts.cfp79SkippedRoots,
    sourceArtifactReferenceCount: sourceArtifacts.sourceArtifactReferences.length,
    sourceArtifactEmptyHashCount: sourceArtifacts.sourceArtifactEmptyHashCount,
  });

  if (result.consumerReadinessStatus === "source_consistency_failed") {
    throw new Error(
      `search-consumer-action-feature-dictionary-v0: source consistency not ready: ${JSON.stringify(
        result.sourceConsistency,
      )}`,
    );
  }

  const artifacts = benchmark.serializeSearchConsumerActionFeatureDictionaryV0Artifacts({
    result,
    featureRunId: options.runId,
    suiteId: options.suiteId,
    sourceBenchmarkSuiteId: sourceArtifacts.cfp79Manifest.sourceBenchmarkSuiteId,
    sourceRunIds,
    sourceArtifactReferences: sourceArtifacts.sourceArtifactReferences,
    sourceCfp79ActionFeaturesJsonlBytes: sourceArtifacts.sourceCfp79ActionFeaturesJsonlBytes,
  });

  const hiddenInfoIssues =
    benchmark.scanSearchConsumerActionFeatureDictionaryV0ArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `search-consumer-action-feature-dictionary-v0 hidden-info scan failed: ${hiddenInfoIssues.join(
        ", ",
      )}`,
    );
  }

  const jsonlArtifacts: Record<string, string> = {
    "root-features.jsonl": artifacts.rootFeaturesJsonl,
    "action-features-compact.jsonl": artifacts.actionFeaturesCompactJsonl,
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

  const actionFeatureBytes = byteSizes["action-features-compact.jsonl"] ?? 0;
  if (
    options.suiteId === "benchmark-v1-starter-matrix-robust-v1" &&
    actionFeatureBytes >= 50 * 1024 * 1024
  ) {
    throw new Error(
      `action-features-compact.jsonl is ${actionFeatureBytes} bytes, at or above the 50 MB target`,
    );
  }

  await benchmark.writeSearchConsumerActionFeatureDictionaryV0Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.searchConsumerActionFeatureDictionaryV0ArtifactHashes(artifacts);
  console.log(
    [
      `benchmark search-consumer-action-feature-dictionary-v0 complete: suite=${options.suiteId}`,
      `featureRunId=${options.runId}`,
      `consumerReadinessStatus=${result.consumerReadinessStatus}`,
      `sourceConsistencyStatus=${result.sourceConsistency.status}`,
      `reconstructionStatus=${result.reconstructionStatus}`,
      `reconstructionMismatchCount=${result.reconstructionMismatchCount}`,
      `rootFeatureRowCount=${result.rootFeatures.length}`,
      `compactActionFeatureRowCount=${result.compactActionFeatures.length}`,
      `skippedRootRowCount=${result.skippedRoots.length}`,
      `hiddenInfoScan=passed`,
      ...Object.entries(byteSizes).map(([file, bytes]) => `${file}Bytes=${bytes}`),
      `sourceActionFeaturesJsonlBytes=${sourceArtifacts.sourceCfp79ActionFeaturesJsonlBytes}`,
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
