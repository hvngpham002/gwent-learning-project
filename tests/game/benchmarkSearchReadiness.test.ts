import { describe, expect, it } from "vitest";

import {
  buildBenchmarkArtifactBundle,
  buildSearchReadinessRootRecord,
  hashSearchReadinessPublicValue,
  runBenchmarkSuite,
  runSearchReadinessProfile,
  type BenchmarkRootObserverInput,
} from "@/game/benchmark";
import type { LegalMove, MatchState } from "@/game/core";

const baseState = {
  phase: "playing",
  round: 1,
} as MatchState;

const baseRootInput = (legalMoves: readonly LegalMove[]): BenchmarkRootObserverInput => ({
  state: baseState,
  seatId: "seat_a",
  legalMoves,
  step: 7,
  decisionIndex: 6,
  policyId: "legal-heuristic-v1",
  suiteId: "benchmark-v1-starter-matrix-v1",
  matchupId: "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0",
  seed: "starter-matrix-001",
  mirrorGroupId: "starter-monsters-heuristic-v1-vs-nilfgaard-heuristic-v0:starter-matrix-001",
  mirrorIndex: 0,
  seats: {
    seat_a: {
      seatId: "seat_a",
      policyId: "legal-heuristic-v1",
      playerId: "benchmark-legal-heuristic-v1",
      faction: "monsters",
      deckPresetId: "official-monsters-starter",
    },
    seat_b: {
      seatId: "seat_b",
      policyId: "legal-heuristic-v0",
      playerId: "benchmark-legal-heuristic-v0",
      faction: "nilfgaard",
      deckPresetId: "official-nilfgaard-starter",
    },
  },
});

const playMove = (moveId: string, target: Extract<LegalMove, { kind: "play_card" }>["target"]): LegalMove => ({
  kind: "play_card",
  moveId,
  seatId: "seat_a",
  sourceCardId: "seat_a:private-source-card-1",
  sourceId: "hidden.catalog.source",
  target,
  label: "hidden card label",
  metadata: {
    cardName: "Hidden Card Name",
    cardKind: "unit",
    abilities: [],
    targetLabel: "hidden target label",
  },
});

const sampleLegalMoves = (): LegalMove[] => [
  {
    kind: "pass",
    moveId: "pass:seat_a",
    seatId: "seat_a",
    target: { kind: "none" },
    label: "Pass",
  },
  playMove("play:seat_a:private-source-card-1:close", {
    kind: "board_row",
    side: "own",
    seatId: "seat_a",
    row: "close",
  }),
  playMove("play:seat_a:private-source-card-1:ranged", {
    kind: "board_row",
    side: "own",
    seatId: "seat_a",
    row: "ranged",
  }),
  playMove("play:seat_a:private-source-card-1:target", {
    kind: "card_instance",
    side: "own",
    seatId: "seat_a",
    cardId: "seat_a:private-target-card-1",
    row: "close",
  }),
  {
    kind: "use_leader",
    moveId: "leader:seat_a:hidden",
    seatId: "seat_a",
    leaderCardId: "seat_a:hidden-leader",
    sourceId: "leader.hidden",
    target: { kind: "deck_card_source", seatId: "seat_a", sourceId: "weather.hidden" },
    label: "hidden leader label",
    metadata: {
      leaderName: "Hidden Leader",
      ability: "play_frost",
      abilityStatus: "implemented",
      targetRequirement: "deck_weather_source",
      targetSourceId: "weather.hidden",
      targetCardName: "Hidden Weather",
      targetLabel: "hidden weather",
    },
  },
  {
    kind: "choose_prompt_option",
    moveId: "prompt:hidden",
    seatId: "seat_a",
    promptId: "prompt:hidden",
    optionId: "option:hidden",
    target: {
      kind: "card_instance_set",
      side: "own",
      seatId: "seat_a",
      cardIds: ["seat_a:hidden-a", "seat_a:hidden-b"],
    },
    label: "hidden prompt label",
    metadata: {
      promptKind: "choose_card",
      abilityId: "discard_two_draw_one_from_deck",
      sourceCardId: "seat_a:hidden-prompt-source",
    },
  },
  {
    kind: "choose_mulligan",
    moveId: "mulligan:hidden",
    seatId: "seat_a",
    cardIds: ["seat_a:hidden-mulligan"],
    label: "hidden mulligan label",
    metadata: {
      cardCount: 1,
      maxCards: 1,
    },
  },
];

