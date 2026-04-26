import {
  LEGAL_ACTION_SCHEMA_VERSION,
  SAFE_OBSERVATION_SCHEMA_VERSION,
  SIMULATION_EXPORT_SCHEMA_VERSION,
  SIMULATION_REWARD_SCHEMA_VERSION,
  type EncodedLegalAction,
  type SimulationExportDataset,
  type SimulationExportValidationIssue,
  type SimulationExportValidationOptions,
  type SimulationExportValidationResult,
} from "./exportTypes";

const SEAT_IDS = new Set(["seat_a", "seat_b"]);
const ACTOR_KINDS = new Set(["policy", "system"]);
const TERMINAL_REWARDS = new Set([-1, 0, 1, null]);
const FORBIDDEN_KEYS = new Set(["finalState", "commandLog", "cardsById", "instanceId", "moveId", "rawResult", "ownHand", "opponentHand"]);
const RAW_ID_PATTERN = /seat_[ab]:/;
const RAW_ACTION_REF_PATTERN = /^(play|mulligan|leader):/;
const RAW_ACTION_REF_PATH_PATTERN = /\.(actionId|cardRef|promptRef|optionRef)$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringOrNumber = (value: unknown): value is string | number =>
  typeof value === "string" || typeof value === "number";

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

class ValidationCollector {
  readonly issues: SimulationExportValidationIssue[] = [];

  addError(code: string, path: string, message: string) {
    this.issues.push({ severity: "error", code, path, message });
  }

  addWarning(code: string, path: string, message: string) {
    this.issues.push({ severity: "warning", code, path, message });
  }
}

const scanForRedactionIssues = (value: unknown, path: string, collector: ValidationCollector) => {
  if (typeof value === "string") {
    if (RAW_ID_PATTERN.test(value)) {
      collector.addError("raw_card_instance_id", path, "Raw generated card instance ids must not be exported.");
    }
    if (RAW_ACTION_REF_PATH_PATTERN.test(path) && RAW_ACTION_REF_PATTERN.test(value)) {
      collector.addError("raw_engine_action_ref", path, "Raw engine action ids or refs must not be exported.");
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForRedactionIssues(item, `${path}[${index}]`, collector));
    return;
  }

  if (!isRecord(value)) return;

  Object.entries(value).forEach(([key, nested]) => {
    const nestedPath = path ? `${path}.${key}` : key;
    if (FORBIDDEN_KEYS.has(key)) {
      collector.addError("forbidden_key", nestedPath, `Forbidden export key "${key}" must not appear in safe datasets.`);
    }
    if (key === "events" && Array.isArray(nested)) {
      collector.addError("raw_events", nestedPath, "Raw event arrays must not be exported in safe datasets.");
    }
    if (key === "deck" && Array.isArray(nested)) {
      collector.addError("deck_array", nestedPath, "Deck arrays must not be exported; use deckCount only.");
    }
    scanForRedactionIssues(nested, nestedPath, collector);
  });
};

const validateDatasetShape = (dataset: Record<string, unknown>, collector: ValidationCollector) => {
  if (dataset.schemaVersion !== SIMULATION_EXPORT_SCHEMA_VERSION) {
    collector.addError("bad_schema_version", "schemaVersion", `Expected ${SIMULATION_EXPORT_SCHEMA_VERSION}.`);
  }
  if (dataset.generatedBy !== "headless-simulation-export") {
    collector.addError("bad_generated_by", "generatedBy", "Expected headless-simulation-export.");
  }
  if (!Array.isArray(dataset.seeds) || !dataset.seeds.every(isStringOrNumber)) {
    collector.addError("bad_seeds", "seeds", "Expected an array of string or number seeds.");
  }
  if (!isRecord(dataset.policiesBySeat)) {
    collector.addError("bad_policies", "policiesBySeat", "Expected policiesBySeat object.");
  } else {
    const policiesBySeat = dataset.policiesBySeat;
    (["seat_a", "seat_b"] as const).forEach((seatId) => {
      if (typeof policiesBySeat[seatId] !== "string") {
        collector.addError("bad_policy_id", `policiesBySeat.${seatId}`, "Expected a string policy id.");
      }
    });
  }
  if (!Array.isArray(dataset.rows)) {
    collector.addError("bad_rows", "rows", "Expected rows array.");
  }
  if (typeof dataset.rowCount !== "number" || dataset.rowCount < 0) {
    collector.addError("bad_row_count", "rowCount", "Expected non-negative rowCount.");
  }
  if (typeof dataset.matchCount !== "number" || dataset.matchCount < 0) {
    collector.addError("bad_match_count", "matchCount", "Expected non-negative matchCount.");
  }
};

