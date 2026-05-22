import { createHash } from "node:crypto";

import type { CatalogFaction } from "@/game/catalog";
import type { LegalMove, LegalMoveKind, MatchPhase, SeatId } from "@/game/core";

import { runBenchmarkSuite } from "./runBenchmark";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSummary,
  BenchmarkSuite,
} from "./types";

export type SearchReadinessRootSchemaVersion = "search-readiness-root-v1";
export type SearchReadinessSummarySchemaVersion = "search-readiness-summary-v1";

export type SearchReadinessTargetKind =
  | "none"
  | "board_row"
  | "row_horn"
  | "weather"
  | "card"
  | "deck_card_source"
  | "card_instance_set"
  | "deck_card_instance";

export type SearchReadinessTargetSide = "own" | "opponent" | "public" | "none";

export type SearchReadinessMoveKindCounts = Record<LegalMoveKind, number>;
export type SearchReadinessTargetKindCounts = Record<SearchReadinessTargetKind, number>;
export type SearchReadinessTargetSideCounts = Record<SearchReadinessTargetSide, number>;

export interface SearchReadinessRootRecord {
  schemaVersion: SearchReadinessRootSchemaVersion;
  profileRunId: string;
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorGroupId?: string;
  mirrorIndex?: 0 | 1;
  step: number;
  decisionIndex: number;
  phase: MatchPhase;
  round: number;
  seatId: SeatId;
  policyId: string;
  faction: Exclude<CatalogFaction, "neutral">;
  deckPresetId: string;
  legalMoveCount: number;
  moveKindCounts: SearchReadinessMoveKindCounts;
  targetKindCounts: SearchReadinessTargetKindCounts;
  targetSideCounts: SearchReadinessTargetSideCounts;
  playCardMoveCount: number;
  playCardSourceCount: number;
  playCardTargetExpansionCount: number;
  promptOptionCount: number;
  mulliganOptionCount: number;
  rowTargetMoveCount: number;
  hornTargetMoveCount: number;
  weatherTargetMoveCount: number;
  cardTargetMoveCount: number;
  passLegal: boolean;
  leaderLegal: boolean;
  rootPublicFingerprint: string;
}

export interface SearchReadinessCountStats {
  count: number;
  min: number;
  max: number;
  average: number;
  p50: number;
  p90: number;
  p95: number;
}

export interface SearchReadinessSafeRootReference {
  rootPublicFingerprint: string;
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorIndex?: 0 | 1;
  step: number;
  phase: MatchPhase;
  round: number;
  seatId: SeatId;
  policyId: string;
  faction: Exclude<CatalogFaction, "neutral">;
  deckPresetId: string;
}

export interface SearchReadinessMaxLegalMoveRoot extends SearchReadinessSafeRootReference {
  legalMoveCount: number;
}

export interface SearchReadinessMaxTargetExpansionRoot extends SearchReadinessSafeRootReference {
  playCardTargetExpansionCount: number;
}

export interface SearchReadinessSummary {
  schemaVersion: SearchReadinessSummarySchemaVersion;
  profileRunId: string;
  suiteId: string;
  rootRecordCount: number;
  matchCount: number;
  statusCounts: BenchmarkSummary["statusCounts"];
  policyIds: string[];
  deckPresetIds: string[];
  factions: Exclude<CatalogFaction, "neutral">[];
  rootCountsByPhase: Record<string, number>;
  rootCountsByPolicy: Record<string, number>;
  rootCountsByFaction: Record<string, number>;
  rootCountsByDeckPreset: Record<string, number>;
  rootCountsByMoveKindPresence: Record<LegalMoveKind, number>;
  legalMoveCountStats: SearchReadinessCountStats;
  playCardMoveCountStats: SearchReadinessCountStats;
  playCardSourceCountStats: SearchReadinessCountStats;
  playCardTargetExpansionStats: SearchReadinessCountStats;
  targetedMoveCountStats: SearchReadinessCountStats;
  promptOptionCountStats: SearchReadinessCountStats;
  mulliganOptionCountStats: SearchReadinessCountStats;
  maxLegalMoveRoot: SearchReadinessMaxLegalMoveRoot | null;
  maxTargetExpansionRoot: SearchReadinessMaxTargetExpansionRoot | null;
}

