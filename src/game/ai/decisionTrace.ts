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
  // cFp26.1: Pass decision diagnostics
  readonly ownWinsTiedRound: boolean;
  readonly minimumScoreToWinRound: number;
  readonly policyUpperBoundCanWinRound: boolean;
  readonly hasSingleMoveCatchUp: boolean;
  readonly bestSingleMoveCatchUpScore: number | null;
  readonly bestSingleMoveCatchUpTempo: number | null;
  readonly bestSingleMoveCatchUpKind: "play_card" | "use_leader" | null;
  readonly preserveHandPassRecommended: boolean;
}

// ---------------------------------------------------------------------------
// Mulligan analysis (hidden-info safe)
// ---------------------------------------------------------------------------

export type AiDecisionMulliganReasonKind =
  | "linked_payload"
  | "muster_duplicate"
  | "low_standalone_unit"
  | "keep_hand"
  | "unknown";

export type AiDecisionMulliganValueBucket = "low" | "medium" | "high";

export interface AiDecisionMulliganAnalysis {
  readonly mulliganLegal: boolean;
  readonly selectedCardCount: number;
  readonly candidateCount: number;
  readonly selectedReasonKind: AiDecisionMulliganReasonKind;
  readonly selectedConfidence: number | null;
  readonly selectedStandaloneValueBucket: AiDecisionMulliganValueBucket | null;
  readonly topCandidateConfidence: number | null;
  readonly topCandidateReasonKind: AiDecisionMulliganReasonKind | null;
}

/**
 * Maps internal mulligan reason kind to the broader exported reason kind.
 */
export const toMulliganReasonKind = (
  reasonKind: string,
): AiDecisionMulliganReasonKind => {
  switch (reasonKind) {
    case "linked_roach_payload":
    case "one_way_linked_payload":
      return "linked_payload";
    case "same_source_muster_duplicate":
      return "muster_duplicate";
    case "low_standalone_unit":
      return "low_standalone_unit";
    case "keep_hand":
      return "keep_hand";
    default:
      return "unknown";
  }
};

/**
 * Maps standalone value to a bucket label.
 */
export const toMulliganValueBucket = (
  value: number,
): AiDecisionMulliganValueBucket => {
  if (value < 80) return "low";
  if (value < 180) return "medium";
  return "high";
};

// ---------------------------------------------------------------------------
// Hand-shape analysis (hidden-info safe aggregate diagnostics)
// ---------------------------------------------------------------------------

/**
 * Quality bucket for the remaining hand's future-round viability.
 */
export type AiDecisionHandQuality =
  | "empty"
  | "poor"
  | "thin"
  | "healthy";

/**
 * Bucketized maximum positive tempo for a category of moves.
 */
export type AiDecisionTempoBucket =
  | "none"
  | "low"
  | "medium"
  | "high";

/**
 * Bucketizes a positive tempo value (or null/negative) into a bucket label.
 */
export const toAiDecisionTempoBucket = (
  value: number | null,
): AiDecisionTempoBucket => {
  if (value == null || value <= 0) return "none";
  if (value <= 5) return "low";
  if (value <= 10) return "medium";
  return "high";
};

/**
 * Classifies the remaining hand's future-round viability.
 * Uses unit tempo count (unit + hero cards) to classify quality.
 */
export const classifyFutureRoundHandQuality = (
  unitCardCount: number,
  totalHandCount: number,
): AiDecisionHandQuality => {
  if (totalHandCount === 0) return "empty";
  if (unitCardCount === 0) return "poor";
  if (unitCardCount === 1 && totalHandCount >= 3) return "thin";
  return "healthy";
};

// ---------------------------------------------------------------------------
// cFp28: Pass safety buffer helpers (shared between policy and explanation)
// ---------------------------------------------------------------------------

/**
 * Extra buffer required for voluntary pass when future hand quality is poor.
 */
export const EXTRA_BUFFER_POOR = 18;

/**
 * Extra buffer required for voluntary pass when future hand quality is thin.
 */
