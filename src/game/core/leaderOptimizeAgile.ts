import type { CatalogCardSource, CatalogLeaderSource, CatalogRow } from "@/game/catalog";

import { calculateScores } from "./scoring";
import type { CardInstanceId, MatchState, SeatId, ZoneRef } from "./types";

const ROW_ORDER: readonly CatalogRow[] = ["close", "ranged", "siege"];

export type OptimizeAgileRowsOutcome =
  | "no_eligible"
  | "no_candidate_row"
  | "no_executable_row"
  | "auto"
  | "choice";

export interface OptimizeAgileRowsEligibleCard {
  readonly cardId: CardInstanceId;
  readonly sourceId: string;
  readonly currentRow: CatalogRow;
  readonly legalRows: readonly CatalogRow[];
}

export interface OptimizeAgileRowsCandidate {
  readonly row: CatalogRow;
  readonly score: number;
  readonly movedCardIds: readonly CardInstanceId[];
}

export interface OptimizeAgileRowsPlan {
  readonly outcome: OptimizeAgileRowsOutcome;
  readonly currentScore: number;
  readonly bestScore?: number;
  readonly eligibleCardIds: readonly CardInstanceId[];
  readonly eligibleCards: readonly OptimizeAgileRowsEligibleCard[];
  readonly candidates: readonly OptimizeAgileRowsCandidate[];
  readonly bestCandidates: readonly OptimizeAgileRowsCandidate[];
}

export interface PlanOptimizeAgileRowsInput {
  readonly state: MatchState;
  readonly seatId: SeatId;
  readonly catalogCards: readonly CatalogCardSource[];
  readonly catalogLeaders: readonly CatalogLeaderSource[];
}

const cloneState = (state: MatchState): MatchState => structuredClone(state);

const intersectRows = (
  primary: readonly CatalogRow[],
  cards: readonly OptimizeAgileRowsEligibleCard[],
): CatalogRow[] => {
  if (primary.length === 0) {
    return [];
  }
  return primary.filter((row) => cards.every((card) => card.legalRows.includes(row)));
};

const collectEligibleCards = (
  state: MatchState,
  seatId: SeatId,
  catalogLookup: ReadonlyMap<string, CatalogCardSource>,
): OptimizeAgileRowsEligibleCard[] => {
  const eligible: OptimizeAgileRowsEligibleCard[] = [];
  ROW_ORDER.forEach((row) => {
    const units = state.seats[seatId].board[row].units;
    units.forEach((cardId) => {
      const instance = state.cardsById[cardId];
      if (!instance) {
        return;
      }
      // Acting seat must own and control the card on its own board side.
      if (instance.controller !== seatId) {
        return;
      }
      const source = catalogLookup.get(instance.sourceId);
      if (!source) {
        return;
      }
      if (source.kind !== "unit") {
        return;
      }
      if (!source.abilities.includes("agile")) {
        return;
      }
      if (source.rows.length < 2) {
        return;
      }
      eligible.push({
        cardId,
        sourceId: source.sourceId,
        currentRow: row,
        legalRows: [...source.rows],
      });
    });
  });
  return eligible;
};

const moveSimulatedCard = (
  state: MatchState,
  seatId: SeatId,
  cardId: CardInstanceId,
  fromRow: CatalogRow,
  toRow: CatalogRow,
): void => {
  if (fromRow === toRow) {
    return;
  }
  const fromUnits = state.seats[seatId].board[fromRow].units;
  const index = fromUnits.indexOf(cardId);
  if (index >= 0) {
    fromUnits.splice(index, 1);
  }
  state.seats[seatId].board[toRow].units.push(cardId);
  const instance = state.cardsById[cardId];
  if (instance) {
    const zone: ZoneRef = { kind: "board_row", seat: seatId, row: toRow };
    instance.zone = zone;
  }
};

const evaluateCandidateRow = (
  baseState: MatchState,
  seatId: SeatId,
  catalogCards: readonly CatalogCardSource[],
  catalogLeaders: readonly CatalogLeaderSource[],
  eligibleCards: readonly OptimizeAgileRowsEligibleCard[],
  candidateRow: CatalogRow,
): { score: number; movedCardIds: CardInstanceId[] } => {
  const movedCardIds: CardInstanceId[] = [];
  const simulated = cloneState(baseState);
  eligibleCards.forEach((card) => {
    if (card.currentRow === candidateRow) {
      return;
    }
    moveSimulatedCard(simulated, seatId, card.cardId, card.currentRow, candidateRow);
    movedCardIds.push(card.cardId);
  });
  const breakdown = calculateScores({
    state: simulated,
    catalogCards,
    catalogLeaders,
  });
  return { score: breakdown.totalBySeat[seatId], movedCardIds };
};

export const planOptimizeAgileRows = ({
  state,
  seatId,
  catalogCards,
  catalogLeaders,
}: PlanOptimizeAgileRowsInput): OptimizeAgileRowsPlan => {
  const catalogLookup = new Map(catalogCards.map((card) => [card.sourceId, card]));
  const eligibleCards = collectEligibleCards(state, seatId, catalogLookup);
  const eligibleCardIds = eligibleCards.map((entry) => entry.cardId);

  const currentBreakdown = calculateScores({ state, catalogCards, catalogLeaders });
  const currentScore = currentBreakdown.totalBySeat[seatId];

  if (eligibleCards.length === 0) {
    return {
      outcome: "no_eligible",
      currentScore,
      eligibleCardIds,
      eligibleCards,
      candidates: [],
      bestCandidates: [],
    };
  }

  const commonRows = intersectRows(ROW_ORDER, eligibleCards);
  if (commonRows.length === 0) {
    return {
      outcome: "no_candidate_row",
      currentScore,
      eligibleCardIds,
      eligibleCards,
      candidates: [],
      bestCandidates: [],
    };
  }

  const candidates: OptimizeAgileRowsCandidate[] = commonRows.map((row) => {
    const evaluation = evaluateCandidateRow(
      state,
      seatId,
      catalogCards,
      catalogLeaders,
      eligibleCards,
      row,
    );
    return {
      row,
      score: evaluation.score,
      movedCardIds: evaluation.movedCardIds,
    };
  });

  const bestScore = candidates.reduce((max, candidate) => Math.max(max, candidate.score), -Infinity);
  const bestCandidates = candidates.filter(
    (candidate) => candidate.score === bestScore && candidate.movedCardIds.length > 0,
  );
  if (bestCandidates.length === 0) {
    return {
      outcome: "no_executable_row",
      currentScore,
      eligibleCardIds,
      eligibleCards,
      candidates,
      bestCandidates: [],
    };
  }

  return {
    outcome: bestCandidates.length > 1 ? "choice" : "auto",
    currentScore,
    bestScore,
    eligibleCardIds,
    eligibleCards,
    candidates,
    bestCandidates,
  };
};
