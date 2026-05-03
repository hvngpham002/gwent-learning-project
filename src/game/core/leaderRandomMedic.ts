import type { CatalogCardSource, CatalogLeaderSource, CatalogRow } from "@/game/catalog";

import { createSeededRngFromState, type SeededRng } from "./rng";
import type { CardInstanceId, MatchState, SeatId } from "./types";

export const RANDOM_MEDIC_LEADER_SOURCE_ID =
  "nilfgaard.emhyr-var-emreis-invader-of-the-north";

const ROW_ORDER: readonly CatalogRow[] = ["close", "ranged", "siege"];

const opponentOf = (seatId: SeatId): SeatId =>
  seatId === "seat_a" ? "seat_b" : "seat_a";

export interface RandomMedicCandidate {
  readonly cardId: CardInstanceId;
  readonly sourceId: string;
  readonly row: CatalogRow;
  readonly boardSeat: SeatId;
}

export interface HasRandomMedicPolicyInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogLeaders?: readonly CatalogLeaderSource[];
}

export const hasRandomMedicPolicyForSeat = ({
  state,
  seatId,
  catalogLeaders,
}: HasRandomMedicPolicyInput): boolean => {
  const seat = state.seats[seatId];
  if (!seat) {
    return false;
  }
  if (seat.leaderSourceId !== RANDOM_MEDIC_LEADER_SOURCE_ID) {
    return false;
  }
  if (!catalogLeaders) {
    return true;
  }
  const leader = catalogLeaders.find(
    (entry) => entry.sourceId === seat.leaderSourceId,
  );
  return Boolean(leader && leader.ability === "random_medic");
};

export interface GetRandomMedicCandidatesInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogCards: readonly CatalogCardSource[];
}

export const getRandomMedicCandidates = ({
  state,
  seatId,
  catalogCards,
}: GetRandomMedicCandidatesInput): readonly RandomMedicCandidate[] => {
  const lookup = new Map(catalogCards.map((card) => [card.sourceId, card]));
  const discardOrder = state.seats[seatId]?.discard ?? [];
  const candidates: RandomMedicCandidate[] = [];

  discardOrder.forEach((cardId) => {
    const instance = state.cardsById[cardId];
    if (!instance) {
      return;
    }
    const source = lookup.get(instance.sourceId);
    if (!source) {
      return;
    }
    if (source.kind !== "unit") {
      return;
    }
    const row = ROW_ORDER.find((candidateRow) => source.rows.includes(candidateRow));
    if (!row) {
      return;
    }
    const boardSeat = source.abilities.includes("spy") ? opponentOf(seatId) : seatId;
    candidates.push({
      cardId,
      sourceId: source.sourceId,
      row,
      boardSeat,
    });
  });

  return candidates;
};

export interface ChooseRandomMedicCandidateInput {
  readonly candidates: readonly RandomMedicCandidate[];
  readonly rngSeed: string | number;
  readonly rngState: number;
}

export interface ChooseRandomMedicCandidateResult {
  readonly candidate: RandomMedicCandidate | null;
  readonly nextRngState: number;
  readonly advanced: boolean;
}

export const chooseRandomMedicCandidate = ({
  candidates,
  rngSeed,
  rngState,
}: ChooseRandomMedicCandidateInput): ChooseRandomMedicCandidateResult => {
  if (candidates.length === 0) {
    return { candidate: null, nextRngState: rngState, advanced: false };
  }
  if (candidates.length === 1) {
    return { candidate: candidates[0], nextRngState: rngState, advanced: false };
  }
  const rng: SeededRng = createSeededRngFromState(rngSeed, rngState);
  const index = Math.floor(rng.next() * candidates.length);
  const safeIndex = Math.min(Math.max(index, 0), candidates.length - 1);
  return {
    candidate: candidates[safeIndex],
    nextRngState: rng.getState(),
    advanced: true,
  };
};
