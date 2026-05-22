import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  ROUND_ONE_GUARD_DEBUG_FIXTURES,
  combinedRoundOneGuardDebugArtifactText,
  runRoundOneGuardDebugCases,
  scanRoundOneGuardDebugArtifactsForHiddenInfo,
  serializeRoundOneGuardDebugArtifacts,
} from "@/game/benchmark";

const fixtureAFindingId =
  "round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-017__1__seat-a";
const fixtureBFindingId =
  "round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-robust-008__0__seat-b";

const hiddenInfoHazards = [
  "cardsById",
  "finalState",
  "commandLog",
  "unsafeDebugResults",
  "decisionTraces",
  "legalMoves",
  "candidates",
  '"ownHand":',
  '"opponentHand":',
  '"hand":',
  '"deck":',
  '"discard":',
  "seat_a:",
  "seat_b:",
  "sourceId",
  "sourceIds",
  "cardId",
  "cardIds",
  "instanceId",
  "actionRef",
  "Yennefer",
  "Geralt",
  "Gaunter",
  "O'Dimm",
  "Draug",
  "neutral.",
  "northern-realms.",
  "nilfgaard.",
  "monsters.",
  "scoiatael.",
  "skellige.",
];

let cachedResult: ReturnType<typeof runRoundOneGuardDebugCases> | null = null;

const getResult = () => {
  cachedResult ??= runRoundOneGuardDebugCases();
  return cachedResult;
};

describe("round-one guard debug", () => {
  it("lists the two exact cFp51 guard-recommended fixtures", () => {
    expect(ROUND_ONE_GUARD_DEBUG_FIXTURES).toHaveLength(2);
    expect(ROUND_ONE_GUARD_DEBUG_FIXTURES.map((fixture) => fixture.findingId)).toEqual([
      fixtureAFindingId,
      fixtureBFindingId,
    ]);
    expect(ROUND_ONE_GUARD_DEBUG_FIXTURES.map((fixture) => fixture.suiteId)).toEqual([
      "benchmark-v1-starter-matrix-robust-v1",
      "benchmark-v1-starter-matrix-robust-v1",
    ]);
  });

  it("replays exactly two cases and keeps the mirror-1 target on the expected v1 seat", () => {
    const result = getResult();
    const [fixtureA, fixtureB] = result.cases;

    expect(result.schemaVersion).toBe("round-one-guard-debug-v1");
    expect(result.cases).toHaveLength(2);
    expect(fixtureA.fixture.mirrorIndex).toBe(1);
    expect(fixtureA.fixture.targetSeatId).toBe("seat_a");
    expect(fixtureA.targetPolicyId).toBe("legal-heuristic-v1");
    expect(fixtureA.targetFaction).toBe("scoiatael");
    expect(fixtureA.targetDeckPresetId).toBe("official-scoiatael-starter");
    expect(fixtureB.fixture.mirrorIndex).toBe(0);
    expect(fixtureB.fixture.targetSeatId).toBe("seat_b");
    expect(fixtureB.targetPolicyId).toBe("legal-heuristic-v1");
    expect(fixtureB.targetFaction).toBe("skellige");
    expect(fixtureB.targetDeckPresetId).toBe("official-skellige-starter");
  });

  it("produces non-empty round-one v1 decision rows for both fixtures", () => {
    const result = getResult();

    expect(result.cases.every((debugCase) => debugCase.status === "completed")).toBe(true);
    expect(result.cases.every((debugCase) => debugCase.decisionRows.length > 0)).toBe(true);
    expect(result.cases.map((debugCase) => debugCase.summary.playCardTraceCount)).toEqual([5, 7]);
  });

  it("reports zero cFp53 selected-play contradictions for both repaired fixtures", () => {
    const [fixtureA, fixtureB] = getResult().cases;

    expect(fixtureA.verdict).toBe("suppressed_pass_after_overinvestment");
    expect(fixtureA.summary).toEqual(
      expect.objectContaining({
        recommendedPlayContradictionCount: 0,
        suppressedPassCount: 1,
        firstRecommendedPlayContradictionDecisionIndex: null,
      }),
    );
    expect(fixtureB.verdict).toBe("suppressed_pass_after_overinvestment");
    expect(fixtureB.summary).toEqual(
      expect.objectContaining({
        recommendedPlayContradictionCount: 0,
        suppressedPassCount: 1,
        firstRecommendedPlayContradictionDecisionIndex: null,
      }),
    );
  });

  it("keeps the historical cFp52 before-fix artifacts readable", () => {
    const historicalManifest = readFileSync(
      resolve(
        process.cwd(),
        "docs/research/literature/ai/benchmark-results/benchmark-v1-starter-matrix-robust-v1/round-one-guard-debug/cFp52/manifest.json",
      ),
      "utf8",
    );

    expect(historicalManifest).toContain('"generatedPhase": "cFp52"');
  });

  it("serializes hidden-info-safe artifacts without raw traces or private identifiers", () => {
    const artifacts = serializeRoundOneGuardDebugArtifacts(getResult());
    const combined = combinedRoundOneGuardDebugArtifactText(artifacts);

    expect(scanRoundOneGuardDebugArtifactsForHiddenInfo(artifacts)).toEqual([]);
    hiddenInfoHazards.forEach((hazard) => {
      expect(combined).not.toContain(hazard);
    });
    expect(combined).toContain("official-scoiatael-starter");
    expect(combined).toContain("official-skellige-starter");
  });

  it("serializes cFp53 output without absolute local or Windows paths", () => {
    const artifacts = serializeRoundOneGuardDebugArtifacts(getResult());
    const combined = combinedRoundOneGuardDebugArtifactText(artifacts);

    expect(combined).not.toMatch(/\/Users\//);
    expect(combined).not.toMatch(/[A-Z]:\\/);
  });

  it("rejects a synthetic unsafe artifact containing a card source id", () => {
    const artifacts = serializeRoundOneGuardDebugArtifacts(getResult());

    expect(
      scanRoundOneGuardDebugArtifactsForHiddenInfo({
        ...artifacts,
        casesJson: `${artifacts.casesJson}\n{"sourceId":"scoiatael.example-card"}`,
      }),
    ).toEqual(expect.arrayContaining(["raw source id key", "card source namespace"]));
  });

  it("rejects a synthetic unsafe artifact containing a raw card name with punctuation", () => {
    const artifacts = serializeRoundOneGuardDebugArtifacts(getResult());

    expect(
      scanRoundOneGuardDebugArtifactsForHiddenInfo({
        ...artifacts,
        reportMarkdown: `${artifacts.reportMarkdown}\nGaunter O'Dimm: Darkness`,
      }),
    ).toEqual(expect.arrayContaining(["raw card name Gaunter", "raw card name O'Dimm"]));
  });

  it("serializes byte-identical artifacts across repeated debug runs", () => {
    const first = serializeRoundOneGuardDebugArtifacts(runRoundOneGuardDebugCases());
    const second = serializeRoundOneGuardDebugArtifacts(runRoundOneGuardDebugCases());

    expect(second).toEqual(first);
  });
});