const validateSummary = (dataset: Record<string, unknown>, rows: readonly unknown[], collector: ValidationCollector) => {
  const summary = dataset.summary;
  if (!isRecord(summary)) {
    collector.addError("bad_summary", "summary", "Expected summary object.");
    return;
  }
  if (summary.schemaVersion !== SIMULATION_EXPORT_SCHEMA_VERSION) {
    collector.addError("bad_summary_schema_version", "summary.schemaVersion", `Expected ${SIMULATION_EXPORT_SCHEMA_VERSION}.`);
  }
  if (summary.rowCount !== rows.length) {
    collector.addError("summary_row_count_mismatch", "summary.rowCount", "Expected summary rowCount to match rows.length.");
  }
  if (summary.matchCount !== dataset.matchCount) {
    collector.addError("summary_match_count_mismatch", "summary.matchCount", "Expected summary matchCount to match dataset matchCount.");
  }
  const policyRows = typeof summary.policyRowCount === "number" ? summary.policyRowCount : NaN;
  const systemRows = typeof summary.systemRowCount === "number" ? summary.systemRowCount : NaN;
  if (policyRows + systemRows !== rows.length) {
    collector.addError("summary_row_kind_count_mismatch", "summary", "Expected policyRowCount + systemRowCount to match rows.length.");
  }
};

const validateObservation = (row: Record<string, unknown>, path: string, collector: ValidationCollector) => {
  const observation = row.observation;
  if (!isRecord(observation)) {
    collector.addError("bad_observation", `${path}.observation`, "Expected observation object.");
    return;
  }
  if (observation.schemaVersion !== SAFE_OBSERVATION_SCHEMA_VERSION) {
    collector.addError("bad_observation_schema_version", `${path}.observation.schemaVersion`, `Expected ${SAFE_OBSERVATION_SCHEMA_VERSION}.`);
  }
  const opponent = observation.opponent;
  if (isRecord(opponent)) {
    if ("cardsInHand" in opponent) {
      collector.addError("opponent_hidden_hand", `${path}.observation.opponent.cardsInHand`, "Opponent hand cards must not be exported.");
    }
    if (Array.isArray(opponent.deck)) {
      collector.addError("opponent_deck_array", `${path}.observation.opponent.deck`, "Opponent deck arrays must not be exported.");
    }
  }
  const own = observation.own;
  if (isRecord(own) && Array.isArray(own.deck)) {
    collector.addError("own_deck_array", `${path}.observation.own.deck`, "Own deck arrays must not be exported.");
  }
  const prompt = observation.pendingPrompt;
  if (isRecord(prompt) && Array.isArray(prompt.options)) {
    prompt.options.forEach((option, optionIndex) => {
      if (isRecord(option) && "targetStrength" in option && !("target" in option)) {
        collector.addError(
          "prompt_strength_without_target",
          `${path}.observation.pendingPrompt.options[${optionIndex}].targetStrength`,
          "Prompt targetStrength may only be exported with a visible prompt target.",
        );
      }
    });
  }
};

const validateActionRefs = (action: EncodedLegalAction, path: string, collector: ValidationCollector) => {
  (["source", "target", "prompt"] as const).forEach((key) => {
    if (key in action) {
      scanForRedactionIssues(action[key], `${path}.${key}`, collector);
    }
  });
};

