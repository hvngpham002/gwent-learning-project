import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey,
  buildPublicActionIdentitiesV0Result,
  CFP77_EXPLICIT_NON_CLAIMS,
  CFP78_RECOMMENDATION_JOIN,
  CFP78_RECOMMENDATION_NOT_READY,
  publicActionIdentitiesV0ArtifactHashes,
  scanPublicActionIdentitiesV0ArtifactsForHiddenInfo,
  serializePublicActionIdentitiesV0Artifacts,
  type PublicActionIdentitiesV0BuildInput,
  type PublicActionIdentitiesV0Cfp68EligibleRootInput,
  type PublicActionIdentitiesV0Cfp68SkippedRootInput,
  type PublicActionIdentitiesV0Cfp69ProbeRootInput,
  type PublicActionIdentitiesV0Cfp69SkippedRootInput,
  type PublicActionIdentitiesV0Cfp76SummaryInput,
  type PublicActionIdentitiesV0Cfp68SummaryInput,
  type PublicActionIdentitiesV0Cfp69SummaryInput,
  type PublicActionIdentitiesV0ObservedRoot,
  type PublicActionIdentitiesV0SourceArtifactReference,
  type PublicActionIdentitiesV0SourceRunIds,
  type PublicSearchActionAbstraction,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";
const identityRunId = `${suiteId}:public-action-identities-v0:cFp77:test`;

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

const skippedIdentity = {
  ...identity,
  step: 20,
  decisionIndex: 19,
  rootPublicFingerprint: "skipped-fingerprint-1",
};

const playCardAction: PublicSearchActionAbstraction = {
  kind: "play_card",
  targetKind: "board_row",
  targetSide: "own",
  targetRow: "melee",
  phase: "playing",
  round: 1,
  sourceClass: "unit",
  strengthBucket: "medium",
  moveCount: 2,
};

const passAction: PublicSearchActionAbstraction = {
  kind: "pass",
  targetKind: "none",
  targetSide: "none",
  phase: "playing",
  round: 1,
  sourceClass: "none",
  moveCount: 1,
};

const bucketFor = (action: PublicSearchActionAbstraction) => ({
  key: buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey(action),
  action,
});

const eligibleRoot = (
  overrides: Partial<PublicActionIdentitiesV0Cfp68EligibleRootInput> = {},
): PublicActionIdentitiesV0Cfp68EligibleRootInput => ({
  ...identity,
  eligibilityStatus: "eligible_valid_root",
  ...overrides,
});

const cfp68SkippedRoot = (
  overrides: Partial<PublicActionIdentitiesV0Cfp68SkippedRootInput> = {},
): PublicActionIdentitiesV0Cfp68SkippedRootInput => ({
  ...skippedIdentity,
  eligibilityStatus: "skipped_invalid_root",
  ...overrides,
});

const probeRoot = (
  overrides: Partial<PublicActionIdentitiesV0Cfp69ProbeRootInput> = {},
): PublicActionIdentitiesV0Cfp69ProbeRootInput => ({
  ...identity,
  probeStatus: "completed",
  legalMoveCount: 3,
  publicActionCount: 2,
  ...overrides,
});

const cfp69SkippedRoot = (
  overrides: Partial<PublicActionIdentitiesV0Cfp69SkippedRootInput> = {},
): PublicActionIdentitiesV0Cfp69SkippedRootInput => ({
  ...skippedIdentity,
  eligibilityStatus: "skipped_invalid_root",
  skipReason: "sampler_invalid_public_zone_count_deficit",
  invalidReason: "insufficient_prior_remaining",
  cFp67PrimaryClassification: "candidate_valid_root_only_skip",
  cFp67TransferClassification: "public_transfer_memory_not_applicable",
  cFp67PersistentDeficitClassification: "persistent_public_zone_count_deficit",
  cFp67DeficitSizeClassification: "one_card_deficit",
  cFp67ProvenanceLabel: "single_zone_board",
  skipCounterDimensions: { suiteId, phase: "playing", round: "1" },
  ...overrides,
});

const observedRootIdentity = () => ({
  suiteId: identity.suiteId,
  matchupId: identity.matchupId,
  seed: identity.seed,
  mirrorGroupId: identity.mirrorGroupId,
  mirrorIndex: identity.mirrorIndex,
  step: identity.step,
  decisionIndex: identity.decisionIndex,
  phase: identity.phase,
  round: identity.round,
  seatId: identity.seatId,
  policyId: identity.policyId,
  faction: identity.faction,
  deckPresetId: identity.deckPresetId,
});

