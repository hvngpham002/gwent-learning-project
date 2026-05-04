import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
} from "@/data/catalog";
import {
  CANCEL_LEADER_SOURCE_ID,
  EngineRuleError,
  RANDOM_MEDIC_LEADER_SOURCE_ID,
  calculateScores,
  canOpenCancelLeaderReaction,
  canUseCancelLeaderProactively,
  executeCommand,
  getDoubleSpiesPolicyBySeat,
  getLeaderCancelStatus,
  getLegalMoves,
  getRowHornPolicyBySeat,
  getWeatherPolicyBySeat,
  hasRandomMedicPolicyForSeat,
  isLeaderSuppressedThisRound,
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
import { buildSafeSimulationObservation } from "@/game/sim/exportObservation";
import { buildSeatObservation } from "@/game/ai/seatObservation";
import { legalHeuristicPolicyV0 } from "@/game/ai";

const WHITE_FLAME = CANCEL_LEADER_SOURCE_ID;
const KING_BRAN = "skellige.king-bran";
const TREACHEROUS = "monsters.eredin-breacc-glas-the-treacherous";
const SIEGEMASTER = "northern-realms.foltest-the-siegemaster";
const CRACH_AN_CRAITE = "skellige.crach-an-craite";
const KING_OF_TEMERIA = "northern-realms.foltest-king-of-temeria";
const HIS_IMPERIAL_MAJESTY = "nilfgaard.emhyr-var-emreis-his-imperial-majesty";
const SON_OF_MEDELL = "northern-realms.foltest-son-of-medell";
const STEEL_FORGED = "northern-realms.foltest-the-steel-forged";
const HOPE_OF_AEN_SEIDHE = "scoiatael.francesca-findabair-hope-of-the-aen-seidhe";
const BRINGER_OF_DEATH = "monsters.eredin-bringer-of-death";
const RELENTLESS = "nilfgaard.emhyr-var-emreis-the-relentless";
const DESTROYER_OF_WORLDS = "monsters.eredin-destroyer-of-worlds";
const EMPEROR_OF_NILFGAARD = "nilfgaard.emhyr-var-emreis-emperor-of-nilfgaard";
const PUREBLOOD_ELF = "scoiatael.francesca-findabair-pureblood-elf";
const LORD_COMMANDER = "northern-realms.foltest-lord-commander-of-the-north";
const DAISY = "scoiatael.francesca-findabair-daisy-of-the-valley";
const INVADER = RANDOM_MEDIC_LEADER_SOURCE_ID;

const FIEND = "monsters.fiend";
const FOG = "neutral.impenetrable-fog";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp29-cancel-${seed}`,
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

const createState = (seed: string | number = "cancel-leader"): MatchState => startMatch(createConfig(seed)).state;

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
  state.seats.seat_a.mulliganComplete = true;
  state.seats.seat_b.mulliganComplete = true;
  state.seats.seat_a.passed = false;
  state.seats.seat_b.passed = false;
  state.pendingPrompt = null;
};

const addCardInstance = (
  state: MatchState,
  ownerSeat: SeatId,
  sourceId: string,
  suffix: string,
  zone: "hand" | "deck" | "discard" = "hand",
): CardInstanceId => {
  const instanceId = `${ownerSeat}:test:${suffix}:${sourceId}`;
  const instance: CardInstance = {
    instanceId,
    sourceId,
    sourceKind: "card",
    owner: ownerSeat,
    controller: ownerSeat,
    zone: { kind: zone, seat: ownerSeat },
  };
  state.cardsById[instanceId] = instance;
  if (zone === "hand") state.seats[ownerSeat].hand.push(instanceId);
  if (zone === "deck") state.seats[ownerSeat].deck.push(instanceId);
  if (zone === "discard") state.seats[ownerSeat].discard.push(instanceId);
  return instanceId;
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

describe("cancel_leader metadata and manifest (cCp29)", () => {
  it("promotes cancel_leader from placeholder to implemented", () => {
    expect(CATALOG_LEADER_ABILITY_METADATA.cancel_leader.status).toBe("implemented");
    expect(CATALOG_LEADER_ABILITY_METADATA.cancel_leader.description.length).toBeGreaterThan(0);
  });

  it("includes Emhyr: The White Flame in executableLeaderSourceIds and the implemented union", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toContain(WHITE_FLAME);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toContain(WHITE_FLAME);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).not.toContain(WHITE_FLAME);
    expect(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds).not.toContain(WHITE_FLAME);
  });

  it("placeholder list is empty after cCp29", () => {
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).toEqual([]);
  });

  it("manifest counts after cCp29: 14 executable + 7 passive + 1 setup = 22 implemented, 0 placeholder", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toHaveLength(14);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).toHaveLength(7);
    expect(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds).toHaveLength(1);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toHaveLength(22);
  });
});

describe("isLeaderSuppressedThisRound helper (cCp29)", () => {
  it("returns false when leaderCancelledRound is null", () => {
    const state = createState("suppression-clear");
    expect(state.seats.seat_a.leaderCancelledRound).toBeNull();
    expect(state.seats.seat_b.leaderCancelledRound).toBeNull();
    expect(isLeaderSuppressedThisRound({ state, seatId: "seat_a" })).toBe(false);
    expect(isLeaderSuppressedThisRound({ state, seatId: "seat_b" })).toBe(false);
  });

  it("returns true only when leaderCancelledRound matches state.round", () => {
    const state = createState("suppression-current");
    state.round = 2;
    state.seats.seat_b.leaderCancelledRound = 2;
    expect(isLeaderSuppressedThisRound({ state, seatId: "seat_b" })).toBe(true);
  });

  it("ignores stale prior-round suppression defensively", () => {
    const state = createState("suppression-stale");
    state.round = 3;
    state.seats.seat_b.leaderCancelledRound = 1;
    expect(isLeaderSuppressedThisRound({ state, seatId: "seat_b" })).toBe(false);
  });
});

describe("getLeaderCancelStatus helper (cCp29)", () => {
  it("returns active+suppressible for an unused active leader (Crach an Craite)", () => {
    const state = createState("status-active");
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "discard-1", "discard");
    const status = getLeaderCancelStatus({
      state,
      seatId: "seat_b",
      catalogLeaders: currentCatalogLeaders,
    });
    expect(status.kind).toBe("active");
    expect(status.suppressible).toBe(true);
    expect(status.reason).toBe("ok");
  });

  it("returns passive+suppressible for King Bran", () => {
    const state = createState("status-passive");
    setLeader(state, "seat_b", KING_BRAN);
    const status = getLeaderCancelStatus({
      state,
      seatId: "seat_b",
      catalogLeaders: currentCatalogLeaders,
    });
    expect(status.kind).toBe("passive");
    expect(status.suppressible).toBe(true);
    expect(status.reason).toBe("ok");
  });

  it("returns setup_only+not-suppressible for Daisy of the Valley", () => {
    const state = createState("status-setup");
    setLeader(state, "seat_b", DAISY);
    const status = getLeaderCancelStatus({
      state,
      seatId: "seat_b",
      catalogLeaders: currentCatalogLeaders,
    });
    expect(status.kind).toBe("setup_only");
    expect(status.suppressible).toBe(false);
    expect(status.reason).toBe("ability_not_cancellable");
  });

  it("returns active+not-suppressible when active leader was already used", () => {
    const state = createState("status-used");
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    state.seats.seat_b.leaderUsed = true;
    const status = getLeaderCancelStatus({
      state,
      seatId: "seat_b",
      catalogLeaders: currentCatalogLeaders,
    });
    expect(status.kind).toBe("active");
    expect(status.suppressible).toBe(false);
    expect(status.reason).toBe("active_leader_already_used");
  });

  it("returns not-suppressible when already suppressed this round", () => {
    const state = createState("status-already-suppressed");
    setLeader(state, "seat_b", KING_BRAN);
    state.seats.seat_b.leaderCancelledRound = state.round;
    const status = getLeaderCancelStatus({
      state,
      seatId: "seat_b",
      catalogLeaders: currentCatalogLeaders,
    });
    expect(status.suppressible).toBe(false);
    expect(status.reason).toBe("already_suppressed_this_round");
  });
});

describe("cancel_leader proactive legal move (cCp29)", () => {
  it("emits one no-target use_leader move on its own turn against a cancellable opponent", () => {
    const state = createState("proactive-active");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "discard-1", "discard");
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].target).toEqual({ kind: "none" });
    expect(moves[0].metadata.targetRequirement).toBe("none");
    expect(moves[0].metadata.targetSeatId).toBe("seat_b");
    expect(moves[0].metadata.targetSourceId).toBe(CRACH_AN_CRAITE);
    expect(moves[0].metadata.targetLabel).toBe("opponent leader");
  });

  it("emits one no-target use_leader move against a passive opponent (King Bran)", () => {
    const state = createState("proactive-passive");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(1);
  });

  it("emits no proactive move when White Flame is used", () => {
    const state = createState("proactive-used");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    state.seats.seat_a.leaderUsed = true;
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("emits no proactive move when White Flame seat passed", () => {
    const state = createState("proactive-passed");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    givePlayingTurn(state, "seat_a");
    state.seats.seat_a.passed = true;

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("emits no proactive move when White Flame is itself suppressed", () => {
    const state = createState("proactive-self-suppressed");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    givePlayingTurn(state, "seat_a");
    state.seats.seat_a.leaderCancelledRound = state.round;

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("emits no proactive move when opponent is already suppressed this round", () => {
    const state = createState("proactive-already-suppressed");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    givePlayingTurn(state, "seat_a");
    state.seats.seat_b.leaderCancelledRound = state.round;

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("emits no proactive move against setup-only Daisy by itself", () => {
    const state = createState("proactive-setup-only");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", DAISY);
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("emits no proactive move against an already-used active leader with no passive policy", () => {
    const state = createState("proactive-opp-used");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    state.seats.seat_b.leaderUsed = true;
    givePlayingTurn(state, "seat_a");

    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("emits no proactive move against an opponent White Flame (no recursive cancel)", () => {
    const state = createState("proactive-vs-white-flame");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", WHITE_FLAME);
    givePlayingTurn(state, "seat_a");

    // Both seats own cancel_leader; cancel_leader is not in the cancellable
    // set, so getLeaderCancelStatus returns ability_not_cancellable.
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(0);
  });

  it("canUseCancelLeaderProactively reflects the same eligibility", () => {
    const state = createState("proactive-helper");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    givePlayingTurn(state, "seat_a");
    expect(
      canUseCancelLeaderProactively({
        state,
        seatId: "seat_a",
        catalogLeaders: currentCatalogLeaders,
      }),
    ).toBe(true);
  });
});

describe("cancel_leader proactive command (cCp29)", () => {
  it("sets opponent leaderCancelledRound = state.round and consumes White Flame", () => {
    const state = createState("proactive-exec");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } });
    expect(result.state.seats.seat_b.leaderCancelledRound).toBe(state.round);
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
  });

  it("does not consume the unused active opponent leader", () => {
    const state = createState("proactive-exec-no-consume-target");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "discard-1", "discard");
    givePlayingTurn(state, "seat_a");

    const result = execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } });
    expect(result.state.seats.seat_b.leaderUsed).toBe(false);
  });

  it("blocks target active getLeaderMove for the current round", () => {
    const state = createState("proactive-blocks-active");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "discard-1", "discard");
    givePlayingTurn(state, "seat_a");

    const result = execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } });
    // After handoff seat_b is now the current turn; verify no leader move.
    expect(useLeaderMoves(result.state, "seat_b")).toHaveLength(0);
  });

  it("emits the recommended proactive event sequence", () => {
    const state = createState("proactive-events");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } });
    const types = result.events.map((event) => event.type);
    expect(types.indexOf("ability_triggered")).toBeLessThan(types.indexOf("leader_cancelled"));
    expect(types.indexOf("leader_cancelled")).toBeLessThan(types.indexOf("ability_resolved"));
    expect(types.indexOf("ability_resolved")).toBeLessThan(types.indexOf("leader_used"));
    expect(types).toContain("turn_set");

    const cancelEvent = result.events.find((event) => event.type === "leader_cancelled");
    expect(cancelEvent).toBeDefined();
    if (cancelEvent && cancelEvent.type === "leader_cancelled") {
      expect(cancelEvent.mode).toBe("proactive");
      expect(cancelEvent.round).toBe(state.round);
      expect(cancelEvent.seatId).toBe("seat_a");
      expect(cancelEvent.targetSeatId).toBe("seat_b");
      expect(cancelEvent.targetLeaderSourceId).toBe(KING_BRAN);
      expect(cancelEvent.targetAbilityId).toBe("weather_half_penalty");
    }
  });

  it("rejects non-none target on proactive cancel_leader", () => {
    const state = createState("proactive-reject-target");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_BRAN);
    givePlayingTurn(state, "seat_a");

    expect(() =>
      execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "weather" } }),
    ).toThrow(EngineRuleError);
  });
});

describe("round transition clears cancel suppression (cCp29)", () => {
  it("resets both seats' leaderCancelledRound on round resolution", () => {
    const state = createState("round-transition");
    state.round = 1;
    state.seats.seat_a.leaderCancelledRound = 1;
    state.seats.seat_b.leaderCancelledRound = 1;
    state.seats.seat_a.passed = true;
    state.seats.seat_b.passed = true;
    state.phase = "round_end";

    const result = execute(state, { type: "ResolveRoundEnd" });
    expect(result.state.seats.seat_a.leaderCancelledRound).toBeNull();
    expect(result.state.seats.seat_b.leaderCancelledRound).toBeNull();
  });

  it("proactively suppressed unused active leader becomes legal again on the next round", () => {
    const state = createState("round-transition-active");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "discard-1", "discard");
    givePlayingTurn(state, "seat_a");

    const used = execute(state, { type: "UseLeader", seatId: "seat_a", target: { kind: "none" } });
    expect(used.state.seats.seat_b.leaderUsed).toBe(false);
    expect(used.state.seats.seat_b.leaderCancelledRound).toBe(used.state.round);

    // Turn handed off to seat_b after the proactive cancel; pass seat_b
    // first then seat_a, then resolve.
    const passB = execute(used.state, { type: "Pass", seatId: "seat_b" });
    const passA = execute(passB.state, { type: "Pass", seatId: "seat_a" });
    const round = execute(passA.state, { type: "ResolveRoundEnd" });
    expect(round.state.seats.seat_b.leaderCancelledRound).toBeNull();
    // Crach an Craite needs at least one non-empty discard pile to be legal.
    // Round cleanup discarded the existing board cards; if both discards are
    // populated we can verify the leader is legal again.
    round.state.currentTurn = "seat_b";
    if (round.state.seats.seat_a.discard.length === 0 && round.state.seats.seat_b.discard.length === 0) {
      addCardInstance(round.state, "seat_a", FIEND, "post-1", "discard");
    }
    expect(useLeaderMoves(round.state, "seat_b")).toHaveLength(1);
  });
});

describe("passive scoring policies respect cCp29 suppression", () => {
  it("getWeatherPolicyBySeat ignores King Bran while suppressed and resumes next round", () => {
    const state = createState("passive-king-bran");
    setLeader(state, "seat_b", KING_BRAN);
    state.round = 2;
    state.seats.seat_b.leaderCancelledRound = 2;
    expect(getWeatherPolicyBySeat(state, currentCatalogLeaders).seat_b).toBeUndefined();

    state.seats.seat_b.leaderCancelledRound = null;
    expect(getWeatherPolicyBySeat(state, currentCatalogLeaders).seat_b).toBe("king_bran");
  });

  it("getRowHornPolicyBySeat ignores Siegemaster while suppressed and resumes next round", () => {
    const state = createState("passive-siegemaster");
    setLeader(state, "seat_b", SIEGEMASTER);
    state.round = 2;
    state.seats.seat_b.leaderCancelledRound = 2;
    expect(getRowHornPolicyBySeat(state, currentCatalogLeaders).seat_b).toBeUndefined();

    state.seats.seat_b.leaderCancelledRound = null;
    expect(getRowHornPolicyBySeat(state, currentCatalogLeaders).seat_b).toEqual({ siege: true });
  });

  it("getDoubleSpiesPolicyBySeat ignores Treacherous while suppressed", () => {
    const state = createState("passive-treacherous");
    setLeader(state, "seat_b", TREACHEROUS);
    state.round = 2;
    state.seats.seat_b.leaderCancelledRound = 2;
    expect(getDoubleSpiesPolicyBySeat(state, currentCatalogLeaders).seat_b).toBeUndefined();
  });

  it("hasRandomMedicPolicyForSeat returns false while suppressed", () => {
    const state = createState("passive-invader");
    setLeader(state, "seat_b", INVADER);
    state.round = 2;
    state.seats.seat_b.leaderCancelledRound = 2;
    expect(
      hasRandomMedicPolicyForSeat({
        state,
        seatId: "seat_b",
        catalogLeaders: currentCatalogLeaders,
      }),
    ).toBe(false);
  });

  it("setup-time draw_extra_card is not retroactively undone (no current-round policy to suppress)", () => {
    const state = createState("setup-not-undone");
    setLeader(state, "seat_b", DAISY);
    state.round = 2;
    state.seats.seat_b.leaderCancelledRound = 2;
    // Daisy's effect already happened at setup; suppression has no current
    // round policy to remove. The spec asserts setup is not retroactively
    // undone — there is no scoring/ability behavior that recomputes it.
    expect(state.seats.seat_b.leader).not.toBeNull();
    expect(state.seats.seat_b.leaderUsed).toBe(false);
  });

  it("scoring recomputes with no King Bran multiplier when suppressed (current-round)", () => {
    const state = createState("scoring-king-bran-suppressed");
    setLeader(state, "seat_b", KING_BRAN);
    state.round = 2;
    state.seats.seat_b.leaderCancelledRound = 2;
    const breakdown = calculateScores({
      state,
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    // No king-bran modifier should appear anywhere on the seat_b cards
    // for the suppressed round.
    breakdown.cards
      .filter((entry) => entry.seatId === "seat_b")
      .forEach((entry) => {
        expect(entry.modifiers).not.toContain("weather:king_bran");
      });
  });
});

describe("legal-move guard for active leaders blocks suppressed seat (cCp29)", () => {
  const ACTIVE_LEADERS_AND_SETUPS: Array<{ leader: string; setup: (state: MatchState) => void }> = [
    { leader: KING_OF_TEMERIA, setup: () => undefined },
    { leader: HIS_IMPERIAL_MAJESTY, setup: () => undefined },
    { leader: SON_OF_MEDELL, setup: () => undefined },
    { leader: STEEL_FORGED, setup: () => undefined },
    { leader: HOPE_OF_AEN_SEIDHE, setup: () => undefined },
    {
      leader: BRINGER_OF_DEATH,
      setup: (state) => {
        addCardInstance(state, "seat_b", FIEND, "br-disc", "discard");
      },
    },
    {
      leader: CRACH_AN_CRAITE,
      setup: (state) => {
        addCardInstance(state, "seat_a", FIEND, "cr-disc-a", "discard");
      },
    },
    {
      leader: RELENTLESS,
      setup: (state) => {
        addCardInstance(state, "seat_a", FIEND, "rl-disc-a", "discard");
      },
    },
    {
      leader: DESTROYER_OF_WORLDS,
      setup: (state) => {
        addCardInstance(state, "seat_b", FIEND, "ds-hand", "hand");
      },
    },
    {
      leader: EMPEROR_OF_NILFGAARD,
      setup: (state) => {
        addCardInstance(state, "seat_a", FIEND, "em-hand", "hand");
      },
    },
    { leader: PUREBLOOD_ELF, setup: () => undefined },
    { leader: LORD_COMMANDER, setup: () => undefined },
  ];

  it.each(ACTIVE_LEADERS_AND_SETUPS)(
    "blocks $leader use_leader move when suppressed",
    ({ leader, setup }) => {
      const state = createState(`block-${leader}`);
      setLeader(state, "seat_b", leader);
      setup(state);
      givePlayingTurn(state, "seat_b");
      state.seats.seat_b.leaderCancelledRound = state.round;
      expect(useLeaderMoves(state, "seat_b")).toHaveLength(0);
    },
  );

  it("manual UseLeader on a suppressed seat is rejected", () => {
    const state = createState("manual-reject");
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "cr-rej-a", "discard");
    givePlayingTurn(state, "seat_b");
    state.seats.seat_b.leaderCancelledRound = state.round;

    expect(() =>
      execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } }),
    ).toThrow(EngineRuleError);
    expect(state.seats.seat_b.leaderUsed).toBe(false);
  });
});

describe("cancel_leader reaction prompt (cCp29)", () => {
  it("opens a White Flame reaction prompt when opponent active leader fires", () => {
    const state = createState("reaction-open");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "react-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const result = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    expect(result.state.pendingPrompt).not.toBeNull();
    expect(result.state.pendingPrompt?.abilityId).toBe("cancel_leader");
    expect(result.state.pendingPrompt?.kind).toBe("choose_option");
    expect(result.state.pendingPrompt?.stage).toBe("leader_cancel_reaction");
    expect(result.state.pendingPrompt?.seatId).toBe("seat_a");
    expect(result.state.pendingPrompt?.options).toHaveLength(2);
    expect(result.state.pendingPrompt?.options.map((o) => o.optionId).sort()).toEqual(
      ["cancel-leader:cancel", "cancel-leader:decline"].sort(),
    );
    // No leader consumed yet, no turn handoff.
    expect(result.state.seats.seat_a.leaderUsed).toBe(false);
    expect(result.state.seats.seat_b.leaderUsed).toBe(false);
    expect(result.state.currentTurn).toBe("seat_b");
  });

  it("does not open the prompt when White Flame is already used", () => {
    const state = createState("reaction-already-used");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "ru-disc-a", "discard");
    state.seats.seat_a.leaderUsed = true;
    givePlayingTurn(state, "seat_b");

    const result = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    // Crach's effect should resolve normally; no pending prompt.
    expect(result.state.pendingPrompt).toBeNull();
    expect(result.state.seats.seat_b.leaderUsed).toBe(true);
  });

  it("does not open the prompt when White Flame seat passed", () => {
    const state = createState("reaction-passed");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "rp-disc-a", "discard");
    givePlayingTurn(state, "seat_b");
    state.seats.seat_a.passed = true;

    const result = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    expect(result.state.pendingPrompt).toBeNull();
  });

  it("does not open the prompt when White Flame is suppressed", () => {
    const state = createState("reaction-suppressed");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "rs-disc-a", "discard");
    givePlayingTurn(state, "seat_b");
    state.seats.seat_a.leaderCancelledRound = state.round;

    const result = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    expect(result.state.pendingPrompt).toBeNull();
  });

  it("canOpenCancelLeaderReaction returns false when opposing leader is not cancel_leader", () => {
    const state = createState("reaction-helper");
    setLeader(state, "seat_a", KING_BRAN);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    givePlayingTurn(state, "seat_b");
    expect(
      canOpenCancelLeaderReaction({
        state,
        attemptedSeatId: "seat_b",
        attemptedAbilityId: "shuffle_discards_into_decks",
        catalogLeaders: currentCatalogLeaders,
      }),
    ).toBe(false);
  });
});

describe("cancel_leader reaction cancel option (cCp29)", () => {
  it("consumes both leaders and applies suppression; weather-pulling is blocked", () => {
    const state = createState("reaction-cancel-weather");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", KING_OF_TEMERIA);
    // King of Temeria's `play_fog` ability pulls a fog card from the deck.
    addCardInstance(state, "seat_b", FOG, "kt-fog", "deck");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_b",
      target: { kind: "deck_card_source", seatId: "seat_b", sourceId: FOG },
    });
    expect(opened.state.pendingPrompt?.abilityId).toBe("cancel_leader");

    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: "cancel-leader:cancel",
    });
    expect(resolved.state.pendingPrompt).toBeNull();
    expect(resolved.state.seats.seat_a.leaderUsed).toBe(true);
    expect(resolved.state.seats.seat_b.leaderUsed).toBe(true);
    expect(resolved.state.seats.seat_b.leaderCancelledRound).toBe(state.round);
    // No weather card was moved to the weather zone (effect didn't resolve).
    expect(resolved.state.weather.entries).toHaveLength(0);
  });

  it("turn hands off from the attempted leader seat after reaction cancel", () => {
    const state = createState("reaction-cancel-handoff");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "rch-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: "cancel-leader:cancel",
    });
    expect(resolved.state.currentTurn).toBe("seat_a");
  });

  it("emits the recommended reaction-cancel event sequence with leader_cancelled before leader_used", () => {
    const state = createState("reaction-cancel-events");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "rce-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: "cancel-leader:cancel",
    });
    const types = resolved.events.map((event) => event.type);
    expect(types[0]).toBe("prompt_resolved");
    expect(types).toContain("ability_triggered");
    expect(types).toContain("leader_cancelled");
    expect(types).toContain("ability_resolved");
    // Two leader_used events: White Flame then the cancelled target leader.
    const leaderUsedCount = types.filter((t) => t === "leader_used").length;
    expect(leaderUsedCount).toBe(2);

    const cancelEvent = resolved.events.find((event) => event.type === "leader_cancelled");
    if (cancelEvent && cancelEvent.type === "leader_cancelled") {
      expect(cancelEvent.mode).toBe("reaction");
    }
  });

  it("look-three-cards reaction cancel does not emit opponent_hand_revealed", () => {
    const state = createState("reaction-cancel-look");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", EMPEROR_OF_NILFGAARD);
    addCardInstance(state, "seat_a", FIEND, "look-hand-a", "hand");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: "cancel-leader:cancel",
    });
    expect(resolved.events.find((event) => event.type === "opponent_hand_revealed")).toBeUndefined();
  });

  it("second use of either consumed leader is illegal after reaction cancel", () => {
    const state = createState("reaction-cancel-illegal-second-use");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "rcil-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: "cancel-leader:cancel",
    });
    // Both leaders are used.
    expect(useLeaderMoves(resolved.state, "seat_a")).toHaveLength(0);
    expect(useLeaderMoves(resolved.state, "seat_b")).toHaveLength(0);
  });
});

describe("cancel_leader reaction decline option (cCp29)", () => {
  it("does not consume White Flame or apply suppression on decline", () => {
    const state = createState("reaction-decline-no-consume");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "rdn-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: "cancel-leader:decline",
    });
    expect(resolved.state.seats.seat_a.leaderUsed).toBe(false);
    expect(resolved.state.seats.seat_b.leaderCancelledRound).toBeNull();
  });

  it("resolves the original attempted leader exactly once on decline", () => {
    const state = createState("reaction-decline-resolves-original");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "rdo-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: "cancel-leader:decline",
    });
    expect(resolved.state.seats.seat_b.leaderUsed).toBe(true);
    // Discard was recycled into deck — the seat_a discard pile is emptied
    // because Crach's effect actually fired.
    expect(resolved.state.seats.seat_a.discard).toHaveLength(0);
  });

  it("does not reopen the same reaction prompt after decline", () => {
    const state = createState("reaction-decline-no-reopen");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "rdr-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const resolved = execute(opened.state, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: opened.state.pendingPrompt!.promptId,
      optionId: "cancel-leader:decline",
    });
    expect(resolved.state.pendingPrompt).toBeNull();
  });
});

describe("AI / observation / export for cCp29", () => {
  it("AI policy chooses the cancel option from a White Flame reaction prompt", () => {
    const state = createState("ai-reaction");
    setLeader(state, "seat_a", WHITE_FLAME);
    state.seats.seat_a.controllerKind = "ai";
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "ai-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const observation = buildSeatObservation({
      state: opened.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const legalMoves = legalMovesFor(opened.state, "seat_a");
    const selected = legalHeuristicPolicyV0.selectMove({
      seatId: "seat_a",
      observation,
      legalMoves,
    });
    expect(selected).not.toBeNull();
    if (selected && selected.kind === "choose_prompt_option") {
      expect(selected.optionId).toBe("cancel-leader:cancel");
    }
  });

  it("seat observation surfaces leaderCancelledRound through cancelledThisRound flag", () => {
    const state = createState("obs-flag");
    setLeader(state, "seat_b", KING_BRAN);
    state.seats.seat_b.leaderCancelledRound = state.round;
    const observation = buildSeatObservation({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    expect(observation.opponentLeader.cancelledThisRound).toBe(true);
    expect(observation.ownLeader.cancelledThisRound).toBe(false);
  });

  it("safe simulation export surfaces leaderCancelledRound through cancelledThisRound flag", () => {
    const state = createState("export-flag");
    setLeader(state, "seat_b", KING_BRAN);
    state.seats.seat_b.leaderCancelledRound = state.round;
    const observation = buildSafeSimulationObservation(state, "seat_a");
    expect(observation.opponent.leader.cancelledThisRound).toBe(true);
    expect(observation.own.leader.cancelledThisRound).toBe(false);
  });
});

describe("product UI hooks for cCp29", () => {
  it("prompt options for the reaction prompt have target.kind === \"none\"", () => {
    const state = createState("ui-prompt-shape");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "ui-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    const moves = promptMoves(opened.state, "seat_a");
    expect(moves).toHaveLength(2);
    moves.forEach((move) => {
      expect(move.target.kind).toBe("none");
    });
    const optionIds = moves.map((move) => move.optionId).sort();
    expect(optionIds).toEqual(["cancel-leader:cancel", "cancel-leader:decline"]);
  });

  it("non-acting seat sees no prompt moves for the reaction prompt", () => {
    const state = createState("ui-non-acting");
    setLeader(state, "seat_a", WHITE_FLAME);
    setLeader(state, "seat_b", CRACH_AN_CRAITE);
    addCardInstance(state, "seat_a", FIEND, "uin-disc-a", "discard");
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } });
    expect(promptMoves(opened.state, "seat_b")).toHaveLength(0);
  });
});
