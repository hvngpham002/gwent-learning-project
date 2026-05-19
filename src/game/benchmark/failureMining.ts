import type { AiDecisionTrace } from "@/game/ai";
import type { SeatId } from "@/game/core";
import type { HeadlessMatchSimulationResult } from "@/game/sim";

import type { BenchmarkMatchRecord } from "./types";

export const BENCHMARK_FAILURE_MINING_SCHEMA_VERSION = "benchmark-failure-mining-v1" as const;

export type BenchmarkFailureFindingKind =
  | "matchup_skew"
  | "deck_skew"
  | "round_one_overinvestment"
  | "round_three_low_resource"
  | "suspicious_pass"
  | "weathered_row_play"
  | "medic_timing_risk"
  | "leader_underuse"
  | "max_steps"
  | "policy_failed"
  | "engine_error"
  | "replay_failed";

export type BenchmarkFailureFindingSeverity = "info" | "watch" | "warning";

export type BenchmarkSuspiciousPassSuppressionCategory =
  | "preserve_future_hand_pass"
  | "sacrifice_round_pass"
  | "voluntary_safe_pass"
  | "stop_loss_pass"
  | "insufficient_context";

export interface BenchmarkFailureFinding {
  readonly schemaVersion: typeof BENCHMARK_FAILURE_MINING_SCHEMA_VERSION;
  readonly findingId: string;
  readonly suiteId: string;
  readonly benchmarkRunId: string;
  readonly kind: BenchmarkFailureFindingKind;
  readonly severity: BenchmarkFailureFindingSeverity;
  readonly policyId?: string;
  readonly deckPresetId?: string;
  readonly faction?: string;
  readonly matchupId?: string;
  readonly seed?: string;
  readonly mirrorIndex?: number;
  readonly count: number;
  readonly rate?: number;
  readonly message: string;
  readonly evidence: Record<string, string | number | boolean | null>;
}

export interface BenchmarkFailureTuningQueueItem {
  readonly rank: number;
  readonly clusterId: string;
  readonly title: string;
  readonly findingKinds: readonly BenchmarkFailureFindingKind[];
  readonly severity: BenchmarkFailureFindingSeverity;
  readonly count: number;
  readonly affectedDecks: readonly string[];
  readonly affectedFactions: readonly string[];
  readonly affectedMatchups: readonly string[];
  readonly recommendation: string;
  readonly suggestedNextSpecId: string;
}

export interface BenchmarkFailureMiningSummary {
  readonly schemaVersion: typeof BENCHMARK_FAILURE_MINING_SCHEMA_VERSION;
  readonly suiteId: string;
  readonly benchmarkRunId: string;
  readonly recordCount: number;
  readonly findingCount: number;
  readonly findingCountsByKind: Record<string, number>;
  readonly findingCountsBySeverity: Record<string, number>;
  readonly suppressedFindingCountsByKind: Record<string, number>;
  readonly suppressedSuspiciousPassCountsByCategory: Record<BenchmarkSuspiciousPassSuppressionCategory, number>;
  readonly tuningQueue: readonly BenchmarkFailureTuningQueueItem[];
  readonly topFindings: readonly BenchmarkFailureFinding[];
  readonly deferredSignals: readonly {
    readonly kind: BenchmarkFailureFindingKind;
    readonly reason: string;
  }[];
}

export interface BenchmarkFailureMiningManifest {
  readonly schemaVersion: typeof BENCHMARK_FAILURE_MINING_SCHEMA_VERSION;
  readonly suiteId: string;
  readonly benchmarkRunId: string;
  readonly generatedAt: string;
  readonly files: readonly string[];
  readonly recordCount: number;
  readonly findingCount: number;
  readonly hiddenInfoSafetyNote: string;
}

export interface BuildBenchmarkFailureMiningInput {
  readonly suiteId: string;
  readonly benchmarkRunId: string;
  readonly records: readonly BenchmarkMatchRecord[];
  readonly debugResults?: readonly HeadlessMatchSimulationResult[];
}

export interface BenchmarkFailureMiningResult {
  readonly manifest: BenchmarkFailureMiningManifest;
  readonly summary: BenchmarkFailureMiningSummary;
  readonly findings: readonly BenchmarkFailureFinding[];
  readonly markdownReport: string;
  readonly tuningQueueMarkdown: string;
}

type Evidence = BenchmarkFailureFinding["evidence"];
type SeatStats = { wins: number; losses: number; draws: number; none: number; recordCount: number };

const SEATS = ["seat_a", "seat_b"] as const;
const FINDING_KINDS: readonly BenchmarkFailureFindingKind[] = [
  "matchup_skew",
  "deck_skew",
  "round_one_overinvestment",
  "round_three_low_resource",
  "suspicious_pass",
  "weathered_row_play",
  "medic_timing_risk",
  "leader_underuse",
  "max_steps",
  "policy_failed",
  "engine_error",
  "replay_failed",
];
const FINDING_SEVERITIES: readonly BenchmarkFailureFindingSeverity[] = ["warning", "watch", "info"];
const SUSPICIOUS_PASS_SUPPRESSION_CATEGORIES: readonly BenchmarkSuspiciousPassSuppressionCategory[] = [
  "preserve_future_hand_pass",
  "sacrifice_round_pass",
  "voluntary_safe_pass",
  "stop_loss_pass",
  "insufficient_context",
];
const SEVERITY_RANK: Record<BenchmarkFailureFindingSeverity, number> = {
  warning: 0,
  watch: 1,
  info: 2,
};

const HIDDEN_INFO_SAFETY_NOTE =
  "Failure-mining artifacts contain public benchmark IDs, aggregate counts, rates, bucketed diagnostics, and generated messages only. Raw engine/debug payloads and private zone contents are intentionally omitted.";

