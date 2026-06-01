import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildPostCfp66InvalidRootCasebook,
  samplerPostCfp66InvalidRootCasebookArtifactHashes,
  scanSamplerPostCfp66InvalidRootCasebookArtifactsForHiddenInfo,
  serializeSamplerPostCfp66InvalidRootCasebookArtifacts,
  type SamplerInvalidRootRecord,
  type SamplerInvalidRootSummary,
  type SamplerMaterializationSummary,
  type SamplerPostCfp66InvalidRootCasebookResult,
  type SamplerPublicZoneProvenanceRecord,
  type SamplerPublicZoneProvenanceSummary,
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

const buildCasebook = (
  suiteId: string,
): SamplerPostCfp66InvalidRootCasebookResult =>
  buildPostCfp66InvalidRootCasebook({
    casebookRunId: `${suiteId}:sampler-post-cfp66-invalid-root-casebook:cFp67:test`,
    suiteId,
    materializationSummary: readArtifactJson<SamplerMaterializationSummary>(
      suiteId,
      "sampler-materialization",
      "cFp61",
      "summary.json",
    ),
    invalidRootSummary: readArtifactJson<SamplerInvalidRootSummary>(
      suiteId,
      "sampler-invalid-roots",
      "cFp62",
      "summary.json",
    ),
    invalidRoots: readArtifactJsonl<SamplerInvalidRootRecord>(
      suiteId,
      "sampler-invalid-roots",
      "cFp62",
      "invalid-roots.jsonl",
    ),
    provenanceSummary: readArtifactJson<SamplerPublicZoneProvenanceSummary>(
      suiteId,
      "sampler-public-zone-provenance",
      "cFp64",
      "summary.json",
    ),
    provenanceRoots: readArtifactJsonl<SamplerPublicZoneProvenanceRecord>(
      suiteId,
      "sampler-public-zone-provenance",
      "cFp64",
      "provenance-roots.jsonl",
    ),
  });

