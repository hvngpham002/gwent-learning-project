import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcProbeV0,
  buildDeterminizedPimcProbeV0ObservedRoot,
  buildDeterminizedPimcProbeV0RootKey,
  type BenchmarkRootObserverInput,
  type DeterminizedPimcProbeV0ObservedRoot,
  type DeterminizedPimcProbeV0Summary,
  type DeterminizedProbeContractEligibleRootRecord,
  type DeterminizedProbeContractSkippedRootRecord,
  type DeterminizedProbeContractSummary,
} from "@/game/benchmark";
import type { LegalMove } from "@/game/core";

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

interface ProbeFixture {
  suiteId: string;
  contractSummary: DeterminizedProbeContractSummary;
  eligibleRoots: DeterminizedProbeContractEligibleRootRecord[];
  skippedRoots: DeterminizedProbeContractSkippedRootRecord[];
  observedRoots: DeterminizedPimcProbeV0ObservedRoot[];
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const loadFixture = (suiteId: string): ProbeFixture => {
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

  return {
    suiteId,
    contractSummary,
    eligibleRoots,
    skippedRoots,
    observedRoots: [...eligibleRoots, ...skippedRoots].map(observedFromRoot),
  };
};

const observedFromRoot = (
  root:
    | DeterminizedProbeContractEligibleRootRecord
    | DeterminizedProbeContractSkippedRootRecord,
): DeterminizedPimcProbeV0ObservedRoot => ({
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
  faction: root.faction as DeterminizedPimcProbeV0ObservedRoot["faction"],
  deckPresetId: root.deckPresetId,
  legalMoveCount: 1,
  publicActionCount: 1,
  publicActionCollisionCount: 0,
  largestPublicActionBucketSize: 1,
  publicActionKindCounts: {
    choose_mulligan: 0,
    choose_prompt_option: 0,
    pass: 1,
    play_card: 0,
    resolve_round_end: 0,
    use_leader: 0,
  },
  targetKindCounts: {
    board_row: 0,
    card: 0,
    card_instance_set: 0,
    deck_card_instance: 0,
    deck_card_source: 0,
    none: 1,
    row_horn: 0,
    weather: 0,
  },
  targetSideCounts: {
    none: 1,
    opponent: 0,
    own: 0,
    public: 0,
  },
  probeStatus: "completed",
});

const buildProbe = (fixture: ProbeFixture) =>
  buildDeterminizedPimcProbeV0({
    probeRunId: `${fixture.suiteId}:determinized-pimc-probe-v0:cFp69:test`,
    suiteId: fixture.suiteId,
    contractSummary: fixture.contractSummary,
    cFp68EligibleRoots: fixture.eligibleRoots,
    cFp68SkippedRoots: fixture.skippedRoots,
    observedRoots: fixture.observedRoots,
  });

const expectEveryCounterSumsToSkipped = (
  summary: DeterminizedPimcProbeV0Summary,
) => {
  const counterGroups = Object.values(summary.skipCounters);
  for (const group of counterGroups) {
    expect(Object.values(group).reduce((sum, count) => sum + count, 0)).toBe(
      summary.skippedRootCount,
    );
  }
};

describe("determinized PIMC probe v0", () => {
  it("maps cFp68 eligible roots to cFp69 probe roots and carries cFp68 skipped roots separately", () => {
    const result = buildProbe(loadFixture("benchmark-v1-starter-matrix-v1"));
    const probedKeys = new Set(
      result.probeRoots.map((root) => buildDeterminizedPimcProbeV0RootKey(root)),
    );
    const skippedKeys = new Set(
      result.skippedRoots.map((root) =>
        buildDeterminizedPimcProbeV0RootKey(root),
      ),
    );

    expect(result.summary.probeReadinessStatus).toBe("probe_ready");
    expect(result.probeRoots).toHaveLength(3979);
    expect(result.skippedRoots).toHaveLength(63);
    expect(result.probeRoots[0]).toEqual(
      expect.objectContaining({
        eligibilityStatus: "eligible_valid_root",
        probeMode: "one_ply_public_action_scaffold",
        probeStatus: "completed",
        sampleCountRequested: 8,
        sampleCountConsumed: 8,
        sampleCountValid: 8,
        sampleCountInvalid: 0,
      }),
    );
    for (const key of skippedKeys) {
      expect(probedKeys.has(key)).toBe(false);
    }
    expect(result.summary.sourceConsistency.skippedRootsIncorrectlyProbed).toBe(0);
  });

  it("matches current and robust probe/skipped counts and skipped percentages", () => {
    const current = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-v1"),
    ).summary;
    const robust = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-robust-v1"),
    ).summary;

    expect(current.totalCfp68RootCount).toBe(4042);
    expect(current.probeRootCount).toBe(3979);
    expect(current.skippedRootCount).toBe(63);
    expect(current.skippedRootPercentage).toBe(1.559);

    expect(robust.totalCfp68RootCount).toBe(32487);
    expect(robust.probeRootCount).toBe(32147);
    expect(robust.skippedRootCount).toBe(340);
    expect(robust.skippedRootPercentage).toBe(1.047);
  });

