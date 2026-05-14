import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialSkelligeStarterDeckPreset,
} from "@/data/catalog";
import {
  buildSeatObservation,
  buildLegalHeuristicV1Features,
  commandFromLegalMove,
  explainLegalHeuristicV1Decision,
  legalHeuristicPolicyV0,
  legalHeuristicPolicyV1,
  uniqueCardTempoUpperBound,
  DEFAULT_PRODUCT_AI_POLICY_ID,
  PRODUCT_AI_POLICIES,
  getProductAiPolicy,
  resolveProductAiPolicyId,
  type EnginePolicyInput,
  type SeatCardSummary,
  type SeatObservation,
} from "@/game/ai";
import {
  getLegalMoves,
  startMatch,
  type ChoosePromptOptionMove,
  type LegalMove,
  type MatchState,
  type SeatId,
} from "@/game/core";
import type { CatalogAbilityId, CatalogCardKind, CatalogRow } from "@/game/catalog";
import engineReducer, { engineCommandApplied } from "@/store/slices/engineSlice";
import { dispatchEngineCommand, startEngineMatch } from "@/store/thunks/engineThunks";
import { selectEngineLegalMovesForAi } from "@/store/selectors/engineSelectors";
import { getLegalHeuristicAiCommand } from "@/components/game/engine/legalHeuristicAiController";

const createMatch = (seed = "engine-ai-policy") =>
  startMatch({
    seed,
    seats: [
      {
        seatId: "seat_a",
        playerId: "human",
        controllerKind: "human",
        faction: "northern_realms",
        deckPreset: currentNorthernRealmsDeckPreset,
      },
      {
        seatId: "seat_b",
        playerId: "ai",
        controllerKind: "ai",
        faction: "nilfgaard",
        deckPreset: currentNilfgaardDeckPreset,
      },
    ],
    catalog: {
      cards: currentCatalogCards,
      leaders: currentCatalogLeaders,
    },
  }).state;

const createTestStore = () =>
  configureStore({
    reducer: {
      engine: engineReducer,
    },
  });

const getMoves = (state: MatchState, seatId: SeatId) =>
  getLegalMoves({ state, seatId, catalogCards: currentCatalogCards, catalogLeaders: currentCatalogLeaders });

const completeMulligans = (store: ReturnType<typeof createTestStore>) => {
  store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_a", cardIds: [] }));
  store.dispatch(dispatchEngineCommand({ type: "ChooseMulligan", seatId: "seat_b", cardIds: [] }));
};

const ROWS = ["close", "ranged", "siege"] as const satisfies readonly CatalogRow[];

const removeEverywhere = (state: MatchState, cardId: string) => {
  Object.values(state.seats).forEach((seat) => {
    seat.deck = seat.deck.filter((id) => id !== cardId);
    seat.hand = seat.hand.filter((id) => id !== cardId);
    seat.discard = seat.discard.filter((id) => id !== cardId);
    seat.sideDeck = seat.sideDeck.filter((id) => id !== cardId);
    seat.removedFromGame = seat.removedFromGame.filter((id) => id !== cardId);
    ROWS.forEach((row) => {
      seat.board[row].units = seat.board[row].units.filter((id) => id !== cardId);
      if (seat.board[row].horn === cardId) seat.board[row].horn = null;
    });
  });
  state.weather.entries = state.weather.entries.filter((id) => id !== cardId);
};

const putInHand = (state: MatchState, seatId: SeatId, cardId: string) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].hand.push(cardId);
  state.cardsById[cardId].zone = { kind: "hand", seat: seatId };
  state.cardsById[cardId].controller = seatId;
};

const putOnBoard = (state: MatchState, seatId: SeatId, cardId: string, row: CatalogRow) => {
  removeEverywhere(state, cardId);
  state.seats[seatId].board[row].units.push(cardId);
  state.cardsById[cardId].zone = { kind: "board_row", seat: seatId, row };
  state.cardsById[cardId].controller = seatId;
};

const findInstanceBySource = (state: MatchState, sourceId: string) => {
  const instance = Object.values(state.cardsById).find((card) => card.sourceId === sourceId);
  if (!instance) {
    throw new Error(`Missing test source ${sourceId}`);
  }
  return instance.instanceId;
};

const testCard = ({
  cardId,
  sourceId,
  printedStrength,
  kind = "unit",
  rows = ["close"],
  abilities = [],
  linkedSourceIds,
  deckLimit = 3,
  name = sourceId,
}: {
  cardId: string;
  sourceId: string;
  printedStrength: number;
  kind?: CatalogCardKind;
  rows?: CatalogRow[];
  abilities?: CatalogAbilityId[];
  linkedSourceIds?: string[];
  deckLimit?: number;
  name?: string;
}): SeatCardSummary => ({
  cardId,
  sourceId,
  name,
  kind,
  printedStrength,
  rows,
  abilities,
  linkedSourceIds,
  deckLimit,
});

const emptyRowTotals = () => ({ close: 0, ranged: 0, siege: 0 });

const baseBoardRows = (rows: Partial<Record<SeatId, Partial<Record<CatalogRow, SeatCardSummary[]>>>> = {}) =>
  (["seat_a", "seat_b"] as const).flatMap((seatId) =>
    ROWS.map((row) => ({
      seatId,
      row,
      units: rows[seatId]?.[row] ?? [],
      horn: null,
    })),
  );

const baseObservation = (overrides: Partial<SeatObservation> = {}): SeatObservation => ({
  seatId: "seat_b",
  opponentSeatId: "seat_a",
  phase: "playing",
  round: 1,
  currentTurn: "seat_b",
  ownFaction: "nilfgaard",
  opponentFaction: "northern_realms",
  ownHand: [],
  ownLeader: {
    leaderCardId: "leader-b",
    sourceId: "leader-b",
    used: false,
    cancelledThisRound: false,
  },
  ownDeckCount: 10,
  ownDiscardCount: 0,
  ownPassed: false,
  ownGems: 2,
  opponentHandCount: 10,
  opponentLeader: {
    leaderCardId: "leader-a",
    sourceId: "leader-a",
    used: false,
    cancelledThisRound: false,
  },
  opponentDeckCount: 10,
  opponentDiscardCount: 0,
  opponentPassed: false,
  opponentGems: 2,
  boardRows: baseBoardRows(),
  weather: [],
  score: {
    totalBySeat: { seat_a: 0, seat_b: 0 },
    rowTotalsBySeat: { seat_a: emptyRowTotals(), seat_b: emptyRowTotals() },
    cards: [],
    activeWeatherEffects: [],
    diagnostics: [],
  },
  pendingPrompt: null,
  ...overrides,
});

// Shared observation helpers for cFp26 and cFp26.1 tests
const nilfgaardObservation = (overrides: Partial<SeatObservation> = {}): SeatObservation =>
  baseObservation({
    ownFaction: "nilfgaard",
    opponentFaction: "northern_realms",
    ...overrides,
  });

const doubleNilfgaardObservation = (overrides: Partial<SeatObservation> = {}): SeatObservation =>
  baseObservation({
    ownFaction: "nilfgaard",
    opponentFaction: "nilfgaard",
    ...overrides,
  });

const policyInput = (
  legalMoves: LegalMove[],
  observationOverrides: Partial<SeatObservation> = {},
): EnginePolicyInput => ({
  seatId: "seat_b",
  observation: baseObservation(observationOverrides),
  legalMoves,
});

const keepMulliganMove = (): LegalMove => ({
  kind: "choose_mulligan",
  moveId: "mulligan:seat_b:none",
  seatId: "seat_b",
  label: "Keep hand",
  cardIds: [],
  metadata: { cardCount: 0, maxCards: 1 },
});

const redrawMove = (card: SeatCardSummary): LegalMove => ({
  kind: "choose_mulligan",
  moveId: `mulligan:seat_b:${card.cardId}`,
  seatId: "seat_b",
  label: "Mulligan 1 card",
  cardIds: [card.cardId],
  metadata: { cardCount: 1, maxCards: 1 },
});

const playMove = (
  card: SeatCardSummary,
  target: LegalMove extends infer T
    ? T extends { kind: "play_card"; target: infer U }
      ? U
      : never
    : never = { kind: "board_row", side: "own", seatId: "seat_b", row: "close" },
): LegalMove => ({
  kind: "play_card",
  moveId: `play:seat_b:${card.cardId}:${target.kind}`,
  seatId: "seat_b",
  label: `Play ${card.name}`,
  sourceCardId: card.cardId,
  sourceId: card.sourceId,
  target,
  metadata: {
    cardName: card.name,
    cardKind: card.kind,
    abilities: card.abilities,
    targetLabel: target.kind,
  },
});

const passMove = (): LegalMove => ({
  kind: "pass",
  moveId: "pass:seat_b",
  seatId: "seat_b",
  label: "Pass",
  target: { kind: "none" },
});

const leaderMove = (
  ability: LegalMove extends infer T
    ? T extends { kind: "use_leader"; metadata: { ability: infer U } }
      ? U
      : never
    : never,
  metadata: Partial<Extract<LegalMove, { kind: "use_leader" }>["metadata"]> = {},
): LegalMove => ({
  kind: "use_leader",
  moveId: `leader:seat_b:leader-b:${String(ability)}`,
  seatId: "seat_b",
  leaderCardId: "leader-b",
  sourceId: "leader-b",
  label: "Use leader",
  target: { kind: "none" },
  metadata: {
    leaderName: "Leader",
    ability,
    abilityStatus: "implemented",
    targetRequirement: "none",
    ...metadata,
  },
});

const rowHornMove = (
  card: SeatCardSummary,
  seatId: SeatId = "seat_b",
  row: CatalogRow = "close",
): LegalMove => ({
  kind: "play_card",
  moveId: `play:${seatId}:${card.cardId}:row_horn:${row}`,
  seatId,
  label: `Play ${card.name} horn on ${row}`,
  sourceCardId: card.cardId,
  sourceId: card.sourceId,
  target: { kind: "row_horn", seatId, row },
  metadata: {
    cardName: card.name,
    cardKind: card.kind,
    abilities: card.abilities,
    targetLabel: `row_horn:${row}`,
  },
});

const promptMove = (
  optionId: string,
  abilityId: string,
  target: Extract<LegalMove, { kind: "choose_prompt_option" }>["target"] = { kind: "none" },
): LegalMove => ({
  kind: "choose_prompt_option",
  moveId: `prompt:test:${optionId}`,
  seatId: "seat_b",
  label: optionId,
  promptId: "prompt:test",
  optionId,
  target,
  metadata: {
    promptKind: target.kind === "card_instance_set" ? "choose_card_set" : "choose_card",
    abilityId,
  },
});