const formatRate = (value: number) => Number(value.toFixed(3));

const rate = (count: number, total: number) => (total === 0 ? 0 : formatRate(count / total));

const emptyStats = (): SeatStats => ({ wins: 0, losses: 0, draws: 0, none: 0, recordCount: 0 });

const addOutcome = (stats: SeatStats, outcome: BenchmarkMatchRecord["resultBySeat"][SeatId]) => {
  stats.recordCount += 1;
  if (outcome === "win") stats.wins += 1;
  if (outcome === "loss") stats.losses += 1;
  if (outcome === "draw") stats.draws += 1;
  if (outcome === "none") stats.none += 1;
};

const sanitizeIdPart = (value: string | number | undefined) => {
  const sanitized = String(value ?? "none")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || "none";
};

const findingId = (parts: readonly (string | number | undefined)[]) => parts.map(sanitizeIdPart).join("__");

const compareOptional = (left?: string | number, right?: string | number) =>
  String(left ?? "").localeCompare(String(right ?? ""));

const sortUnique = (values: readonly (string | undefined)[]) =>
  [...new Set(values.filter((value): value is string => Boolean(value)))].sort((left, right) =>
    left.localeCompare(right),
  );

export const compareBenchmarkFailureFindings = (
  left: BenchmarkFailureFinding,
  right: BenchmarkFailureFinding,
) =>
  SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity] ||
  left.kind.localeCompare(right.kind) ||
  compareOptional(left.policyId, right.policyId) ||
  compareOptional(left.matchupId, right.matchupId) ||
  compareOptional(left.seed, right.seed) ||
  (left.mirrorIndex ?? -1) - (right.mirrorIndex ?? -1) ||
  left.findingId.localeCompare(right.findingId);

const shouldConsumeDebugResult = (record: BenchmarkMatchRecord) =>
  record.errorCode !== "unknown_policy" && record.errorCode !== "benchmark_match_failed";

const alignDebugResults = (
  records: readonly BenchmarkMatchRecord[],
  debugResults: readonly HeadlessMatchSimulationResult[] | undefined,
) => {
  let debugIndex = 0;
  return records.map((record) => {
    if (!debugResults || !shouldConsumeDebugResult(record)) {
      return { record, result: undefined };
    }
    const candidate = debugResults[debugIndex];
    if (!candidate) {
      return { record, result: undefined };
    }
    debugIndex += 1;
    return { record, result: candidate };
  });
};

const createFinding = ({
  suiteId,
  benchmarkRunId,
  kind,
  severity,
  policyId,
  deckPresetId,
  faction,
  matchupId,
  seed,
  mirrorIndex,
  count,
  rate: findingRate,
  message,
  evidence,
  idParts,
}: Omit<BenchmarkFailureFinding, "schemaVersion" | "findingId"> & {
  readonly idParts: readonly (string | number | undefined)[];
}): BenchmarkFailureFinding => ({
  schemaVersion: BENCHMARK_FAILURE_MINING_SCHEMA_VERSION,
  findingId: findingId([kind, ...idParts]),
  suiteId,
  benchmarkRunId,
  kind,
  severity,
  policyId,
  deckPresetId,
  faction,
  matchupId,
  seed,
  mirrorIndex,
  count,
  rate: findingRate,
  message,
  evidence,
});

const seatPolicy = (record: BenchmarkMatchRecord, seatId: SeatId) => record.seats[seatId].policyId;
const seatDeck = (record: BenchmarkMatchRecord, seatId: SeatId) => record.seats[seatId].deckPresetId;
const seatFaction = (record: BenchmarkMatchRecord, seatId: SeatId) => record.seats[seatId].faction;

const buildPublicStatusFindings = ({
  suiteId,
  benchmarkRunId,
  records,
}: {
  suiteId: string;
  benchmarkRunId: string;
  records: readonly BenchmarkMatchRecord[];
}) => {
  const findings: BenchmarkFailureFinding[] = [];

  records.forEach((record) => {
    const base = {
      suiteId,
      benchmarkRunId,
      matchupId: record.matchupId,
      seed: String(record.seed),
      mirrorIndex: record.mirrorIndex,
      count: 1,
      evidence: {
        status: record.status,
        replayStatus: record.replayStatus,
        errorCode: record.errorCode ?? null,
      } satisfies Evidence,
    };

    if (record.status === "max_steps_exceeded") {
      findings.push(
        createFinding({
          ...base,
          kind: "max_steps",
          severity: "warning",
          message: "Benchmark record reached the configured step limit.",
          idParts: [record.matchupId, record.seed, record.mirrorIndex],
        }),
      );
    }
    if (record.status === "policy_failed") {
      findings.push(
        createFinding({
          ...base,
          kind: "policy_failed",
          severity: "warning",
          message: "Benchmark record ended with a policy failure.",
          idParts: [record.matchupId, record.seed, record.mirrorIndex],
        }),
      );
    }
    if (record.status === "engine_error") {
      findings.push(
        createFinding({
          ...base,
          kind: "engine_error",
          severity: "warning",
          message: "Benchmark record ended with an engine error.",
          idParts: [record.matchupId, record.seed, record.mirrorIndex],
        }),
      );
    }
    if (record.replayStatus === "failed") {
      findings.push(
        createFinding({
          ...base,
          kind: "replay_failed",
          severity: "warning",
          message: "Benchmark replay verification failed.",
          idParts: [record.matchupId, record.seed, record.mirrorIndex],
        }),
      );
    }
  });

  return findings;
};

