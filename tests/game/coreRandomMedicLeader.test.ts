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
  getRandomMedicCandidates,
  hasRandomMedicPolicyForSeat,
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
import { CATALOG_LEADER_ABILITY_METADATA, type CatalogCardSource } from "@/game/catalog";
import { officialLeaderPromotionManifest } from "@/data/catalog/leaders/official-promotion";

const INVADER = "nilfgaard.emhyr-var-emreis-invader-of-the-north";
const RELENTLESS = "nilfgaard.emhyr-var-emreis-the-relentless";

// Production fixtures.
const DUN_BANNER_MEDIC = "northern-realms.dun-banner-medic"; // unit (siege), medic
const ETOLIAN_MEDIC = "nilfgaard.etolian-auxiliary-archers"; // unit (ranged), medic
const CATAPULT = "northern-realms.catapult"; // unit (siege), tight_bond
const FIEND = "monsters.fiend"; // unit (close), none
const THALER = "northern-realms.thaler"; // unit (siege), spy
const SCORCH_SPECIAL = "neutral.scorch"; // special, scorch
const FROST = "neutral.biting-frost"; // weather (special)
const GERALT = "neutral.geralt-of-rivia"; // hero (close), muster_roach
const GAUNTER = "neutral.gaunter-odimm"; // unit (siege), muster
const GAUNTER_DARKNESS = "neutral.gaunter-odimm-darkness"; // unit (ranged), muster
const ERMION = "skellige.ermion"; // hero (ranged), mardroeme
const YOUNG_BERSERKER = "skellige.young-berserker"; // unit (ranged), berserker
const VILDKAARL = "skellige.vildkaarl"; // unit (close), morale_boost (side-deck-only target)

const HERO_MEDIC_TEST_SOURCE_ID = "test.hero-medic-fixture";

const heroMedicTestSource: CatalogCardSource = {
  sourceId: HERO_MEDIC_TEST_SOURCE_ID,
  name: "Test Hero Medic Fixture",
  faction: "neutral",
  kind: "hero",
  strength: 5,
  rows: ["close"],
  abilities: ["medic"],
  tags: ["hero"],
  deckLimit: 1,
  image: "/images/neutral/test_hero_medic.png",
};

