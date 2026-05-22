import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  buildSeatObservation,
  commandFromLegalMove,
  explainLegalHeuristicV1Decision,
  legalHeuristicPolicyV0,
  type AiDecisionTrace,
} from "@/game/ai";
import { executeCommand, getLegalMoves, startMatch, type LegalMove, type MatchConfig, type MatchState, type SeatId } from "@/game/core";

import { buildSimulationSummary, getWinner } from "./metrics";
import type {
  HeadlessMatchSimulationInput,
  HeadlessMatchSimulationResult,
  HeadlessSeatSimulationConfig,
  HeadlessSeatSimulationConfigs,
  ReplayHeadlessMatchCommandsInput,
  SimulationCommand,
  SimulationError,
  SimulationStepLog,
  SimulationTerminalStatus,
} from "./types";

const DEFAULT_MAX_STEPS = 300;
const SEATS: readonly SeatId[] = ["seat_a", "seat_b"];
const ROUND_END_POLICY_ID = "headless-round-end-auto-resolver";

const createDefaultSeatConfigs = (): HeadlessSeatSimulationConfigs => ({
  seat_a: {
    seatId: "seat_a",
    playerId: "sim-seat-a",
    controllerKind: "ai",
    faction: "northern_realms",
    deckPreset: currentNorthernRealmsDeckPreset,
  },
  seat_b: {
    seatId: "seat_b",
    playerId: "sim-seat-b",
    controllerKind: "ai",
    faction: "nilfgaard",
    deckPreset: currentNilfgaardDeckPreset,
  },
});

const normalizeSeatConfig = (seatId: SeatId, config: HeadlessSeatSimulationConfig): HeadlessSeatSimulationConfig => ({
  ...config,
  seatId,
  controllerKind: "ai",
});

export const createHeadlessSimulationConfig = (
  seed: string | number,
  seats?: HeadlessMatchSimulationInput["seats"],
): MatchConfig => {
  const resolvedSeats = seats ?? createDefaultSeatConfigs();

  return {
    matchId: `sim:${seed}`,
    seed,
    seats: [
      normalizeSeatConfig("seat_a", resolvedSeats.seat_a),
      normalizeSeatConfig("seat_b", resolvedSeats.seat_b),
    ],
    catalog: {
      cards: currentCatalogCards,
      leaders: currentCatalogLeaders,
    },
  };
};

const policyIds = (input: HeadlessMatchSimulationInput): Record<SeatId, string> => ({
  seat_a: input.policies?.seat_a?.id ?? legalHeuristicPolicyV0.id,
  seat_b: input.policies?.seat_b?.id ?? legalHeuristicPolicyV0.id,
});

const policyForSeat = (input: HeadlessMatchSimulationInput, seatId: SeatId) =>
  input.policies?.[seatId] ?? legalHeuristicPolicyV0;

export const getHeadlessActingSeat = (state: MatchState): SeatId | null => {
  if (state.pendingPrompt) {
    return state.pendingPrompt.seatId;
  }
  if (state.phase === "mulligan") {
    return SEATS.find((seatId) => !state.seats[seatId].mulliganComplete) ?? null;
  }
  if (state.phase === "playing") {
    return state.currentTurn;
  }
  if (state.phase === "round_end") {
    return "seat_a";
  }
  return null;
};

