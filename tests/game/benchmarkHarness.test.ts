import { describe, expect, it } from 'vitest';

import {
  currentNilfgaardDeckPreset,
  currentNorthernRealmsDeckPreset,
  officialMonstersStarterDeckPreset,
  officialNilfgaardStarterDeckPreset,
  officialNorthernRealmsStarterDeckPreset,
  officialScoiataelStarterDeckPreset,
  officialSkelligeStarterDeckPreset,
} from '@/data/catalog';
import type { EnginePolicy } from '@/game/ai';
import {
  benchmarkStarterMatrixSuiteV1,
  benchmarkSmokeSuiteV1,
  getBenchmarkSuite,
  getBenchmarkDeckDescriptorsByCategory,
  legalFirstPolicyV0,
  runBenchmarkSuite,
  type BenchmarkSuite,
} from '@/game/benchmark';
import { runHeadlessMatchSimulation } from '@/game/sim';

const officialStarterPresetIds = [
  officialMonstersStarterDeckPreset.presetId,
  officialNilfgaardStarterDeckPreset.presetId,
  officialNorthernRealmsStarterDeckPreset.presetId,
  officialScoiataelStarterDeckPreset.presetId,
  officialSkelligeStarterDeckPreset.presetId,
].sort((left, right) => left.localeCompare(right));

