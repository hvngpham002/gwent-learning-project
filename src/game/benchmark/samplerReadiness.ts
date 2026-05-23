import { createHash } from "node:crypto";

import type { CatalogFaction } from "@/game/catalog";
import type { LegalMove, MatchPhase, SeatId } from "@/game/core";

import { getBenchmarkDeckDescriptor } from "./decks";
import { runBenchmarkSuite } from "./runBenchmark";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSuite,
} from "./types";

export type SamplerReadinessRootSchemaVersion = "sampler-readiness-root-v1";
export type SamplerReadinessSummarySchemaVersion = "sampler-readiness-summary-v1";

export const DEFAULT_SAMPLE_COUNT = 8;

export type SamplerReadinessPriorId = "known_preset_decklist_prior";

export const KNOWN_PRESET_DECKLIST_PRIOR_ID: SamplerReadinessPriorId =
  "known_preset_decklist_prior";

export const KNOWN_PRESET_DECK_PRESET_IDS = new Set<string>([
  "official-northern-realms-starter",
  "official-nilfgaard-starter",
  "official-monsters-starter",
  "official-scoiatael-starter",
  "official-skellige-starter",
]);

export type SamplerReadinessPriorStatus =
  | "prior_available"
  | "prior_unavailable";

export type SamplerReadinessRootValidationStatus = "valid" | "invalid" | "deferred";

export interface SamplerReadinessPriorInfo {
  priorId: SamplerReadinessPriorId;
  priorStatus: SamplerReadinessPriorStatus;
  deckPresetId: string;
  faction: string;
  mainDeckCardCount: number;
  sideDeckCardCount: number;
  totalDeckCardCount: number;
  knownVisibleCardCount: number;
  priorRemainingCardCount: number;
}

export type PublicSearchActionKind =
  | "choose_mulligan"
  | "play_card"
  | "use_leader"
  | "choose_prompt_option"
  | "pass"
  | "resolve_round_end";

export type PublicActionTargetKind =
  | "none"
  | "board_row"
  | "row_horn"
  | "weather"
  | "card"
  | "deck_card_source"
  | "card_instance_set"
  | "deck_card_instance";

export type PublicActionTargetSide = "own" | "opponent" | "public" | "none";

export type PublicActionSourceClass =
  | "unit"
  | "hero"
  | "special"
  | "weather"
  | "leader"
  | "prompt"
  | "none";

export type PublicActionStrengthBucket =
  | "empty"
  | "weak"
  | "medium"
  | "strong";

export interface PublicSearchActionAbstraction {
  kind: PublicSearchActionKind;
  targetKind: PublicActionTargetKind;
  targetSide: PublicActionTargetSide;
  targetRow?: string;
  phase: MatchPhase;
  round: number;
  sourceClass: PublicActionSourceClass;
  strengthBucket?: PublicActionStrengthBucket;
  optionIndexLabel?: string;
  moveCount: number;
}

export interface SamplerReadinessValidationResult {
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountValid: number;
  sampleCountInvalid: number;
  rootValidationStatus: SamplerReadinessRootValidationStatus;
  invalidReasonCounts: Record<string, number>;
  opponentHiddenPoolSizeBucket: string;
  opponentHandCount: number;
  opponentDeckCount: number;
  knownVisibleCardCountBucket: string;
  priorRemainingCardCountBucket: string;
}

export interface SamplerReadinessRootRecord {
  schemaVersion: SamplerReadinessRootSchemaVersion;
  samplerRunId: string;
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
  priorId: SamplerReadinessPriorId;
  priorStatus: SamplerReadinessPriorStatus;
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountValid: number;
  sampleCountInvalid: number;
  rootValidationStatus: SamplerReadinessRootValidationStatus;
  invalidReasonCounts: Record<string, number>;
  opponentHiddenPoolSizeBucket: string;
  opponentHandCount: number;
  opponentDeckCount: number;
  knownVisibleCardCountBucket: string;
  priorRemainingCardCountBucket: string;
  legalMoveCount: number;
  publicActionCount: number;
  publicActionCollisionCount: number;
  largestPublicActionBucketSize: number;
  publicActionKindCounts: Record<string, number>;
  targetKindCounts: Record<string, number>;
  targetSideCounts: Record<string, number>;
  rootPublicFingerprint: string;
}

export interface SamplerReadinessCountStats {
  count: number;
  min: number;
  max: number;
  average: number;
  p50: number;
  p90: number;
  p95: number;
}

