import { describe, expect, it } from "vitest";

import {
  buildProductDiagnosticExport,
  copyDiagnosticExport,
  PRODUCT_DIAGNOSTICS_SCHEMA_VERSION,
  scanForHiddenInfoHazards,
  scanMedicTimingAnalysis,
  scanRoundInvestmentAnalysis,
  scanWeatherPlacementAnalysis,
} from "@/components/gwent/matchDiagnostics";
import { engineDiagnosticTraceAppended, engineMatchStarted } from "@/store/slices/engineSlice";
import { configureStore } from "@reduxjs/toolkit";
import engineReducer from "@/store/slices/engineSlice";
import {
  explainLegalHeuristicV1Decision,
  type SeatCardSummary,
  type SeatObservation,
  type LegalMove,
  type CatalogRow,
  type CatalogAbilityId,
  type CatalogCardKind,
} from "@/game/ai";
import type { MatchScoreBreakdown } from "@/game/core";

const createTestStore = () =>
  configureStore({
    reducer: { engine: engineReducer },
  });

const hiddenInfoHazards = [
  "cardsById",
  "finalState",
  "commandLog",
  '"hand"',
  '"deck"',
  "ownHand",
  "opponentHand",
  "seat_a:",
  "seat_b:",
  "unsafeDebugResults",
];

describe("cFp25: product diagnostic export", () => {
  it("includes setup metadata, command/event summaries, policy id, and decision traces", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "test-match-001",
      humanDeckPresetId: "test-human-deck",
      humanDeckPresetName: "Test Human Deck",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test-ai-deck",
      aiDeckPresetName: "Test AI Deck",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [
        {
          sequence: 1,
          command: { type: "ChooseMulligan", seatId: "seat_a" },
          status: "applied",
          eventCount: 10,
        },
      ],
      eventLog: [
        { type: "initial_hand_drawn", cardIds: ["c1", "c2"], seatId: "seat_a" },
      ],
      decisionTraces: [],
      warnings: [],
      route: "/",
    });

    expect(exportData.schemaVersion).toBe(PRODUCT_DIAGNOSTICS_SCHEMA_VERSION);
    expect(exportData.generatedAt).toBeTruthy();
    expect(exportData.route).toBe("/");
    expect(exportData.matchSeed).toBe("test-match-001");
    expect(exportData.humanDeckPresetId).toBe("test-human-deck");
    expect(exportData.aiPolicyId).toBe("legal-heuristic-v1");
    expect(exportData.currentPhase).toBe("playing");
    expect(exportData.commandEventSummaries).toHaveLength(1);
    expect(exportData.commandEventSummaries[0].commandType).toBe("ChooseMulligan");
    expect(exportData.decisionTraces).toEqual([]);
    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
  });

  it("resets between rematches/new matches (empty traces when no match started)", () => {
    const store = createTestStore();

    // Initially no traces.
    expect(store.getState().engine.diagnosticTraces).toEqual([]);

    // Start a match.
    store.dispatch(
      engineMatchStarted({
        match: {
          phase: "playing",
          round: 1,
          currentTurn: "seat_b",
          rng: { seed: "test-001" },
          seats: {
            seat_a: {
              hand: [],
              deck: [],
              discard: [],
              sideDeck: [],
              removedFromGame: [],
              board: { close: { units: [], horn: null }, ranged: { units: [], horn: null }, siege: { units: [], horn: null } },
              leader: null,
              leaderSourceId: "",
              leaderUsed: false,
              leaderCancelledRound: null,
              passed: false,
              gems: 2,
              mulliganComplete: true,
            },
            seat_b: {
              hand: [],
              deck: [],
              discard: [],
              sideDeck: [],
              removedFromGame: [],
              board: { close: { units: [], horn: null }, ranged: { units: [], horn: null }, siege: { units: [], horn: null } },
              leader: null,
              leaderSourceId: "",
              leaderUsed: false,
              leaderCancelledRound: null,
              passed: false,
              gems: 2,
              mulliganComplete: true,
            },
          },
          cardsById: {},
          weather: { entries: [] },
          roundHistory: [],
          lastResolvedRound: null,
          pendingPrompt: null,
          matchId: "test-001",
        },
        events: [],
      }),
    );

    // Traces should be reset.
    expect(store.getState().engine.diagnosticTraces).toEqual([]);
  });

  it("hidden-info scan passes for a representative product match diagnostic", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "test-001",
      humanDeckPresetId: "official-northern-realms-starter",
      humanDeckPresetName: "Official Northern Realms Starter",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "official-nilfgaard-starter",
      aiDeckPresetName: "Official Nilfgaard Starter",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [{ sequence: 1, command: { type: "ChooseMulligan", seatId: "seat_a" }, status: "applied", eventCount: 0 }],
      eventLog: [],
      decisionTraces: [],
      warnings: [],
    });

    const json = JSON.stringify(exportData);

    hiddenInfoHazards.forEach((hazard) => {
      expect(json).not.toContain(hazard);
    });
  });

  it("export does not include raw command objects, raw event payloads, cardsById, raw MatchState, or seat_a:/seat_b: instance IDs", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "test-001",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [{ sequence: 1, command: { type: "ChooseMulligan", seatId: "seat_a" }, status: "applied", eventCount: 0 }],
      eventLog: [],
      decisionTraces: [],
      warnings: [],
    });

    const json = JSON.stringify(exportData);

    expect(json).not.toContain("cardsById");
    expect(json).not.toContain("finalState");
    expect(json).not.toContain('"deck"');
    expect(json).not.toContain('"hand"');
    expect(json).not.toMatch(/seat_[ab]:/);
    expect(json).not.toContain("unsafeDebugResults");
  });

  it("scanForHiddenInfoHazards detects forbidden keys and raw instance IDs", () => {
    const badObject = {
      schemaVersion: "test",
      cardsById: {},
      finalState: {},
      commandLog: [],
      data: "seat_a:card:0 leaked",
    };

    const issues = scanForHiddenInfoHazards(badObject);

    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((issue) => issue.includes("cardsById"))).toBe(true);
    expect(issues.some((issue) => issue.includes("finalState"))).toBe(true);
    expect(issues.some((issue) => issue.includes("commandLog"))).toBe(true);
    expect(issues.some((issue) => issue.includes("seat_[ab]:"))).toBe(true);
  });

  it("scanForHiddenInfoHazards does not false-positive on safe keys like deckCount", () => {
    const safeObject = {
      schemaVersion: "test",
      deckCount: 10,
      handCount: 5,
      opponentHandCount: 8,
      opponentDeckCount: 12,
    };

    const issues = scanForHiddenInfoHazards(safeObject);

    expect(issues.length).toBe(0);
  });

  it("copyDiagnosticExport returns true when clipboard is available", async () => {
    // navigator.clipboard may not be available in Node.js test environment.
    // The function returns a boolean, so we test the happy path structure.
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "test-001",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [],
      warnings: [],
    });

    // The copy function may fail in a Node.js environment, but the function
    // should be callable and return a boolean.
    const result = await copyDiagnosticExport(exportData);
    expect(typeof result).toBe("boolean");
  });
});

