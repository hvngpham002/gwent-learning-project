import { describe, expect, it } from "vitest";

import {
  buildKnownPresetSourceMultisetPrior,
  buildOpponentKnownPresetSourceMultisetPrior,
  buildPublicKnownSourceSubtraction,
  buildSamplerPublicTransferMemoryUpdate,
  buildSamplerPublicZoneAccountingAdjustment,
  buildSamplerMaterializationRootRecord,
  createSamplerPublicTransferMemoryState,
  materializeHiddenMultisetSample,
  materializeHiddenMultisets,
  type MaterializedHiddenMultisetSample,
} from "@/game/benchmark";
import type { BenchmarkRootObserverInput } from "@/game/benchmark";
import type { CardInstance, MatchState, SeatId } from "@/game/core";

const opponentSeatId: SeatId = "seat_b";

const emptyRow = () => ({ units: [], horn: null });

const card = (
  instanceId: string,
  sourceId: string,
  zone: CardInstance["zone"],
): CardInstance => ({
  instanceId,
  sourceId,
  sourceKind: "card",
  owner: zone.kind === "weather" ? opponentSeatId : zone.seat,
  controller: zone.kind === "weather" ? opponentSeatId : zone.seat,
  zone,
});

const baseState = (
  cardsById: Record<string, CardInstance>,
  overrides: Partial<MatchState> = {},
): MatchState => ({
  matchId: "materialization-test",
  phase: "playing",
  round: 1,
  roundStarter: "seat_a",
  roundHistory: [],
  lastResolvedRound: null,
  currentTurn: "seat_a",
  pendingPrompt: null,
  seats: {
    seat_a: {
      seatId: "seat_a",
      controllerKind: "ai",
      faction: "northern_realms",
      deck: [],
      hand: [],
      discard: [],
      leader: null,
      leaderSourceId: "leader-a",
      leaderUsed: false,
      mulliganComplete: true,
      mulligansUsed: 0,
      sideDeck: [],
      removedFromGame: [],
      board: { close: emptyRow(), ranged: emptyRow(), siege: emptyRow() },
      gems: 2,
      passed: false,
      leaderCancelledRound: null,
    },
    seat_b: {
      seatId: "seat_b",
      controllerKind: "ai",
      faction: "nilfgaard",
      deck: ["hidden-deck"],
      hand: ["hidden-hand"],
      discard: [],
      leader: null,
      leaderSourceId: "leader-b",
      leaderUsed: false,
      mulliganComplete: true,
      mulligansUsed: 0,
      sideDeck: [],
      removedFromGame: [],
      board: { close: emptyRow(), ranged: emptyRow(), siege: emptyRow() },
      gems: 2,
      passed: false,
      leaderCancelledRound: null,
    },
  },
  cardsById,
  weather: { entries: [] },
  rng: { seed: "test", algorithm: "xmur3-mulberry32", state: 1 },
  catalog: { cardSourceIds: [], leaderSourceIds: [], deckPresetIds: [] },
  ...overrides,
});

const total = (counts: Record<string, number>) =>
  Object.values(counts).reduce((sum, count) => sum + count, 0);

const maxCombinedCopyCount = (sample: MaterializedHiddenMultisetSample) => {
  const combined: Record<string, number> = {};
  Object.entries(sample.handSourceCounts).forEach(([source, count]) => {
    combined[source] = (combined[source] ?? 0) + count;
  });
  Object.entries(sample.deckSourceCounts).forEach(([source, count]) => {
    combined[source] = (combined[source] ?? 0) + count;
  });
  return combined;
};

const benchmarkSeats = ({
  opponentFaction = "nilfgaard",
  opponentDeckPresetId = "official-nilfgaard-starter",
}: {
  opponentFaction?: BenchmarkRootObserverInput["seats"]["seat_b"]["faction"];
  opponentDeckPresetId?: string;
} = {}): BenchmarkRootObserverInput["seats"] => ({
  seat_a: {
    seatId: "seat_a",
    policyId: "legal-heuristic-v1",
    playerId: "a",
    faction: "northern_realms",
    deckPresetId: "official-northern-realms-starter",
  },
  seat_b: {
    seatId: "seat_b",
    policyId: "legal-heuristic-v0",
    playerId: "b",
    faction: opponentFaction,
    deckPresetId: opponentDeckPresetId,
  },
});