describe("engine AI policy", () => {
  it("resolves only product-safe AI policies for playable matches", () => {
    expect(resolveProductAiPolicyId("legal-heuristic-v0")).toBe("legal-heuristic-v0");
    expect(resolveProductAiPolicyId("legal-heuristic-v1")).toBe("legal-heuristic-v1");
    expect(resolveProductAiPolicyId("unknown")).toBe(DEFAULT_PRODUCT_AI_POLICY_ID);
    expect(resolveProductAiPolicyId("legal-first-v0")).toBe(DEFAULT_PRODUCT_AI_POLICY_ID);
    expect(getProductAiPolicy("legal-heuristic-v0")).toBe(legalHeuristicPolicyV0);
    expect(getProductAiPolicy("legal-heuristic-v1")).toBe(legalHeuristicPolicyV1);
    expect(PRODUCT_AI_POLICIES.map((policy) => policy.id)).toEqual(["legal-heuristic-v0", "legal-heuristic-v1"]);
    expect(PRODUCT_AI_POLICIES.every((policy) => policy.productSelectable)).toBe(true);
  });

  it("builds observations with own hand summaries and opponent hand count only", () => {
    const match = createMatch("ai-observation");

    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });

    expect(observation.ownHand).toHaveLength(10);
    expect(observation.ownHand[0]).toEqual(
      expect.objectContaining({ cardId: expect.any(String), sourceId: expect.any(String), name: expect.any(String) }),
    );
    expect(observation.opponentHandCount).toBe(10);
    expect(JSON.stringify(observation)).not.toContain(match.seats.seat_a.hand[0]);
  });

  it("builds observations with public linked metadata for own hand and visible board cards", () => {
    const match = startMatch({
      seed: "ai-observation-linked",
      seats: [
        {
          seatId: "seat_a",
          playerId: "human",
          controllerKind: "human",
          faction: "northern_realms",
          deckPreset: currentNorthernRealmsDeckPreset,
        },
        {
          seatId: "seat_b",
          playerId: "ai",
          controllerKind: "ai",
          faction: "skellige",
          deckPreset: officialSkelligeStarterDeckPreset,
        },
      ],
      catalog: {
        cards: currentCatalogCards,
        leaders: currentCatalogLeaders,
      },
    }).state;
    const cerys = findInstanceBySource(match, "skellige.cerys");
    const longship = findInstanceBySource(match, "skellige.light-longship");
    putInHand(match, "seat_b", cerys);
    putOnBoard(match, "seat_b", longship, "siege");

    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const handCerys = observation.ownHand.find((card) => card.sourceId === "skellige.cerys");
    const boardLongship = observation.boardRows
      .flatMap((row) => row.units)
      .find((card) => card.sourceId === "skellige.light-longship");

    expect(handCerys?.linkedSourceIds).toEqual(["skellige.clan-drummond-shield-maiden"]);
    expect(handCerys?.deckLimit).toBeGreaterThan(0);
    expect(boardLongship?.linkedSourceIds).toEqual(["skellige.light-longship"]);
    expect(JSON.stringify(observation)).not.toContain(match.seats.seat_a.hand[0]);
  });

  describe("legal-heuristic-v1", () => {
    it("returns null for no legal moves and is deterministic/legal-only", () => {
      const small = testCard({ cardId: "unit-3", sourceId: "test.unit3", printedStrength: 3 });
      const large = testCard({ cardId: "unit-8", sourceId: "test.unit8", printedStrength: 8 });
      const legalMoves = [passMove(), playMove(small), playMove(large)];
      const input = policyInput(legalMoves, { ownHand: [small, large] });

      const first = legalHeuristicPolicyV1.selectMove(input);
      const second = legalHeuristicPolicyV1.selectMove(input);

      expect(legalHeuristicPolicyV1.id).toBe("legal-heuristic-v1");
      expect(legalHeuristicPolicyV1.selectMove({ ...input, legalMoves: [] })).toBeNull();
      expect(second).toEqual(first);
      expect(legalMoves).toContain(first);
    });

    it("mulligans Roach when a muster_roach caller is in hand", () => {
      const geralt = testCard({
        cardId: "geralt",
        sourceId: "neutral.geralt-of-rivia",
        printedStrength: 15,
        kind: "hero",
        abilities: ["muster_roach"],
        linkedSourceIds: ["neutral.roach"],
      });
      const roach = testCard({ cardId: "roach", sourceId: "neutral.roach", printedStrength: 3 });
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([keepMulliganMove(), redrawMove(geralt), redrawMove(roach)], {
          phase: "mulligan",
          ownHand: [geralt, roach],
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ kind: "choose_mulligan", cardIds: ["roach"] }));
    });

    it("mulligans Darkness with base Gaunter but keeps base Gaunter", () => {
      const gaunter = testCard({
        cardId: "gaunter",
        sourceId: "neutral.gaunter-odimm",
        printedStrength: 2,
        abilities: ["muster"],
        linkedSourceIds: ["neutral.gaunter-odimm-darkness"],
      });
      const darkness = testCard({
        cardId: "darkness",
        sourceId: "neutral.gaunter-odimm-darkness",
        printedStrength: 4,
        abilities: ["muster"],
        linkedSourceIds: ["neutral.gaunter-odimm-darkness"],
      });
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([keepMulliganMove(), redrawMove(gaunter), redrawMove(darkness)], {
          phase: "mulligan",
          ownHand: [gaunter, darkness],
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ cardIds: ["darkness"] }));
    });

    it("mulligans extra Darkness only when base Gaunter is absent", () => {
      const darknessA = testCard({
        cardId: "darkness-a",
        sourceId: "neutral.gaunter-odimm-darkness",
        printedStrength: 4,
        abilities: ["muster"],
        linkedSourceIds: ["neutral.gaunter-odimm-darkness"],
      });
      const darknessB = { ...darknessA, cardId: "darkness-b" };
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([keepMulliganMove(), redrawMove(darknessA), redrawMove(darknessB)], {
          phase: "mulligan",
          ownHand: [darknessA, darknessB],
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ cardIds: ["darkness-b"] }));
    });

    it("mulligans same-source Muster duplicates beyond the first copy", () => {
      const longshipA = testCard({
        cardId: "longship-a",
        sourceId: "skellige.light-longship",
        printedStrength: 4,
        abilities: ["muster"],
        linkedSourceIds: ["skellige.light-longship"],
      });
      const longshipB = { ...longshipA, cardId: "longship-b" };
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([keepMulliganMove(), redrawMove(longshipA), redrawMove(longshipB)], {
          phase: "mulligan",
          ownHand: [longshipA, longshipB],
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ cardIds: ["longship-b"] }));
    });

    it("mulligans one-way linked targets while keeping the caller", () => {
      const cerys = testCard({
        cardId: "cerys",
        sourceId: "skellige.cerys",
        printedStrength: 10,
        kind: "hero",
        abilities: ["muster"],
        linkedSourceIds: ["skellige.clan-drummond-shield-maiden"],
      });
      const maiden = testCard({
        cardId: "maiden",
        sourceId: "skellige.clan-drummond-shield-maiden",
        printedStrength: 4,
        abilities: ["tight_bond"],
      });
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([keepMulliganMove(), redrawMove(cerys), redrawMove(maiden)], {
          phase: "mulligan",
          ownHand: [cerys, maiden],
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ cardIds: ["maiden"] }));
    });

    it("keeps hand when only the Muster caller or no redraw target is present", () => {
      const cerys = testCard({
        cardId: "cerys",
        sourceId: "skellige.cerys",
        printedStrength: 10,
        kind: "hero",
        abilities: ["muster"],
        linkedSourceIds: ["skellige.clan-drummond-shield-maiden"],
      });
      const plain = testCard({ cardId: "plain", sourceId: "test.plain", printedStrength: 5 });

      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([keepMulliganMove(), redrawMove(cerys), redrawMove(plain)], {
            phase: "mulligan",
            ownHand: [cerys, plain],
          }),
        ),
      ).toEqual(expect.objectContaining({ cardIds: [] }));
    });

    it("improves prompt ranking for Medic, discard/draw, restore, acknowledgement, and fallback prompts", () => {
      const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
      const brute = testCard({ cardId: "brute", sourceId: "test.brute", printedStrength: 10 });
      const weak = testCard({ cardId: "weak", sourceId: "test.weak", printedStrength: 1 });
      const hero = testCard({ cardId: "hero", sourceId: "test.hero", printedStrength: 10, kind: "hero" });
      const medicInput = policyInput(
        [
          promptMove("revive:brute", "medic", {
            kind: "card_instance",
            side: "own",
            seatId: "seat_b",
            cardId: brute.cardId,
            row: "close",
          }),
          promptMove("revive:spy", "medic", {
            kind: "card_instance",
            side: "own",
            seatId: "seat_b",
            cardId: spy.cardId,
            row: "close",
          }),
        ],
        {
          pendingPrompt: {
            promptId: "prompt:test",
            seatId: "seat_b",
            kind: "medic_revive",
            abilityId: "medic",
            options: [
              { optionId: "revive:brute", label: "brute", targetCard: brute, targetStrength: 10 },
              { optionId: "revive:spy", label: "spy", targetCard: spy, targetStrength: 4 },
            ],
          },
        },
      );
      expect(legalHeuristicPolicyV1.selectMove(medicInput)).toEqual(
        expect.objectContaining({ optionId: "revive:spy" }),
      );

      const discardInput = policyInput(
        [
          promptMove("discard:weak", "discard_two_draw_one_from_deck", {
            kind: "card_instance_set",
            side: "own",
            seatId: "seat_b",
            cardIds: [weak.cardId],
          }),
          promptMove("discard:hero", "discard_two_draw_one_from_deck", {
            kind: "card_instance_set",
            side: "own",
            seatId: "seat_b",
            cardIds: [hero.cardId],
          }),
        ],
        {
          ownHand: [weak, hero],
          pendingPrompt: {
            promptId: "prompt:test",
            seatId: "seat_b",
            kind: "choose_card_set",
            abilityId: "discard_two_draw_one_from_deck",
            options: [
              { optionId: "discard:weak", label: "weak", targetCards: [weak], targetStrength: 1 },
              { optionId: "discard:hero", label: "hero", targetCards: [hero], targetStrength: 10 },
            ],
          },
        },
      );
      expect(legalHeuristicPolicyV1.selectMove(discardInput)).toEqual(
        expect.objectContaining({ optionId: "discard:weak" }),
      );

      const deckInput = policyInput(
        [
          promptMove("draw:weak", "discard_two_draw_one_from_deck", {
            kind: "deck_card_instance",
            side: "own",
            seatId: "seat_b",
            cardId: weak.cardId,
          }),
          promptMove("draw:hero", "discard_two_draw_one_from_deck", {
            kind: "deck_card_instance",
            side: "own",
            seatId: "seat_b",
            cardId: hero.cardId,
          }),
        ],
        {
          pendingPrompt: {
            promptId: "prompt:test",
            seatId: "seat_b",
            kind: "choose_card",
            abilityId: "discard_two_draw_one_from_deck",
            options: [
              { optionId: "draw:weak", label: "weak", targetCard: weak, targetStrength: 1 },
              { optionId: "draw:hero", label: "hero", targetCard: hero, targetStrength: 10 },
            ],
          },
        },
      );
      expect(legalHeuristicPolicyV1.selectMove(deckInput)).toEqual(expect.objectContaining({ optionId: "draw:hero" }));

      const restoreInput = policyInput(
        [
          promptMove("restore:weak", "restore_discard_to_hand", {
            kind: "card_instance",
            side: "own",
            seatId: "seat_b",
            cardId: weak.cardId,
          }),
          promptMove("restore:hero", "restore_discard_to_hand", {
            kind: "card_instance",
            side: "own",
            seatId: "seat_b",
            cardId: hero.cardId,
          }),
        ],
        {
          pendingPrompt: {
            promptId: "prompt:test",
            seatId: "seat_b",
            kind: "choose_card",
            abilityId: "restore_discard_to_hand",
            options: [
              { optionId: "restore:weak", label: "weak", targetCard: weak, targetStrength: 1 },
              { optionId: "restore:hero", label: "hero", targetCard: hero, targetStrength: 10 },
            ],
          },
        },
      );
      expect(legalHeuristicPolicyV1.selectMove(restoreInput)).toEqual(
        expect.objectContaining({ optionId: "restore:hero" }),
      );

      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([promptMove("ack:second", "look_three_cards"), promptMove("ack:first", "look_three_cards")], {
            pendingPrompt: {
              promptId: "prompt:test",
              seatId: "seat_b",
              kind: "choose_option",
              abilityId: "look_three_cards",
              options: [
                { optionId: "ack:second", label: "second" },
                { optionId: "ack:first", label: "first" },
              ],
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ optionId: "ack:second" }));

      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([promptMove("unknown:low", "unknown"), promptMove("unknown:high", "unknown")], {
            pendingPrompt: {
              promptId: "prompt:test",
              seatId: "seat_b",
              kind: "choose_card",
              abilityId: "unknown",
              options: [
                { optionId: "unknown:low", label: "low", targetStrength: 1 },
                { optionId: "unknown:high", label: "high", targetStrength: 9 },
              ],
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ optionId: "unknown:high" }));
    });

    it("uses pass and last-gem strategy around opponent pass states", () => {
      const cheap = testCard({ cardId: "cheap", sourceId: "test.cheap", printedStrength: 3 });
      const large = testCard({ cardId: "large", sourceId: "test.large", printedStrength: 10 });
      const impossible = testCard({ cardId: "small", sourceId: "test.small", printedStrength: 2 });

      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([passMove(), playMove(large)], {
            ownHand: [large],
            opponentPassed: true,
            score: {
              ...baseObservation().score,
              totalBySeat: { seat_a: 5, seat_b: 6 },
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ kind: "pass" }));

      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([passMove(), playMove(cheap), playMove(large)], {
            ownHand: [cheap, large],
            opponentPassed: true,
            score: {
              ...baseObservation().score,
              totalBySeat: { seat_a: 2, seat_b: 0 },
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ sourceCardId: "cheap" }));

      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([passMove(), playMove(impossible)], {
            ownHand: [impossible],
            opponentPassed: true,
            score: {
              ...baseObservation().score,
              totalBySeat: { seat_a: 20, seat_b: 0 },
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ kind: "pass" }));

      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([passMove(), playMove(impossible)], {
            ownHand: [impossible],
            ownGems: 1,
            score: {
              ...baseObservation().score,
              totalBySeat: { seat_a: 20, seat_b: 0 },
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ kind: "pass" }));

      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([passMove(), playMove(large)], {
            ownHand: [large],
            ownGems: 1,
            score: {
              ...baseObservation().score,
              totalBySeat: { seat_a: 5, seat_b: 0 },
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ sourceCardId: "large" }));
    });

    it("does not pass on last gem just because it is ahead while opponent has a large hand", () => {
      const useful = testCard({ cardId: "useful-last-gem", sourceId: "test.useful.last-gem", printedStrength: 8 });
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([passMove(), playMove(useful)], {
          ownHand: [useful],
          ownGems: 1,
          opponentHandCount: 9,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 24 },
          },
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: useful.cardId }));
    });

    it("does not pass in the round-one large-opponent-hand playtest shape", () => {
      const useful = testCard({ cardId: "useful-round-one", sourceId: "test.useful.round-one", printedStrength: 7 });
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([passMove(), playMove(useful)], {
          ownHand: [useful],
          ownGems: 2,
          opponentHandCount: 12,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 5, seat_b: 31 },
          },
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: useful.cardId }));
    });

    it("still passes when the opponent has already passed and v1 is ahead", () => {
      const useful = testCard({ cardId: "useful-vs-passed", sourceId: "test.useful.vs-passed", printedStrength: 8 });
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([passMove(), playMove(useful)], {
          ownHand: [useful],
          opponentPassed: true,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 5, seat_b: 10 },
          },
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
    });

    it("still passes on last gem when the visible upper bound cannot catch up", () => {
      const impossible = testCard({ cardId: "tiny-last-gem", sourceId: "test.tiny.last-gem", printedStrength: 2 });
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([passMove(), playMove(impossible)], {
          ownHand: [impossible],
          ownGems: 1,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 20, seat_b: 0 },
          },
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
    });

    it("still voluntarily passes with a lead beyond the hand-pressure threshold", () => {
      const useful = testCard({ cardId: "useful-safe-lead", sourceId: "test.useful.safe-lead", printedStrength: 8 });
      const selected = legalHeuristicPolicyV1.selectMove(
        policyInput([passMove(), playMove(useful)], {
          ownHand: [useful],
          opponentHandCount: 2,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 31 },
          },
        }),
      );

      expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
    });

    it("counts visible linked Muster hand targets when deciding catch-up", () => {
      const caller = testCard({
        cardId: "caller",
        sourceId: "test.muster.caller",
        printedStrength: 2,
        abilities: ["muster"],
        linkedSourceIds: ["test.muster.target"],
      });
      const target = testCard({
        cardId: "target",
        sourceId: "test.muster.target",
        printedStrength: 4,
      });

      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([passMove(), playMove(caller)], {
            ownHand: [caller, target],
            ownGems: 1,
            opponentPassed: true,
            score: {
              ...baseObservation().score,
              totalBySeat: { seat_a: 5, seat_b: 0 },
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ sourceCardId: "caller" }));
    });

    it("prefers spies and avoids harmful weather or self-harming Scorch", () => {
      const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
      const hero = testCard({ cardId: "hero", sourceId: "test.hero", printedStrength: 10, kind: "hero" });
      expect(
        legalHeuristicPolicyV1.selectMove(policyInput([passMove(), playMove(hero), playMove(spy)], { ownHand: [hero, spy] })),
      ).toEqual(expect.objectContaining({ sourceCardId: "spy" }));

      const frost = testCard({
        cardId: "frost",
        sourceId: "neutral.biting-frost",
        printedStrength: 0,
        kind: "special",
        abilities: ["frost"],
      });
      const unit = testCard({ cardId: "unit", sourceId: "test.unit", printedStrength: 5 });
      const ownClose = testCard({ cardId: "own-close", sourceId: "test.own.close", printedStrength: 8 });
      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput(
            [passMove(), playMove(frost, { kind: "weather" }), playMove(unit)],
            {
              ownHand: [frost, unit],
              boardRows: baseBoardRows({ seat_b: { close: [ownClose] } }),
            },
          ),
        ),
      ).toEqual(expect.objectContaining({ sourceCardId: "unit" }));

      const scorch = testCard({
        cardId: "scorch",
        sourceId: "neutral.scorch",
        printedStrength: 0,
        kind: "special",
        abilities: ["scorch"],
      });
      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([passMove(), playMove(scorch, { kind: "none" }), playMove(unit)], {
            ownHand: [scorch, unit],
            score: {
              ...baseObservation().score,
              cards: [
                {
                  cardId: "own-high",
                  sourceId: "test.own.high",
                  seatId: "seat_b",
                  row: "close",
                  cardKind: "unit",
                  isUnit: true,
                  isHero: false,
                  printedStrength: 12,
                  afterWeather: 12,
                  spyMultiplier: 1,
                  afterSpyMultiplier: 12,
                  tightBondMultiplier: 1,
                  afterTightBond: 12,
                  moraleBonus: 0,
                  afterMorale: 12,
                  hornMultiplier: 1,
                  finalStrength: 12,
                  eligibleForScorch: true,
                  modifiers: [],
                },
                {
                  cardId: "opp-low",
                  sourceId: "test.opp.low",
                  seatId: "seat_a",
                  row: "close",
                  cardKind: "unit",
                  isUnit: true,
                  isHero: false,
                  printedStrength: 8,
                  afterWeather: 8,
                  spyMultiplier: 1,
                  afterSpyMultiplier: 8,
                  tightBondMultiplier: 1,
                  afterTightBond: 8,
                  moraleBonus: 0,
                  afterMorale: 8,
                  hornMultiplier: 1,
                  finalStrength: 8,
                  eligibleForScorch: true,
                  modifiers: [],
                },
              ],
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ sourceCardId: "unit" }));
    });

    it("scores leader moves by visible usefulness instead of firing blindly", () => {
      expect(
        legalHeuristicPolicyV1.selectMove(policyInput([passMove(), leaderMove("clear_weather")], { weather: [] })),
      ).toEqual(expect.objectContaining({ kind: "pass" }));

      const frost = testCard({
        cardId: "weather",
        sourceId: "neutral.biting-frost",
        printedStrength: 0,
        kind: "special",
        abilities: ["frost"],
      });
      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([passMove(), leaderMove("clear_weather")], {
            weather: [frost],
            score: {
              ...baseObservation().score,
              cards: [
                {
                  cardId: "own-weathered",
                  sourceId: "test.own.weathered",
                  seatId: "seat_b",
                  row: "close",
                  cardKind: "unit",
                  isUnit: true,
                  isHero: false,
                  printedStrength: 8,
                  afterWeather: 1,
                  spyMultiplier: 1,
                  afterSpyMultiplier: 1,
                  tightBondMultiplier: 1,
                  afterTightBond: 8,
                  moraleBonus: 0,
                  afterMorale: 1,
                  hornMultiplier: 1,
                  finalStrength: 1,
                  eligibleForScorch: false,
                  modifiers: ["weather:frost"],
                },
              ],
            },
          }),
        ),
      ).toEqual(expect.objectContaining({ kind: "use_leader", metadata: expect.objectContaining({ ability: "clear_weather" }) }));
    });
  });

  it("converts every supported legal move kind into the exact command payload", () => {
    const moves: LegalMove[] = [
      {
        kind: "choose_mulligan",
        moveId: "mulligan:seat_b:none",
        seatId: "seat_b",
        label: "Keep hand",
        cardIds: ["c1"],
        metadata: { cardCount: 1, maxCards: 1 },
      },
      {
        kind: "play_card",
        moveId: "play:seat_b:c3:weather",
        seatId: "seat_b",
        label: "Play weather",
        sourceCardId: "c3",
        sourceId: "neutral.biting-frost",
        target: { kind: "weather" },
        metadata: { cardName: "Biting Frost", cardKind: "special", abilities: ["frost"], targetLabel: "weather" },
      },
      { kind: "pass", moveId: "pass:seat_b", seatId: "seat_b", label: "Pass", target: { kind: "none" } },
      {
        kind: "use_leader",
        moveId: "leader:seat_b:l1:clear_weather",
        seatId: "seat_b",
        label: "Use leader",
        leaderCardId: "l1",
        sourceId: "leader",
        target: { kind: "none" },
        metadata: {
          leaderName: "Leader",
          ability: "clear_weather",
          abilityStatus: "implemented",
          targetRequirement: "none",
        },
      },
      {
        kind: "choose_prompt_option",
        moveId: "prompt:p1:o1",
        seatId: "seat_b",
        label: "Choose",
        promptId: "p1",
        optionId: "o1",
        target: { kind: "card_instance", side: "own", seatId: "seat_b", cardId: "c4", row: "siege" },
        metadata: { promptKind: "medic_revive", abilityId: "medic", sourceCardId: "c5" },
      },
      {
        kind: "resolve_round_end",
        moveId: "resolve-round-end:1",
        seatId: "seat_b",
        label: "Resolve",
        target: { kind: "none" },
      },
    ];

    expect(moves.map(commandFromLegalMove)).toEqual([
      { type: "ChooseMulligan", seatId: "seat_b", cardIds: ["c1"] },
      { type: "PlayCard", seatId: "seat_b", cardId: "c3", target: { kind: "weather" } },
      { type: "Pass", seatId: "seat_b" },
      { type: "UseLeader", seatId: "seat_b", target: { kind: "none" } },
      { type: "ChoosePromptOption", seatId: "seat_b", promptId: "p1", optionId: "o1" },
      { type: "ResolveRoundEnd", seatId: "seat_b" },
    ]);
  });

  it("returns null with no legal moves and chooses zero-card mulligan when available", () => {
    const match = createMatch("ai-empty-mulligan");
    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const legalMoves = getMoves(match, "seat_b");

    expect(legalHeuristicPolicyV0.selectMove({ seatId: "seat_b", observation, legalMoves: [] })).toBeNull();
    expect(legalHeuristicPolicyV0.selectMove({ seatId: "seat_b", observation, legalMoves })).toEqual(
      expect.objectContaining({ kind: "choose_mulligan", cardIds: [] }),
    );
  });

  it("chooses legal play_card moves over pass for both seats when not already ahead of a passed opponent", () => {
    (["seat_a", "seat_b"] as const).forEach((seatId) => {
      const match = createMatch(`ai-seat-neutral-${seatId}`);
      match.phase = "playing";
      match.currentTurn = seatId;
      match.seats.seat_a.mulliganComplete = true;
      match.seats.seat_b.mulliganComplete = true;

      const observation = buildSeatObservation({
        state: match,
        seatId,
        catalogCards: currentCatalogCards,
        catalogLeaders: currentCatalogLeaders,
      });
      const legalMoves = getMoves(match, seatId);
      const selected = legalHeuristicPolicyV0.selectMove({ seatId, observation, legalMoves });

      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", seatId }));
    });
  });

  it("chooses pass when the opponent has passed and the acting seat is ahead", () => {
    const match = createMatch("ai-pass-ahead");
    match.phase = "playing";
    match.currentTurn = "seat_b";
    match.seats.seat_a.mulliganComplete = true;
    match.seats.seat_b.mulliganComplete = true;
    match.seats.seat_a.passed = true;
    // Pick the strongest card currently in seat_b's hand so the heuristic
    // treats seat_b as clearly ahead. The previous test relied on `hand[0]`
    // being strong enough, but cCp13's added Roach reshuffled the deal and
    // sometimes leaves a small unit in slot 0. Choosing the maximum-strength
    // hand card keeps the lead unambiguous and makes the test deck-shape
    // independent.
    const strongCardId = match.seats.seat_b.hand
      .slice()
      .sort((aId, bId) => {
        const aSource = currentCatalogCards.find((card) => card.sourceId === match.cardsById[aId].sourceId);
        const bSource = currentCatalogCards.find((card) => card.sourceId === match.cardsById[bId].sourceId);
        return (bSource?.strength ?? 0) - (aSource?.strength ?? 0);
      })[0];
    match.seats.seat_b.hand = match.seats.seat_b.hand.filter((cardId) => cardId !== strongCardId);
    match.seats.seat_b.board.close.units.push(strongCardId);
    match.cardsById[strongCardId].zone = { kind: "board_row", seat: "seat_b", row: "close" };

    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const selected = legalHeuristicPolicyV0.selectMove({
      seatId: "seat_b",
      observation,
      legalMoves: getMoves(match, "seat_b"),
    });

    expect(selected).toEqual(expect.objectContaining({ kind: "pass", seatId: "seat_b" }));
  });

  it("chooses the strongest deterministic prompt option for an AI-owned prompt", () => {
    const match = createMatch("ai-prompt");
    const highTarget = Object.values(match.cardsById).find((card) => card.sourceId === "nilfgaard.tibor-eggebracht")!;
    const lowTarget = Object.values(match.cardsById).find((card) => card.sourceId === "nilfgaard.young-emissary")!;
    match.phase = "playing";
    match.pendingPrompt = {
      promptId: "prompt:ai:medic",
      seatId: "seat_b",
      kind: "medic_revive",
      sourceCardId: match.seats.seat_b.hand[0],
      sourceId: match.cardsById[match.seats.seat_b.hand[0]].sourceId,
      abilityId: "medic",
      options: [
        {
          optionId: "revive:low",
          label: "Low",
          target: { kind: "card_instance", cardId: lowTarget.instanceId, sourceId: lowTarget.sourceId, row: "close" },
        },
        {
          optionId: "revive:high",
          label: "High",
          target: { kind: "card_instance", cardId: highTarget.instanceId, sourceId: highTarget.sourceId, row: "siege" },
        },
      ],
    };

    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const selected = legalHeuristicPolicyV0.selectMove({
      seatId: "seat_b",
      observation,
      legalMoves: getMoves(match, "seat_b"),
    }) as ChoosePromptOptionMove;

    expect(selected.kind).toBe("choose_prompt_option");
    expect(selected.optionId).toBe("revive:high");
  });

  it("is deterministic for the same input", () => {
    const match = createMatch("ai-deterministic");
    match.phase = "playing";
    match.currentTurn = "seat_b";
    match.seats.seat_a.mulliganComplete = true;
    match.seats.seat_b.mulliganComplete = true;
    const observation = buildSeatObservation({
      state: match,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const legalMoves = getMoves(match, "seat_b");

    const first = legalHeuristicPolicyV0.selectMove({ seatId: "seat_b", observation, legalMoves });
    const second = legalHeuristicPolicyV0.selectMove({ seatId: "seat_b", observation, legalMoves });

    expect(second).toEqual(first);
  });

  it("controller does not dispatch when blocked and only returns commands derived from AI legal moves", () => {
    const store = createTestStore();
    expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a").command).toBeNull();

    store.dispatch(startEngineMatch({ seed: "ai-controller" }));
    expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a").command).toBeNull();

    completeMulligans(store);
    const match = store.getState().engine.match!;
    if (match.currentTurn === "seat_a") {
      expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a").command).toBeNull();
      store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: "seat_a" }));
    }

    const legalMoves = selectEngineLegalMovesForAi(store.getState());
    const result = getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a");
    expect(result.command).not.toBeNull();
    expect(
      legalMoves.some((move) => JSON.stringify(commandFromLegalMove(move)) === JSON.stringify(result.command)),
    ).toBe(true);
  });

  it("controller delegates to the selected product policy from adapter state", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "ai-controller-policy-v1", aiPolicyId: "legal-heuristic-v1" }));
    completeMulligans(store);
    if (store.getState().engine.match?.currentTurn === "seat_a") {
      store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: "seat_a" }));
    }

    const engine = store.getState().engine;
    const legalMoves = selectEngineLegalMovesForAi(store.getState());
    const observation = buildSeatObservation({
      state: engine.match!,
      seatId: "seat_b",
      catalogCards: engine.runtimeCatalog.cards,
      catalogLeaders: engine.runtimeCatalog.leaders,
    });
    const selected = legalHeuristicPolicyV1.selectMove({ seatId: "seat_b", observation, legalMoves });

    expect(engine.aiPolicyId).toBe("legal-heuristic-v1");
    const v1Result = getLegalHeuristicAiCommand(engine, "seat_b", "seat_a");
    expect(v1Result.command).toEqual(
      selected ? commandFromLegalMove(selected) : null,
    );
  });

  it("controller falls back to the default product policy for malformed adapter policy ids", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "ai-controller-policy-fallback" }));
    completeMulligans(store);
    if (store.getState().engine.match?.currentTurn === "seat_a") {
      store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: "seat_a" }));
    }

    const engine = store.getState().engine;
    const legalMoves = selectEngineLegalMovesForAi(store.getState());
    const observation = buildSeatObservation({
      state: engine.match!,
      seatId: "seat_b",
      catalogCards: engine.runtimeCatalog.cards,
      catalogLeaders: engine.runtimeCatalog.leaders,
    });
    const selected = legalHeuristicPolicyV0.selectMove({ seatId: "seat_b", observation, legalMoves });

    expect(
      getLegalHeuristicAiCommand(
        { ...engine, aiPolicyId: "legal-first-v0" as never },
        "seat_b",
        "seat_a",
      ).command,
    ).toEqual(selected ? commandFromLegalMove(selected) : null);
  });

  it("Redux flow lets AI choose and dispatch a legal card play that updates hand, board, and events", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "ai-redux-flow" }));
    completeMulligans(store);
    if (store.getState().engine.match?.currentTurn === "seat_a") {
      store.dispatch(dispatchEngineCommand({ type: "Pass", seatId: "seat_a" }));
    }

    const result = getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a");
    expect(result.command).toEqual(expect.objectContaining({ type: "PlayCard", seatId: "seat_b" }));
    const cardId = result.command && result.command.type === "PlayCard" ? result.command.cardId : null;

    store.dispatch(dispatchEngineCommand(result.command!));

    const state = store.getState();
    expect(cardId).toBeTruthy();
    expect(state.engine.match?.seats.seat_b.hand).not.toContain(cardId);
    expect(state.engine.lastTransactionEvents.some((event) => event.type === "card_played")).toBe(true);
    const onBoard = Object.values(state.engine.match!.seats).some((seat) =>
      Object.values(seat.board).some((row) => row.units.includes(cardId!)),
    );
    expect(onBoard || state.engine.match!.weather.entries.includes(cardId!)).toBe(true);
  });

  it("controller ignores game end, adapter locks, human prompts, and human playing turns", () => {
    const store = createTestStore();
    store.dispatch(startEngineMatch({ seed: "ai-controller-blocks" }));
    completeMulligans(store);
    const base = structuredClone(store.getState().engine.match!);
    base.phase = "playing";
    base.currentTurn = "seat_a";
    store.dispatch(engineCommandApplied({ command: { type: "Pass", seatId: "seat_b" }, match: base, events: [], sequence: 3 }));
    expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a").command).toBeNull();

    const humanPrompt = structuredClone(base);
    humanPrompt.currentTurn = "seat_b";
    humanPrompt.pendingPrompt = {
      promptId: "prompt:human",
      seatId: "seat_a",
      kind: "choose_card",
      abilityId: "test",
      options: [],
    };
    store.dispatch(
      engineCommandApplied({ command: { type: "Pass", seatId: "seat_a" }, match: humanPrompt, events: [], sequence: 4 }),
    );
    expect(getLegalHeuristicAiCommand(store.getState().engine, "seat_b", "seat_a").command).toBeNull();

    expect(
      getLegalHeuristicAiCommand(
        { ...store.getState().engine, status: "ai_thinking", lock: { kind: "ai_thinking", sinceSequence: 5 } },
        "seat_b",
        "seat_a",
      ).command,
    ).toBeNull();

    const gameEnd = structuredClone(base);
    gameEnd.phase = "game_end";
    gameEnd.currentTurn = "seat_b";
    gameEnd.pendingPrompt = null;
    expect(getLegalHeuristicAiCommand({ match: gameEnd, status: "ready", lock: null }, "seat_b", "seat_a").command).toBeNull();
  });

  it("controller can resolve an AI-owned prompt through the prompt lock", () => {
    const match = createMatch("ai-controller-prompt");
    const highTarget = Object.values(match.cardsById).find((card) => card.sourceId === "nilfgaard.tibor-eggebracht")!;
    match.phase = "playing";
    match.currentTurn = "seat_b";
    match.pendingPrompt = {
      promptId: "prompt:ai:controller",
      seatId: "seat_b",
      kind: "choose_card",
      sourceCardId: match.seats.seat_b.hand[0],
      sourceId: match.cardsById[match.seats.seat_b.hand[0]].sourceId,
      abilityId: "test",
      options: [
        {
          optionId: "pick:high",
          label: "Pick high",
          target: { kind: "card_instance", cardId: highTarget.instanceId, sourceId: highTarget.sourceId, row: "siege" },
        },
      ],
    };

    expect(
      getLegalHeuristicAiCommand(
        {
          match,
          status: "awaiting_prompt",
          lock: { kind: "prompt", owner: "seat_b", promptId: "prompt:ai:controller", sinceSequence: 1 },
        },
        "seat_b",
        "seat_a",
      ).command,
    ).toEqual({
      type: "ChoosePromptOption",
      seatId: "seat_b",
      promptId: "prompt:ai:controller",
      optionId: "pick:high",
    });
  });
});

