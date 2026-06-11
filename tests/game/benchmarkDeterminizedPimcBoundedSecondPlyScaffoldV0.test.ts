import { describe, expect, it } from "vitest";

import {
  DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_DEFAULT_CAP_POLICY,
  buildDeterminizedPimcBoundedSecondPlyScaffoldV0,
  buildDeterminizedPimcBoundedSecondPlyScaffoldV0RootKey,
  evaluateDeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy,
  executeDeterminizedPimcBoundedSecondPlyScaffoldV0Sample,
  type BuildDeterminizedPimcBoundedSecondPlyScaffoldV0Input,
  type DeterminizedPimcActionAvailabilityV0PublicActionBucket,
  type DeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot,
  type DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetReason,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord,
} from "@/game/benchmark";
import type { EngineCommand, LegalMove, MatchState } from "@/game/core";

const suiteId = "benchmark-v1-starter-matrix-v1";

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

const rootKey = (root = identity) =>
  buildDeterminizedPimcBoundedSecondPlyScaffoldV0RootKey(root);

const branchingRoot = (
  overrides: Partial<DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord> = {},
): DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord =>
  ({
    schemaVersion:
      "determinized-pimc-post-one-ply-branching-budget-v0-root-v1",
    probeRunId:
      `${suiteId}:determinized-pimc-post-one-ply-branching-budget-v0:cFp72`,
    sourceCfp68ContractRunId: `${suiteId}:determinized-probe-contract:cFp68`,
    sourceCfp69ProbeRunId: `${suiteId}:determinized-pimc-probe-v0:cFp69`,
    sourceCfp70AvailabilityRunId:
      `${suiteId}:determinized-pimc-action-availability-v0:cFp70`,
    sourceCfp71OutcomeRunId:
      `${suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71`,
    eligibilityStatus: "eligible_valid_root",
    cfp69ProbeStatus: "completed",
    cfp70AvailabilityStatus: "completed",
    cfp71OutcomeStatus: "completed",
    cfp69PublicActionCount: 2,
    cfp70RootActionBucketCount: 2,
    cfp71PublicActionSamplePairCount: 16,
    cfp71CompletedPairCount: 16,
    cfp71FailedOrDeferredPairCount: 0,
    cfp71OutcomeDivergenceCount: 0,
    probeVariant: "determinized-pimc-post-one-ply-branching-budget-v0",
    probeMode: "post_one_ply_branching_budget_probe",
    sampleCountRequested: 8,
    sampleCountGenerated: 8,
    sampleCountChecked: 8,
    sampleCountBranchingFailed: 0,
    rootPublicActionCount: 2,
    firstPlyPublicActionSamplePairCount: 16,
    completedBranchingPairCount: 16,
    failedOrDeferredBranchingPairCount: 0,
    sampleActionMissingPairCount: 0,
    moveCommandConversionFailedPairCount: 0,
    engineCommandRejectedPairCount: 0,
    engineCommandExceptionPairCount: 0,
    actorResolutionFailedPairCount: 0,
    legalMoveGenerationFailedPairCount: 0,
    publicActionAbstractionFailedPairCount: 0,
    onePlyExecutionDeferredPairCount: 0,
    branchingStatusCounts: { completed: 16 },
    postOnePlyActorCounts: {
      actor_resolution_failed: 0,
      no_actor: 0,
      policy_actor: 16,
      system_round_end_resolver: 0,
      terminal_game_end: 0,
    },
    postOnePlyPhaseCounts: {
      game_end: 0,
      mulligan: 0,
      playing: 16,
      round_end: 0,
    },
    nextLegalMoveCountMin: 2,
    nextLegalMoveCountMax: 6,
    nextLegalMoveCountAverage: 4,
    nextPublicActionCountMin: 1,
    nextPublicActionCountMax: 4,
    nextPublicActionCountAverage: 2,
    nextPublicActionCollisionCountMin: 0,
    nextPublicActionCollisionCountMax: 2,
    nextPublicActionCollisionCountAverage: 1,
    largestNextPublicActionBucketSizeMax: 2,
    nextPublicActionTargetExpansionCountMin: 0,
    nextPublicActionTargetExpansionCountMax: 2,
    nextPublicActionTargetExpansionCountAverage: 1,
    postOnePlyPublicActionBudgetTotal: 32,
    postOnePlyPublicActionBudgetAverage: 2,
    branchingBudgetBucket: "small",
    branchingRiskBucket: "small",
    probeStatus: "completed",
    ...identity,
    ...overrides,
  }) as DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord;

