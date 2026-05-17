import { describe, expect, it } from "vitest";

import type { AiDecisionTrace } from "@/game/ai";
import type { SeatId } from "@/game/core";
import {
  buildBenchmarkFailureMiningReport,
  combinedBenchmarkFailureMiningArtifactText,
  scanBenchmarkFailureMiningArtifactsForHiddenInfo,
  serializeBenchmarkFailureMiningArtifacts,
  type BenchmarkMatchRecord,
} from "@/game/benchmark";
import type { HeadlessMatchSimulationResult, SimulationStepLog } from "@/game/sim";

const SUITE_ID = "benchmark-v1-starter-matrix-v1";
const RUN_ID = "benchmark-v1-starter-matrix-v1:test";

const hiddenInfoHazards = [
  "cardsById",
  "finalState",
  "commandLog",
  "unsafeDebugResults",
  "ownHand",
  "opponentHand",
  '"hand":',
  '"deck":',
  "seat_a:",
  "seat_b:",
];

const seats = {
  seat_a: {
    seatId: "seat_a",
    policyId: "legal-heuristic-v1",
    playerId: "benchmark-legal-heuristic-v1",
    faction: "northern_realms",
    deckPresetId: "official-northern-realms-starter",
  },
  seat_b: {
    seatId: "seat_b",
    policyId: "legal-heuristic-v0",
    playerId: "benchmark-legal-heuristic-v0",
    faction: "nilfgaard",
    deckPresetId: "official-nilfgaard-starter",
  },
} as const;

const buildRecord = (index: number): BenchmarkMatchRecord => ({
  schemaVersion: "benchmark-match-v1",
  benchmarkRunId: RUN_ID,
  suiteId: SUITE_ID,
  matchupId: "starter-northern-realms-heuristic-v1-vs-nilfgaard-heuristic-v0",
  seed: `synthetic-${index}`,
  mirrorGroupId: `synthetic-${index}`,
  mirrorIndex: index % 2 === 0 ? 0 : 1,
  seats,
  status: "completed",
  winner: "seat_b",
  resultBySeat: { seat_a: "loss", seat_b: "win" },
  roundWinsBySeat: { seat_a: 0, seat_b: 2 },
  roundDraws: 0,
  finalGems: { seat_a: 0, seat_b: 1 },
  stepCount: 42,
  commandCount: 40,
  eventCount: 80,
  averageLegalMoves: 6,
  passCount: 4,
  promptsResolved: 0,
  leaderUses: 0,
  replayStatus: "passed",
  stableFingerprint: `synthetic-fp-${index}`,
});

const roundOnePlayStep = (step: number): SimulationStepLog =>
  ({
    step,
    phase: "playing",
    round: 1,
    seatId: "seat_a",
    policyId: "legal-heuristic-v1",
    legalMoveCount: 5,
    chosenMoveId: `move-${step}`,
    chosenMoveKind: "play_card",
    commandType: "PlayCard",
    eventTypes: ["card_played"],
  }) as SimulationStepLog;

const passTrace = (decisionIndex: number): AiDecisionTrace =>
  ({
    policyId: "legal-heuristic-v1",
    seatId: "seat_a" as SeatId,
    decisionIndex,
    phase: "playing",
    round: 3,
    selected: { kind: "pass" },
    passAnalysis: {
      scoreDelta: -4,
      isVoluntarilySafe: false,
      hasSingleMoveCatchUp: true,
    },
    roundInvestmentAnalysis: {
      recommendation: "continue",
      stopLossRecommended: false,
      scoreDelta: -4,
    },
    handShapeAnalysis: {
      unitCardCount: 0,
      heroCardCount: 0,
      positiveUnitMoveCount: 0,
      specialOnlyHand: true,
      futureRoundHandQuality: "poor",
      bestUnitTempoBucket: "none",
    },
    weatherPlacementAnalysis: null,
    medicTimingAnalysis: null,
    reasonKind: "policy",
  }) as unknown as AiDecisionTrace;

const weatherTrace = (decisionIndex: number): AiDecisionTrace =>
  ({
    policyId: "legal-heuristic-v1",
    seatId: "seat_a" as SeatId,
    decisionIndex,
    phase: "playing",
    round: 2,
    selected: { kind: "play_card" },
    passAnalysis: null,
    roundInvestmentAnalysis: null,
    handShapeAnalysis: null,
    medicTimingAnalysis: null,
    weatherPlacementAnalysis: {
      selectedMoveIntoWeatheredRow: true,
      selectedMoveSide: "own",
      selectedMoveRow: "ranged",
      selectedPrintedStrengthBucket: "high",
      selectedEffectiveStrengthBucket: "low",
      candidateWeatheredOwnRowPlayCount: 2,
      candidateWeatheredOpponentRowPlayCount: 0,
    },
    reasonKind: "policy",
  }) as unknown as AiDecisionTrace;

