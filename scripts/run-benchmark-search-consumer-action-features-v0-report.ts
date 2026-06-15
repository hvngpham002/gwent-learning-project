import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  SearchConsumerActionFeaturesV0ActionFeatureGapRow,
  SearchConsumerActionFeaturesV0BuildInput,
  SearchConsumerActionFeaturesV0Cfp68EligibleRootInput,
  SearchConsumerActionFeaturesV0Cfp68SummaryInput,
  SearchConsumerActionFeaturesV0Cfp69ProbeRootInput,
  SearchConsumerActionFeaturesV0Cfp69SummaryInput,
  SearchConsumerActionFeaturesV0Cfp70AvailabilityRootInput,
  SearchConsumerActionFeaturesV0Cfp70SummaryInput,
  SearchConsumerActionFeaturesV0Cfp71OutcomeRootInput,
  SearchConsumerActionFeaturesV0Cfp71SummaryInput,
  SearchConsumerActionFeaturesV0Cfp72BranchingRootInput,
  SearchConsumerActionFeaturesV0Cfp72SummaryInput,
  SearchConsumerActionFeaturesV0Cfp73CasebookRootInput,
  SearchConsumerActionFeaturesV0Cfp74OverBudgetRootInput,
  SearchConsumerActionFeaturesV0Cfp74SecondPlyRootInput,
  SearchConsumerActionFeaturesV0Cfp74SkippedRootInput,
  SearchConsumerActionFeaturesV0Cfp74SummaryInput,
  SearchConsumerActionFeaturesV0Result,
  SearchConsumerActionFeaturesV0SourceArtifactReference,
  SearchConsumerActionFeaturesV0SourceRunIds,
  SerializedSearchConsumerActionFeaturesV0Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  buildSearchConsumerActionFeaturesV0Result: (
    input: SearchConsumerActionFeaturesV0BuildInput,
  ) => SearchConsumerActionFeaturesV0Result;
  scanSearchConsumerActionFeaturesV0ArtifactsForHiddenInfo: (
    artifacts: SerializedSearchConsumerActionFeaturesV0Artifacts,
  ) => string[];
  searchConsumerActionFeaturesV0ArtifactHashes: (
    artifacts: SerializedSearchConsumerActionFeaturesV0Artifacts,
  ) => Record<string, string>;
  serializeSearchConsumerActionFeaturesV0Artifacts: (input: {
    result: SearchConsumerActionFeaturesV0Result;
    featureRunId: string;
    suiteId: string;
    sourceBenchmarkSuiteId: string;
    sourceRunIds: SearchConsumerActionFeaturesV0SourceRunIds;
    sourceArtifactReferences: readonly SearchConsumerActionFeaturesV0SourceArtifactReference[];
  }) => SerializedSearchConsumerActionFeaturesV0Artifacts;
  writeSearchConsumerActionFeaturesV0Artifacts: (input: {
    outDir: string;
    artifacts: SerializedSearchConsumerActionFeaturesV0Artifacts;
  }) => Promise<{ outDir: string; files: readonly string[] }>;
}

