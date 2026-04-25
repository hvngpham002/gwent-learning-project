import type { EngineCommand, LegalMove } from "@/game/core";

export const commandFromLegalMove = (move: LegalMove): Exclude<EngineCommand, { type: "StartMatch" }> | null => {
  switch (move.kind) {
    case "choose_mulligan":
      return { type: "ChooseMulligan", seatId: move.seatId, cardIds: move.cardIds };
    case "play_card":
      return { type: "PlayCard", seatId: move.seatId, cardId: move.sourceCardId, target: move.target };
    case "pass":
      return { type: "Pass", seatId: move.seatId };
    case "use_leader":
      return { type: "UseLeader", seatId: move.seatId, target: move.target };
    case "choose_prompt_option":
      return { type: "ChoosePromptOption", seatId: move.seatId, promptId: move.promptId, optionId: move.optionId };
    case "resolve_round_end":
      return { type: "ResolveRoundEnd", seatId: move.seatId };
  }
};
