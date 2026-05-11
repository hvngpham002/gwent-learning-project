import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import {
  DEFAULT_PRODUCT_AI_POLICY_ID,
  resolveProductAiPolicyId,
  type ProductAiPolicyId,
} from "@/game/ai";
import type { CatalogCardSource, CatalogLeaderSource } from "@/game/catalog";
import type {
  CardInstanceId,
  EngineCommand,
  GameEvent,
  MatchState,
  SeatId,
} from "@/game/core";
import type { AiDecisionTrace } from "@/game/ai";

export type EngineAdapterStatus =
  | "idle"
  | "ready"
  | "resolving"
  | "awaiting_prompt"
  | "animating"
  | "ai_thinking"
  | "game_end"
  | "error";

export interface EngineActionLock {
  kind: "resolving_command" | "prompt" | "animation" | "ai_thinking";
  owner?: SeatId;
  promptId?: string;
  sinceSequence: number;
}

export interface EngineAdapterError {
  code: string;
  message: string;
  details?: unknown;
}

export interface EngineCommandRecord {
  sequence: number;
  command: Exclude<EngineCommand, { type: "StartMatch" }>;
  status: "applied" | "rejected";
  eventCount: number;
  error?: EngineAdapterError;
}

export interface EngineRuntimeCatalogSnapshot {
  readonly cards: readonly CatalogCardSource[];
  readonly leaders: readonly CatalogLeaderSource[];
}

export interface EngineAdapterState {
  match: MatchState | null;
  runtimeCatalog: EngineRuntimeCatalogSnapshot;
  status: EngineAdapterStatus;
  lock: EngineActionLock | null;
  seatMap: { human: SeatId; ai: SeatId };
  aiPolicyId: ProductAiPolicyId;
  commandHistory: EngineCommandRecord[];
  eventLog: GameEvent[];
  lastTransactionEvents: GameEvent[];
  lastError: EngineAdapterError | null;
  selectedMoveId: string | null;
  selectedCardId: CardInstanceId | null;
  selectedCardIds: CardInstanceId[];
  // cFp25: hidden-info-safe AI decision traces collected during a match.
  // These are appended by the AI controller and reset on match start.
  diagnosticTraces: readonly AiDecisionTrace[];
  // cFp25: warnings from hidden-info redaction during trace collection.
  diagnosticWarnings: readonly string[];
}

const defaultSeatMap: EngineAdapterState["seatMap"] = {
  human: "seat_a",
  ai: "seat_b",
};

const deriveStatusAndLock = (
  match: MatchState | null,
  sinceSequence: number,
): Pick<EngineAdapterState, "status" | "lock"> => {
  if (!match) {
    return { status: "idle", lock: null };
  }

  if (match.pendingPrompt) {
    return {
      status: "awaiting_prompt",
      lock: {
        kind: "prompt",
        owner: match.pendingPrompt.seatId,
        promptId: match.pendingPrompt.promptId,
        sinceSequence,
      },
    };
  }

  if (match.phase === "game_end") {
    return { status: "game_end", lock: null };
  }

  return { status: "ready", lock: null };
};

export const createInitialEngineState = (): EngineAdapterState => ({
  match: null,
  runtimeCatalog: {
    cards: currentCatalogCards,
    leaders: currentCatalogLeaders,
  },
  status: "idle",
  lock: null,
  seatMap: defaultSeatMap,
  aiPolicyId: DEFAULT_PRODUCT_AI_POLICY_ID,
  commandHistory: [],
  eventLog: [],
  lastTransactionEvents: [],
  lastError: null,
  selectedMoveId: null,
  selectedCardId: null,
  selectedCardIds: [],
  diagnosticTraces: [],
  diagnosticWarnings: [],
});

