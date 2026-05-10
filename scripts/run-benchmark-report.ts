import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type { BenchmarkArtifactBundle } from "../src/game/benchmark/artifacts";
import type { BenchmarkRunInput, BenchmarkRunResult } from "../src/game/benchmark/types";

interface BenchmarkModule {
  buildBenchmarkArtifactBundle: (result: BenchmarkRunResult) => BenchmarkArtifactBundle;
  runBenchmarkSuite: (input?: BenchmarkRunInput) => BenchmarkRunResult;
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

const DEFAULT_SUITE_ID = "benchmark-smoke-v1";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const defaultOutputDir = (suiteId: string) =>
  resolve(rootDir, "docs/research/literature/ai/benchmark-results", suiteId, "latest");

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
  const resolvedRunId = runId ?? `${suiteId}:latest`;

  return {
    suiteId,
    outDir: outDir ?? defaultOutputDir(suiteId),
    runId: resolvedRunId,
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

const writeArtifactFiles = async (outDir: string, bundle: BenchmarkArtifactBundle) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), bundle.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), bundle.summaryJson, "utf8"),
    writeFile(resolve(outDir, "records.jsonl"), bundle.recordsJsonl, "utf8"),
    writeFile(resolve(outDir, "report.md"), bundle.reportMarkdown, "utf8"),
  ]);
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const result = benchmark.runBenchmarkSuite({
    suiteId: options.suiteId,
    benchmarkRunId: options.runId,
    maxSteps: options.maxSteps,
  });
  const bundle = benchmark.buildBenchmarkArtifactBundle(result);

  await writeArtifactFiles(options.outDir, bundle);
  console.log(
    `benchmark report complete: suite=${result.summary.suiteId} records=${result.records.length} out=${options.outDir}`,
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`benchmark report failed: ${message}`);
  process.exitCode = 1;
});