export interface SearchReadinessProfileResult {
  profileRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  benchmark: BenchmarkRunResult;
  roots: SearchReadinessRootRecord[];
  summary: SearchReadinessSummary;
}

export interface SearchReadinessProfileInput {
  suiteId?: string;
  suite?: BenchmarkSuite;
  profileRunId?: string;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
}

export interface BuildSearchReadinessRootRecordInput extends BenchmarkRootObserverInput {
  profileRunId: string;
}

const moveKinds: readonly LegalMoveKind[] = [
  "choose_mulligan",
  "play_card",
  "use_leader",
  "choose_prompt_option",
  "pass",
  "resolve_round_end",
];

const targetKinds: readonly SearchReadinessTargetKind[] = [
  "none",
  "board_row",
  "row_horn",
  "weather",
  "card",
  "deck_card_source",
  "card_instance_set",
  "deck_card_instance",
];

const targetSides: readonly SearchReadinessTargetSide[] = ["own", "opponent", "public", "none"];

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const sortJsonValue = (value: unknown): JsonValue => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJsonValue(nested)]),
    );
  }
  return null;
};

const stableJson = (value: unknown) => JSON.stringify(sortJsonValue(value));

export const hashSearchReadinessPublicValue = (value: unknown) =>
  createHash("sha256").update(stableJson(value), "utf8").digest("hex");

const emptyMoveKindCounts = (): SearchReadinessMoveKindCounts =>
  Object.fromEntries(moveKinds.map((kind) => [kind, 0])) as SearchReadinessMoveKindCounts;

const emptyTargetKindCounts = (): SearchReadinessTargetKindCounts =>
  Object.fromEntries(targetKinds.map((kind) => [kind, 0])) as SearchReadinessTargetKindCounts;

const emptyTargetSideCounts = (): SearchReadinessTargetSideCounts =>
  Object.fromEntries(targetSides.map((side) => [side, 0])) as SearchReadinessTargetSideCounts;

const targetOf = (move: LegalMove) => ("target" in move ? move.target : { kind: "none" as const });

const publicTargetKind = (move: LegalMove): SearchReadinessTargetKind => {
  const target = targetOf(move);
  if (target.kind === "card_instance") {
    return "card";
  }
  return target.kind;
};

const publicTargetSide = (move: LegalMove): SearchReadinessTargetSide => {
  const target = targetOf(move);
  if (target.kind === "none") {
    return "none";
  }
  if (target.kind === "weather") {
    return "public";
  }
  if ("side" in target) {
    return target.side;
  }
  return target.seatId === move.seatId ? "own" : "opponent";
};

const safeRootFingerprint = (root: Omit<SearchReadinessRootRecord, "rootPublicFingerprint">) =>
  hashSearchReadinessPublicValue(root);

