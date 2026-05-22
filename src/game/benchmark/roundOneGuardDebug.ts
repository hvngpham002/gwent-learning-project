import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  ROUND_ONE_OVERINVESTMENT_BOARD_AFTER_FLOOR,
  ROUND_ONE_OVERINVESTMENT_HAND_AFTER_CAP,
} from "@/game/ai/legalHeuristicPolicyV1";

import { runBenchmarkSuite } from "./runBenchmark";
import { getBenchmarkSuite } from "./suites";
import type { BenchmarkMatchRecord, BenchmarkMatchupDefinition, BenchmarkSuite } from "./types";

export const ROUND_ONE_GUARD_DEBUG_SCHEMA_VERSION = "round-one-guard-debug-v1" as const;
export const ROUND_ONE_GUARD_DEBUG_PHASE = "cFp53" as const;
export const ROUND_ONE_GUARD_DEBUG_SUITE_ID = "benchmark-v1-starter-matrix-robust-v1" as const;

export interface RoundOneGuardDebugFixture {
  readonly suiteId: typeof ROUND_ONE_GUARD_DEBUG_SUITE_ID;
  readonly matchupId: string;
  readonly seed: string;
  readonly mirrorIndex: 0 | 1;
  readonly targetSeatId: "seat_a" | "seat_b";
  readonly findingId: string;
}

export interface RoundOneGuardDebugDecisionRow {
  readonly decisionIndex: number;
  readonly selectedKind: string | null;
  readonly selectedTargetKind: string | null;
  readonly selectedTargetLabel: string | null;
  readonly scoreDelta: number;
  readonly ownHandCount: number;
  readonly opponentHandCount: number;
  readonly ownBoardCardCount: number;
  readonly roundOneBoardAfterSelectedMove: number;
  readonly currentRoundHandCount: number;
  readonly estimatedHandCountAfterSelectedMove: number;
  readonly selectedMoveSpendsHandCard: boolean;
  readonly selectedMoveIsCardAdvantage: boolean;
  readonly selectedMoveWouldLeaveNoPositiveUnitMove: boolean;
  readonly selectedMoveWouldLeaveNoUnitTempoCard: boolean;
  readonly catchUpStatus: string;
  readonly recommendation: string;
  readonly roundOneOverinvestmentRecommended: boolean;
  readonly roundOneOverinvestmentReason: string;
  readonly roundResourcePressure: string;
  readonly resourceExhaustionRecommended: boolean;
  readonly resourceExhaustionReason: string;
  readonly stopLossRecommended: boolean;
  readonly stopLossReason: string;
  readonly isPlayCardTrace: boolean;
  readonly boardFloorReached: boolean;
  readonly handCapReached: boolean;
  readonly baseGeometryReached: boolean;
  readonly isRecommendedPlayContradiction: boolean;
  readonly isSuppressedPass: boolean;
}

export interface RoundOneGuardDebugCase {
  readonly fixture: RoundOneGuardDebugFixture;
  readonly status: "completed" | "not_found" | "policy_failed" | "engine_error" | "replay_failed";
  readonly matchOutcome: "win" | "loss" | "draw" | "none";
  readonly targetPolicyId: string | null;
  readonly targetFaction: string | null;
  readonly targetDeckPresetId: string | null;
  readonly decisionRows: readonly RoundOneGuardDebugDecisionRow[];
  readonly summary: {
    readonly traceDecisionCount: number;
    readonly playCardTraceCount: number;
    readonly baseGeometryCount: number;
    readonly recommendedPlayContradictionCount: number;
    readonly suppressedPassCount: number;
    readonly firstBaseGeometryDecisionIndex: number | null;
    readonly firstRecommendedPlayContradictionDecisionIndex: number | null;
  };
  readonly verdict:
    | "confirmed_policy_contradiction"
    | "suppressed_pass_after_overinvestment"
    | "aggregate_only_no_selected_play_contradiction"
    | "missing_trace_data"
    | "fixture_failed";
}

export interface RoundOneGuardDebugResult {
  readonly schemaVersion: typeof ROUND_ONE_GUARD_DEBUG_SCHEMA_VERSION;
  readonly cases: readonly RoundOneGuardDebugCase[];
}

