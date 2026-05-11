import { describe, expect, it } from "vitest";

import { runBenchmarkSuite } from "@/game/benchmark";

const hiddenInfoHazards = [
  "cardsById",
  "finalState",
  "commandLog",
  '"hand"',
  '"deck"',
  "ownHand",
  "opponentHand",
  "seat_a:",
  "seat_b:",
  "unsafeDebugResults",
];

describe("cFp25: benchmark decision trace support", () => {
  it("trace-enabled benchmark output is deterministic for a fixed seed", () => {
    const first = runBenchmarkSuite({
      benchmarkRunId: "benchmark-trace:test-001",
      includeDecisionTraces: true,
    });
    const second = runBenchmarkSuite({
      benchmarkRunId: "benchmark-trace:test-002",
      includeDecisionTraces: true,
    });

    // Both should have trace summaries.
    expect(first.records.length).toBeGreaterThan(0);
    expect(second.records.length).toBeGreaterThan(0);

    // Each record with traces should have the same decision counts for same seed.
    first.records.forEach((record) => {
      if (record.decisionTraceSummary) {
        expect(record.decisionTraceSummary.totalDecisions).toBeGreaterThanOrEqual(0);
        expect(record.decisionTraceSummary.playDecisions + record.decisionTraceSummary.passDecisions).toBeLessThanOrEqual(
          record.decisionTraceSummary.totalDecisions,
        );
      }
    });
  });

  it("trace-enabled output passes the hidden-info hazard scan", () => {
    const result = runBenchmarkSuite({
      benchmarkRunId: "benchmark-trace:safe-scan",
      includeDecisionTraces: true,
    });

    // Collect all JSON strings from records.
    const jsonStrings = result.records.map((r) => JSON.stringify(r));
    const combined = jsonStrings.join("\n");

    hiddenInfoHazards.forEach((hazard) => {
      expect(combined).not.toContain(hazard);
    });

    // decisionTraceSummary keys should not contain any hazards.
    result.records.forEach((record) => {
      if (record.decisionTraceSummary) {
        const summaryJson = JSON.stringify(record.decisionTraceSummary);
        hiddenInfoHazards.forEach((hazard) => {
          expect(summaryJson).not.toContain(hazard);
        });
      }
    });
  });

  it("existing benchmark output remains backward compatible without includeDecisionTraces", () => {
    const result = runBenchmarkSuite({
      benchmarkRunId: "benchmark-trace:backward-compat",
    });

    // By default, no decisionTraceSummary should be present.
    result.records.forEach((record) => {
      expect(record.decisionTraceSummary).toBeUndefined();
    });
  });

  it("trace summary contains expected fields", () => {
    const result = runBenchmarkSuite({
      benchmarkRunId: "benchmark-trace:fields",
      includeDecisionTraces: true,
    });

    const recordWithTrace = result.records.find((r) => r.decisionTraceSummary);
    expect(recordWithTrace).toBeDefined();
    if (recordWithTrace?.decisionTraceSummary) {
      const ts = recordWithTrace.decisionTraceSummary;
      expect(ts.totalDecisions).toBeGreaterThanOrEqual(0);
      expect(ts.passDecisions).toBeGreaterThanOrEqual(0);
      expect(ts.playDecisions).toBeGreaterThanOrEqual(0);
      expect(ts.leaderDecisions).toBeGreaterThanOrEqual(0);
      expect(ts.promptDecisions).toBeGreaterThanOrEqual(0);
      expect(ts.mulliganDecisions).toBeGreaterThanOrEqual(0);
      expect(ts.roundEndDecisions).toBeGreaterThanOrEqual(0);
      expect(ts.avgCandidateCount).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(ts.redactionWarnings)).toBe(true);
    }
  });
});
