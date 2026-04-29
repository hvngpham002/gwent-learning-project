import { createSelector } from "@reduxjs/toolkit";

import { CATALOG_LEADER_ABILITY_METADATA, type CatalogCardSource, type CatalogLeaderSource, type CatalogRow } from "@/game/catalog";
import {
  calculateScores,
  getLegalMoves,
  type CardInstance,
  type CardInstanceId,
  type MatchState,
  type SeatId,
  type ZoneRef,
} from "@/game/core";
import type { RootState } from "@/store";

const ROWS: readonly CatalogRow[] = ["close", "ranged", "siege"];

export interface EngineCardViewModel {
  instanceId: CardInstanceId;
  sourceId: string;
  name: string;
  image: string;
  kind: CatalogCardSource["kind"] | "leader";
  faction: CatalogCardSource["faction"] | CatalogLeaderSource["faction"];
  rows: CatalogRow[];
  abilities: CatalogCardSource["abilities"] | [CatalogLeaderSource["ability"]];
  printedStrength: number;
  owner: SeatId;
  controller: SeatId;
  zone: ZoneRef;
}

export interface EngineBoardRowViewModel {
  seatId: SeatId;
  row: CatalogRow;
  units: EngineCardViewModel[];
  horn: EngineCardViewModel | null;
}

export const selectEngineState = (state: RootState) => state.engine;
export const selectEngineRuntimeCatalog = (state: RootState) => state.engine.runtimeCatalog;
export const selectEngineRuntimeCatalogCards = (state: RootState) => state.engine.runtimeCatalog.cards;
export const selectEngineRuntimeCatalogLeaders = (state: RootState) => state.engine.runtimeCatalog.leaders;
export const selectEngineMatch = (state: RootState) => state.engine.match;
export const selectEngineStatus = (state: RootState) => state.engine.status;
export const selectEngineLock = (state: RootState) => state.engine.lock;
export const selectEnginePrompt = createSelector(selectEngineMatch, (match) => match?.pendingPrompt ?? null);
export const selectEngineCurrentSeat = createSelector(selectEngineMatch, (match) => match?.currentTurn ?? null);
export const selectEngineHumanSeat = (state: RootState) => state.engine.seatMap.human;
export const selectEngineAiSeat = (state: RootState) => state.engine.seatMap.ai;
export const selectEngineRoundHistory = createSelector(selectEngineMatch, (match) => match?.roundHistory ?? []);
export const selectEngineLastError = (state: RootState) => state.engine.lastError;
export const selectEngineSeed = createSelector(selectEngineMatch, (match) => match?.rng.seed ?? null);
export const selectEngineSelectedCardId = (state: RootState) => state.engine.selectedCardId;
export const selectEngineSelectedCardIds = (state: RootState) => state.engine.selectedCardIds;

const selectCardSourceById = createSelector(selectEngineRuntimeCatalogCards, (cards) => new Map(cards.map((card) => [card.sourceId, card])));
const selectLeaderSourceById = createSelector(selectEngineRuntimeCatalogLeaders, (leaders) => new Map(leaders.map((leader) => [leader.sourceId, leader])));

const toCardViewModel = (
  instance: CardInstance,
  cardSourceById: ReadonlyMap<string, CatalogCardSource>,
  leaderSourceById: ReadonlyMap<string, CatalogLeaderSource>,
): EngineCardViewModel | null => {
  if (instance.sourceKind === "leader") {
    const source = leaderSourceById.get(instance.sourceId);
    return source
      ? {
          instanceId: instance.instanceId,
          sourceId: instance.sourceId,
          name: source.name,
          image: source.image,
          kind: "leader",
          faction: source.faction,
          rows: [],
          abilities: [source.ability],
          printedStrength: 0,
          owner: instance.owner,
          controller: instance.controller,
          zone: instance.zone,
        }
      : null;
  }

  const source = cardSourceById.get(instance.sourceId);
  return source
    ? {
        instanceId: instance.instanceId,
        sourceId: instance.sourceId,
        name: source.name,
        image: source.image,
        kind: source.kind,
        faction: source.faction,
        rows: source.rows,
        abilities: source.abilities,
        printedStrength: source.strength,
        owner: instance.owner,
        controller: instance.controller,
        zone: instance.zone,
      }
    : null;
};

