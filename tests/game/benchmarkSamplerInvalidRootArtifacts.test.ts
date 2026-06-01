import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildSamplerInvalidRootSummary,
  samplerInvalidRootArtifactHashes,
  scanSamplerInvalidRootArtifactsForHiddenInfo,
  serializeSamplerInvalidRootArtifacts,
  type SamplerInvalidRootRecord,
  type SamplerInvalidRootsProfileResult,
  type SamplerMaterializationRootRecord,
} from "@/game/benchmark";
import type { BenchmarkRunResult } from "@/game/benchmark";

const artifactDir = (suiteId: string) =>
  resolve(
    process.cwd(),
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "sampler-invalid-roots/cFp62",
  );

const readArtifactText = (suiteId: string, file: string) =>
  readFileSync(resolve(artifactDir(suiteId), file), "utf8");

const readArtifactJson = <T>(suiteId: string, file: string): T =>
  JSON.parse(readArtifactText(suiteId, file)) as T;

const readArtifactRoots = (suiteId: string): SamplerInvalidRootRecord[] =>
  readArtifactText(suiteId, "invalid-roots.jsonl")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SamplerInvalidRootRecord);

const publicKnownByZone = {
  opponentBoardUnitCount: 2,
  opponentRowHornCount: 0,
  opponentDiscardCount: 1,
  opponentRemovedFromGameCount: 0,
  opponentWeatherCount: 0,
  actingHandKnownOpponentOwnedCount: 0,
  promptRevealedOpponentHandCount: 0,
  duplicatePublicReferenceCount: 1,
  duplicateFixedKnownHandReferenceCount: 0,
  uniquePublicKnownCardCount: 3,
  uniqueFixedKnownHandCardCount: 0,
  otherPublicKnownCount: 0,
};

const invalidRoot = (
  overrides: Partial<SamplerInvalidRootRecord> = {},
): SamplerInvalidRootRecord => ({
  schemaVersion: "sampler-invalid-root-v1",
  samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-invalid-roots:cFp62:test",
  suiteId: "benchmark-v1-starter-matrix-v1",
  matchupId: "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0",
  seed: "starter-matrix-001",
  mirrorGroupId:
    "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0:starter-matrix-001",
  mirrorIndex: 0,
  step: 1,
  decisionIndex: 0,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "monsters",
  deckPresetId: "official-monsters-starter",
  priorStatus: "prior_available",
  materializationStatus: "invalid",
  invalidReason: "insufficient_prior_remaining",
  classification: "public_zone_count_deficit",
  opponentHandCount: 3,
  opponentDeckCount: 22,
  opponentHiddenCount: 25,
  priorMainDeckCardCount: 25,
  priorRemainingCardCount: 22,
  publicKnownCardCount: 3,
  fixedKnownHandCardCount: 0,
  duplicatePublicReferenceCount: 1,
  duplicateFixedKnownHandReferenceCount: 0,
  uniquePublicKnownCardCount: 3,
  uniqueFixedKnownHandCardCount: 0,
  mainDeckAttributablePublicCount: 3,
  sideDeckOnlyPublicCount: 1,
  offPriorPublicCount: 0,
  publicAdjustmentCount: 1,
  uncoveredPriorDeficitCount: 3,
  publicAdjustmentReasonCounts: { side_deck_only_public: 1 },
  publicTransferMemoryVisibleCardCount: 0,
  publicTransferKnownHiddenHandCount: 0,
  publicTransferKnownHiddenDeckCount: 0,
  publicTransferKnownHiddenMainDeckAttributableCount: 0,
  publicTransferKnownHiddenSideDeckOnlyCount: 0,
  publicTransferKnownHiddenOffPriorCount: 0,
  publicTransferAdjustmentCount: 0,
  publicTransferUncoveredDeficitCount: 3,
  publicTransferIncoherentCount: 0,
  publicTransferReasonCounts: {},
  hiddenHandDrawCount: 3,
  requiredHiddenDrawCount: 25,
  priorDeficitCount: 3,
  priorExcessCount: 0,
  publicKnownByZone,
  promptRevealKnownHandCount: 0,
  hasPendingPromptForActingSeat: false,
  publicKnownCountBucket: "small",
  fixedKnownHandCountBucket: "none",
  hiddenCountDeficitBucket: "small",
  rootPublicFingerprint: "root-a",
  ...overrides,
});

