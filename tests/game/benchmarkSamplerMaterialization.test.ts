import { describe, expect, it } from "vitest";

import {
  buildKnownPresetSourceMultisetPrior,
  buildOpponentKnownPresetSourceMultisetPrior,
  buildPublicKnownSourceSubtraction,
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
    const duplicateLimits = { a: 2, b: 2, c: 2, d: 2, e: 2 };
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
