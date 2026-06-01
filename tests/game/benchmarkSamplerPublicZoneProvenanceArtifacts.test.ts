import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildSamplerPublicZoneProvenanceSummary,
  samplerPublicZoneProvenanceArtifactHashes,
  scanSamplerPublicZoneProvenanceArtifactsForHiddenInfo,
  serializeSamplerPublicZoneProvenanceArtifacts,
  type SamplerMaterializationRootRecord,
  type SamplerPublicZoneProvenanceProfileResult,
  type SamplerPublicZoneProvenanceRecord,
} from "@/game/benchmark";
import type { BenchmarkRunResult } from "@/game/benchmark";

const artifactDir = (suiteId: string) =>
  resolve(
    process.cwd(),
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "sampler-public-zone-provenance/cFp64",
  );

const readArtifactText = (suiteId: string, file: string) =>
  readFileSync(resolve(artifactDir(suiteId), file), "utf8");

const readArtifactJson = <T>(suiteId: string, file: string): T =>
  JSON.parse(readArtifactText(suiteId, file)) as T;

const readArtifactRoots = (suiteId: string): SamplerPublicZoneProvenanceRecord[] =>
  readArtifactText(suiteId, "provenance-roots.jsonl")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SamplerPublicZoneProvenanceRecord);

const materializationRoot = (
  overrides: Partial<SamplerMaterializationRootRecord> = {},
): SamplerMaterializationRootRecord => ({
  schemaVersion: "sampler-materialization-root-v1",
  samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-public-zone-provenance:cFp64:test",
  suiteId: "benchmark-v1-starter-matrix-v1",
  matchupId: "starter-a-vs-b",
  seed: "seed-001",
  mirrorGroupId: "starter-a-vs-b:seed-001",
  mirrorIndex: 0,
  step: 1,
  decisionIndex: 0,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  priorId: "known_preset_decklist_prior",
  priorStatus: "prior_available",
  materializationStatus: "invalid",
  sampleCountRequested: 8,
  sampleCountGenerated: 0,
  sampleCountValid: 0,
  sampleCountInvalid: 0,
  invalidReasonCounts: { insufficient_prior_remaining: 1 },
  opponentHiddenPoolSizeBucket: "large",
  opponentHandCount: 3,
  opponentDeckCount: 22,
  duplicatePublicReferenceCount: 0,
  duplicateFixedKnownHandReferenceCount: 0,
  uniquePublicKnownCardCount: 3,
  uniqueFixedKnownHandCardCount: 0,
  mainDeckAttributablePublicCount: 3,
  sideDeckOnlyPublicCount: 1,
  offPriorPublicCount: 0,
  publicAdjustmentCount: 1,
  uncoveredPriorDeficitCount: 1,
  publicAdjustmentReasonCounts: { side_deck_only_public: 1 },
  publicTransferMemoryVisibleCardCount: 0,
  publicTransferKnownHiddenHandCount: 0,
  publicTransferKnownHiddenDeckCount: 0,
  publicTransferKnownHiddenMainDeckAttributableCount: 0,
  publicTransferKnownHiddenSideDeckOnlyCount: 0,
  publicTransferKnownHiddenOffPriorCount: 0,
  publicTransferAdjustmentCount: 0,
  publicTransferUncoveredDeficitCount: 1,
  publicTransferIncoherentCount: 0,
  publicTransferReasonCounts: {},
  priorRemainingCardCount: 24,
  availableHiddenPoolSizeBucket: "large",
  publicKnownCardCountBucket: "small",
  priorRemainingCardCountBucket: "large",
  handUniqueSourceCountMin: 0,
  handUniqueSourceCountMax: 0,
  handUniqueSourceCountAverage: 0,
  deckUniqueSourceCountMin: 0,
  deckUniqueSourceCountMax: 0,
  deckUniqueSourceCountAverage: 0,
  handDuplicatePressureBucketCounts: { none: 0, pair: 0, triple_plus: 0 },
  deckDuplicatePressureBucketCounts: { none: 0, pair: 0, triple_plus: 0 },
  handDeckOverlapBucketCounts: { none: 0, one: 0, two_to_three: 0, four_plus: 0 },
  rootPublicFingerprint: "root-a",
  ...overrides,
});

