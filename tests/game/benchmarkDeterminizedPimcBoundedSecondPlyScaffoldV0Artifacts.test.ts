import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcBoundedSecondPlyScaffoldV0,
  determinizedPimcBoundedSecondPlyScaffoldV0ArtifactHashes,
  scanDeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactsForHiddenInfo,
  serializeDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";

const buildResult = () =>
  buildDeterminizedPimcBoundedSecondPlyScaffoldV0({
    scaffoldRunId:
      `${suiteId}:determinized-pimc-bounded-second-ply-scaffold-v0:cFp74:test`,
    suiteId,
    contractSummary: {
      suiteId,
      contractRunId: `${suiteId}:determinized-probe-contract:cFp68`,
      sourceBenchmarkSuiteId: suiteId,
      contractStatus: "probe_ready",
      totalCfp61RootCount: 1,
      eligibleRootCount: 1,
      skippedRootCount: 0,
      matchCount: 1,
      sourceSamplerRunIds: { materialization: "sampler-run" },
    } as never,
    cFp68EligibleRoots: [
      {
        suiteId,
        matchupId: "starter-nr-vs-ng",
        seed: "seed-1",
        step: 1,
        decisionIndex: 1,
        phase: "playing",
        round: 1,
        seatId: "seat_a",
        policyId: "legal-heuristic-v1",
        faction: "northern_realms",
        deckPresetId: "official-northern-realms-starter",
        rootPublicFingerprint: "fingerprint-1",
        sampleCountRequested: 8,
        sampleCountGenerated: 8,
        sampleCountValid: 8,
        sampleCountInvalid: 0,
      } as never,
    ],
    cFp68SkippedRoots: [],
    cFp69ProbeRoots: [
      {
        suiteId,
        matchupId: "starter-nr-vs-ng",
        seed: "seed-1",
        step: 1,
        decisionIndex: 1,
        phase: "playing",
        round: 1,
        seatId: "seat_a",
        policyId: "legal-heuristic-v1",
        faction: "northern_realms",
        deckPresetId: "official-northern-realms-starter",
        rootPublicFingerprint: "fingerprint-1",
        probeRunId: `${suiteId}:determinized-pimc-probe-v0:cFp69`,
      } as never,
    ],
    cFp69SkippedRoots: [],
    cFp70AvailabilitySummary: {
      probeRunId: `${suiteId}:determinized-pimc-action-availability-v0:cFp70`,
    } as never,
    cFp70AvailabilityRoots: [
      {
        suiteId,
        matchupId: "starter-nr-vs-ng",
        seed: "seed-1",
        step: 1,
        decisionIndex: 1,
        phase: "playing",
        round: 1,
        seatId: "seat_a",
        policyId: "legal-heuristic-v1",
        faction: "northern_realms",
        deckPresetId: "official-northern-realms-starter",
        rootPublicFingerprint: "fingerprint-1",
      } as never,
    ],
    cFp70SkippedRoots: [],
    cFp71OutcomeSummary: {
      probeRunId: `${suiteId}:determinized-pimc-one-ply-outcome-skeleton-v0:cFp71`,
    } as never,
    cFp71OutcomeRoots: [
      {
        suiteId,
        matchupId: "starter-nr-vs-ng",
        seed: "seed-1",
        step: 1,
        decisionIndex: 1,
        phase: "playing",
        round: 1,
        seatId: "seat_a",
        policyId: "legal-heuristic-v1",
        faction: "northern_realms",
        deckPresetId: "official-northern-realms-starter",
        rootPublicFingerprint: "fingerprint-1",
      } as never,
    ],
    cFp71SkippedRoots: [],
    cFp72BranchingSummary: {
      probeRunId:
        `${suiteId}:determinized-pimc-post-one-ply-branching-budget-v0:cFp72`,
      suiteId,
      sourceBenchmarkSuiteId: suiteId,
      probeReadinessStatus: "probe_ready",
      branchingRootCount: 1,
      skippedRootCount: 0,
      skippedRootPercentage: 0,
    } as never,
    cFp72BranchingRoots: [
      {
        suiteId,
        matchupId: "starter-nr-vs-ng",
        seed: "seed-1",
        step: 1,
        decisionIndex: 1,
        phase: "playing",
        round: 1,
        seatId: "seat_a",
        policyId: "legal-heuristic-v1",
        faction: "northern_realms",
        deckPresetId: "official-northern-realms-starter",
        rootPublicFingerprint: "fingerprint-1",
        rootPublicActionCount: 1,
        firstPlyPublicActionSamplePairCount: 8,
        postOnePlyPublicActionBudgetTotal: 8,
        postOnePlyPublicActionBudgetAverage: 1,
        nextPublicActionCountMax: 1,
        largestNextPublicActionBucketSizeMax: 1,
        nextPublicActionTargetExpansionCountMax: 0,
        branchingBudgetBucket: "tiny",
        branchingRiskBucket: "tiny",
        postOnePlyActorCounts: { policy_actor: 8 },
        postOnePlyPhaseCounts: { playing: 8 },
        sampleCountRequested: 8,
        sampleCountChecked: 8,
        failedOrDeferredBranchingPairCount: 0,
        probeStatus: "completed",
      } as never,
    ],
    cFp72SkippedRoots: [],
    cFp73CasebookSummary: {
      casebookRunId:
        `${suiteId}:determinized-pimc-post-one-ply-branching-budget-casebook:cFp73`,
      suiteId,
      sourceBenchmarkSuiteId: suiteId,
      casebookReadinessStatus: "casebook_ready",
      casebookRootCount: 0,
      skippedRootCount: 0,
    } as never,
    cFp73CasebookRoots: [],
    cFp73SkippedRoots: [],
    observedRoots: [
      {
        suiteId,
        matchupId: "starter-nr-vs-ng",
        seed: "seed-1",
        step: 1,
        decisionIndex: 1,
        phase: "playing",
        round: 1,
        seatId: "seat_a",
        policyId: "legal-heuristic-v1",
        faction: "northern_realms",
        deckPresetId: "official-northern-realms-starter",
        rootPublicFingerprint: "fingerprint-1",
        sampleCountRequested: 8,
        sampleCountGenerated: 8,
        sampleCountChecked: 8,
        plannedSecondPlyPairCount: 8,
        completedSecondPlyPairCount: 8,
        failedOrDeferredSecondPlyPairCount: 0,
        secondPlyExecutionStatus: "completed",
        secondPlyFailureReasonCounts: {
          sampled_root_rebuild_deferred: 0,
          second_ply_engine_rejected: 0,
        },
        secondPlyTransitionKindCounts: {
          match_completed: 0,
          same_phase_same_round: 8,
        },
        postSecondPlyPhaseCounts: { game_end: 0, playing: 8 },
        postSecondPlyActorCounts: { policy_actor: 8, terminal_game_end: 0 },
        secondPlyPublicActionKindCounts: { pass: 8, play_card: 0 },
        secondPlyTargetKindCounts: { card: 0, none: 8 },
        secondPlyTargetSideCounts: { none: 8, opponent: 0 },
        secondPlyOutcomeRiskBucket: "none",
      },
    ],
    sourceArtifactReferences: {
      cFp68: [{ label: "cFp68", relativePath: "cFp68/summary.json", sha256: "a" }],
      cFp69: [{ label: "cFp69", relativePath: "cFp69/summary.json", sha256: "b" }],
      cFp70: [{ label: "cFp70", relativePath: "cFp70/summary.json", sha256: "c" }],
      cFp71: [{ label: "cFp71", relativePath: "cFp71/summary.json", sha256: "d" }],
      cFp72: [{ label: "cFp72", relativePath: "cFp72/summary.json", sha256: "e" }],
      cFp73: [{ label: "cFp73", relativePath: "cFp73/summary.json", sha256: "f" }],
    },
  });

