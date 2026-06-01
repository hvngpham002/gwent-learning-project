import { describe, expect, it } from "vitest";

import {
  buildKnownPresetSourceMultisetPrior,
  buildOpponentKnownPresetSourceMultisetPrior,
  buildPublicKnownSourceSubtraction,
  buildSamplerMaterializationRootRecord,
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

describe("benchmark sampler materialization", () => {
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
    });

    expect(result.publicKnownCardCount).toBe(2);
    expect(result.publicKnownSourceCounts[firstSource]).toBe(1);
    expect(result.publicKnownSourceCounts[secondSource]).toBe(1);
    expect(result.priorRemainingCardCount).toBe(prior.mainDeckCardCount - 2);
    expect(result.invalidReasonCounts).toEqual({});
  });

  it("does not subtract side-deck-only or generated public cards from the main-deck prior", () => {
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
    });

    expect(result.publicKnownCardCount).toBe(0);
    expect(result.priorRemainingCardCount).toBe(prior.mainDeckCardCount);
    expect(result.invalidReasonCounts).toEqual({});
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
    expect(result.invalidReasonCounts).toEqual({});
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
