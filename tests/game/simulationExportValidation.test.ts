import { describe, expect, it } from "vitest";

import {
  buildSimulationExportDataset,
  currentSimulationSmokeSuite,
  parseSimulationExportDatasetJsonl,
  serializeSimulationExportDatasetToJsonl,
  validateSimulationExportDataset,
  type SimulationExportDataset,
} from "@/game/sim";

const cloneDataset = (dataset: SimulationExportDataset): SimulationExportDataset =>
  JSON.parse(JSON.stringify(dataset)) as SimulationExportDataset;

const validDataset = () => buildSimulationExportDataset({ batchInput: { suiteId: currentSimulationSmokeSuite.id } });

const expectInvalidCode = (dataset: SimulationExportDataset, code: string) => {
  const result = validateSimulationExportDataset(dataset);
  expect(result.valid).toBe(false);
  expect(result.issues.map((issue) => issue.code)).toContain(code);
};

describe("simulation export validation and JSONL boundary", () => {
  it("validates the current smoke suite with zero errors", () => {
    const result = validateSimulationExportDataset(validDataset());

    expect(result.valid).toBe(true);
    expect(result.summary.errorCount).toBe(0);
    expect(result.summary.warningCount).toBe(0);
    expect(result.summary.rowCount).toBeGreaterThan(0);
  });

  it("detects structural dataset errors", () => {
    const badSchema = cloneDataset(validDataset());
    badSchema.schemaVersion = "bad-version" as SimulationExportDataset["schemaVersion"];
    expectInvalidCode(badSchema, "bad_schema_version");

    const badRowCount = cloneDataset(validDataset());
    badRowCount.rowCount += 1;
    expectInvalidCode(badRowCount, "row_count_mismatch");

    const duplicateRowId = cloneDataset(validDataset());
    duplicateRowId.rows[1].rowId = duplicateRowId.rows[0].rowId;
    expectInvalidCode(duplicateRowId, "duplicate_row_id");
  });

  it("detects row and action alignment errors", () => {
    const outOfBounds = cloneDataset(validDataset());
    outOfBounds.rows[0].chosenActionIndex = outOfBounds.rows[0].legalActions.length;
    expectInvalidCode(outOfBounds, "chosen_action_index_out_of_bounds");

    const mismatch = cloneDataset(validDataset());
    mismatch.rows[0].chosenAction = mismatch.rows[0].legalActions[1];
    expectInvalidCode(mismatch, "chosen_action_mismatch");

    const malformedActionId = cloneDataset(validDataset());
    malformedActionId.rows[0].legalActions[0].actionId = "play:raw";
    expectInvalidCode(malformedActionId, "bad_action_id");
  });

  it("detects forbidden raw debug keys and raw instance id strings", () => {
    const rawDebug = cloneDataset(validDataset()) as SimulationExportDataset & {
      commandLog?: unknown[];
      finalState?: unknown;
      cardsById?: unknown;
    };
    rawDebug.commandLog = [];
    rawDebug.finalState = {};
    rawDebug.cardsById = {};
    rawDebug.rows[0].legalActions[0].source = {
      cardRef: "seat_a:card:0",
      sourceId: "nr-test",
      kind: "unit",
      abilities: [],
    };
    rawDebug.rows[0].observation.own.cardsInHand[0] = {
      ...rawDebug.rows[0].observation.own.cardsInHand[0],
      instanceId: "seat_b:card:1",
    } as unknown as SimulationExportDataset["rows"][number]["observation"]["own"]["cardsInHand"][number];

    const result = validateSimulationExportDataset(rawDebug);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["forbidden_key", "raw_card_instance_id"]),
    );
  });

  it("detects hidden hand leaks, deck arrays, and prompt target strength without a target", () => {
    const leaked = cloneDataset(validDataset()) as SimulationExportDataset;
    const row = leaked.rows[0] as SimulationExportDataset["rows"][number] & {
      observation: SimulationExportDataset["rows"][number]["observation"] & {
        opponent: SimulationExportDataset["rows"][number]["observation"]["opponent"] & {
          cardsInHand?: unknown[];
          deck?: unknown[];
        };
        own: SimulationExportDataset["rows"][number]["observation"]["own"] & { deck?: unknown[] };
      };
    };
    row.observation.opponent.cardsInHand = [];
    row.observation.opponent.deck = [];
    row.observation.own.deck = [];

    const promptRow = leaked.rows.find((entry) => entry.observation.pendingPrompt);
    expect(promptRow).toBeDefined();
    if (promptRow?.observation.pendingPrompt) {
      promptRow.observation.pendingPrompt.options[0] = {
        ...promptRow.observation.pendingPrompt.options[0],
        targetStrength: 5,
      };
      delete promptRow.observation.pendingPrompt.options[0].target;
    }

    const result = validateSimulationExportDataset(leaked);

    expect(result.valid).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "opponent_hidden_hand",
        "opponent_deck_array",
        "own_deck_array",
        "prompt_strength_without_target",
      ]),
    );
  });

  it("can reject system action datasets", () => {
    const dataset = buildSimulationExportDataset({
      batchInput: { seeds: ["sim-smoke-001"] },
      includeSystemActions: true,
    });
    const allowed = validateSimulationExportDataset(dataset);
    const rejected = validateSimulationExportDataset(dataset, { allowSystemActions: false });

    expect(allowed.valid).toBe(true);
    expect(allowed.summary.systemRowCount).toBeGreaterThan(0);
    expect(rejected.valid).toBe(false);
    expect(rejected.issues.map((issue) => issue.code)).toContain("system_action_disallowed");
  });

  it("serializes deterministic in-memory JSONL with a header and safe lines", () => {
    const dataset = validDataset();
    const first = serializeSimulationExportDatasetToJsonl(dataset);
    const second = serializeSimulationExportDatasetToJsonl(dataset);
    const lines = first.split("\n");

    expect(first).toBe(second);
    expect(lines).toHaveLength(dataset.rows.length + 1);
    expect(lines.every((line) => JSON.parse(line))).toBe(true);
    expect(JSON.parse(lines[0])).toMatchObject({
      recordType: "dataset_header",
      jsonlSchemaVersion: "sim-export-jsonl-v1",
      exportSchemaVersion: "sim-export-v1",
    });
    expect(first).not.toContain("finalState");
    expect(first).not.toContain("commandLog");
    expect(first).not.toContain("cardsById");
    expect(first).not.toContain("\"instanceId\"");
    expect(first).not.toMatch(/seat_[ab]:/);
    expect(first).not.toContain("\"deck\":[");
  });

  it("round-trips valid JSONL into an equivalent dataset", () => {
    const dataset = validDataset();
    const parsed = parseSimulationExportDatasetJsonl(serializeSimulationExportDatasetToJsonl(dataset));

    expect(parsed.issues).toHaveLength(0);
    expect(parsed.header?.rowCount).toBe(dataset.rowCount);
    expect(parsed.rows).toEqual(dataset.rows);
    expect(parsed.dataset?.summary).toEqual(dataset.summary);
  });

  it("returns structured parser issues for malformed JSONL", () => {
    const dataset = validDataset();
    const jsonl = serializeSimulationExportDatasetToJsonl(dataset);
    const lines = jsonl.split("\n");

    expect(parseSimulationExportDatasetJsonl("{").issues.map((entry) => entry.code)).toContain("malformed_json");
    expect(
      parseSimulationExportDatasetJsonl(
        JSON.stringify({ recordType: "mystery", jsonlSchemaVersion: "sim-export-jsonl-v1" }),
      ).issues.map((entry) => entry.code),
    ).toContain("unknown_record_type");
    expect(parseSimulationExportDatasetJsonl(lines.slice(1).join("\n")).issues.map((entry) => entry.code)).toContain(
      "missing_header",
    );

    const header = JSON.parse(lines[0]) as { rowCount: number };
    header.rowCount += 1;
    lines[0] = JSON.stringify(header);
    expect(parseSimulationExportDatasetJsonl(lines.join("\n")).issues.map((entry) => entry.code)).toContain(
      "jsonl_row_count_mismatch",
    );
  });
});