const buildMatchupSkewFindings = ({
  suiteId,
  benchmarkRunId,
  records,
}: {
  suiteId: string;
  benchmarkRunId: string;
  records: readonly BenchmarkMatchRecord[];
}) => {
  const statsByKey = new Map<string, { matchupId: string; policyId: string; stats: SeatStats }>();
  const mirrorStatsByKey = new Map<string, { matchupId: string; policyId: string; mirrorIndex: number; stats: SeatStats }>();

  records.forEach((record) => {
    SEATS.forEach((seatId) => {
      const policyId = seatPolicy(record, seatId);
      const key = `${record.matchupId}\u0000${policyId}`;
      const existing = statsByKey.get(key) ?? { matchupId: record.matchupId, policyId, stats: emptyStats() };
      addOutcome(existing.stats, record.resultBySeat[seatId]);
      statsByKey.set(key, existing);

      if (record.mirrorIndex !== undefined) {
        const mirrorKey = `${record.matchupId}\u0000${policyId}\u0000${record.mirrorIndex}`;
        const mirrorExisting = mirrorStatsByKey.get(mirrorKey) ?? {
          matchupId: record.matchupId,
          policyId,
          mirrorIndex: record.mirrorIndex,
          stats: emptyStats(),
        };
        addOutcome(mirrorExisting.stats, record.resultBySeat[seatId]);
        mirrorStatsByKey.set(mirrorKey, mirrorExisting);
      }
    });
  });

  const findings: BenchmarkFailureFinding[] = [];
  statsByKey.forEach(({ matchupId, policyId, stats }) => {
    if (policyId !== "legal-heuristic-v1") return;
    if (stats.recordCount < 3) return;
    const winRate = rate(stats.wins, stats.recordCount);
    const lossRate = rate(stats.losses, stats.recordCount);
    if (winRate <= 0.34 || lossRate >= 0.67) {
      findings.push(
        createFinding({
          suiteId,
          benchmarkRunId,
          kind: "matchup_skew",
          severity: "warning",
          policyId,
          matchupId,
          count: stats.recordCount,
          rate: winRate,
          message: `${policyId} has a low win rate in ${matchupId}.`,
          evidence: {
            recordCount: stats.recordCount,
            winRate,
            lossRate,
            drawRate: rate(stats.draws, stats.recordCount),
            noneRate: rate(stats.none, stats.recordCount),
            policyId,
          },
          idParts: [policyId, matchupId, "low-win-rate"],
        }),
      );
    } else if (winRate <= 0.5) {
      findings.push(
        createFinding({
          suiteId,
          benchmarkRunId,
          kind: "matchup_skew",
          severity: "watch",
          policyId,
          matchupId,
          count: stats.recordCount,
          rate: winRate,
          message: `${policyId} is near or below break-even in ${matchupId}.`,
          evidence: {
            recordCount: stats.recordCount,
            winRate,
            lossRate,
            drawRate: rate(stats.draws, stats.recordCount),
            noneRate: rate(stats.none, stats.recordCount),
            policyId,
          },
          idParts: [policyId, matchupId, "watch-win-rate"],
        }),
      );
    }

    const mirror0 = mirrorStatsByKey.get(`${matchupId}\u0000${policyId}\u00000`)?.stats;
    const mirror1 = mirrorStatsByKey.get(`${matchupId}\u0000${policyId}\u00001`)?.stats;
    if (mirror0 && mirror1 && mirror0.recordCount > 0 && mirror1.recordCount > 0) {
      const mirror0WinRate = rate(mirror0.wins, mirror0.recordCount);
      const mirror1WinRate = rate(mirror1.wins, mirror1.recordCount);
      const difference = formatRate(Math.abs(mirror0WinRate - mirror1WinRate));
      if (difference >= 0.5) {
        findings.push(
          createFinding({
            suiteId,
            benchmarkRunId,
            kind: "matchup_skew",
            severity: "watch",
            policyId,
            matchupId,
            count: mirror0.recordCount + mirror1.recordCount,
            rate: difference,
            message: `${policyId} has a large mirror-direction split in ${matchupId}.`,
            evidence: {
              mirror0WinRate,
              mirror1WinRate,
              mirrorWinRateDifference: difference,
              mirror0RecordCount: mirror0.recordCount,
              mirror1RecordCount: mirror1.recordCount,
            },
            idParts: [policyId, matchupId, "mirror-split"],
          }),
        );
      }
    }
  });

  return findings;
};

const buildDeckSkewFindings = ({
  suiteId,
  benchmarkRunId,
  records,
}: {
  suiteId: string;
  benchmarkRunId: string;
  records: readonly BenchmarkMatchRecord[];
}) => {
  const statsByDeck = new Map<string, { deckPresetId: string; faction: string; stats: SeatStats }>();

  records.forEach((record) => {
    SEATS.forEach((seatId) => {
      const deckPresetId = seatDeck(record, seatId);
      const key = `${deckPresetId}\u0000${seatFaction(record, seatId)}`;
      const existing = statsByDeck.get(key) ?? {
        deckPresetId,
        faction: seatFaction(record, seatId),
        stats: emptyStats(),
      };
      addOutcome(existing.stats, record.resultBySeat[seatId]);
      statsByDeck.set(key, existing);
    });
  });

  const findings: BenchmarkFailureFinding[] = [];
  statsByDeck.forEach(({ deckPresetId, faction, stats }) => {
    if (stats.recordCount < 8) return;
    const winRate = rate(stats.wins, stats.recordCount);
    const lossRate = rate(stats.losses, stats.recordCount);
    const direction = winRate >= 0.5 ? "overperforming" : "underperforming";
    const severity: BenchmarkFailureFindingSeverity =
      winRate >= 0.75 || winRate <= 0.25 ? "warning" : winRate >= 0.65 || winRate <= 0.35 ? "watch" : "info";
    if (severity === "info") return;

    findings.push(
      createFinding({
        suiteId,
        benchmarkRunId,
        kind: "deck_skew",
        severity,
        deckPresetId,
        faction,
        count: stats.recordCount,
        rate: winRate,
        message: `${deckPresetId} is ${direction} across the suite.`,
        evidence: {
          deckPresetId,
          faction,
          winRate,
          lossRate,
          drawRate: rate(stats.draws, stats.recordCount),
          noneRate: rate(stats.none, stats.recordCount),
          recordCount: stats.recordCount,
          direction,
        },
        idParts: [deckPresetId, faction, direction],
      }),
    );
  });

  return findings;
};

