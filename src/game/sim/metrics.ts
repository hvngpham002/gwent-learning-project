import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import { calculateScores, type GameEvent, type MatchState, type SeatId } from "@/game/core";

import type { SimulationCommand, SimulationStepLog, SimulationSummary, SimulationTerminalStatus } from "./types";

const isWeatherTarget = (command: SimulationCommand) =>
  command.type === "PlayCard" &&
  typeof command.target === "object" &&
  command.target !== null &&
  "kind" in command.target &&
  command.target.kind === "weather";

export const getWinner = (state: MatchState): SeatId | "draw" | null => {
  const gameEnd = state.phase === "game_end" ? state.roundHistory.at(-1) : null;
  if (!gameEnd) {
    return null;
  }

  const seatAGems = state.seats.seat_a.gems;
  const seatBGems = state.seats.seat_b.gems;
  if (seatAGems <= 0 && seatBGems <= 0) return "draw";
  if (seatAGems <= 0) return "seat_b";
  if (seatBGems <= 0) return "seat_a";
  return null;
};

export const buildSimulationSummary = ({
  status,
  state,
  steps,
  commandLog,
  events,
  policiesBySeat,
  maxSteps,
}: {
  status: SimulationTerminalStatus;
  state: MatchState;
  steps: readonly SimulationStepLog[];
  commandLog: readonly SimulationCommand[];
  events: readonly GameEvent[];
  policiesBySeat: Record<SeatId, string>;
  maxSteps: number;
}): SimulationSummary => {
  const scores = calculateScores({ state, catalogCards: currentCatalogCards, catalogLeaders: currentCatalogLeaders });
  const legalMoveTotal = steps.reduce((total, step) => total + step.legalMoveCount, 0);

  return {
    status,
    winner: getWinner(state),
    roundsPlayed: state.roundHistory.length,
    stepCount: steps.length,
    commandCount: commandLog.length,
    eventCount: events.length,
    policiesBySeat,
    finalGems: {
      seat_a: state.seats.seat_a.gems,
      seat_b: state.seats.seat_b.gems,
    },
    finalScores: scores.totalBySeat,
    passCount: events.filter((event) => event.type === "player_passed").length,
    roundsResolved: events.filter((event) => event.type === "round_resolved").length,
    averageLegalMoves: steps.length === 0 ? 0 : legalMoveTotal / steps.length,
    maxSteps,
    cardsPlayedBySeat: {
      seat_a: events.filter((event) => event.type === "card_played" && event.seatId === "seat_a").length,
      seat_b: events.filter((event) => event.type === "card_played" && event.seatId === "seat_b").length,
    },
    promptsResolved: events.filter((event) => event.type === "prompt_resolved").length,
    leaderUses: events.filter((event) => event.type === "leader_used").length,
    weatherCardsPlayed: commandLog.filter(isWeatherTarget).length,
  };
};
