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
  isEligibleWeatherSourceForLeader,
  startMatch,
  type CardInstanceId,
  type EngineCommand,
  type LegalMove,
  type MatchConfig,
  type MatchState,
  type SeatId,
  type UseLeaderMove,
} from "@/game/core";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `leader-weather-${seed}`,
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

const createState = (seed = "leader-weather") => startMatch(createConfig(seed)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const legalMoves = (state: MatchState, seatId: SeatId): LegalMove[] =>
  getLegalMoves({
    state,
    seatId,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const findCardBySource = (state: MatchState, sourceId: string, exclude: readonly CardInstanceId[] = []) => {
  const card = Object.values(state.cardsById).find(
    (candidate) => candidate.sourceId === sourceId && !exclude.includes(candidate.instanceId),
  );
  if (!card) {
    throw new Error(`Missing card source ${sourceId}`);
  }
  return card.instanceId;
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

const putInDeck = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].deck.push(cardId);
  state.cardsById[cardId].zone = { kind: "deck", seat: seatId };
  state.cardsById[cardId].controller = seatId;
};

const putInHand = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].hand.push(cardId);
  state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
  state.cardsById[cardId].controller = seatId;
};

const putInDiscard = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].discard.push(cardId);
  state.cardsById[cardId].zone = { kind: "discard", seat: seatId };
  state.cardsById[cardId].controller = seatId;
};

const putWeather = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.weather.entries.push(cardId);
  state.cardsById[cardId].zone = { kind: "weather" };
  state.cardsById[cardId].controller = seatId;
};

const putOnBoardClose = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board.close.units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row: "close" };
  state.cardsById[cardId].controller = seatId;
};

const purgeAllSourceFromDeck = (state: MatchState, seatId: SeatId, sourceId: string) => {
  const seat = state.seats[seatId];
  const remove: CardInstanceId[] = [];
  seat.deck.forEach((cardId) => {
    if (state.cardsById[cardId].sourceId === sourceId) {
      remove.push(cardId);
    }
  });
  remove.forEach((cardId) => removeEverywhere(state, cardId));
};

const setLeader = (state: MatchState, seatId: SeatId, leaderSourceId: string) => {
  state.seats[seatId].leaderSourceId = leaderSourceId;
};

const useLeaderMoves = (state: MatchState, seatId: SeatId): UseLeaderMove[] =>
  legalMoves(state, seatId).filter((move): move is UseLeaderMove => move.kind === "use_leader");

const givePlayingTurn = (state: MatchState, seatId: SeatId) => {
  state.phase = "playing";
  state.currentTurn = seatId;
  state.seats.seat_a.mulliganComplete = true;
  state.seats.seat_b.mulliganComplete = true;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
};

