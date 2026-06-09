import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcActionAvailabilityV0,
  buildDeterminizedPimcActionAvailabilityV0RootKey,
  determinizedPimcActionAvailabilityV0ArtifactHashes,
  scanDeterminizedPimcActionAvailabilityV0ArtifactsForHiddenInfo,
  serializeDeterminizedPimcActionAvailabilityV0Artifacts,
  type DeterminizedPimcActionAvailabilityV0ObservedRoot,
  type DeterminizedPimcProbeV0RootRecord,
  type DeterminizedPimcProbeV0SkippedRootRecord,
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

const observedFromEligibleRoot = (
  root: DeterminizedProbeContractEligibleRootRecord,
  cFp69Root: DeterminizedPimcProbeV0RootRecord,
): DeterminizedPimcActionAvailabilityV0ObservedRoot => ({
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
  faction: root.faction as DeterminizedPimcActionAvailabilityV0ObservedRoot["faction"],
  deckPresetId: root.deckPresetId,
  rootPublicFingerprint: root.rootPublicFingerprint,
  cfp68RootPublicFingerprint: root.rootPublicFingerprint,
  cfp69LegalMoveCount: cFp69Root.legalMoveCount,
  cfp69PublicActionCount: cFp69Root.publicActionCount,
  sampleCountRequested: root.sampleCountRequested,
  sampleCountGenerated: root.sampleCountGenerated,
  sampleCountChecked: root.sampleCountValid,
  sampleCountAvailabilityFailed: 0,
  sampleAvailabilityStatusCounts: {
    all_root_actions_available: root.sampleCountValid,
    availability_disagreement: 0,
    public_action_abstraction_failed: 0,
    sampled_legal_move_generation_failed: 0,
    sampled_world_rebuild_failed: 0,
  },
  rootActionBucketCount: cFp69Root.publicActionCount,
  sampledActionBucketCounts: Array.from(
    { length: root.sampleCountValid },
    () => cFp69Root.publicActionCount,
  ),
  allRootActionsAvailableInAllSamples: true,
  rootActionBucketsMissingInAnySample: 0,
  sampleActionBucketsExtraInAnySample: 0,
  availabilityDisagreementCount: 0,
  missingActionKindCounts: {
    choose_mulligan: 0,
    choose_prompt_option: 0,
    pass: 0,
    play_card: 0,
    resolve_round_end: 0,
    use_leader: 0,
  },
  extraActionKindCounts: {
    choose_mulligan: 0,
    choose_prompt_option: 0,
    pass: 0,
    play_card: 0,
    resolve_round_end: 0,
    use_leader: 0,
  },
  missingTargetKindCounts: {
    board_row: 0,
    card: 0,
    card_instance_set: 0,
    deck_card_instance: 0,
    deck_card_source: 0,
    none: 0,
    row_horn: 0,
    weather: 0,
  },
  extraTargetKindCounts: {
    board_row: 0,
    card: 0,
    card_instance_set: 0,
    deck_card_instance: 0,
    deck_card_source: 0,
    none: 0,
    row_horn: 0,
    weather: 0,
  },
  missingTargetSideCounts: {
    none: 0,
    opponent: 0,
    own: 0,
    public: 0,
  },
  extraTargetSideCounts: {
    none: 0,
    opponent: 0,
    own: 0,
    public: 0,
  },
  probeStatus: "completed",
});

