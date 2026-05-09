import { replayHeadlessMatchCommands } from "@/game/sim";
import type { HeadlessMatchSimulationInput, HeadlessMatchSimulationResult, SimulationTerminalStatus } from "@/game/sim";

import type {
  BenchmarkMatchRecord,
  BenchmarkReplayStatus,
  BenchmarkSeatDescriptor,
  BenchmarkSeatResult,
} from "./types";

const EMPTY_FINAL_GEMS = { seat_a: 0, seat_b: 0 } as const;

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const hashString = (value: string): string => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
};

const redactRuntimeIds = (message: string) => message.replace(/\bseat_[ab]:[A-Za-z0-9_.:-]+/g, (match) => {
  const seatId = match.slice(0, "seat_a".length);
  return `${seatId}:<redacted>`;
});

const emptySeatResults = (): Record<"seat_a" | "seat_b", BenchmarkSeatResult> => ({
  seat_a: "none",
  seat_b: "none",
});

const resultBySeat = (winner: BenchmarkMatchRecord["winner"]): BenchmarkMatchRecord["resultBySeat"] => {
  if (winner === "draw") {
    return { seat_a: "draw", seat_b: "draw" };
  }
  if (winner === "seat_a") {
    return { seat_a: "win", seat_b: "loss" };
  }
  if (winner === "seat_b") {
    return { seat_a: "loss", seat_b: "win" };
  }
  return emptySeatResults();
};

const buildStableFingerprint = ({
  record,
  result,
}: {
  record: Omit<BenchmarkMatchRecord, "stableFingerprint">;
  result?: HeadlessMatchSimulationResult;
}) => {
  const payload = {
    ...record,
    errorMessage: record.errorMessage ? "<redacted-message>" : undefined,
    commandTypes: result?.commandLog.map((command) => command.type) ?? [],
    eventTypes: result?.events.map((event) => event.type) ?? [],
    stepKinds: result?.steps.map((step) => step.chosenMoveKind) ?? [],
  };

  return `fpv1:${hashString(stableStringify(payload))}`;
};

export const buildBenchmarkReplayStatus = (
  result: HeadlessMatchSimulationResult,
  seats: HeadlessMatchSimulationInput["seats"],
): BenchmarkReplayStatus => {
  try {
    const replayed = replayHeadlessMatchCommands({ seed: result.seed, commandLog: result.commandLog, seats });
    const replayEssentials = stableStringify({
      phase: replayed.phase,
      round: replayed.round,
      roundHistory: replayed.roundHistory,
      gems: {
        seat_a: replayed.seats.seat_a.gems,
        seat_b: replayed.seats.seat_b.gems,
      },
    });
    const resultEssentials = stableStringify({
      phase: result.finalState.phase,
      round: result.finalState.round,
      roundHistory: result.finalState.roundHistory,
      gems: result.summary.finalGems,
    });

    return replayEssentials === resultEssentials ? "passed" : "failed";
  } catch {
    return "failed";
  }
};

export const buildBenchmarkMatchRecord = ({
  benchmarkRunId,
  suiteId,
  matchupId,
  seed,
  mirrorGroupId,
  mirrorIndex,
  seats,
  result,
  replayStatus,
}: {
  benchmarkRunId: string;
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorGroupId?: string;
  mirrorIndex?: 0 | 1;
  seats: Record<"seat_a" | "seat_b", BenchmarkSeatDescriptor>;
  result: HeadlessMatchSimulationResult;
  replayStatus: BenchmarkReplayStatus;
}): BenchmarkMatchRecord => {
  const roundWinsBySeat = {
    seat_a: result.finalState.roundHistory.filter((round) => round.winner === "seat_a").length,
    seat_b: result.finalState.roundHistory.filter((round) => round.winner === "seat_b").length,
  };
  const baseRecord: Omit<BenchmarkMatchRecord, "stableFingerprint"> = {
    schemaVersion: "benchmark-match-v1",
    benchmarkRunId,
    suiteId,
    matchupId,
    seed,
    mirrorGroupId,
    mirrorIndex,
    seats,
    status: result.status,
    winner: result.winner,
    resultBySeat: resultBySeat(result.winner),
    roundWinsBySeat,
    roundDraws: result.finalState.roundHistory.filter((round) => round.winner === "draw").length,
    finalGems: result.summary.finalGems,
    stepCount: result.summary.stepCount,
    commandCount: result.summary.commandCount,
    eventCount: result.summary.eventCount,
    averageLegalMoves: result.summary.averageLegalMoves,
    passCount: result.summary.passCount,
    promptsResolved: result.summary.promptsResolved,
    leaderUses: result.summary.leaderUses,
    replayStatus,
    errorCode: result.error?.code,
    errorMessage: result.error?.message ? redactRuntimeIds(result.error.message) : undefined,
  };

  return {
    ...baseRecord,
    stableFingerprint: buildStableFingerprint({ record: baseRecord, result }),
  };
};

export const buildFailedBenchmarkMatchRecord = ({
  benchmarkRunId,
  suiteId,
  matchupId,
  seed,
  mirrorGroupId,
  mirrorIndex,
  seats,
  status,
  errorCode,
  errorMessage,
}: {
  benchmarkRunId: string;
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorGroupId?: string;
  mirrorIndex?: 0 | 1;
  seats: Record<"seat_a" | "seat_b", BenchmarkSeatDescriptor>;
  status: SimulationTerminalStatus;
  errorCode: string;
  errorMessage: string;
}): BenchmarkMatchRecord => {
  const baseRecord: Omit<BenchmarkMatchRecord, "stableFingerprint"> = {
    schemaVersion: "benchmark-match-v1",
    benchmarkRunId,
    suiteId,
    matchupId,
    seed,
    mirrorGroupId,
    mirrorIndex,
    seats,
    status,
    winner: null,
    resultBySeat: emptySeatResults(),
    roundWinsBySeat: { seat_a: 0, seat_b: 0 },
    roundDraws: 0,
    finalGems: { ...EMPTY_FINAL_GEMS },
    stepCount: 0,
    commandCount: 0,
    eventCount: 0,
    averageLegalMoves: 0,
    passCount: 0,
    promptsResolved: 0,
    leaderUses: 0,
    replayStatus: "skipped",
    errorCode,
    errorMessage: redactRuntimeIds(errorMessage),
  };

  return {
    ...baseRecord,
    stableFingerprint: buildStableFingerprint({ record: baseRecord }),
  };
};
