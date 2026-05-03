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
  getRestoreDiscardCandidates,
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

const EREDIN_BRINGER = "monsters.eredin-bringer-of-death";

// Production fixtures: a unit, a hero, a special (Scorch), and weather sources.
const FIEND = "monsters.fiend"; // unit, close, "none"
const GERALT = "neutral.geralt-of-rivia"; // hero, close, muster_roach
const SCORCH_SPECIAL = "neutral.scorch"; // special, scorch
const FROST = "neutral.biting-frost"; // weather (special)
const FOG = "neutral.impenetrable-fog"; // weather (special)

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp22-restore-discard-${seed}`,
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

const createState = (seed = "restore-discard"): MatchState => startMatch(createConfig(seed)).state;

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
  seatId: SeatId,
  sourceId: string,
  suffix: string,
): CardInstanceId => {
  const instanceId = `${seatId}:test:${suffix}:${sourceId}`;
  const instance: CardInstance = {
    instanceId,
    sourceId,
    sourceKind: "card",
    owner: seatId,
    controller: seatId,
    zone: { kind: "hand", seat: seatId },
  };
  state.cardsById[instanceId] = instance;
  state.seats[seatId].hand.push(instanceId);
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

describe("restore_discard_to_hand metadata and manifest (cCp22)", () => {
  it("promotes restore_discard_to_hand to implemented", () => {
    expect(CATALOG_LEADER_ABILITY_METADATA.restore_discard_to_hand.status).toBe("implemented");
    expect(CATALOG_LEADER_ABILITY_METADATA.restore_discard_to_hand.description.length).toBeGreaterThan(0);
  });

  it("includes Eredin: Bringer of Death in executableLeaderSourceIds and not in placeholder/passive sets", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toContain(EREDIN_BRINGER);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toContain(EREDIN_BRINGER);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).not.toContain(EREDIN_BRINGER);
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain("restore_discard_to_hand");
  });
});

describe("getRestoreDiscardCandidates helper (cCp22)", () => {
  it("returns no candidates when the seat's discard is empty", () => {
    const state = createState("helper-empty");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    givePlayingTurn(state, "seat_a");

    expect(
      getRestoreDiscardCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("preserves discard insertion order", () => {
    const state = createState("helper-order");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    const scorch = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "scorch");
    placeInDiscard(state, "seat_a", fiend);
    placeInDiscard(state, "seat_a", geralt);
    placeInDiscard(state, "seat_a", scorch);
    givePlayingTurn(state, "seat_a");

    const candidates = getRestoreDiscardCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(candidates.map((c) => c.cardId)).toEqual([fiend, geralt, scorch]);
    expect(candidates.map((c) => c.sourceId)).toEqual([FIEND, GERALT, SCORCH_SPECIAL]);
    expect(candidates[0].label).toBe("Restore Fiend to hand");
    expect(candidates[1].label).toBe("Restore Geralt of Rivia to hand");
  });

  it("includes units, heroes, specials, and weather sources together", () => {
    const state = createState("helper-mixed");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    const scorch = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "scorch");
    const frost = addCardInstance(state, "seat_a", FROST, "frost");
    placeInDiscard(state, "seat_a", fiend);
    placeInDiscard(state, "seat_a", geralt);
    placeInDiscard(state, "seat_a", scorch);
    placeInDiscard(state, "seat_a", frost);
    givePlayingTurn(state, "seat_a");

    const sourceIds = getRestoreDiscardCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    }).map((c) => c.sourceId);
    expect(sourceIds).toContain(FIEND);
    expect(sourceIds).toContain(GERALT);
    expect(sourceIds).toContain(SCORCH_SPECIAL);
    expect(sourceIds).toContain(FROST);
  });

  it("includes a side-deck-only generated card if it physically reaches discard", () => {
    const state = createState("helper-side-deck-generated");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    // Vildkaarl is `side_deck_only`. Place an instance directly into seat_a's
    // discard pile to simulate that it transformed and was destroyed back to
    // the controller's discard.
    const vildkaarl = addCardInstance(state, "seat_a", "skellige.vildkaarl", "vildkaarl");
    placeInDiscard(state, "seat_a", vildkaarl);
    givePlayingTurn(state, "seat_a");

    const candidates = getRestoreDiscardCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(candidates.map((c) => c.cardId)).toContain(vildkaarl);
  });

  it("excludes opponent discard, hand, deck, board, removed-from-game, and weather entries", () => {
    const state = createState("helper-exclusion");
    setLeader(state, "seat_a", EREDIN_BRINGER);

    // Fixtures that should NOT show up.
    const oppDiscarded = addCardInstance(state, "seat_b", FIEND, "oppDiscard");
    placeInDiscard(state, "seat_b", oppDiscarded);

    // Discard owned by seat_a is the only set the helper considers.
    const ownDiscard = addCardInstance(state, "seat_a", GERALT, "ownDiscard");
    placeInDiscard(state, "seat_a", ownDiscard);

    givePlayingTurn(state, "seat_a");

    const ids = getRestoreDiscardCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    }).map((c) => c.cardId);
    expect(ids).toEqual([ownDiscard]);
    expect(ids).not.toContain(oppDiscarded);
  });

  it("skips discard entries with a missing card instance", () => {
    const state = createState("helper-missing-instance");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    state.seats.seat_a.discard.push("seat_a:test:missing-instance:none");
    givePlayingTurn(state, "seat_a");

    expect(
      getRestoreDiscardCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("skips discard entries whose catalog source is missing", () => {
    const state = createState("helper-missing-source");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const ghostCardId = "seat_a:test:ghost:fake.source";
    const ghost: CardInstance = {
      instanceId: ghostCardId,
      sourceId: "fake.source",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "discard", seat: "seat_a" },
    };
    state.cardsById[ghostCardId] = ghost;
    state.seats.seat_a.discard.push(ghostCardId);
    givePlayingTurn(state, "seat_a");

    expect(
      getRestoreDiscardCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("does not mutate input state when called twice", () => {
    const state = createState("helper-determinism");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");
    const before = structuredClone(state);

    getRestoreDiscardCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    getRestoreDiscardCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });

    expect(state).toEqual(before);
  });
});

describe("getLeaderMove integration for restore_discard_to_hand (cCp22)", () => {
  it("emits no use_leader move when own discard has no eligible cards", () => {
    const state = createState("legal-empty");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits exactly one use_leader move with future_prompt metadata when discard has at least one card", () => {
    const state = createState("legal-one");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move.metadata.ability).toBe("restore_discard_to_hand");
    expect(move.metadata.abilityStatus).toBe("implemented");
    expect(move.metadata.targetRequirement).toBe("future_prompt");
    expect(move.target).toEqual({ kind: "none" });
    expect(move.metadata.targetCount).toBe(1);
    expect(move.metadata.targetLabel).toBe("own discard");
  });

  it("scales targetCount with discard size", () => {
    const state = createState("legal-many");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    const scorch = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "scorch");
    placeInDiscard(state, "seat_a", fiend);
    placeInDiscard(state, "seat_a", geralt);
    placeInDiscard(state, "seat_a", scorch);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.targetCount).toBe(3);
  });

  it("emits no use_leader move after the leader has been used", () => {
    const state = createState("legal-post-use");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(1);
    state.seats.seat_a.leaderUsed = true;
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("respects the leader's own-discard-only contract (opponent discard does not count)", () => {
    const state = createState("legal-own-only");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    // Only opponent discard has cards; acting seat's discard is empty.
    const oppFiend = addCardInstance(state, "seat_b", FIEND, "oppFiend");
    placeInDiscard(state, "seat_b", oppFiend);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });
});

describe("UseLeader command for restore_discard_to_hand (cCp22)", () => {
  it("opens a choose_card prompt with one option per own-discard card in discard order", () => {
    const state = createState("use-leader-prompt");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    const frost = addCardInstance(state, "seat_a", FROST, "frost");
    placeInDiscard(state, "seat_a", fiend);
    placeInDiscard(state, "seat_a", geralt);
    placeInDiscard(state, "seat_a", frost);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const prompt = result.state.pendingPrompt;
    expect(prompt).not.toBeNull();
    expect(prompt?.kind).toBe("choose_card");
    expect(prompt?.abilityId).toBe("restore_discard_to_hand");
    expect(prompt?.seatId).toBe("seat_a");
    expect(prompt?.sourceId).toBe(EREDIN_BRINGER);
    expect(prompt?.sourceCardId).toBe(state.seats.seat_a.leader);
    expect(prompt?.options.map((o) => o.target.cardId)).toEqual([fiend, geralt, frost]);
    expect(prompt?.options[0].optionId).toBe(`restore:${fiend}`);
    expect(prompt?.options[0].label).toBe("Restore Fiend to hand");
    expect(prompt?.options[1].label).toBe("Restore Geralt of Rivia to hand");
    expect(prompt?.options[2].label).toBe("Restore Biting Frost to hand");
    // No board row on prompt option targets.
    prompt?.options.forEach((option) => {
      expect((option.target as { row?: unknown }).row).toBeUndefined();
    });
  });

  it("emits ability_triggered and prompt_opened, does not move a card, does not set leaderUsed, does not emit leader_used, and keeps current turn", () => {
    const state = createState("use-leader-events");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const triggered = result.events.filter(
      (event) => event.type === "ability_triggered" && event.abilityId === "restore_discard_to_hand",
    );
    expect(triggered).toHaveLength(1);
    expect(result.events.some((event) => event.type === "prompt_opened")).toBe(true);
    expect(result.events.some((event) => event.type === "card_moved")).toBe(false);
    expect(result.events.some((event) => event.type === "leader_used")).toBe(false);
    expect(result.state.seats.seat_a.leaderUsed).toBe(false);
    expect(result.state.currentTurn).toBe("seat_a");
    // The chosen card has not moved out of the discard yet.
    expect(result.state.seats.seat_a.discard).toContain(fiend);
  });

  it("rejects a non-none target without consuming the leader", () => {
    const state = createState("use-leader-bad-target");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
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

  it("rejects a manual UseLeader when own discard is empty (without setting leaderUsed)", () => {
    const state = createState("use-leader-empty");
    setLeader(state, "seat_a", EREDIN_BRINGER);
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

describe("ChoosePromptOption resolution for restore_discard_to_hand (cCp22)", () => {
  it("moves the chosen card from discard to acting hand, sets controller, leaves owner unchanged, clears pending prompt, sets leaderUsed, emits the expected events, and hands off the turn", () => {
    const state = createState("resolve-success");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    placeInDiscard(state, "seat_a", fiend);
    placeInDiscard(state, "seat_a", geralt);
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
      optionId: `restore:${geralt}`,
    });

    // Card moved from discard to hand.
    expect(resolved.state.seats.seat_a.discard).not.toContain(geralt);
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
          event.optionId === `restore:${geralt}`,
      ),
    ).toBe(true);

    // card_moved.reason "leader_restore_discard_to_hand".
    expect(
      resolved.events.some(
        (event) =>
          event.type === "card_moved" &&
          event.cardId === geralt &&
          event.reason === "leader_restore_discard_to_hand" &&
          event.from.kind === "discard" &&
          event.to.kind === "hand",
      ),
    ).toBe(true);

    // ability_resolved with outcome "restored_card".
    expect(
      resolved.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "restore_discard_to_hand" &&
          event.outcome === "restored_card",
      ),
    ).toBe(true);

    // leader_used event.
    expect(
      resolved.events.some(
        (event) =>
          event.type === "leader_used" &&
          event.seatId === "seat_a" &&
          event.abilityId === "restore_discard_to_hand",
      ),
    ).toBe(true);

    // turn_set turn_handoff event.
    expect(
      resolved.events.some(
        (event) => event.type === "turn_set" && event.reason === "turn_handoff",
      ),
    ).toBe(true);
  });

  it("does not emit card_played and does not resolve the restored card's abilities (Medic restored returns to hand only)", () => {
    const state = createState("resolve-no-abilities");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    // Yennefer (`medic`) — placed into discard, restored — must not open a Medic prompt.
    const yenny = addCardInstance(state, "seat_a", "neutral.yennefer-of-vengerberg", "yenny");
    placeInDiscard(state, "seat_a", yenny);
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
      optionId: `restore:${yenny}`,
    });

    expect(resolved.events.some((event) => event.type === "card_played")).toBe(false);
    expect(
      resolved.events.some(
        (event) => event.type === "ability_triggered" && event.abilityId === "medic",
      ),
    ).toBe(false);
    // No new pending prompt was opened by the restored card.
    expect(resolved.state.pendingPrompt).toBeNull();
    // Card is in hand, not on the board.
    expect(resolved.state.seats.seat_a.hand).toContain(yenny);
  });

  it("heroes are eligible for restoration", () => {
    const state = createState("resolve-hero");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    placeInDiscard(state, "seat_a", geralt);
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
      optionId: `restore:${geralt}`,
    });

    expect(resolved.state.seats.seat_a.hand).toContain(geralt);
    expect(resolved.state.seats.seat_a.discard).not.toContain(geralt);
  });

  it("specials and weather are eligible and return to hand without being played to the weather zone", () => {
    const state = createState("resolve-special-weather");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const scorch = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "scorch");
    const fog = addCardInstance(state, "seat_a", FOG, "fog");
    placeInDiscard(state, "seat_a", scorch);
    placeInDiscard(state, "seat_a", fog);
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
      optionId: `restore:${fog}`,
    });

    expect(resolved.state.seats.seat_a.hand).toContain(fog);
    expect(resolved.state.weather.entries).not.toContain(fog);
    // Scorch did not fire (the restored Scorch is just back in hand).
    expect(
      resolved.events.some(
        (event) => event.type === "ability_triggered" && event.abilityId === "scorch",
      ),
    ).toBe(false);
  });

  it("rejects when the prompt is for a different seat", () => {
    const state = createState("resolve-wrong-seat");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
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
        seatId: "seat_b",
        promptId: opened.state.pendingPrompt!.promptId,
        optionId: `restore:${fiend}`,
      }),
    ).toThrow(EngineRuleError);
    expect(opened.state).toEqual(before);
    expect(opened.state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects an invalid option ID without consuming the leader", () => {
    const state = createState("resolve-bad-option");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
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
        optionId: "restore:not-a-real-card",
      }),
    ).toThrow(EngineRuleError);
    expect(opened.state).toEqual(before);
    expect(opened.state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects a stale target that is no longer in the acting seat's discard pile", () => {
    const state = createState("resolve-stale-target");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    // Externally move the card out of the discard pile (simulating drift).
    const stale = structuredClone(opened.state);
    stale.seats.seat_a.discard = stale.seats.seat_a.discard.filter((id) => id !== fiend);
    stale.cardsById[fiend].zone = { kind: "removed_from_game", seat: "seat_a" };
    stale.seats.seat_a.removedFromGame.push(fiend);
    const before = structuredClone(stale);

    expect(() =>
      execute(stale, {
        type: "ChoosePromptOption",
        seatId: "seat_a",
        promptId: stale.pendingPrompt!.promptId,
        optionId: `restore:${fiend}`,
      }),
    ).toThrow(EngineRuleError);
    expect(stale).toEqual(before);
    expect(stale.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects ChoosePromptOption when no prompt is pending", () => {
    const state = createState("resolve-missing-prompt");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    givePlayingTurn(state, "seat_a");

    expect(() =>
      execute(state, {
        type: "ChoosePromptOption",
        seatId: "seat_a",
        promptId: "nope",
        optionId: "restore:nope",
      }),
    ).toThrow(EngineRuleError);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("emits no use_leader move after the leader has been consumed by a successful restore", () => {
    const state = createState("post-restore-no-leader");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
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
      optionId: `restore:${fiend}`,
    });

    // Reset the turn to seat_a so we can check that no new use_leader move appears.
    resolved.state.currentTurn = "seat_a";
    const moves = useLeaderMoves(resolved.state, "seat_a");
    expect(moves).toEqual([]);
  });
});

describe("legal prompt moves expose the restore_discard_to_hand options to the acting seat (cCp22)", () => {
  it("returns one choose_prompt_option move per option after the prompt opens, with no-row card_instance targets", () => {
    const state = createState("prompt-moves");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    placeInDiscard(state, "seat_a", fiend);
    placeInDiscard(state, "seat_a", geralt);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const moves = promptMoves(opened.state, "seat_a");
    expect(moves).toHaveLength(2);
    moves.forEach((move) => {
      expect(move.metadata.promptKind).toBe("choose_card");
      expect(move.metadata.abilityId).toBe("restore_discard_to_hand");
      expect(move.target.kind).toBe("card_instance");
      if (move.target.kind === "card_instance") {
        expect(move.target.side).toBe("own");
        expect(move.target.row).toBeUndefined();
      }
    });
    const cardIds = moves
      .map((move) => (move.target.kind === "card_instance" ? move.target.cardId : null))
      .filter((id): id is CardInstanceId => id !== null);
    expect(cardIds).toEqual([fiend, geralt]);
  });

  it("returns no prompt moves to the non-acting seat (hidden-info safety)", () => {
    const state = createState("prompt-moves-hidden");
    setLeader(state, "seat_a", EREDIN_BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(promptMoves(opened.state, "seat_b")).toEqual([]);
    expect(legalMovesFor(opened.state, "seat_b")).toEqual([]);
  });
});

describe("Medic prompt regression remains intact (cCp22 must not break Medic)", () => {
  it("Medic prompts still emit choose_prompt_option moves with row-bearing card_instance targets", () => {
    // Use Yennefer's Medic from a fresh state by replaying a tiny fixture.
    const state = createState("medic-regression");
    // Place a Medic source on the board and configure a discardable unit so
    // the Medic prompt opens via PlayCard.
    const yenny = addCardInstance(state, "seat_a", "neutral.yennefer-of-vengerberg", "yenny");
    const target = addCardInstance(state, "seat_a", FIEND, "fiendDiscarded");
    placeInDiscard(state, "seat_a", target);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: yenny,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    const prompt = result.state.pendingPrompt;
    expect(prompt?.kind).toBe("medic_revive");
    const moves = promptMoves(result.state, "seat_a");
    expect(moves.length).toBeGreaterThan(0);
    moves.forEach((move) => {
      expect(move.target.kind).toBe("card_instance");
      if (move.target.kind === "card_instance") {
        expect(move.target.row).toBeDefined();
      }
    });
  });
});

// Pin fixture imports so the catalog drift surfaces in this file rather than
// in another test.
void EREDIN_BRINGER;
void FROST;
void FOG;
void SCORCH_SPECIAL;
void GERALT;
void FIEND;
