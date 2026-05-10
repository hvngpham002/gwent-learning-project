import type { EnginePolicy } from "./types";
import { legalHeuristicPolicyV0 } from "./legalHeuristicPolicyV0";
import { legalHeuristicPolicyV1 } from "./legalHeuristicPolicyV1";

export const DEFAULT_PRODUCT_AI_POLICY_ID = "legal-heuristic-v0";

export const PRODUCT_AI_POLICY_IDS = ["legal-heuristic-v0", "legal-heuristic-v1"] as const;

export type ProductAiPolicyId = (typeof PRODUCT_AI_POLICY_IDS)[number];

export type ProductAiPolicyStatus = "stable" | "playtest";

export interface ProductAiPolicyMetadata {
  readonly id: ProductAiPolicyId;
  readonly label: string;
  readonly shortLabel: "stable" | "experimental";
  readonly productStatus: ProductAiPolicyStatus;
  readonly benchmarkStatus: string;
  readonly productSelectable: true;
  readonly isDefault: boolean;
  readonly description: string;
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
  },
  {
    id: "legal-heuristic-v1",
    label: "legal-heuristic-v1",
    shortLabel: "experimental",
    productStatus: "playtest",
    benchmarkStatus: "benchmark artifacts available",
    productSelectable: true,
    isDefault: false,
    description: "Experimental deterministic heuristic baseline from cFp24.",
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
