import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  BenchmarkFailureMiningResult,
  BenchmarkRunInput,
  BenchmarkRunResult,
  SerializedBenchmarkFailureMiningArtifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  buildBenchmarkFailureMiningReport: (input: {
    suiteId: string;
    benchmarkRunId: string;
    records: BenchmarkRunResult["records"];
    debugResults?: BenchmarkRunResult["unsafeDebugResults"];
  }) => BenchmarkFailureMiningResult;
  runBenchmarkSuite: (input?: BenchmarkRunInput) => BenchmarkRunResult;
  scanBenchmarkFailureMiningArtifactsForHiddenInfo: (
    artifacts: SerializedBenchmarkFailureMiningArtifacts,
  ) => string[];
  serializeBenchmarkFailureMiningArtifacts: (
    result: BenchmarkFailureMiningResult,
  ) => SerializedBenchmarkFailureMiningArtifacts;
  writeBenchmarkFailureMiningArtifacts: (input: {
    outDir: string;
    artifacts: SerializedBenchmarkFailureMiningArtifacts;
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
  resolve(rootDir, "docs/research/literature/ai/benchmark-results", suiteId, "failure-mining/latest");

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
    runId: runId ?? `${suiteId}:latest`,
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

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const artifactHashes = (artifacts: SerializedBenchmarkFailureMiningArtifacts) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "summary.json": sha256(artifacts.summaryJson),
  "findings.jsonl": sha256(artifacts.findingsJsonl),
  "report.md": sha256(artifacts.reportMarkdown),
});

const topFindingKinds = (result: BenchmarkFailureMiningResult) =>
  Object.entries(result.summary.findingCountsByKind)
    .filter(([, count]) => count > 0)
    .sort(([, leftCount], [, rightCount]) => rightCount - leftCount)
    .slice(0, 3)
    .map(([kind, count]) => `${kind}=${count}`)
    .join(", ") || "none";

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const benchmarkResult = benchmark.runBenchmarkSuite({
    suiteId: options.suiteId,
    benchmarkRunId: options.runId,
    maxSteps: options.maxSteps,
    includeDebugResults: true,
    includeDecisionTraces: true,
  });
  const miningResult = benchmark.buildBenchmarkFailureMiningReport({
    suiteId: benchmarkResult.summary.suiteId,
    benchmarkRunId: benchmarkResult.summary.benchmarkRunId,
    records: benchmarkResult.records,
    debugResults: benchmarkResult.unsafeDebugResults,
  });
  const artifacts = benchmark.serializeBenchmarkFailureMiningArtifacts(miningResult);
  const hiddenInfoIssues = benchmark.scanBenchmarkFailureMiningArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(`failure-mining hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`);
  }

  await benchmark.writeBenchmarkFailureMiningArtifacts({ outDir: options.outDir, artifacts });

  const hashes = artifactHashes(artifacts);
  console.log(
    [
      `benchmark failure mining complete: suite=${benchmarkResult.summary.suiteId}`,
      `records=${benchmarkResult.records.length}`,
      `findings=${miningResult.findings.length}`,
      `topKinds=${topFindingKinds(miningResult)}`,
      `out=${options.outDir}`,
      ...Object.entries(hashes).map(([file, hash]) => `${file}=${hash}`),
    ].join("\n"),
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`benchmark failure mining failed: ${message}`);
  process.exitCode = 1;
});
