import type { LegalMove, PlayCardMove, UseLeaderMove } from "@/game/core";

import {
  buildAiDecisionCandidateSummary,
  buildAiDecisionMulliganAnalysis,
  buildAiDecisionPublicState,
  buildAiDecisionPassAnalysis,
  buildAiDecisionSelectedMove,
  getFutureHandExtraBuffer,
  redactAiHandCardLabel,
  toAiDecisionTempoBucket,
  toWeatherStrengthBucket,
  AI_DECISION_TRACE_SCHEMA_VERSION,
  type EnginePolicyInput,
  type AiDecisionExplanation,
  type AiDecisionMulliganAnalysis,
  type AiDecisionMedicTimingAnalysis,
  type AiDecisionPassDiagnosticsInput,
  type AiDecisionTraceFeatures,
  type AiDecisionWeatherPlacementAnalysis,
  type AiDecisionScoiataelFirstTurnAnalysis,
} from "@/game/ai";

import {
  buildLegalHeuristicV1HandShapeAnalysis,
  buildLegalHeuristicV1RoundInvestmentAnalysis,
  buildLegalHeuristicV1RoundInvestmentDecision,
  activeWeatherRows,
  isRowWeatheredForPolicy,
  effectivePlacedStrengthForPolicy,
} from "@/game/ai";

import {
  buildLegalHeuristicV1Features,
  uniqueCardTempoUpperBound,
  buildLegalHeuristicV1PassDecisionDiagnostics,
  buildMulliganAnalysis,
  scoreMove,
  scoreLeaderMove,
  legalHeuristicPolicyV1,
  isMedicSource,
  medicReviveCandidateValue,
  MEDIC_WEAK_TARGET_UTILITY,
  MEDIC_MEDIUM_TARGET_UTILITY,
  buildScoiataelFirstTurnChoiceDecision,
  isOwnWeatheredLowTempoUnitPlacement,
  shouldExemptFromWeatheredLowTempoPenalty,
  hasClearlyBetterNonWeatheredLine,
  isNoTargetMedicSourcePlay,
  hasUsefulNonMedicLine,
  shouldApplyNoTargetMedicDelayPenalty,
  type LegalHeuristicV1Features,
} from "@/game/ai";

// cFp30: Build hidden-info-safe Weather placement analysis
const buildWeatherPlacementAnalysis = (
  features: LegalHeuristicV1Features,
  move: import("@/game/core").LegalMove | null,
): AiDecisionWeatherPlacementAnalysis | null => {
  const weatheredRows = activeWeatherRows(features);
  const weatheredRowsArr = [...weatheredRows].sort();

  // Determine selected move weather info
  let selectedMoveIntoWeatheredRow = false;
  let selectedMoveSide: "own" | "opponent" | "none" = "none";
  let selectedMoveRow: import("@/game/catalog").CatalogRow | "none" = "none";
  let selectedPrintedStrengthBucket: import("@/game/ai/decisionTrace").AiDecisionWeatherPlacementStrengthBucket = "none";
  let selectedEffectiveStrengthBucket: import("@/game/ai/decisionTrace").AiDecisionWeatherPlacementStrengthBucket = "none";

  // cFp38: Low-tempo weathered row placement diagnostics
  let selectedMoveLowTempoWeatherRisk = false;
  let betterNonWeatheredAlternativeAvailable = false;
  let weatheredLowTempoPenaltyApplied = false;

  if (move && move.kind === "play_card" && move.target.kind === "board_row") {
    const card = features.ownHandByCardId.get(move.sourceCardId);
    if (card) {
      selectedMoveSide = move.target.side;
      selectedMoveRow = move.target.row;
      selectedPrintedStrengthBucket = toWeatherStrengthBucket(card.printedStrength);
      const effective = effectivePlacedStrengthForPolicy(features, card, move.target);
      selectedEffectiveStrengthBucket = toWeatherStrengthBucket(effective);
      selectedMoveIntoWeatheredRow = isRowWeatheredForPolicy(features, move.target.row);

      // cFp38: Evaluate low-tempo risk on the selected move
      const isLowTempoRisk = isOwnWeatheredLowTempoUnitPlacement(features, move);
      selectedMoveLowTempoWeatherRisk = isLowTempoRisk;

      if (isLowTempoRisk) {
        const hasExemption = shouldExemptFromWeatheredLowTempoPenalty(features, move);
        const hasBetterLine = hasClearlyBetterNonWeatheredLine(features, move);
        betterNonWeatheredAlternativeAvailable = hasBetterLine;
        weatheredLowTempoPenaltyApplied = hasBetterLine && !hasExemption;
      }
    }
  }

  // Count candidates that target weathered rows
  let weatheredOwnRowPlayCount = 0;
  let weatheredOpponentRowPlayCount = 0;
  for (const playMove of features.playMoves) {
    if (playMove.target.kind === "board_row" && isRowWeatheredForPolicy(features, playMove.target.row)) {
      if (playMove.target.side === "own") weatheredOwnRowPlayCount++;
      else weatheredOpponentRowPlayCount++;
    }
  }

  // Determine opponent weathered rows (same weather affects both sides' rows)
  const opponentWeatheredRows = weatheredRowsArr;

  return {
    selectedMoveIntoWeatheredRow,
    selectedMoveSide,
    selectedMoveRow,
    selectedPrintedStrengthBucket,
    selectedEffectiveStrengthBucket,
    ownWeatheredRows: weatheredRowsArr,
    opponentWeatheredRows: opponentWeatheredRows,
    candidateWeatheredOwnRowPlayCount: weatheredOwnRowPlayCount,
    candidateWeatheredOpponentRowPlayCount: weatheredOpponentRowPlayCount,
    // cFp38
    selectedMoveLowTempoWeatherRisk,
    betterNonWeatheredAlternativeAvailable,
    weatheredLowTempoPenaltyApplied,
  };
};

