import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets,
  buildDeterminizedPimcPostOnePlyBranchingBudgetV0,
  buildDeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot,
  buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey,
  budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count,
  countDeterminizedPimcPostOnePlyBranchingBudgetV0Surface,
  executeDeterminizedPimcPostOnePlyBranchingBudgetV0Sample,
  resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor,
  type DeterminizedPimcActionAvailabilityV0RootRecord,
  type DeterminizedPimcActionAvailabilityV0SkippedRootRecord,
  type DeterminizedPimcActionAvailabilityV0Summary,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0Summary,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedAggregateCounts,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0Summary,
  type DeterminizedPimcProbeV0RootRecord,
  type DeterminizedPimcProbeV0SkippedRootRecord,
  type DeterminizedProbeContractEligibleRootRecord,
  type DeterminizedProbeContractSkippedRootRecord,
  type DeterminizedProbeContractSummary,
} from "@/game/benchmark";
import { getLegalMoves, startMatch, type MatchState } from "@/game/core";

const artifactDir = (suiteId: string, family: string, phase: string) =>
  resolve(
    process.cwd(),
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    family,
    phase,
  );

const readArtifactText = (
  suiteId: string,
  family: string,
  phase: string,
  file: string,
) => readFileSync(resolve(artifactDir(suiteId, family, phase), file), "utf8");

const readArtifactJson = <T>(
  suiteId: string,
  family: string,
  phase: string,
  file: string,
): T => JSON.parse(readArtifactText(suiteId, family, phase, file)) as T;

const readArtifactJsonl = <T>(
  suiteId: string,
  family: string,
  phase: string,
  file: string,
): T[] =>
  readArtifactText(suiteId, family, phase, file)
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);