  it("matches current and robust sample budgets inherited from cFp68 eligible roots", () => {
    const current = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-v1"),
    ).summary;
    const robust = buildProbe(
      loadFixture("benchmark-v1-starter-matrix-robust-v1"),
    ).summary;

    expect(current.sampleBudget).toEqual({
      probeRootCount: 3979,
      requestedSamplesPerRootDistribution: { "8": 3979 },
      totalRequestedSampleCount: 31832,
      totalConsumedSampleCount: 31832,
      totalValidSampleCount: 31832,
      totalInvalidSampleCount: 0,
    });
    expect(robust.sampleBudget).toEqual({
      probeRootCount: 32147,
      requestedSamplesPerRootDistribution: { "8": 32147 },
      totalRequestedSampleCount: 257176,
      totalConsumedSampleCount: 257176,
      totalValidSampleCount: 257176,
      totalInvalidSampleCount: 0,
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
    expect(current.skipCounters.bySkipReason).toEqual({
      sampler_invalid_public_zone_count_deficit: 63,
    });
    expect(robust.skipCounters.bySkipReason).toEqual({
      sampler_invalid_public_zone_count_deficit: 340,
    });
  });

  it("detects a missing cFp68 eligible root in the observed root stream", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const missingKey = buildDeterminizedPimcProbeV0RootKey(fixture.eligibleRoots[0]);
    const result = buildProbe({
      ...fixture,
      observedRoots: fixture.observedRoots.filter(
        (root) => buildDeterminizedPimcProbeV0RootKey(root) !== missingKey,
      ),
    });

    expect(result.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(result.summary.sourceConsistency.eligibleRootsNotObserved).toBe(1);
    expect(result.summary.probeStatusCounts.eligible_root_not_observed).toBe(1);
  });

  it("detects an observed root absent from the cFp68 contract", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const extraObserved = clone(fixture.observedRoots[0]);
    extraObserved.step = 99999;
    extraObserved.decisionIndex = 99998;

    const result = buildProbe({
      ...fixture,
      observedRoots: [...fixture.observedRoots, extraObserved],
    });

    expect(result.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(result.summary.sourceConsistency.observedRootsNotInCfp68Contract).toBe(1);
  });

  it("detects a skipped root appearing in the probe-root key set", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const skippedAsEligible = {
      ...clone(fixture.skippedRoots[0]),
      ...clone(fixture.eligibleRoots[0]),
      eligibilityStatus: "skipped_invalid_root" as const,
      skipReason: fixture.skippedRoots[0].skipReason,
      invalidReason: fixture.skippedRoots[0].invalidReason,
      skipCounterDimensions: fixture.skippedRoots[0].skipCounterDimensions,
    };

    const result = buildProbe({
      ...fixture,
      skippedRoots: [...fixture.skippedRoots, skippedAsEligible],
    });

    expect(result.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(result.summary.sourceConsistency.skippedRootsIncorrectlyProbed).toBe(1);
  });

  it("detects duplicate observed, cFp68 eligible, and cFp68 skipped root keys", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const duplicateObserved = buildProbe({
      ...fixture,
      observedRoots: [...fixture.observedRoots, clone(fixture.observedRoots[0])],
    });
    const duplicateEligible = buildProbe({
      ...fixture,
      eligibleRoots: [...fixture.eligibleRoots, clone(fixture.eligibleRoots[0])],
    });
    const duplicateSkipped = buildProbe({
      ...fixture,
      skippedRoots: [...fixture.skippedRoots, clone(fixture.skippedRoots[0])],
    });

    expect(duplicateObserved.summary.sourceConsistency.duplicateObservedRootKeys).toBe(1);
    expect(duplicateEligible.summary.sourceConsistency.duplicateCfp68EligibleRootKeys).toBe(1);
    expect(duplicateSkipped.summary.sourceConsistency.duplicateCfp68SkippedRootKeys).toBe(1);
    expect(duplicateObserved.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(duplicateEligible.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(duplicateSkipped.summary.probeReadinessStatus).toBe("not_probe_ready");
  });

  it("rejects non-probe-ready cFp68 contract status and malformed eligible sample counts", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const notReady = buildProbe({
      ...fixture,
      contractSummary: {
        ...fixture.contractSummary,
        contractStatus: "not_probe_ready",
      },
    });
    const malformedEligibleRoots = clone(fixture.eligibleRoots);
    malformedEligibleRoots[0].sampleCountValid = 7;
    const malformed = buildProbe({
      ...fixture,
      eligibleRoots: malformedEligibleRoots,
    });

    expect(notReady.summary.sourceConsistency.cFp68ContractNotProbeReady).toBe(1);
    expect(notReady.summary.probeReadinessStatus).toBe("not_probe_ready");
    expect(
      malformed.summary.sourceConsistency.cFp68EligibleSampleCountMismatchRoots,
    ).toBe(1);
    expect(malformed.summary.probeStatusCounts.contract_mismatch).toBe(1);
  });

  it("builds public action scaffolding without serializing raw legal-move identities", () => {
    const privateMove: LegalMove = {
      kind: "play_card",
      label: "Play Hidden Card",
      moveId: "private-move-id",
      seatId: "seat_a",
      sourceCardId: "seat_a:private-source-card:001",
      sourceId: "private-source-id",
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      metadata: {
        abilities: [],
        cardKind: "unit",
        cardName: "Hidden Card Name",
        targetLabel: "close",
      },
    } as LegalMove;
    const observed = buildDeterminizedPimcProbeV0ObservedRoot({
      suiteId: "benchmark-v1-starter-matrix-v1",
      matchupId: "fixture-matchup",
      seed: "fixture-seed",
      mirrorIndex: 0,
      seats: {
        seat_a: {
          seatId: "seat_a",
          policyId: "legal-heuristic-v1",
          playerId: "a",
          faction: "northern_realms",
          deckPresetId: "official-northern-realms-starter",
        },
        seat_b: {
          seatId: "seat_b",
          policyId: "legal-heuristic-v0",
          playerId: "b",
          faction: "nilfgaard",
          deckPresetId: "official-nilfgaard-starter",
        },
      },
      state: { phase: "playing", round: 1 },
      seatId: "seat_a",
      legalMoves: [privateMove],
      step: 1,
      decisionIndex: 0,
      policyId: "legal-heuristic-v1",
    } as BenchmarkRootObserverInput);

    const serialized = JSON.stringify(observed);
    expect(observed.publicActionKindCounts.play_card).toBe(1);
    expect(observed.targetKindCounts.board_row).toBe(1);
    expect(serialized).not.toContain("private-move-id");
    expect(serialized).not.toContain("private-source-card");
    expect(serialized).not.toContain("private-source-id");
    expect(serialized).not.toContain("Hidden Card Name");
  });
});
