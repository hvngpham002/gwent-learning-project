import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  BuildSamplerPostCfp66InvalidRootCasebookInput,
  SamplerInvalidRootRecord,
  SamplerInvalidRootSummary,
  SamplerMaterializationSummary,
  SamplerPostCfp66InvalidRootCasebookResult,
  SamplerPostCfp66SourceArtifactReference,
  SamplerPublicZoneProvenanceRecord,
  SamplerPublicZoneProvenanceSummary,
  SerializedSamplerPostCfp66InvalidRootCasebookArtifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  buildPostCfp66InvalidRootCasebook: (
    input: BuildSamplerPostCfp66InvalidRootCasebookInput,
  ) => SamplerPostCfp66InvalidRootCasebookResult;
  scanSamplerPostCfp66InvalidRootCasebookArtifactsForHiddenInfo: (
    artifacts: SerializedSamplerPostCfp66InvalidRootCasebookArtifacts,
  ) => string[];
  samplerPostCfp66InvalidRootCasebookArtifactHashes: (
    artifacts: SerializedSamplerPostCfp66InvalidRootCasebookArtifacts,
  ) => Record<string, string>;
  serializeSamplerPostCfp66InvalidRootCasebookArtifacts: (
    result: SamplerPostCfp66InvalidRootCasebookResult,
  ) => SerializedSamplerPostCfp66InvalidRootCasebookArtifacts;
  writeSamplerPostCfp66InvalidRootCasebookArtifacts: (input: {
    outDir: string;
    artifacts: SerializedSamplerPostCfp66InvalidRootCasebookArtifacts;
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
const benchmarkResultsDir = resolve(
  rootDir,
  "docs/research/literature/ai/benchmark-results",
);

const defaultOutputDir = (suiteId: string) =>
  resolve(
    benchmarkResultsDir,
    suiteId,
    "sampler-post-cfp66-invalid-root-casebook/cFp67",
  );

const defaultRunId = (suiteId: string) =>
  `${suiteId}:sampler-post-cfp66-invalid-root-casebook:cFp67`;

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

  if (!suiteId) {
    throw new CliUsageError("--suite cannot be empty.");
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
    return (await server.ssrLoadModule(
      "/src/game/benchmark/index.ts",
    )) as BenchmarkModule;
  } finally {
    await server.close();
  }
};

const artifactPath = (suiteId: string, ...segments: string[]) =>
  resolve(benchmarkResultsDir, suiteId, ...segments);

const readText = (path: string) => readFile(path, "utf8");

const readJson = async <T>(path: string): Promise<T> =>
  JSON.parse(await readText(path)) as T;

const readJsonl = async <T>(path: string): Promise<T[]> => {
  const text = await readText(path);
  return text
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
};

const sha256Text = (value: string) =>
  createHash("sha256").update(value, "utf8").digest("hex");

const toRelativePath = (path: string) => relative(rootDir, path).replaceAll("\\", "/");

const artifactReferencesForSuite = async (
  suiteId: string,
): Promise<SamplerPostCfp66SourceArtifactReference[]> => {
  const paths = [
    artifactPath(suiteId, "sampler-materialization/cFp61/manifest.json"),
    artifactPath(suiteId, "sampler-materialization/cFp61/summary.json"),
    artifactPath(suiteId, "sampler-materialization/cFp61/roots.jsonl"),
    artifactPath(suiteId, "sampler-materialization/cFp61/report.md"),
    artifactPath(suiteId, "sampler-invalid-roots/cFp62/manifest.json"),
    artifactPath(suiteId, "sampler-invalid-roots/cFp62/summary.json"),
    artifactPath(suiteId, "sampler-invalid-roots/cFp62/invalid-roots.jsonl"),
    artifactPath(suiteId, "sampler-invalid-roots/cFp62/report.md"),
    artifactPath(suiteId, "sampler-public-zone-provenance/cFp64/manifest.json"),
    artifactPath(suiteId, "sampler-public-zone-provenance/cFp64/summary.json"),
    artifactPath(
      suiteId,
      "sampler-public-zone-provenance/cFp64/provenance-roots.jsonl",
    ),
    artifactPath(suiteId, "sampler-public-zone-provenance/cFp64/report.md"),
  ];

  return Promise.all(
    paths.map(async (path) => ({
      label: toRelativePath(path),
      relativePath: toRelativePath(path),
      sha256: sha256Text(await readText(path)),
    })),
  );
};

const readSourceArtifacts = async (
  suiteId: string,
): Promise<
  Omit<
    BuildSamplerPostCfp66InvalidRootCasebookInput,
    "casebookRunId" | "suiteId"
  >
> => {
  const materializationSummaryPath = artifactPath(
    suiteId,
    "sampler-materialization/cFp61/summary.json",
  );
  const invalidRootSummaryPath = artifactPath(
    suiteId,
    "sampler-invalid-roots/cFp62/summary.json",
  );
  const invalidRootsPath = artifactPath(
    suiteId,
    "sampler-invalid-roots/cFp62/invalid-roots.jsonl",
  );
  const provenanceSummaryPath = artifactPath(
    suiteId,
    "sampler-public-zone-provenance/cFp64/summary.json",
  );
  const provenanceRootsPath = artifactPath(
    suiteId,
    "sampler-public-zone-provenance/cFp64/provenance-roots.jsonl",
  );

  const [
    materializationSummary,
    invalidRootSummary,
    invalidRoots,
    provenanceSummary,
    provenanceRoots,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<SamplerMaterializationSummary>(materializationSummaryPath),
    readJson<SamplerInvalidRootSummary>(invalidRootSummaryPath),
    readJsonl<SamplerInvalidRootRecord>(invalidRootsPath),
    readJson<SamplerPublicZoneProvenanceSummary>(provenanceSummaryPath),
    readJsonl<SamplerPublicZoneProvenanceRecord>(provenanceRootsPath),
    artifactReferencesForSuite(suiteId),
  ]);

  return {
    materializationSummary,
    invalidRootSummary,
    invalidRoots,
    provenanceSummary,
    provenanceRoots,
    sourceArtifactReferences,
  };
};

