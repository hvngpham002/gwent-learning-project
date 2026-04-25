import { describe, expect, it } from "vitest";

import { getScriptedPreviewAiCommand } from "@/components/game/engine/scriptedPreviewAi";
import type { MatchState } from "@/game/core";
import type { EngineAdapterState } from "@/store/slices/engineSlice";
import { createInitialEngineState } from "@/store/slices/engineSlice";

const createEngine = (match: MatchState): EngineAdapterState => ({
  ...createInitialEngineState(),
  match,
  status: "ready",
});

const createMatch = (): MatchState =>
  ({
    phase: "mulligan",
    currentTurn: "seat_a",
    pendingPrompt: null,
    seats: {
      seat_a: { mulliganComplete: false, passed: false },
      seat_b: { mulliganComplete: false, passed: false },
    },
  }) as MatchState;

describe("scripted preview AI", () => {
  it("chooses zero mulligan cards exactly while AI mulligan is incomplete", () => {
    const match = createMatch();

    expect(getScriptedPreviewAiCommand(createEngine(match), "seat_b", "seat_a")).toBeNull();

    match.seats.seat_a.mulliganComplete = true;
    expect(getScriptedPreviewAiCommand(createEngine(match), "seat_b", "seat_a")).toEqual({
      type: "ChooseMulligan",
      seatId: "seat_b",
      cardIds: [],
    });

    match.seats.seat_b.mulliganComplete = true;
    expect(getScriptedPreviewAiCommand(createEngine(match), "seat_b", "seat_a")).toBeNull();
  });

  it("passes only when AI owns the playing turn and no prompt or lock blocks action", () => {
    const match = createMatch();
    match.phase = "playing";
    match.currentTurn = "seat_b";
    match.seats.seat_b.mulliganComplete = true;

    expect(getScriptedPreviewAiCommand(createEngine(match), "seat_b", "seat_a")).toEqual({ type: "Pass", seatId: "seat_b" });

    match.currentTurn = "seat_a";
    expect(getScriptedPreviewAiCommand(createEngine(match), "seat_b", "seat_a")).toBeNull();

    match.currentTurn = "seat_b";
    expect(
      getScriptedPreviewAiCommand({ ...createEngine(match), lock: { kind: "animation", sinceSequence: 1 } }, "seat_b", "seat_a"),
    ).toBeNull();
  });
});
