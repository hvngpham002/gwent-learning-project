import { describe, expect, it } from "vitest";

import {
  buildSearchConsumerActionFeaturesV1Result,
  CFP79_EXPLICIT_NON_CLAIMS,
  CFP80_RECOMMENDATION_FEATURE_CASEBOOK,
  scanSearchConsumerActionFeaturesV1ArtifactsForHiddenInfo,
  searchConsumerActionFeaturesV1ActionSizeLabel,
  searchConsumerActionFeaturesV1ArtifactHashes,
  serializeSearchConsumerActionFeaturesV1Artifacts,
  type PublicActionIdentitiesCompactV0ActionRow,
  type PublicActionIdentitiesCompactV0RootIndexRow,
  type PublicActionIdentitiesCompactV0SkippedRootRow,
  type SearchConsumerActionFeaturesV0RootFeatureRow,
  type SearchConsumerActionFeaturesV0SkippedRootRow,
  type SearchConsumerActionFeaturesV1BuildInput,
  type SearchConsumerActionFeaturesV1SourceArtifactReference,
  type SearchConsumerActionFeaturesV1SourceRunIds,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";
const featureRunId = "cFp79";
const sourceRunIds: SearchConsumerActionFeaturesV1SourceRunIds = {
  cfp76: `${suiteId}:search-consumer-action-features-v0:cFp76`,
  cfp78: `${suiteId}:public-action-identities-compact-v0:cFp78`,
};

const identity = {
  suiteId,
  matchupId: "starter-nr-vs-ng",
  seed: "seed-1",
  mirrorGroupId: "starter-nr-vs-ng:seed-1",
  mirrorIndex: 0 as const,
  step: 10,
  decisionIndex: 9,
  phase: "playing" as const,
  round: 1,
  seatId: "seat_a" as const,
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  rootPublicFingerprint: "fingerprint-1",
};

const rootFeature = (): SearchConsumerActionFeaturesV0RootFeatureRow => ({
  ...identity,
  schemaVersion: "search-consumer-action-features-v0-root-feature-v1",
  featureRunId: sourceRunIds.cfp76,
  consumerReadinessStatus: "action_feature_source_gap",
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

const rootIndex = (): PublicActionIdentitiesCompactV0RootIndexRow => ({
  ...identity,
  schemaVersion: "public-action-identities-compact-v0-root-index-v1",
  rootRef: "root_000001",
  publicActionCount: 1,
  legalMoveCount: 1,
  publicActionCollisionCount: 0,
  largestPublicActionBucketSize: 1,
});

const actionRow = (): PublicActionIdentitiesCompactV0ActionRow => ({
  schemaVersion: "public-action-identities-compact-v0-action-v1",
  rootRef: "root_000001",
  publicActionRef: "public_action_000",
  publicActionKeyHash: "abc123",
  kind: "pass",
  ordinal: 0,
  moveCount: 1,
  sourceClass: "none",
});

const skippedV0 = (): SearchConsumerActionFeaturesV0SkippedRootRow => ({
  ...identity,
  step: 20,
  decisionIndex: 19,
  rootPublicFingerprint: "skipped-fingerprint-1",
  schemaVersion: "search-consumer-action-features-v0-skipped-root-v1",
  featureRunId: sourceRunIds.cfp76,
  consumerReadinessStatus: "skipped_invalid_root",
  eligibilityStatus: "skipped_invalid_root",
  skipReason: "sampler_invalid_public_zone_count_deficit",
  invalidReason: "insufficient_prior_remaining",
  cFp67PrimaryClassification: "candidate_valid_root_only_skip",
  cFp67TransferClassification: "public_transfer_memory_not_applicable",
  cFp67PersistentDeficitClassification: "persistent_public_zone_count_deficit",
  cFp67DeficitSizeClassification: "one_card_deficit",
  cFp67ProvenanceLabel: "single_zone_board",
  skipStage: "inherited_sampler_skip",
  skipCounterDimensions: { suiteId, phase: "playing", round: "1" },
});

const skippedCompact = (): PublicActionIdentitiesCompactV0SkippedRootRow => ({
  ...identity,
  step: 20,
  decisionIndex: 19,
  rootPublicFingerprint: "skipped-fingerprint-1",
  schemaVersion: "public-action-identities-compact-v0-skipped-root-v1",
  compactRunId: sourceRunIds.cfp78,
  identityReadinessStatus: "skipped_invalid_root",
  eligibilityStatus: "skipped_invalid_root",
  skipReason: "sampler_invalid_public_zone_count_deficit",
  invalidReason: "insufficient_prior_remaining",
  cFp67PrimaryClassification: "candidate_valid_root_only_skip",
  cFp67TransferClassification: "public_transfer_memory_not_applicable",
  cFp67PersistentDeficitClassification: "persistent_public_zone_count_deficit",
  cFp67DeficitSizeClassification: "one_card_deficit",
  cFp67ProvenanceLabel: "single_zone_board",
  skipStage: "cFp68_cFp69_inherited",
  skipCounterDimensions: { suiteId, phase: "playing", round: "1" },
});

const sourceArtifactReferences: readonly SearchConsumerActionFeaturesV1SourceArtifactReference[] = [
  { label: "cFp76:manifest.json", relativePath: "cFp76/manifest.json", sha256: "a" },
  { label: "cFp76:summary.json", relativePath: "cFp76/summary.json", sha256: "b" },
  { label: "cFp78:manifest.json", relativePath: "cFp78/manifest.json", sha256: "c" },
  { label: "cFp78:summary.json", relativePath: "cFp78/summary.json", sha256: "d" },
];

const baseInput = (): SearchConsumerActionFeaturesV1BuildInput => ({
  suiteId,
  featureRunId,
  sourceBenchmarkSuiteId: suiteId,
  sourceCfp76RunId: sourceRunIds.cfp76,
  sourceCfp78RunId: sourceRunIds.cfp78,
  cfp76Summary: {
    featureRunId: sourceRunIds.cfp76,
    suiteId,
    consumerReadinessStatus: "action_feature_source_gap",
    rootFeatureRowCount: 1,
    skippedRootRowCount: 1,
    sourceConsistency: { status: "ready" },
  },
  cfp76RootFeatures: [rootFeature()],
  cfp76SkippedRoots: [skippedV0()],
  cfp78Summary: {
    compactRunId: sourceRunIds.cfp78,
    suiteId,
    compactReadinessStatus: "compact_ready",
    compactActionRowCount: 1,
    compactRootIndexRowCount: 1,
    compactSkippedRootRowCount: 1,
    sourceConsistency: { status: "ready" },
  },
  cfp78ActionIdentities: [actionRow()],
  cfp78RootIndexRows: [rootIndex()],
  cfp78SkippedRoots: [skippedCompact()],
  sourceArtifactReferenceCount: sourceArtifactReferences.length,
  sourceArtifactEmptyHashCount: 0,
});

const buildArtifacts = () =>
  serializeSearchConsumerActionFeaturesV1Artifacts({
    result: buildSearchConsumerActionFeaturesV1Result(baseInput()),
    featureRunId,
    suiteId,
    sourceBenchmarkSuiteId: suiteId,
    sourceRunIds,
    sourceArtifactReferences,
  });

describe("search consumer action features v1 artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const first = buildArtifacts();
    const second = buildArtifacts();

    expect(first).toEqual(second);
    expect(searchConsumerActionFeaturesV1ArtifactHashes(first)).toEqual(
      searchConsumerActionFeaturesV1ArtifactHashes(second),
    );
  });

  it("passes hidden-info scanning for clean artifacts", () => {
    expect(scanSearchConsumerActionFeaturesV1ArtifactsForHiddenInfo(buildArtifacts())).toEqual([]);
  });

  it("rejects raw move, source/card, sample, search-strength, runtime, and catalog payload tokens", () => {
    const artifacts = buildArtifacts();

    expect(
      scanSearchConsumerActionFeaturesV1ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\ncardsById finalState commandLog eventLog ownHand opponentHand unsafeDebugResults decisionTrace moveId sourceCardId sourceId cardId actionRef rawMove rawLabel deckOrder sampledHand sampledDeck sampledWorld hiddenHand hiddenDeck handSourceCounts deckSourceCounts bestAction selectedAction actionValue expectedValue valueEstimate rewardTarget payoffTable payoffMatrix rolloutReward winProbability principalVariation seat_a:`,
        reportMarkdown: `${artifacts.reportMarkdown}\nGeralt of Rivia\nneutral.geralt-of-rivia\n`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "cardsById",
        "moveId",
        "sourceId",
        "actionRef",
        "sampledWorld",
        "bestAction",
        "winProbability",
        "runtime seat_a prefix",
        "catalog identity:Geralt of Rivia",
        "catalog identity:neutral.geralt-of-rivia",
      ]),
    );
  });

  it("records actual action-feature bytes and size labels in summary.json", () => {
    const artifacts = buildArtifacts();
    const summary = JSON.parse(artifacts.summaryJson) as {
      artifactByteSizes: { actionFeaturesJsonlBytes: number };
      actionFeaturesSizeLabel: string;
      cFp80Recommendation: string;
    };

    expect(summary.artifactByteSizes.actionFeaturesJsonlBytes).toBe(
      Buffer.byteLength(artifacts.actionFeaturesJsonl, "utf8"),
    );
    expect(summary.actionFeaturesSizeLabel).toBe(
      searchConsumerActionFeaturesV1ActionSizeLabel(
        summary.artifactByteSizes.actionFeaturesJsonlBytes,
      ),
    );
    expect(summary.cFp80Recommendation).toBe(CFP80_RECOMMENDATION_FEATURE_CASEBOOK);
  });

  it("omits action-feature gaps and declares cFp79 non-claims", () => {
    const artifacts = buildArtifacts();
    const manifest = JSON.parse(artifacts.manifestJson) as {
      files: string[];
      explicitNonClaims: string[];
    };

    expect(manifest.files).not.toContain("action-feature-gaps.jsonl");
    expect(manifest.explicitNonClaims).toEqual([...CFP79_EXPLICIT_NON_CLAIMS]);
  });
});
