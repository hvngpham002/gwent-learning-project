import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import {
  buildSeatObservation,
  commandFromLegalMove,
  getProductAiPolicy,
} from "@/game/ai";
import { getLegalMoves, type EngineCommand, type SeatId } from "@/game/core";
import type { EngineAdapterState } from "@/store/slices/engineSlice";

export const getLegalHeuristicAiCommand = (
  engine: Pick<EngineAdapterState, "match" | "status" | "lock"> &
    Partial<Pick<EngineAdapterState, "runtimeCatalog" | "aiPolicyId">>,
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

  const runtimeCatalog = engine.runtimeCatalog ?? {
    cards: currentCatalogCards,
    leaders: currentCatalogLeaders,
  };

  const legalMoves = getLegalMoves({
    state: match,
    seatId: aiSeat,
    catalogCards: runtimeCatalog.cards,
    catalogLeaders: runtimeCatalog.leaders,
  });
  const observation = buildSeatObservation({
    state: match,
    seatId: aiSeat,
    catalogCards: runtimeCatalog.cards,
    catalogLeaders: runtimeCatalog.leaders,
  });

  const policyId = engine.aiPolicyId ?? "legal-heuristic-v0";
  const selectedMove = getProductAiPolicy(policyId).selectMove({
    seatId: aiSeat,
    observation,
    legalMoves,
  });

  return selectedMove ? commandFromLegalMove(selectedMove) : null;
};
