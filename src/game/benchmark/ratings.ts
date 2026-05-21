import type {
  BenchmarkMatchRecord,
} from "./types";

// ─── Glicko configuration ────────────────────────────────────────────────────

export const DEFAULT_RATING = 1500;
export const DEFAULT_RD = 350;
export const Q = Math.log(10) / 400;
export const RD_FLOOR = 30;

// ─── Public types ────────────────────────────────────────────────────────────

export type BenchmarkRatingScope =
  | "policy"
  | "policy_deck"
  | "policy_faction"
  | "policy_matchup";

export type BenchmarkRatingSchemaVersion = "benchmark-rating-v1";

export interface BenchmarkRatingEntry {
  scope: BenchmarkRatingScope;
  key: string;
  label: string;
  rating: number;
  rd: number;
  interval95Low: number;
  interval95High: number;
  conservativeRating: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface BenchmarkRatingScopeResult {
  scope: BenchmarkRatingScope;
  entries: BenchmarkRatingEntry[];
}

export interface BenchmarkRatingConfig {
  defaultRating: number;
  defaultRd: number;
  q: number;
  rdFloor: number;
}

export interface BenchmarkRatingSummary {
  totalRecords: number;
  eligibleRecords: number;
  ignoredRecords: number;
  ignoredReasons: Record<string, number>;
}

export interface BenchmarkRatingOutput {
  schemaVersion: "benchmark-rating-artifact-v1";
  ratingSchemaVersion: BenchmarkRatingSchemaVersion;
  suiteId: string;
  sourceRecordsPath: string;
  config: BenchmarkRatingConfig;
  summary: BenchmarkRatingSummary;
  scopes: BenchmarkRatingScopeResult[];
}

// ─── Internal entities ───────────────────────────────────────────────────────

interface RatingEntity {
  key: string;
  label: string;
  rating: number;
  rd: number;
  games: number;
  wins: number;
  losses: number;
  draws: number;
}

// ─── Filtering ───────────────────────────────────────────────────────────────

function isRecordEligible(record: BenchmarkMatchRecord): boolean {
  if (record.status !== "completed") return false;
  if (record.winner === null) return false;
  if (record.resultBySeat.seat_a === "none" || record.resultBySeat.seat_b === "none") return false;
  if (record.replayStatus !== "passed" && record.replayStatus !== "skipped") return false;
  return true;
}

// Outcome: 1 = win, 0.5 = draw, 0 = loss
function outcomeToScore(
  seatId: "seat_a" | "seat_b",
  _winner: BenchmarkMatchRecord["winner"],
  resultBySeat: BenchmarkMatchRecord["resultBySeat"]
): number {
  if (resultBySeat[seatId] === "draw") return 0.5;
  if (resultBySeat[seatId] === "win") return 1;
  return 0;
}

// ─── Scope key building ──────────────────────────────────────────────────────

function buildPolicyKey(policyId: string): string {
  return `policy:${policyId}`;
}

function buildPolicyDeckKey(policyId: string, deckPresetId: string): string {
  return `policy_deck:${policyId}|${deckPresetId}`;
}

function buildPolicyFactionKey(policyId: string, faction: string): string {
  return `policy_faction:${policyId}|${faction}`;
}

function buildPolicyMatchupKey(policyId: string, matchupId: string): string {
  return `policy_matchup:${policyId}|${matchupId}`;
}

function buildPolicyLabel(policyId: string): string {
  return policyId;
}

function buildPolicyDeckLabel(policyId: string, deckPresetId: string): string {
  return `${policyId} / ${deckPresetId}`;
}

function buildPolicyFactionLabel(policyId: string, faction: string): string {
  return `${policyId} / ${faction}`;
}

function buildPolicyMatchupLabel(policyId: string, matchupId: string): string {
  return `${policyId} / ${matchupId}`;
}

// ─── Glicko-1 formulas ──────────────────────────────────────────────────────

function g(rd: number): number {
  return 1 / Math.sqrt(1 + (3 * Q * Q * rd * rd) / (Math.PI * Math.PI));
}

function expectedRating(gVal: number, rating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (-gVal * (rating - opponentRating)) / 400));
}

// ─── Rating engine ───────────────────────────────────────────────────────────

