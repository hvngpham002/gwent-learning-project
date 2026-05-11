import type { CatalogRow } from "@/game/catalog";
import type {
  MatchPhase,
  SeatId,
} from "@/game/core";

import type {
  EnginePolicyInput,
  ProductAiPolicyId,
} from "@/game/ai";

// ---------------------------------------------------------------------------
// Schema version
// ---------------------------------------------------------------------------

export const AI_DECISION_TRACE_SCHEMA_VERSION = "ai-decision-trace-v1";

// ---------------------------------------------------------------------------
// Public-facing shape helpers
// ---------------------------------------------------------------------------

export type AiDecisionMoveKind =
  | "pass"
  | "play_card"
  | "use_leader"
  | "choose_prompt_option"
  | "choose_mulligan"
  | "resolve_round_end";

export type AiDecisionCandidateKind =
  | "pass"
  | "play_card"
  | "use_leader"
  | "choose_prompt_option"
  | "choose_mulligan"
  | "resolve_round_end";

// ---------------------------------------------------------------------------
// Public state snapshot (hidden-info safe)
// ---------------------------------------------------------------------------

export interface AiDecisionPublicState {
  readonly seatId: SeatId;
  readonly opponentSeatId: SeatId;
  readonly phase: MatchPhase;
  readonly round: number;
  readonly currentTurn: SeatId;
  readonly ownScore: number;
  readonly opponentScore: number;
  readonly scoreDelta: number;
  readonly ownGems: number;
  readonly opponentGems: number;
  readonly ownHandCount: number;
  readonly opponentHandCount: number;
  readonly ownDeckCount: number;
  readonly opponentDeckCount: number;
  readonly ownDiscardCount: number;
  readonly opponentDiscardCount: number;
  readonly ownPassed: boolean;
  readonly opponentPassed: boolean;
  readonly boardRows: AiDecisionBoardRowSummary[];
  readonly weatherCardCount: number;
}

export interface AiDecisionBoardRowSummary {
  readonly seatId: SeatId;
  readonly row: CatalogRow;
  readonly unitCount: number;
  readonly horn: string | null;
}

// ---------------------------------------------------------------------------
// Pass analysis (mirrors legalHeuristicPolicyV1 helper values)
// ---------------------------------------------------------------------------

export interface AiDecisionPassAnalysis {
  readonly passLegal: boolean;
  // Exact values from the policy helper canVoluntarilyPassWithLead
  readonly scoreDelta: number;
  readonly opponentHandPressure: number;
  readonly requiredLead: number;
  readonly isVoluntarilySafe: boolean;
  readonly isOpponentPassed: boolean;
  readonly isLastGem: boolean;
  // Approximate upper-bound (heuristic: ownScore + opponentHandCount * 50).
  readonly diagnosticApproxUpperBound: number;
  // Policy's real last-gem upper bound (ownScore + uniqueCardTempoUpperBound).
  // lastGemSurrenderAllowed is based on this field, not on diagnosticApproxUpperBound.
  readonly policyLastGemUpperBound: number;
  readonly lastGemSurrenderAllowed: boolean;
}

// ---------------------------------------------------------------------------
// Selected move summary (hidden-info safe)
// ---------------------------------------------------------------------------

export interface AiDecisionSelectedMove {
  readonly kind: AiDecisionMoveKind;
  readonly label: string;
  // Safe local ref instead of raw moveId (which may contain seat_a:/seat_b:)
  readonly actionRef: string;
  readonly targetKind: string;
  readonly targetLabel?: string;
  // Safe local ref for prompt options. Never derived from raw optionId, which
  // may contain hidden engine/card identifiers.
  readonly optionRef?: string;
  readonly abilityId?: string;
}

// ---------------------------------------------------------------------------
// Candidate summaries (fully redacted for hidden AI hand)
// ---------------------------------------------------------------------------

/**
 * Returns a hidden-info-safe label for a selected move.
 *
 * Move labels from the engine (e.g. "Play Spy") may contain card names that
 * expose the AI's hidden hand. This helper replaces them with generic labels
 * derived from the move kind.
 *
 * For choose_mulligan the label is "mulligan hidden card" when there are
 * card IDs to mulligan, or "keep hand" when keeping the current hand.
 *
 * For choose_prompt_option the label is "resolve prompt option" since prompt
 * option IDs are prompt-local identifiers (e.g. "medic-revive", "clear-weather")
 * that could still reveal internal engine structure.
 *
 * @param move - The legal move to label.
 */
