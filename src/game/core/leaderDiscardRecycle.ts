import type { CardInstanceId, MatchState, SeatId } from "./types";

const SEAT_ORDER: readonly SeatId[] = ["seat_a", "seat_b"];

export interface DiscardRecycleSeatPlan {
  readonly seatId: SeatId;
  readonly cardIds: readonly CardInstanceId[];
}

export interface DiscardRecyclePlan {
  readonly seats: readonly DiscardRecycleSeatPlan[];
  readonly totalCardCount: number;
}

export interface GetDiscardRecyclePlanInput {
  readonly state: MatchState;
}

export const getDiscardRecyclePlan = ({
  state,
}: GetDiscardRecyclePlanInput): DiscardRecyclePlan => {
  const seats: DiscardRecycleSeatPlan[] = [];
  let totalCardCount = 0;

  SEAT_ORDER.forEach((seatId) => {
    const discardOrder = state.seats[seatId].discard;
    const cardIds: CardInstanceId[] = [];
    discardOrder.forEach((cardId) => {
      const instance = state.cardsById[cardId];
      if (!instance) {
        return;
      }
      cardIds.push(cardId);
    });
    if (cardIds.length === 0) {
      return;
    }
    seats.push({ seatId, cardIds });
    totalCardCount += cardIds.length;
  });

  return { seats, totalCardCount };
};
