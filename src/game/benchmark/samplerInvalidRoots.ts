import type { CatalogFaction } from "@/game/catalog";
import type { CardInstanceId, MatchPhase, MatchState, SeatId } from "@/game/core";

import {
  buildKnownPresetSourceMultisetPrior,
  buildPublicKnownSourceSubtraction,
  buildSamplerMaterializationRootRecord,
  type PublicKnownSourceSubtractionResult,
  type SamplerMaterializationRootRecord,
} from "./samplerMaterialization";
import { buildSamplerReadinessCountStats, type SamplerReadinessCountStats, type SamplerReadinessPriorStatus } from "./samplerReadiness";
import { runBenchmarkSuite } from "./runBenchmark";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSuite,
} from "./types";

export type SamplerInvalidRootSchemaVersion = "sampler-invalid-root-v1";
export type SamplerInvalidRootSummarySchemaVersion =
  "sampler-invalid-root-summary-v1";

export type SamplerInvalidRootClassification =
  | "public_known_exceeds_prior_copy_count"
  | "fixed_hand_exceeds_observed_hand"
  | "prompt_revealed_hand_deficit"
  | "public_zone_count_deficit"
  | "raw_hidden_count_exceeds_prior"
  | "prior_remaining_excess"
  | "negative_or_incoherent_public_count"
  | "other_invalid_root";

export type SamplerInvalidRootReason =
  | "public_known_exceeds_prior_copy_count"
  | "insufficient_prior_remaining"
  | "prior_remaining_exceeds_observed_hidden_count"
  | "negative_opponent_hand_count"
  | "negative_opponent_deck_count"
  | "public_known_hand_exceeds_opponent_hand_count"
  | "other_invalid_root";

export interface PublicKnownZoneCountSummary {
  opponentBoardUnitCount: number;
  opponentRowHornCount: number;
  opponentDiscardCount: number;
  opponentRemovedFromGameCount: number;
  opponentWeatherCount: number;
  actingHandKnownOpponentOwnedCount: number;
  promptRevealedOpponentHandCount: number;
  duplicatePublicReferenceCount: number;
  duplicateFixedKnownHandReferenceCount: number;
  uniquePublicKnownCardCount: number;
  uniqueFixedKnownHandCardCount: number;
  otherPublicKnownCount: number;
}

export interface SamplerInvalidRootRecord {
  schemaVersion: SamplerInvalidRootSchemaVersion;
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
  priorStatus: SamplerReadinessPriorStatus;
  materializationStatus: "invalid";
  invalidReason: SamplerInvalidRootReason;
  classification: SamplerInvalidRootClassification;
  opponentHandCount: number;
  opponentDeckCount: number;
  opponentHiddenCount: number;
  priorMainDeckCardCount: number;
  priorRemainingCardCount: number;
  publicKnownCardCount: number;
  fixedKnownHandCardCount: number;
  duplicatePublicReferenceCount: number;
  duplicateFixedKnownHandReferenceCount: number;
  uniquePublicKnownCardCount: number;
  uniqueFixedKnownHandCardCount: number;
  hiddenHandDrawCount: number;
  requiredHiddenDrawCount: number;
  priorDeficitCount: number;
  priorExcessCount: number;
  publicKnownByZone: PublicKnownZoneCountSummary;
  promptRevealKnownHandCount: number;
  hasPendingPromptForActingSeat: boolean;
  publicKnownCountBucket: string;
  fixedKnownHandCountBucket: string;
  hiddenCountDeficitBucket: string;
  rootPublicFingerprint: string;
}

