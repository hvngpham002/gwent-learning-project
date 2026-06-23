import { describe, expect, it } from "vitest";

import {
  buildPublicActionIdentitiesCompactV0ActionRows,
  buildPublicActionIdentitiesCompactV0Result,
  buildPublicActionIdentitiesCompactV0RootIndexRows,
  buildPublicActionIdentitiesCompactV0TargetToken,
  publicActionIdentitiesCompactV0MoveCountBucket,
  type PublicActionIdentitiesCompactV0BuildInput,
  type PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow,
  type PublicActionIdentitiesCompactV0Cfp77RootSummaryRow,
  type PublicActionIdentitiesCompactV0Cfp77SkippedRootRow,
  type PublicActionIdentitiesCompactV0Cfp77SummaryInput,
  type PublicActionIdentitiesCompactV0SourceConsistency,
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

const passActionIdentityRow = (
  overrides: Partial<PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow> = {},
): PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow => ({
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
  ...overrides,
});

const cfp77RootSummaryRow = (
  overrides: Partial<PublicActionIdentitiesCompactV0Cfp77RootSummaryRow> = {},
): PublicActionIdentitiesCompactV0Cfp77RootSummaryRow => ({
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
  ...overrides,
});

const cfp77SkippedRootRow = (
  overrides: Partial<PublicActionIdentitiesCompactV0Cfp77SkippedRootRow> = {},
): PublicActionIdentitiesCompactV0Cfp77SkippedRootRow => ({
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
  ...overrides,
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

describe("public action identities compact v0", () => {
  it("preserves (rootRef, publicActionRef) from cFp77 action identity rows", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(baseInput());
    expect(result.compactReadinessStatus).toBe("compact_ready");
    expect(result.compactActionRows).toHaveLength(2);

    const [playRow, passRow] = result.compactActionRows;
    expect(playRow.rootRef).toBe("root_000001");
    expect(playRow.publicActionRef).toBe("public_action_000");
    expect(passRow.rootRef).toBe("root_000001");
    expect(passRow.publicActionRef).toBe("public_action_001");
  });

  it("preserves publicActionKeyHash from cFp77 action identity rows", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(baseInput());
    const [playRow, passRow] = result.compactActionRows;
    expect(playRow.publicActionKeyHash).toBe("abc123");
    expect(passRow.publicActionKeyHash).toBe("def456");
  });

  it("preserves public action kind (as kind) from cFp77 rows", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(baseInput());
    const [playRow, passRow] = result.compactActionRows;
    expect(playRow.kind).toBe("play_card");
    expect(passRow.kind).toBe("pass");
  });

  it("preserves ordinal and moveCount from cFp77 rows", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(baseInput());
    const [playRow, passRow] = result.compactActionRows;
    expect(playRow.ordinal).toBe(0);
    expect(playRow.moveCount).toBe(2);
    expect(passRow.ordinal).toBe(1);
    expect(passRow.moveCount).toBe(1);
  });

  it("omits derivable cFp77 fields: actionPhase, actionRound, collisionCountWithinBucket", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(baseInput());
    result.compactActionRows.forEach((row) => {
      expect(row).not.toHaveProperty("actionPhase");
      expect(row).not.toHaveProperty("actionRound");
      expect(row).not.toHaveProperty("collisionCountWithinBucket");
    });
  });

  it("compacts target fields into a safe deterministic token", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(baseInput());
    const [playRow, passRow] = result.compactActionRows;
    expect(playRow.target).toBe("board_row|own|melee");
    expect(passRow.target).toBeUndefined();
  });

  it("buildPublicActionIdentitiesCompactV0TargetToken omits when targetKind and targetSide absent", () => {
    expect(buildPublicActionIdentitiesCompactV0TargetToken({})).toBeUndefined();
    expect(buildPublicActionIdentitiesCompactV0TargetToken({ targetKind: "board_row", targetSide: "own", targetRow: "melee" })).toBe("board_row|own|melee");
    expect(buildPublicActionIdentitiesCompactV0TargetToken({ targetKind: "board_row", targetSide: "own" })).toBe("board_row|own");
  });

  it("root-index rows preserve cFp77 root identity fields needed for joins", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(baseInput());
    expect(result.compactRootIndexRows).toHaveLength(1);
    const indexRow = result.compactRootIndexRows[0];
    expect(indexRow.rootRef).toBe("root_000001");
    expect(indexRow.suiteId).toBe(suiteId);
    expect(indexRow.matchupId).toBe("starter-nr-vs-ng");
    expect(indexRow.seed).toBe("seed-1");
    expect(indexRow.phase).toBe("playing");
    expect(indexRow.round).toBe(1);
    expect(indexRow.policyId).toBe("legal-heuristic-v1");
    expect(indexRow.faction).toBe("northern_realms");
    expect(indexRow.rootPublicFingerprint).toBe("fp-1");
    expect(indexRow.publicActionCount).toBe(2);
    expect(indexRow.legalMoveCount).toBe(3);
    expect(indexRow.publicActionCollisionCount).toBe(1);
    expect(indexRow.largestPublicActionBucketSize).toBe(2);
    expect(indexRow.schemaVersion).toBe("public-action-identities-compact-v0-root-index-v1");
  });

  it("skipped-root rows are forwarded with updated schema version and compactRunId", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(baseInput());
    expect(result.compactSkippedRootRows).toHaveLength(1);
    const skippedRow = result.compactSkippedRootRows[0];
    expect(skippedRow.schemaVersion).toBe("public-action-identities-compact-v0-skipped-root-v1");
    expect(skippedRow.compactRunId).toBe(compactRunId);
    expect(skippedRow.skipReason).toBe("sampler_invalid_public_zone_count_deficit");
    expect(skippedRow.eligibilityStatus).toBe("skipped_invalid_root");
  });

  it("source consistency fails when cFp77 has no compact action rows (missing rootRef)", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(
      baseInput({
        cfp77ActionIdentities: [cfp77ActionIdentityRow({ rootRef: "root_MISSING" })],
        cfp77Summary: cfp77Summary({ actionIdentityRowCount: 1 }),
      }),
    );
    expect(result.compactReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.compactActionRowsWithMissingRootRef).toBe(1);
  });

  it("source consistency fails on duplicate compact action keys", () => {
    const dupRow = cfp77ActionIdentityRow();
    const result = buildPublicActionIdentitiesCompactV0Result(
      baseInput({
        cfp77ActionIdentities: [dupRow, dupRow],
        cfp77Summary: cfp77Summary({ actionIdentityRowCount: 2 }),
      }),
    );
    expect(result.compactReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.duplicateCompactActionKeys).toBeGreaterThan(0);
  });

  it("source consistency fails when cFp77 identityReadinessStatus is not identity_ready", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(
      baseInput({
        cfp77Summary: cfp77Summary({ identityReadinessStatus: "source_consistency_failed" }),
      }),
    );
    expect(result.compactReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.cfp77IdentityReadinessStatus).toBe("source_consistency_failed");
  });

  it("source consistency fails when cFp77 action/root/skipped source row counts do not match actual", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(
      baseInput({
        cfp77Summary: cfp77Summary({ actionIdentityRowCount: 99 }),
      }),
    );
    expect(result.compactReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.cfp77ActionIdentityRowCountActualDelta).toBe(97);
  });

  it("source consistency fails when cFp77 sourceConsistency.status is not ready", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(
      baseInput({
        cfp77Summary: cfp77Summary({ sourceConsistency: { status: "not_ready" } }),
      }),
    );
    expect(result.compactReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.cfp77SourceConsistencyStatus).toBe("not_ready");
  });

  it("returns empty rows when source consistency fails", () => {
    const result = buildPublicActionIdentitiesCompactV0Result(
      baseInput({
        cfp77Summary: cfp77Summary({ identityReadinessStatus: "source_consistency_failed" }),
      }),
    );
    expect(result.compactActionRows).toHaveLength(0);
    expect(result.compactRootIndexRows).toHaveLength(0);
    expect(result.compactSkippedRootRows).toHaveLength(0);
  });

  it("move-count bucket helper classifies correctly", () => {
    expect(publicActionIdentitiesCompactV0MoveCountBucket(1)).toBe("single");
    expect(publicActionIdentitiesCompactV0MoveCountBucket(2)).toBe("small_collision");
    expect(publicActionIdentitiesCompactV0MoveCountBucket(3)).toBe("small_collision");
    expect(publicActionIdentitiesCompactV0MoveCountBucket(4)).toBe("large_collision");
  });

  it("buildPublicActionIdentitiesCompactV0ActionRows is deterministic for the same input", () => {
    const input = baseInput();
    const first = buildPublicActionIdentitiesCompactV0ActionRows(input);
    const second = buildPublicActionIdentitiesCompactV0ActionRows(input);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it("buildPublicActionIdentitiesCompactV0RootIndexRows preserves all required join fields", () => {
    const rows = buildPublicActionIdentitiesCompactV0RootIndexRows(baseInput());
    const row = rows[0];
    expect(row).toHaveProperty("rootRef");
    expect(row).toHaveProperty("suiteId");
    expect(row).toHaveProperty("matchupId");
    expect(row).toHaveProperty("seed");
    expect(row).toHaveProperty("phase");
    expect(row).toHaveProperty("round");
    expect(row).toHaveProperty("seatId");
    expect(row).toHaveProperty("policyId");
    expect(row).toHaveProperty("faction");
    expect(row).toHaveProperty("deckPresetId");
    expect(row).toHaveProperty("rootPublicFingerprint");
    expect(row).toHaveProperty("publicActionCount");
    expect(row).toHaveProperty("legalMoveCount");
    expect(row).toHaveProperty("publicActionCollisionCount");
    expect(row).toHaveProperty("largestPublicActionBucketSize");
  });

  const sourceSizeConsistencyCases: Array<{
    name: string;
    mutate: (input: PublicActionIdentitiesCompactV0BuildInput) => PublicActionIdentitiesCompactV0BuildInput;
    field: keyof PublicActionIdentitiesCompactV0SourceConsistency;
  }> = [
    {
      name: "cFp77 action identity count mismatch",
      mutate: (input) => ({
        ...input,
        cfp77Summary: { ...input.cfp77Summary, actionIdentityRowCount: 99 },
      }),
      field: "cfp77ActionIdentityRowCountActualDelta",
    },
    {
      name: "cFp77 root summary count mismatch",
      mutate: (input) => ({
        ...input,
        cfp77Summary: { ...input.cfp77Summary, rootSummaryRowCount: 99 },
      }),
      field: "cfp77RootSummaryRowCountActualDelta",
    },
    {
      name: "cFp77 skipped root count mismatch",
      mutate: (input) => ({
        ...input,
        cfp77Summary: { ...input.cfp77Summary, skippedRootRowCount: 99 },
      }),
      field: "cfp77SkippedRootRowCountActualDelta",
    },
  ];

  it.each(sourceSizeConsistencyCases)(
    "source consistency fails with nonzero $field for $name",
    ({ mutate, field }) => {
      const result = buildPublicActionIdentitiesCompactV0Result(mutate(baseInput()));
      expect(result.compactReadinessStatus).toBe("source_consistency_failed");
      expect(result.sourceConsistency[field]).not.toBe(0);
    },
  );
});