const cardIdsToViewModels = (
  match: MatchState,
  cardIds: readonly CardInstanceId[],
  cardSourceById: ReadonlyMap<string, CatalogCardSource>,
  leaderSourceById: ReadonlyMap<string, CatalogLeaderSource>,
) =>
  cardIds.flatMap((cardId) => {
    const instance = match.cardsById[cardId];
    const viewModel = instance ? toCardViewModel(instance, cardSourceById, leaderSourceById) : null;
    return viewModel ? [viewModel] : [];
  });

export const selectEngineLegalMovesForSeat = (seatId: SeatId) =>
  createSelector(selectEngineMatch, selectEngineRuntimeCatalog, (match, runtimeCatalog) =>
    match
      ? getLegalMoves({
          state: match,
          seatId,
          catalogCards: runtimeCatalog.cards,
          catalogLeaders: runtimeCatalog.leaders,
        })
      : [],
  );

export const selectEngineLegalMovesForHuman = createSelector(
  selectEngineMatch,
  selectEngineHumanSeat,
  selectEngineRuntimeCatalog,
  (match, humanSeat, runtimeCatalog) =>
    match
      ? getLegalMoves({
          state: match,
          seatId: humanSeat,
          catalogCards: runtimeCatalog.cards,
          catalogLeaders: runtimeCatalog.leaders,
        })
      : [],
);

export const selectEngineLegalMovesForAi = createSelector(selectEngineMatch, selectEngineAiSeat, selectEngineRuntimeCatalog, (match, aiSeat, runtimeCatalog) =>
  match
    ? getLegalMoves({
        state: match,
        seatId: aiSeat,
        catalogCards: runtimeCatalog.cards,
        catalogLeaders: runtimeCatalog.leaders,
      })
    : [],
);

const canSeatAct = (state: RootState, seatId: SeatId) => {
  const match = selectEngineMatch(state);
  const lock = selectEngineLock(state);
  if (!match || match.phase === "game_end") {
    return false;
  }

  if (lock) {
    return lock.kind === "prompt" && lock.owner === seatId;
  }

  if (match.pendingPrompt) {
    return match.pendingPrompt.seatId === seatId;
  }

  if (match.phase === "mulligan") {
    return !match.seats[seatId].mulliganComplete;
  }

  if (match.phase === "playing") {
    return match.currentTurn === seatId && !match.seats[seatId].passed;
  }

  if (match.phase === "round_end") {
    return match.seats.seat_a.passed && match.seats.seat_b.passed;
  }

  return false;
};

export const selectEngineCanHumanAct = (state: RootState) => canSeatAct(state, state.engine.seatMap.human);
export const selectEngineCanAiAct = (state: RootState) => canSeatAct(state, state.engine.seatMap.ai);

export const selectEngineScoreBreakdown = createSelector(selectEngineMatch, selectEngineRuntimeCatalog, (match, runtimeCatalog) =>
  match ? calculateScores({ state: match, catalogCards: runtimeCatalog.cards, catalogLeaders: runtimeCatalog.leaders }) : null,
);

export const selectEngineGameWinner = createSelector(selectEngineMatch, (match) => {
  if (!match || match.phase !== "game_end") {
    return null;
  }
  const lastRound = match.roundHistory[match.roundHistory.length - 1];
  if (!lastRound) {
    return null;
  }
  const seatsOut = (["seat_a", "seat_b"] as const).filter((seatId) => match.seats[seatId].gems <= 0);
  if (seatsOut.length === 2) {
    return "draw";
  }
  if (seatsOut.length === 1) {
    return seatsOut[0] === "seat_a" ? "seat_b" : "seat_a";
  }
  return null;
});

