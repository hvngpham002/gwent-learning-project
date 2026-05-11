import { runHeadlessMatchSimulation, type HeadlessMatchSimulationInput, type HeadlessMatchSimulationResult } from "@/game/sim";

import { buildBenchmarkDecisionTraceSummary, buildBenchmarkMatchRecord, buildBenchmarkReplayStatus, buildFailedBenchmarkMatchRecord } from "./ledger";
import { defaultBenchmarkPolicies } from "./policies";
import { benchmarkSmokeSuiteV1, getBenchmarkSuite } from "./suites";
import { buildBenchmarkSummary } from "./summaries";
import type {
  BenchmarkMatchRecord,
  BenchmarkMatchupDefinition,
  BenchmarkMatchupSeatDefinition,
  BenchmarkPolicyRegistry,
  BenchmarkRunDiagnostic,
  BenchmarkRunInput,
  BenchmarkRunResult,
  BenchmarkSeatDescriptor,
  BenchmarkSuite,
} from "./types";

const DEFAULT_MAX_STEPS = 300;

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const resolveSuite = (input: BenchmarkRunInput): BenchmarkSuite => {
  if (input.suite) return input.suite;
  if (input.suiteId) {
    const suite = getBenchmarkSuite(input.suiteId);
    if (!suite) {
      throw new Error(`Unknown benchmark suite: ${input.suiteId}`);
    }
    return suite;
  }
  return benchmarkSmokeSuiteV1;
};

const mergedPolicies = (inputPolicies: BenchmarkPolicyRegistry | undefined): BenchmarkPolicyRegistry => ({
  ...defaultBenchmarkPolicies,
  ...inputPolicies,
});

const seatDescriptor = (
  seatId: "seat_a" | "seat_b",
  seat: BenchmarkMatchupSeatDefinition,
): BenchmarkSeatDescriptor => ({
  seatId,
  policyId: seat.policyId,
  playerId: seat.playerId ?? `${seat.policyId}:${seat.deckPreset.presetId}:${seatId}`,
  faction: seat.faction,
  deckPresetId: seat.deckPreset.presetId,
});

const mirroredSeatDefinitions = (
  matchup: BenchmarkMatchupDefinition,
  mirrorIndex: 0 | 1,
): Record<"seat_a" | "seat_b", BenchmarkMatchupSeatDefinition> =>
  mirrorIndex === 0
    ? matchup.seats
    : {
        seat_a: matchup.seats.seat_b,
        seat_b: matchup.seats.seat_a,
      };

const toSimulationSeats = (
  seats: Record<"seat_a" | "seat_b", BenchmarkMatchupSeatDefinition>,
): HeadlessMatchSimulationInput["seats"] => ({
  seat_a: {
    seatId: "seat_a",
    playerId: seats.seat_a.playerId,
    controllerKind: "ai",
    faction: seats.seat_a.faction,
    deckPreset: seats.seat_a.deckPreset,
  },
  seat_b: {
    seatId: "seat_b",
    playerId: seats.seat_b.playerId,
    controllerKind: "ai",
    faction: seats.seat_b.faction,
    deckPreset: seats.seat_b.deckPreset,
  },
});

const toDescriptors = (
  seats: Record<"seat_a" | "seat_b", BenchmarkMatchupSeatDefinition>,
): Record<"seat_a" | "seat_b", BenchmarkSeatDescriptor> => ({
  seat_a: seatDescriptor("seat_a", seats.seat_a),
  seat_b: seatDescriptor("seat_b", seats.seat_b),
});

const missingPolicyIds = (
  seats: Record<"seat_a" | "seat_b", BenchmarkMatchupSeatDefinition>,
  policies: BenchmarkPolicyRegistry,
) => [seats.seat_a.policyId, seats.seat_b.policyId].filter((policyId) => !policies[policyId]);

