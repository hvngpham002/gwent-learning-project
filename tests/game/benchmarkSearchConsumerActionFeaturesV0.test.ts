import { describe, expect, it } from "vitest";

import {
  buildSearchConsumerActionFeaturesV0Result,
  buildSearchConsumerActionFeaturesV0RootFeatureRows,
  type SearchConsumerActionFeaturesV0BuildInput,
  type SearchConsumerActionFeaturesV0Cfp68EligibleRootInput,
  type SearchConsumerActionFeaturesV0Cfp69ProbeRootInput,
  type SearchConsumerActionFeaturesV0Cfp70AvailabilityRootInput,
  type SearchConsumerActionFeaturesV0Cfp71OutcomeRootInput,
  type SearchConsumerActionFeaturesV0Cfp72BranchingRootInput,
  type SearchConsumerActionFeaturesV0Cfp73CasebookRootInput,
  type SearchConsumerActionFeaturesV0Cfp74OverBudgetRootInput,
  type SearchConsumerActionFeaturesV0Cfp74SecondPlyRootInput,
  type SearchConsumerActionFeaturesV0Cfp74SkippedRootInput,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";
const featureRunId = `${suiteId}:search-consumer-action-features-v0:cFp76:test`;

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

const cfp68EligibleRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV0Cfp68EligibleRootInput> = {},
): SearchConsumerActionFeaturesV0Cfp68EligibleRootInput => ({
  ...identity,
  eligibilityStatus: "eligible_valid_root",
  ...overrides,
});

const cfp69ProbeRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV0Cfp69ProbeRootInput> = {},
): SearchConsumerActionFeaturesV0Cfp69ProbeRootInput => ({
  ...identity,
  probeStatus: "completed",
  publicActionCount: 2,
  publicActionKindCounts: { pass: 1, play_card: 1 },
  targetKindCounts: { none: 1, board_row: 1 },
  targetSideCounts: { none: 1, own: 1 },
  ...overrides,
});

const cfp70AvailabilityRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV0Cfp70AvailabilityRootInput> = {},
): SearchConsumerActionFeaturesV0Cfp70AvailabilityRootInput => ({
  ...identity,
  probeStatus: "completed",
  availabilityDisagreementCount: 0,
  availabilityRiskBucket: "none",
  ...overrides,
});

const cfp71OutcomeRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV0Cfp71OutcomeRootInput> = {},
): SearchConsumerActionFeaturesV0Cfp71OutcomeRootInput => ({
  ...identity,
  probeStatus: "completed",
  publicActionSamplePairCount: 16,
  failedOrDeferredPairCount: 0,
  outcomeDivergenceCount: 0,
  outcomeRiskBucket: "none",
  publicOutcomeKindCounts: { same_phase_same_round: 16 },
  transitionKindCounts: { same_phase_same_round: 16 },
  ...overrides,
});

const cfp72BranchingRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV0Cfp72BranchingRootInput> = {},
): SearchConsumerActionFeaturesV0Cfp72BranchingRootInput => ({
  ...identity,
  probeStatus: "completed",
  failedOrDeferredBranchingPairCount: 0,
  postOnePlyPublicActionBudgetTotal: 32,
  postOnePlyPublicActionBudgetAverage: 2,
  branchingBudgetBucket: "small",
  branchingRiskBucket: "small",
  nextPublicActionCountMax: 4,
  largestNextPublicActionBucketSizeMax: 2,
  postOnePlyActorCounts: { policy_actor: 16 },
  postOnePlyPhaseCounts: { playing: 16 },
  ...overrides,
});

const cfp73CasebookRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV0Cfp73CasebookRootInput> = {},
): SearchConsumerActionFeaturesV0Cfp73CasebookRootInput => ({
  ...identity,
  primaryCasebookLabel: "large_budget_root",
  ...overrides,
});

const cfp74SecondPlyRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV0Cfp74SecondPlyRootInput> = {},
): SearchConsumerActionFeaturesV0Cfp74SecondPlyRootInput => ({
  ...identity,
  capStatus: "in_cap",
  casebookPresence: "in_casebook",
  primaryCasebookLabel: "large_budget_root",
  budgetPressureLabel: "large",
  transitionContextLabel: "ordinary_policy_actor",
  plannedSecondPlyPairCount: 32,
  completedSecondPlyPairCount: 32,
  failedOrDeferredSecondPlyPairCount: 0,
  secondPlyExecutionStatus: "completed",
  secondPlyOutcomeRiskBucket: "none",
  secondPlyTransitionKindCounts: { same_phase_same_round: 20, round_advanced: 12 },
  secondPlyPublicActionKindCounts: { play_card: 24, pass: 8 },
  secondPlyTargetKindCounts: { board_row: 24, none: 8 },
  secondPlyTargetSideCounts: { own: 24, none: 8 },
  ...overrides,
});

