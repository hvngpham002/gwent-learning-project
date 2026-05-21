import type { EnginePolicy } from "./types";
import { legalHeuristicPolicyV0 } from "./legalHeuristicPolicyV0";
import { legalHeuristicPolicyV1 } from "./legalHeuristicPolicyV1";

export const DEFAULT_PRODUCT_AI_POLICY_ID = "legal-heuristic-v0";

export const PRODUCT_AI_POLICY_IDS = ["legal-heuristic-v0", "legal-heuristic-v1"] as const;

export type ProductAiPolicyId = (typeof PRODUCT_AI_POLICY_IDS)[number];

export type ProductAiPolicyStatus = "stable" | "playtest";

export interface ProductAiPolicyBenchmarkSummary {
  readonly suiteId: string;
  readonly label: string;
  readonly result: string;
}

export interface ProductAiPolicyMetadata {
  readonly id: ProductAiPolicyId;
  readonly label: string;
  readonly shortLabel: "stable" | "experimental";
  readonly productStatus: ProductAiPolicyStatus;
  readonly benchmarkStatus: string;
  readonly productSelectable: true;
  readonly isDefault: boolean;
  readonly description: string;
  readonly latestPhase: string | null;
  readonly latestSpecPath: string | null;
  readonly latestReportPath: string | null;
  readonly latestPolicyDocPath: string | null;
  readonly latestBenchmarkSummaries: readonly ProductAiPolicyBenchmarkSummary[];
  readonly capabilities: readonly string[];
}

export const PRODUCT_AI_POLICIES: readonly ProductAiPolicyMetadata[] = [
  {
    id: "legal-heuristic-v0",
    label: "legal-heuristic-v0",
    shortLabel: "stable",
    productStatus: "stable",
    benchmarkStatus: "benchmark artifacts available",
    productSelectable: true,
    isDefault: true,
    description: "Default deterministic legal heuristic for product Human vs AI play.",
    latestPhase: null,
    latestSpecPath: null,
    latestReportPath: null,
    latestPolicyDocPath: null,
    latestBenchmarkSummaries: [],
    capabilities: [
      "deterministic legal-move selection",
      "basic mulligan and prompt handling",
      "stable product default",
    ],
  },
  {
    id: "legal-heuristic-v1",
    label: "legal-heuristic-v1",
    shortLabel: "experimental",
    productStatus: "playtest",
    benchmarkStatus: "benchmark artifacts available",
    productSelectable: true,
    isDefault: false,
    description: "Experimental deterministic legal heuristic tuned through cFp43 with post-cFp43 casebook/decision analysis through cFp51. Includes pass-decision alignment, weather-aware placement, weathered-row low-tempo guard, no-target Medic delay guard, recursive-scoring guard, round-resource casebook (cFp42), round-one overinvestment guard (cFp43), post-cFp43 casebook (cFp44), and remaining-overinvestment calibration review (cFp45). cFp45, cFp49, and cFp51 are analysis-only: public artifacts did not support a safe narrow behavior patch. Benchmark rating infrastructure added in cFp46. cFp47 adds deterministic rating snapshot and comparison ledger for longitudinal rating tracking. cFp48 adds a robust 1000-record starter-matrix evaluation suite and first suite-local cFp48 rating baseline without changing policy behavior. cFp50 adds hidden-info-safe scalar round-one guard-state telemetry to failure-mining artifacts only, and cFp51 classifies that telemetry with no policy behavior change.",
    latestPhase: "cFp51",
    latestSpecPath: "docs/spec/2026-05-22-cFp51-specs.md",
    latestReportPath: "audit/reports/2026-05-22-cFp51-report.md",
    latestPolicyDocPath: "docs/research/literature/ai/policies/legal-heuristic-v1.md",
    latestBenchmarkSummaries: [
      {
        suiteId: "benchmark-v1-smoke-v1",
        label: "v1 smoke",
        result: "10 win / 2 loss / 0 draw vs v0",
      },
      {
        suiteId: "benchmark-v1-starter-matrix-v1",
        label: "v1 starter matrix",
        result: "102 win / 17 loss / 1 draw vs v0",
      },
      {
        suiteId: "benchmark-v1-starter-matrix-expanded-v1",
        label: "v1 expanded starter matrix",
        result: "305 win / 90 loss / 5 draw vs v0; 0 policy failures",
      },
      {
        suiteId: "benchmark-v1-starter-matrix-robust-v1",
        label: "v1 robust starter matrix",
        result: "776 win / 206 loss / 18 draw vs v0; 0 policy failures",
      },
    ],
    capabilities: [
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
    ],
  },
];

const productPolicyIds = new Set<string>(PRODUCT_AI_POLICY_IDS);

const policiesById: Record<ProductAiPolicyId, EnginePolicy> = {
  "legal-heuristic-v0": legalHeuristicPolicyV0,
  "legal-heuristic-v1": legalHeuristicPolicyV1,
};

export const isProductAiPolicyId = (value: unknown): value is ProductAiPolicyId =>
  typeof value === "string" && productPolicyIds.has(value);

export const resolveProductAiPolicyId = (value: unknown): ProductAiPolicyId =>
  isProductAiPolicyId(value) ? value : DEFAULT_PRODUCT_AI_POLICY_ID;

export const getProductAiPolicy = (policyId: unknown): EnginePolicy =>
  policiesById[resolveProductAiPolicyId(policyId)];

export const aiPolicyIdFromSearch = (search = ""): ProductAiPolicyId => {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  return resolveProductAiPolicyId(params.get("ai"));
};
