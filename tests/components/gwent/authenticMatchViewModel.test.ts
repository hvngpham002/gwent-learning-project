import { describe, expect, it } from "vitest";

import type { PlayCardMove } from "@/game/core";
import type { EngineBoardRowViewModel, EngineCardViewModel } from "@/store/selectors/engineSelectors";
import {
  buildRoundOverlayViewModel,
  buildAuthenticSeatSummary,
  engineCardToAuthenticCard,
  getBoardCardState,
  getBoardCardTargetsById,
  getBoardRowTargetsByKey,
  groupDiscardCards,
  orderBoardRowsForAuthenticTable,
  toRuntimeCard,
} from "@/components/gwent/matchViewModel";

const card = (overrides: Partial<EngineCardViewModel> = {}): EngineCardViewModel => ({
  instanceId: "seat_a:000:test-card",
  sourceId: "nr_test_card",
  name: "Test Card",
  image: "/images/test.png",
  kind: "unit",
  faction: "northern_realms",
  rows: ["close"],
  abilities: ["none"],
  printedStrength: 4,
  owner: "seat_a",
  controller: "seat_a",
  zone: { kind: "hand", seat: "seat_a" },
  ...overrides,
});

const row = (seatId: "seat_a" | "seat_b", rowName: "close" | "ranged" | "siege"): EngineBoardRowViewModel => ({
  seatId,
  row: rowName,
  units: [],
  horn: null,
});