describe('benchmark harness', () => {
  it('resolves the built-in smoke benchmark suite by id', () => {
    expect(getBenchmarkSuite(benchmarkSmokeSuiteV1.id)).toBe(benchmarkSmokeSuiteV1);
    expect(getBenchmarkSuite('missing-benchmark-suite')).toBeNull();
  });

  it('resolves the starter matrix suite and exposes its starter deck descriptors', () => {
    const suite = getBenchmarkSuite('benchmark-starter-matrix-v1');
    const suiteStarterDecks =
      suite?.deckDescriptors?.filter((descriptor) => descriptor.category === 'starter') ?? [];

    expect(suite).toBe(benchmarkStarterMatrixSuiteV1);
    expect(suiteStarterDecks.map((descriptor) => descriptor.deckPresetId).sort()).toEqual(
      officialStarterPresetIds
    );
    expect(
      getBenchmarkDeckDescriptorsByCategory('starter')
        .map((descriptor) => descriptor.deckPresetId)
        .sort()
    ).toEqual(officialStarterPresetIds);
    expect(getBenchmarkDeckDescriptorsByCategory('mechanics')).toEqual([]);
    expect(getBenchmarkDeckDescriptorsByCategory('competitive')).toEqual([]);
  });

  it('returns default smoke-suite records and deterministic summaries', () => {
    const result = runBenchmarkSuite();

    expect(result.suite.suiteId).toBe('benchmark-smoke-v1');
    expect(result.records).toHaveLength(benchmarkSmokeSuiteV1.seeds.length * 2);
    expect(result.summary.schemaVersion).toBe('benchmark-summary-v1');
    expect(result.summary.totalMatches).toBe(result.records.length);
    expect(result.summary.statusCounts.completed).toBeGreaterThan(0);
    expect(result.summary.policyIds).toEqual(['legal-first-v0', 'legal-heuristic-v0']);
    expect(result.summary.deckPresetIds).toEqual(['current-nilfgaard', 'current-northern-realms']);
    expect(result.summary.matchupSummaries).toHaveLength(1);
    expect(result.summary.replayFailedCount).toBe(0);
    expect(result.unsafeDebugResults).toBeUndefined();
  });

  it('is stable across repeated benchmark runs', () => {
    const first = runBenchmarkSuite();
    const second = runBenchmarkSuite();

    expect(second.records).toEqual(first.records);
    expect(second.summary).toEqual(first.summary);
  });

  it('creates mirrored records with swapped seat descriptors', () => {
    const result = runBenchmarkSuite({ suiteId: benchmarkSmokeSuiteV1.id });
    const seed = benchmarkSmokeSuiteV1.seeds[0];
    const pair = result.records
      .filter((record) => record.seed === seed)
      .sort((left, right) => left.mirrorIndex! - right.mirrorIndex!);

    expect(pair).toHaveLength(2);
    expect(pair[0].mirrorGroupId).toBe(pair[1].mirrorGroupId);
    expect(pair[0].mirrorIndex).toBe(0);
    expect(pair[1].mirrorIndex).toBe(1);
    expect(pair[0].seats.seat_a.policyId).toBe('legal-heuristic-v0');
    expect(pair[0].seats.seat_b.policyId).toBe('legal-first-v0');
    expect(pair[1].seats.seat_a.policyId).toBe('legal-first-v0');
    expect(pair[1].seats.seat_b.policyId).toBe('legal-heuristic-v0');
    expect(pair[1].seats.seat_a.deckPresetId).toBe(pair[0].seats.seat_b.deckPresetId);
    expect(pair[1].seats.seat_b.deckPresetId).toBe(pair[0].seats.seat_a.deckPresetId);
  });

  it('runs the official starter matrix with both policy assignments over three seeds', () => {
    const suite = getBenchmarkSuite(benchmarkStarterMatrixSuiteV1.id);

    expect(suite).toBe(benchmarkStarterMatrixSuiteV1);
    expect(benchmarkStarterMatrixSuiteV1.seeds).toHaveLength(3);
    expect(benchmarkStarterMatrixSuiteV1.matchups).toHaveLength(20);
    expect(
      new Set(benchmarkStarterMatrixSuiteV1.matchups.map((matchup) => matchup.matchupId)).size
    ).toBe(20);
    expect(benchmarkStarterMatrixSuiteV1.matchups.every((matchup) => matchup.mirror === true)).toBe(
      true
    );

    const result = runBenchmarkSuite({ suiteId: benchmarkStarterMatrixSuiteV1.id });

    expect(result.records).toHaveLength(120);
    expect(result.summary.totalMatches).toBe(120);
    expect(result.summary.deckPresetIds).toEqual(officialStarterPresetIds);
    expect(result.summary.policyIds).toEqual(['legal-first-v0', 'legal-heuristic-v0']);
    expect(result.summary.matchupSummaries).toHaveLength(20);
    expect(result.summary.replayFailedCount).toBe(0);
  }, 60_000);

  it('records policy failures per match and continues the suite', () => {
    const throwingPolicy: EnginePolicy = {
      id: 'throwing-benchmark-policy',
      selectMove() {
        throw new Error('benchmark policy exploded');
      },
    };
    const suite: BenchmarkSuite = {
      id: 'policy-failure-suite',
      label: 'Policy failure suite',
      description: 'Exercises benchmark policy failure ledger rows.',
      seeds: ['policy-fail-benchmark-001', 'policy-fail-benchmark-002'],
      defaultMaxSteps: 300,
      matchups: [
        {
          matchupId: 'throwing-vs-legal-first',
          label: 'Throwing policy versus legal-first baseline',
          seats: {
            seat_a: {
              policyId: throwingPolicy.id,
              faction: currentNorthernRealmsDeckPreset.faction,
              deckPreset: currentNorthernRealmsDeckPreset,
            },
            seat_b: {
              policyId: legalFirstPolicyV0.id,
              faction: currentNilfgaardDeckPreset.faction,
              deckPreset: currentNilfgaardDeckPreset,
            },
          },
        },
      ],
    };

    const result = runBenchmarkSuite({
      suite,
      policies: {
        [throwingPolicy.id]: throwingPolicy,
      },
    });

    expect(result.records).toHaveLength(2);
    expect(result.summary.statusCounts.policy_failed).toBe(2);
    expect(result.summary.errorCodeCounts.policy_select_failed).toBe(2);
    expect(result.records.map((record) => record.errorMessage)).toEqual([
      'benchmark policy exploded',
      'benchmark policy exploded',
    ]);
  });

  it('passes explicit catalog deck presets through the headless runner', () => {
    const result = runHeadlessMatchSimulation({
      seed: 'benchmark-official-decks-001',
      maxSteps: 1,
      seats: {
        seat_a: {
          seatId: 'seat_a',
          playerId: 'official-nr-seat',
          controllerKind: 'ai',
          faction: officialNorthernRealmsStarterDeckPreset.faction,
          deckPreset: officialNorthernRealmsStarterDeckPreset,
        },
        seat_b: {
          seatId: 'seat_b',
          playerId: 'official-ng-seat',
          controllerKind: 'ai',
          faction: officialNilfgaardStarterDeckPreset.faction,
          deckPreset: officialNilfgaardStarterDeckPreset,
        },
      },
    });

    expect(result.finalState.seats.seat_a.faction).toBe(
      officialNorthernRealmsStarterDeckPreset.faction
    );
    expect(result.finalState.seats.seat_b.faction).toBe(officialNilfgaardStarterDeckPreset.faction);
    expect(result.finalState.catalog.deckPresetIds).toEqual([
      officialNorthernRealmsStarterDeckPreset.presetId,
      officialNilfgaardStarterDeckPreset.presetId,
    ]);
  });

  it('keeps default benchmark output hidden-info safe', () => {
    const result = runBenchmarkSuite();
    const json = JSON.stringify(result);

    expect(json).not.toContain('cardsById');
    expect(json).not.toContain('finalState');
    expect(json).not.toContain('commandLog');
    expect(json).not.toContain('"hand"');
    expect(json).not.toContain('"deck"');
    expect(json).not.toContain('ownHand');
    expect(json).not.toContain('opponentHand');
    expect(json).not.toContain('seat_a:');
    expect(json).not.toContain('seat_b:');
  });

  it('summarizes status, replay, averages, and results by policy and deck', () => {
    const result = runBenchmarkSuite();

    expect(result.summary.statusCounts).toEqual({
      completed: expect.any(Number),
      max_steps_exceeded: expect.any(Number),
      policy_failed: expect.any(Number),
      engine_error: expect.any(Number),
    });
    expect(result.summary.replayCheckedCount).toBe(result.records.length);
    expect(result.summary.averageSteps).toBeGreaterThan(0);
    expect(result.summary.averageCommands).toBeGreaterThan(0);
    expect(result.summary.averageLegalMoves).toBeGreaterThan(0);
    expect(result.summary.resultCountsByPolicy['legal-heuristic-v0']).toEqual(
      expect.objectContaining({
        wins: expect.any(Number),
        losses: expect.any(Number),
        draws: expect.any(Number),
      })
    );
    expect(result.summary.resultCountsByDeck['current-northern-realms']).toEqual(
      expect.objectContaining({
        wins: expect.any(Number),
        losses: expect.any(Number),
        draws: expect.any(Number),
      })
    );
  });
});
