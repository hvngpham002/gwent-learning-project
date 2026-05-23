import { describe, expect, it } from "vitest";

import {
  buildSamplerReadinessSummary,
  scanSamplerReadinessArtifactsForHiddenInfo,
  samplerReadinessArtifactHashes,
  serializeSamplerReadinessArtifacts,
  type SamplerReadinessProfileResult,
  type SamplerReadinessRootRecord,
} from "@/game/benchmark";
import type { BenchmarkRunResult } from "@/game/benchmark";

const root = (overrides: Partial<SamplerReadinessRootRecord> = {}): SamplerReadinessRootRecord => ({
  schemaVersion: "sampler-readiness-root-v1",
  samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-readiness:cFp60:test",
  suiteId: "benchmark-v1-starter-matrix-v1",
  matchupId: "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0",
  seed: "starter-matrix-001",
  mirrorGroupId: "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0:starter-matrix-001",
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
  sampleCountRequested: 8,
  sampleCountGenerated: 8,
  sampleCountValid: 8,
  sampleCountInvalid: 0,
  rootValidationStatus: "deferred",
  invalidReasonCounts: {},
  opponentHiddenPoolSizeBucket: "large",
  opponentHandCount: 10,
  opponentDeckCount: 12,
  knownVisibleCardCountBucket: "medium",
  priorRemainingCardCountBucket: "medium",
  legalMoveCount: 11,
  publicActionCount: 5,
  publicActionCollisionCount: 6,
  largestPublicActionBucketSize: 4,
  publicActionKindCounts: { choose_mulligan: 11 },
  targetKindCounts: { none: 11 },
  targetSideCounts: { none: 11 },
  rootPublicFingerprint: "root-a",
  ...overrides,
});

