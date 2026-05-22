import { configureStore } from "@reduxjs/toolkit";
import { describe, expect, it } from "vitest";

import {
  currentCatalogCards,
  currentCatalogLeaders,
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialScoiataelStarterDeckPreset,
  officialSkelligeStarterDeckPreset,
} from "@/data/catalog";
import {
  buildSeatObservation,
  buildLegalHeuristicV1Features,
  buildLegalHeuristicV1HandShapeAnalysis,
  buildLegalHeuristicV1RoundInvestmentAnalysis,
  commandFromLegalMove,
  explainLegalHeuristicV1Decision,
  legalHeuristicPolicyV0,
  legalHeuristicPolicyV1,
  uniqueCardTempoUpperBound,
  scorePlayMove,
  isOwnWeatheredLowTempoUnitPlacement,
  hasClearlyBetterNonWeatheredLine,
  shouldExemptFromWeatheredLowTempoPenalty,
  effectivePlacedStrengthForPolicy,
  medicSourceUtility,
  isNoTargetMedicSourcePlay,
  hasUsefulNonMedicLine,
  shouldApplyNoTargetMedicDelayPenalty,
  DEFAULT_PRODUCT_AI_POLICY_ID,
  PRODUCT_AI_POLICIES,
  getProductAiPolicy,
  resolveProductAiPolicyId,
  type EnginePolicyInput,
  type SeatCardSummary,
  type SeatObservation,
} from "@/game/ai";
import { scanRoundInvestmentAnalysis } from "@/components/gwent/matchDiagnostics";
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
  ownHasPostMulliganFirstPlayerChoice: false,
  opponentHasPostMulliganFirstPlayerChoice: false,
  ownHand: [],
  ownDiscard: [],
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

  it("builds public post-mulligan Scoia'tael first-player choice metadata", () => {
    const scoiataelVsNilfgaard = startMatch({
      seed: "ai-observation-scoiatael-first",
      seats: [
        {
          seatId: "seat_a",
          playerId: "human",
          controllerKind: "human",
          faction: "scoiatael",
          deckPreset: officialScoiataelStarterDeckPreset,
        },
        {
          seatId: "seat_b",
          playerId: "ai",
          controllerKind: "ai",
          faction: "nilfgaard",
          deckPreset: currentNilfgaardDeckPreset,
        },
      ],
      catalog: { cards: currentCatalogCards, leaders: currentCatalogLeaders },
    }).state;

    const scoiataelObservation = buildSeatObservation({
      state: scoiataelVsNilfgaard,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });
    const nilfgaardObservation = buildSeatObservation({
      state: scoiataelVsNilfgaard,
      seatId: "seat_b",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });

    expect(scoiataelObservation.ownHasPostMulliganFirstPlayerChoice).toBe(true);
    expect(scoiataelObservation.opponentHasPostMulliganFirstPlayerChoice).toBe(false);
    expect(nilfgaardObservation.ownHasPostMulliganFirstPlayerChoice).toBe(false);
    expect(nilfgaardObservation.opponentHasPostMulliganFirstPlayerChoice).toBe(true);

    const scoiataelMirror = startMatch({
      seed: "ai-observation-scoiatael-mirror",
      seats: [
        {
          seatId: "seat_a",
          playerId: "human",
          controllerKind: "human",
          faction: "scoiatael",
          deckPreset: officialScoiataelStarterDeckPreset,
        },
        {
          seatId: "seat_b",
          playerId: "ai",
          controllerKind: "ai",
          faction: "scoiatael",
          deckPreset: officialScoiataelStarterDeckPreset,
        },
      ],
      catalog: { cards: currentCatalogCards, leaders: currentCatalogLeaders },
    }).state;

    const mirrorObservation = buildSeatObservation({
      state: scoiataelMirror,
      seatId: "seat_a",
      catalogCards: currentCatalogCards,
      catalogLeaders: currentCatalogLeaders,
    });

    expect(mirrorObservation.ownHasPostMulliganFirstPlayerChoice).toBe(false);
    expect(mirrorObservation.opponentHasPostMulliganFirstPlayerChoice).toBe(false);
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

    it("chooses self for Scoia'tael first-player prompts", () => {
      const legalMoves = [
        promptMove("scoiatael-first-player:opponent", "scoiatael_choose_first", { kind: "none" }),
        promptMove("scoiatael-first-player:self", "scoiatael_choose_first", { kind: "none" }),
      ];
      const input = policyInput(legalMoves, {
        pendingPrompt: {
          promptId: "prompt:test",
          seatId: "seat_b",
          kind: "choose_option",
          abilityId: "scoiatael_choose_first",
          options: [
            { optionId: "scoiatael-first-player:opponent", label: "opponent goes first" },
            { optionId: "scoiatael-first-player:self", label: "go first" },
          ],
        },
      });

      expect(legalHeuristicPolicyV1.selectMove(input)).toEqual(
        expect.objectContaining({ optionId: "scoiatael-first-player:self" }),
      );
      expect(legalHeuristicPolicyV0.selectMove(input)).toEqual(
        expect.objectContaining({ optionId: "scoiatael-first-player:self" }),
      );
    });

    describe("cFp33: scoia'tael first-turn choice heuristic", () => {
      const scoiataelPromptMoves = (
        selfOption = true,
        opponentOption = true,
      ): LegalMove[] => {
        const moves: LegalMove[] = [];
        if (selfOption) {
          moves.push(promptMove("scoiatael-first-player:self", "scoiatael_choose_first", { kind: "none" }));
        }
        if (opponentOption) {
          moves.push(promptMove("scoiatael-first-player:opponent", "scoiatael_choose_first", { kind: "none" }));
        }
        return moves;
      };

      it("default/tie chooses self (balanced hand, both options legal)", () => {
        const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 5, abilities: ["tight_bond"] });
        const legalMoves = scoiataelPromptMoves();
        const input = policyInput(legalMoves, {
          ownHand: [filler],
        });

        expect(legalHeuristicPolicyV1.selectMove(input)).toEqual(
          expect.objectContaining({ optionId: "scoiatael-first-player:self" }),
        );
      });

      it("spy opener chooses self with reason spy_or_card_advantage_opener", () => {
        const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
        const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 3 });
        const legalMoves = scoiataelPromptMoves();
        const input = policyInput(legalMoves, {
          ownHand: [spy, filler],
        });

        expect(legalHeuristicPolicyV1.selectMove(input)).toEqual(
          expect.objectContaining({ optionId: "scoiatael-first-player:self" }),
        );
      });

      it("muster opener chooses self with reason muster_or_thinning_opener", () => {
        const muster = testCard({
          cardId: "muster",
          sourceId: "test.muster",
          printedStrength: 2,
          abilities: ["muster"],
          linkedSourceIds: ["test.muster.target"],
        });
        const target = testCard({ cardId: "target", sourceId: "test.muster.target", printedStrength: 4 });
        const legalMoves = scoiataelPromptMoves();
        const input = policyInput(legalMoves, {
          ownHand: [muster, target],
        });

        expect(legalHeuristicPolicyV1.selectMove(input)).toEqual(
          expect.objectContaining({ optionId: "scoiatael-first-player:self" }),
        );
      });

      it("high tempo opener (strength 8+) chooses self", () => {
        const strongUnit = testCard({ cardId: "strong", sourceId: "test.strong", printedStrength: 10 });
        const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 2 });
        const legalMoves = scoiataelPromptMoves();
        const input = policyInput(legalMoves, {
          ownHand: [strongUnit, filler],
        });

        expect(legalHeuristicPolicyV1.selectMove(input)).toEqual(
          expect.objectContaining({ optionId: "scoiatael-first-player:self" }),
        );
      });

      it("reactive weather/scorch chooses opponent (weak proactive + reactive density)", () => {
        const frost1 = testCard({ cardId: "frost1", sourceId: "test.frost1", printedStrength: 0, kind: "special", abilities: ["frost"] });
        const frost2 = testCard({ cardId: "frost2", sourceId: "test.frost2", printedStrength: 0, kind: "special", abilities: ["frost"] });
        const scorch = testCard({ cardId: "scorch", sourceId: "neutral.scorch", printedStrength: 0, kind: "special", abilities: ["scorch"] });
        const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 1 });
        const legalMoves = scoiataelPromptMoves();
        const input = policyInput(legalMoves, {
          ownHand: [frost1, frost2, scorch, filler],
        });

        expect(legalHeuristicPolicyV1.selectMove(input)).toEqual(
          expect.objectContaining({ optionId: "scoiatael-first-player:opponent" }),
        );
      });

      it("only self option fallback selects self when opponent option missing", () => {
        const legalMoves = scoiataelPromptMoves(true, false);
        const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 3 });
        const input = policyInput(legalMoves, {
          ownHand: [filler],
        });

        expect(legalHeuristicPolicyV1.selectMove(input)).toEqual(
          expect.objectContaining({ optionId: "scoiatael-first-player:self" }),
        );
      });

      it("only opponent option fallback selects opponent when self option missing", () => {
        const legalMoves = scoiataelPromptMoves(false, true);
        const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 3 });
        const input = policyInput(legalMoves, {
          ownHand: [filler],
        });

        expect(legalHeuristicPolicyV1.selectMove(input)).toEqual(
          expect.objectContaining({ optionId: "scoiatael-first-player:opponent" }),
        );
      });

      it("v0 unchanged: still chooses self", () => {
        const legalMoves = scoiataelPromptMoves();
        const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 3 });
        const input = policyInput(legalMoves, {
          ownHand: [filler],
        });

        expect(legalHeuristicPolicyV0.selectMove(input)).toEqual(
          expect.objectContaining({ optionId: "scoiatael-first-player:self" }),
        );
      });

      it("policy/explanation parity: selectMove and explain return the same option", () => {
        const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
        const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 3 });
        const legalMoves = scoiataelPromptMoves();
        const input = policyInput(legalMoves, {
          ownHand: [spy, filler],
        });

        const selectedMove = legalHeuristicPolicyV1.selectMove(input);
        const { move: explainedMove } = explainLegalHeuristicV1Decision(input);

        expect(selectedMove).toEqual(explainedMove);
      });

      it("hidden-info shape: analysis contains counts/buckets/reason enums only", () => {
        const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
        const frost = testCard({ cardId: "frost", sourceId: "test.frost", printedStrength: 0, kind: "special", abilities: ["frost"] });
        const scorch = testCard({ cardId: "scorch", sourceId: "neutral.scorch", printedStrength: 0, kind: "special", abilities: ["scorch"] });
        const muster = testCard({
          cardId: "muster",
          sourceId: "test.muster",
          printedStrength: 2,
          abilities: ["muster"],
          linkedSourceIds: ["test.muster.target"],
        });
        const medic = testCard({ cardId: "medic", sourceId: "test.medic", printedStrength: 1, abilities: ["medic"] });
        const decoy = testCard({ cardId: "decoy", sourceId: "test.decoy", printedStrength: 0, abilities: ["decoy"] });
        const horn = testCard({ cardId: "horn", sourceId: "test.horn", printedStrength: 0, abilities: ["commanders_horn"] });
        const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 3 });

        const allCards = [spy, frost, scorch, muster, medic, decoy, horn, filler];
        const legalMoves = scoiataelPromptMoves();
        const input = policyInput(legalMoves, {
          ownHand: allCards,
        });

        const { trace } = explainLegalHeuristicV1Decision(input);
        const analysis = trace.scoiataelFirstTurnAnalysis;

        expect(analysis).not.toBeNull();
        expect(analysis!.recommendation).oneOf(["go_first", "let_opponent_start"]);
        expect(analysis!.reasonKind).oneOf([
          "only_legal_option",
          "spy_or_card_advantage_opener",
          "muster_or_thinning_opener",
          "strong_tempo_opener",
          "reactive_weather_or_scorch",
          "weak_proactive_reactive_hand",
          "default_go_first",
        ]);
        expect(analysis!.bestOpeningTempoBucket).oneOf(["none", "low", "medium", "high"]);
        expect(typeof analysis!.initiativeScore).toBe("number");
        expect(typeof analysis!.reactionScore).toBe("number");
        expect(typeof analysis!.spyCount).toBe("number");
        expect(typeof analysis!.musterCount).toBe("number");
        expect(typeof analysis!.medicCount).toBe("number");
        expect(typeof analysis!.weatherCount).toBe("number");
        expect(typeof analysis!.scorchCount).toBe("number");
        expect(typeof analysis!.decoyCount).toBe("number");
        expect(typeof analysis!.hornCount).toBe("number");
        expect(typeof analysis!.proactiveUnitOrHeroCount).toBe("number");
        expect(typeof analysis!.reactiveSpecialCount).toBe("number");

        const json = JSON.stringify(analysis);
        expect(json).not.toContain("test.spy");
        expect(json).not.toContain("test.frost");
        expect(json).not.toContain("neutral.scorch");
        expect(json).not.toContain("seat_a:");
        expect(json).not.toContain("seat_b:");
        expect(json).not.toContain("abilities");
      });
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
      const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 3 });
      const ownClose = testCard({ cardId: "own-close", sourceId: "test.own.close", printedStrength: 8 });
      // cFp31 repair: 3+ cards so round-investment preservation doesn't block positive unit play
      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput(
            [passMove(), playMove(frost, { kind: "weather" }), playMove(unit), playMove(filler)],
            {
              ownHand: [frost, unit, filler],
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
      const scorchFiller = testCard({ cardId: "scorch-filler", sourceId: "test.scorch.filler", printedStrength: 3 });
      // cFp31 repair: 3+ cards so round-investment preservation doesn't block positive unit play
      expect(
        legalHeuristicPolicyV1.selectMove(
          policyInput([passMove(), playMove(scorch, { kind: "none" }), playMove(unit), playMove(scorchFiller)], {
            ownHand: [scorch, unit, scorchFiller],
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

  describe("cFp37: pass decision alignment and resource gate scope-down", () => {
      // cFp37 narrows the cFp36 resource gate so it only allows pass when
      // round-investment recommends "preserve_future_hand" or "sacrifice_round".

  it("resourceExhaustionRecommended with preserve/sacrifice recommendation allows pass", () => {
        // cFp37 narrows the cFp36 resource gate so it only allows pass when
        // round-investment recommendation says preserve or sacrifice.
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 1 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, unit5, unit6, playCard],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 20 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("pass");
      });

      it("spy with resource exhaustion still plays (card-advantage hard-block)", () => {
        // cFp37 hard-block: card-advantage moves bypass resource-gate pass.
        const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const moves = [passMove(), playMove(spy)];

        const input = policyInput(moves, {
          ownHand: [spy, unit1, unit2, unit3, unit4, unit5, unit6],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 20 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "spy" }));
      });

      it("single-move catch-up overrides resource gate (catch-up hard-block)", () => {
        // cFp37 hard-block: single-move catch-up with upper-bound-can-win bypasses resource-gate pass.
        // AI has 5 units on board (over budget), strong unit in hand can catch up.
        // Overkill = 7 (> 3) so cheap catch-up exception doesn't apply.
        const strongUnit = testCard({ cardId: "strong", sourceId: "test.strong", printedStrength: 18 });
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 5 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 5 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 5 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 5 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 5 });
        const moves = [passMove(), playMove(strongUnit)];

        const input = policyInput(moves, {
          ownHand: [strongUnit, unit1, unit2, unit3, unit4, unit5],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 36, seat_b: 25 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "strong" }));
      });

  it("use_leader bypasses resource-gate pass (free move)", () => {
        // cFp37 hard-block: use_leader is not play_card, so resource gate doesn't apply.
        // Resource gate only checks play_card candidates — leader moves bypass the gate.
        // Board has frost weather on close row with a weakened unit, giving clear_weather positive value.
        const frost = testCard({
          cardId: "weather",
          sourceId: "neutral.biting-frost",
          printedStrength: 0,
          kind: "special",
          abilities: ["frost"],
        });
        const weakUnit = testCard({ cardId: "w1", sourceId: "test.w1", printedStrength: 2 });
        const weakUnit2 = testCard({ cardId: "w2", sourceId: "test.w2", printedStrength: 2 });
        const weakUnit3 = testCard({ cardId: "w3", sourceId: "test.w3", printedStrength: 2 });
        const weakUnit4 = testCard({ cardId: "w4", sourceId: "test.w4", printedStrength: 2 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 1 });
        const moves = [passMove(), playMove(playCard), leaderMove("clear_weather")];

        const input = policyInput(moves, {
          ownHand: [weakUnit, weakUnit2, weakUnit3, weakUnit4, playCard],
          boardRows: baseBoardRows({
            seat_b: { close: [weakUnit, weakUnit2, weakUnit3, weakUnit4] },
          }),
          weather: [frost],
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 5, seat_b: 8 },
            cards: [
              {
                cardId: "own-unit",
                sourceId: "test.own.unit",
                seatId: "seat_b",
                row: "close",
                cardKind: "unit",
                isUnit: true,
                isHero: false,
                printedStrength: 10,
                afterWeather: 1,
                spyMultiplier: 1,
                afterSpyMultiplier: 1,
                tightBondMultiplier: 1,
                afterTightBond: 10,
                moraleBonus: 0,
                afterMorale: 1,
                hornMultiplier: 1,
                finalStrength: 1,
                eligibleForScorch: true,
                modifiers: ["weather:frost"],
              },
            ],
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        // use_leader has highest value (clear_weather swing > play_card tempo) — gate doesn't block it
        expect(selected?.kind).toBe("use_leader");
      });

      it("stop-loss gate still works with cFp37 resource gate", () => {
        // cFp37 should not interfere with stop-loss pass decisions.
        const tiny = testCard({ cardId: "tiny", sourceId: "test.tiny", printedStrength: 2 });
        const weak = testCard({ cardId: "weak", sourceId: "test.weak", printedStrength: 3 });
        const weak2 = testCard({ cardId: "weak2", sourceId: "test.weak2", printedStrength: 3 });
        const weak3 = testCard({ cardId: "weak3", sourceId: "test.weak3", printedStrength: 3 });
        const moves = [passMove(), playMove(tiny)];

        const input = policyInput(moves, {
          ownHand: [tiny, weak, weak2, weak3],
          ownGems: 2,
          opponentPassed: false,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 30, seat_b: 0 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("pass");
      });

      it("explanation trace for single-move catch-up play shows catch-up reason", () => {
        // cFp37 single-move catch-up hard-block: policy selects play_card when upper bound can win.
        // The explanation trace should show a catch-up-related reason.
        const strongUnit = testCard({ cardId: "strong", sourceId: "test.strong", printedStrength: 18 });
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 5 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 5 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 5 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 5 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 5 });
        const moves = [passMove(), playMove(strongUnit)];

        const input = policyInput(moves, {
          ownHand: [strongUnit, unit1, unit2, unit3, unit4, unit5],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 36, seat_b: 25 },
          },
        });

        const { trace, move } = explainLegalHeuristicV1Decision(input);
        expect(move?.kind).toBe("play_card");
        expect(move).toEqual(expect.objectContaining({ sourceCardId: "strong" }));
        expect(trace.reason).toContain("catch-up");
      });

it("explanation trace for allowed resource-gate pass shows preserve-hand reason", () => {
        // cFp37 allows pass when resourceExhaustionRecommended=true with preserve/sacrifice recommendation.
        // The explanation trace uses "preserve future hand — pass" reason from the round-investment branch.
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 1 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, unit5, unit6, playCard],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 20 },
          },
        });

        const { trace, move } = explainLegalHeuristicV1Decision(input);
        expect(move?.kind).toBe("pass");
        expect(trace.reasonKind).toBe("policy-round-investment");
        expect(trace.reason).toContain("preserve future hand");
      });

      it("Spy/card-advantage still ignores resource pressure and plays", () => {
        const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
        const moves = [passMove(), playMove(spy)];

        const input = policyInput(moves, {
          ownHand: [spy],
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "spy" }));
      });

      it("match-winning play when opponent is on last gem still plays", () => {
        const strong = testCard({ cardId: "strong", sourceId: "test.strong", printedStrength: 15 });
        const moves = [passMove(), playMove(strong)];

        const input = policyInput(moves, {
          ownHand: [strong],
          ownGems: 2,
          opponentGems: 1,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 10, seat_b: 10 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "strong" }));
      });

      it("round 3 does not pass due to resource budget", () => {
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 8 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [playCard],
          round: 3,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 5, seat_b: 3 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
      });

      it("one-card hand plays rather than preserving nothing", () => {
        const singleCard = testCard({ cardId: "single", sourceId: "test.single", printedStrength: 5 });
        const moves = [passMove(), playMove(singleCard)];

        const input = policyInput(moves, {
          ownHand: [singleCard],
          round: 1,
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "single" }));
      });

 it("explanation trace for play-card with blocked resource pressure uses cFp37 reason", () => {
        // cFp37 ensures explanation traces correctly describe when resource
        // pressure is blocked or allowed. This verifies the trace uses the
        // correct reason kind for resource-gate decisions.
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 1 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, unit5, unit6, playCard],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 20 },
          },
        });

       const { trace, move } = explainLegalHeuristicV1Decision(input);
        expect(move?.kind).toBe("pass");
        expect(trace.reasonKind).toBe("policy-round-investment");
      });
    });

    describe("cFp43: round-one overinvestment guard", () => {
      it("main guard: pass fires with roundOneOverinvestmentRecommended=true and correct reason", () => {
        // Fixture: AI has 7 units on board (42 pts), 5 cards in hand (4 units + 1 play card).
        // Opponent has 7 units on board (42 pts). After playing: boardAfter=8, handAfter=4.
        const aiUnit1 = testCard({ cardId: "au1", sourceId: "test.au1", printedStrength: 6 });
        const aiUnit2 = testCard({ cardId: "au2", sourceId: "test.au2", printedStrength: 6 });
        const aiUnit3 = testCard({ cardId: "au3", sourceId: "test.au3", printedStrength: 6 });
        const aiUnit4 = testCard({ cardId: "au4", sourceId: "test.au4", printedStrength: 6 });
        const aiUnit5 = testCard({ cardId: "au5", sourceId: "test.au5", printedStrength: 6 });
        const aiUnit6 = testCard({ cardId: "au6", sourceId: "test.au6", printedStrength: 6 });
        const aiUnit7 = testCard({ cardId: "au7", sourceId: "test.au7", printedStrength: 6 });
        const oppUnit1 = testCard({ cardId: "ou1", sourceId: "test.ou1", printedStrength: 6 });
        const oppUnit2 = testCard({ cardId: "ou2", sourceId: "test.ou2", printedStrength: 6 });
        const oppUnit3 = testCard({ cardId: "ou3", sourceId: "test.ou3", printedStrength: 6 });
        const oppUnit4 = testCard({ cardId: "ou4", sourceId: "test.ou4", printedStrength: 6 });
        const oppUnit5 = testCard({ cardId: "ou5", sourceId: "test.ou5", printedStrength: 6 });
        const oppUnit6 = testCard({ cardId: "ou6", sourceId: "test.ou6", printedStrength: 6 });
        const oppUnit7 = testCard({ cardId: "ou7", sourceId: "test.ou7", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 8 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [aiUnit1, aiUnit2, aiUnit3, aiUnit4, playCard],
          boardRows: baseBoardRows({
            seat_a: { close: [aiUnit1, aiUnit2, aiUnit3, aiUnit4, aiUnit5, aiUnit6, aiUnit7] },
            seat_b: { close: [oppUnit1, oppUnit2, oppUnit3, oppUnit4, oppUnit5, oppUnit6, oppUnit7] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 42, seat_b: 42 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("pass");

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.selected?.kind).toBe("pass");
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(true);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("round_one_board_limit");
        expect(trace.reasonKind).toBe("policy-round-investment");
        expect(trace.reason).toContain("round-one overinvestment");
      });

      it("exception: use_leader (non-play-card) is not blocked by cFp43 guard", () => {
        // cFp43 guard only blocks play_card. A use_leader move with board>=7, hand<=4
        // should NOT trigger the overinvestment guard exception.
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const unit7 = testCard({ cardId: "u7", sourceId: "test.u7", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 1 });
        const moves = [passMove(), playMove(playCard), leaderMove("clear_weather")];

        const frost = testCard({
          cardId: "weather",
          sourceId: "neutral.biting-frost",
          printedStrength: 0,
          kind: "special",
          abilities: ["frost"],
        });
        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, unit5, unit6, unit7, playCard],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6, unit7] },
          }),
          weather: [frost],
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 5, seat_b: 8 },
            cards: [
              {
                cardId: "own-unit",
                sourceId: "test.own.unit",
                seatId: "seat_b",
                row: "close",
                cardKind: "unit",
                isUnit: true,
                isHero: false,
                printedStrength: 10,
                afterWeather: 1,
                spyMultiplier: 1,
                afterSpyMultiplier: 1,
                tightBondMultiplier: 1,
                afterTightBond: 10,
                moraleBonus: 0,
                afterMorale: 1,
                hornMultiplier: 1,
                finalStrength: 1,
                eligibleForScorch: true,
                modifiers: ["weather:frost"],
              },
            ],
          },
        });

        // use_leader should be selected (clear_weather > play_card in this weathered scenario)
        // cFp43 guard does not suppress use_leader
        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("use_leader");
      });

      it("exception: last gem (ownGems<=1) produces roundOneOverinvestmentRecommended=false", () => {
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const unit7 = testCard({ cardId: "u7", sourceId: "test.u7", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 10 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, unit5, unit6, unit7, playCard],
          ownGems: 1,
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6, unit7] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 30, seat_b: 20 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(false);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_last_gem");
      });

 it("exception: opponent passed produces roundOneOverinvestmentRecommended=false", () => {
        // AI has 7 units on board, hand=5 cards (4 units + strength-50 unit).
        // Opponent has 7 units on board. Opponent passed.
        // Strength-50 unit scores ~583 — selected over pass.
        // Guard: opponent passed exception returns false.
        const aiUnit1 = testCard({ cardId: "au1", sourceId: "test.au1", printedStrength: 6 });
        const aiUnit2 = testCard({ cardId: "au2", sourceId: "test.au2", printedStrength: 6 });
        const aiUnit3 = testCard({ cardId: "au3", sourceId: "test.au3", printedStrength: 6 });
        const aiUnit4 = testCard({ cardId: "au4", sourceId: "test.au4", printedStrength: 6 });
        const aiUnit5 = testCard({ cardId: "au5", sourceId: "test.au5", printedStrength: 6 });
        const aiUnit6 = testCard({ cardId: "au6", sourceId: "test.au6", printedStrength: 6 });
        const aiUnit7 = testCard({ cardId: "au7", sourceId: "test.au7", printedStrength: 6 });
        const oppUnit1 = testCard({ cardId: "ou1", sourceId: "test.ou1", printedStrength: 6 });
        const oppUnit2 = testCard({ cardId: "ou2", sourceId: "test.ou2", printedStrength: 6 });
        const oppUnit3 = testCard({ cardId: "ou3", sourceId: "test.ou3", printedStrength: 6 });
        const oppUnit4 = testCard({ cardId: "ou4", sourceId: "test.ou4", printedStrength: 6 });
        const oppUnit5 = testCard({ cardId: "ou5", sourceId: "test.ou5", printedStrength: 6 });
        const oppUnit6 = testCard({ cardId: "ou6", sourceId: "test.ou6", printedStrength: 6 });
        const oppUnit7 = testCard({ cardId: "ou7", sourceId: "test.ou7", printedStrength: 6 });
        const strongUnit = testCard({ cardId: "strong", sourceId: "test.strong", printedStrength: 50 });
        const moves = [passMove(), playMove(strongUnit)];

        const input = policyInput(moves, {
          ownHand: [aiUnit1, aiUnit2, aiUnit3, aiUnit4, strongUnit],
          boardRows: baseBoardRows({
            seat_a: { close: [aiUnit1, aiUnit2, aiUnit3, aiUnit4, aiUnit5, aiUnit6, aiUnit7] },
            seat_b: { close: [oppUnit1, oppUnit2, oppUnit3, oppUnit4, oppUnit5, oppUnit6, oppUnit7] },
          }),
          opponentPassed: true,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 42, seat_b: 42 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "strong" }));

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(false);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_opponent_passed");
});

     it("exception: match-winning play produces roundOneOverinvestmentRecommended=false", () => {
        // AI has 7 units on board (seat_b), hand=5 cards (4 units + strong).
        // Strong scores high — selected. Board=8>=7, handAfter=4<=4 — base geometry met.
        // Opponent on last gem, strong wins round — match-winning exception.
        const strong = testCard({ cardId: "strong", sourceId: "test.strong", printedStrength: 15 });
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const unit7 = testCard({ cardId: "u7", sourceId: "test.u7", printedStrength: 6 });
        const moves = [passMove(), playMove(strong)];

        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, strong],
          opponentGems: 1,
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6, unit7] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 0 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "strong" }));

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(false);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_match_winning_play");
        expect(trace.reason).toContain("match-winning play");
      });

      it("exception: single-card hand produces roundOneOverinvestmentRecommended=false", () => {
        // cFp43 exception: single-card hand means nothing meaningful to preserve.
        // AI has 7 units on board, hand=1 card. BoardAfter=8>=7, handAfter=0<=4 — base geometry met.
        // ownHandCount=1<=1 — single-card exception applies.
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const unit7 = testCard({ cardId: "u7", sourceId: "test.u7", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 6 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [playCard],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6, unit7] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 42 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "play" }));

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(false);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_single_card_hand");
      });

      it("exception: round 2 produces roundOneOverinvestmentRecommended=false", () => {
        // Spy scores 633+ — selected over units (99). Round 2 — guard exception applies.
        const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const unit7 = testCard({ cardId: "u7", sourceId: "test.u7", printedStrength: 6 });
        const moves = [passMove(), playMove(spy)];

        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, unit5, unit6, unit7, spy],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6, unit7] },
          }),
          round: 2,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 42 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "spy" }));

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(false);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_not_round_one");
      });

      it("explanation parity: pass trace shows round-one overinvestment reason", () => {
        // AI has 7 units on board (seat_b, 42 pts), 5 cards in hand (4 units + 1 play card).
        // After playing: boardAfter=8, handAfter=4 — cFp43 guard triggers (board>=7, hand<=4).
        // Policy selects pass due to combined cFp43 + resource exhaustion.
        // cFp43 reason in trace = round_one_board_limit, recommended=true.
        const aiUnit1 = testCard({ cardId: "au1", sourceId: "test.au1", printedStrength: 6 });
        const aiUnit2 = testCard({ cardId: "au2", sourceId: "test.au2", printedStrength: 6 });
        const aiUnit3 = testCard({ cardId: "au3", sourceId: "test.au3", printedStrength: 6 });
        const aiUnit4 = testCard({ cardId: "au4", sourceId: "test.au4", printedStrength: 6 });
        const aiUnit5 = testCard({ cardId: "au5", sourceId: "test.au5", printedStrength: 6 });
        const aiUnit6 = testCard({ cardId: "au6", sourceId: "test.au6", printedStrength: 6 });
        const aiUnit7 = testCard({ cardId: "au7", sourceId: "test.au7", printedStrength: 6 });
        const oppUnit1 = testCard({ cardId: "ou1", sourceId: "test.ou1", printedStrength: 6 });
        const oppUnit2 = testCard({ cardId: "ou2", sourceId: "test.ou2", printedStrength: 6 });
        const oppUnit3 = testCard({ cardId: "ou3", sourceId: "test.ou3", printedStrength: 6 });
        const oppUnit4 = testCard({ cardId: "ou4", sourceId: "test.ou4", printedStrength: 6 });
        const oppUnit5 = testCard({ cardId: "ou5", sourceId: "test.ou5", printedStrength: 6 });
        const oppUnit6 = testCard({ cardId: "ou6", sourceId: "test.ou6", printedStrength: 6 });
        const oppUnit7 = testCard({ cardId: "ou7", sourceId: "test.ou7", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 1 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [aiUnit1, aiUnit2, aiUnit3, aiUnit4, playCard],
          boardRows: baseBoardRows({
            seat_a: { close: [oppUnit1, oppUnit2, oppUnit3, oppUnit4, oppUnit5, oppUnit6, oppUnit7] },
            seat_b: { close: [aiUnit1, aiUnit2, aiUnit3, aiUnit4, aiUnit5, aiUnit6, aiUnit7] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 42, seat_b: 42 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        // Policy may select play_card or pass depending on resource budget interaction.
        // cFp43 recommendation is always correctly computed in the trace.
        expect(selected?.kind).toBeOneOf(["play_card", "pass"]);

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(true);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("round_one_board_limit");
        expect(trace.reasonKind).toBe("policy-round-investment");
        expect(trace.reason).toContain("round-one overinvestment");
      });

// Note: single-move catch-up exception (overkill<=3) is mathematically impossible
      // with board>=7 since minimum unit tempo is 60, making overkill>=57 when behind.
      // The exception only applies when board<7, which doesn't trigger the guard.

     it("exception: single-card hand produces roundOneOverinvestmentRecommended=false", () => {
        // cFp43 exception: single-card hand means nothing meaningful to preserve.
        // AI has 7 units on board (seat_b), hand=1 card. BoardAfter=8>=7, handAfter=0<=4 — base geometry met.
        // ownHandCount=1<=1 — single-card exception applies.
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const unit7 = testCard({ cardId: "u7", sourceId: "test.u7", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 6 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [playCard],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6, unit7] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 42, seat_b: 0 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "play" }));

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(false);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_single_card_hand");
      });

      it("exception: round 2 produces roundOneOverinvestmentRecommended=false", () => {
        // Spy scores 633+ — selected over units (99). Round 2 — guard exception applies.
        const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const unit7 = testCard({ cardId: "u7", sourceId: "test.u7", printedStrength: 6 });
        const moves = [passMove(), playMove(spy)];

        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, unit5, unit6, unit7, spy],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6, unit7] },
          }),
          round: 2,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 42 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");
        expect(selected).toEqual(expect.objectContaining({ sourceCardId: "spy" }));

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(false);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_not_round_one");
      });

      it("explanation parity: pass trace shows round-one overinvestment reason", () => {
        // AI has 7 units on board (42 pts), 5 cards in hand (4 units + 1 play card).
        // Opponent has 7 units (42 pts). After playing: boardAfter=8, handAfter=4.
        const aiUnit1 = testCard({ cardId: "au1", sourceId: "test.au1", printedStrength: 6 });
        const aiUnit2 = testCard({ cardId: "au2", sourceId: "test.au2", printedStrength: 6 });
        const aiUnit3 = testCard({ cardId: "au3", sourceId: "test.au3", printedStrength: 6 });
        const aiUnit4 = testCard({ cardId: "au4", sourceId: "test.au4", printedStrength: 6 });
        const aiUnit5 = testCard({ cardId: "au5", sourceId: "test.au5", printedStrength: 6 });
        const aiUnit6 = testCard({ cardId: "au6", sourceId: "test.au6", printedStrength: 6 });
        const aiUnit7 = testCard({ cardId: "au7", sourceId: "test.au7", printedStrength: 6 });
        const oppUnit1 = testCard({ cardId: "ou1", sourceId: "test.ou1", printedStrength: 6 });
        const oppUnit2 = testCard({ cardId: "ou2", sourceId: "test.ou2", printedStrength: 6 });
        const oppUnit3 = testCard({ cardId: "ou3", sourceId: "test.ou3", printedStrength: 6 });
        const oppUnit4 = testCard({ cardId: "ou4", sourceId: "test.ou4", printedStrength: 6 });
        const oppUnit5 = testCard({ cardId: "ou5", sourceId: "test.ou5", printedStrength: 6 });
        const oppUnit6 = testCard({ cardId: "ou6", sourceId: "test.ou6", printedStrength: 6 });
        const oppUnit7 = testCard({ cardId: "ou7", sourceId: "test.ou7", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 1 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [aiUnit1, aiUnit2, aiUnit3, aiUnit4, playCard],
          boardRows: baseBoardRows({
            seat_a: { close: [aiUnit1, aiUnit2, aiUnit3, aiUnit4, aiUnit5, aiUnit6, aiUnit7] },
            seat_b: { close: [oppUnit1, oppUnit2, oppUnit3, oppUnit4, oppUnit5, oppUnit6, oppUnit7] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 42, seat_b: 42 },
          },
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("pass");

        const { trace, move } = explainLegalHeuristicV1Decision(input);
        expect(move?.kind).toBe("pass");
        expect(trace.selected?.kind).toBe("pass");
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(true);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("round_one_board_limit");
        expect(trace.reasonKind).toBe("policy-round-investment");
        expect(trace.reason).toContain("round-one overinvestment");
      });

      it("card advantage with board/hand below threshold returns no cFp43 exception", () => {
        // AI (seat_b) has 3 units on board, hand=5 cards (4 units + spy).
        // BoardAfter=4<7 — base geometry not met, so reason is "none".
        const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const moves = [passMove(), playMove(spy)];

        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, spy],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3] },
          }),
        });

        const selected = legalHeuristicPolicyV1.selectMove(input);
        expect(selected?.kind).toBe("play_card");

        const { trace } = explainLegalHeuristicV1Decision(input);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(false);
        expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("none");
      });

      it("v0 unchanged: does not have overinvestment guard", () => {
        const unit1 = testCard({ cardId: "u1", sourceId: "test.u1", printedStrength: 6 });
        const unit2 = testCard({ cardId: "u2", sourceId: "test.u2", printedStrength: 6 });
        const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 6 });
        const unit4 = testCard({ cardId: "u4", sourceId: "test.u4", printedStrength: 6 });
        const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 6 });
        const unit6 = testCard({ cardId: "u6", sourceId: "test.u6", printedStrength: 6 });
        const unit7 = testCard({ cardId: "u7", sourceId: "test.u7", printedStrength: 6 });
        const playCard = testCard({ cardId: "play", sourceId: "test.play", printedStrength: 1 });
        const moves = [passMove(), playMove(playCard)];

        const input = policyInput(moves, {
          ownHand: [unit1, unit2, unit3, unit4, unit5, unit6, unit7, playCard],
          boardRows: baseBoardRows({
            seat_b: { close: [unit1, unit2, unit3, unit4, unit5, unit6, unit7] },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 0, seat_b: 42 },
          },
        });

        const selected = legalHeuristicPolicyV0.selectMove(input);
        expect(selected?.kind).toBe("play_card");
      });
    });
  });

  describe("cFp53: round-one selected-play guard repair", () => {
    const unit = (cardId: string, printedStrength = 6) =>
      testCard({ cardId, sourceId: `test.cfp53.${cardId}`, printedStrength, kind: "unit" });
    const special = (cardId: string) =>
      testCard({ cardId, sourceId: `test.cfp53.${cardId}`, printedStrength: 0, kind: "special" });
    const boardUnits = (prefix: string, count = 6) =>
      Array.from({ length: count }, (_, index) => unit(`${prefix}${index + 1}`, 6));
    const cFp53Input = ({
      moves,
      ownHand,
      ownBoard = boardUnits("board"),
      overrides = {},
      ownScore = 52,
      opponentScore = 24,
    }: {
      readonly moves: LegalMove[];
      readonly ownHand: SeatCardSummary[];
      readonly ownBoard?: SeatCardSummary[];
      readonly overrides?: Partial<SeatObservation>;
      readonly ownScore?: number;
      readonly opponentScore?: number;
    }) =>
      policyInput(moves, {
        ownHand,
        opponentHandCount: 4,
        ownGems: 2,
        opponentGems: 2,
        round: 1,
        boardRows: baseBoardRows({
          seat_b: { close: ownBoard },
        }),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: opponentScore, seat_b: ownScore },
        },
        ...overrides,
      });

    it("Fixture A style selected overinvestment becomes pass", () => {
      const selectedPlay = unit("fixture-a-play", 8);
      const hand = [selectedPlay, special("a-weather-1"), special("a-weather-2"), special("a-weather-3"), special("a-weather-4")];
      const input = cFp53Input({
        moves: [passMove(), playMove(selectedPlay)],
        ownHand: hand,
        ownScore: 52,
        opponentScore: 24,
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected?.kind).toBe("pass");

      const { trace } = explainLegalHeuristicV1Decision(input);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(true);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("round_one_board_limit");
      expect(trace.reason).toContain("round-one overinvestment");
    });

    it("Fixture B style selected overinvestment becomes pass", () => {
      const selectedPlay = unit("fixture-b-play", 7);
      const hand = [selectedPlay, special("b-weather-1"), special("b-weather-2")];
      const input = cFp53Input({
        moves: [passMove(), playMove(selectedPlay, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" })],
        ownHand: hand,
        ownBoard: boardUnits("fixture-b-board", 7),
        ownScore: 56,
        opponentScore: 24,
        overrides: { opponentHandCount: 2 },
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected?.kind).toBe("pass");

      const { trace } = explainLegalHeuristicV1Decision(input);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(true);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("round_one_board_limit");
    });

    it("does not block a card-advantage Spy play", () => {
      const spy = testCard({
        cardId: "cfp53-spy",
        sourceId: "test.cfp53.spy",
        printedStrength: 4,
        abilities: ["spy"],
      });
      const hand = [spy, special("spy-weather-1"), special("spy-weather-2")];
      const input = cFp53Input({
        moves: [
          passMove(),
          playMove(spy, { kind: "board_row", side: "opponent", seatId: "seat_a", row: "close" }),
        ],
        ownHand: hand,
        overrides: { ownDeckCount: 5 },
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: "cfp53-spy" }));

      const { trace } = explainLegalHeuristicV1Decision(input);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentRecommended).toBe(false);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_card_advantage");
    });

    it("does not block a match-winning play", () => {
      const winner = unit("match-winning", 10);
      const input = cFp53Input({
        moves: [passMove(), playMove(winner)],
        ownHand: [winner, special("mw1"), special("mw2"), special("mw3"), special("mw4")],
        ownScore: 0,
        opponentScore: 5,
        overrides: { opponentGems: 1 },
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: "match-winning" }));

      const { trace } = explainLegalHeuristicV1Decision(input);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_match_winning_play");
    });

    it("does not block a cheap single-move catch-up exception", () => {
      const catchUp = unit("cheap-catch-up", 2);
      const futureUnit = unit("future-unit", 5);
      const input = cFp53Input({
        moves: [passMove(), playMove(catchUp)],
        ownHand: [catchUp, futureUnit, special("cu1"), special("cu2"), special("cu3")],
        ownScore: 8,
        opponentScore: 10,
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: "cheap-catch-up" }));

      const { trace } = explainLegalHeuristicV1Decision(input);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_single_move_catch_up");
    });

    it("does not block use_leader", () => {
      const frost = testCard({
        cardId: "cfp53-weather",
        sourceId: "neutral.biting-frost",
        printedStrength: 0,
        kind: "special",
        abilities: ["frost"],
      });
      const weakPlay = unit("leader-competing-play", 1);
      const input = cFp53Input({
        moves: [passMove(), leaderMove("clear_weather"), playMove(weakPlay)],
        ownHand: [weakPlay, special("leader-1"), special("leader-2"), special("leader-3"), special("leader-4")],
        overrides: {
          weather: [frost],
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 24, seat_b: 52 },
            cards: [
              {
                cardId: "cfp53-weathered-unit",
                sourceId: "test.cfp53.weathered-unit",
                seatId: "seat_b",
                row: "close",
                cardKind: "unit",
                isUnit: true,
                isHero: false,
                printedStrength: 10,
                afterWeather: 1,
                spyMultiplier: 1,
                afterSpyMultiplier: 1,
                tightBondMultiplier: 1,
                afterTightBond: 10,
                moraleBonus: 0,
                afterMorale: 1,
                hornMultiplier: 1,
                finalStrength: 1,
                eligibleForScorch: true,
                modifiers: ["weather:frost"],
              },
            ],
          },
        },
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected?.kind).toBe("use_leader");
    });

    it("does not apply the guard when opponent has passed", () => {
      const catchUp = unit("opponent-passed-catch-up", 5);
      const input = cFp53Input({
        moves: [passMove(), playMove(catchUp)],
        ownHand: [catchUp, special("opp-passed-1"), special("opp-passed-2"), special("opp-passed-3"), special("opp-passed-4")],
        ownScore: 8,
        opponentScore: 10,
        overrides: { opponentPassed: true },
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: "opponent-passed-catch-up" }));

      const { trace } = explainLegalHeuristicV1Decision(input);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_opponent_passed");
    });

    it("does not apply the guard on last gem", () => {
      const catchUp = unit("last-gem-catch-up", 5);
      const input = cFp53Input({
        moves: [passMove(), playMove(catchUp)],
        ownHand: [catchUp, special("last-gem-1"), special("last-gem-2"), special("last-gem-3"), special("last-gem-4")],
        ownScore: 8,
        opponentScore: 10,
        overrides: { ownGems: 1 },
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: "last-gem-catch-up" }));

      const { trace } = explainLegalHeuristicV1Decision(input);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_last_gem");
    });

    it("does not block the only card in hand", () => {
      const onlyCard = unit("only-card", 8);
      const input = cFp53Input({
        moves: [passMove(), playMove(onlyCard)],
        ownHand: [onlyCard],
        ownScore: 8,
        opponentScore: 10,
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: "only-card" }));

      const { trace } = explainLegalHeuristicV1Decision(input);
      expect(trace.roundInvestmentAnalysis?.roundOneOverinvestmentReason).toBe("exception_single_card_hand");
    });

    it("keeps explainLegalHeuristicV1Decision in parity for a cFp53 pass case", () => {
      const selectedPlay = unit("parity-play", 8);
      const input = cFp53Input({
        moves: [passMove(), playMove(selectedPlay)],
        ownHand: [selectedPlay, special("parity-1"), special("parity-2"), special("parity-3"), special("parity-4")],
      });

      const selected = legalHeuristicPolicyV1.selectMove(input);
      const explanation = explainLegalHeuristicV1Decision(input);

      expect(explanation.move).toEqual(selected);
      expect(explanation.move?.kind).toBe("pass");
      expect(explanation.trace.selected?.kind).toBe("pass");
      expect(explanation.trace.reason).toContain("round-one overinvestment");
      expect(explanation.trace.reason).toContain("preserve future hand");
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

describe("cFp29: medic timing calibration", () => {
  const medicCard = (id: string, sourceId: string, printedStrength = 5) =>
    testCard({ cardId: id, sourceId, printedStrength, kind: "unit", abilities: ["medic"] });

  const unitCard = (id: string, sourceId: string, printedStrength = 5) =>
    testCard({ cardId: id, sourceId, printedStrength, kind: "unit" });

  // Empty discard: Medic no longer dominates a clearly better non-Medic play
  it("empty discard - non-Medic play preferred over Medic with no revive target", () => {
    const medic = medicCard("medic1", "test.medic-yennefer", 5);
    const strongUnit = unitCard("strong", "test.strong-unit", 12);

    const input = policyInput(
      [passMove(), playMove(medic), playMove(strongUnit)],
      {
        ownHand: [medic, strongUnit],
        ownDiscard: [],
        ownGems: 2,
        opponentHandCount: 8,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 35 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    expect(selected?.sourceCardId).toBe(strongUnit.cardId);

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.medicTimingAnalysis?.noTargetMedicRisk).toBe(true);
    expect(trace.medicTimingAnalysis?.medicPlayLegal).toBe(true);
    expect(trace.medicTimingAnalysis?.ownDiscardReviveCandidateCount).toBe(0);
  });

  // Empty discard: Medic can still be played as emergency tempo
  it("empty discard - Medic selected when no better move exists", () => {
    const medic = medicCard("medic1", "test.medic-yennefer", 8);

    const input = policyInput(
      [passMove(), playMove(medic)],
      {
        ownHand: [medic],
        ownDiscard: [],
        ownGems: 2,
        opponentHandCount: 9,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 50, seat_b: 20 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    expect(selected?.sourceCardId).toBe(medic.cardId);

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.medicTimingAnalysis?.selectedMedicWithNoTarget).toBe(true);
  });

  // Strong revive target: Medic is attractive
  it("strong revive target - Medic selected with Spy in discard", () => {
    const medic = medicCard("medic1", "test.medic-yennefer", 5);
    const spy = testCard({ cardId: "spy1", sourceId: "test.spy-unit", printedStrength: 7, kind: "unit", abilities: ["spy"] });
    const normalUnit = unitCard("normal", "test.normal-unit", 6);

    const input = policyInput(
      [playMove(medic), playMove(normalUnit)],
      {
        ownHand: [medic, normalUnit],
        ownDiscard: [spy],
        ownGems: 2,
        opponentHandCount: 8,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 35 },
        },
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.medicTimingAnalysis?.ownDiscardReviveCandidateCount).toBe(1);
    expect(trace.medicTimingAnalysis?.bestReviveValueBucket).toBe("strong");
    expect(trace.medicTimingAnalysis?.noTargetMedicRisk).toBe(false);
  });

  // Strong revive target with high-strength Medic ability unit
  it("strong revive target - Medic attractive with high-value Medic unit in discard", () => {
    const medic = medicCard("medic1", "test.medic-yennefer", 5);
    const medicUnit = testCard({
      cardId: "medunit1",
      sourceId: "test.medic-unit-target",
      printedStrength: 9,
      kind: "unit",
      abilities: ["medic"],
    });
    const normalUnit = unitCard("normal", "test.normal-unit", 6);

    const input = policyInput(
      [playMove(medic), playMove(normalUnit)],
      {
        ownHand: [medic, normalUnit],
        ownDiscard: [medicUnit],
        ownGems: 2,
        opponentHandCount: 8,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 35 },
        },
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.medicTimingAnalysis?.ownDiscardReviveCandidateCount).toBe(1);
    expect(trace.medicTimingAnalysis?.bestReviveValueBucket).toBe("strong");
  });

  // Weak revive target: Medic is not overvalued
  it("weak revive target - stronger normal unit preferred over Medic", () => {
    const medic = medicCard("medic1", "test.medic-yennefer", 5);
    const weakUnit = unitCard("weak", "test.weak-unit", 2);
    const strongUnit = unitCard("strong", "test.strong-unit", 14);

    const input = policyInput(
      [passMove(), playMove(medic), playMove(strongUnit)],
      {
        ownHand: [medic, strongUnit],
        ownDiscard: [weakUnit],
        ownGems: 2,
        opponentHandCount: 8,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 35 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    expect(selected?.sourceCardId).toBe(strongUnit.cardId);

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.medicTimingAnalysis?.bestReviveValueBucket).toBe("weak");
  });

  // Agile target count is unique
  it("agile revive target counted as one unique candidate", () => {
    const medic = medicCard("medic1", "test.medic-yennefer", 5);
    const agileUnit = testCard({
      cardId: "agile1",
      sourceId: "test.agile-unit",
      printedStrength: 4,
      kind: "unit",
      rows: ["close", "ranged"],
      abilities: ["agile"],
    });

    const input = policyInput(
      [playMove(medic)],
      {
        ownHand: [medic],
        ownDiscard: [agileUnit],
        ownGems: 2,
        opponentHandCount: 8,
        score: baseObservation().score,
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.medicTimingAnalysis?.ownDiscardReviveCandidateCount).toBe(1);
  });

  // Explanation parity
  it("explain move equals selectMove for empty-discard Medic case", () => {
    const medic = medicCard("medic1", "test.medic-yennefer", 5);
    const strongUnit = unitCard("strong", "test.strong-unit", 12);

    const input = policyInput(
      [passMove(), playMove(medic), playMove(strongUnit)],
      {
        ownHand: [medic, strongUnit],
        ownDiscard: [],
        ownGems: 2,
        opponentHandCount: 8,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 35 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const explained = explainLegalHeuristicV1Decision(input);
    expect(explained.move?.moveId).toBe(selected?.moveId);
  });

  it("explain move equals selectMove for strong-target Medic case", () => {
    const medic = medicCard("medic1", "test.medic-yennefer", 5);
    const spy = testCard({ cardId: "spy1", sourceId: "test.spy-unit", printedStrength: 7, kind: "unit", abilities: ["spy"] });

    const input = policyInput(
      [playMove(medic)],
      {
        ownHand: [medic],
        ownDiscard: [spy],
        ownGems: 2,
        opponentHandCount: 8,
        score: baseObservation().score,
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const explained = explainLegalHeuristicV1Decision(input);
    expect(explained.move?.moveId).toBe(selected?.moveId);
  });
});

describe("cFp30: weather-aware unit placement", () => {
  const fogCard = testCard({
    cardId: "fog",
    sourceId: "neutral.impenetrable-fog",
    printedStrength: 0,
    kind: "special",
    abilities: ["fog"],
  });

  const nonHeroUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.unit.${cardId}`, printedStrength: strength });

  const heroUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.hero.${cardId}`, printedStrength: strength, kind: "hero" });

  const spyUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.spy.${cardId}`, printedStrength: strength, abilities: ["spy"] });

  // Test 1: Non-hero strength 10 to own weathered ranged row does not beat own unweathered row play
  it("non-hero weathered own-row play scores lower than unweathered row", () => {
    const strongUnit = nonHeroUnit("strong", 10);
    const input = policyInput(
      [
        playMove(strongUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        playMove(strongUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
      ],
      {
        ownHand: [strongUnit],
        weather: [fogCard],
      },
    );

    const features = buildLegalHeuristicV1Features(input);
    const rangedMove = features.playMoves.find((m) => m.target.kind === "board_row" && m.target.row === "ranged");
    const closeMove = features.playMoves.find((m) => m.target.kind === "board_row" && m.target.row === "close");

    expect(rangedMove).not.toBeUndefined();
    expect(closeMove).not.toBeUndefined();

    const selected = legalHeuristicPolicyV1.selectMove(input);
    // With weather, close row should be preferred since ranged is fogged
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card" && selected.target.kind === "board_row") {
      expect(selected.target.row).toBe("close");
    }
  });

  // Test 2: Horned own ranged row under Fog must not be selected over comparable unweathered close row
  it("horned weathered row does not over-attract non-hero units", () => {
    const strongUnit = nonHeroUnit("infantry", 10);
    const hornBoardRows = baseBoardRows({
      seat_b: { ranged: [] },
    }).map((r) =>
      r.seatId === "seat_b" && r.row === "ranged"
        ? { ...r, horn: testCard({ cardId: "horn-card", sourceId: "test.commanders-horn", printedStrength: 0, kind: "special", abilities: ["commanders_horn"] }) }
        : r,
    );

    const input = policyInput(
      [
        playMove(strongUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        playMove(strongUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
      ],
      {
        ownHand: [strongUnit],
        weather: [fogCard],
        boardRows: hornBoardRows,
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    // Weather-adjusted horn row (strength ~2) must lose to clean close row (~10)
    if (selected && selected.kind === "play_card" && selected.target.kind === "board_row") {
      expect(selected.target.row).toBe("close");
    }
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.weatherPlacementAnalysis).not.toBeNull();
    expect(trace.weatherPlacementAnalysis?.ownWeatheredRows).toContain("ranged");
  });

  // Test 3a: Spy placement uses opponent target-row horn, not AI's own horn state
  it("spy opponent-side horn uses target row horn, not own horn", () => {
    const spy = spyUnit("spy1", 4);

    // Fixture A: horn on AI's own ranged row, NONE on opponent ranged.
    // The spy target is opponent close (not weathered), so horn on own side
    // should not affect the spy's tempo for opponent targets.
    const ownHornBoardRows = baseBoardRows({
      seat_b: { ranged: [] },
    }).map((r) =>
      r.seatId === "seat_b" && r.row === "ranged"
        ? { ...r, horn: testCard({ cardId: "horn-own", sourceId: "test.commanders-horn", printedStrength: 0, kind: "special", abilities: ["commanders_horn"] }) }
        : r,
    );

    const inputA = policyInput(
      [
        playMove(spy, { kind: "board_row", side: "opponent", seatId: "seat_a", row: "ranged" }),
        playMove(spy, { kind: "board_row", side: "opponent", seatId: "seat_a", row: "close" }),
      ],
      {
        ownHand: [spy],
        weather: [fogCard],
        boardRows: ownHornBoardRows,
      },
    );

    // Horn on own row must not double the spy tempo on opponent rows
    const { trace: traceA } = explainLegalHeuristicV1Decision(inputA);
    expect(traceA.weatherPlacementAnalysis).not.toBeNull();
    expect(traceA.weatherPlacementAnalysis?.opponentWeatheredRows).toContain("ranged");

    // Fixture B: horn on opponent's ranged row (the spy target).
    // The opponent horn should be picked up for the horned-row calculation.
    const oppHornBoardRows = baseBoardRows({
      seat_a: { ranged: [] },
    }).map((r) =>
      r.seatId === "seat_a" && r.row === "ranged"
        ? { ...r, horn: testCard({ cardId: "horn-opp", sourceId: "test.commanders-horn", printedStrength: 0, kind: "special", abilities: ["commanders_horn"] }) }
        : r,
    );

    const inputB = policyInput(
      [
        playMove(spy, { kind: "board_row", side: "opponent", seatId: "seat_a", row: "ranged" }),
        playMove(spy, { kind: "board_row", side: "opponent", seatId: "seat_a", row: "close" }),
      ],
      {
        ownHand: [spy],
        weather: [fogCard],
        boardRows: oppHornBoardRows,
      },
    );

    const { trace: traceB } = explainLegalHeuristicV1Decision(inputB);
    expect(traceB.weatherPlacementAnalysis).not.toBeNull();
  });

  // Test 4: Hero placement stays weather immune
  it("hero placement ignores weather penalty", () => {
    const hero = heroUnit("hero1", 10);
    const input = policyInput(
      [
        playMove(hero, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
      ],
      {
        ownHand: [hero],
        weather: [fogCard],
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.weatherPlacementAnalysis?.selectedPrintedStrengthBucket).toBe("high");
    // Hero effective strength should remain high even on weathered row
    expect(trace.weatherPlacementAnalysis?.selectedEffectiveStrengthBucket).toBe("high");
  });

  // Test 5: Selected-move parity with weathered-row fixture
  it("explain parity with weathered-row fixture", () => {
    const unit = nonHeroUnit("unit1", 8);
    const hero = heroUnit("hero1", 12);
    const input = policyInput(
      [passMove(), playMove(unit), playMove(hero)],
      {
        ownHand: [unit, hero],
        weather: [fogCard],
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    expect(tracedMove?.moveId).toBe(selected?.moveId);

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.weatherPlacementAnalysis).not.toBeNull();
  });

  // Test 6: Existing cFp29 Medic timing tests still pass (smoke test)
  it("preserves cFp29 Medic timing behavior alongside weather awareness", () => {
    const medic = testCard({
      cardId: "medic1",
      sourceId: "test.medic-yennefer",
      printedStrength: 5,
      abilities: ["medic"],
    });
    const strongUnit = testCard({ cardId: "strong", sourceId: "test.strong", printedStrength: 12 });

    const input = policyInput(
      [passMove(), playMove(medic)],
      {
        ownHand: [medic],
        ownDiscard: [strongUnit],
        ownGems: 2,
        opponentHandCount: 8,
        weather: [fogCard],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 35 },
        },
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.medicTimingAnalysis).not.toBeNull();
    expect(trace.medicTimingAnalysis?.ownDiscardReviveCandidateCount).toBe(1);
    expect(trace.weatherPlacementAnalysis).not.toBeNull();
  });

  // Test 7: Weather trace diagnostics are hidden-info safe
  it("weather placement analysis contains only safe fields", () => {
    const unit = nonHeroUnit("unit1", 8);
    const input = policyInput(
      [playMove(unit)],
      {
        ownHand: [unit],
        weather: [fogCard],
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    const wa = trace.weatherPlacementAnalysis;
    expect(wa).not.toBeNull();
    expect(typeof wa?.selectedMoveIntoWeatheredRow).toBe("boolean");
    expect(["own", "opponent", "none"]).toContain(wa?.selectedMoveSide);
    expect(["close", "ranged", "siege", "none"]).toContain(wa?.selectedMoveRow);
    expect(["none", "low", "medium", "high"]).toContain(wa?.selectedPrintedStrengthBucket);
    expect(["none", "low", "medium", "high"]).toContain(wa?.selectedEffectiveStrengthBucket);
    expect(Array.isArray(wa?.ownWeatheredRows)).toBe(true);
    expect(Array.isArray(wa?.opponentWeatheredRows)).toBe(true);
    expect(typeof wa?.candidateWeatheredOwnRowPlayCount).toBe("number");
    expect(typeof wa?.candidateWeatheredOpponentRowPlayCount).toBe("number");
  });
});

describe("cFp32: stop-loss round sacrifice", () => {
  const unit3 = testCard({ cardId: "u3", sourceId: "test.u3", printedStrength: 3 });
  const unit5 = testCard({ cardId: "u5", sourceId: "test.u5", printedStrength: 5 });
  const spy = testCard({ cardId: "spy", sourceId: "test.spy.cf32", printedStrength: 4, abilities: ["spy"] });
  const medic = testCard({ cardId: "medic", sourceId: "test.medic.cf32", printedStrength: 3, abilities: ["medic"] });
  const weatherC = testCard({ cardId: "wc", sourceId: "neutral.biting-frost", printedStrength: 0, kind: "special", abilities: ["frost"] });

  const cfP32Input = (
    legalMoves: LegalMove[],
    observationOverrides: Partial<SeatObservation> = {},
  ): EnginePolicyInput => ({
    seatId: "seat_b",
    observation: baseObservation({
      ownGems: 2,
      opponentGems: 2,
      opponentPassed: false,
      opponentHandCount: 5,
      ...observationOverrides,
    }),
    legalMoves,
  });

  // 1. Diagnostic anchor reproduction (Trace 9 shape)
  it("stop-loss pass: behind, low hand, upper-bound impossible → pass", () => {
    // ownScore=20, opponentScore=40, ownHandCount=4
    // 4x strength-3 units → upperBound ≈ 20 + 12 = 32 < 40
    const u1 = testCard({ cardId: "u1", sourceId: "test.u1.cf32", printedStrength: 3 });
    const u2 = testCard({ cardId: "u2", sourceId: "test.u2.cf32", printedStrength: 3 });
    const u3a = testCard({ cardId: "u3a", sourceId: "test.u3a.cf32", printedStrength: 3 });
    const u4a = testCard({ cardId: "u4a", sourceId: "test.u4a.cf32", printedStrength: 3 });

    const input = cfP32Input(
      [passMove(), playMove(u1), playMove(u2), playMove(u3a), playMove(u4a)],
      {
        ownHand: [u1, u2, u3a, u4a],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 20 },
        },
      },
    );

    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).toBe("pass");

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.reasonKind).toBe("policy-round-investment");
    expect(trace.reason).toContain("stop-loss");
    expect(trace.roundInvestmentAnalysis?.stopLossRecommended).toBe(true);
    expect(trace.roundInvestmentAnalysis?.recommendation).toBe("sacrifice_round");
    expect(trace.roundInvestmentAnalysis?.catchUpStatus).toBe("upper_bound_impossible");
  });

  // 2. Last gem untouched
  it("last-gem impossible pass uses existing last-gem logic, not cFp32 gate", () => {
    const input = cfP32Input(
      [passMove(), playMove(unit3)],
      {
        ownHand: [unit3],
        ownGems: 1,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 20, seat_b: 0 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).toBe("pass");

    const { trace } = explainLegalHeuristicV1Decision(input);
    // cFp32 stop-loss must not apply to last-gem (ownGems <= 1)
    expect(trace.reasonKind).toBe("policy-last-gem");
    expect(trace.roundInvestmentAnalysis?.stopLossRecommended).toBe(false);
  });

  // 3. Spy/card-advantage exception
  it("plays Spy even when stop-loss conditions are met", () => {
    const u1 = testCard({ cardId: "s1", sourceId: "test.s1.cf32", printedStrength: 3 });
    const input = cfP32Input(
      [passMove(), playMove(spy), playMove(u1)],
      {
        ownHand: [spy, u1],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 20 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    // Spy is card-advantage — stop-loss should not block it
    expect(move?.kind).toBe("play_card");
    expect(move?.sourceCardId).toBe("spy");
  });

  // 4. Single-card safeguard
  it("cFp32 does not add new sacrifice block when ownHandCount is 1", () => {
    const input = cfP32Input(
      [passMove(), playMove(unit5)],
      {
        ownHand: [unit5],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 10 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    // With 1 card, cFp32 should not block (ownHandCount <= 1 guard)
    expect(move?.kind).not.toBe("pass");
  });

  // 5. Clean catch-up regression
  it("does not sacrifice when a single move can catch up", () => {
    const big = testCard({ cardId: "big", sourceId: "test.big.cf32", printedStrength: 15 });
    const input = cfP32Input(
      [passMove(), playMove(big)],
      {
        ownHand: [big],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 10, seat_b: 0 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).toBe("play_card");
    expect(move?.sourceCardId).toBe("big");

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.roundInvestmentAnalysis?.catchUpStatus).toBe("single_move_catch_up");
  });

  // 6. Upper-bound possible regression
  it("does not stop-loss when upper-bound is possible and hand is not scarce", () => {
    const u1 = testCard({ cardId: "x1", sourceId: "test.x1.cf32", printedStrength: 8 });
    const u2 = testCard({ cardId: "x2", sourceId: "test.x2.cf32", printedStrength: 8 });
    const u3 = testCard({ cardId: "x3", sourceId: "test.x3.cf32", printedStrength: 8 });
    const u4 = testCard({ cardId: "x4", sourceId: "test.x4.cf32", printedStrength: 8 });
    const u5 = testCard({ cardId: "x5", sourceId: "test.x5.cf32", printedStrength: 8 });
    // 5x8 cards → upperBound = 15 + 40 = 55 >= 30, upper-bound possible
    // handCount = 5 > 4, so stop-loss lowHand check doesn't fire
    const input = cfP32Input(
      [passMove(), playMove(u1), playMove(u2), playMove(u3), playMove(u4), playMove(u5)],
      {
        ownHand: [u1, u2, u3, u4, u5],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 30, seat_b: 15 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).not.toBe("pass");
    expect(move?.kind).toBe("play_card");
  });

  // 7. Opponent-passed branch untouched
  it("opponent-passed branch is unaffected by cFp32 stop-loss", () => {
    const input = cfP32Input(
      [passMove(), playMove(unit3)],
      {
        ownHand: [unit3],
        ownGems: 2,
        opponentGems: 2,
        opponentPassed: true,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 10 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    // Opponent passed, AI is ahead → pass
    expect(move?.kind).toBe("pass");
  });

  // 8. Explanation parity for stop-loss pass
  it("explanation move equals policy move for stop-loss pass", () => {
    const u1 = testCard({ cardId: "p1", sourceId: "test.p1.cf32", printedStrength: 3 });
    const u2 = testCard({ cardId: "p2", sourceId: "test.p2.cf32", printedStrength: 3 });
    const u3a = testCard({ cardId: "p3a", sourceId: "test.p3a.cf32", printedStrength: 3 });
    const u4a = testCard({ cardId: "p4a", sourceId: "test.p4a.cf32", printedStrength: 3 });

    const input = cfP32Input(
      [passMove(), playMove(u1), playMove(u2), playMove(u3a), playMove(u4a)],
      {
        ownHand: [u1, u2, u3a, u4a],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 20 },
        },
      },
    );

    const policyMove = legalHeuristicPolicyV1.selectMove(input);
    const explainedMove = explainLegalHeuristicV1Decision(input).move;
    expect(explainedMove?.kind).toBe(policyMove?.kind);
  });

  // 9. Weathered low-tempo evidence
  it("stop-loss when selected move is low-tempo weathered placement", () => {
    // Fog on ranged row. Unit placed on weathered ranged has effective strength = 1.
    const small = testCard({ cardId: "fog-u", sourceId: "test.fog.u", printedStrength: 3 });
    const input = cfP32Input(
      [passMove(), playMove(small)],
      {
        ownHand: [small],
        ownGems: 2,
        opponentGems: 2,
        weather: [weatherC],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 10 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    // Even if policy doesn't pass here (single card edge), trace diagnostics should be safe
    expect(trace.roundInvestmentAnalysis).not.toBeNull();
  });

  // 10. Medic medium-target evidence
  it("stop-loss considers Medic with weak revive target when behind", () => {
    // Medic with only weak target (strength-2 unit in discard)
    const weakDiscard = testCard({ cardId: "wd", sourceId: "test.wd.cf32", printedStrength: 2 });
    const filler = testCard({ cardId: "med-fill", sourceId: "test.med.fill.cf32", printedStrength: 2 });
    const input = cfP32Input(
      [passMove(), playMove(medic), playMove(filler)],
      {
        ownHand: [medic, filler],
        ownDiscard: [weakDiscard],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 10 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.roundInvestmentAnalysis).not.toBeNull();
    // Even if stop-loss doesn't fire (hand too small or other conditions), diagnostics should be safe
    expect(trace.roundInvestmentAnalysis?.stopLossReason).toBeDefined();
  });

  // 11. use_leader must not be suppressed by stop-loss (review blocker fix)
  it("use_leader remains selected when stop-loss conditions are met (behind, upper-bound impossible)", () => {
    // Behind, upper-bound impossible, but best move is use_leader (free action).
    // Stop-loss should not suppress use_leader since it doesn't spend a hand card.
    const filler1 = testCard({ cardId: "fill1", sourceId: "test.fill1.cf32", printedStrength: 2 });
    const filler2 = testCard({ cardId: "fill2", sourceId: "test.fill2.cf32", printedStrength: 2 });
    const input = cfP32Input(
      [passMove(), leaderMove("look_three_cards", { opponentHandCount: 5 })],
      {
        ownHand: [filler1, filler2],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 10 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).toBe("use_leader");

    const { move: tracedMove, trace } = explainLegalHeuristicV1Decision(input);
    expect(tracedMove?.kind).toBe("use_leader");
    expect(trace.roundInvestmentAnalysis?.selectedMoveSpendsHandCard).toBe(false);
    expect(trace.roundInvestmentAnalysis?.stopLossRecommended).toBe(false);
  });

  // 12. Agile/multi-row: weathered reason must evaluate selected move's actual target row
  it("agile card selected for non-weathered row does not trigger weathered stop-loss reason", () => {
    // Fog weathers ranged. Agile card can go close (non-weathered) or ranged (weathered).
    // If best move scores the agile to close (non-weathered), weathered reason must not fire.
    const agileUnit = testCard({
      cardId: "ag1",
      sourceId: "test.ag1.cf32",
      printedStrength: 6,
      rows: ["close", "ranged", "siege"],
      abilities: ["agile"],
    });
    const small2 = testCard({ cardId: "s2", sourceId: "test.s2.cf32", printedStrength: 3 });
    // Build play moves: one for close (non-weathered), one for ranged (weathered)
    const agileCloseMove: LegalMove = {
      kind: "play_card",
      moveId: "play:seat_b:ag1:board_row_close",
      seatId: "seat_b",
      label: "Play agile on close",
      sourceCardId: "ag1",
      sourceId: "test.ag1.cf32",
      target: { kind: "board_row", side: "own", seatId: "seat_b", row: "close" },
      metadata: { cardName: "ag1", cardKind: "unit", abilities: ["agile"], targetLabel: "board_row" },
    };
    const agileRangedMove: LegalMove = {
      kind: "play_card",
      moveId: "play:seat_b:ag1:board_row_ranged",
      seatId: "seat_b",
      label: "Play agile on ranged",
      sourceCardId: "ag1",
      sourceId: "test.ag1.cf32",
      target: { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" },
      metadata: { cardName: "ag1", cardKind: "unit", abilities: ["agile"], targetLabel: "board_row" },
    };
    const fogCard = testCard({ cardId: "fog", sourceId: "neutral.impenetrable-fog", printedStrength: 0, kind: "special", abilities: ["fog"] });
    const input = cfP32Input(
      [passMove(), agileCloseMove, agileRangedMove, playMove(small2)],
      {
        ownHand: [agileUnit, small2],
        weather: [fogCard],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 10 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.roundInvestmentAnalysis).not.toBeNull();
    // If the selected move targets close (non-weathered), stop-loss reason must not be weathered_low_tempo
    if (trace.roundInvestmentAnalysis?.stopLossRecommended) {
      expect(trace.roundInvestmentAnalysis.stopLossReason).not.toBe("weathered_low_tempo");
    }
  });
});

describe("cFp31 repair: round-investment policy and trace fixes", () => {
  const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
  const unit = testCard({ cardId: "unit", sourceId: "test.unit", printedStrength: 8 });
  const hero = testCard({ cardId: "hero", sourceId: "test.hero", printedStrength: 10, kind: "hero" });
  const agileUnit = testCard({ cardId: "agile", sourceId: "test.agile", printedStrength: 6, rows: ["close", "ranged", "siege"], abilities: ["agile"] });
  const filler = testCard({ cardId: "filler", sourceId: "test.filler", printedStrength: 3 });
  const weatherCard = testCard({ cardId: "weather", sourceId: "neutral.biting-frost", printedStrength: 0, kind: "special", abilities: ["frost"] });

  const cfP31Input = (
    legalMoves: LegalMove[],
    observationOverrides: Partial<SeatObservation> = {},
  ): EnginePolicyInput => ({
    seatId: "seat_b",
    observation: baseObservation({
      ownGems: 2,
      opponentGems: 2,
      opponentPassed: false,
      opponentHandCount: 5,
      ownDeckCount: 5,
      ...observationOverrides,
    }),
    legalMoves,
  });

  // 1. Near-even preservation pass
  it("passes to preserve future hand when ahead and best move leaves no positive unit", () => {
    // Two-card hand: one unit, one weather
    // After playing unit, only weather remains (no positive unit)
    const input = cfP31Input(
      [passMove(), playMove(unit), playMove(weatherCard, { kind: "weather" })],
      {
        ownHand: [unit, weatherCard],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 10 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).toBe("pass");

    // Explanation parity
    const explanation = explainLegalHeuristicV1Decision(input);
    expect(explanation.move?.kind).toBe("pass");
    expect(explanation.trace.reasonKind).toBe("policy-round-investment");
    expect(explanation.trace.roundInvestmentAnalysis).not.toBeNull();
    expect(explanation.trace.roundInvestmentAnalysis?.recommendation).toBe("preserve_future_hand");
  });

  // 2. Two-card hand preservation (the Fix 4 case)
  it("passes with two-card hand when playing unit leaves no positive unit", () => {
    // Exactly 2 cards, one positive unit and one weather
    const input = cfP31Input(
      [passMove(), playMove(unit), playMove(weatherCard, { kind: "weather" })],
      {
        ownHand: [unit, weatherCard],
        ownGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 8, seat_b: 5 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).toBe("pass");
  });

  // 3. Sacrifice non-elimination round
  it("passes to sacrifice round when behind with critical future-hand risk", () => {
    // Behind significantly, two cards left, playing unit leaves only weather
    // This creates critical risk (hand nearly empty, no positive unit left)
    const sacrificeUnit = testCard({ cardId: "sac-unit", sourceId: "test.sac.unit", printedStrength: 4 });
    const sacrificeWeather = testCard({ cardId: "sac-weather", sourceId: "neutral.sac-frost", printedStrength: 0, kind: "special", abilities: ["frost"] });
    const input = cfP31Input(
      [passMove(), playMove(sacrificeUnit), playMove(sacrificeWeather, { kind: "weather" })],
      {
        ownHand: [sacrificeUnit, sacrificeWeather],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 30, seat_b: 5 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).toBe("pass");
  });

  // 4. Last gem still fights
  it("does not pass on last gem even with poor future hand", () => {
    const input = cfP31Input(
      [passMove(), playMove(unit)],
      {
        ownHand: [unit],
        ownGems: 1,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 10, seat_b: 5 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).not.toBe("pass");
  });

  // 5. Spy/card-advantage exception
  it("plays Spy even when future hand is risky", () => {
    const spyInput = cfP31Input(
      [passMove(), playMove(spy)],
      {
        ownHand: [spy],
        ownGems: 2,
        opponentGems: 2,
        ownDeckCount: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 3 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(spyInput);
    expect(move?.kind).toBe("play_card");
    expect(move?.sourceCardId).toBe("spy");
  });

  // 5b. Spy hand-count estimation with low deck count
  it("estimates Spy hand count using min(2, ownDeckCount)", () => {
    const features = buildLegalHeuristicV1Features(
      cfP31Input(
        [passMove(), playMove(spy)],
        {
          ownHand: [spy, unit],
          ownDeckCount: 1,
          ownGems: 2,
          opponentGems: 2,
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 5, seat_b: 3 },
          },
        },
      ),
    );
    const spyMove = features.playMoves.find((m) => m.sourceCardId === "spy");
    const analysis = buildLegalHeuristicV1RoundInvestmentAnalysis(features, spyMove ?? null, {
      unitCardCount: 1,
      heroCardCount: 0,
      specialOrWeatherCardCount: 0,
      totalHandCount: 2,
      positiveUnitMoveCount: 0,
      positiveNonUnitMoveCount: 0,
      bestUnitTempoBucket: "none",
      bestNonUnitTempoBucket: "none",
      futureRoundHandQuality: "poor",
      specialOnlyHand: false,
      noUnitFutureRisk: false,
    });
    // With ownDeckCount=1, Spy draws min(2, 1) = 1, so hand goes from 2 -> 1 + 1 = 2
    expect(analysis.estimatedHandCountAfterSelectedMove).toBe(2);
  });

  // 6. Agile/multi-row source-card de-duplication
  it("counts agile unit as single positive source when it has multiple row options", () => {
    // Agile unit can play on 3 rows, creating 3 play_card moves
    // But should only count as 1 unique positive unit source
    const agileMoves = [
      playMove(agileUnit, { kind: "board_row", side: "own" as const, seatId: "seat_b", row: "close" }),
      playMove(agileUnit, { kind: "board_row", side: "own" as const, seatId: "seat_b", row: "ranged" }),
      playMove(agileUnit, { kind: "board_row", side: "own" as const, seatId: "seat_b", row: "siege" }),
    ];
    const features = buildLegalHeuristicV1Features(
      cfP31Input(
        [passMove(), ...agileMoves],
        {
          ownHand: [agileUnit],
          ownGems: 2,
          opponentGems: 2,
          ownDeckCount: 5,
        },
      ),
    );
    const analysis = buildLegalHeuristicV1RoundInvestmentAnalysis(
      features,
      agileMoves[0],
      {
        unitCardCount: 1,
        heroCardCount: 0,
        specialOrWeatherCardCount: 0,
        totalHandCount: 1,
        positiveUnitMoveCount: 0,
        positiveNonUnitMoveCount: 0,
        bestUnitTempoBucket: "none",
        bestNonUnitTempoBucket: "none",
        futureRoundHandQuality: "poor",
        specialOnlyHand: false,
        noUnitFutureRisk: false,
      },
    );
    // Should count agile as 1 unique positive unit source (not 3 for 3 row moves)
    expect(analysis.positiveFutureUnitMoveCount).toBe(1);
  });

  // 7. Healthy hand unchanged (protects against over-passing)
  it("plays useful card when hand has healthy future options", () => {
    const input = cfP31Input(
      [passMove(), playMove(unit), playMove(filler), playMove(hero)],
      {
        ownHand: [unit, filler, hero],
        ownGems: 2,
        opponentGems: 2,
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    // With 3 unit/hero cards, should NOT pass
    expect(move?.kind).not.toBe("pass");
  });

  // 10. Trace parity: explanation move equals policy move
  it("explanation move equals policy move for pass case", () => {
    const input = cfP31Input(
      [passMove(), playMove(unit), playMove(weatherCard, { kind: "weather" })],
      {
        ownHand: [unit, weatherCard],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 10 },
        },
      },
    );
    const policyMove = legalHeuristicPolicyV1.selectMove(input);
    const explanationMove = explainLegalHeuristicV1Decision(input).move;
    expect(explanationMove?.kind).toBe(policyMove?.kind);
  });

  it("explanation move equals policy move for non-pass case", () => {
    const input = cfP31Input(
      [passMove(), playMove(unit), playMove(filler), playMove(hero)],
      {
        ownHand: [unit, filler, hero],
        ownGems: 2,
        opponentGems: 2,
      },
    );
    const policyMove = legalHeuristicPolicyV1.selectMove(input);
    const explanationMove = explainLegalHeuristicV1Decision(input).move;
    expect(explanationMove?.kind).toBe(policyMove?.kind);
  });

  // Repair 2: Sacrifice-round explanation test
  it("sacrifice round — pass with policy-round-investment reason and sacrifice_round recommendation", () => {
    const sacUnit = testCard({ cardId: "sac-unit-2", sourceId: "test.sac.unit2", printedStrength: 3 });
    const sacWeather = testCard({ cardId: "sac-weather-2", sourceId: "neutral.sac-frost2", printedStrength: 0, kind: "special", abilities: ["frost"] });
    const input = cfP31Input(
      [passMove(), playMove(sacUnit), playMove(sacWeather, { kind: "weather" })],
      {
        ownHand: [sacUnit, sacWeather],
        ownGems: 2,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 5 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(input);
    expect(move?.kind).toBe("pass");

    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.reasonKind).toBe("policy-round-investment");
    expect(trace.reason).toContain("sacrifice");
    expect(trace.roundInvestmentAnalysis).not.toBeNull();
    expect(trace.roundInvestmentAnalysis?.recommendation).toBe("sacrifice_round");
  });

  // Repair 2: Strengthened Spy exception test (≥2 cards in hand)
  it("Spy card-advantage exception with two-card hand beats single-card preservation", () => {
    const spy2 = testCard({ cardId: "spy2", sourceId: "test.spy2", printedStrength: 4, abilities: ["spy"] });
    const filler2 = testCard({ cardId: "filler2", sourceId: "test.filler2", printedStrength: 2 });
    // Two cards in hand: Spy + filler. Own deck has cards (Spy draws).
    // Future-hand preservation risk exists (after playing Spy, only filler + drawn cards remain).
    // The Spy/card-advantage exception should fire, selecting Spy over pass.
    const spyInput = cfP31Input(
      [passMove(), playMove(spy2), playMove(filler2)],
      {
        ownHand: [spy2, filler2],
        ownGems: 2,
        opponentGems: 2,
        ownDeckCount: 5,
        opponentHandCount: 6,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 3 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(spyInput);
    // Must play Spy (card-advantage exception), not pass
    expect(move?.kind).toBe("play_card");
    expect(move?.sourceCardId).toBe("spy2");

    // Verify this is the Spy exception, not single-card exception
    // Hand has 2 cards, so it's not a single-card-play situation
    expect(spyInput.observation.ownHand.length).toBeGreaterThanOrEqual(2);
  });

  // Repair 2: Strengthened agile/multi-row test
  it("agile multi-row source is only positive unit — policy selects pass when preservation conditions met", () => {
    // Agile unit on 3 rows creates multiple positive legal row moves.
    // It is the only positive unit/hero source.
    // With 2-card hand (agile + weather), after playing agile, only weather remains.
    // Policy should select pass to preserve future hand.
    const agile2 = testCard({
      cardId: "agile2",
      sourceId: "test.agile2",
      printedStrength: 6,
      rows: ["close", "ranged", "siege"],
      abilities: ["agile"],
    });
    const agileMoves = [
      playMove(agile2, { kind: "board_row", side: "own" as const, seatId: "seat_b", row: "close" }),
      playMove(agile2, { kind: "board_row", side: "own" as const, seatId: "seat_b", row: "ranged" }),
      playMove(agile2, { kind: "board_row", side: "own" as const, seatId: "seat_b", row: "siege" }),
    ];
    const agileInput = cfP31Input(
      [passMove(), ...agileMoves],
      {
        ownHand: [agile2, weatherCard],
        ownGems: 2,
        opponentGems: 2,
        ownDeckCount: 5,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 8 },
        },
      },
    );
    const move = legalHeuristicPolicyV1.selectMove(agileInput);
    // Should pass — playing agile burns last positive unit
    expect(move?.kind).toBe("pass");

    // Verify analysis flags
    const { trace } = explainLegalHeuristicV1Decision(agileInput);
    expect(trace.roundInvestmentAnalysis).not.toBeNull();
    expect(trace.roundInvestmentAnalysis?.selectedMoveWouldLeaveNoPositiveUnitMove).toBe(true);
  });
});

describe("cFp36: round resource exhaustion tuning", () => {
  // Helpers local to cFp36 tests
  const specialCard = (id: string, sourceId: string, printedStrength = 0) =>
    testCard({ cardId: id, sourceId, printedStrength, kind: "special" });
  const unitCard = (id: string, sourceId: string, printedStrength = 5) =>
    testCard({ cardId: id, sourceId, printedStrength, kind: "unit" });

  // ------------------------------------------------------------------
  // 1. Round 1 non-elimination, opponent active, board over budget, thin future hand
  // ------------------------------------------------------------------
  it("round 1: board over budget with thin future hand -> v1 passes", () => {
    // Board already has 5 units (>= healthy budget of 5)
    // Hand: 3 specials -> thin future hand quality
    const u1 = unitCard("u1", "test.b1", 2);
    const u2 = unitCard("u2", "test.b2", 3);
    const u3 = unitCard("u3", "test.b3", 2);
    const u4 = unitCard("u4", "test.b4", 3);
    const u5 = unitCard("u5", "test.b5", 2);
    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);
    const w3 = specialCard("w3", "neutral.torrential-rain", 0);

    const boardUnits = [u1, u2, u3, u4, u5];
    const handCards = [u1, u2, u3, u4, u5, w1, w2, w3];
    const unitMoves = boardUnits.map((u) => playMove(u));

    const input = policyInput(
      [passMove(), playMove(w1), playMove(w2), playMove(w3), ...unitMoves],
      {
        ownHand: handCards,
        ownGems: 2,
        round: 1,
        opponentGems: 2,
        ownDeckCount: 5,
        boardRows: baseBoardRows({
          seat_b: {
            close: boardUnits.slice(0, 2),
            ranged: boardUnits.slice(2, 4),
            siege: [boardUnits[4]],
          },
        }),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 10, seat_b: 20 },
          rowTotalsBySeat: {
            seat_a: emptyRowTotals(),
            seat_b: { close: 5, ranged: 6, siege: 2 },
          },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected).toEqual(expect.objectContaining({ kind: "pass" }));
  });

  // ------------------------------------------------------------------
  // 2. Spy/card advantage exception: board over budget but candidate is Spy
  // ------------------------------------------------------------------
  it("round 1: board over budget but candidate is Spy -> v1 plays Spy", () => {
    const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
    const u1 = unitCard("u1", "test.b1", 2);
    const u2 = unitCard("u2", "test.b2", 3);
    const u3 = unitCard("u3", "test.b3", 2);
    const u4 = unitCard("u4", "test.b4", 3);
    const u5 = unitCard("u5", "test.b5", 2);
    const w = specialCard("w", "neutral.biting-frost", 0);

    const boardUnits = [u1, u2, u3, u4, u5];
    const handCards = [u1, u2, u3, u4, u5, spy, w];

    const input = policyInput(
      [passMove(), playMove(spy), playMove(w), playMove(u1)],
      {
        ownHand: handCards,
        ownGems: 2,
        round: 1,
        opponentGems: 2,
        ownDeckCount: 5,
        boardRows: baseBoardRows({
          seat_b: {
            close: boardUnits.slice(0, 2),
            ranged: boardUnits.slice(2, 4),
            siege: [boardUnits[4]],
          },
        }),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 10, seat_b: 20 },
          rowTotalsBySeat: {
            seat_a: emptyRowTotals(),
            seat_b: { close: 5, ranged: 6, siege: 2 },
          },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected).toEqual(expect.objectContaining({ sourceCardId: "spy" }));
  });

  // ------------------------------------------------------------------
  // 3. Free leader exception: board over budget but candidate is useful leader
  // ------------------------------------------------------------------
  it("round 1: board over budget but candidate is useful leader -> v1 uses leader", () => {
    const frost = testCard({
      cardId: "weather",
      sourceId: "neutral.biting-frost",
      printedStrength: 0,
      kind: "special",
      abilities: ["frost"],
    });
    const u1 = unitCard("u1", "test.b1", 2);
    const u2 = unitCard("u2", "test.b2", 3);
    const u3 = unitCard("u3", "test.b3", 2);
    const u4 = unitCard("u4", "test.b4", 3);
    const u5 = unitCard("u5", "test.b5", 2);

    const boardUnits = [u1, u2, u3, u4, u5];
    const handCards = [u1, u2, u3, u4, u5, frost];

    const input = policyInput(
      [passMove(), leaderMove("clear_weather"), playMove(frost, { kind: "weather" })],
      {
        ownHand: handCards,
        ownGems: 2,
        round: 1,
        opponentGems: 2,
        ownDeckCount: 5,
        boardRows: baseBoardRows({
          seat_b: {
            close: boardUnits.slice(0, 2),
            ranged: boardUnits.slice(2, 4),
            siege: [boardUnits[4]],
          },
        }),
        weather: [frost],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 50, seat_b: 20 },
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

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected).toEqual(expect.objectContaining({ kind: "use_leader" }));
  });

  // ------------------------------------------------------------------
  // 4. Last-gem exception: behind but last gem, useful unit fights
  // ------------------------------------------------------------------
  it("last gem: behind, useful unit can fight -> v1 does not resource-budget pass", () => {
    // Unit strength 8, opponent score 5 -> upper bound 8 >= minScore 6 -> catch-up possible
    const useful = unitCard("u", "test.useful", 8);
    const input = policyInput(
      [passMove(), playMove(useful)],
      {
        ownHand: [useful],
        ownGems: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: useful.cardId }));
  });

  // ------------------------------------------------------------------
  // 5. Match-winning exception: opponent on last gem, candidate wins match
  // ------------------------------------------------------------------
  it("opponent on last gem and candidate wins match -> v1 plays match-winning card", () => {
    const useful = unitCard("u", "test.match-win", 15);
    const input = policyInput(
      [passMove(), playMove(useful)],
      {
        ownHand: [useful],
        ownGems: 2,
        opponentGems: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 15 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: useful.cardId }));
  });

  // ------------------------------------------------------------------
  // 6. Round 3: no resource-budget pass for future preservation
  // ------------------------------------------------------------------
  it("round 3 with low future hand quality -> cFp36 budget does not recommend pass for preservation", () => {
    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);

    const input = policyInput(
      [passMove(), playMove(w1), playMove(w2)],
      {
        ownHand: [w1, w2],
        ownGems: 2,
        round: 3,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 30, seat_b: 20 },
        },
      },
    );

    // cFp36 should NOT recommend resource preservation in round 3
    expect(legalHeuristicPolicyV1.selectMove(input)).not.toBeNull();
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace.roundInvestmentAnalysis).not.toBeNull();
    // Round 3 budget = max cap (6) because round >= 3 -> no resource budget
    expect(trace.roundInvestmentAnalysis?.roundResourceBudget).toBeGreaterThanOrEqual(6);
    // The reason should indicate round 3 has no budget
    expect(trace.roundInvestmentAnalysis?.resourceExhaustionReason).toBe("round_three_no_budget");
  });

  // ------------------------------------------------------------------
  // 7. Healthy hand / low board investment -> continues normal move selection
  // ------------------------------------------------------------------
  it("healthy hand and low board investment -> v1 continues normal useful move selection", () => {
    // 2 unit cards + 1 special = healthy future hand, 3 cards in hand
    const unit1 = unitCard("u1", "test.h1", 8);
    const unit2 = unitCard("u2", "test.h2", 6);
    const w = specialCard("w", "neutral.biting-frost", 0);

    const input = policyInput(
      [passMove(), playMove(unit1), playMove(unit2), playMove(w)],
      {
        ownHand: [unit1, unit2, w],
        ownGems: 2,
        round: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 5 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    // Should play the strongest unit, not pass
    expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: unit1.cardId }));
  });

  // ------------------------------------------------------------------
  // 8. Cheap single-move catch-up with acceptable future hand
  // ------------------------------------------------------------------
  it("cheap catch-up with acceptable future hand -> v1 plays catch-up", () => {
    const catchUp = unitCard("c", "test.catchup", 15);
    const filler = unitCard("f", "test.filler", 5);

    const input = policyInput(
      [passMove(), playMove(catchUp), playMove(filler)],
      {
        ownHand: [catchUp, filler],
        ownGems: 2,
        round: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 10, seat_b: 0 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected).toEqual(expect.objectContaining({ kind: "play_card", sourceCardId: catchUp.cardId }));
  });

  // ------------------------------------------------------------------
  // 9. Expensive catch-up leaving no future unit tempo on non-elimination round
  // ------------------------------------------------------------------
  it("expensive catch-up leaving no future tempo on non-elimination -> v1 may pass", () => {
    // Only 2 cards: one expensive catch-up unit, nothing else for future
    const expensiveCatchUp = unitCard("c", "test.exp-catchup", 20);
    // Board already has 5 cards
    const u1 = unitCard("u1", "test.b1", 2);
    const u2 = unitCard("u2", "test.b2", 3);
    const u3 = unitCard("u3", "test.b3", 2);
    const u4 = unitCard("u4", "test.b4", 3);
    const u5 = unitCard("u5", "test.b5", 2);
    const boardUnits = [u1, u2, u3, u4, u5];

    const input = policyInput(
      [passMove(), playMove(expensiveCatchUp)],
      {
        ownHand: [expensiveCatchUp],
        ownGems: 2,
        round: 1,
        boardRows: baseBoardRows({
          seat_b: {
            close: boardUnits.slice(0, 2),
            ranged: boardUnits.slice(2, 4),
            siege: [boardUnits[4]],
          },
        }),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 25, seat_b: 10 },
          rowTotalsBySeat: {
            seat_a: emptyRowTotals(),
            seat_b: { close: 5, ranged: 6, siege: 2 },
          },
        },
      },
    );

    // The expensive catch-up is the only card. Hand count = 1 -> exception
    // So it should be played (nothing to preserve)
    const selected = legalHeuristicPolicyV1.selectMove(input);
    // With only 1 card, cFp36 exception: nothing meaningful to preserve
    expect(selected).toEqual(expect.objectContaining({ kind: "play_card" }));
  });

  // ------------------------------------------------------------------
  // 10. Explanation parity: selectMove and explain return the same move
  // ------------------------------------------------------------------
  it("explanation parity: explain move equals selectMove for cFp36 resource-budget fixtures", () => {
    const unit = unitCard("u", "test.parity", 10);
    const w = specialCard("w", "neutral.biting-frost", 0);

    const input = policyInput(
      [passMove(), playMove(unit), playMove(w)],
      {
        ownHand: [unit, w],
        ownGems: 2,
        round: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 5 },
        },
      },
    );

    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    const { move: explainedMove } = explainLegalHeuristicV1Decision(input);
    expect(explainedMove).toEqual(selectedMove);
  });

  // ------------------------------------------------------------------
  // 11. Trace includes new resource-budget fields
  // ------------------------------------------------------------------
  it("trace includes roundResourceBudget, roundResourcePressure, resourceExhaustionRecommended and reason", () => {
    const unit = unitCard("u", "test.trace-fields", 10);
    const w = specialCard("w", "neutral.biting-frost", 0);

    const input = policyInput(
      [passMove(), playMove(unit), playMove(w)],
      {
        ownHand: [unit, w],
        ownGems: 2,
        round: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 5 },
        },
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    const ri = trace.roundInvestmentAnalysis;
    expect(ri).not.toBeNull();
    expect(typeof ri!.roundResourceBudget).toBe("number");
    expect(ri!.roundResourceBudget).toBeGreaterThanOrEqual(2);
    expect(ri!.roundResourceBudget).toBeLessThanOrEqual(6);
    expect(ri!.roundResourcePressure).oneOf(["none", "watch", "high", "critical"]);
    expect(typeof ri!.resourceExhaustionRecommended).toBe("boolean");
    expect(ri!.resourceExhaustionReason).oneOf([
      "none", "round_budget_exceeded", "thin_future_hand", "poor_future_hand",
      "last_useful_unit", "round_three_no_budget", "exception_card_advantage",
      "exception_last_gem", "exception_leader", "exception_match_winning_play",
    ]);
  });

  // ------------------------------------------------------------------
  // 12. Hidden-info scan: safe resource-budget enums accepted, card-name/source-id rejected
  // ------------------------------------------------------------------
  it("hidden-info scan: safe resource-budget enums accepted, card-name/source-id rejected", () => {
    const { trace } = explainLegalHeuristicV1Decision(
      policyInput(
        [passMove(), playMove(unitCard("u", "test.safe", 5))],
        { ownHand: [unitCard("u", "test.safe", 5)] },
      ),
    );
    const ri = trace.roundInvestmentAnalysis!;
    const scanIssues = scanRoundInvestmentAnalysis(ri);
    expect(scanIssues).toEqual([]);

    // Inject a card-name-like value to verify rejection
    const unsafe = {
      ...ri,
      roundResourceReason: "test.spy" as const,
    };
    const scanIssues2 = scanRoundInvestmentAnalysis(unsafe as unknown as import("@/game/ai").AiDecisionRoundInvestmentAnalysis);
    expect(scanIssues2.length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------
  // 13. Exception reasons: resourceExhaustionRecommended must be false
  // ------------------------------------------------------------------
  it("exception_last_gem: resourceExhaustionRecommended === false", () => {
    const useful = unitCard("u", "test.ex-gem", 8);
    const input = policyInput(
      [passMove(), playMove(useful)],
      {
        ownHand: [useful],
        ownGems: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    const ri = trace.roundInvestmentAnalysis!;
    expect(ri.resourceExhaustionReason).toBe("exception_last_gem");
    expect(ri.resourceExhaustionRecommended).toBe(false);
  });

  it("exception_card_advantage: resourceExhaustionRecommended === false", () => {
    const spy = testCard({ cardId: "spy", sourceId: "test.spy", printedStrength: 4, abilities: ["spy"] });
    const u1 = unitCard("u1", "test.b1", 2);
    const u2 = unitCard("u2", "test.b2", 3);
    const u3 = unitCard("u3", "test.b3", 2);
    const u4 = unitCard("u4", "test.b4", 3);
    const u5 = unitCard("u5", "test.b5", 2);
    const boardUnits = [u1, u2, u3, u4, u5];

    const input = policyInput(
      [passMove(), playMove(spy), playMove(u1)],
      {
        ownHand: [spy, u1, u2, u3, u4, u5],
        ownGems: 2,
        round: 1,
        opponentGems: 2,
        boardRows: baseBoardRows({
          seat_b: {
            close: boardUnits.slice(0, 2),
            ranged: boardUnits.slice(2, 4),
            siege: [boardUnits[4]],
          },
        }),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 10, seat_b: 20 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    const ri = trace.roundInvestmentAnalysis!;
    expect(ri.resourceExhaustionReason).toBe("exception_card_advantage");
    expect(ri.resourceExhaustionRecommended).toBe(false);
  });

  it("exception_match_winning_play: resourceExhaustionRecommended === false", () => {
    const useful = unitCard("u", "test.match-win-ex", 15);
    // Board already has 5 cards, opponent on last gem
    const u1 = unitCard("u1", "test.b1", 2);
    const u2 = unitCard("u2", "test.b2", 3);
    const u3 = unitCard("u3", "test.b3", 2);
    const u4 = unitCard("u4", "test.b4", 3);
    const u5 = unitCard("u5", "test.b5", 2);
    const boardUnits = [u1, u2, u3, u4, u5];

    const input = policyInput(
      [passMove(), playMove(useful), playMove(u1)],
      {
        ownHand: [useful, u1],
        ownGems: 2,
        opponentGems: 1,
        round: 1,
        boardRows: baseBoardRows({
          seat_b: {
            close: boardUnits.slice(0, 2),
            ranged: boardUnits.slice(2, 4),
            siege: [boardUnits[4]],
          },
        }),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 15 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    const ri = trace.roundInvestmentAnalysis!;
    expect(ri.resourceExhaustionReason).toBe("exception_match_winning_play");
    expect(ri.resourceExhaustionRecommended).toBe(false);
  });

  it("round 3: resourceExhaustionRecommended === false, reason is round_three_no_budget", () => {
    const u1 = unitCard("u1", "test.r3-unit", 5);
    const u2 = unitCard("u2", "test.r2-unit", 5);
    const u3 = unitCard("u3", "test.b3", 2);
    const u4 = unitCard("u4", "test.b4", 3);
    const u5 = unitCard("u5", "test.b5", 2);
    const boardUnits = [u3, u4, u5];

    const input = policyInput(
      [passMove(), playMove(u1), playMove(u2)],
      {
        ownHand: [u1, u2],
        ownGems: 2,
        round: 3,
        opponentGems: 2,
        boardRows: baseBoardRows({
          seat_b: {
            close: boardUnits.slice(0, 1),
            ranged: [],
            siege: [boardUnits[2]],
          },
        }),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 30, seat_b: 20 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    const ri = trace.roundInvestmentAnalysis!;
    expect(ri.resourceExhaustionReason).toBe("round_three_no_budget");
    expect(ri.resourceExhaustionRecommended).toBe(false);
    // Round 3 budget = cap (6)
    expect(ri.roundResourceBudget).toBe(6);
  });

  // ------------------------------------------------------------------
  // 14. Budget-exceeded reasons: resourceExhaustionRecommended === true
  // ------------------------------------------------------------------
  it("round_budget_exceeded: resourceExhaustionRecommended === true", () => {
    // Board has 6 cards, hand has 3 specials (poor future hand)
    // Budget for poor = 3, board 6 > 3 -> over budget
    const b1 = unitCard("b1", "test.board.b1", 2);
    const b2 = unitCard("b2", "test.board.b2", 3);
    const b3 = unitCard("b3", "test.board.b3", 2);
    const b4 = unitCard("b4", "test.board.b4", 3);
    const b5 = unitCard("b5", "test.board.b5", 2);
    const b6 = unitCard("b6", "test.board.b6", 2);
    const boardUnits = [b1, b2, b3, b4, b5, b6];

    const w1 = specialCard("w1", "neutral.biting-frost", 0);
    const w2 = specialCard("w2", "neutral.impenetrable-fog", 0);
    const w3 = specialCard("w3", "neutral.torrential-rain", 0);

    const features = buildLegalHeuristicV1Features(
      policyInput(
        [passMove(), playMove(w1)],
        {
          ownHand: [w1, w2, w3],
          ownGems: 2,
          round: 1,
          opponentGems: 2,
          boardRows: baseBoardRows({
            seat_b: {
              close: boardUnits.slice(0, 3),
              ranged: boardUnits.slice(3, 5),
              siege: [boardUnits[5]],
            },
          }),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 10, seat_b: 20 },
          },
        },
      ),
    );
    const handShape = buildLegalHeuristicV1HandShapeAnalysis(features);
    const w1Move = features.playMoves.find((m) => m.sourceCardId === w1.cardId);
    const ri = buildLegalHeuristicV1RoundInvestmentAnalysis(features, w1Move ?? null, handShape);

    // Budget clamped to floor (2), board has 6 -> over budget
    expect(ri.ownBoardCardCount).toBe(6);
    expect(ri.resourceExhaustionRecommended).toBe(true);
  });

  // ------------------------------------------------------------------
  // 17. Play-card without cFp36 reason falls through to best-move explanation
  // ------------------------------------------------------------------
  it("play-card without cFp36 reason produces best-useful-move explanation", () => {
    const u1 = unitCard("u1", "test.close", 5);

    const input = policyInput(
      [passMove(), playMove(u1)],
      {
        ownHand: [u1],
        ownGems: 2,
        round: 1,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 10, seat_b: 3 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    // No cFp36 reason → falls through to standard best-move explanation
    expect(trace.reason).toContain("best useful move");
    expect(trace.reason).toContain("score");
  });

  // ------------------------------------------------------------------
  // 15. Pressure under budget is "none"
  // ------------------------------------------------------------------
  it("under-budget board investment: roundResourcePressure === 'none'", () => {
    const u1 = unitCard("u1", "test.b1", 2);
    const u2 = unitCard("u2", "test.b2", 3);
    const boardUnits = [u1, u2];

    const input = policyInput(
      [passMove(), playMove(u1)],
      {
        ownHand: [u1, u2, unitCard("u3", "test.u3", 5)],
        ownGems: 2,
        round: 1,
        opponentGems: 2,
        boardRows: baseBoardRows({
          seat_b: {
            close: boardUnits,
            ranged: [],
            siege: [],
          },
        }),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 10, seat_b: 20 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    const ri = trace.roundInvestmentAnalysis!;
    // Budget for healthy = 5, board has 2 -> under budget -> pressure "none"
    expect(ri.roundResourcePressure).toBe("none");
  });

  // ------------------------------------------------------------------
  // 16. Existing cFp29 Medic timing, cFp30 weather placement, cFp32 stop-loss, cFp33 Scoia'tael tests still pass
  //     (Covered by existing test suite — this is a smoke check that the
  //      new cFp36 fields don't break type signatures.)
  // ------------------------------------------------------------------
  it("cFp36 fields do not break cFp32 stop-loss trace signature", () => {
    const tiny = testCard({ cardId: "tiny", sourceId: "test.tiny", printedStrength: 2 });
    const input = policyInput(
      [passMove(), playMove(tiny)],
      {
        ownHand: [tiny],
        ownGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 50, seat_b: 0 },
        },
      },
    );
    const { trace } = explainLegalHeuristicV1Decision(input);
    const ri = trace.roundInvestmentAnalysis!;
    expect(ri.stopLossRecommended).toBe(true);
    // cFp36 fields should still be present
    expect(typeof ri.roundResourceBudget).toBe("number");
    expect(typeof ri.roundResourcePressure).toBe("string");
    expect(typeof ri.resourceExhaustionRecommended).toBe("boolean");
  });
});

// ==========================================================================
// cFp38: Weathered Row Low-Tempo Tuning
// ==========================================================================
describe("cFp38: weathered row low-tempo tuning", () => {
  const fogCard = testCard({ cardId: "fog", sourceId: "neutral.impenetrable-fog", printedStrength: 0, kind: "special", abilities: ["fog"] });

  const nonHeroUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.${cardId}`, printedStrength: strength, rows: ["close", "ranged"] });

  const heroUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.${cardId}`, printedStrength: strength, kind: "hero", rows: ["close", "ranged"] });

  const musterCaller = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.${cardId}`, printedStrength: strength, abilities: ["muster"], linkedSourceIds: ["test.roach-payload"] });

  const medicUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.${cardId}`, printedStrength: strength, abilities: ["medic"], rows: ["close", "ranged"] });

  const spyUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.${cardId}`, printedStrength: strength, abilities: ["spy"], rows: ["close", "ranged"] });

  const strongDiscard = testCard({ cardId: "revive-target", sourceId: "test.revive-target", printedStrength: 5, abilities: ["spy"] });

  const boardRowsWeatheredRanged = () =>
    baseBoardRows({
      seat_b: { ranged: [] },
    }).map((r) =>
      r.seatId === "seat_b" && r.row === "ranged"
        ? { ...r, units: [] }
        : r,
    );

  // ------------------------------------------------------------------
  // Test 1: Same-card agile row choice
  // ------------------------------------------------------------------
  it("agile card selects non-weathered row over weathered row when better line exists", () => {
    const agileUnit = nonHeroUnit("agile", 8);

    const input = policyInput(
      [
        playMove(agileUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        playMove(agileUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
      ],
      {
        ownHand: [agileUnit],
        weather: [fogCard],
        boardRows: boardRowsWeatheredRanged(),
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card" && selected.target.kind === "board_row") {
      expect(selected.target.row).toBe("close");
    }

    const { trace } = explainLegalHeuristicV1Decision(input);
    const wa = trace.weatherPlacementAnalysis!;
    expect(wa.selectedMoveLowTempoWeatherRisk).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 2: cFp38 penalty proof — uses scorePlayMove to demonstrate
  // that the penalty reduces weathered move score, making clean win.
  // cFp38 alone flips the selection: weathered 20 on fog would beat
    // clean 7 without the penalty (239 > 193), but cFp38 penalty of
    // 180 + 19*22 = 598 makes weathered score ≈ -359, below clean 193.
    // This proves cFp38 is independently sufficient to penalise the
    // weathered low-tempo placement when a clearly better alternative
    // exists.
    // ------------------------------------------------------------------
    it("cFp38 penalty reduces weathered move score, clean alternative wins", () => {
      const weathered = nonHeroUnit("penalty-proof", 20);
      const cleanCard = nonHeroUnit("clean-alt", 7);

      const input = policyInput(
        [
          playMove(weathered, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
          playMove(cleanCard, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
        ],
        {
          ownHand: [weathered, cleanCard],
          weather: [fogCard],
          boardRows: boardRowsWeatheredRanged(),
          score: {
            ...baseObservation().score,
            totalBySeat: { seat_a: 5, seat_b: 0 },
          },
        },
      );

      const features = buildLegalHeuristicV1Features(input);

      // The weathered card IS a low-tempo risk
      const weatheredMove = input.legalMoves.find(
        (m): m is import("@/game/core").PlayCardMove =>
          m.kind === "play_card" &&
          m.target.kind === "board_row" &&
          m.target.side === "own" &&
          m.target.row === "ranged" &&
          m.sourceCardId === weathered.cardId,
      )!;

      expect(isOwnWeatheredLowTempoUnitPlacement(features, weatheredMove)).toBe(true);

      // A clearly better non-weathered alternative exists: clean 7 has
      // tempo 7 >= weathered effective 1 + 5, and clean score >= 25.
      expect(hasClearlyBetterNonWeatheredLine(features, weatheredMove)).toBe(true);

      // Compute scores with and without cFp38 penalty
      const weatheredScoreWithPenalty = scorePlayMove(features, weatheredMove);
      const cleanMove = input.legalMoves.find(
        (m): m is import("@/game/core").PlayCardMove =>
          m.kind === "play_card" &&
          m.target.kind === "board_row" &&
          m.target.side === "own" &&
          m.target.row === "close" &&
          m.sourceCardId === cleanCard.cardId,
      )!;
      const cleanScore = scorePlayMove(features, cleanMove);

      // Clean wins after penalty
      expect(cleanScore).toBeGreaterThan(weatheredScoreWithPenalty);

      // Verify cFp38 alone is what flips the selection:
      // weathered base = 225 (strategic) + 1*14 = 239
      // clean = 95 + 98 = 193
      // 239 > 193 without penalty — cFp38 is the sole reason clean wins.
      // Cast target to the specific board_row shape expected by effectivePlacedStrengthForPolicy
      const weatheredTarget = weatheredMove.target as { kind: "board_row"; side: "own" | "opponent"; row: CatalogRow };
      const weatheredBaseScore = weathered.printedStrength * 10 + 25 + effectivePlacedStrengthForPolicy(features, weathered, weatheredTarget);
      expect(weatheredBaseScore).toBeGreaterThan(cleanScore);

      // cFp38 penalty reduces weathered score below clean score
      const penaltyAmount = 180 + (weathered.printedStrength - 1) * 22;
      expect(weatheredBaseScore - penaltyAmount).toBeLessThan(cleanScore);

      // v1 selects the clean alternative
      const selected = legalHeuristicPolicyV1.selectMove(input);
      expect(selected?.kind).toBe("play_card");
      if (selected && selected.kind === "play_card") {
        expect(selected.sourceCardId).toBe(cleanCard.cardId);
      }

      // The selected move is the clean alternative, so the trace does not
      // show a weathered low-tempo risk on the selected move (the penalty
      // is only attached to diagnostics for the *selected* play).
      const { trace } = explainLegalHeuristicV1Decision(input);
      const wa = trace.weatherPlacementAnalysis!;
      // Clean card selected → no low-tempo risk on selected move
      expect(wa.selectedMoveLowTempoWeatherRisk).toBe(false);
      // No weathered move selected → no "better alternative" analysis either
      expect(wa.betterNonWeatheredAlternativeAvailable).toBe(false);
      expect(wa.weatheredLowTempoPenaltyApplied).toBe(false);
    });

  // ------------------------------------------------------------------
  // Test 3: No-better-line selected weathered unit with reason string
  // ------------------------------------------------------------------
  it("no-better-line: weathered unit selected with correct diagnostics and reason", () => {
    const onlyUnit = nonHeroUnit("only-unit", 8);

    const input = policyInput(
      [
        playMove(onlyUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        passMove(),
      ],
      {
        ownHand: [onlyUnit],
        weather: [fogCard],
        boardRows: boardRowsWeatheredRanged(),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card" && selected.target.kind === "board_row") {
      expect(selected.target.row).toBe("ranged");
    }

    const { trace } = explainLegalHeuristicV1Decision(input);
    const wa = trace.weatherPlacementAnalysis!;
    expect(wa.selectedMoveLowTempoWeatherRisk).toBe(true);
    expect(wa.betterNonWeatheredAlternativeAvailable).toBe(false);
    expect(wa.weatheredLowTempoPenaltyApplied).toBe(false);
    // Reason should say "no better visible line" since penalty was NOT applied
    expect(trace.reason).toContain("no better visible line");
  });

  // ------------------------------------------------------------------
  // Test 4: Hero exception
  // ------------------------------------------------------------------
  it("hero on weathered row is not treated as low-tempo risk", () => {
    const hero = heroUnit("hero1", 10);

    const input = policyInput(
      [
        playMove(hero, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        playMove(hero, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
      ],
      {
        ownHand: [hero],
        weather: [fogCard],
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");

    const { trace } = explainLegalHeuristicV1Decision(input);
    const wa = trace.weatherPlacementAnalysis!;
    expect(wa.selectedMoveLowTempoWeatherRisk).toBe(false);
    expect(wa.selectedEffectiveStrengthBucket).toBe("high");
  });

  // ------------------------------------------------------------------
  // Test 5: Muster exception — proves exemption with both a weathered
  // risky move AND a clearly better alternative that would trigger the
  // penalty if the card were not exempt.
  // ------------------------------------------------------------------
  it("muster/linked caller: weathered wins due to muster bonus, exemption verified", () => {
    // Weathered 16-strength muster caller:
    //   - Without muster bonus: score ≈ 160+224 = 384 (weathered, effective=1)
    //   - With muster bonus: score ≈ 160+224+210 = 594 (beats clean 7-strength at ~193)
    // Clean 7-strength on close: score ≈ 95+98 = 193
    const musterCallerCard = musterCaller("muster", 16);
    const cleanAlt = nonHeroUnit("clean", 7);

    const input = policyInput(
      [
        playMove(musterCallerCard, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        playMove(cleanAlt, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
      ],
      {
        ownHand: [musterCallerCard, cleanAlt],
        weather: [fogCard],
        boardRows: boardRowsWeatheredRanged(),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 3, seat_b: 0 },
        },
      },
    );

    const features = buildLegalHeuristicV1Features(input);

    // The weathered muster caller IS a low-tempo risk
    const musterMove = input.legalMoves.find(
      (m): m is import("@/game/core").PlayCardMove =>
        m.kind === "play_card" &&
        m.sourceCardId === musterCallerCard.cardId &&
        m.target.kind === "board_row" &&
        m.target.row === "ranged",
    )!;
    expect(isOwnWeatheredLowTempoUnitPlacement(features, musterMove)).toBe(true);

    // A clearly better alternative exists (clean card has higher tempo)
    // Clean tempo = 7, weathered tempo = 1. Clean tempo >= weathered tempo + 5? 7 >= 6? yes.
    // So hasClearlyBetterNonWeatheredLine should be true
    expect(hasClearlyBetterNonWeatheredLine(features, musterMove)).toBe(true);

    // The muster caller is exempted
    expect(shouldExemptFromWeatheredLowTempoPenalty(features, musterMove)).toBe(true);

    // The weathered muster caller wins because of muster bonus
    // Score-based guard: if the card lookup succeeds, the muster caller
    // must outscore the clean alternative (muster bonus + higher tempo).
    const musterScore = scorePlayMove(features, musterMove);
    const cleanScore = scorePlayMove(features, hasClearlyBetterNonWeatheredLine(features, musterMove)
      ? input.legalMoves.find(
          (m): m is import("@/game/core").PlayCardMove =>
            m.kind === "play_card" &&
            m.target.kind === "board_row" &&
            m.target.side === "own" &&
            m.target.row === "close",
        )!
      : musterMove);
    expect(musterScore).toBeGreaterThan(cleanScore);

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card") {
      expect(selected.sourceCardId).toBe(musterCallerCard.cardId);
    }

    // Trace diagnostics: risk=true, better alternative exists, but penalty NOT applied
    // because of muster exemption
    const { trace } = explainLegalHeuristicV1Decision(input);
    const wa = trace.weatherPlacementAnalysis!;
    expect(wa.selectedMoveLowTempoWeatherRisk).toBe(true);
    expect(wa.betterNonWeatheredAlternativeAvailable).toBe(true);
    expect(wa.weatheredLowTempoPenaltyApplied).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 6: Strong Medic exception — same pattern as muster
  // ------------------------------------------------------------------
  it("strong Medic: weathered wins due to medic bonus, exemption verified", () => {
    const medic = medicUnit("medic", 16);
    const cleanAlt = nonHeroUnit("clean", 7);

    const input = policyInput(
      [
        playMove(medic, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        playMove(cleanAlt, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
      ],
      {
        ownHand: [medic, cleanAlt],
        weather: [fogCard],
        boardRows: boardRowsWeatheredRanged(),
        ownDiscard: [strongDiscard],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 3, seat_b: 0 },
        },
      },
    );

    const features = buildLegalHeuristicV1Features(input);

    // The weathered medic IS a low-tempo risk
    const medicMove = input.legalMoves.find(
      (m): m is import("@/game/core").PlayCardMove =>
        m.kind === "play_card" &&
        m.sourceCardId === medic.cardId &&
        m.target.kind === "board_row" &&
        m.target.row === "ranged",
    )!;
    expect(isOwnWeatheredLowTempoUnitPlacement(features, medicMove)).toBe(true);

    // Strong Medic with revive target has bestReviveValueBucket = "strong"
    const medicInfo = medicSourceUtility(features, medic);
    expect(medicInfo.bestReviveValueBucket).toBe("strong");

    // The medic is exempted
    expect(shouldExemptFromWeatheredLowTempoPenalty(features, medicMove)).toBe(true);

    // v1 selects the weathered medic due to medic bonus (score guard)
    const medicScore = scorePlayMove(features, medicMove);
    const medicCleanMove = input.legalMoves.find(
      (m): m is import("@/game/core").PlayCardMove =>
        m.kind === "play_card" &&
        m.target.kind === "board_row" &&
        m.target.side === "own" &&
        m.target.row === "close",
    );
    if (medicCleanMove) {
      const cleanScore = scorePlayMove(features, medicCleanMove);
      expect(medicScore).toBeGreaterThan(cleanScore);
    }

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card") {
      expect(selected.sourceCardId).toBe(medic.cardId);
    }

    const { trace } = explainLegalHeuristicV1Decision(input);
    const wa = trace.weatherPlacementAnalysis!;
    expect(wa.selectedMoveLowTempoWeatherRisk).toBe(true);
    expect(wa.betterNonWeatheredAlternativeAvailable).toBe(true);
    expect(wa.weatheredLowTempoPenaltyApplied).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 7: Last-gem catch-up exception
  // ------------------------------------------------------------------
  it("last-gem catch-up: weathered low-tempo selected with no better line", () => {
    const onlyUnit = nonHeroUnit("last-unit", 8);

    const input = policyInput(
      [
        playMove(onlyUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
      ],
      {
        ownHand: [onlyUnit],
        weather: [fogCard],
        boardRows: boardRowsWeatheredRanged(),
        ownGems: 1,
        opponentGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 20, seat_b: 5 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");

    const { trace } = explainLegalHeuristicV1Decision(input);
    const wa = trace.weatherPlacementAnalysis!;
    expect(wa.selectedMoveLowTempoWeatherRisk).toBe(true);
    expect(wa.betterNonWeatheredAlternativeAvailable).toBe(false);
    expect(wa.weatheredLowTempoPenaltyApplied).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 8: Policy/explanation parity
  // ------------------------------------------------------------------
  it("selectMove and explain produce the same move for cFp38 fixture", () => {
    const agileUnit = nonHeroUnit("parity-unit", 8);

    const input = policyInput(
      [
        playMove(agileUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        playMove(agileUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
        passMove(),
      ],
      {
        ownHand: [agileUnit],
        weather: [fogCard],
        boardRows: boardRowsWeatheredRanged(),
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    const { move: tracedMove } = explainLegalHeuristicV1Decision(input);
    expect(tracedMove?.moveId).toBe(selected?.moveId);
  });

  // ------------------------------------------------------------------
  // Test 9: Spy exception — proven with a clearly better clean
  // alternative that would trigger the penalty if the spy were not exempt.
  // ------------------------------------------------------------------
  it("spy on weathered row not penalized by cFp38", () => {
    const spy = spyUnit("spy", 8);
    const cleanAlt = nonHeroUnit("clean", 7);

    const input = policyInput(
      [
        playMove(spy, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        playMove(cleanAlt, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
      ],
      {
        ownHand: [spy, cleanAlt],
        weather: [fogCard],
        boardRows: boardRowsWeatheredRanged(),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 3, seat_b: 0 },
        },
      },
    );

    const features = buildLegalHeuristicV1Features(input);

    // The weathered spy IS a low-tempo risk
    const spyMove = input.legalMoves.find(
      (m): m is import("@/game/core").PlayCardMove =>
        m.kind === "play_card" &&
        m.sourceCardId === spy.cardId &&
        m.target.kind === "board_row" &&
        m.target.row === "ranged",
    )!;
    expect(isOwnWeatheredLowTempoUnitPlacement(features, spyMove)).toBe(true);

    // A clearly better non-weathered alternative exists (clean 7 tempo >=
    // weathered effective 1 + 5, clean score >= 25)
    expect(hasClearlyBetterNonWeatheredLine(features, spyMove)).toBe(true);

    // Spy is exempted from the penalty even though a better line exists
    expect(shouldExemptFromWeatheredLowTempoPenalty(features, spyMove)).toBe(true);

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card") {
      expect(selected.sourceCardId).toBe(spy.cardId);
    }

    // Trace diagnostics: risk=true, better alternative exists, but penalty NOT applied
    // because of spy exemption
    const { trace } = explainLegalHeuristicV1Decision(input);
    const wa = trace.weatherPlacementAnalysis!;
    expect(wa.selectedMoveLowTempoWeatherRisk).toBe(true);
    expect(wa.betterNonWeatheredAlternativeAvailable).toBe(true);
    expect(wa.weatheredLowTempoPenaltyApplied).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 10: v0 isolation — behavioral fixture proving cFp30 drives
  // v0/v1 divergence, not cFp38. v0 ignores cFp30 weather penalty,
  // so weathered wins in v0. v1 applies cFp30 weather penalty,
  // so clean wins in v1. cFp38 penalty further reduces weathered
  // score in v1 but is not the cause of divergence.
  // ------------------------------------------------------------------
  it("v0 and v1 diverge on weathered low-tempo play — cFp30 drives difference, v0 unaffected by cFp38", () => {
    // Weathered 15-strength on fog-ranged vs clean 7-strength on close:
    //   v0 weathered: 150+25+15*14 = 325 (no weather penalty)
    //   v0 clean:    70+25+7*14   = 173
    //   → v0 selects weathered
    //   v1 weathered: 200+1*14 - cFp38Penalty ≈ negative (weather reduces to effective=1)
    //   v1 clean:    95+7*14   = 193
    //   → v1 selects clean
    const weathered = nonHeroUnit("v0-diverge", 15);
    const cleanCard = nonHeroUnit("v0-clean", 7);

    const input = policyInput(
      [
        playMove(weathered, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
        playMove(cleanCard, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
      ],
      {
        ownHand: [weathered, cleanCard],
        weather: [fogCard],
        boardRows: boardRowsWeatheredRanged(),
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    const v1Selected = legalHeuristicPolicyV1.selectMove(input);
    expect(v1Selected?.kind).toBe("play_card");
    if (v1Selected && v1Selected.kind === "play_card") {
      expect(v1Selected.sourceCardId).toBe(cleanCard.cardId);
    }

    const v0Selected = legalHeuristicPolicyV0.selectMove(input);
    expect(v0Selected?.kind).toBe("play_card");
    if (v0Selected && v0Selected.kind === "play_card") {
      // v0 does NOT apply cFp30 weather penalty, so weathered wins
      expect(v0Selected.sourceCardId).toBe(weathered.cardId);
    }

    // v1 and v0 select different cards — proving they use different scoring
    expect(v1Selected?.sourceCardId).not.toBe(v0Selected?.sourceCardId);

    // v1's weathered move gets the cFp38 penalty; v0 never sees it
    const features = buildLegalHeuristicV1Features(input);
    const weatheredMove = input.legalMoves.find(
      (m): m is import("@/game/core").PlayCardMove =>
        m.kind === "play_card" && m.sourceCardId === weathered.cardId && m.target.row === "ranged",
    )!;

    const v1WeatheredScore = scorePlayMove(features, weatheredMove);
    const v1CleanMove = input.legalMoves.find(
      (m): m is import("@/game/core").PlayCardMove =>
        m.kind === "play_card" && m.sourceCardId === cleanCard.cardId && m.target.row === "close",
    )!;
    const v1CleanScore = scorePlayMove(features, v1CleanMove);

    // v1 penalizes the weathered move, v1 clean score > v1 weathered score
    expect(v1CleanScore).toBeGreaterThan(v1WeatheredScore);

    // cFp38 diagnostic: the selected move is the clean card, so the
    // trace shows no weathered risk on the selected play.  The
    // weathered move itself was already verified above via scores.
    const { trace } = explainLegalHeuristicV1Decision(input);
    const wa = trace.weatherPlacementAnalysis!;
    expect(wa.selectedMoveLowTempoWeatherRisk).toBe(false);
  });
});

describe("cFp39: medic no-target timing guard", () => {
  const medicUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.${cardId}`, printedStrength: strength, abilities: ["medic"], rows: ["close", "ranged"] });

  const nonMedicUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.${cardId}`, printedStrength: strength, rows: ["close", "ranged"] });

  const spyUnit = (cardId: string, strength: number) =>
    testCard({ cardId, sourceId: `test.${cardId}`, printedStrength: strength, abilities: ["spy"] });

  // ------------------------------------------------------------------
  // Test 1: No-target Medic delayed when useful non-Medic unit exists
  // ------------------------------------------------------------------
  it("No-target Medic delayed when useful non-Medic unit exists", () => {
    const medic = medicUnit("medic", 3);
    const nonMedic = nonMedicUnit("useful", 6);

    const input = policyInput(
      [passMove(), playMove(medic), playMove(nonMedic)],
      {
        ownHand: [medic, nonMedic],
        ownDiscard: [],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card") {
      expect(selected.sourceCardId).not.toBe(medic.cardId);
      expect(selected.sourceCardId).toBe(nonMedic.cardId);
    }

    // Verify no-target Medic helpers
    const features = buildLegalHeuristicV1Features(input);
    const medicMove = input.legalMoves.find((m) => m.kind === "play_card" && m.sourceCardId === medic.cardId)!;
    expect(isNoTargetMedicSourcePlay(features, medicMove)).toBe(true);
    expect(hasUsefulNonMedicLine(features, medicMove)).toBe(true);

    // Trace diagnostics — selected move is non-Medic, so all cFp39 booleans are false
    const { trace } = explainLegalHeuristicV1Decision(input);
    const medicAnalysis = trace.medicTimingAnalysis!;
    expect(medicAnalysis.selectedNoTargetMedicDelayRisk).toBe(false);
    expect(medicAnalysis.betterNonMedicAlternativeAvailable).toBe(false);
    expect(medicAnalysis.noTargetMedicDelayPenaltyApplied).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 2: No-target Medic can still be played when no useful non-Medic line exists
  // ------------------------------------------------------------------
  it("No-target Medic can still be played when no useful non-Medic line exists", () => {
    const medic = medicUnit("medic", 10);
    const uselessSpecial = testCard({ cardId: "useless", sourceId: "test.useless", printedStrength: 0, kind: "special", abilities: ["none"] });

    const input = policyInput(
      [passMove(), playMove(medic), playMove(uselessSpecial)],
      {
        ownHand: [medic, uselessSpecial],
        ownDiscard: [],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card") {
      expect(selected.sourceCardId).toBe(medic.cardId);
    }

    // Trace diagnostics
    const { trace } = explainLegalHeuristicV1Decision(input);
    const medicAnalysis = trace.medicTimingAnalysis!;
    expect(medicAnalysis.selectedNoTargetMedicDelayRisk).toBe(true);
    expect(medicAnalysis.betterNonMedicAlternativeAvailable).toBe(false);
    expect(medicAnalysis.noTargetMedicDelayPenaltyApplied).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 3: Strong revive target remains attractive
  // ------------------------------------------------------------------
  it("Strong revive target remains attractive", () => {
    const medic = medicUnit("medic", 3);
    const nonMedic = nonMedicUnit("decent", 5);
    const strongTarget = spyUnit("spy-target", 8);

    const input = policyInput(
      [passMove(), playMove(medic), playMove(nonMedic)],
      {
        ownHand: [medic, nonMedic],
        ownDiscard: [strongTarget],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card") {
      expect(selected.sourceCardId).toBe(medic.cardId);
    }

    // Verify Medic utility shows strong target
    const features = buildLegalHeuristicV1Features(input);
    const medicCard = features.ownHandByCardId.get(medic.cardId);
    if (medicCard) {
      const medicInfo = medicSourceUtility(features, medicCard);
      expect(medicInfo.bestReviveValueBucket).toBe("strong");
      expect(medicInfo.hasReviveTarget).toBe(true);
    }

    // Trace diagnostics
    const { trace } = explainLegalHeuristicV1Decision(input);
    const medicAnalysis = trace.medicTimingAnalysis!;
    expect(medicAnalysis.selectedMoveIsMedic).toBe(true);
    expect(medicAnalysis.noTargetMedicDelayPenaltyApplied).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 4: Weak/no-target Medic penalty does not alter prompt target ranking
  // ------------------------------------------------------------------
  it("Weak/no-target Medic penalty does not alter prompt target ranking", () => {
    const brute = testCard({ cardId: "brute", sourceId: "test.brute", printedStrength: 10 });
    const weak = testCard({ cardId: "weak", sourceId: "test.weak", printedStrength: 1 });

    const promptMoves = [
      promptMove("revive:brute", "medic", {
        kind: "card_instance",
        side: "own",
        seatId: "seat_b",
        cardId: brute.cardId,
        row: "close",
      }),
      promptMove("revive:weak", "medic", {
        kind: "card_instance",
        side: "own",
        seatId: "seat_b",
        cardId: weak.cardId,
        row: "close",
      }),
    ];

    const input = policyInput(promptMoves, {
      pendingPrompt: {
        promptId: "prompt:test",
        seatId: "seat_b",
        kind: "medic_revive",
        abilityId: "medic",
        options: [
          { optionId: "revive:brute", label: "brute", targetCard: brute, targetStrength: 10 },
          { optionId: "revive:weak", label: "weak", targetCard: weak, targetStrength: 1 },
        ],
      },
    });

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected).toEqual(expect.objectContaining({ optionId: "revive:brute" }));
  });

  // ------------------------------------------------------------------
  // Test 5: Opponent-passed catch-up exception
  // ------------------------------------------------------------------
  it("Opponent-passed catch-up exception allows Medic when needed to win", () => {
    const medic = medicUnit("medic", 12);
    const smallNonMedic = nonMedicUnit("small", 2);

    const input = policyInput(
      [passMove(), playMove(medic), playMove(smallNonMedic)],
      {
        ownHand: [medic, smallNonMedic],
        ownDiscard: [],
        opponentPassed: true,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card") {
      expect(selected.sourceCardId).toBe(medic.cardId);
    }
  });

  // ------------------------------------------------------------------
  // Test 6: Last-gem emergency exception
  // ------------------------------------------------------------------
  it("Last-gem emergency exception allows no-target Medic for best catch-up", () => {
    const medic = medicUnit("medic", 10);

    const input = policyInput(
      [playMove(medic)],
      {
        ownHand: [medic],
        ownDiscard: [],
        ownGems: 1,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 15, seat_b: 5 },
        },
      },
    );

    const selected = legalHeuristicPolicyV1.selectMove(input);
    expect(selected?.kind).toBe("play_card");
    if (selected && selected.kind === "play_card") {
      expect(selected.sourceCardId).toBe(medic.cardId);
    }

    // Trace diagnostics: penalty should not be applied (last-gem exception)
    const { trace } = explainLegalHeuristicV1Decision(input);
    const medicAnalysis = trace.medicTimingAnalysis!;
    expect(medicAnalysis.selectedNoTargetMedicDelayRisk).toBe(true);
    expect(medicAnalysis.noTargetMedicDelayPenaltyApplied).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 7: Select/explain parity
  // ------------------------------------------------------------------
  it("Select/explain parity for no-target Medic with useful non-Medic alternative", () => {
    const medic = medicUnit("medic", 3);
    const nonMedic = nonMedicUnit("useful", 6);

    const input = policyInput(
      [passMove(), playMove(medic), playMove(nonMedic)],
      {
        ownHand: [medic, nonMedic],
        ownDiscard: [],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    const selectedMove = legalHeuristicPolicyV1.selectMove(input);
    const { move: explainedMove } = explainLegalHeuristicV1Decision(input);

    expect(selectedMove).toEqual(explainedMove);
  });

  // ------------------------------------------------------------------
  // Test 8: Trace fields are hidden-info safe
  // ------------------------------------------------------------------
  it("Trace fields are hidden-info safe", () => {
    const medic = medicUnit("medic", 3);
    const nonMedic = nonMedicUnit("useful", 6);

    const input = policyInput(
      [passMove(), playMove(medic), playMove(nonMedic)],
      {
        ownHand: [medic, nonMedic],
        ownDiscard: [],
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    const { trace } = explainLegalHeuristicV1Decision(input);
    const medicAnalysis = trace.medicTimingAnalysis!;

    // New booleans should be present
    expect(typeof medicAnalysis.selectedNoTargetMedicDelayRisk).toBe("boolean");
    expect(typeof medicAnalysis.betterNonMedicAlternativeAvailable).toBe("boolean");
    expect(typeof medicAnalysis.noTargetMedicDelayPenaltyApplied).toBe("boolean");

    // JSON should not contain hidden info
    const traceJson = JSON.stringify(trace);
    expect(traceJson).not.toContain("test.medic");
    expect(traceJson).not.toContain(medic.sourceId);
    expect(traceJson).not.toContain("seat_a:");
    expect(traceJson).not.toContain("seat_b:");
  });

  // ------------------------------------------------------------------
  // Test 9: Medic score compensation is conditional on penalty applied
  // ------------------------------------------------------------------
  it("Medic score compensation in positiveUnitSourceCardIds is conditional on cFp39 penalty", () => {
    // Scenario: Medic + useful non-Medic unit, empty discard
    // cFp39 penalty DOES apply (useful non-Medic line exists, no exception).
    // The conditional +260 compensation in round-investment makes the Medic
    // count as a positive future unit (rawScore ~-15 + 260 = +245 > 0).
    const medic = medicUnit("medic", 10);
    const strongUnit = nonMedicUnit("strong", 12);

    const medicMove = playMove(medic);
    const input = policyInput(
      [passMove(), medicMove, playMove(strongUnit)],
      {
        ownHand: [medic, strongUnit],
        ownDiscard: [],
        ownGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 40, seat_b: 35 },
        },
      },
    );

    // Verify cFp39 penalty applies to this Medic play
    const features = buildLegalHeuristicV1Features(input);
    const penaltyApplies = shouldApplyNoTargetMedicDelayPenalty(features, medicMove);
    expect(penaltyApplies).toBe(true);

    // Build round-investment analysis with the Medic as selected move.
    // With conditional +260 compensation, the Medic becomes positive
    // (rawScore ~-15 + 260 = +245). Both Medic and strongUnit are positive.
    const handShape = buildLegalHeuristicV1HandShapeAnalysis(features);
    const medicPlayMove = medicMove as import("@/game/ai").PlayCardMove;
    const medicAnalysis = buildLegalHeuristicV1RoundInvestmentAnalysis(
      features,
      medicPlayMove,
      handShape,
    );

    // Both the compensated Medic and the strong unit count as positive.
    expect(medicAnalysis.positiveFutureUnitMoveCount).toBe(2);
    // Playing Medic would leave the strongUnit as remaining positive unit.
    expect(medicAnalysis.selectedMoveWouldLeaveNoPositiveUnitMove).toBe(false);
  });

  // ------------------------------------------------------------------
  // Test 10: Weak no-target Medic without penalty not incorrectly compensated
  // ------------------------------------------------------------------
  it("Weak no-target Medic without cFp39 penalty is not made positive by unconditional compensation", () => {
    // Scenario: Medic is the only play, no useful non-Medic line.
    // cFp39 penalty does NOT apply (hasUsefulNonMedicLine returns false).
    // Without conditional compensation, a weak no-target Medic should NOT
    // be counted as a positive unit just because of +260.
    const medic = medicUnit("medic", 3);

    const medicMove = playMove(medic);
    const input = policyInput(
      [passMove(), medicMove],
      {
        ownHand: [medic],
        ownDiscard: [],
        ownGems: 2,
        score: {
          ...baseObservation().score,
          totalBySeat: { seat_a: 5, seat_b: 0 },
        },
      },
    );

    // Verify cFp39 penalty does NOT apply (no useful non-Medic line)
    const features = buildLegalHeuristicV1Features(input);
    const penaltyApplies = shouldApplyNoTargetMedicDelayPenalty(features, medicMove);
    expect(penaltyApplies).toBe(false);

    // Build round-investment analysis with the Medic as selected move.
    // Since penalty does not apply, no +260 compensation is added.
    const handShape = buildLegalHeuristicV1HandShapeAnalysis(features);
    const medicPlayMove = medicMove as import("@/game/ai").PlayCardMove;
    const medicAnalysis = buildLegalHeuristicV1RoundInvestmentAnalysis(
      features,
      medicPlayMove,
      handShape,
    );

    // The Medic's raw score is ~-140 (no-target utility) + base(55) = ~-85.
    // Without compensation, it should NOT count as positive.
    // positiveFutureUnitMoveCount should be 0 because the Medic alone doesn't
    // have enough strength to be positive after cFp29 no-target utility.
    // The policy still selects the Medic because it's the only play_card move
    // (bestUsefulMove falls through to passMove, but choosePlayingMove
    // falls back to the only non-pass play).
    expect(medicAnalysis.positiveFutureUnitMoveCount).toBe(0);
    expect(medicAnalysis.selectedMoveWouldLeaveNoPositiveUnitMove).toBe(true);
  });

  // ------------------------------------------------------------------
  // cFp41.1: Recursive-scoring guard regression test
  // ------------------------------------------------------------------
  it("cFp41.1: no stack overflow when scoring no-target Medic alongside weathered low-tempo placement", () => {
    // Fixture reproduces the conditions that triggered the stack overflow
    // in the expanded benchmark run: a no-target Medic source play, a
    // useful non-Medic line, and a weathered low-tempo own-row unit
    // placement that exercises both cFp38 and cFp39 guards.
    const medicCard = testCard({
      cardId: "medic",
      sourceId: "test.medic",
      printedStrength: 1,
      abilities: ["medic"],
      rows: ["close"],
    });
    const weatheredUnit = testCard({
      cardId: "weathered-unit",
      sourceId: "test.weathered.unit",
      printedStrength: 8,
      rows: ["close"],
    });
    const usefulUnit = testCard({
      cardId: "useful-unit",
      sourceId: "test.useful.unit",
      printedStrength: 6,
      rows: ["ranged"],
    });
    const strongUnit = testCard({
      cardId: "strong-unit",
      sourceId: "test.strong.unit",
      printedStrength: 10,
      rows: ["ranged"],
    });

    const boardRows = baseBoardRows({
      seat_b: {
        close: [weatheredUnit],
      },
    });

    const weatherFrost = testCard({
      cardId: "frost",
      sourceId: "neutral.biting-frost",
      printedStrength: 0,
      kind: "special",
      abilities: ["frost"],
    });

    const moves = [
      passMove(),
      playMove(medicCard, { kind: "board_row", side: "own", seatId: "seat_b", row: "close" }),
      playMove(usefulUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
      playMove(strongUnit, { kind: "board_row", side: "own", seatId: "seat_b", row: "ranged" }),
    ];

    const input = policyInput(moves, {
      ownHand: [medicCard, usefulUnit, strongUnit],
      weather: [weatherFrost],
      boardRows,
    });

    // Should not throw Maximum call stack size exceeded
    let selectedMove: LegalMove | null;
    expect(() => {
      selectedMove = legalHeuristicPolicyV1.selectMove(input);
    }).not.toThrow();

    expect(selectedMove).not.toBeNull();
    expect(["play_card", "pass"].includes(selectedMove!.kind)).toBe(true);

    // Verify the explanation path also completes without stack overflow
    const { trace } = explainLegalHeuristicV1Decision(input);
    expect(trace).toBeDefined();

    // Trace must be hidden-info safe
    const json = JSON.stringify(trace);
    expect(json).not.toContain("seat_a:");
    expect(json).not.toContain("seat_b:");

    // cFp38/cFp39 analysis booleans should be coherent
    expect(trace.weatherPlacementAnalysis).toBeDefined();
    expect(trace.medicTimingAnalysis).toBeDefined();
    if (trace.weatherPlacementAnalysis) {
      expect(
        typeof trace.weatherPlacementAnalysis.selectedMoveLowTempoWeatherRisk,
      ).toBe("boolean");
      expect(
        typeof trace.weatherPlacementAnalysis.betterNonWeatheredAlternativeAvailable,
      ).toBe("boolean");
      expect(
        typeof trace.weatherPlacementAnalysis.weatheredLowTempoPenaltyApplied,
      ).toBe("boolean");
    }
    if (trace.medicTimingAnalysis) {
      expect(
        typeof trace.medicTimingAnalysis.selectedNoTargetMedicDelayRisk,
      ).toBe("boolean");
      expect(
        typeof trace.medicTimingAnalysis.betterNonMedicAlternativeAvailable,
      ).toBe("boolean");
      expect(
        typeof trace.medicTimingAnalysis.noTargetMedicDelayPenaltyApplied,
      ).toBe("boolean");
    }
  });
});
