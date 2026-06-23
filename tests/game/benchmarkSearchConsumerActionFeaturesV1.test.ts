import { describe, expect, it } from "vitest";

import {
  buildSearchConsumerActionFeaturesV1PublicRootKey,
  buildSearchConsumerActionFeaturesV1Result,
  searchConsumerActionFeaturesV1MoveCountBucket,
  type PublicActionIdentitiesCompactV0ActionRow,
  type PublicActionIdentitiesCompactV0RootIndexRow,
  type PublicActionIdentitiesCompactV0SkippedRootRow,
  type SearchConsumerActionFeaturesV0RootFeatureRow,
  type SearchConsumerActionFeaturesV0SkippedRootRow,
  type SearchConsumerActionFeaturesV1BuildInput,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";
const featureRunId = "cFp79";

const identity = {
  suiteId,
  matchupId: "starter-nr-vs-ng",
  seed: "seed-1",
  mirrorGroupId: "starter-nr-vs-ng:seed-1",
  mirrorIndex: 0 as const,
  step: 10,
  decisionIndex: 9,
  phase: "playing" as const,
  round: 1,
  seatId: "seat_a" as const,
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  rootPublicFingerprint: "fingerprint-1",
};

const secondIdentity = {
  ...identity,
  step: 11,
  decisionIndex: 10,
  rootPublicFingerprint: "fingerprint-2",
};

const rootFeature = (
  overrides: Partial<SearchConsumerActionFeaturesV0RootFeatureRow> = {},
): SearchConsumerActionFeaturesV0RootFeatureRow => ({
  ...identity,
  schemaVersion: "search-consumer-action-features-v0-root-feature-v1",
  featureRunId: `${suiteId}:search-consumer-action-features-v0:cFp76`,
  consumerReadinessStatus: "action_feature_source_gap",
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

const rootIndex = (
  overrides: Partial<PublicActionIdentitiesCompactV0RootIndexRow> = {},
): PublicActionIdentitiesCompactV0RootIndexRow => ({
  ...identity,
  schemaVersion: "public-action-identities-compact-v0-root-index-v1",
  rootRef: "root_000001",
  publicActionCount: 2,
  legalMoveCount: 3,
  publicActionCollisionCount: 1,
  largestPublicActionBucketSize: 2,
  ...overrides,
});

const actionRow = (
  overrides: Partial<PublicActionIdentitiesCompactV0ActionRow> = {},
): PublicActionIdentitiesCompactV0ActionRow => ({
  schemaVersion: "public-action-identities-compact-v0-action-v1",
  rootRef: "root_000001",
  publicActionRef: "public_action_000",
  publicActionKeyHash: "abc123",
  kind: "play_card",
  ordinal: 0,
  moveCount: 3,
  sourceClass: "unit",
  target: "board_row|own|close",
  strengthBucket: "medium",
  optionIndexLabel: "none",
  ...overrides,
});

const skippedV0 = (
  overrides: Partial<SearchConsumerActionFeaturesV0SkippedRootRow> = {},
): SearchConsumerActionFeaturesV0SkippedRootRow => ({
  ...identity,
  step: 20,
  decisionIndex: 19,
  rootPublicFingerprint: "skipped-fingerprint-1",
  schemaVersion: "search-consumer-action-features-v0-skipped-root-v1",
  featureRunId: `${suiteId}:search-consumer-action-features-v0:cFp76`,
  consumerReadinessStatus: "skipped_invalid_root",
  eligibilityStatus: "skipped_invalid_root",
  skipReason: "sampler_invalid_public_zone_count_deficit",
  invalidReason: "insufficient_prior_remaining",
  cFp67PrimaryClassification: "candidate_valid_root_only_skip",
  cFp67TransferClassification: "public_transfer_memory_not_applicable",
  cFp67PersistentDeficitClassification: "persistent_public_zone_count_deficit",
  cFp67DeficitSizeClassification: "one_card_deficit",
  cFp67ProvenanceLabel: "single_zone_board",
  skipStage: "inherited_sampler_skip",
  skipCounterDimensions: { suiteId, phase: "playing", round: "1" },
  ...overrides,
});

const skippedCompact = (
  overrides: Partial<PublicActionIdentitiesCompactV0SkippedRootRow> = {},
): PublicActionIdentitiesCompactV0SkippedRootRow => ({
  ...identity,
  step: 20,
  decisionIndex: 19,
  rootPublicFingerprint: "skipped-fingerprint-1",
  schemaVersion: "public-action-identities-compact-v0-skipped-root-v1",
  compactRunId: `${suiteId}:public-action-identities-compact-v0:cFp78`,
  identityReadinessStatus: "skipped_invalid_root",
  eligibilityStatus: "skipped_invalid_root",
  skipReason: "sampler_invalid_public_zone_count_deficit",
  invalidReason: "insufficient_prior_remaining",
  cFp67PrimaryClassification: "candidate_valid_root_only_skip",
  cFp67TransferClassification: "public_transfer_memory_not_applicable",
  cFp67PersistentDeficitClassification: "persistent_public_zone_count_deficit",
  cFp67DeficitSizeClassification: "one_card_deficit",
  cFp67ProvenanceLabel: "single_zone_board",
  skipStage: "cFp68_cFp69_inherited",
  skipCounterDimensions: { suiteId, phase: "playing", round: "1" },
  ...overrides,
});

const baseInput = (
  overrides: Partial<SearchConsumerActionFeaturesV1BuildInput> = {},
): SearchConsumerActionFeaturesV1BuildInput => {
  const cfp76RootFeatures = overrides.cfp76RootFeatures ?? [rootFeature()];
  const cfp76SkippedRoots = overrides.cfp76SkippedRoots ?? [skippedV0()];
  const cfp78ActionIdentities = overrides.cfp78ActionIdentities ?? [
    actionRow(),
    actionRow({
      publicActionRef: "public_action_001",
      publicActionKeyHash: "def456",
      kind: "pass",
      ordinal: 1,
      moveCount: 1,
      sourceClass: "none",
      target: undefined,
      strengthBucket: undefined,
      optionIndexLabel: undefined,
    }),
  ];
  const cfp78RootIndexRows = overrides.cfp78RootIndexRows ?? [rootIndex()];
  const cfp78SkippedRoots = overrides.cfp78SkippedRoots ?? [skippedCompact()];

  return {
    suiteId,
    featureRunId,
    sourceBenchmarkSuiteId: suiteId,
    sourceCfp76RunId: `${suiteId}:search-consumer-action-features-v0:cFp76`,
    sourceCfp78RunId: `${suiteId}:public-action-identities-compact-v0:cFp78`,
    cfp76Summary: {
      featureRunId: `${suiteId}:search-consumer-action-features-v0:cFp76`,
      suiteId,
      consumerReadinessStatus: "action_feature_source_gap",
      rootFeatureRowCount: cfp76RootFeatures.length,
      skippedRootRowCount: cfp76SkippedRoots.length,
      sourceConsistency: { status: "ready" },
    },
    cfp76RootFeatures,
    cfp76SkippedRoots,
    cfp78Summary: {
      compactRunId: `${suiteId}:public-action-identities-compact-v0:cFp78`,
      suiteId,
      compactReadinessStatus: "compact_ready",
      compactActionRowCount: cfp78ActionIdentities.length,
      compactRootIndexRowCount: cfp78RootIndexRows.length,
      compactSkippedRootRowCount: cfp78SkippedRoots.length,
      sourceConsistency: { status: "ready" },
    },
    cfp78ActionIdentities,
    cfp78RootIndexRows,
    cfp78SkippedRoots,
    sourceArtifactReferenceCount: 12,
    sourceArtifactEmptyHashCount: 0,
    ...overrides,
  };
};

describe("search consumer action features v1", () => {
  it("joins cFp76 root features to cFp78 root-index rows by public root identity", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(baseInput());

    expect(result.consumerReadinessStatus).toBe("features_ready");
    expect(result.sourceConsistency.status).toBe("ready");
    expect(result.rootFeatures).toHaveLength(1);
    expect(result.rootFeatures[0]).toMatchObject({
      schemaVersion: "search-consumer-action-features-v1-root-feature-v1",
      featureRunId,
      rootRef: "root_000001",
      cFp69PublicActionCount: 2,
      consumerReadinessStatus: "features_ready",
      sourceConsistencyStatus: "ready",
    });
  });

  it("uses rootPublicFingerprint and mirror group in the public root join key", () => {
    expect(buildSearchConsumerActionFeaturesV1PublicRootKey(identity)).toContain(
      "starter-nr-vs-ng:seed-1|0",
    );
    expect(buildSearchConsumerActionFeaturesV1PublicRootKey(identity)).toContain("fingerprint-1");
  });

  it("fails source consistency when a cFp76 root feature has no cFp78 root-index match", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(
      baseInput({ cfp78RootIndexRows: [], cfp78ActionIdentities: [] }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.cfp76RootFeaturesWithoutCfp78RootIndex).toBe(1);
    expect(result.rootFeatures).toHaveLength(0);
  });

  it("fails source consistency when a cFp78 root-index row has no cFp76 root feature match", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(
      baseInput({
        cfp76RootFeatures: [],
        cfp78ActionIdentities: [],
      }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.cfp78RootIndexRowsWithoutCfp76RootFeature).toBe(1);
  });

  it("emits one action-feature row per cFp78 compact action identity", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(baseInput());

    expect(result.actionFeatures).toHaveLength(2);
    expect(result.sourceConsistency.cfp79ActionFeatureVsCfp78Delta).toBe(0);
    expect(result.actionFeatures.every((row) => row.rootFeatureRef === row.rootRef)).toBe(true);
  });

  it("preserves compact action-local fields and derives collision features", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(baseInput());
    const [playCard, pass] = result.actionFeatures;

    expect(playCard).toMatchObject({
      publicActionRef: "public_action_000",
      kind: "play_card",
      ordinal: 0,
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
      actionIdentityRef: "root_000001::public_action_000",
    });
    expect(pass).toMatchObject({
      kind: "pass",
      moveCountBucket: "single",
      collisionCountWithinBucket: 0,
      hasCollision: false,
      hasTarget: false,
      hasStrengthBucket: false,
      hasOptionIndexLabel: false,
    });
  });

  it("does not duplicate root payload fields or publicActionKeyHash in action-feature rows", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(baseInput());
    const row = result.actionFeatures[0] as Record<string, unknown>;

    expect(row.publicActionKeyHash).toBeUndefined();
    expect(row.cFp69PublicActionCount).toBeUndefined();
    expect(row.cFp70AvailabilityRiskBucket).toBeUndefined();
    expect(row.cFp74PlannedSecondPlyPairCount).toBeUndefined();
  });

  it("fails source consistency for duplicate action identity refs", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(
      baseInput({ cfp78ActionIdentities: [actionRow(), actionRow()] }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.duplicateCfp79ActionIdentityRefs).toBe(1);
  });

  it("fails source consistency for duplicate joined root refs", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(
      baseInput({
        cfp76RootFeatures: [rootFeature(), rootFeature(secondIdentity)],
        cfp78RootIndexRows: [rootIndex(), rootIndex({ ...secondIdentity, rootRef: "root_000001" })],
        cfp78ActionIdentities: [],
      }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.duplicateCfp79RootRefs).toBe(1);
  });

  it("fails source consistency when action rows reference missing root features", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(
      baseInput({ cfp78RootIndexRows: [] }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.cfp79ActionRowsMissingRootFeature).toBe(2);
  });

  it("preserves skipped-root classifications with cFp79 metadata and both source stage labels", () => {
    const result = buildSearchConsumerActionFeaturesV1Result(baseInput());

    expect(result.skippedRoots).toHaveLength(1);
    expect(result.skippedRoots[0]).toMatchObject({
      schemaVersion: "search-consumer-action-features-v1-skipped-root-v1",
      featureRunId,
      skipReason: "sampler_invalid_public_zone_count_deficit",
      invalidReason: "insufficient_prior_remaining",
      cFp67PrimaryClassification: "candidate_valid_root_only_skip",
      skipStage: "cFp68_cFp69_inherited",
      cFp76SkipStage: "inherited_sampler_skip",
      cFp78SkipStage: "cFp68_cFp69_inherited",
      cFp78IdentityReadinessStatus: "skipped_invalid_root",
    });
  });

  it("buckets move counts for singleton and collision action identities", () => {
    expect(searchConsumerActionFeaturesV1MoveCountBucket(1)).toBe("single");
    expect(searchConsumerActionFeaturesV1MoveCountBucket(3)).toBe("small_collision");
    expect(searchConsumerActionFeaturesV1MoveCountBucket(4)).toBe("large_collision");
  });
});
