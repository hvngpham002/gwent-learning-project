import type { CatalogCardSource, CatalogLeaderSource, CatalogRow } from "@/game/catalog";
import { calculateScores, type CardInstance, type CardInstanceId, type MatchState, type SeatId } from "@/game/core";

import type { PendingPromptSummary, SeatCardSummary, SeatObservation } from "./types";

const ROWS: readonly CatalogRow[] = ["close", "ranged", "siege"];

const opponentOf = (seatId: SeatId): SeatId => (seatId === "seat_a" ? "seat_b" : "seat_a");

const createCardLookup = (catalogCards: readonly CatalogCardSource[]) =>
  new Map(catalogCards.map((card) => [card.sourceId, card]));

const toCardSummary = (
  instance: CardInstance | undefined,
  cardsBySourceId: ReadonlyMap<string, CatalogCardSource>,
): SeatCardSummary | null => {
  if (!instance || instance.sourceKind !== "card") {
    return null;
  }

  const source = cardsBySourceId.get(instance.sourceId);
  if (!source) {
    return null;
  }

  return {
    cardId: instance.instanceId,
    sourceId: source.sourceId,
    name: source.name,
    kind: source.kind,
    printedStrength: source.strength,
    rows: source.rows,
    abilities: source.abilities,
  };
};

const summarizeCards = (
  state: MatchState,
  cardIds: readonly CardInstanceId[],
  cardsBySourceId: ReadonlyMap<string, CatalogCardSource>,
): SeatCardSummary[] =>
  cardIds.flatMap((cardId) => {
    const summary = toCardSummary(state.cardsById[cardId], cardsBySourceId);
    return summary ? [summary] : [];
  });

const buildPromptSummary = (
  state: MatchState,
  seatId: SeatId,
  cardsBySourceId: ReadonlyMap<string, CatalogCardSource>,
): PendingPromptSummary | null => {
  const prompt = state.pendingPrompt;
  if (!prompt || prompt.seatId !== seatId) {
    return null;
  }

  return {
    promptId: prompt.promptId,
    seatId: prompt.seatId,
    kind: prompt.kind,
    abilityId: prompt.abilityId,
    sourceCardId: prompt.sourceCardId,
    options: prompt.options.map((option) => ({
      optionId: option.optionId,
      label: option.label,
      targetCardId: option.target.cardId,
      targetStrength: cardsBySourceId.get(option.target.sourceId)?.strength,
    })),
  };
};

export interface BuildSeatObservationInput {
  state: MatchState;
  seatId: SeatId;
  catalogCards: readonly CatalogCardSource[];
  catalogLeaders: readonly CatalogLeaderSource[];
}

export const buildSeatObservation = ({
  state,
  seatId,
  catalogCards,
  catalogLeaders,
}: BuildSeatObservationInput): SeatObservation => {
  const opponentSeatId = opponentOf(seatId);
  const cardsBySourceId = createCardLookup(catalogCards);
  const seat = state.seats[seatId];
  const opponent = state.seats[opponentSeatId];

  return {
    seatId,
    opponentSeatId,
    phase: state.phase,
    round: state.round,
    currentTurn: state.currentTurn,
    ownHand: summarizeCards(state, seat.hand, cardsBySourceId),
    ownLeader: {
      leaderCardId: seat.leader,
      sourceId: seat.leaderSourceId,
      used: seat.leaderUsed,
    },
    ownDeckCount: seat.deck.length,
    ownDiscardCount: seat.discard.length,
    ownPassed: seat.passed,
    ownGems: seat.gems,
    opponentHandCount: opponent.hand.length,
    opponentLeader: {
      leaderCardId: opponent.leader,
      sourceId: opponent.leaderSourceId,
      used: opponent.leaderUsed,
    },
    opponentDeckCount: opponent.deck.length,
    opponentDiscardCount: opponent.discard.length,
    opponentPassed: opponent.passed,
    opponentGems: opponent.gems,
    boardRows: (["seat_a", "seat_b"] as const).flatMap((boardSeatId) =>
      ROWS.map((row) => ({
        seatId: boardSeatId,
        row,
        units: summarizeCards(state, state.seats[boardSeatId].board[row].units, cardsBySourceId),
        horn: state.seats[boardSeatId].board[row].horn
          ? summarizeCards(state, [state.seats[boardSeatId].board[row].horn], cardsBySourceId).at(0) ?? null
          : null,
      })),
    ),
    weather: summarizeCards(state, state.weather.entries, cardsBySourceId),
    score: calculateScores({ state, catalogCards, catalogLeaders }),
    pendingPrompt: buildPromptSummary(state, seatId, cardsBySourceId),
  };
};
