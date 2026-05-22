import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

import type {
  RoundOneGuardDebugResult,
  SerializedRoundOneGuardDebugArtifacts,
} from "../src/game/benchmark";

interface BenchmarkModule {
  runRoundOneGuardDebugCases: () => RoundOneGuardDebugResult;
  scanRoundOneGuardDebugArtifactsForHiddenInfo: (
    artifacts: SerializedRoundOneGuardDebugArtifacts,
  ) => string[];
  serializeRoundOneGuardDebugArtifacts: (
    result: RoundOneGuardDebugResult,
  ) => SerializedRoundOneGuardDebugArtifacts;
  writeRoundOneGuardDebugArtifacts: (input: {
    outDir: string;
    artifacts: SerializedRoundOneGuardDebugArtifacts;
  }) => Promise<{ outDir: string; files: readonly string[] }>;
}

interface CliOptions {
  outDir: string;
}

class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const defaultOutputDir = () =>
  resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/round-one-guard-debug/cFp52",
  );

const readOptionValue = (args: readonly string[], index: number, flag: string) => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new CliUsageError(`${flag} requires a value.`);
  }
  return value;
};

const parseArgs = (args: readonly string[]): CliOptions => {
  let outDir: string | undefined;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--out") {
      outDir = resolve(rootDir, readOptionValue(args, index, arg));
      index += 1;
    } else if (arg.startsWith("--out=")) {
      outDir = resolve(rootDir, arg.slice("--out=".length));
    } else {
      throw new CliUsageError(`Unknown option: ${arg}.`);
    }
  }

  return {
    outDir: outDir ?? defaultOutputDir(),
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

const artifactHashes = (artifacts: SerializedRoundOneGuardDebugArtifacts) => ({
  "manifest.json": sha256(artifacts.manifestJson),
  "cases.json": sha256(artifacts.casesJson),
  "report.md": sha256(artifacts.reportMarkdown),
});

const verdictCounts = (result: RoundOneGuardDebugResult) =>
  result.cases.reduce<Record<string, number>>((counts, debugCase) => {
    counts[debugCase.verdict] = (counts[debugCase.verdict] ?? 0) + 1;
    return counts;
  }, {});

const run = async () => {
  const options = parseArgs(process.argv.slice(2));
  const benchmark = await loadBenchmarkModule();
  const result = benchmark.runRoundOneGuardDebugCases();
  const artifacts = benchmark.serializeRoundOneGuardDebugArtifacts(result);
  const hiddenInfoIssues = benchmark.scanRoundOneGuardDebugArtifactsForHiddenInfo(artifacts);
  if (hiddenInfoIssues.length > 0) {
    throw new Error(`round-one guard debug hidden-info scan failed: ${hiddenInfoIssues.join(", ")}`);
  }

  await benchmark.writeRoundOneGuardDebugArtifacts({ outDir: options.outDir, artifacts });

  const hashes = artifactHashes(artifacts);
  console.log(
    [
      "round-one guard debug complete: phase=cFp52",
      `cases=${result.cases.length}`,
      `verdicts=${JSON.stringify(verdictCounts(result))}`,
      `out=${options.outDir}`,
      ...Object.entries(hashes).map(([file, hash]) => `${file}=${hash}`),
    ].join("\n"),
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`round-one guard debug failed: ${message}`);
  process.exitCode = 1;
});
