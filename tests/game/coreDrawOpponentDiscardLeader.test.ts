import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  EngineRuleError,
  executeCommand,
  getLegalMoves,
  getOpponentDiscardDrawCandidates,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type ChoosePromptOptionMove,
  type EngineCommand,
  type LegalMove,
  type MatchConfig,
  type MatchState,
  type SeatId,
  type UseLeaderMove,
} from "@/game/core";
import { CATALOG_LEADER_ABILITY_METADATA } from "@/game/catalog";
import { officialLeaderPromotionManifest } from "@/data/catalog/leaders/official-promotion";
import { buildSeatObservation } from "@/game/ai/seatObservation";

const RELENTLESS = "nilfgaard.emhyr-var-emreis-the-relentless";
const EREDIN_BRINGER = "monsters.eredin-bringer-of-death";

// Production fixtures.
const FIEND = "monsters.fiend"; // unit, close, "none"
const GERALT = "neutral.geralt-of-rivia"; // hero, close, muster_roach
const SCORCH_SPECIAL = "neutral.scorch"; // special, scorch
const FROST = "neutral.biting-frost"; // weather (special)
const YENNEFER = "neutral.yennefer-of-vengerberg"; // unit + medic

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp24-draw-opp-discard-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: "northern_realms",
      deckPreset: currentNorthernRealmsDeckPreset,
    },
    {
      seatId: "seat_b",
      playerId: "player-b",
      controllerKind: "ai",
      faction: "nilfgaard",
      deckPreset: currentNilfgaardDeckPreset,
    },
  ],
  catalog: {
    cards: currentCatalogCards,
    leaders: currentCatalogLeaders,
  },
});

