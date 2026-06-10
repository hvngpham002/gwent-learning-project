import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcPostOnePlyBranchingBudgetCasebook,
  buildDeterminizedPimcPostOnePlyBranchingBudgetCasebookRootKey,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot,
  type DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary,
} from "@/game/benchmark";

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const emptyStatusCounts = () => ({
  completed: 8,
  engine_command_exception: 0,
  engine_command_rejected: 0,
  move_command_conversion_failed: 0,
  one_ply_execution_deferred: 0,
  post_one_ply_actor_resolution_failed: 0,
  post_one_ply_legal_move_generation_failed: 0,
  post_one_ply_public_action_abstraction_failed: 0,
  sample_action_missing: 0,
});

const actorCounts = (overrides: Record<string, number> = {}) => ({
  actor_resolution_failed: 0,
  no_actor: 0,
  policy_actor: 8,
  system_round_end_resolver: 0,
  terminal_game_end: 0,
  ...overrides,
});

const phaseCounts = (overrides: Record<string, number> = {}) => ({
  game_end: 0,
  mulligan: 0,
  playing: 8,
  round_end: 0,
  ...overrides,
});

const baseRoot = (
  overrides: Partial<DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot> = {},
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot => ({
  matchupId: "starter-northern-realms-vs-nilfgaard",
  seed: "seed-1",
  mirrorGroupId: "mirror-1",
  mirrorIndex: 0,
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
  branchingStatusCounts: emptyStatusCounts(),
  postOnePlyActorCounts: actorCounts(),
  postOnePlyPhaseCounts: phaseCounts(),
  nextLegalMoveCountMin: 2,
  nextLegalMoveCountMax: 8,
  nextLegalMoveCountAverage: 5,
  nextPublicActionCountMin: 1,
  nextPublicActionCountMax: 8,
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
  ...overrides,
});

const baseSkippedRoot = (
  overrides: Partial<DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot> = {},
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot => ({
  suiteId: "benchmark-v1-starter-matrix-v1",
  matchupId: "starter-northern-realms-vs-nilfgaard",
  seed: "seed-skip",
  mirrorGroupId: "mirror-skip",
  mirrorIndex: 1,
  step: 2,
  decisionIndex: 3,
  phase: "playing",
  round: 2,
  seatId: "seat_b",
  policyId: "legal-heuristic-v0",
  faction: "nilfgaard",
  deckPresetId: "official-nilfgaard-starter",
  rootPublicFingerprint: "public-fingerprint-skip",
  eligibilityStatus: "skipped_invalid_root",
  skipReason: "sampler_invalid_public_zone_count_deficit",
  invalidReason: "insufficient_prior_remaining",
  cFp67PrimaryClassification: "persistent_deficit",
  cFp67TransferClassification: "public_transfer_unresolved",
  cFp67PersistentDeficitClassification: "persistent",
  cFp67DeficitSizeClassification: "small",
  cFp67ProvenanceLabel: "mixed_public_zones",
  cfp69SkippedStatus: "skipped_invalid_root",
  cfp70SkippedStatus: "skipped_invalid_root",
  cfp71SkippedStatus: "skipped_invalid_root",
  priorDeficitCount: 1,
  publicTransferMemoryVisibleCardCount: 3,
  publicTransferKnownHiddenHandCount: 0,
  publicTransferKnownHiddenDeckCount: 1,
  publicTransferAdjustmentCount: 1,
  publicTransferUncoveredDeficitCount: 1,
  skipCounterDimensions: {
    phase: "playing",
    round: 2,
    policyId: "legal-heuristic-v0",
    faction: "nilfgaard",
  },
  ...overrides,
});

const bucketCountsFor = (
  roots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot[],
) => {
  const counts: Record<string, number> = {
    deferred: 0,
    extreme: 0,
    failed: 0,
    large: 0,
    medium: 0,
    small: 0,
    tiny: 0,
    very_large: 0,
    zero: 0,
  };
  for (const root of roots) counts[root.branchingBudgetBucket] += 1;
  return counts;
};

const summaryFor = (
  roots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot[],
  skippedRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot[] = [],
  overrides: Partial<DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary> = {},
): DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary => {
  const failedRoots = roots.filter(
    (root) => root.failedOrDeferredBranchingPairCount > 0,
  ).length;
  const bucketCounts = bucketCountsFor(roots);
  return {
    probeRunId:
      "benchmark-v1-starter-matrix-v1:determinized-pimc-post-one-ply-branching-budget-v0:cFp72",
    suiteId: "benchmark-v1-starter-matrix-v1",
    sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
    probeReadinessStatus: "probe_ready",
    totalCfp68RootCount: roots.length + skippedRoots.length,
    branchingRootCount: roots.length,
    skippedRootCount: skippedRoots.length,
    skippedRootPercentage:
      roots.length + skippedRoots.length === 0
        ? 0
        : Number(
            ((skippedRoots.length / (roots.length + skippedRoots.length)) * 100).toFixed(
              3,
            ),
          ),
    sourceConsistency: { status: "probe_ready" },
    branchingStatus: {
      failedOrDeferredBranchingPairCount: roots.reduce(
        (total, root) => total + root.failedOrDeferredBranchingPairCount,
        0,
      ),
      rootsWithAnyFailedOrDeferredPair: failedRoots,
      branchingBudgetBucketCounts: bucketCounts,
      branchingRiskBucketCounts: bucketCounts,
      probeStatusCounts: {
        completed: roots.filter((root) => root.probeStatus === "completed").length,
      },
      postOnePlyActorCounts: { policy_actor: 8 * roots.length },
      postOnePlyPhaseCounts: { playing: 8 * roots.length },
    },
    branchingAggregates: {
      aggregateBranchingStatusCountsByFirstPlyPublicActionKind: {
        play_card: { completed: 8 * roots.length },
      },
      aggregateActorCountsByFirstPlyPublicActionKind: {
        play_card: { policy_actor: 8 * roots.length },
      },
      aggregateBudgetBucketCountsByFirstPlyPublicActionKind: {
        play_card: bucketCounts,
      },
    },
    skipCounters: {
      bySuite: { "benchmark-v1-starter-matrix-v1": skippedRoots.length },
      byPhase: skippedRoots.length === 0 ? {} : { playing: skippedRoots.length },
      byRound: skippedRoots.length === 0 ? {} : { "2": skippedRoots.length },
      byMatchup:
        skippedRoots.length === 0
          ? {}
          : { "starter-northern-realms-vs-nilfgaard": skippedRoots.length },
      byPolicy:
        skippedRoots.length === 0
          ? {}
          : { "legal-heuristic-v0": skippedRoots.length },
      byFaction: skippedRoots.length === 0 ? {} : { nilfgaard: skippedRoots.length },
      byDeckPreset:
        skippedRoots.length === 0
          ? {}
          : { "official-nilfgaard-starter": skippedRoots.length },
      byProvenanceLabel:
        skippedRoots.length === 0
          ? {}
          : { mixed_public_zones: skippedRoots.length },
      byInvalidReason:
        skippedRoots.length === 0
          ? {}
          : { insufficient_prior_remaining: skippedRoots.length },
      bySkipReason:
        skippedRoots.length === 0
          ? {}
          : { sampler_invalid_public_zone_count_deficit: skippedRoots.length },
    },
    ...overrides,
  };
};

const runCasebook = (
  roots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceRoot[],
  skippedRoots: readonly DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSkippedRoot[] = [],
  summaryOverrides: Partial<DeterminizedPimcPostOnePlyBranchingBudgetCasebookSourceSummary> = {},
) =>
  buildDeterminizedPimcPostOnePlyBranchingBudgetCasebook({
    casebookRunId:
      "benchmark-v1-starter-matrix-v1:determinized-pimc-post-one-ply-branching-budget-casebook:cFp73:test",
    suiteId: "benchmark-v1-starter-matrix-v1",
    sourceCfp72Summary: summaryFor(roots, skippedRoots, summaryOverrides),
    sourceCfp72BranchingRoots: roots,
    sourceCfp72SkippedRoots: skippedRoots,
    sourceCfp72ArtifactReferences: [
      {
        label: "cFp72 summary",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72/summary.json",
        sha256: "source-summary-hash",
      },
    ],
  });

describe("determinized PIMC post-one-ply branching budget casebook", () => {
  it("reads cFp72 summary and root scalars into a casebook result", () => {
    const result = runCasebook([
      baseRoot({
        branchingBudgetBucket: "large",
        branchingRiskBucket: "large",
      }),
    ]);

    expect(result.summary.sourceCfp72RunId).toContain(
      "determinized-pimc-post-one-ply-branching-budget-v0:cFp72",
    );
    expect(result.summary.casebookReadinessStatus).toBe("casebook_ready");
    expect(result.casebookRoots).toHaveLength(1);
    expect(result.casebookRoots[0]).toEqual(
      expect.objectContaining({
        primaryCasebookLabel: "large_budget_root",
        rootPublicActionCount: 4,
        completedBranchingPairCount: 8,
      }),
    );
  });

  it("builds deterministic root keys and detects duplicates", () => {
    const root = baseRoot();
    const duplicate = clone(root);
    const key = buildDeterminizedPimcPostOnePlyBranchingBudgetCasebookRootKey(
      "benchmark-v1-starter-matrix-v1",
      root,
    );
    const result = runCasebook([root, duplicate]);

    expect(key).toBe(
      buildDeterminizedPimcPostOnePlyBranchingBudgetCasebookRootKey(
        "benchmark-v1-starter-matrix-v1",
        duplicate,
      ),
    );
    expect(result.summary.sourceConsistency.duplicateBranchingRootKeys).toBe(1);
    expect(result.summary.casebookReadinessStatus).toBe("not_ready");
  });

  it("marks source count mismatches as not ready", () => {
    const result = runCasebook([baseRoot()], [], {
      branchingRootCount: 2,
    });

    expect(result.summary.sourceConsistency.branchingRootCountDelta).toBe(-1);
    expect(result.summary.casebookReadinessStatus).toBe("not_ready");
  });

  it("detects failed or deferred cFp72 root status anomalies", () => {
    const statusCounts = emptyStatusCounts();
    statusCounts.sample_action_missing = 1;
    statusCounts.completed = 7;
    const result = runCasebook([
      baseRoot({
        failedOrDeferredBranchingPairCount: 1,
        sampleActionMissingPairCount: 1,
        branchingStatusCounts: statusCounts,
        branchingBudgetBucket: "failed",
        branchingRiskBucket: "failed",
        probeStatus: "sample_action_missing",
      }),
    ]);

    expect(result.summary.statusAnomalyRootCount).toBe(1);
    expect(result.casebookRoots[0]?.primaryCasebookLabel).toBe("status_anomaly");
    expect(result.casebookRoots[0]?.budgetPressureLabel).toBe("status_blocked");
    expect(result.casebookRoots[0]?.cFp74ReadinessHint).toBe("repair_required");
    expect(result.summary.casebookReadinessStatus).toBe("not_ready");
  });

  it("selects large and high-threshold budget roots", () => {
    const result = runCasebook([
      baseRoot({
        rootPublicFingerprint: "large-root",
        branchingBudgetBucket: "large",
        branchingRiskBucket: "large",
      }),
      baseRoot({
        rootPublicFingerprint: "high-next-root",
        nextPublicActionCountMax: 12,
      }),
      baseRoot({
        rootPublicFingerprint: "large-collision-root",
        largestNextPublicActionBucketSizeMax: 16,
      }),
      baseRoot({
        rootPublicFingerprint: "high-expansion-root",
        nextPublicActionTargetExpansionCountMax: 10,
      }),
    ]);

    expect(result.summary.casebookLabelCounts).toEqual(
      expect.objectContaining({
        large_budget_root: 1,
        high_next_public_action_count: 1,
        large_collision_bucket: 1,
        high_target_expansion: 1,
      }),
    );
    expect(result.summary.cFp74ReadinessHintCounts.casebook_first).toBe(3);
    expect(result.summary.cFp74ReadinessHintCounts.second_ply_scaffold_candidate).toBe(
      1,
    );
  });

  it("labels round-end and terminal transition contexts", () => {
    const result = runCasebook([
      baseRoot({
        rootPublicFingerprint: "round-end-root",
        postOnePlyActorCounts: actorCounts({
          policy_actor: 0,
          system_round_end_resolver: 8,
        }),
        postOnePlyPhaseCounts: phaseCounts({ playing: 0, round_end: 8 }),
      }),
      baseRoot({
        rootPublicFingerprint: "terminal-root",
        postOnePlyActorCounts: actorCounts({
          policy_actor: 0,
          terminal_game_end: 8,
        }),
        postOnePlyPhaseCounts: phaseCounts({ game_end: 8, playing: 0 }),
      }),
    ]);

    expect(result.summary.roundEndContextRootCount).toBe(1);
    expect(result.summary.terminalContextRootCount).toBe(1);
    expect(result.casebookRoots.map((root) => root.transitionContextLabel)).toEqual([
      "round_end_resolver_present",
      "terminal_present",
    ]);
  });

  it("keeps high-threshold readiness hints ahead of transition-only rows", () => {
    const result = runCasebook([
      baseRoot({
        nextPublicActionCountMax: 12,
        postOnePlyActorCounts: actorCounts({
          policy_actor: 0,
          system_round_end_resolver: 8,
        }),
        postOnePlyPhaseCounts: phaseCounts({ playing: 0, round_end: 8 }),
      }),
    ]);

    expect(result.casebookRoots[0]?.primaryCasebookLabel).toBe(
      "high_next_public_action_count",
    );
    expect(result.casebookRoots[0]?.budgetPressureLabel).toBe("high_threshold");
    expect(result.casebookRoots[0]?.cFp74ReadinessHint).toBe("casebook_first");
  });

  it("carries skipped roots beside casebook rows", () => {
    const skippedRoot = baseSkippedRoot();
    const result = runCasebook(
      [
        baseRoot({
          branchingBudgetBucket: "large",
          branchingRiskBucket: "large",
        }),
      ],
      [skippedRoot],
    );

    expect(result.skippedRoots).toHaveLength(1);
    expect(result.skippedRoots[0]).toEqual(
      expect.objectContaining({
        eligibilityStatus: "skipped_invalid_root",
        skipReason: "sampler_invalid_public_zone_count_deficit",
        cFp67ProvenanceLabel: "mixed_public_zones",
        publicTransferUncoveredDeficitCount: 1,
      }),
    );
    expect(result.summary.skipCounters.byPolicy).toEqual({
      "legal-heuristic-v0": 1,
    });
  });

  it("aggregates casebook counts by phase, round, policy, faction, deck, and matchup", () => {
    const result = runCasebook([
      baseRoot({
        branchingBudgetBucket: "large",
        branchingRiskBucket: "large",
      }),
      baseRoot({
        rootPublicFingerprint: "root-2",
        phase: "round_end",
        round: 2,
        policyId: "headless-round-end-auto-resolver",
        faction: "nilfgaard",
        deckPresetId: "official-nilfgaard-starter",
        matchupId: "starter-nilfgaard-vs-monsters",
        postOnePlyActorCounts: actorCounts({
          policy_actor: 0,
          terminal_game_end: 8,
        }),
        postOnePlyPhaseCounts: phaseCounts({ game_end: 8, playing: 0 }),
      }),
    ]);

    expect(result.summary.casebookCounters.byPhase).toEqual({
      playing: 1,
      round_end: 1,
    });
    expect(result.summary.casebookCounters.byRound).toEqual({ "1": 1, "2": 1 });
    expect(result.summary.casebookCounters.byPolicy).toEqual({
      "headless-round-end-auto-resolver": 1,
      "legal-heuristic-v1": 1,
    });
    expect(result.summary.casebookCounters.byFaction).toEqual({
      nilfgaard: 1,
      northern_realms: 1,
    });
    expect(result.summary.casebookCounters.byDeckPreset).toEqual({
      "official-nilfgaard-starter": 1,
      "official-northern-realms-starter": 1,
    });
    expect(result.summary.casebookCounters.byMatchup).toEqual({
      "starter-nilfgaard-vs-monsters": 1,
      "starter-northern-realms-vs-nilfgaard": 1,
    });
  });

  it("records aggregate-only first-ply public action kind attribution", () => {
    const result = runCasebook([
      baseRoot({
        branchingBudgetBucket: "large",
        branchingRiskBucket: "large",
      }),
    ]);

    expect(
      result.summary.sourceCfp72FirstPlyPublicActionKindAggregates
        .perRootAttribution,
    ).toBe("not_available_in_cfp72_compact_root_rows");
    expect(
      result.summary.sourceCfp72FirstPlyPublicActionKindAggregates
        .aggregateBudgetBucketCountsByKind.play_card?.large,
    ).toBe(1);
  });
});
