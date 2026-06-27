import { describe, expect, it } from "vitest";

import {
  buildSearchConsumerActionFeatureCasebookV0Result,
  buildSearchConsumerActionFeatureCasebookV0SourceConsistency,
  type SearchConsumerActionFeatureCasebookV0BuildInput,
  type SearchConsumerActionFeatureCasebookV0DictionaryGroups,
  type SearchConsumerActionFeatureDictionaryV0ActionRow,
  type SearchConsumerActionFeatureDictionaryV0RootFeatureRow,
  type SearchConsumerActionFeatureDictionaryV0SkippedRootRow,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";
const casebookRunId = "cFp81";
const sourceCfp80RunId = "cFp80";

const group = (values: readonly string[]) => ({ count: values.length, values });

const dictionaries = (): SearchConsumerActionFeatureCasebookV0DictionaryGroups => ({
  schemaVersions: group([
    "search-consumer-action-features-dictionary-v0-action-v1",
    "search-consumer-action-features-dictionary-v0-root-feature-v1",
    "search-consumer-action-features-dictionary-v0-skipped-root-v1",
    "search-consumer-action-features-dictionary-v0-summary-v1",
  ]),
  readinessStatuses: group(["dictionary_ready", "ready", "skipped_invalid_root"]),
  rootRefs: group(["root_000001", "root_000002", "root_missing"]),
  publicActionRefs: group(["public_action_000", "public_action_001", "public_action_002"]),
  actionKinds: group(["pass", "play_card", "use_leader"]),
  sourceClasses: group(["leader", "none", "unit"]),
  targets: group(["board_row|own|close", "none"]),
  strengthBuckets: group(["none"]),
  optionIndexLabels: group(["none"]),
  moveCountBuckets: group(["large_collision", "single", "small_collision"]),
});

const rootFeature = (
  rootRef: string,
  overrides: Partial<SearchConsumerActionFeatureDictionaryV0RootFeatureRow> = {},
): SearchConsumerActionFeatureDictionaryV0RootFeatureRow => ({
  schemaVersion: "search-consumer-action-features-dictionary-v0-root-feature-v1",
  featureRunId: sourceCfp80RunId,
  suiteId,
  matchupId: "starter-nr-vs-ng",
  seed: "seed-1",
  mirrorGroupId: "starter-nr-vs-ng:seed-1",
  mirrorIndex: 0,
  step: 10,
  decisionIndex: 9,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  rootPublicFingerprint: `${rootRef}-fingerprint`,
  rootRef,
  consumerReadinessStatus: "dictionary_ready",
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
  cFp73CasebookPresence: "not_in_casebook",
  cFp73PrimaryCasebookLabel: "not_in_casebook",
  cFp73BudgetPressureLabel: "low",
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

const compactAction = (
  overrides: Partial<SearchConsumerActionFeatureDictionaryV0ActionRow> = {},
): SearchConsumerActionFeatureDictionaryV0ActionRow => ({
  rootRefId: 0,
  publicActionRefId: 1,
  kindId: 1,
  ordinal: 1,
  moveCount: 3,
  sourceClassId: 2,
  targetId: 0,
  strengthBucketId: 0,
  optionIndexLabelId: 0,
  moveCountBucketId: 2,
  collisionCountWithinBucket: 2,
  hasCollision: true,
  hasTarget: true,
  hasStrengthBucket: false,
  hasOptionIndexLabel: false,
  ...overrides,
});

const skippedRoot = (
  overrides: Partial<SearchConsumerActionFeatureDictionaryV0SkippedRootRow> = {},
): SearchConsumerActionFeatureDictionaryV0SkippedRootRow => ({
  schemaVersion: "search-consumer-action-features-dictionary-v0-skipped-root-v1",
  featureRunId: sourceCfp80RunId,
  suiteId,
  matchupId: "starter-nr-vs-ng",
  seed: "seed-1",
  mirrorGroupId: "starter-nr-vs-ng:seed-1",
  mirrorIndex: 0,
  step: 20,
  decisionIndex: 19,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  rootPublicFingerprint: "skipped-fingerprint-1",
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
  overrides: Partial<SearchConsumerActionFeatureCasebookV0BuildInput> = {},
): SearchConsumerActionFeatureCasebookV0BuildInput => {
  const cfp80Dictionaries = overrides.cfp80Dictionaries ?? dictionaries();
  const cfp80RootFeatures =
    overrides.cfp80RootFeatures ??
    [
      rootFeature("root_000001", {
        cFp72BranchingRiskBucket: "large",
        cFp73BudgetPressureLabel: "large",
        cFp74CapStatus: "over_budget",
      }),
      rootFeature("root_000002", {
        rootPublicFingerprint: "root_000002-fingerprint",
        round: 2,
        faction: "nilfgaard",
        deckPresetId: "official-nilfgaard-starter",
      }),
    ];
  const cfp80CompactActionFeatures =
    overrides.cfp80CompactActionFeatures ??
    [
      compactAction({ rootRefId: 0, publicActionRefId: 1, kindId: 1, sourceClassId: 2 }),
      compactAction({
        rootRefId: 1,
        publicActionRefId: 0,
        kindId: 0,
        sourceClassId: 1,
        targetId: 1,
        moveCountBucketId: 1,
        moveCount: 1,
        collisionCountWithinBucket: 0,
        hasCollision: false,
        hasTarget: false,
      }),
      compactAction({
        rootRefId: 1,
        publicActionRefId: 2,
        kindId: 2,
        sourceClassId: 0,
        targetId: 1,
        moveCountBucketId: 1,
        moveCount: 1,
        collisionCountWithinBucket: 0,
        hasCollision: false,
        hasTarget: false,
      }),
    ];
  const cfp80SkippedRoots = overrides.cfp80SkippedRoots ?? [skippedRoot()];

  return {
    suiteId,
    casebookRunId,
    sourceBenchmarkSuiteId: suiteId,
    sourceCfp80RunId,
    cfp80Summary: {
      featureRunId: sourceCfp80RunId,
      suiteId,
      consumerReadinessStatus: "dictionary_ready",
      sourceConsistency: { status: "ready" },
      reconstructionStatus: "passed",
      reconstructionMismatchCount: 0,
      rootFeatureRowCount: cfp80RootFeatures.length,
      compactActionFeatureRowCount: cfp80CompactActionFeatures.length,
      skippedRootRowCount: cfp80SkippedRoots.length,
      robustTargetStatus: "not_robust_suite",
      dictionaryGroupCounts: Object.fromEntries(
        Object.entries(cfp80Dictionaries).map(([name, value]) => [name, value.count]),
      ),
    },
    cfp80Dictionaries,
    cfp80RootFeatures,
    cfp80CompactActionFeatures,
    cfp80SkippedRoots,
    sourceArtifactReferenceCount: 7,
    sourceArtifactEmptyHashCount: 0,
    ...overrides,
  };
};

describe("search consumer action feature casebook v0", () => {
  it("passes source consistency for valid cFp80 inputs and emits ready aggregate rows", () => {
    const result = buildSearchConsumerActionFeatureCasebookV0Result(baseInput());

    expect(result.consumerReadinessStatus).toBe("casebook_ready");
    expect(result.sourceConsistency.status).toBe("ready");
    expect(result.casebookRows.length).toBeGreaterThan(0);
    expect(result.sliceSummaries.length).toBeGreaterThan(0);
    expect(result.skippedRootSummary.skippedRootRowCount).toBe(1);
  });

  it("fails source consistency when cFp80 readiness or reconstruction is not ready", () => {
    const notReady = buildSearchConsumerActionFeatureCasebookV0Result(
      baseInput({
        cfp80Summary: {
          ...baseInput().cfp80Summary,
          consumerReadinessStatus: "source_consistency_failed",
        },
      }),
    );
    const reconstructionFailed = buildSearchConsumerActionFeatureCasebookV0Result(
      baseInput({
        cfp80Summary: {
          ...baseInput().cfp80Summary,
          reconstructionStatus: "failed",
          reconstructionMismatchCount: 1,
        },
      }),
    );

    expect(notReady.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(notReady.sourceConsistency.cfp80ConsumerReadinessStatus).toBe(
      "source_consistency_failed",
    );
    expect(reconstructionFailed.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(reconstructionFailed.sourceConsistency.cfp80ReconstructionMismatchCount).toBe(1);
  });

  it("fails source consistency when cFp80 summary counts overclaim loaded rows", () => {
    const input = baseInput();
    const result = buildSearchConsumerActionFeatureCasebookV0Result(
      baseInput({
        cfp80Summary: { ...input.cfp80Summary, compactActionFeatureRowCount: 99 },
      }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.cfp80CompactActionCountActualDelta).toBe(96);
  });

  it("fails source consistency when dictionary counts disagree or compact ids are invalid", () => {
    const dicts = dictionaries();
    const dictionaryMismatch = buildSearchConsumerActionFeatureCasebookV0Result(
      baseInput({
        cfp80Summary: {
          ...baseInput().cfp80Summary,
          dictionaryGroupCounts: { ...baseInput().cfp80Summary.dictionaryGroupCounts, targets: 99 },
        },
      }),
    );
    const invalidIds = buildSearchConsumerActionFeatureCasebookV0Result(
      baseInput({ cfp80CompactActionFeatures: [compactAction({ targetId: 999 })] }),
    );
    const consistency = buildSearchConsumerActionFeatureCasebookV0SourceConsistency(
      baseInput({ cfp80Dictionaries: { ...dicts, targets: { count: 1, values: ["none"] } } }),
    );

    expect(dictionaryMismatch.sourceConsistency.dictionaryGroupCountMismatches).toBe(1);
    expect(invalidIds.sourceConsistency.compactActionRowsWithInvalidDictionaryIds).toBe(1);
    expect(consistency.status).toBe("not_ready");
  });

  it("fails source consistency when a compact action root ref has no root row", () => {
    const result = buildSearchConsumerActionFeatureCasebookV0Result(
      baseInput({ cfp80CompactActionFeatures: [compactAction({ rootRefId: 2 })] }),
    );

    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.compactActionRowsWithInvalidRootRefId).toBe(1);
  });

  it("counts action-level, root-level, and cFp70-cFp74 dimensions correctly", () => {
    const result = buildSearchConsumerActionFeatureCasebookV0Result(baseInput());

    expect(result.countSummaries.publicActionKindCounts).toEqual({
      pass: 1,
      play_card: 1,
      use_leader: 1,
    });
    expect(result.countSummaries.countsBySourceClass).toEqual({
      leader: 1,
      none: 1,
      unit: 1,
    });
    expect(result.countSummaries.countsByTargetToken).toEqual({
      "board_row|own|close": 1,
      none: 2,
    });
    expect(result.countSummaries.countsByRound).toEqual({ "1": 1, "2": 2 });
    expect(result.countSummaries.countsByFaction).toEqual({ nilfgaard: 2, northern_realms: 1 });
    expect(result.countSummaries.cFp72BranchingRiskBucketCounts).toEqual({ large: 1, small: 2 });
    expect(result.countSummaries.cFp73BudgetPressureLabelCounts).toEqual({ large: 1, low: 2 });
    expect(result.countSummaries.cFp74CapStatusCounts).toEqual({ in_cap: 2, over_budget: 1 });
  });

  it("classifies high-collision, high-branching, over-budget, sparse, and skipped contexts deterministically", () => {
    const highCollision = buildSearchConsumerActionFeatureCasebookV0Result(baseInput()).casebookRows.find(
      (row) => row.rowKind === "collision_slice" && row.sliceKey === "collision",
    );
    const highBranching = buildSearchConsumerActionFeatureCasebookV0Result(
      baseInput({
        cfp80CompactActionFeatures: Array.from({ length: 6 }, (_, index) =>
          compactAction({
            rootRefId: 0,
            publicActionRefId: index % 2,
            kindId: 0,
            sourceClassId: 1,
            targetId: 1,
            moveCountBucketId: 1,
            moveCount: 1,
            hasCollision: false,
            hasTarget: false,
            collisionCountWithinBucket: 0,
          }),
        ),
        cfp80Summary: {
          ...baseInput().cfp80Summary,
          compactActionFeatureRowCount: 6,
        },
      }),
    ).casebookRows.find((row) => row.rowKind === "branching_risk_slice" && row.sliceKey === "large");
    const overBudget = buildSearchConsumerActionFeatureCasebookV0Result(
      baseInput({
        cfp80RootFeatures: [
          rootFeature("root_000001", {
            cFp72BranchingRiskBucket: "small",
            cFp73BudgetPressureLabel: "large",
            cFp74CapStatus: "over_budget",
          }),
        ],
        cfp80CompactActionFeatures: Array.from({ length: 6 }, () =>
          compactAction({
            rootRefId: 0,
            kindId: 0,
            sourceClassId: 1,
            targetId: 1,
            moveCountBucketId: 1,
            moveCount: 1,
            hasCollision: false,
            hasTarget: false,
            collisionCountWithinBucket: 0,
          }),
        ),
        cfp80SkippedRoots: [],
      }),
    ).casebookRows.find((row) => row.rowKind === "second_ply_cap_slice");
    const sparse = buildSearchConsumerActionFeatureCasebookV0Result(baseInput()).casebookRows.find(
      (row) => row.rowKind === "source_class_slice" && row.sliceKey === "leader",
    );

    expect(highCollision?.readinessLabel).toBe("consumer_ready_high_collision");
    expect(highCollision?.notes).toContain("high_collision_share");
    expect(highBranching?.readinessLabel).toBe("consumer_ready_high_branching");
    expect(overBudget?.readinessLabel).toBe("consumer_ready_over_budget_context");
    expect(sparse?.readinessLabel).toBe("consumer_ready_sparse_slice");
    expect(sparse?.skippedRootCount).toBe(1);
    expect(sparse?.notes).toContain("inherited_skipped_roots_present");
  });

  it("emits bounded deterministic rows without reconstructed per-action/value fields", () => {
    const first = buildSearchConsumerActionFeatureCasebookV0Result(baseInput());
    const second = buildSearchConsumerActionFeatureCasebookV0Result(baseInput());
    const combined = JSON.stringify(first.casebookRows);

    expect(first.casebookRows).toEqual(second.casebookRows);
    expect(first.casebookRows.every((row) => row.rowRef.includes("_slice_"))).toBe(true);
    expect(first.casebookRows.length).toBeLessThanOrEqual(
      first.thresholds.maxCasebookRowsPerKind * 12,
    );
    expect(combined).not.toContain("publicActionRef");
    expect(combined).not.toContain("rootRef");
    expect(combined).not.toContain("actionIdentityRef");
    expect(combined).not.toContain("bestAction");
    expect(combined).not.toContain("actionValue");
    expect(combined).not.toContain("expectedValue");
  });
});
