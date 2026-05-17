import { describe, expect, it } from "vitest";

import { legalHeuristicPolicyV1 } from "@/game/ai";
import {
  runHeadlessMatchSimulation,
  runHeadlessSimulationBatch,
} from "@/game/sim";

describe("headless decision trace mining", () => {
  it("does not collect decision traces by default", () => {
    const result = runHeadlessMatchSimulation({
      seed: "cFp34-default-trace-boundary",
      maxSteps: 40,
      policies: { seat_a: legalHeuristicPolicyV1 },
    });

    expect(result.decisionTraces).toBeUndefined();
  });

  it("collects legal-heuristic-v1 traces only when explicitly requested", () => {
    const result = runHeadlessMatchSimulation({
      seed: "cFp34-trace-collection",
      maxSteps: 80,
      policies: { seat_a: legalHeuristicPolicyV1 },
      collectDecisionTraces: true,
    });

    expect(result.decisionTraces).toBeDefined();
    expect(result.decisionTraces?.length).toBeGreaterThan(0);
    expect(result.decisionTraces?.every((trace) => trace.policyId === "legal-heuristic-v1")).toBe(true);
  });

  it("keeps traced v1 simulation behavior aligned with the untraced path", () => {
    const baseInput = {
      seed: "cFp34-trace-parity",
      maxSteps: 300,
      policies: { seat_a: legalHeuristicPolicyV1 },
    } as const;

    const untraced = runHeadlessMatchSimulation(baseInput);
    const traced = runHeadlessMatchSimulation({
      ...baseInput,
      collectDecisionTraces: true,
    });

    expect(traced.summary).toEqual(untraced.summary);
    expect(traced.steps.map((step) => step.chosenMoveKind)).toEqual(
      untraced.steps.map((step) => step.chosenMoveKind),
    );
    expect(traced.steps.map((step) => step.commandType)).toEqual(
      untraced.steps.map((step) => step.commandType),
    );
  });

  it("keeps default batch output compact while allowing raw opt-in trace inspection", () => {
    const compact = runHeadlessSimulationBatch({
      seeds: ["cFp34-batch-default"],
      policies: { seat_a: legalHeuristicPolicyV1 },
    });

    expect(JSON.stringify(compact)).not.toContain("decisionTraces");

    const raw = runHeadlessSimulationBatch({
      seeds: ["cFp34-batch-traced"],
      policies: { seat_a: legalHeuristicPolicyV1 },
      collectDecisionTraces: true,
      includeRawResults: true,
    });

    expect(raw.runs[0].rawResult?.decisionTraces?.length).toBeGreaterThan(0);
  });
});