const validateRow = (
  row: unknown,
  index: number,
  options: Required<SimulationExportValidationOptions>,
  collector: ValidationCollector,
) => {
  const path = `rows[${index}]`;
  if (!isRecord(row)) {
    collector.addError("bad_row", path, "Expected decision row object.");
    return null;
  }

  if (row.schemaVersion !== SIMULATION_EXPORT_SCHEMA_VERSION) {
    collector.addError("bad_row_schema_version", `${path}.schemaVersion`, `Expected ${SIMULATION_EXPORT_SCHEMA_VERSION}.`);
  }
  ["rowId", "matchId", "policyId"].forEach((key) => {
    if (typeof row[key] !== "string") collector.addError("bad_row_scalar", `${path}.${key}`, "Expected string.");
  });
  if (!isStringOrNumber(row.seed)) collector.addError("bad_row_seed", `${path}.seed`, "Expected string or number seed.");
  ["step", "commandIndex"].forEach((key) => {
    if (typeof row[key] !== "number") collector.addError("bad_row_scalar", `${path}.${key}`, "Expected number.");
  });
  if (typeof row.actorKind !== "string" || !ACTOR_KINDS.has(row.actorKind)) {
    collector.addError("bad_actor_kind", `${path}.actorKind`, "Expected policy or system.");
  }
  if (typeof row.seatId !== "string" || !SEAT_IDS.has(row.seatId)) {
    collector.addError("bad_seat_id", `${path}.seatId`, "Expected seat_a or seat_b.");
  }

  validateObservation(row, path, collector);

  const legalActions = row.legalActions;
  if (!Array.isArray(legalActions)) {
    collector.addError("bad_legal_actions", `${path}.legalActions`, "Expected legalActions array.");
    return row;
  }
  if (row.legalActionCount !== legalActions.length) {
    collector.addError("legal_action_count_mismatch", `${path}.legalActionCount`, "Expected legalActionCount to match legalActions.length.");
  }
  if (!Array.isArray(row.legalActionMask) || row.legalActionMask.length !== legalActions.length) {
    collector.addError("legal_action_mask_mismatch", `${path}.legalActionMask`, "Expected legalActionMask length to match legalActions.length.");
  } else if (!row.legalActionMask.every((entry) => entry === true)) {
    collector.addError("bad_legal_action_mask", `${path}.legalActionMask`, "Expected all legal action mask values to be true.");
  }

  legalActions.forEach((action, actionIndex) => {
    const actionPath = `${path}.legalActions[${actionIndex}]`;
    if (!isRecord(action)) {
      collector.addError("bad_legal_action", actionPath, "Expected legal action object.");
      return;
    }
    if (action.schemaVersion !== LEGAL_ACTION_SCHEMA_VERSION) {
      collector.addError("bad_action_schema_version", `${actionPath}.schemaVersion`, `Expected ${LEGAL_ACTION_SCHEMA_VERSION}.`);
    }
    if (action.actionIndex !== actionIndex) {
      collector.addError("action_index_mismatch", `${actionPath}.actionIndex`, "Expected actionIndex to match array index.");
    }
    if (action.actionId !== `action_${actionIndex}`) {
      collector.addError("bad_action_id", `${actionPath}.actionId`, "Expected row-local action id action_<index>.");
    }
    validateActionRefs(action as unknown as EncodedLegalAction, actionPath, collector);
  });

  const chosenActionIndex = row.chosenActionIndex;
  if (
    typeof chosenActionIndex !== "number" ||
    !Number.isInteger(chosenActionIndex) ||
    chosenActionIndex < 0 ||
    chosenActionIndex >= legalActions.length
  ) {
    collector.addError("chosen_action_index_out_of_bounds", `${path}.chosenActionIndex`, "Expected chosenActionIndex inside legal action bounds.");
  } else {
    const legalActionIndex = chosenActionIndex as number;
    if (stableStringify(row.chosenAction) !== stableStringify(legalActions[legalActionIndex])) {
      collector.addError("chosen_action_mismatch", `${path}.chosenAction`, "Expected chosenAction to equal legalActions[chosenActionIndex].");
    }
  }

  const chosenAction = isRecord(row.chosenAction) ? row.chosenAction : null;
  if (!options.allowSystemActions && (row.actorKind === "system" || chosenAction?.kind === "resolve_round_end")) {
    collector.addError("system_action_disallowed", path, "System action rows are not allowed by validation options.");
  }

  const reward = row.reward;
  if (!isRecord(reward)) {
    collector.addError("bad_reward", `${path}.reward`, "Expected reward object.");
  } else {
    if (reward.schemaVersion !== SIMULATION_REWARD_SCHEMA_VERSION) {
      collector.addError("bad_reward_schema_version", `${path}.reward.schemaVersion`, `Expected ${SIMULATION_REWARD_SCHEMA_VERSION}.`);
    }
    if (!TERMINAL_REWARDS.has(reward.terminalMatchReward as -1 | 0 | 1 | null)) {
      collector.addError("bad_terminal_reward", `${path}.reward.terminalMatchReward`, "Expected -1, 0, 1, or null.");
    }
    if (typeof reward.isTerminalMatchRow !== "boolean") {
      collector.addError("bad_terminal_row_flag", `${path}.reward.isTerminalMatchRow`, "Expected boolean.");
    }
  }

  const outcome = row.outcome;
  if (!isRecord(outcome)) {
    collector.addError("bad_outcome", `${path}.outcome`, "Expected outcome object.");
  } else {
    if (typeof outcome.status !== "string") collector.addError("bad_outcome_status", `${path}.outcome.status`, "Expected status string.");
    if (!isRecord(outcome.finalGems)) {
      collector.addError("bad_final_gems", `${path}.outcome.finalGems`, "Expected final gem counts.");
    } else {
      const finalGems = outcome.finalGems;
      (["seat_a", "seat_b"] as const).forEach((seatId) => {
        if (typeof finalGems[seatId] !== "number") {
          collector.addError("bad_final_gem_count", `${path}.outcome.finalGems.${seatId}`, "Expected numeric gem count.");
        }
      });
    }
  }

  return row;
};

