import { describe, expect, it } from "vitest";

import {
  buildSearchConsumerActionFeaturesV0Result,
  CFP77_RECOMMENDATION_GAP,
  CFP77_RECOMMENDATION_NOT_READY,
  EXPLICIT_NON_CLAIMS,
  scanSearchConsumerActionFeaturesV0ArtifactsForHiddenInfo,
  searchConsumerActionFeaturesV0ArtifactHashes,
  serializeSearchConsumerActionFeaturesV0Artifacts,
  type SearchConsumerActionFeaturesV0BuildInput,
  type SearchConsumerActionFeaturesV0Cfp68EligibleRootInput,
  type SearchConsumerActionFeaturesV0SourceArtifactReference,
  type SearchConsumerActionFeaturesV0SourceRunIds,
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
  cfp69ProbeRoots: [
    {
      ...identity,
      probeStatus: "completed",
      publicActionCount: 2,
      publicActionKindCounts: { pass: 1, play_card: 1 },
      targetKindCounts: { none: 1, board_row: 1 },
      targetSideCounts: { none: 1, own: 1 },
    },
  ],
  cfp70AvailabilityRoots: [
    {
      ...identity,
      probeStatus: "completed",
      availabilityDisagreementCount: 0,
      availabilityRiskBucket: "none",
    },
  ],
  cfp71OutcomeRoots: [
    {
      ...identity,
      probeStatus: "completed",
      publicActionSamplePairCount: 16,
      failedOrDeferredPairCount: 0,
      outcomeDivergenceCount: 0,
      outcomeRiskBucket: "none",
      publicOutcomeKindCounts: { same_phase_same_round: 16 },
      transitionKindCounts: { same_phase_same_round: 16 },
    },
  ],
  cfp72BranchingRoots: [
    {
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
    },
  ],
  cfp73CasebookRoots: [
    {
      ...identity,
      primaryCasebookLabel: "large_budget_root",
    },
  ],
  cfp74SecondPlyRoots: [
    {
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
    },
  ],
  cfp74OverBudgetRoots: [],
  cfp74SkippedRoots: [
    {
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
    },
  ],
  sourceArtifactReferenceCount: 36,
  sourceArtifactEmptyHashCount: 0,
  ...overrides,
});

const sourceRunIds: SearchConsumerActionFeaturesV0SourceRunIds = {
  cfp68: `${suiteId}:determinized-probe-contract:cFp68`,
  cfp69: `${suiteId}:determinized-pimc-probe-v0:cFp69`,
  cfp70: `${suiteId}:determinized-pimc-action-availability-v0:cFp70`,
  cfp71: `${suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71`,
  cfp72: `${suiteId}:determinized-pimc-post-one-ply-branching-budget-v0:cFp72`,
  cfp73: `${suiteId}:determinized-pimc-post-one-ply-branching-budget-casebook:cFp73`,
  cfp74: `${suiteId}:determinized-pimc-bounded-second-ply-scaffold-v0:cFp74`,
};

const sourceArtifactReferences: readonly SearchConsumerActionFeaturesV0SourceArtifactReference[] = [
  { label: "cFp68:summary.json", relativePath: "cFp68/summary.json", sha256: "a" },
  { label: "cFp69:summary.json", relativePath: "cFp69/summary.json", sha256: "b" },
  { label: "cFp70:summary.json", relativePath: "cFp70/summary.json", sha256: "c" },
  { label: "cFp71:summary.json", relativePath: "cFp71/summary.json", sha256: "d" },
  { label: "cFp72:summary.json", relativePath: "cFp72/summary.json", sha256: "e" },
  { label: "cFp73:summary.json", relativePath: "cFp73/summary.json", sha256: "f" },
  { label: "cFp74:summary.json", relativePath: "cFp74/summary.json", sha256: "g" },
];

const buildArtifacts = (overrides: Partial<SearchConsumerActionFeaturesV0BuildInput> = {}) =>
  serializeSearchConsumerActionFeaturesV0Artifacts({
    result: buildSearchConsumerActionFeaturesV0Result(baseInput(overrides)),
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId: suiteId,
    sourceRunIds,
    sourceArtifactReferences,
  });