const hasTraceData = (debugResults: readonly HeadlessMatchSimulationResult[] | undefined) =>
  Boolean(debugResults?.some((result) => result.decisionTraces && result.decisionTraces.length > 0));

const traceSeatDescriptor = (record: BenchmarkMatchRecord, trace: AiDecisionTrace) => ({
  policyId: trace.policyId,
  deckPresetId: seatDeck(record, trace.seatId),
  faction: seatFaction(record, trace.seatId),
  outcome: record.resultBySeat[trace.seatId],
});

const isWeakRoundThreeTrace = (trace: AiDecisionTrace) => {
  const handShape = trace.handShapeAnalysis;
  if (!handShape || trace.round !== 3 || trace.phase !== "playing") return false;
  const noUsefulUnitTempo =
    handShape.positiveUnitMoveCount === 0 ||
    handShape.bestUnitTempoBucket === "none" ||
    handShape.futureRoundHandQuality === "poor";
  return noUsefulUnitTempo && (handShape.specialOnlyHand || handShape.futureRoundHandQuality !== "healthy");
};

const buildZeroCounts = <T extends string>(values: readonly T[]) =>
  Object.fromEntries(values.map((value) => [value, 0])) as Record<T, number>;

const incrementCount = <T extends string>(counts: Record<T, number>, key: T) => {
  counts[key] = (counts[key] ?? 0) + 1;
};

const isSafePassRecommendation = (recommendation: string | undefined) =>
  recommendation === "preserve_future_hand" || recommendation === "sacrifice_round";

const getPassOpponentPassed = (trace: AiDecisionTrace) =>
  trace.passAnalysis?.isOpponentPassed ?? trace.publicState?.opponentPassed ?? null;

const getPassScoreDelta = (trace: AiDecisionTrace) =>
  trace.passAnalysis?.scoreDelta ?? trace.roundInvestmentAnalysis?.scoreDelta ?? trace.publicState?.scoreDelta ?? null;

const classifySuppressedPassCandidate = (trace: AiDecisionTrace): BenchmarkSuspiciousPassSuppressionCategory => {
  const recommendation = trace.roundInvestmentAnalysis?.recommendation;
  if (trace.roundInvestmentAnalysis?.stopLossRecommended === true) return "stop_loss_pass";
  if (recommendation === "preserve_future_hand") return "preserve_future_hand_pass";
  if (recommendation === "sacrifice_round") return "sacrifice_round_pass";

  const scoreDelta = getPassScoreDelta(trace);
  const opponentPassed = getPassOpponentPassed(trace);
  if (
    trace.passAnalysis?.isVoluntarilySafe === true ||
    (opponentPassed === true && typeof scoreDelta === "number" && scoreDelta > 0)
  ) {
    return "voluntary_safe_pass";
  }

  return "insufficient_context";
};

const analyzeSuspiciousPassTrace = (
  trace: AiDecisionTrace,
):
  | {
      readonly shouldEmit: true;
      readonly severity: BenchmarkFailureFindingSeverity;
      readonly evidence: Evidence;
    }
  | {
      readonly shouldEmit: false;
      readonly suppressionCategory?: BenchmarkSuspiciousPassSuppressionCategory;
    } => {
  if (trace.selected?.kind !== "pass") return { shouldEmit: false };

  const passAnalysis = trace.passAnalysis;
  const roundInvestment = trace.roundInvestmentAnalysis;
  const recommendation = roundInvestment?.recommendation;
  const opponentPassed = getPassOpponentPassed(trace);
  const stopLossRecommended = roundInvestment?.stopLossRecommended === true;
  const recommendationContinue = recommendation === "continue";
  const singleMoveCatchUpIgnored =
    passAnalysis?.hasSingleMoveCatchUp === true && !isSafePassRecommendation(recommendation);
  const fightLastGemUpperBoundCanWin =
    passAnalysis?.policyUpperBoundCanWinRound === true && recommendation === "fight_last_gem";
  const activeVoluntaryUnsafe =
    passAnalysis?.isVoluntarilySafe === false &&
    opponentPassed === false &&
    !isSafePassRecommendation(recommendation) &&
    !stopLossRecommended;
  const broadCfp34Candidate =
    passAnalysis?.isVoluntarilySafe === false ||
    recommendationContinue ||
    roundInvestment?.stopLossRecommended === false ||
    passAnalysis?.hasSingleMoveCatchUp === true;

  const shouldEmit =
    !stopLossRecommended &&
    !isSafePassRecommendation(recommendation) &&
    (recommendationContinue || singleMoveCatchUpIgnored || fightLastGemUpperBoundCanWin || activeVoluntaryUnsafe);

  if (!shouldEmit) {
    return {
      shouldEmit: false,
      suppressionCategory: broadCfp34Candidate ? classifySuppressedPassCandidate(trace) : undefined,
    };
  }

  return {
    shouldEmit: true,
    severity: recommendationContinue || singleMoveCatchUpIgnored || fightLastGemUpperBoundCanWin ? "warning" : "watch",
    evidence: {
      decisionIndex: trace.decisionIndex,
      round: trace.round,
      scoreDelta: getPassScoreDelta(trace),
      isVoluntarilySafe: passAnalysis?.isVoluntarilySafe ?? null,
      isOpponentPassed: opponentPassed,
      hasSingleMoveCatchUp: passAnalysis?.hasSingleMoveCatchUp ?? null,
      policyUpperBoundCanWinRound: passAnalysis?.policyUpperBoundCanWinRound ?? null,
      roundInvestmentRecommendation: recommendation ?? null,
      stopLossRecommended: roundInvestment?.stopLossRecommended ?? null,
      recommendationContinue,
      singleMoveCatchUpIgnored,
      fightLastGemUpperBoundCanWin,
      activeVoluntaryUnsafe,
      selectedKind: trace.selected.kind,
      reasonKind: trace.reasonKind,
    },
  };
};

