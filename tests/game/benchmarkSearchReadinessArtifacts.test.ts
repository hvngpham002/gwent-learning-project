import { describe, expect, it } from "vitest";

import {
  buildSearchReadinessSummary,
  scanSearchReadinessArtifactsForHiddenInfo,
  searchReadinessArtifactHashes,
  serializeSearchReadinessArtifacts,
  type SearchReadinessProfileResult,
  type SearchReadinessRootRecord,
} from "@/game/benchmark";
import type { BenchmarkRunResult } from "@/game/benchmark";

const root = (overrides: Partial<SearchReadinessRootRecord> = {}): SearchReadinessRootRecord => ({
  schemaVersion: "search-readiness-root-v1",
  profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
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
  legalMoveCount: 11,
  moveKindCounts: {
    choose_mulligan: 11,
    play_card: 0,
    use_leader: 0,
    choose_prompt_option: 0,
    pass: 0,
    resolve_round_end: 0,
  },
  targetKindCounts: {
    none: 11,
    board_row: 0,
    row_horn: 0,
    weather: 0,
    card: 0,
    deck_card_source: 0,
    card_instance_set: 0,
    deck_card_instance: 0,
  },
  targetSideCounts: {
    own: 0,
    opponent: 0,
    public: 0,
    none: 11,
  },
  playCardMoveCount: 0,
  playCardSourceCount: 0,
  playCardTargetExpansionCount: 0,
  promptOptionCount: 0,
  mulliganOptionCount: 11,
  rowTargetMoveCount: 0,
  hornTargetMoveCount: 0,
  weatherTargetMoveCount: 0,
  cardTargetMoveCount: 0,
  passLegal: false,
  leaderLegal: false,
  rootPublicFingerprint: "root-a",
  ...overrides,
});

const benchmarkSummary = {
  schemaVersion: "benchmark-summary-v1",
  benchmarkRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
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

const profileResult = (roots: SearchReadinessRootRecord[]): SearchReadinessProfileResult => ({
  profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
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
  summary: buildSearchReadinessSummary({
    profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
    suiteId: "benchmark-v1-starter-matrix-v1",
    roots,
    benchmarkSummary,
  }),
});

describe("benchmark search-readiness artifacts", () => {
  it("serializes deterministic artifacts and embeds deterministic hashes", () => {
    const roots = [
      root(),
      root({
        rootPublicFingerprint: "root-b",
        phase: "playing",
        step: 12,
        decisionIndex: 11,
        legalMoveCount: 18,
        moveKindCounts: {
          choose_mulligan: 0,
          play_card: 12,
          use_leader: 1,
          choose_prompt_option: 0,
          pass: 1,
          resolve_round_end: 0,
        },
        targetKindCounts: {
          none: 1,
          board_row: 8,
          row_horn: 2,
          weather: 1,
          card: 1,
          deck_card_source: 1,
          card_instance_set: 4,
          deck_card_instance: 0,
        },
        targetSideCounts: {
          own: 12,
          opponent: 4,
          public: 1,
          none: 1,
        },
        playCardMoveCount: 12,
        playCardSourceCount: 7,
        playCardTargetExpansionCount: 5,
        mulliganOptionCount: 0,
        rowTargetMoveCount: 8,
        hornTargetMoveCount: 2,
        weatherTargetMoveCount: 1,
        cardTargetMoveCount: 1,
        passLegal: true,
        leaderLegal: true,
      }),
    ];
    const first = serializeSearchReadinessArtifacts(profileResult(roots));
    const second = serializeSearchReadinessArtifacts(profileResult(roots));
    const manifest = JSON.parse(first.manifestJson);

    expect(second).toEqual(first);
    expect(manifest).toEqual(
      expect.objectContaining({
        schemaVersion: "search-readiness-artifact-v1",
        profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
        suiteId: "benchmark-v1-starter-matrix-v1",
        sourceBenchmarkSuiteId: "benchmark-v1-starter-matrix-v1",
        rootRecordCount: 2,
        rootSchemaVersion: "search-readiness-root-v1",
        summarySchemaVersion: "search-readiness-summary-v1",
      }),
    );
    expect(manifest.artifactHashes).toEqual(
      expect.objectContaining({
        "summary.json": searchReadinessArtifactHashes(first)["summary.json"],
        "roots.jsonl": searchReadinessArtifactHashes(first)["roots.jsonl"],
        "report.md": searchReadinessArtifactHashes(first)["report.md"],
      }),
    );
    expect(first.reportMarkdown).toContain("This artifact is profiler evidence");
    expect(scanSearchReadinessArtifactsForHiddenInfo(first)).toEqual([]);
  });

  it("summarizes phase, policy, faction, deck, and count statistics", () => {
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
        playCardMoveCount: 9,
        playCardSourceCount: 6,
        playCardTargetExpansionCount: 3,
        mulliganOptionCount: 0,
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
    expect(result.summary.rootCountsByPhase).toEqual({ mulligan: 1, playing: 1 });
    expect(result.summary.rootCountsByPolicy).toEqual({
      "legal-heuristic-v0": 1,
      "legal-heuristic-v1": 1,
    });
    expect(result.summary.legalMoveCountStats).toEqual(
      expect.objectContaining({ count: 2, min: 11, max: 17, average: 14 }),
    );
    expect(result.summary.maxLegalMoveRoot).toEqual(
      expect.objectContaining({
        rootPublicFingerprint: "root-b",
        legalMoveCount: 17,
      }),
    );
    expect(result.summary.maxTargetExpansionRoot).toEqual(
      expect.objectContaining({
        rootPublicFingerprint: "root-b",
        playCardTargetExpansionCount: 3,
      }),
    );
  });

  it("rejects hidden-info payload keys and runtime id shapes in profiler artifacts", () => {
    const artifacts = serializeSearchReadinessArtifacts(profileResult([root()]));
    const unsafeArtifacts = {
      ...artifacts,
      rootsJsonl: `${artifacts.rootsJsonl}{"moveId":"x","sourceCardId":"seat_a:abc","sourceId":"hidden","cardId":"seat_b:def","actionRef":"raw","rawMove":true}\n`,
      reportMarkdown: `${artifacts.reportMarkdown}\nunsafeDebugResults eventLog decisionTrace ownHand opponentHand cardsById finalState commandLog`,
    };

    expect(scanSearchReadinessArtifactsForHiddenInfo(unsafeArtifacts)).toEqual(
      expect.arrayContaining([
        "moveId",
        "sourceCardId",
        "sourceId",
        "cardId",
        "actionRef",
        "rawMove",
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
});
