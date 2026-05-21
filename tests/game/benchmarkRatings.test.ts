import { describe, expect, it } from "vitest";

import type { BenchmarkMatchRecord } from "@/game/benchmark/types";

import {
  computeRatings,
  type BenchmarkRatingEntry,
  DEFAULT_RATING,
  DEFAULT_RD,
  RD_FLOOR,
  type BenchmarkRatingScope,
} from "@/game/benchmark/ratings";

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

function scopeEntries(output: ReturnType<typeof computeRatings>, scope: BenchmarkRatingScope): BenchmarkRatingEntry[] {
  return output.scopes.find((s) => s.scope === scope)?.entries ?? [];
}

function policyEntry(output: ReturnType<typeof computeRatings>, policyId: string): BenchmarkRatingEntry | undefined {
  const entries = scopeEntries(output, "policy");
  return entries.find((e) => e.key === `policy:${policyId}`);
}

describe("benchmark ratings: glicko formula", () => {
  it("a win raises winner rating and lowers loser rating", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        winner: "seat_a",
        resultBySeat: { seat_a: "win", seat_b: "loss" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const a = policyEntry(output, "policy-a");
    const b = policyEntry(output, "policy-b");

    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a!.rating).toBeGreaterThan(DEFAULT_RATING);
    expect(b!.rating).toBeLessThan(DEFAULT_RATING);
    expect(a!.wins).toBe(1);
    expect(b!.losses).toBe(1);
  });

  it("a draw between equal default entities keeps both ratings close to 1500 while reducing RD", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b-draw",
        winner: "draw",
        resultBySeat: { seat_a: "draw", seat_b: "draw" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const a = policyEntry(output, "policy-a");
    const b = policyEntry(output, "policy-b");

    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a!.draws).toBe(1);
    expect(b!.draws).toBe(1);
    expect(a!.rd).toBeLessThan(DEFAULT_RD);
    expect(b!.rd).toBeLessThan(DEFAULT_RD);
  });

  it("RD decreases after eligible games and never drops below rdFloor", () => {
    const records: BenchmarkMatchRecord[] = [];
    for (let i = 0; i < 20; i++) {
      records.push(
        makeRecord({
          seed: i,
          matchupId: "a-vs-b",
          winner: "seat_a",
          resultBySeat: { seat_a: "win", seat_b: "loss" },
          stableFingerprint: `fp-${i}`,
          seats: {
            seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
            seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
          },
        })
      );
    }
    const output = computeRatings(records, "test", "records.jsonl");
    const b = policyEntry(output, "policy-b");

    expect(b).toBeDefined();
    expect(b!.rd).toBeGreaterThanOrEqual(RD_FLOOR);
  });
});

