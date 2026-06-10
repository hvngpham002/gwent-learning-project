import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  buildDeterminizedPimcPostOnePlyBranchingBudgetCasebook,
  defaultDeterminizedPimcPostOnePlyBranchingBudgetCasebookRunId,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary,
} from "../src/game/benchmark/determinizedPimcPostOnePlyBranchingBudgetCasebook.ts";
import {
  determinizedPimcPostOnePlyBranchingBudgetCasebookArtifactHashes,
  scanDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactsForHiddenInfo,
  serializeDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts,
  writeDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts,
} from "../src/game/benchmark/determinizedPimcPostOnePlyBranchingBudgetCasebookArtifacts.ts";

interface CliOptions {
  suiteId: string;
  outDir: string;
  runId: string;
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
    "determinized-pimc-post-one-ply-branching-budget-casebook/cFp73",
  );

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
  let allowNotReady = false;

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
    } else if (arg === "--allow-not-ready") {
      allowNotReady = true;
    } else {
      throw new CliUsageError(`Unknown option: ${arg}.`);
    }
  }

  if (!suiteId) {
    throw new CliUsageError("--suite cannot be empty.");
  }
  if (!KNOWN_SUITE_IDS.has(suiteId)) {
    throw new CliUsageError(`Unknown suite id: ${suiteId}.`);
  }

  return {
    suiteId,
    outDir: outDir ?? defaultOutputDir(suiteId),
    runId:
      runId ??
      defaultDeterminizedPimcPostOnePlyBranchingBudgetCasebookRunId(suiteId),
    allowNotReady,
  };
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

const cFp72ArtifactReferencesForSuite = async (suiteId: string) => {
  const paths = [
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/manifest.json",
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json",
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/branching-roots.jsonl",
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/skipped-roots.jsonl",
    "determinized-pimc-post-one-ply-branching-budget-v0/cFp72/report.md",
  ];
  return Promise.all(
    paths.map(async (path) => {
      const absolutePath = artifactPath(suiteId, path);
      return {
        label: toRelativePath(absolutePath),
        relativePath: toRelativePath(absolutePath),
        sha256: sha256Text(await readText(absolutePath)),
      };
    }),
  );
};

const readSourceArtifacts = async (suiteId: string) => {
  const sourceDir = "determinized-pimc-post-one-ply-branching-budget-v0/cFp72";
  const summary = await readJson<DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary>(
    artifactPath(suiteId, sourceDir, "summary.json"),
  );
  const branchingRoots =
    await readJsonl<DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot>(
      artifactPath(suiteId, sourceDir, "branching-roots.jsonl"),
    );
  const skippedRoots =
    await readJsonl<DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot>(
      artifactPath(suiteId, sourceDir, "skipped-roots.jsonl"),
    );
  const sourceCfp72ArtifactReferences =
    await cFp72ArtifactReferencesForSuite(suiteId);

  return {
    summary,
    branchingRoots,
    skippedRoots,
    sourceCfp72ArtifactReferences,
  };
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const sourceArtifacts = await readSourceArtifacts(options.suiteId);
  const result = buildDeterminizedPimcPostOnePlyBranchingBudgetCasebook({
    casebookRunId: options.runId,
    suiteId: options.suiteId,
    sourceCfp72Summary: sourceArtifacts.summary,
    sourceCfp72BranchingRoots: sourceArtifacts.branchingRoots,
    sourceCfp72SkippedRoots: sourceArtifacts.skippedRoots,
    sourceCfp72ArtifactReferences: sourceArtifacts.sourceCfp72ArtifactReferences,
  });
  const artifacts =
    serializeDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts(result);
  const hazards =
    scanDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactsForHiddenInfo(
      artifacts,
    );
  if (hazards.length > 0) {
    throw new Error(
      `cFp73 artifact hidden-info scan failed: ${hazards.join(", ")}`,
    );
  }

  await writeDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts({
    outDir: options.outDir,
    artifacts,
  });

  const hashes =
    determinizedPimcPostOnePlyBranchingBudgetCasebookArtifactHashes(artifacts);
  console.log(`wrote ${toRelativePath(options.outDir)}`);
  console.log(`readiness ${result.summary.casebookReadinessStatus}`);
  console.log(`casebook roots ${result.summary.casebookRootCount}`);
  console.log(`skipped roots ${result.summary.skippedRootCount}`);
  console.log(JSON.stringify(hashes, null, 2));

  if (
    result.summary.casebookReadinessStatus !== "casebook_ready" &&
    !options.allowNotReady
  ) {
    process.exitCode = 1;
  }
};

main().catch((error: unknown) => {
  if (error instanceof CliUsageError) {
    console.error(error.message);
  } else if (error instanceof Error) {
    console.error(error.stack ?? error.message);
  } else {
    console.error(String(error));
  }
  process.exitCode = 1;
});
