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
  buildDeterminizedPimcOnePlyOutcomeSkeletonV0,
  buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey,
  classifyDeterminizedPimcOnePlyOutcomeSkeletonV0Transition,
  executeDeterminizedPimcOnePlyOutcomeSkeletonV0Sample,
  outcomeKindForDeterminizedPimcOnePlyOutcomeSkeletonV0LegalMoveKind,
  rebuildDeterminizedPimcActionAvailabilityV0SampledRootState,
  type DeterminizedPimcActionAvailabilityV0RootRecord,
  type DeterminizedPimcActionAvailabilityV0SkippedRootRecord,
  type DeterminizedPimcActionAvailabilityV0Summary,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedAggregateCounts,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0Summary,
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

interface OutcomeFixture {
  suiteId: string;
  contractSummary: DeterminizedProbeContractSummary;
  eligibleRoots: DeterminizedProbeContractEligibleRootRecord[];
  skippedRoots: DeterminizedProbeContractSkippedRootRecord[];
  cFp69ProbeRoots: DeterminizedPimcProbeV0RootRecord[];
  cFp69SkippedRoots: DeterminizedPimcProbeV0SkippedRootRecord[];
  cFp70Summary: DeterminizedPimcActionAvailabilityV0Summary;
  cFp70AvailabilityRoots: DeterminizedPimcActionAvailabilityV0RootRecord[];
  cFp70SkippedRoots: DeterminizedPimcActionAvailabilityV0SkippedRootRecord[];
  observedRoots: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot[];
  observedAggregateCounts: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedAggregateCounts;
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const emptyStatusCounts = () => ({
  completed: 0,
  engine_command_exception: 0,
  engine_command_rejected: 0,
  move_command_conversion_failed: 0,
  one_ply_execution_deferred: 0,
  outcome_classification_failed: 0,
  public_action_abstraction_failed: 0,
  sample_action_missing: 0,
  sampled_legal_move_generation_failed: 0,
  sampled_world_rebuild_failed: 0,
});

const emptyOutcomeKindCounts = () => ({
  card_play: 0,
  leader_use: 0,
  mulligan_selection: 0,
  pass: 0,
  prompt_resolution: 0,
  round_end_resolution: 0,
  unknown_public_transition: 0,
});

const emptyTransitionKindCounts = () => ({
  match_completed: 0,
  phase_changed_same_round: 0,
  round_advanced: 0,
  same_phase_same_round: 0,
  transition_unknown: 0,
});

const emptyNestedCounts = () => ({
  choose_mulligan: {},
  choose_prompt_option: {},
  pass: {},
  play_card: {},
  resolve_round_end: {},
  use_leader: {},
});

const observedFromEligibleRoot = (
  root: DeterminizedProbeContractEligibleRootRecord,
  cFp69Root: DeterminizedPimcProbeV0RootRecord,
  cFp70Root: DeterminizedPimcActionAvailabilityV0RootRecord,
): DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot => {
  const pairCount = cFp70Root.rootActionBucketCount * root.sampleCountValid;
  const statusCounts = emptyStatusCounts();
  statusCounts.completed = pairCount;
  const outcomeCounts = emptyOutcomeKindCounts();
  outcomeCounts.unknown_public_transition = pairCount;
  const transitionCounts = emptyTransitionKindCounts();
  transitionCounts.same_phase_same_round = pairCount;

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
    faction: root.faction as DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot["faction"],
    deckPresetId: root.deckPresetId,
    rootPublicFingerprint: root.rootPublicFingerprint,
    cfp68RootPublicFingerprint: root.rootPublicFingerprint,
    cfp69LegalMoveCount: cFp69Root.legalMoveCount,
    cfp69PublicActionCount: cFp69Root.publicActionCount,
    cfp70AvailabilityStatus: cFp70Root.probeStatus,
    cfp70RootActionBucketCount: cFp70Root.rootActionBucketCount,
    cfp70AllRootActionsAvailableInAllSamples:
      cFp70Root.allRootActionsAvailableInAllSamples,
    sampleCountRequested: root.sampleCountRequested,
    sampleCountGenerated: root.sampleCountGenerated,
    sampleCountChecked: root.sampleCountValid,
    sampleCountOutcomeFailed: 0,
    rootPublicActionCount: cFp70Root.rootActionBucketCount,
    publicActionSamplePairCount: pairCount,
    completedPairCount: pairCount,
    failedOrDeferredPairCount: 0,
    sampleActionMissingPairCount: 0,
    moveCommandConversionFailedPairCount: 0,
    engineCommandRejectedPairCount: 0,
    engineCommandExceptionPairCount: 0,
    outcomeClassificationFailedPairCount: 0,
    onePlyExecutionDeferredPairCount: 0,
    executionStatusCounts: statusCounts,
    publicOutcomeKindCounts: outcomeCounts,
    transitionKindCounts: transitionCounts,
    rootActionBucketsWithAnyFailure: 0,
    rootActionBucketsWithAnyDivergence: 0,
    outcomeDivergenceCount: 0,
    probeStatus: "completed",
  };
};

