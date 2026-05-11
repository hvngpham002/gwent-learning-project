import type {
  CatalogCardKind,
  CatalogRow,
} from "@/game/catalog";
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
  // Approximate upper-bound (policy iterates unique-card tempo; diagnostics
  // use a cheaper heuristic to avoid duplicating scoreMove).
  readonly lastGemUpperBound: number;
  readonly lastGemSurrenderAllowed: boolean;
}

// ---------------------------------------------------------------------------
// Selected move summary (hidden-info safe)
// ---------------------------------------------------------------------------

export interface AiDecisionSelectedMove {
  readonly kind: AiDecisionMoveKind;
  readonly label: string;
  readonly sourceCardName?: string;
  readonly sourceCardKind?: CatalogCardKind;
  readonly targetKind: string;
  readonly targetLabel?: string;
  readonly optionId?: string;
  readonly abilityId?: string;
  // Safe local ref instead of raw moveId (which may contain seat_a:/seat_b:)
  readonly actionRef: string;
}

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
 */
export const buildAiDecisionPassAnalysis = (
  features: AiDecisionTraceFeatures,
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
  const lastGemUpperBound =
    features.ownScore + features.opponentHandCount * 50;
  const lastGemSurrenderAllowed =
    lastGemUpperBound <= features.opponentScore;

  return {
    passLegal: true,
    scoreDelta: features.scoreDelta,
    opponentHandPressure,
    requiredLead,
    isVoluntarilySafe,
    isOpponentPassed,
    isLastGem,
    lastGemSurrenderAllowed,
    lastGemUpperBound,
  };
};

/**
 * Builds a safe selected-move summary without raw moveId (which may contain
 * seat_a:/seat_b: instance prefixes). Uses an actionRef instead.
 */
export const buildAiDecisionSelectedMove = (
  move: import("@/game/core").LegalMove,
  actionIndex: number,
): AiDecisionSelectedMove => ({
  kind: move.kind as AiDecisionMoveKind,
  label: move.label,
  actionRef: `action_${actionIndex}`,
  sourceCardName:
    "sourceCardId" in move || "sourceId" in move
      ? move.label.replace(/^Play /, "").replace(/^Use leader/, "")
      : undefined,
  sourceCardKind:
    "metadata" in move && move.metadata
      ? (move.metadata as { cardKind?: CatalogCardKind }).cardKind
      : undefined,
  targetKind: "target" in move && move.target ? move.target.kind : "none",
  targetLabel:
    "metadata" in move && move.metadata
      ? (move.metadata as { targetLabel?: string }).targetLabel
      : undefined,
  optionId: "optionId" in move ? (move as { optionId?: string }).optionId : undefined,
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
