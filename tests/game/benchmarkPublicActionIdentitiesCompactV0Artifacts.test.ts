import { describe, expect, it } from "vitest";

import {
  buildPublicActionIdentitiesCompactV0Result,
  CFP78_EXPLICIT_NON_CLAIMS,
  CFP79_RECOMMENDATION_JOIN,
  CFP79_RECOMMENDATION_NOT_READY,
  publicActionIdentitiesCompactV0ArtifactHashes,
  scanPublicActionIdentitiesCompactV0ArtifactsForHiddenInfo,
  serializePublicActionIdentitiesCompactV0Artifacts,
  type PublicActionIdentitiesCompactV0BuildInput,
  type PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow,
  type PublicActionIdentitiesCompactV0Cfp77RootSummaryRow,
  type PublicActionIdentitiesCompactV0Cfp77SkippedRootRow,
  type PublicActionIdentitiesCompactV0Cfp77SummaryInput,
  type PublicActionIdentitiesCompactV0SourceArtifactReference,
} from "@/game/benchmark";

const suiteId = "benchmark-v1-starter-matrix-v1";
const compactRunId = `${suiteId}:public-action-identities-compact-v0:cFp78:test`;

const cfp77ActionIdentityRow = (
  overrides: Partial<PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow> = {},
): PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow => ({
  rootRef: "root_000001",
  publicActionRef: "public_action_000",
  publicActionKeyHash: "abc123",
  publicActionOrdinal: 0,
  publicActionKind: "play_card",
  targetKind: "board_row",
  targetSide: "own",
  targetRow: "melee",
  actionPhase: "playing",
  actionRound: 1,
  sourceClass: "unit",
  strengthBucket: "medium",
  moveCount: 2,
  collisionCountWithinBucket: 1,
  ...overrides,
});

const passActionIdentityRow = (): PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow => ({
  rootRef: "root_000001",
  publicActionRef: "public_action_001",
  publicActionKeyHash: "def456",
  publicActionOrdinal: 1,
  publicActionKind: "pass",
  actionPhase: "playing",
  actionRound: 1,
  sourceClass: "none",
  moveCount: 1,
  collisionCountWithinBucket: 0,
});

const cfp77RootSummaryRow = (): PublicActionIdentitiesCompactV0Cfp77RootSummaryRow => ({
  rootRef: "root_000001",
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
  rootPublicFingerprint: "fp-1",
  legalMoveCount: 3,
  publicActionCount: 2,
  publicActionCollisionCount: 1,
  largestPublicActionBucketSize: 2,
});

