import type { CardInstanceId, PlayCardMove, SeatId } from "@/game/core";
import type { CatalogRow } from "@/game/catalog";
import type { EngineBoardRowViewModel, EngineCardViewModel } from "@/store/selectors/engineSelectors";

import type { AuthenticCardViewModel } from "./cardViewModel";
import { getFactionDisplay, getRowDisplay } from "./displayMetadata";

export type MatchSeatRole = "human" | "ai";

export interface AuthenticRuntimeCardViewModel {
  readonly key: CardInstanceId;
  readonly card: AuthenticCardViewModel;
}

export interface AuthenticSeatSummaryViewModel {
  readonly seatId: SeatId;
  readonly role: MatchSeatRole;
  readonly label: string;
  readonly faction: string;
  readonly factionName: string;
  readonly gems: number;
  readonly passed: boolean;
  readonly handCount: number;
  readonly deckCount: number;
  readonly discardCount: number;
  readonly score: number;
  readonly handCards: readonly AuthenticRuntimeCardViewModel[];
}

export interface AuthenticBoardRowViewModel {
  readonly key: string;
  readonly seatId: SeatId;
  readonly side: "opponent" | "player";
  readonly row: CatalogRow;
  readonly rowName: string;
  readonly rowGlyph: string;
  readonly score: number;
  readonly units: readonly AuthenticRuntimeCardViewModel[];
  readonly horn: AuthenticRuntimeCardViewModel | null;
}

export interface RowTargetViewModel {
  readonly key: string;
  readonly moveId: string;
  readonly seatId: SeatId;
  readonly row: CatalogRow;
}

const HUMAN_LABEL = "You";
const AI_LABEL = "AI";

const BOARD_ROW_ORDER: readonly CatalogRow[] = ["siege", "ranged", "close", "close", "ranged", "siege"];

export const engineCardToAuthenticCard = (card: EngineCardViewModel): AuthenticCardViewModel => ({
  sourceId: card.sourceId,
  name: card.name,
  faction: card.faction,
  kind: card.kind,
  strength: card.printedStrength,
  rows: card.rows,
  abilities: card.abilities,
  tags: card.kind === "special" && card.abilities.some((ability) => ["frost", "fog", "rain", "clear_weather"].includes(ability))
    ? ["weather"]
    : [],
  image: card.image,
});

export const toRuntimeCard = (card: EngineCardViewModel): AuthenticRuntimeCardViewModel => ({
  key: card.instanceId,
  card: engineCardToAuthenticCard(card),
});

export const buildAuthenticSeatSummary = ({
  seatId,
  role,
  faction,
  gems,
  passed,
  handCards,
  hiddenHandCount,
  deckCount,
  discardCount,
  score,
}: {
  seatId: SeatId;
  role: MatchSeatRole;
  faction: string;
  gems: number;
  passed: boolean;
  handCards: readonly EngineCardViewModel[];
  hiddenHandCount?: number;
  deckCount: number;
  discardCount: number;
  score: number;
}): AuthenticSeatSummaryViewModel => {
  const factionDisplay = getFactionDisplay(faction);
  const visibleHandCards = role === "human" ? handCards.map(toRuntimeCard) : [];
  return {
    seatId,
    role,
    label: role === "human" ? HUMAN_LABEL : AI_LABEL,
    faction,
    factionName: factionDisplay.name,
    gems,
    passed,
    handCount: role === "human" ? handCards.length : hiddenHandCount ?? 0,
    deckCount,
    discardCount,
    score,
    handCards: visibleHandCards,
  };
};

export const orderBoardRowsForAuthenticTable = ({
  rows,
  humanSeat,
  rowScores,
}: {
  rows: readonly EngineBoardRowViewModel[];
  humanSeat: SeatId;
  rowScores: Record<SeatId, Record<CatalogRow, number>>;
}): AuthenticBoardRowViewModel[] => {
  const opponentSeat: SeatId = humanSeat === "seat_a" ? "seat_b" : "seat_a";
  const orderedSeats: readonly SeatId[] = [opponentSeat, opponentSeat, opponentSeat, humanSeat, humanSeat, humanSeat];

  return orderedSeats.map((seatId, index) => {
    const row = BOARD_ROW_ORDER[index];
    const source = rows.find((candidate) => candidate.seatId === seatId && candidate.row === row);
    const display = getRowDisplay(row);
    return {
      key: `${seatId}:${row}`,
      seatId,
      side: seatId === humanSeat ? "player" : "opponent",
      row,
      rowName: display.name,
      rowGlyph: display.glyph,
      score: rowScores[seatId]?.[row] ?? 0,
      units: source?.units.map(toRuntimeCard) ?? [],
      horn: source?.horn ? toRuntimeCard(source.horn) : null,
    };
  });
};

export const buildVisibleCardLookup = (
  cards: readonly EngineCardViewModel[],
): ReadonlyMap<CardInstanceId, { name: string }> => new Map(cards.map((card) => [card.instanceId, { name: card.name }]));

export const getBoardRowTargetsByKey = (moves: readonly PlayCardMove[]): ReadonlyMap<string, RowTargetViewModel> =>
  new Map(
    moves.flatMap((move) => {
      if (move.target.kind !== "board_row") {
        return [];
      }
      const key = `${move.target.seatId}:${move.target.row}`;
      return [
        [
          key,
          {
            key,
            moveId: move.moveId,
            seatId: move.target.seatId,
            row: move.target.row,
          },
        ],
      ] as const;
    }),
  );
