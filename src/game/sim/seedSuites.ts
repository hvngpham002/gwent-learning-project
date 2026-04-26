import type { SimulationSeedSuite } from "./types";

export const currentSimulationSmokeSuite: SimulationSeedSuite = {
  id: "current-smoke-v1",
  label: "Current catalog smoke suite v1",
  description:
    "Small deterministic Northern Realms vs Nilfgaard legal-heuristic-v0 regression suite. sim-smoke-001 covers Medic prompt resolution.",
  seeds: ["sim-smoke-001", "sim-smoke-002", "sim-smoke-003", "sim-smoke-004", "sim-smoke-005", "sim-smoke-006"],
  defaultMaxSteps: 300,
};

export const simulationSeedSuites = {
  [currentSimulationSmokeSuite.id]: currentSimulationSmokeSuite,
} as const;

export const getSimulationSeedSuite = (id: string): SimulationSeedSuite | null =>
  Object.prototype.hasOwnProperty.call(simulationSeedSuites, id)
    ? simulationSeedSuites[id as keyof typeof simulationSeedSuites]
    : null;
