import { describe, expect, it } from "vitest";

import {
  buildMatchStatusBanner,
  getHandCardState,
  groupTargetActions,
  summarizeCommandHistory,
  summarizeEvents,
  summarizeRoundEnd,
  summarizeRoundHistory,
} from "@/components/game/engine/engineShellViewModels";
import type { GameEvent, MatchState, PlayCardMove, RoundResult } from "@/game/core";

const seatLabels = {
  seat_a: "Human",
  seat_b: "AI",
} as const;

const createMatch = (overrides: Partial<MatchState> = {}): MatchState =>
  ({
    matchId: "match",
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
        controllerKind: "human",
        faction: "northern_realms",
        deck: [],
        hand: ["human-card"],
        discard: [],
        leader: "leader-a",
        leaderSourceId: "leader-a",
        leaderUsed: false,
        mulliganComplete: true,
        sideDeck: [],
        removedFromGame: [],
        board: {
          close: { units: [], horn: null },
          ranged: { units: [], horn: null },
          siege: { units: [], horn: null },
        },
        gems: 2,
        passed: false,
      },
      seat_b: {
        seatId: "seat_b",
        controllerKind: "ai",
        faction: "nilfgaard",
        deck: [],
        hand: ["ai-card"],
        discard: [],
        leader: "leader-b",
        leaderSourceId: "leader-b",
        leaderUsed: false,
        mulliganComplete: true,
        sideDeck: [],
        removedFromGame: [],
        board: {
          close: { units: [], horn: null },
          ranged: { units: [], horn: null },
          siege: { units: [], horn: null },
        },
        gems: 2,
        passed: false,
      },
    },
    cardsById: {},
    weather: { entries: [] },
    rng: { seed: "test", algorithm: "xmur3-mulberry32", state: 1 },
    catalog: { cardSourceIds: [], leaderSourceIds: [], deckPresetIds: [] },
    ...overrides,
  }) as MatchState;

