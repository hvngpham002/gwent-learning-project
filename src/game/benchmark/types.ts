import type { EnginePolicy } from '@/game/ai';
import type { CatalogDeckPreset, CatalogFaction } from '@/game/catalog';
import type { SeatId } from '@/game/core';
import type { HeadlessMatchSimulationResult, SimulationTerminalStatus } from '@/game/sim';

export type BenchmarkMatchRecordSchemaVersion = 'benchmark-match-v1';
export type BenchmarkSummarySchemaVersion = 'benchmark-summary-v1';
export type BenchmarkDeckCategory = 'smoke' | 'starter' | 'mechanics' | 'competitive';
export type BenchmarkSeatResult = 'win' | 'loss' | 'draw' | 'none';
export type BenchmarkReplayStatus = 'passed' | 'failed' | 'skipped';

export interface BenchmarkDeckDescriptor {
  deckPresetId: string;
  label: string;
  faction: Exclude<CatalogFaction, 'neutral'>;
  category: BenchmarkDeckCategory;
  deckPreset: CatalogDeckPreset;
  notes?: string;
}

export interface BenchmarkSeatDescriptor {
  seatId: SeatId;
  policyId: string;
  playerId: string;
  faction: Exclude<CatalogFaction, 'neutral'>;
  deckPresetId: string;
}

export interface BenchmarkMatchRecord {
  schemaVersion: BenchmarkMatchRecordSchemaVersion;
  benchmarkRunId: string;
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorGroupId?: string;
  mirrorIndex?: 0 | 1;
  seats: Record<SeatId, BenchmarkSeatDescriptor>;
  status: SimulationTerminalStatus;
  winner: SeatId | 'draw' | null;
  resultBySeat: Record<SeatId, BenchmarkSeatResult>;
  roundWinsBySeat: Record<SeatId, number>;
  roundDraws: number;
  finalGems: Record<SeatId, number>;
  stepCount: number;
  commandCount: number;
  eventCount: number;
  averageLegalMoves: number;
  passCount: number;
  promptsResolved: number;
  leaderUses: number;
  replayStatus: BenchmarkReplayStatus;
  errorCode?: string;
  errorMessage?: string;
  stableFingerprint: string;
}

export interface BenchmarkMatchupSeatDefinition {
  policyId: string;
  playerId?: string;
  faction: Exclude<CatalogFaction, 'neutral'>;
  deckPreset: CatalogDeckPreset;
}

export interface BenchmarkMatchupDefinition {
  matchupId: string;
  label: string;
  seats: Record<SeatId, BenchmarkMatchupSeatDefinition>;
  mirror?: boolean;
}

export interface BenchmarkSuite {
  id: string;
  label: string;
  description: string;
  seeds: readonly (string | number)[];
  defaultMaxSteps?: number;
  deckDescriptors?: readonly BenchmarkDeckDescriptor[];
  matchups: readonly BenchmarkMatchupDefinition[];
}

export interface BenchmarkSuiteMetadata {
  suiteId: string;
  label: string;
  description: string;
  seedCount: number;
  matchupIds: string[];
}

export interface BenchmarkRunInput {
  suiteId?: string;
  suite?: BenchmarkSuite;
  benchmarkRunId?: string;
  maxSteps?: number;
  includeDebugResults?: boolean;
  policies?: BenchmarkPolicyRegistry;
}

export type BenchmarkPolicyRegistry = Record<string, EnginePolicy>;

export interface BenchmarkRunDiagnostic {
  suiteId: string;
  matchupId: string;
  seed: string | number;
  mirrorIndex?: 0 | 1;
  code: string;
  message: string;
}

export interface BenchmarkOutcomeCounts {
  wins: number;
  losses: number;
  draws: number;
  none: number;
}

export interface BenchmarkMatchupSummary {
  matchupId: string;
  totalMatches: number;
  statusCounts: Record<SimulationTerminalStatus, number>;
  resultCountsByPolicy: Record<string, BenchmarkOutcomeCounts>;
  resultCountsByDeck: Record<string, BenchmarkOutcomeCounts>;
  averageSteps: number;
  averageCommands: number;
  averageLegalMoves: number;
  promptCount: number;
  leaderUseCount: number;
}

export interface BenchmarkSummary {
  schemaVersion: BenchmarkSummarySchemaVersion;
  benchmarkRunId: string;
  suiteId: string;
  totalMatches: number;
  statusCounts: Record<SimulationTerminalStatus, number>;
  completionRate: number;
  maxStepRate: number;
  errorCodeCounts: Record<string, number>;
  replayCheckedCount: number;
  replayFailedCount: number;
  policyIds: string[];
  deckPresetIds: string[];
  resultCountsByPolicy: Record<string, BenchmarkOutcomeCounts>;
  resultCountsByDeck: Record<string, BenchmarkOutcomeCounts>;
  matchupSummaries: BenchmarkMatchupSummary[];
  averageSteps: number;
  averageCommands: number;
  averageLegalMoves: number;
  promptCount: number;
  leaderUseCount: number;
}

export interface BenchmarkRunResult {
  suite: BenchmarkSuiteMetadata;
  records: BenchmarkMatchRecord[];
  summary: BenchmarkSummary;
  diagnostics: BenchmarkRunDiagnostic[];
  unsafeDebugResults?: HeadlessMatchSimulationResult[];
}