export interface SamplerInvalidRootSummary {
  schemaVersion: SamplerInvalidRootSummarySchemaVersion;
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  totalRootCount: number;
  invalidRootCount: number;
  validRootCount: number;
  matchCount: number;
  statusCounts: BenchmarkRunResult["summary"]["statusCounts"];
  priorStatusCounts: Record<string, number>;
  materializationStatusCounts: Record<string, number>;
  invalidReasonCounts: Record<string, number>;
  classificationCounts: Record<SamplerInvalidRootClassification, number>;
  invalidRootCountsByPhase: Record<string, number>;
  invalidRootCountsByRound: Record<string, number>;
  invalidRootCountsByFaction: Record<string, number>;
  invalidRootCountsByPolicy: Record<string, number>;
  invalidRootCountsByDeckPreset: Record<string, number>;
  invalidRootCountsByMatchup: Record<string, number>;
  invalidRootCountsByPublicKnownCountBucket: Record<string, number>;
  invalidRootCountsByFixedKnownHandCountBucket: Record<string, number>;
  invalidRootCountsByHiddenCountDeficitBucket: Record<string, number>;
  opponentHandCountStats: SamplerReadinessCountStats;
  opponentDeckCountStats: SamplerReadinessCountStats;
  opponentHiddenCountStats: SamplerReadinessCountStats;
  publicKnownCardCountStats: SamplerReadinessCountStats;
  fixedKnownHandCardCountStats: SamplerReadinessCountStats;
  requiredHiddenDrawCountStats: SamplerReadinessCountStats;
  priorRemainingCardCountStats: SamplerReadinessCountStats;
  priorDeficitCountStats: SamplerReadinessCountStats;
  duplicatePublicReferenceTotal: number;
  duplicateFixedKnownHandReferenceTotal: number;
  duplicatePublicReferenceCountStats: SamplerReadinessCountStats;
  duplicateFixedKnownHandReferenceCountStats: SamplerReadinessCountStats;
  uniquePublicKnownCardCountStats: SamplerReadinessCountStats;
  uniqueFixedKnownHandCardCountStats: SamplerReadinessCountStats;
  invalidRootDuplicatePublicReferenceCountStats: SamplerReadinessCountStats;
  invalidRootDuplicateFixedKnownHandReferenceCountStats: SamplerReadinessCountStats;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
  recommendedNextStep: string;
}

export interface SamplerInvalidRootsProfileResult {
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  benchmark: BenchmarkRunResult;
  materializationRoots: SamplerMaterializationRootRecord[];
  invalidRoots: SamplerInvalidRootRecord[];
  summary: SamplerInvalidRootSummary;
}

export interface SamplerInvalidRootsProfileInput {
  suiteId?: string;
  suite?: BenchmarkSuite;
  samplerRunId?: string;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
  sampleCount?: number;
}

export interface BuildSamplerInvalidRootAnalysisInput
  extends BenchmarkRootObserverInput {
  samplerRunId: string;
  sampleCount?: number;
}

export interface SamplerInvalidRootClassificationInput {
  invalidReasons: readonly string[];
  opponentHandCount: number;
  publicKnownCardCount: number;
  fixedKnownHandCardCount: number;
  promptRevealKnownHandCount: number;
}

export interface SamplerInvalidRootAnalysis {
  materializationRoot: SamplerMaterializationRootRecord;
  invalidRoot: SamplerInvalidRootRecord | null;
}

const emptyClassificationCounts = (): Record<SamplerInvalidRootClassification, number> => ({
  public_known_exceeds_prior_copy_count: 0,
  fixed_hand_exceeds_observed_hand: 0,
  prompt_revealed_hand_deficit: 0,
  public_zone_count_deficit: 0,
  raw_hidden_count_exceeds_prior: 0,
  prior_remaining_excess: 0,
  negative_or_incoherent_public_count: 0,
  other_invalid_root: 0,
});

const sortEntries = <T>(record: Record<string, T>) =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

const countBy = <T extends string>(values: readonly T[]): Record<T, number> => {
  const counts = {} as Record<T, number>;
  values.forEach((value) => {
    counts[value] = (counts[value] ?? 0) + 1;
  });
  return sortEntries(counts) as Record<T, number>;
};

const bucketCount = (value: number) => {
  if (value <= 0) return "none";
  if (value <= 3) return "small";
  if (value <= 8) return "medium";
  return "large";
};

const bucketDeficit = (value: number) => {
  if (value <= 0) return "none";
  if (value === 1) return "one";
  if (value <= 3) return "small";
  if (value <= 8) return "medium";
  return "large";
};

const sortedUnique = <T extends string>(values: readonly T[]): T[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right));

const allInvalidReasons = (
  materializationRoot: SamplerMaterializationRootRecord,
) =>
  sortedUnique(
    Object.entries(materializationRoot.invalidReasonCounts).flatMap(
      ([reason, count]) => Array.from({ length: count }, () => reason),
    ),
  );