const cfp74OverBudgetRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV0Cfp74OverBudgetRootInput> = {},
): SearchConsumerActionFeaturesV0Cfp74OverBudgetRootInput => ({
  ...identity,
  capStatus: "over_budget",
  casebookPresence: "not_in_casebook",
  plannedSecondPlyPairCount: 0,
  overBudgetReason: "root_public_action_cap_exceeded",
  ...overrides,
});

const cfp74SkippedRoot = (
  overrides: Partial<SearchConsumerActionFeaturesV0Cfp74SkippedRootInput> = {},
): SearchConsumerActionFeaturesV0Cfp74SkippedRootInput => ({
  ...identity,
  step: 20,
  decisionIndex: 19,
  rootPublicFingerprint: "skipped-fingerprint-1",
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

const baseInput = (
  overrides: Partial<SearchConsumerActionFeaturesV0BuildInput> = {},
): SearchConsumerActionFeaturesV0BuildInput => ({
  suiteId,
  featureRunId,
  sourceBenchmarkSuiteId: suiteId,
  sourceCfp68RunId: `${suiteId}:determinized-probe-contract:cFp68`,
  sourceCfp69RunId: `${suiteId}:determinized-pimc-probe-v0:cFp69`,
  sourceCfp70RunId: `${suiteId}:determinized-pimc-action-availability-v0:cFp70`,
  sourceCfp71RunId: `${suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71`,
  sourceCfp72RunId: `${suiteId}:determinized-pimc-post-one-ply-branching-budget-v0:cFp72`,
  sourceCfp73RunId: `${suiteId}:determinized-pimc-post-one-ply-branching-budget-casebook:cFp73`,
  sourceCfp74RunId: `${suiteId}:determinized-pimc-bounded-second-ply-scaffold-v0:cFp74`,
  cfp68Summary: {
    contractStatus: "probe_ready",
    eligibleRootCount: 1,
    invalidRootCountFromCfp67: 1,
  },
  cfp69Summary: {
    probeReadinessStatus: "probe_ready",
    probeRootCount: 1,
    skippedRootCount: 1,
  },
  cfp70Summary: {
    probeReadinessStatus: "probe_ready",
    availabilityRootCount: 1,
    skippedRootCount: 1,
  },
  cfp71Summary: {
    probeReadinessStatus: "probe_ready",
    outcomeRootCount: 1,
    skippedRootCount: 1,
  },
  cfp72Summary: {
    probeReadinessStatus: "probe_ready",
    branchingRootCount: 1,
    skippedRootCount: 1,
  },
  cfp74Summary: {
    scaffoldReadinessStatus: "ready",
    inCapRootCount: 1,
    overBudgetRootCount: 0,
    inheritedSkippedRootCount: 1,
    failedOrDeferredSecondPlyPairCount: 0,
    sourceConsistency: { inCapRootsNotObserved: 0 },
  },
  cfp68EligibleRoots: [cfp68EligibleRoot()],
  cfp69ProbeRoots: [cfp69ProbeRoot()],
  cfp70AvailabilityRoots: [cfp70AvailabilityRoot()],
  cfp71OutcomeRoots: [cfp71OutcomeRoot()],
  cfp72BranchingRoots: [cfp72BranchingRoot()],
  cfp73CasebookRoots: [cfp73CasebookRoot()],
  cfp74SecondPlyRoots: [cfp74SecondPlyRoot()],
  cfp74OverBudgetRoots: [],
  cfp74SkippedRoots: [cfp74SkippedRoot()],
  sourceArtifactReferenceCount: 36,
  sourceArtifactEmptyHashCount: 0,
  ...overrides,
});

describe("search consumer action features v0", () => {
  it("builds root feature rows with action_feature_source_gap readiness when source consistency is ready", () => {
    const result = buildSearchConsumerActionFeaturesV0Result(baseInput());

    expect(result.sourceConsistency.status).toBe("ready");
    expect(result.consumerReadinessStatus).toBe("action_feature_source_gap");
    expect(result.rootFeatures).toHaveLength(1);
    expect(result.actionFeatures).toHaveLength(0);
    expect(result.actionFeatureGaps).toHaveLength(5);
    expect(result.actionFeatureGaps.map((gap) => gap.sourcePhase)).toEqual([
      "cFp69",
      "cFp70",
      "cFp71",
      "cFp72",
      "cFp74",
    ]);
  });

  it("populates root feature row fields from cFp69-cFp74 sources", () => {
    const result = buildSearchConsumerActionFeaturesV0Result(baseInput());
    const row = result.rootFeatures[0];

    expect(row).toMatchObject({
      schemaVersion: "search-consumer-action-features-v0-root-feature-v1",
      featureRunId,
      suiteId,
      cFp68EligibilityStatus: "eligible_valid_root",
      cFp69ProbeStatus: "completed",
      cFp70ProbeStatus: "completed",
      cFp71ProbeStatus: "completed",
      cFp72ProbeStatus: "completed",
      cFp74CapStatus: "in_cap",
      sourceConsistencyStatus: "ready",
      cFp69PublicActionCount: 2,
      cFp73CasebookPresence: "in_casebook",
      cFp73PrimaryCasebookLabel: "large_budget_root",
      cFp74PlannedSecondPlyPairCount: 32,
      cFp74CompletedSecondPlyPairCount: 32,
    });
    expect(row.cFp74OverBudgetReason).toBeUndefined();
  });

  it("joins cFp72 branching roots that omit suiteId using the build input's suiteId", () => {
    const cfp72WithoutSuiteId: Record<string, unknown> = { ...cfp72BranchingRoot() };
    delete cfp72WithoutSuiteId.suiteId;
    expect((cfp72WithoutSuiteId as { suiteId?: string }).suiteId).toBeUndefined();

    const result = buildSearchConsumerActionFeaturesV0Result(
      baseInput({
        cfp72BranchingRoots: [
          cfp72WithoutSuiteId as unknown as SearchConsumerActionFeaturesV0Cfp72BranchingRootInput,
        ],
      }),
    );

    expect(result.sourceConsistency.status).toBe("ready");
    expect(result.sourceConsistency.cfp72RootsMissingCfp68EligibleRoot).toBe(0);
    expect(result.rootFeatures[0]?.cFp72BranchingBudgetBucket).toBe("small");
  });

  it("carries cFp74 skipped roots into cFp76 skipped rows", () => {
    const result = buildSearchConsumerActionFeaturesV0Result(baseInput());

    expect(result.skippedRoots).toHaveLength(1);
    expect(result.skippedRoots[0]).toMatchObject({
      schemaVersion: "search-consumer-action-features-v0-skipped-root-v1",
      featureRunId,
      consumerReadinessStatus: "skipped_invalid_root",
      eligibilityStatus: "skipped_invalid_root",
      skipReason: "sampler_invalid_public_zone_count_deficit",
      invalidReason: "insufficient_prior_remaining",
      skipStage: "inherited_sampler_skip",
    });
  });

  it("marks source consistency not_ready on duplicate cFp68 eligible root keys", () => {
    const result = buildSearchConsumerActionFeaturesV0Result(
      baseInput({ cfp68EligibleRoots: [cfp68EligibleRoot(), cfp68EligibleRoot()] }),
    );

    expect(result.sourceConsistency.status).toBe("not_ready");
    expect(result.sourceConsistency.duplicateCfp68EligibleRootKeys).toBe(1);
    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(result.rootFeatures).toHaveLength(0);
    expect(result.skippedRoots).toHaveLength(0);
    expect(result.actionFeatureGaps).toHaveLength(0);
  });

  it("marks source consistency not_ready when cFp71 has failed or deferred pairs", () => {
    const result = buildSearchConsumerActionFeaturesV0Result(
      baseInput({ cfp71OutcomeRoots: [cfp71OutcomeRoot({ failedOrDeferredPairCount: 1 })] }),
    );

    expect(result.sourceConsistency.status).toBe("not_ready");
    expect(result.sourceConsistency.cFp71FailedOrDeferredPairTotal).toBe(1);
    expect(result.consumerReadinessStatus).toBe("source_consistency_failed");
  });

  it("flags cFp73 casebook roots missing a cFp72 branching root", () => {
    const otherRoot = cfp73CasebookRoot({
      rootPublicFingerprint: "other-fingerprint",
      step: 99,
      decisionIndex: 98,
    });
    const result = buildSearchConsumerActionFeaturesV0Result(
      baseInput({ cfp73CasebookRoots: [otherRoot] }),
    );

    expect(result.sourceConsistency.cfp73CasebookRootsMissingCfp72BranchingRoot).toBe(1);
    expect(result.sourceConsistency.status).toBe("not_ready");
  });

  it("builds an over-budget root feature row with cFp74OverBudgetReason", () => {
    const result = buildSearchConsumerActionFeaturesV0Result(
      baseInput({
        cfp74SecondPlyRoots: [],
        cfp74OverBudgetRoots: [cfp74OverBudgetRoot()],
        cfp74Summary: {
          scaffoldReadinessStatus: "ready_with_over_budget_skips",
          inCapRootCount: 0,
          overBudgetRootCount: 1,
          inheritedSkippedRootCount: 1,
          failedOrDeferredSecondPlyPairCount: 0,
          sourceConsistency: { inCapRootsNotObserved: 0 },
        },
      }),
    );

    const row = result.rootFeatures[0];
    expect(row?.cFp74CapStatus).toBe("over_budget");
    expect(row?.cFp74OverBudgetReason).toBe("root_public_action_cap_exceeded");
    expect(row?.cFp74CompletedSecondPlyPairCount).toBeUndefined();
    expect(row?.cFp73CasebookPresence).toBe("not_in_casebook");
  });

  it("omits zero-valued entries from sparse count maps", () => {
    const result = buildSearchConsumerActionFeaturesV0Result(
      baseInput({
        cfp69ProbeRoots: [
          cfp69ProbeRoot({
            publicActionKindCounts: { pass: 1, play_card: 0 },
            targetKindCounts: { none: 1, board_row: 0 },
            targetSideCounts: { own: 0, none: 1 },
          }),
        ],
      }),
    );

    const row = result.rootFeatures[0];
    expect(row?.cFp69PublicActionKindCounts).toEqual({ pass: 1 });
    expect(row?.cFp69TargetKindCounts).toEqual({ none: 1 });
    expect(row?.cFp69TargetSideCounts).toEqual({ none: 1 });
  });

  it("builds count summaries from root feature rows", () => {
    const result = buildSearchConsumerActionFeaturesV0Result(baseInput());

    expect(result.countSummaries).toEqual(
      expect.objectContaining({
        countsByPhase: { playing: 1 },
        countsByRound: { "1": 1 },
        countsByPolicy: { "legal-heuristic-v1": 1 },
        countsByFaction: { northern_realms: 1 },
        countsByDeckPreset: { "official-northern-realms-starter": 1 },
        countsByMatchup: { "starter-nr-vs-ng": 1 },
        cFp74CapStatusCounts: { in_cap: 1 },
        cFp73PrimaryCasebookLabelCounts: { large_budget_root: 1 },
      }),
    );
  });

  it("includes the affected action feature count estimate only for the cFp69 gap row", () => {
    const result = buildSearchConsumerActionFeaturesV0Result(baseInput());

    const cfp69Gap = result.actionFeatureGaps.find((gap) => gap.sourcePhase === "cFp69");
    const cfp70Gap = result.actionFeatureGaps.find((gap) => gap.sourcePhase === "cFp70");

    expect(cfp69Gap?.affectedActionFeatureCountEstimate).toBe(2);
    expect(cfp70Gap?.affectedActionFeatureCountEstimate).toBeUndefined();
    expect(result.actionFeatureGaps.every((gap) => gap.gapScope === "suite")).toBe(true);
    expect(
      result.actionFeatureGaps.every(
        (gap) => gap.missingFieldCategory === "durable_public_action_identity",
      ),
    ).toBe(true);
  });

  it("throws when a cFp69 source row is missing for an eligible root", () => {
    expect(() =>
      buildSearchConsumerActionFeaturesV0RootFeatureRows({
        input: baseInput({ cfp69ProbeRoots: [] }),
        consumerReadinessStatus: "action_feature_source_gap",
        sourceConsistencyStatus: "ready",
      }),
    ).toThrow(/missing source row/);
  });
});
