import { describe, expect, it } from "vitest";

import {
  buildDeterminizedPimcActionAvailabilityV0PublicActionBucketKey,
  buildPublicActionIdentitiesV0ActionIdentityRows,
  buildPublicActionIdentitiesV0ObservedRoot,
  buildPublicActionIdentitiesV0Result,
  buildPublicActionIdentitiesV0RootRef,
  buildPublicActionIdentitiesV0RootSummaryRows,
  hashSamplerReadinessPublicValue,
  type BenchmarkRootObserverInput,
  type PublicActionIdentitiesV0BuildInput,
  type PublicActionIdentitiesV0Cfp68EligibleRootInput,
  type PublicActionIdentitiesV0Cfp68SkippedRootInput,
  type PublicActionIdentitiesV0Cfp69ProbeRootInput,
  type PublicActionIdentitiesV0Cfp69SkippedRootInput,
  type PublicActionIdentitiesV0Cfp76SummaryInput,
  type PublicActionIdentitiesV0Cfp68SummaryInput,
  type PublicActionIdentitiesV0Cfp69SummaryInput,
  type PublicActionIdentitiesV0ObservedRoot,
  type PublicActionIdentitiesV0SourceConsistency,
  type PublicSearchActionAbstraction,
} from "@/game/benchmark";
import type { LegalMove } from "@/game/core";

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

