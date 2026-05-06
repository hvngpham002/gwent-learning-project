import { describe, expect, it } from "vitest";

import type { ChoosePromptOptionMove, LegalMove, PendingPrompt, PlayCardMove, RoundResult, UseLeaderMove } from "@/game/core";
import type { EngineBoardRowViewModel, EngineCardViewModel } from "@/store/selectors/engineSelectors";
import {
  buildLeaderActionViewModel,
  buildLookThreeCardsRevealViewModel,
  buildMatchLedgerViewModel,
  buildResolveRoundActionViewModel,
  buildRoundOverlayViewModel,
  buildSelectedCardTargetViewModel,
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
  buildLeaderStatusViewModel,
  buildPromptPresentationViewModel,
  orderBoardRowsForAuthenticTable,
  buildSelectedCardDragTargetViewModel,
  toggleMulliganSelection,
  toRuntimeCard,
  buildWeatherRowOverlayViewModel,
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

  it("maps weather cards to affected row overlay effects", () => {
    const weatherCards = [
      toRuntimeCard(card({ kind: "special", sourceId: "neutral.biting-frost", name: "Biting Frost", rows: [], abilities: ["frost"] })),
      toRuntimeCard(card({ kind: "special", sourceId: "neutral.impenetrable-fog", name: "Impenetrable Fog", rows: [], abilities: ["fog"] })),
      toRuntimeCard(card({ kind: "special", sourceId: "neutral.torrential-rain", name: "Torrential Rain", rows: [], abilities: ["rain"] })),
    ];

    expect(buildWeatherRowOverlayViewModel({ row: "close", weatherCards })).toMatchObject({
      effects: ["frost"],
      ariaLabel: "Active weather: Biting Frost",
    });
    expect(buildWeatherRowOverlayViewModel({ row: "ranged", weatherCards })).toMatchObject({
      effects: ["fog"],
      ariaLabel: "Active weather: Impenetrable Fog",
    });
    expect(buildWeatherRowOverlayViewModel({ row: "siege", weatherCards })).toMatchObject({
      effects: ["rain"],
      ariaLabel: "Active weather: Torrential Rain",
    });
  });

  it("maps Skellige Storm distinctly to ranged and siege overlays", () => {
    const weatherCards = [
      toRuntimeCard(card({ kind: "special", sourceId: "neutral.skellige-storm", name: "Skellige Storm", rows: [], abilities: ["skellige_storm"] })),
    ];

    expect(buildWeatherRowOverlayViewModel({ row: "close", weatherCards }).effects).toEqual([]);
    expect(buildWeatherRowOverlayViewModel({ row: "ranged", weatherCards })).toMatchObject({
      effects: ["skellige-storm"],
      ariaLabel: "Active weather: Skellige Storm",
    });
    expect(buildWeatherRowOverlayViewModel({ row: "siege", weatherCards }).effects).toEqual(["skellige-storm"]);
  });

  it("ignores Clear Weather and stacks ordinary weather below Skellige Storm", () => {
    const weatherCards = [
      toRuntimeCard(card({ kind: "special", sourceId: "neutral.clear-weather", name: "Clear Weather", rows: [], abilities: ["clear_weather"] })),
      toRuntimeCard(card({ kind: "special", sourceId: "neutral.torrential-rain", name: "Torrential Rain", rows: [], abilities: ["rain"] })),
      toRuntimeCard(card({ kind: "special", sourceId: "neutral.skellige-storm", name: "Skellige Storm", rows: [], abilities: ["skellige_storm"] })),
    ];

    expect(buildWeatherRowOverlayViewModel({ row: "close", weatherCards })).toMatchObject({
      effects: [],
      ariaLabel: null,
    });
    expect(buildWeatherRowOverlayViewModel({ row: "ranged", weatherCards }).effects).toEqual(["skellige-storm"]);
    expect(buildWeatherRowOverlayViewModel({ row: "siege", weatherCards }).effects).toEqual(["rain", "skellige-storm"]);
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

  it("replaces the mulligan selection at one card per redraw and frees the slot when deselecting", () => {
    expect(toggleMulliganSelection({ selectedCardIds: [], cardId: "a" })).toEqual(["a"]);
    expect(toggleMulliganSelection({ selectedCardIds: ["a"], cardId: "b" })).toEqual(["b"]);
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
      weatherAffected: false,
      modifiers: ["tight_bond"],
      usedScoreFallback: false,
    });
  });

  it("marks board strength as weather affected even when the final value is unchanged", () => {
    const state = getBoardCardState(
      card({ instanceId: "seat_a:001:weathered", printedStrength: 1 }),
      new Map([
        [
          "seat_a:001:weathered",
          {
            cardId: "seat_a:001:weathered",
            sourceId: "nr_test_card",
            seatId: "seat_a",
            row: "close",
            cardKind: "unit",
            isUnit: true,
            isHero: false,
            printedStrength: 1,
            afterWeather: 1,
            tightBondMultiplier: 1,
            afterTightBond: 1,
            moraleBonus: 0,
            afterMorale: 1,
            hornMultiplier: 1,
            finalStrength: 1,
            eligibleForScorch: true,
            modifiers: ["weather"],
          },
        ],
      ]),
    );

    expect(state).toMatchObject({
      effectiveStrength: 1,
      printedStrength: 1,
      strengthState: "normal",
      weatherAffected: true,
      modifiers: ["weather"],
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
    expect(state.weatherAffected).toBe(false);
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

  it("marks used leaders as used even when the underlying ability is implemented", () => {
    // After cCp29 every official leader ability is implemented, so the
    // "used overrides ability status" check uses an implemented leader
    // (Emhyr: The White Flame, `cancel_leader`). The status label still
    // reads "used" because the seat's leader has been consumed.
    const inspection = buildMatchLeaderInspection({
      sourceId: "nilfgaard.emhyr-var-emreis-the-white-flame",
      name: "Emhyr var Emreis: The White Flame",
      faction: "nilfgaard",
      abilityId: "cancel_leader",
      image:
        "/images/nilfgaard/leaders/Emhyr_var_Emreis_the_White_Flame.png",
      used: true,
      ownerLabel: "AI",
    });
    expect(inspection.statusLabel).toBe("used");
    expect(inspection.ability.status).toBe("implemented");
  });
});

describe("leader action view model", () => {
  const noTargetLeaderMove = (overrides: Partial<UseLeaderMove> = {}): UseLeaderMove => ({
    kind: "use_leader",
    moveId: "leader:seat_a:foltest:clear_weather",
    seatId: "seat_a",
    leaderCardId: "seat_a:leader:foltest",
    sourceId: "northern-realms.foltest-lord-commander-of-the-north",
    target: { kind: "none" },
    label: "Use Foltest",
    metadata: {
      leaderName: "Foltest: Lord Commander of The North",
      ability: "clear_weather",
      abilityStatus: "implemented",
      targetRequirement: "none",
    },
    ...overrides,
  });

  const weatherLeaderMove = ({
    sourceId,
    targetCardName,
    targetLabel,
    moveId,
  }: {
    sourceId: string;
    targetCardName?: string;
    targetLabel?: string;
    moveId: string;
  }): UseLeaderMove => ({
    kind: "use_leader",
    moveId,
    seatId: "seat_a",
    leaderCardId: "seat_a:leader:eredin",
    sourceId: "monsters.eredin-king-of-the-wild-hunt",
    target: { kind: "deck_card_source", seatId: "seat_a", sourceId },
    label: `Use Eredin (${sourceId})`,
    metadata: {
      leaderName: "Eredin: King of the Wild Hunt",
      ability: "play_any_weather",
      abilityStatus: "implemented",
      targetRequirement: "deck_weather_source",
      targetSourceId: sourceId,
      targetCardName,
      targetLabel,
    },
  });

  it("returns kind 'none' when no leader moves are available", () => {
    expect(buildLeaderActionViewModel([])).toEqual({ kind: "none", triggerLabel: "use leader" });
  });

  it("returns kind 'single' for a single no-target leader move", () => {
    const move = noTargetLeaderMove();
    const result = buildLeaderActionViewModel([move]);
    expect(result.kind).toBe("single");
    if (result.kind !== "single") {
      throw new Error("expected single");
    }
    expect(result.option.move).toBe(move);
    expect(result.option.moveId).toBe(move.moveId);
    expect(result.option.ability).toBe("clear_weather");
    expect(result.triggerLabel).toBe("clear weather");
    expect(result.option.actionLabel).toBe("clear weather");
    expect(result.option.affectedRows).toEqual([]);
    expect(result.option.affectedRowsLabel).toBeNull();
  });

  it("returns kind 'single' for a single deck_card_source leader move", () => {
    const move = weatherLeaderMove({
      sourceId: "neutral.biting-frost",
      targetCardName: "Biting Frost",
      targetLabel: "deck Biting Frost",
      moveId: "leader:seat_a:eredin:frost",
    });
    const result = buildLeaderActionViewModel([move]);
    expect(result.kind).toBe("single");
    if (result.kind !== "single") {
      throw new Error("expected single");
    }
    expect(result.option.move).toBe(move);
    expect(result.option.label).toBe("Biting Frost");
    expect(result.triggerLabel).toBe("choose weather");
    expect(result.option.sourceId).toBe("neutral.biting-frost");
    expect(result.option.affectedRows).toEqual(["close"]);
    expect(result.option.affectedRowsLabel).toBe("Close Combat");
  });

  it("returns kind 'choice' for multiple play_any_weather moves preserving engine order", () => {
    const moves = [
      weatherLeaderMove({ sourceId: "neutral.biting-frost", targetCardName: "Biting Frost", moveId: "m:1" }),
      weatherLeaderMove({ sourceId: "neutral.impenetrable-fog", targetCardName: "Impenetrable Fog", moveId: "m:2" }),
      weatherLeaderMove({ sourceId: "neutral.torrential-rain", targetCardName: "Torrential Rain", moveId: "m:3" }),
      weatherLeaderMove({ sourceId: "neutral.skellige-storm", targetCardName: "Skellige Storm", moveId: "m:4" }),
    ];
    const result = buildLeaderActionViewModel(moves);
    expect(result.kind).toBe("choice");
    if (result.kind !== "choice") {
      throw new Error("expected choice");
    }
    expect(result.options.map((option) => option.moveId)).toEqual(["m:1", "m:2", "m:3", "m:4"]);
    expect(result.triggerLabel).toBe("choose weather");
    expect(result.menuLabel).toBe("Choose a weather card");
    expect(result.options.map((option) => option.label)).toEqual([
      "Biting Frost",
      "Impenetrable Fog",
      "Torrential Rain",
      "Skellige Storm",
    ]);
    expect(result.options.map((option) => option.sourceId)).toEqual([
      "neutral.biting-frost",
      "neutral.impenetrable-fog",
      "neutral.torrential-rain",
      "neutral.skellige-storm",
    ]);
    expect(result.options.map((option) => option.affectedRowsLabel)).toEqual([
      "Close Combat",
      "Ranged",
      "Siege",
      "Ranged + Siege",
    ]);
    expect(result.options[3].affectedRows).toEqual(["ranged", "siege"]);
  });

  it("prefers metadata.targetCardName for the option label", () => {
    const moves = [
      weatherLeaderMove({
        sourceId: "neutral.biting-frost",
        targetCardName: "Biting Frost",
        targetLabel: "deck Biting Frost",
        moveId: "m:1",
      }),
      weatherLeaderMove({
        sourceId: "neutral.impenetrable-fog",
        targetCardName: "Impenetrable Fog",
        targetLabel: "deck Impenetrable Fog",
        moveId: "m:2",
      }),
    ];
    const result = buildLeaderActionViewModel(moves);
    if (result.kind !== "choice") throw new Error("expected choice");
    expect(result.options[0].label).toBe("Biting Frost");
    expect(result.options[1].label).toBe("Impenetrable Fog");
  });

  it("falls back to targetLabel and then sourceId when targetCardName is missing without exposing instance ids", () => {
    const moves = [
      weatherLeaderMove({
        sourceId: "neutral.impenetrable-fog",
        targetLabel: "deck Impenetrable Fog",
        moveId: "m:label",
      }),
      weatherLeaderMove({
        sourceId: "neutral.skellige-storm",
        moveId: "m:source",
      }),
    ];
    const result = buildLeaderActionViewModel(moves);
    if (result.kind !== "choice") throw new Error("expected choice");
    expect(result.options[0].label).toBe("deck Impenetrable Fog");
    expect(result.options[1].label).toBe("neutral.skellige-storm");
    for (const option of result.options) {
      expect(option.label).not.toMatch(/seat_[ab]:\d{3}:/);
    }
  });

  it("exposes the exact UseLeader command target for a chosen option without rebuilding it manually", () => {
    const moves = [
      weatherLeaderMove({ sourceId: "neutral.biting-frost", targetCardName: "Biting Frost", moveId: "m:frost" }),
      weatherLeaderMove({ sourceId: "neutral.impenetrable-fog", targetCardName: "Impenetrable Fog", moveId: "m:fog" }),
    ];
    const result = buildLeaderActionViewModel(moves);
    if (result.kind !== "choice") throw new Error("expected choice");
    const fog = result.options.find((option) => option.moveId === "m:fog");
    expect(fog).toBeDefined();
    if (!fog) throw new Error("missing fog");
    expect(fog.move.target).toEqual({ kind: "deck_card_source", seatId: "seat_a", sourceId: "neutral.impenetrable-fog" });
    expect(fog.move).toBe(moves[1]);
  });
});

describe("leader status view model (cEp9)", () => {
  const leader = (overrides: Partial<Parameters<typeof buildLeaderStatusViewModel>[0]["leader"]> = {}) => ({
    sourceId: "northern-realms.foltest-lord-commander-of-the-north",
    name: "Foltest: Lord Commander of The North",
    ability: "clear_weather",
    abilityName: "Clear Weather",
    abilityStatus: "implemented",
    used: false,
    cancelledThisRound: false,
    ...overrides,
  });

  const status = (
    overrides: Partial<Parameters<typeof buildLeaderStatusViewModel>[0]> = {},
  ) =>
    buildLeaderStatusViewModel({
      leader: leader(),
      legalLeaderMoveCount: 1,
      phase: "playing",
      canAct: true,
      promptOpen: false,
      passed: false,
      ...overrides,
    });

  it("classifies active leaders as ready when a legal leader move exists", () => {
    const result = status();

    expect(result.categoryLabel).toBe("active");
    expect(result.stateLabel).toBe("ready");
    expect(result.reason).toBe("legal leader move available");
    expect(result.actionEnabled).toBe(true);
  });

  it("uses a generic no-target state when the active leader otherwise could act but has no legal move", () => {
    const result = status({ legalLeaderMoveCount: 0 });

    expect(result.stateLabel).toBe("no target");
    expect(result.reason).toBe("no legal target");
    expect(result.actionEnabled).toBe(false);
  });

  it("shows passive leaders as active passives instead of broken unused leaders", () => {
    const result = status({
      leader: leader({
        sourceId: "skellige.king-bran",
        name: "King Bran",
        ability: "weather_half_penalty",
        abilityName: "Weather Half Penalty",
      }),
      legalLeaderMoveCount: 0,
      canAct: false,
    });

    expect(result.categoryLabel).toBe("passive");
    expect(result.stateLabel).toBe("passive active");
    expect(result.actionEnabled).toBe(false);
  });

  it("shows setup-time leaders as setup resolved", () => {
    const result = status({
      leader: leader({
        sourceId: "scoiatael.francesca-findabair-daisy-of-the-valley",
        name: "Francesca Findabair: Daisy of the Valley",
        ability: "draw_extra_card",
        abilityName: "Draw Extra Card",
      }),
      legalLeaderMoveCount: 0,
    });

    expect(result.categoryLabel).toBe("setup");
    expect(result.stateLabel).toBe("setup resolved");
    expect(result.reason).toBe("resolved during match setup");
  });

  it("lets current-round suppression override used/ready display", () => {
    const result = status({
      leader: leader({
        used: true,
        cancelledThisRound: true,
      }),
      legalLeaderMoveCount: 0,
    });

    expect(result.stateLabel).toBe("cancelled this round");
    expect(result.reason).toBe("suppressed until the next round");
    expect(result.showSuppressionBadge).toBe(true);
    expect(result.actionEnabled).toBe(false);
  });

  it("falls back for custom or unknown leader sources without rendering the source ID as the display name", () => {
    const result = status({
      leader: leader({
        sourceId: "custom_leader_smoke",
        name: "custom_leader_smoke",
        ability: "clear_weather",
      }),
      legalLeaderMoveCount: 0,
    });

    expect(result.categoryLabel).toBe("unknown/custom");
    expect(result.stateLabel).toBe("no target");
    expect(result.leaderName).toBe("Unknown leader");
  });

  it("keeps custom implemented leaders legal-move-driven when the engine offers a move", () => {
    const result = status({
      leader: leader({
        sourceId: "custom_leader_clear_weather",
        name: "Custom Clear Weather",
        ability: "clear_weather",
      }),
      legalLeaderMoveCount: 1,
    });

    expect(result.categoryLabel).toBe("unknown/custom");
    expect(result.stateLabel).toBe("ready");
    expect(result.actionEnabled).toBe(true);
  });
});

describe("prompt presentation view model (cEp9)", () => {
  const seatLabels = { seat_a: "Human", seat_b: "AI" } as const;
  const leaderLookup = new Map([
    [
      "northern-realms.foltest-lord-commander-of-the-north",
      {
        sourceId: "northern-realms.foltest-lord-commander-of-the-north",
        name: "Foltest: Lord Commander of The North",
        ability: "clear_weather",
        abilityName: "Clear Weather",
      },
    ],
  ]);

  const prompt = (overrides: Partial<PendingPrompt> = {}): PendingPrompt => ({
    promptId: "prompt:1",
    seatId: "seat_a",
    kind: "choose_card",
    abilityId: "restore_discard_to_hand",
    options: [],
    ...overrides,
  });

  const promptMove = (overrides: Partial<ChoosePromptOptionMove> = {}): ChoosePromptOptionMove => ({
    kind: "choose_prompt_option",
    moveId: "prompt:1:option",
    seatId: "seat_a",
    promptId: "prompt:1",
    optionId: "option:1",
    target: { kind: "none" },
    label: "Choose option",
    metadata: {
      promptKind: "choose_card",
      abilityId: "restore_discard_to_hand",
    },
    ...overrides,
  });

  it("labels cancel_leader reaction options as player choices and names the attempted public leader", () => {
    const result = buildPromptPresentationViewModel({
      prompt: prompt({
        kind: "choose_option",
        abilityId: "cancel_leader",
        stage: "leader_cancel_reaction",
        context: {
          leaderCancel: {
            mode: "reaction",
            targetSeatId: "seat_b",
            targetLeaderCardId: "seat_b:leader:foltest",
            targetLeaderSourceId: "northern-realms.foltest-lord-commander-of-the-north",
            targetAbilityId: "clear_weather",
            target: { kind: "none" },
          },
        },
      }),
      promptMoves: [
        promptMove({ optionId: "cancel-leader:cancel", label: "cancel-leader:cancel", metadata: { promptKind: "choose_option", abilityId: "cancel_leader" } }),
        promptMove({ optionId: "cancel-leader:decline", label: "cancel-leader:decline", metadata: { promptKind: "choose_option", abilityId: "cancel_leader" } }),
      ],
      leaderLookupBySourceId: leaderLookup,
      seatLabels,
      isPromptOwner: true,
    });

    expect(result.title).toBe("Cancel leader ability?");
    expect(result.body).toContain("AI");
    expect(result.body).toContain("Foltest: Lord Commander");
    expect(result.body).toContain("Clear Weather");
    expect(result.options.map((option) => option.label)).toEqual(["cancel", "let it resolve"]);
  });

  it("clarifies restore and opponent-discard prompt sources", () => {
    const restore = buildPromptPresentationViewModel({
      prompt: prompt({ abilityId: "restore_discard_to_hand" }),
      promptMoves: [promptMove({ label: "Restore Blue Stripes to hand" })],
      seatLabels,
      isPromptOwner: true,
    });
    const opponentDiscard = buildPromptPresentationViewModel({
      prompt: prompt({ abilityId: "draw_opponent_discard" }),
      promptMoves: [promptMove({ label: "Draw Albrich from opponent discard", metadata: { promptKind: "choose_card", abilityId: "draw_opponent_discard" } })],
      seatLabels,
      isPromptOwner: true,
    });

    expect(restore.title).toBe("Restore from your discard");
    expect(restore.body).toContain("your discard pile");
    expect(opponentDiscard.title).toBe("Draw from opponent discard");
    expect(opponentDiscard.body).toContain("opponent discard pile");
  });

  it("uses stage-specific copy for discard_two_draw_one_from_deck owner prompts", () => {
    const drawPrompt = buildPromptPresentationViewModel({
      prompt: prompt({
        kind: "choose_card",
        abilityId: "discard_two_draw_one_from_deck",
        stage: "deck_draw_selection",
      }),
      promptMoves: [
        promptMove({
          label: "Draw Blue Stripes from deck",
          metadata: { promptKind: "choose_card", abilityId: "discard_two_draw_one_from_deck" },
        }),
      ],
      seatLabels,
      isPromptOwner: true,
    });

    expect(drawPrompt.title).toBe("Draw from your deck");
    expect(drawPrompt.body).toContain("then shuffle");
    expect(drawPrompt.options.map((option) => option.label)).toEqual(["Draw Blue Stripes from deck"]);
  });

  it("does not expose discard_two_draw_one_from_deck stage-two deck prompt details to non-owners", () => {
    const hiddenDeckPrompt = buildPromptPresentationViewModel({
      prompt: prompt({
        seatId: "seat_b",
        kind: "choose_card",
        abilityId: "discard_two_draw_one_from_deck",
        stage: "deck_draw_selection",
        options: [
          {
            optionId: "discard-draw:draw:seat_b:000:hidden",
            label: "Draw Hidden Deck Card from deck",
            target: { kind: "deck_card_instance", cardId: "seat_b:000:hidden", sourceId: "nilfgaard.hidden-card" },
          },
        ],
      }),
      promptMoves: [],
      seatLabels,
      isPromptOwner: false,
    });

    expect(hiddenDeckPrompt.title).toBe("Prompt pending");
    expect(hiddenDeckPrompt.body).toBeNull();
    expect(hiddenDeckPrompt.options).toEqual([]);
    expect(JSON.stringify(hiddenDeckPrompt)).not.toContain("Hidden Deck Card");
    expect(JSON.stringify(hiddenDeckPrompt)).not.toContain("nilfgaard.hidden-card");
  });

  it("identifies Medic and look_three_cards prompts without implying the reveal can be reopened", () => {
    const medic = buildPromptPresentationViewModel({
      prompt: prompt({ kind: "medic_revive", abilityId: "medic" }),
      promptMoves: [promptMove({ metadata: { promptKind: "medic_revive", abilityId: "medic" } })],
      seatLabels,
      isPromptOwner: true,
    });
    const reveal = buildPromptPresentationViewModel({
      prompt: prompt({ kind: "choose_option", abilityId: "look_three_cards", stage: "opponent_hand_reveal" }),
      promptMoves: [promptMove({ optionId: "look-three-cards:acknowledge", label: "Continue", metadata: { promptKind: "choose_option", abilityId: "look_three_cards" } })],
      seatLabels,
      isPromptOwner: true,
    });

    expect(medic.title).toBe("Medic revive");
    expect(medic.body).toContain("discard pile");
    expect(reveal.title).toBe("Look at hand");
    expect(reveal.body).toContain("shown once");
    expect(reveal.options.map((option) => option.label)).toEqual(["continue"]);
  });

  it("keeps non-owner look_three_cards prompt presentation generic", () => {
    const reveal = buildPromptPresentationViewModel({
      prompt: prompt({ seatId: "seat_b", kind: "choose_option", abilityId: "look_three_cards", stage: "opponent_hand_reveal" }),
      promptMoves: [],
      seatLabels,
      isPromptOwner: false,
    });

    expect(reveal.title).toBe("Prompt pending");
    expect(reveal.body).toBeNull();
    expect(reveal.options).toEqual([]);
  });

  it("redacts raw runtime IDs from fallback prompt option labels", () => {
    const result = buildPromptPresentationViewModel({
      prompt: prompt({ abilityId: "discard_two_draw_one_from_deck", kind: "choose_card", stage: "deck_draw_selection" }),
      promptMoves: [
        promptMove({
          label: "Draw seat_a:000:hidden from deck",
          target: { kind: "deck_card_instance", side: "own", seatId: "seat_a", cardId: "seat_a:000:hidden" },
          metadata: { promptKind: "choose_card", abilityId: "discard_two_draw_one_from_deck" },
        }),
      ],
      seatLabels,
      isPromptOwner: true,
    });

    expect(result.options[0].label).toBe("Draw card from deck");
    expect(result.options[0].label).not.toMatch(/seat_[ab]:\d{3}:/);
  });
});

describe("buildLookThreeCardsRevealViewModel (cCp28)", () => {
  const ackMove = {
    moveId: "prompt:1:seat_a:leader:look-three-cards:look-three-cards:acknowledge",
    optionId: "look-three-cards:acknowledge",
    label: "Continue",
  };
  const revealedCards = [
    card({ instanceId: "seat_b:000:reveal-1", sourceId: "monsters.fiend", name: "Fiend" }),
    card({ instanceId: "seat_b:001:reveal-2", sourceId: "neutral.geralt-of-rivia", name: "Geralt of Rivia" }),
    card({ instanceId: "seat_b:002:reveal-3", sourceId: "neutral.scorch", name: "Scorch" }),
  ];
  const lookup = new Map(revealedCards.map((c) => [c.instanceId, c]));
  const promptShape = (revealedCardIds: readonly string[]) => ({
    promptId: "prompt:1:seat_a:leader:look-three-cards",
    seatId: "seat_a" as const,
    kind: "choose_option",
    abilityId: "look_three_cards",
    stage: "opponent_hand_reveal",
    context: { revealedCardIds },
  });

  it("returns null for non-look_three_cards prompts", () => {
    const result = buildLookThreeCardsRevealViewModel({
      prompt: { ...promptShape([]), abilityId: "restore_discard_to_hand" },
      promptMoves: [ackMove],
      cardLookup: lookup,
      leaderName: "Emperor",
      opponentLabel: "AI",
    });
    expect(result).toBeNull();
  });

  it("returns null when no acknowledgement move is present", () => {
    const result = buildLookThreeCardsRevealViewModel({
      prompt: promptShape(["seat_b:000:reveal-1"]),
      promptMoves: [],
      cardLookup: lookup,
      leaderName: "Emperor",
      opponentLabel: "AI",
    });
    expect(result).toBeNull();
  });

  it("returns null when prompt is null (e.g. AI-owned prompt for the human seat)", () => {
    const result = buildLookThreeCardsRevealViewModel({
      prompt: null,
      promptMoves: [ackMove],
      cardLookup: lookup,
      leaderName: "Emperor",
      opponentLabel: "AI",
    });
    expect(result).toBeNull();
  });

  it("builds 1 card when revealedCardIds has 1 entry", () => {
    const result = buildLookThreeCardsRevealViewModel({
      prompt: promptShape(["seat_b:000:reveal-1"]),
      promptMoves: [ackMove],
      cardLookup: lookup,
      leaderName: "Emperor",
      opponentLabel: "AI",
    });
    expect(result).not.toBeNull();
    expect(result?.cards).toHaveLength(1);
    expect(result?.cards[0].card?.card.sourceId).toBe("monsters.fiend");
    expect(result?.acknowledgeMoveId).toBe(ackMove.moveId);
    expect(result?.acknowledgeLabel).toBe("Continue");
  });

  it("preserves prompt order across 3 entries", () => {
    const result = buildLookThreeCardsRevealViewModel({
      prompt: promptShape([
        "seat_b:002:reveal-3",
        "seat_b:000:reveal-1",
        "seat_b:001:reveal-2",
      ]),
      promptMoves: [ackMove],
      cardLookup: lookup,
      leaderName: "Emperor",
      opponentLabel: "AI",
    });
    expect(result?.cards.map((entry) => entry.card?.card.sourceId)).toEqual([
      "neutral.scorch",
      "monsters.fiend",
      "neutral.geralt-of-rivia",
    ]);
  });

  it("emits a placeholder entry when a revealed instance is missing from the lookup", () => {
    const result = buildLookThreeCardsRevealViewModel({
      prompt: promptShape(["seat_b:000:reveal-1", "seat_b:999:missing"]),
      promptMoves: [ackMove],
      cardLookup: lookup,
      leaderName: "Emperor",
      opponentLabel: "AI",
    });
    expect(result?.cards).toHaveLength(2);
    expect(result?.cards[0].card).not.toBeNull();
    expect(result?.cards[1].card).toBeNull();
    expect(result?.cards[1].placeholderLabel).toBe("Revealed card");
  });

  it("returns null for an AI-owned prompt: the AuthenticMatchScreen guards on humanSeat", () => {
    // The helper itself does not enforce seat ownership; AuthenticMatchScreen
    // wraps it with `prompt && prompt.seatId === humanSeat`. We pin the
    // contract that callers gating on seat ownership get null when they pass
    // null prompt for the wrong seat.
    expect(
      buildLookThreeCardsRevealViewModel({
        prompt: null,
        promptMoves: [],
        cardLookup: lookup,
        leaderName: "Emperor",
        opponentLabel: "AI",
      }),
    ).toBeNull();
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

describe("buildMatchLedgerViewModel (cEp10)", () => {
  const SEAT_LABELS = { seat_a: "Human", seat_b: "AI" } as const;

  const buildRound = (overrides: Partial<RoundResult> = {}): RoundResult => ({
    round: 1,
    scoreBySeat: { seat_a: 12, seat_b: 8 },
    outcome: "seat_a_win",
    winner: "seat_a",
    loserGemLoss: { seat_b: 1 },
    nextStarter: "seat_b",
    ...overrides,
  });

  it("returns null when there is no resolved round to display", () => {
    expect(
      buildMatchLedgerViewModel({
        rounds: [],
        humanSeat: "seat_a",
        aiSeat: "seat_b",
        seatLabels: SEAT_LABELS,
        winner: null,
        gemsBySeat: { seat_a: 2, seat_b: 2 },
        canReturnToSetup: true,
      }),
    ).toBeNull();
  });

  it("renders a non-game-end round ledger with score, gem-loss arrow, next starter, and one primary action", () => {
    const ledger = buildMatchLedgerViewModel({
      rounds: [buildRound()],
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: null,
      gemsBySeat: { seat_a: 2, seat_b: 1 },
      canReturnToSetup: true,
      matchRunKey: "run-1",
    });

    expect(ledger?.kind).toBe("round");
    expect(ledger?.title).toBe("You hold the field.");
    expect(ledger?.eyebrow).toBe("round 1 resolved");
    expect(ledger?.summaryRows.map((row) => row.key)).toEqual([
      "your-score",
      "opponent-score",
      "gem-loss-ai",
    ]);
    const opponentGem = ledger?.summaryRows.find((row) => row.key === "gem-loss-ai");
    expect(opponentGem?.value).toBe("◆ 2 → 1");
    expect(ledger?.summaryRows.find((row) => row.key === "your-score")?.value).toBe("12");
    expect(ledger?.nextStarterLabel).toBe("next to lead: AI");
    expect(ledger?.actions).toEqual([
      { key: "next-round", label: "next round →", kind: "primary", testId: "authentic-round-overlay-dismiss" },
    ]);
    expect(ledger?.escapeDismisses).toBe(true);
    expect(ledger?.historyRows).toEqual([]);
    expect(ledger?.standingRows).toEqual([]);
    expect(ledger?.key).toBe("round|round-1|run-1");
  });

  it("uses opponent perspective copy and fallback gem-loss when before/after data is missing", () => {
    const ledger = buildMatchLedgerViewModel({
      rounds: [
        buildRound({ outcome: "seat_b_win", winner: "seat_b", scoreBySeat: { seat_a: 6, seat_b: 9 }, loserGemLoss: { seat_a: 1 } }),
      ],
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: null,
      gemsBySeat: null,
      canReturnToSetup: false,
    });

    expect(ledger?.title).toBe("AI holds the field.");
    const humanGemRow = ledger?.summaryRows.find((row) => row.key === "gem-loss-human");
    expect(humanGemRow?.value).toBe("-1");
  });

  it("shows draw copy and gem-loss-none when neither side loses a gem", () => {
    const ledger = buildMatchLedgerViewModel({
      rounds: [buildRound({ outcome: "draw", winner: "draw", loserGemLoss: {} })],
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: null,
      gemsBySeat: { seat_a: 2, seat_b: 2 },
      canReturnToSetup: true,
    });

    expect(ledger?.title).toBe("Neither side yields.");
    expect(ledger?.summaryRows.some((row) => row.key === "gem-loss-none" && row.value === "none")).toBe(true);
  });

  it("renders the match-end ledger with real round history and standing rows from engine state", () => {
    const rounds: RoundResult[] = [
      buildRound({ round: 1, outcome: "seat_a_win", winner: "seat_a", scoreBySeat: { seat_a: 14, seat_b: 9 }, loserGemLoss: { seat_b: 1 } }),
      buildRound({ round: 2, outcome: "seat_b_win", winner: "seat_b", scoreBySeat: { seat_a: 7, seat_b: 11 }, loserGemLoss: { seat_a: 1 } }),
      buildRound({ round: 3, outcome: "seat_a_win", winner: "seat_a", scoreBySeat: { seat_a: 12, seat_b: 8 }, loserGemLoss: { seat_b: 1 } }),
    ];
    const ledger = buildMatchLedgerViewModel({
      rounds,
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: "seat_a",
      gemsBySeat: { seat_a: 1, seat_b: 0 },
      canReturnToSetup: true,
    });

    expect(ledger?.kind).toBe("match_end");
    expect(ledger?.title).toBe("Victory over AI.");
    expect(ledger?.eyebrow).toBe("match concluded · 2 to 1");
    expect(ledger?.historyRows.map((row) => row.round)).toEqual([1, 2, 3]);
    expect(ledger?.historyRows.map((row) => row.resultMarker)).toEqual(["✓", "·", "✓"]);
    expect(ledger?.standingRows).toEqual([
      { key: "result", label: "result", value: "victory" },
      { key: "rounds", label: "rounds", value: "2 - 1" },
      { key: "gems", label: "gems", value: "1 - 0" },
    ]);
    expect(ledger?.actions).toEqual([
      { key: "setup", label: "change deck", kind: "ghost", testId: "authentic-game-end-setup" },
      { key: "rematch", label: "rematch", kind: "primary", testId: "authentic-game-end-rematch" },
    ]);
    expect(ledger?.escapeDismisses).toBe(false);
    expect(ledger?.summaryRows).toEqual([]);
  });

  it("uses defeat copy and unknown gem standing when gems data is unavailable", () => {
    const rounds: RoundResult[] = [
      buildRound({ round: 1, outcome: "seat_b_win", winner: "seat_b", scoreBySeat: { seat_a: 4, seat_b: 9 }, loserGemLoss: { seat_a: 1 } }),
      buildRound({ round: 2, outcome: "seat_b_win", winner: "seat_b", scoreBySeat: { seat_a: 3, seat_b: 7 }, loserGemLoss: { seat_a: 1 } }),
    ];
    const ledger = buildMatchLedgerViewModel({
      rounds,
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: "seat_b",
      gemsBySeat: null,
      canReturnToSetup: false,
    });

    expect(ledger?.title).toBe("Defeat against AI.");
    expect(ledger?.standingRows.find((row) => row.key === "gems")?.value).toBe("unknown");
    expect(ledger?.actions.map((action) => action.key)).toEqual(["close", "rematch"]);
  });

  it("uses draw copy on the match-end title when the engine reports draw winner", () => {
    const rounds: RoundResult[] = [
      buildRound({ round: 1, outcome: "draw", winner: "draw", scoreBySeat: { seat_a: 4, seat_b: 4 }, loserGemLoss: {} }),
      buildRound({ round: 2, outcome: "draw", winner: "draw", scoreBySeat: { seat_a: 4, seat_b: 4 }, loserGemLoss: {} }),
      buildRound({ round: 3, outcome: "draw", winner: "draw", scoreBySeat: { seat_a: 4, seat_b: 4 }, loserGemLoss: {} }),
    ];
    const ledger = buildMatchLedgerViewModel({
      rounds,
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: "draw",
      gemsBySeat: { seat_a: 0, seat_b: 0 },
      canReturnToSetup: true,
    });

    expect(ledger?.title).toBe("Draw.");
    expect(ledger?.standingRows.find((row) => row.key === "result")?.value).toBe("draw");
  });

  it("does not include MMR/rank/streak/reward placeholders in any ledger output field", () => {
    const rounds: RoundResult[] = [
      buildRound({ round: 1, outcome: "seat_a_win", winner: "seat_a" }),
      buildRound({ round: 2, outcome: "seat_a_win", winner: "seat_a" }),
    ];
    const ledger = buildMatchLedgerViewModel({
      rounds,
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: "seat_a",
      gemsBySeat: { seat_a: 1, seat_b: 0 },
      canReturnToSetup: true,
    });
    const serialised = JSON.stringify(ledger);
    for (const banned of ["mmr", "rank", "ladder", "streak", "reward", "xp", "elo"]) {
      expect(serialised.toLowerCase()).not.toContain(banned);
    }
  });

  it("does not echo card source IDs, instance IDs, or hidden hand identities into ledger fields", () => {
    const rounds: RoundResult[] = [
      buildRound({ round: 1, outcome: "seat_a_win", winner: "seat_a", scoreBySeat: { seat_a: 14, seat_b: 9 } }),
    ];
    const ledger = buildMatchLedgerViewModel({
      rounds,
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: "seat_a",
      gemsBySeat: { seat_a: 1, seat_b: 0 },
      canReturnToSetup: true,
    });
    const serialised = JSON.stringify(ledger);
    expect(serialised).not.toMatch(/seat_b:\d{3}:/);
    expect(serialised).not.toContain("monsters.");
    expect(serialised).not.toContain("nilfgaard.");
  });

  it("changes the dismissal key when matchRunKey changes so rematch reopens the overlay", () => {
    const rounds: RoundResult[] = [buildRound({ round: 2, outcome: "seat_a_win", winner: "seat_a" })];
    const first = buildMatchLedgerViewModel({
      rounds,
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: null,
      gemsBySeat: null,
      canReturnToSetup: true,
      matchRunKey: "run-1",
    });
    const second = buildMatchLedgerViewModel({
      rounds,
      humanSeat: "seat_a",
      aiSeat: "seat_b",
      seatLabels: SEAT_LABELS,
      winner: null,
      gemsBySeat: null,
      canReturnToSetup: true,
      matchRunKey: "run-2",
    });
    expect(first?.key).not.toBe(second?.key);
  });
});

describe("buildResolveRoundActionViewModel (cEp10)", () => {
  it("hides the resolve-round action when the match is not in round_end", () => {
    const view = buildResolveRoundActionViewModel({
      phase: "playing",
      canResolveRound: false,
      promptOpen: false,
      canHumanAct: true,
    });
    expect(view).toEqual({ visible: false, enabled: false, label: "resolve round", disabledReason: null });
  });

  it("shows an enabled resolve-round action when the engine exposes the legal move", () => {
    const view = buildResolveRoundActionViewModel({
      phase: "round_end",
      canResolveRound: true,
      promptOpen: false,
      canHumanAct: true,
    });
    expect(view).toEqual({ visible: true, enabled: true, label: "resolve round", disabledReason: null });
  });

  it("explains the disabled reason without inventing a second action panel", () => {
    expect(
      buildResolveRoundActionViewModel({
        phase: "round_end",
        canResolveRound: false,
        promptOpen: true,
        canHumanAct: false,
      }),
    ).toMatchObject({ visible: true, enabled: false, disabledReason: "prompt pending" });

    expect(
      buildResolveRoundActionViewModel({
        phase: "round_end",
        canResolveRound: false,
        promptOpen: false,
        canHumanAct: false,
      }),
    ).toMatchObject({ visible: true, enabled: false, disabledReason: "waiting for opponent" });

    expect(
      buildResolveRoundActionViewModel({
        phase: "round_end",
        canResolveRound: false,
        promptOpen: false,
        canHumanAct: true,
      }),
    ).toMatchObject({ visible: true, enabled: false, disabledReason: "waiting for round resolution" });
  });
});

describe("buildSelectedCardTargetViewModel (cEp11)", () => {
  const playCardMove = (overrides: Partial<PlayCardMove>): PlayCardMove => ({
    kind: "play_card",
    moveId: overrides.moveId ?? "play:row",
    seatId: overrides.seatId ?? "seat_a",
    sourceCardId: overrides.sourceCardId ?? "seat_a:000:source",
    sourceId: overrides.sourceId ?? "northern_realms.test-card",
    target: overrides.target ?? { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
    label: overrides.label ?? "Play move",
    metadata: overrides.metadata ?? {
      cardName: "Test Card",
      cardKind: "unit",
      abilities: ["none"],
      targetLabel: "own close",
    },
  });

  it("returns the no-selection state with neutral instruction copy when no card is selected", () => {
    const view = buildSelectedCardTargetViewModel({
      selectedCard: null,
      selectedPlayMoves: [],
      cardLookup: new Map(),
    });
    expect(view.state).toBe("no-selection");
    expect(view.selectedCardLabel).toBeNull();
    expect(view.rowTargets.size).toBe(0);
    expect(view.cardTargets.size).toBe(0);
    expect(view.rowHornTargets.size).toBe(0);
    expect(view.weatherTarget).toBeNull();
    expect(view.fallbackActions).toEqual([]);
    expect(view.rightRailLabel).toBe("no card selected.");
    expect(view.instructionLabel).toContain("playable card");
  });

  it("returns the no-targets state when a selected card has no legal play moves", () => {
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:source", name: "Foltest Brigade" },
      selectedPlayMoves: [],
      cardLookup: new Map(),
    });
    expect(view.state).toBe("no-targets");
    expect(view.selectedCardLabel).toBe("Foltest Brigade");
    expect(view.rowTargets.size).toBe(0);
    expect(view.cardTargets.size).toBe(0);
    expect(view.rowHornTargets.size).toBe(0);
    expect(view.weatherTarget).toBeNull();
    expect(view.fallbackActions).toEqual([]);
    expect(view.rightRailLabel).toBe("no legal targets.");
  });

  it("emits row targets keyed by seat:row with safe labels and exact engine move ids", () => {
    const moves: PlayCardMove[] = [
      playCardMove({
        moveId: "play:row:close",
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
        label: "Play to close",
      }),
      playCardMove({
        moveId: "play:row:siege",
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "siege" },
        label: "Play to siege",
      }),
    ];
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:source", name: "Foltest Brigade" },
      selectedPlayMoves: moves,
      cardLookup: new Map(),
    });

    expect(view.state).toBe("has-targets");
    expect(view.rowTargets.get("seat_a:close")).toMatchObject({
      moveId: "play:row:close",
      seatId: "seat_a",
      row: "close",
      side: "own",
      sideLabel: "your",
      rowLabel: "Close Combat",
      badgeLabel: "play here",
    });
    expect(view.rowTargets.get("seat_a:close")?.ariaLabel).toBe(
      "Play Foltest Brigade on your close combat row",
    );
    expect(view.rowTargets.get("seat_a:siege")?.moveId).toBe("play:row:siege");
    expect(view.rowTargets.get("seat_a:siege")?.ariaLabel).toBe(
      "Play Foltest Brigade on your siege row",
    );
    expect(view.cardTargets.size).toBe(0);
    expect(view.rowHornTargets.size).toBe(0);
    expect(view.weatherTarget).toBeNull();
    expect(view.rightRailLabel).toBe("choose a highlighted row.");
  });

  it("emits board card targets keyed by visible cardId with safe public labels", () => {
    const moves: PlayCardMove[] = [
      playCardMove({
        moveId: "play:decoy",
        sourceId: "neutral.decoy",
        target: { kind: "card_instance", side: "own", seatId: "seat_a", cardId: "seat_a:001:target", row: "close" },
        label: "Play Decoy on Foltest Brigade",
      }),
    ];
    const cardLookup = new Map([
      ["seat_a:001:target" as const, { name: "Foltest Brigade" }],
    ]);
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:source", name: "Decoy" },
      selectedPlayMoves: moves,
      cardLookup,
    });

    expect(view.state).toBe("has-targets");
    expect(view.cardTargets.get("seat_a:001:target")).toMatchObject({
      moveId: "play:decoy",
      cardLabel: "Foltest Brigade",
      badgeLabel: "choose",
    });
    expect(view.cardTargets.get("seat_a:001:target")?.ariaLabel).toBe(
      "Choose Foltest Brigade for Decoy",
    );
    expect(view.rowTargets.size).toBe(0);
    expect(view.rightRailLabel).toBe("choose a highlighted card.");
  });

  it("emits row-horn targets when the selected card supports row_horn placement", () => {
    const moves: PlayCardMove[] = [
      playCardMove({
        moveId: "play:horn:close",
        target: { kind: "row_horn", side: "own", seatId: "seat_a", row: "close" },
        label: "Place Horn on Close",
      }),
      playCardMove({
        moveId: "play:horn:ranged",
        target: { kind: "row_horn", side: "own", seatId: "seat_a", row: "ranged" },
        label: "Place Horn on Ranged",
      }),
    ];
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:horn", name: "Commander's Horn" },
      selectedPlayMoves: moves,
      cardLookup: new Map(),
    });

    expect(view.rowHornTargets.size).toBe(2);
    expect(view.rowHornTargets.get("seat_a:close")).toMatchObject({
      moveId: "play:horn:close",
      row: "close",
      seatId: "seat_a",
      rowLabel: "Close Combat",
      badgeLabel: "horn slot",
    });
    expect(view.rowHornTargets.get("seat_a:close")?.ariaLabel).toBe(
      "Place Commander's Horn on your close combat horn slot",
    );
    expect(view.rowTargets.size).toBe(0);
    expect(view.cardTargets.size).toBe(0);
    expect(view.weatherTarget).toBeNull();
    expect(view.rightRailLabel).toBe("choose a highlighted horn slot.");
  });

  it("emits a weather target when the selected card supports the weather panel", () => {
    const moves: PlayCardMove[] = [
      playCardMove({
        moveId: "play:weather",
        sourceId: "neutral.biting-frost",
        target: { kind: "weather" },
        label: "Play Biting Frost",
      }),
    ];
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:weather", name: "Biting Frost" },
      selectedPlayMoves: moves,
      cardLookup: new Map(),
    });

    expect(view.weatherTarget).toMatchObject({
      moveId: "play:weather",
      badgeLabel: "play weather",
    });
    expect(view.weatherTarget?.ariaLabel).toBe("Play Biting Frost on the weather panel");
    expect(view.rowTargets.size).toBe(0);
    expect(view.cardTargets.size).toBe(0);
    expect(view.rowHornTargets.size).toBe(0);
    expect(view.rightRailLabel).toBe("target the weather panel.");
  });

  it("falls back to a compact right-rail action for global/no-target plays", () => {
    const moves: PlayCardMove[] = [
      playCardMove({
        moveId: "play:scorch",
        sourceId: "neutral.scorch",
        target: { kind: "none" },
        label: "Scorch the highest unit",
      }),
    ];
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:scorch", name: "Scorch" },
      selectedPlayMoves: moves,
      cardLookup: new Map(),
    });

    expect(view.rowTargets.size).toBe(0);
    expect(view.cardTargets.size).toBe(0);
    expect(view.rowHornTargets.size).toBe(0);
    expect(view.weatherTarget).toBeNull();
    expect(view.fallbackActions).toEqual([
      {
        moveId: "play:scorch",
        label: "play scorch",
        title: "play scorch",
        ariaLabel: "play scorch (global effect)",
      },
    ]);
    expect(view.rightRailLabel).toBe("use the action button below.");
  });

  it("does not surface raw runtime instance IDs or hidden opponent source IDs in any user-facing label", () => {
    const moves: PlayCardMove[] = [
      playCardMove({
        moveId: "play:row:close",
        sourceCardId: "seat_a:000:secret-source",
        target: { kind: "board_row", side: "opponent", seatId: "seat_b", row: "ranged" },
        label: "Play across",
      }),
      playCardMove({
        moveId: "play:decoy",
        sourceId: "neutral.decoy",
        target: { kind: "card_instance", side: "opponent", seatId: "seat_b", cardId: "seat_b:042:opponent-target" },
        label: "Decoy opponent",
      }),
      playCardMove({
        moveId: "play:weather",
        target: { kind: "weather" },
        label: "Weather everywhere",
      }),
      playCardMove({
        moveId: "play:horn:siege",
        target: { kind: "row_horn", side: "own", seatId: "seat_a", row: "siege" },
        label: "Horn siege",
      }),
    ];
    const cardLookup = new Map([
      ["seat_b:042:opponent-target" as const, { name: "Visible Opponent Card" }],
    ]);
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:source", name: "Tactical Hand Card" },
      selectedPlayMoves: moves,
      cardLookup,
    });

    // The user-facing strings are: badgeLabel, ariaLabel, sideLabel, rowLabel,
    // cardLabel, instructionLabel, rightRailLabel, selectedCardLabel, and
    // fallbackAction.label/title/ariaLabel. None of those should contain raw
    // instance IDs or hidden source IDs. Structural identifier fields (key,
    // moveId, seatId, cardId-keys in the card target map) are required for
    // dispatch and excluded from this assertion.
    const userFacingStrings = [
      view.instructionLabel,
      view.rightRailLabel,
      view.selectedCardLabel ?? "",
      ...[...view.rowTargets.values()].flatMap((entry) => [entry.sideLabel, entry.rowLabel, entry.badgeLabel, entry.ariaLabel]),
      ...[...view.cardTargets.values()].flatMap((entry) => [entry.cardLabel, entry.badgeLabel, entry.ariaLabel]),
      ...[...view.rowHornTargets.values()].flatMap((entry) => [entry.rowLabel, entry.badgeLabel, entry.ariaLabel]),
      view.weatherTarget?.badgeLabel ?? "",
      view.weatherTarget?.ariaLabel ?? "",
      ...view.fallbackActions.flatMap((entry) => [entry.label, entry.title, entry.ariaLabel]),
    ];
    for (const value of userFacingStrings) {
      expect(value, value).not.toMatch(/seat_[ab]:\d{3}:/);
      expect(value, value).not.toContain("secret-source");
      expect(value, value).not.toContain("neutral.decoy");
    }
    expect(view.cardTargets.get("seat_b:042:opponent-target")?.cardLabel).toBe(
      "Visible Opponent Card",
    );
  });

  it("uses a generic public 'card' label when a card target is missing from the public lookup", () => {
    const moves: PlayCardMove[] = [
      playCardMove({
        moveId: "play:decoy",
        target: { kind: "card_instance", side: "opponent", seatId: "seat_b", cardId: "seat_b:099:hidden" },
        label: "Decoy hidden",
      }),
    ];
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:source", name: "Decoy" },
      selectedPlayMoves: moves,
      cardLookup: new Map(),
    });

    expect(view.cardTargets.get("seat_b:099:hidden")?.cardLabel).toBe("card");
    expect(view.cardTargets.get("seat_b:099:hidden")?.ariaLabel).toBe("Choose card for Decoy");
  });

  it("recomputes targets when a different card's legal moves are supplied", () => {
    const horneSelectedFirst = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:horn", name: "Commander's Horn" },
      selectedPlayMoves: [
        playCardMove({
          moveId: "play:horn:close",
          target: { kind: "row_horn", side: "own", seatId: "seat_a", row: "close" },
          label: "Place horn",
        }),
      ],
      cardLookup: new Map(),
    });

    const unitSelectedNext = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:001:unit", name: "Foltest Brigade" },
      selectedPlayMoves: [
        playCardMove({
          moveId: "play:row:close",
          sourceCardId: "seat_a:001:unit",
          target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
          label: "Play to close",
        }),
      ],
      cardLookup: new Map(),
    });

    expect(horneSelectedFirst.rowHornTargets.size).toBe(1);
    expect(horneSelectedFirst.rowTargets.size).toBe(0);
    expect(unitSelectedNext.rowHornTargets.size).toBe(0);
    expect(unitSelectedNext.rowTargets.get("seat_a:close")?.moveId).toBe("play:row:close");
    expect(unitSelectedNext.selectedCardLabel).toBe("Foltest Brigade");
    expect(horneSelectedFirst.selectedCardLabel).toBe("Commander's Horn");
  });

  it("combines multiple target kinds and emits a generic right-rail hint when both spatial board and other targets exist", () => {
    const moves: PlayCardMove[] = [
      playCardMove({
        moveId: "play:row:close",
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
        label: "Play to close",
      }),
      playCardMove({
        moveId: "play:row:ranged",
        target: { kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" },
        label: "Play to ranged",
      }),
      playCardMove({
        moveId: "play:decoy",
        target: { kind: "card_instance", side: "own", seatId: "seat_a", cardId: "seat_a:002:friend", row: "close" },
        label: "Decoy",
      }),
    ];
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:agile", name: "Agile Unit" },
      selectedPlayMoves: moves,
      cardLookup: new Map([["seat_a:002:friend" as const, { name: "Friendly Unit" }]]),
    });

    expect(view.rowTargets.size).toBe(2);
    expect(view.cardTargets.size).toBe(1);
    expect(view.rightRailLabel).toBe("choose a highlighted row or card.");
  });

  it("builds drag/drop move ids only from spatial selected-card targets", () => {
    const view = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:hybrid", name: "Hybrid Card" },
      selectedPlayMoves: [
        playCardMove({
          moveId: "play:row",
          target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
        }),
        playCardMove({
          moveId: "play:card",
          target: { kind: "card_instance", side: "own", seatId: "seat_a", cardId: "seat_a:001:target", row: "close" },
        }),
        playCardMove({
          moveId: "play:horn",
          target: { kind: "row_horn", side: "own", seatId: "seat_a", row: "ranged" },
        }),
        playCardMove({
          moveId: "play:weather",
          target: { kind: "weather" },
        }),
        playCardMove({
          moveId: "play:global",
          target: { kind: "none" },
        }),
      ],
      cardLookup: new Map([["seat_a:001:target" as const, { name: "Friendly Unit" }]]),
    });

    const dragTargets = buildSelectedCardDragTargetViewModel(view);

    expect(dragTargets.hasSpatialDropTargets).toBe(true);
    expect([...dragTargets.moveIds].sort()).toEqual([
      "play:card",
      "play:horn",
      "play:row",
      "play:weather",
    ]);
    expect(dragTargets.moveIds.has("play:global")).toBe(false);
    expect(dragTargets.rightRailLabel).toBe("drag to a highlighted target.");
  });

  it("uses precise drag hints for single target families and disables drag hints for fallback-only plays", () => {
    const weatherView = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:weather", name: "Biting Frost" },
      selectedPlayMoves: [
        playCardMove({
          moveId: "play:weather",
          target: { kind: "weather" },
        }),
      ],
      cardLookup: new Map(),
    });
    expect(buildSelectedCardDragTargetViewModel(weatherView)).toMatchObject({
      hasSpatialDropTargets: true,
      rightRailLabel: "drag to the weather panel.",
    });

    const fallbackView = buildSelectedCardTargetViewModel({
      selectedCard: { instanceId: "seat_a:000:scorch", name: "Scorch" },
      selectedPlayMoves: [
        playCardMove({
          moveId: "play:scorch",
          target: { kind: "none" },
        }),
      ],
      cardLookup: new Map(),
    });
    expect(buildSelectedCardDragTargetViewModel(fallbackView)).toMatchObject({
      hasSpatialDropTargets: false,
      rightRailLabel: null,
    });
  });
});
