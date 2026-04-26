import { replayHeadlessMatchCommands } from "./runHeadlessMatch";
import { getWinner } from "./metrics";
import type {
  HeadlessMatchSimulationResult,
  SimulationReplayDiagnostics,
  SimulationRunFingerprints,
} from "./types";

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

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

const compare = (label: string, actual: unknown, expected: unknown, mismatches: string[]) => {
  if (stableStringify(actual) !== stableStringify(expected)) {
    mismatches.push(label);
  }
};

export const buildReplayDiagnostics = (
  result: HeadlessMatchSimulationResult,
  verifyReplay: boolean,
): SimulationReplayDiagnostics => {
  if (!verifyReplay) {
    return {
      checked: false,
      status: "skipped",
      commandCount: result.commandLog.length,
      mismatches: [],
    };
  }

  try {
    const replayed = replayHeadlessMatchCommands({ seed: result.seed, commandLog: result.commandLog });
    const mismatches: string[] = [];

    compare("phase", replayed.phase, result.finalState.phase, mismatches);
    compare("winner", getWinner(replayed), result.winner, mismatches);
    compare(
      "gems",
      { seat_a: replayed.seats.seat_a.gems, seat_b: replayed.seats.seat_b.gems },
      result.summary.finalGems,
      mismatches,
    );
    compare("roundHistory", replayed.roundHistory, result.finalState.roundHistory, mismatches);
    compare("round", replayed.round, result.finalState.round, mismatches);

    return {
      checked: true,
      status: mismatches.length === 0 ? "passed" : "failed",
      commandCount: result.commandLog.length,
      mismatches,
    };
  } catch (error) {
    return {
      checked: true,
      status: "failed",
      commandCount: result.commandLog.length,
      mismatches: [],
      error: toErrorMessage(error),
    };
  }
};

export const buildRunFingerprints = (result: HeadlessMatchSimulationResult): SimulationRunFingerprints => ({
  commandTypes: result.commandLog.map((command) => command.type).join("|"),
  eventTypes: result.events.map((event) => event.type).join("|"),
  summary: stableStringify({
    status: result.summary.status,
    winner: result.summary.winner ?? "none",
    roundsPlayed: result.summary.roundsPlayed,
    stepCount: result.summary.stepCount,
    commandCount: result.summary.commandCount,
    eventCount: result.summary.eventCount,
    finalGems: result.summary.finalGems,
    finalScores: result.summary.finalScores,
    passCount: result.summary.passCount,
    roundsResolved: result.summary.roundsResolved,
    promptsResolved: result.summary.promptsResolved,
    averageLegalMoves: result.summary.averageLegalMoves,
  }),
});
