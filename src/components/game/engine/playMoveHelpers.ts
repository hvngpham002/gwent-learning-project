import type { CardInstanceId, LegalMove, PlayCardMove } from "@/game/core";
import type { MatchPhase } from "@/game/core/types";

export interface PlayCardLookupEntry {
  name: string;
}

const ROW_LABELS: Record<string, string> = {
  close: "Close",
  ranged: "Ranged",
  siege: "Siege",
};

const SIDE_LABELS: Record<string, string> = {
  own: "Own",
  opponent: "Opponent",
};

export const getPlayableCardIds = (legalMoves: readonly LegalMove[]): Set<CardInstanceId> =>
  new Set(
    legalMoves.flatMap((move) => (move.kind === "play_card" ? [move.sourceCardId] : [])),
  );

export const getPlayMovesForCard = (
  legalMoves: readonly LegalMove[],
  cardId: CardInstanceId | null,
): PlayCardMove[] => {
  if (!cardId) {
    return [];
  }

  return legalMoves.filter((move): move is PlayCardMove => move.kind === "play_card" && move.sourceCardId === cardId);
};

export const describePlayTarget = (
  move: PlayCardMove,
  cardLookup: ReadonlyMap<CardInstanceId, PlayCardLookupEntry> = new Map(),
): string => {
  const target = move.target;

  if (target.kind === "board_row") {
    return `${SIDE_LABELS[target.side]} ${ROW_LABELS[target.row] ?? target.row}`;
  }

  if (target.kind === "row_horn") {
    return `Own ${ROW_LABELS[target.row] ?? target.row} Horn`;
  }

  if (target.kind === "weather") {
    return "Weather";
  }

  if (target.kind === "card_instance") {
    const cardName = cardLookup.get(target.cardId)?.name ?? target.cardId;
    const rowLabel = target.row ? `, ${ROW_LABELS[target.row] ?? target.row}` : "";
    return `${SIDE_LABELS[target.side]} ${cardName}${rowLabel}`;
  }

  return move.metadata.targetLabel === "global" ? "Global" : "No target";
};

export const shouldDisableHandCard = ({
  phase,
  canHumanAct,
  promptOpen,
  playableCardIds,
  cardId,
}: {
  phase: MatchPhase | null | undefined;
  canHumanAct: boolean;
  promptOpen: boolean;
  playableCardIds: ReadonlySet<CardInstanceId>;
  cardId: CardInstanceId;
}) => phase !== "playing" || !canHumanAct || promptOpen || !playableCardIds.has(cardId);