describe("cFp25: AI decision trace", () => {
  it("explainLegalHeuristicV1Decision returns the same move as selectMove for mulligan", () => {
    const roach = testCard({ cardId: "roach", sourceId: "neutral.roach", printedStrength: 3 });
    const geralt = testCard({
      cardId: "geralt",
      sourceId: "neutral.geralt-of-rivia",
      printedStrength: 15,
      kind: "hero",
      abilities: ["muster_roach"],
      linkedSourceIds: ["neutral.roach"],
    });

    const input = policyInput(
      [keepMulliganMove(), redrawMove(geralt), redrawMove(roach)],
      { phase: "mulligan", ownHand: [geralt, roach] },
    );

    const { move: tracedMove } = (
      explainLegalHeuristicV1Decision(input)
    ) as { move: LegalMove | null };
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);

    expect(tracedMove).toEqual(selectedMove);
    expect(tracedMove?.kind).toBe("choose_mulligan");
  });

  it("explainLegalHeuristicV1Decision returns the same move as selectMove for play card", () => {
    const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
    const unit = testCard({ cardId: "unit", sourceId: "test.unit", printedStrength: 5 });

    const input = policyInput(
      [passMove(), playMove(spy), playMove(unit)],
      { ownHand: [spy, unit] },
    );

    const { move: tracedMove } = (
      explainLegalHeuristicV1Decision(input)
    ) as { move: LegalMove | null };
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);

    expect(tracedMove).toEqual(selectedMove);
    expect(tracedMove?.kind).toBe("play_card");
  });

  it("explainLegalHeuristicV1Decision returns the same move as selectMove for pass", () => {
    const large = testCard({ cardId: "large", sourceId: "test.large", printedStrength: 10 });

    const input = policyInput(
      [passMove(), playMove(large)],
      {
        ownHand: [large],
        opponentPassed: true,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 10 },
        },
      },
    );

    const { move: tracedMove } = (
      explainLegalHeuristicV1Decision(input)
    ) as { move: LegalMove | null };
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);

    expect(tracedMove).toEqual(selectedMove);
    expect(tracedMove?.kind).toBe("pass");
  });

  it("explainLegalHeuristicV1Decision returns the same move as selectMove for leader move", () => {
    const frost = testCard({
      cardId: "weather",
      sourceId: "neutral.biting-frost",
      printedStrength: 0,
      kind: "special",
      abilities: ["frost"],
    });

    const input = policyInput(
      [passMove(), leaderMove("clear_weather")],
      {
        weather: [frost],
        score: {
          ...baseObservation().score,
          cards: [
            {
              cardId: "own-weathered",
              sourceId: "test.own.weathered",
              seatId: "seat_b",
              row: "close",
              cardKind: "unit",
              isUnit: true,
              isHero: false,
              printedStrength: 8,
              afterWeather: 1,
              spyMultiplier: 1,
              afterSpyMultiplier: 1,
              tightBondMultiplier: 1,
              afterTightBond: 8,
              moraleBonus: 0,
              afterMorale: 1,
              hornMultiplier: 1,
              finalStrength: 1,
              eligibleForScorch: false,
              modifiers: ["weather:frost"],
            },
          ],
        },
      },
    );

    const { move: tracedMove } = (
      explainLegalHeuristicV1Decision(input)
    ) as { move: LegalMove | null };
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);

    expect(tracedMove).toEqual(selectedMove);
    expect(tracedMove?.kind).toBe("use_leader");
  });

  it("explainLegalHeuristicV1Decision returns the same move as selectMove for prompt", () => {
    const brute = testCard({ cardId: "brute", sourceId: "test.brute", printedStrength: 10 });

    const input = policyInput(
      [promptMove("revive:brute", "medic", {
        kind: "card_instance",
        side: "own",
        seatId: "seat_b",
        cardId: brute.cardId,
        row: "close",
      })],
      {
        pendingPrompt: {
          promptId: "prompt:test",
          seatId: "seat_b",
          kind: "medic_revive",
          abilityId: "medic",
          options: [{ optionId: "revive:brute", label: "brute", targetCard: brute, targetStrength: 10 }],
        },
      },
    );

    const { move: tracedMove } = (
      explainLegalHeuristicV1Decision(input)
    ) as { move: LegalMove | null };
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);

    expect(tracedMove).toEqual(selectedMove);
    expect(tracedMove?.kind).toBe("choose_prompt_option");
  });

  it("selected prompt optionRef does not copy raw optionId with hidden instance tokens", () => {
    const rawOptionId = "revive:seat_b:001:hidden:siege";
    const brute = testCard({ cardId: "hidden-card", sourceId: "test.hidden-card", printedStrength: 10 });

    const input = policyInput(
      [
        promptMove(rawOptionId, "medic", {
          kind: "card_instance",
          side: "own",
          seatId: "seat_b",
          cardId: brute.cardId,
          row: "siege",
        }),
      ],
      {
        pendingPrompt: {
          promptId: "prompt:test",
          seatId: "seat_b",
          kind: "medic_revive",
          abilityId: "medic",
          options: [
            {
              optionId: rawOptionId,
              label: "hidden revive option",
              targetCard: brute,
              targetStrength: 10,
            },
          ],
        },
      },
    );

    const { trace, move: tracedMove } = (
      explainLegalHeuristicV1Decision(input)
    ) as { trace: import("@/game/ai").AiDecisionTrace; move: LegalMove | null };

    expect(tracedMove).toEqual(legalHeuristicPolicyV1.selectMove(input));
    expect(trace.selected?.kind).toBe("choose_prompt_option");
    expect(trace.selected?.optionRef).toBe("option_0");

    const traceJson = JSON.stringify(trace);
    expect(traceJson).not.toContain(rawOptionId);
    expect(traceJson).not.toContain("seat_b:");
    expect(traceJson).not.toContain("revive:");
  });

  it("explainLegalHeuristicV1Decision returns the same move as selectMove for resolve_round_end", () => {
    const input = policyInput(
      [{ kind: "resolve_round_end", moveId: "resolve-round-end:1", seatId: "seat_b", label: "Resolve", target: { kind: "none" } }],
    );

    const { move: tracedMove } = (
      explainLegalHeuristicV1Decision(input)
    ) as { move: LegalMove | null };
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);

    expect(tracedMove).toEqual(selectedMove);
    expect(tracedMove?.kind).toBe("resolve_round_end");
  });

  it("last-gem pass-safety trace includes ownGems, opponentHandCount, score delta, pressure/required-lead", () => {
    const useful = testCard({ cardId: "useful", sourceId: "test.useful", printedStrength: 8 });

    const input = policyInput(
      [passMove(), playMove(useful)],
      {
        ownHand: [useful],
        ownGems: 1,
        opponentHandCount: 5,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 0, seat_b: 24 },
        },
      },
    );

    const { trace } = (
      explainLegalHeuristicV1Decision(input)
    ) as { trace: import("@/game/ai").AiDecisionTrace };

    expect(trace.schemaVersion).toBe("ai-decision-trace-v1");
    expect(trace.publicState.ownGems).toBe(1);
    expect(trace.publicState.opponentHandCount).toBe(5);
    expect(trace.passAnalysis).not.toBeNull();
    expect(trace.passAnalysis?.ownGems ?? trace.passAnalysis?.isLastGem).toBeDefined();
    expect(trace.passAnalysis?.scoreDelta).toBe(24);
    expect(trace.passAnalysis?.opponentHandPressure).toBeGreaterThan(0);
    expect(trace.passAnalysis?.requiredLead).toBeGreaterThan(0);
  });

  it("last-gem pass analysis uses total v1 reachable score, not tempo-only score", () => {
    const useful = testCard({ cardId: "useful", sourceId: "test.useful", printedStrength: 8 });
    const ownScore = 10;
    const opponentScore = 15;

    const input = policyInput(
      [passMove(), playMove(useful)],
      {
        ownHand: [useful],
        ownGems: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: opponentScore, seat_b: ownScore },
        },
      },
    );
    const features = buildLegalHeuristicV1Features(input);
    const v1TempoUpperBound = uniqueCardTempoUpperBound(features);

    expect(opponentScore).toBeGreaterThan(v1TempoUpperBound);
    expect(opponentScore).toBeLessThan(ownScore + v1TempoUpperBound);

    const { trace } = (
      explainLegalHeuristicV1Decision(input)
    ) as { trace: import("@/game/ai").AiDecisionTrace };

    expect(trace.passAnalysis?.lastGemSurrenderAllowed).toBe(false);
    expect(trace.passAnalysis?.policyLastGemUpperBound).toBe(ownScore + v1TempoUpperBound);
  });

  it("opponent-passed safe pass trace records pass as selected and explains opponent-passed/ahead", () => {
    const useful = testCard({ cardId: "useful", sourceId: "test.useful", printedStrength: 8 });

    const input = policyInput(
      [passMove(), playMove(useful)],
      {
        ownHand: [useful],
        opponentPassed: true,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 10 },
        },
      },
    );

    const { move: tracedMove, trace } = (
      explainLegalHeuristicV1Decision(input)
    ) as { move: LegalMove | null; trace: import("@/game/ai").AiDecisionTrace };

    expect(tracedMove?.kind).toBe("pass");
    expect(trace.selected?.kind).toBe("pass");
    expect(trace.reason).toContain("opponent passed");
  });

  it("candidate summaries are fully redacted for AI hand and use safe actionRef", () => {
    const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
    const unit = testCard({ cardId: "unit", sourceId: "test.unit", printedStrength: 5 });

    const input = policyInput(
      [passMove(), playMove(spy), playMove(unit)],
      { ownHand: [spy, unit] },
    );

    const { trace, move: tracedMove } = (
      explainLegalHeuristicV1Decision(input)
    ) as { trace: import("@/game/ai").AiDecisionTrace; move: LegalMove | null };

    // The trace should contain candidates (play moves).
    // All play_card candidates must be redacted to "hidden hand play".
    const traceJson = JSON.stringify(trace);
    expect(traceJson).not.toMatch(/seat_[ab]:card:/);

    // Candidate labels should be "hidden hand play" for all play_card entries.
    trace.candidates.forEach((candidate) => {
      expect(candidate.cardLabel).not.toMatch(/seat_[ab]:/);
      expect(candidate.cardLabel).not.toMatch(/card:\d+/);
      if (candidate.kind === "play_card") {
        expect(candidate.cardLabel).toBe("hidden hand play");
      }
    });

    // Selected move should use actionRef instead of raw moveId.
    expect(tracedMove?.kind).toBe("play_card");
    expect(trace.selected?.actionRef).toBeTruthy();
    expect(trace.selected?.actionRef).not.toMatch(/seat_[ab]:/);
    expect(trace.selected?.kind).toBe("play_card");
  });

  it("selected move label is redacted for play_card (no hidden card name leakage)", () => {
    const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });

    const input = policyInput(
      [passMove(), playMove(spy)],
      { ownHand: [spy] },
    );

    const { trace, move: tracedMove } = (
      explainLegalHeuristicV1Decision(input)
    ) as { trace: import("@/game/ai").AiDecisionTrace; move: LegalMove | null };

    // The engine label would be "Play <card name>" which leaks hidden identity.
    // The trace label must be redacted.
    expect(trace.selected?.label).toBe("hidden hand play");
    expect(trace.selected?.label).not.toContain("Spy");
    expect(trace.selected?.label).not.toContain("spy");

    // JSON.stringify(trace) must not contain card names from the AI's hidden hand.
    const traceJson = JSON.stringify(trace);
    expect(traceJson).not.toContain("Spy");
    expect(traceJson).not.toContain("test.spy");
    expect(traceJson).not.toContain(spy.cardId);
    expect(traceJson).not.toContain(spy.sourceId);

    // Selected move kind should still be correct.
    expect(tracedMove?.kind).toBe("play_card");
    expect(trace.selected?.kind).toBe("play_card");

    // actionRef should be present and safe.
    expect(trace.selected?.actionRef).toBeTruthy();
    expect(trace.selected?.actionRef).not.toMatch(/seat_[ab]:/);
  });

  it("selected move label is redacted for choose_mulligan", () => {
    const draug = testCard({ cardId: "draug", sourceId: "test.draug", printedStrength: 3 });
    const mulliganMove = {
      kind: "choose_mulligan" as const,
      cardIds: [draug.sourceId],
      target: { kind: "none" },
      label: `Mulligan ${draug.sourceId}`,
    } as import("@/game/core").LegalMove;

    const input = policyInput(
      [passMove(), mulliganMove],
      { phase: "mulligan", ownHand: [draug] },
    );

    const { trace } = (
      explainLegalHeuristicV1Decision(input)
    ) as { trace: import("@/game/ai").AiDecisionTrace };

    expect(trace.selected?.kind).toBe("choose_mulligan");
    expect(trace.selected?.label).toBe("mulligan hidden card");
    expect(trace.selected?.label).not.toContain("Draug");
    expect(trace.selected?.label).not.toContain("draug");

    const traceJson = JSON.stringify(trace);
    expect(traceJson).not.toContain("draug");
    expect(traceJson).not.toContain(draug.sourceId);
  });
});