export const buildSearchReadinessRootRecord = ({
  profileRunId,
  suiteId,
  matchupId,
  seed,
  mirrorGroupId,
  mirrorIndex,
  step,
  decisionIndex,
  state,
  seatId,
  policyId,
  legalMoves,
  seats,
}: BuildSearchReadinessRootRecordInput): SearchReadinessRootRecord => {
  const seat = seats[seatId];
  const moveKindCounts = emptyMoveKindCounts();
  const targetKindCounts = emptyTargetKindCounts();
  const targetSideCounts = emptyTargetSideCounts();
  const playCardSourceIds = new Set<string>();

  legalMoves.forEach((move) => {
    moveKindCounts[move.kind] += 1;
    targetKindCounts[publicTargetKind(move)] += 1;
    targetSideCounts[publicTargetSide(move)] += 1;
    if (move.kind === "play_card") {
      playCardSourceIds.add(move.sourceCardId);
    }
  });

  const playCardMoveCount = moveKindCounts.play_card;
  const playCardSourceCount = playCardSourceIds.size;
  const rootWithoutFingerprint: Omit<SearchReadinessRootRecord, "rootPublicFingerprint"> = {
    schemaVersion: "search-readiness-root-v1",
    profileRunId,
    suiteId,
    matchupId,
    seed,
    ...(mirrorGroupId ? { mirrorGroupId } : {}),
    ...(mirrorIndex === undefined ? {} : { mirrorIndex }),
    step,
    decisionIndex,
    phase: state.phase,
    round: state.round,
    seatId,
    policyId,
    faction: seat.faction,
    deckPresetId: seat.deckPresetId,
    legalMoveCount: legalMoves.length,
    moveKindCounts,
    targetKindCounts,
    targetSideCounts,
    playCardMoveCount,
    playCardSourceCount,
    playCardTargetExpansionCount: Math.max(0, playCardMoveCount - playCardSourceCount),
    promptOptionCount: moveKindCounts.choose_prompt_option,
    mulliganOptionCount: moveKindCounts.choose_mulligan,
    rowTargetMoveCount: targetKindCounts.board_row,
    hornTargetMoveCount: targetKindCounts.row_horn,
    weatherTargetMoveCount: targetKindCounts.weather,
    cardTargetMoveCount: targetKindCounts.card,
    passLegal: moveKindCounts.pass > 0,
    leaderLegal: moveKindCounts.use_leader > 0,
  };

  return {
    ...rootWithoutFingerprint,
    rootPublicFingerprint: safeRootFingerprint(rootWithoutFingerprint),
  };
};

const roundToThree = (value: number) => Number(value.toFixed(3));

const percentile = (sortedValues: readonly number[], fraction: number) => {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(sortedValues.length - 1, Math.max(0, Math.ceil(sortedValues.length * fraction) - 1));
  return sortedValues[index];
};

export const buildSearchReadinessCountStats = (values: readonly number[]): SearchReadinessCountStats => {
  if (values.length === 0) {
    return { count: 0, min: 0, max: 0, average: 0, p50: 0, p90: 0, p95: 0 };
  }
  const sorted = [...values].sort((left, right) => left - right);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    average: roundToThree(sum / sorted.length),
    p50: percentile(sorted, 0.5),
    p90: percentile(sorted, 0.9),
    p95: percentile(sorted, 0.95),
  };
};

const sortedUnique = <T extends string>(values: readonly T[]): T[] => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const countBy = <T extends string>(values: readonly T[]): Record<T, number> => {
  const counts = {} as Record<T, number>;
  values.forEach((value) => {
    counts[value] = (counts[value] ?? 0) + 1;
  });
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right))) as Record<T, number>;
};

const initialMoveKindPresenceCounts = () =>
  Object.fromEntries(moveKinds.map((kind) => [kind, 0])) as Record<LegalMoveKind, number>;

const targetedMoveCount = (root: SearchReadinessRootRecord) =>
  targetKinds
    .filter((kind) => kind !== "none")
    .reduce((total, kind) => total + root.targetKindCounts[kind], 0);

const safeRootReference = (root: SearchReadinessRootRecord): SearchReadinessSafeRootReference => ({
  rootPublicFingerprint: root.rootPublicFingerprint,
  suiteId: root.suiteId,
  matchupId: root.matchupId,
  seed: root.seed,
  ...(root.mirrorIndex === undefined ? {} : { mirrorIndex: root.mirrorIndex }),
  step: root.step,
  phase: root.phase,
  round: root.round,
  seatId: root.seatId,
  policyId: root.policyId,
  faction: root.faction,
  deckPresetId: root.deckPresetId,
});

const maxBy = <T>(values: readonly T[], score: (value: T) => number): T | null => {
  let best: T | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  values.forEach((value) => {
    const valueScore = score(value);
    if (!best || valueScore > bestScore) {
      best = value;
      bestScore = valueScore;
    }
  });
  return best;
};

