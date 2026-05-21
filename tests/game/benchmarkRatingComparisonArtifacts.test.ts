import { describe, expect, it } from "vitest";

import {
  buildComparisonBundle,
  buildSnapshotBundle,
} from "@/game/benchmark/ratingComparisonArtifacts";
import type {
  RatingComparisonOutput,
  RatingSnapshotInfo,
} from "@/game/benchmark/ratingComparisons";
import {
  scanComparisonOutputForAbsolutePaths,
  scanComparisonOutputSafety,
} from "@/game/benchmark/ratingComparisons";

describe("comparison artifacts: deterministic output", () => {
  it("comparison.json is deterministic across two builds from the same inputs", () => {
    const bundle1 = buildComparisonBundle(
      {
        schemaVersion: "rating-comparison-v1",
        suiteId: "test-suite",
        baseSnapshotId: "v1",
        candidateSnapshotId: "v2",
        entries: [
          {
            scope: "policy",
            key: "policy:policy-a",
            label: "policy-a",
            status: "common",
            baseRating: 1500,
            baseRd: 100,
            baseConservativeRating: 1300,
            baseGames: 20,
            candidateRating: 1500,
            candidateRd: 100,
            candidateConservativeRating: 1300,
            candidateGames: 20,
            deltaRating: 0,
            deltaRd: 0,
            deltaConservativeRating: 0,
            deltaGames: 0,
            combinedRd: 141.42,
            deltaOverCombinedRd: 0,
            signal: "no_change",
            note: "No rating or game-count change detected between baseline and candidate.",
          },
        ],
      },
      "cFp47"
    );

    const bundle2 = buildComparisonBundle(
      {
        schemaVersion: "rating-comparison-v1",
        suiteId: "test-suite",
        baseSnapshotId: "v1",
        candidateSnapshotId: "v2",
        entries: [
          {
            scope: "policy",
            key: "policy:policy-a",
            label: "policy-a",
            status: "common",
            baseRating: 1500,
            baseRd: 100,
            baseConservativeRating: 1300,
            baseGames: 20,
            candidateRating: 1500,
            candidateRd: 100,
            candidateConservativeRating: 1300,
            candidateGames: 20,
            deltaRating: 0,
            deltaRd: 0,
            deltaConservativeRating: 0,
            deltaGames: 0,
            combinedRd: 141.42,
            deltaOverCombinedRd: 0,
            signal: "no_change",
            note: "No rating or game-count change detected between baseline and candidate.",
          },
        ],
      },
      "cFp47"
    );

    expect(bundle1.comparisonJson).toBe(bundle2.comparisonJson);
    expect(bundle1.manifestJson).toBe(bundle2.manifestJson);
  });

  it("manifest includes hashes and source labels", () => {
    const comparison: RatingComparisonOutput = {
      schemaVersion: "rating-comparison-v1",
      suiteId: "test-suite",
      baseSnapshotId: "cFp46",
      candidateSnapshotId: "latest",
      entries: [],
    };

    const bundle = buildComparisonBundle(comparison, "cFp47");
    const manifest = JSON.parse(bundle.manifestJson);

    expect(manifest.schemaVersion).toBe("rating-comparison-manifest-v1");
    expect(manifest.suiteId).toBe("test-suite");
    expect(manifest.baseSnapshotId).toBe("cFp46");
    expect(manifest.candidateSnapshotId).toBe("latest");
    expect(manifest.entryCount).toBe(0);
    expect(typeof manifest.comparisonJsonHash).toBe("string");
    expect(manifest.comparisonJsonHash.length).toBeGreaterThan(0);
    expect(manifest.createdByPhase).toBe("cFp47");
  });

  it("comparison.json is self-describing with top-level metadata", () => {
    const comparison: RatingComparisonOutput = {
      schemaVersion: "rating-comparison-v1",
      suiteId: "my-suite",
      baseSnapshotId: "snap-1",
      candidateSnapshotId: "snap-2",
      entries: [
        {
          scope: "policy",
          key: "policy:test",
          label: "test",
          status: "common",
          baseRating: 1500,
          baseRd: 100,
          baseConservativeRating: 1300,
          baseGames: 20,
          candidateRating: 1500,
          candidateRd: 100,
          candidateConservativeRating: 1300,
          candidateGames: 20,
          deltaRating: 0,
          deltaRd: 0,
          deltaConservativeRating: 0,
          deltaGames: 0,
          combinedRd: 141.42,
          deltaOverCombinedRd: 0,
          signal: "no_change",
          note: "test note",
        },
      ],
    };

    const bundle = buildComparisonBundle(comparison, "cFp47");
    const parsed = JSON.parse(bundle.comparisonJson);

    expect(parsed.schemaVersion).toBe("rating-comparison-v1");
    expect(parsed.suiteId).toBe("my-suite");
    expect(parsed.baseSnapshotId).toBe("snap-1");
    expect(parsed.candidateSnapshotId).toBe("snap-2");
    expect(Array.isArray(parsed.entries)).toBe(true);
  });

  it("report includes warnings about uncertainty and suite-local interpretation", () => {
    const comparison: RatingComparisonOutput = {
      schemaVersion: "rating-comparison-v1",
      suiteId: "test",
      baseSnapshotId: "a",
      candidateSnapshotId: "b",
      entries: [],
    };

    const bundle = buildComparisonBundle(comparison, "cFp47");

    expect(bundle.reportMarkdown).toContain("heuristic comparison labels");
    expect(bundle.reportMarkdown).toContain("not statistical proof");
    expect(bundle.reportMarkdown).toContain("exploitability or product difficulty");
    expect(bundle.reportMarkdown).toContain("research-local and not product difficulty");
    expect(bundle.reportMarkdown).toContain("Do not compare ratings across different suite pools");
  });

  it("no hidden-info hazard strings appear in comparison artifacts", () => {
    const comparison: RatingComparisonOutput = {
      schemaVersion: "rating-comparison-v1",
      suiteId: "test",
      baseSnapshotId: "a",
      candidateSnapshotId: "b",
      entries: [
        {
          scope: "policy",
          key: "policy:test",
          label: "test",
          status: "common",
          baseRating: 1500,
          baseRd: 100,
          baseConservativeRating: 1300,
          baseGames: 20,
          candidateRating: 1500,
          candidateRd: 100,
          candidateConservativeRating: 1300,
          candidateGames: 20,
          deltaRating: 0,
          deltaRd: 0,
          deltaConservativeRating: 0,
          deltaGames: 0,
          combinedRd: 141.42,
          deltaOverCombinedRd: 0,
          signal: "no_change",
          note: "test note",
        },
      ],
    };

    const hazards = scanComparisonOutputSafety(comparison);
    expect(hazards).toHaveLength(0);

    const bundle = buildComparisonBundle(comparison, "cFp47");
    const combined = [bundle.manifestJson, bundle.comparisonJson, bundle.reportMarkdown].join("\n");
    expect(combined).not.toContain("cardsById");
    expect(combined).not.toContain("finalState");
    expect(combined).not.toContain("commandLog");
    expect(combined).not.toContain("eventLog");
    expect(combined).not.toContain("ownHand");
    expect(combined).not.toContain("opponentHand");
    expect(combined).not.toContain("seat_a:");
    expect(combined).not.toContain("seat_b:");
    expect(combined).not.toContain("unsafeDebugResults");
  });

  it("no absolute local paths appear in comparison artifacts", () => {
    const comparison: RatingComparisonOutput = {
      schemaVersion: "rating-comparison-v1",
      suiteId: "test",
      baseSnapshotId: "a",
      candidateSnapshotId: "b",
      entries: [],
    };

    const pathHazards = scanComparisonOutputForAbsolutePaths(comparison);
    expect(pathHazards).toHaveLength(0);

    const bundle = buildComparisonBundle(comparison, "cFp47");
    const combined = [bundle.manifestJson, bundle.comparisonJson, bundle.reportMarkdown].join("\n");
    expect(combined).not.toContain("C:\\");
    expect(combined).not.toContain("/Users/");
  });

  it("snapshot bundle includes all required fields", () => {
    const snapshotInfo: RatingSnapshotInfo = {
      suiteId: "test-suite",
      snapshotId: "cFp46",
      ratingsJson: JSON.stringify({ schemaVersion: "benchmark-rating-v1" }),
      reportMarkdown: "# Test Report\n",
      ratingsJsonHash: "abc123",
      reportMdHash: "def456",
      sourceRecordsPath: "docs/research/literature/ai/benchmark-results/test/records.jsonl",
      sourceRecordCount: 100,
      eligibleRecordCount: 95,
      ignoredRecordCount: 5,
      createdByPhase: "cFp47",
      notes: "test snapshot",
    };

    const bundle = buildSnapshotBundle(snapshotInfo);

    const manifest = JSON.parse(bundle.manifestJson);
    expect(manifest.schemaVersion).toBe("rating-snapshot-manifest-v1");
    expect(manifest.suiteId).toBe("test-suite");
    expect(manifest.snapshotId).toBe("cFp46");
    expect(manifest.sourceRecordsPath).toBe(snapshotInfo.sourceRecordsPath);
    expect(manifest.sourceRecordCount).toBe(100);
    expect(manifest.eligibleRecordCount).toBe(95);
    expect(manifest.ignoredRecordCount).toBe(5);
    expect(manifest.ratingsJsonHash).toBe("abc123");
    expect(manifest.reportMdHash).toBe("def456");
    expect(manifest.createdByPhase).toBe("cFp47");
    expect(manifest.notes).toBe("test snapshot");
    expect(bundle.reportMarkdown).toBe("# Test Report\n");
  });
});

