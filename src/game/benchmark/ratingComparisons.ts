

import type {
  BenchmarkRatingEntry,
  BenchmarkRatingOutput,
} from "./ratings";

// ─── Public types ────────────────────────────────────────────────────────────

export type ComparisonSignal =
  | "no_change"
  | "directional_gain"
  | "directional_regression"
  | "uncertain"
  | "new_entry"
  | "removed_entry";

export type ComparisonEntryStatus = "common" | "new" | "removed";

export interface RatingComparisonEntry {
  scope: string;
  key: string;
  label: string;
  status: ComparisonEntryStatus;
  baseRating: number | null;
  baseRd: number | null;
  baseConservativeRating: number | null;
  baseGames: number | null;
  candidateRating: number | null;
  candidateRd: number | null;
  candidateConservativeRating: number | null;
  candidateGames: number | null;
  deltaRating: number;
  deltaRd: number;
  deltaConservativeRating: number;
  deltaGames: number;
  combinedRd: number;
  deltaOverCombinedRd: number | null;
  signal: ComparisonSignal;
  note: string;
}

export interface RatingComparisonOutput {
  schemaVersion: "rating-comparison-v1";
  suiteId: string;
  baseSnapshotId: string;
  candidateSnapshotId: string;
  entries: RatingComparisonEntry[];
}

export interface RatingComparisonManifest {
  schemaVersion: "rating-comparison-manifest-v1";
  suiteId: string;
  baseSnapshotId: string;
  candidateSnapshotId: string;
  entryCount: number;
  commonCount: number;
  newCount: number;
  removedCount: number;
  comparisonJsonHash: string;
  createdByPhase: string;
}

export interface RatingSnapshotInfo {
  suiteId: string;
  snapshotId: string;
  ratingsJson: string;
  ratingsJsonHash: string;
  reportMdHash: string;
  sourceRecordsPath: string;
  sourceRecordCount: number;
  eligibleRecordCount: number;
  ignoredRecordCount: number;
  createdByPhase: string;
  notes: string;
}

export interface RatingLedgerSnapshot {
  snapshotId: string;
  label: string;
  sourceRecordsPath: string;
  sourceRecordCount: number;
  eligibleRecordCount: number;
  ignoredRecordCount: number;
  ratingsJsonHash: string;
  reportMdHash: string;
  createdByPhase: string;
  notes: string;
}

export interface RatingLedger {
  schemaVersion: "rating-ledger-v1";
  suiteId: string;
  snapshots: RatingLedgerSnapshot[];
}

// ─── Hidden-info safety ──────────────────────────────────────────────────────

const HIDDEN_INFO_HAZARDS = [
  "cardsById",
  "finalState",
  "commandLog",
  "eventLog",
  "ownHand",
  "opponentHand",
  "seat_a:",
  "seat_b:",
  "unsafeDebugResults",
  "C:\\",
  "/Users/",
];

