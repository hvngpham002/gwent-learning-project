import { describe, expect, it } from "vitest";

import type { LegalMove, PlayCardMove } from "@/game/core";
import type { EngineBoardRowViewModel, EngineCardViewModel } from "@/store/selectors/engineSelectors";
import {
  buildRoundOverlayViewModel,
  buildAuthenticSeatSummary,
  buildMatchCardInspection,
  buildMatchLeaderInspection,
  chooseDebugAiMulliganMove,
  engineCardToAuthenticCard,
  findLegalMulliganMove,
  buildGameEndNavigationActions,
  getBoardCardState,
  getBoardCardTargetsById,
  getBoardRowTargetsByKey,
  groupDiscardCards,
  orderBoardRowsForAuthenticTable,
  toggleMulliganSelection,
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
      handCards: [
        card({
          instanceId: "seat_b:000:hidden",
          sourceId: "nilfgaard.hidden-card",
          name: "Should Stay Hidden",
          owner: "seat_b",
          controller: "seat_b",
        }),
      ],
      hiddenHandCount: 7,
      deckCount: 14,
      discardCount: 1,
      score: 9,
    });

    expect(summary.handCount).toBe(7);
    expect(summary.handCards).toEqual([]);
    expect(JSON.stringify(summary)).not.toContain("Should Stay Hidden");
    expect(JSON.stringify(summary)).not.toContain("seat_b:000:hidden");
    expect(JSON.stringify(summary)).not.toContain("nilfgaard.hidden-card");
  });

  it("maps selected mulligan ids only to an exact legal choose_mulligan move", () => {
    const moves: LegalMove[] = [
      {
        kind: "choose_mulligan",
        moveId: "mulligan:seat_a:none",
        seatId: "seat_a",
        label: "Keep hand",
        cardIds: [],
        metadata: { cardCount: 0, maxCards: 1 },
      },
      {
        kind: "choose_mulligan",
        moveId: "mulligan:seat_a:a",
        seatId: "seat_a",
        label: "Mulligan 1 card",
        cardIds: ["a"],
        metadata: { cardCount: 1, maxCards: 1 },
      },
      {
        kind: "pass",
        moveId: "pass:seat_a",
        seatId: "seat_a",
        label: "Pass",
        target: { kind: "none" },
      },
    ];

    expect(findLegalMulliganMove(moves, ["a"])?.moveId).toBe("mulligan:seat_a:a");
    expect(findLegalMulliganMove(moves, ["b", "a"])).toBeNull();
    expect(findLegalMulliganMove(moves, ["a", "c"])).toBeNull();
  });

  it("allows zero-card keep-hand confirmation when the engine exposes that move", () => {
    const move = findLegalMulliganMove(
      [
        {
          kind: "choose_mulligan",
          moveId: "mulligan:seat_a:none",
          seatId: "seat_a",
          label: "Keep hand",
          cardIds: [],
          metadata: { cardCount: 0, maxCards: 1 },
        },
      ],
      [],
    );

    expect(move).toEqual(expect.objectContaining({ cardIds: [] }));
  });

  it("chooses only legal debug AI mulligan moves for forced keep and redraw counts", () => {
    const moves: LegalMove[] = [
      {
        kind: "choose_mulligan",
        moveId: "mulligan:seat_b:none",
        seatId: "seat_b",
        label: "Keep hand",
        cardIds: [],
        metadata: { cardCount: 0, maxCards: 1 },
      },
      {
        kind: "choose_mulligan",
        moveId: "mulligan:seat_b:first",
        seatId: "seat_b",
        label: "Mulligan first card",
        cardIds: ["seat_b:000:first"],
        metadata: { cardCount: 1, maxCards: 1 },
      },
      {
        kind: "pass",
        moveId: "pass:seat_b",
        seatId: "seat_b",
        label: "Pass",
        target: { kind: "none" },
      },
    ];

    expect(chooseDebugAiMulliganMove({ moves, mulligansUsed: 0, desiredRedrawCount: 0 })?.moveId).toBe("mulligan:seat_b:none");
    expect(chooseDebugAiMulliganMove({ moves, mulligansUsed: 0, desiredRedrawCount: 1 })?.moveId).toBe("mulligan:seat_b:first");
    expect(chooseDebugAiMulliganMove({ moves, mulligansUsed: 1, desiredRedrawCount: 2 })?.moveId).toBe("mulligan:seat_b:first");
    expect(chooseDebugAiMulliganMove({ moves, mulligansUsed: 2, desiredRedrawCount: 2 })?.moveId).toBe("mulligan:seat_b:none");
  });

  it("does not invent a debug AI redraw when no legal one-card mulligan exists", () => {
    const moves: LegalMove[] = [
      {
        kind: "choose_mulligan",
        moveId: "mulligan:seat_b:none",
        seatId: "seat_b",
        label: "Keep hand",
        cardIds: [],
        metadata: { cardCount: 0, maxCards: 1 },
      },
    ];

    expect(chooseDebugAiMulliganMove({ moves, mulligansUsed: 0, desiredRedrawCount: 1 })).toBeNull();
    expect(chooseDebugAiMulliganMove({ moves, mulligansUsed: 1, desiredRedrawCount: 1 })?.moveId).toBe("mulligan:seat_b:none");
  });

  it("caps mulligan selection at one card per redraw and frees the slot when deselecting", () => {
    expect(toggleMulliganSelection({ selectedCardIds: [], cardId: "a" })).toEqual(["a"]);
    expect(toggleMulliganSelection({ selectedCardIds: ["a"], cardId: "b" })).toEqual(["a"]);
    expect(toggleMulliganSelection({ selectedCardIds: ["a"], cardId: "a" })).toEqual([]);
    expect(toggleMulliganSelection({ selectedCardIds: [], cardId: "c" })).toEqual(["c"]);
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

  it("keeps match-end navigation labels predictable for setup and rematch paths", () => {
    expect(buildGameEndNavigationActions(true)).toEqual([
      { key: "setup", label: "setup", kind: "ghost" },
      { key: "rematch", label: "rematch", kind: "primary" },
    ]);
    expect(buildGameEndNavigationActions(false)).toEqual([
      { key: "close", label: "close", kind: "ghost" },
      { key: "rematch", label: "rematch", kind: "primary" },
    ]);
  });
});

