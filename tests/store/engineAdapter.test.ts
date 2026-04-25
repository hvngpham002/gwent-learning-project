import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";

import engineReducer from "@/store/slices/engineSlice";
import { engineSelectedCardIdsSet } from "@/store/slices/engineSlice";
import { dispatchEngineCommand, resolveEngineRoundEnd, startEngineMatch } from "@/store/thunks/engineThunks";
import {
  selectEngineDebugAiHandCards,
  selectEngineAiHandCount,
  selectEngineCanHumanAct,
  selectEngineHumanHand,
  selectEngineLegalMovesForHuman,
  selectEngineScoreBreakdown,
} from "@/store/selectors/engineSelectors";

const createTestStore = () =>
  configureStore({
    reducer: {
      engine: engineReducer,
    },
  });

describe("engine Redux adapter", () => {
  it("starts a deterministic engine match with the requested seed and seat map", () => {
    const store = createTestStore();

    store.dispatch(startEngineMatch({ seed: "adapter-seed" }));

    const state = store.getState();
    expect(state.engine.match?.rng.seed).toBe("adapter-seed");
    expect(state.engine.match?.seats.seat_a.faction).toBe("northern_realms");
    expect(state.engine.match?.seats.seat_b.faction).toBe("nilfgaard");
    expect(state.engine.seatMap).toEqual({ human: "seat_a", ai: "seat_b" });
    expect(state.engine.status).toBe("ready");
    expect(state.engine.eventLog.some((event) => event.type === "match_started")).toBe(true);
  });

  it("starting a second match resets adapter history, selections, prompt, and errors", () => {
    const store = createTestStore();

    store.dispatch(startEngineMatch({ seed: "adapter-reset-a" }));
    const firstHand = store.getState().engine.match?.seats.seat_a.hand ?? [];
    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: [firstHand[0]] }));
    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: [firstHand[0]] }));

    expect(store.getState().engine.commandHistory).toHaveLength(2);
    expect(store.getState().engine.lastError).not.toBeNull();

    store.dispatch(startEngineMatch({ seed: "adapter-reset-b" }));

    const state = store.getState();
    expect(state.engine.match?.rng.seed).toBe("adapter-reset-b");
    expect(state.engine.commandHistory).toEqual([]);
    expect(state.engine.lastError).toBeNull();
    expect(state.engine.selectedMoveId).toBeNull();
    expect(state.engine.selectedCardId).toBeNull();
    expect(state.engine.match?.pendingPrompt).toBeNull();
    expect(state.engine.lastTransactionEvents.some((event) => event.type === "match_started")).toBe(true);
  });

  it("dispatches ChooseMulligan through the adapter and records events", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "adapter-mulligan" }));
    const before = store.getState().engine.match;
    const selected = before?.seats.seat_a.hand.slice(0, 1) ?? [];

    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: selected }));

    const state = store.getState();
    expect(state.engine.match?.seats.seat_a.mulliganComplete).toBe(true);
    expect(state.engine.commandHistory).toEqual([
      expect.objectContaining({
        sequence: 1,
        status: "applied",
        command: { type: "ChooseMulligan", seatId: "seat_a", cardIds: selected },
      }),
    ]);
    expect(state.engine.lastTransactionEvents.some((event) => event.type === "mulligan_chosen")).toBe(true);
    expect(state.engine.eventLog.length).toBeGreaterThan(state.engine.lastTransactionEvents.length);
  });

  it("rejects invalid commands with a serializable error and leaves match unchanged", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "adapter-invalid" }));
    const before = store.getState().engine.match;
    const illegalCard = before?.seats.seat_b.hand[0];

    store.dispatch(
      dispatchEngineCommand({
        type: "ChooseMulligan",
        seatId: "seat_a",
        cardIds: illegalCard ? [illegalCard] : [],
      }),
    );

    const state = store.getState();
    expect(state.engine.match).toBe(before);
    expect(state.engine.lastError).toEqual(
      expect.objectContaining({
        code: "illegal_command",
        message: expect.any(String),
      }),
    );
    expect(state.engine.commandHistory[0]).toEqual(
      expect.objectContaining({
        status: "rejected",
        eventCount: 0,
      }),
    );
    expect(JSON.parse(JSON.stringify(state.engine.lastError))).toEqual(state.engine.lastError);
  });

  it("exposes legal moves, scores, and hidden-info view models", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "adapter-selectors" }));

    const state = store.getState();
    expect(selectEngineLegalMovesForHuman(state).some((move) => move.kind === "choose_mulligan")).toBe(true);
    expect(selectEngineCanHumanAct(state)).toBe(true);
    expect(selectEngineScoreBreakdown(state)?.totalBySeat).toEqual({ seat_a: 0, seat_b: 0 });
    const humanHand = selectEngineHumanHand(state);
    expect(humanHand).toHaveLength(10);
    expect(humanHand[0]).toEqual(
      expect.objectContaining({
        image: expect.stringMatching(/^\/images\//),
        name: expect.any(String),
        sourceId: expect.any(String),
      }),
    );
    expect(selectEngineAiHandCount(state)).toBe(10);
    expect(selectEngineDebugAiHandCards(state)).toHaveLength(10);
  });

  it("clears engine UI selection after a human mulligan command is applied", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "adapter-selection-clear" }));
    const selected = store.getState().engine.match?.seats.seat_a.hand.slice(0, 2) ?? [];

    store.dispatch(engineSelectedCardIdsSet(selected));
    expect(store.getState().engine.selectedCardIds).toEqual(selected);

    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: selected }));

    expect(store.getState().engine.match?.seats.seat_a.mulliganComplete).toBe(true);
    expect(store.getState().engine.selectedCardIds).toEqual([]);
    expect(store.getState().engine.selectedCardId).toBeNull();
  });

  it("supports the scripted vertical slice through mulligan, pass, and ResolveRoundEnd", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "adapter-round-flow" }));

    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: [] }));
    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_b", cardIds: [] }));
    expect(store.getState().engine.match?.phase).toBe("playing");

    const currentTurn = store.getState().engine.match?.currentTurn;
    expect(currentTurn).toBeTruthy();
    store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: currentTurn! }));
    const nextTurn = store.getState().engine.match?.currentTurn;
    expect(nextTurn).toBeTruthy();
    if (nextTurn !== currentTurn) {
      store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: nextTurn! }));
    }
    expect(store.getState().engine.match?.phase).toBe("round_end");

    store.dispatch(resolveEngineRoundEnd("seat_a"));

    const state = store.getState();
    expect(state.engine.commandHistory.at(-1)).toEqual(
      expect.objectContaining({
        status: "applied",
        command: { type: "ResolveRoundEnd", seatId: "seat_a" },
      }),
    );
    expect(state.engine.lastTransactionEvents.some((event) => event.type === "round_resolved")).toBe(true);
  });

  it("default human-facing engine state exposes AI hand count but no AI hand card details", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "adapter-hidden-ai" }));

    const state = store.getState();
    expect(selectEngineAiHandCount(state)).toBe(10);
    expect(Object.keys(state.engine).includes("aiHandCards")).toBe(false);
    expect(selectEngineHumanHand(state).map((card) => card.name)).not.toEqual(
      selectEngineDebugAiHandCards(state).map((card) => card.name),
    );
  });
});
