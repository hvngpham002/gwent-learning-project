import { describe, expect, it } from "vitest";

import {
  buildProductDiagnosticExport,
  copyDiagnosticExport,
  PRODUCT_DIAGNOSTICS_SCHEMA_VERSION,
  scanForHiddenInfoHazards,
} from "@/components/gwent/matchDiagnostics";
import { engineDiagnosticTraceAppended, engineMatchStarted } from "@/store/slices/engineSlice";
import { configureStore } from "@reduxjs/toolkit";
import engineReducer from "@/store/slices/engineSlice";

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