export interface SerializedRoundOneGuardDebugArtifacts {
  readonly manifestJson: string;
  readonly casesJson: string;
  readonly reportMarkdown: string;
}

export const roundOneGuardDebugArtifactFiles = ["manifest.json", "cases.json", "report.md"] as const;

const HIDDEN_INFO_SAFETY_NOTE =
  "cFp53 round-one guard debug artifacts contain public fixture IDs, target-seat public metadata, scalar decision diagnostics, coarse target labels, and derived booleans only. Raw traces, raw engine state, commands, events, legal moves, private zones, card IDs, source IDs, instance IDs, action refs, and card names are intentionally omitted.";

export const ROUND_ONE_GUARD_DEBUG_FIXTURES: readonly RoundOneGuardDebugFixture[] = [
  {
    suiteId: ROUND_ONE_GUARD_DEBUG_SUITE_ID,
    matchupId: "starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1",
    seed: "starter-matrix-robust-017",
    mirrorIndex: 1,
    targetSeatId: "seat_a",
    findingId:
      "round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-scoiatael-heuristic-v1__starter-matrix-robust-017__1__seat-a",
  },
  {
    suiteId: ROUND_ONE_GUARD_DEBUG_SUITE_ID,
    matchupId: "starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1",
    seed: "starter-matrix-robust-008",
    mirrorIndex: 0,
    targetSeatId: "seat_b",
    findingId:
      "round-one-overinvestment__legal-heuristic-v1__starter-northern-realms-heuristic-v0-vs-skellige-heuristic-v1__starter-matrix-robust-008__0__seat-b",
  },
];

export const CFP52_ROUND_ONE_GUARD_DEBUG_FIXTURES = ROUND_ONE_GUARD_DEBUG_FIXTURES;

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

const sortJsonValue = (value: unknown): JsonValue => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortJsonValue(nested)]),
    );
  }
  return null;
};

