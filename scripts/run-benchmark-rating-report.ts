import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import type { BenchmarkMatchRecord } from "../src/game/benchmark/types";
import { computeRatings } from "../src/game/benchmark/ratings";
import { buildRatingArtifactBundle } from "../src/game/benchmark/ratingArtifacts";

interface CliOptions {
  suiteId: string;
  outDir: string;
  sourceRecordsPath: string;
}

class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const defaultOutputDir = (suiteId: string) =>
  resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings",
    "latest"
  );

const defaultRecordsPath = (suiteId: string) =>
  resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "latest",
    "records.jsonl"
  );

const readOptionValue = (args: readonly string[], index: number, flag: string) => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new CliUsageError(`${flag} requires a value.`);
  }
  return value;
};

const toRepoRelativePath = (absolutePath: string): string => {
  try {
    const relativePath = relative(rootDir, absolutePath);
    // If relative path starts with ".." or is absolute, it's outside repo root
    if (relativePath.startsWith("..") || resolve(relativePath).startsWith(rootDir.replace(/\\/g, "/"))) {
      // Check more carefully: if the resolved relative path doesn't start with rootDir
      const resolvedRelative = resolve(rootDir, relativePath);
      if (!resolvedRelative.startsWith(rootDir)) {
        throw new CliUsageError(
          `--records path resolves outside the repository root. Path must be inside the project: ${relativePath}`
        );
      }
    }
    // Normalize to forward slashes for cross-platform determinism
    return relativePath.replace(/\\/g, "/");
  } catch {
    throw new CliUsageError(
      `--records path resolves outside the repository root and cannot produce a portable path.`
    );
  }
};

const parseArgs = (args: readonly string[]): CliOptions => {
  let suiteId = "";
  let outDir: string | undefined;
  let recordsPath: string | undefined;

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
    } else if (arg === "--records") {
      recordsPath = resolve(rootDir, readOptionValue(args, index, arg));
      index += 1;
    } else if (arg.startsWith("--records=")) {
      recordsPath = resolve(rootDir, arg.slice("--records=".length));
    } else {
      throw new CliUsageError(`Unknown option: ${arg}.`);
    }
  }

  if (!suiteId) {
    throw new CliUsageError("--suite cannot be empty.");
  }

  const resolvedOutDir = outDir ?? defaultOutputDir(suiteId);
  const resolvedRecordsPath = recordsPath ?? defaultRecordsPath(suiteId);

  // Convert to repo-relative portable path
  const sourceRecordsPath = toRepoRelativePath(resolvedRecordsPath);

  return { suiteId, outDir: resolvedOutDir, sourceRecordsPath };
};

const readRecords = async (path: string): Promise<BenchmarkMatchRecord[]> => {
  const content = await readFile(path, "utf8");
  const lines = content.trim().split("\n").filter((line) => line.length > 0);
  const records: BenchmarkMatchRecord[] = [];
  for (const line of lines) {
    records.push(JSON.parse(line) as BenchmarkMatchRecord);
  }
  return records;
};

const writeRatingFiles = async (outDir: string, bundle: ReturnType<typeof buildRatingArtifactBundle>) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), bundle.manifestJson, "utf8"),
    writeFile(resolve(outDir, "ratings.json"), bundle.ratingsJson, "utf8"),
    writeFile(resolve(outDir, "report.md"), bundle.reportMarkdown, "utf8"),
  ]);
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));

  console.log(`reading records: ${options.sourceRecordsPath}`);
  // Resolve the actual file path from repo-relative path for reading
  const actualRecordsPath = resolve(rootDir, options.sourceRecordsPath.replace(/\//g, "\\") as string);
  const records = await readRecords(actualRecordsPath);
  console.log(`loaded ${records.length} records for suite ${options.suiteId}`);

  const output = computeRatings(records, options.suiteId, options.sourceRecordsPath);
  const bundle = buildRatingArtifactBundle(output);

  await writeRatingFiles(options.outDir, bundle);
  console.log(
    `rating report complete: suite=${options.suiteId} records=${output.summary.eligibleRecords} ignored=${output.summary.ignoredRecords} out=${options.outDir}`
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`rating report failed: ${message}`);
  process.exitCode = 1;
});
