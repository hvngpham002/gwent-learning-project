import { describe, expect, it } from "vitest";

import {
  buildSamplerPublicZoneProvenanceRecord,
  buildSamplerPublicZoneProvenanceSummary,
  classifyPublicZoneProvenance,
  type PublicZoneFamily,
  type PublicZoneProvenanceLabel,
  type SamplerInvalidRootRecord,
  type SamplerMaterializationRootRecord,
  type SamplerPublicZoneProvenanceRecord,
} from "@/game/benchmark";
import type { BenchmarkRunResult } from "@/game/benchmark";

const zoneFamilies: readonly PublicZoneFamily[] = [
  "opponent_board_units",
  "opponent_row_horns",
  "opponent_discard",
  "opponent_removed_from_game",
  "opponent_weather",
  "acting_hand_known",
  "prompt_revealed_hand",
  "other_public_known",
];

const emptyZoneCounts = (): Record<PublicZoneFamily, number> =>
  Object.fromEntries(zoneFamilies.map((family) => [family, 0])) as Record<
    PublicZoneFamily,
    number
  >;

const publicKnownByZone = (
  counts: Partial<Record<PublicZoneFamily, number>>,
): SamplerInvalidRootRecord["publicKnownByZone"] => ({
  opponentBoardUnitCount: counts.opponent_board_units ?? 0,
  opponentRowHornCount: counts.opponent_row_horns ?? 0,
  opponentDiscardCount: counts.opponent_discard ?? 0,
  opponentRemovedFromGameCount: counts.opponent_removed_from_game ?? 0,
  opponentWeatherCount: counts.opponent_weather ?? 0,
  actingHandKnownOpponentOwnedCount: counts.acting_hand_known ?? 0,
  promptRevealedOpponentHandCount: counts.prompt_revealed_hand ?? 0,
  duplicatePublicReferenceCount: 0,
  duplicateFixedKnownHandReferenceCount: 0,
  uniquePublicKnownCardCount: Object.values(counts).reduce(
    (sum, count) => sum + (count ?? 0),
    0,
  ),
  uniqueFixedKnownHandCardCount: 0,
  otherPublicKnownCount: counts.other_public_known ?? 0,
});

const materializationRoot = (
  overrides: Partial<SamplerMaterializationRootRecord> = {},
): SamplerMaterializationRootRecord => ({
  schemaVersion: "sampler-materialization-root-v1",
  samplerRunId: "test:sampler-public-zone-provenance:cFp64",
  suiteId: "benchmark-v1-starter-matrix-v1",
  matchupId: "starter-a-vs-b",
  seed: "seed-001",
  mirrorGroupId: "starter-a-vs-b:seed-001",
  mirrorIndex: 0,
  step: 1,
  decisionIndex: 0,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  priorId: "known_preset_decklist_prior",
  priorStatus: "prior_available",
  materializationStatus: "invalid",
  sampleCountRequested: 8,
  sampleCountGenerated: 0,
  sampleCountValid: 0,
  sampleCountInvalid: 0,
  invalidReasonCounts: { insufficient_prior_remaining: 1 },
  opponentHiddenPoolSizeBucket: "large",
  opponentHandCount: 3,
  opponentDeckCount: 22,
  duplicatePublicReferenceCount: 0,
  duplicateFixedKnownHandReferenceCount: 0,
  uniquePublicKnownCardCount: 3,
  uniqueFixedKnownHandCardCount: 0,
  mainDeckAttributablePublicCount: 3,
  sideDeckOnlyPublicCount: 1,
  offPriorPublicCount: 0,
  publicAdjustmentCount: 1,
  uncoveredPriorDeficitCount: 1,
  publicAdjustmentReasonCounts: { side_deck_only_public: 1 },
  availableHiddenPoolSizeBucket: "large",
  publicKnownCardCountBucket: "small",
  priorRemainingCardCountBucket: "large",
  handUniqueSourceCountMin: 0,
  handUniqueSourceCountMax: 0,
  handUniqueSourceCountAverage: 0,
  deckUniqueSourceCountMin: 0,
  deckUniqueSourceCountMax: 0,
  deckUniqueSourceCountAverage: 0,
  handDuplicatePressureBucketCounts: { none: 0, pair: 0, triple_plus: 0 },
  deckDuplicatePressureBucketCounts: { none: 0, pair: 0, triple_plus: 0 },
  handDeckOverlapBucketCounts: { none: 0, one: 0, two_to_three: 0, four_plus: 0 },
  rootPublicFingerprint: "root-a",
  ...overrides,
});