const createPlayMove = (target: PlayCardMove["target"], overrides: Partial<PlayCardMove> = {}): PlayCardMove => ({
  kind: "play_card",
  moveId: `play:${target.kind}:${overrides.sourceCardId ?? "card-a"}`,
  seatId: "seat_a",
  sourceCardId: overrides.sourceCardId ?? "card-a",
  sourceId: overrides.sourceId ?? "source-a",
  target,
  label: "Play Test Card",
  metadata: {
    cardName: "Test Card",
    cardKind: "unit",
    abilities: [],
    targetLabel: "target",
  },
  ...overrides,
});
describe("engine shell view models", () => {
  it("builds status banner copy for human turn, AI turn, human prompt, round end, and game end", () => {
    expect(
      buildMatchStatusBanner({
        match: createMatch(),
        status: "ready",
        lock: null,
        humanSeat: "seat_a",
        aiSeat: "seat_b",
        canHumanAct: true,
        lastError: null,
        winner: null,
        seatLabels,
      }).nextAction,
    ).toBe("Your turn: choose a playable card, use leader, or pass.");

    expect(
      buildMatchStatusBanner({
        match: createMatch({ currentTurn: "seat_b" }),
        status: "ready",
        lock: null,
        humanSeat: "seat_a",
        aiSeat: "seat_b",
        canHumanAct: false,
        lastError: null,
        winner: null,
        seatLabels,
      }).nextAction,
    ).toContain("legal-heuristic-v0");

    expect(
      buildMatchStatusBanner({
        match: createMatch({
          pendingPrompt: { promptId: "prompt", seatId: "seat_a", kind: "medic_revive", abilityId: "medic", options: [] },
        }),
        status: "awaiting_prompt",
        lock: { kind: "prompt", owner: "seat_a", promptId: "prompt", sinceSequence: 1 },
        humanSeat: "seat_a",
        aiSeat: "seat_b",
        canHumanAct: true,
        lastError: null,
        winner: null,
        seatLabels,
      }).nextAction,
    ).toBe("Prompt: choose one legal Medic option.");

    expect(
      buildMatchStatusBanner({
        match: createMatch({ phase: "round_end", seats: { ...createMatch().seats, seat_a: { ...createMatch().seats.seat_a, passed: true }, seat_b: { ...createMatch().seats.seat_b, passed: true } } }),
        status: "ready",
        lock: null,
        humanSeat: "seat_a",
        aiSeat: "seat_b",
        canHumanAct: true,
        lastError: null,
        winner: null,
        seatLabels,
      }).nextAction,
    ).toBe("Round end: both players passed. Resolve the round.");

    expect(
      buildMatchStatusBanner({
        match: createMatch({ phase: "game_end" }),
        status: "game_end",
        lock: null,
        humanSeat: "seat_a",
        aiSeat: "seat_b",
        canHumanAct: false,
        lastError: null,
        winner: "seat_a",
        seatLabels,
      }).nextAction,
    ).toBe("Game end: Human wins.");
  });

  it("returns hand-card disabled reasons without recomputing rules", () => {
    const playable = new Set(["card-a"]);

    expect(getHandCardState({ phase: "playing", isMulliganComplete: false, canHumanAct: true, promptOpen: false, playableCardIds: playable, cardId: "card-a", humanPassed: false })).toEqual(
      { disabled: false, reason: null, reasonLabel: null },
    );
    expect(getHandCardState({ phase: "playing", isMulliganComplete: false, canHumanAct: false, promptOpen: false, playableCardIds: playable, cardId: "card-a", humanPassed: false }).reason).toBe("not_your_turn");
    expect(getHandCardState({ phase: "playing", isMulliganComplete: false, canHumanAct: true, promptOpen: true, playableCardIds: playable, cardId: "card-a", humanPassed: false }).reason).toBe("prompt_pending");
    expect(getHandCardState({ phase: "playing", isMulliganComplete: false, canHumanAct: true, promptOpen: false, playableCardIds: playable, cardId: "card-b", humanPassed: false }).reason).toBe("card_has_no_legal_move");
    expect(getHandCardState({ phase: "playing", isMulliganComplete: false, canHumanAct: true, promptOpen: false, playableCardIds: playable, cardId: "card-a", humanPassed: true }).reason).toBe("already_passed");
    expect(getHandCardState({ phase: "mulligan", isMulliganComplete: true, canHumanAct: true, promptOpen: false, playableCardIds: playable, cardId: "card-a", humanPassed: false }).reason).toBe("mulligan_already_complete");
  });

  it("groups selected-card targets for every supported target shape", () => {
    const groups = groupTargetActions(
      [
        createPlayMove({ kind: "board_row", side: "own", seatId: "seat_a", row: "close" }),
        createPlayMove({ kind: "row_horn", side: "own", seatId: "seat_a", row: "ranged" }),
        createPlayMove({ kind: "weather" }),
        createPlayMove({ kind: "card_instance", side: "own", seatId: "seat_a", cardId: "target-card", row: "siege" }),
        createPlayMove({ kind: "none" }),
      ],
      new Map([["target-card", { name: "Catapult" }]]),
    );

    expect(groups.map((group) => group.label)).toEqual(["Rows", "Horn Slots", "Weather", "Cards", "Global"]);
    expect(groups.flatMap((group) => group.actions.map((action) => action.label))).toContain("Own Catapult, Siege");
  });

  it("summarizes commands without exposing AI mulligan ids or hidden AI play card ids", () => {
    const summaries = summarizeCommandHistory({
      aiSeat: "seat_b",
      seatLabels,
      records: [
        {
          sequence: 1,
          status: "applied",
          eventCount: 1,
          command: { type: "ChooseMulligan", seatId: "seat_b", cardIds: ["ai-hidden-card"] },
        },
        {
          sequence: 2,
          status: "applied",
          eventCount: 1,
          command: { type: "PlayCard", seatId: "seat_b", cardId: "ai-hidden-play", target: { kind: "board_row", row: "close" } },
        },
      ],
    });

    expect(summaries.map((summary) => summary.label).join(" ")).not.toContain("ai-hidden");
    expect(summaries[0].label).toBe("#1 AI completed mulligan (1 card) (applied)");
    expect(summaries[1].label).toBe("#2 AI played a card (applied)");
  });

  it("can label public AI card play after the card is visible", () => {
    expect(
      summarizeCommandHistory({
        aiSeat: "seat_b",
        seatLabels,
        publicCardLookup: new Map([["ai-public-card", { name: "Tibor Eggebracht" }]]),
        records: [
          {
            sequence: 3,
            status: "applied",
            eventCount: 1,
            command: { type: "PlayCard", seatId: "seat_b", cardId: "ai-public-card", target: { kind: "board_row", row: "siege" } },
          },
        ],
      })[0].label,
    ).toBe("#3 AI played Tibor Eggebracht (applied)");
  });

  it("summarizes prompt, round, and game events safely", () => {
    const events: GameEvent[] = [
      { type: "prompt_opened", prompt: { promptId: "p", seatId: "seat_b", kind: "medic_revive", abilityId: "medic", options: [] } },
      { type: "prompt_resolved", promptId: "p", seatId: "seat_b", optionId: "hidden-option" },
      { type: "round_resolved", round: 1, scoreBySeat: { seat_a: 10, seat_b: 12 }, winner: "seat_b", loserGemLoss: { seat_a: 1 }, factionOutcome: "normal" },
      { type: "game_ended", winner: "draw" },
    ];

    expect(summarizeEvents({ events, seatLabels }).map((event) => event.label)).toEqual([
      "AI prompt opened (Medic)",
      "AI prompt resolved",
      "Round 1 resolved: AI",
      "Game ended: Draw",
    ]);
  });

  it("summarizes scoiatael_choose_first faction ability events safely (cCp32)", () => {
    const events: GameEvent[] = [
      { type: "faction_ability_resolved", faction: "scoiatael", seatId: "seat_a", ability: "scoiatael_choose_first", outcome: "chose_self" },
      { type: "faction_ability_resolved", faction: "scoiatael", seatId: "seat_a", ability: "scoiatael_choose_first", outcome: "chose_opponent" },
      { type: "faction_ability_resolved", faction: "scoiatael", seatId: "seat_a", ability: "scoiatael_choose_first", outcome: "defaulted_self" },
    ];

    const summaries = summarizeEvents({ events, seatLabels });
    expect(summaries[0].label).toBe("Scoia'tael chose to take first turn");
    expect(summaries[1].label).toBe("Scoia'tael chose opponent to take first turn");
    expect(summaries[2].label).toBe("Scoia'tael chose to take first turn");

    // Verify no hidden info leaks
    const combined = summaries.map((s) => s.label).join(" ");
    expect(combined).not.toMatch(/instanceId|sourceId|seat_a:|seat_b:/);
  });

  it("summarizes round-end score context and round history win/loss/draw rows", () => {
    expect(summarizeRoundEnd({ scoreBySeat: { seat_a: 20, seat_b: 18 }, seatLabels })).toEqual({
      label: "Human is winning. Human 20 - 18 AI.",
      resolveLabel: "Resolve Round (Human 20 - 18 AI)",
    });

    const rounds: RoundResult[] = [
      { round: 1, scoreBySeat: { seat_a: 20, seat_b: 18 }, outcome: "seat_a_win", winner: "seat_a", loserGemLoss: { seat_b: 1 }, factionOutcome: "normal" },
      { round: 2, scoreBySeat: { seat_a: 10, seat_b: 10 }, outcome: "draw", winner: "draw", loserGemLoss: { seat_a: 1, seat_b: 1 }, factionOutcome: "normal" },
    ];

    expect(summarizeRoundHistory(rounds, seatLabels)).toEqual([
      { key: "round-1", label: "Round 1: Human", scoreLabel: "20 - 18", gemLossLabel: "AI -1" },
      { key: "round-2", label: "Round 2: Draw", scoreLabel: "10 - 10", gemLossLabel: "Human -1, AI -1" },
    ]);
  });
});