function scanComparisonSafety(value: string): string[] {
  return HIDDEN_INFO_HAZARDS.filter((hazard) => value.includes(hazard));
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function buildEntryMap(output: BenchmarkRatingOutput): Map<string, BenchmarkRatingEntry> {
  const map = new Map<string, BenchmarkRatingEntry>();
  for (const scopeResult of output.scopes) {
    for (const entry of scopeResult.entries) {
      map.set(entry.key, entry);
    }
  }
  return map;
}

function computeCombinedRd(baseRd: number, candidateRd: number): number {
  return Math.sqrt(baseRd * baseRd + candidateRd * candidateRd);
}

function deriveSignal(
  status: ComparisonEntryStatus,
  deltaRating: number,
  deltaRd: number,
  deltaConservativeRating: number,
  deltaGames: number,
  deltaOverCombinedRd: number | null,
): ComparisonSignal {
  if (status === "new") {
    return "new_entry";
  }
  if (status === "removed") {
    return "removed_entry";
  }
  // common entry
  if (
    deltaRating === 0 &&
    deltaRd === 0 &&
    deltaConservativeRating === 0 &&
    deltaGames === 0
  ) {
    return "no_change";
  }
  if (
    deltaOverCombinedRd !== null &&
    deltaConservativeRating > 0 &&
    deltaOverCombinedRd >= 0.5
  ) {
    return "directional_gain";
  }
  if (
    deltaOverCombinedRd !== null &&
    deltaConservativeRating < 0 &&
    deltaOverCombinedRd <= -0.5
  ) {
    return "directional_regression";
  }
  return "uncertain";
}

function deriveNote(
  signal: ComparisonSignal,
  status: ComparisonEntryStatus,
): string {
  if (status === "new") {
    return "Entry present in candidate only. No baseline to compare against.";
  }
  if (status === "removed") {
    return "Entry present in baseline only. No candidate data to compare against.";
  }
  if (signal === "no_change") {
    return "No rating or game-count change detected between baseline and candidate.";
  }
  if (signal === "directional_gain") {
    return "Heuristic comparison label only: conservative rating increased with sufficient combined RD signal. Not exploitability or product difficulty.";
  }
  if (signal === "directional_regression") {
    return "Heuristic comparison label only: conservative rating decreased with sufficient combined RD signal. Not exploitability or product difficulty.";
  }
  return "Rating movement detected but combined-RD signal is weak. Interpret cautiously.";
}

// ─── Suite validation ────────────────────────────────────────────────────────

export function validateSuiteMatch(
  baseSuiteId: string,
  candidateSuiteId: string,
): void {
  if (baseSuiteId !== candidateSuiteId) {
    throw new Error(
      `Suite mismatch: cannot compare base suite "${baseSuiteId}" against candidate suite "${candidateSuiteId}". Comparisons are only valid within the same suite.`
    );
  }
}

// ─── Comparison entry building ───────────────────────────────────────────────

function buildComparisonEntries(
  baseEntries: Map<string, BenchmarkRatingEntry>,
  candidateEntries: Map<string, BenchmarkRatingEntry>,
): RatingComparisonEntry[] {
  const allKeys = new Set<string>();
  for (const key of baseEntries.keys()) allKeys.add(key);
  for (const key of candidateEntries.keys()) allKeys.add(key);

  const entries: RatingComparisonEntry[] = [];

  for (const key of allKeys) {
    const base = baseEntries.get(key);
    const candidate = candidateEntries.get(key);

    let status: ComparisonEntryStatus;
    if (base && candidate) {
      status = "common";
    } else if (candidate && !base) {
      status = "new";
    } else {
      status = "removed";
    }

    const baseRating = base?.rating ?? 0;
    const candidateRating = candidate?.rating ?? 0;
    const baseRd = base?.rd ?? 0;
    const candidateRd = candidate?.rd ?? 0;
    const baseConservative = base?.conservativeRating ?? 0;
    const candidateConservative = candidate?.conservativeRating ?? 0;
    const baseGames = base?.games ?? 0;
    const candidateGames = candidate?.games ?? 0;

    const deltaRating = round2(candidateRating - baseRating);
    const deltaRd = round2(candidateRd - baseRd);
    const deltaConservative = round2(candidateConservative - baseConservative);
    const deltaGames = candidateGames - baseGames;

    const combinedRd = status === "common"
      ? computeCombinedRd(baseRd, candidateRd)
      : baseRd + candidateRd;

    let deltaOverCombinedRd: number | null = null;
    if (status === "common" && combinedRd > 0) {
      deltaOverCombinedRd = round4(deltaRating / combinedRd);
    }

    const scope = base?.scope ?? candidate!.scope;
    const label = base?.label ?? candidate!.label;

    const signal = deriveSignal(
      status,
      deltaRating,
      deltaRd,
      deltaConservative,
      deltaGames,
      deltaOverCombinedRd,
    );

    const note = deriveNote(signal, status);

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
      combinedRd: status === "common" ? round2(combinedRd) : 0,
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

  return entries;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

// ─── Public entry point ──────────────────────────────────────────────────────

export function compareRatingOutputs(
  baseOutput: BenchmarkRatingOutput,
  candidateOutput: BenchmarkRatingOutput,
  baseSnapshotId: string,
  candidateSnapshotId: string,
): RatingComparisonOutput {
  validateSuiteMatch(baseOutput.suiteId, candidateOutput.suiteId);

  const baseMap = buildEntryMap(baseOutput);
  const candidateMap = buildEntryMap(candidateOutput);

  const entries = buildComparisonEntries(baseMap, candidateMap);

  return {
    schemaVersion: "rating-comparison-v1",
    suiteId: baseOutput.suiteId,
    baseSnapshotId,
    candidateSnapshotId,
    entries,
  };
}

// ─── Safety helpers ──────────────────────────────────────────────────────────

export function scanComparisonOutputSafety(
  output: RatingComparisonOutput,
): string[] {
  const combined = JSON.stringify(output);
  return scanComparisonSafety(combined);
}

export function scanComparisonOutputForAbsolutePaths(
  output: RatingComparisonOutput,
): string[] {
  const combined = JSON.stringify(output);
  const hazards: string[] = [];
  if (/C:\\/.test(combined)) hazards.push("Windows absolute path (C:\\)");
  if (/D:\\/.test(combined)) hazards.push("Windows absolute path (D:\\)");
  if (/\/Users\//.test(combined)) hazards.push("Unix absolute path (/Users/)");
  if (/^[A-Z]:\\/m.test(combined)) hazards.push("Drive-letter absolute path");
  return hazards;
}