const run = async () => {
  const startedAt = performance.now();
  const options = parseArgs(process.argv.slice(2));

  if (!KNOWN_SUITE_IDS.has(options.suiteId)) {
    console.error(
      `Unknown suite: ${options.suiteId}. Known suites: ${[...KNOWN_SUITE_IDS].join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }

  const benchmark = await loadBenchmarkModule();
  const sourceArtifacts = await readSourceArtifacts(options.suiteId);
  const result = benchmark.buildPostCfp66InvalidRootCasebook({
    casebookRunId: options.runId,
    suiteId: options.suiteId,
    ...sourceArtifacts,
  });
  const artifacts =
    benchmark.serializeSamplerPostCfp66InvalidRootCasebookArtifacts(result);
  const hiddenInfoIssues =
    benchmark.scanSamplerPostCfp66InvalidRootCasebookArtifactsForHiddenInfo(
      artifacts,
    );
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `sampler-post-cfp66-invalid-root-casebook hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }

  await benchmark.writeSamplerPostCfp66InvalidRootCasebookArtifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes =
    benchmark.samplerPostCfp66InvalidRootCasebookArtifactHashes(artifacts);
  console.log(
    [
      `benchmark sampler-post-cfp66-invalid-root-casebook complete: suite=${result.suiteId}`,
      `casebookRunId=${result.casebookRunId}`,
      `matches=${result.summary.matchCount}`,
      `totalRoots=${result.summary.totalRootCount}`,
      `validRoots=${result.summary.validRootCount}`,
      `invalidRoots=${result.summary.invalidRootCount}`,
      `invalidRootPercentage=${result.summary.invalidRootPercentage}`,
      `primaryClassificationCounts=${JSON.stringify(result.summary.primaryClassificationCounts)}`,
      `transferClassificationCounts=${JSON.stringify(result.summary.transferClassificationCounts)}`,
      `deficitSizeClassificationCounts=${JSON.stringify(result.summary.deficitSizeClassificationCounts)}`,
      `validRootOnlySkipRootCount=${result.summary.validRootOnlySkipRootCount}`,
      `recommendation=${result.summary.recommendation}`,
      `hiddenInfoScan=passed`,
      `elapsedMs=${elapsedMs}`,
      `out=${options.outDir}`,
      ...Object.entries(hashes).map(([file, hash]) => `${file}=${hash}`),
    ].join("\n"),
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    `benchmark sampler-post-cfp66-invalid-root-casebook failed: ${message}`,
  );
  process.exitCode = 1;
});
