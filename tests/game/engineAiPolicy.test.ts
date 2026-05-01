import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  buildSeatObservation,
  commandFromLegalMove,
  legalHeuristicPolicyV0,
} from "@/game/ai";
import {
  getLegalMoves,
  startMatch,
  type ChoosePromptOptionMove,
  type LegalMove,
  type MatchState,
  type SeatId,
} from "@/game/core";
import engineReducer, { engineCommandApplied } from "@/store/slices/engineSlice";
import { dispatchEngineCommand, startEngineMatch } from "@/store/thunks/engineThunks";
import { selectEngineLegalMovesForAi } from "@/store/selectors/engineSelectors";
import { getLegalHeuristicAiCommand } from "@/components/game/engine/legalHeuristicAiController";

const createMatch = (seed = "engine-ai-policy") =>
  startMatch({
    seed,
    seats: [
      {
        seatId: "seat_a",
        playerId: "human",
        controllerKind: "human",
        faction: "northern_realms",
        deckPreset: currentNorthernRealmsDeckPreset,
      },
      {
        seatId: "seat_b",
        playerId: "ai",
        controllerKind: "ai",
        faction: "nilfgaard",
        deckPreset: currentNilfgaardDeckPreset,
      },
    ],
    catalog: {
      cards: currentCatalogCards,
      leaders: currentCatalogLeaders,
    },
  }).state;

const createTestStore = () =>
  configureStore({
    reducer: {
      engine: engineReducer,
    },
  });

const getMoves = (state: MatchState, seatId: SeatId) =>
  getLegalMoves({ state, seatId, catalogCards: currentCatalogCards, catalogLeaders: currentCatalogLeaders });

const completeMulligans = (store: ReturnType<typeof createTestStore>) => {
  store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: [] }));
  store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_b", cardIds: [] }));
};

