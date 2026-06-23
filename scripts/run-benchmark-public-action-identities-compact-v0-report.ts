import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  PublicActionIdentitiesCompactV0BuildInput,
  PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow,
  PublicActionIdentitiesCompactV0Cfp77RootSummaryRow,
  PublicActionIdentitiesCompactV0Cfp77SkippedRootRow,
  PublicActionIdentitiesCompactV0Cfp77SummaryInput,
  PublicActionIdentitiesCompactV0Result,
  PublicActionIdentitiesCompactV0SourceArtifactReference,
  SerializedPublicActionIdentitiesCompactV0Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  buildPublicActionIdentitiesCompactV0Result: (
    input: PublicActionIdentitiesCompactV0BuildInput,
  ) => PublicActionIdentitiesCompactV0Result;
  serializePublicActionIdentitiesCompactV0Artifacts: (input: {
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
  }) => SerializedPublicActionIdentitiesCompactV0Artifacts;
  scanPublicActionIdentitiesCompactV0ArtifactsForHiddenInfo: (
    artifacts: SerializedPublicActionIdentitiesCompactV0Artifacts,
  ) => string[];
  publicActionIdentitiesCompactV0ArtifactHashes: (
    artifacts: SerializedPublicActionIdentitiesCompactV0Artifacts,
  ) => Record<string, string>;
  writePublicActionIdentitiesCompactV0Artifacts: (input: {
    outDir: string;
    artifacts: SerializedPublicActionIdentitiesCompactV0Artifacts;
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
  resolve(benchmarkResultsDir, suiteId, "public-action-identities-compact-v0/cFp78");

const defaultRunId = (suiteId: string) =>
  `${suiteId}:public-action-identities-compact-v0:cFp78`;

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
    runId: runId ?? defaultRunId(suiteId),
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

const cfp77ArtifactPath = (suiteId: string, ...segments: string[]) =>
  resolve(benchmarkResultsDir, suiteId, "public-action-identities-v0/cFp77", ...segments);

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

interface Cfp77ManifestFile {
  identityRunId: string;
  sourceBenchmarkSuiteId: string;
}

interface Cfp77SummaryFile extends PublicActionIdentitiesCompactV0Cfp77SummaryInput {
  identityRunId: string;
}

const sourceArtifactReferencesForSuite = async (
  suiteId: string,
): Promise<PublicActionIdentitiesCompactV0SourceArtifactReference[]> => {
  const paths = [
    "manifest.json",
    "summary.json",
    "action-identities.jsonl",
    "root-summaries.jsonl",
    "skipped-roots.jsonl",
    "report.md",
  ];
  return Promise.all(
    paths.map(async (segment) => {
      const absolutePath = cfp77ArtifactPath(suiteId, segment);
      const text = await readText(absolutePath);
      return {
        label: toRelativePath(absolutePath),
        relativePath: toRelativePath(absolutePath),
        sha256: sha256Text(text),
      };
    }),
  );
};

const readCfp77Artifacts = async (suiteId: string) => {
  const [
    cfp77Manifest,
    cfp77Summary,
    cfp77ActionIdentities,
    cfp77RootSummaries,
    cfp77SkippedRoots,
    cfp77ActionIdentitiesText,
    cfp77RootSummariesText,
    cfp77SkippedRootsText,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<Cfp77ManifestFile>(cfp77ArtifactPath(suiteId, "manifest.json")),
    readJson<Cfp77SummaryFile>(cfp77ArtifactPath(suiteId, "summary.json")),
    readJsonl<PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow>(
      cfp77ArtifactPath(suiteId, "action-identities.jsonl"),
    ),
    readJsonl<PublicActionIdentitiesCompactV0Cfp77RootSummaryRow>(
      cfp77ArtifactPath(suiteId, "root-summaries.jsonl"),
    ),
    readJsonl<PublicActionIdentitiesCompactV0Cfp77SkippedRootRow>(
      cfp77ArtifactPath(suiteId, "skipped-roots.jsonl"),
    ),
    readText(cfp77ArtifactPath(suiteId, "action-identities.jsonl")),
    readText(cfp77ArtifactPath(suiteId, "root-summaries.jsonl")),
    readText(cfp77ArtifactPath(suiteId, "skipped-roots.jsonl")),
    sourceArtifactReferencesForSuite(suiteId),
  ]);

  const sourceArtifactEmptyHashCount = sourceArtifactReferences.filter(
    (reference) => reference.sha256 === EMPTY_SHA256,
  ).length;

  const cfp77Sizes = {
    actionIdentitiesJsonlBytes: Buffer.byteLength(cfp77ActionIdentitiesText, "utf8"),
    rootSummariesJsonlBytes: Buffer.byteLength(cfp77RootSummariesText, "utf8"),
    skippedRootsJsonlBytes: Buffer.byteLength(cfp77SkippedRootsText, "utf8"),
  };

  return {
    cfp77Manifest,
    cfp77Summary,
    cfp77ActionIdentities,
    cfp77RootSummaries,
    cfp77SkippedRoots,
    cfp77Sizes,
    sourceArtifactReferences,
    sourceArtifactEmptyHashCount,
  };
};

const run = async () => {
  const startedAt = performance.now();
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const cfp77 = await readCfp77Artifacts(options.suiteId);

  const result = benchmark.buildPublicActionIdentitiesCompactV0Result({
    suiteId: options.suiteId,
    compactRunId: options.runId,
    sourceCfp77RunId: cfp77.cfp77Manifest.identityRunId,
    cfp77Summary: cfp77.cfp77Summary,
    cfp77ActionIdentities: cfp77.cfp77ActionIdentities,
    cfp77RootSummaries: cfp77.cfp77RootSummaries,
    cfp77SkippedRoots: cfp77.cfp77SkippedRoots,
    sourceArtifactReferenceCount: cfp77.sourceArtifactReferences.length,
    sourceArtifactEmptyHashCount: cfp77.sourceArtifactEmptyHashCount,
  });

  if (result.compactReadinessStatus === "source_consistency_failed") {
    throw new Error(
      `public-action-identities-compact-v0: source consistency not ready: ${JSON.stringify(
        result.sourceConsistency,
      )}`,
    );
  }

  const artifacts = benchmark.serializePublicActionIdentitiesCompactV0Artifacts({
    result,
    compactRunId: options.runId,
    suiteId: options.suiteId,
    sourceBenchmarkSuiteId: cfp77.cfp77Manifest.sourceBenchmarkSuiteId,
    sourceCfp77RunId: cfp77.cfp77Manifest.identityRunId,
    sourceArtifactReferences: cfp77.sourceArtifactReferences,
    cfp77Sizes: cfp77.cfp77Sizes,
  });

  const hiddenInfoIssues =
    benchmark.scanPublicActionIdentitiesCompactV0ArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `public-action-identities-compact-v0 hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }

  const jsonlArtifacts: Record<string, string> = {
    "action-identities-compact.jsonl": artifacts.actionIdentitiesCompactJsonl,
    "root-index.jsonl": artifacts.rootIndexJsonl,
    "skipped-roots.jsonl": artifacts.skippedRootsJsonl,
  };
  const byteSizes: Record<string, number> = {};
  for (const [file, text] of Object.entries(jsonlArtifacts)) {
    const bytes = Buffer.byteLength(text, "utf8");
    byteSizes[file] = bytes;
    if (bytes >= 90_000_000) {
      throw new Error(`${file} is ${bytes} bytes — at or above the 90 MB hard stop`);
    }
  }

  const actionCompactBytes = byteSizes["action-identities-compact.jsonl"] ?? 0;
  if (actionCompactBytes >= 50 * 1024 * 1024) {
    console.warn(
      `WARNING: action-identities-compact.jsonl is ${actionCompactBytes} bytes ` +
        `(at or above 50 MB robust target). Per spec, cFp79 should not start consumer ` +
        `feature work until size is below 50 MB. Continuing to write artifacts.`,
    );
  }

  await benchmark.writePublicActionIdentitiesCompactV0Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.publicActionIdentitiesCompactV0ArtifactHashes(artifacts);
  console.log(
    [
      `benchmark public-action-identities-compact-v0 complete: suite=${options.suiteId}`,
      `compactRunId=${options.runId}`,
      `compactReadinessStatus=${result.compactReadinessStatus}`,
      `sourceConsistencyStatus=${result.sourceConsistency.status}`,
      `compactActionRowCount=${result.compactActionRows.length}`,
      `compactRootIndexRowCount=${result.compactRootIndexRows.length}`,
      `compactSkippedRootRowCount=${result.compactSkippedRootRows.length}`,
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