export const runBenchmarkSuite = (input: BenchmarkRunInput = {}): BenchmarkRunResult => {
  const suite = resolveSuite(input);
  if (suite.seeds.length === 0) {
    throw new Error("Benchmark suite requires at least one seed.");
  }
  if (suite.matchups.length === 0) {
    throw new Error("Benchmark suite requires at least one matchup.");
  }

  const policies = mergedPolicies(input.policies);
  const benchmarkRunId = input.benchmarkRunId ?? `${suite.id}:default`;
  const maxSteps = input.maxSteps ?? suite.defaultMaxSteps ?? DEFAULT_MAX_STEPS;
  const records: BenchmarkMatchRecord[] = [];
  const diagnostics: BenchmarkRunDiagnostic[] = [];
  const unsafeDebugResults: HeadlessMatchSimulationResult[] = [];

  suite.matchups.forEach((matchup) => {
    const mirrorIndexes: readonly (0 | 1)[] = matchup.mirror ? [0, 1] : [0];

    suite.seeds.forEach((seed) => {
      mirrorIndexes.forEach((mirrorIndex) => {
        const seats = mirroredSeatDefinitions(matchup, mirrorIndex);
        const descriptors = toDescriptors(seats);
        const missingPolicies = missingPolicyIds(seats, policies);
        const mirrorGroupId = matchup.mirror ? `${matchup.matchupId}:${String(seed)}` : undefined;

        if (missingPolicies.length > 0) {
          const message = `Unknown benchmark policy id(s): ${missingPolicies.join(", ")}.`;
          diagnostics.push({
            suiteId: suite.id,
            matchupId: matchup.matchupId,
            seed,
            mirrorIndex,
            code: "unknown_policy",
            message,
          });
          records.push(
            buildFailedBenchmarkMatchRecord({
              benchmarkRunId,
              suiteId: suite.id,
              matchupId: matchup.matchupId,
              seed,
              mirrorGroupId,
              mirrorIndex,
              seats: descriptors,
              status: "policy_failed",
              errorCode: "unknown_policy",
              errorMessage: message,
            }),
          );
          return;
        }

        try {
          const simulationSeats = toSimulationSeats(seats);
          const result = runHeadlessMatchSimulation({
            seed,
            maxSteps,
            seats: simulationSeats,
            policies: {
              seat_a: policies[seats.seat_a.policyId],
              seat_b: policies[seats.seat_b.policyId],
            },
          });
          if (input.includeDebugResults) {
            unsafeDebugResults.push(result);
          }
          // cFp25: optional decision trace summary for benchmark investigation.
          const traceSummary = input.includeDecisionTraces
            ? buildBenchmarkDecisionTraceSummary(result.steps)
            : undefined;
          records.push(
            buildBenchmarkMatchRecord({
              benchmarkRunId,
              suiteId: suite.id,
              matchupId: matchup.matchupId,
              seed,
              mirrorGroupId,
              mirrorIndex,
              seats: descriptors,
              result,
              replayStatus: buildBenchmarkReplayStatus(result, simulationSeats),
              traceSummary,
            }),
          );
        } catch (error) {
          const message = toErrorMessage(error);
          diagnostics.push({
            suiteId: suite.id,
            matchupId: matchup.matchupId,
            seed,
            mirrorIndex,
            code: "benchmark_match_failed",
            message,
          });
          records.push(
            buildFailedBenchmarkMatchRecord({
              benchmarkRunId,
              suiteId: suite.id,
              matchupId: matchup.matchupId,
              seed,
              mirrorGroupId,
              mirrorIndex,
              seats: descriptors,
              status: "engine_error",
              errorCode: "benchmark_match_failed",
              errorMessage: message,
            }),
          );
        }
      });
    });
  });

  return {
    suite: {
      suiteId: suite.id,
      label: suite.label,
      description: suite.description,
      seedCount: suite.seeds.length,
      matchupIds: suite.matchups.map((matchup) => matchup.matchupId),
    },
    records,
    summary: buildBenchmarkSummary({ benchmarkRunId, suiteId: suite.id, records }),
    diagnostics,
    unsafeDebugResults: input.includeDebugResults ? unsafeDebugResults : undefined,
  };
};