const buildArtifacts = () =>
  serializeDeterminizedPimcBoundedSecondPlyScaffoldV0Artifacts(buildResult());

const firstSecondPlyRow = () =>
  JSON.parse(buildArtifacts().secondPlyRootsJsonl.trimEnd().split("\n")[0]) as
    Record<string, unknown>;

describe("determinized PIMC bounded second-ply scaffold v0 artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const first = buildArtifacts();
    const second = buildArtifacts();

    expect(first).toEqual(second);
    expect(
      determinizedPimcBoundedSecondPlyScaffoldV0ArtifactHashes(first),
    ).toEqual(determinizedPimcBoundedSecondPlyScaffoldV0ArtifactHashes(second));
    expect(JSON.parse(first.summaryJson)).toEqual(
      expect.objectContaining({
        inCapRootCount: 1,
        overBudgetRootCount: 0,
        completedSecondPlyPairCount: 8,
      }),
    );
  });

  it("omits zero-valued entries from compact second-ply row count maps", () => {
    const row = firstSecondPlyRow();

    expect(row.secondPlyFailureReasonCounts).toEqual({});
    expect(row.secondPlyTransitionKindCounts).not.toHaveProperty(
      "match_completed",
    );
    expect(row.postSecondPlyPhaseCounts).not.toHaveProperty("game_end");
    expect(row.postSecondPlyActorCounts).not.toHaveProperty(
      "terminal_game_end",
    );
    expect(row.secondPlyPublicActionKindCounts).not.toHaveProperty("play_card");
    expect(row.secondPlyTargetKindCounts).not.toHaveProperty("card");
    expect(row.secondPlyTargetSideCounts).not.toHaveProperty("opponent");
  });

  it("retains nonzero entries in compact second-ply row count maps", () => {
    const row = firstSecondPlyRow();

    expect(row.secondPlyTransitionKindCounts).toEqual({
      same_phase_same_round: 8,
    });
    expect(row.postSecondPlyPhaseCounts).toEqual({ playing: 8 });
    expect(row.postSecondPlyActorCounts).toEqual({ policy_actor: 8 });
    expect(row.secondPlyPublicActionKindCounts).toEqual({ pass: 8 });
    expect(row.secondPlyTargetKindCounts).toEqual({ none: 8 });
    expect(row.secondPlyTargetSideCounts).toEqual({ none: 8 });
  });

  it("omits repeated run constants from second-ply rows while keeping them in manifest and summary", () => {
    const artifacts = buildArtifacts();
    const row = JSON.parse(
      artifacts.secondPlyRootsJsonl.trimEnd().split("\n")[0],
    ) as Record<string, unknown>;
    const manifest = JSON.parse(artifacts.manifestJson) as Record<
      string,
      unknown
    >;
    const summary = JSON.parse(artifacts.summaryJson) as {
      scaffoldRunId: string;
      sourceCfp72RunId: string;
      sourceCfp73RunId: string;
      capPolicy: {
        version: string;
        secondPlyPairCapPerRoot: number;
        rootPublicActionCap: number;
        postOnePlyPublicActionCapPerState: number;
        sampleCountCapPerRoot: number;
      };
    };

    expect(row).not.toHaveProperty("schemaVersion");
    expect(row).not.toHaveProperty("scaffoldRunId");
    expect(row).not.toHaveProperty("sourceCfp72RunId");
    expect(row).not.toHaveProperty("sourceCfp73RunId");
    expect(row).not.toHaveProperty("capPolicyVersion");
    expect(row).not.toHaveProperty("secondPlyPairCapPerRoot");
    expect(row).not.toHaveProperty("rootPublicActionCap");
    expect(row).not.toHaveProperty("postOnePlyPublicActionCapPerState");
    expect(row).not.toHaveProperty("sampleCountCapPerRoot");

    expect(manifest.scaffoldRunId).toBe(summary.scaffoldRunId);
    expect(manifest.sourceCfp72RunId).toBe(summary.sourceCfp72RunId);
    expect(manifest.sourceCfp73RunId).toBe(summary.sourceCfp73RunId);
    expect(manifest.capPolicyVersion).toBe(summary.capPolicy.version);
    expect(manifest.rootSchemaVersion).toBe(
      "determinized-pimc-bounded-second-ply-scaffold-v0-root-v1",
    );
    expect(summary.capPolicy).toEqual(
      expect.objectContaining({
        secondPlyPairCapPerRoot: 512,
        rootPublicActionCap: 16,
        postOnePlyPublicActionCapPerState: 16,
        sampleCountCapPerRoot: 8,
      }),
    );
  });

  it("rejects injected hidden-info and search-strength hazard tokens", () => {
    const artifacts = buildArtifacts();

    expect(
      scanDeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactsForHiddenInfo(
        artifacts,
      ),
    ).toEqual([]);
    expect(
      scanDeterminizedPimcBoundedSecondPlyScaffoldV0ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\nsourceId cardId moveId sampledWorld sampled_world sourceMap finalState bestAction selectedAction actionValue expectedValue valueEstimate rewardTarget payoff rolloutReward winProbability principalVariation scoreQuality seat_b:`,
        reportMarkdown: `${artifacts.reportMarkdown}\nGeralt of Rivia\nneutral.geralt-of-rivia\n`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "sourceId",
        "cardId",
        "moveId",
        "sampledWorld",
        "sampled_world",
        "sourceMap",
        "finalState",
        "bestAction",
        "selectedAction",
        "actionValue",
        "expectedValue",
        "valueEstimate",
        "rewardTarget",
        "payoff",
        "rolloutReward",
        "winProbability",
        "principalVariation",
        "scoreQuality",
        "runtime seat_b prefix",
        "catalog identity:Geralt of Rivia",
        "catalog identity:neutral.geralt-of-rivia",
      ]),
    );
  });

  it("includes required non-claim language in the artifact report", () => {
    const artifacts = buildArtifacts();

    expect(artifacts.reportMarkdown).toContain(
      "cFp74 is execution-scaffold evidence only.",
    );
    expect(artifacts.reportMarkdown).toContain("No rollout was run.");
    expect(artifacts.reportMarkdown).toContain("No product AI behavior changed.");
  });
});
