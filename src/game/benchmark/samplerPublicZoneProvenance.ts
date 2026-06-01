import type { CatalogFaction } from "@/game/catalog";
import type { MatchPhase, SeatId } from "@/game/core";

import {
  buildSamplerInvalidRootAnalysis,
  type SamplerInvalidRootClassification,
  type SamplerInvalidRootRecord,
} from "./samplerInvalidRoots";
import {
  buildSamplerReadinessCountStats,
  type SamplerReadinessCountStats,
} from "./samplerReadiness";
import {
  getSamplerPublicTransferMemoryForRoot,
  type SamplerMaterializationRootRecord,
  type SamplerPublicTransferMemoryState,
} from "./samplerMaterialization";
import { runBenchmarkSuite } from "./runBenchmark";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSuite,
} from "./types";

export type SamplerPublicZoneProvenanceRootSchemaVersion =
  "sampler-public-zone-provenance-root-v1";
export type SamplerPublicZoneProvenanceSummarySchemaVersion =
  "sampler-public-zone-provenance-summary-v1";

export type PublicZoneProvenanceLabel =
  | "single_zone_board"
  | "single_zone_row_horn"
  | "single_zone_discard"
  | "single_zone_removed"
  | "single_zone_weather"
  | "single_zone_acting_hand_known"
  | "single_zone_prompt_reveal"
  | "mixed_public_zones"
  | "round_end_public_zone"
  | "zero_public_zone_unexpected"
  | "provenance_ambiguous";

export type PublicZoneFamily =
  | "opponent_board_units"
  | "opponent_row_horns"
  | "opponent_discard"
  | "opponent_removed_from_game"
  | "opponent_weather"
  | "acting_hand_known"
  | "prompt_revealed_hand"
  | "other_public_known";

export type DominantPublicZone = PublicZoneFamily | "none";
export type DominantPublicZoneShareBucket =
  | "none"
  | "minority"
  | "half"
  | "majority"
  | "all";
export type PublicZoneShape =
  | "single_zone"
  | "two_zones"
  | "three_plus_zones"
  | "none";
export type PriorDeficitBucket = "none" | "one" | "small" | "medium" | "large";

export interface PublicZoneProvenanceClassificationInput {
  phase: MatchPhase | string;
  publicZoneFamilyCounts: Record<PublicZoneFamily, number>;
}

export interface SamplerPublicZoneProvenanceRecord {
  schemaVersion: SamplerPublicZoneProvenanceRootSchemaVersion;
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
  invalidReason: string;
  materializationInvalidReasonCounts: Record<string, number>;
  invalidRootClassification: "public_zone_count_deficit";
  priorDeficitCount: number;
  priorDeficitBucket: PriorDeficitBucket;
  opponentHandCount: number;
  opponentDeckCount: number;
  opponentHiddenCount: number;
  publicKnownCardCount: number;
  fixedKnownHandCardCount: number;
  requiredHiddenDrawCount: number;
  priorRemainingCardCount: number;
  mainDeckAttributablePublicCount: number;
  sideDeckOnlyPublicCount: number;
  offPriorPublicCount: number;
  publicAdjustmentCount: number;
  uncoveredPriorDeficitCount: number;
  publicAdjustmentReasonCounts: Record<string, number>;
  publicTransferMemoryVisibleCardCount: number;
  publicTransferKnownHiddenHandCount: number;
  publicTransferKnownHiddenDeckCount: number;
  publicTransferKnownHiddenMainDeckAttributableCount: number;
  publicTransferKnownHiddenSideDeckOnlyCount: number;
  publicTransferKnownHiddenOffPriorCount: number;
  publicTransferAdjustmentCount: number;
  publicTransferUncoveredDeficitCount: number;
  publicTransferIncoherentCount: number;
  publicTransferReasonCounts: Record<string, number>;
  duplicatePublicReferenceCount: number;
  duplicateFixedKnownHandReferenceCount: number;
  publicZoneFamilyCounts: Record<PublicZoneFamily, number>;
  publicZoneReferenceCount: number;
  publicZoneDiversityCount: number;
  dominantPublicZone: DominantPublicZone;
  dominantPublicZoneCount: number;
  dominantPublicZoneShareBucket: DominantPublicZoneShareBucket;
  publicZoneShape: PublicZoneShape;
  provenanceLabel: PublicZoneProvenanceLabel;
  rootPublicFingerprint: string;
}