describe("weather-pulling leader legal moves (cCp14)", () => {
  it("requires official weather source IDs rather than any source with a matching weather ability", () => {
    const fog = currentCatalogCards.find((card) => card.sourceId === "neutral.impenetrable-fog");
    expect(fog).toBeDefined();
    const alternateFog = { ...fog!, sourceId: "custom.fog" };

    expect(isEligibleWeatherSourceForLeader("play_fog", fog)).toBe(true);
    expect(isEligibleWeatherSourceForLeader("play_fog", alternateFog)).toBe(false);
    expect(isEligibleWeatherSourceForLeader("play_any_weather", alternateFog)).toBe(false);
  });

  it("emits a play_fog use_leader move with deck_card_source target when fog is in own deck", () => {
    const state = createState("legal-fog");
    setLeader(state, "seat_a", "northern-realms.foltest-king-of-temeria");
    const fog = findCardBySource(state, "neutral.impenetrable-fog");
    putInDeck(state, "seat_a", fog);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move.metadata.ability).toBe("play_fog");
    expect(move.metadata.abilityStatus).toBe("implemented");
    expect(move.metadata.targetRequirement).toBe("deck_weather_source");
    expect(move.metadata.targetSourceId).toBe("neutral.impenetrable-fog");
    expect(move.target).toEqual({
      kind: "deck_card_source",
      seatId: "seat_a",
      sourceId: "neutral.impenetrable-fog",
    });
  });

  it("emits no play_fog move when fog is absent from deck even if present in hand, discard, or weather", () => {
    const state = createState("legal-fog-not-in-deck");
    setLeader(state, "seat_a", "northern-realms.foltest-king-of-temeria");

    const handFog = findCardBySource(state, "neutral.impenetrable-fog");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.impenetrable-fog");
    putInHand(state, "seat_a", handFog);
    givePlayingTurn(state, "seat_a");
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    putInDiscard(state, "seat_a", handFog);
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    putWeather(state, "seat_a", handFog);
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("covers play_frost and play_rain via deterministic mappings", () => {
    const frostState = createState("legal-frost");
    setLeader(frostState, "seat_a", "scoiatael.francesca-findabair-pureblood-elf");
    const frost = findCardBySource(frostState, "neutral.biting-frost");
    purgeAllSourceFromDeck(frostState, "seat_a", "neutral.biting-frost");
    purgeAllSourceFromDeck(frostState, "seat_a", "neutral.impenetrable-fog");
    purgeAllSourceFromDeck(frostState, "seat_a", "neutral.torrential-rain");
    putInDeck(frostState, "seat_a", frost);
    givePlayingTurn(frostState, "seat_a");

    const frostMoves = useLeaderMoves(frostState, "seat_a");
    expect(frostMoves).toHaveLength(1);
    expect(frostMoves[0].metadata.ability).toBe("play_frost");
    expect(frostMoves[0].target).toEqual({
      kind: "deck_card_source",
      seatId: "seat_a",
      sourceId: "neutral.biting-frost",
    });

    const rainState = createState("legal-rain");
    setLeader(rainState, "seat_b", "nilfgaard.emhyr-var-emreis-his-imperial-majesty");
    const rain = findCardBySource(rainState, "neutral.torrential-rain");
    purgeAllSourceFromDeck(rainState, "seat_b", "neutral.biting-frost");
    putInDeck(rainState, "seat_b", rain);
    givePlayingTurn(rainState, "seat_b");

    const rainMoves = useLeaderMoves(rainState, "seat_b");
    expect(rainMoves).toHaveLength(1);
    expect(rainMoves[0].metadata.ability).toBe("play_rain");
    expect(rainMoves[0].target).toEqual({
      kind: "deck_card_source",
      seatId: "seat_b",
      sourceId: "neutral.torrential-rain",
    });
  });

  it("play_any_weather emits one move per eligible weather source in deck and excludes Clear Weather", () => {
    const state = createState("legal-any-weather");
    setLeader(state, "seat_a", "monsters.eredin-king-of-the-wild-hunt");

    const frost = findCardBySource(state, "neutral.biting-frost");
    const fog = findCardBySource(state, "neutral.impenetrable-fog");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.biting-frost");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.impenetrable-fog");

    const rainInstanceId = "seat_a:rain:test";
    state.cardsById[rainInstanceId] = {
      instanceId: rainInstanceId,
      sourceId: "neutral.torrential-rain",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "deck", seat: "seat_a" },
    };
    state.seats.seat_a.deck.push(rainInstanceId);

    const stormInstanceId = "seat_a:storm:test";
    state.cardsById[stormInstanceId] = {
      instanceId: stormInstanceId,
      sourceId: "neutral.skellige-storm",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "deck", seat: "seat_a" },
    };
    state.seats.seat_a.deck.push(stormInstanceId);

    const clearInstanceId = "seat_a:clear:test";
    state.cardsById[clearInstanceId] = {
      instanceId: clearInstanceId,
      sourceId: "neutral.clear-weather",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "deck", seat: "seat_a" },
    };
    state.seats.seat_a.deck.push(clearInstanceId);

    putInDeck(state, "seat_a", frost);
    putInDeck(state, "seat_a", fog);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    const sourceIds = moves.map((move) => move.metadata.targetSourceId).filter((id): id is string => Boolean(id));
    expect(sourceIds).toEqual([
      "neutral.biting-frost",
      "neutral.impenetrable-fog",
      "neutral.torrential-rain",
      "neutral.skellige-storm",
    ]);
    moves.forEach((move) => {
      expect(move.metadata.ability).toBe("play_any_weather");
      expect(move.metadata.abilityStatus).toBe("implemented");
      expect(move.target.kind).toBe("deck_card_source");
    });
    expect(sourceIds).not.toContain("neutral.clear-weather");
  });

  it("play_any_weather emits a single move per source even with multiple deck copies", () => {
    const state = createState("legal-any-weather-dupes");
    setLeader(state, "seat_a", "monsters.eredin-king-of-the-wild-hunt");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.biting-frost");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.impenetrable-fog");

    const frostFirst = findCardBySource(state, "neutral.biting-frost");
    putInDeck(state, "seat_a", frostFirst);
    const frostExtraId = "seat_a:frost-extra:test";
    state.cardsById[frostExtraId] = {
      instanceId: frostExtraId,
      sourceId: "neutral.biting-frost",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "deck", seat: "seat_a" },
    };
    state.seats.seat_a.deck.push(frostExtraId);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.targetSourceId).toBe("neutral.biting-frost");
  });

  it("respects existing leader move gates (turn, pass, leaderUsed, prompt, phase)", () => {
    const state = createState("legal-fog-gates");
    setLeader(state, "seat_a", "northern-realms.foltest-king-of-temeria");
    const fog = findCardBySource(state, "neutral.impenetrable-fog");
    putInDeck(state, "seat_a", fog);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(1);

    state.seats.seat_a.leaderUsed = true;
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    state.seats.seat_a.leaderUsed = false;
    state.seats.seat_a.passed = true;
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    state.seats.seat_a.passed = false;
    state.currentTurn = "seat_b";
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    state.currentTurn = "seat_a";
    state.phase = "round_end";
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);

    state.phase = "playing";
    state.pendingPrompt = {
      promptId: "prompt:test",
      seatId: "seat_a",
      kind: "medic_revive",
      abilityId: "medic",
      options: [],
    };
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("does not emit use_leader moves for non-weather placeholder leaders", () => {
    const state = createState("legal-placeholder-other");
    setLeader(state, "seat_a", "scoiatael.francesca-findabair-queen-of-dol-blathanna");
    givePlayingTurn(state, "seat_a");
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });
});

