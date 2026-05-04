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
  getLookThreeCardsEligibility,
  LOOK_THREE_CARDS_LEADER_SOURCE_ID,
  LOOK_THREE_CARDS_REVEAL_COUNT,
  planLookThreeCardsReveal,
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
import { buildSeatObservation } from "@/game/ai/seatObservation";
import { buildSafeSimulationObservation } from "@/game/sim/exportObservation";

const EMPEROR = LOOK_THREE_CARDS_LEADER_SOURCE_ID;
const RELENTLESS = "nilfgaard.emhyr-var-emreis-the-relentless";

const FIEND = "monsters.fiend";
const GERALT = "neutral.geralt-of-rivia";
const SCORCH_SPECIAL = "neutral.scorch";
const FROST = "neutral.biting-frost";
const YENNEFER = "neutral.yennefer-of-vengerberg";

const createConfig = (seed: string | number): MatchConfig => ({
  matchId: `cCp28-look-three-${seed}`,
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

const createState = (seed: string | number = "look-three"): MatchState => startMatch(createConfig(seed)).state;

const execute = (state: MatchState, command: Exclude<EngineCommand, { type: "StartMatch" }>) =>
  executeCommand({
    state,
    command,
    catalogCards: currentCatalogCards,
    catalogLeaders: currentCatalogLeaders,
  });

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

const clearOpponentHand = (state: MatchState, opponentSeat: SeatId) => {
  state.seats[opponentSeat].hand.forEach((cardId) => {
    delete state.cardsById[cardId];
  });
  state.seats[opponentSeat].hand = [];
};

const setOpponentHand = (
  state: MatchState,
  opponentSeat: SeatId,
  sourceIds: readonly string[],
): CardInstanceId[] => {
  clearOpponentHand(state, opponentSeat);
  return sourceIds.map((sourceId, index) =>
    addCardInstance(state, opponentSeat, sourceId, `opp-${index}`),
  );
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

describe("look_three_cards metadata and manifest (cCp28)", () => {
  it("promotes look_three_cards to implemented", () => {
    expect(CATALOG_LEADER_ABILITY_METADATA.look_three_cards.status).toBe("implemented");
    expect(CATALOG_LEADER_ABILITY_METADATA.look_three_cards.description.length).toBeGreaterThan(0);
  });

  it("includes Emperor of Nilfgaard in executableLeaderSourceIds and not in placeholder/passive/setup sets", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toContain(EMPEROR);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toContain(EMPEROR);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).not.toContain(EMPEROR);
    expect(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds).not.toContain(EMPEROR);
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).not.toContain(
      "look_three_cards",
    );
  });

  it("manifest counts: 13 executable, 7 passive, 1 setup, 21 implemented union, 1 placeholder", () => {
    expect(officialLeaderPromotionManifest.executableLeaderSourceIds).toHaveLength(13);
    expect(officialLeaderPromotionManifest.implementedPassiveLeaderSourceIds).toHaveLength(7);
    expect(officialLeaderPromotionManifest.implementedSetupLeaderSourceIds).toHaveLength(1);
    expect(officialLeaderPromotionManifest.implementedLeaderSourceIds).toHaveLength(21);
    expect(officialLeaderPromotionManifest.placeholderLeaderAbilityIds).toEqual(["cancel_leader"]);
  });

  it("LOOK_THREE_CARDS_REVEAL_COUNT is 3", () => {
    expect(LOOK_THREE_CARDS_REVEAL_COUNT).toBe(3);
  });
});

describe("getLookThreeCardsEligibility helper (cCp28)", () => {
  it("returns canUse=false and revealCount=0 when opponent hand is empty", () => {
    const state = createState("eligibility-empty");
    setLeader(state, "seat_a", EMPEROR);
    clearOpponentHand(state, "seat_b");
    givePlayingTurn(state, "seat_a");

    expect(getLookThreeCardsEligibility({ state, seatId: "seat_a" })).toEqual({
      canUse: false,
      opponentHandCount: 0,
      revealCount: 0,
    });
  });

  it("returns canUse=true and revealCount = min(3, hand) for hand sizes 1,2,3", () => {
    const state = createState("eligibility-small");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");
    expect(getLookThreeCardsEligibility({ state, seatId: "seat_a" }).revealCount).toBe(1);

    setOpponentHand(state, "seat_b", [FIEND, GERALT]);
    expect(getLookThreeCardsEligibility({ state, seatId: "seat_a" }).revealCount).toBe(2);

    setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL]);
    expect(getLookThreeCardsEligibility({ state, seatId: "seat_a" }).revealCount).toBe(3);

    setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL, FROST, YENNEFER]);
    expect(getLookThreeCardsEligibility({ state, seatId: "seat_a" }).revealCount).toBe(3);
    expect(getLookThreeCardsEligibility({ state, seatId: "seat_a" }).opponentHandCount).toBe(5);
  });
});

