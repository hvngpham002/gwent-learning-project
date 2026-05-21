import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import type {
  RatingLedger,
  RatingLedgerSnapshot,
} from "../src/game/benchmark/ratingComparisons";
import {
  readSnapshotInfo,
  runComparisonPipeline,
  writeComparisonBundle,
  writeLedger,
} from "../src/game/benchmark/ratingComparisonArtifacts";

interface CliOptions {
  suiteId: string;
  baseSnapshot: string;
  candidateSnapshot: string;
  comparisonDir: string;
  createdByPhase: string;
}

class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const defaultBaseSnapshot = "cFp46";
const defaultCandidateSnapshot = "latest";
const defaultComparisonDir = "cFp46-vs-latest";
const defaultCreatedByPhase = "cFp47";

const readOptionValue = (args: readonly string[], index: number, flag: string) => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new CliUsageError(`${flag} requires a value.`);
  }
  return value;
};

const parseArgs = (args: readonly string[]): CliOptions => {
  let suiteId = "";
  let baseSnapshot = defaultBaseSnapshot;
  let candidateSnapshot = defaultCandidateSnapshot;
  let comparisonDir = defaultComparisonDir;
  let createdByPhase = defaultCreatedByPhase;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--suite") {
      suiteId = readOptionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("--suite=")) {
      suiteId = arg.slice("--suite=".length);
    } else if (arg === "--base-snapshot") {
      baseSnapshot = readOptionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("--base-snapshot=")) {
      baseSnapshot = arg.slice("--base-snapshot=".length);
    } else if (arg === "--candidate-snapshot") {
      candidateSnapshot = readOptionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("--candidate-snapshot=")) {
      candidateSnapshot = arg.slice("--candidate-snapshot=".length);
    } else if (arg === "--comparison-dir") {
      comparisonDir = readOptionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("--comparison-dir=")) {
      comparisonDir = arg.slice("--comparison-dir=".length);
    } else if (arg === "--phase") {
      createdByPhase = readOptionValue(args, index, arg);
      index += 1;
    } else if (arg.startsWith("--phase=")) {
      createdByPhase = arg.slice("--phase=".length);
    } else {
      throw new CliUsageError(`Unknown option: ${arg}.`);
    }
  }

  if (!suiteId) {
    throw new CliUsageError("--suite cannot be empty.");
  }

  return { suiteId, baseSnapshot, candidateSnapshot, comparisonDir, createdByPhase };
};

const readJsonFile = async (path: string): Promise<string> => {
  const content = await readFile(path, "utf8");
  return content;
};

const loadExistingSnapshots = async (
  suiteId: string
): Promise<RatingLedgerSnapshot[]> => {
  const ledgerPath = resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings",
    "ledger.json"
  );

  try {
    const content = await readJsonFile(ledgerPath);
    const ledger = JSON.parse(content) as RatingLedger;
    return ledger.snapshots ?? [];
  } catch {
    return [];
  }
};

