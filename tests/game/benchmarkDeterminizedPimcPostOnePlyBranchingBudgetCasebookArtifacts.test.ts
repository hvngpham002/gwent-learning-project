import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcPostOnePlyBranchingBudgetCasebook,
  determinizedPimcPostOnePlyBranchingBudgetCasebookArtifactHashes,
  scanDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactsForHiddenInfo,
  serializeDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary,
} from "@/game/benchmark";

const rootFixture: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot =
  {
    matchupId: "starter-northern-realms-vs-nilfgaard",
    seed: "seed-1",
    step: 1,
    decisionIndex: 1,
    phase: "playing",
    round: 1,
    seatId: "seat_a",
    policyId: "legal-heuristic-v1",
    faction: "northern_realms",
    deckPresetId: "official-northern-realms-starter",
    rootPublicFingerprint: "public-fingerprint-1",
    rootPublicActionCount: 4,
    firstPlyPublicActionSamplePairCount: 8,
    completedBranchingPairCount: 8,
    failedOrDeferredBranchingPairCount: 0,
    sampleCountRequested: 8,
    sampleCountGenerated: 8,
    sampleCountChecked: 8,
    sampleCountBranchingFailed: 0,
    sampleActionMissingPairCount: 0,
    moveCommandConversionFailedPairCount: 0,
    engineCommandRejectedPairCount: 0,
    engineCommandExceptionPairCount: 0,
    actorResolutionFailedPairCount: 0,
    legalMoveGenerationFailedPairCount: 0,
    publicActionAbstractionFailedPairCount: 0,
    onePlyExecutionDeferredPairCount: 0,
    branchingStatusCounts: {
      completed: 8,
      sample_action_missing: 0,
    },
    postOnePlyActorCounts: {
      policy_actor: 8,
      system_round_end_resolver: 0,
      terminal_game_end: 0,
    },
    postOnePlyPhaseCounts: {
      playing: 8,
      round_end: 0,
      game_end: 0,
    },
    nextLegalMoveCountMin: 2,
    nextLegalMoveCountMax: 8,
    nextLegalMoveCountAverage: 5,
    nextPublicActionCountMin: 1,
    nextPublicActionCountMax: 12,
    nextPublicActionCountAverage: 4,
    nextPublicActionCollisionCountMin: 0,
    nextPublicActionCollisionCountMax: 6,
    nextPublicActionCollisionCountAverage: 2,
    largestNextPublicActionBucketSizeMax: 8,
    nextPublicActionTargetExpansionCountMin: 0,
    nextPublicActionTargetExpansionCountMax: 6,
    nextPublicActionTargetExpansionCountAverage: 2,
    postOnePlyPublicActionBudgetTotal: 32,
    postOnePlyPublicActionBudgetAverage: 4,
    branchingBudgetBucket: "small",
    branchingRiskBucket: "small",
    probeStatus: "completed",
  };

const summaryFixture: DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary =
  {
    probeRunId:
      "benchmark-v1-starter-matrix-v1:determinized-pimc-post-one-ply-branching-budget-v0:cFp72",
    suiteId: "benchmark-v1-starter-matrix-v1",
    sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
    probeReadinessStatus: "probe_ready",
    totalCfp68RootCount: 1,
    branchingRootCount: 1,
    skippedRootCount: 0,
    skippedRootPercentage: 0,
    sourceConsistency: { status: "probe_ready" },
    branchingStatus: {
      failedOrDeferredBranchingPairCount: 0,
      rootsWithAnyFailedOrDeferredPair: 0,
      branchingBudgetBucketCounts: {
        deferred: 0,
        extreme: 0,
        failed: 0,
        large: 0,
        medium: 0,
        small: 1,
        tiny: 0,
        very_large: 0,
        zero: 0,
      },
      branchingRiskBucketCounts: {
        deferred: 0,
        extreme: 0,
        failed: 0,
        large: 0,
        medium: 0,
        small: 1,
        tiny: 0,
        very_large: 0,
        zero: 0,
      },
      probeStatusCounts: { completed: 1 },
      postOnePlyActorCounts: { policy_actor: 8 },
      postOnePlyPhaseCounts: { playing: 8 },
    },
    branchingAggregates: {
      aggregateBranchingStatusCountsByFirstPlyPublicActionKind: {
        play_card: { completed: 8 },
      },
      aggregateActorCountsByFirstPlyPublicActionKind: {
        play_card: { policy_actor: 8 },
      },
      aggregateBudgetBucketCountsByFirstPlyPublicActionKind: {
        play_card: { small: 1 },
      },
    },
    skipCounters: {
      bySuite: {},
      byPhase: {},
      byRound: {},
      byMatchup: {},
      byPolicy: {},
      byFaction: {},
      byDeckPreset: {},
      byProvenanceLabel: {},
      byInvalidReason: {},
      bySkipReason: {},
    },
  };

const buildArtifacts = () => {
  const result = buildDeterminizedPimcPostOnePlyBranchingBudgetCasebook({
    casebookRunId:
      "benchmark-v1-starter-matrix-v1:determinized-pimc-post-one-ply-branching-budget-casebook:cFp73:test",
    suiteId: "benchmark-v1-starter-matrix-v1",
    sourceCfp72Summary: summaryFixture,
    sourceCfp72BranchingRoots: [rootFixture],
    sourceCfp72SkippedRoots: [],
    sourceCfp72ArtifactReferences: [
      {
        label: "cFp72 summary",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json",
        sha256: "source-summary-hash",
      },
    ],
  });
  return serializeDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifacts(
    result,
  );
};

describe("determinized PIMC post-one-ply branching budget casebook artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const first = buildArtifacts();
    const second = buildArtifacts();

    expect(first).toEqual(second);
    expect(
      determinizedPimcPostOnePlyBranchingBudgetCasebookArtifactHashes(first),
    ).toEqual(
      determinizedPimcPostOnePlyBranchingBudgetCasebookArtifactHashes(second),
    );
    expect(JSON.parse(first.summaryJson)).toEqual(
      expect.objectContaining({
        casebookRootCount: 1,
        highNextPublicActionCountRootCount: 1,
      }),
    );
  });

  it("rejects injected hidden-info tokens", () => {
    const artifacts = buildArtifacts();

    expect(
      scanDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactsForHiddenInfo(
        artifacts,
      ),
    ).toEqual([]);
    expect(
      scanDeterminizedPimcPostOnePlyBranchingBudgetCasebookArtifactsForHiddenInfo(
        {
          ...artifacts,
          summaryJson: `${artifacts.summaryJson}\n{"cardsById":{}}\n`,
        },
      ),
    ).toContain("cardsById");
  });

  it("includes non-claim language in the artifact report", () => {
    const artifacts = buildArtifacts();

    expect(artifacts.reportMarkdown).toContain("No rollout was run.");
    expect(artifacts.reportMarkdown).toContain(
      "No action quality estimate was computed.",
    );
    expect(artifacts.reportMarkdown).toContain("No product AI behavior changed.");
  });
});