const loadFixture = (suiteId: string): OutcomeFixture => {
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
  const cFp69ByKey = new Map(
    cFp69ProbeRoots.map((root) => [
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      root,
    ]),
  );
  const cFp70ByKey = new Map(
    cFp70AvailabilityRoots.map((root) => [
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      root,
    ]),
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
    observedRoots: eligibleRoots.map((root) =>
      observedFromEligibleRoot(
        root,
        cFp69ByKey.get(
          buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
        )!,
        cFp70ByKey.get(
          buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
        )!,
      ),
    ),
    observedAggregateCounts: {
      executionStatusCountsByPublicActionKind: emptyNestedCounts(),
      outcomeKindCountsByPublicActionKind: emptyNestedCounts(),
    },
  };
};

const buildProbe = (fixture: OutcomeFixture) =>
  buildDeterminizedPimcOnePlyOutcomeSkeletonV0({
    probeRunId: `${fixture.suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71:test`,
    suiteId: fixture.suiteId,
    contractSummary: fixture.contractSummary,
    cFp68EligibleRoots: fixture.eligibleRoots,
    cFp68SkippedRoots: fixture.skippedRoots,
    cFp69ProbeRoots: fixture.cFp69ProbeRoots,
    cFp69SkippedRoots: fixture.cFp69SkippedRoots,
    cFp70AvailabilitySummary: fixture.cFp70Summary,
    cFp70AvailabilityRoots: fixture.cFp70AvailabilityRoots,
    cFp70SkippedRoots: fixture.cFp70SkippedRoots,
    observedRoots: fixture.observedRoots,
    observedAggregateCounts: fixture.observedAggregateCounts,
  });

const expectEveryCounterSumsToSkipped = (
  summary: DeterminizedPimcOnePlyOutcomeSkeletonV0Summary,
) => {
  for (const group of Object.values(summary.skipCounters)) {
    expect(Object.values(group).reduce((sum, count) => sum + count, 0)).toBe(
      summary.skippedRootCount,
    );
  }
};

const sourceCountsForCards = (state: MatchState, ids: readonly string[]) => {
  const counts: Record<string, number> = {};
  ids.forEach((id) => {
    const source = state.cardsById[id]?.sourceId;
    if (source) counts[source] = (counts[source] ?? 0) + 1;
  });
  return counts;
};