const buildCurrentProbe = () => {
  const suiteId = "benchmark-v1-starter-matrix-v1";
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
  const cFp69ProbeRoots = readArtifactJsonl<DeterminizedPimcProbeV0RootRecord>(
    suiteId,
    "determinized-pimc-probe-v0",
    "cFp69",
    "probe-roots.jsonl",
  );
  const cFp69SkippedRoots =
    readArtifactJsonl<DeterminizedPimcProbeV0SkippedRootRecord>(
      suiteId,
      "determinized-pimc-probe-v0",
      "cFp69",
      "skipped-roots.jsonl",
    );
  const cFp69ByKey = new Map(
    cFp69ProbeRoots.map((root) => [
      buildDeterminizedPimcActionAvailabilityV0RootKey(root),
      root,
    ]),
  );

  return buildDeterminizedPimcActionAvailabilityV0({
    probeRunId: `${suiteId}:determinized-pimc-action-availability-v0:cFp70:test`,
    suiteId,
    contractSummary,
    cFp68EligibleRoots: eligibleRoots,
    cFp68SkippedRoots: skippedRoots,
    cFp69ProbeRoots,
    cFp69SkippedRoots,
    observedRoots: eligibleRoots.map((root) =>
      observedFromEligibleRoot(root, cFp69ByKey.get(
        buildDeterminizedPimcActionAvailabilityV0RootKey(root),
      )!),
    ),
    sourceCfp68ArtifactReferences: [
      {
        label: "cFp68 summary",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-probe-contract/cFp68/summary.json",
        sha256: "test-hash-cfp68-summary",
      },
    ],
    sourceCfp69ArtifactReferences: [
      {
        label: "cFp69 summary",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-probe-v0/cFp69/summary.json",
        sha256: "test-hash-cfp69-summary",
      },
    ],
  });
};

describe("determinized PIMC action availability v0 artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const result = buildCurrentProbe();
    const first = serializeDeterminizedPimcActionAvailabilityV0Artifacts(result);
    const second = serializeDeterminizedPimcActionAvailabilityV0Artifacts(result);

    expect(determinizedPimcActionAvailabilityV0ArtifactHashes(first)).toEqual(
      determinizedPimcActionAvailabilityV0ArtifactHashes(second),
    );
    expect(first.summaryJson).toBe(second.summaryJson);
    expect(first.availabilityRootsJsonl).toBe(second.availabilityRootsJsonl);
    expect(first.skippedRootsJsonl).toBe(second.skippedRootsJsonl);
    expect(first.reportMarkdown).toBe(second.reportMarkdown);
  });

  it("keeps manifest and source artifact paths repo-relative and portable", () => {
    const artifacts = serializeDeterminizedPimcActionAvailabilityV0Artifacts(
      buildCurrentProbe(),
    );
    const manifest = JSON.parse(artifacts.manifestJson) as {
      relativeOutputPath: string;
    };
    const summary = JSON.parse(artifacts.summaryJson) as {
      sourceCfp68ArtifactReferences: { relativePath: string }[];
      sourceCfp69ArtifactReferences: { relativePath: string }[];
    };

    expect(manifest.relativeOutputPath).toBe(
      "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70",
    );
    expect(manifest.relativeOutputPath).not.toContain(process.cwd());
    for (const reference of [
      ...summary.sourceCfp68ArtifactReferences,
      ...summary.sourceCfp69ArtifactReferences,
    ]) {
      expect(reference.relativePath).toMatch(/^docs\//);
      expect(reference.relativePath).not.toContain(process.cwd());
    }
  });

  it("scans artifacts for hidden-info and search-strength hazard tokens", () => {
    const artifacts = serializeDeterminizedPimcActionAvailabilityV0Artifacts(
      buildCurrentProbe(),
    );

    expect(
      scanDeterminizedPimcActionAvailabilityV0ArtifactsForHiddenInfo(artifacts),
    ).toEqual([]);
    expect(
      scanDeterminizedPimcActionAvailabilityV0ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\nsourceId\nhandSourceCounts\nsampledWorld\nactionValue\nwinProbability\nseat_b:\n`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "sourceId",
        "handSourceCounts",
        "sampledWorld",
        "actionValue",
        "winProbability",
        "runtime seat_b prefix",
      ]),
    );
  });

  it("renders cFp70 non-claims and cFp71 recommendation", () => {
    const artifacts = serializeDeterminizedPimcActionAvailabilityV0Artifacts(
      buildCurrentProbe(),
    );

    expect(artifacts.reportMarkdown).toContain("No rollout was run.");
    expect(artifacts.reportMarkdown).toContain(
      "No move was selected by search.",
    );
    expect(artifacts.reportMarkdown).toContain(
      "cFp71 should choose between a benchmark-only one-ply public action outcome skeleton",
    );
  });
});