const buildRoot = ({
  state,
  seats = benchmarkSeats(),
  publicTransferMemory,
}: {
  state: MatchState;
  seats?: BenchmarkRootObserverInput["seats"];
  publicTransferMemory?: ReturnType<typeof createSamplerPublicTransferMemoryState>;
}) =>
  buildSamplerMaterializationRootRecord({
    samplerRunId: "test-run",
    suiteId: "benchmark-v1-starter-matrix-v1",
    matchupId: "public-transfer-test",
    seed: "public-transfer-seed",
    step: 1,
    decisionIndex: 0,
    state,
    seatId: "seat_a",
    policyId: "legal-heuristic-v1",
    legalMoves: [],
    seats,
    sampleCount: 8,
    publicTransferMemory,
  });

describe("benchmark sampler materialization", () => {
  it("builds scalar public-zone prior accounting without exposing identities", () => {
    const result = buildSamplerPublicZoneAccountingAdjustment({
      publicSourceCounts: {
        "main.deck": 2,
        "side.deck": 1,
        "external.card": 1,
      },
      mainDeckSourceCounts: { "main.deck": 3 },
      sideDeckSourceCounts: { "side.deck": 1 },
      duplicatePublicReferenceCount: 1,
      requiredHiddenDrawCount: 2,
    });

    expect(result).toEqual(
      expect.objectContaining({
        mainDeckAttributablePublicCount: 2,
        sideDeckOnlyPublicCount: 1,
        offPriorPublicCount: 1,
        duplicatePublicReferenceCount: 1,
        publicAdjustmentCount: 2,
        uncoveredPriorDeficitCount: 1,
        publicAdjustmentReasonCounts: {
          off_prior_public: 1,
          side_deck_only_public: 1,
        },
        priorRemainingCardCount: 1,
        invalidReasonCounts: {},
      }),
    );
    expect(JSON.stringify(result)).not.toContain("seat_b:");
  });

  it("uses the opponent deck preset for the known preset prior", () => {
    const prior = buildOpponentKnownPresetSourceMultisetPrior({
      actingSeatId: "seat_a",
      seats: {
        seat_a: {
          seatId: "seat_a",
          policyId: "legal-heuristic-v1",
          playerId: "a",
          faction: "northern_realms",
          deckPresetId: "official-northern-realms-starter",
        },
        seat_b: {
          seatId: "seat_b",
          policyId: "legal-heuristic-v0",
          playerId: "b",
          faction: "nilfgaard",
          deckPresetId: "official-nilfgaard-starter",
        },
      } satisfies BenchmarkRootObserverInput["seats"],
    });

    expect(prior.priorStatus).toBe("prior_available");
    expect(prior.deckPresetId).toBe("official-nilfgaard-starter");
  });

  it("subtracts public opponent main-deck cards without inspecting hidden hand or deck identities", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const [firstSource, secondSource] = Object.keys(prior.mainDeckSourceCounts);
    const state = baseState({
      board: card("board", firstSource, {
        kind: "board_row",
        seat: "seat_b",
        row: "close",
      }),
      discard: card("discard", secondSource, { kind: "discard", seat: "seat_b" }),
      hiddenHand: card("hidden-hand", firstSource, { kind: "hand", seat: "seat_b" }),
      hiddenDeck: card("hidden-deck", secondSource, { kind: "deck", seat: "seat_b" }),
    });
    state.seats.seat_b.board.close.units = ["board"];
    state.seats.seat_b.discard = ["discard"];

    const result = buildPublicKnownSourceSubtraction({
      state,
      actingSeatId: "seat_a",
      opponentSeatId: "seat_b",
      priorSourceCounts: prior.mainDeckSourceCounts,
      sideDeckSourceCounts: prior.sideDeckSourceCounts,
    });

    expect(result.publicKnownCardCount).toBe(2);
    expect(result.mainDeckAttributablePublicCount).toBe(2);
    expect(result.sideDeckOnlyPublicCount).toBe(0);
    expect(result.offPriorPublicCount).toBe(0);
    expect(result.publicAdjustmentCount).toBe(0);
    expect(result.publicKnownSourceCounts[firstSource]).toBe(1);
    expect(result.publicKnownSourceCounts[secondSource]).toBe(1);
    expect(result.priorRemainingCardCount).toBe(prior.mainDeckCardCount - 2);
    expect(result.invalidReasonCounts).toEqual({});
  });

  it("does not subtract off-prior public cards from the main-deck prior", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-monsters-starter",
      faction: "monsters",
    });
    const state = baseState({
      generated: card("generated", "neutral.bovine-defense-force", {
        kind: "board_row",
        seat: "seat_b",
        row: "close",
      }),
    });
    state.seats.seat_b.board.close.units = ["generated"];

    const result = buildPublicKnownSourceSubtraction({
      state,
      actingSeatId: "seat_a",
      opponentSeatId: "seat_b",
      priorSourceCounts: prior.mainDeckSourceCounts,
      sideDeckSourceCounts: prior.sideDeckSourceCounts,
    });

    expect(result.publicKnownCardCount).toBe(0);
    expect(result.mainDeckAttributablePublicCount).toBe(0);
    expect(result.offPriorPublicCount).toBe(1);
    expect(result.publicAdjustmentCount).toBe(1);
    expect(result.publicAdjustmentReasonCounts).toEqual({
      off_prior_public: 1,
    });
    expect(result.priorRemainingCardCount).toBe(prior.mainDeckCardCount);
    expect(result.invalidReasonCounts).toEqual({});
  });

  it("does not subtract side-deck-only public cards from the main-deck prior when proven by the known preset", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-skellige-starter",
      faction: "skellige",
    });
    const sideDeckSource = "skellige.vildkaarl";
    expect(prior.sideDeckSourceCounts[sideDeckSource]).toBeGreaterThan(0);
    expect(prior.mainDeckSourceCounts[sideDeckSource]).toBeUndefined();
    const state = baseState({
      generated: card("generated", sideDeckSource, {
        kind: "board_row",
        seat: "seat_b",
        row: "close",
      }),
    });
    state.seats.seat_b.board.close.units = ["generated"];

    const result = buildPublicKnownSourceSubtraction({
      state,
      actingSeatId: "seat_a",
      opponentSeatId: "seat_b",
      priorSourceCounts: prior.mainDeckSourceCounts,
      sideDeckSourceCounts: prior.sideDeckSourceCounts,
    });

    expect(result.publicKnownCardCount).toBe(0);
    expect(result.mainDeckAttributablePublicCount).toBe(0);
    expect(result.sideDeckOnlyPublicCount).toBe(1);
    expect(result.publicAdjustmentCount).toBe(1);
    expect(result.publicAdjustmentReasonCounts).toEqual({
      side_deck_only_public: 1,
    });
    expect(result.priorRemainingCardCount).toBe(prior.mainDeckCardCount);
    expect(result.invalidReasonCounts).toEqual({});
  });

  it("tracks a public discard card that later moves to opponent hand", () => {
    const memory = createSamplerPublicTransferMemoryState();
    const visibleState = baseState({
      transfer: card("transfer", "test.main", {
        kind: "discard",
        seat: "seat_b",
      }),
    });
    visibleState.seats.seat_b.discard = ["transfer"];

    const first = buildSamplerPublicTransferMemoryUpdate({
      memory,
      state: visibleState,
      perspectiveSeatId: "seat_a",
      opponentSeatId: "seat_b",
      mainDeckSourceCounts: { "test.main": 1 },
    });

    const hiddenState = baseState({
      transfer: card("transfer", "test.main", { kind: "hand", seat: "seat_b" }),
    });
    hiddenState.seats.seat_b.hand = ["transfer"];
    const second = buildSamplerPublicTransferMemoryUpdate({
      memory,
      state: hiddenState,
      perspectiveSeatId: "seat_a",
      opponentSeatId: "seat_b",
      mainDeckSourceCounts: { "test.main": 1 },
    });

    expect(first.visibleCardCount).toBe(1);
    expect(first.knownHiddenHandCount).toBe(0);
    expect(second.knownHiddenHandCount).toBe(1);
    expect(second.knownHiddenDeckCount).toBe(0);
    expect(second.knownHiddenMainDeckAttributableCount).toBe(1);
  });

  it("tracks a public discard card that later moves to opponent deck", () => {
    const memory = createSamplerPublicTransferMemoryState();
    const visibleState = baseState({
      transfer: card("transfer", "test.main", {
        kind: "discard",
        seat: "seat_b",
      }),
    });
    visibleState.seats.seat_b.discard = ["transfer"];
    buildSamplerPublicTransferMemoryUpdate({
      memory,
      state: visibleState,
      perspectiveSeatId: "seat_a",
      opponentSeatId: "seat_b",
      mainDeckSourceCounts: { "test.main": 1 },
    });

    const hiddenState = baseState({
      transfer: card("transfer", "test.main", { kind: "deck", seat: "seat_b" }),
    });
    hiddenState.seats.seat_b.deck = ["transfer"];
    const result = buildSamplerPublicTransferMemoryUpdate({
      memory,
      state: hiddenState,
      perspectiveSeatId: "seat_a",
      opponentSeatId: "seat_b",
      mainDeckSourceCounts: { "test.main": 1 },
    });

    expect(result.knownHiddenHandCount).toBe(0);
    expect(result.knownHiddenDeckCount).toBe(1);
    expect(result.knownHiddenMainDeckAttributableCount).toBe(1);
  });

  it("keeps prompt-revealed opponent hand memory perspective-specific", () => {
    const memoryForA = createSamplerPublicTransferMemoryState();
    const memoryForB = createSamplerPublicTransferMemoryState();
    const promptState = baseState(
      {
        revealed: card("revealed", "test.main", {
          kind: "hand",
          seat: "seat_b",
        }),
      },
      {
        pendingPrompt: {
          promptId: "prompt:reveal",
          seatId: "seat_a",
          kind: "choose_option",
          abilityId: "look_three_cards",
          stage: "opponent_hand_reveal",
          context: { revealedCardIds: ["revealed"] },
          options: [
            {
              optionId: "ack",
              label: "acknowledge",
              target: { kind: "none" },
            },
          ],
        },
      },
    );
    promptState.seats.seat_b.hand = ["revealed"];

    buildSamplerPublicTransferMemoryUpdate({
      memory: memoryForA,
      state: promptState,
      perspectiveSeatId: "seat_a",
      opponentSeatId: "seat_b",
      mainDeckSourceCounts: { "test.main": 1 },
    });
    buildSamplerPublicTransferMemoryUpdate({
      memory: memoryForB,
      state: promptState,
      perspectiveSeatId: "seat_b",
      opponentSeatId: "seat_a",
      mainDeckSourceCounts: { "test.main": 1 },
    });

    const laterState = baseState({
      revealed: card("revealed", "test.main", { kind: "hand", seat: "seat_b" }),
    });
    laterState.seats.seat_b.hand = ["revealed"];

    const knownForA = buildSamplerPublicTransferMemoryUpdate({
      memory: memoryForA,
      state: laterState,
      perspectiveSeatId: "seat_a",
      opponentSeatId: "seat_b",
      mainDeckSourceCounts: { "test.main": 1 },
    });
    const knownForB = buildSamplerPublicTransferMemoryUpdate({
      memory: memoryForB,
      state: laterState,
      perspectiveSeatId: "seat_b",
      opponentSeatId: "seat_a",
      mainDeckSourceCounts: { "test.main": 1 },
    });

    expect(knownForA.knownHiddenHandCount).toBe(1);
    expect(knownForB.knownHiddenHandCount).toBe(0);
  });

  it("does not inspect never-seen opponent hidden hand or deck identities for transfer memory", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const [hiddenSource] = Object.keys(prior.mainDeckSourceCounts);
    const state = baseState({
      unseenHand: card("unseenHand", hiddenSource, { kind: "hand", seat: "seat_b" }),
      unseenDeck: card("unseenDeck", hiddenSource, { kind: "deck", seat: "seat_b" }),
    });
    state.seats.seat_b.hand = ["unseenHand"];
    state.seats.seat_b.deck = [
      "unseenDeck",
      ...Array.from(
        { length: prior.mainDeckCardCount },
        (_, index) => `hidden-deck-extra-${index}`,
      ),
    ];

    const root = buildRoot({
      state,
      publicTransferMemory: createSamplerPublicTransferMemoryState(),
    });

    expect(root.publicTransferKnownHiddenHandCount).toBe(0);
    expect(root.publicTransferKnownHiddenDeckCount).toBe(0);
    expect(root.materializationStatus).toBe("invalid");
    expect(root.invalidReasonCounts).toEqual({
      insufficient_prior_remaining: 1,
    });
  });

  it("consumes main-deck prior for main-deck-attributable transfer cards", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const [mainSource] = Object.keys(prior.mainDeckSourceCounts);
    const memory = createSamplerPublicTransferMemoryState();
    memory.trackedCards.mainTransfer = {
      ownerSeatId: "seat_b",
      sourceId: mainSource,
    };
    const state = baseState({
      mainTransfer: card("mainTransfer", mainSource, {
        kind: "hand",
        seat: "seat_b",
      }),
    });
    state.seats.seat_b.hand = ["mainTransfer"];
    state.seats.seat_b.deck = Array.from(
      { length: prior.mainDeckCardCount - 1 },
      (_, index) => `hidden-deck-${index}`,
    );

    const root = buildRoot({ state, publicTransferMemory: memory });

    expect(root.materializationStatus).toBe("valid");
    expect(root.publicTransferKnownHiddenMainDeckAttributableCount).toBe(1);
    expect(root.publicTransferAdjustmentCount).toBe(0);
    expect(root.priorRemainingCardCount).toBe(prior.mainDeckCardCount - 1);
  });

  it("lets side-deck-only transfer cards reduce hidden counts without consuming main-deck prior", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-skellige-starter",
      faction: "skellige",
    });
    const sideDeckSource = "skellige.vildkaarl";
    const memory = createSamplerPublicTransferMemoryState();
    memory.trackedCards.sideTransfer = {
      ownerSeatId: "seat_b",
      sourceId: sideDeckSource,
    };
    const state = baseState({
      sideTransfer: card("sideTransfer", sideDeckSource, {
        kind: "hand",
        seat: "seat_b",
      }),
    });
    state.seats.seat_b.hand = ["sideTransfer"];
    state.seats.seat_b.deck = Array.from(
      { length: prior.mainDeckCardCount },
      (_, index) => `hidden-deck-${index}`,
    );

    const root = buildRoot({
      state,
      seats: benchmarkSeats({
        opponentFaction: "skellige",
        opponentDeckPresetId: "official-skellige-starter",
      }),
      publicTransferMemory: memory,
    });

    expect(root.materializationStatus).toBe("valid");
    expect(root.publicTransferKnownHiddenSideDeckOnlyCount).toBe(1);
    expect(root.publicTransferAdjustmentCount).toBe(1);
    expect(root.priorRemainingCardCount).toBe(prior.mainDeckCardCount);
  });

  it("lets off-prior transfer cards reduce hidden counts without consuming main-deck prior", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const memory = createSamplerPublicTransferMemoryState();
    memory.trackedCards.offPriorTransfer = {
      ownerSeatId: "seat_b",
      sourceId: "external.public-memory",
    };
    const state = baseState({
      offPriorTransfer: card("offPriorTransfer", "external.public-memory", {
        kind: "hand",
        seat: "seat_b",
      }),
    });
    state.seats.seat_b.hand = ["offPriorTransfer"];
    state.seats.seat_b.deck = Array.from(
      { length: prior.mainDeckCardCount },
      (_, index) => `hidden-deck-${index}`,
    );

    const root = buildRoot({ state, publicTransferMemory: memory });

    expect(root.materializationStatus).toBe("valid");
    expect(root.publicTransferKnownHiddenOffPriorCount).toBe(1);
    expect(root.publicTransferAdjustmentCount).toBe(1);
    expect(root.priorRemainingCardCount).toBe(prior.mainDeckCardCount);
  });

  it("keeps incoherent public-transfer memory invalid", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const [mainSource] = Object.keys(prior.mainDeckSourceCounts);
    const memory = createSamplerPublicTransferMemoryState();
    memory.trackedCards.one = { ownerSeatId: "seat_b", sourceId: mainSource };
    memory.trackedCards.two = { ownerSeatId: "seat_b", sourceId: mainSource };
    const state = baseState({
      one: card("one", mainSource, { kind: "hand", seat: "seat_b" }),
      two: card("two", mainSource, { kind: "hand", seat: "seat_b" }),
    });
    state.seats.seat_b.hand = ["one"];
    state.seats.seat_b.deck = Array.from(
      { length: prior.mainDeckCardCount - 2 },
      (_, index) => `hidden-deck-${index}`,
    );

    const root = buildRoot({ state, publicTransferMemory: memory });

    expect(root.materializationStatus).toBe("invalid");
    expect(root.publicTransferKnownHiddenHandCount).toBe(2);
    expect(root.publicTransferIncoherentCount).toBe(1);
    expect(root.invalidReasonCounts).toEqual(
      expect.objectContaining({
        public_transfer_known_hidden_exceeds_opponent_hand_count: 1,
      }),
    );
  });

  it("marks public over-copy as invalid with a safe reason", () => {
    const state = baseState({
      one: card("one", "test.copy", { kind: "board_row", seat: "seat_b", row: "close" }),
      two: card("two", "test.copy", { kind: "board_row", seat: "seat_b", row: "close" }),
    });
    state.seats.seat_b.board.close.units = ["one", "two"];

    const result = buildPublicKnownSourceSubtraction({
      state,
      actingSeatId: "seat_a",
      opponentSeatId: "seat_b",
      priorSourceCounts: { "test.copy": 1 },
    });

    expect(result.invalidReasonCounts).toEqual({
      public_known_exceeds_prior_copy_count: 1,
    });
    expect(result.mainDeckAttributablePublicCount).toBe(2);
    expect(result.publicAdjustmentCount).toBe(0);
  });

  it("counts a duplicate public card instance once and records scalar diagnostics", () => {
    const state = baseState({
      duplicate: card("duplicate", "test.copy", {
        kind: "board_row",
        seat: "seat_b",
        row: "close",
      }),
    });
    state.seats.seat_b.board.close.units = ["duplicate"];
    state.seats.seat_b.discard = ["duplicate"];

    const result = buildPublicKnownSourceSubtraction({
      state,
      actingSeatId: "seat_a",
      opponentSeatId: "seat_b",
      priorSourceCounts: { "test.copy": 1 },
    });

    expect(result.publicKnownCardCount).toBe(1);
    expect(result.publicKnownSourceCounts).toEqual({ "test.copy": 1 });
    expect(result.duplicatePublicReferenceCount).toBe(1);
    expect(result.mainDeckAttributablePublicCount).toBe(1);
    expect(result.publicAdjustmentCount).toBe(0);
    expect(result.uncoveredPriorDeficitCount).toBe(0);
    expect(result.invalidReasonCounts).toEqual({});
  });

  it("counts distinct public copies with the same source separately", () => {
    const state = baseState({
      one: card("one", "test.copy", {
        kind: "board_row",
        seat: "seat_b",
        row: "close",
      }),
      two: card("two", "test.copy", { kind: "discard", seat: "seat_b" }),
    });
    state.seats.seat_b.board.close.units = ["one"];
    state.seats.seat_b.discard = ["two"];

    const result = buildPublicKnownSourceSubtraction({
      state,
      actingSeatId: "seat_a",
      opponentSeatId: "seat_b",
      priorSourceCounts: { "test.copy": 2 },
    });

    expect(result.publicKnownCardCount).toBe(2);
    expect(result.publicKnownSourceCounts).toEqual({ "test.copy": 2 });
    expect(result.duplicatePublicReferenceCount).toBe(0);
    expect(result.mainDeckAttributablePublicCount).toBe(2);
    expect(result.publicAdjustmentCount).toBe(0);
    expect(result.invalidReasonCounts).toEqual({});
  });

  it("keeps a one-card public-zone deficit invalid when no public-safe adjustment exists", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const [publicSource] = Object.keys(prior.mainDeckSourceCounts);
    const state = baseState({
      public: card("public", publicSource, {
        kind: "board_row",
        seat: "seat_b",
        row: "close",
      }),
    });
    state.seats.seat_b.board.close.units = ["public"];
    state.seats.seat_b.hand = [];
    state.seats.seat_b.deck = Array.from(
      { length: prior.mainDeckCardCount },
      (_, index) => `hidden-deck-${index}`,
    );

    const root = buildSamplerMaterializationRootRecord({
      samplerRunId: "test-run",
      suiteId: "benchmark-v1-starter-matrix-v1",
      matchupId: "one-card-public-deficit",
      seed: "public-deficit-seed",
      step: 1,
      decisionIndex: 0,
      state,
      seatId: "seat_a",
      policyId: "legal-heuristic-v1",
      legalMoves: [],
      seats: {
        seat_a: {
          seatId: "seat_a",
          policyId: "legal-heuristic-v1",
          playerId: "a",
          faction: "northern_realms",
          deckPresetId: "official-northern-realms-starter",
        },
        seat_b: {
          seatId: "seat_b",
          policyId: "legal-heuristic-v0",
          playerId: "b",
          faction: "nilfgaard",
          deckPresetId: "official-nilfgaard-starter",
        },
      },
      sampleCount: 8,
    });

    expect(root.materializationStatus).toBe("invalid");
    expect(root.invalidReasonCounts).toEqual({
      insufficient_prior_remaining: 1,
    });
    expect(root.mainDeckAttributablePublicCount).toBe(1);
    expect(root.publicAdjustmentCount).toBe(0);
    expect(root.uncoveredPriorDeficitCount).toBe(1);
    expect(root.sampleCountGenerated).toBe(0);
  });

  it("does not use hidden hand or deck identities to repair an invalid root", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const state = baseState({
      "hidden-hand": card("hidden-hand", "external.hidden-hand-card", {
        kind: "hand",
        seat: "seat_b",
      }),
      "hidden-deck": card("hidden-deck", "external.hidden-deck-card", {
        kind: "deck",
        seat: "seat_b",
      }),
    });
    state.seats.seat_b.hand = ["hidden-hand"];
    state.seats.seat_b.deck = [
      "hidden-deck",
      ...Array.from(
        { length: prior.mainDeckCardCount },
        (_, index) => `hidden-deck-extra-${index}`,
      ),
    ];

    const root = buildSamplerMaterializationRootRecord({
      samplerRunId: "test-run",
      suiteId: "benchmark-v1-starter-matrix-v1",
      matchupId: "hidden-identity-guard",
      seed: "hidden-identity-seed",
      step: 1,
      decisionIndex: 0,
      state,
      seatId: "seat_a",
      policyId: "legal-heuristic-v1",
      legalMoves: [],
      seats: {
        seat_a: {
          seatId: "seat_a",
          policyId: "legal-heuristic-v1",
          playerId: "a",
          faction: "northern_realms",
          deckPresetId: "official-northern-realms-starter",
        },
        seat_b: {
          seatId: "seat_b",
          policyId: "legal-heuristic-v0",
          playerId: "b",
          faction: "nilfgaard",
          deckPresetId: "official-nilfgaard-starter",
        },
      },
      sampleCount: 8,
    });

    expect(root.materializationStatus).toBe("invalid");
    expect(root.invalidReasonCounts).toEqual({
      insufficient_prior_remaining: 1,
    });
    expect(root.uniquePublicKnownCardCount).toBe(0);
    expect(root.publicAdjustmentCount).toBe(0);
    expect(root.uncoveredPriorDeficitCount).toBe(2);
  });

  it("marks insufficient remaining prior as invalid with a safe reason", () => {
    const result = materializeHiddenMultisets({
      samplerRunId: "test-run",
      rootPublicFingerprint: "public-root",
      priorSourceCounts: { a: 1 },
      remainingSourceCounts: { a: 1 },
      opponentHandCount: 1,
      opponentDeckCount: 1,
      sampleCount: 8,
    });

    expect(result.materializationStatus).toBe("invalid");
    expect(result.invalidReasonCounts).toEqual({
      insufficient_prior_remaining: 1,
    });
    expect(result.samples).toEqual([]);
  });

  it("marks excess remaining prior as invalid with a safe reason", () => {
    const result = materializeHiddenMultisets({
      samplerRunId: "test-run",
      rootPublicFingerprint: "public-root",
      priorSourceCounts: { a: 2 },
      remainingSourceCounts: { a: 2 },
      opponentHandCount: 1,
      opponentDeckCount: 0,
      sampleCount: 8,
    });

    expect(result.materializationStatus).toBe("invalid");
    expect(result.invalidReasonCounts).toEqual({
      prior_remaining_exceeds_observed_hidden_count: 1,
    });
    expect(result.samples).toEqual([]);
  });

  it("generates deterministic samples by public root and sample index", () => {
    const input = {
      samplerRunId: "test-run",
      rootPublicFingerprint: "public-root",
      remainingSourceCounts: { a: 2, b: 2, c: 2, d: 2, e: 2 },
      hiddenHandDrawCount: 3,
      opponentDeckCount: 4,
    };

    const first = materializeHiddenMultisetSample({ ...input, sampleIndex: 0 });
    const repeat = materializeHiddenMultisetSample({ ...input, sampleIndex: 0 });
    const next = materializeHiddenMultisetSample({ ...input, sampleIndex: 1 });

    expect(repeat).toEqual(first);
    expect(next).not.toEqual(first);
  });

  it("valid samples have exact hand/deck counts and respect duplicate limits", () => {
    const duplicateLimits = { a: 2, b: 2, c: 1, d: 1, e: 1 };
    const result = materializeHiddenMultisets({
      samplerRunId: "test-run",
      rootPublicFingerprint: "public-root",
      priorSourceCounts: duplicateLimits,
      remainingSourceCounts: duplicateLimits,
      opponentHandCount: 3,
      opponentDeckCount: 4,
      sampleCount: 8,
    });

    expect(result.materializationStatus).toBe("valid");
    expect(result.sampleCountRequested).toBe(8);
    expect(result.sampleCountGenerated).toBe(8);
    expect(result.sampleCountValid).toBe(8);
    expect(result.sampleCountInvalid).toBe(0);
    for (const sample of result.samples) {
      expect(total(sample.handSourceCounts)).toBe(3);
      expect(total(sample.deckSourceCounts)).toBe(4);
      const combined = maxCombinedCopyCount(sample);
      for (const [source, count] of Object.entries(combined)) {
        expect(count).toBeLessThanOrEqual(
          duplicateLimits[source as keyof typeof duplicateLimits],
        );
      }
    }
  });

  it("counts prompt-revealed opponent hand cards once while preserving real hand count", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const [revealedSource, hiddenSource] = Object.keys(prior.mainDeckSourceCounts);
    const opponentHand = ["revealed-hand", "hidden-hand-one", "hidden-hand-two"];
    const opponentDeck = Array.from(
      { length: prior.mainDeckCardCount - opponentHand.length },
      (_, index) => `hidden-deck-${index}`,
    );
    const state = baseState(
      {
        "revealed-hand": card("revealed-hand", revealedSource, {
          kind: "hand",
          seat: "seat_b",
        }),
        "hidden-hand-one": card("hidden-hand-one", hiddenSource, {
          kind: "hand",
          seat: "seat_b",
        }),
        "hidden-hand-two": card("hidden-hand-two", hiddenSource, {
          kind: "hand",
          seat: "seat_b",
        }),
      },
      {
        pendingPrompt: {
          promptId: "prompt:reveal",
          seatId: "seat_a",
          kind: "choose_option",
          abilityId: "look_three_cards",
          stage: "opponent_hand_reveal",
          context: {
            revealedCardIds: ["revealed-hand", "revealed-hand"],
          },
          options: [
            {
              optionId: "ack",
              label: "acknowledge",
              target: { kind: "none" },
            },
          ],
        },
      },
    );
    state.seats.seat_b.hand = opponentHand;
    state.seats.seat_b.deck = opponentDeck;

    const root = buildSamplerMaterializationRootRecord({
      samplerRunId: "test-run",
      suiteId: "benchmark-v1-starter-matrix-v1",
      matchupId: "prompt-reveal-regression",
      seed: "prompt-reveal-seed",
      step: 1,
      decisionIndex: 0,
      state,
      seatId: "seat_a",
      policyId: "legal-heuristic-v1",
      legalMoves: [],
      seats: {
        seat_a: {
          seatId: "seat_a",
          policyId: "legal-heuristic-v1",
          playerId: "a",
          faction: "northern_realms",
          deckPresetId: "official-northern-realms-starter",
        },
        seat_b: {
          seatId: "seat_b",
          policyId: "legal-heuristic-v0",
          playerId: "b",
          faction: "nilfgaard",
          deckPresetId: "official-nilfgaard-starter",
        },
      },
      sampleCount: 8,
    });

    expect(root.materializationStatus).toBe("valid");
    expect(root.opponentHandCount).toBe(opponentHand.length);
    expect(root.sampleCountGenerated).toBe(8);
    expect(root.sampleCountValid).toBe(8);

    const publicKnown = buildPublicKnownSourceSubtraction({
      state,
      actingSeatId: "seat_a",
      opponentSeatId: "seat_b",
      priorSourceCounts: prior.mainDeckSourceCounts,
      sideDeckSourceCounts: prior.sideDeckSourceCounts,
      opponentHandCount: opponentHand.length,
      opponentDeckCount: opponentDeck.length,
    });
    const materialization = materializeHiddenMultisets({
      samplerRunId: "test-run",
      rootPublicFingerprint: root.rootPublicFingerprint,
      priorSourceCounts: prior.mainDeckSourceCounts,
      remainingSourceCounts: publicKnown.remainingSourceCounts,
      fixedKnownHandSourceCounts: publicKnown.fixedKnownHandSourceCounts,
      opponentHandCount: opponentHand.length,
      opponentDeckCount: opponentDeck.length,
      sampleCount: 8,
    });

    expect(publicKnown.publicKnownCardCount).toBe(1);
    expect(publicKnown.fixedKnownHandCardCount).toBe(1);
    expect(publicKnown.duplicatePublicReferenceCount).toBe(1);
    expect(publicKnown.duplicateFixedKnownHandReferenceCount).toBe(1);
    expect(materialization.materializationStatus).toBe("valid");
    for (const sample of materialization.samples) {
      expect(total(sample.handSourceCounts)).toBe(opponentHand.length);
      expect(sample.handSourceCounts[revealedSource]).toBeGreaterThanOrEqual(1);
    }
  });

  it("does not mutate the original MatchState while collecting public known cards", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const [firstSource] = Object.keys(prior.mainDeckSourceCounts);
    const state = baseState({
      board: card("board", firstSource, {
        kind: "board_row",
        seat: "seat_b",
        row: "close",
      }),
    });
    state.seats.seat_b.board.close.units = ["board"];
    const before = JSON.stringify(state);

    buildPublicKnownSourceSubtraction({
      state,
      actingSeatId: "seat_a",
      opponentSeatId: "seat_b",
      priorSourceCounts: prior.mainDeckSourceCounts,
    });

    expect(JSON.stringify(state)).toBe(before);
  });
});