interface CliOptions {
  suiteId: string;
  outDir: string;
  allowGap: boolean;
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
  resolve(benchmarkResultsDir, suiteId, "search-consumer-action-features-v0/cFp76");

const defaultFeatureRunId = (suiteId: string) =>
  `${suiteId}:search-consumer-action-features-v0:cFp76`;

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
  let allowGap = true;

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
    } else if (arg === "--allow-gap") {
      const value = readOptionValue(args, index, arg);
      if (value !== "true" && value !== "false") {
        throw new CliUsageError("--allow-gap must be 'true' or 'false'.");
      }
      allowGap = value === "true";
      index += 1;
    } else if (arg.startsWith("--allow-gap=")) {
      const value = arg.slice("--allow-gap=".length);
      if (value !== "true" && value !== "false") {
        throw new CliUsageError("--allow-gap must be 'true' or 'false'.");
      }
      allowGap = value === "true";
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
    allowGap,
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

const artifactReferencesForSuite = async (
  suiteId: string,
  paths: readonly string[],
): Promise<SearchConsumerActionFeaturesV0SourceArtifactReference[]> =>
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

const sourceArtifactReferencesForSuite = async (suiteId: string) => {
  const groups = await Promise.all([
    artifactReferencesForSuite(suiteId, [
      "determinized-probe-contract/cFp68/manifest.json",
      "determinized-probe-contract/cFp68/summary.json",
      "determinized-probe-contract/cFp68/eligible-roots.jsonl",
      "determinized-probe-contract/cFp68/skipped-roots.jsonl",
      "determinized-probe-contract/cFp68/report.md",
    ]),
    artifactReferencesForSuite(suiteId, [
      "determinized-pimc-probe-v0/cFp69/manifest.json",
      "determinized-pimc-probe-v0/cFp69/summary.json",
      "determinized-pimc-probe-v0/cFp69/probe-roots.jsonl",
      "determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl",
      "determinized-pimc-probe-v0/cFp69/report.md",
    ]),
    artifactReferencesForSuite(suiteId, [
      "determinized-pimc-action-availability-v0/cFp70/manifest.json",
      "determinized-pimc-action-availability-v0/cFp70/summary.json",
      "determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl",
      "determinized-pimc-action-availability-v0/cFp70/skipped-roots.jsonl",
      "determinized-pimc-action-availability-v0/cFp70/report.md",
    ]),
    artifactReferencesForSuite(suiteId, [
      "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/manifest.json",
      "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json",
      "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl",
      "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/skipped-roots.jsonl",
      "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/report.md",
    ]),
    artifactReferencesForSuite(suiteId, [
      "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/manifest.json",
      "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json",
      "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/branching-roots.jsonl",
      "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/skipped-roots.jsonl",
      "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/report.md",
    ]),
    artifactReferencesForSuite(suiteId, [
      "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/manifest.json",
      "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/summary.json",
      "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/casebook-roots.jsonl",
      "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/skipped-roots.jsonl",
      "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/report.md",
    ]),
    artifactReferencesForSuite(suiteId, [
      "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/manifest.json",
      "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/summary.json",
      "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/second-ply-roots.jsonl",
      "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/over-budget-roots.jsonl",
      "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/skipped-roots.jsonl",
      "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/report.md",
    ]),
  ]);

  return groups.flat();
};

interface Cfp68SummaryFile extends SearchConsumerActionFeaturesV0Cfp68SummaryInput {
  contractRunId: string;
}

interface Cfp69SummaryFile extends SearchConsumerActionFeaturesV0Cfp69SummaryInput {
  probeRunId: string;
}

interface Cfp70SummaryFile extends SearchConsumerActionFeaturesV0Cfp70SummaryInput {
  probeRunId: string;
}

interface Cfp71SummaryFile extends SearchConsumerActionFeaturesV0Cfp71SummaryInput {
  probeRunId: string;
}

interface Cfp72SummaryFile extends SearchConsumerActionFeaturesV0Cfp72SummaryInput {
  probeRunId: string;
}

interface Cfp73SummaryFile {
  casebookRunId: string;
}

interface Cfp74SummaryFile extends SearchConsumerActionFeaturesV0Cfp74SummaryInput {
  scaffoldRunId: string;
}

const readSourceArtifacts = async (suiteId: string) => {
  const [
    cfp68Summary,
    cfp68EligibleRoots,
    cfp69Summary,
    cfp69ProbeRoots,
    cfp70Summary,
    cfp70AvailabilityRoots,
    cfp71Summary,
    cfp71OutcomeRoots,
    cfp72Summary,
    cfp72BranchingRoots,
    cfp73Summary,
    cfp73CasebookRoots,
    cfp74Summary,
    cfp74SecondPlyRoots,
    cfp74OverBudgetRoots,
    cfp74SkippedRoots,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<Cfp68SummaryFile>(
      artifactPath(suiteId, "determinized-probe-contract/cFp68/summary.json"),
    ),
    readJsonl<SearchConsumerActionFeaturesV0Cfp68EligibleRootInput>(
      artifactPath(suiteId, "determinized-probe-contract/cFp68/eligible-roots.jsonl"),
    ),
    readJson<Cfp69SummaryFile>(
      artifactPath(suiteId, "determinized-pimc-probe-v0/cFp69/summary.json"),
    ),
    readJsonl<SearchConsumerActionFeaturesV0Cfp69ProbeRootInput>(
      artifactPath(suiteId, "determinized-pimc-probe-v0/cFp69/probe-roots.jsonl"),
    ),
    readJson<Cfp70SummaryFile>(
      artifactPath(suiteId, "determinized-pimc-action-availability-v0/cFp70/summary.json"),
    ),
    readJsonl<SearchConsumerActionFeaturesV0Cfp70AvailabilityRootInput>(
      artifactPath(
        suiteId,
        "determinized-pimc-action-availability-v0/cFp70/availability-roots.jsonl",
      ),
    ),
    readJson<Cfp71SummaryFile>(
      artifactPath(suiteId, "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json"),
    ),
    readJsonl<SearchConsumerActionFeaturesV0Cfp71OutcomeRootInput>(
      artifactPath(
        suiteId,
        "determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/outcome-roots.jsonl",
      ),
    ),
    readJson<Cfp72SummaryFile>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json",
      ),
    ),
    readJsonl<SearchConsumerActionFeaturesV0Cfp72BranchingRootInput>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/branching-roots.jsonl",
      ),
    ),
    readJson<Cfp73SummaryFile>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/summary.json",
      ),
    ),
    readJsonl<SearchConsumerActionFeaturesV0Cfp73CasebookRootInput>(
      artifactPath(
        suiteId,
        "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73/casebook-roots.jsonl",
      ),
    ),
    readJson<Cfp74SummaryFile>(
      artifactPath(suiteId, "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/summary.json"),
    ),
    readJsonl<SearchConsumerActionFeaturesV0Cfp74SecondPlyRootInput>(
      artifactPath(
        suiteId,
        "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/second-ply-roots.jsonl",
      ),
    ),
    readJsonl<SearchConsumerActionFeaturesV0Cfp74OverBudgetRootInput>(
      artifactPath(
        suiteId,
        "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/over-budget-roots.jsonl",
      ),
    ),
    readJsonl<SearchConsumerActionFeaturesV0Cfp74SkippedRootInput>(
      artifactPath(
        suiteId,
        "determinized-pimc-bounded-second-ply-scaffold-v0/cFp74/skipped-roots.jsonl",
      ),
    ),
    sourceArtifactReferencesForSuite(suiteId),
  ]);

  const sourceArtifactEmptyHashCount = sourceArtifactReferences.filter(
    (reference) => reference.sha256 === EMPTY_SHA256,
  ).length;

  const sourceRunIds: SearchConsumerActionFeaturesV0SourceRunIds = {
    cfp68: cfp68Summary.contractRunId,
    cfp69: cfp69Summary.probeRunId,
    cfp70: cfp70Summary.probeRunId,
    cfp71: cfp71Summary.probeRunId,
    cfp72: cfp72Summary.probeRunId,
    cfp73: cfp73Summary.casebookRunId,
    cfp74: cfp74Summary.scaffoldRunId,
  };

  return {
    cfp68Summary,
    cfp68EligibleRoots,
    cfp69Summary,
    cfp69ProbeRoots,
    cfp70Summary,
    cfp70AvailabilityRoots,
    cfp71Summary,
    cfp71OutcomeRoots,
    cfp72Summary,
    cfp72BranchingRoots,
    cfp73CasebookRoots,
    cfp74Summary,
    cfp74SecondPlyRoots,
    cfp74OverBudgetRoots,
    cfp74SkippedRoots,
    sourceArtifactReferences,
    sourceArtifactEmptyHashCount,
    sourceRunIds,
  };
};