const buildTraceFindings = ({
  suiteId,
  benchmarkRunId,
  contexts,
}: {
  suiteId: string;
  benchmarkRunId: string;
  contexts: readonly { record: BenchmarkMatchRecord; result?: HeadlessMatchSimulationResult }[];
}) => {
  const findings: BenchmarkFailureFinding[] = [];
  const suppressedSuspiciousPassCountsByCategory = buildZeroCounts(SUSPICIOUS_PASS_SUPPRESSION_CATEGORIES);

  contexts.forEach(({ record, result }) => {
    const traces = result?.decisionTraces ?? [];

    traces.forEach((trace) => {
      const descriptor = traceSeatDescriptor(record, trace);
      const base = {
        suiteId,
        benchmarkRunId,
        policyId: descriptor.policyId,
        deckPresetId: descriptor.deckPresetId,
        faction: descriptor.faction,
        matchupId: record.matchupId,
        seed: String(record.seed),
        mirrorIndex: record.mirrorIndex,
      };

      if (isWeakRoundThreeTrace(trace) && (trace.selected?.kind === "pass" || descriptor.outcome === "loss")) {
        findings.push(
          createFinding({
            ...base,
            kind: "round_three_low_resource",
            severity: descriptor.outcome === "loss" && trace.selected?.kind === "pass" ? "warning" : "watch",
            count: 1,
            message: `${descriptor.policyId} reached round 3 with weak aggregate resources.`,
            evidence: {
              decisionIndex: trace.decisionIndex,
              selectedKind: trace.selected?.kind ?? null,
              matchOutcome: descriptor.outcome,
              unitCardCount: trace.handShapeAnalysis?.unitCardCount ?? null,
              heroCardCount: trace.handShapeAnalysis?.heroCardCount ?? null,
              positiveUnitMoveCount: trace.handShapeAnalysis?.positiveUnitMoveCount ?? null,
              specialOnlyHand: trace.handShapeAnalysis?.specialOnlyHand ?? null,
              futureRoundHandQuality: trace.handShapeAnalysis?.futureRoundHandQuality ?? null,
            },
            idParts: [descriptor.policyId, record.matchupId, record.seed, record.mirrorIndex, trace.seatId, trace.decisionIndex],
          }),
        );
      }

      if (trace.selected?.kind === "pass") {
        const suspiciousPass = analyzeSuspiciousPassTrace(trace);
        if (suspiciousPass.shouldEmit) {
          findings.push(
            createFinding({
              ...base,
              kind: "suspicious_pass",
              severity: suspiciousPass.severity,
              count: 1,
              message: `${descriptor.policyId} passed in a state that merits review.`,
              evidence: suspiciousPass.evidence,
              idParts: [descriptor.policyId, record.matchupId, record.seed, record.mirrorIndex, trace.seatId, trace.decisionIndex],
            }),
          );
        } else if (suspiciousPass.suppressionCategory) {
          incrementCount(suppressedSuspiciousPassCountsByCategory, suspiciousPass.suppressionCategory);
        }
      }

      const weather = trace.weatherPlacementAnalysis;
      if (
        weather?.selectedMoveIntoWeatheredRow &&
        (weather.selectedPrintedStrengthBucket === "medium" || weather.selectedPrintedStrengthBucket === "high") &&
        (weather.selectedEffectiveStrengthBucket === "none" || weather.selectedEffectiveStrengthBucket === "low")
      ) {
        findings.push(
          createFinding({
            ...base,
            kind: "weathered_row_play",
            severity: weather.selectedPrintedStrengthBucket === "high" ? "warning" : "watch",
            count: 1,
            message: `${descriptor.policyId} played meaningful printed strength into a weathered row.`,
            evidence: {
              decisionIndex: trace.decisionIndex,
              selectedMoveSide: weather.selectedMoveSide,
              selectedMoveRow: weather.selectedMoveRow,
              selectedPrintedStrengthBucket: weather.selectedPrintedStrengthBucket,
              selectedEffectiveStrengthBucket: weather.selectedEffectiveStrengthBucket,
              candidateWeatheredOwnRowPlayCount: weather.candidateWeatheredOwnRowPlayCount,
              candidateWeatheredOpponentRowPlayCount: weather.candidateWeatheredOpponentRowPlayCount,
            },
            idParts: [descriptor.policyId, record.matchupId, record.seed, record.mirrorIndex, trace.seatId, trace.decisionIndex],
          }),
        );
      }

      const medic = trace.medicTimingAnalysis;
      const selectedMedicPlay = medic?.selectedMoveIsMedic === true;
      const weakMedicTarget =
        selectedMedicPlay && (medic.bestReviveValueBucket === "none" || medic.bestReviveValueBucket === "weak");
      if (medic?.selectedMedicWithNoTarget || (selectedMedicPlay && medic?.noTargetMedicRisk) || weakMedicTarget) {
        findings.push(
          createFinding({
            ...base,
            kind: "medic_timing_risk",
            severity: medic.selectedMedicWithNoTarget || medic.noTargetMedicRisk ? "warning" : "watch",
            count: 1,
            message: `${descriptor.policyId} selected a play with weak Medic timing signals.`,
            evidence: {
              decisionIndex: trace.decisionIndex,
              selectedKind: trace.selected?.kind ?? null,
              selectedMoveIsMedic: medic.selectedMoveIsMedic,
              selectedMedicWithNoTarget: medic.selectedMedicWithNoTarget,
              noTargetMedicRisk: medic.noTargetMedicRisk,
              ownDiscardReviveCandidateCount: medic.ownDiscardReviveCandidateCount,
              bestReviveStrengthBucket: medic.bestReviveStrengthBucket,
              bestReviveValueBucket: medic.bestReviveValueBucket,
              medicPlayCandidateCount: medic.medicPlayCandidateCount,
            },
            idParts: [descriptor.policyId, record.matchupId, record.seed, record.mirrorIndex, trace.seatId, trace.decisionIndex],
          }),
        );
      }
    });
  });

  return { findings, suppressedSuspiciousPassCountsByCategory };
};