function computeRatingPeriod(
  entities: Map<string, RatingEntity>,
  games: Array<{
    entityKey: string;
    opponentKey: string;
    score: number;
  }>
): void {
  if (games.length === 0) return;

  // Gather all opponents and ensure they exist in the map
  const opponentKeys = new Set<string>();
  for (const game of games) {
    opponentKeys.add(game.opponentKey);
  }

  for (const key of opponentKeys) {
    if (!entities.has(key)) {
      entities.set(key, {
        key,
        label: key,
        rating: DEFAULT_RATING,
        rd: DEFAULT_RD,
        games: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      });
    }
  }

  // Snapshot pre-period ratings (spec requires pre-period ratings for all opponents)
  const preRating = new Map<string, number>();
  const preRd = new Map<string, number>();
  for (const entity of entities.values()) {
    preRating.set(entity.key, entity.rating);
    preRd.set(entity.key, entity.rd);
  }

  // Compute d^2 = 1 / (q^2 * sum(g(RD_j)^2 * E_j * (1 - E_j)))
  const denominatorSums = new Map<string, number>();

  for (const entity of entities.values()) {
    denominatorSums.set(entity.key, 0);
  }

  for (const game of games) {
    const gVal = g(preRd.get(game.opponentKey)!);
    const E = expectedRating(gVal, preRating.get(game.entityKey)!, preRating.get(game.opponentKey)!);
    const current = denominatorSums.get(game.entityKey)!;
    denominatorSums.set(game.entityKey, current + Q * Q * gVal * gVal * E * (1 - E));
  }

   // Update each entity using pre-period values
  for (const entity of entities.values()) {
    const d2 = denominatorSums.get(entity.key)!;
    if (d2 === 0) {
      continue;
    }

    const inverseVariance = 1 / (preRd.get(entity.key)! ** 2) + d2;
    const rawRd = Math.sqrt(1 / inverseVariance);

    let scoreSum = 0;
    for (const game of games) {
      if (game.entityKey !== entity.key) continue;
      const gVal = g(preRd.get(game.opponentKey)!);
      const E = expectedRating(gVal, preRating.get(entity.key)!, preRating.get(game.opponentKey)!);
      scoreSum += gVal * (game.score - E);
    }

    const preR = preRating.get(entity.key)!;
    const newRating = preR + (Q / inverseVariance) * scoreSum;
    const clampedRd = Math.max(rawRd, RD_FLOOR);

    entity.rating = newRating;
    entity.rd = clampedRd;
  }
}

// ─── Scope processing ────────────────────────────────────────────────────────

const REQUIRED_SCOPES: BenchmarkRatingScope[] = ["policy", "policy_deck", "policy_faction"];

function processScope(
  scope: BenchmarkRatingScope,
  records: BenchmarkMatchRecord[],
  config: BenchmarkRatingConfig
): BenchmarkRatingScopeResult {
  const entities = new Map<string, RatingEntity>();

  const getEntityKey = (policyId: string, extra: string): string => {
    switch (scope) {
      case "policy":
        return buildPolicyKey(policyId);
      case "policy_deck":
        return buildPolicyDeckKey(policyId, extra);
      case "policy_faction":
        return buildPolicyFactionKey(policyId, extra);
      case "policy_matchup":
        return buildPolicyMatchupKey(policyId, extra);
    }
  };

  const getEntityLabel = (policyId: string, extra: string): string => {
    switch (scope) {
      case "policy":
        return buildPolicyLabel(policyId);
      case "policy_deck":
        return buildPolicyDeckLabel(policyId, extra);
      case "policy_faction":
        return buildPolicyFactionLabel(policyId, extra);
      case "policy_matchup":
        return buildPolicyMatchupLabel(policyId, extra);
    }
  };

  // Register entities for this scope
  for (const record of records) {
    const seatA = record.seats.seat_a;
    const seatB = record.seats.seat_b;

    const addEntity = (policyId: string, extra: string) => {
      const key = getEntityKey(policyId, extra);
      const label = getEntityLabel(policyId, extra);
      if (!entities.has(key)) {
        entities.set(key, {
          key,
          label,
          rating: config.defaultRating,
          rd: config.defaultRd,
          games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        });
      }
    };

    switch (scope) {
      case "policy": {
        addEntity(seatA.policyId, "");
        addEntity(seatB.policyId, "");
        break;
      }
      case "policy_deck": {
        addEntity(seatA.policyId, seatA.deckPresetId);
        addEntity(seatB.policyId, seatB.deckPresetId);
        break;
      }
      case "policy_faction": {
        addEntity(seatA.policyId, seatA.faction);
        addEntity(seatB.policyId, seatB.faction);
        break;
      }
      case "policy_matchup": {
        addEntity(seatA.policyId, record.matchupId);
        addEntity(seatB.policyId, record.matchupId);
        break;
      }
    }
  }

  // Build games for this scope
  const games: Array<{
    entityKey: string;
    opponentKey: string;
    score: number;
  }> = [];

  for (const record of records) {

    for (const seatId of ["seat_a", "seat_b"] as const) {
      const seat = record.seats[seatId];
      const opponentSeat = record.seats[seatId === "seat_a" ? "seat_b" : "seat_a"];

      const extraForSeat = scope === "policy_deck" ? seat.deckPresetId
        : scope === "policy_faction" ? seat.faction
        : scope === "policy_matchup" ? record.matchupId
        : "";

      const entityKey = getEntityKey(seat.policyId, extraForSeat);
      const opponentExtra = scope === "policy_deck" ? opponentSeat.deckPresetId
        : scope === "policy_faction" ? opponentSeat.faction
        : scope === "policy_matchup" ? record.matchupId
        : "";
      const opponentKey = getEntityKey(opponentSeat.policyId, opponentExtra);

      const score = outcomeToScore(seatId, record.winner, record.resultBySeat);

      games.push({ entityKey, opponentKey, score });

      // Update raw counts
      const entity = entities.get(entityKey);
      if (entity) {
        entity.games += 1;
        if (score === 1) entity.wins += 1;
        else if (score === 0) entity.losses += 1;
        else entity.draws += 1;
      }
    }
  }

  // Compute rating period
  computeRatingPeriod(entities, games);

  // Build entries — omit zero-game entities
  const entries: BenchmarkRatingEntry[] = [];
  for (const entity of entities.values()) {
    if (entity.games === 0) continue;

    entries.push({
      scope,
      key: entity.key,
      label: entity.label,
      rating: Math.round(entity.rating * 100) / 100,
      rd: Math.round(entity.rd * 100) / 100,
      interval95Low: Math.round((entity.rating - 1.96 * entity.rd) * 100) / 100,
      interval95High: Math.round((entity.rating + 1.96 * entity.rd) * 100) / 100,
      conservativeRating: Math.round((entity.rating - 2 * entity.rd) * 100) / 100,
      games: entity.games,
      wins: entity.wins,
      losses: entity.losses,
      draws: entity.draws,
    });
  }

  // Sort: rating descending, RD ascending, key ascending
  entries.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    if (a.rd !== b.rd) return a.rd - b.rd;
    return a.key.localeCompare(b.key);
  });

  return { scope, entries };
}