export const EXTRA_BUFFER_THIN = 10;

/**
 * Returns the extra pass-safety buffer required for a given hand quality.
 * Shared between legalHeuristicPolicyV1 and explainLegalHeuristicV1Decision
 * to avoid duplicated threshold constants.
 */
export const getFutureHandExtraBuffer = (
  quality: AiDecisionHandQuality,
): number => {
  switch (quality) {
    case "poor":
      return EXTRA_BUFFER_POOR;
    case "thin":
      return EXTRA_BUFFER_THIN;
    default:
      return 0;
  }
};

/**
 * Hidden-info-safe aggregate hand-shape analysis.
 * Uses only broad counts and buckets — never card names, source IDs,
 * instance IDs, cardIds, linkedSourceIds, or ability arrays.
 */
export interface AiDecisionHandShapeAnalysis {
  readonly unitCardCount: number;
  readonly heroCardCount: number;
  readonly specialOrWeatherCardCount: number;
  readonly totalHandCount: number;
  readonly positiveUnitMoveCount: number;
  readonly positiveNonUnitMoveCount: number;
  readonly bestUnitTempoBucket: AiDecisionTempoBucket;
  readonly bestNonUnitTempoBucket: AiDecisionTempoBucket;
  readonly futureRoundHandQuality: AiDecisionHandQuality;
  readonly specialOnlyHand: boolean;
  readonly noUnitFutureRisk: boolean;
}

/**
 * Builds a hand-shape analysis from observation-level data.
 *
 * @param ownHand - The AI's own hand (SeatCardSummary[])
 * @param scoredCandidates - Scored play/leader candidates with tempo info
 */
export const buildAiDecisionHandShapeAnalysis = (
  ownHand: readonly { kind: string }[],
  scoredCandidates: readonly {
    tempo: number;
    isUnitMove: boolean;
    score: number;
  }[],
): AiDecisionHandShapeAnalysis => {
  const unitCardCount = ownHand.filter(
    (c) => c.kind === "unit",
  ).length;
  const heroCardCount = ownHand.filter((c) => c.kind === "hero").length;
  const specialOrWeatherCardCount = ownHand.filter(
    (c) => c.kind === "special",
  ).length;
  const totalHandCount = ownHand.length;

  const positiveMoves = scoredCandidates.filter((m) => m.score > 0);
  const positiveUnitMoves = positiveMoves.filter((m) => m.isUnitMove);
  const positiveNonUnitMoves = positiveMoves.filter((m) => !m.isUnitMove);

  const bestUnitTempo = positiveUnitMoves.reduce(
    (max, m) => Math.max(max, m.tempo),
    0,
  );
  const bestNonUnitTempo = positiveNonUnitMoves.reduce(
    (max, m) => Math.max(max, m.tempo),
    0,
  );

  // Heroes contribute unit-tempo for future-round viability.
  const unitTempoCardCount = unitCardCount + heroCardCount;

  const futureRoundHandQuality = classifyFutureRoundHandQuality(
    unitTempoCardCount,
    totalHandCount,
  );

  return {
    unitCardCount,
    heroCardCount,
    specialOrWeatherCardCount,
    totalHandCount,
    positiveUnitMoveCount: positiveUnitMoves.length,
    positiveNonUnitMoveCount: positiveNonUnitMoves.length,
    bestUnitTempoBucket: toAiDecisionTempoBucket(bestUnitTempo),
    bestNonUnitTempoBucket: toAiDecisionTempoBucket(bestNonUnitTempo),
    futureRoundHandQuality,
    specialOnlyHand:
      totalHandCount > 0 &&
      unitCardCount === 0 &&
      heroCardCount === 0 &&
      specialOrWeatherCardCount === totalHandCount,
    noUnitFutureRisk: unitTempoCardCount === 0 && totalHandCount > 0,
  };
};

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
// Medic timing analysis (cFp29: hidden-info-safe aggregate diagnostics)
// ---------------------------------------------------------------------------

