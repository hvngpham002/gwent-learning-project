import { describe, expect, it } from "vitest";

import {
  buildPromptViewModel,
  describeLeaderMove,
  describePlayTarget,
  getPromptOptionMoves,
  getPlayableCardIds,
  getPlayMovesForCard,
  getUseLeaderMoves,
  shouldDisableLeaderAction,
  shouldDisableHandCard,
} from "@/components/game/engine/playMoveHelpers";
import type { ChoosePromptOptionMove, LegalMove, PlayCardMove, UseLeaderMove } from "@/game/core";

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

const createLeaderMove = (overrides: Partial<UseLeaderMove> = {}): UseLeaderMove => ({
  kind: "use_leader",
  moveId: "leader:seat_a:leader-a:clear_weather",
  seatId: "seat_a",
  leaderCardId: "leader-a",
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

const createPromptMove = (overrides: Partial<ChoosePromptOptionMove> = {}): ChoosePromptOptionMove => ({
  kind: "choose_prompt_option",
  moveId: "prompt:prompt-a:revive-card",
  seatId: "seat_a",
  promptId: "prompt-a",
  optionId: "revive-card",
  target: { kind: "card_instance", side: "own", seatId: "seat_a", cardId: "target-card", row: "siege" },
  label: "Revive Catapult to siege",
  metadata: {
    promptKind: "medic_revive",
    abilityId: "medic",
    sourceCardId: "medic-card",
  },
  ...overrides,
});

describe("engine play move helpers", () => {
  it("maps legal play moves to playable card IDs", () => {
    const moves: LegalMove[] = [
      createPlayMove({ kind: "board_row", side: "own", seatId: "seat_a", row: "close" }, { sourceCardId: "card-a" }),
      createPlayMove({ kind: "weather" }, { sourceCardId: "card-b" }),
      {
        kind: "pass",
        moveId: "pass:seat_a",
        seatId: "seat_a",
        target: { kind: "none" },
        label: "Pass",
      },
    ];

    expect([...getPlayableCardIds(moves)].sort()).toEqual(["card-a", "card-b"]);
  });

  it("returns legal target actions for the selected card only", () => {
    const ownClose = createPlayMove({ kind: "board_row", side: "own", seatId: "seat_a", row: "close" });
    const ownRanged = createPlayMove({ kind: "board_row", side: "own", seatId: "seat_a", row: "ranged" });
    const otherCard = createPlayMove({ kind: "weather" }, { sourceCardId: "card-b" });

    expect(getPlayMovesForCard([ownClose, ownRanged, otherCard], "card-a")).toEqual([ownClose, ownRanged]);
    expect(getPlayMovesForCard([ownClose], null)).toEqual([]);
  });

  it("describes all generic play target shapes", () => {
    const cardLookup = new Map([["target-card", { name: "Blue Stripes Commando" }]]);

    expect(
      describePlayTarget(createPlayMove({ kind: "board_row", side: "opponent", seatId: "seat_b", row: "siege" })),
    ).toBe("Opponent Siege");
    expect(describePlayTarget(createPlayMove({ kind: "row_horn", side: "own", seatId: "seat_a", row: "ranged" }))).toBe(
      "Own Ranged Horn",
    );
    expect(describePlayTarget(createPlayMove({ kind: "weather" }))).toBe("Weather");
    expect(
      describePlayTarget(
        createPlayMove({ kind: "card_instance", side: "own", seatId: "seat_a", cardId: "target-card", row: "close" }),
        cardLookup,
      ),
    ).toBe("Own Blue Stripes Commando, Close");
    expect(
      describePlayTarget(
        createPlayMove(
          { kind: "none" },
          {
            metadata: {
              cardName: "Scorch",
              cardKind: "special",
              abilities: ["scorch"],
              targetLabel: "global",
            },
          },
        ),
      ),
    ).toBe("Global");
  });

  it("disables hand cards unless ordinary human play is currently available", () => {
    const playableCardIds = new Set(["card-a"]);

    expect(
      shouldDisableHandCard({ phase: "playing", canHumanAct: true, promptOpen: false, playableCardIds, cardId: "card-a" }),
    ).toBe(false);
    expect(
      shouldDisableHandCard({ phase: "playing", canHumanAct: true, promptOpen: true, playableCardIds, cardId: "card-a" }),
    ).toBe(true);
    expect(
      shouldDisableHandCard({ phase: "mulligan", canHumanAct: true, promptOpen: false, playableCardIds, cardId: "card-a" }),
    ).toBe(true);
    expect(
      shouldDisableHandCard({ phase: "playing", canHumanAct: true, promptOpen: false, playableCardIds, cardId: "card-b" }),
    ).toBe(true);
  });

  it("extracts and describes legal leader moves", () => {
    const leaderMove = createLeaderMove();
    const moves: LegalMove[] = [
      createPlayMove({ kind: "weather" }),
      leaderMove,
      {
        kind: "pass",
        moveId: "pass:seat_a",
        seatId: "seat_a",
        target: { kind: "none" },
        label: "Pass",
      },
    ];

    expect(getUseLeaderMoves(moves)).toEqual([leaderMove]);
    expect(describeLeaderMove(leaderMove)).toBe("Foltest: Lord Commander of The North: Clear Weather (implemented)");
    expect(describeLeaderMove(null)).toBe("Use Leader");
  });

  it("disables leader action unless a current executable leader move is available", () => {
    const leaderMove = createLeaderMove();

    expect(
      shouldDisableLeaderAction({
        phase: "playing",
        canHumanAct: true,
        promptOpen: false,
        leaderUsed: false,
        leaderMove,
      }),
    ).toBe(false);
    expect(
      shouldDisableLeaderAction({
        phase: "playing",
        canHumanAct: true,
        promptOpen: true,
        leaderUsed: false,
        leaderMove,
      }),
    ).toBe(true);
    expect(
      shouldDisableLeaderAction({
        phase: "playing",
        canHumanAct: true,
        promptOpen: false,
        leaderUsed: true,
        leaderMove,
      }),
    ).toBe(true);
    expect(
      shouldDisableLeaderAction({
        phase: "round_end",
        canHumanAct: true,
        promptOpen: false,
        leaderUsed: false,
        leaderMove,
      }),
    ).toBe(true);
    expect(
      shouldDisableLeaderAction({
        phase: "playing",
        canHumanAct: true,
        promptOpen: false,
        leaderUsed: false,
        leaderMove: null,
      }),
    ).toBe(true);
  });

  it("maps legal prompt moves into button view models", () => {
    const promptMove = createPromptMove();
    const promptMoves = getPromptOptionMoves([promptMove, createPlayMove({ kind: "weather" })]);
    const view = buildPromptViewModel({
      promptMoves,
      promptKind: "medic_revive",
      sourceCardId: "medic-card",
      cardLookup: new Map([["medic-card", { name: "Dun Banner Medic" }]]),
    });

    expect(promptMoves).toEqual([promptMove]);
    expect(view).toEqual({
      promptId: "prompt-a",
      title: "medic revive · Medic",
      sourceLabel: "Source: Dun Banner Medic",
      options: [promptMove],
    });
  });
});
