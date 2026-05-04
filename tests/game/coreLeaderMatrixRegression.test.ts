import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import { officialLeaderPromotionManifest } from "@/data/catalog/leaders/official-promotion";
import {
  CATALOG_LEADER_ABILITY_METADATA,
  type CatalogCardSource,
  type CatalogLeaderAbilityId,
  type CatalogRow,
} from "@/game/catalog";
import {
  EngineRuleError,
  executeCommand,
  getLegalMoves,
  startMatch,
  type CardInstance,
  type CardInstanceId,
  type ChoosePromptOptionMove,
  type EngineCommand,
  type GameEvent,
  type LegalMove,
  type MatchConfig,
  type MatchState,
  type SeatId,
  type UseLeaderMove,
} from "@/game/core";
import { summarizeEvents } from "@/components/game/engine/engineShellViewModels";

const WHITE_FLAME = "nilfgaard.emhyr-var-emreis-the-white-flame";
const LORD_COMMANDER = "northern-realms.foltest-lord-commander-of-the-north";
const KING_OF_TEMERIA = "northern-realms.foltest-king-of-temeria";
const SON_OF_MEDELL = "northern-realms.foltest-son-of-medell";
const HOPE_OF_AEN_SEIDHE = "scoiatael.francesca-findabair-hope-of-the-aen-seidhe";
const BRINGER_OF_DEATH = "monsters.eredin-bringer-of-death";
const CRACH_AN_CRAITE = "skellige.crach-an-craite";
const RELENTLESS = "nilfgaard.emhyr-var-emreis-the-relentless";
const DESTROYER_OF_WORLDS = "monsters.eredin-destroyer-of-worlds";
const EMPEROR_OF_NILFGAARD = "nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard";
const KING_BRAN = "skellige.king-bran";

