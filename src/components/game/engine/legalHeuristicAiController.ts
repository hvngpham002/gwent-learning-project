import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import {
  buildSeatObservation,
  commandFromLegalMove,
  legalHeuristicPolicyV0,
} from "@/game/ai";
import { getLegalMoves, type EngineCommand, type SeatId } from "@/game/core";
import type { EngineAdapterState } from "@/store/slices/engineSlice";

export const getLegalHeuristicAiCommand = (
  engine: Pick<EngineAdapterState, "match" | "status" | "lock">,
  aiSeat: SeatId,
  humanSeat: SeatId,
): Exclude<EngineCommand, { type: "StartMatch" }> | null => {
  const match = engine.match;
  if (!match || match.phase === "game_end") {
    return null;
  }

  if (match.pendingPrompt && match.pendingPrompt.seatId === humanSeat) {
    return null;
  }

  const aiPromptLock = engine.lock?.kind === "prompt" && engine.lock.owner === aiSeat;
  if (engine.status !== "ready" && !(engine.status === "awaiting_prompt" && aiPromptLock)) {
    return null;
  }

  if (engine.lock && !aiPromptLock) {
    return null;
  }

  if (match.phase === "mulligan" && !match.seats[humanSeat].mulliganComplete) {
    return null;
  }

  if (match.phase === "playing" && match.currentTurn !== aiSeat) {
    return null;
  }

  if (match.phase === "round_end") {
    return null;
  }

  const legalMoves = getLegalMoves({
    state: match,
    seatId: aiSeat,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });
  const observation = buildSeatObservation({
    state: match,
    seatId: aiSeat,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });
  const selectedMove = legalHeuristicPolicyV0.selectMove({ seatId: aiSeat, observation, legalMoves });

  return selectedMove ? commandFromLegalMove(selectedMove) : null;
};
