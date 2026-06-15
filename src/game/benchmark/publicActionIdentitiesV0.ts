import type { MatchPhase } from "@/game/core";

import {
  buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets,
  type DeterminizedPimcActionAvailabilityV0PublicActionBucket,
} from "./determinizedPimcActionAvailabilityV0";
import {
  buildDeterminizedProbeContractRootKey,
  type DeterminizedProbeContractSourceArtifactReference,
} from "./determinizedProbeContract";
import type { DeterminizedPimcProbeV0RootIdentity } from "./determinizedPimcProbeV0";
import { hashSamplerReadinessPublicValue } from "./samplerReadiness";
import type {
  PublicActionSourceClass,
  PublicActionStrengthBucket,
  PublicActionTargetKind,
  PublicActionTargetSide,
  PublicSearchActionKind,
} from "./samplerReadiness";
import { runBenchmarkSuite } from "./runBenchmark";
import type {
  BenchmarkPolicyRegistry,
  BenchmarkRootObserverInput,
  BenchmarkRunResult,
  BenchmarkSuite,
} from "./types";

export type PublicActionIdentitiesV0ActionIdentitySchemaVersion =
  "public-action-identities-v0-action-identity-v1";
export type PublicActionIdentitiesV0RootSummarySchemaVersion =
  "public-action-identities-v0-root-summary-v1";
export type PublicActionIdentitiesV0SkippedRootSchemaVersion =
  "public-action-identities-v0-skipped-root-v1";
export type PublicActionIdentitiesV0SummarySchemaVersion =
  "public-action-identities-v0-summary-v1";

export type PublicActionIdentitiesV0IdentityReadinessStatus =
  | "identity_ready"
  | "source_consistency_failed";

export type PublicActionIdentitiesV0SourceArtifactReference =
  DeterminizedProbeContractSourceArtifactReference;

export type PublicActionIdentitiesV0RootIdentity = DeterminizedPimcProbeV0RootIdentity;

export const buildPublicActionIdentitiesV0RootKey = buildDeterminizedProbeContractRootKey;

export type PublicActionIdentitiesV0BucketSizeClass =
  | "single"
  | "small_collision"
  | "large_collision";

export type PublicActionIdentitiesV0ActionFamily =
  | "mulligan"
  | "unit_play"
  | "leader"
  | "prompt"
  | "pass"
  | "round_resolution"
  | "other";

// ---------------------------------------------------------------------------
// Source input record shapes (subset of fields consumed from committed
// cFp68/cFp69/cFp76 artifacts). cFp77 reads these artifacts but never
// mutates them.
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesV0Cfp68EligibleRootInput
  extends PublicActionIdentitiesV0RootIdentity {
  eligibilityStatus: "eligible_valid_root";
}

export interface PublicActionIdentitiesV0Cfp68SkippedRootInput
  extends PublicActionIdentitiesV0RootIdentity {
  eligibilityStatus: "skipped_invalid_root";
}

export interface PublicActionIdentitiesV0Cfp69ProbeRootInput
  extends PublicActionIdentitiesV0RootIdentity {
  probeStatus: string;
  legalMoveCount: number;
  publicActionCount: number;
}

export interface PublicActionIdentitiesV0Cfp69SkippedRootInput
  extends PublicActionIdentitiesV0RootIdentity {
  eligibilityStatus: "skipped_invalid_root";
  skipReason: string;
  invalidReason: string;
  cFp67PrimaryClassification: string;
  cFp67TransferClassification: string;
  cFp67PersistentDeficitClassification: string;
  cFp67DeficitSizeClassification: string;
  cFp67ProvenanceLabel: string;
  skipCounterDimensions: Record<string, string | number>;
}

// ---------------------------------------------------------------------------
// Minimal source summary shapes consumed for source consistency checks.
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesV0Cfp68SummaryInput {
  contractStatus: string;
  eligibleRootCount: number;
  skippedRootCount: number;
}

export interface PublicActionIdentitiesV0Cfp69SummaryInput {
  probeReadinessStatus: string;
  probeRootCount: number;
  skippedRootCount: number;
}

export interface PublicActionIdentitiesV0Cfp76SummaryInput {
  consumerReadinessStatus: string;
  rootFeatureRowCount: number;
  actionFeatureRowCount: number;
  actionFeatureGapRowCount: number;
  skippedRootRowCount: number;
}

// ---------------------------------------------------------------------------
// Observed roots (re-run benchmark suite, mirroring cFp69's rootObserver)
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesV0ObservedRoot
  extends Omit<PublicActionIdentitiesV0RootIdentity, "rootPublicFingerprint"> {
  legalMoveCount: number;
  publicActionBuckets: readonly DeterminizedPimcActionAvailabilityV0PublicActionBucket[];
  observationStatus: "completed" | "public_action_abstraction_failed";
}