interface BranchingFixture {
  suiteId: string;
  contractSummary: DeterminizedProbeContractSummary;
  eligibleRoots: DeterminizedProbeContractEligibleRootRecord[];
  skippedRoots: DeterminizedProbeContractSkippedRootRecord[];
  cFp69ProbeRoots: DeterminizedPimcProbeV0RootRecord[];
  cFp69SkippedRoots: DeterminizedPimcProbeV0SkippedRootRecord[];
  cFp70Summary: DeterminizedPimcActionAvailabilityV0Summary;
  cFp70AvailabilityRoots: DeterminizedPimcActionAvailabilityV0RootRecord[];
  cFp70SkippedRoots: DeterminizedPimcActionAvailabilityV0SkippedRootRecord[];
  cFp71Summary: DeterminizedPimcOnePlyOutcomeSkeletonV0Summary;
  cFp71OutcomeRoots: DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord[];
  cFp71SkippedRoots: DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord[];
  observedRoots: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot[];
  observedAggregateCounts: DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedAggregateCounts;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const emptyBranchingStatusCounts = () => ({
  completed: 0,
  engine_command_exception: 0,
  engine_command_rejected: 0,
  move_command_conversion_failed: 0,
  one_ply_execution_deferred: 0,
  post_one_ply_actor_resolution_failed: 0,
  post_one_ply_legal_move_generation_failed: 0,
  post_one_ply_public_action_abstraction_failed: 0,
  sample_action_missing: 0,
});

const emptyActorCounts = () => ({
  actor_resolution_failed: 0,
  no_actor: 0,
  policy_actor: 0,
  system_round_end_resolver: 0,
  terminal_game_end: 0,
});

const emptyPhaseCounts = () => ({
  game_end: 0,
  mulligan: 0,
  playing: 0,
  round_end: 0,
});

const emptyNestedCounts = () => ({
  choose_mulligan: {},
  choose_prompt_option: {},
  pass: {},
  play_card: {},
  resolve_round_end: {},
  use_leader: {},
});

const observedFromCfp71 = (
  root: DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord,
): DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot => {
  const statusCounts = emptyBranchingStatusCounts();
  statusCounts.completed = root.publicActionSamplePairCount;
  const actorCounts = emptyActorCounts();
  actorCounts.policy_actor = root.publicActionSamplePairCount;
  const phaseCounts = emptyPhaseCounts();
  phaseCounts.playing = root.publicActionSamplePairCount;

  return {
    suiteId: root.suiteId,
    matchupId: root.matchupId,
    seed: root.seed,
    ...(root.mirrorGroupId ? { mirrorGroupId: root.mirrorGroupId } : {}),
    ...(root.mirrorIndex === undefined ? {} : { mirrorIndex: root.mirrorIndex }),
    step: root.step,
    decisionIndex: root.decisionIndex,
    phase: root.phase,
    round: root.round,
    seatId: root.seatId,
    policyId: root.policyId,
    faction: root.faction,
    deckPresetId: root.deckPresetId,
    rootPublicFingerprint: root.rootPublicFingerprint,
    cfp68RootPublicFingerprint: root.rootPublicFingerprint,
    cfp69LegalMoveCount: root.cfp69PublicActionCount,
    cfp69PublicActionCount: root.cfp69PublicActionCount,
    cfp70AvailabilityStatus: root.cfp70AvailabilityStatus,
    cfp70RootActionBucketCount: root.cfp70RootActionBucketCount,
    cfp71OutcomeStatus: root.probeStatus,
    cfp71PublicActionSamplePairCount: root.publicActionSamplePairCount,
    cfp71CompletedPairCount: root.completedPairCount,
    cfp71FailedOrDeferredPairCount: root.failedOrDeferredPairCount,
    cfp71OutcomeDivergenceCount: root.outcomeDivergenceCount,
    sampleCountRequested: root.sampleCountRequested,
    sampleCountGenerated: root.sampleCountGenerated,
    sampleCountChecked: root.sampleCountChecked,
    sampleCountBranchingFailed: 0,
    rootPublicActionCount: root.rootPublicActionCount,
    firstPlyPublicActionSamplePairCount: root.publicActionSamplePairCount,
    completedBranchingPairCount: root.publicActionSamplePairCount,
    failedOrDeferredBranchingPairCount: 0,
    sampleActionMissingPairCount: 0,
    moveCommandConversionFailedPairCount: 0,
    engineCommandRejectedPairCount: 0,
    engineCommandExceptionPairCount: 0,
    actorResolutionFailedPairCount: 0,
    legalMoveGenerationFailedPairCount: 0,
    publicActionAbstractionFailedPairCount: 0,
    onePlyExecutionDeferredPairCount: 0,
    branchingStatusCounts: statusCounts,
    postOnePlyActorCounts: actorCounts,
    postOnePlyPhaseCounts: phaseCounts,
    nextLegalMoveCounts: [1, 6],
    nextPublicActionCounts: [1, 4],
    nextPublicActionCollisionCounts: [0, 2],
    largestNextPublicActionBucketSizes: [1, 3],
    nextPublicActionTargetExpansionCounts: [0, 2],
    branchingBudgetBucket: "small",
    branchingRiskBucket: "small",
    probeStatus: "completed",
  };
};

const loadFixture = (suiteId: string): BranchingFixture => {
  const contractSummary = readArtifactJson<DeterminizedProbeContractSummary>(
    suiteId,
    "determinized-probe-contract",
    "cFp68",
    "summary.json",
  );
  const eligibleRoots =
    readArtifactJsonl<DeterminizedProbeContractEligibleRootRecord>(
      suiteId,
      "determinized-probe-contract",
      "cFp68",
      "eligible-roots.jsonl",
    );
  const skippedRoots =
    readArtifactJsonl<DeterminizedProbeContractSkippedRootRecord>(
      suiteId,
      "determinized-probe-contract",
      "cFp68",
      "skipped-roots.jsonl",
    );
  const cFp69ProbeRoots = readArtifactJsonl<DeterminizedPimcProbeV0RootRecord>(
    suiteId,
    "determinized-pimc-probe-v0",
    "cFp69",
    "probe-roots.jsonl",
  );
  const cFp69SkippedRoots =
    readArtifactJsonl<DeterminizedPimcProbeV0SkippedRootRecord>(
      suiteId,
      "determinized-pimc-probe-v0",
      "cFp69",
      "skipped-roots.jsonl",
    );
  const cFp70Summary =
    readArtifactJson<DeterminizedPimcActionAvailabilityV0Summary>(
      suiteId,
      "determinized-pimc-action-availability-v0",
      "cFp70",
      "summary.json",
    );
  const cFp70AvailabilityRoots =
    readArtifactJsonl<DeterminizedPimcActionAvailabilityV0RootRecord>(
      suiteId,
      "determinized-pimc-action-availability-v0",
      "cFp70",
      "availability-roots.jsonl",
    );
  const cFp70SkippedRoots =
    readArtifactJsonl<DeterminizedPimcActionAvailabilityV0SkippedRootRecord>(
      suiteId,
      "determinized-pimc-action-availability-v0",
      "cFp70",
      "skipped-roots.jsonl",
    );
  const cFp71Summary =
    readArtifactJson<DeterminizedPimcOnePlyOutcomeSkeletonV0Summary>(
      suiteId,
      "determinized-pimc-one-ply-outcome-skeleton-v0",
      "cFp71",
      "summary.json",
    );
  const cFp71OutcomeRoots =
    readArtifactJsonl<DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord>(
      suiteId,
      "determinized-pimc-one-ply-outcome-skeleton-v0",
      "cFp71",
      "outcome-roots.jsonl",
    );
  const cFp71SkippedRoots =
    readArtifactJsonl<DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord>(
      suiteId,
      "determinized-pimc-one-ply-outcome-skeleton-v0",
      "cFp71",
      "skipped-roots.jsonl",
    );

  return {
    suiteId,
    contractSummary,
    eligibleRoots,
    skippedRoots,
    cFp69ProbeRoots,
    cFp69SkippedRoots,
    cFp70Summary,
    cFp70AvailabilityRoots,
    cFp70SkippedRoots,
    cFp71Summary,
    cFp71OutcomeRoots,
    cFp71SkippedRoots,
    observedRoots: cFp71OutcomeRoots.map(observedFromCfp71),
    observedAggregateCounts: {
      branchingStatusCountsByFirstPlyPublicActionKind: emptyNestedCounts(),
      actorCountsByFirstPlyPublicActionKind: emptyNestedCounts(),
      budgetBucketCountsByFirstPlyPublicActionKind: emptyNestedCounts(),
    },
  };
};

const buildProbe = (fixture: BranchingFixture) =>
  buildDeterminizedPimcPostOnePlyBranchingBudgetV0({
    probeRunId: `${fixture.suiteId}:determinized-pimc-post-one-ply-branching-budget-v0:cFp72:test`,
    suiteId: fixture.suiteId,
    contractSummary: fixture.contractSummary,
    cFp68EligibleRoots: fixture.eligibleRoots,
    cFp68SkippedRoots: fixture.skippedRoots,
    cFp69ProbeRoots: fixture.cFp69ProbeRoots,
    cFp69SkippedRoots: fixture.cFp69SkippedRoots,
    cFp70AvailabilitySummary: fixture.cFp70Summary,
    cFp70AvailabilityRoots: fixture.cFp70AvailabilityRoots,
    cFp70SkippedRoots: fixture.cFp70SkippedRoots,
    cFp71OutcomeSummary: fixture.cFp71Summary,
    cFp71OutcomeRoots: fixture.cFp71OutcomeRoots,
    cFp71SkippedRoots: fixture.cFp71SkippedRoots,
    observedRoots: fixture.observedRoots,
    observedAggregateCounts: fixture.observedAggregateCounts,
  });

const expectEveryCounterSumsToSkipped = (
  summary: DeterminizedPimcPostOnePlyBranchingBudgetV0Summary,
) => {
  for (const group of Object.values(summary.skipCounters)) {
    expect(Object.values(group).reduce((sum, count) => sum + count, 0)).toBe(
      summary.skippedRootCount,
    );
  }
};

const startedMatch = () =>
  startMatch({
    seed: "cfp72-branching-helper-test",
    seats: [
      {
        seatId: "seat_a",
        controllerKind: "ai",
        faction: "northern_realms",
        deckPreset: currentNorthernRealmsDeckPreset,
      },
      {
        seatId: "seat_b",
        controllerKind: "ai",
        faction: "nilfgaard",
        deckPreset: currentNilfgaardDeckPreset,
      },
    ],
    catalog: {
      cards: currentCatalogCards,
      leaders: currentCatalogLeaders,
    },
  });

describe("determinized PIMC post-one-ply branching budget v0", () => {
  it("maps cFp68 eligible roots and cFp71 outcome roots to cFp72 branching roots while carrying skipped roots", () => {
    const result = buildProbe(loadFixture("benchmark-v1-starter-matrix-v1"));
    const branchingKeys = new Set(
      result.branchingRoots.map((root) =>
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
    );
    const skippedKeys = new Set(
      result.skippedRoots.map((root) =>
        buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root),
      ),
    );

    expect(result.summary.probeReadinessStatus).toBe("probe_ready");
    expect(result.branchingRoots).toHaveLength(3979);
    expect(result.skippedRoots).toHaveLength(63);
    expect(result.branchingRoots[0]).toEqual(
      expect.objectContaining({
        eligibilityStatus: "eligible_valid_root",
        probeMode: "post_one_ply_branching_budget_probe",
        probeStatus: "completed",
        sourceCfp71OutcomeRunId:
          "benchmark-v1-starter-matrix-v1:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71",
      }),
    );
    for (const key of skippedKeys) {
      expect(branchingKeys.has(key)).toBe(false);
    }
    expect(result.summary.sourceConsistency.skippedRootsIncorrectlyProbed).toBe(0);
  });

  it("matches current and robust root counts, skip counts, samples, and first-ply pair totals", () => {
    const current = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-v1"),
    ).summary;
    const robust = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-robust-v1"),
    ).summary;

    expect(current.totalCfp68RootCount).toBe(4042);
    expect(current.branchingRootCount).toBe(3979);
    expect(current.skippedRootCount).toBe(63);
    expect(current.skippedRootPercentage).toBe(1.559);
    expect(current.sampleBudget.totalCheckedSampleCount).toBe(31832);
    expect(current.branchingStatus.firstPlyPublicActionSamplePairTotal).toBe(
      150560,
    );

    expect(robust.totalCfp68RootCount).toBe(32487);
    expect(robust.branchingRootCount).toBe(32147);
    expect(robust.skippedRootCount).toBe(340);
    expect(robust.skippedRootPercentage).toBe(1.047);
    expect(robust.sampleBudget.totalCheckedSampleCount).toBe(257176);
    expect(robust.branchingStatus.firstPlyPublicActionSamplePairTotal).toBe(
      1230736,
    );
  });

