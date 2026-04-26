import { describe, expect, it } from "vitest";

import { buildSimulationExportDataset, currentSimulationSmokeSuite } from "@/game/sim";

describe("simulation export dataset", () => {
  it("builds deterministic safe rows for the current smoke suite", () => {
    const input = { batchInput: { suiteId: currentSimulationSmokeSuite.id } };
    const first = buildSimulationExportDataset(input);
    const second = buildSimulationExportDataset(input);

    expect(first.schemaVersion).toBe("sim-export-v1");
    expect(first.generatedBy).toBe("headless-simulation-export");
    expect(first.suiteId).toBe(currentSimulationSmokeSuite.id);
    expect(first.seeds).toEqual(currentSimulationSmokeSuite.seeds);
    expect(first.rowCount).toBeGreaterThan(0);
    expect(first.summary).toEqual(second.summary);
    expect(first.rows).toEqual(second.rows);
  });

  it("keeps each chosen action aligned with the encoded legal action list", () => {
    const dataset = buildSimulationExportDataset({ batchInput: { suiteId: currentSimulationSmokeSuite.id } });

    expect(dataset.rows.every((row) => row.legalActionCount > 0)).toBe(true);
    expect(dataset.rows.every((row) => row.chosenActionIndex >= 0)).toBe(true);
    dataset.rows.forEach((row) => {
      expect(row.legalActions).toHaveLength(row.legalActionCount);
      expect(row.legalActionMask).toEqual(row.legalActions.map(() => true));
      expect(row.legalActions[row.chosenActionIndex]).toEqual(row.chosenAction);
      expect(row.legalActions.map((action) => action.actionId)).toEqual(
        row.legalActions.map((_, index) => `action_${index}`),
      );
    });
  });

  it("excludes round-end system actions by default and can include them explicitly", () => {
    const defaultDataset = buildSimulationExportDataset({ batchInput: { seeds: ["sim-smoke-001"] } });
    const withSystem = buildSimulationExportDataset({
      batchInput: { seeds: ["sim-smoke-001"] },
      includeSystemActions: true,
    });

    expect(defaultDataset.rows.some((row) => row.chosenAction.kind === "resolve_round_end")).toBe(false);
    expect(defaultDataset.summary.systemRowCount).toBe(0);
    expect(withSystem.rows.some((row) => row.chosenAction.kind === "resolve_round_end")).toBe(true);
    expect(withSystem.summary.systemRowCount).toBeGreaterThan(0);
  });

  it("redacts raw engine state, command logs, instance ids, and hidden opponent zones", () => {
    const dataset = buildSimulationExportDataset({ batchInput: { seeds: ["sim-smoke-001"] } });
    const json = JSON.stringify(dataset);

    expect(json).not.toContain("finalState");
    expect(json).not.toContain("commandLog");
    expect(json).not.toContain("cardsById");
    expect(json).not.toContain("\"instanceId\"");
    expect(json).not.toMatch(/seat_[ab]:/);
    expect(json).not.toContain("ownHand");
    expect(json).not.toContain("opponentHand");
    expect(json).not.toContain("\"hand\"");
    expect(json).not.toContain("\"deck\":[");

    const rowWithOwnCards = dataset.rows.find((row) => row.observation.own.cardsInHand.length > 0);
    expect(rowWithOwnCards?.observation.own.cardsInHand[0].sourceId).toEqual(expect.any(String));
    expect(rowWithOwnCards?.observation.opponent.cardCountInHand).toEqual(expect.any(Number));
    expect(rowWithOwnCards?.observation.opponent).not.toHaveProperty("cardsInHand");
  });

  it("exports expected policy action kinds without inventing illegal actions", () => {
    const dataset = buildSimulationExportDataset({ batchInput: { suiteId: currentSimulationSmokeSuite.id } });
    const kinds = new Set(dataset.rows.map((row) => row.chosenAction.kind));

    expect(kinds.has("choose_mulligan")).toBe(true);
    expect(kinds.has("play_card")).toBe(true);
    expect(kinds.has("pass")).toBe(true);
    expect(kinds.has("choose_prompt_option")).toBe(true);
    expect(kinds.has("resolve_round_end")).toBe(false);
    expect(dataset.summary.rowsByActionKind.choose_mulligan).toBeGreaterThan(0);
    expect(dataset.summary.rowsByActionKind.choose_prompt_option).toBeGreaterThan(0);
  });

  it("does not emit prompt target strength without a visible prompt target", () => {
    const dataset = buildSimulationExportDataset({ batchInput: { seeds: ["sim-smoke-001"] } });
    const promptOptions = dataset.rows.flatMap((row) => row.observation.pendingPrompt?.options ?? []);

    expect(promptOptions.length).toBeGreaterThan(0);
    expect(promptOptions.every((option) => option.target || option.targetStrength === undefined)).toBe(true);
  });

  it("assigns sparse terminal rewards relative to the acting seat only on completed match terminal rows", () => {
    const dataset = buildSimulationExportDataset({ batchInput: { seeds: ["sim-smoke-001"] } });
    const rewardedRows = dataset.rows.filter((row) => row.reward.isTerminalMatchRow);

    expect(rewardedRows).toHaveLength(1);
    const terminalRow = rewardedRows[0];
    const expectedReward =
      terminalRow.outcome.winner === "draw" ? 0 : terminalRow.outcome.winner === terminalRow.seatId ? 1 : -1;

    expect(terminalRow.reward.terminalMatchReward).toBe(expectedReward);
    expect(dataset.rows.filter((row) => !row.reward.isTerminalMatchRow).every((row) => row.reward.terminalMatchReward === null))
      .toBe(true);
  });

  it("keeps non-completed bounded runs diagnostic-only for terminal rewards", () => {
    const dataset = buildSimulationExportDataset({ batchInput: { seeds: ["short-export-001"], maxSteps: 1 } });

    expect(dataset.summary.completedMatchCount).toBe(0);
    expect(dataset.rows.every((row) => row.reward.terminalMatchReward === null)).toBe(true);
    expect(dataset.rows.every((row) => row.reward.isTerminalMatchRow === false)).toBe(true);
    expect(dataset.summary.diagnosticCounts.legalMoveMatchFailures).toBe(0);
  });
});