describe("cFp26: tie-aware catch-up for Nilfgaard", () => {
  const northernObservation = (overrides: Partial<SeatObservation> = {}): SeatObservation =>
    baseObservation({
      ownFaction: "northern_realms",
      opponentFaction: "nilfgaard",
      ...overrides,
    });

  it("Nilfgaard last gem can tie: AI plays when upper bound ties opponent score", () => {
    // Nilfgaard AI: ownScore=0, opponentScore=10, upperBound=10 (can tie)
    // With tie-aware logic, Nilfgaard wins ties, so upperBound >= minimumScoreToWinRound (10)
    const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 10 });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([passMove(), playMove(playCard)], {
        ...nilfgaardObservation({
          ownHand: [playCard],
          ownGems: 1,
          score: {
            ...nilfgaardObservation().score,
            totalBySeat: { seat_a: 10, seat_b: 0 },
          },
        }),
      }),
    );
    // Should NOT be pass — Nilfgaard can tie and win
    expect(selected?.kind).not.toBe("pass");
  });

  it("Non-Nilfgaard last gem cannot tie: AI passes when upper bound only ties", () => {
    // Northern Realms AI: ownScore=0, opponentScore=10, upperBound=10
    // Non-Nilfgaard needs to EXCEED, so upperBound=10 is not enough (needs 11)
    const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 10 });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([passMove(), playMove(playCard)], {
        ...northernObservation({
          ownHand: [playCard],
          ownGems: 1,
          score: {
            ...northernObservation().score,
            totalBySeat: { seat_a: 10, seat_b: 0 },
          },
        }),
      }),
    );
    // Should be pass — Northern Realms needs >10 to win, 10 is only a tie
    expect(selected?.kind).toBe("pass");
  });

  it("Double-Nilfgaard tie does not win: both Nilfgaard means draw on tie", () => {
    // Both seats are Nilfgaard: tie = draw, so need >10 to win
    const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 10 });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([passMove(), playMove(playCard)], {
        ...doubleNilfgaardObservation({
          ownHand: [playCard],
          ownGems: 1,
          score: {
            ...doubleNilfgaardObservation().score,
            totalBySeat: { seat_a: 10, seat_b: 0 },
          },
        }),
      }),
    );
    // Should pass — double-Nilfgaard tie is draw, 10 is not enough
    expect(selected?.kind).toBe("pass");
  });

  it("Nilfgaard below tie remains impossible: upper bound below opponent score", () => {
    const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 8 });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([passMove(), playMove(playCard)], {
        ...nilfgaardObservation({
          ownHand: [playCard],
          ownGems: 1,
          score: {
            ...nilfgaardObservation().score,
            totalBySeat: { seat_a: 10, seat_b: 0 },
          },
        }),
      }),
    );
    // upperBound = 8 < 10, so should pass
    expect(selected?.kind).toBe("pass");
  });

  it("Opponent-passed catch-up threshold: Nilfgaard can tie to win", () => {
    // Opponent passed, Nilfgaard behind by exactly tie-able amount
    const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 5 });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([passMove(), playMove(playCard)], {
        ...nilfgaardObservation({
          ownHand: [playCard],
          opponentPassed: true,
          score: {
            ...nilfgaardObservation().score,
            totalBySeat: { seat_a: 5, seat_b: 0 },
          },
        }),
      }),
    );
    // Nilfgaard can tie (5 = 5), and Nilfgaard wins ties → should attempt catch-up, not pass
    expect(selected?.kind).toBe("play_card");
  });
});

