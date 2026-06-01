import type { CatalogFaction } from "@/game/catalog";
import type { CardInstanceId, MatchPhase, MatchState, SeatId } from "@/game/core";

import { getBenchmarkDeckDescriptor } from "./decks";
import { runBenchmarkSuite } from "./runBenchmark";
import {
  DEFAULT_SAMPLE_COUNT,
  KNOWN_PRESET_DECKLIST_PRIOR_ID,
  KNOWN_PRESET_DECK_PRESET_IDS,
  buildSamplerReadinessCountStats,
  hashSamplerReadinessPublicValue,
  type SamplerReadinessCountStats,
  type SamplerReadinessPriorId,
  type SamplerReadinessPriorStatus,
} from "./samplerReadiness";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSuite,
} from "./types";

export type SamplerMaterializationRootSchemaVersion =
  "sampler-materialization-root-v1";
export type SamplerMaterializationSummarySchemaVersion =
  "sampler-materialization-summary-v1";

export type SamplerMaterializationStatus =
  | "valid"
  | "invalid"
  | "prior_unavailable";

export type DuplicatePressureBucket = "none" | "pair" | "triple_plus";
export type HandDeckOverlapBucket = "none" | "one" | "two_to_three" | "four_plus";

export interface KnownPresetSourceMultisetPrior {
  priorId: SamplerReadinessPriorId;
  priorStatus: SamplerReadinessPriorStatus;
  deckPresetId: string;
  faction: string;
  mainDeckCardCount: number;
  sideDeckCardCount: number;
  totalDeckCardCount: number;
  mainDeckSourceCounts: Record<string, number>;
  sideDeckSourceCounts: Record<string, number>;
}

export interface MaterializedHiddenMultisetSample {
  sampleIndex: number;
  handSourceCounts: Record<string, number>;
  deckSourceCounts: Record<string, number>;
}

export interface PublicKnownSourceSubtractionResult {
  publicKnownSourceCounts: Record<string, number>;
  fixedKnownHandSourceCounts: Record<string, number>;
  mainDeckAttributablePublicCount: number;
  sideDeckOnlyPublicCount: number;
  offPriorPublicCount: number;
  publicAdjustmentCount: number;
  uncoveredPriorDeficitCount: number;
  publicAdjustmentReasonCounts: Record<string, number>;
  publicKnownCardCount: number;
  fixedKnownHandCardCount: number;
  duplicatePublicReferenceCount: number;
  duplicateFixedKnownHandReferenceCount: number;
  remainingSourceCounts: Record<string, number>;
  priorRemainingCardCount: number;
  invalidReasonCounts: Record<string, number>;
}

export interface HiddenMultisetMaterializationInput {
  samplerRunId: string;
  rootPublicFingerprint: string;
  priorSourceCounts: Record<string, number>;
  remainingSourceCounts: Record<string, number>;
  fixedKnownHandSourceCounts?: Record<string, number>;
  opponentHandCount: number;
  opponentDeckCount: number;
  sampleCount?: number;
}

export interface HiddenMultisetMaterializationResult {
  materializationStatus: SamplerMaterializationStatus;
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountValid: number;
  sampleCountInvalid: number;
  invalidReasonCounts: Record<string, number>;
  samples: MaterializedHiddenMultisetSample[];
  sampleAggregateStats: SamplerMaterializationSampleAggregateStats;
}

export interface SamplerMaterializationSampleAggregateStats {
  handUniqueSourceCountMin: number;
  handUniqueSourceCountMax: number;
  handUniqueSourceCountAverage: number;
  deckUniqueSourceCountMin: number;
  deckUniqueSourceCountMax: number;
  deckUniqueSourceCountAverage: number;
  handDuplicatePressureBucketCounts: Record<DuplicatePressureBucket, number>;
  deckDuplicatePressureBucketCounts: Record<DuplicatePressureBucket, number>;
  handDeckOverlapBucketCounts: Record<HandDeckOverlapBucket, number>;
}

export interface SamplerMaterializationSampleCountStats {
  requested: SamplerReadinessCountStats;
  generated: SamplerReadinessCountStats;
  valid: SamplerReadinessCountStats;
  invalid: SamplerReadinessCountStats;
}

export interface SamplerMaterializationRootRecord {
  schemaVersion: SamplerMaterializationRootSchemaVersion;
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
  materializationStatus: SamplerMaterializationStatus;
  sampleCountRequested: number;
  sampleCountGenerated: number;
  sampleCountValid: number;
  sampleCountInvalid: number;
  invalidReasonCounts: Record<string, number>;
  opponentHiddenPoolSizeBucket: string;
  opponentHandCount: number;
  opponentDeckCount: number;
  duplicatePublicReferenceCount: number;
  duplicateFixedKnownHandReferenceCount: number;
  uniquePublicKnownCardCount: number;
  uniqueFixedKnownHandCardCount: number;
  mainDeckAttributablePublicCount: number;
  sideDeckOnlyPublicCount: number;
  offPriorPublicCount: number;
  publicAdjustmentCount: number;
  uncoveredPriorDeficitCount: number;
  publicAdjustmentReasonCounts: Record<string, number>;
  availableHiddenPoolSizeBucket: string;
  publicKnownCardCountBucket: string;
  priorRemainingCardCountBucket: string;
  handUniqueSourceCountMin: number;
  handUniqueSourceCountMax: number;
  handUniqueSourceCountAverage: number;
  deckUniqueSourceCountMin: number;
  deckUniqueSourceCountMax: number;
  deckUniqueSourceCountAverage: number;
  handDuplicatePressureBucketCounts: Record<DuplicatePressureBucket, number>;
  deckDuplicatePressureBucketCounts: Record<DuplicatePressureBucket, number>;
  handDeckOverlapBucketCounts: Record<HandDeckOverlapBucket, number>;
  rootPublicFingerprint: string;
}

