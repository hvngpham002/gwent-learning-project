import type { EnginePolicyInput } from "@/game/ai";
import {
  explainLegalHeuristicV1Decision,
  AI_DECISION_TRACE_SCHEMA_VERSION,
} from "@/game/ai";

/**
 * cFp25: Collects a decision trace for a v1 AI decision.
 *
 * This function does NOT mutate any game state, command queue, or engine.
 * It only builds the trace object. The caller (product match screen) is
 * responsible for dispatching the trace to Redux.
 *
 * Returns null when the policy is not v1 or when no move was selected.
 */
export const collectV1DecisionTrace = (
  input: EnginePolicyInput,
  decisionIndex: number,
): import("@/game/ai").AiDecisionTrace | null => {
  const explanation = explainLegalHeuristicV1Decision(input, {
    decisionIndex,
  });

  if (!explanation.move || explanation.move.moveId === "__none__") {
    return null;
  }

  // Verify policy parity: explanation must return the same move.
  if (explanation.trace.schemaVersion !== AI_DECISION_TRACE_SCHEMA_VERSION) {
    return null;
  }

  return explanation.trace;
};
