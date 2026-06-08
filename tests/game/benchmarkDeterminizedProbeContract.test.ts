import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDeterminizedProbeContract,
  buildDeterminizedProbeContractRootKey,
  type DeterminizedProbeContractSummary,
  type SamplerMaterializationRootRecord,
  type SamplerMaterializationSummary,
  type SamplerPostCfp66InvalidRootCasebookRecord,
  type SamplerPostCfp66InvalidRootCasebookSummary,
} from "@/game/benchmark";

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

interface ContractFixture {
  suiteId: string;
  materializationSummary: SamplerMaterializationSummary;
  materializationRoots: SamplerMaterializationRootRecord[];
  casebookSummary: SamplerPostCfp66InvalidRootCasebookSummary;
  casebookInvalidRoots: SamplerPostCfp66InvalidRootCasebookRecord[];
}

const loadFixture = (suiteId: string): ContractFixture => ({
  suiteId,
  materializationSummary: readArtifactJson<SamplerMaterializationSummary>(
    suiteId,
    "sampler-materialization",
    "cFp61",
    "summary.json",
  ),
  materializationRoots: readArtifactJsonl<SamplerMaterializationRootRecord>(
    suiteId,
    "sampler-materialization",
    "cFp61",
    "roots.jsonl",
  ),
  casebookSummary:
    readArtifactJson<SamplerPostCfp66InvalidRootCasebookSummary>(
      suiteId,
      "sampler-post-cfp66-invalid-root-casebook",
      "cFp67",
      "summary.json",
    ),
  casebookInvalidRoots:
    readArtifactJsonl<SamplerPostCfp66InvalidRootCasebookRecord>(
      suiteId,
      "sampler-post-cfp66-invalid-root-casebook",
      "cFp67",
      "invalid-roots.jsonl",
    ),
});

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const buildContract = (fixture: ContractFixture) =>
  buildDeterminizedProbeContract({
    contractRunId: `${fixture.suiteId}:determinized-probe-contract:cFp68:test`,
    suiteId: fixture.suiteId,
    materializationSummary: fixture.materializationSummary,
    materializationRoots: fixture.materializationRoots,
    casebookSummary: fixture.casebookSummary,
    casebookInvalidRoots: fixture.casebookInvalidRoots,
  });

const expectEveryCounterSumsToSkipped = (
  summary: DeterminizedProbeContractSummary,
) => {
  const counterGroups = Object.values(summary.skipCounters);
  for (const group of counterGroups) {
    expect(Object.values(group).reduce((sum, count) => sum + count, 0)).toBe(
      summary.skippedRootCount,
    );
  }
};