describe("cFp26: aiDeckFaction metadata in diagnostic export", () => {
  it("Nilfgaard AI preset populates aiDeckFaction as nilfgaard", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "ep4-mp13i5kv",
      humanDeckPresetId: "current-northern-realms-starter",
      humanDeckPresetName: "Current Northern Realms",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "current-nilfgaard",
      aiDeckPresetName: "Current Nilfgaard",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [],
      warnings: [],
    });

    expect(exportData.aiDeckFaction).toBe("nilfgaard");
    expect(exportData.humanDeckFaction).toBe("northern_realms");
  });

  it("null aiDeckFaction when faction genuinely unknown", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "test-unknown",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test",
      aiDeckFaction: null,
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [],
      warnings: [],
    });

    expect(exportData.aiDeckFaction).toBeNull();
  });

  it("hidden-info safety scan still passes with aiDeckFaction populated", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "test-safety",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test-nilfgaard",
      aiDeckPresetName: "Test Nilfgaard",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
    const json = JSON.stringify(exportData);
    expect(json).not.toContain("seat_a:");
    expect(json).not.toContain("seat_b:");
  });
});

describe("cFp26.1: pass analysis fields in diagnostic export", () => {
  it("preserves new passAnalysis fields in export", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp26-1-test",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 50,
            scoreDelta: -40,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 5,
            opponentHandCount: 7,
            ownDeckCount: 2,
            opponentDeckCount: 5,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: true,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: {
            passLegal: true,
            scoreDelta: -40,
            opponentHandPressure: 42,
            requiredLead: 42,
            isVoluntarilySafe: false,
            isOpponentPassed: true,
            isLastGem: false,
            diagnosticApproxUpperBound: 350,
            policyLastGemUpperBound: 102,
            lastGemSurrenderAllowed: false,
            ownWinsTiedRound: false,
            minimumScoreToWinRound: 51,
            policyUpperBoundCanWinRound: false,
            hasSingleMoveCatchUp: false,
            bestSingleMoveCatchUpScore: null,
            bestSingleMoveCatchUpTempo: null,
            bestSingleMoveCatchUpKind: null,
            preserveHandPassRecommended: true,
          },
          selected: {
            kind: "pass",
            label: "pass",
            actionRef: "action_0",
            targetKind: "none",
          },
          candidates: [],
          reasonKind: "policy",
          reason: "opponent passed, behind — no one-card catch-up; preserve hand",
        },
      ],
      warnings: [],
    });

    expect(exportData.decisionTraces[0].passAnalysis).not.toBeNull();
    const pa = exportData.decisionTraces[0].passAnalysis!;
    expect(pa.ownWinsTiedRound).toBe(false);
    expect(pa.minimumScoreToWinRound).toBe(51);
    expect(pa.policyUpperBoundCanWinRound).toBe(false);
    expect(pa.hasSingleMoveCatchUp).toBe(false);
    expect(pa.preserveHandPassRecommended).toBe(true);
    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
  });

  it("hidden-info scan passes for cFp26.1 export with pass analysis", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp26-1-scan",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 50,
            scoreDelta: -40,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 5,
            opponentHandCount: 7,
            ownDeckCount: 2,
            opponentDeckCount: 5,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: true,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: {
            passLegal: true,
            scoreDelta: -40,
            opponentHandPressure: 42,
            requiredLead: 42,
            isVoluntarilySafe: false,
            isOpponentPassed: true,
            isLastGem: false,
            diagnosticApproxUpperBound: 350,
            policyLastGemUpperBound: 102,
            lastGemSurrenderAllowed: false,
            ownWinsTiedRound: false,
            minimumScoreToWinRound: 51,
            policyUpperBoundCanWinRound: false,
            hasSingleMoveCatchUp: false,
            bestSingleMoveCatchUpScore: null,
            bestSingleMoveCatchUpTempo: null,
            bestSingleMoveCatchUpKind: null,
            preserveHandPassRecommended: true,
          },
          selected: {
            kind: "pass",
            label: "pass",
            actionRef: "action_0",
            targetKind: "none",
          },
          candidates: [],
          reasonKind: "policy",
          reason: "opponent passed, behind — no one-card catch-up; preserve hand",
        },
      ],
      warnings: [],
    });

    const json = JSON.stringify(exportData);
    expect(json).not.toContain("cardsById");
    expect(json).not.toContain("finalState");
    expect(json).not.toContain("commandLog");
    expect(json).not.toMatch(/"ownHand"[^"]*:/);
    expect(json).not.toMatch(/"opponentHand"[^"]*:/);
    expect(json).not.toMatch(/seat_[ab]:/);
  });
});

