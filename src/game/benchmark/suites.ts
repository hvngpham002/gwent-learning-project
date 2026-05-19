import { currentSimulationSmokeSuite } from '@/game/sim';

import { benchmarkSmokeDeckDescriptors, benchmarkStarterDeckDescriptors } from './decks';
import type { BenchmarkDeckDescriptor, BenchmarkMatchupDefinition, BenchmarkSuite } from './types';

const STARTER_MATRIX_SEEDS = [
  'starter-matrix-001',
  'starter-matrix-002',
  'starter-matrix-003',
] as const;

const STARTER_MATRIX_EXPANDED_SEEDS = [
  'starter-matrix-expanded-001',
  'starter-matrix-expanded-002',
  'starter-matrix-expanded-003',
  'starter-matrix-expanded-004',
  'starter-matrix-expanded-005',
  'starter-matrix-expanded-006',
  'starter-matrix-expanded-007',
  'starter-matrix-expanded-008',
  'starter-matrix-expanded-009',
  'starter-matrix-expanded-010',
] as const;

const factionSlug = (descriptor: BenchmarkDeckDescriptor) => descriptor.faction.replace(/_/g, '-');

const seatForDescriptor = (
  descriptor: BenchmarkDeckDescriptor,
  policyId: 'legal-heuristic-v0' | 'legal-heuristic-v1' | 'legal-first-v0'
) => ({
  policyId,
  playerId: `benchmark-${policyId}`,
  faction: descriptor.faction,
  deckPreset: descriptor.deckPreset,
});

