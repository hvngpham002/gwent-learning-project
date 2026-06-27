import { describe, expect, it } from "vitest";

import {
  buildSearchConsumerActionFeatureDictionaryV0Result,
  CFP80_EXPLICIT_NON_CLAIMS,
  CFP81_RECOMMENDATION_ACTION_FEATURE_CASEBOOK,
  scanSearchConsumerActionFeatureDictionaryV0ArtifactsForHiddenInfo,
  searchConsumerActionFeatureDictionaryV0ArtifactFiles,
  searchConsumerActionFeatureDictionaryV0ArtifactHashes,
  searchConsumerActionFeatureDictionaryV0CompactActionSizeLabel,
  serializeSearchConsumerActionFeatureDictionaryV0Artifacts,
  type SearchConsumerActionFeatureDictionaryV0BuildInput,
  type SearchConsumerActionFeatureDictionaryV0SourceArtifactReference,
  type SearchConsumerActionFeatureDictionaryV0SourceRunIds,
  type SearchConsumerActionFeaturesV1ActionFeatureRow,
  type SearchConsumerActionFeaturesV1RootFeatureRow,
  type SearchConsumerActionFeaturesV1SkippedRootRow,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";
const featureRunId = "cFp80";
const sourceCfp79RunId = "cFp79";
const sourceRunIds: SearchConsumerActionFeatureDictionaryV0SourceRunIds = {
  cfp79: sourceCfp79RunId,
};

const identity = {
  suiteId,
  matchupId: "starter-nr-vs-ng",
  seed: "seed-1",
  mirrorGroupId: "starter-nr-vs-ng:seed-1",
  mirrorIndex: 0 as const,
  step: 10,
  decisionIndex: 9,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  rootPublicFingerprint: "fingerprint-1",
};

const rootFeature = (): SearchConsumerActionFeaturesV1RootFeatureRow => ({
  ...identity,
  schemaVersion: "search-consumer-action-features-v1-root-feature-v1",
  featureRunId: sourceCfp79RunId,
  rootRef: "root_000001",
  consumerReadinessStatus: "features_ready",
  sourceConsistencyStatus: "ready",
  cFp68EligibilityStatus: "eligible_valid_root",
  cFp69ProbeStatus: "completed",
  cFp69PublicActionCount: 1,
  cFp69PublicActionKindCounts: { pass: 1 },
  cFp69TargetKindCounts: { none: 1 },
  cFp69TargetSideCounts: { none: 1 },
  cFp70ProbeStatus: "completed",
  cFp70AvailabilityDisagreementCount: 0,
  cFp70AvailabilityRiskBucket: "none",
  cFp71ProbeStatus: "completed",
  cFp71PublicActionSamplePairCount: 8,
  cFp71OutcomeDivergenceCount: 0,
  cFp71OutcomeRiskBucket: "none",
  cFp71PublicOutcomeKindCounts: { same_phase_same_round: 8 },
  cFp71TransitionKindCounts: { same_phase_same_round: 8 },
  cFp72ProbeStatus: "completed",
  cFp72PostOnePlyPublicActionBudgetTotal: 8,
  cFp72PostOnePlyPublicActionBudgetAverage: 1,
  cFp72BranchingBudgetBucket: "tiny",
  cFp72BranchingRiskBucket: "tiny",
  cFp72NextPublicActionCountMax: 1,
  cFp72LargestNextPublicActionBucketSizeMax: 1,
  cFp72PostOnePlyActorCounts: { policy_actor: 8 },
  cFp72PostOnePlyPhaseCounts: { playing: 8 },
  cFp73CasebookPresence: "not_in_casebook",
  cFp73PrimaryCasebookLabel: "not_in_casebook",
  cFp73BudgetPressureLabel: "low",
  cFp73TransitionContextLabel: "ordinary_policy_actor",
  cFp74CapStatus: "in_cap",
  cFp74PlannedSecondPlyPairCount: 8,
  cFp74CompletedSecondPlyPairCount: 8,
  cFp74FailedOrDeferredSecondPlyPairCount: 0,
  cFp74SecondPlyExecutionStatus: "completed",
  cFp74SecondPlyOutcomeRiskBucket: "none",
  cFp74SecondPlyTransitionKindCounts: { same_phase_same_round: 8 },
  cFp74SecondPlyPublicActionKindCounts: { pass: 8 },
  cFp74SecondPlyTargetKindCounts: { none: 8 },
  cFp74SecondPlyTargetSideCounts: { none: 8 },
});

const actionFeature = (): SearchConsumerActionFeaturesV1ActionFeatureRow => ({
  schemaVersion: "search-consumer-action-features-v1-action-feature-v1",
  featureRunId: sourceCfp79RunId,
  rootRef: "root_000001",
  publicActionRef: "public_action_000",
  kind: "pass",
  ordinal: 0,
  moveCount: 1,
  sourceClass: "none",
  moveCountBucket: "single",
  collisionCountWithinBucket: 0,
  hasCollision: false,
  hasTarget: false,
  hasStrengthBucket: false,
  hasOptionIndexLabel: false,
  rootFeatureRef: "root_000001",
  actionIdentityRef: "root_000001::public_action_000",
  sourceConsistencyStatus: "ready",
  consumerReadinessStatus: "features_ready",
});

const skippedRoot = (): SearchConsumerActionFeaturesV1SkippedRootRow => ({
  ...identity,
  step: 20,
  decisionIndex: 19,
  rootPublicFingerprint: "skipped-fingerprint-1",
  schemaVersion: "search-consumer-action-features-v1-skipped-root-v1",
  featureRunId: sourceCfp79RunId,
  consumerReadinessStatus: "skipped_invalid_root",
  eligibilityStatus: "skipped_invalid_root",
  skipReason: "sampler_invalid_public_zone_count_deficit",
  invalidReason: "insufficient_prior_remaining",
  cFp67PrimaryClassification: "candidate_valid_root_only_skip",
  cFp67TransferClassification: "public_transfer_memory_not_applicable",
  cFp67PersistentDeficitClassification: "persistent_public_zone_count_deficit",
  cFp67DeficitSizeClassification: "one_card_deficit",
  cFp67ProvenanceLabel: "single_zone_board",
  skipStage: "cFp68_cFp69_inherited",
  cFp76SkipStage: "inherited_sampler_skip",
  cFp78SkipStage: "cFp68_cFp69_inherited",
  cFp78IdentityReadinessStatus: "skipped_invalid_root",
  skipCounterDimensions: { suiteId, phase: "playing", round: "1" },
});

const sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[] =
  [
    { label: "cFp79:manifest.json", relativePath: "cFp79/manifest.json", sha256: "a" },
    { label: "cFp79:summary.json", relativePath: "cFp79/summary.json", sha256: "b" },
    { label: "cFp79:root-features.jsonl", relativePath: "cFp79/root-features.jsonl", sha256: "c" },
    {
      label: "cFp79:action-features.jsonl",
      relativePath: "cFp79/action-features.jsonl",
      sha256: "d",
    },
    { label: "cFp79:skipped-roots.jsonl", relativePath: "cFp79/skipped-roots.jsonl", sha256: "e" },
    { label: "cFp79:report.md", relativePath: "cFp79/report.md", sha256: "f" },
  ];

const baseInput = (): SearchConsumerActionFeatureDictionaryV0BuildInput => ({
  suiteId,
  featureRunId,
  sourceBenchmarkSuiteId: suiteId,
  sourceCfp79RunId,
  cfp79Summary: {
    featureRunId: sourceCfp79RunId,
    suiteId,
    consumerReadinessStatus: "features_ready",
    rootFeatureRowCount: 1,
    actionFeatureRowCount: 1,
    skippedRootRowCount: 1,
    sourceConsistency: { status: "ready" },
  },
  cfp79RootFeatures: [rootFeature()],
  cfp79ActionFeatures: [actionFeature()],
  cfp79SkippedRoots: [skippedRoot()],
  sourceArtifactReferenceCount: sourceArtifactReferences.length,
  sourceArtifactEmptyHashCount: 0,
});

const buildArtifacts = () =>
  serializeSearchConsumerActionFeatureDictionaryV0Artifacts({
    result: buildSearchConsumerActionFeatureDictionaryV0Result(baseInput()),
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId: suiteId,
    sourceRunIds,
    sourceArtifactReferences,
    sourceCfp79ActionFeaturesJsonlBytes: 2048,
  });

describe("search consumer action feature dictionary v0 artifacts", () => {
  it("serializes deterministically with stable artifact and dictionary hashes", () => {
    const first = buildArtifacts();
    const second = buildArtifacts();
    const summary = JSON.parse(first.summaryJson) as {
      dictionaryGroupHashes: Record<string, string>;
    };

    expect(first).toEqual(second);
    expect(searchConsumerActionFeatureDictionaryV0ArtifactHashes(first)).toEqual(
      searchConsumerActionFeatureDictionaryV0ArtifactHashes(second),
    );
    expect(summary.dictionaryGroupHashes.publicActionRefs).toMatch(/^[a-f0-9]{64}$/);
  });

  it("records byte counts, compact savings, and robust-target labels in summary.json", () => {
    const artifacts = buildArtifacts();
    const summary = JSON.parse(artifacts.summaryJson) as {
      artifactByteSizes: {
        actionFeaturesCompactJsonlBytes: number;
        rootFeaturesJsonlBytes: number;
        skippedRootsJsonlBytes: number;
        sourceCfp79ActionFeaturesJsonlBytes: number;
      };
      compactActionBytesSaved: number;
      artifactSizeLabels: { actionFeaturesCompactJsonl: string };
      cFp81Recommendation: string;
    };

    expect(summary.artifactByteSizes.actionFeaturesCompactJsonlBytes).toBe(
      Buffer.byteLength(artifacts.actionFeaturesCompactJsonl, "utf8"),
    );
    expect(summary.artifactByteSizes.rootFeaturesJsonlBytes).toBe(
      Buffer.byteLength(artifacts.rootFeaturesJsonl, "utf8"),
    );
    expect(summary.artifactByteSizes.skippedRootsJsonlBytes).toBe(
      Buffer.byteLength(artifacts.skippedRootsJsonl, "utf8"),
    );
    expect(summary.compactActionBytesSaved).toBe(
      summary.artifactByteSizes.sourceCfp79ActionFeaturesJsonlBytes -
        summary.artifactByteSizes.actionFeaturesCompactJsonlBytes,
    );
    expect(summary.artifactSizeLabels.actionFeaturesCompactJsonl).toBe(
      searchConsumerActionFeatureDictionaryV0CompactActionSizeLabel(
        summary.artifactByteSizes.actionFeaturesCompactJsonlBytes,
      ),
    );
    expect(summary.cFp81Recommendation).toBe(CFP81_RECOMMENDATION_ACTION_FEATURE_CASEBOOK);
  });

  it("passes hidden-info scanning for clean artifacts and rejects exact/catalog hazards", () => {
    const artifacts = buildArtifacts();

    expect(scanSearchConsumerActionFeatureDictionaryV0ArtifactsForHiddenInfo(artifacts)).toEqual(
      [],
    );
    expect(
      scanSearchConsumerActionFeatureDictionaryV0ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\ncardsById finalState commandLog eventLog ownHand opponentHand unsafeDebugResults decisionTrace moveId sourceCardId sourceId cardId actionRef rawMove rawLabel deckOrder sampledHand sampledDeck sampledWorld hiddenHand hiddenDeck handSourceCounts deckSourceCounts bestAction selectedAction actionValue expectedValue valueEstimate rewardTarget payoffTable payoffMatrix rolloutReward winProbability principalVariation seat_b:`,
        reportMarkdown: `${artifacts.reportMarkdown}\nGeralt of Rivia\nneutral.geralt-of-rivia\n`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "cardsById",
        "sourceId",
        "actionRef",
        "sampledWorld",
        "winProbability",
        "runtime seat_b prefix",
        "catalog identity:Geralt of Rivia",
        "catalog identity:neutral.geralt-of-rivia",
      ]),
    );
  });

  it("declares exactly the cFp80 artifact file list and does not emit full action features", () => {
    const artifacts = buildArtifacts();
    const manifest = JSON.parse(artifacts.manifestJson) as {
      files: string[];
      explicitNonClaims: string[];
    };

    expect(manifest.files).toEqual([...searchConsumerActionFeatureDictionaryV0ArtifactFiles]);
    expect(manifest.files).not.toContain("action-features.jsonl");
    expect(manifest.files).toContain("action-features-compact.jsonl");
    expect(manifest.explicitNonClaims).toEqual([...CFP80_EXPLICIT_NON_CLAIMS]);
  });
});