export interface SamplerMaterializationSummary {
  schemaVersion: SamplerMaterializationSummarySchemaVersion;
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
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
  priorStatusCounts: Record<string, number>;
  materializationStatusCounts: Record<string, number>;
  invalidReasonCounts: Record<string, number>;
  duplicatePublicReferenceTotal: number;
  duplicateFixedKnownHandReferenceTotal: number;
  sideDeckOnlyPublicTotal: number;
  offPriorPublicTotal: number;
  publicAdjustmentTotal: number;
  uncoveredPriorDeficitTotal: number;
  publicAdjustmentReasonCounts: Record<string, number>;
  duplicatePublicReferenceCountStats: SamplerReadinessCountStats;
  duplicateFixedKnownHandReferenceCountStats: SamplerReadinessCountStats;
  uniquePublicKnownCardCountStats: SamplerReadinessCountStats;
  uniqueFixedKnownHandCardCountStats: SamplerReadinessCountStats;
  mainDeckAttributablePublicCountStats: SamplerReadinessCountStats;
  sideDeckOnlyPublicCountStats: SamplerReadinessCountStats;
  offPriorPublicCountStats: SamplerReadinessCountStats;
  publicAdjustmentCountStats: SamplerReadinessCountStats;
  uncoveredPriorDeficitCountStats: SamplerReadinessCountStats;
  sampleCountStats: SamplerMaterializationSampleCountStats;
  handUniqueSourceCountAverageStats: SamplerReadinessCountStats;
  deckUniqueSourceCountAverageStats: SamplerReadinessCountStats;
  handDuplicatePressureBucketCounts: Record<DuplicatePressureBucket, number>;
  deckDuplicatePressureBucketCounts: Record<DuplicatePressureBucket, number>;
  handDeckOverlapBucketCounts: Record<HandDeckOverlapBucket, number>;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
}

export interface SamplerMaterializationProfileResult {
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  benchmark: BenchmarkRunResult;
  roots: SamplerMaterializationRootRecord[];
  summary: SamplerMaterializationSummary;
}

export interface SamplerMaterializationProfileInput {
  suiteId?: string;
  suite?: BenchmarkSuite;
  samplerRunId?: string;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
  sampleCount?: number;
}

export interface BuildSamplerMaterializationRootRecordInput
  extends BenchmarkRootObserverInput {
  samplerRunId: string;
  sampleCount?: number;
}

type MutableCounts = Record<string, number>;

interface PublicKnownCollectionState {
  publicSourceCounts: MutableCounts;
  fixedKnownHandSourceCounts: MutableCounts;
  seenPublicCardIds: Set<CardInstanceId>;
  seenFixedKnownHandCardIds: Set<CardInstanceId>;
  duplicatePublicReferenceCount: number;
  duplicateFixedKnownHandReferenceCount: number;
}

const emptyDuplicatePressureCounts = (): Record<DuplicatePressureBucket, number> => ({
  none: 0,
  pair: 0,
  triple_plus: 0,
});

const emptyOverlapCounts = (): Record<HandDeckOverlapBucket, number> => ({
  none: 0,
  one: 0,
  two_to_three: 0,
  four_plus: 0,
});

const sortEntries = (record: Record<string, number>) =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );

const sumCounts = (record: Record<string, number>) =>
  Object.values(record).reduce((sum, count) => sum + count, 0);

const addCount = (record: MutableCounts, key: string, count = 1) => {
  record[key] = (record[key] ?? 0) + count;
};

const subtractCounts = (
  sourceCounts: Record<string, number>,
  subtract: Record<string, number>,
) => {
  const result: MutableCounts = { ...sourceCounts };
  Object.entries(subtract).forEach(([source, count]) => {
    result[source] = (result[source] ?? 0) - count;
  });
  return sortEntries(
    Object.fromEntries(Object.entries(result).filter(([, count]) => count > 0)),
  );
};

const combineCounts = (
  ...records: readonly Record<string, number>[]
): Record<string, number> => {
  const combined: MutableCounts = {};
  records.forEach((record) => {
    Object.entries(record).forEach(([source, count]) => {
      addCount(combined, source, count);
    });
  });
  return sortEntries(combined);
};

const expandSourceCounts = (sourceCounts: Record<string, number>) =>
  Object.entries(sourceCounts)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([source, count]) => Array.from({ length: count }, () => source));

const countsFromSources = (sources: readonly string[]) => {
  const counts: MutableCounts = {};
  sources.forEach((source) => addCount(counts, source));
  return sortEntries(counts);
};

const roundToThree = (value: number) => Number(value.toFixed(3));

const average = (values: readonly number[]) =>
  values.length === 0
    ? 0
    : roundToThree(values.reduce((sum, value) => sum + value, 0) / values.length);

const bucketCardCount = (value: number) => {
  if (value <= 0) return "none";
  if (value <= 5) return "small";
  if (value <= 15) return "medium";
  return "large";
};

const bucketDuplicatePressure = (
  sourceCounts: Record<string, number>,
): DuplicatePressureBucket => {
  const maxCopies = Math.max(0, ...Object.values(sourceCounts));
  if (maxCopies <= 1) return "none";
  if (maxCopies === 2) return "pair";
  return "triple_plus";
};

const bucketHandDeckOverlap = (
  handSourceCounts: Record<string, number>,
  deckSourceCounts: Record<string, number>,
): HandDeckOverlapBucket => {
  const deckSources = new Set(Object.keys(deckSourceCounts));
  const overlapCount = Object.keys(handSourceCounts).filter((source) =>
    deckSources.has(source),
  ).length;
  if (overlapCount === 0) return "none";
  if (overlapCount === 1) return "one";
  if (overlapCount <= 3) return "two_to_three";
  return "four_plus";
};

