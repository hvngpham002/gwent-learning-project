import { describe, expect, it } from "vitest";

import type { EnginePolicy } from "@/game/ai";
import {
  currentSimulationSmokeSuite,
  getSimulationSeedSuite,
  runHeadlessSimulationBatch,
} from "@/game/sim";

describe("headless simulation batch", () => {
  it("uses the current smoke suite by default and returns one compact record per seed", () => {
    const batch = runHeadlessSimulationBatch();

    expect(batch.suite?.id).toBe(currentSimulationSmokeSuite.id);
    expect(batch.seeds).toEqual(currentSimulationSmokeSuite.seeds);
    expect(batch.runs).toHaveLength(currentSimulationSmokeSuite.seeds.length);
    expect(batch.summary.totalRuns).toBe(currentSimulationSmokeSuite.seeds.length);
    expect(batch.summary.suiteId).toBe(currentSimulationSmokeSuite.id);
  });

  it("completes the current smoke suite under the default max-step budget", () => {
    const batch = runHeadlessSimulationBatch({ suiteId: currentSimulationSmokeSuite.id });

    expect(batch.summary.statusCounts.completed).toBe(currentSimulationSmokeSuite.seeds.length);
    expect(batch.summary.statusCounts.max_steps_exceeded).toBe(0);
    expect(batch.summary.completionRate).toBe(1);
    expect(batch.runs.every((run) => run.status === "completed")).toBe(true);
  });

  it("is deterministic for repeated runs with the same input", () => {
    const input = { suiteId: currentSimulationSmokeSuite.id };
    const first = runHeadlessSimulationBatch(input);
    const second = runHeadlessSimulationBatch(input);

    expect(second.summary).toEqual(first.summary);
    expect(second.runs.map((run) => run.fingerprints)).toEqual(first.runs.map((run) => run.fingerprints));
  });

  it("aggregates low max-step records without throwing", () => {
    const batch = runHeadlessSimulationBatch({ seeds: ["short-001", "short-002"], maxSteps: 1 });

    expect(batch.summary.statusCounts.max_steps_exceeded).toBe(2);
    expect(batch.summary.maxStepRate).toBe(1);
    expect(batch.summary.failureCodes.max_steps_exceeded).toBe(2);
    expect(batch.summary.seedsByStatus.max_steps_exceeded).toEqual(["short-001", "short-002"]);
  });

  it("keeps policy failures per seed and continues the batch", () => {
    const throwingPolicy: EnginePolicy = {
      id: "throwing-batch-test-policy",
      selectMove() {
        throw new Error("batch policy exploded");
      },
    };

    const batch = runHeadlessSimulationBatch({
      seeds: ["policy-fail-001", "policy-fail-002"],
      policies: { seat_a: throwingPolicy },
    });

    expect(batch.summary.statusCounts.policy_failed).toBe(2);
    expect(batch.summary.failureCodes.policy_select_failed).toBe(2);
    expect(batch.runs.map((run) => run.error?.message)).toEqual(["batch policy exploded", "batch policy exploded"]);
  });

  it("runs replay diagnostics by default for completed smoke-suite runs", () => {
    const batch = runHeadlessSimulationBatch({ suiteId: currentSimulationSmokeSuite.id });

    expect(batch.summary.replayCheckedCount).toBe(currentSimulationSmokeSuite.seeds.length);
    expect(batch.summary.replayFailedCount).toBe(0);
    expect(batch.runs.every((run) => run.replay?.status === "passed")).toBe(true);
  });

  it("can skip replay diagnostics", () => {
    const batch = runHeadlessSimulationBatch({ seeds: ["no-replay-001"], verifyReplay: false });

    expect(batch.summary.replayCheckedCount).toBe(0);
    expect(batch.summary.replayFailedCount).toBe(0);
    expect(batch.runs[0].replay).toEqual({
      checked: false,
      status: "skipped",
      commandCount: batch.runs[0].commandCount,
      mismatches: [],
    });
  });

  it("keeps default batch output free of raw state, command logs, observations, hands, and deck order", () => {
    const batch = runHeadlessSimulationBatch({ seeds: ["redaction-001"] });
    const json = JSON.stringify(batch);

    expect(batch.runs[0].rawResult).toBeUndefined();
    expect(json).not.toContain("rawResult");
    expect(json).not.toContain("finalState");
    expect(json).not.toContain("commandLog");
    expect(json).not.toContain("ownHand");
    expect(json).not.toContain("opponentHand");
    expect(json).not.toContain("\"hand\"");
    expect(json).not.toContain("\"deck\"");
    expect(json).not.toContain("cardsById");
  });

  it("includes raw single-run results only when explicitly requested", () => {
    const batch = runHeadlessSimulationBatch({ seeds: ["raw-debug-001"], includeRawResults: true });

    expect(batch.runs[0].rawResult?.finalState.matchId).toBe("sim:raw-debug-001");
    expect(batch.runs[0].rawResult?.commandLog.length).toBe(batch.runs[0].commandCount);
  });

  it("resolves seed suites through the registry and throws for unknown ids or empty seed lists", () => {
    expect(getSimulationSeedSuite(currentSimulationSmokeSuite.id)).toBe(currentSimulationSmokeSuite);
    expect(getSimulationSeedSuite("missing-suite")).toBeNull();
    expect(() => runHeadlessSimulationBatch({ suiteId: "missing-suite" })).toThrow("Unknown simulation seed suite");
    expect(() => runHeadlessSimulationBatch({ seeds: [] })).toThrow("requires at least one seed");
  });
});
