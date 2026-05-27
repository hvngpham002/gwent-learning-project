import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildSamplerMaterializationSummary,
  samplerMaterializationArtifactHashes,
  scanSamplerMaterializationArtifactsForHiddenInfo,
  serializeSamplerMaterializationArtifacts,
  type SamplerMaterializationProfileResult,
  type SamplerMaterializationRootRecord,
} from "@/game/benchmark";
import type { BenchmarkRunResult } from "@/game/benchmark";

const artifactDir = (suiteId: string) =>
  resolve(
    process.cwd(),
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    "sampler-materialization/cFp61",
  );

const readArtifactText = (suiteId: string, file: string) =>
  readFileSync(resolve(artifactDir(suiteId), file), "utf8");

const readArtifactJson = <T>(suiteId: string, file: string): T =>
  JSON.parse(readArtifactText(suiteId, file)) as T;

const readArtifactRoots = (suiteId: string): SamplerMaterializationRootRecord[] =>
  readArtifactText(suiteId, "roots.jsonl")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as SamplerMaterializationRootRecord);

const root = (
  overrides: Partial<SamplerMaterializationRootRecord> = {},
): SamplerMaterializationRootRecord => ({
  schemaVersion: "sampler-materialization-root-v1",
  samplerRunId:
    "benchmark-v1-starter-matrix-v1:sampler-materialization:cFp61:test",
  suiteId: "benchmark-v1-starter-matrix-v1",
  matchupId: "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0",
  seed: "starter-matrix-001",
  mirrorGroupId:
    "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0:starter-matrix-001",
  mirrorIndex: 0,
  step: 1,
  decisionIndex: 0,
  phase: "mulligan",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "monsters",
  deckPresetId: "official-monsters-starter",
  priorId: "known_preset_decklist_prior",
  priorStatus: "prior_available",
  materializationStatus: "valid",
  sampleCountRequested: 8,
  sampleCountGenerated: 8,
  sampleCountValid: 8,
  sampleCountInvalid: 0,
  invalidReasonCounts: {},
  opponentHiddenPoolSizeBucket: "large",
  opponentHandCount: 10,
  opponentDeckCount: 12,
  availableHiddenPoolSizeBucket: "large",
  publicKnownCardCountBucket: "none",
  priorRemainingCardCountBucket: "large",
  handUniqueSourceCountMin: 8,
  handUniqueSourceCountMax: 10,
  handUniqueSourceCountAverage: 9.25,
  deckUniqueSourceCountMin: 10,
  deckUniqueSourceCountMax: 12,
  deckUniqueSourceCountAverage: 11.25,
  handDuplicatePressureBucketCounts: { none: 1, pair: 7, triple_plus: 0 },
  deckDuplicatePressureBucketCounts: { none: 0, pair: 8, triple_plus: 0 },
  handDeckOverlapBucketCounts: { none: 0, one: 1, two_to_three: 5, four_plus: 2 },
  rootPublicFingerprint: "root-a",
  ...overrides,
});

const benchmarkSummary = {
  schemaVersion: "benchmark-summary-v1",
  benchmarkRunId:
    "benchmark-v1-starter-matrix-v1:sampler-materialization:cFp61:test",
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
  roots: SamplerMaterializationRootRecord[],
): SamplerMaterializationProfileResult => ({
  samplerRunId:
    "benchmark-v1-starter-matrix-v1:sampler-materialization:cFp61:test",
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
  roots,
  summary: buildSamplerMaterializationSummary({
    samplerRunId:
      "benchmark-v1-starter-matrix-v1:sampler-materialization:cFp61:test",
    suiteId: "benchmark-v1-starter-matrix-v1",
    sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
    roots,
    benchmarkSummary,
  }),
});