const primaryInvalidReason = (
  materializationRoot: SamplerMaterializationRootRecord,
): SamplerInvalidRootReason => {
  const reasons = new Set(Object.keys(materializationRoot.invalidReasonCounts));
  const ordered: readonly SamplerInvalidRootReason[] = [
    "public_known_exceeds_prior_copy_count",
    "insufficient_prior_remaining",
    "prior_remaining_exceeds_observed_hidden_count",
    "negative_opponent_hand_count",
    "negative_opponent_deck_count",
    "public_known_hand_exceeds_opponent_hand_count",
  ];
  return ordered.find((reason) => reasons.has(reason)) ?? "other_invalid_root";
};

export const classifySamplerInvalidRoot = ({
  invalidReasons,
  opponentHandCount,
  publicKnownCardCount,
  fixedKnownHandCardCount,
  promptRevealKnownHandCount,
}: SamplerInvalidRootClassificationInput): SamplerInvalidRootClassification => {
  const reasons = new Set(invalidReasons);

  if (reasons.has("public_known_exceeds_prior_copy_count")) {
    return "public_known_exceeds_prior_copy_count";
  }
  if (fixedKnownHandCardCount > opponentHandCount) {
    return "fixed_hand_exceeds_observed_hand";
  }
  if (
    reasons.has("insufficient_prior_remaining") &&
    promptRevealKnownHandCount > 0
  ) {
    return "prompt_revealed_hand_deficit";
  }
  if (
    reasons.has("insufficient_prior_remaining") &&
    publicKnownCardCount > fixedKnownHandCardCount
  ) {
    return "public_zone_count_deficit";
  }
  if (
    reasons.has("insufficient_prior_remaining") &&
    publicKnownCardCount === 0
  ) {
    return "raw_hidden_count_exceeds_prior";
  }
  if (reasons.has("prior_remaining_exceeds_observed_hidden_count")) {
    return "prior_remaining_excess";
  }
  if (
    reasons.has("negative_opponent_hand_count") ||
    reasons.has("negative_opponent_deck_count") ||
    reasons.has("public_known_hand_exceeds_opponent_hand_count")
  ) {
    return "negative_or_incoherent_public_count";
  }
  return "other_invalid_root";
};

const isOpponentPriorCard = ({
  state,
  cardId,
  opponentSeatId,
  priorSourceCounts,
}: {
  state: MatchState;
  cardId: CardInstanceId | null | undefined;
  opponentSeatId: SeatId;
  priorSourceCounts: Record<string, number>;
}) => {
  if (!cardId) return false;
  const card = state.cardsById[cardId];
  return Boolean(
    card &&
      card.owner === opponentSeatId &&
      Object.prototype.hasOwnProperty.call(priorSourceCounts, card.sourceId),
  );
};