  it("reports skip counters by every required dimension and sums them to skipped roots", () => {
    const current = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-v1"),
    ).summary;
    const robust = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-robust-v1"),
    ).summary;

    expectEveryCounterSumsToSkipped(current);
    expectEveryCounterSumsToSkipped(robust);
    expect(current.skipCounters.byPhase).toEqual({ playing: 57, round_end: 6 });
    expect(robust.skipCounters.byPhase).toEqual({
      playing: 312,
      round_end: 28,
    });
  });

  it("detects missing observed roots, missing cFp71 outcome roots, duplicates, failed pairs, divergence, and public-action mismatches", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const missingObservedKey =
      buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(
        fixture.eligibleRoots[0],
      );
    const missingObserved = buildProbe({
      ...fixture,
      observedRoots: fixture.observedRoots.filter(
        (root) =>
          buildDeterminizedPimcPostOnePlyBranchingBudgetV0RootKey(root) !==
          missingObservedKey,
      ),
    });
    expect(missingObserved.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(missingObserved.summary.sourceConsistency.eligibleRootsNotObserved).toBe(1);

    const missingCfp71 = buildProbe({
      ...fixture,
      cFp71OutcomeRoots: fixture.cFp71OutcomeRoots.slice(1),
    });
    expect(missingCfp71.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(
      missingCfp71.summary.sourceConsistency.cfp68Cfp71OutcomeRootCountDelta,
    ).toBe(1);

    const failed = clone(fixture.cFp71OutcomeRoots[0]);
    failed.failedOrDeferredPairCount = 1;
    const diverged = clone(fixture.cFp71OutcomeRoots[1]);
    diverged.outcomeDivergenceCount = 1;
    const mismatch = clone(fixture.cFp71OutcomeRoots[2]);
    mismatch.rootPublicActionCount += 1;
    const sourceTrouble = buildProbe({
      ...fixture,
      cFp71OutcomeRoots: [
        failed,
        diverged,
        mismatch,
        ...fixture.cFp71OutcomeRoots.slice(3),
      ],
    });
    expect(sourceTrouble.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(
      sourceTrouble.summary.sourceConsistency.cfp71RootsWithFailedOrDeferredPairs,
    ).toBe(1);
    expect(
      sourceTrouble.summary.sourceConsistency.cfp71RootsWithOutcomeDivergence,
    ).toBe(1);
    expect(
      sourceTrouble.summary.sourceConsistency
        .cfp69Cfp70Cfp71PublicActionCountMismatchRoots,
    ).toBe(1);

    const duplicate = buildProbe({
      ...fixture,
      eligibleRoots: [fixture.eligibleRoots[0], ...fixture.eligibleRoots],
      cFp69ProbeRoots: [fixture.cFp69ProbeRoots[0], ...fixture.cFp69ProbeRoots],
      cFp70AvailabilityRoots: [
        fixture.cFp70AvailabilityRoots[0],
        ...fixture.cFp70AvailabilityRoots,
      ],
      cFp71OutcomeRoots: [
        fixture.cFp71OutcomeRoots[0],
        ...fixture.cFp71OutcomeRoots,
      ],
      observedRoots: [fixture.observedRoots[0], ...fixture.observedRoots],
    });
    expect(duplicate.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(duplicate.summary.sourceConsistency.duplicateObservedRootKeys).toBe(1);
    expect(duplicate.summary.sourceConsistency.duplicateCfp68EligibleRootKeys).toBe(1);
    expect(duplicate.summary.sourceConsistency.duplicateCfp69ProbeRootKeys).toBe(1);
    expect(
      duplicate.summary.sourceConsistency.duplicateCfp70AvailabilityRootKeys,
    ).toBe(1);
    expect(duplicate.summary.sourceConsistency.duplicateCfp71OutcomeRootKeys).toBe(1);
  });

  it("resolves post-one-ply actors for prompt, mulligan, playing, round_end, game_end, and no-actor cases", () => {
    const state = startedMatch().state;

    expect(resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor(state)).toEqual({
      actorLabel: "policy_actor",
      seatId: "seat_a",
    });
    expect(
      resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor({
        ...state,
        pendingPrompt: {
          promptId: "prompt-test",
          seatId: "seat_b",
          kind: "choose_option",
          abilityId: "test",
          options: [],
        },
      }),
    ).toEqual({ actorLabel: "policy_actor", seatId: "seat_b" });
    expect(
      resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor({
        ...state,
        seats: {
          ...state.seats,
          seat_a: { ...state.seats.seat_a, mulliganComplete: true },
          seat_b: { ...state.seats.seat_b, mulliganComplete: true },
        },
      }),
    ).toEqual({ actorLabel: "no_actor", seatId: null });
    expect(
      resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor({
        ...state,
        phase: "playing",
        currentTurn: "seat_b",
      }),
    ).toEqual({ actorLabel: "policy_actor", seatId: "seat_b" });
    expect(
      resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor({
        ...state,
        phase: "round_end",
      }),
    ).toEqual({ actorLabel: "system_round_end_resolver", seatId: "seat_a" });
    expect(
      resolveDeterminizedPimcPostOnePlyBranchingBudgetV0Actor({
        ...state,
        phase: "game_end",
      }),
    ).toEqual({ actorLabel: "terminal_game_end", seatId: null });
  });

  it("counts next legal/public surfaces without executing next moves and counts terminal game-end as zero", () => {
    const state = startedMatch().state;
    const surface = countDeterminizedPimcPostOnePlyBranchingBudgetV0Surface({
      state,
    });
    expect(surface.status).toBe("completed");
    expect(surface.status === "completed" && surface.surface).toEqual(
      expect.objectContaining({
        postOnePlyActor: "policy_actor",
        postOnePlyPhase: "mulligan",
        nextLegalMoveCount: expect.any(Number),
        nextPublicActionCount: expect.any(Number),
      }),
    );

    const terminal = countDeterminizedPimcPostOnePlyBranchingBudgetV0Surface({
      state: { ...state, phase: "game_end" },
    });
    expect(terminal).toEqual({
      status: "completed",
      surface: {
        postOnePlyActor: "terminal_game_end",
        postOnePlyPhase: "game_end",
        nextLegalMoveCount: 0,
        nextPublicActionCount: 0,
        nextPublicActionCollisionCount: 0,
        largestNextPublicActionBucketSize: 0,
        nextPublicActionTargetExpansionCount: 0,
        budgetBucket: "zero",
      },
    });
  });

  it("selects representative first-ply moves deterministically, uses cloned sampled states, and summarizes completed branch pairs", () => {
    const started = startedMatch();
    const legalMoves = getLegalMoves({
      state: started.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const rootBuckets = buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets(
      legalMoves,
      started.state.phase,
      started.state.round,
    );
    const before = clone(started.state);
    const first = executeDeterminizedPimcPostOnePlyBranchingBudgetV0Sample({
      sampledState: started.state,
      seatId: "seat_a",
      rootBuckets,
      sampledLegalMoves: legalMoves,
      phase: started.state.phase,
      round: started.state.round,
    });
    const second = executeDeterminizedPimcPostOnePlyBranchingBudgetV0Sample({
      sampledState: started.state,
      seatId: "seat_a",
      rootBuckets,
      sampledLegalMoves: legalMoves,
      phase: started.state.phase,
      round: started.state.round,
    });

    expect(first).toEqual(second);
    expect(started.state).toEqual(before);
    expect(first.completedBranchingPairCount).toBe(rootBuckets.length);
    expect(first.branchingStatusCounts.completed).toBe(rootBuckets.length);
    expect(first.nextLegalMoveCounts.length).toBe(rootBuckets.length);
    expect(first.nextPublicActionCounts.length).toBe(rootBuckets.length);
  });

  it("counts sample-action-missing, conversion, engine rejection, engine exception, actor, legal-move, abstraction, and deferred paths", () => {
    const started = startedMatch();
    const legalMoves = getLegalMoves({
      state: started.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const rootBuckets = buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets(
      legalMoves,
      started.state.phase,
      started.state.round,
    );

    expect(
      executeDeterminizedPimcPostOnePlyBranchingBudgetV0Sample({
        sampledState: started.state,
        seatId: "seat_a",
        rootBuckets,
        sampledLegalMoves: [],
        phase: started.state.phase,
        round: started.state.round,
      }).sampleActionMissingPairCount,
    ).toBe(rootBuckets.length);
    expect(
      executeDeterminizedPimcPostOnePlyBranchingBudgetV0Sample({
        sampledState: started.state,
        seatId: "seat_a",
        rootBuckets,
        sampledLegalMoves: legalMoves,
        phase: started.state.phase,
        round: started.state.round,
        deps: { commandFromLegalMove: () => null },
      }).moveCommandConversionFailedPairCount,
    ).toBe(rootBuckets.length);
    expect(
      executeDeterminizedPimcPostOnePlyBranchingBudgetV0Sample({
        sampledState: started.state,
        seatId: "seat_a",
        rootBuckets,
        sampledLegalMoves: legalMoves,
        phase: started.state.phase,
        round: started.state.round,
        deps: { executeCommand: () => ({ status: "rejected" }) },
      }).engineCommandRejectedPairCount,
    ).toBe(rootBuckets.length);
    expect(
      executeDeterminizedPimcPostOnePlyBranchingBudgetV0Sample({
        sampledState: started.state,
        seatId: "seat_a",
        rootBuckets,
        sampledLegalMoves: legalMoves,
        phase: started.state.phase,
        round: started.state.round,
        deps: {
          executeCommand: () => {
            throw new Error("synthetic");
          },
        },
      }).engineCommandExceptionPairCount,
    ).toBe(rootBuckets.length);
    expect(
      countDeterminizedPimcPostOnePlyBranchingBudgetV0Surface({
        state: { ...started.state, phase: "setup" } as MatchState,
      }),
    ).toEqual({ status: "post_one_ply_actor_resolution_failed" });
    expect(
      countDeterminizedPimcPostOnePlyBranchingBudgetV0Surface({
        state: started.state,
        deps: {
          getLegalMoves: () => {
            throw new Error("synthetic");
          },
        },
      }),
    ).toEqual({ status: "post_one_ply_legal_move_generation_failed" });
    expect(
      countDeterminizedPimcPostOnePlyBranchingBudgetV0Surface({
        state: started.state,
        deps: {
          buildPublicActionBuckets: () => {
            throw new Error("synthetic");
          },
        },
      }),
    ).toEqual({ status: "post_one_ply_public_action_abstraction_failed" });

    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const deferred = buildDeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot({
      input: {
        suiteId: fixture.suiteId,
        matchupId: fixture.eligibleRoots[0].matchupId,
        seed: fixture.eligibleRoots[0].seed,
        step: fixture.eligibleRoots[0].step,
        decisionIndex: fixture.eligibleRoots[0].decisionIndex,
        seatId: "seat_a",
        policyId: fixture.eligibleRoots[0].policyId,
        state: started.state,
        legalMoves,
        seats: {
          seat_a: {
            faction: "northern_realms",
            deckPresetId: fixture.eligibleRoots[0].deckPresetId,
          },
          seat_b: {
            faction: "nilfgaard",
            deckPresetId: fixture.eligibleRoots[0].deckPresetId,
          },
        },
      },
      samplerRunId: fixture.contractSummary.sourceSamplerRunIds.materialization,
      memory: { trackedCards: {} },
      cFp68EligibleRoot: fixture.eligibleRoots[0],
      cFp69ProbeRoot: fixture.cFp69ProbeRoots[0],
      cFp70AvailabilityRoot: fixture.cFp70AvailabilityRoots[0],
      cFp71OutcomeRoot: fixture.cFp71OutcomeRoots[0],
    });
    expect(deferred.observedRoot.probeStatus).toBe("one_ply_execution_deferred");
    expect(deferred.observedRoot.onePlyExecutionDeferredPairCount).toBeGreaterThan(0);
  });

  it("maps every branching budget bucket boundary", () => {
    expect(budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count(0)).toBe("zero");
    expect(budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count(2)).toBe("tiny");
    expect(budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count(5)).toBe("small");
    expect(budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count(10)).toBe("medium");
    expect(budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count(16)).toBe("large");
    expect(budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count(32)).toBe("very_large");
    expect(budgetBucketForDeterminizedPimcPostOnePlyBranchingBudgetV0Count(33)).toBe("extreme");
  });
});