export type AiDecisionMedicTimingBucket =
  | "none"
  | "weak"
  | "medium"
  | "strong";

export interface AiDecisionMedicTimingAnalysis {
  readonly medicPlayLegal: boolean;
  readonly medicPlayCandidateCount: number;
  readonly ownDiscardReviveCandidateCount: number;
  readonly bestReviveStrengthBucket: AiDecisionTempoBucket;
  readonly bestReviveValueBucket: AiDecisionMedicTimingBucket;
  readonly noTargetMedicRisk: boolean;
  readonly selectedMedicWithNoTarget: boolean;
}

// ---------------------------------------------------------------------------
// Weather placement analysis (cFp30: hidden-info-safe aggregate diagnostics)
// ---------------------------------------------------------------------------

export type AiDecisionWeatherPlacementStrengthBucket =
  | "none"
  | "low"
  | "medium"
  | "high";

export interface AiDecisionWeatherPlacementAnalysis {
  readonly selectedMoveIntoWeatheredRow: boolean;
  readonly selectedMoveSide: "own" | "opponent" | "none";
  readonly selectedMoveRow: CatalogRow | "none";
  readonly selectedPrintedStrengthBucket: AiDecisionWeatherPlacementStrengthBucket;
  readonly selectedEffectiveStrengthBucket: AiDecisionWeatherPlacementStrengthBucket;
  readonly ownWeatheredRows: CatalogRow[];
  readonly opponentWeatheredRows: CatalogRow[];
  readonly candidateWeatheredOwnRowPlayCount: number;
  readonly candidateWeatheredOpponentRowPlayCount: number;
}

// ---------------------------------------------------------------------------
// Round investment analysis (cFp31: hidden-info-safe aggregate diagnostics)
// ---------------------------------------------------------------------------

export type AiDecisionRoundInvestmentRisk =
  | "none"
  | "watch"
  | "high"
  | "critical";

export type AiDecisionRoundInvestmentRecommendation =
  | "none"
  | "preserve_future_hand"
  | "sacrifice_round"
  | "fight_last_gem"
  | "continue";