const FIEND = "monsters.fiend";
const FOG = "neutral.impenetrable-fog";
const BARCLAY_ELS = "scoiatael.barclay-els";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp30-matrix-${seed}`,
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

const createState = (seed: string | number = "matrix"): MatchState =>
  startMatch(createConfig(seed)).state;

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
  const instanceId = `${ownerSeat}:cCp30:${suffix}:${sourceId}`;
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

const findCleanUnit = (row: CatalogRow, strength: number): CatalogCardSource => {
  const card = currentCatalogCards.find(
    (candidate) =>
      candidate.kind === "unit" &&
      candidate.tags.includes("non_hero") &&
      candidate.rows.length === 1 &&
      candidate.rows[0] === row &&
      candidate.strength === strength &&
      candidate.abilities.length === 1 &&
      candidate.abilities[0] === "none",
  );
  if (!card) {
    throw new Error(`Missing clean ${row} strength-${strength} unit fixture.`);
  }
  return card;
};

const openNoTargetPrompt = (state: MatchState, seatId: SeatId) => {
  state.pendingPrompt = {
    promptId: `prompt:cCp30:${seatId}`,
    seatId,
    kind: "choose_option",
    abilityId: "test_prompt_gate",
    options: [
      {
        optionId: "ack",
        label: "Acknowledge",
        target: { kind: "none" },
      },
    ],
  };
};

type ActiveCategorySetup = {
  readonly category: string;
  readonly leaderSourceId: string;
  readonly setup: (state: MatchState) => void;
};

const activeCategorySetups: readonly ActiveCategorySetup[] = [
  {
    category: "clear weather",
    leaderSourceId: LORD_COMMANDER,
    setup: () => undefined,
  },
  {
    category: "weather-pulling leaders",
    leaderSourceId: KING_OF_TEMERIA,
    setup: (state) => {
      addCardInstance(state, "seat_a", FOG, "fog", "deck");
    },
  },
  {
    category: "row-Scorch leaders",
    leaderSourceId: SON_OF_MEDELL,
    setup: (state) => {
      const rangedSix = findCleanUnit("ranged", 6);
      placeOnBoard(state, "seat_b", addCardInstance(state, "seat_b", rangedSix.sourceId, "scorch-a"), "ranged");
      placeOnBoard(state, "seat_b", addCardInstance(state, "seat_b", rangedSix.sourceId, "scorch-b"), "ranged");
    },
  },
  {
    category: "optimize agile rows",
    leaderSourceId: HOPE_OF_AEN_SEIDHE,
    setup: (state) => {
      placeOnBoard(state, "seat_a", addCardInstance(state, "seat_a", BARCLAY_ELS, "agile"), "close");
    },
  },
  {
    category: "restore own discard to hand",
    leaderSourceId: BRINGER_OF_DEATH,
    setup: (state) => {
      addCardInstance(state, "seat_a", FIEND, "restore", "discard");
    },
  },
  {
    category: "shuffle discards into decks",
    leaderSourceId: CRACH_AN_CRAITE,
    setup: (state) => {
      addCardInstance(state, "seat_b", FIEND, "recycle", "discard");
    },
  },
  {
    category: "draw from opponent discard",
    leaderSourceId: RELENTLESS,
    setup: (state) => {
      addCardInstance(state, "seat_b", FIEND, "opponent-discard", "discard");
    },
  },
  {
    category: "discard two, draw one from deck",
    leaderSourceId: DESTROYER_OF_WORLDS,
    setup: (state) => {
      addCardInstance(state, "seat_a", FIEND, "discard-draw-hand", "hand");
      addCardInstance(state, "seat_a", FIEND, "discard-draw-deck", "deck");
    },
  },
  {
    category: "look three cards",
    leaderSourceId: EMPEROR_OF_NILFGAARD,
    setup: (state) => {
      addCardInstance(state, "seat_b", FIEND, "look-hand", "hand");
    },
  },
  {
    category: "cancel leader",
    leaderSourceId: WHITE_FLAME,
    setup: (state) => {
      setLeader(state, "seat_b", KING_BRAN);
    },
  },
];

const buildActiveCategoryState = ({ category, leaderSourceId, setup }: ActiveCategorySetup) => {
  const state = createState(`active-gates-${category}`);
  setLeader(state, "seat_a", leaderSourceId);
  setup(state);
  givePlayingTurn(state, "seat_a");
  const leaderMoves = leaderMovesFor(state, "seat_a");
  expect(leaderMoves.length, `${category} should have at least one legal leader move before gates`).toBeGreaterThan(0);
  return { state, representativeMove: leaderMoves[0] };
};

describe("official leader matrix invariants (cCp30)", () => {
  it("keeps the completed cCp29 public counts and zero-placeholder contract", () => {
    expect(currentCatalogLeaders).toHaveLength(22);
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toHaveLength(14);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).toHaveLength(7);
    expect(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds).toHaveLength(1);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toHaveLength(22);
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).toEqual([]);
  });

  it("places each official leader source in exactly one primary behavior bucket", () => {
    const buckets = [
      ...officialLeaderPromotionManifest.executableLeaderSourceIds.map((sourceId) => ({ sourceId, bucket: "executable" })),
      ...officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds.map((sourceId) => ({ sourceId, bucket: "passive" })),
      ...officialLeaderPromotionManifest.implementedSetupLeaderSourceIds.map((sourceId) => ({ sourceId, bucket: "setup" })),
    ];
    const bucketCounts = new Map<string, string[]>();
    buckets.forEach(({ sourceId, bucket }) => {
      bucketCounts.set(sourceId, [...(bucketCounts.get(sourceId) ?? []), bucket]);
    });

    const officialSourceIds = currentCatalogLeaders.map((leader) => leader.sourceId).sort();
    expect([...bucketCounts.keys()].sort()).toEqual(officialSourceIds);
    bucketCounts.forEach((bucketList, sourceId) => {
      expect(bucketList, `${sourceId} should appear in exactly one bucket`).toHaveLength(1);
    });
    expect(new Set(officialLeaderPromotionManifest.implementedLeaderSourceIds)).toEqual(
      new Set(officialSourceIds),
    );
  });

  it("registers implemented metadata for every leader ability used by official leaders", () => {
    const officialAbilityIds = new Set(currentCatalogLeaders.map((leader) => leader.ability));
    officialAbilityIds.forEach((abilityId) => {
      const metadata = CATALOG_LEADER_ABILITY_METADATA[abilityId as CatalogLeaderAbilityId];
      expect(metadata, abilityId).toBeDefined();
      expect(metadata.status, abilityId).toBe("implemented");
    });
  });
});

describe("active leader standard gates (cCp30)", () => {
  it.each(activeCategorySetups)("$category has no use_leader after leaderUsed", (setup) => {
    const { state } = buildActiveCategoryState(setup);
    state.seats.seat_a.leaderUsed = true;
    expect(leaderMovesFor(state, "seat_a")).toHaveLength(0);
  });

  it.each(activeCategorySetups)("$category has no use_leader on the wrong turn", (setup) => {
    const { state } = buildActiveCategoryState(setup);
    state.currentTurn = "seat_b";
    expect(leaderMovesFor(state, "seat_a")).toHaveLength(0);
  });

  it.each(activeCategorySetups)("$category has no use_leader while any prompt is pending", (setup) => {
    const { state } = buildActiveCategoryState(setup);
    openNoTargetPrompt(state, "seat_a");
    expect(leaderMovesFor(state, "seat_a")).toHaveLength(0);
    expect(promptMoves(state, "seat_a")).toHaveLength(1);
  });

  it.each(activeCategorySetups)("$category has no use_leader after the acting seat passed", (setup) => {
    const { state } = buildActiveCategoryState(setup);
    state.seats.seat_a.passed = true;
    expect(leaderMovesFor(state, "seat_a")).toHaveLength(0);
  });

  it.each(activeCategorySetups)("$category manual UseLeader rejects without mutation when gated", (setup) => {
    const { state, representativeMove } = buildActiveCategoryState(setup);
    state.seats.seat_a.passed = true;
    const before = structuredClone(state);

    expect(() =>
      execute(state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: representativeMove.target,
      }),
    ).toThrow(EngineRuleError);
    expect(state).toEqual(before);
  });
});

describe("public event summaries stay hidden-info safe (cCp30)", () => {
  it("summarizes look-three-cards by count and cancel leader by public seats only", () => {
    const events: GameEvent[] = [
      {
        type: "opponent_hand_revealed",
        seatId: "seat_a",
        opponentSeatId: "seat_b",
        cardIds: ["seat_b:secret:card-1", "seat_b:secret:card-2"],
        sourceIds: ["nilfgaard.secret-one", "nilfgaard.secret-two"],
        reason: "look_three_cards",
      },
      {
        type: "leader_cancelled",
        mode: "reaction",
        round: 2,
        seatId: "seat_b",
        targetSeatId: "seat_a",
        targetLeaderCardId: "seat_a:leader",
        targetLeaderSourceId: LORD_COMMANDER,
        targetAbilityId: "clear_weather",
      },
    ];

    const summaries = summarizeEvents({
      events,
      seatLabels: { seat_a: "Human", seat_b: "AI" },
    });

    expect(summaries.map((summary) => summary.label)).toEqual([
      "Human looked at 2 opponent hand cards",
      "AI cancelled Human leader for round 2",
    ]);
    expect(JSON.stringify(summaries)).not.toContain("secret");
    expect(JSON.stringify(summaries)).not.toContain("nilfgaard.secret");
    expect(JSON.stringify(summaries)).not.toContain(LORD_COMMANDER);
  });
});
