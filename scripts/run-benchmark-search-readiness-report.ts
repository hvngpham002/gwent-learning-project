import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  SearchReadinessProfileInput,
  SearchReadinessProfileResult,
  SerializedSearchReadinessArtifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  runSearchReadinessProfile: (input?: SearchReadinessProfileInput) => SearchReadinessProfileResult;
  scanSearchReadinessArtifactsForHiddenInfo: (artifacts: SerializedSearchReadinessArtifacts) => string[];
  searchReadinessArtifactHashes: (artifacts: SerializedSearchReadinessArtifacts) => Record<string, string>;
  serializeSearchReadinessArtifacts: (result: SearchReadinessProfileResult) => SerializedSearchReadinessArtifacts;
  writeSearchReadinessArtifacts: (input: {
    outDir: string;
    artifacts: SerializedSearchReadinessArtifacts;
  }) => Promise<{ outDir: string; files: readonly string[] }>;
}

interface CliOptions {
  suiteId: string;
  outDir: string;
  runId: string;
  maxSteps?: number;
}

class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

const DEFAULT_SUITE_ID = "benchmark-v1-starter-matrix-v1";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const defaultOutputDir = (suiteId: string) =>
  resolve(rootDir, "docs/research/literature/ai/benchmark-results", suiteId, "search-readiness/cFp59");

const defaultRunId = (suiteId: string) => `${suiteId}:search-readiness:cFp59`;

const readOptionValue = (args: readonly string[], index: number, flag: string) => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new CliUsageError(`${flag} requires a value.`);
  }
  return value;
};

const parseMaxSteps = (value: string) => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new CliUsageError(`--max-steps must be a positive integer, received ${value}.`);
  }
  return parsed;
};

const parseArgs = (args: readonly string[]): CliOptions => {
  let suiteId = DEFAULT_SUITE_ID;
  let outDir: string | undefined;
  let runId: string | undefined;
  let maxSteps: number | undefined;

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
    } else if (arg === "--max-steps") {
      maxSteps = parseMaxSteps(readOptionValue(args, index, arg));
      index += 1;
    } else if (arg.startsWith("--max-steps=")) {
      maxSteps = parseMaxSteps(arg.slice("--max-steps=".length));
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
    maxSteps,
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

const run = async () => {
  const startedAt = performance.now();
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const result = benchmark.runSearchReadinessProfile({
    suiteId: options.suiteId,
    profileRunId: options.runId,
    maxSteps: options.maxSteps,
  });
  const artifacts = benchmark.serializeSearchReadinessArtifacts(result);
  const hiddenInfoIssues = benchmark.scanSearchReadinessArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(`search-readiness hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`);
  }

  await benchmark.writeSearchReadinessArtifacts({ outDir: options.outDir, artifacts });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.searchReadinessArtifactHashes(artifacts);
  console.log(
    [
      `benchmark search-readiness complete: suite=${result.suiteId}`,
      `profileRunId=${result.profileRunId}`,
      `matches=${result.summary.matchCount}`,
      `roots=${result.summary.rootRecordCount}`,
      `maxLegalMoveCount=${result.summary.maxLegalMoveRoot?.legalMoveCount ?? 0}`,
      `maxTargetExpansionCount=${result.summary.maxTargetExpansionRoot?.playCardTargetExpansionCount ?? 0}`,
      `hiddenInfoScan=passed`,
      `elapsedMs=${elapsedMs}`,
      `out=${options.outDir}`,
      ...Object.entries(hashes).map(([file, hash]) => `${file}=${hash}`),
    ].join("\n"),
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`benchmark search-readiness failed: ${message}`);
  process.exitCode = 1;
});