describe("cFp26: diagnostic reason text matches selected move", () => {
  it("Opponent passed, AI behind, selected is pass: reason must not claim catch-up move", () => {
    // AI is behind opponent passed, but no useful move → selects pass
    const small = testCard({ cardId: "small", sourceId: "test.small", printedStrength: 1 });
    const { trace } = explainLegalHeuristicV1Decision(
      policyInput(
        [passMove(), playMove(small)],
        {
          ...baseObservation({
            ownFaction: "northern_realms",
            opponentFaction: "nilfgaard",
          }),
          ownHand: [small],
          opponentPassed: true,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 50, seat_b: 0 },
          },
        },
      ),
    );
    expect(trace.selected?.kind).toBe("pass");
    expect(trace.reason).not.toContain("catch-up move");
  });

  it("Hidden-info safety: trace must not contain raw instance IDs or card names", () => {
    const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
    const { trace } = explainLegalHeuristicV1Decision(
      policyInput(
        [passMove(), playMove(spy)],
        { ownHand: [spy] },
      ),
    );
    const traceJson = JSON.stringify(trace);
    expect(traceJson).not.toContain("seat_a:");
    expect(traceJson).not.toContain("seat_b:");
    expect(traceJson).not.toContain("sourceId");
    expect(traceJson).not.toContain("test.spy");
  });
});

