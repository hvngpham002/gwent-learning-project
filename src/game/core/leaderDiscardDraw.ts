import type { CatalogCardSource } from "@/game/catalog";

import type { CardInstanceId, MatchState, SeatId } from "./types";

export const DISCARD_TWO_DRAW_ONE_LEADER_SOURCE_ID = "monsters.eredin-destroyer-of-worlds";

export const MIN_DISCARD_COUNT = 1;
export const MAX_DISCARD_COUNT = 2;

export interface DiscardDrawEligibility {
  readonly canUse: boolean;
  readonly handCount: number;
  readonly deckCount: number;
  readonly maxDiscardCount: typeof MAX_DISCARD_COUNT;
  readonly minDiscardCount: typeof MIN_DISCARD_COUNT;
}

export interface DiscardSelectionOption {
  readonly optionId: string;
  readonly label: string;
  readonly cardIds: readonly CardInstanceId[];
  readonly sourceIds: readonly string[];
}

export interface DeckDrawOption {
  readonly optionId: string;
  readonly label: string;
  readonly cardId: CardInstanceId;
  readonly sourceId: string;
}

export interface GetDiscardDrawEligibilityInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
}

export const getDiscardDrawEligibility = ({
  state,
  seatId,
}: GetDiscardDrawEligibilityInput): DiscardDrawEligibility => {
  const seat = state.seats[seatId];
  const handCount = seat.hand.length;
  const deckCount = seat.deck.length;
  return {
    canUse: handCount >= MIN_DISCARD_COUNT && deckCount >= 1,
    handCount,
    deckCount,
    maxDiscardCount: MAX_DISCARD_COUNT,
    minDiscardCount: MIN_DISCARD_COUNT,
  };
};

export interface BuildDiscardSelectionOptionsInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogCards: readonly CatalogCardSource[];
}

interface ResolvedHandCard {
  readonly cardId: CardInstanceId;
  readonly sourceId: string;
  readonly name: string;
}

const resolveHandCards = (
  state: MatchState,
  seatId: SeatId,
  lookup: ReadonlyMap<string, CatalogCardSource>,
): ResolvedHandCard[] => {
  const resolved: ResolvedHandCard[] = [];
  state.seats[seatId].hand.forEach((cardId) => {
    const instance = state.cardsById[cardId];
    if (!instance) {
      return;
    }
    const source = lookup.get(instance.sourceId);
    if (!source) {
      return;
    }
    resolved.push({ cardId, sourceId: source.sourceId, name: source.name });
  });
  return resolved;
};

export const buildDiscardSelectionOptions = ({
  state,
  seatId,
  catalogCards,
}: BuildDiscardSelectionOptionsInput): readonly DiscardSelectionOption[] => {
  const lookup = new Map(catalogCards.map((card) => [card.sourceId, card]));
  const handCards = resolveHandCards(state, seatId, lookup);
  const options: DiscardSelectionOption[] = [];

  handCards.forEach((card) => {
    options.push({
      optionId: `discard-draw:discard:${card.cardId}`,
      label: `Discard ${card.name}`,
      cardIds: [card.cardId],
      sourceIds: [card.sourceId],
    });
  });

  for (let leftIndex = 0; leftIndex < handCards.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < handCards.length; rightIndex += 1) {
      const left = handCards[leftIndex];
      const right = handCards[rightIndex];
      options.push({
        optionId: `discard-draw:discard:${left.cardId}+${right.cardId}`,
        label: `Discard ${left.name} + ${right.name}`,
        cardIds: [left.cardId, right.cardId],
        sourceIds: [left.sourceId, right.sourceId],
      });
    }
  }

  return options;
};

export interface BuildDeckDrawOptionsInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogCards: readonly CatalogCardSource[];
}

export const buildDeckDrawOptions = ({
  state,
  seatId,
  catalogCards,
}: BuildDeckDrawOptionsInput): readonly DeckDrawOption[] => {
  const lookup = new Map(catalogCards.map((card) => [card.sourceId, card]));
  const options: DeckDrawOption[] = [];

  state.seats[seatId].deck.forEach((cardId) => {
    const instance = state.cardsById[cardId];
    if (!instance) {
      return;
    }
    const source = lookup.get(instance.sourceId);
    if (!source) {
      return;
    }
    options.push({
      optionId: `discard-draw:draw:${cardId}`,
      label: `Draw ${source.name} from deck`,
      cardId,
      sourceId: source.sourceId,
    });
  });

  return options;
};