export interface SamplerReadinessSummary {
  schemaVersion: SamplerReadinessSummarySchemaVersion;
  samplerRunId: string;
  suiteId: string;
  rootRecordCount: number;
  matchCount: number;
  statusCounts: BenchmarkRunResult["summary"]["statusCounts"];
  policyIds: string[];
  deckPresetIds: string[];
  factions: Exclude<CatalogFaction, "neutral">[];
  rootCountsByPhase: Record<string, number>;
  rootCountsByPolicy: Record<string, number>;
  rootCountsByFaction: Record<string, number>;
  rootCountsByDeckPreset: Record<string, number>;
  priorStatusCounts: Record<SamplerReadinessPriorStatus, number>;
  validationStatusCounts: Record<SamplerReadinessRootValidationStatus, number>;
  invalidReasonCounts: Record<string, number>;
  sampleCountStats: SamplerReadinessCountStats;
  publicActionCountStats: SamplerReadinessCountStats;
  collisionCountStats: SamplerReadinessCountStats;
  legalMoveCountStats: SamplerReadinessCountStats;
  largestBucketStats: SamplerReadinessCountStats;
  maxPublicActionRoot: SamplerReadinessMaxPublicActionRoot | null;
  maxCollisionRoot: SamplerReadinessMaxCollisionRoot | null;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
}

export interface SamplerReadinessProfileResult {
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  benchmark: BenchmarkRunResult;
  roots: SamplerReadinessRootRecord[];
  summary: SamplerReadinessSummary;
}

export interface SamplerReadinessProfileInput {
  suiteId?: string;
  suite?: BenchmarkSuite;
  samplerRunId?: string;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
  sampleCount?: number;
}

export interface BuildSamplerReadinessRootRecordInput
  extends BenchmarkRootObserverInput {
  samplerRunId: string;
}

export interface SamplerReadinessMaxPublicActionRoot {
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
  publicActionCount: number;
}

export interface SamplerReadinessMaxCollisionRoot {
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
  publicActionCollisionCount: number;
}

export interface SampledWorldValidationInput {
  deckPresetId: string;
  opponentHandCount: number;
  opponentDeckCount: number;
  sampleCount: number;
  priorTotalCardCount: number;
}

export interface PriorConstructionInput {
  deckPresetId: string;
  faction: string;
  visibleHandCount: number;
}

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

export const hashSamplerReadinessPublicValue = (value: unknown) =>
  createHash("sha256").update(stableJson(value), "utf8").digest("hex");

export const buildKnownPresetDecklistPrior = ({
  deckPresetId,
  faction,
  visibleHandCount,
}: PriorConstructionInput): SamplerReadinessPriorInfo | null => {
  if (!KNOWN_PRESET_DECK_PRESET_IDS.has(deckPresetId)) {
    return {
      priorId: KNOWN_PRESET_DECKLIST_PRIOR_ID,
      priorStatus: "prior_unavailable",
      deckPresetId,
      faction,
      mainDeckCardCount: 0,
      sideDeckCardCount: 0,
      totalDeckCardCount: 0,
      knownVisibleCardCount: 0,
      priorRemainingCardCount: 0,
    };
  }

  const descriptor = getBenchmarkDeckDescriptor(deckPresetId);
  if (!descriptor) {
    return {
      priorId: KNOWN_PRESET_DECKLIST_PRIOR_ID,
      priorStatus: "prior_unavailable",
      deckPresetId,
      faction,
      mainDeckCardCount: 0,
      sideDeckCardCount: 0,
      totalDeckCardCount: 0,
      knownVisibleCardCount: 0,
      priorRemainingCardCount: 0,
    };
  }

  const mainDeckCardCount =
    descriptor.deckPreset.mainDeck.reduce((sum, entry) => sum + entry.count, 0);
  const sideDeckCardCount =
    descriptor.deckPreset.sideDeck.reduce((sum, entry) => sum + entry.count, 0);
  const totalDeckCardCount = mainDeckCardCount + sideDeckCardCount;

  const knownVisibleCardCount = visibleHandCount;

  const priorRemainingCardCount = Math.max(
    0,
    mainDeckCardCount - knownVisibleCardCount,
  );

  return {
    priorId: KNOWN_PRESET_DECKLIST_PRIOR_ID,
    priorStatus: "prior_available",
    deckPresetId,
    faction,
    mainDeckCardCount,
    sideDeckCardCount,
    totalDeckCardCount,
    knownVisibleCardCount,
    priorRemainingCardCount,
  };
};

