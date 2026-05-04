import type { CatalogAbilityId, CatalogCardKind, CatalogRow } from "@/game/catalog";
import type { LegalMoveKind, MatchPhase, SeatId } from "@/game/core";

import type { HeadlessSimulationBatchInput, HeadlessSimulationBatchResult, SimulationReplayDiagnostics } from "./types";

export const SIMULATION_EXPORT_SCHEMA_VERSION = "sim-export-v1";
export const SAFE_OBSERVATION_SCHEMA_VERSION = "safe-observation-v1";
export const LEGAL_ACTION_SCHEMA_VERSION = "legal-action-v1";
export const SIMULATION_REWARD_SCHEMA_VERSION = "reward-v1";
export const SIMULATION_EXPORT_JSONL_SCHEMA_VERSION = "sim-export-jsonl-v1";

export type SimulationActorKind = "policy" | "system";
export type RelativeSeatSide = "own" | "opponent";
export type SimulationExportValidationSeverity = "error" | "warning";

export interface SimulationExportDatasetInput {
  batch?: HeadlessSimulationBatchResult;
  batchInput?: HeadlessSimulationBatchInput;
  includeSystemActions?: boolean;
  includeDebugRaw?: false;
}

export interface SafeVisibleCardRef {
  cardRef: string;
  sourceId: string;
  name: string;
  kind: CatalogCardKind;
  printedStrength: number;
  rows: readonly CatalogRow[];
  abilities: readonly CatalogAbilityId[];
}

export interface SafeSeatPrivatePublicState {
  cardsInHand: SafeVisibleCardRef[];
  leader: {
    sourceId: string;
    used: boolean;
  };
  deckCount: number;
  discardCount: number;
  discard: SafeVisibleCardRef[];
  passed: boolean;
  gems: number;
}

export interface SafeOpponentPublicState {
  cardCountInHand: number;
  leader: {
    sourceId: string;
    used: boolean;
  };
  deckCount: number;
  discardCount: number;
  discard: SafeVisibleCardRef[];
  passed: boolean;
  gems: number;
}

export interface SafeBoardRowState {
  side: RelativeSeatSide;
  seatId: SeatId;
  row: CatalogRow;
  units: SafeVisibleCardRef[];
  horn: SafeVisibleCardRef | null;
}

export interface SafeBoardState {
  rows: SafeBoardRowState[];
}

export interface SafeScoreState {
  totalBySeat: Record<SeatId, number>;
  rowTotalsBySeat: Record<SeatId, Record<CatalogRow, number>>;
}

export interface SafePromptOption {
  optionRef: string;
  label: string;
  target?: SafeActionTargetRef;
  targetStrength?: number;
}

export interface SafePromptState {
  promptRef: string;
  kind: string;
  abilityId: string;
  source?: SafeVisibleCardRef;
  options: SafePromptOption[];
  // cCp28 hidden-info disclosure for `look_three_cards`. Each entry uses a
  // prompt-local own-deck-style safe ref (`revealed_opponent_hand_<index>`)
  // so raw opponent hand instance IDs never leak. Present only on the prompt
  // owner's perspective; non-acting perspectives have no pending prompt.
  revealedCards?: readonly SafeVisibleCardRef[];
}

export interface SafeSimulationObservation {
  schemaVersion: typeof SAFE_OBSERVATION_SCHEMA_VERSION;
  perspectiveSeatId: SeatId;
  opponentSeatId: SeatId;
  phase: MatchPhase;
  round: number;
  currentTurn: SeatId;
  own: SafeSeatPrivatePublicState;
  opponent: SafeOpponentPublicState;
  board: SafeBoardState;
  weather: SafeVisibleCardRef[];
  score: SafeScoreState;
  pendingPrompt: SafePromptState | null;
}

export interface SafeActionCardRef {
  cardRef: string;
  sourceId: string;
  kind: CatalogCardKind | "leader";
  abilities: readonly string[];
}

export type SafeActionTargetRef =
  | { kind: "board_row"; side: "own" | "opponent"; row: CatalogRow }
  | { kind: "row_horn"; side: "own"; row: CatalogRow }
  | { kind: "weather"; side: "public" }
  | { kind: "card"; side: "own" | "opponent" | "public"; row?: CatalogRow; card: SafeVisibleCardRef }
  | { kind: "deck_card_source"; side: "own"; sourceId: string }
  | { kind: "none"; side: "none" };

export interface SafeActionPromptRef {
  promptRef: string;
  optionRef: string;
  optionIndex: number;
}