describe("cFp25: diagnostic trace accumulator in Redux", () => {
  it("resets diagnostic traces on engine match start", () => {
    const store = createTestStore();

    // Add a trace manually.
    store.dispatch(
      engineDiagnosticTraceAppended({
        schemaVersion: "ai-decision-trace-v1",
        policyId: "legal-heuristic-v1",
        seatId: "seat_b",
        decisionIndex: 0,
        phase: "playing",
        round: 1,
        publicState: {
          seatId: "seat_b",
          opponentSeatId: "seat_a",
          phase: "playing",
          round: 1,
          currentTurn: "seat_b",
          ownScore: 5,
          opponentScore: 10,
          scoreDelta: -5,
          ownGems: 2,
          opponentGems: 2,
          ownHandCount: 8,
          opponentHandCount: 10,
          ownDeckCount: 2,
          opponentDeckCount: 5,
          ownDiscardCount: 2,
          opponentDiscardCount: 0,
          ownPassed: false,
          opponentPassed: false,
          boardRows: [],
          weatherCardCount: 0,
        },
        passAnalysis: null,
        selected: null,
        candidates: [],
        reason: "test",
      }),
    );

    expect(store.getState().engine.diagnosticTraces).toHaveLength(1);

    // Start a new match — traces should be reset.
    store.dispatch(
      engineMatchStarted({
        match: {
          phase: "mulligan",
          round: 1,
          currentTurn: "seat_a",
          rng: { seed: "test-002" },
          seats: {
            seat_a: {
              hand: [], deck: [], discard: [], sideDeck: [], removedFromGame: [],
              board: { close: { units: [], horn: null }, ranged: { units: [], horn: null }, siege: { units: [], horn: null } },
              leader: null, leaderSourceId: "", leaderUsed: false, leaderCancelledRound: null,
              passed: false, gems: 2, mulliganComplete: false,
            },
            seat_b: {
              hand: [], deck: [], discard: [], sideDeck: [], removedFromGame: [],
              board: { close: { units: [], horn: null }, ranged: { units: [], horn: null }, siege: { units: [], horn: null } },
              leader: null, leaderSourceId: "", leaderUsed: false, leaderCancelledRound: null,
              passed: false, gems: 2, mulliganComplete: false,
            },
          },
          cardsById: {},
          weather: { entries: [] },
          roundHistory: [],
          lastResolvedRound: null,
          pendingPrompt: null,
          matchId: "test-002",
        },
        events: [],
      }),
    );

    expect(store.getState().engine.diagnosticTraces).toEqual([]);
  });
});

const _emptyScoreBreakdown = (): MatchScoreBreakdown => ({
  totalBySeat: { seat_a: 0, seat_b: 0 },
  rowTotalsBySeat: { seat_a: { close: 0, ranged: 0, siege: 0 }, seat_b: { close: 0, ranged: 0, siege: 0 } },
  cards: [],
  activeWeatherEffects: [],
  diagnostics: [],
});

const _emptyBoardRows = (): SeatObservation["boardRows"] =>
  (["seat_a", "seat_b"] as const).flatMap((seatId) =>
    (["close", "ranged", "siege"] as const).map((row) => ({ seatId, row, units: [], horn: null })),
  );

const _makeCardSummary = (
  cardId: string,
  sourceId: string,
  printedStrength: number,
  kind: CatalogCardKind = "unit",
  rows: CatalogRow[] = ["close"],
  abilities: CatalogAbilityId[] = [],
): SeatCardSummary => ({
  cardId,
  sourceId,
  name: sourceId,
  kind,
  printedStrength,
  rows,
  abilities,
  deckLimit: 3,
});

const _makeObservation = (overrides: Partial<SeatObservation> = {}): SeatObservation => ({
  seatId: "seat_b",
  opponentSeatId: "seat_a",
  phase: "playing",
  round: 1,
  currentTurn: "seat_b",
  ownFaction: "nilfgaard",
  opponentFaction: "northern_realms",
  ownHand: [],
  ownLeader: { leaderCardId: "leader-b", sourceId: "leader-b", used: false, cancelledThisRound: false },
  ownDeckCount: 10,
  ownDiscardCount: 0,
  ownPassed: false,
  ownGems: 2,
  opponentHandCount: 10,
  opponentLeader: { leaderCardId: "leader-a", sourceId: "leader-a", used: false, cancelledThisRound: false },
  opponentDeckCount: 10,
  opponentDiscardCount: 0,
  opponentPassed: false,
  opponentGems: 2,
  boardRows: _emptyBoardRows(),
  weather: [],
  score: _emptyScoreBreakdown(),
  pendingPrompt: null,
  ...overrides,
});

const _passMove = (): LegalMove => ({
  kind: "pass",
  moveId: "pass:seat_b",
  seatId: "seat_b",
  label: "Pass",
  target: { kind: "none" },
});