export const buildSampledWorldValidation = (
  input: SampledWorldValidationInput,
): SamplerReadinessValidationResult => {
  const {
    opponentHandCount,
    opponentDeckCount,
    sampleCount,
    priorTotalCardCount,
  } = input;

  const invalidReasonCounts: Record<string, number> = {};
  let sampleCountValid = 0;
  let sampleCountInvalid = 0;

  const totalObservedCards = opponentHandCount + opponentDeckCount;

  if (opponentHandCount < 0) {
    invalidReasonCounts["negative_opponent_hand_count"] = 1;
    sampleCountInvalid += 1;
  }

  if (opponentDeckCount < 0) {
    invalidReasonCounts["negative_opponent_deck_count"] = 1;
    sampleCountInvalid += 1;
  }

  if (priorTotalCardCount > 0 && totalObservedCards > priorTotalCardCount) {
    invalidReasonCounts["observed_exceeds_prior_total"] = 1;
    sampleCountInvalid += 1;
  }

  if (priorTotalCardCount > 0 && opponentDeckCount > priorTotalCardCount) {
    invalidReasonCounts["opponent_deck_exceeds_prior"] = 1;
    sampleCountInvalid += 1;
  }

  if (priorTotalCardCount > 0 && opponentHandCount > priorTotalCardCount) {
    invalidReasonCounts["opponent_hand_exceeds_prior"] = 1;
    sampleCountInvalid += 1;
  }

  if (sampleCountInvalid === 0) {
    sampleCountValid = sampleCount;
  }

  let opponentHiddenPoolSizeBucket = "empty";
  if (totalObservedCards <= 10) opponentHiddenPoolSizeBucket = "small";
  else if (totalObservedCards <= 15) opponentHiddenPoolSizeBucket = "medium";
  else opponentHiddenPoolSizeBucket = "large";

  let knownVisibleCardCountBucket = "none";
  if (opponentHandCount >= 1) knownVisibleCardCountBucket = "small";
  if (opponentHandCount >= 5) knownVisibleCardCountBucket = "medium";
  if (opponentHandCount >= 8) knownVisibleCardCountBucket = "large";

  let priorRemainingCardCountBucket = "none";
  const remaining = opponentDeckCount;
  if (remaining >= 5) priorRemainingCardCountBucket = "small";
  if (remaining >= 10) priorRemainingCardCountBucket = "medium";
  if (remaining >= 15) priorRemainingCardCountBucket = "large";

  const rootValidationStatus: SamplerReadinessRootValidationStatus =
    sampleCountInvalid > 0
      ? "invalid"
      : "deferred";

  return {
    sampleCountRequested: sampleCount,
    sampleCountGenerated: sampleCountValid + sampleCountInvalid,
    sampleCountValid,
    sampleCountInvalid,
    rootValidationStatus,
    invalidReasonCounts,
    opponentHiddenPoolSizeBucket,
    opponentHandCount,
    opponentDeckCount,
    knownVisibleCardCountBucket,
    priorRemainingCardCountBucket,
  };
};

export const buildPublicActionAbstraction = (
  move: LegalMove,
  phase: MatchPhase,
  round: number,
): PublicSearchActionAbstraction => {
  const kind = move.kind;
  const target = "target" in move ? move.target : { kind: "none" as const };

  let targetKind: PublicActionTargetKind = "none";
  if (target.kind === "card_instance") {
    targetKind = "card";
  } else {
    targetKind = target.kind as PublicActionTargetKind;
  }

  let targetSide: PublicActionTargetSide = "none";
  if (target.kind === "none") {
    targetSide = "none";
  } else if (target.kind === "weather") {
    targetSide = "public";
  } else if ("side" in target) {
    targetSide = target.side as PublicActionTargetSide;
  } else {
    targetSide =
      target.seatId === move.seatId ? "own" : "opponent";
  }

  let targetRow: string | undefined;
  if ("row" in target && target.row) {
    targetRow = target.row;
  }

  let sourceClass: PublicActionSourceClass = "none";
  if (kind === "use_leader") {
    sourceClass = "leader";
  } else if (kind === "choose_prompt_option") {
    sourceClass = "prompt";
  } else if (kind === "choose_mulligan") {
    sourceClass = "none";
  } else if (kind === "play_card") {
    const cardKind = move.metadata?.cardKind ?? "unit";
    if (cardKind === "hero") sourceClass = "hero";
    else if (cardKind === "unit") sourceClass = "unit";
    else sourceClass = "special";
  } else {
    sourceClass = "none";
  }

  let strengthBucket: PublicActionStrengthBucket | undefined;
  const moveWithMeta = move as { metadata?: { printedStrength?: number } };
  if (moveWithMeta.metadata?.printedStrength != null) {
    const strength = moveWithMeta.metadata.printedStrength;
    if (strength <= 0) strengthBucket = "empty";
    else if (strength < 6) strengthBucket = "weak";
    else if (strength < 12) strengthBucket = "medium";
    else strengthBucket = "strong";
  }

  let optionIndexLabel: string | undefined;
  if (kind === "choose_prompt_option") {
    const moveWithIdx = move as { metadata?: { optionIndex?: number } };
    const idx = moveWithIdx.metadata?.optionIndex;
    if (idx != null) {
      optionIndexLabel = `option_index_${idx}`;
    }
  }

  return {
    kind: kind as PublicSearchActionKind,
    targetKind,
    targetSide,
    targetRow,
    phase,
    round,
    sourceClass,
    strengthBucket,
    optionIndexLabel,
    moveCount: 1,
  };
};