export interface SamplerPublicZoneProvenanceSummary {
  schemaVersion: SamplerPublicZoneProvenanceSummarySchemaVersion;
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  totalRootCount: number;
  validRootCount: number;
  invalidRootCount: number;
  invalidProvenanceRootCount: number;
  matchCount: number;
  statusCounts: BenchmarkRunResult["summary"]["statusCounts"];
  priorStatusCounts: Record<string, number>;
  materializationStatusCounts: Record<string, number>;
  invalidReasonCounts: Record<string, number>;
  invalidRootClassificationCounts: Record<SamplerInvalidRootClassification, number>;
  provenanceLabelCounts: Record<PublicZoneProvenanceLabel, number>;
  provenanceRootCountsByPhase: Record<string, number>;
  provenanceRootCountsByRound: Record<string, number>;
  provenanceRootCountsByFaction: Record<string, number>;
  provenanceRootCountsByPolicy: Record<string, number>;
  provenanceRootCountsByDeckPreset: Record<string, number>;
  provenanceRootCountsByMatchup: Record<string, number>;
  priorDeficitBucketCounts: Record<string, number>;
  dominantPublicZoneCounts: Record<string, number>;
  publicZoneShapeCounts: Record<string, number>;
  publicZoneReferenceCountStats: SamplerReadinessCountStats;
  publicZoneDiversityCountStats: SamplerReadinessCountStats;
  priorDeficitCountStats: SamplerReadinessCountStats;
  publicKnownCardCountStats: SamplerReadinessCountStats;
  fixedKnownHandCardCountStats: SamplerReadinessCountStats;
  duplicatePublicReferenceTotal: number;
  duplicateFixedKnownHandReferenceTotal: number;
  sideDeckOnlyPublicTotal: number;
  offPriorPublicTotal: number;
  publicAdjustmentTotal: number;
  uncoveredPriorDeficitTotal: number;
  publicAdjustmentReasonCounts: Record<string, number>;
  publicTransferMemoryVisibleCardTotal: number;
  publicTransferKnownHiddenHandTotal: number;
  publicTransferKnownHiddenDeckTotal: number;
  publicTransferKnownHiddenMainDeckAttributableTotal: number;
  publicTransferKnownHiddenSideDeckOnlyTotal: number;
  publicTransferKnownHiddenOffPriorTotal: number;
  publicTransferAdjustmentTotal: number;
  publicTransferUncoveredDeficitTotal: number;
  publicTransferIncoherentTotal: number;
  publicTransferReasonCounts: Record<string, number>;
  duplicatePublicReferenceCountStats: SamplerReadinessCountStats;
  duplicateFixedKnownHandReferenceCountStats: SamplerReadinessCountStats;
  mainDeckAttributablePublicCountStats: SamplerReadinessCountStats;
  sideDeckOnlyPublicCountStats: SamplerReadinessCountStats;
  offPriorPublicCountStats: SamplerReadinessCountStats;
  publicAdjustmentCountStats: SamplerReadinessCountStats;
  uncoveredPriorDeficitCountStats: SamplerReadinessCountStats;
  publicTransferMemoryVisibleCardCountStats: SamplerReadinessCountStats;
  publicTransferKnownHiddenHandCountStats: SamplerReadinessCountStats;
  publicTransferKnownHiddenDeckCountStats: SamplerReadinessCountStats;
  publicTransferKnownHiddenMainDeckAttributableCountStats: SamplerReadinessCountStats;
  publicTransferKnownHiddenSideDeckOnlyCountStats: SamplerReadinessCountStats;
  publicTransferKnownHiddenOffPriorCountStats: SamplerReadinessCountStats;
  publicTransferAdjustmentCountStats: SamplerReadinessCountStats;
  publicTransferUncoveredDeficitCountStats: SamplerReadinessCountStats;
  publicTransferIncoherentCountStats: SamplerReadinessCountStats;
  hiddenInfoSafetyNote: string;
  explicitNonSearchWarning: string;
  recommendedNextStep: string;
}

