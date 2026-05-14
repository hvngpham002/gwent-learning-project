import type { AiDecisionTrace, ProductAiPolicyId } from "@/game/ai";
import type { GameEvent } from "@/game/core";

// ---------------------------------------------------------------------------
// Schema version
// ---------------------------------------------------------------------------

export const PRODUCT_DIAGNOSTICS_SCHEMA_VERSION = "gwent-product-playtest-diagnostics-v1";

// ---------------------------------------------------------------------------
// Export shape
// ---------------------------------------------------------------------------

export interface ProductDiagnosticExport {
  readonly schemaVersion: typeof PRODUCT_DIAGNOSTICS_SCHEMA_VERSION;
  readonly generatedAt: string;
  readonly route: string;
  readonly matchSeed: string | number | null;
  readonly humanDeckPresetId: string | null;
  readonly humanDeckPresetName: string | null;
  readonly humanDeckFaction: string | null;
  readonly aiDeckPresetId: string | null;
  readonly aiDeckPresetName: string | null;
  readonly aiDeckFaction: string | null;
  readonly aiPolicyId: string;
  readonly currentPhase: string;
  readonly currentRound: number;
  readonly matchResult: string | null;
  readonly commandEventSummaries: readonly DiagnosticCommandEventSummary[];
  readonly decisionTraces: readonly AiDecisionTrace[];
  readonly hiddenInfoSafetyScan: HiddenInfoSafetyScanResult;
  readonly warnings: readonly string[];
}

export interface DiagnosticCommandEventSummary {
  readonly sequence: number;
  readonly commandType: string;
  readonly seatId: string;
  readonly eventTypes: string[];
  readonly status: string;
  readonly error?: string;
}

// Internal command record shape matching EngineCommandRecord
interface InternalCommandRecord {
  readonly sequence: number;
  readonly command: { type: string; seatId?: string };
  readonly status: string;
  readonly eventCount: number;
  readonly error?: { message?: string };
}

export interface HiddenInfoSafetyScanResult {
  readonly passed: boolean;
  readonly issues: readonly string[];
}

// ---------------------------------------------------------------------------
// Hidden-info hazard tokens
// ---------------------------------------------------------------------------

// Global forbidden keys — any object containing these keys is a hazard.
const GLOBAL_FORBIDDEN_KEYS = new Set([
  "cardsById",
  "finalState",
  "commandLog",
  "ownHand",
  "opponentHand",
  "unsafeDebugResults",
  // cFp27 repair: explicit cFp27 mulligan leak keys
  "cardIds",
  "linkedSourceIds",
]);

// Global forbidden string tokens — caught anywhere in string values.
const GLOBAL_FORBIDDEN_STRING_TOKENS = [
  '"hand"',
  '"deck"',
  "seat_a:",
  "seat_b:",
  // cFp27 repair: raw mulligan move IDs (catches "mulligan:seat_b:..." and
  // "mulligan:test" etc. even without seat_a:/seat_b:)
  "mulligan:",
];

// Mulligan-trace-specific forbidden tokens — applied only under traces where
// phase === "mulligan" or mulliganAnalysis is present.
const MULLIGAN_TRACE_FORBIDDEN_STRING_TOKENS = [
  "Roach",
  "neutral.roach",
];

const RAW_INSTANCE_PATTERN = /seat_[ab]:/;

// Medic-timing-specific forbidden string tokens — applied ONLY inside medicTimingAnalysis.
// These catch raw card names, source IDs, and ability array representations that
// the global scan doesn't target (public card names like "Roach" pass globally).
// medicTimingAnalysis only contains safe lowercase bucket strings: none, weak, medium, strong.
const MEDIC_TIMING_FORBIDDEN_STRING_TOKENS = [
  // One-word proper name (e.g., "Draug", "Leshen") — any capitalized word not a safe bucket.
  /^[A-Z][a-z]+$/,
  // Multi-word proper names (e.g., "Yennefer of Vengerberg")
  /^[A-Z][a-z]+(?:\s+[a-z]+)?\s+[A-Z][A-Za-z]+$/,
  // Source ID pattern: namespace.name with hyphens (e.g., "northern-realms.philippa-eilhart",
  // "neutral.yennefer-of-vengerberg", "nilfgaard.vattier-de-rideaux")
  /^[a-z][a-z0-9-]*\.[a-z][a-z0-9.-]*$/,
];

