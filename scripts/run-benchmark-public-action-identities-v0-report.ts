import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  PublicActionIdentitiesV0Cfp68EligibleRootInput,
  PublicActionIdentitiesV0Cfp68SkippedRootInput,
  PublicActionIdentitiesV0Cfp68SummaryInput,
  PublicActionIdentitiesV0Cfp69ProbeRootInput,
  PublicActionIdentitiesV0Cfp69SkippedRootInput,
  PublicActionIdentitiesV0Cfp69SummaryInput,
  PublicActionIdentitiesV0Cfp76SummaryInput,
  PublicActionIdentitiesV0RunResult,
  PublicActionIdentitiesV0SourceArtifactReference,
  PublicActionIdentitiesV0SourceRunIds,
  RunPublicActionIdentitiesV0Input,
  SerializedPublicActionIdentitiesV0Artifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  runPublicActionIdentitiesV0: (
    input: RunPublicActionIdentitiesV0Input,
  ) => PublicActionIdentitiesV0RunResult;
  scanPublicActionIdentitiesV0ArtifactsForHiddenInfo: (
    artifacts: SerializedPublicActionIdentitiesV0Artifacts,
  ) => string[];
  publicActionIdentitiesV0ArtifactHashes: (
    artifacts: SerializedPublicActionIdentitiesV0Artifacts,
  ) => Record<string, string>;
  serializePublicActionIdentitiesV0Artifacts: (input: {
    result: PublicActionIdentitiesV0RunResult;
    identityRunId: string;
    suiteId: string;
    sourceBenchmarkSuiteId: string;
    sourceRunIds: PublicActionIdentitiesV0SourceRunIds;
    sourceArtifactReferences: readonly PublicActionIdentitiesV0SourceArtifactReference[];
  }) => SerializedPublicActionIdentitiesV0Artifacts;
  writePublicActionIdentitiesV0Artifacts: (input: {
    outDir: string;
    artifacts: SerializedPublicActionIdentitiesV0Artifacts;
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
  resolve(benchmarkResultsDir, suiteId, "public-action-identities-v0/cFp77");

const defaultRunId = (suiteId: string) => `${suiteId}:public-action-identities-v0:cFp77`;

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

const countJsonlRows = (text: string): number => {
  if (text.trim().length === 0) return 0;
  return text.endsWith("\n") ? text.split("\n").length - 1 : text.split("\n").length;
};

const sha256Text = (value: string) => createHash("sha256").update(value, "utf8").digest("hex");

const EMPTY_SHA256 = sha256Text("");

const toRelativePath = (path: string) => relative(rootDir, path).replaceAll("\\", "/");

const artifactReferencesForSuite = async (
  suiteId: string,
  paths: readonly string[],
): Promise<PublicActionIdentitiesV0SourceArtifactReference[]> =>
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
      "search-consumer-action-features-v0/cFp76/manifest.json",
      "search-consumer-action-features-v0/cFp76/summary.json",
      "search-consumer-action-features-v0/cFp76/root-features.jsonl",
      "search-consumer-action-features-v0/cFp76/action-feature-gaps.jsonl",
      "search-consumer-action-features-v0/cFp76/report.md",
    ]),
  ]);

  return groups.flat();
};

interface Cfp68SummaryFile extends PublicActionIdentitiesV0Cfp68SummaryInput {
  contractRunId: string;
}

interface Cfp69SummaryFile extends PublicActionIdentitiesV0Cfp69SummaryInput {
  probeRunId: string;
}

interface Cfp76SummaryFile extends PublicActionIdentitiesV0Cfp76SummaryInput {
  featureRunId: string;
}