export interface SamplerPublicZoneProvenanceProfileResult {
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  benchmark: BenchmarkRunResult;
  materializationRoots: SamplerMaterializationRootRecord[];
  invalidRoots: SamplerInvalidRootRecord[];
  provenanceRoots: SamplerPublicZoneProvenanceRecord[];
  summary: SamplerPublicZoneProvenanceSummary;
}

export interface SamplerPublicZoneProvenanceProfileInput {
  suiteId?: string;
  suite?: BenchmarkSuite;
  samplerRunId?: string;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
  sampleCount?: number;
}

export interface BuildSamplerPublicZoneProvenanceAnalysisInput
  extends BenchmarkRootObserverInput {
  samplerRunId: string;
  sampleCount?: number;
  publicTransferMemory?: SamplerPublicTransferMemoryState;
}

export interface SamplerPublicZoneProvenanceAnalysis {
  materializationRoot: SamplerMaterializationRootRecord;
  invalidRoot: SamplerInvalidRootRecord | null;
  provenanceRoot: SamplerPublicZoneProvenanceRecord | null;
}

const provenanceLabels: readonly PublicZoneProvenanceLabel[] = [
  "single_zone_board",
  "single_zone_row_horn",
  "single_zone_discard",
  "single_zone_removed",
  "single_zone_weather",
  "single_zone_acting_hand_known",
  "single_zone_prompt_reveal",
  "mixed_public_zones",
  "round_end_public_zone",
  "zero_public_zone_unexpected",
  "provenance_ambiguous",
];

const invalidRootClassifications: readonly SamplerInvalidRootClassification[] = [
  "public_known_exceeds_prior_copy_count",
  "fixed_hand_exceeds_observed_hand",
  "prompt_revealed_hand_deficit",
  "public_zone_count_deficit",
  "raw_hidden_count_exceeds_prior",
  "prior_remaining_excess",
  "negative_or_incoherent_public_count",
  "other_invalid_root",
];

const zoneFamilyOrder: readonly PublicZoneFamily[] = [
  "opponent_board_units",
  "opponent_row_horns",
  "opponent_discard",
  "opponent_removed_from_game",
  "opponent_weather",
  "acting_hand_known",
  "prompt_revealed_hand",
  "other_public_known",
];

const singleZoneLabels: Partial<Record<PublicZoneFamily, PublicZoneProvenanceLabel>> = {
  opponent_board_units: "single_zone_board",
  opponent_row_horns: "single_zone_row_horn",
  opponent_discard: "single_zone_discard",
  opponent_removed_from_game: "single_zone_removed",
  opponent_weather: "single_zone_weather",
  acting_hand_known: "single_zone_acting_hand_known",
  prompt_revealed_hand: "single_zone_prompt_reveal",
};

const emptyProvenanceLabelCounts = (): Record<PublicZoneProvenanceLabel, number> =>
  Object.fromEntries(provenanceLabels.map((label) => [label, 0])) as Record<
    PublicZoneProvenanceLabel,
    number
  >;

const emptyInvalidRootClassificationCounts =
  (): Record<SamplerInvalidRootClassification, number> =>
    Object.fromEntries(
      invalidRootClassifications.map((classification) => [classification, 0]),
    ) as Record<SamplerInvalidRootClassification, number>;

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

const sumCounts = (record: Record<string, number>) =>
  Object.values(record).reduce((sum, count) => sum + count, 0);

const bucketPriorDeficit = (value: number): PriorDeficitBucket => {
  if (value <= 0) return "none";
  if (value === 1) return "one";
  if (value <= 3) return "small";
  if (value <= 8) return "medium";
  return "large";
};