/**
 * Checks whether an object looks like a medicTimingAnalysis object
 * (identified by medicPlayLegal boolean field plus medicPlayCandidateCount plus noTargetMedicRisk).
 */
const isMedicTimingAnalysis = (obj: Record<string, unknown>): boolean =>
  typeof obj.medicPlayLegal === "boolean" &&
  typeof obj.medicPlayCandidateCount === "number" &&
  typeof obj.noTargetMedicRisk === "boolean";

/**
 * Checks whether an object looks like a mulligan-phase decision trace
 * (identified by phase === "mulligan" or non-null mulliganAnalysis).
 */
const isMulliganTrace = (obj: Record<string, unknown>): boolean => {
  if (typeof obj.phase === "string" && obj.phase === "mulligan") {
    return true;
  }
  if (obj.mulliganAnalysis != null) {
    return true;
  }
  return false;
};

// ---------------------------------------------------------------------------
// Hidden-info scanner — scans the FULL ProductDiagnosticExport object
// ---------------------------------------------------------------------------

export const scanForHiddenInfoHazards = (
  value: unknown,
  path = "$",
): string[] => {
  const issues: string[] = [];

  if (typeof value === "string") {
    for (const token of GLOBAL_FORBIDDEN_STRING_TOKENS) {
      if (value.includes(token)) {
        issues.push(`string value at "${path}" contains forbidden token "${token}"`);
      }
    }
    if (RAW_INSTANCE_PATTERN.test(value)) {
      issues.push(`raw card instance id pattern "seat_[ab]:" found at "${path}"`);
    }
    return issues;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      issues.push(...scanForHiddenInfoHazards(item, `${path}[${index}]`));
    });
    return issues;
  }

  if (typeof value !== "object" || value === null) {
    return issues;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, nested] of entries) {
    const nestedPath = path === "$" ? key : `${path}.${key}`;

    if (GLOBAL_FORBIDDEN_KEYS.has(key)) {
      issues.push(`forbidden key "${key}" at "${nestedPath}"`);
    }

    issues.push(...scanForHiddenInfoHazards(nested, nestedPath));
  }

  return issues;
};

/**
 * Mulligan-trace-specific scan for hidden hand card identity leaks.
 * Only applies checks within mulligan-phase decision trace objects.
 */
export const scanMulliganTraceForLeaks = (
  value: unknown,
  path = "$",
): string[] => {
  const issues: string[] = [];

  if (typeof value === "string") {
    for (const token of MULLIGAN_TRACE_FORBIDDEN_STRING_TOKENS) {
      if (value.includes(token)) {
        issues.push(`mulligan trace at "${path}" leaks hidden card identity "${token}"`);
      }
    }
    return issues;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      issues.push(...scanMulliganTraceForLeaks(item, `${path}[${index}]`));
    });
    return issues;
  }

  if (typeof value !== "object" || value === null) {
    return issues;
  }

  const obj = value as Record<string, unknown>;
  // If this object is a mulligan trace, apply mulligan-specific checks
  if (isMulliganTrace(obj)) {
    for (const [, v] of Object.entries(obj)) {
      issues.push(...scanMulliganTraceForLeaks(v, path));
    }
    return issues;
  }

  // Only recurse into nested objects to find deeper mulligan traces.
  // Non-mulligan values are scanned normally (not applying mulligan-specific tokens).
  for (const [, nested] of Object.entries(obj)) {
    if (typeof nested === "object" && nested !== null) {
      issues.push(...scanMulliganTraceForLeaks(nested, path));
    }
  }

  return issues;
};

// ---------------------------------------------------------------------------
// Medic-timing-specific scan (cFp29)
// ---------------------------------------------------------------------------