export interface AiDecisionRoundInvestmentAnalysis {
  readonly ownBoardUnitCount: number;
  readonly ownBoardHeroCount: number;
  readonly ownBoardNonHeroUnitCount: number;
  readonly ownBoardHornCount: number;
  readonly ownBoardCardCount: number;
  readonly positiveFutureUnitMoveCount: number;
  readonly positiveFutureNonUnitMoveCount: number;
  readonly futureRoundHandQuality: AiDecisionHandQuality;
  readonly currentRoundHandCount: number;
  readonly estimatedHandCountAfterSelectedMove: number;
  readonly selectedMoveSpendsHandCard: boolean;
  readonly selectedMoveIsCardAdvantage: boolean;
  readonly selectedMoveWouldLeaveNoPositiveUnitMove: boolean;
  readonly selectedMoveWouldLeaveNoUnitTempoCard: boolean;
  readonly nonEliminationRound: boolean;
  readonly scoreDelta: number;
  readonly risk: AiDecisionRoundInvestmentRisk;
  readonly recommendation: AiDecisionRoundInvestmentRecommendation;
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
  readonly mulliganAnalysis: AiDecisionMulliganAnalysis | null;
  readonly handShapeAnalysis: AiDecisionHandShapeAnalysis | null;
  readonly medicTimingAnalysis: AiDecisionMedicTimingAnalysis | null;
  readonly weatherPlacementAnalysis: AiDecisionWeatherPlacementAnalysis | null;
  readonly roundInvestmentAnalysis: AiDecisionRoundInvestmentAnalysis | null;
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
 * cFp26.1 pass decision diagnostics (subset used by trace builder).
 */
export interface AiDecisionPassDiagnosticsInput {
  readonly ownWinsTiedRound: boolean;
  readonly minimumScoreToWinRound: number;
  readonly policyUpperBoundCanWinRound: boolean;
  readonly hasSingleMoveCatchUp: boolean;
  readonly bestSingleMoveCatchUpScore: number | null;
  readonly bestSingleMoveCatchUpTempo: number | null;
  readonly bestSingleMoveCatchUpKind: "play_card" | "use_leader" | null;
  readonly preserveHandPassRecommended: boolean;
}

/**
 * Builds pass analysis using the same logic the v1 policy uses:
 * estimateOpponentHandPressure (6/8 per card) and canVoluntarilyPassWithLead.
 *
 * @param policyLastGemUpperBound - The real v1 policy upper bound
 *   (ownScore + uniqueCardTempoUpperBound). Used for lastGemSurrenderAllowed.
 * @param passDiagnostics - cFp26.1 optional pass decision diagnostics.
 */
export const buildAiDecisionPassAnalysis = (
  features: AiDecisionTraceFeatures,
  policyLastGemUpperBound?: number,
  passDiagnostics?: AiDecisionPassDiagnosticsInput,
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
  const effectiveMinimumScoreToWinRound = passDiagnostics?.minimumScoreToWinRound ?? (features.opponentScore + 1);
  const lastGemSurrenderAllowed = passDiagnostics
    ? effectiveUpperBound < effectiveMinimumScoreToWinRound
    : effectiveUpperBound <= features.opponentScore;

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
    // cFp26.1: Pass decision diagnostics with safe defaults
    ownWinsTiedRound: passDiagnostics?.ownWinsTiedRound ?? false,
    minimumScoreToWinRound: passDiagnostics?.minimumScoreToWinRound ?? features.opponentScore + 1,
    policyUpperBoundCanWinRound: passDiagnostics?.policyUpperBoundCanWinRound ?? false,
    hasSingleMoveCatchUp: passDiagnostics?.hasSingleMoveCatchUp ?? false,
    bestSingleMoveCatchUpScore: passDiagnostics?.bestSingleMoveCatchUpScore ?? null,
    bestSingleMoveCatchUpTempo: passDiagnostics?.bestSingleMoveCatchUpTempo ?? null,
    bestSingleMoveCatchUpKind: passDiagnostics?.bestSingleMoveCatchUpKind ?? null,
    preserveHandPassRecommended: passDiagnostics?.preserveHandPassRecommended ?? false,
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
// Mulligan analysis builder
// ---------------------------------------------------------------------------

/**
 * Input shape for mulligan analysis builder. Consumed by
 * explainLegalHeuristicV1Decision to build a hidden-info-safe
 * AiDecisionMulliganAnalysis from the shared ranker output.
 */
export interface AiDecisionMulliganAnalysisInput {
  readonly mulliganLegal: boolean;
  readonly selectedCardCount: number;
  readonly candidateCount: number;
  readonly selectedReasonKind: string;
  readonly selectedConfidence: number | null;
  readonly selectedStandaloneValue: number | null;
  readonly topCandidateConfidence: number | null;
  readonly topCandidateReasonKind: string | null;
}

export const toWeatherStrengthBucket = (
  value: number,
): AiDecisionWeatherPlacementStrengthBucket => {
  if (value <= 0) return "none";
  if (value <= 3) return "low";
  if (value <= 7) return "medium";
  return "high";
};

export const buildAiDecisionMulliganAnalysis = (
  input: AiDecisionMulliganAnalysisInput,
): AiDecisionMulliganAnalysis => ({
  mulliganLegal: input.mulliganLegal,
  selectedCardCount: input.selectedCardCount,
  candidateCount: input.candidateCount,
  selectedReasonKind: toMulliganReasonKind(input.selectedReasonKind),
  selectedConfidence: input.selectedConfidence,
  selectedStandaloneValueBucket:
    input.selectedStandaloneValue !== null
      ? toMulliganValueBucket(input.selectedStandaloneValue)
      : null,
  topCandidateConfidence: input.topCandidateConfidence,
  topCandidateReasonKind:
    input.topCandidateReasonKind !== null
      ? toMulliganReasonKind(input.topCandidateReasonKind)
      : null,
});