describe("planLookThreeCardsReveal helper (cCp28)", () => {
  it("returns no_opponent_hand outcome when opponent hand is empty", () => {
    const state = createState("plan-empty");
    setLeader(state, "seat_a", EMPEROR);
    clearOpponentHand(state, "seat_b");
    givePlayingTurn(state, "seat_a");

    const plan = planLookThreeCardsReveal({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(plan.outcome).toBe("no_opponent_hand");
    expect(plan.revealedCardIds).toEqual([]);
    expect(plan.rngAdvanced).toBe(false);
    expect(plan.nextRngState).toBe(state.rng.state);
  });

  it("hand count 1: reveals the one card and does not advance RNG", () => {
    const state = createState("plan-one");
    setLeader(state, "seat_a", EMPEROR);
    const ids = setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");
    const beforeRng = state.rng.state;

    const plan = planLookThreeCardsReveal({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(plan.outcome).toBe("revealed");
    expect(plan.revealedCardIds).toEqual(ids);
    expect(plan.revealedSourceIds).toEqual([FIEND]);
    expect(plan.rngAdvanced).toBe(false);
    expect(plan.nextRngState).toBe(beforeRng);
  });

  it("hand count 2: reveals both cards in opponent hand order with no RNG advance", () => {
    const state = createState("plan-two");
    setLeader(state, "seat_a", EMPEROR);
    const ids = setOpponentHand(state, "seat_b", [FIEND, GERALT]);
    givePlayingTurn(state, "seat_a");
    const beforeRng = state.rng.state;

    const plan = planLookThreeCardsReveal({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(plan.revealedCardIds).toEqual(ids);
    expect(plan.revealedSourceIds).toEqual([FIEND, GERALT]);
    expect(plan.rngAdvanced).toBe(false);
    expect(plan.nextRngState).toBe(beforeRng);
  });

  it("hand count 3: reveals all three cards in opponent hand order with no RNG advance", () => {
    const state = createState("plan-three");
    setLeader(state, "seat_a", EMPEROR);
    const ids = setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL]);
    givePlayingTurn(state, "seat_a");
    const beforeRng = state.rng.state;

    const plan = planLookThreeCardsReveal({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(plan.revealedCardIds).toEqual(ids);
    expect(plan.revealedSourceIds).toEqual([FIEND, GERALT, SCORCH_SPECIAL]);
    expect(plan.rngAdvanced).toBe(false);
    expect(plan.nextRngState).toBe(beforeRng);
  });

  it("hand count 4+: reveals exactly three deterministic cards by seed and advances RNG", () => {
    const state = createState("plan-four");
    setLeader(state, "seat_a", EMPEROR);
    const ids = setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL, FROST, YENNEFER]);
    givePlayingTurn(state, "seat_a");
    const beforeRng = state.rng.state;

    const plan = planLookThreeCardsReveal({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(plan.revealedCardIds).toHaveLength(3);
    plan.revealedCardIds.forEach((cardId) => expect(ids).toContain(cardId));
    expect(plan.rngAdvanced).toBe(true);
    expect(plan.nextRngState).not.toBe(beforeRng);
  });

  it("preserves opponent hand order in revealed list, not shuffled order", () => {
    const state = createState("plan-order");
    setLeader(state, "seat_a", EMPEROR);
    const ids = setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL, FROST, YENNEFER]);
    givePlayingTurn(state, "seat_a");

    const plan = planLookThreeCardsReveal({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    // The revealed order must equal the opponent's natural hand order for the
    // selected subset; check that selection indexes are monotonic in hand order.
    const handIndexes = plan.revealedCardIds.map((cardId) => ids.indexOf(cardId));
    const sorted = [...handIndexes].sort((a, b) => a - b);
    expect(handIndexes).toEqual(sorted);
  });

  it("is deterministic for the same seed (4+ hand): identical reveal across calls and identical state", () => {
    const stateA = createState("plan-determinism");
    setLeader(stateA, "seat_a", EMPEROR);
    setOpponentHand(stateA, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL, FROST, YENNEFER]);
    givePlayingTurn(stateA, "seat_a");

    const stateB = createState("plan-determinism");
    setLeader(stateB, "seat_a", EMPEROR);
    setOpponentHand(stateB, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL, FROST, YENNEFER]);
    givePlayingTurn(stateB, "seat_a");

    const planA = planLookThreeCardsReveal({
      state: stateA,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    const planB = planLookThreeCardsReveal({
      state: stateB,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(planA.revealedCardIds).toEqual(planB.revealedCardIds);
    expect(planA.nextRngState).toBe(planB.nextRngState);
  });

  it("skips a missing card instance defensively", () => {
    const state = createState("plan-missing-instance");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    state.seats.seat_b.hand.push("seat_b:test:missing-instance:none");
    givePlayingTurn(state, "seat_a");

    const plan = planLookThreeCardsReveal({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(plan.revealedCardIds).toHaveLength(1);
    expect(plan.revealedSourceIds).toEqual([FIEND]);
  });

  it("skips a card with a missing catalog source from the source ID list (still in candidate list)", () => {
    const state = createState("plan-missing-source");
    setLeader(state, "seat_a", EMPEROR);
    const cardId = `seat_b:test:ghost:fake.source`;
    state.cardsById[cardId] = {
      instanceId: cardId,
      sourceId: "fake.source",
      sourceKind: "card",
      owner: "seat_b",
      controller: "seat_b",
      zone: { kind: "hand", seat: "seat_b" },
    } as CardInstance;
    state.seats.seat_b.hand = [cardId];
    givePlayingTurn(state, "seat_a");

    const plan = planLookThreeCardsReveal({
      state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
    });
    expect(plan.outcome).toBe("revealed");
    expect(plan.revealedCardIds).toEqual([cardId]);
    expect(plan.revealedSourceIds).toEqual([]);
  });
});

describe("getLeaderMove integration for look_three_cards (cCp28)", () => {
  it("emits exactly one no-target use_leader move when opponent has at least one card", () => {
    const state = createState("legal-one");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    const move = moves[0];
    expect(move.metadata.ability).toBe("look_three_cards");
    expect(move.metadata.abilityStatus).toBe("implemented");
    expect(move.metadata.targetRequirement).toBe("none");
    expect(move.target).toEqual({ kind: "none" });
    expect(move.metadata.targetLabel).toBe("opponent hand");
    expect(move.metadata.targetCount).toBe(1);
    expect(move.metadata.opponentHandCount).toBe(1);
    expect(move.metadata.revealCount).toBe(1);
  });

  it("targetCount/revealCount scale with opponent hand size (capped at 3)", () => {
    const state = createState("legal-large");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL, FROST, YENNEFER]);
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.opponentHandCount).toBe(5);
    expect(moves[0].metadata.revealCount).toBe(3);
    expect(moves[0].metadata.targetCount).toBe(3);
  });

  it("emits no use_leader move when opponent hand is empty", () => {
    const state = createState("legal-empty");
    setLeader(state, "seat_a", EMPEROR);
    clearOpponentHand(state, "seat_b");
    givePlayingTurn(state, "seat_a");
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits no use_leader move when leader is already used", () => {
    const state = createState("legal-post-use");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");
    expect(useLeaderMoves(state, "seat_a")).toHaveLength(1);
    state.seats.seat_a.leaderUsed = true;
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits no use_leader move outside playing phase", () => {
    const state = createState("legal-mulligan");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");
    state.phase = "mulligan";
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
    state.phase = "round_end";
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
    state.phase = "game_end";
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
    state.phase = "setup";
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits no use_leader move when the current turn is not the acting seat", () => {
    const state = createState("legal-wrong-turn");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");
    state.currentTurn = "seat_b";
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits no use_leader move when the acting seat has passed", () => {
    const state = createState("legal-passed");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");
    state.seats.seat_a.passed = true;
    expect(useLeaderMoves(state, "seat_a")).toEqual([]);
  });

  it("emits no use_leader move while a prompt is pending", () => {
    const state = createState("legal-prompt-pending");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    expect(opened.state.pendingPrompt).not.toBeNull();
    // Now no further use_leader move should be available — leader already used
    // and acknowledgement prompt is pending.
    expect(useLeaderMoves(opened.state, "seat_a")).toEqual([]);
  });
});

describe("UseLeader command for look_three_cards (cCp28)", () => {
  it("rejects a non-none target without state mutation or leader consumption", () => {
    const state = createState("use-leader-bad-target");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
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

  it("rejects a manual UseLeader when opponent hand is empty without consuming the leader", () => {
    const state = createState("use-leader-empty");
    setLeader(state, "seat_a", EMPEROR);
    clearOpponentHand(state, "seat_b");
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

  it("emits ability_triggered, opponent_hand_revealed, ability_resolved.revealed_opponent_hand, leader_used, prompt_opened", () => {
    const state = createState("use-leader-events");
    setLeader(state, "seat_a", EMPEROR);
    const opponentIds = setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL, FROST]);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const types = result.events.map((event) => event.type);
    expect(types).toContain("ability_triggered");
    expect(types).toContain("opponent_hand_revealed");
    expect(types).toContain("ability_resolved");
    expect(types).toContain("leader_used");
    expect(types).toContain("prompt_opened");
    const reveal = result.events.find((event) => event.type === "opponent_hand_revealed");
    expect(reveal).toBeDefined();
    if (reveal && reveal.type === "opponent_hand_revealed") {
      expect(reveal.seatId).toBe("seat_a");
      expect(reveal.opponentSeatId).toBe("seat_b");
      expect(reveal.reason).toBe("look_three_cards");
      expect(reveal.cardIds.length).toBe(3);
      reveal.cardIds.forEach((cardId) => expect(opponentIds).toContain(cardId));
    }
    const resolved = result.events.find(
      (event) => event.type === "ability_resolved" && event.abilityId === "look_three_cards",
    );
    expect(resolved && resolved.type === "ability_resolved" ? resolved.outcome : null).toBe(
      "revealed_opponent_hand",
    );
  });

  it("sets leaderUsed=true at UseLeader time", () => {
    const state = createState("use-leader-leader-used");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
  });

  it("leaves currentTurn on the acting seat because the acknowledgement prompt is pending", () => {
    const state = createState("use-leader-no-handoff");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    expect(result.state.currentTurn).toBe("seat_a");
    expect(result.state.pendingPrompt).not.toBeNull();
  });

  it("opens an acknowledgement prompt with one option, target { kind: 'none' }, and revealedCardIds in context", () => {
    const state = createState("use-leader-prompt-shape");
    setLeader(state, "seat_a", EMPEROR);
    const ids = setOpponentHand(state, "seat_b", [FIEND, GERALT]);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const prompt = result.state.pendingPrompt;
    expect(prompt?.kind).toBe("choose_option");
    expect(prompt?.abilityId).toBe("look_three_cards");
    expect(prompt?.stage).toBe("opponent_hand_reveal");
    expect(prompt?.seatId).toBe("seat_a");
    expect(prompt?.options).toHaveLength(1);
    expect(prompt?.options[0].optionId).toBe("look-three-cards:acknowledge");
    expect(prompt?.options[0].target).toEqual({ kind: "none" });
    expect(prompt?.context?.revealedCardIds).toEqual(ids);
  });

  it("repeated UseLeader while the acknowledgement prompt is pending is illegal", () => {
    const state = createState("use-leader-repeat");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    expect(() =>
      execute(opened.state, {
        type: "UseLeader",
        seatId: "seat_a",
        target: { kind: "none" },
      }),
    ).toThrow(EngineRuleError);
  });

  it("does not move the revealed cards out of opponent hand", () => {
    const state = createState("use-leader-no-move");
    setLeader(state, "seat_a", EMPEROR);
    const ids = setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL]);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    ids.forEach((cardId) => {
      expect(result.state.seats.seat_b.hand).toContain(cardId);
      expect(result.state.cardsById[cardId].zone).toEqual({ kind: "hand", seat: "seat_b" });
    });
    // No card_moved event for any of the revealed cards.
    result.events.forEach((event) => {
      if (event.type === "card_moved") {
        expect(ids).not.toContain(event.cardId);
      }
    });
  });

  it("does not trigger card abilities or card movement events", () => {
    const state = createState("use-leader-no-trigger");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [YENNEFER, SCORCH_SPECIAL, FROST]);
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    expect(result.events.some((event) => event.type === "card_played")).toBe(false);
    expect(result.events.some((event) => event.type === "scorch_resolved")).toBe(false);
    expect(result.events.some((event) => event.type === "card_moved")).toBe(false);
    expect(result.state.weather.entries).toEqual([]);
  });

  it("revealing off-owner cards in opponent hand preserves owner and zone", () => {
    const state = createState("use-leader-off-owner");
    setLeader(state, "seat_a", EMPEROR);
    // Synthetic off-owner: a card owned by seat_a that physically sits in
    // seat_b's hand.
    const offOwnerId = "seat_a:test:off-owner:fiend";
    state.cardsById[offOwnerId] = {
      instanceId: offOwnerId,
      sourceId: FIEND,
      sourceKind: "card",
      owner: "seat_a",
      controller: "seat_a",
      zone: { kind: "hand", seat: "seat_b" },
    } as CardInstance;
    state.seats.seat_b.hand = [offOwnerId];
    givePlayingTurn(state, "seat_a");

    const result = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    expect(result.state.cardsById[offOwnerId].owner).toBe("seat_a");
    expect(result.state.cardsById[offOwnerId].controller).toBe("seat_a");
    expect(result.state.cardsById[offOwnerId].zone).toEqual({ kind: "hand", seat: "seat_b" });
    expect(result.state.seats.seat_b.hand).toContain(offOwnerId);
  });
});

describe("ChoosePromptOption acknowledgement for look_three_cards (cCp28)", () => {
  const setupAck = (seed: string, opponentSources: readonly string[]) => {
    const state = createState(seed);
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", opponentSources);
    givePlayingTurn(state, "seat_a");
    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    return { state: opened.state, prompt: opened.state.pendingPrompt };
  };

  it("clears the prompt and hands off the turn", () => {
    const { state: openedState, prompt } = setupAck("ack-success", [FIEND]);
    expect(prompt).not.toBeNull();
    const result = execute(openedState, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt!.promptId,
      optionId: "look-three-cards:acknowledge",
    });
    expect(result.state.pendingPrompt).toBeNull();
    expect(result.state.currentTurn).toBe("seat_b");
    expect(result.events.some((event) => event.type === "prompt_resolved")).toBe(true);
    expect(result.events.some((event) => event.type === "turn_set")).toBe(true);
  });

  it("does not retain a reopenable reveal snapshot in MatchState after acknowledgement", () => {
    const { state: openedState, prompt } = setupAck("ack-no-snapshot", [FIEND, GERALT, SCORCH_SPECIAL]);
    const result = execute(openedState, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt!.promptId,
      optionId: "look-three-cards:acknowledge",
    });
    expect(result.state.pendingPrompt).toBeNull();
    // No SeatState/MatchState field carries the reveal after acknowledgement.
    const seatKeys = Object.keys(result.state.seats.seat_a);
    expect(seatKeys).not.toContain("revealedOpponentHand");
    expect(seatKeys).not.toContain("revealedCards");
    const matchKeys = Object.keys(result.state);
    matchKeys.forEach((key) => expect(key.toLowerCase()).not.toContain("revealedopponenthand"));
  });

  it("does not allow a second UseLeader after acknowledgement (leader is used)", () => {
    const { state: openedState, prompt } = setupAck("ack-second-use", [FIEND]);
    const result = execute(openedState, {
      type: "ChoosePromptOption",
      seatId: "seat_a",
      promptId: prompt!.promptId,
      optionId: "look-three-cards:acknowledge",
    });
    expect(result.state.seats.seat_a.leaderUsed).toBe(true);
    // Second UseLeader is illegal because leader is used.
    expect(useLeaderMoves(result.state, "seat_a")).toEqual([]);
  });

  it("rejects acknowledgement from the wrong seat", () => {
    const { state: openedState, prompt } = setupAck("ack-wrong-seat", [FIEND]);
    expect(() =>
      execute(openedState, {
        type: "ChoosePromptOption",
        seatId: "seat_b",
        promptId: prompt!.promptId,
        optionId: "look-three-cards:acknowledge",
      }),
    ).toThrow(EngineRuleError);
  });

  it("rejects an acknowledgement with an invalid option id", () => {
    const { state: openedState, prompt } = setupAck("ack-bad-option", [FIEND]);
    expect(() =>
      execute(openedState, {
        type: "ChoosePromptOption",
        seatId: "seat_a",
        promptId: prompt!.promptId,
        optionId: "look-three-cards:invalid",
      }),
    ).toThrow(EngineRuleError);
  });
});

describe("Hidden-info contract for look_three_cards (cCp28)", () => {
  it("getPromptMoves returns the acknowledgement move for the acting seat and [] for the opponent", () => {
    const state = createState("hidden-prompt-moves");
    setLeader(state, "seat_a", EMPEROR);
    setOpponentHand(state, "seat_b", [FIEND]);
    givePlayingTurn(state, "seat_a");
    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });
    const ackMoves = promptMoves(opened.state, "seat_a");
    expect(ackMoves).toHaveLength(1);
    expect(ackMoves[0].optionId).toBe("look-three-cards:acknowledge");
    expect(ackMoves[0].target).toEqual({ kind: "none" });
    expect(promptMoves(opened.state, "seat_b")).toEqual([]);
  });

  it("buildSeatObservation includes revealedCards only for the prompt owner", () => {
    const state = createState("hidden-observation");
    setLeader(state, "seat_a", EMPEROR);
    const ids = setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL]);
    givePlayingTurn(state, "seat_a");
    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const actingObs = buildSeatObservation({
      state: opened.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    expect(actingObs.pendingPrompt).not.toBeNull();
    expect(actingObs.pendingPrompt?.abilityId).toBe("look_three_cards");
    expect(actingObs.pendingPrompt?.revealedCards?.map((card) => card.cardId)).toEqual(ids);

    const opponentObs = buildSeatObservation({
      state: opened.state,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    expect(opponentObs.pendingPrompt).toBeNull();
  });

  it("safe simulation export exposes prompt-local revealed_opponent_hand_<n> refs only to the acting seat", () => {
    const state = createState("hidden-export");
    setLeader(state, "seat_a", EMPEROR);
    const ids = setOpponentHand(state, "seat_b", [FIEND, GERALT, SCORCH_SPECIAL]);
    givePlayingTurn(state, "seat_a");
    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_a",
      target: { kind: "none" },
    });

    const actingExport = buildSafeSimulationObservation(opened.state, "seat_a");
    expect(actingExport.pendingPrompt).not.toBeNull();
    expect(actingExport.pendingPrompt?.abilityId).toBe("look_three_cards");
    expect(actingExport.pendingPrompt?.revealedCards).toBeDefined();
    actingExport.pendingPrompt?.revealedCards?.forEach((card, index) => {
      expect(card.cardRef).toBe(`revealed_opponent_hand_${index}`);
    });

    const opponentExport = buildSafeSimulationObservation(opened.state, "seat_b");
    expect(opponentExport.pendingPrompt).toBeNull();
    // Opponent perspective should not expose any revealed card sources via
    // observation (their hand is correctly modeled as cardCountInHand only).
    const serialized = JSON.stringify(opponentExport);
    ids.forEach((cardId) => {
      // revealed instance IDs must not appear in the opponent perspective
      // export. (Card IDs use `seat_b:test:opp-...:source` shape.)
      expect(serialized).not.toContain(cardId);
    });
  });
});

describe("AI-owned look_three_cards prompts (cCp28)", () => {
  it("with AI as acting seat, the human seat sees pendingPrompt: null in observation", () => {
    const state = createState("ai-owned");
    setLeader(state, "seat_b", EMPEROR);
    setOpponentHand(state, "seat_a", [FIEND]);
    givePlayingTurn(state, "seat_b");

    const opened = execute(state, {
      type: "UseLeader",
      seatId: "seat_b",
      target: { kind: "none" },
    });

    const humanObs = buildSeatObservation({
      state: opened.state,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    expect(humanObs.pendingPrompt).toBeNull();
    expect(promptMoves(opened.state, "seat_a")).toEqual([]);
    // AI seat sees its own prompt summary including revealed cards.
    const aiObs = buildSeatObservation({
      state: opened.state,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    expect(aiObs.pendingPrompt?.revealedCards?.length).toBe(1);
  });
});

describe("Regression: other implemented leaders still emit a use_leader move (cCp28)", () => {
  it("Emhyr: The Relentless still emits a draw_opponent_discard use_leader move", () => {
    const state = createState("regression-relentless");
    setLeader(state, "seat_a", RELENTLESS);
    const fiend = addCardInstance(state, "seat_b", FIEND, "regression-fiend");
    // Move Fiend to seat_b discard.
    state.seats.seat_b.hand = state.seats.seat_b.hand.filter((id) => id !== fiend);
    state.seats.seat_b.discard.push(fiend);
    state.cardsById[fiend].zone = { kind: "discard", seat: "seat_b" };
    givePlayingTurn(state, "seat_a");

    const moves = useLeaderMoves(state, "seat_a");
    expect(moves).toHaveLength(1);
    expect(moves[0].metadata.ability).toBe("draw_opponent_discard");
  });
});
