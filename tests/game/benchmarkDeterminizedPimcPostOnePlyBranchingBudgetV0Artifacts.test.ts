import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcPostOnePlyBranchingBudgetV0,
  determinizedPimcPostOnePlyBranchingBudgetV0ArtifactHashes,
  scanDeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactsForHiddenInfo,
  serializeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts,
  type DeterminizedPimcActionAvailabilityV0RootRecord,
  type DeterminizedPimcActionAvailabilityV0SkippedRootRecord,
  type DeterminizedPimcActionAvailabilityV0Summary,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord,
  type DeterminizedPimcOnePlyOutcomeSkeletonV0Summary,
  type DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot,
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

const emptyBranchingStatusCounts = () => ({
  completed: 1,
  engine_command_exception: 0,
  engine_command_rejected: 0,
  move_command_conversion_failed: 0,
  one_ply_execution_deferred: 0,
  post_one_ply_actor_resolution_failed: 0,
  post_one_ply_legal_move_generation_failed: 0,
  post_one_ply_public_action_abstraction_failed: 0,
  sample_action_missing: 0,
});

const emptyActorCounts = () => ({
  actor_resolution_failed: 0,
  no_actor: 0,
  policy_actor: 1,
  system_round_end_resolver: 0,
  terminal_game_end: 0,
});

const emptyPhaseCounts = () => ({
  game_end: 0,
  mulligan: 0,
  playing: 1,
  round_end: 0,
});

const emptyNestedCounts = () => ({
  choose_mulligan: {},
  choose_prompt_option: {},
  pass: {},
  play_card: {},
  resolve_round_end: {},
  use_leader: {},
});

const observedFromCfp71 = (
  root: DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord,
): DeterminizedPimcPostOnePlyBranchingBudgetV0ObservedRoot => ({
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
  faction: root.faction,
  deckPresetId: root.deckPresetId,
  rootPublicFingerprint: root.rootPublicFingerprint,
  cfp68RootPublicFingerprint: root.rootPublicFingerprint,
  cfp69LegalMoveCount: root.cfp69PublicActionCount,
  cfp69PublicActionCount: root.cfp69PublicActionCount,
  cfp70AvailabilityStatus: root.cfp70AvailabilityStatus,
  cfp70RootActionBucketCount: root.cfp70RootActionBucketCount,
  cfp71OutcomeStatus: root.probeStatus,
  cfp71PublicActionSamplePairCount: root.publicActionSamplePairCount,
  cfp71CompletedPairCount: root.completedPairCount,
  cfp71FailedOrDeferredPairCount: root.failedOrDeferredPairCount,
  cfp71OutcomeDivergenceCount: root.outcomeDivergenceCount,
  sampleCountRequested: root.sampleCountRequested,
  sampleCountGenerated: root.sampleCountGenerated,
  sampleCountChecked: root.sampleCountChecked,
  sampleCountBranchingFailed: 0,
  rootPublicActionCount: root.rootPublicActionCount,
  firstPlyPublicActionSamplePairCount: 1,
  completedBranchingPairCount: 1,
  failedOrDeferredBranchingPairCount: 0,
  sampleActionMissingPairCount: 0,
  moveCommandConversionFailedPairCount: 0,
  engineCommandRejectedPairCount: 0,
  engineCommandExceptionPairCount: 0,
  actorResolutionFailedPairCount: 0,
  legalMoveGenerationFailedPairCount: 0,
  publicActionAbstractionFailedPairCount: 0,
  onePlyExecutionDeferredPairCount: 0,
  branchingStatusCounts: emptyBranchingStatusCounts(),
  postOnePlyActorCounts: emptyActorCounts(),
  postOnePlyPhaseCounts: emptyPhaseCounts(),
  nextLegalMoveCounts: [4],
  nextPublicActionCounts: [3],
  nextPublicActionCollisionCounts: [1],
  largestNextPublicActionBucketSizes: [2],
  nextPublicActionTargetExpansionCounts: [1],
  branchingBudgetBucket: "small",
  branchingRiskBucket: "small",
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
    ).slice(0, 3);
  const skippedRoots =
    readArtifactJsonl<DeterminizedProbeContractSkippedRootRecord>(
      suiteId,
      "determinized-probe-contract",
      "cFp68",
      "skipped-roots.jsonl",
    ).slice(0, 2);
  const cFp69ProbeRoots = readArtifactJsonl<DeterminizedPimcProbeV0RootRecord>(
    suiteId,
    "determinized-pimc-probe-v0",
    "cFp69",
    "probe-roots.jsonl",
  ).slice(0, 3);
  const cFp69SkippedRoots =
    readArtifactJsonl<DeterminizedPimcProbeV0SkippedRootRecord>(
      suiteId,
      "determinized-pimc-probe-v0",
      "cFp69",
      "skipped-roots.jsonl",
    ).slice(0, 2);
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
    ).slice(0, 3);
  const cFp70SkippedRoots =
    readArtifactJsonl<DeterminizedPimcActionAvailabilityV0SkippedRootRecord>(
      suiteId,
      "determinized-pimc-action-availability-v0",
      "cFp70",
      "skipped-roots.jsonl",
    ).slice(0, 2);
  const cFp71Summary =
    readArtifactJson<DeterminizedPimcOnePlyOutcomeSkeletonV0Summary>(
      suiteId,
      "determinized-pimc-one-ply-outcome-skeleton-v0",
      "cFp71",
      "summary.json",
    );
  const cFp71OutcomeRoots =
    readArtifactJsonl<DeterminizedPimcOnePlyOutcomeSkeletonV0RootRecord>(
      suiteId,
      "determinized-pimc-one-ply-outcome-skeleton-v0",
      "cFp71",
      "outcome-roots.jsonl",
    ).slice(0, 3);
  const cFp71SkippedRoots =
    readArtifactJsonl<DeterminizedPimcOnePlyOutcomeSkeletonV0SkippedRootRecord>(
      suiteId,
      "determinized-pimc-one-ply-outcome-skeleton-v0",
      "cFp71",
      "skipped-roots.jsonl",
    ).slice(0, 2);

  return buildDeterminizedPimcPostOnePlyBranchingBudgetV0({
    probeRunId: `${suiteId}:determinized-pimc-post-one-ply-branching-budget-v0:cFp72:test`,
    suiteId,
    contractSummary,
    cFp68EligibleRoots: eligibleRoots,
    cFp68SkippedRoots: skippedRoots,
    cFp69ProbeRoots,
    cFp69SkippedRoots,
    cFp70AvailabilitySummary: cFp70Summary,
    cFp70AvailabilityRoots,
    cFp70SkippedRoots,
    cFp71OutcomeSummary: cFp71Summary,
    cFp71OutcomeRoots,
    cFp71SkippedRoots,
    observedRoots: cFp71OutcomeRoots.map(observedFromCfp71),
    observedAggregateCounts: {
      branchingStatusCountsByFirstPlyPublicActionKind: emptyNestedCounts(),
      actorCountsByFirstPlyPublicActionKind: emptyNestedCounts(),
      budgetBucketCountsByFirstPlyPublicActionKind: emptyNestedCounts(),
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
    sourceCfp71ArtifactReferences: [
      {
        label: "cFp71 summary",
        relativePath:
          "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-one-ply-outcome-skeleton-v0/cFp71/summary.json",
        sha256: "test-hash-cfp71-summary",
      },
    ],
  });
};