export const validateSimulationExportDataset = (
  value: unknown,
  options: SimulationExportValidationOptions = {},
): SimulationExportValidationResult => {
  const normalizedOptions: Required<SimulationExportValidationOptions> = {
    allowSystemActions: options.allowSystemActions ?? true,
    requireNoWarnings: options.requireNoWarnings ?? false,
  };
  const collector = new ValidationCollector();

  if (!isRecord(value)) {
    collector.addError("bad_dataset", "$", "Expected simulation export dataset object.");
    const errorCount = collector.issues.filter((issue) => issue.severity === "error").length;
    return {
      valid: false,
      issues: collector.issues,
      summary: { errorCount, warningCount: 0, rowCount: 0, matchCount: 0, systemRowCount: 0 },
    };
  }

  validateDatasetShape(value, collector);
  const rows = Array.isArray(value.rows) ? value.rows : [];
  if (value.rowCount !== rows.length) {
    collector.addError("row_count_mismatch", "rowCount", "Expected rowCount to match rows.length.");
  }
  validateSummary(value, rows, collector);

  const rowIds = new Set<string>();
  rows.forEach((row, index) => {
    const validated = validateRow(row, index, normalizedOptions, collector);
    if (!validated || typeof validated.rowId !== "string") return;
    if (rowIds.has(validated.rowId)) {
      collector.addError("duplicate_row_id", `rows[${index}].rowId`, "Row ids must be unique.");
    }
    rowIds.add(validated.rowId);
  });

  scanForRedactionIssues(value, "$", collector);

  const errorCount = collector.issues.filter((issue) => issue.severity === "error").length;
  const warningCount = collector.issues.filter((issue) => issue.severity === "warning").length;
  const systemRowCount = rows.filter((row) => isRecord(row) && row.actorKind === "system").length;

  return {
    valid: errorCount === 0 && (!normalizedOptions.requireNoWarnings || warningCount === 0),
    issues: collector.issues,
    summary: {
      errorCount,
      warningCount,
      rowCount: rows.length,
      matchCount: typeof value.matchCount === "number" ? value.matchCount : 0,
      systemRowCount,
    },
  };
};

export const assertValidSimulationExportDataset = (
  value: unknown,
  options?: SimulationExportValidationOptions,
): asserts value is SimulationExportDataset => {
  const result = validateSimulationExportDataset(value, options);
  if (!result.valid) {
    const codes = result.issues.map((issue) => issue.code).join(", ");
    throw new Error(`Invalid simulation export dataset: ${codes}`);
  }
};