describe("benchmark sampler materialization artifacts", () => {
  it("serializes deterministic aggregate-only artifacts and embeds hashes", () => {
    const roots = [root(), root({ rootPublicFingerprint: "root-b", step: 2 })];
    const first = serializeSamplerMaterializationArtifacts(profileResult(roots));
    const second = serializeSamplerMaterializationArtifacts(profileResult(roots));
    const manifest = JSON.parse(first.manifestJson);

    expect(second).toEqual(first);
    expect(manifest).toEqual(
      expect.objectContaining({
        schemaVersion: "sampler-materialization-artifact-v1",
        rootRecordCount: 2,
        rootSchemaVersion: "sampler-materialization-root-v1",
        summarySchemaVersion: "sampler-materialization-summary-v1",
      }),
    );
    expect(manifest.artifactHashes).toEqual(
      expect.objectContaining({
        "summary.json": samplerMaterializationArtifactHashes(first)["summary.json"],
        "roots.jsonl": samplerMaterializationArtifactHashes(first)["roots.jsonl"],
        "report.md": samplerMaterializationArtifactHashes(first)["report.md"],
      }),
    );
    expect(first.reportMarkdown).toContain("sampler-materialization infrastructure");
    expect(scanSamplerMaterializationArtifactsForHiddenInfo(first)).toEqual([]);
  });

  it("rejects unsafe injected keys, runtime ids, and source-like strings", () => {
    const artifacts = serializeSamplerMaterializationArtifacts(profileResult([root()]));
    const unsafeArtifacts = {
      ...artifacts,
      rootsJsonl: `${artifacts.rootsJsonl}{"moveId":"x","sourceCardId":"seat_a:abc","sourceId":"hidden","cardId":"seat_b:def","actionRef":"raw","rawMove":true,"rawLabel":"bad","deckOrder":[1],"sampledHand":["a"],"sampledDeck":["b"],"handSourceCounts":{},"deckSourceCounts":{},"sampledSource":"x","materializedSource":"y","card":"neutral.geralt-of-rivia"}\n`,
      reportMarkdown: `${artifacts.reportMarkdown}\ncardsById finalState commandLog eventLog ownHand opponentHand unsafeDebugResults decisionTrace northern-realms.philippa-eilhart monsters.crone-brewess scoiatael.iorveth skellige.cerys`,
    };

    expect(scanSamplerMaterializationArtifactsForHiddenInfo(unsafeArtifacts)).toEqual(
      expect.arrayContaining([
        "cardsById",
        "finalState",
        "commandLog",
        "eventLog",
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
        "deckOrder",
        "sampledHand",
        "sampledDeck",
        "handSourceCounts",
        "deckSourceCounts",
        "sampledSource",
        "materializedSource",
        "runtime seat_a prefix",
        "runtime seat_b prefix",
        "neutral source id",
        "northern-realms source id",
        "monsters source id",
        "scoiatael source id",
        "skellige source id",
      ]),
    );
  });

  it("committed current and robust artifacts have valid 8/8 samples and no deferred roots", () => {
    const expectations = [
      { suiteId: "benchmark-v1-starter-matrix-v1", roots: 4042 },
      { suiteId: "benchmark-v1-starter-matrix-robust-v1", roots: 32487 },
    ];

    for (const { suiteId, roots: expectedRootCount } of expectations) {
      const summary = readArtifactJson<{
        rootRecordCount: number;
        priorStatusCounts: Record<string, number>;
        materializationStatusCounts: Record<string, number>;
        invalidReasonCounts: Record<string, number>;
      }>(suiteId, "summary.json");
      const roots = readArtifactRoots(suiteId);

      expect(summary.rootRecordCount).toBe(expectedRootCount);
      expect(summary.priorStatusCounts).toEqual({
        prior_available: expectedRootCount,
      });
      expect(summary.materializationStatusCounts).toEqual({
        valid: expectedRootCount,
      });
      expect(summary.invalidReasonCounts).toEqual({});
      expect(roots).toHaveLength(expectedRootCount);
      expect(roots.some((entry) => entry.materializationStatus === "deferred")).toBe(false);
      expect(
        roots.every(
          (entry) =>
            entry.sampleCountRequested === 8 &&
            entry.sampleCountGenerated === 8 &&
            entry.sampleCountValid === 8 &&
            entry.sampleCountInvalid === 0,
        ),
      ).toBe(true);
    }
  });

  it("committed artifacts pass the hidden-info scanner and contain no sampled maps or hashes", () => {
    for (const suiteId of [
      "benchmark-v1-starter-matrix-v1",
      "benchmark-v1-starter-matrix-robust-v1",
    ]) {
      const artifacts = {
        manifestJson: readArtifactText(suiteId, "manifest.json"),
        summaryJson: readArtifactText(suiteId, "summary.json"),
        rootsJsonl: readArtifactText(suiteId, "roots.jsonl"),
        reportMarkdown: readArtifactText(suiteId, "report.md"),
      };
      const combined = Object.values(artifacts).join("\n");

      expect(scanSamplerMaterializationArtifactsForHiddenInfo(artifacts)).toEqual([]);
      expect(combined).not.toContain("handSourceCounts");
      expect(combined).not.toContain("deckSourceCounts");
      expect(combined).not.toContain("sampledHand");
      expect(combined).not.toContain("sampledDeck");
      expect(combined).not.toContain("sampleFingerprint");
    }
  });

  it("manifest hashes match committed artifact bytes", () => {
    for (const suiteId of [
      "benchmark-v1-starter-matrix-v1",
      "benchmark-v1-starter-matrix-robust-v1",
    ]) {
      const manifest = readArtifactJson<{
        artifactHashes: Record<"summary.json" | "roots.jsonl" | "report.md", string>;
      }>(suiteId, "manifest.json");
      const artifacts = {
        manifestJson: readArtifactText(suiteId, "manifest.json"),
        summaryJson: readArtifactText(suiteId, "summary.json"),
        rootsJsonl: readArtifactText(suiteId, "roots.jsonl"),
        reportMarkdown: readArtifactText(suiteId, "report.md"),
      };
      const hashes = samplerMaterializationArtifactHashes(artifacts);

      expect(manifest.artifactHashes).toEqual({
        "summary.json": hashes["summary.json"],
        "roots.jsonl": hashes["roots.jsonl"],
        "report.md": hashes["report.md"],
      });
    }
  });
});
