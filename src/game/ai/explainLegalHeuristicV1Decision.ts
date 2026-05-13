import type { LegalMove } from "@/game/core";

import {
  buildAiDecisionCandidateSummary,
  buildAiDecisionMulliganAnalysis,
  buildAiDecisionPublicState,
  buildAiDecisionPassAnalysis,
  buildAiDecisionSelectedMove,
  redactAiHandCardLabel,
  AI_DECISION_TRACE_SCHEMA_VERSION,
  type EnginePolicyInput,
  type AiDecisionExplanation,
  type AiDecisionMulliganAnalysis,
  type AiDecisionPassDiagnosticsInput,
  type AiDecisionTraceFeatures,
} from "@/game/ai";

import {
  buildLegalHeuristicV1Features,
  uniqueCardTempoUpperBound,
  buildLegalHeuristicV1PassDecisionDiagnostics,
  buildMulliganAnalysis,
  scoreMove,
  scoreLeaderMove,
  legalHeuristicPolicyV1,
  type LegalHeuristicV1Features,
} from "@/game/ai";

// Build candidate summaries for diagnostic output.
// CRITICAL: ALL play_card candidates from the AI's hidden hand are fully
// redacted to "hidden hand play". The human player must never learn which
// card the AI considered playing.
const buildCandidateSummaries = (
  features: LegalHeuristicV1Features,
): import("./decisionTrace").AiDecisionCandidateSummary[] => {
  const summaries: import("./decisionTrace").AiDecisionCandidateSummary[] = [];

  // Pass candidate
  if (features.passMove) {
    summaries.push(
      buildAiDecisionCandidateSummary(
        "pass",
        "Pass",
        0,
        "none",
        "none",
        "pass",
        "pass",
      ),
    );
  }

  // Play move candidates — all AI hand cards are redacted
  features.playMoves.forEach((move) => {
    // Always redact: the AI's hand is hidden from the human player
    const cardLabel = redactAiHandCardLabel();
    const score = scoreMove(features, move);
    const targetKind =
      "target" in move && move.target ? move.target.kind : "none";
    const targetLabel =
      "metadata" in move && move.metadata
        ? (move.metadata as { targetLabel?: string }).targetLabel ?? targetKind
        : targetKind;
    // Build a brief reason from the score magnitude
    const reason = score >= 100 ? "high-value move" : score >= 0 ? "moderate move" : "low/negative value";

    summaries.push(
      buildAiDecisionCandidateSummary(
        "play_card",
        "hidden hand play",
        score,
        targetKind,
        targetLabel,
        reason,
        cardLabel,
      ),
    );
  });

  // Leader move candidates
  features.leaderMoves.forEach((move) => {
    const score = scoreLeaderMove(features, move);
    summaries.push(
      buildAiDecisionCandidateSummary(
        "use_leader",
        "Use leader",
        score,
        "none",
        "leader",
        score > 0 ? "useful leader action" : "not useful right now",
        "leader",
      ),
    );
  });

  return summaries;
};

// Alias for clarity — delegates to the policy's own implementation.
const computeV1UpperBound = uniqueCardTempoUpperBound;

// Build trace for non-playing phases (mulligan, prompt, round_end)
const buildPhaseTrace = (
  input: EnginePolicyInput,
  decisionIndex: number,
  move: LegalMove | null,
  policyId: string,
  actionIndex: number,
  mulliganAnalysis: AiDecisionMulliganAnalysis | null = null,
): { trace: import("./decisionTrace").AiDecisionTrace; reason: string } => {
  const publicState = buildAiDecisionPublicState(input);
  const selected = move ? buildAiDecisionSelectedMove(move, actionIndex) : null;

  let reason = "phase decision";
  if (move) {
    if (move.kind === "choose_mulligan") {
      reason = "mulligan selection";
    } else if (move.kind === "choose_prompt_option") {
      reason = "prompt resolution";
    } else if (move.kind === "resolve_round_end") {
      reason = "round-end resolution";
    }
  }

  return {
    trace: {
      schemaVersion: AI_DECISION_TRACE_SCHEMA_VERSION,
      policyId,
      seatId: input.seatId,
      decisionIndex,
      phase: input.observation.phase,
      round: input.observation.round,
      publicState,
      passAnalysis: null,
      mulliganAnalysis,
      selected,
      candidates: [],
      reasonKind: "phase",
      reason,
    },
    reason,
  };
};

// cFp26: check whether the selected move is a non-pass catch-up play.
// The reason text must not claim "catch-up move" when the selected move
// is actually `pass`, even if a top candidate would have been a catch-up.
const isCatchUpPlay = (move: LegalMove | null): boolean => {
  if (!move) return false;
  if (move.kind === "pass") return false;
  // A catch-up play is any non-pass, non-phase move (play_card, use_leader).
  return move.kind === "play_card" || move.kind === "use_leader";
};

