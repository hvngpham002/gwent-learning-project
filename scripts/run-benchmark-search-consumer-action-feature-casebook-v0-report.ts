import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  SearchConsumerActionFeatureCasebookV0BuildInput,
  SearchConsumerActionFeatureCasebookV0Cfp80SummaryInput,
  SearchConsumerActionFeatureCasebookV0DictionaryGroups,
  SearchConsumerActionFeatureCasebookV0Result,
  SearchConsumerActionFeatureCasebookV0SourceArtifactByteSizes,
  SearchConsumerActionFeatureCasebookV0SourceRunIds,
  SearchConsumerActionFeatureDictionaryV0ActionRow,
  SearchConsumerActionFeatureDictionaryV0RootFeatureRow,
  SearchConsumerActionFeatureDictionaryV0SkippedRootRow,
  SearchConsumerActionFeatureDictionaryV0SourceArtifactReference,
  SerializedSearchConsumerActionFeatureCasebookV0Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  buildSearchConsumerActionFeatureCasebookV0Result: (
    input: SearchConsumerActionFeatureCasebookV0BuildInput,
  ) => SearchConsumerActionFeatureCasebookV0Result;
  serializeSearchConsumerActionFeatureCasebookV0Artifacts: (input: {
    result: SearchConsumerActionFeatureCasebookV0Result;
    casebookRunId: string;
    suiteId: string;
    sourceBenchmarkSuiteId: string;
    sourceRunIds: SearchConsumerActionFeatureCasebookV0SourceRunIds;
    sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[];
    sourceArtifactByteSizes: SearchConsumerActionFeatureCasebookV0SourceArtifactByteSizes;
  }) => SerializedSearchConsumerActionFeatureCasebookV0Artifacts;
  scanSearchConsumerActionFeatureCasebookV0ArtifactsForHiddenInfo: (
    artifacts: SerializedSearchConsumerActionFeatureCasebookV0Artifacts,
  ) => string[];
  searchConsumerActionFeatureCasebookV0ArtifactHashes: (
    artifacts: SerializedSearchConsumerActionFeatureCasebookV0Artifacts,
  ) => Record<string, string>;
  writeSearchConsumerActionFeatureCasebookV0Artifacts: (input: {
    outDir: string;
    artifacts: SerializedSearchConsumerActionFeatureCasebookV0Artifacts;
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
  resolve(benchmarkResultsDir, suiteId, "search-consumer-action-feature-casebook-v0/cFp81");

const defaultRunId = () => "cFp81";

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

interface Cfp80ManifestFile {
  featureRunId: string;
  sourceBenchmarkSuiteId: string;
}

interface Cfp80DictionariesFile {
  groups: SearchConsumerActionFeatureCasebookV0DictionaryGroups;
}

const cfp80SourceArtifactFiles = [
  "manifest.json",
  "summary.json",
  "dictionaries.json",
  "root-features.jsonl",
  "action-features-compact.jsonl",
  "skipped-roots.jsonl",
  "report.md",
] as const;

const sourceArtifactRelativePath = (file: (typeof cfp80SourceArtifactFiles)[number]) =>
  `search-consumer-action-features-dictionary-v0/cFp80/${file}`;

const sourceArtifactReferencesForSuite = async (
  suiteId: string,
): Promise<SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[]> =>
  Promise.all(
    cfp80SourceArtifactFiles.map(async (file) => {
      const absolutePath = artifactPath(suiteId, sourceArtifactRelativePath(file));
      const text = await readText(absolutePath);
      return {
        label: toRelativePath(absolutePath),
        relativePath: toRelativePath(absolutePath),
        sha256: sha256Text(text),
      };
    }),
  );

const readSourceArtifacts = async (suiteId: string) => {
  const manifestPath = artifactPath(suiteId, sourceArtifactRelativePath("manifest.json"));
  const summaryPath = artifactPath(suiteId, sourceArtifactRelativePath("summary.json"));
  const dictionariesPath = artifactPath(suiteId, sourceArtifactRelativePath("dictionaries.json"));
  const rootFeaturesPath = artifactPath(suiteId, sourceArtifactRelativePath("root-features.jsonl"));
  const compactActionsPath = artifactPath(
    suiteId,
    sourceArtifactRelativePath("action-features-compact.jsonl"),
  );
  const skippedRootsPath = artifactPath(suiteId, sourceArtifactRelativePath("skipped-roots.jsonl"));
  const reportPath = artifactPath(suiteId, sourceArtifactRelativePath("report.md"));

  const [
    cfp80Manifest,
    cfp80Summary,
    cfp80Dictionaries,
    cfp80RootFeatures,
    cfp80CompactActionFeaturesText,
    cfp80SkippedRoots,
    cfp80ReportText,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<Cfp80ManifestFile>(manifestPath),
    readJson<SearchConsumerActionFeatureCasebookV0Cfp80SummaryInput>(summaryPath),
    readJson<Cfp80DictionariesFile>(dictionariesPath),
    readJsonl<SearchConsumerActionFeatureDictionaryV0RootFeatureRow>(rootFeaturesPath),
    readText(compactActionsPath),
    readJsonl<SearchConsumerActionFeatureDictionaryV0SkippedRootRow>(skippedRootsPath),
    readText(reportPath),
    sourceArtifactReferencesForSuite(suiteId),
  ]);
  const cfp80CompactActionFeatures =
    readJsonlText<SearchConsumerActionFeatureDictionaryV0ActionRow>(
      cfp80CompactActionFeaturesText,
    );
  const sourceArtifactEmptyHashCount = sourceArtifactReferences.filter(
    (reference) => reference.sha256 === EMPTY_SHA256,
  ).length;
  const sourceArtifactByteSizes: SearchConsumerActionFeatureCasebookV0SourceArtifactByteSizes = {
    manifestJsonBytes: Buffer.byteLength(await readText(manifestPath), "utf8"),
    summaryJsonBytes: Buffer.byteLength(await readText(summaryPath), "utf8"),
    dictionariesJsonBytes: Buffer.byteLength(await readText(dictionariesPath), "utf8"),
    rootFeaturesJsonlBytes: Buffer.byteLength(await readText(rootFeaturesPath), "utf8"),
    actionFeaturesCompactJsonlBytes: Buffer.byteLength(cfp80CompactActionFeaturesText, "utf8"),
    skippedRootsJsonlBytes: Buffer.byteLength(await readText(skippedRootsPath), "utf8"),
    reportMarkdownBytes: Buffer.byteLength(cfp80ReportText, "utf8"),
  };

  return {
    cfp80Manifest,
    cfp80Summary,
    cfp80Dictionaries: cfp80Dictionaries.groups,
    cfp80RootFeatures,
    cfp80CompactActionFeatures,
    cfp80SkippedRoots,
    sourceArtifactReferences,
    sourceArtifactEmptyHashCount,
    sourceArtifactByteSizes,
  };
};

const run = async () => {
  const startedAt = performance.now();
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const sourceArtifacts = await readSourceArtifacts(options.suiteId);
  const sourceRunIds: SearchConsumerActionFeatureCasebookV0SourceRunIds = {
    cfp80: sourceArtifacts.cfp80Manifest.featureRunId,
  };

  const result = benchmark.buildSearchConsumerActionFeatureCasebookV0Result({
    suiteId: options.suiteId,
    casebookRunId: options.runId,
    sourceBenchmarkSuiteId: sourceArtifacts.cfp80Manifest.sourceBenchmarkSuiteId,
    sourceCfp80RunId: sourceArtifacts.cfp80Manifest.featureRunId,
    cfp80Summary: sourceArtifacts.cfp80Summary,
    cfp80Dictionaries: sourceArtifacts.cfp80Dictionaries,
    cfp80RootFeatures: sourceArtifacts.cfp80RootFeatures,
    cfp80CompactActionFeatures: sourceArtifacts.cfp80CompactActionFeatures,
    cfp80SkippedRoots: sourceArtifacts.cfp80SkippedRoots,
    sourceArtifactReferenceCount: sourceArtifacts.sourceArtifactReferences.length,
    sourceArtifactEmptyHashCount: sourceArtifacts.sourceArtifactEmptyHashCount,
  });

  if (result.consumerReadinessStatus === "source_consistency_failed") {
    throw new Error(
      `search-consumer-action-feature-casebook-v0: source consistency not ready: ${JSON.stringify(
        result.sourceConsistency,
      )}`,
    );
  }

  const artifacts = benchmark.serializeSearchConsumerActionFeatureCasebookV0Artifacts({
    result,
    casebookRunId: options.runId,
    suiteId: options.suiteId,
    sourceBenchmarkSuiteId: sourceArtifacts.cfp80Manifest.sourceBenchmarkSuiteId,
    sourceRunIds,
    sourceArtifactReferences: sourceArtifacts.sourceArtifactReferences,
    sourceArtifactByteSizes: sourceArtifacts.sourceArtifactByteSizes,
  });

  const hiddenInfoIssues =
    benchmark.scanSearchConsumerActionFeatureCasebookV0ArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `search-consumer-action-feature-casebook-v0 hidden-info scan failed: ${hiddenInfoIssues.join(
        ", ",
      )}`,
    );
  }

  const checkedArtifacts: Record<string, string> = {
    "casebook-rows.jsonl": artifacts.casebookRowsJsonl,
    "slice-summaries.jsonl": artifacts.sliceSummariesJsonl,
    "skipped-root-summary.json": artifacts.skippedRootSummaryJson,
  };
  const byteSizes: Record<string, number> = {};
  for (const [file, text] of Object.entries(checkedArtifacts)) {
    const bytes = Buffer.byteLength(text, "utf8");
    byteSizes[file] = bytes;
    if (bytes >= 90 * 1024 * 1024) {
      throw new Error(`${file} is ${bytes} bytes and at or above the 90 MB hard stop`);
    }
    if (
      options.suiteId === "benchmark-v1-starter-matrix-robust-v1" &&
      (file === "casebook-rows.jsonl" || file === "slice-summaries.jsonl") &&
      bytes >= 10 * 1024 * 1024
    ) {
      throw new Error(`${file} is ${bytes} bytes and at or above the 10 MB rough target`);
    }
  }

  await benchmark.writeSearchConsumerActionFeatureCasebookV0Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.searchConsumerActionFeatureCasebookV0ArtifactHashes(artifacts);
  console.log(
    [
      `benchmark search-consumer-action-feature-casebook-v0 complete: suite=${options.suiteId}`,
      `casebookRunId=${options.runId}`,
      `consumerReadinessStatus=${result.consumerReadinessStatus}`,
      `sourceConsistencyStatus=${result.sourceConsistency.status}`,
      `rootFeatureRowCount=${result.skippedRootSummary.rootFeatureRowCount}`,
      `compactActionFeatureRowCount=${result.skippedRootSummary.compactActionFeatureRowCount}`,
      `skippedRootRowCount=${result.skippedRootSummary.skippedRootRowCount}`,
      `casebookRowCount=${result.casebookRows.length}`,
      `sliceSummaryRowCount=${result.sliceSummaries.length}`,
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