/**
 * Medic-timing-specific scan for hidden-info leaks under medicTimingAnalysis.
 * Only applies medic-timing-specific rules INSIDE medicTimingAnalysis objects.
 * Outside medicTimingAnalysis, only recurses to find medicTimingAnalysis blocks.
 */
export const scanMedicTimingAnalysis = (
  value: unknown,
  path = "$",
  insideMedicTiming = false,
): string[] => {
  const issues: string[] = [];

  if (typeof value === "string") {
    // Only apply medic-timing-specific checks when INSIDE a medicTimingAnalysis block.
    if (insideMedicTiming) {
      for (const token of MEDIC_TIMING_FORBIDDEN_STRING_TOKENS) {
        if (token instanceof RegExp && token.test(value)) {
          issues.push(`medicTimingAnalysis at "${path}" contains raw card name or source ID "${value}"`);
          break;
        }
      }
    }
    return issues;
  }

  if (Array.isArray(value)) {
    // medicTimingAnalysis only contains booleans, numbers, and bucket strings.
    // Any array value inside medicTimingAnalysis is suspicious (e.g., ability arrays).
    if (insideMedicTiming) {
      issues.push(`unexpected array at "${path}" in medicTimingAnalysis — possible raw ability list`);
    }
    value.forEach((item, index) => {
      issues.push(...scanMedicTimingAnalysis(item, `${path}[${index}]`, insideMedicTiming));
    });
    return issues;
  }

  if (typeof value !== "object" || value === null) {
    return issues;
  }

  const obj = value as Record<string, unknown>;

  // If this is a medicTimingAnalysis object, recurse with medic-timing checks enabled.
  if (isMedicTimingAnalysis(obj)) {
    for (const [, v] of Object.entries(obj)) {
      issues.push(...scanMedicTimingAnalysis(v, path, true));
    }
    return issues;
  }

  // Recurse to find nested medicTimingAnalysis objects.
  for (const [, nested] of Object.entries(obj)) {
    if (typeof nested === "object" && nested !== null) {
      issues.push(...scanMedicTimingAnalysis(nested, path, false));
    }
  }

  return issues;
};

// ---------------------------------------------------------------------------
// Build command/event summaries (hidden-info safe, running offset)
// ---------------------------------------------------------------------------

/**
 * Builds command/event summaries using a running event offset (matching the
 * battle-log pattern). Each entry tracks cumulative event count so slices
 * are contiguous and correct.
 */
export const buildCommandEventSummaries = (
  commandHistory: readonly InternalCommandRecord[],
  eventLog: readonly GameEvent[],
): DiagnosticCommandEventSummary[] => {
  const summaries: DiagnosticCommandEventSummary[] = [];
  let cumulativeEventCount = 0;

  for (const record of commandHistory) {
    const eventsForCommand = eventLog.slice(
      cumulativeEventCount,
      cumulativeEventCount + record.eventCount,
    );
    summaries.push({
      sequence: record.sequence,
      commandType: record.command.type,
      seatId: "seatId" in record.command ? String(record.command.seatId) : "system",
      eventTypes: eventsForCommand.map((e) => e.type),
      status: record.status,
      error: record.error?.message,
    });
    cumulativeEventCount += record.eventCount;
  }

  return summaries;
};

// ---------------------------------------------------------------------------
// Build full diagnostic export
// ---------------------------------------------------------------------------

export interface BuildProductDiagnosticsInput {
  readonly aiPolicyId: ProductAiPolicyId | string;
  readonly matchSeed: string | number | null;
  readonly humanDeckPresetId: string | null;
  readonly humanDeckPresetName: string | null;
  readonly humanDeckFaction: string | null;
  readonly aiDeckPresetId: string | null;
  readonly aiDeckPresetName: string | null;
  readonly aiDeckFaction: string | null;
  readonly currentPhase: string;
  readonly currentRound: number;
  readonly matchResult: string | null;
  readonly commandHistory: readonly InternalCommandRecord[];
  readonly eventLog: readonly GameEvent[];
  readonly decisionTraces: readonly AiDecisionTrace[];
  readonly warnings: readonly string[];
  readonly route?: string;
}