export const collapsePublicActions = (
  abstracts: PublicSearchActionAbstraction[],
): PublicSearchActionAbstraction[] => {
  const keyMap = new Map<string, PublicSearchActionAbstraction>();

  abstracts.forEach((ab) => {
    const key = [
      ab.kind,
      ab.targetKind,
      ab.targetSide,
      ab.targetRow ?? "",
      ab.phase,
      ab.round,
      ab.sourceClass,
      ab.strengthBucket ?? "empty",
      ab.optionIndexLabel ?? "",
    ].join("|");

    const existing = keyMap.get(key);
    if (existing) {
      existing.moveCount += 1;
    } else {
      const copy = { ...ab };
      keyMap.set(key, copy);
    }
  });

  return [...keyMap.values()];
};

export const buildPublicActionStats = (
  roots: readonly SamplerReadinessRootRecord[],
) => {
  const kindCounts: Record<string, number> = {};
  const targetKindCounts: Record<string, number> = {};
  const targetSideCounts: Record<string, number> = {};

  roots.forEach((root) => {
    Object.entries(root.publicActionKindCounts).forEach(([k, v]) => {
      kindCounts[k] = (kindCounts[k] ?? 0) + v;
    });
    Object.entries(root.targetKindCounts).forEach(([k, v]) => {
      targetKindCounts[k] = (targetKindCounts[k] ?? 0) + v;
    });
    Object.entries(root.targetSideCounts).forEach(([k, v]) => {
      targetSideCounts[k] = (targetSideCounts[k] ?? 0) + v;
    });
  });

  return {
    publicActionKindCounts: sortEntries(kindCounts),
    targetKindCounts: sortEntries(targetKindCounts),
    targetSideCounts: sortEntries(targetSideCounts),
  };
};

const sortEntries = (record: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(record).sort(([a], [b]) => a.localeCompare(b)),
  );

const roundToThree = (value: number) => Number(value.toFixed(3));

const percentile = (sortedValues: readonly number[], fraction: number) => {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * fraction) - 1),
  );
  return sortedValues[index];
};

export const buildSamplerReadinessCountStats = (
  values: readonly number[],
): SamplerReadinessCountStats => {
  if (values.length === 0) {
    return { count: 0, min: 0, max: 0, average: 0, p50: 0, p90: 0, p95: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
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

const sortedUnique = <T extends string>(values: readonly T[]): T[] =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b));

const countBy = <T extends string>(values: readonly T[]): Record<T, number> => {
  const counts = {} as Record<T, number>;
  values.forEach((value) => {
    counts[value] = (counts[value] ?? 0) + 1;
  });
  return Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
  ) as Record<T, number>;
};

