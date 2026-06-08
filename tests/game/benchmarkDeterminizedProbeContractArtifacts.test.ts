import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDeterminizedProbeContract,
  determinizedProbeContractArtifactHashes,
  scanDeterminizedProbeContractArtifactsForHiddenInfo,
  serializeDeterminizedProbeContractArtifacts,
  type SamplerMaterializationRootRecord,
  type SamplerMaterializationSummary,
  type SamplerPostCfp66InvalidRootCasebookRecord,
  type SamplerPostCfp66InvalidRootCasebookSummary,
} from "@/game/benchmark";

const artifactDir = (suiteId: string, family: string, phase: string) =>
  resolve(
    process.cwd(),
    "docs/research/literature/ai/benchmark-results",
    suiteId,
    family,
    phase,
  );

const readArtifactText = (
  suiteId: string,
  family: string,
  phase: string,
  file: string,
) => readFileSync(resolve(artifactDir(suiteId, family, phase), file), "utf8");

const readArtifactJson = <T>(
  suiteId: string,
  family: string,
  phase: string,
  file: string,
): T => JSON.parse(readArtifactText(suiteId, family, phase, file)) as T;

const readArtifactJsonl = <T>(
  suiteId: string,
  family: string,
  phase: string,
  file: string,
): T[] =>
  readArtifactText(suiteId, family, phase, file)
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);

const buildRobustContract = () => {
  const suiteId = "benchmark-v1-starter-matrix-robust-v1";
  return buildDeterminizedProbeContract({
    contractRunId: `${suiteId}:determinized-probe-contract:cFp68:test`,
    suiteId,
    materializationSummary: readArtifactJson<SamplerMaterializationSummary>(
      suiteId,
      "sampler-materialization",
      "cFp61",
      "summary.json",
    ),
    materializationRoots: readArtifactJsonl<SamplerMaterializationRootRecord>(
      suiteId,
      "sampler-materialization",
      "cFp61",
      "roots.jsonl",
    ),
    casebookSummary:
      readArtifactJson<SamplerPostCfp66InvalidRootCasebookSummary>(
        suiteId,
        "sampler-post-cfp66-invalid-root-casebook",
        "cFp67",
        "summary.json",
      ),
    casebookInvalidRoots:
      readArtifactJsonl<SamplerPostCfp66InvalidRootCasebookRecord>(
        suiteId,
        "sampler-post-cfp66-invalid-root-casebook",
        "cFp67",
        "invalid-roots.jsonl",
      ),
    sourceArtifactReferences: [
      {
        label: "materialization roots",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-materialization/cFp61/roots.jsonl",
        sha256: "test-hash-materialization-roots",
      },
      {
        label: "casebook roots",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/sampler-post-cfp66-invalid-root-casebook/cFp67/invalid-roots.jsonl",
        sha256: "test-hash-casebook-roots",
      },
    ],
  });
};

describe("determinized probe contract artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const result = buildRobustContract();
    const first = serializeDeterminizedProbeContractArtifacts(result);
    const second = serializeDeterminizedProbeContractArtifacts(result);

    expect(determinizedProbeContractArtifactHashes(first)).toEqual(
      determinizedProbeContractArtifactHashes(second),
    );
    expect(first.summaryJson).toBe(second.summaryJson);
    expect(first.eligibleRootsJsonl).toBe(second.eligibleRootsJsonl);
    expect(first.skippedRootsJsonl).toBe(second.skippedRootsJsonl);
    expect(first.reportMarkdown).toBe(second.reportMarkdown);
  });

  it("keeps manifest and source artifact paths repo-relative and portable", () => {
    const artifacts = serializeDeterminizedProbeContractArtifacts(
      buildRobustContract(),
    );
    const manifest = JSON.parse(artifacts.manifestJson) as {
      relativeOutputPath: string;
    };
    const summary = JSON.parse(artifacts.summaryJson) as {
      sourceArtifactReferences: { relativePath: string }[];
    };

    expect(manifest.relativeOutputPath).toBe(
      "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68",
    );
    expect(manifest.relativeOutputPath).not.toContain(process.cwd());
    for (const reference of summary.sourceArtifactReferences) {
      expect(reference.relativePath).toMatch(/^docs\//);
      expect(reference.relativePath).not.toContain(process.cwd());
    }
  });

  it("scans cFp68 artifacts for hidden-info hazards and rejects representative unsafe tokens", () => {
    const artifacts = serializeDeterminizedProbeContractArtifacts(
      buildRobustContract(),
    );

    expect(scanDeterminizedProbeContractArtifactsForHiddenInfo(artifacts)).toEqual(
      [],
    );
    expect(
      scanDeterminizedProbeContractArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\nsourceId\nsampledWorld\nseat_a:\n`,
      }),
    ).toEqual(expect.arrayContaining(["sourceId", "sampledWorld", "runtime seat_a prefix"]));
  });

  it("renders future probe contract language without running search", () => {
    const artifacts = serializeDeterminizedProbeContractArtifacts(
      buildRobustContract(),
    );

    expect(artifacts.reportMarkdown).toContain(
      "A future determinized probe may read only eligible-roots.jsonl as the root list.",
    );
    expect(artifacts.reportMarkdown).toContain(
      "cFp68 is benchmark/evaluation contract infrastructure only.",
    );
  });
});
