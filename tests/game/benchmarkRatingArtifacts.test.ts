import { describe, expect, it } from "vitest";

import type { BenchmarkMatchRecord } from "@/game/benchmark/types";
import { computeRatings } from "@/game/benchmark/ratings";
import { buildRatingArtifactBundle, HIDDEN_INFO_HAZARDS, scanRatingArtifactSafety } from "@/game/benchmark/ratingArtifacts";

function makeRecord(overrides: Partial<BenchmarkMatchRecord> & { seats: BenchmarkMatchRecord["seats"] }): BenchmarkMatchRecord {
  return {
    schemaVersion: "benchmark-match-v1",
    benchmarkRunId: "test-run",
    suiteId: "test-suite",
    matchupId: "test-matchup",
    seed: 1,
    mirrorIndex: 0,
    status: "completed",
    winner: "seat_a",
    resultBySeat: { seat_a: "win", seat_b: "loss" },
    roundWinsBySeat: { seat_a: 2, seat_b: 0 },
    roundDraws: 0,
    finalGems: { seat_a: 3, seat_b: 1 },
    stepCount: 40,
    commandCount: 80,
    eventCount: 100,
    averageLegalMoves: 10,
    passCount: 2,
    promptsResolved: 0,
    leaderUses: 0,
    replayStatus: "passed",
    stableFingerprint: "fp-1",
    ...overrides,
  };
}

describe("benchmark rating artifacts: hidden-info safety", () => {
  it("generated rating JSON does not include hidden-info hazard strings", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const bundle = buildRatingArtifactBundle(output);
    const violations = scanRatingArtifactSafety(bundle);
    expect(violations).toHaveLength(0);
  });

  it("generated markdown report does not include hidden-info hazard strings", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const bundle = buildRatingArtifactBundle(output);
    expect(bundle.reportMarkdown).not.toContain("cardsById");
    expect(bundle.reportMarkdown).not.toContain("finalState");
    expect(bundle.reportMarkdown).not.toContain("commandLog");
    expect(bundle.reportMarkdown).not.toContain("eventLog");
    expect(bundle.reportMarkdown).not.toContain("ownHand");
    expect(bundle.reportMarkdown).not.toContain("opponentHand");
    expect(bundle.reportMarkdown).not.toContain("seat_a:");
    expect(bundle.reportMarkdown).not.toContain("seat_b:");
    expect(bundle.reportMarkdown).not.toContain("unsafeDebugResults");
  });

  it("HIDDEN_INFO_HAZARDS list matches the spec", () => {
    const expected = [
      "cardsById",
      "finalState",
      "commandLog",
      "eventLog",
      "ownHand",
      "opponentHand",
      "seat_a:",
      "seat_b:",
      "unsafeDebugResults",
    ];
    expect(HIDDEN_INFO_HAZARDS).toEqual(expected);
  });
});

