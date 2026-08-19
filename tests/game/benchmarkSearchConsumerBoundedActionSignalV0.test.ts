import { describe, expect, it } from "vitest";
import { aggregateCfp84Signals, buildCfp84Status, buildSearchConsumerBoundedActionSignalV0, meanMilli } from "@/game/benchmark";

const metrics = (overrides: Partial<Parameters<typeof buildSearchConsumerBoundedActionSignalV0>[0]> = {}) => ({ ownScore: 10, opponentScore: 5, ownHandCount: 4, opponentHandCount: 4, ownGemCount: 2, opponentGemCount: 2, phase: "playing", round: 1, terminalOutcome: "incomplete" as const, ...overrides });
const accounting = { expectedPairCount: 8, completedPairCount: 8, failedPairCount: 0, duplicateCompletedPairCount: 0, unaccountedPairCount: 0 };

describe("searchConsumerBoundedActionSignalV0", () => {
  it("uses the fixed bounded formula and transition guard", () => {
    expect(buildSearchConsumerBoundedActionSignalV0(metrics(), metrics({ ownScore: 20, ownHandCount: 3 }))).toMatchObject({ scoreSwing: 10, handSwing: -8, immediateSignal: 2 });
    expect(buildSearchConsumerBoundedActionSignalV0(metrics(), metrics({ ownScore: 100, opponentScore: 0, phase: "round_end" }))).toMatchObject({ scoreSwing: 0 });
    expect(buildSearchConsumerBoundedActionSignalV0(metrics(), metrics({ terminalOutcome: "win" }))).toMatchObject({ terminalComponent: 100 });
  });
  it("uses half-away-from-zero mean milli rounding", () => {
    expect(meanMilli(1, 2)).toBe(500);
    expect(meanMilli(-1, 2)).toBe(-500);
  });
  it("aggregates only completed signal rows", () => {
    const signal = buildSearchConsumerBoundedActionSignalV0(metrics(), metrics({ ownScore: 12 }));
    expect(aggregateCfp84Signals([signal]).immediateSignal.meanMilli).toBe(signal.immediateSignal * 1000);
  });
  it("uses the required readiness precedence", () => {
    expect(buildCfp84Status({ sourceFailed: true, rootFailed: true, accounting: { ...accounting, failedPairCount: 1 }, reconstructionFailed: true })).toBe("source_consistency_failed");
    expect(buildCfp84Status({ sourceFailed: false, rootFailed: true, accounting: { ...accounting, failedPairCount: 1 }, reconstructionFailed: true })).toBe("root_reobservation_failed");
    expect(buildCfp84Status({ sourceFailed: false, rootFailed: false, accounting: { ...accounting, failedPairCount: 1 }, reconstructionFailed: true })).toBe("evaluation_incomplete");
    expect(buildCfp84Status({ sourceFailed: false, rootFailed: false, accounting, reconstructionFailed: true })).toBe("signal_reconstruction_failed");
  });
});
