import { currentSimulationSmokeSuite } from '@/game/sim';

import { benchmarkSmokeDeckDescriptors, benchmarkStarterDeckDescriptors } from './decks';
import type { BenchmarkDeckDescriptor, BenchmarkMatchupDefinition, BenchmarkSuite } from './types';

const STARTER_MATRIX_SEEDS = [
  'starter-matrix-001',
  'starter-matrix-002',
  'starter-matrix-003',
] as const;

const factionSlug = (descriptor: BenchmarkDeckDescriptor) => descriptor.faction.replace(/_/g, '-');

const seatForDescriptor = (
  descriptor: BenchmarkDeckDescriptor,
  policyId: 'legal-heuristic-v0' | 'legal-first-v0'
) => ({
  policyId,
  playerId: `benchmark-${policyId}`,
  faction: descriptor.faction,
  deckPreset: descriptor.deckPreset,
});

const buildStarterMatrixMatchups = (): BenchmarkMatchupDefinition[] => {
  const matchups: BenchmarkMatchupDefinition[] = [];

  benchmarkStarterDeckDescriptors.forEach((leftDescriptor, leftIndex) => {
    benchmarkStarterDeckDescriptors.slice(leftIndex + 1).forEach((rightDescriptor) => {
      matchups.push({
        matchupId: `starter-${factionSlug(leftDescriptor)}-heuristic-vs-${factionSlug(rightDescriptor)}-legal-first-v0`,
        label: `${leftDescriptor.label} piloted by heuristic vs ${rightDescriptor.label} piloted by deterministic legal-first baseline`,
        mirror: true,
        seats: {
          seat_a: seatForDescriptor(leftDescriptor, 'legal-heuristic-v0'),
          seat_b: seatForDescriptor(rightDescriptor, 'legal-first-v0'),
        },
      });
      matchups.push({
        matchupId: `starter-${factionSlug(leftDescriptor)}-legal-first-vs-${factionSlug(rightDescriptor)}-heuristic-v0`,
        label: `${leftDescriptor.label} piloted by deterministic legal-first baseline vs ${rightDescriptor.label} piloted by heuristic`,
        mirror: true,
        seats: {
          seat_a: seatForDescriptor(leftDescriptor, 'legal-first-v0'),
          seat_b: seatForDescriptor(rightDescriptor, 'legal-heuristic-v0'),
        },
      });
    });
  });

  return matchups;
};

export const benchmarkSmokeSuiteV1: BenchmarkSuite = {
  id: 'benchmark-smoke-v1',
  label: 'Benchmark smoke suite v1',
  description:
    'Small fixed-suite benchmark over the current Northern Realms and Nilfgaard presets with mirrored legal-heuristic-v0 versus legal-first-v0 runs.',
  seeds: currentSimulationSmokeSuite.seeds,
  defaultMaxSteps: currentSimulationSmokeSuite.defaultMaxSteps,
  deckDescriptors: benchmarkSmokeDeckDescriptors,
  matchups: [
    {
      matchupId: 'current-nr-ng-legal-heuristic-v0-vs-legal-first-v0',
      label:
        'Current Northern Realms vs Nilfgaard, heuristic against deterministic legal-first baseline',
      mirror: true,
      seats: {
        seat_a: {
          policyId: 'legal-heuristic-v0',
          playerId: 'benchmark-legal-heuristic-v0',
          faction: benchmarkSmokeDeckDescriptors[0].faction,
          deckPreset: benchmarkSmokeDeckDescriptors[0].deckPreset,
        },
        seat_b: {
          policyId: 'legal-first-v0',
          playerId: 'benchmark-legal-first-v0',
          faction: benchmarkSmokeDeckDescriptors[1].faction,
          deckPreset: benchmarkSmokeDeckDescriptors[1].deckPreset,
        },
      },
    },
  ],
};

export const benchmarkStarterMatrixSuiteV1: BenchmarkSuite = {
  id: 'benchmark-starter-matrix-v1',
  label: 'Benchmark starter matrix v1',
  description:
    'Broader fixed-suite benchmark over all five official starter presets. It is faction coverage, not optimized deck strength.',
  seeds: STARTER_MATRIX_SEEDS,
  defaultMaxSteps: currentSimulationSmokeSuite.defaultMaxSteps,
  deckDescriptors: benchmarkStarterDeckDescriptors,
  matchups: buildStarterMatrixMatchups(),
};

export const benchmarkSuites = {
  [benchmarkSmokeSuiteV1.id]: benchmarkSmokeSuiteV1,
  [benchmarkStarterMatrixSuiteV1.id]: benchmarkStarterMatrixSuiteV1,
} as const;

export const getBenchmarkSuite = (id: string): BenchmarkSuite | null =>
  Object.prototype.hasOwnProperty.call(benchmarkSuites, id)
    ? benchmarkSuites[id as keyof typeof benchmarkSuites]
    : null;
