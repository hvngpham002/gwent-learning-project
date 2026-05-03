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
  getDiscardRecyclePlan,
  getLegalMoves,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type EngineCommand,
  type LegalMove,
  type MatchConfig,
  type MatchState,
  type SeatId,
  type UseLeaderMove,
} from "@/game/core";
import { CATALOG_LEADER_ABILITY_METADATA } from "@/game/catalog";
import { officialLeaderPromotionManifest } from "@/data/catalog/leaders/official-promotion";

const CRACH = "skellige.crach-an-craite";

// Production fixtures.
const FIEND = "monsters.fiend"; // unit, close, "none"
const GERALT = "neutral.geralt-of-rivia"; // hero, close, muster_roach
const SCORCH_SPECIAL = "neutral.scorch"; // special, scorch
const FROST = "neutral.biting-frost"; // weather (special)

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp23-shuffle-discards-${seed}`,
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

const createState = (seed = "shuffle-discards"): MatchState => startMatch(createConfig(seed)).state;

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

describe("shuffle_discards_into_decks metadata and manifest (cCp23)", () => {
  it("promotes shuffle_discards_into_decks to implemented", () => {
    expect(CATALOG_LEADER_ABILITY_METADATA.shuffle_discards_into_decks.status).toBe("implemented");
    expect(CATALOG_LEADER_ABILITY_METADATA.shuffle_discards_into_decks.description.length).toBeGreaterThan(0);
  });

  it("includes Crach an Craite in executableLeaderSourceIds and not in placeholder/passive sets", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toContain(CRACH);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toContain(CRACH);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).not.toContain(CRACH);
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain(
      "shuffle_discards_into_decks",
    );
  });
});

describe("getDiscardRecyclePlan helper (cCp23)", () => {
  it("returns an empty plan when both discard piles are empty", () => {
    const state = createState("plan-empty");
    setLeader(state, "seat_a", CRACH);
    givePlayingTurn(state, "seat_a");

    const plan = getDiscardRecyclePlan({ state });
    expect(plan.totalCardCount).toBe(0);
    expect(plan.seats).toEqual([]);
  });

  it("returns only non-empty discard seats in stable seat order (seat_a then seat_b)", () => {
    const state = createState("plan-order");
    setLeader(state, "seat_a", CRACH);
    const aFiend = addCardInstance(state, "seat_a", FIEND, "a-fiend");
    const aGeralt = addCardInstance(state, "seat_a", GERALT, "a-geralt");
    const bScorch = addCardInstance(state, "seat_b", SCORCH_SPECIAL, "b-scorch");
    placeInDiscard(state, "seat_a", aFiend);
    placeInDiscard(state, "seat_a", aGeralt);
    placeInDiscard(state, "seat_b", bScorch);
    givePlayingTurn(state, "seat_a");

    const plan = getDiscardRecyclePlan({ state });
    expect(plan.seats.map((entry) => entry.seatId)).toEqual(["seat_a", "seat_b"]);
    expect(plan.seats[0].cardIds).toEqual([aFiend, aGeralt]);
    expect(plan.seats[1].cardIds).toEqual([bScorch]);
    expect(plan.totalCardCount).toBe(3);
  });

  it("only includes the seat with a non-empty discard when the other is empty", () => {
    const state = createState("plan-only-b");
    setLeader(state, "seat_a", CRACH);
    const bFrost = addCardInstance(state, "seat_b", FROST, "b-frost");
    placeInDiscard(state, "seat_b", bFrost);
    givePlayingTurn(state, "seat_a");

    const plan = getDiscardRecyclePlan({ state });
    expect(plan.seats.map((entry) => entry.seatId)).toEqual(["seat_b"]);
    expect(plan.seats[0].cardIds).toEqual([bFrost]);
    expect(plan.totalCardCount).toBe(1);
  });

  it("skips discard entries whose card instance is missing", () => {
    const state = createState("plan-stale");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    state.seats.seat_a.discard.push("seat_a:test:missing-instance:none");
    givePlayingTurn(state, "seat_a");

    const plan = getDiscardRecyclePlan({ state });
    expect(plan.seats[0]?.cardIds).toEqual([fiend]);
    expect(plan.totalCardCount).toBe(1);
  });

  it("does not mutate input state when called twice", () => {
    const state = createState("plan-determinism");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");
    const before = structuredClone(state);

    getDiscardRecyclePlan({ state });
    getDiscardRecyclePlan({ state });

    expect(state).toEqual(before);
  });
});

describe("getLeaderMove integration for shuffle_discards_into_decks (cCp23)", () => {
  it("emits no use_leader move when both discard piles are empty", () => {
    const state = createState("legal-empty");
    setLeader(state, "seat_a", CRACH);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits exactly one use_leader move when only the acting seat's discard is non-empty", () => {
    const state = createState("legal-acting-only");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.ability).toBe("shuffle_discards_into_decks");
    expect(moves[0].metadata.targetCount).toBe(1);
  });

  it("emits exactly one use_leader move when only the opponent's discard is non-empty", () => {
    const state = createState("legal-opp-only");
    setLeader(state, "seat_a", CRACH);
    const oppFiend = addCardInstance(state, "seat_b", FIEND, "opp-fiend");
    placeInDiscard(state, "seat_b", oppFiend);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.targetCount).toBe(1);
  });

  it("emits exactly one use_leader move when both discards are non-empty", () => {
    const state = createState("legal-both");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const oppGeralt = addCardInstance(state, "seat_b", GERALT, "opp-geralt");
    placeInDiscard(state, "seat_a", fiend);
    placeInDiscard(state, "seat_b", oppGeralt);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.targetCount).toBe(2);
  });

  it("attaches the correct metadata shape (target, targetRequirement, targetCount, targetLabel)", () => {
    const state = createState("legal-metadata");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    const oppFrost = addCardInstance(state, "seat_b", FROST, "opp-frost");
    placeInDiscard(state, "seat_a", fiend);
    placeInDiscard(state, "seat_a", geralt);
    placeInDiscard(state, "seat_b", oppFrost);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move.target).toEqual({ kind: "none" });
    expect(move.metadata.targetRequirement).toBe("none");
    expect(move.metadata.targetCount).toBe(3);
    expect(move.metadata.targetLabel).toBe("discard piles");
    expect(move.metadata.abilityStatus).toBe("implemented");
  });

  it("emits no use_leader move after the leader has been used", () => {
    const state = createState("legal-post-use");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(1);
    state.seats.seat_a.leaderUsed = true;
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });
});

describe("UseLeader command for shuffle_discards_into_decks (cCp23)", () => {
  it("rejects a non-none target without consuming the leader", () => {
    const state = createState("use-leader-bad-target");
    setLeader(state, "seat_a", CRACH);
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

  it("rejects a manual UseLeader when both discards are empty (without setting leaderUsed or mutating state)", () => {
    const state = createState("use-leader-empty");
    setLeader(state, "seat_a", CRACH);
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

  it("empties non-empty discard piles and moves cards into their respective decks, sets controller to destination seat, leaves owner unchanged, sets leaderUsed, and hands off the turn", () => {
    const state = createState("use-leader-success");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    const geralt = addCardInstance(state, "seat_a", GERALT, "geralt");
    const oppFrost = addCardInstance(state, "seat_b", FROST, "opp-frost");
    placeInDiscard(state, "seat_a", fiend);
    placeInDiscard(state, "seat_a", geralt);
    placeInDiscard(state, "seat_b", oppFrost);
    const ownerOfFiendBefore = state.cardsById[fiend].owner;
    const ownerOfFrostBefore = state.cardsById[oppFrost].owner;
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    // Both discard piles emptied.
    expect(result.state.seats.seat_a.discard).toEqual([]);
    expect(result.state.seats.seat_b.discard).toEqual([]);

    // Cards now in their respective decks.
    expect(result.state.seats.seat_a.deck).toContain(fiend);
    expect(result.state.seats.seat_a.deck).toContain(geralt);
    expect(result.state.seats.seat_b.deck).toContain(oppFrost);

    // Card zones reset to the destination deck seat.
    expect(result.state.cardsById[fiend].zone).toEqual({ kind: "deck", seat: "seat_a" });
    expect(result.state.cardsById[geralt].zone).toEqual({ kind: "deck", seat: "seat_a" });
    expect(result.state.cardsById[oppFrost].zone).toEqual({ kind: "deck", seat: "seat_b" });

    // Controllers reset to destination seat; owners unchanged.
    expect(result.state.cardsById[fiend].controller).toBe("seat_a");
    expect(result.state.cardsById[geralt].controller).toBe("seat_a");
    expect(result.state.cardsById[oppFrost].controller).toBe("seat_b");
    expect(result.state.cardsById[fiend].owner).toBe(ownerOfFiendBefore);
    expect(result.state.cardsById[oppFrost].owner).toBe(ownerOfFrostBefore);

    // Leader consumed and turn handed off.
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
    expect(result.state.currentTurn).toBe("seat_b");
  });

  it("recycles an off-owner card (e.g. a Spy-like fixture in the opposite discard) into the discard pile seat's deck, with owner preserved and controller reset to the destination seat", () => {
    const state = createState("use-leader-off-owner");
    setLeader(state, "seat_a", CRACH);
    // A card owned by seat_a but physically in seat_b's discard (e.g. spy that
    // was discarded from seat_b's board side after round cleanup).
    const offOwnerInstanceId = "seat_a:test:spy-physically-on-b:monsters.fiend";
    state.cardsById[offOwnerInstanceId] = {
      instanceId: offOwnerInstanceId,
      sourceId: FIEND,
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "discard", seat: "seat_b" },
    };
    state.seats.seat_b.discard.push(offOwnerInstanceId);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    // Card recycled into seat_b's deck (the discard pile seat), not seat_a's.
    expect(result.state.seats.seat_b.deck).toContain(offOwnerInstanceId);
    expect(result.state.seats.seat_a.deck).not.toContain(offOwnerInstanceId);
    expect(result.state.cardsById[offOwnerInstanceId].zone).toEqual({ kind: "deck", seat: "seat_b" });
    expect(result.state.cardsById[offOwnerInstanceId].controller).toBe("seat_b");
    expect(result.state.cardsById[offOwnerInstanceId].owner).toBe("seat_a");
  });

  it("does not touch removed-from-game, side deck, hand, board, row horns, or weather-zone cards", () => {
    const state = createState("use-leader-untouched-zones");
    setLeader(state, "seat_a", CRACH);
    // One card per untouched zone.
    const removedCard = addCardInstance(state, "seat_a", FIEND, "removed");
    const sideDeckCard = addCardInstance(state, "seat_a", FIEND, "side-deck");
    const handCard = addCardInstance(state, "seat_a", FIEND, "hand");
    const boardCard = addCardInstance(state, "seat_a", FIEND, "board");
    const hornCard = addCardInstance(state, "seat_a", FIEND, "horn");
    const weatherCard = addCardInstance(state, "seat_a", FROST, "weather");
    // Physically place each card.
    removeEverywhere(state, removedCard);
    state.seats.seat_a.removedFromGame.push(removedCard);
    state.cardsById[removedCard].zone = { kind: "removed_from_game", seat: "seat_a" };

    removeEverywhere(state, sideDeckCard);
    state.seats.seat_a.sideDeck.push(sideDeckCard);
    state.cardsById[sideDeckCard].zone = { kind: "side_deck", seat: "seat_a" };

    // hand-card already in hand.

    removeEverywhere(state, boardCard);
    state.seats.seat_a.board.close.units.push(boardCard);
    state.cardsById[boardCard].zone = { kind: "board_row", seat: "seat_a", row: "close" };

    removeEverywhere(state, hornCard);
    state.seats.seat_a.board.close.horn = hornCard;
    state.cardsById[hornCard].zone = { kind: "row_horn", seat: "seat_a", row: "close" };

    removeEverywhere(state, weatherCard);
    state.weather.entries.push(weatherCard);
    state.cardsById[weatherCard].zone = { kind: "weather" };

    // One discard-pile card so the leader has something to recycle.
    const discardCard = addCardInstance(state, "seat_a", FIEND, "discard-card");
    placeInDiscard(state, "seat_a", discardCard);

    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    // Untouched zones still have their cards.
    expect(result.state.seats.seat_a.removedFromGame).toContain(removedCard);
    expect(result.state.seats.seat_a.sideDeck).toContain(sideDeckCard);
    expect(result.state.seats.seat_a.hand).toContain(handCard);
    expect(result.state.seats.seat_a.board.close.units).toContain(boardCard);
    expect(result.state.seats.seat_a.board.close.horn).toBe(hornCard);
    expect(result.state.weather.entries).toContain(weatherCard);

    // The discard card is recycled to the seat's deck.
    expect(result.state.seats.seat_a.deck).toContain(discardCard);

    // Untouched cards keep their zone.
    expect(result.state.cardsById[removedCard].zone).toEqual({
      kind: "removed_from_game",
      seat: "seat_a",
    });
    expect(result.state.cardsById[sideDeckCard].zone).toEqual({ kind: "side_deck", seat: "seat_a" });
    expect(result.state.cardsById[handCard].zone).toEqual({ kind: "hand", seat: "seat_a" });
    expect(result.state.cardsById[boardCard].zone).toEqual({
      kind: "board_row",
      seat: "seat_a",
      row: "close",
    });
    expect(result.state.cardsById[hornCard].zone).toEqual({
      kind: "row_horn",
      seat: "seat_a",
      row: "close",
    });
    expect(result.state.cardsById[weatherCard].zone).toEqual({ kind: "weather" });
  });

  it("emits ability_triggered, one card_moved per recycled card with reason leader_shuffle_into_deck (in stable seat/discard order before shuffle), one deck_shuffled per affected seat, ability_resolved.shuffled_discards, leader_used, and a turn_handoff", () => {
    const state = createState("use-leader-events");
    setLeader(state, "seat_a", CRACH);
    const aFiend = addCardInstance(state, "seat_a", FIEND, "a-fiend");
    const aGeralt = addCardInstance(state, "seat_a", GERALT, "a-geralt");
    const bScorch = addCardInstance(state, "seat_b", SCORCH_SPECIAL, "b-scorch");
    placeInDiscard(state, "seat_a", aFiend);
    placeInDiscard(state, "seat_a", aGeralt);
    placeInDiscard(state, "seat_b", bScorch);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(
      result.events.some(
        (event) =>
          event.type === "ability_triggered" && event.abilityId === "shuffle_discards_into_decks",
      ),
    ).toBe(true);

    const cardMovedEvents = result.events.filter(
      (event): event is Extract<typeof event, { type: "card_moved" }> =>
        event.type === "card_moved" && event.reason === "leader_shuffle_into_deck",
    );
    expect(cardMovedEvents.map((event) => event.cardId)).toEqual([aFiend, aGeralt, bScorch]);
    cardMovedEvents.forEach((event) => {
      expect(event.from?.kind).toBe("discard");
      expect(event.to.kind).toBe("deck");
    });

    const deckShuffledEvents = result.events.filter(
      (event): event is Extract<typeof event, { type: "deck_shuffled" }> =>
        event.type === "deck_shuffled" && event.reason === "leader_shuffle_into_deck",
    );
    expect(deckShuffledEvents.map((event) => event.seatId)).toEqual(["seat_a", "seat_b"]);

    expect(
      result.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "shuffle_discards_into_decks" &&
          event.outcome === "shuffled_discards",
      ),
    ).toBe(true);
    expect(
      result.events.some(
        (event) =>
          event.type === "leader_used" &&
          event.seatId === "seat_a" &&
          event.abilityId === "shuffle_discards_into_decks",
      ),
    ).toBe(true);
    expect(
      result.events.some((event) => event.type === "turn_set" && event.reason === "turn_handoff"),
    ).toBe(true);

    // No card_played event.
    expect(result.events.some((event) => event.type === "card_played")).toBe(false);
  });

  it("emits deck_shuffled only for affected seats; an empty-discard seat is not shuffled and emits no event", () => {
    const state = createState("use-leader-affected-only");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const before = structuredClone(state);

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const deckShuffledEvents = result.events.filter(
      (event) => event.type === "deck_shuffled" && event.reason === "leader_shuffle_into_deck",
    );
    expect(deckShuffledEvents).toHaveLength(1);
    expect((deckShuffledEvents[0] as { seatId: SeatId }).seatId).toBe("seat_a");

    // seat_b's deck order is unchanged because seat_b had an empty discard.
    expect(result.state.seats.seat_b.deck).toEqual(before.seats.seat_b.deck);
  });

  it("does not resolve restored Medic / Scorch / weather card abilities (no card_played, no Medic prompt, no Scorch destruction, no weather zone entry)", () => {
    const state = createState("use-leader-no-trigger");
    setLeader(state, "seat_a", CRACH);
    // Medic (Yennefer), Scorch special, weather (Frost) all in seat_a discard.
    const yenny = addCardInstance(state, "seat_a", "neutral.yennefer-of-vengerberg", "yenny");
    const scorch = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "scorch");
    const frost = addCardInstance(state, "seat_a", FROST, "frost");
    placeInDiscard(state, "seat_a", yenny);
    placeInDiscard(state, "seat_a", scorch);
    placeInDiscard(state, "seat_a", frost);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    // No prompt was opened (no Medic chain).
    expect(result.state.pendingPrompt).toBeNull();
    // No `card_played` event for any recycled card.
    expect(result.events.some((event) => event.type === "card_played")).toBe(false);
    // No `scorch_resolved` because Scorch did not fire.
    expect(result.events.some((event) => event.type === "scorch_resolved")).toBe(false);
    // Frost did not enter the weather zone.
    expect(result.state.weather.entries).not.toContain(frost);
    // Recycled cards land in deck.
    expect(result.state.seats.seat_a.deck).toContain(yenny);
    expect(result.state.seats.seat_a.deck).toContain(scorch);
    expect(result.state.seats.seat_a.deck).toContain(frost);
  });
});

describe("RNG determinism for shuffle_discards_into_decks (cCp23)", () => {
  const buildScenario = (seed: string | number) => {
    const state = createState(seed);
    setLeader(state, "seat_a", CRACH);
    // Add a handful of cards in each discard so the shuffle has an effect.
    [
      { sid: FIEND, suffix: "f1" },
      { sid: FIEND, suffix: "f2" },
      { sid: GERALT, suffix: "g1" },
      { sid: SCORCH_SPECIAL, suffix: "s1" },
    ].forEach(({ sid, suffix }) => {
      const id = addCardInstance(state, "seat_a", sid, suffix);
      placeInDiscard(state, "seat_a", id);
    });
    [
      { sid: FROST, suffix: "fr1" },
      { sid: FIEND, suffix: "f3" },
      { sid: GERALT, suffix: "g2" },
    ].forEach(({ sid, suffix }) => {
      const id = addCardInstance(state, "seat_b", sid, suffix);
      placeInDiscard(state, "seat_b", id);
    });
    givePlayingTurn(state, "seat_a");
    return state;
  };

  it("updates state.rng.state when at least one affected deck has length greater than one", () => {
    const state = buildScenario("rng-advances");
    const beforeState = state.rng.state;

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(result.state.rng.state).not.toBe(beforeState);
  });

  it("identical pre-command states with the same seed produce identical post-command deck orders and RNG state", () => {
    const seed = "rng-identical";
    const stateA = buildScenario(seed);
    const stateB = buildScenario(seed);
    expect(stateA).toEqual(stateB);

    const resultA = execute(stateA, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const resultB = execute(stateB, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(resultA.state.seats.seat_a.deck).toEqual(resultB.state.seats.seat_a.deck);
    expect(resultA.state.seats.seat_b.deck).toEqual(resultB.state.seats.seat_b.deck);
    expect(resultA.state.rng.state).toEqual(resultB.state.rng.state);
  });

  it("different seeds produce different post-command deck orders when the affected decks have enough cards to shuffle", () => {
    const stateA = buildScenario("rng-different-1");
    const stateB = buildScenario("rng-different-2");

    const resultA = execute(stateA, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const resultB = execute(stateB, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    // Decks are large enough (initial deck plus 4 / 3 recycled cards) that
    // distinct seeds are overwhelmingly likely to produce distinct shuffles.
    expect(resultA.state.seats.seat_a.deck).not.toEqual(resultB.state.seats.seat_a.deck);
  });

  it("only shuffles affected decks; an empty-discard seat's deck order is unchanged after the command", () => {
    const state = createState("rng-only-acting");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const seatBDeckBefore = [...state.seats.seat_b.deck];

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    expect(result.state.seats.seat_b.deck).toEqual(seatBDeckBefore);
  });
});

describe("Post-use legal-move state (cCp23)", () => {
  it("after the leader is used, getLegalMoves emits no Crach leader move", () => {
    const state = createState("post-use-no-move");
    setLeader(state, "seat_a", CRACH);
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    // After turn handoff, seat_a is no longer current. Force seat_a to current
    // again to verify no use_leader move is offered to a leader-used seat.
    result.state.currentTurn = "seat_a";
    expect(useLeaderMoves(result.state, "seat_a")).toEqual([]);
  });
});