describe("cFp26.1: pass decision diagnostics", () => {
  // 1. Diagnostic-like Round 1 preserve-hand pass
  it("preserve-hand pass: opponent passed, behind, not last gem, no single-card catch-up", () => {
    const tiny = testCard({ cardId: "tiny", sourceId: "test.tiny", printedStrength: 2 });
    // AI is Nilfgaard behind opponent score=50, ownScore=10, not last gem, no card can catch up
    const { trace, move: tracedMove } = explainLegalHeuristicV1Decision(
      policyInput(
        [passMove(), playMove(tiny)],
        {
          ...nilfgaardObservation({
            ownHand: [tiny],
            ownGems: 2,
            opponentPassed: true,
            score: {
              ...nilfgaardObservation().score,
              totalBySeat: { seat_a: 50, seat_b: 10 },
            },
          }),
        },
      ),
    );

    expect(tracedMove?.kind).toBe("pass");
    const pa = trace.passAnalysis;
    expect(pa).not.toBeNull();
    expect(pa?.preserveHandPassRecommended).toBe(true);
    expect(pa?.hasSingleMoveCatchUp).toBe(false);
    expect(trace.reason).toContain("preserve hand");
    expect(trace.reason).not.toContain("no useful move");
  });

  // 2. Single-move catch-up available
  it("single-move catch-up available: selects play card, hasSingleMoveCatchUp true", () => {
    const bigCard = testCard({ cardId: "big", sourceId: "test.big", printedStrength: 15 });
    const { trace, move: tracedMove } = explainLegalHeuristicV1Decision(
      policyInput(
        [passMove(), playMove(bigCard)],
        {
          ...baseObservation({
            ownFaction: "northern_realms",
            opponentFaction: "nilfgaard",
            ownHand: [bigCard],
            ownGems: 2,
            opponentPassed: true,
            score: {
              ...baseObservation().score,
              totalBySeat: { seat_a: 5, seat_b: 0 },
            },
          }),
        },
      ),
    );

    expect(tracedMove?.kind).toBe("play_card");
    expect(trace.passAnalysis?.hasSingleMoveCatchUp).toBe(true);
    expect(trace.passAnalysis?.bestSingleMoveCatchUpKind).toBe("play_card");
    expect(trace.passAnalysis?.bestSingleMoveCatchUpTempo).not.toBeNull();
    expect(trace.passAnalysis?.bestSingleMoveCatchUpScore).not.toBeNull();
    expect(trace.reason).toContain("catch-up");
  });

  // 3. Nilfgaard tie threshold appears in diagnostics
  it("Nilfgaard single-seat tie: ownWinsTiedRound true, minimumScoreToWinRound equals opponentScore", () => {
    const card = testCard({ cardId: "card", sourceId: "test.card", printedStrength: 5 });
    const { trace } = explainLegalHeuristicV1Decision(
      policyInput(
        [passMove(), playMove(card)],
        {
          ...nilfgaardObservation({
            ownHand: [card],
            opponentPassed: true,
            score: {
              ...nilfgaardObservation().score,
              totalBySeat: { seat_a: 20, seat_b: 10 },
            },
          }),
        },
      ),
    );

    expect(trace.passAnalysis?.ownWinsTiedRound).toBe(true);
    expect(trace.passAnalysis?.minimumScoreToWinRound).toBe(20);
  });

  // 4. Double-Nilfgaard tie threshold
  it("double-Nilfgaard: ownWinsTiedRound false, minimumScoreToWinRound equals opponentScore+1", () => {
    const card = testCard({ cardId: "card", sourceId: "test.card", printedStrength: 5 });
    const { trace } = explainLegalHeuristicV1Decision(
      policyInput(
        [passMove(), playMove(card)],
        {
          ...doubleNilfgaardObservation({
            ownHand: [card],
            opponentPassed: true,
            score: {
              ...doubleNilfgaardObservation().score,
              totalBySeat: { seat_a: 20, seat_b: 10 },
            },
          }),
        },
      ),
    );

    expect(trace.passAnalysis?.ownWinsTiedRound).toBe(false);
    expect(trace.passAnalysis?.minimumScoreToWinRound).toBe(21);
  });

  // 5. Last-gem impossible remains distinct
  it("last-gem impossible: preserveHandPassRecommended false, reason is last-gem impossible", () => {
    const tiny = testCard({ cardId: "tiny", sourceId: "test.tiny", printedStrength: 2 });
    const { trace, move: tracedMove } = explainLegalHeuristicV1Decision(
      policyInput(
        [passMove(), playMove(tiny)],
        {
          ...baseObservation({
            ownFaction: "northern_realms",
            opponentFaction: "nilfgaard",
            ownHand: [tiny],
            ownGems: 1,
            opponentPassed: true,
            score: {
              ...baseObservation().score,
              totalBySeat: { seat_a: 20, seat_b: 0 },
            },
          }),
        },
      ),
    );

    expect(tracedMove?.kind).toBe("pass");
    expect(trace.passAnalysis?.preserveHandPassRecommended).toBe(false);
    expect(trace.reason).toContain("catch-up impossible");
  });

  // 6. Policy parity: all focused fixtures
  it("policy parity: explain move equals selectMove for preserve-hand pass", () => {
    const tiny = testCard({ cardId: "tiny", sourceId: "test.tiny", printedStrength: 2 });
    const input = policyInput(
      [passMove(), playMove(tiny)],
      {
        ...nilfgaardObservation({
          ownHand: [tiny],
          ownGems: 2,
          opponentPassed: true,
          score: {
            ...nilfgaardObservation().score,
            totalBySeat: { seat_a: 50, seat_b: 10 },
          },
        }),
      },
    );

    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    expect(tracedMove).toEqual(selectedMove);
  });

  it("policy parity: explain move equals selectMove for single-move catch-up", () => {
    const bigCard = testCard({ cardId: "big", sourceId: "test.big", printedStrength: 15 });
    const input = policyInput(
      [passMove(), playMove(bigCard)],
      {
        ...baseObservation({
          ownFaction: "northern_realms",
          opponentFaction: "nilfgaard",
          ownHand: [bigCard],
          ownGems: 2,
          opponentPassed: true,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 5, seat_b: 0 },
          },
        }),
      },
    );

    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    expect(tracedMove).toEqual(selectedMove);
  });

  it("policy parity: explain move equals selectMove for Nilfgaard tie case", () => {
    const card = testCard({ cardId: "card", sourceId: "test.card", printedStrength: 5 });
    const input = policyInput(
      [passMove(), playMove(card)],
      {
        ...nilfgaardObservation({
          ownHand: [card],
          opponentPassed: true,
          score: {
            ...nilfgaardObservation().score,
            totalBySeat: { seat_a: 20, seat_b: 10 },
          },
        }),
      },
    );

    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    expect(tracedMove).toEqual(selectedMove);
  });

  it("policy parity: explain move equals selectMove for last-gem impossible", () => {
    const tiny = testCard({ cardId: "tiny", sourceId: "test.tiny", printedStrength: 2 });
    const input = policyInput(
      [passMove(), playMove(tiny)],
      {
        ...baseObservation({
          ownFaction: "northern_realms",
          opponentFaction: "nilfgaard",
          ownHand: [tiny],
          ownGems: 1,
          opponentPassed: true,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 20, seat_b: 0 },
          },
        }),
      },
    );

    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    expect(tracedMove).toEqual(selectedMove);
  });

  it("last-gem non-opponentPassed: Nilfgaard tie-win plays when upper bound >= minimumScoreToWinRound", () => {
    const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 10 });
    const input = policyInput(
      [passMove(), playMove(playCard)],
      {
        ...nilfgaardObservation({
          ownHand: [playCard],
          ownGems: 1,
          opponentPassed: false,
          score: {
            ...nilfgaardObservation().score,
            totalBySeat: { seat_a: 10, seat_b: 0 },
          },
        }),
      },
    );

    const { move: tracedMove, trace } = explainLegalHeuristicV1Decision(input);

    expect(tracedMove?.kind).toBe("play_card");
    expect(trace.reason).not.toContain("impossible");
    expect(trace.reason).not.toContain("pass");
    expect(trace.passAnalysis).not.toBeNull();
    expect(trace.passAnalysis!.ownWinsTiedRound).toBe(true);
    expect(trace.passAnalysis!.minimumScoreToWinRound).toBe(10);
    expect(trace.passAnalysis!.policyUpperBoundCanWinRound).toBe(true);
    expect(trace.passAnalysis!.lastGemSurrenderAllowed).toBe(false);
  });
});