const createState = (seed = "draw-opp-discard"): MatchState => startMatch(createConfig(seed)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const removeEverywhere = (state: MatchState, cardId: CardInstanceId) => {
  Object.values(state.seats).forEach((seat) => {
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
  state.weather.entries = state.weather.entries.filter((id) => id !== cardId);
};

const addCardInstance = (
  state: MatchState,
  ownerSeat: SeatId,
  sourceId: string,
  suffix: string,
): CardInstanceId => {
  const instanceId = `${ownerSeat}:test:${suffix}:${sourceId}`;
  const instance: CardInstance = {
    instanceId,
    sourceId,
    sourceKind: "card",
    owner: ownerSeat,
    controller: ownerSeat,
    zone: { kind: "hand", seat: ownerSeat },
  };
  state.cardsById[instanceId] = instance;
  state.seats[ownerSeat].hand.push(instanceId);
  return instanceId;
};

const placeInDiscard = (
  state: MatchState,
  discardSeat: SeatId,
  cardId: CardInstanceId,
  controller: SeatId = discardSeat,
) => {
  removeEverywhere(state, cardId);
  state.seats[discardSeat].discard.push(cardId);
  state.cardsById[cardId].zone = { kind: "discard", seat: discardSeat };
  state.cardsById[cardId].controller = controller;
};

const setLeader = (state: MatchState, seatId: SeatId, leaderSourceId: string) => {
  state.seats[seatId].leaderSourceId = leaderSourceId;
};

const givePlayingTurn = (state: MatchState, seatId: SeatId) => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.seats.seat_a.mulliganComplete = true;
  state.seats.seat_b.mulliganComplete = true;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
  state.pendingPrompt = null;
};

const legalMovesFor = (state: MatchState, seatId: SeatId): LegalMove[] =>
  getLegalMoves({
    state,
    seatId,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const useLeaderMoves = (state: MatchState, seatId: SeatId): UseLeaderMove[] =>
  legalMovesFor(state, seatId).filter((move): move is UseLeaderMove => move.kind === "use_leader");

const promptMoves = (state: MatchState, seatId: SeatId): ChoosePromptOptionMove[] =>
  legalMovesFor(state, seatId).filter(
    (move): move is ChoosePromptOptionMove => move.kind === "choose_prompt_option",
  );

describe("draw_opponent_discard metadata and manifest (cCp24)", () => {
  it("promotes draw_opponent_discard to implemented", () => {
    expect(CATALOG_LEADER_ABILITY_METADATA.draw_opponent_discard.status).toBe("implemented");
    expect(CATALOG_LEADER_ABILITY_METADATA.draw_opponent_discard.description.length).toBeGreaterThan(0);
  });

  it("includes Emhyr: The Relentless in executableLeaderSourceIds and not in placeholder/passive sets", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toContain(RELENTLESS);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toContain(RELENTLESS);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).not.toContain(RELENTLESS);
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain(
      "draw_opponent_discard",
    );
  });
});

describe("getOpponentDiscardDrawCandidates helper (cCp24)", () => {
  it("returns no candidates when the opponent discard is empty", () => {
    const state = createState("helper-empty");
    setLeader(state, "seat_a", RELENTLESS);
    givePlayingTurn(state, "seat_a");

    expect(
      getOpponentDiscardDrawCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("reads opponent discard, not own discard", () => {
    const state = createState("helper-own-vs-opp");
    setLeader(state, "seat_a", RELENTLESS);
    // Own discard has cards but opponent discard is empty.
    const ownFiend = addCardInstance(state, "seat_a", FIEND, "own-fiend");
    placeInDiscard(state, "seat_a", ownFiend);
    givePlayingTurn(state, "seat_a");

    expect(
      getOpponentDiscardDrawCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("preserves opponent discard insertion order", () => {
    const state = createState("helper-order");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_b", GERALT, "geralt");
    const scorch = addCardInstance(state, "seat_b", SCORCH_SPECIAL, "scorch");
    placeInDiscard(state, "seat_b", fiend);
    placeInDiscard(state, "seat_b", geralt);
    placeInDiscard(state, "seat_b", scorch);
    givePlayingTurn(state, "seat_a");

    const candidates = getOpponentDiscardDrawCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(candidates.map((c) => c.cardId)).toEqual([fiend, geralt, scorch]);
    expect(candidates.map((c) => c.sourceId)).toEqual([FIEND, GERALT, SCORCH_SPECIAL]);
    expect(candidates[0].label).toBe("Draw Fiend from opponent discard");
    expect(candidates[1].label).toBe("Draw Geralt of Rivia from opponent discard");
    expect(candidates[2].label).toBe("Draw Scorch from opponent discard");
  });

  it("includes units, heroes, specials, weather, and side-deck-only / generated cards", () => {
    const state = createState("helper-mixed");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_b", GERALT, "geralt");
    const scorch = addCardInstance(state, "seat_b", SCORCH_SPECIAL, "scorch");
    const frost = addCardInstance(state, "seat_b", FROST, "frost");
    const vildkaarl = addCardInstance(state, "seat_b", "skellige.vildkaarl", "vildkaarl");
    placeInDiscard(state, "seat_b", fiend);
    placeInDiscard(state, "seat_b", geralt);
    placeInDiscard(state, "seat_b", scorch);
    placeInDiscard(state, "seat_b", frost);
    placeInDiscard(state, "seat_b", vildkaarl);
    givePlayingTurn(state, "seat_a");

    const sourceIds = getOpponentDiscardDrawCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    }).map((c) => c.sourceId);
    expect(sourceIds).toContain(FIEND);
    expect(sourceIds).toContain(GERALT);
    expect(sourceIds).toContain(SCORCH_SPECIAL);
    expect(sourceIds).toContain(FROST);
    expect(sourceIds).toContain("skellige.vildkaarl");
  });

  it("skips discard entries with a missing card instance", () => {
    const state = createState("helper-missing-instance");
    setLeader(state, "seat_a", RELENTLESS);
    state.seats.seat_b.discard.push("seat_b:test:missing-instance:none");
    givePlayingTurn(state, "seat_a");

    expect(
      getOpponentDiscardDrawCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("skips discard entries whose catalog source is missing", () => {
    const state = createState("helper-missing-source");
    setLeader(state, "seat_a", RELENTLESS);
    const ghostCardId = "seat_b:test:ghost:fake.source";
    const ghost: CardInstance = {
      instanceId: ghostCardId,
      sourceId: "fake.source",
      sourceKind: "card",
      owner: "seat_b",
      controller: "seat_b",
      zone: { kind: "discard", seat: "seat_b" },
    };
    state.cardsById[ghostCardId] = ghost;
    state.seats.seat_b.discard.push(ghostCardId);
    givePlayingTurn(state, "seat_a");

    expect(
      getOpponentDiscardDrawCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("does not mutate input state when called twice", () => {
    const state = createState("helper-determinism");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");
    const before = structuredClone(state);

    getOpponentDiscardDrawCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    getOpponentDiscardDrawCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });

    expect(state).toEqual(before);
  });
});

describe("getLeaderMove integration for draw_opponent_discard (cCp24)", () => {
  it("emits no use_leader move when opponent discard is empty even if own discard has cards", () => {
    const state = createState("legal-opp-empty");
    setLeader(state, "seat_a", RELENTLESS);
    const ownFiend = addCardInstance(state, "seat_a", FIEND, "own-fiend");
    placeInDiscard(state, "seat_a", ownFiend);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits exactly one use_leader move with future_prompt metadata when opponent discard has at least one card", () => {
    const state = createState("legal-one");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move.metadata.ability).toBe("draw_opponent_discard");
    expect(move.metadata.abilityStatus).toBe("implemented");
    expect(move.metadata.targetRequirement).toBe("future_prompt");
    expect(move.target).toEqual({ kind: "none" });
    expect(move.metadata.targetCount).toBe(1);
    expect(move.metadata.targetLabel).toBe("opponent discard");
  });

  it("scales targetCount with opponent discard size", () => {
    const state = createState("legal-many");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_b", GERALT, "geralt");
    const scorch = addCardInstance(state, "seat_b", SCORCH_SPECIAL, "scorch");
    placeInDiscard(state, "seat_b", fiend);
    placeInDiscard(state, "seat_b", geralt);
    placeInDiscard(state, "seat_b", scorch);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.targetCount).toBe(3);
  });

  it("emits no use_leader move after the leader has been used", () => {
    const state = createState("legal-post-use");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(1);
    state.seats.seat_a.leaderUsed = true;
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });
});

describe("UseLeader command for draw_opponent_discard (cCp24)", () => {
  it("opens a choose_card prompt with one option per opponent-discard card in discard order", () => {
    const state = createState("use-leader-prompt");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_b", GERALT, "geralt");
    const frost = addCardInstance(state, "seat_b", FROST, "frost");
    placeInDiscard(state, "seat_b", fiend);
    placeInDiscard(state, "seat_b", geralt);
    placeInDiscard(state, "seat_b", frost);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const prompt = result.state.pendingPrompt;
    expect(prompt).not.toBeNull();
    expect(prompt?.kind).toBe("choose_card");
    expect(prompt?.abilityId).toBe("draw_opponent_discard");
    expect(prompt?.seatId).toBe("seat_a");
    expect(prompt?.sourceId).toBe(RELENTLESS);
    expect(prompt?.sourceCardId).toBe(state.seats.seat_a.leader);
    expect(prompt?.options.map((o) => o.target.cardId)).toEqual([fiend, geralt, frost]);
    expect(prompt?.options[0].optionId).toBe(`draw-opponent-discard:${fiend}`);
    expect(prompt?.options[0].label).toBe("Draw Fiend from opponent discard");
    expect(prompt?.options[1].label).toBe("Draw Geralt of Rivia from opponent discard");
    expect(prompt?.options[2].label).toBe("Draw Biting Frost from opponent discard");
    prompt?.options.forEach((option) => {
      expect((option.target as { row?: unknown }).row).toBeUndefined();
    });
  });

  it("emits ability_triggered and prompt_opened, does not move a card, does not set leaderUsed, does not emit leader_used, and keeps current turn", () => {
    const state = createState("use-leader-events");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const triggered = result.events.filter(
      (event) => event.type === "ability_triggered" && event.abilityId === "draw_opponent_discard",
    );
    expect(triggered).toHaveLength(1);
    expect(result.events.some((event) => event.type === "prompt_opened")).toBe(true);
    expect(result.events.some((event) => event.type === "card_moved")).toBe(false);
    expect(result.events.some((event) => event.type === "leader_used")).toBe(false);
    expect(result.state.seats.seat_a.leaderUsed).toBe(false);
    expect(result.state.currentTurn).toBe("seat_a");
    // The chosen card has not moved out of the opponent discard yet.
    expect(result.state.seats.seat_b.discard).toContain(fiend);
  });

  it("rejects a non-none target without consuming the leader", () => {
    const state = createState("use-leader-bad-target");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");
    const before = structuredClone(state);

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      }),
    ).toThrow(EngineRuleError);
    expect(state).toEqual(before);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects a manual UseLeader when opponent discard is empty without setting leaderUsed or mutating state", () => {
    const state = createState("use-leader-empty");
    setLeader(state, "seat_a", RELENTLESS);
    givePlayingTurn(state, "seat_a");
    const before = structuredClone(state);

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "none" },
      }),
    ).toThrow(EngineRuleError);
    expect(state).toEqual(before);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });
});

describe("ChoosePromptOption resolution for draw_opponent_discard (cCp24)", () => {
  it("moves the chosen card from opponent discard to acting hand, sets controller, leaves owner unchanged, clears prompt, sets leaderUsed, emits expected events, and hands off the turn", () => {
    const state = createState("resolve-success");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_b", GERALT, "geralt");
    placeInDiscard(state, "seat_b", fiend);
    placeInDiscard(state, "seat_b", geralt);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const prompt = opened.state.pendingPrompt!;
    expect(prompt).toBeDefined();
    const ownerBefore = opened.state.cardsById[geralt].owner;

    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt.promptId,
      optionId: `draw-opponent-discard:${geralt}`,
    });

    // Card moved from opponent discard to acting hand.
    expect(resolved.state.seats.seat_b.discard).not.toContain(geralt);
    expect(resolved.state.seats.seat_a.hand).toContain(geralt);

    // Controller set to acting seat; owner unchanged.
    expect(resolved.state.cardsById[geralt].controller).toBe("seat_a");
    expect(resolved.state.cardsById[geralt].owner).toBe(ownerBefore);

    // Pending prompt cleared.
    expect(resolved.state.pendingPrompt).toBeNull();

    // Leader consumed.
    expect(resolved.state.seats.seat_a.leaderUsed).toBe(true);

    // Turn handed off.
    expect(resolved.state.currentTurn).toBe("seat_b");

    // prompt_resolved event.
    expect(
      resolved.events.some(
        (event) =>
          event.type === "prompt_resolved" &&
          event.promptId === prompt.promptId &&
          event.optionId === `draw-opponent-discard:${geralt}`,
      ),
    ).toBe(true);

    // card_moved.reason "leader_draw_opponent_discard_to_hand".
    expect(
      resolved.events.some(
        (event) =>
          event.type === "card_moved" &&
          event.cardId === geralt &&
          event.reason === "leader_draw_opponent_discard_to_hand" &&
          event.from?.kind === "discard" &&
          event.to.kind === "hand",
      ),
    ).toBe(true);

    // ability_resolved with outcome "drew_opponent_discard".
    expect(
      resolved.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "draw_opponent_discard" &&
          event.outcome === "drew_opponent_discard",
      ),
    ).toBe(true);

    // leader_used event.
    expect(
      resolved.events.some(
        (event) =>
          event.type === "leader_used" &&
          event.seatId === "seat_a" &&
          event.abilityId === "draw_opponent_discard",
      ),
    ).toBe(true);

    // turn_set turn_handoff event.
    expect(
      resolved.events.some(
        (event) => event.type === "turn_set" && event.reason === "turn_handoff",
      ),
    ).toBe(true);
  });

  it("recycles an off-owner card (acting-seat-owned card sitting in opponent discard) to acting hand with owner preserved and controller reset to the acting seat", () => {
    const state = createState("resolve-off-owner");
    setLeader(state, "seat_a", RELENTLESS);
    // Construct a card with `owner: seat_a` physically in seat_b's discard
    // (e.g. a Spy that was discarded after round cleanup on the opposite
    // board side).
    const offOwnerInstanceId = "seat_a:test:spy-on-b:monsters.fiend";
    state.cardsById[offOwnerInstanceId] = {
      instanceId: offOwnerInstanceId,
      sourceId: FIEND,
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_b",
      zone: { kind: "discard", seat: "seat_b" },
    };
    state.seats.seat_b.discard.push(offOwnerInstanceId);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: `draw-opponent-discard:${offOwnerInstanceId}`,
    });

    expect(resolved.state.seats.seat_a.hand).toContain(offOwnerInstanceId);
    expect(resolved.state.seats.seat_b.discard).not.toContain(offOwnerInstanceId);
    expect(resolved.state.cardsById[offOwnerInstanceId].owner).toBe("seat_a");
    expect(resolved.state.cardsById[offOwnerInstanceId].controller).toBe("seat_a");
    expect(resolved.state.cardsById[offOwnerInstanceId].zone).toEqual({ kind: "hand", seat: "seat_a" });
  });

  it("can choose a unit, hero, special, or weather card", () => {
    const state = createState("resolve-kinds");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_b", GERALT, "geralt");
    const scorch = addCardInstance(state, "seat_b", SCORCH_SPECIAL, "scorch");
    const frost = addCardInstance(state, "seat_b", FROST, "frost");
    placeInDiscard(state, "seat_b", fiend);
    placeInDiscard(state, "seat_b", geralt);
    placeInDiscard(state, "seat_b", scorch);
    placeInDiscard(state, "seat_b", frost);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const prompt = opened.state.pendingPrompt!;

    // Choose the hero card.
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt.promptId,
      optionId: `draw-opponent-discard:${geralt}`,
    });

    expect(resolved.state.seats.seat_a.hand).toContain(geralt);
    expect(resolved.state.seats.seat_a.hand).not.toContain(fiend);
    expect(resolved.state.seats.seat_a.hand).not.toContain(scorch);
    expect(resolved.state.seats.seat_a.hand).not.toContain(frost);
  });

  it("does not emit card_played and does not resolve the drawn card's abilities (Yennefer Medic / Scorch / Frost weather all enter hand only)", () => {
    const state = createState("resolve-no-trigger");
    setLeader(state, "seat_a", RELENTLESS);
    const yenny = addCardInstance(state, "seat_b", YENNEFER, "yenny");
    placeInDiscard(state, "seat_b", yenny);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const prompt = opened.state.pendingPrompt!;

    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt.promptId,
      optionId: `draw-opponent-discard:${yenny}`,
    });

    // Yennefer is in acting hand, no Medic prompt opened.
    expect(resolved.state.seats.seat_a.hand).toContain(yenny);
    expect(resolved.state.pendingPrompt).toBeNull();
    // No card_played event for the drawn card.
    expect(resolved.events.some((event) => event.type === "card_played")).toBe(false);
    // No scorch_resolved (drew a non-Scorch card, but verifying nothing fires).
    expect(resolved.events.some((event) => event.type === "scorch_resolved")).toBe(false);
  });

  it("does not trigger Scorch destruction or weather entry when those cards are drawn from opponent discard", () => {
    const state = createState("resolve-special-weather");
    setLeader(state, "seat_a", RELENTLESS);
    const scorch = addCardInstance(state, "seat_b", SCORCH_SPECIAL, "scorch");
    const frost = addCardInstance(state, "seat_b", FROST, "frost");
    placeInDiscard(state, "seat_b", scorch);
    placeInDiscard(state, "seat_b", frost);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const prompt = opened.state.pendingPrompt!;
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt.promptId,
      optionId: `draw-opponent-discard:${frost}`,
    });

    // Frost lands in hand, not the weather zone.
    expect(resolved.state.seats.seat_a.hand).toContain(frost);
    expect(resolved.state.weather.entries).not.toContain(frost);
    // Scorch was not chosen and remains in opponent discard.
    expect(resolved.state.seats.seat_b.discard).toContain(scorch);
    // No scorch_resolved event.
    expect(resolved.events.some((event) => event.type === "scorch_resolved")).toBe(false);
  });

  it("rejects wrong-seat ChoosePromptOption without consuming the leader", () => {
    const state = createState("resolve-wrong-seat");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const prompt = opened.state.pendingPrompt!;
    const before = structuredClone(opened.state);

    expect(() =>
      execute(opened.state, {
        type: "ChoosePromptOption",
        seatId: "seat_b",
        promptId: prompt.promptId,
        optionId: `draw-opponent-discard:${fiend}`,
      }),
    ).toThrow(EngineRuleError);
    expect(opened.state).toEqual(before);
    expect(opened.state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects an invalid option ID without consuming the leader", () => {
    const state = createState("resolve-invalid-option");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const before = structuredClone(opened.state);

    expect(() =>
      execute(opened.state, {
        type: "ChoosePromptOption",
        seatId: "seat_a",
        promptId: opened.state.pendingPrompt!.promptId,
        optionId: "draw-opponent-discard:nonexistent",
      }),
    ).toThrow(EngineRuleError);
    expect(opened.state).toEqual(before);
    expect(opened.state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects a stale target no longer in opponent discard without consuming the leader", () => {
    const state = createState("resolve-stale-target");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    // Simulate drift: the targeted card is no longer in opponent discard.
    const drifted = structuredClone(opened.state);
    removeEverywhere(drifted, fiend);
    drifted.seats.seat_b.deck.push(fiend);
    drifted.cardsById[fiend].zone = { kind: "deck", seat: "seat_b" };
    const driftedSnapshot = structuredClone(drifted);

    expect(() =>
      execute(drifted, {
        type: "ChoosePromptOption",
        seatId: "seat_a",
        promptId: drifted.pendingPrompt!.promptId,
        optionId: `draw-opponent-discard:${fiend}`,
      }),
    ).toThrow(EngineRuleError);
    expect(drifted).toEqual(driftedSnapshot);
    expect(drifted.seats.seat_a.leaderUsed).toBe(false);
  });

  it("does not allow choosing an own-discard card (the prompt only contains opponent discard candidates)", () => {
    const state = createState("resolve-cannot-choose-own");
    setLeader(state, "seat_a", RELENTLESS);
    const ownFiend = addCardInstance(state, "seat_a", FIEND, "own-fiend");
    const oppGeralt = addCardInstance(state, "seat_b", GERALT, "opp-geralt");
    placeInDiscard(state, "seat_a", ownFiend);
    placeInDiscard(state, "seat_b", oppGeralt);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(opened.state.pendingPrompt!.options.map((o) => o.target.cardId)).toEqual([oppGeralt]);
    // No option keyed for the own-discard card.
    expect(
      opened.state.pendingPrompt!.options.some(
        (option) => option.optionId === `draw-opponent-discard:${ownFiend}`,
      ),
    ).toBe(false);
  });
});