describe("weather-pulling leader command execution (cCp14)", () => {
  it("executing play_fog moves Fog from deck to weather, sets controller, marks leader used, hands off turn", () => {
    const state = createState("exec-fog");
    setLeader(state, "seat_a", "northern-realms.foltest-king-of-temeria");
    const fog = findCardBySource(state, "neutral.impenetrable-fog");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.impenetrable-fog");
    putInDeck(state, "seat_a", fog);
    state.cardsById[fog].controller = "seat_b";
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "deck_card_source", seatId: "seat_a", sourceId: "neutral.impenetrable-fog" },
    });

    expect(result.state.weather.entries).toContain(fog);
    expect(result.state.seats.seat_a.deck).not.toContain(fog);
    expect(result.state.cardsById[fog].zone).toEqual({ kind: "weather" });
    expect(result.state.cardsById[fog].controller).toBe("seat_a");
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
    expect(result.state.currentTurn).toBe("seat_b");

    const cardPlayedEvent = result.events.find((event) => event.type === "card_played");
    expect(cardPlayedEvent).toBeTruthy();
    expect(result.events.some((event) => event.type === "leader_used" && event.abilityId === "play_fog")).toBe(true);
    expect(
      result.events.some(
        (event) => event.type === "card_moved" && event.cardId === fog && event.reason === "leader_weather",
      ),
    ).toBe(true);
  });

  it("executes play_frost and play_rain through identical deck-pull semantics", () => {
    (
      [
        {
          leader: "scoiatael.francesca-findabair-pureblood-elf",
          ability: "play_frost",
          source: "neutral.biting-frost",
        },
        {
          leader: "nilfgaard.emhyr-var-emreis-his-imperial-majesty",
          ability: "play_rain",
          source: "neutral.torrential-rain",
        },
      ] as const
    ).forEach(({ leader, ability, source }) => {
      const state = createState(`exec-${ability}`);
      setLeader(state, "seat_a", leader);
      purgeAllSourceFromDeck(state, "seat_a", "neutral.biting-frost");
      purgeAllSourceFromDeck(state, "seat_a", "neutral.impenetrable-fog");
      purgeAllSourceFromDeck(state, "seat_a", "neutral.torrential-rain");

      const cardId = `seat_a:${ability}:test`;
      state.cardsById[cardId] = {
        instanceId: cardId,
        sourceId: source,
        sourceKind: "card",
        owner: "seat_a",
        controller: "seat_a",
        zone: { kind: "deck", seat: "seat_a" },
      };
      state.seats.seat_a.deck.push(cardId);
      givePlayingTurn(state, "seat_a");

      const result = execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "deck_card_source", seatId: "seat_a", sourceId: source },
      });
      expect(result.state.weather.entries).toContain(cardId);
      expect(result.events.some((event) => event.type === "leader_used" && event.abilityId === ability)).toBe(true);
    });
  });

  it("executing play_any_weather can choose Skellige Storm when present in deck", () => {
    const state = createState("exec-any-weather-storm");
    setLeader(state, "seat_a", "monsters.eredin-king-of-the-wild-hunt");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.biting-frost");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.impenetrable-fog");

    const stormId = "seat_a:storm:test";
    state.cardsById[stormId] = {
      instanceId: stormId,
      sourceId: "neutral.skellige-storm",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "deck", seat: "seat_a" },
    };
    state.seats.seat_a.deck.push(stormId);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "deck_card_source", seatId: "seat_a", sourceId: "neutral.skellige-storm" },
    });

    expect(result.state.weather.entries).toContain(stormId);
    expect(result.state.cardsById[stormId].controller).toBe("seat_a");
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
  });

  it("only deck instances are eligible — copies on board, in hand, discard, or weather are not pulled", () => {
    const state = createState("exec-fog-deck-only");
    setLeader(state, "seat_a", "northern-realms.foltest-king-of-temeria");

    const handFog = findCardBySource(state, "neutral.impenetrable-fog");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.impenetrable-fog");
    putInHand(state, "seat_a", handFog);
    givePlayingTurn(state, "seat_a");

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "deck_card_source", seatId: "seat_a", sourceId: "neutral.impenetrable-fog" },
      }),
    ).toThrow(EngineRuleError);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
    expect(state.weather.entries).not.toContain(handFog);
    expect(state.seats.seat_a.hand).toContain(handFog);
  });

  it("rejects wrong target source for a single-weather leader", () => {
    const state = createState("exec-fog-wrong-target");
    setLeader(state, "seat_a", "northern-realms.foltest-king-of-temeria");
    const fog = findCardBySource(state, "neutral.impenetrable-fog");
    putInDeck(state, "seat_a", fog);
    givePlayingTurn(state, "seat_a");

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "deck_card_source", seatId: "seat_a", sourceId: "neutral.biting-frost" },
      }),
    ).toThrow(EngineRuleError);
  });

  it("rejects clear-weather as a play_any_weather target", () => {
    const state = createState("exec-any-weather-clear");
    setLeader(state, "seat_a", "monsters.eredin-king-of-the-wild-hunt");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.biting-frost");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.impenetrable-fog");

    const clearId = "seat_a:clear:test";
    state.cardsById[clearId] = {
      instanceId: clearId,
      sourceId: "neutral.clear-weather",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "deck", seat: "seat_a" },
    };
    state.seats.seat_a.deck.push(clearId);
    givePlayingTurn(state, "seat_a");

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "deck_card_source", seatId: "seat_a", sourceId: "neutral.clear-weather" },
      }),
    ).toThrow(EngineRuleError);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
    expect(state.weather.entries).not.toContain(clearId);
  });

  it("rejects an absent eligible weather source without consuming the leader", () => {
    const state = createState("exec-fog-empty-deck");
    setLeader(state, "seat_a", "northern-realms.foltest-king-of-temeria");
    purgeAllSourceFromDeck(state, "seat_a", "neutral.impenetrable-fog");
    givePlayingTurn(state, "seat_a");

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "deck_card_source", seatId: "seat_a", sourceId: "neutral.impenetrable-fog" },
      }),
    ).toThrow(EngineRuleError);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("rejects wrong target seat for the acting seat", () => {
    const state = createState("exec-fog-wrong-seat");
    setLeader(state, "seat_a", "northern-realms.foltest-king-of-temeria");
    const fog = findCardBySource(state, "neutral.impenetrable-fog");
    putInDeck(state, "seat_a", fog);
    givePlayingTurn(state, "seat_a");

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "deck_card_source", seatId: "seat_b", sourceId: "neutral.impenetrable-fog" },
      }),
    ).toThrow(EngineRuleError);
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });

  it("preserves the existing Clear Weather leader behavior (clears weather, including Skellige Storm)", () => {
    const state = createState("exec-clear-weather-leader");
    const stormProxy = findCardBySource(state, "neutral.torrential-rain");
    state.cardsById[stormProxy].sourceId = "neutral.skellige-storm";
    putWeather(state, "seat_b", stormProxy);
    const frost = findCardBySource(state, "neutral.biting-frost");
    putWeather(state, "seat_a", frost);

    state.phase = "playing";
    state.currentTurn = "seat_a";
    state.seats.seat_a.mulliganComplete = true;
    state.seats.seat_b.mulliganComplete = true;

    const result = execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } });

    expect(result.state.weather.entries).toEqual([]);
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
    expect(result.state.seats.seat_b.discard).toContain(stormProxy);
    expect(result.state.seats.seat_a.discard).toContain(frost);
  });

  it("still rejects placeholder non-weather leaders without consuming the leader", () => {
    const state = createState("exec-placeholder-other");
    setLeader(state, "seat_a", "scoiatael.francesca-findabair-queen-of-dol-blathanna");
    givePlayingTurn(state, "seat_a");

    expect(() => execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } })).toThrow(
      EngineRuleError,
    );
    expect(state.seats.seat_a.leaderUsed).toBe(false);
  });
});

// Suppress unused warnings — these helpers exist for future tests.
void putOnBoardClose;