const buildPublicZoneFamilyCounts = (
  invalidRoot: SamplerInvalidRootRecord,
): Record<PublicZoneFamily, number> => ({
  opponent_board_units: invalidRoot.publicKnownByZone.opponentBoardUnitCount,
  opponent_row_horns: invalidRoot.publicKnownByZone.opponentRowHornCount,
  opponent_discard: invalidRoot.publicKnownByZone.opponentDiscardCount,
  opponent_removed_from_game:
    invalidRoot.publicKnownByZone.opponentRemovedFromGameCount,
  opponent_weather: invalidRoot.publicKnownByZone.opponentWeatherCount,
  acting_hand_known:
    invalidRoot.publicKnownByZone.actingHandKnownOpponentOwnedCount,
  prompt_revealed_hand:
    invalidRoot.publicKnownByZone.promptRevealedOpponentHandCount,
  other_public_known: invalidRoot.publicKnownByZone.otherPublicKnownCount,
});

const nonzeroZoneFamilies = (counts: Record<PublicZoneFamily, number>) =>
  zoneFamilyOrder.filter((family) => (counts[family] ?? 0) > 0);

const buildPublicZoneShape = (diversityCount: number): PublicZoneShape => {
  if (diversityCount <= 0) return "none";
  if (diversityCount === 1) return "single_zone";
  if (diversityCount === 2) return "two_zones";
  return "three_plus_zones";
};

const buildDominantPublicZone = (
  counts: Record<PublicZoneFamily, number>,
): { zone: DominantPublicZone; count: number } => {
  let zone: DominantPublicZone = "none";
  let count = 0;
  zoneFamilyOrder.forEach((family) => {
    const familyCount = counts[family] ?? 0;
    if (familyCount > count) {
      zone = family;
      count = familyCount;
    }
  });
  return { zone, count };
};

const buildDominantPublicZoneShareBucket = ({
  dominantCount,
  totalCount,
}: {
  dominantCount: number;
  totalCount: number;
}): DominantPublicZoneShareBucket => {
  if (totalCount <= 0 || dominantCount <= 0) return "none";
  if (dominantCount === totalCount) return "all";
  if (dominantCount * 2 > totalCount) return "majority";
  if (dominantCount * 2 === totalCount) return "half";
  return "minority";
};

export const classifyPublicZoneProvenance = ({
  phase,
  publicZoneFamilyCounts,
}: PublicZoneProvenanceClassificationInput): PublicZoneProvenanceLabel => {
  const publicZoneReferenceCount = sumCounts(publicZoneFamilyCounts);
  const nonzeroFamilies = nonzeroZoneFamilies(publicZoneFamilyCounts);

  // cFp64 labels use deterministic first-match precedence:
  // round-end roots, zero-count guard, single-zone families, mixed zones, fallback.
  if (phase === "round_end" && publicZoneReferenceCount > 0) {
    return "round_end_public_zone";
  }
  if (publicZoneReferenceCount === 0) {
    return "zero_public_zone_unexpected";
  }
  if (nonzeroFamilies.length === 1) {
    return singleZoneLabels[nonzeroFamilies[0]] ?? "provenance_ambiguous";
  }
  if (nonzeroFamilies.length >= 2) {
    return "mixed_public_zones";
  }
  return "provenance_ambiguous";
};

