import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  BuildDeterminizedProbeContractInput,
  DeterminizedProbeContractResult,
  DeterminizedProbeContractSourceArtifactReference,
  SamplerMaterializationRootRecord,
  SamplerMaterializationSummary,
  SamplerPostCfp66InvalidRootCasebookRecord,
  SamplerPostCfp66InvalidRootCasebookSummary,
  SerializedDeterminizedProbeContractArtifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  buildDeterminizedProbeContract: (
    input: BuildDeterminizedProbeContractInput,
  ) => DeterminizedProbeContractResult;
  determinizedProbeContractArtifactHashes: (
    artifacts: SerializedDeterminizedProbeContractArtifacts,
  ) => Record<string, string>;
  scanDeterminizedProbeContractArtifactsForHiddenInfo: (
    artifacts: SerializedDeterminizedProbeContractArtifacts,
  ) => string[];
  serializeDeterminizedProbeContractArtifacts: (
    result: DeterminizedProbeContractResult,
  ) => SerializedDeterminizedProbeContractArtifacts;
  writeDeterminizedProbeContractArtifacts: (input: {
    outDir: string;
    artifacts: SerializedDeterminizedProbeContractArtifacts;
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
    "determinized-probe-contract/cFp68",
  );

const defaultRunId = (suiteId: string) =>
  `${suiteId}:determinized-probe-contract:cFp68`;

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
): Promise<DeterminizedProbeContractSourceArtifactReference[]> => {
  const paths = [
    artifactPath(suiteId, "sampler-materialization/cFp61/manifest.json"),
    artifactPath(suiteId, "sampler-materialization/cFp61/summary.json"),
    artifactPath(suiteId, "sampler-materialization/cFp61/roots.jsonl"),
    artifactPath(suiteId, "sampler-materialization/cFp61/report.md"),
    artifactPath(
      suiteId,
      "sampler-post-cfp66-invalid-root-casebook/cFp67/manifest.json",
    ),
    artifactPath(
      suiteId,
      "sampler-post-cfp66-invalid-root-casebook/cFp67/summary.json",
    ),
    artifactPath(
      suiteId,
      "sampler-post-cfp66-invalid-root-casebook/cFp67/invalid-roots.jsonl",
    ),
    artifactPath(
      suiteId,
      "sampler-post-cfp66-invalid-root-casebook/cFp67/report.md",
    ),
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
  Omit<BuildDeterminizedProbeContractInput, "contractRunId" | "suiteId">
> => {
  const materializationSummaryPath = artifactPath(
    suiteId,
    "sampler-materialization/cFp61/summary.json",
  );
  const materializationRootsPath = artifactPath(
    suiteId,
    "sampler-materialization/cFp61/roots.jsonl",
  );
  const casebookSummaryPath = artifactPath(
    suiteId,
    "sampler-post-cfp66-invalid-root-casebook/cFp67/summary.json",
  );
  const casebookInvalidRootsPath = artifactPath(
    suiteId,
    "sampler-post-cfp66-invalid-root-casebook/cFp67/invalid-roots.jsonl",
  );

  const [
    materializationSummary,
    materializationRoots,
    casebookSummary,
    casebookInvalidRoots,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<SamplerMaterializationSummary>(materializationSummaryPath),
    readJsonl<SamplerMaterializationRootRecord>(materializationRootsPath),
    readJson<SamplerPostCfp66InvalidRootCasebookSummary>(casebookSummaryPath),
    readJsonl<SamplerPostCfp66InvalidRootCasebookRecord>(
      casebookInvalidRootsPath,
    ),
    artifactReferencesForSuite(suiteId),
  ]);

  return {
    materializationSummary,
    materializationRoots,
    casebookSummary,
    casebookInvalidRoots,
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
  const result = benchmark.buildDeterminizedProbeContract({
    contractRunId: options.runId,
    suiteId: options.suiteId,
    ...sourceArtifacts,
  });
  const artifacts = benchmark.serializeDeterminizedProbeContractArtifacts(result);
  const hiddenInfoIssues =
    benchmark.scanDeterminizedProbeContractArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `determinized-probe-contract hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }
  if (result.summary.contractStatus !== "probe_ready") {
    throw new Error(
      `determinized-probe-contract source consistency failed: ${JSON.stringify(result.summary.sourceConsistency)}`,
    );
  }

  await benchmark.writeDeterminizedProbeContractArtifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.determinizedProbeContractArtifactHashes(artifacts);
  console.log(
    [
      `benchmark determinized-probe-contract complete: suite=${result.suiteId}`,
      `contractRunId=${result.contractRunId}`,
      `contractStatus=${result.summary.contractStatus}`,
      `totalCfp61Roots=${result.summary.totalCfp61RootCount}`,
      `eligibleRoots=${result.summary.eligibleRootCount}`,
      `skippedRoots=${result.summary.skippedRootCount}`,
      `skippedRootPercentage=${result.summary.skippedRootPercentage}`,
      `invalidRootCountFromCfp67=${result.summary.invalidRootCountFromCfp67}`,
      `requestedSamplesPerEligibleRootDistribution=${JSON.stringify(result.summary.deterministicProbeBudget.requestedSamplesPerEligibleRootDistribution)}`,
      `totalRequestedSampleCountAcrossEligibleRoots=${result.summary.deterministicProbeBudget.totalRequestedSampleCountAcrossEligibleRoots}`,
      `totalValidSampleCountAcrossEligibleRoots=${result.summary.deterministicProbeBudget.totalValidSampleCountAcrossEligibleRoots}`,
      `skipReasonCounts=${JSON.stringify(result.summary.skipCounters.bySkipReason)}`,
      `hiddenInfoScan=passed`,
      `elapsedMs=${elapsedMs}`,
      `out=${options.outDir}`,
      ...Object.entries(hashes).map(([file, hash]) => `${file}=${hash}`),
    ].join("\n"),
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`benchmark determinized-probe-contract failed: ${message}`);
  process.exitCode = 1;
});
