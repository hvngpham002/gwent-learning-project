export interface AiLabStat {
  readonly label: string;
  readonly value: string;
}

export interface AiLabBenchmarkSuite {
  readonly id: "benchmark-smoke-v1";
  readonly label: string;
  readonly status: string;
  readonly summary: string;
  readonly stats: readonly AiLabStat[];
}

export interface AiLabPolicy {
  readonly id: ProductAiPolicyId | "legal-first-v0";
  readonly label: string;
  readonly role: string;
  readonly status: string;
  readonly productSelectable: boolean;
  readonly description: string;
}

export interface AiLabEvaluationLayer {
  readonly label: string;
  readonly status: "current" | "deferred";
  readonly description: string;
}

export interface AiLabResearchReference {
  readonly label: string;
  readonly path: string;
  readonly description: string;
}

export interface AiLabFutureAction {
  readonly id: "run-benchmark" | "export-ledger" | "ratings" | "search-prototype" | "training";
  readonly label: string;
  readonly disabled: true;
  readonly reason: string;
}

export interface AiLabViewModel {
  readonly title: "AI Lab";
  readonly eyebrow: string;
  readonly benchmarkSuite: AiLabBenchmarkSuite;
  readonly policies: readonly AiLabPolicy[];
  readonly evaluationLayers: readonly AiLabEvaluationLayer[];
  readonly researchReferences: readonly AiLabResearchReference[];
  readonly futureActions: readonly AiLabFutureAction[];
}

const benchmarkSuite: AiLabBenchmarkSuite = {
  id: "benchmark-smoke-v1",
  label: "Benchmark smoke suite v1",
  status: "headless/in-memory available, browser run deferred",
  summary:
    "Fixed current Northern Realms versus current Nilfgaard matchup comparing the product heuristic with a deterministic benchmark comparator.",
  stats: [
    { label: "seeds", value: "6" },
    { label: "mirroring", value: "enabled" },
    { label: "expected records", value: "12" },
    { label: "matchup", value: "current Northern Realms vs current Nilfgaard" },
  ],
};

const benchmarkOnlyPolicies: readonly AiLabPolicy[] = [
  {
    id: "legal-first-v0",
    label: "legal-first-v0",
    role: "benchmark-only comparator",
    status: "headless comparator",
    productSelectable: false,
    description: "A deterministic baseline for fixed-suite comparisons. It is not a product difficulty tier.",
  },
];

const policies: readonly AiLabPolicy[] = [
  ...PRODUCT_AI_POLICIES.map((policy): AiLabPolicy => ({
    id: policy.id,
    label: policy.label,
    role: policy.isDefault ? "stable/default product policy" : `${policy.shortLabel} product playtest`,
    status: policy.productStatus === "stable" ? "implemented · stable/default" : "implemented · experimental/playtest",
    productSelectable: policy.productSelectable,
    description: `${policy.description} ${policy.benchmarkStatus}.`,
  })),
  ...benchmarkOnlyPolicies,
];

const evaluationLayers: readonly AiLabEvaluationLayer[] = [
  {
    label: "deterministic smoke/regression ledger",
    status: "current",
    description: "Versioned match rows and deterministic summaries over the fixed smoke suite.",
  },
  {
    label: "fixed-suite matchup matrices",
    status: "deferred",
    description: "Broader seeded matchup tables come before ratings or training claims.",
  },
  {
    label: "ratings",
    status: "deferred",
    description: "Glicko and TrueSkill-style summaries should consume completed ledgers only.",
  },
  {
    label: "robustness/search probes",
    status: "deferred",
    description: "Approximate best-response and search diagnostics remain benchmark-only future work.",
  },
  {
    label: "self-play/ML",
    status: "deferred",
    description: "Training work waits for stable evaluation, export, and policy-version contracts.",
  },
];

const researchReferences: readonly AiLabResearchReference[] = [
  {
    label: "Batch A search baseline",
    path: "docs/research/literature/ai/decisions/2026-05-09-batch-a-search-baseline.md",
    description: "Keeps search in scope but gates it on evaluation and determinization-risk measurements.",
  },
  {
    label: "Batch B evaluation ladder",
    path: "docs/research/literature/ai/decisions/2026-05-09-batch-b-evaluation-ladder.md",
    description: "Places raw ledgers and fixed-suite matrices before ratings, robustness probes, or training.",
  },
  {
    label: "Benchmark harness",
    path: "docs/research/literature/ai/benchmark-harness.md",
    description: "Documents the cFp21 in-memory benchmark ledger and summary contract.",
  },
  {
    label: "AI/ML roadmap",
    path: "docs/overhaul-plan/ai-ml-roadmap.md",
    description: "Tracks staged AI work from legal policies through evaluation and later learning.",
  },
];

const futureActions: readonly AiLabFutureAction[] = [
  {
    id: "run-benchmark",
    label: "run benchmark",
    disabled: true,
    reason: "Browser execution is deferred; use headless research code outside the product route.",
  },
  {
    id: "export-ledger",
    label: "export ledger",
    disabled: true,
    reason: "File and JSONL writers are not part of this product surface.",
  },
  {
    id: "ratings",
    label: "ratings",
    disabled: true,
    reason: "Rating layers need larger completed matchup matrices first.",
  },
  {
    id: "search-prototype",
    label: "search prototype",
    disabled: true,
    reason: "Search remains a benchmark-only future prototype with separate guardrails.",
  },
  {
    id: "training",
    label: "training",
    disabled: true,
    reason: "Self-play and model training are deferred until evaluation contracts are stable.",
  },
];

export const buildAuthenticAiLabViewModel = (): AiLabViewModel => ({
  title: "AI Lab",
  eyebrow: "read-only research dashboard",
  benchmarkSuite,
  policies,
  evaluationLayers,
  researchReferences,
  futureActions,
});
import { PRODUCT_AI_POLICIES, type ProductAiPolicyId } from "@/game/ai";
