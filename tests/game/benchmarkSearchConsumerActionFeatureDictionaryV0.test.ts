import { describe, expect, it } from "vitest";

import {
  buildSearchConsumerActionFeatureDictionaryV0Result,
  buildSearchConsumerActionFeatureDictionaryV0SourceConsistency,
  compareSearchConsumerActionFeatureDictionaryV0Reconstruction,
  reconstructSearchConsumerActionFeatureDictionaryV0ActionRows,
  type SearchConsumerActionFeatureDictionaryV0BuildInput,
  type SearchConsumerActionFeaturesV1ActionFeatureRow,
  type SearchConsumerActionFeaturesV1RootFeatureRow,
  type SearchConsumerActionFeaturesV1SkippedRootRow,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";
const featureRunId = "cFp80";
const sourceCfp79RunId = "cFp79";

const identity = {
  suiteId,
  matchupId: "starter-nr-vs-ng",
  seed: "seed-1",
  mirrorGroupId: "starter-nr-vs-ng:seed-1",
  mirrorIndex: 0 as const,
  step: 10,
  decisionIndex: 9,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  rootPublicFingerprint: "fingerprint-1",
};

const rootFeature = (
  overrides: Partial<SearchConsumerActionFeaturesV1RootFeatureRow> = {},
): SearchConsumerActionFeaturesV1RootFeatureRow => ({
  ...identity,
  schemaVersion: "search-consumer-action-features-v1-root-feature-v1",
  featureRunId: sourceCfp79RunId,
  rootRef: "root_000001",
  consumerReadinessStatus: "features_ready",
  sourceConsistencyStatus: "ready",
  cFp68EligibilityStatus: "eligible_valid_root",
  cFp69ProbeStatus: "completed",
  cFp69PublicActionCount: 2,
  cFp69PublicActionKindCounts: { pass: 1, play_card: 1 },
  cFp69TargetKindCounts: { none: 1, board_row: 1 },
  cFp69TargetSideCounts: { none: 1, own: 1 },
  cFp70ProbeStatus: "completed",
  cFp70AvailabilityDisagreementCount: 0,
  cFp70AvailabilityRiskBucket: "none",
  cFp71ProbeStatus: "completed",
  cFp71PublicActionSamplePairCount: 16,
  cFp71OutcomeDivergenceCount: 0,
  cFp71OutcomeRiskBucket: "none",
  cFp71PublicOutcomeKindCounts: { same_phase_same_round: 16 },
  cFp71TransitionKindCounts: { same_phase_same_round: 16 },
  cFp72ProbeStatus: "completed",
  cFp72PostOnePlyPublicActionBudgetTotal: 32,
  cFp72PostOnePlyPublicActionBudgetAverage: 2,
  cFp72BranchingBudgetBucket: "small",
  cFp72BranchingRiskBucket: "small",
  cFp72NextPublicActionCountMax: 4,
  cFp72LargestNextPublicActionBucketSizeMax: 2,
  cFp72PostOnePlyActorCounts: { policy_actor: 16 },
  cFp72PostOnePlyPhaseCounts: { playing: 16 },
  cFp73CasebookPresence: "in_casebook",
  cFp73PrimaryCasebookLabel: "large_budget_root",
  cFp73BudgetPressureLabel: "large",
  cFp73TransitionContextLabel: "ordinary_policy_actor",
  cFp74CapStatus: "in_cap",
  cFp74PlannedSecondPlyPairCount: 32,
  cFp74CompletedSecondPlyPairCount: 32,
  cFp74FailedOrDeferredSecondPlyPairCount: 0,
  cFp74SecondPlyExecutionStatus: "completed",
  cFp74SecondPlyOutcomeRiskBucket: "none",
  cFp74SecondPlyTransitionKindCounts: { same_phase_same_round: 20, round_advanced: 12 },
  cFp74SecondPlyPublicActionKindCounts: { play_card: 24, pass: 8 },
  cFp74SecondPlyTargetKindCounts: { board_row: 24, none: 8 },
  cFp74SecondPlyTargetSideCounts: { own: 24, none: 8 },
  ...overrides,
});

const actionFeature = (
  overrides: Partial<SearchConsumerActionFeaturesV1ActionFeatureRow> = {},
): SearchConsumerActionFeaturesV1ActionFeatureRow => {
  const rootRef = overrides.rootRef ?? "root_000001";
  const publicActionRef = overrides.publicActionRef ?? "public_action_001";
  return {
    schemaVersion: "search-consumer-action-features-v1-action-feature-v1",
    featureRunId: sourceCfp79RunId,
    rootRef,
    publicActionRef,
    kind: "play_card",
    ordinal: 1,
    moveCount: 3,
    sourceClass: "unit",
    target: "board_row|own|close",
    strengthBucket: "medium",
    optionIndexLabel: "none",
    moveCountBucket: "small_collision",
    collisionCountWithinBucket: 2,
    hasCollision: true,
    hasTarget: true,
    hasStrengthBucket: true,
    hasOptionIndexLabel: true,
    rootFeatureRef: rootRef,
    actionIdentityRef: `${rootRef}::${publicActionRef}`,
    sourceConsistencyStatus: "ready",
    consumerReadinessStatus: "features_ready",
    ...overrides,
  };
};

const skippedRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV1SkippedRootRow> = {},
): SearchConsumerActionFeaturesV1SkippedRootRow => ({
  ...identity,
  step: 20,
  decisionIndex: 19,
  rootPublicFingerprint: "skipped-fingerprint-1",
  schemaVersion: "search-consumer-action-features-v1-skipped-root-v1",
  featureRunId: sourceCfp79RunId,
  consumerReadinessStatus: "skipped_invalid_root",
  eligibilityStatus: "skipped_invalid_root",
  skipReason: "sampler_invalid_public_zone_count_deficit",
  invalidReason: "insufficient_prior_remaining",
  cFp67PrimaryClassification: "candidate_valid_root_only_skip",
  cFp67TransferClassification: "public_transfer_memory_not_applicable",
  cFp67PersistentDeficitClassification: "persistent_public_zone_count_deficit",
  cFp67DeficitSizeClassification: "one_card_deficit",
  cFp67ProvenanceLabel: "single_zone_board",
  skipStage: "cFp68_cFp69_inherited",
  cFp76SkipStage: "inherited_sampler_skip",
  cFp78SkipStage: "cFp68_cFp69_inherited",
  cFp78IdentityReadinessStatus: "skipped_invalid_root",
  skipCounterDimensions: { suiteId, phase: "playing", round: "1" },
  ...overrides,
});