const provenanceRoot = (
  overrides: Partial<SamplerPublicZoneProvenanceRecord> = {},
): SamplerPublicZoneProvenanceRecord => ({
  schemaVersion: "sampler-public-zone-provenance-root-v1",
  samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-public-zone-provenance:cFp64:test",
  suiteId: "benchmark-v1-starter-matrix-v1",
  matchupId: "starter-a-vs-b",
  seed: "seed-001",
  mirrorGroupId: "starter-a-vs-b:seed-001",
  mirrorIndex: 0,
  step: 1,
  decisionIndex: 0,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  invalidReason: "insufficient_prior_remaining",
  materializationInvalidReasonCounts: { insufficient_prior_remaining: 1 },
  invalidRootClassification: "public_zone_count_deficit",
  priorDeficitCount: 1,
  priorDeficitBucket: "one",
  opponentHandCount: 3,
  opponentDeckCount: 22,
  opponentHiddenCount: 25,
  publicKnownCardCount: 3,
  fixedKnownHandCardCount: 0,
  requiredHiddenDrawCount: 25,
  priorRemainingCardCount: 24,
  mainDeckAttributablePublicCount: 3,
  sideDeckOnlyPublicCount: 1,
  offPriorPublicCount: 0,
  publicAdjustmentCount: 1,
  uncoveredPriorDeficitCount: 1,
  publicAdjustmentReasonCounts: { side_deck_only_public: 1 },
  publicTransferMemoryVisibleCardCount: 0,
  publicTransferKnownHiddenHandCount: 0,
  publicTransferKnownHiddenDeckCount: 0,
  publicTransferKnownHiddenMainDeckAttributableCount: 0,
  publicTransferKnownHiddenSideDeckOnlyCount: 0,
  publicTransferKnownHiddenOffPriorCount: 0,
  publicTransferAdjustmentCount: 0,
  publicTransferUncoveredDeficitCount: 1,
  publicTransferIncoherentCount: 0,
  publicTransferReasonCounts: {},
  duplicatePublicReferenceCount: 0,
  duplicateFixedKnownHandReferenceCount: 0,
  publicZoneFamilyCounts: {
    opponent_board_units: 3,
    opponent_row_horns: 0,
    opponent_discard: 0,
    opponent_removed_from_game: 0,
    opponent_weather: 0,
    acting_hand_known: 0,
    prompt_revealed_hand: 0,
    other_public_known: 0,
  },
  publicZoneReferenceCount: 3,
  publicZoneDiversityCount: 1,
  dominantPublicZone: "opponent_board_units",
  dominantPublicZoneCount: 3,
  dominantPublicZoneShareBucket: "all",
  publicZoneShape: "single_zone",
  provenanceLabel: "single_zone_board",
  rootPublicFingerprint: "root-a",
  ...overrides,
});

const benchmarkSummary = {
  schemaVersion: "benchmark-summary-v1",
  benchmarkRunId:
    "benchmark-v1-starter-matrix-v1:sampler-public-zone-provenance:cFp64:test",
  suiteId: "benchmark-v1-starter-matrix-v1",
  totalMatches: 1,
  statusCounts: {
    completed: 1,
    max_steps_exceeded: 0,
    policy_failed: 0,
    engine_error: 0,
  },
  completionRate: 1,
  maxStepRate: 0,
  errorCodeCounts: {},
  replayCheckedCount: 1,
  replayFailedCount: 0,
  policyIds: ["legal-heuristic-v1"],
  deckPresetIds: ["official-northern-realms-starter"],
  resultCountsByPolicy: {},
  resultCountsByDeck: {},
  matchupSummaries: [],
  averageSteps: 1,
  averageCommands: 1,
  averageLegalMoves: 11,
  promptCount: 0,
  leaderUseCount: 0,
} as BenchmarkRunResult["summary"];

