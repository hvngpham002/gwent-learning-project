import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialScoiataelStarterDeckPreset,
} from "@/data/catalog";
import {
  calculateScores,
  EngineRuleError,
  executeCommand,
  getDoubleSpiesPolicyBySeat,
  getLegalMoves,
  getRowHornPolicyBySeat,
  getWeatherPolicyBySeat,
  hasRandomMedicPolicyForSeat,
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
import type { CatalogCardSource, CatalogDeckPreset, CatalogRow } from "@/game/catalog";
import { buildSeatObservation } from "@/game/ai/seatObservation";
import { commandFromLegalMove, legalHeuristicPolicyV0 } from "@/game/ai";
import {
  buildSafeSimulationObservation,
  encodeLegalActions,
  buildSimulationExportDataset,
  validateSimulationExportDataset,
  type SimulationExportDataset,
} from "@/game/sim";

const WHITE_FLAME = "nilfgaard.emhyr-var-emreis-the-white-flame";
const KING_BRAN = "skellige.king-bran";
const DOUBLE_CLOSE = "monsters.eredin-commander-of-the-red-riders";
const DOUBLE_RANGED = "scoiatael.francesca-findabair-the-beautiful";
const DOUBLE_SIEGE = "northern-realms.foltest-the-siegemaster";
const DOUBLE_SPIES = "monsters.eredin-breacc-glas-the-treacherous";
const INVADER = "nilfgaard.emhyr-var-emreis-invader-of-the-north";
const DAISY = "scoiatael.francesca-findabair-daisy-of-the-valley";

const BRINGER_OF_DEATH = "monsters.eredin-bringer-of-death";
const RELENTLESS = "nilfgaard.emhyr-var-emreis-the-relentless";
const DESTROYER_OF_WORLDS = "monsters.eredin-destroyer-of-worlds";
const EMPEROR_OF_NILFGAARD = "nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard";
const SON_OF_MEDELL = "northern-realms.foltest-son-of-medell";

const FIEND = "monsters.fiend";
const SCORCH = "neutral.scorch";
const PRINCE_STENNIS = "northern-realms.prince-stennis";
const DUN_BANNER_MEDIC = "northern-realms.dun-banner-medic";

const createConfig = (
  seed: string | number,
  options: {
    seatADeck?: CatalogDeckPreset;
    seatBDeck?: CatalogDeckPreset;
  } = {},
): MatchConfig => {
  const seatADeck = options.seatADeck ?? currentNilfgaardDeckPreset;
  const seatBDeck = options.seatBDeck ?? currentNorthernRealmsDeckPreset;
  return {
    matchId: `cCp30-cancel-interactions-${seed}`,
    seed,
    seats: [
      {
        seatId: "seat_a",
        playerId: "player-a",
        controllerKind: "human",
        faction: seatADeck.faction,
        deckPreset: seatADeck,
      },
      {
        seatId: "seat_b",
        playerId: "player-b",
        controllerKind: "ai",
        faction: seatBDeck.faction,
        deckPreset: seatBDeck,
      },
    ],
    catalog: {
      cards: currentCatalogCards,
      leaders: currentCatalogLeaders,
    },
  };
};

const createState = (
  seed: string | number = "cancel-interactions",
  options?: Parameters<typeof createConfig>[1],
): MatchState => startMatch(createConfig(seed, options)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const setLeader = (state: MatchState, seatId: SeatId, leaderSourceId: string) => {
  state.seats[seatId].leaderSourceId = leaderSourceId;
};

const givePlayingTurn = (state: MatchState, seatId: SeatId) => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.pendingPrompt = null;
  state.seats.seat_a.mulliganComplete = true;
  state.seats.seat_b.mulliganComplete = true;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
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

const addCardInstance = (
  state: MatchState,
  ownerSeat: SeatId,
  sourceId: string,
  suffix: string,
  zone: "hand" | "deck" | "discard" = "hand",
): CardInstanceId => {
  const instanceId = `${ownerSeat}:cCp30i:${suffix}:${sourceId}`;
  const instance: CardInstance = {
    instanceId,
    sourceId,
    sourceKind: "card",
    owner: ownerSeat,
    controller: ownerSeat,
    zone: { kind: zone, seat: ownerSeat },
  };
  state.cardsById[instanceId] = instance;
  state.seats[ownerSeat][zone].push(instanceId);
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

const placeInHand = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].hand.push(cardId);
  state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
  state.cardsById[cardId].controller = seatId;
};

const placeWeather = (state: MatchState, cardId: CardInstanceId, controller: SeatId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
  state.cardsById[cardId].controller = controller;
};

const legalMovesFor = (state: MatchState, seatId: SeatId): LegalMove[] =>
  getLegalMoves({
    state,
    seatId,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const leaderMovesFor = (state: MatchState, seatId: SeatId): UseLeaderMove[] =>
  legalMovesFor(state, seatId).filter((move): move is UseLeaderMove => move.kind === "use_leader");

const promptMoves = (state: MatchState, seatId: SeatId): ChoosePromptOptionMove[] =>
  legalMovesFor(state, seatId).filter(
    (move): move is ChoosePromptOptionMove => move.kind === "choose_prompt_option",
  );

const score = (state: MatchState) =>
  calculateScores({
    state,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const cleanUnitForRow = (row: CatalogRow): CatalogCardSource => {
  const card = currentCatalogCards.find(
    (candidate) =>
      candidate.kind === "unit" &&
      candidate.tags.includes("non_hero") &&
      candidate.rows.length === 1 &&
      candidate.rows[0] === row &&
      candidate.abilities.length === 1 &&
      candidate.abilities[0] === "none" &&
      candidate.strength > 0,
  );
  if (!card) {
    throw new Error(`Missing clean ${row} unit fixture.`);
  }
  return card;
};

const cleanUnitWithStrength = (row: CatalogRow, strength: number): CatalogCardSource => {
  const card = currentCatalogCards.find(
    (candidate) =>
      candidate.kind === "unit" &&
      candidate.tags.includes("non_hero") &&
      candidate.rows.length === 1 &&
      candidate.rows[0] === row &&
      candidate.abilities.length === 1 &&
      candidate.abilities[0] === "none" &&
      candidate.strength === strength,
  );
  if (!card) {
    throw new Error(`Missing clean ${row} strength-${strength} fixture.`);
  }
  return card;
};

const useWhiteFlameProactively = (state: MatchState) => {
  setLeader(state, "seat_a", WHITE_FLAME);
  givePlayingTurn(state, "seat_a");
  expect(leaderMovesFor(state, "seat_a")).toHaveLength(1);
  return execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } });
};

const resolveCurrentRound = (state: MatchState) => {
  const passB = execute(state, { type: "Pass", seatId: "seat_b" });
  const passA = execute(passB.state, { type: "Pass", seatId: "seat_a" });
  return execute(passA.state, { type: "ResolveRoundEnd" });
};

const promptOption = (state: MatchState, optionId: string): Exclude<EngineCommand, { type: "StartMatch" }> => {
  if (!state.pendingPrompt) {
    throw new Error("Expected a pending prompt.");
  }
  return {
    type: "ChoosePromptOption",
    seatId: state.pendingPrompt.seatId,
    promptId: state.pendingPrompt.promptId,
    optionId,
  };
};

describe("cancel_leader suppresses passive outcomes for the current round (cCp30)", () => {
  it("suppresses King Bran weather scoring, clears at round transition, and then resumes policy", () => {
    const state = createState("king-bran");
    setLeader(state, "seat_b", KING_BRAN);
    const unit = addCardInstance(state, "seat_b", cleanUnitWithStrength("close", 4).sourceId, "bran-unit");
    const frost = addCardInstance(state, "seat_a", "neutral.biting-frost", "frost");
    placeOnBoard(state, "seat_b", unit, "close");
    placeWeather(state, frost, "seat_a");

    const beforeEntry = score(state).cards.find((entry) => entry.cardId === unit);
    expect(beforeEntry?.afterWeather).toBe(2);
    expect(beforeEntry?.modifiers).toContain("weather:king_bran");
    expect(getWeatherPolicyBySeat(state, currentCatalogLeaders).seat_b).toBe("king_bran");

    const suppressed = useWhiteFlameProactively(state);
    expect(suppressed.state.seats.seat_b.leaderCancelledRound).toBe(suppressed.state.round);
    expect(getWeatherPolicyBySeat(suppressed.state, currentCatalogLeaders).seat_b).toBeUndefined();
    const suppressedEntry = score(suppressed.state).cards.find((entry) => entry.cardId === unit);
    expect(suppressedEntry?.afterWeather).toBe(1);
    expect(suppressedEntry?.modifiers).not.toContain("weather:king_bran");

    const nextRound = resolveCurrentRound(suppressed.state);
    expect(nextRound.state.seats.seat_b.leaderCancelledRound).toBeNull();
    expect(getWeatherPolicyBySeat(nextRound.state, currentCatalogLeaders).seat_b).toBe("king_bran");
  });

  it.each([
    { leader: DOUBLE_CLOSE, row: "close" as const, expectedPolicy: { close: true } },
    { leader: DOUBLE_RANGED, row: "ranged" as const, expectedPolicy: { ranged: true } },
    { leader: DOUBLE_SIEGE, row: "siege" as const, expectedPolicy: { siege: true } },
  ])("suppresses $leader row-horn scoring and resumes after the round", ({ leader, row, expectedPolicy }) => {
    const state = createState(`row-horn-${row}`);
    setLeader(state, "seat_b", leader);
    const source = cleanUnitForRow(row);
    const unit = addCardInstance(state, "seat_b", source.sourceId, `${row}-unit`);
    placeOnBoard(state, "seat_b", unit, row);

    const beforeEntry = score(state).cards.find((entry) => entry.cardId === unit);
    expect(beforeEntry?.finalStrength).toBe(source.strength * 2);
    expect(beforeEntry?.modifiers).toContain("leader_horn");
    expect(getRowHornPolicyBySeat(state, currentCatalogLeaders).seat_b).toEqual(expectedPolicy);

    const suppressed = useWhiteFlameProactively(state);
    expect(getRowHornPolicyBySeat(suppressed.state, currentCatalogLeaders).seat_b).toBeUndefined();
    const suppressedEntry = score(suppressed.state).cards.find((entry) => entry.cardId === unit);
    expect(suppressedEntry?.finalStrength).toBe(source.strength);
    expect(suppressedEntry?.modifiers).not.toContain("leader_horn");

    const nextRound = resolveCurrentRound(suppressed.state);
    expect(getRowHornPolicyBySeat(nextRound.state, currentCatalogLeaders).seat_b).toEqual(expectedPolicy);
  });

  it("row-horn suppression can change round winner and gem loss", () => {
    const seatAUnit = cleanUnitWithStrength("close", 6);
    const seatBUnit = cleanUnitWithStrength("close", 4);
    const createRoundEndState = (suppressed: boolean) => {
      const state = createState(`row-horn-winner-${suppressed}`);
      setLeader(state, "seat_b", DOUBLE_CLOSE);
      placeOnBoard(state, "seat_a", addCardInstance(state, "seat_a", seatAUnit.sourceId, "a"), "close");
      placeOnBoard(state, "seat_b", addCardInstance(state, "seat_b", seatBUnit.sourceId, "b"), "close");
      state.phase = "round_end";
      state.seats.seat_a.passed = true;
      state.seats.seat_b.passed = true;
      if (suppressed) {
        state.seats.seat_b.leaderCancelledRound = state.round;
      }
      return state;
    };

    const unsuppressed = execute(createRoundEndState(false), { type: "ResolveRoundEnd" });
    const suppressed = execute(createRoundEndState(true), { type: "ResolveRoundEnd" });

    expect(unsuppressed.events.find((event) => event.type === "round_resolved")).toMatchObject({
      winner: "seat_b",
      loserGemLoss: { seat_a: 1 },
    });
    expect(suppressed.events.find((event) => event.type === "round_resolved")).toMatchObject({
      winner: "seat_a",
      loserGemLoss: { seat_b: 1 },
    });
  });

  it("suppresses Double Spies scoring before tight-bond, morale, or horn modifiers", () => {
    const state = createState("double-spies");
    setLeader(state, "seat_b", DOUBLE_SPIES);
    const spy = addCardInstance(state, "seat_a", PRINCE_STENNIS, "spy");
    placeOnBoard(state, "seat_a", spy, "close", "seat_a");

    const beforeEntry = score(state).cards.find((entry) => entry.cardId === spy);
    expect(getDoubleSpiesPolicyBySeat(state, currentCatalogLeaders).seat_b).toBe(true);
    expect(beforeEntry?.spyMultiplier).toBe(2);
    expect(beforeEntry?.afterSpyMultiplier).toBe((beforeEntry?.afterWeather ?? 0) * 2);
    expect(beforeEntry?.modifiers).toContain("leader_double_spies");

    const suppressed = useWhiteFlameProactively(state);
    expect(getDoubleSpiesPolicyBySeat(suppressed.state, currentCatalogLeaders).seat_b).toBeUndefined();
    const suppressedEntry = score(suppressed.state).cards.find((entry) => entry.cardId === spy);
    expect(suppressedEntry?.spyMultiplier).toBe(1);
    expect(suppressedEntry?.modifiers).not.toContain("leader_double_spies");

    const nextRound = resolveCurrentRound(suppressed.state);
    expect(getDoubleSpiesPolicyBySeat(nextRound.state, currentCatalogLeaders).seat_b).toBe(true);
  });

  it("suppresses random_medic into the normal prompt path and resumes policy after the round", () => {
    const state = createState("random-medic");
    setLeader(state, "seat_b", INVADER);
    const medic = addCardInstance(state, "seat_b", DUN_BANNER_MEDIC, "medic");
    addCardInstance(state, "seat_b", FIEND, "revive-target", "discard");
    placeInHand(state, "seat_b", medic);

    const unsuppressed = structuredClone(state);
    givePlayingTurn(unsuppressed, "seat_b");
    const random = execute(unsuppressed, {
      type: "PlayCard",
      seatId: "seat_b",
      cardId: medic,
      target: { kind: "board_row", side: "own", seatId: "seat_b", row: "siege" },
    });
    expect(random.state.pendingPrompt).toBeNull();
    expect(
      random.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "medic" &&
          event.outcome === "random_revived_card",
      ),
    ).toBe(true);

    const suppressed = useWhiteFlameProactively(state);
    expect(hasRandomMedicPolicyForSeat({ state: suppressed.state, seatId: "seat_b", catalogLeaders: currentCatalogLeaders })).toBe(false);
    const prompted = execute(suppressed.state, {
      type: "PlayCard",
      seatId: "seat_b",
      cardId: medic,
      target: { kind: "board_row", side: "own", seatId: "seat_b", row: "siege" },
    });
    expect(prompted.state.pendingPrompt?.kind).toBe("medic_revive");
    expect(prompted.state.pendingPrompt?.seatId).toBe("seat_b");

    prompted.state.pendingPrompt = null;
    const nextRound = resolveCurrentRound(prompted.state);
    expect(hasRandomMedicPolicyForSeat({ state: nextRound.state, seatId: "seat_b", catalogLeaders: currentCatalogLeaders })).toBe(true);
  });

  it("does not retroactively undo setup-time draw_extra_card", () => {
    const daisyDeck: CatalogDeckPreset = {
      ...officialScoiataelStarterDeckPreset,
      presetId: "cCp30-daisy",
      leaderSourceId: DAISY,
    };
    const daisyState = createState("daisy-setup", {
      seatBDeck: daisyDeck,
    });
    expect(daisyState.seats.seat_b.leaderSourceId).toBe(DAISY);
    expect(daisyState.seats.seat_b.hand).toHaveLength(11);
    daisyState.seats.seat_b.leaderCancelledRound = daisyState.round;
    expect(daisyState.seats.seat_b.hand).toHaveLength(11);
    expect(daisyState.seats.seat_b.leaderUsed).toBe(false);
  });
});

describe("cancel_leader prompt coexistence and hidden-info boundaries (cCp30)", () => {
  const promptLeaderSetups = [
    {
      name: "restore own discard",
      leader: BRINGER_OF_DEATH,
      target: { kind: "none" as const },
      setup: (state: MatchState) => {
        addCardInstance(state, "seat_b", FIEND, "restore", "discard");
      },
      expectedPromptAbility: "restore_discard_to_hand",
      expectedStage: undefined,
    },
    {
      name: "draw opponent discard",
      leader: RELENTLESS,
      target: { kind: "none" as const },
      setup: (state: MatchState) => {
        addCardInstance(state, "seat_a", FIEND, "opponent-discard", "discard");
      },
      expectedPromptAbility: "draw_opponent_discard",
      expectedStage: undefined,
    },
    {
      name: "discard then draw",
      leader: DESTROYER_OF_WORLDS,
      target: { kind: "none" as const },
      setup: (state: MatchState) => {
        addCardInstance(state, "seat_b", FIEND, "discard-draw-hand", "hand");
        addCardInstance(state, "seat_b", FIEND, "discard-draw-deck", "deck");
      },
      expectedPromptAbility: "discard_two_draw_one_from_deck",
      expectedStage: "discard_selection",
    },
    {
      name: "look three cards",
      leader: EMPEROR_OF_NILFGAARD,
      target: { kind: "none" as const },
      setup: (state: MatchState) => {
        addCardInstance(state, "seat_a", FIEND, "look-hand", "hand");
      },
      expectedPromptAbility: "look_three_cards",
      expectedStage: "opponent_hand_reveal",
    },
  ] as const;

  it.each(promptLeaderSetups)("opens White Flame reaction before $name leader prompt/effect", (fixture) => {
    const state = createState(`reaction-before-${fixture.name}`);
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", fixture.leader);
    fixture.setup(state);
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: fixture.target });

    expect(opened.events.map((event) => event.type)).toEqual(["prompt_opened"]);
    expect(opened.state.pendingPrompt?.abilityId).toBe("cancel_leader");
    expect(opened.state.pendingPrompt?.stage).toBe("leader_cancel_reaction");
    expect(opened.state.pendingPrompt?.seatId).toBe("seat_a");
    expect(promptMoves(opened.state, "seat_b")).toHaveLength(0);
  });

  it.each(promptLeaderSetups)("cancel path prevents the attempted $name leader prompt/effect", (fixture) => {
    const state = createState(`reaction-cancel-${fixture.name}`);
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", fixture.leader);
    fixture.setup(state);
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: fixture.target });
    const cancelled = execute(opened.state, promptOption(opened.state, "cancel-leader:cancel"));

    expect(cancelled.state.pendingPrompt).toBeNull();
    expect(cancelled.state.seats.seat_a.leaderUsed).toBe(true);
    expect(cancelled.state.seats.seat_b.leaderUsed).toBe(true);
    expect(cancelled.events.some((event) => event.type === "prompt_opened")).toBe(false);
    expect(cancelled.events.some((event) => event.type === "opponent_hand_revealed")).toBe(false);
    expect(
      cancelled.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === fixture.expectedPromptAbility,
      ),
    ).toBe(false);
  });

  it.each(promptLeaderSetups)("decline path resolves attempted $name path exactly once", (fixture) => {
    const state = createState(`reaction-decline-${fixture.name}`);
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", fixture.leader);
    fixture.setup(state);
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: fixture.target });
    const declined = execute(opened.state, promptOption(opened.state, "cancel-leader:decline"));

    expect(declined.state.pendingPrompt?.abilityId).toBe(fixture.expectedPromptAbility);
    expect(declined.state.pendingPrompt?.stage).toBe(fixture.expectedStage);
    expect(declined.state.pendingPrompt?.seatId).toBe("seat_b");
    expect(declined.state.pendingPrompt?.abilityId).not.toBe("cancel_leader");
    expect(
      declined.events.filter(
        (event) =>
          event.type === "prompt_opened" &&
          event.prompt.abilityId === fixture.expectedPromptAbility,
      ),
    ).toHaveLength(1);
    expect(
      declined.events.filter((event) => event.type === "opponent_hand_revealed"),
    ).toHaveLength(fixture.expectedPromptAbility === "look_three_cards" ? 1 : 0);
  });

  it("look-three reveal remains prompt-local and visible only to the declined leader owner", () => {
    const state = createState("look-three-hidden-info");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", EMPEROR_OF_NILFGAARD);
    addCardInstance(state, "seat_a", FIEND, "look-hand-a", "hand");
    addCardInstance(state, "seat_a", "neutral.decoy", "look-hand-b", "hand");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const declined = execute(opened.state, promptOption(opened.state, "cancel-leader:decline"));
    const actingObservation = buildSeatObservation({
      state: declined.state,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const opponentObservation = buildSeatObservation({
      state: declined.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const actingExport = buildSafeSimulationObservation(declined.state, "seat_b");
    const opponentExport = buildSafeSimulationObservation(declined.state, "seat_a");

    expect(actingObservation.pendingPrompt?.revealedCards?.length).toBeGreaterThan(0);
    expect(opponentObservation.pendingPrompt).toBeNull();
    expect(actingExport.pendingPrompt?.revealedCards?.[0].cardRef).toMatch(/^revealed_opponent_hand_/);
    expect(opponentExport.pendingPrompt).toBeNull();
    expect(JSON.stringify(opponentObservation)).not.toContain("revealedCards");
    expect(JSON.stringify(opponentExport)).not.toContain("revealed_opponent_hand");

    const acknowledged = execute(declined.state, promptOption(declined.state, "look-three-cards:acknowledge"));
    expect(acknowledged.state.pendingPrompt).toBeNull();
    expect(JSON.stringify(acknowledged.state)).not.toContain("revealedCardIds");
  });

  it("discard-draw deck prompt uses prompt-local safe refs and encoded actions hide raw deck ids", () => {
    const state = createState("discard-draw-export");
    setLeader(state, "seat_b", DESTROYER_OF_WORLDS);
    addCardInstance(state, "seat_b", FIEND, "extra-hand", "hand");
    addCardInstance(state, "seat_b", FIEND, "extra-deck", "deck");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const firstDiscard = promptMoves(opened.state, "seat_b")[0];
    const stage2 = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_b",
      promptId: firstDiscard.promptId,
      optionId: firstDiscard.optionId,
    });
    const actingExport = buildSafeSimulationObservation(stage2.state, "seat_b");
    const opponentExport = buildSafeSimulationObservation(stage2.state, "seat_a");
    const actions = encodeLegalActions(stage2.state, "seat_b", legalMovesFor(stage2.state, "seat_b"));
    const actionJson = JSON.stringify(actions);

    expect(actingExport.pendingPrompt?.abilityId).toBe("discard_two_draw_one_from_deck");
    expect(actingExport.pendingPrompt?.options.some((option) => option.target?.kind === "card")).toBe(true);
    expect(actingExport.pendingPrompt?.options[0].target?.kind === "card" ? actingExport.pendingPrompt.options[0].target.card.cardRef : "").toMatch(/^own_deck_option_/);
    expect(opponentExport.pendingPrompt).toBeNull();
    expect(actionJson).not.toMatch(/seat_[ab]:/);
    expect(actionJson).not.toContain("extra-deck");
  });
});