export const buildPublicActionIdentitiesV0ObservedRoot = (
  input: BenchmarkRootObserverInput,
): PublicActionIdentitiesV0ObservedRoot => {
  const seat = input.seats[input.seatId];
  const identity = {
    suiteId: input.suiteId,
    matchupId: input.matchupId,
    seed: input.seed,
    ...(input.mirrorGroupId ? { mirrorGroupId: input.mirrorGroupId } : {}),
    ...(input.mirrorIndex === undefined ? {} : { mirrorIndex: input.mirrorIndex }),
    step: input.step,
    decisionIndex: input.decisionIndex,
    phase: input.state.phase,
    round: input.state.round,
    seatId: input.seatId,
    policyId: input.policyId,
    faction: seat.faction,
    deckPresetId: seat.deckPresetId,
  };

  try {
    const publicActionBuckets = buildDeterminizedPimcActionAvailabilityV0PublicActionBuckets(
      input.legalMoves,
      input.state.phase,
      input.state.round,
    );
    return {
      ...identity,
      legalMoveCount: input.legalMoves.length,
      publicActionBuckets,
      observationStatus: "completed",
    };
  } catch {
    return {
      ...identity,
      legalMoveCount: input.legalMoves.length,
      publicActionBuckets: [],
      observationStatus: "public_action_abstraction_failed",
    };
  }
};

