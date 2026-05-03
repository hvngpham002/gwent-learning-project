import type { CatalogCardSource } from "@/game/catalog";

import type { CardInstanceId, MatchState, SeatId } from "./types";

const opponentOf = (seatId: SeatId): SeatId => (seatId === "seat_a" ? "seat_b" : "seat_a");

export interface OpponentDiscardDrawCandidate {
  readonly cardId: CardInstanceId;
  readonly sourceId: string;
  readonly label: string;
}

export interface GetOpponentDiscardDrawCandidatesInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogCards: readonly CatalogCardSource[];
}

export const getOpponentDiscardDrawCandidates = ({
  state,
  seatId,
  catalogCards,
}: GetOpponentDiscardDrawCandidatesInput): readonly OpponentDiscardDrawCandidate[] => {
  const lookup = new Map(catalogCards.map((card) => [card.sourceId, card]));
  const opponentSeatId = opponentOf(seatId);
  const discardOrder = state.seats[opponentSeatId].discard;
  const candidates: OpponentDiscardDrawCandidate[] = [];

  discardOrder.forEach((cardId) => {
    const instance = state.cardsById[cardId];
    if (!instance) {
      return;
    }
    const source = lookup.get(instance.sourceId);
    if (!source) {
      return;
    }
    candidates.push({
      cardId,
      sourceId: source.sourceId,
      label: `Draw ${source.name} from opponent discard`,
    });
  });

  return candidates;
};