describe("engine AI policy", () => {
  it("builds observations with own hand summaries and opponent hand count only", () => {
    const match = createMatch("ai-observation");

    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });

    expect(observation.ownHand).toHaveLength(10);
    expect(observation.ownHand[0]).toEqual(
      expect.objectContaining({ cardId: expect.any(String), sourceId: expect.any(String), name: expect.any(String) }),
    );
    expect(observation.opponentHandCount).toBe(10);
    expect(JSON.stringify(observation)).not.toContain(match.seats.seat_a.hand[0]);
  });

  it("converts every supported legal move kind into the exact command payload", () => {
    const moves: LegalMove[] = [
      {
        kind: "choose_mulligan",
        moveId: "mulligan:seat_b:none",
        seatId: "seat_b",
        label: "Keep hand",
        cardIds: ["c1"],
        metadata: { cardCount: 1, maxCards: 1 },
      },
      {
        kind: "play_card",
        moveId: "play:seat_b:c3:weather",
        seatId: "seat_b",
        label: "Play weather",
        sourceCardId: "c3",
        sourceId: "neutral.biting-frost",
        target: { kind: "weather" },
        metadata: { cardName: "Biting Frost", cardKind: "special", abilities: ["frost"], targetLabel: "weather" },
      },
      { kind: "pass", moveId: "pass:seat_b", seatId: "seat_b", label: "Pass", target: { kind: "none" } },
      {
        kind: "use_leader",
        moveId: "leader:seat_b:l1:clear_weather",
        seatId: "seat_b",
        label: "Use leader",
        leaderCardId: "l1",
        sourceId: "leader",
        target: { kind: "none" },
        metadata: {
          leaderName: "Leader",
          ability: "clear_weather",
          abilityStatus: "implemented",
          targetRequirement: "none",
        },
      },
      {
        kind: "choose_prompt_option",
        moveId: "prompt:p1:o1",
        seatId: "seat_b",
        label: "Choose",
        promptId: "p1",
        optionId: "o1",
        target: { kind: "card_instance", side: "own", seatId: "seat_b", cardId: "c4", row: "siege" },
        metadata: { promptKind: "medic_revive", abilityId: "medic", sourceCardId: "c5" },
      },
      {
        kind: "resolve_round_end",
        moveId: "resolve-round-end:1",
        seatId: "seat_b",
        label: "Resolve",
        target: { kind: "none" },
      },
    ];

    expect(moves.map(commandFromLegalMove)).toEqual([
      { type: "ChooseMulligan", seatId: "seat_b", cardIds: ["c1"] },
      { type: "PlayCard", seatId: "seat_b", cardId: "c3", target: { kind: "weather" } },
      { type: "Pass", seatId: "seat_b" },
      { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } },
      { type: "ChoosePromptOption", seatId: "seat_b", promptId: "p1", optionId: "o1" },
      { type: "ResolveRoundEnd", seatId: "seat_b" },
    ]);
  });

  it("returns null with no legal moves and chooses zero-card mulligan when available", () => {
    const match = createMatch("ai-empty-mulligan");
    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const legalMoves = getMoves(match, "seat_b");

    expect(legalHeuristicPolicyV0.selectMove({ seatId: "seat_b", observation, legalMoves: [] })).toBeNull();
    expect(legalHeuristicPolicyV0.selectMove({ seatId: "seat_b", observation, legalMoves })).toEqual(
      expect.objectContaining({ kind: "choose_mulligan", cardIds: [] }),
    );
  });

  it("chooses legal play_card moves over pass for both seats when not already ahead of a passed opponent", () => {
    (["seat_a", "seat_b"] as const).forEach((seatId) => {
      const match = createMatch(`ai-seat-neutral-${seatId}`);
      match.phase = "playing";
      match.currentTurn = seatId;
      match.seats.seat_a.mulliganComplete = true;
      match.seats.seat_b.mulliganComplete = true;

      const observation = buildSeatObservation({
        state: match,
        seatId,
        catalogCards: currentCatalogCards,
        catalogLeaders: currentCatalogLeaders,
      });
      const legalMoves = getMoves(match, seatId);
      const selected = legalHeuristicPolicyV0.selectMove({ seatId, observation, legalMoves });

      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", seatId }));
    });
  });

  it("chooses pass when the opponent has passed and the acting seat is ahead", () => {
    const match = createMatch("ai-pass-ahead");
    match.phase = "playing";
    match.currentTurn = "seat_b";
    match.seats.seat_a.mulliganComplete = true;
    match.seats.seat_b.mulliganComplete = true;
    match.seats.seat_a.passed = true;
    // Pick the strongest card currently in seat_b's hand so the heuristic
    // treats seat_b as clearly ahead. The previous test relied on `hand[0]`
    // being strong enough, but cCp13's added Roach reshuffled the deal and
    // sometimes leaves a small unit in slot 0. Choosing the maximum-strength
    // hand card keeps the lead unambiguous and makes the test deck-shape
    // independent.
    const strongCardId = match.seats.seat_b.hand
      .slice()
      .sort((aId, bId) => {
        const aSource = currentCatalogCards.find((card) => card.sourceId === match.cardsById[aId].sourceId);
        const bSource = currentCatalogCards.find((card) => card.sourceId === match.cardsById[bId].sourceId);
        return (bSource?.strength ?? 0) - (aSource?.strength ?? 0);
      })[0];
    match.seats.seat_b.hand = match.seats.seat_b.hand.filter((cardId) => cardId !== strongCardId);
    match.seats.seat_b.board.close.units.push(strongCardId);
    match.cardsById[strongCardId].zone = { kind: "board_row", seat: "seat_b", row: "close" };

    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const selected = legalHeuristicPolicyV0.selectMove({
      seatId: "seat_b",
      observation,
      legalMoves: getMoves(match, "seat_b"),
    });

    expect(selected).toEqual(expect.objectContaining({ kind: "pass", seatId: "seat_b" }));
  });

  it("chooses the strongest deterministic prompt option for an AI-owned prompt", () => {
    const match = createMatch("ai-prompt");
    const highTarget = Object.values(match.cardsById).find((card) => card.sourceId === "nilfgaard.tibor-eggebracht")!;
    const lowTarget = Object.values(match.cardsById).find((card) => card.sourceId === "nilfgaard.young-emissary")!;
    match.phase = "playing";
    match.pendingPrompt = {
      promptId: "prompt:ai:medic",
      seatId: "seat_b",
      kind: "medic_revive",
      sourceCardId: match.seats.seat_b.hand[0],
      sourceId: match.cardsById[match.seats.seat_b.hand[0]].sourceId,
      abilityId: "medic",
      options: [
        {
          optionId: "revive:low",
          label: "Low",
          target: { kind: "card_instance", cardId: lowTarget.instanceId, sourceId: lowTarget.sourceId, row: "close" },
        },
        {
          optionId: "revive:high",
          label: "High",
          target: { kind: "card_instance", cardId: highTarget.instanceId, sourceId: highTarget.sourceId, row: "siege" },
        },
      ],
    };

    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const selected = legalHeuristicPolicyV0.selectMove({
      seatId: "seat_b",
      observation,
      legalMoves: getMoves(match, "seat_b"),
    }) as ChoosePromptOptionMove;

    expect(selected.kind).toBe("choose_prompt_option");
    expect(selected.optionId).toBe("revive:high");
  });

  it("is deterministic for the same input", () => {
    const match = createMatch("ai-deterministic");
    match.phase = "playing";
    match.currentTurn = "seat_b";
    match.seats.seat_a.mulliganComplete = true;
    match.seats.seat_b.mulliganComplete = true;
    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const legalMoves = getMoves(match, "seat_b");

    const first = legalHeuristicPolicyV0.selectMove({ seatId: "seat_b", observation, legalMoves });
    const second = legalHeuristicPolicyV0.selectMove({ seatId: "seat_b", observation, legalMoves });

    expect(second).toEqual(first);
  });

  it("controller does not dispatch when blocked and only returns commands derived from AI legal moves", () => {
    const store = createTestStore();
    expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a")).toBeNull();

    store.dispatch(startEngineMatch({ seed: "ai-controller" }));
    expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a")).toBeNull();

    completeMulligans(store);
    const match = store.getState().engine.match!;
    if (match.currentTurn === "seat_a") {
      expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a")).toBeNull();
      store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: "seat_a" }));
    }

    const legalMoves = selectEngineLegalMovesForAi(store.getState());
    const command = getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a");
    expect(command).not.toBeNull();
    expect(
      legalMoves.some((move) => JSON.stringify(commandFromLegalMove(move)) === JSON.stringify(command)),
    ).toBe(true);
  });

  it("Redux flow lets AI choose and dispatch a legal card play that updates hand, board, and events", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "ai-redux-flow" }));
    completeMulligans(store);
    if (store.getState().engine.match?.currentTurn === "seat_a") {
      store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: "seat_a" }));
    }

    const command = getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a");
    expect(command).toEqual(expect.objectContaining({ type: "PlayCard", seatId: "seat_b" }));
    const cardId = command && command.type === "PlayCard" ? command.cardId : null;

    store.dispatch(dispatchEngineCommand(command!));

    const state = store.getState();
    expect(cardId).toBeTruthy();
    expect(state.engine.match?.seats.seat_b.hand).not.toContain(cardId);
    expect(state.engine.lastTransactionEvents.some((event) => event.type === "card_played")).toBe(true);
    const onBoard = Object.values(state.engine.match!.seats).some((seat) =>
      Object.values(seat.board).some((row) => row.units.includes(cardId!)),
    );
    expect(onBoard || state.engine.match!.weather.entries.includes(cardId!)).toBe(true);
  });

  it("controller ignores game end, adapter locks, human prompts, and human playing turns", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "ai-controller-blocks" }));
    completeMulligans(store);
    const base = structuredClone(store.getState().engine.match!);
    base.phase = "playing";
    base.currentTurn = "seat_a";
    store.dispatch(engineCommandApplied({ command: { type: "Pass", seatId: "seat_b" }, match: base, events: [], sequence: 3 }));
    expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a")).toBeNull();

    const humanPrompt = structuredClone(base);
    humanPrompt.currentTurn = "seat_b";
    humanPrompt.pendingPrompt = {
      promptId: "prompt:human",
      seatId: "seat_a",
      kind: "choose_card",
      abilityId: "test",
      options: [],
    };
    store.dispatch(
      engineCommandApplied({ command: { type: "Pass", seatId: "seat_a" }, match: humanPrompt, events: [], sequence: 4 }),
    );
    expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a")).toBeNull();

    expect(
      getLegalHeuristicAiCommand(
        { ...store.getState().engine, status: "ai_thinking", lock: { kind: "ai_thinking", sinceSequence: 5 } },
        "seat_b",
        "seat_a",
      ),
    ).toBeNull();

    const gameEnd = structuredClone(base);
    gameEnd.phase = "game_end";
    gameEnd.currentTurn = "seat_b";
    gameEnd.pendingPrompt = null;
    expect(getLegalHeuristicAiCommand({ match: gameEnd, status: "ready", lock: null }, "seat_b", "seat_a")).toBeNull();
  });

  it("controller can resolve an AI-owned prompt through the prompt lock", () => {
    const match = createMatch("ai-controller-prompt");
    const highTarget = Object.values(match.cardsById).find((card) => card.sourceId === "nilfgaard.tibor-eggebracht")!;
    match.phase = "playing";
    match.currentTurn = "seat_b";
    match.pendingPrompt = {
      promptId: "prompt:ai:controller",
      seatId: "seat_b",
      kind: "choose_card",
      sourceCardId: match.seats.seat_b.hand[0],
      sourceId: match.cardsById[match.seats.seat_b.hand[0]].sourceId,
      abilityId: "test",
      options: [
        {
          optionId: "pick:high",
          label: "Pick high",
          target: { kind: "card_instance", cardId: highTarget.instanceId, sourceId: highTarget.sourceId, row: "siege" },
        },
      ],
    };

    expect(
      getLegalHeuristicAiCommand(
        {
          match,
          status: "awaiting_prompt",
          lock: { kind: "prompt", owner: "seat_b", promptId: "prompt:ai:controller", sinceSequence: 1 },
        },
        "seat_b",
        "seat_a",
      ),
    ).toEqual({
      type: "ChoosePromptOption",
      seatId: "seat_b",
      promptId: "prompt:ai:controller",
      optionId: "pick:high",
    });
  });
});