export const buildSearchReadinessSummary = ({
  profileRunId,
  suiteId,
  roots,
  benchmarkSummary,
}: {
  profileRunId: string;
  suiteId: string;
  roots: readonly SearchReadinessRootRecord[];
  benchmarkSummary: BenchmarkSummary;
}): SearchReadinessSummary => {
  const rootCountsByMoveKindPresence = initialMoveKindPresenceCounts();
  roots.forEach((root) => {
    moveKinds.forEach((kind) => {
      if (root.moveKindCounts[kind] > 0) {
        rootCountsByMoveKindPresence[kind] += 1;
      }
    });
  });

  const maxLegalMoveRoot = maxBy(roots, (root) => root.legalMoveCount);
  const maxTargetExpansionRoot = maxBy(roots, (root) => root.playCardTargetExpansionCount);

  return {
    schemaVersion: "search-readiness-summary-v1",
    profileRunId,
    suiteId,
    rootRecordCount: roots.length,
    matchCount: benchmarkSummary.totalMatches,
    statusCounts: benchmarkSummary.statusCounts,
    policyIds: sortedUnique(roots.map((root) => root.policyId)),
    deckPresetIds: sortedUnique(roots.map((root) => root.deckPresetId)),
    factions: sortedUnique(roots.map((root) => root.faction)),
    rootCountsByPhase: countBy(roots.map((root) => root.phase)),
    rootCountsByPolicy: countBy(roots.map((root) => root.policyId)),
    rootCountsByFaction: countBy(roots.map((root) => root.faction)),
    rootCountsByDeckPreset: countBy(roots.map((root) => root.deckPresetId)),
    rootCountsByMoveKindPresence,
    legalMoveCountStats: buildSearchReadinessCountStats(roots.map((root) => root.legalMoveCount)),
    playCardMoveCountStats: buildSearchReadinessCountStats(roots.map((root) => root.playCardMoveCount)),
    playCardSourceCountStats: buildSearchReadinessCountStats(roots.map((root) => root.playCardSourceCount)),
    playCardTargetExpansionStats: buildSearchReadinessCountStats(
      roots.map((root) => root.playCardTargetExpansionCount),
    ),
    targetedMoveCountStats: buildSearchReadinessCountStats(roots.map(targetedMoveCount)),
    promptOptionCountStats: buildSearchReadinessCountStats(roots.map((root) => root.promptOptionCount)),
    mulliganOptionCountStats: buildSearchReadinessCountStats(roots.map((root) => root.mulliganOptionCount)),
    maxLegalMoveRoot: maxLegalMoveRoot
      ? {
          ...safeRootReference(maxLegalMoveRoot),
          legalMoveCount: maxLegalMoveRoot.legalMoveCount,
        }
      : null,
    maxTargetExpansionRoot: maxTargetExpansionRoot
      ? {
          ...safeRootReference(maxTargetExpansionRoot),
          playCardTargetExpansionCount: maxTargetExpansionRoot.playCardTargetExpansionCount,
        }
      : null,
  };
};

const defaultProfileRunId = (input: SearchReadinessProfileInput) =>
  `${input.suiteId ?? input.suite?.id ?? "benchmark-smoke-v1"}:search-readiness:cFp59`;

export const runSearchReadinessProfile = (
  input: SearchReadinessProfileInput = {},
): SearchReadinessProfileResult => {
  const profileRunId = input.profileRunId ?? defaultProfileRunId(input);
  const roots: SearchReadinessRootRecord[] = [];
  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: profileRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      roots.push(buildSearchReadinessRootRecord({ ...root, profileRunId }));
    },
  });
  const suiteId = benchmark.summary.suiteId;

  return {
    profileRunId,
    suiteId,
    sourceBenchmarkSuiteId: suiteId,
    benchmark,
    roots,
    summary: buildSearchReadinessSummary({
      profileRunId,
      suiteId,
      roots,
      benchmarkSummary: benchmark.summary,
    }),
  };
};
