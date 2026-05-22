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
  it("describes the current robust benchmark suite without runtime output", () => {
    const viewModel = buildAuthenticAiLabViewModel();

    expect(viewModel.benchmarkSuite.id).toBe("benchmark-v1-starter-matrix-robust-v1");
    expect(viewModel.benchmarkSuite.stats).toEqual(
      expect.arrayContaining([
        { label: "seeds", value: "25" },
        { label: "mirroring", value: "enabled" },
        { label: "expected records", value: "1000" },
        { label: "matchup", value: "all official starter deck pairs" },
      ])
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
        })
      );
    }
    expect(viewModel.policies.find((policy) => policy.id === "legal-heuristic-v0")).toEqual(
      expect.objectContaining({
        role: "stable/default product policy",
        status: "implemented · stable/default",
      })
    );
    expect(viewModel.policies.find((policy) => policy.id === "legal-heuristic-v1")).toEqual(
      expect.objectContaining({
        role: "experimental product playtest",
        status: "implemented · experimental/playtest",
        latestPhase: "cFp59",
        latestSpecPath: "docs/spec/2026-05-22-cFp59-specs.md",
        latestReportPath: "audit/reports/2026-05-22-cFp59-report.md",
        latestPolicyDocPath: "docs/research/literature/ai/policies/legal-heuristic-v1.md",
      })
    );
    expect(viewModel.policies.find((policy) => policy.id === "legal-first-v0")).toEqual(
      expect.objectContaining({ role: "benchmark-only comparator", productSelectable: false })
    );
    expect(PRODUCT_AI_POLICIES.map((policy) => policy.id)).not.toContain("legal-first-v0" as never);
  });

  it("surfaces current legal-heuristic-v1 phase metadata, benchmarks, and capabilities", () => {
    const viewModel = buildAuthenticAiLabViewModel();
    const v1 = viewModel.policies.find((policy) => policy.id === "legal-heuristic-v1");

    expect(v1).toEqual(
      expect.objectContaining({
        latestPhase: "cFp59",
        latestSpecPath: "docs/spec/2026-05-22-cFp59-specs.md",
        latestReportPath: "audit/reports/2026-05-22-cFp59-report.md",
        latestPolicyDocPath: "docs/research/literature/ai/policies/legal-heuristic-v1.md",
      })
    );
    expect(v1?.latestBenchmarkSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          suiteId: "benchmark-v1-smoke-v1",
          result: "11 win / 1 loss / 0 draw vs v0",
        }),
        expect.objectContaining({
          suiteId: "benchmark-v1-starter-matrix-v1",
          result: "102 win / 17 loss / 1 draw vs v0",
        }),
        expect.objectContaining({
          suiteId: "benchmark-v1-starter-matrix-expanded-v1",
          result: "305 win / 90 loss / 5 draw vs v0; 0 policy failures",
        }),
        expect.objectContaining({
          suiteId: "benchmark-v1-starter-matrix-robust-v1",
          result: "776 win / 206 loss / 18 draw vs v0; 0 policy failures",
        }),
      ])
    );
    expect(v1?.description).toContain("cFp59 change no policy behavior");
    expect(v1?.description).toContain("evaluation infrastructure only, not search gameplay");
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
        "non-recursive alternative-line scoring guard (cFp41.1)",
        "round-resource exhaustion casebook (cFp42)",
        "round-one overinvestment guard (cFp43)",
        "remaining overinvestment calibration decision note (cFp45)",
        "Glicko rating layer for benchmark artifacts (cFp46)",
        "deterministic rating snapshot and comparison ledger (cFp47)",
        "robust 1000-record starter-matrix evaluation suite (cFp48)",
        "robust failure-mining casebook over the 1000-record starter matrix, classifying round-resource, weather, Medic timing, matchup skew, and pass-diagnostic signals before the next behavior patch (cFp49)",
        "hidden-info-safe round-one overinvestment guard-state telemetry in failure-mining artifacts (cFp50)",
        "round-one guard telemetry casebook over cFp50 failure-mining artifacts (cFp51)",
        "round-one guard fixture reproduction/debug over the two cFp51 direct candidates (cFp52)",
        "round-one selected-play overinvestment guard repair for the cFp52 direct candidates (cFp53)",
        "post-cFp53 robust round-one overinvestment casebook classifying the remaining 70 findings (cFp54)",
        "round-one temporal/cumulative spend instrumentation in failure-mining evidence (cFp55)",
        "temporal round-one overinvestment casebook over cFp55 robust findings (cFp56)",
        "multi-period rating ledger snapshots and suite-local comparisons (cFp57)",
        "search-readiness and ISMCTS probe design guardrails without gameplay policy changes (cFp58)",
        "search-readiness root profiler artifacts for evaluation infrastructure, not search gameplay (cFp59)",
      ])
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