describe("public action identities v0", () => {
  it("builds identity-ready rows for an eligible root with two collapsed public action buckets", () => {
    const result = buildPublicActionIdentitiesV0Result(baseInput());

    expect(result.identityReadinessStatus).toBe("identity_ready");
    expect(result.sourceConsistency.status).toBe("ready");
    expect(result.actionIdentities).toHaveLength(2);
    expect(result.rootSummaries).toHaveLength(1);
    expect(result.skippedRoots).toHaveLength(1);

    const [playRow, passRow] = result.actionIdentities;
    expect(playRow.rootRef).toBe(buildPublicActionIdentitiesV0RootRef(0));
    expect(playRow.publicActionRef).toBe("public_action_000");
    expect(playRow.publicActionOrdinal).toBe(0);
    expect(playRow.publicActionKind).toBe("play_card");
    expect(playRow.targetKind).toBe("board_row");
    expect(playRow.targetSide).toBe("own");
    expect(playRow.targetRow).toBe("melee");
    expect(playRow.strengthBucket).toBe("medium");
    expect(playRow.collisionCountWithinBucket).toBe(1);
    expect(playRow.publicActionKeyHash).toBe(
      hashSamplerReadinessPublicValue(bucketFor(playCardAction).key),
    );

    expect(passRow.rootRef).toBe(buildPublicActionIdentitiesV0RootRef(0));
    expect(passRow.publicActionRef).toBe("public_action_001");
    expect(passRow.publicActionOrdinal).toBe(1);
    expect(passRow.publicActionKind).toBe("pass");
    expect(passRow.targetKind).toBeUndefined();
    expect(passRow.targetSide).toBeUndefined();
    expect(passRow.collisionCountWithinBucket).toBe(0);

    const rootSummary = result.rootSummaries[0];
    expect(rootSummary.rootRef).toBe(buildPublicActionIdentitiesV0RootRef(0));
    expect(rootSummary.identityReadinessStatus).toBe("identity_ready");
    expect(rootSummary.sourceConsistencyStatus).toBe("ready");
    expect(rootSummary.legalMoveCount).toBe(3);
    expect(rootSummary.publicActionCount).toBe(2);
    expect(rootSummary.cfp69LegalMoveCount).toBe(3);
    expect(rootSummary.cfp69PublicActionCount).toBe(2);
    expect(rootSummary.publicActionCountDelta).toBe(0);
    expect(rootSummary.legalMoveCountDelta).toBe(0);
    expect(rootSummary.publicActionCollisionCount).toBe(1);
    expect(rootSummary.largestPublicActionBucketSize).toBe(2);
    expect(rootSummary.publicActionKindCounts).toEqual({ pass: 1, play_card: 1 });
    expect(rootSummary.targetKindCounts).toEqual({ board_row: 1, none: 1 });
    expect(rootSummary.targetSideCounts).toEqual({ none: 1, own: 1 });
    expect(rootSummary.bucketSizeClassCounts).toEqual({ single: 1, small_collision: 1 });

    const skippedRow = result.skippedRoots[0];
    expect(skippedRow.identityReadinessStatus).toBe("skipped_invalid_root");
    expect(skippedRow.eligibilityStatus).toBe("skipped_invalid_root");
    expect(skippedRow.skipStage).toBe("cFp68_cFp69_inherited");
    expect(skippedRow.skipReason).toBe("sampler_invalid_public_zone_count_deficit");
  });

  it("builds count summaries across phase/round/policy/faction/matchup and action shape", () => {
    const result = buildPublicActionIdentitiesV0Result(baseInput());

    expect(result.countSummaries.countsByPhase).toEqual({ playing: 2 });
    expect(result.countSummaries.countsByRound).toEqual({ "1": 2 });
    expect(result.countSummaries.countsByPolicy).toEqual({ "legal-heuristic-v1": 2 });
    expect(result.countSummaries.countsByFaction).toEqual({ northern_realms: 2 });
    expect(result.countSummaries.countsByDeckPreset).toEqual({
      "official-northern-realms-starter": 2,
    });
    expect(result.countSummaries.countsByMatchup).toEqual({ "starter-nr-vs-ng": 2 });
    expect(result.countSummaries.publicActionKindCounts).toEqual({ pass: 1, play_card: 1 });
    expect(result.countSummaries.targetKindCounts).toEqual({ board_row: 1, none: 1 });
    expect(result.countSummaries.targetSideCounts).toEqual({ none: 1, own: 1 });
    expect(result.countSummaries.bucketSizeClassCounts).toEqual({
      single: 1,
      small_collision: 1,
    });
    expect(result.countSummaries.actionFamilyCounts).toEqual({ pass: 1, unit_play: 1 });
  });

  const deltaCases: Array<{
    name: string;
    mutate: (input: PublicActionIdentitiesV0BuildInput) => PublicActionIdentitiesV0BuildInput;
    field: keyof PublicActionIdentitiesV0SourceConsistency;
  }> = [
    {
      name: "cFp68 eligible root count vs actual eligible-roots.jsonl",
      mutate: (input) => ({
        ...input,
        cfp68Summary: { ...input.cfp68Summary, eligibleRootCount: 2 },
      }),
      field: "cfp68EligibleRootCountActualDelta",
    },
    {
      name: "cFp68 skipped root count vs actual skipped-roots.jsonl",
      mutate: (input) => ({
        ...input,
        cfp68Summary: { ...input.cfp68Summary, skippedRootCount: 2 },
      }),
      field: "cfp68SkippedRootCountActualDelta",
    },
    {
      name: "cFp69 probe root count vs actual probe-roots.jsonl",
      mutate: (input) => ({
        ...input,
        cfp69Summary: { ...input.cfp69Summary, probeRootCount: 2 },
      }),
      field: "cfp69ProbeRootCountActualDelta",
    },
    {
      name: "cFp69 skipped root count vs actual skipped-roots.jsonl",
      mutate: (input) => ({
        ...input,
        cfp69Summary: { ...input.cfp69Summary, skippedRootCount: 2 },
      }),
      field: "cfp69SkippedRootCountActualDelta",
    },
    {
      name: "cFp76 root feature row count vs actual root-features.jsonl",
      mutate: (input) => ({
        ...input,
        cfp76Summary: { ...input.cfp76Summary, rootFeatureRowCount: 2 },
      }),
      field: "cfp76RootFeatureRowCountActualDelta",
    },
  ];

  it.each(deltaCases)("flags not-ready with a nonzero $field for $name", ({ mutate, field }) => {
    const result = buildPublicActionIdentitiesV0Result(mutate(baseInput()));

    expect(result.identityReadinessStatus).toBe("source_consistency_failed");
    expect(result.sourceConsistency.status).toBe("not_ready");
    expect(result.sourceConsistency[field]).not.toBe(0);
    expect(result.actionIdentities).toEqual([]);
    expect(result.rootSummaries).toEqual([]);
    expect(result.skippedRoots).toEqual([]);
  });

  it("flags duplicate cFp68 eligible root keys as not ready", () => {
    const result = buildPublicActionIdentitiesV0Result(
      baseInput({
        cfp68EligibleRoots: [eligibleRoot(), eligibleRoot()],
        cfp68Summary: { ...cfp68Summary(), eligibleRootCount: 2 },
      }),
    );

    expect(result.sourceConsistency.duplicateCfp68EligibleRootKeys).toBe(1);
    expect(result.identityReadinessStatus).toBe("source_consistency_failed");
  });

  it("flags a skipped root key mismatch between cFp68 and cFp69 as not ready", () => {
    const result = buildPublicActionIdentitiesV0Result(
      baseInput({
        cfp69SkippedRoots: [],
        cfp69Summary: { ...cfp69Summary(), skippedRootCount: 0 },
      }),
    );

    expect(result.sourceConsistency.skippedRootKeyMismatchCount).toBe(1);
    expect(result.identityReadinessStatus).toBe("source_consistency_failed");
  });

  it("flags a public action count mismatch between the observed root and cFp69 probe root", () => {
    const result = buildPublicActionIdentitiesV0Result(
      baseInput({
        cfp69ProbeRoots: [probeRoot({ publicActionCount: 3 })],
      }),
    );

    expect(result.sourceConsistency.publicActionCountMismatchRootCount).toBe(1);
    expect(result.sourceConsistency.actionIdentityRowCountDelta).toBe(-1);
    expect(result.identityReadinessStatus).toBe("source_consistency_failed");
  });

  it("requires the cFp76 action-feature-source-gap state for source consistency", () => {
    const result = buildPublicActionIdentitiesV0Result(
      baseInput({
        cfp76Summary: {
          ...cfp76Summary(),
          consumerReadinessStatus: "consumer_ready",
          actionFeatureRowCount: 2,
          actionFeatureGapRowCount: 0,
        },
      }),
    );

    expect(result.sourceConsistency.cfp76ReadinessIsActionFeatureSourceGap).toBe(false);
    expect(result.sourceConsistency.cfp76ActionFeatureRowCountIsZero).toBe(false);
    expect(result.sourceConsistency.cfp76ActionFeatureGapRowCountIsPositive).toBe(false);
    expect(result.identityReadinessStatus).toBe("source_consistency_failed");
  });

  it("requires at least one source artifact reference and no empty-hash references", () => {
    const noReferences = buildPublicActionIdentitiesV0Result(
      baseInput({ sourceArtifactReferenceCount: 0 }),
    );
    expect(noReferences.sourceConsistency.status).toBe("not_ready");

    const emptyHash = buildPublicActionIdentitiesV0Result(
      baseInput({ sourceArtifactEmptyHashCount: 1 }),
    );
    expect(emptyHash.sourceConsistency.status).toBe("not_ready");
  });

  it("throws when buildPublicActionIdentitiesV0ActionIdentityRows has no observed root for an eligible root", () => {
    expect(() =>
      buildPublicActionIdentitiesV0ActionIdentityRows({ input: baseInput({ observedRoots: [] }) }),
    ).toThrow(/missing observed root/);
  });

  it("throws when buildPublicActionIdentitiesV0RootSummaryRows has no matching cFp69 probe root", () => {
    expect(() =>
      buildPublicActionIdentitiesV0RootSummaryRows({
        input: baseInput({ cfp69ProbeRoots: [] }),
        identityReadinessStatus: "identity_ready",
        sourceConsistencyStatus: "ready",
      }),
    ).toThrow(/missing source row/);
  });

  it("builds public action buckets from legal moves without leaking raw move/source identities", () => {
    const privateMove: LegalMove = {
      kind: "play_card",
      label: "Play Hidden Card",
      moveId: "private-move-id",
      seatId: "seat_a",
      sourceCardId: "seat_a:private-source-card:001",
      sourceId: "private-source-id",
      target: { kind: "board_row", side: "own", seatId: "seat_a", row: "close" },
      metadata: {
        abilities: [],
        cardKind: "unit",
        cardName: "Hidden Card Name",
        targetLabel: "close",
      },
    } as LegalMove;

    const observed = buildPublicActionIdentitiesV0ObservedRoot({
      suiteId,
      matchupId: "fixture-matchup",
      seed: "fixture-seed",
      mirrorIndex: 0,
      seats: {
        seat_a: {
          seatId: "seat_a",
          policyId: "legal-heuristic-v1",
          playerId: "a",
          faction: "northern_realms",
          deckPresetId: "official-northern-realms-starter",
        },
        seat_b: {
          seatId: "seat_b",
          policyId: "legal-heuristic-v0",
          playerId: "b",
          faction: "nilfgaard",
          deckPresetId: "official-nilfgaard-starter",
        },
      },
      state: { phase: "playing", round: 1 },
      seatId: "seat_a",
      legalMoves: [privateMove],
      step: 1,
      decisionIndex: 0,
      policyId: "legal-heuristic-v1",
    } as BenchmarkRootObserverInput);

    expect(observed.observationStatus).toBe("completed");
    expect(observed.publicActionBuckets).toHaveLength(1);
    expect(observed.publicActionBuckets[0].action.kind).toBe("play_card");
    expect(observed.publicActionBuckets[0].action.targetKind).toBe("board_row");
    expect(observed.publicActionBuckets[0].action.sourceClass).toBe("unit");

    const serialized = JSON.stringify(observed);
    expect(serialized).not.toContain("private-move-id");
    expect(serialized).not.toContain("private-source-card");
    expect(serialized).not.toContain("private-source-id");
    expect(serialized).not.toContain("Hidden Card Name");
  });
});