describe("cFp27: mulligan low-standalone and diagnostics", () => {
  it("redraws low no-ability strength-3 unit through low_standalone_unit rule", () => {
    const lowUnit = testCard({ cardId: "low-unit", sourceId: "test.low-unit", printedStrength: 3 });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(lowUnit)], {
        phase: "mulligan",
        ownHand: [lowUnit],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ kind: "choose_mulligan", cardIds: ["low-unit"] }));
  });

  it("redraws neutral.roach without muster_roach caller via low_standalone rule", () => {
    const roach = testCard({ cardId: "roach", sourceId: "neutral.roach", printedStrength: 3 });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(roach)], {
        phase: "mulligan",
        ownHand: [roach],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ kind: "choose_mulligan", cardIds: ["roach"] }));
  });

  it("prefers Roach-with-caller linked payload over low-standalone redraw", () => {
    const geralt = testCard({
      cardId: "geralt",
      sourceId: "neutral.geralt-of-rivia",
      printedStrength: 15,
      kind: "hero",
      abilities: ["muster_roach"],
      linkedSourceIds: ["neutral.roach"],
    });
    const roach = testCard({ cardId: "roach", sourceId: "neutral.roach", printedStrength: 3 });
    const lowUnit = testCard({ cardId: "low-unit", sourceId: "test.low-unit", printedStrength: 2 });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(geralt), redrawMove(roach), redrawMove(lowUnit)], {
        phase: "mulligan",
        ownHand: [geralt, roach, lowUnit],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ cardIds: ["roach"] }));
  });

  it("keeps strength-3 spy instead of redrawing", () => {
    const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 3, abilities: ["spy"] });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(spy)], {
        phase: "mulligan",
        ownHand: [spy],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ cardIds: [] }));
  });

  it("keeps strength-3 medic instead of redrawing", () => {
    const medic = testCard({ cardId: "medic", sourceId: "test.medic", printedStrength: 3, abilities: ["medic"] });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(medic)], {
        phase: "mulligan",
        ownHand: [medic],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ cardIds: [] }));
  });

  it("keeps strength-3 tight_bond unit instead of redrawing", () => {
    const tb = testCard({ cardId: "tb", sourceId: "test.tb", printedStrength: 3, abilities: ["tight_bond"] });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(tb)], {
        phase: "mulligan",
        ownHand: [tb],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ cardIds: [] }));
  });

  it("keeps strength-3 agile unit instead of redrawing", () => {
    const agile = testCard({ cardId: "agile", sourceId: "test.agile", printedStrength: 3, abilities: ["agile"] });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(agile)], {
        phase: "mulligan",
        ownHand: [agile],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ cardIds: [] }));
  });

  it("keeps hero cards instead of redrawing through low-standalone rule", () => {
    const hero = testCard({ cardId: "hero", sourceId: "test.hero", printedStrength: 2, kind: "hero" });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(hero)], {
        phase: "mulligan",
        ownHand: [hero],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ cardIds: [] }));
  });

  it("determinism: equal low-standalone candidates choose by lower standalone value then strength then moveId", () => {
    const unitA = testCard({ cardId: "unit-a", sourceId: "test.unit-a", printedStrength: 3 });
    const unitB = testCard({ cardId: "unit-b", sourceId: "test.unit-b", printedStrength: 2 });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(unitA), redrawMove(unitB)], {
        phase: "mulligan",
        ownHand: [unitA, unitB],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ cardIds: ["unit-b"] }));
  });

  // --- Trace / diagnostics tests ---

  it("explain returns same move as selectMove for keep-hand mulligan", () => {
    const cerys = testCard({
      cardId: "cerys",
      sourceId: "skellige.cerys",
      printedStrength: 10,
      kind: "hero",
      abilities: ["muster"],
      linkedSourceIds: ["skellige.clan-drummond-shield-maiden"],
    });
    const input = policyInput([keepMulliganMove(), redrawMove(cerys)], {
      phase: "mulligan",
      ownHand: [cerys],
    });
    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    expect(tracedMove).toEqual(selectedMove);
  });

  it("explain returns same move as selectMove for low-standalone redraw", () => {
    const lowUnit = testCard({ cardId: "low-unit", sourceId: "test.low-unit", printedStrength: 3 });
    const input = policyInput([keepMulliganMove(), redrawMove(lowUnit)], {
      phase: "mulligan",
      ownHand: [lowUnit],
    });
    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    expect(tracedMove).toEqual(selectedMove);
    expect(tracedMove?.kind).toBe("choose_mulligan");
    expect((tracedMove as { cardIds: string[] }).cardIds).toEqual(["low-unit"]);
  });

  it("mulligan trace includes mulliganAnalysis in mulligan phase", () => {
    const lowUnit = testCard({ cardId: "low-unit", sourceId: "test.low-unit", printedStrength: 3 });
    const input = policyInput([keepMulliganMove(), redrawMove(lowUnit)], {
      phase: "mulligan",
      ownHand: [lowUnit],
    });
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.mulliganAnalysis).not.toBeNull();
    const ma = trace.mulliganAnalysis!;
    expect(ma.mulliganLegal).toBe(true);
    expect(ma.candidateCount).toBe(1);
    expect(ma.selectedReasonKind).toBe("low_standalone_unit");
    expect(ma.topCandidateReasonKind).toBe("low_standalone_unit");
  });

  it("mulliganAnalysis is null in playing phase", () => {
    const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
    const unit = testCard({ cardId: "unit", sourceId: "test.unit", printedStrength: 5 });
    const input = policyInput([passMove(), playMove(spy), playMove(unit)], { ownHand: [spy, unit] });
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.mulliganAnalysis).toBeNull();
  });

  it("low-standalone redraw trace has correct label and reason", () => {
    const lowUnit = testCard({ cardId: "low-unit", sourceId: "test.low-unit", printedStrength: 3 });
    const input = policyInput([keepMulliganMove(), redrawMove(lowUnit)], {
      phase: "mulligan",
      ownHand: [lowUnit],
    });
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.selected?.label).toBe("mulligan hidden card");
    expect(trace.reason).toContain("low standalone unit");
    expect(trace.mulliganAnalysis?.selectedReasonKind).toBe("low_standalone_unit");
  });

  it("keep-hand trace has correct label and reason", () => {
    const cerys = testCard({
      cardId: "cerys",
      sourceId: "skellige.cerys",
      printedStrength: 10,
      kind: "hero",
      abilities: ["muster"],
      linkedSourceIds: ["skellige.clan-drummond-shield-maiden"],
    });
    const input = policyInput([keepMulliganMove(), redrawMove(cerys)], {
      phase: "mulligan",
      ownHand: [cerys],
    });
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.selected?.label).toBe("keep hand");
    expect(trace.reason).toContain("no redraw target above threshold");
    expect(trace.mulliganAnalysis?.selectedReasonKind).toBe("keep_hand");
  });

  it("mulligan trace does not leak card identity", () => {
    const lowUnit = testCard({ cardId: "low-unit", sourceId: "test.low-unit", printedStrength: 3 });
    const input = policyInput([keepMulliganMove(), redrawMove(lowUnit)], {
      phase: "mulligan",
      ownHand: [lowUnit],
    });
    const { trace } = explainLegalHeuristicV1Decision(input);
    const traceJson = JSON.stringify(trace);
    expect(traceJson).not.toContain("low-unit");
    expect(traceJson).not.toContain("test.low-unit");
  });

  it("linked payload redraw trace has correct analysis", () => {
    const geralt = testCard({
      cardId: "geralt",
      sourceId: "neutral.geralt-of-rivia",
      printedStrength: 15,
      kind: "hero",
      abilities: ["muster_roach"],
      linkedSourceIds: ["neutral.roach"],
    });
    const roach = testCard({ cardId: "roach", sourceId: "neutral.roach", printedStrength: 3 });
    const input = policyInput([keepMulliganMove(), redrawMove(geralt), redrawMove(roach)], {
      phase: "mulligan",
      ownHand: [geralt, roach],
    });
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.mulliganAnalysis).not.toBeNull();
    const ma = trace.mulliganAnalysis!;
    expect(ma.selectedReasonKind).toBe("linked_payload");
    expect(trace.selected?.label).toBe("mulligan hidden card");
    expect(trace.reason).toContain("linked payload");
  });

  // cFp27 repair: Hero linked-payload regression tests
  it("redraws hero that is explicit one-way linked summoned target", () => {
    const caller = testCard({
      cardId: "caller",
      sourceId: "test.caller",
      printedStrength: 5,
      abilities: ["muster"],
      linkedSourceIds: ["test.hero-payload"],
    });
    const heroPayload = testCard({
      cardId: "hero-payload",
      sourceId: "test.hero-payload",
      printedStrength: 10,
      kind: "hero",
    });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(caller), redrawMove(heroPayload)], {
        phase: "mulligan",
        ownHand: [caller, heroPayload],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ kind: "choose_mulligan" }));
    expect(selected).toEqual(expect.objectContaining({ cardIds: ["hero-payload"] }));
  });

  it("keeps standalone low-strength hero when no linked caller present", () => {
    const hero = testCard({
      cardId: "hero",
      sourceId: "test.hero",
      printedStrength: 2,
      kind: "hero",
    });
    const selected = legalHeuristicPolicyV1.selectMove(
      policyInput([keepMulliganMove(), redrawMove(hero)], {
        phase: "mulligan",
        ownHand: [hero],
      }),
    );
    expect(selected).toEqual(expect.objectContaining({ cardIds: [] }));
  });
});