const benchmarkSummary = {
  schemaVersion: "benchmark-summary-v1",
  benchmarkRunId: "benchmark-v1-starter-matrix-v1:sampler-readiness:cFp60:test",
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

const profileResult = (roots: SamplerReadinessRootRecord[]): SamplerReadinessProfileResult => ({
  samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-readiness:cFp60:test",
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
  summary: buildSamplerReadinessSummary({
    samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-readiness:cFp60:test",
    suiteId: "benchmark-v1-starter-matrix-v1",
    roots,
    benchmarkSummary,
  }),
});

describe("benchmark sampler readiness artifacts", () => {
  it("serializes deterministic artifacts and embeds deterministic hashes", () => {
    const roots = [
      root(),
      root({
        rootPublicFingerprint: "root-b",
        phase: "playing",
        step: 12,
        decisionIndex: 11,
        legalMoveCount: 18,
        publicActionCount: 10,
        publicActionCollisionCount: 8,
        largestPublicActionBucketSize: 6,
        publicActionKindCounts: {
          play_card: 12,
          pass: 1,
          use_leader: 1,
        },
        targetKindCounts: {
          none: 1,
          board_row: 8,
          row_horn: 2,
          weather: 1,
          card: 1,
          deck_card_source: 1,
          card_instance_set: 4,
        },
        targetSideCounts: {
          own: 12,
          opponent: 4,
          public: 1,
          none: 1,
        },
      }),
    ];
    const first = serializeSamplerReadinessArtifacts(profileResult(roots));
    const second = serializeSamplerReadinessArtifacts(profileResult(roots));
    const manifest = JSON.parse(first.manifestJson);

    expect(second).toEqual(first);
    expect(manifest).toEqual(
      expect.objectContaining({
        schemaVersion: "sampler-readiness-artifact-v1",
        samplerRunId: "benchmark-v1-starter-matrix-v1:sampler-readiness:cFp60:test",
        suiteId: "benchmark-v1-starter-matrix-v1",
        sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
        rootRecordCount: 2,
        rootSchemaVersion: "sampler-readiness-root-v1",
        summarySchemaVersion: "sampler-readiness-summary-v1",
      }),
    );
    expect(manifest.explicitNonSearchWarning).toBeTruthy();
    expect(manifest.explicitNonSearchWarning.length).toBeGreaterThan(20);
    expect(manifest.artifactHashes).toEqual(
      expect.objectContaining({
        "summary.json": samplerReadinessArtifactHashes(first)["summary.json"],
        "roots.jsonl": samplerReadinessArtifactHashes(first)["roots.jsonl"],
        "report.md": samplerReadinessArtifactHashes(first)["report.md"],
      }),
    );
    expect(first.reportMarkdown).toContain("sampler-readiness infrastructure");
    expect(first.reportMarkdown).toContain("No rollout, search");
    expect(scanSamplerReadinessArtifactsForHiddenInfo(first)).toEqual([]);
  });

  it("summarizes phase, policy, faction, deck, prior status, and validation status", () => {
    const result = profileResult([
      root(),
      root({
        rootPublicFingerprint: "root-b",
        phase: "playing",
        step: 10,
        decisionIndex: 9,
        policyId: "legal-heuristic-v0",
        faction: "nilfgaard",
        deckPresetId: "official-nilfgaard-starter",
        legalMoveCount: 17,
        publicActionCount: 9,
        publicActionCollisionCount: 8,
      }),
    ]);

    expect(result.summary).toEqual(
      expect.objectContaining({
        rootRecordCount: 2,
        matchCount: 2,
        policyIds: ["legal-heuristic-v0", "legal-heuristic-v1"],
        deckPresetIds: ["official-monsters-starter", "official-nilfgaard-starter"],
        factions: ["monsters", "nilfgaard"],
      }),
    );
    expect(result.summary.rootCountsByPhase).toEqual({
      mulligan: 1,
      playing: 1,
    });
    expect(result.summary.rootCountsByPolicy).toEqual({
      "legal-heuristic-v0": 1,
      "legal-heuristic-v1": 1,
    });
    expect(result.summary.priorStatusCounts).toEqual({
      prior_available: 2,
    });
    expect(result.summary.validationStatusCounts).toEqual({
      deferred: 2,
    });
    expect(result.summary.legalMoveCountStats).toEqual(
      expect.objectContaining({ count: 2, min: 11, max: 17, average: 14 }),
    );
    expect(result.summary.maxPublicActionRoot).toEqual(
      expect.objectContaining({
        rootPublicFingerprint: "root-b",
        publicActionCount: 9,
      }),
    );
    expect(result.summary.maxCollisionRoot).toEqual(
      expect.objectContaining({
        rootPublicFingerprint: "root-b",
        publicActionCollisionCount: 8,
      }),
    );
  });

  it("rejects hidden-info payload keys and runtime id shapes in sampler artifacts", () => {
    const artifacts = serializeSamplerReadinessArtifacts(profileResult([root()]));
    const unsafeArtifacts = {
      ...artifacts,
      rootsJsonl: `${artifacts.rootsJsonl}{"moveId":"x","sourceCardId":"seat_a:abc","sourceId":"hidden","cardId":"seat_b:def","actionRef":"raw","rawMove":true,"rawLabel":"bad","deckOrder":[1,2,3],"sampledHand":["a"],"sampledDeck":["b"]}\n`,
      reportMarkdown: `${artifacts.reportMarkdown}\ncardsById finalState commandLog eventLog ownHand opponentHand unsafeDebugResults decisionTrace`,
    };

    const issues = scanSamplerReadinessArtifactsForHiddenInfo(unsafeArtifacts);
    expect(issues).toEqual(
      expect.arrayContaining([
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
        "runtime seat_a prefix",
        "runtime seat_b prefix",
        "unsafeDebugResults",
        "eventLog",
        "decisionTrace",
        "ownHand",
        "opponentHand",
        "cardsById",
        "finalState",
        "commandLog",
      ]),
    );
  });

  it("artifact hashes are stable across repeated serialization", () => {
    const roots = [root()];
    const first = serializeSamplerReadinessArtifacts(profileResult(roots));
    const second = serializeSamplerReadinessArtifacts(profileResult(roots));

    const hashes1 = samplerReadinessArtifactHashes(first);
    const hashes2 = samplerReadinessArtifactHashes(second);

    for (const key of Object.keys(hashes1) as Array<keyof typeof hashes1>) {
      expect(hashes1[key]).toBe(hashes2[key]);
    }
  });

  it("does not include wall-clock timing in committed artifact content", () => {
    const artifacts = serializeSamplerReadinessArtifacts(profileResult([root()]));
    const allContent = [
      artifacts.manifestJson,
      artifacts.summaryJson,
      artifacts.rootsJsonl,
      artifacts.reportMarkdown,
    ].join("\n");

    expect(allContent).not.toContain("elapsed");
    expect(allContent).not.toContain("timestamp");
    expect(allContent).not.toContain("wallClock");
  });
});
