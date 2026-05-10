import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";

import engineReducer from "@/store/slices/engineSlice";
import { engineCommandApplied, engineSelectedCardIdsSet, engineSelectedCardSet } from "@/store/slices/engineSlice";
import { dispatchEngineCommand, resolveEngineRoundEnd, startEngineMatch } from "@/store/thunks/engineThunks";
import {
  selectEngineDebugAiHandCards,
  selectEngineAiHandCount,
  selectEngineAiPolicyId,
  selectEngineCanHumanAct,
  selectEngineHumanHand,
  selectEngineLegalMovesForHuman,
  selectEngineScoreBreakdown,
} from "@/store/selectors/engineSelectors";
import type { CardInstanceId, MatchState, PlayCardMove, SeatId, UseLeaderMove } from "@/game/core";
import type { CatalogCardSource, CatalogDeckPreset } from "@/game/catalog";
import { DEFAULT_PRODUCT_AI_POLICY_ID } from "@/game/ai";
import { currentCatalogCards, currentCatalogLeaders, currentNilfgaardDeckPreset, currentNorthernRealmsDeckPreset } from "@/data/catalog";
import { getLegalHeuristicAiCommand } from "@/components/game/engine/legalHeuristicAiController";

const createTestStore = () =>
  configureStore({
    reducer: {
      engine: engineReducer,
    },
  });

const completeMulligans = (store: ReturnType<typeof createTestStore>) => {
  store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: [] }));
  store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_b", cardIds: [] }));
};

const passAiIfNeeded = (store: ReturnType<typeof createTestStore>) => {
  if (store.getState().engine.match?.currentTurn === "seat_b") {
    store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: "seat_b" }));
  }
};

const removeEverywhere = (match: MatchState, cardId: CardInstanceId) => {
  Object.values(match.seats).forEach((seat) => {
    seat.deck = seat.deck.filter((id) => id !== cardId);
    seat.hand = seat.hand.filter((id) => id !== cardId);
    seat.discard = seat.discard.filter((id) => id !== cardId);
    seat.sideDeck = seat.sideDeck.filter((id) => id !== cardId);
    seat.removedFromGame = seat.removedFromGame.filter((id) => id !== cardId);
    Object.values(seat.board).forEach((row) => {
      row.units = row.units.filter((id) => id !== cardId);
      if (row.horn === cardId) row.horn = null;
    });
  });
  match.weather.entries = match.weather.entries.filter((id) => id !== cardId);
};

const putInDiscard = (match: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(match, cardId);
  match.seats[seatId].discard.push(cardId);
  match.cardsById[cardId].zone = { kind: "discard", seat: seatId };
  match.cardsById[cardId].controller = seatId;
};

const putOnBoard = (match: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(match, cardId);
  match.seats[seatId].board.siege.units.push(cardId);
  match.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row: "siege" };
  match.cardsById[cardId].controller = seatId;
};

