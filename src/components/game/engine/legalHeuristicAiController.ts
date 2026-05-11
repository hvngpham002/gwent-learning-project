import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import {
  buildSeatObservation,
  collectV1DecisionTrace,
  commandFromLegalMove,
  getProductAiPolicy,
} from "@/game/ai";
import { getLegalMoves, type EngineCommand, type SeatId } from "@/game/core";
import type { EngineAdapterState } from "@/store/slices/engineSlice";

export interface LegalHeuristicAiResult {
  readonly command: Exclude<EngineCommand, { type: "StartMatch" }> | null;
  readonly diagnosticTrace: import("@/game/ai").AiDecisionTrace | null;
}

/**
 * cFp25: Collects the decision trace at AI decision time using the exact
 * pre-command EnginePolicyInput, before the command is dispatched.
 * Returns the command and an optional trace for v1 policy.
 */
export const getLegalHeuristicAiCommand = (
  engine: Pick<EngineAdapterState, "match" | "status" | "lock" | "commandHistory"> &
    Partial<Pick<EngineAdapterState, "runtimeCatalog" | "aiPolicyId">>,
  aiSeat: SeatId,
  humanSeat: SeatId,
): LegalHeuristicAiResult => {
  const match = engine.match;
  if (!match || match.phase === "game_end") {
    return { command: null, diagnosticTrace: null };
  }

  if (match.pendingPrompt && match.pendingPrompt.seatId === humanSeat) {
    return { command: null, diagnosticTrace: null };
  }

  const aiPromptLock = engine.lock?.kind === "prompt" && engine.lock.owner === aiSeat;
  if (engine.status !== "ready" && !(engine.status === "awaiting_prompt" && aiPromptLock)) {
    return { command: null, diagnosticTrace: null };
  }

  if (engine.lock && !aiPromptLock) {
    return { command: null, diagnosticTrace: null };
  }

  if (match.phase === "mulligan" && !match.seats[humanSeat].mulliganComplete) {
    return { command: null, diagnosticTrace: null };
  }

  if (match.phase === "playing" && match.currentTurn !== aiSeat) {
    return { command: null, diagnosticTrace: null };
  }

  if (match.phase === "round_end") {
    return { command: null, diagnosticTrace: null };
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

  // cFp25: collect trace for v1 at decision time using exact pre-command input
  let diagnosticTrace: import("@/game/ai").AiDecisionTrace | null = null;
  if (policyId === "legal-heuristic-v1" && selectedMove) {
    const decisionIndex = engine.commandHistory.length;
    const traceInput: import("@/game/ai").EnginePolicyInput = {
      seatId: aiSeat,
      observation,
      legalMoves,
    };
    diagnosticTrace = collectV1DecisionTrace(traceInput, decisionIndex);
  }

  return {
    command: selectedMove ? commandFromLegalMove(selectedMove) : null,
    diagnosticTrace,
  };
};