export const buildSamplerPublicZoneProvenanceRecord = ({
  materializationRoot,
  invalidRoot,
}: {
  materializationRoot: SamplerMaterializationRootRecord;
  invalidRoot: SamplerInvalidRootRecord;
}): SamplerPublicZoneProvenanceRecord | null => {
  if (invalidRoot.classification !== "public_zone_count_deficit") {
    return null;
  }

  const publicZoneFamilyCounts = buildPublicZoneFamilyCounts(invalidRoot);
  const publicZoneReferenceCount = sumCounts(publicZoneFamilyCounts);
  const publicZoneDiversityCount = nonzeroZoneFamilies(publicZoneFamilyCounts).length;
  const dominantPublicZone = buildDominantPublicZone(publicZoneFamilyCounts);

  return {
    schemaVersion: "sampler-public-zone-provenance-root-v1",
    samplerRunId: invalidRoot.samplerRunId,
    suiteId: invalidRoot.suiteId,
    matchupId: invalidRoot.matchupId,
    seed: invalidRoot.seed,
    ...(invalidRoot.mirrorGroupId ? { mirrorGroupId: invalidRoot.mirrorGroupId } : {}),
    ...(invalidRoot.mirrorIndex === undefined
      ? {}
      : { mirrorIndex: invalidRoot.mirrorIndex }),
    step: invalidRoot.step,
    decisionIndex: invalidRoot.decisionIndex,
    phase: invalidRoot.phase,
    round: invalidRoot.round,
    seatId: invalidRoot.seatId,
    policyId: invalidRoot.policyId,
    faction: invalidRoot.faction,
    deckPresetId: invalidRoot.deckPresetId,
    invalidReason: invalidRoot.invalidReason,
    materializationInvalidReasonCounts: materializationRoot.invalidReasonCounts,
    invalidRootClassification: "public_zone_count_deficit",
    priorDeficitCount: invalidRoot.priorDeficitCount,
    priorDeficitBucket: bucketPriorDeficit(invalidRoot.priorDeficitCount),
    opponentHandCount: invalidRoot.opponentHandCount,
    opponentDeckCount: invalidRoot.opponentDeckCount,
    opponentHiddenCount: invalidRoot.opponentHiddenCount,
    publicKnownCardCount: invalidRoot.publicKnownCardCount,
    fixedKnownHandCardCount: invalidRoot.fixedKnownHandCardCount,
    requiredHiddenDrawCount: invalidRoot.requiredHiddenDrawCount,
    priorRemainingCardCount: invalidRoot.priorRemainingCardCount,
    mainDeckAttributablePublicCount:
      invalidRoot.mainDeckAttributablePublicCount,
    sideDeckOnlyPublicCount: invalidRoot.sideDeckOnlyPublicCount,
    offPriorPublicCount: invalidRoot.offPriorPublicCount,
    publicAdjustmentCount: invalidRoot.publicAdjustmentCount,
    uncoveredPriorDeficitCount: invalidRoot.uncoveredPriorDeficitCount,
    publicAdjustmentReasonCounts: invalidRoot.publicAdjustmentReasonCounts,
    publicTransferMemoryVisibleCardCount:
      invalidRoot.publicTransferMemoryVisibleCardCount,
    publicTransferKnownHiddenHandCount:
      invalidRoot.publicTransferKnownHiddenHandCount,
    publicTransferKnownHiddenDeckCount:
      invalidRoot.publicTransferKnownHiddenDeckCount,
    publicTransferKnownHiddenMainDeckAttributableCount:
      invalidRoot.publicTransferKnownHiddenMainDeckAttributableCount,
    publicTransferKnownHiddenSideDeckOnlyCount:
      invalidRoot.publicTransferKnownHiddenSideDeckOnlyCount,
    publicTransferKnownHiddenOffPriorCount:
      invalidRoot.publicTransferKnownHiddenOffPriorCount,
    publicTransferAdjustmentCount: invalidRoot.publicTransferAdjustmentCount,
    publicTransferUncoveredDeficitCount:
      invalidRoot.publicTransferUncoveredDeficitCount,
    publicTransferIncoherentCount: invalidRoot.publicTransferIncoherentCount,
    publicTransferReasonCounts: invalidRoot.publicTransferReasonCounts,
    duplicatePublicReferenceCount: invalidRoot.duplicatePublicReferenceCount,
    duplicateFixedKnownHandReferenceCount:
      invalidRoot.duplicateFixedKnownHandReferenceCount,
    publicZoneFamilyCounts,
    publicZoneReferenceCount,
    publicZoneDiversityCount,
    dominantPublicZone: dominantPublicZone.zone,
    dominantPublicZoneCount: dominantPublicZone.count,
    dominantPublicZoneShareBucket: buildDominantPublicZoneShareBucket({
      dominantCount: dominantPublicZone.count,
      totalCount: publicZoneReferenceCount,
    }),
    publicZoneShape: buildPublicZoneShape(publicZoneDiversityCount),
    provenanceLabel: classifyPublicZoneProvenance({
      phase: invalidRoot.phase,
      publicZoneFamilyCounts,
    }),
    rootPublicFingerprint: invalidRoot.rootPublicFingerprint,
  };
};