// cFp29: Build hidden-info-safe Medic timing analysis
const buildMedicTimingAnalysis = (
  features: LegalHeuristicV1Features,
  move: import("@/game/core").LegalMove | null,
): AiDecisionMedicTimingAnalysis | null => {
  // Find unique Medic source card instances in legal play-card moves
  const medicSourceCardIds = new Set<string>();
  for (const playMove of features.playMoves) {
    const card = features.ownHandByCardId.get(playMove.sourceCardId);
    if (card && isMedicSource(card)) {
      medicSourceCardIds.add(playMove.sourceCardId);
    }
  }
  const medicPlayLegal = medicSourceCardIds.size > 0;
  const medicPlayCandidateCount = medicSourceCardIds.size;

  // Count own-discard revive candidates
  const ownDiscard = features.input.observation.ownDiscard ?? [];
  const reviveCandidates = ownDiscard.filter((c) => c.kind === "unit" && c.rows.length > 0);
  const ownDiscardReviveCandidateCount = reviveCandidates.length;

  // Best non-Spy revive strength
  let bestReviveStrength = 0;
  for (const c of reviveCandidates) {
    if (c.abilities.includes("spy") === false && c.printedStrength > bestReviveStrength) {
      bestReviveStrength = c.printedStrength;
    }
  }

  // Best revive value bucket — reuse shared helper
  let bestReviveValueBucket: "none" | "weak" | "medium" | "strong" = "none";
  if (reviveCandidates.length > 0) {
    let bestValue = 0;
    for (const c of reviveCandidates) {
      const v = medicReviveCandidateValue(c);
      if (v > bestValue) bestValue = v;
    }
    if (bestValue <= MEDIC_WEAK_TARGET_UTILITY) bestReviveValueBucket = "weak";
    else if (bestValue <= MEDIC_MEDIUM_TARGET_UTILITY) bestReviveValueBucket = "medium";
    else bestReviveValueBucket = "strong";
  }

  const noTargetMedicRisk = medicPlayLegal && ownDiscardReviveCandidateCount === 0;
  const selectedMoveIsMedic =
    move?.kind === "play_card" &&
    features.playMoves.some((m) => m.moveId === move.moveId) &&
    isMedicSource(features.ownHandByCardId.get((move as { sourceCardId?: string }).sourceCardId ?? ""));
  const selectedMedicWithNoTarget = selectedMoveIsMedic && ownDiscardReviveCandidateCount === 0;

  // cFp39: No-target Medic delay guard booleans
  // Per spec: if the selected move is not a Medic source play, all three booleans are false.
  let selectedNoTargetMedicDelayRisk = false;
  let betterNonMedicAlternativeAvailable = false;
  let noTargetMedicDelayPenaltyApplied = false;

  if (selectedMoveIsMedic && move && move.kind === "play_card") {
    const playMove = move as PlayCardMove;
    selectedNoTargetMedicDelayRisk = isNoTargetMedicSourcePlay(features, playMove);
    betterNonMedicAlternativeAvailable = hasUsefulNonMedicLine(features);
    noTargetMedicDelayPenaltyApplied = shouldApplyNoTargetMedicDelayPenalty(features, playMove);
  }

  return medicPlayLegal
    ? {
      medicPlayLegal,
      medicPlayCandidateCount,
      ownDiscardReviveCandidateCount,
      bestReviveStrengthBucket: toAiDecisionTempoBucket(bestReviveStrength),
      bestReviveValueBucket,
      noTargetMedicRisk,
      selectedMoveIsMedic,
      selectedMedicWithNoTarget,
      selectedNoTargetMedicDelayRisk,
      betterNonMedicAlternativeAvailable,
      noTargetMedicDelayPenaltyApplied,
    }
    : null;
};

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
  scoiataelFirstTurnAnalysis: import("./decisionTrace").AiDecisionScoiataelFirstTurnAnalysis | null = null,
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
      handShapeAnalysis: null,
      medicTimingAnalysis: null,
      weatherPlacementAnalysis: null,
      roundInvestmentAnalysis: null,
      scoiataelFirstTurnAnalysis,
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

  // cFp28: Build hand-shape analysis for diagnostics
  const handShapeAnalysis = buildLegalHeuristicV1HandShapeAnalysis(features);

  // cFp29: Build Medic timing analysis for diagnostics
  const medicTimingAnalysis = buildMedicTimingAnalysis(features, move);

  // cFp30: Build Weather placement analysis for diagnostics
  const weatherPlacementAnalysis = buildWeatherPlacementAnalysis(features, move);

  // cF31: Build Round investment analysis for diagnostics
  // cFp31 repair Fix 1: When the selected move is `pass`, use the shared
  // round-investment decision helper so the explanation analyzes the same
  // candidate the policy evaluated (not null).
  const selectedPlayMove = (move?.kind === "play_card" || move?.kind === "use_leader")
    ? (move as PlayCardMove | UseLeaderMove)
    : null;
  const roundDecision = buildLegalHeuristicV1RoundInvestmentDecision(features);
  let roundInvestmentAnalysis = buildLegalHeuristicV1RoundInvestmentAnalysis(
    features,
    selectedPlayMove ?? null,
    handShapeAnalysis,
  );
  // When the policy chose pass due to round-investment logic, use the helper's
  // analysis so the explanation reason matches the policy decision.
  if (move?.kind === "pass" && roundDecision.shouldPass && roundDecision.analysis) {
    roundInvestmentAnalysis = roundDecision.analysis;
  }

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
  // cFp28: Include future-hand quality diagnostics in reason.
  // cFp30: Surface weather placement when relevant.
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
  } else {
    // cFp28: Check if hand quality blocks voluntary pass or other reason
    const bestMove = sorted[0];
    const requiredLead = Math.max(features.ownGems <= 1 ? 36 : 24, features.opponentHandCount * (features.ownGems <= 1 ? 8 : 6));
    const passSafetyBuffer = features.scoreDelta - requiredLead;
    const extraBuffer = getFutureHandExtraBuffer(handShapeAnalysis.futureRoundHandQuality);
    const handQualityBlockedPass = extraBuffer > 0 && passSafetyBuffer < extraBuffer;
    if (passAnalysis && passAnalysis.isVoluntarilySafe && handQualityBlockedPass) {
      // Baseline pass is safe, but cFp28 buffering made the margin insufficient.
      if (move.kind !== "pass" && bestMove && bestMove.score > 0) {
        reason = `future hand ${handShapeAnalysis.futureRoundHandQuality}, pass margin too small — play useful card`;
      } else {
        reason = `future hand ${handShapeAnalysis.futureRoundHandQuality}, no useful move — pass`;
      }
    } else if (passAnalysis && passAnalysis.isVoluntarilySafe && move.kind === "pass") {
      reason = `voluntary pass safe (delta ${passAnalysis.scoreDelta}, required ${passAnalysis.requiredLead})`;
    } else if (handQualityBlockedPass) {
      if (move.kind !== "pass" && bestMove && bestMove.score > 0) {
        reason = `future hand ${handShapeAnalysis.futureRoundHandQuality}, pass margin too small — play useful card`;
      } else {
        reason = `future hand ${handShapeAnalysis.futureRoundHandQuality}, no useful move — pass`;
      }
    }
    // cFp36/cFp37: narrow play-card branch — only handle real cFp36 exception/budget
    // reason strings. cFp37: when resource pressure is blocked by continue,
    // fight_last_gem, or single-move catch-up, explain why the play was selected.
    if (!reason && move?.kind === "play_card" && roundInvestmentAnalysis) {
      const resReason = roundInvestmentAnalysis.resourceExhaustionReason;
      if (resReason === "exception_card_advantage") {
        reason = "round resource pressure ignored — card advantage move";
        reasonKind = "policy-round-investment";
      } else if (resReason === "exception_last_gem") {
        reason = "round resource pressure ignored — last gem";
        reasonKind = "policy-round-investment";
      } else if (resReason === "exception_match_winning_play") {
        reason = "round resource pressure ignored — match-winning play";
        reasonKind = "policy-round-investment";
      } else if (resReason === "round_three_no_budget") {
        reason = "round resource pressure ignored — round 3, no budget";
        reasonKind = "policy-round-investment";
      } else if (resReason === "thin_future_hand" || resReason === "poor_future_hand" || resReason === "last_useful_unit" || resReason === "round_budget_exceeded") {
        reason = "cheap catch-up allowed — play useful card";
        reasonKind = "policy-round-investment";
      } else if (roundInvestmentAnalysis.resourceExhaustionRecommended && roundInvestmentAnalysis.recommendation === "continue") {
        reason = "round resource pressure ignored — continue recommendation";
        reasonKind = "policy-round-investment";
      } else if (roundInvestmentAnalysis.resourceExhaustionRecommended && roundInvestmentAnalysis.recommendation === "fight_last_gem") {
        reason = "round resource pressure ignored — last-gem fight";
        reasonKind = "policy-round-investment";
      } else if (roundInvestmentAnalysis.resourceExhaustionRecommended && passDiagnosticsInput.hasSingleMoveCatchUp && passDiagnosticsInput.policyUpperBoundCanWinRound) {
        reason = "round resource pressure ignored — single-move catch-up";
        reasonKind = "policy-round-investment";
      } else if (roundInvestmentAnalysis.resourceExhaustionRecommended && roundInvestmentAnalysis.recommendation === "preserve_future_hand") {
        reason = "round resource budget exceeded — preserve future hand";
        reasonKind = "policy-round-investment";
      } else if (roundInvestmentAnalysis.resourceExhaustionRecommended && roundInvestmentAnalysis.recommendation === "sacrifice_round") {
        reason = "round resource pressure high — sacrifice non-elimination round";
        reasonKind = "policy-round-investment";
      }
      // else: reason is "none" — fall through to bestMove block below
    }
    // If reason is still empty after cFp28/cFp36 checks, handle bestMove
    // (stop-loss, pass resource exhaustion, weathered-row, generic best move).
    if (!reason && bestMove) {
      // cFp43: Round-one overinvestment pass reason
      if (move?.kind === "pass" && roundInvestmentAnalysis && roundInvestmentAnalysis.roundOneOverinvestmentRecommended) {
        reason = "round-one overinvestment — preserve future hand";
        reasonKind = "policy-round-investment";
      } else if (move?.kind === "pass" && roundInvestmentAnalysis && roundInvestmentAnalysis.stopLossRecommended) {
          const slReason = roundInvestmentAnalysis.stopLossReason;
          if (slReason === "upper_bound_impossible") {
            reason = "stop-loss — sacrifice round — catch-up impossible — preserve cards";
          } else if (slReason === "weathered_low_tempo") {
            reason = "stop-loss — sacrifice round — low-tempo weathered placement — preserve cards";
          } else if (slReason === "medium_medic_target") {
            reason = "stop-loss — sacrifice round — medium medic target — preserve cards";
          } else if (slReason === "low_hand_no_clean_catch_up") {
            reason = "stop-loss — sacrifice round — low hand, no clean catch-up — preserve cards";
          } else {
            reason = "stop-loss — sacrifice round — preserve cards for future rounds";
          }
        reasonKind = "policy-round-investment";
      } else if (move?.kind === "pass" && roundInvestmentAnalysis) {
        if (roundInvestmentAnalysis.resourceExhaustionRecommended) {
          const resReason = roundInvestmentAnalysis.resourceExhaustionReason;
          if (resReason === "poor_future_hand" || resReason === "round_budget_exceeded") {
            reason = "round resource budget exceeded — preserve future hand";
          } else if (resReason === "thin_future_hand") {
            reason = "round resource budget exceeded — thin future hand";
          } else if (resReason === "last_useful_unit") {
            reason = "round resource pressure high — sacrifice non-elimination round";
          } else {
            reason = "round resource budget exceeded — preserve future hand";
          }
          reasonKind = "policy-round-investment";
        } else if (roundInvestmentAnalysis.recommendation === "preserve_future_hand" || roundInvestmentAnalysis.recommendation === "sacrifice_round") {
          reason = roundInvestmentAnalysis.recommendation === "preserve_future_hand"
            ? "preserve future hand — pass"
            : "sacrifice round — preserve cards";
          reasonKind = "policy-round-investment";
        } else {
          // cFp39: No-target Medic delay reason strings
          if (medicTimingAnalysis?.selectedNoTargetMedicDelayRisk) {
            if (medicTimingAnalysis.noTargetMedicDelayPenaltyApplied) {
              reason = `no-target Medic penalty applied — still best visible line (score ${bestMove.score})`;
            } else if (medicTimingAnalysis.betterNonMedicAlternativeAvailable) {
              reason = `no-target Medic accepted — emergency tempo`;
            } else {
              reason = `no-target Medic accepted — no useful non-Medic line (score ${bestMove.score})`;
            }
          } else if (weatherPlacementAnalysis?.selectedMoveIntoWeatheredRow && weatherPlacementAnalysis.selectedMoveSide !== "none") {
            if (weatherPlacementAnalysis.weatheredLowTempoPenaltyApplied) {
              reason = `weathered row penalty applied — still best visible line (score ${bestMove.score})`;
            } else if (weatherPlacementAnalysis.betterNonWeatheredAlternativeAvailable === false) {
              reason = `weathered row penalty accepted — no better visible line (score ${bestMove.score})`;
            } else {
              reason = `weathered row penalty accepted — best useful move (score ${bestMove.score})`;
            }
          } else {
            reason = `best useful move (score ${bestMove.score})`;
          }
        }
      } else {
        // cFp43: Round-one overinvestment exception for selected play_card
        if (move?.kind === "play_card" && roundInvestmentAnalysis) {
          const ovReason = roundInvestmentAnalysis.roundOneOverinvestmentReason;
          if (ovReason === "exception_card_advantage") {
            reason = "round-one overinvestment ignored — card advantage move";
            reasonKind = "policy-round-investment";
          } else if (ovReason === "exception_match_winning_play") {
            reason = "round-one overinvestment ignored — match-winning play";
            reasonKind = "policy-round-investment";
          } else if (ovReason === "exception_single_move_catch_up") {
            reason = "round-one overinvestment ignored — single-move catch-up";
            reasonKind = "policy-round-investment";
          }
        }
        // cFp39: No-target Medic delay reason strings
        if (medicTimingAnalysis?.selectedNoTargetMedicDelayRisk) {
          if (medicTimingAnalysis.noTargetMedicDelayPenaltyApplied) {
            reason = `no-target Medic penalty applied — still best visible line (score ${bestMove.score})`;
          } else if (medicTimingAnalysis.betterNonMedicAlternativeAvailable) {
            reason = `no-target Medic accepted — emergency tempo`;
          } else {
            reason = `no-target Medic accepted — no useful non-Medic line (score ${bestMove.score})`;
          }
        } else if (weatherPlacementAnalysis?.selectedMoveIntoWeatheredRow && weatherPlacementAnalysis.selectedMoveSide !== "none") {
          if (weatherPlacementAnalysis.weatheredLowTempoPenaltyApplied) {
            reason = `weathered row penalty applied — still best visible line (score ${bestMove.score})`;
          } else if (weatherPlacementAnalysis.betterNonWeatheredAlternativeAvailable === false) {
            reason = `weathered row penalty accepted — no better visible line (score ${bestMove.score})`;
          } else {
            reason = `weathered row penalty accepted — best useful move (score ${bestMove.score})`;
          }
        } else {
          reason = `best useful move (score ${bestMove.score})`;
        }
      }
    }
    // Pass fallback: no reason set yet, no bestMove, but roundInvestmentAnalysis exists.
    if (!reason && move?.kind === "pass" && roundInvestmentAnalysis) {
      if (roundInvestmentAnalysis.stopLossRecommended) {
          const slReason = roundInvestmentAnalysis.stopLossReason;
          if (slReason === "upper_bound_impossible") {
            reason = "stop-loss — sacrifice round — catch-up impossible — preserve cards";
          } else if (slReason === "weathered_low_tempo") {
            reason = "stop-loss — sacrifice round — low-tempo weathered placement — preserve cards";
          } else if (slReason === "medium_medic_target") {
            reason = "stop-loss — sacrifice round — medium medic target — preserve cards";
          } else if (slReason === "low_hand_no_clean_catch_up") {
            reason = "stop-loss — sacrifice round — low hand, no clean catch-up — preserve cards";
          } else {
            reason = "stop-loss — sacrifice round — preserve cards for future rounds";
          }
          reasonKind = "policy-round-investment";
      } else if (roundInvestmentAnalysis.recommendation === "preserve_future_hand" || roundInvestmentAnalysis.recommendation === "sacrifice_round") {
        reason = roundInvestmentAnalysis.recommendation === "preserve_future_hand"
          ? "preserve future hand — pass"
          : "sacrifice round — preserve cards";
        reasonKind = "policy-round-investment";
      }
    }
    // Final fallback.
    if (!reason) {
      reason = "no useful move above threshold, pass";
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
      passAnalysis,
      mulliganAnalysis: null,
      handShapeAnalysis,
      medicTimingAnalysis,
      weatherPlacementAnalysis,
      roundInvestmentAnalysis,
      scoiataelFirstTurnAnalysis: null,
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
        handShapeAnalysis: null,
        medicTimingAnalysis: null,
        weatherPlacementAnalysis: null,
        roundInvestmentAnalysis: null,
        scoiataelFirstTurnAnalysis: null,
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
    let scoiataelAnalysis: AiDecisionScoiataelFirstTurnAnalysis | null = null;
    let scoiataelReason = "";
    const scoiataelPromptMove = features.promptMoves.find(
      (m) => m.metadata.abilityId === "scoiatael_choose_first",
    );
    if (scoiataelPromptMove) {
      const scoiataelDecision = buildScoiataelFirstTurnChoiceDecision(features);
      scoiataelAnalysis = scoiataelDecision.analysis;
      if (move && scoiataelAnalysis) {
        if (scoiataelAnalysis.recommendation === "go_first") {
          if (scoiataelAnalysis.reasonKind === "spy_or_card_advantage_opener") {
            scoiataelReason = "Scoia'tael chooses first: spy/card-advantage opener";
          } else if (scoiataelAnalysis.reasonKind === "muster_or_thinning_opener") {
            scoiataelReason = "Scoia'tael chooses first: muster/thinning opener";
          } else if (scoiataelAnalysis.reasonKind === "strong_tempo_opener") {
            scoiataelReason = "Scoia'tael chooses first: strong tempo opener";
          } else {
            scoiataelReason = "Scoia'tael chooses first: default go-first bias";
          }
        } else {
          if (scoiataelAnalysis.reasonKind === "reactive_weather_or_scorch") {
            scoiataelReason = "Scoia'tael lets opponent start: reactive weather/scorch hand";
          } else {
            scoiataelReason = "Scoia'tael lets opponent start: weak proactive reactive hand";
          }
        }
      }
    }
    if (scoiataelAnalysis) {
      phaseTrace = buildPhaseTrace(
        input,
        decisionIndex,
        move,
        policyId,
        decisionIndex,
        null,
        scoiataelAnalysis,
      );
      if (scoiataelReason) {
        phaseTrace = { trace: { ...phaseTrace.trace, reason: scoiataelReason }, reason: scoiataelReason };
      }
    } else {
      phaseTrace = buildPhaseTrace(
        input,
        decisionIndex,
        move,
        policyId,
        decisionIndex,
      );
    }
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
