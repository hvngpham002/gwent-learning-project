import { describe, expect, it } from "vitest";
import { searchConsumerBoundedActionSignalV0ArtifactFiles, searchConsumerBoundedActionSignalV0ArtifactHashes, serializeSearchConsumerBoundedActionSignalV0Artifacts, validateSearchConsumerBoundedActionSignalV0ArtifactSizeLimits } from "@/game/benchmark";

describe("searchConsumerBoundedActionSignalV0Artifacts", () => {
  it("uses the exact eight-file hash contract", () => {
    const artifacts = serializeSearchConsumerBoundedActionSignalV0Artifacts({ suiteId: "suite", sourceDictionaryHash: "hash", sourceArtifactReferences: [], result: { status: "signal_ready", sourceConsistency: {}, rootRows: [], actionRows: [], skippedRows: [], expectedPairs: 0, completedPairs: 0, failedPairs: 0, duplicateCompletedPairs: 0, unaccountedPairs: 0, failureCounts: {}, signalRange: { minimum: 0, maximum: 0 }, sensitivityCounts: {} } });
    expect(Object.keys(searchConsumerBoundedActionSignalV0ArtifactHashes(artifacts))).toEqual(searchConsumerBoundedActionSignalV0ArtifactFiles);
    expect(JSON.parse(artifacts.summaryJson).status).toBe("signal_ready");
  });
  it("applies individual and bundle size limits", () => {
    expect(validateSearchConsumerBoundedActionSignalV0ArtifactSizeLimits({ "action-signals.jsonl": 50 * 1024 * 1024, "root-evaluations.jsonl": 1 })).toMatchObject({ passes: false });
    expect(validateSearchConsumerBoundedActionSignalV0ArtifactSizeLimits({ "action-signals.jsonl": 1, "root-evaluations.jsonl": 25 * 1024 * 1024 })).toMatchObject({ passes: false });
    expect(validateSearchConsumerBoundedActionSignalV0ArtifactSizeLimits({ "report.md": 15 * 1024 * 1024 })).toMatchObject({ passes: false });
  });
});