export const buildSamplerPublicZoneProvenanceAnalysis = (
  input: BuildSamplerPublicZoneProvenanceAnalysisInput,
): SamplerPublicZoneProvenanceAnalysis => {
  const analysis = buildSamplerInvalidRootAnalysis(input);
  const provenanceRoot = analysis.invalidRoot
    ? buildSamplerPublicZoneProvenanceRecord({
        materializationRoot: analysis.materializationRoot,
        invalidRoot: analysis.invalidRoot,
      })
    : null;

  return {
    materializationRoot: analysis.materializationRoot,
    invalidRoot: analysis.invalidRoot,
    provenanceRoot,
  };
};

export const buildSamplerPublicZoneProvenanceRecommendation = (
  summary: Pick<
    SamplerPublicZoneProvenanceSummary,
    | "invalidProvenanceRootCount"
    | "provenanceLabelCounts"
    | "duplicatePublicReferenceTotal"
    | "duplicateFixedKnownHandReferenceTotal"
  >,
) => {
  if (summary.invalidProvenanceRootCount === 0) {
    return "A future benchmark-only determinized probe may cover all cFp61 roots with zero public-zone-deficit skips, if separately specified.";
  }

  if (
    summary.provenanceLabelCounts.provenance_ambiguous > 0 ||
    summary.provenanceLabelCounts.zero_public_zone_unexpected > 0
  ) {
    return "A next scalar instrumentation pass should run because at least one public-zone deficit remains ambiguous or has zero public-zone evidence.";
  }

  if (
    summary.duplicatePublicReferenceTotal === 0 &&
    summary.duplicateFixedKnownHandReferenceTotal === 0
  ) {
    return "After public-transfer memory, a next spec should either define explicit valid-root-only skip accounting or require deeper public-state reconstruction before any determinized probe.";
  }

  return "A next sampler repair phase should run before any benchmark-only search probe.";
};

