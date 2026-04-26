import type { EngineCommand, GameEvent, LegalMoveKind, MatchPhase, MatchState, SeatId } from "@/game/core";
import type { EnginePolicy } from "@/game/ai";

export type SimulationTerminalStatus = "completed" | "max_steps_exceeded" | "policy_failed" | "engine_error";

export type SimulationCommand = Exclude<EngineCommand, { type: "StartMatch" }>;

export interface HeadlessMatchSimulationInput {
  seed: string | number;
  maxSteps?: number;
  policies?: Partial<Record<SeatId, EnginePolicy>>;
}

export interface SimulationStepLog {
  step: number;
  phase: MatchPhase;
  round: number;
  seatId: SeatId;
  policyId: string;
  legalMoveCount: number;
  chosenMoveId: string;
  chosenMoveKind: LegalMoveKind;
  commandType: SimulationCommand["type"];
  eventTypes: GameEvent["type"][];
}

export interface SimulationSummary {
  status: SimulationTerminalStatus;
  winner: SeatId | "draw" | null;
  roundsPlayed: number;
  stepCount: number;
  commandCount: number;
  eventCount: number;
  policiesBySeat: Record<SeatId, string>;
  finalGems: Record<SeatId, number>;
  finalScores: Record<SeatId, number>;
  passCount: number;
  roundsResolved: number;
  averageLegalMoves: number;
  maxSteps: number;
  cardsPlayedBySeat: Record<SeatId, number>;
  promptsResolved: number;
  leaderUses: number;
  weatherCardsPlayed: number;
}

export interface SimulationError {
  code: string;
  message: string;
  step?: number;
  seatId?: SeatId;
}

export interface HeadlessMatchSimulationResult {
  status: SimulationTerminalStatus;
  seed: string | number;
  matchId: string;
  finalState: MatchState;
  winner: SeatId | "draw" | null;
  steps: SimulationStepLog[];
  commandLog: SimulationCommand[];
  events: GameEvent[];
  summary: SimulationSummary;
  error?: SimulationError;
}

export interface ReplayHeadlessMatchCommandsInput {
  seed: string | number;
  commandLog: readonly SimulationCommand[];
}

export interface SimulationSeedSuite {
  id: string;
  label: string;
  description: string;
  seeds: readonly (string | number)[];
  defaultMaxSteps?: number;
}

export interface SimulationReplayDiagnostics {
  checked: boolean;
  status: "passed" | "failed" | "skipped";
  commandCount: number;
  mismatches: string[];
  error?: string;
}

export interface SimulationRunFingerprints {
  commandTypes: string;
  eventTypes: string;
  summary: string;
}

export interface HeadlessSimulationBatchInput {
  suite?: SimulationSeedSuite;
  suiteId?: string;
  seeds?: readonly (string | number)[];
  maxSteps?: number;
  policies?: Partial<Record<SeatId, EnginePolicy>>;
  verifyReplay?: boolean;
  includeRawResults?: boolean;
}

export interface SimulationBatchRunRecord {
  seed: string | number;
  matchId: string;
  status: SimulationTerminalStatus;
  winner: SeatId | "draw" | null;
  stepCount: number;
  commandCount: number;
  eventCount: number;
  roundsResolved: number;
  promptsResolved: number;
  averageLegalMoves: number;
  finalGems: Record<SeatId, number>;
  error?: SimulationError;
  replay?: SimulationReplayDiagnostics;
  fingerprints: SimulationRunFingerprints;
  rawResult?: HeadlessMatchSimulationResult;
}

export interface SimulationBatchSummary {
  suiteId: string | null;
  totalRuns: number;
  statusCounts: Record<SimulationTerminalStatus, number>;
  winnerCounts: Record<SeatId | "draw" | "none", number>;
  completionRate: number;
  maxStepRate: number;
  replayCheckedCount: number;
  replayFailedCount: number;
  promptRunCount: number;
  promptResolutionCount: number;
  averageSteps: number;
  averageCommands: number;
  averageRoundsResolved: number;
  averageLegalMoves: number;
  policiesBySeat: Record<SeatId, string>;
  seedsByStatus: Record<SimulationTerminalStatus, (string | number)[]>;
  failureCodes: Record<string, number>;
}

export interface HeadlessSimulationBatchResult {
  suite: SimulationSeedSuite | null;
  seeds: readonly (string | number)[];
  runs: SimulationBatchRunRecord[];
  summary: SimulationBatchSummary;
}