describe("determinized probe contract", () => {
  it("maps valid cFp61 roots to eligible_valid_root records and invalid roots to skipped_invalid_root records", () => {
    const result = buildContract(loadFixture("benchmark-v1-starter-matrix-v1"));

    expect(result.summary.contractStatus).toBe("probe_ready");
    expect(result.eligibleRoots[0]).toEqual(
      expect.objectContaining({
        eligibilityStatus: "eligible_valid_root",
        sampleCountRequested: 8,
        sampleCountGenerated: 8,
        sampleCountValid: 8,
        sampleCountInvalid: 0,
      }),
    );
    expect(result.skippedRoots[0]).toEqual(
      expect.objectContaining({
        eligibilityStatus: "skipped_invalid_root",
        skipReason: "sampler_invalid_public_zone_count_deficit",
        invalidReason: "insufficient_prior_remaining",
        cFp67PrimaryClassification: "candidate_valid_root_only_skip",
      }),
    );
    expect(result.eligibleRoots).toHaveLength(3979);
    expect(result.skippedRoots).toHaveLength(63);
    expect(result.eligibleRoots.length + result.skippedRoots.length).toBe(
      result.summary.totalCfp61RootCount,
    );
  });

  it("matches current and robust eligible/skipped counts and skipped percentages", () => {
    const current = buildContract(
      loadFixture("benchmark-v1-starter-matrix-v1"),
    ).summary;
    const robust = buildContract(
      loadFixture("benchmark-v1-starter-matrix-robust-v1"),
    ).summary;

    expect(current.totalCfp61RootCount).toBe(4042);
    expect(current.eligibleRootCount).toBe(3979);
    expect(current.skippedRootCount).toBe(63);
    expect(current.skippedRootPercentage).toBe(1.559);

    expect(robust.totalCfp61RootCount).toBe(32487);
    expect(robust.eligibleRootCount).toBe(32147);
    expect(robust.skippedRootCount).toBe(340);
    expect(robust.skippedRootPercentage).toBe(1.047);
  });

  it("reports deterministic sample budget for eligible roots", () => {
    const current = buildContract(
      loadFixture("benchmark-v1-starter-matrix-v1"),
    ).summary;
    const robust = buildContract(
      loadFixture("benchmark-v1-starter-matrix-robust-v1"),
    ).summary;

    expect(current.deterministicProbeBudget).toEqual({
      eligibleRootCount: 3979,
      requestedSamplesPerEligibleRootDistribution: { "8": 3979 },
      totalRequestedSampleCountAcrossEligibleRoots: 31832,
      totalValidSampleCountAcrossEligibleRoots: 31832,
    });
    expect(robust.deterministicProbeBudget).toEqual({
      eligibleRootCount: 32147,
      requestedSamplesPerEligibleRootDistribution: { "8": 32147 },
      totalRequestedSampleCountAcrossEligibleRoots: 257176,
      totalValidSampleCountAcrossEligibleRoots: 257176,
    });
  });

  it("reports skip counters by every required dimension and sums them to skipped roots", () => {
    const current = buildContract(
      loadFixture("benchmark-v1-starter-matrix-v1"),
    ).summary;
    const robust = buildContract(
      loadFixture("benchmark-v1-starter-matrix-robust-v1"),
    ).summary;

    expectEveryCounterSumsToSkipped(current);
    expectEveryCounterSumsToSkipped(robust);
    expect(current.skipCounters.bySkipReason).toEqual({
      sampler_invalid_public_zone_count_deficit: 63,
    });
    expect(robust.skipCounters.bySkipReason).toEqual({
      sampler_invalid_public_zone_count_deficit: 340,
    });
    expect(current.skipCounters.byPhase).toEqual({ playing: 57, round_end: 6 });
    expect(robust.skipCounters.byPhase).toEqual({
      playing: 312,
      round_end: 28,
    });
    expect(current.skipCounters.byRound).toEqual({ "1": 28, "2": 28, "3": 7 });
    expect(robust.skipCounters.byRound).toEqual({
      "1": 222,
      "2": 96,
      "3": 22,
    });
  });

  it("detects a missing cFp67 casebook record for an invalid cFp61 root", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const removed = fixture.casebookInvalidRoots[0];
    const result = buildContract({
      ...fixture,
      casebookInvalidRoots: fixture.casebookInvalidRoots.slice(1),
    });

    expect(result.summary.contractStatus).toBe("not_probe_ready");
    expect(
      result.summary.sourceConsistency.invalidRootsMissingCfp67SkipRecords,
    ).toBe(1);
    const removedKey = buildDeterminizedProbeContractRootKey(removed);
    const skipped = result.skippedRoots.find(
      (root) => buildDeterminizedProbeContractRootKey(root) === removedKey,
    );
    expect(skipped?.skipReason).toBe("sampler_invalid_casebook_missing");
  });

  it("detects an extra cFp67 casebook record without a matching cFp61 invalid root", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const extra = clone(fixture.casebookInvalidRoots[0]);
    extra.step = 99999;
    extra.decisionIndex = 99998;
    extra.rootPublicFingerprint =
      "extra-contract-record-without-matching-cfp61-root";
    const result = buildContract({
      ...fixture,
      casebookInvalidRoots: [...fixture.casebookInvalidRoots, extra],
    });

    expect(result.summary.contractStatus).toBe("not_probe_ready");
    expect(
      result.summary.sourceConsistency
        .cFp67RecordsWithoutMatchingCfp61InvalidRoots,
    ).toBe(1);
  });

  it("detects duplicate cFp61 materialization root keys", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const result = buildContract({
      ...fixture,
      materializationRoots: [
        ...fixture.materializationRoots,
        clone(fixture.materializationRoots[0]),
      ],
    });

    expect(result.summary.contractStatus).toBe("not_probe_ready");
    expect(result.summary.sourceConsistency.duplicateRootKeys).toBe(1);
  });

  it("detects duplicate cFp67 casebook root keys", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const result = buildContract({
      ...fixture,
      casebookInvalidRoots: [
        ...fixture.casebookInvalidRoots,
        clone(fixture.casebookInvalidRoots[0]),
      ],
    });

    expect(result.summary.contractStatus).toBe("not_probe_ready");
    expect(result.summary.sourceConsistency.duplicateCfp67RootKeys).toBe(1);
  });

  it("detects internally invalid sample counts on an otherwise valid root", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const materializationRoots = clone(fixture.materializationRoots);
    const firstValidIndex = materializationRoots.findIndex(
      (root) => root.materializationStatus === "valid",
    );
    materializationRoots[firstValidIndex].sampleCountGenerated = 7;
    const result = buildContract({
      ...fixture,
      materializationRoots,
    });

    expect(result.summary.contractStatus).toBe("not_probe_ready");
    expect(
      result.summary.sourceConsistency.invalidEligibleSampleCountRootCount,
    ).toBe(1);
    expect(result.summary.sourceConsistency.unaccountedCfp61RootCount).toBe(1);
  });

  it("exposes a stable public root key for defensive contract checks", () => {
    const fixture = loadFixture("benchmark-v1-starter-matrix-v1");
    const root = fixture.materializationRoots[0];

    expect(buildDeterminizedProbeContractRootKey(root)).toBe(
      [
        root.suiteId,
        root.matchupId,
        String(root.seed),
        String(root.mirrorIndex),
        String(root.step),
        String(root.decisionIndex),
        root.phase,
        String(root.round),
        root.seatId,
        root.policyId,
        root.faction,
        root.deckPresetId,
      ].join("|"),
    );
  });
});