describe("determinized PIMC post-one-ply branching budget v0 artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const result = buildCurrentProbe();
    const first =
      serializeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts(result);
    const second =
      serializeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts(result);

    expect(
      determinizedPimcPostOnePlyBranchingBudgetV0ArtifactHashes(first),
    ).toEqual(
      determinizedPimcPostOnePlyBranchingBudgetV0ArtifactHashes(second),
    );
    expect(first.summaryJson).toBe(second.summaryJson);
    expect(first.branchingRootsJsonl).toBe(second.branchingRootsJsonl);
    expect(first.skippedRootsJsonl).toBe(second.skippedRootsJsonl);
    expect(first.reportMarkdown).toBe(second.reportMarkdown);
  });

  it("keeps manifest and source artifact paths repo-relative and portable", () => {
    const artifacts =
      serializeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts(
        buildCurrentProbe(),
      );
    const manifest = JSON.parse(artifacts.manifestJson) as {
      relativeOutputPath: string;
    };
    const summary = JSON.parse(artifacts.summaryJson) as {
      sourceCfp68ArtifactReferences: { relativePath: string }[];
      sourceCfp69ArtifactReferences: { relativePath: string }[];
      sourceCfp70ArtifactReferences: { relativePath: string }[];
      sourceCfp71ArtifactReferences: { relativePath: string }[];
    };

    expect(manifest.relativeOutputPath).toBe(
      "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-v1/determinized-pimc-post-one-ply-branching-budget-v0/cFp72",
    );
    expect(manifest.relativeOutputPath).not.toContain(process.cwd());
    for (const reference of [
      ...summary.sourceCfp68ArtifactReferences,
      ...summary.sourceCfp69ArtifactReferences,
      ...summary.sourceCfp70ArtifactReferences,
      ...summary.sourceCfp71ArtifactReferences,
    ]) {
      expect(reference.relativePath).toMatch(/^docs\//);
      expect(reference.relativePath).not.toContain(process.cwd());
    }
  });

  it("scans artifacts for hidden-info and value/ranking hazard tokens", () => {
    const artifacts =
      serializeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts(
        buildCurrentProbe(),
      );

    expect(
      scanDeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactsForHiddenInfo(
        artifacts,
      ),
    ).toEqual([]);
    expect(
      scanDeterminizedPimcPostOnePlyBranchingBudgetV0ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\nsourceId\ncardId\nmoveId\nhandSourceCounts\nsampledWorld\nsampled_world\nfinalState\nactionValue\nwinProbability\nseat_b:\ncommand\nevent\nsourceMap\nrewardTarget\nscoreQuality\n`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "sourceId",
        "cardId",
        "moveId",
        "handSourceCounts",
        "sampledWorld",
        "sampledWorld snake",
        "finalState",
        "actionValue",
        "winProbability",
        "runtime seat_b prefix",
        "raw lower command token",
        "raw lower event token",
        "sourceMap",
        "rewardTarget",
        "scoreQuality",
      ]),
    );
  });

  it("renders cFp72 non-claims and cFp73 recommendation", () => {
    const artifacts =
      serializeDeterminizedPimcPostOnePlyBranchingBudgetV0Artifacts(
        buildCurrentProbe(),
      );

    expect(artifacts.reportMarkdown).toContain("No second ply was executed.");
    expect(artifacts.reportMarkdown).toContain("No rollout was run.");
    expect(artifacts.reportMarkdown).toContain(
      "No move was selected by search.",
    );
    expect(artifacts.reportMarkdown).toContain(
      "cFp73 should choose a benchmark-only high-branching casebook",
    );
  });
});
