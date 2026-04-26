import type { LegalMove, LegalMoveTarget, MatchState, SeatId } from "@/game/core";

import {
  LEGAL_ACTION_SCHEMA_VERSION,
  type EncodedLegalAction,
  type SafeActionCardRef,
  type SafeActionTargetRef,
} from "./exportTypes";
import { lookupCatalogCard, safeCardRefForId } from "./exportObservation";

const sideForTarget = (target: LegalMoveTarget): "own" | "opponent" | "public" | "none" => {
  if (target.kind === "weather") return "public";
  if (target.kind === "none") return "none";
  return target.side;
};

const encodeTarget = (
  state: MatchState,
  perspectiveSeatId: SeatId,
  target: LegalMoveTarget | undefined,
): SafeActionTargetRef => {
  if (!target || target.kind === "none") return { kind: "none", side: "none" };
  if (target.kind === "weather") return { kind: "weather", side: "public" };
  if (target.kind === "board_row") return { kind: "board_row", side: target.side, row: target.row };
  if (target.kind === "row_horn") return { kind: "row_horn", side: target.side, row: target.row };

  const visibleCard = safeCardRefForId(state, perspectiveSeatId, target.cardId);
  return visibleCard
    ? { kind: "card", side: target.side, row: target.row, card: visibleCard }
    : { kind: "none", side: "none" };
};

const sourceFromCard = (
  state: MatchState,
  perspectiveSeatId: SeatId,
  cardId: string,
): SafeActionCardRef | undefined => {
  const visibleCard = safeCardRefForId(state, perspectiveSeatId, cardId);
  if (!visibleCard) return undefined;
  return {
    cardRef: visibleCard.cardRef,
    sourceId: visibleCard.sourceId,
    kind: visibleCard.kind,
    abilities: visibleCard.abilities,
  };
};

export const encodeLegalActions = (
  state: MatchState,
  perspectiveSeatId: SeatId,
  legalMoves: readonly LegalMove[],
): EncodedLegalAction[] =>
  legalMoves.map((move, actionIndex) => {
    const base = {
      schemaVersion: LEGAL_ACTION_SCHEMA_VERSION as typeof LEGAL_ACTION_SCHEMA_VERSION,
      actionIndex,
      actionId: `action_${actionIndex}`,
      kind: move.kind,
      label: move.label,
    };

    switch (move.kind) {
      case "choose_mulligan":
        return {
          ...base,
          source:
            move.cardIds.length === 1 ? sourceFromCard(state, perspectiveSeatId, move.cardIds[0]) : undefined,
          target: { kind: "none", side: "none" },
          metadata: {
            cardCount: move.metadata.cardCount,
            maxCards: move.metadata.maxCards,
          },
        };
      case "play_card": {
        const source = lookupCatalogCard(move.sourceId);
        return {
          ...base,
          source: sourceFromCard(state, perspectiveSeatId, move.sourceCardId),
          target: encodeTarget(state, perspectiveSeatId, move.target),
          metadata: {
            cardKind: move.metadata.cardKind,
            abilities: [...move.metadata.abilities],
            row: "row" in move.target ? move.target.row : undefined,
            side: sideForTarget(move.target),
            cardCount: source ? undefined : 0,
          },
        };
      }
      case "use_leader":
        return {
          ...base,
          source: {
            cardRef: "own_leader",
            sourceId: move.sourceId,
            kind: "leader",
            abilities: [move.metadata.ability],
          },
          target: encodeTarget(state, perspectiveSeatId, move.target),
          metadata: {
            abilities: [move.metadata.ability],
            side: sideForTarget(move.target),
          },
        };
      case "choose_prompt_option":
        return {
          ...base,
          source: move.metadata.sourceCardId
            ? sourceFromCard(state, perspectiveSeatId, move.metadata.sourceCardId)
            : undefined,
          target: encodeTarget(state, perspectiveSeatId, move.target),
          prompt: {
            promptRef: "pending_prompt",
            optionRef: `prompt_option_${actionIndex}`,
            optionIndex: actionIndex,
          },
          metadata: {
            abilities: [move.metadata.abilityId],
            row: "row" in move.target ? move.target.row : undefined,
            side: sideForTarget(move.target),
          },
        };
      case "pass":
      case "resolve_round_end":
        return {
          ...base,
          target: { kind: "none", side: "none" },
          metadata: {
            side: "none",
          },
        };
    }
  });