describe("score-dependent Scorch and export smoke under suppression (cCp30)", () => {
  it("Special Scorch targets the suppressed row-horn score state", () => {
    const state = createState("special-scorch-suppressed");
    setLeader(state, "seat_b", DOUBLE_CLOSE);
    state.seats.seat_b.leaderCancelledRound = state.round;
    const ownEight = addCardInstance(state, "seat_a", cleanUnitWithStrength("close", 8).sourceId, "own-eight");
    const opponentSix = addCardInstance(state, "seat_b", cleanUnitWithStrength("close", 6).sourceId, "opponent-six");
    const scorch = addCardInstance(state, "seat_a", SCORCH, "scorch");
    placeOnBoard(state, "seat_a", ownEight, "close");
    placeOnBoard(state, "seat_b", opponentSix, "close");
    placeInHand(state, "seat_a", scorch);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "PlayCard",
      seatId: "seat_a",
      cardId: scorch,
      target: { kind: "none" },
    });
    const scorchEvent = result.events.find((event) => event.type === "scorch_resolved");

    expect(scorchEvent).toMatchObject({ targetCardIds: [ownEight], outcome: "destroyed" });
    expect(result.state.seats.seat_b.board.close.units).toContain(opponentSix);
  });

  it("leader row-Scorch legal moves recompute against suppressed row-horn totals", () => {
    const state = createState("leader-row-scorch-suppressed");
    setLeader(state, "seat_a", SON_OF_MEDELL);
    setLeader(state, "seat_b", DOUBLE_RANGED);
    const rangedSix = addCardInstance(state, "seat_b", cleanUnitWithStrength("ranged", 6).sourceId, "ranged-six");
    placeOnBoard(state, "seat_b", rangedSix, "ranged");
    givePlayingTurn(state, "seat_a");

    expect(leaderMovesFor(state, "seat_a")).toHaveLength(1);
    state.seats.seat_b.leaderCancelledRound = state.round;
    expect(leaderMovesFor(state, "seat_a")).toHaveLength(0);
    expect(() =>
      execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } }),
    ).toThrow(EngineRuleError);
  });

  it("AI-owned White Flame prompt cancels through legal-heuristic-v0 and reaches a stable transaction", () => {
    const state = createState("ai-white-flame");
    setLeader(state, "seat_a", WHITE_FLAME);
    state.seats.seat_a.controllerKind = "ai";
    setLeader(state, "seat_b", RELENTLESS);
    addCardInstance(state, "seat_a", FIEND, "ai-discard", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const observation = buildSeatObservation({
      state: opened.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const legalMoves = legalMovesFor(opened.state, "seat_a");
    const selected = legalHeuristicPolicyV0.selectMove({ seatId: "seat_a", observation, legalMoves });
    const command = selected ? commandFromLegalMove(selected) : null;

    expect(command).toEqual({
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt?.promptId,
      optionId: "cancel-leader:cancel",
    });
    const resolved = execute(opened.state, command!);
    expect(resolved.state.pendingPrompt).toBeNull();
    expect(resolved.state.seats.seat_b.leaderUsed).toBe(true);
    expect(resolved.state.seats.seat_b.discard).toHaveLength(0);
  });

  it("validates a safe simulation row built from a suppressed leader state", () => {
    const state = createState("suppressed-export-validation");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    const suppressed = useWhiteFlameProactively(state).state;
    const moves = legalMovesFor(suppressed, "seat_b");
    const actions = encodeLegalActions(suppressed, "seat_b", moves);
    expect(actions.length).toBeGreaterThan(0);

    const base = buildSimulationExportDataset({ batchInput: { seeds: ["sim-smoke-001"], maxSteps: 1 } });
    const row = {
      ...base.rows[0],
      rowId: "cCp30-suppressed-row-0",
      matchId: suppressed.matchId,
      seed: suppressed.rng.seed,
      step: 0,
      commandIndex: 0,
      actorKind: "policy" as const,
      seatId: "seat_b" as const,
      policyId: "legal-heuristic-v0",
      observation: buildSafeSimulationObservation(suppressed, "seat_b"),
      legalActions: actions,
      legalActionCount: actions.length,
      legalActionMask: actions.map(() => true),
      chosenActionIndex: 0,
      chosenAction: actions[0],
      reward: {
        schemaVersion: "reward-v1" as const,
        terminalMatchReward: null,
        isTerminalMatchRow: false,
        notes: [],
      },
      outcome: {
        status: "running",
        winner: null,
        finalGems: {
          seat_a: suppressed.seats.seat_a.gems,
          seat_b: suppressed.seats.seat_b.gems,
        },
      },
    };
    const dataset: SimulationExportDataset = {
      ...base,
      rowCount: 1,
      matchCount: 1,
      rows: [row],
      summary: {
        ...base.summary,
        rowCount: 1,
        matchCount: 1,
        policyRowCount: 1,
        systemRowCount: 0,
      },
    };

    const result = validateSimulationExportDataset(dataset, { requireNoWarnings: true });
    expect(result.valid).toBe(true);
    expect(result.summary.errorCount).toBe(0);
    expect(JSON.stringify(dataset)).not.toMatch(/seat_[ab]:/);
    expect(dataset.rows[0].observation.opponent.leader.cancelledThisRound).toBe(false);
    expect(dataset.rows[0].observation.own.leader.cancelledThisRound).toBe(true);
  });
});
