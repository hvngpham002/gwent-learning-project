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

// Internal command record shape matching EngineCommandRecord without importing it.
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

const HIDDEN_INFO_TOKENS = [
  "cardsById",
  "finalState",
  "commandLog",
  '"hand"',
  '"deck"',
  "ownHand",
  "opponentHand",
  "seat_a:",
  "seat_b:",
  "unsafeDebugResults",
];

const RAW_INSTANCE_PATTERN = /seat_[ab]:/;

// ---------------------------------------------------------------------------
// Hidden-info scanner
// ---------------------------------------------------------------------------

/**
 * Scans a serialised diagnostic export for hidden-info hazards.
 *
 * Scans structured keys (top-level and nested object keys) and string values
 * for raw instance/id patterns. The token list is designed to avoid false
 * positives on legitimate user-facing labels that happen to contain words
 * like "deck" or "hand" in contexts like "deckCount", "handCount",
 * "deck_preset_id", or "human_hand".
 *
 * This reuses the same hazard vocabulary as the benchmark artifact scanner
 * in `src/game/benchmark/artifacts.ts` and the simulation export validator
 * in `src/game/sim/exportValidation.ts` to keep the project consistent.
 */
export const scanForHiddenInfoHazards = (
  value: unknown,
  path = "$",
): string[] => {
  const issues: string[] = [];

  if (typeof value === "string") {
    // Check for raw instance id patterns in string values.
    for (const token of HIDDEN_INFO_TOKENS) {
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

  // Object: scan keys and nested values.
  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, nested] of entries) {
    const nestedPath = path === "$" ? key : `${path}.${key}`;

    // Check structured keys against forbidden set.
    if (HIDDEN_INFO_TOKENS.some((token) => key === token)) {
      issues.push(`forbidden key "${key}" at "${nestedPath}"`);
    }

    // Recurse into nested values.
    issues.push(...scanForHiddenInfoHazards(nested, nestedPath));
  }

  return issues;
};

// ---------------------------------------------------------------------------
// Build command/event summaries (hidden-info safe)
// ---------------------------------------------------------------------------

export const buildCommandEventSummaries = (
  commandHistory: readonly InternalCommandRecord[],
  eventLog: readonly GameEvent[],
): DiagnosticCommandEventSummary[] => {
  return commandHistory.map((record) => {
    const eventsForCommand = eventLog.slice(
      record.sequence > 1
        ? commandHistory[record.sequence - 2]?.eventCount ?? 0
        : 0,
      record.eventCount,
    );
    return {
      sequence: record.sequence,
      commandType: record.command.type,
      seatId: "seatId" in record.command ? String(record.command.seatId) : "system",
      eventTypes: eventsForCommand.map((e) => e.type),
      status: record.status,
      error: record.error?.message,
    };
  });
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

  const warnings = [
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

  // Run hidden-info scan on the export JSON string.
  const exportJson = JSON.stringify(input.decisionTraces);
  const scanIssues = scanForHiddenInfoHazards(exportJson);

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
      passed: scanIssues.length === 0,
      issues: scanIssues,
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