const addRecordCounts = <T extends string>(
  target: Record<T, number>,
  source: Record<T, number>,
) => {
  Object.entries(source).forEach(([key, count]) => {
    target[key as T] = (target[key as T] ?? 0) + (count as number);
  });
};

const seedToUint32 = (seed: string) =>
  Number.parseInt(hashSamplerReadinessPublicValue(seed).slice(0, 8), 16) >>> 0;

const mulberry32 = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffled = (values: readonly string[], seed: string) => {
  const result = [...values];
  const random = mulberry32(seedToUint32(seed));
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

export const buildKnownPresetSourceMultisetPrior = ({
  deckPresetId,
  faction,
}: {
  deckPresetId: string;
  faction: string;
}): KnownPresetSourceMultisetPrior => {
  if (!KNOWN_PRESET_DECK_PRESET_IDS.has(deckPresetId)) {
    return {
      priorId: KNOWN_PRESET_DECKLIST_PRIOR_ID,
      priorStatus: "prior_unavailable",
      deckPresetId,
      faction,
      mainDeckCardCount: 0,
      sideDeckCardCount: 0,
      totalDeckCardCount: 0,
      mainDeckSourceCounts: {},
      sideDeckSourceCounts: {},
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
      mainDeckSourceCounts: {},
      sideDeckSourceCounts: {},
    };
  }

  const mainDeckSourceCounts: MutableCounts = {};
  descriptor.deckPreset.mainDeck.forEach((entry) => {
    addCount(mainDeckSourceCounts, entry.sourceId, entry.count);
  });
  const sideDeckSourceCounts: MutableCounts = {};
  descriptor.deckPreset.sideDeck.forEach((entry) => {
    addCount(sideDeckSourceCounts, entry.sourceId, entry.count);
  });

  const mainDeckCardCount = sumCounts(mainDeckSourceCounts);
  const sideDeckCardCount = sumCounts(sideDeckSourceCounts);

  return {
    priorId: KNOWN_PRESET_DECKLIST_PRIOR_ID,
    priorStatus: "prior_available",
    deckPresetId,
    faction,
    mainDeckCardCount,
    sideDeckCardCount,
    totalDeckCardCount: mainDeckCardCount + sideDeckCardCount,
    mainDeckSourceCounts: sortEntries(mainDeckSourceCounts),
    sideDeckSourceCounts: sortEntries(sideDeckSourceCounts),
  };
};

export const buildOpponentKnownPresetSourceMultisetPrior = ({
  seats,
  actingSeatId,
}: {
  seats: BenchmarkRootObserverInput["seats"];
  actingSeatId: SeatId;
}) => {
  const opponentSeatId: SeatId = actingSeatId === "seat_a" ? "seat_b" : "seat_a";
  const opponentSeat = seats[opponentSeatId];
  return buildKnownPresetSourceMultisetPrior({
    deckPresetId: opponentSeat.deckPresetId,
    faction: opponentSeat.faction,
  });
};

export const buildSamplerPublicZoneAccountingAdjustment = ({
  publicSourceCounts,
  mainDeckSourceCounts,
  sideDeckSourceCounts = {},
  duplicatePublicReferenceCount = 0,
  requiredHiddenDrawCount = 0,
}: {
  publicSourceCounts: Record<string, number>;
  mainDeckSourceCounts: Record<string, number>;
  sideDeckSourceCounts?: Record<string, number>;
  duplicatePublicReferenceCount?: number;
  requiredHiddenDrawCount?: number;
}) => {
  const mainDeckAttributablePublicSourceCounts: MutableCounts = {};
  const adjustmentReasonCounts: MutableCounts = {};
  let sideDeckOnlyPublicCount = 0;
  let offPriorPublicCount = 0;

  Object.entries(publicSourceCounts).forEach(([source, count]) => {
    if (Object.prototype.hasOwnProperty.call(mainDeckSourceCounts, source)) {
      addCount(mainDeckAttributablePublicSourceCounts, source, count);
      return;
    }

    if (Object.prototype.hasOwnProperty.call(sideDeckSourceCounts, source)) {
      sideDeckOnlyPublicCount += count;
      addCount(adjustmentReasonCounts, "side_deck_only_public", count);
      return;
    }

    offPriorPublicCount += count;
    addCount(adjustmentReasonCounts, "off_prior_public", count);
  });

  const invalidReasonCounts: MutableCounts = {};
  Object.entries(mainDeckAttributablePublicSourceCounts).forEach(
    ([source, count]) => {
      const priorCount = mainDeckSourceCounts[source] ?? 0;
      if (count > priorCount) {
        addCount(invalidReasonCounts, "public_known_exceeds_prior_copy_count");
      }
    },
  );

  const remainingSourceCounts = subtractCounts(
    mainDeckSourceCounts,
    mainDeckAttributablePublicSourceCounts,
  );
  const priorRemainingCardCount = sumCounts(remainingSourceCounts);
  const publicAdjustmentCount = sideDeckOnlyPublicCount + offPriorPublicCount;

  return {
    publicKnownSourceCounts: sortEntries(mainDeckAttributablePublicSourceCounts),
    mainDeckAttributablePublicCount: sumCounts(
      mainDeckAttributablePublicSourceCounts,
    ),
    sideDeckOnlyPublicCount,
    offPriorPublicCount,
    duplicatePublicReferenceCount,
    publicAdjustmentCount,
    uncoveredPriorDeficitCount: Math.max(
      0,
      requiredHiddenDrawCount - priorRemainingCardCount,
    ),
    publicAdjustmentReasonCounts: sortEntries(adjustmentReasonCounts),
    remainingSourceCounts,
    priorRemainingCardCount,
    invalidReasonCounts: sortEntries(invalidReasonCounts),
  };
};

const collectPublicCard = ({
  cardId,
  state,
  opponentSeatId,
  priorSourceCounts,
  collection,
  markFixedHand,
}: {
  cardId: CardInstanceId | null | undefined;
  state: MatchState;
  opponentSeatId: SeatId;
  priorSourceCounts: Record<string, number>;
  collection: PublicKnownCollectionState;
  markFixedHand?: boolean;
}) => {
  if (!cardId) return;
  const card = state.cardsById[cardId];
  if (!card || card.owner !== opponentSeatId) return;

  if (collection.seenPublicCardIds.has(cardId)) {
    collection.duplicatePublicReferenceCount += 1;
  } else {
    collection.seenPublicCardIds.add(cardId);
    addCount(collection.publicSourceCounts, card.sourceId);
  }

  if (
    markFixedHand &&
    card.zone.kind === "hand" &&
    card.zone.seat === opponentSeatId &&
    Object.prototype.hasOwnProperty.call(priorSourceCounts, card.sourceId)
  ) {
    if (collection.seenFixedKnownHandCardIds.has(cardId)) {
      collection.duplicateFixedKnownHandReferenceCount += 1;
    } else {
      collection.seenFixedKnownHandCardIds.add(cardId);
      addCount(collection.fixedKnownHandSourceCounts, card.sourceId);
    }
  }
};

export const buildPublicKnownSourceSubtraction = ({
  state,
  actingSeatId,
  opponentSeatId,
  priorSourceCounts,
  sideDeckSourceCounts = {},
  opponentHandCount,
  opponentDeckCount,
}: {
  state: MatchState;
  actingSeatId: SeatId;
  opponentSeatId: SeatId;
  priorSourceCounts: Record<string, number>;
  sideDeckSourceCounts?: Record<string, number>;
  opponentHandCount?: number;
  opponentDeckCount?: number;
}): PublicKnownSourceSubtractionResult => {
  const collection: PublicKnownCollectionState = {
    publicSourceCounts: {},
    fixedKnownHandSourceCounts: {},
    seenPublicCardIds: new Set<CardInstanceId>(),
    seenFixedKnownHandCardIds: new Set<CardInstanceId>(),
    duplicatePublicReferenceCount: 0,
    duplicateFixedKnownHandReferenceCount: 0,
  };

  (["seat_a", "seat_b"] as const).forEach((publicSeatId) => {
    const publicSeat = state.seats[publicSeatId];
    (["close", "ranged", "siege"] as const).forEach((row) => {
      publicSeat.board[row].units.forEach((cardId) => {
        collectPublicCard({
          cardId,
          state,
          opponentSeatId,
          priorSourceCounts,
          collection,
        });
      });
      collectPublicCard({
        cardId: publicSeat.board[row].horn,
        state,
        opponentSeatId,
        priorSourceCounts,
        collection,
      });
    });

    publicSeat.discard.forEach((cardId) => {
      collectPublicCard({
        cardId,
        state,
        opponentSeatId,
        priorSourceCounts,
        collection,
      });
    });

    publicSeat.removedFromGame.forEach((cardId) => {
      collectPublicCard({
        cardId,
        state,
        opponentSeatId,
        priorSourceCounts,
        collection,
      });
    });
  });

  state.seats[actingSeatId].hand.forEach((cardId) => {
    collectPublicCard({
      cardId,
      state,
      opponentSeatId,
      priorSourceCounts,
      collection,
    });
  });

  state.weather.entries.forEach((cardId) => {
    collectPublicCard({
      cardId,
      state,
      opponentSeatId,
      priorSourceCounts,
      collection,
    });
  });

  if (state.pendingPrompt?.seatId === actingSeatId) {
    state.pendingPrompt.context?.revealedCardIds?.forEach((cardId) => {
      collectPublicCard({
        cardId,
        state,
        opponentSeatId,
        priorSourceCounts,
        collection,
        markFixedHand: true,
      });
    });
  }

  const fixedKnownHandCardCount = sumCounts(collection.fixedKnownHandSourceCounts);
  const requiredHiddenDrawCount =
    opponentHandCount === undefined || opponentDeckCount === undefined
      ? 0
      : opponentHandCount - fixedKnownHandCardCount + opponentDeckCount;
  const accounting = buildSamplerPublicZoneAccountingAdjustment({
    publicSourceCounts: collection.publicSourceCounts,
    mainDeckSourceCounts: priorSourceCounts,
    sideDeckSourceCounts,
    duplicatePublicReferenceCount: collection.duplicatePublicReferenceCount,
    requiredHiddenDrawCount,
  });

  return {
    publicKnownSourceCounts: accounting.publicKnownSourceCounts,
    fixedKnownHandSourceCounts: sortEntries(collection.fixedKnownHandSourceCounts),
    mainDeckAttributablePublicCount:
      accounting.mainDeckAttributablePublicCount,
    sideDeckOnlyPublicCount: accounting.sideDeckOnlyPublicCount,
    offPriorPublicCount: accounting.offPriorPublicCount,
    publicAdjustmentCount: accounting.publicAdjustmentCount,
    uncoveredPriorDeficitCount: accounting.uncoveredPriorDeficitCount,
    publicAdjustmentReasonCounts: accounting.publicAdjustmentReasonCounts,
    publicKnownCardCount: accounting.mainDeckAttributablePublicCount,
    fixedKnownHandCardCount,
    duplicatePublicReferenceCount: collection.duplicatePublicReferenceCount,
    duplicateFixedKnownHandReferenceCount:
      collection.duplicateFixedKnownHandReferenceCount,
    remainingSourceCounts: accounting.remainingSourceCounts,
    priorRemainingCardCount: accounting.priorRemainingCardCount,
    invalidReasonCounts: accounting.invalidReasonCounts,
  };
};

export const materializeHiddenMultisetSample = ({
  sampleIndex,
  samplerRunId,
  rootPublicFingerprint,
  remainingSourceCounts,
  fixedKnownHandSourceCounts = {},
  hiddenHandDrawCount,
  opponentDeckCount,
}: {
  sampleIndex: number;
  samplerRunId: string;
  rootPublicFingerprint: string;
  remainingSourceCounts: Record<string, number>;
  fixedKnownHandSourceCounts?: Record<string, number>;
  hiddenHandDrawCount: number;
  opponentDeckCount: number;
}): MaterializedHiddenMultisetSample => {
  const pool = expandSourceCounts(remainingSourceCounts);
  const sampleSeed = `${samplerRunId}|${rootPublicFingerprint}|${sampleIndex}`;
  const shuffledPool = shuffled(pool, sampleSeed);
  const handDraw = shuffledPool.slice(0, hiddenHandDrawCount);
  const deckDraw = shuffledPool.slice(
    hiddenHandDrawCount,
    hiddenHandDrawCount + opponentDeckCount,
  );

  return {
    sampleIndex,
    handSourceCounts: combineCounts(
      fixedKnownHandSourceCounts,
      countsFromSources(handDraw),
    ),
    deckSourceCounts: countsFromSources(deckDraw),
  };
};

const validateSample = ({
  sample,
  opponentHandCount,
  opponentDeckCount,
  remainingSourceCounts,
  fixedKnownHandSourceCounts,
}: {
  sample: MaterializedHiddenMultisetSample;
  opponentHandCount: number;
  opponentDeckCount: number;
  remainingSourceCounts: Record<string, number>;
  fixedKnownHandSourceCounts: Record<string, number>;
}) => {
  const reasons: string[] = [];
  if (sumCounts(sample.handSourceCounts) !== opponentHandCount) {
    reasons.push("sample_hand_count_mismatch");
  }
  if (sumCounts(sample.deckSourceCounts) !== opponentDeckCount) {
    reasons.push("sample_deck_count_mismatch");
  }
  if (
    sumCounts(sample.handSourceCounts) + sumCounts(sample.deckSourceCounts) !==
    opponentHandCount + opponentDeckCount
  ) {
    reasons.push("sample_hidden_total_mismatch");
  }

  const drawnCounts = subtractCounts(
    combineCounts(sample.handSourceCounts, sample.deckSourceCounts),
    fixedKnownHandSourceCounts,
  );
  Object.entries(drawnCounts).forEach(([source, count]) => {
    const remainingCount = remainingSourceCounts[source] ?? 0;
    if (remainingCount <= 0) {
      reasons.push("sample_source_outside_prior");
    } else if (count > remainingCount) {
      reasons.push("sample_exceeds_remaining_prior_copy_count");
    }
  });

  return reasons;
};

const buildSampleAggregateStats = (
  samples: readonly MaterializedHiddenMultisetSample[],
): SamplerMaterializationSampleAggregateStats => {
  const handUniqueCounts = samples.map(
    (sample) => Object.keys(sample.handSourceCounts).length,
  );
  const deckUniqueCounts = samples.map(
    (sample) => Object.keys(sample.deckSourceCounts).length,
  );
  const handDuplicatePressureBucketCounts = emptyDuplicatePressureCounts();
  const deckDuplicatePressureBucketCounts = emptyDuplicatePressureCounts();
  const handDeckOverlapBucketCounts = emptyOverlapCounts();

  samples.forEach((sample) => {
    handDuplicatePressureBucketCounts[
      bucketDuplicatePressure(sample.handSourceCounts)
    ] += 1;
    deckDuplicatePressureBucketCounts[
      bucketDuplicatePressure(sample.deckSourceCounts)
    ] += 1;
    handDeckOverlapBucketCounts[
      bucketHandDeckOverlap(sample.handSourceCounts, sample.deckSourceCounts)
    ] += 1;
  });

  return {
    handUniqueSourceCountMin:
      handUniqueCounts.length === 0 ? 0 : Math.min(...handUniqueCounts),
    handUniqueSourceCountMax:
      handUniqueCounts.length === 0 ? 0 : Math.max(...handUniqueCounts),
    handUniqueSourceCountAverage: average(handUniqueCounts),
    deckUniqueSourceCountMin:
      deckUniqueCounts.length === 0 ? 0 : Math.min(...deckUniqueCounts),
    deckUniqueSourceCountMax:
      deckUniqueCounts.length === 0 ? 0 : Math.max(...deckUniqueCounts),
    deckUniqueSourceCountAverage: average(deckUniqueCounts),
    handDuplicatePressureBucketCounts,
    deckDuplicatePressureBucketCounts,
    handDeckOverlapBucketCounts,
  };
};

export const materializeHiddenMultisets = (
  input: HiddenMultisetMaterializationInput,
): HiddenMultisetMaterializationResult => {
  const sampleCountRequested = input.sampleCount ?? DEFAULT_SAMPLE_COUNT;
  const fixedKnownHandSourceCounts = input.fixedKnownHandSourceCounts ?? {};
  const invalidReasonCounts: MutableCounts = {};
  const fixedKnownHandCardCount = sumCounts(fixedKnownHandSourceCounts);
  const hiddenHandDrawCount = input.opponentHandCount - fixedKnownHandCardCount;
  const requiredDrawCount = hiddenHandDrawCount + input.opponentDeckCount;
  const remainingCount = sumCounts(input.remainingSourceCounts);

  if (input.opponentHandCount < 0) {
    addCount(invalidReasonCounts, "negative_opponent_hand_count");
  }
  if (input.opponentDeckCount < 0) {
    addCount(invalidReasonCounts, "negative_opponent_deck_count");
  }
  if (hiddenHandDrawCount < 0) {
    addCount(invalidReasonCounts, "public_known_hand_exceeds_opponent_hand_count");
  } else if (remainingCount < requiredDrawCount) {
    addCount(invalidReasonCounts, "insufficient_prior_remaining");
  } else if (remainingCount > requiredDrawCount) {
    addCount(invalidReasonCounts, "prior_remaining_exceeds_observed_hidden_count");
  }

  if (Object.keys(invalidReasonCounts).length > 0) {
    return {
      materializationStatus: "invalid",
      sampleCountRequested,
      sampleCountGenerated: 0,
      sampleCountValid: 0,
      sampleCountInvalid: 0,
      invalidReasonCounts: sortEntries(invalidReasonCounts),
      samples: [],
      sampleAggregateStats: buildSampleAggregateStats([]),
    };
  }

  const samples = Array.from({ length: sampleCountRequested }, (_, sampleIndex) =>
    materializeHiddenMultisetSample({
      sampleIndex,
      samplerRunId: input.samplerRunId,
      rootPublicFingerprint: input.rootPublicFingerprint,
      remainingSourceCounts: input.remainingSourceCounts,
      fixedKnownHandSourceCounts,
      hiddenHandDrawCount,
      opponentDeckCount: input.opponentDeckCount,
    }),
  );

  let sampleCountInvalid = 0;
  samples.forEach((sample) => {
    const sampleReasons = validateSample({
      sample,
      opponentHandCount: input.opponentHandCount,
      opponentDeckCount: input.opponentDeckCount,
      remainingSourceCounts: input.remainingSourceCounts,
      fixedKnownHandSourceCounts,
    });
    if (sampleReasons.length > 0) {
      sampleCountInvalid += 1;
      [...new Set(sampleReasons)].forEach((reason) =>
        addCount(invalidReasonCounts, reason),
      );
    }
  });

  const sampleCountValid = sampleCountRequested - sampleCountInvalid;

  return {
    materializationStatus:
      sampleCountInvalid > 0 ? "invalid" : "valid",
    sampleCountRequested,
    sampleCountGenerated: samples.length,
    sampleCountValid,
    sampleCountInvalid,
    invalidReasonCounts: sortEntries(invalidReasonCounts),
    samples,
    sampleAggregateStats: buildSampleAggregateStats(samples),
  };
};

const countBy = <T extends string>(values: readonly T[]): Record<T, number> => {
  const counts = {} as Record<T, number>;
  values.forEach((value) => {
    counts[value] = (counts[value] ?? 0) + 1;
  });
  return sortEntries(counts) as Record<T, number>;
};

const sortedUnique = <T extends string>(values: readonly T[]): T[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

export const buildSamplerMaterializationRootRecord = ({
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
  seats,
  sampleCount = DEFAULT_SAMPLE_COUNT,
}: BuildSamplerMaterializationRootRecordInput): SamplerMaterializationRootRecord => {
  const seat = seats[seatId];
  const opponentSeatId: SeatId = seatId === "seat_a" ? "seat_b" : "seat_a";
  const opponentSeat = seats[opponentSeatId];
  const opponentHandCount = state.seats[opponentSeatId].hand.length;
  const opponentDeckCount = state.seats[opponentSeatId].deck.length;

  const prior = buildKnownPresetSourceMultisetPrior({
    deckPresetId: opponentSeat.deckPresetId,
    faction: opponentSeat.faction,
  });

  const publicKnown =
    prior.priorStatus === "prior_available"
      ? buildPublicKnownSourceSubtraction({
          state,
          actingSeatId: seatId,
          opponentSeatId,
          priorSourceCounts: prior.mainDeckSourceCounts,
          sideDeckSourceCounts: prior.sideDeckSourceCounts,
          opponentHandCount,
          opponentDeckCount,
        })
      : {
          publicKnownSourceCounts: {},
          fixedKnownHandSourceCounts: {},
          mainDeckAttributablePublicCount: 0,
          sideDeckOnlyPublicCount: 0,
          offPriorPublicCount: 0,
          publicAdjustmentCount: 0,
          uncoveredPriorDeficitCount: 0,
          publicAdjustmentReasonCounts: {},
          publicKnownCardCount: 0,
          fixedKnownHandCardCount: 0,
          duplicatePublicReferenceCount: 0,
          duplicateFixedKnownHandReferenceCount: 0,
          remainingSourceCounts: {},
          priorRemainingCardCount: 0,
          invalidReasonCounts: {},
        };

  const rootPublicFingerprint = hashSamplerReadinessPublicValue({
    samplerRunId,
    suiteId,
    matchupId,
    seed,
    mirrorGroupId,
    mirrorIndex,
    step,
    decisionIndex,
    phase: state.phase,
    round: state.round,
    seatId,
    policyId,
    faction: seat.faction,
    deckPresetId: seat.deckPresetId,
    priorId: prior.priorId,
    priorStatus: prior.priorStatus,
    opponentHandCount,
    opponentDeckCount,
    publicKnownCardCount: publicKnown.publicKnownCardCount,
    duplicatePublicReferenceCount: publicKnown.duplicatePublicReferenceCount,
    duplicateFixedKnownHandReferenceCount:
      publicKnown.duplicateFixedKnownHandReferenceCount,
    priorRemainingCardCount: publicKnown.priorRemainingCardCount,
  });

  const preMaterializationInvalidReasons: MutableCounts = {};
  if (prior.priorStatus === "prior_available") {
    const unknownOpponentHandCount =
      opponentHandCount - publicKnown.fixedKnownHandCardCount;
    const expectedRemainingHiddenCount =
      unknownOpponentHandCount + opponentDeckCount;

    if (publicKnown.fixedKnownHandCardCount > opponentHandCount) {
      addCount(
        preMaterializationInvalidReasons,
        "public_known_hand_exceeds_opponent_hand_count",
      );
    } else if (publicKnown.priorRemainingCardCount < expectedRemainingHiddenCount) {
      addCount(preMaterializationInvalidReasons, "insufficient_prior_remaining");
    } else if (publicKnown.priorRemainingCardCount > expectedRemainingHiddenCount) {
      addCount(
        preMaterializationInvalidReasons,
        "prior_remaining_exceeds_observed_hidden_count",
      );
    }
  }

  const materialization =
    prior.priorStatus === "prior_available" &&
    Object.keys(preMaterializationInvalidReasons).length === 0
      ? materializeHiddenMultisets({
          samplerRunId,
          rootPublicFingerprint,
          priorSourceCounts: prior.mainDeckSourceCounts,
          remainingSourceCounts: publicKnown.remainingSourceCounts,
          fixedKnownHandSourceCounts: publicKnown.fixedKnownHandSourceCounts,
          opponentHandCount,
          opponentDeckCount,
          sampleCount,
        })
      : prior.priorStatus === "prior_available"
        ? {
            materializationStatus: "invalid" as const,
            sampleCountRequested: sampleCount,
            sampleCountGenerated: 0,
            sampleCountValid: 0,
            sampleCountInvalid: 0,
            invalidReasonCounts: {},
            samples: [],
            sampleAggregateStats: buildSampleAggregateStats([]),
          }
      : {
          materializationStatus: "prior_unavailable" as const,
          sampleCountRequested: sampleCount,
          sampleCountGenerated: 0,
          sampleCountValid: 0,
          sampleCountInvalid: 0,
          invalidReasonCounts: { prior_unavailable: 1 },
          samples: [],
          sampleAggregateStats: buildSampleAggregateStats([]),
        };

  const invalidReasonCounts = sortEntries(
    combineCounts(
      publicKnown.invalidReasonCounts,
      preMaterializationInvalidReasons,
      materialization.invalidReasonCounts,
    ),
  );
  const materializationStatus =
    Object.keys(publicKnown.invalidReasonCounts).length > 0
      ? "invalid"
      : materialization.materializationStatus;

  const hiddenPoolSize = opponentHandCount + opponentDeckCount;
  const aggregateStats = materialization.sampleAggregateStats;

  return {
    schemaVersion: "sampler-materialization-root-v1",
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
    faction: seat.faction,
    deckPresetId: seat.deckPresetId,
    priorId: prior.priorId,
    priorStatus: prior.priorStatus,
    materializationStatus,
    sampleCountRequested: materialization.sampleCountRequested,
    sampleCountGenerated:
      materializationStatus === "valid" ? materialization.sampleCountGenerated : 0,
    sampleCountValid:
      materializationStatus === "valid" ? materialization.sampleCountValid : 0,
    sampleCountInvalid:
      materializationStatus === "valid" ? materialization.sampleCountInvalid : 0,
    invalidReasonCounts,
    opponentHiddenPoolSizeBucket: bucketCardCount(hiddenPoolSize),
    opponentHandCount,
    opponentDeckCount,
    duplicatePublicReferenceCount: publicKnown.duplicatePublicReferenceCount,
    duplicateFixedKnownHandReferenceCount:
      publicKnown.duplicateFixedKnownHandReferenceCount,
    uniquePublicKnownCardCount: publicKnown.publicKnownCardCount,
    uniqueFixedKnownHandCardCount: publicKnown.fixedKnownHandCardCount,
    mainDeckAttributablePublicCount:
      publicKnown.mainDeckAttributablePublicCount,
    sideDeckOnlyPublicCount: publicKnown.sideDeckOnlyPublicCount,
    offPriorPublicCount: publicKnown.offPriorPublicCount,
    publicAdjustmentCount: publicKnown.publicAdjustmentCount,
    uncoveredPriorDeficitCount: publicKnown.uncoveredPriorDeficitCount,
    publicAdjustmentReasonCounts: publicKnown.publicAdjustmentReasonCounts,
    availableHiddenPoolSizeBucket: bucketCardCount(publicKnown.priorRemainingCardCount),
    publicKnownCardCountBucket: bucketCardCount(publicKnown.publicKnownCardCount),
    priorRemainingCardCountBucket: bucketCardCount(publicKnown.priorRemainingCardCount),
    handUniqueSourceCountMin: aggregateStats.handUniqueSourceCountMin,
    handUniqueSourceCountMax: aggregateStats.handUniqueSourceCountMax,
    handUniqueSourceCountAverage: aggregateStats.handUniqueSourceCountAverage,
    deckUniqueSourceCountMin: aggregateStats.deckUniqueSourceCountMin,
    deckUniqueSourceCountMax: aggregateStats.deckUniqueSourceCountMax,
    deckUniqueSourceCountAverage: aggregateStats.deckUniqueSourceCountAverage,
    handDuplicatePressureBucketCounts: aggregateStats.handDuplicatePressureBucketCounts,
    deckDuplicatePressureBucketCounts: aggregateStats.deckDuplicatePressureBucketCounts,
    handDeckOverlapBucketCounts: aggregateStats.handDeckOverlapBucketCounts,
    rootPublicFingerprint,
  };
};

export const buildSamplerMaterializationSummary = ({
  samplerRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  roots,
  benchmarkSummary,
}: {
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  roots: readonly SamplerMaterializationRootRecord[];
  benchmarkSummary: BenchmarkRunResult["summary"];
}): SamplerMaterializationSummary => {
  const handDuplicatePressureBucketCounts = emptyDuplicatePressureCounts();
  const deckDuplicatePressureBucketCounts = emptyDuplicatePressureCounts();
  const handDeckOverlapBucketCounts = emptyOverlapCounts();
  const publicAdjustmentReasonCounts: MutableCounts = {};

  roots.forEach((root) => {
    addRecordCounts(
      handDuplicatePressureBucketCounts,
      root.handDuplicatePressureBucketCounts,
    );
    addRecordCounts(
      deckDuplicatePressureBucketCounts,
      root.deckDuplicatePressureBucketCounts,
    );
    addRecordCounts(handDeckOverlapBucketCounts, root.handDeckOverlapBucketCounts);
    Object.entries(root.publicAdjustmentReasonCounts).forEach(([reason, count]) => {
      addCount(publicAdjustmentReasonCounts, reason, count);
    });
  });

  return {
    schemaVersion: "sampler-materialization-summary-v1",
    samplerRunId,
    suiteId,
    sourceBenchmarkSuiteId,
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
    priorStatusCounts: countBy(roots.map((root) => root.priorStatus)),
    materializationStatusCounts: countBy(
      roots.map((root) => root.materializationStatus),
    ),
    invalidReasonCounts: countBy(
      roots.flatMap((root) =>
        Object.entries(root.invalidReasonCounts).flatMap(([reason, count]) =>
          Array.from({ length: count }, () => reason),
        ),
      ),
    ),
    duplicatePublicReferenceTotal: roots.reduce(
      (sum, root) => sum + root.duplicatePublicReferenceCount,
      0,
    ),
    duplicateFixedKnownHandReferenceTotal: roots.reduce(
      (sum, root) => sum + root.duplicateFixedKnownHandReferenceCount,
      0,
    ),
    sideDeckOnlyPublicTotal: roots.reduce(
      (sum, root) => sum + root.sideDeckOnlyPublicCount,
      0,
    ),
    offPriorPublicTotal: roots.reduce(
      (sum, root) => sum + root.offPriorPublicCount,
      0,
    ),
    publicAdjustmentTotal: roots.reduce(
      (sum, root) => sum + root.publicAdjustmentCount,
      0,
    ),
    uncoveredPriorDeficitTotal: roots.reduce(
      (sum, root) => sum + root.uncoveredPriorDeficitCount,
      0,
    ),
    publicAdjustmentReasonCounts: sortEntries(publicAdjustmentReasonCounts),
    duplicatePublicReferenceCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.duplicatePublicReferenceCount),
    ),
    duplicateFixedKnownHandReferenceCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.duplicateFixedKnownHandReferenceCount),
    ),
    uniquePublicKnownCardCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.uniquePublicKnownCardCount),
    ),
    uniqueFixedKnownHandCardCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.uniqueFixedKnownHandCardCount),
    ),
    mainDeckAttributablePublicCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.mainDeckAttributablePublicCount),
    ),
    sideDeckOnlyPublicCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.sideDeckOnlyPublicCount),
    ),
    offPriorPublicCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.offPriorPublicCount),
    ),
    publicAdjustmentCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.publicAdjustmentCount),
    ),
    uncoveredPriorDeficitCountStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.uncoveredPriorDeficitCount),
    ),
    sampleCountStats: {
      requested: buildSamplerReadinessCountStats(
        roots.map((root) => root.sampleCountRequested),
      ),
      generated: buildSamplerReadinessCountStats(
        roots.map((root) => root.sampleCountGenerated),
      ),
      valid: buildSamplerReadinessCountStats(
        roots.map((root) => root.sampleCountValid),
      ),
      invalid: buildSamplerReadinessCountStats(
        roots.map((root) => root.sampleCountInvalid),
      ),
    },
    handUniqueSourceCountAverageStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.handUniqueSourceCountAverage),
    ),
    deckUniqueSourceCountAverageStats: buildSamplerReadinessCountStats(
      roots.map((root) => root.deckUniqueSourceCountAverage),
    ),
    handDuplicatePressureBucketCounts,
    deckDuplicatePressureBucketCounts,
    handDeckOverlapBucketCounts,
    hiddenInfoSafetyNote:
      "Sampler-materialization artifacts contain only public root metadata, scalar counts, status distributions, and aggregate sample statistics. They exclude sampled hand maps, sampled deck maps, deck order, raw state, raw moves, runtime card identifiers, and card identity strings.",
    explicitNonSearchWarning:
      "cFp61 sampler-materialization artifacts are infrastructure only. No rollout, PIMC, ISMCTS, MCTS, action evaluation, action ranking, policy behavior, or product difficulty changed.",
  };
};

const defaultSamplerRunId = (input: SamplerMaterializationProfileInput) =>
  `${input.suiteId ?? input.suite?.id ?? "benchmark-smoke-v1"}:sampler-materialization:cFp61`;

export const runSamplerMaterializationProfile = (
  input: SamplerMaterializationProfileInput = {},
): SamplerMaterializationProfileResult => {
  const samplerRunId = input.samplerRunId ?? defaultSamplerRunId(input);
  const roots: SamplerMaterializationRootRecord[] = [];

  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: samplerRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      roots.push(
        buildSamplerMaterializationRootRecord({
          ...root,
          samplerRunId,
          sampleCount: input.sampleCount,
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
    summary: buildSamplerMaterializationSummary({
      samplerRunId,
      suiteId,
      sourceBenchmarkSuiteId: suiteId,
      roots,
      benchmarkSummary: benchmark.summary,
    }),
  };
};