// Build trace for playing phase
const buildPlayingPhaseTrace = (
  features: LegalHeuristicV1Features,
  input: EnginePolicyInput,
  decisionIndex: number,
  move: LegalMove | null,
  policyId: string,
  actionIndex: number,
): { trace: import("./decisionTrace").AiDecisionTrace; reason: string } => {
  const traceFeatures: AiDecisionTraceFeatures = {
    scoreDelta: features.scoreDelta,
    ownGems: features.ownGems,
    opponentGems: features.opponentGems,
    ownHandCount: features.ownHandCount,
    opponentHandCount: features.opponentHandCount,
    ownDeckCount: features.ownDeckCount,
    opponentDeckCount: features.opponentDeckCount,
    ownDiscardCount: features.ownDiscardCount,
    opponentDiscardCount: features.opponentDiscardCount,
    ownPassed: features.ownPassed,
    opponentPassed: features.opponentPassed,
    ownScore: features.ownScore,
    opponentScore: features.opponentScore,
  };
  // Compute the real v1 total reachable score for pass-safety diagnostics.
  const v1TempoUpperBound = computeV1UpperBound(features);
  const v1PolicyUpperBound = features.ownScore + v1TempoUpperBound;

  // cFp26.1: Compute pass decision diagnostics from policy logic
  const passDiagnostics = buildLegalHeuristicV1PassDecisionDiagnostics(features);
  const passDiagnosticsInput: AiDecisionPassDiagnosticsInput = {
    ownWinsTiedRound: passDiagnostics.ownWinsTiedRound,
    minimumScoreToWinRound: passDiagnostics.minimumScoreToWinRound,
    policyUpperBoundCanWinRound: passDiagnostics.policyUpperBoundCanWinRound,
    hasSingleMoveCatchUp: passDiagnostics.hasSingleMoveCatchUp,
    bestSingleMoveCatchUpScore: passDiagnostics.bestSingleMoveCatchUpScore,
    bestSingleMoveCatchUpTempo: passDiagnostics.bestSingleMoveCatchUpTempo,
    bestSingleMoveCatchUpKind: passDiagnostics.bestSingleMoveCatchUpKind,
    preserveHandPassRecommended: passDiagnostics.preserveHandPassRecommended,
  };

  const publicState = buildAiDecisionPublicState(input);
  const passAnalysis = features.passMove
    ? buildAiDecisionPassAnalysis(traceFeatures, v1PolicyUpperBound, passDiagnosticsInput)
    : null;
  const selected = move ? buildAiDecisionSelectedMove(move, actionIndex) : null;

  // Build candidates from all play/leader moves
  const candidates = buildCandidateSummaries(features);

  // Sort candidates by score descending for top-N display
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const topCandidates = sorted.slice(0, 5);

  // Build reason string using the same policy logic, cFp26: use the
  // *selected* move to decide whether the reason claims a catch-up.
  // cFp26.1: Distinguish preserve-hand pass from generic "no useful move".
  let reason = "";
  let reasonKind = "policy";
  if (!move || !features.passMove) {
    reason = "no legal moves or pass unavailable";
  } else if (features.opponentPassed) {
    if (features.scoreDelta > 0) {
      reason = "opponent passed and ahead — pass";
    } else {
      const bestMove = sorted[0];
      const selectedIsCatchUp = isCatchUpPlay(move);
      if (selectedIsCatchUp && bestMove) {
        reason = `opponent passed, behind — catch-up move (score ${bestMove.score})`;
      } else if (features.ownGems <= 1 && passDiagnostics.policyUpperBoundCanWinRound === false) {
        reason = "opponent passed, last gem — catch-up impossible, pass";
      } else if (passDiagnostics.preserveHandPassRecommended) {
        reason = "opponent passed, behind — no one-card catch-up; preserve hand";
      } else {
        reason = "opponent passed, behind — no useful move, pass";
      }
    }
  } else if (features.ownGems <= 1 && features.scoreDelta < 0) {
    // Use real v1 total upper bound (not the 50-per-card heuristic).
    if (passDiagnostics.policyUpperBoundCanWinRound === false) {
      reason = "last gem, catch-up impossible — pass";
      reasonKind = "policy-last-gem";
    } else {
      const bestMove = sorted[0];
      const selectedIsCatchUp = isCatchUpPlay(move);
      reason = selectedIsCatchUp && bestMove
        ? `last gem, behind — attempt catch-up (score ${bestMove.score})`
        : "last gem, behind — no useful move";
      reasonKind = "policy-last-gem";
    }
  } else if (passAnalysis && passAnalysis.isVoluntarilySafe) {
    reason = `voluntary pass safe (delta ${passAnalysis.scoreDelta}, required ${passAnalysis.requiredLead})`;
  } else {
    const bestMove = sorted[0];
    reason = bestMove
      ? `best useful move (score ${bestMove.score})`
      : "no useful move above threshold, pass";
  }

  return {
    trace: {
      schemaVersion: AI_DECISION_TRACE_SCHEMA_VERSION,
      policyId,
      seatId: input.seatId,
      decisionIndex,
      phase: input.observation.phase,
      round: input.observation.round,
      publicState,
      passAnalysis,
      mulliganAnalysis: null,
      selected,
      candidates: topCandidates,
      reasonKind,
      reason,
    },
    reason,
  };
};