const buildRoundOneOverinvestmentFindings = ({
  suiteId,
  benchmarkRunId,
  contexts,
}: {
  suiteId: string;
  benchmarkRunId: string;
  contexts: readonly { record: BenchmarkMatchRecord; result?: HeadlessMatchSimulationResult }[];
}) => {
  const findings: BenchmarkFailureFinding[] = [];

  contexts.forEach(({ record, result }) => {
    if (!result) return;
    SEATS.forEach((seatId) => {
      if (seatPolicy(record, seatId) !== "legal-heuristic-v1") return;
      const round1PlayCardCount = result.steps.filter(
        (step) => step.phase === "playing" && step.round === 1 && step.seatId === seatId && step.chosenMoveKind === "play_card",
      ).length;
      const matchOutcome = record.resultBySeat[seatId];
      const shouldWarn = round1PlayCardCount >= 8 && matchOutcome === "loss";
      const shouldWatch = round1PlayCardCount >= 7 && matchOutcome !== "win";
      if (!shouldWarn && !shouldWatch) return;

      findings.push(
        createFinding({
          suiteId,
          benchmarkRunId,
          kind: "round_one_overinvestment",
          severity: shouldWarn ? "warning" : "watch",
          policyId: seatPolicy(record, seatId),
          deckPresetId: seatDeck(record, seatId),
          faction: seatFaction(record, seatId),
          matchupId: record.matchupId,
          seed: String(record.seed),
          mirrorIndex: record.mirrorIndex,
          count: 1,
          message: `${seatPolicy(record, seatId)} spent many cards in round 1 and did not win the match.`,
          evidence: {
            seatId,
            round1PlayCardCount,
            matchOutcome,
            resolvedRoundCount: result.summary.roundsResolved,
          },
          idParts: [seatPolicy(record, seatId), record.matchupId, record.seed, record.mirrorIndex, seatId],
        }),
      );
    });
  });

  return findings;
};

const buildCounts = <T extends string>(values: readonly T[], allValues: readonly T[]) => {
  const counts = Object.fromEntries(allValues.map((value) => [value, 0])) as Record<T, number>;
  values.forEach((value) => {
    counts[value] = (counts[value] ?? 0) + 1;
  });
  return counts;
};

const maxSeverity = (findings: readonly BenchmarkFailureFinding[]): BenchmarkFailureFindingSeverity => {
  if (findings.some((finding) => finding.severity === "warning")) return "warning";
  if (findings.some((finding) => finding.severity === "watch")) return "watch";
  return "info";
};

const isSkelligeRelevant = (finding: BenchmarkFailureFinding) =>
  finding.faction === "skellige" ||
  finding.deckPresetId?.includes("skellige") ||
  finding.matchupId?.includes("skellige") ||
  false;

const buildTuningQueueItem = ({
  rank,
  clusterId,
  title,
  findingKinds,
  findings,
  recommendation,
}: {
  readonly rank: number;
  readonly clusterId: string;
  readonly title: string;
  readonly findingKinds: readonly BenchmarkFailureFindingKind[];
  readonly findings: readonly BenchmarkFailureFinding[];
  readonly recommendation: string;
}): BenchmarkFailureTuningQueueItem | null => {
  if (findings.length === 0) return null;
  return {
    rank,
    clusterId,
    title,
    findingKinds,
    severity: maxSeverity(findings),
    count: findings.length,
    affectedDecks: sortUnique(findings.map((finding) => finding.deckPresetId)),
    affectedFactions: sortUnique(findings.map((finding) => finding.faction)),
    affectedMatchups: sortUnique(findings.map((finding) => finding.matchupId)),
    recommendation,
    suggestedNextSpecId: "next",
  };
};

