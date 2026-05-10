import { legalHeuristicPolicyV0, legalHeuristicPolicyV1, type EnginePolicy } from "@/game/ai";
import type { LegalMove } from "@/game/core";

import type { BenchmarkPolicyRegistry } from "./types";

const byMoveId = (left: LegalMove, right: LegalMove) => left.moveId.localeCompare(right.moveId);

const firstByMoveId = (moves: readonly LegalMove[]) => [...moves].sort(byMoveId)[0] ?? null;

export const legalFirstPolicyV0: EnginePolicy = {
  id: "legal-first-v0",
  selectMove(input) {
    if (input.legalMoves.length === 0) {
      return null;
    }

    const promptMoves = input.legalMoves.filter((move) => move.kind === "choose_prompt_option");
    if (promptMoves.length > 0) {
      return firstByMoveId(promptMoves);
    }

    if (input.observation.phase === "mulligan") {
      const keepAllMove =
        input.legalMoves.find((move) => move.kind === "choose_mulligan" && move.cardIds.length === 0) ?? null;
      if (keepAllMove) {
        return keepAllMove;
      }
    }

    return firstByMoveId(input.legalMoves);
  },
};

export const defaultBenchmarkPolicies: BenchmarkPolicyRegistry = {
  [legalHeuristicPolicyV0.id]: legalHeuristicPolicyV0,
  [legalHeuristicPolicyV1.id]: legalHeuristicPolicyV1,
  [legalFirstPolicyV0.id]: legalFirstPolicyV0,
};