export const buildSamplerPublicZoneProvenanceSummary = ({
  samplerRunId,
  suiteId,
  sourceBenchmarkSuiteId,
  materializationRoots,
  invalidRoots,
  provenanceRoots,
  benchmarkSummary,
}: {
  samplerRunId: string;
  suiteId: string;
  sourceBenchmarkSuiteId: string;
  materializationRoots: readonly SamplerMaterializationRootRecord[];
  invalidRoots: readonly SamplerInvalidRootRecord[];
  provenanceRoots: readonly SamplerPublicZoneProvenanceRecord[];
  benchmarkSummary: BenchmarkRunResult["summary"];
}): SamplerPublicZoneProvenanceSummary => {
  const provenanceLabelCounts = emptyProvenanceLabelCounts();
  provenanceRoots.forEach((root) => {
    provenanceLabelCounts[root.provenanceLabel] += 1;
  });

  const invalidRootClassificationCounts = emptyInvalidRootClassificationCounts();
  invalidRoots.forEach((root) => {
    invalidRootClassificationCounts[root.classification] += 1;
  });

  const materializationStatusCounts = countBy(
    materializationRoots.map((root) => root.materializationStatus),
  );
  const duplicatePublicReferenceTotal = materializationRoots.reduce(
    (sum, root) => sum + root.duplicatePublicReferenceCount,
    0,
  );
  const duplicateFixedKnownHandReferenceTotal = materializationRoots.reduce(
    (sum, root) => sum + root.duplicateFixedKnownHandReferenceCount,
    0,
  );
  const publicAdjustmentReasonCounts: Record<string, number> = {};
  const publicTransferReasonCounts: Record<string, number> = {};
  provenanceRoots.forEach((root) => {
    Object.entries(root.publicAdjustmentReasonCounts).forEach(([reason, count]) => {
      publicAdjustmentReasonCounts[reason] =
        (publicAdjustmentReasonCounts[reason] ?? 0) + count;
    });
    Object.entries(root.publicTransferReasonCounts).forEach(([reason, count]) => {
      publicTransferReasonCounts[reason] =
        (publicTransferReasonCounts[reason] ?? 0) + count;
    });
  });
  const summaryBase = {
    invalidProvenanceRootCount: provenanceRoots.length,
    provenanceLabelCounts,
    duplicatePublicReferenceTotal,
    duplicateFixedKnownHandReferenceTotal,
  };

  return {
    schemaVersion: "sampler-public-zone-provenance-summary-v1",
    samplerRunId,
    suiteId,
    sourceBenchmarkSuiteId,
    totalRootCount: materializationRoots.length,
    validRootCount: materializationStatusCounts.valid ?? 0,
    invalidRootCount: invalidRoots.length,
    invalidProvenanceRootCount: provenanceRoots.length,
    matchCount: benchmarkSummary.totalMatches,
    statusCounts: benchmarkSummary.statusCounts,
    priorStatusCounts: countBy(materializationRoots.map((root) => root.priorStatus)),
    materializationStatusCounts,
    invalidReasonCounts: countBy(invalidRoots.map((root) => root.invalidReason)),
    invalidRootClassificationCounts,
    provenanceLabelCounts,
    provenanceRootCountsByPhase: countBy(provenanceRoots.map((root) => root.phase)),
    provenanceRootCountsByRound: countBy(
      provenanceRoots.map((root) => String(root.round)),
    ),
    provenanceRootCountsByFaction: countBy(
      provenanceRoots.map((root) => root.faction),
    ),
    provenanceRootCountsByPolicy: countBy(
      provenanceRoots.map((root) => root.policyId),
    ),
    provenanceRootCountsByDeckPreset: countBy(
      provenanceRoots.map((root) => root.deckPresetId),
    ),
    provenanceRootCountsByMatchup: countBy(
      provenanceRoots.map((root) => root.matchupId),
    ),
    priorDeficitBucketCounts: countBy(
      provenanceRoots.map((root) => root.priorDeficitBucket),
    ),
    dominantPublicZoneCounts: countBy(
      provenanceRoots.map((root) => root.dominantPublicZone),
    ),
    publicZoneShapeCounts: countBy(
      provenanceRoots.map((root) => root.publicZoneShape),
    ),
    publicZoneReferenceCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicZoneReferenceCount),
    ),
    publicZoneDiversityCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicZoneDiversityCount),
    ),
    priorDeficitCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.priorDeficitCount),
    ),
    publicKnownCardCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicKnownCardCount),
    ),
    fixedKnownHandCardCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.fixedKnownHandCardCount),
    ),
    duplicatePublicReferenceTotal,
    duplicateFixedKnownHandReferenceTotal,
    sideDeckOnlyPublicTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.sideDeckOnlyPublicCount,
      0,
    ),
    offPriorPublicTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.offPriorPublicCount,
      0,
    ),
    publicAdjustmentTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicAdjustmentCount,
      0,
    ),
    uncoveredPriorDeficitTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.uncoveredPriorDeficitCount,
      0,
    ),
    publicAdjustmentReasonCounts: sortEntries(publicAdjustmentReasonCounts),
    publicTransferMemoryVisibleCardTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicTransferMemoryVisibleCardCount,
      0,
    ),
    publicTransferKnownHiddenHandTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicTransferKnownHiddenHandCount,
      0,
    ),
    publicTransferKnownHiddenDeckTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicTransferKnownHiddenDeckCount,
      0,
    ),
    publicTransferKnownHiddenMainDeckAttributableTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicTransferKnownHiddenMainDeckAttributableCount,
      0,
    ),
    publicTransferKnownHiddenSideDeckOnlyTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicTransferKnownHiddenSideDeckOnlyCount,
      0,
    ),
    publicTransferKnownHiddenOffPriorTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicTransferKnownHiddenOffPriorCount,
      0,
    ),
    publicTransferAdjustmentTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicTransferAdjustmentCount,
      0,
    ),
    publicTransferUncoveredDeficitTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicTransferUncoveredDeficitCount,
      0,
    ),
    publicTransferIncoherentTotal: provenanceRoots.reduce(
      (sum, root) => sum + root.publicTransferIncoherentCount,
      0,
    ),
    publicTransferReasonCounts: sortEntries(publicTransferReasonCounts),
    duplicatePublicReferenceCountStats: buildSamplerReadinessCountStats(
      materializationRoots.map((root) => root.duplicatePublicReferenceCount),
    ),
    duplicateFixedKnownHandReferenceCountStats: buildSamplerReadinessCountStats(
      materializationRoots.map((root) => root.duplicateFixedKnownHandReferenceCount),
    ),
    mainDeckAttributablePublicCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.mainDeckAttributablePublicCount),
    ),
    sideDeckOnlyPublicCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.sideDeckOnlyPublicCount),
    ),
    offPriorPublicCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.offPriorPublicCount),
    ),
    publicAdjustmentCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicAdjustmentCount),
    ),
    uncoveredPriorDeficitCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.uncoveredPriorDeficitCount),
    ),
    publicTransferMemoryVisibleCardCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicTransferMemoryVisibleCardCount),
    ),
    publicTransferKnownHiddenHandCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicTransferKnownHiddenHandCount),
    ),
    publicTransferKnownHiddenDeckCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicTransferKnownHiddenDeckCount),
    ),
    publicTransferKnownHiddenMainDeckAttributableCountStats:
      buildSamplerReadinessCountStats(
        provenanceRoots.map(
          (root) => root.publicTransferKnownHiddenMainDeckAttributableCount,
        ),
      ),
    publicTransferKnownHiddenSideDeckOnlyCountStats:
      buildSamplerReadinessCountStats(
        provenanceRoots.map(
          (root) => root.publicTransferKnownHiddenSideDeckOnlyCount,
        ),
      ),
    publicTransferKnownHiddenOffPriorCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicTransferKnownHiddenOffPriorCount),
    ),
    publicTransferAdjustmentCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicTransferAdjustmentCount),
    ),
    publicTransferUncoveredDeficitCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicTransferUncoveredDeficitCount),
    ),
    publicTransferIncoherentCountStats: buildSamplerReadinessCountStats(
      provenanceRoots.map((root) => root.publicTransferIncoherentCount),
    ),
    hiddenInfoSafetyNote:
      "Sampler public-zone provenance artifacts contain only public metadata, scalar counts, deterministic buckets, and one safe provenance label per public-zone-deficit root. They exclude private card identity payloads, identity maps, sampled maps, engine logs, final payloads, action references, and debug payloads.",
    explicitNonSearchWarning:
      "cFp64 sampler public-zone provenance artifacts are casebook infrastructure only. They do not run PIMC, ISMCTS, MCTS, rollouts, action evaluation, action ranking, search move selection, product search AI, or product difficulty.",
    recommendedNextStep: buildSamplerPublicZoneProvenanceRecommendation(summaryBase),
  };
};

