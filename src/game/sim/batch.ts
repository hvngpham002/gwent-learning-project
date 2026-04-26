import { legalHeuristicPolicyV0 } from "@/game/ai";
import type { SeatId } from "@/game/core";

import { buildReplayDiagnostics, buildRunFingerprints } from "./diagnostics";
import { runHeadlessMatchSimulation } from "./runHeadlessMatch";
import { currentSimulationSmokeSuite, getSimulationSeedSuite } from "./seedSuites";
import type {
  HeadlessMatchSimulationResult,
  HeadlessSimulationBatchInput,
  HeadlessSimulationBatchResult,
  SimulationBatchRunRecord,
  SimulationBatchSummary,
  SimulationSeedSuite,
  SimulationTerminalStatus,
} from "./types";

const DEFAULT_MAX_STEPS = 300;
const emptyStatusCounts = (): Record<SimulationTerminalStatus, number> => ({
  completed: 0,
  max_steps_exceeded: 0,
  policy_failed: 0,
  engine_error: 0,
});

const emptySeedsByStatus = (): Record<SimulationTerminalStatus, (string | number)[]> => ({
  completed: [],
  max_steps_exceeded: [],
  policy_failed: [],
  engine_error: [],
});

const resolveSuite = (input: HeadlessSimulationBatchInput): SimulationSeedSuite | null => {
  if (input.suite) return input.suite;
  if (input.suiteId) {
    const suite = getSimulationSeedSuite(input.suiteId);
    if (!suite) {
      throw new Error(`Unknown simulation seed suite: ${input.suiteId}`);
    }
    return suite;
  }
  if (input.seeds) return null;
  return currentSimulationSmokeSuite;
};

const resolveSeeds = (input: HeadlessSimulationBatchInput, suite: SimulationSeedSuite | null) => {
  if (suite) return [...suite.seeds];
  if (input.seeds) return [...input.seeds];
  return [...currentSimulationSmokeSuite.seeds];
};

const policiesBySeat = (input: HeadlessSimulationBatchInput): Record<SeatId, string> => ({
  seat_a: input.policies?.seat_a?.id ?? legalHeuristicPolicyV0.id,
  seat_b: input.policies?.seat_b?.id ?? legalHeuristicPolicyV0.id,
});

const average = (values: readonly number[]) =>
  values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;

const toRunRecord = (
  result: HeadlessMatchSimulationResult,
  verifyReplay: boolean,
  includeRawResults: boolean,
): SimulationBatchRunRecord => {
  const record: SimulationBatchRunRecord = {
    seed: result.seed,
    matchId: result.matchId,
    status: result.status,
    winner: result.winner,
    stepCount: result.summary.stepCount,
    commandCount: result.summary.commandCount,
    eventCount: result.summary.eventCount,
    roundsResolved: result.summary.roundsResolved,
    promptsResolved: result.summary.promptsResolved,
    averageLegalMoves: result.summary.averageLegalMoves,
    finalGems: result.summary.finalGems,
    error: result.error,
    replay: buildReplayDiagnostics(result, verifyReplay),
    fingerprints: buildRunFingerprints(result),
  };

  if (includeRawResults) {
    record.rawResult = result;
  }

  return record;
};

const buildBatchSummary = ({
  suiteId,
  runs,
  policies,
}: {
  suiteId: string | null;
  runs: readonly SimulationBatchRunRecord[];
  policies: Record<SeatId, string>;
}): SimulationBatchSummary => {
  const statusCounts = emptyStatusCounts();
  const seedsByStatus = emptySeedsByStatus();
  const winnerCounts: Record<SeatId | "draw" | "none", number> = { seat_a: 0, seat_b: 0, draw: 0, none: 0 };
  const failureCodes: Record<string, number> = {};

  runs.forEach((run) => {
    statusCounts[run.status] += 1;
    seedsByStatus[run.status].push(run.seed);
    winnerCounts[run.winner ?? "none"] += 1;
    if (run.error) {
      failureCodes[run.error.code] = (failureCodes[run.error.code] ?? 0) + 1;
    }
    if (run.replay?.status === "failed") {
      failureCodes.replay_failed = (failureCodes.replay_failed ?? 0) + 1;
    }
  });

  return {
    suiteId,
    totalRuns: runs.length,
    statusCounts,
    winnerCounts,
    completionRate: runs.length === 0 ? 0 : statusCounts.completed / runs.length,
    maxStepRate: runs.length === 0 ? 0 : statusCounts.max_steps_exceeded / runs.length,
    replayCheckedCount: runs.filter((run) => run.replay?.checked).length,
    replayFailedCount: runs.filter((run) => run.replay?.status === "failed").length,
    promptRunCount: runs.filter((run) => run.promptsResolved > 0).length,
    promptResolutionCount: runs.reduce((total, run) => total + run.promptsResolved, 0),
    averageSteps: average(runs.map((run) => run.stepCount)),
    averageCommands: average(runs.map((run) => run.commandCount)),
    averageRoundsResolved: average(runs.map((run) => run.roundsResolved)),
    averageLegalMoves: average(runs.map((run) => run.averageLegalMoves)),
    policiesBySeat: policies,
    seedsByStatus,
    failureCodes,
  };
};

export const runHeadlessSimulationBatch = (
  input: HeadlessSimulationBatchInput = {},
): HeadlessSimulationBatchResult => {
  const suite = resolveSuite(input);
  const seeds = resolveSeeds(input, suite);
  if (seeds.length === 0) {
    throw new Error("Simulation batch requires at least one seed.");
  }

  const maxSteps = input.maxSteps ?? suite?.defaultMaxSteps ?? DEFAULT_MAX_STEPS;
  const verifyReplay = input.verifyReplay ?? true;
  const includeRawResults = input.includeRawResults ?? false;
  const runs = seeds.map((seed) => {
    const result = runHeadlessMatchSimulation({ seed, maxSteps, policies: input.policies });
    return toRunRecord(result, verifyReplay, includeRawResults);
  });

  return {
    suite,
    seeds,
    runs,
    summary: buildBatchSummary({ suiteId: suite?.id ?? null, runs, policies: policiesBySeat(input) }),
  };
};
