import type { SeatId } from "@/game/core";
import type { SimulationTerminalStatus } from "@/game/sim";

import type {
  BenchmarkMatchRecord,
  BenchmarkMatchupSummary,
  BenchmarkOutcomeCounts,
  BenchmarkSummary,
} from "./types";

const STATUSES: readonly SimulationTerminalStatus[] = [
  "completed",
  "max_steps_exceeded",
  "policy_failed",
  "engine_error",
];

const emptyStatusCounts = (): Record<SimulationTerminalStatus, number> => ({
  completed: 0,
  max_steps_exceeded: 0,
  policy_failed: 0,
  engine_error: 0,
});

const emptyOutcomeCounts = (): BenchmarkOutcomeCounts => ({
  wins: 0,
  losses: 0,
  draws: 0,
  none: 0,
});

const average = (values: readonly number[]) =>
  values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;

const sortedUnique = (values: readonly string[]) => [...new Set(values)].sort((left, right) => left.localeCompare(right));

const incrementOutcome = (counts: BenchmarkOutcomeCounts, result: BenchmarkMatchRecord["resultBySeat"][SeatId]) => {
  if (result === "win") counts.wins += 1;
  if (result === "loss") counts.losses += 1;
  if (result === "draw") counts.draws += 1;
  if (result === "none") counts.none += 1;
};

const incrementResultCounts = (
  records: readonly BenchmarkMatchRecord[],
  keyForSeat: (record: BenchmarkMatchRecord, seatId: SeatId) => string,
) => {
  const counts: Record<string, BenchmarkOutcomeCounts> = {};

  records.forEach((record) => {
    (["seat_a", "seat_b"] as const).forEach((seatId) => {
      const key = keyForSeat(record, seatId);
      counts[key] ??= emptyOutcomeCounts();
      incrementOutcome(counts[key], record.resultBySeat[seatId]);
    });
  });

  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
};

const buildStatusCounts = (records: readonly BenchmarkMatchRecord[]) => {
  const counts = emptyStatusCounts();
  records.forEach((record) => {
    counts[record.status] += 1;
  });
  return counts;
};

const buildErrorCodeCounts = (records: readonly BenchmarkMatchRecord[]) => {
  const counts: Record<string, number> = {};
  records.forEach((record) => {
    if (record.errorCode) {
      counts[record.errorCode] = (counts[record.errorCode] ?? 0) + 1;
    }
    if (record.replayStatus === "failed") {
      counts.replay_failed = (counts.replay_failed ?? 0) + 1;
    }
  });
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
};

const buildMatchupSummary = (matchupId: string, records: readonly BenchmarkMatchRecord[]): BenchmarkMatchupSummary => ({
  matchupId,
  totalMatches: records.length,
  statusCounts: buildStatusCounts(records),
  resultCountsByPolicy: incrementResultCounts(records, (record, seatId) => record.seats[seatId].policyId),
  resultCountsByDeck: incrementResultCounts(records, (record, seatId) => record.seats[seatId].deckPresetId),
  averageSteps: average(records.map((record) => record.stepCount)),
  averageCommands: average(records.map((record) => record.commandCount)),
  averageLegalMoves: average(records.map((record) => record.averageLegalMoves)),
  promptCount: records.reduce((total, record) => total + record.promptsResolved, 0),
  leaderUseCount: records.reduce((total, record) => total + record.leaderUses, 0),
});

export const buildBenchmarkSummary = ({
  benchmarkRunId,
  suiteId,
  records,
}: {
  benchmarkRunId: string;
  suiteId: string;
  records: readonly BenchmarkMatchRecord[];
}): BenchmarkSummary => {
  const statusCounts = buildStatusCounts(records);
  const matchupIds = sortedUnique(records.map((record) => record.matchupId));

  return {
    schemaVersion: "benchmark-summary-v1",
    benchmarkRunId,
    suiteId,
    totalMatches: records.length,
    statusCounts,
    completionRate: records.length === 0 ? 0 : statusCounts.completed / records.length,
    maxStepRate: records.length === 0 ? 0 : statusCounts.max_steps_exceeded / records.length,
    errorCodeCounts: buildErrorCodeCounts(records),
    replayCheckedCount: records.filter((record) => record.replayStatus !== "skipped").length,
    replayFailedCount: records.filter((record) => record.replayStatus === "failed").length,
    policyIds: sortedUnique(records.flatMap((record) => [record.seats.seat_a.policyId, record.seats.seat_b.policyId])),
    deckPresetIds: sortedUnique(
      records.flatMap((record) => [record.seats.seat_a.deckPresetId, record.seats.seat_b.deckPresetId]),
    ),
    resultCountsByPolicy: incrementResultCounts(records, (record, seatId) => record.seats[seatId].policyId),
    resultCountsByDeck: incrementResultCounts(records, (record, seatId) => record.seats[seatId].deckPresetId),
    matchupSummaries: matchupIds.map((matchupId) =>
      buildMatchupSummary(
        matchupId,
        records.filter((record) => record.matchupId === matchupId),
      ),
    ),
    averageSteps: average(records.map((record) => record.stepCount)),
    averageCommands: average(records.map((record) => record.commandCount)),
    averageLegalMoves: average(records.map((record) => record.averageLegalMoves)),
    promptCount: records.reduce((total, record) => total + record.promptsResolved, 0),
    leaderUseCount: records.reduce((total, record) => total + record.leaderUses, 0),
  };
};

export const benchmarkStatuses = STATUSES;