export const buildProductDiagnosticExport = (
  input: BuildProductDiagnosticsInput,
): ProductDiagnosticExport => {
  const generatedAt = new Date().toISOString();
  const route = input.route ?? "/";

  const commandEventSummaries = buildCommandEventSummaries(
    input.commandHistory,
    input.eventLog,
  );

  // Collect redaction warnings from traces
  const warnings: string[] = [
    ...input.warnings,
    ...input.decisionTraces.flatMap((trace) => {
      const redactedCount = trace.candidates.filter(
        (c) => c.cardLabel === "hidden hand play",
      ).length;
      return redactedCount > 0
        ? [`${redactedCount} candidate card label(s) redacted for hidden-info safety in trace ${trace.decisionIndex}`]
        : [];
    }),
  ];

  // CRITICAL: Scan the FULL export object for hidden-info hazards, not just
  // decisionTraces. We stringify the entire object and scan all keys/values.
  const fullExportObj: Record<string, unknown> = {
    schemaVersion: PRODUCT_DIAGNOSTICS_SCHEMA_VERSION,
    generatedAt,
    route,
    matchSeed: input.matchSeed,
    humanDeckPresetId: input.humanDeckPresetId,
    humanDeckPresetName: input.humanDeckPresetName,
    humanDeckFaction: input.humanDeckFaction,
    aiDeckPresetId: input.aiDeckPresetId,
    aiDeckPresetName: input.aiDeckPresetName,
    aiDeckFaction: input.aiDeckFaction,
    aiPolicyId: input.aiPolicyId,
    currentPhase: input.currentPhase,
    currentRound: input.currentRound,
    matchResult: input.matchResult,
    commandEventSummaries,
    decisionTraces: input.decisionTraces,
    warnings,
  };
  const scanIssues = scanForHiddenInfoHazards(fullExportObj);
  // cFp27 repair: additional mulligan-trace-specific scan for hidden card
  // identity leaks (e.g. "Roach", "neutral.roach" in mulligan trace fields).
  const mulliganScanIssues = scanMulliganTraceForLeaks(fullExportObj);
  // cFp29 repair: additional medic-timing-specific scan for raw card names,
  // source IDs, and ability arrays in medicTimingAnalysis aggregates.
  const medicTimingScanIssues = scanMedicTimingAnalysis(fullExportObj);
  const allIssues = [...scanIssues, ...mulliganScanIssues, ...medicTimingScanIssues];

  return {
    schemaVersion: PRODUCT_DIAGNOSTICS_SCHEMA_VERSION,
    generatedAt,
    route,
    matchSeed: input.matchSeed,
    humanDeckPresetId: input.humanDeckPresetId,
    humanDeckPresetName: input.humanDeckPresetName,
    humanDeckFaction: input.humanDeckFaction,
    aiDeckPresetId: input.aiDeckPresetId,
    aiDeckPresetName: input.aiDeckPresetName,
    aiDeckFaction: input.aiDeckFaction,
    aiPolicyId: input.aiPolicyId,
    currentPhase: input.currentPhase,
    currentRound: input.currentRound,
    matchResult: input.matchResult,
    commandEventSummaries,
    decisionTraces: input.decisionTraces,
    hiddenInfoSafetyScan: {
      passed: allIssues.length === 0,
      issues: allIssues,
    },
    warnings: [...new Set(warnings)],
  };
};

// ---------------------------------------------------------------------------
// Copy helper
// ---------------------------------------------------------------------------

export const copyDiagnosticExport = async (exportData: ProductDiagnosticExport): Promise<boolean> => {
  try {
    const json = JSON.stringify(exportData, null, 2);
    await navigator.clipboard.writeText(json);
    return true;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// Download helper
// ---------------------------------------------------------------------------

export const downloadDiagnosticExport = (exportData: ProductDiagnosticExport): void => {
  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gwent-diagnostics-${exportData.matchSeed ?? "export"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
