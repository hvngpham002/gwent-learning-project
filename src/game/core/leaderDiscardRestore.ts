import type { CatalogCardSource } from "@/game/catalog";

import type { CardInstanceId, MatchState, SeatId } from "./types";

export interface RestoreDiscardCandidate {
  readonly cardId: CardInstanceId;
  readonly sourceId: string;
  readonly label: string;
}

export interface GetRestoreDiscardCandidatesInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogCards: readonly CatalogCardSource[];
}

export const getRestoreDiscardCandidates = ({
  state,
  seatId,
  catalogCards,
}: GetRestoreDiscardCandidatesInput): readonly RestoreDiscardCandidate[] => {
  const lookup = new Map(catalogCards.map((card) => [card.sourceId, card]));
  const discardOrder = state.seats[seatId].discard;
  const candidates: RestoreDiscardCandidate[] = [];

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
      label: `Restore ${source.name} to hand`,
    });
  });

  return candidates;
};