export const buildPublicKnownZoneCountSummary = ({
  state,
  actingSeatId,
  opponentSeatId,
  priorSourceCounts,
}: {
  state: MatchState;
  actingSeatId: SeatId;
  opponentSeatId: SeatId;
  priorSourceCounts: Record<string, number>;
}): PublicKnownZoneCountSummary => {
  const summary: PublicKnownZoneCountSummary = {
    opponentBoardUnitCount: 0,
    opponentRowHornCount: 0,
    opponentDiscardCount: 0,
    opponentRemovedFromGameCount: 0,
    opponentWeatherCount: 0,
    actingHandKnownOpponentOwnedCount: 0,
    promptRevealedOpponentHandCount: 0,
    duplicatePublicReferenceCount: 0,
    duplicateFixedKnownHandReferenceCount: 0,
    uniquePublicKnownCardCount: 0,
    uniqueFixedKnownHandCardCount: 0,
    otherPublicKnownCount: 0,
  };

  (["seat_a", "seat_b"] as const).forEach((publicSeatId) => {
    const publicSeat = state.seats[publicSeatId];
    (["close", "ranged", "siege"] as const).forEach((row) => {
      publicSeat.board[row].units.forEach((cardId) => {
        if (isOpponentPriorCard({ state, cardId, opponentSeatId, priorSourceCounts })) {
          summary.opponentBoardUnitCount += 1;
        }
      });
      if (
        isOpponentPriorCard({
          state,
          cardId: publicSeat.board[row].horn,
          opponentSeatId,
          priorSourceCounts,
        })
      ) {
        summary.opponentRowHornCount += 1;
      }
    });

    publicSeat.discard.forEach((cardId) => {
      if (isOpponentPriorCard({ state, cardId, opponentSeatId, priorSourceCounts })) {
        summary.opponentDiscardCount += 1;
      }
    });

    publicSeat.removedFromGame.forEach((cardId) => {
      if (isOpponentPriorCard({ state, cardId, opponentSeatId, priorSourceCounts })) {
        summary.opponentRemovedFromGameCount += 1;
      }
    });
  });

  state.weather.entries.forEach((cardId) => {
    if (isOpponentPriorCard({ state, cardId, opponentSeatId, priorSourceCounts })) {
      summary.opponentWeatherCount += 1;
    }
  });

  state.seats[actingSeatId].hand.forEach((cardId) => {
    if (isOpponentPriorCard({ state, cardId, opponentSeatId, priorSourceCounts })) {
      summary.actingHandKnownOpponentOwnedCount += 1;
    }
  });

  if (state.pendingPrompt?.seatId === actingSeatId) {
    state.pendingPrompt.context?.revealedCardIds?.forEach((cardId) => {
      const card = state.cardsById[cardId];
      if (
        card?.zone.kind === "hand" &&
        card.zone.seat === opponentSeatId &&
        isOpponentPriorCard({ state, cardId, opponentSeatId, priorSourceCounts })
      ) {
        summary.promptRevealedOpponentHandCount += 1;
      }
    });
  }

  const publicKnown = buildPublicKnownSourceSubtraction({
    state,
    actingSeatId,
    opponentSeatId,
    priorSourceCounts,
  });
  summary.duplicatePublicReferenceCount =
    publicKnown.duplicatePublicReferenceCount;
  summary.duplicateFixedKnownHandReferenceCount =
    publicKnown.duplicateFixedKnownHandReferenceCount;
  summary.uniquePublicKnownCardCount = publicKnown.publicKnownCardCount;
  summary.uniqueFixedKnownHandCardCount = publicKnown.fixedKnownHandCardCount;

  return summary;
};

const buildInvalidRootRecord = ({
  input,
  materializationRoot,
  publicKnown,
}: {
  input: BuildSamplerInvalidRootAnalysisInput;
  materializationRoot: SamplerMaterializationRootRecord;
  publicKnown: PublicKnownSourceSubtractionResult;
}): SamplerInvalidRootRecord => {
  const { state, seatId, seats } = input;
  const seat = seats[seatId];
  const opponentSeatId: SeatId = seatId === "seat_a" ? "seat_b" : "seat_a";
  const opponentSeat = seats[opponentSeatId];
  const prior = buildKnownPresetSourceMultisetPrior({
    deckPresetId: opponentSeat.deckPresetId,
    faction: opponentSeat.faction,
  });
  const opponentHandCount = state.seats[opponentSeatId].hand.length;
  const opponentDeckCount = state.seats[opponentSeatId].deck.length;
  const opponentHiddenCount = opponentHandCount + opponentDeckCount;
  const hiddenHandDrawCount =
    opponentHandCount - publicKnown.fixedKnownHandCardCount;
  const requiredHiddenDrawCount = hiddenHandDrawCount + opponentDeckCount;
  const priorDeficitCount = Math.max(
    0,
    requiredHiddenDrawCount - publicKnown.priorRemainingCardCount,
  );
  const priorExcessCount = Math.max(
    0,
    publicKnown.priorRemainingCardCount - requiredHiddenDrawCount,
  );
  const publicKnownByZone = buildPublicKnownZoneCountSummary({
    state,
    actingSeatId: seatId,
    opponentSeatId,
    priorSourceCounts: prior.mainDeckSourceCounts,
  });
  const invalidReasons = allInvalidReasons(materializationRoot);
  const promptRevealKnownHandCount =
    publicKnownByZone.promptRevealedOpponentHandCount;
  const classification = classifySamplerInvalidRoot({
    invalidReasons,
    opponentHandCount,
    publicKnownCardCount: publicKnown.publicKnownCardCount,
    fixedKnownHandCardCount: publicKnown.fixedKnownHandCardCount,
    promptRevealKnownHandCount,
  });

  return {
    schemaVersion: "sampler-invalid-root-v1",
    samplerRunId: input.samplerRunId,
    suiteId: input.suiteId,
    matchupId: input.matchupId,
    seed: input.seed,
    ...(input.mirrorGroupId ? { mirrorGroupId: input.mirrorGroupId } : {}),
    ...(input.mirrorIndex === undefined ? {} : { mirrorIndex: input.mirrorIndex }),
    step: input.step,
    decisionIndex: input.decisionIndex,
    phase: state.phase,
    round: state.round,
    seatId,
    policyId: input.policyId,
    faction: seat.faction,
    deckPresetId: seat.deckPresetId,
    priorStatus: prior.priorStatus,
    materializationStatus: "invalid",
    invalidReason: primaryInvalidReason(materializationRoot),
    classification,
    opponentHandCount,
    opponentDeckCount,
    opponentHiddenCount,
    priorMainDeckCardCount: prior.mainDeckCardCount,
    priorRemainingCardCount: publicKnown.priorRemainingCardCount,
    publicKnownCardCount: publicKnown.publicKnownCardCount,
    fixedKnownHandCardCount: publicKnown.fixedKnownHandCardCount,
    duplicatePublicReferenceCount: publicKnown.duplicatePublicReferenceCount,
    duplicateFixedKnownHandReferenceCount:
      publicKnown.duplicateFixedKnownHandReferenceCount,
    uniquePublicKnownCardCount: publicKnown.publicKnownCardCount,
    uniqueFixedKnownHandCardCount: publicKnown.fixedKnownHandCardCount,
    hiddenHandDrawCount,
    requiredHiddenDrawCount,
    priorDeficitCount,
    priorExcessCount,
    publicKnownByZone,
    promptRevealKnownHandCount,
    hasPendingPromptForActingSeat: state.pendingPrompt?.seatId === seatId,
    publicKnownCountBucket: bucketCount(publicKnown.publicKnownCardCount),
    fixedKnownHandCountBucket: bucketCount(publicKnown.fixedKnownHandCardCount),
    hiddenCountDeficitBucket: bucketDeficit(priorDeficitCount),
    rootPublicFingerprint: materializationRoot.rootPublicFingerprint,
  };
};