const baseInput = (
  overrides: Partial<SearchConsumerActionFeatureDictionaryV0BuildInput> = {},
): SearchConsumerActionFeatureDictionaryV0BuildInput => {
  const cfp79RootFeatures = overrides.cfp79RootFeatures ?? [rootFeature()];
  const cfp79ActionFeatures = overrides.cfp79ActionFeatures ?? [
    actionFeature({ publicActionRef: "public_action_001" }),
    actionFeature({
      publicActionRef: "public_action_000",
      kind: "pass",
      ordinal: 0,
      moveCount: 1,
      sourceClass: "none",
      target: undefined,
      strengthBucket: undefined,
      optionIndexLabel: undefined,
      moveCountBucket: "single",
      collisionCountWithinBucket: 0,
      hasCollision: false,
      hasTarget: false,
      hasStrengthBucket: false,
      hasOptionIndexLabel: false,
      actionIdentityRef: "root_000001::public_action_000",
    }),
  ];
  const cfp79SkippedRoots = overrides.cfp79SkippedRoots ?? [skippedRoot()];

  return {
    suiteId,
    featureRunId,
    sourceBenchmarkSuiteId: suiteId,
    sourceCfp79RunId,
    cfp79Summary: {
      featureRunId: sourceCfp79RunId,
      suiteId,
      consumerReadinessStatus: "features_ready",
      rootFeatureRowCount: cfp79RootFeatures.length,
      actionFeatureRowCount: cfp79ActionFeatures.length,
      skippedRootRowCount: cfp79SkippedRoots.length,
      sourceConsistency: { status: "ready" },
    },
    cfp79RootFeatures,
    cfp79ActionFeatures,
    cfp79SkippedRoots,
    sourceArtifactReferenceCount: 6,
    sourceArtifactEmptyHashCount: 0,
    ...overrides,
  };
};