describe("cFp28: hand-quality pass calibration", () => {
  // Helper: create special/weather card summaries for poor-hand tests
  const specialCard = (id: string, sourceId: string, printedStrength = 0) =>
    testCard({ cardId: id, sourceId, printedStrength, kind: "special" });

  // Helper: create unit card summaries
  const unitCard = (id: string, sourceId: string, printedStrength = 5) =>
    testCard({ cardId: id, sourceId, printedStrength, kind: "unit" });

  // Helper: create hero card summaries
  const heroCard = (id: string, sourceId: string, printedStrength = 10) =>
    testCard({ cardId: id, sourceId, printedStrength, kind: "hero" });

  // ------------------------------------------------------------------
  // Marginal Poor-Hand Pass Is Blocked — Commander's Horn fixture
  // ------------------------------------------------------------------
  it("blocks marginal voluntary pass when future hand is poor and Commander's Horn useful play exists", () => {
    // scoreDelta=29, requiredLead=24, passSafetyBuffer=5
    // ownHand: horn + 3 specials -> futureRoundHandQuality = "poor", noUnitFutureRisk
    // Commander's Horn targets close row which has high row total -> positive score
    const horn = testCard({
      cardId: "horn",
      sourceId: "test.commanders-horn",
      printedStrength: 0,
      kind: "special",
      abilities: ["commanders_horn"],
    });
    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);
    const w3 = specialCard("w3", "neutral.torrential-rain", 0);

    const hornMove = rowHornMove(horn);
    const input = policyInput(
      [passMove(), hornMove, playMove(w1), playMove(w2), playMove(w3)],
      {
        ownHand: [horn, w1, w2, w3],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 79, seat_b: 108 },
          rowTotalsBySeat: {
            seat_a: emptyRowTotals(),
            seat_b: { close: 10, ranged: 0, siege: 0 },
          },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { trace } = explainLegalHeuristicV1Decision(input);

    expect(selected.kind).not.toBe("pass");
    expect(selected.kind).toBe("play_card");
    expect(trace.handShapeAnalysis).not.toBeNull();
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("poor");
    expect(trace.handShapeAnalysis!.noUnitFutureRisk).toBe(true);
    expect(trace.handShapeAnalysis!.unitCardCount).toBe(0);
    expect(trace.handShapeAnalysis!.heroCardCount).toBe(0);
    expect(trace.reason).toMatch(/future hand|pass margin/);
    // Policy parity
    expect(explainLegalHeuristicV1Decision(input).move).toEqual(selected);
  });

  // ------------------------------------------------------------------
  // All-special hand with no positive useful move — pass still allowed
  // ------------------------------------------------------------------
  it("allows poor-hand pass when no positive useful move exists", () => {
    const weather1 = specialCard("w1", "neutral.biting-frost", 0);
    const weather2 = specialCard("w2", "neutral.impenetrable-fog", 0);
    const special1 = specialCard("s1", "test.decoy", 0);
    const special2 = specialCard("s2", "test.commanders-horn", 0);

    const input = policyInput(
      [passMove(), playMove(weather1), playMove(weather2), playMove(special1), playMove(special2)],
      {
        ownHand: [weather1, weather2, special1, special2],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 79, seat_b: 108 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
    expect(trace.handShapeAnalysis).not.toBeNull();
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("poor");
    expect(trace.handShapeAnalysis!.noUnitFutureRisk).toBe(true);
    expect(trace.reason).toContain("future hand poor");
    expect(trace.reason).toContain("no useful move");
  });

  it("records poor-hand analysis when all weather plays are non-useful", () => {
    // All special cards -> poor future hand quality
    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);
    const w3 = specialCard("w3", "neutral.torrential-rain", 0);
    const w4 = specialCard("w4", "neutral.skellige-storm", 0);

    const input = policyInput(
      [passMove(), playMove(w1), playMove(w2), playMove(w3), playMove(w4)],
      {
        ownHand: [w1, w2, w3, w4],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 79, seat_b: 108 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { trace } = explainLegalHeuristicV1Decision(input);

    // With poor hand and small buffer, pass blocked if useful move exists.
    // If no positive-score move exists, pass is still allowed.
    expect(trace.handShapeAnalysis).not.toBeNull();
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("poor");
    expect(trace.handShapeAnalysis!.noUnitFutureRisk).toBe(true);

    // Parity check
    expect(selected).toEqual(legalHeuristicPolicyV1.selectMove(input));
    expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
    expect(trace.reason).toContain("future hand poor");
    expect(trace.reason).toContain("no useful move");
  });

  // ------------------------------------------------------------------
  // Healthy-Hand Pass Still Works
  // ------------------------------------------------------------------
  it("allows voluntary pass when hand is healthy and delta exceeds required lead", () => {
    const unit1 = unitCard("u1", "test.unit1", 8);
    const unit2 = unitCard("u2", "test.unit2", 7);
    const hero1 = heroCard("h1", "test.hero1", 10);

    const input = policyInput(
      [passMove(), playMove(unit1), playMove(unit2), playMove(hero1)],
      {
        ownHand: [unit1, unit2, hero1],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 79, seat_b: 110 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { trace } = explainLegalHeuristicV1Decision(input);

    expect(trace.handShapeAnalysis).not.toBeNull();
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("healthy");

    // Pass allowed with healthy hand
    expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
  });

  // ------------------------------------------------------------------
  // Thin-Hand Extra Buffer Tests
  // ------------------------------------------------------------------
  it("blocks thin-hand pass when buffer below 10 and useful play exists", () => {
    // 1 unit + 2 specials = thin hand (unitCardCount=1, totalHandCount>=3)
    const unit = unitCard("u1", "test.thin-unit", 10);
    const s1 = specialCard("s1", "test.special1", 0);
    const s2 = specialCard("s2", "test.special2", 0);
    // scoreDelta=32, requiredLead=24, buffer=8 < 10 -> pass blocked
    const input = policyInput(
      [passMove(), playMove(unit), playMove(s1), playMove(s2)],
      {
        ownHand: [unit, s1, s2],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 76, seat_b: 108 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("thin");
    expect(selected.kind).not.toBe("pass");
    expect(trace.reason).toMatch(/future hand|pass margin/);
  });

  it("allows thin-hand pass when buffer at or above 10", () => {
    const unit = unitCard("u1", "test.thin-unit2", 10);
    const s1 = specialCard("s1", "test.special3", 0);
    const s2 = specialCard("s2", "test.special4", 0);
    // scoreDelta=34, requiredLead=24, buffer=10 -> exactly at thin threshold
    const input = policyInput(
      [passMove(), playMove(unit), playMove(s1), playMove(s2)],
      {
        ownHand: [unit, s1, s2],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 74, seat_b: 108 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("thin");
    // With buffer >= 10, pass allowed for thin hand
    expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
  });

  // ------------------------------------------------------------------
  // Poor-Hand Large Buffer Can Still Pass
  // ------------------------------------------------------------------
  it("allows poor-hand pass when safety buffer >= 18", () => {
    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);
    // scoreDelta = 48, requiredLead = 24, buffer = 24 >= 18 -> pass allowed
    const input = policyInput(
      [passMove(), playMove(w1), playMove(w2)],
      {
        ownHand: [w1, w2],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 50, seat_b: 98 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("poor");
    // Large buffer overrides poor-hand penalty
    expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
  });

  // ------------------------------------------------------------------
  // Last-Gem Branch Unchanged
  // ------------------------------------------------------------------
  it("preserves last-gem catch-up-impossible pass behavior", () => {
    const tiny = testCard({ cardId: "tiny", sourceId: "test.tiny", printedStrength: 2 });
    const input = policyInput(
      [passMove(), playMove(tiny)],
      {
        ownHand: [tiny],
        ownGems: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 20, seat_b: 0 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { trace } = explainLegalHeuristicV1Decision(input);

    expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
    expect(trace.reasonKind).toBe("policy-last-gem");
    expect(trace.passAnalysis!.lastGemSurrenderAllowed).toBe(true);
    // handShapeAnalysis should be present in playing phase
    expect(trace.handShapeAnalysis).not.toBeNull();
  });

  // ------------------------------------------------------------------
  // Opponent-Already-Passed Unchanged
  // ------------------------------------------------------------------
  it("allows pass when opponent passed and AI is ahead even with poor hand", () => {
    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);

    const input = policyInput(
      [passMove(), playMove(w1), playMove(w2)],
      {
        ownHand: [w1, w2],
        opponentPassed: true,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 10 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("poor");
    expect(trace.reason).toContain("opponent passed");
  });

  // ------------------------------------------------------------------
  // Hand Shape Analysis In Trace
  // ------------------------------------------------------------------
  it("populates handShapeAnalysis in playing-phase trace", () => {
    const unit = unitCard("u1", "test.unit-trace", 6);
    const hero = heroCard("h1", "test.hero-trace", 10);
    const special = specialCard("s1", "test.special-trace", 0);

    const input = policyInput(
      [passMove(), playMove(unit), playMove(hero), playMove(special)],
      {
        ownHand: [unit, hero, special],
        ownGems: 2,
        opponentHandCount: 5,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 20, seat_b: 30 },
        },
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    const hsa = trace.handShapeAnalysis!;
    expect(hsa).not.toBeNull();
    expect(hsa.unitCardCount).toBe(1); // counts only kind === "unit"
    expect(hsa.heroCardCount).toBe(1); // separate count for heroes
    expect(hsa.specialOrWeatherCardCount).toBe(1);
    expect(hsa.totalHandCount).toBe(3);
    expect(hsa.futureRoundHandQuality).toBe("healthy"); // unitTempoCardCount = 2 -> healthy
    expect(hsa.noUnitFutureRisk).toBe(false);
  });

  it("sets handShapeAnalysis to null for mulligan phase", () => {
    const lowUnit = testCard({ cardId: "low-unit", sourceId: "test.low-unit", printedStrength: 3 });
    const input = policyInput(
      [keepMulliganMove(), redrawMove(lowUnit)],
      { phase: "mulligan", ownHand: [lowUnit] },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.handShapeAnalysis).toBeNull();
  });

  // ------------------------------------------------------------------
  // Parity Tests
  // ------------------------------------------------------------------
  it("explain move equals selectMove for poor-hand blocked pass", () => {
    const unit = unitCard("u1", "test.parity-unit", 8);
    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);
    const w3 = specialCard("w3", "neutral.torrential-rain", 0);

    const input = policyInput(
      [passMove(), playMove(unit), playMove(w1), playMove(w2), playMove(w3)],
      {
        ownHand: [unit, w1, w2, w3],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 79, seat_b: 108 },
        },
      },
    );

    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    expect(tracedMove).toEqual(selectedMove);
  });

  it("explain move equals selectMove for healthy-hand pass", () => {
    const unit1 = unitCard("u1", "test.hp-unit1", 8);
    const unit2 = unitCard("u2", "test.hp-unit2", 7);
    const hero1 = heroCard("h1", "test.hp-hero", 10);

    const input = policyInput(
      [passMove(), playMove(unit1), playMove(unit2), playMove(hero1)],
      {
        ownHand: [unit1, unit2, hero1],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 79, seat_b: 110 },
        },
      },
    );

    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    expect(tracedMove).toEqual(selectedMove);
  });

  // ------------------------------------------------------------------
  // Blocked Pass Asserts selected.kind !== "pass"
  // ------------------------------------------------------------------
  it("asserts selected.kind !== 'pass' for blocked marginal pass (thin hand)", () => {
    // 1 unit + 2 specials = thin hand, buffer below 10 -> pass blocked
    const unit = unitCard("u1", "test.blocked-thin-unit", 12);
    const s1 = specialCard("s1", "test.blocked-special1", 0);
    const s2 = specialCard("s2", "test.blocked-special2", 0);
    // scoreDelta=32, requiredLead=24, buffer=8 < 10 -> blocked
    const input = policyInput(
      [passMove(), playMove(unit), playMove(s1), playMove(s2)],
      {
        ownHand: [unit, s1, s2],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 76, seat_b: 108 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected.kind).not.toBe("pass");
  });

  it("asserts selected.kind !== 'pass' for blocked marginal pass (thin hand with unit)", () => {
    // 1 unit + 2 specials = thin hand, buffer below 10 -> pass blocked
    const unit = unitCard("u1", "test.blocked-poor-unit", 15);
    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);
    // scoreDelta=31, requiredLead=24, buffer=7 < 18 -> blocked
    const input = policyInput(
      [passMove(), playMove(unit), playMove(w1), playMove(w2)],
      {
        ownHand: [unit, w1, w2],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 77, seat_b: 108 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { trace } = explainLegalHeuristicV1Decision(input);
    // Unit + specials = thin hand (not poor), buffer insufficient -> pass blocked
    expect(selected.kind).not.toBe("pass");
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("thin");
  });

  // ------------------------------------------------------------------
  // Hero Count Semantics
  // ------------------------------------------------------------------
  it("counts heroes toward future-round tempo but not unitCardCount", () => {
    const unit = unitCard("u1", "test.hero-semantics-unit", 8);
    const hero1 = heroCard("h1", "test.hero-semantics-1", 10);
    const hero2 = heroCard("h2", "test.hero-semantics-2", 12);
    const special = specialCard("s1", "test.hero-semantics-special", 0);

    const input = policyInput(
      [passMove(), playMove(unit), playMove(hero1), playMove(hero2), playMove(special)],
      {
        ownHand: [unit, hero1, hero2, special],
        ownGems: 2,
        opponentHandCount: 4,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 50 },
        },
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    const hsa = trace.handShapeAnalysis!;
    expect(hsa.unitCardCount).toBe(1); // only kind === "unit"
    expect(hsa.heroCardCount).toBe(2); // heroes counted separately
    expect(hsa.futureRoundHandQuality).toBe("healthy"); // unitTempoCardCount = 3
    expect(hsa.noUnitFutureRisk).toBe(false);
  });

  it("sets noUnitFutureRisk true when only specials remain", () => {
    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);

    const input = policyInput(
      [passMove(), playMove(w1), playMove(w2)],
      {
        ownHand: [w1, w2],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 50, seat_b: 60 },
        },
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.handShapeAnalysis!.noUnitFutureRisk).toBe(true);
    expect(trace.handShapeAnalysis!.futureRoundHandQuality).toBe("poor");
  });

  it("sets specialOnlyHand true when hand contains only specials", () => {
    const w1 = specialCard("w1", "neutral.torrential-rain", 0);
    const s1 = specialCard("s1", "test.decoy-only", 0);

    const input = policyInput(
      [passMove(), playMove(w1), playMove(s1)],
      {
        ownHand: [w1, s1],
        ownGems: 2,
        opponentHandCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 50, seat_b: 60 },
        },
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.handShapeAnalysis!.specialOnlyHand).toBe(true);
  });
});