const formatGapRow = (gap: SearchConsumerActionFeaturesV0ActionFeatureGapRow) =>
  `${gap.sourcePhase}:${gap.gapScope}:${gap.missingFieldCategory}`;

const run = async () => {
  const startedAt = performance.now();
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const sourceArtifacts = await readSourceArtifacts(options.suiteId);
  const featureRunId = defaultFeatureRunId(options.suiteId);

  const result = benchmark.buildSearchConsumerActionFeaturesV0Result({
    suiteId: options.suiteId,
    featureRunId,
    sourceBenchmarkSuiteId: options.suiteId,
    sourceCfp68RunId: sourceArtifacts.sourceRunIds.cfp68,
    sourceCfp69RunId: sourceArtifacts.sourceRunIds.cfp69,
    sourceCfp70RunId: sourceArtifacts.sourceRunIds.cfp70,
    sourceCfp71RunId: sourceArtifacts.sourceRunIds.cfp71,
    sourceCfp72RunId: sourceArtifacts.sourceRunIds.cfp72,
    sourceCfp73RunId: sourceArtifacts.sourceRunIds.cfp73,
    sourceCfp74RunId: sourceArtifacts.sourceRunIds.cfp74,
    cfp68Summary: sourceArtifacts.cfp68Summary,
    cfp69Summary: sourceArtifacts.cfp69Summary,
    cfp70Summary: sourceArtifacts.cfp70Summary,
    cfp71Summary: sourceArtifacts.cfp71Summary,
    cfp72Summary: sourceArtifacts.cfp72Summary,
    cfp74Summary: sourceArtifacts.cfp74Summary,
    cfp68EligibleRoots: sourceArtifacts.cfp68EligibleRoots,
    cfp69ProbeRoots: sourceArtifacts.cfp69ProbeRoots,
    cfp70AvailabilityRoots: sourceArtifacts.cfp70AvailabilityRoots,
    cfp71OutcomeRoots: sourceArtifacts.cfp71OutcomeRoots,
    cfp72BranchingRoots: sourceArtifacts.cfp72BranchingRoots,
    cfp73CasebookRoots: sourceArtifacts.cfp73CasebookRoots,
    cfp74SecondPlyRoots: sourceArtifacts.cfp74SecondPlyRoots,
    cfp74OverBudgetRoots: sourceArtifacts.cfp74OverBudgetRoots,
    cfp74SkippedRoots: sourceArtifacts.cfp74SkippedRoots,
    sourceArtifactReferenceCount: sourceArtifacts.sourceArtifactReferences.length,
    sourceArtifactEmptyHashCount: sourceArtifacts.sourceArtifactEmptyHashCount,
  });

  if (result.consumerReadinessStatus === "source_consistency_failed") {
    throw new Error(
      `search-consumer-action-features-v0: source consistency not ready: ${JSON.stringify(
        result.sourceConsistency,
      )}`,
    );
  }
  if (result.consumerReadinessStatus === "action_feature_source_gap" && !options.allowGap) {
    throw new Error(
      `search-consumer-action-features-v0: action_feature_source_gap reported and --allow-gap=false`,
    );
  }

  const artifacts = benchmark.serializeSearchConsumerActionFeaturesV0Artifacts({
    result,
    featureRunId,
    suiteId: options.suiteId,
    sourceBenchmarkSuiteId: options.suiteId,
    sourceRunIds: sourceArtifacts.sourceRunIds,
    sourceArtifactReferences: sourceArtifacts.sourceArtifactReferences,
  });

  const hiddenInfoIssues =
    benchmark.scanSearchConsumerActionFeaturesV0ArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `search-consumer-action-features-v0 hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }

  const jsonlArtifacts: Record<string, string> = {
    "root-features.jsonl": artifacts.rootFeaturesJsonl,
    "action-features.jsonl": artifacts.actionFeaturesJsonl,
    "action-feature-gaps.jsonl": artifacts.actionFeatureGapsJsonl,
    "skipped-roots.jsonl": artifacts.skippedRootsJsonl,
  };
  const byteSizes: Record<string, number> = {};
  for (const [file, text] of Object.entries(jsonlArtifacts)) {
    const bytes = Buffer.byteLength(text, "utf8");
    byteSizes[file] = bytes;
    if (bytes >= 90_000_000) {
      throw new Error(`${file} is ${bytes} bytes and too close to the 90 MB hard stop`);
    }
  }

  await benchmark.writeSearchConsumerActionFeaturesV0Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.searchConsumerActionFeaturesV0ArtifactHashes(artifacts);
  console.log(
    [
      `benchmark search-consumer-action-features-v0 complete: suite=${options.suiteId}`,
      `featureRunId=${featureRunId}`,
      `consumerReadinessStatus=${result.consumerReadinessStatus}`,
      `sourceConsistencyStatus=${result.sourceConsistency.status}`,
      `rootFeatureRowCount=${result.rootFeatures.length}`,
      `skippedRootRowCount=${result.skippedRoots.length}`,
      `actionFeatureRowCount=${result.actionFeatures.length}`,
      `actionFeatureGapRowCount=${result.actionFeatureGaps.length}`,
      `actionFeatureGaps=${result.actionFeatureGaps.map(formatGapRow).join(", ")}`,
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
