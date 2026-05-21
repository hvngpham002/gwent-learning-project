import { describe, expect, it } from "vitest";

import type {
  BenchmarkRatingEntry,
  BenchmarkRatingOutput,
  BenchmarkRatingScope,
} from "@/game/benchmark/ratings";

import {
  compareRatingOutputs,
  scanComparisonOutputForAbsolutePaths,
  scanComparisonOutputSafety,
  validateSuiteMatch,
} from "@/game/benchmark/ratingComparisons";

function makeRatingOutput(
  suiteId: string,
  entries: Omit<BenchmarkRatingEntry, "scope">[]
): BenchmarkRatingOutput {
  return {
    schemaVersion: "benchmark-rating-artifact-v1",
    ratingSchemaVersion: "benchmark-rating-v1",
    suiteId,
    sourceRecordsPath: "docs/research/literature/ai/benchmark-results/test/records.jsonl",
    config: {
      defaultRating: 1500,
      defaultRd: 350,
      q: 0.00575646,
      rdFloor: 30,
    },
    summary: {
      totalRecords: 10,
      eligibleRecords: 10,
      ignoredRecords: 0,
      ignoredReasons: {},
    },
    scopes: [
      {
        scope: "policy",
        entries: entries.map((e) => ({ ...e, scope: "policy" as BenchmarkRatingScope })),
      },
    ],
  };
}

describe("rating comparisons: suite validation", () => {
  it("accepts matching suite ids", () => {
    expect(() => validateSuiteMatch("suite-a", "suite-a")).not.toThrow();
  });

  it("rejects mismatched suite ids", () => {
    expect(() => validateSuiteMatch("suite-a", "suite-b")).toThrow(
      /Suite mismatch/
    );
  });
});

describe("rating comparisons: signal labels", () => {
  it("no_change when all deltas are zero", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);
    const output = compareRatingOutputs(base, base, "base", "candidate");
    expect(output.entries).toHaveLength(1);
    expect(output.entries[0].signal).toBe("no_change");
    expect(output.entries[0].deltaRating).toBe(0);
    expect(output.entries[0].deltaRd).toBe(0);
    expect(output.entries[0].deltaConservativeRating).toBe(0);
    expect(output.entries[0].deltaGames).toBe(0);
  });

  it("directional_gain when conservative rating increases with sufficient signal", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);

    const candidate = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1600,
        rd: 80,
        conservativeRating: 1440,
        games: 25,
        wins: 18,
        losses: 7,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, candidate, "base", "candidate");
    expect(output.entries[0].signal).toBe("directional_gain");
    expect(output.entries[0].deltaConservativeRating).toBe(140);
    expect(output.entries[0].status).toBe("common");
  });

  it("directional_regression when conservative rating decreases with sufficient signal", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1600,
        rd: 80,
        conservativeRating: 1440,
        games: 25,
        wins: 18,
        losses: 7,
        draws: 0,
      },
    ]);

    const candidate = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, candidate, "base", "candidate");
    expect(output.entries[0].signal).toBe("directional_regression");
    expect(output.entries[0].deltaConservativeRating).toBe(-140);
  });

  it("uncertain when rating moves but combined RD signal is weak", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 300,
        conservativeRating: 900,
        games: 5,
        wins: 3,
        losses: 2,
        draws: 0,
      },
    ]);

    const candidate = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1520,
        rd: 290,
        conservativeRating: 940,
        games: 6,
        wins: 3,
        losses: 3,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, candidate, "base", "candidate");
    expect(output.entries[0].signal).toBe("uncertain");
  });

  it("new_entry when key is absent in base", () => {
    const base = makeRatingOutput("test", []);

    const candidate = makeRatingOutput("test", [
      {
        key: "policy:b",
        label: "b",
        rating: 1550,
        rd: 100,
        conservativeRating: 1350,
        games: 20,
        wins: 12,
        losses: 8,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, candidate, "base", "candidate");
    expect(output.entries[0].signal).toBe("new_entry");
    expect(output.entries[0].status).toBe("new");
  });

  it("removed_entry when key is absent in candidate", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:b",
        label: "b",
        rating: 1550,
        rd: 100,
        conservativeRating: 1350,
        games: 20,
        wins: 12,
        losses: 8,
        draws: 0,
      },
    ]);

    const candidate = makeRatingOutput("test", []);

    const output = compareRatingOutputs(base, candidate, "base", "candidate");
    expect(output.entries[0].signal).toBe("removed_entry");
    expect(output.entries[0].status).toBe("removed");
  });
});