export const buildSamplerInvalidRootAnalysis = (
  input: BuildSamplerInvalidRootAnalysisInput,
): SamplerInvalidRootAnalysis => {
  const materializationRoot = buildSamplerMaterializationRootRecord(input);
  const opponentSeatId: SeatId = input.seatId === "seat_a" ? "seat_b" : "seat_a";
  const opponentSeat = input.seats[opponentSeatId];
  const prior = buildKnownPresetSourceMultisetPrior({
    deckPresetId: opponentSeat.deckPresetId,
    faction: opponentSeat.faction,
  });
  const publicKnown =
    prior.priorStatus === "prior_available"
      ? buildPublicKnownSourceSubtraction({
          state: input.state,
          actingSeatId: input.seatId,
          opponentSeatId,
          priorSourceCounts: prior.mainDeckSourceCounts,
        })
      : {
          publicKnownSourceCounts: {},
          fixedKnownHandSourceCounts: {},
          publicKnownCardCount: 0,
          fixedKnownHandCardCount: 0,
          duplicatePublicReferenceCount: 0,
          duplicateFixedKnownHandReferenceCount: 0,
          remainingSourceCounts: {},
          priorRemainingCardCount: 0,
          invalidReasonCounts: {},
        };

  if (materializationRoot.materializationStatus !== "invalid") {
    return { materializationRoot, invalidRoot: null };
  }

  return {
    materializationRoot,
    invalidRoot: buildInvalidRootRecord({
      input,
      materializationRoot,
      publicKnown,
    }),
  };
};

