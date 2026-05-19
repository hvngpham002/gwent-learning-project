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
  it("describes the current expanded benchmark suite without runtime output", () => {
    const viewModel = buildAuthenticAiLabViewModel();

    expect(viewModel.benchmarkSuite.id).toBe("benchmark-v1-starter-matrix-expanded-v1");
    expect(viewModel.benchmarkSuite.stats).toEqual(
      expect.arrayContaining([
        { label: "seeds", value: "10" },
        { label: "mirroring", value: "enabled" },
        { label: "expected records", value: "400" },
        { label: "matchup", value: "all official starter deck pairs" },
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
        latestPhase: "cFp39",
        latestSpecPath: "docs/spec/2026-05-18-cFp39-specs.md",
        latestReportPath: "audit/reports/2026-05-18-cFp39-report.md",
        latestPolicyDocPath: "docs/research/literature/ai/policies/legal-heuristic-v1.md",
      }),
    );
    expect(viewModel.policies.find((policy) => policy.id === "legal-first-v0")).toEqual(
      expect.objectContaining({ role: "benchmark-only comparator", productSelectable: false }),
    );
    expect(PRODUCT_AI_POLICIES.map((policy) => policy.id)).not.toContain("legal-first-v0" as never);
  });

  it("surfaces current legal-heuristic-v1 phase metadata, benchmarks, and capabilities", () => {
    const viewModel = buildAuthenticAiLabViewModel();
    const v1 = viewModel.policies.find((policy) => policy.id === "legal-heuristic-v1");

    expect(v1).toEqual(
      expect.objectContaining({
        latestPhase: "cFp39",
        latestSpecPath: "docs/spec/2026-05-18-cFp39-specs.md",
        latestReportPath: "audit/reports/2026-05-18-cFp39-report.md",
        latestPolicyDocPath: "docs/research/literature/ai/policies/legal-heuristic-v1.md",
      }),
    );
    expect(v1?.latestBenchmarkSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          suiteId: "benchmark-v1-smoke-v1",
          result: "10 win / 2 loss / 0 draw vs v0",
        }),
        expect.objectContaining({
          suiteId: "benchmark-v1-starter-matrix-v1",
          result: "104 win / 14 loss / 2 draw vs v0",
        }),
        expect.objectContaining({
          suiteId: "benchmark-v1-starter-matrix-expanded-v1",
          result: "400-record discovery suite available via benchmark:long",
        }),
      ]),
    );
    expect(v1?.capabilities).toEqual(
      expect.arrayContaining([
        "linked-card mulligan diagnostics",
        "tie-aware and pass diagnostics",
        "hand-quality pass calibration",
        "Medic timing calibration",
        "no-target Medic delay guard",
        "weather-aware unit placement",
        "round-investment preservation",
        "stop-loss round sacrifice",
        "Scoia'tael first-turn choice strategy",
        "round-resource exhaustion diagnostics and budget gate",
        "pass-decision alignment — resource-gate scope-down",
        "weathered-row low-tempo scoring guard",
        "expanded 400-record starter-matrix discovery suite",
      ]),
    );
  });

  it("does not mark registered product policies as not implemented or omit them", () => {
    const viewModel = buildAuthenticAiLabViewModel();

    for (const productPolicy of PRODUCT_AI_POLICIES) {
      const row = viewModel.policies.find((policy) => policy.id === productPolicy.id);
      expect(row).toBeTruthy();
      expect(`${row?.role} ${row?.status} ${row?.description}`.toLowerCase()).not.toContain("not implemented");
    }
  });

  it("does not expose stale cFp24-era origin wording in policy metadata or AI Lab output", () => {
    expect(JSON.stringify(PRODUCT_AI_POLICIES)).not.toContain("from cFp24");
    expect(JSON.stringify(buildAuthenticAiLabViewModel())).not.toContain("from cFp24");
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