// ─── Sorting for output ──────────────────────────────────────────────────────

function scopeOrder(scope: BenchmarkRatingScope): number {
  switch (scope) {
    case "policy": return 0;
    case "policy_deck": return 1;
    case "policy_faction": return 2;
    case "policy_matchup": return 3;
  }
}

// ─── Deterministic record sorting ────────────────────────────────────────────

function sortRecords(records: readonly BenchmarkMatchRecord[]): BenchmarkMatchRecord[] {
  return [...records].sort((a, b) => {
    const cmp = a.suiteId.localeCompare(b.suiteId);
    if (cmp !== 0) return cmp;
    const cmp2 = a.matchupId.localeCompare(b.matchupId);
    if (cmp2 !== 0) return cmp2;
    const cmp3 = String(a.seed).localeCompare(String(b.seed));
    if (cmp3 !== 0) return cmp3;
    const aMirror = a.mirrorIndex ?? 0;
    const bMirror = b.mirrorIndex ?? 0;
    if (aMirror !== bMirror) return aMirror - bMirror;
    const cmp4 = (a.stableFingerprint ?? "").localeCompare(b.stableFingerprint ?? "");
    return cmp4;
  });
}

// ─── Public entry point ──────────────────────────────────────────────────────

export function computeRatings(
  records: readonly BenchmarkMatchRecord[],
  suiteId: string,
  sourceRecordsPath: string,
  scopes: readonly BenchmarkRatingScope[] = REQUIRED_SCOPES
): BenchmarkRatingOutput {
  const config: BenchmarkRatingConfig = {
    defaultRating: DEFAULT_RATING,
    defaultRd: DEFAULT_RD,
    q: Q,
    rdFloor: RD_FLOOR,
  };

  // Sort records deterministically
  const sorted = sortRecords(records);

  // Filter eligible records
  const eligible: BenchmarkMatchRecord[] = [];
  const ignoredReasons: Record<string, number> = {};

  for (const record of sorted) {
    if (isRecordEligible(record)) {
      eligible.push(record);
    } else {
      if (record.status !== "completed") {
        ignoredReasons["status_not_completed"] = (ignoredReasons["status_not_completed"] ?? 0) + 1;
      } else if (record.winner === null) {
        ignoredReasons["winner_null"] = (ignoredReasons["winner_null"] ?? 0) + 1;
      } else if (record.resultBySeat.seat_a === "none" || record.resultBySeat.seat_b === "none") {
        ignoredReasons["seat_result_none"] = (ignoredReasons["seat_result_none"] ?? 0) + 1;
      } else if (record.replayStatus === "failed") {
        ignoredReasons["replay_failed"] = (ignoredReasons["replay_failed"] ?? 0) + 1;
      } else {
        ignoredReasons["unknown"] = (ignoredReasons["unknown"] ?? 0) + 1;
      }
    }
  }

  // Process each scope
  const scopeResults: BenchmarkRatingScopeResult[] = [];
  for (const scope of scopes) {
    const result = processScope(scope, eligible, config);
    scopeResults.push(result);
  }

  // Sort scopes by order
  scopeResults.sort((a, b) => scopeOrder(a.scope) - scopeOrder(b.scope));

  return {
    schemaVersion: "benchmark-rating-artifact-v1",
    ratingSchemaVersion: "benchmark-rating-v1",
    suiteId,
    sourceRecordsPath,
    config,
    summary: {
      totalRecords: sorted.length,
      eligibleRecords: eligible.length,
      ignoredRecords: sorted.length - eligible.length,
      ignoredReasons,
    },
    scopes: scopeResults,
  };
}