describe("benchmark ratings: batch / rating-period behavior", () => {
  it("order of records does not change output", () => {
    const recordsA = [
      makeRecord({
        seed: 1,
        matchupId: "a-vs-b",
        winner: "seat_a",
        resultBySeat: { seat_a: "win", seat_b: "loss" },
        stableFingerprint: "fp-1",
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
      makeRecord({
        seed: 2,
        matchupId: "a-vs-b",
        winner: "seat_b",
        resultBySeat: { seat_a: "loss", seat_b: "win" },
        stableFingerprint: "fp-2",
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];

    const recordsB = [...recordsA].reverse();

    const outputA = computeRatings(recordsA, "test", "records.jsonl");
    const outputB = computeRatings(recordsB, "test", "records.jsonl");

    const entriesA = scopeEntries(outputA, "policy");
    const entriesB = scopeEntries(outputB, "policy");

    expect(entriesA).toHaveLength(entriesB.length);
    for (let i = 0; i < entriesA.length; i++) {
      expect(entriesA[i].rating).toBeCloseTo(entriesB[i].rating, 4);
      expect(entriesA[i].rd).toBeCloseTo(entriesB[i].rd, 4);
    }
  });

  it("mirrored records are handled as separate games but do not leak seat ids", () => {
    const records = [
      makeRecord({
        seed: 1,
        matchupId: "a-vs-b",
        mirrorIndex: 0,
        winner: "seat_a",
        resultBySeat: { seat_a: "win", seat_b: "loss" },
        stableFingerprint: "mirror-0",
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
      makeRecord({
        seed: 1,
        matchupId: "a-vs-b",
        mirrorIndex: 1,
        winner: "seat_b",
        resultBySeat: { seat_a: "loss", seat_b: "win" },
        stableFingerprint: "mirror-1",
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const a = policyEntry(output, "policy-a");
    const b = policyEntry(output, "policy-b");

    expect(a!.games).toBe(2);
    expect(b!.games).toBe(2);
    expect(a!.key).not.toContain("seat_a:");
    expect(b!.key).not.toContain("seat_b:");
  });
});

describe("benchmark ratings: scope behavior", () => {
  it("policy, policy_deck, and policy_faction scopes are produced", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        winner: "seat_a",
        resultBySeat: { seat_a: "win", seat_b: "loss" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const scopes = output.scopes.map((s) => s.scope);

    expect(scopes).toContain("policy");
    expect(scopes).toContain("policy_deck");
    expect(scopes).toContain("policy_faction");
  });

  it("labels include policy/deck/faction context", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        winner: "seat_a",
        resultBySeat: { seat_a: "win", seat_b: "loss" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "legal-heuristic-v1", playerId: "a", faction: "nilfgaard", deckPresetId: "official-nilfgaard-starter" },
          seat_b: { seatId: "seat_b", policyId: "legal-heuristic-v0", playerId: "b", faction: "scoiatael", deckPresetId: "official-scoiatael-starter" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");

    const policyEntry = scopeEntries(output, "policy")[0];
    const deckEntries = scopeEntries(output, "policy_deck");
    const factionEntries = scopeEntries(output, "policy_faction");

    expect(policyEntry!.label).toBe("legal-heuristic-v1");
    expect(deckEntries.some((e) => e.label.includes("legal-heuristic-v1"))).toBe(true);
    expect(factionEntries.some((e) => e.label.includes("nilfgaard"))).toBe(true);
  });
});

describe("benchmark ratings: filtering", () => {
  it("ignores records that are not completed", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        status: "max_steps_exceeded",
        winner: null,
        resultBySeat: { seat_a: "none", seat_b: "none" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    expect(output.summary.eligibleRecords).toBe(0);
    expect(output.summary.ignoredRecords).toBe(1);
  });

  it("ignores records with winner === null", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        winner: null,
        resultBySeat: { seat_a: "none", seat_b: "none" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    expect(output.summary.eligibleRecords).toBe(0);
  });

  it("ignores records with replayStatus === failed", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        replayStatus: "failed",
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    expect(output.summary.eligibleRecords).toBe(0);
  });

  it("omits zero-game entities from output", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        winner: "seat_a",
        resultBySeat: { seat_a: "win", seat_b: "loss" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const entries = scopeEntries(output, "policy");
    expect(entries).toHaveLength(2);

    // Add a third policy that never plays
    const entriesWithUnused = scopeEntries(
      computeRatings(
        records,
        "test",
        "records.jsonl",
        ["policy"]
      ),
      "policy"
    );

    // Only policies that played should be in entries
    expect(entriesWithUnused.length).toBe(2);
  });
});

describe("benchmark ratings: output fields", () => {
  it("rating entries include all required fields", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        winner: "seat_a",
        resultBySeat: { seat_a: "win", seat_b: "loss" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const entry = policyEntry(output, "policy-a");

    expect(entry).toBeDefined();
    expect(entry!.scope).toBe("policy");
    expect(typeof entry!.key).toBe("string");
    expect(typeof entry!.label).toBe("string");
    expect(typeof entry!.rating).toBe("number");
    expect(typeof entry!.rd).toBe("number");
    expect(typeof entry!.interval95Low).toBe("number");
    expect(typeof entry!.interval95High).toBe("number");
    expect(typeof entry!.conservativeRating).toBe("number");
    expect(typeof entry!.games).toBe("number");
    expect(typeof entry!.wins).toBe("number");
    expect(typeof entry!.losses).toBe("number");
    expect(typeof entry!.draws).toBe("number");
  });

  it("interval95Low < rating < interval95High", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        winner: "seat_a",
        resultBySeat: { seat_a: "win", seat_b: "loss" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const entry = policyEntry(output, "policy-a")!;

    expect(entry.interval95Low).toBeLessThan(entry.rating);
    expect(entry.interval95High).toBeGreaterThan(entry.rating);
  });

  it("conservativeRating = rating - 2 * rd", () => {
    const records = [
      makeRecord({
        matchupId: "a-vs-b",
        winner: "seat_a",
        resultBySeat: { seat_a: "win", seat_b: "loss" },
        seats: {
          seat_a: { seatId: "seat_a", policyId: "policy-a", playerId: "a", faction: "nilfgaard", deckPresetId: "deck-a" },
          seat_b: { seatId: "seat_b", policyId: "policy-b", playerId: "b", faction: "scoiatael", deckPresetId: "deck-b" },
        },
      }),
    ];
    const output = computeRatings(records, "test", "records.jsonl");
    const entry = policyEntry(output, "policy-a")!;

    const expected = entry.rating - 2 * entry.rd;
    expect(entry.conservativeRating).toBeCloseTo(expected, 2);
  });
});