const stablePrettyJson = (value: unknown) => `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;

const statusCounts = (cases: readonly RoundOneGuardDebugCase[]) => {
  const counts: Record<RoundOneGuardDebugCase["status"], number> = {
    completed: 0,
    not_found: 0,
    policy_failed: 0,
    engine_error: 0,
    replay_failed: 0,
  };
  cases.forEach((debugCase) => {
    counts[debugCase.status] += 1;
  });
  return counts;
};

const emptySummary = (): RoundOneGuardDebugCase["summary"] => ({
  traceDecisionCount: 0,
  playCardTraceCount: 0,
  baseGeometryCount: 0,
  recommendedPlayContradictionCount: 0,
  suppressedPassCount: 0,
  firstBaseGeometryDecisionIndex: null,
  firstRecommendedPlayContradictionDecisionIndex: null,
});

const normalizeSafeSelectedTargetLabel = (value: string | undefined): string | null => {
  if (!value) return null;
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();
  if (normalized === "weather" || normalized === "none") return normalized;
  const sideRow = /^(own|opponent) (close|ranged|siege)( combat)?( row)?$/.exec(normalized);
  if (sideRow) return `${sideRow[1]} ${sideRow[2]}`;
  const bareRow = /^(close|ranged|siege)( combat)?( row)?$/.exec(normalized);
  if (bareRow) return bareRow[1];
  return null;
};

const buildMirroredFixtureSuite = (
  suite: BenchmarkSuite,
  matchup: BenchmarkMatchupDefinition,
  fixture: RoundOneGuardDebugFixture,
): BenchmarkSuite => {
  const seats =
    fixture.mirrorIndex === 0
      ? matchup.seats
      : {
          seat_a: matchup.seats.seat_b,
          seat_b: matchup.seats.seat_a,
        };

  return {
    ...suite,
    seeds: [fixture.seed],
    matchups: [
      {
        ...matchup,
        mirror: false,
        seats,
      },
    ],
  };
};

const targetRecordStatus = (record: BenchmarkMatchRecord | undefined): RoundOneGuardDebugCase["status"] => {
  if (!record) return "not_found";
  if (record.status === "policy_failed") return "policy_failed";
  if (record.status !== "completed") return "engine_error";
  if (record.replayStatus === "failed") return "replay_failed";
  return "completed";
};

const buildDecisionRows = (
  result: ReturnType<typeof runBenchmarkSuite>["unsafeDebugResults"] extends readonly (infer Result)[] | undefined
    ? Result | undefined
    : never,
  fixture: RoundOneGuardDebugFixture,
): readonly RoundOneGuardDebugDecisionRow[] => {
  const traces =
    result?.decisionTraces?.filter(
      (trace) =>
        trace.policyId === "legal-heuristic-v1" &&
        trace.seatId === fixture.targetSeatId &&
        trace.phase === "playing" &&
        trace.round === 1 &&
        trace.roundInvestmentAnalysis,
    ) ?? [];

  return traces.map((trace) => {
    const analysis = trace.roundInvestmentAnalysis;
    if (!analysis) {
      throw new Error("Filtered round-one guard trace unexpectedly lacked roundInvestmentAnalysis.");
    }

    const isPlayCardTrace = trace.selected?.kind === "play_card";
    const boardFloorReached =
      isPlayCardTrace && analysis.roundOneBoardAfterSelectedMove >= ROUND_ONE_OVERINVESTMENT_BOARD_AFTER_FLOOR;
    const handCapReached =
      isPlayCardTrace && analysis.estimatedHandCountAfterSelectedMove <= ROUND_ONE_OVERINVESTMENT_HAND_AFTER_CAP;
    const baseGeometryReached = boardFloorReached && handCapReached;
    const isRecommendedPlayContradiction =
      isPlayCardTrace && baseGeometryReached && analysis.roundOneOverinvestmentRecommended;

    return {
      decisionIndex: trace.decisionIndex,
      selectedKind: trace.selected?.kind ?? null,
      selectedTargetKind: trace.selected?.targetKind ?? null,
      selectedTargetLabel: normalizeSafeSelectedTargetLabel(trace.selected?.targetLabel),
      scoreDelta: analysis.scoreDelta,
      ownHandCount: trace.publicState.ownHandCount,
      opponentHandCount: trace.publicState.opponentHandCount,
      ownBoardCardCount: analysis.ownBoardCardCount,
      roundOneBoardAfterSelectedMove: analysis.roundOneBoardAfterSelectedMove,
      currentRoundHandCount: analysis.currentRoundHandCount,
      estimatedHandCountAfterSelectedMove: analysis.estimatedHandCountAfterSelectedMove,
      selectedMoveSpendsHandCard: analysis.selectedMoveSpendsHandCard,
      selectedMoveIsCardAdvantage: analysis.selectedMoveIsCardAdvantage,
      selectedMoveWouldLeaveNoPositiveUnitMove: analysis.selectedMoveWouldLeaveNoPositiveUnitMove,
      selectedMoveWouldLeaveNoUnitTempoCard: analysis.selectedMoveWouldLeaveNoUnitTempoCard,
      catchUpStatus: analysis.catchUpStatus,
      recommendation: analysis.recommendation,
      roundOneOverinvestmentRecommended: analysis.roundOneOverinvestmentRecommended,
      roundOneOverinvestmentReason: analysis.roundOneOverinvestmentReason,
      roundResourcePressure: analysis.roundResourcePressure,
      resourceExhaustionRecommended: analysis.resourceExhaustionRecommended,
      resourceExhaustionReason: analysis.resourceExhaustionReason,
      stopLossRecommended: analysis.stopLossRecommended,
      stopLossReason: analysis.stopLossReason,
      isPlayCardTrace,
      boardFloorReached,
      handCapReached,
      baseGeometryReached,
      isRecommendedPlayContradiction,
      isSuppressedPass: trace.selected?.kind === "pass" && analysis.roundOneOverinvestmentRecommended,
    };
  });
};

const summarizeDecisionRows = (
  decisionRows: readonly RoundOneGuardDebugDecisionRow[],
): RoundOneGuardDebugCase["summary"] => {
  const firstBaseGeometryDecisionIndex =
    decisionRows.find((row) => row.baseGeometryReached)?.decisionIndex ?? null;
  const firstRecommendedPlayContradictionDecisionIndex =
    decisionRows.find((row) => row.isRecommendedPlayContradiction)?.decisionIndex ?? null;

  return {
    traceDecisionCount: decisionRows.length,
    playCardTraceCount: decisionRows.filter((row) => row.isPlayCardTrace).length,
    baseGeometryCount: decisionRows.filter((row) => row.baseGeometryReached).length,
    recommendedPlayContradictionCount: decisionRows.filter((row) => row.isRecommendedPlayContradiction).length,
    suppressedPassCount: decisionRows.filter((row) => row.isSuppressedPass).length,
    firstBaseGeometryDecisionIndex,
    firstRecommendedPlayContradictionDecisionIndex,
  };
};

const verdictForCase = (
  status: RoundOneGuardDebugCase["status"],
  summary: RoundOneGuardDebugCase["summary"],
): RoundOneGuardDebugCase["verdict"] => {
  if (status !== "completed") return "fixture_failed";
  if (summary.traceDecisionCount === 0) return "missing_trace_data";
  if (summary.recommendedPlayContradictionCount > 0) return "confirmed_policy_contradiction";
  if (summary.suppressedPassCount > 0) return "suppressed_pass_after_overinvestment";
  return "aggregate_only_no_selected_play_contradiction";
};

const notFoundCase = (fixture: RoundOneGuardDebugFixture): RoundOneGuardDebugCase => ({
  fixture,
  status: "not_found",
  matchOutcome: "none",
  targetPolicyId: null,
  targetFaction: null,
  targetDeckPresetId: null,
  decisionRows: [],
  summary: emptySummary(),
  verdict: "fixture_failed",
});

const runFixture = (fixture: RoundOneGuardDebugFixture): RoundOneGuardDebugCase => {
  const suite = getBenchmarkSuite(fixture.suiteId);
  const matchup = suite?.matchups.find((candidate) => candidate.matchupId === fixture.matchupId);
  const seedExists = suite?.seeds.includes(fixture.seed) ?? false;
  if (!suite || !matchup || !seedExists) {
    return notFoundCase(fixture);
  }

  const result = runBenchmarkSuite({
    suite: buildMirroredFixtureSuite(suite, matchup, fixture),
    benchmarkRunId: `${fixture.suiteId}:cFp53-round-one-guard-debug`,
    includeDecisionTraces: true,
    includeDebugResults: true,
  });
  const record = result.records[0];
  const debugResult = result.unsafeDebugResults?.[0];
  const status = targetRecordStatus(record);
  const targetSeat = record?.seats[fixture.targetSeatId];
  const decisionRows = status === "completed" ? buildDecisionRows(debugResult, fixture) : [];
  const summary = summarizeDecisionRows(decisionRows);

  return {
    fixture,
    status,
    matchOutcome: record?.resultBySeat[fixture.targetSeatId] ?? "none",
    targetPolicyId: targetSeat?.policyId ?? null,
    targetFaction: targetSeat?.faction ?? null,
    targetDeckPresetId: targetSeat?.deckPresetId ?? null,
    decisionRows,
    summary,
    verdict: verdictForCase(status, summary),
  };
};

export const runRoundOneGuardDebugCases = (): RoundOneGuardDebugResult => ({
  schemaVersion: ROUND_ONE_GUARD_DEBUG_SCHEMA_VERSION,
  cases: ROUND_ONE_GUARD_DEBUG_FIXTURES.map(runFixture),
});

const caseSummaries = (cases: readonly RoundOneGuardDebugCase[]) =>
  cases.map((debugCase) => ({
    findingId: debugCase.fixture.findingId,
    status: debugCase.status,
    matchOutcome: debugCase.matchOutcome,
    targetPolicyId: debugCase.targetPolicyId,
    targetFaction: debugCase.targetFaction,
    targetDeckPresetId: debugCase.targetDeckPresetId,
    summary: debugCase.summary,
    verdict: debugCase.verdict,
  }));

const boolText = (value: boolean) => (value ? "yes" : "no");

const decisionRowsTable = (debugCase: RoundOneGuardDebugCase) => {
  if (debugCase.decisionRows.length === 0) return "No decision rows reproduced.\n";

  const header =
    "| Decision | Selected | Target | Score delta | Board after | Hand after | Recommendation | Guard rec | Reason | Base geometry | Contradiction | Suppressed pass |\n" +
    "|---:|---|---|---:|---:|---:|---|---|---|---|---|---|\n";
  const rows = debugCase.decisionRows
    .map((row) =>
      [
        row.decisionIndex,
        row.selectedKind ?? "none",
        row.selectedTargetLabel ?? row.selectedTargetKind ?? "none",
        row.scoreDelta,
        row.roundOneBoardAfterSelectedMove,
        row.estimatedHandCountAfterSelectedMove,
        row.recommendation,
        boolText(row.roundOneOverinvestmentRecommended),
        row.roundOneOverinvestmentReason,
        boolText(row.baseGeometryReached),
        boolText(row.isRecommendedPlayContradiction),
        boolText(row.isSuppressedPass),
      ].join(" | "),
    )
    .map((row) => `| ${row} |`)
    .join("\n");

  return `${header}${rows}\n`;
};

const postRepairAssessmentForCases = (cases: readonly RoundOneGuardDebugCase[]) => {
  const confirmedCount = cases.filter((debugCase) => debugCase.verdict === "confirmed_policy_contradiction").length;
  if (confirmedCount === 0 && cases.length > 0 && cases.every((debugCase) => debugCase.status === "completed")) {
    return "cFp53 post-repair artifacts show zero selected-play contradictions for the two cFp52 fixtures. Any active round-one guard intervention is represented as a selected pass/suppressed-pass diagnostic instead of an overinvesting selected play.";
  }
  if (confirmedCount > 0) {
    return "cFp53 repair is incomplete: at least one selected-play contradiction remains for the cFp52 fixture set. Do not broaden thresholds or add cumulative-spend tuning to mask this selected-play path.";
  }
  return "cFp53 debug reproduction did not complete for every fixture. Inspect fixture status before interpreting post-repair behavior.";
};

const buildMarkdownReport = (result: RoundOneGuardDebugResult) => {
  const lines: string[] = [
    "# cFp53 Round-One Guard Fixture Debug",
    "",
    "## Summary",
    "",
    `Schema version: \`${result.schemaVersion}\``,
    "",
    "| Fixture | Status | Verdict | Target policy | Target faction | Outcome | Play-card rows | Contradictions | Suppressed passes |",
    "|---|---|---|---|---|---|---:|---:|---:|",
    ...result.cases.map((debugCase, index) =>
      [
        `Fixture ${index === 0 ? "A" : "B"}`,
        debugCase.status,
        debugCase.verdict,
        debugCase.targetPolicyId ?? "none",
        debugCase.targetFaction ?? "none",
        debugCase.matchOutcome,
        debugCase.summary.playCardTraceCount,
        debugCase.summary.recommendedPlayContradictionCount,
        debugCase.summary.suppressedPassCount,
      ].join(" | "),
    ).map((row) => `| ${row} |`),
    "",
    "## Per-Fixture Decision Rows",
    "",
  ];

  result.cases.forEach((debugCase, index) => {
    lines.push(
      `### Fixture ${index === 0 ? "A" : "B"}`,
      "",
      `Finding: \`${debugCase.fixture.findingId}\``,
      "",
      `Verdict: \`${debugCase.verdict}\``,
      "",
      decisionRowsTable(debugCase).trimEnd(),
      "",
    );
  });

  lines.push(
    "## Post-Repair Assessment",
    "",
    postRepairAssessmentForCases(result.cases),
    "",
    "## Hidden-Info Boundary",
    "",
    HIDDEN_INFO_SAFETY_NOTE,
  );

  return `${lines.join("\n")}\n`;
};