export interface EncodedLegalAction {
  schemaVersion: typeof LEGAL_ACTION_SCHEMA_VERSION;
  actionIndex: number;
  actionId: string;
  kind: LegalMoveKind;
  label: string;
  source?: SafeActionCardRef;
  target?: SafeActionTargetRef;
  prompt?: SafeActionPromptRef;
  metadata: {
    cardKind?: string;
    abilities?: string[];
    row?: string;
    side?: "own" | "opponent" | "public" | "none";
    cardCount?: number;
    maxCards?: number;
  };
}

export interface SimulationRewardPlaceholder {
  schemaVersion: typeof SIMULATION_REWARD_SCHEMA_VERSION;
  terminalMatchReward: -1 | 0 | 1 | null;
  isTerminalMatchRow: boolean;
  notes: readonly string[];
}

export interface SimulationOutcomeSummary {
  status: string;
  winner: SeatId | "draw" | null;
  finalGems: Record<SeatId, number>;
}

export interface SimulationDecisionRow {
  schemaVersion: typeof SIMULATION_EXPORT_SCHEMA_VERSION;
  rowId: string;
  matchId: string;
  seed: string | number;
  step: number;
  commandIndex: number;
  actorKind: SimulationActorKind;
  seatId: SeatId;
  policyId: string;
  observation: SafeSimulationObservation;
  legalActions: EncodedLegalAction[];
  legalActionCount: number;
  legalActionMask: boolean[];
  chosenActionIndex: number;
  chosenAction: EncodedLegalAction;
  reward: SimulationRewardPlaceholder;
  outcome: SimulationOutcomeSummary;
}

export interface SimulationExportMatchDiagnostic {
  matchId: string;
  seed: string | number;
  replay: SimulationReplayDiagnostics | null;
  rowCount: number;
  skippedCommandCount: number;
  legalMoveMatchFailures: number;
  redactionWarnings: string[];
}

export interface SimulationExportSummary {
  schemaVersion: typeof SIMULATION_EXPORT_SCHEMA_VERSION;
  rowCount: number;
  matchCount: number;
  policyRowCount: number;
  systemRowCount: number;
  rowsByActionKind: Record<string, number>;
  rowsBySeat: Record<SeatId, number>;
  rowsByPolicyId: Record<string, number>;
  completedMatchCount: number;
  skippedMatchCount: number;
  diagnosticCounts: {
    matchesWithReplayFailures: number;
    skippedCommands: number;
    legalMoveMatchFailures: number;
    redactionWarnings: number;
  };
  matchDiagnostics: SimulationExportMatchDiagnostic[];
}

export interface SimulationExportDataset {
  schemaVersion: typeof SIMULATION_EXPORT_SCHEMA_VERSION;
  generatedBy: "headless-simulation-export";
  suiteId: string | null;
  seeds: readonly (string | number)[];
  policiesBySeat: Record<SeatId, string>;
  rowCount: number;
  matchCount: number;
  summary: SimulationExportSummary;
  rows: SimulationDecisionRow[];
}

export interface SimulationExportValidationIssue {
  severity: SimulationExportValidationSeverity;
  code: string;
  path: string;
  message: string;
}

export interface SimulationExportValidationSummary {
  errorCount: number;
  warningCount: number;
  rowCount: number;
  matchCount: number;
  systemRowCount: number;
}

export interface SimulationExportValidationResult {
  valid: boolean;
  issues: SimulationExportValidationIssue[];
  summary: SimulationExportValidationSummary;
}

export interface SimulationExportValidationOptions {
  allowSystemActions?: boolean;
  requireNoWarnings?: boolean;
}

export interface SimulationExportJsonlHeaderRecord {
  recordType: "dataset_header";
  jsonlSchemaVersion: typeof SIMULATION_EXPORT_JSONL_SCHEMA_VERSION;
  exportSchemaVersion: typeof SIMULATION_EXPORT_SCHEMA_VERSION;
  generatedBy: "headless-simulation-export";
  suiteId: string | null;
  seeds: readonly (string | number)[];
  policiesBySeat: Record<SeatId, string>;
  rowCount: number;
  matchCount: number;
  summary: SimulationExportSummary;
}

export interface SimulationExportJsonlDecisionRecord {
  recordType: "decision_row";
  jsonlSchemaVersion: typeof SIMULATION_EXPORT_JSONL_SCHEMA_VERSION;
  row: SimulationDecisionRow;
}

export type SimulationExportJsonlRecord = SimulationExportJsonlHeaderRecord | SimulationExportJsonlDecisionRecord;

export interface SerializeSimulationExportJsonlOptions {
  validate?: boolean;
  includeHeader?: boolean;
}

export interface ParseSimulationExportJsonlResult {
  header: SimulationExportJsonlHeaderRecord | null;
  rows: SimulationDecisionRow[];
  dataset: SimulationExportDataset | null;
  issues: SimulationExportValidationIssue[];
}
