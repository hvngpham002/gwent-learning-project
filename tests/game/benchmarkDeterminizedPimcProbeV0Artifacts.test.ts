import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcProbeV0,
  determinizedPimcProbeV0ArtifactHashes,
  scanDeterminizedPimcProbeV0ArtifactsForHiddenInfo,
  serializeDeterminizedPimcProbeV0Artifacts,
  type DeterminizedPimcProbeV0ObservedRoot,
  type DeterminizedProbeContractEligibleRootRecord,
  type DeterminizedProbeContractSkippedRootRecord,
  type DeterminizedProbeContractSummary,
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

const observedFromRoot = (
  root:
    | DeterminizedProbeContractEligibleRootRecord
    | DeterminizedProbeContractSkippedRootRecord,
): DeterminizedPimcProbeV0ObservedRoot => ({
  suiteId: root.suiteId,
  matchupId: root.matchupId,
  seed: root.seed,
  ...(root.mirrorGroupId ? { mirrorGroupId: root.mirrorGroupId } : {}),
  ...(root.mirrorIndex === undefined ? {} : { mirrorIndex: root.mirrorIndex }),
  step: root.step,
  decisionIndex: root.decisionIndex,
  phase: root.phase,
  round: root.round,
  seatId: root.seatId,
  policyId: root.policyId,
  faction: root.faction as DeterminizedPimcProbeV0ObservedRoot["faction"],
  deckPresetId: root.deckPresetId,
  legalMoveCount: 1,
  publicActionCount: 1,
  publicActionCollisionCount: 0,
  largestPublicActionBucketSize: 1,
  publicActionKindCounts: {
    choose_mulligan: 0,
    choose_prompt_option: 0,
    pass: 1,
    play_card: 0,
    resolve_round_end: 0,
    use_leader: 0,
  },
  targetKindCounts: {
    board_row: 0,
    card: 0,
    card_instance_set: 0,
    deck_card_instance: 0,
    deck_card_source: 0,
    none: 1,
    row_horn: 0,
    weather: 0,
  },
  targetSideCounts: {
    none: 1,
    opponent: 0,
    own: 0,
    public: 0,
  },
  probeStatus: "completed",
});

const buildRobustProbe = () => {
  const suiteId = "benchmark-v1-starter-matrix-robust-v1";
  const contractSummary = readArtifactJson<DeterminizedProbeContractSummary>(
    suiteId,
    "determinized-probe-contract",
    "cFp68",
    "summary.json",
  );
  const eligibleRoots =
    readArtifactJsonl<DeterminizedProbeContractEligibleRootRecord>(
      suiteId,
      "determinized-probe-contract",
      "cFp68",
      "eligible-roots.jsonl",
    );
  const skippedRoots =
    readArtifactJsonl<DeterminizedProbeContractSkippedRootRecord>(
      suiteId,
      "determinized-probe-contract",
      "cFp68",
      "skipped-roots.jsonl",
    );

  return buildDeterminizedPimcProbeV0({
    probeRunId: `${suiteId}:determinized-pimc-probe-v0:cFp69:test`,
    suiteId,
    contractSummary,
    cFp68EligibleRoots: eligibleRoots,
    cFp68SkippedRoots: skippedRoots,
    observedRoots: [...eligibleRoots, ...skippedRoots].map(observedFromRoot),
    sourceArtifactReferences: [
      {
        label: "cFp68 summary",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/summary.json",
        sha256: "test-hash-summary",
      },
      {
        label: "cFp68 eligible roots",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-probe-contract/cFp68/eligible-roots.jsonl",
        sha256: "test-hash-eligible",
      },
    ],
  });
};

describe("determinized PIMC probe v0 artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const result = buildRobustProbe();
    const first = serializeDeterminizedPimcProbeV0Artifacts(result);
    const second = serializeDeterminizedPimcProbeV0Artifacts(result);

    expect(determinizedPimcProbeV0ArtifactHashes(first)).toEqual(
      determinizedPimcProbeV0ArtifactHashes(second),
    );
    expect(first.summaryJson).toBe(second.summaryJson);
    expect(first.probeRootsJsonl).toBe(second.probeRootsJsonl);
    expect(first.skippedRootsJsonl).toBe(second.skippedRootsJsonl);
    expect(first.reportMarkdown).toBe(second.reportMarkdown);
  });

  it("keeps manifest and source artifact paths repo-relative and portable", () => {
    const artifacts = serializeDeterminizedPimcProbeV0Artifacts(
      buildRobustProbe(),
    );
    const manifest = JSON.parse(artifacts.manifestJson) as {
      relativeOutputPath: string;
    };
    const summary = JSON.parse(artifacts.summaryJson) as {
      sourceArtifactReferences: { relativePath: string }[];
    };

    expect(manifest.relativeOutputPath).toBe(
      "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/determinized-pimc-probe-v0/cFp69",
    );
    expect(manifest.relativeOutputPath).not.toContain(process.cwd());
    for (const reference of summary.sourceArtifactReferences) {
      expect(reference.relativePath).toMatch(/^docs\//);
      expect(reference.relativePath).not.toContain(process.cwd());
    }
  });

  it("scans artifacts for hidden-info and search-strength hazard tokens", () => {
    const artifacts = serializeDeterminizedPimcProbeV0Artifacts(
      buildRobustProbe(),
    );

    expect(scanDeterminizedPimcProbeV0ArtifactsForHiddenInfo(artifacts)).toEqual(
      [],
    );
    expect(
      scanDeterminizedPimcProbeV0ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\nsourceId\nsampledWorld\nactionValue\nwinProbability\nseat_b:\n`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "sourceId",
        "sampledWorld",
        "actionValue",
        "winProbability",
        "runtime seat_b prefix",
      ]),
    );
  });

  it("renders cFp69 non-claims and the cFp70 recommendation", () => {
    const artifacts = serializeDeterminizedPimcProbeV0Artifacts(
      buildRobustProbe(),
    );

    expect(artifacts.reportMarkdown).toContain("No rollout was run.");
    expect(artifacts.reportMarkdown).toContain(
      "No move was selected by search.",
    );
    expect(artifacts.reportMarkdown).toContain(
      "cFp70 should add the first one-ply sampled-world action-availability probe",
    );
  });
});
