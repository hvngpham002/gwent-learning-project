import { describe, expect, it } from "vitest";

import type { AiDecisionTrace } from "@/game/ai";
import type { SeatId } from "@/game/core";
import {
  benchmarkFailureMiningArtifactFiles,
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

const publicState = ({
  scoreDelta = -4,
  opponentPassed = false,
}: {
  readonly scoreDelta?: number;
  readonly opponentPassed?: boolean;
} = {}) =>
  ({
    seatId: "seat_a",
    opponentSeatId: "seat_b",
    phase: "playing",
    round: 3,
    currentTurn: "seat_a",
    ownScore: Math.max(0, scoreDelta),
    opponentScore: Math.max(0, -scoreDelta),
    scoreDelta,
    ownGems: 1,
    opponentGems: 1,
    ownHandCount: 2,
    opponentHandCount: 2,
    ownDeckCount: 0,
    opponentDeckCount: 0,
    ownDiscardCount: 0,
    opponentDiscardCount: 0,
    ownPassed: false,
    opponentPassed,
    boardRows: [],
    weatherCardCount: 0,
  }) as AiDecisionTrace["publicState"];

const passTrace = (
  decisionIndex: number,
  overrides: {
    readonly scoreDelta?: number;
    readonly opponentPassed?: boolean;
    readonly isVoluntarilySafe?: boolean;
    readonly hasSingleMoveCatchUp?: boolean;
    readonly policyUpperBoundCanWinRound?: boolean;
    readonly recommendation?: string;
    readonly stopLossRecommended?: boolean;
  } = {},
): AiDecisionTrace => {
  const scoreDelta = overrides.scoreDelta ?? -4;
  const opponentPassed = overrides.opponentPassed ?? false;
  const recommendation = overrides.recommendation ?? "continue";
  const stopLossRecommended = overrides.stopLossRecommended ?? false;
  return {
    policyId: "legal-heuristic-v1",
    seatId: "seat_a" as SeatId,
    decisionIndex,
    phase: "playing",
    round: 3,
    publicState: publicState({ scoreDelta, opponentPassed }),
    selected: { kind: "pass" },
    passAnalysis: {
      scoreDelta,
      isVoluntarilySafe: overrides.isVoluntarilySafe ?? false,
      isOpponentPassed: opponentPassed,
      hasSingleMoveCatchUp: overrides.hasSingleMoveCatchUp ?? true,
      policyUpperBoundCanWinRound: overrides.policyUpperBoundCanWinRound ?? false,
    },
    roundInvestmentAnalysis: {
      recommendation,
      stopLossRecommended,
      scoreDelta,
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
  } as unknown as AiDecisionTrace;
};

const roundOneInvestmentAnalysis = (
  overrides: Partial<NonNullable<AiDecisionTrace["roundInvestmentAnalysis"]>> = {},
): NonNullable<AiDecisionTrace["roundInvestmentAnalysis"]> => ({
  ownBoardUnitCount: 5,
  ownBoardHeroCount: 1,
  ownBoardNonHeroUnitCount: 5,
  ownBoardHornCount: 0,
  ownBoardCardCount: 6,
  positiveFutureUnitMoveCount: 2,
  positiveFutureNonUnitMoveCount: 0,
  futureRoundHandQuality: "thin",
  currentRoundHandCount: 5,
  estimatedHandCountAfterSelectedMove: 4,
  selectedMoveSpendsHandCard: true,
  selectedMoveIsCardAdvantage: false,
  selectedMoveWouldLeaveNoPositiveUnitMove: false,
  selectedMoveWouldLeaveNoUnitTempoCard: false,
  nonEliminationRound: true,
  scoreDelta: -2,
  risk: "watch",
  recommendation: "continue",
  catchUpStatus: "upper_bound_possible",
  stopLossRecommended: false,
  stopLossReason: "none",
  roundResourceBudget: 6,
  roundResourcePressure: "watch",
  resourceExhaustionRecommended: false,
  resourceExhaustionReason: "none",
  roundOneBoardAfterSelectedMove: 7,
  roundOneOverinvestmentRecommended: false,
  roundOneOverinvestmentReason: "none",
  ...overrides,
});

const roundOneTrace = (
  decisionIndex: number,
  selectedKind: "play_card" | "pass",
  analysisOverrides: Partial<NonNullable<AiDecisionTrace["roundInvestmentAnalysis"]>> = {},
): AiDecisionTrace => {
  const analysis = roundOneInvestmentAnalysis(analysisOverrides);
  return {
    policyId: "legal-heuristic-v1",
    seatId: "seat_a" as SeatId,
    decisionIndex,
    phase: "playing",
    round: 1,
    publicState: {
      ...publicState({ scoreDelta: analysis.scoreDelta }),
      round: 1,
      ownHandCount: analysis.currentRoundHandCount,
    },
    selected: { kind: selectedKind },
    passAnalysis: selectedKind === "pass" ? { scoreDelta: analysis.scoreDelta } : null,
    mulliganAnalysis: null,
    roundInvestmentAnalysis: analysis,
    handShapeAnalysis: null,
    weatherPlacementAnalysis: null,
    medicTimingAnalysis: null,
    scoiataelFirstTurnAnalysis: null,
    candidates: [],
    reasonKind: "policy-round-investment",
    reason: "synthetic round-one trace",
  } as unknown as AiDecisionTrace;
};

const weatherTrace = (decisionIndex: number): AiDecisionTrace =>
  ({
    policyId: "legal-heuristic-v1",
    seatId: "seat_a" as SeatId,
    decisionIndex,
    phase: "playing",
    round: 2,
    selected: { kind: "play_card" },
    publicState: publicState(),
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
    publicState: publicState(),
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

const buildDebugResultWithTraces = (decisionTraces: readonly AiDecisionTrace[]): HeadlessMatchSimulationResult =>
  ({
    seed: "synthetic-0",
    status: "completed",
    steps: [],
    summary: {
      roundsResolved: 3,
    },
    decisionTraces,
  }) as unknown as HeadlessMatchSimulationResult;

const buildRoundOneDebugResult = (decisionTraces: readonly AiDecisionTrace[]): HeadlessMatchSimulationResult =>
  ({
    seed: "synthetic-0",
    status: "completed",
    steps: Array.from({ length: 8 }, (_, index) => roundOnePlayStep(index + 1)),
    summary: {
      roundsResolved: 3,
    },
    decisionTraces,
  }) as unknown as HeadlessMatchSimulationResult;

const buildSyntheticMiningResult = () =>
  buildBenchmarkFailureMiningReport({
    suiteId: SUITE_ID,
    benchmarkRunId: RUN_ID,
    records: Array.from({ length: 8 }, (_, index) => buildRecord(index)),
    debugResults: [buildDebugResult()],
  });

const buildPassMiningResult = (decisionTraces: readonly AiDecisionTrace[]) =>
  buildBenchmarkFailureMiningReport({
    suiteId: SUITE_ID,
    benchmarkRunId: RUN_ID,
    records: [buildRecord(0)],
    debugResults: [buildDebugResultWithTraces(decisionTraces)],
  });

const buildRoundOneTelemetryMiningResult = (decisionTraces: readonly AiDecisionTrace[]) =>
  buildBenchmarkFailureMiningReport({
    suiteId: SUITE_ID,
    benchmarkRunId: RUN_ID,
    records: [buildRecord(0)],
    debugResults: [buildRoundOneDebugResult(decisionTraces)],
  });

const getRoundOneOverinvestmentFinding = (decisionTraces: readonly AiDecisionTrace[]) => {
  const result = buildRoundOneTelemetryMiningResult(decisionTraces);
  const finding = result.findings.find((candidate) => candidate.kind === "round_one_overinvestment");
  expect(finding).toBeTruthy();
  return { result, finding: finding! };
};

describe("benchmark failure mining", () => {
  it("does not emit suspicious_pass solely because stopLossRecommended is false", () => {
    const result = buildPassMiningResult([
      passTrace(0, {
        recommendation: "none",
        stopLossRecommended: false,
        isVoluntarilySafe: true,
        hasSingleMoveCatchUp: false,
      }),
    ]);

    expect(result.findings.some((finding) => finding.kind === "suspicious_pass")).toBe(false);
    expect(result.summary.suppressedFindingCountsByKind.suspicious_pass).toBe(1);
    expect(result.summary.suppressedSuspiciousPassCountsByCategory.voluntary_safe_pass).toBe(1);
  });

  it("suppresses preserve-future-hand passes as analyzer noise", () => {
    const result = buildPassMiningResult([
      passTrace(0, {
        recommendation: "preserve_future_hand",
        stopLossRecommended: false,
        isVoluntarilySafe: false,
        hasSingleMoveCatchUp: true,
      }),
    ]);

    expect(result.findings.some((finding) => finding.kind === "suspicious_pass")).toBe(false);
    expect(result.summary.suppressedSuspiciousPassCountsByCategory.preserve_future_hand_pass).toBe(1);
  });

  it("suppresses sacrifice-round and stop-loss passes as analyzer noise", () => {
    const result = buildPassMiningResult([
      passTrace(0, {
        recommendation: "sacrifice_round",
        stopLossRecommended: false,
        isVoluntarilySafe: false,
      }),
      passTrace(1, {
        recommendation: "sacrifice_round",
        stopLossRecommended: true,
        isVoluntarilySafe: false,
      }),
    ]);

    expect(result.findings.some((finding) => finding.kind === "suspicious_pass")).toBe(false);
    expect(result.summary.suppressedFindingCountsByKind.suspicious_pass).toBe(2);
    expect(result.summary.suppressedSuspiciousPassCountsByCategory.sacrifice_round_pass).toBe(1);
    expect(result.summary.suppressedSuspiciousPassCountsByCategory.stop_loss_pass).toBe(1);
  });

  it("emits suspicious_pass when a selected pass contradicts a continue recommendation", () => {
    const result = buildPassMiningResult([
      passTrace(0, {
        recommendation: "continue",
        stopLossRecommended: false,
        isVoluntarilySafe: false,
        hasSingleMoveCatchUp: false,
      }),
    ]);

    const finding = result.findings.find((candidate) => candidate.kind === "suspicious_pass");
    expect(finding).toEqual(
      expect.objectContaining({
        severity: "warning",
        evidence: expect.objectContaining({
          roundInvestmentRecommendation: "continue",
          recommendationContinue: true,
        }),
      }),
    );
  });

  it("emits suspicious_pass for last-gem fight passes when the policy upper bound can win", () => {
    const result = buildPassMiningResult([
      passTrace(0, {
        recommendation: "fight_last_gem",
        stopLossRecommended: false,
        isVoluntarilySafe: false,
        hasSingleMoveCatchUp: false,
        policyUpperBoundCanWinRound: true,
      }),
    ]);

    expect(result.findings.find((finding) => finding.kind === "suspicious_pass")).toEqual(
      expect.objectContaining({
        severity: "warning",
        evidence: expect.objectContaining({
          fightLastGemUpperBoundCanWin: true,
          policyUpperBoundCanWinRound: true,
        }),
      }),
    );
  });

  it("keeps suppressed pass categories out of findings", () => {
    const result = buildPassMiningResult([
      passTrace(0, {
        recommendation: "preserve_future_hand",
        stopLossRecommended: false,
        isVoluntarilySafe: false,
      }),
    ]);
    const artifacts = serializeBenchmarkFailureMiningArtifacts(result);

    expect(result.summary.suppressedSuspiciousPassCountsByCategory.preserve_future_hand_pass).toBe(1);
    expect(artifacts.findingsJsonl).not.toContain("preserve_future_hand_pass");
    expect(result.findings.some((finding) => finding.kind === "suspicious_pass")).toBe(false);
  });

  it("adds scalar round-one guard telemetry to overinvestment findings", () => {
    const { finding } = getRoundOneOverinvestmentFinding([
      roundOneTrace(0, "play_card", {
        roundOneBoardAfterSelectedMove: 6,
        estimatedHandCountAfterSelectedMove: 5,
        scoreDelta: -3,
        roundOneOverinvestmentReason: "none",
        recommendation: "continue",
      }),
      roundOneTrace(1, "play_card", {
        roundOneBoardAfterSelectedMove: 7,
        estimatedHandCountAfterSelectedMove: 4,
        scoreDelta: 0,
        roundOneOverinvestmentRecommended: true,
        roundOneOverinvestmentReason: "round_one_board_limit",
        recommendation: "preserve_future_hand",
      }),
      roundOneTrace(2, "play_card", {
        roundOneBoardAfterSelectedMove: 8,
        estimatedHandCountAfterSelectedMove: 4,
        scoreDelta: 5,
        selectedMoveIsCardAdvantage: true,
        roundOneOverinvestmentReason: "exception_card_advantage",
        recommendation: "continue",
      }),
      roundOneTrace(3, "play_card", {
        roundOneBoardAfterSelectedMove: 7,
        estimatedHandCountAfterSelectedMove: 3,
        scoreDelta: -1,
        catchUpStatus: "single_move_catch_up",
        roundOneOverinvestmentReason: "exception_single_move_catch_up",
        recommendation: "continue",
      }),
      roundOneTrace(4, "pass", {
        roundOneBoardAfterSelectedMove: 7,
        estimatedHandCountAfterSelectedMove: 4,
        scoreDelta: 2,
        roundOneOverinvestmentRecommended: true,
        roundOneOverinvestmentReason: "round_one_board_limit",
        recommendation: "preserve_future_hand",
      }),
    ]);

    expect(finding.evidence).toEqual(
      expect.objectContaining({
        roundOneGuardTelemetryAvailable: true,
        roundOneTraceDecisionCount: 5,
        roundOnePlayCardTraceCount: 4,
        roundOneGuardBaseGeometryCount: 3,
        roundOneBoardFloorReachedCount: 3,
        roundOneHandCapReachedCount: 3,
        roundOneRecommendedCount: 1,
        roundOneSuppressedPassCount: 1,
        roundOneMaxBoardAfterSelectedMove: 8,
        roundOneMinHandAfterSelectedMove: 3,
        roundOneFirstBaseGeometryDecisionIndex: 1,
        roundOneFirstRecommendedDecisionIndex: 1,
        roundOneScoreDeltaBehindCount: 2,
        roundOneScoreDeltaTiedCount: 1,
        roundOneScoreDeltaAheadCount: 2,
        roundOneReasonNoneCount: 1,
        roundOneReasonBoardLimitCount: 2,
        roundOneExceptionCardAdvantageCount: 1,
        roundOneExceptionSingleMoveCatchUpCount: 1,
        roundOneSelectedCardAdvantageCount: 1,
        roundOneCatchUpSingleMoveCount: 1,
        roundOneRecommendationPreserveFutureHandCount: 2,
        roundOneRecommendationContinueCount: 3,
      }),
    );
  });

  it("marks round-one guard telemetry unavailable when trace evidence is missing", () => {
    const { finding } = getRoundOneOverinvestmentFinding([]);

    expect(finding.evidence).toEqual(
      expect.objectContaining({
        roundOneGuardTelemetryAvailable: false,
        roundOneTraceDecisionCount: 0,
        roundOnePlayCardTraceCount: 0,
        roundOneGuardBaseGeometryCount: 0,
        roundOneBoardFloorReachedCount: 0,
        roundOneHandCapReachedCount: 0,
        roundOneRecommendedCount: 0,
        roundOneSuppressedPassCount: 0,
        roundOneMaxBoardAfterSelectedMove: null,
        roundOneMinHandAfterSelectedMove: null,
        roundOneFirstBaseGeometryDecisionIndex: null,
        roundOneFirstRecommendedDecisionIndex: null,
        roundOneReasonNoneCount: 0,
        roundOneExceptionCardAdvantageCount: 0,
        roundOneRecommendationContinueCount: 0,
      }),
    );
  });

  it("keeps telemetry artifacts deterministic and hidden-info safe", () => {
    const traces = [
      roundOneTrace(0, "play_card", {
        roundOneBoardAfterSelectedMove: 7,
        estimatedHandCountAfterSelectedMove: 4,
        roundOneOverinvestmentRecommended: true,
        roundOneOverinvestmentReason: "round_one_board_limit",
      }),
    ];
    const first = buildRoundOneTelemetryMiningResult(traces);
    const second = buildRoundOneTelemetryMiningResult(traces);
    const artifacts = serializeBenchmarkFailureMiningArtifacts(first);
    const combined = combinedBenchmarkFailureMiningArtifactText(artifacts);

    expect(second).toEqual(first);
    expect(first.summary.findingCountsByKind.round_one_overinvestment).toBe(1);
    expect(first.summary.tuningQueue.map((item) => item.clusterId)).toEqual(["round_resource_exhaustion"]);
    expect(scanBenchmarkFailureMiningArtifactsForHiddenInfo(artifacts)).toEqual([]);
    expect(combined).toContain("roundOneGuardTelemetryAvailable");
    hiddenInfoHazards.forEach((hazard) => {
      expect(combined).not.toContain(hazard);
    });
  });

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
    expect(first.summary.tuningQueue.map((item) => item.clusterId)).toEqual(
      expect.arrayContaining([
        "round_resource_exhaustion",
        "weathered_row_low_tempo",
        "medic_no_target_timing",
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
        files: benchmarkFailureMiningArtifactFiles,
      }),
    );
    expect(first.tuningQueueMarkdown).toContain("# Benchmark Failure-Mining Tuning Queue");
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
        tuningQueueMarkdown: '{"finalState":{"seat_a:test":"leak"},"commandLog":[]}',
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
