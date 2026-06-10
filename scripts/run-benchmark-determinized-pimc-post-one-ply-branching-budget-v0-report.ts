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
  DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord,
  DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord,
  DeterminizedPimcOnePlyOutcomeSkeletonV0Summary,
  DeterminizedPimcPostOnePlyBranchingBudgetV0Result,
  DeterminizedPimcProbeV0RootRecord,
  DeterminizedPimcProbeV0SkippedRootRecord,
  DeterminizedProbeContractEligibleRootRecord,
  DeterminizedProbeContractSkippedRootRecord,
  DeterminizedProbeContractSourceArtifactReference,
  DeterminizedProbeContractSummary,
  RunDeterminizedPimcPostOnePlyBranchingBudgetV0Input,
  SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  determinizedPimcPostOnePlyBranchingBudgetV0ArtifactHashes: (
    artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts,
  ) => Record<string, string>;
  runDeterminizedPimcPostOnePlyBranchingBudgetV0: (
    input: RunDeterminizedPimcPostOnePlyBranchingBudgetV0Input,
  ) => DeterminizedPimcPostOnePlyBranchingBudgetV0Result;
  scanDeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactsForHiddenInfo: (
    artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts,
  ) => string[];
  serializeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts: (
    result: DeterminizedPimcPostOnePlyBranchingBudgetV0Result,
  ) => SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts;
  writeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts: (input: {
    outDir: string;
    artifacts: SerializedDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts;
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
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72",
  );

const defaultRunId = (suiteId: string) =>
  `${suiteId}:determinized-pimc-post-one-ply-branching-budget-v0:cFp72`;

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

const cFp71ArtifactReferencesForSuite = (suiteId: string) =>
  artifactReferencesForSuite(suiteId, [
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/manifest.json",
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json",
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl",
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/skipped-roots.jsonl",
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/report.md",
  ]);

const readSourceArtifacts = async (
  suiteId: string,
): Promise<
  Omit<RunDeterminizedPimcPostOnePlyBranchingBudgetV0Input, "suiteId" | "probeRunId">
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
  const cFp71SummaryPath = artifactPath(
    suiteId,
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json",
  );
  const cFp71OutcomeRootsPath = artifactPath(
    suiteId,
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl",
  );
  const cFp71SkippedRootsPath = artifactPath(
    suiteId,
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/skipped-roots.jsonl",
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
    cFp71OutcomeSummary,
    cFp71OutcomeRoots,
    cFp71SkippedRoots,
    sourceCfp68ArtifactReferences,
    sourceCfp69ArtifactReferences,
    sourceCfp70ArtifactReferences,
    sourceCfp71ArtifactReferences,
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
    readJson<DeterminizedPimcOnePlyOutcomeSkeletonV0Summary>(cFp71SummaryPath),
    readJsonl<DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord>(
      cFp71OutcomeRootsPath,
    ),
    readJsonl<DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord>(
      cFp71SkippedRootsPath,
    ),
    cFp68ArtifactReferencesForSuite(suiteId),
    cFp69ArtifactReferencesForSuite(suiteId),
    cFp70ArtifactReferencesForSuite(suiteId),
    cFp71ArtifactReferencesForSuite(suiteId),
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
    cFp71OutcomeSummary,
    cFp71OutcomeRoots,
    cFp71SkippedRoots,
    sourceCfp68ArtifactReferences,
    sourceCfp69ArtifactReferences,
    sourceCfp70ArtifactReferences,
    sourceCfp71ArtifactReferences,
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
      "post-one-ply branching budget cFp69 probe root count does not match cFp68 eligible count",
    );
  }
  if (
    sourceArtifacts.cFp70AvailabilityRoots.length !==
    sourceArtifacts.contractSummary.eligibleRootCount
  ) {
    throw new Error(
      "post-one-ply branching budget cFp70 availability root count does not match cFp68 eligible count",
    );
  }
  if (
    sourceArtifacts.cFp71OutcomeRoots.length !==
    sourceArtifacts.contractSummary.eligibleRootCount
  ) {
    throw new Error(
      "post-one-ply branching budget cFp71 outcome root count does not match cFp68 eligible count",
    );
  }

  const result = benchmark.runDeterminizedPimcPostOnePlyBranchingBudgetV0({
    suiteId: options.suiteId,
    probeRunId: options.runId,
    ...sourceArtifacts,
  });
  const artifacts =
    benchmark.serializeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts(result);
  const hiddenInfoIssues =
    benchmark.scanDeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactsForHiddenInfo(
      artifacts,
    );
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `post-one-ply branching budget hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }
  if (result.summary.probeReadinessStatus !== "probe_ready") {
    throw new Error(
      `post-one-ply branching budget source consistency failed: ${JSON.stringify(result.summary.sourceConsistency)}`,
    );
  }

  await benchmark.writeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes =
    benchmark.determinizedPimcPostOnePlyBranchingBudgetV0ArtifactHashes(artifacts);
  console.log(
    [
      `benchmark determinized-pimc-post-one-ply-branching-budget-v0 complete: suite=${result.suiteId}`,
      `probeRunId=${result.probeRunId}`,
      `probeReadinessStatus=${result.summary.probeReadinessStatus}`,
      `totalCfp68Roots=${result.summary.totalCfp68RootCount}`,
      `eligibleRoots=${result.summary.eligibleRootCount}`,
      `branchingRoots=${result.summary.branchingRootCount}`,
      `skippedRoots=${result.summary.skippedRootCount}`,
      `skippedRootPercentage=${result.summary.skippedRootPercentage}`,
      `benchmarkObservedRootsRead=${result.summary.sourceConsistency.benchmarkObservedRootsRead}`,
      `totalRequestedSampleCount=${result.summary.sampleBudget.totalRequestedSampleCount}`,
      `totalGeneratedSampleCount=${result.summary.sampleBudget.totalGeneratedSampleCount}`,
      `totalCheckedSampleCount=${result.summary.sampleBudget.totalCheckedSampleCount}`,
      `totalFailedSampleCount=${result.summary.sampleBudget.totalFailedSampleCount}`,
      `firstPlyPublicActionSamplePairTotal=${result.summary.branchingStatus.firstPlyPublicActionSamplePairTotal}`,
      `completedBranchingPairCount=${result.summary.branchingStatus.completedBranchingPairCount}`,
      `failedOrDeferredBranchingPairCount=${result.summary.branchingStatus.failedOrDeferredBranchingPairCount}`,
      `postOnePlyPublicActionBudgetTotal=${result.summary.branchingAggregates.postOnePlyPublicActionBudgetTotal}`,
      `postOnePlyPublicActionBudgetAverage=${result.summary.branchingAggregates.postOnePlyPublicActionBudgetAverage}`,
      `probeStatusCounts=${JSON.stringify(result.summary.branchingStatus.probeStatusCounts)}`,
      `branchingBudgetBucketCounts=${JSON.stringify(result.summary.branchingStatus.branchingBudgetBucketCounts)}`,
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
    `benchmark determinized-pimc-post-one-ply-branching-budget-v0 failed: ${message}`,
  );
  process.exitCode = 1;
});