const catalogCardsWithHeroMedicFixture: readonly CatalogCardSource[] = [
  ...currentCatalogCards,
  heroMedicTestSource,
];

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp25-random-medic-${seed}`,
  seed,
  seats: [
    {
      seatId: "seat_a",
      playerId: "player-a",
      controllerKind: "human",
      faction: "nilfgaard",
      deckPreset: currentNilfgaardDeckPreset,
    },
    {
      seatId: "seat_b",
      playerId: "player-b",
      controllerKind: "ai",
      faction: "northern_realms",
      deckPreset: currentNorthernRealmsDeckPreset,
    },
  ],
  catalog: {
    cards: currentCatalogCards,
    leaders: currentCatalogLeaders,
  },
});

const createState = (seed = "random-medic"): MatchState => startMatch(createConfig(seed)).state;

const execute = (
  state: MatchState,
  command: Exclude<EngineCommand, { type: "StartMatch" }>,
  catalogCards: readonly CatalogCardSource[] = currentCatalogCards,
) =>
  executeCommand({
    state,
    command,
    catalogCards,
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

const placeInSideDeck = (state: MatchState, seatId: SeatId, cardId: CardInstanceId) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].sideDeck.push(cardId);
  state.cardsById[cardId].zone = { kind: "side_deck", seat: seatId };
  state.cardsById[cardId].controller = seatId;
};

const placeOnRow = (
  state: MatchState,
  seatId: SeatId,
  row: "close" | "ranged" | "siege",
  cardId: CardInstanceId,
) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
  state.cardsById[cardId].controller = seatId;
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

const legalMovesFor = (
  state: MatchState,
  seatId: SeatId,
  catalogCards: readonly CatalogCardSource[] = currentCatalogCards,
): LegalMove[] =>
  getLegalMoves({
    state,
    seatId,
    catalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

const useLeaderMoves = (state: MatchState, seatId: SeatId): UseLeaderMove[] =>
  legalMovesFor(state, seatId).filter((move): move is UseLeaderMove => move.kind === "use_leader");

const playMedicFromHand = (
  state: MatchState,
  seatId: SeatId,
  medicId: CardInstanceId,
  row: "close" | "ranged" | "siege" = "ranged",
  catalogCards: readonly CatalogCardSource[] = currentCatalogCards,
) =>
  execute(
    state,
    {
      type: "PlayCard",
      seatId,
      cardId: medicId,
      target: { kind: "board_row", side: "own", seatId, row },
    },
    catalogCards,
  );

describe("random_medic metadata and manifest (cCp25)", () => {
  it("promotes random_medic to implemented", () => {
    expect(CATALOG_LEADER_ABILITY_METADATA.random_medic.status).toBe("implemented");
    expect(CATALOG_LEADER_ABILITY_METADATA.random_medic.description.length).toBeGreaterThan(0);
  });

  it("includes Invader of the North in implementedPassiveLeaderSourceIds and the combined implemented set", () => {
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).toContain(INVADER);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toContain(INVADER);
  });

  it("excludes Invader of the North from executableLeaderSourceIds", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).not.toContain(INVADER);
  });

  it("removes random_medic from placeholderLeaderAbilityIds and keeps the remaining four", () => {
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain("random_medic");
    expect([...officialLeaderPromotionManifest.placeholderLeaderAbilityIds].sort()).toEqual([
      "cancel_leader",
      "discard_two_draw_one_from_deck",
      "draw_extra_card",
      "look_three_cards",
    ]);
  });

  it("retains Tranche 2 totals: 11 executable + 7 passive = 18 implemented leaders", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toHaveLength(11);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).toHaveLength(7);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toHaveLength(18);
  });
});

describe("hasRandomMedicPolicyForSeat helper (cCp25)", () => {
  it("returns true when the acting seat's leader is Invader of the North", () => {
    const state = createState("policy-true");
    setLeader(state, "seat_a", INVADER);
    givePlayingTurn(state, "seat_a");

    expect(
      hasRandomMedicPolicyForSeat({
        state,
        seatId: "seat_a",
        catalogLeaders: currentCatalogLeaders,
      }),
    ).toBe(true);
  });

  it("returns false for any other Nilfgaard leader", () => {
    const state = createState("policy-false-relentless");
    setLeader(state, "seat_a", RELENTLESS);
    givePlayingTurn(state, "seat_a");

    expect(
      hasRandomMedicPolicyForSeat({
        state,
        seatId: "seat_a",
        catalogLeaders: currentCatalogLeaders,
      }),
    ).toBe(false);
  });
});

describe("getRandomMedicCandidates helper (cCp25)", () => {
  it("returns no candidates when own discard is empty", () => {
    const state = createState("helper-empty");
    setLeader(state, "seat_a", INVADER);
    givePlayingTurn(state, "seat_a");

    expect(
      getRandomMedicCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("returns one candidate for a single regular non-hero unit in own discard with the canonical first-row mapping", () => {
    const state = createState("helper-one");
    setLeader(state, "seat_a", INVADER);
    const catapult = addCardInstance(state, "seat_a", CATAPULT, "catapult");
    placeInDiscard(state, "seat_a", catapult);
    givePlayingTurn(state, "seat_a");

    const candidates = getRandomMedicCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toEqual({
      cardId: catapult,
      sourceId: CATAPULT,
      row: "siege",
      boardSeat: "seat_a",
    });
  });

  it("excludes hero, special, and weather entries even when they reach own discard", () => {
    const state = createState("helper-filter-kind");
    setLeader(state, "seat_a", INVADER);
    const hero = addCardInstance(state, "seat_a", GERALT, "geralt");
    const special = addCardInstance(state, "seat_a", SCORCH_SPECIAL, "scorch");
    const weather = addCardInstance(state, "seat_a", FROST, "frost");
    placeInDiscard(state, "seat_a", hero);
    placeInDiscard(state, "seat_a", special);
    placeInDiscard(state, "seat_a", weather);
    givePlayingTurn(state, "seat_a");

    expect(
      getRandomMedicCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("ignores opponent discard entries", () => {
    const state = createState("helper-opp-discard");
    setLeader(state, "seat_a", INVADER);
    const opponentUnit = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", opponentUnit);
    givePlayingTurn(state, "seat_a");

    expect(
      getRandomMedicCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("includes side-deck-only / generated non-hero units that physically reach own discard", () => {
    const state = createState("helper-side-deck-only");
    setLeader(state, "seat_a", INVADER);
    const vildkaarl = addCardInstance(state, "seat_a", VILDKAARL, "vildkaarl");
    placeInDiscard(state, "seat_a", vildkaarl);
    givePlayingTurn(state, "seat_a");

    const candidates = getRandomMedicCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].sourceId).toBe(VILDKAARL);
  });

  it("includes off-owner non-hero units physically sitting in own discard", () => {
    const state = createState("helper-off-owner");
    setLeader(state, "seat_a", INVADER);
    const opponentSpy = addCardInstance(state, "seat_b", THALER, "thaler");
    placeInDiscard(state, "seat_a", opponentSpy, "seat_b");
    givePlayingTurn(state, "seat_a");

    const candidates = getRandomMedicCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].sourceId).toBe(THALER);
    // Spy candidates point to the opponent board side.
    expect(candidates[0].boardSeat).toBe("seat_b");
  });

  it("skips stale missing-instance and missing-catalog-source entries", () => {
    const state = createState("helper-stale");
    setLeader(state, "seat_a", INVADER);
    state.seats.seat_a.discard.push("seat_a:test:missing-instance:none");
    const ghostId = "seat_a:test:ghost:fake.source";
    state.cardsById[ghostId] = {
      instanceId: ghostId,
      sourceId: "fake.source",
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "discard", seat: "seat_a" },
    };
    state.seats.seat_a.discard.push(ghostId);
    givePlayingTurn(state, "seat_a");

    expect(
      getRandomMedicCandidates({
        state,
        seatId: "seat_a",
        catalogCards: currentCatalogCards,
      }),
    ).toEqual([]);
  });

  it("emits one candidate per multi-row card, not one per row, using the canonical close→ranged→siege fallback", () => {
    const state = createState("helper-multi-row");
    setLeader(state, "seat_a", INVADER);
    // Olaf is a multi-row (close+ranged) non-hero unit.
    const olaf = addCardInstance(state, "seat_a", "skellige.olaf", "olaf");
    placeInDiscard(state, "seat_a", olaf);
    givePlayingTurn(state, "seat_a");

    const candidates = getRandomMedicCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(candidates).toHaveLength(1);
    expect(candidates[0].cardId).toBe(olaf);
    expect(candidates[0].row).toBe("close");
  });

  it("preserves discard insertion order before random selection", () => {
    const state = createState("helper-order");
    setLeader(state, "seat_a", INVADER);
    const catapult = addCardInstance(state, "seat_a", CATAPULT, "catapult");
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", catapult);
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const candidates = getRandomMedicCandidates({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(candidates.map((entry) => entry.cardId)).toEqual([catapult, fiend]);
  });
});

describe("legal-move passive contract for random_medic (cCp25)", () => {
  it("emits no use_leader move for the Invader of the North seat regardless of own discard contents", () => {
    const state = createState("legal-no-move");
    setLeader(state, "seat_a", INVADER);
    const catapult = addCardInstance(state, "seat_a", CATAPULT, "catapult");
    placeInDiscard(state, "seat_a", catapult);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("rejects manual UseLeader without setting leaderUsed, without emitting leader_used, and without mutating state", () => {
    const state = createState("manual-reject");
    setLeader(state, "seat_a", INVADER);
    const catapult = addCardInstance(state, "seat_a", CATAPULT, "catapult");
    placeInDiscard(state, "seat_a", catapult);
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

  it("does not affect The Relentless's draw_opponent_discard active leader move", () => {
    const state = createState("relentless-still-works");
    setLeader(state, "seat_a", RELENTLESS);
    const opponentUnit = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_b", opponentUnit);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.ability).toBe("draw_opponent_discard");
  });
});

describe("random Medic resolution under Invader of the North (cCp25)", () => {
  it("opens no prompt when a non-hero Medic resolves and emits no_targets when own discard has no eligible targets", () => {
    const state = createState("resolve-no-targets");
    setLeader(state, "seat_a", INVADER);
    const medic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "etolian");
    givePlayingTurn(state, "seat_a");
    const rngStateBefore = state.rng.state;

    const result = playMedicFromHand(state, "seat_a", medic, "ranged");

    expect(result.state.pendingPrompt).toBeNull();
    expect(result.events.some((event) => event.type === "prompt_opened")).toBe(false);
    expect(
      result.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "medic" &&
          event.outcome === "no_targets",
      ),
    ).toBe(true);
    // RNG should not advance for an empty candidate set.
    expect(result.state.rng.state).toBe(rngStateBefore);
    // Turn hands off normally.
    expect(result.state.currentTurn).toBe("seat_b");
  });

  it("revives the only eligible candidate without advancing RNG and without opening a prompt", () => {
    const state = createState("resolve-one");
    setLeader(state, "seat_a", INVADER);
    const medic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "etolian");
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");
    const rngStateBefore = state.rng.state;

    const result = playMedicFromHand(state, "seat_a", medic, "ranged");

    // No prompt opened.
    expect(result.state.pendingPrompt).toBeNull();
    expect(result.events.some((event) => event.type === "prompt_opened")).toBe(false);
    // Fiend revived to its only legal row (close).
    expect(result.state.seats.seat_a.discard).not.toContain(fiend);
    expect(result.state.seats.seat_a.board.close.units).toContain(fiend);
    expect(result.state.cardsById[fiend].controller).toBe("seat_a");
    // ability_resolved outcome is random_revived_card.
    expect(
      result.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "medic" &&
          event.outcome === "random_revived_card",
      ),
    ).toBe(true);
    // medic_revive card_moved emitted for the revived card.
    expect(
      result.events.some(
        (event) =>
          event.type === "card_moved" &&
          event.cardId === fiend &&
          event.reason === "medic_revive" &&
          event.to.kind === "board_row",
      ),
    ).toBe(true);
    // card_played emitted for the revived card.
    expect(
      result.events.some(
        (event) => event.type === "card_played" && event.cardId === fiend,
      ),
    ).toBe(true);
    // RNG does not advance for a single candidate.
    expect(result.state.rng.state).toBe(rngStateBefore);
    expect(result.state.currentTurn).toBe("seat_b");
  });

  it("advances RNG and picks deterministically from multiple candidates given identical seed/state", () => {
    const seed = "resolve-many-deterministic";
    const buildScenario = () => {
      const state = createState(seed);
      setLeader(state, "seat_a", INVADER);
      const medic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "etolian");
      const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
      const catapult = addCardInstance(state, "seat_a", CATAPULT, "catapult");
      const thaler = addCardInstance(state, "seat_a", THALER, "thaler");
      placeInDiscard(state, "seat_a", fiend);
      placeInDiscard(state, "seat_a", catapult);
      placeInDiscard(state, "seat_a", thaler);
      givePlayingTurn(state, "seat_a");
      return { state, medic, fiend, catapult, thaler };
    };
    const first = buildScenario();
    const second = buildScenario();
    const rngStateBefore = first.state.rng.state;

    const firstResult = playMedicFromHand(first.state, "seat_a", first.medic, "ranged");
    const secondResult = playMedicFromHand(second.state, "seat_a", second.medic, "ranged");

    // RNG advances when there are multiple candidates.
    expect(firstResult.state.rng.state).not.toBe(rngStateBefore);
    expect(firstResult.state.rng.state).toBe(secondResult.state.rng.state);

    // Determine which card was revived in each run.
    const firstReason = firstResult.events.find(
      (event) => event.type === "card_moved" && event.reason === "medic_revive",
    );
    const secondReason = secondResult.events.find(
      (event) => event.type === "card_moved" && event.reason === "medic_revive",
    );
    expect(firstReason?.type).toBe("card_moved");
    expect(secondReason?.type).toBe("card_moved");
    if (firstReason?.type === "card_moved" && secondReason?.type === "card_moved") {
      expect(firstReason.cardId).toBe(secondReason.cardId);
    }
  });

  it("places a revived Spy on the opponent board side and resolves Spy draw for the acting seat", () => {
    const state = createState("resolve-spy");
    setLeader(state, "seat_a", INVADER);
    const medic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "etolian");
    const thaler = addCardInstance(state, "seat_a", THALER, "thaler");
    placeInDiscard(state, "seat_a", thaler);
    givePlayingTurn(state, "seat_a");

    const result = playMedicFromHand(state, "seat_a", medic, "ranged");

    expect(result.state.pendingPrompt).toBeNull();
    expect(result.state.seats.seat_b.board.siege.units).toContain(thaler);
    expect(result.state.cardsById[thaler].controller).toBe("seat_a");
    expect(result.state.cardsById[thaler].owner).toBe("seat_a");
    // Spy draws two cards into the acting seat's hand.
    expect(result.events.filter((event) => event.type === "card_drawn")).toHaveLength(2);
  });

  it("preserves the immutable owner when the revived card is owned by the opponent", () => {
    const state = createState("resolve-off-owner");
    setLeader(state, "seat_a", INVADER);
    const medic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "etolian");
    const opponentFiend = addCardInstance(state, "seat_b", FIEND, "fiend");
    placeInDiscard(state, "seat_a", opponentFiend, "seat_b");
    givePlayingTurn(state, "seat_a");
    const ownerBefore = state.cardsById[opponentFiend].owner;

    const result = playMedicFromHand(state, "seat_a", medic, "ranged");

    expect(result.state.seats.seat_a.board.close.units).toContain(opponentFiend);
    expect(result.state.cardsById[opponentFiend].controller).toBe("seat_a");
    expect(result.state.cardsById[opponentFiend].owner).toBe(ownerBefore);
  });

  it("resolves Muster on a revived non-hero Muster unit", () => {
    const state = createState("resolve-muster");
    setLeader(state, "seat_a", INVADER);
    const medic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "etolian");
    const gaunter = addCardInstance(state, "seat_a", GAUNTER, "gaunter");
    const darkness = addCardInstance(state, "seat_a", GAUNTER_DARKNESS, "darkness");
    placeInDiscard(state, "seat_a", gaunter);
    // The other Darkness sits in deck so Muster can pull it.
    removeEverywhere(state, darkness);
    state.seats.seat_a.deck.push(darkness);
    state.cardsById[darkness].zone = { kind: "deck", seat: "seat_a" };
    givePlayingTurn(state, "seat_a");

    const result = playMedicFromHand(state, "seat_a", medic, "ranged");

    // Gaunter revived to siege, then Muster pulled Darkness from deck onto ranged.
    expect(result.state.seats.seat_a.board.siege.units).toContain(gaunter);
    expect(result.state.seats.seat_a.board.ranged.units).toContain(darkness);
    expect(result.state.seats.seat_a.deck).not.toContain(darkness);
  });

  it("transforms a revived Berserker through Mardroeme settlement when Mardroeme is on the chosen row", () => {
    const state = createState("resolve-mardroeme");
    setLeader(state, "seat_a", INVADER);
    const medic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "etolian");
    const youngBerserker = addCardInstance(state, "seat_a", YOUNG_BERSERKER, "young-berserker");
    const youngVildkaarl = addCardInstance(
      state,
      "seat_a",
      "skellige.young-vildkaarl",
      "young-vildkaarl",
    );
    const ermion = addCardInstance(state, "seat_a", ERMION, "ermion");
    placeInDiscard(state, "seat_a", youngBerserker);
    placeOnRow(state, "seat_a", "ranged", ermion);
    placeInSideDeck(state, "seat_a", youngVildkaarl);
    givePlayingTurn(state, "seat_a");

    const result = playMedicFromHand(state, "seat_a", medic, "ranged");

    // Young Berserker moves into removed_from_game and Young Vildkaarl replaces it on ranged.
    expect(result.state.seats.seat_a.board.ranged.units).toContain(youngVildkaarl);
    expect(result.state.seats.seat_a.board.ranged.units).not.toContain(youngBerserker);
    expect(result.state.seats.seat_a.removedFromGame).toContain(youngBerserker);
    expect(
      result.events.some(
        (event) =>
          event.type === "card_transformed" &&
          event.fromCardId === youngBerserker &&
          event.toCardId === youngVildkaarl,
      ),
    ).toBe(true);
  });

  it("emits no prompt_opened or prompt_resolved events for a random Medic resolution", () => {
    const state = createState("no-prompt-events");
    setLeader(state, "seat_a", INVADER);
    const medic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "etolian");
    const fiend = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", fiend);
    givePlayingTurn(state, "seat_a");

    const result = playMedicFromHand(state, "seat_a", medic, "ranged");

    expect(result.events.some((event) => event.type === "prompt_opened")).toBe(false);
    expect(result.events.some((event) => event.type === "prompt_resolved")).toBe(false);
  });
});

describe("random Medic chaining (cCp25)", () => {
  it("chains a revived non-hero Medic through the same random policy when only the chained Medic is eligible", () => {
    // Construct discard with exactly one non-hero unit, and that unit is itself a non-hero Medic.
    // The first revival is deterministic (single candidate); the chained Medic then runs with
    // an empty candidate set, ending the chain cleanly.
    const state = createState("chain-deterministic");
    setLeader(state, "seat_a", INVADER);
    const playedMedic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "played-medic");
    const discardMedic = addCardInstance(state, "seat_a", DUN_BANNER_MEDIC, "discard-medic");
    placeInDiscard(state, "seat_a", discardMedic);
    givePlayingTurn(state, "seat_a");

    const result = playMedicFromHand(state, "seat_a", playedMedic, "ranged");

    expect(result.state.pendingPrompt).toBeNull();
    // First Medic revived the discard-medic to its only legal row (siege).
    expect(result.state.seats.seat_a.board.ranged.units).toContain(playedMedic);
    expect(result.state.seats.seat_a.board.siege.units).toContain(discardMedic);
    // The played Medic's resolution emits random_revived_card.
    const randomResolves = result.events.filter(
      (event) =>
        event.type === "ability_resolved" &&
        event.abilityId === "medic" &&
        event.outcome === "random_revived_card",
    );
    expect(randomResolves).toHaveLength(1);
    // The chained Medic finds an empty candidate set and emits no_targets cleanly.
    const noTargetsResolves = result.events.filter(
      (event) =>
        event.type === "ability_resolved" &&
        event.abilityId === "medic" &&
        event.outcome === "no_targets",
    );
    expect(noTargetsResolves).toHaveLength(1);
    // No prompt was opened during the chain.
    expect(result.events.some((event) => event.type === "prompt_opened")).toBe(false);
    // Turn handed off normally.
    expect(result.state.currentTurn).toBe("seat_b");
  });

  it("emits no prompt and ends cleanly when the chain runs out of eligible non-hero units", () => {
    const state = createState("chain-out");
    setLeader(state, "seat_a", INVADER);
    const playedMedic = addCardInstance(state, "seat_a", ETOLIAN_MEDIC, "played-medic");
    const discardMedic = addCardInstance(state, "seat_a", DUN_BANNER_MEDIC, "discard-medic");
    placeInDiscard(state, "seat_a", discardMedic);
    givePlayingTurn(state, "seat_a");

    const result = playMedicFromHand(state, "seat_a", playedMedic, "ranged");

    expect(result.state.pendingPrompt).toBeNull();
    expect(result.state.seats.seat_a.board.siege.units).toContain(discardMedic);
    // Final medic chain ends with no_targets when discard is empty.
    expect(
      result.events.some(
        (event) =>
          event.type === "ability_resolved" &&
          event.abilityId === "medic" &&
          event.outcome === "no_targets",
      ),
    ).toBe(true);
    expect(result.state.currentTurn).toBe("seat_b");
  });
});

describe("regression guards (cCp25)", () => {
  it("opens the normal medic_revive prompt for a non-Invader leader", () => {
    const state = createState("regress-prompt");
    // Leader stays at the default Northern Realms / Nilfgaard seat config from the preset
    // (seat_b is northern_realms in this fixture). Switch the acting seat to seat_b so we
    // exercise the non-Invader leader path with a non-hero Medic.
    const medic = addCardInstance(state, "seat_b", DUN_BANNER_MEDIC, "dun-banner");
    const target = addCardInstance(state, "seat_b", CATAPULT, "catapult");
    placeInDiscard(state, "seat_b", target);
    givePlayingTurn(state, "seat_b");

    const result = playMedicFromHand(state, "seat_b", medic, "siege");

    expect(result.state.pendingPrompt).not.toBeNull();
    expect(result.state.pendingPrompt?.kind).toBe("medic_revive");
    expect(result.events.some((event) => event.type === "prompt_opened")).toBe(true);
  });

  it("opens the normal medic prompt for a hero Medic source even when the acting seat has Invader of the North", () => {
    const state = createState("regress-hero-medic");
    setLeader(state, "seat_a", INVADER);
    const heroMedic = addCardInstance(state, "seat_a", HERO_MEDIC_TEST_SOURCE_ID, "hero-medic");
    const target = addCardInstance(state, "seat_a", FIEND, "fiend");
    placeInDiscard(state, "seat_a", target);
    givePlayingTurn(state, "seat_a");

    const result = playMedicFromHand(
      state,
      "seat_a",
      heroMedic,
      "close",
      catalogCardsWithHeroMedicFixture,
    );

    expect(result.state.pendingPrompt).not.toBeNull();
    expect(result.state.pendingPrompt?.kind).toBe("medic_revive");
    expect(result.state.pendingPrompt?.options.map((option) => option.target.cardId)).toEqual([
      target,
    ]);
    // No random selection happened, so RNG state is unchanged.
    expect(result.state.rng.state).toBe(state.rng.state);
  });

  it("cCp22 restore_discard_to_hand prompt still returns cards to hand only and does not trigger Medic", () => {
    const state = createState("regress-restore");
    setLeader(state, "seat_a", "monsters.eredin-bringer-of-death");
    state.seats.seat_a.faction = "monsters";
    const target = addCardInstance(state, "seat_a", DUN_BANNER_MEDIC, "dun-banner-restore");
    placeInDiscard(state, "seat_a", target);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const prompt = opened.state.pendingPrompt!;
    const optionId = prompt.options[0].optionId;

    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt.promptId,
      optionId,
    });

    expect(resolved.state.seats.seat_a.discard).not.toContain(target);
    expect(resolved.state.seats.seat_a.hand).toContain(target);
    // Restored Medic does not auto-trigger Medic.
    expect(
      resolved.events.some(
        (event) => event.type === "ability_triggered" && event.abilityId === "medic",
      ),
    ).toBe(false);
  });

  it("cCp24 draw_opponent_discard prompt still returns cards to hand only and does not trigger Medic", () => {
    const state = createState("regress-draw-opp");
    setLeader(state, "seat_a", RELENTLESS);
    const target = addCardInstance(state, "seat_b", DUN_BANNER_MEDIC, "dun-banner-draw-opp");
    placeInDiscard(state, "seat_b", target);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const prompt = opened.state.pendingPrompt!;
    const optionId = prompt.options[0].optionId;

    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt.promptId,
      optionId,
    });

    expect(resolved.state.seats.seat_b.discard).not.toContain(target);
    expect(resolved.state.seats.seat_a.hand).toContain(target);
    expect(
      resolved.events.some(
        (event) => event.type === "ability_triggered" && event.abilityId === "medic",
      ),
    ).toBe(false);
  });
});