const profileResult = (
  materializationRoots: SamplerMaterializationRootRecord[],
  provenanceRoots: SamplerPublicZoneProvenanceRecord[],
): SamplerPublicZoneProvenanceProfileResult => {
  const invalidRoots = provenanceRoots.map((root) => ({
    schemaVersion: "sampler-invalid-root-v1",
    samplerRunId: root.samplerRunId,
    suiteId: root.suiteId,
    matchupId: root.matchupId,
    seed: root.seed,
    mirrorGroupId: root.mirrorGroupId,
    mirrorIndex: root.mirrorIndex,
    step: root.step,
    decisionIndex: root.decisionIndex,
    phase: root.phase,
    round: root.round,
    seatId: root.seatId,
    policyId: root.policyId,
    faction: root.faction,
    deckPresetId: root.deckPresetId,
    priorStatus: "prior_available",
    materializationStatus: "invalid",
    invalidReason: "insufficient_prior_remaining",
    classification: "public_zone_count_deficit",
    opponentHandCount: root.opponentHandCount,
    opponentDeckCount: root.opponentDeckCount,
    opponentHiddenCount: root.opponentHiddenCount,
    priorMainDeckCardCount: 32,
    priorRemainingCardCount: root.priorRemainingCardCount,
    publicKnownCardCount: root.publicKnownCardCount,
    fixedKnownHandCardCount: root.fixedKnownHandCardCount,
    duplicatePublicReferenceCount: root.duplicatePublicReferenceCount,
    duplicateFixedKnownHandReferenceCount:
      root.duplicateFixedKnownHandReferenceCount,
    uniquePublicKnownCardCount: root.publicKnownCardCount,
    uniqueFixedKnownHandCardCount: root.fixedKnownHandCardCount,
    mainDeckAttributablePublicCount: root.mainDeckAttributablePublicCount,
    sideDeckOnlyPublicCount: root.sideDeckOnlyPublicCount,
    offPriorPublicCount: root.offPriorPublicCount,
    publicAdjustmentCount: root.publicAdjustmentCount,
    uncoveredPriorDeficitCount: root.uncoveredPriorDeficitCount,
    publicAdjustmentReasonCounts: root.publicAdjustmentReasonCounts,
    hiddenHandDrawCount: root.opponentHandCount,
    requiredHiddenDrawCount: root.requiredHiddenDrawCount,
    priorDeficitCount: root.priorDeficitCount,
    priorExcessCount: 0,
    publicKnownByZone: {
      opponentBoardUnitCount: root.publicZoneFamilyCounts.opponent_board_units,
      opponentRowHornCount: root.publicZoneFamilyCounts.opponent_row_horns,
      opponentDiscardCount: root.publicZoneFamilyCounts.opponent_discard,
      opponentRemovedFromGameCount:
        root.publicZoneFamilyCounts.opponent_removed_from_game,
      opponentWeatherCount: root.publicZoneFamilyCounts.opponent_weather,
      actingHandKnownOpponentOwnedCount:
        root.publicZoneFamilyCounts.acting_hand_known,
      promptRevealedOpponentHandCount:
        root.publicZoneFamilyCounts.prompt_revealed_hand,
      duplicatePublicReferenceCount: root.duplicatePublicReferenceCount,
      duplicateFixedKnownHandReferenceCount:
        root.duplicateFixedKnownHandReferenceCount,
      uniquePublicKnownCardCount: root.publicKnownCardCount,
      uniqueFixedKnownHandCardCount: root.fixedKnownHandCardCount,
      otherPublicKnownCount: root.publicZoneFamilyCounts.other_public_known,
    },
    promptRevealKnownHandCount:
      root.publicZoneFamilyCounts.prompt_revealed_hand,
    hasPendingPromptForActingSeat: false,
    publicKnownCountBucket: "small",
    fixedKnownHandCountBucket: "none",
    hiddenCountDeficitBucket: "one",
    rootPublicFingerprint: root.rootPublicFingerprint,
  }));

  return {
    samplerRunId:
      "benchmark-v1-starter-matrix-v1:sampler-public-zone-provenance:cFp64:test",
    suiteId: "benchmark-v1-starter-matrix-v1",
    sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
    benchmark: {
      suite: {
        suiteId: "benchmark-v1-starter-matrix-v1",
        label: "test",
        description: "test",
        seedCount: 1,
        matchupIds: ["starter-a-vs-b"],
      },
      records: [],
      summary: benchmarkSummary,
      diagnostics: [],
    },
    materializationRoots,
    invalidRoots,
    provenanceRoots,
    summary: buildSamplerPublicZoneProvenanceSummary({
      samplerRunId:
        "benchmark-v1-starter-matrix-v1:sampler-public-zone-provenance:cFp64:test",
      suiteId: "benchmark-v1-starter-matrix-v1",
      sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
      materializationRoots,
      invalidRoots,
      provenanceRoots,
      benchmarkSummary,
    }),
  };
};

