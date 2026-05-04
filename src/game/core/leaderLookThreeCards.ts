import type { CatalogCardSource } from "@/game/catalog";

import { createSeededRngFromState, shuffleWithRng } from "./rng";
import type { CardInstanceId, MatchState, SeatId } from "./types";

export const LOOK_THREE_CARDS_LEADER_SOURCE_ID =
  "nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard";

export const LOOK_THREE_CARDS_REVEAL_COUNT = 3;

const opponentOf = (seatId: SeatId): SeatId => (seatId === "seat_a" ? "seat_b" : "seat_a");

export interface LookThreeCardsEligibility {
  readonly canUse: boolean;
  readonly opponentHandCount: number;
  readonly revealCount: number;
}

export type LookThreeCardsRevealOutcome =
  | "revealed"
  | "no_opponent_hand";

export interface LookThreeCardsRevealPlan {
  readonly outcome: LookThreeCardsRevealOutcome;
  readonly opponentSeatId: SeatId;
  readonly candidateCardIds: readonly CardInstanceId[];
  readonly revealedCardIds: readonly CardInstanceId[];
  readonly revealedSourceIds: readonly string[];
  readonly rngAdvanced: boolean;
  readonly nextRngState: number;
}

export interface GetLookThreeCardsEligibilityInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
}

export const getLookThreeCardsEligibility = ({
  state,
  seatId,
}: GetLookThreeCardsEligibilityInput): LookThreeCardsEligibility => {
  const opponentSeatId = opponentOf(seatId);
  const opponentHandCount = state.seats[opponentSeatId].hand.length;
  const revealCount = Math.min(LOOK_THREE_CARDS_REVEAL_COUNT, opponentHandCount);
  return {
    canUse: opponentHandCount >= 1,
    opponentHandCount,
    revealCount,
  };
};

export interface PlanLookThreeCardsRevealInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogCards: readonly CatalogCardSource[];
}

export const planLookThreeCardsReveal = ({
  state,
  seatId,
  catalogCards,
}: PlanLookThreeCardsRevealInput): LookThreeCardsRevealPlan => {
  const opponentSeatId = opponentOf(seatId);
  const opponentHand = state.seats[opponentSeatId].hand;
  const lookup = new Map(catalogCards.map((card) => [card.sourceId, card]));

  if (opponentHand.length === 0) {
    return {
      outcome: "no_opponent_hand",
      opponentSeatId,
      candidateCardIds: [],
      revealedCardIds: [],
      revealedSourceIds: [],
      rngAdvanced: false,
      nextRngState: state.rng.state,
    };
  }

  // Build the candidate list using the opponent's natural hand order. Skip
  // missing card instances defensively. Cards whose catalog source is missing
  // remain candidates for selection but are not surfaced in the source ID
  // list (the spec recommends skipping missing catalog sources for display).
  const candidateCardIds: CardInstanceId[] = [];
  opponentHand.forEach((cardId) => {
    const instance = state.cardsById[cardId];
    if (!instance) {
      return;
    }
    candidateCardIds.push(cardId);
  });

  // RNG only advances when we actually need to pick a subset (length > 3).
  let revealedCardIds: CardInstanceId[];
  let rngAdvanced = false;
  let nextRngState = state.rng.state;

  if (candidateCardIds.length <= LOOK_THREE_CARDS_REVEAL_COUNT) {
    revealedCardIds = [...candidateCardIds];
  } else {
    const rng = createSeededRngFromState(state.rng.seed, state.rng.state);
    const shuffled = shuffleWithRng(candidateCardIds, rng);
    const selected = new Set<CardInstanceId>(shuffled.slice(0, LOOK_THREE_CARDS_REVEAL_COUNT));
    // Preserve opponent hand order in the revealed list for deterministic
    // event/display ordering, regardless of shuffle output order.
    revealedCardIds = candidateCardIds.filter((cardId) => selected.has(cardId));
    rngAdvanced = true;
    nextRngState = rng.getState();
  }

  const revealedSourceIds: string[] = [];
  revealedCardIds.forEach((cardId) => {
    const instance = state.cardsById[cardId];
    if (!instance) {
      return;
    }
    const source = lookup.get(instance.sourceId);
    if (!source) {
      return;
    }
    revealedSourceIds.push(source.sourceId);
  });

  return {
    outcome: "revealed",
    opponentSeatId,
    candidateCardIds,
    revealedCardIds,
    revealedSourceIds,
    rngAdvanced,
    nextRngState,
  };
};