const observedRoot = (
  overrides: Partial<PublicActionIdentitiesV0ObservedRoot> = {},
): PublicActionIdentitiesV0ObservedRoot => ({
  ...observedRootIdentity(),
  legalMoveCount: 3,
  publicActionBuckets: [bucketFor(playCardAction), bucketFor(passAction)],
  observationStatus: "completed",
  ...overrides,
});

const cfp68Summary = (): PublicActionIdentitiesV0Cfp68SummaryInput => ({
  contractStatus: "probe_ready",
  eligibleRootCount: 1,
  skippedRootCount: 1,
});

const cfp69Summary = (): PublicActionIdentitiesV0Cfp69SummaryInput => ({
  probeReadinessStatus: "probe_ready",
  probeRootCount: 1,
  skippedRootCount: 1,
});

const cfp76Summary = (): PublicActionIdentitiesV0Cfp76SummaryInput => ({
  consumerReadinessStatus: "action_feature_source_gap",
  rootFeatureRowCount: 1,
  actionFeatureRowCount: 0,
  actionFeatureGapRowCount: 5,
  skippedRootRowCount: 1,
});

const baseInput = (
  overrides: Partial<PublicActionIdentitiesV0BuildInput> = {},
): PublicActionIdentitiesV0BuildInput => ({
  suiteId,
  identityRunId,
  sourceCfp68RunId: `${suiteId}:determinized-probe-contract:cFp68`,
  sourceCfp69RunId: `${suiteId}:determinized-pimc-probe-v0:cFp69`,
  sourceCfp76RunId: `${suiteId}:search-consumer-action-features-v0:cFp76`,
  cfp68Summary: cfp68Summary(),
  cfp69Summary: cfp69Summary(),
  cfp76Summary: cfp76Summary(),
  cfp68EligibleRoots: [eligibleRoot()],
  cfp68SkippedRoots: [cfp68SkippedRoot()],
  cfp69ProbeRoots: [probeRoot()],
  cfp69SkippedRoots: [cfp69SkippedRoot()],
  cfp76RootFeatureRowCount: 1,
  observedRoots: [observedRoot()],
  sourceArtifactReferenceCount: 15,
  sourceArtifactEmptyHashCount: 0,
  ...overrides,
});

const sourceRunIds: PublicActionIdentitiesV0SourceRunIds = {
  cfp68: `${suiteId}:determinized-probe-contract:cFp68`,
  cfp69: `${suiteId}:determinized-pimc-probe-v0:cFp69`,
  cfp76: `${suiteId}:search-consumer-action-features-v0:cFp76`,
};

const sourceArtifactReferences: readonly PublicActionIdentitiesV0SourceArtifactReference[] = [
  { label: "cFp68:summary.json", relativePath: "cFp68/summary.json", sha256: "a" },
  { label: "cFp69:summary.json", relativePath: "cFp69/summary.json", sha256: "b" },
  { label: "cFp76:summary.json", relativePath: "cFp76/summary.json", sha256: "c" },
];

const buildArtifacts = (overrides: Partial<PublicActionIdentitiesV0BuildInput> = {}) =>
  serializePublicActionIdentitiesV0Artifacts({
    result: buildPublicActionIdentitiesV0Result(baseInput(overrides)),
    identityRunId,
    suiteId,
    sourceBenchmarkSuiteId: suiteId,
    sourceRunIds,
    sourceArtifactReferences,
  });