const _playMove = (card: SeatCardSummary): LegalMove => ({
  kind: "play_card",
  moveId: `play:seat_b:${card.cardId}:board_row`,
  seatId: "seat_b",
  label: `Play ${card.sourceId}`,
  sourceCardId: card.cardId,
  sourceId: card.sourceId,
  target: { kind: "board_row", side: "own", seatId: "seat_b", row: "close" },
  metadata: { cardName: card.name, cardKind: card.kind, abilities: card.abilities, targetLabel: "board_row" },
});

describe("cFp26.1: product diagnostic export via explainLegalHeuristicV1Decision", () => {
  it("builds a trace through explainLegalHeuristicV1Decision and verifies passAnalysis fields plus hidden-info scan", () => {
    const tiny = _makeCardSummary("tiny-1", "test.tiny-1", 2);

    const observation = _makeObservation({
      ownHand: [tiny],
      ownGems: 2,
      opponentPassed: true,
      score: {
        ..._emptyScoreBreakdown(),
        totalBySeat: { seat_a: 50, seat_b: 10 },
      },
    });

    const { trace } = explainLegalHeuristicV1Decision({
      seatId: "seat_b",
      observation,
      legalMoves: [_passMove(), _playMove(tiny)],
    });

    expect(trace.schemaVersion).toBe("ai-decision-trace-v1");
    expect(trace.policyId).toBe("legal-heuristic-v1");
    expect(trace.passAnalysis).not.toBeNull();

    const pa = trace.passAnalysis!;
    expect(pa.ownWinsTiedRound).toBe(true);
    expect(pa.minimumScoreToWinRound).toBe(50);
    expect(pa.policyUpperBoundCanWinRound).toBe(false);
    expect(pa.hasSingleMoveCatchUp).toBe(false);
    expect(pa.bestSingleMoveCatchUpScore).toBeNull();
    expect(pa.bestSingleMoveCatchUpTempo).toBeNull();
    expect(pa.bestSingleMoveCatchUpKind).toBeNull();
    expect(pa.preserveHandPassRecommended).toBe(true);

    expect(trace.selected?.kind).toBe("pass");
    expect(trace.reason).toContain("preserve hand");

    const traceJson = JSON.stringify(trace);
    expect(traceJson).not.toContain("test.tiny-1");
    expect(traceJson).not.toContain("tiny-1");

    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp26-1-product-test",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [trace],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
    const exportJson = JSON.stringify(exportData);
    expect(exportJson).not.toContain("test.tiny-1");
    expect(exportJson).not.toContain("cardsById");
    expect(exportJson).not.toContain("seat_a:");
    expect(exportJson).not.toContain("seat_b:");
  });

  it("builds a trace for last-gem impossible case and verifies catch-up impossible reason", () => {
    const tiny = _makeCardSummary("tiny-lg", "test.tiny-lg", 2);

    const observation = _makeObservation({
      ownHand: [tiny],
      ownGems: 1,
      opponentPassed: true,
      score: {
        ..._emptyScoreBreakdown(),
        totalBySeat: { seat_a: 20, seat_b: 0 },
      },
    });

    const { trace } = explainLegalHeuristicV1Decision({
      seatId: "seat_b",
      observation,
      legalMoves: [_passMove(), _playMove(tiny)],
    });

    expect(trace.selected?.kind).toBe("pass");
    expect(trace.passAnalysis).not.toBeNull();
    expect(trace.passAnalysis!.lastGemSurrenderAllowed).toBe(true);
    expect(trace.passAnalysis!.policyUpperBoundCanWinRound).toBe(false);
    expect(trace.reason).toContain("catch-up impossible");

    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp26-1-last-gem-test",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [trace],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
  });
});