const invalidRoot = (
  overrides: Partial<SamplerInvalidRootRecord> = {},
): SamplerInvalidRootRecord => {
  const zoneSummary =
    overrides.publicKnownByZone ??
    publicKnownByZone({
      opponent_board_units: 3,
    });
  const publicKnownCardCount = zoneSummary.uniquePublicKnownCardCount;

  return {
    schemaVersion: "sampler-invalid-root-v1",
    samplerRunId: "test:sampler-public-zone-provenance:cFp64",
    suiteId: "benchmark-v1-starter-matrix-v1",
    matchupId: "starter-a-vs-b",
    seed: "seed-001",
    mirrorGroupId: "starter-a-vs-b:seed-001",
    mirrorIndex: 0,
    step: 1,
    decisionIndex: 0,
    phase: "playing",
    round: 1,
    seatId: "seat_a",
    policyId: "legal-heuristic-v1",
    faction: "northern_realms",
    deckPresetId: "official-northern-realms-starter",
    priorStatus: "prior_available",
    materializationStatus: "invalid",
    invalidReason: "insufficient_prior_remaining",
    classification: "public_zone_count_deficit",
    opponentHandCount: 3,
    opponentDeckCount: 22,
    opponentHiddenCount: 25,
    priorMainDeckCardCount: 32,
    priorRemainingCardCount: 24,
    publicKnownCardCount,
    fixedKnownHandCardCount: 0,
    duplicatePublicReferenceCount: 0,
    duplicateFixedKnownHandReferenceCount: 0,
    uniquePublicKnownCardCount: publicKnownCardCount,
    uniqueFixedKnownHandCardCount: 0,
    mainDeckAttributablePublicCount: publicKnownCardCount,
    sideDeckOnlyPublicCount: 1,
    offPriorPublicCount: 0,
    publicAdjustmentCount: 1,
    uncoveredPriorDeficitCount: 1,
    publicAdjustmentReasonCounts: { side_deck_only_public: 1 },
    hiddenHandDrawCount: 3,
    requiredHiddenDrawCount: 25,
    priorDeficitCount: 1,
    priorExcessCount: 0,
    publicKnownByZone: zoneSummary,
    promptRevealKnownHandCount: zoneSummary.promptRevealedOpponentHandCount,
    hasPendingPromptForActingSeat: false,
    publicKnownCountBucket: "small",
    fixedKnownHandCountBucket: "none",
    hiddenCountDeficitBucket: "one",
    rootPublicFingerprint: "root-a",
    ...overrides,
  };
};

const benchmarkSummary = {
  schemaVersion: "benchmark-summary-v1",
  benchmarkRunId: "test:sampler-public-zone-provenance:cFp64",
  suiteId: "benchmark-v1-starter-matrix-v1",
  totalMatches: 2,
  statusCounts: {
    completed: 2,
    max_steps_exceeded: 0,
    policy_failed: 0,
    engine_error: 0,
  },
  completionRate: 1,
  maxStepRate: 0,
  errorCodeCounts: {},
  replayCheckedCount: 2,
  replayFailedCount: 0,
  policyIds: ["legal-heuristic-v0", "legal-heuristic-v1"],
  deckPresetIds: [
    "official-northern-realms-starter",
    "official-nilfgaard-starter",
  ],
  resultCountsByPolicy: {},
  resultCountsByDeck: {},
  matchupSummaries: [],
  averageSteps: 1,
  averageCommands: 1,
  averageLegalMoves: 11,
  promptCount: 0,
  leaderUseCount: 0,
} as BenchmarkRunResult["summary"];

