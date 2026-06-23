import type { DeterminizedProbeContractSourceArtifactReference } from "./determinizedProbeContract";

export type PublicActionIdentitiesCompactV0ActionSchemaVersion =
  "public-action-identities-compact-v0-action-v1";
export type PublicActionIdentitiesCompactV0RootIndexSchemaVersion =
  "public-action-identities-compact-v0-root-index-v1";
export type PublicActionIdentitiesCompactV0SkippedRootSchemaVersion =
  "public-action-identities-compact-v0-skipped-root-v1";
export type PublicActionIdentitiesCompactV0SummarySchemaVersion =
  "public-action-identities-compact-v0-summary-v1";

export type PublicActionIdentitiesCompactV0ReadinessStatus =
  | "compact_ready"
  | "source_consistency_failed";

export type PublicActionIdentitiesCompactV0SourceArtifactReference =
  DeterminizedProbeContractSourceArtifactReference;

// ---------------------------------------------------------------------------
// Input shapes — consumed from committed cFp77 JSONL artifacts. cFp78 reads
// these artifacts as immutable source data and does not modify them.
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesCompactV0Cfp77SummaryInput {
  identityRunId: string;
  suiteId: string;
  identityReadinessStatus: string;
  actionIdentityRowCount: number;
  rootSummaryRowCount: number;
  skippedRootRowCount: number;
  sourceConsistency: { status: string };
  artifactByteSizes: {
    actionIdentitiesJsonlBytes: number;
    rootSummariesJsonlBytes: number;
    skippedRootsJsonlBytes: number;
  };
}

export interface PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow {
  rootRef: string;
  publicActionRef: string;
  publicActionKeyHash: string;
  publicActionOrdinal: number;
  publicActionKind: string;
  targetKind?: string;
  targetSide?: string;
  targetRow?: string;
  actionPhase: string;
  actionRound: number;
  sourceClass: string;
  strengthBucket?: string;
  optionIndexLabel?: string;
  moveCount: number;
  collisionCountWithinBucket: number;
}

export interface PublicActionIdentitiesCompactV0Cfp77RootSummaryRow {
  rootRef: string;
  suiteId: string;
  matchupId: string;
  seed: string;
  mirrorGroupId?: string;
  mirrorIndex?: number;
  step: number;
  decisionIndex: number;
  phase: string;
  round: number;
  seatId: string;
  policyId: string;
  faction: string;
  deckPresetId: string;
  rootPublicFingerprint: string;
  legalMoveCount: number;
  publicActionCount: number;
  publicActionCollisionCount: number;
  largestPublicActionBucketSize: number;
}

export interface PublicActionIdentitiesCompactV0Cfp77SkippedRootRow {
  schemaVersion: string;
  identityRunId: string;
  suiteId: string;
  matchupId: string;
  seed: string;
  mirrorGroupId?: string;
  mirrorIndex?: number;
  step: number;
  decisionIndex: number;
  phase: string;
  round: number;
  seatId: string;
  policyId: string;
  faction: string;
  deckPresetId: string;
  rootPublicFingerprint: string;
  identityReadinessStatus: string;
  eligibilityStatus: string;
  skipReason: string;
  invalidReason: string;
  cFp67PrimaryClassification: string;
  cFp67TransferClassification: string;
  cFp67PersistentDeficitClassification: string;
  cFp67DeficitSizeClassification: string;
  cFp67ProvenanceLabel: string;
  skipStage: string;
  skipCounterDimensions: Record<string, string | number>;
}

// ---------------------------------------------------------------------------
// Output rows
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesCompactV0ActionRow {
  schemaVersion: PublicActionIdentitiesCompactV0ActionSchemaVersion;
  rootRef: string;
  publicActionRef: string;
  publicActionKeyHash: string;
  kind: string;
  ordinal: number;
  moveCount: number;
  sourceClass: string;
  target?: string;
  strengthBucket?: string;
  optionIndexLabel?: string;
}