describe("public action identities v0 artifacts", () => {
  it("serializes deterministically with stable hashes", () => {
    const first = buildArtifacts();
    const second = buildArtifacts();

    expect(first).toEqual(second);
    expect(publicActionIdentitiesV0ArtifactHashes(first)).toEqual(
      publicActionIdentitiesV0ArtifactHashes(second),
    );
  });

  it("passes the hidden-info scan for clean artifacts", () => {
    const artifacts = buildArtifacts();

    expect(scanPublicActionIdentitiesV0ArtifactsForHiddenInfo(artifacts)).toEqual([]);
  });

  it("detects injected hidden-info and search-strength hazard tokens", () => {
    const artifacts = buildArtifacts();

    expect(
      scanPublicActionIdentitiesV0ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson: `${artifacts.summaryJson}\ncardsById finalState commandLog eventLog ownHand opponentHand unsafeDebugResults decisionTrace moveId sourceCardId sourceId cardId actionRef rawMove rawLabel deckOrder sampledHand sampledDeck sampledWorld hiddenHand hiddenDeck handSourceCounts deckSourceCounts bestAction selectedAction actionValue expectedValue valueEstimate rewardTarget payoffTable payoffMatrix rolloutReward winProbability principalVariation seat_b:`,
        reportMarkdown: `${artifacts.reportMarkdown}\nGeralt of Rivia\nneutral.geralt-of-rivia\n`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "cardsById",
        "finalState",
        "commandLog",
        "eventLog",
        "ownHand",
        "opponentHand",
        "unsafeDebugResults",
        "decisionTrace",
        "moveId",
        "sourceCardId",
        "sourceId",
        "cardId",
        "actionRef",
        "rawMove",
        "rawLabel",
        "deckOrder",
        "sampledHand",
        "sampledDeck",
        "sampledWorld",
        "hiddenHand",
        "hiddenDeck",
        "handSourceCounts",
        "deckSourceCounts",
        "bestAction",
        "selectedAction",
        "actionValue",
        "expectedValue",
        "valueEstimate",
        "rewardTarget",
        "payoffTable",
        "payoffMatrix",
        "rolloutReward",
        "winProbability",
        "principalVariation",
        "runtime seat_b prefix",
        "catalog identity:Geralt of Rivia",
        "catalog identity:neutral.geralt-of-rivia",
      ]),
    );
  });

  it("includes manifest and summary fields for the identity_ready path", () => {
    const artifacts = buildArtifacts();
    const manifest = JSON.parse(artifacts.manifestJson) as Record<string, unknown>;
    const summary = JSON.parse(artifacts.summaryJson) as Record<string, unknown>;

    expect(manifest.schemaVersion).toBe("public-action-identities-v0-artifact-v1");
    expect(manifest.identityReadinessStatus).toBe("identity_ready");
    expect(manifest.explicitNonClaims).toEqual(CFP77_EXPLICIT_NON_CLAIMS);
    expect(manifest.cFp78Recommendation).toBe(CFP78_RECOMMENDATION_JOIN);
    expect(summary.actionIdentityRowCount).toBe(2);
    expect(summary.rootSummaryRowCount).toBe(1);
    expect(summary.skippedRootRowCount).toBe(1);
    expect(summary.hiddenInfoScanStatus).toBe("clean");
  });

  it("writes one jsonl row per action identity, root summary, and skipped root", () => {
    const artifacts = buildArtifacts();

    expect(artifacts.actionIdentitiesJsonl.trimEnd().split("\n")).toHaveLength(2);
    expect(artifacts.rootSummariesJsonl.trimEnd().split("\n")).toHaveLength(1);
    expect(artifacts.skippedRootsJsonl.trimEnd().split("\n")).toHaveLength(1);
  });

  it("documents source consistency and non-claims in the report", () => {
    const artifacts = buildArtifacts();

    expect(artifacts.reportMarkdown).toContain("## Source Consistency");
    expect(artifacts.reportMarkdown).toContain("## Non-Claims");
    expect(artifacts.reportMarkdown).toContain(CFP78_RECOMMENDATION_JOIN);
    CFP77_EXPLICIT_NON_CLAIMS.forEach((claim) => {
      expect(artifacts.reportMarkdown).toContain(claim);
    });
  });

  it("uses the not-ready recommendation and empty row files when source consistency fails", () => {
    const artifacts = buildArtifacts({
      cfp68EligibleRoots: [eligibleRoot(), eligibleRoot()],
      cfp68Summary: { ...cfp68Summary(), eligibleRootCount: 2 },
    });
    const manifest = JSON.parse(artifacts.manifestJson) as Record<string, unknown>;
    const summary = JSON.parse(artifacts.summaryJson) as Record<string, unknown>;

    expect(manifest.identityReadinessStatus).toBe("source_consistency_failed");
    expect(manifest.cFp78Recommendation).toBe(CFP78_RECOMMENDATION_NOT_READY);
    expect(summary.identityReadinessStatus).toBe("source_consistency_failed");
    expect(artifacts.actionIdentitiesJsonl).toBe("");
    expect(artifacts.rootSummariesJsonl).toBe("");
    expect(artifacts.skippedRootsJsonl).toBe("");
    expect(artifacts.reportMarkdown).toContain(CFP78_RECOMMENDATION_NOT_READY);
  });
});