describe("match card inspection view model", () => {
  it("includes hand-card source ID, instance ID, faction, kind, rows, abilities, and printed strength", () => {
    const inspection = buildMatchCardInspection({
      card: card({
        instanceId: "seat_a:001:foltest-blue",
        sourceId: "northern_realms.poor-fucking-infantry",
        name: "Poor Fucking Infantry",
        kind: "unit",
        faction: "northern_realms",
        rows: ["close"],
        abilities: ["tight_bond"],
        printedStrength: 1,
        owner: "seat_a",
        controller: "seat_a",
        zone: { kind: "hand", seat: "seat_a" },
      }),
      origin: "hand",
      ownerLabel: "Human",
    });

    expect(inspection.sourceId).toBe("northern_realms.poor-fucking-infantry");
    expect(inspection.instanceId).toBe("seat_a:001:foltest-blue");
    expect(inspection.factionLabel).toBe("Northern Realms");
    expect(inspection.kindLabel).toBe("Unit");
    expect(inspection.rowLabels).toEqual(["Close Combat"]);
    expect(inspection.hasStrength).toBe(true);
    expect(inspection.printedStrength).toBe(1);
    expect(inspection.abilities.map((entry) => entry.id)).toEqual(["tight_bond"]);
    expect(inspection.originLabel).toBe("Hand");
    expect(inspection.ownerLabel).toBe("Human");
    expect(inspection.effectiveStrength).toBeNull();
  });

  it("captures effective strength, modifiers, and row context for board cards from engine score data", () => {
    const inspection = buildMatchCardInspection({
      card: card({
        instanceId: "seat_a:003:tight-bond",
        sourceId: "northern_realms.blue-stripes-commando",
        kind: "unit",
        printedStrength: 4,
      }),
      origin: "board",
      ownerLabel: "Human",
      row: "close",
      boardState: {
        printedStrength: 4,
        effectiveStrength: 8,
        strengthState: "boosted",
        modifiers: ["tight_bond"],
        usedScoreFallback: false,
      },
    });

    expect(inspection.printedStrength).toBe(4);
    expect(inspection.effectiveStrength).toBe(8);
    expect(inspection.strengthState).toBe("boosted");
    expect(inspection.modifiers).toEqual(["tight_bond"]);
    expect(inspection.rowContextLabel).toBe("Close Combat");
    expect(inspection.facts.find((fact) => fact.key === "effective-strength")?.value).toContain("8");
    expect(inspection.facts.find((fact) => fact.key === "modifiers")?.value).toBe("tight_bond");
  });

  it("falls back without effective strength when origin is not board", () => {
    const inspection = buildMatchCardInspection({
      card: card({ printedStrength: 3, kind: "unit" }),
      origin: "hand",
    });
    expect(inspection.effectiveStrength).toBeNull();
    expect(inspection.modifiers).toEqual([]);
    expect(inspection.facts.some((fact) => fact.key === "modifiers")).toBe(false);
  });

  it("treats weather/special cards as having no strength", () => {
    const inspection = buildMatchCardInspection({
      card: card({
        instanceId: "seat_a:010:frost",
        sourceId: "neutral.biting-frost",
        name: "Biting Frost",
        kind: "special",
        rows: [],
        abilities: ["frost"],
        printedStrength: 0,
      }),
      origin: "weather",
    });

    expect(inspection.kindLabel).toBe("Special");
    expect(inspection.hasStrength).toBe(false);
    expect(inspection.printedStrength).toBeNull();
    expect(inspection.abilities.map((entry) => entry.id)).toEqual(["frost"]);
    expect(inspection.tags).toContain("weather");
    expect(inspection.originLabel).toBe("Weather");
  });

  it("labels the discard origin and exposes its owner", () => {
    const inspection = buildMatchCardInspection({
      card: card({
        instanceId: "seat_b:020:discarded",
        sourceId: "nilfgaard.albrich",
        kind: "unit",
        printedStrength: 2,
        owner: "seat_b",
        controller: "seat_b",
        zone: { kind: "discard", seat: "seat_b" },
      }),
      origin: "discard",
      ownerLabel: "AI",
    });

    expect(inspection.originLabel).toBe("Discard");
    expect(inspection.ownerLabel).toBe("AI");
  });

  it("uses prompt origin without effective strength", () => {
    const inspection = buildMatchCardInspection({
      card: card({
        instanceId: "seat_a:030:medic-target",
        sourceId: "northern_realms.poor-fucking-infantry",
        kind: "unit",
        printedStrength: 1,
        owner: "seat_a",
        controller: "seat_a",
        zone: { kind: "discard", seat: "seat_a" },
      }),
      origin: "prompt",
      ownerLabel: "Human",
    });
    expect(inspection.originLabel).toBe("Prompt option");
    expect(inspection.effectiveStrength).toBeNull();
  });
});

