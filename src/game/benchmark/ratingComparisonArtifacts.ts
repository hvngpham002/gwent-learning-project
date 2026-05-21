import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { BenchmarkRatingOutput } from "./ratings";
import type {
  RatingComparisonManifest,
  RatingComparisonOutput,
  RatingLedger,
  RatingSnapshotInfo,
} from "./ratingComparisons";
import {
  compareRatingOutputs,
  scanComparisonOutputForAbsolutePaths,
  scanComparisonOutputSafety,
} from "./ratingComparisons";

// ─── JSON helpers ────────────────────────────────────────────────────────────

const sortJsonValue = (value: unknown): unknown => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortJsonValue(v)]),
    );
  }
  return null;
};

const stablePrettyJson = (value: unknown): string => `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;

// ─── Hash helpers ────────────────────────────────────────────────────────────

const computeHash = (content: string): string =>
  createHash("sha256").update(content, "utf8").digest("hex");

// ─── Path helpers ────────────────────────────────────────────────────────────

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

// ─── Snapshot artifact serialization ─────────────────────────────────────────

export interface SnapshotArtifactBundle {
  manifestJson: string;
  ratingsJson: string;
  reportMarkdown: string;
}

export function buildSnapshotBundle(
  info: RatingSnapshotInfo,
): SnapshotArtifactBundle {
  const manifest = {
    schemaVersion: "rating-snapshot-manifest-v1",
    suiteId: info.suiteId,
    snapshotId: info.snapshotId,
    sourceRecordsPath: info.sourceRecordsPath,
    sourceRecordCount: info.sourceRecordCount,
    eligibleRecordCount: info.eligibleRecordCount,
    ignoredRecordCount: info.ignoredRecordCount,
    ratingsJsonHash: info.ratingsJsonHash,
    reportMdHash: info.reportMdHash,
    createdByPhase: info.createdByPhase,
    notes: info.notes,
  };

  return {
    manifestJson: stablePrettyJson(manifest),
    ratingsJson: info.ratingsJson,
    reportMarkdown: info.reportMarkdown,
  };
}

export async function writeSnapshotBundle(
  suiteId: string,
  snapshotId: string,
  bundle: SnapshotArtifactBundle,
): Promise<void> {
  const outDir = resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings",
    "snapshots",
    snapshotId
  );
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), bundle.manifestJson, "utf8"),
    writeFile(resolve(outDir, "ratings.json"), bundle.ratingsJson, "utf8"),
    writeFile(resolve(outDir, "report.md"), bundle.reportMarkdown, "utf8"),
  ]);
}

// ─── Ledger serialization ────────────────────────────────────────────────────

export async function writeLedger(
  suiteId: string,
  ledger: RatingLedger,
): Promise<void> {
  const outDir = resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings"
  );
  await mkdir(outDir, { recursive: true });
  await writeFile(
    resolve(outDir, "ledger.json"),
    stablePrettyJson(ledger),
    "utf8"
  );
}

// ─── Comparison artifact serialization ───────────────────────────────────────

export interface ComparisonArtifactBundle {
  manifestJson: string;
  comparisonJson: string;
  reportMarkdown: string;
}

export function buildComparisonBundle(
  comparison: RatingComparisonOutput,
  createdByPhase: string,
): ComparisonArtifactBundle {
  const comparisonJson = stablePrettyJson(comparison);
  const comparisonJsonHash = computeHash(comparisonJson);

  const commonCount = comparison.entries.filter((e) => e.status === "common").length;
  const newCount = comparison.entries.filter((e) => e.status === "new").length;
  const removedCount = comparison.entries.filter((e) => e.status === "removed").length;

  const manifest: RatingComparisonManifest = {
    schemaVersion: "rating-comparison-manifest-v1",
    suiteId: comparison.suiteId,
    baseSnapshotId: comparison.baseSnapshotId,
    candidateSnapshotId: comparison.candidateSnapshotId,
    entryCount: comparison.entries.length,
    commonCount,
    newCount,
    removedCount,
    comparisonJsonHash,
    createdByPhase,
  };

  const reportMarkdown = buildComparisonReport(comparison);

  return {
    manifestJson: stablePrettyJson(manifest),
    comparisonJson,
    reportMarkdown,
  };
}

function buildComparisonReport(comparison: RatingComparisonOutput): string {
  const lines: string[] = [];

  lines.push("# Rating Comparison Report");
  lines.push("");
  lines.push("## Source");
  lines.push("");
  lines.push(`- suite id: ${comparison.suiteId}`);
  lines.push(`- base snapshot: ${comparison.baseSnapshotId}`);
  lines.push(`- candidate snapshot: ${comparison.candidateSnapshotId}`);
  lines.push("");

  const commonEntries = comparison.entries.filter((e) => e.status === "common");
  const newEntries = comparison.entries.filter((e) => e.status === "new");
  const removedEntries = comparison.entries.filter((e) => e.status === "removed");

  lines.push(`- total entries: ${comparison.entries.length}`);
  lines.push(`- common: ${commonEntries.length}`);
  lines.push(`- new (candidate only): ${newEntries.length}`);
  lines.push(`- removed (baseline only): ${removedEntries.length}`);

  // Summary by signal
  const signalCounts: Record<string, number> = {};
  for (const entry of comparison.entries) {
    signalCounts[entry.signal] = (signalCounts[entry.signal] ?? 0) + 1;
  }

  lines.push("");
  lines.push("## Signal Summary");
  lines.push("");
  for (const [signal, count] of Object.entries(signalCounts).sort()) {
    lines.push(`- ${signal}: ${count}`);
  }

  // Detailed entries
  if (commonEntries.length > 0) {
    lines.push("");
    lines.push("## Common Entries");
    lines.push("");
    lines.push("| Key | Label | Delta Rating | Delta RD | Delta Conservative | Delta Games | Signal |");
    lines.push("|-----|-------|-------------|----------|-------------------|-------------|--------|");
    for (const entry of commonEntries) {
      lines.push(
        `| ${entry.key} | ${entry.label} | ${entry.deltaRating.toFixed(2)} | ${entry.deltaRd.toFixed(2)} | ${entry.deltaConservativeRating.toFixed(2)} | ${entry.deltaGames} | ${entry.signal} |`
      );
    }
  }

  if (newEntries.length > 0) {
    lines.push("");
    lines.push("## New Entries (candidate only)");
    lines.push("");
    for (const entry of newEntries) {
      lines.push(
        `- **${entry.label}** (${entry.key}): candidate rating=${entry.candidateRating?.toFixed(2)} RD=${entry.candidateRd?.toFixed(2)}`
      );
    }
  }

  if (removedEntries.length > 0) {
    lines.push("");
    lines.push("## Removed Entries (baseline only)");
    lines.push("");
    for (const entry of removedEntries) {
      lines.push(
        `- **${entry.label}** (${entry.key}): baseline rating=${entry.baseRating?.toFixed(2)} RD=${entry.baseRd?.toFixed(2)}`
      );
    }
  }

  // Interpretation warnings
  lines.push("");
  lines.push("## Interpretation Warnings");
  lines.push("");
  lines.push("- **`directional_*` signals are heuristic comparison labels, not statistical proof of exploitability or product difficulty.**");
  lines.push("- **Ratings are research-local and not product difficulty.** They measure relative policy strength within a fixed benchmark context.");
  lines.push("- **Do not compare ratings across different suite pools** unless the report marks that comparison as valid.");
  lines.push("- **High combined RD means uncertain.** A large combined RD indicates the delta estimate is based on limited evidence.");

  return lines.join("\n") + "\n";
}

export async function writeComparisonBundle(
  suiteId: string,
  comparisonDirName: string,
  bundle: ComparisonArtifactBundle,
): Promise<void> {
  const outDir = resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings",
    "comparisons",
    comparisonDirName
  );
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), bundle.manifestJson, "utf8"),
    writeFile(resolve(outDir, "comparison.json"), bundle.comparisonJson, "utf8"),
    writeFile(resolve(outDir, "report.md"), bundle.reportMarkdown, "utf8"),
  ]);
}

// ─── Full pipeline: snapshot + ledger + comparison ──────────────────────────

export interface ComparisonPipelineOptions {
  baseSnapshotId: string;
  candidateSnapshotId: string;
  createdByPhase: string;
  baseRatingsJson: string;
  candidateRatingsJson: string;
}

export async function runComparisonPipeline(
  opts: ComparisonPipelineOptions,
): Promise<{
  comparison: RatingComparisonOutput;
  bundle: ComparisonArtifactBundle;
}> {
  const baseOutput = JSON.parse(opts.baseRatingsJson) as BenchmarkRatingOutput;
  const candidateOutput = JSON.parse(opts.candidateRatingsJson) as BenchmarkRatingOutput;
  const comparison = compareRatingOutputs(
    baseOutput,
    candidateOutput,
    opts.baseSnapshotId,
    opts.candidateSnapshotId,
  );

  // Safety checks
  const safetyIssues = scanComparisonOutputSafety(comparison);
  if (safetyIssues.length > 0) {
    throw new Error(`Comparison output contains hidden-info hazards: ${safetyIssues.join(", ")}`);
  }

  const pathIssues = scanComparisonOutputForAbsolutePaths(comparison);
  if (pathIssues.length > 0) {
    throw new Error(`Comparison output contains absolute paths: ${pathIssues.join(", ")}`);
  }

  const bundle = buildComparisonBundle(comparison, opts.createdByPhase);

  return { comparison, bundle };
}

// ─── Snapshot info from existing artifacts ───────────────────────────────────

export async function readSnapshotInfo(
  suiteId: string,
  snapshotDir: string,
  phaseLabel: string,
): Promise<RatingSnapshotInfo> {
  const ratingsSubdir = snapshotDir === "latest" ? "latest" : `snapshots/${snapshotDir}`;
  const ratingsPath = resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings",
    ratingsSubdir,
    "ratings.json"
  );
  const manifestPath = resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings",
    ratingsSubdir,
    "manifest.json"
  );
  const reportPath = resolve(
    rootDir,
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "ratings",
    ratingsSubdir,
    "report.md"
  );

  const ratingsJson = await readFile(ratingsPath, "utf8");
  const reportMarkdown = await readFile(reportPath, "utf8");
  const manifestContent = await readFile(manifestPath, "utf8");
  const manifest = JSON.parse(manifestContent) as {
    sourceRecordsPath: string;
    sourceRecordCount: number;
    eligibleRecordCount: number;
    ignoredRecordCount: number;
  };

  return {
    suiteId,
    snapshotId: snapshotDir,
    ratingsJson,
    reportMarkdown,
    ratingsJsonHash: computeHash(ratingsJson),
    reportMdHash: computeHash(reportMarkdown),
    sourceRecordsPath: manifest.sourceRecordsPath,
    sourceRecordCount: manifest.sourceRecordCount,
    eligibleRecordCount: manifest.eligibleRecordCount,
    ignoredRecordCount: manifest.ignoredRecordCount,
    createdByPhase: phaseLabel,
    notes: snapshotDir === "latest"
      ? `Current latest rating artifact for suite ${suiteId}.`
      : `Frozen ${snapshotDir} rating snapshot for suite ${suiteId}.`,
  };
}