describe("rating comparisons: combined RD and deltaOverCombinedRd", () => {
  it("combinedRd = sqrt(baseRd^2 + candidateRd^2) for common entries", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);

    const candidate = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 150,
        conservativeRating: 1200,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, candidate, "base", "candidate");
    const expectedCombinedRd = Math.sqrt(100 * 100 + 150 * 150);
    expect(output.entries[0].combinedRd).toBeCloseTo(expectedCombinedRd, 2);
  });

  it("deltaOverCombinedRd is computed correctly for common entries", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);

    const candidate = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1550,
        rd: 100,
        conservativeRating: 1350,
        games: 20,
        wins: 12,
        losses: 8,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, candidate, "base", "candidate");
    const expectedCombinedRd = Math.sqrt(100 * 100 + 100 * 100);
    const expectedDeltaOverCombinedRd = 50 / expectedCombinedRd;
    expect(output.entries[0].deltaOverCombinedRd).toBeCloseTo(expectedDeltaOverCombinedRd, 4);
  });

  it("deltaOverCombinedRd is null for non-common entries", () => {
    const base = makeRatingOutput("test", []);

    const candidate = makeRatingOutput("test", [
      {
        key: "policy:b",
        label: "b",
        rating: 1550,
        rd: 100,
        conservativeRating: 1350,
        games: 20,
        wins: 12,
        losses: 8,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, candidate, "base", "candidate");
    expect(output.entries[0].deltaOverCombinedRd).toBeNull();
  });
});

describe("rating comparisons: output structure", () => {
  it("comparison output has correct schema version and fields", () => {
    const base = makeRatingOutput("test-suite", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, base, "v1", "v2");
    expect(output.schemaVersion).toBe("rating-comparison-v1");
    expect(output.suiteId).toBe("test-suite");
    expect(output.baseSnapshotId).toBe("v1");
    expect(output.candidateSnapshotId).toBe("v2");
    expect(Array.isArray(output.entries)).toBe(true);
  });

  it("entries include all required fields", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, base, "base", "candidate");
    const entry = output.entries[0];

    expect(entry.scope).toBe("policy");
    expect(entry.key).toBe("policy:a");
    expect(entry.label).toBe("a");
    expect(entry.status).toBe("common");
    expect(entry.baseRating).toBe(1500);
    expect(entry.baseRd).toBe(100);
    expect(entry.baseConservativeRating).toBe(1300);
    expect(entry.baseGames).toBe(20);
    expect(entry.candidateRating).toBe(1500);
    expect(entry.candidateRd).toBe(100);
    expect(entry.candidateConservativeRating).toBe(1300);
    expect(entry.candidateGames).toBe(20);
    expect(entry.deltaRating).toBe(0);
    expect(entry.deltaRd).toBe(0);
    expect(entry.deltaConservativeRating).toBe(0);
    expect(entry.deltaGames).toBe(0);
    expect(typeof entry.combinedRd).toBe("number");
    expect(typeof entry.deltaOverCombinedRd).toBe("number");
    expect(typeof entry.signal).toBe("string");
    expect(typeof entry.note).toBe("string");
  });
});

describe("rating comparisons: hidden-info safety", () => {
  it("comparison output does not contain hidden-info hazard strings", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, base, "base", "candidate");
    const hazards = scanComparisonOutputSafety(output);
    expect(hazards).toHaveLength(0);
  });

  it("comparison output does not contain absolute paths", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, base, "base", "candidate");
    const pathHazards = scanComparisonOutputForAbsolutePaths(output);
    expect(pathHazards).toHaveLength(0);
  });
});

describe("rating comparisons: multiple entries sorting", () => {
  it("entries are sorted by scope then status then key", () => {
    const base = makeRatingOutput("test", [
      {
        key: "policy:b",
        label: "b",
        rating: 1500,
        rd: 100,
        conservativeRating: 1300,
        games: 20,
        wins: 10,
        losses: 10,
        draws: 0,
      },
      {
        key: "policy:a",
        label: "a",
        rating: 1600,
        rd: 80,
        conservativeRating: 1440,
        games: 25,
        wins: 14,
        losses: 11,
        draws: 0,
      },
    ]);

    const candidate = makeRatingOutput("test", [
      {
        key: "policy:a",
        label: "a",
        rating: 1600,
        rd: 80,
        conservativeRating: 1440,
        games: 25,
        wins: 14,
        losses: 11,
        draws: 0,
      },
    ]);

    const output = compareRatingOutputs(base, candidate, "base", "candidate");
    const keys = output.entries.map((e) => e.key);
    expect(keys).toEqual(["policy:a", "policy:b"]);
    expect(output.entries[0].status).toBe("common");
    expect(output.entries[1].status).toBe("removed");
  });
});
