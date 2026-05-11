import type { EnginePolicyInput } from "@/game/ai";
import {
  explainLegalHeuristicV1Decision,
  AI_DECISION_TRACE_SCHEMA_VERSION,
} from "@/game/ai";

/**
 * cFp25: Collects a decision trace for a v1 AI decision.
 *
 * This function does NOT mutate any game state, command queue, or engine.
 * It only builds the trace object from the exact pre-command EnginePolicyInput.
 *
 * Returns null when no move was selected or the trace schema is invalid.
 *
 * IMPORTANT: Call this with the same EnginePolicyInput that was passed to
 * `selectMove`. Do not call it with next-state inputs or for human commands.
 */
export const collectV1DecisionTrace = (
  input: EnginePolicyInput,
  decisionIndex: number,
): import("@/game/ai").AiDecisionTrace | null => {
  const explanation = explainLegalHeuristicV1Decision(input, {
    decisionIndex,
  });

  if (!explanation.move) {
    return null;
  }

  if (explanation.trace.schemaVersion !== AI_DECISION_TRACE_SCHEMA_VERSION) {
    return null;
  }

  return explanation.trace;
};
