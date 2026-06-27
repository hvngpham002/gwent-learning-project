import { describe, expect, it } from "vitest";

import {
  buildSearchConsumerActionFeatureCasebookV0Result,
  CFP81_EXPLICIT_NON_CLAIMS,
  CFP82_RECOMMENDATION_CASEBOOK_REVIEW,
  scanSearchConsumerActionFeatureCasebookV0ArtifactsForHiddenInfo,
  searchConsumerActionFeatureCasebookV0ArtifactFiles,
  searchConsumerActionFeatureCasebookV0ArtifactHashes,
  searchConsumerActionFeatureCasebookV0SizeLabel,
  serializeSearchConsumerActionFeatureCasebookV0Artifacts,
  type SearchConsumerActionFeatureCasebookV0BuildInput,
  type SearchConsumerActionFeatureCasebookV0DictionaryGroups,
  type SearchConsumerActionFeatureCasebookV0SourceArtifactByteSizes,
  type SearchConsumerActionFeatureCasebookV0SourceRunIds,
  type SearchConsumerActionFeatureDictionaryV0ActionRow,
  type SearchConsumerActionFeatureDictionaryV0RootFeatureRow,
  type SearchConsumerActionFeatureDictionaryV0SkippedRootRow,
  type SearchConsumerActionFeatureDictionaryV0SourceArtifactReference,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";
const casebookRunId = "cFp81";
const sourceCfp80RunId = "cFp80";
const sourceRunIds: SearchConsumerActionFeatureCasebookV0SourceRunIds = {
  cfp80: sourceCfp80RunId,
};

const group = (values: readonly string[]) => ({ count: values.length, values });

const dictionaries = (): SearchConsumerActionFeatureCasebookV0DictionaryGroups => ({
  schemaVersions: group([
    "search-consumer-action-features-dictionary-v0-action-v1",
    "search-consumer-action-features-dictionary-v0-root-feature-v1",
    "search-consumer-action-features-dictionary-v0-skipped-root-v1",
    "search-consumer-action-features-dictionary-v0-summary-v1",
  ]),
  readinessStatuses: group(["dictionary_ready", "ready", "skipped_invalid_root"]),
  rootRefs: group(["root_000001"]),
  publicActionRefs: group(["public_action_000"]),
  actionKinds: group(["pass"]),
  sourceClasses: group(["none"]),
  targets: group(["none"]),
  strengthBuckets: group(["none"]),
  optionIndexLabels: group(["none"]),
  moveCountBuckets: group(["single"]),
});

const rootFeature = (): SearchConsumerActionFeatureDictionaryV0RootFeatureRow =>
  ({
    schemaVersion: "search-consumer-action-features-dictionary-v0-root-feature-v1",
    featureRunId: sourceCfp80RunId,
    suiteId,
    matchupId: "starter-nr-vs-ng",
    seed: "seed-1",
    mirrorGroupId: "starter-nr-vs-ng:seed-1",
    mirrorIndex: 0,
    step: 10,
    decisionIndex: 9,
    phase: "playing",
    round: 1,
    seatId: "seat_a",
    policyId: "legal-heuristic-v1",
    faction: "northern_realms",
    deckPresetId: "official-northern-realms-starter",
    rootPublicFingerprint: "fingerprint-1",
    rootRef: "root_000001",
    consumerReadinessStatus: "dictionary_ready",
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
  }) as SearchConsumerActionFeatureDictionaryV0RootFeatureRow;

const compactAction = (): SearchConsumerActionFeatureDictionaryV0ActionRow => ({
  rootRefId: 0,
  publicActionRefId: 0,
  kindId: 0,
  ordinal: 0,
  moveCount: 1,
  sourceClassId: 0,
  targetId: 0,
  strengthBucketId: 0,
  optionIndexLabelId: 0,
  moveCountBucketId: 0,
  collisionCountWithinBucket: 0,
  hasCollision: false,
  hasTarget: false,
  hasStrengthBucket: false,
  hasOptionIndexLabel: false,
});

const skippedRoot = (): SearchConsumerActionFeatureDictionaryV0SkippedRootRow =>
  ({
    ...rootFeature(),
    schemaVersion: "search-consumer-action-features-dictionary-v0-skipped-root-v1",
    rootPublicFingerprint: "skipped-fingerprint-1",
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
  }) as SearchConsumerActionFeatureDictionaryV0SkippedRootRow;

const sourceArtifactReferences: readonly SearchConsumerActionFeatureDictionaryV0SourceArtifactReference[] =
  [
    { label: "cFp80:manifest.json", relativePath: "cFp80/manifest.json", sha256: "a" },
    { label: "cFp80:summary.json", relativePath: "cFp80/summary.json", sha256: "b" },
    { label: "cFp80:dictionaries.json", relativePath: "cFp80/dictionaries.json", sha256: "c" },
    { label: "cFp80:root-features.jsonl", relativePath: "cFp80/root-features.jsonl", sha256: "d" },
    {
      label: "cFp80:action-features-compact.jsonl",
      relativePath: "cFp80/action-features-compact.jsonl",
      sha256: "e",
    },
    { label: "cFp80:skipped-roots.jsonl", relativePath: "cFp80/skipped-roots.jsonl", sha256: "f" },
    { label: "cFp80:report.md", relativePath: "cFp80/report.md", sha256: "g" },
  ];

const sourceArtifactByteSizes: SearchConsumerActionFeatureCasebookV0SourceArtifactByteSizes = {
  manifestJsonBytes: 100,
  summaryJsonBytes: 200,
  dictionariesJsonBytes: 300,
  rootFeaturesJsonlBytes: 400,
  actionFeaturesCompactJsonlBytes: 500,
  skippedRootsJsonlBytes: 600,
  reportMarkdownBytes: 700,
};

const baseInput = (): SearchConsumerActionFeatureCasebookV0BuildInput => {
  const cfp80Dictionaries = dictionaries();
  const cfp80RootFeatures = [rootFeature()];
  const cfp80CompactActionFeatures = [compactAction()];
  const cfp80SkippedRoots = [skippedRoot()];
  return {
    suiteId,
    casebookRunId,
    sourceBenchmarkSuiteId: suiteId,
    sourceCfp80RunId,
    cfp80Summary: {
      featureRunId: sourceCfp80RunId,
      suiteId,
      consumerReadinessStatus: "dictionary_ready",
      sourceConsistency: { status: "ready" },
      reconstructionStatus: "passed",
      reconstructionMismatchCount: 0,
      rootFeatureRowCount: cfp80RootFeatures.length,
      compactActionFeatureRowCount: cfp80CompactActionFeatures.length,
      skippedRootRowCount: cfp80SkippedRoots.length,
      robustTargetStatus: "not_robust_suite",
      dictionaryGroupCounts: Object.fromEntries(
        Object.entries(cfp80Dictionaries).map(([name, value]) => [name, value.count]),
      ),
    },
    cfp80Dictionaries,
    cfp80RootFeatures,
    cfp80CompactActionFeatures,
    cfp80SkippedRoots,
    sourceArtifactReferenceCount: sourceArtifactReferences.length,
    sourceArtifactEmptyHashCount: 0,
  };
};

const buildArtifacts = () =>
  serializeSearchConsumerActionFeatureCasebookV0Artifacts({
    result: buildSearchConsumerActionFeatureCasebookV0Result(baseInput()),
    casebookRunId,
    suiteId,
    sourceBenchmarkSuiteId: suiteId,
    sourceRunIds,
    sourceArtifactReferences,
    sourceArtifactByteSizes,
  });

describe("search consumer action feature casebook v0 artifacts", () => {
  it("serializes deterministically with stable artifact hashes", () => {
    const first = buildArtifacts();
    const second = buildArtifacts();

    expect(first).toEqual(second);
    expect(searchConsumerActionFeatureCasebookV0ArtifactHashes(first)).toEqual(
      searchConsumerActionFeatureCasebookV0ArtifactHashes(second),
    );
  });

  it("records byte counts and size labels for serialized casebook artifacts", () => {
    const artifacts = buildArtifacts();
    const summary = JSON.parse(artifacts.summaryJson) as {
      artifactByteSizes: {
        casebookRowsJsonlBytes: number;
        sliceSummariesJsonlBytes: number;
        skippedRootSummaryJsonBytes: number;
      };
      artifactSizeLabels: {
        casebookRowsJsonl: string;
        sliceSummariesJsonl: string;
        skippedRootSummaryJson: string;
      };
      cFp82Recommendation: string;
    };

    expect(summary.artifactByteSizes.casebookRowsJsonlBytes).toBe(
      Buffer.byteLength(artifacts.casebookRowsJsonl, "utf8"),
    );
    expect(summary.artifactByteSizes.sliceSummariesJsonlBytes).toBe(
      Buffer.byteLength(artifacts.sliceSummariesJsonl, "utf8"),
    );
    expect(summary.artifactByteSizes.skippedRootSummaryJsonBytes).toBe(
      Buffer.byteLength(artifacts.skippedRootSummaryJson, "utf8"),
    );
    expect(summary.artifactSizeLabels.casebookRowsJsonl).toBe(
      searchConsumerActionFeatureCasebookV0SizeLabel(
        summary.artifactByteSizes.casebookRowsJsonlBytes,
      ),
    );
    expect(summary.cFp82Recommendation).toBe(CFP82_RECOMMENDATION_CASEBOOK_REVIEW);
  });

  it("passes hidden-info scanning for clean artifacts and rejects exact/catalog hazards", () => {
    const artifacts = buildArtifacts();

    expect(scanSearchConsumerActionFeatureCasebookV0ArtifactsForHiddenInfo(artifacts)).toEqual(
      [],
    );
    expect(
      scanSearchConsumerActionFeatureCasebookV0ArtifactsForHiddenInfo({
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

  it("declares exactly the cFp81 artifact file list and non-claims", () => {
    const artifacts = buildArtifacts();
    const manifest = JSON.parse(artifacts.manifestJson) as {
      files: string[];
      explicitNonClaims: string[];
    };

    expect(manifest.files).toEqual([...searchConsumerActionFeatureCasebookV0ArtifactFiles]);
    expect(manifest.files).not.toContain("action-features-compact.jsonl");
    expect(manifest.files).toContain("casebook-rows.jsonl");
    expect(manifest.explicitNonClaims).toEqual([...CFP81_EXPLICIT_NON_CLAIMS]);
  });
});