describe("benchmark sampler public-zone provenance artifacts", () => {
  it("serializes deterministic artifacts with portable manifest paths and hashes", () => {
    const result = profileResult([materializationRoot()], [provenanceRoot()]);
    const first = serializeSamplerPublicZoneProvenanceArtifacts(result);
    const second = serializeSamplerPublicZoneProvenanceArtifacts(result);
    const manifest = JSON.parse(first.manifestJson);

    expect(second).toEqual(first);
    expect(manifest).toEqual(
      expect.objectContaining({
        schemaVersion: "sampler-public-zone-provenance-artifact-v1",
        relativeOutputPath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/sampler-public-zone-provenance/cFp64",
        totalRootCount: 1,
        invalidProvenanceRootCount: 1,
        rootSchemaVersion: "sampler-public-zone-provenance-root-v1",
        summarySchemaVersion: "sampler-public-zone-provenance-summary-v1",
      }),
    );
    expect(manifest.relativeOutputPath).not.toContain(process.cwd());
    expect(manifest.artifactHashes).toEqual(
      expect.objectContaining({
        "summary.json":
          samplerPublicZoneProvenanceArtifactHashes(first)["summary.json"],
        "provenance-roots.jsonl":
          samplerPublicZoneProvenanceArtifactHashes(first)[
            "provenance-roots.jsonl"
          ],
        "report.md":
          samplerPublicZoneProvenanceArtifactHashes(first)["report.md"],
      }),
    );
    expect(first.reportMarkdown).toContain(
      "Sampler Public-Zone Provenance Casebook",
    );
    expect(first.reportMarkdown).toContain("Recommendation For Next Phase");
    expect(first.reportMarkdown).toContain("Public Adjustment Diagnostics");
    expect(scanSamplerPublicZoneProvenanceArtifactsForHiddenInfo(first)).toEqual(
      [],
    );
  });

  it("rejects hidden-info payload keys, runtime ids, card names, and source maps", () => {
    const artifacts = serializeSamplerPublicZoneProvenanceArtifacts(
      profileResult([materializationRoot()], [provenanceRoot()]),
    );
    const unsafeArtifacts = {
      ...artifacts,
      provenanceRootsJsonl: `${artifacts.provenanceRootsJsonl}{"moveId":"x","sourceCardId":"seat_a:abc","sourceId":"hidden","cardId":"seat_b:def","actionRef":"raw","rawMove":true,"rawLabel":"bad","rawState":{},"events":[],"deckOrder":[1],"sampledHand":["a"],"sampledDeck":["b"],"handSourceCounts":{},"deckSourceCounts":{},"publicKnownSourceCounts":{},"fixedKnownHandSourceCounts":{},"remainingSourceCounts":{},"priorSourceCounts":{},"publicTransferKnownHiddenSourceCounts":{},"publicTransferTrackedCardIds":["seat_b:ghi"],"sampledSource":"x","materializedSource":"y","card":"neutral.geralt-of-rivia"}\n`,
      reportMarkdown: `${artifacts.reportMarkdown}\ncardsById finalState commandLog eventLog ownHand opponentHand unsafeDebugResults decisionTrace Geralt of Rivia Gaunter O'Dimm: Darkness northern-realms.philippa-eilhart`,
    };

    expect(
      scanSamplerPublicZoneProvenanceArtifactsForHiddenInfo(unsafeArtifacts),
    ).toEqual(
      expect.arrayContaining([
        "cardsById",
        "finalState",
        "commandLog",
        "eventLog",
        "events",
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
        "rawState",
        "deckOrder",
        "sampledHand",
        "sampledDeck",
        "handSourceCounts",
        "deckSourceCounts",
        "publicKnownSourceCounts",
        "fixedKnownHandSourceCounts",
        "remainingSourceCounts",
        "priorSourceCounts",
        "publicTransferKnownHiddenSourceCounts",
        "publicTransferTrackedCardIds",
        "sampledSource",
        "materializedSource",
        "runtime seat_a prefix",
        "runtime seat_b prefix",
        "Geralt of Rivia",
        "Gaunter O'Dimm: Darkness",
        "neutral source id",
        "northern-realms source id",
      ]),
    );
  });

  it("committed current and robust artifacts represent every public-zone deficit once", () => {
    const expectations = [
      {
        suiteId: "benchmark-v1-starter-matrix-v1",
        totalRoots: 4042,
        validRoots: 3979,
        invalidRoots: 63,
      },
      {
        suiteId: "benchmark-v1-starter-matrix-robust-v1",
        totalRoots: 32487,
        validRoots: 32147,
        invalidRoots: 340,
      },
    ];

    for (const expectation of expectations) {
      const summary = readArtifactJson<{
        totalRootCount: number;
        validRootCount: number;
        invalidRootCount: number;
        invalidProvenanceRootCount: number;
        materializationStatusCounts: Record<string, number>;
        invalidReasonCounts: Record<string, number>;
        invalidRootClassificationCounts: Record<string, number>;
        provenanceLabelCounts: Record<string, number>;
      }>(expectation.suiteId, "summary.json");
      const roots = readArtifactRoots(expectation.suiteId);
      const provenanceLabelTotal = Object.values(summary.provenanceLabelCounts).reduce(
        (sum, count) => sum + count,
        0,
      );

      expect(summary.totalRootCount).toBe(expectation.totalRoots);
      expect(summary.validRootCount).toBe(expectation.validRoots);
      expect(summary.invalidRootCount).toBe(expectation.invalidRoots);
      expect(summary.invalidProvenanceRootCount).toBe(expectation.invalidRoots);
      expect(summary.materializationStatusCounts).toEqual({
        invalid: expectation.invalidRoots,
        valid: expectation.validRoots,
      });
      expect(summary.invalidReasonCounts).toEqual({
        insufficient_prior_remaining: expectation.invalidRoots,
      });
      expect(summary.invalidRootClassificationCounts.public_zone_count_deficit).toBe(
        expectation.invalidRoots,
      );
      expect(provenanceLabelTotal).toBe(expectation.invalidRoots);
      expect(roots).toHaveLength(expectation.invalidRoots);
      expect(
        roots.every(
          (root) => root.invalidRootClassification === "public_zone_count_deficit",
        ),
      ).toBe(true);
      expect(new Set(roots.map((root) => root.rootPublicFingerprint)).size).toBe(
        roots.length,
      );
    }
  });

  it("committed artifacts pass scanner and manifest hashes match bytes", () => {
    for (const suiteId of [
      "benchmark-v1-starter-matrix-v1",
      "benchmark-v1-starter-matrix-robust-v1",
    ]) {
      const artifacts = {
        manifestJson: readArtifactText(suiteId, "manifest.json"),
        summaryJson: readArtifactText(suiteId, "summary.json"),
        provenanceRootsJsonl: readArtifactText(suiteId, "provenance-roots.jsonl"),
        reportMarkdown: readArtifactText(suiteId, "report.md"),
      };
      const manifest = JSON.parse(artifacts.manifestJson) as {
        relativeOutputPath: string;
        artifactHashes: Record<
          "summary.json" | "provenance-roots.jsonl" | "report.md",
          string
        >;
      };
      const combined = Object.values(artifacts).join("\n");

      expect(scanSamplerPublicZoneProvenanceArtifactsForHiddenInfo(artifacts)).toEqual(
        [],
      );
      expect(combined).not.toContain(process.cwd());
      expect(manifest.relativeOutputPath).not.toContain(process.cwd());
      expect(manifest.artifactHashes).toEqual({
        "summary.json":
          samplerPublicZoneProvenanceArtifactHashes(artifacts)["summary.json"],
        "provenance-roots.jsonl":
          samplerPublicZoneProvenanceArtifactHashes(artifacts)[
            "provenance-roots.jsonl"
          ],
        "report.md":
          samplerPublicZoneProvenanceArtifactHashes(artifacts)["report.md"],
      });
    }
  });
});