const readSourceArtifacts = async (suiteId: string) => {
  const [
    cfp68Summary,
    cfp68EligibleRoots,
    cfp68SkippedRoots,
    cfp69Summary,
    cfp69ProbeRoots,
    cfp69SkippedRoots,
    cfp76Summary,
    cfp76RootFeaturesText,
    sourceArtifactReferences,
  ] = await Promise.all([
    readJson<Cfp68SummaryFile>(
      artifactPath(suiteId, "determinized-probe-contract/cFp68/summary.json"),
    ),
    readJsonl<PublicActionIdentitiesV0Cfp68EligibleRootInput>(
      artifactPath(suiteId, "determinized-probe-contract/cFp68/eligible-roots.jsonl"),
    ),
    readJsonl<PublicActionIdentitiesV0Cfp68SkippedRootInput>(
      artifactPath(suiteId, "determinized-probe-contract/cFp68/skipped-roots.jsonl"),
    ),
    readJson<Cfp69SummaryFile>(
      artifactPath(suiteId, "determinized-pimc-probe-v0/cFp69/summary.json"),
    ),
    readJsonl<PublicActionIdentitiesV0Cfp69ProbeRootInput>(
      artifactPath(suiteId, "determinized-pimc-probe-v0/cFp69/probe-roots.jsonl"),
    ),
    readJsonl<PublicActionIdentitiesV0Cfp69SkippedRootInput>(
      artifactPath(suiteId, "determinized-pimc-probe-v0/cFp69/skipped-roots.jsonl"),
    ),
    readJson<Cfp76SummaryFile>(
      artifactPath(suiteId, "search-consumer-action-features-v0/cFp76/summary.json"),
    ),
    readText(artifactPath(suiteId, "search-consumer-action-features-v0/cFp76/root-features.jsonl")),
    sourceArtifactReferencesForSuite(suiteId),
  ]);

  const sourceArtifactEmptyHashCount = sourceArtifactReferences.filter(
    (reference) => reference.sha256 === EMPTY_SHA256,
  ).length;

  const sourceRunIds: PublicActionIdentitiesV0SourceRunIds = {
    cfp68: cfp68Summary.contractRunId,
    cfp69: cfp69Summary.probeRunId,
    cfp76: cfp76Summary.featureRunId,
  };

  return {
    cfp68Summary,
    cfp68EligibleRoots,
    cfp68SkippedRoots,
    cfp69Summary,
    cfp69ProbeRoots,
    cfp69SkippedRoots,
    cfp76Summary,
    cfp76RootFeatureRowCount: countJsonlRows(cfp76RootFeaturesText),
    sourceArtifactReferences,
    sourceArtifactEmptyHashCount,
    sourceRunIds,
  };
};

const run = async () => {
  const startedAt = performance.now();
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const sourceArtifacts = await readSourceArtifacts(options.suiteId);

  const result = benchmark.runPublicActionIdentitiesV0({
    suiteId: options.suiteId,
    identityRunId: options.runId,
    sourceCfp68RunId: sourceArtifacts.sourceRunIds.cfp68,
    sourceCfp69RunId: sourceArtifacts.sourceRunIds.cfp69,
    sourceCfp76RunId: sourceArtifacts.sourceRunIds.cfp76,
    cfp68Summary: sourceArtifacts.cfp68Summary,
    cfp69Summary: sourceArtifacts.cfp69Summary,
    cfp76Summary: sourceArtifacts.cfp76Summary,
    cfp68EligibleRoots: sourceArtifacts.cfp68EligibleRoots,
    cfp68SkippedRoots: sourceArtifacts.cfp68SkippedRoots,
    cfp69ProbeRoots: sourceArtifacts.cfp69ProbeRoots,
    cfp69SkippedRoots: sourceArtifacts.cfp69SkippedRoots,
    cfp76RootFeatureRowCount: sourceArtifacts.cfp76RootFeatureRowCount,
    sourceArtifactReferenceCount: sourceArtifacts.sourceArtifactReferences.length,
    sourceArtifactEmptyHashCount: sourceArtifacts.sourceArtifactEmptyHashCount,
  });

  if (result.identityReadinessStatus === "source_consistency_failed") {
    throw new Error(
      `public-action-identities-v0: source consistency not ready: ${JSON.stringify(
        result.sourceConsistency,
      )}`,
    );
  }

  const artifacts = benchmark.serializePublicActionIdentitiesV0Artifacts({
    result,
    identityRunId: options.runId,
    suiteId: options.suiteId,
    sourceBenchmarkSuiteId: result.benchmark.summary.suiteId,
    sourceRunIds: sourceArtifacts.sourceRunIds,
    sourceArtifactReferences: sourceArtifacts.sourceArtifactReferences,
  });

  const hiddenInfoIssues =
    benchmark.scanPublicActionIdentitiesV0ArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `public-action-identities-v0 hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }

  const jsonlArtifacts: Record<string, string> = {
    "action-identities.jsonl": artifacts.actionIdentitiesJsonl,
    "root-summaries.jsonl": artifacts.rootSummariesJsonl,
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

  await benchmark.writePublicActionIdentitiesV0Artifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.publicActionIdentitiesV0ArtifactHashes(artifacts);
  console.log(
    [
      `benchmark public-action-identities-v0 complete: suite=${options.suiteId}`,
      `identityRunId=${options.runId}`,
      `identityReadinessStatus=${result.identityReadinessStatus}`,
      `sourceConsistencyStatus=${result.sourceConsistency.status}`,
      `actionIdentityRowCount=${result.actionIdentities.length}`,
      `rootSummaryRowCount=${result.rootSummaries.length}`,
      `skippedRootRowCount=${result.skippedRoots.length}`,
      `cfp69PublicActionCountTotal=${result.sourceConsistency.cfp69PublicActionCountTotal}`,
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