const observedRoot = (
  overrides: Partial<DeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot> = {},
): DeterminizedPimcBoundedSecondPlyScaffoldV0ObservedRoot => ({
  ...identity,
  sampleCountRequested: 8,
  sampleCountGenerated: 8,
  sampleCountChecked: 8,
  plannedSecondPlyPairCount: 32,
  completedSecondPlyPairCount: 32,
  failedOrDeferredSecondPlyPairCount: 0,
  secondPlyExecutionStatus: "completed",
  secondPlyFailureReasonCounts: {},
  secondPlyTransitionKindCounts: { same_phase_same_round: 20, round_advanced: 12 },
  postSecondPlyPhaseCounts: { playing: 20, round_end: 12 },
  postSecondPlyActorCounts: { policy_actor: 20, system_round_end_resolver: 12 },
  secondPlyPublicActionKindCounts: { play_card: 24, pass: 8 },
  secondPlyTargetKindCounts: { board_row: 24, none: 8 },
  secondPlyTargetSideCounts: { own: 24, none: 8 },
  secondPlyOutcomeRiskBucket: "none",
  ...overrides,
});

const skippedRoot = () =>
  ({
    ...identity,
    suiteId,
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
    priorDeficitCount: 1,
    publicTransferMemoryVisibleCardCount: 1,
    publicTransferKnownHiddenHandCount: 0,
    publicTransferKnownHiddenDeckCount: 0,
    publicTransferAdjustmentCount: 0,
    publicTransferUncoveredDeficitCount: 1,
    skipCounterDimensions: {
      suiteId,
      phase: "playing",
      round: "1",
      policyId: "legal-heuristic-v1",
      faction: "northern_realms",
      deckPresetId: "official-northern-realms-starter",
      matchupId: "starter-nr-vs-ng",
      invalidReason: "insufficient_prior_remaining",
      skipReason: "sampler_invalid_public_zone_count_deficit",
    },
  }) as never;

const baseInput = (
  overrides: Partial<BuildDeterminizedPimcBoundedSecondPlyScaffoldV0Input> = {},
): BuildDeterminizedPimcBoundedSecondPlyScaffoldV0Input => {
  const cfp72Root = branchingRoot();
  return {
    scaffoldRunId:
      `${suiteId}:determinized-pimc-bounded-second-ply-scaffold-v0:cFp74:test`,
    suiteId,
    contractSummary: {
      suiteId,
      contractRunId: `${suiteId}:determinized-probe-contract:cFp68`,
      sourceBenchmarkSuiteId: suiteId,
      contractStatus: "probe_ready",
      totalCfp61RootCount: 1,
      eligibleRootCount: 1,
      skippedRootCount: 0,
      matchCount: 1,
      sourceSamplerRunIds: { materialization: "sampler-run" },
    } as never,
    cFp68EligibleRoots: [
      {
        ...identity,
        contractRunId: `${suiteId}:determinized-probe-contract:cFp68`,
        eligibilityStatus: "eligible_valid_root",
        sampleCountRequested: 8,
        sampleCountGenerated: 8,
        sampleCountValid: 8,
        sampleCountInvalid: 0,
      } as never,
    ],
    cFp68SkippedRoots: [],
    cFp69ProbeRoots: [
      {
        ...identity,
        probeRunId: `${suiteId}:determinized-pimc-probe-v0:cFp69`,
        probeStatus: "completed",
        publicActionCount: 2,
        sampleCountRequested: 8,
        sampleCountValid: 8,
      } as never,
    ],
    cFp69SkippedRoots: [],
    cFp70AvailabilitySummary: {
      probeRunId: `${suiteId}:determinized-pimc-action-availability-v0:cFp70`,
    } as never,
    cFp70AvailabilityRoots: [
      {
        ...identity,
        probeStatus: "completed",
        rootActionBucketCount: 2,
        allRootActionsAvailableInAllSamples: true,
        availabilityDisagreementCount: 0,
        sampleCountRequested: 8,
        sampleCountGenerated: 8,
        sampleCountChecked: 8,
      } as never,
    ],
    cFp70SkippedRoots: [],
    cFp71OutcomeSummary: {
      probeRunId: `${suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71`,
    } as never,
    cFp71OutcomeRoots: [
      {
        ...identity,
        probeStatus: "completed",
        rootPublicActionCount: 2,
        publicActionSamplePairCount: 16,
        completedPairCount: 16,
        failedOrDeferredPairCount: 0,
        outcomeDivergenceCount: 0,
        sampleCountRequested: 8,
        sampleCountGenerated: 8,
        sampleCountChecked: 8,
      } as never,
    ],
    cFp71SkippedRoots: [],
    cFp72BranchingSummary: {
      probeRunId: cfp72Root.probeRunId,
      suiteId,
      sourceBenchmarkSuiteId: suiteId,
      probeReadinessStatus: "probe_ready",
      branchingRootCount: 1,
      skippedRootCount: 0,
      skippedRootPercentage: 0,
    } as never,
    cFp72BranchingRoots: [cfp72Root],
    cFp72SkippedRoots: [],
    cFp73CasebookSummary: {
      casebookRunId:
        `${suiteId}:determinized-pimc-post-one-ply-branching-budget-casebook:cFp73`,
      suiteId,
      sourceBenchmarkSuiteId: suiteId,
      casebookReadinessStatus: "casebook_ready",
      casebookRootCount: 1,
      skippedRootCount: 0,
    } as never,
    cFp73CasebookRoots: [
      {
        ...identity,
        suiteId,
        primaryCasebookLabel: "large_budget_root",
        budgetPressureLabel: "large",
        transitionContextLabel: "ordinary_policy_actor",
        cFp74ReadinessHint: "second_ply_scaffold_candidate",
      } as never,
    ],
    cFp73SkippedRoots: [],
    observedRoots: [observedRoot()],
    sourceArtifactReferences: {
      cFp68: [{ label: "cFp68", relativePath: "cFp68/summary.json", sha256: "a" }],
      cFp69: [{ label: "cFp69", relativePath: "cFp69/summary.json", sha256: "b" }],
      cFp70: [{ label: "cFp70", relativePath: "cFp70/summary.json", sha256: "c" }],
      cFp71: [{ label: "cFp71", relativePath: "cFp71/summary.json", sha256: "d" }],
      cFp72: [{ label: "cFp72", relativePath: "cFp72/summary.json", sha256: "e" }],
      cFp73: [{ label: "cFp73", relativePath: "cFp73/summary.json", sha256: "f" }],
    },
    ...overrides,
  };
};