describe("benchmark rating artifacts: determinism", () => {
  it("output is deterministic across two builds from the same fixture", () => {
    const records = [
      makeRecord({
        seed: 1,
        matchupId: "a-vs-b",
        stableFingerprint: "fp-1",
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
      makeRecord({
        seed: 2,
        matchupId: "a-vs-b",
        stableFingerprint: "fp-2",
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];

    const output1 = computeRatings(records, "test", "records.jsonl");
    const output2 = computeRatings(records, "test", "records.jsonl");

    const bundle1 = buildRatingArtifactBundle(output1);
    const bundle2 = buildRatingArtifactBundle(output2);

    expect(bundle1.manifestJson).toBe(bundle2.manifestJson);
    expect(bundle1.ratingsJson).toBe(bundle2.ratingsJson);
    expect(bundle1.reportMarkdown).toBe(bundle2.reportMarkdown);
  });
});

describe("benchmark rating artifacts: manifest structure", () => {
  it("manifest includes all required fields", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const bundle = buildRatingArtifactBundle(output);
    const manifest = JSON.parse(bundle.manifestJson);

    expect(manifest.schemaVersion).toBe("benchmark-rating-artifact-v1");
    expect(manifest.ratingSchemaVersion).toBe("benchmark-rating-v1");
    expect(manifest.suiteId).toBe("test");
    expect(typeof manifest.sourceRecordsPath).toBe("string");
    expect(typeof manifest.sourceRecordCount).toBe("number");
    expect(typeof manifest.eligibleRecordCount).toBe("number");
    expect(typeof manifest.ignoredRecordCount).toBe("number");
    expect(typeof manifest.generatedFrom).toBe("string");
    expect(typeof manifest.ratingsJsonHash).toBe("string");
    expect(typeof manifest.reportMdHash).toBe("string");
    expect(typeof manifest.hiddenInfoSafetyNote).toBe("string");
  });
});

describe("benchmark rating artifacts: report content", () => {
  it("report includes interpretation warnings", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const bundle = buildRatingArtifactBundle(output);

    expect(bundle.reportMarkdown).toContain("Ratings are not exploitability");
    expect(bundle.reportMarkdown).toContain("High RD means uncertain");
    expect(bundle.reportMarkdown).toContain("Do not compare ratings across different suite pools");
    expect(bundle.reportMarkdown).toContain("research-local and not product difficulty");
  });

  it("report includes source suite and record counts", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "my-suite", "records.jsonl");
    const bundle = buildRatingArtifactBundle(output);

    expect(bundle.reportMarkdown).toContain("my-suite");
    expect(bundle.reportMarkdown).toContain("records.jsonl");
  });

  it("report includes Glicko config", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const bundle = buildRatingArtifactBundle(output);

    expect(bundle.reportMarkdown).toContain("default rating: 1500");
    expect(bundle.reportMarkdown).toContain("default RD: 350");
  });

  it("ratings.json includes config and warnings", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const bundle = buildRatingArtifactBundle(output);
    const ratings = JSON.parse(bundle.ratingsJson);

    expect(ratings.config.defaultRating).toBe(1500);
    expect(ratings.config.defaultRd).toBe(350);
    expect(Array.isArray(ratings.scopes)).toBe(true);
    expect(Array.isArray(ratings.topEntriesByScope)).toBe(true);
  });

  it("ratings.json is self-describing with top-level metadata fields", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "my-suite", "docs/research/literature/ai/benchmark-results/my-suite/latest/records.jsonl");
    const bundle = buildRatingArtifactBundle(output);
    const ratings = JSON.parse(bundle.ratingsJson);

    expect(ratings.schemaVersion).toBe("benchmark-rating-v1");
    expect(ratings.ratingSchemaVersion).toBe("benchmark-rating-v1");
    expect(ratings.suiteId).toBe("my-suite");
    expect(ratings.sourceRecordsPath).toBe("docs/research/literature/ai/benchmark-results/my-suite/latest/records.jsonl");
    expect(typeof ratings.config).toBe("object");
    expect(typeof ratings.summary).toBe("object");
    expect(Array.isArray(ratings.topEntriesByScope)).toBe(true);
    expect(Array.isArray(ratings.scopes)).toBe(true);
    expect(Array.isArray(ratings.warnings)).toBe(true);
  });

  it("no Windows or absolute paths appear in rating artifacts", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "docs/research/literature/ai/benchmark-results/test/latest/records.jsonl");
    const bundle = buildRatingArtifactBundle(output);
    const combined = [bundle.manifestJson, bundle.ratingsJson, bundle.reportMarkdown].join("\n");

    // Should not contain absolute Windows paths
    expect(combined).not.toContain("C:\\");
    expect(combined).not.toContain("D:\\");
    // Should not contain /Users/ (Unix absolute paths)
    expect(combined).not.toContain("/Users/");
    // Should not contain absolute repo paths
    expect(combined).not.toMatch(/^[A-Z]:\\/);
    // Should not contain backslashes (Windows separators)
    expect(combined).not.toContain("\\");
    // Source path should use forward slashes
    const manifest = JSON.parse(bundle.manifestJson);
    expect(manifest.sourceRecordsPath).toMatch(/^[\w/.-]+$/);
    expect(manifest.sourceRecordsPath).not.toMatch(/[A-Z]:/);
    expect(manifest.sourceRecordsPath).not.toMatch(/^\/Users/);
  });

  it("portable repo-relative source paths are stored in all artifact outputs", () => {
    const records = [
      makeRecord({
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const repoPath = "docs/research/literature/ai/benchmark-results/my-suite/latest/records.jsonl";
    const output = computeRatings(records, "my-suite", repoPath);
    const bundle = buildRatingArtifactBundle(output);

    const manifest = JSON.parse(bundle.manifestJson);
    const ratings = JSON.parse(bundle.ratingsJson);

    expect(manifest.sourceRecordsPath).toBe(repoPath);
    expect(ratings.sourceRecordsPath).toBe(repoPath);
    expect(bundle.reportMarkdown).toContain(repoPath);
  });
});