const defaultSamplerRunId = (input: SamplerPublicZoneProvenanceProfileInput) =>
  `${input.suiteId ?? input.suite?.id ?? "benchmark-smoke-v1"}:sampler-public-zone-provenance:cFp64`;

export const runSamplerPublicZoneProvenanceProfile = (
  input: SamplerPublicZoneProvenanceProfileInput = {},
): SamplerPublicZoneProvenanceProfileResult => {
  const samplerRunId = input.samplerRunId ?? defaultSamplerRunId(input);
  const materializationRoots: SamplerMaterializationRootRecord[] = [];
  const invalidRoots: SamplerInvalidRootRecord[] = [];
  const provenanceRoots: SamplerPublicZoneProvenanceRecord[] = [];
  const publicTransferMemoryStore = new Map<
    string,
    SamplerPublicTransferMemoryState
  >();

  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: samplerRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      const publicTransferMemory = getSamplerPublicTransferMemoryForRoot(
        publicTransferMemoryStore,
        root,
      );
      const analysis = buildSamplerPublicZoneProvenanceAnalysis({
        ...root,
        samplerRunId,
        sampleCount: input.sampleCount,
        publicTransferMemory,
      });
      materializationRoots.push(analysis.materializationRoot);
      if (analysis.invalidRoot) {
        invalidRoots.push(analysis.invalidRoot);
      }
      if (analysis.provenanceRoot) {
        provenanceRoots.push(analysis.provenanceRoot);
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
    provenanceRoots,
    summary: buildSamplerPublicZoneProvenanceSummary({
      samplerRunId,
      suiteId,
      sourceBenchmarkSuiteId: suiteId,
      materializationRoots,
      invalidRoots,
      provenanceRoots,
      benchmarkSummary: benchmark.summary,
    }),
  };
};