describe("authentic match view models", () => {
  it("converts engine cards to authentic cards without exposing instance ids as display data", () => {
    const converted = engineCardToAuthenticCard(card({ instanceId: "seat_a:000:hidden-runtime-id" }));

    expect(converted.name).toBe("Test Card");
    expect(converted.sourceId).toBe("nr_test_card");
    expect(JSON.stringify(converted)).not.toContain("hidden-runtime-id");
  });

  it("orders board rows as opponent siege/ranged/close then player close/ranged/siege", () => {
    const rows: EngineBoardRowViewModel[] = [
      row("seat_a", "close"),
      row("seat_a", "ranged"),
      row("seat_a", "siege"),
      row("seat_b", "close"),
      row("seat_b", "ranged"),
      row("seat_b", "siege"),
    ];

    const ordered = orderBoardRowsForAuthenticTable({
      rows,
      humanSeat: "seat_a",
      rowScores: {
        seat_a: { close: 1, ranged: 2, siege: 3 },
        seat_b: { close: 4, ranged: 5, siege: 6 },
      },
    });

    expect(ordered.map((entry) => entry.key)).toEqual([
      "seat_b:siege",
      "seat_b:ranged",
      "seat_b:close",
      "seat_a:close",
      "seat_a:ranged",
      "seat_a:siege",
    ]);
    expect(ordered.map((entry) => entry.score)).toEqual([6, 5, 4, 1, 2, 3]);
  });

  it("keeps AI seat summary hidden by count and does not expose hand identities", () => {
    const summary = buildAuthenticSeatSummary({
      seatId: "seat_b",
      role: "ai",
      faction: "nilfgaard",
      gems: 2,
      passed: false,
      handCards: [card({ name: "Should Stay Hidden", owner: "seat_b", controller: "seat_b" })],
      hiddenHandCount: 7,
      deckCount: 14,
      discardCount: 1,
      score: 9,
    });

    expect(summary.handCount).toBe(7);
    expect(summary.handCards).toEqual([]);
    expect(JSON.stringify(summary)).not.toContain("Should Stay Hidden");
  });

  it("marks only legal board row targets as clickable row targets", () => {
    const moves: PlayCardMove[] = [
      {
        kind: "play_card",
        moveId: "play:row",
        seatId: "seat_a",
        sourceCardId: "seat_a:000:test-card",
        sourceId: "nr_test_card",
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
        label: "Play to close",
        metadata: {
          cardName: "Test Card",
          cardKind: "unit",
          abilities: ["none"],
          targetLabel: "own close",
        },
      },
      {
        kind: "play_card",
        moveId: "play:weather",
        seatId: "seat_a",
        sourceCardId: "seat_a:000:test-card",
        sourceId: "nr_test_card",
        target: { kind: "weather" },
        label: "Play weather",
        metadata: {
          cardName: "Test Card",
          cardKind: "special",
          abilities: ["frost"],
          targetLabel: "weather",
        },
      },
    ];

    const targets = getBoardRowTargetsByKey(moves);

    expect(targets.get("seat_a:close")?.moveId).toBe("play:row");
    expect(targets.has("seat_a:ranged")).toBe(false);
    expect([...targets.keys()]).toEqual(["seat_a:close"]);
  });

  it("maps board effective strength from engine score entries", () => {
    const state = getBoardCardState(
      card({ instanceId: "seat_a:001:boosted", printedStrength: 4 }),
      new Map([
        [
          "seat_a:001:boosted",
          {
            cardId: "seat_a:001:boosted",
            sourceId: "nr_test_card",
            seatId: "seat_a",
            row: "close",
            cardKind: "unit",
            isUnit: true,
            isHero: false,
            printedStrength: 4,
            afterWeather: 4,
            tightBondMultiplier: 2,
            afterTightBond: 8,
            moraleBonus: 0,
            afterMorale: 8,
            hornMultiplier: 1,
            finalStrength: 8,
            eligibleForScorch: true,
            modifiers: ["tight_bond"],
          },
        ],
      ]),
    );

    expect(state).toEqual({
      effectiveStrength: 8,
      printedStrength: 4,
      strengthState: "boosted",
      modifiers: ["tight_bond"],
      usedScoreFallback: false,
    });
  });

  it("keeps non-board runtime cards at printed strength", () => {
    const runtime = toRuntimeCard(card({ printedStrength: 6 }));

    expect(runtime.card.strength).toBe(6);
  });

  it("falls board cards back to printed strength when a score entry is absent", () => {
    const state = getBoardCardState(card({ printedStrength: 5 }), new Map());

    expect(state.effectiveStrength).toBe(5);
    expect(state.strengthState).toBe("normal");
    expect(state.usedScoreFallback).toBe(true);
  });

  it("groups public discard cards without adding hidden hand cards", () => {
    const groups = groupDiscardCards([
      card({ instanceId: "seat_a:001:unit", name: "Close Unit", rows: ["close"], kind: "unit" }),
      card({ instanceId: "seat_a:002:special", name: "Scorch", rows: [], kind: "special", abilities: ["scorch"], printedStrength: 0 }),
    ]);

    expect(groups.map((group) => group.label)).toEqual(["Close Combat", "Specials"]);
    expect(JSON.stringify(groups)).toContain("Close Unit");
    expect(JSON.stringify(groups)).not.toContain("Hidden Hand");
  });

  it("marks only legal card-instance targets as clickable card targets", () => {
    const moves: PlayCardMove[] = [
      {
        kind: "play_card",
        moveId: "play:decoy",
        seatId: "seat_a",
        sourceCardId: "seat_a:000:decoy",
        sourceId: "neutral.decoy",
        target: { kind: "card_instance", side: "own", seatId: "seat_a", cardId: "seat_a:001:target", row: "siege" },
        label: "Play Decoy on target",
        metadata: {
          cardName: "Decoy",
          cardKind: "special",
          abilities: ["decoy"],
          targetLabel: "Target",
        },
      },
    ];

    const targets = getBoardCardTargetsById(moves);

    expect(targets.get("seat_a:001:target")?.moveId).toBe("play:decoy");
    expect(targets.has("seat_a:002:not-target")).toBe(false);
  });

  it("maps a round-history entry into overlay display text without recomputing results", () => {
    const overlay = buildRoundOverlayViewModel({
      round: {
        round: 2,
        scoreBySeat: { seat_a: 10, seat_b: 15 },
        outcome: "seat_b_win",
        winner: "seat_b",
        loserGemLoss: { seat_a: 1 },
        nextStarter: "seat_b",
      },
      seatLabels: { seat_a: "Human", seat_b: "AI" },
      gameWinner: null,
    });

    expect(overlay).toEqual({
      key: "round-2",
      eyebrow: "Round 2 complete",
      title: "AI wins the round",
      scoreLabel: "Human 10 - 15 AI",
      gemLossLabel: "Human lost 1",
      nextStarterLabel: "Next starter: AI",
      gameEndLabel: null,
    });
  });
});