const engineSlice = createSlice({
  name: "engine",
  initialState: createInitialEngineState() as EngineAdapterState,
  reducers: {
    engineMatchStarted: (
      state,
      action: PayloadAction<{
        match: MatchState;
        events: GameEvent[];
        seatMap?: EngineAdapterState["seatMap"];
        runtimeCatalog?: EngineRuntimeCatalogSnapshot;
        aiPolicyId?: ProductAiPolicyId;
      }>,
    ) => {
      const derived = deriveStatusAndLock(action.payload.match, 0);
      state.match = action.payload.match as typeof state.match;
      state.runtimeCatalog = (action.payload.runtimeCatalog ?? {
        cards: currentCatalogCards,
        leaders: currentCatalogLeaders,
      }) as typeof state.runtimeCatalog;
      state.status = derived.status;
      state.lock = derived.lock;
      state.seatMap = action.payload.seatMap ?? defaultSeatMap;
      state.aiPolicyId = resolveProductAiPolicyId(action.payload.aiPolicyId);
      state.commandHistory = [];
      state.eventLog = action.payload.events as typeof state.eventLog;
      state.lastTransactionEvents = action.payload.events as typeof state.lastTransactionEvents;
      state.lastError = null;
      state.selectedMoveId = null;
      state.selectedCardId = null;
      state.selectedCardIds = [];
      state.diagnosticTraces = [];
      state.diagnosticWarnings = [];
    },
    engineCommandResolving: (
      state,
      action: PayloadAction<{ command: Exclude<EngineCommand, { type: "StartMatch" }>; sequence: number }>,
    ) => {
      state.status = "resolving";
      state.lock = {
        kind: "resolving_command",
        owner: "seatId" in action.payload.command ? action.payload.command.seatId : undefined,
        sinceSequence: action.payload.sequence,
      };
      state.lastError = null;
    },
    engineCommandApplied: (
      state,
      action: PayloadAction<{
        command: Exclude<EngineCommand, { type: "StartMatch" }>;
        match: MatchState;
        events: GameEvent[];
        sequence: number;
      }>,
    ) => {
      state.match = action.payload.match as typeof state.match;
      state.commandHistory.push({
        sequence: action.payload.sequence,
        command: action.payload.command,
        status: "applied",
        eventCount: action.payload.events.length,
      });
      state.eventLog.push(...(action.payload.events as typeof state.eventLog));
      state.lastTransactionEvents = action.payload.events as typeof state.lastTransactionEvents;
      state.lastError = null;
      const derived = deriveStatusAndLock(action.payload.match, action.payload.sequence);
      state.status = derived.status;
      state.lock = derived.lock;
    },
    engineCommandRejected: (
      state,
      action: PayloadAction<{
        command: Exclude<EngineCommand, { type: "StartMatch" }>;
        error: EngineAdapterError;
        sequence: number;
      }>,
    ) => {
      state.commandHistory.push({
        sequence: action.payload.sequence,
        command: action.payload.command,
        status: "rejected",
        eventCount: 0,
        error: action.payload.error,
      });
      state.lastTransactionEvents = [];
      state.lastError = action.payload.error;
      const derived = deriveStatusAndLock(state.match, action.payload.sequence);
      state.status = derived.status === "idle" ? "error" : derived.status;
      state.lock = derived.lock;
    },
    engineAdapterErrorSet: (state, action: PayloadAction<EngineAdapterError>) => {
      state.lastError = action.payload;
      if (!state.match) {
        state.status = "error";
      }
    },
    engineMatchCleared: () => createInitialEngineState(),
    enginePresentationLockSet: (
      state,
      action: PayloadAction<{ kind: "animation" | "ai_thinking"; owner?: SeatId }>,
    ) => {
      state.status = action.payload.kind === "animation" ? "animating" : "ai_thinking";
      state.lock = {
        kind: action.payload.kind,
        owner: action.payload.owner,
        sinceSequence: state.commandHistory.length + 1,
      };
    },
    enginePresentationLockCleared: (state) => {
      const derived = deriveStatusAndLock(state.match, state.commandHistory.length);
      state.status = derived.status;
      state.lock = derived.lock;
    },
    engineSelectedMoveSet: (state, action: PayloadAction<string | null>) => {
      state.selectedMoveId = action.payload;
    },
    engineSelectedCardSet: (state, action: PayloadAction<CardInstanceId | null>) => {
      state.selectedCardId = action.payload;
    },
    engineSelectedCardIdsSet: (state, action: PayloadAction<CardInstanceId[]>) => {
      state.selectedCardIds = action.payload;
      state.selectedCardId = action.payload.at(-1) ?? null;
    },
    engineSelectionCleared: (state) => {
      state.selectedMoveId = null;
      state.selectedCardId = null;
      state.selectedCardIds = [];
    },
    // cFp25: append AI decision traces collected during a match.
    engineDiagnosticTraceAppended: (state, action: PayloadAction<AiDecisionTrace>) => {
      // Immer/WritableDraft requires mutable arrays. Spread avoids the
      // readonly/mutable incompatibility that concat triggers.
      state.diagnosticTraces = [...state.diagnosticTraces, action.payload];
    },
    // cFp25: append hidden-info redaction warnings.
    engineDiagnosticWarningAdded: (state, action: PayloadAction<string>) => {
      state.diagnosticWarnings = [...state.diagnosticWarnings, action.payload];
    },
  },
});

export const {
  engineAdapterErrorSet,
  engineCommandApplied,
  engineCommandRejected,
  engineCommandResolving,
  engineDiagnosticTraceAppended,
  engineDiagnosticWarningAdded,
  engineMatchCleared,
  engineMatchStarted,
  enginePresentationLockCleared,
  enginePresentationLockSet,
  engineSelectedCardIdsSet,
  engineSelectedCardSet,
  engineSelectedMoveSet,
  engineSelectionCleared,
} = engineSlice.actions;

export default engineSlice.reducer;
