import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  SamplerReadinessProfileInput,
  SamplerReadinessProfileResult,
  SerializedSamplerReadinessArtifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  runSamplerReadinessProfile: (
    input?: SamplerReadinessProfileInput,
  ) => SamplerReadinessProfileResult;
  scanSamplerReadinessArtifactsForHiddenInfo: (
    artifacts: SerializedSamplerReadinessArtifacts,
  ) => string[];
  samplerReadinessArtifactHashes: (
    artifacts: SerializedSamplerReadinessArtifacts,
  ) => Record<string, string>;
  serializeSamplerReadinessArtifacts: (
    result: SamplerReadinessProfileResult,
  ) => SerializedSamplerReadinessArtifacts;
  writeSamplerReadinessArtifacts: (input: {
    outDir: string;
    artifacts: SerializedSamplerReadinessArtifacts;
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

const KNOWN_SUITE_IDS = new Set<string>([
  "benchmark-v1-starter-matrix-v1",
  "benchmark-v1-starter-matrix-robust-v1",
]);

const DEFAULT_SUITE_ID = "benchmark-v1-starter-matrix-v1";
const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const defaultOutputDir = (suiteId: string) =>
  resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "sampler-readiness/cFp60",
  );

const defaultRunId = (suiteId: string) => `${suiteId}:sampler-readiness:cFp60`;

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
    throw new CliUsageError(
      `--max-steps must be a positive integer, received ${value}.`,
    );
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
    return (await server.ssrLoadModule(
      "/src/game/benchmark/index.ts",
    )) as BenchmarkModule;
  } finally {
    await server.close();
  }
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
  const result = benchmark.runSamplerReadinessProfile({
    suiteId: options.suiteId,
    samplerRunId: options.runId,
    maxSteps: options.maxSteps,
  });
  const artifacts = benchmark.serializeSamplerReadinessArtifacts(result);
  const hiddenInfoIssues =
    benchmark.scanSamplerReadinessArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(
      `sampler-readiness hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`,
    );
  }

  await benchmark.writeSamplerReadinessArtifacts({
    outDir: options.outDir,
    artifacts,
  });

  const elapsedMs = Math.round(performance.now() - startedAt);
  const hashes = benchmark.samplerReadinessArtifactHashes(artifacts);
  console.log(
    [
      `benchmark sampler-readiness complete: suite=${result.suiteId}`,
      `samplerRunId=${result.samplerRunId}`,
      `matches=${result.summary.matchCount}`,
      `roots=${result.summary.rootRecordCount}`,
      `priorStatusCounts=${JSON.stringify(result.summary.priorStatusCounts)}`,
      `validationStatusCounts=${JSON.stringify(result.summary.validationStatusCounts)}`,
      `publicActionCountStats=${JSON.stringify(result.summary.publicActionCountStats)}`,
      `collisionCountStats=${JSON.stringify(result.summary.collisionCountStats)}`,
      `hiddenInfoScan=passed`,
      `elapsedMs=${elapsedMs}`,
      `out=${options.outDir}`,
      ...Object.entries(hashes).map(([file, hash]) => `${file}=${hash}`),
    ].join("\n"),
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`benchmark sampler-readiness failed: ${message}`);
  process.exitCode = 1;
});