const medicTrace = (decisionIndex: number): AiDecisionTrace =>
  ({
    policyId: "legal-heuristic-v1",
    seatId: "seat_a" as SeatId,
    decisionIndex,
    phase: "playing",
    round: 1,
    selected: { kind: "play_card" },
    passAnalysis: null,
    roundInvestmentAnalysis: null,
    handShapeAnalysis: null,
    weatherPlacementAnalysis: null,
    medicTimingAnalysis: {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 0,
      bestReviveStrengthBucket: "none",
      bestReviveValueBucket: "none",
      noTargetMedicRisk: true,
      selectedMoveIsMedic: true,
      selectedMedicWithNoTarget: true,
    },
    reasonKind: "policy",
  }) as unknown as AiDecisionTrace;

const buildDebugResult = (): HeadlessMatchSimulationResult =>
  ({
    seed: "synthetic-0",
    status: "completed",
    steps: Array.from({ length: 8 }, (_, index) => roundOnePlayStep(index + 1)),
    summary: {
      roundsResolved: 3,
    },
    decisionTraces: [passTrace(0), weatherTrace(1), medicTrace(2)],
  }) as unknown as HeadlessMatchSimulationResult;

const buildSyntheticMiningResult = () =>
  buildBenchmarkFailureMiningReport({
    suiteId: SUITE_ID,
    benchmarkRunId: RUN_ID,
    records: Array.from({ length: 8 }, (_, index) => buildRecord(index)),
    debugResults: [buildDebugResult()],
  });

describe("benchmark failure mining", () => {
  it("emits deterministic safe findings from synthetic records and in-memory traces", () => {
    const first = buildSyntheticMiningResult();
    const second = buildSyntheticMiningResult();

    expect(second).toEqual(first);
    expect(first.summary.schemaVersion).toBe("benchmark-failure-mining-v1");
    expect(first.summary.recordCount).toBe(8);
    expect(first.findings.map((finding) => finding.kind)).toEqual(
      expect.arrayContaining([
        "matchup_skew",
        "deck_skew",
        "round_one_overinvestment",
        "round_three_low_resource",
        "suspicious_pass",
        "weathered_row_play",
        "medic_timing_risk",
      ]),
    );
  });

  it("serializes byte-stable artifacts and one JSONL finding per line", () => {
    const first = serializeBenchmarkFailureMiningArtifacts(buildSyntheticMiningResult());
    const second = serializeBenchmarkFailureMiningArtifacts(buildSyntheticMiningResult());

    expect(second).toEqual(first);
    expect(JSON.parse(first.manifestJson)).toEqual(
      expect.objectContaining({
        schemaVersion: "benchmark-failure-mining-v1",
        suiteId: SUITE_ID,
        files: ["manifest.json", "summary.json", "findings.jsonl", "report.md"],
      }),
    );
    const lines = first.findingsJsonl.trim().split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(7);
    lines.forEach((line) => {
      expect(JSON.parse(line)).toEqual(
        expect.objectContaining({ schemaVersion: "benchmark-failure-mining-v1" }),
      );
    });
  });

  it("keeps serialized artifacts free of hidden-info hazards", () => {
    const artifacts = serializeBenchmarkFailureMiningArtifacts(buildSyntheticMiningResult());
    const combined = combinedBenchmarkFailureMiningArtifactText(artifacts);

    expect(scanBenchmarkFailureMiningArtifactsForHiddenInfo(artifacts)).toEqual([]);
    hiddenInfoHazards.forEach((hazard) => {
      expect(combined).not.toContain(hazard);
    });
  });

  it("rejects forbidden tokens during the artifact hidden-info scan", () => {
    const artifacts = serializeBenchmarkFailureMiningArtifacts(buildSyntheticMiningResult());

    expect(
      scanBenchmarkFailureMiningArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: '{"finalState":{"seat_a:test":"leak"},"commandLog":[]}',
      }),
    ).toEqual(
      expect.arrayContaining(["raw terminal state", "raw command log", "runtime seat instance id"]),
    );
  });

  it("defers trace-dependent signals when traces are unavailable", () => {
    const result = buildBenchmarkFailureMiningReport({
      suiteId: SUITE_ID,
      benchmarkRunId: RUN_ID,
      records: [buildRecord(0), buildRecord(1), buildRecord(2)],
    });

    expect(result.summary.deferredSignals.map((signal) => signal.kind)).toEqual(
      expect.arrayContaining([
        "leader_underuse",
        "round_three_low_resource",
        "suspicious_pass",
        "weathered_row_play",
        "medic_timing_risk",
      ]),
    );
  });
});
