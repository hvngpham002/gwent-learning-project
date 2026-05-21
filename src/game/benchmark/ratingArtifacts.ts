import { createHash } from "node:crypto";

import type {
  BenchmarkRatingEntry,
  BenchmarkRatingOutput,
} from "./ratings";

// ─── Artifact schema ─────────────────────────────────────────────────────────

export type RatingArtifactSchemaVersion = "benchmark-rating-artifact-v1";

export interface RatingArtifactManifest {
  schemaVersion: RatingArtifactSchemaVersion;
  ratingSchemaVersion: string;
  suiteId: string;
  sourceRecordsPath: string;
  sourceRecordCount: number;
  eligibleRecordCount: number;
  ignoredRecordCount: number;
  generatedFrom: string;
  ratingsJsonHash: string;
  reportMdHash: string;
  hiddenInfoSafetyNote: string;
}

export interface RatingArtifactBundle {
  manifestJson: string;
  ratingsJson: string;
  reportMarkdown: string;
}

// ─── Hidden-info safety ──────────────────────────────────────────────────────

const HIDDEN_INFO_HAZARDS = [
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

const HIDDEN_INFO_SAFETY_NOTE =
  "Rating artifacts contain only public benchmark match records processed through a Glicko-1 rating layer. They do not include raw engine state, command logs, event logs, hand arrays, deck order, observations, or runtime card instance IDs.";

function scanHiddenInfoSafety(value: string): string[] {
  return HIDDEN_INFO_HAZARDS.filter((hazard) => value.includes(hazard));
}

// ─── JSON serialization ──────────────────────────────────────────────────────

const sortJsonValue = (value: unknown): unknown => {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, sortJsonValue(v)]),
    );
  }
  return null;
};

const stablePrettyJson = (value: unknown): string => `${JSON.stringify(sortJsonValue(value), null, 2)}\n`;

const buildRatingsJson = (output: BenchmarkRatingOutput): string => {
  const warnings: string[] = [];
  for (const scope of output.scopes) {
    for (const entry of scope.entries) {
      if (entry.games < 5) {
        warnings.push(
          `Small sample warning for ${entry.key} (${entry.games} games): RD of ${entry.rd} may be unreliable.`
        );
      }
    }
  }

  const topEntriesByScope = output.scopes.map((scope) => {
    const top = scope.entries.slice(0, 5);
    return { scope: scope.scope, topEntries: top };
  });

  return stablePrettyJson({
    schemaVersion: "benchmark-rating-v1",
    ratingSchemaVersion: output.ratingSchemaVersion,
    suiteId: output.suiteId,
    sourceRecordsPath: output.sourceRecordsPath,
    config: {
      defaultRating: output.config.defaultRating,
      defaultRd: output.config.defaultRd,
      rdFloor: output.config.rdFloor,
      intervalMultiplier: 1.96,
      conservativeMultiplier: 2,
    },
    summary: output.summary,
    topEntriesByScope,
    scopes: output.scopes,
    warnings,
  });
};

// ─── Markdown report ─────────────────────────────────────────────────────────

const formatEntry = (entry: BenchmarkRatingEntry): string =>
  [
    `- **${entry.label}**`,
    `  - Rating: ${entry.rating.toFixed(2)} ± ${entry.rd.toFixed(2)} RD`,
    `  - 95% CI: [${entry.interval95Low.toFixed(2)}, ${entry.interval95High.toFixed(2)}]`,
    `  - Conservative: ${entry.conservativeRating.toFixed(2)}`,
    `  - Record: ${entry.wins}W / ${entry.losses}L / ${entry.draws}D (${entry.games} games)`,
  ].join("\n");

const scopeWarning = (entry: BenchmarkRatingEntry): string => {
  if (entry.games < 10) {
    return `  ⚠ Small sample (${entry.games} games). Interpret RD and intervals cautiously.`;
  }
  if (entry.rd > 150) {
    return `  ⚠ High RD (${entry.rd.toFixed(2)}). Estimate is uncertain.`;
  }
  return "";
};

