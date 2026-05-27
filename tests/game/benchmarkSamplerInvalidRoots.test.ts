import { describe, expect, it } from "vitest";

import {
  buildKnownPresetSourceMultisetPrior,
  buildPublicKnownZoneCountSummary,
  buildSamplerInvalidRootAnalysis,
  classifySamplerInvalidRoot,
  type SamplerInvalidRootClassification,
} from "@/game/benchmark";
import type { BenchmarkRootObserverInput } from "@/game/benchmark";
import type { CardInstance, MatchState, SeatId } from "@/game/core";

const opponentSeatId: SeatId = "seat_b";

const emptyRow = () => ({ units: [], horn: null });

const card = (
  instanceId: string,
  sourceId: string,
  zone: CardInstance["zone"],
  owner: SeatId = opponentSeatId,
): CardInstance => ({
  instanceId,
  sourceId,
  sourceKind: "card",
  owner,
  controller: owner,
  zone,
});

const baseState = (
  cardsById: Record<string, CardInstance>,
  overrides: Partial<MatchState> = {},
): MatchState => ({
  matchId: "invalid-root-test",
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
      deck: [],
      hand: [],
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

const seats: BenchmarkRootObserverInput["seats"] = {
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
};

describe("benchmark sampler invalid-root analyzer", () => {
  it("uses deterministic first-match classification order", () => {
    expect(
      classifySamplerInvalidRoot({
        invalidReasons: [
          "public_known_exceeds_prior_copy_count",
          "insufficient_prior_remaining",
          "prior_remaining_exceeds_observed_hidden_count",
        ],
        opponentHandCount: 0,
        publicKnownCardCount: 0,
        fixedKnownHandCardCount: 2,
        promptRevealKnownHandCount: 1,
      }),
    ).toBe("public_known_exceeds_prior_copy_count");

    expect(
      classifySamplerInvalidRoot({
        invalidReasons: ["insufficient_prior_remaining"],
        opponentHandCount: 0,
        publicKnownCardCount: 4,
        fixedKnownHandCardCount: 2,
        promptRevealKnownHandCount: 2,
      }),
    ).toBe("fixed_hand_exceeds_observed_hand");
  });

  it("covers every classification label exactly once for fixtures", () => {
    const fixtures: Array<{
      expected: SamplerInvalidRootClassification;
      invalidReasons: string[];
      opponentHandCount?: number;
      publicKnownCardCount?: number;
      fixedKnownHandCardCount?: number;
      promptRevealKnownHandCount?: number;
    }> = [
      {
        expected: "public_known_exceeds_prior_copy_count",
        invalidReasons: ["public_known_exceeds_prior_copy_count"],
      },
      {
        expected: "fixed_hand_exceeds_observed_hand",
        invalidReasons: ["insufficient_prior_remaining"],
        opponentHandCount: 1,
        fixedKnownHandCardCount: 2,
      },
      {
        expected: "prompt_revealed_hand_deficit",
        invalidReasons: ["insufficient_prior_remaining"],
        publicKnownCardCount: 1,
        fixedKnownHandCardCount: 1,
        promptRevealKnownHandCount: 1,
      },
      {
        expected: "public_zone_count_deficit",
        invalidReasons: ["insufficient_prior_remaining"],
        publicKnownCardCount: 3,
        fixedKnownHandCardCount: 0,
      },
      {
        expected: "raw_hidden_count_exceeds_prior",
        invalidReasons: ["insufficient_prior_remaining"],
        publicKnownCardCount: 0,
      },
      {
        expected: "prior_remaining_excess",
        invalidReasons: ["prior_remaining_exceeds_observed_hidden_count"],
      },
      {
        expected: "negative_or_incoherent_public_count",
        invalidReasons: ["negative_opponent_deck_count"],
      },
      {
        expected: "other_invalid_root",
        invalidReasons: ["future_safe_reason"],
      },
    ];

    const observed = fixtures.map((fixture) =>
      classifySamplerInvalidRoot({
        invalidReasons: fixture.invalidReasons,
        opponentHandCount: fixture.opponentHandCount ?? 2,
        publicKnownCardCount: fixture.publicKnownCardCount ?? 0,
        fixedKnownHandCardCount: fixture.fixedKnownHandCardCount ?? 0,
        promptRevealKnownHandCount: fixture.promptRevealKnownHandCount ?? 0,
      }),
    );

    expect(observed).toEqual(fixtures.map((fixture) => fixture.expected));
    expect(new Set(observed).size).toBe(fixtures.length);
  });

  it("records scalar evidence math for an invalid root without hidden identities", () => {
    const prior = buildKnownPresetSourceMultisetPrior({
      deckPresetId: "official-nilfgaard-starter",
      faction: "nilfgaard",
    });
    const [firstSource, secondSource] = Object.keys(prior.mainDeckSourceCounts);
    const opponentHandCount = 2;
    const opponentDeckCount = prior.mainDeckCardCount;
    const state = baseState({
      "public-one": card("public-one", firstSource, {
        kind: "board_row",
        seat: "seat_b",
        row: "close",
      }),
      "public-two": card("public-two", secondSource, {
        kind: "discard",
        seat: "seat_b",
      }),
    });
    state.seats.seat_b.board.close.units = ["public-one"];
    state.seats.seat_b.discard = ["public-two"];
    state.seats.seat_b.hand = Array.from(
      { length: opponentHandCount },
      (_, index) => `hidden-hand-${index}`,
    );
    state.seats.seat_b.deck = Array.from(
      { length: opponentDeckCount },
      (_, index) => `hidden-deck-${index}`,
    );

    const analysis = buildSamplerInvalidRootAnalysis({
      samplerRunId: "test-run",
      suiteId: "benchmark-v1-starter-matrix-v1",
      matchupId: "scalar-evidence",
      seed: "seed",
      step: 1,
      decisionIndex: 0,
      state,
      seatId: "seat_a",
      policyId: "legal-heuristic-v1",
      legalMoves: [],
      seats,
    });

    expect(analysis.materializationRoot.materializationStatus).toBe("invalid");
    expect(analysis.invalidRoot).toEqual(
      expect.objectContaining({
        materializationStatus: "invalid",
        invalidReason: "insufficient_prior_remaining",
        classification: "public_zone_count_deficit",
        opponentHandCount,
        opponentDeckCount,
        opponentHiddenCount: opponentHandCount + opponentDeckCount,
        priorMainDeckCardCount: prior.mainDeckCardCount,
        publicKnownCardCount: 2,
        fixedKnownHandCardCount: 0,
        hiddenHandDrawCount: opponentHandCount,
        requiredHiddenDrawCount: opponentHandCount + opponentDeckCount,
        priorRemainingCardCount: prior.mainDeckCardCount - 2,
        priorDeficitCount: 4,
        priorExcessCount: 0,
      }),
    );
  });

  it("builds a public-zone count summary with counts only", () => {
    const priorSourceCounts = {
      "test.board": 2,
      "test.horn": 1,
      "test.discard": 1,
      "test.removed": 1,
      "test.weather": 1,
      "test.acting-hand": 1,
      "test.prompt": 1,
    };
    const state = baseState(
      {
        "board-one": card("board-one", "test.board", {
          kind: "board_row",
          seat: "seat_b",
          row: "close",
        }),
        "board-two": card("board-two", "test.board", {
          kind: "board_row",
          seat: "seat_a",
          row: "ranged",
        }),
        horn: card("horn", "test.horn", {
          kind: "row_horn",
          seat: "seat_b",
          row: "close",
        }),
        discard: card("discard", "test.discard", { kind: "discard", seat: "seat_b" }),
        removed: card("removed", "test.removed", {
          kind: "removed_from_game",
          seat: "seat_b",
        }),
        weather: card("weather", "test.weather", { kind: "weather" }),
        "acting-hand": card("acting-hand", "test.acting-hand", {
          kind: "hand",
          seat: "seat_a",
        }),
        "prompt-hand": card("prompt-hand", "test.prompt", {
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
          context: { revealedCardIds: ["prompt-hand"] },
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
    state.seats.seat_b.board.close.units = ["board-one"];
    state.seats.seat_a.board.ranged.units = ["board-two"];
    state.seats.seat_b.board.close.horn = "horn";
    state.seats.seat_b.discard = ["discard"];
    state.seats.seat_b.removedFromGame = ["removed"];
    state.weather.entries = ["weather"];
    state.seats.seat_a.hand = ["acting-hand"];
    state.seats.seat_b.hand = ["prompt-hand"];

    const summary = buildPublicKnownZoneCountSummary({
      state,
      actingSeatId: "seat_a",
      opponentSeatId: "seat_b",
      priorSourceCounts,
    });

    expect(summary).toEqual({
      opponentBoardUnitCount: 2,
      opponentRowHornCount: 1,
      opponentDiscardCount: 1,
      opponentRemovedFromGameCount: 1,
      opponentWeatherCount: 1,
      actingHandKnownOpponentOwnedCount: 1,
      promptRevealedOpponentHandCount: 1,
      otherPublicKnownCount: 0,
    });
    expect(JSON.stringify(summary)).not.toContain("test.");
    expect(JSON.stringify(summary)).not.toContain("seat_b:");
  });
});
