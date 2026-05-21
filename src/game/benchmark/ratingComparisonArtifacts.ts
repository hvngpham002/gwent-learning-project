import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { BenchmarkRatingOutput } from "./ratings";
import type {
  RatingComparisonManifest,
  RatingComparisonOutput,
  RatingComparisonEntry,
  RatingLedger,
  RatingLedgerSnapshot,
  RatingSnapshotInfo,
} from "./ratingComparisons";
import {
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
    reportMarkdown: "",
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
  suiteId: string;
  baseSnapshotId: string;
  candidateSnapshotId: string;
  comparisonDirName: string;
  createdByPhase: string;
  baseRatingsJson: string;
  candidateRatingsJson: string;
  candidateOutput: BenchmarkRatingOutput;
  existingSnapshots: RatingLedgerSnapshot[];
}

export async function runComparisonPipeline(
  opts: ComparisonPipelineOptions,
): Promise<{
  comparison: RatingComparisonOutput;
  bundle: ComparisonArtifactBundle;
}> {
  type ParsedScope = { scope: string; entries: Array<{ key: string; label: string; rating: number; rd: number; conservativeRating: number; games: number }> };
  type ParsedOutput = { scopes: ParsedScope[]; suiteId: string };

  // Parse base and candidate outputs from JSON strings
  const baseParsed = JSON.parse(opts.baseRatingsJson) as ParsedOutput;
  const candidateParsed = JSON.parse(opts.candidateRatingsJson) as ParsedOutput;

  // Build comparison entries from the parsed scopes
  const baseMap = new Map<string, {
    scope: string;
    key: string;
    label: string;
    rating: number;
    rd: number;
    conservativeRating: number;
    games: number;
  }>();

  for (const scope of baseParsed.scopes) {
    for (const entry of scope.entries) {
      baseMap.set(entry.key, { scope: scope.scope, ...entry });
    }
  }

  const candidateMap = new Map<string, {
    scope: string;
    key: string;
    label: string;
    rating: number;
    rd: number;
    conservativeRating: number;
    games: number;
  }>();

  for (const scope of candidateParsed.scopes) {
    for (const entry of scope.entries) {
      candidateMap.set(entry.key, { scope: scope.scope, ...entry });
    }
  }

  const allKeys = new Set<string>();
  for (const key of baseMap.keys()) allKeys.add(key);
  for (const key of candidateMap.keys()) allKeys.add(key);

  const entries: RatingComparisonEntry[] = [];

  for (const key of allKeys) {
    const base = baseMap.get(key);
    const candidate = candidateMap.get(key);

    let status: "common" | "new" | "removed";
    if (base && candidate) status = "common";
    else if (candidate && !base) status = "new";
    else status = "removed";

    const baseRating = base?.rating ?? 0;
    const candidateRating = candidate?.rating ?? 0;
    const baseRd = base?.rd ?? 0;
    const candidateRd = candidate?.rd ?? 0;
    const baseConservative = base?.conservativeRating ?? 0;
    const candidateConservative = candidate?.conservativeRating ?? 0;
    const baseGames = base?.games ?? 0;
    const candidateGames = candidate?.games ?? 0;

    const deltaRating = Math.round((candidateRating - baseRating) * 100) / 100;
    const deltaRd = Math.round((candidateRd - baseRd) * 100) / 100;
    const deltaConservative = Math.round((candidateConservative - baseConservative) * 100) / 100;
    const deltaGames = candidateGames - baseGames;

    const combinedRd = Math.round(
      Math.sqrt(baseRd * baseRd + candidateRd * candidateRd) * 100
    ) / 100;

    let deltaOverCombinedRd: number | null = null;
    if (status === "common" && combinedRd > 0) {
      deltaOverCombinedRd = Math.round(((candidateRating - baseRating) / combinedRd) * 10000) / 10000;
    }

    const scope = base?.scope ?? candidate!.scope;
    const label = base?.label ?? candidate!.label;

    // Derive signal
    let signal: typeof entries[0]["signal"];
    if (status === "new") signal = "new_entry";
    else if (status === "removed") signal = "removed_entry";
    else if (deltaRating === 0 && deltaRd === 0 && deltaConservative === 0 && deltaGames === 0) signal = "no_change";
    else if (deltaOverCombinedRd !== null && deltaConservative > 0 && deltaOverCombinedRd >= 0.5) signal = "directional_gain";
    else if (deltaOverCombinedRd !== null && deltaConservative < 0 && deltaOverCombinedRd <= -0.5) signal = "directional_regression";
    else signal = "uncertain";

    let note: string;
    if (status === "new") note = "Entry present in candidate only. No baseline to compare against.";
    else if (status === "removed") note = "Entry present in baseline only. No candidate data to compare against.";
    else if (signal === "no_change") note = "No rating or game-count change detected between baseline and candidate.";
    else if (signal === "directional_gain") note = "Heuristic comparison label only: conservative rating increased with sufficient combined RD signal. Not exploitability or product difficulty.";
    else if (signal === "directional_regression") note = "Heuristic comparison label only: conservative rating decreased with sufficient combined RD signal. Not exploitability or product difficulty.";
    else note = "Rating movement detected but combined-RD signal is weak. Interpret cautiously.";

    entries.push({
      scope,
      key,
      label,
      status,
      baseRating: base ? baseRating : null,
      baseRd: base ? baseRd : null,
      baseConservativeRating: base ? baseConservative : null,
      baseGames: base ? baseGames : null,
      candidateRating: candidate ? candidateRating : null,
      candidateRd: candidate ? candidateRd : null,
      candidateConservativeRating: candidate ? candidateConservative : null,
      candidateGames: candidate ? candidateGames : null,
      deltaRating,
      deltaRd,
      deltaConservativeRating: deltaConservative,
      deltaGames,
      combinedRd: status === "common" ? combinedRd : 0,
      deltaOverCombinedRd: deltaOverCombinedRd !== null ? deltaOverCombinedRd : null,
      signal,
      note,
    });
  }

  entries.sort((a, b) => {
    const scopeCmp = a.scope.localeCompare(b.scope);
    if (scopeCmp !== 0) return scopeCmp;
    if (a.status !== b.status) {
      const order = { common: 0, new: 1, removed: 2 };
      return order[a.status] - order[b.status];
    }
    return a.key.localeCompare(b.key);
  });

  const comparison: RatingComparisonOutput = {
    schemaVersion: "rating-comparison-v1",
    suiteId: opts.suiteId,
    baseSnapshotId: opts.baseSnapshotId,
    candidateSnapshotId: opts.candidateSnapshotId,
    entries,
  };

  // Validate suite match
  if (baseParsed.suiteId !== candidateParsed.suiteId) {
    throw new Error(
      `Suite mismatch: cannot compare base suite "${baseParsed.suiteId}" against candidate suite "${candidateParsed.suiteId}".`
    );
  }

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

  const ratingsJson = await readFile(ratingsPath, "utf8");
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
    ratingsJsonHash: computeHash(ratingsJson),
    reportMdHash: "",
    sourceRecordsPath: manifest.sourceRecordsPath,
    sourceRecordCount: manifest.sourceRecordCount,
    eligibleRecordCount: manifest.eligibleRecordCount,
    ignoredRecordCount: manifest.ignoredRecordCount,
    createdByPhase: phaseLabel,
    notes: `Frozen cFp46 rating snapshot for suite ${suiteId}.`,
  };
}