export const buildSamplerReadinessRootRecord = ({
  samplerRunId,
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
}: BuildSamplerReadinessRootRecordInput): SamplerReadinessRootRecord => {
  const seat = seats[seatId];
  const faction = seat.faction;
  const deckPresetId = seat.deckPresetId;

  const opponentSeatId: SeatId =
    seatId === "seat_a" ? "seat_b" : "seat_a";

  const ownHandCount = state.seats[seatId].hand.length;
  const opponentHandCount = state.seats[opponentSeatId].hand.length;
  const opponentDeckCount = state.seats[opponentSeatId].deck.length;

  const priorInfo =
    buildKnownPresetDecklistPrior({
      deckPresetId,
      faction,
      visibleHandCount: ownHandCount,
    }) ?? {
      priorId: KNOWN_PRESET_DECKLIST_PRIOR_ID,
      priorStatus: "prior_unavailable" as const,
      deckPresetId,
      faction,
      mainDeckCardCount: 0,
      sideDeckCardCount: 0,
      totalDeckCardCount: 0,
      knownVisibleCardCount: 0,
      priorRemainingCardCount: 0,
    };

  const validation = buildSampledWorldValidation({
    deckPresetId,
    opponentHandCount,
    opponentDeckCount,
    sampleCount: DEFAULT_SAMPLE_COUNT,
    priorTotalCardCount: priorInfo.mainDeckCardCount,
  });

  const abstractionMap = new Map<string, PublicSearchActionAbstraction>();

  legalMoves.forEach((move) => {
    const abstraction = buildPublicActionAbstraction(
      move,
      state.phase,
      state.round,
    );
    const key = [
      abstraction.kind,
      abstraction.targetKind,
      abstraction.targetSide,
      abstraction.targetRow ?? "",
      abstraction.phase,
      abstraction.round,
      abstraction.sourceClass,
      abstraction.strengthBucket ?? "empty",
      abstraction.optionIndexLabel ?? "",
    ].join("|");

    const existing = abstractionMap.get(key);
    if (existing) {
      existing.moveCount += 1;
    } else {
      abstractionMap.set(key, { ...abstraction, moveCount: 1 });
    }
  });

  const collapsed = [...abstractionMap.values()];
  const publicActionCount = collapsed.length;
  const publicActionCollisionCount =
    legalMoves.length - publicActionCount;
  const largestPublicActionBucketSize = Math.max(
    1,
    ...collapsed.map((a) => a.moveCount),
  );

  const publicActionKindCounts: Record<string, number> = {};
  const targetKindCounts: Record<string, number> = {};
  const targetSideCounts: Record<string, number> = {};

  collapsed.forEach((ab) => {
    publicActionKindCounts[ab.kind] =
      (publicActionKindCounts[ab.kind] ?? 0) + ab.moveCount;
    targetKindCounts[ab.targetKind] =
      (targetKindCounts[ab.targetKind] ?? 0) + ab.moveCount;
    targetSideCounts[ab.targetSide] =
      (targetSideCounts[ab.targetSide] ?? 0) + ab.moveCount;
  });

  const rootWithoutFingerprint: Omit<
    SamplerReadinessRootRecord,
    "rootPublicFingerprint"
  > = {
    schemaVersion: "sampler-readiness-root-v1",
    samplerRunId,
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
    faction,
    deckPresetId,
    priorId: priorInfo.priorId,
    priorStatus: priorInfo.priorStatus,
    sampleCountRequested: validation.sampleCountRequested,
    sampleCountGenerated: validation.sampleCountGenerated,
    sampleCountValid: validation.sampleCountValid,
    sampleCountInvalid: validation.sampleCountInvalid,
    rootValidationStatus: validation.rootValidationStatus,
    invalidReasonCounts: validation.invalidReasonCounts,
    opponentHiddenPoolSizeBucket: validation.opponentHiddenPoolSizeBucket,
    opponentHandCount: validation.opponentHandCount,
    opponentDeckCount: validation.opponentDeckCount,
    knownVisibleCardCountBucket: validation.knownVisibleCardCountBucket,
    priorRemainingCardCountBucket: validation.priorRemainingCardCountBucket,
    legalMoveCount: legalMoves.length,
    publicActionCount,
    publicActionCollisionCount,
    largestPublicActionBucketSize,
    publicActionKindCounts: sortEntries(publicActionKindCounts),
    targetKindCounts: sortEntries(targetKindCounts),
    targetSideCounts: sortEntries(targetSideCounts),
  };

  const rootPublicFingerprint = hashSamplerReadinessPublicValue(
    rootWithoutFingerprint,
  );

  return {
    ...rootWithoutFingerprint,
    rootPublicFingerprint,
  };
};

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

