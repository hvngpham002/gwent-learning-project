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
// Pass analysis
// ---------------------------------------------------------------------------

export interface AiDecisionPassAnalysis {
  readonly passLegal: boolean;
  readonly scoreDelta: number;
  readonly opponentHandPressure: number;
  readonly requiredLead: number;
  readonly isVoluntarilySafe: boolean;
  readonly isOpponentPassed: boolean;
  readonly isLastGem: boolean;
  readonly lastGemSurrenderAllowed: boolean;
  readonly lastGemUpperBound: number;
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
  readonly moveId: string;
}

// ---------------------------------------------------------------------------
// Candidate summaries (redacted where needed)
// ---------------------------------------------------------------------------

export interface AiDecisionCandidateSummary {
  readonly kind: AiDecisionCandidateKind;
  readonly label: string;
  readonly score: number;
  readonly targetKind: string;
  readonly targetLabel: string;
  readonly reason: string;
  // Redacted label for hidden AI hand card alternatives.
  // Only populated when the candidate originates from an unplayed AI hand
  // card whose identity must not be exposed to the human player.
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
  // Simplified upper-bound: ownScore + max unique tempo (approximate).
  // The exact upper-bound requires iterating play moves; this is a
  // diagnostic approximation using scoreDelta + ownHandCount * 50.
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

export const buildAiDecisionSelectedMove = (
  move: import("@/game/core").LegalMove,
): AiDecisionSelectedMove => ({
  kind: move.kind as AiDecisionMoveKind,
  label: move.label,
  moveId: move.moveId,
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
// Candidate redaction helper
// ---------------------------------------------------------------------------

export const redactAiHandCardLabel = (): string => "hidden hand play";
