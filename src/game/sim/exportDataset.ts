import { currentCatalogCards, currentCatalogLeaders } from "@/data/catalog";
import {
  executeCommand,
  getLegalMoves,
  startMatch,
  type LegalMove,
  type MatchState,
  type SeatId,
} from "@/game/core";

import { encodeLegalActions } from "./actionEncoding";
import { buildSafeSimulationObservation } from "./exportObservation";
import {
  SIMULATION_EXPORT_SCHEMA_VERSION,
  SIMULATION_REWARD_SCHEMA_VERSION,
  type SimulationDecisionRow,
  type SimulationExportDataset,
  type SimulationExportDatasetInput,
  type SimulationExportMatchDiagnostic,
  type SimulationExportSummary,
  type SimulationOutcomeSummary,
  type SimulationRewardPlaceholder,
} from "./exportTypes";
import { runHeadlessSimulationBatch } from "./batch";
import { createHeadlessSimulationConfig, getHeadlessActingSeat } from "./runHeadlessMatch";
import type {
  HeadlessMatchSimulationResult,
  HeadlessSimulationBatchInput,
  HeadlessSimulationBatchResult,
  SimulationCommand,
  SimulationTerminalStatus,
} from "./types";

const POLICY_ACTION_KINDS = new Set(["choose_mulligan", "play_card", "pass", "use_leader", "choose_prompt_option"]);

const emptyStatusCounts = (): Record<SimulationTerminalStatus, number> => ({
  completed: 0,
  max_steps_exceeded: 0,
  policy_failed: 0,
  engine_error: 0,
});

const sortedIds = (ids: readonly string[]) => [...ids].sort((a, b) => a.localeCompare(b));

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const commandsMatch = (move: LegalMove, command: SimulationCommand) => {
  switch (command.type) {
    case "ChooseMulligan":
      return (
        move.kind === "choose_mulligan" &&
        stableStringify(sortedIds(move.cardIds)) === stableStringify(sortedIds(command.cardIds))
      );
    case "PlayCard":
      return (
        move.kind === "play_card" &&
        move.sourceCardId === command.cardId &&
        stableStringify(move.target) === stableStringify(command.target ?? { kind: "none" })
      );
    case "Pass":
      return move.kind === "pass";
    case "UseLeader":
      return move.kind === "use_leader" && stableStringify(move.target) === stableStringify(command.target ?? { kind: "none" });
    case "ChoosePromptOption":
      return move.kind === "choose_prompt_option" && move.promptId === command.promptId && move.optionId === command.optionId;
    case "ResolveRoundEnd":
      return move.kind === "resolve_round_end";
  }
};

const actorKindForMove = (move: LegalMove): "policy" | "system" =>
  POLICY_ACTION_KINDS.has(move.kind) ? "policy" : "system";

const policyIdForRow = (result: HeadlessMatchSimulationResult, seatId: SeatId, actorKind: "policy" | "system") =>
  actorKind === "system" ? "headless-round-end-auto-resolver" : result.summary.policiesBySeat[seatId];

const buildOutcome = (result: HeadlessMatchSimulationResult): SimulationOutcomeSummary => ({
  status: result.status,
  winner: result.winner,
  finalGems: result.summary.finalGems,
});

const terminalRewardForSeat = (
  result: HeadlessMatchSimulationResult,
  seatId: SeatId,
  isTerminalMatchRow: boolean,
): SimulationRewardPlaceholder => {
  if (result.status !== "completed" || !isTerminalMatchRow) {
    return {
      schemaVersion: SIMULATION_REWARD_SCHEMA_VERSION,
      terminalMatchReward: null,
      isTerminalMatchRow: false,
      notes: result.status === "completed" ? [] : ["non_completed_match"],
    };
  }
  const reward = result.winner === "draw" ? 0 : result.winner === seatId ? 1 : -1;
  return {
    schemaVersion: SIMULATION_REWARD_SCHEMA_VERSION,
    terminalMatchReward: reward,
    isTerminalMatchRow: true,
    notes: ["terminal_match_outcome_only"],
  };
};

const getRawBatch = (
  input: SimulationExportDatasetInput,
): HeadlessSimulationBatchResult => {
  const provided = input.batch;
  if (provided?.runs.every((run) => run.rawResult)) {
    return provided;
  }

  const rerunInput: HeadlessSimulationBatchInput = {
    ...input.batchInput,
    includeRawResults: true,
  };

  if (provided && !input.batchInput?.suite && !input.batchInput?.suiteId && !input.batchInput?.seeds) {
    if (provided.suite) {
      rerunInput.suite = provided.suite;
    } else {
      rerunInput.seeds = provided.seeds;
    }
  }

  return runHeadlessSimulationBatch(rerunInput);
};

const commandSeatId = (state: MatchState, command: SimulationCommand): SeatId | null => {
  if ("seatId" in command && command.seatId) return command.seatId;
  return getHeadlessActingSeat(state);
};