export const buildSamplerInvalidRootsRecommendation = (
  summary: Pick<
    SamplerInvalidRootSummary,
    | "invalidRootCount"
    | "classificationCounts"
    | "duplicatePublicReferenceTotal"
    | "duplicateFixedKnownHandReferenceTotal"
  >,
) => {
  if (summary.invalidRootCount === 0) {
    return "cFp64 may implement benchmark-only determinized-pimc-probe-v0 over all cFp61 roots, with zero invalid-root skips reported.";
  }

  if (
    summary.classificationCounts.public_zone_count_deficit > 0 &&
    summary.duplicatePublicReferenceTotal === 0 &&
    summary.duplicateFixedKnownHandReferenceTotal === 0
  ) {
    return "cFp64 should add a scalar-only public-zone provenance casebook for the remaining public-zone count deficits before any determinized probe.";
  }

  const repairClassifications: SamplerInvalidRootClassification[] = [
    "public_known_exceeds_prior_copy_count",
    "fixed_hand_exceeds_observed_hand",
    "prompt_revealed_hand_deficit",
    "public_zone_count_deficit",
    "prior_remaining_excess",
    "negative_or_incoherent_public_count",
  ];
  const repairCount = repairClassifications.reduce(
    (sum, classification) => sum + (summary.classificationCounts[classification] ?? 0),
    0,
  );

  if (repairCount > 0) {
    return "cFp64 should implement the next narrow sampler-count repair before any determinized probe, then regenerate sampler materialization and invalid-root artifacts before search.";
  }

  if (
    (summary.classificationCounts.raw_hidden_count_exceeds_prior ?? 0) ===
    summary.invalidRootCount
  ) {
    return "cFp64 may run benchmark-only determinized-pimc-probe-v0 over valid cFp61 roots only, reporting invalid-root skips by suite, reason, classification, phase, round, matchup, policy, faction, and deck.";
  }

  return "cFp64 should add another scalar-only sampler instrumentation pass because the invalid-root evidence remains mixed or ambiguous.";
};

export const buildSamplerInvalidRootSummary = ({
  samplerRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  materializationRoots,
  invalidRoots,
  benchmarkSummary,
}: {
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  materializationRoots: readonly SamplerMaterializationRootRecord[];
  invalidRoots: readonly SamplerInvalidRootRecord[];
  benchmarkSummary: BenchmarkRunResult["summary"];
}): SamplerInvalidRootSummary => {
  const classificationCounts = emptyClassificationCounts();
  invalidRoots.forEach((root) => {
    classificationCounts[root.classification] += 1;
  });

  const materializationStatusCounts = countBy(
    materializationRoots.map((root) => root.materializationStatus),
  );
  const invalidRootCount = invalidRoots.length;
  const duplicatePublicReferenceTotal = materializationRoots.reduce(
    (sum, root) => sum + root.duplicatePublicReferenceCount,
    0,
  );
  const duplicateFixedKnownHandReferenceTotal = materializationRoots.reduce(
    (sum, root) => sum + root.duplicateFixedKnownHandReferenceCount,
    0,
  );
  const summaryBase = {
    invalidRootCount,
    classificationCounts,
    duplicatePublicReferenceTotal,
    duplicateFixedKnownHandReferenceTotal,
  };

  return {
    schemaVersion: "sampler-invalid-root-summary-v1",
    samplerRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    totalRootCount: materializationRoots.length,
    invalidRootCount,
    validRootCount: materializationStatusCounts.valid ?? 0,
    matchCount: benchmarkSummary.totalMatches,
    statusCounts: benchmarkSummary.statusCounts,
    priorStatusCounts: countBy(materializationRoots.map((root) => root.priorStatus)),
    materializationStatusCounts,
    invalidReasonCounts: countBy(invalidRoots.map((root) => root.invalidReason)),
    classificationCounts,
    invalidRootCountsByPhase: countBy(invalidRoots.map((root) => root.phase)),
    invalidRootCountsByRound: countBy(invalidRoots.map((root) => String(root.round))),
    invalidRootCountsByFaction: countBy(invalidRoots.map((root) => root.faction)),
    invalidRootCountsByPolicy: countBy(invalidRoots.map((root) => root.policyId)),
    invalidRootCountsByDeckPreset: countBy(
      invalidRoots.map((root) => root.deckPresetId),
    ),
    invalidRootCountsByMatchup: countBy(invalidRoots.map((root) => root.matchupId)),
    invalidRootCountsByPublicKnownCountBucket: countBy(
      invalidRoots.map((root) => root.publicKnownCountBucket),
    ),
    invalidRootCountsByFixedKnownHandCountBucket: countBy(
      invalidRoots.map((root) => root.fixedKnownHandCountBucket),
    ),
    invalidRootCountsByHiddenCountDeficitBucket: countBy(
      invalidRoots.map((root) => root.hiddenCountDeficitBucket),
    ),
    opponentHandCountStats: buildSamplerReadinessCountStats(
      invalidRoots.map((root) => root.opponentHandCount),
    ),
    opponentDeckCountStats: buildSamplerReadinessCountStats(
      invalidRoots.map((root) => root.opponentDeckCount),
    ),
    opponentHiddenCountStats: buildSamplerReadinessCountStats(
      invalidRoots.map((root) => root.opponentHiddenCount),
    ),
    publicKnownCardCountStats: buildSamplerReadinessCountStats(
      invalidRoots.map((root) => root.publicKnownCardCount),
    ),
    fixedKnownHandCardCountStats: buildSamplerReadinessCountStats(
      invalidRoots.map((root) => root.fixedKnownHandCardCount),
    ),
    requiredHiddenDrawCountStats: buildSamplerReadinessCountStats(
      invalidRoots.map((root) => root.requiredHiddenDrawCount),
    ),
    priorRemainingCardCountStats: buildSamplerReadinessCountStats(
      invalidRoots.map((root) => root.priorRemainingCardCount),
    ),
    priorDeficitCountStats: buildSamplerReadinessCountStats(
      invalidRoots.map((root) => root.priorDeficitCount),
    ),
    duplicatePublicReferenceTotal,
    duplicateFixedKnownHandReferenceTotal,
    duplicatePublicReferenceCountStats: buildSamplerReadinessCountStats(
      materializationRoots.map((root) => root.duplicatePublicReferenceCount),
    ),
    duplicateFixedKnownHandReferenceCountStats: buildSamplerReadinessCountStats(
      materializationRoots.map((root) => root.duplicateFixedKnownHandReferenceCount),
    ),
    uniquePublicKnownCardCountStats: buildSamplerReadinessCountStats(
      materializationRoots.map((root) => root.uniquePublicKnownCardCount),
    ),
    uniqueFixedKnownHandCardCountStats: buildSamplerReadinessCountStats(
      materializationRoots.map((root) => root.uniqueFixedKnownHandCardCount),
    ),
    invalidRootDuplicatePublicReferenceCountStats: buildSamplerReadinessCountStats(
      invalidRoots.map((root) => root.duplicatePublicReferenceCount),
    ),
    invalidRootDuplicateFixedKnownHandReferenceCountStats:
      buildSamplerReadinessCountStats(
        invalidRoots.map((root) => root.duplicateFixedKnownHandReferenceCount),
      ),
    hiddenInfoSafetyNote:
      "Sampler invalid-root artifacts contain only public root metadata, scalar counts, deterministic buckets, and one safe classification per invalid root. They exclude sampled cards, source maps, card names, raw moves, runtime card identifiers, raw state, command logs, event logs, final state, and hidden hand/deck identities.",
    explicitNonSearchWarning:
      "cFp62 sampler invalid-root artifacts are evaluation infrastructure only. They do not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, or product difficulty.",
    recommendedNextStep: buildSamplerInvalidRootsRecommendation(summaryBase),
  };
};

