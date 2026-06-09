import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcOnePlyOutcomeSkeletonV0,
  buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey,
  determinizedPimcOnePlyOutcomeSkeletonV0ArtifactHashes,
  scanDeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactsForHiddenInfo,
  serializeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts,
  type DeterminizedPimcActionAvailabilityV0RootRecord,
  type DeterminizedPimcActionAvailabilityV0SkippedRootRecord,
  type DeterminizedPimcActionAvailabilityV0Summary,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot,
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

const emptyStatusCounts = () => ({
  completed: 0,
  engine_command_exception: 0,
  engine_command_rejected: 0,
  move_command_conversion_failed: 0,
  one_ply_execution_deferred: 0,
  outcome_classification_failed: 0,
  public_action_abstraction_failed: 0,
  sample_action_missing: 0,
  sampled_legal_move_generation_failed: 0,
  sampled_world_rebuild_failed: 0,
});

const emptyOutcomeKindCounts = () => ({
  card_play: 0,
  leader_use: 0,
  mulligan_selection: 0,
  pass: 0,
  prompt_resolution: 0,
  round_end_resolution: 0,
  unknown_public_transition: 0,
});

const emptyTransitionKindCounts = () => ({
  match_completed: 0,
  phase_changed_same_round: 0,
  round_advanced: 0,
  same_phase_same_round: 0,
  transition_unknown: 0,
});