describe("benchmark search-readiness profiler", () => {
  it("builds public root metrics without serializing raw legal-move identifiers", () => {
    const root = buildSearchReadinessRootRecord({
      ...baseRootInput(sampleLegalMoves()),
      profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
    });

    expect(root).toEqual(
      expect.objectContaining({
        schemaVersion: "search-readiness-root-v1",
        profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
        legalMoveCount: 7,
        playCardMoveCount: 3,
        playCardSourceCount: 1,
        playCardTargetExpansionCount: 2,
        promptOptionCount: 1,
        mulliganOptionCount: 1,
        rowTargetMoveCount: 2,
        hornTargetMoveCount: 0,
        weatherTargetMoveCount: 0,
        cardTargetMoveCount: 1,
        passLegal: true,
        leaderLegal: true,
      }),
    );
    expect(root.moveKindCounts).toEqual(
      expect.objectContaining({
        choose_mulligan: 1,
        play_card: 3,
        use_leader: 1,
        choose_prompt_option: 1,
        pass: 1,
        resolve_round_end: 0,
      }),
    );
    expect(root.targetKindCounts).toEqual(
      expect.objectContaining({
        none: 2,
        board_row: 2,
        row_horn: 0,
        weather: 0,
        card: 1,
        deck_card_source: 1,
        card_instance_set: 1,
        deck_card_instance: 0,
      }),
    );
    expect(root.targetSideCounts).toEqual(
      expect.objectContaining({
        own: 5,
        opponent: 0,
        public: 0,
        none: 2,
      }),
    );

    const serialized = JSON.stringify(root);
    expect(serialized).not.toContain("private-source-card-1");
    expect(serialized).not.toContain("private-target-card-1");
    expect(serialized).not.toContain("Hidden Card Name");
    expect(serialized).not.toContain("hidden.catalog.source");
    expect(serialized).not.toContain("moveId");
    expect(serialized).not.toContain("sourceCardId");
  });

  it("deduplicates play-card source counts across multiple legal targets", () => {
    const root = buildSearchReadinessRootRecord({
      ...baseRootInput(sampleLegalMoves().filter((move) => move.kind === "play_card")),
      profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
    });

    expect(root.playCardMoveCount).toBe(3);
    expect(root.playCardSourceCount).toBe(1);
    expect(root.playCardTargetExpansionCount).toBe(2);
  });

  it("builds deterministic public fingerprints that react to public count changes", () => {
    const first = buildSearchReadinessRootRecord({
      ...baseRootInput(sampleLegalMoves()),
      profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
    });
    const second = buildSearchReadinessRootRecord({
      ...baseRootInput(sampleLegalMoves()),
      profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
    });
    const changed = buildSearchReadinessRootRecord({
      ...baseRootInput([
        ...sampleLegalMoves(),
        {
          kind: "resolve_round_end",
          moveId: "resolve-round-end:1",
          seatId: "seat_a",
          target: { kind: "none" },
          label: "Resolve round end",
        },
      ]),
      profileRunId: "benchmark-v1-starter-matrix-v1:search-readiness:test",
    });

    expect(second.rootPublicFingerprint).toBe(first.rootPublicFingerprint);
    expect(changed.rootPublicFingerprint).not.toBe(first.rootPublicFingerprint);
    expect(hashSearchReadinessPublicValue({ legalMoveCount: 1 })).toBe(
      hashSearchReadinessPublicValue({ legalMoveCount: 1 }),
    );
  });

  it("profiles benchmark roots only when the search-readiness path is explicitly used", () => {
    const profile = runSearchReadinessProfile({
      suiteId: "benchmark-smoke-v1",
      profileRunId: "benchmark-smoke-v1:search-readiness:test",
      maxSteps: 1,
    });
    const defaultBenchmark = runBenchmarkSuite({
      suiteId: "benchmark-smoke-v1",
      benchmarkRunId: "benchmark-smoke-v1:test",
      maxSteps: 1,
    });
    const defaultArtifacts = buildBenchmarkArtifactBundle(defaultBenchmark);

    expect(profile.roots.length).toBeGreaterThan(0);
    expect(profile.summary.rootRecordCount).toBe(profile.roots.length);
    expect(profile.summary.rootCountsByPhase.mulligan).toBe(profile.roots.length);
    expect("roots" in defaultBenchmark).toBe(false);
    expect(JSON.stringify(defaultArtifacts)).not.toContain("search-readiness-root-v1");
  });
});