export const serializeRoundOneGuardDebugArtifacts = (
  result: RoundOneGuardDebugResult,
): SerializedRoundOneGuardDebugArtifacts => {
  const manifest = {
    schemaVersion: ROUND_ONE_GUARD_DEBUG_SCHEMA_VERSION,
    generatedPhase: ROUND_ONE_GUARD_DEBUG_PHASE,
    sourceSuiteId: ROUND_ONE_GUARD_DEBUG_SUITE_ID,
    fixtureCount: ROUND_ONE_GUARD_DEBUG_FIXTURES.length,
    caseCount: result.cases.length,
    statusCounts: statusCounts(result.cases),
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
    files: roundOneGuardDebugArtifactFiles,
  };
  const cases = {
    schemaVersion: ROUND_ONE_GUARD_DEBUG_SCHEMA_VERSION,
    fixtures: ROUND_ONE_GUARD_DEBUG_FIXTURES,
    caseSummaries: caseSummaries(result.cases),
    cases: result.cases,
  };

  return {
    manifestJson: stablePrettyJson(manifest),
    casesJson: stablePrettyJson(cases),
    reportMarkdown: buildMarkdownReport(result),
  };
};

export const combinedRoundOneGuardDebugArtifactText = (
  artifacts: SerializedRoundOneGuardDebugArtifacts,
) => [artifacts.manifestJson, artifacts.casesJson, artifacts.reportMarkdown].join("\n");