describe("post-cFp66 invalid-root casebook", () => {
  it("classifies every current invalid root exactly once and emits no valid roots", () => {
    const result = buildCasebook("benchmark-v1-starter-matrix-v1");

    expect(result.records).toHaveLength(63);
    expect(
      Object.values(result.summary.primaryClassificationCounts).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(result.summary.invalidRootCount);
    expect(result.summary.primaryClassificationCounts).toEqual({
      candidate_deeper_reconstruction: 0,
      candidate_valid_root_only_skip: 63,
      classification_unavailable: 0,
    });
    expect(result.summary.sourceConsistency.validRootRecordsInCasebook).toBe(0);
    expect(result.summary.sourceConsistency.missingProvenanceRootCount).toBe(0);
    expect(result.summary.sourceConsistency.extraProvenanceRootCount).toBe(0);
    expect(
      result.records.every(
        (record) => record.cFp62Classification === "public_zone_count_deficit",
      ),
    ).toBe(true);
  });

  it("matches post-cFp66 current and robust summary totals", () => {
    const current = buildCasebook("benchmark-v1-starter-matrix-v1").summary;
    const robust = buildCasebook("benchmark-v1-starter-matrix-robust-v1").summary;

    expect(current.totalRootCount).toBe(4042);
    expect(current.validRootCount).toBe(3979);
    expect(current.invalidRootCount).toBe(63);
    expect(current.invalidRootPercentage).toBe(1.559);

    expect(robust.totalRootCount).toBe(32487);
    expect(robust.validRootCount).toBe(32147);
    expect(robust.invalidRootCount).toBe(340);
    expect(robust.invalidRootPercentage).toBe(1.047);
  });

  it("counts deficit size, phase, round, and provenance label distributions", () => {
    const current = buildCasebook("benchmark-v1-starter-matrix-v1").summary;
    const robust = buildCasebook("benchmark-v1-starter-matrix-robust-v1").summary;

    expect(current.deficitSizeClassificationCounts).toEqual({
      classification_unavailable: 0,
      multi_card_deficit: 0,
      one_card_deficit: 63,
    });
    expect(robust.deficitSizeClassificationCounts).toEqual({
      classification_unavailable: 0,
      multi_card_deficit: 1,
      one_card_deficit: 339,
    });

    expect(current.invalidRootCountsByPhase).toEqual({
      playing: { count: 57, percentageOfInvalidRoots: 90.476 },
      round_end: { count: 6, percentageOfInvalidRoots: 9.524 },
    });
    expect(robust.invalidRootCountsByPhase).toEqual({
      playing: { count: 312, percentageOfInvalidRoots: 91.765 },
      round_end: { count: 28, percentageOfInvalidRoots: 8.235 },
    });

    expect(current.invalidRootCountsByRound).toEqual({
      "1": { count: 28, percentageOfInvalidRoots: 44.444 },
      "2": { count: 28, percentageOfInvalidRoots: 44.444 },
      "3": { count: 7, percentageOfInvalidRoots: 11.111 },
    });
    expect(robust.invalidRootCountsByRound).toEqual({
      "1": { count: 222, percentageOfInvalidRoots: 65.294 },
      "2": { count: 96, percentageOfInvalidRoots: 28.235 },
      "3": { count: 22, percentageOfInvalidRoots: 6.471 },
    });

    expect(current.invalidRootCountsByProvenanceLabel).toMatchObject({
      mixed_public_zones: { count: 42, percentageOfInvalidRoots: 66.667 },
      round_end_public_zone: { count: 6, percentageOfInvalidRoots: 9.524 },
      single_zone_board: { count: 6, percentageOfInvalidRoots: 9.524 },
      single_zone_discard: { count: 9, percentageOfInvalidRoots: 14.286 },
    });
    expect(robust.invalidRootCountsByProvenanceLabel).toMatchObject({
      mixed_public_zones: { count: 229, percentageOfInvalidRoots: 67.353 },
      round_end_public_zone: { count: 28, percentageOfInvalidRoots: 8.235 },
      single_zone_board: { count: 54, percentageOfInvalidRoots: 15.882 },
      single_zone_discard: { count: 29, percentageOfInvalidRoots: 8.529 },
    });
  });

  it("reports public-transfer buckets and valid-root-only skip counters", () => {
    const current = buildCasebook("benchmark-v1-starter-matrix-v1").summary;
    const robust = buildCasebook("benchmark-v1-starter-matrix-robust-v1").summary;

    expect(current.transferClassificationCounts).toEqual({
      hidden_deck_transfer_present: 0,
      hidden_hand_transfer_present: 0,
      no_known_hidden_transfer_at_invalid_root: 0,
      public_transfer_adjustment_present: 0,
      public_transfer_memory_not_applicable: 63,
    });
    expect(robust.transferClassificationCounts).toEqual({
      hidden_deck_transfer_present: 0,
      hidden_hand_transfer_present: 0,
      no_known_hidden_transfer_at_invalid_root: 0,
      public_transfer_adjustment_present: 0,
      public_transfer_memory_not_applicable: 340,
    });

    expect(current.publicTransferScalarBucketCounts).toEqual({
      hiddenDeckTransferPresent: 0,
      hiddenHandTransferPresent: 0,
      publicTransferAdjustmentPresent: 0,
      uncoveredDeficitPresent: 63,
      zeroKnownHiddenTransfer: 63,
    });
    expect(robust.publicTransferScalarBucketCounts).toEqual({
      hiddenDeckTransferPresent: 0,
      hiddenHandTransferPresent: 0,
      publicTransferAdjustmentPresent: 0,
      uncoveredDeficitPresent: 340,
      zeroKnownHiddenTransfer: 340,
    });

    expect(current.invalidRootPublicTransferTotals).toMatchObject({
      visiblePublicMemoryReferences: 589,
      knownHiddenHandCards: 0,
      knownHiddenDeckCards: 0,
      publicTransferAdjustments: 0,
      uncoveredDeficitCards: 63,
    });
    expect(robust.invalidRootPublicTransferTotals).toMatchObject({
      visiblePublicMemoryReferences: 2739,
      knownHiddenHandCards: 0,
      knownHiddenDeckCards: 0,
      publicTransferAdjustments: 0,
      uncoveredDeficitCards: 341,
    });

    expect(current.validRootOnlySkipRootCount).toBe(63);
    expect(robust.validRootOnlySkipRootCount).toBe(340);
    expect(
      Object.values(current.validRootOnlySkipCounterCounts.byProvenanceLabel).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(current.invalidRootCount);
    expect(
      Object.values(robust.validRootOnlySkipCounterCounts.byProvenanceLabel).reduce(
        (sum, count) => sum + count,
        0,
      ),
    ).toBe(robust.invalidRootCount);
  });

  it("serializes deterministically and scans artifacts for hidden-info hazards", () => {
    const result = buildCasebook("benchmark-v1-starter-matrix-robust-v1");
    const first = serializeSamplerPostCfp66InvalidRootCasebookArtifacts(result);
    const second = serializeSamplerPostCfp66InvalidRootCasebookArtifacts(result);

    expect(samplerPostCfp66InvalidRootCasebookArtifactHashes(first)).toEqual(
      samplerPostCfp66InvalidRootCasebookArtifactHashes(second),
    );
    expect(
      scanSamplerPostCfp66InvalidRootCasebookArtifactsForHiddenInfo(first),
    ).toEqual([]);
    expect(
      scanSamplerPostCfp66InvalidRootCasebookArtifactsForHiddenInfo({
        ...first,
        reportMarkdown: `${first.reportMarkdown}\nunsafeDebugResults\n`,
      }),
    ).toContain("unsafeDebugResults");
  });
});
