import type { CardInstanceId, ChoosePromptOptionMove, LegalMove, PlayCardMove, UseLeaderMove } from "@/game/core";
import type { MatchPhase } from "@/game/core/types";

export interface PlayCardLookupEntry {
  name: string;
}

export interface PromptViewModel {
  promptId: string;
  title: string;
  sourceLabel: string | null;
  options: ChoosePromptOptionMove[];
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

export const getUseLeaderMoves = (legalMoves: readonly LegalMove[]): UseLeaderMove[] =>
  legalMoves.filter((move): move is UseLeaderMove => move.kind === "use_leader");

export const getPromptOptionMoves = (legalMoves: readonly LegalMove[]): ChoosePromptOptionMove[] =>
  legalMoves.filter((move): move is ChoosePromptOptionMove => move.kind === "choose_prompt_option");

const abilityLabel = (ability: string) =>
  ability
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const describeLeaderMove = (move: UseLeaderMove | null | undefined): string => {
  if (!move) {
    return "Use Leader";
  }

  return `${move.metadata.leaderName}: ${abilityLabel(move.metadata.ability)} (${move.metadata.abilityStatus})`;
};

export const shouldDisableLeaderAction = ({
  phase,
  canHumanAct,
  promptOpen,
  leaderUsed,
  leaderMove,
}: {
  phase: MatchPhase | null | undefined;
  canHumanAct: boolean;
  promptOpen: boolean;
  leaderUsed: boolean;
  leaderMove: UseLeaderMove | null | undefined;
}) => phase !== "playing" || !canHumanAct || promptOpen || leaderUsed || !leaderMove;

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

  if (target.kind === "deck_card_source") {
    return `Deck ${target.sourceId}`;
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

export const buildPromptViewModel = ({
  promptMoves,
  promptKind,
  sourceCardId,
  cardLookup = new Map(),
}: {
  promptMoves: readonly ChoosePromptOptionMove[];
  promptKind: string;
  sourceCardId?: CardInstanceId;
  cardLookup?: ReadonlyMap<CardInstanceId, PlayCardLookupEntry>;
}): PromptViewModel | null => {
  const firstMove = promptMoves[0];
  if (!firstMove) {
    return null;
  }

  const sourceName = sourceCardId ? cardLookup.get(sourceCardId)?.name : undefined;
  const ability = abilityLabel(firstMove.metadata.abilityId);
  return {
    promptId: firstMove.promptId,
    title: `${promptKind.replace(/_/g, " ")} · ${ability}`,
    sourceLabel: sourceName ? `Source: ${sourceName}` : null,
    options: [...promptMoves],
  };
};
