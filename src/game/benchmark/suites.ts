import { currentNilfgaardDeckPreset, currentNorthernRealmsDeckPreset } from "@/data/catalog";
import { currentSimulationSmokeSuite } from "@/game/sim";

import type { BenchmarkSuite } from "./types";

export const benchmarkSmokeSuiteV1: BenchmarkSuite = {
  id: "benchmark-smoke-v1",
  label: "Benchmark smoke suite v1",
  description:
    "Small fixed-suite benchmark over the current Northern Realms and Nilfgaard presets with mirrored legal-heuristic-v0 versus legal-first-v0 runs.",
  seeds: currentSimulationSmokeSuite.seeds,
  defaultMaxSteps: currentSimulationSmokeSuite.defaultMaxSteps,
  matchups: [
    {
      matchupId: "current-nr-ng-legal-heuristic-v0-vs-legal-first-v0",
      label: "Current Northern Realms vs Nilfgaard, heuristic against deterministic legal-first baseline",
      mirror: true,
      seats: {
        seat_a: {
          policyId: "legal-heuristic-v0",
          playerId: "benchmark-legal-heuristic-v0",
          faction: currentNorthernRealmsDeckPreset.faction,
          deckPreset: currentNorthernRealmsDeckPreset,
        },
        seat_b: {
          policyId: "legal-first-v0",
          playerId: "benchmark-legal-first-v0",
          faction: currentNilfgaardDeckPreset.faction,
          deckPreset: currentNilfgaardDeckPreset,
        },
      },
    },
  ],
};

export const benchmarkSuites = {
  [benchmarkSmokeSuiteV1.id]: benchmarkSmokeSuiteV1,
} as const;

export const getBenchmarkSuite = (id: string): BenchmarkSuite | null =>
  Object.prototype.hasOwnProperty.call(benchmarkSuites, id)
    ? benchmarkSuites[id as keyof typeof benchmarkSuites]
    : null;
