import { describe, expect, it } from "vitest";

import { buildAuthenticAiLabViewModel } from "@/components/gwent/aiLabViewModel";
import { PRODUCT_AI_POLICIES } from "@/game/ai";

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

  it("derives product policy rows from the shared registry and marks legal-first-v0 as benchmark-only", () => {
    const viewModel = buildAuthenticAiLabViewModel();

    for (const productPolicy of PRODUCT_AI_POLICIES) {
      expect(viewModel.policies.find((policy) => policy.id === productPolicy.id)).toEqual(
        expect.objectContaining({
          label: productPolicy.label,
          productSelectable: true,
        }),
      );
    }
    expect(viewModel.policies.find((policy) => policy.id === "legal-heuristic-v0")).toEqual(
      expect.objectContaining({ role: "stable/default product policy", status: "implemented · stable/default" }),
    );
    expect(viewModel.policies.find((policy) => policy.id === "legal-heuristic-v1")).toEqual(
      expect.objectContaining({
        role: "experimental product playtest",
        status: "implemented · experimental/playtest",
      }),
    );
    expect(viewModel.policies.find((policy) => policy.id === "legal-first-v0")).toEqual(
      expect.objectContaining({ role: "benchmark-only comparator", productSelectable: false }),
    );
    expect(PRODUCT_AI_POLICIES.map((policy) => policy.id)).not.toContain("legal-first-v0" as never);
  });

  it("does not mark registered product policies as not implemented or omit them", () => {
    const viewModel = buildAuthenticAiLabViewModel();

    for (const productPolicy of PRODUCT_AI_POLICIES) {
      const row = viewModel.policies.find((policy) => policy.id === productPolicy.id);
      expect(row).toBeTruthy();
      expect(`${row?.role} ${row?.status} ${row?.description}`.toLowerCase()).not.toContain("not implemented");
    }
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