export interface PublicActionIdentitiesCompactV0RootIndexRow {
  schemaVersion: PublicActionIdentitiesCompactV0RootIndexSchemaVersion;
  rootRef: string;
  suiteId: string;
  matchupId: string;
  seed: string;
  mirrorGroupId?: string;
  mirrorIndex?: number;
  step: number;
  decisionIndex: number;
  phase: string;
  round: number;
  seatId: string;
  policyId: string;
  faction: string;
  deckPresetId: string;
  rootPublicFingerprint: string;
  publicActionCount: number;
  legalMoveCount: number;
  publicActionCollisionCount: number;
  largestPublicActionBucketSize: number;
}

export interface PublicActionIdentitiesCompactV0SkippedRootRow {
  schemaVersion: PublicActionIdentitiesCompactV0SkippedRootSchemaVersion;
  compactRunId: string;
  suiteId: string;
  matchupId: string;
  seed: string;
  mirrorGroupId?: string;
  mirrorIndex?: number;
  step: number;
  decisionIndex: number;
  phase: string;
  round: number;
  seatId: string;
  policyId: string;
  faction: string;
  deckPresetId: string;
  rootPublicFingerprint: string;
  identityReadinessStatus: string;
  eligibilityStatus: string;
  skipReason: string;
  invalidReason: string;
  cFp67PrimaryClassification: string;
  cFp67TransferClassification: string;
  cFp67PersistentDeficitClassification: string;
  cFp67DeficitSizeClassification: string;
  cFp67ProvenanceLabel: string;
  skipStage: string;
  skipCounterDimensions: Record<string, string | number>;
}