describe("search consumer action features v0 artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const first = buildArtifacts();
    const second = buildArtifacts();

    expect(first).toEqual(second);
    expect(searchConsumerActionFeaturesV0ArtifactHashes(first)).toEqual(
      searchConsumerActionFeaturesV0ArtifactHashes(second),
    );
  });

  it("passes the hidden-info scan for clean artifacts", () => {
    const artifacts = buildArtifacts();

    expect(scanSearchConsumerActionFeaturesV0ArtifactsForHiddenInfo(artifacts)).toEqual([]);
  });

  it("does not flag the word 'payoff' inside non-claims prose", () => {
    const artifacts = buildArtifacts();

    expect(artifacts.reportMarkdown).toContain(
      "cFp76 does not compute payoff tables or principal variations.",
    );
    expect(scanSearchConsumerActionFeaturesV0ArtifactsForHiddenInfo(artifacts)).toEqual([]);
  });

  it("detects injected hidden-info and search-strength hazard tokens", () => {
    const artifacts = buildArtifacts();

    expect(
      scanSearchConsumerActionFeaturesV0ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\ncardsById finalState commandLog eventLog ownHand opponentHand unsafeDebugResults decisionTrace moveId sourceCardId sourceId cardId actionRef rawMove rawLabel deckOrder sampledHand sampledDeck sampledWorld hiddenHand hiddenDeck handSourceCounts deckSourceCounts bestAction selectedAction actionValue expectedValue valueEstimate rewardTarget payoffTable payoffMatrix rolloutReward winProbability principalVariation seat_b:`,
        reportMarkdown: `${artifacts.reportMarkdown}\nGeralt of Rivia\nneutral.geralt-of-rivia\n`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "cardsById",
        "finalState",
        "commandLog",
        "eventLog",
        "ownHand",
        "opponentHand",
        "unsafeDebugResults",
        "decisionTrace",
        "moveId",
        "sourceCardId",
        "sourceId",
        "cardId",
        "actionRef",
        "rawMove",
        "rawLabel",
        "deckOrder",
        "sampledHand",
        "sampledDeck",
        "sampledWorld",
        "hiddenHand",
        "hiddenDeck",
        "handSourceCounts",
        "deckSourceCounts",
        "bestAction",
        "selectedAction",
        "actionValue",
        "expectedValue",
        "valueEstimate",
        "rewardTarget",
        "payoffTable",
        "payoffMatrix",
        "rolloutReward",
        "winProbability",
        "principalVariation",
        "runtime seat_b prefix",
        "catalog identity:Geralt of Rivia",
        "catalog identity:neutral.geralt-of-rivia",
      ]),
    );
  });

  it("includes manifest and summary fields for the action_feature_source_gap path", () => {
    const artifacts = buildArtifacts();
    const manifest = JSON.parse(artifacts.manifestJson) as Record<string, unknown>;
    const summary = JSON.parse(artifacts.summaryJson) as Record<string, unknown>;

    expect(manifest.schemaVersion).toBe("search-consumer-action-features-v0-artifact-v1");
    expect(manifest.consumerReadinessStatus).toBe("action_feature_source_gap");
    expect(manifest.explicitNonClaims).toEqual(EXPLICIT_NON_CLAIMS);
    expect(manifest.cFp77Recommendation).toBe(CFP77_RECOMMENDATION_GAP);
    expect(summary.rootFeatureRowCount).toBe(1);
    expect(summary.actionFeatureRowCount).toBe(0);
    expect(summary.actionFeatureGapRowCount).toBe(5);
    expect(summary.skippedRootRowCount).toBe(1);
    expect(summary.hiddenInfoScanStatus).toBe("clean");
  });

  it("writes an empty action-features.jsonl for action_feature_source_gap", () => {
    const artifacts = buildArtifacts();

    expect(artifacts.actionFeaturesJsonl).toBe("");
    expect(artifacts.rootFeaturesJsonl.trimEnd().split("\n")).toHaveLength(1);
    expect(artifacts.skippedRootsJsonl.trimEnd().split("\n")).toHaveLength(1);
    expect(artifacts.actionFeatureGapsJsonl.trimEnd().split("\n")).toHaveLength(5);
  });

  it("documents the action feature source gap in the report", () => {
    const artifacts = buildArtifacts();

    expect(artifacts.reportMarkdown).toContain("action_feature_source_gap");
    expect(artifacts.reportMarkdown).toContain(
      "cFp77 should add a narrow public-action-identity artifact derived from cFp69/cFp70 sources",
    );
  });

  it("uses the not-ready recommendation when source consistency fails", () => {
    const artifacts = buildArtifacts({
      cfp68EligibleRoots: [cfp68EligibleRoot(), cfp68EligibleRoot()],
    });
    const manifest = JSON.parse(artifacts.manifestJson) as Record<string, unknown>;

    expect(manifest.consumerReadinessStatus).toBe("source_consistency_failed");
    expect(manifest.cFp77Recommendation).toBe(CFP77_RECOMMENDATION_NOT_READY);
    expect(artifacts.rootFeaturesJsonl).toBe("");
    expect(artifacts.actionFeatureGapsJsonl).toBe("");
    expect(artifacts.skippedRootsJsonl).toBe("");
  });
});