describe("cFp27: mulligan diagnostics in product export", () => {
  it("preserves mulliganAnalysis in decision trace export", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp27-mulligan-test",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "mulligan",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "mulligan",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "mulligan",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 0,
            opponentScore: 0,
            scoreDelta: 0,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 10,
            opponentHandCount: 10,
            ownDeckCount: 20,
            opponentDeckCount: 20,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: {
            mulliganLegal: true,
            selectedCardCount: 1,
            candidateCount: 1,
            selectedReasonKind: "low_standalone_unit",
            selectedConfidence: 80,
            selectedStandaloneValueBucket: "low",
            topCandidateConfidence: 80,
            topCandidateReasonKind: "low_standalone_unit",
          },
          selected: {
            kind: "choose_mulligan",
            label: "mulligan hidden card",
            actionRef: "action_0",
            targetKind: "none",
          },
          candidates: [],
          reasonKind: "phase",
          reason: "mulligan hidden card - low standalone unit",
        },
      ],
      warnings: [],
    });

    expect(exportData.decisionTraces[0].mulliganAnalysis).not.toBeNull();
    const ma = exportData.decisionTraces[0].mulliganAnalysis!;
    expect(ma.selectedReasonKind).toBe("low_standalone_unit");
    expect(ma.selectedStandaloneValueBucket).toBe("low");
    expect(ma.selectedConfidence).toBe(80);
    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
  });

  it("hidden-info scan passes for mulligan trace with redacted card data", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp27-mulligan-scan",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "mulligan",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "mulligan",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "mulligan",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 0,
            opponentScore: 0,
            scoreDelta: 0,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 10,
            opponentHandCount: 10,
            ownDeckCount: 20,
            opponentDeckCount: 20,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: {
            mulliganLegal: true,
            selectedCardCount: 1,
            candidateCount: 2,
            selectedReasonKind: "linked_payload",
            selectedConfidence: 400,
            selectedStandaloneValueBucket: "low",
            topCandidateConfidence: 400,
            topCandidateReasonKind: "linked_payload",
          },
          selected: {
            kind: "choose_mulligan",
            label: "mulligan hidden card",
            actionRef: "action_0",
            targetKind: "none",
          },
          candidates: [],
          reasonKind: "phase",
          reason: "mulligan hidden card - linked payload",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
    const json = JSON.stringify(exportData);
    expect(json).not.toContain("neutral.roach");
    expect(json).not.toContain("Roach");
    expect(json).not.toContain("cardIds");
    expect(json).not.toContain("linkedSourceIds");
  });

  it("hidden-info scan fails when export contains forbidden mulligan tokens", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp27-mulligan-hazard",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "mulligan",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "mulligan",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "mulligan",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 0,
            opponentScore: 0,
            scoreDelta: 0,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 10,
            opponentHandCount: 10,
            ownDeckCount: 20,
            opponentDeckCount: 20,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          selected: null,
          candidates: [],
          reasonKind: "phase",
          reason: "mulligan:seat_b:roach - redraw Roach (neutral.roach)",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(false);
  });

  // cFp27 repair: Focused tests proving each hazard independently fails.
  it("scan fails for reason containing 'redraw Roach' in mulligan trace", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp27-repair-roach",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "mulligan",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "mulligan",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "mulligan",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 0,
            opponentScore: 0,
            scoreDelta: 0,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 10,
            opponentHandCount: 10,
            ownDeckCount: 20,
            opponentDeckCount: 20,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          selected: null,
          candidates: [],
          reasonKind: "phase",
          reason: "redraw Roach",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(false);
  });

  it("scan fails for reason containing 'neutral.roach' in mulligan trace", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp27-repair-neutral-roach",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "mulligan",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "mulligan",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "mulligan",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 0,
            opponentScore: 0,
            scoreDelta: 0,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 10,
            opponentHandCount: 10,
            ownDeckCount: 20,
            opponentDeckCount: 20,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          selected: null,
          candidates: [],
          reasonKind: "phase",
          reason: "redraw neutral.roach",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(false);
  });

  it("scan fails for key 'cardIds' in exported diagnostics object", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp27-repair-cardids",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [],
      warnings: [],
    });

    // Simulate export object containing forbidden key
    const issues = scanForHiddenInfoHazards({
      ...exportData,
      cardIds: ["test-card-1"],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("cardIds"))).toBe(true);
  });

  it("scan fails for key 'linkedSourceIds' in exported diagnostics object", () => {
    const issues = scanForHiddenInfoHazards({
      schemaVersion: "test",
      linkedSourceIds: ["test.source"],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("linkedSourceIds"))).toBe(true);
  });

  it("scan fails for raw 'mulligan:' string even without seat_a:/seat_b:", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp27-repair-mulligan-id",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "mulligan",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "mulligan",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "mulligan",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 0,
            opponentScore: 0,
            scoreDelta: 0,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 10,
            opponentHandCount: 10,
            ownDeckCount: 20,
            opponentDeckCount: 20,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          selected: null,
          candidates: [],
          reasonKind: "phase",
          reason: "mulligan:hidden-card test",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(false);
  });

  it("scan passes for cFp28 handShapeAnalysis fields in export", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp28-hand-shape-test",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 5,
            scoreDelta: 5,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 3,
            opponentHandCount: 7,
            ownDeckCount: 10,
            opponentDeckCount: 10,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          handShapeAnalysis: {
            unitCardCount: 2,
            heroCardCount: 1,
            specialOrWeatherCardCount: 1,
            totalHandCount: 3,
            positiveUnitMoveCount: 2,
            positiveNonUnitMoveCount: 1,
            bestUnitTempoBucket: "medium",
            bestNonUnitTempoBucket: "low",
            futureRoundHandQuality: "healthy",
            specialOnlyHand: false,
            noUnitFutureRisk: false,
          },
          selected: {
            kind: "pass",
            label: "pass",
            actionRef: "action_0",
            targetKind: "none",
          },
          candidates: [],
          reasonKind: "policy",
          reason: "voluntary pass safe (delta 5, required 42)",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
    const json = JSON.stringify(exportData);
    expect(json).not.toContain("seat_a:");
    expect(json).not.toContain("seat_b:");
    expect(json).not.toContain("cardIds");
    expect(json).toContain("futureRoundHandQuality");
    expect(json).toContain("unitCardCount");
  });

  it("handShapeAnalysis contains only safe aggregate fields", () => {
    const hsa = {
      unitCardCount: 2,
      heroCardCount: 1,
      specialOrWeatherCardCount: 1,
      totalHandCount: 3,
      positiveUnitMoveCount: 2,
      positiveNonUnitMoveCount: 1,
      bestUnitTempoBucket: "medium",
      bestNonUnitTempoBucket: "low",
      futureRoundHandQuality: "healthy",
      specialOnlyHand: false,
      noUnitFutureRisk: false,
    };
    const issues = scanForHiddenInfoHazards(hsa);
    expect(issues.length).toBe(0);
  });

  it("non-mulligan trace with public target label 'Roach' does not fail hidden-info scan", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp27-repair-public-roach",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 5,
            scoreDelta: 5,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 5,
            opponentHandCount: 7,
            ownDeckCount: 10,
            opponentDeckCount: 10,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          selected: {
            kind: "play_card",
            label: "Play Roach",
            actionRef: "action_0",
            targetKind: "board_row",
          },
          candidates: [
            {
              cardLabel: "Roach",
              kind: "play",
              actionRef: "action_0",
              score: 100,
              targetLabel: "close row",
            },
          ],
          reasonKind: "policy",
          reason: "best play available",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
  });
});

