import type { Action, ThunkAction } from "@reduxjs/toolkit";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentDeckPresets,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import type { CatalogCardSource, CatalogDeckPreset, CatalogLeaderSource } from "@/game/catalog";
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
  engineSelectionCleared,
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
  humanDeckPresetId?: string;
  aiDeckPresetId?: string;
  humanDeckPreset?: CatalogDeckPreset;
  aiDeckPreset?: CatalogDeckPreset;
  catalogCards?: readonly CatalogCardSource[];
  catalogLeaders?: readonly CatalogLeaderSource[];
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
  humanDeckPresetId,
  aiDeckPresetId,
  humanDeckPreset,
  aiDeckPreset,
  catalogCards = currentCatalogCards,
  catalogLeaders = currentCatalogLeaders,
  playerIds = {},
  controllerKinds = {},
}: StartEngineMatchOptions): MatchConfig => {
  const presetById = new Map<string, CatalogDeckPreset>(currentDeckPresets.map((preset) => [preset.presetId, preset]));
  const findPreset = (presetId: string | undefined, fallback: CatalogDeckPreset) => {
    if (!presetId) {
      return fallback;
    }
    const preset = presetById.get(presetId);
    if (!preset) {
      throw new Error(`Unknown catalog deck preset: ${presetId}`);
    }
    return preset;
  };
  const resolvedHumanPreset = humanDeckPreset ?? findPreset(humanDeckPresetId, currentNorthernRealmsDeckPreset);
  const resolvedAiPreset = aiDeckPreset ?? findPreset(aiDeckPresetId, currentNilfgaardDeckPreset);

  return {
    matchId,
    seed,
    seats: [
      {
        seatId: "seat_a",
        playerId: playerIds.seat_a ?? "human",
        controllerKind: controllerKinds.seat_a ?? "human",
        faction: resolvedHumanPreset.faction,
        deckPreset: resolvedHumanPreset,
      },
      {
        seatId: "seat_b",
        playerId: playerIds.seat_b ?? "ai",
        controllerKind: controllerKinds.seat_b ?? "ai",
        faction: resolvedAiPreset.faction,
        deckPreset: resolvedAiPreset,
      },
    ],
    catalog: {
      cards: catalogCards,
      leaders: catalogLeaders,
    },
  };
};

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
          runtimeCatalog: {
            cards: options.catalogCards ?? currentCatalogCards,
            leaders: options.catalogLeaders ?? currentCatalogLeaders,
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
        catalogCards: engine.runtimeCatalog.cards,
        catalogLeaders: engine.runtimeCatalog.leaders,
      });
      dispatch(engineCommandApplied({ command, match: transaction.state, events: transaction.events, sequence }));
      dispatch(engineSelectionCleared());
    } catch (error) {
      dispatch(engineCommandRejected({ command, sequence, error: toAdapterError(error) }));
    }
  };

export const resolveEngineRoundEnd = (seatId?: SeatId): AppThunk =>
  dispatchEngineCommand({ type: "ResolveRoundEnd", seatId });