describe("benchmark sampler public-zone provenance analyzer", () => {
  it("classifies single-zone public provenance labels", () => {
    const fixtures: Array<{
      family: PublicZoneFamily;
      expected: PublicZoneProvenanceLabel;
    }> = [
      { family: "opponent_board_units", expected: "single_zone_board" },
      { family: "opponent_row_horns", expected: "single_zone_row_horn" },
      { family: "opponent_discard", expected: "single_zone_discard" },
      {
        family: "opponent_removed_from_game",
        expected: "single_zone_removed",
      },
      { family: "opponent_weather", expected: "single_zone_weather" },
      {
        family: "acting_hand_known",
        expected: "single_zone_acting_hand_known",
      },
      {
        family: "prompt_revealed_hand",
        expected: "single_zone_prompt_reveal",
      },
    ];

    for (const fixture of fixtures) {
      const counts = emptyZoneCounts();
      counts[fixture.family] = 1;
      expect(
        classifyPublicZoneProvenance({
          phase: "playing",
          publicZoneFamilyCounts: counts,
        }),
      ).toBe(fixture.expected);
    }
  });

  it("applies round-end, zero-zone, mixed-zone, and ambiguous precedence", () => {
    const boardOnly = emptyZoneCounts();
    boardOnly.opponent_board_units = 2;
    expect(
      classifyPublicZoneProvenance({
        phase: "round_end",
        publicZoneFamilyCounts: boardOnly,
      }),
    ).toBe("round_end_public_zone");

    expect(
      classifyPublicZoneProvenance({
        phase: "playing",
        publicZoneFamilyCounts: emptyZoneCounts(),
      }),
    ).toBe("zero_public_zone_unexpected");

    const mixed = emptyZoneCounts();
    mixed.opponent_board_units = 1;
    mixed.opponent_weather = 1;
    expect(
      classifyPublicZoneProvenance({
        phase: "playing",
        publicZoneFamilyCounts: mixed,
      }),
    ).toBe("mixed_public_zones");

    const otherOnly = emptyZoneCounts();
    otherOnly.other_public_known = 1;
    expect(
      classifyPublicZoneProvenance({
        phase: "playing",
        publicZoneFamilyCounts: otherOnly,
      }),
    ).toBe("provenance_ambiguous");
  });

  it("builds one scalar-safe provenance record for each public-zone deficit root", () => {
    const root = buildSamplerPublicZoneProvenanceRecord({
      materializationRoot: materializationRoot({
        invalidReasonCounts: { insufficient_prior_remaining: 1 },
      }),
      invalidRoot: invalidRoot({
        publicKnownByZone: publicKnownByZone({
          opponent_board_units: 2,
          opponent_row_horns: 1,
        }),
      }),
    });

    expect(root).toEqual(
      expect.objectContaining({
        schemaVersion: "sampler-public-zone-provenance-root-v1",
        invalidRootClassification: "public_zone_count_deficit",
        provenanceLabel: "mixed_public_zones",
        priorDeficitBucket: "one",
        publicZoneReferenceCount: 3,
        publicZoneDiversityCount: 2,
        dominantPublicZone: "opponent_board_units",
        dominantPublicZoneCount: 2,
        dominantPublicZoneShareBucket: "majority",
        publicZoneShape: "two_zones",
        duplicatePublicReferenceCount: 0,
        duplicateFixedKnownHandReferenceCount: 0,
        publicAdjustmentCount: 1,
        uncoveredPriorDeficitCount: 1,
        materializationInvalidReasonCounts: { insufficient_prior_remaining: 1 },
      }),
    );

    expect(JSON.stringify(root)).not.toContain("test.");
    expect(JSON.stringify(root)).not.toContain("seat_b:");
  });

  it("does not create provenance records for non-public-zone classifications", () => {
    expect(
      buildSamplerPublicZoneProvenanceRecord({
        materializationRoot: materializationRoot(),
        invalidRoot: invalidRoot({ classification: "raw_hidden_count_exceeds_prior" }),
      }),
    ).toBeNull();
  });

  it("aggregates labels, phase, round, dominant zone, and shape", () => {
    const first = buildSamplerPublicZoneProvenanceRecord({
      materializationRoot: materializationRoot(),
      invalidRoot: invalidRoot({
        publicKnownByZone: publicKnownByZone({ opponent_board_units: 3 }),
      }),
    }) as SamplerPublicZoneProvenanceRecord;
    const second = buildSamplerPublicZoneProvenanceRecord({
      materializationRoot: materializationRoot({
        rootPublicFingerprint: "root-b",
        step: 2,
        decisionIndex: 1,
      }),
      invalidRoot: invalidRoot({
        rootPublicFingerprint: "root-b",
        step: 2,
        decisionIndex: 1,
        phase: "round_end",
        round: 2,
        policyId: "round-end-auto-resolver",
        publicKnownByZone: publicKnownByZone({
          opponent_board_units: 1,
          opponent_weather: 1,
        }),
      }),
    }) as SamplerPublicZoneProvenanceRecord;

    const summary = buildSamplerPublicZoneProvenanceSummary({
      samplerRunId: "test:sampler-public-zone-provenance:cFp64",
      suiteId: "benchmark-v1-starter-matrix-v1",
      sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
      materializationRoots: [
        materializationRoot(),
        materializationRoot({ rootPublicFingerprint: "root-b" }),
        materializationRoot({
          rootPublicFingerprint: "root-c",
          materializationStatus: "valid",
          invalidReasonCounts: {},
          sampleCountGenerated: 8,
          sampleCountValid: 8,
        }),
      ],
      invalidRoots: [
        invalidRoot(),
        invalidRoot({
          rootPublicFingerprint: "root-b",
          phase: "round_end",
          round: 2,
        }),
      ],
      provenanceRoots: [first, second],
      benchmarkSummary,
    });

    expect(summary.invalidProvenanceRootCount).toBe(2);
    expect(summary.provenanceLabelCounts).toEqual(
      expect.objectContaining({
        single_zone_board: 1,
        round_end_public_zone: 1,
      }),
    );
    expect(summary.provenanceRootCountsByPhase).toEqual({
      playing: 1,
      round_end: 1,
    });
    expect(summary.provenanceRootCountsByRound).toEqual({ "1": 1, "2": 1 });
    expect(summary.dominantPublicZoneCounts).toEqual({
      opponent_board_units: 2,
    });
    expect(summary.publicZoneShapeCounts).toEqual({
      single_zone: 1,
      two_zones: 1,
    });
    expect(summary.recommendedNextStep).toContain(
      "event-history/public-transfer memory",
    );
  });
});