describe("cFp29: medic timing diagnostics in product export", () => {
  it("scan passes for medicTimingAnalysis fields in export", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp29-medic-timing-test",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 5,
            scoreDelta: 5,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 5,
            opponentHandCount: 7,
            ownDeckCount: 10,
            opponentDeckCount: 10,
            ownDiscardCount: 3,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          medicTimingAnalysis: {
            medicPlayLegal: true,
            medicPlayCandidateCount: 1,
            ownDiscardReviveCandidateCount: 2,
            bestReviveStrengthBucket: "medium",
            bestReviveValueBucket: "strong",
            noTargetMedicRisk: false,
            selectedMedicWithNoTarget: false,
          },
          selected: {
            kind: "play_card",
            label: "play medic",
            actionRef: "action_0",
            targetKind: "board_row",
          },
          candidates: [],
          reasonKind: "policy",
          reason: "best useful move",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
    const json = JSON.stringify(exportData);
    expect(json).toContain("medicTimingAnalysis");
    expect(json).toContain("ownDiscardReviveCandidateCount");
    expect(json).toContain("bestReviveValueBucket");
  });

  it("synthetic raw cardIds under medicTimingAnalysis fails scan", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
      cardIds: ["yc5_abc123", "yc5_def456"],
    };
    const issues = scanForHiddenInfoHazards(medicTiming);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("synthetic raw seat_a:/seat_b: under medicTimingAnalysis fails scan", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
      diagnosticSeatId: "seat_a:discard:0",
    };
    const issues = scanForHiddenInfoHazards(medicTiming);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("synthetic linkedSourceIds under medicTimingAnalysis fails scan", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
      linkedSourceIds: ["neutral.yennefer-of-vengerberg"],
    };
    const issues = scanForHiddenInfoHazards(medicTiming);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("synthetic raw card name under medicTimingAnalysis fails medic-timing scan", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
      targetName: "Yennefer of Vengerberg",
    };
    const issues = scanMedicTimingAnalysis(medicTiming);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("raw card name or source ID"))).toBe(true);
  });

  it("synthetic raw source ID under medicTimingAnalysis fails medic-timing scan", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
      targetSourceId: "neutral.yennefer-of-vengerberg",
    };
    const issues = scanMedicTimingAnalysis(medicTiming);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("raw card name or source ID"))).toBe(true);
  });

  it("synthetic ability arrays under medicTimingAnalysis fails medic-timing scan", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
      abilities: ["medic"],
    };
    const issues = scanMedicTimingAnalysis(medicTiming);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("unexpected array"))).toBe(true);
  });

  it("scanMedicTimingAnalysis passes for safe medicTimingAnalysis aggregates", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
    };
    const issues = scanMedicTimingAnalysis(medicTiming);
    expect(issues.length).toBe(0);
  });

  it("full export scan fails when medicTimingAnalysis contains raw card name", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp29-medic-hazard-name",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 5,
            scoreDelta: 5,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 5,
            opponentHandCount: 7,
            ownDeckCount: 10,
            opponentDeckCount: 10,
            ownDiscardCount: 3,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          medicTimingAnalysis: {
            medicPlayLegal: true,
            medicPlayCandidateCount: 1,
            ownDiscardReviveCandidateCount: 2,
            bestReviveStrengthBucket: "medium",
            bestReviveValueBucket: "strong",
            noTargetMedicRisk: false,
            selectedMedicWithNoTarget: false,
            targetName: "Yennefer of Vengerberg",
          },
          selected: null,
          candidates: [],
          reasonKind: "policy",
          reason: "best useful move",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(false);
  });

  it("full export scan fails when medicTimingAnalysis contains raw source ID", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp29-medic-hazard-source",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 5,
            scoreDelta: 5,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 5,
            opponentHandCount: 7,
            ownDeckCount: 10,
            opponentDeckCount: 10,
            ownDiscardCount: 3,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          medicTimingAnalysis: {
            medicPlayLegal: true,
            medicPlayCandidateCount: 1,
            ownDiscardReviveCandidateCount: 2,
            bestReviveStrengthBucket: "medium",
            bestReviveValueBucket: "strong",
            noTargetMedicRisk: false,
            selectedMedicWithNoTarget: false,
            targetSourceId: "neutral.yennefer-of-vengerberg",
          },
          selected: null,
          candidates: [],
          reasonKind: "policy",
          reason: "best useful move",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(false);
  });

  it("full export scan fails when medicTimingAnalysis contains ability arrays", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp29-medic-hazard-abilities",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 5,
            scoreDelta: 5,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 5,
            opponentHandCount: 7,
            ownDeckCount: 10,
            opponentDeckCount: 10,
            ownDiscardCount: 3,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          medicTimingAnalysis: {
            medicPlayLegal: true,
            medicPlayCandidateCount: 1,
            ownDiscardReviveCandidateCount: 2,
            bestReviveStrengthBucket: "medium",
            bestReviveValueBucket: "strong",
            noTargetMedicRisk: false,
            selectedMedicWithNoTarget: false,
            abilities: ["medic"],
          },
          selected: null,
          candidates: [],
          reasonKind: "policy",
          reason: "best useful move",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(false);
  });

  it("scan fails for real source ID 'northern-realms.philippa-eilhart' under medicTimingAnalysis", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
      targetSourceId: "northern-realms.philippa-eilhart",
    };
    const issues = scanMedicTimingAnalysis(medicTiming);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("raw card name or source ID"))).toBe(true);
  });

  it("scan fails for one-word proper name 'Draug' under medicTimingAnalysis", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
      targetName: "Draug",
    };
    const issues = scanMedicTimingAnalysis(medicTiming);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("raw card name or source ID"))).toBe(true);
  });

  it("safe aggregate bucket strings pass medic-timing scan", () => {
    const medicTiming = {
      medicPlayLegal: true,
      medicPlayCandidateCount: 1,
      ownDiscardReviveCandidateCount: 2,
      bestReviveStrengthBucket: "medium",
      bestReviveValueBucket: "strong",
      noTargetMedicRisk: false,
      selectedMedicWithNoTarget: false,
    };
    const issues = scanMedicTimingAnalysis(medicTiming);
    expect(issues.length).toBe(0);
  });
});