const emptyNestedCounts = () => ({
  choose_mulligan: {},
  choose_prompt_option: {},
  pass: {},
  play_card: {},
  resolve_round_end: {},
  use_leader: {},
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
  const cFp70Summary =
    readArtifactJson<DeterminizedPimcActionAvailabilityV0Summary>(
      suiteId,
      "determinized-pimc-action-availability-v0",
      "cFp70",
      "summary.json",
    );
  const cFp70AvailabilityRoots =
    readArtifactJsonl<DeterminizedPimcActionAvailabilityV0RootRecord>(
      suiteId,
      "determinized-pimc-action-availability-v0",
      "cFp70",
      "availability-roots.jsonl",
    );
  const cFp70SkippedRoots =
    readArtifactJsonl<DeterminizedPimcActionAvailabilityV0SkippedRootRecord>(
      suiteId,
      "determinized-pimc-action-availability-v0",
      "cFp70",
      "skipped-roots.jsonl",
    );
  const cFp69ByKey = new Map(
    cFp69ProbeRoots.map((root) => [
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      root,
    ]),
  );
  const cFp70ByKey = new Map(
    cFp70AvailabilityRoots.map((root) => [
      buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      root,
    ]),
  );
  const observedRoots: DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot[] =
    eligibleRoots.map((root) => {
      const cfp69 = cFp69ByKey.get(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      )!;
      const cfp70 = cFp70ByKey.get(
        buildDeterminizedPimcOnePlyOutcomeSkeletonV0RootKey(root),
      )!;
      const pairCount = cfp70.rootActionBucketCount * root.sampleCountValid;
      const statusCounts = emptyStatusCounts();
      statusCounts.completed = pairCount;
      const outcomeCounts = emptyOutcomeKindCounts();
      outcomeCounts.unknown_public_transition = pairCount;
      const transitionCounts = emptyTransitionKindCounts();
      transitionCounts.same_phase_same_round = pairCount;
      return {
        suiteId: root.suiteId,
        matchupId: root.matchupId,
        seed: root.seed,
        ...(root.mirrorGroupId ? { mirrorGroupId: root.mirrorGroupId } : {}),
        ...(root.mirrorIndex === undefined
          ? {}
          : { mirrorIndex: root.mirrorIndex }),
        step: root.step,
        decisionIndex: root.decisionIndex,
        phase: root.phase,
        round: root.round,
        seatId: root.seatId,
        policyId: root.policyId,
        faction:
          root.faction as DeterminizedPimcOnePlyOutcomeSkeletonV0ObservedRoot["faction"],
        deckPresetId: root.deckPresetId,
        rootPublicFingerprint: root.rootPublicFingerprint,
        cfp68RootPublicFingerprint: root.rootPublicFingerprint,
        cfp69LegalMoveCount: cfp69.legalMoveCount,
        cfp69PublicActionCount: cfp69.publicActionCount,
        cfp70AvailabilityStatus: cfp70.probeStatus,
        cfp70RootActionBucketCount: cfp70.rootActionBucketCount,
        cfp70AllRootActionsAvailableInAllSamples:
          cfp70.allRootActionsAvailableInAllSamples,
        sampleCountRequested: root.sampleCountRequested,
        sampleCountGenerated: root.sampleCountGenerated,
        sampleCountChecked: root.sampleCountValid,
        sampleCountOutcomeFailed: 0,
        rootPublicActionCount: cfp70.rootActionBucketCount,
        publicActionSamplePairCount: pairCount,
        completedPairCount: pairCount,
        failedOrDeferredPairCount: 0,
        sampleActionMissingPairCount: 0,
        moveCommandConversionFailedPairCount: 0,
        engineCommandRejectedPairCount: 0,
        engineCommandExceptionPairCount: 0,
        outcomeClassificationFailedPairCount: 0,
        onePlyExecutionDeferredPairCount: 0,
        executionStatusCounts: statusCounts,
        publicOutcomeKindCounts: outcomeCounts,
        transitionKindCounts: transitionCounts,
        rootActionBucketsWithAnyFailure: 0,
        rootActionBucketsWithAnyDivergence: 0,
        outcomeDivergenceCount: 0,
        probeStatus: "completed",
      };
    });

  return buildDeterminizedPimcOnePlyOutcomeSkeletonV0({
    probeRunId: `${suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71:test`,
    suiteId,
    contractSummary,
    cFp68EligibleRoots: eligibleRoots,
    cFp68SkippedRoots: skippedRoots,
    cFp69ProbeRoots,
    cFp69SkippedRoots,
    cFp70AvailabilitySummary: cFp70Summary,
    cFp70AvailabilityRoots,
    cFp70SkippedRoots,
    observedRoots,
    observedAggregateCounts: {
      executionStatusCountsByPublicActionKind: emptyNestedCounts(),
      outcomeKindCountsByPublicActionKind: emptyNestedCounts(),
    },
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
    sourceCfp70ArtifactReferences: [
      {
        label: "cFp70 summary",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-action-availability-v0/cFp70/summary.json",
        sha256: "test-hash-cfp70-summary",
      },
    ],
  });
};

describe("determinized PIMC one-ply outcome skeleton v0 artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const result = buildCurrentProbe();
    const first = serializeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts(result);
    const second = serializeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts(result);

    expect(determinizedPimcOnePlyOutcomeSkeletonV0ArtifactHashes(first)).toEqual(
      determinizedPimcOnePlyOutcomeSkeletonV0ArtifactHashes(second),
    );
    expect(first.summaryJson).toBe(second.summaryJson);
    expect(first.outcomeRootsJsonl).toBe(second.outcomeRootsJsonl);
    expect(first.skippedRootsJsonl).toBe(second.skippedRootsJsonl);
    expect(first.reportMarkdown).toBe(second.reportMarkdown);
  });

  it("keeps manifest and source artifact paths repo-relative and portable", () => {
    const artifacts = serializeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts(
      buildCurrentProbe(),
    );
    const manifest = JSON.parse(artifacts.manifestJson) as {
      relativeOutputPath: string;
    };
    const summary = JSON.parse(artifacts.summaryJson) as {
      sourceCfp68ArtifactReferences: { relativePath: string }[];
      sourceCfp69ArtifactReferences: { relativePath: string }[];
      sourceCfp70ArtifactReferences: { relativePath: string }[];
    };

    expect(manifest.relativeOutputPath).toBe(
      "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71",
    );
    expect(manifest.relativeOutputPath).not.toContain(process.cwd());
    for (const reference of [
      ...summary.sourceCfp68ArtifactReferences,
      ...summary.sourceCfp69ArtifactReferences,
      ...summary.sourceCfp70ArtifactReferences,
    ]) {
      expect(reference.relativePath).toMatch(/^docs\//);
      expect(reference.relativePath).not.toContain(process.cwd());
    }
  });

  it("scans artifacts for hidden-info and search-strength hazard tokens", () => {
    const artifacts = serializeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts(
      buildCurrentProbe(),
    );

    expect(
      scanDeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactsForHiddenInfo(
        artifacts,
      ),
    ).toEqual([]);
    expect(
      scanDeterminizedPimcOnePlyOutcomeSkeletonV0ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\nsourceId\nhandSourceCounts\nsampledWorld\nactionValue\nwinProbability\nseat_b:\ncommand\nevent\nsourceMap\nrewardTarget\n`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "sourceId",
        "handSourceCounts",
        "sampledWorld",
        "actionValue",
        "winProbability",
        "runtime seat_b prefix",
        "raw lower command token",
        "raw lower event token",
        "sourceMap",
        "rewardTarget",
      ]),
    );
  });

  it("renders cFp71 non-claims and cFp72 recommendation", () => {
    const artifacts = serializeDeterminizedPimcOnePlyOutcomeSkeletonV0Artifacts(
      buildCurrentProbe(),
    );

    expect(artifacts.reportMarkdown).toContain("No rollout was run.");
    expect(artifacts.reportMarkdown).toContain(
      "No move was selected by search.",
    );
    expect(artifacts.reportMarkdown).toContain(
      "cFp72 should inspect cFp71 one-ply failure",
    );
  });
});
