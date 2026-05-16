import type { LegalMove, PlayCardMove, UseLeaderMove } from "@/game/core";

import type { EnginePolicy, EnginePolicyInput, SeatCardSummary } from "./types";

const byMoveId = (left: LegalMove, right: LegalMove) => left.moveId.localeCompare(right.moveId);

const ownHandCard = (input: EnginePolicyInput, cardId: string): SeatCardSummary | undefined =>
  input.observation.ownHand.find((card) => card.cardId === cardId);

const isUsefulLeaderMove = (input: EnginePolicyInput, move: UseLeaderMove) =>
  move.metadata.ability === "clear_weather" && move.metadata.abilityStatus === "implemented" && input.observation.weather.length > 0;

const rankPlayMove = (input: EnginePolicyInput, move: PlayCardMove) => {
  const card = ownHandCard(input, move.sourceCardId);
  const strength = card?.printedStrength ?? 0;
  const kindBonus = card?.kind === "hero" ? 2 : card?.kind === "unit" ? 1 : 0;
  const targetBonus = move.target.kind === "board_row" && move.target.side === "own" ? 1 : 0;
  return strength * 100 + kindBonus * 10 + targetBonus;
};

const choosePromptMove = (input: EnginePolicyInput) => {
  const promptMoves = input.legalMoves.filter((move) => move.kind === "choose_prompt_option");
  if (promptMoves.length === 0) {
    return null;
  }

  // cCp29: when the AI owns a `cancel_leader` reaction prompt, choose the
  // cancel option deterministically. This makes the AI a useful White
  // Flame opponent without an open-ended strategic rewrite. The decline
  // option is still legal but the heuristic prefers cancel.
  const reactionCancel = promptMoves.find(
    (move) =>
      move.kind === "choose_prompt_option" &&
      move.metadata.abilityId === "cancel_leader" &&
      move.optionId === "cancel-leader:cancel",
  );
  if (reactionCancel) {
    return reactionCancel;
  }

  const scoiataelSelf = promptMoves.find(
    (move) =>
      move.metadata.abilityId === "scoiatael_choose_first" &&
      move.optionId === "scoiatael-first-player:self",
  );
  if (scoiataelSelf) {
    return scoiataelSelf;
  }

  const optionStrength = new Map(
    input.observation.pendingPrompt?.options.map((option) => [option.optionId, option.targetStrength ?? 0]) ?? [],
  );

  return [...promptMoves].sort((left, right) => {
    const strengthDelta = (optionStrength.get(right.optionId) ?? 0) - (optionStrength.get(left.optionId) ?? 0);
    return strengthDelta || byMoveId(left, right);
  })[0];
};

const chooseMulliganMove = (legalMoves: readonly LegalMove[]) =>
  legalMoves.find((move) => move.kind === "choose_mulligan" && move.cardIds.length === 0) ?? null;

const choosePlayMove = (input: EnginePolicyInput) => {
  const playMoves = input.legalMoves.filter((move): move is PlayCardMove => move.kind === "play_card");
  if (playMoves.length === 0) {
    return null;
  }

  return [...playMoves].sort((left, right) => {
    const rankDelta = rankPlayMove(input, right) - rankPlayMove(input, left);
    return rankDelta || byMoveId(left, right);
  })[0];
};

const chooseLeaderMove = (input: EnginePolicyInput) =>
  [...input.legalMoves]
    .filter((move): move is UseLeaderMove => move.kind === "use_leader" && isUsefulLeaderMove(input, move))
    .sort(byMoveId)[0] ?? null;

export const legalHeuristicPolicyV0: EnginePolicy = {
  id: "legal-heuristic-v0",
  selectMove(input) {
    if (input.legalMoves.length === 0) {
      return null;
    }

    const promptMove = choosePromptMove(input);
    if (promptMove) {
      return promptMove;
    }

    if (input.observation.phase === "mulligan") {
      return chooseMulliganMove(input.legalMoves);
    }

    const passMove = input.legalMoves.find((move) => move.kind === "pass") ?? null;
    const ownScore = input.observation.score.totalBySeat[input.seatId];
    const opponentScore = input.observation.score.totalBySeat[input.observation.opponentSeatId];
    if (input.observation.opponentPassed && ownScore > opponentScore && passMove) {
      return passMove;
    }

    const playMove = choosePlayMove(input);
    if (playMove) {
      return playMove;
    }

    const leaderMove = chooseLeaderMove(input);
    if (leaderMove) {
      return leaderMove;
    }

    return passMove;
  },
};
