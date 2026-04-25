import type { Action, ThunkAction } from "@reduxjs/toolkit";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  EngineRuleError,
  executeCommand,
  startMatch,
  type ControllerKind,
  type EngineCommand,
  type MatchConfig,
  type SeatId,
} from "@/game/core";
import {
  engineAdapterErrorSet,
  engineCommandApplied,
  engineCommandRejected,
  engineCommandResolving,
  engineMatchStarted,
  type EngineAdapterError,
  type EngineAdapterState,
} from "@/store/slices/engineSlice";
import type { RootState } from "@/store";

type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action>;

export interface StartEngineMatchOptions {
  seed?: string | number;
  matchId?: string;
  humanSeat?: SeatId;
  aiSeat?: SeatId;
  playerIds?: Partial<Record<SeatId, string>>;
  controllerKinds?: Partial<Record<SeatId, ControllerKind>>;
}

const toAdapterError = (error: unknown): EngineAdapterError => {
  if (error instanceof EngineRuleError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: "adapter_error",
      message: error.message,
    };
  }

  return {
    code: "adapter_error",
    message: "Unknown engine adapter error.",
    details: error,
  };
};

const createDefaultConfig = ({
  seed = Date.now(),
  matchId,
  playerIds = {},
  controllerKinds = {},
}: StartEngineMatchOptions): MatchConfig => ({
  matchId,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: playerIds.seat_a ?? "human",
      controllerKind: controllerKinds.seat_a ?? "human",
      faction: "northern_realms",
      deckPreset: currentNorthernRealmsDeckPreset,
    },
    {
      seatId: "seat_b",
      playerId: playerIds.seat_b ?? "ai",
      controllerKind: controllerKinds.seat_b ?? "ai",
      faction: "nilfgaard",
      deckPreset: currentNilfgaardDeckPreset,
    },
  ],
  catalog: {
    cards: currentCatalogCards,
    leaders: currentCatalogLeaders,
  },
});

export const startEngineMatch =
  (options: StartEngineMatchOptions = {}): AppThunk =>
  (dispatch) => {
    try {
      const transaction = startMatch(createDefaultConfig(options));
      dispatch(
        engineMatchStarted({
          match: transaction.state,
          events: transaction.events,
          seatMap: {
            human: options.humanSeat ?? "seat_a",
            ai: options.aiSeat ?? "seat_b",
          },
        }),
      );
    } catch (error) {
      dispatch(engineAdapterErrorSet(toAdapterError(error)));
    }
  };

const nextSequence = (engine: EngineAdapterState) => engine.commandHistory.length + 1;

export const dispatchEngineCommand =
  (command: Exclude<EngineCommand, { type: "StartMatch" }>): AppThunk =>
  (dispatch, getState) => {
    const engine = getState().engine;
    const sequence = nextSequence(engine);

    if (!engine.match) {
      dispatch(
        engineCommandRejected({
          command,
          sequence,
          error: {
            code: "missing_match",
            message: "Start an engine match before dispatching engine commands.",
          },
        }),
      );
      return;
    }

    if (engine.lock && engine.lock.kind !== "prompt") {
      dispatch(
        engineCommandRejected({
          command,
          sequence,
          error: {
            code: "action_locked",
            message: `Engine adapter is locked by ${engine.lock.kind}.`,
            details: engine.lock,
          },
        }),
      );
      return;
    }

    dispatch(engineCommandResolving({ command, sequence }));

    try {
      const transaction = executeCommand({
        state: engine.match,
        command,
        catalogCards: currentCatalogCards,
        catalogLeaders: currentCatalogLeaders,
      });
      dispatch(engineCommandApplied({ command, match: transaction.state, events: transaction.events, sequence }));
    } catch (error) {
      dispatch(engineCommandRejected({ command, sequence, error: toAdapterError(error) }));
    }
  };

export const resolveEngineRoundEnd = (seatId?: SeatId): AppThunk =>
  dispatchEngineCommand({ type: "ResolveRoundEnd", seatId });