export const safeSelectedMoveLabel = (
  move: import("@/game/core").LegalMove,
): string => {
  switch (move.kind) {
    case "play_card":
      return "hidden hand play";
    case "choose_mulligan": {
      const cast = move as { cardIds?: unknown[] };
      if (Array.isArray(cast.cardIds) && cast.cardIds.length > 0) {
        return "mulligan hidden card";
      }
      return "keep hand";
    }
    case "choose_prompt_option":
      return "resolve prompt option";
    case "use_leader":
      return "use leader";
    case "pass":
      return "pass";
    case "resolve_round_end":
      return "resolve round end";
    default:
      return String((move as { kind: string }).kind);
  }
};

// ---------------------------------------------------------------------------
// Candidate summaries (fully redacted for hidden AI hand)
// ---------------------------------------------------------------------------

export interface AiDecisionCandidateSummary {
  readonly kind: AiDecisionCandidateKind;
  // Generic label — never a card name for AI-hand candidates
  readonly label: string;
  readonly score: number;
  readonly targetKind: string;
  readonly targetLabel: string;
  // Human-readable reason (e.g. "best tempo", "spy bonus")
  readonly reason: string;
  // Always "hidden hand play" for any candidate originating from the AI's
  // hidden hand. Only public targets (board cards, weather, etc.) show a
  // real target label.
  readonly cardLabel: string;
}

// ---------------------------------------------------------------------------
// Top-level trace
// ---------------------------------------------------------------------------

export interface AiDecisionTrace {
  readonly schemaVersion: typeof AI_DECISION_TRACE_SCHEMA_VERSION;
  readonly policyId: ProductAiPolicyId | "legal-first-v0" | string;
  readonly seatId: SeatId;
  readonly decisionIndex: number;
  readonly phase: string;
  readonly round: number;
  readonly publicState: AiDecisionPublicState;
  readonly passAnalysis: AiDecisionPassAnalysis | null;
  readonly selected: AiDecisionSelectedMove | null;
  readonly candidates: AiDecisionCandidateSummary[];
  // Distinguishes exact-policy reasoning ("policy-...") from diagnostics
  // that use approximate helpers (e.g. "last-gem-estimate").
  readonly reasonKind: string;
  readonly reason: string;
}

// ---------------------------------------------------------------------------
// V1 explanation helper return type
// ---------------------------------------------------------------------------

export interface AiDecisionExplanation {
  readonly move: import("@/game/core").LegalMove | null;
  readonly trace: AiDecisionTrace;
}

// ---------------------------------------------------------------------------
// Internal feature snapshot for trace building
// ---------------------------------------------------------------------------

export interface AiDecisionTraceFeatures {
  readonly scoreDelta: number;
  readonly ownGems: number;
  readonly opponentGems: number;
  readonly ownHandCount: number;
  readonly opponentHandCount: number;
  readonly ownDeckCount: number;
  readonly opponentDeckCount: number;
  readonly ownDiscardCount: number;
  readonly opponentDiscardCount: number;
  readonly ownPassed: boolean;
  readonly opponentPassed: boolean;
  readonly ownScore: number;
  readonly opponentScore: number;
}

// ---------------------------------------------------------------------------
// Trace builders
// ---------------------------------------------------------------------------

export const buildAiDecisionPublicState = (
  input: EnginePolicyInput,
): AiDecisionPublicState => ({
  seatId: input.seatId,
  opponentSeatId: input.observation.opponentSeatId,
  phase: input.observation.phase,
  round: input.observation.round,
  currentTurn: input.observation.currentTurn,
  ownScore: input.observation.score.totalBySeat[input.seatId],
  opponentScore: input.observation.score.totalBySeat[input.observation.opponentSeatId],
  scoreDelta:
    input.observation.score.totalBySeat[input.seatId] -
    input.observation.score.totalBySeat[input.observation.opponentSeatId],
  ownGems: input.observation.ownGems,
  opponentGems: input.observation.opponentGems,
  ownHandCount: input.observation.ownHand.length,
  opponentHandCount: input.observation.opponentHandCount,
  ownDeckCount: input.observation.ownDeckCount,
  opponentDeckCount: input.observation.opponentDeckCount,
  ownDiscardCount: input.observation.ownDiscardCount,
  opponentDiscardCount: input.observation.opponentDiscardCount,
  ownPassed: input.observation.ownPassed,
  opponentPassed: input.observation.opponentPassed,
  boardRows: input.observation.boardRows.map((row) => ({
    seatId: row.seatId,
    row: row.row,
    unitCount: row.units.length,
    horn: row.horn?.sourceId ?? null,
  })),
  weatherCardCount: input.observation.weather.length,
});