describe("comparison artifacts: integration with existing ratings", () => {
  it("comparison artifacts from real rating output are hidden-info safe", () => {
    const hazards = scanComparisonOutputSafety({
      schemaVersion: "rating-comparison-v1",
      suiteId: "suite-a",
      baseSnapshotId: "cFp46",
      candidateSnapshotId: "latest",
      entries: [
        {
          scope: "policy",
          key: "policy:v1",
          label: "v1",
          status: "common",
          baseRating: 1500,
          baseRd: 100,
          baseConservativeRating: 1300,
          baseGames: 20,
          candidateRating: 1500,
          candidateRd: 100,
          candidateConservativeRating: 1300,
          candidateGames: 20,
          deltaRating: 0,
          deltaRd: 0,
          deltaConservativeRating: 0,
          deltaGames: 0,
          combinedRd: 141.42,
          deltaOverCombinedRd: 0,
          signal: "no_change",
          note: "test",
        },
      ],
    });

    expect(hazards).toHaveLength(0);
    const pathHazards = scanComparisonOutputForAbsolutePaths({
      schemaVersion: "rating-comparison-v1",
      suiteId: "suite-a",
      baseSnapshotId: "cFp46",
      candidateSnapshotId: "latest",
      entries: [
        {
          scope: "policy",
          key: "policy:v1",
          label: "v1",
          status: "common",
          baseRating: 1500,
          baseRd: 100,
          baseConservativeRating: 1300,
          baseGames: 20,
          candidateRating: 1500,
          candidateRd: 100,
          candidateConservativeRating: 1300,
          candidateGames: 20,
          deltaRating: 0,
          deltaRd: 0,
          deltaConservativeRating: 0,
          deltaGames: 0,
          combinedRd: 141.42,
          deltaOverCombinedRd: 0,
          signal: "no_change",
          note: "test",
        },
      ],
    });
    expect(pathHazards).toHaveLength(0);

    const bundle = buildComparisonBundle(
      {
        schemaVersion: "rating-comparison-v1",
        suiteId: "suite-a",
        baseSnapshotId: "cFp46",
        candidateSnapshotId: "latest",
        entries: [],
      },
      "cFp47"
    );
    const combined = [bundle.manifestJson, bundle.comparisonJson, bundle.reportMarkdown].join("\n");
    expect(combined).not.toContain("C:\\");
    expect(combined).not.toContain("/Users/");
  });
});
