import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialMonstersStarterDeckPreset,
  officialSkelligeStarterDeckPreset,
} from "@/data/catalog";
import {
  CATALOG_ABILITY_METADATA,
  type CatalogCardSource,
  type CatalogDeckPreset,
  type CatalogRow,
} from "@/game/catalog";
import {
  EngineRuleError,
  executeCommand,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type EngineCommand,
  type GameEvent,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import { resolveSummonForCard } from "@/game/core/abilities";

// cCp17: generic `summon` discard-trigger resolver. Summon only fires when a
// board-row source is discarded. The replacement comes from the controlling
// seat's side deck via `linkedSourceIds[0]` and lands on the source's previous
// board side and row. Decoy returns to hand and does NOT trigger Summon.
//
// The current permanent catalog has no live `summon` source (Cow/Kambi are
// Avenger). These tests append small test-only catalog fixtures so the engine
// has a real Summon contract to exercise. Fixtures are local to this file.

const SUMMON_TEST_BASE_SOURCE: CatalogCardSource = {
  sourceId: "test.cCp17.summon-base",
  name: "cCp17 Summon Base",
  faction: "neutral",
  kind: "unit",
  strength: 4,
  rows: ["close"],
  abilities: ["summon"],
  tags: ["non_hero"],
  deckLimit: 3,
  image: "/images/neutral/cow.png",
  linkedSourceIds: ["test.cCp17.summon-replacement"],
};

const SUMMON_TEST_REPLACEMENT_SOURCE: CatalogCardSource = {
  sourceId: "test.cCp17.summon-replacement",
  name: "cCp17 Summon Replacement",
  faction: "neutral",
  kind: "unit",
  strength: 12,
  rows: ["close"],
  abilities: ["none"],
  tags: ["non_hero", "side_deck_only"],
  deckLimit: 1,
  image: "/images/neutral/bovine_defense_force.png",
};

const SUMMON_TEST_BASE_NO_LINK: CatalogCardSource = {
  sourceId: "test.cCp17.summon-no-link",
  name: "cCp17 Summon No Link",
  faction: "neutral",
  kind: "unit",
  strength: 5,
  rows: ["close"],
  abilities: ["summon"],
  tags: ["non_hero"],
  deckLimit: 1,
  image: "/images/neutral/cow.png",
};

const testCatalogCards: readonly CatalogCardSource[] = [
  ...currentCatalogCards,
  SUMMON_TEST_BASE_SOURCE,
  SUMMON_TEST_REPLACEMENT_SOURCE,
  SUMMON_TEST_BASE_NO_LINK,
];

const createConfig = (
  seed: string | number,
  options: { humanDeck?: CatalogDeckPreset; opponentDeck?: CatalogDeckPreset } = {},
): MatchConfig => ({
  matchId: `cCp17-summon-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: (options.humanDeck ?? currentNorthernRealmsDeckPreset).faction,
      deckPreset: options.humanDeck ?? currentNorthernRealmsDeckPreset,
    },
    {
      seatId: "seat_b",
      playerId: "player-b",
      controllerKind: "ai",
      faction: (options.opponentDeck ?? currentNilfgaardDeckPreset).faction,
      deckPreset: options.opponentDeck ?? currentNilfgaardDeckPreset,
    },
  ],
  catalog: { cards: testCatalogCards, leaders: currentCatalogLeaders },
});

const createState = (
  seed: string | number = "cCp17-summon",
  options: { humanDeck?: CatalogDeckPreset; opponentDeck?: CatalogDeckPreset } = {},
) => startMatch(createConfig(seed, options)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: testCatalogCards,
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
  const instanceId = `${seatId}:cCp17:${suffix}:${sourceId}`;
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

const placeOnBoard = (
  state: MatchState,
  seatId: SeatId,
  cardId: CardInstanceId,
  row: CatalogRow,
  controller: SeatId = seatId,
) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
  state.cardsById[cardId].controller = controller;
};

const placeInSideDeck = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].sideDeck.push(cardId);
  state.cardsById[cardId].zone = { kind: "side_deck", seat: seatId };
  state.cardsById[cardId].controller = seatId;
};

const placeInHand = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].hand.push(cardId);
  state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
  state.cardsById[cardId].controller = seatId;
};

const placeInWeather = (state: MatchState, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
};

const preparePlayingTurn = (state: MatchState, seatId: SeatId = "seat_a") => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.pendingPrompt = null;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
};

const passUntilRoundEnd = (state: MatchState): MatchState => {
  let next = state;
  next.phase = "playing";
  next.pendingPrompt = null;
  next.seats.seat_a.passed = false;
  next.seats.seat_b.passed = false;
  next.currentTurn = "seat_a";
  next = execute(next, { type: "Pass", seatId: "seat_a" }).state;
  next = execute(next, { type: "Pass", seatId: "seat_b" }).state;
  return next;
};

const setLeader = (state: MatchState, seatId: SeatId, leaderSourceId: string) => {
  state.seats[seatId].leaderSourceId = leaderSourceId;
};

describe("Summon discard-trigger resolver — metadata and helper (cCp17)", () => {
  it("Summon ability metadata is implemented", () => {
    expect(CATALOG_ABILITY_METADATA.summon.status).toBe("implemented");
  });

  it("returns no_summon for sources without summon", () => {
    const state = createState("helper-no-summon");
    const cow = addCardInstance(state, "seat_a", "neutral.cow", "cow");
    placeOnBoard(state, "seat_a", cow, "close");
    const events: GameEvent[] = [];
    const lookup = new Map(testCatalogCards.map((card) => [card.sourceId, card]));

    const outcome = resolveSummonForCard({
      state,
      events,
      catalogLookup: lookup,
      cardId: cow,
      origin: { kind: "board_row", seat: "seat_a", row: "close" },
    });

    expect(outcome).toBe("no_summon");
    expect(
      events.some(
        (event) => event.type === "ability_resolved" && event.abilityId === "summon",
      ),
    ).toBe(false);
  });

  it("emits missing_link when the summon source has no linkedSourceIds[0]", () => {
    const state = createState("helper-missing-link");
    const noLink = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_NO_LINK.sourceId, "no-link");
    placeOnBoard(state, "seat_a", noLink, "close");
    const events: GameEvent[] = [];
    const lookup = new Map(testCatalogCards.map((card) => [card.sourceId, card]));

    const outcome = resolveSummonForCard({
      state,
      events,
      catalogLookup: lookup,
      cardId: noLink,
      origin: { kind: "board_row", seat: "seat_a", row: "close" },
    });

    expect(outcome).toBe("missing_link");
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "ability_resolved",
        abilityId: "summon",
        outcome: "missing_link",
      }),
    );
  });

  it("emits missing_replacement when no matching side-deck card exists", () => {
    const state = createState("helper-missing-replacement");
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    placeOnBoard(state, "seat_a", base, "close");
    // Intentionally do NOT add the linked replacement to the side deck.
    const events: GameEvent[] = [];
    const lookup = new Map(testCatalogCards.map((card) => [card.sourceId, card]));

    const outcome = resolveSummonForCard({
      state,
      events,
      catalogLookup: lookup,
      cardId: base,
      origin: { kind: "board_row", seat: "seat_a", row: "close" },
    });

    expect(outcome).toBe("missing_replacement");
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "ability_resolved",
        abilityId: "summon",
        outcome: "missing_replacement",
      }),
    );
  });

  it("emits missing_origin_row when the source has already left the board and no origin is supplied", () => {
    const state = createState("helper-missing-origin-row");
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeInSideDeck(state, "seat_a", replacement);
    // Move the base into discard manually with no origin.
    removeEverywhere(state, base);
    state.seats.seat_a.discard.push(base);
    state.cardsById[base].zone = { kind: "discard", seat: "seat_a" };
    const events: GameEvent[] = [];
    const lookup = new Map(testCatalogCards.map((card) => [card.sourceId, card]));

    const outcome = resolveSummonForCard({
      state,
      events,
      catalogLookup: lookup,
      cardId: base,
    });

    expect(outcome).toBe("missing_origin_row");
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "ability_resolved",
        abilityId: "summon",
        outcome: "missing_origin_row",
      }),
    );
  });

  it("successful summon emits card_moved.summon_replacement, card_summoned.summon, and ability_resolved.summoned", () => {
    const state = createState("helper-summoned");
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeOnBoard(state, "seat_a", base, "close");
    placeInSideDeck(state, "seat_a", replacement);
    removeEverywhere(state, base);
    state.seats.seat_a.discard.push(base);
    state.cardsById[base].zone = { kind: "discard", seat: "seat_a" };
    const events: GameEvent[] = [];
    const lookup = new Map(testCatalogCards.map((card) => [card.sourceId, card]));

    const outcome = resolveSummonForCard({
      state,
      events,
      catalogLookup: lookup,
      cardId: base,
      origin: { kind: "board_row", seat: "seat_a", row: "close" },
    });

    expect(outcome).toBe("summoned");
    expect(state.seats.seat_a.sideDeck).not.toContain(replacement);
    expect(state.seats.seat_a.board.close.units).toContain(replacement);
    expect(state.cardsById[replacement].controller).toBe("seat_a");
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "card_moved",
        cardId: replacement,
        reason: "summon_replacement",
      }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "card_summoned",
        triggerCardId: base,
        toCardId: replacement,
        abilityId: "summon",
        seatId: "seat_a",
        row: "close",
      }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: "ability_resolved",
        abilityId: "summon",
        outcome: "summoned",
      }),
    );
  });
});

describe("Summon on play does not move side-deck card (cCp17)", () => {
  it("playing a Summon unit emits armed_for_discard but does not summon the replacement", () => {
    const state = createState("on-play-armed");
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeInSideDeck(state, "seat_a", replacement);
    placeInHand(state, "seat_a", base);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: base,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(result.state.seats.seat_a.board.close.units).toContain(base);
    expect(result.state.seats.seat_a.sideDeck).toContain(replacement);
    expect(result.state.seats.seat_a.board.close.units).not.toContain(replacement);
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "ability_resolved",
        abilityId: "summon",
        outcome: "armed_for_discard",
      }),
    );
    // No card_moved with summon_replacement reason fired during play.
    expect(
      result.events.some(
        (event) => event.type === "card_moved" && event.reason === "summon_replacement",
      ),
    ).toBe(false);
  });
});

describe("Summon does not trigger on non-discard movement (cCp17)", () => {
  it("Decoy returning a Summon source to hand does not summon the replacement", () => {
    const state = createState("decoy-no-summon");
    const decoy = addCardInstance(state, "seat_a", "neutral.decoy", "decoy");
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeOnBoard(state, "seat_a", base, "close");
    placeInSideDeck(state, "seat_a", replacement);
    placeInHand(state, "seat_a", decoy);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: decoy,
      target: { kind: "card_instance", side: "own", seatId: "seat_a", cardId: base, row: "close" },
    });

    expect(result.state.seats.seat_a.hand).toContain(base);
    expect(result.state.seats.seat_a.sideDeck).toContain(replacement);
    expect(result.state.seats.seat_a.board.close.units).not.toContain(replacement);
    expect(
      result.events.some(
        (event) =>
          event.type === "card_summoned" &&
          (event as Extract<GameEvent, { type: "card_summoned" }>).abilityId === "summon",
      ),
    ).toBe(false);
  });

  it("Medic revival of a Summon unit does not move the linked replacement onto the board", () => {
    const state = createState("medic-revive-no-summon");
    // Use the real Northern Realms Dun Banner Medic so PlayCard is legal.
    const medicCardId = Object.values(state.cardsById).find(
      (instance) =>
        instance.sourceId === "northern-realms.dun-banner-medic" &&
        instance.controller === "seat_a",
    )?.instanceId;
    expect(medicCardId).toBeDefined();
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeInHand(state, "seat_a", medicCardId!);
    // Place the Summon base into the seat_a discard so Medic can revive it.
    removeEverywhere(state, base);
    state.seats.seat_a.discard.push(base);
    state.cardsById[base].zone = { kind: "discard", seat: "seat_a" };
    state.cardsById[base].controller = "seat_a";
    placeInSideDeck(state, "seat_a", replacement);
    preparePlayingTurn(state);

    const playMedic = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: medicCardId!,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    });
    // A Medic prompt should be open for seat_a — pick the Summon base.
    const prompt = playMedic.state.pendingPrompt;
    expect(prompt).not.toBeNull();
    const reviveOption = prompt!.options.find((option) => option.target.cardId === base);
    expect(reviveOption).toBeDefined();
    const final = execute(playMedic.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt!.promptId,
      optionId: reviveOption!.optionId,
    });

    expect(final.state.seats.seat_a.board.close.units).toContain(base);
    expect(final.state.seats.seat_a.sideDeck).toContain(replacement);
    expect(final.state.seats.seat_a.board.close.units).not.toContain(replacement);
    expect(
      final.events.some(
        (event) =>
          event.type === "card_summoned" &&
          (event as Extract<GameEvent, { type: "card_summoned" }>).abilityId === "summon",
      ),
    ).toBe(false);
  });

  it("Skellige round-3 return of a Summon unit does not summon the replacement", () => {
    // Use the Skellige starter so the round-3 return helper has a real seat.
    const state = createState("skellige-return-no-summon", {
      humanDeck: officialSkelligeStarterDeckPreset,
    });
    state.round = 2; // Set up round 3 after end of round 2.
    state.seats.seat_a.gems = 2;
    state.seats.seat_b.gems = 2;
    state.seats.seat_a.faction = "skellige";
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    removeEverywhere(state, base);
    state.seats.seat_a.discard.push(base);
    state.cardsById[base].zone = { kind: "discard", seat: "seat_a" };
    state.cardsById[base].controller = "seat_a";
    // Make discard tiny so the random round-3 return picks our base reliably.
    state.seats.seat_a.discard = state.seats.seat_a.discard.filter((id) => id === base);
    placeInSideDeck(state, "seat_a", replacement);

    // Pass into round-end and resolve.
    const passed = passUntilRoundEnd(state);
    const resolved = execute(passed, { type: "ResolveRoundEnd", seatId: "seat_a" });

    // Skellige round 3 may move base back to a board row; if so, replacement
    // must remain in the side deck because the move is a "skellige_return"
    // movement, not a discard.
    if (resolved.state.seats.seat_a.board.close.units.includes(base)) {
      expect(resolved.state.seats.seat_a.sideDeck).toContain(replacement);
      expect(resolved.state.seats.seat_a.board.close.units).not.toContain(replacement);
    }
    expect(
      resolved.events.some(
        (event) =>
          event.type === "card_summoned" &&
          (event as Extract<GameEvent, { type: "card_summoned" }>).abilityId === "summon",
      ),
    ).toBe(false);
  });

  it("Monsters keep on a Summon unit does not summon the replacement", () => {
    const monstersDeck: CatalogDeckPreset = {
      ...officialMonstersStarterDeckPreset,
      mainDeck: [...officialMonstersStarterDeckPreset.mainDeck],
    };
    const state = createState("monsters-keep-no-summon", {
      humanDeck: monstersDeck,
    });
    state.seats.seat_a.faction = "monsters";
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeOnBoard(state, "seat_a", base, "close");
    placeInSideDeck(state, "seat_a", replacement);

    const passed = passUntilRoundEnd(state);
    const resolved = execute(passed, { type: "ResolveRoundEnd", seatId: "seat_a" }).state;

    expect(resolved.seats.seat_a.board.close.units).toContain(base);
    expect(resolved.seats.seat_a.sideDeck).toContain(replacement);
    expect(resolved.seats.seat_a.board.close.units).not.toContain(replacement);
  });
});

describe("Summon trigger paths (cCp17)", () => {
  it("Special Scorch on a Summon unit summons the replacement onto the same row", () => {
    // Frost normalizes close-row strengths to 1 so the Summon base (printed 4)
    // becomes a valid Scorch target.
    const state = createState("special-scorch-summon");
    const scorch = addCardInstance(state, "seat_a", "neutral.scorch", "scorch");
    const frost = addCardInstance(state, "seat_a", "neutral.biting-frost", "frost");
    const base = addCardInstance(state, "seat_b", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_b",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeOnBoard(state, "seat_b", base, "close");
    placeInSideDeck(state, "seat_b", replacement);
    placeInWeather(state, frost);
    placeInHand(state, "seat_a", scorch);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: scorch,
      target: { kind: "none" },
    });

    expect(result.state.seats.seat_b.discard).toContain(base);
    expect(result.state.seats.seat_b.sideDeck).not.toContain(replacement);
    expect(result.state.seats.seat_b.board.close.units).toContain(replacement);
    expect(result.state.cardsById[replacement].controller).toBe("seat_b");
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "card_summoned",
        triggerCardId: base,
        toCardId: replacement,
        abilityId: "summon",
        seatId: "seat_b",
        row: "close",
      }),
    );
  });

  it("Unit row-Scorch (Toad) destroying a Summon unit summons the replacement", () => {
    const state = createState("row-scorch-summon");
    const toad = addCardInstance(state, "seat_a", "monsters.toad", "toad");
    const base = addCardInstance(state, "seat_b", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_b",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeOnBoard(state, "seat_b", base, "ranged");
    // Hero padding contributes to the row total but is not an eligible Scorch target,
    // so the Summon base is the only destroyable non-hero on the row.
    const hero = addCardInstance(state, "seat_b", "scoiatael.iorveth", "iorveth");
    placeOnBoard(state, "seat_b", hero, "ranged");
    placeInSideDeck(state, "seat_b", replacement);
    placeInHand(state, "seat_a", toad);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: toad,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    expect(result.state.seats.seat_b.discard).toContain(base);
    expect(result.state.seats.seat_b.board.ranged.units).not.toContain(base);
    expect(result.state.seats.seat_b.board.ranged.units).toContain(hero);
    expect(result.state.seats.seat_b.sideDeck).not.toContain(replacement);
    expect(result.state.seats.seat_b.board.ranged.units).toContain(replacement);
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "card_summoned",
        triggerCardId: base,
        toCardId: replacement,
        abilityId: "summon",
        seatId: "seat_b",
        row: "ranged",
      }),
    );
  });

  it("Unit-source whole-board Scorch (Clan Dimun Pirate) destroying a Summon unit summons the replacement", () => {
    const state = createState("unit-whole-board-scorch-summon");
    const dimun = addCardInstance(state, "seat_a", "skellige.clan-dimun-pirate", "dimun");
    const base = addCardInstance(state, "seat_b", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_b",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeOnBoard(state, "seat_b", base, "close");
    placeInSideDeck(state, "seat_b", replacement);
    // Fog reduces Clan Dimun Pirate on the ranged row to 1; base remains close-row
    // strength 4 and becomes the unique global highest non-hero target.
    const fog = addCardInstance(state, "seat_a", "neutral.impenetrable-fog", "fog");
    placeInWeather(state, fog);
    placeInHand(state, "seat_a", dimun);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: dimun,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    expect(result.state.seats.seat_b.discard).toContain(base);
    expect(result.state.seats.seat_b.board.close.units).not.toContain(base);
    expect(result.state.seats.seat_b.sideDeck).not.toContain(replacement);
    expect(result.state.seats.seat_b.board.close.units).toContain(replacement);
    expect(result.state.seats.seat_a.board.ranged.units).toContain(dimun);
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "card_summoned",
        triggerCardId: base,
        toCardId: replacement,
        abilityId: "summon",
        seatId: "seat_b",
        row: "close",
      }),
    );
  });

  it("Foltest row-Scorch leader destroying a Summon unit summons the replacement", () => {
    // Setup mirrors coreLeaderRowScorch.test.ts: Foltest the Steel-Forged
    // (scorch_siege) destroys all tied-highest non-hero units on opponent siege.
    // We weather-set Cow-style — the Summon base is unique highest under Rain.
    const state = createState("foltest-leader-summon");
    setLeader(state, "seat_a", "northern-realms.foltest-the-steel-forged");
    const base = addCardInstance(state, "seat_b", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    placeOnBoard(state, "seat_b", base, "siege");
    // Pad row total >= 10 with a hero that is immune to scorch.
    const hero = addCardInstance(state, "seat_b", "skellige.hemdall", "hero-pad");
    placeOnBoard(state, "seat_b", hero, "siege");
    // Active Rain so base's effective strength becomes 1 instead of 4.
    const rain = addCardInstance(state, "seat_a", "neutral.torrential-rain", "rain");
    placeInWeather(state, rain);
    state.cardsById[rain].controller = "seat_a";
    state.seats.seat_a.hand = state.seats.seat_a.hand.filter((id) => id !== rain);
    const replacement = addCardInstance(
      state,
      "seat_b",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeInSideDeck(state, "seat_b", replacement);
    preparePlayingTurn(state, "seat_a");
    state.seats.seat_a.mulliganComplete = true;
    state.seats.seat_b.mulliganComplete = true;

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(result.state.seats.seat_b.discard).toContain(base);
    expect(result.state.seats.seat_b.sideDeck).not.toContain(replacement);
    expect(result.state.seats.seat_b.board.siege.units).toContain(replacement);
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "card_summoned",
        triggerCardId: base,
        toCardId: replacement,
        abilityId: "summon",
        seatId: "seat_b",
        row: "siege",
      }),
    );
  });

  it("Round cleanup discarding a Summon unit summons the linked replacement after the sweep", () => {
    const state = createState("round-cleanup-summon");
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeOnBoard(state, "seat_a", base, "close");
    placeInSideDeck(state, "seat_a", replacement);

    const passed = passUntilRoundEnd(state);
    const resolved = execute(passed, { type: "ResolveRoundEnd", seatId: "seat_a" });

    expect(resolved.state.seats.seat_a.discard).toContain(base);
    expect(resolved.state.seats.seat_a.sideDeck).not.toContain(replacement);
    expect(resolved.state.seats.seat_a.board.close.units).toContain(replacement);
    expect(resolved.state.cardsById[replacement].controller).toBe("seat_a");
    // The summon resolves AFTER the board_swept event so the replacement
    // persists into the next round.
    const sweepIdx = resolved.events.findIndex((event) => event.type === "board_swept");
    const summonIdx = resolved.events.findIndex(
      (event) =>
        event.type === "card_summoned" &&
        (event as Extract<GameEvent, { type: "card_summoned" }>).abilityId === "summon" &&
        (event as Extract<GameEvent, { type: "card_summoned" }>).toCardId === replacement,
    );
    expect(sweepIdx).toBeGreaterThanOrEqual(0);
    expect(summonIdx).toBeGreaterThan(sweepIdx);
  });

  it("Board-side discard placement is preserved when Summon source occupies the opponent board side", () => {
    // Spy-style: a Summon source controlled by seat_a but physically placed on seat_b's board side.
    // When destroyed by Special Scorch, the source goes to seat_b's discard (board-side discard),
    // while the replacement comes from seat_a's side deck (controller side) and lands on seat_b siege.
    const state = createState("board-side-discard-summon");
    const scorch = addCardInstance(state, "seat_a", "neutral.scorch", "scorch");
    const frost = addCardInstance(state, "seat_a", "neutral.biting-frost", "frost");
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    // Place base on seat_b's close row but with controller seat_a.
    placeOnBoard(state, "seat_b", base, "close", "seat_a");
    placeInSideDeck(state, "seat_a", replacement);
    placeInWeather(state, frost);
    placeInHand(state, "seat_a", scorch);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: scorch,
      target: { kind: "none" },
    });

    // Source goes to opponent board-side discard (seat_b).
    expect(result.state.seats.seat_b.discard).toContain(base);
    expect(result.state.seats.seat_a.discard).not.toContain(base);
    // Replacement comes from controller's side deck (seat_a).
    expect(result.state.seats.seat_a.sideDeck).not.toContain(replacement);
    // Replacement lands on the occupied board side and row (seat_b close).
    expect(result.state.seats.seat_b.board.close.units).toContain(replacement);
    // Controller of the replacement matches the source's controller (seat_a).
    expect(result.state.cardsById[replacement].controller).toBe("seat_a");
  });
});

describe("Summon and Avenger interaction (cCp17)", () => {
  it("Avenger Decoy bounce still summons Avenger replacement and does not summon any Summon replacement", () => {
    const state = createState("avenger-decoy-still-works");
    const decoy = addCardInstance(state, "seat_a", "neutral.decoy", "decoy");
    const cow = addCardInstance(state, "seat_a", "neutral.cow", "cow");
    const bovine = addCardInstance(state, "seat_a", "neutral.bovine-defense-force", "bovine");
    placeOnBoard(state, "seat_a", cow, "close");
    placeInSideDeck(state, "seat_a", bovine);
    placeInHand(state, "seat_a", decoy);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: decoy,
      target: { kind: "card_instance", side: "own", seatId: "seat_a", cardId: cow, row: "close" },
    });

    expect(result.state.seats.seat_a.hand).toContain(cow);
    expect(result.state.seats.seat_a.sideDeck).not.toContain(bovine);
    expect(result.state.seats.seat_a.board.close.units).toContain(bovine);
    expect(
      result.events.some(
        (event) =>
          event.type === "card_summoned" &&
          (event as Extract<GameEvent, { type: "card_summoned" }>).abilityId === "avenger",
      ),
    ).toBe(true);
    expect(
      result.events.some(
        (event) =>
          event.type === "card_summoned" &&
          (event as Extract<GameEvent, { type: "card_summoned" }>).abilityId === "summon",
      ),
    ).toBe(false);
  });

  it("Avenger Scorch destroying Cow still summons Bovine and emits avenger_summon movement reason", () => {
    // Regression: cCp11 Avenger smoke continues to pass under cCp17.
    const state = createState("avenger-scorch-regression");
    const scorch = addCardInstance(state, "seat_a", "neutral.scorch", "scorch");
    const frost = addCardInstance(state, "seat_a", "neutral.biting-frost", "frost");
    const cow = addCardInstance(state, "seat_b", "neutral.cow", "cow");
    const bovine = addCardInstance(state, "seat_b", "neutral.bovine-defense-force", "bovine");
    placeOnBoard(state, "seat_b", cow, "close");
    placeInSideDeck(state, "seat_b", bovine);
    placeInWeather(state, frost);
    placeInHand(state, "seat_a", scorch);
    preparePlayingTurn(state);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: scorch,
      target: { kind: "none" },
    });

    expect(result.state.seats.seat_b.discard).toContain(cow);
    expect(result.state.seats.seat_b.board.close.units).toContain(bovine);
    expect(result.events).toContainEqual(
      expect.objectContaining({
        type: "card_moved",
        cardId: bovine,
        reason: "avenger_summon",
      }),
    );
  });

  it("Avenger round cleanup still summons Bovine; Summon does not double-fire", () => {
    const state = createState("avenger-round-cleanup-regression");
    const cow = addCardInstance(state, "seat_a", "neutral.cow", "cow");
    const bovine = addCardInstance(state, "seat_a", "neutral.bovine-defense-force", "bovine");
    placeOnBoard(state, "seat_a", cow, "close");
    placeInSideDeck(state, "seat_a", bovine);

    const passed = passUntilRoundEnd(state);
    const resolved = execute(passed, { type: "ResolveRoundEnd", seatId: "seat_a" }).state;

    expect(resolved.seats.seat_a.discard).toContain(cow);
    expect(resolved.seats.seat_a.sideDeck).not.toContain(bovine);
    expect(resolved.seats.seat_a.board.close.units).toContain(bovine);
  });
});

describe("Summon — wrong target rejection (cCp17)", () => {
  it("playing a Summon source onto a non-row weather target throws EngineRuleError without summoning", () => {
    const state = createState("wrong-play-target");
    const base = addCardInstance(state, "seat_a", SUMMON_TEST_BASE_SOURCE.sourceId, "base");
    const replacement = addCardInstance(
      state,
      "seat_a",
      SUMMON_TEST_REPLACEMENT_SOURCE.sourceId,
      "replacement",
    );
    placeInSideDeck(state, "seat_a", replacement);
    placeInHand(state, "seat_a", base);
    preparePlayingTurn(state);

    expect(() =>
      execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: base,
        target: { kind: "weather" },
      }),
    ).toThrow(EngineRuleError);
    expect(state.seats.seat_a.sideDeck).toContain(replacement);
  });
});