const defaultSamplerRunId = (input: SamplerInvalidRootsProfileInput) =>
  `${input.suiteId ?? input.suite?.id ?? "benchmark-smoke-v1"}:sampler-invalid-roots:cFp62`;

export const runSamplerInvalidRootsProfile = (
  input: SamplerInvalidRootsProfileInput = {},
): SamplerInvalidRootsProfileResult => {
  const samplerRunId = input.samplerRunId ?? defaultSamplerRunId(input);
  const materializationRoots: SamplerMaterializationRootRecord[] = [];
  const invalidRoots: SamplerInvalidRootRecord[] = [];

  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: samplerRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      const analysis = buildSamplerInvalidRootAnalysis({
        ...root,
        samplerRunId,
        sampleCount: input.sampleCount,
      });
      materializationRoots.push(analysis.materializationRoot);
      if (analysis.invalidRoot) {
        invalidRoots.push(analysis.invalidRoot);
      }
    },
  });

  const suiteId = benchmark.summary.suiteId;

  return {
    samplerRunId,
    suiteId,
    sourceBenchmarkSuiteId: suiteId,
    benchmark,
    materializationRoots,
    invalidRoots,
    summary: buildSamplerInvalidRootSummary({
      samplerRunId,
      suiteId,
      sourceBenchmarkSuiteId: suiteId,
      materializationRoots,
      invalidRoots,
      benchmarkSummary: benchmark.summary,
    }),
  };
};