const replayResultToRows = ({
  result,
  includeSystemActions,
}: {
  result: HeadlessMatchSimulationResult;
  includeSystemActions: boolean;
}): { rows: SimulationDecisionRow[]; diagnostic: SimulationExportMatchDiagnostic } => {
  let state = startMatch(createHeadlessSimulationConfig(result.seed)).state;
  const rows: SimulationDecisionRow[] = [];
  let skippedCommandCount = 0;
  let legalMoveMatchFailures = 0;
  const redactionWarnings: string[] = [];

  result.commandLog.forEach((command, commandIndex) => {
    const seatId = commandSeatId(state, command);
    if (!seatId) {
      skippedCommandCount += 1;
      legalMoveMatchFailures += 1;
      return;
    }

    const legalMoves = getLegalMoves({ state, seatId, catalogCards: currentCatalogCards, catalogLeaders: currentCatalogLeaders });
    const chosenActionIndex = legalMoves.findIndex((move) => commandsMatch(move, command));
    const chosenMove = chosenActionIndex >= 0 ? legalMoves[chosenActionIndex] : null;

    if (!chosenMove) {
      skippedCommandCount += 1;
      legalMoveMatchFailures += 1;
    } else {
      const actorKind = actorKindForMove(chosenMove);
      if (actorKind === "system" && !includeSystemActions) {
        skippedCommandCount += 1;
      } else {
        const legalActions = encodeLegalActions(state, seatId, legalMoves);
        const chosenAction = legalActions[chosenActionIndex];
        if (!chosenAction) {
          skippedCommandCount += 1;
          legalMoveMatchFailures += 1;
        } else {
          const step = commandIndex + 1;
          rows.push({
            schemaVersion: SIMULATION_EXPORT_SCHEMA_VERSION,
            rowId: `${result.matchId}:step:${step}:seat:${seatId}`,
            matchId: result.matchId,
            seed: result.seed,
            step,
            commandIndex,
            actorKind,
            seatId,
            policyId: policyIdForRow(result, seatId, actorKind),
            observation: buildSafeSimulationObservation(state, seatId),
            legalActions,
            legalActionCount: legalActions.length,
            legalActionMask: legalActions.map(() => true),
            chosenActionIndex,
            chosenAction,
            reward: terminalRewardForSeat(result, seatId, false),
            outcome: buildOutcome(result),
          });
        }
      }
    }

    const transaction = executeCommand({ state, command, catalogCards: currentCatalogCards, catalogLeaders: currentCatalogLeaders });
    state = transaction.state;
  });

  const lastPolicyRow = [...rows].reverse().find((row) => row.actorKind === "policy");
  if (lastPolicyRow && result.status === "completed") {
    lastPolicyRow.reward = terminalRewardForSeat(result, lastPolicyRow.seatId, true);
  }

  return {
    rows,
    diagnostic: {
      matchId: result.matchId,
      seed: result.seed,
      replay: null,
      rowCount: rows.length,
      skippedCommandCount,
      legalMoveMatchFailures,
      redactionWarnings,
    },
  };
};

const addCount = <Key extends string>(record: Record<Key, number>, key: Key, amount = 1) => {
  record[key] = (record[key] ?? 0) + amount;
};

const buildSummary = (
  rows: readonly SimulationDecisionRow[],
  diagnostics: readonly SimulationExportMatchDiagnostic[],
  rawResults: readonly HeadlessMatchSimulationResult[],
): SimulationExportSummary => {
  const rowsByActionKind: Record<string, number> = {};
  const rowsBySeat: Record<SeatId, number> = { seat_a: 0, seat_b: 0 };
  const rowsByPolicyId: Record<string, number> = {};
  const statusCounts = emptyStatusCounts();

  rows.forEach((row) => {
    addCount(rowsByActionKind, row.chosenAction.kind);
    rowsBySeat[row.seatId] += 1;
    addCount(rowsByPolicyId, row.policyId);
  });
  rawResults.forEach((result) => {
    statusCounts[result.status] += 1;
  });

  return {
    schemaVersion: SIMULATION_EXPORT_SCHEMA_VERSION,
    rowCount: rows.length,
    matchCount: rawResults.length,
    policyRowCount: rows.filter((row) => row.actorKind === "policy").length,
    systemRowCount: rows.filter((row) => row.actorKind === "system").length,
    rowsByActionKind,
    rowsBySeat,
    rowsByPolicyId,
    completedMatchCount: statusCounts.completed,
    skippedMatchCount: diagnostics.filter((diagnostic) => diagnostic.rowCount === 0).length,
    diagnosticCounts: {
      matchesWithReplayFailures: diagnostics.filter((diagnostic) => diagnostic.replay?.status === "failed").length,
      skippedCommands: diagnostics.reduce((total, diagnostic) => total + diagnostic.skippedCommandCount, 0),
      legalMoveMatchFailures: diagnostics.reduce((total, diagnostic) => total + diagnostic.legalMoveMatchFailures, 0),
      redactionWarnings: diagnostics.reduce((total, diagnostic) => total + diagnostic.redactionWarnings.length, 0),
    },
    matchDiagnostics: [...diagnostics],
  };
};

export const buildSimulationExportDataset = (
  input: SimulationExportDatasetInput = {},
): SimulationExportDataset => {
  const includeSystemActions = input.includeSystemActions ?? false;
  const batch = getRawBatch(input);
  const rawResults = batch.runs.flatMap((run) => (run.rawResult ? [run.rawResult] : []));
  const replayed = rawResults.map((result) => replayResultToRows({ result, includeSystemActions }));
  const diagnostics = replayed.map(({ diagnostic }, index) => ({
    ...diagnostic,
    replay: batch.runs[index]?.replay ?? null,
  }));
  const rows = replayed.flatMap(({ rows }) => rows);
  const summary = buildSummary(rows, diagnostics, rawResults);

  return {
    schemaVersion: SIMULATION_EXPORT_SCHEMA_VERSION,
    generatedBy: "headless-simulation-export",
    suiteId: batch.suite?.id ?? null,
    seeds: batch.seeds,
    policiesBySeat: batch.summary.policiesBySeat,
    rowCount: rows.length,
    matchCount: rawResults.length,
    summary,
    rows,
  };
};