const buildTuningQueue = (findings: readonly BenchmarkFailureFinding[]): readonly BenchmarkFailureTuningQueueItem[] => {
  const resourceFindings = findings.filter(
    (finding) => finding.kind === "round_one_overinvestment" || finding.kind === "round_three_low_resource",
  );
  const weatherFindings = findings.filter((finding) => finding.kind === "weathered_row_play");
  const medicFindings = findings.filter((finding) => finding.kind === "medic_timing_risk");
  const skelligeSkewFindings = findings.filter(
    (finding) =>
      isSkelligeRelevant(finding) &&
      (finding.kind === "deck_skew" ||
        finding.kind === "matchup_skew" ||
        finding.kind === "round_one_overinvestment" ||
        finding.kind === "round_three_low_resource"),
  );
  const suspiciousPassFindings = findings.filter((finding) => finding.kind === "suspicious_pass");

  return [
    buildTuningQueueItem({
      rank: 1,
      clusterId: "round_resource_exhaustion",
      title: "Round resource exhaustion",
      findingKinds: ["round_one_overinvestment", "round_three_low_resource"],
      findings: resourceFindings,
      recommendation:
        "Tune round investment and future-hand valuation before changing broad pass behavior; this cluster has direct policy implications across early overinvestment and weak round-three resources.",
    }),
    buildTuningQueueItem({
      rank: 2,
      clusterId: "weathered_row_low_tempo",
      title: "Weathered row low tempo",
      findingKinds: ["weathered_row_play"],
      findings: weatherFindings,
      recommendation:
        "Review weather-adjusted unit placement for cases where printed medium/high strength collapses to low or no effective tempo.",
    }),
    buildTuningQueueItem({
      rank: 3,
      clusterId: "medic_no_target_timing",
      title: "Medic no-target timing",
      findingKinds: ["medic_timing_risk"],
      findings: medicFindings,
      recommendation:
        "Review Medic timing thresholds where no-target or weak-target diagnostics still allow a Medic play.",
    }),
    buildTuningQueueItem({
      rank: 4,
      clusterId: "skellige_matchup_skew",
      title: "Skellige matchup skew",
      findingKinds: ["deck_skew", "matchup_skew", "round_one_overinvestment", "round_three_low_resource"],
      findings: skelligeSkewFindings,
      recommendation:
        "Keep Skellige matchup and deck skew visible, but require behavior evidence before making faction-specific policy changes.",
    }),
    buildTuningQueueItem({
      rank: 5,
      clusterId: "remaining_suspicious_pass",
      title: "Remaining suspicious pass",
      findingKinds: ["suspicious_pass"],
      findings: suspiciousPassFindings,
      recommendation:
        "Inspect only calibrated pass contradictions; do not tune against suppressed preserve-future-hand, sacrifice, stop-loss, or voluntary-safe passes.",
    }),
  ]
    .filter((item): item is BenchmarkFailureTuningQueueItem => item !== null)
    .sort((left, right) => left.rank - right.rank || left.clusterId.localeCompare(right.clusterId))
    .map((item, index) => ({ ...item, rank: index + 1 }));
};

const formatList = (values: readonly string[]) => (values.length === 0 ? "none" : values.join(", "));

const buildMarkdownReport = (summary: BenchmarkFailureMiningSummary) => {
  const severityRows = FINDING_SEVERITIES.map(
    (severity) => `| ${severity} | ${summary.findingCountsBySeverity[severity] ?? 0} |`,
  ).join("\n");
  const kindRows = FINDING_KINDS.map(
    (kind) => `| ${kind} | ${summary.findingCountsByKind[kind] ?? 0} |`,
  ).join("\n");
  const topRows =
    summary.topFindings.length === 0
      ? "| none | none | none | 0 | none |"
      : summary.topFindings
          .map(
            (finding) =>
              `| ${finding.severity} | ${finding.kind} | ${finding.policyId ?? finding.deckPresetId ?? "suite"} | ${finding.count} | ${finding.message} |`,
          )
          .join("\n");
  const deferredRows =
    summary.deferredSignals.length === 0
      ? "| none | none |"
      : summary.deferredSignals.map((signal) => `| ${signal.kind} | ${signal.reason} |`).join("\n");
  const suppressedRows = SUSPICIOUS_PASS_SUPPRESSION_CATEGORIES.map(
    (category) => `| ${category} | ${summary.suppressedSuspiciousPassCountsByCategory[category] ?? 0} |`,
  ).join("\n");
  const queueRows =
    summary.tuningQueue.length === 0
      ? "| none | none | none | 0 | none |"
      : summary.tuningQueue
          .map(
            (item) =>
              `| ${item.rank} | ${item.clusterId} | ${item.severity} | ${item.count} | ${item.recommendation} |`,
          )
          .join("\n");

  return `# Benchmark Failure Mining Report

## Run

- suite id: ${summary.suiteId}
- benchmark run id: ${summary.benchmarkRunId}
- schema: ${summary.schemaVersion}
- record count: ${summary.recordCount}
- finding count: ${summary.findingCount}
- generated at: ${summary.benchmarkRunId} (deterministic run metadata, not wall-clock time)

## Finding Counts By Severity

| Severity | Count |
|---|---:|
${severityRows}

## Finding Counts By Kind

| Kind | Count |
|---|---:|
${kindRows}

## Top Findings

| Severity | Kind | Scope | Count | Message |
|---|---|---|---:|---|
${topRows}

## Suppressed Analyzer Noise

| Suspicious-pass suppression category | Count |
|---|---:|
${suppressedRows}

## Tuning Queue

| Rank | Cluster | Severity | Count | Recommendation |
|---:|---|---|---:|---|
${queueRows}

## Deferred Signals

| Kind | Reason |
|---|---|
${deferredRows}

## Hidden-Info Boundary

This report is derived from public benchmark records plus in-memory headless diagnostics. It writes only public IDs, aggregate counts, rates, booleans, and bucket labels; raw engine/debug payloads and private zone contents are not part of this artifact contract.
`;
};