// ---------------------------------------------------------------------------
// Source consistency — 18 checks verifying cFp77 source integrity and the
// fidelity of the compact projection against cFp77 source rows.
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesCompactV0SourceConsistency {
  status: "ready" | "not_ready";
  cfp77IdentityReadinessStatus: string;
  cfp77SourceConsistencyStatus: string;
  cfp77ActionIdentityRowCount: number;
  cfp77RootSummaryRowCount: number;
  cfp77SkippedRootRowCount: number;
  cfp77ActionIdentityRowCountActualDelta: number;
  cfp77RootSummaryRowCountActualDelta: number;
  cfp77SkippedRootRowCountActualDelta: number;
  compactActionRowCount: number;
  compactRootIndexRowCount: number;
  compactSkippedRootRowCount: number;
  compactVsCfp77ActionRowCountDelta: number;
  compactVsCfp77RootIndexRowCountDelta: number;
  compactVsCfp77SkippedRootRowCountDelta: number;
  compactActionRowsWithMissingRootRef: number;
  compactRootIndexRowsWithMissingCfp77Ref: number;
  duplicateCompactActionKeys: number;
  cfp77ActionKeysMissingFromCompact: number;
  compactActionKeyHashMismatchCount: number;
  compactActionKindMismatchCount: number;
  compactActionOrdinalMismatchCount: number;
  compactActionMoveCountMismatchCount: number;
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

// ---------------------------------------------------------------------------
// Build input / result
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesCompactV0BuildInput {
  suiteId: string;
  compactRunId: string;
  sourceCfp77RunId: string;
  cfp77Summary: PublicActionIdentitiesCompactV0Cfp77SummaryInput;
  cfp77ActionIdentities: readonly PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow[];
  cfp77RootSummaries: readonly PublicActionIdentitiesCompactV0Cfp77RootSummaryRow[];
  cfp77SkippedRoots: readonly PublicActionIdentitiesCompactV0Cfp77SkippedRootRow[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

export interface PublicActionIdentitiesCompactV0CountSummaries {
  publicActionKindCounts: Record<string, number>;
  countsByPhase: Record<string, number>;
  countsByRound: Record<string, number>;
  countsByPolicy: Record<string, number>;
  countsByFaction: Record<string, number>;
  countsByDeckPreset: Record<string, number>;
  countsByMatchup: Record<string, number>;
  countsBySourceClass: Record<string, number>;
  countsByTargetToken: Record<string, number>;
  countsByMoveCountBucket: Record<string, number>;
}

export interface PublicActionIdentitiesCompactV0Result {
  compactReadinessStatus: PublicActionIdentitiesCompactV0ReadinessStatus;
  sourceConsistency: PublicActionIdentitiesCompactV0SourceConsistency;
  compactActionRows: readonly PublicActionIdentitiesCompactV0ActionRow[];
  compactRootIndexRows: readonly PublicActionIdentitiesCompactV0RootIndexRow[];
  compactSkippedRootRows: readonly PublicActionIdentitiesCompactV0SkippedRootRow[];
  countSummaries: PublicActionIdentitiesCompactV0CountSummaries;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sortRecord = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

const addCount = (record: Record<string, number>, key: string) => {
  record[key] = (record[key] ?? 0) + 1;
};

export const publicActionIdentitiesCompactV0MoveCountBucket = (moveCount: number): string => {
  if (moveCount <= 1) return "single";
  if (moveCount <= 3) return "small_collision";
  return "large_collision";
};

export const buildPublicActionIdentitiesCompactV0TargetToken = (
  row: Pick<
    PublicActionIdentitiesCompactV0Cfp77ActionIdentityRow,
    "targetKind" | "targetSide" | "targetRow"
  >,
): string | undefined => {
  if (!row.targetKind && !row.targetSide) return undefined;
  const parts = [row.targetKind, row.targetSide, row.targetRow].filter(Boolean);
  return parts.length > 0 ? parts.join("|") : undefined;
};

// ---------------------------------------------------------------------------
// Compact action rows — project cFp77 action identity rows to compact form.
// Drops: actionPhase, actionRound, collisionCountWithinBucket (all derivable).
// Renames: publicActionKind→kind, publicActionOrdinal→ordinal.
// Compacts: targetKind/targetSide/targetRow→target token string.
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesCompactV0ActionRows = (
  input: PublicActionIdentitiesCompactV0BuildInput,
): PublicActionIdentitiesCompactV0ActionRow[] =>
  input.cfp77ActionIdentities.map((row) => {
    const target = buildPublicActionIdentitiesCompactV0TargetToken(row);
    return {
      schemaVersion: "public-action-identities-compact-v0-action-v1",
      rootRef: row.rootRef,
      publicActionRef: row.publicActionRef,
      publicActionKeyHash: row.publicActionKeyHash,
      kind: row.publicActionKind,
      ordinal: row.publicActionOrdinal,
      moveCount: row.moveCount,
      sourceClass: row.sourceClass,
      ...(target !== undefined ? { target } : {}),
      ...(row.strengthBucket !== undefined ? { strengthBucket: row.strengthBucket } : {}),
      ...(row.optionIndexLabel !== undefined ? { optionIndexLabel: row.optionIndexLabel } : {}),
    };
  });

// ---------------------------------------------------------------------------
// Compact root-index rows — slimmer than cFp77 root-summaries. Drops all
// per-root count maps, delta fields, and run-metadata fields; keeps only the
// fields needed for cFp79 joins and grouped diagnostics.
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesCompactV0RootIndexRows = (
  input: PublicActionIdentitiesCompactV0BuildInput,
): PublicActionIdentitiesCompactV0RootIndexRow[] =>
  input.cfp77RootSummaries.map((row) => ({
    schemaVersion: "public-action-identities-compact-v0-root-index-v1",
    rootRef: row.rootRef,
    suiteId: row.suiteId,
    matchupId: row.matchupId,
    seed: row.seed,
    ...(row.mirrorGroupId !== undefined ? { mirrorGroupId: row.mirrorGroupId } : {}),
    ...(row.mirrorIndex !== undefined ? { mirrorIndex: row.mirrorIndex } : {}),
    step: row.step,
    decisionIndex: row.decisionIndex,
    phase: row.phase,
    round: row.round,
    seatId: row.seatId,
    policyId: row.policyId,
    faction: row.faction,
    deckPresetId: row.deckPresetId,
    rootPublicFingerprint: row.rootPublicFingerprint,
    publicActionCount: row.publicActionCount,
    legalMoveCount: row.legalMoveCount,
    publicActionCollisionCount: row.publicActionCollisionCount,
    largestPublicActionBucketSize: row.largestPublicActionBucketSize,
  }));

// ---------------------------------------------------------------------------
// Compact skipped-root rows — forward cFp77 skipped-root rows with updated
// schema version and compactRunId; all skip classification fields are preserved.
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesCompactV0SkippedRootRows = (
  input: PublicActionIdentitiesCompactV0BuildInput,
): PublicActionIdentitiesCompactV0SkippedRootRow[] =>
  input.cfp77SkippedRoots.map((row) => ({
    schemaVersion: "public-action-identities-compact-v0-skipped-root-v1",
    compactRunId: input.compactRunId,
    suiteId: row.suiteId,
    matchupId: row.matchupId,
    seed: row.seed,
    ...(row.mirrorGroupId !== undefined ? { mirrorGroupId: row.mirrorGroupId } : {}),
    ...(row.mirrorIndex !== undefined ? { mirrorIndex: row.mirrorIndex } : {}),
    step: row.step,
    decisionIndex: row.decisionIndex,
    phase: row.phase,
    round: row.round,
    seatId: row.seatId,
    policyId: row.policyId,
    faction: row.faction,
    deckPresetId: row.deckPresetId,
    rootPublicFingerprint: row.rootPublicFingerprint,
    identityReadinessStatus: row.identityReadinessStatus,
    eligibilityStatus: row.eligibilityStatus,
    skipReason: row.skipReason,
    invalidReason: row.invalidReason,
    cFp67PrimaryClassification: row.cFp67PrimaryClassification,
    cFp67TransferClassification: row.cFp67TransferClassification,
    cFp67PersistentDeficitClassification: row.cFp67PersistentDeficitClassification,
    cFp67DeficitSizeClassification: row.cFp67DeficitSizeClassification,
    cFp67ProvenanceLabel: row.cFp67ProvenanceLabel,
    skipStage: row.skipStage,
    skipCounterDimensions: { ...row.skipCounterDimensions },
  }));

// ---------------------------------------------------------------------------
// Source consistency — 18 checks
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesCompactV0SourceConsistency = (
  input: PublicActionIdentitiesCompactV0BuildInput,
  compactActionRows: readonly PublicActionIdentitiesCompactV0ActionRow[],
  compactRootIndexRows: readonly PublicActionIdentitiesCompactV0RootIndexRow[],
  compactSkippedRootRows: readonly PublicActionIdentitiesCompactV0SkippedRootRow[],
): PublicActionIdentitiesCompactV0SourceConsistency => {
  const cfp77ActionIdentityRowCountActualDelta =
    input.cfp77Summary.actionIdentityRowCount - input.cfp77ActionIdentities.length;
  const cfp77RootSummaryRowCountActualDelta =
    input.cfp77Summary.rootSummaryRowCount - input.cfp77RootSummaries.length;
  const cfp77SkippedRootRowCountActualDelta =
    input.cfp77Summary.skippedRootRowCount - input.cfp77SkippedRoots.length;

  const compactVsCfp77ActionRowCountDelta =
    compactActionRows.length - input.cfp77ActionIdentities.length;
  const compactVsCfp77RootIndexRowCountDelta =
    compactRootIndexRows.length - input.cfp77RootSummaries.length;
  const compactVsCfp77SkippedRootRowCountDelta =
    compactSkippedRootRows.length - input.cfp77SkippedRoots.length;

  const compactRootIndexRefs = new Set(compactRootIndexRows.map((r) => r.rootRef));
  const cfp77RootSummaryRefs = new Set(input.cfp77RootSummaries.map((r) => r.rootRef));

  const compactActionRowsWithMissingRootRef = compactActionRows.filter(
    (r) => !compactRootIndexRefs.has(r.rootRef),
  ).length;

  const compactRootIndexRowsWithMissingCfp77Ref = compactRootIndexRows.filter(
    (r) => !cfp77RootSummaryRefs.has(r.rootRef),
  ).length;

  const compactActionKeyCounts = new Map<string, number>();
  compactActionRows.forEach((r) => {
    const key = `${r.rootRef}::${r.publicActionRef}`;
    compactActionKeyCounts.set(key, (compactActionKeyCounts.get(key) ?? 0) + 1);
  });
  const duplicateCompactActionKeys = [...compactActionKeyCounts.values()].filter(
    (count) => count > 1,
  ).length;

  const cfp77KeysInCompact = new Set(
    compactActionRows.map((r) => `${r.rootRef}::${r.publicActionRef}`),
  );
  const cfp77ActionKeysMissingFromCompact = input.cfp77ActionIdentities.filter(
    (r) => !cfp77KeysInCompact.has(`${r.rootRef}::${r.publicActionRef}`),
  ).length;

  const cfp77ByKey = new Map(
    input.cfp77ActionIdentities.map((r) => [`${r.rootRef}::${r.publicActionRef}`, r]),
  );
  let compactActionKeyHashMismatchCount = 0;
  let compactActionKindMismatchCount = 0;
  let compactActionOrdinalMismatchCount = 0;
  let compactActionMoveCountMismatchCount = 0;
  compactActionRows.forEach((compact) => {
    const cfp77 = cfp77ByKey.get(`${compact.rootRef}::${compact.publicActionRef}`);
    if (!cfp77) return;
    if (compact.publicActionKeyHash !== cfp77.publicActionKeyHash) compactActionKeyHashMismatchCount++;
    if (compact.kind !== cfp77.publicActionKind) compactActionKindMismatchCount++;
    if (compact.ordinal !== cfp77.publicActionOrdinal) compactActionOrdinalMismatchCount++;
    if (compact.moveCount !== cfp77.moveCount) compactActionMoveCountMismatchCount++;
  });

  const checks: boolean[] = [
    input.cfp77Summary.identityReadinessStatus === "identity_ready",
    input.cfp77Summary.sourceConsistency.status === "ready",
    cfp77ActionIdentityRowCountActualDelta === 0,
    cfp77RootSummaryRowCountActualDelta === 0,
    cfp77SkippedRootRowCountActualDelta === 0,
    compactVsCfp77ActionRowCountDelta === 0,
    compactVsCfp77RootIndexRowCountDelta === 0,
    compactVsCfp77SkippedRootRowCountDelta === 0,
    compactActionRowsWithMissingRootRef === 0,
    compactRootIndexRowsWithMissingCfp77Ref === 0,
    duplicateCompactActionKeys === 0,
    cfp77ActionKeysMissingFromCompact === 0,
    compactActionKeyHashMismatchCount === 0,
    compactActionKindMismatchCount === 0,
    compactActionOrdinalMismatchCount === 0,
    compactActionMoveCountMismatchCount === 0,
    input.sourceArtifactReferenceCount > 0,
    input.sourceArtifactEmptyHashCount === 0,
  ];

  return {
    status: checks.every(Boolean) ? "ready" : "not_ready",
    cfp77IdentityReadinessStatus: input.cfp77Summary.identityReadinessStatus,
    cfp77SourceConsistencyStatus: input.cfp77Summary.sourceConsistency.status,
    cfp77ActionIdentityRowCount: input.cfp77Summary.actionIdentityRowCount,
    cfp77RootSummaryRowCount: input.cfp77Summary.rootSummaryRowCount,
    cfp77SkippedRootRowCount: input.cfp77Summary.skippedRootRowCount,
    cfp77ActionIdentityRowCountActualDelta,
    cfp77RootSummaryRowCountActualDelta,
    cfp77SkippedRootRowCountActualDelta,
    compactActionRowCount: compactActionRows.length,
    compactRootIndexRowCount: compactRootIndexRows.length,
    compactSkippedRootRowCount: compactSkippedRootRows.length,
    compactVsCfp77ActionRowCountDelta,
    compactVsCfp77RootIndexRowCountDelta,
    compactVsCfp77SkippedRootRowCountDelta,
    compactActionRowsWithMissingRootRef,
    compactRootIndexRowsWithMissingCfp77Ref,
    duplicateCompactActionKeys,
    cfp77ActionKeysMissingFromCompact,
    compactActionKeyHashMismatchCount,
    compactActionKindMismatchCount,
    compactActionOrdinalMismatchCount,
    compactActionMoveCountMismatchCount,
    sourceArtifactReferenceCount: input.sourceArtifactReferenceCount,
    sourceArtifactEmptyHashCount: input.sourceArtifactEmptyHashCount,
  };
};

// ---------------------------------------------------------------------------
// Count summaries
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesCompactV0CountSummaries = ({
  compactActionRows,
  compactRootIndexRows,
}: {
  compactActionRows: readonly PublicActionIdentitiesCompactV0ActionRow[];
  compactRootIndexRows: readonly PublicActionIdentitiesCompactV0RootIndexRow[];
}): PublicActionIdentitiesCompactV0CountSummaries => {
  const publicActionKindCounts: Record<string, number> = {};
  const countsByPhase: Record<string, number> = {};
  const countsByRound: Record<string, number> = {};
  const countsByPolicy: Record<string, number> = {};
  const countsByFaction: Record<string, number> = {};
  const countsByDeckPreset: Record<string, number> = {};
  const countsByMatchup: Record<string, number> = {};
  const countsBySourceClass: Record<string, number> = {};
  const countsByTargetToken: Record<string, number> = {};
  const countsByMoveCountBucket: Record<string, number> = {};

  const rootByRef = new Map(compactRootIndexRows.map((r) => [r.rootRef, r]));

  compactActionRows.forEach((row) => {
    const root = rootByRef.get(row.rootRef);
    addCount(publicActionKindCounts, row.kind);
    addCount(countsBySourceClass, row.sourceClass);
    addCount(countsByTargetToken, row.target ?? "none");
    addCount(countsByMoveCountBucket, publicActionIdentitiesCompactV0MoveCountBucket(row.moveCount));
    if (root) {
      addCount(countsByPhase, root.phase);
      addCount(countsByRound, String(root.round));
      addCount(countsByPolicy, root.policyId);
      addCount(countsByFaction, root.faction);
      addCount(countsByDeckPreset, root.deckPresetId);
      addCount(countsByMatchup, root.matchupId);
    }
  });

  return {
    publicActionKindCounts: sortRecord(publicActionKindCounts),
    countsByPhase: sortRecord(countsByPhase),
    countsByRound: sortRecord(countsByRound),
    countsByPolicy: sortRecord(countsByPolicy),
    countsByFaction: sortRecord(countsByFaction),
    countsByDeckPreset: sortRecord(countsByDeckPreset),
    countsByMatchup: sortRecord(countsByMatchup),
    countsBySourceClass: sortRecord(countsBySourceClass),
    countsByTargetToken: sortRecord(countsByTargetToken),
    countsByMoveCountBucket: sortRecord(countsByMoveCountBucket),
  };
};

// ---------------------------------------------------------------------------
// Top-level build — projects cFp77 artifacts into compact form
// ---------------------------------------------------------------------------

const emptyCountSummaries = (): PublicActionIdentitiesCompactV0CountSummaries => ({
  publicActionKindCounts: {},
  countsByPhase: {},
  countsByRound: {},
  countsByPolicy: {},
  countsByFaction: {},
  countsByDeckPreset: {},
  countsByMatchup: {},
  countsBySourceClass: {},
  countsByTargetToken: {},
  countsByMoveCountBucket: {},
});

export const buildPublicActionIdentitiesCompactV0Result = (
  input: PublicActionIdentitiesCompactV0BuildInput,
): PublicActionIdentitiesCompactV0Result => {
  const compactActionRows = buildPublicActionIdentitiesCompactV0ActionRows(input);
  const compactRootIndexRows = buildPublicActionIdentitiesCompactV0RootIndexRows(input);
  const compactSkippedRootRows = buildPublicActionIdentitiesCompactV0SkippedRootRows(input);

  const sourceConsistency = buildPublicActionIdentitiesCompactV0SourceConsistency(
    input,
    compactActionRows,
    compactRootIndexRows,
    compactSkippedRootRows,
  );

  if (sourceConsistency.status !== "ready") {
    return {
      compactReadinessStatus: "source_consistency_failed",
      sourceConsistency,
      compactActionRows: [],
      compactRootIndexRows: [],
      compactSkippedRootRows: [],
      countSummaries: emptyCountSummaries(),
    };
  }

  return {
    compactReadinessStatus: "compact_ready",
    sourceConsistency,
    compactActionRows,
    compactRootIndexRows,
    compactSkippedRootRows,
    countSummaries: buildPublicActionIdentitiesCompactV0CountSummaries({
      compactActionRows,
      compactRootIndexRows,
    }),
  };
};