/**
 * Explains a `legal-heuristic-v1` decision by returning the same move that
 * `legalHeuristicPolicyV1.selectMove` would return, plus a hidden-info-safe
 * diagnostic trace.
 *
 * Acceptance: for all focused test cases the `move` field must equal the
 * move returned by `legalHeuristicPolicyV1.selectMove(input)`.
 *
 * IMPORTANT: This function must be called with the EXACT pre-command
 * EnginePolicyInput used to select the move (same observation, same legal
 * moves). Do NOT call it with next-state inputs.
 */
export const explainLegalHeuristicV1Decision = (
  input: EnginePolicyInput,
  options?: { readonly decisionIndex?: number },
): AiDecisionExplanation => {
  const decisionIndex = options?.decisionIndex ?? 0;
  const policyId = "legal-heuristic-v1";

  // First, get the actual move using the existing policy.
  const move = legalHeuristicPolicyV1.selectMove(input);

  if (input.legalMoves.length === 0) {
    return {
      move: null,
      trace: {
        schemaVersion: AI_DECISION_TRACE_SCHEMA_VERSION,
        policyId,
        seatId: input.seatId,
        decisionIndex,
        phase: input.observation.phase,
        round: input.observation.round,
        publicState: buildAiDecisionPublicState(input),
        passAnalysis: null,
        mulliganAnalysis: null,
        selected: null,
        candidates: [],
        reasonKind: "none",
        reason: "no legal moves available",
      },
    };
  }

  const features = buildLegalHeuristicV1Features(input);

  // Determine phase and build appropriate trace
  let phaseTrace: { trace: import("./decisionTrace").AiDecisionTrace; reason: string };

  if (
    features.promptMoves.length > 0 &&
    (move?.kind === "choose_prompt_option" || !features.passMove)
  ) {
    phaseTrace = buildPhaseTrace(
      input,
      decisionIndex,
      move,
      policyId,
      decisionIndex,
    );
  } else if (features.phase === "mulligan") {
    const { candidates: mulliganCandidates, selectedMove } = buildMulliganAnalysis(features);
    const topCandidate = mulliganCandidates.length > 0 ? mulliganCandidates[0] : null;
    const isSelectedRedraw = selectedMove && selectedMove.cardIds.length > 0;
    const selectedCandidate = topCandidate ?? null;
    let mulliganReason = "keep_hand";
    let mulliganConfidence: number | null = null;
    let mulliganStandaloneValue: number | null = null;
    if (isSelectedRedraw && selectedCandidate) {
      mulliganReason = selectedCandidate.reasonKind;
      mulliganConfidence = selectedCandidate.confidence;
      mulliganStandaloneValue = selectedCandidate.standaloneValue;
    }
    const mulliganAnalysis = buildAiDecisionMulliganAnalysis({
      mulliganLegal: features.mulliganMoves.length > 0,
      selectedCardCount: selectedMove?.cardIds?.length ?? 0,
      candidateCount: mulliganCandidates.length,
      selectedReasonKind: mulliganReason,
      selectedConfidence: mulliganConfidence,
      selectedStandaloneValue: mulliganStandaloneValue,
      topCandidateConfidence: topCandidate?.confidence ?? null,
      topCandidateReasonKind: topCandidate?.reasonKind ?? null,
    });
    let mulliganTraceReason = "keep hand - no redraw target above threshold";
    if (isSelectedRedraw) {
      switch (mulliganReason) {
        case "linked_roach_payload":
        case "one_way_linked_payload":
          mulliganTraceReason = "mulligan hidden card - linked payload";
          break;
        case "same_source_muster_duplicate":
          mulliganTraceReason = "mulligan hidden card - duplicate muster payload";
          break;
        case "low_standalone_unit":
          mulliganTraceReason = "mulligan hidden card - low standalone unit";
          break;
      }
    }
    phaseTrace = buildPhaseTrace(
      input,
      decisionIndex,
      move,
      policyId,
      decisionIndex,
      mulliganAnalysis,
    );
    phaseTrace.reason = mulliganTraceReason;
    phaseTrace.trace = { ...phaseTrace.trace, reason: mulliganTraceReason };
  } else if (move?.kind === "resolve_round_end") {
    phaseTrace = buildPhaseTrace(
      input,
      decisionIndex,
      move,
      policyId,
      decisionIndex,
    );
  } else {
    phaseTrace = buildPlayingPhaseTrace(
      features,
      input,
      decisionIndex,
      move,
      policyId,
      decisionIndex,
    );
  }

  return {
    move,
    trace: phaseTrace.trace,
  };
};
