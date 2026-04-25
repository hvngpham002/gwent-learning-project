import type { EngineCommand, SeatId } from "@/game/core";
import type { EngineAdapterState } from "@/store/slices/engineSlice";

export const getScriptedPreviewAiCommand = (
  engine: Pick<EngineAdapterState, "match" | "status" | "lock">,
  aiSeat: SeatId,
  humanSeat: SeatId,
): Exclude<EngineCommand, { type: "StartMatch" }> | null => {
  const match = engine.match;
  if (!match || engine.status !== "ready" || engine.lock || match.pendingPrompt) {
    return null;
  }

  const aiState = match.seats[aiSeat];
  if (match.phase === "mulligan" && match.seats[humanSeat].mulliganComplete && !aiState.mulliganComplete) {
    return { type: "ChooseMulligan", seatId: aiSeat, cardIds: [] };
  }

  if (match.phase === "playing" && match.currentTurn === aiSeat && !aiState.passed) {
    return { type: "Pass", seatId: aiSeat };
  }

  return null;
};
