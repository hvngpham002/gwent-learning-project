import { access, copyFile, mkdir, readFile } from "node:fs/promises";
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

const ratingArtifactPath = (
  suiteId: string,
  snapshotId: string,
  filename: "manifest.json" | "ratings.json" | "report.md",
): string => {
  const subdir = snapshotId === "latest" ? "latest" : `snapshots/${snapshotId}`;
  return resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings",
    subdir,
    filename,
  );
};

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const canAutoCreateSnapshot = (snapshotId: string, createdByPhase: string) =>
  snapshotId === createdByPhase || (snapshotId === "cFp46" && createdByPhase === "cFp47");

const ensureSnapshotExists = async (
  suiteId: string,
  snapshotId: string,
  createdByPhase: string,
): Promise<void> => {
  if (snapshotId === "latest") {
    return;
  }

  const requiredFiles = ["manifest.json", "ratings.json", "report.md"] as const;
  const snapshotFilesExist = await Promise.all(
    requiredFiles.map((filename) => fileExists(ratingArtifactPath(suiteId, snapshotId, filename))),
  );
  if (snapshotFilesExist.every(Boolean)) {
    return;
  }

  if (!canAutoCreateSnapshot(snapshotId, createdByPhase)) {
    throw new CliUsageError(
      `Snapshot "${snapshotId}" does not exist for suite "${suiteId}". Missing snapshots can only be auto-created from latest when snapshot id matches --phase, or for the cFp47 cFp46 baseline compatibility path.`,
    );
  }

  const snapshotDir = resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings",
    "snapshots",
    snapshotId,
  );
  await mkdir(snapshotDir, { recursive: true });
  await Promise.all(
    requiredFiles.map((filename) =>
      copyFile(
        ratingArtifactPath(suiteId, "latest", filename),
        ratingArtifactPath(suiteId, snapshotId, filename),
      )
    ),
  );
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

  console.log(`rating comparison: suite=${options.suiteId} base=${options.baseSnapshot} candidate=${options.candidateSnapshot} phase=${options.createdByPhase}`);

  await ensureSnapshotExists(options.suiteId, options.baseSnapshot, options.createdByPhase);
  await ensureSnapshotExists(options.suiteId, options.candidateSnapshot, options.createdByPhase);

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
  const ledgerSnapshotsById = new Map<string, RatingLedgerSnapshot>();

  for (const snap of existingSnapshots) {
    ledgerSnapshotsById.set(snap.snapshotId, snap);
  }

  const upsertSnapshot = (snapshot: typeof baseSnapshotInfo) => {
    ledgerSnapshotsById.set(snapshot.snapshotId, {
      snapshotId: snapshot.snapshotId,
      label: `${snapshot.snapshotId} snapshot`,
      sourceRecordsPath: snapshot.sourceRecordsPath,
      sourceRecordCount: snapshot.sourceRecordCount,
      eligibleRecordCount: snapshot.eligibleRecordCount,
      ignoredRecordCount: snapshot.ignoredRecordCount,
      ratingsJsonHash: snapshot.ratingsJsonHash,
      reportMdHash: snapshot.reportMdHash,
      createdByPhase: snapshot.createdByPhase,
      notes: snapshot.notes,
    });
  };

  upsertSnapshot(baseSnapshotInfo);
  if (options.candidateSnapshot !== options.baseSnapshot) {
    upsertSnapshot(candidateSnapshotInfo);
  }

  const ledgerSnapshots: RatingLedgerSnapshot[] = [...ledgerSnapshotsById.values()].sort((a, b) =>
    a.snapshotId.localeCompare(b.snapshotId)
  );

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
    baseSnapshotId: baseSnapshotInfo.snapshotId,
    candidateSnapshotId: candidateSnapshotInfo.snapshotId,
    createdByPhase: options.createdByPhase,
    baseRatingsJson: baseSnapshotInfo.ratingsJson,
    candidateRatingsJson: candidateSnapshotInfo.ratingsJson,
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
  console.error(`rating comparison failed: ${message}`);
  process.exitCode = 1;
});
