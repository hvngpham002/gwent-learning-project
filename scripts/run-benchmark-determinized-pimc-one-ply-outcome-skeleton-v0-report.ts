import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  DeterminizedPimcActionAvailabilityV0RootRecord,
  DeterminizedPimcActionAvailabilityV0SkippedRootRecord,
  DeterminizedPimcActionAvailabilityV0Summary,
  DeterminizedPimcOnePlyOutcomeSkeletonV0Result,
  DeterminizedPimcProbeV0RootRecord,
  DeterminizedPimcProbeV0SkippedRootRecord,
  DeterminizedProbeContractEligibleRootRecord,
  DeterminizedProbeContractSkippedRootRecord,
  DeterminizedProbeContractSourceArtifactReference,
  DeterminizedProbeContractSummary,
  RunDeterminizedPimcOnePlyOutcomeSkeletonV0Input,
  SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  determinizedPimcOnePlyOutcomeSkeletonV0ArtifactHashes: (
    artifacts: SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts,
  ) => Record<string, string>;
  runDeterminizedPimcOnePlyOutcomeSkeletonV0: (
    input: RunDeterminizedPimcOnePlyOutcomeSkeletonV0Input,
  ) => DeterminizedPimcOnePlyOutcomeSkeletonV0Result;
  scanDeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactsForHiddenInfo: (
    artifacts: SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts,
  ) => string[];
  serializeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts: (
    result: DeterminizedPimcOnePlyOutcomeSkeletonV0Result,
  ) => SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts;
  writeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts: (input: {
    outDir: string;
    artifacts: SerializedDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts;
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
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71",
  );

const defaultRunId = (suiteId: string) =>
  `${suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71`;

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

const artifactReferencesForSuite = async (
  suiteId: string,
  paths: readonly string[],
): Promise<DeterminizedProbeContractSourceArtifactReference[]> =>
  Promise.all(
    paths.map(async (path) => {
      const absolutePath = artifactPath(suiteId, path);
      return {
        label: toRelativePath(absolutePath),
        relativePath: toRelativePath(absolutePath),
        sha256: sha256Text(await readText(absolutePath)),
      };
    }),
  );

const cFp68ArtifactReferencesForSuite = (suiteId: string) =>
  artifactReferencesForSuite(suiteId, [
    "determinized-probe-contract/cFp68/manifest.json",
    "determinized-probe-contract/cFp68/summary.json",
    "determinized-probe-contract/cFp68/eligible-roots.jsonl",
    "determinized-probe-contract/cFp68/skipped-roots.jsonl",
    "determinized-probe-contract/cFp68/report.md",
  ]);

const cFp69ArtifactReferencesForSuite = (suiteId: string) =>
  artifactReferencesForSuite(suiteId, [
    "determinized-pimc-probe-v0/cFp69/manifest.json",
    "determinized-pimc-probe-v0/cFp69/summary.json",
    "determinized-pimc-probe-v0/cFp69/probe-roots.jsonl",
    "determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl",
    "determinized-pimc-probe-v0/cFp69/report.md",
  ]);

const cFp70ArtifactReferencesForSuite = (suiteId: string) =>
  artifactReferencesForSuite(suiteId, [
    "determinized-pimc-action-availability-v0/cFp70/manifest.json",
    "determinized-pimc-action-availability-v0/cFp70/summary.json",
    "determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl",
    "determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl",
    "determinized-pimc-action-availability-v0/cFp70/report.md",
  ]);

const readSourceArtifacts = async (
  suiteId: string,
): Promise<
  Omit<RunDeterminizedPimcOnePlyOutcomeSkeletonV0Input, "suiteId" | "probeRunId">
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
  const cFp69ProbeRootsPath = artifactPath(
    suiteId,
    "determinized-pimc-probe-v0/cFp69/probe-roots.jsonl",
  );
  const cFp69SkippedRootsPath = artifactPath(
    suiteId,
    "determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl",
  );
  const cFp70SummaryPath = artifactPath(
    suiteId,
    "determinized-pimc-action-availability-v0/cFp70/summary.json",
  );
  const cFp70AvailabilityRootsPath = artifactPath(
    suiteId,
    "determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl",
  );
  const cFp70SkippedRootsPath = artifactPath(
    suiteId,
    "determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl",
  );

  const [
    contractSummary,
    cFp68EligibleRoots,
    cFp68SkippedRoots,
    cFp69ProbeRoots,
    cFp69SkippedRoots,
    cFp70AvailabilitySummary,
    cFp70AvailabilityRoots,
    cFp70SkippedRoots,
    sourceCfp68ArtifactReferences,
    sourceCfp69ArtifactReferences,
    sourceCfp70ArtifactReferences,
  ] = await Promise.all([
    readJson<DeterminizedProbeContractSummary>(contractSummaryPath),
    readJsonl<DeterminizedProbeContractEligibleRootRecord>(eligibleRootsPath),
    readJsonl<DeterminizedProbeContractSkippedRootRecord>(skippedRootsPath),
    readJsonl<DeterminizedPimcProbeV0RootRecord>(cFp69ProbeRootsPath),
    readJsonl<DeterminizedPimcProbeV0SkippedRootRecord>(
      cFp69SkippedRootsPath,
    ),
    readJson<DeterminizedPimcActionAvailabilityV0Summary>(cFp70SummaryPath),
    readJsonl<DeterminizedPimcActionAvailabilityV0RootRecord>(
      cFp70AvailabilityRootsPath,
    ),
    readJsonl<DeterminizedPimcActionAvailabilityV0SkippedRootRecord>(
      cFp70SkippedRootsPath,
    ),
    cFp68ArtifactReferencesForSuite(suiteId),
    cFp69ArtifactReferencesForSuite(suiteId),
    cFp70ArtifactReferencesForSuite(suiteId),
  ]);

  return {
    contractSummary,
    cFp68EligibleRoots,
    cFp68SkippedRoots,
    cFp69ProbeRoots,
    cFp69SkippedRoots,
    cFp70AvailabilitySummary,
    cFp70AvailabilityRoots,
    cFp70SkippedRoots,
    sourceCfp68ArtifactReferences,
    sourceCfp69ArtifactReferences,
    sourceCfp70ArtifactReferences,
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
    sourceArtifacts.cFp69ProbeRoots.length !==
    sourceArtifacts.contractSummary.eligibleRootCount
  ) {
    throw new Error(
      "one-ply outcome skeleton cFp69 probe root count does not match cFp68 eligible count",
    );
  }
  if (
    sourceArtifacts.cFp70AvailabilityRoots.length !==
    sourceArtifacts.contractSummary.eligibleRootCount
  ) {
    throw new Error(
      "one-ply outcome skeleton cFp70 availability root count does not match cFp68 eligible count",
    );
  }

  const result = benchmark.runDeterminizedPimcOnePlyOutcomeSkeletonV0({
    suiteId: options.suiteId,
    probeRunId: options.runId,
    ...sourceArtifacts,
  });
  const artifacts =
    benchmark.serializeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts(result);
  const hiddenInfoIssues =
    benchmark.scanDeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactsForHiddenInfo(
      artifacts,
    );
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `one-ply outcome skeleton hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }
  if (result.summary.probeReadinessStatus !== "probe_ready") {
    throw new Error(
      `one-ply outcome skeleton source consistency failed: ${JSON.stringify(result.summary.sourceConsistency)}`,
    );
  }

  await benchmark.writeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes =
    benchmark.determinizedPimcOnePlyOutcomeSkeletonV0ArtifactHashes(artifacts);
  console.log(
    [
      `benchmark determinized-pimc-one-ply-outcome-skeleton-v0 complete: suite=${result.suiteId}`,
      `probeRunId=${result.probeRunId}`,
      `probeReadinessStatus=${result.summary.probeReadinessStatus}`,
      `totalCfp68Roots=${result.summary.totalCfp68RootCount}`,
      `eligibleRoots=${result.summary.eligibleRootCount}`,
      `outcomeRoots=${result.summary.outcomeRootCount}`,
      `skippedRoots=${result.summary.skippedRootCount}`,
      `skippedRootPercentage=${result.summary.skippedRootPercentage}`,
      `benchmarkObservedRootsRead=${result.summary.sourceConsistency.benchmarkObservedRootsRead}`,
      `totalRequestedSampleCount=${result.summary.sampleBudget.totalRequestedSampleCount}`,
      `totalGeneratedSampleCount=${result.summary.sampleBudget.totalGeneratedSampleCount}`,
      `totalCheckedSampleCount=${result.summary.sampleBudget.totalCheckedSampleCount}`,
      `totalFailedSampleCount=${result.summary.sampleBudget.totalFailedSampleCount}`,
      `publicActionSamplePairTotal=${result.summary.outcomeStatus.publicActionSamplePairTotal}`,
      `completedPairCount=${result.summary.outcomeStatus.completedPairCount}`,
      `failedOrDeferredPairCount=${result.summary.outcomeStatus.failedOrDeferredPairCount}`,
      `rootsWithAnyPublicOutcomeDivergence=${result.summary.outcomeStatus.rootsWithAnyPublicOutcomeDivergence}`,
      `probeStatusCounts=${JSON.stringify(result.summary.outcomeStatus.probeStatusCounts)}`,
      `outcomeRiskBucketCounts=${JSON.stringify(result.summary.outcomeStatus.outcomeRiskBucketCounts)}`,
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
  console.error(
    `benchmark determinized-pimc-one-ply-outcome-skeleton-v0 failed: ${message}`,
  );
  process.exitCode = 1;
});
