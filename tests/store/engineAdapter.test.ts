import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";

import engineReducer from "@/store/slices/engineSlice";
import { dispatchEngineCommand, startEngineMatch } from "@/store/thunks/engineThunks";
import {
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
    expect(selectEngineHumanHand(state)).toHaveLength(10);
    expect(selectEngineAiHandCount(state)).toBe(10);
  });
});