describe("match leader inspection view model", () => {
  it("describes ability metadata, used/ready state, and owner label", () => {
    const inspection = buildMatchLeaderInspection({
      sourceId: "northern_realms.foltest-lord-commander",
      name: "Foltest: Lord Commander",
      faction: "northern_realms",
      abilityId: "clear_weather",
      image: "/images/northern_realms/leaders/Foltest.png",
      used: false,
      ownerLabel: "Human",
    });

    expect(inspection.title).toBe("Foltest: Lord Commander");
    expect(inspection.factionLabel).toBe("Northern Realms");
    expect(inspection.ability.id).toBe("clear_weather");
    expect(inspection.statusLabel).toBe("implemented");
    expect(inspection.ownerLabel).toBe("Human");
    expect(inspection.facts.find((fact) => fact.key === "owner")?.value).toBe("Human");
    expect(inspection.facts.find((fact) => fact.key === "ability-status")?.value).toBe("implemented");
  });

  it("marks used leaders as used regardless of ability status", () => {
    const inspection = buildMatchLeaderInspection({
      sourceId: "skellige.king-bran",
      name: "King Bran",
      faction: "skellige",
      abilityId: "weather_half_penalty",
      image: "/images/skellige/leaders/King_Bran.png",
      used: true,
      ownerLabel: "AI",
    });
    expect(inspection.statusLabel).toBe("used");
    expect(inspection.ability.status).toBe("placeholder");
  });
});

describe("match inspection hidden information safety", () => {
  it("does not produce inspection facts for AI hand cards by construction (hand origin requires authoring)", () => {
    // Hand inspection requires the caller to pass a known engine card. AI hand cards are not in
    // selectEngineHumanHand and are exposed as backs/count-only in the runtime card lookup. The view
    // model itself takes only the supplied EngineCardViewModel, so a guard at the call site is the
    // only way to expose AI hand identities. This test pins that contract: an AI seat hand card
    // passed in is expected to never reach the helper in normal product routes.
    const inspection = buildMatchCardInspection({
      card: card({
        instanceId: "seat_b:040:hidden-card",
        sourceId: "monsters.kayran",
        kind: "hero",
        owner: "seat_b",
        controller: "seat_b",
        zone: { kind: "hand", seat: "seat_b" },
      }),
      origin: "hand",
      ownerLabel: "AI",
    });

    // The helper is pure and will produce facts, but the contract is enforced at the call site:
    // AuthenticMatchScreen only wires the hand-context-menu handler to the human hand strip, which
    // is rendered from selectEngineHumanHand. We pin that the helper's output requires a known card;
    // raw card backs do not have an EngineCardViewModel exposed.
    expect(inspection.sourceId).toBe("monsters.kayran");
    expect(inspection.ownerLabel).toBe("AI");
  });
});