const cfp77SkippedRootRow = (): PublicActionIdentitiesCompactV0Cfp77SkippedRootRow => ({
  schemaVersion: "public-action-identities-v0-skipped-root-v1",
  identityRunId: `${suiteId}:public-action-identities-v0:cFp77`,
  suiteId,
  matchupId: "starter-nr-vs-ng",
  seed: "seed-2",
  mirrorGroupId: "starter-nr-vs-ng:seed-2",
  mirrorIndex: 1,
  step: 20,
  decisionIndex: 19,
  phase: "playing",
  round: 1,
  seatId: "seat_a",
  policyId: "legal-heuristic-v1",
  faction: "northern_realms",
  deckPresetId: "official-northern-realms-starter",
  rootPublicFingerprint: "fp-skipped",
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

const cfp77Summary = (
  overrides: Partial<PublicActionIdentitiesCompactV0Cfp77SummaryInput> = {},
): PublicActionIdentitiesCompactV0Cfp77SummaryInput => ({
  identityRunId: `${suiteId}:public-action-identities-v0:cFp77`,
  suiteId,
  identityReadinessStatus: "identity_ready",
  actionIdentityRowCount: 2,
  rootSummaryRowCount: 1,
  skippedRootRowCount: 1,
  sourceConsistency: { status: "ready" },
  artifactByteSizes: {
    actionIdentitiesJsonlBytes: 6_000_000,
    rootSummariesJsonlBytes: 4_000_000,
    skippedRootsJsonlBytes: 100_000,
  },
  ...overrides,
});

const sourceArtifactReferences: readonly PublicActionIdentitiesCompactV0SourceArtifactReference[] =
  [
    { label: "cFp77:manifest.json", relativePath: "cFp77/manifest.json", sha256: "aaa" },
    { label: "cFp77:summary.json", relativePath: "cFp77/summary.json", sha256: "bbb" },
    { label: "cFp77:action-identities.jsonl", relativePath: "cFp77/action-identities.jsonl", sha256: "ccc" },
    { label: "cFp77:root-summaries.jsonl", relativePath: "cFp77/root-summaries.jsonl", sha256: "ddd" },
    { label: "cFp77:skipped-roots.jsonl", relativePath: "cFp77/skipped-roots.jsonl", sha256: "eee" },
    { label: "cFp77:report.md", relativePath: "cFp77/report.md", sha256: "fff" },
  ];

const cfp77Sizes = {
  actionIdentitiesJsonlBytes: 6_000_000,
  rootSummariesJsonlBytes: 4_000_000,
  skippedRootsJsonlBytes: 100_000,
};

const baseInput = (
  overrides: Partial<PublicActionIdentitiesCompactV0BuildInput> = {},
): PublicActionIdentitiesCompactV0BuildInput => ({
  suiteId,
  compactRunId,
  sourceCfp77RunId: `${suiteId}:public-action-identities-v0:cFp77`,
  cfp77Summary: cfp77Summary(),
  cfp77ActionIdentities: [cfp77ActionIdentityRow(), passActionIdentityRow()],
  cfp77RootSummaries: [cfp77RootSummaryRow()],
  cfp77SkippedRoots: [cfp77SkippedRootRow()],
  sourceArtifactReferenceCount: 6,
  sourceArtifactEmptyHashCount: 0,
  ...overrides,
});

const buildArtifacts = (overrides: Partial<PublicActionIdentitiesCompactV0BuildInput> = {}) =>
  serializePublicActionIdentitiesCompactV0Artifacts({
    result: buildPublicActionIdentitiesCompactV0Result(baseInput(overrides)),
    compactRunId,
    suiteId,
    sourceBenchmarkSuiteId: suiteId,
    sourceCfp77RunId: `${suiteId}:public-action-identities-v0:cFp77`,
    sourceArtifactReferences,
    cfp77Sizes,
  });

describe("public action identities compact v0 artifacts", () => {
  it("serializes deterministically with stable hashes across two builds", () => {
    const first = buildArtifacts();
    const second = buildArtifacts();
    expect(first).toEqual(second);
    expect(publicActionIdentitiesCompactV0ArtifactHashes(first)).toEqual(
      publicActionIdentitiesCompactV0ArtifactHashes(second),
    );
  });

  it("passes the hidden-info scan for clean artifacts", () => {
    const artifacts = buildArtifacts();
    expect(scanPublicActionIdentitiesCompactV0ArtifactsForHiddenInfo(artifacts)).toEqual([]);
  });

  it("detects injected hidden-info and search-strength hazard tokens", () => {
    const artifacts = buildArtifacts();
    expect(
      scanPublicActionIdentitiesCompactV0ArtifactsForHiddenInfo({
        ...artifacts,
        summaryJson:
          `${artifacts.summaryJson}\ncardsById finalState commandLog ownHand opponentHand ` +
          `moveId sourceCardId sourceId cardId actionRef rawMove bestAction selectedAction ` +
          `actionValue expectedValue winProbability seat_b:`,
      }),
    ).toEqual(
      expect.arrayContaining([
        "cardsById",
        "finalState",
        "commandLog",
        "ownHand",
        "opponentHand",
        "moveId",
        "sourceCardId",
        "sourceId",
        "cardId",
        "actionRef",
        "rawMove",
        "bestAction",
        "selectedAction",
        "actionValue",
        "expectedValue",
        "winProbability",
        "runtime seat_b prefix",
      ]),
    );
  });

  it("includes manifest and summary fields for the compact_ready path", () => {
    const artifacts = buildArtifacts();
    const manifest = JSON.parse(artifacts.manifestJson) as Record<string, unknown>;
    const summary = JSON.parse(artifacts.summaryJson) as Record<string, unknown>;

    expect(manifest.schemaVersion).toBe("public-action-identities-compact-v0-artifact-v1");
    expect(manifest.phaseId).toBe("cFp78");
    expect(manifest.compactReadinessStatus).toBe("compact_ready");
    expect(manifest.explicitNonClaims).toEqual(CFP78_EXPLICIT_NON_CLAIMS);
    expect(manifest.cFp79Recommendation).toBe(CFP79_RECOMMENDATION_JOIN);
    expect(summary.compactActionRowCount).toBe(2);
    expect(summary.compactRootIndexRowCount).toBe(1);
    expect(summary.compactSkippedRootRowCount).toBe(1);
    expect(summary.hiddenInfoScanStatus).toBe("clean");
    expect(summary.phaseId).toBe("cFp78");
  });

  it("writes one jsonl row per compact action, root-index, and skipped-root", () => {
    const artifacts = buildArtifacts();
    expect(artifacts.actionIdentitiesCompactJsonl.trimEnd().split("\n")).toHaveLength(2);
    expect(artifacts.rootIndexJsonl.trimEnd().split("\n")).toHaveLength(1);
    expect(artifacts.skippedRootsJsonl.trimEnd().split("\n")).toHaveLength(1);
  });

  it("documents source consistency and non-claims in the report", () => {
    const artifacts = buildArtifacts();
    expect(artifacts.reportMarkdown).toContain("## Source Consistency");
    expect(artifacts.reportMarkdown).toContain("## Non-Claims");
    expect(artifacts.reportMarkdown).toContain(CFP79_RECOMMENDATION_JOIN);
    CFP78_EXPLICIT_NON_CLAIMS.forEach((claim) => {
      expect(artifacts.reportMarkdown).toContain(claim);
    });
  });

  it("uses the not-ready recommendation and empty row files when source consistency fails", () => {
    const artifacts = buildArtifacts({
      cfp77Summary: cfp77Summary({ identityReadinessStatus: "source_consistency_failed" }),
    });
    const manifest = JSON.parse(artifacts.manifestJson) as Record<string, unknown>;
    const summary = JSON.parse(artifacts.summaryJson) as Record<string, unknown>;

    expect(manifest.compactReadinessStatus).toBe("source_consistency_failed");
    expect(manifest.cFp79Recommendation).toBe(CFP79_RECOMMENDATION_NOT_READY);
    expect(summary.compactReadinessStatus).toBe("source_consistency_failed");
    expect(artifacts.actionIdentitiesCompactJsonl).toBe("");
    expect(artifacts.rootIndexJsonl).toBe("");
    expect(artifacts.skippedRootsJsonl).toBe("");
    expect(artifacts.reportMarkdown).toContain(CFP79_RECOMMENDATION_NOT_READY);
  });

  it("robust-size labels are computed from actual bytes, not static prose", () => {
    const largeSize = 55 * 1024 * 1024;
    const artifacts = serializePublicActionIdentitiesCompactV0Artifacts({
      result: buildPublicActionIdentitiesCompactV0Result(baseInput()),
      compactRunId,
      suiteId,
      sourceBenchmarkSuiteId: suiteId,
      sourceCfp77RunId: `${suiteId}:public-action-identities-v0:cFp77`,
      sourceArtifactReferences,
      cfp77Sizes: { ...cfp77Sizes, actionIdentitiesJsonlBytes: largeSize },
    });
    const summary = JSON.parse(artifacts.summaryJson) as {
      isBelowCompactActionTarget: boolean;
      bytesSaved: { actionIdentitiesCompactVsCfp77Bytes: number };
    };
    expect(typeof summary.isBelowCompactActionTarget).toBe("boolean");
    expect(typeof summary.bytesSaved.actionIdentitiesCompactVsCfp77Bytes).toBe("number");
  });
});
