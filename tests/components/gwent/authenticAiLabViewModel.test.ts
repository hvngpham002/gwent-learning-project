import { describe, expect, it } from "vitest";

import { buildAuthenticAiLabViewModel } from "@/components/gwent/aiLabViewModel";

const forbiddenHiddenInfoStrings = [
  "cardsById",
  "finalState",
  "commandLog",
  "ownHand",
  "opponentHand",
  "seat_a:",
  "seat_b:",
];

describe("authentic AI Lab view model", () => {
  it("describes the current smoke benchmark suite without runtime output", () => {
    const viewModel = buildAuthenticAiLabViewModel();

    expect(viewModel.benchmarkSuite.id).toBe("benchmark-smoke-v1");
    expect(viewModel.benchmarkSuite.stats).toEqual(
      expect.arrayContaining([
        { label: "seeds", value: "6" },
        { label: "mirroring", value: "enabled" },
        { label: "expected records", value: "12" },
        { label: "matchup", value: "current Northern Realms vs current Nilfgaard" },
      ]),
    );
    expect(viewModel.benchmarkSuite.status).toContain("browser run deferred");
  });

  it("lists policy ids and marks legal-first-v0 as benchmark-only", () => {
    const viewModel = buildAuthenticAiLabViewModel();

    expect(viewModel.policies.map((policy) => policy.id)).toEqual([
      "legal-heuristic-v0",
      "legal-first-v0",
      "legal-heuristic-v1",
    ]);
    expect(viewModel.policies.find((policy) => policy.id === "legal-heuristic-v0")).toEqual(
      expect.objectContaining({ role: "current product/headless heuristic" }),
    );
    expect(viewModel.policies.find((policy) => policy.id === "legal-first-v0")).toEqual(
      expect.objectContaining({ role: "benchmark-only comparator" }),
    );
    expect(viewModel.policies.find((policy) => policy.id === "legal-heuristic-v1")).toEqual(
      expect.objectContaining({ status: "not implemented" }),
    );
  });

  it("keeps all future actions disabled with reasons", () => {
    const viewModel = buildAuthenticAiLabViewModel();

    expect(viewModel.futureActions.map((action) => action.id)).toEqual([
      "run-benchmark",
      "export-ledger",
      "ratings",
      "search-prototype",
      "training",
    ]);
    expect(viewModel.futureActions.every((action) => action.disabled)).toBe(true);
    expect(viewModel.futureActions.every((action) => action.reason.length > 12)).toBe(true);
  });

  it("keeps visible AI Lab data free of hidden-info and debug-output keys", () => {
    const serialized = JSON.stringify(buildAuthenticAiLabViewModel());

    for (const forbidden of forbiddenHiddenInfoStrings) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
