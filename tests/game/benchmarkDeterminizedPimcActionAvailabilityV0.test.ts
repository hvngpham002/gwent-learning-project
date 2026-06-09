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
  buildDeterminizedPimcActionAvailabilityV0,
  buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets,
  buildDeterminizedPimcActionAvailabilityV0RootKey,
  rebuildDeterminizedPimcActionAvailabilityV0SampledRootState,
  type DeterminizedPimcActionAvailabilityV0ObservedRoot,
  type DeterminizedPimcActionAvailabilityV0Summary,
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

interface AvailabilityFixture {
  suiteId: string;
  contractSummary: DeterminizedProbeContractSummary;
  eligibleRoots: DeterminizedProbeContractEligibleRootRecord[];
  skippedRoots: DeterminizedProbeContractSkippedRootRecord[];
  cFp69ProbeRoots: DeterminizedPimcProbeV0RootRecord[];
  cFp69SkippedRoots: DeterminizedPimcProbeV0SkippedRootRecord[];
  observedRoots: DeterminizedPimcActionAvailabilityV0ObservedRoot[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const observedFromEligibleRoot = (
  root: DeterminizedProbeContractEligibleRootRecord,
  cFp69Root: DeterminizedPimcProbeV0RootRecord,
): DeterminizedPimcActionAvailabilityV0ObservedRoot => ({
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
  faction: root.faction as DeterminizedPimcActionAvailabilityV0ObservedRoot["faction"],
  deckPresetId: root.deckPresetId,
  rootPublicFingerprint: root.rootPublicFingerprint,
  cfp68RootPublicFingerprint: root.rootPublicFingerprint,
  cfp69LegalMoveCount: cFp69Root.legalMoveCount,
  cfp69PublicActionCount: cFp69Root.publicActionCount,
  sampleCountRequested: root.sampleCountRequested,
  sampleCountGenerated: root.sampleCountGenerated,
  sampleCountChecked: root.sampleCountValid,
  sampleCountAvailabilityFailed: 0,
  sampleAvailabilityStatusCounts: {
    all_root_actions_available: root.sampleCountValid,
    availability_disagreement: 0,
    public_action_abstraction_failed: 0,
    sampled_legal_move_generation_failed: 0,
    sampled_world_rebuild_failed: 0,
  },
  rootActionBucketCount: cFp69Root.publicActionCount,
  sampledActionBucketCounts: Array.from(
    { length: root.sampleCountValid },
    () => cFp69Root.publicActionCount,
  ),
  allRootActionsAvailableInAllSamples: true,
  rootActionBucketsMissingInAnySample: 0,
  sampleActionBucketsExtraInAnySample: 0,
  availabilityDisagreementCount: 0,
  missingActionKindCounts: {
    choose_mulligan: 0,
    choose_prompt_option: 0,
    pass: 0,
    play_card: 0,
    resolve_round_end: 0,
    use_leader: 0,
  },
  extraActionKindCounts: {
    choose_mulligan: 0,
    choose_prompt_option: 0,
    pass: 0,
    play_card: 0,
    resolve_round_end: 0,
    use_leader: 0,
  },
  missingTargetKindCounts: {
    board_row: 0,
    card: 0,
    card_instance_set: 0,
    deck_card_instance: 0,
    deck_card_source: 0,
    none: 0,
    row_horn: 0,
    weather: 0,
  },
  extraTargetKindCounts: {
    board_row: 0,
    card: 0,
    card_instance_set: 0,
    deck_card_instance: 0,
    deck_card_source: 0,
    none: 0,
    row_horn: 0,
    weather: 0,
  },
  missingTargetSideCounts: {
    none: 0,
    opponent: 0,
    own: 0,
    public: 0,
  },
  extraTargetSideCounts: {
    none: 0,
    opponent: 0,
    own: 0,
    public: 0,
  },
  probeStatus: "completed",
});

const loadFixture = (suiteId: string): AvailabilityFixture => {
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
  const cFp69ByKey = new Map(
    cFp69ProbeRoots.map((root) => [
      buildDeterminizedPimcActionAvailabilityV0RootKey(root),
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
    observedRoots: eligibleRoots.map((root) =>
      observedFromEligibleRoot(root, cFp69ByKey.get(
        buildDeterminizedPimcActionAvailabilityV0RootKey(root),
      )!),
    ),
  };
};

const buildProbe = (fixture: AvailabilityFixture) =>
  buildDeterminizedPimcActionAvailabilityV0({
    probeRunId: `${fixture.suiteId}:determinized-pimc-action-availability-v0:cFp70:test`,
    suiteId: fixture.suiteId,
    contractSummary: fixture.contractSummary,
    cFp68EligibleRoots: fixture.eligibleRoots,
    cFp68SkippedRoots: fixture.skippedRoots,
    cFp69ProbeRoots: fixture.cFp69ProbeRoots,
    cFp69SkippedRoots: fixture.cFp69SkippedRoots,
    observedRoots: fixture.observedRoots,
  });

const expectEveryCounterSumsToSkipped = (
  summary: DeterminizedPimcActionAvailabilityV0Summary,
) => {
  const counterGroups = Object.values(summary.skipCounters);
  for (const group of counterGroups) {
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

describe("determinized PIMC action availability v0", () => {
  it("maps cFp68 eligible roots to cFp70 availability roots and carries skipped roots separately", () => {
    const result = buildProbe(loadFixture("benchmark-v1-starter-matrix-v1"));
    const availabilityKeys = new Set(
      result.availabilityRoots.map((root) =>
        buildDeterminizedPimcActionAvailabilityV0RootKey(root),
      ),
    );
    const skippedKeys = new Set(
      result.skippedRoots.map((root) =>
        buildDeterminizedPimcActionAvailabilityV0RootKey(root),
      ),
    );

    expect(result.summary.probeReadinessStatus).toBe("probe_ready");
    expect(result.availabilityRoots).toHaveLength(3979);
    expect(result.skippedRoots).toHaveLength(63);
    expect(result.availabilityRoots[0]).toEqual(
      expect.objectContaining({
        eligibilityStatus: "eligible_valid_root",
        probeMode: "one_ply_sampled_world_action_availability",
        probeStatus: "completed",
        sampleCountRequested: 8,
        sampleCountGenerated: 8,
        sampleCountChecked: 8,
        sampleCountAvailabilityFailed: 0,
      }),
    );
    for (const key of skippedKeys) {
      expect(availabilityKeys.has(key)).toBe(false);
    }
    expect(result.summary.sourceConsistency.skippedRootsIncorrectlyProbed).toBe(0);
  });

  it("matches current and robust availability/skipped counts and sample budgets", () => {
    const current = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-v1"),
    ).summary;
    const robust = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-robust-v1"),
    ).summary;

    expect(current.totalCfp68RootCount).toBe(4042);
    expect(current.availabilityRootCount).toBe(3979);
    expect(current.skippedRootCount).toBe(63);
    expect(current.skippedRootPercentage).toBe(1.559);
    expect(current.sampleBudget).toEqual({
      availabilityRootCount: 3979,
      requestedSamplesPerRootDistribution: { "8": 3979 },
      totalRequestedSampleCount: 31832,
      totalGeneratedSampleCount: 31832,
      totalCheckedSampleCount: 31832,
      totalFailedSampleCount: 0,
    });

    expect(robust.totalCfp68RootCount).toBe(32487);
    expect(robust.availabilityRootCount).toBe(32147);
    expect(robust.skippedRootCount).toBe(340);
    expect(robust.skippedRootPercentage).toBe(1.047);
    expect(robust.sampleBudget).toEqual({
      availabilityRootCount: 32147,
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

  it("detects a missing cFp68 eligible root in the observed root stream", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const missingKey = buildDeterminizedPimcActionAvailabilityV0RootKey(
      fixture.eligibleRoots[0],
    );
    const result = buildProbe({
      ...fixture,
      observedRoots: fixture.observedRoots.filter(
        (root) =>
          buildDeterminizedPimcActionAvailabilityV0RootKey(root) !== missingKey,
      ),
    });

    expect(result.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(result.summary.sourceConsistency.eligibleRootsNotObserved).toBe(1);
    expect(
      result.summary.availabilityStatus.probeStatusCounts
        .eligible_root_not_observed,
    ).toBe(1);
  });

  it("detects cFp69 probe roots that no longer match the cFp68 eligible contract", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const removedKey = buildDeterminizedPimcActionAvailabilityV0RootKey(
      fixture.cFp69ProbeRoots[0],
    );
    const result = buildProbe({
      ...fixture,
      cFp69ProbeRoots: fixture.cFp69ProbeRoots.filter(
        (root) =>
          buildDeterminizedPimcActionAvailabilityV0RootKey(root) !== removedKey,
      ),
    });

    expect(result.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(result.summary.sourceConsistency.cfp68Cfp69EligibleRootCountDelta).toBe(1);
    expect(
      result.summary.availabilityStatus.probeStatusCounts.cfp69_contract_mismatch,
    ).toBeGreaterThan(0);
  });

  it("detects duplicate observed, eligible, and cFp69 probe keys", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const result = buildProbe({
      ...fixture,
      eligibleRoots: [fixture.eligibleRoots[0], ...fixture.eligibleRoots],
      cFp69ProbeRoots: [fixture.cFp69ProbeRoots[0], ...fixture.cFp69ProbeRoots],
      observedRoots: [fixture.observedRoots[0], ...fixture.observedRoots],
    });

    expect(result.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(result.summary.sourceConsistency.duplicateObservedRootKeys).toBe(1);
    expect(result.summary.sourceConsistency.duplicateCfp68EligibleRootKeys).toBe(1);
    expect(result.summary.sourceConsistency.duplicateCfp69ProbeRootKeys).toBe(1);
  });

  it("summarizes missing-root-action and extra-sampled-action findings without failing the probe", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const observed = clone(fixture.observedRoots[0]);
    observed.allRootActionsAvailableInAllSamples = false;
    observed.rootActionBucketsMissingInAnySample = 1;
    observed.sampleActionBucketsExtraInAnySample = 2;
    observed.availabilityDisagreementCount = 3;
    observed.missingActionKindCounts.play_card = 1;
    observed.extraActionKindCounts.use_leader = 2;
    observed.missingTargetKindCounts.board_row = 1;
    observed.extraTargetKindCounts.none = 2;
    observed.missingTargetSideCounts.own = 1;
    observed.extraTargetSideCounts.none = 2;
    observed.sampleAvailabilityStatusCounts = {
      ...observed.sampleAvailabilityStatusCounts,
      all_root_actions_available: 7,
      availability_disagreement: 1,
    };

    const result = buildProbe({
      ...fixture,
      observedRoots: [observed, ...fixture.observedRoots.slice(1)],
    });

    expect(result.summary.probeReadinessStatus).toBe("probe_ready");
    expect(result.summary.availabilityStatus.rootsWithAnyDisagreement).toBe(1);
    expect(result.summary.availabilityStatus.disagreementBucketCounts.two_to_three).toBe(1);
    expect(result.summary.availabilityStatus.availabilityRiskBucketCounts.medium).toBe(1);
    expect(
      result.summary.actionBucketAggregates.aggregateMissingByPublicActionKind
        .play_card,
    ).toBe(1);
    expect(
      result.summary.actionBucketAggregates.aggregateExtraByPublicActionKind
        .use_leader,
    ).toBe(2);
  });

  it("rebuilds sampled root states without mutating the original state or non-opponent-hidden zones", () => {
    const started = startMatch({
      seed: "cfp70-rebuild-test",
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
    expect(rebuilt.state?.weather).toEqual(stateBefore.weather);
    expect(sourceCountsForCards(rebuilt.state!, rebuilt.state!.seats.seat_b.hand)).toEqual({
      [replacementHandSource]: opponentHandCount,
    });
    expect(sourceCountsForCards(rebuilt.state!, rebuilt.state!.seats.seat_b.deck)).toEqual({
      [replacementDeckSource]: opponentDeckCount,
    });
  });

  it("builds public action bucket keys from legal moves without exposing raw legal move ids", () => {
    const started = startMatch({
      seed: "cfp70-public-action-test",
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
    const legalMoves = getLegalMoves({
      state: started.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const buckets = buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets(
      legalMoves,
      started.state.phase,
      started.state.round,
    );
    const serialized = JSON.stringify(buckets);

    expect(buckets.length).toBeGreaterThan(0);
    expect(serialized).not.toContain("moveId");
    expect(serialized).not.toContain("cardId");
    expect(serialized).not.toContain("sourceId");
  });
});
