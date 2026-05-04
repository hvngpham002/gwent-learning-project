import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import { CATALOG_LEADER_ABILITY_METADATA } from "@/game/catalog";
import { officialLeaderPromotionManifest } from "@/data/catalog/leaders/official-promotion";
import {
  EngineRuleError,
  buildDeckDrawOptions,
  buildDiscardSelectionOptions,
  executeCommand,
  getDiscardDrawEligibility,
  getLegalMoves,
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

const DESTROYER = "monsters.eredin-destroyer-of-worlds";
const BRINGER = "monsters.eredin-bringer-of-death";
const RELENTLESS = "nilfgaard.emhyr-var-emreis-the-relentless";
const FOLTEST_LORD_COMMANDER = "northern-realms.foltest-lord-commander-of-the-north";

const FIEND = "monsters.fiend";
const GERALT = "neutral.geralt-of-rivia";
const SCORCH_SPECIAL = "neutral.scorch";
const FROST = "neutral.biting-frost";
const FOG = "neutral.impenetrable-fog";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp27-discard-draw-${seed}`,
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

const createState = (seed: string | number = "discard-draw"): MatchState =>
  startMatch(createConfig(seed)).state;

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

const moveToHand = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].hand.push(cardId);
  state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
  state.cardsById[cardId].controller = seatId;
};

const replaceHandWith = (state: MatchState, seatId: SeatId, cardIds: readonly CardInstanceId[]) => {
  state.seats[seatId].hand = [...cardIds];
  cardIds.forEach((cardId) => {
    state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const replaceDeckWith = (state: MatchState, seatId: SeatId, cardIds: readonly CardInstanceId[]) => {
  state.seats[seatId].deck = [...cardIds];
  cardIds.forEach((cardId) => {
    state.cardsById[cardId].zone = { kind: "deck", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
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

describe("discard_two_draw_one_from_deck metadata and manifest (cCp27)", () => {
  it("promotes discard_two_draw_one_from_deck to implemented", () => {
    expect(CATALOG_LEADER_ABILITY_METADATA.discard_two_draw_one_from_deck.status).toBe(
      "implemented",
    );
    expect(
      CATALOG_LEADER_ABILITY_METADATA.discard_two_draw_one_from_deck.description.length,
    ).toBeGreaterThan(0);
  });

  it("includes Destroyer of Worlds in executableLeaderSourceIds and the implemented union", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toContain(DESTROYER);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toContain(DESTROYER);
  });

  it("excludes Destroyer of Worlds from passive and setup-time buckets", () => {
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).not.toContain(
      DESTROYER,
    );
    expect(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds).not.toContain(
      DESTROYER,
    );
  });

  it("removes discard_two_draw_one_from_deck from placeholderLeaderAbilityIds", () => {
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain(
      "discard_two_draw_one_from_deck",
    );
  });

  it("placeholder list is empty after cCp29", () => {
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).toEqual([]);
  });

  it("manifest counts after cCp29: 14 executable + 7 passive + 1 setup = 22 implemented, 0 placeholder", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toHaveLength(14);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).toHaveLength(7);
    expect(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds).toHaveLength(1);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toHaveLength(22);
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).toHaveLength(0);
  });
});

describe("getDiscardDrawEligibility helper (cCp27)", () => {
  it("returns canUse=false for an empty hand even with a non-empty deck", () => {
    const state = createState("eligibility-empty-hand");
    setLeader(state, "seat_a", DESTROYER);
    state.seats.seat_a.hand = [];
    givePlayingTurn(state, "seat_a");

    const eligibility = getDiscardDrawEligibility({ state, seatId: "seat_a" });
    expect(eligibility.canUse).toBe(false);
    expect(eligibility.handCount).toBe(0);
    expect(eligibility.deckCount).toBeGreaterThan(0);
    expect(eligibility.minDiscardCount).toBe(1);
    expect(eligibility.maxDiscardCount).toBe(2);
  });

  it("returns canUse=false for an empty deck even with a non-empty hand", () => {
    const state = createState("eligibility-empty-deck");
    setLeader(state, "seat_a", DESTROYER);
    state.seats.seat_a.deck = [];
    givePlayingTurn(state, "seat_a");

    const eligibility = getDiscardDrawEligibility({ state, seatId: "seat_a" });
    expect(eligibility.canUse).toBe(false);
    expect(eligibility.deckCount).toBe(0);
    expect(eligibility.handCount).toBeGreaterThan(0);
  });

  it("returns canUse=true for one hand card and one deck card", () => {
    const state = createState("eligibility-one-each");
    setLeader(state, "seat_a", DESTROYER);
    const handFiend = addCardInstance(state, "seat_a", FIEND, "hand-fiend");
    state.seats.seat_a.hand = [handFiend];
    state.seats.seat_a.deck = state.seats.seat_a.deck.slice(0, 1);
    givePlayingTurn(state, "seat_a");

    const eligibility = getDiscardDrawEligibility({ state, seatId: "seat_a" });
    expect(eligibility.canUse).toBe(true);
    expect(eligibility.handCount).toBe(1);
    expect(eligibility.deckCount).toBe(1);
  });

  it("returns canUse=true for many hand cards and a non-empty deck", () => {
    const state = createState("eligibility-many");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    const eligibility = getDiscardDrawEligibility({ state, seatId: "seat_a" });
    expect(eligibility.canUse).toBe(true);
    expect(eligibility.handCount).toBeGreaterThan(2);
  });
});

describe("buildDiscardSelectionOptions helper (cCp27)", () => {
  it("emits one option per single hand card and one option per pair, in hand order", () => {
    const state = createState("selection-three");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    const scorch = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "scorch");
    replaceHandWith(state, "seat_a", [fiend, geralt, scorch]);
    givePlayingTurn(state, "seat_a");

    const options = buildDiscardSelectionOptions({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(options.map((option) => option.cardIds)).toEqual([
      [fiend],
      [geralt],
      [scorch],
      [fiend, geralt],
      [fiend, scorch],
      [geralt, scorch],
    ]);
    expect(options[0].label).toBe("Discard Fiend");
    expect(options[3].label).toBe("Discard Fiend + Geralt of Rivia");
  });

  it("emits exactly one option for a hand of one card", () => {
    const state = createState("selection-one");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    replaceHandWith(state, "seat_a", [fiend]);
    givePlayingTurn(state, "seat_a");

    const options = buildDiscardSelectionOptions({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(options).toHaveLength(1);
    expect(options[0].cardIds).toEqual([fiend]);
  });

  it("emits no options for an empty hand", () => {
    const state = createState("selection-empty");
    setLeader(state, "seat_a", DESTROYER);
    state.seats.seat_a.hand = [];
    givePlayingTurn(state, "seat_a");

    const options = buildDiscardSelectionOptions({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(options).toEqual([]);
  });

  it("skips hand entries with a missing instance or missing catalog source", () => {
    const state = createState("selection-stale");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    state.seats.seat_a.hand = [fiend, "seat_a:test:missing:none"];
    const ghostId = "seat_a:test:ghost:fake.source";
    state.cardsById[ghostId] = {
      instanceId: ghostId,
      sourceId: "fake.source",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "hand", seat: "seat_a" },
    };
    state.seats.seat_a.hand.push(ghostId);
    givePlayingTurn(state, "seat_a");

    const options = buildDiscardSelectionOptions({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(options).toHaveLength(1);
    expect(options[0].cardIds).toEqual([fiend]);
  });
});

describe("buildDeckDrawOptions helper (cCp27)", () => {
  it("emits one option per deck card in deck order", () => {
    const state = createState("deck-options-order");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    const fog = addCardInstance(state, "seat_a", FOG, "fog");
    replaceDeckWith(state, "seat_a", [fiend, geralt, fog]);
    givePlayingTurn(state, "seat_a");

    const options = buildDeckDrawOptions({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(options.map((option) => option.cardId)).toEqual([fiend, geralt, fog]);
    expect(options[0].label).toBe("Draw Fiend from deck");
    expect(options[1].sourceId).toBe(GERALT);
  });

  it("emits no options for an empty deck", () => {
    const state = createState("deck-options-empty");
    setLeader(state, "seat_a", DESTROYER);
    state.seats.seat_a.deck = [];
    givePlayingTurn(state, "seat_a");

    const options = buildDeckDrawOptions({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(options).toEqual([]);
  });

  it("skips deck entries with a missing instance or catalog source", () => {
    const state = createState("deck-options-stale");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    replaceDeckWith(state, "seat_a", [fiend]);
    state.seats.seat_a.deck.push("seat_a:test:missing:none");
    const ghostId = "seat_a:test:ghost:fake.source";
    state.cardsById[ghostId] = {
      instanceId: ghostId,
      sourceId: "fake.source",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "deck", seat: "seat_a" },
    };
    state.seats.seat_a.deck.push(ghostId);
    givePlayingTurn(state, "seat_a");

    const options = buildDeckDrawOptions({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(options).toHaveLength(1);
    expect(options[0].cardId).toBe(fiend);
  });
});

describe("getLeaderMove integration for discard_two_draw_one_from_deck (cCp27)", () => {
  it("emits no use_leader move for an empty hand", () => {
    const state = createState("legal-empty-hand");
    setLeader(state, "seat_a", DESTROYER);
    state.seats.seat_a.hand = [];
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits no use_leader move for an empty deck", () => {
    const state = createState("legal-empty-deck");
    setLeader(state, "seat_a", DESTROYER);
    state.seats.seat_a.deck = [];
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits exactly one no-target use_leader move with one hand and one deck card", () => {
    const state = createState("legal-one-each");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    replaceHandWith(state, "seat_a", [fiend]);
    state.seats.seat_a.deck = state.seats.seat_a.deck.slice(0, 1);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move.metadata.ability).toBe("discard_two_draw_one_from_deck");
    expect(move.metadata.abilityStatus).toBe("implemented");
    expect(move.metadata.targetRequirement).toBe("future_prompt");
    expect(move.target).toEqual({ kind: "none" });
    expect(move.metadata.targetLabel).toBe("hand then deck");
    expect(move.metadata.discardMin).toBe(1);
    expect(move.metadata.discardMax).toBe(2);
    expect(move.metadata.handCount).toBe(1);
    expect(move.metadata.deckCount).toBe(1);
    // targetCount is the diagnostic hand+deck total per the spec.
    expect(move.metadata.targetCount).toBe(2);
  });

  it("emits exactly one use_leader move regardless of hand/deck size", () => {
    const state = createState("legal-many");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.handCount).toBeGreaterThan(2);
    expect(moves[0].metadata.deckCount).toBeGreaterThan(2);
  });

  it("emits no use_leader move after the leader has been used", () => {
    const state = createState("legal-post-use");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(1);
    state.seats.seat_a.leaderUsed = true;
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("does not emit a use_leader move for the non-acting seat", () => {
    const state = createState("legal-other-seat");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_b")).toEqual([]);
  });

  it("emits no use_leader move while a prompt is pending", () => {
    const state = createState("legal-prompt-blocked");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");
    state.pendingPrompt = {
      promptId: "fake",
      seatId: "seat_b",
      kind: "choose_card",
      abilityId: "draw_opponent_discard",
      options: [],
    };
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits no use_leader move when the seat has passed", () => {
    const state = createState("legal-passed");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");
    state.seats.seat_a.passed = true;

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });
});

describe("Stage 1 prompt opening for discard_two_draw_one_from_deck (cCp27)", () => {
  it("opens a choose_card_set prompt belonging to the acting seat with stage 'discard_selection'", () => {
    const state = createState("stage1-open");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const prompt = result.state.pendingPrompt;
    expect(prompt).not.toBeNull();
    expect(prompt?.kind).toBe("choose_card_set");
    expect(prompt?.abilityId).toBe("discard_two_draw_one_from_deck");
    expect(prompt?.seatId).toBe("seat_a");
    expect(prompt?.stage).toBe("discard_selection");
    expect(prompt?.context?.minDiscardCount).toBe(1);
    expect(prompt?.context?.maxDiscardCount).toBe(2);
    expect(prompt?.sourceId).toBe(DESTROYER);
    expect(prompt?.sourceCardId).toBe(state.seats.seat_a.leader);
    // Hand-size N hand has N + N*(N-1)/2 options (1-card and 2-card combos).
    const handLength = state.seats.seat_a.hand.length;
    const expectedOptionCount = handLength + (handLength * (handLength - 1)) / 2;
    expect(prompt?.options.length).toBe(expectedOptionCount);
  });

  it("emits ability_triggered, prompt_opened, no card_moved, no leader_used, leaderUsed remains false, currentTurn unchanged", () => {
    const state = createState("stage1-events");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const triggered = result.events.filter(
      (event) => event.type === "ability_triggered" && event.abilityId === "discard_two_draw_one_from_deck",
    );
    expect(triggered).toHaveLength(1);
    expect(result.events.some((event) => event.type === "prompt_opened")).toBe(true);
    expect(result.events.some((event) => event.type === "card_moved")).toBe(false);
    expect(result.events.some((event) => event.type === "leader_used")).toBe(false);
    expect(result.state.seats.seat_a.leaderUsed).toBe(false);
    expect(result.state.currentTurn).toBe("seat_a");
  });

  it("rejects a non-none UseLeader target without consuming the leader", () => {
    const state = createState("stage1-bad-target");
    setLeader(state, "seat_a", DESTROYER);
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

  it("rejects a manual UseLeader when the hand is empty", () => {
    const state = createState("stage1-empty-hand");
    setLeader(state, "seat_a", DESTROYER);
    state.seats.seat_a.hand = [];
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

  it("rejects a manual UseLeader when the deck is empty", () => {
    const state = createState("stage1-empty-deck");
    setLeader(state, "seat_a", DESTROYER);
    state.seats.seat_a.deck = [];
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

describe("Stage 1 resolution for discard_two_draw_one_from_deck (cCp27)", () => {
  it("moves a single selected hand card to acting discard with reason leader_discard_for_draw", () => {
    const state = createState("stage1-one-resolve");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    replaceHandWith(state, "seat_a", [fiend, geralt]);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: `discard-draw:discard:${fiend}`,
    });

    expect(stage1.state.seats.seat_a.discard).toContain(fiend);
    expect(stage1.state.seats.seat_a.hand).not.toContain(fiend);
    expect(stage1.state.seats.seat_a.hand).toContain(geralt);
    expect(
      stage1.events.some(
        (event) =>
          event.type === "card_moved" &&
          event.cardId === fiend &&
          event.reason === "leader_discard_for_draw" &&
          event.from.kind === "hand" &&
          event.to.kind === "discard",
      ),
    ).toBe(true);
  });

  it("moves both selected cards in a 2-card discard option", () => {
    const state = createState("stage1-two-resolve");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    const scorch = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "scorch");
    replaceHandWith(state, "seat_a", [fiend, geralt, scorch]);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: `discard-draw:discard:${fiend}+${geralt}`,
    });

    expect(stage1.state.seats.seat_a.discard).toEqual(expect.arrayContaining([fiend, geralt]));
    expect(stage1.state.seats.seat_a.hand).not.toContain(fiend);
    expect(stage1.state.seats.seat_a.hand).not.toContain(geralt);
    expect(stage1.state.seats.seat_a.hand).toContain(scorch);
  });

  it("preserves owner and resets controller to acting seat for off-owner discarded cards", () => {
    const state = createState("stage1-off-owner");
    setLeader(state, "seat_a", DESTROYER);
    // Create an instance with owner=seat_b sitting in seat_a's hand.
    const offOwnerId = `seat_a:test:off-owner:${FIEND}`;
    state.cardsById[offOwnerId] = {
      instanceId: offOwnerId,
      sourceId: FIEND,
      sourceKind: "card",
      owner: "seat_b",
      controller: "seat_a",
      zone: { kind: "hand", seat: "seat_a" },
    };
    state.seats.seat_a.hand.push(offOwnerId);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: `discard-draw:discard:${offOwnerId}`,
    });

    expect(stage1.state.seats.seat_a.discard).toContain(offOwnerId);
    expect(stage1.state.cardsById[offOwnerId].owner).toBe("seat_b");
    expect(stage1.state.cardsById[offOwnerId].controller).toBe("seat_a");
  });

  it("does not trigger battlefield discard effects (Summon/Avenger/Medic/Scorch)", () => {
    const state = createState("stage1-no-triggers");
    setLeader(state, "seat_a", DESTROYER);
    const yenny = addCardInstance(state, "seat_a", "neutral.yennefer-of-vengerberg", "yenny");
    const scorch = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "scorch");
    replaceHandWith(state, "seat_a", [yenny, scorch]);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: `discard-draw:discard:${yenny}+${scorch}`,
    });

    expect(
      stage1.events.some(
        (event) => event.type === "ability_triggered" && event.abilityId === "medic",
      ),
    ).toBe(false);
    expect(
      stage1.events.some(
        (event) => event.type === "ability_triggered" && event.abilityId === "scorch",
      ),
    ).toBe(false);
    expect(
      stage1.events.some(
        (event) => event.type === "ability_triggered" && event.abilityId === "summon",
      ),
    ).toBe(false);
    expect(stage1.state.pendingPrompt).not.toBeNull();
    expect(stage1.state.pendingPrompt?.stage).toBe("deck_draw_selection");
  });

  it("emits prompt_resolved for stage 1 and opens the deck-draw prompt without consuming the leader or handing off", () => {
    const state = createState("stage1-events");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const promptId = opened.state.pendingPrompt!.promptId;
    const optionId = opened.state.pendingPrompt!.options[0].optionId;
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId,
      optionId,
    });

    expect(
      stage1.events.some(
        (event) => event.type === "prompt_resolved" && event.promptId === promptId,
      ),
    ).toBe(true);
    expect(stage1.events.some((event) => event.type === "prompt_opened")).toBe(true);
    expect(stage1.events.some((event) => event.type === "leader_used")).toBe(false);
    expect(stage1.state.seats.seat_a.leaderUsed).toBe(false);
    expect(stage1.state.currentTurn).toBe("seat_a");
    expect(stage1.state.pendingPrompt).not.toBeNull();
    expect(stage1.state.pendingPrompt?.kind).toBe("choose_card");
    expect(stage1.state.pendingPrompt?.abilityId).toBe("discard_two_draw_one_from_deck");
    expect(stage1.state.pendingPrompt?.stage).toBe("deck_draw_selection");
    expect(stage1.state.pendingPrompt?.context?.discardedCardIds?.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Stage 2 resolution for discard_two_draw_one_from_deck (cCp27)", () => {
  it("moves the chosen deck card to acting hand, sets controller, preserves owner, shuffles remaining deck, and consumes the leader", () => {
    const state = createState("stage2-success");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const stage1Prompt = opened.state.pendingPrompt!;
    const handCardId = state.seats.seat_a.hand[0];
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: stage1Prompt.promptId,
      optionId: `discard-draw:discard:${handCardId}`,
    });
    const stage2Prompt = stage1.state.pendingPrompt!;
    const drawTargetCardId = state.seats.seat_a.deck[0];
    const ownerBefore = stage1.state.cardsById[drawTargetCardId].owner;
    const rngStateBefore = stage1.state.rng.state;

    const stage2 = execute(stage1.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: stage2Prompt.promptId,
      optionId: `discard-draw:draw:${drawTargetCardId}`,
    });

    expect(stage2.state.seats.seat_a.hand).toContain(drawTargetCardId);
    expect(stage2.state.seats.seat_a.deck).not.toContain(drawTargetCardId);
    expect(stage2.state.cardsById[drawTargetCardId].controller).toBe("seat_a");
    expect(stage2.state.cardsById[drawTargetCardId].owner).toBe(ownerBefore);
    expect(stage2.state.pendingPrompt).toBeNull();
    expect(stage2.state.seats.seat_a.leaderUsed).toBe(true);
    // Remaining deck has length >= 2 here (default preset deck minus 1), so the
    // RNG must have advanced from the shuffle.
    expect(stage2.state.rng.state).not.toBe(rngStateBefore);
    expect(stage2.state.currentTurn).toBe("seat_b");

    expect(
      stage2.events.some(
        (event) =>
          event.type === "card_moved" &&
          event.cardId === drawTargetCardId &&
          event.reason === "leader_draw_from_deck" &&
          event.from.kind === "deck" &&
          event.to.kind === "hand",
      ),
    ).toBe(true);
    expect(
      stage2.events.some(
        (event) =>
          event.type === "deck_shuffled" &&
          event.seatId === "seat_a" &&
          event.reason === "leader_discard_draw",
      ),
    ).toBe(true);
    expect(
      stage2.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "discard_two_draw_one_from_deck" &&
          event.outcome === "discarded_and_drew_card",
      ),
    ).toBe(true);
    expect(
      stage2.events.some(
        (event) =>
          event.type === "leader_used" &&
          event.seatId === "seat_a" &&
          event.abilityId === "discard_two_draw_one_from_deck",
      ),
    ).toBe(true);
    expect(
      stage2.events.some((event) => event.type === "turn_set" && event.reason === "turn_handoff"),
    ).toBe(true);
  });

  it("emits deck_shuffled but does not advance RNG when the remaining deck has 0 or 1 cards", () => {
    const state = createState("stage2-shrunk-deck");
    setLeader(state, "seat_a", DESTROYER);
    const handCardA = addCardInstance(state, "seat_a", FIEND, "hand-a");
    const handCardB = addCardInstance(state, "seat_a", GERALT, "hand-b");
    const deckCard = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "deck-card");
    replaceHandWith(state, "seat_a", [handCardA, handCardB]);
    replaceDeckWith(state, "seat_a", [deckCard]);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: `discard-draw:discard:${handCardA}`,
    });
    const rngStateBefore = stage1.state.rng.state;

    const stage2 = execute(stage1.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: stage1.state.pendingPrompt!.promptId,
      optionId: `discard-draw:draw:${deckCard}`,
    });

    expect(stage2.state.seats.seat_a.deck).toEqual([]);
    expect(stage2.state.rng.state).toBe(rngStateBefore);
    expect(
      stage2.events.some(
        (event) =>
          event.type === "deck_shuffled" &&
          event.seatId === "seat_a" &&
          event.reason === "leader_discard_draw",
      ),
    ).toBe(true);
  });

  it("does not trigger the drawn card's abilities (no Medic, Scorch, or weather effect)", () => {
    const state = createState("stage2-no-triggers");
    setLeader(state, "seat_a", DESTROYER);
    const yenny = addCardInstance(state, "seat_a", "neutral.yennefer-of-vengerberg", "yenny");
    moveToHand(state, "seat_a", yenny);
    state.seats.seat_a.hand = [yenny];
    state.cardsById[yenny].zone = { kind: "hand", seat: "seat_a" };
    const yennyDeck = addCardInstance(state, "seat_a", "neutral.yennefer-of-vengerberg", "yenny-deck");
    replaceDeckWith(state, "seat_a", [yennyDeck]);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: `discard-draw:discard:${yenny}`,
    });
    const stage2 = execute(stage1.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: stage1.state.pendingPrompt!.promptId,
      optionId: `discard-draw:draw:${yennyDeck}`,
    });

    expect(stage2.state.seats.seat_a.hand).toContain(yennyDeck);
    expect(stage2.events.some((event) => event.type === "card_played")).toBe(false);
    expect(
      stage2.events.some(
        (event) => event.type === "ability_triggered" && event.abilityId === "medic",
      ),
    ).toBe(false);
  });

  it("rejects when the prompt is for a different seat", () => {
    const state = createState("stage1-wrong-seat");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const promptId = opened.state.pendingPrompt!.promptId;
    const optionId = opened.state.pendingPrompt!.options[0].optionId;
    const before = structuredClone(opened.state);

    expect(() =>
      execute(opened.state, {
        type: "ChoosePromptOption",
        seatId: "seat_b",
        promptId,
        optionId,
      }),
    ).toThrow(EngineRuleError);
    expect(opened.state).toEqual(before);
    expect(opened.state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects an invalid option ID without consuming the leader", () => {
    const state = createState("stage1-bad-option");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const promptId = opened.state.pendingPrompt!.promptId;
    const before = structuredClone(opened.state);

    expect(() =>
      execute(opened.state, {
        type: "ChoosePromptOption",
        seatId: "seat_a",
        promptId,
        optionId: "discard-draw:discard:bogus",
      }),
    ).toThrow(EngineRuleError);
    expect(opened.state).toEqual(before);
  });

  it("rejects a stage 1 selection whose card is no longer in hand without consuming the leader", () => {
    const state = createState("stage1-stale-hand");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    replaceHandWith(state, "seat_a", [fiend]);
    state.seats.seat_a.deck = state.seats.seat_a.deck.slice(0, 1);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    // External drift — the card has been removed from the hand somehow.
    const stale = structuredClone(opened.state);
    stale.seats.seat_a.hand = [];
    stale.cardsById[fiend].zone = { kind: "removed_from_game", seat: "seat_a" };
    stale.seats.seat_a.removedFromGame.push(fiend);
    const before = structuredClone(stale);

    expect(() =>
      execute(stale, {
        type: "ChoosePromptOption",
        seatId: "seat_a",
        promptId: stale.pendingPrompt!.promptId,
        optionId: `discard-draw:discard:${fiend}`,
      }),
    ).toThrow(EngineRuleError);
    expect(stale).toEqual(before);
  });

  it("rejects a stage 2 selection whose card is no longer in deck without leader consumption", () => {
    const state = createState("stage2-stale-deck");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");
    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const stage1Prompt = opened.state.pendingPrompt!;
    const handCardId = state.seats.seat_a.hand[0];
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: stage1Prompt.promptId,
      optionId: `discard-draw:discard:${handCardId}`,
    });
    const stage2PromptId = stage1.state.pendingPrompt!.promptId;
    const drawTargetCardId = stage1.state.seats.seat_a.deck[0];
    const stale = structuredClone(stage1.state);
    stale.seats.seat_a.deck = stale.seats.seat_a.deck.filter((id) => id !== drawTargetCardId);
    stale.cardsById[drawTargetCardId].zone = { kind: "removed_from_game", seat: "seat_a" };
    stale.seats.seat_a.removedFromGame.push(drawTargetCardId);
    const before = structuredClone(stale);

    expect(() =>
      execute(stale, {
        type: "ChoosePromptOption",
        seatId: "seat_a",
        promptId: stage2PromptId,
        optionId: `discard-draw:draw:${drawTargetCardId}`,
      }),
    ).toThrow(EngineRuleError);
    expect(stale).toEqual(before);
    expect(stale.seats.seat_a.leaderUsed).toBe(false);
  });
});

describe("legal prompt moves expose discard-draw stages only to the acting seat (cCp27)", () => {
  it("returns card_instance_set targets for stage 1 prompt options on the acting seat", () => {
    const state = createState("prompt-stage1-targets");
    setLeader(state, "seat_a", DESTROYER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    replaceHandWith(state, "seat_a", [fiend, geralt]);
    state.seats.seat_a.deck = state.seats.seat_a.deck.slice(0, 1);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const moves = promptMoves(opened.state, "seat_a");
    expect(moves.length).toBeGreaterThanOrEqual(3);
    moves.forEach((move) => {
      expect(move.metadata.promptKind).toBe("choose_card_set");
      expect(move.metadata.abilityId).toBe("discard_two_draw_one_from_deck");
      expect(move.target.kind).toBe("card_instance_set");
      if (move.target.kind === "card_instance_set") {
        expect(move.target.side).toBe("own");
        expect(move.target.seatId).toBe("seat_a");
        expect(move.target.cardIds.length).toBeGreaterThanOrEqual(1);
        expect(move.target.cardIds.length).toBeLessThanOrEqual(2);
      }
    });
  });

  it("returns deck_card_instance targets for stage 2 prompt options on the acting seat", () => {
    const state = createState("prompt-stage2-targets");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");
    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: opened.state.pendingPrompt!.options[0].optionId,
    });

    const moves = promptMoves(stage1.state, "seat_a");
    expect(moves.length).toBeGreaterThan(0);
    moves.forEach((move) => {
      expect(move.metadata.promptKind).toBe("choose_card");
      expect(move.metadata.abilityId).toBe("discard_two_draw_one_from_deck");
      expect(move.target.kind).toBe("deck_card_instance");
      if (move.target.kind === "deck_card_instance") {
        expect(move.target.side).toBe("own");
        expect(move.target.seatId).toBe("seat_a");
      }
    });
  });

  it("returns no prompt moves to the non-acting seat for either stage (hidden-info safety)", () => {
    const state = createState("prompt-hidden");
    setLeader(state, "seat_a", DESTROYER);
    givePlayingTurn(state, "seat_a");
    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    expect(promptMoves(opened.state, "seat_b")).toEqual([]);
    expect(legalMovesFor(opened.state, "seat_b")).toEqual([]);

    const stage1 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: opened.state.pendingPrompt!.options[0].optionId,
    });
    expect(promptMoves(stage1.state, "seat_b")).toEqual([]);
    expect(legalMovesFor(stage1.state, "seat_b")).toEqual([]);
  });
});

describe("Regression coverage (cCp27 must not break earlier leader prompts)", () => {
  it("cCp22 restore-discard prompt still emits own-side card_instance card moves", () => {
    const state = createState("regression-restore");
    setLeader(state, "seat_a", BRINGER);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    removeEverywhere(state, fiend);
    state.seats.seat_a.discard.push(fiend);
    state.cardsById[fiend].zone = { kind: "discard", seat: "seat_a" };
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const moves = promptMoves(opened.state, "seat_a");
    expect(moves.length).toBeGreaterThan(0);
    moves.forEach((move) => {
      expect(move.target.kind).toBe("card_instance");
      if (move.target.kind === "card_instance") {
        expect(move.target.side).toBe("own");
        expect(move.target.row).toBeUndefined();
      }
    });
  });

  it("cCp24 draw-opponent-discard prompt still emits opponent-side card_instance card moves", () => {
    const state = createState("regression-draw-opponent");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    removeEverywhere(state, fiend);
    state.seats.seat_b.discard.push(fiend);
    state.cardsById[fiend].zone = { kind: "discard", seat: "seat_b" };
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const moves = promptMoves(opened.state, "seat_a");
    expect(moves.length).toBeGreaterThan(0);
    moves.forEach((move) => {
      expect(move.target.kind).toBe("card_instance");
      if (move.target.kind === "card_instance") {
        expect(move.target.side).toBe("opponent");
        expect(move.target.seatId).toBe("seat_b");
      }
    });
  });

  it("Foltest Lord Commander clear_weather still has a no-target use_leader move and resolves normally", () => {
    const state = createState("regression-clear-weather");
    setLeader(state, "seat_a", FOLTEST_LORD_COMMANDER);
    givePlayingTurn(state, "seat_a");
    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.ability).toBe("clear_weather");
  });

  it("does not pull Math.random into src/game/core (deterministic shuffle path only)", async () => {
    // A static-source check for `Math.random` references inside the engine.
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const dir = path.resolve(process.cwd(), "src/game/core");
    const entries = await fs.readdir(dir);
    const tsFiles = entries.filter((name) => name.endsWith(".ts"));
    for (const name of tsFiles) {
      const text = await fs.readFile(path.join(dir, name), "utf-8");
      expect(text, name).not.toContain("Math.random");
    }
  });
});

// Pin imports so any catalog drift surfaces in this file rather than another.
void DESTROYER;
void BRINGER;
void RELENTLESS;
void FOLTEST_LORD_COMMANDER;
void FIEND;
void GERALT;
void SCORCH_SPECIAL;
void FROST;
void FOG;