const hiddenInfoHazards: readonly { label: string; pattern: RegExp }[] = [
  { label: "raw cards map", pattern: /\bcardsById\b/ },
  { label: "raw terminal state", pattern: /\bfinalState\b/ },
  { label: "raw command log", pattern: /\bcommandLog\b/ },
  { label: "unsafe debug results", pattern: /\bunsafeDebugResults\b/ },
  { label: "AI own private-zone payload", pattern: /\bownHand\b/ },
  { label: "opponent private-zone payload", pattern: /\bopponentHand\b/ },
  { label: "raw private-zone key", pattern: /"hand"\s*:/ },
  { label: "raw draw-zone key", pattern: /"deck"\s*:/ },
  { label: "raw discard-zone key", pattern: /"discard"\s*:/ },
  { label: "runtime seat instance id", pattern: /\bseat_[ab]:[A-Za-z0-9_.:-]+/ },
  { label: "raw source id key", pattern: /\bsourceIds?\b/ },
  { label: "raw card id key", pattern: /\bcardIds?\b/ },
  { label: "raw instance id key", pattern: /\binstanceId\b/ },
  { label: "raw action ref key", pattern: /\bactionRef\b/ },
  {
    label: "card source namespace",
    pattern: /\b(?:neutral|northern-realms|nilfgaard|monsters|scoiatael|skellige)\.[A-Za-z0-9_.-]+\b/,
  },
  { label: "raw card name Yennefer", pattern: /\bYennefer\b/ },
  { label: "raw card name Geralt", pattern: /\bGeralt\b/ },
  { label: "raw card name Gaunter", pattern: /\bGaunter\b/ },
  { label: "raw card name O'Dimm", pattern: /O['’]Dimm/ },
  { label: "raw card name Draug", pattern: /\bDraug\b/ },
];

export const scanRoundOneGuardDebugArtifactsForHiddenInfo = (
  artifacts: SerializedRoundOneGuardDebugArtifacts,
) => {
  const combined = combinedRoundOneGuardDebugArtifactText(artifacts);
  return hiddenInfoHazards
    .filter(({ pattern }) => pattern.test(combined))
    .map(({ label }) => label);
};

export const writeRoundOneGuardDebugArtifacts = async ({
  outDir,
  artifacts,
}: {
  readonly outDir: string;
  readonly artifacts: SerializedRoundOneGuardDebugArtifacts;
}) => {
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(resolve(outDir, "manifest.json"), artifacts.manifestJson, "utf8"),
    writeFile(resolve(outDir, "cases.json"), artifacts.casesJson, "utf8"),
    writeFile(resolve(outDir, "report.md"), artifacts.reportMarkdown, "utf8"),
  ]);
  return {
    outDir,
    files: [...roundOneGuardDebugArtifactFiles],
  };
};
