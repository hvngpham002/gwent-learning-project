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
    description: "Experimental deterministic legal heuristic tuned through cFp41.1 with pass-decision alignment, weather-aware placement, weathered-row low-tempo guard, no-target Medic delay guard, and recursive-scoring guard; cFp42 adds a round-resource casebook over the committed expanded artifacts without changing behavior.",
    latestPhase: "cFp42",
    latestSpecPath: "docs/spec/2026-05-20-cFp42-specs.md",
    latestReportPath: "audit/reports/2026-05-20-cFp42-report.md",
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
        result: "104 win / 14 loss / 2 draw vs v0",
      },
      {
        suiteId: "benchmark-v1-starter-matrix-expanded-v1",
        label: "v1 expanded starter matrix",
        result: "310 win / 85 loss / 5 draw vs v0; 0 policy failures",
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
