import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialMonstersStarterDeckPreset,
} from "@/data/catalog";
import {
  EngineRuleError,
  executeCommand,
  getLegalMoves,
  startMatch,
  type CardInstanceId,
  type EngineCommand,
  type MatchConfig,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogDeckPreset, CatalogRow } from "@/game/catalog";

const createConfig = (seed: string | number, deckPreset: CatalogDeckPreset = currentNorthernRealmsDeckPreset): MatchConfig => ({
  matchId: `abilities-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: deckPreset.faction,
      deckPreset,
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

const createState = (seed = "abilities", deckPreset?: CatalogDeckPreset) => startMatch(createConfig(seed, deckPreset)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const findCards = (state: MatchState, sourceId: string) =>
  Object.values(state.cardsById)
    .filter((candidate) => candidate.sourceId === sourceId)
    .map((candidate) => candidate.instanceId);

const findCard = (state: MatchState, sourceId: string, exclude: readonly CardInstanceId[] = []) => {
  const cardId = findCards(state, sourceId).find((candidate) => !exclude.includes(candidate));
  if (!cardId) {
    throw new Error(`Missing test card source ${sourceId}`);
  }
  return cardId;
};

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

const putInHand = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  cardIds.forEach((cardId) => {
    removeEverywhere(state, cardId);
    state.seats[seatId].hand.push(cardId);
    state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const putInDeck = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  state.seats[seatId].deck = [];
  cardIds.forEach((cardId) => {
    removeEverywhere(state, cardId);
    state.seats[seatId].deck.push(cardId);
    state.cardsById[cardId].zone = { kind: "deck", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const putInDiscard = (state: MatchState, seatId: SeatId, cardIds: CardInstanceId[]) => {
  cardIds.forEach((cardId) => {
    removeEverywhere(state, cardId);
    state.seats[seatId].discard.push(cardId);
    state.cardsById[cardId].zone = { kind: "discard", seat: seatId };
    state.cardsById[cardId].controller = seatId;
  });
};

const preparePlayingTurn = (state: MatchState, seatId: SeatId = "seat_a") => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.pendingPrompt = null;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
};

const playCard = (state: MatchState, seatId: SeatId, cardId: CardInstanceId, row: CatalogRow = "siege") =>
  execute(state, {
    type: "PlayCard",
    seatId,
    cardId,
    target: { kind: "board_row", side: seatId === "seat_a" ? "own" : "own", seatId, row },
  });

const assertNoDuplicateZones = (state: MatchState) => {
  const seen = new Map<CardInstanceId, string[]>();
  const note = (cardId: CardInstanceId, zone: string) => seen.set(cardId, [...(seen.get(cardId) ?? []), zone]);

  Object.values(state.seats).forEach((seat) => {
    seat.deck.forEach((id) => note(id, `${seat.seatId}.deck`));
    seat.hand.forEach((id) => note(id, `${seat.seatId}.hand`));
    seat.discard.forEach((id) => note(id, `${seat.seatId}.discard`));
    seat.sideDeck.forEach((id) => note(id, `${seat.seatId}.sideDeck`));
    seat.removedFromGame.forEach((id) => note(id, `${seat.seatId}.removed`));
    Object.values(seat.board).forEach((row) => {
      row.units.forEach((id) => note(id, `${seat.seatId}.board`));
      if (row.horn) note(row.horn, `${seat.seatId}.horn`);
    });
    if (seat.leader) note(seat.leader, `${seat.seatId}.leader`);
  });
  state.weather.entries.forEach((id) => note(id, "weather"));
  [...seen.values()].forEach((zones) => expect(zones).toHaveLength(1));
};

describe("core ability resolver", () => {
  it("resolves Spy draws for full, one-card, and empty decks while keeping acting controller", () => {
    const cases = [
      { seed: "spy-two", deckCount: 2, expected: 2 },
      { seed: "spy-one", deckCount: 1, expected: 1 },
      { seed: "spy-zero", deckCount: 0, expected: 0 },
    ];

    cases.forEach(({ seed, deckCount, expected }) => {
      const state = createState(seed);
      const spy = findCard(state, "northern-realms.thaler");
      const drawCards = state.seats.seat_a.deck.filter((id) => id !== spy).slice(0, deckCount);
      preparePlayingTurn(state);
      putInHand(state, "seat_a", [spy]);
      putInDeck(state, "seat_a", drawCards);

      const result = execute(state, {
        type: "PlayCard",
        seatId: "seat_a",
        cardId: spy,
        target: { kind: "board_row", side: "opponent", seatId: "seat_b", row: "siege" },
      });

      expect(result.state.cardsById[spy].controller).toBe("seat_a");
      expect(result.state.seats.seat_b.board.siege.units).toContain(spy);
      expect(result.events.filter((event) => event.type === "card_drawn")).toHaveLength(expected);
      expect(drawCards.every((cardId) => result.state.seats.seat_a.hand.includes(cardId))).toBe(true);
      expect(result.state.currentTurn).toBe("seat_b");
      assertNoDuplicateZones(result.state);
    });
  });

  it("resolves Medic with no legal target and hands off the turn", () => {
    const state = createState("medic-none");
    const medic = findCard(state, "northern-realms.dun-banner-medic");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [medic]);

    const result = playCard(state, "seat_a", medic);

    expect(result.state.pendingPrompt).toBeNull();
    expect(result.state.currentTurn).toBe("seat_b");
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: "ability_resolved", abilityId: "medic", outcome: "no_targets" }),
    );
  });

  it("opens a Medic prompt, suppresses ordinary legal moves, and exposes only prompt options to the acting seat", () => {
    const state = createState("medic-prompt");
    const medic = findCard(state, "northern-realms.dun-banner-medic");
    const target = findCard(state, "northern-realms.catapult");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [medic]);
    putInDiscard(state, "seat_a", [target]);

    const result = playCard(state, "seat_a", medic);
    const prompt = result.state.pendingPrompt;

    expect(prompt?.kind).toBe("medic_revive");
    expect(result.state.currentTurn).toBe("seat_a");
    expect(result.events.some((event) => event.type === "prompt_opened")).toBe(true);

    const ownMoves = getLegalMoves({
      state: result.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const opponentMoves = getLegalMoves({
      state: result.state,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });

    expect(ownMoves.map((move) => move.kind)).toEqual(["choose_prompt_option"]);
    expect(opponentMoves).toEqual([]);
    expect(() => execute(result.state, { type: "Pass", seatId: "seat_a" })).toThrow(EngineRuleError);
  });

  it("validates ChoosePromptOption and resolves selected Medic revives", () => {
    const state = createState("medic-choice");
    const medic = findCard(state, "northern-realms.dun-banner-medic");
    const target = findCard(state, "northern-realms.catapult");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [medic]);
    putInDiscard(state, "seat_a", [target]);

    const prompted = playCard(state, "seat_a", medic).state;
    const prompt = prompted.pendingPrompt;
    expect(prompt).not.toBeNull();

    expect(() =>
      execute(prompted, { type: "ChoosePromptOption", seatId: "seat_b", promptId: prompt!.promptId, optionId: prompt!.options[0].optionId }),
    ).toThrow(EngineRuleError);
    expect(() =>
      execute(prompted, { type: "ChoosePromptOption", seatId: "seat_a", promptId: prompt!.promptId, optionId: "missing" }),
    ).toThrow(EngineRuleError);

    const result = execute(prompted, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt!.promptId,
      optionId: prompt!.options[0].optionId,
    });

    expect(result.state.pendingPrompt).toBeNull();
    expect(result.state.seats.seat_a.discard).not.toContain(target);
    expect(result.state.seats.seat_a.board.siege.units).toContain(target);
    expect(result.state.cardsById[target].controller).toBe("seat_a");
    expect(result.state.currentTurn).toBe("seat_b");
    assertNoDuplicateZones(result.state);
  });

  it("revives Spy with Medic onto the opponent board and resolves Spy draw", () => {
    const state = createState("medic-spy");
    const medic = findCard(state, "northern-realms.dun-banner-medic");
    const spy = findCard(state, "northern-realms.thaler");
    const drawCards = state.seats.seat_a.deck.filter((cardId) => cardId !== medic && cardId !== spy).slice(0, 2);
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [medic]);
    putInDiscard(state, "seat_a", [spy]);
    putInDeck(state, "seat_a", drawCards);

    const prompted = playCard(state, "seat_a", medic).state;
    const reviveSpyOption = prompted.pendingPrompt!.options.find((option) => option.target.cardId === spy)!;

    const result = execute(prompted, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompted.pendingPrompt!.promptId,
      optionId: reviveSpyOption.optionId,
    });

    expect(result.state.pendingPrompt).toBeNull();
    expect(result.state.seats.seat_a.discard).not.toContain(spy);
    expect(result.state.seats.seat_a.board.siege.units).not.toContain(spy);
    expect(result.state.seats.seat_b.board.siege.units).toContain(spy);
    expect(result.state.cardsById[spy].controller).toBe("seat_a");
    expect(result.events.filter((event) => event.type === "card_drawn")).toHaveLength(2);
    expect(drawCards.every((cardId) => result.state.seats.seat_a.hand.includes(cardId))).toBe(true);
    expect(result.state.currentTurn).toBe("seat_b");
    assertNoDuplicateZones(result.state);
  });

  it("rejects prompt choices without a pending prompt", () => {
    const state = createState("prompt-missing");
    preparePlayingTurn(state);

    expect(() =>
      execute(state, { type: "ChoosePromptOption", seatId: "seat_a", promptId: "missing", optionId: "missing" }),
    ).toThrow(EngineRuleError);
  });

  it("filters Medic targets to own non-Hero units only", () => {
    const state = createState("medic-filter");
    const medic = findCard(state, "northern-realms.dun-banner-medic");
    const unit = findCard(state, "northern-realms.catapult");
    const hero = findCard(state, "neutral.geralt-of-rivia");
    const special = findCard(state, "neutral.scorch");
    const opponentUnit = findCard(state, "nilfgaard.black-infantry-archer");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [medic]);
    putInDiscard(state, "seat_a", [unit, hero, special]);
    putInDiscard(state, "seat_b", [opponentUnit]);

    const result = playCard(state, "seat_a", medic);
    const optionCardIds = result.state.pendingPrompt?.options.map((option) => option.target.cardId);

    expect(optionCardIds).toEqual([unit]);
  });

  it("continues Medic chains only when the revived card is another Medic", () => {
    const state = createState("medic-chain");
    const [firstMedic, secondMedic] = findCards(state, "northern-realms.dun-banner-medic");
    const regular = findCard(state, "northern-realms.catapult");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [firstMedic]);
    putInDiscard(state, "seat_a", [secondMedic, regular]);

    const firstPrompt = playCard(state, "seat_a", firstMedic).state;
    const reviveMedicOption = firstPrompt.pendingPrompt!.options.find((option) => option.target.cardId === secondMedic)!;
    const secondPrompt = execute(firstPrompt, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: firstPrompt.pendingPrompt!.promptId,
      optionId: reviveMedicOption.optionId,
    }).state;

    expect(secondPrompt.pendingPrompt?.options.map((option) => option.target.cardId)).toEqual([regular]);

    const final = execute(secondPrompt, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: secondPrompt.pendingPrompt!.promptId,
      optionId: secondPrompt.pendingPrompt!.options[0].optionId,
    });

    expect(final.state.pendingPrompt).toBeNull();
    expect(final.state.currentTurn).toBe("seat_b");
  });

  it("resolves Muster from hand and deck, skips discard and board copies, and shuffles deck-sourced pulls", () => {
    const state = createState("muster");
    const gaunter = findCard(state, "neutral.gaunter-odimm");
    const [darknessHand, darknessDeck] = findCards(state, "neutral.gaunter-odimm-darkness");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [gaunter, darknessHand]);
    putInDeck(state, "seat_a", [darknessDeck]);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: gaunter,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
    });

    expect(result.state.seats.seat_a.board.ranged.units).toEqual(expect.arrayContaining([darknessHand, darknessDeck]));
    expect(result.state.seats.seat_a.deck).not.toContain(darknessDeck);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "deck_shuffled", seatId: "seat_a", reason: "muster" }));
    assertNoDuplicateZones(result.state);
  });

  it("resolves Gaunter O'Dimm Darkness Muster to other Darkness copies only", () => {
    const state = createState("muster-darkness-reverse");
    const gaunter = findCard(state, "neutral.gaunter-odimm");
    const [darknessPlayed, darknessDeck] = findCards(state, "neutral.gaunter-odimm-darkness");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [darknessPlayed]);
    putInDeck(state, "seat_a", [gaunter, darknessDeck]);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: darknessPlayed,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
    });

    expect(result.state.seats.seat_a.board.ranged.units).toEqual(expect.arrayContaining([darknessPlayed, darknessDeck]));
    expect(result.state.seats.seat_a.board.siege.units).not.toContain(gaunter);
    expect(result.state.seats.seat_a.deck).toContain(gaunter);
    expect(result.state.seats.seat_a.deck).not.toContain(darknessDeck);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "ability_resolved", abilityId: "muster", outcome: "played_linked" }));
    expect(result.events).toContainEqual(expect.objectContaining({ type: "deck_shuffled", seatId: "seat_a", reason: "muster" }));
    assertNoDuplicateZones(result.state);
  });

  it("resolves linked Monster starter Muster groups from hand and deck", () => {
    const state = createState("monster-starter-muster", officialMonstersStarterDeckPreset);
    const [arachasPlayed, arachasDeckA, arachasDeckB] = findCards(state, "monsters.arachas");
    const brewess = findCard(state, "monsters.crone-brewess");
    const weavess = findCard(state, "monsters.crone-weavess");
    const whispess = findCard(state, "monsters.crone-whispess");

    preparePlayingTurn(state);
    putInHand(state, "seat_a", [arachasPlayed, brewess]);
    putInDeck(state, "seat_a", [arachasDeckA, arachasDeckB, weavess, whispess]);

    const arachasResult = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: arachasPlayed,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(arachasResult.state.seats.seat_a.board.close.units).toEqual(
      expect.arrayContaining([arachasPlayed, arachasDeckA, arachasDeckB]),
    );
    expect(arachasResult.events).toContainEqual(
      expect.objectContaining({ type: "ability_resolved", abilityId: "muster", outcome: "played_linked" }),
    );
    expect(arachasResult.events).toContainEqual(
      expect.objectContaining({ type: "deck_shuffled", seatId: "seat_a", reason: "muster" }),
    );

    preparePlayingTurn(arachasResult.state);
    const croneResult = execute(arachasResult.state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: brewess,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(croneResult.state.seats.seat_a.board.close.units).toEqual(
      expect.arrayContaining([brewess, weavess, whispess]),
    );
    expect(croneResult.events).toContainEqual(
      expect.objectContaining({ type: "ability_resolved", abilityId: "muster", outcome: "played_linked" }),
    );
    assertNoDuplicateZones(croneResult.state);
  });

  it("resolves Muster Roach for linked Hero catalog entries", () => {
    const roachDeck = {
      ...currentNorthernRealmsDeckPreset,
      mainDeck: [...currentNorthernRealmsDeckPreset.mainDeck, { sourceId: "neutral.roach", count: 1 }],
    } satisfies CatalogDeckPreset;
    const state = createState("muster-roach", roachDeck);
    const geralt = findCard(state, "neutral.geralt-of-rivia");
    const roach = findCard(state, "neutral.roach");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [geralt]);
    putInDeck(state, "seat_a", [roach]);

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: geralt,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(result.state.seats.seat_a.board.close.units).toContain(roach);
    expect(result.state.seats.seat_a.deck).not.toContain(roach);
    expect(result.events).toContainEqual(expect.objectContaining({ type: "ability_resolved", abilityId: "muster_roach" }));
  });

  it("classifies ongoing modifiers as board-state resolved and keeps Unit Scorch deferred for scoring", () => {
    const state = createState("modifier-deferrals");
    const olgierd = findCard(state, "neutral.olgierd-von-everec");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [olgierd]);

    const morale = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: olgierd,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(morale.events.some((event) => event.type === "ability_deferred")).toBe(false);
    expect(morale.events).toContainEqual(
      expect.objectContaining({ type: "ability_resolved", abilityId: "morale_boost", outcome: "represented_by_board_state" }),
    );
    expect(morale.events).toContainEqual(
      expect.objectContaining({ type: "ability_resolved", abilityId: "agile", outcome: "represented_by_board_state" }),
    );

    const scorchState = createState("scorch-close");
    const scorchUnit = findCard(scorchState, "neutral.villentretenmerth");
    preparePlayingTurn(scorchState);
    putInHand(scorchState, "seat_a", [scorchUnit]);

    const scorch = execute(scorchState, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: scorchUnit,
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    });

    expect(scorch.events).toContainEqual(
      expect.objectContaining({ type: "scorch_resolved", abilityId: "scorch_close", outcome: "below_threshold" }),
    );
    expect(scorch.events).not.toContainEqual(
      expect.objectContaining({ type: "ability_deferred", abilityId: "scorch_close" }),
    );
  });

  it("does not mutate input state when resolver flows open prompts", () => {
    const state = createState("immutability");
    const before = structuredClone(state);
    const medic = findCard(state, "northern-realms.dun-banner-medic");
    const target = findCard(state, "northern-realms.catapult");
    preparePlayingTurn(state);
    putInHand(state, "seat_a", [medic]);
    putInDiscard(state, "seat_a", [target]);
    const prepared = structuredClone(state);

    playCard(state, "seat_a", medic);

    expect(state).toEqual(prepared);
    expect(before.pendingPrompt).toBeNull();
  });
});