const buildStarterMatrixMatchups = ({
  firstPolicyId,
  secondPolicyId,
  firstPolicyLeftSlug,
  firstPolicyRightSlug,
  secondPolicyLeftSlug,
  secondPolicyRightSlug,
}: {
  firstPolicyId: 'legal-heuristic-v0' | 'legal-heuristic-v1';
  secondPolicyId: 'legal-heuristic-v0' | 'legal-first-v0';
  firstPolicyLeftSlug: string;
  firstPolicyRightSlug: string;
  secondPolicyLeftSlug: string;
  secondPolicyRightSlug: string;
}): BenchmarkMatchupDefinition[] => {
  const matchups: BenchmarkMatchupDefinition[] = [];

  benchmarkStarterDeckDescriptors.forEach((leftDescriptor, leftIndex) => {
    benchmarkStarterDeckDescriptors.slice(leftIndex + 1).forEach((rightDescriptor) => {
      matchups.push({
        matchupId: `starter-${factionSlug(leftDescriptor)}-${firstPolicyLeftSlug}-vs-${factionSlug(rightDescriptor)}-${secondPolicyRightSlug}`,
        label: `${leftDescriptor.label} piloted by ${firstPolicyId} vs ${rightDescriptor.label} piloted by ${secondPolicyId}`,
        mirror: true,
        seats: {
          seat_a: seatForDescriptor(leftDescriptor, firstPolicyId),
          seat_b: seatForDescriptor(rightDescriptor, secondPolicyId),
        },
      });
      matchups.push({
        matchupId: `starter-${factionSlug(leftDescriptor)}-${secondPolicyLeftSlug}-vs-${factionSlug(rightDescriptor)}-${firstPolicyRightSlug}`,
        label: `${leftDescriptor.label} piloted by ${secondPolicyId} vs ${rightDescriptor.label} piloted by ${firstPolicyId}`,
        mirror: true,
        seats: {
          seat_a: seatForDescriptor(leftDescriptor, secondPolicyId),
          seat_b: seatForDescriptor(rightDescriptor, firstPolicyId),
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
  matchups: buildStarterMatrixMatchups({
    firstPolicyId: 'legal-heuristic-v0',
    secondPolicyId: 'legal-first-v0',
    firstPolicyLeftSlug: 'heuristic',
    firstPolicyRightSlug: 'heuristic-v0',
    secondPolicyLeftSlug: 'legal-first',
    secondPolicyRightSlug: 'legal-first-v0',
  }),
};

export const benchmarkV1SmokeSuiteV1: BenchmarkSuite = {
  id: 'benchmark-v1-smoke-v1',
  label: 'Benchmark legal heuristic v1 smoke suite',
  description:
    'Small fixed-suite benchmark over the current Northern Realms and Nilfgaard presets with mirrored legal-heuristic-v1 versus legal-heuristic-v0 runs.',
  seeds: currentSimulationSmokeSuite.seeds,
  defaultMaxSteps: currentSimulationSmokeSuite.defaultMaxSteps,
  deckDescriptors: benchmarkSmokeDeckDescriptors,
  matchups: [
    {
      matchupId: 'current-nr-ng-legal-heuristic-v1-vs-legal-heuristic-v0',
      label:
        'Current Northern Realms vs Nilfgaard, legal-heuristic-v1 against legal-heuristic-v0',
      mirror: true,
      seats: {
        seat_a: {
          policyId: 'legal-heuristic-v1',
          playerId: 'benchmark-legal-heuristic-v1',
          faction: benchmarkSmokeDeckDescriptors[0].faction,
          deckPreset: benchmarkSmokeDeckDescriptors[0].deckPreset,
        },
        seat_b: {
          policyId: 'legal-heuristic-v0',
          playerId: 'benchmark-legal-heuristic-v0',
          faction: benchmarkSmokeDeckDescriptors[1].faction,
          deckPreset: benchmarkSmokeDeckDescriptors[1].deckPreset,
        },
      },
    },
  ],
};

export const benchmarkV1StarterMatrixSuiteV1: BenchmarkSuite = {
  id: 'benchmark-v1-starter-matrix-v1',
  label: 'Benchmark legal heuristic v1 starter matrix',
  description:
    'Broader fixed-suite benchmark over all five official starter presets comparing legal-heuristic-v1 against legal-heuristic-v0.',
  seeds: STARTER_MATRIX_SEEDS,
  defaultMaxSteps: currentSimulationSmokeSuite.defaultMaxSteps,
  deckDescriptors: benchmarkStarterDeckDescriptors,
  matchups: buildStarterMatrixMatchups({
    firstPolicyId: 'legal-heuristic-v1',
    secondPolicyId: 'legal-heuristic-v0',
    firstPolicyLeftSlug: 'heuristic-v1',
    firstPolicyRightSlug: 'heuristic-v1',
    secondPolicyLeftSlug: 'heuristic-v0',
    secondPolicyRightSlug: 'heuristic-v0',
  }),
};

export const benchmarkV1StarterMatrixExpandedSuiteV1: BenchmarkSuite = {
  id: 'benchmark-v1-starter-matrix-expanded-v1',
  label: 'Benchmark legal heuristic v1 starter matrix expanded',
  description:
    'Expanded deterministic discovery suite over all five official starter presets comparing legal-heuristic-v1 against legal-heuristic-v0 across ten fixed seeds.',
  seeds: STARTER_MATRIX_EXPANDED_SEEDS,
  defaultMaxSteps: currentSimulationSmokeSuite.defaultMaxSteps,
  deckDescriptors: benchmarkStarterDeckDescriptors,
  matchups: buildStarterMatrixMatchups({
    firstPolicyId: 'legal-heuristic-v1',
    secondPolicyId: 'legal-heuristic-v0',
    firstPolicyLeftSlug: 'heuristic-v1',
    firstPolicyRightSlug: 'heuristic-v1',
    secondPolicyLeftSlug: 'heuristic-v0',
    secondPolicyRightSlug: 'heuristic-v0',
  }),
};

export const benchmarkSuites = {
  [benchmarkSmokeSuiteV1.id]: benchmarkSmokeSuiteV1,
  [benchmarkStarterMatrixSuiteV1.id]: benchmarkStarterMatrixSuiteV1,
  [benchmarkV1SmokeSuiteV1.id]: benchmarkV1SmokeSuiteV1,
  [benchmarkV1StarterMatrixSuiteV1.id]: benchmarkV1StarterMatrixSuiteV1,
  [benchmarkV1StarterMatrixExpandedSuiteV1.id]: benchmarkV1StarterMatrixExpandedSuiteV1,
} as const;

export const getBenchmarkSuite = (id: string): BenchmarkSuite | null =>
  Object.prototype.hasOwnProperty.call(benchmarkSuites, id)
    ? benchmarkSuites[id as keyof typeof benchmarkSuites]
    : null;