function buildReportMarkdown(output: BenchmarkRatingOutput): string {
  const lines: string[] = [];

  lines.push("# Glicko Rating Report");
  lines.push("");
  lines.push("## Source");
  lines.push("");
  lines.push(`- suite id: ${output.suiteId}`);
  lines.push(`- source records path: ${output.sourceRecordsPath}`);
  lines.push(`- total records: ${output.summary.totalRecords}`);
  lines.push(`- eligible records: ${output.summary.eligibleRecords}`);
  lines.push(`- ignored records: ${output.summary.ignoredRecords}`);

  if (Object.keys(output.summary.ignoredReasons).length > 0) {
    lines.push("");
    lines.push("### Ignored Record Reasons");
    lines.push("");
    for (const [reason, count] of Object.entries(output.summary.ignoredReasons).sort()) {
      lines.push(`- ${reason}: ${count}`);
    }
  }

  lines.push("");
  lines.push("## Glicko Configuration");
  lines.push("");
  lines.push(`- default rating: ${output.config.defaultRating}`);
  lines.push(`- default RD: ${output.config.defaultRd}`);
  lines.push(`- RD floor: ${output.config.rdFloor}`);
  lines.push(`- q: ${output.config.q.toFixed(6)}`);

  // Required scopes first
  const scopeLabels: Record<string, string> = {
    policy: "Policy",
    policy_deck: "Policy / Deck",
    policy_faction: "Policy / Faction",
    policy_matchup: "Policy / Matchup",
  };

  for (const scope of output.scopes) {
    lines.push("");
    lines.push(`## ${scopeLabels[scope.scope] || scope.scope} Ratings`);
    lines.push("");
    lines.push(`Scope: \`${scope.scope}\``);

    if (scope.entries.length === 0) {
      lines.push("");
      lines.push("- No rated entities (all entities had zero eligible games).");
      continue;
    }

    lines.push("");
    for (const entry of scope.entries) {
      lines.push(formatEntry(entry));
      const warn = scopeWarning(entry);
      if (warn) lines.push(warn);
      lines.push("");
    }
  }

  // Interpretation warnings
  lines.push("");
  lines.push("## Interpretation Warnings");
  lines.push("");
  lines.push("- **Ratings are not exploitability.** They reflect performance against the specific suite pool used, not how exploitable a policy is in general.");
  lines.push("- **High RD means uncertain.** A large rating deviation indicates the estimate is based on few games or inconsistent results. Do not treat high-RD ratings as precise.");
  lines.push("- **Do not compare ratings across different suite pools** unless the report says they share a source. Different suites use different matchup compositions and opponent sets.");
  lines.push("- **Ratings are research-local and not product difficulty.** They measure relative policy strength within a fixed benchmark context, not a calibrated difficulty tier for players.");

  return lines.join("\n") + "\n";
}

// ─── Manifest ────────────────────────────────────────────────────────────────

const computeHash = (content: string): string =>
  createHash("sha256").update(content, "utf8").digest("hex");

function buildManifest(
  output: BenchmarkRatingOutput,
  ratingsContent: string,
  reportContent: string
): RatingArtifactManifest {
  return {
    schemaVersion: "benchmark-rating-artifact-v1",
    ratingSchemaVersion: output.ratingSchemaVersion,
    suiteId: output.suiteId,
    sourceRecordsPath: output.sourceRecordsPath,
    sourceRecordCount: output.summary.totalRecords,
    eligibleRecordCount: output.summary.eligibleRecords,
    ignoredRecordCount: output.summary.ignoredRecords,
    generatedFrom: output.suiteId,
    ratingsJsonHash: computeHash(ratingsContent),
    reportMdHash: computeHash(reportContent),
    hiddenInfoSafetyNote: HIDDEN_INFO_SAFETY_NOTE,
  };
}

// ─── Public entry point ──────────────────────────────────────────────────────

export function buildRatingArtifactBundle(
  output: BenchmarkRatingOutput
): RatingArtifactBundle {
  const ratingsContent = buildRatingsJson(output);
  const reportContent = buildReportMarkdown(output);
  const manifest = buildManifest(output, ratingsContent, reportContent);

  return {
    manifestJson: stablePrettyJson(manifest),
    ratingsJson: ratingsContent,
    reportMarkdown: reportContent,
  };
}

// ─── Safety exports ──────────────────────────────────────────────────────────

export { HIDDEN_INFO_HAZARDS };

export function scanRatingArtifactSafety(
  bundle: RatingArtifactBundle
): string[] {
  const combined = [bundle.manifestJson, bundle.ratingsJson, bundle.reportMarkdown].join("\n");
  return scanHiddenInfoSafety(combined);
}

export function sanitizeRatingOutputForTests(output: BenchmarkRatingOutput): BenchmarkRatingOutput {
  return {
    ...output,
    sourceRecordsPath: output.sourceRecordsPath.replace(/\/[^/]*\/latest\/records\.jsonl$/, "/records.jsonl"),
  };
}