const selectMove = (
  input: HeadlessMatchSimulationInput,
  state: MatchState,
  seatId: SeatId,
  legalMoves: readonly LegalMove[],
  decisionIndex: number,
): { move: LegalMove | null; trace?: AiDecisionTrace } => {
  if (state.phase === "round_end") {
    return { move: legalMoves.find((move) => move.kind === "resolve_round_end") ?? null };
  }

  const policy = policyForSeat(input, seatId);
  const observation = buildSeatObservation({
    state,
    seatId,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

  const policyInput = { seatId, observation, legalMoves };
  if (input.collectDecisionTraces && policy.id === "legal-heuristic-v1") {
    const explanation = explainLegalHeuristicV1Decision(policyInput, { decisionIndex });
    return { move: explanation.move, trace: explanation.trace };
  }

  return { move: policy.selectMove(policyInput) };
};

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

const createResult = ({
  input,
  status,
  state,
  steps,
  commandLog,
  events,
  maxSteps,
  error,
  decisionTraces,
}: {
  input: HeadlessMatchSimulationInput;
  status: SimulationTerminalStatus;
  state: MatchState;
  steps: SimulationStepLog[];
  commandLog: SimulationCommand[];
  events: ReturnType<typeof startMatch>["events"];
  maxSteps: number;
  error?: SimulationError;
  decisionTraces?: readonly AiDecisionTrace[];
}): HeadlessMatchSimulationResult => {
  const policiesBySeat = policyIds(input);
  const summary = buildSimulationSummary({
    status,
    state,
    steps,
    commandLog,
    events,
    policiesBySeat,
    maxSteps,
  });

  return {
    status,
    seed: input.seed,
    matchId: state.matchId,
    finalState: state,
    winner: getWinner(state),
    steps,
    commandLog,
    events,
    summary,
    error,
    ...(decisionTraces ? { decisionTraces } : {}),
  };
};

export const runHeadlessMatchSimulation = (input: HeadlessMatchSimulationInput): HeadlessMatchSimulationResult => {
  const maxSteps = input.maxSteps ?? DEFAULT_MAX_STEPS;
  const started = startMatch(createHeadlessSimulationConfig(input.seed, input.seats));
  let state = started.state;
  const steps: SimulationStepLog[] = [];
  const commandLog: SimulationCommand[] = [];
  const events = [...started.events];
  const decisionTraces: AiDecisionTrace[] = [];

  for (let step = 1; step <= maxSteps; step += 1) {
    if (state.phase === "game_end") {
      return createResult({
        input,
        status: "completed",
        state,
        steps,
        commandLog,
        events,
        maxSteps,
        decisionTraces: input.collectDecisionTraces ? decisionTraces : undefined,
      });
    }

    const seatId = getHeadlessActingSeat(state);
    if (!seatId) {
      return createResult({
        input,
        status: "policy_failed",
        state,
        steps,
        commandLog,
        events,
        maxSteps,
        error: { code: "no_acting_seat", message: `No acting seat for phase ${state.phase}.`, step },
      });
    }

    const legalMoves = getLegalMoves({ state, seatId, catalogCards: currentCatalogCards, catalogLeaders: currentCatalogLeaders });
    const policyId = state.phase === "round_end" ? ROUND_END_POLICY_ID : policyForSeat(input, seatId).id;
    input.rootObserver?.({
      state,
      seatId,
      legalMoves,
      step,
      decisionIndex: steps.length,
      policyId,
    });

    let chosenMove: LegalMove | null;
    let decisionTrace: AiDecisionTrace | undefined;
    try {
      const selection = selectMove(input, state, seatId, legalMoves, decisionTraces.length);
      chosenMove = selection.move;
      decisionTrace = selection.trace;
    } catch (error) {
      return createResult({
        input,
        status: "policy_failed",
        state,
        steps,
        commandLog,
        events,
        maxSteps,
        error: { code: "policy_select_failed", message: toErrorMessage(error), step, seatId },
        decisionTraces: input.collectDecisionTraces ? decisionTraces : undefined,
      });
    }
    if (!chosenMove) {
      return createResult({
        input,
        status: "policy_failed",
        state,
        steps,
        commandLog,
        events,
        maxSteps,
        error: { code: "no_move_selected", message: `No legal move selected for ${seatId}.`, step, seatId },
        decisionTraces: input.collectDecisionTraces ? decisionTraces : undefined,
      });
    }
    if (!legalMoves.some((move) => move.moveId === chosenMove.moveId)) {
      return createResult({
        input,
        status: "policy_failed",
        state,
        steps,
        commandLog,
        events,
        maxSteps,
        error: { code: "illegal_policy_move", message: `Policy selected a move outside the legal move list.`, step, seatId },
        decisionTraces: input.collectDecisionTraces ? decisionTraces : undefined,
      });
    }

    const command = commandFromLegalMove(chosenMove);
    if (!command) {
      return createResult({
        input,
        status: "policy_failed",
        state,
        steps,
        commandLog,
        events,
        maxSteps,
        error: { code: "move_command_conversion_failed", message: `Could not convert ${chosenMove.moveId}.`, step, seatId },
        decisionTraces: input.collectDecisionTraces ? decisionTraces : undefined,
      });
    }

    try {
      const phaseBeforeCommand = state.phase;
      const transaction = executeCommand({ state, command, catalogCards: currentCatalogCards, catalogLeaders: currentCatalogLeaders });
      state = transaction.state;
      commandLog.push(command);
      events.push(...transaction.events);
      steps.push({
        step,
        phase: phaseBeforeCommand,
        round: phaseBeforeCommand === "round_end" ? state.lastResolvedRound ?? state.round : state.round,
        seatId,
        policyId: phaseBeforeCommand === "round_end" ? ROUND_END_POLICY_ID : policyForSeat(input, seatId).id,
        legalMoveCount: legalMoves.length,
        chosenMoveId: chosenMove.moveId,
        chosenMoveKind: chosenMove.kind,
        commandType: command.type,
        eventTypes: transaction.events.map((event) => event.type),
      });
      if (decisionTrace) {
        decisionTraces.push(decisionTrace);
      }
    } catch (error) {
      return createResult({
        input,
        status: "engine_error",
        state,
        steps,
        commandLog,
        events,
        maxSteps,
        error: { code: "engine_command_failed", message: toErrorMessage(error), step, seatId },
        decisionTraces: input.collectDecisionTraces ? decisionTraces : undefined,
      });
    }
  }

  return createResult({
    input,
    status: "max_steps_exceeded",
    state,
    steps,
    commandLog,
    events,
    maxSteps,
    error: {
      code: "max_steps_exceeded",
      message: `Simulation exceeded ${maxSteps} steps before game_end.`,
      step: maxSteps,
    },
    decisionTraces: input.collectDecisionTraces ? decisionTraces : undefined,
  });
};

export const replayHeadlessMatchCommands = ({ seed, commandLog, seats }: ReplayHeadlessMatchCommandsInput): MatchState => {
  let state = startMatch(createHeadlessSimulationConfig(seed, seats)).state;

  commandLog.forEach((command, index) => {
    const transaction = executeCommand({ state, command, catalogCards: currentCatalogCards, catalogLeaders: currentCatalogLeaders });
    state = transaction.state;

    if (state.phase === "game_end" && index < commandLog.length - 1) {
      throw new Error(`Replay reached game_end before command ${index + 2}.`);
    }
  });

  return state;
};