// ---------------------------------------------------------------------------
// Source consistency
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesV0SourceConsistency {
  status: "ready" | "not_ready";
  cFp68ContractStatus: string;
  cFp69ProbeReadinessStatus: string;
  cFp76ConsumerReadinessStatus: string;
  cFp68EligibleRootCount: number;
  cFp68SkippedRootCount: number;
  cFp69ProbeRootCount: number;
  cFp69SkippedRootCount: number;
  cFp76RootFeatureRowCount: number;
  cFp76ActionFeatureRowCount: number;
  cFp76ActionFeatureGapRowCount: number;
  cFp76SkippedRootRowCount: number;
  cfp68EligibleRootCountActualDelta: number;
  cfp68SkippedRootCountActualDelta: number;
  cfp69ProbeRootCountActualDelta: number;
  cfp69SkippedRootCountActualDelta: number;
  cfp76RootFeatureRowCountActualDelta: number;
  cfp76SkippedRootCountVsCfp69SkippedRootCountDelta: number;
  cfp76SkippedRootCountVsCfp68SkippedRootCountDelta: number;
  cfp76ReadinessIsActionFeatureSourceGap: boolean;
  cfp76ActionFeatureRowCountIsZero: boolean;
  cfp76ActionFeatureGapRowCountIsPositive: boolean;
  observedRootCount: number;
  duplicateObservedRootKeys: number;
  duplicateCfp68EligibleRootKeys: number;
  duplicateCfp69ProbeRootKeys: number;
  duplicateCfp69SkippedRootKeys: number;
  observedRootsMissingCfp68EligibleRoot: number;
  cfp68EligibleRootsMissingObservedRoot: number;
  observedRootsMissingCfp69ProbeRoot: number;
  cfp69ProbeRootsMissingObservedRoot: number;
  publicActionCountMismatchRootCount: number;
  legalMoveCountMismatchRootCount: number;
  actionIdentityRowCount: number;
  cfp69PublicActionCountTotal: number;
  actionIdentityRowCountDelta: number;
  duplicateActionIdentityKeys: number;
  skippedRootKeyMismatchCount: number;
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

// ---------------------------------------------------------------------------
// Output rows
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesV0ActionIdentityRow {
  rootRef: string;
  publicActionRef: string;
  publicActionKeyHash: string;
  publicActionOrdinal: number;
  publicActionKind: PublicSearchActionKind;
  targetKind?: PublicActionTargetKind;
  targetSide?: PublicActionTargetSide;
  targetRow?: string;
  actionPhase: MatchPhase;
  actionRound: number;
  sourceClass: PublicActionSourceClass;
  strengthBucket?: PublicActionStrengthBucket;
  optionIndexLabel?: string;
  moveCount: number;
  collisionCountWithinBucket: number;
}

export interface PublicActionIdentitiesV0RootSummaryRow
  extends PublicActionIdentitiesV0RootIdentity {
  schemaVersion: PublicActionIdentitiesV0RootSummarySchemaVersion;
  identityRunId: string;
  rootRef: string;
  identityReadinessStatus: PublicActionIdentitiesV0IdentityReadinessStatus;
  cFp69ProbeStatus: string;
  legalMoveCount: number;
  publicActionCount: number;
  publicActionCollisionCount: number;
  largestPublicActionBucketSize: number;
  observedActionIdentityRowCount: number;
  cfp69PublicActionCount: number;
  cfp69LegalMoveCount: number;
  publicActionCountDelta: number;
  legalMoveCountDelta: number;
  publicActionKindCounts: Record<string, number>;
  targetKindCounts: Record<string, number>;
  targetSideCounts: Record<string, number>;
  bucketSizeClassCounts: Record<string, number>;
  sourceConsistencyStatus: "ready" | "not_ready";
}

export interface PublicActionIdentitiesV0SkippedRootRow
  extends PublicActionIdentitiesV0RootIdentity {
  schemaVersion: PublicActionIdentitiesV0SkippedRootSchemaVersion;
  identityRunId: string;
  identityReadinessStatus: "skipped_invalid_root";
  eligibilityStatus: "skipped_invalid_root";
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
// Build input/result
// ---------------------------------------------------------------------------

export interface PublicActionIdentitiesV0BuildInput {
  suiteId: string;
  identityRunId: string;
  sourceCfp68RunId: string;
  sourceCfp69RunId: string;
  sourceCfp76RunId: string;
  cfp68Summary: PublicActionIdentitiesV0Cfp68SummaryInput;
  cfp69Summary: PublicActionIdentitiesV0Cfp69SummaryInput;
  cfp76Summary: PublicActionIdentitiesV0Cfp76SummaryInput;
  cfp68EligibleRoots: readonly PublicActionIdentitiesV0Cfp68EligibleRootInput[];
  cfp68SkippedRoots: readonly PublicActionIdentitiesV0Cfp68SkippedRootInput[];
  cfp69ProbeRoots: readonly PublicActionIdentitiesV0Cfp69ProbeRootInput[];
  cfp69SkippedRoots: readonly PublicActionIdentitiesV0Cfp69SkippedRootInput[];
  cfp76RootFeatureRowCount: number;
  observedRoots: readonly PublicActionIdentitiesV0ObservedRoot[];
  sourceArtifactReferenceCount: number;
  sourceArtifactEmptyHashCount: number;
}

export interface PublicActionIdentitiesV0CountSummaries {
  countsByPhase: Record<string, number>;
  countsByRound: Record<string, number>;
  countsByPolicy: Record<string, number>;
  countsByFaction: Record<string, number>;
  countsByDeckPreset: Record<string, number>;
  countsByMatchup: Record<string, number>;
  publicActionKindCounts: Record<string, number>;
  targetKindCounts: Record<string, number>;
  targetSideCounts: Record<string, number>;
  bucketSizeClassCounts: Record<string, number>;
  actionFamilyCounts: Record<string, number>;
}

export interface PublicActionIdentitiesV0Result {
  identityReadinessStatus: PublicActionIdentitiesV0IdentityReadinessStatus;
  sourceConsistency: PublicActionIdentitiesV0SourceConsistency;
  actionIdentities: readonly PublicActionIdentitiesV0ActionIdentityRow[];
  rootSummaries: readonly PublicActionIdentitiesV0RootSummaryRow[];
  skippedRoots: readonly PublicActionIdentitiesV0SkippedRootRow[];
  countSummaries: PublicActionIdentitiesV0CountSummaries;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sortRecord = <T>(record: Record<string, T>): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  ) as Record<string, T>;

const addCount = (record: Record<string, number>, key: string, by = 1) => {
  record[key] = (record[key] ?? 0) + by;
};

type PublicActionIdentitiesV0RootKeyFields = Omit<
  PublicActionIdentitiesV0RootIdentity,
  "rootPublicFingerprint"
>;

const rootKeyFor = (record: PublicActionIdentitiesV0RootKeyFields, suiteId: string): string =>
  buildPublicActionIdentitiesV0RootKey({ ...record, suiteId });

const keyByRootKey = <T extends PublicActionIdentitiesV0RootKeyFields>(
  records: readonly T[],
  suiteId: string,
): Map<string, T> => {
  const map = new Map<string, T>();
  records.forEach((record) => {
    map.set(rootKeyFor(record, suiteId), record);
  });
  return map;
};

const duplicateKeyCount = <T extends PublicActionIdentitiesV0RootKeyFields>(
  records: readonly T[],
  suiteId: string,
): number => {
  const counts = new Map<string, number>();
  records.forEach((record) => {
    const key = rootKeyFor(record, suiteId);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return [...counts.values()].filter((count) => count > 1).length;
};

const missingFromCount = <T extends PublicActionIdentitiesV0RootKeyFields>(
  records: readonly T[],
  referenceKeys: ReadonlySet<string>,
  suiteId: string,
): number => records.filter((record) => !referenceKeys.has(rootKeyFor(record, suiteId))).length;

const ACTION_FAMILY_BY_KIND: Record<PublicSearchActionKind, PublicActionIdentitiesV0ActionFamily> = {
  choose_mulligan: "mulligan",
  play_card: "unit_play",
  use_leader: "leader",
  choose_prompt_option: "prompt",
  pass: "pass",
  resolve_round_end: "round_resolution",
};

const actionFamilyFor = (kind: PublicSearchActionKind): PublicActionIdentitiesV0ActionFamily =>
  ACTION_FAMILY_BY_KIND[kind] ?? "other";

const bucketSizeClassFor = (moveCount: number): PublicActionIdentitiesV0BucketSizeClass => {
  if (moveCount <= 1) return "single";
  if (moveCount <= 3) return "small_collision";
  return "large_collision";
};

const publicActionRefFor = (ordinal: number) => `public_action_${String(ordinal).padStart(3, "0")}`;

export const buildPublicActionIdentitiesV0RootRef = (ordinal: number): string =>
  `root_${String(ordinal).padStart(6, "0")}`;

const rootRefsByKey = (
  eligibleRoots: readonly PublicActionIdentitiesV0Cfp68EligibleRootInput[],
  suiteId: string,
): Map<string, string> => {
  const sortedKeys = eligibleRoots
    .map((root) => rootKeyFor(root, suiteId))
    .sort((left, right) => left.localeCompare(right));
  const refByKey = new Map<string, string>();
  sortedKeys.forEach((key, index) => {
    refByKey.set(key, buildPublicActionIdentitiesV0RootRef(index));
  });
  return refByKey;
};

const emptyPublicActionKindCounts = (): Record<string, number> => ({});
const emptyTargetKindCounts = (): Record<string, number> => ({});
const emptyTargetSideCounts = (): Record<string, number> => ({});
const emptyBucketSizeClassCounts = (): Record<string, number> => ({});

// ---------------------------------------------------------------------------
// Source consistency
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesV0SourceConsistency = (
  input: PublicActionIdentitiesV0BuildInput,
): PublicActionIdentitiesV0SourceConsistency => {
  const eligibleKeys = new Set(
    input.cfp68EligibleRoots.map((root) => rootKeyFor(root, input.suiteId)),
  );
  const observedKeys = new Set(
    input.observedRoots.map((root) => rootKeyFor(root, input.suiteId)),
  );
  const probeKeys = new Set(
    input.cfp69ProbeRoots.map((root) => rootKeyFor(root, input.suiteId)),
  );

  const observedByKey = keyByRootKey(input.observedRoots, input.suiteId);
  const probeByKey = keyByRootKey(input.cfp69ProbeRoots, input.suiteId);

  let publicActionCountMismatchRootCount = 0;
  let legalMoveCountMismatchRootCount = 0;
  observedByKey.forEach((observed, key) => {
    const probe = probeByKey.get(key);
    if (!probe) return;
    if (observed.publicActionBuckets.length !== probe.publicActionCount) {
      publicActionCountMismatchRootCount += 1;
    }
    if (observed.legalMoveCount !== probe.legalMoveCount) {
      legalMoveCountMismatchRootCount += 1;
    }
  });

  const cfp69PublicActionCountTotal = input.cfp69ProbeRoots.reduce(
    (sum, root) => sum + root.publicActionCount,
    0,
  );
  const actionIdentityRowCount = input.observedRoots.reduce(
    (sum, root) => sum + root.publicActionBuckets.length,
    0,
  );
  const actionIdentityRowCountDelta = actionIdentityRowCount - cfp69PublicActionCountTotal;

  const duplicateActionIdentityKeys = (() => {
    const counts = new Map<string, number>();
    input.observedRoots.forEach((root) => {
      const rootKey = rootKeyFor(root, input.suiteId);
      root.publicActionBuckets.forEach((bucket) => {
        const compositeKey = `${rootKey}::${bucket.key}`;
        counts.set(compositeKey, (counts.get(compositeKey) ?? 0) + 1);
      });
    });
    return [...counts.values()].filter((count) => count > 1).length;
  })();

  const cfp68SkippedKeys = new Set(
    input.cfp68SkippedRoots.map((root) => rootKeyFor(root, input.suiteId)),
  );
  const cfp69SkippedKeys = new Set(
    input.cfp69SkippedRoots.map((root) => rootKeyFor(root, input.suiteId)),
  );
  const skippedRootKeyMismatchCount =
    [...cfp68SkippedKeys].filter((key) => !cfp69SkippedKeys.has(key)).length +
    [...cfp69SkippedKeys].filter((key) => !cfp68SkippedKeys.has(key)).length;

  const cfp68EligibleRootCountActualDelta =
    input.cfp68Summary.eligibleRootCount - input.cfp68EligibleRoots.length;
  const cfp68SkippedRootCountActualDelta =
    input.cfp68Summary.skippedRootCount - input.cfp68SkippedRoots.length;
  const cfp69ProbeRootCountActualDelta =
    input.cfp69Summary.probeRootCount - input.cfp69ProbeRoots.length;
  const cfp69SkippedRootCountActualDelta =
    input.cfp69Summary.skippedRootCount - input.cfp69SkippedRoots.length;
  const cfp76RootFeatureRowCountActualDelta =
    input.cfp76Summary.rootFeatureRowCount - input.cfp76RootFeatureRowCount;
  const cfp76SkippedRootCountVsCfp69SkippedRootCountDelta =
    input.cfp76Summary.skippedRootRowCount - input.cfp69Summary.skippedRootCount;
  const cfp76SkippedRootCountVsCfp68SkippedRootCountDelta =
    input.cfp76Summary.skippedRootRowCount - input.cfp68Summary.skippedRootCount;

  const cfp76ReadinessIsActionFeatureSourceGap =
    input.cfp76Summary.consumerReadinessStatus === "action_feature_source_gap";
  const cfp76ActionFeatureRowCountIsZero = input.cfp76Summary.actionFeatureRowCount === 0;
  const cfp76ActionFeatureGapRowCountIsPositive = input.cfp76Summary.actionFeatureGapRowCount > 0;

  const observedRootsMissingCfp68EligibleRoot = missingFromCount(
    input.observedRoots,
    eligibleKeys,
    input.suiteId,
  );
  const cfp68EligibleRootsMissingObservedRoot = missingFromCount(
    input.cfp68EligibleRoots,
    observedKeys,
    input.suiteId,
  );
  const observedRootsMissingCfp69ProbeRoot = missingFromCount(
    input.observedRoots,
    probeKeys,
    input.suiteId,
  );
  const cfp69ProbeRootsMissingObservedRoot = missingFromCount(
    input.cfp69ProbeRoots,
    observedKeys,
    input.suiteId,
  );

  const duplicateObservedRootKeys = duplicateKeyCount(input.observedRoots, input.suiteId);
  const duplicateCfp68EligibleRootKeys = duplicateKeyCount(input.cfp68EligibleRoots, input.suiteId);
  const duplicateCfp69ProbeRootKeys = duplicateKeyCount(input.cfp69ProbeRoots, input.suiteId);
  const duplicateCfp69SkippedRootKeys = duplicateKeyCount(input.cfp69SkippedRoots, input.suiteId);

  const checks: boolean[] = [
    input.cfp68Summary.contractStatus === "probe_ready",
    input.cfp69Summary.probeReadinessStatus === "probe_ready",
    cfp68EligibleRootCountActualDelta === 0,
    cfp68SkippedRootCountActualDelta === 0,
    cfp69ProbeRootCountActualDelta === 0,
    cfp69SkippedRootCountActualDelta === 0,
    cfp76RootFeatureRowCountActualDelta === 0,
    cfp76SkippedRootCountVsCfp69SkippedRootCountDelta === 0,
    cfp76SkippedRootCountVsCfp68SkippedRootCountDelta === 0,
    cfp76ReadinessIsActionFeatureSourceGap,
    cfp76ActionFeatureRowCountIsZero,
    cfp76ActionFeatureGapRowCountIsPositive,
    observedRootsMissingCfp68EligibleRoot === 0,
    cfp68EligibleRootsMissingObservedRoot === 0,
    observedRootsMissingCfp69ProbeRoot === 0,
    cfp69ProbeRootsMissingObservedRoot === 0,
    publicActionCountMismatchRootCount === 0,
    legalMoveCountMismatchRootCount === 0,
    actionIdentityRowCountDelta === 0,
    duplicateObservedRootKeys === 0,
    duplicateCfp68EligibleRootKeys === 0,
    duplicateCfp69ProbeRootKeys === 0,
    duplicateCfp69SkippedRootKeys === 0,
    duplicateActionIdentityKeys === 0,
    skippedRootKeyMismatchCount === 0,
    input.sourceArtifactReferenceCount > 0,
    input.sourceArtifactEmptyHashCount === 0,
  ];

  return {
    status: checks.every(Boolean) ? "ready" : "not_ready",
    cFp68ContractStatus: input.cfp68Summary.contractStatus,
    cFp69ProbeReadinessStatus: input.cfp69Summary.probeReadinessStatus,
    cFp76ConsumerReadinessStatus: input.cfp76Summary.consumerReadinessStatus,
    cFp68EligibleRootCount: input.cfp68Summary.eligibleRootCount,
    cFp68SkippedRootCount: input.cfp68Summary.skippedRootCount,
    cFp69ProbeRootCount: input.cfp69Summary.probeRootCount,
    cFp69SkippedRootCount: input.cfp69Summary.skippedRootCount,
    cFp76RootFeatureRowCount: input.cfp76Summary.rootFeatureRowCount,
    cFp76ActionFeatureRowCount: input.cfp76Summary.actionFeatureRowCount,
    cFp76ActionFeatureGapRowCount: input.cfp76Summary.actionFeatureGapRowCount,
    cFp76SkippedRootRowCount: input.cfp76Summary.skippedRootRowCount,
    cfp68EligibleRootCountActualDelta,
    cfp68SkippedRootCountActualDelta,
    cfp69ProbeRootCountActualDelta,
    cfp69SkippedRootCountActualDelta,
    cfp76RootFeatureRowCountActualDelta,
    cfp76SkippedRootCountVsCfp69SkippedRootCountDelta,
    cfp76SkippedRootCountVsCfp68SkippedRootCountDelta,
    cfp76ReadinessIsActionFeatureSourceGap,
    cfp76ActionFeatureRowCountIsZero,
    cfp76ActionFeatureGapRowCountIsPositive,
    observedRootCount: input.observedRoots.length,
    duplicateObservedRootKeys,
    duplicateCfp68EligibleRootKeys,
    duplicateCfp69ProbeRootKeys,
    duplicateCfp69SkippedRootKeys,
    observedRootsMissingCfp68EligibleRoot,
    cfp68EligibleRootsMissingObservedRoot,
    observedRootsMissingCfp69ProbeRoot,
    cfp69ProbeRootsMissingObservedRoot,
    publicActionCountMismatchRootCount,
    legalMoveCountMismatchRootCount,
    actionIdentityRowCount,
    cfp69PublicActionCountTotal,
    actionIdentityRowCountDelta,
    duplicateActionIdentityKeys,
    skippedRootKeyMismatchCount,
    sourceArtifactReferenceCount: input.sourceArtifactReferenceCount,
    sourceArtifactEmptyHashCount: input.sourceArtifactEmptyHashCount,
  };
};

// ---------------------------------------------------------------------------
// Action identity rows
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesV0ActionIdentityRows = ({
  input,
}: {
  input: PublicActionIdentitiesV0BuildInput;
}): PublicActionIdentitiesV0ActionIdentityRow[] => {
  const observedByKey = keyByRootKey(input.observedRoots, input.suiteId);
  const refByKey = rootRefsByKey(input.cfp68EligibleRoots, input.suiteId);
  const rows: PublicActionIdentitiesV0ActionIdentityRow[] = [];

  input.cfp68EligibleRoots.forEach((root) => {
    const key = rootKeyFor(root, input.suiteId);
    const observed = observedByKey.get(key);
    const rootRef = refByKey.get(key);
    if (!observed || !rootRef) {
      throw new Error(`public-action-identities-v0: missing observed root for ${key}`);
    }

    observed.publicActionBuckets.forEach((bucket, ordinal) => {
      const { action } = bucket;
      rows.push({
        rootRef,
        publicActionRef: publicActionRefFor(ordinal),
        publicActionKeyHash: hashSamplerReadinessPublicValue(bucket.key),
        publicActionOrdinal: ordinal,
        publicActionKind: action.kind,
        ...(action.targetKind !== "none" ? { targetKind: action.targetKind } : {}),
        ...(action.targetSide !== "none" ? { targetSide: action.targetSide } : {}),
        ...(action.targetRow !== undefined ? { targetRow: action.targetRow } : {}),
        actionPhase: action.phase,
        actionRound: action.round,
        sourceClass: action.sourceClass,
        ...(action.strengthBucket !== undefined ? { strengthBucket: action.strengthBucket } : {}),
        ...(action.optionIndexLabel !== undefined
          ? { optionIndexLabel: action.optionIndexLabel }
          : {}),
        moveCount: action.moveCount,
        collisionCountWithinBucket: Math.max(action.moveCount - 1, 0),
      });
    });
  });

  return rows;
};

// ---------------------------------------------------------------------------
// Root summary rows
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesV0RootSummaryRows = ({
  input,
  identityReadinessStatus,
  sourceConsistencyStatus,
}: {
  input: PublicActionIdentitiesV0BuildInput;
  identityReadinessStatus: PublicActionIdentitiesV0IdentityReadinessStatus;
  sourceConsistencyStatus: "ready" | "not_ready";
}): PublicActionIdentitiesV0RootSummaryRow[] => {
  const observedByKey = keyByRootKey(input.observedRoots, input.suiteId);
  const probeByKey = keyByRootKey(input.cfp69ProbeRoots, input.suiteId);
  const refByKey = rootRefsByKey(input.cfp68EligibleRoots, input.suiteId);

  return input.cfp68EligibleRoots.map((root) => {
    const key = rootKeyFor(root, input.suiteId);
    const observed = observedByKey.get(key);
    const probe = probeByKey.get(key);
    const rootRef = refByKey.get(key);
    if (!observed || !probe || !rootRef) {
      throw new Error(`public-action-identities-v0: missing source row for root ${key}`);
    }

    const publicActionKindCounts = emptyPublicActionKindCounts();
    const targetKindCounts = emptyTargetKindCounts();
    const targetSideCounts = emptyTargetSideCounts();
    const bucketSizeClassCounts = emptyBucketSizeClassCounts();
    let largestPublicActionBucketSize = 0;
    let publicActionCollisionCount = 0;

    observed.publicActionBuckets.forEach((bucket) => {
      const { action } = bucket;
      addCount(publicActionKindCounts, action.kind);
      addCount(targetKindCounts, action.targetKind);
      addCount(targetSideCounts, action.targetSide);
      addCount(bucketSizeClassCounts, bucketSizeClassFor(action.moveCount));
      largestPublicActionBucketSize = Math.max(largestPublicActionBucketSize, action.moveCount);
      publicActionCollisionCount += Math.max(action.moveCount - 1, 0);
    });

    return {
      schemaVersion: "public-action-identities-v0-root-summary-v1",
      identityRunId: input.identityRunId,
      rootRef,
      suiteId: root.suiteId,
      matchupId: root.matchupId,
      seed: root.seed,
      ...(root.mirrorGroupId !== undefined ? { mirrorGroupId: root.mirrorGroupId } : {}),
      ...(root.mirrorIndex !== undefined ? { mirrorIndex: root.mirrorIndex } : {}),
      step: root.step,
      decisionIndex: root.decisionIndex,
      phase: root.phase,
      round: root.round,
      seatId: root.seatId,
      policyId: root.policyId,
      faction: root.faction,
      deckPresetId: root.deckPresetId,
      rootPublicFingerprint: root.rootPublicFingerprint,
      identityReadinessStatus,
      cFp69ProbeStatus: probe.probeStatus,
      legalMoveCount: observed.legalMoveCount,
      publicActionCount: observed.publicActionBuckets.length,
      publicActionCollisionCount,
      largestPublicActionBucketSize,
      observedActionIdentityRowCount: observed.publicActionBuckets.length,
      cfp69PublicActionCount: probe.publicActionCount,
      cfp69LegalMoveCount: probe.legalMoveCount,
      publicActionCountDelta: observed.publicActionBuckets.length - probe.publicActionCount,
      legalMoveCountDelta: observed.legalMoveCount - probe.legalMoveCount,
      publicActionKindCounts: sortRecord(publicActionKindCounts),
      targetKindCounts: sortRecord(targetKindCounts),
      targetSideCounts: sortRecord(targetSideCounts),
      bucketSizeClassCounts: sortRecord(bucketSizeClassCounts),
      sourceConsistencyStatus,
    };
  });
};

// ---------------------------------------------------------------------------
// Skipped root rows
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesV0SkippedRootRows = (
  input: PublicActionIdentitiesV0BuildInput,
): PublicActionIdentitiesV0SkippedRootRow[] =>
  input.cfp69SkippedRoots.map((root) => ({
    schemaVersion: "public-action-identities-v0-skipped-root-v1",
    identityRunId: input.identityRunId,
    suiteId: root.suiteId,
    matchupId: root.matchupId,
    seed: root.seed,
    ...(root.mirrorGroupId !== undefined ? { mirrorGroupId: root.mirrorGroupId } : {}),
    ...(root.mirrorIndex !== undefined ? { mirrorIndex: root.mirrorIndex } : {}),
    step: root.step,
    decisionIndex: root.decisionIndex,
    phase: root.phase,
    round: root.round,
    seatId: root.seatId,
    policyId: root.policyId,
    faction: root.faction,
    deckPresetId: root.deckPresetId,
    rootPublicFingerprint: root.rootPublicFingerprint,
    identityReadinessStatus: "skipped_invalid_root",
    eligibilityStatus: "skipped_invalid_root",
    skipReason: root.skipReason,
    invalidReason: root.invalidReason,
    cFp67PrimaryClassification: root.cFp67PrimaryClassification,
    cFp67TransferClassification: root.cFp67TransferClassification,
    cFp67PersistentDeficitClassification: root.cFp67PersistentDeficitClassification,
    cFp67DeficitSizeClassification: root.cFp67DeficitSizeClassification,
    cFp67ProvenanceLabel: root.cFp67ProvenanceLabel,
    skipStage: "cFp68_cFp69_inherited",
    skipCounterDimensions: { ...root.skipCounterDimensions },
  }));

// ---------------------------------------------------------------------------
// Count summaries
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesV0CountSummaries = ({
  actionIdentities,
  rootSummaries,
}: {
  actionIdentities: readonly PublicActionIdentitiesV0ActionIdentityRow[];
  rootSummaries: readonly PublicActionIdentitiesV0RootSummaryRow[];
}): PublicActionIdentitiesV0CountSummaries => {
  const countsByPhase: Record<string, number> = {};
  const countsByRound: Record<string, number> = {};
  const countsByPolicy: Record<string, number> = {};
  const countsByFaction: Record<string, number> = {};
  const countsByDeckPreset: Record<string, number> = {};
  const countsByMatchup: Record<string, number> = {};
  const publicActionKindCounts: Record<string, number> = {};
  const targetKindCounts: Record<string, number> = {};
  const targetSideCounts: Record<string, number> = {};
  const bucketSizeClassCounts: Record<string, number> = {};
  const actionFamilyCounts: Record<string, number> = {};

  const rootByRef = new Map(rootSummaries.map((root) => [root.rootRef, root]));

  actionIdentities.forEach((row) => {
    const root = rootByRef.get(row.rootRef);
    if (!root) {
      throw new Error(`public-action-identities-v0: missing root summary for ${row.rootRef}`);
    }
    addCount(countsByPhase, root.phase);
    addCount(countsByRound, String(root.round));
    addCount(countsByPolicy, root.policyId);
    addCount(countsByFaction, root.faction);
    addCount(countsByDeckPreset, root.deckPresetId);
    addCount(countsByMatchup, root.matchupId);
    addCount(publicActionKindCounts, row.publicActionKind);
    addCount(targetKindCounts, row.targetKind ?? "none");
    addCount(targetSideCounts, row.targetSide ?? "none");
    addCount(bucketSizeClassCounts, bucketSizeClassFor(row.moveCount));
    addCount(actionFamilyCounts, actionFamilyFor(row.publicActionKind));
  });

  return {
    countsByPhase: sortRecord(countsByPhase),
    countsByRound: sortRecord(countsByRound),
    countsByPolicy: sortRecord(countsByPolicy),
    countsByFaction: sortRecord(countsByFaction),
    countsByDeckPreset: sortRecord(countsByDeckPreset),
    countsByMatchup: sortRecord(countsByMatchup),
    publicActionKindCounts: sortRecord(publicActionKindCounts),
    targetKindCounts: sortRecord(targetKindCounts),
    targetSideCounts: sortRecord(targetSideCounts),
    bucketSizeClassCounts: sortRecord(bucketSizeClassCounts),
    actionFamilyCounts: sortRecord(actionFamilyCounts),
  };
};

// ---------------------------------------------------------------------------
// Top-level build
// ---------------------------------------------------------------------------

export const buildPublicActionIdentitiesV0Result = (
  input: PublicActionIdentitiesV0BuildInput,
): PublicActionIdentitiesV0Result => {
  const sourceConsistency = buildPublicActionIdentitiesV0SourceConsistency(input);

  if (sourceConsistency.status !== "ready") {
    return {
      identityReadinessStatus: "source_consistency_failed",
      sourceConsistency,
      actionIdentities: [],
      rootSummaries: [],
      skippedRoots: [],
      countSummaries: buildPublicActionIdentitiesV0CountSummaries({
        actionIdentities: [],
        rootSummaries: [],
      }),
    };
  }

  const identityReadinessStatus: PublicActionIdentitiesV0IdentityReadinessStatus = "identity_ready";

  const actionIdentities = buildPublicActionIdentitiesV0ActionIdentityRows({ input });
  const rootSummaries = buildPublicActionIdentitiesV0RootSummaryRows({
    input,
    identityReadinessStatus,
    sourceConsistencyStatus: sourceConsistency.status,
  });
  const skippedRoots = buildPublicActionIdentitiesV0SkippedRootRows(input);

  return {
    identityReadinessStatus,
    sourceConsistency,
    actionIdentities,
    rootSummaries,
    skippedRoots,
    countSummaries: buildPublicActionIdentitiesV0CountSummaries({ actionIdentities, rootSummaries }),
  };
};

// ---------------------------------------------------------------------------
// Benchmark suite run (re-run, no gameplay/rule changes; observes legal moves
// at each decision point exactly as cFp69 did)
// ---------------------------------------------------------------------------

export interface RunPublicActionIdentitiesV0Input
  extends Omit<PublicActionIdentitiesV0BuildInput, "observedRoots"> {
  suite?: BenchmarkSuite;
  maxSteps?: number;
  policies?: BenchmarkPolicyRegistry;
}

export interface PublicActionIdentitiesV0RunResult extends PublicActionIdentitiesV0Result {
  benchmark: BenchmarkRunResult;
}

export const runPublicActionIdentitiesV0 = (
  input: RunPublicActionIdentitiesV0Input,
): PublicActionIdentitiesV0RunResult => {
  const observedRoots: PublicActionIdentitiesV0ObservedRoot[] = [];
  const benchmark = runBenchmarkSuite({
    suiteId: input.suiteId,
    suite: input.suite,
    benchmarkRunId: input.identityRunId,
    maxSteps: input.maxSteps,
    policies: input.policies,
    rootObserver: (root) => {
      observedRoots.push(buildPublicActionIdentitiesV0ObservedRoot(root));
    },
  });

  const eligibleKeys = new Set(
    input.cfp68EligibleRoots.map((root) => rootKeyFor(root, benchmark.summary.suiteId)),
  );
  const eligibleObservedRoots = observedRoots.filter((root) =>
    eligibleKeys.has(rootKeyFor(root, benchmark.summary.suiteId)),
  );

  const result = buildPublicActionIdentitiesV0Result({
    ...input,
    suiteId: benchmark.summary.suiteId,
    observedRoots: eligibleObservedRoots,
  });

  return { ...result, benchmark };
};