const buildTuningQueueMarkdown = (summary: BenchmarkFailureMiningSummary) => {
  const queueRows =
    summary.tuningQueue.length === 0
      ? "| none | none | none | 0 | none | none |"
      : summary.tuningQueue
          .map(
            (item) =>
              `| ${item.rank} | ${item.clusterId} | ${item.severity} | ${item.count} | ${formatList(item.affectedFactions)} | ${item.recommendation} |`,
          )
          .join("\n");
  const suppressedRows = SUSPICIOUS_PASS_SUPPRESSION_CATEGORIES.map(
    (category) => `| ${category} | ${summary.suppressedSuspiciousPassCountsByCategory[category] ?? 0} |`,
  ).join("\n");
  const topCluster = summary.tuningQueue[0]?.clusterId ?? "none";
  const recommendedScope =
    topCluster === "round_resource_exhaustion"
      ? "Next behavior phase should tune round-resource exhaustion first, not suspicious-pass broadly."
      : topCluster === "none"
        ? "Next behavior phase should further improve evaluator signals before behavior tuning because no ranked cluster was produced."
        : `Next behavior phase should tune ${topCluster} first, while keeping suppressed pass categories out of behavior-tuning scope.`;

  return `# Benchmark Failure-Mining Tuning Queue

## Source

- suite id: ${summary.suiteId}
- benchmark run id: ${summary.benchmarkRunId}
- schema: ${summary.schemaVersion}
- record count: ${summary.recordCount}
- finding count: ${summary.findingCount}
- calibrated suspicious-pass findings: ${summary.findingCountsByKind.suspicious_pass ?? 0}
- suppressed broad suspicious-pass candidates: ${summary.suppressedFindingCountsByKind.suspicious_pass ?? 0}

## Ranked Queue

| Rank | Cluster | Severity | Finding count | Affected factions | Recommendation |
|---:|---|---|---:|---|---|
${queueRows}

## Suppressed Analyzer Noise

| Suspicious-pass suppression category | Count |
|---|---:|
${suppressedRows}

## Recommended Next Scope

${recommendedScope}

## Hidden-Info Boundary

This queue is derived from public benchmark IDs and aggregate failure-mining findings only. It contains no raw engine state, command logs, private-zone arrays, runtime card instance IDs, or hidden hand card names.
`;
};

export function buildBenchmarkFailureMiningReport(
  input: BuildBenchmarkFailureMiningInput,
): BenchmarkFailureMiningResult {
  const contexts = alignDebugResults(input.records, input.debugResults);
  const traceResult = buildTraceFindings({ ...input, contexts });
  const findings = [
    ...buildPublicStatusFindings(input),
    ...buildMatchupSkewFindings(input),
    ...buildDeckSkewFindings(input),
    ...buildRoundOneOverinvestmentFindings({ ...input, contexts }),
    ...traceResult.findings,
  ].sort(compareBenchmarkFailureFindings);
  const suppressedSuspiciousPassCount = SUSPICIOUS_PASS_SUPPRESSION_CATEGORIES.reduce(
    (total, category) => total + (traceResult.suppressedSuspiciousPassCountsByCategory[category] ?? 0),
    0,
  );
  const suppressedFindingCountsByKind = buildZeroCounts(FINDING_KINDS);
  suppressedFindingCountsByKind.suspicious_pass = suppressedSuspiciousPassCount;
  const tuningQueue = buildTuningQueue(findings);

  const deferredSignals: BenchmarkFailureMiningSummary["deferredSignals"] = [
    {
      kind: "leader_underuse",
      reason:
        "Current safe trace data does not expose consecutive legal leader availability by turn; keep this deferred until a public step-level leader-availability summary exists.",
    },
    ...(hasTraceData(input.debugResults)
      ? []
      : ([
          {
            kind: "round_three_low_resource",
            reason: "Decision traces were not collected for this run, so round-3 hand-quality signals were unavailable.",
          },
          {
            kind: "suspicious_pass",
            reason: "Decision traces were not collected for this run, so pass diagnostics were unavailable.",
          },
          {
            kind: "weathered_row_play",
            reason: "Decision traces were not collected for this run, so weather-placement diagnostics were unavailable.",
          },
          {
            kind: "medic_timing_risk",
            reason: "Decision traces were not collected for this run, so Medic timing diagnostics were unavailable.",
          },
        ] satisfies BenchmarkFailureMiningSummary["deferredSignals"])),
  ];

  const summary: BenchmarkFailureMiningSummary = {
    schemaVersion: BENCHMARK_FAILURE_MINING_SCHEMA_VERSION,
    suiteId: input.suiteId,
    benchmarkRunId: input.benchmarkRunId,
    recordCount: input.records.length,
    findingCount: findings.length,
    findingCountsByKind: buildCounts(
      findings.map((finding) => finding.kind),
      FINDING_KINDS,
    ),
    findingCountsBySeverity: buildCounts(
      findings.map((finding) => finding.severity),
      FINDING_SEVERITIES,
    ),
    suppressedFindingCountsByKind,
    suppressedSuspiciousPassCountsByCategory: traceResult.suppressedSuspiciousPassCountsByCategory,
    tuningQueue,
    topFindings: findings.slice(0, 10),
    deferredSignals,
  };

  const manifest: BenchmarkFailureMiningManifest = {
    schemaVersion: BENCHMARK_FAILURE_MINING_SCHEMA_VERSION,
    suiteId: input.suiteId,
    benchmarkRunId: input.benchmarkRunId,
    generatedAt: input.benchmarkRunId,
    files: ["manifest.json", "summary.json", "findings.jsonl", "report.md", "tuning-queue.md"],
    recordCount: input.records.length,
    findingCount: findings.length,
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
  };

  return {
    manifest,
    summary,
    findings,
    markdownReport: buildMarkdownReport(summary),
    tuningQueueMarkdown: buildTuningQueueMarkdown(summary),
  };
}