describe("search consumer action feature dictionary v0", () => {
  it("assigns dictionary ids deterministically in lexicographic value order", () => {
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(baseInput());

    expect(result.consumerReadinessStatus).toBe("dictionary_ready");
    expect(result.dictionaries.publicActionRefs.values).toEqual([
      "public_action_000",
      "public_action_001",
    ]);
    expect(result.dictionaries.actionKinds.values).toEqual(["pass", "play_card"]);
    expect(result.compactActionFeatures.map((row) => row.publicActionRefId)).toEqual([1, 0]);
  });

  it("emits one compact action row per cFp79 action row and omits row-constant strings", () => {
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(baseInput());

    expect(result.compactActionFeatures).toHaveLength(2);
    expect(result.sourceConsistency.cfp80CompactActionVsCfp79Delta).toBe(0);
    expect(result.compactActionFeatures[0]).not.toHaveProperty("consumerReadinessStatus");
    expect(result.compactActionFeatures[0]).not.toHaveProperty("sourceConsistencyStatus");
    expect(result.compactActionFeatures[0]).not.toHaveProperty("actionIdentityRef");
    expect(result.compactActionFeatures[0]).not.toHaveProperty("rootFeatureRef");
  });

  it("reconstructs cFp79 action rows for every preserved public scalar field", () => {
    const input = baseInput();
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(input);

    expect(result.reconstructionStatus).toBe("passed");
    expect(result.reconstructionMismatchCount).toBe(0);
    expect(result.reconstructedActionFeatures).toEqual(input.cfp79ActionFeatures);
  });

  it("reports reconstruction mismatches for changed preserved fields", () => {
    const input = baseInput();
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(input);
    const altered = [
      { ...result.reconstructedActionFeatures[0], moveCount: 99 },
      ...result.reconstructedActionFeatures.slice(1),
    ];

    const comparison = compareSearchConsumerActionFeatureDictionaryV0Reconstruction({
      sourceRows: input.cfp79ActionFeatures,
      reconstructedRows: altered,
    });

    expect(comparison.mismatchCount).toBe(1);
    expect(comparison.mismatches[0]).toMatchObject({ field: "moveCount", actual: 99 });
  });

  it("fails source consistency when cFp79 readiness is not features_ready", () => {
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(
      baseInput({
        cfp79Summary: {
          ...baseInput().cfp79Summary,
          consumerReadinessStatus: "source_consistency_failed",
        },
      }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.cfp79ConsumerReadinessStatus).toBe(
      "source_consistency_failed",
    );
  });

  it("fails source consistency when cFp79 summary counts overclaim loaded rows", () => {
    const input = baseInput();
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(
      baseInput({
        cfp79Summary: { ...input.cfp79Summary, actionFeatureRowCount: 3 },
      }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.cfp79ActionFeatureCountActualDelta).toBe(1);
  });

  it("fails source consistency when a compact action references an invalid dictionary id", () => {
    const input = baseInput();
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(input);
    const consistency = buildSearchConsumerActionFeatureDictionaryV0SourceConsistency({
      input,
      compactActionFeatures: [{ ...result.compactActionFeatures[0], rootRefId: 999 }],
      rootFeatures: result.rootFeatures,
      skippedRoots: result.skippedRoots,
      dictionaries: result.dictionaries,
      reconstructedActionFeatures: result.reconstructedActionFeatures,
      reconstructionMismatchCount: 0,
    });

    expect(consistency.status).toBe("not_ready");
    expect(consistency.compactActionRowsWithInvalidRootRefId).toBe(1);
  });

  it("fails source consistency when reconstructed action identity refs are duplicated", () => {
    const duplicate = actionFeature({ publicActionRef: "public_action_001" });
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(
      baseInput({ cfp79ActionFeatures: [duplicate, { ...duplicate }] }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.duplicateReconstructedActionIdentityRefs).toBe(1);
  });

  it("preserves root and skipped rows with cFp80 metadata", () => {
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(baseInput());

    expect(result.rootFeatures[0]).toMatchObject({
      schemaVersion: "search-consumer-action-features-dictionary-v0-root-feature-v1",
      featureRunId,
      rootRef: "root_000001",
      consumerReadinessStatus: "dictionary_ready",
      sourceConsistencyStatus: "ready",
      cFp73BudgetPressureLabel: "large",
    });
    expect(result.skippedRoots[0]).toMatchObject({
      schemaVersion: "search-consumer-action-features-dictionary-v0-skipped-root-v1",
      featureRunId,
      consumerReadinessStatus: "skipped_invalid_root",
      cFp76SkipStage: "inherited_sampler_skip",
      cFp78SkipStage: "cFp68_cFp69_inherited",
    });
  });

  it("reconstructs rows from compact rows and dictionaries without full references in compact rows", () => {
    const input = baseInput();
    const result = buildSearchConsumerActionFeatureDictionaryV0Result(input);
    const reconstructed = reconstructSearchConsumerActionFeatureDictionaryV0ActionRows({
      compactRows: result.compactActionFeatures,
      dictionaries: result.dictionaries,
      constants: {
        schemaVersion: "search-consumer-action-features-v1-action-feature-v1",
        featureRunId: sourceCfp79RunId,
        sourceConsistencyStatus: "ready",
        consumerReadinessStatus: "features_ready",
      },
    });

    expect(reconstructed).toEqual(input.cfp79ActionFeatures);
  });
});
