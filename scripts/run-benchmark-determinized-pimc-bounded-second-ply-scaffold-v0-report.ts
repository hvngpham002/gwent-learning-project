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
  DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy,
  DeterminizedPimcBoundedSecondPlyScaffoldV0Result,
  DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord,
  DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord,
  DeterminizedPimcOnePlyOutcomeSkeletonV0Summary,
  DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootRecord,
  DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootRecord,
  DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummary,
  DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord,
  DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord,
  DeterminizedPimcPostOnePlyBranchingBudgetV0Summary,
  DeterminizedPimcProbeV0RootRecord,
  DeterminizedPimcProbeV0SkippedRootRecord,
  DeterminizedProbeContractEligibleRootRecord,
  DeterminizedProbeContractSkippedRootRecord,
  DeterminizedProbeContractSourceArtifactReference,
  DeterminizedProbeContractSummary,
  RunDeterminizedPimcBoundedSecondPlyScaffoldV0Input,
  SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  determinizedPimcBoundedSecondPlyScaffoldV0ArtifactHashes: (
    artifacts: SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts,
  ) => Record<string, string>;
  runDeterminizedPimcBoundedSecondPlyScaffoldV0: (
    input: RunDeterminizedPimcBoundedSecondPlyScaffoldV0Input,
  ) => DeterminizedPimcBoundedSecondPlyScaffoldV0Result;
  scanDeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactsForHiddenInfo: (
    artifacts: SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts,
  ) => string[];
  serializeDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts: (
    result: DeterminizedPimcBoundedSecondPlyScaffoldV0Result,
  ) => SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts;
  writeDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts: (input: {
    outDir: string;
    artifacts: SerializedDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts;
  }) => Promise<{ outDir: string; files: readonly string[] }>;
}

interface CliOptions {
  suiteId: string;
  outDir: string;
  runId: string;
  capPolicy: DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy;
  allowNotReady: boolean;
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
    "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74",
  );

const defaultRunId = (suiteId: string) =>
  `${suiteId}:determinized-pimc-bounded-second-ply-scaffold-v0:cFp74`;

const defaultCapPolicy: DeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy = {
  version: "cfp74-default-root-bounded-v1",
  secondPlyPairCapPerRoot: 512,
  rootPublicActionCap: 16,
  postOnePlyPublicActionCapPerState: 16,
  sampleCountCapPerRoot: 8,
  robustTotalPlannedSecondPlyPairSoftCap: 7_500_000,
};

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

const parsePositiveInteger = (value: string, flag: string) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CliUsageError(`${flag} must be a positive integer.`);
  }
  return parsed;
};