/**
 * Builds pass analysis using the same logic the v1 policy uses:
 * estimateOpponentHandPressure (6/8 per card) and canVoluntarilyPassWithLead.
 *
 * @param policyLastGemUpperBound - The real v1 policy upper bound
 *   (ownScore + uniqueCardTempoUpperBound). Used for lastGemSurrenderAllowed.
 */
export const buildAiDecisionPassAnalysis = (
  features: AiDecisionTraceFeatures,
  policyLastGemUpperBound?: number,
): AiDecisionPassAnalysis => {
  const perCardPressure = features.ownGems <= 1 ? 8 : 6;
  const opponentHandPressure = features.opponentHandCount * perCardPressure;
  const requiredLead = Math.max(
    features.ownGems <= 1 ? 36 : 24,
    opponentHandPressure,
  );
  const isVoluntarilySafe =
    features.scoreDelta > requiredLead && !features.opponentPassed;
  const isOpponentPassed = features.opponentPassed;
  const isLastGem = features.ownGems <= 1;
  // Approximate diagnostic upper bound (heuristic: ownScore + opponentHandCount * 50).
  const diagnosticApproxUpperBound =
    features.ownScore + features.opponentHandCount * 50;
  // Policy's real last-gem upper bound — based on unique-card tempo, not a heuristic.
  const effectiveUpperBound = policyLastGemUpperBound ?? diagnosticApproxUpperBound;
  const lastGemSurrenderAllowed =
    effectiveUpperBound <= features.opponentScore;

  return {
    passLegal: true,
    scoreDelta: features.scoreDelta,
    opponentHandPressure,
    requiredLead,
    isVoluntarilySafe,
    isOpponentPassed,
    isLastGem,
    diagnosticApproxUpperBound,
    policyLastGemUpperBound: policyLastGemUpperBound ?? diagnosticApproxUpperBound,
    lastGemSurrenderAllowed,
  };
};

/**
 * Builds a safe selected-move summary without raw moveId (which may contain
 * seat_a:/seat_b: instance prefixes). Uses an actionRef instead.
 *
 * CRITICAL: sourceCardName and sourceCardKind are deliberately omitted to
 * prevent leaking the AI's hidden hand card identities to the human player.
 * The label is also redacted via safeSelectedMoveLabel to avoid leaking card
 * names from the AI's hidden hand.
 */
export const buildAiDecisionSelectedMove = (
  move: import("@/game/core").LegalMove,
  actionIndex: number,
): AiDecisionSelectedMove => ({
  kind: move.kind as AiDecisionMoveKind,
  label: safeSelectedMoveLabel(move),
  actionRef: `action_${actionIndex}`,
  targetKind: "target" in move && move.target ? move.target.kind : "none",
  targetLabel:
    "metadata" in move && move.metadata
      ? (move.metadata as { targetLabel?: string }).targetLabel
      : undefined,
  optionRef:
    move.kind === "choose_prompt_option"
      ? `option_${actionIndex}`
      : undefined,
  abilityId:
    "metadata" in move && move.metadata
      ? (move.metadata as { abilityId?: string }).abilityId
      : undefined,
});

// ---------------------------------------------------------------------------
// Candidate builder
// ---------------------------------------------------------------------------

export const buildAiDecisionCandidateSummary = (
  kind: AiDecisionCandidateKind,
  label: string,
  score: number,
  targetKind: string,
  targetLabel: string,
  reason: string,
  cardLabel: string,
): AiDecisionCandidateSummary => ({
  kind,
  label,
  score,
  targetKind,
  targetLabel,
  reason,
  cardLabel,
});

// ---------------------------------------------------------------------------
// Candidate redaction: always "hidden hand play" for AI hand candidates
// ---------------------------------------------------------------------------

export const redactAiHandCardLabel = (): string => "hidden hand play";

// ---------------------------------------------------------------------------
// Candidate builder
// ---------------------------------------------------------------------------
