import type { LegalMove } from "@/game/core";

import {
  buildAiDecisionCandidateSummary,
  buildAiDecisionPublicState,
  buildAiDecisionPassAnalysis,
  buildAiDecisionSelectedMove,
  redactAiHandCardLabel,
  AI_DECISION_TRACE_SCHEMA_VERSION,
  type EnginePolicyInput,
  type AiDecisionExplanation,
  type AiDecisionTraceFeatures,
} from "@/game/ai";

import {
  buildLegalHeuristicV1Features,
  scoreMove,
  scoreLeaderMove,
  legalHeuristicPolicyV1,
  type LegalHeuristicV1Features,
} from "@/game/ai";

// Internal feature snapshot for trace building - mirrors LegalHeuristicV1Features
// but extracts only the fields needed for diagnostics.
const buildTraceFeatures = (
  features: LegalHeuristicV1Features,
): AiDecisionTraceFeatures => ({
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
});

// Build candidate summaries for diagnostic output.
// Redacts hidden AI hand card names for unplayed hand alternatives.
const buildCandidateSummaries = (
  features: LegalHeuristicV1Features,
): Array<{
  move: LegalMove;
  score: number;
  label: string;
  cardLabel: string;
}> => {
  const candidates: Array<{
    move: LegalMove;
    score: number;
    label: string;
    cardLabel: string;
  }> = [];

  // Pass candidate
  if (features.passMove) {
    candidates.push({
      move: features.passMove,
      score: 0,
      label: "Pass",
      cardLabel: "pass",
    });
  }

  // Play move candidates
  features.playMoves.forEach((move) => {
    const card = features.ownHandByCardId.get(move.sourceCardId);
    const cardLabel = card ? card.name : redactAiHandCardLabel();
    const score = scoreMove(features, move);
    candidates.push({
      move,
      score,
      label: move.label,
      cardLabel,
    });
  });

  // Leader move candidates
  features.leaderMoves.forEach((move) => {
    candidates.push({
      move,
      score: scoreLeaderMove(features, move),
      label: move.label,
      cardLabel: "leader",
    });
  });

  return candidates;
};

// Build trace for non-playing phases (mulligan, prompt, round_end)
const buildPhaseTrace = (
  input: EnginePolicyInput,
  decisionIndex: number,
  move: LegalMove | null,
  policyId: string,
): { trace: import("./decisionTrace").AiDecisionTrace; reason: string } => {
  const publicState = buildAiDecisionPublicState(input);
  const selected = move ? buildAiDecisionSelectedMove(move) : null;

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
      selected,
      candidates: [],
      reason,
    },
    reason,
  };
};

// Build trace for playing phase
const buildPlayingPhaseTrace = (
  features: LegalHeuristicV1Features,
  input: EnginePolicyInput,
  decisionIndex: number,
  move: LegalMove | null,
  policyId: string,
): { trace: import("./decisionTrace").AiDecisionTrace; reason: string } => {
  const traceFeatures = buildTraceFeatures(features);
  const publicState = buildAiDecisionPublicState(input);
  const passAnalysis = features.passMove
    ? buildAiDecisionPassAnalysis(traceFeatures)
    : null;
  const selected = move ? buildAiDecisionSelectedMove(move) : null;

  // Build candidates from all play/leader moves
  const candidates = buildCandidateSummaries(features);

  // Sort candidates by score descending for top-N display
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const topCandidates = sorted.slice(0, 5).map((c) => {
    const targetKind =
      "target" in c.move && c.move.target ? c.move.target.kind : "none";
    const targetLabel =
      "metadata" in c.move && c.move.metadata
        ? (c.move.metadata as { targetLabel?: string }).targetLabel ?? targetKind
        : targetKind;

    // Redact hidden card labels
    const displayLabel =
      c.move.kind === "play_card" &&
      !features.ownHandByCardId.has(c.move.sourceCardId)
        ? redactAiHandCardLabel()
        : c.cardLabel;

    return buildAiDecisionCandidateSummary(
      c.move.kind as import("./decisionTrace").AiDecisionCandidateKind,
      c.label,
      c.score,
      targetKind,
      targetLabel,
      displayLabel,
      displayLabel,
    );
  });

  // Build reason string
  let reason = "";
  if (!move || !features.passMove) {
    reason = "no legal moves or pass unavailable";
  } else if (features.opponentPassed) {
    if (features.scoreDelta > 0) {
      reason = "opponent passed and ahead — pass";
    } else {
      const bestMove = sorted[0];
      reason = bestMove
        ? `opponent passed, behind — catch-up move (score ${bestMove.score})`
        : "opponent passed, behind — no useful move, pass";
    }
  } else if (features.ownGems <= 1 && features.scoreDelta < 0) {
    const upperBound = features.ownScore + features.opponentHandCount * 50;
    if (upperBound <= features.opponentScore) {
      reason = "last gem, catch-up impossible — pass";
    } else {
      const bestMove = sorted[0];
      reason = bestMove
        ? `last gem, behind — attempt catch-up (score ${bestMove.score})`
        : "last gem, behind — no useful move";
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
      selected,
      candidates: topCandidates,
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
        selected: null,
        candidates: [],
        reason: "no legal moves available",
      },
    };
  }

  const features = buildLegalHeuristicV1Features(input);

  let phaseTrace: { trace: import("./decisionTrace").AiDecisionTrace; reason: string };

  // Determine phase and build appropriate trace
  if (
    features.promptMoves.length > 0 &&
    (move?.kind === "choose_prompt_option" || !features.passMove)
  ) {
    phaseTrace = buildPhaseTrace(input, decisionIndex, move, policyId);
  } else if (features.phase === "mulligan") {
    phaseTrace = buildPhaseTrace(input, decisionIndex, move, policyId);
  } else if (move?.kind === "resolve_round_end") {
    phaseTrace = buildPhaseTrace(input, decisionIndex, move, policyId);
  } else {
    phaseTrace = buildPlayingPhaseTrace(
      features,
      input,
      decisionIndex,
      move,
      policyId,
    );
  }

  return {
    move,
    trace: phaseTrace.trace,
  };
};
