import {
  SIMULATION_EXPORT_JSONL_SCHEMA_VERSION,
  SIMULATION_EXPORT_SCHEMA_VERSION,
  type ParseSimulationExportJsonlResult,
  type SimulationDecisionRow,
  type SimulationExportDataset,
  type SimulationExportJsonlDecisionRecord,
  type SimulationExportJsonlHeaderRecord,
  type SimulationExportValidationIssue,
  type SerializeSimulationExportJsonlOptions,
} from "./exportTypes";
import { validateSimulationExportDataset } from "./exportValidation";

const issue = (code: string, path: string, message: string): SimulationExportValidationIssue => ({
  severity: "error",
  code,
  path,
  message,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const headerFromDataset = (dataset: SimulationExportDataset): SimulationExportJsonlHeaderRecord => ({
  recordType: "dataset_header",
  jsonlSchemaVersion: SIMULATION_EXPORT_JSONL_SCHEMA_VERSION,
  exportSchemaVersion: SIMULATION_EXPORT_SCHEMA_VERSION,
  generatedBy: dataset.generatedBy,
  suiteId: dataset.suiteId,
  seeds: dataset.seeds,
  policiesBySeat: dataset.policiesBySeat,
  rowCount: dataset.rowCount,
  matchCount: dataset.matchCount,
  summary: dataset.summary,
});

const rowRecord = (row: SimulationDecisionRow): SimulationExportJsonlDecisionRecord => ({
  recordType: "decision_row",
  jsonlSchemaVersion: SIMULATION_EXPORT_JSONL_SCHEMA_VERSION,
  row,
});

const datasetFromHeaderAndRows = (
  header: SimulationExportJsonlHeaderRecord,
  rows: readonly SimulationDecisionRow[],
): SimulationExportDataset => ({
  schemaVersion: header.exportSchemaVersion,
  generatedBy: header.generatedBy,
  suiteId: header.suiteId,
  seeds: header.seeds,
  policiesBySeat: header.policiesBySeat,
  rowCount: header.rowCount,
  matchCount: header.matchCount,
  summary: header.summary,
  rows: [...rows],
});

export const serializeSimulationExportDatasetToJsonl = (
  dataset: SimulationExportDataset,
  options: SerializeSimulationExportJsonlOptions = {},
): string => {
  const validate = options.validate ?? true;
  const includeHeader = options.includeHeader ?? true;

  if (validate) {
    const result = validateSimulationExportDataset(dataset);
    if (!result.valid) {
      throw new Error(`Invalid simulation export dataset: ${result.issues.map((entry) => entry.code).join(", ")}`);
    }
  }

  const records = [
    ...(includeHeader ? [headerFromDataset(dataset)] : []),
    ...dataset.rows.map((row) => rowRecord(row)),
  ];

  return records.map((record) => JSON.stringify(record)).join("\n");
};

export const parseSimulationExportDatasetJsonl = (jsonl: string): ParseSimulationExportJsonlResult => {
  const issues: SimulationExportValidationIssue[] = [];
  const rawLines = jsonl.split("\n");
  const lines =
    rawLines.length > 0 && rawLines[rawLines.length - 1] === "" ? rawLines.slice(0, rawLines.length - 1) : rawLines;
  let header: SimulationExportJsonlHeaderRecord | null = null;
  const rows: SimulationDecisionRow[] = [];

  for (const [index, line] of lines.entries()) {
    const path = `line ${index + 1}`;
    if (line.trim() === "") {
      issues.push(issue("blank_jsonl_line", path, "Blank JSONL lines are only allowed as one trailing final line."));
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      issues.push(issue("malformed_json", path, "Line is not valid JSON."));
      continue;
    }

    if (!isRecord(parsed)) {
      issues.push(issue("bad_jsonl_record", path, "JSONL record must be an object."));
      continue;
    }
    if (parsed.jsonlSchemaVersion !== SIMULATION_EXPORT_JSONL_SCHEMA_VERSION) {
      issues.push(issue("bad_jsonl_schema_version", `${path}.jsonlSchemaVersion`, `Expected ${SIMULATION_EXPORT_JSONL_SCHEMA_VERSION}.`));
    }

    if (parsed.recordType === "dataset_header") {
      if (header) {
        issues.push(issue("duplicate_header", path, "Only one dataset_header record is allowed."));
        continue;
      }
      header = parsed as unknown as SimulationExportJsonlHeaderRecord;
      if (header.exportSchemaVersion !== SIMULATION_EXPORT_SCHEMA_VERSION) {
        issues.push(issue("bad_export_schema_version", `${path}.exportSchemaVersion`, `Expected ${SIMULATION_EXPORT_SCHEMA_VERSION}.`));
      }
      continue;
    }

    if (parsed.recordType === "decision_row") {
      if (!isRecord(parsed.row)) {
        issues.push(issue("bad_decision_row_record", `${path}.row`, "decision_row record must contain a row object."));
        continue;
      }
      rows.push(parsed.row as unknown as SimulationDecisionRow);
      continue;
    }

    issues.push(issue("unknown_record_type", `${path}.recordType`, "Unknown JSONL record type."));
  }

  if (!header) {
    issues.push(issue("missing_header", "dataset_header", "JSONL input must include a dataset_header record."));
  }
  if (header && header.rowCount !== rows.length) {
    issues.push(issue("jsonl_row_count_mismatch", "dataset_header.rowCount", "Header rowCount does not match decision_row records."));
  }

  const dataset = header ? datasetFromHeaderAndRows(header, rows) : null;
  if (dataset) {
    issues.push(...validateSimulationExportDataset(dataset).issues);
  }

  return {
    header,
    rows,
    dataset,
    issues,
  };
};
