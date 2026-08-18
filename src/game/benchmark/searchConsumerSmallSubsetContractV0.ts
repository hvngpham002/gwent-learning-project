import {
  classifySearchConsumerActionFeatureCasebookV0ActionReadiness,
} from "./searchConsumerActionFeatureCasebookV0";
import type {
  SearchConsumerActionFeatureDictionaryV0ActionRow,
  SearchConsumerActionFeatureDictionaryV0DictionaryGroups,
  SearchConsumerActionFeatureDictionaryV0RootFeatureRow,
  SearchConsumerActionFeatureDictionaryV0SkippedRootRow,
} from "./searchConsumerActionFeatureDictionaryV0";

export type SearchConsumerSmallSubsetContractV0Status =
  | "subset_ready"
  | "source_consistency_failed"
  | "subset_too_small"
  | "subset_not_closed";
export type SearchConsumerSmallSubsetContractV0ExclusionReason =
  | "high_collision_action"
  | "high_branching_context"
  | "over_budget_context"
  | "mixed_non_ready_root"
  | "empty_action_surface";

export interface SearchConsumerSmallSubsetContractV0Input {
  suiteId: string;
  runId: string;
  cfp80Summary: Record<string, unknown>;
  cfp81Summary: Record<string, unknown>;
  dictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups;
  roots: readonly SearchConsumerActionFeatureDictionaryV0RootFeatureRow[];
  actions: readonly SearchConsumerActionFeatureDictionaryV0ActionRow[];
  skippedRoots: readonly SearchConsumerActionFeatureDictionaryV0SkippedRootRow[];
  sourceReferenceCount: number;
  emptySourceHashCount: number;
  cfp81HashesMatch: boolean;
}

export interface SearchConsumerSmallSubsetContractV0Result {
  status: SearchConsumerSmallSubsetContractV0Status;
  sourceConsistency: Record<string, number | string | boolean>;
  selectedRoots: readonly SearchConsumerActionFeatureDictionaryV0RootFeatureRow[];
  selectedActions: readonly SearchConsumerActionFeatureDictionaryV0ActionRow[];
  skippedRoots: readonly SearchConsumerActionFeatureDictionaryV0SkippedRootRow[];
  projectedDictionaries: SearchConsumerActionFeatureDictionaryV0DictionaryGroups;
  actionLabelCounts: Record<string, number>;
  exclusionCounts: Record<string, number>;
  exclusionSlices: Record<string, Record<string, number>>;
  closureMismatchCount: number;
}

const add = (record: Record<string, number>, key: string) => (record[key] = (record[key] ?? 0) + 1);
const sorted = <T>(record: Record<string, T>) => Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
const summaryNumber = (summary: Record<string, unknown>, key: string) => Number(summary[key] ?? -1);
const labels = ["consumer_ready", "consumer_ready_high_collision", "consumer_ready_high_branching", "consumer_ready_over_budget_context"];

const reasonFor = (actionLabels: readonly string[], root: SearchConsumerActionFeatureDictionaryV0RootFeatureRow): SearchConsumerSmallSubsetContractV0ExclusionReason => {
  if (actionLabels.includes("consumer_ready_high_collision")) return "high_collision_action";
  if (actionLabels.includes("consumer_ready_high_branching")) return "high_branching_context";
  if (actionLabels.includes("consumer_ready_over_budget_context")) return "over_budget_context";
  if (actionLabels.some((label) => label !== "consumer_ready")) return "mixed_non_ready_root";
  return root.cFp69PublicActionCount === 0 ? "empty_action_surface" : "mixed_non_ready_root";
};