describe("engine Redux adapter", () => {
  const customRuntimeCard: CatalogCardSource = {
    sourceId: "custom_runtime_unit",
    name: "Runtime Unit",
    faction: "northern_realms",
    kind: "unit",
    strength: 9,
    rows: ["close"],
    abilities: ["none"],
    tags: [],
    deckLimit: 22,
    image: "/images/custom/runtime-unit.png",
  };
  const customRuntimeDeck: CatalogDeckPreset = {
    presetId: "local-runtime-custom",
    name: "Runtime Custom",
    faction: "northern_realms",
    leaderSourceId: currentNorthernRealmsDeckPreset.leaderSourceId,
    mainDeck: [{ sourceId: customRuntimeCard.sourceId, count: 22 }],
    sideDeck: [],
  };
  it("starts a deterministic engine match with the requested seed and seat map", () => {
    const store = createTestStore();

    store.dispatch(startEngineMatch({ seed: "adapter-seed" }));

    const state = store.getState();
    expect(state.engine.match?.rng.seed).toBe("adapter-seed");
    expect(state.engine.match?.seats.seat_a.faction).toBe("northern_realms");
    expect(state.engine.match?.seats.seat_b.faction).toBe("nilfgaard");
    expect(state.engine.seatMap).toEqual({ human: "seat_a", ai: "seat_b" });
    expect(state.engine.aiPolicyId).toBe(DEFAULT_PRODUCT_AI_POLICY_ID);
    expect(selectEngineAiPolicyId(state)).toBe(DEFAULT_PRODUCT_AI_POLICY_ID);
    expect(state.engine.status).toBe("ready");
    expect(state.engine.eventLog.some((event) => event.type === "match_started")).toBe(true);
  });

  it("stores the selected product AI policy id and defaults missing policy to v0", () => {
    const store = createTestStore();

    store.dispatch(startEngineMatch({ seed: "adapter-policy-v1", aiPolicyId: "legal-heuristic-v1" }));
    expect(store.getState().engine.aiPolicyId).toBe("legal-heuristic-v1");

    store.dispatch(startEngineMatch({ seed: "adapter-policy-default" }));
    expect(store.getState().engine.aiPolicyId).toBe(DEFAULT_PRODUCT_AI_POLICY_ID);
  });

  it("starts with explicit selected deck presets while preserving seed and seat controllers", () => {
    const store = createTestStore();

    store.dispatch(
      startEngineMatch({
        seed: "adapter-selected-presets",
        humanDeckPresetId: "current-nilfgaard",
        aiDeckPresetId: "current-northern-realms",
        humanSeat: "seat_a",
        aiSeat: "seat_b",
        playerIds: { seat_a: "human", seat_b: "ai" },
        controllerKinds: { seat_a: "human", seat_b: "ai" },
      }),
    );

    const match = store.getState().engine.match;
    expect(match?.rng.seed).toBe("adapter-selected-presets");
    expect(match?.seats.seat_a.faction).toBe("nilfgaard");
    expect(match?.seats.seat_b.faction).toBe("northern_realms");
    expect(match?.seats.seat_a.controllerKind).toBe("human");
    expect(match?.seats.seat_b.controllerKind).toBe("ai");
    expect(match?.catalog.deckPresetIds).toEqual(["current-nilfgaard", "current-northern-realms"]);
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
    expect(state.engine.match?.seats.seat_a.mulligansUsed).toBe(1);
    expect(state.engine.match?.seats.seat_a.mulliganComplete).toBe(false);
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
    const selected = store.getState().engine.match?.seats.seat_a.hand.slice(0, 1) ?? [];

    store.dispatch(engineSelectedCardIdsSet(selected));
    expect(store.getState().engine.selectedCardIds).toEqual(selected);

    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: selected }));

    expect(store.getState().engine.match?.seats.seat_a.mulligansUsed).toBe(1);
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

  it("dispatches a legal human PlayCard through Redux and updates hand, board, score, and selection", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "adapter-play-card" }));
    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: [] }));
    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_b", cardIds: [] }));

    if (store.getState().engine.match?.currentTurn === "seat_b") {
      store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: "seat_b" }));
    }

    const stateBefore = store.getState();
    const playMove = selectEngineLegalMovesForHuman(stateBefore).find(
      (move): move is PlayCardMove =>
        move.kind === "play_card" &&
        move.target.kind === "board_row" &&
        move.target.side === "own" &&
        (move.metadata.cardKind === "unit" || move.metadata.cardKind === "hero"),
    );
    expect(playMove).toBeTruthy();

    const beforeScore = selectEngineScoreBreakdown(stateBefore)?.totalBySeat.seat_a ?? 0;
    store.dispatch(engineSelectedCardSet(playMove!.sourceCardId));
    store.dispatch(
      dispatchEngineCommand({
        type: "PlayCard",
        seatId: "seat_a",
        cardId: playMove!.sourceCardId,
        target: playMove!.target,
      }),
    );

    const state = store.getState();
    expect(state.engine.match?.seats.seat_a.hand).not.toContain(playMove!.sourceCardId);
    expect(state.engine.match?.seats.seat_a.board[playMove!.target.row].units).toContain(playMove!.sourceCardId);
    expect(selectEngineScoreBreakdown(state)?.totalBySeat.seat_a).toBeGreaterThan(beforeScore);
    expect(state.engine.selectedCardId).toBeNull();
    expect(state.engine.selectedCardIds).toEqual([]);
    expect(state.engine.lastTransactionEvents.some((event) => event.type === "card_played")).toBe(true);
  });

  it("dispatches a legal human UseLeader through Redux, clears weather, and clears selection", () => {
    const store = createTestStore();
    let weatherMove: PlayCardMove | undefined;

    for (let index = 0; index < 80 && !weatherMove; index += 1) {
      store.dispatch(startEngineMatch({ seed: `adapter-leader-weather-${index}` }));
      completeMulligans(store);
      passAiIfNeeded(store);
      weatherMove = selectEngineLegalMovesForHuman(store.getState()).find(
        (move): move is PlayCardMove => move.kind === "play_card" && move.target.kind === "weather",
      );
    }

    expect(weatherMove).toBeTruthy();
    store.dispatch(
      dispatchEngineCommand({
        type: "PlayCard",
        seatId: "seat_a",
        cardId: weatherMove!.sourceCardId,
        target: weatherMove!.target,
      }),
    );
    expect(store.getState().engine.match?.weather.entries).toContain(weatherMove!.sourceCardId);

    passAiIfNeeded(store);
    const leaderMove = selectEngineLegalMovesForHuman(store.getState()).find(
      (move): move is UseLeaderMove => move.kind === "use_leader",
    );
    expect(leaderMove).toBeTruthy();

    store.dispatch(engineSelectedCardSet(weatherMove!.sourceCardId));
    store.dispatch(
      dispatchEngineCommand({
        type: "UseLeader",
        seatId: "seat_a",
        target: leaderMove!.target,
      }),
    );

    const state = store.getState();
    expect(state.engine.match?.weather.entries).toEqual([]);
    expect(state.engine.match?.seats.seat_a.leaderUsed).toBe(true);
    expect(state.engine.match?.seats.seat_a.discard).toContain(weatherMove!.sourceCardId);
    expect(state.engine.selectedCardId).toBeNull();
    expect(state.engine.selectedCardIds).toEqual([]);
    expect(state.engine.lastTransactionEvents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "weather_cleared", source: "leader" }),
        expect.objectContaining({ type: "leader_used", seatId: "seat_a" }),
      ]),
    );
  });

  it("dispatches a legal prompt choice through Redux and suppresses ordinary human play while pending", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "adapter-prompt-choice" }));
    const base = structuredClone(store.getState().engine.match!);
    const medic = Object.values(base.cardsById).find((card) => card.sourceId === "northern-realms.dun-banner-medic")!;
    const target = Object.values(base.cardsById).find((card) => card.sourceId === "northern-realms.catapult")!;
    const promptId = "prompt:test:seat_a:medic";

    base.phase = "playing";
    base.currentTurn = "seat_a";
    base.seats.seat_a.mulliganComplete = true;
    base.seats.seat_b.mulliganComplete = true;
    putOnBoard(base, "seat_a", medic.instanceId);
    putInDiscard(base, "seat_a", target.instanceId);
    base.pendingPrompt = {
      promptId,
      seatId: "seat_a",
      kind: "medic_revive",
      sourceCardId: medic.instanceId,
      sourceId: medic.sourceId,
      abilityId: "medic",
      options: [
        {
          optionId: `revive:${target.instanceId}:siege`,
          label: "Catapult to siege",
          target: {
            kind: "card_instance",
            cardId: target.instanceId,
            sourceId: target.sourceId,
            row: "siege",
          },
        },
      ],
    };

    store.dispatch(
      engineCommandApplied({
        command: { type: "ChooseMulligan", seatId: "seat_a", cardIds: [] },
        match: base,
        events: [{ type: "prompt_opened", prompt: base.pendingPrompt }],
        sequence: 1,
      }),
    );
    store.dispatch(engineSelectedCardSet(medic.instanceId));

    const promptMoves = selectEngineLegalMovesForHuman(store.getState());
    expect(promptMoves.map((move) => move.kind)).toEqual(["choose_prompt_option"]);

    store.dispatch(
      dispatchEngineCommand({
        type: "ChoosePromptOption",
        seatId: "seat_a",
        promptId,
        optionId: `revive:${target.instanceId}:siege`,
      }),
    );

    const state = store.getState();
    expect(state.engine.match?.pendingPrompt).toBeNull();
    expect(state.engine.match?.seats.seat_a.discard).not.toContain(target.instanceId);
    expect(state.engine.match?.seats.seat_a.board.siege.units).toContain(target.instanceId);
    expect(state.engine.selectedCardId).toBeNull();
    expect(state.engine.lastTransactionEvents.some((event) => event.type === "prompt_resolved")).toBe(true);
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

  it("uses the active runtime catalog for custom cards across selectors, legal moves, scoring, commands, and AI", () => {
    const store = createTestStore();
    const catalogCards = [...currentCatalogCards, customRuntimeCard];
    store.dispatch(
      startEngineMatch({
        seed: "adapter-custom-runtime",
        humanDeckPresetId: customRuntimeDeck.presetId,
        humanDeckPreset: customRuntimeDeck,
        aiDeckPresetId: currentNilfgaardDeckPreset.presetId,
        catalogCards,
        catalogLeaders: currentCatalogLeaders,
      }),
    );

    expect(store.getState().engine.runtimeCatalog.cards.map((card) => card.sourceId)).toContain(customRuntimeCard.sourceId);
    expect(selectEngineHumanHand(store.getState()).map((card) => card.sourceId)).toEqual(
      Array.from({ length: 10 }, () => customRuntimeCard.sourceId),
    );

    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: [] }));
    const aiCommand = getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a");
    expect(aiCommand?.type).toBe("ChooseMulligan");
    store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_b", cardIds: [] }));
    passAiIfNeeded(store);

    const playMove = selectEngineLegalMovesForHuman(store.getState()).find(
      (move): move is PlayCardMove => move.kind === "play_card" && move.sourceId === customRuntimeCard.sourceId,
    );
    expect(playMove).toBeTruthy();
    store.dispatch(
      dispatchEngineCommand({
        type: "PlayCard",
        seatId: "seat_a",
        cardId: playMove!.sourceCardId,
        target: playMove!.target,
      }),
    );

    expect(selectEngineScoreBreakdown(store.getState())?.totalBySeat.seat_a).toBe(customRuntimeCard.strength);
    expect(store.getState().engine.lastTransactionEvents).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "card_played", cardId: playMove!.sourceCardId })]),
    );
  });
});