const parseArgs = (args: readonly string[]): CliOptions => {
  let suiteId = DEFAULT_SUITE_ID;
  let outDir: string | undefined;
  let runId: string | undefined;
  let allowNotReady = false;
  const capPolicy = { ...defaultCapPolicy };

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
    } else if (arg === "--second-ply-pair-cap") {
      capPolicy.secondPlyPairCapPerRoot = parsePositiveInteger(
        readOptionValue(args, index, arg),
        arg,
      );
      index += 1;
    } else if (arg.startsWith("--second-ply-pair-cap=")) {
      capPolicy.secondPlyPairCapPerRoot = parsePositiveInteger(
        arg.slice("--second-ply-pair-cap=".length),
        "--second-ply-pair-cap",
      );
    } else if (arg === "--root-public-action-cap") {
      capPolicy.rootPublicActionCap = parsePositiveInteger(
        readOptionValue(args, index, arg),
        arg,
      );
      index += 1;
    } else if (arg.startsWith("--root-public-action-cap=")) {
      capPolicy.rootPublicActionCap = parsePositiveInteger(
        arg.slice("--root-public-action-cap=".length),
        "--root-public-action-cap",
      );
    } else if (arg === "--post-one-ply-public-action-cap") {
      capPolicy.postOnePlyPublicActionCapPerState = parsePositiveInteger(
        readOptionValue(args, index, arg),
        arg,
      );
      index += 1;
    } else if (arg.startsWith("--post-one-ply-public-action-cap=")) {
      capPolicy.postOnePlyPublicActionCapPerState = parsePositiveInteger(
        arg.slice("--post-one-ply-public-action-cap=".length),
        "--post-one-ply-public-action-cap",
      );
    } else if (arg === "--sample-count-cap") {
      capPolicy.sampleCountCapPerRoot = parsePositiveInteger(
        readOptionValue(args, index, arg),
        arg,
      );
      index += 1;
    } else if (arg.startsWith("--sample-count-cap=")) {
      capPolicy.sampleCountCapPerRoot = parsePositiveInteger(
        arg.slice("--sample-count-cap=".length),
        "--sample-count-cap",
      );
    } else if (arg === "--robust-soft-cap") {
      capPolicy.robustTotalPlannedSecondPlyPairSoftCap = parsePositiveInteger(
        readOptionValue(args, index, arg),
        arg,
      );
      index += 1;
    } else if (arg.startsWith("--robust-soft-cap=")) {
      capPolicy.robustTotalPlannedSecondPlyPairSoftCap = parsePositiveInteger(
        arg.slice("--robust-soft-cap=".length),
        "--robust-soft-cap",
      );
    } else if (arg === "--allow-not-ready") {
      allowNotReady = true;
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
    capPolicy,
    allowNotReady,
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
  return text.trim().length === 0
    ? []
    : text
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

const sourceArtifactReferencesForSuite = async (suiteId: string) => ({
  cFp68: await artifactReferencesForSuite(suiteId, [
    "determinized-probe-contract/cFp68/manifest.json",
    "determinized-probe-contract/cFp68/summary.json",
    "determinized-probe-contract/cFp68/eligible-roots.jsonl",
    "determinized-probe-contract/cFp68/skipped-roots.jsonl",
    "determinized-probe-contract/cFp68/report.md",
  ]),
  cFp69: await artifactReferencesForSuite(suiteId, [
    "determinized-pimc-probe-v0/cFp69/manifest.json",
    "determinized-pimc-probe-v0/cFp69/summary.json",
    "determinized-pimc-probe-v0/cFp69/probe-roots.jsonl",
    "determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl",
    "determinized-pimc-probe-v0/cFp69/report.md",
  ]),
  cFp70: await artifactReferencesForSuite(suiteId, [
    "determinized-pimc-action-availability-v0/cFp70/manifest.json",
    "determinized-pimc-action-availability-v0/cFp70/summary.json",
    "determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl",
    "determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl",
    "determinized-pimc-action-availability-v0/cFp70/report.md",
  ]),
  cFp71: await artifactReferencesForSuite(suiteId, [
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/manifest.json",
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json",
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl",
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/skipped-roots.jsonl",
    "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/report.md",
  ]),
  cFp72: await artifactReferencesForSuite(suiteId, [
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/manifest.json",
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json",
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/branching-roots.jsonl",
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/skipped-roots.jsonl",
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/report.md",
  ]),
  cFp73: await artifactReferencesForSuite(suiteId, [
    "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/manifest.json",
    "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/summary.json",
    "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/casebook-roots.jsonl",
    "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/skipped-roots.jsonl",
    "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/report.md",
  ]),
});

const readSourceArtifacts = async (
  suiteId: string,
): Promise<
  Omit<
    RunDeterminizedPimcBoundedSecondPlyScaffoldV0Input,
    "suiteId" | "scaffoldRunId"
  >
> => {
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
    cFp72BranchingSummary,
    cFp72BranchingRoots,
    cFp72SkippedRoots,
    cFp73CasebookSummary,
    cFp73CasebookRoots,
    cFp73SkippedRoots,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<DeterminizedProbeContractSummary>(
      artifactPath(suiteId, "determinized-probe-contract/cFp68/summary.json"),
    ),
    readJsonl<DeterminizedProbeContractEligibleRootRecord>(
      artifactPath(
        suiteId,
        "determinized-probe-contract/cFp68/eligible-roots.jsonl",
      ),
    ),
    readJsonl<DeterminizedProbeContractSkippedRootRecord>(
      artifactPath(
        suiteId,
        "determinized-probe-contract/cFp68/skipped-roots.jsonl",
      ),
    ),
    readJsonl<DeterminizedPimcProbeV0RootRecord>(
      artifactPath(suiteId, "determinized-pimc-probe-v0/cFp69/probe-roots.jsonl"),
    ),
    readJsonl<DeterminizedPimcProbeV0SkippedRootRecord>(
      artifactPath(
        suiteId,
        "determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl",
      ),
    ),
    readJson<DeterminizedPimcActionAvailabilityV0Summary>(
      artifactPath(
        suiteId,
        "determinized-pimc-action-availability-v0/cFp70/summary.json",
      ),
    ),
    readJsonl<DeterminizedPimcActionAvailabilityV0RootRecord>(
      artifactPath(
        suiteId,
        "determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl",
      ),
    ),
    readJsonl<DeterminizedPimcActionAvailabilityV0SkippedRootRecord>(
      artifactPath(
        suiteId,
        "determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl",
      ),
    ),
    readJson<DeterminizedPimcOnePlyOutcomeSkeletonV0Summary>(
      artifactPath(
        suiteId,
        "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json",
      ),
    ),
    readJsonl<DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord>(
      artifactPath(
        suiteId,
        "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl",
      ),
    ),
    readJsonl<DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord>(
      artifactPath(
        suiteId,
        "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/skipped-roots.jsonl",
      ),
    ),
    readJson<DeterminizedPimcPostOnePlyBranchingBudgetV0Summary>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json",
      ),
    ),
    readJsonl<DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/branching-roots.jsonl",
      ),
    ),
    readJsonl<DeterminizedPimcPostOnePlyBranchingBudgetV0SkippedRootRecord>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/skipped-roots.jsonl",
      ),
    ),
    readJson<DeterminizedPimcPostOnePlyBranchingBudgetCasebookSummary>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/summary.json",
      ),
    ),
    readJsonl<DeterminizedPimcPostOnePlyBranchingBudgetCasebookRootRecord>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/casebook-roots.jsonl",
      ),
    ),
    readJsonl<DeterminizedPimcPostOnePlyBranchingBudgetCasebookSkippedRootRecord>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/skipped-roots.jsonl",
      ),
    ),
    sourceArtifactReferencesForSuite(suiteId),
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
    cFp72BranchingSummary,
    cFp72BranchingRoots,
    cFp72SkippedRoots,
    cFp73CasebookSummary,
    cFp73CasebookRoots,
    cFp73SkippedRoots,
    sourceArtifactReferences,
  };
};