export const buildSearchConsumerSmallSubsetContractV0Result = (input: SearchConsumerSmallSubsetContractV0Input): SearchConsumerSmallSubsetContractV0Result => {
  const rootRefs = input.dictionaries.rootRefs.values;
  const rootByRef = new Map(input.roots.map((root) => [root.rootRef, root]));
  const byRoot = new Map<string, SearchConsumerActionFeatureDictionaryV0ActionRow[]>();
  let invalidIds = 0;
  for (const action of input.actions) {
    const ref = rootRefs[action.rootRefId];
    if (!ref || !rootByRef.has(ref)) { invalidIds += 1; continue; }
    const list = byRoot.get(ref) ?? []; list.push(action); byRoot.set(ref, list);
  }
  const countsMatch = summaryNumber(input.cfp80Summary, "rootFeatureRowCount") === input.roots.length &&
    summaryNumber(input.cfp80Summary, "compactActionFeatureRowCount") === input.actions.length &&
    summaryNumber(input.cfp80Summary, "skippedRootRowCount") === input.skippedRoots.length &&
    summaryNumber(input.cfp81Summary, "rootFeatureRowCount") === input.roots.length &&
    summaryNumber(input.cfp81Summary, "compactActionFeatureRowCount") === input.actions.length &&
    summaryNumber(input.cfp81Summary, "skippedRootRowCount") === input.skippedRoots.length;
  const cfp80Ready = input.cfp80Summary.consumerReadinessStatus === "dictionary_ready" &&
    (input.cfp80Summary.sourceConsistency as { status?: string })?.status === "ready" && input.cfp80Summary.reconstructionStatus === "passed" && summaryNumber(input.cfp80Summary, "reconstructionMismatchCount") === 0;
  const cfp81Ready = input.cfp81Summary.consumerReadinessStatus === "casebook_ready" &&
    (input.cfp81Summary.sourceConsistency as { status?: string })?.status === "ready";
  const actionLabelCounts: Record<string, number> = Object.fromEntries(labels.map((label) => [label, 0]));
  input.actions.forEach((action) => add(actionLabelCounts, classifySearchConsumerActionFeatureCasebookV0ActionReadiness({ action, root: rootByRef.get(rootRefs[action.rootRefId] ?? "") })));
  const expectedLabels = ((input.cfp81Summary.countSummaries as { combinedReadinessCounts?: Record<string, number> } | undefined)?.combinedReadinessCounts ?? {});
  const labelParity = labels.every((label) => (expectedLabels[label] ?? 0) === (actionLabelCounts[label] ?? 0));
  const sourceOk = cfp80Ready && cfp81Ready && countsMatch && invalidIds === 0 && input.sourceReferenceCount === 13 && input.emptySourceHashCount === 0 && input.cfp81HashesMatch && labelParity;
  const selectedRoots: SearchConsumerActionFeatureDictionaryV0RootFeatureRow[] = [];
  const selectedActions: SearchConsumerActionFeatureDictionaryV0ActionRow[] = [];
  const exclusionCounts: Record<string, number> = {};
  const exclusionSlices: Record<string, Record<string, number>> = { reason: {}, phase: {}, round: {}, policy: {}, faction: {}, deckPreset: {}, matchup: {}, nonReadyLabel: {} };
  for (const root of input.roots) {
    const rootActions = byRoot.get(root.rootRef) ?? [];
    const rootLabels = rootActions.map((action) => classifySearchConsumerActionFeatureCasebookV0ActionReadiness({ action, root }));
    if (rootActions.length > 0 && rootLabels.every((label) => label === "consumer_ready")) { selectedRoots.push(root); selectedActions.push(...rootActions); continue; }
    const reason = rootActions.length === 0 ? "empty_action_surface" : reasonFor(rootLabels, root);
    add(exclusionCounts, reason); add(exclusionSlices.reason, reason);
    for (const [key, value] of [["phase", root.phase], ["round", String(root.round)], ["policy", root.policyId], ["faction", root.faction], ["deckPreset", root.deckPresetId], ["matchup", root.matchupId]] as const) add(exclusionSlices[key], value);
    rootLabels.filter((label) => label !== "consumer_ready").forEach((label) => add(exclusionSlices.nonReadyLabel, label));
  }
  const rootActionCounts = new Map<string, number>(); selectedActions.forEach((action) => { const key = rootRefs[action.rootRefId] ?? "invalid"; rootActionCounts.set(key, (rootActionCounts.get(key) ?? 0) + 1); });
  const closureMismatchCount = selectedRoots.filter((root) => (rootActionCounts.get(root.rootRef) ?? 0) !== (byRoot.get(root.rootRef)?.length ?? 0)).length;
  const floors = input.suiteId.includes("robust") ? [750, 2000] : [100, 250];
  const status: SearchConsumerSmallSubsetContractV0Status = !sourceOk ? "source_consistency_failed" : closureMismatchCount > 0 ? "subset_not_closed" : selectedRoots.length < floors[0] || selectedActions.length < floors[1] ? "subset_too_small" : "subset_ready";
  const ids = { rootRefs: new Set(selectedRoots.map((root) => root.rootRef)), publicActionRefs: new Set<number>(), actionKinds: new Set<number>(), sourceClasses: new Set<number>(), targets: new Set<number>(), strengthBuckets: new Set<number>(), optionIndexLabels: new Set<number>(), moveCountBuckets: new Set<number>() };
  selectedActions.forEach((action) => { ids.publicActionRefs.add(action.publicActionRefId); ids.actionKinds.add(action.kindId); ids.sourceClasses.add(action.sourceClassId); ids.targets.add(action.targetId); ids.strengthBuckets.add(action.strengthBucketId); ids.optionIndexLabels.add(action.optionIndexLabelId); ids.moveCountBuckets.add(action.moveCountBucketId); });
  const projectedDictionaries = Object.fromEntries(Object.entries(input.dictionaries).map(([key, group]) => {
    const selected: Set<string | number> | undefined = key === "rootRefs" ? ids.rootRefs : key === "publicActionRefs" ? ids.publicActionRefs : key === "actionKinds" ? ids.actionKinds : key === "sourceClasses" ? ids.sourceClasses : key === "targets" ? ids.targets : key === "strengthBuckets" ? ids.strengthBuckets : key === "optionIndexLabels" ? ids.optionIndexLabels : key === "moveCountBuckets" ? ids.moveCountBuckets : undefined;
    const values = selected ? group.values.filter((value, index) => selected.has(key === "rootRefs" ? value : index)) : group.values;
    return [key, { count: values.length, values }];
  })) as SearchConsumerActionFeatureDictionaryV0DictionaryGroups;
  return { status, sourceConsistency: { cfp80Ready, cfp81Ready, countsMatch, invalidIds, labelParity, cfp81HashesMatch: input.cfp81HashesMatch, sourceReferenceCount: input.sourceReferenceCount, emptySourceHashCount: input.emptySourceHashCount }, selectedRoots: selectedRoots.sort((a,b) => a.rootRef.localeCompare(b.rootRef)), selectedActions: selectedActions.sort((a,b) => (rootRefs[a.rootRefId] ?? "").localeCompare(rootRefs[b.rootRefId] ?? "") || a.ordinal - b.ordinal || a.publicActionRefId - b.publicActionRefId), skippedRoots: input.skippedRoots, projectedDictionaries, actionLabelCounts: sorted(actionLabelCounts), exclusionCounts: sorted(exclusionCounts), exclusionSlices: Object.fromEntries(Object.entries(exclusionSlices).map(([key, value]) => [key, sorted(value)])), closureMismatchCount };
};