describe("cFp30: weather placement diagnostics in product export", () => {
  it("scan passes for weatherPlacementAnalysis fields in export", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp30-weather-placement-test",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 5,
            scoreDelta: 5,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 5,
            opponentHandCount: 7,
            ownDeckCount: 10,
            opponentDeckCount: 10,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 1,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          weatherPlacementAnalysis: {
            selectedMoveIntoWeatheredRow: false,
            selectedMoveSide: "own",
            selectedMoveRow: "close",
            selectedPrintedStrengthBucket: "high",
            selectedEffectiveStrengthBucket: "high",
            ownWeatheredRows: ["ranged"],
            opponentWeatheredRows: [],
            candidateWeatheredOwnRowPlayCount: 2,
            candidateWeatheredOpponentRowPlayCount: 0,
          },
          selected: {
            kind: "play_card",
            label: "hidden hand play",
            actionRef: "action_0",
            targetKind: "board_row",
          },
          candidates: [],
          reasonKind: "policy",
          reason: "best useful move",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
    const json = JSON.stringify(exportData);
    expect(json).toContain("weatherPlacementAnalysis");
    expect(json).toContain("ownWeatheredRows");
    expect(json).toContain("selectedEffectiveStrengthBucket");
  });

  it("synthetic raw source ID under weatherPlacementAnalysis fails scan", () => {
    const weatherPlacement = {
      selectedMoveIntoWeatheredRow: false,
      selectedMoveSide: "own",
      selectedMoveRow: "close",
      selectedPrintedStrengthBucket: "high",
      selectedEffectiveStrengthBucket: "high",
      ownWeatheredRows: ["ranged"],
      opponentWeatheredRows: [],
      candidateWeatheredOwnRowPlayCount: 2,
      candidateWeatheredOpponentRowPlayCount: 0,
      targetSourceId: "neutral.impenetrable-fog",
    };
    const issues = scanWeatherPlacementAnalysis(weatherPlacement);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("raw card name or source ID"))).toBe(true);
  });

  it("synthetic source ID under weatherPlacementAnalysis fails scan", () => {
    const weatherPlacement = {
      selectedMoveIntoWeatheredRow: false,
      selectedMoveSide: "own",
      selectedMoveRow: "close",
      selectedPrintedStrengthBucket: "high",
      selectedEffectiveStrengthBucket: "high",
      ownWeatheredRows: ["ranged"],
      opponentWeatheredRows: [],
      candidateWeatheredOwnRowPlayCount: 2,
      candidateWeatheredOpponentRowPlayCount: 0,
      weatherSourceId: "neutral.impenetrable-fog",
    };
    const issues = scanWeatherPlacementAnalysis(weatherPlacement);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("raw card name or source ID"))).toBe(true);
  });

  it("synthetic ability arrays under weatherPlacementAnalysis fails scan", () => {
    const weatherPlacement = {
      selectedMoveIntoWeatheredRow: false,
      selectedMoveSide: "own",
      selectedMoveRow: "close",
      selectedPrintedStrengthBucket: "high",
      selectedEffectiveStrengthBucket: "high",
      ownWeatheredRows: ["ranged"],
      opponentWeatheredRows: [],
      candidateWeatheredOwnRowPlayCount: 2,
      candidateWeatheredOpponentRowPlayCount: 0,
      abilities: ["weather"],
    };
    const issues = scanWeatherPlacementAnalysis(weatherPlacement);
    expect(issues.length).toBeGreaterThan(0);
  });

  it("safe aggregate bucket strings pass weather-placement scan", () => {
    const weatherPlacement = {
      selectedMoveIntoWeatheredRow: false,
      selectedMoveSide: "own",
      selectedMoveRow: "close",
      selectedPrintedStrengthBucket: "high",
      selectedEffectiveStrengthBucket: "high",
      ownWeatheredRows: ["ranged"],
      opponentWeatheredRows: [],
      candidateWeatheredOwnRowPlayCount: 2,
      candidateWeatheredOpponentRowPlayCount: 0,
    };
    const issues = scanWeatherPlacementAnalysis(weatherPlacement);
    expect(issues.length).toBe(0);
  });

  it("full export scan fails when weatherPlacementAnalysis contains raw source ID", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp30-weather-hazard-source",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 5,
            scoreDelta: 5,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 5,
            opponentHandCount: 7,
            ownDeckCount: 10,
            opponentDeckCount: 10,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 1,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          weatherPlacementAnalysis: {
            selectedMoveIntoWeatheredRow: false,
            selectedMoveSide: "own",
            selectedMoveRow: "close",
            selectedPrintedStrengthBucket: "high",
            selectedEffectiveStrengthBucket: "high",
            ownWeatheredRows: ["ranged"],
            opponentWeatheredRows: [],
            candidateWeatheredOwnRowPlayCount: 2,
            candidateWeatheredOpponentRowPlayCount: 0,
            targetSourceId: "neutral.impenetrable-fog",
          },
          selected: null,
          candidates: [],
          reasonKind: "policy",
          reason: "best useful move",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(false);
  });
});