const run = async () => {
  const startedAt = performance.now();
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const sourceArtifacts = await readSourceArtifacts(options.suiteId);
  const result = benchmark.runDeterminizedPimcBoundedSecondPlyScaffoldV0({
    suiteId: options.suiteId,
    scaffoldRunId: options.runId,
    capPolicy: options.capPolicy,
    ...sourceArtifacts,
  });

  if (
    options.suiteId === "benchmark-v1-starter-matrix-robust-v1" &&
    result.summary.plannedSecondPlyPairCountInCap >
      options.capPolicy.robustTotalPlannedSecondPlyPairSoftCap
  ) {
    throw new Error(
      `robust in-cap planned pair total ${result.summary.plannedSecondPlyPairCountInCap} exceeds soft cap ${options.capPolicy.robustTotalPlannedSecondPlyPairSoftCap}`,
    );
  }
  if (
    result.summary.failedOrDeferredSecondPlyPairCount > 0 &&
    !options.allowNotReady
  ) {
    throw new Error(
      `second-ply failures/deferred pairs observed: ${result.summary.failedOrDeferredSecondPlyPairCount}`,
    );
  }
  if (
    result.summary.sourceConsistency.status !== "ready" &&
    !options.allowNotReady
  ) {
    throw new Error(
      `source consistency not ready: ${JSON.stringify(result.summary.sourceConsistency)}`,
    );
  }

  const artifacts =
    benchmark.serializeDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts(
      result,
    );
  const hiddenInfoIssues =
    benchmark.scanDeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactsForHiddenInfo(
      artifacts,
    );
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `bounded second-ply scaffold hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }

  const secondPlyBytes = Buffer.byteLength(
    artifacts.secondPlyRootsJsonl,
    "utf8",
  );
  if (secondPlyBytes >= 90_000_000) {
    throw new Error(
      `second-ply-roots.jsonl is ${secondPlyBytes} bytes and too close to the 100 MB limit`,
    );
  }

  await benchmark.writeDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes =
    benchmark.determinizedPimcBoundedSecondPlyScaffoldV0ArtifactHashes(
      artifacts,
    );
  console.log(
    [
      `benchmark determinized-pimc-bounded-second-ply-scaffold-v0 complete: suite=${result.suiteId}`,
      `scaffoldRunId=${result.scaffoldRunId}`,
      `readiness=${result.summary.scaffoldReadinessStatus}`,
      `branchingRoots=${result.summary.branchingRootCount}`,
      `inCapRoots=${result.summary.inCapRootCount}`,
      `overBudgetRoots=${result.summary.overBudgetRootCount}`,
      `inheritedSkippedRoots=${result.summary.inheritedSkippedRootCount}`,
      `plannedSecondPlyPairCountTotal=${result.summary.plannedSecondPlyPairCountTotal}`,
      `plannedSecondPlyPairCountInCap=${result.summary.plannedSecondPlyPairCountInCap}`,
      `plannedSecondPlyPairCountOverBudget=${result.summary.plannedSecondPlyPairCountOverBudget}`,
      `completedSecondPlyPairCount=${result.summary.completedSecondPlyPairCount}`,
      `failedOrDeferredSecondPlyPairCount=${result.summary.failedOrDeferredSecondPlyPairCount}`,
      `overBudgetReasonCounts=${JSON.stringify(result.summary.overBudgetReasonCounts)}`,
      `hiddenInfoScan=passed`,
      `secondPlyRootsBytes=${secondPlyBytes}`,
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
