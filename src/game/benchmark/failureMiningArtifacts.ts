import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { BenchmarkFailureMiningResult } from "./failureMining";

export interface SerializedBenchmarkFailureMiningArtifacts {
  readonly manifestJson: string;
  readonly summaryJson: string;
  readonly findingsJsonl: string;
  readonly reportMarkdown: string;
  readonly tuningQueueMarkdown: string;
}

export const benchmarkFailureMiningArtifactFiles = [
  "manifest.json",
  "summary.json",
  "findings.jsonl",
  "report.md",
  "tuning-queue.md",
] as const;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const sortJsonValue = (value: unknown): JsonValue => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJsonValue(nested)]),
    );
  }
  return null;
};

const stablePrettyJson = (value: unknown) => `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;

const stableJsonLine = (value: unknown) => JSON.stringify(sortJsonValue(value));

export const serializeBenchmarkFailureMiningArtifacts = (
  result: BenchmarkFailureMiningResult,
): SerializedBenchmarkFailureMiningArtifacts => ({
  manifestJson: stablePrettyJson(result.manifest),
  summaryJson: stablePrettyJson(result.summary),
  findingsJsonl: result.findings.length === 0 ? "" : `${result.findings.map(stableJsonLine).join("\n")}\n`,
  reportMarkdown: result.markdownReport,
  tuningQueueMarkdown: result.tuningQueueMarkdown,
});

export const writeBenchmarkFailureMiningArtifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedBenchmarkFailureMiningArtifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "summary.json"), artifacts.summaryJson, "utf8"),
    writeFile(resolve(outDir, "findings.jsonl"), artifacts.findingsJsonl, "utf8"),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
    writeFile(resolve(outDir, "tuning-queue.md"), artifacts.tuningQueueMarkdown, "utf8"),
  ]);
  return {
    outDir,
    files: [...benchmarkFailureMiningArtifactFiles],
  };
};

const hiddenInfoHazards: readonly { label: string; pattern: RegExp }[] = [
  { label: "raw cards map", pattern: /\bcardsById\b/ },
  { label: "raw terminal state", pattern: /\bfinalState\b/ },
  { label: "raw command log", pattern: /\bcommandLog\b/ },
  { label: "unsafe debug results", pattern: /\bunsafeDebugResults\b/ },
  { label: "AI own private-zone payload", pattern: /\bownHand\b/ },
  { label: "opponent private-zone payload", pattern: /\bopponentHand\b/ },
  { label: "raw private-zone key", pattern: /"hand"\s*:/ },
  { label: "raw draw-zone key", pattern: /"deck"\s*:/ },
  { label: "runtime seat instance id", pattern: /\bseat_[ab]:[A-Za-z0-9_.:-]+/ },
];

export const combinedBenchmarkFailureMiningArtifactText = (
  artifacts: SerializedBenchmarkFailureMiningArtifacts,
) =>
  [
    artifacts.manifestJson,
    artifacts.summaryJson,
    artifacts.findingsJsonl,
    artifacts.reportMarkdown,
    artifacts.tuningQueueMarkdown,
  ].join("\n");

export const scanBenchmarkFailureMiningArtifactsForHiddenInfo = (
  artifacts: SerializedBenchmarkFailureMiningArtifacts,
) => {
  const combined = combinedBenchmarkFailureMiningArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};