const materializationRoot = (
  overrides: Partial<SamplerMaterializationRootRecord> = {},
): SamplerMaterializationRootRecord => ({
  schemaVersion: "sampler-materialization-root-v1",
  samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-invalid-roots:cFp62:test",
  suiteId: "benchmark-v1-starter-matrix-v1",
  matchupId: "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0",
  seed: "starter-matrix-001",
  mirrorGroupId:
    "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0:starter-matrix-001",
  mirrorIndex: 0,
  step: 1,
  decisionIndex: 0,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "monsters",
  deckPresetId: "official-monsters-starter",
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
  duplicatePublicReferenceCount: 1,
  duplicateFixedKnownHandReferenceCount: 0,
  uniquePublicKnownCardCount: 3,
  uniqueFixedKnownHandCardCount: 0,
  mainDeckAttributablePublicCount: 3,
  sideDeckOnlyPublicCount: 1,
  offPriorPublicCount: 0,
  publicAdjustmentCount: 1,
  uncoveredPriorDeficitCount: 3,
  publicAdjustmentReasonCounts: { side_deck_only_public: 1 },
  publicTransferMemoryVisibleCardCount: 0,
  publicTransferKnownHiddenHandCount: 0,
  publicTransferKnownHiddenDeckCount: 0,
  publicTransferKnownHiddenMainDeckAttributableCount: 0,
  publicTransferKnownHiddenSideDeckOnlyCount: 0,
  publicTransferKnownHiddenOffPriorCount: 0,
  publicTransferAdjustmentCount: 0,
  publicTransferUncoveredDeficitCount: 3,
  publicTransferIncoherentCount: 0,
  publicTransferReasonCounts: {},
  priorRemainingCardCount: 22,
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

const benchmarkSummary = {
  schemaVersion: "benchmark-summary-v1",
  benchmarkRunId: "benchmark-v1-starter-matrix-v1:sampler-invalid-roots:cFp62:test",
  suiteId: "benchmark-v1-starter-matrix-v1",
  totalMatches: 2,
  statusCounts: {
    completed: 2,
    max_steps_exceeded: 0,
    policy_failed: 0,
    engine_error: 0,
  },
  completionRate: 1,
  maxStepRate: 0,
  errorCodeCounts: {},
  replayCheckedCount: 2,
  replayFailedCount: 0,
  policyIds: ["legal-heuristic-v0", "legal-heuristic-v1"],
  deckPresetIds: ["official-monsters-starter", "official-nilfgaard-starter"],
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
  invalidRoots: SamplerInvalidRootRecord[],
): SamplerInvalidRootsProfileResult => ({
  samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-invalid-roots:cFp62:test",
  suiteId: "benchmark-v1-starter-matrix-v1",
  sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
  benchmark: {
    suite: {
      suiteId: "benchmark-v1-starter-matrix-v1",
      label: "test",
      description: "test",
      seedCount: 1,
      matchupIds: ["starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0"],
    },
    records: [],
    summary: benchmarkSummary,
    diagnostics: [],
  },
  materializationRoots,
  invalidRoots,
  summary: buildSamplerInvalidRootSummary({
    samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-invalid-roots:cFp62:test",
    suiteId: "benchmark-v1-starter-matrix-v1",
    sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
    materializationRoots,
    invalidRoots,
    benchmarkSummary,
  }),
});

describe("benchmark sampler invalid-root artifacts", () => {
  it("serializes deterministic invalid-root artifacts and embeds hashes", () => {
    const result = profileResult(
      [
        materializationRoot(),
        materializationRoot({
          rootPublicFingerprint: "root-b",
          step: 2,
          materializationStatus: "valid",
          sampleCountGenerated: 8,
          sampleCountValid: 8,
          invalidReasonCounts: {},
        }),
      ],
      [invalidRoot()],
    );
    const first = serializeSamplerInvalidRootArtifacts(result);
    const second = serializeSamplerInvalidRootArtifacts(result);
    const manifest = JSON.parse(first.manifestJson);

    expect(second).toEqual(first);
    expect(manifest).toEqual(
      expect.objectContaining({
        schemaVersion: "sampler-invalid-root-artifact-v1",
        totalRootCount: 2,
        invalidRootCount: 1,
        validRootCount: 1,
        rootSchemaVersion: "sampler-invalid-root-v1",
        summarySchemaVersion: "sampler-invalid-root-summary-v1",
      }),
    );
    expect(manifest.artifactHashes).toEqual(
      expect.objectContaining({
        "summary.json": samplerInvalidRootArtifactHashes(first)["summary.json"],
        "invalid-roots.jsonl":
          samplerInvalidRootArtifactHashes(first)["invalid-roots.jsonl"],
        "report.md": samplerInvalidRootArtifactHashes(first)["report.md"],
      }),
    );
    expect(first.reportMarkdown).toContain("Sampler Invalid-Root Casebook");
    expect(first.reportMarkdown).toContain("Recommendation For Next Phase");
    expect(first.reportMarkdown).toContain("Public Adjustment Diagnostics");
    expect(scanSamplerInvalidRootArtifactsForHiddenInfo(first)).toEqual([]);
  });

  it("rejects hidden-info payload keys, runtime ids, card names, and sampled maps", () => {
    const artifacts = serializeSamplerInvalidRootArtifacts(
      profileResult([materializationRoot()], [invalidRoot()]),
    );
    const unsafeArtifacts = {
      ...artifacts,
      invalidRootsJsonl: `${artifacts.invalidRootsJsonl}{"moveId":"x","sourceCardId":"seat_a:abc","sourceId":"hidden","cardId":"seat_b:def","actionRef":"raw","rawMove":true,"rawLabel":"bad","rawState":{},"events":[],"deckOrder":[1],"sampledHand":["a"],"sampledDeck":["b"],"handSourceCounts":{},"deckSourceCounts":{},"publicKnownSourceCounts":{},"fixedKnownHandSourceCounts":{},"remainingSourceCounts":{},"priorSourceCounts":{},"publicTransferKnownHiddenSourceCounts":{},"publicTransferTrackedCardIds":["seat_b:ghi"],"sampledSource":"x","materializedSource":"y","card":"neutral.geralt-of-rivia"}\n`,
      reportMarkdown: `${artifacts.reportMarkdown}\ncardsById finalState commandLog eventLog ownHand opponentHand unsafeDebugResults decisionTrace Geralt of Rivia Gaunter O'Dimm: Darkness northern-realms.philippa-eilhart monsters.crone-brewess scoiatael.iorveth skellige.cerys`,
    };

    expect(scanSamplerInvalidRootArtifactsForHiddenInfo(unsafeArtifacts)).toEqual(
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
        "monsters source id",
        "scoiatael source id",
        "skellige source id",
      ]),
    );
  });

  it("committed current and robust artifacts classify every invalid root exactly once", () => {
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
        materializationStatusCounts: Record<string, number>;
        invalidReasonCounts: Record<string, number>;
        classificationCounts: Record<string, number>;
      }>(expectation.suiteId, "summary.json");
      const roots = readArtifactRoots(expectation.suiteId);
      const classificationTotal = Object.values(summary.classificationCounts).reduce(
        (sum, count) => sum + count,
        0,
      );

      expect(summary.totalRootCount).toBe(expectation.totalRoots);
      expect(summary.validRootCount).toBe(expectation.validRoots);
      expect(summary.invalidRootCount).toBe(expectation.invalidRoots);
      expect(summary.materializationStatusCounts).toEqual({
        invalid: expectation.invalidRoots,
        valid: expectation.validRoots,
      });
      expect(summary.invalidReasonCounts).toEqual({
        insufficient_prior_remaining: expectation.invalidRoots,
      });
      expect(classificationTotal).toBe(expectation.invalidRoots);
      expect(roots).toHaveLength(expectation.invalidRoots);
      expect(roots.every((root) => root.materializationStatus === "invalid")).toBe(
        true,
      );
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
        invalidRootsJsonl: readArtifactText(suiteId, "invalid-roots.jsonl"),
        reportMarkdown: readArtifactText(suiteId, "report.md"),
      };
      const manifest = JSON.parse(artifacts.manifestJson) as {
        artifactHashes: Record<"summary.json" | "invalid-roots.jsonl" | "report.md", string>;
      };
      const combined = Object.values(artifacts).join("\n");

      expect(scanSamplerInvalidRootArtifactsForHiddenInfo(artifacts)).toEqual([]);
      expect(combined).not.toContain(process.cwd());
      expect(manifest.artifactHashes).toEqual({
        "summary.json": samplerInvalidRootArtifactHashes(artifacts)["summary.json"],
        "invalid-roots.jsonl":
          samplerInvalidRootArtifactHashes(artifacts)["invalid-roots.jsonl"],
        "report.md": samplerInvalidRootArtifactHashes(artifacts)["report.md"],
      });
    }
  });
});