const run = async () => {
  const options = parseArgs(process.argv.slice(2));

  console.log(`cFp47 comparison: suite=${options.suiteId} base=${options.baseSnapshot} candidate=${options.candidateSnapshot}`);

  // Step 1: Read base snapshot info
  const baseSnapshotInfo = await readSnapshotInfo(
    options.suiteId,
    options.baseSnapshot,
    options.createdByPhase
  );
  console.log(`  base snapshot loaded: ${options.baseSnapshot} (${baseSnapshotInfo.eligibleRecordCount} records)`);

  // Step 2: Read candidate snapshot info (latest)
  const candidateSnapshotInfo = await readSnapshotInfo(
    options.suiteId,
    options.candidateSnapshot,
    options.createdByPhase
  );
  console.log(`  candidate snapshot loaded: ${options.candidateSnapshot} (${candidateSnapshotInfo.eligibleRecordCount} records)`);

  // Step 3: Load existing ledger snapshots
  const existingSnapshots = await loadExistingSnapshots(options.suiteId);

  // Step 4: Build/update ledger with both snapshots
  const ledgerSnapshots: RatingLedgerSnapshot[] = [];
  const seenIds = new Set<string>();

  for (const snap of existingSnapshots) {
    if (!seenIds.has(snap.snapshotId)) {
      ledgerSnapshots.push(snap);
      seenIds.add(snap.snapshotId);
    }
  }

  // Add base snapshot to ledger
  if (!seenIds.has(baseSnapshotInfo.snapshotId)) {
    ledgerSnapshots.push({
      snapshotId: baseSnapshotInfo.snapshotId,
      label: `${baseSnapshotInfo.snapshotId} snapshot`,
      sourceRecordsPath: baseSnapshotInfo.sourceRecordsPath,
      sourceRecordCount: baseSnapshotInfo.sourceRecordCount,
      eligibleRecordCount: baseSnapshotInfo.eligibleRecordCount,
      ignoredRecordCount: baseSnapshotInfo.ignoredRecordCount,
      ratingsJsonHash: baseSnapshotInfo.ratingsJsonHash,
      reportMdHash: baseSnapshotInfo.reportMdHash,
      createdByPhase: baseSnapshotInfo.createdByPhase,
      notes: baseSnapshotInfo.notes,
    });
    seenIds.add(baseSnapshotInfo.snapshotId);
  }

  // Add candidate snapshot to ledger (only if different from base)
  if (options.candidateSnapshot !== options.baseSnapshot && !seenIds.has(candidateSnapshotInfo.snapshotId)) {
    ledgerSnapshots.push({
      snapshotId: candidateSnapshotInfo.snapshotId,
      label: `${candidateSnapshotInfo.snapshotId} snapshot`,
      sourceRecordsPath: candidateSnapshotInfo.sourceRecordsPath,
      sourceRecordCount: candidateSnapshotInfo.sourceRecordCount,
      eligibleRecordCount: candidateSnapshotInfo.eligibleRecordCount,
      ignoredRecordCount: candidateSnapshotInfo.ignoredRecordCount,
      ratingsJsonHash: candidateSnapshotInfo.ratingsJsonHash,
      reportMdHash: candidateSnapshotInfo.reportMdHash,
      createdByPhase: candidateSnapshotInfo.createdByPhase,
      notes: candidateSnapshotInfo.notes,
    });
    seenIds.add(candidateSnapshotInfo.snapshotId);
  }

  // Write ledger
  const ledger: RatingLedger = {
    schemaVersion: "rating-ledger-v1",
    suiteId: options.suiteId,
    snapshots: ledgerSnapshots,
  };

  await writeLedger(options.suiteId, ledger);
  console.log(`  ledger written: ${ledgerSnapshots.length} snapshots`);

  // Step 5: Run comparison pipeline
  const { bundle } = await runComparisonPipeline({
    suiteId: options.suiteId,
    baseSnapshotId: baseSnapshotInfo.snapshotId,
    candidateSnapshotId: candidateSnapshotInfo.snapshotId,
    comparisonDirName: options.comparisonDir,
    createdByPhase: options.createdByPhase,
    baseRatingsJson: baseSnapshotInfo.ratingsJson,
    candidateRatingsJson: candidateSnapshotInfo.ratingsJson,
    candidateOutput: null as never,
    existingSnapshots: ledgerSnapshots,
  });

  // Step 6: Write comparison artifacts
  await writeComparisonBundle(
    options.suiteId,
    options.comparisonDir,
    bundle
  );
  console.log(`  comparison artifacts written: ${options.comparisonDir}`);

  // Summary
  const manifest = JSON.parse(bundle.manifestJson);
  console.log(
    `comparison complete: ${manifest.commonCount} common, ${manifest.newCount} new, ${manifest.removedCount} removed entries`
  );
};

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`cFp47 comparison failed: ${message}`);
  process.exitCode = 1;
});
