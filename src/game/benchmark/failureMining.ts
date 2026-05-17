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

export interface BenchmarkFailureMiningSummary {
  readonly schemaVersion: typeof BENCHMARK_FAILURE_MINING_SCHEMA_VERSION;
  readonly suiteId: string;
  readonly benchmarkRunId: string;
  readonly recordCount: number;
  readonly findingCount: number;
  readonly findingCountsByKind: Record<string, number>;
  readonly findingCountsBySeverity: Record<string, number>;
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
        const passAnalysis = trace.passAnalysis;
        const roundInvestment = trace.roundInvestmentAnalysis;
        const voluntaryUnsafe = passAnalysis?.isVoluntarilySafe === false;
        const recommendationContinue = roundInvestment?.recommendation === "continue";
        const stopLossNotRecommended = roundInvestment?.stopLossRecommended === false;
        const singleMoveCatchUpIgnored = passAnalysis?.hasSingleMoveCatchUp === true;
        if (voluntaryUnsafe || recommendationContinue || stopLossNotRecommended || singleMoveCatchUpIgnored) {
          findings.push(
            createFinding({
              ...base,
              kind: "suspicious_pass",
              severity: singleMoveCatchUpIgnored || recommendationContinue ? "warning" : "watch",
              count: 1,
              message: `${descriptor.policyId} passed in a state that merits review.`,
              evidence: {
                decisionIndex: trace.decisionIndex,
                round: trace.round,
                scoreDelta: passAnalysis?.scoreDelta ?? roundInvestment?.scoreDelta ?? null,
                isVoluntarilySafe: passAnalysis?.isVoluntarilySafe ?? null,
                hasSingleMoveCatchUp: passAnalysis?.hasSingleMoveCatchUp ?? null,
                roundInvestmentRecommendation: roundInvestment?.recommendation ?? null,
                stopLossRecommended: roundInvestment?.stopLossRecommended ?? null,
                selectedKind: trace.selected.kind,
                reasonKind: trace.reasonKind,
              },
              idParts: [descriptor.policyId, record.matchupId, record.seed, record.mirrorIndex, trace.seatId, trace.decisionIndex],
            }),
          );
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

  return findings;
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

## Deferred Signals

| Kind | Reason |
|---|---|
${deferredRows}

## Hidden-Info Boundary

This report is derived from public benchmark records plus in-memory headless diagnostics. It writes only public IDs, aggregate counts, rates, booleans, and bucket labels; raw engine/debug payloads and private zone contents are not part of this artifact contract.
`;
};

export function buildBenchmarkFailureMiningReport(
  input: BuildBenchmarkFailureMiningInput,
): BenchmarkFailureMiningResult {
  const contexts = alignDebugResults(input.records, input.debugResults);
  const findings = [
    ...buildPublicStatusFindings(input),
    ...buildMatchupSkewFindings(input),
    ...buildDeckSkewFindings(input),
    ...buildRoundOneOverinvestmentFindings({ ...input, contexts }),
    ...buildTraceFindings({ ...input, contexts }),
  ].sort(compareBenchmarkFailureFindings);

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
    topFindings: findings.slice(0, 10),
    deferredSignals,
  };

  const manifest: BenchmarkFailureMiningManifest = {
    schemaVersion: BENCHMARK_FAILURE_MINING_SCHEMA_VERSION,
    suiteId: input.suiteId,
    benchmarkRunId: input.benchmarkRunId,
    generatedAt: input.benchmarkRunId,
    files: ["manifest.json", "summary.json", "findings.jsonl", "report.md"],
    recordCount: input.records.length,
    findingCount: findings.length,
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
  };

  return {
    manifest,
    summary,
    findings,
    markdownReport: buildMarkdownReport(summary),
  };
}