describe("getPromptMoves shape for draw_opponent_discard (cCp24)", () => {
  it("emits opponent-side card_instance prompt move targets for the prompt-owning seat", () => {
    const state = createState("prompt-moves-opp");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_b", GERALT, "geralt");
    placeInDiscard(state, "seat_b", fiend);
    placeInDiscard(state, "seat_b", geralt);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const moves = promptMoves(opened.state, "seat_a");
    expect(moves).toHaveLength(2);
    moves.forEach((move) => {
      expect(move.target.kind).toBe("card_instance");
      if (move.target.kind === "card_instance") {
        expect(move.target.side).toBe("opponent");
        expect(move.target.seatId).toBe("seat_b");
        expect(move.target.row).toBeUndefined();
      }
      expect(move.metadata.abilityId).toBe("draw_opponent_discard");
      expect(move.metadata.promptKind).toBe("choose_card");
    });
  });

  it("returns no prompt moves to the non-acting seat (hidden-info safety)", () => {
    const state = createState("prompt-moves-hidden");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(promptMoves(opened.state, "seat_b")).toEqual([]);
  });

  it("preserves cCp22 restore prompt own-side target shape (regression)", () => {
    const state = createState("prompt-moves-restore-regression");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const ownFiend = addCardInstance(state, "seat_a", FIEND, "own-fiend");
    placeInDiscard(state, "seat_a", ownFiend);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const moves = promptMoves(opened.state, "seat_a");
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move.target.kind).toBe("card_instance");
    if (move.target.kind === "card_instance") {
      expect(move.target.side).toBe("own");
      expect(move.target.seatId).toBe("seat_a");
    }
    expect(move.metadata.abilityId).toBe("restore_discard_to_hand");
  });
});

describe("seatObservation hidden-info safety (cCp24)", () => {
  it("exposes prompt options only to the prompt-owning seat", () => {
    const state = createState("observation-prompt-hidden");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const acting = buildSeatObservation({
      state: opened.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const opponent = buildSeatObservation({
      state: opened.state,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });

    expect(acting.pendingPrompt).not.toBeNull();
    expect(acting.pendingPrompt?.options).toHaveLength(1);
    expect(acting.pendingPrompt?.options[0].targetCardId).toBe(fiend);
    expect(acting.pendingPrompt?.options[0].targetStrength).toBeGreaterThan(0); // Fiend has printed strength
    expect(opponent.pendingPrompt).toBeNull();
  });
});

describe("post-use legal-move state (cCp24)", () => {
  it("after the leader is used, getLegalMoves emits no Relentless leader move", () => {
    const state = createState("post-use-no-move");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", fiend);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: `draw-opponent-discard:${fiend}`,
    });

    // Force seat_a back to current to verify the leader move is no longer
    // emitted (it was used).
    resolved.state.currentTurn = "seat_a";
    expect(useLeaderMoves(resolved.state, "seat_a")).toEqual([]);
  });
});