export const selectEngineHumanHand = createSelector(selectEngineMatch, selectEngineHumanSeat, selectCardSourceById, selectLeaderSourceById, (match, humanSeat, cardById, leaderById) =>
  match ? cardIdsToViewModels(match, match.seats[humanSeat].hand, cardById, leaderById) : [],
);

export const selectEngineAiHandCount = createSelector(selectEngineMatch, selectEngineAiSeat, (match, aiSeat) =>
  match ? match.seats[aiSeat].hand.length : 0,
);

export const selectEngineDebugAiHandCards = createSelector(selectEngineMatch, selectEngineAiSeat, selectCardSourceById, selectLeaderSourceById, (match, aiSeat, cardById, leaderById) =>
  match ? cardIdsToViewModels(match, match.seats[aiSeat].hand, cardById, leaderById) : [],
);

export const selectEngineBoardRows = createSelector(selectEngineMatch, selectCardSourceById, selectLeaderSourceById, (match, cardById, leaderById): EngineBoardRowViewModel[] => {
  if (!match) {
    return [];
  }

  return (["seat_a", "seat_b"] as const).flatMap((seatId) =>
    ROWS.map((row) => ({
      seatId,
      row,
      units: cardIdsToViewModels(match, match.seats[seatId].board[row].units, cardById, leaderById),
      horn: match.seats[seatId].board[row].horn
        ? cardIdsToViewModels(match, [match.seats[seatId].board[row].horn], cardById, leaderById).at(0) ?? null
        : null,
    })),
  );
});

export const selectEngineWeatherCards = createSelector(selectEngineMatch, selectCardSourceById, selectLeaderSourceById, (match, cardById, leaderById) =>
  match ? cardIdsToViewModels(match, match.weather.entries, cardById, leaderById) : [],
);

export const selectEngineDiscardCounts = createSelector(selectEngineMatch, (match) =>
  match
    ? {
        seat_a: match.seats.seat_a.discard.length,
        seat_b: match.seats.seat_b.discard.length,
      }
    : { seat_a: 0, seat_b: 0 },
);

export const selectEngineDiscardCards = createSelector(selectEngineMatch, selectCardSourceById, selectLeaderSourceById, (match, cardById, leaderById) =>
  match
    ? {
        seat_a: cardIdsToViewModels(match, match.seats.seat_a.discard, cardById, leaderById),
        seat_b: cardIdsToViewModels(match, match.seats.seat_b.discard, cardById, leaderById),
      }
    : { seat_a: [], seat_b: [] },
);

export const selectEngineDeckCounts = createSelector(selectEngineMatch, (match) =>
  match
    ? {
        seat_a: match.seats.seat_a.deck.length,
        seat_b: match.seats.seat_b.deck.length,
      }
    : { seat_a: 0, seat_b: 0 },
);

const toLeaderStatus = (
  match: MatchState,
  seatId: SeatId,
  leaderSourceById: ReadonlyMap<string, CatalogLeaderSource>,
) => {
  const seat = match.seats[seatId];
  const leader = leaderSourceById.get(seat.leaderSourceId);
  const abilityMetadata = leader ? CATALOG_LEADER_ABILITY_METADATA[leader.ability] : null;

  return {
    leaderCardId: seat.leader,
    sourceId: seat.leaderSourceId,
    name: leader?.name ?? seat.leaderSourceId,
    image: leader?.image ?? "",
    ability: leader?.ability ?? null,
    abilityName: abilityMetadata?.name ?? "Unknown",
    abilityStatus: abilityMetadata?.status ?? "placeholder",
    used: seat.leaderUsed,
  };
};

export const selectEngineLeaderStatus = createSelector(selectEngineMatch, selectLeaderSourceById, (match, leaderById) =>
  match
    ? {
        seat_a: toLeaderStatus(match, "seat_a", leaderById),
        seat_b: toLeaderStatus(match, "seat_b", leaderById),
      }
    : null,
);
