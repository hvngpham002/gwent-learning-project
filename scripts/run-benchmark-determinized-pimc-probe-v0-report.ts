import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  DeterminizedPimcProbeV0Result,
  DeterminizedProbeContractEligibleRootRecord,
  DeterminizedProbeContractSkippedRootRecord,
  DeterminizedProbeContractSummary,
  DeterminizedProbeContractSourceArtifactReference,
  RunDeterminizedPimcProbeV0Input,
  SerializedDeterminizedPimcProbeV0Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  determinizedPimcProbeV0ArtifactHashes: (
    artifacts: SerializedDeterminizedPimcProbeV0Artifacts,
  ) => Record<string, string>;
  runDeterminizedPimcProbeV0: (
    input: RunDeterminizedPimcProbeV0Input,
  ) => DeterminizedPimcProbeV0Result;
  scanDeterminizedPimcProbeV0ArtifactsForHiddenInfo: (
    artifacts: SerializedDeterminizedPimcProbeV0Artifacts,
  ) => string[];
  serializeDeterminizedPimcProbeV0Artifacts: (
    result: DeterminizedPimcProbeV0Result,
  ) => SerializedDeterminizedPimcProbeV0Artifacts;
  writeDeterminizedPimcProbeV0Artifacts: (input: {
    outDir: string;
    artifacts: SerializedDeterminizedPimcProbeV0Artifacts;
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
    "determinized-pimc-probe-v0/cFp69",
  );

const defaultRunId = (suiteId: string) =>
  `${suiteId}:determinized-pimc-probe-v0:cFp69`;

const readOptionValue = (
  args: readonly string[],
  index: number,
  flag: string,
) => {
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

const toRelativePath = (path: string) =>
  relative(rootDir, path).replaceAll("\\", "/");

const cFp68ArtifactReferencesForSuite = async (
  suiteId: string,
): Promise<DeterminizedProbeContractSourceArtifactReference[]> => {
  const paths = [
    artifactPath(suiteId, "determinized-probe-contract/cFp68/manifest.json"),
    artifactPath(suiteId, "determinized-probe-contract/cFp68/summary.json"),
    artifactPath(
      suiteId,
      "determinized-probe-contract/cFp68/eligible-roots.jsonl",
    ),
    artifactPath(
      suiteId,
      "determinized-probe-contract/cFp68/skipped-roots.jsonl",
    ),
    artifactPath(suiteId, "determinized-probe-contract/cFp68/report.md"),
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
    RunDeterminizedPimcProbeV0Input,
    "suiteId" | "probeRunId" | "probeMode"
  >
> => {
  const contractSummaryPath = artifactPath(
    suiteId,
    "determinized-probe-contract/cFp68/summary.json",
  );
  const eligibleRootsPath = artifactPath(
    suiteId,
    "determinized-probe-contract/cFp68/eligible-roots.jsonl",
  );
  const skippedRootsPath = artifactPath(
    suiteId,
    "determinized-probe-contract/cFp68/skipped-roots.jsonl",
  );

  const [
    contractSummary,
    cFp68EligibleRoots,
    cFp68SkippedRoots,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<DeterminizedProbeContractSummary>(contractSummaryPath),
    readJsonl<DeterminizedProbeContractEligibleRootRecord>(eligibleRootsPath),
    readJsonl<DeterminizedProbeContractSkippedRootRecord>(skippedRootsPath),
    cFp68ArtifactReferencesForSuite(suiteId),
  ]);

  return {
    contractSummary,
    cFp68EligibleRoots,
    cFp68SkippedRoots,
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
  if (
    sourceArtifacts.cFp68SkippedRoots.length > 0 &&
    sourceArtifacts.cFp68SkippedRoots.length !==
      sourceArtifacts.contractSummary.skippedRootCount
  ) {
    throw new Error(
      "determinized-pimc-probe-v0 cFp68 skipped artifact count does not match cFp68 summary",
    );
  }

  const result = benchmark.runDeterminizedPimcProbeV0({
    suiteId: options.suiteId,
    probeRunId: options.runId,
    ...sourceArtifacts,
    probeMode: "one_ply_public_action_scaffold",
  });
  const artifacts = benchmark.serializeDeterminizedPimcProbeV0Artifacts(result);
  const hiddenInfoIssues =
    benchmark.scanDeterminizedPimcProbeV0ArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `determinized-pimc-probe-v0 hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }
  if (result.summary.probeReadinessStatus !== "probe_ready") {
    throw new Error(
      `determinized-pimc-probe-v0 source consistency failed: ${JSON.stringify(result.summary.sourceConsistency)}`,
    );
  }

  await benchmark.writeDeterminizedPimcProbeV0Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.determinizedPimcProbeV0ArtifactHashes(artifacts);
  console.log(
    [
      `benchmark determinized-pimc-probe-v0 complete: suite=${result.suiteId}`,
      `probeRunId=${result.probeRunId}`,
      `probeReadinessStatus=${result.summary.probeReadinessStatus}`,
      `totalCfp68Roots=${result.summary.totalCfp68RootCount}`,
      `eligibleRoots=${result.summary.eligibleRootCount}`,
      `probeRoots=${result.summary.probeRootCount}`,
      `skippedRoots=${result.summary.skippedRootCount}`,
      `skippedRootPercentage=${result.summary.skippedRootPercentage}`,
      `benchmarkObservedRootsRead=${result.summary.sourceConsistency.benchmarkObservedRootsRead}`,
      `totalRequestedSampleCount=${result.summary.sampleBudget.totalRequestedSampleCount}`,
      `totalConsumedSampleCount=${result.summary.sampleBudget.totalConsumedSampleCount}`,
      `totalValidSampleCount=${result.summary.sampleBudget.totalValidSampleCount}`,
      `totalInvalidSampleCount=${result.summary.sampleBudget.totalInvalidSampleCount}`,
      `legalMoveCountStats=${JSON.stringify(result.summary.publicActionScaffold.legalMoveCountStats)}`,
      `publicActionCountStats=${JSON.stringify(result.summary.publicActionScaffold.publicActionCountStats)}`,
      `publicActionCollisionCountStats=${JSON.stringify(result.summary.publicActionScaffold.publicActionCollisionCountStats)}`,
      `largestPublicActionBucketSizeStats=${JSON.stringify(result.summary.publicActionScaffold.largestPublicActionBucketSizeStats)}`,
      `probeStatusCounts=${JSON.stringify(result.summary.probeStatusCounts)}`,
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
  console.error(`benchmark determinized-pimc-probe-v0 failed: ${message}`);
  process.exitCode = 1;
});
