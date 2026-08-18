import { describe, expect, it } from "vitest";
import { serializeSearchConsumerSmallSubsetContractV0Artifacts, searchConsumerSmallSubsetContractV0ArtifactFiles } from "@/game/benchmark";
describe("search consumer small subset contract v0 artifacts", () => {
  it("serializes the exact eight-file contract", () => { const artifacts = serializeSearchConsumerSmallSubsetContractV0Artifacts({ suiteId:"s", runId:"cFp83", sourceDictionaryHash:"hash", sourceArtifactReferences:[], result: { status:"subset_ready", sourceConsistency:{}, selectedRoots:[], selectedActions:[], skippedRoots:[], projectedDictionaries:{} as never, actionLabelCounts:{consumer_ready:0}, exclusionCounts:{}, exclusionSlices:{}, closureMismatchCount:0 } }); expect(Object.keys(artifacts)).toHaveLength(8); expect(searchConsumerSmallSubsetContractV0ArtifactFiles).toHaveLength(8); expect(artifacts.manifestJson).toContain("subset-actions.jsonl"); });
});