const startedMatch = () =>
  startMatch({
    seed: "cfp71-one-ply-helper-test",
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

describe("determinized PIMC one-ply outcome skeleton v0", () => {
  it("maps cFp68 eligible roots and cFp70 availability roots to cFp71 outcome roots while carrying skipped roots", () => {
    const result = buildProbe(loadFixture("benchmark-v1-starter-matrix-v1"));
    const outcomeKeys = new Set(
      result.outcomeRoots.map((root) =>
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      ),
    );
    const skippedKeys = new Set(
      result.skippedRoots.map((root) =>
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      ),
    );

    expect(result.summary.probeReadinessStatus).toBe("probe_ready");
    expect(result.outcomeRoots).toHaveLength(3979);
    expect(result.skippedRoots).toHaveLength(63);
    expect(result.outcomeRoots[0]).toEqual(
      expect.objectContaining({
        eligibilityStatus: "eligible_valid_root",
        probeMode: "one_ply_public_action_outcome_skeleton",
        probeStatus: "completed",
        sourceCfp70AvailabilityRunId:
          "benchmark-v1-starter-matrix-v1:determinized-pimc-action-availability-v0:cFp70",
      }),
    );
    for (const key of skippedKeys) {
      expect(outcomeKeys.has(key)).toBe(false);
    }
    expect(result.summary.sourceConsistency.skippedRootsIncorrectlyProbed).toBe(0);
  });

  it("matches current and robust outcome/skipped counts and sample budgets", () => {
    const current = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-v1"),
    ).summary;
    const robust = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-robust-v1"),
    ).summary;

    expect(current.totalCfp68RootCount).toBe(4042);
    expect(current.outcomeRootCount).toBe(3979);
    expect(current.skippedRootCount).toBe(63);
    expect(current.skippedRootPercentage).toBe(1.559);
    expect(current.sampleBudget).toEqual({
      outcomeRootCount: 3979,
      requestedSamplesPerRootDistribution: { "8": 3979 },
      totalRequestedSampleCount: 31832,
      totalGeneratedSampleCount: 31832,
      totalCheckedSampleCount: 31832,
      totalFailedSampleCount: 0,
    });

    expect(robust.totalCfp68RootCount).toBe(32487);
    expect(robust.outcomeRootCount).toBe(32147);
    expect(robust.skippedRootCount).toBe(340);
    expect(robust.skippedRootPercentage).toBe(1.047);
    expect(robust.sampleBudget).toEqual({
      outcomeRootCount: 32147,
      requestedSamplesPerRootDistribution: { "8": 32147 },
      totalRequestedSampleCount: 257176,
      totalGeneratedSampleCount: 257176,
      totalCheckedSampleCount: 257176,
      totalFailedSampleCount: 0,
    });
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

  it("detects missing observed roots, missing cFp70 availability roots, and duplicate source keys", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const missingObservedKey =
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(fixture.eligibleRoots[0]);
    const missingObserved = buildProbe({
      ...fixture,
      observedRoots: fixture.observedRoots.filter(
        (root) =>
          buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root) !==
          missingObservedKey,
      ),
    });
    expect(missingObserved.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(missingObserved.summary.sourceConsistency.eligibleRootsNotObserved).toBe(1);

    const missingCfp70 = buildProbe({
      ...fixture,
      cFp70AvailabilityRoots: fixture.cFp70AvailabilityRoots.slice(1),
    });
    expect(missingCfp70.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(
      missingCfp70.summary.sourceConsistency.cfp68Cfp70AvailabilityRootCountDelta,
    ).toBe(1);

    const duplicate = buildProbe({
      ...fixture,
      eligibleRoots: [fixture.eligibleRoots[0], ...fixture.eligibleRoots],
      cFp69ProbeRoots: [fixture.cFp69ProbeRoots[0], ...fixture.cFp69ProbeRoots],
      cFp70AvailabilityRoots: [
        fixture.cFp70AvailabilityRoots[0],
        ...fixture.cFp70AvailabilityRoots,
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
  });

  it("detects cFp70 availability disagreement and cFp69/cFp70 public-action count mismatch", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const disagreementRoot = clone(fixture.cFp70AvailabilityRoots[0]);
    disagreementRoot.availabilityDisagreementCount = 1;
    disagreementRoot.allRootActionsAvailableInAllSamples = false;
    const disagreement = buildProbe({
      ...fixture,
      cFp70AvailabilityRoots: [
        disagreementRoot,
        ...fixture.cFp70AvailabilityRoots.slice(1),
      ],
    });

    expect(disagreement.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(
      disagreement.summary.sourceConsistency.cfp70RootsWithAvailabilityDisagreement,
    ).toBe(1);

    const mismatchRoot = clone(fixture.cFp70AvailabilityRoots[0]);
    mismatchRoot.rootActionBucketCount += 1;
    const mismatch = buildProbe({
      ...fixture,
      cFp70AvailabilityRoots: [
        mismatchRoot,
        ...fixture.cFp70AvailabilityRoots.slice(1),
      ],
    });
    expect(mismatch.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(
      mismatch.summary.sourceConsistency.cfp69Cfp70PublicActionCountMismatchRoots,
    ).toBe(1);
  });

  it("rebuilds sampled root states without mutating the original state or non-opponent-hidden zones", () => {
    const started = startedMatch();
    const stateBefore = clone(started.state);
    const opponentHandCount = started.state.seats.seat_b.hand.length;
    const opponentDeckCount = started.state.seats.seat_b.deck.length;
    const replacementHandSource = currentCatalogCards[0].sourceId;
    const replacementDeckSource = currentCatalogCards[1].sourceId;
    const rebuilt = rebuildDeterminizedPimcActionAvailabilityV0SampledRootState({
      state: started.state,
      actingSeatId: "seat_a",
      sample: {
        sampleIndex: 0,
        handSourceCounts: { [replacementHandSource]: opponentHandCount },
        deckSourceCounts: { [replacementDeckSource]: opponentDeckCount },
      },
    });

    expect(rebuilt.status).toBe("completed");
    expect(started.state).toEqual(stateBefore);
    expect(rebuilt.state?.seats.seat_a.hand).toEqual(stateBefore.seats.seat_a.hand);
    expect(rebuilt.state?.seats.seat_a.deck).toEqual(stateBefore.seats.seat_a.deck);
    expect(sourceCountsForCards(rebuilt.state!, rebuilt.state!.seats.seat_b.hand)).toEqual({
      [replacementHandSource]: opponentHandCount,
    });
    expect(sourceCountsForCards(rebuilt.state!, rebuilt.state!.seats.seat_b.deck)).toEqual({
      [replacementDeckSource]: opponentDeckCount,
    });
  });

  it("selects representative sampled moves deterministically and executes only cloned sampled states", () => {
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
    const first = executeDeterminizedPimcOnePlyOutcomeSkeletonV0Sample({
      sampledState: started.state,
      seatId: "seat_a",
      rootBuckets,
      sampledLegalMoves: legalMoves,
      phase: started.state.phase,
      round: started.state.round,
    });
    const second = executeDeterminizedPimcOnePlyOutcomeSkeletonV0Sample({
      sampledState: started.state,
      seatId: "seat_a",
      rootBuckets,
      sampledLegalMoves: legalMoves,
      phase: started.state.phase,
      round: started.state.round,
    });

    expect(first).toEqual(second);
    expect(started.state).toEqual(before);
    expect(first.completedPairCount).toBe(rootBuckets.length);
    expect(first.executionStatusCounts.completed).toBe(rootBuckets.length);
  });

  it("counts conversion failure, rejection, exception, and sample-action-missing paths", () => {
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
      executeDeterminizedPimcOnePlyOutcomeSkeletonV0Sample({
        sampledState: started.state,
        seatId: "seat_a",
        rootBuckets,
        sampledLegalMoves: [],
        phase: started.state.phase,
        round: started.state.round,
      }).sampleActionMissingPairCount,
    ).toBe(rootBuckets.length);
    expect(
      executeDeterminizedPimcOnePlyOutcomeSkeletonV0Sample({
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
      executeDeterminizedPimcOnePlyOutcomeSkeletonV0Sample({
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
      executeDeterminizedPimcOnePlyOutcomeSkeletonV0Sample({
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
  });

  it("classifies public outcome kinds and transition shapes", () => {
    expect(
      outcomeKindForDeterminizedPimcOnePlyOutcomeSkeletonV0LegalMoveKind(
        "choose_mulligan",
      ),
    ).toBe("mulligan_selection");
    expect(
      outcomeKindForDeterminizedPimcOnePlyOutcomeSkeletonV0LegalMoveKind(
        "choose_prompt_option",
      ),
    ).toBe("prompt_resolution");
    expect(
      outcomeKindForDeterminizedPimcOnePlyOutcomeSkeletonV0LegalMoveKind("pass"),
    ).toBe("pass");
    expect(
      outcomeKindForDeterminizedPimcOnePlyOutcomeSkeletonV0LegalMoveKind(
        "play_card",
      ),
    ).toBe("card_play");
    expect(
      outcomeKindForDeterminizedPimcOnePlyOutcomeSkeletonV0LegalMoveKind(
        "use_leader",
      ),
    ).toBe("leader_use");
    expect(
      outcomeKindForDeterminizedPimcOnePlyOutcomeSkeletonV0LegalMoveKind(
        "resolve_round_end",
      ),
    ).toBe("round_end_resolution");

    const started = startedMatch().state;
    expect(
      classifyDeterminizedPimcOnePlyOutcomeSkeletonV0Transition({
        beforeState: started,
        afterState: { ...started },
      }),
    ).toBe("same_phase_same_round");
    expect(
      classifyDeterminizedPimcOnePlyOutcomeSkeletonV0Transition({
        beforeState: started,
        afterState: { ...started, phase: "playing" },
      }),
    ).toBe("phase_changed_same_round");
    expect(
      classifyDeterminizedPimcOnePlyOutcomeSkeletonV0Transition({
        beforeState: started,
        afterState: { ...started, round: started.round + 1 },
      }),
    ).toBe("round_advanced");
    expect(
      classifyDeterminizedPimcOnePlyOutcomeSkeletonV0Transition({
        beforeState: started,
        afterState: { ...started, phase: "game_end" },
      }),
    ).toBe("match_completed");
  });

  it("summarizes outcome divergence without failing the probe", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const observed = clone(fixture.observedRoots[0]);
    observed.outcomeDivergenceCount = 2;
    observed.rootActionBucketsWithAnyDivergence = 1;

    const result = buildProbe({
      ...fixture,
      observedRoots: [observed, ...fixture.observedRoots.slice(1)],
    });

    expect(result.summary.probeReadinessStatus).toBe("probe_ready");
    expect(result.summary.outcomeStatus.rootsWithAnyPublicOutcomeDivergence).toBe(1);
    expect(result.summary.outcomeStatus.divergenceBucketCounts.two_to_three).toBe(1);
    expect(result.summary.outcomeStatus.outcomeRiskBucketCounts.two_to_three).toBe(1);
  });
});