describe("determinized PIMC bounded second-ply scaffold v0", () => {
  it("loads source summaries and roots from cFp68 through cFp73", () => {
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(baseInput());

    expect(result.summary.sourceConsistency).toEqual(
      expect.objectContaining({
        cFp68EligibleRootsRead: 1,
        cFp69ProbeRootsRead: 1,
        cFp70AvailabilityRootsRead: 1,
        cFp71OutcomeRootsRead: 1,
        cFp72BranchingRootsRead: 1,
        cFp73CasebookRootsRead: 1,
      }),
    );
    expect(result.summary.sourceConsistency.status).toBe("ready");
  });

  it("matches deterministic root keys across cFp68 through cFp73", () => {
    const input = baseInput();
    const keys = [
      input.cFp68EligibleRoots[0],
      input.cFp69ProbeRoots[0],
      input.cFp70AvailabilityRoots[0],
      input.cFp71OutcomeRoots[0],
      input.cFp72BranchingRoots[0],
      input.cFp73CasebookRoots[0],
    ].map((root) => rootKey(root as never));

    expect(new Set(keys).size).toBe(1);
  });

  it("detects duplicate source keys", () => {
    const input = baseInput({
      cFp72BranchingRoots: [branchingRoot(), branchingRoot()],
      cFp72BranchingSummary: {
        ...baseInput().cFp72BranchingSummary,
        branchingRootCount: 2,
      } as never,
    });
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(input);

    expect(result.summary.sourceConsistency.duplicateCfp72BranchingRootKeys).toBe(1);
    expect(result.summary.scaffoldReadinessStatus).toBe("not_ready");
  });

  it("detects missing cFp72 source rows", () => {
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(
      baseInput({ cFp72BranchingRoots: [] }),
    );

    expect(result.summary.sourceConsistency.cfp68EligibleRootsMissingCfp72BranchingRoot).toBe(1);
    expect(result.summary.scaffoldReadinessStatus).toBe("not_ready");
  });

  it("detects missing cFp73 source rows", () => {
    const otherCasebookRoot = {
      ...identity,
      step: 99,
      decisionIndex: 98,
      rootPublicFingerprint: "other-fingerprint",
      primaryCasebookLabel: "large_budget_root",
      budgetPressureLabel: "large",
      transitionContextLabel: "ordinary_policy_actor",
      cFp74ReadinessHint: "second_ply_scaffold_candidate",
    } as never;
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(
      baseInput({ cFp73CasebookRoots: [otherCasebookRoot] }),
    );

    expect(result.summary.sourceConsistency.cfp73CasebookRootsMissingCfp72BranchingRoot).toBe(1);
    expect(result.summary.scaffoldReadinessStatus).toBe("not_ready");
  });

  it("detects cFp72 failed or deferred source rows", () => {
    const failed = branchingRoot({
      failedOrDeferredBranchingPairCount: 1,
      probeStatus: "engine_command_rejected",
    });
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(
      baseInput({ cFp72BranchingRoots: [failed] }),
    );

    expect(result.summary.sourceConsistency.cfp72RootsWithFailedOrDeferredPairs).toBe(1);
    expect(result.overBudgetRoots[0]?.overBudgetReason).toBe(
      "source_consistency_not_ready",
    );
  });

  it("carries inherited skipped roots separately from over-budget roots", () => {
    const skip = skippedRoot();
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(
      baseInput({
        contractSummary: {
          ...baseInput().contractSummary,
          totalCfp61RootCount: 2,
          skippedRootCount: 1,
        } as never,
        cFp68SkippedRoots: [skip],
        cFp69SkippedRoots: [skip],
        cFp70SkippedRoots: [skip],
        cFp71SkippedRoots: [skip],
        cFp72SkippedRoots: [skip],
        cFp73SkippedRoots: [skip],
        cFp72BranchingSummary: {
          ...baseInput().cFp72BranchingSummary,
          skippedRootCount: 1,
        } as never,
        cFp73CasebookSummary: {
          ...baseInput().cFp73CasebookSummary,
          skippedRootCount: 1,
        } as never,
      }),
    );

    expect(result.skippedRoots).toHaveLength(1);
    expect(result.skippedRoots[0]?.skipStage).toBe("inherited_sampler_skip");
    expect(result.overBudgetRoots).toHaveLength(0);
  });

  it("attaches cFp73 labels to casebook roots", () => {
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(baseInput());

    expect(result.secondPlyRoots[0]).toEqual(
      expect.objectContaining({
        casebookPresence: "in_casebook",
        primaryCasebookLabel: "large_budget_root",
        budgetPressureLabel: "large",
      }),
    );
  });

  it("marks ordinary roots as not in the cFp73 casebook", () => {
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(
      baseInput({
        cFp73CasebookRoots: [],
        cFp73CasebookSummary: {
          ...baseInput().cFp73CasebookSummary,
          casebookRootCount: 0,
        } as never,
      }),
    );

    expect(result.secondPlyRoots[0]?.casebookPresence).toBe("not_in_casebook");
    expect(result.secondPlyRoots[0]?.primaryCasebookLabel).toBe("not_in_casebook");
  });

  it.each([
    [
      "root_second_ply_pair_cap_exceeded",
      { postOnePlyPublicActionBudgetTotal: 513 },
    ],
    ["root_public_action_cap_exceeded", { rootPublicActionCount: 17 }],
    [
      "post_one_ply_public_action_cap_exceeded",
      { nextPublicActionCountMax: 17 },
    ],
    ["sample_count_cap_exceeded", { sampleCountChecked: 9 }],
  ] as [DeterminizedPimcBoundedSecondPlyScaffoldV0OverBudgetReason, Partial<DeterminizedPimcPostOnePlyBranchingBudgetV0RootRecord>][])(
    "skips roots for %s",
    (reason, overrides) => {
      const root = branchingRoot(overrides);
      const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(
        baseInput({
          cFp72BranchingRoots: [root],
          observedRoots: [],
        }),
      );

      expect(result.overBudgetRoots[0]?.overBudgetReason).toBe(reason);
      expect(result.secondPlyRoots).toHaveLength(0);
    },
  );

  it("uses the specified over-budget reason priority", () => {
    const root = branchingRoot({
      rootPublicActionCount: 17,
      sampleCountChecked: 9,
      postOnePlyPublicActionBudgetTotal: 700,
    });
    const cap = evaluateDeterminizedPimcBoundedSecondPlyScaffoldV0CapPolicy({
      root,
    });

    expect(cap.overBudgetReason).toBe("root_public_action_cap_exceeded");
    expect(cap.overBudgetReasonFlags.sample_count_cap_exceeded).toBe(true);
    expect(cap.overBudgetReasonFlags.root_second_ply_pair_cap_exceeded).toBe(true);
  });

  it("summarizes completed in-cap second-ply execution", () => {
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(baseInput());

    expect(result.summary.inCapRootCount).toBe(1);
    expect(result.summary.completedSecondPlyPairCount).toBe(32);
    expect(result.summary.failedOrDeferredSecondPlyPairCount).toBe(0);
    expect(result.summary.scaffoldReadinessStatus).toBe("ready");
  });

  it("marks second-ply failures or deferred work as not-ready", () => {
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(
      baseInput({
        observedRoots: [
          observedRoot({
            completedSecondPlyPairCount: 30,
            failedOrDeferredSecondPlyPairCount: 2,
            secondPlyExecutionStatus: "completed_with_failures",
            secondPlyFailureReasonCounts: { second_ply_engine_rejected: 2 },
            secondPlyOutcomeRiskBucket: "some_failed_or_deferred",
          }),
        ],
      }),
    );

    expect(result.summary.failedOrDeferredSecondPlyPairCount).toBe(2);
    expect(result.summary.scaffoldReadinessStatus).toBe("not_ready");
  });

  it("aggregates transition, phase, and actor counts", () => {
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(baseInput());

    expect(result.summary.secondPlyTransitionKindCounts.round_advanced).toBe(12);
    expect(result.summary.postSecondPlyPhaseCounts.round_end).toBe(12);
    expect(result.summary.postSecondPlyActorCounts.system_round_end_resolver).toBe(12);
  });

  it("aggregates over-budget counters by dimensions", () => {
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(
      baseInput({
        cFp72BranchingRoots: [
          branchingRoot({ postOnePlyPublicActionBudgetTotal: 513 }),
        ],
        observedRoots: [],
      }),
    );

    expect(result.summary.overBudgetCounters.byPhase.playing).toBe(1);
    expect(result.summary.overBudgetCounters.byPolicy["legal-heuristic-v1"]).toBe(1);
    expect(result.summary.overBudgetCounters.byCasebookLabel.large_budget_root).toBe(1);
  });

  it("crosses cFp73 labels with cFp74 cap status", () => {
    const result = buildDeterminizedPimcBoundedSecondPlyScaffoldV0(
      baseInput({
        cFp72BranchingRoots: [
          branchingRoot({ postOnePlyPublicActionBudgetTotal: 513 }),
        ],
        observedRoots: [],
      }),
    );

    expect(result.summary.labelCountsByCapStatus.over_budget.large_budget_root).toBe(1);
  });

  it("preserves the default cFp74 cap constants", () => {
    expect(
      DETERMINIZED_PIMC_BOUNDED_SECOND_PLY_SCAFFOLD_V0_DEFAULT_CAP_POLICY,
    ).toEqual(
      expect.objectContaining({
        secondPlyPairCapPerRoot: 512,
        rootPublicActionCap: 16,
        postOnePlyPublicActionCapPerState: 16,
        sampleCountCapPerRoot: 8,
        robustTotalPlannedSecondPlyPairSoftCap: 7_500_000,
      }),
    );
  });

  it("executes representative second-ply public buckets and stops after that layer", () => {
    const firstMove = {
      moveId: "first-pass",
      seatId: "seat_a",
      kind: "pass",
      label: "pass",
      target: { kind: "none" },
    } as LegalMove;
    const secondMove = {
      moveId: "second-pass",
      seatId: "seat_b",
      kind: "pass",
      label: "pass",
      target: { kind: "none" },
    } as LegalMove;
    const rootBucket: DeterminizedPimcActionAvailabilityV0PublicActionBucket = {
      key: "pass|none|none||playing|1|none|empty|",
      action: {
        kind: "pass",
        targetKind: "none",
        targetSide: "none",
        phase: "playing",
        round: 1,
        sourceClass: "none",
        moveCount: 1,
      },
    };
    const state = {
      phase: "playing",
      round: 1,
      currentTurn: "seat_a",
      pendingPrompt: null,
    } as MatchState;
    const calls: string[] = [];
    const result = executeDeterminizedPimcBoundedSecondPlyScaffoldV0Sample({
      sampledState: state,
      rootBuckets: [rootBucket],
      sampledLegalMoves: [firstMove],
      phase: "playing",
      round: 1,
      deps: {
        commandFromLegalMove: (move) =>
          ({ type: "Pass", seatId: move.seatId } as Exclude<
            EngineCommand,
            { type: "StartMatch" }
          >),
        executeCommand: ({ state: inputState, command }) => {
          calls.push(command.type);
          return {
            state: {
              ...inputState,
              currentTurn:
                inputState.currentTurn === "seat_a" ? "seat_b" : "seat_a",
            } as MatchState,
          };
        },
        getLegalMoves: () => [secondMove],
      },
    });

    expect(result.plannedSecondPlyPairCount).toBe(1);
    expect(result.completedSecondPlyPairCount).toBe(1);
    expect(calls).toEqual(["Pass", "Pass"]);
  });
});