export const buildSamplerReadinessSummary = ({
  samplerRunId,
  suiteId,
  roots,
  benchmarkSummary,
}: {
  samplerRunId: string;
  suiteId: string;
  roots: readonly SamplerReadinessRootRecord[];
  benchmarkSummary: BenchmarkRunResult["summary"];
}): SamplerReadinessSummary => {
  const maxPublicActionRoot = maxBy(roots, (root) => root.publicActionCount);
  const maxCollisionRoot = maxBy(roots, (root) => root.publicActionCollisionCount);

  return {
    schemaVersion: "sampler-readiness-summary-v1",
    samplerRunId,
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
    priorStatusCounts: countBy(
      roots.map((root) => root.priorStatus),
    ) as Record<SamplerReadinessPriorStatus, number>,
    validationStatusCounts: countBy(
      roots.map((root) => root.rootValidationStatus),
    ) as Record<SamplerReadinessRootValidationStatus, number>,
    invalidReasonCounts: countBy(
      roots.flatMap((root) =>
        Object.entries(root.invalidReasonCounts).flatMap(
          ([reason, count]) => Array(count).fill(reason),
        ),
      ),
    ),
    sampleCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.sampleCountValid),
    ),
    publicActionCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.publicActionCount),
    ),
    collisionCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.publicActionCollisionCount),
    ),
    legalMoveCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.legalMoveCount),
    ),
    largestBucketStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.largestPublicActionBucketSize),
    ),
    maxPublicActionRoot: maxPublicActionRoot
      ? {
          rootPublicFingerprint: maxPublicActionRoot.rootPublicFingerprint,
          suiteId: maxPublicActionRoot.suiteId,
          matchupId: maxPublicActionRoot.matchupId,
          seed: maxPublicActionRoot.seed,
          ...(maxPublicActionRoot.mirrorIndex === undefined ? {} : { mirrorIndex: maxPublicActionRoot.mirrorIndex }),
          step: maxPublicActionRoot.step,
          phase: maxPublicActionRoot.phase,
          round: maxPublicActionRoot.round,
          seatId: maxPublicActionRoot.seatId,
          policyId: maxPublicActionRoot.policyId,
          faction: maxPublicActionRoot.faction,
          deckPresetId: maxPublicActionRoot.deckPresetId,
          publicActionCount: maxPublicActionRoot.publicActionCount,
        }
      : null,
    maxCollisionRoot: maxCollisionRoot
      ? {
          rootPublicFingerprint: maxCollisionRoot.rootPublicFingerprint,
          suiteId: maxCollisionRoot.suiteId,
          matchupId: maxCollisionRoot.matchupId,
          seed: maxCollisionRoot.seed,
          ...(maxCollisionRoot.mirrorIndex === undefined ? {} : { mirrorIndex: maxCollisionRoot.mirrorIndex }),
          step: maxCollisionRoot.step,
          phase: maxCollisionRoot.phase,
          round: maxCollisionRoot.round,
          seatId: maxCollisionRoot.seatId,
          policyId: maxCollisionRoot.policyId,
          faction: maxCollisionRoot.faction,
          deckPresetId: maxCollisionRoot.deckPresetId,
          publicActionCollisionCount: maxCollisionRoot.publicActionCollisionCount,
        }
      : null,
    hiddenInfoSafetyNote:
      "Sampler-readiness artifacts contain public root metadata, scalar/count summaries, and action-abstraction statistics only. They exclude raw state, private card payloads, command/event payloads, runtime card identifiers, and sampled hidden identities.",
    explicitNonSearchWarning:
      "cFp60 sampler-readiness artifacts are evaluation infrastructure only. No rollout, search, action-evaluation, or policy-behavior change occurred. These artifacts do not constitute search strength, a new gameplay policy, or product difficulty.",
  };
};

const defaultSamplerRunId = (input: SamplerReadinessProfileInput) =>
  `${input.suiteId ?? input.suite?.id ?? "benchmark-smoke-v1"}:sampler-readiness:cFp60`;

export const runSamplerReadinessProfile = (
  input: SamplerReadinessProfileInput = {},
): SamplerReadinessProfileResult => {
  const samplerRunId = input.samplerRunId ?? defaultSamplerRunId(input);
  const roots: SamplerReadinessRootRecord[] = [];

  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: samplerRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      roots.push(
        buildSamplerReadinessRootRecord({
          ...root,
          samplerRunId,
        }),
      );
    },
  });

  const suiteId = benchmark.summary.suiteId;

  return {
    samplerRunId,
    suiteId,
    sourceBenchmarkSuiteId: suiteId,
    benchmark,
    roots,
    summary: buildSamplerReadinessSummary({
      samplerRunId,
      suiteId,
      roots,
      benchmarkSummary: benchmark.summary,
    }),
  };
};