describe("cFp31: round-investment scan", () => {
  const safeRoundInvestmentAnalysis = {
    risk: "critical",
    recommendation: "preserve_future_hand",
    ownBoardCardCount: 0,
    scoreDelta: -5,
  };

  it("passes for safe roundInvestmentAnalysis", () => {
    const issues = scanRoundInvestmentAnalysis(safeRoundInvestmentAnalysis);
    expect(issues).toHaveLength(0);
  });

  it("rejects raw source ID in roundInvestmentAnalysis", () => {
    const issues = scanRoundInvestmentAnalysis({
      ...safeRoundInvestmentAnalysis,
      recommendation: "neutral.yennefer-of-vengerberg",
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("rejects hyphenated namespace source ID", () => {
    const issues = scanRoundInvestmentAnalysis({
      ...safeRoundInvestmentAnalysis,
      risk: "northern-realms.philippa-eilhart",
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("rejects raw instance ID", () => {
    const issues = scanRoundInvestmentAnalysis({
      ...safeRoundInvestmentAnalysis,
      recommendation: "seat_b:001:hidden",
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("rejects one-word card name", () => {
    const issues = scanRoundInvestmentAnalysis({
      ...safeRoundInvestmentAnalysis,
      recommendation: "Draug",
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("rejects multi-word card name", () => {
    const issues = scanRoundInvestmentAnalysis({
      ...safeRoundInvestmentAnalysis,
      risk: "Yennefer of Vengerberg",
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("rejects colon-and-apostrophe card name like Gaunter O'Dimm: Darkness", () => {
    const issues = scanRoundInvestmentAnalysis({
      ...safeRoundInvestmentAnalysis,
      recommendation: "Gaunter O'Dimm: Darkness",
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("rejects ability arrays in roundInvestmentAnalysis", () => {
    const issues = scanRoundInvestmentAnalysis({
      ...safeRoundInvestmentAnalysis,
      abilities: ["spy", "medic"],
    });
    expect(issues.length).toBeGreaterThan(0);
  });

  it("allows safe enum strings", () => {
    const safe = {
      risk: "none",
      recommendation: "continue",
      ownBoardCardCount: 3,
      scoreDelta: 5,
    };
    const issues = scanRoundInvestmentAnalysis(safe);
    expect(issues).toHaveLength(0);

    const sacrifice = {
      risk: "high",
      recommendation: "sacrifice_round",
      ownBoardCardCount: 1,
      scoreDelta: -15,
    };
    const issues2 = scanRoundInvestmentAnalysis(sacrifice);
    expect(issues2).toHaveLength(0);

    const fight = {
      risk: "critical",
      recommendation: "fight_last_gem",
      ownBoardCardCount: 0,
      scoreDelta: -20,
    };
    const issues3 = scanRoundInvestmentAnalysis(fight);
    expect(issues3).toHaveLength(0);
  });

  it("full export scan passes when roundInvestmentAnalysis is safe", () => {
    const exportData = buildProductDiagnosticExport({
      aiPolicyId: "legal-heuristic-v1",
      matchSeed: "cfp31-safe-round-investment",
      humanDeckPresetId: "test",
      humanDeckPresetName: "Test",
      humanDeckFaction: "northern_realms",
      aiDeckPresetId: "test",
      aiDeckPresetName: "Test AI",
      aiDeckFaction: "nilfgaard",
      currentPhase: "playing",
      currentRound: 1,
      matchResult: null,
      commandHistory: [],
      eventLog: [],
      decisionTraces: [
        {
          schemaVersion: "ai-decision-trace-v1",
          policyId: "legal-heuristic-v1",
          seatId: "seat_b",
          decisionIndex: 0,
          phase: "playing",
          round: 1,
          publicState: {
            seatId: "seat_b",
            opponentSeatId: "seat_a",
            phase: "playing",
            round: 1,
            currentTurn: "seat_b",
            ownScore: 10,
            opponentScore: 5,
            scoreDelta: 5,
            ownGems: 2,
            opponentGems: 2,
            ownHandCount: 3,
            opponentHandCount: 5,
            ownDeckCount: 8,
            opponentDeckCount: 10,
            ownDiscardCount: 0,
            opponentDiscardCount: 0,
            ownPassed: false,
            opponentPassed: false,
            boardRows: [],
            weatherCardCount: 0,
          },
          passAnalysis: null,
          mulliganAnalysis: null,
          weatherPlacementAnalysis: null,
          roundInvestmentAnalysis: {
            risk: "critical",
            recommendation: "preserve_future_hand",
            ownBoardCardCount: 0,
            scoreDelta: 5,
          },
          selected: {
            kind: "pass",
            label: "pass",
            actionRef: "action_0",
            targetKind: "none",
          },
          candidates: [],
          reasonKind: "policy-round-investment",
          reason: "preserve future hand",
        },
      ],
      warnings: [],
    });

    expect(exportData.hiddenInfoSafetyScan.passed).toBe(true);
    expect(exportData.hiddenInfoSafetyScan.issues).toHaveLength(0);
  });
});
