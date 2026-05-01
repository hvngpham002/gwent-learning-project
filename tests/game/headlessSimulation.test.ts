import { describe, expect, it } from "vitest";

import type { EnginePolicy } from "@/game/ai";
import { runHeadlessMatchSimulation, replayHeadlessMatchCommands } from "@/game/sim";

describe("headless AI-vs-AI simulation", () => {
  it("completes the current AI-vs-AI match through pure engine commands", () => {
    const result = runHeadlessMatchSimulation({ seed: "sim-smoke-001" });

    expect(result.status).toBe("completed");
    expect(result.finalState.phase).toBe("game_end");
    expect(result.winner).not.toBeNull();
    expect(result.summary.stepCount).toBe(result.steps.length);
    expect(result.summary.commandCount).toBe(result.commandLog.length);
    expect(result.summary.roundsResolved).toBeGreaterThan(0);
    expect(result.commandLog.some((command) => command.type === "ChooseMulligan" && command.seatId === "seat_a")).toBe(true);
    expect(result.commandLog.some((command) => command.type === "ChooseMulligan" && command.seatId === "seat_b")).toBe(true);
    expect(result.steps.some((step) => step.chosenMoveKind === "resolve_round_end")).toBe(true);
  });

  it("is deterministic for the same seed and policies", () => {
    const first = runHeadlessMatchSimulation({ seed: "sim-smoke-001" });
    const second = runHeadlessMatchSimulation({ seed: "sim-smoke-001" });

    expect(second.winner).toBe(first.winner);
    expect(second.commandLog.map((command) => command.type)).toEqual(first.commandLog.map((command) => command.type));
    expect(JSON.stringify(second.commandLog)).toBe(JSON.stringify(first.commandLog));
    expect(second.summary).toEqual(first.summary);
  });

  it("returns a bounded max-steps result without throwing", () => {
    const result = runHeadlessMatchSimulation({ seed: "sim-smoke-001", maxSteps: 1 });

    expect(result.status).toBe("max_steps_exceeded");
    expect(result.error).toEqual(
      expect.objectContaining({
        code: "max_steps_exceeded",
        step: 1,
      }),
    );
    expect(result.finalState.phase).not.toBe("game_end");
  });

  it("returns structured policy failure when a policy throws", () => {
    const throwingPolicy: EnginePolicy = {
      id: "throwing-test-policy",
      selectMove() {
        throw new Error("policy exploded");
      },
    };

    const result = runHeadlessMatchSimulation({ seed: "sim-smoke-001", policies: { seat_a: throwingPolicy } });

    expect(result.status).toBe("policy_failed");
    expect(result.error).toEqual(
      expect.objectContaining({
        code: "policy_select_failed",
        seatId: "seat_a",
        message: "policy exploded",
      }),
    );
  });

  it("resolves prompts through policy-selected choose_prompt_option moves when they occur", () => {
    // cCp13 added a Roach copy to current-northern-realms / current-nilfgaard for
    // muster_roach visibility. The reshuffle no longer triggers a Medic prompt
    // under sim-smoke-001; sim-smoke-002 still resolves at least one Medic
    // prompt under the same legal-heuristic-v0 policy and remains part of the
    // current-smoke-v1 suite.
    const result = runHeadlessMatchSimulation({ seed: "sim-smoke-002" });

    expect(result.summary.promptsResolved).toBeGreaterThan(0);
    expect(result.steps.some((step) => step.chosenMoveKind === "choose_prompt_option")).toBe(true);
    expect(result.commandLog.some((command) => command.type === "ChoosePromptOption")).toBe(true);
  });

  it("replays the command log to the same final essentials", () => {
    const result = runHeadlessMatchSimulation({ seed: "sim-smoke-001" });
    const replayed = replayHeadlessMatchCommands({ seed: result.seed, commandLog: result.commandLog });

    expect(replayed.phase).toBe(result.finalState.phase);
    expect(replayed.seats.seat_a.gems).toBe(result.finalState.seats.seat_a.gems);
    expect(replayed.seats.seat_b.gems).toBe(result.finalState.seats.seat_b.gems);
    expect(replayed.roundHistory).toEqual(result.finalState.roundHistory);
  });

  it("keeps default step logs compact and free of observation or hidden hand arrays", () => {
    const result = runHeadlessMatchSimulation({ seed: "sim-smoke-001" });
    const logText = JSON.stringify(result.steps);

    expect(result.steps[0]).toEqual({
      step: expect.any(Number),
      phase: expect.any(String),
      round: expect.any(Number),
      seatId: expect.any(String),
      policyId: expect.any(String),
      legalMoveCount: expect.any(Number),
      chosenMoveId: expect.any(String),
      chosenMoveKind: expect.any(String),
      commandType: expect.any(String),
      eventTypes: expect.any(Array),
    });
    expect(logText).not.toContain("ownHand");
    expect(logText).not.toContain("opponentHand");
    expect(logText).not.toContain("cardsById");
    expect(logText).not.toContain("\"deck\"");
    expect(logText).not.toContain("\"hand\"");
  });
});
